# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""G1 · GAEZ v4 (FAO e IIASA) por zona piloto: aptitud de cultivo y rendimiento alcanzable, como contexto regional.

Entrada: data/raw/reto/gaez_celdas.csv — valores leídos el 14-nov-2026 (desde el navegador, con permiso de Cristian) del
         servicio de imágenes de GAEZ v4, https://gaez-services.fao.org/server/rest/services/res05/ImageServer (tema
         «Suitability and Attainable Yield»), operación getSamples en el centro de cada celda de 5' (~9 km) que toca el
         rectángulo de cada zona (12 en Delicias–Saucillo, 4 en Lázaro Cárdenas). Consulta del catálogo:
         year = '1981-2010' AND model = 'CRUTS32' AND input_level = 'High' AND water_supply = 'Gravity Irrigation'.
Salida:  gaez_zona.csv — contrato del integrador (docs/decisiones/2026-11-14_recursos_del_reto.md):
         zona, cultivo, variable, valor, unidad, resolucion_m; y columnas adicionales: cultivo_gaez, agua, insumos,
         periodo, n_celdas, valor_min, valor_max, clase_nombre, url_fao, nota.
Uso:     python G1_gaez_zona.py --dir data/reto --crudo data/raw/reto

Reglas:
- Por zona: mediana de las celdas para los índices y rendimientos; moda para la clase.
- Cultivos de GAEZ → clases del proyecto: Alfalfa → alfalfa; Cotton → algodon; Sorghum → sorgo; Oat → cereal_invierno;
  Maize → maiz_forrajero, como sustituto declarado: el modelo GAEZ v4 tiene maíz para ensilaje (mzs, tablas 7-5 y A4-1.2
  de su documentación), pero el tema res05 del servicio no tiene capa *Hg_mzs (consulta name LIKE '%Hg_mz%' del
  14-nov-2026: solo suHg_mze, scHg_mze e ycHg_mze, maíz de grano). El valor es de grano, no de forraje: lo dice la
  columna nota. Wheat y Barley se leen pero no se entregan (la clase cereal_invierno ya lleva la avena). GAEZ v4 no
  evalúa chile ni nogal.
- El periodo, los insumos y el riego se comprueban en la ruta del archivo de FAO de cada fila (/CRUTS32/Hist/8110H/ y
  nombre <variable>Hg_<cultivo>.tif: H = insumos altos, g = riego por gravedad).
- Nombre de la clase: por el orden de la leyenda del servicio (1 = Very high … 7 = Very marginal, 8 = Not suitable,
  9 = No cultivation, 10 = Water). Los umbrales que imprime esa leyenda (SI > 75, > 63, > 50, …) no cuadran con los
  índices leídos (77.78 llega como clase 2 y 55.56 como clase 3): por eso se entrega también el índice.
- FAO e IIASA, GAEZ v4 Frequently Asked Questions, versión 2.0, nov-2022
  (https://s3.eu-west-1.amazonaws.com/data.gaezdev.aws.fao.org/documentation/GAEZ4_FAQ.pdf), pregunta 13: los resultados
  «should be treated in a conservative manner» … «appropriate aggregation levels, which are commensurate with the resolution
  of basic data»; pregunta 16: «It is generally not recommended to calculate statistics at finer administrative levels with
  this version of the database.» Celdas de 5' (unos 9 km). Los suelos de GAEZ v4 son de HWSD v1.21. Es contexto de la
  zona, nunca un valor de la parcela.
"""
import collections
import csv
import os
import statistics

from comun import carpeta, registrar_fuentes

CULTIVO = {"Alfalfa": "alfalfa", "Cotton": "algodon", "Sorghum": "sorgo", "Oat": "cereal_invierno", "Maize": "maiz_forrajero"}
CLASES = {1: "Very high", 2: "High", 3: "Good", 4: "Medium", 5: "Moderate", 6: "Marginal", 7: "Very marginal",
          8: "Not suitable", 9: "No cultivation", 10: "Water"}
RESOLUCION_M = round(0.08333333 * 111320)          # 5 minutos de arco en el ecuador (tamaño de celda del servicio)
UNIDAD = {"Index": "Index (0–10000)", "Class": "Class"}
NOTA_MAIZ = ("Maize de GAEZ = maíz de grano (mze): el tema res05 no tiene capa de maíz para ensilaje (mzs) con insumos altos y "
             "riego por gravedad; el valor es de grano, no de forraje")


def main():
    a = carpeta("G1: GAEZ v4 por zona", lambda ap: ap.add_argument("--crudo", required=True))
    filas = list(csv.DictReader(open(os.path.join(a.crudo, "gaez_celdas.csv"))))
    grupos = collections.defaultdict(list)
    for r in filas:
        url, nombre = r["download_url"], r["name"]
        if "/res05/CRUTS32/Hist/8110H/" not in url or not nombre[2:].startswith("Hg_") or r["water_supply"] != "Gravity Irrigation":
            raise SystemExit(f"Fila fuera de la consulta declarada: {nombre} {url}")
        grupos[(r["zona"], r["crop"], r["variable"], r["units"], url)].append(float(r["value"]))
    out, leidos = [], collections.Counter()
    for (zona, crop, variable, unidad, url), vals in sorted(grupos.items()):
        leidos[crop] += 1
        if crop not in CULTIVO:
            continue
        es_clase = unidad == "Class"
        valor = collections.Counter(int(v) for v in vals).most_common(1)[0][0] if es_clase else statistics.median(vals)
        out.append({"zona": zona, "cultivo": CULTIVO[crop], "variable": variable, "valor": round(valor, 1),
                    "unidad": UNIDAD.get(unidad, unidad), "resolucion_m": RESOLUCION_M, "cultivo_gaez": crop,
                    "agua": "Gravity Irrigation", "insumos": "High", "periodo": "1981-2010", "n_celdas": len(vals),
                    "valor_min": min(vals), "valor_max": max(vals), "clase_nombre": CLASES.get(int(valor), "") if es_clase else "",
                    "url_fao": url, "nota": NOTA_MAIZ if crop == "Maize" else ""})
    with open("gaez_zona.csv", "w", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=list(out[0].keys()))
        w.writeheader()
        w.writerows(out)
    registrar_fuentes("G1", ["gaez_zona.csv"],
                      "GAEZ v4 de FAO e IIASA (Global Agro-Ecological Zones version 4), tema res05 «Suitability and Attainable Yield», "
                      "servicio https://gaez-services.fao.org/server/rest/services/res05/ImageServer (getSamples), leído el 14-nov-2026; "
                      "CRU TS 3.2, 1981–2010, insumos altos, riego por gravedad; cita: FAO and IIASA, GAEZ v4, http://www.fao.org/gaez/; "
                      "modelo: Fischer et al. 2021, doi:10.4060/cb4744en; licencia de las capas: CC BY-NC-SA (versión 4.0 o 3.0 IGO según "
                      "la ficha del catálogo de FAO); Maize = maíz de grano (res05 no tiene capa de maíz para ensilaje con estos ajustes)",
                      "datos/colab/G1_gaez_zona.py")
    for r in out:
        print(f"{r['zona']:18s} {r['cultivo']:16s} {r['variable'][:60]:60s} {r['valor']:>9} {r['unidad'][:16]:16s} {r['clase_nombre']}")
    print("Cultivos leídos:", dict(leidos))


if __name__ == "__main__":
    main()
