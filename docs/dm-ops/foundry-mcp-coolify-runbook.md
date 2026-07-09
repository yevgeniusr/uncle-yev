# Foundry MCP And Coolify Runbook

## Current Deployment

- Coolify context: `qed`
- Service: `Foundryvtt (DND)`
- UUID: `d0gw8sos8c8sssgwk8wcosk8`
- Public URL: `https://rpg.rachkovan.com`
- Image: `felddy/foundryvtt:release`
- Internal port: `30000`
- Data path: `/data/foundryvtt`

Quick check:

```bash
npm run check:foundry
```

Manual checks:

```bash
coolify resource list --format json
coolify service get d0gw8sos8c8sssgwk8wcosk8
curl -I https://rpg.rachkovan.com
```

## MCP Bridge Setup

Local bridge repo:

```bash
/Users/mac/Desktop/projects/dnd/foundry-vtt-mcp
```

Build:

```bash
cd /Users/mac/Desktop/projects/dnd/foundry-vtt-mcp
npm install
npm run build
```

Foundry module manifest:

```text
https://raw.githubusercontent.com/adambdooley/foundry-vtt-mcp/master/packages/foundry-module/module.json
```

Required Foundry world settings:

- Enable **Foundry MCP Bridge**.
- Enable write operations when Codex is allowed to alter the world.
- Keep GM-only bridge access.
- Use WebRTC or remote mode if the MCP server is not running on the Foundry host.

## Codex Operating Boundary

Between sessions, Codex may:

- Create and update journals.
- Prepare NPCs, items, factions, quests, and scenes.
- Propose module/plugin installs.
- Check Coolify health and restart the service if asked.

During live play, Codex should require explicit table permission before:

- Taking over a player character.
- Applying irreversible actor/item changes.
- Revealing hidden GM notes.
- Deleting tokens, actors, journals, scenes, or items.

## Current Gap

Coolify CLI reports service health but does not expose one-click service logs for this Foundry resource. For deep logs, use one of:

- Coolify web terminal.
- SSH/Docker access to the Coolify host.
- A future log-forwarding sidecar.
