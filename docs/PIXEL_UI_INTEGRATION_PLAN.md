# SHOT the Stairs — production integration plan

**Status (2026-11-13): Phases 1 and 2 approved and implemented. Production integration stops after Phase 2; Eventmatic embedding is outside scope.**

Phase 1 evidence: [PHASE1_REPORT.md](PHASE1_REPORT.md). The reviewed scope below is retained.

Visual source of truth: `design-preview/` and [PIXEL_UI_DESIGN.md](PIXEL_UI_DESIGN.md). Preserve B's approved palette, pixel art, HUD hierarchy and L3 layouts. A/C are archived; no additional themes.

## Phase 1 — L1 Core Visuals + L2 Interactive Feedback

1. Port B's pure drawing primitives and tokens into the existing renderer. Preserve the 396 × 532 coordinates, 360 × 480 shaft, 18 px walls, current platform dimensions and custom character anchors/sheets. Cover stable, temporary, both conveyor directions, spring, spikes and beer. Do not port the lab's mock state or portrait relocations.
2. Apply the existing heart LIFE blocks and central **SHOT POOL / SHOTS** treatment. Keep combined floors separate. Read current config and engine values, including custom penalty formula/cap/units; compute and format SHOT through the existing engine helpers.
3. Attach six cosmetic observers to authoritative state/events. Beer: measure HP after landing regain and after pickup; show actual clamped beer recovery separately from landing recovery. Spike: observe actual hurt event. Flip: bind a small cue to its platform position and current phase. Spring: observe existing compression/release and use the local side cue. SHOT: update the value immediately. Push: latch visual contact per player pair, fire on onset, and rearm on separation; repeated contact frames emit nothing. No physics callback, force, stun or gameplay cooldown is introduced.
4. Reuse the preview's cached pixel CJK rendering and measured truncation where names need it. Keep Latin glyphs and B's typography hierarchy. Verify native 1× and projector 2×; use a licensed dedicated CJK pixel font later only if separately approved.
5. Preserve the audio event bus and all existing audio listeners. Cosmetic observers must not refire beer/spring/hurt events or affect music, mute, focus pause or timers. Reduced motion changes only rendering. Clear cosmetic latches on rematch/abandon; freeze effect age with the existing pause clock.

**Acceptance:** existing rules, pushing, audio/music, SFX, pause and headless-play regressions pass. Before/after engine state agrees for representative inputs. Verify beer 8→9→12 and clamping 9→10→12; unchanged spike/ceiling damage; flip/spring timing; push against walls/off edges/opposed input. Prove one visual push burst across sustained contact and a new burst after separation. Check 0/0.5/1/1.5/large/capped/custom SHOT outputs and both conveyor directions. No effect covers the HUD, character identity, platform edge or hazard tips.

**Deliverable:** one scoped L1/L2 change with behavior evidence and B screenshots, reviewed before Phase 2.

## Phase 2 — L3 UI Screens (implemented)

1. Apply the approved B layouts to existing ready/instructions, pause, quit confirmation, 3–2–1 countdown, result and rematch states. Preserve the state machine and Enter/Space/Escape/M controls, pointer actions, held-key resets and focus/visibility handling. Select one ready-state presentation; add no mandatory step.
2. Populate names, controls, healing/damage rules and penalty copy from the effective production configuration. Preserve custom assets. Fit Chinese/long names while keeping the loss/draw outcome explicit. Keep the result SHOT quantity and unit dominant.
3. Preserve the existing resume clock and rematch/reset paths. Add semantic action equivalents without duplicate input events. Keep all existing audio behavior.
4. Verify keyboard/pointer flows, quit/cancel/no-penalty behavior, draw/rematch and focus pauses. Check all L3 screens at 1× and 2×. Keep the portrait aspect ratio pillarboxed on 1280 × 720 and 1920 × 1080 projectors; never stretch the shaft. Tablet/phone remain review-only.

**Acceptance:** existing pause/countdown/rematch and audio regressions pass; result/config edge cases fit; projector captures show unclipped HUD, controls and penalty. Confirm physical venue readability before rollout; browser captures cannot establish viewing-distance or projector-brightness performance.

**Deliverable:** a separate L3 change after Phase 1 acceptance and final production review.

## Invariants and approval gate

Physics, pushing, platform behavior, penalty calculation, audio, controls and custom character files remain authoritative and unchanged. Implementation may add rendering adapters/observers only. Any required behavior change is outside this plan and needs a separate decision.

The user approved this integration plan and authorized Phase 1 on 2026-11-13. After reviewing Phase 1 (`a35ec89`), the user separately approved Phase 2 on 2026-11-13. See [PHASE2_REPORT.md](PHASE2_REPORT.md) for implementation, verification and screenshots. The isolated Phase 0 preview and design system remain the visual source of truth.
