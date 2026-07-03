#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const templateLedger = path.join(root, "memory", "uncle-yev-ledger.md");
const ledger = process.env.UNCLE_YEV_LEDGER
  ? path.resolve(process.env.UNCLE_YEV_LEDGER)
  : path.join(root, "memory", "uncle-yev-ledger.local.md");
const text = process.argv.slice(2).join(" ").trim();

if (!text) {
  console.error("Usage: node scripts/append_memory.mjs \"memory text\"");
  process.exit(1);
}

fs.mkdirSync(path.dirname(ledger), { recursive: true });
if (!fs.existsSync(ledger)) {
  if (fs.existsSync(templateLedger)) fs.copyFileSync(templateLedger, ledger);
  else fs.writeFileSync(ledger, "# Uncle Yev Ledger\n");
}
fs.appendFileSync(ledger, `\n## Memory ${new Date().toISOString()}\n\n${text}\n`);
console.log(`Appended memory to ${path.relative(root, ledger)}`);
