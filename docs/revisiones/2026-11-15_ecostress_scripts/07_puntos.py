# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
# Revisión independiente: los puntos de la solicitud de AppEEARS caen dentro de su parcela y son los del crudo. Solo lectura.
import csv, json, sys
geo, sols, crudos = sys.argv[1], sys.argv[2:4], sys.argv[4:6]
pts = {}
for s in sols:
    j = json.load(open(s))
    print(s.split("/")[-1], j["task_type"], j["task_name"], j["params"]["dates"], [(l["product"], l["layer"]) for l in j["params"]["layers"]], len(j["params"]["coordinates"]))
    for c in j["params"]["coordinates"]: pts[c["id"]] = (c["longitude"], c["latitude"], c["category"])
def dentro(pt, geom):
    x, y = pt
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    def en_anillo(r):
        c = False
        for (x1, y1), (x2, y2) in zip(r, r[1:]):
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
        return c
    return any(en_anillo(p[0]) and not any(en_anillo(h) for h in p[1:]) for p in polys)
g = json.load(open(geo))
fuera = [f["properties"]["id"] for f in g["features"] if not dentro(pts[f["properties"]["id"]][:2], f["geometry"])]
zmal = [f["properties"]["id"] for f in g["features"] if pts[f["properties"]["id"]][2] != f["properties"]["zona"]]
print("puntos:", len(pts), "parcelas:", len(g["features"]), "puntos fuera de su parcela:", len(fuera), fuera[:5], "zona distinta:", len(zmal))
dif = 0; ids = set(); fechas = set()
for c in crudos:
    for r in csv.DictReader(open(c, newline="")):
        ids.add(r["ID"]); fechas.add(r["Date"][:10])
        p = pts[r["ID"]]
        if abs(float(r["Longitude"]) - p[0]) > 1e-9 or abs(float(r["Latitude"]) - p[1]) > 1e-9: dif += 1
print("ids en el crudo:", len(ids), "renglones con coordenada distinta de la solicitud:", dif, "fechas:", min(fechas), "a", max(fechas))
