---
name: live-foundry-dm
description: "Use when the user wants Uncle Yev to run or assist a live FoundryVTT session: observe table state, control NPCs, speak in chat, move tokens, roll dice, apply damage/conditions, switch scenes, and maintain live notes."
---

# Live Foundry DM

## First Move

Always get a snapshot before acting.

Preferred command:

```bash
node ../../scripts/foundry_live_control.mjs snapshot
```

Or use the active campaign module:

```js
game.modules.get("foundrycapital").api.live.getLiveSnapshot()
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
