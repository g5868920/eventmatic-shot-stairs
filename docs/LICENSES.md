# Licensing and asset audit

## Code

| Component | License | Notes |
|---|---|---|
| `game.js` (derived from upstream `main.js`), `index.html` | Apache-2.0 (upstream iPel/NS-SHAFT) | Upstream LICENSE kept at repo root; attribution in NOTICE; changes documented in MODIFICATIONS.md and marked `SHOT:` in the source. |
| `config.js`, `eventmatic-bridge.js`, `tools/serve.py`, `tests/` | Apache-2.0 | New files written for this project. |
| `vendor/ipel-ns-shaft/` | Apache-2.0 | Unmodified upstream snapshot (commit 03a2b16), including its own LICENSE. Contains upstream's analytics scripts and WeChat share helper (`sns.js`) which are **not** loaded by this project. |

## Images

| File | Source | License status |
|---|---|---|
| `assets/*.png` (kids, mug, platforms, wall, ceiling) | this project | Original pixel art, generated from `tools/build_sprites.py`. Apache-2.0 with the repo. Nothing traced from the reference photos or the Flash game. |
| `icon.png` (iOS home-screen icon) | upstream repo | Apache-2.0 as distributed by iPel. Only referenced by `apple-touch-icon`. |
| `vendor/ipel-ns-shaft/led.png`, `bg.png` | upstream repo | Apache-2.0 as distributed by iPel. No longer used by the game; kept only in the pristine vendor snapshot. |

## Audio

No third-party audio files are stored in the repository. By Eventmatic's decision the hurt and fall/death sounds are the NS-SHAFT recordings loaded at runtime from their public URLs (no license stated by the hosts; not redistributed here). Original synthesised fallbacks in `audio.js` are Apache-2.0. See docs/AUDIO.md.

Background music `assets/audio/bgm-moodmode-8-bit-retro-game-music.mp3`: "8 Bit Retro Game Music" by moodmode, Pixabay Content License (no standalone redistribution; Content ID registered). Credits in `assets/audio/CREDITS.md`.

## Fonts

No font files are shipped. Text is rendered with the browser's default `monospace` family, as upstream did.

## Not used (and why)

* explooosion / wacamoto sprites and sounds: no license in the tutorial repository they originate from.
* BookGin and ryanwang522 images: no license.

## Residual risk

The game no longer ships any upstream image except `icon.png`. The reference screenshots in `docs/reference/` are photos of a proprietary Flash game kept for internal comparison only; do not publish them with the game.
