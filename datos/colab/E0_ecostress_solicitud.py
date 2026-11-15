# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""E0 · Solicitudes de AppEEARS para ECOSTRESS: un punto por parcela, una solicitud por zona.

Entrada: parcelas_base.geojson (B1, dos zonas) en --dir.
Salida:  ecostress_solicitud_<zona>.json en --dir: el archivo de solicitud de AppEEARS (task_type «point»), tal como se
         subió el 14-nov-2026 en https://appeears.earthdatacloud.nasa.gov/task/point («Upload a request file»), con la
         cuenta de Earthdata de Cristian (él inició la sesión; nadie más escribió credenciales).
Uso:     python E0_ecostress_solicitud.py --dir data/reto

- Producto: ECO_L3T_JET.002 (ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global 70 m, colección 2),
  capas ETdaily (ET diaria, integrada entre la salida y la puesta del sol), ETinstUncertainty, cloud y water.
- Fechas: año agrícola 2025-26 (1-oct-2025 a 30-sep-2026), el mismo periodo de et_contraste.csv.
- Punto de cada parcela: representative_point() de shapely (siempre cae dentro del polígono; el centroide puede caer fuera).
  AppEEARS toma el píxel de 70 m que contiene el punto. Ninguna parcela tiene menos de 1 ha (mediana: 9.9 ha en
  Delicias–Saucillo y 8.7 ha en Lázaro Cárdenas).
- Una solicitud por zona (940 y 299 puntos), con id = id de la parcela y category = zona.
"""
import json

from shapely.geometry import shape

from comun import carpeta

CAPAS = ("ETdaily", "ETinstUncertainty", "cloud", "water")
FECHAS = {"startDate": "10-01-2025", "endDate": "09-30-2026"}


def main():
    carpeta("E0: solicitudes de AppEEARS para ECOSTRESS")
    por_zona = {}
    for f in json.load(open("parcelas_base.geojson"))["features"]:
        p = shape(f["geometry"]).representative_point()
        z = f["properties"]["zona"]
        por_zona.setdefault(z, []).append({"id": f["properties"]["id"], "category": z,
                                           "latitude": round(p.y, 6), "longitude": round(p.x, 6)})
    for z, coords in sorted(por_zona.items()):
        req = {"task_type": "point", "task_name": f"raiz_ecostress_{z}",
               "params": {"dates": [FECHAS], "layers": [{"product": "ECO_L3T_JET.002", "layer": c} for c in CAPAS],
                          "coordinates": coords}}
        json.dump(req, open(f"ecostress_solicitud_{z}.json", "w"), ensure_ascii=False)
        print(z, len(coords), "puntos")


if __name__ == "__main__":
    main()
