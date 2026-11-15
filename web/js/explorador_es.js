// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/explorador_es.js — Español opcional en el explorador de parcelas (web/explorer.html).
// Decisión del 15-nov-2026 (docs/decisiones/2026-11-15_ingles_primero.md): todo abre en inglés y el selector lo
// cambia al español. Base: el traductor de la rama Milo (commit 9b5c331, web/js/idioma.js), ampliado.
//
// Cómo funciona (sin tocar app.js ni sus cálculos):
// - app.js escribe la interfaz en inglés, como siempre;
// - este módulo recorre la página y cambia cada texto (y aria-label, placeholder, title) que esté en el
//   diccionario ES; un MutationObserver traduce también lo que app.js dibuja después;
// - las cifras nunca se escriben aquí: cada número del texto se cambia por «#», se busca la forma en el
//   diccionario y se devuelven los mismos números, en el mismo orden (una traducción no cambia un número);
// - el idioma es el mismo del tablero (web/js/i18n.js, llave «root.idioma» y «?lang=es»): lo elegido en una
//   página vale en la otra. El explorador ofrece inglés y español; con portugués o francés se queda en inglés.
// - Lo que no está en el diccionario queda en inglés: fuentes, nombres de archivo, descripciones técnicas de
//   «About & Data» y los textos que llegan de las entregas de datos (igual que en el tablero).
import { idioma, fijarIdioma } from "./i18n.js";

// Forma en inglés (cada número como «#») → español (con los mismos «#», en el mismo orden).
export const ES = new Map(Object.entries({
  // Cabecera y navegación
  "ROOT – From Dam to Root": "ROOT – De la presa a la raíz",
  "– From Dam to Root": "– De la presa a la raíz",
  "· pre-planting water commitments": "· compromisos de agua antes de sembrar",
  "pre-planting water commitments": "compromisos de agua antes de sembrar",
  "Skip to the map and indicators": "Saltar al mapa y los indicadores",
  "SIMULATED DATA": "DATOS SIMULADOS",
  "Placeholder values so the screens work before the real data arrive. Not real fields or measurements.":
    "Valores de muestra para que las pantallas funcionen antes de que lleguen los datos reales. No son parcelas ni mediciones reales.",
  "Help and data sources": "Ayuda y fuentes de datos",
  "How it works": "Cómo funciona",
  "About & Data": "Acerca de ROOT y sus datos",
  "About and data": "Acerca de ROOT y sus datos",
  "Dashboard": "Tablero",
  "Language": "Idioma",
  "Install app": "Instalar aplicación",
  "Online": "En línea",
  "Offline": "Sin conexión",
  "Ready to work offline": "Lista para usarse sin conexión",
  "App and connection": "Aplicación y conexión",
  "Close": "Cerrar",
  "Close the introduction": "Cerrar la introducción",
  "Start exploring": "Empezar a explorar",
  "Before you plant, see the water you are committing.": "Antes de sembrar, vea el agua que compromete.",
  "Zoom in": "Acercar",
  "Zoom out": "Alejar",
  "Toggle attribution": "Mostrar u ocultar la atribución",
  "© OpenStreetMap contributors": "© colaboradores de OpenStreetMap",
  "(opens in a new tab)": "(se abre en otra pestaña)",

  // Controles: dotación y lluvia
  "Water allocation controls": "Controles de la dotación de agua",
  "Water allocation": "Dotación de agua",
  "(thousand m³ per hectare)": "(miles de m³ por hectárea)",
  "Set the water allocation": "Fije la dotación de agua",
  "Reference allocations": "Dotaciones de referencia",
  "Move the slider or tap a reference mark: the water the dam delivers per hectare, in millares (thousand m³ per hectare).":
    "Mueva el deslizador o toque una marca de referencia: el agua que entrega la presa por hectárea, en millares (miles de m³ por hectárea).",
  "Like #": "Como en #",
  "Like #:": "Como en #:",
  "Normal year": "Año normal",
  "slider set to the midpoint, #": "deslizador en el punto medio, #",
  "#–# thousand m³/ha": "#–# millares/ha",
  "# thousand m³/ha": "# millares/ha",
  "# thousand m³/ha (Like #)": "# millares/ha (como en #)",
  "thousand m³/ha": "millares/ha",
  "thousand m³/ha ·": "millares/ha ·",
  "thousand m³/ha per year": "millares/ha al año",
  "Units and measuring point": "Unidades y punto de medición",
  "Equivalence:": "Equivalencia:",
  "Measured at:": "Medido en:",
  "Source and note": "Fuente y nota",
  "Rain": "Lluvia",
  "Rainfall": "Lluvia",
  "Normal rain": "Lluvia normal",
  "Less rain": "Menos lluvia",
  "Rain −#%": "Lluvia −# %",
  "Less rain: every option needs more irrigation water.": "Con menos lluvia, cada opción necesita más agua de riego.",
  "Normal rain or a drier season, as you choose.": "Lluvia normal o una temporada más seca, como usted elija.",
  "on the slider marks a highlighted year:": "en el deslizador marca un año destacado:",
  "Highlighted year": "Año destacado",
  "· Highlighted year": "· Año destacado",
  "Year without dam water: the district received no dam allocation": "Año sin agua de la presa: el distrito no recibió dotación",

  // Mapa y capas
  "Pilot area": "Zona piloto",
  "All areas": "Todas las zonas",
  "All pilot areas": "Todas las zonas piloto",
  "Pilot area map": "Mapa de la zona piloto",
  "Map": "Mapa",
  "Map of the pilot-area fields. Use the field list to open a field with the keyboard.":
    "Mapa de las parcelas de la zona piloto. Use la lista de parcelas para abrir una con el teclado.",
  "Map options, fields and district summary": "Opciones del mapa, parcelas y resumen del distrito",
  "Color fields by": "Colorear parcelas según",
  "Water": "Agua",
  "Enough water?": "¿Alcanza el agua?",
  "Water term": "Plazo del agua",
  "Water term:": "Plazo del agua:",
  "Layers": "Capas",
  "Legend": "Leyenda",
  "Crop": "Cultivo",
  "Crops": "Cultivos",
  "crop": "cultivo",
  "Crop map": "Mapa de cultivos",
  "This season's crop map": "Mapa de cultivos de esta temporada",
  "Bare soil": "Suelo desnudo",
  "bare soil": "suelo desnudo",
  "Terrain": "Terreno",
  "Terrain overlay": "Capa de relieve",
  "Terrain shading": "Sombreado del relieve",
  "Terrain & runoff": "Relieve y escurrimiento",
  "Terrain & runoff layer": "Capa de relieve y escurrimiento",
  "Terrain (context):": "Terreno (contexto):",
  "Simulate a storm": "Simular una tormenta",
  "Storm": "Tormenta",
  "Reference storm": "Tormenta de referencia",
  "Runoff paths": "Rutas de escurrimiento",
  "Higher ground": "Terreno más alto",
  "Lower ground": "Terreno más bajo",
  "Elevation of the pilot area": "Elevación de la zona piloto",
  "Shows where rain runs off and gathers across the pilot area (zone context, not field drainage design).":
    "Muestra por dónde escurre y dónde se junta la lluvia en la zona piloto (contexto de zona, no diseño de drenaje de la parcela).",
  "Greyed out: outside the pilot areas": "En gris: fuera de las zonas piloto",
  "Tap a field": "Toque una parcela",
  "Show on map": "Ver en el mapa",
  "in view": "a la vista",
  "not in the map": "no está en el mapa",
  "#D twin view": "Vista #D del gemelo",
  "Map marker": "Marcador del mapa",
  "Team reference localities (not fields)": "Localidades de referencia del equipo (no son parcelas)",
  "Places to find your way on the map. They are not fields and carry no water data.":
    "Lugares para orientarse en el mapa. No son parcelas ni llevan datos de agua.",
  "La Boquilla dam": "Presa La Boquilla",
  "Aquifer #": "Acuífero #",

  // Gemelo digital y línea de tiempo
  "Twin status": "Estado del gemelo",
  "Observed": "Observado",
  "Modeled": "Modelado",
  "Your scenario": "Su escenario",
  "Observed state by year": "Estado observado por año",
  "Observed state of the fields in": "Estado observado de las parcelas en",
  "Agricultural year": "Año agrícola",
  "agricultural year #": "año agrícola #",
  "agricultural years #–#": "años agrícolas #–#",
  "Agricultural years, from oldest to newest": "Años agrícolas, del más antiguo al más reciente",
  "Timeline of the twin: observed state of each field, by agricultural year":
    "Línea de tiempo del gemelo: estado observado de cada parcela por año agrícola",
  "Legend, with the number of fields in each observed state": "Leyenda, con el número de parcelas en cada estado observado",
  "Play": "Reproducir",
  "Read from satellite and climate data.": "Leído de datos satelitales y de clima.",
  "Computed from the observed data with a stated method.": "Calculado a partir de los datos observados con un método declarado.",
  "What you set on this page to try a decision before planting. Not a measurement.":
    "Lo que usted fija en esta página para probar una decisión antes de sembrar. No es una medición.",
  "Updated on each rebuild from satellite and climate data; no in-field sensors. It does not forecast the dam.":
    "Se actualiza en cada reconstrucción con datos satelitales y de clima; sin sensores en campo. No pronostica la presa.",
  "Water on its way (dam, canal, field)": "Agua en camino (presa, canal, parcela)",
  "The water allocation you set with the slider.": "La dotación de agua que usted fija con el deslizador.",

  // Lista de parcelas
  "Fields": "Parcelas",
  "fields": "parcelas",
  "# fields": "# parcelas",
  "Field": "Parcela",
  "Field P#": "Parcela P#",
  "Field L#": "Parcela L#",
  "Current rotation:": "Rotación actual:",
  "# fields in Delicias – Saucillo": "# parcelas en Delicias – Saucillo",
  "# fields in Lázaro Cárdenas (Meoqui)": "# parcelas en Lázaro Cárdenas (Meoqui)",
  "Find a field": "Buscar una parcela",
  "(ID or crop)": "(ID o cultivo)",
  "Select a field to open its sheet. Example fields are at the top, then classified fields, then fields not classified.":
    "Elija una parcela para abrir su ficha. Arriba están las parcelas de ejemplo, luego las clasificadas y al final las no clasificadas.",
  "Fields at this allocation": "Parcelas con esta dotación",
  "# of # classified fields": "# de # parcelas clasificadas",
  "classified": "clasificadas",
  "example field": "parcela de ejemplo",
  "don't have enough water for their current rotation.": "no tienen agua suficiente para su rotación actual.",
  "#% of the area is not classified, so this is a minimum.": "El # % de la superficie no está clasificado, así que esta cifra es un mínimo.",
  "at least": "al menos",
  "of the allocation": "de la dotación",
  "Water already committed by perennial crops": "Agua ya comprometida por los cultivos perennes",
  "Perennial crops alone ask for more than the allocation; the gap comes from wells or stays unmet.":
    "Los cultivos perennes, sin contar los demás, piden más que la dotación; la diferencia sale de pozos o queda sin cubrir.",

  // Cultivos y estados
  "Alfalfa": "Alfalfa",
  "Pecan orchard": "Huerta de nogal",
  "Chile pepper": "Chile",
  "Forage maize": "Maíz forrajero",
  "Sorghum": "Sorgo",
  "Cotton": "Algodón",
  "Winter cereal": "Cereal de invierno",
  "Summer forage": "Forraje de verano",
  "Fallow": "Barbecho",
  "Rest": "Descanso",
  "Not classified": "Sin clasificar",
  "Perennial": "Perenne",
  "Summer crop": "Cultivo de verano",
  "Winter crop": "Cultivo de invierno",
  "Double crop": "Doble cultivo",
  "#: Perennial": "#: Perenne",
  "#: Summer crop": "#: Cultivo de verano",
  "#: Winter crop": "#: Cultivo de invierno",
  "#: Double crop": "#: Doble cultivo",
  "Do not plant / standing stubble": "No sembrar / rastrojo en pie",
  "Break the old alfalfa: winter cereal, then forage maize": "Romper la alfalfa vieja: cereal de invierno y después maíz forrajero",
  "Keep the alfalfa and skip two to three summer irrigations": "Conservar la alfalfa y omitir dos o tres riegos de verano",
  "Enough water": "Agua suficiente",
  "Not enough water": "Agua insuficiente",
  "✓ Enough water": "✓ Agua suficiente",
  "✕ Not enough water": "✕ Agua insuficiente",
  "Tight": "Agua justa",
  "No irrigation needed": "No necesita riego",
  "Not classified — check with technician": "Sin clasificar: consulte a un técnico",
  "Not classified — check with a technician. The crop map is not sure what grows on this field, so its water need is not computed.":
    "Sin clasificar: consulte a un técnico. El mapa de cultivos no sabe con certeza qué crece en esta parcela, así que no se calcula su necesidad de agua.",
  "Free": "Libre",
  "Ending soon": "Por terminar",
  "Committed": "Comprometida",
  "Enough for # of # hectares": "Alcanza para # de # hectáreas",
  "enough for # of # hectares": "alcanza para # de # hectáreas",
  "Enough for the whole field (# ha)": "Alcanza para toda la parcela (# ha)",
  "# ha": "# ha",
  "Near the limit": "Cerca del límite",

  // Ficha de parcela
  "Field memory (NASA HLS)": "Memoria de la parcela (NASA HLS)",
  "Field memory: #": "Memoria de la parcela: #",
  "Field memory: perennial, summer, winter, double crop or rest, year by year":
    "Memoria de la parcela: perenne, verano, invierno, doble cultivo o descanso, año por año",
  "Current rotation": "Rotación actual",
  "Current rotation and alternatives": "Rotación actual y alternativas",
  "Compare rotations": "Comparar rotaciones",
  "The current rotation and its alternatives: how much water each needs per year, for how many years, and how many hectares the allocation covers.":
    "La rotación actual y sus alternativas: cuánta agua pide cada una al año, por cuántos años y cuántas hectáreas cubre la dotación.",
  "This is the field's current rotation: the baseline. Under “Benefits”, each alternative is compared with it.":
    "Esta es la rotación actual de la parcela: la base. En «Beneficios», cada alternativa se compara con ella.",
  "No alternatives are compared for this field.": "No se comparan alternativas para esta parcela.",
  "Option": "Opción",
  "Water need": "Necesidad de agua",
  "(median)": "(mediana)",
  "(range # to #)": "(rango de # a #)",
  "likely range #–#": "rango probable #–#",
  "Need: median # likely range # to # thousand m³/ha per year; your allocation: #":
    "Necesidad: mediana # rango probable de # a # millares/ha al año; su dotación: #",
  "┆ dashed line: your allocation (#)": "┆ línea discontinua: su dotación (#)",
  "With # thousand m³/ha,": "Con # millares/ha,",
  "Commits water for # year": "Compromete agua por # año",
  "Commits water for # years": "Compromete agua por # años",
  "Commits water for #–# years": "Compromete agua por #–# años",
  "Remaining term: # years": "Plazo restante: # años",
  "Remaining term: #–# years": "Plazo restante: #–# años",
  "Water committed over the remaining term: # thousand m³/ha": "Agua comprometida en el plazo restante: # millares/ha",
  "Water committed over the remaining term: #–# thousand m³/ha": "Agua comprometida en el plazo restante: #–# millares/ha",
  "How many years a crop ties up water: one season for annual crops, several years for alfalfa, a long horizon for orchards.":
    "Cuántos años compromete agua un cultivo: una temporada los anuales, varios años la alfalfa y un horizonte largo las huertas.",
  "(calculation horizon; orchards live longer)": "(horizonte de cálculo; las huertas viven más)",
  "Why?": "¿Por qué?",
  "Why it's suggested": "Por qué se propone",
  "Evidence": "Evidencia",
  "Benefits": "Beneficios",
  "What we don't know": "Lo que no sabemos",
  "Risks needing local review": "Riesgos que necesitan revisión local",
  "Just highlights — ROOT does not rank options; you and your technician decide.":
    "Resalta sin ordenar: ROOT no clasifica las opciones; usted y su técnico deciden.",
  "What matters most to you?": "¿Qué le importa más?",
  "Matches your priorities": "Coincide con sus prioridades",
  "Less water": "Menos agua",
  "Shorter water commitment": "Compromiso de agua más corto",
  "Less bare soil": "Menos suelo desnudo",
  "Market / money": "Mercado / ingreso",
  "Money": "Ingreso",
  "Fixes nitrogen": "Fija nitrógeno",
  "Breaks pest cycles": "Rompe ciclos de plagas",
  "Deep roots": "Raíces profundas",
  "Forage value": "Valor forrajero",
  "Legume (adds nitrogen):": "Leguminosa (aporta nitrógeno):",
  "Bare soil in the windy season": "Suelo desnudo en la temporada de viento",
  "# days": "# días",
  "days": "días",
  "No verified data": "Sin datos verificados",
  "No data": "Sin datos",
  "no data": "sin datos",
  ": no data": ": sin datos",
  "Not applicable": "No aplica",
  "Not available: this field is not classified.": "No disponible: esta parcela no está clasificada.",
  "no data in the rotation table for this option.": "sin datos en la tabla de rotaciones para esta opción.",
  "(it needs field data the tool does not have)": "(necesita datos de campo que la herramienta no tiene)",
  "Source:": "Fuente:",
  "Source": "Fuente",
  "Full source": "Fuente completa",
  "Planting window (official table):": "Ventana de siembra (tabla oficial):",
  "Rules and filters": "Reglas y filtros",
  "Rules: # need a local check": "Reglas: # necesitan revisión local",
  "Rules: # need a local check (details online)": "Reglas: # necesitan revisión local (detalles en línea)",
  "? Needs a local check:": "? Necesita revisión local:",
  "✓ Passes:": "✓ Cumple:",
  "# passes (details online)": "# cumplen (detalles en línea)",
  "favorable": "favorable",
  "unfavorable": "desfavorable",
  "watch": "atención",
  "This tool supports, never replaces, the judgment of farmers and local experts.":
    "Esta herramienta apoya y no sustituye el juicio del agricultor ni del técnico.",
  "It does not allocate, sell or trade water, and it does not forecast the dam.":
    "No reparte, vende ni intercambia agua, y no pronostica la presa.",
  "It does not allocate, sell or trade water, and it does not forecast the dam. Field boundaries are estimated.":
    "No reparte, vende ni intercambia agua, y no pronostica la presa. Los límites de las parcelas son estimados.",
  "Notice": "Aviso",

  // Suelo, satélite y heladas
  "Soil": "Suelo",
  "Soil profile": "Perfil de suelo",
  "Soil and satellite evidence": "Suelo y evidencia satelital",
  "Satellite evidence": "Evidencia satelital",
  "Soil fit of this option": "Ajuste del suelo para esta opción",
  "Soil fit:": "Ajuste del suelo:",
  "Tolerated by this soil": "Tolerado por este suelo",
  "Outside the published range": "Fuera del rango publicado",
  "No published range": "Sin rango publicado",
  "General published range (FAO ECOCROP, worldwide), not a local trial":
    "Rango general publicado (FAO ECOCROP, mundial), no un ensayo local",
  "About this soil type": "Sobre este tipo de suelo",
  "Texture group:": "Grupo de textura:",
  "Exact texture class": "Clase textural exacta",
  "Sand": "Arena",
  "Silt": "Limo",
  "Clay": "Arcilla",
  "light": "ligero",
  "medium": "medio",
  "deep": "profundo",
  "pH (in water)": "pH (en agua)",
  "Organic carbon": "Carbono orgánico",
  "Organic matter": "Materia orgánica",
  "Total nitrogen": "Nitrógeno total",
  "Cation exchange capacity": "Capacidad de intercambio catiónico",
  "Salinity (electrical conductivity)": "Salinidad (conductividad eléctrica)",
  "pH # is outside the optimal range (#–#) and within the tolerated range (#–#).":
    "El pH # está fuera del rango óptimo (#–#) y dentro del tolerado (#–#).",
  "Nutrient note": "Nota de nutrientes",
  "Nutrient notes": "Notas de nutrientes",
  "Less available": "Menos disponible",
  "Phosphorus, potassium, iron, zinc: needs a soil test": "Fósforo, potasio, hierro y zinc: necesita análisis de suelo",
  "iron": "hierro",
  "zinc": "zinc",
  "boron": "boro",
  "copper": "cobre",
  "manganese": "manganeso",
  "nickel": "níquel",
  "phosphorus": "fósforo",
  "(#–# cm layer)": "(capa de #–# cm)",
  "Frost risk": "Riesgo de heladas",
  "Chance of a freezing night in the planting window, from NASA POWER temperatures.":
    "Probabilidad de una noche con helada en la ventana de siembra, con temperaturas de NASA POWER.",
  "Chance of frost after each planting date (rules and filters of the options)":
    "Probabilidad de helada después de cada fecha de siembra (reglas y filtros de las opciones)",
  "Days with frost": "Días con helada",
  "Greenness history": "Historial de verdor",
  "Greenness (NDVI) by month — NASA HLS": "Verdor (NDVI) por mes — NASA HLS",
  "NDVI (“greenness”)": "NDVI («verdor»)",
  "Monthly greenness of each field this season": "Verdor mensual de cada parcela esta temporada",
  "Monthly median inside the field. Point at the chart, tap it, or focus it and use the arrow keys to read a month.":
    "Mediana mensual dentro de la parcela. Señale la gráfica, tóquela o enfóquela y use las flechas para leer un mes.",
  "NDVI chart. Left and right arrow keys read each month; Home and End jump to the ends.":
    "Gráfica de NDVI. Las flechas izquierda y derecha leen cada mes; Inicio y Fin saltan a los extremos.",
  "Point at a month to read its values, or open the data table.": "Señale un mes para leer sus valores o abra la tabla de datos.",
  "Data table": "Tabla de datos",
  "Latest month with data": "Último mes con datos",
  "Green month: NDVI at or above #": "Mes verde: NDVI igual o mayor que #",
  "Bare soil: NDVI below #": "Suelo desnudo: NDVI menor que #",
  "No crop in any month: bare soil all year.": "Sin cultivo en ningún mes: suelo desnudo todo el año.",
  "Rule-based reading of monthly greenness (NASA HLS); not a crop census.":
    "Lectura por reglas del verdor mensual (NASA HLS); no es un censo de cultivos.",
  "Rule-based reading of monthly greenness; not a crop census.": "Lectura por reglas del verdor mensual; no es un censo de cultivos.",
  "Month": "Mes",
  "Jan #": "ene #", "Feb #": "feb #", "Mar #": "mar #", "Apr #": "abr #", "May #": "may #", "Jun #": "jun #",
  "Jul #": "jul #", "Aug #": "ago #", "Sep #": "sep #", "Oct #": "oct #", "Nov #": "nov #", "Dec #": "dic #",
  "Jan # #": "ene # #", "Nov # #": "nov # #",
  "estimated": "estimado",
  "measured": "medido",
  "boundary confidence (Fields of The World): #%": "confianza del límite (Fields of The World): # %",
  "boundary confidence (Fields of The World): #% ·": "confianza del límite (Fields of The World): # % ·",
  "GEDI: no shots inside this field": "GEDI: sin disparos dentro de esta parcela",
  "GEDI samples the ground with separate laser shots, so many fields have none. This is no data, not zero.":
    "GEDI muestrea el suelo con disparos láser separados, así que muchas parcelas no tienen ninguno. Es falta de dato, no un cero.",

  // «Follow the drop» y goteo
  "Follow the drop": "Sigue la gota",
  "Follow the drop: where this option's water goes, in cubic metres per year for this field":
    "Sigue la gota: a dónde va el agua de esta opción, en metros cúbicos al año para esta parcela",
  "Where the water this option needs would go each year, counted from La Boquilla dam to the crop and the aquifer (m³ for this field).":
    "A dónde iría cada año el agua que pide esta opción, desde la presa La Boquilla hasta el cultivo y el acuífero (m³ para esta parcela).",
  "Every cubic metre that leaves the dam ends up as crop consumption, aquifer recharge or other losses.":
    "Cada metro cúbico que sale de la presa termina como consumo del cultivo, recarga del acuífero u otras pérdidas.",
  "Water this option needs, counted from La Boquilla (dam)": "Agua que pide esta opción, contada desde La Boquilla (presa)",
  "Needed from La Boquilla": "Necesaria desde La Boquilla",
  "Canal losses": "Pérdidas en el canal",
  "Reaches the field": "Llega a la parcela",
  "Crop consumption (ET)": "Consumo del cultivo (ET)",
  "Crop (ET)": "Cultivo (ET)",
  "Other losses": "Otras pérdidas",
  "Other losses (evaporation, runoff)": "Otras pérdidas (evaporación, escurrimiento)",
  "Losses (canal, evaporation, runoff)": "Pérdidas (canal, evaporación, escurrimiento)",
  "Back to aquifer": "De vuelta al acuífero",
  "Assumptions behind these flows": "Supuestos detrás de estos flujos",
  "Return-flow coefficient:": "Coeficiente de retorno:",
  "Flow": "Flujo",
  "What if this field switches to drip?": "¿Y si esta parcela cambia a goteo?",
  "Drip, consumption cap off": "Goteo, sin tope de consumo",
  "Drip, consumption cap on": "Goteo, con tope de consumo",
  "Consumption cap": "Tope de consumo",
  "Consumption cap:": "Tope de consumo:",
  "A rule that drip irrigation may not raise the crop's water consumption (ET) above its historical level.":
    "Una regla según la cual el goteo no puede subir el consumo de agua del cultivo (ET) por encima de su nivel histórico.",
  "Without the cap, the aquifer return keeps its coefficient: an upper bound, not a measurement.":
    "Sin el tope, el retorno al acuífero conserva su coeficiente: un límite superior, no una medición.",
  "Water balance": "Balance de agua",

  // Compartir e imprimir
  "Share with the farmer": "Compartir con el agricultor",
  "Preview WhatsApp message": "Vista previa del mensaje de WhatsApp",
  "Message language": "Idioma del mensaje",
  "Print field sheet": "Imprimir la ficha de la parcela",
  "A preview of the message the farmer would read, in Spanish, and a one-page sheet to print. Nothing is sent or stored.":
    "Una vista previa del mensaje que leería el agricultor, en español, y una ficha de una página para imprimir. No se envía ni se guarda nada.",

  // Contexto regional
  "Regional context": "Contexto regional",
  "Climate, soil moisture, basin water and frost of the pilot area, year by year. They describe the area or the basin, not a single field.":
    "Clima, humedad del suelo, agua de la cuenca y heladas de la zona piloto, año por año. Describen la zona o la cuenca, no una parcela.",
  "Regional series describe the area or the basin, not a single field. They do not forecast the dam and do not change the water light.":
    "Las series regionales describen la zona o la cuenca, no una parcela. No pronostican la presa ni cambian el semáforo del agua.",
  "Climate": "Clima",
  "Climate of the year": "Clima del año",
  "Rainfall of the year, two sources side by side": "Lluvia del año, dos fuentes lado a lado",
  "Soil moisture": "Humedad del suelo",
  "Water stored in the basin": "Agua almacenada en la cuenca",
  "Evapotranspiration": "Evapotranspiración",
  "Reference evapotranspiration (ETo)": "Evapotranspiración de referencia (ETo)",
  "Limits of these series": "Límites de estas series",
  "Grid of each series": "Malla de cada serie",
  "One series for the whole basin, the same in every pilot area": "Una serie para toda la cuenca, la misma en cada zona piloto",
  "yearly mean": "media anual",
  "mm/year": "mm/año",
  "# mm/year": "# mm/año",
  "Capacity at": "Capacidad al",
  "Normal maximum operating level": "Nivel de aguas máximas ordinarias",
  "Storage # hm³ of # hm³ at NAMO": "Almacenamiento: # hm³ de # hm³ al NAMO",
  "Availability": "Disponibilidad",
  "A negative availability is the official deficit published by Conagua, not a measured loss.":
    "Una disponibilidad negativa es el déficit oficial que publica Conagua, no una pérdida medida.",
  "−# hm³ per year": "−# hm³ al año",
  "Second climate source": "Segunda fuente de clima",

  // Ficha: frases de la interfaz (segunda tanda)
  "Enough water for the current rotation?": "¿Alcanza el agua para la rotación actual?",
  "— covers even the high estimate of the need": "— cubre incluso la estimación alta de la necesidad",
  "— covers the median need, not the high estimate": "— cubre la necesidad mediana, no la estimación alta",
  "— below the median need": "— por debajo de la necesidad mediana",
  "— the crop map abstained; check with a technician": "— el mapa de cultivos se abstuvo; consulte a un técnico",
  "— district average, not this field": "— promedio del distrito, no de esta parcela",
  "— no data in ROOT yet": "— aún sin datos en ROOT",
  "Typically applied in this district:": "Lo que suele aplicarse en este distrito:",
  "Typically applied in this district (#–# records; measurement point not confirmed):":
    "Lo que suele aplicarse en este distrito (registros #–#; punto de medición sin confirmar):",
  "Source of the local reference": "Fuente de la referencia local",
  "Check with your module technician: the allocation, where the thousand cubic meters are measured, and local soil conditions can change the answer.":
    "Consulte con el técnico de su módulo: la dotación, dónde se miden los millares y las condiciones locales del suelo pueden cambiar la respuesta.",
  "Bare soil in the windy season (Feb # – Apr #)": "Suelo desnudo en la temporada de viento (feb # – abr #)",
  "Bare soil in the windy season:": "Suelo desnudo en la temporada de viento:",
  "Likely range for the classified area: #% to #%; unclassified fields can raise it, not lower it":
    "Rango probable para la superficie clasificada: # % a # %; las parcelas sin clasificar pueden subirlo, no bajarlo",
  "Stand age from satellite memory: # years": "Edad de la alfalfa según la memoria satelital: # años",
  "Breaks the pest cycle:": "Rompe el ciclo de plagas:",
  "Breaks the pest cycle and deep roots:": "Rompe el ciclo de plagas y raíces profundas:",
  "Water per year:": "Agua al año:",
  "Field values:": "Valores de la parcela:",
  "yes": "sí",
  "yes, like the current rotation.": "sí, como la rotación actual.",
  "no; the current rotation is a legume.": "no; la rotación actual es una leguminosa.",
  "# thousand m³/ha (median need), less than the current rotation's #.": "# millares/ha (necesidad mediana), menos que los # de la rotación actual.",
  "#–# years (#–# years left on this field), the same as the current rotation.":
    "#–# años (quedan #–# años en esta parcela), igual que la rotación actual.",
  "# year; the current rotation's is #–# years (#–# years left on this field).":
    "# año; el de la rotación actual es de #–# años (quedan #–# años en esta parcela).",
  "# days (estimated); the current rotation has # days (measured).": "# días (estimado); la rotación actual tiene # días (medido).",
  "no data for this option; the current rotation has # days (measured).": "sin datos para esta opción; la rotación actual tiene # días (medido).",
  "no irrigation needed; the current rotation asks for # thousand m³/ha (median need).":
    "no necesita riego; la rotación actual pide # millares/ha (necesidad mediana).",
  "nothing is planted, so there is no crop to compare with this soil": "no se siembra nada, así que no hay cultivo que comparar con este suelo",
  "For an established stand; never in its year of establishment.": "Para una alfalfa establecida; nunca en su año de establecimiento.",
  "Planting must fall inside the window reported for the crop.": "La siembra debe caer dentro de la ventana reportada para el cultivo.",
  "(the tool does not evaluate this rule yet)": "(la herramienta aún no evalúa esta regla)",
  "Leave at least # months between one alfalfa stand and the next (autotoxicity).":
    "Deje al menos # meses entre una alfalfa y la siguiente (autotoxicidad).",
  "⚠ Warning: at this allocation this option does not get enough water, and alfalfa commits water for #–# years.":
    "⚠ Aviso: con esta dotación, esta opción no recibe agua suficiente, y la alfalfa compromete agua por #–# años.",
  "pH # is outside the tolerated range (#–#).": "El pH # está fuera del rango tolerado (#–#).",
  "salinity not compared — not in the map.": "salinidad sin comparar: no está en el mapa.",
  "Salinity not compared — not in the map.": "Salinidad sin comparar: no está en el mapa.",
  "Salt tolerance differs by crop (FAO thresholds for soil salinity). There is no measured soil salinity for this field, so this needs a local check.":
    "La tolerancia a la sal cambia con el cultivo (umbrales de la FAO para salinidad del suelo). No hay salinidad medida en esta parcela, así que necesita revisión local.",
  "Evidence from a regional soil map and published crop ranges, to weigh next to water and commitment. It supports and does not replace the judgment of the farmer or the technician.":
    "Evidencia de un mapa regional de suelos y de rangos publicados por cultivo, para sopesar junto al agua y al compromiso. Apoya y no sustituye el juicio del agricultor ni del técnico.",
  "Notes from published rules applied to a regional soil map, to weigh with a soil test. They support and do not replace the judgment of the farmer or the technician.":
    "Notas de reglas publicadas aplicadas a un mapa regional de suelos, para sopesar con un análisis de suelo. Apoyan y no sustituyen el juicio del agricultor ni del técnico.",
  "Regional soil type from a global map, not a soil test.": "Tipo de suelo regional de un mapa global, no un análisis de suelo.",
  "About this soil type and the soils of the municipality": "Sobre este tipo de suelo y los suelos del municipio",
  "The two differ because they come from different maps; neither is a field survey.":
    "Los dos difieren porque vienen de mapas distintos; ninguno es un levantamiento en campo.",
  "Rule-based risk from a global soil map; needs a soil test.": "Riesgo por reglas a partir de un mapa global de suelos; necesita análisis de suelo.",
  "Less available at this soil pH: phosphorus, boron, copper, iron, manganese, nickel and zinc.":
    "Menos disponibles con este pH del suelo: fósforo, boro, cobre, hierro, manganeso, níquel y zinc.",
  "Less available at this soil pH: boron, copper, iron, manganese, nickel and zinc.":
    "Menos disponibles con este pH del suelo: boro, cobre, hierro, manganeso, níquel y zinc.",
  "Regional soil map (# m), not a lab test — needs a local check.": "Mapa regional de suelos (# m), no un análisis de laboratorio: necesita revisión local.",
  "Regional soil map; not a soil test. Mean of # map cells inside the field.":
    "Mapa regional de suelos; no es un análisis de suelo. Media de # celdas del mapa dentro de la parcela.",
  "Regional soil map; not a soil test. Mean of # map cell inside the field.":
    "Mapa regional de suelos; no es un análisis de suelo. Media de # celda del mapa dentro de la parcela.",
  "Regional soil map; not a soil test.": "Mapa regional de suelos; no es un análisis de suelo.",
  "for this field": "para esta parcela",
  "Satellite estimate at # m on clear days, not a field measurement.": "Estimación satelital a # m en días despejados, no una medición en campo.",
  "Showing: current irrigation. Cubic metres per year for this field.": "Se muestra: riego actual. Metros cúbicos al año para esta parcela.",
  "In the diagram, the aquifer return and the other losses are split between the canal and the field in proportion to the water each one loses (display assumption). Every total shown is the data.":
    "En el diagrama, el retorno al acuífero y las otras pérdidas se reparten entre el canal y la parcela en proporción al agua que pierde cada uno (supuesto de presentación). Cada total mostrado es el dato.",
  "On-farm irrigation efficiency has not been measured in this district; the band reflects that assumption. Field boundaries are estimated by a neural network outside its training region.":
    "La eficiencia del riego en la parcela no se ha medido en este distrito; la banda refleja ese supuesto. Los límites de las parcelas los estima una red neuronal fuera de su región de entrenamiento.",
  "Water need from the FAO Penman–Monteith method with NASA POWER daily climate and a Monte Carlo band (low #, high # thousand m³/ha). Field history from NASA HLS greenness.":
    "Necesidad de agua con el método FAO Penman–Monteith, el clima diario de NASA POWER y una banda Monte Carlo (baja #, alta # millares/ha). Historial de la parcela con el verdor de NASA HLS.",
  "Closed pits in the elevation model": "Hoyos cerrados en el modelo de elevación",
  "of the field: closed pits in the elevation model, mostly within its noise": "de la parcela: hoyos cerrados en el modelo de elevación, casi todos dentro de su ruido",
  "(from the elevation model; small fields are within its noise)": "(del modelo de elevación; las parcelas chicas quedan dentro de su ruido)",
  "drain into this field (largest single inflow; nothing outside the mapped area is counted)":
    "escurren hacia esta parcela (la mayor entrada; no se cuenta nada fuera del área mapeada)",
  "Runoff paths: where the runoff of at least": "Rutas de escurrimiento: donde se concentra el escurrimiento de al menos",
  "of land concentrates": "de terreno",
  "Scale: regional, # m (NASADEM); not field drainage design": "Escala: regional, # m (NASADEM); no es diseño de drenaje de la parcela",
  "(regional, # m (NASADEM); not field drainage design)": "(regional, # m (NASADEM); no es diseño de drenaje de la parcela)",
  "Each pilot area uses its own colour range. Shading and colours come from the elevation model: zone context, not a field measurement.":
    "Cada zona piloto usa su propio rango de colores. El sombreado y los colores salen del modelo de elevación: contexto de zona, no una medición en la parcela.",
  "On the flat valley floor, most path directions come from filling small pits and flats of the elevation model; read the lines as approximate.":
    "En el fondo plano del valle, la mayoría de las direcciones salen de rellenar hoyos y planos del modelo de elevación; lea las líneas como aproximadas.",
  "“Simulate a storm” on the terrain layer, when you run it.": "«Simular una tormenta» en la capa de relieve, cuando usted la corre.",
  "Built Nov #, # from # data files — see About & Data": "Construido nov #, #, con # archivos de datos — vea Acerca de ROOT y sus datos",
  "fields ·": "parcelas ·",
  "E Water term:": "E Plazo del agua:",
  "C Water term:": "C Plazo del agua:",
  "ending soon": "por terminar",
  "committed": "comprometida",
  "This page needs JavaScript to read its data files.": "Esta página necesita JavaScript para leer sus archivos de datos.",

  // «About & Data» (encabezados y textos de la interfaz; las fuentes quedan en inglés)
  "NASA data": "Datos de la NASA",
  "NASA data used by ROOT, read from manifest.json": "Datos de la NASA que usa ROOT, leídos de manifest.json",
  "Challenge data sources": "Fuentes de datos del reto",
  "How the scales fit together": "Cómo encajan las escalas",
  "Tests in sight": "Pruebas a la vista",
  "Repository and AI": "Repositorio e IA",
  "Glossary": "Glosario",
  "Definitions and sources": "Definiciones y fuentes",
  "Sources and product versions": "Fuentes y versiones de los productos",
  "Related documents": "Documentos relacionados",
  "Reading the data sources and the test results…": "Leyendo las fuentes de datos y los resultados de las pruebas…",
  "Where the numbers come from and how we test them. No number in this section is typed by hand: each one is read from the data files.":
    "De dónde salen los números y cómo los probamos. Ningún número de esta sección está escrito a mano: cada uno se lee de los archivos de datos.",
  "Every figure on this page, test results included, is traced in": "Cada cifra de esta página, incluidos los resultados de las pruebas, se rastrea en",
  "with its source, date and script:": "con su fuente, fecha y script:",
  "Code, data and tests on GitHub": "Código, datos y pruebas en GitHub",
  "Full declaration in the README": "Declaración completa en el README",
  "SI/AI tools used:": "Herramientas de IA usadas:",
  "Latest automated test log": "Último registro de pruebas automáticas",
  "Automated gate": "Validación automática",
  "Steps of the last recorded run": "Pasos de la última corrida registrada",
  "Step": "Paso",
  "Status": "Estado",
  "Result": "Resultado",
  "Passed": "Pasó",
  "Ran": "Corrió",
  "Partly run": "Corrida en parte",
  "Not run": "Sin correr",
  "Skipped": "Omitida",
  "Criterion met": "Criterio cumplido",
  "Criterion not met": "Criterio no cumplido",
  "Criterion, declared before the result:": "Criterio, declarado antes del resultado:",
  "Resource": "Recurso",
  "Agency": "Agencia",
  "Role in ROOT": "Papel en ROOT",
  "What ROOT uses it for": "Para qué lo usa ROOT",
  "Files": "Archivos",
  "Files and recorded source": "Archivos y fuente registrada",
  "Source files (#)": "Archivos fuente (#)",
  "Product": "Producto",
  "Indicator": "Indicador",
  "Value": "Valor",
  "Detail": "Detalle",
  "Data": "Datos",
  "In use": "En uso",
  "in use": "en uso",
  "High": "Alta",
  "Period:": "Periodo:",
  "Script:": "Script:",
  "Difference:": "Diferencia:",
  "Groups:": "Grupos:",
  "Name parts:": "Partes del nombre:",
  "Cut paths:": "Rutas de corte:",
  "Area note:": "Nota de la zona:",
  "Input to the build (no use recorded)": "Entrada de la reconstrucción (sin uso registrado)",
  "Other sources in the build": "Otras fuentes de la reconstrucción",
  "in the build cache": "en la caché de la reconstrucción",
  "Design value: an interface setting, not data.": "Valor de diseño: un ajuste de la interfaz, no un dato.",
  "Evidence labels next to each source: [V] verified in a primary source":
    "Etiquetas de evidencia junto a cada fuente: [V] verificada en una fuente primaria",
  "[P] press or secondary source": "[P] prensa o fuente secundaria",
  "[S] stated assumption": "[S] supuesto declarado",
  "[NE] not found": "[NE] no encontrada",
  "rebuilds everything from the cached data and runs every check; the site is published when, and just when, they pass.":
    "reconstruye todo desde los datos en caché y corre cada comprobación; el sitio se publica cuando pasan, y no antes.",
  "The unit used in the district: a thousand m³ of water per hectare. See the equivalence under the slider.":
    "La unidad que se usa en el distrito: mil m³ de agua por hectárea. Vea la equivalencia bajo el deslizador.",
  "Millar": "Millar",
  "A satellite index of how green a field is. ROOT reads it from NASA HLS images.":
    "Un índice satelital de qué tan verde está una parcela. ROOT lo lee de imágenes NASA HLS.",
  "Evapotranspiration: the water the crop transpires plus what evaporates from the soil. It is the water actually consumed.":
    "Evapotranspiración: el agua que transpira el cultivo más la que se evapora del suelo. Es el agua que realmente se consume.",
  "Days with almost no green cover. Bare soil in the windy season can blow away.":
    "Días casi sin cubierta verde. El suelo desnudo en la temporada de viento puede volarse.",
  "On the map or in the field list. Colors and symbols show whether the allocation covers the field's crop.":
    "En el mapa o en la lista de parcelas. Los colores y símbolos indican si la dotación cubre el cultivo de la parcela.",
  "Field boundaries": "Límites de las parcelas",
  "Field boundaries are neural-network predictions from Fields of The World, used outside the model's training domain and filtered by confidence.":
    "Los límites de las parcelas son predicciones de una red neuronal de Fields of The World, usadas fuera del dominio de entrenamiento del modelo y filtradas por confianza.",
  "Fields of The World: neural-network predictions from satellite images, not surveyed":
    "Fields of The World: predicciones de una red neuronal a partir de imágenes satelitales, sin levantamiento en campo",
  "NASA POWER weather is one grid-cell series per pilot area, so fields with the same rotation in the same area share one water need.":
    "El clima de NASA POWER es una serie de una celda por zona piloto, así que las parcelas con la misma rotación en la misma zona comparten una necesidad de agua.",
  "HLS greenness is summarized per field, month by month.": "El verdor de HLS se resume por parcela, mes a mes.",
  "Fields mirrored": "Parcelas reflejadas",
}));

// Las cifras del texto: enteros, decimales y miles («1,230», «12.4»). El punto final de una frase no cuenta.
const NUMERO = /\d+(?:[.,]\d+)*/g;

// Frases que llevan dentro el nombre de un cultivo u opción (X): se traduce X con el diccionario y se arma la frase.
// El nombre (X) no lleva punto ni dos puntos: así un patrón no se traga dos frases.
// Se comparan con la forma (números como «#»); los «#» de la salida se llenan en el mismo orden.
const nombre = (x) => ES.get(x) ?? x;
const PATRONES = [
  [/^With # thousand m³\/ha, the current rotation \((.+)\) has enough water for # of # hectares\.$/,
    (x) => `Con # millares/ha, la rotación actual (${nombre(x)}) tiene agua suficiente para # de # hectáreas.`],
  [/^With # thousand m³\/ha, the current rotation \((.+)\) has enough water for all # hectares\.$/,
    (x) => `Con # millares/ha, la rotación actual (${nombre(x)}) tiene agua suficiente para las # hectáreas.`],
  [/^([^.:]+) ties up water for #–# years \(#–# years left\)\.$/, (x) => `${nombre(x)} compromete agua por #–# años (quedan #–# años).`],
  [/^([^.:]+) ties up water for # years? \(# years? left\)\.$/, (x) => `${nombre(x)} compromete agua por # años (quedan # años).`],
  [/^([^.:]+) — confidence not available$/, (x) => `${nombre(x)} — confianza no disponible`],
  [/^Compared with the current rotation of this field \((.+)\):$/, (x) => `Comparada con la rotación actual de esta parcela (${nombre(x)}):`],
  [/^([^.:]+) asks for # thousand m³ per hectare per year and commits water for one season\.$/,
    (x) => `${nombre(x)} pide # millares por hectárea al año y compromete agua por una temporada.`],
  [/^With your allocation of # thousand m³\/ha it covers #% of the need: enough for the whole field \(# ha\)\.$/,
    () => "Con su dotación de # millares/ha cubre el # % de la necesidad: alcanza para toda la parcela (# ha)."],
  [/^With your allocation of # thousand m³\/ha it covers #% of the need: enough for # of # ha\.$/,
    () => "Con su dotación de # millares/ha cubre el # % de la necesidad: alcanza para # de # ha."],
];

/** Traduce una frase completa por su forma; null si la forma no está en el diccionario ni en los patrones. */
function porForma(frase) {
  const numeros = frase.match(NUMERO) ?? [];
  // Espacios que no se cortan (entre cifra y unidad) cuentan como espacios normales para buscar la forma.
  const forma = frase.replace(NUMERO, "#").replace(/[  ]/g, " ");
  let plantilla = ES.get(forma);
  if (plantilla === undefined) {
    for (const [patron, armar] of PATRONES) {
      const m = forma.match(patron);
      if (m) { plantilla = armar(...m.slice(1)); break; }
    }
  }
  if (plantilla === undefined) return null;
  let i = 0;
  return plantilla.replace(/#/g, () => numeros[i++] ?? "#");
}

/** Rótulo y valor («Forage maize: pH 8.1 is…», «Current rotation: Alfalfa»): los dos lados por separado. */
function porRotulo(frase) {
  const dos = frase.indexOf(": ");
  if (dos <= 0) return null;
  const izqTexto = frase.slice(0, dos);
  const derTexto = frase.slice(dos + 2);
  const izq = porForma(`${izqTexto}:`) ?? (porForma(izqTexto) !== null ? `${porForma(izqTexto)}:` : null);
  const der = porForma(derTexto) ?? porForma(derTexto.charAt(0).toLowerCase() + derTexto.slice(1));
  if (izq === null && der === null) return null;
  return `${izq ?? `${izqTexto}:`} ${der ?? derTexto}`;
}

/** Traduce un texto al español; lo que no conoce lo deja igual (en inglés). Conserva los espacios de los bordes. */
export function traducir(texto) {
  if (typeof texto !== "string") return texto;
  const limpio = texto.trim();
  if (!limpio) return texto;
  let salida = porForma(limpio);
  // Rótulos compuestos con « · » (p. ej. «Alfalfa · 3.2 ha · Not enough water»): cada pedazo por separado.
  if (salida === null && limpio.includes(" · ")) {
    const partes = limpio.split(" · ").map((p) => porForma(p) ?? p);
    salida = partes.join(" · ");
  }
  if (salida === null) salida = porRotulo(limpio);
  // Varias frases en un solo texto: cada una por separado; si ninguna se conoce, queda igual.
  if (salida === null && /\.\s+[A-Z]/.test(limpio)) {
    const frases = limpio.split(/(?<=\.)\s+(?=[A-Z⚠])/);
    const hechas = frases.map((f) => porForma(f) ?? porRotulo(f));
    if (hechas.some((h) => h !== null)) salida = hechas.map((h, i) => h ?? frases[i]).join(" ");
  }
  if (salida === null || salida === limpio) return texto;
  return texto.replace(limpio, () => salida);
}

// ---------------------------------------------------------------------------
// Montaje en la página
// ---------------------------------------------------------------------------
const ATRIBUTOS = ["aria-label", "placeholder", "title"];
// No se traduce: código, el selector de idioma ni lo que ya declara su propio idioma (el mensaje en español).
const EXCLUIDOS = "script, style, code, pre, textarea, #idioma, [lang]:not(html)";

/** Idioma del explorador: español si así se eligió (aquí o en el tablero); si no, inglés. */
export function idiomaExplorador() {
  return idioma() === "es" ? "es" : "en";
}

/** Pone el selector y traduce la página; app.js lo llama al arrancar. */
export function montarIdiomaExplorador(selector) {
  if (!selector || typeof document === "undefined") return;
  const raiz = document.documentElement;
  const originales = new WeakMap(); // nodo → Map(clave → { original, traducido })
  let actual = idiomaExplorador();

  function adaptar(nodo, clave, valor, escribir) {
    if (!valor) return;
    const entradas = originales.get(nodo);
    const anterior = entradas?.get(clave);
    // Si el valor es la traducción que pusimos, el original es el guardado; si no, app.js escribió uno nuevo.
    const original = anterior && anterior.traducido === valor ? anterior.original : valor;
    const traducido = actual === "es" ? traducir(original) : original;
    if (original !== traducido) {
      const mapa = entradas ?? new Map();
      mapa.set(clave, { original, traducido });
      originales.set(nodo, mapa);
    } else {
      entradas?.delete(clave);
    }
    if (valor !== traducido) escribir(traducido);
  }

  function adaptarNodo(nodo) {
    if (nodo.nodeType === Node.TEXT_NODE) {
      if (!nodo.parentElement || nodo.parentElement.closest(EXCLUIDOS)) return;
      adaptar(nodo, "texto", nodo.data, (v) => { nodo.data = v; });
    } else if (nodo.nodeType === Node.ELEMENT_NODE && !nodo.closest(EXCLUIDOS)) {
      for (const a of ATRIBUTOS) adaptar(nodo, a, nodo.getAttribute(a), (v) => nodo.setAttribute(a, v));
    }
  }

  function recorrer(nodo) {
    adaptarNodo(nodo);
    if (nodo.nodeType !== Node.ELEMENT_NODE) return;
    const paseo = document.createTreeWalker(nodo, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    while (paseo.nextNode()) adaptarNodo(paseo.currentNode);
  }

  const observador = new MutationObserver((cambios) => {
    if (actual !== "es") return;
    for (const c of cambios) {
      if (c.type === "childList") c.addedNodes.forEach(recorrer);
      else adaptarNodo(c.target);
    }
    observador.takeRecords(); // los cambios que acabamos de escribir no se vuelven a revisar
  });

  function aplicar() {
    raiz.lang = actual;
    selector.value = actual;
    recorrer(document.head);
    recorrer(document.body);
    observador.takeRecords();
  }

  selector.addEventListener("change", () => {
    actual = selector.value === "es" ? "es" : "en";
    fijarIdioma(actual); // la misma elección vale en el tablero
    aplicar();
  });
  aplicar();
  observador.observe(raiz, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
}
