#!/usr/bin/env python3
"""
Builds animated pixel-art sprite sheets for custom Eventmatic characters (prototype).

Input : assets/characters/custom/<name>-48.png   (static 48 px sprite from build_custom_skins.py)
Output: assets/characters/custom/<name>-anim.png  (one row of 40x52 frames)
        assets/characters/custom/anims.js         (frame map + anchors for the renderer)

Identity comes from the portrait: the head, face and hair pixels are taken unchanged from the
48 px sprite (plus a separate back-hair layer for long hair). The photo poses (crossed legs,
clasped hands) cannot walk, so arms and legs are redrawn as simple outlined pixel limbs in
colours sampled from the portrait. Gina's torso is kept from the portrait; Rae's is redrawn
because her clasped arms cover it. Every frame shares the same anchor: feet centre at x=20,
bottom row y=51 (the shoe soles in the standing frames).

Frames: 0-1 idle (1 = blink + breath), 2-7 walk, 8-9 fall, 10 land, 11 hurt.
To add a character: add an entry to CHARACTERS (rows/columns read off a zoomed 48 px sprite).
Run: python3 tools/build_custom_anim.py
"""
import colorsys, json, math, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_custom_skins as C  # decode_png / write_png

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIR = os.path.join(ROOT, 'assets', 'characters', 'custom')
FW, FH, AX, AY = 40, 52, 20, 51          # frame size, anchor (feet centre x, bottom row)
OUTLINE = (36, 22, 30, 255)

# Per-character layout in 48 px sprite coordinates.
#   cx: feet centre (column boundary); bottom: lowest row; head_end: first row NOT taken as head;
#   torso: 'portrait' (copy rows/cols) or 'tee' (redraw); shoulder_y / hip_y; leg/arm sizes;
#   eye_rows / mouth_rows: where to look for the eyes / lips; back_hair: long hair below the head;
#   eye_boxes: (x0, y0, x1, y1) per eye, end-exclusive (dark pixels inside = the eye); mouth: (x, y) or None
#   to detect reddish lips; tuft_rows: top hair rows that flutter; idle_arms: 'cheeks' or 'clasp'.
CHARACTERS = {
    'gina': dict(cx=11, bottom=47, head_end=21, torso='portrait', torso_rows=(21, 34), torso_cols=(5, 17),
                 shoulder_y=22, hip_y=34, shoe_top=44, arm_len=10, sleeve='full',
                 eye_rows=(12, 17), mouth_rows=(16, 20), eye_boxes=((9, 13, 12, 16), (16, 12, 18, 15)), mouth=None, back_hair=None, tuft_rows=(0, 5), idle_arms='cheeks'),
    'rae': dict(cx=12, bottom=46, head_end=18, torso='tee', torso_rows=(18, 28), torso_half=5,
                shoulder_y=19, hip_y=28, shoe_top=43, arm_len=10, sleeve='short',
                eye_rows=(10, 15), mouth_rows=(14, 18), eye_boxes=((8, 11, 10, 13), (13, 11, 15, 13)), mouth=(10, 15), back_hair=(18, 28), tuft_rows=(0, 4), idle_arms='clasp'),
    # The five friends below use the optional keys: head_drop (portrait hand removed from the head layer),
    # hair_box / tee_box / sleeve_box (colour samples where a hat or coloured clothes break the defaults),
    # inner (scarf / inner top stripe), belt, skirt (skirt, dress or coat tails), legs (bare legs or
    # non-denim trousers), leg_w, sock (leg warmers), eye_lum, idle_arms 'crossed' / 'hat'.
    'ariel': dict(cx=13, bottom=46, head_end=20, head_drop=((0, 13, 8, 20),), torso='tee', torso_rows=(20, 33), torso_half=6,
                  tee_box=(17, 24, 21, 31), tee_pick=0.35, inner=dict(box=(9, 21, 14, 30), w=4), belt=False,
                  skirt=dict(box=(3, 33, 8, 38), rows=5, flare=2, half=6),
                  shoulder_y=21, hip_y=33, shoe_top=44, arm_len=10, sleeve='full',
                  eye_rows=(12, 17), mouth_rows=(16, 20), eye_boxes=((10, 14, 12, 17), (15, 13, 17, 15)), mouth=(13, 17),
                  hair_box=(2, 20, 6, 24), back_hair=(20, 31), tuft_rows=(0, 0), idle_arms='hat'),
    'cindy': dict(cx=11, bottom=47, head_end=18, torso='tee', torso_rows=(18, 29), torso_half=5,
                  tee_box=(7, 21, 16, 28), inner=dict(box=(9, 18, 13, 23), w=3), belt=False,
                  skirt=dict(box=(6, 30, 18, 33), rows=5, flare=2, half=5),
                  legs=dict(kind='bare', box=(9, 33, 15, 39)), leg_w=4, sock=dict(box=(7, 39, 17, 43), rows=4),
                  shoulder_y=19, hip_y=29, shoe_top=43, arm_len=10, sleeve='full',
                  eye_rows=(9, 14), mouth_rows=(14, 17), eye_boxes=((8, 11, 10, 13), (15, 10, 18, 11)), mouth=(13, 15),
                  hair_box=(1, 15, 5, 20), back_hair=(18, 29), tuft_rows=(0, 0), idle_arms='clasp'),
    # Ken: body centred under the head (cx 10), sturdier 12 px tee, torso and legs 2-3 rows shorter
    # (bottom / shoe_top moved up: the drawn shoes still stand on the frame's bottom row).
    'ken': dict(cx=10, bottom=44, head_end=18, torso='tee', torso_rows=(18, 28), torso_half=6,
                tee_box=(6, 19, 15, 22), belt=False, legs=dict(kind='jeans', box=(4, 31, 15, 44)),
                shoulder_y=19, hip_y=28, shoe_top=41, arm_len=9, sleeve='short',
                eye_rows=(11, 15), mouth_rows=(14, 18), eye_boxes=((5, 12, 8, 14), (11, 11, 14, 13)), mouth=(10, 15),
                back_hair=None, tuft_rows=(0, 0), idle_arms='crossed'),
    'linda': dict(cx=12, bottom=45, head_end=18, torso='tee', torso_rows=(18, 30), torso_half=5,
                  tee_box=(16, 19, 20, 24), tee_pick=0.85, inner=dict(box=(12, 20, 15, 25), w=2), belt=False,
                  legs=dict(kind='cloth', box=(10, 32, 17, 40)),
                  shoulder_y=19, hip_y=30, shoe_top=42, arm_len=10, sleeve='full',
                  eye_rows=(10, 15), mouth_rows=(14, 18), eye_boxes=((7, 13, 10, 15), (14, 11, 17, 13)), mouth=None,
                  hair_box=(1, 15, 6, 20), back_hair=(18, 30), tuft_rows=(0, 4), idle_arms='clasp'),
    'sandy': dict(cx=10, bottom=46, head_end=16, torso='tee', torso_rows=(16, 25), torso_half=4,
                  tee_box=(9, 17, 13, 21), belt=False, skirt=dict(box=(9, 17, 13, 21), rows=5, flare=2, half=4),
                  legs=dict(kind='bare', box=(10, 31, 16, 37)), leg_w=4,
                  shoulder_y=17, hip_y=25, shoe_top=41, arm_len=9, sleeve='none',
                  eye_rows=(8, 12), mouth_rows=(11, 15), eye_boxes=((6, 9, 9, 11), (12, 9, 15, 11)), eye_lum=0.55, mouth=(10, 13),
                  hair_box=(2, 15, 7, 22), back_hair=(16, 28), tuft_rows=(0, 3), idle_arms='clasp'),
}


# ------------------------------------------------------------------ small raster helpers
class Frame:
    def __init__(self):
        self.px = [[None] * FW for _ in range(FH)]

    def set(self, x, y, c):
        x, y = int(round(x)), int(round(y))
        if 0 <= x < FW and 0 <= y < FH and c is not None:
            self.px[y][x] = c

    def get(self, x, y):
        return self.px[y][x] if 0 <= x < FW and 0 <= y < FH else None


def lum(c):
    return colorsys.rgb_to_hls(c[0] / 255, c[1] / 255, c[2] / 255)[1]


def shade(c, f):
    return (max(0, min(255, int(c[0] * f))), max(0, min(255, int(c[1] * f))), max(0, min(255, int(c[2] * f))), 255)


def pct(colors, p):
    s = sorted(colors, key=lum)
    return s[min(len(s) - 1, int(p * (len(s) - 1)))] if s else (128, 128, 128, 255)


def load_sprite(name):
    w, h, rows = C.decode_png(os.path.join(DIR, name + '-48.png'))
    px = [[None] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            p = tuple(rows[y][4 * x:4 * x + 4])
            if p[3]:
                px[y][x] = p
    return w, h, px


def cls_jeans(c):
    return c[2] > c[0] + 15 and c[2] >= c[1]


def cls_skin(c):
    h, l, s = colorsys.rgb_to_hls(c[0] / 255, c[1] / 255, c[2] / 255)
    return h <= 0.11 and l > 0.62 and s > 0.25


# ------------------------------------------------------------------ palette + layers
def analyse(name, cfg):
    w, h, P = load_sprite(name)
    cx = cfg['cx']
    allp = [P[y][x] for y in range(h) for x in range(w) if P[y][x]]
    head = [[P[y][x] if y < cfg['head_end'] else None for x in range(w)] for y in range(h)]
    for (x0, y0, x1, y1) in cfg.get('head_drop', ()):   # e.g. a hand raised to the hat in the portrait
        for y in range(y0, min(y1, h)):
            for x in range(x0, min(x1, w)):
                head[y][x] = None
    def box_px(b, keep=lambda c: True):
        x0, y0, x1, y1 = b
        return [P[y][x] for y in range(y0, min(y1, h)) for x in range(x0, min(x1, w)) if P[y][x] and keep(P[y][x])]
    face = [P[y][x] for y in range(cfg['eye_rows'][0], cfg['mouth_rows'][1]) for x in range(cx - 5, cx + 5)
            if P[y][x] and cls_skin(P[y][x])]
    skin = pct(face, 0.6)
    hair_px = box_px(cfg['hair_box']) if cfg.get('hair_box') else [P[y][x] for y in range(0, 6) for x in range(w) if P[y][x]]
    hair_mid = pct(hair_px, 0.5)
    jeans = [P[y][x] for y in range(cfg['hip_y'] + 1, cfg['shoe_top'] - 1) for x in range(w) if P[y][x] and cls_jeans(P[y][x])]
    shoes = [P[y][x] for y in range(cfg['shoe_top'], h) for x in range(w) if P[y][x]]
    legs = cfg.get('legs')
    if legs:   # bare legs or non-denim trousers: sample the leg colour from a box instead of blue denim
        lp = box_px(legs['box'], cls_skin if legs.get('kind') == 'bare' else (cls_jeans if legs.get('kind') == 'jeans' else (lambda c: lum(c) > 0.2)))
        jeans = lp or jeans
    pal = dict(skin=skin, skin_sh=shade(skin, 0.86), hair=hair_mid,
               j_light=pct(jeans, 0.85), j_mid=pct(jeans, 0.5), j_dark=pct(jeans, 0.15),
               shoe=pct(shoes, 0.95), shoe_sh=pct(shoes, 0.45))
    if cfg.get('sock'):   # leg warmers / socks above the shoes
        sp = box_px(cfg['sock']['box'], lambda c: lum(c) > 0.6)
        pal['sock'] = pct(sp, 0.7) if sp else (235, 228, 214, 255); pal['sock_sh'] = shade(pal['sock'], 0.82)
    if cfg.get('inner'):  # scarf / inner top shown down the middle of the torso
        ip = box_px(cfg['inner']['box'], lambda c: not cls_skin(c))
        pal['inner'] = pct(ip, 0.5) if ip else OUTLINE; pal['inner_sh'] = shade(pal['inner'], 0.8)
    if cfg.get('skirt'):  # skirt / dress / coat tails below the hips
        kp = box_px(cfg['skirt']['box'], lambda c: not cls_skin(c))
        pal['skirt'] = pct(kp, 0.5) if kp else OUTLINE; pal['skirt_sh'] = shade(pal['skirt'], 0.82)
    if cfg['torso'] == 'portrait':
        r0, r1 = cfg['torso_rows']; c0, c1 = cfg['torso_cols']
        jacket = [P[y][x] for y in range(r0 + 2, r0 + 8) for x in range(c0, c0 + 4) if P[y][x]]
        pal['sleeve'] = pct(jacket, 0.4); pal['sleeve_hi'] = pct(jacket, 0.85)
        torso = [[P[y][x] if (r0 <= y < r1 and c0 <= x < c1) else None for x in range(w)] for y in range(h)]
    else:
        r0, r1 = cfg['torso_rows']
        def is_tee(c):
            h_, l_, s_ = colorsys.rgb_to_hls(c[0] / 255, c[1] / 255, c[2] / 255)
            return l_ > 0.80 and s_ < 0.45
        if cfg.get('tee_box'):   # coloured top (red tee, blue shirt, coat ...): sample a box, skip skin
            tee = box_px(cfg['tee_box'], lambda c: not cls_skin(c) and lum(c) > 0.08)
            pal['tee'] = pct(tee, cfg.get('tee_pick', 0.5)) if tee else (240, 228, 230, 255)
        else:
            tee = [P[y][x] for y in range(r0, r1) for x in range(cx - 4, cx + 4) if P[y][x] and is_tee(P[y][x])]
            pal['tee'] = pct(tee, 0.6) if tee else (240, 228, 230, 255)
        pal['tee_sh'] = shade(pal['tee'], 0.86)
        belt = [p for p in allp if lum(p) < 0.2]
        pal['belt'] = pct(belt, 0.5) if belt else (40, 30, 30, 255)
        pal['sleeve'] = pal['tee']; pal['sleeve_hi'] = pal['tee']
        if cfg.get('sleeve_box'):
            sv = box_px(cfg['sleeve_box'], lambda c: not cls_skin(c) and lum(c) > 0.08)
            if sv: pal['sleeve'] = pct(sv, 0.5)
        torso = None
    back = None
    if cfg['back_hair']:
        b0, b1 = cfg['back_hair']
        def is_hair(c):
            return abs(lum(c) - lum(hair_mid)) < 0.22 and not cls_skin(c) and not cls_jeans(c) and lum(c) < 0.75
        back = [[P[y][x] if (b0 <= y < b1 and P[y][x] and is_hair(P[y][x])) else None for x in range(w)] for y in range(h)]
    # eyes: darkest pixels inside the face, in the eye rows
    def eye(box):
        x0, y0, x1, y1 = box
        return [(x, y) for y in range(y0, y1) for x in range(x0, x1) if P[y][x] and lum(P[y][x]) < cfg.get('eye_lum', 0.45)]
    left, right = eye(cfg['eye_boxes'][0]), eye(cfg['eye_boxes'][1])
    lips = [(x, y) for y in range(*cfg['mouth_rows']) for x in range(cx - 4, cx + 4)
            if P[y][x] and P[y][x][0] > P[y][x][1] + 60 and lum(P[y][x]) < 0.75]
    if cfg.get('mouth'):
        lips = [tuple(cfg['mouth'])]
    return dict(w=w, h=h, P=P, head=head, torso=torso, back=back, pal=pal, eyes=(left, right), lips=lips)


# ------------------------------------------------------------------ drawing primitives
def blit_layer(F, layer, dx, dy, x_shift_rows=None):
    if not layer:
        return
    for y, row in enumerate(layer):
        for x, c in enumerate(row):
            if c:
                sx = x_shift_rows(y) if x_shift_rows else 0
                F.set(x + dx + sx, y + dy, c)


def stamp(F, x, y, size, c):
    h = size // 2
    for yy in range(int(round(y)) - h, int(round(y)) - h + size):
        for xx in range(int(round(x)) - h, int(round(x)) - h + size):
            F.set(xx, yy, c)


def limb_points(x0, y0, x1, y1):
    n = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    return [(x0 + (x1 - x0) * i / max(1, n - 1), y0 + (y1 - y0) * i / max(1, n - 1), i / max(1, n - 1)) for i in range(n)]


def draw_arm(F, sx, sy, hx, hy, pal, sleeve, elbow=None):
    pts = []
    if elbow:
        pts = limb_points(sx, sy, elbow[0], elbow[1]) + limb_points(elbow[0], elbow[1], hx, hy)[1:]
        n = len(pts); pts = [(p[0], p[1], i / max(1, n - 1)) for i, p in enumerate(pts)]
    else:
        pts = limb_points(sx, sy, hx, hy)
    for x, y, t in pts:
        stamp(F, x, y, 4, OUTLINE)
    for x, y, t in pts:
        if sleeve == 'full':
            col = pal['sleeve'] if t < 0.86 else pal['skin']
        elif sleeve == 'none':
            col = pal['skin']
        else:
            col = pal['sleeve'] if t < 0.3 else pal['skin']
        stamp(F, x, y, 2, col)
    stamp(F, hx, hy, 2, pal['skin'])


SHOE = ['.KWWWK.', 'KWWWWWK', 'KWWWWWK', '.KGGGK.']


def draw_leg(F, hx, hy, ax, ay, pal, width=6, sock_rows=0):
    """Wide jeans from hip centre (hx,hy) to ankle centre (ax,ay); shoe below the ankle (toe right)."""
    ay = int(round(ay))
    for y in range(int(round(hy)), ay + 1):
        t = (y - hy) / max(1, ay - hy)
        c = hx + (ax - hx) * t
        x0 = int(round(c - width / 2))
        for i in range(width):
            x = x0 + i
            if i == 0 or i == width - 1:
                col = OUTLINE
            elif ay - y < sock_rows:
                col = pal['sock'] if i < width - 2 else pal['sock_sh']
            elif i == 1:
                col = pal['j_light']
            elif i == width - 2:
                col = pal['j_dark']
            else:
                col = pal['j_mid']
            F.set(x, y, col)
    # cuff
    x0 = int(round(ax - width / 2))
    for i in range(1, width - 1):
        F.set(x0 + i, ay, pal['sock_sh'] if sock_rows else pal['j_dark'])
    sx = int(round(ax)) - 3
    for r, row in enumerate(SHOE):
        for i, ch in enumerate(row):
            col = {'K': OUTLINE, 'W': pal['shoe'], 'G': pal['shoe_sh']}.get(ch)
            if col:
                F.set(sx + i, ay + 1 + r, col)


def draw_tee(F, cx, r0, r1, half, pal, dy, belt=True, inner=0):
    for y in range(r0, r1):
        for x in range(cx - half, cx + half):
            edge = x == cx - half or x == cx + half - 1
            if y == r1 - 1 and not belt:
                col = OUTLINE if edge else pal['tee_sh']
            elif y == r1 - 1:
                col = OUTLINE if edge else (pal['belt'] if abs(x - cx + 0.5) > 1 else (170, 170, 176, 255))
            elif edge:
                col = OUTLINE
            elif inner and abs(x - cx + 0.5) < inner / 2:
                col = pal['inner'] if x < cx else pal['inner_sh']
            elif x in (cx - half + 1, cx + half - 2):
                col = pal['tee_sh']
            else:
                col = pal['tee']
            F.set(x, y + dy, col)
    F.set(cx - 1, r0 + dy, pal['skin']); F.set(cx, r0 + dy, pal['skin'])          # neckline
    F.set(cx - 1, r0 + 1 + dy, pal['skin_sh'])


def draw_skirt(F, cx, top, rows, half, flare, pal, dy):
    """Skirt, dress or coat tails: a trapezoid from the hips widening by `flare` px over `rows` rows."""
    for r in range(rows):
        w = half + int(round(flare * (r + 1) / rows))
        for x in range(cx - w, cx + w):
            edge = x == cx - w or x == cx + w - 1 or r == rows - 1
            F.set(x, top + r + dy, OUTLINE if edge else (pal['skirt_sh'] if x >= cx + w - 2 or (r % 3 == 2 and x % 3 == 0) else pal['skirt']))


# ------------------------------------------------------------------ face edits
def face_edit(head, A, mode):
    """Return a copy of the head layer with blinking or hurt eyes / mouth."""
    H = [row[:] for row in head]
    left, right = A['eyes']
    pal = A['pal']
    for cluster in (left, right):
        if not cluster:
            continue
        for x, y in cluster:
            H[y][x] = pal['skin_sh'] if mode == 'blink' else pal['skin']
        xs = [p[0] for p in cluster]; ys = [p[1] for p in cluster]
        ex = round(sum(xs) / len(xs)); ey = round(sum(ys) / len(ys))
        if mode == 'blink':
            for x in range(min(xs), max(xs) + 1):
                H[max(ys)][x] = OUTLINE
        else:  # hurt: squeezed '>' '<'
            s = 1 if cluster is left else -1
            for (dx, dy) in ((-s, -1), (0, 0), (-s, 1)):
                if 0 <= ey + dy < len(H) and 0 <= ex + dx < len(H[0]):
                    H[ey + dy][ex + dx] = OUTLINE
    if mode == 'hurt' and A['lips']:
        mx = round(sum(p[0] for p in A['lips']) / len(A['lips'])); my = round(sum(p[1] for p in A['lips']) / len(A['lips']))
        for (dx, dy) in ((0, 0), (1, 0), (0, 1), (1, 1)):
            if 0 <= my + dy < len(H) and 0 <= mx + dx < len(H[0]):
                H[my + dy][mx + dx] = (110, 26, 40, 255)
    return H


# ------------------------------------------------------------------ poses
def pose_frame(name, cfg, A, pose):
    """pose: dict(body_dy, legs=[(ax,ay_lift),(ax,ay_lift)], arms=[(hx,hy,elbow),..], face, hair_dx, hair_dy, tuft_dx)"""
    F = Frame()
    ox = AX - cfg['cx'] + 0      # sprite x -> frame x (feet boundary at 20)
    oy = AY - cfg['bottom']      # sprite y -> frame y
    pal = A['pal']; cx = cfg['cx']
    bdy = pose.get('body_dy', 0)
    sy = cfg['shoulder_y'] + bdy
    half = (cfg['torso_cols'][1] - cfg['torso_cols'][0]) // 2 if cfg['torso'] == 'portrait' else cfg['torso_half']
    shoulders = [(cx - half + 0.5, sy), (cx + half - 1.5, sy)]
    hip_y = cfg['hip_y'] + bdy
    hips = [(cx - 3, hip_y), (cx + 3, hip_y)]
    ankle_y = cfg['shoe_top'] - 1
    def S(x, y):  # sprite -> frame
        return x + ox, y + oy
    arms = pose['arms']
    # back hair (long hair falls behind the body), then the back arm (index 0 = left side)
    if A['back']:
        hdx, hdy = pose.get('hair_dx', 0), pose.get('hair_dy', 0)
        blit_layer(F, A['back'], ox + hdx, oy + bdy + hdy)
    a = arms[0]
    p0 = S(*shoulders[0]); p1 = S(cx + a[0], sy + a[1]); el = S(cx + a[2][0], sy + a[2][1]) if a[2] else None
    back_arm = (p0, p1, el)
    if not pose.get('back_arm_front'):
        draw_arm(F, p0[0], p0[1], p1[0], p1[1], pal, cfg['sleeve'], el)
    # legs
    for i, (lx, lift) in enumerate(pose['legs']):
        h0 = S(*hips[i]); ank = S(cx + lx, ankle_y - lift)
        if 'leg_w' in cfg or 'sock' in cfg:
            draw_leg(F, h0[0], h0[1], ank[0], ank[1], pal, cfg.get('leg_w', 6), cfg['sock']['rows'] if cfg.get('sock') else 0)
        else:
            draw_leg(F, h0[0], h0[1], ank[0], ank[1], pal)
    # torso
    if cfg['torso'] == 'portrait':
        blit_layer(F, A['torso'], ox, oy + bdy)
    else:
        r0, r1 = cfg['torso_rows']
        if 'belt' in cfg or 'inner' in cfg:
            draw_tee(F, cx + ox, r0 + oy, r1 + oy, cfg['torso_half'], pal, bdy, cfg.get('belt', True), cfg['inner']['w'] if cfg.get('inner') else 0)
        else:
            draw_tee(F, cx + ox, r0 + oy, r1 + oy, cfg['torso_half'], pal, bdy)
    if cfg.get('skirt'):
        sk = cfg['skirt']
        draw_skirt(F, cx + ox, cfg['torso_rows'][1] + oy - 1, sk['rows'], sk.get('half', cfg.get('torso_half', 5)), sk['flare'] + pose.get('skirt_dx', 0), pal, bdy)
    if pose.get('front_arm_behind'):
        a = arms[1]
        p0 = S(*shoulders[1]); p1 = S(cx + a[0], sy + a[1]); el = S(cx + a[2][0], sy + a[2][1]) if a[2] else None
        draw_arm(F, p0[0], p0[1], p1[0], p1[1], pal, cfg['sleeve'], el)
    # head (with face edit) and hair tuft flutter
    head = face_edit(A['head'], A, pose['face']) if pose.get('face') else A['head']
    t0, t1 = cfg['tuft_rows']; tdx = pose.get('tuft_dx', 0)
    blit_layer(F, head, ox, oy + bdy + pose.get('head_dy', 0), lambda y: tdx if t0 <= y < t1 else 0)
    if pose.get('back_arm_front'):   # e.g. crossed arms or a hand raised to the hat: drawn over the body
        q0, q1, qel = back_arm
        draw_arm(F, q0[0], q0[1], q1[0], q1[1], pal, cfg['sleeve'], qel)
    # front arm (unless the pose tucks it behind the head, e.g. hands on cheeks)
    if not pose.get('front_arm_behind'):
        a = arms[1]
        p0 = S(*shoulders[1]); p1 = S(cx + a[0], sy + a[1]); el = S(cx + a[2][0], sy + a[2][1]) if a[2] else None
        draw_arm(F, p0[0], p0[1], p1[0], p1[1], pal, cfg['sleeve'], el)
    return F


def poses_for(cfg):
    L = cfg['arm_len']
    half = (cfg['torso_cols'][1] - cfg['torso_cols'][0]) // 2 if cfg['torso'] == 'portrait' else cfg['torso_half']
    sl, sr = -half + 0.5, half - 1.5            # shoulder x offsets from cx
    hipL, hipR = -3, 3
    P = []
    # idle arms keep the portrait's signature pose
    if cfg['idle_arms'] == 'cheeks':   # elbows down, hands up to the cheeks (hands end under the head)
        idle_arms = [(sl + 2, -3, (sl - 1, 7)), (sr - 2, -3, (sr + 1, 7))]
    elif cfg['idle_arms'] == 'crossed':   # forearms folded across the chest, elbows tucked at the torso edge
        idle_arms = [(sr - 1, 5, (sl, 7)), (sl + 1, 6, (sr, 8))]
    elif cfg['idle_arms'] == 'hat':       # one hand up at the hat brim, the other at the hip
        idle_arms = [(sl + 1, -9, (sl - 3, -1)), (sr + 1, L - 3, None)]
    else:                              # hands clasped in front of the hips
        idle_arms = [(-1, L - 1, None), (0, L - 1, None)]
    idle_legs = [(hipL + 1, 0), (hipR - 1, 0)]
    tuck = cfg['idle_arms'] == 'cheeks'
    front = cfg['idle_arms'] in ('crossed', 'hat')
    extra = dict(back_arm_front=True) if front else {}
    P.append(dict(arms=idle_arms, legs=idle_legs, front_arm_behind=tuck, **extra))                          # 0 idle
    P.append(dict(arms=idle_arms, legs=idle_legs, face='blink', head_dy=1, front_arm_behind=tuck, **extra)) # 1 idle: blink + breath
    for f in range(6):                                                                 # 2-7 walk
        s = math.sin(2 * math.pi * f / 6); c = math.cos(2 * math.pi * f / 6)
        bob = 1 if abs(s) > 0.8 else 0
        legs = [(hipL + 3.2 * s, 1 if c > 0.4 else 0), (hipR - 3.2 * s, 1 if c < -0.4 else 0)]
        arms = [(sl - 1 - 2.6 * s, L - 1, None), (sr + 1 + 2.6 * s, L - 1, None)]
        P.append(dict(arms=arms, legs=legs, body_dy=bob, hair_dx=0 if f in (0, 3) else -1, hair_dy=bob, tuft_dx=-1 if f in (1, 2, 4, 5) else 0))
    for f in range(2):                                                                 # 8-9 fall
        arms = [(sl - 5 - f, -5 + f, None), (sr + 5 + f, -5 + f, None)]
        legs = [(hipL - 2, 3), (hipR + 2, 2 + f)]
        P.append(dict(arms=arms, legs=legs, hair_dy=-2, tuft_dx=0, head_dy=0))
    P.append(dict(arms=[(sl - 4, L - 4, None), (sr + 4, L - 4, None)], legs=[(hipL - 2, 0), (hipR + 2, 0)], body_dy=2, hair_dy=1))  # 10 land
    P.append(dict(arms=[(sl - 6, -6, None), (sr + 6, -6, None)], legs=[(hipL - 1, 0), (hipR + 1, 1)], face='hurt', hair_dx=-1))  # 11 hurt
    return P


FRAMES = {'idle': [0, 1], 'walk': [2, 3, 4, 5, 6, 7], 'fall': [8, 9], 'land': [10], 'hurt': [11]}


def main():
    meta = {}
    for name, cfg in CHARACTERS.items():
        A = analyse(name, cfg)
        poses = poses_for(cfg)
        sheet = bytearray(FW * len(poses) * FH * 4)
        SW = FW * len(poses)
        for i, pose in enumerate(poses):
            F = pose_frame(name, cfg, A, pose)
            for y in range(FH):
                for x in range(FW):
                    c = F.px[y][x]
                    if c:
                        j = (y * SW + i * FW + x) * 4
                        sheet[j:j + 4] = bytes(c[:3]) + b'\xff'
        out = os.path.join(DIR, name + '-anim.png')
        C.write_png(out, SW, FH, sheet)
        meta[name] = dict(file='assets/characters/custom/' + name + '-anim.png', frameW=FW, frameH=FH,
                          anchorX=AX, anchorBottom=AY + 1, frames=FRAMES)
        print(f'{name}: {len(poses)} frames -> {out}  eyes {len(A["eyes"][0])}+{len(A["eyes"][1])} px, lips {len(A["lips"])} px')
    with open(os.path.join(DIR, 'anims.js'), 'w') as f:
        f.write('/* Generated by tools/build_custom_anim.py. Animated sheets for custom characters. */\n')
        f.write('window.SHOT_CUSTOM_ANIMS = ' + json.dumps(meta, indent=2) + ';\n')
    print('wrote anims.js')


if __name__ == '__main__':
    main()
