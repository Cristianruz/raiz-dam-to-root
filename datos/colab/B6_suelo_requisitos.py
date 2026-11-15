# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""B6 · Requisitos de suelo por cultivo, con fuente (contrato: docs/decisiones/2026-11-14_suelo_aptitud.md del integrador).

Salida: suelo_requisitos.json  {fuente, grupos_textura, cultivos: {<cultivo>: {ph, textura, salinidad_umbral_ds_m, nutrientes}}}
Uso:    python B6_suelo_requisitos.py --dir data/reto --opciones data/entrega_zonas/opciones_b3.json

Reglas:
- Cada rango se leyó de su fuente el 14-nov-2026 (fichas de FAO ECOCROP en ecocrop.apps.fao.org y páginas «Crop
  information» de FAO Tierras y Aguas). Los valores están transcritos aquí con su liga; el script no descarga nada.
- Lo que no tiene fuente va en null. No se completa con valores de memoria.
- pH: «optimo» = rango óptimo de la fuente; «tolerado» = rango absoluto de la fuente.
- Textura: ECOCROP usa grupos (heavy, medium, light, wide). La ficha de ECOCROP no define a qué clases del USDA
  corresponde cada grupo: el reparto de las 12 clases en tres grupos es un supuesto propio [S] (grupos_textura).
  «apta» = clases de los grupos que la fuente da como óptimos o tolerados; «limitante» = las demás.
- Salinidad: el umbral de FAO-29 que ya trae opciones_b3.json (filtro «salinidad»); no se vuelve a transcribir.
- Nutrientes: solo avisos con fuente local. No hay mapa abierto de hierro, zinc, fósforo o potasio por parcela.
"""
import json

from comun import carpeta, registrar_fuentes

LEIDO = "leído el 14-nov-2026"
ECO = lambda i, sp: f"FAO ECOCROP, ficha de {sp} (https://ecocrop.apps.fao.org/ecocrop/srv/en/dataSheet?id={i}), {LEIDO}"
FAO_LW = lambda c, n: (f"FAO Tierras y Aguas, «Crop information: {n}» "
                       f"(https://www.fao.org/land-water/databases-and-software/crop-information/{c}), {LEIDO}")
GRUPOS = {"light": ["sand", "loamy sand", "sandy loam"],
          "medium": ["loam", "silt loam", "silt", "sandy clay loam", "clay loam", "silty clay loam"],
          "heavy": ["sandy clay", "silty clay", "clay"]}
TODAS = GRUPOS["light"] + GRUPOS["medium"] + GRUPOS["heavy"]


def textura(aptos, fuente, etiqueta="[V] grupos de la fuente; reparto en clases USDA assumption [S]", limitante=None):
    apta = [c for g in aptos for c in GRUPOS[g]] if aptos != "todas" else list(TODAS)
    lim = limitante if limitante is not None else [c for c in TODAS if c not in apta]
    return {"apta": [c for c in apta if c not in lim], "limitante": lim, "fuente": fuente, "etiqueta": etiqueta}


def ph(optimo, tolerado, fuente):
    return {"optimo": optimo, "tolerado": tolerado, "fuente": fuente, "etiqueta": "[V]"}


GUTIERREZ = ("Gutiérrez González, L.S. et al. (2022), «Análisis del suelo y su importancia en el cultivo del nogal pecanero en el "
             "Distrito de Riego 05 Delicias», Revista Biológico Agropecuaria Tuxpan 10(1), DOI 10.47808/revistabioagro.v10i1.395 "
             f"(resumen en https://agris.fao.org/search/en/records/67598d78c7a957febdfbf098, {LEIDO}): análisis de 2018 a mayo de 2021 "
             "de huertas de Delicias, Saucillo, Meoqui, Rosales y Julimes; «solo el 14% de los suelos tienen un pH de 6.7 a 7.3», el resto "
             "es alcalino, y «la mayoría de los suelos presentan concentraciones bajas de nitrógeno, fosforo, zinc, hierro y cobre»")

CULTIVOS = {
    "alfalfa": {
        "especie": "Medicago sativa",
        "ph": ph([6.5, 7.5], [4.3, 8.7], ECO(1428, "Medicago sativa")),
        "textura": textura(["medium", "light"], ECO(1428, "Medicago sativa") + ": óptima «medium, light»; absoluta «medium, light»"),
        "nutrientes": []},
    "nogal": {
        "especie": "Carya illinoinensis",
        "ph": None, "textura": None,
        "nota": "No se encontró ficha de ECOCROP para el nogal pecanero ni otra tabla de rangos con fuente: sin rango publicado.",
        "nutrientes": [
            {"elemento": e, "condicion": None,
             "texto_en": "Soil tests from pecan orchards in this irrigation district (2018–2021) found most soils low in nitrogen, "
                         "phosphorus, zinc, iron and copper, and most soils alkaline. This is a district-wide finding, not a "
                         "measurement of this field: it needs a soil test.",
             "fuente": GUTIERREZ, "etiqueta": "[V] resumen del artículo; sin cifras por parcela"}
            for e in ("Zn", "Fe", "N", "P", "Cu")]},
    "chile": {
        "especie": "Capsicum annuum",
        "ph": ph([5.5, 6.8], [4.5, 7.0], ECO(618, "Capsicum annuum") + ". Segunda fuente: "
                 + FAO_LW("pepper", "Pepper") + ": «Optimum pH is 5.5 to 7.0»"),
        "textura": textura(["medium", "light"], ECO(618, "Capsicum annuum") + ": óptima «medium, organic»; absoluta «medium, light»"),
        "nutrientes": []},
    "algodon": {
        "especie": "Gossypium hirsutum",
        "ph": ph([7.0, 8.0], [5.5, 8.0], FAO_LW("cotton", "Cotton") + ": «The pH range is 5.5 to 8 with 7 to 8 regarded as optimum»"),
        "textura": textura("todas", FAO_LW("cotton", "Cotton") + ": «grown on a wide range of soils but medium and heavy textured, "
                           "deep soils with good water holding characteristics are preferred»", limitante=[]),
        "nutrientes": []},
    "maiz_forrajero": {
        "especie": "Zea mays",
        "ph": ph([5.0, 7.0], [4.5, 8.5], ECO(2175, "Zea mays")),
        "textura": textura("todas", FAO_LW("maize", "Maize") + ": «does well on most soils but less so on very heavy dense clay and "
                           "very sandy soils». La ficha de ECOCROP no trae textura", limitante=["clay", "sand"],
                           etiqueta="[V] texto de la fuente; lectura en clases USDA assumption [S]"),
        "nutrientes": []},
    "sorgo": {
        "especie": "Sorghum bicolor",
        "ph": ph([5.5, 7.5], [5.0, 8.0], ECO(48747, "Sorghum bicolor")),
        "textura": textura("todas", ECO(48747, "Sorghum bicolor") + ": óptima «heavy, medium»; absoluta «wide»", limitante=[]),
        "nutrientes": []},
    "cereal_invierno": {
        "especie": "Avena sativa (representa a la clase; el mapa agrupa avena, triticale, trigo y cebada)",
        "ph": ph([5.0, 6.0], [4.5, 7.5], ECO(481, "Avena sativa")),
        "textura": textura("todas", ECO(481, "Avena sativa") + ": óptima y absoluta «heavy, medium, light»", limitante=[]),
        "nutrientes": []},
}
SAL = {"alfalfa": "alfalfa", "chile": "chile", "algodon": "algodon", "maiz_forrajero": "maiz_forrajero", "sorgo": "sorgo"}


def main():
    a = carpeta("B6: requisitos de suelo por cultivo", lambda ap: ap.add_argument("--opciones", required=True))
    filtro = [f for f in json.load(open(a.opciones))["filtros"] if f["id"] == "salinidad"][0]
    for c, d in CULTIVOS.items():
        r = filtro["regla"].get(SAL.get(c, ""))
        d["salinidad_umbral_ds_m"] = ({"valor": r["umbral"], "perdida_pct_por_ds_m": r["perdida"],
                                       "fuente": filtro["fuente"] + " (tomado de opciones_b3.json, filtro «salinidad»)",
                                       "etiqueta": "[V]"} if r else None)
    CULTIVOS["cereal_invierno"]["nota"] = filtro["regla"]["nota"]
    out = {"fuente": "FAO ECOCROP (fichas por especie, ecocrop.apps.fao.org) y FAO Tierras y Aguas («Crop information») para pH y textura; "
                     "FAO-29, Tabla 4, para salinidad (vía opciones_b3.json); Gutiérrez González et al. (2022) para nutrientes en nogal. "
                     f"Todo {LEIDO}; cada bloque lleva su liga",
           "nota": "Rangos GENERALES y mundiales: no son ensayos del DR-005. Varios cultivos que sí se siembran en la zona quedan fuera de "
                   "su rango general de pH con el pH del mapa (~8.1); el mapa de suelo es un modelo de 250 m. No usar como filtro que "
                   "descarte opciones: es una evidencia más",
           "grupos_textura": {"valor": GRUPOS, "etiqueta": "assumption [S]",
                              "fuente": "Reparto propio de las 12 clases de textura del USDA en los grupos light, medium y heavy de ECOCROP; "
                                        "la ficha de ECOCROP no define sus grupos"},
           "cultivos": CULTIVOS,
           "sin_requisitos": {"forraje_verano": "clase agrupada del mapa (maíz o sorgo forrajero): usar maiz_forrajero o sorgo",
                              "barbecho": "sin cultivo"}}
    json.dump(out, open("suelo_requisitos.json", "w"), ensure_ascii=False, indent=1)
    registrar_fuentes("B6", ["suelo_requisitos.json"], out["fuente"], "datos/colab/B6_suelo_requisitos.py")
    for c, d in CULTIVOS.items():
        print(f"{c:16s} pH", d["ph"] and (d["ph"]["optimo"], d["ph"]["tolerado"]), "· limitante",
              d["textura"] and d["textura"]["limitante"], "· sal", d["salinidad_umbral_ds_m"] and d["salinidad_umbral_ds_m"]["valor"],
              "· avisos", len(d["nutrientes"]))


if __name__ == "__main__":
    main()
