# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A5 · Demanda de agua por cultivo y rotación (FAO-56) con Monte Carlo, y plazo del agua (S9 §5).

Entrada: eto_diaria.csv (A1)
Salidas:
    demanda_cultivos.csv   cultivo, lluvia_pct, etc_mm_p50, neta_mm_p50, bruta_millares_p10, p50, p90
    rotaciones.json        opciones con lámina bruta (millares/ha) P10/P50/P90 por variante de lluvia y plazo
Unidad: 1 millar/ha = 1,000 m³/ha = 100 mm de lámina.
Cadena: ETc = Kc·ETo; neta = Σ_mes max(ETc − Peff, 0); bruta = neta / Ea + presiembra (anuales).
Peff: FAO/AGLW «dependable rain» (0.6P−10 si P ≤ 70 mm/mes; 0.8P−24 si P > 70), acotada a [0, P].
Monte Carlo: año climático remuestreado 1991–2025, sesgo de ETo U(−0.10, 0), Ea U(rango), presiembra U(150, 200).
Todos los parámetros [S] se declaran en PARAMS con su etiqueta; las cifras con fuente llevan la referencia.
"""
import csv
import datetime as dt
import json
import random
from collections import defaultdict

PARAMS = {
    "ea_gravedad": {"valor": [0.45, 0.70], "etiqueta": "[S]",
                    "fuente": "Sin valor medido en el DR-005; aplicación por gravedad 55–60 % (IMTA, según la investigación del 10-nov) con sensibilidad 45–70 %"},
    "sesgo_eto": {"valor": [-0.10, 0.0], "etiqueta": "[S]",
                  "fuente": "POWER-PM sobreestima ~10 % en La Laguna (Delgado-Ramírez 2023); aplicado a Delicias como supuesto"},
    "presiembra_mm": {"valor": [150, 200], "etiqueta": "[S]; algodón 200 mm [V] INIFAP 2017"},
    "periodo_clima": {"valor": [1991, 2025], "etiqueta": "[S] propuesto en el preregistro"},
    "corridas": 2000,
    "plazo_anios": {"anual": 1, "alfalfa": 4, "nogal": 10,
                    "fuente": "alfalfa 3–4 años [P] FIRA; nogal: horizonte de cálculo de 10 años [S] (S9 §5)"},
}

# Kc FAO-56 Tabla 12 [V] y etapas Tabla 11 [V] (ajustes de duración marcados [S]).
# siembra = (mes, día); dias = (ini, des, med, fin)
CULTIVOS = {
    "alfalfa":         {"kc": (0.95, 0.95, 0.95), "perenne": True,
                        "nota": "Kc 0.95 todo el año (efecto promediado de cortes) [S]; contraste INIFAP 170–180 cm aplicados [V]"},
    "nogal":           {"kc": (0.45, 0.90, 0.65), "siembra": (3, 15), "dias": (20, 10, 130, 30), "perenne": True,
                        "nota": "FAO-56 «stone fruit» sin cobertura; inicio = brotación ≈15-mar (INIFAP) [S]"},
    "algodon":         {"kc": (0.35, 1.175, 0.60), "siembra": (4, 25), "dias": (30, 50, 55, 45), "presiembra_fija": 200},
    "chile":           {"kc": (0.60, 1.05, 0.90), "siembra": (3, 10), "dias": (28, 35, 40, 20),
                        "nota": "sustituto: pimiento FAO-56; siembra directa 20-feb a 31-mar (INIFAP) [V]"},
    "maiz_forrajero":  {"kc": (0.30, 1.20, 0.60), "siembra": (4, 15), "dias": (25, 35, 30, 15),
                        "nota": "corte de ensilaje a ~105 días; etapas FAO maíz escaladas [S]"},
    "sorgo":           {"kc": (0.30, 1.05, 0.55), "siembra": (5, 1), "dias": (20, 35, 45, 30)},
    "cereal_invierno": {"kc": (0.30, 1.15, 0.25), "siembra": (10, 15), "dias": (15, 35, 45, 20),
                        "nota": "avena forrajera, corte a ~115 días; etapas FAO escaladas [S]"},
}

ROTACIONES = [
    {"id": "alfalfa", "nombre": "Alfalfa (perenne)", "cultivos": ["alfalfa"], "plazo": "alfalfa"},
    {"id": "alfalfa_corte_verano", "nombre": "Alfalfa con corte de riego en verano", "cultivos": ["alfalfa"],
     "plazo": "alfalfa", "sin_riego_meses": [8, 9],
     "nota": "suspensión después del corte de inicios de agosto (Bali et al. 2024; pérdida de rendimiento 3–18 %) [V]"},
    {"id": "nogal", "nombre": "Nogal (huerta)", "cultivos": ["nogal"], "plazo": "nogal"},
    {"id": "algodon", "nombre": "Algodón", "cultivos": ["algodon"], "plazo": "anual"},
    {"id": "chile", "nombre": "Chile", "cultivos": ["chile"], "plazo": "anual"},
    {"id": "maiz_forrajero", "nombre": "Maíz forrajero", "cultivos": ["maiz_forrajero"], "plazo": "anual"},
    {"id": "sorgo", "nombre": "Sorgo forrajero", "cultivos": ["sorgo"], "plazo": "anual"},
    {"id": "avena_maiz", "nombre": "Avena (invierno) + maíz forrajero (verano)",
     "cultivos": ["cereal_invierno", "maiz_forrajero"], "plazo": "anual"},
    {"id": "descanso", "nombre": "Descanso con rastrojo en pie", "cultivos": [], "plazo": "anual"},
]


def kc_curva(c, fecha_ini, dias_anio):
    """Kc diario de un cultivo anual o del nogal dentro del año agrícola (lista de fechas)."""
    k = CULTIVOS[c]
    if "dias" not in k:                       # alfalfa: constante
        return {d: k["kc"][1] for d in dias_anio}
    ini, des, med, fin = k["dias"]
    kci, kcm, kcf = k["kc"]
    out = {}
    for n in range(ini + des + med + fin):
        d = fecha_ini + dt.timedelta(days=n)
        if n < ini:
            v = kci
        elif n < ini + des:
            v = kci + (kcm - kci) * (n - ini) / des
        elif n < ini + des + med:
            v = kcm
        else:
            v = kcm + (kcf - kcm) * (n - ini - des - med) / fin
        out[d] = v
    return out


def peff(p):
    e = 0.6 * p - 10 if p <= 70 else 0.8 * p - 24
    return min(max(e, 0.0), p)


def cargar_clima(ruta="eto_diaria.csv"):
    clima = {}
    for r in csv.DictReader(open(ruta)):
        clima[dt.date.fromisoformat(r["fecha"])] = (float(r["eto_mm"]), float(r["lluvia_mm"]))
    return clima


_CACHE = {}


def meses_anio(cultivos, anio_ag, clima, f_lluvia):
    """ETc mensual sin sesgo y lluvia mensual de una rotación en el año agrícola (con caché)."""
    clave = (tuple(cultivos), anio_ag, f_lluvia)
    if clave in _CACHE:
        return _CACHE[clave]
    ini, fin = dt.date(anio_ag - 1, 10, 1), dt.date(anio_ag, 9, 30)
    dias = [ini + dt.timedelta(days=i) for i in range((fin - ini).days + 1)]
    kc = defaultdict(float)
    for c in cultivos:
        k = CULTIVOS[c]
        if "siembra" in k:
            m, d = k["siembra"]
            fecha = dt.date(anio_ag - 1 if m >= 10 else anio_ag, m, d)
            curva = kc_curva(c, fecha, dias)
        else:
            curva = kc_curva(c, None, dias)
        for dd, v in curva.items():
            if ini <= dd <= fin:
                kc[dd] = max(kc[dd], v)
    etc_mes, p_mes = defaultdict(float), defaultdict(float)
    for d in dias:
        if d in clima:
            eto, p = clima[d]
            etc_mes[(d.year, d.month)] += kc[d] * eto
            p_mes[(d.year, d.month)] += p * f_lluvia
    _CACHE[clave] = (dict(etc_mes), dict(p_mes))
    return _CACHE[clave]


def neta_anio(cultivos, anio_ag, clima, sesgo, f_lluvia, sin_riego_meses=()):
    """Lámina neta (mm) y ETc (mm) de una rotación en el año agrícola anio_ag (1-oct anterior a 30-sep)."""
    etc_mes, p_mes = meses_anio(cultivos, anio_ag, clima, f_lluvia)
    neta, etc = 0.0, 0.0
    for ym, e in etc_mes.items():
        e = e * (1 + sesgo)
        etc += e
        if ym[1] in sin_riego_meses:
            continue
        neta += max(e - peff(p_mes[ym]), 0.0)
    return neta, etc


def percentiles(v):
    v = sorted(v)
    q = lambda f: v[min(len(v) - 1, int(round(f * (len(v) - 1))))]
    return q(0.1), q(0.5), q(0.9)


def simular(cultivos, clima, anios, f_lluvia, rng, sin_riego=()):
    ea0, ea1 = PARAMS["ea_gravedad"]["valor"]
    s0, s1 = PARAMS["sesgo_eto"]["valor"]
    p0, p1 = PARAMS["presiembra_mm"]["valor"]
    anuales = [c for c in cultivos if not CULTIVOS[c].get("perenne")]
    brutas, netas, etcs = [], [], []
    for _ in range(PARAMS["corridas"]):
        a = rng.choice(anios)
        neta, etc = neta_anio(cultivos, a, clima, rng.uniform(s0, s1), f_lluvia, sin_riego)
        pres = sum(CULTIVOS[c].get("presiembra_fija", rng.uniform(p0, p1)) for c in anuales)
        bruta = neta / rng.uniform(ea0, ea1) + pres
        brutas.append(bruta / 100)            # mm → millares/ha
        netas.append(neta)
        etcs.append(etc)
    return percentiles(brutas), percentiles(netas)[1], percentiles(etcs)[1]


def main():
    clima = cargar_clima()
    a0, a1 = PARAMS["periodo_clima"]["valor"]
    anios = [a for a in range(a0 + 1, a1 + 1)
             if sum(1 for d in clima if dt.date(a - 1, 10, 1) <= d <= dt.date(a, 9, 30)) >= 360]
    rng = random.Random(20261114)
    filas, salida = [], []
    for c in CULTIVOS:
        for lp, f in ((0, 1.0), (-20, 0.8)):
            (b10, b50, b90), n50, e50 = simular([c], clima, anios, f, rng)
            filas.append([c, lp, round(e50), round(n50), round(b10, 2), round(b50, 2), round(b90, 2)])
    for r in ROTACIONES:
        reg = {k: v for k, v in r.items() if k != "sin_riego_meses"}
        reg["plazo_anios"] = PARAMS["plazo_anios"][r["plazo"]]
        reg["lamina_bruta_millares"] = {}
        for lp, f in ((0, 1.0), (-20, 0.8)):
            if r["cultivos"]:
                (b10, b50, b90), n50, e50 = simular(r["cultivos"], clima, anios, f, rng, r.get("sin_riego_meses", ()))
            else:
                b10 = b50 = b90 = n50 = e50 = 0.0
            reg["lamina_bruta_millares"][str(lp)] = {"p10": round(b10, 2), "p50": round(b50, 2), "p90": round(b90, 2),
                                                     "neta_mm_p50": round(n50), "etc_mm_p50": round(e50)}
        salida.append(reg)
    with open("demanda_cultivos.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["cultivo", "lluvia_pct", "etc_mm_p50", "neta_mm_p50",
                    "bruta_millares_p10", "bruta_millares_p50", "bruta_millares_p90"])
        w.writerows(filas)
    json.dump({"params": PARAMS, "cultivos": {k: {kk: vv for kk, vv in v.items()} for k, v in CULTIVOS.items()},
               "rotaciones": salida, "anios_clima": anios},
              open("rotaciones.json", "w"), ensure_ascii=False, indent=1)

    # Prueba de aceptación (kit A5): orden de percentiles y contraste con INIFAP
    for r in salida:
        for v in r["lamina_bruta_millares"].values():
            assert v["p10"] <= v["p50"] <= v["p90"], r["id"]
    alf = next(x for x in filas if x[0] == "alfalfa" and x[1] == 0)
    alg = next(x for x in filas if x[0] == "algodon" and x[1] == 0)
    print(f"Años de clima: {len(anios)}")
    print(f"Alfalfa: ETc {alf[2]} mm, neta {alf[3]} mm, bruta P50 {alf[5]} millares/ha; "
          f"eficiencia implícita frente a INIFAP 1,700–1,800 mm: {alf[3] / 1800:.2f}–{alf[3] / 1700:.2f}")
    print(f"Algodón: neta {alg[3]} mm, bruta P50 {alg[5]} millares/ha; INIFAP ~680 mm aplicados")
    for x in filas:
        if x[1] == 0:
            print(f"  {x[0]:16s} bruta P10–P90: {x[4]}–{x[6]} millares/ha")


if __name__ == "__main__":
    main()
