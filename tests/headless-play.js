/**
 * Headless play test. Paste into the browser console on index.html, or run with
 * tools/serve.py open in a tab. It drives the engine with a synthetic clock so it
 * works even when the tab is in the background, plays N rounds with two simple
 * bots, and prints a summary. No assertions framework: read the output.
 */
(async function () {
  window.requestAnimationFrame = function () { return 0; };
  var KC = { ArrowLeft: 37, ArrowRight: 39, KeyZ: 90, KeyC: 67, Space: 32, Enter: 13 };
  var key = function (code, type) { window.dispatchEvent(new KeyboardEvent(type, { code: code, keyCode: KC[code], bubbles: true })); };
  var keys = { p1: { left: 'ArrowLeft', right: 'ArrowRight' }, p2: { left: 'KeyZ', right: 'KeyC' } };
  var held = { p1: null, p2: null };
  function steer(h, dir) { var code = dir ? keys[h.id][dir] : null; if (held[h.id] === code) return; if (held[h.id]) key(held[h.id], 'keyup'); if (code) key(code, 'keydown'); held[h.id] = code; }
  function isSpike(f) { return f.landing.toString().indexOf('hurt(4') >= 0; }
  function think() {
    var w = Game._debugWorld();
    w.heroes.forEach(function (h) {
      var safeBottom = w.stageHeight - 110;
      var below = w.floors.filter(function (f) { return f.y - f.getHeight() > h.y + 2 && f.getHeight() > 0 && f !== h.onFloor; }).sort(function (a, b) { return a.y - b.y; });
      var cands = below.filter(function (f) { return !isSpike(f) && f.y < h.y + 200 && f.y < safeBottom; });
      var beer = cands.filter(function (f) { return f.beer; })[0];
      var target = beer || (h.id === 'p1' ? cands[0] : (cands[1] || cands[0]));
      if (!target) { steer(h, null); return; }
      var cx = target.x + target.width / 2 - w.heroWidth / 2;
      if (h.onFloor) { var F = h.onFloor; steer(h, Math.abs(cx - (F.x - w.heroWidth)) < Math.abs(cx - (F.x + F.width)) ? 'left' : 'right'); }
      else { var d = cx - h.x; steer(h, Math.abs(d) < 3 ? null : (d < 0 ? 'left' : 'right')); }
    });
  }
  var events = [];
  ShotStairs.on('roundEnd', function (r) { events.push(r); });
  var t = 1000, rounds = [];
  for (var r = 0; r < 5; r++) {
    if (r === 0) ShotStairs.reset(); else { await new Promise(function (res) { setTimeout(res, 1100); }); key('Enter', 'keydown'); key('Enter', 'keyup'); }
    var s0 = ShotStairs.getState();
    var maxLife = Game._debugWorld().maxLife;
    var fresh = s0.running && s0.lastResult === null && s0.players.every(function (p) { return p.life === maxLife && p.floors === 0 && p.beers === 0; });
    var n = 0, start = t;
    while (ShotStairs.getState().running && n < 20000) { t += 20; if (n++ % 2 === 0) think(); Game._debugFrame(t); }
    steer({ id: 'p1' }, null); steer({ id: 'p2' }, null);
    var res = ShotStairs.getState().lastResult;
    rounds.push({ round: r, freshStart: fresh, seconds: (t - start) / 1000, loser: res.loser, draw: res.draw, floors: res.floors, beers: res.beers, penalty: res.penalty });
  }
  console.table(rounds);
  console.log('roundEnd events:', events.length, 'penalty(50) =', ShotStairs.computePenalty(50));
})();
