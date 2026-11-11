/**
 * Rules regression tests: controls and player identity, shot conversion, round-end consistency,
 * beer independence, platform width / spawn bounds / reachability. Run in the browser on index.html
 * (fetch + eval). Synthetic 20 ms clock; results in window.__rulesResults.
 */
(async function () {
  'use strict';
  window.requestAnimationFrame = function () { return 0; };
  var T = Game._debugTypes;
  var KC = { ArrowLeft: 37, ArrowRight: 39, KeyZ: 90, KeyC: 67, KeyX: 88 };
  function key(code, type) { window.dispatchEvent(new KeyboardEvent(type, { code: code, keyCode: KC[code], bubbles: true })); }
  function tap(code, frames) { key(code, 'keydown'); step(frames); key(code, 'keyup'); }
  var t = performance.now();
  function step(n) { for (var i = 0; i < (n || 1); ++i) Game._debugFrame(t += 20); }
  function world() { return Game._debugWorld(); }
  var results = [];
  function check(name, ok, detail) { results.push({ test: name, pass: !!ok, detail: detail }); }
  function r1(v) { return Math.round(v * 10) / 10; }
  function isSpike(f) { return f.landing.toString().indexOf('hurt(4') >= 0; }

  // ---- controls and identity -------------------------------------------------------------
  ShotStairs.reset(); step(20);
  var w = world(), p1 = w.heroes[0], p2 = w.heroes[1];
  check('start order: 2P left, 1P right, both on the start floor', p2.x < p1.x && p1.onFloor && p2.onFloor && p1.onFloor === p2.onFloor,
    '2P x ' + r1(p2.x) + ', 1P x ' + r1(p1.x) + ', start floor width ' + (p1.onFloor && p1.onFloor.width));

  // sprite identity: sample the cap and shirt colour of frame 0 in each player's sheet
  function capShirt(img) {
    var c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0);
    var cap = x.getImageData(12, 7, 1, 1).data, shirt = x.getImageData(14, 22, 1, 1).data;
    return { cap: [cap[0], cap[1], cap[2]], shirt: [shirt[0], shirt[1], shirt[2]] };
  }
  var c1 = capShirt(p1.sprite), c2 = capShirt(p2.sprite);
  var p1BlueGreen = c1.cap[2] > c1.cap[0] && c1.shirt[1] > c1.shirt[0];
  var p2RedPink = c2.cap[0] > c2.cap[2] && c2.shirt[0] > c2.shirt[1];
  check('1P is blue cap / green shirt, 2P is red cap / pink shirt', p1BlueGreen && p2RedPink,
    '1P cap rgb ' + c1.cap + ', shirt ' + c1.shirt + ' | 2P cap rgb ' + c2.cap + ', shirt ' + c2.shirt);

  function moveTest(code, who, sign) {
    var a = [p1.x, p2.x]; tap(code, 3);
    var d1 = p1.x - a[0], d2 = p2.x - a[1];
    var mover = who === 'p1' ? d1 : d2, other = who === 'p1' ? d2 : d1;
    return { ok: Math.sign(mover) === sign && Math.abs(mover) > 5 && Math.abs(other) < 1e-6, d1: d1, d2: d2 };
  }
  // separate them first so no push is involved
  ShotStairs.reset(); step(1);
  w = world(); // reset() builds a new floor array; take the live one
  w.floors.length = 0; var wide = new T.Floor(20, 360); wide.width = 320; w.floors.push(wide);
  p1 = world().heroes[0]; p2 = world().heroes[1];
  p2.onFloor = null; p2.x = 60; p2.y = 347; p2.vy = 0; p1.onFloor = null; p1.x = 240; p1.y = 347; p1.vy = 0; step(1);
  var m = { 'ArrowRight -> 1P right': moveTest('ArrowRight', 'p1', 1), 'ArrowLeft -> 1P left': moveTest('ArrowLeft', 'p1', -1),
            'C -> 2P right': moveTest('KeyC', 'p2', 1), 'Z -> 2P left': moveTest('KeyZ', 'p2', -1) };
  Object.keys(m).forEach(function (k) { check('control ' + k, m[k].ok, '1P moved ' + r1(m[k].d1) + ', 2P moved ' + r1(m[k].d2)); });
  var bx = [p1.x, p2.x]; tap('KeyX', 3);
  check('X no longer moves anyone', Math.abs(p1.x - bx[0]) < 1e-6 && Math.abs(p2.x - bx[1]) < 1e-6, 'moves: ' + r1(p1.x - bx[0]) + ' / ' + r1(p2.x - bx[1]));

  // simultaneous input
  var sx = [p1.x, p2.x]; key('ArrowLeft', 'keydown'); key('KeyC', 'keydown'); step(5); key('ArrowLeft', 'keyup'); key('KeyC', 'keyup');
  check('simultaneous input', p1.x < sx[0] - 15 && p2.x > sx[1] + 15, '1P ' + r1(p1.x - sx[0]) + ', 2P ' + r1(p2.x - sx[1]) + ' in 100 ms');

  // controls stay with identity after the players swap sides (2P now on the right, on a different height)
  ShotStairs.reset(); step(1);
  w = world(); w.floors.length = 0;
  var hi = new T.Floor(20, 300); hi.width = 320; var lo = new T.Floor(20, 380); lo.width = 320; w.floors.push(hi, lo);
  p1 = w.heroes[0]; p2 = w.heroes[1];
  p1.onFloor = null; p1.x = 60; p1.y = 287; p1.vy = 0; p2.onFloor = null; p2.x = 250; p2.y = 367; p2.vy = 0; step(1);
  var a1 = moveTest('ArrowRight', 'p1', 1), a2 = moveTest('KeyZ', 'p2', -1);
  check('controls follow the player after crossing sides', a1.ok && a2.ok && p1.x < p2.x,
    '1P (now left) moved ' + r1(a1.d1) + ' on ArrowRight; 2P (now right) moved ' + r1(a2.d2) + ' on Z');

  // ---- shot conversion ---------------------------------------------------------------------
  var table = [[0, 0], [9, 0], [10, 0.5], [19, 0.5], [20, 1], [30, 1.5], [40, 2], [55, 2.5], [100, 5]];
  var conv = table.map(function (r) { return [r[0], Game.computePenalty(r[0]), r[1], Game.formatShots(Game.computePenalty(r[0]))]; });
  var convOk = conv.every(function (r) { return r[1] === r[2]; });
  check('shots = floor(total / 10) * 0.5', convOk, conv.map(function (r) { return r[0] + 'F->' + r[3]; }).join(', '));
  var fmtOk = ['0', '0.5', '1', '1.5', '2'].join() === [0, 10, 20, 30, 40].map(function (n) { return Game.formatShots(Game.computePenalty(n)); }).join();
  check('fractional display', fmtOk, [0, 10, 20, 30, 40].map(function (n) { return 'X ' + Game.formatShots(Game.computePenalty(n)); }).join(' | '));
  ShotStairs.configure({ penalty: { maxShots: 1.5 } });
  var capped = [Game.computePenalty(20), Game.computePenalty(30), Game.computePenalty(80)];
  ShotStairs.configure({ penalty: { maxShots: null, shotsPerStep: 1, floorsPerStep: 5 } });
  var rate = [Game.computePenalty(4), Game.computePenalty(5), Game.computePenalty(12)];
  ShotStairs.configure({ penalty: { maxShots: null, shotsPerStep: 0.5, floorsPerStep: 10 } });
  check('max and rate configurable', capped.join() === '1,1.5,1.5' && rate.join() === '0,1,2', 'maxShots 1.5 -> ' + capped + '; 1 shot per 5 floors -> ' + rate);

  ShotStairs.reset(); step(20);
  var st = ShotStairs.getState();
  check('counter starts at 0', Game.computePenalty(st.players[0].floors + st.players[1].floors) === 0 && st.players[0].floors === 0,
    'floors ' + st.players[0].floors + ' + ' + st.players[1].floors + ' -> X ' + Game.formatShots(Game.computePenalty(st.players[0].floors + st.players[1].floors)));

  // beer pickup does not change the counter (floors held at 15 -> 0.5)
  ShotStairs.reset(); step(1);
  w = world(); w.floors.length = 0; var bf = new T.Floor(140, 360); bf.beer = true; w.floors.push(bf);
  p1 = w.heroes[0]; p2 = w.heroes[1];
  p1.floors = 8; p2.floors = 7; p2.onFloor = null; p2.x = -60; p2.y = 200;
  p1.life = 5; p1.onFloor = null; p1.x = 160; p1.y = 340; p1.vy = 0;
  var before = Game.computePenalty(p1.floors + p2.floors);
  for (var i = 0; i < 10 && p1.onFloor !== bf; i++) { step(1); p2.onFloor = null; p2.y = 200; p2.vy = 0; }
  check('beer heals but does not change the shots', p1.life === 5 + ShotStairs.getConfig().beer.healAmount + 0 || p1.life > 5,
    'life 5 -> ' + p1.life + ', shots ' + Game.formatShots(before) + ' -> ' + Game.formatShots(Game.computePenalty(p1.floors + p2.floors)) + ', mug consumed: ' + !bf.beer);
  results[results.length - 1].pass = results[results.length - 1].pass && before === Game.computePenalty(p1.floors + p2.floors) && !bf.beer;

  // ---- round end consistency ---------------------------------------------------------------
  var ends = [];
  var off = ShotStairs.on('roundEnd', function (r) { ends.push(r); });
  for (var round = 0; round < 3; round++) {
    ShotStairs.reset(); step(1);
    w = world(); w.heroes[0].life = 1; w.heroes[1].life = 12; w.heroes[0].floors = 10 + round * 13; w.heroes[1].floors = 9 + round * 7;
    w.heroes[0].hurt(5, t); step(1);
  }
  var endOk = ends.length === 3 && ends.every(function (r) { return r.penalty === Math.floor(r.floors.total / 10) * 0.5 && r.loser === 'p1'; });
  check('round-end penalty = floor(total/10) * 0.5', endOk, ends.map(function (r) { return r.floors.p1 + '+' + r.floors.p2 + '=' + r.floors.total + ' -> ' + r.penalty; }).join(', '));

  // ---- platform width, spawn bounds, reachability -----------------------------------------
  ShotStairs.reset(); step(1);
  w = world();
  var seen = new Set(), list = [], minX = 1e9, maxX = -1e9, widths = {};
  for (var n = 0; n < 6000; n++) {
    w.heroes.forEach(function (h) { h.onFloor = null; h.vy = 0; h.y = 300; h.x = -100; });
    step(1);
    w.floors.forEach(function (f) { if (!seen.has(f)) { seen.add(f); list.push(f); minX = Math.min(minX, f.x); maxX = Math.max(maxX, f.x + f.width); widths[f.width] = (widths[f.width] || 0) + 1; } });
  }
  list.sort(function (a, b) { return a.seq - b.seq || a.y - b.y; });
  var drift = 0.2 * Math.sqrt(2 * 60 / 0.0015);
  var unreachable = 0;
  for (var k = 1; k < list.length; k++) {
    var pr = list[k - 1], nx = list[k];
    if (nx.seq === 0) continue;
    if (nx.x + nx.width < pr.x - w.heroWidth - drift || nx.x > pr.x + pr.width + drift + w.heroWidth) unreachable++;
  }
  check('platform width 80 px, all inside the 360 px play area', w.floorWidth === 80 && minX >= 0 && maxX <= w.stageWidth && Object.keys(widths).join() === '80',
    list.length + ' floors, widths ' + JSON.stringify(widths) + ', x range ' + minX + '..' + maxX);
  check('every platform reachable from the one above', unreachable === 0, unreachable + ' of ' + (list.length - 1) + ' consecutive pairs out of falling reach (' + r1(drift) + ' px sideways per 60 px fall)');

  ShotStairs.configure({ platform: { width: 100 } }); ShotStairs.reset(); step(30);
  var w100 = world().floors.map(function (f) { return f.width; });
  ShotStairs.configure({ platform: { width: 80 } }); ShotStairs.reset(); step(1);
  check('platform width configurable', w100.every(function (x) { return x === 100; }), 'with platform.width = 100 the floors are ' + w100.join(','));

  window.__rulesResults = results;
  console.table(results);
  return results;
})();
