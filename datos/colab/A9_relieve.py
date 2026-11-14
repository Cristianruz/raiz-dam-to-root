# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A9 · Relieve y escurrimiento con NASADEM (30 m) a escala de zona; tormenta de referencia.

Entradas: nasadem_zona_piloto.tif (Earth Engine), parcelas_base.geojson (B1), eto_diaria.csv (A1, opcional)
Salidas:
    relieve_parcelas.csv     id, pendiente_media_pct, aportacion_externa_ha, frac_depresion
    relieve_rutas.geojson    líneas por donde se concentra el escurrimiento (para animar «Simular tormenta»)
    relieve_meta.json        umbral de rutas, tormenta P95 (mm) con su fuente y periodo, rótulo de escala
Rótulo obligatorio: "regional, 30 m (NASADEM); not field drainage design".
Método: relleno de depresiones (priority-flood), dirección D8 y acumulación de flujo. Sin dependencias
hidrológicas externas, para poder auditarlo.
"""
import csv
import heapq
import json
import math

import numpy as np
import rasterio
from rasterio.features import geometry_mask

from comun import carpeta, registrar_fuentes

UMBRAL_RUTA_HA = None          # se lee de supuestos.json (umbral_ruta_ha, assumption [S])
PROF_DEPRESION_M = 0.1         # profundidad mínima de depresión (kit A9), assumption [S]
VECINOS = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]


def rellenar(z):
    """Priority-flood (Barnes et al. 2014): eleva las depresiones al nivel de su desagüe."""
    h, w = z.shape
    lleno = z.astype(float).copy()
    visto = np.zeros_like(z, dtype=bool)
    pq = []
    for i in range(h):
        for j in (0, w - 1):
            heapq.heappush(pq, (lleno[i, j], i, j)); visto[i, j] = True
    for j in range(w):
        for i in (0, h - 1):
            if not visto[i, j]:
                heapq.heappush(pq, (lleno[i, j], i, j)); visto[i, j] = True
    while pq:
        v, i, j = heapq.heappop(pq)
        for di, dj in VECINOS:
            a, b = i + di, j + dj
            if 0 <= a < h and 0 <= b < w and not visto[a, b]:
                visto[a, b] = True
                lleno[a, b] = max(lleno[a, b], v + 1e-5)   # epsilon: garantiza pendiente hacia el desagüe
                heapq.heappush(pq, (lleno[a, b], a, b))
    return lleno


def d8_y_acumulacion(z, dx, dy):
    h, w = z.shape
    destino = -np.ones((h, w, 2), dtype=int)
    for i in range(h):
        for j in range(w):
            mejor, d = 0.0, None
            for di, dj in VECINOS:
                a, b = i + di, j + dj
                if 0 <= a < h and 0 <= b < w:
                    dist = math.hypot(di * dy, dj * dx)
                    s = (z[i, j] - z[a, b]) / dist
                    if s > mejor:
                        mejor, d = s, (a, b)
            if d:
                destino[i, j] = d
    acum = np.ones((h, w))                      # celdas aguas arriba, incluida la propia
    for k in np.argsort(-z, axis=None):
        i, j = divmod(int(k), w)
        a, b = destino[i, j]
        if a >= 0:
            acum[a, b] += acum[i, j]
    return destino, acum


def tormenta_p95(ruta="eto_diaria.csv"):
    try:
        filas = list(csv.DictReader(open(ruta)))
    except FileNotFoundError:
        return None
    lluvias = [float(r["lluvia_mm"]) for r in filas if float(r["lluvia_mm"]) >= 1.0]
    if not lluvias:
        return None
    return {"mm": round(float(np.percentile(lluvias, 95)), 1),
            "definicion": "percentil 95 de los días con lluvia >= 1 mm",
            "fuente": "NASA POWER PRECTOTCORR, punto de la zona piloto",
            "periodo": f"{filas[0]['fecha']} a {filas[-1]['fecha']}"}


def main():
    global UMBRAL_RUTA_HA
    carpeta("A9: relieve y escurrimiento con NASADEM")
    sup = json.load(open("supuestos.json"))
    if "umbral_ruta_ha" not in sup:
        raise SystemExit("Falta 'umbral_ruta_ha' en supuestos.json")
    UMBRAL_RUTA_HA = float(sup["umbral_ruta_ha"]["valor"])
    with rasterio.open("nasadem_zona_piloto.tif") as src:
        z = src.read(1).astype(float)
        tr = src.transform
        lat_c = tr.f + tr.e * src.height / 2
        dx = abs(tr.a) * 111320 * math.cos(math.radians(lat_c))
        dy = abs(tr.e) * 110540
        celda_ha = dx * dy / 10000
        lleno = rellenar(z)
        prof = lleno - z
        gy, gx = np.gradient(z, dy, dx)
        pendiente = np.hypot(gx, gy) * 100
        destino, acum = d8_y_acumulacion(lleno, dx, dy)

        parcelas = json.load(open("parcelas_base.geojson"))["features"]
        filas = []
        for f in parcelas:
            m = ~geometry_mask([f["geometry"]], out_shape=z.shape, transform=tr, all_touched=False)
            if not m.any():
                m = ~geometry_mask([f["geometry"]], out_shape=z.shape, transform=tr, all_touched=True)
            # Aportación externa: máximo flujo que entra a la parcela desde celdas de fuera
            externa = 0.0
            for i, j in zip(*np.where(~m)):
                a, b = destino[i, j]
                if a >= 0 and m[a, b]:
                    externa = max(externa, acum[i, j])
            filas.append([f["properties"]["id"], round(float(pendiente[m].mean()), 3),
                          round(externa * celda_ha, 2), round(float((prof[m] > PROF_DEPRESION_M).mean()), 3)])

        umbral_celdas = UMBRAL_RUTA_HA / celda_ha
        lineas = []
        for i, j in zip(*np.where(acum >= umbral_celdas)):
            a, b = destino[i, j]
            if a >= 0:
                p = lambda r, c: [round(tr.c + (c + 0.5) * tr.a, 6), round(tr.f + (r + 0.5) * tr.e, 6)]
                lineas.append([p(i, j), p(a, b)])

    with open("relieve_parcelas.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "pendiente_media_pct", "aportacion_externa_ha", "frac_depresion"])
        w.writerows(filas)
    json.dump({"type": "FeatureCollection", "features": [{
        "type": "Feature", "properties": {"umbral_ha": UMBRAL_RUTA_HA},
        "geometry": {"type": "MultiLineString", "coordinates": lineas}}]},
        open("relieve_rutas.geojson", "w"))
    json.dump({"rotulo": "regional, 30 m (NASADEM); not field drainage design",
               "umbral_ruta_ha": UMBRAL_RUTA_HA, "umbral_ruta_etiqueta": "assumption [S]", "celda_ha": round(celda_ha, 4),
               "tormenta": tormenta_p95()}, open("relieve_meta.json", "w"), ensure_ascii=False, indent=1)
    registrar_fuentes("A9", ["relieve_parcelas.csv", "relieve_rutas.geojson", "relieve_meta.json"],
                      "NASADEM (NASA/NASADEM_HGT/001) vía Google Earth Engine; lluvia NASA POWER",
                      "datos/colab/A9_relieve.py")
    print(f"Parcelas: {len(filas)} · segmentos de ruta: {len(lineas)} · "
          f"pendiente media de la zona: {pendiente.mean():.2f} %")


if __name__ == "__main__":
    main()
