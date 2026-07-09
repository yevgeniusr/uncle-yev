import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const defaultCampaignRoot = path.resolve(rootDir, "..", "campaigns", "the-unwritten-degree");
const defaultModuleRoot = path.resolve(rootDir, "foundry-module");
const campaignRoot = path.resolve(process.env.FOUNDRY_CAMPAIGN_ROOT || defaultCampaignRoot);
const campaignDir = path.join(campaignRoot, "raw", "foundry");
const campaignAssetsDir = path.join(campaignRoot, "raw", "assets");
const moduleRoot = path.resolve(process.env.FOUNDRY_MODULE_ROOT || defaultModuleRoot);
const moduleCampaignAssetsDir = path.join(moduleRoot, "assets", "campaign");
const generatedDir = path.join(moduleRoot, "generated");
const flagScope = process.env.FOUNDRY_SEED_FLAG_SCOPE || "uncle-yev";
const prepOutDir = process.env.FOUNDRY_CAMPAIGN_PREP_OUT
  ? path.resolve(process.env.FOUNDRY_CAMPAIGN_PREP_OUT)
  : path.join(campaignRoot, "wiki", "session-prep");

function readJson(relativePath) {
  const filePath = path.join(campaignDir, relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readJsonFiles(relativeDir) {
  const dirPath = path.join(campaignDir, relativeDir);
  if (!fs.existsSync(dirPath)) return [];
  return fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith(".json"))
    .sort()
    .map((file) => readJson(path.join(relativeDir, file)));
}

function assertArray(name, value) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array`);
  }
}

function requiredString(context, value) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${context} must be a non-empty string`);
  }
  return value.trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function parseCr(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  const text = String(value).trim();
  if (text.includes("/")) {
    const [numerator, denominator] = text.split("/").map(Number);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : value;
}

function paragraphList(items) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function definitionList(rows) {
  return `<dl>${rows
    .map(
      ([term, description]) =>
        `<dt><strong>${escapeHtml(term)}</strong></dt><dd>${escapeHtml(description)}</dd>`,
    )
    .join("")}</dl>`;
}

function section(title, body) {
  return `<h2 class="spaced">${escapeHtml(title)}</h2>\n${body}`;
}

function worldTitle() {
  return world?.title ?? "Campaign";
}

function buildActorAction(action) {
  return {
    name: action.name,
    type: action.type ?? "feat",
    img: action.img ?? "icons/svg/sword.svg",
    system: {
      description: { value: `<p>${escapeHtml(action.description ?? "")}</p>` },
      activation: { type: "action", cost: 1 },
      actionType: action.type === "weapon" ? "mwak" : action.actionType,
      attackBonus: action.attackBonus,
      damage: action.damage ? { parts: action.damage } : undefined,
      save: action.save,
    },
  };
}

function buildNpcActor(npc) {
  requiredString(`npc.name for ${npc.id}`, npc.name);
  const abilities = Object.fromEntries(
    Object.entries(npc.foundry?.abilities ?? {}).map(([ability, value]) => [
      ability,
      { value },
    ]),
  );

  return {
    name: npc.name,
    type: npc.type ?? "npc",
    img: npc.img ?? "icons/svg/mystery-man.svg",
    system: {
      abilities,
        details: {
          biography: {
            value: [
              `<p>${escapeHtml(npc.foundry?.biography ?? npc.role ?? "")}</p>`,
            `<p><strong>Wants:</strong> ${escapeHtml(npc.wants ?? "Unknown")}</p>`,
            `<p><strong>Secret:</strong> ${escapeHtml(npc.secret ?? "Unknown")}</p>`,
            `<p><strong>Voice:</strong> ${escapeHtml(npc.voice ?? "Unknown")}</p>`,
          ].join(""),
        },
        cr: parseCr(npc.foundry?.cr),
        type: npc.foundry?.creatureType
          ? { value: npc.foundry.creatureType }
          : undefined,
      },
      traits: npc.foundry?.languages
        ? { languages: { value: npc.foundry.languages } }
        : undefined,
      attributes: {
        ac: npc.foundry?.ac ? { calc: "flat", flat: npc.foundry.ac, value: npc.foundry.ac } : undefined,
        hp: npc.foundry?.hp
          ? { value: npc.foundry.hp, max: npc.foundry.hp }
          : undefined,
      },
    },
    items: (npc.foundry?.actions ?? []).map(buildActorAction),
    prototypeToken: {
      name: npc.name,
      actorLink: false,
      disposition: npc.foundry?.disposition ?? npc.disposition ?? 0,
    },
    flags: {
      [flagScope]: {
        sourceId: npc.id,
        faction: npc.faction,
        role: npc.role,
      },
    },
  };
}

function buildItem(item) {
  requiredString(`item.name for ${item.id}`, item.name);
  return {
    name: item.name,
    type: item.type ?? "item",
    img: item.img ?? "icons/svg/item-bag.svg",
    system: {
      description: { value: `<p>${escapeHtml(item.description ?? "")}</p>` },
      actionType: item.type === "weapon" ? "mwak" : undefined,
      damage: item.damage ? { parts: item.damage } : undefined,
      weaponType: item.weaponType,
      baseItem: item.baseItem,
      properties: item.properties ?? {},
    },
    flags: {
      [flagScope]: {
        sourceId: item.id,
      },
    },
  };
}

function buildCampaignDashboard({ world, factions, quests, locations }) {
  const factionRows = factions
    .map(
      (faction) =>
        `<tr><td>${escapeHtml(faction.name)}</td><td>${escapeHtml(faction.agenda)}</td><td>${escapeHtml(faction.pressureClock.name)}: ${faction.pressureClock.filled}/${faction.pressureClock.segments}</td></tr>`,
    )
    .join("");
  const questRows = quests
    .map(
      (quest) =>
        `<tr><td>${escapeHtml(quest.title)}</td><td>${escapeHtml(quest.type)}</td><td>${escapeHtml(quest.summary)}</td></tr>`,
    )
    .join("");
  const locationList = paragraphList(locations.map((location) => location.name));

  return {
    name: `${world.title} - DM Dashboard`,
    folderName: world.title,
    content: [
      `<h1>${escapeHtml(world.title)}</h1>`,
      `<p><strong>Current Arc:</strong> ${escapeHtml(world.currentArc)}</p>`,
      section("DM Principles", paragraphList(world.dmPrinciples)),
      section("Open Threads", paragraphList(world.openThreads)),
      section("Factions", `<table><tbody>${factionRows}</tbody></table>`),
      section("Active Quests", `<table><tbody>${questRows}</tbody></table>`),
      section("Locations", locationList),
    ].join("\n"),
  };
}

function buildQuestJournal(quest) {
  return {
    name: `Quest - ${quest.title}`,
    folderName: `${worldTitle()} Quests`,
    content: [
      `<h1>${escapeHtml(quest.title)}</h1>`,
      `<p><strong>Type:</strong> ${escapeHtml(quest.type)} | <strong>Difficulty:</strong> ${escapeHtml(quest.difficulty)}</p>`,
      `<p><strong>Quest Giver:</strong> ${escapeHtml(quest.questGiver)}</p>`,
      `<p><strong>Location:</strong> ${escapeHtml(quest.location)}</p>`,
      section("Summary", `<div class="readaloud"><p>${escapeHtml(quest.summary)}</p></div>`),
      section("Beats", paragraphList(quest.beats)),
      section("Rewards", `<p>${escapeHtml(quest.rewards)}</p>`),
    ].join("\n"),
  };
}

function buildFactionJournal(faction) {
  return {
    name: `Faction - ${faction.name}`,
    folderName: `${worldTitle()} Factions`,
    content: [
      `<h1>${escapeHtml(faction.name)}</h1>`,
      section("Agenda", `<p>${escapeHtml(faction.agenda)}</p>`),
      section("Leverage", `<p>${escapeHtml(faction.leverage)}</p>`),
      section(
        "Pressure Clock",
        `<p>${escapeHtml(faction.pressureClock.name)}: ${faction.pressureClock.filled}/${faction.pressureClock.segments}</p>`,
      ),
    ].join("\n"),
  };
}

function buildLocationJournal(location) {
  return {
    name: `Location - ${location.name}`,
    folderName: `${worldTitle()} Locations`,
    content: [
      `<h1>${escapeHtml(location.name)}</h1>`,
      section("Sensory Details", paragraphList(location.sensory)),
      section("Truths", paragraphList(location.truths)),
    ].join("\n"),
  };
}

function buildSessionPrepJournal(sessionPrep) {
  return {
    name: `Session Prep - ${sessionPrep.title}`,
    folderName: `${worldTitle()} Session Prep`,
    content: [
      `<h1>${escapeHtml(sessionPrep.title)}</h1>`,
      `<p><strong>Status:</strong> ${escapeHtml(sessionPrep.status)}</p>`,
      section("Recap", `<p>${escapeHtml(sessionPrep.recap)}</p>`),
      section("Next Session Targets", paragraphList(sessionPrep.nextSessionTargets)),
      section("DM Checklist", paragraphList(sessionPrep.dmChecklist)),
      section("Pending Foundry Tasks", paragraphList(sessionPrep.pendingFoundryTasks)),
    ].join("\n"),
  };
}

function tableRows(items, cells) {
  return `<table><tbody>${items
    .map((item) => `<tr>${cells.map((cell) => `<td>${cell(item)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function buildSessionRunbookJournal(session) {
  return {
    name: `${session.title} - DM Runbook`,
    folderName: `${worldTitle()} Session Prep`,
    content: [
      `<h1>${escapeHtml(session.title)}</h1>`,
      `<p><strong>Status:</strong> ${escapeHtml(session.status)} | <strong>Level:</strong> ${escapeHtml(session.levelRange)} | <strong>Duration:</strong> ${escapeHtml(session.expectedDuration)}</p>`,
      section("Summary", `<div class="readaloud"><p>${escapeHtml(session.summary)}</p></div>`),
      section("Opening Question", `<p>${escapeHtml(session.openingQuestion)}</p>`),
      section("Objectives", paragraphList(session.objectives)),
      section("Safety Note", `<p>${escapeHtml(session.safetyNote)}</p>`),
      section(
        "Pacing",
        tableRows(session.pacing, [
          (beat) => escapeHtml(beat.minutes),
          (beat) => escapeHtml(beat.beat),
        ]),
      ),
      section("Rewards", paragraphList(session.loot)),
      section("Ending Choices", paragraphList(session.ending.choices)),
      section("Final Read-Aloud", `<div class="readaloud"><p>${escapeHtml(session.ending.readAloud)}</p></div>`),
      section("Next Hook", `<p>${escapeHtml(session.ending.nextHook)}</p>`),
    ].join("\n"),
  };
}

function buildLocationBeatJournal(session, location) {
  return {
    name: `${session.title} - Location - ${location.name}`,
    folderName: `${worldTitle()} Session Prep`,
    content: [
      `<h1>${escapeHtml(location.name)}</h1>`,
      `<p><strong>Scene:</strong> ${escapeHtml(location.scene)} | <strong>Purpose:</strong> ${escapeHtml(location.purpose)}</p>`,
      section("Read-Aloud", `<div class="readaloud"><p>${escapeHtml(location.readAloud)}</p></div>`),
      location.clues ? section("Clues", paragraphList(location.clues)) : "",
    ].join("\n"),
  };
}

function buildEncounterJournal(session, encounter) {
  return {
    name: `${session.title} - Encounter - ${encounter.name}`,
    folderName: `${worldTitle()} Encounters`,
    content: [
      `<h1>${escapeHtml(encounter.name)}</h1>`,
      `<p><strong>Scene:</strong> ${escapeHtml(encounter.scene)} | <strong>Difficulty:</strong> ${escapeHtml(encounter.difficulty)}</p>`,
      section("Enemies", paragraphList(encounter.enemies)),
      section("Tactics", paragraphList(encounter.tactics)),
      section("Scaling", paragraphList(encounter.scaling)),
      section("Victory", `<p>${escapeHtml(encounter.victory)}</p>`),
      section("Failure Forward", `<p>${escapeHtml(encounter.failureForward)}</p>`),
    ].join("\n"),
  };
}

function buildTrapJournal(session, trap) {
  return {
    name: `${session.title} - Trap - ${trap.name}`,
    folderName: `${worldTitle()} Traps`,
    content: [
      `<h1>${escapeHtml(trap.name)}</h1>`,
      `<p><strong>Scene:</strong> ${escapeHtml(trap.scene)}</p>`,
      section(
        "Trap Card",
        definitionList([
          ["Trigger", trap.trigger],
          ["Detect", trap.detect],
          ["Disable", trap.disable],
          ["Effect", trap.effect],
          ["Counterplay", trap.counterplay],
        ]),
      ),
    ].join("\n"),
  };
}

function buildNpcScriptJournal(session) {
  return {
    name: `${session.title} - NPC Scripts`,
    folderName: `${worldTitle()} Session Prep`,
    content: [
      `<h1>${escapeHtml(session.title)} NPC Scripts</h1>`,
      ...session.npcs.map((npc) =>
        [
          section(npc.name, `<p><strong>Role:</strong> ${escapeHtml(npc.role)}</p>`),
          paragraphList(npc.script),
        ].join("\n"),
      ),
    ].join("\n"),
  };
}

function buildSessionJournals(session) {
  return [
    buildSessionRunbookJournal(session),
    buildNpcScriptJournal(session),
    ...session.locations.map((location) => buildLocationBeatJournal(session, location)),
    ...session.encounters.map((encounter) => buildEncounterJournal(session, encounter)),
    ...session.traps.map((trap) => buildTrapJournal(session, trap)),
  ];
}

function buildScene(scene) {
  const walls = (scene.walls ?? []).map((wall) => ({
    c: wall.c,
    light: wall.light ?? 20,
    move: wall.move ?? 20,
    sight: wall.sight ?? 20,
    sound: wall.sound ?? 20,
    door: wall.door ?? 0,
    ds: wall.ds ?? 0,
    flags: {
      [flagScope]: {
        sourceKey: wall.id,
      },
    },
  }));
  const lights = (scene.lights ?? []).map((light) => ({
    x: light.x,
    y: light.y,
    hidden: Boolean(light.hidden),
    config: {
      bright: light.config?.bright ?? 0,
      dim: light.config?.dim ?? 20,
      color: light.config?.color ?? "#f2b35e",
      alpha: light.config?.alpha ?? 0.35,
      luminosity: light.config?.luminosity ?? 0.5,
    },
    flags: {
      [flagScope]: {
        sourceKey: light.id,
      },
    },
  }));

  return {
    name: scene.name,
    active: false,
    navigation: true,
    img: scene.img,
    background: scene.img ? { src: scene.img } : undefined,
    thumb: scene.img,
    width: scene.width,
    height: scene.height,
    padding: 0.25,
    grid: {
      size: scene.grid,
      type: 1,
      distance: 5,
      units: "ft",
    },
    tokenVision: true,
    fogExploration: true,
    globalLight: Boolean(scene.globalLight),
    walls,
    lights,
    flags: {
      [flagScope]: {
        sourceId: scene.id,
        purpose: scene.purpose,
        plannedTokens: scene.tokens ?? [],
      },
    },
  };
}

function renderMarkdownPrep({ world, factions, quests, locations, sessionPrep, sessions }) {
  return [
    `# ${world.title}: ${sessionPrep.title}`,
    "",
    `Status: ${sessionPrep.status}`,
    "",
    `Current arc: ${world.currentArc}`,
    "",
    "## Next Session Targets",
    ...sessionPrep.nextSessionTargets.map((item) => `- ${item}`),
    "",
    "## DM Checklist",
    ...sessionPrep.dmChecklist.map((item) => `- ${item}`),
    "",
    "## Active Quests",
    ...quests.map((quest) => `- ${quest.title}: ${quest.summary}`),
    "",
    "## Faction Pressure",
    ...factions.map(
      (faction) =>
        `- ${faction.name}: ${faction.pressureClock.name} ${faction.pressureClock.filled}/${faction.pressureClock.segments}`,
    ),
    "",
    "## Locations To Frame",
    ...locations.map((location) => `- ${location.name}: ${location.sensory[0]}`),
    "",
    "## Session Runbooks",
    ...sessions.map((session) => `- ${session.title}: ${session.summary}`),
    "",
  ].join("\n");
}

function serializeTs(value) {
  return JSON.stringify(value, null, 2)
    .replaceAll("</script", "<\\/script")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

if (!fs.existsSync(campaignDir)) {
  throw new Error(
    `Campaign source directory not found: ${campaignDir}. Set FOUNDRY_CAMPAIGN_ROOT to a campaign wiki repository.`,
  );
}
if (!fs.existsSync(path.join(moduleRoot, "module.json"))) {
  throw new Error(
    `Foundry module root not found: ${moduleRoot}. Set FOUNDRY_MODULE_ROOT to the target module repository.`,
  );
}

const world = readJson("world.json");
const npcs = readJson("npcs.json");
const items = readJson("items.json");
const factions = readJson("factions.json");
const locations = readJson("locations.json");
const quests = readJson("quests.json");
const scenes = readJson("scenes.json");
const sessionPreps = readJsonFiles("session-prep");
const sessions = readJsonFiles("sessions");
const sessionPrep = sessionPreps.at(-1);

assertArray("npcs", npcs);
assertArray("items", items);
assertArray("factions", factions);
assertArray("locations", locations);
assertArray("quests", quests);
assertArray("scenes", scenes);
assertArray("sessionPreps", sessionPreps);
assertArray("sessions", sessions);
requiredString("world.title", world.title);
requiredString("sessionPrep.title", sessionPrep.title);

const generated = {
  prepMetadata: {
    generatedAt: sessionPrep.sessionId,
    campaignId: world.campaignId,
    title: world.title,
    currentArc: world.currentArc,
    sessionPrepId: sessionPrep.sessionId,
  },
  npcs: npcs.map(buildNpcActor),
  items: items.map(buildItem),
  journals: [
    buildCampaignDashboard({ world, factions, quests, locations }),
    ...quests.map(buildQuestJournal),
    ...factions.map(buildFactionJournal),
    ...locations.map(buildLocationJournal),
    ...sessionPreps.map(buildSessionPrepJournal),
    ...sessions.flatMap(buildSessionJournals),
  ],
  scenes: scenes.map(buildScene),
};

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(prepOutDir, { recursive: true });
if (fs.existsSync(campaignAssetsDir)) {
  fs.rmSync(moduleCampaignAssetsDir, { recursive: true, force: true });
  fs.cpSync(campaignAssetsDir, moduleCampaignAssetsDir, { recursive: true });
}

const jsOut = `// Generated by uncle-yev/scripts/prepare_foundry_module.mjs. Edit the active campaign repo raw/foundry/*.json, not this file.

export const CAMPAIGN_PREP_METADATA = ${serializeTs(generated.prepMetadata)};

export const GENERATED_CAMPAIGN_NPCS = ${serializeTs(generated.npcs)};

export const GENERATED_CAMPAIGN_ITEMS = ${serializeTs(generated.items)};

export const GENERATED_CAMPAIGN_JOURNALS = ${serializeTs(generated.journals)};

export const GENERATED_CAMPAIGN_SCENES = ${serializeTs(generated.scenes)};
`;

fs.writeFileSync(path.join(generatedDir, "campaign-content.local.js"), jsOut);
fs.writeFileSync(
  path.join(prepOutDir, `${sessionPrep.sessionId}.md`),
  renderMarkdownPrep({ world, factions, quests, locations, sessionPrep, sessions }),
);

console.log(
  `Prepared ${generated.npcs.length} NPCs, ${generated.items.length} items, ${generated.journals.length} journals, and ${generated.scenes.length} scenes from ${campaignDir} into ${moduleRoot}.`,
);
