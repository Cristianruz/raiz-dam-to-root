# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Revisión independiente: exploración de los crudos de AppEEARS (solo lectura).
import csv, sys, collections, statistics, datetime as dt, math
for ruta in sys.argv[1:]:
    filas = list(csv.DictReader(open(ruta, newline="")))
    print("=====", ruta.split("/")[-1], len(filas), "renglones")
    print("columnas:", list(filas[0].keys()))
    print("Category:", collections.Counter(f["Category"] for f in filas))
    print("Tiles:", collections.Counter(f["ECOSTRESS_Tile"] for f in filas))
    ids = {f["ID"] for f in filas}
    print("ids:", len(ids))
    def fl(x):
        try:
            v = float(x)
            return v if math.isfinite(v) else None
        except Exception:
            return None
    cnt = collections.Counter()
    for f in filas:
        e, c, w = fl(f["ECO_L3T_JET_002_ETdaily"]), f["ECO_L3T_JET_002_cloud"], f["ECO_L3T_JET_002_water"]
        cnt[("ET" if e is not None else "sinET", "cloud=" + c, "water=" + w)] += 1
    for k, v in sorted(cnt.items()): print("  ", k, v)
    # pasos distintos (marca de tiempo)
    pasos = collections.defaultdict(list)
    for f in filas:
        pasos[f["Date"]].append(f)
    print("marcas de tiempo distintas:", len(pasos))
    lon = statistics.mean(float(f["Longitude"]) for f in filas)
    print("fecha UTC | hora solar local | tiles | puntos | con ET | cloud=1 | mediana ET | p10 | p90 | mediana incert. inst (W/m2)")
    for d in sorted(pasos):
        fs = pasos[d]
        utc = dt.datetime.strptime(d, "%Y-%m-%d %H:%M:%S UTC")
        loc = utc + dt.timedelta(hours=lon / 15)
        et = sorted(v for v in (fl(f["ECO_L3T_JET_002_ETdaily"]) for f in fs) if v is not None)
        un = sorted(v for v in (fl(f["ECO_L3T_JET_002_ETinstUncertainty"]) for f in fs) if v is not None)
        nub = sum(1 for f in fs if fl(f["ECO_L3T_JET_002_cloud"]) not in (0, None))
        nubnan = sum(1 for f in fs if fl(f["ECO_L3T_JET_002_cloud"]) is None)
        tiles = ",".join(sorted({f["ECOSTRESS_Tile"] for f in fs}))
        def q(a, p): return round(a[int(p * (len(a) - 1))], 2) if a else None
        print(d[:19], loc.strftime("%m-%d %H:%M"), tiles, len(fs), len(et), nub, nubnan, q(et, .5), q(et, .1), q(et, .9), q(un, .5))
