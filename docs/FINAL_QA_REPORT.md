# SHOT the Stairs — final independent QA

2026-11-13 · branch `codex/shot-pixel-ui-phase2` · reviewed `a35ec89` (Phase 1) + `46fde19` (Phase 2) against `8fc7181`; later fixes `a6ed3ea` (draw / projector / overflow) and `8e3bd5d` (character library) re-verified.

## Verdict: PASS WITH CONDITIONS

Ready for real two-player testing. The one P1 found in review (background music restarted when a key was pressed while paused) is fixed in a follow-up commit. Remaining conditions: venue projector, audio hardware and non-Chrome browsers are not yet verified.

## Measured results (this review) vs prior Codex claims

| Item | Codex claim | Measured here |
|---|---|---|
| Functional checks | 124/124 | 124/124 (harness) at `46fde19`; 136/136 after the music fix (+11 character checks, +1 pause check) |
| Original 75 checks, production config, real network recordings, unseeded | — | 75/75 twice |
| Deterministic snapshots vs `8fc7181` | 3,145 identical | 3,145 identical, 55 events and RNG equal (after `a6ed3ea` only the new `shotPool` result field differs) |
| Source scope verifiers | pass | pass at `46fde19` (they now flag the approved fixes, as expected) |
| Effects stress, 32 cues | 59.95 FPS, p95 0.40 ms | 1920×1080: 59.95 FPS, p95 0.4, max 0.9 ms; 1280×720: 59.95, p95 0.4, max 0.8; 0 intervals > 25 ms |
| Independent lifecycle script (25 rematches, pause/quit mid-round, blur/visibility, invalid transitions, listeners) | — | all pass except music-start count (the P1, now fixed) |

## Defects

**P1 fixed — music restarted during pause.** Repro: start a round, wait a few seconds, press Space, then any key (Esc, an arrow, Space to resume): the BGM restarted from 0 s and played under the pause / quit screens. Root cause: the `audio.js` unlock handler called `startMusic()` on every keydown while music was wanted, and during a pause no source plays. Pre-existing since `1756930`, not from Phase 1/2. Fix: the audio layer tracks the game's pause; unlock never starts music while paused, and otherwise resumes a held position before starting fresh (also covers a context still locked at resume). `pause-tests.js` gained a check (keys on the pause / quit screens) and now asserts resume is not a restart; both fail on the old `audio.js` and pass now. Verified: paused at 2.52 s through arrows / C / Esc / Esc, resumed at 2.52 → 2.84 s with one start; quit stops; a new round restarts from the top; a locked context resumes from 8.31 s on the next key.

**P1 fixed (`a6ed3ea`)** — draw showed `PENALTY 1.5 SHOTS`; projector layout small and top-aligned. **P2 fixed (`a6ed3ea`)** — short Chinese loser name touched `LOSES!` at 720p.

**P2 open** — long Chinese names sit 3 px under `ROUND OVER`; HUD `SHOTS` caption touches the SHOT POOL frame (same in the approved preview); mirrored lettering on Ariel's hat / Ken's cap when walking left (not legible at 48 px).

## Gameplay and visual regression

No gameplay regression: physics, pushing, damage, beer, platforms, controls and SHOT values trace-identical to `8fc7181`. Cosmetic observers add no event subscriptions; one push cue per contact, re-arming after separation; one hurt event / sound per hit. Production L1/L2/L3 screens match the approved B preview; 150 result-screen layouts (Latin / Chinese / long names, 0 – 1e21 shots, loss / draw) stay inside the panel without overlaps.

## Next steps for human playtesting

1. On the venue computer and projector, full-screen Chrome: check readability of 7 px captions from the back row, brightness, and audio level of BGM vs effects.
2. Play 10+ real rounds with two people on one keyboard: simultaneous keys (some keyboards drop key combinations), pushing feel, pause / quit, character choice, rematch.
3. Pre-download the two NS-SHAFT recordings to `assets/audio/local/` if the venue network is unreliable.

## Not verified

Physical projector and viewing distance, venue audio, two humans live, Firefox / Safari, touch devices, multi-hour sessions.
