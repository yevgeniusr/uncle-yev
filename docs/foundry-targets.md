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

1. Uncle Yev Bridge module API exposed in the world.
2. Foundry MCP bridge.
3. Browser automation through Playwright.
4. Manual instructions for the human GM.

## Bridge Installation

When the user gives Foundry credentials, Uncle Yev should not stop at "install the module yourself." Use this order:

1. Run `npm run prep:foundry` so the local bridge has fresh private campaign output.
2. If the Foundry data directory is local or mounted, run `npm run install:foundry-module`.
3. If the data directory is not in the OS default location, set `FOUNDRY_DATA_PATH` or `FOUNDRY_MODULES_PATH` and rerun the installer.
4. Restart/reload Foundry if the module was newly installed.
5. Enable **Uncle Yev Bridge** in the world. Use browser automation if credentials and UI access are available.
6. Verify with `npm run live:snapshot`.

Remote Foundry web credentials are enough to log in, inspect, and enable an already installed module. They are not enough to upload arbitrary local module files unless the module is available through a Foundry package manifest URL. If the module is missing on a remote server, request one of: server filesystem access, SSH/SFTP, hosting-panel/Coolify volume access, or a published package manifest.

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
