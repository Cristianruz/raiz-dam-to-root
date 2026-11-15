# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Revisión independiente: tabla de las tres parcelas protagonistas (pasos con hora UTC + longitud/15, como el código de JPL).
import csv, sys, math, statistics, collections, datetime as dt
proc = sys.argv[1]; crudos = sys.argv[2:]
def dec(doy):
    g = 2 * math.pi * (doy - 1) / 365
    return (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
            - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
ent = {(f["id"], f["mes"]): f for f in csv.DictReader(open(f"{proc}/ecostress_parcelas.csv", newline=""))}
ndvi = {}
for r in csv.DictReader(open(f"{proc}/hls_mensual_parcelas.csv", newline="")):
    if r["banda"] == "ndvi" and r["mediana"] != "": ndvi[(r["id"], r["mes"])] = float(r["mediana"])
eto = {}
for z, a in (("P", "eto_diaria.csv"), ("L", "eto_diaria_lazaro_cardenas.csv")):
    eto[z] = {r["fecha"]: float(r["eto_mm"]) for r in csv.DictReader(open(f"{proc}/{a}", newline=""))}
P = ("P0757", "P0632", "L0175")
pasos = collections.defaultdict(list)
for ruta in crudos:
    for r in csv.DictReader(open(ruta, newline="")):
        if r["ID"] not in P or r["ECO_L3T_JET_002_ETdaily"] == "": continue
        utc = dt.datetime.strptime(r["Date"], "%Y-%m-%d %H:%M:%S UTC")
        lat, lon = float(r["Latitude"]), float(r["Longitude"])
        loc = utc + dt.timedelta(hours=lon / 15)
        hod = loc.hour + loc.minute / 60 + loc.second / 3600
        sha = math.degrees(math.acos(-math.tan(math.radians(lat)) * math.tan(dec(loc.timetuple().tm_yday))))
        x = (hod - (12 - sha / 15)) / (2 * sha / 15)
        pasos[(r["ID"], loc.strftime("%Y-%m"))].append((loc, float(r["ECO_L3T_JET_002_ETdaily"]), float(r["ECO_L3T_JET_002_ETinstUncertainty"]), x))
for p in P:
    print(f"\n**{p}**")
    print("| Mes | et_mm_dia | n_escenas | Pasos: día hora → ETdaily (dispersión entre modelos, W/m²) | etc_modelo_mm | razon | NDVI de HLS | ETo media del mes |")
    print("|---|---|---|---|---|---|---|---|")
    for m in sorted({k[1] for k in ent}):
        f = ent[(p, m)]
        det = "; ".join(f"{l.day} {l.hour}:{l.minute:02d}{'*' if (x < 0.15 or x > 0.85) else ''} → {e:.2f} (±{u:.0f})" for l, e, u, x in sorted(pasos.get((p, m), [])))
        em = statistics.mean(v for k, v in eto[p[0]].items() if k.startswith(m))
        print(f"| {m} | {f['et_mm_dia'] or '—'} | {f['n_escenas']} | {det or '—'} | {f['etc_modelo_mm'] or '—'} | {f['razon'] or '—'} | {ndvi.get((p, m), float('nan')):.2f} | {em:.1f} |")
