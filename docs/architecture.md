# Uncle Yev Architecture

## Components

```text
Codex or Claude
  |
  +-- Uncle Yev skills
  |     +-- offline campaign prep
  |     +-- live Foundry DM
  |     +-- post-session processing
  |     +-- map/NPC/plot generation
  |
  +-- memory/uncle-yev-ledger.local.md
  |
  +-- scripts/foundry_live_control.mjs
  |
  +-- FoundryVTT
        +-- local URL or self-hosted URL
        +-- live module API or MCP bridge
        +-- actors, scenes, journals, chat, rolls
```

## Offline Mode

Offline mode produces deterministic campaign artifacts:

- world bible
- factions and clocks
- NPC actors
- locations
- scenes and maps
- encounter cards
- traps
- loot
- session runbooks
- post-session reports

The output should be easy to seed into Foundry via JSON, module API, MCP, or browser automation.

## Live Mode

Live mode begins with a snapshot:

- active scene
- tokens and HP
- hidden state
- combat round/turn
- recent chat
- active users
- command queue

Then Uncle Yev can speak as NPCs, move tokens, switch scenes, reveal threats, apply damage/conditions, and record events, subject to permission boundaries.

## Memory Model

The private local ledger is not a transcript. It stores durable campaign intelligence:

- player preferences
- unresolved hooks
- NPC plans
- private twist bank
- faction clocks
- promises and debts
- post-session changes

For long campaigns, session transcripts should be summarized into the ledger rather than pasted wholesale.
