#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { FOUNDRY_URL, getAdminPassword, loadPlaywright } from "./foundry_live_control.mjs";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const defaultCampaignRoot = path.resolve(rootDir, "..", "campaigns", "the-unwritten-degree");
const campaignRoot = path.resolve(process.env.FOUNDRY_CAMPAIGN_ROOT || defaultCampaignRoot);
const assetsRoot = path.join(campaignRoot, "raw", "assets");
const reportPath = path.join(campaignRoot, "raw", "foundry", "upload-report.json");
const targetSlug = process.env.FOUNDRY_ASSET_TARGET || path.basename(campaignRoot);
const liveUser = process.env.FOUNDRY_LIVE_USER || "Codex DM";

function listPngAssets() {
  return ["maps", "portraits"].flatMap((kind) => {
    const dirPath = path.join(assetsRoot, kind);
    if (!fs.existsSync(dirPath)) return [];
    return fs
      .readdirSync(dirPath)
      .filter((file) => file.toLowerCase().endsWith(".png"))
      .sort()
      .map((name) => ({ kind, name, filePath: path.join(dirPath, name) }));
  });
}

async function joinAsGm(page, password) {
  await page.goto(`${FOUNDRY_URL}/join`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForSelector('button[name="join"], button:has-text("JOIN GAME SESSION")', { timeout: 60000 });
  await page.waitForTimeout(1000);

  const userSelect = page.locator('select[name="userid"]').first();
  if (await userSelect.count()) {
    await userSelect.selectOption({ label: liveUser }).catch(async () => {
      await userSelect.selectOption({ label: "Gamemaster" });
    });
  } else {
    await page.locator(`text=${liveUser}`).click().catch(() => {});
  }

  if (await page.locator('input[name="password"]').count()) {
    await page.locator('input[name="password"]').fill(password);
  }
  if (await page.locator('input[name="adminPassword"]').count()) {
    await page.locator('input[name="adminPassword"]').fill("");
  }

  await page.locator('button[name="join"], button:has-text("JOIN GAME SESSION")').first().click();
  await page.waitForURL(/\/game/, { timeout: 60000 }).catch(() => {});

  const started = Date.now();
  let lastState = {};
  while (Date.now() - started < 120000) {
    lastState = await page
      .evaluate(() => ({
        isGM: Boolean(globalThis.game?.user?.isGM),
        filePicker: typeof globalThis.FilePicker === "function",
        worldId: globalThis.game?.world?.id,
        worldTitle: globalThis.game?.world?.title,
        ready: Boolean(globalThis.game?.ready),
        url: location.href,
        user: globalThis.game?.user?.name,
      }))
      .catch((error) => ({ error: error instanceof Error ? error.message : String(error) }));
    if (lastState.isGM && lastState.filePicker && lastState.worldId) return lastState;
    await page.waitForTimeout(1000);
  }
  throw new Error(`Timed out waiting for GM file upload capability: ${JSON.stringify(lastState)}`);
}

async function uploadAsset(page, asset) {
  const payload = {
    kind: asset.kind,
    name: asset.name,
    type: "image/png",
    base64: fs.readFileSync(asset.filePath).toString("base64"),
    targetSlug,
  };

  return page.evaluate(async ({ payload }) => {
    const base = `worlds/${game.world.id}/assets/${payload.targetSlug}`;
    const target = `${base}/${payload.kind}`;
    await FilePicker.createDirectory("data", `worlds/${game.world.id}/assets`, { notify: false }).catch(() => {});
    await FilePicker.createDirectory("data", base, { notify: false }).catch(() => {});
    await FilePicker.createDirectory("data", target, { notify: false }).catch(() => {});

    const bytes = Uint8Array.from(atob(payload.base64), (character) => character.charCodeAt(0));
    const file = new File([bytes], payload.name, { type: payload.type });
    const response = await FilePicker.upload("data", target, file, {}, { notify: false });
    return { kind: payload.kind, name: payload.name, path: response?.path || `${target}/${payload.name}` };
  }, { payload });
}

async function verifyUpload(page) {
  return page.evaluate(async ({ targetSlug }) => {
    const base = `worlds/${game.world.id}/assets/${targetSlug}`;
    const maps = await FilePicker.browse("data", `${base}/maps`).catch((error) => ({ error: String(error), files: [] }));
    const portraits = await FilePicker.browse("data", `${base}/portraits`).catch((error) => ({
      error: String(error),
      files: [],
    }));
    return {
      worldId: game.world.id,
      worldTitle: game.world.title,
      base,
      maps: maps.files ?? [],
      portraits: portraits.files ?? [],
    };
  }, { targetSlug });
}

export async function main() {
  const assets = listPngAssets();
  if (!assets.length) throw new Error(`No PNG assets found under ${assetsRoot}`);

  const password = await getAdminPassword();
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  try {
    const joined = await joinAsGm(page, password);
    const uploaded = [];
    for (const asset of assets) {
      const result = await uploadAsset(page, asset);
      uploaded.push(result);
      console.log(`uploaded ${result.path}`);
    }
    const verified = await verifyUpload(page);
    const report = {
      uploadedAt: new Date().toISOString(),
      foundryUrl: FOUNDRY_URL,
      campaignRoot,
      targetSlug,
      joined,
      worldId: verified.worldId,
      worldTitle: verified.worldTitle,
      base: verified.base,
      uploaded,
      verifiedCounts: {
        maps: verified.maps.length,
        portraits: verified.portraits.length,
      },
    };
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({
      worldId: report.worldId,
      worldTitle: report.worldTitle,
      base: report.base,
      uploaded: uploaded.length,
      verifiedCounts: report.verifiedCounts,
      reportPath,
    }, null, 2));
  } finally {
    await browser.close().catch(() => {});
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
