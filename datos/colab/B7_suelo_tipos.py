# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""B7 · Tipos de suelo del mundo, reglas de nutrientes y riesgo de nutrientes por parcela (escalable a cualquier región).

Salidas (en --dir):
  suelo_tipos.json                 Catálogo: los 32 grupos de suelo de la WRB (30 con ficha de FAO), los 12 órdenes de la
                                   Soil Taxonomy del USDA, los prefijos de gran grupo y los suelos del municipio de Delicias.
  suelo_reglas.json                Reglas con fuente: clases de pH, materia orgánica, CIC, carbonatos y salinidad
                                   (NOM-021-SEMARNAT-2000), disponibilidad de nutrientes según el pH (MSU Extension),
                                   tablas para interpretar un análisis de suelo y avisos por cultivo (NMSU, Illinois).
  suelo_nutrientes_parcelas.csv    Las reglas aplicadas a cada parcela con las propiedades de suelo_parcelas.csv (A13).
Uso: python B7_suelo_tipos.py --dir data/reto --suelo data/reto/suelo_parcelas.csv --supuestos datos/supuestos.json
     --requisitos data/reto/suelo_requisitos.json

Diseño (tres capas): (1) el tipo de suelo es CONTEXTO del paisaje y no dice qué nutrientes tiene una parcela; (2) las
propiedades estimadas de la parcela (pH, carbono orgánico, CIC, textura) disparan reglas con fuente; (3) cada cultivo
añade sus avisos. Todo lo que dice «riesgo» es un riesgo por regla, no un diagnóstico: los nutrientes disponibles (P, K,
Zn, Fe, Mn, Cu, B), los carbonatos y la salinidad de una parcela solo se conocen con un análisis de suelo.
Cada dato se transcribió de su fuente el 14-nov-2026 (liga en cada bloque). Sin fuente → null. Nada de memoria.
"""
import argparse
import csv
import json
import os

LEIDO = "leído el 14-nov-2026"
DRI = "Driessen, P., Deckers, J., Spaargaren, O. y Nachtergaele, F. (eds.) 2001. Lecture Notes on the Major Soils of the World. World Soil Resources Reports 94, FAO"
SET = {1: "y1899e04", 2: "y1899e05", 3: "y1899e06", 4: "y1899e07", 5: "y1899e08", 6: "y1899e08a", 7: "y1899e09",
       8: "y1899e11", 9: "y1899e12", 10: "y1899e13"}
f_dri = lambda s: f"{DRI}, Set {s} (https://www.fao.org/4/y1899e/{SET[s]}.htm), {LEIDO}"
NOM = ("NOM-021-SEMARNAT-2000, que establece las especificaciones de fertilidad, salinidad y clasificación de suelos "
       "(DOF 31-dic-2002), texto en https://www.norlexinternacional.com/arch/N021ST00.htm, " + LEIDO)
MSU = ("McCauley, A., Jones, C. y Olson-Rutz, K. Soil pH and Organic Matter. Nutrient Management Module 8 (4449-8), "
       f"Montana State University Extension (https://apps.msuextension.org/publications/pub.html?sku=4449-8), {LEIDO}")
NMSU657 = ("NMSU, Guide H-657 «Diseases and Other Disorders of Pecan in New Mexico» (rev. 2026) "
           f"(https://pubs.nmsu.edu/_h/H657/index.html), {LEIDO}")
NMSU658 = ("NMSU, Guide H-658 «Diagnosing Nutrient Disorders of New Mexico Pecan Trees» (R. Heerema, rev. 2025) "
           f"(https://pubs.nmsu.edu/_h/H658.pdf), {LEIDO}")
ILL = ("Illinois Agronomy Handbook, cap. 8 «Managing Soil pH and Crop Nutrients», Tabla 8.10 "
       f"(http://extension.cropsciences.illinois.edu/handbook/pdfs/chapter08.pdf), {LEIDO}")
GUT = ("Gutiérrez González, L.S. et al. 2022. Análisis del suelo y su importancia en el cultivo del nogal pecanero en el "
       "Distrito de Riego 05 Delicias. Rev. Biológico Agropecuaria Tuxpan 10(1), DOI 10.47808/revistabioagro.v10i1.395 "
       f"(resumen en https://agris.fao.org/search/en/records/67598d78c7a957febdfbf098), {LEIDO}")
PMD = ("Plan Municipal de Desarrollo de Delicias 2024–2027, anexo del Periódico Oficial del Estado de Chihuahua (2025), que cita "
       "a INEGI, Diccionario de Datos Edafológicos escala 1:250 000 (versión 4), 2016 "
       "(https://chihuahua.gob.mx/sites/default/atach2/periodico-oficial/anexos/2025-01/ANEXO%2003-2025%20ACUERDO%20N%C2%B0%20203-2024%20PMD%20DELICIAS.pdf), "
       + LEIDO)
SSSA = ("Soil Science Society of America, Glossary of Soil Science Terms, Appendix 1, Tabla A2 «Prefixes and their connotations "
        "for names of great groups» (https://agronomy.org/files/publications/soils-glossary/appendix-1.pdf y "
        f"https://www.soils.org/files/publications/soils-glossary/appendix-1-a2.pdf), {LEIDO}")
KSU = ("Moorberg, C.J. y Crouse, D.A. 2017 (act. 2021). Soils Laboratory Manual, cap. 4 «Soil Classification and Mapping», "
       f"Tabla 4.2, CC BY 4.0 (https://kstatelibraries.pressbooks.pub/soilslabmanual/?p=31), {LEIDO}")
UIDAHO = f"University of Idaho, CALS, «Twelve soil orders» (https://www.uidaho.edu/cals/soil-orders), {LEIDO}"
LANC = ("Lancaster University, Lancaster Environment Centre, «The Twelve Soil Orders of the World» (2024, mod. 2025) "
        f"(https://www.lancaster.ac.uk/lec/research/soil-science-knowledge/twelve-soil-orders/), {LEIDO}")
EXPLICA = "Regional soil type from a global map, not a soil test."


def g(nombre_es, s, rasgo, textura, ph, cic, mo, ricos, pobres, nota, tox, fija_p, limita, cultivos, ext, texto_en, ph_rango=None):
    """Ficha de un grupo WRB. ricos/pobres: símbolos de nutrientes que la fuente nombra; nota: lo demás, en palabras."""
    return {"nombre_es": nombre_es, "rasgo": rasgo, "textura": textura, "ph": ph, "ph_rango": ph_rango, "cic_cmol_kg": cic,
            "materia_organica": mo, "ricos_en": ricos, "pobres_en": pobres, "nutrientes_nota": nota, "toxicidades": tox,
            "fijacion_p": fija_p, "limitaciones": limita, "cultivos_citados": cultivos, "extension_mundial_mha": ext,
            "texto_en": texto_en, "fuente": f_dri(s), "etiqueta": "[V] resumen propio de la fuente"}


WRB = {
    "Histosols": g("Histosol", 1, "Suelos orgánicos (turba): horizonte hístico o fólico; material con más de 20 % de materia orgánica en peso",
                   "material orgánico", "3–5.5 en turberas de lluvia; más de 6 en turba eutrófica", None, "más de 20 % en peso",
                   [], ["N", "P", "K", "S", "Cu", "Zn", "Mn", "Mo", "Fe"],
                   "Gran reserva de N, poco disponible; la fuente pide fertilizar con NPK más pequeñas dosis de S, Cu, Zn, Mn, Mo y Fe",
                   ["acidez", "toxinas orgánicas", "acidez extrema si tiene pirita y se drena"], None,
                   ["baja capacidad de carga", "hundimiento al drenar", "acidez", "poco suministro de nutrientes", "exceso de agua"],
                   ["palma de aceite", "Acacia", "Eucalyptus", "horticultura con mucho capital"], [325, 375],
                   "Organic (peat) soil: a large nitrogen stock but little of it available; crops need fertilizer with sulfur and micronutrients.",
                   [3.0, 6.0]),
    "Anthrosols": g("Antrosol", 2, "Suelos modificados por el ser humano; los irrágricos se forman con el limo del agua de riego en zonas secas",
                    "variable; los irrágricos limosos retienen bien el agua y los arcillosos se endurecen al secarse",
                    "irrágricos: alcalinos, pueden tener cal libre", None, "plágicos: 1–5 % de C orgánico", [], [],
                    "Irrágricos: saturación de bases alta; hórticos: bien provistos de nutrientes y P alto; plágicos: ácidos y pobres en nutrientes, con P total alto",
                    ["sales en algunos irrágricos", "Fe2+ y Mn2+ en arroz inundado"], None,
                    ["salinidad en algunos irrágricos", "arcillosos duros y difíciles de labrar"],
                    ["cultivos comerciales y de subsistencia con riego", "arroz", "hortalizas", "centeno", "cebada", "maíz para ensilaje"], None,
                    "Soil shaped by long irrigation or cultivation: in dry irrigation districts it is usually base-rich and alkaline, and some are saline."),
    "Technosols": None,
    "Cryosols": g("Criosol", 10, "Suelos con permafrost (horizonte críico a menos de 100 cm)", "variable", "variable; más alto si el material es calcáreo",
                  None, "mucho C orgánico en los crioturbados", [], ["N", "K", "P"], "La mayoría de los nutrientes está en la materia orgánica superficial",
                  [], None, ["actividad biológica limitada a la capa activa", "suelos limosos poco transitables al deshielo", "erosión por sobrepastoreo"],
                  ["pastoreo (caribú, reno)"], None, "Permafrost soil: nitrogen, potassium and phosphorus are generally low."),
    "Leptosols": g("Leptosol", 4, "Suelos muy someros sobre roca dura (menos de 25 cm), muy pedregosos o muy calcáreos", "poca tierra fina", None, None,
                   "los réndzicos y mólicos tienen una capa superficial oscura y calcárea", [], [],
                   "Sin datos de nutrientes en la fuente; normalmente libres de sales dañinas; los calcáreos tienen mejores propiedades químicas",
                   [], None, ["poca profundidad", "pedregosidad", "poca agua disponible", "erosión"], ["pastoreo", "bosque", "terrazas en laderas"], 1655,
                   "Very shallow or stony soil with little water storage; usually free of harmful salts."),
    "Solonetz": g("Solonetz", 7, "Suelos con horizonte nátrico: sodio intercambiable de 15 % o más", "sedimentos finos", "a menudo mayor que 8.5", None,
                  "capa superficial delgada en zonas semiáridas", [], [], "El exceso de sodio es tóxico para plantas sensibles y estorba la absorción de otros nutrientes",
                  ["Na"], None, ["horizonte nátrico denso que frena el agua y las raíces", "encostramiento y encharcamiento", "erosión en cárcavas"],
                  ["algodón en suelos sódicos (Gezira, Sudán)", "forraje tras recuperarlo con yeso"], 135,
                  "Sodic soil: excess sodium harms sensitive crops and hinders the uptake of other nutrients; it is reclaimed with gypsum.", [8.5, None]),
    "Vertisols": g("Vertisol", 3, "Arcillas pesadas que se agrietan al secarse (30 % o más de arcilla, horizonte vértico)", "arcilla pesada",
                   "6.0–8.0; 8.0–9.5 con mucho sodio", [30, 80], "baja (el perfil de ejemplo tiene 0.4–0.9 % de C orgánico)", ["Ca", "Mg"], ["N", "P", "S", "Zn"],
                   "Calcio y magnesio ocupan más del 90 % del complejo de cambio; muchos tienen poco N y poco P disponible; S y/o Zn bajos en algunos sitios",
                   ["Al en los Vertisoles ácidos"], None,
                   ["muy duros en seco y pegajosos en húmedo", "encharcamiento", "infiltración muy lenta", "salinización y sodificación"],
                   ["algodón", "trigo", "cebada", "sorgo", "garbanzo", "caña de azúcar", "mijo"], 335,
                   "Heavy cracking clay, rich in calcium and magnesium but often low in nitrogen and available phosphorus.", [6.0, 8.0]),
    "Solonchaks": g("Solonchak", 7, "Suelos salinos: horizonte sálico (CEe mayor que 15 dS/m, o mayor que 8 si el pH pasa de 8.5) a menos de 50 cm",
                    None, None, None, None, [], [], "Las sales vuelven proporcionalmente menos disponibles los nutrientes; antagonismo Na–K, Na–Ca y Mg–K; el cloruro altera el metabolismo del N",
                    ["Na", "Cl"], None, ["sequía osmótica", "desequilibrio de iones", "toxicidad"],
                    ["cultivos tolerantes a la sal (la fuente cita el algodón como tolerante y el chile como sensible)", "pastoreo"], [260, 340],
                    "Saline soil: salts make nutrients less available and sodium and chloride are toxic; it needs leaching and drainage."),
    "Gleysols": g("Gleysol", 4, "Suelos saturados por el agua freática (propiedades gléyicas a menos de 50 cm)", "variable", None, None,
                  "más materia orgánica en depresiones", ["P", "K"], [], "En depresiones: más materia orgánica, CIC, bases, P y K que las lomas vecinas",
                  ["Fe2+", "Mn2+"], None, ["exceso de agua", "falta de aireación"], ["arroz", "lechería y horticultura una vez drenados"], 720,
                  "Waterlogged soil: lack of oxygen is the main limit; once drained it can be productive."),
    "Andosols": g("Andosol", 3, "Suelos de ceniza volcánica (horizonte ándico o vítrico)", None, "estable de ligeramente ácido a neutro (mayor que 5)",
                  None, "cerca de 8 % en superficie; hasta 30 %", [], ["P"], "Generalmente fértiles; fijan fósforo por el aluminio activo",
                  [], True, ["fijación de fósforo", "pendientes fuertes", "poca capacidad de carga"],
                  ["caña de azúcar", "tabaco", "camote", "té", "hortalizas", "trigo", "frutales", "arroz"], 110,
                  "Volcanic ash soil, generally fertile, that locks up phosphorus."),
    "Podzols": g("Podzol", 9, "Suelos con horizonte espódico (acumulación de humus con Al y Fe)", "arenosa", "3.5–4.5 en superficie", None,
                 "C/N de 20–50 en superficie", [], ["P"], "Nutrientes bajos por lavado intenso; deficiencia de P común", ["Al"], None,
                 ["acidez fuerte", "aluminio alto", "baja fertilidad", "poca agua"], ["bosque", "pastoreo extensivo"], 485,
                 "Strongly acid sandy soil: low nutrients, phosphorus deficiency and aluminium toxicity are common.", [3.5, 4.5]),
    "Plinthosols": g("Plintosol", 6, "Suelos con plintita (arcilla rica en Fe que se endurece al mojarse y secarse)", "arcilla moteada", None, "baja",
                     "pobre en humus", ["Fe"], [], "Ricos en hierro y aluminio; fertilidad natural baja", [], None, ["encharcamiento o sequía", "plintita densa"],
                     ["pastoreo", "cacao", "marañón"], 60, "Iron-rich soil that hardens when it dries; low natural fertility."),
    "Planosols": g("Planosol", 9, "Cambio textural abrupto, capa superficial arenosa y saturación temporal (propiedades estágnicas)",
                   "superficie arenosa o franca sobre subsuelo arcilloso", "ácidos en suelos maduros", None, "muy poca en zonas áridas", [], [],
                   "Fertilidad baja; deficiencias o toxicidades de micronutrientes con reducción prolongada", ["Al"], None,
                   ["encharcamiento", "subsuelo denso", "aluminio"], ["trigo y remolacha drenados", "arroz"], 130,
                   "Seasonally waterlogged soil over a dense subsoil, with poor fertility."),
    "Stagnosols": None,
    "Nitisols": g("Nitisol", 6, "Suelos tropicales rojos, profundos y arcillosos (horizonte nítico)", "arcillosa (más de 30 % de arcilla)", "5.0–6.5",
                  "alta para un suelo tropical", "varios por ciento en superficie bajo bosque", ["Fe"], ["P"],
                  "P disponible bajo y bases normalmente bajas; fijan P, pero la deficiencia aguda es rara", [], True, ["sorción alta de P"],
                  ["cacao", "café", "hule", "piña", "cultivos alimentarios"], 200,
                  "Deep red tropical clay, rich in iron, that holds phosphorus tightly.", [5.0, 6.5]),
    "Ferralsols": g("Ferralsol", 6, "Suelos tropicales muy meteorizados, ricos en óxidos de Fe y Al (horizonte ferrálico)", "arcillosa", "bajo", [3, 4],
                    None, ["Fe"], ["N", "K", "Ca", "Mg", "S"], "Químicamente pobres y bajos en muchos micronutrientes; Mn y Zn pueden ser tóxicos o deficientes; fijación fuerte de P",
                    ["Al", "Mn", "Zn"], True, ["baja fertilidad natural", "fijación de P", "sequía"],
                    ["cultivos anuales y perennes con cal y fertilización completa"], 750,
                    "Deeply weathered tropical soil, chemically poor, that fixes phosphorus; it needs lime and full fertilization."),
    "Chernozems": g("Chernozem", 8, "Capa superficial gruesa, negra y rica en humus (mólica) con carbonatos secundarios", "loess limoso",
                    "6.5–7.5 en superficie; 7.5–8.5 en el subsuelo", [20, 55], "5–15 % en superficie", ["N", "Ca", "Mg"], ["P"],
                    "N de 0.2–0.5 % en superficie; P solo en parte disponible (los cultivos responden al fósforo); Ca y Mg dominan el complejo de cambio",
                    ["Na (en los del sur)"], None, ["erosión", "veranos secos", "sodio en los del sur"], ["trigo", "cebada", "maíz", "hortalizas"], 230,
                    "Deep black, humus-rich steppe soil, rich in nitrogen, calcium and magnesium; phosphorus is partly available.", [6.5, 7.5]),
    "Kastanozems": g("Kastañozem", 8, "Capa superficial parda y rica en humus, con carbonatos secundarios a menos de 100 cm", None,
                     "cerca de 7 en superficie, hasta cerca de 8.5 en profundidad", [25, 30], "2–4 %", ["Ca", "Mg"], [],
                     "Químicamente ricos; Ca y Mg dominan el complejo de cambio; cal y yeso en el subsuelo; sodio intercambiable de 4 a 20 %",
                     ["sales solubles en algunos sitios"], None, ["falta de humedad", "erosión", "salinización secundaria con riego"],
                     ["granos pequeños", "cultivos alimentarios y hortalizas con riego", "pastoreo"], 465,
                     "Brown steppe soil, chemically rich in calcium and magnesium, with lime in the subsoil; irrigation can salinize it.", [7.0, 8.5]),
    "Phaeozems": g("Feozem", 8, "Capa superficial oscura y rica en humus, más lavada, sin carbonatos en el primer metro", None, "5–7", [25, 30],
                   "cerca de 5 %", [], [], "Fértiles: el lavado no agota las bases ni los nutrientes", [], None, ["sequías periódicas", "erosión"],
                   ["soya", "trigo", "granos pequeños", "algodón con riego", "cereales", "leguminosas", "hortalizas"], 190,
                   "Dark, fertile prairie soil; drought and erosion are the main limits.", [5.0, 7.0]),
    "Umbrisols": g("Umbrisol", 9, "Capa superficial oscura y ácida, con baja saturación de bases (úmbrica)", "media", "ácido", None, "alta", [], [],
                   "Fertilidad moderada, sobre todo por la materia orgánica superficial", [], None, ["pendientes", "clima frío y húmedo", "erosión"],
                   ["cereales", "raíces", "té", "café de altura"], 100, "Dark acid soil with moderate fertility that depends on its organic matter."),
    "Durisols": g("Durisol", 7, "Suelos con horizonte dúrico o petrodúrico (cementado por sílice)", "media a gruesa; sobre todo franco arenosa",
                  "típicamente 7.5–9.0", None, "poco carbono", [], ["Fe"], "Muchos con sodio intercambiable alto y poco hierro extraíble", ["Na"], None,
                  ["capa cementada que frena raíces y agua", "erosión", "sales en partes bajas"], ["pastoreo; cultivo con riego tras romper la capa"], None,
                  "Soil with a silica-cemented layer that stops roots and water; often high in sodium.", [7.5, 9.0]),
    "Gypsisols": g("Gypsisol", 7, "Suelos con acumulación secundaria de yeso (horizonte gípsico)", "franca o arcillosa en superficie", None, [10, 20],
                   "baja", ["Ca"], ["N", "P", "K"], "Totales bajos de N, P y K (necesitan fertilizante); con más de 25 % de yeso bajan el P, el K y el Mg disponibles",
                   [], None, ["horizonte petrogípsico somero", "hundimientos por disolución del yeso", "encostramiento"],
                   ["granos pequeños", "algodón", "alfalfa", "trigo", "maíz", "vid", "dátil"], 100,
                   "Gypsum-rich soil, low in nitrogen, phosphorus and potassium; with much gypsum, phosphorus, potassium and magnesium are less available."),
    "Calcisols": g("Calcisol", 7, "Suelos con acumulación secundaria de carbonato de calcio (horizonte cálcico o petrocálcico a menos de 100 cm)",
                   "media o fina, con buena retención de agua", "cerca de neutro en superficie, más alto en profundidad (25 % o más de carbonatos)",
                   [10, 25], "1–2 %", ["Ca", "Mg"], ["Fe", "Zn"],
                   "Muchos son ricos en nutrientes; Ca y Mg forman más del 90 % de los cationes adsorbidos; Fe y Zn figuran entre las necesidades de fertilizante de las hortalizas; los cítricos son sensibles al carbonato activo",
                   [], None, ["sequedad", "pedregosidad", "horizonte petrocálcico somero", "encostramiento", "salinización donde drena mal"],
                   ["trigo de invierno con riego", "melón", "algodón", "sorgo", "pasto Rhodes", "alfalfa", "hortalizas", "girasol de temporal"], 1000,
                   "Lime-rich soil of dry regions, rich in calcium and magnesium; iron and zinc are common fertilizer needs."),
    "Retisols": dict(g("Retisol (Albeluvisol en Driessen et al. 2001)", 9, "Horizonte árgico con lenguas de material blanqueado (albelúvicas)",
                       "capa eluvial arenosa", "moderada a fuertemente ácido", [10, 20], "1–10 % de C en superficie", [], [],
                       "Nutrientes bajos; bases muy bajas en la capa eluvial; mucho aluminio intercambiable en los háplicos", ["Al"], None,
                       ["acidez", "pocos nutrientes", "heladas y temporada corta"], ["papa", "trigo de invierno", "maíz forrajero", "remolacha"], 320,
                       "Acid, leached soil with low nutrient status and high aluminium."),
                     nota="Driessen et al. 2001 describe los Albeluvisols (WRB 1998); en la WRB 2022 el grupo equivalente se llama Retisols [P] (correspondencia sin verificar en la WRB 2022)"),
    "Acrisols": g("Acrisol", 6, "Suelos ácidos con horizonte árgico de arcillas de baja actividad y saturación de bases menor que 50 %", None, "ácido", None, None,
                  [], [], "Nutrientes escasos; sorción fuerte de P", ["Al"], True, ["pocos nutrientes", "toxicidad por Al", "sorción de P", "erosión"],
                  ["piña", "marañón", "palma de aceite", "hule"], 1000, "Acid, nutrient-poor soil with aluminium toxicity; it needs lime and full fertilization."),
    "Lixisols": g("Lixisol", 6, "Horizonte árgico de arcillas de baja actividad con saturación de bases moderada a alta", None,
                  "más alto que en Ferralsols y Acrisols", None, None, [], [], "Reservas de nutrientes bajas; bases intercambiables de 2 cmol(+)/kg o menos",
                  [], None, ["encostramiento", "erosión", "compactación"], ["pastoreo", "cultivos perennes"], 435,
                  "Weathered soil with low nutrient reserves and little capacity to hold nutrients."),
    "Alisols": g("Alisol", 6, "Suelos muy ácidos con arcillas de alta actividad y aluminio en más de la mitad del complejo de cambio", None,
                 "muy ácido (pH KCl menor que 4 en los datos de la fuente)", None, "modesta en suelos cultivados", ["Mg"], ["Ca", "K"],
                 "Nutrientes bajos en general, salvo a veces el Mg", ["Al", "Mn"], None, ["toxicidad por Al", "baja fertilidad", "erosión"],
                 ["té", "hule", "palma de aceite", "café y caña con cal"], 100, "Very acid soil where aluminium is toxic; calcium and potassium are low."),
    "Luvisols": g("Luvisol", 9, "Horizonte árgico con arcillas de alta actividad (arcilla lavada desde la superficie)", None,
                  "ligeramente ácido en superficie, neutro en el subsuelo (puede tener carbonato)", None, "pocos por ciento", [], [],
                  "Fértiles, salvo algunas unidades; saturación de bases alta", [], None,
                  ["superficies limosas que se degradan si se labran húmedas", "erosión en laderas"],
                  ["granos pequeños", "trigo", "remolacha", "forraje", "frutales"], [500, 600], "Fertile soil with a clay-enriched subsoil and high base saturation."),
    "Cambisols": g("Cambisol", 5, "Suelos jóvenes con desarrollo incipiente del perfil (horizonte cámbico)", "media a fina; la mayoría media",
                   "neutro a ligeramente ácido", None, "capa superficial a menudo oscura", [], [], "La mayoría tiene fertilidad química satisfactoria",
                   [], None, ["clima", "pendiente", "poca profundidad", "pedregosidad", "bases bajas en algunos"],
                   ["cultivos alimentarios y oleaginosas con riego (cálcicos y vérticos en planicies aluviales secas)", "cultivos anuales y perennes"], 1500,
                   "Young soil with satisfactory chemical fertility; it makes good farmland in most settings."),
    "Fluvisols": g("Fluvisol", 4, "Suelos jóvenes de depósitos aluviales (propiedades flúvicas: estratificación)", "de arena gruesa a arcilla pesada",
                   "neutro o cercano a neutro en la mayoría", None, None, [], [],
                   "Buena fertilidad natural; los costeros tienen carbonato de calcio y sodio; los ácidos sulfatados tienen deficiencia de P y N",
                   ["Al", "Fe2+", "H2S (ácidos sulfatados e inundados)"], None, ["inundaciones", "salinidad", "acidificación al drenar (sulfatados)"],
                   ["cultivos anuales", "frutales", "pastoreo", "arroz"], 350,
                   "Young river-deposit soil with good natural fertility; flooding and salinity are the usual limits."),
    "Arenosols": g("Arenosol", 3, "Suelos arenosos (franco arenosa o más gruesa hasta 100 cm)", "franco arenosa o más gruesa", None, [None, 4],
                   "C orgánico menor que 1 % (menor que 0.5 % en zonas secas)", [], [],
                   "Poca capacidad de guardar nutrientes (CIC efectiva normalmente menor que 4 cmol(+)/kg); ricos en bases en zonas secas, agotados en el trópico húmedo",
                   [], None, ["poca retención de nutrientes y agua", "pérdidas por percolación", "erosión"],
                   ["granos pequeños, melón, leguminosas y forraje con riego", "yuca", "cacahuate"], 900,
                   "Sandy soil that holds little water and few nutrients; drip irrigation and frequent small fertilizer doses suit it."),
    "Regosols": g("Regosol", 4, "Grupo residual: suelos minerales poco desarrollados, de textura media, sin horizonte diagnóstico salvo el ócrico",
                  "media", None, None, "baja en climas cálidos y secos", [], [], "Sin datos de nutrientes en la fuente", [], None,
                  ["sensibles a la sequía", "erosión", "costra superficial"], ["granos pequeños", "remolacha", "frutales (sobre loess)", "pastoreo"], 260,
                  "Weakly developed soil; drought and surface crusting are the main limits."),
}
# Los dos grupos sin ficha y el orden de la clave de la WRB 2022 (nombres): de la leyenda de la WRB 2022 citada por ISRIC.
SIN_FICHA = {"Technosols": "No aparece en Driessen et al. 2001 (la obra describe la WRB de 1998).",
             "Stagnosols": "No aparece en Driessen et al. 2001 (la obra describe la WRB de 1998)."}

USDA = {  # orden: (elemento formativo, definición [UIdaho], fertilidad [Lancaster] o None)
    "Alfisols": ("alf", "Moderately leached soils with relatively high native fertility", "fertile, nutrient-rich"),
    "Andisols": ("and", "Soils formed in volcanic ash or other volcanic ejecta", "strong nutrient retention and high organic matter"),
    "Aridisols": ("id", "Calcium carbonate-containing soils of arid regions with subsurface horizon development", "limited nutrients, often alkaline"),
    "Entisols": ("ent", "Soils of recent origin", "depends on parent material"),
    "Gelisols": ("el", "Soils of very cold climates with permafrost within two meters of the surface", None),
    "Histosols": ("ist", "Soils composed mainly of organic materials", "nutrient-rich enough for specific vegetation; productive when drained"),
    "Inceptisols": ("ept", "Soils with minimal horizon development", "moderately fertile; may need amendments"),
    "Mollisols": ("oll", "Soils of grassland ecosystems", "highly fertile, with calcium and magnesium"),
    "Oxisols": ("ox", "Very highly weathered soils, mainly in the intertropical regions", "low nutrient reserves, high acidity, poor fertility"),
    "Spodosols": ("od", "Acid soils with subsurface accumulation of humus complexed with Al and Fe", "low natural fertility; bases strongly leached"),
    "Ultisols": ("ult", "Strongly leached, acid forest soils with relatively low native fertility", "low base saturation, acidic and nutrient-poor"),
    "Vertisols": ("ert", "Clay-rich soils that shrink and swell with changes in moisture", None),
}
PREFIJOS = {  # prefijo de gran grupo: (significado SSSA, implicación propia [I] para las reglas)
    "calc": ("A calcic horizon", "carbonatos: ver la regla «carbonatos» (NOM-021)"),
    "calci": ("A calcic horizon", "carbonatos: ver la regla «carbonatos» (NOM-021)"),
    "petro": ("Hardened calcic or gypsic horizon", "capa endurecida que limita raíces"),
    "gyps": ("Presence of gypsic horizon", "yeso: ver Gypsisols"),
    "sal": ("Presence of salic horizon", "salinidad: ver la regla «salinidad» (NOM-021)"),
    "natr": ("Presence of natric horizon", "sodio: ver Solonetz"),
    "dur": ("A duripan", "capa cementada: ver Durisols"),
    "argi": ("Presence of an argillic horizon", "subsuelo con arcilla acumulada"),
    "camb": ("A cambic horizon", "desarrollo incipiente: ver Cambisols"),
    "hapl": ("Minimum horizon", "perfil sencillo"),
    "torr": ("Torric moisture regime", "régimen de humedad muy seco"),
    "ust": ("Ustic moisture regime", "régimen de humedad con estación seca"),
    "xer": ("Xeric moisture regime", "régimen de humedad mediterráneo"),
    "ud": ("Udic moisture regime", "régimen de humedad húmedo"),
    "aqu": ("Aquic conditions", "exceso de agua: ver Gleysols"),
    "fluv": ("Floodplain", "depósitos aluviales: ver Fluvisols"),
    "psamm": ("Sandy textures", "arenoso: ver Arenosols"),
    "cry": ("Cold", "frío"),
    "pale": ("Old development", "suelo antiguo"),
}

# --- Reglas ---------------------------------------------------------------------------------------------------------
PH_CLASES = [("fuertemente ácido", None, 5.0), ("moderadamente ácido", 5.1, 6.5), ("neutro", 6.6, 7.3),
             ("medianamente alcalino", 7.4, 8.5), ("fuertemente alcalino", 8.5, None)]
MO_NO_VOLC = [("muy bajo", None, 0.5), ("bajo", 0.6, 1.5), ("medio", 1.6, 3.5), ("alto", 3.6, 6.0), ("muy alto", 6.0, None)]
MO_VOLC = [("muy bajo", None, 4.0), ("bajo", 4.1, 6.0), ("medio", 6.1, 10.9), ("alto", 11.0, 16.0), ("muy alto", 16.1, None)]
CIC = [("muy baja", None, 5), ("baja", 5, 15), ("media", 15, 25), ("alta", 25, 40), ("muy alta", 40, None)]
CARBONATOS = [("muy bajo", None, 0.5), ("bajo", 0.6, 2.0), ("mediano", 2.2, 15), ("alto", 17, 40), ("muy alto", 40, None)]
CE = [("efectos despreciables de la salinidad", None, 1.0), ("muy ligeramente salino", 1.1, 2.0), ("moderadamente salino", 2.1, 4.0),
      ("suelo salino", 4.1, 8.0), ("fuertemente salino", 8.1, 16.0), ("muy fuertemente salino", 16.0, None)]
# Disponibilidad según el pH (MSU): rango en que cada grupo es «more available».
DISPONIBLE = [(["N", "K", "Ca", "Mg", "S"], 6.5, 8.0), (["P"], 5.5, 7.5), (["B", "Cu", "Fe", "Mn", "Ni", "Zn"], 5.0, 7.0)]
NOMBRE_EN = {"N": "nitrogen", "K": "potassium", "Ca": "calcium", "Mg": "magnesium", "S": "sulfur", "P": "phosphorus",
             "B": "boron", "Cu": "copper", "Fe": "iron", "Mn": "manganese", "Ni": "nickel", "Zn": "zinc"}


def clase(v, tabla):
    """Clase de una tabla [(nombre, min, max)]; con bordes de tabla impresa, el valor cae en la primera fila que lo admite."""
    for nombre, mn, mx in tabla:
        if (mn is None or v >= mn) and (mx is None or v <= mx):
            return nombre
    for nombre, mn, mx in tabla:          # huecos de redondeo de la tabla impresa (p. ej. 1.55 entre 1.5 y 1.6)
        if mx is not None and v <= mx + 0.1:
            return nombre
    return tabla[-1][0]


def reglas(margen):
    t = lambda tabla: [{"clase": n, "min": a, "max": b} for n, a, b in tabla]
    return {
        "fuente": "NOM-021-SEMARNAT-2000 (México) para clases e interpretación; MSU Extension para la disponibilidad según el pH; "
                  "NMSU e Illinois Agronomy Handbook para los avisos por cultivo; " + LEIDO,
        "nota": "Reglas generales: valen en cualquier región con el pH, la materia orgánica y la CIC de un mapa mundial (SoilGrids) "
                "o de un análisis. Un «riesgo» es una regla, no un diagnóstico; los nutrientes disponibles se miden con análisis de suelo.",
        "margen_ph": {"valor": margen, "fuente": "supuestos.json → suelo_margen_ph", "etiqueta": "assumption [S]"},
        "ph_clases": {"tabla": t(PH_CLASES), "metodo": "pH en agua, relación 1:2", "fuente": f"{NOM}, AS-02", "etiqueta": "[V]"},
        "disponibilidad_ph": {
            "grupos": [{"nutrientes": n, "mas_disponible_entre": [a, b]} for n, a, b in DISPONIBLE],
            "toxicidad_ph_menor_que": {"valor": 5.5, "elementos": ["Al", "Mn"]},
            "regla": "un nutriente queda «less available» si el pH sale de su rango por más de margen_ph y «near the limit» si sale por menos",
            "texto_fe": "Iron becomes nearly insoluble as soil pH nears eight; chelated forms raise its availability.",
            "fuente": MSU, "etiqueta": "[V] rangos de la fuente; margen assumption [S]"},
        "materia_organica": {"factor_c_a_mo": 1.724, "no_volcanicos": t(MO_NO_VOLC), "volcanicos": t(MO_VOLC), "unidad": "%",
                             "nota": "materia orgánica = carbono orgánico × 1.724 (Van Bemmelen, como en la norma). La CIC y el C orgánico "
                                     "de SoilGrids son estimaciones de un modelo; la norma usa Walkley y Black",
                             "fuente": f"{NOM}, AS-07", "etiqueta": "[V]"},
        "cic": {"tabla": t(CIC), "unidad": "cmol(+)/kg", "nota": "la copia de la norma imprime «Muy baja: > 5»; se lee «< 5»",
                "fuente": f"{NOM}, AS-12", "etiqueta": "[V]"},
        "carbonatos": {"tabla": t(CARBONATOS), "unidad": "% de carbonatos equivalentes",
                       "efecto": "altos contenidos pueden inducir deficiencias de fósforo, zinc, hierro y/o manganeso en los cultivos",
                       "texto_en": "High lime content can induce phosphorus, zinc, iron and manganese deficiencies.",
                       "dato_por_parcela": None, "necesita": ["análisis de suelo (carbonatos)"],
                       "fuente": f"{NOM}, AS-30 (Horton y Newson)", "etiqueta": "[V]"},
        "salinidad": {"tabla_ce": t(CE), "unidad": "dS/m a 25 °C, extracto de saturación",
                      "definiciones": {"salino": "CE de la pasta de saturación de 4 dS/m o más",
                                       "salino_sodico": "PSI mayor que 15 y CE mayor que 4 dS/m", "sodico": "PSI de 15 o más"},
                      "dato_por_parcela": None, "necesita": ["análisis de suelo (CE y PSI)"],
                      "fuente": f"{NOM}, AS-18 y definiciones 4.8 a 4.10", "etiqueta": "[V]"},
        "analisis_suelo": {
            "nota": "Para interpretar un análisis de laboratorio (cuando el usuario lo capture). No hay mapas abiertos fiables de estos valores",
            "p_olsen_mg_kg": {"bajo": [None, 5.5], "medio": [5.5, 11], "alto": [11, None], "uso": "suelos neutros a alcalinos", "metodo": "AS-10"},
            "p_bray_mg_kg": {"bajo": [None, 15], "medio": [15, 30], "alto": [30, None], "uso": "suelos ácidos a neutros", "metodo": "AS-11"},
            "bases_cmol_kg": {"Ca": {"muy_baja": [None, 2], "baja": [2, 5], "media": [5, 10], "alta": [10, None]},
                              "Mg": {"muy_baja": [None, 0.5], "baja": [0.5, 1.3], "media": [1.3, 3.0], "alta": [3.0, None]},
                              "K": {"muy_baja": [None, 0.2], "baja": [0.2, 0.3], "media": [0.3, 0.6], "alta": [0.6, None]}, "metodo": "AS-12"},
            "dtpa_mg_kg": {"Fe": {"deficiente": [None, 2.5], "marginal": [2.5, 4.5], "adecuado": [4.5, None]},
                           "Zn": {"deficiente": [None, 0.5], "marginal": [0.5, 1.0], "adecuado": [1.0, None]},
                           "Cu": {"deficiente": [None, 0.2], "adecuado": [0.2, None]},
                           "Mn": {"deficiente": [None, 1.0], "adecuado": [1.0, None]}, "metodo": "AS-14"},
            "boro_ppm": {"muy_bajo": [None, 0.39], "bajo": [0.39, 0.79], "medio": [0.80, 1.29], "alto": [1.30, 2.10], "muy_alto": [2.10, None],
                         "metodo": "AS-15 (azometina-H)"},
            "n_inorganico_mg_kg": {"muy_bajo": [0, 10], "bajo": [10, 20], "medio": [20, 40], "alto": [40, 60], "muy_alto": [60, None],
                                   "nota": "datos para cereales de grano pequeño", "metodo": "AS-08"},
            "fuente": NOM, "etiqueta": "[V]"},
        "cultivos": {
            "nogal": [
                {"elemento": "Zn", "condicion": {"ph_mayor_que": 7.0},
                 "texto_en": "Zinc is poorly available to pecan roots in alkaline soils; orchards in such soils usually get foliar zinc sprays each spring. Confirm with a leaf analysis.",
                 "fuente": f"{NMSU658} («Zinc availability for root uptake is low in soils with pH above 7.0»); {NMSU657}", "etiqueta": "[V]"},
                {"elemento": "Fe", "condicion": {"carbonatos_pct_entre": [10, 25]}, "necesita": ["análisis de suelo (carbonatos)"],
                 "texto_en": "Iron deficiency is common in pecan orchards on very limy soils and is hard to correct.",
                 "fuente": NMSU658, "etiqueta": "[V]"},
                {"elemento": "Mn", "condicion": None,
                 "texto_en": "Orchards may benefit from one or two foliar manganese sprays each spring or early summer.",
                 "fuente": NMSU658, "etiqueta": "[V]"},
                {"elemento": "varios", "condicion": None, "evidencia_local": True,
                 "texto_en": "Soil tests from pecan orchards in this irrigation district found most soils low in nitrogen, phosphorus, zinc, iron and copper.",
                 "fuente": GUT, "etiqueta": "[V] resumen; sin cifras por parcela"}],
            "maiz_forrajero": [
                {"elemento": "Zn", "condicion": {"ph_mayor_que": 7.3},
                 "texto_en": "Maize is prone to zinc deficiency on soils with high pH, low organic matter, coarse texture or very high phosphorus.",
                 "fuente": ILL, "etiqueta": "[V]"}],
            "alfalfa": [
                {"elemento": "B", "condicion": {"materia_organica_pct_menor_que": 2.0},
                 "texto_en": "Alfalfa on soils with little organic matter, high pH or sandy texture is prone to boron deficiency, mostly in dry periods.",
                 "fuente": f"{ILL} (aplicar B en suelos con menos de 2 % de materia orgánica en zonas de alta producción de alfalfa)", "etiqueta": "[V]"}],
            "cereal_invierno": [
                {"elemento": "Mn", "condicion": {"ph_clase_minima": "medianamente alcalino"},
                 "texto_en": "Oats are prone to manganese deficiency on high-pH soils, mostly in cool, wet weather.",
                 "fuente": ILL, "etiqueta": "[V] fuente («high pH», sin cifra); umbral por clase de pH assumption [S]"}],
            "chile": None, "algodon": None, "sorgo": None,
            "nota": "chile, algodón y sorgo: sin fuente encontrada para avisos de micronutrientes (14-nov-2026); la ficha no muestra ninguno"},
    }


def aplicar(suelo_csv, margen, grupos_textura):
    filas = []
    grupo = {c: g for g, cs in grupos_textura.items() for c in cs}
    for r in csv.DictReader(open(suelo_csv)):
        base = {"id": r["id"], "zona": r.get("zona", "")}
        if r["ph"] == "":
            filas.append({**base, **{k: "" for k in ("ph", "ph_clase", "menos_disponibles", "cerca_del_limite", "toxicidad_posible",
                                                      "mo_pct_estimada", "mo_clase", "cic_cmol_kg", "cic_clase", "textura_grupo")}})
            continue
        ph = float(r["ph"])
        menos, cerca = [], []
        for nutr, a, b in DISPONIBLE:
            fuera = max(a - ph, ph - b, 0.0)
            if fuera > margen + 1e-9:
                menos += nutr
            elif fuera > 0:
                cerca += nutr
        mo = float(r["carbono_organico_g_kg"]) / 10 * 1.724
        cic = float(r["cic_cmol_kg"])
        filas.append({**base, "ph": ph, "ph_clase": clase(ph, PH_CLASES), "menos_disponibles": ";".join(menos),
                      "cerca_del_limite": ";".join(cerca), "toxicidad_posible": "Al;Mn" if ph < 5.5 else "",
                      "mo_pct_estimada": round(mo, 2), "mo_clase": clase(round(mo, 1), MO_NO_VOLC), "cic_cmol_kg": cic,
                      "cic_clase": clase(cic, CIC), "textura_grupo": grupo.get(r["clase_textura"], "")})
    return filas


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--dir", default=".")
    ap.add_argument("--suelo", required=True, help="suelo_parcelas.csv (A13)")
    ap.add_argument("--supuestos", required=True, help="supuestos.json (suelo_margen_ph)")
    ap.add_argument("--requisitos", required=True, help="suelo_requisitos.json (B6: grupos_textura)")
    a = ap.parse_args()
    suelo, sup, req = (os.path.abspath(x) for x in (a.suelo, a.supuestos, a.requisitos))
    os.chdir(a.dir)
    margen = json.load(open(sup))["suelo_margen_ph"]["valor"]
    grupos = json.load(open(req))["grupos_textura"]["valor"]
    tipos = {
        "fuente": f"{DRI}; Soil Taxonomy (USDA): {KSU}; {UIDAHO}; {LANC}; prefijos: {SSSA}; municipio: {PMD}",
        "nota": "El tipo de suelo es contexto del paisaje: no dice qué nutrientes tiene una parcela. Los riesgos por parcela salen de "
                "suelo_reglas.json con las propiedades de la parcela. Los resúmenes son propios; cada grupo lleva su liga.",
        "texto_explica_en": EXPLICA,
        "wrb": {k: (v if v is not None else {"ficha": None, "nota": SIN_FICHA[k]}) for k, v in WRB.items()},
        "usda_ordenes": {k: {"elemento_formativo": e, "definicion_en": d, "fertilidad_en": f,
                             "fuente": f"elemento formativo: {KSU}; definición: {UIDAHO}" + (f"; fertilidad: {LANC}" if f else ""),
                             "etiqueta": "[V] elemento formativo; [P] definición y fertilidad (páginas universitarias de divulgación)"}
                         for k, (e, d, f) in USDA.items()},
        "usda_prefijos_gran_grupo": {k: {"significado_en": s, "implicacion": i, "fuente": SSSA,
                                         "etiqueta": "[V] significado; implicación propia [I]"} for k, (s, i) in PREFIJOS.items()},
        "como_leer_un_gran_grupo": "nombre = prefijo(s) de gran grupo + nombre del suborden, que termina en el elemento formativo del orden "
                                   "(p. ej. Haplo + calc + ids → Aridisols, con horizonte cálcico); " + KSU,
        "zona": {"municipio_delicias_pct": {"Cambisol": 29.25, "Calcisol": 27.81, "Kastañozem": 25.72, "Chernozem": 10.47, "Luvisol": 2.38,
                                            "Feozem": 0.35, "Leptosol": 0.27, "Vertisol": 0.26, "Regosol": 0.02, "zona_urbana": 3.44,
                                            "cuerpo_de_agua": 0.03},
                 "fuente": PMD, "etiqueta": "[V]",
                 "nota": "Superficie del municipio (no de las zonas piloto). Otra cifra publicada (INEGI, Compendio municipal 2010: Cambisol 28.40, "
                         "Calcisol 27.81, Kastañozem 24.18 %) no se pudo abrir: el sitio bloquea la lectura automática [P]"},
    }
    json.dump(tipos, open("suelo_tipos.json", "w"), ensure_ascii=False, indent=1)
    json.dump(reglas(margen), open("suelo_reglas.json", "w"), ensure_ascii=False, indent=1)
    filas = aplicar(suelo, margen, grupos)
    with open("suelo_nutrientes_parcelas.csv", "w", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)
    import collections
    con = [f for f in filas if f["ph"] != ""]
    print(f"{len(WRB) - len(SIN_FICHA)} grupos WRB con ficha, {len(SIN_FICHA)} sin ficha; {len(USDA)} órdenes USDA; {len(PREFIJOS)} prefijos")
    print(f"{len(con)} parcelas con dato de {len(filas)}:", dict(collections.Counter(f["menos_disponibles"] for f in con)),
          "· cerca del límite:", dict(collections.Counter(f["cerca_del_limite"] for f in con)),
          "· MO:", dict(collections.Counter(f["mo_clase"] for f in con)), "· CIC:", dict(collections.Counter(f["cic_clase"] for f in con)))


if __name__ == "__main__":
    main()
