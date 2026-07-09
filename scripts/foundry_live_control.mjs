#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import process from "node:process";
import { pathToFileURL } from "node:url";

export const FOUNDRY_URL = process.env.FOUNDRY_URL || "https://rpg.rachkovan.com";
export const SERVICE_UUID = process.env.COOLIFY_FOUNDRY_SERVICE_UUID || "d0gw8sos8c8sssgwk8wcosk8";
export const MODULE_ID = process.env.FOUNDRY_LIVE_MODULE || "foundrycapital";
export const LIVE_USER = process.env.FOUNDRY_LIVE_USER || "Codex DM";
const LIVE_DEBUG = Boolean(process.env.FOUNDRY_LIVE_DEBUG);

function debug(message) {
  if (LIVE_DEBUG) console.error(`[foundry-live] ${message}`);
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
}

export async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const fallbackPackage = "/tmp/foundry-pw/package.json";
    if (fs.existsSync(fallbackPackage)) {
      const require = createRequire(fallbackPackage);
      return require("playwright");
    }
    throw new Error("Playwright is required. Run `npm install` in this module or install Playwright in /tmp/foundry-pw.");
  }
}

export async function getAdminPassword() {
  if (process.env.FOUNDRY_ADMIN) return process.env.FOUNDRY_ADMIN;

  const configPath = path.join(process.env.HOME || "", ".config", "coolify", "config.json");
  if (!fs.existsSync(configPath)) {
    throw new Error("Cannot find Coolify config. Set FOUNDRY_ADMIN in the environment.");
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const instance = config.instances?.find((candidate) => candidate.name === "qed")
    || config.instances?.find((candidate) => candidate.default)
    || config.instances?.[0];
  if (!instance?.fqdn || !instance?.token) {
    throw new Error("Coolify config does not contain an API endpoint and token.");
  }

  const response = await fetch(`${instance.fqdn.replace(/\/$/, "")}/api/v1/services/${SERVICE_UUID}/envs`, {
    headers: {
      Authorization: `Bearer ${instance.token}`,
      Accept: "application/json",
    },
  });
  if (!response.ok) throw new Error(`Could not read Foundry env vars from Coolify: ${response.status}`);

  const body = await response.json();
  const envs = Array.isArray(body) ? body : (body.data || body.envs || []);
  const foundryAdmin = envs.find((entry) => (entry.key || entry.name || entry.variable) === "FOUNDRY_ADMIN");
  const value = foundryAdmin?.real_value ?? foundryAdmin?.value;
  if (!value) throw new Error("FOUNDRY_ADMIN was not available from Coolify.");
  return value;
}

export async function joinWorld(page, password, preferredUser = LIVE_USER, options = {}) {
  const requireGM = options.requireGM !== false;
  debug(`opening join page as ${preferredUser}`);
  await page.goto(`${FOUNDRY_URL}/join`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(3000);
  debug(`join page loaded: ${page.url()}`);

  if (page.url().includes("/auth")) {
    debug("auth page detected");
    const adminInput = page.locator('input[name="adminPassword"], input[type="password"]').first();
    if (await adminInput.count()) {
      await adminInput.fill(password);
      await page.locator('button[type="submit"], button:has-text("LOG IN")').first().click();
      await page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);
      debug(`auth completed: ${page.url()}`);
    }
  }

  if (!page.url().includes("/join") && !page.url().includes("/game")) {
    debug(`redirecting back to join from ${page.url()}`);
    await page.goto(`${FOUNDRY_URL}/join`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
  }

  if (page.url().includes("/join")) {
    debug("selecting join user");
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
      }, preferredUser);
    }

    if (await page.locator('input[name="password"]').count()) {
      await page.locator('input[name="password"]').fill(password);
    }
    if (await page.locator('input[name="adminPassword"]').count()) {
      await page.locator('input[name="adminPassword"]').fill("");
    }
    debug("clicking join");
    await page.locator('button[name="join"], button:has-text("JOIN GAME SESSION")').first().click();
    debug("waiting for /game URL");
    await page.waitForURL(/\/game/, { timeout: 60000 }).catch(() => {});
    debug(`post-click URL: ${page.url()}`);
    await page.waitForLoadState("domcontentloaded", { timeout: 60000 }).catch(() => {});
  }

  debug("waiting for GM readiness");
  await waitForGameReady(page, { requireGM });
  debug(requireGM ? "GM ready" : "game ready");
  await page.waitForTimeout(1500);
}

async function waitForGameReady(page, options = {}, timeoutMs = 120000) {
  const requireGM = options.requireGM !== false;
  const started = Date.now();
  let lastState = {};
  while (Date.now() - started < timeoutMs) {
    try {
      lastState = await page.evaluate(() => ({
        url: location.href,
        hasGame: Boolean(globalThis.game),
        ready: Boolean(globalThis.game?.ready),
        user: globalThis.game?.user?.name,
        isGM: Boolean(globalThis.game?.user?.isGM),
        title: document.title,
      }));
      if (lastState.ready && (!requireGM || lastState.isGM)) return;
    } catch (error) {
      lastState = { error: error instanceof Error ? error.message : String(error) };
    }
    await page.waitForTimeout(1000);
  }
  throw new Error(`Timed out waiting for ${requireGM ? "GM " : ""}game readiness: ${JSON.stringify(lastState)}`);
}

function buildCommand(command, args) {
  switch (command) {
    case "snapshot":
      return { expression: "live.getLiveSnapshot()" };
    case "ensure-user":
      return { expression: "live.ensureLiveUser(password, args.name || undefined, args.role || undefined)" };
    case "say":
      return { expression: "live.sayAsGM(args.message || args.content, { alias: args.alias, whisperToGm: Boolean(args.whisper) })" };
    case "npc":
      return { expression: "live.sayAsNpc(args.actor, args.message || args.content, { whisperToGm: Boolean(args.whisper) })" };
    case "scene":
      return { expression: "live.setScene(args.name)" };
    case "move":
      return { expression: "live.moveToken(args.token, Number(args.x), Number(args.y), args.scene)" };
    case "hide":
      return { expression: "live.setTokenHidden(args.token, args.hidden !== 'false', args.scene)" };
    case "damage":
      return { expression: "live.applyDamage(args.actor, Number(args.amount))" };
    case "condition":
      return { expression: "live.toggleCondition(args.token, args.condition)" };
    default:
      throw new Error(`Unknown live command: ${command}`);
  }
}

export async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "snapshot";
  const password = await getAdminPassword();
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  try {
    await joinWorld(page, password);
    const action = buildCommand(command, args);
    const result = await page.evaluate(async ({ moduleId, expression, args, password }) => {
      const live = game.modules.get(moduleId)?.api?.live;
      if (!live) throw new Error(`Live bridge API is not active for ${moduleId}.`);
      return await Function("live", "args", "password", `return ${expression};`)(live, args, password);
    }, { moduleId: MODULE_ID, expression: action.expression, args, password });
    console.log(JSON.stringify(result, null, 2));
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
