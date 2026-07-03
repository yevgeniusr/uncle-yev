# Play-Ready Foundry Schema

Use this reference when converting a PDF into Foundry-ready campaign artifacts.

## Directory Shape

Prefer this output shape inside the target campaign repo:

```text
campaign/pdf-imports/<source-slug>/
  conversion-manifest.json
  world.json
  locations.json
  scenes.json
  actors.json
  items.json
  traps.json
  quests.json
  journals.json
  handouts.json
  session-runbooks/
    session-01.md
  source-notes/
    page-map.json
    unresolved-questions.md
```

## Conversion Manifest

Include:

- source title
- PDF path
- page count
- file hash when practical
- extraction method
- extraction quality notes
- target Foundry system
- target world/module
- conversion scope
- source page ranges used
- assumptions
- missing or intentionally regenerated assets

## Scene Object

Each scene needs:

- id
- name
- source pages
- purpose
- map source or generated map prompt
- dimensions/aspect ratio
- grid size recommendation
- walls notes
- lighting notes
- weather/ambience
- token starting positions
- hidden/revealed token states
- linked locations
- linked journals
- encounters
- traps/hazards
- treasure
- exits and transitions
- read-aloud summary
- GM secrets

## Actor Object

Each actor needs:

- id
- name
- type: npc, monster, ally, neutral, villain, faction-agent
- source pages
- image prompt or source asset path
- role in adventure
- want
- fear or secret
- voice
- relationship map
- table lines
- Foundry type and system data
- stat block reference or converted stats
- tactics
- morale
- loot carried

## Item Object

Each item needs:

- id
- name
- source pages
- type
- image prompt or icon
- description summary
- mechanical effect
- charges/uses
- value
- who has it or where it appears
- future hook or consequence

## Trap Or Hazard Object

Each trap or hazard needs:

- id
- name
- source pages
- scene/location
- trigger
- detect DC and skill
- disable DC and method
- effect
- saving throw
- damage or condition
- counterplay
- reset or depletion state
- clues that foreshadow it

## Journal Object

Each journal needs:

- id
- title
- source pages
- player-visible summary
- GM-only notes
- linked scene, actor, item, or quest ids
- handouts
- checks and DCs
- secrets to reveal

## Session Runbook

Each runbook needs:

- session premise
- opening question
- starting scene
- pacing beats
- scene order
- read-aloud summaries
- likely player choices
- encounter instructions
- social scripts
- loot and rewards
- failure-forward branches
- end-state checklist
- post-session ledger prompts
