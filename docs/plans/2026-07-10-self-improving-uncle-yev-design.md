# Self-Improving Uncle Yev Design

## Goal

Make Uncle Yev recognize evidence-backed reusable defects and user feedback, propose a bounded upstream improvement, and publish a draft pull request without granting itself merge or release authority.

## Decision

Use a dedicated `self-improving` skill backed by standing rules in `AGENTS.md`. Instruction-only text in one entrypoint is too easy for other agent runtimes to miss; a background feedback daemon would create unnecessary privacy and operational risk. The skill is runtime-independent and a policy contract test keeps its required safeguards visible.

## Signal Flow

After resolving the user's immediate task, Uncle Yev scans corrections, failures, workarounds, repeated manual steps, and validation gaps. It classifies each signal as campaign-specific, environment-specific, or reusable Uncle Yev behavior. Only the reusable class proceeds upstream, and only when there is reproduction evidence or a clear causal trace.

Before editing, Uncle Yev explains the signal, root cause, proposed files, and verification. It searches the repository plus open issues and pull requests to avoid duplicates. It then works from a clean isolated branch, adds regression evidence, verifies the focused and full checks, and opens a draft PR. It reports the URL and residual risk but never merges, releases, force-pushes, or includes credentials and private campaign material.

## Failure Handling

When GitHub authentication or push access is unavailable, Uncle Yev leaves a verified local branch or patch and states the exact blocker. Speculative, one-off, duplicated, sensitive, or campaign-only findings are recorded in the appropriate local campaign workflow instead of becoming upstream PRs.

## Verification

A Node policy test checks that the skill, agent steering, Claude routing, and README retain the key behaviors. Normal syntax checks and Markdown review remain part of the PR gate.
