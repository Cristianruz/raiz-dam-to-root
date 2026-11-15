# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Revisión independiente: (a) flujo instantáneo implícito en ETdaily (fórmulas del código de JPL) frente a ETinstUncertainty;
# (b) ET de ECOSTRESS frente a la ETo de NASA POWER del día (cota física); (c) frente a SSEBop por zona y mes. Solo lectura.
import csv, json, sys, math, statistics, collections, datetime as dt
proc, ssedir = sys.argv[1], sys.argv[2]
crudos = sys.argv[3:]
LAM = 2450000.0
def spencer_dec(doy):
    g = 2 * math.pi * (doy - 1) / 365
    return (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
            - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
eto = {}
for z, a in (("P", "eto_diaria.csv"), ("L", "eto_diaria_lazaro_cardenas.csv")):
    eto[z] = {r["fecha"]: float(r["eto_mm"]) for r in csv.DictReader(open(f"{proc}/{a}", newline=""))}
rows = []
for ruta in crudos:
    for r in csv.DictReader(open(ruta, newline="")):
        try: et = float(r["ECO_L3T_JET_002_ETdaily"]); un = float(r["ECO_L3T_JET_002_ETinstUncertainty"])
        except ValueError: continue
        if not (math.isfinite(et) and math.isfinite(un)) or float(r["ECO_L3T_JET_002_cloud"]) != 0 or float(r["ECO_L3T_JET_002_water"]) != 0: continue
        utc = dt.datetime.strptime(r["Date"], "%Y-%m-%d %H:%M:%S UTC")
        lat, lon = float(r["Latitude"]), float(r["Longitude"])
        loc = utc + dt.timedelta(hours=lon / 15)
        hod = loc.hour + loc.minute / 60 + loc.second / 3600
        sha = math.degrees(math.acos(-math.tan(math.radians(lat)) * math.tan(spencer_dec(loc.timetuple().tm_yday))))
        sr, n = 12 - sha / 15, 2 * sha / 15
        x = (hod - sr) / n
        esc = 1.6 / (math.pi * math.sin(math.pi * x))          # LE_diaria = ETinst * esc  (EF * Rn_daily)
        inst = et * LAM / (n * 3600) / esc                        # W/m2: mediana instantánea de los cuatro modelos, implícita
        rows.append({"id": r["ID"], "utc": utc, "fecha": loc.date().isoformat(), "et": et, "un": un, "x": x, "esc": esc, "inst": inst,
                     "eto": eto[r["ID"][0]].get(loc.date().isoformat())})
print("pasos con dato:", len(rows))
rel = sorted(r["un"] / r["inst"] for r in rows if r["inst"] > 0)
q = lambda v, p: v[int(p * (len(v) - 1))]
print(f"dispersión entre modelos / flujo instantáneo implícito: p10 {q(rel,.1):.2f}, p25 {q(rel,.25):.2f}, mediana {q(rel,.5):.2f}, p75 {q(rel,.75):.2f}, p90 {q(rel,.9):.2f}")
print(f"  pasos con dispersión >= flujo: {sum(1 for v in rel if v >= 1)} de {len(rel)} ({100 * sum(1 for v in rel if v >= 1) / len(rel):.1f} %); >= mitad del flujo: {100 * sum(1 for v in rel if v >= .5) / len(rel):.1f} %")
ins = sorted(r["inst"] for r in rows)
print(f"flujo instantáneo implícito (W/m2): p10 {q(ins,.1):.0f}, mediana {q(ins,.5):.0f}, p90 {q(ins,.9):.0f}, máx {ins[-1]:.0f}")
porpaso = collections.defaultdict(list)
for r in rows: porpaso[r["utc"]].append(r)
print("paso | x | escala (1.6/(pi sen(pi x))) | mediana ET | mediana flujo implícito | mediana dispersión | dispersión/flujo")
for t in sorted(porpaso):
    v = porpaso[t]
    print("  ", t, f"{statistics.mean(r['x'] for r in v):.3f}", f"{statistics.mean(r['esc'] for r in v):.2f}", f"{statistics.median(r['et'] for r in v):.2f}", f"{statistics.median(r['inst'] for r in v):.0f}", f"{statistics.median(r['un'] for r in v):.0f}", f"{statistics.median(r['un'] / r['inst'] for r in v if r['inst'] > 0):.2f}")
# (b) cota física con la ETo del día
rr = sorted(r["et"] / r["eto"] for r in rows if r["eto"])
print(f"\nETdaily / ETo de POWER del mismo día: mediana {q(rr,.5):.2f}, p90 {q(rr,.9):.2f}, p99 {q(rr,.99):.2f}, máx {rr[-1]:.2f}; > 1.0: {sum(1 for v in rr if v > 1)}; > 1.3: {sum(1 for v in rr if v > 1.3)}; < 0.05: {sum(1 for v in rr if v < .05)}")
fechas = sorted({r["fecha"] for r in rows})
print("ETo de POWER en los días con dato (mm/día):", {f: (eto["P"].get(f), eto["L"].get(f)) for f in fechas})
for m in ("2025-10", "2025-12", "2026-01", "2026-05", "2026-07", "2026-08"):
    print("  ETo media mensual", m, {z: round(statistics.mean(v for k, v in eto[z].items() if k.startswith(m)), 2) for z in "PL"})
# entrega: valores mensuales frente a la ETo media del mes y máximos por mes
ent = list(csv.DictReader(open(f"{proc}/ecostress_parcelas.csv", newline="")))
cult = {r["id"]: r["cultivo_actual"] for r in csv.DictReader(open(f"{proc}/cultivos_parcelas.csv", newline=""))}
for m in ("2025-10", "2025-12", "2026-01", "2026-05", "2026-07", "2026-08"):
    for z in "PL":
        em = statistics.mean(v for k, v in eto[z].items() if k.startswith(m))
        v = sorted(float(f["et_mm_dia"]) for f in ent if f["mes"] == m and f["id"][0] == z and f["et_mm_dia"] != "")
        if not v: continue
        riego = sorted(float(f["et_mm_dia"]) for f in ent if f["mes"] == m and f["id"][0] == z and f["et_mm_dia"] != "" and cult[f["id"]] in ("alfalfa", "nogal"))
        print(f"  {m} {z}: n {len(v)}, mediana {statistics.median(v):.2f}, p99 {q(v,.99):.2f}, máx {v[-1]:.2f}; ETo media {em:.2f}; máx/ETo {v[-1] / em:.2f}; > ETo: {sum(1 for x in v if x > em)}; alfalfa+nogal n {len(riego)} mediana {statistics.median(riego) if riego else None} máx {riego[-1] if riego else None}")
# (c) SSEBop por zona y mes
import os, glob
for f in sorted(glob.glob(os.path.join(ssedir, "*.csv"))):
    print("\n", os.path.basename(f))
    rs = list(csv.DictReader(open(f, newline="")))
    print("   columnas", list(rs[0].keys()), len(rs))
    for r in rs:
        m = r.get("mes") or r.get("month") or ""
        if m in ("2025-10", "2025-12", "2026-01", "2026-05", "2026-07", "2026-08"):
            print("   ", {k: r[k] for k in r})
