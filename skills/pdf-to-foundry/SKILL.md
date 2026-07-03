---
name: pdf-to-foundry
description: "Use when converting a user-provided tabletop RPG PDF, adventure PDF, campaign book, one-shot, module, or scanned adventure into a play-ready FoundryVTT campaign package with scenes, journals, actors, items, maps, traps, encounters, loot, session runbooks, and import/seeding steps."
---

# PDF To Foundry

## Goal

Turn a PDF into something a GM can run in Foundry without keeping the PDF open. Preserve source page references, compress prose into playable structure, and produce Foundry-ready artifacts rather than a summary.

## Source Rules

- Work only from PDFs the user provides or explicitly has rights to use.
- Keep page references for every extracted fact, DC, monster, item, room, and handout.
- Do not reproduce long copyrighted prose as public output. Use concise paraphrase plus page citations unless the user confirms the conversion is for private local use.
- Rebuild maps and visuals as new play aids unless the user provides permission/source assets to import directly.

## Workflow

1. Identify target system, Foundry world/module, party level/count, conversion scope, and output path.
2. Extract the PDF structure: title, table of contents, page count, chapters, keyed locations, encounters, appendices, maps, handouts, and stat blocks.
3. Create a conversion manifest with PDF path, title, file hash if practical, extraction quality, page ranges, assumptions, and missing assets.
4. Convert content into play objects:
   - campaign overview
   - factions and clocks
   - locations and keyed rooms
   - scenes and map briefs
   - NPCs and monsters
   - items, loot, traps, hazards, and roll tables
   - journals and handouts
   - session runbooks
5. Generate or adapt maps/visuals where needed, with no embedded text unless labels are requested.
6. Seed Foundry through the best available target:
   - direct Foundry module/API or MCP bridge
   - structured JSON files for the campaign repo
   - browser automation
   - manual import instructions
7. Run the play-readiness gate before declaring done.

## Extraction Notes

- If text extraction is poor, render sample pages and inspect whether OCR is needed.
- Track duplicate names carefully; adventure PDFs often reuse room titles, creature names, or appendix headings.
- Treat boxed text as tone/reference material, not something to paste wholesale by default.
- Normalize inconsistent PDF terminology into stable Foundry document names.

## Foundry Output

For the expected artifact shape and quality gate, read `references/play-ready-foundry-schema.md` when producing the conversion.

Minimum deliverables:

- `conversion-manifest.json`
- campaign/world overview
- locations and scene list
- actors/NPCs/monsters
- items/loot/traps/hazards
- journals/handouts
- session runbook for the first playable session
- Foundry seeding or import instructions

## Play-Readiness Gate

Before finishing, verify:

- Every scene has purpose, dimensions or map brief, tokens, lighting/walls notes, read-aloud summary, exits, and linked journal context.
- Every encounter has enemies, tactics, morale, scaling guidance, and failure-forward outcomes.
- Every trap has trigger, detection, disable, effect, counterplay, and reset state.
- Every NPC has want, fear/secret, voice, relationship, and at least three table lines.
- Every item has mechanical effect or table value plus where it appears.
- Session 1 can be run for 15 minutes from the generated artifacts alone.
