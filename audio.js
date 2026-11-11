/**
 * SHOT the Stairs — audio layer.
 *
 * Sounds come from SHOT_CONFIG.audio.files (by default the classic NS-SHAFT hurt and fall-dead
 * recordings chosen by Eventmatic, loaded at runtime from their URLs and not stored in this repo).
 * Every sound also has an original synthesised version built at load; it plays until the file has
 * loaded, and permanently if a file cannot be loaded (offline, host gone). See docs/AUDIO.md.
 *
 * Listens to game events only; it never touches gameplay:
 *   'hurt'       (playerId, damage, lifeAfter)  -> hurt SFX, unless that hit was fatal
 *   'playerDown' (playerId, 'health' | 'fall')  -> death SFX (out of health) or fall SFX (off the bottom)
 *   'spring' (playerId)                         -> 'boing' when a spring launches the player
 *   'beer'   (playerId, lifeAfter)              -> 'bling' when a beer mug is collected
 *   'flip'   (playerId)                         -> 'click-clack' when a flipping platform starts to turn
 * 1P is panned slightly right and 2P slightly left so both players are heard independently.
 *
 * Settings: SHOT_CONFIG.audio = { enabled, muted, volume (0..1), music: { enabled, file, volume } };
 * M toggles mute for everything (remembered in this browser); URL ?mute=1 / ?volume=0.4 /
 * ?music=0 / ?musicVolume=0.25; window.ShotAudio.setMuted / setVolume / setMusicVolume / toggleMute.
 *
 * Background music: one looping track on its own gain (default 25 %, independent of the SFX volume).
 * Starts with each round once the browser allows audio, loops sample-accurately between the first
 * and last audible samples, fades out over 0.8 s when the round ends, restarts from the top on a
 * rematch. Only one music source ever exists.
 */
;(function (global) {
  'use strict';

  var cfg = (global.SHOT_CONFIG && global.SHOT_CONFIG.audio) || {};
  var DEFAULT_FILES = {
    hurt: 'https://awiclass.monoame.com/audio/%E5%B0%8F%E6%9C%8B%E5%8F%8B%E4%B8%8B%E6%A8%93%E6%A2%AF%20%E8%A2%AB%E5%88%BA.mp3',
    fall: 'https://comebuycb.github.io/files/NS-SHAFT/fall-dead.mp3',
    death: 'https://comebuycb.github.io/files/NS-SHAFT/fall-dead.mp3'
  };
  var files = cfg.files || DEFAULT_FILES;   // name -> URL (null / missing = synthesised only)
  var sources = {};                           // name -> 'synth' | 'file' | 'synth (file failed)'
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

  var mcfg = cfg.music || {};
  var music = {
    enabled: mcfg.enabled !== false,
    file: mcfg.file || 'assets/audio/bgm-moodmode-8-bit-retro-game-music.mp3',
    volume: isFinite(mcfg.volume) ? Math.max(0, Math.min(1, mcfg.volume)) : 0.25,
    fadeOut: 0.8
  };
  try {
    var mq = new URLSearchParams(global.location.search);
    if (mq.has('music')) music.enabled = mq.get('music') !== '0';
    if (mq.has('musicVolume') && isFinite(parseFloat(mq.get('musicVolume')))) music.volume = Math.max(0, Math.min(1, parseFloat(mq.get('musicVolume'))));
  } catch (e) { /* ignore */ }
  var musicGain = null, musicBuffer = null, musicLoop = null, musicNow = null, wantMusic = false, musicStarts = 0;

  var AC = global.AudioContext || global.webkitAudioContext;
  var ctx = null, master = null, buffers = {}, lastPlayed = {}, log = [];
  var MIN_GAP_MS = { hurt: 180, fall: 1000, death: 1000, spring: 120, beer: 120, flip: 150 };   // per player: no stacked repeats
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
    // spring 'boing': 0.3 s — quick upward sweep, then a decaying wobble around 520 Hz
    buffers.spring = makeBuffer(0.30, function (t, T) {
      var f = t < 0.05 ? 180 + (520 - 180) * (t / 0.05) : 520 * (1 + 0.22 * Math.sin(2 * Math.PI * 17 * t) * Math.exp(-7 * (t - 0.05)));
      return { f: f, a: 0.42 * Math.pow(1 - t / T, 1.3), wave: 'tri' };
    });
    // beer 'bling': 0.24 s — two bright rising notes (B5 then E6), thin pulse
    buffers.beer = makeBuffer(0.24, function (t) {
      if (t < 0.07) return { f: 988, a: 0.32, wave: 'square', duty: 0.25 };
      var k = (t - 0.07) / 0.17;
      return { f: 1319, a: 0.34 * (1 - k), wave: 'square', duty: 0.25 };
    });
    // flip 'click-clack': 0.13 s — two short mechanical clicks with a hint of noise
    buffers.flip = makeBuffer(0.13, function (t) {
      if (t < 0.025) return { f: 1800 - 1200 * (t / 0.025), a: 0.36 * (1 - t / 0.025), wave: 'square', duty: 0.5, noise: 0.45 };
      if (t >= 0.06 && t < 0.095) { var k = (t - 0.06) / 0.035; return { f: 900 - 500 * k, a: 0.3 * (1 - k), wave: 'square', duty: 0.5, noise: 0.35 }; }
      return { f: 1, a: 0, wave: 'square' };
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
      musicGain = ctx.createGain();
      musicGain.gain.value = settings.muted ? 0 : music.volume;
      musicGain.connect(ctx.destination);
      build();
      for (var k in buffers) sources[k] = 'synth';
      loadFiles();
      loadMusic();
      return true;
    } catch (e) {
      ctx = null;
      return false;
    }
  }

  /* ---------- recorded sounds (optional, replace the synthesised ones once loaded) ---------- */
  function trim(buf) {
    // drop leading/trailing near-silence so the hit is heard immediately and nothing lingers
    var d = buf.getChannelData(0), n = d.length, start = 0, end = n - 1;
    while (start < n && Math.abs(d[start]) < 0.01) start++;
    while (end > start && Math.abs(d[end]) < 0.004) end--;
    start = Math.max(0, start - Math.round(buf.sampleRate * 0.002));
    end = Math.min(n - 1, end + Math.round(buf.sampleRate * 0.03));
    var len = Math.max(1, end - start + 1);
    var out = ctx.createBuffer(buf.numberOfChannels, len, buf.sampleRate);
    for (var c = 0; c < buf.numberOfChannels; c++) {
      out.getChannelData(c).set(buf.getChannelData(c).subarray(start, start + len));
    }
    return out;
  }
  function decode(ab) {
    return new Promise(function (res, rej) {
      var p = ctx.decodeAudioData(ab, res, rej);
      if (p && p.then) p.then(res, rej);
    });
  }
  function loadFiles() {
    var cache = {};
    Object.keys(files).forEach(function (name) {
      var url = files[name];
      if (!url || !global.fetch) return;
      var job = cache[url] || (cache[url] = global.fetch(url).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.arrayBuffer();
      }).then(decode).then(trim));
      job.then(function (buf) {
        buffers[name] = buf;
        sources[name] = 'file';
      }, function () {
        sources[name] = 'synth (file failed)';
      });
    });
  }

  /* ---------- background music ---------- */
  function loadMusic() {
    if (!music.enabled || !music.file || !global.fetch) return;
    global.fetch(music.file).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.arrayBuffer();
    }).then(decode).then(function (buf) {
      // loop between the first and last audible samples (skips MP3 padding and the silent tail)
      var d = buf.getChannelData(0), n = d.length, a = 0, b = n - 1;
      while (a < n && Math.abs(d[a]) < 0.003) a++;
      while (b > a && Math.abs(d[b]) < 0.003) b--;
      musicBuffer = buf;
      musicLoop = { start: a / buf.sampleRate, end: (b + 1) / buf.sampleRate };
      if (wantMusic) startMusic();
    }, function () { musicBuffer = null; });
  }

  function startMusic() {
    if (!ctx || !musicBuffer || musicNow || ctx.state !== 'running') return false;
    var src = ctx.createBufferSource(), fade = ctx.createGain();
    src.buffer = musicBuffer;
    src.loop = true;
    src.loopStart = musicLoop.start;
    src.loopEnd = musicLoop.end;
    fade.gain.value = 1;
    src.connect(fade);
    fade.connect(musicGain);
    src.start(0, musicLoop.start);
    musicNow = { src: src, fade: fade, startedAt: ctx.currentTime, offset: musicLoop.start };
    musicStarts++;
    return true;
  }

  // pause keeps the playback position; resume continues from it (seamlessly inside the loop)
  var musicPausedAt = null;
  function musicPosition() {
    if (!musicNow) return musicPausedAt;
    var span = musicLoop.end - musicLoop.start, played = ctx.currentTime - musicNow.startedAt + musicNow.offset;
    return musicLoop.start + (played - musicLoop.start) % span;
  }
  function pauseMusic() {
    if (!musicNow) return false;
    musicPausedAt = musicPosition();
    var m = musicNow, t = ctx.currentTime;
    musicNow = null;
    m.fade.gain.cancelScheduledValues(t);
    m.fade.gain.setValueAtTime(m.fade.gain.value, t);
    m.fade.gain.linearRampToValueAtTime(0, t + 0.04);
    try { m.src.stop(t + 0.05); } catch (e) { /* ignore */ }
    return true;
  }
  function resumeMusic() {
    if (musicPausedAt === null || musicNow || !ctx || ctx.state !== 'running' || !musicBuffer) return false;
    var at = musicPausedAt;
    musicPausedAt = null;
    var src = ctx.createBufferSource(), fade = ctx.createGain();
    src.buffer = musicBuffer; src.loop = true; src.loopStart = musicLoop.start; src.loopEnd = musicLoop.end;
    fade.gain.value = 1; src.connect(fade); fade.connect(musicGain);
    src.start(0, at);
    musicNow = { src: src, fade: fade, startedAt: ctx.currentTime, offset: at };
    return true;
  }

  function stopMusic(fadeSeconds) {
    musicPausedAt = null;
    if (!musicNow) return false;
    var m = musicNow, t = ctx.currentTime, f = Math.max(0.01, fadeSeconds || 0);
    musicNow = null;                                   // a rematch may start a new source right away
    m.fade.gain.cancelScheduledValues(t);
    m.fade.gain.setValueAtTime(m.fade.gain.value, t);
    m.fade.gain.linearRampToValueAtTime(0, t + f);
    try { m.src.stop(t + f + 0.02); } catch (e) { /* already stopped */ }
    return true;
  }

  /* ---------- browser autoplay unlock ---------- */
  function unlock() {
    if (ctx && ctx.state === 'suspended') {
      var p = ctx.resume();
      if (p && p.then) p.then(function () { if (wantMusic) startMusic(); });
    } else if (ctx && wantMusic) {
      startMusic();
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
    if (musicGain) musicGain.gain.value = settings.muted ? 0 : music.volume;
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
    Game.on('spring', function (playerId) { play('spring', playerId); });            // once per launch
    Game.on('beer', function (playerId) { play('beer', playerId); });                // once per mug collected
    Game.on('flip', function (playerId) { play('flip', playerId); });                // once per flipping platform
    // background music follows the round: start (or keep playing) on a new round, fade out at the end
    Game.on('gameStart', function () {
      wantMusic = music.enabled;
      if (wantMusic) startMusic();
    });
    Game.on('roundEnd', function () {
      wantMusic = false;
      stopMusic(music.fadeOut);
    });
    // pause keeps the position; resume (after the 3-2-1 countdown) continues; quitting a round fades out
    Game.on('pause', function () { pauseMusic(); });
    Game.on('resume', function () { if (wantMusic && !resumeMusic()) startMusic(); });
    Game.on('roundAbandoned', function () { wantMusic = false; stopMusic(music.fadeOut); });
  }

  var ready = init();

  global.ShotAudio = {
    ready: function () { return !!ctx; },
    state: function () { return ctx ? ctx.state : 'unavailable'; },
    play: play,
    setMuted: setMuted,
    toggleMute: function () { return setMuted(!settings.muted); },
    setVolume: setVolume,
    setMusicVolume: function (v) {
      music.volume = Math.max(0, Math.min(1, +v || 0));
      if (musicGain && !settings.muted) musicGain.gain.value = music.volume;
      return music.volume;
    },
    music: function () {
      var pos = musicPosition();
      return { enabled: music.enabled, loaded: !!musicBuffer, playing: !!musicNow, paused: musicPausedAt !== null, position: pos === null || pos === undefined ? null : +pos.toFixed(3),
               volume: music.volume, starts: musicStarts,
               loop: musicLoop && { start: +musicLoop.start.toFixed(3), end: +musicLoop.end.toFixed(3) } };
    },
    settings: function () { return { enabled: settings.enabled, muted: settings.muted, volume: settings.volume, available: ready }; },
    durations: function () { var o = {}; for (var k in buffers) o[k] = Math.round(buffers[k].duration * 100) / 100; return o; },
    sources: function () { var o = {}; for (var k in sources) o[k] = sources[k]; return o; },
    _log: log,
    _debug: function () { return { ctx: ctx, master: master, musicGain: musicGain, musicNow: musicNow }; } // tests only
  };
})(window);
