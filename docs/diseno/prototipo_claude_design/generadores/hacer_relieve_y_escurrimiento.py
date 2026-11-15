# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Ilustración sintética para el prototipo de diseño; no produce datos del proyecto.
"""Relief assets for ROOT v3 (illustrative; same 2400x1400 frame as the aerial base, 1 px = 2 m).
Outputs: relief_dark.jpg (shaded relief, dark theme), ponding.png (where water collects, RGBA),
flows.json (runoff polylines as SVG path data + ponding spots)."""
import heapq, json
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

rng = np.random.default_rng(5)
W, H = 2400, 1400
w, h = 480, 280
S = W // w


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


yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
plane = 0.55 * (1 - xx / w) + 0.45 * (1 - yy / h)          # drains to the south-east corner
valley = 0.55 * np.abs((yy - (0.52 * h + 0.18 * (xx - w / 2))) / h)  # shallow valley through the centre
z = 1.0 * plane + 0.9 * valley + 0.34 * fractal(w, h, 5, 41, 3, 0.55) + 0.06 * fractal(w, h, 4, 42, 16)
z = ndi.gaussian_filter(z, 1.6)
z = (z - z.min()) / (z.max() - z.min())

offs = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def flood(zz, eps):
    filled = zz.astype(np.float64).copy()
    seen = np.zeros((h, w), dtype=bool)
    heap = []
    for x0 in range(w):
        for y0 in (0, h - 1):
            heapq.heappush(heap, (filled[y0, x0], y0, x0)); seen[y0, x0] = True
    for y0 in range(h):
        for x0 in (0, w - 1):
            if not seen[y0, x0]:
                heapq.heappush(heap, (filled[y0, x0], y0, x0)); seen[y0, x0] = True
    parent = np.full(h * w, -1, dtype=np.int64)
    while heap:
        zc, y0, x0 = heapq.heappop(heap)
        for dy, dx in offs:
            y1, x1 = y0 + dy, x0 + dx
            if 0 <= y1 < h and 0 <= x1 < w and not seen[y1, x1]:
                seen[y1, x1] = True
                filled[y1, x1] = max(filled[y1, x1], zc + eps)
                parent[y1 * w + x1] = y0 * w + x0
                heapq.heappush(heap, (filled[y1, x1], y1, x1))
    return filled, parent


flat_fill, _ = flood(z, 0.0)
depth = (flat_fill - z).astype(np.float32)           # depressions: where water collects
filled, parent = flood(z + rng.random(z.shape) * 1e-6, 1e-7)

# steepest descent on the filled surface
best = np.zeros((h, w)); recv = parent.reshape(h, w).copy()
idx = np.arange(h * w).reshape(h, w)
for (dy, dx) in offs:
    dd = 1.4142 if dy and dx else 1.0
    zs = np.full((h, w), np.inf)
    ys0, ys1 = max(0, -dy), h - max(0, dy)
    xs0, xs1 = max(0, -dx), w - max(0, dx)
    zs[ys0:ys1, xs0:xs1] = filled[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx]
    sl = (filled - zs) / dd
    ids = np.full((h, w), -1, dtype=np.int64)
    ids[ys0:ys1, xs0:xs1] = idx[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx]
    m = (sl > best) & (recv >= 0)
    best[m] = sl[m]; recv[m] = ids[m]
recv = recv.ravel()
order = np.argsort(filled, axis=None)[::-1]
acc = np.ones(h * w, dtype=np.float64)
for i in order:
    r = recv[i]
    if r >= 0:
        acc[r] += acc[i]

# ---- channels as polylines (trace from heads downstream)
T = 140
chan = acc > T
has_up = np.zeros(h * w, dtype=bool)
for i in np.where(chan)[0]:
    r = recv[i]
    if r >= 0 and chan[r]:
        has_up[r] = True
heads = [i for i in np.where(chan)[0] if not has_up[i]]
heads.sort(key=lambda i: -acc[i])
visited = np.zeros(h * w, dtype=bool)
lines = []
for hd in sorted(heads, key=lambda i: acc[i]):
    pts = []
    i = hd
    while i >= 0 and chan[i]:
        pts.append(i)
        if visited[i]:
            break
        visited[i] = True
        i = recv[i]
    if len(pts) >= 10:
        lines.append(pts)


def smooth(arr, k):
    if len(arr) < 2 * k + 1:
        return arr
    ker = np.ones(2 * k + 1) / (2 * k + 1)
    pad = np.concatenate([np.repeat(arr[:1], k), arr, np.repeat(arr[-1:], k)])
    out = np.convolve(pad, ker, mode='valid')
    out[0], out[-1] = arr[0], arr[-1]
    return out


paths = []
for pts in lines:
    ys = np.array([p // w for p in pts], dtype=np.float64) * S + S / 2
    xs = np.array([p % w for p in pts], dtype=np.float64) * S + S / 2
    xs, ys = smooth(xs, 5), smooth(ys, 5)
    step = 3
    sel = list(range(0, len(xs), step))
    if sel[-1] != len(xs) - 1:
        sel.append(len(xs) - 1)
    d = 'M' + ' L'.join('%d %d' % (round(xs[i]), round(ys[i])) for i in sel)
    a = float(np.median([acc[p] for p in pts]))
    paths.append({'d': d, 'w': 3 if a < 500 else (5 if a < 2500 else 8), 'n': len(pts), 'a': a})
paths.sort(key=lambda p: -p['n'])
paths = paths[:46]

# ---- ponding raster and spots
dep = ndi.gaussian_filter(depth, 1.0)
thr = np.percentile(dep[dep > 0], 55) if (dep > 0).any() else 1
mask = dep > thr
lab, n = ndi.label(mask)
spots = []
for k in range(1, n + 1):
    m = lab == k
    area = int(m.sum())
    if area < 12:
        continue
    cy, cx = ndi.center_of_mass(m)
    spots.append({'x': int(cx * S), 'y': int(cy * S), 'r': int(max(26, min(120, np.sqrt(area / np.pi) * S * 1.1))), 'v': float(dep[m].sum())})
spots.sort(key=lambda s: -s['v'])
spots = spots[:14]

alpha = np.clip(dep / (np.percentile(dep[mask], 90) + 1e-6), 0, 1) if mask.any() else dep * 0
alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).resize((1200, 700), Image.BICUBIC), dtype=np.float32) / 255.0
alpha = ndi.gaussian_filter(alpha, 2.5)
rgba = np.zeros((700, 1200, 4), dtype=np.uint8)
core = np.clip((alpha - 0.35) * 2.2, 0, 1)
rgba[..., 0] = (46 + 110 * core).astype(np.uint8)
rgba[..., 1] = (150 + 80 * core).astype(np.uint8)
rgba[..., 2] = 255
rgba[..., 3] = (np.clip(alpha * 1.5, 0, 1) * 215).astype(np.uint8)
Image.fromarray(rgba, 'RGBA').save('ponding.png', optimize=True)

# ---- dark shaded relief
zi = np.asarray(Image.fromarray((z * 65535).astype(np.uint16)).resize((W, H), Image.BICUBIC), dtype=np.float32) / 65535.0
zi = ndi.gaussian_filter(zi, 4)
gy, gx = np.gradient(zi * 2600.0)
az, alt = np.deg2rad(315), np.deg2rad(38)
slope = np.pi / 2 - np.arctan(np.hypot(gx, gy))
aspect = np.arctan2(-gx, gy)
shade = np.clip(np.sin(alt) * np.sin(slope) + np.cos(alt) * np.cos(slope) * np.cos(az - aspect), 0, 1)
stops = [(0.0, (10, 46, 58)), (0.3, (20, 62, 60)), (0.55, (52, 76, 62)), (0.78, (104, 98, 76)), (1.0, (168, 150, 120))]
rgb = np.zeros((H, W, 3), dtype=np.float32)
for c in range(3):
    rgb[..., c] = np.interp(zi, [s[0] for s in stops], [s[1][c] for s in stops])
rgb *= (0.5 + 1.25 * shade[..., None])
lev = np.floor(zi * 56)
edge = (np.abs(np.diff(lev, axis=0, prepend=lev[:1])) + np.abs(np.diff(lev, axis=1, prepend=lev[:, :1]))) > 0
idxc = edge & ((lev % 4) == 0)
rgb = np.where(edge[..., None], rgb * 0.82 + np.array([120, 190, 180], np.float32) * 0.18, rgb)
rgb = np.where(ndi.binary_dilation(idxc)[..., None], rgb * 0.6 + np.array([150, 230, 215], np.float32) * 0.4, rgb)
rgb += rng.normal(0, 2.0, (H, W, 1))
img = Image.fromarray(rgb.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6))
from PIL import ImageDraw as _ID
_ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); _d = _ID.Draw(_ov)
for p in paths:
    _pts = [tuple(map(int, q.split())) for q in p['d'][1:].split(' L')]
    _d.line(_pts, fill=(70, 150, 220, 150), width=max(2, p['w'] - 1), joint='curve')
img = Image.alpha_composite(img.convert('RGBA'), _ov.filter(ImageFilter.GaussianBlur(0.8))).convert('RGB')
img.save('relief_dark.jpg', quality=82, optimize=True)

json.dump({'paths': [{'d': p['d'], 'w': p['w']} for p in paths], 'spots': [{'x': s['x'], 'y': s['y'], 'r': s['r']} for s in spots]}, open('flows.json', 'w'))
print(len(paths), 'paths', sum(len(p['d']) for p in paths), 'chars;', len(spots), 'spots')

# preview: relief + flows + ponding
from PIL import ImageDraw
pv = img.copy().convert('RGBA')
pv.alpha_composite(Image.open('ponding.png').resize((W, H), Image.BICUBIC))
d = ImageDraw.Draw(pv)
for p in paths:
    pts = [tuple(map(int, q.split())) for q in p['d'][1:].split(' L')]
    d.line(pts, fill=(90, 180, 245, 255), width=p['w'], joint='curve')
for s in spots:
    d.ellipse((s['x'] - s['r'], s['y'] - s['r'], s['x'] + s['r'], s['y'] + s['r']), outline=(255, 255, 255, 200), width=2)
pv.convert('RGB').resize((1200, 700), Image.LANCZOS).save('relief_prev.png')
