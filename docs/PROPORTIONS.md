# Playfield proportions: reference vs build (2026-11-12)

Measured by hand on the projector photos (`docs/reference/original-01-hud-and-gameplay.png`,
1067×851; frame of the game ≈ x 160–1005, HUD y 95–210, spikes at y ≈ 215–245, bottom cut off by the
photo) and on the build at its native 396×532 canvas. Photo numbers are ±5 %.

| Quantity | Reference (px in photo) | Reference ratio | Build (px) | Build ratio |
|---|---|---|---|---|
| Frame width incl. walls | 845 | 1 | 396 | 1 |
| Wall width (each) | 40 | 4.7 % of frame | 18 | 4.5 % |
| HUD band height | 115 | 13.6 % of frame width | 52 | 13.1 % |
| Platform width | ≈ 150 | 17.8 % of frame | 64 (was 100) | 16.2 % |
| Platform height | ≈ 25 | 3.0 % | 12 | 3.0 % |
| Vertical floor spacing | ≈ 155–160 | ≈ 1.05 × platform width | 60 | 0.94 × platform width |
| Child height | ≈ 55 | 0.35 × spacing, 0.37 × platform width | 28 | 0.47 × spacing, 0.44 × platform width |
| Child width (body, no brim) | ≈ 35 | 0.23 × platform width | 22 | 0.34 × platform width |
| Floors visible top to bottom | ≈ 4–5 (photo cut) | | 8 | |
| Visible playfield aspect (w:h) | ≈ 1 : 0.85 or taller (cut) | | 1 : 1.21 (360×480 play area, 396×532 canvas) | |

## Reading

* With `FLOOR_WIDTH = 64` (approved by Eventmatic on 2026-11-12, previously upstream's 100) the
  platform : spacing ratio is 1 : 0.94 against the reference's 1 : 1.05, the view is 5.6 platform
  widths wide (reference 5.1), and walls, HUD band and platform thickness match within a few percent.
* The child is now slightly *larger* than the reference relative to a platform (0.34 vs 0.23 of its
  width, 0.47 vs 0.35 of the spacing). This is the trade-off of keeping the 26-px collision box and
  the 32-px art; shrinking the figure would move it away from the reference's chunky look.
* This is a gameplay change: landing targets are a third narrower than upstream's. Gravity, speed,
  spacing, odds and damage are unchanged.

## Display scaling

The canvas keeps its 396 : 532 aspect and scales uniformly to the window (`resizeCanvas`), with
nearest-neighbour sampling. On a 16 : 9 projector it is pillar-boxed at full height; the artwork is
never stretched.
