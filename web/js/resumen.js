// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/resumen.js — Ficha del gemelo digital: frase resumen descriptiva, gráfica del NDVI mensual de la
// parcela y enlace directo a una parcela con «#id» (docs/decisiones/2026-11-14_gemelo_digital.md, «Qué
// cambia en el producto», punto 5). Son ideas del prototipo de Lara (prototipos/front_lara/), portadas
// según su revisión (docs/revisiones/2026-11-14_1445_front_lara.md): se trae la idea, NO la «mejor
// opción», NI pesos, NI escenarios por nivel de presa.
// Módulo ES independiente, sin dependencias. Estilos: web/css/resumen.css (dibujarNDVI la inserta si la
// página aún no la enlaza).
//
// QUÉ EXPORTA (lo conecta app.js; este archivo no toca el mapa, los controles ni el resto de la ficha):
//
//   fraseResumen({ parcela, opcionActual, evaluacion, D, formato }) -> string
//       Texto descriptivo en inglés para poner arriba de la ficha (p. ej. en <p class="resumen-frase">,
//       con textContent). Nunca recomienda, nunca compara ingresos y no dice «best».
//         parcela       properties de la parcela (parcelas.geojson): area_ha, abstencion, cultivo_actual
//         opcionActual  la opción con id «ACTUAL» de cubo.parcelas[id].opciones (o null si no hay)
//         evaluacion    lo que devuelve evaluarOpcion(opcionActual, area_ha, D, r, abstencion) de
//                       web/reglas.js: { lamina, cobertura, hectareas: { p50 }, semaforo }
//         D             dotación elegida, en millares/ha (miles de m³ por hectárea)
//         formato       opcional: función (valor, clave) -> texto, con clave «d» (dotación), «ha»
//                       (hectáreas que alcanzan), «area» (superficie de la parcela) o «anios» (años del
//                       plazo). Por omisión, un decimal para «d», «ha» y «anios» y hasta tres para «area».
//       Variantes (casoResumen dice cuál toca):
//         parcial      «With {D} thousand m³/ha, the current rotation ({cultivo}) has enough water for
//                      {X} of {N} hectares. {plazo}»
//         completa     «… has enough water for all {N} hectares. {plazo}» Si el semáforo es ámbar (cubre
//                      la mediana, no la estimación alta) lo dice: «… at the median estimate of its need,
//                      not at the high estimate.»
//         {plazo}      el compromiso de la opción ACTUAL (agua.plazo_anios, agua.plazo_restante y
//                      agua.nota_plazo): «Alfalfa ties up water for 3–4 years (0–1 years left).»; con
//                      nota (huerta) «… for {N} years ({nota}).»; anual (plazo de un año) «… for one
//                      season.»; sin plazo en los datos, lo dice. Las cifras salen del cubo.
//         sin_riego    lámina cero: «The current rotation ({cultivo}) needs no irrigation, …»
//         abstenida    «Not classified — check with a technician. …»
//         sin_calculo  parcela clasificada sin opción ACTUAL, o sin dotación: lo dice, sin números.
//       {cultivo} sale de opcionActual.nombre (sin el prefijo «Current rotation:»); si falta, de su
//       secuencia o de parcela.cultivo_actual.
//   casoResumen({ parcela, opcionActual, evaluacion, D }) -> "parcial" | "completa" | "sin_riego" |
//       "abstenida" | "sin_calculo"    (para un data-atributo o para las pruebas)
//
//   dibujarNDVI(contenedor, { serie, meses, umbrales, fuente, nivel }) -> controlador | null
//       Gráfica SVG del NDVI mensual de UNA parcela. Reemplaza el contenido del contenedor.
//         serie     lista de web/data/ndvi_mensual.json para la parcela (parcelas[id]): valores o null,
//                   alineada a «meses». Si no es una lista (la parcela no está en el archivo), se dice
//                   «not available for this field» y no se dibuja nada.
//         meses     ndvi_mensual.json → meses (["2025-10", …])
//         umbrales  líneas de referencia; la app los lee de los datos (hoy viven en data/params.json:
//                   memoria.ndvi_verde y suelo.ndvi_desnudo). { verde, desnudo }, cada uno un número o un
//                   objeto con «valor» (el bloque de params tal cual). El que falte no se dibuja. También
//                   se aceptan las llaves ndvi_verde, suelo_desnudo y ndvi_desnudo.
//         fuente    opcional: texto de la fuente (ndvi_mensual.json → fuente); va bajo la gráfica.
//         nivel     opcional: nivel del encabezado (por omisión, el de las secciones de la ficha).
//       controlador: { elemento, fijarDatos({ serie, meses, umbrales, fuente }), elegir(i | null),
//                      destruir() }. fijarDatos cambia solo lo que reciba; elegir marca un mes (null
//                      vuelve al último mes con dato). null si no hay contenedor.
//       Qué dibuja (todo con el prefijo «resumen-ndvi»):
//         · título fijo «Greenness (NDVI) by month — NASA HLS»;
//         · una línea con un punto por mes con dato; donde hay null la línea SE CORTA y el mes lleva una
//           banda rayada («No data»): un hueco nunca se dibuja como cero ni se une con una recta;
//         · líneas de referencia punteadas en los umbrales, cada una con su rótulo y su trazo distinto;
//         · eje de meses con iniciales y el año donde cambia; eje vertical con la escala del índice;
//         · renglón de lectura: el último mes con dato («Latest month with data») o, al pasar el puntero,
//           tocar o usar las flechas (← → Inicio Fin; Escape vuelve), el mes elegido («Selected month»).
//           Un clic o un toque fija el mes mientras la gráfica tiene el foco;
//         · tabla con los mismos valores, oculta a la vista, para lectores de pantalla.
//       El ancho sigue al contenedor (ResizeObserver): en el teléfono no hay desplazamiento horizontal.
//       Si se dibuja con la ficha oculta (ancho cero) usa un ancho provisional y toma el real al mostrarse.
//       Ganchos para las pruebas con navegador: la raíz (<section class="resumen-ndvi">) lleva data-estado
//       ("con_datos" | "sin_datos" | "no_disponible"); cada punto (circle.resumen-ndvi-punto) y cada banda
//       de hueco (rect.resumen-ndvi-hueco) dentro de svg.resumen-ndvi-svg, data-mes; cada línea de umbral,
//       data-umbral ("verde" | "desnudo"); la lectura (.resumen-ndvi-lectura), data-mes del mes que muestra.
//   modeloNDVI({ serie, meses, umbrales }) -> { disponible, conDatos, puntos, tramos, huecos, umbrales,
//       ultimo, maximo, minimo, dominio }    (función pura: la misma que usa la gráfica; para pruebas)
//
//   idDeHash(hash, idsValidos) -> id | null
//       Id de parcela de un enlace directo. Acepta «#P0757», «#p0757», «P0757» y el id codificado en la
//       URL; devuelve el id TAL COMO está en idsValidos (Array, Set, Map —sus llaves— u objeto —sus
//       llaves—). null si el hash está vacío o no es un id conocido: la app decide si avisa (un hash
//       como «#principal», el ancla de «Skip to the map», también da null y no es un error).
//   hashDe(id) -> string
//       «#P0757» para escribirlo en la barra de direcciones (history.replaceState); "" si no hay id.
//
// DECISIONES DE ESTE ARCHIVO (para quien lo integre o lo revise):
//   1. Ninguna cifra escrita a mano: la dotación, las hectáreas, los valores del NDVI, los umbrales, los
//      meses y los años llegan por parámetro. Los números del código son medidas de diseño de la gráfica
//      (pixeles) y la escala del índice (el NDVI va de −1 a 1; la gráfica muestra de 0 a 1 y se extiende
//      hacia abajo si llega un valor negativo): es la definición del índice, no un dato.
//   2. La escala vertical es la misma para todas las parcelas (no se ajusta a cada serie): así una
//      parcela desnuda no se ve tan «viva» como una de alfalfa.
//   3. Los umbrales se dibujan como referencia; la gráfica NO clasifica los meses (la regla de suelo
//      desnudo es diaria, no de la mediana mensual).
//   4. Sin colores en el JS: viven en css/resumen.css. Nada depende solo del color: la serie lleva
//      puntos, los umbrales rótulo y trazo distinto, los huecos trama y texto.
//   5. Todo texto que viene de los datos se escapa antes de insertarse (el prototipo tenía un XSS).
//   6. Interfaz en inglés; comentarios en español. La frase describe; no reparte agua, no pronostica la
//      presa, no promete ahorros.

const LOCALE = "en-US";
const HOJA = "../css/resumen.css"; // relativa a este módulo
const NIVEL_POR_OMISION = 3;

// ---------------------------------------------------------------------------
// Textos de la interfaz (sin números)
// ---------------------------------------------------------------------------
const TITULO_NDVI = "Greenness (NDVI) by month — NASA HLS";
const TEXTO_SIN_DATO = "no data";
const TEXTO_NO_DISPONIBLE = "Monthly NDVI: not available for this field.";
const TEXTO_SIN_SERIE = "Monthly NDVI: no data for this field in these months.";
const TEXTO_ULTIMO = "Latest month with data";
const TEXTO_ELEGIDO = "Selected month";
const TEXTO_AYUDA =
  "Monthly median inside the field. Point at the chart, tap it, or focus it and use the arrow keys to read a month.";
const TEXTO_GRUPO = "NDVI chart. Left and right arrow keys read each month; Home and End jump to the ends.";
const CLAVE_HUECO = "No data for the month";
const PREFIJO_FUENTE = "Source: ";
const UMBRALES = [
  {
    clave: "verde",
    llaves: ["verde", "ndvi_verde"],
    rotulo: (v) => `green ≥ ${v}`,
    texto: (v) => `Green month: NDVI at or above ${v}`,
  },
  {
    clave: "desnudo",
    llaves: ["desnudo", "suelo_desnudo", "ndvi_desnudo"],
    rotulo: (v) => `bare < ${v}`,
    texto: (v) => `Bare soil: NDVI below ${v}`,
  },
];

// ---------------------------------------------------------------------------
// Medidas de diseño de la gráfica (pixeles; no son datos)
// ---------------------------------------------------------------------------
const ALTO = 196;
const ANCHO_POR_OMISION = 340; // si el contenedor aún no tiene ancho (ficha oculta)
const ANCHO_MINIMO = 240;
const ANCHO_MAXIMO = 760; // doce meses no se leen mejor más anchos
const MARGEN = { arriba: 14, abajo: 44, izq: 30 };
const DERECHA_SIN_ROTULOS = 14;
const ANCHO_CARACTER = 6.6; // ancho estimado de un carácter de los rótulos de umbral
const HOLGURA_ROTULO = 8;
const SEPARACION_ROTULOS = 15; // distancia mínima entre dos rótulos de umbral
const RADIO = 4;
const RADIO_ELEGIDO = 6;
const PASO_TRAMA = 6;
const GIRO_TRAMA = 45;
const BAJO_EJE_INICIAL = 17; // de la base de la gráfica a la inicial del mes
const BAJO_EJE_ANIO = 34; // …y al año
const ANCHO_ANIO = 34; // sitio que ocupa un año rotulado
const HOLGURA_ANIO = 3; // del corte de año a su rótulo
const PASO_MINIMO_INICIAL = 13; // si los meses quedan más juntos, se rotula uno de cada tantos
const ANCHO_CLAVE = 30;
const ALTO_CLAVE = 12;

// Escala del índice (definición del NDVI, no un dato): la gráfica muestra de 0 a 1.
const NDVI_MINIMO = -1;
const NDVI_BASE = 0;
const NDVI_TOPE = 1;
const PASO_ESCALA = 10; // un valor negativo extiende la base a la décima inferior

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const MENOS = "−"; // signo menos tipográfico
const conMenos = (s) => s.replace("-", MENOS);

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const esNumero = (v) => typeof v === "number" && Number.isFinite(v);

const formatos = new Map();
function numero(v, opciones) {
  const llave = JSON.stringify(opciones);
  if (!formatos.has(llave)) formatos.set(llave, new Intl.NumberFormat(LOCALE, opciones));
  return conMenos(formatos.get(llave).format(v));
}
/** Valor del NDVI con la precisión del archivo (tres decimales como máximo). */
const fmtNdvi = (v) => numero(v, { minimumFractionDigits: 2, maximumFractionDigits: 3 });
/** Umbral o marca de la escala: sin ceros de relleno. */
const fmtEscala = (v) => numero(v, { maximumFractionDigits: 3 });

/** Coordenada para el SVG: un decimal basta y el marcado queda corto. */
const c = (v) => Number(v.toFixed(1));

let consecutivo = 0;
function idNuevo() {
  consecutivo += 1;
  return `resumen-ndvi-${consecutivo}`;
}

/** Inserta css/resumen.css (relativa a este módulo) si la página aún no la enlaza. */
function asegurarHoja() {
  if (typeof document === "undefined") return;
  const yaEsta = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) =>
    (l.getAttribute("href") || "").endsWith("resumen.css"),
  );
  if (yaEsta) return;
  const enlace = document.createElement("link");
  enlace.rel = "stylesheet";
  enlace.href = new URL(HOJA, import.meta.url).href;
  document.head.appendChild(enlace);
}

// ---------------------------------------------------------------------------
// Frase resumen (idea del prototipo de Lara, en versión descriptiva)
// ---------------------------------------------------------------------------
const PREFIJO_ACTUAL = /^\s*current rotation\s*:\s*/i;

/** Formato por omisión: un decimal para la dotación y los años; hectáreas y área con formatoHectareas (mismo formato). */
function formatoPorOmision(areaHa) {
  const ha = formatoHectareas(areaHa);
  return (valor, clave) => {
    if (clave === "ha" || clave === "area") return ha(valor);
    if (!esNumero(valor)) return "—";
    return numero(valor, { maximumFractionDigits: 1 });
  };
}

// ---------------------------------------------------------------------------
// Hectáreas junto al área (revisión con Playwright, 2026-11-15, punto 6: «Enough for 20.7 of 20.66 hectares»)
// ---------------------------------------------------------------------------
const DECIMALES_MINIMOS_HA = 1; // lo que alcanza en una parcela de área entera se lee con un decimal
const DECIMALES_MAXIMOS_HA = 3; // los de un dato leído de un archivo (fmtDato de app.js)
const HOLGURA_REDONDEO = 1e-9; // 20.66 × 100 da 2065.9999…: sin holgura, el redondeo hacia abajo perdería un centésimo

/**
 * formatoHectareas(areaHa) -> función (valor) -> texto.
 * Las hectáreas que alcanzan y el área de la parcela con el MISMO formato: los decimales del área tal como llega en
 * los datos (de uno a tres, sin ceros de relleno). Lo que alcanza se redondea hacia abajo y nunca pasa del área: el
 * texto no dice más de lo calculado ni más que la parcela. Sin área (dato ausente), un decimal y sin tope.
 */
export function formatoHectareas(areaHa) {
  const conArea = esNumero(areaHa);
  const decimalesArea = conArea ? (numero(areaHa, { maximumFractionDigits: DECIMALES_MAXIMOS_HA }).split(".")[1] ?? "").length : 0;
  const decimales = Math.max(DECIMALES_MINIMOS_HA, decimalesArea);
  const escala = 10 ** decimales;
  return (valor) => {
    if (!esNumero(valor)) return "—";
    const abajo = Math.floor(valor * escala + HOLGURA_REDONDEO) / escala;
    return numero(conArea ? Math.min(abajo, areaHa) : abajo, { maximumFractionDigits: decimales });
  };
}

/** «hectare» o «hectares» según el número (reglas de plural del inglés). */
export function hectareasTexto(n) {
  return hectareas(n);
}

// Aclaración final entre paréntesis del nombre («Pecan orchard (does not rotate)»): la frase ya pone el nombre
// entre paréntesis y no se anidan; la aclaración sigue a la vista en la tarjeta.
const ACLARACION_FINAL = /\s*\([^()]*\)\s*$/;

/** Nombre de la rotación actual, tal como lo trae el cubo (sin el prefijo «Current rotation:» ni la aclaración final). */
function nombreRotacion(opcion, parcela) {
  const nombre = String(opcion?.nombre ?? "").replace(PREFIJO_ACTUAL, "").replace(ACLARACION_FINAL, "").trim();
  if (nombre) return nombre;
  const secuencia = Array.isArray(opcion?.secuencia) && opcion.secuencia.length ? opcion.secuencia : [parcela?.cultivo_actual];
  return secuencia.filter(Boolean).map((s) => String(s).replace(/_/g, " ")).join(" → ") || "crop not named";
}

export function casoResumen({ parcela, opcionActual, evaluacion, D } = {}) {
  if (parcela?.abstencion || evaluacion?.semaforo === "gris") return "abstenida";
  const lamina = evaluacion?.lamina;
  if (!parcela || !opcionActual || !lamina || !esNumero(lamina.p50)) return "sin_calculo";
  if (!(lamina.p50 > 0)) return "sin_riego";
  if (!esNumero(D) || !esNumero(evaluacion.cobertura) || !esNumero(evaluacion.hectareas?.p50)) return "sin_calculo";
  return evaluacion.cobertura >= 1 ? "completa" : "parcial";
}

export function fraseResumen({ parcela, opcionActual, evaluacion, D, formato } = {}) {
  const f = typeof formato === "function" ? formato : formatoPorOmision(parcela?.area_ha);
  const caso = casoResumen({ parcela, opcionActual, evaluacion, D });
  if (caso === "abstenida") {
    return "Not classified — check with a technician. The crop map is not sure what grows on this field, so its water need is not computed.";
  }
  if (caso === "sin_calculo") {
    return "No water need is computed for the current rotation of this field yet, so there is no summary to show.";
  }
  const cultivo = nombreRotacion(opcionActual, parcela);
  const area = f(parcela.area_ha, "area");
  if (caso === "sin_riego") {
    return `The current rotation (${cultivo}) needs no irrigation, so the water allocation does not limit its ${area} ${hectareas(parcela.area_ha)}.`;
  }
  const inicio = `With ${f(D, "d")} thousand m³/ha, the current rotation (${cultivo}) has enough water for`;
  const plazo = frasePlazo(opcionActual, cultivo, f);
  if (caso === "completa") {
    return evaluacion.semaforo === "ambar"
      ? `${inicio} all ${area} ${hectareas(parcela.area_ha)} at the median estimate of its need, not at the high estimate. ${plazo}`
      : `${inicio} all ${area} ${hectareas(parcela.area_ha)}. ${plazo}`;
  }
  return `${inicio} ${f(evaluacion.hectareas.p50, "ha")} of ${area} ${hectareas(parcela.area_ha)}. ${plazo}`;
}

// ---------------------------------------------------------------------------
// Plazo del agua en la frase (revisión con Playwright, 2026-11-15, punto 1): por cuántos años obliga la opción
// ACTUAL, leído de agua.plazo_anios, agua.plazo_restante y agua.nota_plazo del cubo. Antes solo estaba en la
// tarjeta («Commits water for …»), unas dos pantallas y media abajo en el teléfono.
// ---------------------------------------------------------------------------
const reglasPlural = new Intl.PluralRules(LOCALE);
const singular = (n) => esNumero(n) && reglasPlural.select(n) === "one";
const hectareas = (n) => (singular(n) ? "hectare" : "hectares");
/** «year» solo para un valor único igual a uno; un rango («0–1 years») va en plural. */
const anios = (r) => (r.min === r.max && singular(r.max) ? "year" : "years");
const rangoValido = (r) => r && typeof r === "object" && esNumero(r.min) && esNumero(r.max);

/** «3–4» o «10»: un rango del cubo con el formato de la app (clave «anios»). */
function rangoAnios(r, f) {
  return r.min === r.max ? f(r.min, "anios") : `${f(r.min, "anios")}–${f(r.max, "anios")}`;
}

/** Primera letra en mayúscula (el nombre abre la oración; si viene de la secuencia, llega en minúsculas). */
const conMayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Oración del plazo para la frase resumen:
 *   · anual (el plazo no pasa de un año): «{Cultivo} ties up water for one season.»
 *   · varios años: «{Cultivo} ties up water for {min}–{max} years ({restante} years left).»; con nota_plazo
 *     (la huerta: horizonte de cálculo) la nota va en el paréntesis; el restante se omite si es igual al plazo.
 *   · sin plazo en los datos: lo dice (no se inventa ni se calla).
 */
function frasePlazo(opcion, cultivo, f) {
  const agua = opcion?.agua ?? {};
  const plazo = agua.plazo_anios;
  if (!rangoValido(plazo)) return "The data do not give how many years it ties up water.";
  const sujeto = conMayuscula(cultivo);
  // Un año como máximo: el compromiso dura una temporada (comparación con la unidad del plazo, no un dato).
  if (plazo.max <= 1) return `${sujeto} ties up water for one season.`;
  const resto = agua.plazo_restante;
  const igual = rangoValido(resto) && resto.min === plazo.min && resto.max === plazo.max;
  const notas = [
    agua.nota_plazo ? String(agua.nota_plazo) : "",
    rangoValido(resto) && !igual ? `${rangoAnios(resto, f)} ${anios(resto)} left` : "",
  ].filter(Boolean);
  return `${sujeto} ties up water for ${rangoAnios(plazo, f)} ${anios(plazo)}${notas.length ? ` (${notas.join("; ")})` : ""}.`;
}

// ---------------------------------------------------------------------------
// Enlace directo a una parcela (#id)
// ---------------------------------------------------------------------------
function listaDeIds(ids) {
  if (ids == null) return [];
  if (ids instanceof Map) return Array.from(ids.keys());
  if (typeof ids === "string") return [ids];
  if (typeof ids[Symbol.iterator] === "function") return Array.from(ids);
  if (typeof ids === "object") return Object.keys(ids);
  return [];
}

export function idDeHash(hash, idsValidos) {
  let texto = String(hash ?? "").trim();
  if (texto.startsWith("#")) texto = texto.slice(1);
  try {
    texto = decodeURIComponent(texto);
  } catch {
    // «%» suelto: se compara tal como llegó
  }
  const buscado = texto.trim().toLowerCase();
  if (!buscado) return null;
  for (const id of listaDeIds(idsValidos)) {
    if (String(id).toLowerCase() === buscado) return id;
  }
  return null;
}

export function hashDe(id) {
  const texto = String(id ?? "").trim();
  return texto ? `#${encodeURIComponent(texto)}` : "";
}

// ---------------------------------------------------------------------------
// NDVI mensual: modelo (funciones puras)
// ---------------------------------------------------------------------------
const FORMA_MES = /^(\d+)-(\d+)$/;
const formatosMes = new Map();
function fechaMes(opciones, fecha) {
  const llave = JSON.stringify(opciones);
  if (!formatosMes.has(llave)) formatosMes.set(llave, new Intl.DateTimeFormat(LOCALE, { ...opciones, timeZone: "UTC" }));
  return formatosMes.get(llave).format(fecha);
}

/** «2025-10» -> inicial, texto corto, texto largo y año. Si no tiene esa forma, se muestra tal cual. */
function etiquetasMes(mes) {
  const texto = String(mes ?? "");
  const m = FORMA_MES.exec(texto);
  const anio = m ? Number(m[1]) : NaN;
  const indice = m ? Number(m[2]) - 1 : NaN;
  const mesesDelAnio = 12; // calendario, no dato
  if (!m || !(indice >= 0 && indice < mesesDelAnio)) {
    return { inicial: texto.trim().charAt(0).toUpperCase(), corto: texto, largo: texto, anio: null, enero: false };
  }
  const fecha = new Date(Date.UTC(anio, indice, 1));
  return {
    inicial: fechaMes({ month: "narrow" }, fecha),
    corto: fechaMes({ month: "short", year: "numeric" }, fecha),
    largo: fechaMes({ month: "long", year: "numeric" }, fecha),
    anio,
    enero: indice === 0,
  };
}

/** Número entre −1 y 1, o null (misma regla que motor/ndvi_web.py: nada se inventa ni se recorta). */
function ndviValido(v) {
  return esNumero(v) && v >= NDVI_MINIMO && v <= NDVI_TOPE ? v : null;
}

function lineasDeUmbral(umbrales) {
  if (!umbrales || typeof umbrales !== "object") return [];
  const lineas = [];
  for (const u of UMBRALES) {
    const llave = u.llaves.find((k) => umbrales[k] != null);
    if (!llave) continue;
    const crudo = umbrales[llave];
    const valor = ndviValido(typeof crudo === "object" ? crudo.valor : crudo);
    if (valor == null) continue;
    const v = fmtEscala(valor);
    lineas.push({ clave: u.clave, valor, rotulo: u.rotulo(v), texto: u.texto(v) });
  }
  return lineas;
}

export function modeloNDVI({ serie, meses, umbrales } = {}) {
  const listaMeses = Array.isArray(meses) ? meses : [];
  const hayLista = Array.isArray(serie);
  const puntos = listaMeses.map((mes, i) => ({ i, mes, ...etiquetasMes(mes), valor: hayLista ? ndviValido(serie[i]) : null }));
  const tramos = []; // corridas de meses seguidos con dato: cada una es un trazo; entre ellas, el hueco
  let corrida = null;
  for (const p of puntos) {
    if (p.valor == null) {
      corrida = null;
      continue;
    }
    if (!corrida) {
      corrida = [];
      tramos.push(corrida);
    }
    corrida.push(p.i);
  }
  const conDato = puntos.filter((p) => p.valor != null);
  const extremo = (mejor) => conDato.reduce((a, p) => (a == null || mejor(p.valor, a.valor) ? p : a), null);
  const lineas = lineasDeUmbral(umbrales);
  const minimo = extremo((a, b) => a < b);
  const base = minimo && minimo.valor < NDVI_BASE ? Math.floor(minimo.valor * PASO_ESCALA) / PASO_ESCALA : NDVI_BASE;
  return {
    disponible: hayLista && listaMeses.length > 0,
    conDatos: conDato.length > 0,
    puntos,
    tramos,
    huecos: puntos.filter((p) => p.valor == null).map((p) => p.i),
    umbrales: lineas,
    ultimo: conDato.length ? conDato[conDato.length - 1].i : -1,
    maximo: extremo((a, b) => a > b),
    minimo,
    dominio: [Math.min(base, ...lineas.map((l) => l.valor)), NDVI_TOPE],
  };
}

// ---------------------------------------------------------------------------
// NDVI mensual: dibujo
// ---------------------------------------------------------------------------
function geometria(modelo, ancho) {
  const n = modelo.puntos.length;
  const largo = modelo.umbrales.reduce((a, l) => Math.max(a, l.rotulo.length), 0);
  const derecha = largo ? Math.ceil(largo * ANCHO_CARACTER) + HOLGURA_ROTULO : DERECHA_SIN_ROTULOS;
  const x0 = MARGEN.izq;
  const x1 = Math.max(x0 + n, ancho - derecha);
  const y0 = MARGEN.arriba;
  const y1 = ALTO - MARGEN.abajo;
  const paso = (x1 - x0) / Math.max(n, 1);
  const [min, max] = modelo.dominio;
  return {
    ancho, x0, x1, y0, y1, paso, n,
    px: (i) => x0 + paso * (i + 1 / 2),
    py: (v) => y0 + ((max - v) / (max - min || 1)) * (y1 - y0),
    indiceEn: (x) => Math.max(0, Math.min(n - 1, Math.floor((x - x0) / (paso || 1)))),
  };
}

/** Descripción para lectores de pantalla (la tabla con los mismos valores va después). */
function descripcion(modelo) {
  const p = modelo.puntos;
  const partes = [`Line chart of monthly NDVI, ${p[0].largo} to ${p[p.length - 1].largo}.`];
  if (modelo.maximo) partes.push(`Highest: ${fmtNdvi(modelo.maximo.valor)} in ${modelo.maximo.largo}.`);
  if (modelo.minimo) partes.push(`Lowest: ${fmtNdvi(modelo.minimo.valor)} in ${modelo.minimo.largo}.`);
  if (modelo.huecos.length) partes.push(`Months without data: ${modelo.huecos.map((i) => p[i].largo).join(", ")}.`);
  for (const l of modelo.umbrales) partes.push(`${l.texto}.`);
  partes.push("A data table follows.");
  return partes.join(" ");
}

function svgNDVI(modelo, g, id) {
  const { x0, x1, y0, y1, paso } = g;
  const [min, max] = modelo.dominio;
  const marcas = Array.from(new Set([min, NDVI_BASE, max])).filter((v) => v >= min && v <= max);
  const rejilla = marcas
    .map((v) => {
      const y = c(g.py(v));
      return (
        `<line class="resumen-ndvi-rejilla" x1="${c(x0)}" x2="${c(x1)}" y1="${y}" y2="${y}"/>` +
        `<text class="resumen-ndvi-eje" x="${c(x0 - HOLGURA_ROTULO)}" y="${y}" text-anchor="end" dominant-baseline="middle">${esc(fmtEscala(v))}</text>`
      );
    })
    .join("");

  // Huecos: una banda rayada por mes sin dato (la línea no pasa por ahí).
  const huecos = modelo.huecos
    .map((i) => `<rect class="resumen-ndvi-hueco" data-mes="${esc(modelo.puntos[i].mes)}" x="${c(x0 + paso * i)}" y="${c(y0)}" width="${c(paso)}" height="${c(y1 - y0)}" fill="url(#${id}-trama)"/>`)
    .join("");

  // Umbrales: línea punteada y rótulo a la derecha, fuera del área de la serie.
  const ys = modelo.umbrales.map((l) => g.py(l.valor));
  const yRotulo = ys.slice();
  if (yRotulo.length > 1 && Math.abs(yRotulo[1] - yRotulo[0]) < SEPARACION_ROTULOS) {
    const falta = (SEPARACION_ROTULOS - Math.abs(yRotulo[1] - yRotulo[0])) / 2;
    const arriba = yRotulo[0] <= yRotulo[1] ? 0 : 1;
    yRotulo[arriba] -= falta;
    yRotulo[1 - arriba] += falta;
  }
  const umbrales = modelo.umbrales
    .map((l, k) => {
      const y = c(ys[k]);
      return (
        `<line class="resumen-ndvi-umbral resumen-ndvi-umbral--${l.clave}" data-umbral="${l.clave}" x1="${c(x0)}" x2="${c(x1)}" y1="${y}" y2="${y}"/>` +
        `<text class="resumen-ndvi-rotulo" x="${c(x1 + HOLGURA_ROTULO / 2)}" y="${c(yRotulo[k])}" dominant-baseline="middle">${esc(l.rotulo)}</text>`
      );
    })
    .join("");

  // Eje de meses: inicial de cada mes y el año donde empieza la serie o cambia el año.
  const cada = Math.max(1, Math.ceil(PASO_MINIMO_INICIAL / (paso || 1)));
  // El año se escribe en el primer mes y en cada enero; si dos quedarían encimados (la serie empieza
  // poco antes de enero), se conserva el de enero. El último no se sale del dibujo.
  const conAnio = modelo.puntos.filter((p) => p.anio != null && (p.i === 0 || p.enero));
  const xAnio = (p) => Math.min(x0 + paso * p.i + HOLGURA_ANIO, g.ancho - ANCHO_ANIO);
  const anios = new Map(conAnio.filter((p, k) => k === conAnio.length - 1 || xAnio(conAnio[k + 1]) - xAnio(p) >= ANCHO_ANIO).map((p) => [p.i, xAnio(p)]));
  const meses = modelo.puntos
    .map((p) => {
      const x = c(g.px(p.i));
      const sinDato = p.valor == null ? " resumen-ndvi-mes--sin" : "";
      const inicial = p.i % cada === 0 ? `<text class="resumen-ndvi-mes${sinDato}" x="${x}" y="${c(y1 + BAJO_EJE_INICIAL)}" text-anchor="middle">${esc(p.inicial)}</text>` : "";
      const anio = anios.has(p.i) ? `<text class="resumen-ndvi-anio" x="${c(anios.get(p.i))}" y="${c(y1 + BAJO_EJE_ANIO)}">${esc(String(p.anio))}</text>` : "";
      const corte = p.anio != null && p.enero && p.i > 0 ? `<line class="resumen-ndvi-corte" x1="${c(x0 + paso * p.i)}" x2="${c(x0 + paso * p.i)}" y1="${c(y1)}" y2="${c(y1 + BAJO_EJE_ANIO)}"/>` : "";
      return inicial + anio + corte;
    })
    .join("");

  // Serie: un trazo por corrida de meses con dato y un punto por mes con dato.
  const trazos = modelo.tramos
    .filter((t) => t.length > 1)
    .map((t) => `<path class="resumen-ndvi-linea" d="${t.map((i, k) => (k ? "L" : "M") + c(g.px(i)) + "," + c(g.py(modelo.puntos[i].valor))).join("")}"/>`)
    .join("");
  const puntos = modelo.puntos
    .filter((p) => p.valor != null)
    .map((p) => `<circle class="resumen-ndvi-punto" data-mes="${esc(p.mes)}" cx="${c(g.px(p.i))}" cy="${c(g.py(p.valor))}" r="${RADIO}"/>`)
    .join("");

  return `<svg class="resumen-ndvi-svg" width="${g.ancho}" height="${ALTO}" viewBox="0 0 ${g.ancho} ${ALTO}" role="img" aria-label="${esc(descripcion(modelo))}" focusable="false">
    <defs><pattern id="${id}-trama" width="${PASO_TRAMA}" height="${PASO_TRAMA}" patternUnits="userSpaceOnUse" patternTransform="rotate(${GIRO_TRAMA})"><line class="resumen-ndvi-trama" x1="0" y1="0" x2="0" y2="${PASO_TRAMA}"/></pattern></defs>
    ${huecos}${rejilla}${umbrales}${meses}
    <line class="resumen-ndvi-base" x1="${c(x0)}" x2="${c(x1)}" y1="${c(y1)}" y2="${c(y1)}"/>
    ${trazos}${puntos}
    <g class="resumen-ndvi-cursor" visibility="hidden"><line x1="0" x2="0" y1="${c(y0)}" y2="${c(y1)}"/><circle cx="0" cy="0" r="${RADIO_ELEGIDO}"/></g>
  </svg>`;
}

/** Clave de la leyenda: el mismo trazo (o la misma trama) que la gráfica, en pequeño. */
function claveLinea(clase) {
  const y = ALTO_CLAVE / 2;
  return `<svg class="resumen-ndvi-clave" width="${ANCHO_CLAVE}" height="${ALTO_CLAVE}" viewBox="0 0 ${ANCHO_CLAVE} ${ALTO_CLAVE}" aria-hidden="true" focusable="false"><line class="${clase}" x1="0" x2="${ANCHO_CLAVE}" y1="${y}" y2="${y}"/></svg>`;
}
function claveHueco(id) {
  return `<svg class="resumen-ndvi-clave" width="${ANCHO_CLAVE}" height="${ALTO_CLAVE}" viewBox="0 0 ${ANCHO_CLAVE} ${ALTO_CLAVE}" aria-hidden="true" focusable="false"><rect class="resumen-ndvi-hueco" width="${ANCHO_CLAVE}" height="${ALTO_CLAVE}" fill="url(#${id}-trama)"/></svg>`;
}

function htmlClaves(modelo, id) {
  const claves = modelo.umbrales.map((l) => `<li data-umbral="${l.clave}">${claveLinea(`resumen-ndvi-umbral resumen-ndvi-umbral--${l.clave}`)}<span>${esc(l.texto)}</span></li>`);
  if (modelo.huecos.length) claves.push(`<li data-clave="hueco">${claveHueco(id)}<span>${esc(CLAVE_HUECO)}</span></li>`);
  return claves.length ? `<ul class="resumen-ndvi-claves">${claves.join("")}</ul>` : "";
}

function htmlTabla(modelo) {
  const filas = modelo.puntos
    .map((p) => `<tr><th scope="row">${esc(p.largo)}</th><td>${esc(p.valor == null ? TEXTO_SIN_DATO : fmtNdvi(p.valor))}</td></tr>`)
    .join("");
  // La caja oculta es un <div>: una <table> no respeta el alto ni el recorte y ensancharía la página.
  return `<div class="resumen-voz"><table class="resumen-ndvi-tabla"><caption>${esc(TITULO_NDVI)}</caption><thead><tr><th scope="col">Month</th><th scope="col">NDVI</th></tr></thead><tbody>${filas}</tbody></table></div>`;
}

function htmlFuente(fuente) {
  const texto = String(fuente ?? "").trim();
  // La fuente viene de los datos y está en español; la interfaz, en inglés.
  return texto ? `<p class="resumen-ndvi-fuente">${esc(PREFIJO_FUENTE)}<span lang="es">${esc(texto)}</span></p>` : "";
}

function textoLectura(modelo, i, elegido) {
  const p = modelo.puntos[i];
  const valor = p.valor == null ? TEXTO_SIN_DATO : `NDVI ${fmtNdvi(p.valor)}`;
  // Dos renglones siempre (valor y nota): elegir un mes no mueve lo que está debajo.
  return (
    `<span class="resumen-ndvi-lectura-mes">${esc(p.largo)}:</span> <strong>${esc(valor)}</strong>` +
    `<span class="resumen-ndvi-lectura-nota">${esc(elegido ? TEXTO_ELEGIDO : TEXTO_ULTIMO)}</span>`
  );
}

const controladores = new WeakMap(); // contenedor -> controlador (para soltar el anterior al redibujar)

export function dibujarNDVI(contenedor, datos = {}) {
  if (!contenedor || typeof document === "undefined") return null;
  asegurarHoja();
  controladores.get(contenedor)?.destruir();

  const id = idNuevo();
  const estado = { ...datos, elegido: null, ancho: 0, modelo: null, geo: null, vivo: true };
  const raiz = document.createElement("section");
  raiz.className = "resumen-ndvi";
  raiz.setAttribute("aria-labelledby", `${id}-titulo`);
  contenedor.replaceChildren(raiz);

  const lienzo = () => raiz.querySelector(".resumen-ndvi-lienzo");

  /** Ancho interior del lienzo (sin su relleno): el SVG se dibuja a ese ancho, sin escalar el texto. */
  function anchoDisponible() {
    const caja = lienzo();
    let medido = 0;
    if (caja && caja.clientWidth) {
      const estilo = getComputedStyle(caja);
      medido = caja.clientWidth - (parseFloat(estilo.paddingLeft) || 0) - (parseFloat(estilo.paddingRight) || 0);
    }
    return Math.max(ANCHO_MINIMO, Math.min(ANCHO_MAXIMO, Math.floor(medido) || ANCHO_POR_OMISION));
  }

  function pintarLectura() {
    const m = estado.modelo;
    const lectura = raiz.querySelector(".resumen-ndvi-lectura");
    const cursor = raiz.querySelector(".resumen-ndvi-cursor");
    if (!lectura || !cursor || !m?.conDatos) return;
    const elegido = estado.elegido != null && m.puntos[estado.elegido] ? estado.elegido : null;
    const i = elegido ?? m.ultimo;
    lectura.innerHTML = textoLectura(m, i, elegido != null);
    lectura.dataset.mes = m.puntos[i].mes;
    cursor.setAttribute("visibility", elegido == null ? "hidden" : "visible");
    if (elegido == null) return;
    // El cursor (línea y aro) se dibuja en x = cero y se traslada al mes elegido.
    cursor.setAttribute("transform", `translate(${c(estado.geo.px(i))})`);
    const marca = cursor.querySelector("circle");
    const valor = m.puntos[i].valor;
    marca.setAttribute("visibility", valor == null ? "hidden" : "inherit");
    if (valor != null) marca.setAttribute("cy", c(estado.geo.py(valor)));
  }

  function pintarGrafica() {
    const m = estado.modelo;
    const caja = lienzo();
    if (!caja || !m?.conDatos) return;
    estado.ancho = anchoDisponible();
    estado.geo = geometria(m, estado.ancho);
    caja.innerHTML = svgNDVI(m, estado.geo, id);
    pintarLectura();
  }

  function pintar() {
    const m = (estado.modelo = modeloNDVI(estado));
    const nivel = Number.isInteger(estado.nivel) ? estado.nivel : NIVEL_POR_OMISION;
    const titulo = `<h${nivel} class="resumen-ndvi-titulo" id="${id}-titulo">${esc(TITULO_NDVI)}</h${nivel}>`;
    raiz.dataset.estado = m.conDatos ? "con_datos" : m.disponible ? "sin_datos" : "no_disponible";
    if (!m.conDatos) {
      raiz.innerHTML = `${titulo}<p class="resumen-ndvi-aviso">${esc(m.disponible ? TEXTO_SIN_SERIE : TEXTO_NO_DISPONIBLE)}</p>${htmlFuente(estado.fuente)}`;
      return;
    }
    if (estado.elegido != null && !m.puntos[estado.elegido]) estado.elegido = null;
    raiz.innerHTML =
      titulo +
      `<div class="resumen-ndvi-lienzo" tabindex="0" role="group" aria-label="${esc(TEXTO_GRUPO)}" aria-describedby="${id}-lectura"></div>` +
      `<p class="resumen-ndvi-lectura" id="${id}-lectura"></p>` +
      htmlClaves(m, id) +
      `<p class="resumen-ndvi-ayuda">${esc(TEXTO_AYUDA)}</p>` +
      htmlTabla(m) +
      htmlFuente(estado.fuente);
    pintarGrafica();
  }

  function elegir(i) {
    const n = estado.modelo?.puntos.length ?? 0;
    const nuevo = i == null || !n ? null : Math.max(0, Math.min(n - 1, Math.round(i)));
    if (nuevo === estado.elegido) return;
    estado.elegido = nuevo;
    pintarLectura();
  }

  // --- Puntero: el mes más cercano (no hace falta atinarle a la línea) ---
  const sueltaElMes = (e, caja) => e.pointerType === "mouse" && !caja?.matches(":focus");
  function alMover(e) {
    const caja = lienzo();
    if (!caja || !estado.geo) return;
    if (!caja.contains(e.target)) {
      // El ratón pasó a la leyenda o a la nota: vuelve el último mes con dato.
      if (e.type === "pointermove" && sueltaElMes(e, caja)) elegir(null);
      return;
    }
    const svg = caja.querySelector("svg");
    if (!svg) return;
    const marco = svg.getBoundingClientRect();
    const escala = marco.width ? estado.ancho / marco.width : 1;
    elegir(estado.geo.indiceEn((e.clientX - marco.left) * escala));
  }
  function alSalir(e) {
    // Con el ratón, al salir vuelve el último mes con dato, salvo que la gráfica tenga el foco (quien la
    // lee con el teclado, o la fijó con un clic o con el dedo, conserva su mes hasta que el foco sale).
    if (sueltaElMes(e, lienzo())) elegir(null);
  }

  // --- Teclado: flechas, Inicio, Fin; Escape vuelve al último mes con dato ---
  function alTeclear(e) {
    const caja = lienzo();
    if (!caja || e.target !== caja || e.altKey || e.ctrlKey || e.metaKey) return;
    const m = estado.modelo;
    const fin = m.puntos.length - 1;
    const actual = estado.elegido ?? m.ultimo;
    let destino = null;
    if (e.key === "ArrowLeft") destino = actual - 1;
    else if (e.key === "ArrowRight") destino = actual + 1;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = fin;
    if (destino != null) {
      e.preventDefault();
      elegir(destino);
    } else if (e.key === "Escape" && estado.elegido != null) {
      e.stopPropagation(); // que la ficha no se cierre por soltar un mes
      elegir(null);
    }
  }
  // Los cambios hechos con el teclado se anuncian; los del puntero no (no interrumpen al lector).
  function alEnfocar(e) {
    if (e.target === lienzo()) raiz.querySelector(".resumen-ndvi-lectura")?.setAttribute("aria-live", "polite");
  }
  function alDesenfocar(e) {
    if (e.target !== lienzo()) return;
    raiz.querySelector(".resumen-ndvi-lectura")?.removeAttribute("aria-live");
    elegir(null); // el mes elegido dura mientras la gráfica tiene el foco (teclado, clic o dedo)
  }

  raiz.addEventListener("pointermove", alMover);
  raiz.addEventListener("pointerdown", alMover);
  raiz.addEventListener("pointerleave", alSalir);
  raiz.addEventListener("keydown", alTeclear);
  raiz.addEventListener("focusin", alEnfocar);
  raiz.addEventListener("focusout", alDesenfocar);

  // El ancho sigue al contenedor (ficha que se abre, giro del teléfono, zoom).
  const observador =
    typeof ResizeObserver === "function"
      ? new ResizeObserver(() => {
          if (!estado.vivo) return;
          if (!raiz.isConnected) return; // la ficha se reconstruyó: el nodo ya no está en la página
          if (estado.modelo?.conDatos && anchoDisponible() !== estado.ancho) pintarGrafica();
        })
      : null;
  observador?.observe(raiz);

  const controlador = {
    elemento: raiz,
    fijarDatos(nuevos = {}) {
      if (!estado.vivo) return;
      for (const k of ["serie", "meses", "umbrales", "fuente", "nivel"]) if (k in nuevos) estado[k] = nuevos[k];
      pintar();
    },
    elegir(i) {
      if (estado.vivo && estado.modelo?.conDatos) elegir(i);
    },
    destruir() {
      if (!estado.vivo) return;
      estado.vivo = false;
      observador?.disconnect();
      raiz.removeEventListener("pointermove", alMover);
      raiz.removeEventListener("pointerdown", alMover);
      raiz.removeEventListener("pointerleave", alSalir);
      raiz.removeEventListener("keydown", alTeclear);
      raiz.removeEventListener("focusin", alEnfocar);
      raiz.removeEventListener("focusout", alDesenfocar);
      raiz.remove();
      if (controladores.get(contenedor) === controlador) controladores.delete(contenedor);
    },
  };
  controladores.set(contenedor, controlador);
  pintar();
  return controlador;
}
