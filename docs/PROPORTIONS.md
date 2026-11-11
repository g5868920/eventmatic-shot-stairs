# Playfield proportions: reference vs build (2026-11-12)

Measured by hand on the projector photos (`docs/reference/original-01-hud-and-gameplay.png`,
1067×851; frame of the game ≈ x 160–1005, HUD y 95–210, spikes at y ≈ 215–245, bottom cut off by the
photo) and on the build at its native 396×532 canvas. Photo numbers are ±5 %.

| Quantity | Reference (px in photo) | Reference ratio | Build (px) | Build ratio |
|---|---|---|---|---|
| Frame width incl. walls | 845 | 1 | 396 | 1 |
| Wall width (each) | 40 | 4.7 % of frame | 18 | 4.5 % |
| HUD band height | 115 | 13.6 % of frame width | 52 | 13.1 % |
| Platform width | ≈ 150 | 17.8 % of frame | 100 | 25.3 % |
| Platform height | ≈ 25 | 3.0 % | 12 | 3.0 % |
| Vertical floor spacing | ≈ 155–160 | ≈ 1.05 × platform width | 60 | 0.60 × platform width |
| Child height | ≈ 55 | 0.35 × spacing, 0.37 × platform width | 28 | 0.47 × spacing, 0.28 × platform width |
| Child width (body, no brim) | ≈ 35 | 0.23 × platform width | 22 | 0.22 × platform width |
| Floors visible top to bottom | ≈ 4–5 (photo cut) | | 8 | |
| Visible playfield aspect (w:h) | ≈ 1 : 0.85 or taller (cut) | | 1 : 1.21 (360×480 play area, 396×532 canvas) | |

## Reading

* Walls, HUD band, platform *thickness* and the child's *width* relative to a platform now match the
  reference within a few percent.
* The one structural difference is **platform width relative to floor spacing**: the reference's
  platforms are about as wide as the gap between floors (1 : 1.05); upstream NS-SHAFT uses 100 px
  platforms on 60 px spacing (1 : 0.6). Every other ratio that looks off (platforms "too wide" for the
  view, floors looking dense, the viewport looking tall) follows from this single pair of
  collision constants, `FLOOR_WIDTH` and `FLOOR_DISTANCE`.
* The build is therefore *not* unusually tall by itself: its canvas (1 : 1.34) is close to the
  reference's visible frame once the photo's cut-off bottom is accounted for. It shows more floors
  because the floors are closer together in platform units.
* The child cannot be made taller to match the reference's 0.37 × platform-width height without
  exceeding the reference's 0.35 × spacing height (it is already 0.47 × spacing). The chunkier
  redraw matches the width ratio instead, which is what reads on screen.

## What would close the gap (not done — gameplay change)

Setting `FLOOR_WIDTH` ≈ 64 (and regenerating the 100 px platform sprites at 64 px) would put the
platform : spacing ratio at the reference's 1 : 0.94 and the view at 5.6 platform widths wide
(reference 5.1). It narrows every landing target by a third, so it is a difficulty change and
needs Eventmatic's sign-off; nothing else in the engine would need to move.

## Display scaling

The canvas keeps its 396 : 532 aspect and scales uniformly to the window (`resizeCanvas`), with
nearest-neighbour sampling. On a 16 : 9 projector it is pillar-boxed at full height; the artwork is
never stretched.
