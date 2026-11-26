# The Dark Truth Behind Black Friday

A ~52s vertical short built with this engine, in the same shape as `example-anthropic-ipo/`: two cut-out
characters (Milo, Daisy) acting across six scenes with voice-synced captions, camera moves and a hard-cut loop
ending. This one leans into a darker true-crime-style look instead of the money-explainer palette.

## How it was made

1. **Script** — written from a scene-by-scene brief (hook → the lie → the dark truth → the cover-up → payoff →
   CTA), each scene tagged with an accent colour (neon red / police blue / gold).
2. **Voice** — [ElevenLabs](https://elevenlabs.io) text-to-speech, one call per line:
   - Daisy: *Sarah* (`EXAVITQu4vr4xnSDxMaL`) — confident, reassuring
   - Milo: *Liam* (`TX3LPaxmHKxFdv7VOQHJ`) — energetic, social media
   Each line was requested from `/v1/text-to-speech/{voice_id}/with-timestamps` so word-level timing came back
   with the audio — no separate forced-alignment step was needed.
3. **Timing** — the per-line clips were converted to WAV, sped up 1.25x with ffmpeg's `atempo` filter (pitch
   preserved) to tighten the pacing, concatenated with ~0.06s of silence between lines, and the alignment
   timestamps were rescaled by the same 1.25x to build `data/lines.json` / `data/words.json`.
4. **Scenes** (`src/shots.js`) — three.js sets: a dark spotlight stage (hook/cover-up/payoff/CTA, reused across
   shots via prop visibility toggling), a neon storefront with a canvas-drawn ledger that "wipes" from red to
   black ink and then cracks, and a desaturated blue 1950s street with a small crowd and a cop character
   (built from the same stick-figure rig, with a `cap` accessory).
5. **New engine addition** — a `cap`-accessory look was reused for the cop; everything else (ledger, neon signs,
   banner, confetti, the spinning clock, the colour-wash overlay) is drawn with the existing `canvasPlane` /
   `ctx` 2D-overlay tools already in `src/kit.js`, no new core engine code was needed.
6. **Captions** — `src/main.js`'s caption highlight colour was made time-dependent (`accentColorAt(t)` in
   `shots.js`) so the currently-spoken word highlights in the active section's accent colour instead of a fixed
   yellow.
7. **Music** — two procedural beds from `audio-tools/make_music.py` (`lofi` under the hook/lie/truth sections,
   `bounce` from the cover-up onward), crossfaded with ffmpeg's `acrossfade` into one `audio/music.wav`, then
   mixed with narration + SFX cues via `tools/mix_cc.py`.
8. **Render** — `node tools/capture.mjs video renders/black-friday.mp4` (full 4K, default preset).

## Reuse

Copy this folder, swap `script.json` + the dialogue in `audio/tts` generation step, and restyle `src/shots.js`'s
sets/colours for a new topic — the stage/crowd/ledger-style canvas-plane techniques here generalize to most
"two characters explain something dark/surprising" shorts.
