#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";

import {
  getAdminPassword,
  joinWorld,
  loadPlaywright,
  MODULE_ID,
  parseArgs,
} from "./foundry_live_control.mjs";

const DEFAULT_INTERVAL_SECONDS = 5;
const DEFAULT_PLAYER_SPEAKERS = splitCsv(process.env.FOUNDRY_PLAYER_SPEAKERS, []);
const DEFAULT_IGNORED_SPEAKERS = [
  "Codex DM",
  "Codex Watcher",
  "Gamemaster",
  "Foundry Virtual Tabletop",
  ...splitCsv(process.env.FOUNDRY_IGNORED_SPEAKERS, []),
];

function splitCsv(value, fallback = []) {
  if (!value || value === true) return fallback;
  return String(value)
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function writeJson(filePath, value) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function appendJsonLine(filePath, value) {
  ensureDir(filePath);
  fs.appendFileSync(filePath, `${JSON.stringify(value)}\n`);
}

function writePendingMarkdown(filePath, event) {
  ensureDir(filePath);
  fs.writeFileSync(filePath, `# Pending Foundry Chat

- Received: ${event.receivedAt}
- Scene: ${event.sceneName ?? "unknown"}
- Speaker: ${event.speaker}
- Message id: ${event.id}

${event.text}

## Reply

Use one of:

\`\`\`bash
npm run live:say -- --message "<p>...</p>"
npm run live:npc -- --actor "NPC Name" --message "<p>...</p>"
\`\`\`
`);
}

async function readSnapshot(page) {
  return await page.evaluate(async ({ moduleId }) => {
    const live = game.modules.get(moduleId)?.api?.live;
    if (!live) throw new Error(`Live bridge API is not active for ${moduleId}.`);
    return await live.getLiveSnapshot();
  }, { moduleId: MODULE_ID });
}

function buildEvent(message, snapshot) {
  return {
    receivedAt: new Date().toISOString(),
    id: message.id,
    speaker: message.speaker ?? "Unknown",
    text: stripHtml(message.content),
    contentHtml: message.content,
    timestamp: message.timestamp,
    sceneName: snapshot.scene?.name,
    activeUsers: snapshot.users?.filter((user) => user.active).map((user) => user.name) ?? [],
  };
}

function shouldHandleMessage(message, options) {
  const speaker = message.speaker ?? "";
  if (!message.id || !speaker) return false;
  if (options.ignoredSpeakers.has(speaker)) return false;
  if (options.playerSpeakers.size > 0) return options.playerSpeakers.has(speaker);
  return true;
}

function printEvent(event) {
  console.log(`[${event.receivedAt}] ${event.speaker}: ${event.text}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const intervalMs = Math.max(1, Number(args.interval ?? DEFAULT_INTERVAL_SECONDS)) * 1000;
  const outDir = path.resolve(String(args.out ?? "var/live-session"));
  const eventLogPath = path.resolve(String(args.log ?? path.join(outDir, "chat-events.ndjson")));
  const statePath = path.resolve(String(args.state ?? path.join(outDir, "live-watch-state.json")));
  const pendingPath = path.resolve(String(args.pending ?? path.join(outDir, "pending-dm.md")));
  const playerSpeakers = new Set(splitCsv(args["player-speakers"], DEFAULT_PLAYER_SPEAKERS));
  const ignoredSpeakers = new Set(splitCsv(args["ignore-speakers"], DEFAULT_IGNORED_SPEAKERS));
  const includeExisting = Boolean(args["include-existing"]);
  const once = Boolean(args.once);

  const password = await getAdminPassword();
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const seen = new Set();

  let stopping = false;
  const stop = (signal) => {
    console.log(`Live Foundry chat watcher received ${signal}; stopping.`);
    stopping = true;
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGHUP", () => stop("SIGHUP"));

  try {
    console.log("Starting live Foundry chat watcher.");
    console.log("Loading browser and joining the world...");
    await joinWorld(page, password, undefined, { requireGM: false });
    console.log(`Live Foundry chat watcher started. Polling every ${intervalMs / 1000}s.`);
    console.log(`Player speakers: ${Array.from(playerSpeakers).join(", ") || "(any non-ignored speaker)"}`);
    console.log(`Event log: ${eventLogPath}`);

    const initial = await readSnapshot(page);
    for (const message of initial.recentChat ?? []) {
      if (!includeExisting) seen.add(message.id);
    }

    let pollCount = 0;
    do {
      pollCount += 1;
      if (pollCount === 1 || pollCount % 15 === 0) {
        console.log(`Watcher poll ${pollCount} at ${new Date().toISOString()}.`);
      }
      const snapshot = includeExisting && seen.size === 0 ? initial : await readSnapshot(page);
      const messages = snapshot.recentChat ?? [];
      for (const message of messages) {
        if (seen.has(message.id)) continue;
        seen.add(message.id);
        if (!shouldHandleMessage(message, { playerSpeakers, ignoredSpeakers })) continue;

        const event = buildEvent(message, snapshot);
        appendJsonLine(eventLogPath, event);
        writeJson(statePath, { lastHandledAt: event.receivedAt, lastMessageId: event.id, lastSpeaker: event.speaker });
        writePendingMarkdown(pendingPath, event);
        printEvent(event);
      }

      if (once) break;
      await delay(intervalMs);
    } while (!stopping);
    console.log("Live Foundry chat watcher loop ended.");
  } finally {
    console.log("Closing live Foundry chat watcher browser.");
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
