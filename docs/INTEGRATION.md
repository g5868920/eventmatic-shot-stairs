# Eventmatic integration interface (not yet wired)

The game is standalone. A future Eventmatic module can drive it through `window.ShotStairs`
(defined in `eventmatic-bridge.js`) either in the same page or from a parent page via an iframe.

```js
ShotStairs.configure({ penalty: { floorsPerStep: 10, shotsPerStep: 0.5, maxShots: 5 }, platform: { width: 80 }, beer: { spawnChance: 0.2 } });
ShotStairs.on('roundEnd', function (result) {
  // result.loser: 'p1' | 'p2' | null (draw)
  // result.floors: { p1, p2, total }
  // result.penalty: shots, a multiple of shotsPerStep (default 0.5), result.penaltyUnit: string
  // result.beers: { p1, p2 }, result.life: { p1, p2 }
});
ShotStairs.start();          // start / resume
ShotStairs.reset();          // abort and start a fresh round
ShotStairs.getState();       // { running, players: [...], lastResult }
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
