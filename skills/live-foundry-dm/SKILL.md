---
name: live-foundry-dm
description: "Use when the user wants Uncle Yev to run or assist a live FoundryVTT session: observe table state, control NPCs, speak in chat, move tokens, roll dice, apply damage/conditions, switch scenes, and maintain live notes."
---

# Live Foundry DM

## First Move

Always verify the bridge, then get a snapshot before acting.

If the snapshot fails because `uncle-yev` is missing or inactive:

1. Run `npm run prep:foundry`.
2. If Foundry's data directory is local or mounted, run `npm run install:foundry-module`.
3. Restart/reload Foundry if newly installed.
4. Enable **Uncle Yev Bridge** in the world, using browser automation if credentials were provided.
5. Retry the snapshot.

Remote Foundry web credentials alone can enable an already installed module but cannot upload local module files. If the module is missing remotely, ask for server filesystem, SSH/SFTP, hosting-panel/Coolify volume, or package-manifest access.

Preferred command:

```bash
node ../../scripts/foundry_live_control.mjs snapshot
```

Or use the active bridge module:

```js
game.modules.get("uncle-yev").api.live.getLiveSnapshot()
```

## Permission Classes

Safe:

- summarize current situation
- read recent chat
- suggest NPC reactions
- draft read-aloud text
- whisper private GM notes

Confirm with GM:

- move tokens
- reveal hidden enemies
- apply damage
- apply conditions
- switch scenes
- spawn enemies
- award loot

Require table consent:

- control player characters
- speak as player characters
- make tactical decisions for players

## Live Commands

```bash
node ../../scripts/foundry_live_control.mjs snapshot
node ../../scripts/foundry_live_control.mjs say --message "..."
node ../../scripts/foundry_live_control.mjs npc --actor "NPC Name" --message "..."
node ../../scripts/foundry_live_control.mjs scene --name "Scene Name"
node ../../scripts/foundry_live_control.mjs move --token "Token Name" --x 1000 --y 800
node ../../scripts/foundry_live_control.mjs hide --token "Token Name" --hidden false
node ../../scripts/foundry_live_control.mjs damage --actor "Actor Name" --amount 5
node ../../scripts/foundry_live_control.mjs condition --token "Token Name" --condition prone
```

## During Play

- Keep responses short.
- Ask for rolls only when uncertainty and stakes are both present.
- Let players solve problems in unexpected ways.
- Make enemy tactics intelligent but not omniscient.
- Track surprises, promises, and new hooks immediately.

## After Play

Append durable changes to `../../memory/uncle-yev-ledger.local.md` or the configured private ledger path.
