# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Une las corridas por zona en la carpeta de entrega (decisión de dos zonas, 14-nov-2026 12:50).

Entrada: data/zonas/<zona>/ con las salidas de B1, A1, A3, A4, A5 y A9 de cada zona.
Salida:  --salida (p. ej. data/entrega_zonas/) con:
  - un solo archivo con las dos zonas: parcelas_base.geojson (propiedad zona), los CSV por parcela y
    relieve_rutas.geojson (propiedad zona en cada línea);
  - por zona: los de delicias_saucillo sin sufijo y los de lazaro_cardenas con sufijo _lazaro_cardenas
    (eto_diaria, rotaciones, demanda_cultivos, relieve_meta, nasadem_zona_piloto);
  - LEEME.md con una línea por archivo (archivo | fuente | fecha | script).
"""
import argparse
import csv
import datetime as dt
import json
import os
import shutil

ZONAS = ["delicias_saucillo", "lazaro_cardenas"]
BASE = "delicias_saucillo"                         # sus archivos van sin sufijo
UNIDOS_CSV = ["hls_mensual_parcelas.csv", "suelo_desnudo.csv", "memoria_parcelas.csv", "memoria_resumen.csv",
              "cultivos_parcelas.csv", "relieve_parcelas.csv"]
POR_ZONA = ["eto_diaria.csv", "rotaciones.json", "demanda_cultivos.csv", "relieve_meta.json", "nasadem_zona_piloto.tif",
            "imerg_diaria.csv"]                    # imerg_diaria.csv solo si ya existe en la carpeta de la zona


def fuentes(carpeta):
    out = {}
    for n in os.listdir(carpeta):
        if n.startswith("fuentes_") and n.endswith(".csv"):
            for r in csv.DictReader(open(os.path.join(carpeta, n))):
                out[os.path.basename(r["archivo"])] = r
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zonas", default="data/zonas")
    ap.add_argument("--salida", required=True)
    ap.add_argument("--nasadem_fuente", default="NASADEM (NASA/NASADEM_HGT/001) vía Google Earth Engine, proyecto iondroplet, zona + 2 km, 30 m")
    a = ap.parse_args()
    os.makedirs(a.salida, exist_ok=True)
    hoy = dt.date.today().isoformat()
    fz = {z: fuentes(os.path.join(a.zonas, z)) for z in ZONAS}
    leeme = []

    def linea(nombre, z, base, extra=""):
        r = fz[z].get(base)
        if base.startswith("nasadem"):
            leeme.append(f"{nombre} | {a.nasadem_fuente}; zona {z} | {hoy} | datos/earthengine/A3_hls_nasadem.js")
        elif r:
            leeme.append(f"{nombre} | {r['fuente']}{extra} | {r['fecha']} | {r['script']}")
        else:
            raise SystemExit(f"Sin fuente registrada para {base} en {z}")

    # 1) parcelas_base.geojson y relieve_rutas.geojson con las dos zonas
    for nombre in ("parcelas_base.geojson", "relieve_rutas.geojson"):
        feats = []
        for z in ZONAS:
            for f in json.load(open(os.path.join(a.zonas, z, nombre)))["features"]:
                f["properties"]["zona"] = z
                feats.append(f)
        json.dump({"type": "FeatureCollection", "features": feats}, open(os.path.join(a.salida, nombre), "w"))
        linea(nombre, BASE, nombre, "; dos zonas (propiedad zona)")
    # 2) CSV por parcela con las dos zonas
    for nombre in UNIDOS_CSV:
        enc, filas = None, []
        for z in ZONAS:
            with open(os.path.join(a.zonas, z, nombre)) as fo:
                rd = csv.reader(fo)
                e = next(rd)
                if enc and e != enc:
                    raise SystemExit(f"Encabezados distintos en {nombre}: {enc} vs {e}")
                enc = e
                filas.extend(rd)
        with open(os.path.join(a.salida, nombre), "w", newline="") as fo:
            w = csv.writer(fo)
            w.writerow(enc)
            w.writerows(filas)
        linea(nombre, BASE, nombre, "; dos zonas")
    # 3) Por zona, con sufijo para la zona nueva
    for z in ZONAS:
        for nombre in POR_ZONA:
            raiz, ext = os.path.splitext(nombre)
            destino = nombre if z == BASE else f"{raiz}_{z}{ext}"
            if nombre == "imerg_diaria.csv" and not os.path.exists(os.path.join(a.zonas, z, nombre)):
                continue
            shutil.copyfile(os.path.realpath(os.path.join(a.zonas, z, nombre)), os.path.join(a.salida, destino))
            linea(destino, z, nombre, f"; zona {z}")
    with open(os.path.join(a.salida, "LEEME.md"), "w") as fo:
        fo.write("archivo | fuente | fecha | script\n" + "\n".join(leeme) + "\n")
    print("\n".join(leeme))


if __name__ == "__main__":
    main()
