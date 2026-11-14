# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A6b · H1-b: forma estacional de la demanda frente a la salida de La Boquilla en ciclos anteriores (1999–2024).

Prueba nueva (post hoc), definida en docs/h1b_especificacion.md ANTES de correrla. No cambia el veredicto de H1.
Pregunta: de lo que sale de la presa en el ciclo (14-mar a 30-sep), ¿la fracción que ya salió al 14-jul se parece más a
la forma del modelo de demanda que a la lineal (L1) y a la curva de ETo (L1-s)?

Entradas (en --dir): eto_diaria.csv (A1), supuestos.json
         --conagua: dr005_superficies_volumenes_1998_2025.csv y dr005_cultivos_1998_2025.csv
         --sih: LBQCH.csv
Salidas: h1b_resultado.json, h1b_anios.csv, h1b_forma.png
La cadena del modelo es la de A6_backtest.py, sin cambios.
"""
import csv
import datetime as dt
import json
import math
import os
import statistics

import numpy as np

import A5_demanda_plazo as A5
import A6_backtest as A6
from comun import carpeta, registrar_fuentes

MIN_SALIDA_HM3 = 100.0
ANIOS = range(1999, 2025)


def anios_con_entrega(carpeta_conagua):
    out = set()
    for r in csv.DictReader(open(os.path.join(carpeta_conagua, "dr005_superficies_volumenes_1998_2025.csv"))):
        if float(r["sup_presas_ha"]) > 0 and float(r["vol_presas_miles_m3"]) > 0:
            out.add(int(r["anio"]))
    return out


def salida(serie, y, d0, d1):
    """Salida por obra de toma (hm³) entre dos fechas (mes, día), incluidas, y días con salida cero de abr a ago."""
    d, tot = dt.date(y, *d0), 0.0
    while d <= dt.date(y, *d1):
        v = serie[d].get("ObraToma(m3/s)")
        tot += (float(v) if v not in (None, "") else 0.0) * 0.0864
        d += dt.timedelta(days=1)
    return tot


def dias_cero(serie, y):
    d, n = dt.date(y, 4, 1), 0
    while d <= dt.date(y, 8, 31):
        v = serie[d].get("ObraToma(m3/s)")
        n += (float(v) if v not in (None, "") else 0.0) == 0.0
        d += dt.timedelta(days=1)
    return n


def main():
    a = carpeta("A6b: forma estacional en ciclos anteriores",
                lambda ap: (ap.add_argument("--conagua", required=True), ap.add_argument("--sih", required=True)))
    sup = json.load(open("supuestos.json"))
    A5.cargar_supuestos()
    eto_clim, lluvia_mes = A6.climatologia()
    serie = A6.sih(a.sih)
    con_entrega = anios_con_entrega(a.conagua)

    def formas(corte, fin):
        """Fracción al corte de cada forma. Devuelve (función patrón→F_mod, F_L1, F_L1s)."""
        fin_d = dt.date(2026, *fin)
        dias = [A6.INICIO + dt.timedelta(days=i) for i in range((fin_d - A6.INICIO).days + 1)]
        i = dias.index(dt.date(2026, *corte))
        base, eto, pe = A6.demanda_base(dias, eto_clim, lluvia_mes)
        cache = {}

        def f_mod(anio_patron):
            if anio_patron not in cache:
                frac, _ = A6.patron(a.conagua, anio_patron)
                acum = A6.correr(frac, 1.0, base, pe, dias, sup, np.random.default_rng(20261114))
                cache[anio_patron] = float(np.percentile(acum[:, i] / acum[:, -1], 50))
            return cache[anio_patron]
        return f_mod, (i + 1) / len(dias), float(np.cumsum(eto)[i] / eto.sum())

    def evaluar(corte=(7, 14), fin=(9, 30), mismo_anio=False, sin_ceros=False):
        f_mod, f_l1, f_l1s = formas(corte, fin)
        filas = []
        for y in ANIOS:
            total = salida(serie, y, (3, 14), fin)
            if salida(serie, y, (3, 14), (9, 30)) < MIN_SALIDA_HM3:        # regla de inclusión: siempre con el ciclo al 30-sep
                continue
            ceros = dias_cero(serie, y)
            if sin_ceros and ceros >= 10:
                continue
            previos = [p for p in con_entrega if p < y]
            ap = y if mismo_anio else max(previos)
            f_obs = salida(serie, y, (3, 14), corte) / total
            fm = f_mod(ap)
            e = {"modelo": abs(fm - f_obs) * 100, "L1-s": abs(f_l1s - f_obs) * 100, "L1": abs(f_l1 - f_obs) * 100}
            filas.append({"anio": y, "anio_patron": ap, "salida_ciclo_hm3": round(total, 1), "dias_cero_abr_ago": ceros,
                          "F_obs": round(f_obs, 4), "F_modelo": round(fm, 4), "F_L1s": round(f_l1s, 4), "F_L1": round(f_l1, 4),
                          "err_modelo_pp": round(e["modelo"], 2), "err_L1s_pp": round(e["L1-s"], 2), "err_L1_pp": round(e["L1"], 2),
                          "modelo_gana": bool(e["modelo"] < e["L1-s"] and e["modelo"] < e["L1"])})
        n, gana = len(filas), sum(f["modelo_gana"] for f in filas)
        med = {k: round(statistics.median(f[c] for f in filas), 2) for k, c in
               (("modelo", "err_modelo_pp"), ("L1-s", "err_L1s_pp"), ("L1", "err_L1_pp"))}
        cond1, cond2 = gana > n / 2, med["modelo"] < med["L1-s"] and med["modelo"] < med["L1"]
        p_signos = sum(math.comb(n, k) for k in range(gana, n + 1)) / 2 ** n      # descriptivo: P(X ≥ gana), p = 0.5
        return {"anios_evaluados": n, "anios_modelo_gana": gana, "mediana_error_pp": med,
                "condicion_1_mayoria": bool(cond1), "condicion_2_mediana": bool(cond2),
                "se_sostiene": bool(cond1 and cond2), "prueba_de_signos_descriptiva": round(p_signos, 4)}, filas

    principal, filas = evaluar()
    sens = {"patron_mismo_anio": evaluar(mismo_anio=True)[0], "corte_13_may": evaluar(corte=(5, 13))[0],
            "fin_31_oct": evaluar(fin=(10, 31))[0], "sin_anios_con_ceros": evaluar(sin_ceros=True)[0]}
    out = {"prueba": "H1-b (post hoc, especificada antes de correr en docs/h1b_especificacion.md); no cambia el veredicto de H1",
           "criterio": "más de la mitad de los años con error del modelo menor que L1-s y que L1, y mediana del error del modelo menor que las dos",
           "veredicto": "H1-b holds" if principal["se_sostiene"] else "H1-b does not hold",
           "principal": principal, "sensibilidad": sens, "corridas": A6.CORRIDAS, "climatologia": list(A6.CLIMA)}
    json.dump(out, open("h1b_resultado.json", "w"), ensure_ascii=False, indent=1)
    with open("h1b_anios.csv", "w", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(7.5, 3.6), dpi=150)
        x = [f["anio"] for f in filas]
        ax.plot(x, [f["F_obs"] * 100 for f in filas], "o-", color="#1F6FB2", label="Observed (La Boquilla outlet, SIH)")
        ax.plot(x, [f["F_modelo"] * 100 for f in filas], "s--", color="#4C9A2A", label="Crop-demand model shape")
        ax.plot(x, [f["F_L1s"] * 100 for f in filas], ":", color="#D98E04", label="ETo curve (L1-s)")
        ax.plot(x, [f["F_L1"] * 100 for f in filas], "-.", color="#8A5A3B", label="Linear (L1)")
        ax.set_ylabel("% of the season's outflow\nreleased by Jul 14", fontsize=8)
        ax.tick_params(labelsize=7)
        ax.legend(fontsize=6.5, frameon=False, ncol=2)
        ax.spines[["top", "right"]].set_visible(False)
        ax.set_title("Seasonal shape in past seasons (post hoc test H1-b; does not change H1)", fontsize=8.5, loc="left")
        fig.tight_layout()
        fig.savefig("h1b_forma.png")
    except ImportError:
        pass
    registrar_fuentes("A6b", ["h1b_resultado.json", "h1b_anios.csv", "h1b_forma.png"],
                      "SIH Conagua (La Boquilla, LBQCH, obra de toma diaria); Conagua, estadísticas agrícolas 1998–2025; NASA POWER 1991–2025",
                      "datos/colab/A6b_forma_historica.py")
    print(out["veredicto"], principal)
    for k, v in sens.items():
        print("  sensibilidad", k, v)


if __name__ == "__main__":
    main()
