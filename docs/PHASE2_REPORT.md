# Phase 2 — approved B L3 production integration

Phase 2 implements the approved Playful Pixel Arcade title/ready, optional How to Play, pause, quit confirmation, 3–2–1 resume countdown, result and rematch layouts. It stops here. No Eventmatic embedding or changes to `eventmatic-rae-birthday`.

Delivery branch: `codex/shot-pixel-ui-phase2`.

Rollback baseline: `a35ec89cd0e2cea1b223d2f8b0e59f370839d086`. Revert only the separate Phase 2 commit to return to it. The Phase 0 preview and `PIXEL_UI_DESIGN.md` remain the visual source of truth.

## Implementation and files

- `arcade-screens.js`: approved B frames, gold result hierarchy, titles, portraits, configured rule copy and result values. A single cached 396 × 532 overlay; bounded 256-entry text/glyph caches. Latin bitmap font and the approved cached 14 px CJK raster treatment, integer scaling, measured fitting/wrapping and ellipses for extreme names. Full names and exact results remain in the accessible canvas description.
- `game.js`: route existing states through that renderer; delegate native pointer actions to existing state functions. Two reused semantic buttons, one delegated click listener and one optional ready-navigation key listener for the canvas lifetime, removed on renderer replacement. Original global keyboard handlers still own Enter/Space/Escape/M/movement, including when a menu button has focus. H/B open optional Help/Back without changing initial focus or the original shortcut semantics. No mandatory step before starting. The H/B shortcuts affect only the ready presentation and ignore typing in input fields.
- `index.html`: load the L3 module. Production audio/config/assets and the Phase 1 renderer/sprites remain unchanged.
- `tests/phase2*`, `tools/serve_phase2.py`, `tools/verify_phase2_scope.py`: reproducible actual-engine assertions, trusted browser checks, fixtures and source verification. Capture pages use `mute=1&music=0` and close their verification-only AudioContext; the test harness routes both independent SFX and music speaker outputs through a zero-gain sink while analysers inspect the upstream audio signal. System output was also muted at the user's request; production defaults are unchanged.
- `docs/PHASE2_BASELINE.md`, this report, screenshot index, evidence, integration-plan/design-system status and `design-preview/rules-audit.json`: delivery records. The existing untracked `design-preview/screenshots.zip` is excluded.

One verified rendering defect was corrected: resizing the ready screen cleared its canvas before the first round because `lastTime` was unset. The existing resize function now redraws the L3 presentation as well. Scaling dimensions and resize timing are unchanged. The renderer also restores the current HUD accessibility summary after countdown/rematch rather than retaining an overlay description.

## Functional and source regression

**124/124 pass:** 75 original rules/pushing/audio/music/SFX/pause/headless-play checks, 15 Phase 1 visual checks, and 34 Phase 2 checks. The baseline passes 90/90. [Full results](evidence/phase2/results/current-regression.json), [summary](evidence/phase2/results/acceptance-summary.json).

The L3 checks cover direct Enter start from either ready presentation; Space not starting ready; pause/input clearing; frozen world; quit/cancel via pointer and keyboard; unchanged countdown clock; restoring the live HUD description; abandoned rounds with no result/penalty; rematch reset; draw; 0, fractional 1.5, singular 1, large 100000 and capped 1.5 results; configured Chinese units; long Latin and Chinese names (including 3× repeated names); bounded layout and full accessible names; mute shortcut; and repeated navigation. The capped explanation uses `MIN(cap, FLOOR(total / step) × rate)` and the displayed quantity always comes from the engine result.

Trusted H/B presses open instructions and return to title ([evidence](evidence/phase2/results/trusted-help-navigation.json)). Trusted browser keyboard/pointer checks also confirm focused Start+Space stays ready; Enter starts; Space pauses/resumes; Escape cancels quit; the actual three-second countdown resumes; and global Enter confirms quit even with Back focused. A trusted pointer rematch at 2× then pauses with zero floors and zero SHOT pool. [Navigation](evidence/phase2/results/trusted-navigation.json), [projector rematch](evidence/phase2/results/trusted-projector-rematch.json).

**3,145 deterministic snapshots match**, with identical 55-event sequence and RNG state. All platform types, scripted movement/pushing, seeded rounds and pause/countdown are covered, including position, velocity, health, floors, beers, attachments, platform timers and character animation state. [Comparison and canonical trace hashes](evidence/phase2/results/deterministic-comparison.json). Raw traces remain reproducible under `/tmp/shot-phase2/evidence` rather than committing ~19 MB.

The source verifier protects **84 files and 61 functions**. Phase 1 `arcade-visuals.js` and `sprites.js`, audio, config, bridge, all assets, original regression tests, physics/state functions and public lifecycle APIs are byte-identical. Character drawing/animation and all original keyboard/focus/touch handlers are byte-identical. [Source verification](evidence/phase2/results/scope-verification.json).

The representative L1 gameplay draw also matches at **0 differing pixels** with identical raw RGBA SHA-256 hashes at 396 × 532. Each fixture clears the canvas before the draw: this excludes old L3 overlay residue retained in transparent wall seams, which was the only initial comparison difference. No L1/L2 visual code was changed. [Pixel comparison](evidence/phase2/results/l1-pixel-comparison.json).

One initial unseeded audio fixture let a newly generated floor catch one of two falling players. The verification runner now seeds floor generation identically for baseline/current; original tests and production spawning were not edited. Final seeded runs pass.

## Performance and lifecycle

Final local in-app browser, 1920 × 1080 viewport, 792 × 1064 canvas, ~18 seconds:

- **59.95 FPS**, 1,080 frames; synchronous frame p95 **0.40 ms**, p99 **0.60 ms**, maximum **0.80 ms**; no rAF intervals over 25 ms.
- **32 simultaneous cosmetic cues**, 4,320 emissions; the existing fixed pool replaces the oldest cue when saturated. Successive 180-frame means are 0.248–0.279 ms, without a progressive slowdown in this run.
- L3 performs no panel rebuild during gameplay: one initial title build for the entire stress run, two fixed listeners, bounded caches. Gameplay calls only the constant-time hide/summary guards.
- Resume countdown: **59.96 FPS**, 181 frames, p95 **0.40 ms**, maximum **0.90 ms**, exactly three panel builds for the three numerals.
- 100 L3 navigation/round cycles reuse the same two buttons and two listeners with **zero listener additions**. A separate 100 reset/quit/rematch cleanup test ends every round with zero active effects and zero retained anchors; first/last 20 mean frame costs are 0.015/0.005 ms, within coarse timer resolution. No progressive accumulation was observed.

These are host/browser measurements, including physics and synchronous draw submission, not separate GPU measurements or a guarantee for every venue computer. [Effects stress](evidence/phase2/results/current-projectorPerformance.json), [countdown](evidence/phase2/results/current-l3Performance.json), [cleanup](evidence/phase2/results/current-cleanup.json).

## Visual validation and limitations

[Actual screenshot index](PHASE2_SCREENSHOTS.md): all eight L3 presentations at 1× and 2×, plus Chinese/long names, zero/large/capped results, countdown 2/1 and 720p/1080p projectors. Result and rematch intentionally use the same approved screen: the existing one-second cooldown hides the rematch action, then reveals it.

- Native 396 × 532 is retained. Desktop/native captures use 396 × 640 browser space to include the existing attribution below the playfield. The canvas remains 396 × 532.
- 1280 × 720 projector: 396 × 532 at 1×, centered with pillarboxing. 1920 × 1080: 792 × 1064 at 2×, centered with pillarboxing. No shaft stretching. Every L3 label has measured bounds checks; capture metrics show no layout overflow. [All-screen metrics](evidence/phase2/results/capture-metrics.json), [edge/projector metrics](evidence/phase2/results/edge-capture-metrics.json).
- Short Chinese names retain the approved larger name treatment. Extreme names are visually abbreviated and remain complete in accessible descriptions. CJK raster shape depends on the available system fallback font; a licensed dedicated pixel CJK font is still a future separately approved asset decision.
- The approved 7 px secondary captions remain small at 1×, especially on a 720p projector. Critical result quantity/unit stay dominant. Physical viewing distance, brightness and contrast still require a venue check; screenshots cannot establish those conditions. The existing attribution may sit below the 1080p viewport while the complete game canvas remains visible.
- Tablet/phone remain review-only; no unsupported mobile gameplay controls were added. Real-time gameplay is not claimed to be fully screen-reader accessible.

## Reproduce

Create `/tmp/shot-phase2/baseline` from `git archive a35ec89`, then run `python3 tools/serve_phase2.py 8768 /tmp/shot-phase2/baseline`. Open `http://127.0.0.1:8768/tests/phase2.html` and use **Run complete Phase 2 acceptance**, then **Projector effects performance** at 1920 × 1080 and **Countdown performance**. Reports are written to `/tmp/shot-phase2/evidence`. Run `python3 tools/verify_phase2_scope.py /tmp/shot-phase2/baseline` and `python3 design-preview/audit_rules.py` for source/config checks.

Actual screen fixtures are `/tests/phase2-capture.html?screen=title`, with `howto`, `pause`, `quit`, `countdown`, `result`, `rematch`, `draw` or `gameplay`; optional `names=chinese|long`, `total=0|2000000`, `cap=1.5`, and countdown `digit=2|1`. They drive real production state transitions and rendering, without modifying the production game to manufacture screenshots.
