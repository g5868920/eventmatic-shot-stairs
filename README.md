# SHOT the Stairs (eventmatic-shot-stairs)

Two-player browser version of 小朋友下樓梯 / NS-SHAFT for Eventmatic parties, built on
[iPel/NS-SHAFT](https://github.com/iPel/NS-SHAFT) (Apache-2.0). Both players fall down the
same shaft; the first one to run out of life or drop off the bottom loses, and the round
screen turns the *combined* floors into a configurable drinking penalty.

## Play

Static files only, no build:

```bash
python3 tools/serve.py 8765
```

then open http://127.0.0.1:8765/ (or open `index.html` directly). The canvas scales to the
window, so a full-screen browser on a projector works as is.

| | Left | Right |
|---|---|---|
| 1P (black) | ← | → |
| 2P (blue) | Z | X |

Space / Enter starts, resumes or restarts.

## Rules (unchanged from the original except where noted)

* Floors rise; walk off the edge to fall to the next one. Spiked ceiling −5 life, spike floor −4, every safe landing +1 (max 10). Spring, conveyor and flipping floors behave as in the original.
* **Beer mug** (new): a mug spawns on a random floor (`beer.spawnChance`), heals `beer.healAmount`, and counts in the HUD ×N. It never changes the penalty.
* **Round end** (new): the first player to die loses. The panel shows the loser, `1P a + 2P b = total floors` and the penalty from `penalty.floorsPerDrink` (rounding, min/max and unit configurable, or a custom formula). Both dead in the same step = draw.

## Configure

Edit `config.js`, or append URL parameters (`?floorsPerDrink=8&beerChance=0.2&beerHeal=4&unit=shot`),
or call `ShotStairs.configure({...})`. See `docs/INTEGRATION.md`.

## Repository layout

```
index.html, game.js, config.js, eventmatic-bridge.js   the game
bg.png, led.png, icon.png                               upstream assets
vendor/ipel-ns-shaft/                                   pristine upstream snapshot (baseline)
docs/CANDIDATE_COMPARISON.md   why this upstream was chosen
docs/LICENSES.md               code + asset audit
docs/MODIFICATIONS.md          what changed vs upstream, remaining differences
docs/INTEGRATION.md            future Eventmatic hook-up
tests/headless-play.js         console-driven bot play test
tools/serve.py                 tiny static server
```

## License

Apache-2.0. Upstream copyright iPel; modifications copyright Eventmatic. See `LICENSE` and `NOTICE`.
