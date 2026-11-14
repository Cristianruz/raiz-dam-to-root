# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""B1 · Parcelas de Fields of The World (predicciones globales, CC-BY-4.0) para la zona piloto.

Entrada: data/raw/ftw/ftw_zona_piloto_crudo.geojson, extraído con datos/navegador/ftw_extraer.js de
    https://data.source.coop/ftw/global-data/predictions/vectors/alpha/results-by-admin/admin:country_code=MX/Mexico.parquet
    (row groups cuyo bbox cruza la zona) y del raster de confianza de 500 m
    https://data.source.coop/ftw/global-data/predictions/confidence/confidence/prue_v1_confidence_global.tif
Uso: python B1_parcelas_ftw.py --crudo ../../data/raw/ftw/ftw_zona_piloto_crudo.geojson --dir <carpeta>
Salida: parcelas_base.geojson con id, area_ha, modulo, ftw_confianza (0-100), protagonista, ftw_id.

FTW publica polígonos repetidos donde se traslapan sus mosaicos de predicción: se procesan de mayor a menor área
y a cada uno se le resta lo ya aceptado; queda como parcela solo si lo restante mide >= 1 ha (partición sin traslapes).
Los vectores de FTW no traen columna de confianza: se toma del raster de 500 m (media de las celdas que cubre la
parcela; si no cubre ningún centro de celda, la celda de su centroide). Si el raster no viene, el script se detiene.
Advertencia (kit 40, B1): el entrenamiento de FTW no incluye México ni riego árido. Las 3 protagonistas se revisan
a mano. Atribución: "Field boundaries: Fields of The World global predictions (CC-BY-4.0), source.coop/ftw/global-data".
"""
import json
import math
import os

from comun import carpeta, registrar_fuentes

ZONA = (-105.42, 28.08, -105.32, 28.16)     # lon_min, lat_min, lon_max, lat_max (igual que Earth Engine)
AREA_MIN_HA = 1.0


def area_ha(coords):
    """Área de un anillo lon/lat en ha (aproximación equirrectangular local; error < 0.5 % a esta escala)."""
    lat0 = math.radians(sum(c[1] for c in coords) / len(coords))
    kx, ky = 111320 * math.cos(lat0), 110540
    s = 0.0
    for (x1, y1), (x2, y2) in zip(coords, coords[1:]):
        s += (x1 * kx) * (y2 * ky) - (x2 * kx) * (y1 * ky)
    return abs(s) / 2 / 10000


def area_geom_ha(g):
    polys = [g["coordinates"]] if g["type"] == "Polygon" else g["coordinates"]
    return sum(area_ha(p[0]) - sum(area_ha(h) for h in p[1:]) for p in polys)


def confianza(geom, raster):
    """Media del raster de confianza (0-1) sobre la parcela; devuelve 0-100 o None si todo es nodata."""
    from shapely.geometry import Point
    r = raster
    x0, y0, res, w, h = r["origen_lon"], r["origen_lat"], r["res"], r["w"], r["h"]
    v = r["valores"]
    minx, miny, maxx, maxy = geom.bounds
    vals = []
    for i in range(max(0, int((y0 - maxy) / res)), min(h, int((y0 - miny) / res) + 1)):
        for j in range(max(0, int((minx - x0) / res)), min(w, int((maxx - x0) / res) + 1)):
            c = Point(x0 + (j + 0.5) * res, y0 - (i + 0.5) * res)
            if geom.contains(c) and v[i * w + j] != r["nodata"]:
                vals.append(v[i * w + j])
    if not vals:
        c = geom.centroid
        i, j = int((y0 - c.y) / res), int((c.x - x0) / res)
        if 0 <= i < h and 0 <= j < w and v[i * w + j] != r["nodata"]:
            vals = [v[i * w + j]]
    return None if not vals else round(100 * sum(vals) / len(vals))


def main():
    a = carpeta("B1: parcelas de Fields of The World",
                lambda ap: ap.add_argument("--crudo", required=True, help="ftw_zona_piloto_crudo.geojson"))
    from shapely.geometry import box, mapping, shape
    crudo = json.load(open(a.crudo))
    raster = crudo.get("confianza_raster")
    if not raster or not raster.get("valores"):
        raise SystemExit("Falta el raster de confianza de FTW en el crudo: no se puede calcular ftw_confianza")
    zona = box(*ZONA)
    cand = []
    for f in crudo["features"]:
        g = shape(f["geometry"])
        if not g.is_valid:
            g = g.buffer(0)
        g = g.intersection(zona)
        if g.is_empty or g.geom_type not in ("Polygon", "MultiPolygon"):
            continue
        gj = mapping(g)
        ha = area_geom_ha(gj)
        if ha < AREA_MIN_HA:
            continue
        cand.append((round(-g.centroid.y, 6), round(g.centroid.x, 6), f["properties"]["ftw_id"], g, gj, ha))
    # Quitar duplicados y traslapes: mayor área primero; a cada polígono se le resta lo ya aceptado
    from shapely.strtree import STRtree
    cand.sort(key=lambda c: -c[3].area)
    aceptadas, limpias = [], []
    for c in cand:
        g = c[3]
        if aceptadas:
            arbol = STRtree(aceptadas)
            vecinas = [aceptadas[j] for j in arbol.query(g)]
            for v in vecinas:
                g = g.difference(v)
        if g.is_empty:
            continue
        if g.geom_type == "MultiPolygon":                # restos: conservar la pieza mayor
            g = max(g.geoms, key=lambda x: x.area)
        if g.geom_type != "Polygon":
            continue
        gj = mapping(g)
        ha = area_geom_ha(gj)
        if ha < AREA_MIN_HA:
            continue
        aceptadas.append(g)
        limpias.append((round(-g.centroid.y, 6), round(g.centroid.x, 6), c[2], g, gj, ha))
    print(f"Candidatos >= 1 ha: {len(cand)} · tras quitar duplicados y traslapes: {len(limpias)}")
    cand = sorted(limpias)                             # ids estables: de norte a sur, de oeste a este
    feats = []
    for k, (_, _, fid, g, gj, ha) in enumerate(cand, 1):
        feats.append({"type": "Feature", "geometry": json.loads(json.dumps(gj)), "properties": {
            "id": f"P{k:04d}", "area_ha": round(ha, 2), "modulo": None,
            "ftw_confianza": confianza(g, raster), "protagonista": False, "ftw_id": fid}})
    with open("parcelas_base.geojson", "w") as fo:
        json.dump({"type": "FeatureCollection", "features": feats}, fo)
    registrar_fuentes("B1", ["parcelas_base.geojson"],
                      "Fields of The World global predictions (CC-BY-4.0), source.coop/ftw/global-data "
                      "(vectores alpha MX y confianza prue_v1 500 m)", "datos/colab/B1_parcelas_ftw.py")
    conf = [x["properties"]["ftw_confianza"] for x in feats]
    sin = sum(1 for c in conf if c is None)
    baja = sum(1 for c in conf if c is not None and c < 50)
    tot = sum(x["properties"]["area_ha"] for x in feats)
    print(f"Polígonos crudos: {len(crudo['features'])} · parcelas >= {AREA_MIN_HA} ha: {len(feats)} ({tot:.0f} ha)")
    print(f"Confianza < 50: {baja} · sin confianza: {sin} · mediana: {sorted(c for c in conf if c is not None)[len(conf)//2 - sin//2] if conf else None}")


if __name__ == "__main__":
    main()
