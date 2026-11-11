# Modifications relative to upstream iPel/NS-SHAFT

Upstream: https://github.com/iPel/NS-SHAFT @ 03a2b16 (unmodified copy in `vendor/ipel-ns-shaft/`).
Modified engine: `game.js` (was `main.js`). Every changed region carries a `// SHOT:` comment.
`diff vendor/ipel-ns-shaft/main.js game.js` is the authoritative list.

## Preserved unchanged

* Stage size (360×480 playfield), floor size/spacing, gravity, control speed, conveyor speed, spring timing, fake-floor timing, floor generation odds (50 % normal, 10 % each of fake / spike / conveyor-left / conveyor-right / spring), ceiling spikes.
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
| Rendering | Whole visual layer replaced with original pixel-art PNG sheets (`assets/`, built by `tools/build_sprites.py`, loaded by `sprites.js`): purple playfield, blue brick walls drawn *outside* the 360-px playable area (canvas 396 px, playfield translated by `WALL_WIDTH`), white ceiling spikes, stone / blue-brick / steel-spike / conveyor / spring platform skins, two capped-kid character sheets in the upstream 240×60 layout, PNG beer mug, pixel-font HUD and result panel. Skins are mapped from mechanics in `config.skins` and never change behaviour. `imageSmoothingEnabled=false` + `image-rendering: pixelated`. Upstream `bg.png`/`led.png` are no longer used. |
| Life | `MAX_LIFE = 12` (upstream 10) to match the reference's 12 segments. Ceiling −5, spike −4, +1 per safe landing unchanged. |
| API | `Game.configure/getConfig/start/reset/getState/computePenalty`, `Game.on('roundEnd'|'beer'|'gameStart')`; `Game._debugFrame/_debugWorld` for tests. `window.ShotStairs` wrapper in `eventmatic-bridge.js`. |
| Config | `config.js` (`window.SHOT_CONFIG`) with URL-parameter overrides. |

## Known differences from the reference / open items

* Compared in `docs/reference/side-by-side-final.png`. Platforms are 100 px of the 360-px playfield (28 %) while the reference's are about 18 % of its width, and the reference character is about a third of a platform wide versus a quarter here. Both follow from upstream's `FLOOR_WIDTH` / `HERO_WIDTH` collision constants, which were deliberately left untouched; narrowing them is a gameplay change for a later decision.
* Upstream spawns floors in x ∈ [−50, 310], so a floor can emerge from under a wall; kept, because changing the spawn range alters gameplay.
* The reference's blue brick platform type is unknown mechanically; here it is only the skin of the upstream flipping floor (`config.skins.fake`).
* Colours are estimated from projector photos; the HUD font is an original 5×7 pixel font, not the reference's.
* A single shared cooldown of 1 s before "play again" is accepted (upstream behaviour).
* Touch input only controls 1P.
