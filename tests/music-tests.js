/**
 * Background music tests. Run in the browser on index.html (fetch + eval) after the page has loaded.
 * Checks loading, loop points, single source, independent volume, fade on round end, restart on
 * rematch, waiting for the audio unlock, and that real signal comes out. Results in window.__musicResults.
 */
(async function () {
  'use strict';
  window.requestAnimationFrame = function () { return 0; };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var t = performance.now();
  function step(n) { for (var i = 0; i < (n || 1); ++i) Game._debugFrame(t += 20); }
  var results = [];
  function check(name, ok, detail) { results.push({ test: name, pass: !!ok, detail: detail }); }
  var dbg = ShotAudio._debug(), ctx = dbg.ctx;
  if (ctx.state !== 'running') { try { await ctx.resume(); } catch (e) {} }
  ShotAudio.setMuted(false);
  for (var k = 0; k < 40 && !ShotAudio.music().loaded; k++) await wait(100);
  var an = ctx.createAnalyser(); an.fftSize = 2048; dbg.musicGain.connect(an);
  function level() { var b = new Float32Array(an.fftSize); an.getFloatTimeDomainData(b); var s = 0; for (var i = 0; i < b.length; i++) s += b[i] * b[i]; return Math.sqrt(s / b.length); }
  function endRound() { var w = Game._debugWorld(); w.heroes[0].hurt(99, t); step(1); }

  // 1. loaded, looping between audible samples, playing during a round
  ShotStairs.start(); step(1);
  ShotStairs.reset(); step(2);
  var m = ShotAudio.music();
  var src = ShotAudio._debug().musicNow && ShotAudio._debug().musicNow.src;
  await wait(300);
  var lv = level();
  check('music loaded and playing during a round', m.loaded && m.playing && src && src.loop && lv > 0.01,
    'loop ' + JSON.stringify(m.loop) + ' s of 70.17, loop flag ' + (src && src.loop) + ', RMS ' + lv.toFixed(3));

  // 2. repeated round starts never stack a second source
  var starts0 = ShotAudio.music().starts;
  ShotStairs.reset(); step(1); ShotStairs.reset(); step(1); ShotStairs.reset(); step(1);
  check('no duplicate playback on repeated round starts', ShotAudio.music().starts === starts0 && ShotAudio.music().playing,
    'starts before ' + starts0 + ', after three resets ' + ShotAudio.music().starts);

  // 3. independent volumes, defaults 25 % music / 60 % effects
  var g0 = [dbg.musicGain.gain.value, dbg.master.gain.value];
  ShotAudio.setMusicVolume(0.1); var g1 = [dbg.musicGain.gain.value, dbg.master.gain.value];
  ShotAudio.setVolume(0.3); var g2 = [dbg.musicGain.gain.value, dbg.master.gain.value];
  ShotAudio.setMusicVolume(0.25); ShotAudio.setVolume(0.6);
  check('music and effects volumes are independent', Math.abs(g0[0] - 0.25) < 1e-6 && Math.abs(g0[1] - 0.6) < 1e-6 &&
    Math.abs(g1[0] - 0.1) < 1e-6 && Math.abs(g1[1] - 0.6) < 1e-6 && Math.abs(g2[0] - 0.1) < 1e-6 && Math.abs(g2[1] - 0.3) < 1e-6,
    'default [music, sfx] ' + g0.map(function (x) { return x.toFixed(2); }) + '; music 0.1 -> ' + g1.map(function (x) { return x.toFixed(2); }) + '; sfx 0.3 -> ' + g2.map(function (x) { return x.toFixed(2); }));

  // 4. round end: fades out and stops
  endRound();
  var right = level(); await wait(1000); var after = level();
  check('round end fades the music out', !ShotAudio.music().playing && after < 0.002,
    'RMS right after the end ' + right.toFixed(3) + ', after 1 s ' + after.toFixed(4));

  // 5. rematch restarts from the top
  var s1 = ShotAudio.music().starts;
  ShotStairs.start(); step(1);
  await wait(300);
  var n = ShotAudio._debug().musicNow;
  check('rematch restarts the music', ShotAudio.music().playing && ShotAudio.music().starts === s1 + 1 && level() > 0.01,
    'starts ' + s1 + ' -> ' + ShotAudio.music().starts + ', RMS ' + level().toFixed(3));

  // 6. mute silences music too, unmute restores 25 %
  ShotAudio.setMuted(true); var mg = dbg.musicGain.gain.value; ShotAudio.setMuted(false);
  check('mute covers the music', mg === 0 && Math.abs(dbg.musicGain.gain.value - 0.25) < 1e-6, 'muted gain ' + mg + ', unmuted ' + dbg.musicGain.gain.value.toFixed(2));

  // 7. autoplay restriction: a round that starts while audio is locked waits for the unlock
  endRound(); await wait(900);
  await ctx.suspend();
  ShotStairs.start(); step(1);
  var whileLocked = ShotAudio.music().playing;
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', keyCode: 16, bubbles: true }));
  await wait(400);
  check('waits for the audio unlock, then starts once', !whileLocked && ShotAudio.music().playing && ctx.state === 'running',
    'playing while locked ' + whileLocked + ', after unlock ' + ShotAudio.music().playing + ' (context ' + ctx.state + ')');

  dbg.musicGain.disconnect(an);
  window.__musicResults = results;
  console.table(results);
  return results;
})();
