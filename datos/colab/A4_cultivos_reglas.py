# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A4 (enfoque A, reglas fenológicas) · Cultivo actual y estado del plazo por parcela.

Entradas: hls_mensual_parcelas.csv (A3, año agrícola 2026), memoria_parcelas.csv (A3-M), parcelas_base.geojson (B1)
Salida: cultivos_parcelas.csv  id, cultivo_actual, prob_max, acuerdo_metodos, abstencion,
                                edad_perenne_anios, estado_plazo
Reglas [S] (umbrales a calibrar con las etiquetas a ciegas; S9 §5 y manual de etiquetado 39):
  - alfalfa: perenne 2025 y 2026 (≥ 8 meses verdes) y verde en invierno (NDVI dic–feb ≥ 0.35).
  - nogal: verde de may a sep (≥ 4 meses ≥ 0.40) y bajo en invierno (dic–feb < 0.30) en 2026 y 2025;
           su perennidad la da el patrón repetido, no los 8 meses verdes (pierde la hoja).
  - cereal_invierno: verde dic–mar y bajo jun–sep.
  - anual de verano (verde jun–sep y bajo dic–mar): chile, algodón, maíz o sorgo no se separan a 30 m
    sin etiquetas. Como «anual_verano» no es clase del contrato, se publica sin_clasificar (abstención)
    con grupo_fenologico = anual_verano y estado_plazo = libre.
  - barbecho: sin verdor todo el año. Lo demás: sin_clasificar (abstención).
  - Abstención también si ftw_confianza < 50 (kit A4.2).
Plazo: anual → libre; alfalfa con edad ≥ 3 años → por_vencer; alfalfa más joven o nogal → comprometida.
prob_max no aplica a reglas: se deja vacío; acuerdo_metodos = "1/1 (reglas)" hasta tener Random Forest.
"""
import csv
import json
from collections import defaultdict

from comun import carpeta, registrar_fuentes

FTW_MIN = 50       # kit A4.2: abstención si la confianza de Fields of The World es menor


def main():
    carpeta("A4: cultivos por reglas fenológicas")
    sup = json.load(open("supuestos.json"))
    for k in ("umbral_verde_ndvi", "umbral_invierno_alfalfa", "umbral_invierno_nogal"):
        if k not in sup:
            raise SystemExit(f"Falta '{k}' en supuestos.json")
    V = sup["umbral_verde_ndvi"]["valor"]
    INV_ALF = sup["umbral_invierno_alfalfa"]["valor"]
    INV_NOG = sup["umbral_invierno_nogal"]["valor"]
    ndvi = defaultdict(dict)
    for r in csv.DictReader(open("hls_mensual_parcelas.csv")):
        if r["banda"] == "ndvi":
            ndvi[r["id"]][int(r["mes"][5:7])] = float(r["mediana"])
    mem = defaultdict(dict)
    for r in csv.DictReader(open("memoria_parcelas.csv")):
        mem[r["id"]][int(r["anio_agricola"])] = r
    feats = json.load(open("parcelas_base.geojson"))["features"]
    conf = {f["properties"]["id"]: f["properties"].get("ftw_confianza") for f in feats}
    ids = list(conf)

    filas = []
    for pid in ids:
        n = ndvi.get(pid, {})
        m = mem.get(pid, {})
        g = lambda meses: [n[k] for k in meses if k in n]
        invierno, verano = g((12, 1, 2)), g((6, 7, 8, 9))
        prim_verano = g((5, 6, 7, 8, 9))
        dic_mar = g((12, 1, 2, 3))
        verdes = sum(1 for v in n.values() if v >= V)
        est = lambda a: m.get(a, {}).get("estado")
        cultivo = "sin_clasificar"
        if len(n) >= 8:
            if est(2026) == "perenne" and invierno and min(invierno) >= INV_ALF:
                cultivo = "alfalfa"
            elif (sum(1 for v in prim_verano if v >= V) >= 4 and invierno and max(invierno) < INV_NOG
                  and est(2025) in ("verano", "doble", "perenne")):
                cultivo = "nogal"
            elif dic_mar and max(dic_mar) >= V and verano and max(verano) < V:
                cultivo = "cereal_invierno"
            elif verano and max(verano) >= V and dic_mar and max(dic_mar) < V:
                cultivo = "anual_verano"
            elif verdes == 0:
                cultivo = "barbecho"

        # Edad del perenne: años agrícolas consecutivos con el mismo patrón, contando hacia atrás desde 2026
        edad = None
        if cultivo == "alfalfa":
            edad = 0
            for a in range(2026, 2015, -1):
                if est(a) == "perenne":
                    edad += 1
                else:
                    break
        elif cultivo == "nogal":
            edad = 0
            for a in range(2026, 2015, -1):
                if est(a) in ("verano", "doble", "perenne"):
                    edad += 1
                else:
                    break
        grupo = cultivo
        if cultivo in ("alfalfa", "nogal"):
            plazo = "por_vencer" if (cultivo == "alfalfa" and edad >= 3) else "comprometida"
        elif cultivo in ("sin_clasificar",):
            plazo = None
        else:
            plazo = "libre"
        if cultivo == "anual_verano":
            cultivo = "sin_clasificar"           # no es clase del contrato
        c = conf.get(pid)
        abst = cultivo == "sin_clasificar" or c is None or c < FTW_MIN
        if abst and cultivo != "sin_clasificar":
            cultivo = "sin_clasificar"
        filas.append([pid, cultivo, "", "1/1 (reglas)", abst, edad, plazo, grupo])

    with open("cultivos_parcelas.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["id", "cultivo_actual", "prob_max", "acuerdo_metodos", "abstencion",
                    "edad_perenne_anios", "estado_plazo", "grupo_fenologico"])
        w.writerows(filas)
    registrar_fuentes("A4", ["cultivos_parcelas.csv"], "Reglas fenológicas sobre HLS (A3) y memoria (A3-M)",
                      "datos/colab/A4_cultivos_reglas.py")
    conteo = defaultdict(int)
    for f in filas:
        conteo[f[7]] += 1
    print("Parcelas por grupo fenológico:", dict(conteo), "· abstenidas:", sum(1 for f in filas if f[4]))


if __name__ == "__main__":
    main()
