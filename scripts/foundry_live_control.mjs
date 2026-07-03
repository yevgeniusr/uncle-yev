#!/usr/bin/env node
import fs from "node:fs";
import { createRequire } from "node:module";
import process from "node:process";

const FOUNDRY_URL = process.env.FOUNDRY_URL || "http://localhost:30000";
const MODULE_ID = process.env.FOUNDRY_LIVE_MODULE || "foundrycapital";
const LIVE_USER = process.env.FOUNDRY_LIVE_USER || "Codex DM";

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) args[key] = true;
    else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const fallback = "/tmp/foundry-pw/package.json";
    if (fs.existsSync(fallback)) return createRequire(fallback)("playwright");
    throw new Error("Playwright is required. Install it locally or provide /tmp/foundry-pw.");
  }
}

async function joinWorld(page, password) {
  await page.goto(`${FOUNDRY_URL}/join`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1500);

  if (page.url().includes("/auth")) {
    await page.locator('input[name="adminPassword"], input[type="password"]').first().fill(password);
    await page.locator("form").evaluate((form) => form.requestSubmit());
    await page.waitForTimeout(3000);
  }

  if (page.url().includes("/join")) {
    const select = page.locator('select[name="userid"]').first();
    if (await select.count()) {
      await select.evaluate((element, userName) => {
        const option = Array.from(element.options).find((candidate) => candidate.textContent?.trim() === userName)
          || Array.from(element.options).find((candidate) => /Gamemaster/i.test(candidate.textContent || ""));
        if (option) {
          option.disabled = false;
          element.value = option.value;
          element.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }, LIVE_USER);
    }
    if (await page.locator('input[name="password"]').count()) await page.locator('input[name="password"]').fill(password);
    if (await page.locator('input[name="adminPassword"]').count()) await page.locator('input[name="adminPassword"]').fill("");
    await page.locator('button[name="join"], button:has-text("JOIN GAME SESSION")').first().click();
  }

  await page.waitForFunction(() => globalThis.game?.ready && globalThis.game?.user?.isGM, null, { timeout: 90000 });
}

function commandExpression(command) {
  switch (command) {
    case "snapshot": return "live.getLiveSnapshot()";
    case "say": return "live.sayAsGM(args.message || args.content, { alias: args.alias, whisperToGm: Boolean(args.whisper) })";
    case "npc": return "live.sayAsNpc(args.actor, args.message || args.content, { whisperToGm: Boolean(args.whisper) })";
    case "scene": return "live.setScene(args.name)";
    case "move": return "live.moveToken(args.token, Number(args.x), Number(args.y), args.scene)";
    case "hide": return "live.setTokenHidden(args.token, args.hidden !== 'false', args.scene)";
    case "damage": return "live.applyDamage(args.actor, Number(args.amount))";
    case "condition": return "live.toggleCondition(args.token, args.condition)";
    default: throw new Error(`Unknown command: ${command}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "snapshot";
  const password = process.env.FOUNDRY_ADMIN || process.env.FOUNDRY_PASSWORD;
  if (!password) throw new Error("Set FOUNDRY_ADMIN or FOUNDRY_PASSWORD.");

  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    await joinWorld(page, password);
    const result = await page.evaluate(async ({ moduleId, expression, args }) => {
      const live = game.modules.get(moduleId)?.api?.live;
      if (!live) throw new Error(`No live API found at game.modules.get("${moduleId}").api.live`);
      return await Function("live", "args", `return ${expression};`)(live, args);
    }, { moduleId: MODULE_ID, expression: commandExpression(command), args });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
