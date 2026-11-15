# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A2 · Heladas por fecha con NASA POWER (kit v4, pieza A2).

Entrada: eto_diaria.csv (A1; columna tmin, °C, T2M_MIN de POWER)
Salida:  heladas.json  {"ultima_primavera": {p10, p50, p90}, "primera_otono": {…},
                        "prob_helada_despues_de": {"MM-DD": prob}, "fuente": "…"}  (+ detalle y, si se pide, otras zonas)
Uso: python A2_heladas.py --dir <carpeta de la zona base> [--otra lazaro_cardenas=<carpeta>]

Definiciones (kit A2):
- Helada = Tmin ≤ 0 °C.
- Año completo: los 365/366 días con tmin (el año en curso no entra).
- Última helada de primavera: último día con helada entre el 1-ene y el 30-jun. Primera de otoño: primer día con helada
  entre el 1-jul y el 31-dic. Un año sin helada en el semestre no entra en los percentiles de ese semestre; se cuenta aparte.
- Percentiles 10, 50 y 90 del día del año; se escriben como MM-DD (calendario de año no bisiesto) y como día del año.
- Probabilidad de helada después de una fecha de siembra: fracción de los años completos con al menos una helada desde esa
  fecha (incluida) hasta el 30-jun. Fechas del 1-feb al 15-abr, cada 7 días.
POWER es una celda regional (MERRA-2, ~0.5° × 0.625°), no una estación: las noches frías locales pueden ser más frías que la
celda. La comparación con la estación 8044 Delicias (paso 3 del kit) solo se hace si existe data/raw/smn/.
"""
import csv
import datetime as dt
import json
import os

import numpy as np

from comun import carpeta, registrar_fuentes

UMBRAL_C = 0.0
REF = 2023                                             # año no bisiesto para escribir MM-DD


def mmdd(doy):
    return (dt.date(REF, 1, 1) + dt.timedelta(days=int(round(doy)) - 1)).strftime("%m-%d")


def calcular(ruta):
    por_anio = {}
    for r in csv.DictReader(open(ruta)):
        if r["tmin"] in ("", None):
            continue
        f = dt.date.fromisoformat(r["fecha"])
        por_anio.setdefault(f.year, {})[f] = float(r["tmin"])
    completos = sorted(y for y, d in por_anio.items() if len(d) == (366 if y % 4 == 0 and (y % 100 or y % 400 == 0) else 365))
    ultimas, primeras = [], []
    for y in completos:
        hel = sorted(f for f, t in por_anio[y].items() if t <= UMBRAL_C)
        prim = [f for f in hel if f.month <= 6]
        oto = [f for f in hel if f.month >= 7]
        if prim:
            ultimas.append(prim[-1].timetuple().tm_yday)
        if oto:
            primeras.append(oto[0].timetuple().tm_yday)

    def bloque(doys):
        p = np.percentile(doys, [10, 50, 90])
        return {"p10": mmdd(p[0]), "p50": mmdd(p[1]), "p90": mmdd(p[2]),
                "dia_del_anio": {"p10": round(float(p[0]), 1), "p50": round(float(p[1]), 1), "p90": round(float(p[2]), 1)},
                "anios_con_helada": len(doys), "anios_sin_helada": len(completos) - len(doys)}

    prob = {}
    f = dt.date(REF, 2, 1)
    while f <= dt.date(REF, 4, 15):
        n = 0
        for y in completos:
            desde, hasta = dt.date(y, f.month, f.day), dt.date(y, 6, 30)
            n += any(t <= UMBRAL_C for d, t in por_anio[y].items() if desde <= d <= hasta)
        prob[f.strftime("%m-%d")] = round(n / len(completos), 3)
        f += dt.timedelta(days=7)
    return {"ultima_primavera": bloque(ultimas), "primera_otono": bloque(primeras), "prob_helada_despues_de": prob,
            "anios": {"primero": completos[0], "ultimo": completos[-1], "n": len(completos)}}


def main():
    a = carpeta("A2: heladas por fecha", lambda ap: ap.add_argument(
        "--otra", action="append", default=[], help="zona=carpeta con su eto_diaria.csv (se agrega en «zonas»)"))
    out = calcular("eto_diaria.csv")
    out["definicion"] = {"helada": "Tmin <= 0 °C", "ultima_primavera": "last frost day, Jan 1 – Jun 30",
                         "primera_otono": "first frost day, Jul 1 – Dec 31",
                         "prob_helada_despues_de": "share of complete years with at least one frost from that date (included) to Jun 30",
                         "percentiles": "of the day of year, over the years with frost in that half-year"}
    out["estacion_smn"] = ("not run: no station file in data/raw/smn/ (kit A2, step 3)"
                           if not os.path.isdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "data", "raw", "smn"))
                           else "pending")
    out["nota"] = "NASA POWER is a regional grid cell (MERRA-2, about 0.5° x 0.625°), not a weather station; local frost can be more frequent."
    y = out["anios"]
    out["fuente"] = f"NASA POWER Daily API (community=AG), T2M_MIN, {y['primero']}–{y['ultimo']} ({y['n']} complete years)"
    if a.otra:
        out["zonas"] = {}
        for par in a.otra:
            z, ruta = par.split("=", 1)
            out["zonas"][z] = calcular(os.path.join(ruta, "eto_diaria.csv"))
    json.dump(out, open("heladas.json", "w"), ensure_ascii=False, indent=1)
    registrar_fuentes("A2", ["heladas.json"], out["fuente"] + "; helada = Tmin ≤ 0 °C; zona base delicias_saucillo"
                      + (" y bloque «zonas» con " + ", ".join(p.split("=")[0] for p in a.otra) if a.otra else ""),
                      "datos/colab/A2_heladas.py")
    for nombre, b in [("base", out)] + list(out.get("zonas", {}).items()):
        print(nombre, "última de primavera", b["ultima_primavera"]["p10"], b["ultima_primavera"]["p50"], b["ultima_primavera"]["p90"],
              "· primera de otoño", b["primera_otono"]["p10"], b["primera_otono"]["p50"], b["primera_otono"]["p90"],
              "· sin helada (prim/otoño):", b["ultima_primavera"]["anios_sin_helada"], b["primera_otono"]["anios_sin_helada"],
              "· prob 02-01 → 04-12:", b["prob_helada_despues_de"]["02-01"], b["prob_helada_despues_de"]["04-12"])


if __name__ == "__main__":
    main()
