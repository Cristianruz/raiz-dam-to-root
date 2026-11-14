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

MAESTRO = "Documento maestro del proyecto, §5.2 (v3.1, 29-oct-2026)"
INIFAP17 = "INIFAP, Agenda Técnica Agrícola de Chihuahua 2017"
SIN_DATO = "dato local que no tenemos"


def sec(ciclo, cultivo, desde, hasta, fuente):
    return {"ciclo": ciclo, "cultivo": cultivo, "siembra": {"desde": desde, "hasta": hasta}, "fuente": fuente}


def ind(leg, plagas, raiz, fuente):
    return {"leguminosa": leg, "ruptura_plagas": plagas, "raiz_profunda": raiz, "fuente": fuente}


# Ventanas de siembra con fuente (las que el maestro o el expediente 27 traen). Lo demás, null.
S_ALFALFA = ("09-15", "10-31", f"{INIFAP17}: siembra óptima del 15-sep al 31-oct ({MAESTRO})")
S_ALGODON = ("04-01", "05-10", f"{INIFAP17}: Sureste-Delicias, del 1-abr al 10-may (óptima del 20 al 30-abr) ({MAESTRO})")
S_MAIZ = ("04-01", "05-31", f"INIFAP, Folleto Técnico 53 (2014): siembra de primavera con riego del 1-abr al 31-may ({MAESTRO})")
S_CEREAL = ("11-01", "12-31", f"{MAESTRO}, opción A: avena o triticale de otoño-invierno, «nov–dic»; riego de invierno en Delicias no verificado")
S_CHILE = ("02-01", None, "SDR Chihuahua, 3-mar-2026: chile desde febrero en la región centro-sur (expediente 27 §2.3); es práctica, no ausencia de riesgo de helada. Sin fecha límite en las fuentes")
S_SORGO = (None, None, "Sin fecha de siembra de sorgo en el maestro ni en el expediente 27")

OPCIONES = {
    # --- Rotación actual de cada cultivo (el motor la pone siempre; aquí van sus fechas y fuentes) ---
    "alfalfa": {
        "letra_maestro": "ACTUAL", "nombre_en": "Alfalfa",
        "secuencia": [sec("OI", "alfalfa", *S_ALFALFA)],
        "indicadores": ind(True, None, None, "Leguminosa: clasificación botánica de la alfalfa (no viene del maestro). Lo demás, sin dato en el maestro"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. Alfalfa is kept for 3–4 years; INIFAP reports 170–180 cm of irrigation per year in Chihuahua.",
        "fuente": f"{MAESTRO}, «Actual típica»; {INIFAP17} (lámina de 170–180 cm/año; establecimiento con 40 cm)", "etiqueta": "[V]"},
    "nogal": {
        "letra_maestro": "nogal_no_rota", "nombre_en": "Pecan orchard (does not rotate)",
        "secuencia": [sec("perenne", "nogal", None, None, "No aplica: huerta establecida")],
        "indicadores": ind(False, None, None, "Sin dato en el maestro"),
        "advertir_si_rojo": False,
        "por_que_en": "An orchard does not rotate. Only minimum-irrigation scenarios apply, and kernel filling (August–September) should not be put at risk.",
        "fuente": f"{MAESTRO}, «Nogal»: no rota; lámina de ~1.5–1.82 m; no afectar el llenado de almendra (ago–sep)", "etiqueta": "[V]"},
    "chile": {
        "letra_maestro": "ACTUAL", "nombre_en": "Chile pepper",
        "secuencia": [sec("PV", "chile", *S_CHILE)],
        "indicadores": ind(False, False, None, f"{MAESTRO}: chile seguido de barbecho desnudo de nov a mar; «mucho suelo desnudo»"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. Chile followed by bare fallow from November to March leaves the soil uncovered in the windy season.",
        "fuente": f"{MAESTRO}, «Actual típica»", "etiqueta": "[V]"},
    "algodon": {
        "letra_maestro": "ACTUAL", "nombre_en": "Cotton",
        "secuencia": [sec("PV", "algodon", *S_ALGODON)],
        "indicadores": ind(False, None, None, "Sin dato en el maestro"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. INIFAP reports about 68 cm of irrigation for cotton in Delicias; stalks must be destroyed before November 30.",
        "fuente": f"{INIFAP17}: ~68 cm (presiembra de 20 cm + 48 cm en 4–5 auxilios); NOM-026 ({MAESTRO}, opción C)", "etiqueta": "[V]"},
    "maiz_forrajero": {
        "letra_maestro": "ACTUAL", "nombre_en": "Forage maize",
        "secuencia": [sec("PV", "maiz_forrajero", *S_MAIZ)],
        "indicadores": ind(False, None, None, "Sin dato en el maestro"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. INIFAP reports 5 irrigations of 10–12 cm (50–60 cm in total) for spring forage maize in Chihuahua.",
        "fuente": f"INIFAP, Folleto Técnico 53 (2014) ({MAESTRO}, opción A)", "etiqueta": "[V]"},
    "sorgo": {
        "letra_maestro": "ACTUAL", "nombre_en": "Forage sorghum",
        "secuencia": [sec("PV", "sorgo", *S_SORGO)],
        "indicadores": ind(False, None, None, "Sin dato en el maestro"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. The project documents give no local planting date or irrigation depth for sorghum.",
        "fuente": None, "etiqueta": "assumption [S]"},
    "cereal_invierno": {
        "letra_maestro": "ACTUAL", "nombre_en": "Winter cereal",
        "secuencia": [sec("OI", "cereal_invierno", *S_CEREAL)],
        "indicadores": ind(False, None, None, "Sin dato en el maestro"),
        "advertir_si_rojo": False,
        "por_que_en": "Current rotation. Irrigated winter oats or triticale are not verified for Delicias; the only depth found (about 54 cm) comes from La Laguna.",
        "fuente": f"{MAESTRO}, opción A: ~54 cm (Ochoa-Espinoza 2022, La Laguna, no Delicias)", "etiqueta": "assumption [S]"},
    # --- Alternativas del maestro ---
    "avena_maiz": {
        "letra_maestro": "A", "nombre_en": "Break the old alfalfa: winter cereal, then forage maize",
        "secuencia": [sec("OI", "cereal_invierno", *S_CEREAL), sec("PV", "maiz_forrajero", *S_MAIZ),
                      sec("OI", "alfalfa", S_ALFALFA[0], S_ALFALFA[1], S_ALFALFA[2] + "; se resiembra al año, con al menos 12 meses entre alfalfas")],
        "indicadores": ind(False, None, None, "Sin dato en el maestro para esta secuencia"),
        "advertir_si_rojo": False,
        "por_que_en": "Suggested for an old alfalfa stand: one year of winter cereal and forage maize before sowing alfalfa again, because alfalfa should not follow alfalfa for at least 12 months.",
        "fuente": f"{MAESTRO}, opción A; maíz forrajero: INIFAP, Folleto Técnico 53 (2014); cereal de invierno ~54 cm: Ochoa-Espinoza 2022 (La Laguna, no Delicias)",
        "etiqueta": "[V] maíz forrajero y alfalfa; assumption [S] cereal de invierno con riego en Delicias"},
    "alfalfa_corte_verano": {
        "letra_maestro": "B", "nombre_en": "Keep the alfalfa and skip 2–3 summer irrigations",
        "secuencia": [sec("OI", "alfalfa", None, None, "No se siembra: se mantiene la alfalfa establecida")],
        "indicadores": ind(True, None, None, "Leguminosa: clasificación botánica de la alfalfa (no viene del maestro)"),
        "advertir_si_rojo": True,
        "por_que_en": "Keeps the stand and plans a summer rest: 2–3 irrigations are skipped between July and September. Trials report that yield always drops and that stand survival depends on the soil.",
        "fuente": f"{MAESTRO}, opción B (variante moderada, actualización del 29-oct): INIFAP La Laguna 2008; UC ANR 8522 (2015); Bali et al. 2024. Ensayos de otras regiones; sin ensayo publicado en el DR-005",
        "etiqueta": "[V] ensayos de otras regiones; assumption [S] para el DR-005"},
    "cereal_algodon": {
        "letra_maestro": "C", "nombre_en": "Break the chile cycle: winter cereal, then cotton",
        "secuencia": [sec("OI", "cereal_invierno", *S_CEREAL), sec("PV", "algodon", *S_ALGODON)],
        "indicadores": ind(False, True, None, f"{MAESTRO}, opción C: P. capsici se controla con rotación (INIFAP; Silva-Rojas et al. 2009)"),
        "advertir_si_rojo": False,
        "por_que_en": "Suggested after chile: Phytophthora capsici is managed by rotation, and local research asks for at least 5 years without host crops after an outbreak. It is two crops in a year, so it can need more water than chile alone.",
        "fuente": f"{MAESTRO}, opción C: INIFAP («no sembrar chile después de chile»); Silva-Rojas et al. 2009 (Delicias y Camargo); algodón: {INIFAP17}",
        "etiqueta": "[V] regla de rotación y algodón; assumption [S] cereal de invierno con riego en Delicias"},
    "cereal_sorgo": {
        "letra_maestro": "C", "nombre_en": "Break the chile cycle: winter cereal, then forage sorghum",
        "secuencia": [sec("OI", "cereal_invierno", *S_CEREAL), sec("PV", "sorgo", *S_SORGO)],
        "indicadores": ind(False, True, None, f"{MAESTRO}, opción C: P. capsici se controla con rotación (INIFAP; Silva-Rojas et al. 2009)"),
        "advertir_si_rojo": False,
        "por_que_en": "Suggested after chile: Phytophthora capsici is managed by rotation, and local research asks for at least 5 years without host crops after an outbreak. It is two crops in a year, so it can need more water than chile alone.",
        "fuente": f"{MAESTRO}, opción C: INIFAP («no sembrar chile después de chile»); Silva-Rojas et al. 2009 (Delicias y Camargo)",
        "etiqueta": "[V] regla de rotación; assumption [S] cereal de invierno y sorgo (sin fecha ni lámina local)"},
    "descanso": {
        "letra_maestro": "no_sembrar", "nombre_en": "Do not plant / standing stubble",
        "secuencia": [],
        "indicadores": ind(False, None, None, f"{MAESTRO}, opción E: el rastrojo en pie protege contra la erosión"),
        "advertir_si_rojo": False,
        "por_que_en": "Worst-case option: the field rests with standing stubble, which asks for no irrigation and protects the soil from wind. Income is low.",
        "fuente": f"{MAESTRO}, opción E («el resto descansa con rastrojo en pie»; ingreso bajo)", "etiqueta": "[V]"},
}

# Alternativas del maestro por cultivo actual (la opción ACTUAL no se lista).
POR_CULTIVO = {
    "alfalfa": ["alfalfa_corte_verano", "avena_maiz", "descanso"],
    "chile": ["cereal_algodon", "cereal_sorgo", "descanso"],
    "nogal": [],
    "algodon": ["descanso"], "maiz_forrajero": ["descanso"], "sorgo": ["descanso"], "forraje_verano": ["descanso"],
    "cereal_invierno": ["descanso"], "barbecho": [],
}

SAL = "FAO-29, Tabla 4 (umbral de ECe del extracto de saturación del suelo, dS/m, y pérdida por cada dS/m de más); valores de S2 §3 que el maestro declara vigentes"
FILTROS = [
    {"id": "fecha_siembra", "tipo": "fecha_limite",
     "aplica_a": ["alfalfa", "algodon", "maiz_forrajero", "chile", "cereal_invierno", "avena_maiz", "cereal_algodon", "cereal_sorgo"],
     "regla": {"ventana_por_cultivo": "la de «secuencia.siembra» de cada opción (MM-DD)", "sorgo": None},
     "necesita": [],
     "texto_en": "Planting must fall inside the window reported for the crop. No local window was found for sorghum.",
     "fuente": f"{MAESTRO}, filtro 1 (fechas de siembra INIFAP por cultivo)", "etiqueta": "[V]"},
    {"id": "helada_siembra", "tipo": "helada", "aplica_a": ["chile"],
     "regla": {"helada": "Tmin <= 0 °C", "umbral_de_probabilidad": None,
               "nota": "el maestro no fija umbral: se muestra la probabilidad de heladas.json para la fecha de siembra y no se decide"},
     "necesita": ["heladas.json"],
     "texto_en": "Chile planted from February is exposed to late frost. The card shows the chance of frost after the planting date; it does not decide.",
     "fuente": f"{MAESTRO}, filtro 2; probabilidad calculada con NASA POWER (heladas.json). INEGI 1983: última helada en marzo y primera en noviembre",
     "etiqueta": "[V] regla; la probabilidad es de una celda regional, no de una estación"},
    {"id": "chile_sin_solanaceas", "tipo": "sucesion", "aplica_a": ["chile"],
     "regla": {"no_chile_despues_de_chile": True, "anios_sin_hospedante_tras_phytophthora_min": 5, "anios_rotacion_inifap": 4},
     "necesita": ["memoria", SIN_DATO],
     "texto_en": "Do not plant chile after chile. After a Phytophthora capsici outbreak, keep at least 5 years without host crops. The satellite memory shows summer crops but not which crop, so this needs a local check.",
     "fuente": f"{MAESTRO}, filtro 3: Silva-Rojas et al. 2009 (Delicias y Camargo; se adopta el criterio más estricto); INIFAP indica 4 años", "etiqueta": "[V]"},
    {"id": "soca_algodon", "tipo": "fecha_limite", "aplica_a": ["algodon", "cereal_algodon"],
     "regla": {"desarraigo_antes_de": "11-30", "desvare_dias_tras_cosecha_max": 10},
     "necesita": [],
     "texto_en": "Cotton stalks must be shredded within 10 days after harvest and uprooted before November 30 (official plant-health rule NOM-026).",
     "fuente": f"{MAESTRO}, filtro 4; {INIFAP17} (NOM-026)", "etiqueta": "[V]"},
    {"id": "alfalfa_no_en_anio_seco", "tipo": "intervalo", "aplica_a": ["avena_maiz"],
     "regla": {"lamina_establecimiento_cm": 40, "riegos": 5, "lamina_por_riego_cm": 8,
               "nota": "se compara con la dotación elegida; 40 cm = 4 millares/ha solo para establecer"},
     "necesita": ["dotación elegida en el deslizador"],
     "texto_en": "Alfalfa should not be established in a dry year: it needs about 40 cm of irrigation just to establish.",
     "fuente": f"{MAESTRO}, filtro 5; {INIFAP17} (40 cm en cinco riegos de 8 cm)", "etiqueta": "[V]"},
    {"id": "alfalfa_tras_alfalfa", "tipo": "intervalo", "aplica_a": ["avena_maiz"],
     "regla": {"meses_entre_alfalfas_min": 12},
     "necesita": ["memoria"],
     "texto_en": "Leave at least 12 months between one alfalfa stand and the next (autotoxicity).",
     "fuente": f"{MAESTRO}, filtro 6. Fundación Produce Chihuahua indica un mínimo de 6–7 meses (fuente secundaria); se adopta el más estricto", "etiqueta": "[V]"},
    {"id": "salinidad", "tipo": "salinidad",
     "aplica_a": ["alfalfa", "alfalfa_corte_verano", "chile", "algodon", "maiz_forrajero", "sorgo", "cereal_invierno", "avena_maiz", "cereal_algodon", "cereal_sorgo"],
     "regla": {"unidad": "ECe en dS/m; pérdida en % por cada dS/m por encima del umbral",
               "alfalfa": {"umbral": 2.0, "perdida": 7.1}, "maiz_forrajero": {"umbral": 1.8, "perdida": 7.6},
               "sorgo": {"umbral": 6.8, "perdida": 16.1}, "chile": {"umbral": 1.5, "perdida": 14.1},
               "algodon": {"umbral": 7.7, "perdida": 5.2}, "trigo": {"umbral": 6.0, "perdida": 7.1},
               "cebada": {"umbral": 8.0, "perdida": 5.0}, "avena_y_triticale": None,
               "nota": "avena y triticale no tienen umbral numérico en FAO-29 (solo «tolerancia moderada»). La ECe del suelo no es la CE del agua de riego"},
     "necesita": [SIN_DATO],
     "texto_en": "Salt tolerance differs by crop (FAO thresholds for soil salinity). There is no measured soil salinity for this field, so this needs a local check.",
     "fuente": f"{MAESTRO}, filtro 7: {SAL}. Algodón, trigo y cebada: lista del mismo filtro", "etiqueta": "[V] umbrales; sin medición por parcela"},
    {"id": "atrazina", "tipo": "residuo_herbicida", "aplica_a": ["avena_maiz", "cereal_algodon", "cereal_sorgo", "cereal_invierno"],
     "regla": {"espera_meses": {"min": 5, "max": 10}, "trigo_meses_min": 5, "solo_maiz_hasta_meses": 7,
               "cultivos_sensibles_meses_min": 10, "alfalfa": "no sembrar"},
     "necesita": [SIN_DATO],
     "texto_en": "If atrazine was used on the previous maize or sorghum, labels ask to wait 5–10 months depending on the next crop and not to sow alfalfa. Check the label of the exact product.",
     "fuente": f"{MAESTRO}, filtro 8: etiquetas mexicanas de atrazina (Tridente y ADAMA), verificadas en S2 §3", "etiqueta": "[V]"},
    {"id": "corte_verano_alfalfa_establecida", "tipo": "sucesion", "aplica_a": ["alfalfa_corte_verano"],
     "regla": {"no_en_primer_anio": True, "edad_min_anios": 2},
     "necesita": ["memoria"],
     "texto_en": "Only for an established stand, never in its first year.",
     "fuente": f"{MAESTRO}, opción B («solo se ofrece si la alfalfa está establecida, no en su primer año»)", "etiqueta": "[V]"},
    {"id": "corte_verano_suelo", "tipo": "salinidad", "aplica_a": ["alfalfa_corte_verano"],
     "regla": {"suelo": "profundo y no arenoso", "salinidad_alta": "no se ofrece", "salinidad_media": "se descuenta un lavado de 0–25 %",
               "riesgo_alto": "arcillas pesadas con calor extremo"},
     "necesita": [SIN_DATO],
     "texto_en": "Skipping summer irrigations is only reasonable on deep, non-sandy soil without high salinity; risk is high on heavy clay under extreme heat. Soil texture and salinity are not measured for this field: needs a local check.",
     "fuente": f"{MAESTRO}, opción B y su actualización del 29-oct (Bali et al. 2024; UC ANR 8522)", "etiqueta": "[V] ensayos de otras regiones"},
]

FUERA = {
    "D_avena_veza": "Opción D del maestro (avena-veza de otoño-invierno). No se entrega: el modelo de demanda (A5) no tiene coeficiente de cultivo con fuente para la mezcla, y el maestro marca semilla, comprador y calendario en Delicias como no verificados.",
    "E_sorgo_con_1_2_auxilios": "Opción E del maestro (sorgo con 1–2 riegos de auxilio). No se entrega como tal: A5 calcula el sorgo con su demanda completa y las fuentes no dan la lámina de un riego de auxilio de sorgo. La parte «el resto descansa con rastrojo en pie» es la opción «descanso».",
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
           "fuente": f"{MAESTRO}, «Rotaciones candidatas» y «Filtros duros»; expediente de datos 27, §2.3 (INIFAP, Agenda Técnica "
                     "Agrícola de Chihuahua 2017). Las fuentes primarias van en cada opción y en cada filtro",
           "opciones": OPCIONES, "por_cultivo_actual": POR_CULTIVO, "filtros": FILTROS,
           "opciones_del_maestro_no_entregadas": FUERA}
    json.dump(out, open("opciones_b3.json", "w"), ensure_ascii=False, indent=1)
    registrar_fuentes("B3", ["opciones_b3.json"], out["fuente"], "datos/colab/B3_opciones.py")
    print(f"{len(OPCIONES)} opciones · {len(FILTROS)} filtros · alternativas por cultivo:", {k: len(v) for k, v in POR_CULTIVO.items()})


if __name__ == "__main__":
    main()
