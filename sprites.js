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
    var keys = Object.keys(MANIFEST), pending = keys.length, out = {};
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

  function finish(img) {
    var S = {
      images: img,
      font: { draw: drawText, width: textWidth, has: hasGlyphs, h: FONT_H, w: FONT_W },
      /** draw conveyor frame f (0..3) with its bottom edge at (x, y) */
      drawConveyor: function (ctx, dir, f, x, y) {
        var sheet = dir > 0 ? img.conveyorRight : img.conveyorLeft;
        ctx.drawImage(sheet, 0, (f & 3) * 12, 100, 12, Math.round(x), Math.round(y) - 12, 100, 12);
      },
      /** draw the spring at its current height (bottom edge at y) */
      drawSpring: function (ctx, x, y, height) {
        var h = Math.max(SPRING_MIN, Math.min(SPRING_MAX, Math.round(height)));
        var fi = h - SPRING_MIN;
        ctx.drawImage(img.spring, 0, fi * SPRING_MAX, 100, SPRING_MAX, Math.round(x), Math.round(y) - SPRING_MAX, 100, SPRING_MAX);
      },
      drawFloor: function (ctx, sheet, x, y) {
        ctx.drawImage(sheet, Math.round(x), Math.round(y) - 12);
      },
      /** a floor skin clipped to a height (used while the flipping floor turns) */
      drawFloorClipped: function (ctx, sheet, x, y, height) {
        var h = Math.max(0, Math.min(12, Math.round(height)));
        if (h <= 0) return;
        ctx.drawImage(sheet, 0, 12 - h, 100, h, Math.round(x), Math.round(y) - h, 100, h);
      }
    };
    return S;
  }

  global.ShotSprites = { load: load, MANIFEST: MANIFEST, drawText: drawText, textWidth: textWidth, FONT: FONT };
})(window);
