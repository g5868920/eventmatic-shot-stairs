#!/usr/bin/env python3
"""
Builds game-ready custom character sprites (prototype) from full-size portraits.

Input : assets/characters/custom/source/<name>-q-version.png   (about 1024x1536 RGBA, never modified)
        for every id in assets/characters/custom/characters.js
Output: assets/characters/custom/<name>-<H>.png                 (H = 32, 40, 48 game px tall)
        assets/characters/custom/skins.js                       (sizes + foot anchors for the renderer)

Steps per portrait:
  1. trim transparent padding (alpha > 16)
  2. one common scale for all portraits (based on the tallest trimmed Gina / Rae figure) so their
     relative size is preserved (a taller newcomer is capped at the target height), then premultiplied-alpha area averaging (no dark/white fringes)
  3. alpha snapped to fully opaque / transparent at 50 % so edges stay crisp under
     nearest-neighbour rendering; colours un-premultiplied
  4. foot anchor = centre of the opaque columns in the bottom 12 % of the sprite (the shoes),
     so the figure, not its hair, is centred over the hitbox
Pure Python (no imaging library needed). Run: python3 tools/build_custom_skins.py
"""
import json, os, re, struct, sys, zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'assets', 'characters', 'custom')
SRC = os.path.join(DIR, 'source')
# every character in the library (assets/characters/custom/characters.js), in registry order
NAMES = re.findall(r"\bid:\s*'([a-z0-9_-]+)'", open(os.path.join(DIR, 'characters.js')).read())
# The shared scale stays pinned to the approved Gina / Rae set (tallest of them = H px), so adding friends
# never changes existing sprites; a newcomer taller than that is capped at H.
REFERENCE = ['gina', 'rae']
HEIGHTS = [32, 40, 48]


def decode_png(path):
    d = open(path, 'rb').read()
    assert d[:8] == b'\x89PNG\r\n\x1a\n'
    i, idat = 8, b''
    while i < len(d):
        n = struct.unpack('>I', d[i:i + 4])[0]; t = d[i + 4:i + 8]; c = d[i + 8:i + 8 + n]
        if t == b'IHDR':
            w, h, bd, ct, _, _, il = struct.unpack('>IIBBBBB', c)
            assert bd == 8 and ct in (2, 6) and il == 0, (bd, ct, il)
        elif t == b'IDAT':
            idat += c
        i += 12 + n
    bpp = 4 if ct == 6 else 3
    raw = zlib.decompress(idat)
    stride = w * bpp
    prev = bytearray(stride)
    rows = []
    p = 0
    for _ in range(h):
        f = raw[p]; p += 1
        cur = bytearray(raw[p:p + stride]); p += stride
        if f == 1:
            for x in range(bpp, stride): cur[x] = (cur[x] + cur[x - bpp]) & 255
        elif f == 2:
            for x in range(stride): cur[x] = (cur[x] + prev[x]) & 255
        elif f == 3:
            for x in range(stride):
                a = cur[x - bpp] if x >= bpp else 0
                cur[x] = (cur[x] + ((a + prev[x]) >> 1)) & 255
        elif f == 4:
            for x in range(stride):
                a = cur[x - bpp] if x >= bpp else 0; b = prev[x]; c = prev[x - bpp] if x >= bpp else 0
                pa = abs(b - c); pb = abs(a - c); pc = abs(a + b - 2 * c)
                cur[x] = (cur[x] + (a if pa <= pb and pa <= pc else (b if pb <= pc else c))) & 255
        if bpp == 3:
            out = bytearray(w * 4)
            for x in range(w):
                out[4 * x:4 * x + 3] = cur[3 * x:3 * x + 3]; out[4 * x + 3] = 255
            rows.append(out)
        else:
            rows.append(cur)
        prev = cur
    return w, h, rows


def write_png(path, w, h, px):
    raw = b''.join(b'\x00' + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
                + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b''))


def bbox(w, h, rows, thr=16):
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        r = rows[y]
        for x in range(w):
            if r[4 * x + 3] > thr:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                y1 = y
    return x0, y0, x1 + 1, y1 + 1


def downscale(rows, box, scale):
    """Premultiplied area average of the trimmed box into ceil(box * scale) pixels."""
    bx0, by0, bx1, by1 = box
    sw, sh = bx1 - bx0, by1 - by0
    ow, oh = max(1, round(sw * scale)), max(1, round(sh * scale))
    out = bytearray(ow * oh * 4)
    fx, fy = sw / ow, sh / oh
    for oy in range(oh):
        ya, yb = by0 + int(oy * fy), by0 + max(int(oy * fy) + 1, int((oy + 1) * fy))
        for ox in range(ow):
            xa, xb = bx0 + int(ox * fx), bx0 + max(int(ox * fx) + 1, int((ox + 1) * fx))
            sr = sg = sb = sa = 0; n = 0
            for y in range(ya, yb):
                r = rows[y]
                for x in range(xa, xb):
                    a = r[4 * x + 3]
                    sa += a; sr += r[4 * x] * a; sg += r[4 * x + 1] * a; sb += r[4 * x + 2] * a
                    n += 1
            i = (oy * ow + ox) * 4
            if n and sa >= 0.5 * 255 * n:          # >= 50 % coverage: opaque pixel
                out[i] = min(255, round(sr / sa)); out[i + 1] = min(255, round(sg / sa)); out[i + 2] = min(255, round(sb / sa)); out[i + 3] = 255
    return ow, oh, out


def foot_anchor(ow, oh, px):
    """Centre x of opaque pixels in the bottom 12 % of rows (the shoes)."""
    y0 = oh - max(2, round(oh * 0.12))
    xs = [x for y in range(y0, oh) for x in range(ow) if px[(y * ow + x) * 4 + 3]]
    return (min(xs) + max(xs) + 1) / 2 if xs else ow / 2


def main():
    srcs = {}
    for name in NAMES:
        path = os.path.join(SRC, name + '-q-version.png')
        w, h, rows = decode_png(path)
        b = bbox(w, h, rows)
        srcs[name] = (rows, b)
        print(f'{name}: source {w}x{h}, trimmed box {b} ({b[2]-b[0]}x{b[3]-b[1]})')
    tallest = max(srcs[n][1][3] - srcs[n][1][1] for n in REFERENCE if n in srcs)
    meta = {}
    for H in HEIGHTS:
        for name in NAMES:
            rows, b = srcs[name]
            scale = min(H / tallest, H / (b[3] - b[1]))
            ow, oh, px = downscale(rows, b, scale)
            fname = f'{name}-{H}.png'
            write_png(os.path.join(DIR, fname), ow, oh, px)
            meta.setdefault(name, {})[str(H)] = {'file': 'assets/characters/custom/' + fname, 'w': ow, 'h': oh,
                                                 'anchorX': round(foot_anchor(ow, oh, px), 2)}
            print(f'  {fname}: {ow}x{oh}, foot anchor x={meta[name][str(H)]["anchorX"]}')
    with open(os.path.join(DIR, 'skins.js'), 'w') as f:
        f.write('/* Generated by tools/build_custom_skins.py. Sizes and foot anchors of the custom character sprites. */\n')
        f.write('window.SHOT_CUSTOM_SKINS = ' + json.dumps(meta, indent=2) + ';\n')
    print('wrote skins.js')


if __name__ == '__main__':
    main()
