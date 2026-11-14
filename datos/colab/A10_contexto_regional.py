# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A10 · Contexto regional de las bases del reto: series mensuales por zona piloto (decisión del 14-nov, 15:30).

Entrada: data/raw/reto/ctx_*.csv, exportados con datos/earthengine/contexto_regional.js (Earth Engine, proyecto iondroplet):
    promedio sobre el rectángulo de cada zona, ponderado por la fracción de cada celda que cae dentro, en la malla nativa
    de cada producto. Columnas: zona, mes, <bandas>, n (celdas válidas con centro dentro), n_img (imágenes del mes).
Salida:  contexto_regional.csv  (zona, fuente, variable, mes, valor, unidad, resolucion_m, n_celdas)
Uso:     python A10_contexto_regional.py --dir <carpeta de salida> --crudo data/raw/reto

Son series REGIONALES: describen la zona o la cuenca, nunca una parcela. No entran al cálculo del agua de la parcela.
Reglas:
- Un mes solo se escribe si el producto trae al menos el 90 % de las imágenes que le corresponden (meses incompletos, como
  el mes en curso, se omiten). En los compuestos de MODIS basta un compuesto que empiece en el mes.
- n_celdas: en las mallas geográficas gruesas (SMAP, GRACE, GLDAS, NLDAS, ERA5-Land), celdas del producto que tocan el
  rectángulo de la zona; en MODIS, celdas válidas con centro dentro del rectángulo ese mes.
- resolucion_m: tamaño nominal de la celda de la malla en que se distribuye el producto.
"""
import calendar
import csv
import glob
import math
import os

from comun import carpeta, registrar_fuentes

ZONAS = {"delicias_saucillo": (-105.56, 28.07, -105.32, 28.19), "lazaro_cardenas": (-105.66, 28.35, -105.56, 28.43)}

# Mallas geográficas (transformación de la proyección en Earth Engine): x0, dx, y0 (norte), dy
MALLAS = {
    "smap": (-180.0, 0.09516256938937351, 85.0445018795655, 0.09516149300142858),
    "grace": (-180.0, 0.5, 90.0, 0.5),
    "gldas": (-180.0, 0.25, 90.0, 0.25),
    "nldas": (-125.0005, 0.125, 53.0005, 0.125),
    "era5_land": (-180.05, 0.1, 90.05, 0.1),
}
RESOLUCION_M = {"smap": 9000, "modis_ndvi": 250, "modis_et": 500, "modis_lst": 1000, "grace": 55660, "gldas": 27830,
                "nldas": 13915, "era5_land": 11132}


def celdas_que_tocan(fuente, bbox):
    x0, dx, y0, dy = MALLAS[fuente]
    o, s, e, n = bbox
    nx = math.floor((e - x0) / dx - 1e-9) - math.floor((o - x0) / dx + 1e-9) + 1
    ny = math.floor((y0 - s) / dy - 1e-9) - math.floor((y0 - n) / dy + 1e-9) + 1
    return nx * ny


def leer(crudo, patron):
    filas = []
    for ruta in sorted(glob.glob(os.path.join(crudo, patron))):
        filas.extend(csv.DictReader(open(ruta)))
    if not filas:
        raise SystemExit(f"Falta el crudo {patron} en {crudo}")
    return filas


def num(x):
    return None if x in ("", None, "null", "None") else float(x)


def dias_mes(mes):
    y, m = map(int, mes.split("-"))
    return calendar.monthrange(y, m)[1]


def main():
    a = carpeta("A10: contexto regional", lambda ap: ap.add_argument("--crudo", required=True))
    out, omitidos = [], {}

    def agregar(fuente, variable, unidad, res, filas, banda, por_dia_esperadas, conv=lambda v, mes: v, malla=None, dec=4):
        for r in filas:
            v, mes, z = num(r.get(banda)), r["mes"], r["zona"]
            n_img = int(float(r["n_img"])) if r.get("n_img") not in ("", None) else 0
            esperadas = por_dia_esperadas * dias_mes(mes) if por_dia_esperadas else 1
            if v is None or n_img < 0.9 * esperadas:
                omitidos[(fuente, variable)] = omitidos.get((fuente, variable), 0) + 1
                continue
            n_celdas = celdas_que_tocan(malla, ZONAS[z]) if malla else int(float(r["n"]))
            out.append([z, fuente, variable, mes, round(conv(v, mes), dec), unidad, res, n_celdas])

    smap = leer(a.crudo, "ctx_smap*.csv")
    agregar("smap", "humedad_superficial", "m3/m3", RESOLUCION_M["smap"], smap, "sm_surface", 8, malla="smap")
    agregar("smap", "humedad_raiz", "m3/m3", RESOLUCION_M["smap"], smap, "sm_rootzone", 8, malla="smap")
    agregar("modis", "ndvi", "adimensional", RESOLUCION_M["modis_ndvi"], leer(a.crudo, "ctx_modis_ndvi.csv"), "v", 0)
    agregar("modis", "et", "mm/mes", RESOLUCION_M["modis_et"], leer(a.crudo, "ctx_modis_et.csv"), "v", 0,
            conv=lambda v, mes: v * dias_mes(mes), dec=1)
    agregar("modis", "temp_superficie_dia", "°C", RESOLUCION_M["modis_lst"], leer(a.crudo, "ctx_modis_lst.csv"), "v", 0, dec=2)
    agregar("grace", "agua_almacenada_anomalia", "cm", RESOLUCION_M["grace"], leer(a.crudo, "ctx_grace.csv"), "lwe_thickness", 0,
            malla="grace", dec=2)
    gldas = leer(a.crudo, "ctx_gldas*.csv")
    agregar("gldas", "et", "mm/mes", RESOLUCION_M["gldas"], gldas, "Evap_tavg", 8,
            conv=lambda v, mes: v * 86400 * dias_mes(mes), malla="gldas", dec=1)
    agregar("gldas", "humedad_raiz", "kg/m2", RESOLUCION_M["gldas"], gldas, "RootMoist_inst", 8, malla="gldas", dec=1)
    nldas = leer(a.crudo, "ctx_nldas*.csv")
    agregar("nldas", "lluvia", "mm/mes", RESOLUCION_M["nldas"], nldas, "total_precipitation", 24, malla="nldas", dec=1)
    agregar("nldas", "evaporacion_potencial", "mm/mes", RESOLUCION_M["nldas"], nldas, "potential_evaporation", 24, malla="nldas", dec=1)
    agregar("era5_land", "tmin_media", "°C", RESOLUCION_M["era5_land"], leer(a.crudo, "ctx_era5_tmin.csv"), "v", 1,
            malla="era5_land", dec=2)
    agregar("era5_land", "dias_helada", "dias", RESOLUCION_M["era5_land"], leer(a.crudo, "ctx_era5_heladas.csv"), "v", 1,
            malla="era5_land", dec=1)

    out.sort(key=lambda r: (r[0], r[1], r[2], r[3]))
    llaves = {tuple(r[:4]) for r in out}
    if len(llaves) != len(out):
        raise SystemExit("Llave repetida (zona, fuente, variable, mes)")
    with open("contexto_regional.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["zona", "fuente", "variable", "mes", "valor", "unidad", "resolucion_m", "n_celdas"])
        w.writerows(out)
    registrar_fuentes("A10", ["contexto_regional.csv"],
                      "Earth Engine (proyecto iondroplet), promedio mensual sobre el rectángulo de cada zona: "
                      "smap = NASA/SMAP/SPL4SMGP/008 (SMAP L4 v8, sm_surface y sm_rootzone); "
                      "modis = MODIS/061/MOD13Q1 (NDVI, SummaryQA 0–1), MODIS/061/MOD16A2GF (ET) y MODIS/061/MOD11A2 (LST_Day_1km), colección 6.1; "
                      "grace = NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI (JPL RL06.x mascon con CRI, lwe_thickness; malla de 0.5° sobre mascons de 3°); "
                      "gldas = NASA/GLDAS/V021/NOAH/G025/T3H (GLDAS-2.1 Noah, Evap_tavg y RootMoist_inst); "
                      "nldas = NASA/NLDAS/FORA0125_H002 (NLDAS-2 forzamiento, total_precipitation y potential_evaporation); "
                      "era5_land = ECMWF/ERA5_LAND/DAILY_AGGR (temperature_2m_min; ECMWF/Copernicus, no es un producto de NASA). "
                      "Periodo por serie: desde 2000-01 o el inicio del producto hasta el último mes completo (en el archivo)",
                      "datos/earthengine/contexto_regional.js + datos/colab/A10_contexto_regional.py")
    resumen = {}
    for r in out:
        k = (r[1], r[2], r[0])
        d = resumen.setdefault(k, [r[3], r[3], 0, r[7]])
        d[1], d[2] = r[3], d[2] + 1
    for k in sorted(resumen):
        d = resumen[k]
        print(f"{k[0]:10s} {k[1]:26s} {k[2]:18s} {d[0]} a {d[1]} · {d[2]} meses · n_celdas {d[3]}")
    print("Meses omitidos (sin dato o incompletos):", {f"{k[0]}/{k[1]}": v for k, v in omitidos.items()})


if __name__ == "__main__":
    main()
