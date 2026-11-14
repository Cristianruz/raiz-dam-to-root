# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A8 · Contraste regional de ET: ETc modelada (FAO-56, A5) frente a SSEBop VIIRS v6 mensual. Rótulo obligatorio:
"regional comparison; not field-level validation". Nunca por parcela.

Entradas: eto_diaria.csv (A1), cultivos_parcelas.csv (A4), parcelas_base.geojson (B1), supuestos.json,
          data/raw/ssebop/ssebop_zona_mensual.csv (Earth Engine projects/usgs-ssebop/viirs_et_v6_monthly, banda et,
          media sobre el rectángulo de la zona piloto a 1 km; script datos/earthengine/ssebop_mensual.js)
Salidas:  et_contraste.csv (mes, et_modelo_mm, et_ssebop_mm, et_wapor_mm) y et_contraste.png
ET modelada: ETc potencial del cultivo actual (Kc FAO-56 × ETo de POWER del año real, sin sesgo ni Monte Carlo) de las
parcelas clasificadas (no abstenidas), promedio ponderado por superficie. Barbecho = 0 (sin cultivo; la evaporación del
suelo desnudo no se modela). WaPOR: no corrido (sin acceso directo en Earth Engine sin descarga pesada).
"""
import csv
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import A5_demanda_plazo as A5                      # noqa: E402
from comun import carpeta, registrar_fuentes        # noqa: E402

MESES = [(2025, m) for m in (10, 11, 12)] + [(2026, m) for m in range(1, 10)]


def main():
    a = carpeta("A8: contraste regional de ET", lambda ap: ap.add_argument("--ssebop", required=True))
    A5.cargar_supuestos()
    clima = A5.cargar_clima()
    area = {f["properties"]["id"]: f["properties"]["area_ha"] for f in json.load(open("parcelas_base.geojson"))["features"]}
    sup = {}
    for r in csv.DictReader(open("cultivos_parcelas.csv")):
        if r["abstencion"] == "False":
            sup[r["cultivo_actual"]] = sup.get(r["cultivo_actual"], 0.0) + area[r["id"]]
    total = sum(sup.values())
    etc = {ym: 0.0 for ym in MESES}
    for c, ha in sup.items():
        if c == "barbecho":
            continue
        etc_mes, _ = A5.meses_anio([c], 2026, clima, 1.0)
        for ym in MESES:
            etc[ym] += etc_mes.get(ym, 0.0) * ha / total
    sse = {r["mes"]: float(r["et_media"]) for r in csv.DictReader(open(a.ssebop))}
    filas = []
    for (y, m) in MESES:
        k = f"{y}-{m:02d}"
        filas.append([k, round(etc[(y, m)], 1), round(sse[k], 1) if k in sse else None, None])
    with open("et_contraste.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["mes", "et_modelo_mm", "et_ssebop_mm", "et_wapor_mm"])
        w.writerows(filas)
    tm, ts = sum(f[1] for f in filas), sum(f[2] for f in filas if f[2] is not None)
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        fig, ax = plt.subplots(figsize=(7, 3.4), dpi=150)
        x = range(len(filas))
        ax.plot(x, [f[1] for f in filas], marker="o", color="#15803d",
                label=f"Modeled crop ET (FAO-56, classified fields, {total:.0f} ha)")
        ax.plot(x, [f[2] for f in filas], marker="s", color="#2563eb", label="SSEBop VIIRS v6 (pilot rectangle, 1 km)")
        ax.set_xticks(list(x), [f[0][2:] for f in filas], fontsize=7)
        ax.set_ylabel("mm per month", fontsize=8)
        ax.legend(fontsize=7, frameon=False)
        ax.spines[["top", "right"]].set_visible(False)
        ax.set_title("Regional comparison; not field-level validation · Oct 2025–Sep 2026", fontsize=9, loc="left")
        fig.tight_layout()
        fig.savefig("et_contraste.png")
    except ImportError:
        pass
    registrar_fuentes("A8", ["et_contraste.csv", "et_contraste.png"],
                      "SSEBop VIIRS v6 mensual (USGS) vía Earth Engine; ETc FAO-56 con NASA POWER", "datos/colab/A8_et_contraste.py")
    print("Superficie clasificada por cultivo (ha):", {k: round(v) for k, v in sup.items()})
    print(f"ET modelada {tm:.0f} mm · SSEBop {ts:.0f} mm · diferencia {tm - ts:+.0f} mm ({100 * (tm - ts) / ts:+.0f} %)")


if __name__ == "__main__":
    main()
