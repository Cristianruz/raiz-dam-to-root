# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A6 · Back-test H1 del ciclo 2026 a escala de distrito (DR-005), según docs/h1_especificacion_operativa.md.

Con información disponible al 14-mar-2026, ¿la cadena de demanda estima la salida acumulada de La Boquilla mejor que
las líneas base L1 (lineal) y L1-s (estacional con ETo)? Criterio (sin cambios): en el punto principal (14-jul-2026),
|error modelo| < |error L1-s| y |error modelo| < |error L1|.

Entradas (en --dir): eto_diaria.csv (A1), supuestos.json, h1_verdad_sih.json (A6_verdad_sih.py)
         --conagua: carpeta con dr005_superficies_volumenes_1998_2025.csv y dr005_cultivos_1998_2025.csv
         --sih: LBQCH.csv
Salidas: h1_resultado.json, h1_series.csv (curvas diarias), h1_backtest.png
Todo lo que el preregistro dejó pendiente está fijado en docs/h1_especificacion_operativa.md, subido antes de correr.
"""
import csv
import datetime as dt
import io
import json
import os
import statistics

import numpy as np

import A5_demanda_plazo as A5
from comun import carpeta, registrar_fuentes

INICIO = dt.date(2026, 3, 14)
PUNTOS = {"secundario_13_may": dt.date(2026, 5, 13), "principal_14_jul": dt.date(2026, 7, 14)}
PRENSA = {"secundario_13_may": 228.86, "principal_14_jul": 447.65}
CORRIDAS = 10000
CLIMA = (1991, 2025)
EC = (0.470, 0.681)                       # eficiencia de conducción, IMTA (COMEII 2021) [V]
# Cultivos de la estadística de Conagua → cultivo del modelo; el resto recibe la media de las anuales modeladas
MAPA = {"Alfalfa": "alfalfa", "Nogal": "nogal", "Maíz Forrajero": "maiz_forrajero", "Chile": "chile", "Algodón": "algodon"}
ANUALES = ("maiz_forrajero", "chile", "algodon")


def climatologia(ruta="eto_diaria.csv"):
    """ETo media por día del año y lluvia media por mes (mm/mes), 1991–2025."""
    eto, lluvia_mes = {}, {}
    for r in csv.DictReader(open(ruta)):
        d = dt.date.fromisoformat(r["fecha"])
        if not CLIMA[0] <= d.year <= CLIMA[1]:
            continue
        eto.setdefault((d.month, d.day), []).append(float(r["eto_mm"]))
        lluvia_mes.setdefault((d.year, d.month), 0.0)
        lluvia_mes[(d.year, d.month)] += float(r["lluvia_mm"])
    eto = {k: sum(v) / len(v) for k, v in eto.items()}
    lm = {m: statistics.mean(v for (a, mm), v in lluvia_mes.items() if mm == m) for m in range(1, 13)}
    return eto, lm


def patron(carpeta_conagua, anio):
    """Fracción de la superficie por cultivo del modelo en el año agrícola dado (Conagua, por cultivo)."""
    sup = {}
    for r in csv.DictReader(open(os.path.join(carpeta_conagua, "dr005_cultivos_1998_2025.csv"))):
        if int(r["anio"]) == anio:
            c = next((v for k, v in MAPA.items() if r["cultivo"].startswith(k)), "otros")
            sup[c] = sup.get(c, 0.0) + float(r["sup_sembrada_ha"])
    tot = sum(sup.values())
    return {c: s / tot for c, s in sup.items()}, tot


def lamina_historica(carpeta_conagua):
    """Mediana de la lámina bruta (m) de la superficie regada con presas, años con entrega, 1998–2024."""
    l = []
    for r in csv.DictReader(open(os.path.join(carpeta_conagua, "dr005_superficies_volumenes_1998_2025.csv"))):
        s, v = float(r["sup_presas_ha"]), float(r["vol_presas_miles_m3"])
        if s > 0 and v > 0 and int(r["anio"]) <= 2024:
            l.append(v * 1000 / (s * 1e4))
    return statistics.median(l), len(l)


def sih(ruta):
    t = open(ruta, encoding="utf-8").read()
    t = t[t.index("Estacion,Fecha"):]
    return {dt.date.fromisoformat(r["Fecha"]): r for r in csv.DictReader(io.StringIO(t))}


def analogo(serie, fin_md):
    """Año (1998–2024, con entrega) con almacenamiento al 14-mar más cercano al de 2026 y su salida 14-mar → fin."""
    num = lambda r, k: None if r is None or r.get(k) in (None, "") else float(r[k])
    a26 = num(serie.get(INICIO), "VolumenAlm(Mm3)")
    cand = []
    for y in range(1998, 2025):
        a = num(serie.get(dt.date(y, 3, 14)), "VolumenAlm(Mm3)")
        d, tot = dt.date(y, 3, 14), 0.0
        while d <= dt.date(y, *fin_md):
            tot += (num(serie.get(d), "ObraToma(m3/s)") or 0.0) * 0.0864
            d += dt.timedelta(days=1)
        if a is not None and tot > 0:
            cand.append((abs(a - a26), y, a, tot))
    _, y, a, tot = min(cand)
    return {"anio": y, "almacenamiento_14_mar_hm3": a, "almacenamiento_2026_hm3": a26, "salida_hm3": round(tot, 1)}


def demanda_base(dias, eto_clim, lluvia_mes):
    """Por cultivo: ETc diaria sin sesgo (mm), Peff diaria (mm) y vector de presiembra (1 = fracción aplicada ese día)."""
    eto = np.array([eto_clim.get((d.month, d.day), eto_clim[(2, 28)]) for d in dias])
    dias_mes = {m: sum(1 for d in dias if d.month == m) for m in {d.month for d in dias}}
    import calendar
    pe = np.array([A5.peff(lluvia_mes[d.month]) / calendar.monthrange(d.year, d.month)[1] for d in dias])
    out = {}
    for c in ("alfalfa", "nogal") + ANUALES:
        k = A5.CULTIVOS[c]
        if "siembra" in k:
            m, dd = k["siembra"]
            curva = A5.kc_curva(c, dt.date(INICIO.year, m, dd), dias)
            siembra = dt.date(INICIO.year, m, dd)
        else:
            curva, siembra = A5.kc_curva(c, None, dias), None
        kc = np.array([curva.get(d, 0.0) for d in dias])
        pres = np.zeros(len(dias))
        if c in ANUALES:
            for n in range(1, 11):                           # presiembra en los 10 días previos a la siembra
                d = siembra - dt.timedelta(days=n)
                if d in dias:
                    pres[dias.index(d)] += 0.1
        out[c] = {"etc": kc * eto, "pres": pres, "con_cultivo": kc > 0}
    return out, eto, pe


def correr(frac, area_ha, base, pe, dias, sup, rng, n=CORRIDAS, parte_lb=600 / 650):
    """Monte Carlo: volumen diario acumulado en presa (hm³) atribuible a La Boquilla. Devuelve matriz n × días."""
    s0, s1 = sup["sesgo_eto"]["valor"]
    e0, e1 = sup["ea_gravedad"]["valor"]
    p0, p1 = sup["presiembra_mm"]["valor"]
    sesgo = rng.uniform(s0, s1, n)[:, None]
    ea = rng.uniform(e0, e1, n)[:, None]
    ec = rng.uniform(*EC, n)[:, None]
    pres = rng.uniform(p0, p1, n)[:, None]
    meses = np.array([d.month for d in dias])
    lam = {}
    for c, b in base.items():
        etc = b["etc"][None, :] * (1 + sesgo)                                  # n × días
        neta = np.zeros_like(etc)
        for m in np.unique(meses):
            idx = meses == m
            act = idx & b["con_cultivo"]
            if not act.any():
                continue
            e_mes = etc[:, act].sum(axis=1, keepdims=True)
            n_mes = np.maximum(e_mes - pe[act].sum(), 0.0)                      # neta mensual
            neta[:, act] = etc[:, act] / np.where(e_mes > 0, e_mes, 1) * n_mes  # repartida según la ETc diaria
        pf = sup["presiembra_algodon_mm"]["valor"] if c == "algodon" else None
        lam[c] = neta / ea + b["pres"][None, :] * (pf if pf is not None else pres)   # mm en parcela
    peso = {c: frac.get(c, 0.0) for c in ANUALES}
    media_anuales = sum(lam[c] * peso[c] for c in ANUALES) / max(sum(peso.values()), 1e-9)
    total = sum(lam[c] * frac.get(c, 0.0) for c in lam) + media_anuales * frac.get("otros", 0.0)   # mm medios
    vol = total * area_ha * 10 / 1e6 / ec * parte_lb                            # hm³ por día en presa
    return np.cumsum(vol, axis=1)


def main():
    def ops(ap):
        ap.add_argument("--conagua", required=True)
        ap.add_argument("--sih", required=True)
    a = carpeta("A6: back-test H1", ops)
    sup = json.load(open("supuestos.json"))
    A5.cargar_supuestos()
    verdad = json.load(open("h1_verdad_sih.json"))
    eto_clim, lluvia_mes = climatologia()
    serie = sih(a.sih)
    lam_med, n_lam = lamina_historica(a.conagua)

    def escenario(aut_lb=600.0, aut_total=650.0, fin=dt.date(2026, 9, 30), f_l1=1.00, anio_patron=2024, anclado=False):
        dias = [INICIO + dt.timedelta(days=i) for i in range((fin - INICIO).days + 1)]
        base, eto, pe = demanda_base(dias, eto_clim, lluvia_mes)
        frac, sup_patron = patron(a.conagua, anio_patron)
        area = aut_total * 1e6 / (lam_med * 1e4)
        acum = correr(frac, area, base, pe, dias, sup, np.random.default_rng(20261114), parte_lb=aut_lb / aut_total)
        total_l1 = aut_lb * f_l1
        if anclado:
            acum = acum / acum[:, -1:] * total_l1
        p10, p50, p90 = np.percentile(acum, [10, 50, 90], axis=0)
        l1 = total_l1 * (np.arange(len(dias)) + 1) / len(dias)
        l1s = total_l1 * np.cumsum(eto) / eto.sum()
        an = analogo(serie, (fin.month, fin.day))
        l2 = an["salida_hm3"] * np.cumsum(eto) / eto.sum()
        res = {"area_autorizada_ha": round(area), "patron": {k: round(v, 3) for k, v in frac.items()},
               "total_modelo_p50_hm3": round(float(p50[-1]), 1), "total_L1_hm3": total_l1, "L2_analogo": an, "puntos": {}}
        for nombre, d in PUNTOS.items():
            i = dias.index(d)
            est = {"modelo": float(p50[i]), "L1": float(l1[i]), "L1-s": float(l1s[i]), "L2": float(l2[i])}
            fila = {"modelo_p10": round(float(p10[i]), 1), "modelo_p50": round(est["modelo"], 1),
                    "modelo_p90": round(float(p90[i]), 1), "L1": round(est["L1"], 1), "L1-s": round(est["L1-s"], 1),
                    "L2": round(est["L2"], 1), "verdades": {}}
            for vn, v in (("prensa", PRENSA[nombre]), ("sih", verdad["puntos"][nombre]["salida_acumulada_hm3"])):
                err = {k: round(abs(x - v), 1) for k, x in est.items()}
                fila["verdades"][vn] = {"valor_hm3": v, "error_abs": err,
                                        "skill_vs": {k: round(1 - err["modelo"] / err[k], 2) for k in ("L1", "L1-s", "L2") if err[k] > 0},
                                        "dentro_p10_p90": bool(p10[i] <= v <= p90[i]),
                                        "cumple_criterio": bool(err["modelo"] < err["L1-s"] and err["modelo"] < err["L1"])}
            res["puntos"][nombre] = fila
        return res, dias, (p10, p50, p90, l1, l1s, l2)

    principal, dias, curvas = escenario()
    sens = {"autorizado_500": escenario(aut_lb=500.0)[0], "fraccion_L1_1.15": escenario(f_l1=529.14 / 460)[0],
            "fin_31_oct": escenario(fin=dt.date(2026, 10, 31))[0], "patron_2024_25": escenario(anio_patron=2025)[0],
            "patron_2016_17": escenario(anio_patron=2017)[0], "modelo_anclado": escenario(anclado=True)[0]}
    pp = principal["puntos"]["principal_14_jul"]["verdades"]["prensa"]
    salida = {"criterio": "|error modelo| < |error L1-s| y |error modelo| < |error L1| en el punto principal (14-jul-2026)",
              "verdad_usada": "447.65 hm³ de prensa (press-reported; equals the storage drop); la serie del SIH trae "
                              "18 días con cero en el periodo, así que aplica el respaldo del preregistro",
              "veredicto": "meets the preregistered criterion" if pp["cumple_criterio"] else "does not meet the preregistered criterion",
              "lamina_bruta_historica_mediana_m": round(lam_med, 3), "anios_lamina": n_lam, "corridas": CORRIDAS,
              "climatologia": list(CLIMA), "principal": principal,
              "sensibilidad": {k: {"veredicto_prensa": v["puntos"]["principal_14_jul"]["verdades"]["prensa"]["cumple_criterio"],
                                   "veredicto_sih": v["puntos"]["principal_14_jul"]["verdades"]["sih"]["cumple_criterio"],
                                   "punto_14_jul": {x: v["puntos"]["principal_14_jul"][x] for x in ("modelo_p10", "modelo_p50", "modelo_p90", "L1", "L1-s", "L2")},
                                   "area_autorizada_ha": v["area_autorizada_ha"]} for k, v in sens.items()},
              "no_aplicado": ["sorteo de Kc", "fracción de lavado", "calibración contra ciclos previos"]}
    json.dump(salida, open("h1_resultado.json", "w"), ensure_ascii=False, indent=1)
    p10, p50, p90, l1, l1s, l2 = curvas
    with open("h1_series.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["fecha", "modelo_p10", "modelo_p50", "modelo_p90", "L1", "L1_s", "L2"])
        for i, d in enumerate(dias):
            w.writerow([d.isoformat()] + [round(float(x[i]), 2) for x in (p10, p50, p90, l1, l1s, l2)])
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        diario = {r["fecha"]: float(r["acumulado_hm3"]) for r in csv.DictReader(open("h1_verdad_sih_diario.csv"))}
        fig, ax = plt.subplots(figsize=(7.4, 4), dpi=150)
        ax.fill_between(dias, p10, p90, color="#15803d", alpha=0.18, lw=0, label="Model P10–P90")
        ax.plot(dias, p50, color="#15803d", lw=2, label="Model P50 (crop demand chain)")
        ax.plot(dias, l1s, color="#2563eb", lw=1.6, ls="--", label="L1-s (authorized × ETo seasonal curve)")
        ax.plot(dias, l1, color="#64748b", lw=1.4, ls=":", label="L1 (authorized, linear)")
        ax.plot(dias, l2, color="#a16207", lw=1.4, ls="-.", label=f"L2 (analog cycle {principal['L2_analogo']['anio']})")
        ds = [d for d in dias if d.isoformat() in diario]
        ax.plot(ds, [diario[d.isoformat()] for d in ds], color="#111827", lw=1, alpha=0.7,
                label="SIH outlet release, integrated (18 zero days: lower bound)")
        for nombre, d in PUNTOS.items():
            ax.scatter([d], [PRENSA[nombre]], color="#dc2626", zorder=5, s=28)
            ax.annotate(f"{PRENSA[nombre]:.0f} press-reported\n(equals the storage drop)", (d, PRENSA[nombre]),
                        textcoords="offset points", xytext=(-6, 8), ha="right", fontsize=6.5, color="#dc2626")
        ax.set_ylabel("Cumulative release from La Boquilla, hm³", fontsize=8)
        ax.set_title(f"H1 back-test, 2026 cycle · {salida['veredicto']}", fontsize=9, loc="left")
        ax.legend(fontsize=6.5, frameon=False, loc="upper left")
        ax.spines[["top", "right"]].set_visible(False)
        ax.tick_params(labelsize=7)
        fig.tight_layout()
        fig.savefig("h1_backtest.png")
    except ImportError:
        pass
    registrar_fuentes("A6", ["h1_resultado.json", "h1_series.csv", "h1_backtest.png"],
                      "NASA POWER (climatología 1991–2025); Conagua, estadísticas agrícolas 1998–2025; Conagua SIH (LBQCH); prensa",
                      "datos/colab/A6_backtest.py")
    print(json.dumps({k: salida[k] for k in ("veredicto", "lamina_bruta_historica_mediana_m")}, ensure_ascii=False))
    print(json.dumps(principal, ensure_ascii=False, indent=1))
    print(json.dumps(salida["sensibilidad"], ensure_ascii=False))


if __name__ == "__main__":
    main()
