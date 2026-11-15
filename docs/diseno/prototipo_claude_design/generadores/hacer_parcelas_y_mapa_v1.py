# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Ilustración sintética para el prototipo de diseño; no produce datos del proyecto.
"""Synthetic base imagery for the ROOT prototype (illustrative, not real satellite data).
map_base.jpg : aerial view of an arid valley with gravity-irrigated parcels (1 px = 2 m).
terrain.jpg  : hillshade + elevation ramp + runoff paths, pilot area highlighted.
terrain_storm.jpg : same, runoff paths emphasised.
"""
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

rng = np.random.default_rng(7)
W, H = 2400, 1400


def fractal(w, h, octaves=5, seed=0, base=6):
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), dtype=np.float32)
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        n = base * (2 ** o)
        small = r.random((max(2, int(n * h / w) + 2), n + 2)).astype(np.float32)
        img = Image.fromarray((small * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        out += amp * (np.asarray(img, dtype=np.float32) / 255.0)
        tot += amp
        amp *= 0.5
    return out / tot


# ---------------------------------------------------------------- aerial base
def make_base():
    n1 = fractal(W, H, 6, 1, 5)
    n2 = fractal(W, H, 4, 2, 40)
    base = np.zeros((H, W, 3), dtype=np.float32)
    c1 = np.array([201, 178, 142], dtype=np.float32)
    c2 = np.array([170, 140, 104], dtype=np.float32)
    t = (n1 * 0.7 + n2 * 0.3)[..., None]
    base[:] = c1 * t + c2 * (1 - t)
    img = Image.fromarray(base.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img)

    # river corridor (lower-left to upper-left edge), kept away from the story cluster
    xs = np.linspace(-40, 760, 60)
    river = [(float(x), float(1330 - 0.55 * x + 70 * np.sin(x / 130.0))) for x in xs]

    def near_river(x, y, w, h, pad=85):
        cx, cy = x + w / 2, y + h / 2
        for (rx, ry) in river:
            if abs(cx - rx) < w / 2 + pad and abs(cy - ry) < h / 2 + pad:
                return True
        return False

    story = {
        "P0632": (1000, 480, 190, 272, "cereal"),
        "P0757": (1210, 480, 141, 141, "alfalfa"),
        "L0175": (1210, 645, 164, 164, "pecan"),
    }
    fields = []
    for k, (x, y, w, h, kind) in story.items():
        fields.append(dict(id=k, x=x, y=y, w=w, h=h, kind=kind))
    fields.append(dict(id="", x=1000, y=764, w=190, h=120, kind="fallow"))
    fields.append(dict(id="", x=1210, y=823, w=164, h=61, kind="stubble"))

    kinds = ["alfalfa", "alfalfa", "pecan", "pecan", "fallow", "fallow", "fallow", "stubble",
             "stubble", "cereal", "bare", "bare"]
    strips = [(24, 190), (204, 396), (410, 586), (600, 786), (800, 984),
              (1000, 1190), (1210, 1374),
              (1400, 1588), (1602, 1796), (1810, 1988), (2002, 2186), (2200, 2376)]
    for (x0, x1) in strips:
        y = 24 + int(rng.integers(0, 30))
        while y < H - 90:
            h = int(rng.integers(110, 290))
            if y + h > H - 20:
                h = H - 20 - y
                if h < 70:
                    break
            reserved = (x0 >= 1000 and x1 <= 1374 and y + h > 462 and y < 900)
            if reserved:
                y = 900
                continue
            if x0 >= 1000 and x1 <= 1374 and y < 462 and y + h > 448:
                h = 448 - y
                if h < 60:
                    y = 900
                    continue
            if not near_river(x0, y, x1 - x0, h):
                # sometimes split a strip cell into two parcels
                if (x1 - x0) > 170 and rng.random() < 0.3:
                    half = (x1 - x0 - 12) // 2
                    fields.append(dict(id="", x=x0, y=y, w=half, h=h, kind=str(rng.choice(kinds))))
                    fields.append(dict(id="", x=x0 + half + 12, y=y, w=half, h=h, kind=str(rng.choice(kinds))))
                else:
                    fields.append(dict(id="", x=x0, y=y, w=x1 - x0, h=h, kind=str(rng.choice(kinds))))
            y += h + 14

    arr = np.asarray(img).astype(np.float32)
    palette = {
        "alfalfa": [(74, 128, 52), (88, 142, 60), (64, 116, 50)],
        "cereal": [(150, 160, 98), (160, 166, 104)],
        "fallow": [(156, 118, 84), (170, 132, 96), (140, 104, 76)],
        "stubble": [(196, 172, 112), (206, 184, 126)],
        "bare": [(182, 150, 112), (172, 138, 100)],
        "pecan": [(150, 124, 92), (140, 116, 86)],
    }
    for f in fields:
        x, y, w, h, kind = f["x"], f["y"], f["w"], f["h"], f["kind"]
        col = np.array(palette[kind][int(rng.integers(0, len(palette[kind])))], dtype=np.float32)
        patch = np.zeros((h, w, 3), dtype=np.float32) + col
        fn = fractal(w, h, 3, int(rng.integers(0, 9999)), 3)[..., None]
        patch *= (0.9 + 0.2 * fn)
        # border strips ("melgas") along the long axis
        if kind in ("alfalfa", "cereal", "stubble", "fallow", "bare"):
            period = int(rng.integers(14, 22)) if kind != "cereal" else 6
            if h >= w:
                band = (np.arange(w) // period) % 2
                shade = (0.97 + 0.06 * band)[None, :, None]
                line = ((np.arange(w) % period) == 0)[None, :, None]
            else:
                band = (np.arange(h) // period) % 2
                shade = (0.97 + 0.06 * band)[:, None, None]
                line = ((np.arange(h) % period) == 0)[:, None, None]
            patch = patch * shade
            patch = np.where(line, patch * 0.9, patch)
        if kind == "pecan":
            yy, xx = np.mgrid[0:h, 0:w]
            sp = 11
            dx = (xx % sp) - sp / 2
            dy = (yy % sp) - sp / 2
            r = np.sqrt(dx * dx + dy * dy)
            crown = np.clip((4.6 - r) / 1.6, 0, 1)[..., None]
            tree = np.array([46, 84, 40], dtype=np.float32) * (0.85 + 0.3 * fn)
            patch = patch * (1 - crown) + tree * crown
            sh = np.clip((4.2 - np.sqrt((dx - 2.2) ** 2 + (dy - 2.2) ** 2)) / 1.6, 0, 1)[..., None] * (1 - crown)
            patch = patch * (1 - 0.28 * sh)
        arr[y:y + h, x:x + w] = patch
        f["px"] = [x, y, w, h]

    img = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
    d = ImageDraw.Draw(img, "RGBA")
    # riparian strip + river
    d.line(river, fill=(96, 122, 70, 255), width=70, joint="curve")
    d.line(river, fill=(120, 132, 86, 255), width=46, joint="curve")
    d.line(river, fill=(112, 128, 122, 255), width=16, joint="curve")
    # main canal and roads
    d.line([(1387, 0), (1387, H)], fill=(98, 132, 140, 255), width=7)
    d.line([(1393, 0), (1393, H)], fill=(214, 200, 172, 255), width=3)
    d.line([(0, 455), (1380, 455)], fill=(218, 204, 176, 255), width=5)
    d.line([(1396, 892), (W, 892)], fill=(218, 204, 176, 255), width=5)
    d.line([(992, 462), (992, 892)], fill=(214, 200, 172, 255), width=3)
    d.line([(996, 892), (1380, 892)], fill=(98, 132, 140, 255), width=4)
    img = img.convert("RGB").filter(ImageFilter.GaussianBlur(0.7))
    a = np.asarray(img).astype(np.float32)
    grain = rng.normal(0, 3.2, (H, W, 1)).astype(np.float32)
    a = a + grain
    a = a * (0.96 + 0.08 * fractal(W, H, 3, 77, 3)[..., None])
    Image.fromarray(a.clip(0, 255).astype(np.uint8)).save("map_base.jpg", quality=80, optimize=True)
    return fields


# ---------------------------------------------------------------- terrain
def make_terrain():
    w, h = 600, 350
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    n = fractal(w, h, 6, 11, 3)
    n2 = fractal(w, h, 5, 12, 9)
    # valley sloping to the north-east, flanked by ranges
    plane = 0.9 * (1 - xx / w) + 0.5 * (yy / h)
    ridgeL = np.exp(-((xx - 40) / 120.0) ** 2) * 0.9
    ridgeR = np.exp(-((xx - 590) / 90.0) ** 2) * 0.7 * (0.5 + n2)
    ridgeT = np.exp(-((yy - 10) / 70.0) ** 2) * 0.35 * n2
    valley = 0.5 * np.abs((yy - (0.62 * h - 0.25 * (xx - w / 2))) / h)
    z = plane * 0.8 + valley * 0.7 + ridgeL * (0.4 + n) + ridgeR + ridgeT + 0.38 * n + 0.10 * n2
    z = ndi.gaussian_filter(z, 1.4)
    z = (z - z.min()) / (z.max() - z.min())

    # priority-flood fill (with epsilon) so every cell drains to an edge, then D8 accumulation
    import heapq
    zf = z.astype(np.float64) + rng.random(z.shape) * 1e-5
    filled = zf.copy()
    seen = np.zeros((h, w), dtype=bool)
    heap = []
    for x0 in range(w):
        for y0 in (0, h - 1):
            heapq.heappush(heap, (filled[y0, x0], y0, x0)); seen[y0, x0] = True
    for y0 in range(h):
        for x0 in (0, w - 1):
            if not seen[y0, x0]:
                heapq.heappush(heap, (filled[y0, x0], y0, x0)); seen[y0, x0] = True
    offs = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
    recv = np.full(h * w, -1, dtype=np.int64)
    orderl = []
    while heap:
        zc, y0, x0 = heapq.heappop(heap)
        orderl.append(y0 * w + x0)
        for dy, dx in offs:
            y1, x1 = y0 + dy, x0 + dx
            if 0 <= y1 < h and 0 <= x1 < w and not seen[y1, x1]:
                seen[y1, x1] = True
                filled[y1, x1] = max(filled[y1, x1], zc + 1e-7)
                recv[y1 * w + x1] = y0 * w + x0
                heapq.heappush(heap, (filled[y1, x1], y1, x1))
    # steepest descent on the filled surface (parent pointer only as fallback)
    best = np.zeros((h, w)); rec2 = recv.reshape(h, w).copy()
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
        m = (sl > best) & (rec2 >= 0)
        best[m] = sl[m]; rec2[m] = ids[m]
    recv = rec2.ravel()
    orderl = list(np.argsort(filled, axis=None))
    acc = np.ones(h * w, dtype=np.float64)
    for i in reversed(orderl):
        r = recv[i]
        if r >= 0:
            acc[r] += acc[i]
    acc = acc.reshape(h, w)

    S = 4  # upscale to 2400x1400
    zi = np.asarray(Image.fromarray((z * 65535).astype(np.uint16)).resize((W, H), Image.BICUBIC), dtype=np.float32) / 65535.0
    zi = ndi.gaussian_filter(zi, 3)
    gy, gx = np.gradient(zi * 900.0)
    az, alt = np.deg2rad(315), np.deg2rad(45)
    slope = np.pi / 2 - np.arctan(np.hypot(gx, gy))
    aspect = np.arctan2(-gx, gy)
    shade = np.sin(alt) * np.sin(slope) + np.cos(alt) * np.cos(slope) * np.cos(az - aspect)
    shade = np.clip(shade, 0, 1)

    stops = [(0.0, (62, 122, 86)), (0.18, (128, 168, 104)), (0.36, (214, 212, 150)),
             (0.56, (212, 172, 110)), (0.76, (160, 112, 78)), (0.92, (124, 96, 84)), (1.0, (240, 236, 230))]
    Y, X = np.mgrid[0:H, 0:W].astype(np.float32)
    blob = ((X - 1230) / 560.0) ** 2 + ((Y - 660) / 360.0) ** 2 + 0.45 * (fractal(W, H, 3, 33, 4) - 0.5)
    inside = blob < 1.0
    lo, hi = np.percentile(zi[inside], [1, 99])
    zr = np.clip((zi - lo) / (hi - lo), 0, 1)
    rgb = np.zeros((H, W, 3), dtype=np.float32)
    for c in range(3):
        rgb[..., c] = np.interp(zr, [s[0] for s in stops], [s[1][c] for s in stops])
    rgb = rgb * (0.55 + 0.6 * shade[..., None])

    # contours
    levels = np.floor(zi * 40)
    edge = (np.abs(np.diff(levels, axis=0, prepend=levels[:1])) + np.abs(np.diff(levels, axis=1, prepend=levels[:, :1]))) > 0
    rgb = np.where(edge[..., None], rgb * 0.78, rgb)

    # pilot area mask (smooth blob in the valley floor)
    gray = rgb.mean(axis=2, keepdims=True)
    outside = gray * 0.5 + 118
    out = np.where(inside[..., None], rgb, outside)
    boundary = ndi.binary_dilation(inside, iterations=3) & ~ndi.binary_erosion(inside, iterations=1)

    def render(storm):
        img = Image.fromarray(out.clip(0, 255).astype(np.uint8)).convert("RGBA")
        over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(over)
        thr = 200 if not storm else 70
        ys, xs = np.where(acc > thr)
        for y0, x0 in zip(ys, xs):
            r = recv[y0 * w + x0]
            if r < 0:
                continue
            y1, x1 = divmod(int(r), w)
            a = acc[y0, x0]
            wd = 1.0 + 1.6 * np.log10(a / thr + 1) * (1.35 if storm else 1.0)
            col = (31, 111, 178, 235) if not storm else (24, 96, 196, 245)
            d.line([(x0 * S + 2, y0 * S + 2), (x1 * S + 2, y1 * S + 2)], fill=col, width=min(9 if storm else 6, max(2, int(round(wd * 1.5)))))
        over = over.filter(ImageFilter.GaussianBlur(0.8))
        if storm:
            glow = over.filter(ImageFilter.GaussianBlur(7))
            img = Image.alpha_composite(img, glow)
        img = Image.alpha_composite(img, over)
        a = np.asarray(img.convert("RGB")).astype(np.float32)
        a = np.where(boundary[..., None], np.array([255, 255, 255], dtype=np.float32), a)
        name = "terrain_storm.jpg" if storm else "terrain.jpg"
        Image.fromarray(a.clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5)).save(
            "" + name, quality=80, optimize=True)

    render(False)
    render(True)


if __name__ == "__main__":
    import sys
    if "terrain" not in sys.argv:
        fields = make_base()
        json.dump(fields, open("fields.json", "w"))
    else:
        fields = []
    make_terrain()
    print(len(fields), "fields")
