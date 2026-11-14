# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""B1 · Parcelas de Fields of The World (predicciones globales, CC-BY-4.0) para la zona piloto.

Uso en Colab:
    !pip install duckdb
    python B1_parcelas_ftw.py --listar          # muestra los archivos publicados (llms.txt)
    python B1_parcelas_ftw.py --url <URL.parquet>
Salida: parcelas_base.geojson con id, area_ha, modulo, ftw_confianza, protagonista.

Advertencia (kit 40, B1): el entrenamiento de FTW no incluye México ni riego árido.
Las predicciones se filtran por confianza y las 3 protagonistas se revisan a mano.
Atribución: "Field boundaries: Fields of The World global predictions (CC-BY-4.0), source.coop/ftw/global-data".
"""
import argparse
import json
import math
import os
import urllib.request

from comun import registrar_fuentes

ZONA = (-105.42, 28.08, -105.32, 28.16)     # lon_min, lat_min, lon_max, lat_max (igual que Earth Engine)
LLMS = "https://data.source.coop/ftw/global-data/llms.txt"
AREA_MIN_HA = 1.0


def area_ha(coords):
    """Área de un anillo lon/lat en ha (aproximación equirrectangular local; error < 0.5 % a esta escala)."""
    lat0 = math.radians(sum(c[1] for c in coords) / len(coords))
    kx, ky = 111320 * math.cos(lat0), 110540
    s = 0.0
    for (x1, y1), (x2, y2) in zip(coords, coords[1:]):
        s += (x1 * kx) * (y2 * ky) - (x2 * kx) * (y1 * ky)
    return abs(s) / 2 / 10000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--listar", action="store_true")
    ap.add_argument("--url", help="GeoParquet de FTW que cubre México")
    ap.add_argument("--col_conf", default="confidence", help="nombre de la columna de confianza")
    ap.add_argument("--dir", default=".", help="carpeta de trabajo, p. ej. data/processed")
    a = ap.parse_args()
    os.chdir(a.dir)
    if a.listar:
        print(urllib.request.urlopen(LLMS, timeout=60).read().decode()[:6000])
        return
    import duckdb
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs; INSTALL spatial; LOAD spatial;")
    x0, y0, x1, y1 = ZONA
    q = f"""
        SELECT *, ST_AsGeoJSON(geometry) AS gj FROM read_parquet('{a.url}')
        WHERE ST_Intersects(geometry, ST_MakeEnvelope({x0}, {y0}, {x1}, {y1}))
    """
    filas = con.execute(q).fetchdf()
    print("Columnas:", list(filas.columns))
    feats = []
    for i, r in filas.iterrows():
        g = json.loads(r["gj"])
        anillo = g["coordinates"][0] if g["type"] == "Polygon" else g["coordinates"][0][0]
        ha = area_ha(anillo)
        if ha < AREA_MIN_HA:
            continue
        conf = r.get(a.col_conf)
        if conf is not None and conf <= 1:
            conf = conf * 100                      # FTW puede venir en 0-1; el contrato usa 0-100
        feats.append({"type": "Feature", "geometry": g, "properties": {
            "id": f"P{len(feats) + 1:04d}", "area_ha": round(ha, 2), "modulo": None,
            "ftw_confianza": None if conf is None else round(float(conf)),
            "protagonista": False}})
    with open("parcelas_base.geojson", "w") as f:
        json.dump({"type": "FeatureCollection", "features": feats}, f)
    registrar_fuentes("B1", ["parcelas_base.geojson"],
                      f"Fields of The World global predictions (CC-BY-4.0), {a.url}", "datos/colab/B1_parcelas_ftw.py")
    baja = sum(1 for x in feats if (x["properties"]["ftw_confianza"] or 0) < 50)
    print(f"Parcelas >= {AREA_MIN_HA} ha: {len(feats)} · con confianza < 50: {baja}")


if __name__ == "__main__":
    main()
