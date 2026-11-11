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

Character look: `characterSkin.mode` in `config.js` switches between the classic kids and the custom Gina / Rae portrait prototype (`?skin=classic` or `?skin=custom&skinHeight=40` for a quick look). See docs/CHARACTERS.md.
Background music: "8 Bit Retro Game Music" by moodmode (Pixabay); see docs/AUDIO.md for credits, license and Content ID notes.

## Rules (unchanged from the original except where noted)

* Floors rise; walk off the edge to fall to the next one. Platforms are 80 px wide by default (`platform.width`, upstream 100), and each new platform is placed within falling reach of the one above. Spiked ceiling −5 life, spike floor −4, every safe landing +1 (max 12). Spring, conveyor and flipping floors behave as in the original.
* **Pushing** (new): players are solid to each other. Walking into the other player pushes them along at walking speed, even off a platform edge, where they fall normally. Equal opposite pushes cancel. Walls stop the pushed player. No damage or knockback from contact.
* **Beer mug** (new): a mug spawns on a random floor (`beer.spawnChance`) and heals `beer.healAmount`. It never changes the penalty.
* **HUD**: 2P LIFE left, 1P LIFE right (12 segments), and in the centre a beer mug × the shots so far: `floor((1P floors + 2P floors) / 10) × 0.5`, so 10 floors = 0.5, 20 = 1, 30 = 1.5. It starts at 0. Rate (`penalty.floorsPerStep`, `penalty.shotsPerStep`) and an optional cap (`penalty.maxShots`) are configurable.
* **Round end** (new): the first player to die loses. The panel shows the loser by name (`players.pN.name`, else the custom character, else 1P/2P), `1P a + 2P b = total floors` and, largest, the shots with "LOSER'S PENALTY". Both dead in the same step = draw. Click PLAY AGAIN or press Enter to rematch.

## Configure

Edit `config.js`, or append URL parameters (`?floorsPerStep=10&shotsPerStep=0.5&maxShots=5&platformWidth=80&beerChance=0.2&beerHeal=4&unit=shot`),
or call `ShotStairs.configure({...})`. See `docs/INTEGRATION.md`.

## Repository layout

```
index.html, game.js, config.js, eventmatic-bridge.js   the game
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
