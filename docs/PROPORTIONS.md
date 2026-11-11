# Playfield proportions: reference vs build (2026-11-12)

Measured by hand on the projector photos (`docs/reference/original-01-hud-and-gameplay.png`,
1067×851; frame of the game ≈ x 160–1005, HUD y 95–210, spikes at y ≈ 215–245, bottom cut off by the
photo) and on the build at its native 396×532 canvas. Photo numbers are ±5 %.

| Quantity | Reference (px in photo) | Reference ratio | Build (px) | Build ratio |
|---|---|---|---|---|
| Frame width incl. walls | 845 | 1 | 396 | 1 |
| Wall width (each) | 40 | 4.7 % of frame | 18 | 4.5 % |
| HUD band height | 115 | 13.6 % of frame width | 52 | 13.1 % |
| Platform width | ≈ 150 | 17.8 % of frame | 80 (default; was 100, briefly 64) | 20.2 % |
| Platform height | ≈ 25 | 3.0 % | 12 | 3.0 % |
| Vertical floor spacing | ≈ 155–160 | ≈ 1.05 × platform width | 60 | 0.75 × platform width |
| Child height | ≈ 55 | 0.35 × spacing, 0.37 × platform width | 28 | 0.47 × spacing, 0.35 × platform width |
| Child width (body, no brim) | ≈ 35 | 0.23 × platform width | 22 | 0.28 × platform width |
| Floors visible top to bottom | ≈ 4–5 (photo cut) | | 8 | |
| Visible playfield aspect (w:h) | ≈ 1 : 0.85 or taller (cut) | | 1 : 1.21 (360×480 play area, 396×532 canvas) | |

## Reading

* Platform width is now `platform.width` = 80 px by default (2026-11-12): 64 px matched the
  reference's platform : spacing ratio best (1 : 0.94) but felt too narrow in play, so 80 px is
  the trial compromise (1 : 0.75; reference 1 : 1.05). It can be tuned per event in config.js.
* Walls, HUD band and platform thickness match within a few percent. The child is close to the
  reference relative to a platform at 80 px (0.28 vs 0.23 of its width, 0.35 vs 0.37 in height).
* Gravity, speed, spacing, odds and damage are unchanged at every width.

## Display scaling

The canvas keeps its 396 : 532 aspect and scales uniformly to the window (`resizeCanvas`), with
nearest-neighbour sampling. On a 16 : 9 projector it is pillar-boxed at full height; the artwork is
never stretched.
