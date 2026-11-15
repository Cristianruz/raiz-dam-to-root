# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A7 · Experimento natural de 2025 (H3), según el texto preregistrado (S9, Anexo B). No se modifican criterio ni umbrales.

Entradas: memoria_parcelas.csv (A3-M; max_verano = máximo NDVI mensual jun–sep del año agrícola),
          cultivos_parcelas.csv (A4; mapa de cultivos 2026), parcelas_base.geojson (B1)
Salidas:  h3_series.csv (anio_agricola, grupo, umbral_ndvi, n_parcelas, n_sin_dato, proporcion_con_cultivo_verano)
          h3_resultado.json (criterio (a) y (b), sensibilidad, controles) y h3_series.png
Grupos (definidos sin usar datos de 2025):
  (a) anuales: NO perenne en 2024 según la memoria y NO nogal en el mapa 2026.
  (b) nogal: clase nogal en el mapa 2026, no abstenida.
  alfalfa (perenne en 2024 y no nogal): solo descriptiva.
Indicador: proporción del grupo con max NDVI jun–sep ≥ umbral; sin dato en la ventana → se excluye ese año y se cuenta.
"""
import csv
import json
import statistics
from collections import defaultdict

from comun import carpeta, registrar_fuentes

UMBRAL = 0.40                      # preregistrado
SENSIBILIDAD = (0.35, 0.45)        # preregistrado
ANIOS_BASE = range(2019, 2025)     # 2019–2024
ANIO_PRUEBA = 2025


def main():
    carpeta("A7: experimento natural de 2025 (H3)")
    mem = defaultdict(dict)
    for r in csv.DictReader(open("memoria_parcelas.csv")):
        mem[r["id"]][int(r["anio_agricola"])] = r
    cult = {r["id"]: r for r in csv.DictReader(open("cultivos_parcelas.csv"))}
    ids = [f["properties"]["id"] for f in json.load(open("parcelas_base.geojson"))["features"]]

    # Grupos: solo con el estado 2024 de la memoria y el mapa 2026 (sin datos de 2025)
    nogal = {i for i in ids if cult[i]["cultivo_actual"] == "nogal" and cult[i]["abstencion"] == "False"}
    perenne24 = {i for i in ids if mem[i].get(2024, {}).get("estado") == "perenne"}
    grupos = {"anuales": [i for i in ids if i not in perenne24 and i not in nogal],
              "nogal": sorted(nogal),
              "alfalfa_descriptiva": [i for i in ids if i in perenne24 and i not in nogal]}
    # Control de supervivencia: patrón de huerta (verde en verano, sin cultivo de invierno) en todos los años
    # 2019–2024 y que NO es nogal en 2026
    patron_huerta = [i for i in ids if i not in nogal and all(
        mem[i].get(a, {}).get("estado") == "verano" for a in ANIOS_BASE)]
    grupos["patron_huerta_no_nogal"] = patron_huerta

    filas, prop = [], {}
    for g, miembros in grupos.items():
        for u in (UMBRAL,) + SENSIBILIDAD:
            for a in range(2019, 2027):
                vals = [mem[i].get(a, {}).get("max_verano") for i in miembros]
                con = [float(v) for v in vals if v not in (None, "")]
                sin = len(vals) - len(con)
                p = None if not con else sum(1 for v in con if v >= u) / len(con)
                prop[(g, u, a)] = p
                filas.append([a, g, u, len(con), sin, None if p is None else round(p, 4)])

    def evaluar(u):
        out = {}
        for g, regla in (("anuales", "a"), ("nogal", "b")):
            base = [prop[(g, u, a)] for a in ANIOS_BASE if prop[(g, u, a)] is not None]
            med = statistics.median(base) if base else None
            p25 = prop[(g, u, ANIO_PRUEBA)]
            dif = None if (med is None or p25 is None) else round(100 * (p25 - med), 1)
            cumple = None if dif is None else (dif <= -25 if regla == "a" else abs(dif) <= 10)
            out[regla] = {"grupo": g, "mediana_2019_2024": None if med is None else round(med, 4),
                          "proporcion_2025": None if p25 is None else round(p25, 4),
                          "diferencia_pp": dif, "cumple": cumple}
        out["H3"] = "supported" if (out["a"]["cumple"] and out["b"]["cumple"]) else "not supported"
        return out

    res = {"criterio": "Anexo B de S9 (preregistro): (a) anuales 2025 ≥ 25 pp debajo de su mediana 2019–2024; "
                       "(b) nogal 2025 a ≤ 10 pp de su mediana 2019–2024",
           "principal": {"umbral": UMBRAL, **evaluar(UMBRAL)},
           "sensibilidad": {str(u): evaluar(u) for u in SENSIBILIDAD},
           "n_parcelas": {g: len(m) for g, m in grupos.items()},
           "alfalfa_descriptiva": {str(a): prop[("alfalfa_descriptiva", UMBRAL, a)] for a in range(2019, 2027)},
           "supervivencia": {"parcelas_patron_huerta_2019_2024_no_nogal_2026": len(patron_huerta),
                             "proporcion_2025": prop[("patron_huerta_no_nogal", UMBRAL, ANIO_PRUEBA)]},
           "divulgacion": "La prensa reportó 12,000–15,000 ha sembradas con pozos en 2025; ninguna serie de "
                          "satélite se calculó antes del registro.",
           "limitaciones": ["Las huertas se identifican en 2026: las retiradas antes no se observan.",
                            "Parcelas estimadas por Fields of The World (no catastro); mapa de cultivos por reglas."]}

    with open("h3_series.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["anio_agricola", "grupo", "umbral_ndvi", "n_parcelas", "n_sin_dato", "proporcion_con_cultivo_verano"])
        w.writerows(filas)
    json.dump(res, open("h3_resultado.json", "w"), ensure_ascii=False, indent=1)

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(7, 3.6), dpi=150)
        anios = list(range(2019, 2027))
        for g, col, et in (("anuales", "#c2410c", "Annual-crop fields"), ("nogal", "#15803d", "Pecan orchards (2026 map)")):
            ax.plot(anios, [None if prop[(g, UMBRAL, a)] is None else 100 * prop[(g, UMBRAL, a)] for a in anios],
                    marker="o", color=col, label=f"{et} (n={len(grupos[g])})")
        ax.axvspan(2024.5, 2025.5, color="#94a3b8", alpha=0.25, lw=0)
        ax.text(2025, 3, "2025: no dam\nallocation", ha="center", fontsize=7)
        ax.set_ylim(0, 105)
        ax.set_ylabel("% with active summer crop\n(max NDVI Jun–Sep ≥ 0.40)", fontsize=8)
        ax.set_xlabel("Agricultural year (Oct–Sep)", fontsize=8)
        ax.legend(fontsize=7, frameon=False, loc="lower left")
        ax.spines[["top", "right"]].set_visible(False)
        ax.set_title(f"H3: {res['principal']['H3']}  ·  HLS v2, pilot area DR-005", fontsize=9, loc="left")
        fig.tight_layout()
        fig.savefig("h3_series.png")
    except ImportError:
        pass

    registrar_fuentes("A7", ["h3_series.csv", "h3_resultado.json", "h3_series.png"],
                      "NASA HLS v2 vía Earth Engine (memoria A3-M) y mapa de cultivos A4", "datos/colab/A7_h3.py")
    p = res["principal"]
    print(f"Grupos: {res['n_parcelas']}")
    for k in ("a", "b"):
        print(f"({k}) {p[k]['grupo']}: mediana 2019–24 {p[k]['mediana_2019_2024']} · 2025 {p[k]['proporcion_2025']} · "
              f"{p[k]['diferencia_pp']} pp · cumple {p[k]['cumple']}")
    print("H3:", p["H3"], "· sensibilidad:", {u: v["H3"] for u, v in res["sensibilidad"].items()})


if __name__ == "__main__":
    main()
