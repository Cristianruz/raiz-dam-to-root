# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A3 y A3-M · Estadísticas por parcela a partir de las exportaciones de Earth Engine.

Entradas (en la carpeta de trabajo):
    parcelas_base.geojson                          (B1)
    hls_mensual_2025_10_a_2026_09.tif              (Earth Engine; bandas AAAA_MM_{ndvi,lswi,bsi,n})
    hls_ndvi_memoria_2015_10_a_2026_09.tif         (Earth Engine; bandas AAAA_MM_ndvi)
    eto_diaria.csv                                 (A1; opcional, para el viento)
Salidas (columnas del kit 40, tabla 0.4-B):
    hls_mensual_parcelas.csv   id, mes, banda, mediana, p25, p75, n_validos
    suelo_desnudo.csv          id, dias_suelo_desnudo_feb_abr, dias_desnudo_viento_alto, ndvi_ultimo_mes, meses_validos
    memoria_parcelas.csv       id, anio_agricola, estado, meses_verdes, max_verano, max_invierno, meses_validos
Valores de índices: Earth Engine los guarda × 10,000 en Int16; −32768 = sin dato.

Uso: pip install rasterio shapely numpy ; python A3_parcelas_hls.py
"""
import csv
import datetime as dt
import json

import numpy as np
import rasterio
from rasterio.features import geometry_mask

SIN_DATO = -32768
ESCALA = 10000.0
UMBRAL_VERDE = 0.40      # [S] reglas de la memoria; sensibilidad 0.35–0.45 (S9 §5)
UMBRAL_DESNUDO = 0.20    # [S] kit A3: NDVI < 0.2 = suelo desnudo
MIN_PIXELES = 1


def nombres_bandas(src):
    d = list(src.descriptions)
    if not all(d):
        raise SystemExit("El GeoTIFF no trae nombres de banda; revisa la exportación de Earth Engine.")
    return d


def pixeles(src, geom):
    """Índices de los píxeles cuyo centro cae en la parcela (o los que toca, si es muy chica)."""
    m = ~geometry_mask([geom], out_shape=(src.height, src.width), transform=src.transform)
    if m.sum() < MIN_PIXELES:
        m = ~geometry_mask([geom], out_shape=(src.height, src.width),
                           transform=src.transform, all_touched=True)
    return m


def estadisticas(valores):
    v = valores[valores != SIN_DATO].astype(float) / ESCALA
    if v.size == 0:
        return None
    return float(np.median(v)), float(np.percentile(v, 25)), float(np.percentile(v, 75)), int(v.size)


def interp_diaria(meses_valor, ini, fin):
    """NDVI diario interpolado entre los centros de mes (día 15)."""
    pts = sorted((dt.date(a, m, 15).toordinal(), v) for (a, m), v in meses_valor.items() if v is not None)
    if len(pts) < 2:
        return {}
    xs, ys = zip(*pts)
    dias = range(ini.toordinal(), fin.toordinal() + 1)
    vals = np.interp(list(dias), xs, ys)
    return {dt.date.fromordinal(d): float(v) for d, v in zip(dias, vals)}


def viento_alto_por_dia(ruta="eto_diaria.csv"):
    """Días del 1-feb al 30-abr de 2026 con viento ≥ percentil 75 de esa ventana en la serie 1981–2025 [S]."""
    try:
        filas = list(csv.DictReader(open(ruta)))
    except FileNotFoundError:
        return None
    hist = [float(r["ws2m"]) for r in filas
            if r["fecha"][5:7] in ("02", "03", "04") and r["fecha"][:4] < "2026"]
    if not hist:
        return None
    p75 = float(np.percentile(hist, 75))
    return {dt.date.fromisoformat(r["fecha"]) for r in filas
            if r["fecha"].startswith("2026-0") and r["fecha"][5:7] in ("02", "03", "04")
            and float(r["ws2m"]) >= p75}


def clasificar_anio(ndvi_mes, ndvi_mes_previo):
    """Estado de un año agrícola (oct–sep) a partir de su NDVI mensual {mes: valor}."""
    validos = {m: v for m, v in ndvi_mes.items() if v is not None}
    if len(validos) < 6:
        return "sin_dato", 0, None, None, len(validos)
    verdes = sum(1 for v in validos.values() if v >= UMBRAL_VERDE)
    verano = max((validos[m] for m in (6, 7, 8, 9) if m in validos), default=None)
    invierno = max((validos[m] for m in (12, 1, 2, 3) if m in validos), default=None)
    prev_verdes = sum(1 for v in ndvi_mes_previo.values() if v is not None and v >= UMBRAL_VERDE)
    if verdes >= 8 and prev_verdes >= 8:
        estado = "perenne"
    else:
        v_ok = verano is not None and verano >= UMBRAL_VERDE
        i_ok = invierno is not None and invierno >= UMBRAL_VERDE
        estado = "doble" if (v_ok and i_ok) else "verano" if v_ok else "invierno" if i_ok else "descanso"
    return estado, verdes, verano, invierno, len(validos)


def main():
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
                n_val = int(np.median(datos[nombres.index(f"{anio}_{mes}_n")][m])) if m.any() else 0
                if st is None:
                    if banda == "ndvi":
                        ndvi_mes[(int(anio), int(mes))] = None
                    continue
                med, p25, p75, _ = st
                filas_mes.append([pid, f"{anio}-{mes}", banda, round(med, 4), round(p25, 4), round(p75, 4), n_val])
                if banda == "ndvi":
                    ndvi_mes[(int(anio), int(mes))] = med
                    meses_validos += 1
            diario = interp_diaria(ndvi_mes, dt.date(2026, 2, 1), dt.date(2026, 4, 30))
            desnudos = {d for d, v in diario.items() if v < UMBRAL_DESNUDO}
            ultimo = next((ndvi_mes[k] for k in sorted(ndvi_mes, reverse=True) if ndvi_mes[k] is not None), None)
            filas_desnudo.append([
                pid,
                len(desnudos) if diario else None,
                (len(desnudos & viento) if (diario and viento is not None) else None),
                None if ultimo is None else round(ultimo, 4),
                meses_validos])

    with open("hls_mensual_parcelas.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "mes", "banda", "mediana", "p25", "p75", "n_validos"])
        w.writerows(filas_mes)
    with open("suelo_desnudo.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "dias_suelo_desnudo_feb_abr", "dias_desnudo_viento_alto", "ndvi_ultimo_mes", "meses_validos"])
        w.writerows(filas_desnudo)

    # --- A3-M: memoria de la parcela (años agrícolas 2016–2026) ---
    filas_mem = []
    with rasterio.open("hls_ndvi_memoria_2015_10_a_2026_09.tif") as src:
        nombres = nombres_bandas(src)
        datos = src.read()
        for f in parcelas:
            pid = f["properties"]["id"]
            m = pixeles(src, f["geometry"])
            por_anio = {}
            for b, nom in enumerate(nombres):
                anio, mes = int(nom[:4]), int(nom[5:7])
                ag = anio + 1 if mes >= 10 else anio            # año agrícola oct–sep
                st = estadisticas(datos[b][m])
                por_anio.setdefault(ag, {})[mes] = None if st is None else st[0]
            previo = {}
            for ag in sorted(por_anio):
                estado, verdes, ver, inv, nv = clasificar_anio(por_anio[ag], previo)
                filas_mem.append([pid, ag, estado, verdes,
                                  None if ver is None else round(ver, 3),
                                  None if inv is None else round(inv, 3), nv])
                previo = por_anio[ag]
    with open("memoria_parcelas.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "anio_agricola", "estado", "meses_verdes", "max_verano", "max_invierno", "meses_validos"])
        w.writerows(filas_mem)

    print(f"Parcelas: {len(parcelas)} · filas mensuales: {len(filas_mes)} · años de memoria: {len(filas_mem)}")
    con8 = sum(1 for r in filas_desnudo if r[4] >= 8)
    print(f"Parcelas con >= 8 meses válidos: {con8} de {len(parcelas)} (meta >= 80 %)")


if __name__ == "__main__":
    main()
