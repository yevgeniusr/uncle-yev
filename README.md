# Uncle Yev

Uncle Yev is a local AI dungeon master plugin for FoundryVTT. It gives Codex, Claude, and other coding agents a reusable operating manual for campaign prep, worldbuilding, post-session processing, and live table assistance.

![Uncle Yev banner](assets/banners/uncle-yev-banner.png)

## What It Does

- Creates campaigns, converts adventures into playable prep, and builds maps, NPCs, factions, encounters, loot, traps, journals, and handouts.
- Observes Foundry state and can operate live table actions through a Foundry module API, MCP bridge, or browser automation.
- Maintains a durable campaign ledger so multi-session plots, promises, secrets, and player preferences survive between sessions.
- Detects reusable issues and feedback, proposes evidence-backed improvements, and can publish safe draft pull requests for maintainer review.
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

To compile a campaign wiki into the Uncle Yev Foundry module seed bundle:

```bash
npm run prep:foundry
```

By default this reads `../campaigns/the-unwritten-degree` and writes private generated data/assets into `foundry-module/`. Override with `FOUNDRY_CAMPAIGN_ROOT` and `FOUNDRY_MODULE_ROOT` only when targeting another campaign or another Uncle Yev module checkout.

Install the Foundry-side bridge by symlinking or copying `foundry-module/` into Foundry's `Data/modules/uncle-yev`, then enable **Uncle Yev Bridge** in the world.

For local Foundry installs, Uncle Yev can do the filesystem part himself:

```bash
npm run install:foundry-module
```

Use `FOUNDRY_DATA_PATH` or `FOUNDRY_MODULES_PATH` when Foundry's data directory is not the OS default. After install, restart/reload Foundry if needed and enable **Uncle Yev Bridge** in Manage Modules. With only remote Foundry web credentials, Uncle Yev can log in and verify/enable existing modules, but installing new local module files also requires server filesystem, hosting-panel, SSH, or package-manifest access.

For a PDF conversion, use the Claude slash command `/pdf-to-foundry` or ask:

```text
Use skills/pdf-to-foundry/SKILL.md to convert this adventure PDF into a play-ready FoundryVTT campaign package.
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
- Foundry worlds with the `uncle-yev` module enabled, exposing `game.modules.get("uncle-yev").api.live`.
- Future MCP-backed Foundry servers, when configured in `.mcp.json`.

## Design Principle

Uncle Yev should surprise players without betraying them. Twists must be foreshadowed, choices must matter, and the campaign memory must outlast any single session.

## Skills

- `offline-campaign-prep`: Builds or expands sessions outside live play with Foundry-ready scenes, NPCs, maps, encounters, traps, loot, scripts, and runbooks.
- `pdf-to-foundry`: Converts user-provided RPG PDFs into play-ready FoundryVTT campaign packages with page references, scenes, journals, actors, items, traps, loot, maps, and import steps.
- `maps-characters-plots`: Creates maps, characters, NPCs, factions, villains, monsters, loot, traps, and Uncle Yev-style twists.
- `live-foundry-dm`: Runs or assists live Foundry sessions by observing table state, speaking as NPCs, moving tokens, rolling dice, applying damage/conditions, switching scenes, and taking notes within permission boundaries.
- `post-session-processing`: Turns transcripts, recordings, chat logs, notes, and feedback into session summaries, memory updates, journal updates, NPC changes, loot logs, and next-session prep.
- `live-speech-design`: Researches or designs speech-to-text and text-to-speech support so Uncle Yev can hear players and reply during live sessions.
- `self-improving`: Detects reusable feedback and failures, separates them from private campaign issues, adds regression evidence, and opens deduplicated draft pull requests without self-merging.

## Repository Map

- `AGENTS.md`: default operating instructions for Codex-style agents.
- `CLAUDE.md`: Claude-friendly entrypoint and mode routing.
- `skills/`: specialized AI DM skills for PDF conversion, prep, live play, maps/NPCs/plots, post-session work, and future voice design.
- `foundry-module/`: the Foundry-side Uncle Yev Bridge module.
- `scripts/`: Foundry live control, campaign prep, and session ingestion helpers.
- `docs/`: architecture, Foundry target setup, banner prompt, and live speech research notes.
- `memory/uncle-yev-ledger.md`: public ledger template.
- `assets/banners/uncle-yev-banner.png`: selected project banner.

## Safety Boundary

Uncle Yev may control NPCs, scenes, monsters, traps, loot, and narrative pacing. It should not take over player characters or make strategic decisions for players without explicit table consent.

## License

Uncle Yev is licensed under the [GNU Affero General Public License v3.0 or later](LICENSE).
