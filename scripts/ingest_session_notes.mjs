#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const inbox = path.join(root, "sessions", "inbox");
const reports = path.join(root, "sessions", "reports");
const archive = path.join(root, "sessions", "archive");
const templateLedger = path.join(root, "memory", "uncle-yev-ledger.md");
const ledger = process.env.UNCLE_YEV_LEDGER
  ? path.resolve(process.env.UNCLE_YEV_LEDGER)
  : path.join(root, "memory", "uncle-yev-ledger.local.md");

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

function readInput(file) {
  const raw = fs.readFileSync(path.join(inbox, file), "utf8");
  if (file.endsWith(".json")) {
    const parsed = JSON.parse(raw);
    return { title: parsed.title || file, text: parsed.transcript || parsed.notes || "", source: "json" };
  }
  return { title: file.replace(/\.[^.]+$/, ""), text: raw, source: file.endsWith(".md") ? "markdown" : "text" };
}

function extractHooks(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\b(npc|quest|loot|secret|promise|map|scene|damage|dead|deal|betray|funny|todo|hook)\b/i.test(line))
    .slice(0, 40);
}

function renderReport(input) {
  const hooks = extractHooks(input.text);
  const lastLines = input.text.split(/\r?\n/).filter(Boolean).slice(-30);
  return [
    `# Session Report: ${input.title}`,
    "",
    `Source: ${input.source}`,
    "",
    "## Detected Hooks",
    ...(hooks.length ? hooks.map((hook) => `- ${hook}`) : ["- No explicit hooks detected."]),
    "",
    "## Last Lines",
    ...lastLines.map((line) => `> ${line}`),
    "",
    "## Uncle Yev Follow-Up",
    "- Convert durable facts into the ledger.",
    "- Update NPC plans and faction clocks.",
    "- Add one least-expected future callback.",
    "",
  ].join("\n");
}

function ensureLedger() {
  fs.mkdirSync(path.dirname(ledger), { recursive: true });
  if (fs.existsSync(ledger)) return;
  if (fs.existsSync(templateLedger)) fs.copyFileSync(templateLedger, ledger);
  else fs.writeFileSync(ledger, "# Uncle Yev Ledger\n");
}

fs.mkdirSync(inbox, { recursive: true });
fs.mkdirSync(reports, { recursive: true });
fs.mkdirSync(archive, { recursive: true });
ensureLedger();

const files = fs.readdirSync(inbox).filter((file) => [".txt", ".md", ".json"].includes(path.extname(file))).sort();
if (!files.length) {
  console.log("No session notes in sessions/inbox.");
  process.exit(0);
}

for (const file of files) {
  const input = readInput(file);
  const reportName = `${new Date().toISOString().slice(0, 10)}-${slug(input.title)}.md`;
  const reportPath = path.join(reports, reportName);
  fs.writeFileSync(reportPath, renderReport(input));
  fs.appendFileSync(ledger, `\n## Session Intake: ${input.title}\n\nReport: sessions/reports/${reportName}\n\nReview required.\n`);
  fs.renameSync(path.join(inbox, file), path.join(archive, `${Date.now()}-${file}`));
  console.log(`Processed ${file} -> sessions/reports/${reportName}`);
}
