# Candidate repository comparison

Evaluated on 2026-11-12. Every repository was cloned and read; the three browser candidates were also run.

| | iPel/NS-SHAFT | explooosion/Phaser-ES6-NS-Shaft | ShengWei0528/downstairs-canvas-game | BookGin/ns-shaft | ryanwang522/NS-Shaft | wacamoto/NS-Shaft-Tutorial (found during research) |
|---|---|---|---|---|---|---|
| Runs in a browser | Yes, vanilla JS + canvas, no build | Yes, but Phaser CE 2.10 + webpack 3 + Babel 6 (2018 toolchain) | Yes, single HTML file | **No** (C++ / Qt 5.8 desktop app) | **No** (Java Swing, socket networking) | Yes, Phaser 2.6.2 from CDN |
| Platform types | normal, spring, conveyor L/R, spike, fake (flipping) floor, spiked ceiling | normal, trampoline, conveyor L/R, nails, fake | normal, spring, spike (no conveyor, no fake) | normal, spike, conveyor L/R | normal, spike, spring, conveyor (per README) | normal, trampoline, conveyor L/R, nails, fake |
| Life / damage / recovery | 10 bars; ceiling −5, spike floor −4, +1 per safe landing, hurt blink | 10; ceiling −3, nails −1, +1 per normal landing | none: any spike = instant death | 12; ceiling −5 | similar to original | 10; ceiling −3, nails −3, +1 per normal landing |
| Two-player support | No (single `hero`) | No | No | **Yes** (key `2` toggles, 1P ←/→, 2P Z/X, health left+right) | Yes, but networked across two machines | **Yes**, local, shared playfield, winner text |
| Physics / camera | time-stepped (20 ms sub-steps), gravity, floor-rise speed increases by level | Arcade physics, constant 2 px/frame rise | delta-time, speed ramps per floor | 50 ms fixed timer | frame timer | 2 px/frame |
| Visual style | pixel-art sprite sheet for the hero, pixel cloud background, vector-drawn floors in the original monochrome look, monospace HUD | pixel-art sprites for everything (player + all floor types) | flat coloured rectangles | hand-drawn stick figures | sprites from another student repo | same sprites as explooosion |
| Code license | **Apache-2.0** (LICENSE in repo) | MIT (code) | MIT | **none** | **none** | **none** |
| Asset license | shipped in the Apache-2.0 repo by the author (`bg.png`, `led.png`, `icon.png`); no third-party attribution given | sprites and sounds copied from wacamoto's tutorial, which has **no license** → unusable without permission | no asset files (all canvas drawing) | images in repo, no license | images in repo, no license | no license |
| Dependencies | none | phaser-ce, webfontloader, 20 dev deps, Cordova | none | Qt | JDK | Phaser CDN |
| Code size | 1 011 lines in one file | ~650 lines across 14 modules + build config | 611 lines | ~600 lines C++ | 122 files | 290 lines |
| Effort to reach the brief | Add 2nd player (hero → array), HUD, beer, result screen: **small** | Fix 2018 build, replace all assets, add 2nd player: **medium–large** | Add life system, conveyors, fake floors, 2nd player, HUD: **large** | Full rewrite to JS: **very large** | Full rewrite: **very large** | Replace all assets + no license to reuse code: **blocked** |

## Original vs clones

The original NS-SHAFT (Nagi-P Software, 1996, freeware but not open source) is a single-player game whose floors rise faster the deeper you get, with normal, spring, conveyor, spike and flipping floors and a 10-ish segment life bar. None of the candidates is the original; iPel's clone is the one that reproduces the complete floor set and the life/recovery loop most completely in a browser.

## Selection

**iPel/NS-SHAFT** was selected because it needed the least total work and is the only browser candidate whose code *and* shipped assets have a clear license:

1. Complete original floor set and life model already implemented and tuned (time-stepped physics, difficulty levels).
2. Apache-2.0 for the whole repository, including its three images.
3. Zero dependencies and no build step, so it runs from any static host and scales itself to the window (projector friendly).
4. The engine is one closure where the single `hero` global could be turned into a two-element array without touching floor physics.

explooosion's Phaser port has nicer pixel-art floors, but its sprites come from an unlicensed tutorial and its toolchain no longer builds cleanly on current Node; ShengWei's file is clean but is missing most of the original mechanics; BookGin and ryanwang522 are not web games at all.

wacamoto's tutorial `multiplayer/index.js` is the closest existing two-player implementation (shared playfield, Z/X-style second player, winner message) and was used as a behavioural reference for the two-player rules, but it carries no license and was not copied.
