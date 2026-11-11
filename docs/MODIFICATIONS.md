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
| Players | `hero` → `heroes[2]`. Hero takes `{id,label,keys,sprite,color}`; per-hero key state, `floors`, `beers`, `isDead()`. Both start on the centred start floor: 2P (red/pink) on the left, 1P (blue/green) on the right. |
| Pushing | `resolvePlayerPush` runs each physics step after both heroes' horizontal moves and before vertical moves. Existing 26×26 boxes; only when they overlap vertically. Push force = walking input; the overlap a push creates goes to the other player in proportion to the two pushes (walker moves a standing player, equal pushes cancel, deterministic). Overlap nobody pushed into (belt drift, falling beside) is eased apart at 0.1 px/ms per player. Walls clamp the pushed player. Pushed players leave a floor by upstream's edge rule and fall normally. No damage or knockback. |
| Input | Key handling by `KeyboardEvent.code` with a keyCode fallback; 1P ←/→, 2P Z/C (configurable), bound to the player, not the screen side. Keys released on window blur. Touch halves still drive 1P. Analytics and WeChat share scripts removed from `index.html`. |
| Loop | Floors move once per step, then each hero is resolved (`updateFloorsVerticalPosition` + `updateHeroVerticalPosition`). Ceiling check and horizontal update run per hero. |
| Shared floors | A fake floor already turning is not re-armed by a second landing; a hero standing on a floor whose height reached 0 is dropped. Spring/conveyor behaviour unchanged. |
| Level | `updateScore` only raises the shared level (`>` instead of `!=`) so the trailing player cannot lower the speed. |
| Floor tracking | `hero.floors` = deepest floor sequence number landed on. Result reports `p1`, `p2` and `total = p1 + p2`. |
| Beer | `Floor.beer` flag set at generation with probability `beer.spawnChance` (never on spike floors when `onlySafeFloors`). Landing on it heals `beer.healAmount` (capped at 10), increments the player's ×N counter, fires `beer` event. It does not touch the penalty. |
| Round end | Ends as soon as any hero is dead. Loser = the dead player; both dead in the same 20 ms step = draw. `buildResult()` → `roundEnd` event and on-screen panel (loser, `1P a + 2P b = total floors`, penalty). |
| Result screen | Loser shown by name (`players.pN.name`, else the custom character, else 1P/2P; long names are shortened, "LOSES!" kept). Hierarchy: name, floors line, large mug + shots (gold, up to 5x text), "LOSER'S PENALTY". Dark-purple overlay over the frozen playfield (HUD untouched), `PRESS SPACE TO REMATCH` under the button, and a mouse click on the button restarts (Space / Enter / tap unchanged). Texts configurable in `config.text`; penalty value unchanged. Screens in docs/reference/result-screen/. |
| Penalty | `computePenalty(total)` = `floor(total / floorsPerStep) * shotsPerStep` (default 10 and 0.5: 10 floors = 0.5 shot), optional `maxShots` cap or a custom `compute`; starts at 0, no minimum. `formatShots` prints 0, 0.5, 1, 1.5. HUD and result panel use the same function. |
| HUD | Top bar is 52 px (was 30). "2P LIFE" left, "1P LIFE" right in a pink pixel font, 12 yellow pips over a red baseline, centre mug × accumulated penalty units (`computePenalty(p1.floors + p2.floors)`). Redrawn every frame. |
| Rendering | Whole visual layer replaced with original pixel-art PNG sheets (`assets/`, built by `tools/build_sprites.py`, loaded by `sprites.js`): purple playfield, blue brick walls drawn *outside* the 360-px playable area (canvas 396 px, playfield translated by `WALL_WIDTH`), white ceiling spikes, stone / blue-brick / steel-spike / conveyor / spring platform skins, two capped-kid character sheets (256×64, eight 32×32 frames; drawn around the unchanged 26-px collision box), PNG beer mug, pixel-font HUD and result panel. Skins are mapped from mechanics in `config.skins` and never change behaviour. `imageSmoothingEnabled=false` + `image-rendering: pixelated`. Upstream `bg.png`/`led.png` are no longer used. |
| Audio | `audio.js` plays original synthesised hurt / fall / death sounds. The engine only fires `hurt` (in `Hero.hurt`) and `playerDown` (at round end, cause `health` or `fall`); see docs/AUDIO.md. | Also `spring` (fired when a spring launches a player) and `flip` (once per flipping platform when it starts to turn) for the extra sound effects; the existing `beer` event drives the pickup sound.
| Character animation | Custom skins can use animated sheets (`characterSkin.animated`): `Hero.animFrame` picks idle / walk / fall / land / hurt from state the game already tracks (onFloor, direction, hurtTime, a landing timestamp kept only for drawing). Sheets built by `tools/build_custom_anim.py`. |
| Character skins | `CONFIG.characterSkin` ('classic' or 'custom', prototype). Custom portraits (Gina 2P, Rae 1P) are drawn by `Hero.drawSkin` over the unchanged 26×26 hitbox: foot anchor on the box centre, feet on the box bottom, optional mirroring, 1 px walk bob, transparency blink when hurt. Sprites built by `tools/build_custom_skins.py`. |
| Life | `MAX_LIFE = 12` (upstream 10) to match the reference's 12 segments. Ceiling −5, spike −4, +1 per safe landing unchanged. |
| Platform width | `CONFIG.platform.width` (default 80 px, upstream 100; 64 was tried and judged too narrow). Each floor stores its own `width`, used by landing, walk-off, drawing and beer placement; the start floor is at least `platform.startMinWidth`. Sprites are 80 px and drawn 3-slice (end caps + tiled middle) so other widths stay crisp. With `platform.guaranteeReach` each new floor is placed uniformly within falling reach of the one above (90 % of the sideways drift possible during a 60 px fall), so narrower platforms never create an uncrossable gap. Spacing, odds, speeds and damage unchanged. |
| API | `Game.configure/getConfig/start/reset/getState/computePenalty`, `Game.on('roundEnd'|'beer'|'gameStart')`; `Game._debugFrame/_debugWorld` for tests. `window.ShotStairs` wrapper in `eventmatic-bridge.js`. |
| Config | `config.js` (`window.SHOT_CONFIG`) with URL-parameter overrides. |

## Known differences from the reference / open items

* Compared in `docs/reference/side-by-side-final.png` (64 px build). At the 80 px default, platforms are 22 % of the playfield against the reference's ≈ 18 %. The kids are drawn in 32-px frames around the 26-px `HERO_WIDTH` box (visible figure 22×28 px), matching the reference's child-width-to-platform ratio (0.22 vs 0.23) without touching collisions.
* Floor x spawn range changed from upstream's [−50, 310] to [0, STAGE_WIDTH − width], further limited by the reach guarantee so every platform lies fully inside the 360-px play area (Eventmatic P0, 2026-11-12). Platform width, spacing, odds and physics are unchanged.
* Hero spawn height is now derived from the start floor (upstream used `STAGE_HEIGHT - FLOOR_DISTANCE`, which with the 52-px HUD band put the heroes 4 px *inside* the start floor so they fell through it on round start).
* The frame loop clamps a negative time delta to zero (only reachable with synthetic test clocks).
* See docs/PROPORTIONS.md for the measured reference-vs-build ratios.
* Skin mapping per Eventmatic: blue brick = stable normal floor (`config.skins.normal`), beige/brown stone = upstream flipping floor (`config.skins.fake`). While the flipping floor turns, the solid part keeps the stone skin and the turned part is drawn faded.
* Colours are estimated from projector photos; the HUD font is an original 5×7 pixel font, not the reference's.
* A single shared cooldown of 1 s before "play again" is accepted (upstream behaviour).
* Touch input only controls 1P.
* Upstream's landing rule lets a walker drop through a seam between two floors at exactly the same height. Generated floors are always 60 px apart vertically, so this never happens in play; the push tests use single wide test floors for that reason.
