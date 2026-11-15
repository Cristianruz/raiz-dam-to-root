# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""B8 · Tipo de suelo por parcela: gran grupo de la Soil Taxonomy del USDA según OpenLandMap (mapa mundial de 250 m).

Entradas: data/raw/reto/suelo_clases_<zona>.csv (Earth Engine, proyecto del equipo, 14-nov-2026: banda grtgroup de
          OpenLandMap/SOL/SOL_GRTGROUP_USDA-SOILTAX_C/v01 en su malla nativa, una fila por celda con su centro;
          consulta en datos/earthengine/suelo.js), parcelas_base.geojson y suelo_tipos.json (B7) en --dir.
Salida:   tipo_suelo_parcelas.csv  (id, zona, gran_grupo_usda, orden_usda, elementos, fraccion_celdas, n_celdas,
                                    distancia_celda_m, clase_valor)
Uso:      python B8_tipo_suelo_parcelas.py --dir data/reto --crudo data/raw/reto

Método:
- Gran grupo de la parcela = clase más frecuente entre las celdas con centro dentro del polígono; fraccion_celdas = parte
  de esas celdas con esa clase. Sin celda dentro (parcela menor que una celda, ~5 ha): la celda más cercana al centroide,
  si está a 250 m o menos (n_celdas = 0 y distancia_celda_m). Más lejos: sin dato.
- Orden: por la terminación del nombre, que lleva el elemento formativo del orden (Moorberg y Crouse 2017, Tabla 4.2):
  -ids Aridisols, -ents Entisols, -epts Inceptisols, -olls Mollisols, -alfs Alfisols, -erts Vertisols, etc.
- elementos: elementos formativos que aparecen en el nombre (calc, gyps, sal, natr, petro, dur, arg, camb, hapl, torr,
  fluv, psamm, aqu, ust, xer, ud, cry, pale), con su significado en suelo_tipos.json (SSSA, Tabla A2). Lectura propia
  del nombre [I]: «calc» remite a la regla de carbonatos de suelo_reglas.json.
Es una PREDICCIÓN de un modelo mundial (OpenLandMap: probabilidades de gran grupo a 250 m; sin exactitud publicada en
la ficha del catálogo): describe el paisaje, no es un levantamiento de suelos de la parcela. Licencia CC-BY-SA 4.0.
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

# Nombres de las clases presentes en las dos zonas, transcritos de la tabla «grtgroup Class Table» del catálogo de Earth
# Engine (https://developers.google.com/earth-engine/datasets/catalog/OpenLandMap_SOL_SOL_GRTGROUP_USDA-SOILTAX_C_v01),
# leída el 14-nov-2026. Un valor que no esté aquí detiene el script (no se adivina un nombre).
CLASES = {19: "Haplustalfs", 31: "Paleustalfs", 87: "Calciargids", 92: "Haplargids", 93: "Haplocalcids", 94: "Haplocambids",
          97: "Haplogypsids", 104: "Petrocalcids", 138: "Torrifluvents", 139: "Torriorthents", 207: "Calciustepts",
          272: "Argiustolls", 274: "Calciaquolls", 277: "Calciustolls", 291: "Haplustolls", 301: "Paleustolls"}
ORDENES = [("ids", "Aridisols"), ("ents", "Entisols"), ("epts", "Inceptisols"), ("olls", "Mollisols"), ("alfs", "Alfisols"),
           ("erts", "Vertisols"), ("ands", "Andisols"), ("ods", "Spodosols"), ("ults", "Ultisols"), ("ists", "Histosols"),
           ("els", "Gelisols"), ("ox", "Oxisols")]
ELEMENTOS = ("calc", "gyps", "sal", "natr", "petro", "dur", "arg", "camb", "hapl", "torr", "fluv", "psamm", "aqu", "ust",
             "xer", "ud", "cry", "pale")
DIST_MAX_M = 250.0


def orden(nombre):
    n = nombre.lower()
    for fin, o in ORDENES:
        if n.endswith(fin):
            return o
    raise SystemExit(f"No se reconoce el orden de {nombre}")


def main():
    a = carpeta("B8: tipo de suelo por parcela", lambda ap: ap.add_argument("--crudo", required=True))
    celdas = []
    for ruta in sorted(glob.glob(os.path.join(a.crudo, "suelo_clases_*.csv"))):
        celdas.extend(csv.DictReader(open(ruta)))
    if not celdas:
        raise SystemExit(f"Falta el crudo suelo_clases_*.csv en {a.crudo}")
    faltan = {int(c["grtgroup"]) for c in celdas} - set(CLASES)
    if faltan:
        raise SystemExit(f"Clases sin nombre transcrito: {sorted(faltan)} (leer la tabla del catálogo y agregarlas)")
    tipos = json.load(open("suelo_tipos.json"))
    for o in {orden(n) for n in CLASES.values()}:
        if o not in tipos["usda_ordenes"]:
            raise SystemExit(f"{o} no está en suelo_tipos.json")
    pts = [Point(float(c["longitude"]), float(c["latitude"])) for c in celdas]
    arbol, xy = STRtree(pts), np.array([[p.x, p.y] for p in pts])
    filas = []
    for f in json.load(open("parcelas_base.geojson"))["features"]:
        pid, zona, geom = f["properties"]["id"], f["properties"]["zona"], shape(f["geometry"])
        dentro = [i for i in arbol.query(geom) if geom.contains(pts[i])]
        cen = geom.centroid
        d = np.hypot((xy[:, 0] - cen.x) * 111320.0 * math.cos(math.radians(cen.y)), (xy[:, 1] - cen.y) * 110540.0)
        j = int(d.argmin())
        usar = dentro if dentro else ([j] if d[j] <= DIST_MAX_M else [])
        if not usar:
            filas.append({"id": pid, "zona": zona, "gran_grupo_usda": "", "orden_usda": "", "elementos": "", "fraccion_celdas": "",
                          "n_celdas": 0, "distancia_celda_m": "", "clase_valor": ""})
            continue
        cuenta = collections.Counter(int(celdas[i]["grtgroup"]) for i in usar)
        valor, n = cuenta.most_common(1)[0]
        nombre = CLASES[valor]
        filas.append({"id": pid, "zona": zona, "gran_grupo_usda": nombre, "orden_usda": orden(nombre),
                      "elementos": ";".join(e for e in ELEMENTOS if e in nombre.lower()),
                      "fraccion_celdas": round(n / len(usar), 2), "n_celdas": len(dentro),
                      "distancia_celda_m": "" if dentro else round(float(d[j])), "clase_valor": valor})
    with open("tipo_suelo_parcelas.csv", "w", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)
    registrar_fuentes("B8", ["tipo_suelo_parcelas.csv"],
                      "OpenLandMap, grandes grupos del USDA (Predicted USDA soil great groups at 250 m, Hengl y Nauman 2018, v01, DOI 10.5281/zenodo.1476844, "
                      "CC-BY-SA 4.0), Earth Engine OpenLandMap/SOL/SOL_GRTGROUP_USDA-SOILTAX_C/v01, banda grtgroup; orden por el elemento "
                      "formativo (Moorberg y Crouse 2017); dos zonas; predicción de un modelo mundial, no un levantamiento de suelos",
                      "datos/earthengine/suelo.js + datos/colab/B8_tipo_suelo_parcelas.py")
    con = [f for f in filas if f["gran_grupo_usda"]]
    for z in sorted({f["zona"] for f in filas}):
        fs = [f for f in con if f["zona"] == z]
        print(z, len(fs), "parcelas · órdenes", dict(collections.Counter(f["orden_usda"] for f in fs)))
        print("   grandes grupos", dict(collections.Counter(f["gran_grupo_usda"] for f in fs).most_common()),
              "· con calc:", sum("calc" in f["elementos"] for f in fs), "· fracción mediana", np.median([f["fraccion_celdas"] for f in fs]))
    print("sin dato:", len(filas) - len(con))


if __name__ == "__main__":
    main()
