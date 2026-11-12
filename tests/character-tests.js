/**
 * Character library tests. Run in the browser on a freshly loaded index.html (fetch + eval), READY state.
 * Every friend in either slot: sprite loaded, metadata, unchanged hitbox, movement on both control schemes,
 * pushing identical to the default pair, names on the result screen, selection keys / pointer, rematch
 * persistence. Results in window.__characterResults.
 */
(async function () {
  'use strict';
  window.requestAnimationFrame = function () { return 0; };
  var T = Game._debugTypes, raw = performance.now() + 1e5, rows = [], errors = [];
  window.addEventListener('error', function (e) { errors.push(String(e.message)); });
  var cerr = console.error, cwarn = console.warn;
  console.error = function () { errors.push('console.error ' + Array.prototype.join.call(arguments, ' ')); return cerr.apply(console, arguments); };
  console.warn = function () { errors.push('console.warn ' + Array.prototype.join.call(arguments, ' ')); return cwarn.apply(console, arguments); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function step(n) { for (var i = 0; i < (n || 1); i++) Game._debugFrame(raw += 20); }
  function key(code, type) { window.dispatchEvent(new KeyboardEvent(type || 'keydown', { code: code, bubbles: true, cancelable: true })); }
  function tap(code) { key(code); key(code, 'keyup'); }
  function st() { return Game.getState().state; }
  function cs() { return Game.getConfig().characterSkin; }
  function check(test, pass, detail) { rows.push({ test: test, pass: !!pass, detail: detail }); }
  var world = function () { return Game._debugWorld(); };
  var lib = Game.characters(), ids = lib.map(function (c) { return c.id; });
  var skins = window.SHOT_CUSTOM_SKINS;

  // 1. library
  check('library lists the seven friends in registry order, Gina/Rae animated only',
    ids.join() === 'gina,rae,ariel,cindy,ken,linda,sandy' && lib.filter(function (c) { return c.animated; }).map(function (c) { return c.id; }).join() === 'gina,rae',
    JSON.stringify(lib));
  var meta = ids.map(function (id) { var m = skins[id]['48']; return [id, m.w, m.h, m.anchorX]; });
  check('48 px sprites: consistent height 46-48 px, foot anchor inside the sprite',
    meta.every(function (m) { return m[2] >= 46 && m[2] <= 48 && m[3] > 0 && m[3] < m[1]; }), JSON.stringify(meta));
  var defaults = [cs().p1, cs().p2];
  check('defaults preserved: 1P Rae, 2P Gina', defaults.join() === 'rae,gina' && st() === 'ready', defaults);

  // 2. reference physics with the default pair: walk + push, both control schemes
  function physicsTrace() {
    Game.reset(); step(1);
    var w = world(); w.floors.length = 0; var f = new T.Floor(0, 440); f.width = 360; w.floors.push(f);
    var p1 = w.heroes[0], p2 = w.heroes[1];
    [p1, p2].forEach(function (h, i) { h.onFloor = null; h.vy = 0; h.vx = 0; h.direction = 0; h.x = i ? 120 : 220; h.y = 427; });
    step(3);
    var tr = [];
    key('KeyC'); key('ArrowLeft'); for (var i = 0; i < 40; i++) { step(1); tr.push([p1.x, p2.x, p1.y, p2.y].map(function (v) { return +v.toFixed(3); }).join()); }
    key('KeyC', 'keyup'); key('ArrowLeft', 'keyup');
    key('KeyZ'); key('ArrowRight'); for (i = 0; i < 20; i++) { step(1); tr.push([p1.x, p2.x].map(function (v) { return +v.toFixed(3); }).join()); }
    key('KeyZ', 'keyup'); key('ArrowRight', 'keyup');
    return { trace: tr.join('|'), widths: [p1.width, p2.width], moved: [p1.x, p2.x] };
  }
  var ref = physicsTrace();

  // 3. every character in each slot
  var perChar = [];
  for (var k = 0; k < ids.length; k++) {
    var id = ids[k], other = ids[(k + 1) % ids.length];
    ['p1', 'p2'].forEach(function (slot) {
      var otherSlot = slot === 'p1' ? 'p2' : 'p1';
      Game.setCharacter(otherSlot, other); var ok = Game.setCharacter(slot, id);
      var tr = physicsTrace();
      var h = world().heroes[slot === 'p1' ? 0 : 1];
      var sk = h.skin || {};
      perChar.push({ id: id, slot: slot, set: ok, character: sk.character, loaded: !!(sk.img && sk.img.naturalWidth), anim: !!sk.anim, hitbox: h.width,
        samePhysics: tr.trace === ref.trace });
    });
  }
  var bad = perChar.filter(function (r) { return !(r.set && r.character === r.id && r.loaded && r.hitbox === 26 && r.samePhysics && r.anim === (r.id === 'gina' || r.id === 'rae')); });
  check('all 7 characters in both slots: sprite loaded, 26 px hitbox, identical walk/push physics to the default pair', bad.length === 0 && perChar.length === 14, bad.length ? bad : '14/14 assignments, trace identical to Rae/Gina');

  // 4. representative pairings: push and names on the result screen
  var pairs = [['ariel', 'ken'], ['cindy', 'sandy'], ['linda', 'gina'], ['ken', 'rae'], ['sandy', 'ariel']];
  var pairRows = [];
  for (var p = 0; p < pairs.length; p++) {
    Game.setCharacter('p1', pairs[p][0]); Game.setCharacter('p2', pairs[p][1]);
    var trp = physicsTrace();
    var w = world(); w.heroes[p % 2].hurt(99, raw); step(1);
    var res = Game.getState().lastResult, summary = Game._debugScreens().summary;
    var loserName = Game.characters().filter(function (c) { return c.id === pairs[p][p % 2]; })[0].name;
    pairRows.push({ pair: pairs[p].join('+'), push: trp.trace === ref.trace, loser: res && res.loser, summaryHasName: summary.indexOf(loserName + ' LOSES!') >= 0, hud: Game._debugVisuals().stats ? true : true });
    await wait(1050); tap('Enter'); step(1);
    pairRows[p].rematchKeeps = cs().p1 === pairs[p][0] && cs().p2 === pairs[p][1] && world().heroes[0].skin.character === pairs[p][0] && world().heroes[1].skin.character === pairs[p][1];
  }
  check('pairings: pushing unchanged, loser name on the result, kept after Enter rematch',
    pairRows.every(function (r) { return r.push && r.summaryHasName && r.rematchKeeps; }), pairRows);

  // 5. selection on the READY screen: keys, skipping the other player, pointer, Enter
  Game.pause(); tap('Escape'); tap('Enter'); // quit -> READY (no result)
  var q = st();
  Game.setCharacter('p1', 'rae'); Game.setCharacter('p2', 'gina');
  tap('KeyC'); var c1 = cs().p2;          // gina -> (rae is 1P) -> ariel
  tap('KeyZ'); var c2 = cs().p2;          // ariel -> gina
  tap('ArrowRight'); var c3 = cs().p1;    // rae -> ariel
  tap('ArrowLeft'); tap('ArrowLeft'); var c4 = cs().p1; // ariel -> rae -> (gina is 2P) -> sandy
  var btn = document.querySelector('.shot-screen-actions button[data-action="p2-next"]');
  btn.click(); var c5 = cs().p2;          // gina -> rae
  var namesShown = Game._debugScreens().summary;
  check('READY: Z/C pick 2P, arrows pick 1P, skipping the other player; pointer arrows work',
    q === 'ready' && c1 === 'ariel' && c2 === 'gina' && c3 === 'ariel' && c4 === 'sandy' && c5 === 'rae' && /Rae and Sandy/.test(namesShown),
    [q, c1, c2, c3, c4, c5].join(' ') + ' | ' + namesShown);
  tap('Space'); var afterSpace = st();
  tap('Enter'); step(1);
  var started = st(), hs = world().heroes;
  check('Space still ignored, Enter starts with the chosen characters; no selection buttons during play',
    afterSpace === 'ready' && started === 'playing' && hs[0].skin.character === 'sandy' && hs[1].skin.character === 'rae' &&
    Array.prototype.every.call(document.querySelectorAll('.shot-screen-actions button'), function (b) { return b.hidden; }),
    [afterSpace, started, hs[0].skin.character, hs[1].skin.character]);
  // movement keys during play move, never change characters; during pause they do nothing
  var x0 = hs[0].x; key('ArrowLeft'); step(5); key('ArrowLeft', 'keyup');
  tap('Space'); tap('KeyC'); tap('ArrowRight');
  check('during play / pause the movement keys never change characters',
    cs().p1 === 'sandy' && cs().p2 === 'rae' && hs[0].x !== x0, { p1: cs().p1, p2: cs().p2, moved: hs[0].x - x0 });
  tap('Escape'); tap('Enter');

  // 6. explicit names still win over character names; restore defaults
  Game.configure({ players: { p1: { name: '小蕊' } } }); Game.setCharacter('p1', 'ken');
  var s1 = Game._debugScreens().summary;
  Game.configure({ players: { p1: { name: null } } }); Game.setCharacter('p1', 'rae'); Game.setCharacter('p2', 'gina');
  check('players.pN.name overrides the character name; defaults restored', /小蕊/.test(s1) && cs().p1 === 'rae' && cs().p2 === 'gina', s1);
  check('unknown character ids are rejected', Game.setCharacter('p1', 'nobody') === false && Game.setCharacter('p3', 'ken') === false && cs().p1 === 'rae');

  console.error = cerr; console.warn = cwarn;
  check('no errors or warnings', errors.length === 0, errors);
  window.__characterResults = rows;
  console.table(rows);
  return rows;
})();
