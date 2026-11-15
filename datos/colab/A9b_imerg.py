# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A9b · Lluvia diaria GPM IMERG V07 promediada sobre la zona piloto, 2001–2026, y tormenta de referencia P95.

Entradas: data/raw/imerg/imerg_2001_2008.csv, imerg_2009_2016.csv, imerg_2017_2026.csv (Earth Engine:
          NASA/GPM_L3/IMERG_V07, banda precipitation en mm/h, media de las medias horas del día UTC × 24,
          media espacial sobre [-105.42, 28.08, -105.32, 28.16] a 1 km; script en datos/earthengine/imerg_diaria.js)
Salidas:  imerg_diaria.csv (fecha, lluvia_mm) y imerg_meta.json (P95 de días ≥ 1 mm, días sin dato, periodo)
Días con menos de 48 medias horas se marcan en imerg_meta.json; días sin ninguna quedan sin fila.
"""
import csv
import glob
import json
import os

import numpy as np

from comun import carpeta, registrar_fuentes


def main():
    a = carpeta("A9b: lluvia diaria IMERG", lambda ap: (ap.add_argument("--crudo", required=True),
                                          ap.add_argument("--patron", default="imerg_2*.csv")))
    filas, incompletos = {}, []
    for ruta in sorted(glob.glob(os.path.join(a.crudo, a.patron))):
        for r in csv.DictReader(open(ruta)):
            if r["lluvia_mm"] in ("", None):
                continue
            filas[r["fecha"]] = round(max(float(r["lluvia_mm"]), 0.0), 3)
            if int(float(r["n_medias_horas"])) < 48:
                incompletos.append(r["fecha"])
    fechas = sorted(filas)
    with open("imerg_diaria.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["fecha", "lluvia_mm"])
        w.writerows([f, filas[f]] for f in fechas)
    lluvias = [v for v in filas.values() if v >= 1.0]
    anual = {}
    for f, v in filas.items():
        anual.setdefault(f[:4], 0.0)
        anual[f[:4]] += v
    completos = [v for k, v in anual.items() if "2001" <= k <= "2025"]
    meta = {"fuente": "NASA GPM IMERG V07 (NASA/GPM_L3/IMERG_V07) vía Google Earth Engine, proyecto iondroplet",
            "periodo": f"{fechas[0]} a {fechas[-1]}", "dias": len(fechas), "dias_incompletos": len(incompletos),
            "tormenta_p95_mm": round(float(np.percentile(lluvias, 95)), 1),
            "definicion": "percentil 95 de los días con lluvia >= 1 mm",
            "lluvia_anual_media_2001_2025_mm": round(sum(completos) / len(completos), 0)}
    json.dump(meta, open("imerg_meta.json", "w"), ensure_ascii=False, indent=1)
    registrar_fuentes("A9b", ["imerg_diaria.csv", "imerg_meta.json"], meta["fuente"], "datos/colab/A9b_imerg.py")
    print(meta)


if __name__ == "__main__":
    main()
