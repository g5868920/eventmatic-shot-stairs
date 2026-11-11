/**
 * Audio layer tests. Run in the browser on index.html (fetch + eval). Builds small scenes with the
 * engine's own floor types on a synthetic 20 ms clock and checks which sounds the audio layer
 * played (ShotAudio._log), plus mute / volume and that real signal reaches the output.
 * Results in window.__audioResults.
 */
(async function () {
  'use strict';
  window.requestAnimationFrame = function () { return 0; };
  var T = Game._debugTypes;
  var t = performance.now();
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function step(n) { for (var i = 0; i < (n || 1); ++i) Game._debugFrame(t += 20); }
  function world() { return Game._debugWorld(); }
  var results = [];
  function check(name, ok, detail) { results.push({ test: name, pass: !!ok, detail: detail }); }
  var engineHurts = [];
  Game.on('hurt', function (id, dmg, life) { engineHurts.push([id, dmg, life]); });
  // keep generated floors out from under the given heroes so they really fall off the bottom (test only)
  function clearUnder(ids) {
    var w = world(), hs = { p1: w.heroes[0], p2: w.heroes[1] };
    for (var k = w.floors.length - 1; k >= 0; k--) {
      var f = w.floors[k];
      if (ids.some(function (id) { var h = hs[id]; return f.x < h.x + 26 && f.x + f.width > h.x; })) w.floors.splice(k, 1);
    }
  }
  function since(i) { return ShotAudio._log.slice(i).filter(function (e) { return !e.skipped; }).map(function (e) { return e.player + ':' + e.name; }); }

  ShotAudio.setMuted(false);
  /** fresh round with a custom floor layout; heroes dropped 1 px above the floor under them */
  function scene(layout, pos) {
    ShotStairs.start();
    ShotStairs.reset(); step(1);
    var w = world(); w.floors.length = 0;
    layout.forEach(function (L) { var f = new T[L.type](L.x, L.y); if (L.w) f.width = L.w; w.floors.push(f); });
    var hs = { p1: w.heroes[0], p2: w.heroes[1] };
    Object.keys(pos).forEach(function (id) {
      var h = hs[id], p = pos[id];
      h.onFloor = null; h.vy = 0; h.vx = 0; h.direction = 0; h.life = p.life || 12; h.x = p.x; h.y = p.y;
    });
    return hs;
  }

  // 1. spike damage, one sound per damage event, no repeats while standing on the spikes
  await wait(250);
  var i0 = ShotAudio._log.length, e0 = engineHurts.length;
  var s = scene([{ type: 'ARROW_FLOOR', x: 60, y: 400, w: 100 }, { type: 'Floor', x: 220, y: 400, w: 100 }],
                { p1: { x: 90, y: 400 - 12 - 1 }, p2: { x: 250, y: 400 - 12 - 1 } });
  step(40);
  var got = since(i0), hurts = engineHurts.slice(e0);
  check('spike damage plays hurt once, no repeats while standing', got.join() === 'p1:hurt' && hurts.length === 1,
    'engine damage events ' + JSON.stringify(hurts) + ' -> sounds ' + JSON.stringify(got) + ' over 800 ms on the spikes');

  // 2. both players hurt in the same frame: each plays independently
  await wait(250);
  i0 = ShotAudio._log.length;
  scene([{ type: 'ARROW_FLOOR', x: 40, y: 400, w: 100 }, { type: 'ARROW_FLOOR', x: 220, y: 400, w: 100 }],
        { p1: { x: 250, y: 400 - 12 - 1 }, p2: { x: 70, y: 400 - 12 - 1 } });
  step(10);
  got = since(i0).sort();
  check('both players hurt at once: two independent sounds', got.join() === 'p1:hurt,p2:hurt', JSON.stringify(got));

  // 3. ceiling spikes: every damage event is heard once
  await wait(250);
  i0 = ShotAudio._log.length; e0 = engineHurts.length;
  var top = world().marginTop;
  s = scene([{ type: 'Floor', x: 60, y: top + 40, w: 100 }, { type: 'Floor', x: 220, y: 400, w: 100 }],
            { p1: { x: 90, y: top + 40 - 12 - 1 }, p2: { x: 250, y: 400 - 12 - 1 } });
  step(15);
  got = since(i0); hurts = engineHurts.slice(e0).filter(function (h) { return h[2] > 0; });
  check('ceiling spikes: one sound per damage event', got.length === hurts.length && got.length >= 1 && got.every(function (g) { return g === 'p1:hurt'; }),
    hurts.length + ' non-fatal ceiling hits -> ' + JSON.stringify(got));

  // 4. fatal spike hit: no hurt sound, death sound once at round end
  await wait(1100);
  i0 = ShotAudio._log.length;
  scene([{ type: 'ARROW_FLOOR', x: 60, y: 400, w: 100 }, { type: 'Floor', x: 220, y: 400, w: 100 }],
        { p1: { x: 90, y: 400 - 12 - 1, life: 3 }, p2: { x: 250, y: 400 - 12 - 1 } });
  step(10);
  got = since(i0);
  var res = ShotStairs.getState().lastResult;
  check('health reaches zero: death sound once, no hurt', got.join() === 'p1:death' && res && res.loser === 'p1',
    'sounds ' + JSON.stringify(got) + ', loser ' + (res && res.loser));

  // 5. falling below the playfield: fall sound once, only for that player
  await wait(1100);
  i0 = ShotAudio._log.length;
  scene([{ type: 'Floor', x: 220, y: 400, w: 100 }], { p1: { x: 250, y: 400 - 12 - 1 }, p2: { x: 40, y: 380 } });
  var n = 0; while (ShotStairs.getState().running && n++ < 200) { clearUnder(['p2']); step(1); }
  got = since(i0); res = ShotStairs.getState().lastResult || {};
  check('fall below the playfield: fall sound once', got.join() === 'p2:fall' && res.loser === 'p2', 'sounds ' + JSON.stringify(got) + ' after ' + n * 20 + ' ms, loser ' + res.loser);

  // 6. both fall in the same step: both heard
  await wait(1100);
  i0 = ShotAudio._log.length;
  scene([], { p1: { x: 250, y: 380 }, p2: { x: 60, y: 380 } });
  n = 0; while (ShotStairs.getState().running && n++ < 200) { clearUnder(['p1', 'p2']); step(1); }
  got = since(i0).sort();
  check('both fall at once: two fall sounds', got.join() === 'p1:fall,p2:fall', JSON.stringify(got) + ', draw ' + (ShotStairs.getState().lastResult || {}).draw);

  // 7. a repeat inside the guard window is skipped (protects against stacked sounds)
  await wait(250);
  var a = ShotAudio.play('hurt', 'p1'), b = ShotAudio.play('hurt', 'p1'), c = ShotAudio.play('hurt', 'p2');
  check('repeat within 180 ms is skipped, other player unaffected', a && !b && c, 'first ' + a + ', immediate repeat ' + b + ', other player ' + c);

  // 8. real signal reaches the output; mute silences it; volume scales it
  var dbg = ShotAudio._debug(), ctx = dbg.ctx;
  if (ctx.state !== 'running') { try { await ctx.resume(); } catch (e) {} }
  var an = ctx.createAnalyser(); an.fftSize = 2048; dbg.master.connect(an);
  async function level(fn) {
    await wait(260); fn(); await wait(60);
    var buf = new Float32Array(an.fftSize); an.getFloatTimeDomainData(buf);
    var sum = 0; for (var k = 0; k < buf.length; k++) sum += buf[k] * buf[k];
    return Math.sqrt(sum / buf.length);
  }
  ShotAudio.setMuted(false); ShotAudio.setVolume(0.6);
  var loud = await level(function () { ShotAudio.play('hurt', 'p1'); });
  ShotAudio.setMuted(true);
  var muted = await level(function () { ShotAudio.play('hurt', 'p1'); });
  ShotAudio.setMuted(false); ShotAudio.setVolume(0.2);
  var quiet = await level(function () { ShotAudio.play('hurt', 'p1'); });
  ShotAudio.setVolume(0.6);
  dbg.master.disconnect(an);
  check('signal: audible, silent when muted, scaled by volume', ctx.state !== 'running' || (loud > 0.02 && muted < 0.001 && quiet < loud * 0.6 && quiet > 0.005),
    'context ' + ctx.state + '; RMS volume 0.6: ' + loud.toFixed(3) + ', muted: ' + muted.toFixed(4) + ', volume 0.2: ' + quiet.toFixed(3));

  ShotStairs.reset(); step(1);
  window.__audioResults = results;
  console.table(results);
  return results;
})();
