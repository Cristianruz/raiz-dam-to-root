# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A13 · Suelo por parcela con mapas globales de 250 m (SoilGrids 2.0 y OpenLandMap).

Entradas: data/raw/reto/suelo_soilgrids_<zona>.csv (Earth Engine, proyecto iondroplet: projects/soilgrids-isric/<prop>_mean,
          promedio ponderado de las capas 0–5, 5–15 y 15–30 cm, en unidades del mapa; y
          OpenLandMap/SOL/SOL_TEXTURE-CLASS_USDA-TT_M/v02, bandas b0, b10 y b30; una fila por celda de 250 m con su centro)
          parcelas_base.geojson (en --dir)
Salida:   suelo_parcelas.csv  (id, zona, arena_pct, limo_pct, arcilla_pct, textura_usda, textura_olm, ph,
                               carbono_organico_g_kg, cic_cmol_kg, n_celdas, distancia_celda_m)
Uso:      python A13_suelo_parcelas.py --dir data/reto --crudo data/raw/reto

Método:
- Valor de la parcela = promedio de las celdas cuyo centro cae dentro del polígono; si ninguna cae dentro (parcela menor
  que una celda, ~6 ha), la celda más cercana al centroide. n_celdas = celdas dentro (0 = se usó la más cercana) y
  distancia_celda_m = distancia del centroide a esa celda. Si la más cercana queda a más de 250 m, la parcela va sin dato.
- Unidades (ISRIC, tabla de propiedades de SoilGrids): arena, limo y arcilla g/kg ÷ 10 = %; pH × 10 ÷ 10; carbono orgánico
  dg/kg ÷ 10 = g/kg; nitrógeno cg/kg ÷ 100 = g/kg; CIC mmol(c)/kg ÷ 10 = cmol(c)/kg.
- textura_usda: clase del triángulo de textura del USDA calculada con arena, limo y arcilla de SoilGrids (límites de
  Benham, Ahrens y Nettleton, 2009, USDA-NRCS). textura_olm: clase más frecuente de OpenLandMap a 0 cm en esas celdas
  (otro producto; se entrega para comparar).
Es una ESTIMACIÓN REGIONAL de un modelo global (celdas de 250 m; ISRIC declara que explica entre 30 % y 70 % de la
variación): no es un análisis de suelo de la parcela. No hay hierro ni otros micronutrientes en estos mapas.
El nitrógeno total del mapa NO se entrega: en estas zonas da ~10 g/kg con ~10 g/kg de carbono orgánico (relación C:N
cercana a 1), que no es creíble para un suelo agrícola; queda solo en el crudo.
"""
import collections
import csv
import glob
import json
import math
import os

import numpy as np
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

from comun import carpeta, registrar_fuentes

OLM = {1: "Cl", 2: "SiCl", 3: "SaCl", 4: "ClLo", 5: "SiClLo", 6: "SaClLo", 7: "Lo", 8: "SiLo", 9: "SaLo", 10: "Si",
       11: "LoSa", 12: "Sa"}
DIST_MAX_M = 250.0


def textura_usda(arena, limo, arcilla):
    """Clase de textura del USDA (abreviaturas de OpenLandMap). Límites: Benham, Ahrens y Nettleton (2009)."""
    s, si, c = arena, limo, arcilla
    if si + 1.5 * c < 15:
        return "Sa"
    if si + 1.5 * c >= 15 and si + 2 * c < 30:
        return "LoSa"
    if (7 <= c < 20 and s > 52 and si + 2 * c >= 30) or (c < 7 and si < 50 and si + 2 * c >= 30):
        return "SaLo"
    if 7 <= c < 27 and 28 <= si < 50 and s <= 52:
        return "Lo"
    if (si >= 50 and 12 <= c < 27) or (50 <= si < 80 and c < 12):
        return "SiLo"
    if si >= 80 and c < 12:
        return "Si"
    if 20 <= c < 35 and si < 28 and s > 45:
        return "SaClLo"
    if 27 <= c < 40 and 20 < s <= 45:
        return "ClLo"
    if 27 <= c < 40 and s <= 20:
        return "SiClLo"
    if c >= 35 and s > 45:
        return "SaCl"
    if c >= 40 and si >= 40:
        return "SiCl"
    if c >= 40 and s <= 45 and si < 40:
        return "Cl"
    return ""


def main():
    a = carpeta("A13: suelo por parcela", lambda ap: ap.add_argument("--crudo", required=True))
    celdas = []
    for ruta in sorted(glob.glob(os.path.join(a.crudo, "suelo_soilgrids_*.csv"))):
        celdas.extend(csv.DictReader(open(ruta)))
    if not celdas:
        raise SystemExit(f"Falta el crudo suelo_soilgrids_*.csv en {a.crudo}")
    pts = [Point(float(c["longitude"]), float(c["latitude"])) for c in celdas]
    arbol = STRtree(pts)
    xy = np.array([[p.x, p.y] for p in pts])
    filas, sin_dato = [], 0
    for f in json.load(open("parcelas_base.geojson"))["features"]:
        pid, zona, geom = f["properties"]["id"], f["properties"]["zona"], shape(f["geometry"])
        dentro = [i for i in arbol.query(geom) if geom.contains(pts[i])]
        cen = geom.centroid
        kx = 111320.0 * math.cos(math.radians(cen.y))
        d = np.hypot((xy[:, 0] - cen.x) * kx, (xy[:, 1] - cen.y) * 110540.0)
        j = int(d.argmin())
        usar = dentro if dentro else ([j] if d[j] <= DIST_MAX_M else [])
        if not usar:
            sin_dato += 1
            filas.append({"id": pid, "zona": zona, "arena_pct": "", "limo_pct": "", "arcilla_pct": "", "textura_usda": "",
                          "textura_olm": "", "ph": "", "carbono_organico_g_kg": "", "cic_cmol_kg": "",
                          "n_celdas": 0, "distancia_celda_m": ""})
            continue
        m = lambda k: float(np.mean([float(celdas[i][k]) for i in usar]))
        arena, limo, arcilla = m("sand") / 10, m("silt") / 10, m("clay") / 10
        olm = collections.Counter(int(float(celdas[i]["olm_tex_0"])) for i in usar).most_common(1)[0][0]
        filas.append({"id": pid, "zona": zona, "arena_pct": round(arena, 1), "limo_pct": round(limo, 1),
                      "arcilla_pct": round(arcilla, 1), "textura_usda": textura_usda(arena, limo, arcilla),
                      "textura_olm": OLM.get(olm, ""), "ph": round(m("phh2o") / 10, 1),
                      "carbono_organico_g_kg": round(m("soc") / 10, 1),
                      "cic_cmol_kg": round(m("cec") / 10, 1), "n_celdas": len(dentro),
                      "distancia_celda_m": round(float(d[j])) if not dentro else ""})
    with open("suelo_parcelas.csv", "w", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)
    registrar_fuentes("A13", ["suelo_parcelas.csv"],
                      "ISRIC SoilGrids 2.0 (250 m, CC-BY 4.0; Earth Engine: projects/soilgrids-isric/<propiedad>_mean; arena, limo, "
                      "arcilla, pH en agua, carbono orgánico y CIC; promedio ponderado de 0–30 cm; Poggio et al. 2021, DOI 10.5194/soil-7-217-2021) y OpenLandMap, clase "
                      "de textura USDA a 0 cm (Hengl 2018, DOI 10.5281/zenodo.1475451, CC-BY-SA 4.0); dos zonas; estimación regional de "
                      "un modelo global, no un análisis de suelo de la parcela", "datos/colab/A13_suelo_parcelas.py")
    con = [f for f in filas if f["arena_pct"] != ""]
    for z in sorted({f["zona"] for f in filas}):
        fs = [f for f in con if f["zona"] == z]
        q = lambda k: [round(float(np.percentile([f[k] for f in fs], p)), 2) for p in (10, 50, 90)]
        print(z, len(fs), "parcelas · textura", dict(collections.Counter(f["textura_usda"] for f in fs)),
              "· OLM", dict(collections.Counter(f["textura_olm"] for f in fs)))
        print("   arena", q("arena_pct"), "arcilla", q("arcilla_pct"), "pH", q("ph"), "C org", q("carbono_organico_g_kg"),
              "CIC", q("cic_cmol_kg"), "· con celda dentro:", sum(f["n_celdas"] > 0 for f in fs))
    print("sin dato:", sin_dato)


if __name__ == "__main__":
    main()
