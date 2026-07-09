#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const moduleId = "uncle-yev";
const moduleSource = path.join(repoRoot, "foundry-module");

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      args._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
    } else {
      args[key] = next;
      index += 1;
    }
  }
  return args;
}

function defaultFoundryDataPath() {
  if (process.env.FOUNDRY_DATA_PATH) return path.resolve(process.env.FOUNDRY_DATA_PATH);
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "FoundryVTT", "Data");
  }
  if (process.platform === "win32") {
    return path.join(process.env.LOCALAPPDATA || os.homedir(), "FoundryVTT", "Data");
  }
  return path.join(os.homedir(), ".local", "share", "FoundryVTT", "Data");
}

function assertModuleSource() {
  const manifest = path.join(moduleSource, "module.json");
  if (!fs.existsSync(manifest)) {
    throw new Error(`Uncle Yev Foundry module source not found: ${manifest}`);
  }
}

function removeExisting(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function installSymlink(targetPath) {
  const type = process.platform === "win32" ? "junction" : "dir";
  fs.symlinkSync(moduleSource, targetPath, type);
}

function installCopy(targetPath) {
  fs.cpSync(moduleSource, targetPath, {
    recursive: true,
    force: true,
    filter: (source) => !source.endsWith(".DS_Store"),
  });
}

function readLinkTarget(targetPath) {
  try {
    return fs.realpathSync(targetPath);
  } catch {
    return null;
  }
}

const args = parseArgs(process.argv.slice(2));
const mode = String(args.mode || process.env.FOUNDRY_MODULE_INSTALL_MODE || "symlink");
const force = Boolean(args.force || process.env.FOUNDRY_MODULE_INSTALL_FORCE);
const foundryDataPath = args["data-path"]
  ? path.resolve(String(args["data-path"]))
  : defaultFoundryDataPath();
const modulesPath = args["modules-path"]
  ? path.resolve(String(args["modules-path"]))
  : path.join(foundryDataPath, "modules");
const targetPath = path.join(modulesPath, moduleId);

assertModuleSource();
fs.mkdirSync(modulesPath, { recursive: true });

if (fs.existsSync(targetPath)) {
  const existingRealPath = readLinkTarget(targetPath);
  const sourceRealPath = fs.realpathSync(moduleSource);
  if (existingRealPath === sourceRealPath) {
    console.log(JSON.stringify({ installed: true, mode: "existing-symlink", targetPath, moduleSource }, null, 2));
    process.exit(0);
  }
  if (!force) {
    throw new Error(
      `Foundry module target already exists: ${targetPath}. Re-run with --force to replace it, or set FOUNDRY_MODULES_PATH to another modules directory.`,
    );
  }
  removeExisting(targetPath);
}

if (mode === "copy") {
  installCopy(targetPath);
} else if (mode === "symlink") {
  installSymlink(targetPath);
} else {
  throw new Error(`Unsupported install mode: ${mode}. Use "symlink" or "copy".`);
}

const installedManifest = path.join(targetPath, "module.json");
if (!fs.existsSync(installedManifest)) {
  throw new Error(`Installed module manifest was not found: ${installedManifest}`);
}

console.log(JSON.stringify({ installed: true, mode, targetPath, moduleSource }, null, 2));
