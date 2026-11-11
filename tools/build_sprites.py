#!/usr/bin/env python3
"""
Builds the original pixel-art PNG sprite sheets in assets/ for SHOT the Stairs.

All artwork here was drawn for this project (Apache-2.0, see NOTICE). Sprites
are authored as text bitmaps (one character per pixel, '.' = transparent) plus
a few seeded procedural textures, and written as PNGs with a tiny pure-Python
encoder so the repo needs no image tooling. Run:  python3 tools/build_sprites.py
"""
import os, random, struct, sys, zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets')


# ---------------------------------------------------------------- PNG writer
class Img:
    def __init__(self, w, h, fill=(0, 0, 0, 0)):
        self.w, self.h = w, h
        self.px = [list(fill) for _ in range(w * h)]

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[y * self.w + x] = list(c)

    def get(self, x, y):
        return tuple(self.px[y * self.w + x])

    def rect(self, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.set(xx, yy, c)

    def blit(self, img, dx, dy):
        for y in range(img.h):
            for x in range(img.w):
                c = img.get(x, y)
                if c[3]:
                    self.set(dx + x, dy + y, c)

    def save(self, name):
        raw = b''
        for y in range(self.h):
            raw += b'\x00' + bytes(v for p in self.px[y * self.w:(y + 1) * self.w] for v in p)

        def chunk(t, d):
            return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
        data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', self.w, self.h, 8, 6, 0, 0, 0))
        data += chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
        path = os.path.join(OUT, name)
        with open(path, 'wb') as f:
            f.write(data)
        print(f'{name:22s} {self.w}x{self.h}')


def hexc(s):
    s = s.lstrip('#')
    return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), 255)


def raster(rows, palette, w=None, h=None):
    w = w or max(len(r) for r in rows)
    h = h or len(rows)
    img = Img(w, h)
    for y, row in enumerate(rows):
        for x, ch in enumerate(row):
            if ch in '. ':
                continue
            col = palette.get(ch)
            if col:
                img.set(x, y, hexc(col))
    return img


# ---------------------------------------------------------------- characters
# 32x32 frames facing right, feet on the bottom row, figure centred on x=16 so the
# 26-px collision box sits 3 px in from each side. Rows shorter than 32 are padded.
# K outline, C cap, c cap light, B brim, F face, f face shade, E eye, W white,
# S shirt, s shirt shade, P pants, p pants shade, O shoe, o shoe light, H hand
FRAME = 32
KID = {}
# Chunkier proportions (about 22 px wide x 28 px tall of the 32 px frame) so the
# figure reads at the reference's size relative to a platform.
KID['stand'] = [
    '', '', '', '',
    '.........KKKKKKKK',
    '........KcccCCCCCK',
    '.......KccCCCCCCCCK',
    '......KcCCCCCCCCCCCK',
    '......KCCCCCCCCCCCCKKKKKKK',
    '......KBBBBBBBBBBBBBBBBBBBK',
    '......KKKKKKKKKKKKKKKKKKKK',
    '......KHHFFFFFFFFFFFFK',
    '......KHFFFFFFFFFFFFFK',
    '......KFFFWEFFFFFWEFFK',
    '......KFFFEEFFFFFEEFFK',
    '......KFFFFFFFFFFFFFFK',
    '......KfFFFFFFFFFFFFfK',
    '.......KfFFFFFFFFFFfK',
    '........KfFFFFFFFFfK',
    '.........KKKKKKKKKK',
    '......KKKSSSSSSSSSSKKK',
    '.....KSSKSSSSSSSSSSKSSK',
    '.....KSSKSSSSSSSSSSKSSK',
    '.....KsSKSSSSSSSSSSKSsK',
    '.....KsSKsSSSSSSSSsKSsK',
    '.....KHHKsSSSSSSSSsKHHK',
    '......KK.KssssssssK.KK',
    '.........KPPPPPPPPK',
    '........KPPPPKKPPPPK',
    '........KpPPK..KPPpK',
    '.......KOOOOK..KOOOOK',
    '.......KKKKKK..KKKKKK',
]
KID['walkA'] = [
    '', '', '', '',
    '.........KKKKKKKK',
    '........KcccCCCCCK',
    '.......KccCCCCCCCCK',
    '......KcCCCCCCCCCCCK',
    '......KCCCCCCCCCCCCKKKKKKK',
    '......KBBBBBBBBBBBBBBBBBBBK',
    '......KKKKKKKKKKKKKKKKKKKK',
    '......KHHFFFFFFFFFFFFK',
    '......KHFFFFFFFFFFFFFK',
    '......KFFFWEFFFFFWEFFK',
    '......KFFFEEFFFFFEEFFK',
    '......KFFFFFFFFFFFFFFK',
    '......KfFFFFFFFFFFFFfK',
    '.......KfFFFFFFFFFFfK',
    '........KfFFFFFFFFfK',
    '.........KKKKKKKKKK',
    '......KKKSSSSSSSSSSKKK',
    '....KSSK.SSSSSSSSSSSKSSK',
    '...KSSK..SSSSSSSSSSS.KSSK',
    '...KsSK..SSSSSSSSSSS.KSsK',
    '...KHHK..KsSSSSSSSsK.KHHK',
    '....KK...KssssssssK...KK',
    '.........KPPPPPPPPK',
    '........KPPPPKPPPPPK',
    '.......KPPPK...KPPPPK',
    '......KpPPK.....KPPpK',
    '.....KOOOOK......KOOOOK',
    '.....KKKKKK......KKKKKK',
]
KID['walkB'] = [
    '', '', '', '',
    '.........KKKKKKKK',
    '........KcccCCCCCK',
    '.......KccCCCCCCCCK',
    '......KcCCCCCCCCCCCK',
    '......KCCCCCCCCCCCCKKKKKKK',
    '......KBBBBBBBBBBBBBBBBBBBK',
    '......KKKKKKKKKKKKKKKKKKKK',
    '......KHHFFFFFFFFFFFFK',
    '......KHFFFFFFFFFFFFFK',
    '......KFFFWEFFFFFWEFFK',
    '......KFFFEEFFFFFEEFFK',
    '......KFFFFFFFFFFFFFFK',
    '......KfFFFFFFFFFFFFfK',
    '.......KfFFFFFFFFFFfK',
    '........KfFFFFFFFFfK',
    '.........KKKKKKKKKK',
    '......KKKSSSSSSSSSSKKK',
    '......KSSKSSSSSSSSSKSSK',
    '......KSSKSSSSSSSSSKSSK',
    '......KsSKSSSSSSSSSKSsK',
    '......KsSKsSSSSSSSsKSsK',
    '......KHHKsSSSSSSSsKHHK',
    '.......KK.KssssssssK.KK',
    '.........KPPPPPPPPK',
    '.........KPPPPPPPPK',
    '........KpPPPKKPPPpK',
    '........KOOOOKKOOOOK',
    '........KKKKKKKKKKKK',
]
KID['fallA'] = [
    '',
    '....KK..................KK',
    '...KHHK....KKKKKKKK....KHHK',
    '...KSSK...KcccCCCCCK...KSSK',
    '...KSSK..KccCCCCCCCCK..KSSK',
    '...KsSK.KcCCCCCCCCCCCK.KsSK',
    '....KSK.KCCCCCCCCCCCCKKKKKKK',
    '....KSKKKBBBBBBBBBBBBBBBBBBBK',
    '....KSKKKKKKKKKKKKKKKKKKKKKK',
    '....KsKKHHFFFFFFFFFFFFKK',
    '.....KKKHFFFFFFFFFFFFFK',
    '......KKFFFWEFFFFFWEFFK',
    '......KFFFEEFFFFFEEFFK',
    '......KFFFFFFFFFFFFFFK',
    '......KfFFFFFFFFFFFFfK',
    '.......KfFFFFFFFFFFfK',
    '........KfFFFFFFFFfK',
    '.........KKKKKKKKKK',
    '........KSSSSSSSSSSSK',
    '........KSSSSSSSSSSSK',
    '........KSSSSSSSSSSSK',
    '........KsSSSSSSSSSsK',
    '........KsssssssssssK',
    '.......KPPPPPKKPPPPPK',
    '......KPPPPK....KPPPPK',
    '.....KPPPPK......KPPPPK',
    '....KpPPPK........KPPPpK',
    '....KOOOOK........KOOOOK',
    '...KoOOOOK........KOOOOoK',
    '...KKKKKKK........KKKKKKK',
    '', '',
]
KID['fallB'] = [
    '', '',
    '.....KK....KKKKKKKK....KK',
    '....KHHK..KcccCCCCCK..KHHK',
    '....KSSK.KccCCCCCCCCK.KSSK',
    '....KSSKKcCCCCCCCCCCCKKSSK',
    '....KsSKKCCCCCCCCCCCCKKKKKKK',
    '.....KSKKBBBBBBBBBBBBBBBBBBBK',
    '.....KSKKKKKKKKKKKKKKKKKKKKK',
    '.....KsKKHHFFFFFFFFFFFFK',
    '......KKKHFFFFFFFFFFFFFK',
    '......KKFFFWEFFFFFWEFFK',
    '......KFFFEEFFFFFEEFFK',
    '......KFFFFFFFFFFFFFFK',
    '......KfFFFFFFFFFFFFfK',
    '.......KfFFFFFFFFFFfK',
    '........KfFFFFFFFFfK',
    '.........KKKKKKKKKK',
    '........KSSSSSSSSSSSK',
    '........KSSSSSSSSSSSK',
    '........KSSSSSSSSSSSK',
    '........KsSSSSSSSSSsK',
    '........KsssssssssssK',
    '........KPPPPPPPPPPPK',
    '.......KPPPPPKKPPPPPK',
    '......KPPPPK....KPPPPK',
    '.....KpPPPK......KPPPpK',
    '.....KOOOOK......KOOOOK',
    '....KoOOOOK......KOOOOoK',
    '....KKKKKKK......KKKKKKK',
    '', '',
]
KID['fallR'] = [
    '', '', '', '',
    '.........KKKKKKKK',
    '........KcccCCCCCK',
    '.......KccCCCCCCCCK',
    '......KcCCCCCCCCCCCK',
    '......KCCCCCCCCCCCCKKKKKKK',
    '......KBBBBBBBBBBBBBBBBBBBK',
    '......KKKKKKKKKKKKKKKKKKKK',
    '......KHHFFFFFFFFFFFFK',
    '.KK...KHFFFFFFFFFFFFFK',
    'KHHK..KFFFWEFFFFFWEFFK...KK',
    'KSSKK.KFFFEEFFFFFEEFFK..KHHK',
    '.KSSSKKFFFFFFFFFFFFFFK.KSSK',
    '..KKSSSKfFFFFFFFFFFFfKKSSK',
    '....KKSSKfFFFFFFFFFFfKSSK',
    '......KSSKfFFFFFFFFfKSSK',
    '.......KSSKKKKKKKKKKSSK',
    '........KSSSSSSSSSSSSK',
    '........KSSSSSSSSSSSK',
    '........KSSSSSSSSSSSK',
    '........KsSSSSSSSSSsK',
    '........KsssssssssssK',
    '.......KPPPPPKKPPPPPK',
    '......KPPPPK....KPPPPK',
    '.....KPPPPK......KPPPPK',
    '....KpPPPK........KPPPpK',
    '....KOOOOK........KOOOOK',
    '...KoOOOOK........KOOOOoK',
    '...KKKKKKK........KKKKKKK',
]
KID['fallR2'] = [
    '', '', '', '',
    '.........KKKKKKKK',
    '........KcccCCCCCK',
    '.......KccCCCCCCCCK',
    '......KcCCCCCCCCCCCK',
    '......KCCCCCCCCCCCCKKKKKKK',
    '......KBBBBBBBBBBBBBBBBBBBK',
    '......KKKKKKKKKKKKKKKKKKKK',
    '......KHHFFFFFFFFFFFFK..KK',
    '......KHFFFFFFFFFFFFFK.KHHK',
    '.KK...KFFFWEFFFFFWEFFKKSSK',
    'KHHK..KFFFEEFFFFFEEFFKSSK',
    'KSSKK.KFFFFFFFFFFFFFFKSK',
    '.KSSSKKfFFFFFFFFFFFFfKK',
    '..KKSSSKfFFFFFFFFFFfK',
    '....KKSSKfFFFFFFFFfK',
    '......KSSKKKKKKKKKK',
    '.......KSSSSSSSSSSSK',
    '........KSSSSSSSSSSK',
    '........KSSSSSSSSSSSK',
    '........KsSSSSSSSSSsK',
    '........KsssssssssssK',
    '........KPPPPPPPPPPPK',
    '.......KPPPPPKKPPPPPK',
    '......KPPPPK....KPPPPK',
    '.....KpPPPK......KPPPpK',
    '.....KOOOOK......KOOOOK',
    '....KoOOOOK......KOOOOoK',
    '....KKKKKKK......KKKKKKK',
]
KID_PALETTES = {
    'p1': dict(K='#2b1430', C='#e8402c', c='#ff8a5c', B='#9c2418', F='#ffd9b0', f='#e8a884', E='#201020', W='#ffffff',
               S='#ff5fb0', s='#c43a84', P='#3a5ad8', p='#24399c', O='#5a2a24', o='#a0584a', H='#ffd9b0'),
    'p2': dict(K='#102030', C='#2f6ff0', c='#7fb4ff', B='#1c3fa0', F='#ffd9b0', f='#e8a884', E='#201020', W='#ffffff',
               S='#39d47c', s='#1f9454', P='#f0b030', p='#b87c18', O='#5a2a24', o='#a0584a', H='#ffd9b0'),
}
HURT = dict(K='#ff3860', C='#ffffff', c='#ffffff', B='#ffb0c0', F='#ffffff', f='#ffd0d8', E='#ff3860', W='#ffffff',
            S='#ffffff', s='#ffd0d8', P='#ffffff', p='#ffd0d8', O='#ffb0c0', o='#ffffff', H='#ffffff')
# Sheet layout: 256x64, eight 32x32 frames in a row (x = i*32); row y=0 normal, y=32 hurt.
FRAME_ORDER = ['stand', 'walkA', 'stand', 'walkB', 'fallA', 'fallB', 'fallR', 'fallR2']


def pad_frame(rows):
    rows = list(rows) + [''] * (FRAME - len(rows))
    out = []
    for r in rows[:FRAME]:
        assert len(r) <= FRAME, ('frame row too wide', len(r), r)
        out.append(r.ljust(FRAME, '.'))
    return out


def build_kid(name, pal):
    sheet = Img(FRAME * len(FRAME_ORDER), FRAME * 2)
    for i, key in enumerate(FRAME_ORDER):
        rows = pad_frame(KID[key])
        sheet.blit(raster(rows, pal, FRAME, FRAME), i * FRAME, 0)
        sheet.blit(raster(rows, HURT, FRAME, FRAME), i * FRAME, FRAME)
    sheet.save(name)


# ---------------------------------------------------------------- beer mug
MUG = [
    '....wwwwwwwww....',
    '..wwwwwwwwwwwww..',
    '.wwwwwwwwwwwwwww.',
    '.wwwwwwwwwwwwwww.',
    '..wwwwwwwwwwwww..',
    '.KwwwwwwwwwwwwK..',
    '.KGyyyyyyyyyyGKKK',
    '.KGyyyyyyyyyyGKhK',
    '.KGyyyyyyyyyyGK.hK',
    '.KGYyyyyyyyyyGK.hK',
    '.KGYyyyyyyyyyGK.hK',
    '.KGYyyyyyyyyyGK.hK',
    '.KGYyyyyyyyyyGKhK',
    '.KGYyyyyyyyyyGKKK',
    '.KGYyyyyyyyyyGK..',
    '.KGYyyyyyyyyyGK..',
    '.KGGYYYYYYYYGGK..',
    '.KGGGGGGGGGGGGK..',
    '..KKKKKKKKKKKK...',
]
MUG_PAL = dict(w='#ffffff', K='#3a2410', G='#c88a2a', y='#ffc428', Y='#ffd860', h='#e8b040')


# ---------------------------------------------------------------- platforms
FW, FH, SPIKE_H = 100, 12, 15


def build_stone():
    r = random.Random(7)
    img = Img(FW, FH, hexc('#cbb690'))
    for _ in range(int(FW * FH * 0.4)):
        x, y, t = r.randrange(FW), r.randrange(FH), r.random()
        c = '#b39b74' if t < 0.45 else ('#e2d2ae' if t < 0.8 else '#9c845e')
        img.rect(x, y, 1 + r.randrange(2), 1, hexc(c))
    for _ in range(5):  # small cracks
        x, y = r.randrange(5, FW - 8), r.randrange(2, FH - 3)
        for k in range(r.randrange(3, 6)):
            img.set(x + k, y + (k % 2), hexc('#7a6448'))
    img.rect(0, 0, FW, 1, hexc('#efe3c4'))
    img.rect(0, FH - 2, FW, 1, hexc('#8a7250'))
    img.rect(0, FH - 1, FW, 1, hexc('#5c4a30'))
    img.rect(0, 0, 1, FH, hexc('#5c4a30')); img.rect(FW - 1, 0, 1, FH, hexc('#5c4a30'))
    return img


def build_blue_brick(w=FW, h=FH, seed=11, bw=14, bh=6):
    r = random.Random(seed)
    img = Img(w, h, hexc('#2c3a8c'))
    row, y = 0, 0
    while y < h:
        off = (row % 2) * (bw // 2)
        x = -off
        while x < w:
            img.rect(x + 1, y + 1, bw - 1, bh - 1, hexc('#4c62d2' if r.random() < 0.5 else '#5a72e8'))
            img.rect(x + 1, y + 1, bw - 1, 1, hexc('#7f95ff'))
            img.rect(x + 1, y + 1, 1, bh - 1, hexc('#7f95ff'))
            if r.random() < 0.5:
                img.rect(x + 2 + r.randrange(bw - 5), y + 2 + r.randrange(max(1, bh - 3)), 2, 1, hexc('#3f52b8'))
            x += bw
        row += 1; y += bh
    img.rect(0, h - 1, w, 1, hexc('#1a2460')); img.rect(0, 0, 1, h, hexc('#1a2460')); img.rect(w - 1, 0, 1, h, hexc('#1a2460'))
    return img


def build_steel_base():
    img = Img(FW, FH, hexc('#6a6c80'))
    img.rect(0, 0, FW, 1, hexc('#9a9cb4')); img.rect(0, 1, FW, 1, hexc('#8486a0'))
    img.rect(0, FH - 2, FW, 1, hexc('#4a4c60')); img.rect(0, FH - 1, FW, 1, hexc('#2c2e3c'))
    img.rect(0, 0, 1, FH, hexc('#2c2e3c')); img.rect(FW - 1, 0, 1, FH, hexc('#2c2e3c'))
    for x in range(6, FW, 12):
        img.set(x, FH // 2, hexc('#c0c2d8')); img.set(x + 1, FH // 2 + 1, hexc('#3c3e50'))
    return img


def build_spikes(w=FW, h=SPIKE_H, pitch=10):
    img = Img(w, h)
    x = 0
    while x + pitch <= w:
        for y in range(h):
            half = (y / h) * (pitch / 2)
            l, rr = round(pitch / 2 - half), round(pitch / 2 + half)
            img.rect(x + l, y, max(1, rr - l), 1, hexc('#dcdcec'))
            img.rect(x + round(pitch / 2), y, max(1, rr - round(pitch / 2)), 1, hexc('#8c8ca4'))
            img.set(x + rr - 1, y, hexc('#3a3a4c'))
        x += pitch
    return img


def build_ceiling(w=360, h=14, pitch=14):
    img = Img(w, h)
    for x in range(0, w, pitch):
        for y in range(h):
            half = (1 - y / h) * (pitch / 2)
            l, rr = round(pitch / 2 - half), round(pitch / 2 + half)
            img.rect(x + l, y, max(1, rr - l), 1, hexc('#f4f4ff'))
            img.rect(x + round(pitch / 2), y, max(1, rr - round(pitch / 2)), 1, hexc('#b8b8cc'))
    return img


WHEEL = [
    '....KKKK....',
    '..KKssssKK..',
    '.KssSSSSssK.',
    '.KsSSWWSSsK.',
    'KsSSWddWSSsK',
    'KsSWddddWSsK',
    'KsSWddddWSsK',
    'KsSSWddWSSsK',
    '.KsSSWWSSsK.',
    '.KssSSSSssK.',
    '..KKssssKK..',
    '....KKKK....',
]
WHEEL_PAL = dict(K='#34364a', s='#9496b0', S='#c8cadc', W='#f0f0fa', d='#4a4c62')


def build_conveyor(direction):
    """4 animation frames stacked vertically (each 100x12)."""
    frames = Img(FW, FH * 4)
    wheel = raster(WHEEL, WHEEL_PAL, 12, 12)
    for f in range(4):
        img = Img(FW, FH)
        img.rect(4, 1, FW - 8, FH - 2, hexc('#8e90aa'))
        img.rect(4, 1, FW - 8, 1, hexc('#d0d2e4'))
        img.rect(4, 0, FW - 8, 1, hexc('#3a3c50')); img.rect(4, FH - 1, FW - 8, 1, hexc('#3a3c50'))
        img.rect(4, FH - 2, FW - 8, 1, hexc('#5c5e78'))
        img.rect(12, 3, FW - 24, FH - 6, hexc('#c4c6d8'))
        shift = f * 2 * direction
        belt = FW - 24
        for x in range(0, belt, 8):
            sx = (x + shift) % belt
            img.rect(12 + sx, 4, min(3, belt - sx), FH - 8, hexc('#7a7c96'))
        for a in ([38, 52] if direction > 0 else [46, 60]):
            for k in range(3):
                span = k if direction > 0 else 2 - k
                img.set(a + span, 3 + k, hexc('#ffffff')); img.set(a + span, FH - 4 - k, hexc('#ffffff'))
            img.set(a + 2 if direction > 0 else a, FH // 2, hexc('#ffffff'))
        img.blit(wheel, 0, 0); img.blit(wheel, FW - 12, 0)
        frames.blit(img, 0, f * FH)
    return frames


SPRING_MIN, SPRING_MAX = 7, 18   # upstream getHeight() range during compress/expand


def build_spring():
    """Frames for every integer height from SPRING_MIN..SPRING_MAX, stacked, each 100x(SPRING_MAX)."""
    n = SPRING_MAX - SPRING_MIN + 1
    frames = Img(FW, SPRING_MAX * n)
    for i in range(n):
        height = SPRING_MIN + i
        img = Img(FW, SPRING_MAX)
        top = SPRING_MAX - height  # draw bottom-aligned
        inner = height - 4
        cx = 8
        while cx + 14 <= FW:
            for k in range(inner):
                t = k / max(1, inner - 1)
                lx, rx = round(cx + t * 12), round(cx + 12 - t * 12)
                img.rect(lx, top + 2 + k, 2, 1, hexc('#d4d8ec'))
                img.rect(rx, top + 2 + k, 2, 1, hexc('#8c90a8'))
            cx += 20
        img.rect(0, top, FW, 2, hexc('#2fd04a')); img.rect(0, top, FW, 1, hexc('#8cff9c'))
        img.rect(0, SPRING_MAX - 2, FW, 2, hexc('#2fd04a')); img.rect(0, SPRING_MAX - 1, FW, 1, hexc('#1a8a30'))
        img.rect(0, top, 1, height, hexc('#146024')); img.rect(FW - 1, top, 1, height, hexc('#146024'))
        frames.blit(img, 0, i * SPRING_MAX)
    return frames


def build_wall(w=18, h=480):
    """Blue stone-brick wall: one wide block per row with a lighter mottled face, like the reference."""
    r = random.Random(3)
    img = Img(w, h, hexc('#1e2a70'))
    bh = 16
    row, y = 0, 0
    while y < h:
        # alternate rows: one full block / two half blocks
        blocks = [(0, w)] if row % 2 == 0 else [(0, w // 2), (w // 2, w - w // 2)]
        for bx, bw in blocks:
            base = '#5a70e0' if r.random() < 0.6 else '#6a80ee'
            img.rect(bx + 1, y + 1, bw - 1, bh - 1, hexc(base))
            img.rect(bx + 1, y + 1, bw - 1, 1, hexc('#93a8ff'))
            img.rect(bx + 1, y + 1, 1, bh - 1, hexc('#93a8ff'))
            img.rect(bx + 1, y + bh - 1, bw - 1, 1, hexc('#34429c'))
            img.rect(bx + bw - 1, y + 1, 1, bh - 1, hexc('#34429c'))
            for _ in range(int(bw * bh * 0.18)):
                t = r.random()
                c = '#93a8ff' if t < 0.6 else '#4858c0'
                img.set(bx + 2 + r.randrange(max(1, bw - 3)), y + 2 + r.randrange(bh - 3), hexc(c))
        row += 1; y += bh
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    build_kid('kid-p1.png', KID_PALETTES['p1'])
    build_kid('kid-p2.png', KID_PALETTES['p2'])
    raster(MUG, MUG_PAL, 18, 19).save('mug.png')
    build_stone().save('floor-stone.png')
    build_blue_brick().save('floor-bluebrick.png')
    build_steel_base().save('floor-steel.png')
    build_spikes().save('floor-spikes.png')
    build_conveyor(1).save('conveyor-right.png')
    build_conveyor(-1).save('conveyor-left.png')
    build_spring().save('spring.png')
    build_wall().save('wall.png')
    build_ceiling().save('ceiling.png')


if __name__ == '__main__':
    main()
