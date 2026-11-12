# SHOT the Stairs — Phase 1 delivery

2026-11-13 · B — Playful Pixel Arcade · **L1/L2 complete. Phase 2 not started.**

## Implementation and rollback

Rollback baseline: `8fc7181f97a2a8662d12f89f4d2d0b89fb733c88`, recorded before implementation in [PHASE1_BASELINE.md](PHASE1_BASELINE.md). The earlier gameplay-engine commit is `1756930`. Revert the Phase 1 commit to roll back this integration; do not reset unrelated user changes. No deployment or push is part of this delivery.

- `arcade-visuals.js`: approved B tokens; cached blue bricks, brown temporary platforms, both metallic conveyor directions, green spring poses, pointed spikes, beer, walls and ceiling; cached heart LIFE / SHOT POOL HUD; separate floors; measured CJK name raster cache; player markers; six bounded cosmetic cues.
- `game.js`: small read-only observation calls around existing authoritative events/state, cached HUD integration, marker/field drawing and integer viewport scaling. The legacy HUD remains available if an embedder omits the new visual module.
- `sprites.js`: decorates floor/world/mug art after loading. Existing character PNGs, animation sheets, foot anchors and original font implementation are untouched.
- `index.html`: loads the new visual module before the sprite loader. Existing L3 screen functions and HTML interaction structure remain intact.
- Added browser test/capture fixtures, a local verification server, a read-only scope verifier, and versioned evidence. Refreshed the Phase 0 rule snapshot's source hashes; its geometry and gameplay values are unchanged.

The renderer uses no new audio/gameplay event subscriptions, timers, requestAnimationFrame loops or random numbers. It observes actual clamped HP deltas after landing recovery, reads the engine-computed SHOT quantity once per HUD draw, and uses a contact-onset latch that rearms after separation. Pauses/countdowns use the existing frozen game clock. Rematch/reset/quit all pass through world creation, which clears effect slots, anchors and latches.

The effect pool is allocated once at 32 slots. HUD art is rebuilt only when health, displayed penalty, units or identities change; static field/platform art, labels and CJK glyphs are cached. Stable-frame drawing does not create effect objects, geometry arrays, listeners or text canvases. Original engine allocations are unchanged. Cues render behind platforms, characters and name markers; close players' labels fan outward to preserve readability.

[Complete changed-file list](evidence/phase1/FILES.txt). The existing untracked `design-preview/screenshots.zip` is excluded.

## Functional verification

**Baseline: 75/75 existing checks. Integrated: 90/90 checks**, comprising the same 75 checks plus 15 focused visual checks. Final focused checks were repeated after the cue-placement correction and passed 15/15.

Existing suites executed unchanged: `rules-tests.js`, `push-tests.js`, `audio-tests.js`, `music-tests.js`, `sfx-extra-tests.js`, `pause-tests.js`, and all five bot rounds in `headless-play.js`. Real browser Canvas and Web Audio APIs were used. SFX were selected with `audioFiles=0` for reproducible synthesized output; the local MP3 BGM, volume/mute behavior, pause/resume, unlock and rematch paths were exercised. Production `audio.js` and audio configuration are unchanged.

Focused assertions cover beer 8→9→12 (+1 landing / +3 beer), clamped 9→10→12 (+2 beer), actual damage deltas, 180 sustained contact observations producing one burst, rearming after separation, 640 forced emissions remaining within 32 slots, reset/quit cleanup, pause/countdown effect freezing, CJK caches, 0/0.5/1/1.5/large/custom/capped SHOT values and units, and distinct left/right conveyor pixels.

**Deterministic before/after: 3,145 snapshots are identical**, with matching event sequence and final RNG state. The trace covers every platform type, scripted opposing/moving inputs, seeded rounds and pause/countdown. It includes coordinates, velocities, health, floors, beers, floor attachment, platform heights/timers, and character frame/blink/facing state. Raw traces are reproducible under `/tmp`; their canonical hashes and equality results are committed in [deterministic-comparison.json](evidence/phase1/results/deterministic-comparison.json).

The scope verifier also proves **36 protected files and 25 protected functions unchanged**. Character drawing/animation and input/focus/touch code are byte-identical; the physics loop is identical after removing the two cosmetic observation calls. Audio, config, all existing regression files and all assets are byte-identical. All Phase 2 screen functions are byte-identical. Source hashes are recorded in [scope-verification.json](evidence/phase1/results/scope-verification.json).

## Performance findings

Browser measurements in the local Codex in-app browser; visible document. Each timed run lasts approximately 18 seconds and uses a representative eight-platform world. Effects are forced in overlapping bursts; this is a renderer stress fixture, not a new gameplay mode. The synchronous `_debugFrame` duration includes physics and draw submission; it is not a separate GPU timing measurement.

- Final full-projector test: viewport **1920 × 1080**, canvas **792 × 1064 (2×)**, **1,080 frames**, **59.95 FPS**.
- Frame work: median **0.20 ms**, p95 **0.40 ms**, p99 **0.60 ms**, max **0.90 ms**. Target budget at 60 FPS: 16.67 ms.
- **0 sampled rAF intervals over 25 ms**, with **32 simultaneous cues** and 4,320 forced cue emissions. The fixed pool intentionally replaces oldest cues when saturated; it does not queue unbounded work.
- Successive 180-frame block means ranged **0.19–0.25 ms**, with no progressive trend in this run.
- Stress began after 100 synthetic round initializations and performed additional periodic resets to keep the engine actively drawing. The 720p run also measured approximately 59.95 FPS and 0.40 ms p95. The baseline held approximately 59.95 FPS; its original auto-fit scaling differs from B's integer scaling, so CPU times are not presented as a strictly controlled speedup comparison.
- Separate **100 reset/quit/rematch cycles** ended cleanly every time: 0 active effects, 0 retained anchored references, 0 visual subscriptions, capacity 32, stable text cache. Mean synchronous frame cost was 0.030 ms for the first 20 cycles and 0.010 ms for the last 20, with coarse browser timer precision. No visual state accumulation or progressive slowdown was observed.

These findings support the 60 FPS target on the tested browser/host. They are not a claim about every projector computer or indefinitely long sessions. Raw measurements: [1080p](evidence/phase1/results/current-projectorPerformance.json), [720p](evidence/phase1/results/current-720p-performance.json), [cleanup](evidence/phase1/results/current-cleanup.json).

## Screenshots

[Open the capture gallery](evidence/phase1/index.html). It includes native 1× gameplay (396 × 532 canvas, with the legacy footer visible), desktop 1440 × 900, projector 1280 × 720, projector 1920 × 1080, and a six-cue composite. The playfield is never stretched. The fixture uses the actual game, actual character animation assets and actual rendering routines, with staged positions/data so views can be compared fairly.

## Known limits and remaining work

- Phase 2 title/instructions/pause/quit/countdown/result/rematch screens retain their previous presentation. Applying the approved B L3 designs requires separate approval.
- At extreme saturation, the 32-slot pool replaces older cosmetic cues. Health, penalty and physics remain immediate and authoritative. The regular two-player game normally emits far fewer cues than the forced stress fixture.
- Very large penalty quantities use compact scientific notation when required to fit the HUD; the full engine-formatted value remains in the canvas accessible description.
- CJK glyph rasterization uses installed system fonts, matching the preview approach; detailed glyph shapes vary across operating systems. No new font or character assets were introduced.
- Projector browser dimensions/readability were checked. Physical viewing distance, venue brightness, output audio hardware and external network-delivered SFX are not established by these local tests. Synthesized SFX and local BGM regressions pass.
- The legacy footer can create scrollbar gutters at a full-height browser viewport. Captures may therefore omit the gutter/window trim; the measured canvas remains the correct integer size and aspect ratio.

## Reproduce

Use Python 3.9+ and a browser; no packages/build step required. From the repository root:

```sh
mkdir -p /tmp/shot-phase1/baseline
git archive 8fc7181f97a2a8662d12f89f4d2d0b89fb733c88 | tar -x -C /tmp/shot-phase1/baseline
python3 tools/serve_phase1.py 8767 /tmp/shot-phase1/baseline
```

Open `http://127.0.0.1:8767/tests/phase1.html`. Run baseline regressions/trace first, then current regressions/trace, cleanup and effects performance. For projector stress, set the browser viewport to 1920 × 1080 **after opening the test tab**, and confirm the report's `viewport` and `canvasSize`. Local reports are saved under `/tmp/shot-phase1/evidence`.

```sh
python3 tools/verify_phase1_scope.py /tmp/shot-phase1/baseline
python3 design-preview/audit_rules.py
```

For regular play, retain `python3 tools/serve.py 8765`. Custom embedders should load `arcade-visuals.js` before `sprites.js`; original embedding without it retains the legacy HUD/art.
