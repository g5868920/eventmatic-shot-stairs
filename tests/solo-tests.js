/**
 * Solo mode tests. Run in the browser on a freshly loaded index.html (fetch + eval), READY state, versus default.
 * Uses the real key handlers and the engine's own floor types on a synthetic 20 ms clock.
 * Results in window.__soloResults.
 */
(async function () {
  'use strict';
  window.requestAnimationFrame = function () { return 0; };
  var T = Game._debugTypes, raw = performance.now() + 2e5, rows = [], errors = [];
  window.addEventListener('error', function (e) { errors.push(String(e.message)); });
  var cerr = console.error;
  console.error = function () { errors.push('console.error ' + Array.prototype.join.call(arguments, ' ')); return cerr.apply(console, arguments); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function step(n) { for (var i = 0; i < (n || 1); i++) Game._debugFrame(raw += 20); }
  function key(code, type) { window.dispatchEvent(new KeyboardEvent(type || 'keydown', { code: code, bubbles: true, cancelable: true })); }
  function tap(code) { key(code); key(code, 'keyup'); }
  function st() { return Game.getState(); }
  function world() { return Game._debugWorld(); }
  function check(test, pass, detail) { rows.push({ test: test, pass: !!pass, detail: detail }); }
  var ev = {};
  ['gameStart', 'roundEnd', 'playerDown', 'hurt', 'beer', 'spring', 'flip', 'pause', 'resume', 'roundAbandoned', 'modeChange'].forEach(function (n) { ev[n] = 0; Game.on(n, function () { ev[n]++; }); });
  function count() { return JSON.parse(JSON.stringify(ev)); }
  function delta(a) { var d = {}; Object.keys(ev).forEach(function (k) { if (ev[k] - a[k]) d[k] = ev[k] - a[k]; }); return d; }
  // one wide floor of the given type under the solo hero
  function stage(type, opts) {
    opts = opts || {};
    var w = world(); w.floors.length = 0;
    var f = new T[type || 'Floor'](0, opts.y || 400); f.width = 360; if (opts.seq !== undefined) f.seq = opts.seq; if (opts.beer) f.beer = true; w.floors.push(f);
    var h = w.heroes[0]; h.onFloor = null; h.vy = 0; h.vx = 0; h.direction = 0; h.x = opts.x || 160; h.y = f.y - 12 - 1; if (opts.life) h.life = opts.life;
    return { f: f, h: h };
  }
  function riseSpeed() { var f = world().floors[0], y0 = f.y; step(5); return +(-(f.y - y0) / 100).toFixed(3); }

  // 1. default versus; switching to solo on READY gives exactly one player; Enter starts it
  var s0 = st();
  tap('ArrowDown');
  var s1 = st(), c0 = count();
  tap('Enter'); step(1);
  var s2 = st();
  check('versus by default; Down selects solo on READY; Enter starts with exactly one player',
    s0.mode === 'versus' && s0.players.length === 2 && Game.getMode() === 'solo' && s1.mode === 'solo' && s1.players.length === 1 &&
    s2.state === 'playing' && s2.mode === 'solo' && world().heroes.length === 1 && world().heroes[0].id === 'p1' && delta(c0).gameStart === 1,
    { before: [s0.mode, s0.players.length], ready: [s1.mode, s1.players.length], playing: [s2.state, s2.mode, s2.players.length], events: delta(c0) });

  // 2. controls: arrows move the solo player; Z / C do nothing; mode keys do nothing during play
  var s = stage('Floor'); step(2);
  var x0 = s.h.x; key('ArrowLeft'); step(10); key('ArrowLeft', 'keyup'); var left = s.h.x - x0;
  x0 = s.h.x; key('ArrowRight'); step(10); key('ArrowRight', 'keyup'); var right = s.h.x - x0;
  x0 = s.h.x; key('KeyZ'); key('KeyC'); step(10); key('KeyZ', 'keyup'); key('KeyC', 'keyup'); var zc = s.h.x - x0;
  tap('ArrowUp'); tap('Digit2');
  check('solo controls: arrows move 40 px / 200 ms, Z/C inert, mode keys ignored while playing',
    Math.abs(left + 40) < 0.01 && Math.abs(right - 40) < 0.01 && zc === 0 && st().mode === 'solo' && world().heroes.length === 1 && Game.setMode('versus') === false,
    { left: left, right: right, zc: zc, mode: st().mode });

  // 3. + 4. floor tracking and the speed thresholds come from this player's landings only
  // (floors = deepest platform reached and the level never go down within a round, so start a fresh one)
  Game.reset(); step(1);
  var speeds = [];
  [0, 49, 50, 99, 100, 500].forEach(function (seq) {
    var sc = stage('Floor', { seq: seq }); step(3);
    speeds.push([seq, sc.h.floors, riseSpeed()]);
  });
  check('floors = deepest platform landed; rise speed 0.10 -> 0.11 at 50 -> 0.12 at 100 -> 0.20 at 500 floors',
    JSON.stringify(speeds) === JSON.stringify([[0, 0, 0.1], [49, 49, 0.1], [50, 50, 0.11], [99, 99, 0.11], [100, 100, 0.12], [500, 500, 0.2]]),
    speeds);
  var summary = document.querySelector('canvas').getAttribute('aria-label');
  check('HUD: one LIFE block (1P) plus the solo floor count; SHOT pool from this player\'s floors',
    /SOLO .* LIFE 12\/12\. 500 floors\./.test(summary) && /SHOT POOL 25 /.test(summary) && summary.indexOf('2P') < 0, summary);

  // 5. platform effects and beer work alone
  await wait(250);
  var c1 = count();
  s = stage('ARROW_FLOOR', { life: 12 }); step(10); var spikeLife = s.h.life;
  s = stage('Floor', { beer: true, life: 5 }); step(5); var beerLife = s.h.life;
  s = stage('SPRING'); step(15); var sprung = s.h.vy < 0 || !s.h.onFloor;
  s = stage('FAKE_FLOOR'); step(20);
  s = stage('ROLLING_RIGHT', { x: 100 }); step(10); var rolled = s.h.x - 100;
  var d1 = delta(c1);
  check('spikes -4, beer 5 -> 9 (+1 landing, +3 beer), spring, flip and conveyor all work in solo',
    spikeLife === 8 && beerLife === 9 && sprung && d1.hurt === 1 && d1.beer === 1 && d1.spring >= 1 && d1.flip === 1 && rolled > 15,
    { spikeLife: spikeLife, beerLife: beerLife, sprung: sprung, rolled: rolled, events: d1 });

  // 6. pause / resume
  s = stage('Floor'); step(3);
  tap('Space'); var paused = st().state, snap = JSON.stringify([s.h.x, s.h.y, world().floors[0].y]); step(100);
  var frozen = snap === JSON.stringify([s.h.x, s.h.y, world().floors[0].y]);
  tap('Space'); step(152);
  check('pause freezes the solo round; Space + countdown resumes', paused === 'paused' && frozen && st().state === 'playing', { paused: paused, frozen: frozen, after: st().state });

  // 7. death -> GAME OVER with the player's floors; one roundEnd / playerDown; no winner or loser
  Game.reset(); step(1);
  s = stage('Floor', { seq: 37 }); step(3);
  var c2 = count();
  s.h.hurt(99, raw); step(1);
  var r = st().lastResult, over = st().state, sum = Game._debugScreens().summary;
  check('solo death ends the round: GAME OVER, 37 floors, 1.5 shot tally, no winner / loser',
    over === 'over' && r.mode === 'solo' && r.player === 'p1' && r.loser === null && r.winner === null && r.draw === false &&
    r.floors.total === 37 && r.floors.p2 === undefined && r.penalty === 1.5 && r.shotPool === 1.5 && r.level === 0 &&
    delta(c2).roundEnd === 1 && delta(c2).playerDown === 1 && /GAME OVER/.test(sum) && /37 floors/.test(sum),
    { result: r, summary: sum, events: delta(c2) });

  // 8. rematch keeps solo; fresh state
  tap('Enter'); var locked = st().state;
  await wait(1050);
  tap('Enter'); step(1);
  var rm = st();
  check('rematch (after the cooldown) keeps solo with a fresh player',
    locked === 'over' && rm.state === 'playing' && rm.mode === 'solo' && rm.players.length === 1 && rm.players[0].life === 12 && rm.players[0].floors === 0 && rm.lastResult === null,
    { locked: locked, state: rm.state, mode: rm.mode, players: rm.players });

  // 9. Esc on GAME OVER -> title; switch solo -> versus -> solo without leaking state
  world().heroes[0].hurt(99, raw); step(1); await wait(1050);
  tap('Escape'); var title = st();
  tap('Digit2'); var vs = st();
  var vChars = [Game.getConfig().characterSkin.p1, Game.getConfig().characterSkin.p2];
  tap('Enter'); step(1);
  var vw = world(), p1 = vw.heroes[0], p2 = vw.heroes[1];
  var wide = new T.Floor(0, 440); wide.width = 360; vw.floors.length = 0; vw.floors.push(wide);
  [p1, p2].forEach(function (h, i) { h.onFloor = null; h.vy = 0; h.vx = 0; h.x = i ? 120 : 220; h.y = 427; }); step(3);
  key('KeyC'); key('ArrowLeft'); step(40); key('KeyC', 'keyup'); key('ArrowLeft', 'keyup');
  var pushed = Math.abs(p1.x - p2.x - 26) < 0.01;
  var vhud = document.querySelector('canvas').getAttribute('aria-label');
  Game.pause(); tap('Escape'); tap('Enter'); // quit -> READY
  tap('Digit1'); var back = st();
  var fx = Game._debugVisuals().stats();
  check('Esc on GAME OVER returns to the title (mode kept); solo -> versus -> solo leaks nothing',
    title.state === 'ready' && title.mode === 'solo' && title.lastResult === null &&
    vs.mode === 'versus' && vs.players.length === 2 && vw.heroes.length === 2 && pushed && /2P .* LIFE/.test(vhud) &&
    back.state === 'ready' && back.mode === 'solo' && back.players.length === 1 && back.players[0].floors === 0 && back.lastResult === null && fx.active === 0,
    { title: [title.state, title.mode], versus: [vs.mode, vs.players.length, pushed, vChars], back: [back.state, back.mode, back.players.length], fx: fx.active });

  // 10. solo character choice: arrows pick 1P's character without skipping 2P's
  Game.setCharacter('p1', 'rae'); Game.setCharacter('p2', 'gina');
  tap('ArrowLeft'); var pick = Game.getConfig().characterSkin.p1;
  Game.setCharacter('p1', 'rae');
  check('solo character choice may use any friend (2P\'s choice is not skipped)', pick === 'gina', pick);

  tap('Digit2'); // leave the page in the default versus READY state
  console.error = cerr;
  check('versus restored as the mode; no errors', Game.getMode() === 'versus' && st().players.length === 2 && errors.length === 0, errors);
  window.__soloResults = rows;
  console.table(rows);
  return rows;
})();
