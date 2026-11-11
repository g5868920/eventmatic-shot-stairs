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
| `led.png` (hero sprite sheet, 240×60) | upstream repo | Distributed by iPel under the repo's Apache-2.0 license. The sprite is an original-looking 26×26 pixel character; a reverse image search was not possible offline. No contrary attribution exists in the upstream repo or README. Treated as licensed with the code. |
| `bg.png` (pixel cloud background, 360×480) | upstream repo | Same as above. |
| `icon.png` (iOS home-screen icon) | upstream repo | Same as above. Only referenced by `apple-touch-icon`. |
| Beer mug icon | this project | Drawn in code (`drawMug` in `game.js`); no file. |
| Player-2 colours | this project | Generated at runtime by recolouring `led.png` (`tintSprite`); no file. |

## Audio

No audio is shipped. Upstream has none.

## Fonts

No font files are shipped. Text is rendered with the browser's default `monospace` family, as upstream did.

## Not used (and why)

* explooosion / wacamoto sprites and sounds: no license in the tutorial repository they originate from.
* BookGin and ryanwang522 images: no license.

## Residual risk

The only assumption is that iPel owned or had rights to `led.png` and `bg.png` when publishing them under Apache-2.0. If Eventmatic wants zero exposure, both files can be replaced by in-code drawings without touching gameplay (the hero draw call is a single `drawImage`).
