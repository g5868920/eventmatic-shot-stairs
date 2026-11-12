# Phase 2 — final visual QA fixes

2026-11-13 · follows `46fde19` · B — Playful Pixel Arcade unchanged

## P1 — Draw result semantics

A draw (both players down in the same step) no longer shows a penalty.

- Result panel: `DRAW!`, ribbon **DRAW - REMATCH**, **NO SHOTS / NOBODY DRINKS**, the unassigned pool (`SHOT POOL 1.5 SHOTS - NOT ASSIGNED`), the combined floor line and `POOL RESETS ON REMATCH`. Text keys `penaltyLabelDraw`, `drawShots`, `drawNote`, `drawPool`, `drawReset` in `config.js`.
- Engine result: `penalty` is `0` on a draw; the calculated pool is kept in the new `shotPool` field (equal to `penalty` when there is a loser). `computePenalty`, the HUD and normal loser results are unchanged. The bridge's `roundEnd` payload carries the same object.
- Rematch builds a fresh world as before: 12/12 LIFE, 0 floors, 0 pool.

## P1 — Projector viewport

One uniform scale, never stretched, game centred in landscape viewports:

| Viewport | Before | After |
|---|---|---|
| 1280 × 720 | 396 × 532 at 1×, top-aligned | 536 × 720 (≈1.35×), centred, full height |
| 1920 × 1080 | 792 × 1064 at 2×, top-aligned | 792 × 1064 at 2×, centred |

Rule (`resizeCanvas`): use the whole-pixel multiple when it reaches ≥ 90 % of the fitting scale; otherwise fill the height. The canvas is still drawn at a whole multiple and the browser upscales it nearest-neighbour (`image-rendering: pixelated`), so edges stay hard. `?fit=integer` / `display.fit: 'integer'` restores whole multiples only. In landscape the attribution sits in the left pillarbox; no scrollbars. Semantic button hit areas follow the canvas exactly at 1280 × 720, 1920 × 1080 and 1024 × 768.

## P2 — Text overflow

- The stacked `NAME / LOSES!` layout now places `LOSES!` below the measured name height (a short Chinese name previously touched it at 720p).
- 150 result-screen cases (short, long Latin, short/long Chinese, mixed names × totals 0–2e22 × 1P loss / 2P loss / draw): no label outside the panel, no overlapping labels, no fit issues. Large quantities step down from 12× to 5× type, and switch to `1.00e+21` notation above ten characters with the exact value in a caption.

## Verification

- Harness regressions: 124/124 (draw check updated to the new semantics; the fractional check now also asserts `LOSER'S PENALTY` and `shotPool`).
- Deterministic trace vs `8fc7181`: 3,145 snapshots, events and RNG identical except the added `shotPool` field.
- Headless Chrome captures (real page, 1× device scale): `docs/evidence/phase2-fixes/` — `draw-720p`, `draw-1080p`, `loss-1080p`, `loss-720p-chinese`, `large-720p`, `long-720p`.
