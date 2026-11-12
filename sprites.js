/**
 * SHOT the Stairs — sprite loader and pixel font.
 *
 * Loads the PNG sprite sheets in assets/ (built by tools/build_sprites.py, all
 * original artwork, Apache-2.0) and exposes them to the renderer. Character
 * sheets use the upstream 240x60 layout (26x26 frames at x = 2,32,62,...;
 * row y=2 normal, y=32 hurt) and can be swapped per player through
 * SHOT_CONFIG.players.pN.sheet (see docs/CHARACTERS.md).
 */
;(function (global) {
  'use strict';

  /* ---------- 5x7 pixel font: uppercase, digits, punctuation ---------- */
  var FONT = {
    'A': ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'B': ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
    'C': ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
    'D': ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
    'E': ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
    'F': ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
    'G': ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.###.'],
    'H': ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
    'I': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
    'J': ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
    'K': ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
    'L': ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
    'M': ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
    'N': ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
    'O': ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'P': ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
    'Q': ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
    'R': ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
    'S': ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
    'T': ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
    'U': ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
    'V': ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
    'W': ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
    'X': ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
    'Y': ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
    'Z': ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
    '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
    '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
    '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
    '3': ['#####', '...#.', '..#..', '...#.', '....#', '#...#', '.###.'],
    '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
    '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
    '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
    '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
    '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
    '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
    ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
    '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
    '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
    '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
    ':': ['.....', '..#..', '..#..', '.....', '..#..', '..#..', '.....'],
    '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
    ',': ['.....', '.....', '.....', '.....', '..#..', '..#..', '.#...'],
    '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
    "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
    '\u2190': ['.....', '..#..', '.#...', '#####', '.#...', '..#..', '.....'],
    '\u2192': ['.....', '..#..', '...#.', '#####', '...#.', '..#..', '.....'],
    '\u2191': ['..#..', '.###.', '#.#.#', '..#..', '..#..', '..#..', '.....'],
    '\u2193': ['.....', '..#..', '..#..', '..#..', '#.#.#', '.###.', '..#..'],
    '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
    '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
    '(': ['..#..', '.#...', '#....', '#....', '#....', '.#...', '..#..'],
    ')': ['..#..', '...#.', '....#', '....#', '....#', '...#.', '..#..'],
    '×': ['.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....']
  };
  var FONT_W = 5, FONT_H = 7;

  function hasGlyphs(str) {
    str = String(str).toUpperCase();
    for (var i = 0; i < str.length; ++i) if (!FONT[str.charAt(i)]) return false;
    return true;
  }
  function textWidth(str, scale) {
    return String(str).length * (FONT_W + 1) * scale - scale;
  }
  /** opts: { scale, color, shadow, italic, align:'left'|'center'|'right' }. Falls back to canvas text for CJK etc. */
  function drawText(ctx, str, x, y, opts) {
    opts = opts || {};
    var scale = opts.scale || 1, color = opts.color || '#fff', align = opts.align || 'left';
    str = String(str);
    if (!hasGlyphs(str)) {
      ctx.save();
      ctx.font = 'bold ' + (FONT_H * scale) + 'px monospace';
      ctx.textAlign = align; ctx.textBaseline = 'top';
      if (opts.shadow) { ctx.fillStyle = opts.shadow; ctx.fillText(str, x + scale, y + scale); }
      ctx.fillStyle = color; ctx.fillText(str, x, y);
      ctx.restore();
      return;
    }
    str = str.toUpperCase();
    var w = textWidth(str, scale);
    if (align === 'center') x -= Math.round(w / 2); else if (align === 'right') x -= w;
    x = Math.round(x); y = Math.round(y);
    var passes = opts.shadow ? [[opts.shadow, scale, scale], [color, 0, 0]] : [[color, 0, 0]];
    for (var p = 0; p < passes.length; ++p) {
      ctx.fillStyle = passes[p][0];
      var cx = x + passes[p][1], cy = y + passes[p][2];
      for (var i = 0; i < str.length; ++i) {
        var g = FONT[str.charAt(i)];
        for (var r = 0; r < FONT_H; ++r) {
          var shear = opts.italic ? Math.floor((FONT_H - 1 - r) / 3) * scale : 0;
          for (var c = 0; c < FONT_W; ++c) {
            if (g[r].charAt(c) === '#') ctx.fillRect(cx + c * scale + shear, cy + r * scale, scale, scale);
          }
        }
        cx += (FONT_W + 1) * scale;
      }
    }
  }

  /* ---------- asset manifest ---------- */
  var BASE = 'assets/';
  var MANIFEST = {
    kidP1: 'kid-p1.png', kidP2: 'kid-p2.png', mug: 'mug.png',
    stone: 'floor-stone.png', blueBrick: 'floor-bluebrick.png', steel: 'floor-steel.png', spikes: 'floor-spikes.png',
    conveyorRight: 'conveyor-right.png', conveyorLeft: 'conveyor-left.png', spring: 'spring.png',
    wall: 'wall.png', ceiling: 'ceiling.png'
  };
  var SPRING_MIN = 7, SPRING_MAX = 18; // must match tools/build_sprites.py

  /**
   * Load every sheet. `overrides` may replace any manifest key with a URL
   * (e.g. { kidP1: 'skins/alice.png' }). Calls done(sprites).
   */
  function load(overrides, done) {
    overrides = overrides || {};
    var keys = Object.keys(MANIFEST);
    Object.keys(overrides).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); // extra images (custom skins)
    var pending = keys.length, out = {};
    keys.forEach(function (k) {
      var img = new Image();
      var url = overrides[k] || (BASE + MANIFEST[k]);
      img.onload = img.onerror = function () {
        out[k] = img;
        if (--pending === 0) done(finish(out));
      };
      img.src = url;
    });
  }

  function slice(ctx, sheet, sy, sh, x, y, w, cap) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w);
    var sw = sheet.width;
    if (w === sw) { ctx.drawImage(sheet, 0, sy, sw, sh, x, y, sw, sh); return; }
    cap = Math.min(cap, Math.floor(w / 2));
    if (cap > 0) {
      ctx.drawImage(sheet, 0, sy, cap, sh, x, y, cap, sh);
      ctx.drawImage(sheet, sw - cap, sy, cap, sh, x + w - cap, y, cap, sh);
    }
    var mid = sw - 2 * cap, dx = x + cap, end = x + w - cap;
    while (dx < end) {
      var piece = Math.min(mid, end - dx);
      ctx.drawImage(sheet, cap, sy, piece, sh, dx, y, piece, sh);
      dx += piece;
    }
  }

  function finish(img) {
    var S = {
      images: img,
      font: { draw: drawText, width: textWidth, has: hasGlyphs, h: FONT_H, w: FONT_W },
      /**
       * 3-slice horizontal draw: left cap, tiled middle, right cap, so a platform sheet drawn at its
       * native width is pixel-identical and any other width stays crisp (no stretching).
       */
      slice: slice,
      /** draw conveyor frame f (0..3), width w, bottom edge at (x, y) */
      drawConveyor: function (ctx, dir, f, x, y, w) {
        var sheet = dir > 0 ? img.conveyorRight : img.conveyorLeft;
        slice(ctx, sheet, (f & 3) * 12, 12, x, y - 12, w || sheet.width, 12);
      },
      /** draw the spring at its current height (bottom edge at y), width w */
      drawSpring: function (ctx, x, y, height, w) {
        var h = Math.max(SPRING_MIN, Math.min(SPRING_MAX, Math.round(height)));
        slice(ctx, img.spring, (h - SPRING_MIN) * SPRING_MAX, SPRING_MAX, x, y - SPRING_MAX, w || img.spring.width, 2);
      },
      drawFloor: function (ctx, sheet, x, y, w) {
        slice(ctx, sheet, 0, 12, x, y - 12, w || sheet.width, 1);
      },
      /** a floor skin clipped to a height (used while the flipping floor turns) */
      drawFloorClipped: function (ctx, sheet, x, y, height, w) {
        var h = Math.max(0, Math.min(12, Math.round(height)));
        if (h <= 0) return;
        slice(ctx, sheet, 12 - h, h, x, y - h, w || sheet.width, 1);
      },
      /** spike row on top of a spike platform (tiles whole teeth) */
      drawSpikes: function (ctx, x, y, w) {
        slice(ctx, img.spikes, 0, img.spikes.height, x, y, w || img.spikes.width, 0);
      }
    };
    // SHOT Phase 1: decorate floor/mug/wall art only; character sheets and font stay intact.
    if (global.ShotArcade) S.arcade = global.ShotArcade.create(S);
    return S;
  }

  global.ShotSprites = { load: load, MANIFEST: MANIFEST, drawText: drawText, textWidth: textWidth, FONT: FONT };
})(window);
