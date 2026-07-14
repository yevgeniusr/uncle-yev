import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

test("self-improvement skill publishes only safe draft proposals", () => {
  const skill = read("skills/self-improving/SKILL.md");

  assert.match(skill, /user feedback|correction/i);
  assert.match(skill, /evidence|reproduc/i);
  assert.match(skill, /deduplic|existing (issues|pull requests)/i);
  assert.match(skill, /draft pull request/i);
  assert.match(skill, /never merge/i);
  assert.match(skill, /private campaign|secret/i);
  assert.match(skill, /immediate task/i);
});

test("agent entrypoints proactively route reusable feedback to self-improvement", () => {
  const agents = read("AGENTS.md");
  const claude = read("CLAUDE.md");
  const readme = read("README.md");

  assert.match(agents, /Self-Improvement Loop/);
  assert.match(agents, /skills\/self-improving\/SKILL\.md/);
  assert.match(agents, /correction|feedback/i);
  assert.match(claude, /skills\/self-improving\/SKILL\.md/);
  assert.match(readme, /`self-improving`/);
});
