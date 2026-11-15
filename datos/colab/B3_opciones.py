# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""B3 · Opciones y filtros oficiales por cultivo actual (decisión del integrador del 14-nov-2026, 16:25).

Todo sale del documento maestro del proyecto, §5.2 «Rotaciones candidatas» y «Filtros duros» (versión 3.1, 29-oct-2026),
y del expediente de datos 27, §2.3 (INIFAP, Agenda Técnica Chihuahua 2017). Aquí solo va el contenido con su referencia;
los documentos no se copian. Lo que el maestro no dice o no tiene fuente va en null. Nada de memoria.

Salida: opciones_b3.json (contrato en docs/decisiones/2026-11-14_opciones_b3.md de la rama del integrador).
Uso: python B3_opciones.py --dir <carpeta> --rotaciones <rotaciones.json> [<rotaciones de otra zona> …]
Comprueba que cada opción exista en rotaciones.json de todas las zonas.
"""
import json

from comun import carpeta, registrar_fuentes

MAESTRO = "Project master document, §5.2 (v3.1, Oct 29, 2026)"
INIFAP17 = "INIFAP, Agenda Técnica Agrícola de Chihuahua 2017"
SIN_DATO = "dato local que no tenemos"


def sec(ciclo, cultivo, desde, hasta, fuente):
    return {"ciclo": ciclo, "cultivo": cultivo, "siembra": {"desde": desde, "hasta": hasta}, "fuente": fuente}


def ind(leg, plagas, raiz, fuente):
    return {"leguminosa": leg, "ruptura_plagas": plagas, "raiz_profunda": raiz, "fuente": fuente}


# Ventanas de siembra con fuente (las que el maestro o el expediente 27 traen). Lo demás, null.
S_ALFALFA = ("09-15", "10-31", f"{INIFAP17}: best planting from Sep 15 to Oct 31 ({MAESTRO})")
S_ALGODON = ("04-01", "05-10", f"{INIFAP17}: Southeast–Delicias, from Apr 1 to May 10 (best from Apr 20 to 30) ({MAESTRO})")
S_MAIZ = ("04-01", "05-31", f"INIFAP, Folleto Técnico 53 (2014): irrigated spring planting from Apr 1 to May 31 ({MAESTRO})")
S_CEREAL = ("11-01", "12-31", f"{MAESTRO}, option A: autumn–winter oats or triticale, «Nov–Dec»; winter irrigation in Delicias not verified. The demand model plants on Dec 1 (midpoint of the window) [S]")
S_CHILE = ("02-01", None, "SDR Chihuahua, Mar 3, 2026: chile from February in the south-central region (data dossier 27, §2.3); it is a practice, not an absence of frost risk. No closing date in the sources")
S_SORGO = (None, None, "No sorghum planting date in the master document or in data dossier 27")

OPCIONES = {
    # --- Rotación actual de cada cultivo (el motor la pone siempre; aquí van sus fechas y fuentes) ---
    "alfalfa": {
        "letra_maestro": "ACTUAL", "nombre_en": "Alfalfa",
        "secuencia": [sec("OI", "alfalfa", *S_ALFALFA)],
        "indicadores": ind(True, None, None, "Legume: botanical classification of alfalfa (not from the master document). The rest: no data in the master document"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. Alfalfa is kept for 3–4 years; INIFAP reports 170–180 cm of irrigation per year in Chihuahua.",
        "fuente": f"{MAESTRO}, «typical current»; {INIFAP17} (170–180 cm of irrigation per year; 40 cm to establish)", "etiqueta": "[V]"},
    "nogal": {
        "letra_maestro": "nogal_no_rota", "nombre_en": "Pecan orchard (does not rotate)",
        "secuencia": [sec("perenne", "nogal", None, None, "Not applicable: established orchard")],
        "indicadores": ind(False, None, None, "No data in the master document"),
        "advertir_si_rojo": False,
        "por_que_en": "An orchard does not rotate. Minimum-irrigation scenarios are the ones that apply, and kernel filling (August–September) should not be put at risk.",
        "fuente": f"{MAESTRO}, «Pecan»: does not rotate; ~1.5–1.82 m of irrigation; do not put kernel filling at risk (Aug–Sep)", "etiqueta": "[V]"},
    "chile": {
        "letra_maestro": "ACTUAL", "nombre_en": "Chile pepper",
        "secuencia": [sec("PV", "chile", *S_CHILE)],
        "indicadores": ind(False, False, None, f"{MAESTRO}: chile followed by bare fallow from Nov to Mar; «much bare soil»"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. Chile followed by bare fallow from November to March leaves the soil uncovered in the windy season.",
        "fuente": f"{MAESTRO}, «typical current»", "etiqueta": "[V]"},
    "algodon": {
        "letra_maestro": "ACTUAL", "nombre_en": "Cotton",
        "secuencia": [sec("PV", "algodon", *S_ALGODON)],
        "indicadores": ind(False, None, None, "No data in the master document"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. INIFAP reports about 68 cm of irrigation for cotton in Delicias; stalks must be destroyed before November 30.",
        "fuente": f"{INIFAP17}: ~68 cm (20 cm pre-planting irrigation + 48 cm in 4–5 supplementary irrigations); NOM-026 ({MAESTRO}, option C)", "etiqueta": "[V]"},
    "maiz_forrajero": {
        "letra_maestro": "ACTUAL", "nombre_en": "Forage maize",
        "secuencia": [sec("PV", "maiz_forrajero", *S_MAIZ)],
        "indicadores": ind(False, None, None, "No data in the master document"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. INIFAP reports 5 irrigations of 10–12 cm (50–60 cm in total) for spring forage maize in Chihuahua.",
        "fuente": f"INIFAP, Folleto Técnico 53 (2014) ({MAESTRO}, option A)", "etiqueta": "[V]"},
    "sorgo": {
        "letra_maestro": "ACTUAL", "nombre_en": "Forage sorghum",
        "secuencia": [sec("PV", "sorgo", *S_SORGO)],
        "indicadores": ind(False, None, None, "No data in the master document"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. The project documents give no local planting date or irrigation depth for sorghum.",
        "fuente": "Current crop seen by the A4 rules (crop map). The master document §5.2 and data dossier 27 give no sorghum planting date or irrigation depth; the depth is the demand model's (A5)",
        "etiqueta": "assumption [S]"},
    "cereal_invierno": {
        "letra_maestro": "ACTUAL", "nombre_en": "Winter cereal",
        "secuencia": [sec("OI", "cereal_invierno", *S_CEREAL)],
        "indicadores": ind(False, None, None, "No data in the master document"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. Irrigated winter oats or triticale are not verified for Delicias; the single depth found (about 54 cm) comes from La Laguna.",
        "fuente": f"{MAESTRO}, option A: ~54 cm (Ochoa-Espinoza 2022, La Laguna, not Delicias)", "etiqueta": "assumption [S]"},
    # --- Alternativas del maestro ---
    "avena_maiz": {
        "letra_maestro": "A", "nombre_en": "Break the old alfalfa: winter cereal, then forage maize",
        "secuencia": [sec("OI", "cereal_invierno", *S_CEREAL), sec("PV", "maiz_forrajero", *S_MAIZ),
                      sec("OI", "alfalfa", S_ALFALFA[0], S_ALFALFA[1], S_ALFALFA[2] + "; alfalfa is sown again after a year, with at least 12 months between stands")],
        "indicadores": ind(False, None, None, "No data in the master document for this sequence"),
        "advertir_si_rojo": False,
        "por_que_en": "Suggested for an old alfalfa stand: one year of winter cereal and forage maize before sowing alfalfa again, because alfalfa should not follow alfalfa for at least 12 months.",
        "fuente": f"{MAESTRO}, option A; forage maize: INIFAP, Folleto Técnico 53 (2014); winter cereal ~54 cm: Ochoa-Espinoza 2022 (La Laguna, not Delicias)",
        "etiqueta": "[V] forage maize and alfalfa; assumption [S] irrigated winter cereal in Delicias"},
    "alfalfa_corte_verano": {
        "letra_maestro": "B", "nombre_en": "Keep the alfalfa and skip two to three summer irrigations",
        "secuencia": [sec("OI", "alfalfa", None, None, "Nothing is planted: the established alfalfa is kept")],
        "indicadores": ind(True, None, None, "Legume: botanical classification of alfalfa (not from the master document)"),
        "advertir_si_rojo": True,
        "por_que_en": "Keeps the stand and plans a summer rest: 2–3 irrigations are skipped between July and September. Trials report that yield always drops and that stand survival depends on the soil.",
        "fuente": f"{MAESTRO}, option B (moderate variant, update of Oct 29): INIFAP La Laguna 2008; UC ANR 8522 (2015); Bali et al. 2024. Trials from other regions; no published trial in DR-005",
        "etiqueta": "[V] trials from other regions; assumption [S] for DR-005"},
    "cereal_algodon": {
        "letra_maestro": "C", "nombre_en": "Break the chile cycle: winter cereal, then cotton",
        "secuencia": [sec("OI", "cereal_invierno", *S_CEREAL), sec("PV", "algodon", *S_ALGODON)],
        "indicadores": ind(False, True, None, f"{MAESTRO}, option C: P. capsici is managed by rotation (INIFAP; Silva-Rojas et al. 2009)"),
        "advertir_si_rojo": False,
        "por_que_en": "Suggested after chile: Phytophthora capsici is managed by rotation, and local research asks for at least 5 years without host crops after an outbreak. It is two crops in a year, so it can need more water than chile alone.",
        "fuente": f"{MAESTRO}, option C: INIFAP («do not plant chile after chile»); Silva-Rojas et al. 2009 (Delicias and Camargo); cotton: {INIFAP17}",
        "etiqueta": "[V] rotation rule and cotton; assumption [S] irrigated winter cereal in Delicias"},
    "cereal_sorgo": {
        "letra_maestro": "C", "nombre_en": "Break the chile cycle: winter cereal, then forage sorghum",
        "secuencia": [sec("OI", "cereal_invierno", *S_CEREAL), sec("PV", "sorgo", *S_SORGO)],
        "indicadores": ind(False, True, None, f"{MAESTRO}, option C: P. capsici is managed by rotation (INIFAP; Silva-Rojas et al. 2009)"),
        "advertir_si_rojo": False,
        "por_que_en": "Suggested after chile: Phytophthora capsici is managed by rotation, and local research asks for at least 5 years without host crops after an outbreak. It is two crops in a year, so it can need more water than chile alone.",
        "fuente": f"{MAESTRO}, option C: INIFAP («do not plant chile after chile»); Silva-Rojas et al. 2009 (Delicias and Camargo)",
        "etiqueta": "[V] rotation rule; assumption [S] winter cereal and sorghum (no local date or depth)"},
    "descanso": {
        "letra_maestro": "no_sembrar", "nombre_en": "Do not plant / standing stubble",
        "secuencia": [],
        "indicadores": ind(False, None, None, f"{MAESTRO}, option E: standing stubble protects against erosion"),
        "advertir_si_rojo": False,
        "por_que_en": "Worst-case option: the field rests with standing stubble, which asks for no irrigation and protects the soil from wind. Income is low.",
        "fuente": f"{MAESTRO}, option E («the rest rests with standing stubble»; low income)", "etiqueta": "[V]"},
}

# Alternativas del maestro por cultivo actual (la opción ACTUAL no se lista).
POR_CULTIVO = {
    "alfalfa": ["alfalfa_corte_verano", "avena_maiz", "descanso"],
    "chile": ["cereal_algodon", "cereal_sorgo", "descanso"],
    "nogal": [],
    "algodon": ["descanso"], "maiz_forrajero": ["descanso"], "sorgo": ["descanso"], "forraje_verano": ["descanso"],
    "cereal_invierno": ["descanso"], "barbecho": [],
}

SAL = "FAO-29, Table 4 (ECe threshold of the soil saturation extract, dS/m, and yield loss per dS/m above it); values from S2 §3, which the master document declares current"
FILTROS = [
    {"id": "fecha_siembra", "tipo": "fecha_limite",
     "aplica_a": ["alfalfa", "algodon", "maiz_forrajero", "chile", "cereal_invierno", "avena_maiz", "cereal_algodon", "cereal_sorgo"],
     "regla": {"ventana_por_cultivo": "the one in «secuencia.siembra» of each option (MM-DD)", "sorgo": None},
     "necesita": [],
     "texto_en": "Planting must fall inside the window reported for the crop.",
     "fuente": f"{MAESTRO}, filter 1 (INIFAP planting dates by crop); no local window was found for sorghum, so the rule does not cover it", "etiqueta": "[V]"},
    {"id": "helada_siembra", "tipo": "helada", "aplica_a": ["chile"],
     "regla": {"helada": "Tmin <= 0 °C", "umbral_de_probabilidad": None,
               "nota": "the master document sets no threshold: the frost probability of heladas.json for the planting date is shown and nothing is decided"},
     "necesita": ["heladas.json"],
     "texto_en": "Chile planted from February is exposed to late frost. The card shows the chance of frost after the planting date; it does not decide.",
     "fuente": f"{MAESTRO}, filter 2; probability computed with NASA POWER (heladas.json). INEGI 1983: last frost in March and earliest in November",
     "etiqueta": "[V] rule; the probability is for a regional grid cell, not a station"},
    {"id": "chile_sin_solanaceas", "tipo": "sucesion", "aplica_a": ["chile"],
     "regla": {"no_chile_despues_de_chile": True, "anios_sin_hospedante_tras_phytophthora_min": 5, "anios_rotacion_inifap": 4},
     "necesita": ["memoria", SIN_DATO],
     "texto_en": "Do not plant chile after chile. After a Phytophthora capsici outbreak, keep at least 5 years without host crops. The satellite memory shows summer crops but not which crop, so this needs a local check.",
     "fuente": f"{MAESTRO}, filter 3: Silva-Rojas et al. 2009 (Delicias and Camargo; the stricter criterion is adopted); INIFAP gives 4 years", "etiqueta": "[V]"},
    {"id": "soca_algodon", "tipo": "fecha_limite", "aplica_a": ["algodon", "cereal_algodon"],
     "regla": {"desarraigo_antes_de": "11-30", "desvare_dias_tras_cosecha_max": 10},
     "necesita": [],
     "texto_en": "Cotton stalks must be shredded within 10 days after harvest and uprooted before November 30 (official plant-health rule NOM-026).",
     "fuente": f"{MAESTRO}, filter 4; {INIFAP17} (NOM-026)", "etiqueta": "[V]"},
    {"id": "alfalfa_no_en_anio_seco", "tipo": "dotacion_minima", "aplica_a": ["avena_maiz"],
     "regla": {"lamina_minima_cm": 40, "riegos": 5, "lamina_por_riego_cm": 8,
               "nota": "compared live with the chosen allocation; 40 cm = 4 thousand m³/ha just to establish the alfalfa"},
     "necesita": [],
     "texto_en": "Alfalfa should not be established in a dry year: it needs about 40 cm of irrigation just to establish.",
     "fuente": f"{MAESTRO}, filter 5; {INIFAP17} (40 cm in five irrigations of 8 cm)", "etiqueta": "[V]"},
    {"id": "alfalfa_tras_alfalfa", "tipo": "intervalo", "aplica_a": ["avena_maiz"],
     "regla": {"meses_entre_alfalfas_min": 12},
     "necesita": ["memoria"],
     "texto_en": "Leave at least 12 months between one alfalfa stand and the next (autotoxicity).",
     "fuente": f"{MAESTRO}, filter 6. Fundación Produce Chihuahua gives a minimum of 6–7 months (secondary source); the stricter value is adopted", "etiqueta": "[V]"},
    {"id": "salinidad", "tipo": "salinidad",
     "aplica_a": ["alfalfa", "alfalfa_corte_verano", "chile", "algodon", "maiz_forrajero", "sorgo", "cereal_invierno", "avena_maiz", "cereal_algodon", "cereal_sorgo"],
     "regla": {"unidad": "ECe en dS/m; pérdida en % por cada dS/m por encima del umbral",
               "alfalfa": {"umbral": 2.0, "perdida": 7.1}, "maiz_forrajero": {"umbral": 1.8, "perdida": 7.6},
               "sorgo": {"umbral": 6.8, "perdida": 16.1}, "chile": {"umbral": 1.5, "perdida": 14.1},
               "algodon": {"umbral": 7.7, "perdida": 5.2}, "trigo": {"umbral": 6.0, "perdida": 7.1},
               "cebada": {"umbral": 8.0, "perdida": 5.0}, "avena_y_triticale": None,
               "nota": "oats and triticale have no numeric threshold in FAO-29 («moderately tolerant»). The ECe of the soil is not the EC of the irrigation water"},
     "necesita": [SIN_DATO],
     "texto_en": "Salt tolerance differs by crop (FAO thresholds for soil salinity). There is no measured soil salinity for this field, so this needs a local check.",
     "fuente": f"{MAESTRO}, filter 7: {SAL}. Cotton, wheat and barley: list of the same filter", "etiqueta": "[V] thresholds; no measurement per field"},
    {"id": "atrazina", "tipo": "residuo_herbicida", "aplica_a": ["avena_maiz", "cereal_algodon", "cereal_sorgo", "cereal_invierno"],
     "regla": {"espera_meses": {"min": 5, "max": 10}, "trigo_meses_min": 5, "solo_maiz_hasta_meses": 7,
               "cultivos_sensibles_meses_min": 10, "alfalfa": "no sembrar"},
     "necesita": [SIN_DATO],
     "texto_en": "If atrazine was used on the previous maize or sorghum, labels ask to wait 5–10 months depending on the next crop and not to sow alfalfa. Check the label of the exact product.",
     "fuente": f"{MAESTRO}, filter 8: Mexican atrazine labels (Tridente and ADAMA), verified in S2 §3", "etiqueta": "[V]"},
    {"id": "corte_verano_alfalfa_establecida", "tipo": "sucesion", "aplica_a": ["alfalfa_corte_verano"],
     "regla": {"no_en_primer_anio": True, "edad_min_anios": 2},
     "necesita": ["memoria"],
     "texto_en": "For an established stand; never in its year of establishment.",
     "fuente": f"{MAESTRO}, option B: offered for an established alfalfa stand, never in its year of establishment", "etiqueta": "[V]"},
    {"id": "corte_verano_suelo", "tipo": "salinidad", "aplica_a": ["alfalfa_corte_verano"],
     "regla": {"suelo": "profundo y no arenoso", "salinidad_alta": "no se ofrece", "salinidad_media": "se descuenta un lavado de 0–25 %",
               "riesgo_alto": "arcillas pesadas con calor extremo"},
     "necesita": [SIN_DATO],
     "texto_en": "Skipping summer irrigations is reasonable on deep, non-sandy soil without high salinity, and not elsewhere; risk is high on heavy clay under extreme heat. Soil texture and salinity are not measured for this field: needs a local check.",
     "fuente": f"{MAESTRO}, option B and its update of Oct 29 (Bali et al. 2024; UC ANR 8522)", "etiqueta": "[V] trials from other regions"},
]

FUERA = {
    "D_avena_veza": "Option D of the master document (autumn–winter oat–vetch). Not delivered: the demand model (A5) has no sourced crop coefficient for the mix, and the master document marks seed, buyer and calendar in Delicias as not verified.",
    "E_sorgo_con_1_2_auxilios": "Option E of the master document (sorghum with 1–2 supplementary irrigations). Not delivered as such: A5 computes sorghum with its full demand and the sources give no depth for a supplementary sorghum irrigation. The part «the rest rests with standing stubble» is the «descanso» option.",
}


def main():
    a = carpeta("B3: opciones y filtros", lambda ap: ap.add_argument("--rotaciones", nargs="+", required=True))
    for ruta in a.rotaciones:
        ids = {r["id"] for r in json.load(open(ruta))["rotaciones"]}
        faltan = [k for k in OPCIONES if k not in ids]
        if faltan:
            raise SystemExit(f"Opciones que no existen en {ruta}: {faltan}")
    usadas = {x for v in POR_CULTIVO.values() for x in v} | {x for f in FILTROS for x in f["aplica_a"]}
    if usadas - set(OPCIONES):
        raise SystemExit(f"Ids sin definir en «opciones»: {sorted(usadas - set(OPCIONES))}")
    out = {"_encabezado": "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026",
           "fuente": f"{MAESTRO}, «Candidate rotations» and «Hard filters»; data dossier 27, §2.3 (INIFAP, Agenda Técnica "
                     "Agrícola de Chihuahua 2017). The primary sources are given in each option and each filter",
           "opciones": OPCIONES, "por_cultivo_actual": POR_CULTIVO, "filtros": FILTROS,
           "opciones_del_maestro_no_entregadas": FUERA}
    json.dump(out, open("opciones_b3.json", "w"), ensure_ascii=False, indent=1)
    registrar_fuentes("B3", ["opciones_b3.json"], out["fuente"], "datos/colab/B3_opciones.py")
    print(f"{len(OPCIONES)} opciones · {len(FILTROS)} filtros · alternativas por cultivo:", {k: len(v) for k, v in POR_CULTIVO.items()})


if __name__ == "__main__":
    main()
