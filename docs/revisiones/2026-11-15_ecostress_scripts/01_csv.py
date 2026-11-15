# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Revisión independiente: el CSV entregado contra su esquema (solo lectura).
import csv, sys, json, collections, statistics, re
ruta, geo = sys.argv[1], sys.argv[2]
filas = list(csv.DictReader(open(ruta, newline="")))
print("columnas:", list(filas[0].keys()))
print("filas:", len(filas))
ids = sorted({f["id"] for f in filas})
print("ids:", len(ids), "P:", sum(i.startswith("P") for i in ids), "L:", sum(i.startswith("L") for i in ids))
llaves = collections.Counter((f["id"], f["mes"]) for f in filas)
print("llaves duplicadas:", sum(1 for v in llaves.values() if v > 1))
meses = sorted({f["mes"] for f in filas})
print("meses:", meses)
print("mes mal formado:", sum(1 for f in filas if not re.fullmatch(r"\d{4}-\d{2}", f["mes"])))
porid = collections.Counter(f["id"] for f in filas)
print("meses por id (distintos conteos):", collections.Counter(porid.values()))
g = json.load(open(geo))
gids = {x["properties"]["id"] for x in g["features"]}
print("parcelas_base:", len(gids), "faltan en csv:", len(gids - set(ids)), "sobran:", len(set(ids) - gids))
zonas = collections.Counter(f["zona"] for f in filas)
print("zona:", zonas)
def fl(x):
    try: return float(x)
    except: return None
con = [f for f in filas if f["et_mm_dia"] != ""]
print("parcela-mes con dato:", len(con), "vacías:", len(filas) - len(con))
# coherencia n_escenas
print("n=0 con dato:", sum(1 for f in filas if f["n_escenas"] == "0" and f["et_mm_dia"] != ""))
print("n>0 sin dato:", sum(1 for f in filas if f["n_escenas"] != "0" and f["et_mm_dia"] == ""))
print("n_escenas no entero:", sum(1 for f in filas if not re.fullmatch(r"\d+", f["n_escenas"])))
idscon = {f["id"] for f in con}
print("parcelas con al menos un mes con dato:", len(idscon), "sin ninguno:", len(set(ids) - idscon), sorted(set(ids) - idscon)[:20])
print("meses con dato por parcela:", sorted(collections.Counter(collections.Counter(f["id"] for f in con).values()).items()))
print()
print("mes | zona | con dato | n=1 | n=2 | n>=3 | min | p25 | med | p75 | max")
for m in meses:
    for z in sorted(zonas):
        v = [f for f in con if f["mes"] == m and f["zona"] == z]
        if not v:
            print(m, z, 0); continue
        e = sorted(float(f["et_mm_dia"]) for f in v)
        n = collections.Counter(int(f["n_escenas"]) for f in v)
        q = statistics.quantiles(e, n=4) if len(e) > 1 else [e[0]]*3
        print(m, z, len(v), n[1], n[2], sum(c for k, c in n.items() if k >= 3), e[0], round(q[0],2), round(statistics.median(e),2), round(q[2],2), e[-1])
n = collections.Counter(int(f["n_escenas"]) for f in con)
print("distribución n_escenas (con dato):", sorted(n.items()))
print("con una sola escena:", n[1], f"{100*n[1]/len(con):.1f}%", " con <=2:", n[1]+n[2], f"{100*(n[1]+n[2])/len(con):.1f}%")
e = sorted(float(f["et_mm_dia"]) for f in con)
print("ET global: min", e[0], "med", statistics.median(e), "p99", e[int(0.99*(len(e)-1))], "max", e[-1])
print("negativos:", sum(1 for x in e if x < 0), " ceros:", sum(1 for x in e if x == 0), " <0.1:", sum(1 for x in e if x < 0.1), " >8:", sum(1 for x in e if x > 8), ">10:", sum(1 for x in e if x > 10))
# razon
r = [f for f in filas if f["razon"] != ""]
print("con etc_modelo:", sum(1 for f in filas if f["etc_modelo_mm"] != ""), "con razon:", len(r))
rr = sorted(float(f["razon"]) for f in r)
print("razon: min", rr[0], "med", statistics.median(rr), "max", rr[-1], ">1:", sum(1 for x in rr if x > 1), ">=0.8:", sum(1 for x in rr if x >= 0.8))
# verificar razon = et/etc
mal = 0
for f in r:
    if abs(round(float(f["et_mm_dia"]) / float(f["etc_modelo_mm"]), 2) - float(f["razon"])) > 0.011: mal += 1
print("razon != et/etc:", mal)
print("etc sin razon:", sum(1 for f in filas if f["etc_modelo_mm"] != "" and f["razon"] == ""), "etc con et vacía:", sum(1 for f in filas if f["etc_modelo_mm"] != "" and f["et_mm_dia"] == ""))
