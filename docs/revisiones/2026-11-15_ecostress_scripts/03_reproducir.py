# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Revisión independiente: recalcula et_mm_dia y n_escenas desde los crudos de AppEEARS y los compara con el CSV entregado.
# Implementación propia (no importa E1): pandas no; solo la biblioteca estándar.
import csv, sys, math, collections, datetime as dt, statistics, json
crudos, entregado, salida = sys.argv[1:-2], sys.argv[-2], sys.argv[-1]

def num(x):
    try:
        v = float(x)
    except (TypeError, ValueError):
        return None
    return v if math.isfinite(v) else None

def elev_solar(utc, lat, lon):
    """Elevación solar (grados), fórmulas de NOAA simplificadas."""
    doy = utc.timetuple().tm_yday
    h = utc.hour + utc.minute / 60 + utc.second / 3600
    g = 2 * math.pi / 365 * (doy - 1 + (h - 12) / 24)
    eqt = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g) - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    dec = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g) - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
           - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    tst = (h * 60 + eqt + 4 * lon) % 1440          # minutos de tiempo solar verdadero
    ha = math.radians(tst / 4 - 180)
    la = math.radians(lat)
    cosz = math.sin(la) * math.sin(dec) + math.cos(la) * math.cos(dec) * math.cos(ha)
    return 90 - math.degrees(math.acos(max(-1, min(1, cosz)))), tst / 60

obs = collections.defaultdict(list)       # (id, mes) -> [(et, incert, utc, hora solar, elevación)]
todos = collections.defaultdict(set)
for ruta in crudos:
    for r in csv.DictReader(open(ruta, newline="")):
        utc = dt.datetime.strptime(r["Date"], "%Y-%m-%d %H:%M:%S UTC")
        lat, lon = float(r["Latitude"]), float(r["Longitude"])
        local = utc + dt.timedelta(hours=lon / 15)
        mes = local.strftime("%Y-%m")
        todos[r["ID"]].add(mes)
        et = num(r["ECO_L3T_JET_002_ETdaily"])
        if et is None or num(r["ECO_L3T_JET_002_cloud"]) != 0 or num(r["ECO_L3T_JET_002_water"]) != 0:
            continue
        el, hs = elev_solar(utc, lat, lon)
        obs[(r["ID"], mes)].append((et, num(r["ECO_L3T_JET_002_ETinstUncertainty"]), utc, hs, el))

ent = {(f["id"], f["mes"]): f for f in csv.DictReader(open(entregado, newline=""))}
iguales = dif = 0
maxdif = 0.0
n_igual = n_dif = 0
vacios_ok = vacios_mal = 0
ejemplos = []
for k, f in ent.items():
    o = obs.get(k, [])
    mio = round(statistics.median(v[0] for v in o), 2) if o else None
    suyo = num(f["et_mm_dia"])
    if (len(o) == int(f["n_escenas"])): n_igual += 1
    else:
        n_dif += 1
        if len(ejemplos) < 5: ejemplos.append((k, len(o), f["n_escenas"]))
    if mio is None or suyo is None:
        if mio is None and suyo is None: vacios_ok += 1
        else: vacios_mal += 1
        continue
    d = abs(mio - suyo)
    maxdif = max(maxdif, d)
    if d < 1e-9: iguales += 1
    else:
        dif += 1
        if len(ejemplos) < 10: ejemplos.append((k, mio, suyo))
print(f"llaves entregadas: {len(ent)}; llaves mías con dato: {len(obs)}; que no están en la entrega: {len(set(obs) - set(ent))}")
print(f"et_mm_dia: iguales {iguales}, distintos {dif}, diferencia máxima {maxdif}; vacíos coincidentes {vacios_ok}, vacíos que no coinciden {vacios_mal}")
print(f"n_escenas: iguales {n_igual}, distintos {n_dif}")
print("ejemplos:", ejemplos)

# --- Lo que el promedio esconde: hora del paso y pasos repetidos ---
def bajo(o):   # sol a menos de 30° sobre el horizonte
    return o[4] < 30
tot = len(obs)
solo_bajo = sum(1 for o in obs.values() if all(bajo(x) for x in o))
alguno_bajo = sum(1 for o in obs.values() if any(bajo(x) for x in o))
print(f"parcela-mes con dato: {tot}; todos sus pasos con el sol a menos de 30°: {solo_bajo}; alguno: {alguno_bajo}")
pormes = collections.defaultdict(lambda: [0, 0, 0])
for (i, m), o in obs.items():
    z = "L" if i.startswith("L") else "P"
    pormes[(m, z)][0] += 1
    pormes[(m, z)][1] += all(bajo(x) for x in o)
    pormes[(m, z)][2] += any(bajo(x) for x in o)
for k in sorted(pormes): print("  ", k, "con dato", pormes[k][0], "solo sol bajo", pormes[k][1], "alguno bajo", pormes[k][2])
# mismo sobrevuelo contado dos veces: dos renglones de la misma parcela a menos de 5 minutos
dobles = 0; pm_dobles = 0; cambia = 0; maxc = 0
for k, o in obs.items():
    ts = sorted(x[2] for x in o)
    d = sum(1 for a, b in zip(ts, ts[1:]) if (b - a).total_seconds() < 300)
    if d:
        dobles += d; pm_dobles += 1
        # mediana contando el sobrevuelo una vez (promedio de sus dos escenas)
        grupos = []
        for x in sorted(o, key=lambda x: x[2]):
            if grupos and (x[2] - grupos[-1][-1][2]).total_seconds() < 300: grupos[-1].append(x)
            else: grupos.append([x])
        m2 = round(statistics.median(statistics.mean(y[0] for y in g) for g in grupos), 2)
        m1 = round(statistics.median(x[0] for x in o), 2)
        if abs(m1 - m2) > 1e-9: cambia += 1; maxc = max(maxc, abs(m1 - m2))
print(f"parcela-mes donde un mismo sobrevuelo cuenta como dos escenas: {pm_dobles} (renglones repetidos: {dobles}); cambia la mediana en {cambia}, hasta {maxc:.2f} mm/día")
# sobrevuelos distintos por parcela-mes
sv = collections.Counter()
for k, o in obs.items():
    ts = sorted(x[2] for x in o)
    n = 1 + sum(1 for a, b in zip(ts, ts[1:]) if (b - a).total_seconds() >= 300)
    sv[n] += 1
print("sobrevuelos distintos por parcela-mes:", sorted(sv.items()))
# pasos con dato: hora solar y elevación
pasos = collections.defaultdict(list)
for k, o in obs.items():
    for x in o: pasos[x[2]].append(x)
print("UTC | hora solar | elevación | n | med ET | med incert W/m2")
for t in sorted(pasos):
    xs = pasos[t]
    print("  ", t, f"{statistics.mean(x[3] for x in xs):5.2f} h", f"{statistics.mean(x[4] for x in xs):5.1f}°", len(xs), round(statistics.median(x[0] for x in xs), 2), round(statistics.median(x[1] for x in xs if x[1] is not None), 1))
u = sorted(x[1] for o in obs.values() for x in o if x[1] is not None)
q = lambda p: round(u[int(p * (len(u) - 1))], 1)
print("ETinstUncertainty en pasos con dato: n", len(u), "min", q(0), "p10", q(.1), "p25", q(.25), "med", q(.5), "p75", q(.75), "p90", q(.9), "max", q(1))
print("  fracción entre 20 y 45 W/m2:", round(sum(1 for v in u if 20 <= v <= 45) / len(u), 3), " >100:", round(sum(1 for v in u if v > 100) / len(u), 3))
e = sorted(x[0] for o in obs.values() for x in o)
print("ETdaily pasos con dato: n", len(e), "min", e[0], "med", statistics.median(e), "p99", e[int(.99 * (len(e) - 1))], "max", e[-1], " ceros:", sum(1 for v in e if v == 0), " <0.05:", sum(1 for v in e if v < 0.05))
json.dump({f"{k[0]}|{k[1]}": [[x[0], x[1], x[2].isoformat(), round(x[3], 2), round(x[4], 1)] for x in sorted(o, key=lambda x: x[2])] for k, o in obs.items()}, open(salida, "w"))
