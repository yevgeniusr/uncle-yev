import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const defaultCampaignRoot = path.resolve(rootDir, "..", "campaigns", "the-unwritten-degree");
const campaignRoot = path.resolve(process.env.FOUNDRY_CAMPAIGN_ROOT || defaultCampaignRoot);
const foundryRawDir = path.join(campaignRoot, "raw", "foundry");
const inboxDir = path.join(foundryRawDir, "live-inbox");
const reportsDir = path.join(foundryRawDir, "session-reports");
const archiveDir = path.join(foundryRawDir, "transcripts");

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function readInboxFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath, "utf8");

  if (ext === ".json") {
    const parsed = JSON.parse(raw);
    return {
      title: parsed.title || path.basename(filePath, ext),
      transcript: parsed.transcript || parsed.notes || "",
      sourceType: parsed.recording ? "recording-metadata" : "json-notes",
      recording: parsed.recording,
    };
  }

  return {
    title: path.basename(filePath, ext),
    transcript: raw,
    sourceType: ext === ".md" ? "markdown-transcript" : "text-transcript",
  };
}

function extractHooks(transcript) {
  const lines = transcript
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const hookPattern = /\b(npc|quest|faction|scene|map|journal|todo|follow[- ]?up|secret|loot|condition|damage)\b/i;
  return lines.filter((line) => hookPattern.test(line)).slice(0, 30);
}

function renderReport({ title, transcript, sourceType, recording }) {
  const hooks = extractHooks(transcript);
  const excerpt = transcript.split(/\r?\n/).filter(Boolean).slice(-20);

  return [
    `# Session Report: ${title}`,
    "",
    `Source: ${sourceType}`,
    recording ? `Recording: ${recording}` : "",
    "",
    "## Detected Follow-Up Hooks",
    ...(hooks.length ? hooks.map((line) => `- ${line}`) : ["- No explicit hooks detected."]),
    "",
    "## Last Transcript Lines",
    ...excerpt.map((line) => `> ${line}`),
    "",
    "## DM Follow-Up Queue",
    "- Review detected hooks.",
    "- Convert durable changes into the campaign repo raw Foundry JSON or wiki pages.",
    "- Run `npm run prep:foundry` from uncle-yev and seed updated journals in Foundry.",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

fs.mkdirSync(inboxDir, { recursive: true });
fs.mkdirSync(reportsDir, { recursive: true });
fs.mkdirSync(archiveDir, { recursive: true });

const inboxFiles = fs
  .readdirSync(inboxDir)
  .filter((file) => [".txt", ".md", ".json"].includes(path.extname(file).toLowerCase()))
  .sort();

if (inboxFiles.length === 0) {
  console.log("No session inbox files to process.");
  process.exit(0);
}

for (const file of inboxFiles) {
  const filePath = path.join(inboxDir, file);
  const parsed = readInboxFile(filePath);
  const reportName = `${new Date().toISOString().slice(0, 10)}-${slugify(parsed.title)}.md`;
  const reportPath = path.join(reportsDir, reportName);
  const archivePath = path.join(archiveDir, `${Date.now()}-${file}`);

  fs.writeFileSync(reportPath, renderReport(parsed));
  fs.renameSync(filePath, archivePath);

  console.log(`Processed ${file} -> ${path.relative(campaignRoot, reportPath)}`);
}
