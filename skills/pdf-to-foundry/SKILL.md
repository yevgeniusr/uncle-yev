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
- Do not generate campaign maps, portraits, tokens, handouts, or other visual play aids as SVG/vector placeholders. Use actual raster image generation and save project-bound assets as PNG/WebP/JPEG. SVG is acceptable only for upstream Foundry/core system icons that were not generated for the campaign.

## Workflow

1. Identify target system, Foundry world/module, party level/count, conversion scope, and output path.
   - If the user says an existing Foundry campaign/world already exists, treat its player characters as authoritative. Do not create, overwrite, or "helpfully complete" PC actors unless the user explicitly asks for a character-creation flow.
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
5. Generate or adapt maps/visuals where needed, with no embedded text unless labels are requested. Use image generation for campaign visuals; do not substitute hand-authored SVGs, diagram placeholders, or vector mockups for maps, portraits, or tokens.
6. Seed Foundry through the best available target:
   - direct Foundry module/API or MCP bridge
   - structured JSON files for the campaign repo
   - browser automation
   - manual import instructions
   - upload raster campaign assets with `npm run upload:foundry-assets` after setting `FOUNDRY_CAMPAIGN_ROOT`
7. Run the play-readiness gate before declaring done.

## Foundry Asset Uploads

Use `npm run upload:foundry-assets` to upload generated PNG assets through a GM browser session when direct server file access is unavailable.

Rules:

- Set `FOUNDRY_CAMPAIGN_ROOT` to the campaign repo before uploading.
- The command uploads `raw/assets/maps/*.png` and `raw/assets/portraits/*.png` into the active Foundry world under `worlds/<world-id>/assets/<campaign-slug>/`.
- Confirm the active world title before seeding actors, scenes, or journals. Uploading files is reversible; seeding documents into the wrong world is not.
- Save the generated `raw/foundry/upload-report.json` and include its world id, world title, base path, and verified counts in the session handoff.

## Iterative Hardening Loop

For a full adventure conversion, do not stop after the first generated package. Run a tight prep loop until no critical gaps remain:

1. Generate the campaign repo artifacts and Foundry JSON.
2. Run the Uncle Yev prep builder against the target campaign root.
3. Validate JSON shape, asset paths, scene dimensions, NPC completeness, trap completeness, and session runbook coverage.
4. Inspect failures as skill/process failures, not only one-off data bugs. Patch this skill or its references when the miss could recur.
5. Regenerate or repair artifacts.
6. Rerun the builder and validator.
7. Run a betabots-style readiness pass with GM/player personas when a live browser product run is not applicable.

Record each loop in the campaign repo under `.betabots/`, `raw/foundry/pdf-imports/.../source-notes/`, or `wiki/log.md` so future agents know what was checked and what remains blocked.

Minimum validator checks:

- Every referenced map and portrait asset exists at the path Foundry will use.
- No campaign-generated visual asset is `.svg`; generated maps, portraits, tokens, and handouts must be raster images produced through an image-generation workflow.
- Every scene has width, height, grid, token starts, walls or wall notes, lighting or lighting notes, exits, read-aloud text, linked context, and an explicit trap/hazard value even when the answer is "none".
- Every NPC has a portrait, want, fear/secret, voice, relationship map, three table lines, Foundry stats, tactics, morale, and loot/carry notes.
- Every trap has trigger, detection, disable, effect, save/damage, counterplay, reset/depletion, and foreshadowing clues.
- Every item has where it appears and either a mechanical effect, table value, or vehicle/handout purpose.
- Existing player actors are preserved. Generated content should add NPCs, scenes, journals, items, traps, and handouts only.

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
