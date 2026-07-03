# Uncle Yev

Uncle Yev is a local AI dungeon master plugin for FoundryVTT. It gives Codex, Claude, and other coding agents a reusable operating manual for campaign prep, worldbuilding, post-session processing, and live table assistance.

![Uncle Yev banner](assets/banners/uncle-yev-banner.png)

## What It Does

- Creates campaigns, converts adventures into playable prep, and builds maps, NPCs, factions, encounters, loot, traps, journals, and handouts.
- Observes Foundry state and can operate live table actions through a Foundry module API, MCP bridge, or browser automation.
- Maintains a durable campaign ledger so multi-session plots, promises, secrets, and player preferences survive between sessions.
- Supports Codex plugin usage, Claude command usage, and plain repository-based agent instructions.

## Quick Start

```bash
git clone https://github.com/yevgeniusr/uncle-yev.git
cd uncle-yev
npm install
npm run check
```

For offline prep, ask your agent to use:

```text
Act as Uncle Yev. Read AGENTS.md, then use skills/offline-campaign-prep/SKILL.md to prepare my next FoundryVTT session.
```

For live table control, configure your Foundry target first:

```bash
cp .env.example .env
```

Set `FOUNDRY_URL`, `FOUNDRY_ADMIN` or `FOUNDRY_PASSWORD`, and `FOUNDRY_LIVE_USER`, then run:

```bash
npm run live:snapshot
```

Uncle Yev stores private campaign state in `memory/uncle-yev-ledger.local.md`, which is ignored by git. If that file does not exist, the helper scripts seed it from `memory/uncle-yev-ledger.md`.

## Supported Foundry Targets

- Local FoundryVTT at `http://localhost:30000`, `http://127.0.0.1:30000`, or another configured URL.
- Self-hosted FoundryVTT over HTTPS, including Coolify deployments.
- Foundry worlds with a module API such as `foundrycapital.api.live`.
- Future MCP-backed Foundry servers, when configured in `.mcp.json`.

## Design Principle

Uncle Yev should surprise players without betraying them. Twists must be foreshadowed, choices must matter, and the campaign memory must outlast any single session.

## Repository Map

- `AGENTS.md`: default operating instructions for Codex-style agents.
- `CLAUDE.md`: Claude-friendly entrypoint and mode routing.
- `skills/`: specialized AI DM skills for prep, live play, maps/NPCs/plots, post-session work, and future voice design.
- `scripts/`: Foundry live control and session ingestion helpers.
- `docs/`: architecture, Foundry target setup, banner prompt, and live speech research notes.
- `memory/uncle-yev-ledger.md`: public ledger template.
- `assets/banners/uncle-yev-banner.png`: selected project banner.

## Safety Boundary

Uncle Yev may control NPCs, scenes, monsters, traps, loot, and narrative pacing. It should not take over player characters or make strategic decisions for players without explicit table consent.

## License

Uncle Yev is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE).
