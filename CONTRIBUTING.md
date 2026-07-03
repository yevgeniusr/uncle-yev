# Contributing

Uncle Yev is an agent instruction/plugin project. Useful contributions should make AI dungeon mastering more reliable, inspectable, and safe at real tables.

## Good Contributions

- New or improved skills for campaign prep, maps, NPCs, plots, post-session processing, and live Foundry operations.
- Foundry integration improvements that keep GM confirmation and player consent boundaries clear.
- Better memory ledger patterns for multi-session campaigns.
- Docs that make local and self-hosted Foundry setup easier.
- Tests or checks for scripts and generated artifacts.

## Development

```bash
npm install
npm run check
python3 /Users/mac/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .
```

The validation path is Codex-local. If you do not have that validator, `npm run check` still verifies the JavaScript helpers parse correctly.

## Privacy

Do not commit private campaign ledgers, transcripts, recordings, Foundry credentials, Coolify credentials, or player personal data. Use `memory/uncle-yev-ledger.local.md` and `sessions/inbox/` for local-only state.

## Pull Requests

Keep changes focused. Include:

- what changed
- why it matters at the table
- how you tested it
- any safety or consent implications
