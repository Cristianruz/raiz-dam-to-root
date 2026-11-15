# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Revisión independiente: ETc del modelo en los días de los pasos (cálculo propio), afirmaciones de docs/ecostress.md,
# hora del paso, y tabla de las tres parcelas protagonistas. Solo lectura.
import csv, json, sys, math, statistics, collections, datetime as dt
proc, obsjson, geo, sol1, sol2 = sys.argv[1:6]
obs = {tuple(k.split("|")): v for k, v in json.load(open(obsjson)).items()}   # (id, mes) -> [[et, incert, utc, hora solar, elev]]
ent = {(f["id"], f["mes"]): f for f in csv.DictReader(open(f"{proc}/ecostress_parcelas.csv", newline=""))}
cult = {r["id"]: r for r in csv.DictReader(open(f"{proc}/cultivos_parcelas.csv", newline=""))}
eto = {}
for z, a in (("P", "eto_diaria.csv"), ("L", "eto_diaria_lazaro_cardenas.csv")):
    eto[z] = {r["fecha"]: float(r["eto_mm"]) for r in csv.DictReader(open(f"{proc}/{a}", newline=""))}
rot = json.load(open(f"{proc}/rotaciones.json"))["cultivos"]

def kc(c, fecha):
    """Kc del día: curva de cuatro etapas de FAO-56 con los parámetros de rotaciones.json (implementación propia)."""
    if c not in rot: return None
    k = rot[c]
    if "dias" not in k: return k["kc"][1]
    ini, des, med, fin = k["dias"]; ki, km, kf = k["kc"]
    for anio in (fecha.year - 1, fecha.year):
        n = (fecha - dt.date(anio, *k["siembra"])).days
        if 0 <= n < ini + des + med + fin:
            if n < ini: return ki
            if n < ini + des: return ki + (km - ki) * (n - ini) / des
            if n < ini + des + med: return km
            return km + (kf - km) * (n - ini - des - med) / fin
    return None

igual = dist = 0; maxd = 0; solo_mio = solo_suyo = 0; rz_dif = 0
mis = {}
for k, o in obs.items():
    c = cult[k[0]]["cultivo_actual"]
    vals = []
    for x in o:
        f = dt.datetime.fromisoformat(x[2]).date()      # ningún paso cruza la medianoche local (se comprueba abajo)
        kk = kc(c, f)
        e = eto[k[0][0]].get(f.isoformat())
        vals.append(None if kk is None or e is None else kk * e)
    mio = round(statistics.median(vals), 2) if vals and all(v is not None for v in vals) else None
    mis[k] = mio
    suyo = ent[k]["etc_modelo_mm"]
    suyo = float(suyo) if suyo != "" else None
    if mio is None and suyo is None: continue
    if mio is None: solo_suyo += 1; continue
    if suyo is None: solo_mio += 1; continue
    d = abs(mio - suyo); maxd = max(maxd, d)
    if d < 1e-9: igual += 1
    else: dist += 1
    r = round(float(ent[k]["et_mm_dia"]) / suyo, 2)
    if abs(r - float(ent[k]["razon"])) > 1e-9: rz_dif += 1
print(f"etc_modelo_mm: iguales {igual}, distintos {dist}, dif. máx {maxd}; solo en mi cálculo {solo_mio}, solo en la entrega {solo_suyo}; razon distinta {rz_dif}")
cruza = sum(1 for o in obs.values() for x in o if (dt.datetime.fromisoformat(x[2]) + dt.timedelta(hours=-105.4 / 15)).date() != dt.datetime.fromisoformat(x[2]).date())
print("pasos cuya fecha solar local difiere de la fecha UTC:", cruza)

# --- afirmaciones del documento ---
def med(v): return round(statistics.median(v), 2) if v else None
def q(v):
    v = sorted(v)
    if len(v) < 2: return (None, None)
    qs = statistics.quantiles(v, n=4, method="inclusive"); return round(qs[0], 2), round(qs[2], 2)
print("\n§3 alfalfa y barbecho en agosto (mediana de et_mm_dia):")
for c in ("alfalfa", "barbecho", "nogal", "cereal_invierno", "sin_clasificar"):
    v = [float(f["et_mm_dia"]) for k, f in ent.items() if k[1] == "2026-08" and f["et_mm_dia"] != "" and cult[k[0]]["cultivo_actual"] == c]
    print("  ", c, len(v), med(v), q(v))
print("cultivos:", collections.Counter(r["cultivo_actual"] for r in cult.values()))
print("\n§4 razón por cultivo y mes: mediana (cuartiles), n")
for c in ("alfalfa", "cereal_invierno", "nogal"):
    for m in ("2025-10", "2025-12", "2026-01", "2026-05", "2026-07", "2026-08"):
        v = [float(f["razon"]) for k, f in ent.items() if k[1] == m and f["razon"] != "" and cult[k[0]]["cultivo_actual"] == c]
        if v: print("  ", c, m, med(v), q(v), len(v))

# --- factor con el que el producto pasa de instantánea a diaria, por paso ---
def dia_solar(fecha, lat):
    doy = fecha.timetuple().tm_yday
    dec = math.radians(23.45) * math.sin(2 * math.pi * (284 + doy) / 365)
    sha = math.degrees(math.acos(-math.tan(math.radians(lat)) * math.tan(dec)))
    return 12 - sha / 15, 2 * sha / 15           # hora de salida del sol y horas de luz (como en el código de JPL)
pasos = collections.defaultdict(list)
for k, o in obs.items():
    for x in o: pasos[x[2]].append((k, x))
print("\nPaso (UTC) | hora solar | fracción del día x | factor frente al del mediodía (1/sen(pi x)) | puntos con dato | mediana ET | mediana dispersión entre modelos W/m2")
factor = {}
for t in sorted(pasos):
    hs = statistics.mean(x[3] for _, x in pasos[t])
    sr, n = dia_solar(dt.datetime.fromisoformat(t), 28.2)
    xx = (hs - sr) / n
    fac = 1 / math.sin(math.pi * xx)
    factor[t] = (xx, fac)
    print("  ", t, f"{hs:5.2f}", f"{xx:.3f}", f"{fac:.2f}", len(pasos[t]), med([x[0] for _, x in pasos[t]]), med([x[1] for _, x in pasos[t]]))
borde = lambda x: factor[x[2]][1] > 2
n_borde = sum(1 for o in obs.values() if all(borde(x) for x in o))
print(f"parcela-mes cuyo valor sale solo de pasos con factor > 2: {n_borde} de {len(obs)} ({100 * n_borde / len(obs):.1f} %)")
# mayo: las dos pasadas en las mismas parcelas
a, b = "2026-05-01T13:55:00", "2026-05-20T21:55:54"
par = [(o[0][0], o[1][0]) for k, o in obs.items() if k[1] == "2026-05" and len(o) == 2]
print(f"mayo, parcelas con los dos pasos: {len(par)}; mediana 1-may {med([p[0] for p in par])}, 20-may {med([p[1] for p in par])}; 20-may menor en {sum(1 for p in par if p[1] < p[0])}")
solo20 = sum(1 for k, o in obs.items() if k[1] == "2026-05" and len(o) == 1 and o[0][2] == b)
print("mayo, parcelas solo con el paso del 20-may:", solo20)
# consistencia entre pasos del mismo mes: correlación de rangos entre pasos (parcelas en común)
def rangos(v):
    o = sorted(range(len(v)), key=lambda i: v[i]); r = [0] * len(v)
    for pos, i in enumerate(o): r[i] = pos
    return r
def spearman(a, b):
    ra, rb = rangos(a), rangos(b); n = len(a)
    ma, mb = statistics.mean(ra), statistics.mean(rb)
    num = sum((x - ma) * (y - mb) for x, y in zip(ra, rb))
    den = math.sqrt(sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb))
    return num / den if den else float("nan")
print("\nCorrelación de rangos (Spearman) entre pasos del mismo mes, parcelas en común:")
ts = sorted(pasos)
for i, t1 in enumerate(ts):
    for t2 in ts[i + 1:]:
        if t1[:7] != t2[:7]: continue
        d1 = {k[0]: x[0] for k, x in pasos[t1]}; d2 = {k[0]: x[0] for k, x in pasos[t2]}
        com = sorted(set(d1) & set(d2))
        if len(com) >= 50: print("  ", t1[5:16], t2[5:16], len(com), round(spearman([d1[c] for c in com], [d2[c] for c in com]), 2))
# variación entre pasos del mismo mes en una misma parcela
print("\nDentro de una parcela y un mes (3 o más sobrevuelos): cociente máx/mín de ETdaily")
for m in ("2025-10", "2025-12"):
    r = sorted(max(x[0] for x in o) / max(min(x[0] for x in o), 0.01) for k, o in obs.items() if k[1] == m and len(o) >= 3)
    cv = sorted(statistics.pstdev([x[0] for x in o]) / statistics.mean([x[0] for x in o]) for k, o in obs.items() if k[1] == m and len(o) >= 3 and statistics.mean([x[0] for x in o]) > 0)
    print("  ", m, len(r), "mediana máx/mín", round(statistics.median(r), 2), "p90", round(r[int(.9 * (len(r) - 1))], 2), " CV mediano", round(statistics.median(cv), 2))
# agosto con NDVI
ndvi = {}
for r in csv.DictReader(open(f"{proc}/hls_mensual_parcelas.csv", newline="")):
    if r["banda"] == "ndvi" and r["mediana"] != "": ndvi[(r["id"], r["mes"])] = float(r["mediana"])
print("\nCorrelación de rangos entre et_mm_dia y el NDVI de HLS del mismo mes, por parcela:")
for m in ("2025-10", "2025-12", "2026-01", "2026-05", "2026-07", "2026-08"):
    com = [(float(f["et_mm_dia"]), ndvi[k]) for k, f in ent.items() if k[1] == m and f["et_mm_dia"] != "" and k in ndvi]
    if len(com) > 30: print("  ", m, len(com), round(spearman([c[0] for c in com], [c[1] for c in com]), 2))

# --- distancia del punto pedido al lindero de su parcela ---
pts = {}
for s in (sol1, sol2):
    for c in json.load(open(s))["params"]["coordinates"]: pts[c["id"]] = (c["longitude"], c["latitude"])
def dist_borde(pt, geom):
    lon0, lat0 = pt; kx = 111320 * math.cos(math.radians(lat0)); ky = 110540
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    best = 1e9
    for poly in polys:
        for ring in poly:
            for (x1, y1), (x2, y2) in zip(ring, ring[1:]):
                ax, ay, bx, by = (x1 - lon0) * kx, (y1 - lat0) * ky, (x2 - lon0) * kx, (y2 - lat0) * ky
                dx, dy = bx - ax, by - ay
                L = dx * dx + dy * dy
                t = 0 if L == 0 else max(0, min(1, -(ax * dx + ay * dy) / L))
                best = min(best, math.hypot(ax + t * dx, ay + t * dy))
    return best
g = json.load(open(geo))
ds = {f["properties"]["id"]: dist_borde(pts[f["properties"]["id"]], f["geometry"]) for f in g["features"]}
area = {f["properties"]["id"]: f["properties"]["area_ha"] for f in g["features"]}
v = sorted(ds.values())
print(f"\nDistancia del punto al lindero (m): mín {v[0]:.0f}, p10 {v[len(v)//10]:.0f}, mediana {v[len(v)//2]:.0f}; a menos de 35 m: {sum(1 for x in v if x < 35)}; a menos de 50 m: {sum(1 for x in v if x < 50)}; a menos de 70 m: {sum(1 for x in v if x < 70)}; a menos de 99 m (70·raíz de 2): {sum(1 for x in v if x < 99)} de {len(v)}")
print("superficie: < 2 ha", sum(1 for a in area.values() if a < 2), " < 4.41 ha (3 x 3 píxeles)", sum(1 for a in area.values() if a < 4.41))

# --- protagonistas ---
print("\nPROTAGONISTAS")
for pid in ("P0757", "P0632", "L0175"):
    c = cult[pid]["cultivo_actual"]
    print(f"\n{pid} · {c} · {area[pid]} ha · punto a {ds[pid]:.0f} m del lindero")
    print("mes | et_mm_dia | n_escenas | sobrevuelos | pasos: día hora-solar factor ET(mm/d) dispersión(W/m2) ETc-día | etc_modelo_mm (entrega / mío) | razon | NDVI HLS | ETc media del mes (Kc·ETo, todos los días)")
    for m in sorted({k[1] for k in ent}):
        f = ent[(pid, m)]
        o = obs.get((pid, m), [])
        det = []
        for x in o:
            fe = dt.datetime.fromisoformat(x[2]).date(); kk = kc(c, fe); e = eto[pid[0]].get(fe.isoformat())
            det.append(f"{fe.strftime('%d')} {x[3]:.1f}h f{factor[x[2]][1]:.1f} {x[0]:.2f} ±{x[1]:.0f} " + (f"{kk * e:.2f}" if kk is not None and e is not None else "—"))
        ts_ = sorted(dt.datetime.fromisoformat(x[2]) for x in o)
        nsv = (1 + sum(1 for a_, b_ in zip(ts_, ts_[1:]) if (b_ - a_).total_seconds() >= 300)) if o else 0
        # ETc media mensual
        y, mm = int(m[:4]), int(m[5:])
        d = dt.date(y, mm, 1); tot = []; 
        while d.month == mm:
            kk = kc(c, d); e = eto[pid[0]].get(d.isoformat())
            if e is not None: tot.append((kk or 0) * e if kk is not None else None)
            d += dt.timedelta(days=1)
        dentro = [t for t in tot if t is not None]
        etcm = f"{statistics.mean(dentro):.2f} ({len(dentro)} d en ciclo)" if dentro else "fuera de ciclo"
        etom = statistics.mean(eto[pid[0]][dd] for dd in eto[pid[0]] if dd.startswith(m))
        print(f"{m} | {f['et_mm_dia'] or '—'} | {f['n_escenas']} | {nsv} | {'; '.join(det) or '—'} | {f['etc_modelo_mm'] or '—'} / {mis.get((pid, m))} | {f['razon'] or '—'} | {ndvi.get((pid, m), '—')} | {etcm}; ETo media {etom:.2f}")
