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
window with one uniform scale and is centred, so a full-screen browser on a projector works as is:
2× whole pixels at 1920 × 1080, filled to the full height (about 1.35×, nearest-neighbour) at 1280 × 720.
`?fit=integer` (or `display.fit` in `config.js`) keeps whole-pixel multiples only.

| Player | Left | Right |
|---|---|---|
| 1P (blue cap, green shirt; starts on the right) | ← | → |
| 2P (red cap, pink shirt; starts on the left) | Z | C |

| Key | Action |
|---|---|
| Enter | start a round from How to Play; rematch after Game Over; confirm quitting |
| Space | pause / resume (resume runs a 3-2-1 countdown); never starts or restarts a round |
| Esc | from the pause screen: quit-round confirmation (Esc again = back) |
| M | mute / unmute all sound |

Controls belong to the player, not to a side of the screen, so they keep working after the players swap places.
The game opens on a pixel-art How to Play screen; losing window focus or hiding the tab pauses a running round.
A quit round has no winner, no loser and no penalty.

Modes: **2 PLAYERS - VERSUS** (default) or **1 PLAYER - SOLO**, chosen on the title screen with ↑ / ↓, 1 / 2 or a click (`?mode=solo`). Solo uses 1P's arrow keys; same physics, damage, beer and speed progression; the round ends at that player's death with GAME OVER and the floors reached. Esc on the result screen returns to the title. See docs/SOLO_MODE.md.

Characters: seven friends (Gina, Rae, Ariel, Cindy, Ken, Linda, Sandy) in `assets/characters/custom/characters.js`; any of them can play 1P or 2P. On the title screen 2P picks with Z / C and 1P with ← / → (or click the small arrows); Enter starts as usual and the choice stays for rematches. Defaults: 1P Rae, 2P Gina (`characterSkin` in `config.js`; `?skin=classic` for the original kids). Gina and Rae are animated; the other five use their static sprite. See docs/CHARACTERS.md.
Background music: "8 Bit Retro Game Music" by moodmode (Pixabay); see docs/AUDIO.md for credits, license and Content ID notes.

## Rules (unchanged from the original except where noted)

* Floors rise; walk off the edge to fall to the next one. Platforms are 80 px wide by default (`platform.width`, upstream 100), and each new platform is placed within falling reach of the one above. Spiked ceiling −5 life, spike floor −4, every safe landing +1 (max 12). Spring, conveyor and flipping floors behave as in the original.
* **Pushing** (new): players are solid to each other. Walking into the other player pushes them along at walking speed, even off a platform edge, where they fall normally. Equal opposite pushes cancel. Walls stop the pushed player. No damage or knockback from contact.
* **Beer mug** (new): a mug spawns on a random floor (`beer.spawnChance`) and heals `beer.healAmount`. It never changes the penalty.
* **HUD**: approved B heart LIFE blocks and names (2P left, 1P right; 12 segments), central SHOT POOL / SHOTS and a separate combined-floor indicator. The penalty remains: `floor((1P floors + 2P floors) / 15) × 0.5`, so 15 floors = 0.5, 30 = 1, 45 = 1.5; only completed 15-floor steps count (29 floors = 0.5, no rounding up). It starts at 0. Rate (`penalty.floorsPerStep`, `penalty.shotsPerStep`) and an optional cap (`penalty.maxShots`) are configurable.
* **Round end** (new): the first player to die loses. The panel shows the loser by name (`players.pN.name`, else the custom character, else 1P/2P), `1P a + 2P b = total floors` and, largest, the shots with "LOSER'S PENALTY". Both dead in the same step = draw: "DRAW - REMATCH", no shots for anybody (`result.penalty` is 0; the calculated pool stays in `result.shotPool` as a statistic and resets with the rematch). Click PLAY AGAIN or press Enter to rematch.

Phase 1 B gameplay visuals and cosmetic feedback are integrated. See [the verification report](docs/PHASE1_REPORT.md) and [screenshots](docs/evidence/phase1/index.html). Phase 0 remains the visual source of truth; Phase 2 screens require separate approval.

## Configure

Edit `config.js`, or append URL parameters (`?floorsPerStep=15&shotsPerStep=0.5&maxShots=5&platformWidth=80&beerChance=0.2&beerHeal=4&unit=shot`),
or call `ShotStairs.configure({...})`. See `docs/INTEGRATION.md`.

## Repository layout

```
index.html, game.js, config.js, eventmatic-bridge.js   the game
arcade-visuals.js                                       B rendering and bounded cosmetic effects
sprites.js, assets/*.png                                original pixel art (built by tools/build_sprites.py)
docs/CHARACTERS.md                                      how to swap character sheets
vendor/ipel-ns-shaft/                                   pristine upstream snapshot (baseline)
docs/CANDIDATE_COMPARISON.md   why this upstream was chosen
docs/LICENSES.md               code + asset audit
docs/MODIFICATIONS.md          what changed vs upstream, remaining differences
docs/INTEGRATION.md            future Eventmatic hook-up
tests/headless-play.js         five bot-played rounds (regression)
tests/push-tests.js            player-to-player pushing scenarios
tests/rules-tests.js           controls, identity, shot table, platform width and reach
tests/audio-tests.js           sound events, mute, volume
tests/music-tests.js           background music loop, fade, rematch, unlock
tests/sfx-extra-tests.js       spring / beer / flip sounds
tests/pause-tests.js           READY, pause, countdown, frozen timers, quit, rematch keys (fresh page)

Run a test in the browser console on the game page:
  eval(await (await fetch('tests/push-tests.js')).text())
tools/serve.py                 tiny static server
tools/build_sprites.py         regenerates assets/*.png from the bitmaps inside it
tools/build_custom_skins.py    builds the custom portrait sprites from assets/characters/custom/source
```

## License

Apache-2.0. Upstream copyright iPel; modifications copyright Eventmatic. See `LICENSE` and `NOTICE`.
