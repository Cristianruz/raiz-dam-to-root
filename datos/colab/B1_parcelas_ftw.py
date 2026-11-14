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

ZONAS = {                                    # lon_min, lat_min, lon_max, lat_max (igual que Earth Engine) [S]
    "delicias_saucillo": ((-105.56, 28.07, -105.32, 28.19), "P"),
    "lazaro_cardenas": ((-105.66, 28.35, -105.56, 28.43), "L"),
}
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
        # Celda del centroide; si es nodata, la celda válida más cercana a 1 o 2 celdas (≤ ~1 km)
        c = geom.centroid
        i, j = int((y0 - c.y) / res), int((c.x - x0) / res)
        for radio in (0, 1, 2):
            cerca = [v[a * w + b] for a in range(i - radio, i + radio + 1) for b in range(j - radio, j + radio + 1)
                     if 0 <= a < h and 0 <= b < w and v[a * w + b] != r["nodata"]]
            if cerca:
                vals = [sum(cerca) / len(cerca)]
                break
    return None if not vals else round(100 * sum(vals) / len(vals))


def main():
    a = carpeta("B1: parcelas de Fields of The World",
                lambda ap: (ap.add_argument("--crudo", required=True, help="ftw_zona_piloto_crudo.geojson"),
                            ap.add_argument("--zona", required=True, choices=sorted(ZONAS)),
                            ap.add_argument("--protagonistas", default="",
                                            help="ids de las 3 protagonistas, separados por coma (revisadas a mano)")))
    from shapely.geometry import box, mapping, shape
    crudo = json.load(open(a.crudo))
    raster = crudo.get("confianza_raster")
    if not raster or not raster.get("valores"):
        raise SystemExit("Falta el raster de confianza de FTW en el crudo: no se puede calcular ftw_confianza")
    bbox, prefijo = ZONAS[a.zona]
    zona = box(*bbox)
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
        # Geometría de salida simplificada a ~10 m (los bordes de FTW son escalones de píxel de 10 m) y con
        # 5 decimales (~1 m): pesa ~3 veces menos; el área es la de la geometría sin simplificar.
        gs = g.simplify(0.0001, preserve_topology=True)
        if not gs.is_valid or gs.geom_type != "Polygon":
            gs = g                                    # si la simplificación la daña, se deja la original
        gj = json.loads(json.dumps(mapping(gs)), parse_float=lambda x: round(float(x), 5))
        feats.append({"type": "Feature", "geometry": gj, "properties": {
            "id": f"{prefijo}{k:04d}", "zona": a.zona, "area_ha": round(ha, 2), "modulo": None,
            "ftw_confianza": confianza(g, raster), "protagonista": False, "ftw_id": fid}})
    prot = [x for x in a.protagonistas.split(",") if x]
    for x in feats:
        x["properties"]["protagonista"] = x["properties"]["id"] in prot
    if prot and sum(x["properties"]["protagonista"] for x in feats) != len(prot):
        raise SystemExit(f"Alguna protagonista no existe: {prot}")
    sin_conf = [x["properties"]["id"] for x in feats if x["properties"]["ftw_confianza"] is None]
    if sin_conf:
        raise SystemExit(f"Parcelas sin confianza de FTW ni a 2 celdas: {sin_conf}")
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
