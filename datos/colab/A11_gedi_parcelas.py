# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A11 · Altura del dosel de GEDI por parcela (evidencia: distingue huerta de cultivo bajo).

Entradas: data/raw/reto/gedi_disparos_<zona>.csv (Earth Engine, LARSE/GEDI/GEDI02_A_002_MONTHLY: GEDI L2A v2 rasterizado
          a 25 m; columnas zona, mes, longitude, latitude, rh98, sensitivity, solar_elevation, beam) y parcelas_base.geojson
Salida:   gedi_parcelas.csv  (id, n_disparos, altura_mediana_m, altura_p90_m)
Uso:      python A11_gedi_parcelas.py --dir <carpeta con parcelas_base.geojson> --crudo data/raw/reto

Filtro de calidad (aplicado en Earth Engine): quality_flag = 1 y degrade_flag = 0. Aquí, además, sensitivity >= 0.9.
Un disparo cuenta para la parcela si el centro de su celda de 25 m cae dentro del polígono. rh98 = altura relativa del
98 % de la energía devuelta; en suelo desnudo o cultivo bajo ronda de 0 a 3 m por el ancho del pulso (no es altura de
planta). Una parcela sin disparos lleva n_disparos = 0 y las alturas vacías: es «sin dato», no «cero».
"""
import csv
import glob
import json
import os

import numpy as np
from shapely.geometry import Point, shape
from shapely.strtree import STRtree

from comun import carpeta, registrar_fuentes

SENSIBILIDAD_MIN = 0.9


def main():
    a = carpeta("A11: GEDI por parcela", lambda ap: ap.add_argument("--crudo", required=True))
    feats = json.load(open("parcelas_base.geojson"))["features"]
    geoms = [shape(f["geometry"]) for f in feats]
    arbol = STRtree(geoms)
    valores = [[] for _ in feats]
    total = usados = fuera = 0
    periodo = set()
    for ruta in sorted(glob.glob(os.path.join(a.crudo, "gedi_disparos_*.csv"))):
        for r in csv.DictReader(open(ruta)):
            total += 1
            if float(r["sensitivity"]) < SENSIBILIDAD_MIN:
                continue
            periodo.add(r["mes"])
            p = Point(float(r["longitude"]), float(r["latitude"]))
            dentro = [j for j in arbol.query(p) if geoms[j].contains(p)]
            if not dentro:
                fuera += 1
                continue
            usados += 1
            valores[dentro[0]].append(float(r["rh98"]))
    if not total:
        raise SystemExit("No hay disparos en el crudo")
    with open("gedi_parcelas.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "n_disparos", "altura_mediana_m", "altura_p90_m"])
        for f, v in zip(feats, valores):
            if v:
                w.writerow([f["properties"]["id"], len(v), round(float(np.median(v)), 2), round(float(np.percentile(v, 90)), 2)])
            else:
                w.writerow([f["properties"]["id"], 0, "", ""])
    con = sum(1 for v in valores if v)
    meses = sorted(periodo)
    registrar_fuentes("A11", ["gedi_parcelas.csv"],
                      f"GEDI L2A v2 (LARSE/GEDI/GEDI02_A_002_MONTHLY, rasterizado a 25 m) vía Google Earth Engine, proyecto iondroplet; "
                      f"rh98; disparos de {meses[0]} a {meses[-1]}; filtro: quality_flag = 1, degrade_flag = 0 y sensitivity >= {SENSIBILIDAD_MIN}; "
                      f"un disparo cuenta si el centro de su celda cae dentro de la parcela; {con} de {len(feats)} parcelas con al menos un disparo",
                      "datos/earthengine/contexto_regional.js + datos/colab/A11_gedi_parcelas.py")
    print(f"Disparos en el crudo: {total} · con sensibilidad >= {SENSIBILIDAD_MIN} dentro de una parcela: {usados} · fuera de parcelas: {fuera}")
    print(f"Parcelas con disparos: {con} de {len(feats)} · periodo {meses[0]} a {meses[-1]}")


if __name__ == "__main__":
    main()
