import { execFileSync } from "node:child_process";

const SERVICE_UUID = process.env.COOLIFY_FOUNDRY_SERVICE_UUID || "d0gw8sos8c8sssgwk8wcosk8";
const SERVICE_NAME = process.env.COOLIFY_FOUNDRY_SERVICE_NAME || "Foundryvtt (DND)";
const PUBLIC_URL = process.env.FOUNDRY_URL || "https://rpg.rachkovan.com";

function run(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function readCoolifyResource() {
  const raw = run("coolify", ["resource", "list", "--format", "json"]);
  const jsonStart = raw.search(/[\[{]/);
  if (jsonStart < 0) {
    throw new Error(`Coolify did not return JSON: ${raw.slice(0, 120)}`);
  }
  const resources = JSON.parse(raw.slice(jsonStart));
  return resources.find((resource) => resource.uuid === SERVICE_UUID || resource.name === SERVICE_NAME);
}

async function checkHttp() {
  const response = await fetch(PUBLIC_URL, {
    method: "HEAD",
    redirect: "manual",
  });

  return {
    status: response.status,
    location: response.headers.get("location"),
  };
}

const resource = readCoolifyResource();
if (!resource) {
  throw new Error(`Coolify service not found: ${SERVICE_NAME} / ${SERVICE_UUID}`);
}

const http = await checkHttp();
const summary = {
  coolify: {
    uuid: resource.uuid,
    name: resource.name,
    type: resource.type,
    status: resource.status,
  },
  publicUrl: PUBLIC_URL,
  http,
};

console.log(JSON.stringify(summary, null, 2));

if (!String(resource.status).includes("running")) {
  process.exitCode = 1;
}
