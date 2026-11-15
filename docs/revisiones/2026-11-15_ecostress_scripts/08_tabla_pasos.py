# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Revisión independiente: tabla final de pasos con la convención del código de JPL (hora = UTC + longitud/15; declinación de
# Spencer; x = (hora - salida del sol) / horas de luz; el producto multiplica el flujo instantáneo por 1.6 / (pi sen(pi x))).
import csv, sys, math, statistics, collections, datetime as dt
proc = sys.argv[1]; crudos = sys.argv[2:]
LAM = 2450000.0
def dec(doy):
    g = 2 * math.pi * (doy - 1) / 365
    return (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
            - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
ndvi = {}
for r in csv.DictReader(open(f"{proc}/hls_mensual_parcelas.csv", newline="")):
    if r["banda"] == "ndvi" and r["mediana"] != "": ndvi[(r["id"], r["mes"])] = float(r["mediana"])
def rangos(v):
    o = sorted(range(len(v)), key=lambda i: v[i]); r = [0] * len(v)
    for pos, i in enumerate(o): r[i] = pos
    return r
def rho(a, b):
    ra, rb = rangos(a), rangos(b); ma, mb = statistics.mean(ra), statistics.mean(rb)
    den = math.sqrt(sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb))
    return sum((x - ma) * (y - mb) for x, y in zip(ra, rb)) / den if den else float("nan")
esc = collections.defaultdict(lambda: {"P": [0, 0, 0], "L": [0, 0, 0], "rows": []})   # por escena: [puntos, con ET, nube]
for ruta in crudos:
    for r in csv.DictReader(open(ruta, newline="")):
        z = r["ID"][0]; e = esc[r["Date"]]
        e[z][0] += 1
        try: et = float(r["ECO_L3T_JET_002_ETdaily"])
        except ValueError: et = float("nan")
        nube = float(r["ECO_L3T_JET_002_cloud"]) if r["ECO_L3T_JET_002_cloud"] != "" else float("nan")
        if nube == 1: e[z][2] += 1
        if math.isfinite(et) and nube == 0 and float(r["ECO_L3T_JET_002_water"]) == 0:
            e[z][1] += 1
            utc = dt.datetime.strptime(r["Date"], "%Y-%m-%d %H:%M:%S UTC")
            lat, lon = float(r["Latitude"]), float(r["Longitude"])
            loc = utc + dt.timedelta(hours=lon / 15)
            hod = loc.hour + loc.minute / 60 + loc.second / 3600
            sha = math.degrees(math.acos(-math.tan(math.radians(lat)) * math.tan(dec(loc.timetuple().tm_yday))))
            sr, n = 12 - sha / 15, 2 * sha / 15
            x = (hod - sr) / n
            f = 1.6 / (math.pi * math.sin(math.pi * x))
            inst = et * LAM / (n * 3600) / f
            e["rows"].append((r["ID"], loc.strftime("%Y-%m"), et, float(r["ECO_L3T_JET_002_ETinstUncertainty"]), hod, x, f, inst))
print(f"escenas: {len(esc)}; con dato en algún punto: {sum(1 for e in esc.values() if e['rows'])}; sin dato y con cloud = 0 en todos sus puntos: {sum(1 for e in esc.values() if not e['rows'] and e['P'][2] + e['L'][2] == 0)}")
hs = []
print("| Paso (UTC) | Hora solar media | x | Factor / mediodía | Con dato P / L | Nube P / L | Mediana ETdaily | Dispersión W/m² | Dispersión / flujo | ρ con NDVI |")
for t in sorted(esc):
    e = esc[t]
    utc = dt.datetime.strptime(t, "%Y-%m-%d %H:%M:%S UTC")
    hod_all = (utc.hour + utc.minute / 60 + utc.second / 3600) - 105.45 / 15
    hs.append(hod_all)
    if not e["rows"]:
        continue
    R = e["rows"]
    par = [(r[2], ndvi[(r[0], r[1])]) for r in R if (r[0], r[1]) in ndvi]
    h = statistics.mean(r[4] for r in R)
    print(f"| {t[:16]} | {int(h)}:{int(round((h % 1) * 60)):02d} | {statistics.mean(r[5] for r in R):.2f} | {statistics.mean(r[6] for r in R) / (1.6 / math.pi):.1f} | {e['P'][1]} / {e['L'][1]} | {e['P'][2]} / {e['L'][2]} | {statistics.median(r[2] for r in R):.2f} | {statistics.median(r[3] for r in R):.0f} | {statistics.median(r[3] / r[7] for r in R if r[7] > 0):.1f} | {rho([p[0] for p in par], [p[1] for p in par]):.2f} |")
print(f"hora (UTC + longitud/15) de las {len(hs)} escenas: de {min(hs):.2f} a {max(hs):.2f} h")
# parcela-mes que dependen solo de pasos con x < 0.15 o x > 0.85
pm = collections.defaultdict(list)
for t, e in esc.items():
    for r in e["rows"]: pm[(r[0], r[1])].append(r)
solo = collections.Counter(); tot = collections.Counter()
for k, v in pm.items():
    tot[(k[1], k[0][0])] += 1
    if all(r[5] < 0.15 or r[5] > 0.85 for r in v): solo[(k[1], k[0][0])] += 1
print("parcela-mes que dependen solo de pasos con x < 0.15 o x > 0.85:", sum(solo.values()), "de", sum(tot.values()))
for k in sorted(tot): print("  ", k, solo[k], "de", tot[k])
