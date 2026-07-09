# Foundry DM Ops Design

## Decision

Use Uncle Yev as the campaign prep and live-ops toolbelt. Use `foundry-module/` as the Foundry-side Uncle Yev Bridge module. Use a separate campaign wiki repo as the campaign source of truth. Use browser automation or future MCP integrations as the operational bridge into the live world.

## Phase 1: Between-Session Prep

Campaign prep lives in checked-in JSON under the active campaign repo `raw/foundry/`. The generator converts it into:

- Foundry-ready JavaScript data loaded by the Uncle Yev Bridge module.
- Human-readable session prep Markdown.

The module seeds generated data into Foundry:

- Actors and items are created if missing.
- Journals are upserted.
- Staging scenes are created if missing.

This handles durable worldbuilding without depending on live MCP connectivity.

## Phase 2: Live Table Control

Live control should sit behind MCP and a confirmation queue. Codex can read active world state and propose actions, but high-impact operations need GM or table consent.

The first live daemon should ingest transcripts, create session reports, and update session journals. Direct token/NPC control comes next, after the table command workflow is reliable.

## Verification

- `npm run prep:foundry`
- Enable the `uncle-yev` Foundry module
- `npm run check:foundry`
