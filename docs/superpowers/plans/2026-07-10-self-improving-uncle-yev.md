# Self-Improving Uncle Yev Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Teach Uncle Yev to detect reusable issues and feedback, propose a verified improvement, and open a safe draft pull request.

**Architecture:** A new runtime-independent skill owns the decision and publication workflow. Entry-point steering invokes it after meaningful work, while a Node policy test prevents removal of the privacy, deduplication, draft-only, and no-self-merge safeguards.

**Tech Stack:** Markdown agent skills, Node.js built-in test runner, Git, GitHub CLI.

## Global Constraints

- Resolve the user's immediate task before upstream self-improvement work.
- Never publish secrets or private campaign content.
- Never merge, release, close, or force-push autonomously.
- Open draft pull requests only for evidence-backed reusable improvements.

---

### Task 1: Policy Contract

**Files:**
- Create: `tests/self_improvement_skill.test.mjs`
- Create: `skills/self-improving/SKILL.md`
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Repository entrypoints and skill catalog.
- Produces: Discoverable `self-improving` workflow and enforced safety language.

- [ ] Write a Node test that requires the skill and all critical safeguards.
- [ ] Run `node --test tests/self_improvement_skill.test.mjs` and confirm it fails because the skill is absent.
- [ ] Add the skill and route it from each entrypoint.
- [ ] Rerun the focused test and confirm it passes.

### Task 2: Repository Integration

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Consumes: The policy test from Task 1.
- Produces: Standard repository commands that run the policy test.

- [ ] Add `npm test` and include it in `npm run check`.
- [ ] Add an Unreleased changelog entry.
- [ ] Run `npm run check` and confirm zero failures.

### Task 3: Publish Draft PR

**Files:**
- No additional repository files.

**Interfaces:**
- Consumes: Verified branch changes.
- Produces: Draft GitHub pull request targeting `main`.

- [ ] Review the diff for private or unrelated content.
- [ ] Commit only intended files.
- [ ] Push `agent/self-improving-feedback-prs`.
- [ ] Open a draft PR describing signal detection, safeguards, and verification.
