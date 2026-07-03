---
name: live-speech-design
description: "Use when researching, designing, or implementing speech-to-text and text-to-speech for Uncle Yev so he can hear players and reply during live sessions."
---

# Live Speech Design

## Goals

- Capture player speech with low latency.
- Keep transcripts for post-session memory.
- Let Uncle Yev respond by voice, Foundry chat, or GM whisper.
- Avoid interrupting players.
- Provide push-to-talk and consent controls.

## Architecture Options

1. Foundry browser module with Web Audio capture.
2. Local desktop companion using mic or system audio.
3. Discord bot for online voice tables.
4. GM push-to-talk copilot.

## Evaluation Criteria

- latency
- transcription quality
- speaker diarization
- privacy and consent
- install complexity
- works with local Foundry
- works with self-hosted Foundry
- supports post-session summaries

## Default Recommendation

Start with a push-to-talk GM copilot:

- browser or local companion records short utterances
- transcribes speech
- sends text to Uncle Yev
- Uncle Yev responds in Foundry chat or TTS

Move to always-on table listening only after consent and reliability are proven.
