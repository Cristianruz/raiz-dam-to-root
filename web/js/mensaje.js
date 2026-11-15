// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/mensaje.js — Mensaje al agricultor (maqueta de WhatsApp) y ficha imprimible (kit C4; S9 §3, pantalla 3).
// Módulo ES, sin dependencias. No envía nada, no guarda nada y no tiene formularios.
//
// Qué exporta (lo conecta app.js; este archivo no toca el resto de la página):
//   htmlWhatsApp(parcela, opciones, ctx) -> string
//       MAQUETA visual de un mensaje de WhatsApp para el agricultor, en español, inglés, portugués o francés
//       (selector «Message language»; abre en el idioma del teléfono si hay plantilla, si no en español): saludo breve, las
//       opciones numeradas (la actual y las alternativas), por opción una línea de agua (cuánta pide al
//       año, por cuántos años obliga y para cuántas hectáreas alcanza con la dotación elegida) y una de
//       suelo; «Responda 1, 2 o 3» y el aviso «Es una simulación; la asignación oficial la decide Conagua.»
//         parcela   properties de la parcela (o el Feature completo) de parcelas.geojson
//         opciones  cubo.parcelas[id].opciones (en el orden del cubo; la ACTUAL va primero)
//         ctx       { reglas, D, r, idioma?, plantilla?, sinOpciones? }
//           reglas     el módulo web/reglas.js (se usa reglas.evaluarOpcion; la regla vive solo ahí)
//           D          dotación elegida con el deslizador (millares/ha)
//           r          lluvia elegida (0 o la variante seca de cubo.lluvia_pct)
//           idioma     «es», «en», «pt» o «fr» (opcional). Sin él: el último elegido en el selector, el guardado en
//                      el navegador (localStorage, solo comodidad) o el de navigator.languages; si no, español.
//           plantilla  contenido de web/data/whatsapp_plantilla.json (opcional). Si falta, se usa la
//                      última leída con cargarPlantillaWhatsApp() y, si tampoco hay, la plantilla interna.
//           sinOpciones código cubo.parcelas[id].sin_opciones de una parcela CLASIFICADA sin opciones
//                      («sin_clima_zona», «sin_actual»): el mensaje dice qué falta, no «el mapa no sabe».
//       Inserta css/mensaje.css en la página si aún no está enlazada. El selector de idioma vuelve a dibujar el
//       mensaje en su lugar (un solo oyente «change» en document; app.js no interviene).
//   textoWhatsApp(parcela, opciones, ctx) -> string
//       El mismo mensaje como texto plano con el formato de WhatsApp (*negrita*, _cursiva_).
//   idiomaInicialWhatsApp() -> "es" | "en" | "pt" | "fr"     idioma con que abre el mensaje si no se pide uno.
//   IDIOMAS_WHATSAPP, NOTA_TRADUCCION                        lista de idiomas y la nota de las traducciones.
//   cargarPlantillaWhatsApp(url = "data/whatsapp_plantilla.json") -> Promise<plantilla | null>
//       Lee la plantilla una sola vez por URL y la valida; null si no existe o no sirve.
//       Llámela solo si el archivo existe: en Chromium un 404 deja un error en la consola.
//   imprimirFicha(ctx = {}) -> Promise<boolean>
//       Imprime la ficha abierta con window.print() y la hoja css/imprimir.css (@media print): encabezado,
//       memoria, tarjetas con sus tres renglones, La gota estática, la dotación y la lluvia elegidas, la
//       fecha, las fuentes y el aviso de juicio local; oculta los controles y el mapa. false si no hay ficha.
//         ctx  { D?, r?, cubo?, manifiesto?, errorManifiesto?, parcela?, ficha?, fecha?, imprimir? }
//           D, r        dotación y lluvia elegidas; si faltan, se leen de la pantalla (#dotacion, #lluvia)
//           cubo        cubo.json (marca de la dotación, punto de medición, zona, meta.generado, meta.fuentes)
//           manifiesto  manifest.json (fuentes_de_origen: la lista de fuentes); sin él, cubo.meta.fuentes
//           errorManifiesto  detalle si manifest.json existe pero no se pudo leer (la hoja lo dice)
//           parcela     properties de la parcela (para el nombre de la zona piloto)
//           ficha       el elemento de la ficha (por omisión #ficha)
//           fecha       fecha de impresión (por omisión, hoy)
//           imprimir    función que imprime (por omisión window.print; las pruebas la sustituyen)
//   fmtFechaUi(valor, estilo = "medium") -> string
//       Fecha de la hoja impresa en inglés. «AAAA-MM-DD» (sin hora) sale el mismo día en cualquier zona
//       horaria; un instante con hora o un Date, en la hora local. Se exporta para las pruebas (tests/fechas.test.js).
//
// Formato de web/data/whatsapp_plantilla.json (todas las llaves son opcionales; la que falte o no pase la
// validación se toma de la plantilla interna). Solo cambia el mensaje en español. Texto con marcadores {{…}} y
// SIN dígitos (las plantillas internas de los cuatro idiomas tienen las mismas llaves):
//   saludo          {{parcela}} {{area}} {{d}} {{lluvia}}
//   opcion          {{n}} {{nombre}}                         (título de cada opción)
//   agua            {{estado}} {{lamina}} {{plazo}} {{d}} {{ha}} {{area}} {{rango_ha}}
//   agua_sin_riego  {{estado}} {{plazo}}                     (opción con necesidad cero: descanso)
//   agua_sin_dato   {{estado}}                               (la opción no trae lámina para esa lluvia)
//   suelo           {{dias}} {{origen}} {{leguminosa}} {{plagas}}
//   suelo_sin_dias  {{leguminosa}} {{plagas}}
//   respuesta       {{numeros}}                              («Responda {{numeros}}.» -> «Responda 1, 2 o 3.»)
//   sin_opciones    {{parcela}} {{area}}                     (parcela abstenida: el mapa no sabe qué hay)
//   sin_calculo     {{parcela}} {{area}} {{motivo}}          (parcela CLASIFICADA sin opciones: el motivo sale
//                                                             del código cubo.parcelas.<id>.sin_opciones)
// Se acepta *negrita* y _cursiva_ como en WhatsApp. El aviso de simulación y el de juicio local son fijos
// (uno por idioma).
//
// Reglas de este archivo:
// - Ninguna cifra escrita a mano: los números salen de parcelas.geojson, cubo.json y de las reglas de
//   web/reglas.js (evaluarOpcion); la numeración de las opciones y «Responda 1, 2 o 3» se calculan con el
//   número de opciones. Los números del código son medidas de diseño (tiempos de espera), no datos.
// - Interfaz en inglés; el mensaje de WhatsApp, en español, inglés, portugués o francés (CLAUDE.md, regla 9,
//   ampliada por docs/decisiones/2026-11-14_whatsapp_idiomas.md). La ficha impresa, en inglés.
// - No se promete ahorro, no se reparte, vende ni intercambia agua y no se pronostica la presa.

const LOCALE_UI = "en-US"; // ficha imprimible (interfaz)
const RUTA_PLANTILLA = "data/whatsapp_plantilla.json";
const HOJA_MENSAJE = new URL("../css/mensaje.css", import.meta.url).href;
const HOJA_IMPRIMIR = new URL("../css/imprimir.css", import.meta.url).href;
const ESPERA_HOJA_MS = 3000; // tope de espera de la hoja de impresión antes de imprimir de todos modos

// ---------------------------------------------------------------------------
// Idiomas del mensaje (docs/decisiones/2026-11-14_whatsapp_idiomas.md): español, inglés, portugués y francés.
// Cada idioma trae una plantilla completa (las mismas llaves y marcadores {{…}} que MARCADORES) y sus palabras
// sueltas (semáforo, sí/no, cultivos, avisos). Ninguna lleva dígitos: los números entran por marcadores y se
// formatean con Intl en el idioma elegido, con su separador decimal.
// Las plantillas en inglés, portugués y francés las redactó la IA a partir de la española: machine-drafted;
// review by a speaker (la vista lo dice al elegirlas, NOTA_TRADUCCION). Las palabras del agua de riego se
// dejan como se dicen en el distrito («millar») y se explican la primera vez.
// Agregar un idioma: otra entrada con las mismas llaves; tests/mensaje.test.js revisa llaves, marcadores,
// dígitos y palabras prohibidas en todas.
// ---------------------------------------------------------------------------
const IDIOMA_BASE = "es"; // si el navegador no pide uno de los cuatro
const LLAVE_IDIOMA = "root.whatsapp.idioma"; // preferencia guardada en el navegador (solo comodidad)
export const NOTA_TRADUCCION = "Machine-drafted translation; review by a speaker.";
const NBSP = " "; // espacio fino antes de «:» y «;» en francés

const IDIOMAS = {
  es: {
    nombre: "Español",
    nombre_en: "Spanish",
    locale: "es-MX",
    revisado: true, // la española la escribió el equipo; las demás, la IA (NOTA_TRADUCCION)
    plantilla: {
      saludo:
        "Buen día. Estas son las opciones de agua para su parcela {{parcela}} ({{area}} ha) " +
        "con una dotación de {{d}} millares/ha y {{lluvia}}:",
      opcion: "{{n}}. {{nombre}}",
      agua:
        "Agua {{estado}}: pide {{lamina}} millares/ha al año y obliga por {{plazo}}. " +
        "Con {{d}} millares/ha alcanza para {{ha}} de {{area}} ha{{rango_ha}}.",
      agua_sin_riego: "Agua {{estado}}: no necesita riego; obliga por {{plazo}}.",
      agua_sin_dato: "Agua: sin dato de lámina para esta lluvia.",
      suelo:
        "Suelo: {{dias}} días desnudo en temporada de viento ({{origen}}); " +
        "leguminosa: {{leguminosa}}; rompe ciclo de plagas: {{plagas}}.",
      suelo_sin_dias: "Suelo: sin dato de días desnudo; leguminosa: {{leguminosa}}; rompe ciclo de plagas: {{plagas}}.",
      respuesta: "Responda {{numeros}}.",
      sin_opciones:
        "Buen día. En su parcela {{parcela}} ({{area}} ha) el mapa de cultivos no está seguro de qué hay sembrado, " +
        "así que no calculamos opciones. Revísela con su técnico.",
      sin_calculo:
        "Buen día. Su parcela {{parcela}} ({{area}} ha) sí está clasificada, pero aún no calculamos sus opciones: " +
        "{{motivo}}. Revísela con su técnico.",
    },
    palabras: {
      estado: { verde: "✓ suficiente", ambar: "⚠ justa", rojo: "✕ insuficiente", gris: "? sin clasificar" },
      origen: { medido: "medido", estimado: "estimado" },
      sin_origen: "sin origen",
      si: "sí",
      no: "no",
      sin_dato: "sin dato",
      anio: "año",
      anios: "años",
      plazo_sin_dato: "un plazo sin dato",
      lluvia_igual: "la lluvia de siempre",
      lluvia_menos: "{{pct}} menos lluvia",
      lluvia_mas: "{{pct}} más lluvia",
      rango_ha: " (entre {{bajo}} y {{alto}})",
      motivos: {
        sin_clima_zona: "falta el clima de su zona",
        sin_actual: "no se pudo armar su rotación actual con los datos de su zona",
      },
      motivo_otro: "faltan datos de su zona",
      cultivos: {
        alfalfa: "Alfalfa",
        nogal: "Nogal",
        chile: "Chile",
        maiz_forrajero: "Maíz forrajero",
        sorgo: "Sorgo forrajero",
        algodon: "Algodón",
        cereal_invierno: "Cereal de invierno",
        forraje_verano: "Forraje de verano",
        avena: "Avena",
        barbecho: "Barbecho",
        descanso: "No sembrar (rastrojo en pie)",
        sin_clasificar: "Sin clasificar",
      },
      opciones: { alfalfa_corte_verano: "Alfalfa con corte de riego en verano" },
      rotacion_actual: "Rotación actual",
      dos_puntos: ": ",
      aviso_simulacion: "Es una simulación; la asignación oficial la decide Conagua.",
      aviso_juicio: "Esta herramienta apoya y no sustituye el juicio del agricultor ni del técnico.",
      vista_previa: "vista previa · no se envía",
    },
  },
  en: {
    nombre: "English",
    nombre_en: "English",
    locale: "en-US",
    revisado: false,
    plantilla: {
      saludo:
        "Hello. These are the water options for your field {{parcela}} ({{area}} ha) " +
        "with an allocation of {{d}} millares/ha (a millar is a thousand cubic meters of water) and {{lluvia}}:",
      opcion: "{{n}}. {{nombre}}",
      agua:
        "Water {{estado}}: it needs {{lamina}} millares/ha a year and commits you for {{plazo}}. " +
        "With {{d}} millares/ha it is enough for {{ha}} of {{area}} ha{{rango_ha}}.",
      agua_sin_riego: "Water {{estado}}: no irrigation needed; it commits you for {{plazo}}.",
      agua_sin_dato: "Water: no irrigation depth data for this rainfall.",
      suelo:
        "Soil: {{dias}} days bare in the windy season ({{origen}}); " +
        "legume: {{leguminosa}}; breaks the pest cycle: {{plagas}}.",
      suelo_sin_dias: "Soil: no data on bare days; legume: {{leguminosa}}; breaks the pest cycle: {{plagas}}.",
      respuesta: "Reply {{numeros}}.",
      sin_opciones:
        "Hello. For your field {{parcela}} ({{area}} ha) the crop map is not sure what is planted, " +
        "so we did not calculate options. Please check it with your technician.",
      sin_calculo:
        "Hello. Your field {{parcela}} ({{area}} ha) is classified, but we have not calculated its options yet: " +
        "{{motivo}}. Please check it with your technician.",
    },
    palabras: {
      estado: { verde: "✓ enough", ambar: "⚠ tight", rojo: "✕ not enough", gris: "? unclassified" },
      origen: { medido: "measured", estimado: "estimated" },
      sin_origen: "no source",
      si: "yes",
      no: "no",
      sin_dato: "no data",
      anio: "year",
      anios: "years",
      plazo_sin_dato: "a term with no data",
      lluvia_igual: "the usual rainfall",
      lluvia_menos: "{{pct}} less rain",
      lluvia_mas: "{{pct}} more rain",
      rango_ha: " (between {{bajo}} and {{alto}})",
      motivos: {
        sin_clima_zona: "the climate data for your area is missing",
        sin_actual: "your current rotation could not be built with the data for your area",
      },
      motivo_otro: "data for your area is missing",
      cultivos: {
        alfalfa: "Alfalfa",
        nogal: "Pecan",
        chile: "Chile pepper",
        maiz_forrajero: "Forage maize",
        sorgo: "Forage sorghum",
        algodon: "Cotton",
        cereal_invierno: "Winter cereal",
        forraje_verano: "Summer forage",
        avena: "Oats",
        barbecho: "Fallow",
        descanso: "Do not plant (standing stubble)",
        sin_clasificar: "Unclassified",
      },
      opciones: { alfalfa_corte_verano: "Alfalfa with a summer irrigation cut" },
      rotacion_actual: "Current rotation",
      dos_puntos: ": ",
      aviso_simulacion: "This is a simulation; the official water assignment is decided by Conagua.",
      aviso_juicio: "This tool supports, and does not replace, the judgment of the farmer or the technician.",
      vista_previa: "preview · not sent",
    },
  },
  pt: {
    nombre: "Português",
    nombre_en: "Portuguese",
    locale: "pt-BR",
    revisado: false,
    plantilla: {
      saludo:
        "Olá. Estas são as opções de água para o seu talhão {{parcela}} ({{area}} ha) " +
        "com uma dotação de {{d}} millares/ha (um millar são mil metros cúbicos de água) e {{lluvia}}:",
      opcion: "{{n}}. {{nombre}}",
      agua:
        "Água {{estado}}: pede {{lamina}} millares/ha por ano e compromete você por {{plazo}}. " +
        "Com {{d}} millares/ha dá para {{ha}} de {{area}} ha{{rango_ha}}.",
      agua_sin_riego: "Água {{estado}}: não precisa de irrigação; compromete você por {{plazo}}.",
      agua_sin_dato: "Água: sem dado de lâmina para esta chuva.",
      suelo:
        "Solo: {{dias}} dias descoberto na época de vento ({{origen}}); " +
        "leguminosa: {{leguminosa}}; quebra o ciclo de pragas: {{plagas}}.",
      suelo_sin_dias: "Solo: sem dado de dias descoberto; leguminosa: {{leguminosa}}; quebra o ciclo de pragas: {{plagas}}.",
      respuesta: "Responda {{numeros}}.",
      sin_opciones:
        "Olá. No seu talhão {{parcela}} ({{area}} ha) o mapa de cultivos não tem certeza do que está plantado, " +
        "por isso não calculamos opções. Revise-o com o seu técnico.",
      sin_calculo:
        "Olá. O seu talhão {{parcela}} ({{area}} ha) está classificado, mas ainda não calculamos as suas opções: " +
        "{{motivo}}. Revise-o com o seu técnico.",
    },
    palabras: {
      estado: { verde: "✓ suficiente", ambar: "⚠ justa", rojo: "✕ insuficiente", gris: "? sem classificar" },
      origen: { medido: "medido", estimado: "estimado" },
      sin_origen: "sem origem",
      si: "sim",
      no: "não",
      sin_dato: "sem dado",
      anio: "ano",
      anios: "anos",
      plazo_sin_dato: "um prazo sem dado",
      lluvia_igual: "a chuva de sempre",
      lluvia_menos: "{{pct}} menos chuva",
      lluvia_mas: "{{pct}} mais chuva",
      rango_ha: " (entre {{bajo}} e {{alto}})",
      motivos: {
        sin_clima_zona: "falta o clima da sua zona",
        sin_actual: "não foi possível montar a sua rotação atual com os dados da sua zona",
      },
      motivo_otro: "faltam dados da sua zona",
      cultivos: {
        alfalfa: "Alfafa",
        nogal: "Nogueira-pecã",
        chile: "Pimenta (chile)",
        maiz_forrajero: "Milho forrageiro",
        sorgo: "Sorgo forrageiro",
        algodon: "Algodão",
        cereal_invierno: "Cereal de inverno",
        forraje_verano: "Forragem de verão",
        avena: "Aveia",
        barbecho: "Pousio",
        descanso: "Não plantar (restolho em pé)",
        sin_clasificar: "Sem classificar",
      },
      opciones: { alfalfa_corte_verano: "Alfafa com corte de irrigação no verão" },
      rotacion_actual: "Rotação atual",
      dos_puntos: ": ",
      aviso_simulacion: "É uma simulação; a atribuição oficial de água é decidida pela Conagua.",
      aviso_juicio: "Esta ferramenta apoia e não substitui o julgamento do agricultor nem do técnico.",
      vista_previa: "pré-visualização · não é enviada",
    },
  },
  fr: {
    nombre: "Français",
    nombre_en: "French",
    locale: "fr-FR",
    revisado: false,
    plantilla: {
      saludo:
        `Bonjour. Voici les options d'eau pour votre parcelle {{parcela}} ({{area}} ha) ` +
        `avec une dotation de {{d}} millares/ha (un millar équivaut à mille mètres cubes d'eau) et {{lluvia}}${NBSP}:`,
      opcion: "{{n}}. {{nombre}}",
      agua:
        `Eau {{estado}}${NBSP}: demande {{lamina}} millares/ha par an et vous engage pour {{plazo}}. ` +
        `Avec {{d}} millares/ha, cela suffit pour {{ha}} ha sur {{area}} ha{{rango_ha}}.`,
      agua_sin_riego: `Eau {{estado}}${NBSP}: pas besoin d'irrigation${NBSP}; vous engage pour {{plazo}}.`,
      agua_sin_dato: `Eau${NBSP}: pas de donnée de lame d'eau pour cette pluie.`,
      suelo:
        `Sol${NBSP}: {{dias}} jours à nu pendant la saison des vents ({{origen}})${NBSP}; ` +
        `légumineuse${NBSP}: {{leguminosa}}${NBSP}; casse le cycle des ravageurs${NBSP}: {{plagas}}.`,
      suelo_sin_dias:
        `Sol${NBSP}: pas de donnée sur les jours à nu${NBSP}; légumineuse${NBSP}: {{leguminosa}}${NBSP}; ` +
        `casse le cycle des ravageurs${NBSP}: {{plagas}}.`,
      respuesta: "Répondez {{numeros}}.",
      sin_opciones:
        `Bonjour. Pour votre parcelle {{parcela}} ({{area}} ha), la carte des cultures n'est pas sûre de ce qui est semé${NBSP}; ` +
        `nous n'avons donc pas calculé d'options. Vérifiez-la avec votre technicien.`,
      sin_calculo:
        `Bonjour. Votre parcelle {{parcela}} ({{area}} ha) est identifiée, mais nous n'avons pas encore calculé ses options${NBSP}: ` +
        `{{motivo}}. Vérifiez-la avec votre technicien.`,
    },
    palabras: {
      estado: { verde: "✓ suffisante", ambar: "⚠ juste", rojo: "✕ insuffisante", gris: "? non classée" },
      origen: { medido: "mesuré", estimado: "estimé" },
      sin_origen: "sans origine",
      si: "oui",
      no: "non",
      sin_dato: "pas de donnée",
      anio: "an",
      anios: "ans",
      plazo_sin_dato: "une durée sans donnée",
      lluvia_igual: "la pluie habituelle",
      lluvia_menos: "{{pct}} de pluie en moins",
      lluvia_mas: "{{pct}} de pluie en plus",
      rango_ha: " (entre {{bajo}} et {{alto}})",
      motivos: {
        sin_clima_zona: "le climat de votre zone manque",
        sin_actual: "votre rotation actuelle n'a pas pu être construite avec les données de votre zone",
      },
      motivo_otro: "des données de votre zone manquent",
      cultivos: {
        alfalfa: "Luzerne",
        nogal: "Pacanier",
        chile: "Piment",
        maiz_forrajero: "Maïs fourrager",
        sorgo: "Sorgho fourrager",
        algodon: "Coton",
        cereal_invierno: "Céréale d'hiver",
        forraje_verano: "Fourrage d'été",
        avena: "Avoine",
        barbecho: "Jachère",
        descanso: "Ne pas semer (chaumes sur pied)",
        sin_clasificar: "Non identifiée",
      },
      opciones: { alfalfa_corte_verano: "Luzerne avec arrêt d'irrigation en été" },
      rotacion_actual: "Rotation actuelle",
      dos_puntos: `${NBSP}: `,
      aviso_simulacion: `C'est une simulation${NBSP}; l'attribution officielle d'eau est décidée par la Conagua.`,
      aviso_juicio: "Cet outil aide et ne remplace pas le jugement de l'agriculteur ni du technicien.",
      vista_previa: "aperçu · non envoyé",
    },
  },
};
// Para las pruebas y para quien quiera listar los idiomas (código, nombre propio, locale y si lo revisó una persona).
export const IDIOMAS_WHATSAPP = Object.entries(IDIOMAS).map(([codigo, L]) => ({
  codigo,
  nombre: L.nombre,
  nombre_en: L.nombre_en,
  locale: L.locale,
  revisado: L.revisado,
}));
// La plantilla en español es la base de la plantilla externa (web/data/whatsapp_plantilla.json).
const PLANTILLA_INTERNA = IDIOMAS[IDIOMA_BASE].plantilla;

// Marcadores que acepta cada llave de una plantilla externa (los demás la invalidan).
const MARCADORES = {
  saludo: ["parcela", "area", "d", "lluvia"],
  opcion: ["n", "nombre"],
  agua: ["estado", "lamina", "plazo", "d", "ha", "area", "rango_ha"],
  agua_sin_riego: ["estado", "plazo"],
  agua_sin_dato: ["estado"],
  suelo: ["dias", "origen", "leguminosa", "plagas"],
  suelo_sin_dias: ["leguminosa", "plagas"],
  respuesta: ["numeros"],
  sin_opciones: ["parcela", "area"],
  sin_calculo: ["parcela", "area", "motivo"],
};
// Palabras que ninguna plantilla puede usar, en los cuatro idiomas (CLAUDE.md, regla 10; guía de P6): «first»,
// «only», promesas de ahorro o garantía, repartir, vender o intercambiar agua y pronosticar.
// (\b no sirve con letras acentuadas: se usan lookarounds de Unicode.)
// Una expresión por idioma (expresiones, no cadenas: la prueba de lenguaje revisa las cadenas de la página).
const PROHIBIDAS_POR_IDIOMA = [
  /first|only|best|recommend\p{L}*|promis\p{L}*|sav(?:e|es|ed|ing|ings)|guarantee\p{L}*|sell|trade|exchange|forecast/u, // inglés
  /primer[oa]?s?|únic[oa]s?|mejor(?:es)?|recomend\p{L}*|promet\p{L}*|ahorr\p{L}*|garantiza\p{L}*|repart\p{L}*|vend\p{L}*|intercambi\p{L}*|pronóstic\p{L}*/u, // español
  /primeir[oa]s?|melhor(?:es)?|recomend\p{L}*|promet\p{L}*|economi\p{L}*|poup\p{L}*|garant\p{L}*|troc\p{L}*|previs\p{L}*|distribu\p{L}*/u, // portugués
  /premi(?:er|ère|ers|ères)|seul\p{L}*|uniqu\p{L}*|meilleur\p{L}*|recommand\p{L}*|promet\p{L}*|promis\p{L}*|économ\p{L}*|épargn\p{L}*|échang\p{L}*|prévision\p{L}*|prévoi\p{L}*|répart\p{L}*/u, // francés
];
const PROHIBIDAS = new RegExp(
  `(?<![\\p{L}\\p{N}_])(${PROHIBIDAS_POR_IDIOMA.map((r) => r.source).join("|")})(?![\\p{L}\\p{N}_])`,
  "iu",
);

/** ¿El texto usa una palabra prohibida en alguno de los cuatro idiomas? (Se exporta para las pruebas.) */
export function tienePalabraProhibida(texto) {
  return PROHIBIDAS.test(String(texto ?? ""));
}

/**
 * Revisión de las plantillas internas de los cuatro idiomas (la usa tests/mensaje.test.js): cada idioma trae
 * todas las llaves de MARCADORES, solo con sus marcadores, sin dígitos fuera de ellos y, en la plantilla y en
 * sus palabras sueltas, sin palabras prohibidas. Devuelve la lista de problemas (vacía si todo está bien).
 */
export function problemasIdiomasWhatsApp() {
  const problemas = [];
  const textos = (v) => (typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(textos) : []);
  for (const [codigo, L] of Object.entries(IDIOMAS)) {
    for (const [llave, permitidos] of Object.entries(MARCADORES)) {
      const t = L.plantilla[llave];
      if (typeof t !== "string" || !t.trim()) {
        problemas.push(`${codigo}.${llave}: missing`);
        continue;
      }
      const usados = [...t.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
      if (usados.some((u) => !permitidos.includes(u))) problemas.push(`${codigo}.${llave}: unknown marker`);
      if (/\d/.test(t.replace(/\{\{\w+\}\}/g, ""))) problemas.push(`${codigo}.${llave}: digits outside the markers`);
    }
    for (const t of [...textos(L.plantilla), ...textos(L.palabras)]) {
      if (PROHIBIDAS.test(t)) problemas.push(`${codigo}: forbidden word in «${t}»`);
      if (/\d/.test(t.replace(/\{\{\w+\}\}/g, ""))) problemas.push(`${codigo}: digits in «${t}»`);
    }
    for (const llave of Object.keys(IDIOMAS[IDIOMA_BASE].palabras)) {
      if (!(llave in L.palabras)) problemas.push(`${codigo}.palabras.${llave}: missing`);
    }
  }
  return problemas;
}

// Textos de la ficha imprimible (inglés).
const AVISO_JUICIO = "This tool supports, never replaces, the judgment of farmers and local experts.";
const VARIANTE_GOTA = {
  actual: "current irrigation",
  con_tope: "drip with consumption cap",
  sin_tope: "drip without consumption cap",
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const formatos = new Map();
function formateador(locale, opciones) {
  const llave = locale + JSON.stringify(opciones);
  if (!formatos.has(llave)) formatos.set(llave, new Intl.NumberFormat(locale, opciones));
  return formatos.get(llave);
}
const MENOS = "−"; // signo menos tipográfico, como en la pantalla
const conMenos = (s) => s.replace("-", MENOS);

/** Número con hasta `decimales` decimales; «—» si no es número. */
function fmtNum(v, decimales, locale) {
  const n = num(v);
  return n == null ? "—" : conMenos(formateador(locale, { maximumFractionDigits: decimales }).format(n));
}
// Igual que la pantalla (app.js): lo calculado con un decimal; lo leído de un archivo, con su precisión.
// En el mensaje, con el locale del idioma elegido (L.locale); en la ficha impresa, en inglés.
const fmtMsg = (v, L) => fmtNum(v, 1, L.locale);
const fmtDatoMsg = (v, L) => fmtNum(v, 3, L.locale);
const fmtUi = (v) => fmtNum(v, 1, LOCALE_UI);
const fmtDatoUi = (v) => fmtNum(v, 3, LOCALE_UI);
function fmtRango(a, b, f) {
  return num(a) === num(b) ? f(a) : `${f(a)}–${f(b)}`;
}
// Hectáreas que alcanzan, con la MISMA regla que la tarjeta y la frase de la ficha (formatoHectareas de
// web/js/resumen.js): los decimales del área tal como llega (de uno a tres), redondeo hacia abajo y nunca más que
// el área; aquí, con el separador decimal del idioma. Los números son reglas de formato, no datos.
const DECIMALES_MINIMOS_HA = 1;
const DECIMALES_MAXIMOS_HA = 3;
const HOLGURA_REDONDEO = 1e-9; // 20.66 × 100 da 2065.9999…: sin holgura, el redondeo hacia abajo perdería un centésimo
function formatoHectareasMsg(areaHa, L) {
  const area = num(areaHa);
  const decimalesArea =
    area == null ? 0 : (formateador("en-US", { maximumFractionDigits: DECIMALES_MAXIMOS_HA, useGrouping: false }).format(area).split(".")[1] ?? "").length;
  const decimales = Math.max(DECIMALES_MINIMOS_HA, decimalesArea);
  const escala = 10 ** decimales;
  return (x) => {
    const v = num(x);
    if (v == null) return "—";
    const abajo = Math.floor(v * escala + HOLGURA_REDONDEO) / escala;
    return fmtNum(area == null ? abajo : Math.min(abajo, area), decimales, L.locale);
  };
}
function fmtPct(fraccion, L) {
  const n = num(fraccion);
  return n == null ? "—" : formateador(L.locale, { style: "percent", maximumFractionDigits: 0 }).format(n);
}
function fmtSignoUi(v) {
  return conMenos(formateador(LOCALE_UI, { maximumFractionDigits: 3, signDisplay: "exceptZero" }).format(v));
}
// Una fecha sin hora («AAAA-MM-DD», como la fecha de consulta de las fuentes) es un día del calendario, no un
// instante: new Date("2026-11-14") la lee como medianoche UTC y en Chihuahua (UTC−6) la hoja diría «Nov 13».
// Por eso se arma con Date.UTC y se formatea en UTC (el mismo día en cualquier zona). Con hora (p. ej.
// cubo.meta.generado) o un Date, es un instante: se dice en la hora local de quien imprime, como antes.
const FORMA_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
export function fmtFechaUi(valor, estilo = "medium") {
  const dia = typeof valor === "string" ? FORMA_DIA.exec(valor.trim()) : null;
  if (dia) {
    const [anio, mes, d] = dia.slice(1).map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, d));
    // Un día que no existe (p. ej. 30 de febrero) no se corre al mes siguiente: se deja tal cual.
    if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== d) return String(valor);
    return new Intl.DateTimeFormat(LOCALE_UI, { dateStyle: estilo, timeZone: "UTC" }).format(fecha);
  }
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor ?? "");
  return new Intl.DateTimeFormat(LOCALE_UI, { dateStyle: estilo }).format(fecha);
}

/** Sustituye {{marcador}} por su valor; un marcador sin valor queda visible (se nota en la revisión). */
function rellenar(texto, valores) {
  return texto.replace(/\{\{(\w+)\}\}/g, (todo, k) => (k in valores ? String(valores[k]) : todo));
}

/** Formato de WhatsApp sobre texto ya escapado: *negrita* y _cursiva_. */
function formatoWhatsApp(htmlEscapado) {
  return htmlEscapado
    .replace(/\*([^*\n]+)\*/g, (_, t) => `<strong>${t}</strong>`)
    .replace(/_([^_\n]+)_/g, (_, t) => `<em>${t}</em>`);
}

/** Enlaza una hoja de estilos si la página aún no la tiene. Devuelve una promesa que se cumple al cargarla. */
function asegurarHoja(href, doc = globalThis.document) {
  if (!doc?.head) return Promise.resolve();
  const ya = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).find((l) => l.href === href);
  if (ya) return ya.sheet ? Promise.resolve() : esperarCarga(ya);
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  const carga = esperarCarga(link);
  doc.head.append(link);
  return carga;
}
function esperarCarga(link) {
  return new Promise((ok) => {
    const listo = () => ok();
    link.addEventListener("load", listo, { once: true });
    link.addEventListener("error", listo, { once: true });
    setTimeout(listo, ESPERA_HOJA_MS);
  });
}

// ---------------------------------------------------------------------------
// Plantilla externa (web/data/whatsapp_plantilla.json)
// ---------------------------------------------------------------------------
const lecturas = new Map(); // url -> Promise de la plantilla validada
let plantillaCargada = null; // última plantilla válida leída

/** Deja solo las llaves conocidas, de texto, sin dígitos fuera de los marcadores, sin palabras prohibidas
 *  y con marcadores permitidos. null si no queda ninguna. */
function validarPlantilla(obj) {
  if (!obj || typeof obj !== "object") return null;
  const buena = {};
  for (const [llave, permitidos] of Object.entries(MARCADORES)) {
    const t = obj[llave];
    if (typeof t !== "string" || !t.trim()) continue;
    const sinMarcadores = t.replace(/\{\{\w+\}\}/g, "");
    const usados = [...t.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    const motivo = /\d/.test(sinMarcadores)
      ? "digits outside the {{…}} markers"
      : PROHIBIDAS.test(t)
        ? "a forbidden word"
        : usados.some((u) => !permitidos.includes(u))
          ? "an unknown marker"
          : sinMarcadores.includes("{{") || sinMarcadores.includes("}}")
            ? "a broken marker"
            : "";
    if (motivo) {
      console.warn(`whatsapp_plantilla.json: «${llave}» ignored (${motivo}); the built-in text is used.`);
      continue;
    }
    buena[llave] = t;
  }
  return Object.keys(buena).length ? buena : null;
}

export function cargarPlantillaWhatsApp(url = RUTA_PLANTILLA) {
  if (!lecturas.has(url)) {
    const lectura = fetch(url)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((obj) => {
        const p = validarPlantilla(obj);
        if (p) plantillaCargada = p;
        return p;
      })
      .catch(() => null);
    lecturas.set(url, lectura);
  }
  return lecturas.get(url);
}

// ---------------------------------------------------------------------------
// Idioma del mensaje: el que se pida (ctx.idioma), el último elegido en el selector, el guardado en el
// navegador o el del teléfono (navigator.languages); si ninguno tiene plantilla, español.
// ---------------------------------------------------------------------------
let idiomaElegido = null; // último idioma elegido en el selector (por si el navegador no deja guardarlo)

const esIdioma = (c) => typeof c === "string" && Object.hasOwn(IDIOMAS, c);

function idiomaGuardado() {
  try {
    const c = globalThis.localStorage?.getItem(LLAVE_IDIOMA);
    return esIdioma(c) ? c : null;
  } catch {
    return null; // sin almacenamiento (modo privado, bloqueado): la página funciona igual
  }
}
function guardarIdioma(codigo) {
  try {
    globalThis.localStorage?.setItem(LLAVE_IDIOMA, codigo);
  } catch {
    // sin almacenamiento: el idioma se recuerda solo mientras la página esté abierta (idiomaElegido)
  }
}
function idiomaDelNavegador() {
  const nav = globalThis.navigator;
  const pedidos = [...(Array.isArray(nav?.languages) ? nav.languages : []), nav?.language].filter(Boolean);
  for (const etiqueta of pedidos) {
    const codigo = String(etiqueta).toLowerCase().split("-")[0];
    if (esIdioma(codigo)) return codigo;
  }
  return IDIOMA_BASE;
}
/** Idioma con que abre el mensaje si no se pide uno: el elegido, el guardado o el del navegador. */
export function idiomaInicialWhatsApp() {
  return idiomaElegido ?? idiomaGuardado() ?? idiomaDelNavegador();
}
function idiomaDe(ctx) {
  const pedido = String(ctx?.idioma ?? "").toLowerCase();
  return esIdioma(pedido) ? pedido : idiomaInicialWhatsApp();
}

/** Plantilla del idioma. La externa (whatsapp_plantilla.json) está en español: solo cambia el mensaje en español. */
function plantillaDe(ctx, codigo) {
  if (codigo !== IDIOMA_BASE) return IDIOMAS[codigo].plantilla;
  const externa = ctx?.plantilla ? validarPlantilla(ctx.plantilla) : plantillaCargada;
  return { ...PLANTILLA_INTERNA, ...(externa ?? {}) };
}

// ---------------------------------------------------------------------------
// Mensaje de WhatsApp: se arma una vez y se escribe como HTML o como texto
// ---------------------------------------------------------------------------
function propiedades(parcela) {
  return parcela?.properties ?? parcela ?? {};
}

function nombreCultivo(c, L) {
  return (Object.hasOwn(L.palabras.cultivos, c ?? "") && L.palabras.cultivos[c]) || String(c ?? "").replace(/_/g, " ");
}

/**
 * Nombre de la opción en el idioma: el del cubo si lo trae (nombre_es, nombre_pt…; en inglés, el nombre de la
 * interfaz), el de L.palabras.opciones o, si no, se arma con su secuencia de cultivos.
 */
function nombreOpcion(o, p, L, codigo) {
  const delCubo = codigo === "en" ? o.nombre_en ?? o.nombre : o[`nombre_${codigo}`];
  if (typeof delCubo === "string" && delCubo.trim()) return delCubo;
  const secuencia = Array.isArray(o.secuencia) && o.secuencia.length ? o.secuencia : [];
  // «Avena y maíz forrajero»: mayúscula solo al inicio.
  const cultivos = (secuencia.length ? secuencia : [p.cultivo_actual])
    .filter(Boolean)
    .map((c, i) => (i === 0 ? nombreCultivo(c, L) : nombreCultivo(c, L).toLocaleLowerCase(L.locale)));
  const lista = cultivos.length ? new Intl.ListFormat(L.locale, { type: "conjunction" }).format(cultivos) : "";
  const { rotacion_actual: actual, dos_puntos: dosPuntos, opciones, cultivos: nombres } = L.palabras;
  if (o.id === "ACTUAL") return lista ? `${actual}${dosPuntos}${lista}` : actual;
  if (Object.hasOwn(opciones, o.id ?? "")) return opciones[o.id];
  return Object.hasOwn(nombres, o.id ?? "") ? nombres[o.id] : lista || o.nombre || String(o.id);
}

function textoPlazo(plazo, L) {
  const min = num(plazo?.min);
  const max = num(plazo?.max);
  if (min == null && max == null) return L.palabras.plazo_sin_dato;
  const unidad = (max ?? min) === 1 ? L.palabras.anio : L.palabras.anios;
  return `${fmtRango(min ?? max, max ?? min, (v) => fmtDatoMsg(v, L))} ${unidad}`;
}

function textoLluvia(r, L) {
  const v = num(r);
  if (!v) return L.palabras.lluvia_igual;
  return rellenar(v < 0 ? L.palabras.lluvia_menos : L.palabras.lluvia_mas, { pct: fmtPct(Math.abs(v) / 100, L) });
}

function siNo(v, L) {
  if (v === true) return L.palabras.si;
  if (v === false) return L.palabras.no;
  return L.palabras.sin_dato;
}

/** Una opción: título, línea de agua (con las reglas de reglas.js) y línea de suelo. */
function armarOpcion(o, i, p, ctx, t, L, codigo) {
  const area = fmtDatoMsg(p.area_ha, L);
  const D = num(ctx.D);
  let ev = null;
  try {
    ev = ctx.reglas.evaluarOpcion(o, num(p.area_ha) ?? 0, D ?? 0, num(ctx.r) ?? 0, Boolean(p.abstencion));
  } catch {
    ev = null; // la opción no trae lámina para esa lluvia
  }
  const estado = L.palabras.estado[ev?.semaforo] ?? L.palabras.estado.gris;
  const plazo = textoPlazo(o.agua?.plazo_anios, L);
  let agua;
  if (!ev || num(ev.lamina?.p50) == null) {
    agua = rellenar(t.agua_sin_dato, { estado });
  } else if (!(ev.lamina.p50 > 0)) {
    agua = rellenar(t.agua_sin_riego, { estado, plazo });
  } else {
    const h = ev.hectareas;
    const fh = formatoHectareasMsg(p.area_ha, L);
    const bajo = fh(h.bajo);
    const alto = fh(h.alto);
    const rango = bajo === alto ? "" : rellenar(L.palabras.rango_ha, { bajo, alto });
    agua = rellenar(t.agua, {
      estado,
      lamina: fmtDatoMsg(ev.lamina.p50, L),
      plazo,
      d: fmtMsg(D, L),
      ha: fh(h.p50),
      area,
      rango_ha: rango,
    });
  }
  const su = o.suelo ?? {};
  const comunes = { leguminosa: siNo(su.leguminosa, L), plagas: siNo(su.ruptura_plagas, L) };
  const suelo =
    num(su.dias_desnudo) == null
      ? rellenar(t.suelo_sin_dias, comunes)
      : rellenar(t.suelo, {
          ...comunes,
          dias: fmtDatoMsg(su.dias_desnudo, L),
          origen: L.palabras.origen[su.dias_desnudo_origen] ?? L.palabras.sin_origen,
        });
  return {
    id: o.id,
    semaforo: ev?.semaforo ?? "gris",
    titulo: rellenar(t.opcion, { n: fmtNum(i + 1, 0, L.locale), nombre: nombreOpcion(o, p, L, codigo) }),
    agua,
    suelo,
  };
}

/** Partes del mensaje: { idioma, saludo, opciones[], respuesta, avisos[] }. */
function armarMensaje(parcela, opciones, ctx = {}) {
  if (typeof ctx?.reglas?.evaluarOpcion !== "function") {
    throw new Error("mensaje.js: ctx.reglas must be web/reglas.js (evaluarOpcion is missing)");
  }
  const codigo = idiomaDe(ctx);
  const L = IDIOMAS[codigo];
  const p = propiedades(parcela);
  const t = plantillaDe(ctx, codigo);
  const ops = Array.isArray(opciones) ? opciones : [];
  // Avisos fijos (kit C4 y CLAUDE.md, regla 10): no se toman de la plantilla externa.
  const avisos = [L.palabras.aviso_simulacion, L.palabras.aviso_juicio];
  const datosParcela = { parcela: p.id ?? "", area: fmtDatoMsg(p.area_ha, L) };
  const base = { idioma: codigo, opciones: [], respuesta: "", avisos };
  if (!ops.length) {
    // Abstenida: el mapa no sabe qué hay. Clasificada sin opciones (zona sin clima, rotación actual sin
    // armar): el cultivo sí se conoce y el mensaje dice lo que falta (ctx.sinOpciones = código del cubo).
    if (p.abstencion) return { ...base, saludo: rellenar(t.sin_opciones, datosParcela) };
    const motivo = (Object.hasOwn(L.palabras.motivos, ctx.sinOpciones ?? "") && L.palabras.motivos[ctx.sinOpciones]) || L.palabras.motivo_otro;
    return { ...base, saludo: rellenar(t.sin_calculo, { ...datosParcela, motivo }) };
  }
  const saludo = rellenar(t.saludo, { ...datosParcela, d: fmtMsg(ctx.D, L), lluvia: textoLluvia(ctx.r, L) });
  const partes = ops.map((o, i) => armarOpcion(o, i, p, ctx, t, L, codigo));
  const numeros = new Intl.ListFormat(L.locale, { type: "disjunction" }).format(ops.map((_, i) => fmtNum(i + 1, 0, L.locale)));
  return { ...base, saludo, opciones: partes, respuesta: rellenar(t.respuesta, { numeros }) };
}

export function textoWhatsApp(parcela, opciones, ctx = {}) {
  const m = armarMensaje(parcela, opciones, ctx);
  const bloques = [m.saludo];
  for (const o of m.opciones) bloques.push([`*${o.titulo}*`, o.agua, o.suelo].join("\n"));
  if (m.respuesta) bloques.push(`*${m.respuesta}*`);
  bloques.push(m.avisos.map((a) => `_${a}_`).join("\n"));
  return bloques.join("\n\n");
}

// Último mensaje dibujado: el selector de idioma lo vuelve a dibujar en su lugar con el idioma elegido.
let ultimoMensaje = null; // { n, parcela, opciones, ctx }
let mensajesDibujados = 0;

/** Selector de idioma de la vista (en inglés, como la interfaz) y, si la plantilla no la revisó una persona, la nota. */
function htmlSelectorIdioma(n, codigo) {
  const id = `wa-idioma-${n}`;
  const opciones = Object.entries(IDIOMAS)
    .map(([c, L]) => `<option value="${esc(c)}" lang="${esc(c)}"${c === codigo ? " selected" : ""}>${esc(L.nombre)}</option>`)
    .join("");
  const nota = IDIOMAS[codigo].revisado ? "" : `<p class="wa-traduccion">${esc(NOTA_TRADUCCION)}</p>`;
  return (
    '<div class="wa-idioma">' +
    `<label for="${id}">Message language</label>` +
    `<select id="${id}" class="wa-idioma-select">${opciones}</select>` +
    nota +
    "</div>"
  );
}

export function htmlWhatsApp(parcela, opciones, ctx = {}) {
  asegurarHoja(HOJA_MENSAJE);
  const m = armarMensaje(parcela, opciones, ctx);
  const n = ++mensajesDibujados;
  ultimoMensaje = { n, parcela, opciones, ctx };
  const linea = (clase, texto) => `<p class="${clase}">${formatoWhatsApp(esc(texto))}</p>`;
  const lista = m.opciones.length
    ? '<ol class="wa-opciones">' +
      m.opciones
        .map(
          (o) =>
            `<li class="wa-opcion" data-opcion="${esc(o.id)}" data-semaforo="${esc(o.semaforo)}">` +
            `<p class="wa-titulo"><strong>${formatoWhatsApp(esc(o.titulo))}</strong></p>` +
            linea("wa-agua", o.agua) +
            linea("wa-suelo", o.suelo) +
            "</li>",
        )
        .join("") +
      "</ol>"
    : "";
  const L = IDIOMAS[m.idioma];
  return (
    `<figure class="wa-maqueta" data-wa="${n}" data-idioma="${esc(m.idioma)}">` +
    '<figcaption class="wa-rotulo">WhatsApp message preview — a mock-up: nothing is sent. ' +
    `The farmer reads it in ${esc(L.nombre_en)}.</figcaption>` +
    htmlSelectorIdioma(n, m.idioma) +
    `<div class="wa-telefono" lang="${esc(m.idioma)}">` +
    '<div class="wa-barra" aria-hidden="true"><span class="wa-avatar">R</span>' +
    `<span class="wa-contacto"><strong>ROOT</strong><small>${esc(L.palabras.vista_previa)}</small></span></div>` +
    '<div class="wa-chat"><div class="wa-burbuja">' +
    linea("wa-saludo", m.saludo) +
    lista +
    (m.respuesta ? `<p class="wa-respuesta"><strong>${formatoWhatsApp(esc(m.respuesta))}</strong></p>` : "") +
    m.avisos.map((a) => `<p class="wa-aviso"><em>${esc(a)}</em></p>`).join("") +
    "</div></div></div></figure>"
  );
}

/**
 * Cambio de idioma en el selector: se recuerda (en el navegador, si deja) y el mensaje se vuelve a dibujar en su
 * lugar, con el mismo contexto (dotación, lluvia) y el foco de vuelta en el selector. app.js no interviene: al
 * redibujar por el deslizador, htmlWhatsApp abre con el idioma elegido (idiomaInicialWhatsApp).
 */
function alCambiarIdioma(ev) {
  const sel = ev.target;
  if (!sel?.matches?.("select.wa-idioma-select")) return;
  const codigo = sel.value;
  if (!esIdioma(codigo)) return;
  idiomaElegido = codigo;
  guardarIdioma(codigo);
  const figura = sel.closest(".wa-maqueta");
  if (!figura || !ultimoMensaje || figura.dataset.wa !== String(ultimoMensaje.n)) return;
  const { parcela, opciones, ctx } = ultimoMensaje;
  let html;
  try {
    html = htmlWhatsApp(parcela, opciones, { ...ctx, idioma: codigo });
  } catch (err) {
    console.warn("ROOT: WhatsApp preview could not change language", err);
    return;
  }
  const molde = figura.ownerDocument.createElement("template");
  molde.innerHTML = html;
  const nueva = molde.content.firstElementChild;
  figura.replaceWith(nueva);
  nueva.querySelector("select.wa-idioma-select")?.focus();
}
globalThis.document?.addEventListener?.("change", alCambiarIdioma);

// ---------------------------------------------------------------------------
// Ficha imprimible
// ---------------------------------------------------------------------------
const CLASE_AGREGADO = "solo-impresion"; // visible solo en papel (css/imprimir.css)
const MARCA_AGREGADO = "data-impresion"; // marca de lo que agrega este módulo (para quitarlo después)
const CLASE_RAIZ = "imprimir-ficha"; // en <html> mientras se imprime con el botón

function quitarAgregados(doc) {
  for (const n of doc.querySelectorAll(`[${MARCA_AGREGADO}]`)) n.remove();
  doc.documentElement.classList.remove(CLASE_RAIZ);
}

/** Dotación y lluvia elegidas: de ctx o, si faltan, de los controles de la pantalla. */
function elegidos(ctx, doc) {
  const cubo = ctx.cubo;
  const D = num(ctx.D) ?? num(doc.getElementById("dotacion")?.value);
  const r = num(ctx.r);
  if (r != null) return { D, textoLluvia: r === 0 ? "no change" : `${fmtSignoUi(r)}%` };
  // Sin ctx.r: el interruptor de la pantalla. Encendido = la variante seca, con el rótulo que muestra la
  // pantalla (lo escribe app.js con cubo.lluvia_pct); apagado = sin cambio.
  const sw = doc.getElementById("lluvia");
  if (!sw) return { D, textoLluvia: "not available" };
  if (!sw.checked) return { D, textoLluvia: "no change" };
  const lluvias = (cubo?.lluvia_pct ?? []).map(Number);
  const seca = lluvias.find((v) => v !== (lluvias.includes(0) ? 0 : lluvias[0]));
  if (seca !== undefined) return { D, textoLluvia: `${fmtSignoUi(seca)}%` };
  return { D, textoLluvia: doc.getElementById("lluvia-etiqueta")?.textContent?.trim() || "not available" };
}

// Partes de las etiquetas de los datos que vienen en español y su lectura en la hoja (la misma tabla que app.js).
const ETIQUETAS_UI = [["por confirmar", "to be confirmed"]];
function etiquetaUi(etiqueta) {
  let texto = String(etiqueta ?? "");
  for (const [es, en] of ETIQUETAS_UI) texto = texto.split(es).join(en);
  return texto;
}

function filaDato(titulo, valor) {
  return `<div><dt>${esc(titulo)}</dt><dd>${valor}</dd></div>`;
}

function htmlDatosImpresion(ctx, doc) {
  const cubo = ctx.cubo ?? {};
  const { D, textoLluvia } = elegidos(ctx, doc);
  const dot = cubo.dotaciones ?? {};
  const marca = D == null ? null : (dot.marcas ?? []).find((m) => num(m.valor) === D);
  let dotacion = D == null ? "not available" : `${esc(fmtUi(D))} thousand m³/ha`;
  if (marca) {
    // La fuente en inglés (fuente_en, la que trae el cubo para la interfaz; si falta, la de español), en su forma
    // corta (el detalle queda en manifest.json y en pantalla); la etiqueta, con su parte en español leída en inglés,
    // como en la pantalla (app.js, etiquetaEn). La hoja impresa va en inglés, como la interfaz.
    const detalle = [
      `range ${fmtRango(marca.min, marca.max, fmtDatoUi)}`,
      marca.fuente_en || marca.fuente ? `source: ${fuenteCorta(marca.fuente_en || marca.fuente)}` : "",
      etiquetaUi(marca.etiqueta),
    ].filter(Boolean);
    dotacion += ` · <strong>${esc(marca.nombre)}</strong> <span class="impresion-detalle">(${esc(detalle.join("; "))})</span>`;
  }
  const p = propiedades(ctx.parcela);
  const zona = p.zona && cubo.zonas?.[p.zona] ? cubo.zonas[p.zona].nombre_mostrar ?? cubo.zonas[p.zona].nombre : null;
  const filas = [
    filaDato("Water allocation", dotacion),
    filaDato("Rain", esc(textoLluvia)),
    // Punto de medición en inglés (punto_medicion_en); si el cubo solo lo trae en español, marcado lang="es".
    dot.punto_medicion_en
      ? filaDato("Measured at", esc(dot.punto_medicion_en))
      : dot.punto_medicion
        ? filaDato("Measured at", `<span lang="es">${esc(dot.punto_medicion)}</span>`)
        : "",
    zona ? filaDato("Pilot area", esc(zona)) : "",
    filaDato("Printed", esc(fmtFechaUi(ctx.fecha ?? new Date(), "long"))),
    cubo.meta?.generado ? filaDato("Data generated", esc(fmtFechaUi(cubo.meta.generado))) : "",
  ];
  return `<h3 class="impresion-titulo">Values used on this sheet</h3><dl class="impresion-lista">${filas.join("")}</dl>`;
}

/** Forma corta de una fuente para el papel: hasta el primer «;» o « (» (el detalle completo está en
 *  manifest.json y en la sección About & Data). */
function fuenteCorta(texto) {
  const t = String(texto).trim();
  const corte = [t.indexOf(";"), t.indexOf(" (")].filter((i) => i > 0);
  return corte.length ? t.slice(0, Math.min(...corte)).trim() : t;
}

/** Lista de fuentes: manifest.json (fuentes_de_origen) o, sin él, los archivos de cubo.meta.fuentes. */
function htmlFuentes(ctx) {
  const deManifiesto = (ctx.manifiesto?.fuentes_de_origen ?? []).filter((f) => f?.fuente);
  let items = [];
  let pie = "";
  if (deManifiesto.length) {
    // Fuentes sin repetir; la fecha de consulta, una sola vez si todas coinciden.
    const fechas = new Set(deManifiesto.map((f) => f.fecha_consulta ?? f.fecha).filter(Boolean));
    const unaFecha = fechas.size === 1;
    const vistos = new Set();
    for (const f of deManifiesto) {
      const corta = fuenteCorta(f.fuente);
      if (vistos.has(corta)) continue;
      vistos.add(corta);
      const fecha = f.fecha_consulta ?? f.fecha;
      items.push(esc(corta) + (!unaFecha && fecha ? ` <span class="impresion-detalle">(${esc(fmtFechaUi(fecha))})</span>` : ""));
    }
    if (unaFecha) pie = `<p class="impresion-detalle">Accessed ${esc(fmtFechaUi([...fechas][0]))}. Full source list in manifest.json.</p>`;
  } else {
    const archivos = (ctx.cubo?.meta?.fuentes ?? [])
      .map((f) => String(f).split("/").pop())
      .filter((f) => f && !f.startsWith("."));
    if (archivos.length) items = [`Data files: ${esc(archivos.join(", "))}`];
    // ctx.errorManifiesto: manifest.json existe pero no se pudo leer; se dice en la hoja (no en silencio).
    if (ctx.errorManifiesto) {
      pie = `<p class="impresion-detalle">The source list in manifest.json could not be read (${esc(ctx.errorManifiesto)}); the data files of the cube are listed instead.</p>`;
    }
  }
  const lista = items.length
    ? `<ul class="impresion-fuentes-lista">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`
    : "<p>Not available.</p>";
  return `<h3 class="impresion-titulo">Sources</h3>${lista}${pie}`;
}

/** Leyenda de La gota estática: qué opción y qué variante quedaron en pantalla. */
function htmlLeyendaGota(gota) {
  const sel = gota.querySelector("#gota-opcion");
  const opcion = sel?.selectedOptions?.[0]?.textContent?.trim();
  const goteo = gota.querySelector("#gota-goteo");
  const conGoteo = goteo && !goteo.hidden && goteo.getAttribute("aria-pressed") === "true";
  const tope = gota.querySelector("#gota-tope");
  const variante = !conGoteo ? VARIANTE_GOTA.actual : tope?.checked === false ? VARIANTE_GOTA.sin_tope : VARIANTE_GOTA.con_tope;
  return `Static view${opcion ? ` of <strong>${esc(opcion)}</strong>` : ""}, ${esc(variante)}.`;
}

export async function imprimirFicha(ctx = {}) {
  const doc = globalThis.document;
  const ficha = ctx.ficha ?? doc?.getElementById("ficha");
  if (!ficha || ficha.hidden) return false;
  await asegurarHoja(HOJA_IMPRIMIR, doc);
  quitarAgregados(doc); // por si quedó algo de una impresión anterior

  const cuerpo = ficha.querySelector("#ficha-cuerpo") ?? ficha;
  const nuevo = (etiqueta, clase, html) => {
    const n = doc.createElement(etiqueta);
    n.className = `${CLASE_AGREGADO} ${clase}`;
    n.setAttribute(MARCA_AGREGADO, "");
    n.innerHTML = html;
    return n;
  };

  // Dotación, lluvia, fecha y zona: debajo del encabezado de la ficha.
  const datos = nuevo("section", "impresion-datos", htmlDatosImpresion(ctx, doc));
  const encabezado = cuerpo.querySelector(".ficha-encabezado");
  if (encabezado) encabezado.after(datos);
  else cuerpo.prepend(datos);

  // La gota: sin controles en papel; una línea dice qué se ve.
  const gota = cuerpo.querySelector("#seccion-gota, .gota");
  if (gota) {
    const leyenda = nuevo("p", "impresion-gota", htmlLeyendaGota(gota));
    // Debajo del título de la sección (el que nombra aria-labelledby); si no hay, al inicio.
    const idTitulo = gota.getAttribute("aria-labelledby");
    const titulo = idTitulo ? doc.getElementById(idTitulo) : null;
    if (titulo && gota.contains(titulo)) titulo.after(leyenda);
    else gota.prepend(leyenda);
  }

  // Fuentes y aviso de juicio local al final (el aviso ya va en la ficha; si faltara, se agrega).
  const avisoFalta = !cuerpo.querySelector(".aviso-juicio");
  cuerpo.append(
    nuevo(
      "section",
      "impresion-fuentes",
      htmlFuentes(ctx) + (avisoFalta ? `<p class="aviso-juicio">${esc(AVISO_JUICIO)}</p>` : ""),
    ),
  );

  doc.documentElement.classList.add(CLASE_RAIZ);
  // Se limpia al terminar la impresión (en algunos navegadores print() no espera al diálogo).
  globalThis.addEventListener?.("afterprint", () => quitarAgregados(doc), { once: true });
  (ctx.imprimir ?? (() => globalThis.print()))();
  return true;
}
