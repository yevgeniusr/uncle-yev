# Foundry Targets

## Local Foundry

Default candidates:

- `http://localhost:30000`
- `http://127.0.0.1:30000`
- `http://localhost:3000`

Use local browser automation or MCP when running on the same machine.

## Self-Hosted Foundry

Default variables:

```bash
FOUNDRY_URL=https://your-foundry.example.com
FOUNDRY_ADMIN=...
FOUNDRY_LIVE_USER="Codex DM"
```

For Coolify, read environment variables through the Coolify API or CLI without printing secrets.

## Bridge Preference Order

1. Purpose-built Foundry module API exposed in the world.
2. Foundry MCP bridge.
3. Browser automation through Playwright.
4. Manual instructions for the human GM.

## Live Actions

Supported first-class actions:

- snapshot
- chat as GM
- chat as NPC
- switch scene
- move token
- hide/reveal token
- apply damage
- toggle condition
- roll dice
- queue command for confirmation
