---
name: post-session-processing
description: "Use when processing transcripts, recordings, chat logs, or notes after a D&D session to produce summaries, campaign memory updates, Foundry journal updates, NPC changes, loot logs, and next-session prep."
---

# Post-Session Processing

## Inputs

Accept:

- transcript text
- Foundry chat export
- recording metadata
- manual bullet notes
- player feedback

## Output Structure

Create:

- session summary
- player decisions
- NPC state changes
- faction clock updates
- loot gained/spent
- unresolved hooks
- promises/debts
- funny table moments worth recalling
- least-expected future callback
- prep tasks for next session

## Memory Compression

Do not paste full transcripts into the ledger. Extract durable facts and append them to:

```text
../../memory/uncle-yev-ledger.local.md
```

## Foundry Updates

When connected to Foundry:

- create or update a session report journal
- update NPC notes
- update quest journals
- add new scenes/items only if they became durable campaign objects
