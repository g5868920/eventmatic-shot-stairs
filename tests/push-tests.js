/**
 * Player-to-player push regression tests. Run in the browser console on index.html
 * (or fetch + eval, see README). Drives the engine with a synthetic 20 ms clock and real
 * keyboard events, builds small controlled platform layouts, and asserts on positions.
 * Prints a table and stores the results in window.__pushResults.
 */
(async function () {
  'use strict';
  window.requestAnimationFrame = function () { return 0; };
  var T = Game._debugTypes;
  var KC = { ArrowLeft: 37, ArrowRight: 39, KeyZ: 90, KeyC: 67 };
  var KEYS = { p1: { left: 'ArrowLeft', right: 'ArrowRight' }, p2: { left: 'KeyZ', right: 'KeyC' } };
  function key(code, type) { window.dispatchEvent(new KeyboardEvent(type, { code: code, keyCode: KC[code], bubbles: true })); }
  function press(id, side) { key(KEYS[id][side], 'keydown'); }
  function release(id, side) { key(KEYS[id][side], 'keyup'); }
  function releaseAll() { ['p1', 'p2'].forEach(function (id) { release(id, 'left'); release(id, 'right'); }); }

  var t = performance.now();
  var W, F; // hero width, floor width
  function world() { return Game._debugWorld(); }
  function step(n, each) { for (var i = 0; i < (n || 1); ++i) { Game._debugFrame(t += 20); if (each) each(i); } }

  /**
   * layout: [{ type: 'Floor'|'SPRING'|..., x, y }]; heroes: { p1: x, p2: x } dropped 1 px above the
   * floor under them (or { p1: [x, y] } to place feet at an explicit y).
   */
  function setup(layout, heroes) {
    releaseAll();
    ShotStairs.reset();
    step(1);
    var w = world();
    W = w.heroWidth; F = w.floorWidth;
    w.floors.length = 0;
    layout.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (L) {
      var f = new T[L.type](L.x, L.y);
      if (L.w) f.width = L.w;
      w.floors.push(f);
    });
    var hs = { p1: w.heroes[0], p2: w.heroes[1] };
    ['p1', 'p2'].forEach(function (id) {
      var h = hs[id], spec = heroes[id];
      h.onFloor = null; h.vx = 0; h.vy = 0; h.life = w.maxLife; h.direction = 0; h.leftPressed = h.rightPressed = false;
      if (Array.isArray(spec)) { h.x = spec[0]; h.y = spec[1]; return; }
      h.x = spec;
      var under = w.floors.filter(function (f) { return f.x < spec + W && f.x + f.width > spec; }).sort(function (a, b) { return a.y - b.y; })[0];
      h.y = under ? under.y - under.getHeight() - 1 : 300;
    });
    step(1); // land
    return { w: w, p1: hs.p1, p2: hs.p2 };
  }
  function overlapX(a, b) { var l = Math.min(a.x, b.x), r = Math.max(a.x, b.x); return l + W - r; }
  function overlapping(a, b) { return Math.abs(a.y - b.y) < W && overlapX(a, b) > 1e-6; }
  function inside(h) { return h.x >= 0 && h.x <= world().stageWidth - W; }

  var results = [];
  function check(name, ok, detail) { results.push({ test: name, pass: !!ok, detail: detail }); }
  function r1(v) { return Math.round(v * 10) / 10; }

  // one wide stable test floor at y=360 (x 60..252). Floors placed edge to edge at the same height are
  // NOT used: upstream's landing rule lets a walker drop through such a seam, which real (60 px spaced)
  // generated floors never have.
  var SURFACE = [{ type: 'Floor', x: 60, y: 360, w: 192 }];

  // 1. 1P pushes stationary 2P (rightwards), and 2. 2P pushes stationary 1P, plus leftward variants
  [['p1', 'p2', 'right'], ['p2', 'p1', 'right'], ['p1', 'p2', 'left'], ['p2', 'p1', 'left']].forEach(function (c) {
    var pusher = c[0], target = c[1], dir = c[2];
    var pos = {}; pos[pusher] = dir === 'right' ? 70 : 200; pos[target] = dir === 'right' ? 100 : 170;
    var s = setup(SURFACE, pos);
    var P = s[pusher], Q = s[target], q0 = Q.x, maxOv = 0;
    press(pusher, dir);
    step(20, function () { maxOv = Math.max(maxOv, overlapping(P, Q) ? overlapX(P, Q) : 0); });
    release(pusher, dir);
    var moved = dir === 'right' ? Q.x - q0 : q0 - Q.x;
    check(pusher + ' pushes stationary ' + target + ' ' + dir, moved > 40 && maxOv < 1e-6 && Q.direction === 0 && Q.onFloor,
      'target moved ' + r1(moved) + ' px in 400 ms (walk speed 80), max overlap ' + r1(maxOv) + ', target still on a floor: ' + !!Q.onFloor);
  });

  // 3. both push toward each other: equal speeds cancel, no jitter, deterministic
  function headOn() {
    var s = setup(SURFACE, { p1: 110, p2: 150 });
    press('p1', 'right'); press('p2', 'left');
    var xs = [];
    step(30, function () { xs.push([s.p1.x, s.p2.x, overlapping(s.p1, s.p2)]); });
    release('p1', 'right'); release('p2', 'left');
    return xs;
  }
  var h1 = headOn(), h2 = headOn();
  var tail = h1.slice(-15);
  var spread1 = Math.max.apply(null, tail.map(function (r) { return r[0]; })) - Math.min.apply(null, tail.map(function (r) { return r[0]; }));
  var spread2 = Math.max.apply(null, tail.map(function (r) { return r[1]; })) - Math.min.apply(null, tail.map(function (r) { return r[1]; }));
  var anyOv = h1.some(function (r) { return r[2]; });
  var same = JSON.stringify(h1) === JSON.stringify(h2);
  check('head-on push: equal force, no jitter', spread1 < 1e-6 && spread2 < 1e-6 && !anyOv,
    'x range over last 300 ms: 1P ' + r1(spread1) + ', 2P ' + r1(spread2) + '; overlap seen: ' + anyOv + '; contact at x ' + r1(tail[0][0]) + ' / ' + r1(tail[0][1]));
  check('head-on push: deterministic', same, 'two identical runs produce identical positions: ' + same);

  // 4. both move in the same direction while touching
  (function () {
    var s = setup(SURFACE, { p1: 70, p2: 96 });
    press('p1', 'right'); press('p2', 'right');
    var gaps = []; step(15, function () { gaps.push(s.p2.x - s.p1.x); });
    release('p1', 'right'); release('p2', 'right');
    var minGap = Math.min.apply(null, gaps), maxGap = Math.max.apply(null, gaps);
    check('same direction, touching', minGap >= W - 1e-6 && maxGap - minGap < 1e-6 && s.p1.x > 70 + 50,
      'gap stays ' + r1(minGap) + '..' + r1(maxGap) + ' (box width ' + W + '), 1P travelled ' + r1(s.p1.x - 70));
    // a belt-carried player drifting into a standing player on solid ground: no persistent overlap, no jumps
    var s2 = setup([{ type: 'ROLLING_RIGHT', x: 60, y: 360, w: 100 }, { type: 'Floor', x: 150, y: 362, w: 180 }], { p2: 125, p1: 162 });
    var p1x0 = s2.p1.x, ov = 0, jump = 0, prev = [s2.p1.x, s2.p2.x];
    step(20, function () {
      ov = Math.max(ov, overlapping(s2.p1, s2.p2) ? overlapX(s2.p1, s2.p2) : 0);
      jump = Math.max(jump, Math.abs(s2.p1.x - prev[0]), Math.abs(s2.p2.x - prev[1])); prev = [s2.p1.x, s2.p2.x];
    });
    check('belt carries a player into a standing one', ov < 1e-6 && jump <= 4 + 1e-6 && s2.p1.x > p1x0,
      'standing 1P eased right by ' + r1(s2.p1.x - p1x0) + ' px over 400 ms, max overlap ' + r1(ov) + ', largest per-frame move ' + r1(jump) + ' px');
  })();

  // 5. pushed off a platform edge and falls under gravity. The next generated floor is 60 px below and
  // random (it may be a spring), so measure the fall in the first 240 ms, before it can be reached.
  (function () {
    var s = setup([{ type: 'Floor', x: 150, y: 360 }], { p1: 150, p2: 180 }); // real default width
    var floor0 = s.p2.onFloor;
    press('p1', 'right');
    var leftAt = null;
    for (var i = 0; i < 30 && leftAt === null; i++) { step(1); if (!s.p2.onFloor) leftAt = (i + 1) * 20; } // stop as soon as 2P leaves
    release('p1', 'right');
    var yLeave = s.p2.y, maxDrop = 0, backOnOld = false;
    step(12, function () { maxDrop = Math.max(maxDrop, s.p2.y - yLeave); if (s.p2.onFloor === floor0) backOnOld = true; });
    check('pushed off the edge, falls', leftAt !== null && maxDrop > 8 && !backOnOld,
      '2P left the floor after ' + leftAt + ' ms of pushing, then dropped ' + r1(maxDrop) + ' px (gravity, no landing back on the old floor)');
  })();

  // 6. pushed against the wall: right and left
  (function () {
    var maxX = world().stageWidth - W;
    var s = setup([{ type: 'Floor', x: 232, y: 360, w: 128 }], { p1: 240, p2: 290 });
    press('p1', 'right'); var bad = false;
    step(30, function () { if (!inside(s.p1) || !inside(s.p2) || overlapping(s.p1, s.p2)) bad = true; });
    release('p1', 'right');
    check('pushed against the right wall', !bad && Math.abs(s.p2.x - maxX) < 1e-6 && Math.abs(s.p1.x - (maxX - W)) < 1e-6,
      '2P x ' + r1(s.p2.x) + ' (wall limit ' + maxX + '), 1P x ' + r1(s.p1.x) + '; any wall/overlap violation: ' + bad);
    var s2 = setup([{ type: 'Floor', x: 0, y: 360, w: 128 }], { p2: 20, p1: 60 });
    press('p1', 'left'); bad = false;
    step(30, function () { if (!inside(s2.p1) || !inside(s2.p2) || overlapping(s2.p1, s2.p2)) bad = true; });
    release('p1', 'left');
    check('pushed against the left wall', !bad && Math.abs(s2.p2.x) < 1e-6 && Math.abs(s2.p1.x - W) < 1e-6,
      '2P x ' + r1(s2.p2.x) + ', 1P x ' + r1(s2.p1.x) + '; any violation: ' + bad);
  })();

  // 7. different heights: no false collision
  (function () {
    var s = setup([{ type: 'Floor', x: 120, y: 300 }, { type: 'Floor', x: 120, y: 360 }], { p1: [140, 287], p2: [150, 347] });
    step(2);
    var p2x = s.p2.x; press('p1', 'right'); step(5); release('p1', 'right');
    check('different heights (60 px apart): no push', Math.abs(s.p2.x - p2x) < 1e-6 && s.p1.x > 140, '2P moved ' + r1(s.p2.x - p2x) + ' px while 1P walked over it');
    // standing exactly one box height apart with horizontal overlap: boxes only touch, no push
    var s2 = setup([{ type: 'Floor', x: 60, y: 334 }, { type: 'Floor', x: 100, y: 360 }], { p1: [95, 321], p2: [110, 347] });
    var dy = s2.p2.y - s2.p1.y, x0 = s2.p2.x, p1x0 = s2.p1.x;
    step(3);
    var still = Math.abs(s2.p2.x - x0) < 1e-6 && Math.abs(s2.p1.x - p1x0) < 1e-6;
    press('p1', 'right'); step(4); release('p1', 'right');
    check('stacked exactly one box height apart: no push', Math.abs(dy - W) < 1e-6 && still && Math.abs(s2.p2.x - x0) < 1e-6 && s2.p1.x > p1x0 + 10,
      'vertical distance ' + r1(dy) + '; 2P moved ' + r1(s2.p2.x - x0) + ' while 1P stood and then walked ' + r1(s2.p1.x - p1x0) + ' px above it');
    // a player falling past the other with partial overlap is eased apart, never snapped
    var s3 = setup(SURFACE, { p2: 120, p1: [128, 300] });
    var maxJump = 0, prev = [s3.p1.x, s3.p2.x];
    step(25, function () { maxJump = Math.max(maxJump, Math.abs(s3.p1.x - prev[0]), Math.abs(s3.p2.x - prev[1])); prev = [s3.p1.x, s3.p2.x]; });
    check('falling onto the other: eased apart, no teleport', maxJump <= 2 + 1e-6 && !overlapping(s3.p1, s3.p2), 'largest per-frame sideways move ' + r1(maxJump) + ' px; overlapping at end: ' + overlapping(s3.p1, s3.p2));
  })();

  // 8. pushing works on stable, temporary, conveyor and spring platforms
  ['Floor', 'FAKE_FLOOR', 'ROLLING_LEFT', 'ROLLING_RIGHT', 'SPRING'].forEach(function (kind) {
    function run(push) {
      var s = setup([{ type: kind, x: 100, y: 360, w: 160 }], { p1: 110, p2: 140 });
      var x0 = s.p2.x;
      if (push) press('p1', 'right');
      step(8); // 160 ms: before the spring fires (200 ms) and the temporary floor starts turning (300 ms)
      if (push) release('p1', 'right');
      return { dx: s.p2.x - x0, onKind: !!s.p2.onFloor && s.p2.onFloor.constructor === T[kind] };
    }
    var base = run(false), pushed = run(true);
    // 1P walks 32 px in 160 ms with a 4 px gap, so a working push moves 2P about 28 px plus whatever the belt
    // does to both of them; require at least 20 px more than without the push, and 2P never left behind 1P
    check('push on ' + kind, pushed.dx - base.dx > 20 || (pushed.dx > 24 && pushed.dx > base.dx),
      '2P moved ' + r1(pushed.dx) + ' px with the push, ' + r1(base.dx) + ' px without (belt only)');
  });

  // 9. independent control after a collision
  (function () {
    var s = setup(SURFACE, { p1: 110, p2: 150 });
    press('p1', 'right'); press('p2', 'left'); step(15); release('p1', 'right'); release('p2', 'left');
    var a = s.p1.x, b = s.p2.x;
    press('p1', 'left'); press('p2', 'right'); step(10); release('p1', 'left'); release('p2', 'right');
    check('independent control after collision', a - s.p1.x > 35 && s.p2.x - b > 35, '1P moved ' + r1(s.p1.x - a) + ', 2P moved ' + r1(s.p2.x - b) + ' in 200 ms (walk speed = 40 px)');
  })();

  releaseAll();
  window.__pushResults = results;
  console.table(results);
  return results;
})();
