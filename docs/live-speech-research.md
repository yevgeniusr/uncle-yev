# Live Speech Research

Research status: completed 2026-07-03.

## Goals

- Hear players in real time.
- Transcribe speech into session logs.
- Let Uncle Yev answer by voice or typed chat.
- Avoid interrupting players.
- Persist useful memory after the session.

## Candidate Architectures

1. Browser companion panel in Foundry using WebRTC and a backend session endpoint.
2. Local desktop listener that captures mic/meeting audio and sends transcript chunks to Uncle Yev.
3. Discord/voice-channel bot that joins the table audio channel.
4. Push-to-talk GM copilot, where the GM decides when Uncle Yev hears and speaks.

## Open Questions

- Is the table in person, Discord, Zoom, or Foundry AV?
- Should Uncle Yev speak aloud, write in chat, or whisper to the GM first?
- Is local/offline transcription required?

## Findings

FoundryVTT has built-in A/V conferencing using WebRTC via `simple-peer`, but its official docs note that SSL/HTTPS is required for browser security and privacy reasons. This makes a Foundry module feasible for hosted games, but local HTTP setups need a local companion or HTTPS tunnel.

OpenAI's Realtime API supports browser speech-to-speech over WebRTC. The official docs recommend WebRTC for browser and mobile clients that capture or play audio directly, and describe both voice-agent sessions and transcription sessions. Transcription sessions are appropriate when Uncle Yev should listen and produce text deltas without speaking back immediately.

Browser `SpeechRecognition` is not a strong primary dependency. MDN marks it as limited availability and notes that in Chrome audio may be sent to a server-side recognition engine, so it is not reliably offline or cross-browser.

Foundry has audio helpers around the Web Audio API, useful for playback and audio management, but microphone capture, transcription, speaker diarization, and voice activity detection still need a dedicated speech pipeline.

There are existing Foundry-adjacent modules worth studying:

- `libCaptions`: display layer for live captions; does not provide transcription itself.
- LiveKit AV Client: replaces Foundry's native A/V client with LiveKit for more robust audio/video infrastructure.
- Vox Ludorum: older speech-to-text-to-speech Foundry module powered by Azure Speech.
- VoiceGen: generates and plays token voices, useful for NPC output voice ideas.

## Recommendation

Build in phases.

### Phase 1: Push-To-Talk GM Copilot

This is the first production path.

- Foundry module panel or local web page with a push-to-talk button.
- Browser captures GM microphone.
- Backend creates an OpenAI Realtime session or transcription session.
- Transcript goes to Uncle Yev as text.
- Uncle Yev replies as a GM whisper, Foundry chat, or optional TTS preview.
- GM confirms before public speech or world-changing actions.

Why: lowest consent risk, low interruption risk, easiest to debug, works for both local and hosted Foundry.

### Phase 2: Table Listener With Consent

- Add always-on mode only after a table consent toggle.
- Stream transcript deltas into `sessions/live/`.
- Use voice activity detection and chunking.
- Summarize every 5-10 minutes into durable notes.
- Default Uncle Yev response mode remains GM whisper, not public speech.

### Phase 3: Full Voice Persona

- Uncle Yev speaks aloud with TTS.
- Route TTS either through Foundry chat audio, LiveKit, Discord bot, or local speaker.
- Add interruption controls: push-to-mute, cooldown, and "GM approval required."

## Proposed Technical Design

```text
Foundry UI panel or local companion
  -> microphone capture
  -> Uncle Yev speech backend
      -> OpenAI Realtime voice or transcription session
      -> Foundry live bridge tools
      -> memory ledger updates
  -> Foundry chat / GM whisper / optional TTS output
```

Backend responsibilities:

- keep API keys server-side
- mint Realtime sessions
- normalize transcript events
- call Foundry tools
- persist raw session chunks and compressed memory

Foundry module responsibilities:

- show consent/status indicator
- push-to-talk UI
- display captions/transcript
- expose world state tools
- play approved NPC voice output if enabled

## Source Notes

- Foundry A/V docs: https://foundryvtt.com/article/audio-video/
- Foundry `AudioHelper` API: https://foundryvtt.com/api/classes/foundry.audio.AudioHelper.html
- OpenAI Realtime WebRTC guide: https://developers.openai.com/api/docs/guides/realtime-webrtc
- OpenAI Realtime/audio guide: https://developers.openai.com/api/docs/guides/realtime
- MDN `SpeechRecognition`: https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition
- MDN WebRTC API: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- Foundry libCaptions: https://foundryvtt.com/packages/lib-captions
- LiveKit AV Client: https://github.com/bekriebel/fvtt-module-avclient-livekit
- Vox Ludorum: https://github.com/cswendrowski/FoundryVTT-vox-ludos-speech
- VoiceGen: https://github.com/tirzah2/voicegen
