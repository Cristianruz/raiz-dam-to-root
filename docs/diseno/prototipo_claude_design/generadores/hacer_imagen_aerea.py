# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Ilustración sintética para el prototipo de diseño; no produce datos del proyecto.
"""Second-generation synthetic aerial base for the ROOT prototype (illustrative, not real imagery).
Same parcel geometry as fields.json (1 px = 2 m); richer, more photographic rendering."""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

rng = np.random.default_rng(21)
W, H = 2400, 1400


def fractal(w, h, octaves=5, seed=0, base=6, pers=0.5):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), dtype=np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        n = base * (2 ** o)
        small = r.random((max(2, int(n * h / w) + 2), n + 2)).astype(np.float32)
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += amp * (np.asarray(img, dtype=np.float32) / 255.0)
        tot += amp
        amp *= pers
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-6)


def lerp(a, b, t):
    return a + (b - a) * t


fields = json.load(open('fields.json'))

# ------------------------------------------------------------ arid ground
n_big = fractal(W, H, 5, 101, 3)
n_mid = fractal(W, H, 5, 102, 14)
n_fine = fractal(W, H, 4, 103, 90)
tan = np.array([198, 174, 138], np.float32)
ochre = np.array([176, 146, 108], np.float32)
pale = np.array([218, 202, 172], np.float32)
g = lerp(ochre, tan, n_big[..., None])
g = lerp(g, pale, np.clip((n_mid[..., None] - 0.55) * 2.2, 0, 1) * 0.7)
g *= (0.9 + 0.2 * n_fine[..., None])
# desert scrub speckle
scrub_d = np.clip(fractal(W, H, 4, 104, 8) - 0.42, 0, 1) * 0.07
pts = rng.random((H, W)) < scrub_d
pts = ndi.binary_dilation(pts, iterations=1) & (rng.random((H, W)) < 0.8)
scrub = ndi.gaussian_filter(pts.astype(np.float32), 0.7)
g = lerp(g, np.array([112, 112, 80], np.float32), np.clip(scrub * 1.5, 0, 0.6)[..., None])
# dry washes
wash = Image.new('L', (W, H), 0)
dw = ImageDraw.Draw(wash)
for k in range(7):
    x, y = rng.integers(0, W), 0
    pts_l = []
    ang = rng.uniform(1.2, 1.9)
    for s in range(120):
        pts_l.append((float(x), float(y)))
        ang += rng.normal(0, 0.12)
        x += 14 * np.cos(ang)
        y += 14 * abs(np.sin(ang))
    dw.line(pts_l, fill=int(rng.integers(90, 170)), width=int(rng.integers(2, 6)), joint='curve')
wash = np.asarray(wash.filter(ImageFilter.GaussianBlur(2.2)), np.float32) / 255.0
g = lerp(g, np.array([226, 212, 186], np.float32), wash[..., None] * 0.8)
arr = g.copy()

# ------------------------------------------------------------ parcels
PAL = {
    'alfalfa': [(84, 120, 60), (96, 130, 64), (72, 108, 56), (104, 134, 70)],
    'cereal': [(138, 146, 96), (126, 140, 90)],
    'fallow': [(148, 116, 88), (132, 102, 78), (160, 128, 98)],
    'stubble': [(192, 172, 124), (182, 160, 112)],
    'bare': [(190, 164, 128), (178, 150, 116)],
    'pecan': [(118, 108, 82), (108, 100, 76)],
}
soil = np.array([172, 142, 108], np.float32)


def render_field(f):
    x, y, w, h, kind = f['x'], f['y'], f['w'], f['h'], f['kind']
    sid = int(rng.integers(0, 1e6))
    col = np.array(PAL[kind][int(rng.integers(0, len(PAL[kind])))], np.float32)
    col *= rng.uniform(0.94, 1.06, 3).astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    lowv = fractal(w, h, 4, sid, 2)
    midv = fractal(w, h, 4, sid + 1, 9)
    patch = np.zeros((h, w, 3), np.float32) + col
    along_x = h >= w  # rows run along the long axis
    u = xx if along_x else yy  # across rows
    v = yy if along_x else xx  # along rows
    L = float(h if along_x else w)
    wob = (midv - 0.5) * 3.0
    if kind == 'pecan':
        sp = float(rng.choice([7.0, 8.0]))
        jx = (fractal(w, h, 2, sid + 2, 30) - 0.5) * 1.6
        dx = ((xx + jx) % sp) - sp / 2
        dy = ((yy + jx) % sp) - sp / 2
        cell = (np.floor((xx + jx) / sp) * 7919 + np.floor((yy + jx) / sp) * 104729).astype(np.int64)
        rnd = ((cell * 2654435761) % 1000) / 1000.0
        rad = 2.3 + 1.4 * rnd
        miss = rnd > 0.955
        r = np.sqrt(dx * dx + dy * dy)
        crown = np.clip((rad - r) / 1.3, 0, 1) * (~miss)
        sh = np.clip((rad - np.sqrt((dx - 1.8) ** 2 + (dy - 1.8) ** 2)) / 1.4, 0, 1) * (~miss)
        ground = patch * (0.86 + 0.28 * lowv[..., None])
        strips = 0.5 + 0.5 * np.cos(2 * np.pi * (u + wob) / sp)
        ground = lerp(ground, np.array([92, 104, 66], np.float32), (strips * 0.22)[..., None])
        ground *= (1 - 0.34 * sh)[..., None]
        tree = np.array([46, 78, 40], np.float32) * (0.75 + 0.5 * rnd)[..., None]
        tree = tree * (0.85 + 0.3 * np.clip(-(dx + dy) / (2 * sp) + 0.5, 0, 1))[..., None]
        patch = lerp(ground, tree, crown[..., None])
    else:
        vig = 0.84 + 0.30 * lowv
        patch *= vig[..., None]
        period = {'alfalfa': 3.0, 'cereal': 2.6, 'fallow': 3.4, 'stubble': 3.0, 'bare': 5.0}[kind]
        rows = 0.5 + 0.5 * np.sin(2 * np.pi * (u + wob * 0.5) / period)
        amp = {'alfalfa': 0.05, 'cereal': 0.13, 'fallow': 0.09, 'stubble': 0.08, 'bare': 0.04}[kind]
        patch *= (1 - amp + 2 * amp * rows)[..., None]
        # irrigation borders (melgas)
        bw = float(rng.integers(15, 24))
        bpos = (u % bw)
        border = np.clip(1.4 - np.abs(bpos - 0.8), 0, 1)
        patch = lerp(patch, patch * 0.8 + soil * 0.14, (border * 0.55)[..., None])
        strip_id = np.floor(u / bw)
        tone = (np.sin(strip_id * 12.9898 + sid) * 43758.5453) % 1.0
        patch *= (0.955 + 0.09 * tone)[..., None]
        if kind in ('alfalfa', 'cereal'):
            # wetter and denser near the head ditch, thin spots elsewhere
            head = np.clip(1 - v / L, 0, 1) if rng.random() < 0.5 else np.clip(v / L, 0, 1)
            patch *= (0.93 + 0.1 * head)[..., None]
            thin = np.clip((midv * 0.6 + lowv * 0.4 - (0.66 if kind == 'alfalfa' else 0.58)) * 5, 0, 1)
            patch = lerp(patch, soil * (0.92 + 0.1 * midv[..., None]), (thin * (0.5 if kind == 'alfalfa' else 0.65))[..., None])
        if kind in ('fallow', 'bare'):
            damp = np.clip((lowv - 0.6) * 3, 0, 1)
            patch *= (1 - 0.16 * damp)[..., None]
        # headlands
        hl = np.clip(1 - np.minimum(v, L - v) / 5.0, 0, 1)
        patch = lerp(patch, soil * 1.06, (hl * 0.45)[..., None])
    # soft, slightly ragged edge into the ground
    d = np.minimum(np.minimum(xx, w - 1 - xx), np.minimum(yy, h - 1 - yy))
    rag = (fractal(w, h, 3, sid + 5, 20) - 0.5) * 3.0
    a = np.clip((d + rag) / 2.2, 0, 1)[..., None]
    arr[y:y + h, x:x + w] = lerp(arr[y:y + h, x:x + w], patch, a)


for f in fields:
    render_field(f)

img = Image.fromarray(arr.clip(0, 255).astype(np.uint8)).convert('RGBA')
ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(ov)

# river corridor with sand bars and riparian clumps
xs = np.linspace(-40, 760, 80)
river = [(float(x), float(1330 - 0.55 * x + 70 * np.sin(x / 130.0))) for x in xs]
d.line(river, fill=(206, 190, 158, 255), width=64, joint='curve')
d.line(river, fill=(120, 126, 104, 255), width=20, joint='curve')
d.line(river, fill=(84, 104, 96, 255), width=10, joint='curve')
for (rx, ry) in river[::1]:
    for k in range(9):
        ox, oy = rng.normal(0, 26), rng.normal(0, 26)
        if abs(ox) + abs(oy) < 14:
            continue
        r = rng.uniform(3, 8)
        c = (int(rng.integers(48, 76)), int(rng.integers(84, 112)), int(rng.integers(44, 62)), 235)
        d.ellipse((rx + ox + 2, ry + oy + 2, rx + ox + r + 2, ry + oy + r + 2), fill=(40, 46, 34, 110))
        d.ellipse((rx + ox, ry + oy, rx + ox + r, ry + oy + r), fill=c)

# roads, canals, laterals
road = (224, 210, 184, 255)
d.line([(0, 456), (1381, 456)], fill=road, width=7)
d.line([(1397, 893), (W, 893)], fill=road, width=7)
d.line([(993, 462), (993, 890)], fill=road, width=4)
for xr in (197, 403, 593, 793, 1595, 1803, 1995, 2193):
    d.line([(xr, 0), (xr, H)], fill=(214, 198, 170, 200), width=3)
# main lined canal with service road
d.line([(1383, 0), (1383, H)], fill=(206, 202, 192, 255), width=11)
d.line([(1383, 0), (1383, H)], fill=(66, 104, 110, 255), width=5)
d.line([(1393, 0), (1393, H)], fill=road, width=5)
d.line([(997, 893), (1378, 893)], fill=(198, 194, 184, 255), width=7)
d.line([(997, 893), (1378, 893)], fill=(70, 106, 110, 255), width=3)
d.line([(0, 448), (990, 448)], fill=(86, 112, 108, 230), width=2)
d.line([(1400, 884), (W, 884)], fill=(86, 112, 108, 230), width=2)

# farmsteads
def farm(cx, cy):
    d.ellipse((cx - 50, cy - 36, cx + 50, cy + 36), fill=(216, 200, 170, 150))
    for k in range(int(rng.integers(3, 6))):
        bw, bh = int(rng.integers(10, 26)), int(rng.integers(8, 16))
        bx, by = cx + int(rng.integers(-36, 16)), cy + int(rng.integers(-26, 12))
        roof = [(236, 234, 228), (176, 178, 182), (168, 108, 84), (214, 214, 208)][int(rng.integers(0, 4))]
        d.rectangle((bx + 3, by + 3, bx + bw + 3, by + bh + 3), fill=(60, 52, 40, 120))
        d.rectangle((bx, by, bx + bw, by + bh), fill=roof + (255,))
        d.line([(bx, by + bh // 2), (bx + bw, by + bh // 2)], fill=(roof[0] - 24, roof[1] - 24, roof[2] - 24, 255), width=1)
    for k in range(7):
        tx, ty = cx + int(rng.integers(-44, 40)), cy + int(rng.integers(-32, 28))
        r = int(rng.integers(4, 8))
        d.ellipse((tx + 2, ty + 2, tx + r + 2, ty + r + 2), fill=(40, 46, 34, 120))
        d.ellipse((tx, ty, tx + r, ty + r), fill=(58, 96, 52, 255))

placed = 0
tries = 0
while placed < 7 and tries < 4000:
    tries += 1
    cx, cy = int(rng.integers(70, W - 70)), int(rng.integers(60, H - 60))
    if any(f['x'] - 52 < cx < f['x'] + f['w'] + 52 and f['y'] - 40 < cy < f['y'] + f['h'] + 40 for f in fields):
        continue
    if abs(cx - 1388) < 70 or abs(cy - 456) < 44 or abs(cy - 893) < 44:
        continue
    if cx < 820 and cy > 820:
        continue
    farm(cx, cy)
    placed += 1
print('farms', placed)

ov = ov.filter(ImageFilter.GaussianBlur(0.6))
img = Image.alpha_composite(img, ov).convert('RGB')

a = np.asarray(img).astype(np.float32)
# soft cloud-shadow style light variation, grain, grade
light = fractal(W, H, 3, 555, 2)
a *= (0.93 + 0.14 * light[..., None])
a += rng.normal(0, 2.6, (H, W, 1)).astype(np.float32)
a = np.clip(a, 0, 255) / 255.0
a = np.clip((a - 0.5) * 1.08 + 0.5, 0, 1)
gray = a.mean(axis=2, keepdims=True)
a = np.clip(gray + (a - gray) * 0.86, 0, 1)
a[..., 0] *= 1.015
a[..., 2] *= 0.975
out = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.55))
out = out.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
out.save('map_base2.jpg', quality=84, optimize=True)
out.crop((760, 280, 1660, 1010)).save('map2_crop.png')
out.resize((1200, 700), Image.LANCZOS).save('map2_prev.png')
print('ok')
