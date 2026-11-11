# Visual and source audit (2026-11-12)

Reference images: `docs/reference/original-01-hud-and-gameplay.png`, `docs/reference/original-02-beer-healing-pickup.png` (authoritative), `docs/reference/current-claude-build-to-fix.png` (current build). They are phone photos of a projected screen, so colours below are corrected estimates, not pixel-exact.

## 1. Is there a substantially closer open-source implementation? — No

What the references show is the Flash-era 「是男人就下100层」 family of NS-SHAFT remakes (4399 game id 1164 and its 2P variant): metallic conveyor with round end bearings, capped kid in a pink/orange outfit, 12-segment life bars, "1P LIFE / 2P LIFE" HUD. The 4399 thumbnail shows the same conveyor and character design. That game is closed-source Flash; its art is proprietary and must not be extracted (the reference README says the same).

Every open-source clone found (GitHub search API, 89 repos across "ns-shaft", "nsshaft", "downstairs", plus web search) was checked for look, two-player support and license:

| Repo | Look | 2P | License | Verdict |
|---|---|---|---|---|
| iPel/NS-SHAFT (current base) | monochrome vector floors, pixel hero, grey clouds | added by us | Apache-2.0 incl. assets | engine keeps, visuals replaced |
| explooosion / wacamoto / mitty-fun Phaser tutorial | the only clone with coloured pixel sprites for all floor types; light grey background, no walls, text HUD | wacamoto has a 2P file | sprites unlicensed (tutorial has no LICENSE) | not reusable |
| ShengWei0528/downstairs-canvas-game | flat green/black rectangles | no | MIT | further from reference than current |
| aGameAgain/NS-SHAFT (2026) | flat coloured rectangles, Material-style panel HUD | no | MIT in package.json, no LICENSE file | further from reference |
| phanvanlong737-cyber/ns-shaft-web-remake (2026) | neon/minimal SVG, dark teal grid, robot player | no | MIT, original SVG art | different art direction entirely |
| cdfmr/NS-SHAFT-NS-TOWER | reverse-engineered original C source | no | none; Nagi-P art | not legally reusable |
| BookGin / LFsWang Qt, ryanwang522 Java, Haskell/Go/C128 ports | stick figures or text | BookGin yes | none / BSD | not browser games |
| johnny1713/ns-shaft | could not be cloned (private or removed) | – | – | – |

Nothing is visually closer than a flat-rectangle clone. The Phaser tutorial sprites are the only pixel art in the ecosystem and they cannot be used. A switch of codebase would buy no visuals and would throw away the working two-player, beer and penalty systems.

## 2. Codebase to use — keep `eventmatic-shot-stairs` on the iPel engine

Physics, floor set, life loop, two-player input, beer, floor tracking, round-end and restart are done and tested. All visual output lives in a handful of draw functions inside `game.js` (`Floor.draw` and its five subclasses, `Hero.draw`, `drawAll`, `drawTopBar`, `drawResultPanel`, the ceiling in `drawAll`, the background `drawImage`). Replacing those is a rendering-layer change; the simulation is untouched.

## 3. Can the engine be preserved? — Yes, with two small simulation-adjacent changes

* **Life 12 instead of 10.** Both reference bars have 12 segments (4 + 8 and 8 + 4), which is also the original NS-SHAFT value. `MAX_LIFE` is already a constant; damage values (ceiling 5, spike 4, +1 per landing) stay.
* **Walls.** The reference has brick walls inside the playfield. Keep the 360-px stage and clamp the heroes to an inner play area (`WALL_WIDTH` ≈ 18 px each side); floors are generated inside the same inner range. Pure constants, no physics change.

Everything else (gravity, speeds, floor odds, timings, spring/fake/conveyor behaviour, two-player rules, beer, penalty, restart, API) stays as is.

## 4. Visual elements and what each needs

| Element (reference) | Current | Work | Source |
|---|---|---|---|
| Deep purple playfield (≈ #4a2a4c, darker vignette toward the edges) | grey pixel clouds `bg.png` | solid fill + subtle 2-tone dither; drop `bg.png` | code |
| Blue textured brick walls both sides (≈ #5a6ab8 bricks, lighter mortar) | none | 18-px tiled brick strip, drawn from a bitmap | original pixel art (code bitmap) |
| White triangular ceiling spikes with light-grey shading | black-outlined white triangles on white band | redraw on purple: white/grey triangles, 12-px pitch | code |
| Beige stone platform (normal) | black dashed bar | 100×12 sprite: beige/tan speckled stone with darker bottom edge | original pixel art |
| Metallic conveyor with round bearings and moving arrow track | thin outlined track | 100×14 sprite: grey steel plate, two round end caps, animated belt stripes; arrows keep direction | original pixel art |
| Spike platform: grey steel base + grey spikes | white triangles on black bars | 100×(12+15) sprite: dark steel base, pale grey spikes | original pixel art |
| Green spring platform: two green rails with X-shaped grey coils | dashed vertical bars | 100×14 sprite with 3 compression frames (upstream already animates height) | original pixel art |
| Blue brick platform (screenshot 2, under the mug) | fake floor = grey bar | use blue brick for the fake (flipping) floor; flip animation = brick rows sliding away | original pixel art — **assumption, see §7** |
| Child characters: capped kid, pink/orange outfit; 2P must differ | upstream 26×26 blob (`led.png`) + blue tint | two new 26×26 sheets (stand, walk ×4, fall ×2, hurt row) in a cap-and-overalls style; 1P warm (pink/orange), 2P cool (blue/teal); drop `led.png` | original pixel art |
| HUD: "2P LIFE" left, "1P LIFE" right, pink/magenta italic pixel font (≈ #ff5fc8) | blue/black monospace | 5×7 pixel font drawn from bitmaps (letters L I F E P 0-9 X) | original pixel font |
| 12 yellow rounded life pips (≈ #ffe24a) over a red baseline (≈ #d0303a); empty pips = thin pale ticks | 10 square cells | redraw to spec | code |
| Beer mug + "X 25" in red (≈ #e04040) centred in the HUD | per-player mug ×N | one centred counter; see §7 for what N is | code |
| Beer mug pickup on a floor (large mug, yellow beer, white foam, handle right) | 11×10 mug | enlarge to ≈ 18×22 to match proportions | original pixel art |
| Layout: HUD band ≈ 15 % of height, play area width ≈ 80 % of frame | HUD 44/524 ≈ 8 % | HUD band to ~64 px; stage 360×(480+64) | code |
| Round-end panel | white rounded panel | restyle to purple/pink/yellow pixel look, same content | code |

Not visible in the references and therefore kept from the current build: start/continue button, result wording, touch controls.

## 5. Licensing limitations

* The reference art is proprietary (Flash game distributed via 4399 and others). Nothing may be traced or extracted from it or from the photos; the new sprites are original interpretations of the same style (purple shaft, steel/stone/green platforms, capped kid).
* Every candidate with pixel-art sprites (Phaser tutorial family) is unlicensed — not usable.
* CC0 packs (Kenney Pixel Platformer, OpenGameArt spike/spring tiles) exist but are 16/18-px tiles in a different style; mixing them would not read as the reference. Not recommended; drawing ~12 small original sprites is less work than adapting them.
* Upstream `bg.png`, `led.png` would no longer be used by the game; they stay in `vendor/` under Apache-2.0 and are listed in NOTICE as unused.
* All new art is created in this project and released under the repo's Apache-2.0.

## 6. Minimum-change implementation plan

1. **Art source of truth** — `art/sprites.txt`-style bitmaps (one character per pixel, palette per sprite) in `sprites.js`, rasterised once at load into an off-screen sprite sheet. No binary assets, diffable, license-clean. ~12 sprites: stone, conveyor (4 belt frames), spike, spring (3 frames), blue brick (3 flip frames), wall tile, mug, two 26×26 kid sheets, 5×7 font.
2. **Constants** — `MAX_LIFE = 12`, `MARGIN_TOP = 64`, `WALL_WIDTH = 18`; hero clamp and floor x-range use the inner width.
3. **Rendering** — replace `Floor.draw` bodies (5 classes), `Hero.draw` sprite lookup, background/ceiling/walls in `drawAll`, `drawTopBar`, `drawResultPanel`, `drawMug`. No change to `landing/standing/leaving`, `loop`, `judge`, `buildResult`, input, config or API.
4. **Verification** — `tests/headless-play.js` unchanged for gameplay; for visuals, capture the game at the reference's aspect, place it next to `original-01` and `original-02` in `docs/reference/side-by-side.png`, and check each row of the table above.
5. **Docs** — update MODIFICATIONS.md, LICENSES.md, NOTICE.

Estimated size: ~400 lines of sprite data + ~250 lines of drawing code; engine diff limited to three constants.

## 7. Open questions (defaults chosen if not answered)

1. **Centre counter "X 25".** The references show one shared mug counter, not one per player. Default: show the combined floors descended so far (the number that becomes the penalty), with a config switch `hud.centerCounter: 'floors' | 'beers'`.
2. **Blue brick platform.** Assumed to be the flipping/fake floor's look. If it is a plain variant of the normal floor instead, it becomes a second normal skin (one-line change).
3. **Ceiling damage 5 and spike damage 4** are kept from upstream; with 12 life the reference's 4-of-12 and 8-of-12 states are reachable either way.
