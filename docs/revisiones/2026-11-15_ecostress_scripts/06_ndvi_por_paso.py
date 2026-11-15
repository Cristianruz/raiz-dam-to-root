# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Revisión independiente: por paso, correlación de rangos de ETdaily con el NDVI de HLS del mes en las mismas parcelas
# (señal de que el píxel muestreado es el de la parcela), y efecto de quitar pasos de borde y sobrevuelos repetidos.
import csv, json, sys, math, statistics, collections, datetime as dt
proc, obsjson = sys.argv[1], sys.argv[2]
obs = {tuple(k.split("|")): v for k, v in json.load(open(obsjson)).items()}
ndvi = {}
for r in csv.DictReader(open(f"{proc}/hls_mensual_parcelas.csv", newline="")):
    if r["banda"] == "ndvi" and r["mediana"] != "": ndvi[(r["id"], r["mes"])] = float(r["mediana"])
def rangos(v):
    o = sorted(range(len(v)), key=lambda i: v[i]); r = [0] * len(v)
    for pos, i in enumerate(o): r[i] = pos
    return r
def spearman(a, b):
    ra, rb = rangos(a), rangos(b)
    ma, mb = statistics.mean(ra), statistics.mean(rb)
    num = sum((x - ma) * (y - mb) for x, y in zip(ra, rb))
    den = math.sqrt(sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb))
    return num / den if den else float("nan")
pasos = collections.defaultdict(list)
for k, o in obs.items():
    for x in o: pasos[x[2]].append((k, x))
print("paso | hora solar | n | rho(ETdaily, NDVI del mes)")
for t in sorted(pasos):
    par = [(x[0], ndvi[k]) for k, x in pasos[t] if k in ndvi]
    print("  ", t, f"{statistics.mean(x[3] for _, x in pasos[t]):.2f}", len(par), round(spearman([p[0] for p in par], [p[1] for p in par]), 2))
# Recalcular la mediana mensual con dos reglas propuestas: (1) un sobrevuelo = un valor (promedio de sus escenas a menos de 5 min);
# (2) sin pasos de borde (fracción del día < 0.15 o > 0.85).
def dia(fecha, lat=28.2):
    doy = fecha.timetuple().tm_yday
    g = 2 * math.pi * (doy - 1) / 365
    dec = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g) - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    sha = math.degrees(math.acos(-math.tan(math.radians(lat)) * math.tan(dec)))
    return 12 - sha / 15, 2 * sha / 15
ent = {(f["id"], f["mes"]): f for f in csv.DictReader(open(f"{proc}/ecostress_parcelas.csv", newline=""))}
res = collections.Counter(); cambios = []
nuevo = {}
for k, o in obs.items():
    grupos = []
    for x in sorted(o, key=lambda x: x[2]):
        t = dt.datetime.fromisoformat(x[2])
        if grupos and (t - grupos[-1][-1][0]).total_seconds() < 300: grupos[-1].append((t, x))
        else: grupos.append([(t, x)])
    vals = []
    for g in grupos:
        sr, n = dia(g[0][0]); xx = (statistics.mean(y[1][3] for y in g) - sr) / n
        if 0.15 <= xx <= 0.85: vals.append(statistics.mean(y[1][0] for y in g))
    nuevo[k] = (round(statistics.median(vals), 2), len(vals)) if vals else (None, 0)
    res[(k[1], "queda" if vals else "se vacía")] += 1
    if vals: cambios.append(abs(nuevo[k][0] - float(ent[k]["et_mm_dia"])))
for m in sorted({k[0] for k in res}): print(m, "queda", res[(m, "queda")], "se vacía", res[(m, "se vacía")])
print("total queda", sum(v for k, v in res.items() if k[1] == "queda"), "se vacía", sum(v for k, v in res.items() if k[1] == "se vacía"))
c = sorted(cambios)
print(f"cambio de et_mm_dia en los que quedan: sin cambio {sum(1 for x in c if x < 0.005)}, mediana {statistics.median(c):.2f}, p90 {c[int(.9 * (len(c) - 1))]:.2f}, máx {c[-1]:.2f}; cambian más de 0.25 mm/día: {sum(1 for x in c if x > 0.25)}")
ns = collections.Counter((k[1], v[1]) for k, v in nuevo.items() if v[1])
print("sobrevuelos por parcela-mes con la regla:", sorted(ns.items()))
for p in ("P0757", "P0632", "L0175"):
    print(p, {m: nuevo.get((p, m)) for m in ("2025-10", "2025-12", "2026-01", "2026-05", "2026-07", "2026-08") if (p, m) in nuevo}, " entregado:", {m: ent[(p, m)]["et_mm_dia"] for m in ("2025-10", "2025-12", "2026-01", "2026-05", "2026-07", "2026-08")})
# agosto, 81 parcelas con el sobrevuelo del 26 contado dos veces
af = [(k, float(ent[k]["et_mm_dia"]), nuevo[k][0]) for k, o in obs.items() if k[1] == "2026-08" and int(ent[k]["n_escenas"]) != nuevo[k][1] and k[0].startswith("P")]
d = sorted(abs(a - b) for _, a, b in af)
print(f"agosto Delicias, parcelas donde n_escenas cuenta dos veces el sobrevuelo del 26: {len(af)}; cambio mediano {statistics.median(d):.2f}, máx {d[-1]:.2f}; > 0.25: {sum(1 for x in d if x > .25)}; > 0.5: {sum(1 for x in d if x > .5)}")
print(sorted(af, key=lambda t: -abs(t[1] - t[2]))[:3])
