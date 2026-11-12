# Eventmatic integration interface (not yet wired)

The game is standalone. A future Eventmatic module can drive it through `window.ShotStairs`
(defined in `eventmatic-bridge.js`) either in the same page or from a parent page via an iframe.

```js
ShotStairs.configure({ penalty: { floorsPerStep: 10, shotsPerStep: 0.5, maxShots: 5 }, platform: { width: 80 }, beer: { spawnChance: 0.2 } });
ShotStairs.on('roundEnd', function (result) {
  // result.loser: 'p1' | 'p2' | null (draw)
  // result.floors: { p1, p2, total }
  // result.penalty: shots for the loser, a multiple of shotsPerStep (default 0.5); 0 on a draw (nobody drinks)
  // result.shotPool: the round's calculated pool (same as penalty when there is a loser; unassigned on a draw)
  // result.penaltyUnit: string
  // result.mode: 'versus' | 'solo'; result.level: speed level reached. Solo: result.player 'p1', loser / winner null,
  //   draw false, floors / beers / life only for p1 (+ floors.total), penalty = shotPool = that player's tally
  // result.beers: { p1, p2 }, result.life: { p1, p2 }
});
ShotStairs.start();          // start a round (READY / GAME OVER); from PAUSED: resume with countdown
ShotStairs.pause();          // pause a running round
ShotStairs.resume();         // 3-2-1 countdown, then play
ShotStairs.quitRound();      // abandon without a result (no roundEnd, no penalty)
ShotStairs.reset();          // abort and start a fresh round
ShotStairs.setMode('solo');  // 'versus' (default) | 'solo', on the READY screen; a rematch keeps it
ShotStairs.getState();       // { state: 'ready'|'playing'|'paused'|'quit'|'countdown'|'over', running, countdown, players, lastResult }
ShotStairs.computePenalty(42);  // 2 (floor(42 / 10) * 0.5)
ShotStairs.setMuted(true);      // sound effects off (audio.js); setVolume(0..1)
```

Embedded in an iframe, every `roundEnd` is also posted to the parent:
`{ type: 'shot-stairs:roundEnd', result }` (no origin restriction; the payload contains only game numbers).

Quick tuning without code: `index.html?floorsPerStep=10&shotsPerStep=0.5&maxShots=5&platformWidth=80&beerChance=0.2&beerHeal=4&unit=shot`.
Platform width and penalty settings apply from the next round.

Suggested next steps when integrating: map `p1`/`p2` to Eventmatic team names via
`configure({ players: { p1: { label: 'Rae' }, p2: { label: 'Linda' } } })`, and forward
`roundEnd` into the Eventmatic scoring flow.

Events also include `pause`, `resumeCountdown`, `resume` and `roundAbandoned`.
