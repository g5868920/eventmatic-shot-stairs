# Modifications relative to upstream iPel/NS-SHAFT

Upstream: https://github.com/iPel/NS-SHAFT @ 03a2b16 (unmodified copy in `vendor/ipel-ns-shaft/`).
Modified engine: `game.js` (was `main.js`). Every changed region carries a `// SHOT:` comment.
`diff vendor/ipel-ns-shaft/main.js game.js` is the authoritative list.

## Preserved unchanged

* Stage size (360×480 playfield), floor height and spacing (width: see below), gravity, control speed, conveyor speed, spring timing, fake-floor timing, floor generation odds (50 % normal, 10 % each of fake / spike / conveyor-left / conveyor-right / spring), ceiling spikes.
* Life model: 10 bars, ceiling −5, spike floor −4, +1 on every non-spike landing, hurt blink. Fall off the bottom = dead.
* Difficulty: floor speed +10 % per level, one level every 50 floors (upstream formula kept verbatim).
* 20 ms physics sub-stepping, pause-on-tab-hidden, "continue" / "play again" button, Space/Enter to start, canvas auto-scaling to the window, touch controls.
* Rendering of all floor types, background and hero sprite.

## Changed

| Area | Change |
|---|---|
| Players | `hero` → `heroes[2]`. Hero takes `{id,label,keys,sprite,color}`; per-hero key state, `floors`, `beers`, `isDead()`. Both start on the centred first floor. Players do not collide with each other (upstream has no player collision either). |
| Input | Key handling by `KeyboardEvent.code` with a keyCode fallback; 1P ←/→, 2P Z/X (configurable). Keys released on window blur. Touch halves still drive 1P. Analytics and WeChat share scripts removed from `index.html`. |
| Loop | Floors move once per step, then each hero is resolved (`updateFloorsVerticalPosition` + `updateHeroVerticalPosition`). Ceiling check and horizontal update run per hero. |
| Shared floors | A fake floor already turning is not re-armed by a second landing; a hero standing on a floor whose height reached 0 is dropped. Spring/conveyor behaviour unchanged. |
| Level | `updateScore` only raises the shared level (`>` instead of `!=`) so the trailing player cannot lower the speed. |
| Floor tracking | `hero.floors` = deepest floor sequence number landed on. Result reports `p1`, `p2` and `total = p1 + p2`. |
| Beer | `Floor.beer` flag set at generation with probability `beer.spawnChance` (never on spike floors when `onlySafeFloors`). Landing on it heals `beer.healAmount` (capped at 10), increments the player's ×N counter, fires `beer` event. It does not touch the penalty. |
| Round end | Ends as soon as any hero is dead. Loser = the dead player; both dead in the same 20 ms step = draw. `buildResult()` → `roundEnd` event and on-screen panel (loser, `1P a + 2P b = total floors`, penalty). |
| Penalty | `computePenalty(total)` = clamp(round(total / floorsPerDrink)) with `roundUp`, `minDrinks`, `maxDrinks`, or a custom `compute` function; unit label configurable. |
| HUD | Top bar is 52 px (was 30). "2P LIFE" left, "1P LIFE" right in a pink pixel font, 12 yellow pips over a red baseline, centre mug × accumulated penalty units (`computePenalty(p1.floors + p2.floors)`). Redrawn every frame. |
| Rendering | Whole visual layer replaced with original pixel-art PNG sheets (`assets/`, built by `tools/build_sprites.py`, loaded by `sprites.js`): purple playfield, blue brick walls drawn *outside* the 360-px playable area (canvas 396 px, playfield translated by `WALL_WIDTH`), white ceiling spikes, stone / blue-brick / steel-spike / conveyor / spring platform skins, two capped-kid character sheets (256×64, eight 32×32 frames; drawn around the unchanged 26-px collision box), PNG beer mug, pixel-font HUD and result panel. Skins are mapped from mechanics in `config.skins` and never change behaviour. `imageSmoothingEnabled=false` + `image-rendering: pixelated`. Upstream `bg.png`/`led.png` are no longer used. |
| Life | `MAX_LIFE = 12` (upstream 10) to match the reference's 12 segments. Ceiling −5, spike −4, +1 per safe landing unchanged. |
| Platform width | `FLOOR_WIDTH = 64` (upstream 100), approved by Eventmatic on 2026-11-12 to match the reference's platform-to-spacing ratio (docs/PROPORTIONS.md). Platform sprites regenerated at 64 px; spawn range follows (x ∈ [0, 296]). Spacing, odds, speeds and damage unchanged. |
| API | `Game.configure/getConfig/start/reset/getState/computePenalty`, `Game.on('roundEnd'|'beer'|'gameStart')`; `Game._debugFrame/_debugWorld` for tests. `window.ShotStairs` wrapper in `eventmatic-bridge.js`. |
| Config | `config.js` (`window.SHOT_CONFIG`) with URL-parameter overrides. |

## Known differences from the reference / open items

* Compared in `docs/reference/side-by-side-final.png`. Platforms are now 64 px of the 360-px playfield (18 %), matching the reference's ≈ 18 %. The kids are drawn in 32-px frames around the 26-px `HERO_WIDTH` box (visible figure 22×28 px), matching the reference's child-width-to-platform ratio (0.22 vs 0.23) without touching collisions.
* Floor x spawn range changed from upstream's [−50, 310] to [0, STAGE_WIDTH − FLOOR_WIDTH] so every platform lies fully inside the 360-px play area (Eventmatic P0, 2026-11-12). Platform width, spacing, odds and physics are unchanged.
* Hero spawn height is now derived from the start floor (upstream used `STAGE_HEIGHT - FLOOR_DISTANCE`, which with the 52-px HUD band put the heroes 4 px *inside* the start floor so they fell through it on round start).
* The frame loop clamps a negative time delta to zero (only reachable with synthetic test clocks).
* See docs/PROPORTIONS.md for the measured reference-vs-build ratios.
* Skin mapping per Eventmatic: blue brick = stable normal floor (`config.skins.normal`), beige/brown stone = upstream flipping floor (`config.skins.fake`). While the flipping floor turns, the solid part keeps the stone skin and the turned part is drawn faded.
* Colours are estimated from projector photos; the HUD font is an original 5×7 pixel font, not the reference's.
* A single shared cooldown of 1 s before "play again" is accepted (upstream behaviour).
* Touch input only controls 1P.
