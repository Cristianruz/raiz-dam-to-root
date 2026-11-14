# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A3 y A3-M · Estadísticas por parcela a partir de las exportaciones de Earth Engine.

Uso: python A3_parcelas_hls.py --dir data/processed
Entradas (en --dir):
    parcelas_base.geojson                    (B1)
    hls_mensual_2025_10_a_2026_09.tif        (Earth Engine; bandas AAAA_MM_{ndvi,lswi,bsi,n})
    hls_ndvi_memoria_AAAA.tif                (Earth Engine; un archivo por año agrícola, bandas AAAA_MM_ndvi)
    eto_diaria.csv                           (A1; opcional, para el viento)
    supuestos.json                           (umbrales con fuente y etiqueta)
Salidas (columnas del kit 40, tabla 0.4-B, más la memoria):
    hls_mensual_parcelas.csv   id, mes, banda, mediana, p25, p75, n_validos
    suelo_desnudo.csv          id, dias_suelo_desnudo_feb_abr, dias_desnudo_viento_alto, ndvi_ultimo_mes, meses_validos
    memoria_parcelas.csv       id, anio_agricola, estado, meses_verdes, max_verano, max_invierno, meses_validos
    fuentes_A3.csv             archivo | fuente | fecha | script | sha256
Índices guardados por Earth Engine × 10,000 en Int16; −32768 = sin dato.
Reglas de la memoria (S9 §5 y revisión del 14-nov):
    sin_dato   si hay menos de 8 meses válidos o la ventana de verano (jun–sep) o de invierno (dic–mar) está vacía;
    perenne    si el año y el anterior O el siguiente tienen 8 meses o más con NDVI ≥ umbral verde;
    doble / verano / invierno / descanso según el máximo de NDVI en cada ventana.
"""
import csv
import datetime as dt
import glob
import json
import re

import numpy as np
import rasterio
from rasterio.features import geometry_mask

from comun import carpeta, registrar_fuentes

SIN_DATO = -32768
ESCALA = 10000.0
VERANO, INVIERNO = (6, 7, 8, 9), (12, 1, 2, 3)


def supuesto(s, clave):
    if clave not in s:
        raise SystemExit(f"Falta '{clave}' en supuestos.json: se detiene el cálculo (no se usa un valor de memoria).")
    return s[clave]["valor"]


def nombres_bandas(src):
    d = list(src.descriptions)
    if not all(d):
        raise SystemExit(f"{src.name} no trae nombres de banda; revisa la exportación de Earth Engine.")
    return d


def pixeles(src, geom):
    m = ~geometry_mask([geom], out_shape=(src.height, src.width), transform=src.transform)
    if not m.any():
        m = ~geometry_mask([geom], out_shape=(src.height, src.width), transform=src.transform, all_touched=True)
    return m


def estadisticas(valores):
    v = valores[valores != SIN_DATO].astype(float) / ESCALA
    if v.size == 0:
        return None
    return float(np.median(v)), float(np.percentile(v, 25)), float(np.percentile(v, 75)), int(v.size)


def interp_diaria(meses_valor, ini, fin):
    pts = sorted((dt.date(a, m, 15).toordinal(), v) for (a, m), v in meses_valor.items() if v is not None)
    if len(pts) < 2:
        return {}
    xs, ys = zip(*pts)
    dias = list(range(ini.toordinal(), fin.toordinal() + 1))
    return {dt.date.fromordinal(d): float(v) for d, v in zip(dias, np.interp(dias, xs, ys))}


def viento_alto_por_dia(ruta="eto_diaria.csv"):
    """Días del 1-feb al 30-abr de 2026 con ws2m ≥ P75 de feb–abr 1981–2025 (assumption [S])."""
    try:
        filas = list(csv.DictReader(open(ruta)))
    except FileNotFoundError:
        return None
    hist = [float(r["ws2m"]) for r in filas if r["fecha"][5:7] in ("02", "03", "04") and r["fecha"][:4] < "2026"]
    if not hist:
        return None
    p75 = float(np.percentile(hist, 75))
    return {dt.date.fromisoformat(r["fecha"]) for r in filas
            if r["fecha"][:4] == "2026" and r["fecha"][5:7] in ("02", "03", "04") and float(r["ws2m"]) >= p75}


def resumen_anio(ndvi_mes, verde):
    validos = {m: v for m, v in ndvi_mes.items() if v is not None}
    ver = [validos[m] for m in VERANO if m in validos]
    inv = [validos[m] for m in INVIERNO if m in validos]
    return {"validos": len(validos), "verdes": sum(1 for v in validos.values() if v >= verde),
            "max_ver": max(ver) if ver else None, "max_inv": max(inv) if inv else None}


def clasificar(res, previo, siguiente, verde):
    if res["validos"] < 8 or res["max_ver"] is None or res["max_inv"] is None:
        return "sin_dato"
    vecino_verde = any(x is not None and x["validos"] >= 8 and x["verdes"] >= 8 for x in (previo, siguiente))
    if res["verdes"] >= 8 and vecino_verde:
        return "perenne"
    v_ok, i_ok = res["max_ver"] >= verde, res["max_inv"] >= verde
    return "doble" if (v_ok and i_ok) else "verano" if v_ok else "invierno" if i_ok else "descanso"


def main():
    carpeta("A3 y A3-M: estadísticas HLS por parcela")
    s = json.load(open("supuestos.json"))
    verde = supuesto(s, "umbral_verde_ndvi")
    desnudo = supuesto(s, "umbral_desnudo_ndvi")
    parcelas = json.load(open("parcelas_base.geojson"))["features"]

    # --- A3: año agrícola 2026 ---
    filas_mes, filas_desnudo = [], []
    viento = viento_alto_por_dia()
    with rasterio.open("hls_mensual_2025_10_a_2026_09.tif") as src:
        nombres = nombres_bandas(src)
        datos = src.read()
        for f in parcelas:
            pid = f["properties"]["id"]
            m = pixeles(src, f["geometry"])
            ndvi_mes, meses_validos = {}, 0
            for b, nom in enumerate(nombres):
                anio, mes, banda = nom.split("_")
                if banda == "n":
                    continue
                st = estadisticas(datos[b][m])
                n_val = int(np.median(datos[nombres.index(f"{anio}_{mes}_n")][m]))
                clave = (int(anio), int(mes))
                if st is None:
                    if banda == "ndvi":
                        ndvi_mes[clave] = None
                    continue
                med, p25, p75, _ = st
                filas_mes.append([pid, f"{anio}-{mes}", banda, round(med, 4), round(p25, 4), round(p75, 4), n_val])
                if banda == "ndvi":
                    ndvi_mes[clave] = med
                    meses_validos += 1
            diario = interp_diaria(ndvi_mes, dt.date(2026, 2, 1), dt.date(2026, 4, 30))
            desn = {d for d, v in diario.items() if v < desnudo}
            ultimo = next((ndvi_mes[k] for k in sorted(ndvi_mes, reverse=True) if ndvi_mes[k] is not None), None)
            filas_desnudo.append([pid, len(desn) if diario else None,
                                  len(desn & viento) if (diario and viento is not None) else None,
                                  None if ultimo is None else round(ultimo, 4), meses_validos])

    with open("hls_mensual_parcelas.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "mes", "banda", "mediana", "p25", "p75", "n_validos"])
        w.writerows(filas_mes)
    with open("suelo_desnudo.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "dias_suelo_desnudo_feb_abr", "dias_desnudo_viento_alto", "ndvi_ultimo_mes", "meses_validos"])
        w.writerows(filas_desnudo)

    # --- A3-M: memoria (un archivo por año agrícola) ---
    archivos = sorted(glob.glob("hls_ndvi_memoria_*.tif"))
    resumen = {}                                   # (id, año agrícola) -> resumen
    for ruta in archivos:
        ag = int(re.search(r"(\d{4})\.tif$", ruta).group(1))
        with rasterio.open(ruta) as src:
            nombres = nombres_bandas(src)
            datos = src.read()
            for f in parcelas:
                pid = f["properties"]["id"]
                m = pixeles(src, f["geometry"])
                ndvi_mes = {}
                for b, nom in enumerate(nombres):
                    st = estadisticas(datos[b][m])
                    ndvi_mes[int(nom[5:7])] = None if st is None else st[0]
                resumen[(pid, ag)] = resumen_anio(ndvi_mes, verde)
    filas_mem = []
    for (pid, ag), res in sorted(resumen.items()):
        estado = clasificar(res, resumen.get((pid, ag - 1)), resumen.get((pid, ag + 1)), verde)
        filas_mem.append([pid, ag, estado, res["verdes"],
                          None if res["max_ver"] is None else round(res["max_ver"], 3),
                          None if res["max_inv"] is None else round(res["max_inv"], 3), res["validos"]])
    with open("memoria_parcelas.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "anio_agricola", "estado", "meses_verdes", "max_verano", "max_invierno", "meses_validos"])
        w.writerows(filas_mem)

    registrar_fuentes("A3", ["hls_mensual_parcelas.csv", "suelo_desnudo.csv", "memoria_parcelas.csv"],
                      "NASA HLS v2 (HLSL30/HLSS30 v002) vía Google Earth Engine, proyecto iondroplet",
                      "datos/colab/A3_parcelas_hls.py")
    con8 = sum(1 for r in filas_desnudo if r[4] >= 8)
    print(f"Parcelas: {len(parcelas)} · filas mensuales: {len(filas_mes)} · años de memoria: {len(archivos)}")
    print(f"Parcelas con >= 8 meses válidos: {con8} de {len(parcelas)} (meta >= 80 %)")


if __name__ == "__main__":
    main()
