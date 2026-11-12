// Isolated copy of Eventmatic bitmap font; Apache-2.0. No production script is loaded.
(function(){
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
      drawMixed(ctx, str, x, y, scale, color, align, opts.shadow);
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



  // Local system CJK raster, thresholded once at a 14 px cell and cached.
  // No font download; Latin keeps the original 5x7 artwork even in mixed names.
  var nameGlyphs = new Map();
  function nameGlyph(ch) {
    if(nameGlyphs.has(ch)) return nameGlyphs.get(ch);
    var cv=document.createElement('canvas');cv.width=14;cv.height=16;
    var c=cv.getContext('2d');c.font='400 14px "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif';
    c.fillStyle='#fff';c.textBaseline='alphabetic';c.fillText(ch,0,13);
    var pixels=c.getImageData(0,0,14,16), points=[];
    for(var yy=0;yy<16;yy++)for(var xx=0;xx<14;xx++)if(pixels.data[(yy*14+xx)*4+3]>=170)points.push([xx,yy]);
    nameGlyphs.set(ch,points);return points;
  }
  function measure(str,scale) {
    return Array.from(String(str)).reduce(function(w,ch){return w+(FONT[ch.toUpperCase()]?6:15)*scale;},0)-scale;
  }
  function drawMixed(ctx,str,x,y,scale,color,align,shadow){
    var width=measure(str,scale);if(align==='center')x-=Math.round(width/2);else if(align==='right')x-=width;
    x=Math.round(x);y=Math.round(y);
    var passes=shadow?[[shadow,scale,scale],[color,0,0]]:[[color,0,0]];
    passes.forEach(function(pass){var at=x+pass[1];ctx.fillStyle=pass[0];
      Array.from(str).forEach(function(ch){var latin=FONT[ch.toUpperCase()];
        if(latin){latin.forEach(function(row,yy){Array.from(row).forEach(function(px,xx){if(px==='#')ctx.fillRect(at+xx*scale,y+pass[2]+2*scale+yy*scale,scale,scale);});});at+=6*scale;}
        else{nameGlyph(ch).forEach(function(p){ctx.fillRect(at+p[0]*scale,y+pass[2]+p[1]*scale,scale,scale);});at+=13*scale;}
      });
    });
  }

window.PixelFont = {draw: drawText, width: textWidth, glyphs: FONT, measure: measure, hasGlyphs: hasGlyphs};
})();
