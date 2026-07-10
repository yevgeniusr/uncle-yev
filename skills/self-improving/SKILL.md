---
name: self-improving
description: Use when user feedback, corrections, failures, repeated workarounds, or validation gaps suggest a reusable Uncle Yev improvement.
---

# Self-Improving Uncle Yev

## Priority

Resolve the user's immediate task first. Self-improvement must not replace, delay, or distract from the requested outcome.

## Detect Signals

After meaningful work, scan for:

- explicit user feedback or correction
- a reproducible bug or failed verification
- a workaround that should become a supported workflow
- repeated manual effort that can be made deterministic
- a gap between source data, generated output, and live behavior
- a missing safety, privacy, or quality gate

## Classify Before Proposing

- **Campaign-specific:** update the private campaign wiki or runbook; do not upstream private story state.
- **Environment-specific:** improve deployment documentation only when the lesson generalizes.
- **Reusable Uncle Yev defect:** continue when the issue affects other users or campaigns.
- **Speculative or one-off:** record the observation, but do not create a pull request.

Require reproduction evidence or a clear root-cause trace. Search the repository, existing issues, and existing pull requests to deduplicate the proposal.

## Propose Clearly

Tell the user:

1. the signal detected
2. the demonstrated root cause
3. why the fix belongs upstream
4. the files and behavior that would change
5. the regression or verification plan

Do not claim a general lesson from taste alone. When feedback is subjective, propose a documented heuristic rather than pretending it can be mechanically proven.

## Implement And Publish

For a bounded, evidence-backed improvement:

1. Work from a clean isolated branch or worktree; preserve unrelated local changes.
2. Add a failing regression test before code. For skill changes, encode the required policy in a focused contract test.
3. Make the smallest reusable change and run focused plus full verification.
4. Inspect the diff for secrets, credentials, personal data, copyrighted source material, and private campaign content.
5. Open a draft pull request when GitHub authentication and push access are available.
6. Report the PR URL, verification, residual risk, and any maintainer decision still required.

If publishing is blocked, leave a verified branch or patch and state the exact blocker.

## Authority Boundary

- Never merge, approve, release, close, or force-push the pull request.
- Never weaken safety or permission rules in the name of convenience.
- Never include secrets or private campaign data in fixtures, logs, commits, or PR text; use minimal synthetic reproductions.
- Never open multiple PRs for the same root cause. Extend or reference existing work instead.
- Default to draft status. A human maintainer decides whether the change is accepted and released.

## PR Body

Include: signal, root cause, reusable impact, change, privacy review, verification, and residual risk.
