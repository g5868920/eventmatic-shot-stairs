/**
 * Pause / resume / quit / READY tests. Run in the browser on a freshly loaded index.html (fetch + eval).
 * Uses the real key handlers (KeyboardEvent) and drives frames with a synthetic clock so freezing can
 * be measured exactly. Results in window.__pauseResults.
 */
(async function () {
  'use strict';
  window.requestAnimationFrame = function () { return 0; };
  var T = Game._debugTypes;
  var raw = performance.now();
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function frames(n, ms) { for (var i = 0; i < n; ++i) Game._debugFrame(raw += (ms || 20)); }
  var KC = { ArrowLeft: 37, ArrowRight: 39, KeyZ: 90, KeyC: 67, Space: 32, Enter: 13, Escape: 27 };
  function key(code, type) { window.dispatchEvent(new KeyboardEvent(type || 'keydown', { code: code, keyCode: KC[code], bubbles: true, cancelable: true })); }
  function tap(code) { key(code, 'keydown'); key(code, 'keyup'); }
  function state() { return ShotStairs.getState().state; }
  function world() { return Game._debugWorld(); }
  function snap() {
    var w = world();
    return JSON.stringify({ f: w.floors.map(function (f) { return [Math.round(f.x), +f.y.toFixed(2), f.getHeight()]; }), h: w.heroes.map(function (h) { return [+h.x.toFixed(2), +h.y.toFixed(2), h.life, h.floors]; }) });
  }
  var results = [];
  function check(name, ok, detail) { results.push({ test: name, pass: !!ok, detail: detail }); }
  var events = [];
  ['gameStart', 'roundEnd', 'playerDown', 'hurt', 'spring', 'beer', 'flip', 'pause', 'resume', 'roundAbandoned'].forEach(function (n) { Game.on(n, function () { events.push(n); }); });
  ShotAudio.setMuted(false);
  var dbg = ShotAudio._debug();
  if (dbg.ctx.state !== 'running') { try { await dbg.ctx.resume(); } catch (e) {} }
  for (var k = 0; k < 40 && !ShotAudio.music().loaded; k++) await wait(100);

  // 1. READY: Space does nothing, Enter starts a round (and the music)
  var s0 = state();
  tap('Space'); var afterSpace = state();
  tap('Enter'); frames(1); var afterEnter = state();
  await wait(150);
  check('READY: Space ignored, Enter starts', s0 === 'ready' && afterSpace === 'ready' && afterEnter === 'playing' && ShotAudio.music().playing,
    s0 + ' -> Space -> ' + afterSpace + ' -> Enter -> ' + afterEnter + ', music playing ' + ShotAudio.music().playing);

  // 2. Space pauses: physics, scrolling, spawning, timers, events, SHOT all frozen; music keeps its position
  frames(30);
  var w = world();
  var fake = new T.FAKE_FLOOR(200, 300); fake.width = 100;
  var side = new T.Floor(20, 300); side.width = 100;
  w.floors.length = 0; w.floors.push(side, fake);       // only these two, so nothing else catches 1P
  var p1 = w.heroes[0], p2 = w.heroes[1];
  p1.onFloor = null; p1.vy = 0; p1.x = 240; p1.y = 300 - 12 - 1;
  p2.onFloor = null; p2.vy = 0; p2.x = 40; p2.y = 300 - 12 - 1;
  frames(10);                                           // p1 has stood ~200 ms on the flipping floor
  var onFakeBefore = p1.onFloor === fake && fake.getHeight() === 12;
  key('ArrowLeft');                                    // held, never released
  frames(1);
  var musicPosBefore = ShotAudio.music().position;
  var shotsBefore = ShotStairs.computePenalty(p1.floors + p2.floors);
  tap('Space');
  var paused = state(), before = snap(), evBefore = events.length;
  frames(250, 20);                                     // 5 s of frames while paused
  await wait(300);
  var after = snap();
  var gameEvents = events.slice(evBefore).filter(function (e) { return e !== 'pause'; });
  var m = ShotAudio.music();
  check('Space pauses: world frozen, no events, music paused', paused === 'paused' && before === after && gameEvents.length === 0 &&
    m.paused && !m.playing && ShotStairs.computePenalty(p1.floors + p2.floors) === shotsBefore,
    'state ' + paused + '; world unchanged over 5 s: ' + (before === after) + '; events while paused ' + JSON.stringify(gameEvents) +
    '; music paused at ' + m.position + ' s (was ' + musicPosBefore + ')');

  // 3. Space resumes with a 3-2-1 countdown, still frozen; then play continues without stale input
  tap('Space');
  var seen = [], frozen = true, snapC = snap();
  for (var i = 0; i < 145; ++i) {
    Game._debugFrame(raw += 20);
    var st = ShotStairs.getState();
    if (st.state === 'countdown' && seen[seen.length - 1] !== st.countdown) seen.push(st.countdown);
    if (st.state === 'countdown' && snap() !== snapC) frozen = false;
  }
  var stillCounting = state();
  frames(8);
  var resumed = state();
  var dir = p1.direction, x0 = p1.x;
  frames(10);
  await wait(150);
  check('Space resumes after a 3-2-1 countdown', JSON.stringify(seen) === '[3,2,1]' && frozen && stillCounting === 'countdown' && resumed === 'playing',
    'countdown digits ' + JSON.stringify(seen) + ', frozen during countdown ' + frozen + ', after 2.9 s ' + stillCounting + ', after 3.06 s ' + resumed);
  check('no stale movement after resume (ArrowLeft still held)', dir === 0 && Math.abs(p1.x - x0) < 2.5,
    '1P direction ' + dir + ', moved ' + (p1.x - x0).toFixed(2) + ' px in 200 ms (only conveyor/landing drift allowed)');
  check('timers froze: flipping floor kept its remaining time', onFakeBefore && fake.getHeight() < 12 && fake.getHeight() >= 0,
    'stood 200 ms before a 5 s pause + 3 s countdown; floor height now ' + fake.getHeight().toFixed(1) + ' (turning only after resume, not instantly collapsed)');
  var mm = ShotAudio.music();
  check('music resumes from its paused position', mm.playing && mm.position !== null && mm.position >= m.position && mm.position - m.position < 1.0,
    'paused at ' + m.position + ' s, now ' + mm.position + ' s');
  key('ArrowLeft', 'keyup');

  // 4. controls stay with the players while playing
  w = world(); p1 = w.heroes[0]; p2 = w.heroes[1];
  var wide = new T.Floor(20, 400); wide.width = 320; w.floors.length = 0; w.floors.push(wide);
  p1.onFloor = null; p1.vy = 0; p1.x = 250; p1.y = 387; p2.onFloor = null; p2.vy = 0; p2.x = 60; p2.y = 387;
  frames(3);
  var a = [p1.x, p2.x];
  key('KeyC'); key('ArrowLeft'); frames(5); key('KeyC', 'keyup'); key('ArrowLeft', 'keyup');
  check('Gina (2P) on Z/C, Rae (1P) on arrows', p2.x > a[1] + 15 && p1.x < a[0] - 15, '2P moved ' + (p2.x - a[1]).toFixed(1) + ' with C, 1P moved ' + (p1.x - a[0]).toFixed(1) + ' with Left');

  // 5. focus loss pauses
  window.dispatchEvent(new Event('blur'));
  var blurred = state();
  check('window blur pauses the round', blurred === 'paused', 'state after blur: ' + blurred);

  // 6. quit needs confirmation and produces no result / penalty
  var evQ = events.length;
  tap('Escape'); var q1 = state();
  tap('Escape'); var q2 = state();
  tap('Escape'); var q3 = state();
  tap('Enter'); var q4 = state();
  await wait(1000);
  var quitEvents = events.slice(evQ);
  check('Esc -> confirm -> Enter quits with no winner or penalty', q1 === 'quit' && q2 === 'paused' && q3 === 'quit' && q4 === 'ready' &&
    ShotStairs.getState().lastResult === null && quitEvents.indexOf('roundEnd') < 0 && quitEvents.indexOf('playerDown') < 0 && !ShotAudio.music().playing,
    'Esc ' + q1 + ', Esc ' + q2 + ', Esc ' + q3 + ', Enter ' + q4 + '; events ' + JSON.stringify(quitEvents) + '; lastResult ' + ShotStairs.getState().lastResult + '; music ' + ShotAudio.music().playing);

  // 7. GAME OVER: Space does not restart, Enter rematches (after the 1 s result cooldown)
  tap('Enter'); frames(25);                            // let both land on the start floor first (a landing regains 1 life)
  world().heroes[0].hurt(99, raw); frames(1);
  var over = state();
  await wait(1100);
  tap('Space'); var afterSpaceOver = state();
  tap('Enter'); var afterEnterOver = state();
  check('GAME OVER: Space ignored, Enter rematches', over === 'over' && afterSpaceOver === 'over' && afterEnterOver === 'playing' && ShotStairs.getState().lastResult === null,
    over + ' -> Space -> ' + afterSpaceOver + ' -> Enter -> ' + afterEnterOver);

  // 8. Space key does not scroll the page
  var ev = new KeyboardEvent('keydown', { code: 'Space', keyCode: 32, bubbles: true, cancelable: true });
  window.dispatchEvent(ev);
  var evArrow = new KeyboardEvent('keydown', { code: 'ArrowDown', keyCode: 40, bubbles: true, cancelable: true });
  window.dispatchEvent(evArrow);
  check('Space and arrows do not scroll the page', ev.defaultPrevented && evArrow.defaultPrevented, 'Space prevented ' + ev.defaultPrevented + ', ArrowDown prevented ' + evArrow.defaultPrevented);
  if (state() === 'paused') { tap('Escape'); tap('Enter'); }

  window.__pauseResults = results;
  console.table(results);
  return results;
})();
