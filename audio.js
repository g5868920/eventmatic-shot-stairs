/**
 * SHOT the Stairs — audio layer.
 *
 * Original retro sound effects synthesised with the Web Audio API when the page loads (no audio
 * files, nothing to license or download during play). Modelled loosely on the feel of the classic
 * NS-SHAFT sounds (short harsh hit, long falling whistle) without copying any recording.
 * See docs/AUDIO.md for sources and licensing.
 *
 * Listens to game events only; it never touches gameplay:
 *   'hurt'       (playerId, damage, lifeAfter)  -> hurt SFX, unless that hit was fatal
 *   'playerDown' (playerId, 'health' | 'fall')  -> death SFX (out of health) or fall SFX (off the bottom)
 * 1P is panned slightly right and 2P slightly left so both players are heard independently.
 *
 * Settings: SHOT_CONFIG.audio = { enabled, muted, volume (0..1) }; M toggles mute (remembered in
 * this browser); URL ?mute=1 / ?volume=0.4; window.ShotAudio.setMuted / setVolume / toggleMute.
 */
;(function (global) {
  'use strict';

  var cfg = (global.SHOT_CONFIG && global.SHOT_CONFIG.audio) || {};
  var settings = {
    enabled: cfg.enabled !== false,
    muted: !!cfg.muted,
    volume: isFinite(cfg.volume) ? Math.max(0, Math.min(1, cfg.volume)) : 0.6
  };
  var MUTE_KEY = 'shot-stairs.muted';
  try { var saved = global.localStorage.getItem(MUTE_KEY); if (saved !== null) settings.muted = saved === '1'; } catch (e) { /* storage unavailable */ }
  try {
    var q = new URLSearchParams(global.location.search);
    if (q.has('mute')) settings.muted = q.get('mute') !== '0';
    if (q.has('volume') && isFinite(parseFloat(q.get('volume')))) settings.volume = Math.max(0, Math.min(1, parseFloat(q.get('volume'))));
  } catch (e) { /* ignore */ }

  var AC = global.AudioContext || global.webkitAudioContext;
  var ctx = null, master = null, buffers = {}, lastPlayed = {}, log = [];
  var MIN_GAP_MS = { hurt: 180, fall: 1000, death: 1000 };   // per player: no stacked repeats
  var PAN = { p1: 0.35, p2: -0.35 };

  /* ---------- synthesis (runs once at load) ---------- */
  function makeBuffer(seconds, fn) {
    var sr = ctx.sampleRate, n = Math.ceil(seconds * sr);
    var buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    var phase = 0, seed = 12345;
    function noise() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2147483648 - 1; }
    for (var i = 0; i < n; i++) {
      var t = i / sr;
      var r = fn(t, seconds);                         // { f: Hz, a: amplitude, wave, noise }
      phase += r.f / sr;
      var p = phase - Math.floor(phase), v;
      if (r.wave === 'tri') v = 4 * Math.abs(p - 0.5) - 1;
      else if (r.wave === 'saw') v = 2 * p - 1;
      else v = p < (r.duty || 0.5) ? 1 : -1;          // square / pulse
      v = v * (1 - (r.noise || 0)) + noise() * (r.noise || 0);
      d[i] = v * r.a;
    }
    // 4 ms fade in/out against clicks
    var fade = Math.min(n >> 1, Math.round(sr * 0.004));
    for (var j = 0; j < fade; j++) { d[j] *= j / fade; d[n - 1 - j] *= j / fade; }
    return buf;
  }

  function build() {
    // hurt: 0.32 s harsh hit — noisy attack, pulse wave dropping 900 -> 260 Hz with a fast wobble
    buffers.hurt = makeBuffer(0.32, function (t, T) {
      var k = t / T;
      return { f: (900 - 640 * k) * (1 + 0.06 * Math.sin(t * 2 * Math.PI * 38)), a: 0.55 * Math.pow(1 - k, 1.6),
               wave: 'square', duty: 0.25, noise: t < 0.06 ? 0.6 : 0.12 };
    });
    // fall: 1.35 s falling whistle 1700 -> 160 Hz with a slight warble, then a soft low thump
    buffers.fall = makeBuffer(1.35, function (t, T) {
      if (t < 1.15) {
        var k = t / 1.15;
        return { f: 1700 * Math.pow(160 / 1700, k) * (1 + 0.02 * Math.sin(t * 2 * Math.PI * 9)), a: 0.42 * (1 - 0.35 * k), wave: 'square', duty: 0.5 };
      }
      var k2 = (t - 1.15) / (T - 1.15);
      return { f: 70 - 30 * k2, a: 0.6 * (1 - k2), wave: 'tri', noise: 0.25 };
    });
    // death (health ran out): 0.95 s little defeat jingle — three falling notes and a low buzz
    var notes = [[0.00, 0.16, 659], [0.17, 0.16, 523], [0.34, 0.16, 392], [0.52, 0.43, 196]];
    buffers.death = makeBuffer(0.95, function (t) {
      for (var i = 0; i < notes.length; i++) {
        var n = notes[i];
        if (t >= n[0] && t < n[0] + n[1]) {
          var k = (t - n[0]) / n[1], last = i === notes.length - 1;
          return { f: n[2] * (last ? 1 - 0.15 * k : 1), a: (last ? 0.5 : 0.45) * (1 - 0.6 * k), wave: 'square', duty: last ? 0.5 : 0.125 };
        }
      }
      return { f: 1, a: 0, wave: 'square' };
    });
  }

  function init() {
    if (!AC || !settings.enabled) return false;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = settings.muted ? 0 : settings.volume;
      master.connect(ctx.destination);
      build();
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  /* ---------- browser autoplay unlock ---------- */
  function unlock() {
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }
  ['keydown', 'pointerdown', 'touchstart', 'mousedown'].forEach(function (type) {
    global.addEventListener(type, unlock, true);
  });

  /* ---------- playback ---------- */
  function play(name, playerId) {
    var now = Date.now(), key = playerId + ':' + name;
    if (lastPlayed[key] && now - lastPlayed[key] < (MIN_GAP_MS[name] || 0)) {
      log.push({ name: name, player: playerId, skipped: 'repeat' });
      return false;
    }
    lastPlayed[key] = now;
    var entry = { name: name, player: playerId, state: ctx ? ctx.state : 'none', muted: settings.muted };
    log.push(entry);
    if (log.length > 50) log.shift();
    if (!ctx || !buffers[name]) return false;
    try {
      var src = ctx.createBufferSource();
      src.buffer = buffers[name];
      var out = src;
      if (ctx.createStereoPanner) {
        var pan = ctx.createStereoPanner();
        pan.pan.value = PAN[playerId] || 0;
        src.connect(pan);
        out = pan;
      }
      out.connect(master);
      src.start();
      entry.started = true;
      return true;
    } catch (e) {
      entry.error = String(e);
      return false;
    }
  }

  function setMuted(m) {
    settings.muted = !!m;
    if (master) master.gain.value = settings.muted ? 0 : settings.volume;
    try { global.localStorage.setItem(MUTE_KEY, settings.muted ? '1' : '0'); } catch (e) { /* ignore */ }
    return settings.muted;
  }
  function setVolume(v) {
    settings.volume = Math.max(0, Math.min(1, +v || 0));
    if (master && !settings.muted) master.gain.value = settings.volume;
    return settings.volume;
  }

  // M toggles mute (not used by the game controls)
  global.addEventListener('keydown', function (e) {
    if ((e.code === 'KeyM' || e.keyCode === 77) && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
      setMuted(!settings.muted);
    }
  }, false);

  /* ---------- wire to game events ---------- */
  var Game = global.Game;
  if (Game && Game.on) {
    Game.on('hurt', function (playerId, damage, lifeAfter) {
      if (lifeAfter > 0) play('hurt', playerId);      // a fatal hit plays the death sound instead
    });
    Game.on('playerDown', function (playerId, cause) {
      play(cause === 'health' ? 'death' : 'fall', playerId);
    });
  }

  var ready = init();

  global.ShotAudio = {
    ready: function () { return !!ctx; },
    state: function () { return ctx ? ctx.state : 'unavailable'; },
    play: play,
    setMuted: setMuted,
    toggleMute: function () { return setMuted(!settings.muted); },
    setVolume: setVolume,
    settings: function () { return { enabled: settings.enabled, muted: settings.muted, volume: settings.volume, available: ready }; },
    durations: function () { var o = {}; for (var k in buffers) o[k] = Math.round(buffers[k].duration * 100) / 100; return o; },
    _log: log,
    _debug: function () { return { ctx: ctx, master: master }; } // tests only
  };
})(window);
