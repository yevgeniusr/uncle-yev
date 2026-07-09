const MODULE_ID = "uncle-yev";
const FLAG_SCOPE = "uncle-yev";

const generatedContent = {
  metadata: {
    title: "No prepared campaign",
    currentArc: "Run Uncle Yev prep to generate campaign seed data.",
  },
  npcs: [],
  items: [],
  journals: [],
  scenes: [],
};

async function loadGeneratedContent() {
  try {
    const generated = await import("../generated/campaign-content.local.js");
    generatedContent.metadata = generated.CAMPAIGN_PREP_METADATA ?? generatedContent.metadata;
    generatedContent.npcs = generated.GENERATED_CAMPAIGN_NPCS ?? [];
    generatedContent.items = generated.GENERATED_CAMPAIGN_ITEMS ?? [];
    generatedContent.journals = generated.GENERATED_CAMPAIGN_JOURNALS ?? [];
    generatedContent.scenes = generated.GENERATED_CAMPAIGN_SCENES ?? [];
  } catch (error) {
    console.warn(`${MODULE_ID} | no generated campaign content loaded`, error);
  }
}

class UncleYevSeeder {
  static getPrepSummary() {
    return {
      metadata: generatedContent.metadata,
      counts: {
        npcs: generatedContent.npcs.length,
        items: generatedContent.items.length,
        journals: generatedContent.journals.length,
        scenes: generatedContent.scenes.length,
      },
    };
  }

  static async seedCampaignData() {
    if (!game.user?.isGM) throw new Error("Uncle Yev seeding requires a GM user.");

    let syncedActors = 0;
    let syncedItems = 0;
    let upsertedJournals = 0;
    let syncedScenes = 0;

    for (const npcData of generatedContent.npcs) {
      await this.upsertActor(npcData);
      syncedActors += 1;
    }
    for (const itemData of generatedContent.items) {
      await this.upsertItem(itemData);
      syncedItems += 1;
    }
    for (const journalData of generatedContent.journals) {
      await this.upsertJournal(journalData);
      upsertedJournals += 1;
    }
    for (const sceneData of generatedContent.scenes) {
      await this.syncScene(sceneData);
      syncedScenes += 1;
    }

    ui.notifications?.info?.(
      `Uncle Yev synced ${syncedActors} actors, ${syncedItems} items, ${upsertedJournals} journals, ${syncedScenes} scenes.`,
    );
    return { syncedActors, syncedItems, upsertedJournals, syncedScenes };
  }

  static async ensureFolder(name, type) {
    if (!name || typeof Folder === "undefined") return null;
    const existing = game.folders?.find((folder) => folder.name === name && folder.type === type);
    if (existing) return existing.id;
    const folder = await Folder.create({
      name,
      type,
      color: "#7d5f2a",
      flags: { [FLAG_SCOPE]: { generated: true } },
    });
    return folder?.id ?? null;
  }

  static findBySourceId(collection, sourceId) {
    return collection?.find((document) => document.flags?.[FLAG_SCOPE]?.sourceId === sourceId);
  }

  static async upsertActor(actorData) {
    const sourceId = actorData.flags?.[FLAG_SCOPE]?.sourceId;
    const existing = (sourceId && this.findBySourceId(game.actors, sourceId))
      || game.actors?.find((actor) => actor.name === actorData.name);
    if (!existing) return Actor.create(actorData);

    const updateData = foundry.utils.deepClone
      ? foundry.utils.deepClone(actorData)
      : JSON.parse(JSON.stringify(actorData));
    const embeddedItems = updateData.items ?? [];
    delete updateData.items;
    await existing.update(updateData);

    for (const itemData of embeddedItems) {
      const item = existing.items?.find((embedded) => embedded.name === itemData.name);
      if (!item) await existing.createEmbeddedDocuments("Item", [itemData]);
      else await item.update(itemData);
    }
  }

  static async upsertItem(itemData) {
    const sourceId = itemData.flags?.[FLAG_SCOPE]?.sourceId;
    const existing = (sourceId && this.findBySourceId(game.items, sourceId))
      || game.items?.find((item) => item.name === itemData.name);
    if (!existing) return Item.create(itemData);
    return existing.update(itemData);
  }

  static async upsertJournal(journalData) {
    const folderId = await this.ensureFolder(journalData.folderName, "JournalEntry");
    const existing = game.journal?.find((entry) => entry.name === journalData.name);
    const pageData = {
      name: "Main",
      type: "text",
      text: { format: 1, content: journalData.content },
    };

    if (!existing) {
      return JournalEntry.create({
        name: journalData.name,
        folder: folderId,
        pages: [pageData],
        flags: { [FLAG_SCOPE]: { generated: true, source: "campaign-json" } },
      });
    }

    if (folderId && existing.folder?.id !== folderId) await existing.update({ folder: folderId });
    const mainPage = existing.pages?.find((page) => page.name === "Main");
    if (mainPage) return mainPage.update({ text: pageData.text });
    return existing.createEmbeddedDocuments("JournalEntryPage", [pageData]);
  }

  static findActorForToken(tokenPlan) {
    if (tokenPlan.actorId) {
      const actor = this.findBySourceId(game.actors, tokenPlan.actorId);
      if (actor) return actor;
    }
    return game.actors?.find((actor) => actor.name === tokenPlan.name);
  }

  static async syncScene(sceneData) {
    const existing = game.scenes?.find((scene) => scene.name === sceneData.name);
    const tokenPlans = sceneData.flags?.[FLAG_SCOPE]?.plannedTokens ?? [];
    const wallPlans = sceneData.walls ?? [];
    const lightPlans = sceneData.lights ?? [];

    if (!existing) {
      const scene = await Scene.create(sceneData);
      await this.syncSceneTokens(scene, tokenPlans);
      await this.syncSceneWalls(scene, wallPlans);
      await this.syncSceneLights(scene, lightPlans);
      return;
    }

    await existing.update({
      img: sceneData.img,
      background: sceneData.background,
      thumb: sceneData.thumb,
      width: sceneData.width,
      height: sceneData.height,
      padding: sceneData.padding,
      grid: sceneData.grid,
      tokenVision: sceneData.tokenVision,
      fogExploration: sceneData.fogExploration,
      globalLight: sceneData.globalLight,
      flags: sceneData.flags,
    });
    await this.syncSceneTokens(existing, tokenPlans);
    await this.syncSceneWalls(existing, wallPlans);
    await this.syncSceneLights(existing, lightPlans);
  }

  static async syncSceneTokens(scene, tokenPlans) {
    if (!scene || !tokenPlans.length) return;
    const toCreate = [];
    for (const tokenPlan of tokenPlans) {
      const tokenKey = `${tokenPlan.actorId ?? tokenPlan.name}:${tokenPlan.x}:${tokenPlan.y}`;
      const exists = scene.tokens?.find((token) => token.flags?.[FLAG_SCOPE]?.tokenKey === tokenKey);
      if (exists) continue;
      const actor = this.findActorForToken(tokenPlan);
      toCreate.push({
        name: tokenPlan.name,
        actorId: actor?.id,
        x: tokenPlan.x,
        y: tokenPlan.y,
        hidden: Boolean(tokenPlan.hidden),
        disposition: tokenPlan.disposition ?? actor?.prototypeToken?.disposition ?? 0,
        sight: tokenPlan.sight,
        flags: { [FLAG_SCOPE]: { tokenKey, actorSourceId: tokenPlan.actorId } },
      });
    }
    if (toCreate.length) await scene.createEmbeddedDocuments("Token", toCreate);
  }

  static async syncSceneWalls(scene, wallPlans) {
    if (!scene || !wallPlans.length) return;
    const ownedWalls = scene.walls?.filter((wall) => wall.flags?.[FLAG_SCOPE]?.sourceKey) ?? [];
    if (ownedWalls.length) await scene.deleteEmbeddedDocuments("Wall", ownedWalls.map((wall) => wall.id));
    await scene.createEmbeddedDocuments("Wall", wallPlans);
  }

  static async syncSceneLights(scene, lightPlans) {
    if (!scene || !lightPlans.length) return;
    const ownedLights = scene.lights?.filter((light) => light.flags?.[FLAG_SCOPE]?.sourceKey) ?? [];
    if (ownedLights.length) {
      await scene.deleteEmbeddedDocuments("AmbientLight", ownedLights.map((light) => light.id));
    }
    await scene.createEmbeddedDocuments("AmbientLight", lightPlans);
  }
}

class UncleYevLiveBridge {
  static registerSettings() {
    game.settings.register(MODULE_ID, "liveLog", {
      name: "Uncle Yev Live Event Log",
      scope: "world",
      config: false,
      type: Object,
      default: [],
    });
    game.settings.register(MODULE_ID, "commandQueue", {
      name: "Uncle Yev Command Queue",
      scope: "world",
      config: false,
      type: Object,
      default: [],
    });
  }

  static initialize() {
    Hooks.on("createChatMessage", (message) => {
      this.recordEvent({
        type: "chat",
        speaker: message.speaker?.alias ?? message.user?.name ?? "Unknown",
        content: message.content,
        blind: message.blind,
        whisper: message.whisper,
      });
    });
    Hooks.on("updateCombat", (combat) => {
      this.recordEvent({
        type: "combat",
        round: combat.round,
        turn: combat.turn,
        combatant: combat.combatant?.name,
      });
    });
    Hooks.on("canvasReady", () => {
      this.recordEvent({ type: "scene", scene: canvas?.scene?.name });
    });
  }

  static getLiveSnapshot() {
    const scene = canvas?.scene ?? game.scenes?.active;
    const tokens = scene?.tokens?.map((token) => ({
      id: token.id,
      name: token.name,
      actorName: token.actor?.name,
      x: token.x,
      y: token.y,
      hidden: token.hidden,
      disposition: token.disposition,
      hp: token.actor?.system?.attributes?.hp
        ? {
            value: token.actor.system.attributes.hp.value,
            max: token.actor.system.attributes.hp.max,
          }
        : undefined,
      effects: Array.from(token.actor?.statuses ?? []),
    })) ?? [];

    return {
      timestamp: new Date().toISOString(),
      world: game.world?.title,
      user: { name: game.user?.name, isGM: game.user?.isGM },
      scene: scene
        ? {
            id: scene.id,
            name: scene.name,
            active: scene.active,
            tokenCount: tokens.length,
            width: scene.width,
            height: scene.height,
            background: scene.background?.src ?? scene.img,
            grid: scene.grid
              ? {
                  size: scene.grid.size,
                  distance: scene.grid.distance,
                  units: scene.grid.units,
                  type: scene.grid.type,
                }
              : undefined,
            tokenVision: scene.tokenVision,
            globalLight: scene.globalLight,
            fogExploration: scene.fogExploration,
            darkness: scene.darkness,
            walls: {
              total: scene.walls?.size ?? scene.walls?.length ?? 0,
              managed: scene.walls?.filter?.((wall) => wall.flags?.[FLAG_SCOPE]?.sourceKey).length ?? 0,
            },
            lights: {
              total: scene.lights?.size ?? scene.lights?.length ?? 0,
              managed: scene.lights?.filter?.((light) => light.flags?.[FLAG_SCOPE]?.sourceKey).length ?? 0,
            },
          }
        : null,
      tokens,
      combat: game.combat
        ? {
            id: game.combat.id,
            round: game.combat.round,
            turn: game.combat.turn,
            combatant: game.combat.combatant?.name,
            active: game.combat.started,
          }
        : null,
      users: game.users?.map((user) => ({
        id: user.id,
        name: user.name,
        active: user.active,
        isGM: user.isGM,
        role: user.role,
      })) ?? [],
      recentChat: game.messages?.contents?.slice(-20).map((message) => ({
        id: message.id,
        speaker: message.speaker?.alias ?? message.user?.name,
        content: message.content,
        timestamp: message.timestamp,
      })) ?? [],
      liveLog: this.getLiveLog().slice(-50),
      commandQueue: this.getCommandQueue().slice(-20),
    };
  }

  static async sayAsGM(content, options = {}) {
    this.assertGM();
    const whisper = options.whisperToGm ? ChatMessage.getWhisperRecipients("GM").map((user) => user.id) : undefined;
    const message = await ChatMessage.create({
      content,
      speaker: { alias: options.alias ?? "Uncle Yev" },
      whisper,
    });
    this.recordEvent({ type: "say", alias: options.alias ?? "Uncle Yev", content });
    return { id: message?.id, content };
  }

  static async sayAsNpc(actorName, content, options = {}) {
    this.assertGM();
    const actor = game.actors?.getName?.(actorName) ?? game.actors?.find((candidate) => candidate.name === actorName);
    const whisper = options.whisperToGm ? ChatMessage.getWhisperRecipients("GM").map((user) => user.id) : undefined;
    const message = await ChatMessage.create({
      content,
      speaker: actor ? ChatMessage.getSpeaker({ actor }) : { alias: actorName },
      whisper,
    });
    this.recordEvent({ type: "npc", actorName, content });
    return { id: message?.id, actorName, content };
  }

  static async setScene(sceneName) {
    this.assertGM();
    const scene = this.findScene(sceneName);
    if (!scene) throw new Error(`Scene not found: ${sceneName}`);
    await scene.activate();
    this.recordEvent({ type: "scene-activate", sceneName });
    return { sceneName, active: true };
  }

  static async moveToken(tokenName, x, y, sceneName) {
    this.assertGM();
    const { token, scene } = this.findToken(tokenName, sceneName);
    if (!token) throw new Error(`Token not found: ${tokenName}`);
    await token.update({ x, y });
    this.recordEvent({ type: "token-move", tokenName, sceneName: scene?.name, x, y });
    return { tokenName, sceneName: scene?.name, x, y };
  }

  static async setTokenHidden(tokenName, hidden, sceneName) {
    this.assertGM();
    const { token, scene } = this.findToken(tokenName, sceneName);
    if (!token) throw new Error(`Token not found: ${tokenName}`);
    await token.update({ hidden });
    this.recordEvent({ type: "token-hidden", tokenName, sceneName: scene?.name, hidden });
    return { tokenName, sceneName: scene?.name, hidden };
  }

  static async applyDamage(actorName, amount) {
    this.assertGM();
    const actor = game.actors?.getName?.(actorName) ?? game.actors?.find((candidate) => candidate.name === actorName);
    if (!actor) throw new Error(`Actor not found: ${actorName}`);
    const hp = actor.system?.attributes?.hp;
    if (!hp) throw new Error(`Actor has no hp field: ${actorName}`);
    const next = Math.max(0, Number(hp.value ?? hp.max ?? 0) - amount);
    await actor.update({ "system.attributes.hp.value": next });
    this.recordEvent({ type: "damage", actorName, amount, hp: next });
    return { actorName, amount, hp: next };
  }

  static async toggleCondition(tokenName, condition) {
    this.assertGM();
    const { token, scene } = this.findToken(tokenName);
    if (!token) throw new Error(`Token not found: ${tokenName}`);
    const actor = token.actor;
    if (!actor?.toggleStatusEffect) throw new Error(`Actor cannot toggle status effects: ${tokenName}`);
    await actor.toggleStatusEffect(condition);
    this.recordEvent({ type: "condition", tokenName, sceneName: scene?.name, condition });
    return { tokenName, condition };
  }

  static async ensureLiveUser(password, name = "Codex DM", roleName = "gamemaster") {
    this.assertGM();
    if (!password) throw new Error("A password is required for the live DM user.");
    const roleMap = {
      player: CONST.USER_ROLES.PLAYER,
      trusted: CONST.USER_ROLES.TRUSTED,
      assistant: CONST.USER_ROLES.ASSISTANT,
      gamemaster: CONST.USER_ROLES.GAMEMASTER,
      gm: CONST.USER_ROLES.GAMEMASTER,
    };
    const role = roleMap[String(roleName).toLowerCase()] ?? CONST.USER_ROLES.GAMEMASTER;
    const existing = game.users?.find((user) => user.name === name);
    if (existing) {
      await existing.update({ role, password });
      return { id: existing.id, name, updated: true };
    }
    const user = await User.create({ name, role, password });
    return { id: user?.id, name, created: true };
  }

  static getLiveLog() {
    try {
      return game.settings.get(MODULE_ID, "liveLog") ?? [];
    } catch {
      return [];
    }
  }

  static getCommandQueue() {
    try {
      return game.settings.get(MODULE_ID, "commandQueue") ?? [];
    } catch {
      return [];
    }
  }

  static recordEvent(event) {
    const entry = { ...event, timestamp: new Date().toISOString() };
    const log = [...this.getLiveLog(), entry].slice(-200);
    game.settings.set(MODULE_ID, "liveLog", log);
    return entry;
  }

  static assertGM() {
    if (!game.user?.isGM) throw new Error("Uncle Yev bridge command requires a GM user.");
  }

  static findScene(sceneName) {
    if (!sceneName) return canvas?.scene ?? game.scenes?.active;
    return game.scenes?.getName?.(sceneName) ?? game.scenes?.find((scene) => scene.name === sceneName);
  }

  static findToken(tokenName, sceneName) {
    const scene = this.findScene(sceneName);
    const token = scene?.tokens?.find((candidate) => candidate.name === tokenName);
    return { token, scene };
  }
}

Hooks.once("init", () => {
  UncleYevLiveBridge.registerSettings();
});

Hooks.once("ready", async () => {
  await loadGeneratedContent();
  UncleYevLiveBridge.initialize();
  game.modules.get(MODULE_ID).api = {
    seed: () => UncleYevSeeder.seedCampaignData(),
    prepSummary: () => UncleYevSeeder.getPrepSummary(),
    live: UncleYevLiveBridge,
    Seeder: UncleYevSeeder,
  };
  console.log(`${MODULE_ID} | bridge ready`);
});
