/**
 * Spring / beer / flip sound tests. Run in the browser on index.html (fetch + eval). Builds scenes
 * with the engine's own floor types on a synthetic 20 ms clock and compares the sounds the audio
 * layer played (ShotAudio._log) with the engine's own events. Results in window.__sfxExtraResults.
 */
(async function () {
  'use strict';
  window.requestAnimationFrame = function () { return 0; };
  var T = Game._debugTypes;
  var t = performance.now();
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function step(n) { for (var i = 0; i < (n || 1); ++i) Game._debugFrame(t += 20); }
  // real-time pacing (20 ms per frame) where the 120 ms repeat guard must see real gaps between events
  async function stepReal(n) { for (var i = 0; i < n; ++i) { t = Math.max(t + 20, performance.now()); Game._debugFrame(t); await wait(20); } }
  function world() { return Game._debugWorld(); }
  var results = [];
  function check(name, ok, detail) { results.push({ test: name, pass: !!ok, detail: detail }); }
  var ev = [];
  ['spring', 'beer', 'flip'].forEach(function (name) { Game.on(name, function (id) { ev.push(id + ':' + name); }); });
  function sounds(i, names) {
    return ShotAudio._log.slice(i).filter(function (e) { return !e.skipped && (!names || names.indexOf(e.name) >= 0); })
      .map(function (e) { return e.player + ':' + e.name; });
  }
  function scene(layout, pos) {
    ShotStairs.start(); ShotStairs.reset(); step(1);
    var w = world(); w.floors.length = 0;
    var made = layout.map(function (L) { var f = new T[L.type](L.x, L.y); if (L.w) f.width = L.w; if (L.beer) f.beer = true; w.floors.push(f); return f; });
    var hs = { p1: w.heroes[0], p2: w.heroes[1] };
    Object.keys(pos).forEach(function (id) { var h = hs[id], p = pos[id]; h.onFloor = null; h.vy = 0; h.vx = 0; h.direction = 0; h.life = p.life || 12; h.x = p.x; h.y = p.y; });
    return { floors: made, p1: hs.p1, p2: hs.p2 };
  }
  var FX = ['spring', 'beer', 'flip'];

  // 1. spring: once per launch, nothing during the 200 ms compression; both players independently
  await wait(200);
  var i0 = ShotAudio._log.length, e0 = ev.length;
  t = performance.now();   // keep the game clock in step with real time for the paced part
  var s = scene([{ type: 'SPRING', x: 40, y: 420, w: 100 }, { type: 'SPRING', x: 220, y: 420, w: 100 }],
                { p2: { x: 70, y: 420 - 12 - 1 }, p1: { x: 250, y: 420 - 12 - 1 } });
  await stepReal(7);   // ~140 ms on the spring: compressing, not launched yet
  var early = sounds(i0, FX).length;
  await stepReal(8);   // launch at ~200 ms
  var afterLaunch = sounds(i0, FX).sort();
  await stepReal(40);  // fall back and bounce again
  var all = sounds(i0, FX), springEvents = ev.slice(e0).filter(function (e) { return /spring/.test(e); });
  check('spring: once per launch, both players', early === 0 && afterLaunch.join() === 'p1:spring,p2:spring' && all.length === springEvents.length,
    'during compression ' + early + ' sounds; at launch ' + JSON.stringify(afterLaunch) + '; ' + springEvents.length + ' launches in 1.1 s -> ' + all.length + ' boings');

  // 2. beer: once per mug, nothing while standing on, nothing from ordinary landing regen
  await wait(200);
  i0 = ShotAudio._log.length;
  s = scene([{ type: 'Floor', x: 40, y: 420, w: 100, beer: true }, { type: 'Floor', x: 220, y: 420, w: 100, beer: true }, { type: 'Floor', x: 130, y: 300, w: 60 }],
            { p2: { x: 70, y: 420 - 12 - 1, life: 5 }, p1: { x: 250, y: 420 - 12 - 1, life: 5 } });
  step(30);
  var beerSounds = sounds(i0, ['beer']).sort();
  var lives = [s.p1.life, s.p2.life];
  // ordinary regen: land on a plain floor with no mug
  i0 = ShotAudio._log.length;
  s.p1.onFloor = null; s.p1.vy = 0; s.p1.x = 140; s.p1.y = s.floors[2].y - 12 - 1; s.p1.life = 6;
  step(5);
  var regenBeer = sounds(i0, ['beer']).length, regenLife = s.p1.life;
  check('beer: once per mug for each player, not from regen', beerSounds.join() === 'p1:beer,p2:beer' && regenBeer === 0 && regenLife === 7 && lives[0] > 5 && lives[1] > 5,
    'mugs -> ' + JSON.stringify(beerSounds) + ' (life 5 -> ' + lives + '); plain landing regen 6 -> ' + regenLife + ' with ' + regenBeer + ' beer sounds');

  // 3. flip: once per platform at the start of the turn; two players on one platform -> one sound
  await wait(200);
  i0 = ShotAudio._log.length;
  s = scene([{ type: 'FAKE_FLOOR', x: 100, y: 420, w: 120 }], { p2: { x: 110, y: 420 - 12 - 1 }, p1: { x: 180, y: 420 - 12 - 1 } });
  step(12);  // 240 ms: not turning yet
  var before = sounds(i0, ['flip']).length;
  step(30);
  var shared = sounds(i0, ['flip']);
  check('flip: once per platform, shared platform heard once', before === 0 && shared.length === 1,
    'before 300 ms ' + before + ' sounds; after ' + JSON.stringify(shared) + ' with both players on it');

  // 4. flip on two separate platforms -> one sound each
  await wait(200);
  i0 = ShotAudio._log.length;
  s = scene([{ type: 'FAKE_FLOOR', x: 40, y: 420, w: 100 }, { type: 'FAKE_FLOOR', x: 220, y: 420, w: 100 }],
            { p2: { x: 70, y: 420 - 12 - 1 }, p1: { x: 250, y: 420 - 12 - 1 } });
  step(40);
  var two = sounds(i0, ['flip']).sort();
  check('flip: separate platforms, both players', two.join() === 'p1:flip,p2:flip', JSON.stringify(two));

  // 5. stable blue-brick floor: no flip, no spring, no beer
  await wait(200);
  i0 = ShotAudio._log.length;
  s = scene([{ type: 'Floor', x: 40, y: 420, w: 100 }, { type: 'Floor', x: 220, y: 420, w: 100 }],
            { p2: { x: 70, y: 420 - 12 - 1 }, p1: { x: 250, y: 420 - 12 - 1 } });
  step(60);
  check('stable floor: no flip / spring / beer sounds', sounds(i0, FX).length === 0, JSON.stringify(sounds(i0, FX)) + ' in 1.2 s on blue brick');

  // 6. the new sounds are real signal and follow the SFX volume / mute
  var dbg = ShotAudio._debug(), ctx = dbg.ctx;
  var an = ctx.createAnalyser(); an.fftSize = 1024; dbg.master.connect(an);
  async function level(name) { await wait(200); ShotAudio.play(name, 'p1'); await wait(name === 'flip' ? 12 : 40); var b = new Float32Array(an.fftSize); an.getFloatTimeDomainData(b); var q = 0; for (var i = 0; i < b.length; i++) q += b[i] * b[i]; return Math.sqrt(q / b.length); }
  var lv = { spring: await level('spring'), beer: await level('beer'), flip: await level('flip') };
  ShotAudio.setMuted(true); var muted = await level('beer'); ShotAudio.setMuted(false);
  dbg.master.disconnect(an);
  check('new sounds audible, silent when muted', ctx.state !== 'running' || (lv.spring > 0.02 && lv.beer > 0.02 && lv.flip > 0.005 && muted < 0.001),
    'RMS spring ' + lv.spring.toFixed(3) + ', beer ' + lv.beer.toFixed(3) + ', flip ' + lv.flip.toFixed(3) + ', muted ' + muted.toFixed(4) + ' (' + ShotAudio.durations().spring + ' / ' + ShotAudio.durations().beer + ' / ' + ShotAudio.durations().flip + ' s)');

  ShotStairs.reset(); step(1);
  window.__sfxExtraResults = results;
  console.table(results);
  return results;
})();
