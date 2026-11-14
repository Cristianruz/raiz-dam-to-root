# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A9 · Relieve y escurrimiento con NASADEM (30 m) a escala de zona; tormenta de referencia.

Entradas: nasadem_zona_piloto.tif (Earth Engine), parcelas_base.geojson (B1), imerg_diaria.csv (A9b) o eto_diaria.csv (A1)
Salidas:
    relieve_parcelas.csv     id, pendiente_media_pct, aportacion_externa_ha, frac_depresion
    relieve_rutas.geojson    tramos (LineString) por donde se concentra el escurrimiento, con aporta_ha;
                             para animar «Simular tormenta». Debe pesar < 1 MB (kit A9, paso 3)
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
SUAVIZADO = 5                  # celdas de la media móvil para la pendiente, assumption [S]
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


def tormenta_p95():
    """Tormenta de referencia: P95 de los días con lluvia ≥ 1 mm. Usa GPM IMERG (imerg_diaria.csv) si está en la
    carpeta (kit A9, paso 4); si no, NASA POWER (eto_diaria.csv). Si están las dos, POWER queda como contraste."""
    def p95(ruta, fuente):
        try:
            filas = [r for r in csv.DictReader(open(ruta)) if r["lluvia_mm"] not in ("", None)]
        except FileNotFoundError:
            return None
        lluvias = [float(r["lluvia_mm"]) for r in filas if float(r["lluvia_mm"]) >= 1.0]
        if not lluvias:
            return None
        return {"mm": round(float(np.percentile(lluvias, 95)), 1),
                "definicion": "percentil 95 de los días con lluvia >= 1 mm", "fuente": fuente,
                "periodo": f"{filas[0]['fecha']} a {filas[-1]['fecha']}"}
    imerg = p95("imerg_diaria.csv", "NASA GPM IMERG V07 (NASA/GPM_L3/IMERG_V07), media sobre el rectángulo de la zona")
    power = p95("eto_diaria.csv", "NASA POWER PRECTOTCORR, punto de la zona piloto")
    if imerg and power:
        imerg["contraste"] = {"mm": power["mm"], "fuente": power["fuente"], "periodo": power["periodo"]}
    return imerg or power


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
        # NASADEM tiene ruido de ~1–3 m por celda: la pendiente se calcula sobre el DEM suavizado con una
        # media móvil de 5 × 5 celdas (~150 m) [S]; el relleno, D8 y la acumulación usan el DEM sin suavizar.
        k = SUAVIZADO
        zp = np.pad(z, k // 2, mode="edge")
        zs = sum(zp[a:a + z.shape[0], b:b + z.shape[1]] for a in range(k) for b in range(k)) / (k * k)
        gy, gx = np.gradient(zs, dy, dx)
        pendiente = np.hypot(gx, gy) * 100
        destino, acum = d8_y_acumulacion(lleno, dx, dy)

        parcelas = json.load(open("parcelas_base.geojson"))["features"]
        filas = []
        for f in parcelas:
            m = ~geometry_mask([f["geometry"]], out_shape=z.shape, transform=tr, all_touched=False)
            if not m.any():
                m = ~geometry_mask([f["geometry"]], out_shape=z.shape, transform=tr, all_touched=True)
            # Aportación externa: máximo flujo que entra a la parcela desde celdas de fuera.
            # Solo se revisa el anillo de 1 celda alrededor (las únicas que pueden drenar hacia dentro).
            externa = 0.0
            ii, jj = np.where(m)
            i0, i1 = max(ii.min() - 1, 0), min(ii.max() + 2, z.shape[0])
            j0, j1 = max(jj.min() - 1, 0), min(jj.max() + 2, z.shape[1])
            sub = m[i0:i1, j0:j1]
            anillo = np.zeros_like(sub)
            for di, dj in VECINOS:
                anillo |= np.roll(np.roll(sub, di, 0), dj, 1)
            anillo &= ~sub
            wi, wj = np.where(anillo)
            for i, j in zip(wi + i0, wj + j0):
                a, b = destino[i, j]
                if a >= 0 and m[a, b]:
                    externa = max(externa, acum[i, j])
            # Pendiente de la parcela: plano ajustado por mínimos cuadrados a sus celdas de NASADEM
            # (el ruido de celda a celda se promedia); si la parcela tiene < 6 celdas, media del DEM suavizado.
            pi, pj = np.where(m)
            if pi.size >= 6:
                A = np.c_[pj * dx, -pi * dy, np.ones(pi.size)]
                (ax, ay, _), *_ = np.linalg.lstsq(A, z[pi, pj], rcond=None)
                pend = float(np.hypot(ax, ay) * 100)
            else:
                pend = float(pendiente[m].mean())
            filas.append([f["properties"]["id"], round(pend, 3),
                          round(externa * celda_ha, 2), round(float((prof[m] > PROF_DEPRESION_M).mean()), 3)])

        # Rutas: celdas con acumulación ≥ umbral, encadenadas aguas abajo en polilíneas (de cabecera o
        # confluencia a la siguiente confluencia) y simplificadas a media celda. Cada línea lleva el área de
        # aportación al final del tramo (aporta_ha), útil para el grosor y el orden de la animación.
        from shapely.geometry import LineString
        umbral_celdas = UMBRAL_RUTA_HA / celda_ha
        ruta = acum >= umbral_celdas
        entradas = np.zeros(z.shape, dtype=int)
        for i, j in zip(*np.where(ruta)):
            a, b = destino[i, j]
            if a >= 0:
                entradas[a, b] += 1
        centro = lambda r, c: (tr.c + (c + 0.5) * tr.a, tr.f + (r + 0.5) * tr.e)
        lineas, n_seg = [], 0
        for i, j in zip(*np.where(ruta)):
            if entradas[i, j] == 1:
                continue                                # celda intermedia: la recorre el tramo que viene de arriba
            pts, (a, b), fin = [centro(i, j)], destino[i, j], (i, j)
            while a >= 0:
                pts.append(centro(a, b))
                fin = (a, b)
                if entradas[a, b] != 1:
                    break                               # confluencia: ahí empieza otro tramo
                a, b = destino[a, b]
            if len(pts) < 2:
                continue
            n_seg += len(pts) - 1
            g = LineString(pts).simplify(abs(tr.a) / 2)
            lineas.append({"type": "Feature",
                           "properties": {"aporta_ha": round(float(acum[fin]) * celda_ha, 1)},
                           "geometry": {"type": "LineString",
                                        "coordinates": [[round(x, 5), round(y, 5)] for x, y in g.coords]}})

    with open("relieve_parcelas.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "pendiente_media_pct", "aportacion_externa_ha", "frac_depresion"])
        w.writerows(filas)
    json.dump({"type": "FeatureCollection", "features": lineas}, open("relieve_rutas.geojson", "w"))
    json.dump({"rotulo": "regional, 30 m (NASADEM); not field drainage design",
               "umbral_ruta_ha": UMBRAL_RUTA_HA, "umbral_ruta_etiqueta": "assumption [S]",
               "pendiente": "por parcela: plano ajustado por mínimos cuadrados a las celdas de NASADEM; zona: DEM suavizado 5 × 5 celdas (~150 m) [S]", "celda_ha": round(celda_ha, 4),
               "tormenta": tormenta_p95()}, open("relieve_meta.json", "w"), ensure_ascii=False, indent=1)
    registrar_fuentes("A9", ["relieve_parcelas.csv", "relieve_rutas.geojson", "relieve_meta.json"],
                      "NASADEM (NASA/NASADEM_HGT/001) vía Google Earth Engine; tormenta de GPM IMERG V07 (o NASA POWER si falta)",
                      "datos/colab/A9_relieve.py")
    print(f"Parcelas: {len(filas)} · rutas: {len(lineas)} tramos ({n_seg} segmentos de celda) · "
          f"pendiente media de la zona: {pendiente.mean():.2f} %")


if __name__ == "__main__":
    main()
