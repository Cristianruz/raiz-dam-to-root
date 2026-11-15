# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A12 · Nogal: cobertura del dosel estimada con NDVI y Kc resultante, por parcela (S8, decisión 5; pendiente D6).

Entradas (en --entrega): cultivos_parcelas.csv, memoria_parcelas.csv, gedi_parcelas.csv, parcelas_base.geojson
          supuestos.json (en --dir): kc_nogal_tabla, altura_nogal_m, cobertura_dosel_nogal, cobertura_ndvi_relacion
Salidas:  nogal_cobertura.csv  (id, zona, ndvi_verano_max, cobertura_estimada, kc_mid_estimado, altura_gedi_p90_m,
                                anios_patron_huerta)
          nogal_cobertura_resumen.json
Uso:      python A12_nogal_cobertura.py --dir data/reto --entrega data/entrega_zonas

Método:
- Parcelas con cultivo_actual = nogal y sin abstención.
- NDVI = máximo de junio a septiembre del año agrícola 2026 (mediana mensual de la parcela, HLS; columna max_verano de
  memoria_parcelas.csv).
- Cobertura = pendiente × NDVI + ordenada, acotada a 0–1. La relación se lee de supuestos.json (cobertura_ndvi_relacion).
- Kc de media temporada = Kc_min + Kd × (Kc_mid de tabla − Kc_min), Kd = min(1, 1.5 × fc, fc^(1/(1+h))), Kc_min = 0.15
  (FAO-56, Ec. 98; la misma cuenta de A5_demanda_plazo.py), antes del ajuste por clima.
NO cambia el cálculo de la demanda: A5 sigue usando cobertura_dosel_nogal de supuestos.json. Esto dice si ese supuesto
es compatible con lo que se observa y da el rango entre parcelas.
Límites: la relación NDVI–cobertura se ajustó con Landsat en hortalizas, viñedos y huertas jóvenes de California y sus
autores no la verificaron en huertas adultas; el NDVI de una huerta incluye la vegetación del piso entre hileras; el
mapa de cultivos es por reglas (no validado en campo).
"""
import csv
import json
import os

import numpy as np

from comun import carpeta, registrar_fuentes

ANIO = "2026"
KC_MIN = 0.15


def kc_mid(fc, h, km):
    kd = min(1.0, 1.5 * fc, fc ** (1 / (1 + h))) if fc > 0 else 0.0
    return KC_MIN + kd * (km - KC_MIN)


def main():
    a = carpeta("A12: cobertura del nogal", lambda ap: ap.add_argument("--entrega", required=True))
    s = json.load(open("supuestos.json"))
    faltan = [k for k in ("kc_nogal_tabla", "altura_nogal_m", "cobertura_dosel_nogal", "cobertura_ndvi_relacion") if k not in s]
    if faltan:
        raise SystemExit(f"Faltan en supuestos.json: {faltan}. No se usan valores de memoria.")
    rel = s["cobertura_ndvi_relacion"]["valor"]
    km, h, fc_modelo = s["kc_nogal_tabla"]["valor"][1], s["altura_nogal_m"]["valor"], s["cobertura_dosel_nogal"]["valor"]
    E = lambda n: os.path.join(a.entrega, n)
    zona = {f["properties"]["id"]: f["properties"]["zona"] for f in json.load(open(E("parcelas_base.geojson")))["features"]}
    cult = {r["id"]: r for r in csv.DictReader(open(E("cultivos_parcelas.csv")))}
    gedi = {r["id"]: r for r in csv.DictReader(open(E("gedi_parcelas.csv")))}
    ndvi = {r["id"]: r["max_verano"] for r in csv.DictReader(open(E("memoria_parcelas.csv"))) if r["anio_agricola"] == ANIO}
    min_disp = s.get("gedi_umbral_dosel_alto_m", {}).get("min_disparos", {}).get("valor", 3)
    filas = []
    for pid, c in sorted(cult.items()):
        if c["cultivo_actual"] != "nogal" or c["abstencion"] == "True" or ndvi.get(pid) in (None, ""):
            continue
        v = float(ndvi[pid])
        fc = min(1.0, max(0.0, rel["pendiente"] * v + rel["ordenada"]))
        g = gedi.get(pid, {})
        alt = g.get("altura_p90_m") if g.get("n_disparos") not in (None, "") and int(g["n_disparos"]) >= min_disp else ""
        filas.append({"id": pid, "zona": zona[pid], "ndvi_verano_max": round(v, 3), "cobertura_estimada": round(fc, 2),
                      "kc_mid_estimado": round(kc_mid(fc, h, km), 2), "altura_gedi_p90_m": alt,
                      "anios_patron_huerta": c["edad_perenne_anios"]})
    with open("nogal_cobertura.csv", "w", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)

    def resumen(fs):
        fc = np.array([f["cobertura_estimada"] for f in fs])
        kc = np.array([f["kc_mid_estimado"] for f in fs])
        alt = np.array([float(f["altura_gedi_p90_m"]) for f in fs if f["altura_gedi_p90_m"] != ""])
        p = lambda x: {k: round(float(np.percentile(x, q)), 2) for k, q in (("p10", 10), ("p50", 50), ("p90", 90))}
        anios = [int(f["anios_patron_huerta"]) for f in fs if f["anios_patron_huerta"] != ""]
        return {"n_parcelas": len(fs), "cobertura_estimada": p(fc), "kc_mid_estimado": p(kc),
                "parcelas_con_cobertura_menor_a_0.5": int((fc < 0.5).sum()),
                "altura_gedi_p90_m": dict(p(alt), n_parcelas=int(alt.size)) if alt.size else None,
                "parcelas_con_patron_huerta_toda_la_memoria": sum(x >= 11 for x in anios)}

    out = {"anio_agricola": int(ANIO), "relacion": s["cobertura_ndvi_relacion"],
           "modelo": {"cobertura_dosel_nogal": fc_modelo, "altura_nogal_m": h, "kc_mid": round(kc_mid(fc_modelo, h, km), 2)},
           "zonas": {z: resumen([f for f in filas if f["zona"] == z]) for z in sorted({f["zona"] for f in filas})},
           "todas": resumen(filas),
           "nota": "Referencia: el cálculo de la demanda (A5) no usa estos valores. Memoria de HLS: 2016–2026 (11 años)."}
    json.dump(out, open("nogal_cobertura_resumen.json", "w"), ensure_ascii=False, indent=1)
    registrar_fuentes("A12", ["nogal_cobertura.csv", "nogal_cobertura_resumen.json"],
                      "NASA HLS v2 (máximo de NDVI de jun–sep de 2026 por parcela, A3); relación NDVI–cobertura de "
                      "Johnson y Trout (2012), Remote Sensing 4(2):439–455, DOI 10.3390/rs4020439; FAO-56, Ec. 98 y Tabla 12; "
                      "GEDI L2A (A11); mapa de cultivos por reglas (A4)", "datos/colab/A12_nogal_cobertura.py")
    print(json.dumps({k: out[k] for k in ("modelo", "zonas", "todas")}, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
