# Between-Session Prep Workflow

Uncle Yev owns the campaign-to-Foundry prep workflow. The active campaign repo is the campaign source of truth. `foundry-module/` is the Foundry-side Uncle Yev Bridge module. Foundry is the runtime table.

## Daily Prep Loop

1. Edit campaign JSON in the active campaign repo, normally `../campaigns/the-unwritten-degree/raw/foundry/`.
2. Run `npm run prep:foundry`.
3. Run `npm run install:foundry-module` when Foundry's data directory is local or mounted.
4. Review the generated prep packet in the campaign repo `wiki/session-prep/`.
5. Make sure **Uncle Yev Bridge** is enabled in the world.
6. Run `game.modules.get("uncle-yev").api.seed()` as GM, or use an Uncle Yev live-control wrapper that calls the same API.

The seeder is intentionally conservative:

- NPCs are created only if missing.
- Items are created only if missing.
- Journals are updated from source every seed.
- Staging scenes are created only if missing.

This keeps table-time edits to actors, items, and maps from being overwritten while letting prep notes stay current.

## Source Files

- `raw/foundry/world.json`: campaign premise, principles, open threads.
- `raw/foundry/npcs.json`: durable NPC motives, secrets, voice, and Foundry actor basics.
- `raw/foundry/items.json`: campaign-specific items.
- `raw/foundry/factions.json`: agendas and pressure clocks.
- `raw/foundry/locations.json`: sensory framing and location truths.
- `raw/foundry/quests.json`: quest journals and beats.
- `raw/foundry/scenes.json`: staging scene definitions.
- `raw/foundry/session-prep/*.json`: next-session checklist and targets.

## Generated Files

- `foundry-module/generated/campaign-content.local.js` ignored private output
- `../campaigns/<campaign>/wiki/session-prep/<session-id>.md`

Do not edit generated files directly.
