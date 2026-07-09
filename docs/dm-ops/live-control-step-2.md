# Live Control Step 2

Live control should be added after the between-session prep flow is stable and the Foundry MCP Bridge is connected to the active world.

## Goal

Give Codex a real-time operating surface for table play without making it unsafe or noisy.

## Event Inputs

- Foundry chat log.
- Active scene state.
- Token positions and conditions.
- Player roll requests and results.
- Uploaded transcripts or recordings.
- GM commands from chat, terminal, Discord, or Telegram.

## Command Classes

Safe by default:

- Summarize what just happened.
- Suggest NPC reactions.
- Draft read-aloud text.
- Search journals or compendia.
- Request public or private rolls after visibility is confirmed.

Requires explicit GM confirmation:

- Move NPC tokens.
- Apply conditions or damage.
- Switch scenes.
- Create or reveal a journal.
- Add monsters to the current scene.

Requires table consent:

- Control a player character.
- Speak as a player character.
- Make strategic decisions for a player.

## Implemented Live Bridge

The `foundrycapital` module now exposes a GM-only live API:

```text
game.modules.get("foundrycapital").api.live
```

Available live methods:

- `getLiveSnapshot()` returns active scene, tokens, HP, hidden state, combat, users, recent chat, live log, and queued commands.
- `sayAsGM(content, options)` posts as Codex DM.
- `sayAsNpc(actorName, content, options)` posts as an NPC actor.
- `setScene(sceneName)` activates a scene.
- `moveToken(tokenName, x, y, sceneName?)` moves a token.
- `setTokenHidden(tokenName, hidden, sceneName?)` hides or reveals a token.
- `applyDamage(actorName, amount)` subtracts actor HP.
- `toggleCondition(tokenName, condition)` toggles a Foundry status effect.
- `ensureLiveUser(password, "Codex DM")` creates or updates a separate GM user for Codex.
- `queueCommand(command)` and `approveCommand(id)` keep a confirmation-ready command queue.

Local command wrappers:

```bash
npm run live:snapshot
npm run live:say -- --message "Read-aloud text"
npm run live:npc -- --actor "Inspector Vellum" --message "Unauthorized competence is a public hazard."
npm run live:scene -- --name "Scene Name"
npm run live:move -- --token "Seal-Hound" --x 2300 --y 900
npm run live:hide -- --token "Seal-Hound" --hidden false
npm run live:damage -- --actor "Credential Inspector" --amount 5
npm run live:condition -- --token "Credential Inspector" --condition prone
```

Current live user:

```text
Codex DM
```

The live user is a GM account protected by the configured Foundry admin password. This avoids locking the human `Gamemaster` user during sessions.

## Session Recording Inbox

The local inbox workflow remains available for transcripts and recordings:

- Watch the active campaign repo `raw/foundry/live-inbox/` directory for transcript text.
- Produce `raw/foundry/session-reports/YYYY-MM-DD.md`.
- Create or update a Foundry session journal through MCP.
- Maintain a command queue for live actions that need GM confirmation.

Implemented local foundation:

```bash
npm run session:ingest
```

Supported inbox files:

- `.txt`
- `.md`
- `.json` with `title`, `transcript` or `notes`, and optional `recording`

The script writes a session report and archives the source into the active campaign repo `raw/foundry/transcripts/`.

Do not automate player control until the group has agreed on the rule.
