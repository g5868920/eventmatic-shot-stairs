# 1 Player (Solo) mode

2026-11-13 · optional; **2 Players — Versus stays the default** and is unchanged.

## Using it

On the title screen choose **1 PLAYER - SOLO** or **2 PLAYERS - VERSUS**: ↑ / ↓, the 1 / 2 keys, or click. Enter starts as before. A rematch keeps the mode; Esc on the result screen (or quitting from pause) returns to the title, where mode and characters can change. Solo uses 1P's arrow keys and 1P's character (← / → or the small arrows pick any of the seven friends). `?mode=solo`, `mode` in `config.js`, or `ShotStairs.setMode('solo')` on the title screen.

## How it works

`CONFIG.mode` ('versus' | 'solo') is the choice for the next round; the round on screen is defined by the heroes that exist. Solo creates exactly one hero (id `p1`) in the middle of the start floor; no second player, AI or hidden state. Everything that iterated over heroes (input, physics, landing, damage, beer, pause, round end) works unchanged. Code that assumed two players now uses the heroes present: floor totals, the field counter, the HUD, the result, and contact cues (skipped with one player; pushing already required two).

Speed progression is untouched: base 0.10 px/ms, +10 % of base per level, a level every 50 floors from the deepest landing, no cap. In solo the only landings are the solo player's, so the speed follows that player's depth alone.

## Solo vs Versus differences

| | Versus | Solo |
|---|---|---|
| Players / keys | 1P ← →, 2P Z C | 1P ← → only (Z / C inert) |
| Start position | both sides of the start floor | centre of the start floor |
| Pushing, contact cue | yes | none (no second player) |
| Speed driven by | deeper of the two players | the solo player |
| HUD | 2P LIFE · SHOT POOL · 1P LIFE | SOLO RUN floor count · SHOT POOL · 1P LIFE |
| SHOT pool | from combined floors | same conversion of the player's floors |
| Round ends | first death (draw if both in the same step) | the player's death |
| Result | `NAME LOSES!` / `DRAW!`, loser's penalty | `GAME OVER`, floors completed, SHOT pool, level reached |
| `roundEnd` result | `mode: 'versus'`, loser / winner / draw | `mode: 'solo'`, `player: 'p1'`, loser / winner `null`, `draw: false`, only `p1` / `total` in floors / beers / life, `penalty` = `shotPool` = the player's tally |
| How to Play | two columns, push and loser rules | one column; "it gets faster every 50 floors" |

Health (12), damage (spikes −4, ceiling −5), landing +1, beer +3, gravity, movement, platform spacing and odds, audio, music and pause are identical. Both results now also carry `level`. Character choice in solo may use 2P's character (nothing is skipped).

## Verification

- `tests/solo-tests.js` 11/11: one player on start; arrows move 40 px / 200 ms, Z / C inert, mode locked during play; floors = deepest landing; rise speed 0.10 → 0.11 at 50 → 0.12 at 100 → 0.20 at 500 floors; solo HUD; spikes, beer 5 → 9, spring, flip, conveyor; pause / countdown; death → GAME OVER with floors and shot tally, one `roundEnd` / `playerDown`; rematch keeps solo; Esc to title; solo → versus (two players, pushing) → solo without leaked state; no errors.
- Harness 147/147 (all previous suites + character + solo). Versus deterministic trace vs `8fc7181`: 3,145 snapshots, events and RNG identical apart from the added `mode` / `level` / `shotPool` fields.
- Screenshots: `docs/evidence/solo/` — mode selection (solo / versus), solo gameplay 1080p, solo How to Play, solo Game Over, versus gameplay.
