// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/app.js — Centro de control (kit C1) y ficha de parcela (kit C2), sin frameworks.
//
// Reglas de este archivo:
// - Ninguna cifra escrita a mano: todo número visible sale de web/data/ (cubo.json,
//   parcelas.geojson, explicaciones.json) o de las funciones de web/reglas.js (kit §2.4).
//   Las cadenas de texto de este archivo no llevan dígitos (lo revisará K-TEST, prueba 7).
// - Las reglas del deslizador viven SOLO en reglas.js; aquí únicamente se llaman.
// - Los colores se leen de las variables CSS de style.css (no hay colores en el JS).
// - Comentarios en español; la interfaz, en inglés.
// - Dos zonas piloto (docs/decisiones/2026-11-14_dos_zonas.md): el selector «Pilot area» sale de
//   cubo.zonas y solo aparece con más de una zona. Parcela sin propiedad «zona» = la primera zona del
//   cubo; sin cubo.zonas todo funciona como con una sola zona (bloque cubo.zona).
//
// Módulos de web/js/ que se conectan aquí (cada uno trae su hoja en web/css/, enlazada en index.html):
// - relieve.js: capa «Terrain & runoff» y botón «Simulate a storm» en el panel (kit A9, parte web), y la
//   línea de relieve del renglón Soil de cada tarjeta (S9 §4 bis);
// - gota.js: «Follow the drop» dentro de la ficha, Sankey con d3-sankey (kit X3.1 y X3.2);
// - mensaje.js: maqueta del mensaje de WhatsApp (en español) y ficha imprimible (kit C4);
// - acerca.js: pantalla de inicio de tres pasos y sección «About & Data» (kit C5). pruebas.json se lee solo al
//   abrir «About & Data» (carga perezosa); manifest.json se lee una vez al arrancar (la tarjeta «Twin status»
//   muestra la fecha de cada fuente) y «About & Data» y la hoja impresa reutilizan esa lectura.
// Gemelo digital (docs/decisiones/2026-11-14_gemelo_digital.md), con web/data/gemelo.json (opcional):
// - gemelo3d.js: botón «3D twin view» en los controles del mapa (solo con una zona elegida que tenga relieve),
//   relieve de NASADEM con la exageración de la zona y columnas de agua por parcela que siguen al deslizador y a
//   la lluvia; clic o Enter en una columna abre la ficha; leyenda arriba del panel;
// - tiempo.js: línea de tiempo «Agricultural year» en el panel; un año pasado colorea el mapa con la memoria de
//   ese año (seis estados) y el año actual vuelve a la vista normal;
// - estado_gemelo.js: tarjeta «Twin status» (observado, modelado y escenario, con la fecha de cada fuente);
// - instalar.js: «Install app» e indicador Online/Offline en la cabecera (service worker web/sw.js).
// - Inicio: la página abre en la zona de gemelo.json → zona_inicial (params.gemelo.zona_inicial, Delicias–Saucillo);
//   sin ella, en la primera zona de cubo.zonas. «All areas» sigue en el selector.
// La ficha completa (etapa 2 del gemelo; decisiones del gemelo §5, del suelo y de las bases del reto):
// - resumen.js: frase resumen descriptiva arriba de la ficha (con agua, lámina cero, abstenida), gráfica del NDVI
//   mensual real de la parcela (web/data/ndvi_mensual.json, con sus umbrales de referencia leídos del archivo) y el
//   enlace directo «#id» (abrir con #P0757 abre esa ficha; abrir una ficha cambia el hash; un id desconocido avisa);
// - suelo.js: el perfil de suelo UNA vez en la ficha (bloque «Soil and satellite evidence», con el mensaje de zona)
//   y la aptitud en el renglón Soil de cada tarjeta (web/data/suelo.json); la aptitud nunca descarta ni reordena;
// - contexto.js: la evidencia por parcela de las bases del reto (GEDI con su nota SIEMPRE junto al valor; ECOSTRESS
//   si llega) y el riesgo de helada junto a la fecha de siembra de las opciones (web/data/contexto.json);
// - en cada tarjeta, además: la lámina local de referencia (agua.lamina_local del cubo) con sus hectáreas que
//   cambian con el deslizador, el rótulo de la propuesta del equipo, la advertencia de advertir_si_rojo con el
//   plazo del dato y el filtro dotacion_minima evaluado EN VIVO contra el deslizador; el nogal sin rotación dice
//   su motivo y su fuente en lugar de las alternativas.
// Paneles, «About & Data» y registro (etapa 3 de la integración):
// - contexto.js: «Regional context» (montarContextoRegional) en un bloque plegable del panel, ligado a la zona elegida
//   y al año de la línea de tiempo, con la nota de que las series regionales no describen una parcela y las
//   advertencias de la sesión de datos a la vista; «Challenge data sources» (montarRecursosReto) en «About & Data»;
// - acerca.js: H1-b junto a H1 y los documentos enlazados (pruebas.json);
// - pendientes de la auditoría del motor: etiquetas [P]/[V] y fuente de La Boquilla y del acuífero (cubo.distrito),
//   la nota de cada marca y la equivalencia y el punto de medición en inglés (nota_en, equivalencia_en,
//   punto_medicion_en), la ventana de suelo desnudo de cubo.meta.ventana_desnudo, y en La gota el rótulo y la
//   fuente de las eficiencias del goteo (cubo.meta.goteo) junto a sus cifras y «upper bound» en el retorno sin tope.

import * as reglas from "./reglas.js";
import {
  llaveLluvia,
  aguaComprometida,
  cobertura,
  evaluarOpcion,
  conteosZona,
  rellenarMarcadores,
} from "./reglas.js";
import { agregarCapaRelieve, htmlRelieveParcela, cargarRelieve, leerOpcional } from "./js/relieve.js";
import { dibujarGota } from "./js/gota.js";
import { htmlWhatsApp, imprimirFicha } from "./js/mensaje.js";
import { montarInicio, montarAcerca, LLAVE_INICIO } from "./js/acerca.js";
import { crearGemelo3D } from "./js/gemelo3d.js";
import { agregarTerreno2D } from "./js/terreno2d.js";
import { crearLineaDeTiempo } from "./js/tiempo.js";
import { montarEstadoGemelo } from "./js/estado_gemelo.js";
import { montarInstalacion } from "./js/instalar.js";
import { fraseResumen, casoResumen, dibujarNDVI, idDeHash, hashDe } from "./js/resumen.js";
import { leerSuelo, htmlPerfilDeSuelo, htmlAptitud, htmlNotaDeZona } from "./js/suelo.js";
import { evidenciaDeParcela, riesgoDeHelada, montarContextoRegional, montarRecursosReto } from "./js/contexto.js";

const LOCALE = "en-US";

// ---------------------------------------------------------------------------
// Vocabulario de la interfaz (textos, símbolos y tramas). Ningún número.
// El símbolo y la trama acompañan al color: nada depende solo del color.
// ---------------------------------------------------------------------------
const SEMAFORO = {
  verde: { texto: "Enough water", detalle: "covers even the high estimate of the need", simbolo: "✓", trama: "ninguna" },
  ambar: { texto: "Tight", detalle: "covers the median need, not the high estimate", simbolo: "!", trama: "diagonal" },
  rojo: { texto: "Not enough water", detalle: "below the median need", simbolo: "✕", trama: "cruz" },
  gris: { texto: "Not classified", detalle: "the crop map abstained; check with a technician", simbolo: "?", trama: "puntos" },
  // Parcela CLASIFICADA sin opciones (cubo.parcelas.<id>.sin_opciones): no es una abstención del mapa.
  sin_calculo: { texto: "Not computed yet", detalle: "classified, but its options are not built (see the field sheet)", simbolo: "–", trama: "horizontal", soloSiHay: true },
};

// Motivo de una parcela clasificada sin opciones: código de motor/b4_cubo.py; la web pone el texto.
const SIN_OPCIONES = {
  sin_clima_zona: "There is no climate data for this field's pilot area yet, so its water need and options are not computed. The crop map did classify it.",
  sin_actual: "The current rotation of this field could not be built from its area's data files, so no options are computed yet. The crop map did classify it.",
};
const SIN_OPCIONES_OTRO = "No options computed for this field yet. The crop map did classify it.";

// Semáforo genérico de los renglones Suelo y Dinero (lo trae el cubo, no lo calcula la web).
const SEMAFORO_OTROS = {
  verde: { texto: "favorable", simbolo: "✓" },
  ambar: { texto: "watch", simbolo: "!" },
  rojo: { texto: "unfavorable", simbolo: "✕" },
  gris: { texto: "no data", simbolo: "?" },
};

const PLAZO = {
  libre: { texto: "Free", corto: "free", detalle: "annual crop or rest: one season", simbolo: "F", trama: "ninguna" },
  por_vencer: { texto: "Ending soon", corto: "ending soon", detalle: "alfalfa stand near the end of its term", simbolo: "E", trama: "diagonal" },
  comprometida: { texto: "Committed", corto: "committed", detalle: "young alfalfa or orchard: water tied up for years", simbolo: "C", trama: "cruz" },
  sin_dato: { texto: "No data", corto: "no data", detalle: "not classified, or no field memory", simbolo: "?", trama: "puntos" },
};

const MEMORIA = {
  perenne: { texto: "Perennial", letra: "P", trama: "ninguna" },
  verano: { texto: "Summer crop", letra: "S", trama: "horizontal" },
  invierno: { texto: "Winter crop", letra: "W", trama: "vertical" },
  doble: { texto: "Double crop", letra: "D", trama: "cruz" },
  descanso: { texto: "Rest", letra: "R", trama: "diagonal" },
  sin_dato: { texto: "No data", letra: "?", trama: "puntos" },
};

const CULTIVOS = {
  alfalfa: "Alfalfa",
  nogal: "Pecan orchard",
  chile: "Chile pepper",
  maiz_forrajero: "Forage maize",
  sorgo: "Sorghum",
  algodon: "Cotton",
  cereal_invierno: "Winter cereal",
  forraje_verano: "Summer forage",
  barbecho: "Fallow",
  descanso: "Rest",
  sin_clasificar: "Not classified",
};
// Una trama distinta por cultivo (barbecho y descanso comparten color: la trama los separa). «puntos» queda
// para «sin clasificar / sin dato». Las tramas se dibujan en style.css (.trama-*) y en registrarTramas().
const TRAMAS_CULTIVO = {
  alfalfa: "ninguna",
  nogal: "diagonal",
  chile: "cruz",
  maiz_forrajero: "horizontal",
  sorgo: "vertical",
  algodon: "contradiagonal",
  cereal_invierno: "cuadricula",
  forraje_verano: "rayas_anchas",
  barbecho: "puntos_gruesos",
  descanso: "horizontal_anchas",
  sin_clasificar: "puntos",
};
const TRAMAS = ["ninguna", "diagonal", "cruz", "puntos", "horizontal", "vertical", "contradiagonal", "cuadricula",
  "rayas_anchas", "puntos_gruesos", "horizontal_anchas"];

const PREGUNTAS = [
  ["por_que", "Why it's suggested"],
  ["evidencia", "Evidence"],
  ["beneficios", "Benefits"],
  ["que_no_sabemos", "What we don't know"],
  ["riesgos", "Risks needing local review"],
];

const GLOSARIO = [
  ["ET", "Evapotranspiration: the water the crop transpires plus what evaporates from the soil. It is the water actually consumed."],
  ["NDVI (“greenness”)", "A satellite index of how green a field is. ROOT reads it from NASA HLS images."],
  ["Bare soil", "Days with almost no green cover. Bare soil in the windy season can blow away."],
  ["Frost risk", "Chance of a freezing night in the planting window, from NASA POWER temperatures."],
  ["Water balance", "Every cubic metre that leaves the dam ends up as crop consumption, aquifer recharge or other losses."],
  ["Consumption cap", "A rule that drip irrigation may not raise the crop's water consumption (ET) above its historical level."],
  ["Millar", "The unit used in the district: a thousand m³ of water per hectare. See the equivalence under the slider."],
  ["Water term", "How many years a crop ties up water: one season for annual crops, several years for alfalfa, a long horizon for orchards."],
];

const AVISO_JUICIO = "This tool supports, never replaces, the judgment of farmers and local experts.";

// Vista 3D del gemelo: rótulos del botón y motivo visible cuando no se ofrece (decisión del gemelo, punto 1).
const TEXTO_3D = "3D twin view";
const TEXTO_3D_NO = "3D twin view: not available";
const MOTIVOS_3D = {
  sin_gemelo: "The twin data file (gemelo.json) was not built.",
  error_gemelo: "The twin data file (gemelo.json) could not be read.",
  sin_terreno: "No terrain tiles were built for the pilot areas.",
  todas: "Choose one pilot area: the terrain is drawn one area at a time.",
  sin_zona: "No terrain tiles for this pilot area.",
};
// Lámina local de referencia (agua.lamina_local del cubo; decisión del integrador con la sesión de datos).
const LAMINA_LOCAL = {
  aplicada: { titulo: "Typically applied in this district", limite: "district average, not this field" },
  recomendada: { titulo: "Recommended by INIFAP", limite: "regional recommendation, not this field" },
};
const TEXTO_SIN_REFERENCIA = "no local reference";
const NOTA_SIN_ROTACION = "No alternatives are compared for this field.";
// Enlace directo a una parcela con un id que no está en los datos (el id llega de la barra de direcciones).
const AVISO_ENLACE = (id) => `Field link «${id}»: there is no field with that ID here. Choose a field on the map or in the list.`;

// Holgura del clic sobre el mapa, en píxeles de pantalla (no es un dato del proyecto): alcanza parcelas muy pequeñas.
const TOLERANCIA_CLIC_PX = 4;

// ---------------------------------------------------------------------------
// Estado de la página
// ---------------------------------------------------------------------------
const estado = {
  cubo: null,
  parcelas: null,
  explicaciones: null,
  porId: new Map(),
  D: null, // dotación del deslizador (millares/ha)
  r: null, // lluvia elegida (0 o la variante seca)
  rBase: null,
  rSeca: null,
  colorear: "semaforo", // "semaforo" | "plazo" | id de capa
  capas: new Map(), // id de capa -> definición
  fichaId: null,
  disparador: null,
  gota: { opcion: null, goteo: false, tope: true },
  gotaApi: null, // instancia de web/js/gota.js en la ficha abierta
  whatsapp: false, // ¿la maqueta del mensaje está abierta en la ficha?
  relieveDatos: null, // relieve.json (null si no existe: «Terrain layer: not run»)
  relieve: null, // controlador de la capa «Terrain & runoff» (web/js/relieve.js)
  acerca: null, // promesa del montaje de «About & Data» (una sola vez)
  disparadorAcerca: null,
  mapa: null,
  mapaListo: false,
  marcadores: new Map(),
  pintadoPendiente: false,
  avisoTeselas: false,
  // Zonas piloto
  zonasIds: [], // ids de cubo.zonas, en el orden del cubo
  zonaSel: null, // id de la zona elegida; null = todas («All areas»)
  visibles: [], // parcelas de la zona elegida (todas si zonaSel es null)
  idsVisibles: new Set(),
  encuadre: null, // extensión que encuadra el mapa para la zona elegida
  movidoPorUsuario: false, // el usuario movió el mapa: no se vuelve a encuadrar al cambiar de tamaño
  etiquetasLocalidad: [], // [{el, lngLat}]: etiquetas (DOM) de las localidades del equipo en el mapa
  // Gemelo digital
  gemelo: null, // web/data/gemelo.json (null: sin vista 3D ni línea de tiempo, y la página lo dice)
  gemeloLectura: null, // cómo fue su lectura: "ok", "ausente" o "error" (el motivo del botón 3D lo distingue)
  vista3d: null, // controlador de web/js/gemelo3d.js (se crea al cargar el mapa)
  minZoomPrevio: null, // zoom mínimo del mapa antes de activar la vista 3D
  linea: null, // controlador de la línea de tiempo (web/js/tiempo.js)
  anioNormal: null, // año con el que abre la línea de tiempo: en él el mapa muestra la vista normal
  anioTiempo: null, // año elegido en la línea de tiempo que colorea el mapa; null = vista normal
  capasAnio: new Map(), // año -> esquema de memoria de ese año (para la línea de tiempo)
  estadoGemelo: null, // controlador de la tarjeta «Twin status»
  instalacion: null, // controlador de web/js/instalar.js
  // Ficha completa
  suelo: null, // web/data/suelo.json (null: «not available yet»)
  sueloError: null, // texto si suelo.json existe y no se pudo leer
  contexto: null, // web/data/contexto.json (GEDI, ECOSTRESS, heladas); null si no se construyó
  ndvi: null, // web/data/ndvi_mensual.json (meses, series por parcela, umbrales y fuente)
  ndviApi: null, // gráfica del NDVI de la ficha abierta (web/js/resumen.js)
  lecturas: { contexto: null, ndvi: null }, // detalle del error si contexto.json o ndvi_mensual.json no se pudieron leer
  // Paneles (etapa 3)
  contextoRegional: null, // controlador de «Regional context» (web/js/contexto.js); se monta al abrir su bloque
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const formatos = new Map();
function formateador(opciones) {
  const llave = JSON.stringify(opciones);
  if (!formatos.has(llave)) formatos.set(llave, new Intl.NumberFormat(LOCALE, opciones));
  return formatos.get(llave);
}
const MENOS = "−"; // signo menos tipográfico
const conMenos = (s) => s.replace("-", MENOS);

/** Número calculado por la web (hectáreas, dotación): un decimal como máximo. */
function fmt(v, decimales = 1) {
  if (v == null || !Number.isFinite(Number(v))) return "—";
  return conMenos(formateador({ maximumFractionDigits: decimales }).format(v));
}
/** Dato leído de un archivo: se muestra con su precisión (hasta tres decimales), sin redondear de más. */
function fmtDato(v) {
  return fmt(v, 3);
}
function fmtPct(fraccion) {
  if (fraccion == null || !Number.isFinite(fraccion)) return "—";
  return conMenos(formateador({ style: "percent", maximumFractionDigits: 0 }).format(fraccion));
}
function fmtSigno(v) {
  return conMenos(formateador({ maximumFractionDigits: 3, signDisplay: "exceptZero" }).format(v));
}
function fmtRango(a, b, f = fmtDato) {
  return a === b ? f(a) : `${f(a)}–${f(b)}`;
}
function fmtFecha(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return esc(iso);
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: "UTC" }).format(fecha);
}
function nombreMes(i, tipo) {
  return new Intl.DateTimeFormat(LOCALE, { month: tipo, timeZone: "UTC" }).format(new Date(Date.UTC(0, i)));
}
function anios(n) {
  return n === 1 ? "year" : "years";
}
function siNo(v) {
  if (v === true) return "yes";
  if (v === false) return "no";
  return "no data";
}
function nombreCultivo(c) {
  return CULTIVOS[c] ?? String(c ?? "unknown").replace(/_/g, " ");
}

/** Color de una variable CSS de style.css (p. ej. "sem-verde"). */
const coloresCache = new Map();
function colorCSS(nombre, respaldo = "gris") {
  if (!coloresCache.has(nombre)) {
    coloresCache.set(nombre, getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim());
  }
  return coloresCache.get(nombre) || (respaldo ? colorCSS(respaldo, null) : "");
}

/** [r, g, b] (0–255) de un color CSS (#rgb, #rrggbb o rgb()); null si no se entiende. */
function rgbDe(color) {
  const c = window.d3?.color?.(color)?.rgb?.();
  if (c && [c.r, c.g, c.b].every(Number.isFinite)) return [c.r, c.g, c.b];
  const t = String(color ?? "").trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(t);
  if (hex) {
    const h = hex[1].length === 3 ? [...hex[1]].map((x) => x + x).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(t);
  return rgb ? rgb.slice(1, 4).map(Number) : null;
}

/** Luminancia relativa y razón de contraste de WCAG (fórmulas de WCAG; no son datos). */
function luminancia([r, g, b]) {
  const canal = (v) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}
function contraste(a, b) {
  const [claro, oscuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (oscuro + 0.05);
}

/**
 * Tinta o blanco, el de MAYOR razón de contraste WCAG sobre el fondo (los símbolos de los círculos y las
 * letras de las muestras son lo que evita que el semáforo dependa solo del color). Se guarda por color.
 */
const tintaCache = new Map();
function textoSobre(color) {
  if (tintaCache.has(color)) return tintaCache.get(color);
  const tinta = colorCSS("tinta");
  const blanco = colorCSS("blanco");
  const [f, t, b] = [rgbDe(color), rgbDe(tinta), rgbDe(blanco)];
  const elegido = f && t && b ? (contraste(f, t) >= contraste(f, b) ? tinta : blanco) : tinta;
  tintaCache.set(color, elegido);
  return elegido;
}
/** Lo mismo para una variable CSS de color (p. ej. "sem-verde"). */
function textoSobreVar(colorVar) {
  return textoSobre(colorCSS(colorVar));
}

function reduceMovimiento() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/** Diseño ancho = el indicador flota sobre el mapa (lo decide style.css, no el JS). */
function esAncho() {
  return getComputedStyle($("#indicador")).position === "absolute";
}

async function cargarJSON(ruta) {
  const resp = await fetch(ruta);
  if (!resp.ok) throw new Error(`Could not read ${ruta} (HTTP ${resp.status})`);
  return resp.json();
}

/**
 * Archivo opcional (manifest.json, pruebas.json): se pide solo cuando hace falta. Devuelve
 * {estado: "ok", datos} · {estado: "ausente", detalle} (404: no se ha construido) ·
 * {estado: "error", detalle} (otro HTTP, red o JSON roto). Solo se guarda una lectura buena: un error se
 * reintenta la próxima vez (p. ej. al volver a abrir «About & Data»).
 */
const opcionales = new Map();
function cargarOpcional(ruta) {
  if (!opcionales.has(ruta)) {
    const promesa = leerOpcional(ruta).then((r) => {
      if (r.estado !== "ok") opcionales.delete(ruta);
      if (r.estado === "error") console.error(`ROOT: ${ruta} could not be read (${r.detalle})`);
      return r;
    });
    opcionales.set(ruta, promesa);
  }
  return opcionales.get(ruta);
}
const datosDe = (r) => (r?.estado === "ok" ? r.datos : null);

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
async function iniciar() {
  observarCabecera();
  // Antes de los datos: si la página abre desde una copia a medias y los datos no llegan, el rótulo lo dice.
  iniciarInstalacion();
  try {
    // relieve.json es opcional: cargarRelieve nunca falla (null si no existe) y la ficha toma de ahí el
    // rótulo de escala de la línea de relieve aunque se abra antes que el mapa. gemelo.json también es opcional
    // (sin él no hay vista 3D ni línea de tiempo, y la página lo dice); trae la zona con la que abre la página.
    // La ficha completa lee además suelo.json, contexto.json y ndvi_mensual.json: los tres son opcionales y su
    // lectura nunca falla (sin ellos, cada bloque dice que no está disponible).
    const [cubo, parcelas, explicaciones, relieve, gemelo, suelo, contexto, ndvi] = await Promise.all([
      cargarJSON("data/cubo.json"),
      cargarJSON("data/parcelas.geojson"),
      cargarJSON("data/explicaciones.json"),
      cargarRelieve(),
      cargarOpcional("data/gemelo.json"),
      leerSuelo(),
      cargarOpcional("data/contexto.json"),
      cargarOpcional("data/ndvi_mensual.json"),
    ]);
    estado.suelo = suelo.estado === "ok" ? suelo.datos : null;
    estado.sueloError = suelo.estado === "error" ? suelo.detalle : null;
    if (estado.sueloError) console.error(`ROOT: data/suelo.json could not be read (${estado.sueloError})`);
    estado.contexto = datosDe(contexto);
    estado.ndvi = datosDe(ndvi);
    // Cómo fue cada lectura: «ausente» (404, no se construyó) no es lo mismo que «error» (la ficha lo distingue).
    estado.lecturas = { contexto: contexto?.estado === "error" ? contexto.detalle : null, ndvi: ndvi?.estado === "error" ? ndvi.detalle : null };
    estado.cubo = cubo;
    estado.parcelas = parcelas;
    estado.explicaciones = explicaciones;
    estado.relieveDatos = relieve;
    const datosGemelo = datosDe(gemelo);
    estado.gemelo = datosGemelo && typeof datosGemelo === "object" ? datosGemelo : null;
    estado.gemeloLectura = gemelo?.estado ?? "error"; // "ok" · "ausente" (404: no se construyó) · "error"
  } catch (err) {
    mostrarErrorCarga(`The data files could not be loaded: ${err.message}`, err);
    return;
  }

  for (const f of estado.parcelas.features) estado.porId.set(f.properties.id, f);

  iniciarZonas();
  mostrarAvisoSimulado();
  iniciarControles();
  iniciarColoreado();
  iniciarLineaDeTiempo();
  iniciarEstadoGemelo();
  iniciarContextoRegional();
  pintarDistrito();
  pintarPie();
  conectarEventos();
  actualizarTodo();
  fijarMedidas(); // la cabecera ya tiene su alto final: el mapa se encuadra con él
  crearMapa();
  if (!estado.mapa) iniciarRelieve(null); // sin mapa, el bloque lo dice; con mapa, se agrega en «load»
  pintarLocalidades(); // después del mapa: sin mapa, la lista queda solo en texto
  // Enlace directo (#P0757): abre esa ficha antes de dar la página por lista; quien llega por un enlace a una
  // parcela no ve la pantalla de inicio encima de la ficha.
  const porEnlace = abrirDesdeHash();
  window.addEventListener("hashchange", () => abrirDesdeHash());
  document.body.dataset.listo = "si";
  // Pantalla de inicio de tres pasos (kit C5): una vez por sesión; «How it works» la vuelve a abrir.
  if (!porEnlace) montarInicio(document.body);
}

/**
 * Enlace directo a una parcela (web/js/resumen.js → idDeHash): «#P0757» abre su ficha (y pasa a su zona si la
 * elegida es otra). Un hash que no es un id de parcela ni el id de un elemento de la página (p. ej. «#principal»,
 * el ancla de «Skip to the map») muestra un aviso y no rompe nada. Devuelve true si abrió una ficha.
 */
function abrirDesdeHash() {
  const aviso = $("#aviso-enlace");
  const hash = window.location.hash;
  const id = idDeHash(hash, estado.porId);
  if (id) {
    if (aviso) aviso.hidden = true;
    const zona = zonaDe(estado.porId.get(id).properties);
    if (estado.zonaSel != null && zona !== estado.zonaSel) {
      $("#zona-sel").value = zona ?? "";
      cambiarZona(zona);
    }
    if (estado.fichaId !== id) abrirFicha(id);
    return true;
  }
  let crudo = hash.replace(/^#/, "");
  try {
    crudo = decodeURIComponent(crudo);
  } catch {
    // «%» suelto: se muestra tal como llegó
  }
  if (crudo && !document.getElementById(crudo) && aviso) {
    aviso.textContent = AVISO_ENLACE(crudo);
    aviso.hidden = false;
  }
  return false;
}

/** Aviso visible de que la página no pudo cargar o arrancar (y en la consola). */
function mostrarErrorCarga(texto, err) {
  console.error(err ?? texto);
  const aviso = document.createElement("p");
  aviso.className = "error-carga";
  aviso.setAttribute("role", "alert");
  aviso.textContent = texto;
  $("#principal").inert = false;
  $("#principal").prepend(aviso);
  document.body.dataset.listo = "error";
}

/**
 * Medidas que usa style.css: --alto-cabecera (marca + controles; alto del área del mapa en escritorio)
 * y --tope-ficha (borde inferior de los controles fijos en pantalla; la ficha empieza ahí).
 */
/**
 * La ficha tapa el mapa y el panel: mientras está abierta, lo de abajo no recibe foco ni clics (inert).
 * La marca y los controles siguen operables (el deslizador se mueve con la ficha abierta), salvo en pantallas
 * muy bajas (zoom, teléfono horizontal), donde style.css deja los controles fuera de la barra fija y la ficha
 * ocupa todo el alto: entonces también quedan tapados y se vuelven inert.
 */
function sincronizarInert() {
  const abierta = Boolean(estado.fichaId) && !$("#ficha").hidden;
  $("#principal").inert = abierta;
  const tapados = abierta && getComputedStyle($("#controles")).position !== "sticky";
  $("#controles").inert = tapados;
  $("#marca").inert = tapados;
}

function fijarMedidas() {
  const raiz = document.documentElement.style;
  const controles = $("#controles");
  raiz.setProperty("--alto-cabecera", `${$("#marca").offsetHeight + controles.offsetHeight}px`);
  raiz.setProperty("--alto-controles", `${controles.offsetHeight}px`);
  raiz.setProperty("--tope-ficha", `${Math.max(0, controles.getBoundingClientRect().bottom)}px`);
}

function observarCabecera() {
  fijarMedidas();
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(fijarMedidas);
    ro.observe($("#marca"));
    ro.observe($("#controles"));
  }
  window.addEventListener("resize", () => {
    fijarMedidas();
    sincronizarInert();
  });
  window.addEventListener("scroll", fijarMedidas, { passive: true });
}

function mostrarAvisoSimulado() {
  const mock = Boolean(estado.cubo.meta?.mock || estado.parcelas.meta?.mock || estado.explicaciones.meta?.mock);
  $("#aviso-simulado").hidden = !mock;
  $("#aviso-simulado-detalle").hidden = !mock;
}

// ---------------------------------------------------------------------------
// Zonas piloto: selector «Pilot area» (decisión del 14-nov-2026, dos zonas)
// ---------------------------------------------------------------------------
/** Ids de cubo.zonas en el orden del cubo (el de params). Vacío si el cubo no trae el bloque. */
function idsZonas() {
  const z = estado.cubo.zonas;
  return z && typeof z === "object" && !Array.isArray(z) ? Object.keys(z) : [];
}

/** Zona de una parcela: su propiedad «zona»; sin ella, la primera zona del cubo (compatibilidad). */
function zonaDe(p) {
  return p.zona ?? estado.zonasIds[0] ?? null;
}

function nombreZona(id) {
  const z = estado.cubo.zonas?.[id];
  return z?.nombre_mostrar ?? z?.nombre ?? String(id ?? "").replace(/_/g, " ");
}

/** Bloque del indicador: el de la zona elegida o, con «All areas», el total (cubo.zona). */
function bloqueZonaElegida() {
  return (estado.zonaSel && estado.cubo.zonas?.[estado.zonaSel]) || estado.cubo.zona;
}

/** bbox [oeste, sur, este, norte] de una zona como extensión [[o, s], [e, n]]; null si no hay. */
function extensionBbox(b) {
  return Array.isArray(b) && b.length === 4 && b.every((v) => Number.isFinite(Number(v)))
    ? [[Number(b[0]), Number(b[1])], [Number(b[2]), Number(b[3])]]
    : null;
}

/** Encuadre de la zona elegida: la extensión de sus parcelas; si no tiene, su bbox. */
function extensionZona() {
  return extension({ features: estado.visibles }) ?? (estado.zonaSel ? extensionBbox(estado.cubo.zonas?.[estado.zonaSel]?.bbox) : null);
}

/** Parcelas de la zona elegida, sus ids y el encuadre del mapa. */
function fijarVisibles() {
  const sel = estado.zonaSel;
  estado.visibles = sel == null ? estado.parcelas.features : estado.parcelas.features.filter((f) => zonaDe(f.properties) === sel);
  estado.idsVisibles = new Set(estado.visibles.map((f) => f.properties.id));
  estado.encuadre = extensionZona();
}

/**
 * Zona con la que abre la página (decisión del gemelo, punto 6): la de gemelo.json → zona_inicial si está en
 * cubo.zonas; si no, la primera de cubo.zonas. Con una sola zona (o sin cubo.zonas), null: «todas» es esa zona.
 */
function zonaInicial() {
  if (estado.zonasIds.length < 2) return null;
  const z = estado.gemelo?.zona_inicial;
  return z && estado.cubo.zonas?.[z] ? z : estado.zonasIds[0];
}

/** El selector aparece solo con más de una zona; con una (o sin cubo.zonas) la página queda como antes. */
function iniciarZonas() {
  estado.zonasIds = idsZonas();
  const varias = estado.zonasIds.length > 1;
  $("#selector-zona").hidden = !varias;
  estado.zonaSel = zonaInicial();
  if (varias) {
    const sel = $("#zona-sel");
    sel.innerHTML =
      '<option value="">All areas</option>' +
      estado.zonasIds.map((id) => `<option value="${esc(id)}">${esc(nombreZona(id))}</option>`).join("");
    sel.value = estado.zonaSel ?? "";
  }
  fijarVisibles();
}

/** Zona de la vista 3D: la elegida; con una sola zona en el cubo, esa (el selector no aparece). */
function zonaGemelo() {
  return estado.zonaSel ?? (estado.zonasIds.length === 1 ? estado.zonasIds[0] : null);
}

/** Nombre de lo que se ve (para la línea de tiempo): la zona elegida o todas las zonas. */
function rotuloZona() {
  if (estado.zonaSel) return nombreZona(estado.zonaSel);
  return estado.zonasIds.length > 1 ? "All areas" : estado.zonasIds.length ? nombreZona(estado.zonasIds[0]) : "";
}

/** Cambio de zona: indicador, conteos, lista y mapa pasan a las parcelas de esa zona. */
function cambiarZona(valor) {
  const id = valor && estado.cubo.zonas?.[valor] ? valor : null;
  if (id === estado.zonaSel) return;
  estado.zonaSel = id;
  fijarVisibles();
  // La ficha abierta de una parcela de otra zona se cierra (sin mover el foco del selector).
  if (estado.fichaId && !estado.idsVisibles.has(estado.fichaId)) cerrarFicha({ devolverFoco: false });
  filtrarLista();
  // Gemelo: la línea de tiempo cuenta las parcelas de la zona; la tarjeta marca la zona «in view»; la vista 3D
  // cambia de relieve o, si la zona nueva no tiene (o es «All areas»), se retira sola. Antes de encuadrar: el
  // encuadre conserva la inclinación solo si la vista sigue activa.
  estado.linea?.fijarDatos({ features: estado.visibles, rotulo: rotuloZona() });
  estado.estadoGemelo?.fijarZona(estado.zonaSel);
  estado.contextoRegional?.fijarZona(zonaGemelo());
  estado.vista3d?.actualizar({ zonaId: zonaGemelo() });
  sincronizar3D();
  actualizarTodo();
  encuadrar();
  // Capa de relieve: leyenda y tormenta de la zona elegida (o de todas con «All areas»).
  estado.relieve?.fijarZona(estado.zonaSel);
}

// ---------------------------------------------------------------------------
// Controles: deslizador, marcas, lluvia
// ---------------------------------------------------------------------------
function iniciarControles() {
  const { deslizador, marcas = [], equivalencia, punto_medicion } = estado.cubo.dotaciones;
  const input = $("#dotacion");
  input.min = String(deslizador.min);
  input.max = String(deslizador.max);
  input.step = String(deslizador.paso);

  // Valor inicial: la marca del año agrícola en curso (parcelas.geojson meta.anio_actual) si existe;
  // si no, la primera marca; si no, el mínimo del deslizador.
  const anioActual = estado.parcelas.meta?.anio_actual;
  const inicial = marcas.find((m) => anioActual != null && m.id === `como_${anioActual}`) ?? marcas[0];
  input.value = String(inicial ? inicial.valor : deslizador.min);

  const lista = $("#dotacion-marcas");
  const contenedor = $("#marcas");
  for (const m of marcas) {
    const op = document.createElement("option");
    op.value = String(m.valor);
    op.label = m.nombre;
    lista.append(op);

    const b = document.createElement("button");
    b.type = "button";
    b.className = "boton-marca";
    b.dataset.marca = m.id;
    b.textContent = m.nombre;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      input.value = String(m.valor);
      actualizarTodo();
    });
    contenedor.append(b);
  }

  // Equivalencia y punto de medición: texto del cubo (de params.json). La interfaz es inglés: se usa la versión en
  // inglés (equivalencia_en, punto_medicion_en); si el cubo no la trae, la de español con lang="es" para el lector de
  // pantalla (el deslizador lo usa como descripción).
  const { equivalencia_en: equivalenciaEn, punto_medicion_en: puntoEn } = estado.cubo.dotaciones;
  if (equivalenciaEn) $("#equivalencia").textContent = equivalenciaEn;
  else enEspanol($("#equivalencia"), equivalencia);
  if (puntoEn) $("#punto-medicion").textContent = puntoEn;
  else enEspanol($("#punto-medicion"), punto_medicion);
  if (esAncho()) $("#unidades").open = true;

  // Lluvia: la variante base es 0 y la seca es la otra llave del cubo (kit §2.3).
  const lluvias = (estado.cubo.lluvia_pct ?? []).map(Number);
  estado.rBase = lluvias.includes(0) ? 0 : lluvias[0];
  estado.rSeca = lluvias.find((v) => v !== estado.rBase);
  if (estado.rSeca === undefined) {
    $("#lluvia").closest(".interruptor").hidden = true;
    $("#lluvia-ayuda").hidden = true;
  } else {
    $("#lluvia-etiqueta").textContent = `Rain ${fmtSigno(estado.rSeca)}%`;
  }
}

/** Escribe en el nodo un texto de los datos (en español) con lang="es"; «not available» (inglés) si falta. */
function enEspanol(nodo, texto) {
  if (!nodo) return;
  nodo.textContent = texto ?? "not available";
  if (texto) nodo.setAttribute("lang", "es");
  else nodo.removeAttribute("lang");
}
/** <span lang="es"> con un texto de los datos (fuentes, notas): la interfaz es inglés; el dato, no. */
function textoEs(texto) {
  return `<span lang="es">${esc(texto)}</span>`;
}

function leerControles() {
  estado.D = Number($("#dotacion").value);
  estado.r = $("#lluvia").checked && estado.rSeca !== undefined ? estado.rSeca : estado.rBase;
}

function actualizarValorDeslizador() {
  const { marcas = [] } = estado.cubo.dotaciones;
  const D = estado.D;
  const texto = `${fmt(D)} thousand m³/ha`;
  $("#dotacion-valor").textContent = texto;

  const marcaActual = marcas.find((m) => Number(m.valor) === D);
  $("#dotacion").setAttribute("aria-valuetext", marcaActual ? `${texto} (${marcaActual.nombre})` : texto);
  for (const b of $$(".boton-marca")) {
    b.setAttribute("aria-pressed", String(Boolean(marcaActual) && b.dataset.marca === marcaActual.id));
  }

  // Información de la marca: rango, nota, fuente y etiqueta (solo si el deslizador está en ella).
  const info = $("#info-marca");
  const m = marcaActual && marcas.find((x) => x.id === marcaActual.id);
  if (!m) {
    info.hidden = true;
    return;
  }
  const rango = fmtRango(m.min, m.max);
  $("#info-marca-resumen").innerHTML = [
    `<strong>${esc(m.nombre)}:</strong> ${esc(rango)} thousand m³/ha`,
    m.min !== m.max ? `slider set to the midpoint, ${esc(fmtDato(m.valor))}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  $("#info-marca-fuente").innerHTML = [
    `Source: ${m.fuente ? textoEs(m.fuente) : "not available"}`,
    m.etiqueta ? `Label: ${textoEs(m.etiqueta)}` : "",
    m.fecha_consulta ? `Accessed: ${esc(fmtFecha(m.fecha_consulta))}` : "",
    // La nota en inglés (nota_en, copia de params); la de español solo si no hay traducción.
    m.nota_en ? `Note: ${esc(m.nota_en)}` : m.nota ? `Note: ${textoEs(m.nota)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  if (info.hidden && esAncho()) $("#info-marca-detalle").open = true;
  info.hidden = false;
}

// ---------------------------------------------------------------------------
// Ciclo de actualización (sin pedir datos nuevos)
// ---------------------------------------------------------------------------
function actualizarTodo() {
  leerControles();
  actualizarValorDeslizador();
  const conteos = conteosConSinCalculo(estado.visibles);
  actualizarIndicador(conteos);
  actualizarConteos(conteos);
  pintarColoreado();
  if (estado.fichaId) actualizarFicha();
  // Gemelo: las columnas de la vista 3D siguen a la dotación y a la lluvia; la tarjeta dice el escenario.
  estado.vista3d?.actualizar({ D: estado.D, r: estado.r });
  estado.estadoGemelo?.fijarEscenario(escenarioActual());
}

/** Lo que la persona movió, como texto (el mismo del deslizador), para «Your scenario» de «Twin status». */
function escenarioActual() {
  const marca = (estado.cubo.dotaciones.marcas ?? []).find((m) => Number(m.valor) === estado.D);
  const dotacion = `${fmt(estado.D)} thousand m³/ha${marca ? ` (${marca.nombre})` : ""}`;
  const seca = estado.rSeca !== undefined && estado.r === estado.rSeca;
  return { dotacion, lluvia: seca ? `Rain ${fmtSigno(estado.rSeca)}%` : "Normal rain" };
}

/** ¿Parcela clasificada (no abstenida) sin opción ACTUAL? No se evaluó: no es «Not classified». */
function sinCalculo(p) {
  return !p.abstencion && !opcionesDe(p.id).some((o) => o.id === "ACTUAL");
}

/**
 * conteosZona (web/reglas.js) cuenta como «gris» y como clasificada a toda parcela sin opción ACTUAL. Aquí
 * las clasificadas sin opciones pasan a su propia clase («sin_calculo») y salen del denominador del
 * indicador: no se evaluaron, así que no cuentan como «con agua» ni «sin agua».
 */
function conteosConSinCalculo(features) {
  const c = { ...conteosZona(features, estado.cubo, estado.D, estado.r), sin_calculo: 0 };
  for (const f of features) {
    if (!sinCalculo(f.properties)) continue;
    c.gris -= 1;
    c.clasificadas -= 1;
    c.sin_calculo += 1;
  }
  return c;
}

function actualizarIndicador(conteos) {
  const { D, r } = estado;
  const cifra = $("#indicador-cifra");
  const rango = $("#indicador-rango");
  const mensaje = $("#indicador-mensaje");
  const partes = [];

  // Zonas sin clima (cubo.zonas.<id>.clima_disponible = false): sus perennes no tienen lámina.
  const ids = estado.zonaSel ? [estado.zonaSel] : estado.zonasIds;
  const sinClima = ids.filter((id) => estado.cubo.zonas?.[id]?.clima_disponible === false);
  if (ids.length && sinClima.length === ids.length) {
    cifra.hidden = true;
    rango.hidden = true;
    mensaje.innerHTML = "<p>No climate data for this area yet, so the water need of its crops is not computed.</p>";
    mensaje.hidden = false;
    mensaje.classList.add("alerta");
    $("#indicador-segunda").textContent = "Field water checks will appear when the climate data of this area arrive.";
    return;
  }

  const ac = aguaComprometida(bloqueZonaElegida(), D, r);
  if (ac.sinDotacion) {
    cifra.hidden = true;
    rango.hidden = true;
    partes.push("<p>No dam allocation: perennial crops depend on wells or go unmet</p>");
  } else {
    cifra.hidden = false;
    cifra.innerHTML =
      `${ac.alMenos ? '<span class="al-menos">at least </span>' : ""}` +
      `${esc(fmtPct(ac.p50))} <span class="de-dotacion">of the allocation</span>`;
    rango.hidden = false;
    rango.textContent = `Likely range: ${fmtPct(ac.p10)} to ${fmtPct(ac.p90)}`;
    if (ac.excede) {
      partes.push(
        "<p>Perennial crops alone ask for more than the allocation; the gap comes from wells or stays unmet.</p>" +
          '<button type="button" class="enlace-gota" id="enlace-gota">Follow the drop</button>',
      );
    }
  }
  if (ac.alMenos) {
    partes.push(`<p>${esc(fmtPct(ac.fraccionSinClasificar))} of the area is not classified, so this is a minimum.</p>`);
  }
  if (sinClima.length) {
    partes.push(`<p>No climate data yet for ${esc(sinClima.map(nombreZona).join(", "))}: its perennial crops are not counted.</p>`);
  }
  mensaje.innerHTML = partes.join("");
  mensaje.hidden = partes.length === 0;
  mensaje.classList.toggle("alerta", ac.sinDotacion || ac.excede);

  $("#indicador-segunda").innerHTML =
    `With ${esc(fmt(D))} thousand m³/ha, <strong>${esc(fmt(conteos.rojo, 0))} of ${esc(fmt(conteos.clasificadas, 0))}</strong> ` +
    "fields don't have enough water for their current rotation." +
    (conteos.sin_calculo
      ? ` ${esc(fmt(conteos.sin_calculo, 0))} classified ${conteos.sin_calculo === 1 ? "field is" : "fields are"} not counted: ${conteos.sin_calculo === 1 ? "its" : "their"} options are not computed yet.`
      : "");
}

function itemConteo(simbolo, colorVar, texto, n) {
  // Color del símbolo: tinta o blanco, el de mayor contraste WCAG sobre el fondo del círculo.
  return (
    `<li><span class="sem-circulo" style="background-color: var(--${colorVar}); color: ${esc(textoSobreVar(colorVar))}" aria-hidden="true">${esc(simbolo)}</span>` +
    `<span>${esc(texto)}</span><span class="n">${esc(fmt(n, 0))}</span></li>`
  );
}

function actualizarConteos(c) {
  $("#conteos-semaforo").innerHTML = Object.entries(SEMAFORO)
    .filter(([k, s]) => !s.soloSiHay || c[k] > 0)
    .map(([k, s]) => itemConteo(s.simbolo, `sem-${k}`, s.texto, c[k]))
    .join("");
  $("#conteos-plazo").innerHTML = Object.entries(PLAZO)
    .map(([k, s]) => itemConteo(s.simbolo, `plazo-${k}`, s.texto, c[k]))
    .join("");
}

// ---------------------------------------------------------------------------
// Coloreado del mapa: dos posiciones de agua + capas (una activa a la vez)
// ---------------------------------------------------------------------------
function iniciarColoreado() {
  const disponibles = estado.cubo.distrito?.capas_disponibles ?? [];
  const fieldset = $("#capas");
  for (const id of disponibles) {
    let def = null;
    if (id === "cultivos") def = capaCultivos();
    else if (id === "suelo_desnudo") def = capaSueloDesnudo();
    else if (id.startsWith("memoria_")) {
      const anio = Number(id.slice("memoria_".length));
      if (Number.isFinite(anio)) def = capaMemoria(anio);
    }
    if (!def) continue; // capa desconocida: no se muestra
    estado.capas.set(id, def);
    const label = document.createElement("label");
    label.className = "opcion-radio";
    label.innerHTML = `<input type="radio" name="colorear" value="${esc(id)}"> ${esc(def.titulo)}`;
    fieldset.append(label);
  }
  fieldset.hidden = estado.capas.size === 0;
}

/** Clasificador activo: devuelve por parcela {clave, color, trama, simbolo, texto}. */
function clasificador() {
  // Un año pasado en la línea de tiempo manda: el mapa muestra el estado observado de ese año.
  if (estado.anioTiempo != null) return capaDelAnio(estado.anioTiempo);
  const modo = estado.colorear;
  if (modo === "semaforo") return esquemaSemaforo();
  if (modo === "plazo") return esquemaPlazo();
  return estado.capas.get(modo) ?? esquemaSemaforo();
}

function semaforoActual(p) {
  const actual = opcionesDe(p.id).find((o) => o.id === "ACTUAL");
  if (p.abstencion) return "gris";
  if (!actual) return "sin_calculo"; // clasificada, pero sin opciones (cubo.parcelas.<id>.sin_opciones)
  return evaluarOpcion(actual, p.area_ha, estado.D, estado.r).semaforo;
}

function esquemaSemaforo() {
  return {
    titulo: "Enough water for the current rotation?",
    clases: Object.entries(SEMAFORO).map(([k, s]) => ({ clave: k, colorVar: `sem-${k}`, ...s })),
    fuente: "Computed in your browser: the allocation against each field's water need (current option), with the selected rain.",
    clase: (p) => semaforoActual(p),
  };
}

function esquemaPlazo() {
  return {
    titulo: "Water term",
    clases: Object.entries(PLAZO).map(([k, s]) => ({ clave: k, colorVar: `plazo-${k}`, ...s })),
    fuente: "From the crop map and the field memory (NASA HLS); alfalfa age counted from the memory.",
    clase: (p) => p.estado_plazo ?? "sin_dato",
  };
}

function capaCultivos() {
  const claves = Object.keys(CULTIVOS);
  return {
    titulo: "Crops",
    soloPresentes: true,
    clases: claves.map((k) => ({
      clave: k,
      colorVar: `cul-${k}`,
      texto: CULTIVOS[k],
      simbolo: "",
      trama: TRAMAS_CULTIVO[k] ?? "puntos",
    })),
    fuente: "Crop map of the current season from NASA HLS; “Not classified” when the model is unsure.",
    clase: (p) => (p.abstencion ? "sin_clasificar" : (p.cultivo_actual ?? "sin_clasificar")),
  };
}

/** «(Feb 1 – Apr 30)» de cubo.meta.ventana_desnudo (copia de params.suelo.ventana_desnudo); "" si el cubo no la trae. */
function textoVentanaDesnudo() {
  const v = estado.cubo.meta?.ventana_desnudo;
  return v?.inicio && v?.fin ? ` (${fmtMesDia(v.inicio)} – ${fmtMesDia(v.fin)})` : "";
}

function capaSueloDesnudo() {
  return {
    titulo: `Bare soil in the windy season${textoVentanaDesnudo()}`,
    continua: true,
    unidad: "days",
    fuente: "NASA HLS: days with very low greenness in the windy season; median of the years with data (current season if missing).",
    valor: (p) => p.dias_suelo_desnudo_mediana ?? p.dias_suelo_desnudo_feb_abr ?? null,
  };
}

function capaMemoria(anio) {
  return {
    titulo: `Field memory: ${anio}`,
    clases: Object.entries(MEMORIA).map(([k, s]) => ({ clave: k, colorVar: `mem-${k}`, simbolo: s.letra, ...s })),
    fuente: "Field memory from NASA HLS monthly greenness (rule-based reading; not a crop census).",
    clase: (p) => (Array.isArray(p.memoria) ? (p.memoria.find((m) => m.anio === anio)?.estado ?? "sin_dato") : "sin_dato"),
  };
}

/** Esquema de la línea de tiempo: la memoria de ese año, con la indicación de cómo volver a la vista normal. */
function capaDelAnio(anio) {
  if (!estado.capasAnio.has(anio)) {
    const capa = capaMemoria(anio);
    const vuelta = estado.anioNormal != null ? ` Move the timeline back to ${estado.anioNormal} to color fields by water again.` : "";
    estado.capasAnio.set(anio, { ...capa, fuente: `${capa.fuente}${vuelta}` });
  }
  return estado.capasAnio.get(anio);
}

/** Resultado del esquema activo para cada parcela. */
function clasificarParcelas() {
  const esq = clasificador();
  const salida = new Map();
  if (esq.continua) {
    // Rango de la rampa: solo las parcelas de la zona elegida (la salida sí cubre todas: la lista las conserva).
    const valores = estado.visibles.map((f) => esq.valor(f.properties)).filter((v) => v != null);
    const min = valores.length ? Math.min(...valores) : null;
    const max = valores.length ? Math.max(...valores) : null;
    const interp = window.d3?.interpolateRgb?.(colorCSS("suelo-bajo"), colorCSS("suelo-alto"));
    for (const f of estado.parcelas.features) {
      const v = esq.valor(f.properties);
      let color = colorCSS("gris");
      if (v != null) {
        const t = max > min ? (v - min) / (max - min) : 1;
        color = interp ? interp(t) : colorCSS("suelo-alto");
      }
      salida.set(f.properties.id, {
        color,
        trama: v == null ? "puntos" : "ninguna",
        simbolo: "",
        texto: v == null ? "no data" : `${fmtDato(v)} ${esq.unidad}`,
      });
    }
    return { esq, salida, min, max };
  }
  const porClave = new Map(esq.clases.map((c) => [c.clave, c]));
  for (const f of estado.parcelas.features) {
    const clave = esq.clase(f.properties);
    const c = porClave.get(clave) ?? { clave, colorVar: "gris", texto: nombreCultivo(clave), simbolo: "?", trama: "puntos" };
    salida.set(f.properties.id, { clave, color: colorCSS(c.colorVar), trama: c.trama, simbolo: c.simbolo, texto: c.texto });
  }
  return { esq, salida };
}

/**
 * Muestra de color de una leyenda. Si lleva letra o símbolo: tinta o blanco según el contraste WCAG con el
 * fondo, y un halo del mismo color de fondo para que la trama (p. ej. la cruz) no pase por la letra.
 */
function muestra(colorVar, trama, contenido = "", colorDirecto = null) {
  const color = colorDirecto ?? colorCSS(colorVar);
  const fondo = colorDirecto ? esc(colorDirecto) : `var(--${colorVar})`;
  const letra = contenido
    ? `<span class="muestra-letra" style="color: ${esc(textoSobre(color))}; background-color: ${fondo}">${esc(contenido)}</span>`
    : "";
  return `<span class="muestra trama-${esc(trama)}" style="background-color: ${fondo}" aria-hidden="true">${letra}</span>`;
}

function pintarColoreado() {
  const res = clasificarParcelas();
  estado.clasificacion = res;
  pintarLeyenda(res);
  pintarLista(res);
  programarPintadoMapa();
}

function pintarLeyenda({ esq, salida, min, max }) {
  const cont = $("#leyenda");
  let cuerpo = "";
  if (esq.continua) {
    const hay = min != null;
    cuerpo =
      `<p><strong>${esc(esq.titulo)}</strong> (${esc(esq.unidad)})</p>` +
      (hay
        ? `<div class="rampa" style="background: linear-gradient(to right, var(--suelo-bajo), var(--suelo-alto))" aria-hidden="true"></div>` +
          `<div class="rampa-etiquetas"><span>${esc(fmtDato(min))} ${esc(esq.unidad)}</span><span>${esc(fmtDato(max))} ${esc(esq.unidad)}</span></div>`
        : "<p>No values available.</p>") +
      `<ul><li>${muestra("gris", "puntos")} No data</li></ul>`;
  } else {
    const presentes = new Set(estado.visibles.map((f) => salida.get(f.properties.id)?.clave));
    const clases = esq.clases.filter((c) =>
      esq.soloPresentes ? presentes.has(c.clave) || c.clave === "sin_clasificar" : !c.soloSiHay || presentes.has(c.clave),
    );
    cuerpo =
      `<p><strong>${esc(esq.titulo)}</strong></p><ul>` +
      clases
        .map(
          (c) =>
            `<li data-clase="${esc(c.clave)}">${muestra(c.colorVar, c.trama, c.simbolo)}<span>${esc(c.texto)}` +
            `${c.detalle ? ` <span class="fuente">— ${esc(c.detalle)}</span>` : ""}</span></li>`,
        )
        .join("") +
      "</ul>";
  }
  // La leyenda es una región aria-live: se reescribe solo si cambió (al cambiar de capa, no en cada paso del
  // deslizador), para que el lector de pantalla no la repita entera con cada pulsación.
  const html = cuerpo + `<p class="fuente">Source: ${esc(esq.fuente)}</p>`;
  if (cont.dataset.html !== html) {
    cont.innerHTML = html;
    cont.dataset.html = html;
  }
}

/** Orden de la lista: parcelas de la historia, luego clasificadas, luego sin clasificar; cada grupo por id. */
function ordenParcelas() {
  const grupo = (p) => (p.protagonista ? 0 : p.abstencion ? 2 : 1);
  return [...estado.parcelas.features].sort(
    (a, b) => grupo(a.properties) - grupo(b.properties) || String(a.properties.id).localeCompare(String(b.properties.id)),
  );
}

// Lista de parcelas: con cientos de renglones no se reconstruye en cada movimiento del deslizador.
// Se arma una sola vez y después solo se actualizan el color, el símbolo y el texto que cambian.
const lista = { nodos: new Map(), filtro: "" };

function construirLista() {
  const ul = $("#lista-parcelas");
  const fragmento = document.createDocumentFragment();
  lista.nodos.clear();
  for (const f of ordenParcelas()) {
    const p = f.properties;
    const cultivo = p.abstencion ? "Not classified" : nombreCultivo(p.cultivo_actual);
    const li = document.createElement("li");
    li.innerHTML =
      `<button type="button" class="boton-parcela" data-id="${esc(p.id)}">` +
      '<span class="sem-circulo" aria-hidden="true"></span>' +
      `<span class="p-titulo">${esc(p.id)}${p.protagonista ? ' <span class="insignia-historia">story field</span>' : ""}</span>` +
      '<span class="p-detalle"></span></button>';
    lista.nodos.set(p.id, {
      li,
      boton: li.firstElementChild,
      circulo: $(".sem-circulo", li),
      detalle: $(".p-detalle", li),
      cultivo,
      base: `${cultivo} · ${fmtDato(p.area_ha)} ha`,
      busqueda: `${p.id} ${cultivo} ${p.protagonista ? "story field" : ""}`.toLowerCase(),
      ultimo: null,
    });
    fragmento.append(li);
  }
  ul.replaceChildren(fragmento);
  filtrarLista();
}

function pintarLista({ salida }) {
  if (lista.nodos.size !== estado.parcelas.features.length) construirLista();
  for (const [id, n] of lista.nodos) {
    const c = salida.get(id);
    const llave = `${c.color}|${c.simbolo}|${c.texto}`;
    if (n.ultimo !== llave) {
      n.ultimo = llave;
      n.circulo.style.backgroundColor = c.color;
      n.circulo.style.color = textoSobre(c.color);
      n.circulo.textContent = c.simbolo;
      // Sin repetir «Not classified» cuando la clase activa dice lo mismo que el cultivo.
      n.detalle.textContent = c.texto && c.texto !== n.cultivo ? `${n.base} · ${c.texto}` : n.base;
    }
    const actual = id === estado.fichaId;
    if (actual !== n.boton.hasAttribute("aria-current")) {
      if (actual) n.boton.setAttribute("aria-current", "true");
      else n.boton.removeAttribute("aria-current");
    }
  }
}

/** Filtro de la lista por zona y por id o cultivo; el resumen dice cuántas parcelas se ven. */
function filtrarLista() {
  const q = lista.filtro.trim().toLowerCase();
  let visibles = 0;
  let total = 0;
  for (const [id, n] of lista.nodos) {
    const enZona = estado.idsVisibles.has(id);
    if (enZona) total += 1;
    const ver = enZona && (!q || n.busqueda.includes(q));
    n.li.hidden = !ver;
    if (ver) visibles += 1;
  }
  const donde = estado.zonaSel ? ` in ${nombreZona(estado.zonaSel)}` : "";
  $("#lista-resumen").textContent =
    visibles === total ? `${fmt(total, 0)} fields${donde}` : `Showing ${fmt(visibles, 0)} of ${fmt(total, 0)} fields${donde}`;
}

// ---------------------------------------------------------------------------
// Mapa (MapLibre GL, local; mapa base OSM sin llave; sin teselas => fondo sólido)
// ---------------------------------------------------------------------------
function extension(fc) {
  let oeste = Infinity, sur = Infinity, este = -Infinity, norte = -Infinity;
  const recorrer = (c) => {
    if (typeof c[0] === "number") {
      oeste = Math.min(oeste, c[0]); este = Math.max(este, c[0]);
      sur = Math.min(sur, c[1]); norte = Math.max(norte, c[1]);
    } else c.forEach(recorrer);
  };
  for (const f of fc.features ?? [fc]) if (f.geometry) recorrer(f.geometry.coordinates);
  return Number.isFinite(oeste) ? [[oeste, sur], [este, norte]] : null;
}

function centro(f) {
  const ext = extension({ features: [f] });
  return ext ? [(ext[0][0] + ext[1][0]) / 2, (ext[0][1] + ext[1][1]) / 2] : null;
}

function avisoMapa(texto) {
  const aviso = $("#mapa-aviso");
  aviso.textContent = texto;
  aviso.hidden = false;
}

function rellenoMapa() {
  const { salida } = estado.clasificacion ?? clasificarParcelas();
  return {
    type: "FeatureCollection",
    features: estado.visibles.map((f) => {
      const c = salida.get(f.properties.id);
      return {
        type: "Feature",
        geometry: f.geometry,
        properties: {
          id: f.properties.id,
          protagonista: Boolean(f.properties.protagonista),
          _color: c.color,
          _trama: `trama-${c.trama}`,
          _sel: f.properties.id === estado.fichaId,
        },
      };
    }),
  };
}

/** Tramas para el mapa: dibujadas en un lienzo; tinta leída de CSS. */
function registrarTramas(mapa) {
  const lado = 16;
  const tinta = colorCSS("tinta");
  for (const tipo of TRAMAS) {
    const lienzo = document.createElement("canvas");
    lienzo.width = lado;
    lienzo.height = lado;
    const ctx = lienzo.getContext("2d");
    ctx.strokeStyle = tinta;
    ctx.fillStyle = tinta;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    const linea = (x1, y1, x2, y2) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); };
    const diagonal = () => { linea(0, lado, lado, 0); linea(-lado / 2, lado / 2, lado / 2, -lado / 2); linea(lado / 2, lado * 1.5, lado * 1.5, lado / 2); };
    if (tipo === "diagonal") diagonal();
    if (tipo === "cruz") { diagonal(); linea(0, 0, lado, lado); linea(-lado / 2, lado / 2, lado / 2, lado * 1.5); linea(lado / 2, -lado / 2, lado * 1.5, lado / 2); }
    if (tipo === "horizontal") linea(0, lado / 2, lado, lado / 2);
    if (tipo === "vertical") linea(lado / 2, 0, lado / 2, lado);
    if (tipo === "puntos") { ctx.beginPath(); ctx.arc(lado / 2, lado / 2, lado / 8, 0, Math.PI * 2); ctx.fill(); }
    if (tipo === "contradiagonal") { linea(0, 0, lado, lado); linea(-lado / 2, lado / 2, lado / 2, lado * 1.5); linea(lado / 2, -lado / 2, lado * 1.5, lado / 2); }
    if (tipo === "cuadricula") { linea(0, lado / 2, lado, lado / 2); linea(lado / 2, 0, lado / 2, lado); }
    if (tipo === "rayas_anchas") { ctx.lineWidth = lado / 3; linea(lado / 2, 0, lado / 2, lado); }
    if (tipo === "horizontal_anchas") { ctx.lineWidth = lado / 3; linea(0, lado / 2, lado, lado / 2); }
    if (tipo === "puntos_gruesos") { ctx.beginPath(); ctx.arc(lado / 2, lado / 2, lado / 4, 0, Math.PI * 2); ctx.fill(); }
    mapa.addImage(`trama-${tipo}`, ctx.getImageData(0, 0, lado, lado), { pixelRatio: 2 });
  }
}

/** Coordenada y de Mercator (en grados equivalentes) para comparar el alto y el ancho de la extensión. */
function mercatorY(lat) {
  return (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * 180) / Math.PI;
}

/**
 * Margen del encuadre. En escritorio el indicador flota arriba a la izquierda sobre el mapa:
 * se deja libre su espacio por arriba o por la izquierda, lo que deje las parcelas más grandes.
 * (Dejarlo siempre por arriba encogía la zona piloto a una franja y las parcelas a unos pocos píxeles.)
 */
function margenMapa(ext = estado.encuadre) {
  const m = 32;
  if (!esAncho() || !ext) return m;
  const ind = $("#indicador");
  const caja = $("#mapa").getBoundingClientRect();
  const ancho = ext[1][0] - ext[0][0];
  const alto = mercatorY(ext[1][1]) - mercatorY(ext[0][1]);
  const arriba = { top: ind.offsetTop + ind.offsetHeight + m, left: m, right: m, bottom: m };
  const izquierda = { top: m, left: ind.offsetLeft + ind.offsetWidth + m, right: m, bottom: m };
  const escala = (p) => {
    const w = caja.width - p.left - p.right;
    const h = caja.height - p.top - p.bottom;
    if (w <= 0 || h <= 0) return 0;
    return Math.min(ancho > 0 ? w / ancho : Infinity, alto > 0 ? h / alto : Infinity);
  };
  const ea = escala(arriba);
  const ei = escala(izquierda);
  if (ea <= 0 && ei <= 0) return m;
  return ei > ea ? izquierda : arriba;
}

function crearMapa() {
  const ml = window.maplibregl;
  const ext = estado.encuadre;
  if (!ml || !ext) {
    avisoMapa("The map could not be drawn here; use the field list to open each field.");
    document.body.dataset.mapa = "sin-mapa";
    return;
  }
  const estilo = {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
        maxzoom: 19,
        attribution: "© OpenStreetMap contributors",
      },
    },
    layers: [
      { id: "fondo", type: "background", paint: { "background-color": colorCSS("arena-mapa") } },
      { id: "osm", type: "raster", source: "osm" },
    ],
  };
  let mapa;
  try {
    mapa = new ml.Map({
      container: "mapa",
      style: estilo,
      bounds: ext,
      fitBoundsOptions: { padding: margenMapa(ext), maxZoom: 17 },
      attributionControl: { compact: true },
      cooperativeGestures: !esAncho(),
    });
  } catch (err) {
    console.warn("ROOT: map not available", err);
    avisoMapa("The map could not be drawn here (WebGL not available); use the field list to open each field.");
    document.body.dataset.mapa = "sin-mapa";
    return;
  }
  estado.mapa = mapa;
  mapa.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");

  // Si el contenedor cambia de tamaño (la cabecera crece, se gira el teléfono) y el usuario aún no
  // ha movido el mapa, se vuelve a encuadrar la zona elegida (la extensión de sus parcelas).
  const marcarMovido = (e) => { if (e.originalEvent) estado.movidoPorUsuario = true; };
  mapa.on("dragstart", marcarMovido);
  mapa.on("zoomstart", marcarMovido);
  mapa.on("resize", () => {
    if (estado.movidoPorUsuario || !estado.encuadre) return;
    mapa.fitBounds(estado.encuadre, { padding: margenMapa(estado.encuadre), maxZoom: 17, duration: 0, ...camara3D() });
  });

  // Teselas del mapa base que no cargan: aviso discreto, las parcelas siguen sobre fondo sólido.
  mapa.on("error", (ev) => {
    // Las fuentes de la vista 3D (prefijo «gemelo-») avisan por su cuenta (web/js/gemelo3d.js, alAvisar).
    if (String(ev?.sourceId ?? ev?.source?.id ?? "").startsWith("gemelo-")) return;
    if (ev?.sourceId === "osm" || ev?.source?.id === "osm" || ev?.tile) {
      if (!estado.avisoTeselas) {
        estado.avisoTeselas = true;
        avisoMapa("Base map tiles are unavailable: fields are drawn on a plain background.");
      }
      return;
    }
    console.warn("ROOT: map warning", ev?.error?.message ?? ev);
  });

  mapa.on("load", () => {
    registrarTramas(mapa);
    mapa.addSource("parcelas", { type: "geojson", data: rellenoMapa() });
    mapa.addLayer({ id: "parcelas-relleno", type: "fill", source: "parcelas", paint: { "fill-color": ["get", "_color"], "fill-opacity": 0.8 } });
    mapa.addLayer({ id: "parcelas-trama", type: "fill", source: "parcelas", paint: { "fill-pattern": ["get", "_trama"] } });
    mapa.addLayer({
      id: "parcelas-borde",
      type: "line",
      source: "parcelas",
      paint: {
        "line-color": ["case", ["==", ["get", "_sel"], true], colorCSS("tinta"), colorCSS("blanco")],
        "line-width": ["case", ["==", ["get", "_sel"], true], 4, ["==", ["get", "protagonista"], true], 2, 1],
      },
    });
    // Clic con tolerancia (propuesta de la sesión de datos, rama revision/web-dos-zonas): en la vista de las
    // dos zonas hay parcelas de menos de un píxel y el clic exacto no las alcanza. Si en el punto no hay
    // parcela, se busca en cuadros cada vez más grandes (de 1 px hasta la tolerancia) y se abre la más cercana.
    mapa.on("click", (e) => {
      // En 3D la columna tapa a la parcela de atrás: el clic sobre una columna lo atiende la vista 3D.
      if (estado.vista3d?.activo() && estado.vista3d.columnaEn(e.point, { tolerancia: TOLERANCIA_CLIC_PX })) return;
      const capas = { layers: ["parcelas-relleno"] };
      let hallados = mapa.queryRenderedFeatures(e.point, capas);
      for (let t = 1; !hallados.length && t <= TOLERANCIA_CLIC_PX; t++) {
        hallados = mapa.queryRenderedFeatures([[e.point.x - t, e.point.y - t], [e.point.x + t, e.point.y + t]], capas);
      }
      const id = hallados[0]?.properties?.id;
      if (id) abrirFicha(id);
    });
    mapa.on("mouseenter", "parcelas-relleno", () => { mapa.getCanvas().style.cursor = "pointer"; });
    mapa.on("mouseleave", "parcelas-relleno", () => { mapa.getCanvas().style.cursor = ""; });
    crearMarcadores();
    agregarLocalidades(mapa);
    iniciarRelieve(mapa); // rutas de escurrimiento debajo de los puntos de las localidades
    iniciarGemelo3D(mapa); // después de las capas de la aplicación: el sombreado del relieve va debajo de ellas
    agregarTerreno2D(mapa, { gemelo: estado.gemelo, cubo: estado.cubo, nombreZona, junto: "#capa-relieve" }); // mapa plano: sombreado, rampa, velo y escala
    estado.mapaListo = true;
    pintarMapa();
    // «listo» cuando la fuente de las parcelas ya está procesada (el GeoJSON se tesela aparte, después de «load»).
    esperarMapa().then(() => { document.body.dataset.mapa = "listo"; });
  });
}

/** Etiquetas de las parcelas protagonistas: id + símbolo de la clase activa. */
function crearMarcadores() {
  const ml = window.maplibregl;
  for (const f of estado.parcelas.features) {
    if (!f.properties.protagonista) continue;
    const pos = centro(f);
    if (!pos) continue;
    const el = document.createElement("div");
    el.className = "marcador";
    el.setAttribute("aria-hidden", "true"); // la lista de parcelas es la vía accesible
    el.addEventListener("click", (ev) => { ev.stopPropagation(); abrirFicha(f.properties.id); });
    const marcador = new ml.Marker({ element: el, anchor: "bottom" }).setLngLat(pos).addTo(estado.mapa);
    estado.marcadores.set(f.properties.id, { el, marcador });
  }
}

/** Encuadra la zona elegida (al cambiar de zona). Con la vista 3D activa conserva su inclinación y su rumbo. */
function encuadrar() {
  const ext = estado.encuadre;
  const mapa = estado.mapa;
  if (!mapa || !ext) return;
  estado.movidoPorUsuario = false;
  const camara = camara3D();
  // La vista 3D se acaba de retirar (p. ej. «All areas»): el mapa vuelve plano antes de encuadrar.
  if (!camara.pitch && (mapa.getPitch() || mapa.getBearing())) mapa.jumpTo({ pitch: 0, bearing: 0 });
  mapa.fitBounds(ext, { padding: margenMapa(ext), maxZoom: 17, duration: reduceMovimiento() ? 0 : 600, ...camara });
}

/** Inclinación y rumbo que un encuadre debe conservar: los de la vista 3D si está activa; si no, ninguno. */
function camara3D() {
  if (!estado.mapa || !estado.vista3d?.activo()) return {};
  return { bearing: estado.mapa.getBearing(), pitch: estado.mapa.getPitch() };
}

function programarPintadoMapa() {
  if (!estado.mapaListo || estado.pintadoPendiente) return;
  estado.pintadoPendiente = true;
  requestAnimationFrame(() => {
    estado.pintadoPendiente = false;
    pintarMapa();
  });
}

function pintarMapa() {
  if (!estado.mapaListo) return;
  estado.mapa.getSource("parcelas")?.setData(rellenoMapa());
  const { salida } = estado.clasificacion;
  for (const [id, { el }] of estado.marcadores) {
    el.hidden = !estado.idsVisibles.has(id); // protagonista de otra zona: sin etiqueta
    const c = salida.get(id);
    el.textContent = c.simbolo ? `${id} ${c.simbolo}` : `${id} · ${c.texto}`;
    el.style.borderColor = c.color;
  }
}

// ---------------------------------------------------------------------------
// Localidades del equipo (cubo.localidades, copiadas de params.zona_piloto.localidades_equipo).
// Son puntos de referencia, no parcelas: sin datos de agua. En el mapa, un punto (capa de círculos)
// y su nombre (etiqueta HTML: el estilo no carga tipografías de la red); en el panel, la lista en texto.
// ---------------------------------------------------------------------------
function listaLocalidades() {
  const l = estado.cubo.localidades;
  if (!Array.isArray(l)) return [];
  return l.filter((x) => x && Number.isFinite(Number(x.lat)) && Number.isFinite(Number(x.lon)));
}

/** Zona cuyo bbox contiene la localidad (solo informativo en la lista). */
function zonaDeLocalidad(l) {
  return estado.zonasIds.find((id) => {
    const ext = extensionBbox(estado.cubo.zonas?.[id]?.bbox);
    return ext && l.lon >= ext[0][0] && l.lon <= ext[1][0] && l.lat >= ext[0][1] && l.lat <= ext[1][1];
  });
}

function pintarLocalidades() {
  const locs = listaLocalidades();
  $("#bloque-localidades").hidden = locs.length === 0;
  if (!locs.length) return;
  const conMapa = Boolean(estado.mapa);
  const varias = estado.zonasIds.length > 1;
  $("#lista-localidades").innerHTML = locs
    .map((l, i) => {
      const zona = varias ? zonaDeLocalidad(l) : null;
      const detalle = [l.municipio ? `${l.municipio} municipality` : "", zona ? `${nombreZona(zona)} area` : ""].filter(Boolean).join(" · ");
      const texto =
        '<span class="punto-localidad" aria-hidden="true"></span><span class="localidad-texto">' +
        `<strong>${esc(l.nombre)}</strong>` +
        (detalle ? `<span class="localidad-detalle">${esc(detalle)}</span>` : "") +
        "</span>";
      return conMapa
        ? `<li><button type="button" class="boton-localidad" data-localidad="${i}">${texto}<span class="ver">Show on map</span></button></li>`
        : `<li class="localidad">${texto}</li>`;
    })
    .join("");
  const fuentes = [...new Set(locs.map((l) => l.fuente).filter(Boolean))];
  $("#localidades-fuente").innerHTML = `Source: ${fuentes.length ? textoEs(fuentes.join("; ")) : "not available"}`;
}

function agregarLocalidades(mapa) {
  const locs = listaLocalidades();
  if (!locs.length) return;
  const punto = (l) => [Number(l.lon), Number(l.lat)];
  mapa.addSource("localidades", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: locs.map((l) => ({ type: "Feature", geometry: { type: "Point", coordinates: punto(l) }, properties: { nombre: l.nombre } })),
    },
  });
  mapa.addLayer({
    id: "localidades-punto",
    type: "circle",
    source: "localidades",
    paint: { "circle-radius": 6, "circle-color": colorCSS("localidad"), "circle-stroke-color": colorCSS("blanco"), "circle-stroke-width": 2 },
  });
  const ml = window.maplibregl;
  estado.etiquetasLocalidad = locs.map((l) => {
    const el = document.createElement("div");
    el.className = "etiqueta-localidad";
    el.textContent = l.nombre;
    el.setAttribute("aria-hidden", "true"); // la lista del panel es la vía accesible
    new ml.Marker({ element: el, anchor: "left", offset: [10, 0] }).setLngLat(punto(l)).addTo(mapa);
    return { el, lngLat: punto(l) };
  });
  // Una etiqueta cuyo punto queda fuera de la vista se oculta (si no, asoma cortada por el borde).
  mapa.on("move", ocultarEtiquetasFuera);
  ocultarEtiquetasFuera();
}

function ocultarEtiquetasFuera() {
  if (!estado.mapa || !estado.etiquetasLocalidad.length) return;
  const vista = estado.mapa.getBounds();
  for (const { el, lngLat } of estado.etiquetasLocalidad) el.hidden = !vista.contains(lngLat);
}

/** «Show on map»: encuadra la zona elegida junto con la localidad y resalta su etiqueta. */
function mostrarLocalidad(i) {
  const l = listaLocalidades()[i];
  if (!l || !estado.mapa) return;
  const lon = Number(l.lon);
  const lat = Number(l.lat);
  const base = estado.encuadre ?? [[lon, lat], [lon, lat]];
  const ext = [
    [Math.min(base[0][0], lon), Math.min(base[0][1], lat)],
    [Math.max(base[1][0], lon), Math.max(base[1][1], lat)],
  ];
  estado.mapa.fitBounds(ext, { padding: margenMapa(ext), maxZoom: 15, duration: reduceMovimiento() ? 0 : 600 });
  estado.movidoPorUsuario = true; // que un cambio de tamaño no lo devuelva al encuadre de la zona
  estado.etiquetasLocalidad.forEach(({ el }, j) => el.classList.toggle("activa", j === i));
  if (!esAncho()) $("#mapa").scrollIntoView({ block: "center", behavior: reduceMovimiento() ? "auto" : "smooth" });
}

// ---------------------------------------------------------------------------
// Relieve y tormenta (S9 §4 bis; kit A9, parte web). Todo lo dibuja web/js/relieve.js en el bloque
// #capa-relieve del panel: interruptor «Terrain & runoff», botón «Simulate a storm», leyenda y tarjeta de
// la tormenta con su lámina y su fuente (de relieve.json). Sin relieve.json o sin rutas: «not run».
// ---------------------------------------------------------------------------
async function iniciarRelieve(mapa) {
  let ctl = null;
  try {
    ctl = await agregarCapaRelieve(mapa, {
      zonaActiva: estado.zonaSel,
      contenedor: "#capa-relieve",
      nombreZona,
      antesDe: "localidades-punto",
    });
  } catch (err) {
    // Falla inesperada del módulo: no es «not run». Se dice en el bloque (y en la consola).
    console.error("ROOT: terrain layer could not be built", err);
    const aviso = document.createElement("p");
    aviso.className = "relieve-no-corrido relieve-error";
    aviso.setAttribute("role", "alert");
    aviso.textContent = `Terrain layer: could not be loaded (${err?.message ?? err})`;
    $("#capa-relieve").append(aviso);
  }
  estado.relieve = ctl;
  // La zona pudo cambiar mientras se leían los archivos.
  if (ctl && ctl.estado().zona !== estado.zonaSel) ctl.fijarZona(estado.zonaSel);
  document.body.dataset.relieve = ctl?.disponible ? "listo" : (ctl?.elemento?.dataset.relieve ?? "error");
}

// ---------------------------------------------------------------------------
// Vista 3D del gemelo (web/js/gemelo3d.js; decisión del gemelo digital, punto 1). Un modo adicional del mapa:
// el botón «3D twin view» va en los controles del mapa; solo se ofrece con una zona elegida que tenga relieve en
// gemelo.json (si no, dice «not available» y por qué). Las columnas siguen al deslizador y a la lluvia
// (actualizarTodo) y a la zona (cambiarZona). Al desactivar, el mapa vuelve plano y sin capas del gemelo.
// ---------------------------------------------------------------------------
function iniciarGemelo3D(mapa) {
  try {
    estado.vista3d = crearGemelo3D({
      mapa,
      gemelo: estado.gemelo,
      reglas,
      alElegirParcela: (id) => abrirFicha(id),
      reducirMovimiento: reduceMovimiento,
      toleranciaClicPx: TOLERANCIA_CLIC_PX,
      alAvisar: (a) => {
        // «no_disponible» ya lo dice el botón con su motivo; lo demás (teselas, error) va al aviso del mapa.
        if (a?.tipo !== "no_disponible" && a?.mensaje) avisoMapa(a.mensaje);
        sincronizar3D();
      },
    });
    estado.vista3d.actualizar({ features: estado.parcelas.features, cubo: estado.cubo, D: estado.D, r: estado.r });
  } catch (err) {
    console.error("ROOT: the 3D twin view could not be prepared", err);
    estado.vista3d = null;
  }
  // Control del mapa con el botón y su motivo (texto + aria-pressed; operable con el teclado: es un <button>).
  const caja = document.createElement("div");
  caja.className = "maplibregl-ctrl maplibregl-ctrl-group control-gemelo";
  caja.innerHTML =
    '<button type="button" class="boton-gemelo" id="boton-gemelo" aria-pressed="false" aria-describedby="gemelo-motivo"></button>' +
    '<p class="gemelo-motivo" id="gemelo-motivo" hidden></p>';
  $(".boton-gemelo", caja).addEventListener("click", alternar3D);
  mapa.addControl({ onAdd: () => caja, onRemove: () => caja.remove() }, "top-right");
  $("#t-gemelo3d").textContent = TEXTO_3D;
  sincronizar3D();
}

/** Motivo por el que la vista 3D no se ofrece ahora (llave de MOTIVOS_3D), o null si se puede activar. */
function motivo3D() {
  if (!estado.gemelo) return estado.gemeloLectura === "ausente" ? "sin_gemelo" : "error_gemelo";
  if (!estado.gemelo.terreno) return "sin_terreno";
  const z = zonaGemelo();
  if (z == null) return estado.zonasIds.length > 1 ? "todas" : "sin_zona";
  if (!estado.vista3d?.disponible(z)) return "sin_zona";
  return null;
}

function alternar3D() {
  const vista = estado.vista3d;
  if (!vista || motivo3D()) {
    sincronizar3D(); // aria-disabled: el motivo ya está a la vista
    return;
  }
  if (vista.activo()) {
    vista.desactivar();
  } else {
    vista.actualizar({ features: estado.parcelas.features, cubo: estado.cubo, D: estado.D, r: estado.r });
    vista.activar(zonaGemelo());
  }
  sincronizar3D();
}

/**
 * Botón, leyenda y zoom mínimo según el estado de la vista. Con la vista activa el zoom mínimo del mapa sube a
 * terreno.minzoom + 1: MapLibre dibuja el relieve con teselas de un nivel menos que el zoom del mapa, así que por
 * debajo el terreno quedaría plano (motor/gemelo_web.py). Al desactivar vuelve el zoom mínimo de antes.
 */
function sincronizar3D() {
  const mapa = estado.mapa;
  const vista = estado.vista3d;
  const activo = Boolean(vista?.activo());
  if (mapa) {
    const minimo = Number(estado.gemelo?.terreno?.minzoom);
    if (activo && estado.minZoomPrevio == null && Number.isFinite(minimo) && minimo + 1 > mapa.getMinZoom()) {
      estado.minZoomPrevio = mapa.getMinZoom();
      mapa.setMinZoom(minimo + 1);
    } else if (!activo && estado.minZoomPrevio != null) {
      mapa.setMinZoom(estado.minZoomPrevio);
      estado.minZoomPrevio = null;
    }
  }
  const boton = $("#boton-gemelo");
  if (boton) {
    const motivo = motivo3D();
    boton.textContent = motivo ? TEXTO_3D_NO : TEXTO_3D;
    boton.setAttribute("aria-pressed", String(activo));
    if (motivo) boton.setAttribute("aria-disabled", "true");
    else boton.removeAttribute("aria-disabled");
    const nota = $("#gemelo-motivo");
    nota.textContent = motivo ? MOTIVOS_3D[motivo] : "";
    nota.hidden = !motivo;
    document.body.dataset.gemelo3d = activo ? "activo" : motivo ? "no-disponible" : "plano";
  }
  const bloque = $("#bloque-gemelo3d");
  const leyenda = $("#gemelo-leyenda");
  bloque.hidden = !activo;
  const html = activo ? vista.leyendaHTML(zonaGemelo()) : "";
  if (leyenda.dataset.html !== html) {
    leyenda.innerHTML = html;
    leyenda.dataset.html = html;
  }
}

// ---------------------------------------------------------------------------
// Línea de tiempo del gemelo (web/js/tiempo.js; punto 2). Abre en el año más reciente (el estado actual), donde
// el mapa muestra la vista normal; en otro año, el mapa y la leyenda muestran la memoria de ese año (seis estados).
// ---------------------------------------------------------------------------
function iniciarLineaDeTiempo() {
  const cont = $("#linea-tiempo");
  if (!cont) return;
  try {
    estado.linea = crearLineaDeTiempo({ contenedor: cont, gemelo: estado.gemelo, alCambiar: alCambiarAnio, reducirMovimiento: reduceMovimiento });
  } catch (err) {
    console.error("ROOT: the timeline could not be built", err);
    estado.linea = null;
    return;
  }
  estado.linea.fijarDatos({ features: estado.visibles, rotulo: rotuloZona() });
  estado.anioNormal = estado.linea.disponible() ? estado.linea.anio() : null;
}

function alCambiarAnio(anio) {
  estado.anioTiempo = anio == null || anio === estado.anioNormal ? null : anio;
  document.body.dataset.anioTiempo = estado.anioTiempo == null ? "" : String(estado.anioTiempo);
  pintarColoreado();
  // «Regional context» resalta el mismo año agrícola (también el actual: ahí el mapa vuelve a la vista normal).
  estado.contextoRegional?.fijarAnio(anio);
}

// ---------------------------------------------------------------------------
// «Regional context» (web/js/contexto.js; decisión de los recursos del reto, «Dónde se ve», punto 1): bloque plegable
// del panel con el clima del año y las series regionales de la zona elegida; resalta el año de la línea de tiempo.
// Se dibuja la primera vez que se abre (son más de una docena de gráficas) y después sigue a la zona y al año.
// ---------------------------------------------------------------------------
function iniciarContextoRegional() {
  const bloque = $("#bloque-contexto");
  const cont = $("#contexto-regional");
  if (!bloque || !cont) return;
  const montar = () => {
    if (!bloque.open || estado.contextoRegional || cont.dataset.montado) return;
    cont.dataset.montado = "si";
    if (estado.lecturas.contexto) {
      // contexto.json existe y no se pudo leer: no es «not available yet».
      cont.innerHTML = `<p class="contexto-aviso" role="status">Regional context: could not be read (${esc(estado.lecturas.contexto)})</p>`;
      document.body.dataset.contexto = "error";
      return;
    }
    try {
      estado.contextoRegional = montarContextoRegional(cont, {
        contexto: estado.contexto,
        zonaId: zonaGemelo(),
        anio: estado.linea?.disponible() ? estado.linea.anio() : null,
        nombresCultivo: CULTIVOS,
        nivel: 3,
      });
      document.body.dataset.contexto = estado.contexto ? "listo" : "ausente";
    } catch (err) {
      console.error("ROOT: the regional context could not be built", err);
      cont.innerHTML = `<p class="contexto-aviso" role="status">Regional context: could not be shown (${esc(err?.message ?? err)})</p>`;
      document.body.dataset.contexto = "error";
    }
  };
  bloque.addEventListener("toggle", montar);
  montar();
}

// ---------------------------------------------------------------------------
// Tarjeta «Twin status» (web/js/estado_gemelo.js; punto 3) en el panel. manifest.json (las fechas de cada fuente)
// se lee aquí una vez; «About & Data» y la hoja impresa reutilizan esa lectura (cargarOpcional).
// ---------------------------------------------------------------------------
function iniciarEstadoGemelo() {
  const cont = $("#estado-gemelo");
  if (!cont) return;
  try {
    estado.estadoGemelo = montarEstadoGemelo(cont, {
      manifest: null,
      cubo: estado.cubo,
      gemelo: estado.gemelo,
      zonaId: estado.zonaSel,
    });
  } catch (err) {
    console.error("ROOT: the twin status card could not be built", err);
    estado.estadoGemelo = null;
    return;
  }
  cargarOpcional("data/manifest.json").then((lectura) => {
    estado.estadoGemelo?.fijarDatos({ manifest: datosDe(lectura) });
    document.body.dataset.estadoGemelo = "listo";
  });
}

// ---------------------------------------------------------------------------
// Aplicación instalable y sin conexión (web/js/instalar.js; punto 4): «Install app» e indicador Online/Offline en
// la cabecera. Se monta antes de leer los datos. Fuera de https o localhost no dibuja nada.
// ---------------------------------------------------------------------------
function iniciarInstalacion() {
  const cont = $("#marca-instalar");
  if (!cont) return;
  try {
    estado.instalacion = montarInstalacion(cont);
  } catch (err) {
    console.warn("ROOT: install and offline indicator not available", err);
  }
}

// ---------------------------------------------------------------------------
// Panel lateral: La Boquilla, acuífero, pie de fuentes
// ---------------------------------------------------------------------------
function pintarDistrito() {
  const d = estado.cubo.distrito ?? {};
  const b = d.boquilla;
  if (b) {
    const hay = b.almacenamiento_hm3 != null;
    const fraccion = hay && b.namo_hm3 > 0 ? Math.min(1, b.almacenamiento_hm3 / b.namo_hm3) : null;
    $("#boquilla").innerHTML =
      (hay
        ? `<p>Storage on ${esc(fmtFecha(b.fecha_almacenamiento))}</p><p class="dato-grande">${esc(fmtDato(b.almacenamiento_hm3))} hm³</p>`
        : "<p>Storage: <strong>no data</strong></p>") +
      (fraccion != null
        ? `<div class="barra-presa" role="img" aria-label="Storage ${esc(fmtDato(b.almacenamiento_hm3))} hm³ of ${esc(fmtDato(b.namo_hm3))} hm³ at NAMO"><span style="width: ${fraccion * 100}%"></span></div>`
        : "") +
      `<p>Capacity at <abbr title="Normal maximum operating level">NAMO</abbr>: <strong>${esc(fmtDato(b.namo_hm3))} hm³</strong></p>` +
      // Fuente y etiqueta de cada cifra ([P] prensa, [V] verificado; cubo.distrito, copia de params.json).
      `<p class="fuente" data-dato="almacenamiento">Storage: ${b.fuente_almacenamiento ? textoEs(b.fuente_almacenamiento) : "no source"}${etiquetaDato(b.etiqueta_almacenamiento)}.</p>` +
      `<p class="fuente" data-dato="namo">Capacity: ${b.fuente_namo ? textoEs(b.fuente_namo) : "no source"}${etiquetaDato(b.etiqueta_namo)}.</p>`;
  } else {
    $("#boquilla").innerHTML = "<p>No data.</p>";
  }

  // El número del acuífero sale del nombre del campo del contrato (acuifero_<clave>).
  const llave = Object.keys(d).find((k) => k.startsWith("acuifero_"));
  const a = llave ? d[llave] : null;
  if (a) {
    $("#t-acuifero").textContent = `Aquifer ${llave.slice("acuifero_".length)}`;
    const v = a.disponibilidad_hm3_anio;
    $("#acuifero").innerHTML =
      "<p>Availability</p>" +
      `<p class="dato-grande">${v == null ? "no data" : `${esc(fmtSigno(v))} hm³ per year`}</p>` +
      (v != null && v < 0 ? "<p>A negative availability is the official deficit published by Conagua, not a measured loss.</p>" : "") +
      `<p class="fuente" data-dato="acuifero">Source: ${a.fuente ? textoEs(a.fuente) : "no source"}${etiquetaDato(a.etiqueta)}</p>`;
  } else {
    $("#acuifero").innerHTML = "<p>No data.</p>";
  }
}

/** Etiqueta de un dato del distrito ([P], [V]…) junto a su fuente; con «label not stated» si el cubo no la trae. */
function etiquetaDato(etiqueta) {
  return etiqueta
    ? ` <span class="etiqueta-dato" title="Evidence label">${esc(etiqueta)}</span>`
    : ' <span class="etiqueta-dato etiqueta-dato--falta">label not stated</span>';
}

function pintarPie() {
  const meta = estado.cubo.meta ?? {};
  const partes = [];
  // Los archivos ocultos de la caché (p. ej. data/processed/.gitkeep) no son fuentes de datos.
  const archivos = (Array.isArray(meta.fuentes) ? meta.fuentes : []).filter((f) => !String(f).split("/").pop().startsWith("."));
  if (archivos.length) partes.push(`Data files: ${archivos.join(", ")}`);
  if (meta.generado) partes.push(`generated ${meta.generado}`);
  if (meta.mock && Array.isArray(meta.mock_campos)) partes.push(`simulated blocks: ${meta.mock_campos.join(", ")}`);
  $("#pie-fuentes").textContent = partes.join(" · ");
}

// ---------------------------------------------------------------------------
// Ficha de parcela (C2)
// ---------------------------------------------------------------------------
function opcionesDe(id) {
  return estado.cubo.parcelas?.[id]?.opciones ?? [];
}

function abrirFicha(id, opciones = {}) {
  const f = estado.porId.get(id);
  if (!f) return;
  if (!estado.fichaId || !$("#ficha").contains(document.activeElement)) estado.disparador = document.activeElement;
  estado.fichaId = id;
  const ops = opcionesDe(id);
  estado.gota = { opcion: (ops.find((o) => o.id === "ACTUAL" && o.gota) ?? ops.find((o) => o.gota) ?? ops[0])?.id ?? null, goteo: false, tope: true };
  estado.whatsapp = false;
  construirFicha(f);
  fijarMedidas();
  // Enlace directo: la barra de direcciones dice qué ficha está abierta (sin entrada nueva en el historial).
  if (window.location.hash !== hashDe(id)) window.history.replaceState(window.history.state, "", hashDe(id));
  const avisoEnlace = $("#aviso-enlace");
  if (avisoEnlace) avisoEnlace.hidden = true;
  const ficha = $("#ficha");
  ficha.hidden = false;
  ficha.scrollTop = 0;
  sincronizarInert();
  pintarGota(); // con la ficha visible: el Sankey toma el ancho real de la sección
  pintarColoreado();
  if (opciones.seccion === "gota") {
    const h = $("#t-gota");
    h?.scrollIntoView({ block: "start", behavior: reduceMovimiento() ? "auto" : "smooth" });
    h?.focus({ preventScroll: true });
  } else {
    $("#ficha-titulo").focus({ preventScroll: true });
  }
}

function cerrarFicha({ devolverFoco = true } = {}) {
  if (!estado.fichaId) return;
  const id = estado.fichaId;
  estado.fichaId = null;
  estado.gotaApi?.destruir(); // detiene las gotas y los observadores del Sankey
  estado.gotaApi = null;
  estado.ndviApi?.destruir();
  estado.ndviApi = null;
  estado.whatsapp = false;
  // Sin ficha abierta, la dirección queda sin «#id» (replaceState no dispara «hashchange»).
  if (idDeHash(window.location.hash, estado.porId)) {
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  }
  $("#ficha").hidden = true;
  $("#ficha-cuerpo").innerHTML = "";
  sincronizarInert(); // antes de devolver el foco a la lista o al mapa
  pintarColoreado();
  if (!devolverFoco) return;
  const volver = estado.disparador && document.contains(estado.disparador) ? estado.disparador : $(`.boton-parcela[data-id="${CSS.escape(id)}"]`);
  volver?.focus?.();
}

function construirFicha(f) {
  const p = f.properties;
  const ops = opcionesDe(p.id);
  estado.gotaApi?.destruir();
  estado.gotaApi = null;
  estado.ndviApi?.destruir();
  estado.ndviApi = null;
  $("#ficha-titulo").textContent = `Field ${p.id}`;
  // Parcela abstenida: sin tarjetas; la memoria sí se muestra (kit C2.1 y C2.2). Sin tarjetas tampoco hay
  // renglón Soil: la línea de relieve (contexto de la zona) va debajo de la nota.
  const relieve = htmlRelieveParcela(p, { relieve: estado.relieveDatos });
  // Sin opciones: abstenida (el mapa no sabe qué hay) o clasificada con un motivo (código del cubo).
  const codigo = estado.cubo.parcelas?.[p.id]?.sin_opciones;
  const sinOpciones =
    (p.abstencion
      ? '<p class="nota-abstenida">The crop map is not sure what grows here, so no options are computed. ' +
        "Check the current crop with a technician; the field memory above still shows its history.</p>"
      : `<p class="nota-sin-calculo" data-motivo="${esc(codigo ?? "")}">${esc(SIN_OPCIONES[codigo] ?? SIN_OPCIONES_OTRO)}</p>`) + relieve;
  // Cultivo que no rota (nogal, maestro §5.2): su motivo y su fuente van en lugar de las alternativas.
  const sinRotacion = estado.cubo.parcelas?.[p.id]?.sin_rotacion;
  $("#ficha-cuerpo").innerHTML = [
    // Frase resumen descriptiva (web/js/resumen.js): la escribe actualizarFicha (depende del deslizador).
    '<p class="resumen-frase" id="ficha-resumen" aria-live="polite"></p>',
    htmlEncabezado(p),
    // En papel la línea de relieve va una sola vez, aquí (style.css la oculta en las tarjetas al imprimir).
    ops.length && relieve ? `<div class="solo-impresion relieve-impresion">${relieve}</div>` : "",
    htmlMemoria(p),
    // Gráfica del NDVI mensual real de la parcela (web/js/resumen.js → dibujarNDVI); en papel no va.
    '<div class="ficha-ndvi no-imprimir" id="ficha-ndvi"></div>',
    // En papel, el rótulo de la aptitud de suelo va una vez, en la línea del título (en pantalla, en cada tarjeta).
    `<section aria-labelledby="t-opciones"><h3 id="t-opciones">${sinRotacion ? "Current rotation" : "Current rotation and alternatives"}` +
      (ops.length && estado.suelo?.rotulo_aptitud ? `<span class="solo-impresion nota-aptitud-impresion"> · Soil fit: ${esc(estado.suelo.rotulo_aptitud)}</span>` : "") +
      "</h3>" +
      (ops.length ? `<div class="tarjetas">${ops.map((o) => htmlTarjeta(o, relieve, p)).join("")}</div>` : sinOpciones) +
      (ops.length && sinRotacion ? htmlSinRotacion(sinRotacion) : "") +
      "</section>",
    htmlEvidencia(p),
    htmlGota(ops, p),
    htmlCompartir(),
    `<p class="aviso-juicio">${esc(AVISO_JUICIO)}</p>`,
    htmlGlosario(),
  ].join("");
  conectarGota();
  conectarCompartir();
  pintarNDVI(p);
  actualizarFicha();
}

/** Gráfica del NDVI mensual de la parcela, con los umbrales de referencia de ndvi_mensual.json. */
function pintarNDVI(p) {
  const cont = $("#ficha-ndvi");
  if (!cont) return;
  const n = estado.ndvi;
  if (!n && estado.lecturas.ndvi) {
    cont.innerHTML = `<p class="ayuda">Monthly NDVI: could not be read (ndvi_mensual.json: ${esc(estado.lecturas.ndvi)}).</p>`;
    return;
  }
  try {
    estado.ndviApi = dibujarNDVI(cont, {
      serie: n?.parcelas?.[p.id],
      meses: n?.meses ?? [],
      umbrales: n?.umbrales ?? null,
      fuente: n?.fuente ?? null,
      nivel: 3,
    });
  } catch (err) {
    console.error("ROOT: the NDVI chart could not be drawn", err);
    cont.innerHTML = '<p class="ayuda">Monthly NDVI: could not be drawn for this field.</p>';
  }
}

/** El nogal (u otro cultivo que no rota): por qué no hay alternativas, con su fuente y su etiqueta. */
function htmlSinRotacion(sr) {
  return (
    '<div class="sin-rotacion" data-parte="sin-rotacion">' +
    `<p><strong>${esc(NOTA_SIN_ROTACION)}</strong> ${esc(sr.motivo ?? "")}</p>` +
    `<p class="fuente">Source: ${sr.fuente ? textoEs(sr.fuente) : "not available"}${sr.etiqueta ? ` ${esc(sr.etiqueta)}` : ""}</p>` +
    "</div>"
  );
}

/**
 * Bloque «Soil and satellite evidence» de la ficha (una vez por parcela): el perfil de suelo (web/js/suelo.js),
 * el mensaje de zona cuando la mayoría de sus parcelas es alcalina por encima del óptimo de la mayoría de los
 * cultivos, y la evidencia de las bases del reto (web/js/contexto.js: GEDI con su nota junto al valor; ECOSTRESS
 * si llegó, o su motivo). En papel no va: la hoja lleva la aptitud de cada tarjeta.
 */
function htmlEvidencia(p) {
  const zona = zonaDe(p);
  let perfil;
  try {
    perfil =
      htmlPerfilDeSuelo({ suelo: estado.suelo, id: p.id, error: estado.sueloError }) +
      htmlNotaDeZona({ suelo: estado.suelo, zonaId: zona, nombreZona: nombreZona(zona) });
  } catch (err) {
    console.error("ROOT: the soil profile could not be built", err);
    perfil = '<p class="suelo-perfil suelo-pendiente">Soil profile: could not be shown for this field.</p>';
  }
  const ctx = estado.contexto;
  let filas = [];
  try {
    filas = ctx ? evidenciaDeParcela({ contexto: ctx, id: p.id }) : [];
  } catch (err) {
    console.error("ROOT: the satellite evidence could not be read", err);
  }
  const items = filas.map(
    (f) =>
      `<li data-evidencia="${esc(f.etiqueta)}"${f.lectura ? ` data-lectura="${esc(f.lectura)}"` : ""}>` +
      `<p><strong>${esc(f.etiqueta)}:</strong> ${esc(f.texto)}</p>` +
      (f.nota ? `<p class="evidencia-nota">${esc(f.nota)}</p>` : "") +
      `<p class="fuente">Source: ${f.archivo ? esc([f.archivo, f.fecha].filter(Boolean).join(", ")) : "not available"}</p>` +
      (f.fuente ? `<details class="evidencia-fuente"><summary>Full source</summary><p class="fuente">${textoEs(f.fuente)}</p></details>` : "") +
      "</li>",
  );
  // ECOSTRESS pedido y no entregado: se dice (no se rellena con nada).
  if (ctx && !ctx.ecostress && ctx.ecostress_motivo) {
    items.push(`<li data-evidencia="ecostress"><p><strong>Evapotranspiration (ECOSTRESS):</strong> ${esc(ctx.ecostress_motivo)}</p></li>`);
  }
  const satelite = items.length
    ? `<ul class="evidencia-lista">${items.join("")}</ul>`
    : `<p class="ayuda">${ctx
      ? "No satellite evidence for this field yet."
      : estado.lecturas.contexto
        ? `Satellite evidence: could not be read (contexto.json: ${esc(estado.lecturas.contexto)}).`
        : "Satellite evidence: not available (contexto.json was not built)."}</p>`;
  return (
    '<section class="evidencia no-imprimir" id="seccion-evidencia" aria-labelledby="t-evidencia">' +
    '<h3 id="t-evidencia">Soil and satellite evidence</h3>' +
    `<div class="evidencia-suelo">${perfil}</div>` +
    '<div class="evidencia-satelite"><h4 class="evidencia-titulo">Satellite evidence</h4>' +
    satelite +
    "</div></section>"
  );
}

function htmlEncabezado(p) {
  const lugar = p.modulo ? `Module ${esc(p.modulo)}` : "Pilot area";
  // prob_max puede llegar en null (clasificación por reglas, sin probabilidad): se dice, no se inventa.
  const confianza = Number.isFinite(p.prob_max) ? `${esc(fmtPct(p.prob_max))} confidence` : "confidence not available";
  const cultivo = p.abstencion
    ? "Not classified — check with technician"
    : `${esc(nombreCultivo(p.cultivo_actual))} — ${confianza}`;
  const metodos = !p.abstencion && p.acuerdo_metodos ? ` <span class="fuente">(methods agree: ${esc(p.acuerdo_metodos)})</span>` : "";
  const plazo = PLAZO[p.estado_plazo ?? "sin_dato"] ?? PLAZO.sin_dato;
  const clavePlazo = p.estado_plazo ?? "sin_dato";
  const edad = textoEdad(p);
  return (
    '<header class="ficha-encabezado">' +
    `<p class="ficha-meta">${lugar} · ${esc(fmtDato(p.area_ha))} ha` +
    (p.ftw_confianza != null ? ` · boundary confidence (Fields of The World): ${esc(fmtDato(p.ftw_confianza))}%` : "") +
    (p.protagonista ? ' · <span class="insignia-historia">story field</span>' : "") +
    "</p>" +
    `<p class="ficha-cultivo">${cultivo}${metodos}</p>` +
    '<p class="ficha-plazo">' +
    `<span class="chip" style="border-color: var(--plazo-${esc(clavePlazo)})">${esc(plazo.simbolo)} Water term: ${esc(plazo.corto)}</span>` +
    (edad ? `<span>${edad}</span>` : "") +
    "</p></header>"
  );
}

function textoEdad(p) {
  const e = p.edad_perenne_anios;
  const perenne = p.estado_plazo === "por_vencer" || p.estado_plazo === "comprometida";
  if (e == null) return perenne ? "Stand age: age not available" : "";
  const registro = Array.isArray(p.memoria) ? p.memoria.length : 0;
  // La edad cubre toda la memoria: el patrón empezó antes del primer año observado, así que es un mínimo.
  const minimo = registro > 0 && e >= registro;
  // Nogal: la memoria lo ve como «cultivo de verano» cada año (pierde la hoja en invierno);
  // su edad cuenta los años seguidos con ese patrón (kit A3-M, paso 9).
  const etiqueta = p.cultivo_actual === "nogal" ? "Orchard pattern in satellite memory" : "Stand age from satellite memory";
  return `${etiqueta}: ${minimo ? "≥ " : ""}${esc(fmtDato(e))} ${anios(e)}`;
}

function htmlMemoria(p) {
  const titulo = '<h3 id="t-memoria">Field memory (NASA HLS)</h3>';
  if (!Array.isArray(p.memoria)) {
    return `<section class="memoria" aria-labelledby="t-memoria">${titulo}<p>Field memory: not run</p></section>`;
  }
  const celdas = p.memoria
    .map((m) => {
      const clave = MEMORIA[m.estado] ? m.estado : "sin_dato";
      const d = MEMORIA[clave];
      return (
        `<li class="celda" data-estado="${esc(clave)}" title="${esc(m.anio)}: ${esc(d.texto)}">` +
        `<span class="caja trama-${clave === "sin_dato" ? "puntos" : "ninguna"}" style="background-color: var(--mem-${clave}); color: ${esc(textoSobreVar(`mem-${clave}`))}; text-shadow: none;" aria-hidden="true">${esc(d.letra)}</span>` +
        `<span class="anio">${esc(m.anio)}</span><span class="solo-lector">: ${esc(d.texto)}</span></li>`
      );
    })
    .join("");
  const leyenda = Object.entries(MEMORIA)
    .map(
      ([k, d]) =>
        `<li data-estado="${esc(k)}">${muestra(`mem-${k}`, k === "sin_dato" ? "puntos" : "ninguna", d.letra)}` +
        `<span><strong>${esc(d.letra)}</strong> ${esc(d.texto)}</span></li>`,
    )
    .join("");
  return (
    `<section class="memoria" aria-labelledby="t-memoria">${titulo}` +
    `<ol class="franja" style="--n: ${p.memoria.length}" aria-label="Agricultural years, from oldest to newest">${celdas}</ol>` +
    `<ul class="leyenda-memoria" aria-label="Legend">${leyenda}</ul>` +
    '<p class="nota-fija">Rule-based reading of monthly greenness; not a crop census.</p>' +
    "</section>"
  );
}

function circulo(clave, tabla) {
  const k = clave in tabla ? clave : "gris";
  const s = tabla[k];
  // Símbolo en tinta o blanco, el de mayor contraste WCAG sobre el color del círculo (✓ verde: tinta).
  return `<span class="sem-circulo" style="background-color: var(--sem-${esc(k)}); color: ${esc(textoSobreVar(`sem-${k}`))}" aria-hidden="true">${esc(s.simbolo)}</span>`;
}

/**
 * Tarjeta de una opción. `relieve`: la línea de relieve de la parcela (igual en todas sus tarjetas); `p`: las
 * properties de la parcela (la aptitud de suelo y el riesgo de helada son de esa parcela y de su zona).
 * La opción que el motor completó con el diseño del equipo (origen_opcion = team_proposal) lleva su rótulo junto al
 * nombre. Los filtros se dibujan en actualizarFicha: dotacion_minima depende del deslizador.
 */
function htmlTarjeta(o, relieve = "", p = {}) {
  const esActual = o.id === "ACTUAL";
  const propuesta = o.origen_opcion === "team_proposal" && o.etiqueta_opcion
    ? `<span class="insignia-propuesta" data-parte="propuesta">${esc(o.etiqueta_opcion)}</span>`
    : "";
  return (
    `<article class="tarjeta" data-opcion="${esc(o.id)}">` +
    '<header class="tarjeta-cabeza">' +
    (esActual ? '<span class="insignia-actual">Current rotation</span>' : "") +
    `<h4>${esc(o.nombre)}</h4>${propuesta}</header>` +
    '<div class="renglon renglon-agua" data-parte="agua"></div>' +
    htmlSuelo(o, relieve, p) +
    htmlDinero(o) +
    htmlMeses(o) +
    htmlSiembra(o, p) +
    '<div data-parte="filtros"></div>' +
    '<p class="advertencia" data-parte="advertencia" role="alert" hidden></p>' +
    '<details class="porque" data-parte="porque"><summary>Why?</summary><dl data-parte="respuestas"></dl></details>' +
    "</article>"
  );
}

/**
 * Renglón Soil: días de suelo desnudo, leguminosa, plagas y salinidad de la opción; al final, la línea de
 * relieve de la parcela (pendiente, escurrimiento y depresiones, con el rótulo de escala de relieve.json).
 */
function htmlSuelo(o, relieve = "", p = {}) {
  const su = o.suelo ?? {};
  const sem = o.semaforo?.suelo ?? "gris";
  const origen = su.dias_desnudo_origen === "medido" ? "measured" : su.dias_desnudo_origen === "estimado" ? "estimated" : "";
  // Aptitud de esta opción para el suelo de la parcela (web/js/suelo.js): evidencia, no filtro.
  let aptitud = "";
  try {
    aptitud = htmlAptitud({ suelo: estado.suelo, idParcela: p.id, idOpcion: o.id, nombresCultivo: CULTIVOS, error: estado.sueloError });
  } catch (err) {
    console.error("ROOT: the soil fit could not be built", err);
  }
  return (
    `<div class="renglon renglon-suelo" data-semaforo="${esc(sem)}">${circulo(sem, SEMAFORO_OTROS)}<div>` +
    `<h5>Soil <span class="sem-texto">${esc(SEMAFORO_OTROS[sem]?.texto ?? "no data")}</span></h5>` +
    aptitud +
    (su.dias_desnudo != null
      ? `<p>Bare soil in the windy season<span class="ventana-desnudo">${esc(textoVentanaDesnudo())}</span>: <strong>${esc(fmtDato(su.dias_desnudo))} days</strong>${origen ? ` <span class="etiqueta-origen">${origen}</span>` : ""}</p>`
      : `<p>Bare soil in the windy season<span class="ventana-desnudo">${esc(textoVentanaDesnudo())}</span>: no data</p>`) +
    `<p>Legume (adds nitrogen): ${siNo(su.leguminosa)}</p>` +
    `<p>Breaks the pest cycle: ${siNo(su.ruptura_plagas)}</p>` +
    (su.riesgo_salinidad != null ? `<p>Salinity risk (regional): ${esc(su.riesgo_salinidad)}</p>` : "") +
    relieve +
    "</div></div>"
  );
}

function htmlDinero(o) {
  const sem = o.semaforo?.dinero ?? "gris";
  const d = o.dinero;
  const cuerpo =
    d && d.margen_min != null
      ? `<p>Margin: <strong>${esc(fmtRango(d.margen_min, d.margen_max))}</strong></p><p class="fuente">Source: ${esc(d.fuente ?? "no source")}</p>`
      : "<p><strong>No verified data</strong></p>";
  return (
    `<div class="renglon renglon-dinero" data-semaforo="${esc(sem)}">${circulo(sem, SEMAFORO_OTROS)}<div>` +
    `<h5>Money${d ? ` <span class="sem-texto">${esc(SEMAFORO_OTROS[sem]?.texto ?? "no data")}</span>` : ""}</h5>${cuerpo}</div></div>`
  );
}

function htmlMeses(o) {
  const meses = o.meses_cultivo;
  if (!Array.isArray(meses) || meses.length === 0) return "";
  const conCultivo = meses.map((v, i) => (v ? nombreMes(i, "short") : null)).filter(Boolean);
  const etiqueta = conCultivo.length ? `Months with a crop: ${conCultivo.join(", ")}; the other months are bare soil.` : "No crop in any month: bare soil all year.";
  const celdas = meses
    .map((v, i) => `<span class="mes"><span class="caja ${v ? "cultivo" : "desnudo"}"></span><span class="ini" aria-hidden="true">${esc(nombreMes(i, "narrow"))}</span></span>`)
    .join("");
  return (
    '<div class="meses">' +
    `<p class="meses-titulo">Crop calendar, ${esc(nombreMes(0, "long"))} to ${esc(nombreMes(meses.length - 1, "long"))}</p>` +
    `<div class="meses-fila" style="--n: ${meses.length}" role="img" aria-label="${esc(etiqueta)}">${celdas}</div>` +
    '<div class="meses-leyenda" aria-hidden="true"><span><i class="cultivo"></i>crop</span><span><i class="desnudo"></i>bare soil</span></div>' +
    "</div>"
  );
}

/** «MM-DD» de los datos como «Apr 1»; el texto tal cual si no tiene esa forma. */
function fmtMesDia(texto) {
  const m = /^(\d{2})-(\d{2})$/.exec(String(texto ?? ""));
  if (!m) return String(texto ?? "");
  return new Intl.DateTimeFormat(LOCALE, { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(0, Number(m[1]) - 1, Number(m[2]))));
}

/**
 * Ventana de siembra de cada cultivo de la opción (cubo.opciones_catalogo.<rotación>.secuencia, de la tabla oficial)
 * y, junto a la fecha, la probabilidad de helada después de esa siembra (web/js/contexto.js → riesgoDeHelada, con
 * heladas de la zona de la parcela). Sin ventana en los datos no se escribe nada; sin probabilidad (siembra fuera
 * de las fechas calculadas) va solo la ventana. No decide nada: el filtro de helada lo dice.
 */
function htmlSiembra(o, p = {}) {
  const cat = estado.cubo.opciones_catalogo?.[o.rotacion];
  const pasos = (Array.isArray(cat?.secuencia) ? cat.secuencia : []).filter((x) => x?.siembra?.desde);
  if (!pasos.length) return "";
  let fuente = null;
  const partes = pasos.map((x) => {
    const ventana = x.siembra.hasta ? `${fmtMesDia(x.siembra.desde)}–${fmtMesDia(x.siembra.hasta)}` : `from ${fmtMesDia(x.siembra.desde)}`;
    let riesgo = null;
    try {
      riesgo = riesgoDeHelada({ contexto: estado.contexto, fechaSiembra: x.siembra.desde, zonaId: zonaDe(p) });
    } catch (err) {
      console.error("ROOT: frost risk could not be read", err);
    }
    if (riesgo) fuente = riesgo.fuente;
    const helada = riesgo
      ? ` <span class="siembra-helada" data-helada="${esc(fmtPct(riesgo.prob))}">· chance of a frost after ${esc(fmtMesDia(riesgo.fecha))}: <strong>${esc(fmtPct(riesgo.prob))}</strong></span>`
      : "";
    return `<span class="siembra-cultivo">${esc(nombreCultivo(x.cultivo))}: ${esc(ventana)}</span>${helada}`;
  });
  return (
    '<p class="siembra no-imprimir" data-parte="siembra">Planting window (official table): ' +
    partes.join("; ") +
    (fuente ? ` <span class="fuente">(frost: ${esc(fuente)}; a regional grid cell, not a station)</span>` : "") +
    "</p>"
  );
}

/**
 * Estado de un filtro con la dotación elegida. dotacion_minima se evalúa EN VIVO: regla.lamina_minima_cm de
 * cubo.filtros_catalogo, convertida a millares/ha con la constante del cubo (dotaciones.lamina_cm_por_millar), contra
 * el deslizador: «passes» si la alcanza, «warning» si no. Sin esos datos el filtro queda como lo dejó el motor.
 */
function filtroConDotacion(f, D) {
  if (f?.tipo !== "dotacion_minima") return f;
  const cm = Number(estado.cubo.filtros_catalogo?.[f.id]?.regla?.lamina_minima_cm);
  const factor = Number(estado.cubo.dotaciones?.lamina_cm_por_millar?.valor);
  if (!(cm > 0) || !(factor > 0) || !Number.isFinite(D)) return f;
  const minimo = cm / factor;
  const pasa = D >= minimo;
  return { ...f, estado: pasa ? "passes" : "warning", pasa, razon: null, vivo: { minimo, D } };
}

// Filtros de la tabla oficial (B3) con tres estados (docs/decisiones/2026-11-14_opciones_b3.md): «passes»,
// «warning» y «needs_local_check». Un filtro sin decidir NUNCA se dibuja como aprobado.
const RAZON_FILTRO = {
  dato_local: "it needs field data the tool does not have",
  sin_umbral: "the source sets no threshold",
  sin_probabilidad: "no frost probability for this planting date",
  sin_evaluador: "the tool does not evaluate this rule yet",
};
function estadoDeFiltro(f) {
  if (f.estado) return f.estado;
  if (f.pasa === true) return "passes";
  if (f.pasa === false) return "warning";
  return "needs_local_check";
}
function htmlFiltros(o, D = estado.D) {
  const filtros = (Array.isArray(o.filtros) ? o.filtros : []).map((f) => filtroConDotacion(f, D));
  if (!filtros.length) return "";
  const marcas = {
    passes: ["si", "✓ Passes:"],
    warning: ["no", "⚠ Warning:"],
    needs_local_check: ["revisar", "? Needs a local check:"],
  };
  // Resumen para la hoja impresa: cuántos filtros piden revisión local, cuántos avisan y cuántos pasan.
  const cuenta = { needs_local_check: 0, warning: 0, passes: 0 };
  for (const f of filtros) cuenta[estadoDeFiltro(f)] = (cuenta[estadoDeFiltro(f)] ?? 0) + 1;
  const partes = [
    cuenta.needs_local_check ? `${fmtDato(cuenta.needs_local_check)} need a local check` : "",
    cuenta.warning ? `${fmtDato(cuenta.warning)} ${cuenta.warning === 1 ? "warning" : "warnings"}` : "",
    cuenta.passes ? `${fmtDato(cuenta.passes)} ${cuenta.passes === 1 ? "passes" : "pass"}` : "",
  ].filter(Boolean);
  const resumen = `<li class="filtros-resumen solo-impresion">Rules: ${partes.join(" · ")} (details online)</li>`;
  return (
    '<ul class="filtros" aria-label="Rules and filters">' +
    resumen +
    filtros
      .map((f) => {
        const e = estadoDeFiltro(f);
        const [clase, marca] = marcas[e] ?? marcas.needs_local_check;
        const razon = e === "needs_local_check" && RAZON_FILTRO[f.razon] ? `<span class="filtro-razon"> (${RAZON_FILTRO[f.razon]})</span>` : "";
        const helada = Number.isFinite(f.prob_helada)
          ? `<span class="filtro-helada"> Chance of frost after this planting date: ${fmtPct(f.prob_helada)}.</span>`
          : "";
        const etiqueta = f.etiqueta ? ` ${esc(f.etiqueta)}` : "";
        const vivo = f.vivo
          ? `<span class="filtro-vivo"> Your allocation, ${esc(fmt(f.vivo.D))} thousand m³/ha, ${f.pasa ? "reaches" : "is below"} the ${esc(fmtDato(f.vivo.minimo))} thousand m³/ha this rule asks for.</span>`
          : "";
        return (
          `<li class="${clase}" data-estado="${esc(e)}" data-filtro="${esc(f.id ?? "")}"${f.vivo ? ' data-vivo="si"' : ""}>${marca} <span class="filtro-texto">${esc(f.motivo ?? f.filtro)}</span>${razon}${helada}${vivo}` +
          `${f.fuente ? ` <span class="fuente">— ${esc(f.fuente)}${etiqueta}</span>` : ""}</li>`
        );
      })
      .join("") +
    "</ul>"
  );
}

function textoPlazo(plazo) {
  if (!plazo) return "Water term: no data";
  return `Commits water for ${fmtRango(plazo.min, plazo.max)} ${anios(plazo.max)}`;
}

/** Recalcula lo que depende del deslizador y de la lluvia, sin reconstruir la ficha. */
function actualizarFicha() {
  const f = estado.porId.get(estado.fichaId);
  if (!f) return;
  const p = f.properties;
  const { D, r } = estado;
  const ops = opcionesDe(p.id);
  const llave = llaveLluvia(r);
  const p90s = ops.map((o) => o.agua?.lamina_bruta?.[llave]?.p90).filter((v) => Number.isFinite(v));
  const escala = Math.max(Number(estado.cubo.dotaciones.deslizador.max), ...p90s);
  const pos = (v) => Math.max(0, Math.min(100, (v / escala) * 100));
  pintarResumen(p, ops);

  for (const o of ops) {
    const tarjeta = $(`.tarjeta[data-opcion="${CSS.escape(o.id)}"]`);
    if (!tarjeta) continue;
    const ev = evaluarOpcion(o, p.area_ha, D, r, Boolean(p.abstencion));
    const s = SEMAFORO[ev.semaforo];
    const L = ev.lamina;
    const comp = o.agua?.compromiso_millares_ha?.[llave];
    const rest = o.agua?.plazo_restante;
    tarjeta.dataset.semaforo = ev.semaforo;

    const lamina =
      L.p50 > 0
        ? `<p class="lamina"><strong>${esc(fmtDato(L.p50))}</strong> thousand m³/ha per year <span class="fuente">(median)</span></p>`
        : '<p class="lamina"><strong>No irrigation needed</strong></p>';
    const banda =
      L.p50 > 0
        ? `<div class="barra-banda" role="img" aria-label="Need: median ${esc(fmtDato(L.p50))}, likely range ${esc(fmtDato(L.p10))} to ${esc(fmtDato(L.p90))} thousand m³/ha per year; your allocation: ${esc(fmt(D))}">` +
          `<span class="banda" style="left: ${pos(L.p10)}%; width: ${pos(L.p90) - pos(L.p10)}%"></span>` +
          `<span class="mediana" style="left: ${pos(L.p50)}%"></span>` +
          `<span class="marca-d" style="left: ${pos(D)}%"></span></div>` +
          `<div class="leyenda-banda" aria-hidden="true"><span>likely range ${esc(fmtDato(L.p10))}–${esc(fmtDato(L.p90))}</span><span>┆ dashed line: your allocation (${esc(fmt(D))})</span></div>`
        : "";

    const alcanza =
      `<p class="alcanza"><strong>Enough for ${esc(fmt(ev.hectareas.p50))} of ${esc(fmtDato(p.area_ha))} hectares</strong> ` +
      `<span>(range ${esc(fmt(ev.hectareas.bajo))} to ${esc(fmt(ev.hectareas.alto))})</span></p>`;

    $('[data-parte="agua"]', tarjeta).innerHTML =
      `${circulo(ev.semaforo, SEMAFORO)}<div>` +
      `<h5>Water <span class="sem-texto">${esc(s.simbolo)} ${esc(s.texto)}</span></h5>` +
      lamina +
      alcanza +
      banda +
      htmlLaminaLocal(o, L, p.area_ha, D) +
      `<p>${esc(textoPlazo(o.agua?.plazo_anios))}${o.agua?.nota_plazo ? ` <span class="fuente">(${esc(o.agua.nota_plazo)})</span>` : ""}</p>` +
      (o.id === "ACTUAL" && rest ? `<p>Remaining term: ${esc(fmtRango(rest.min, rest.max))} ${anios(rest.max)}</p>` : "") +
      (comp ? `<p>Water committed over the remaining term: ${esc(fmtRango(comp.min, comp.max))} thousand m³/ha</p>` : "") +
      "</div>";

    // advertir_si_rojo (tabla oficial): con el semáforo de agua en rojo, recuerda por cuántos años obliga (el
    // plazo del dato); si la opción siembra alfalfa, lo dice de la alfalfa.
    const adv = $('[data-parte="advertencia"]', tarjeta);
    adv.hidden = !ev.advertencia;
    const plazo = o.agua?.plazo_anios;
    const cuanto = plazo ? `${fmtRango(plazo.min, plazo.max)} ${anios(plazo.max)}` : "several years";
    const quien = (o.secuencia ?? []).includes("alfalfa") ? "alfalfa commits water for" : "it would commit water for";
    adv.textContent = ev.advertencia
      ? `⚠ Warning: at this allocation this option does not get enough water, and ${quien} ${cuanto}.`
      : "";
    $('[data-parte="filtros"]', tarjeta).innerHTML = htmlFiltros(o, D);

    $('[data-parte="respuestas"]', tarjeta).innerHTML = htmlRespuestas(o, ev);
  }
  pintarCoberturaGota();
  if (estado.whatsapp) pintarWhatsApp(); // el mensaje dice cuántas hectáreas alcanzan con la dotación elegida
}

/**
 * Frase resumen arriba de la ficha (web/js/resumen.js): con agua (parcial o completa), lámina cero o abstenida.
 * Describe; no recomienda. Usa la opción ACTUAL y la misma evaluación de web/reglas.js que la tarjeta.
 */
function pintarResumen(p, ops) {
  const nodo = $("#ficha-resumen");
  if (!nodo) return;
  const actual = ops.find((o) => o.id === "ACTUAL") ?? null;
  let evaluacion = null;
  try {
    evaluacion = actual && !p.abstencion ? evaluarOpcion(actual, p.area_ha, estado.D, estado.r) : null;
  } catch (err) {
    console.error("ROOT: the summary could not be computed", err);
  }
  const datos = { parcela: p, opcionActual: actual, evaluacion, D: estado.D, formato: (v, k) => (k === "area" ? fmtDato(v) : fmt(v)) };
  const texto = fraseResumen(datos);
  if (nodo.textContent !== texto) nodo.textContent = texto;
  nodo.dataset.caso = casoResumen(datos);
}

/**
 * Segundo renglón de la necesidad: la lámina local de referencia (agua.lamina_local del cubo), convertida a
 * millares/ha en el motor con la constante del proyecto, y las hectáreas que alcanzan con la dotación del
 * deslizador (cobertura de web/reglas.js, la misma de la tarjeta). El semáforo sigue con la lámina del modelo.
 * Sin referencia (dos o más cultivos, alfalfa con corte de verano, cultivo sin dato): «no local reference».
 * Una opción que no pide agua no lleva este renglón.
 */
function htmlLaminaLocal(o, L, areaHa, D) {
  if (!(L?.p50 > 0)) return "";
  const ll = o.agua?.lamina_local;
  const t = ll ? LAMINA_LOCAL[ll.tipo] : null;
  if (!ll || !t) {
    return `<p class="lamina-local" data-tipo="ninguna"><span class="lamina-local-titulo">${esc(LAMINA_LOCAL.aplicada.titulo)}:</span> ${esc(TEXTO_SIN_REFERENCIA)}</p>`;
  }
  const periodo = ll.periodo ? `${ll.periodo.desde}–${ll.periodo.hasta} records; ` : "";
  const titulo = ll.tipo === "aplicada" ? `${t.titulo} (${periodo}measurement point not confirmed)` : t.titulo;
  const rango = ll.rango_millares_ha;
  const valor = Number.isFinite(ll.valor_millares_ha) ? ll.valor_millares_ha : null;
  if (valor == null && !(rango && Number.isFinite(rango.min) && Number.isFinite(rango.max))) {
    return `<p class="lamina-local" data-tipo="ninguna"><span class="lamina-local-titulo">${esc(t.titulo)}:</span> ${esc(TEXTO_SIN_REFERENCIA)}</p>`;
  }
  const lamina = valor != null ? fmtDato(valor) : fmtRango(rango.min, rango.max);
  const ha = valor != null
    ? fmt(areaHa * cobertura(D, valor))
    : fmtRango(areaHa * cobertura(D, rango.max), areaHa * cobertura(D, rango.min), fmt);
  return (
    `<div class="lamina-local" data-tipo="${esc(ll.tipo)}"><p><span class="lamina-local-titulo">${esc(titulo)}:</span> ` +
    `<strong>${esc(lamina)}</strong> thousand m³/ha · ` +
    `<span class="lamina-local-alcanza">enough for ${esc(ha)} of ${esc(fmtDato(areaHa))} hectares</span> ` +
    `<span class="lamina-local-limite">— ${esc(t.limite)}</span>${ll.etiqueta ? ` <span class="lamina-local-etiqueta">${esc(ll.etiqueta)}</span>` : ""}</p>` +
    `<details class="lamina-local-fuente"><summary>Source of the local reference</summary><p class="fuente">${textoEs(ll.fuente)}` +
    `${ll.nota ? ` ${esc(ll.nota)}` : ""}</p></details></div>` +
    // En papel, una línea corta (la hoja cabe en una carta): la misma cifra y sus hectáreas, rotulada como promedio del
    // distrito (o recomendación de INIFAP); el texto completo y la fuente se leen en la ficha en línea.
    `<p class="solo-impresion lamina-local-impresion">${esc(ll.tipo === "aplicada" ? "District avg." : "INIFAP rec.")}: ` +
    `<strong>${esc(lamina)}</strong> · ${esc(ha)} ha</p>`
  );
}

function htmlRespuestas(o, ev) {
  const bloque = estado.explicaciones?.explicaciones?.[o.preguntas_ref];
  if (!bloque?.textos) return "<dt>Explanation</dt><dd>Not available yet for this option.</dd>";
  const dinamicos = { d: estado.D, ha: ev.hectareas.p50, cobertura: ev.cobertura };
  const formatear = (v, k) => {
    if (k === "cobertura") return fmtPct(v);
    if (k === "ha" || k === "d") return fmt(v);
    return fmtDato(v);
  };
  return PREGUNTAS.map(([k, titulo]) => {
    const t = bloque.textos[k];
    const texto = t ? rellenarMarcadores(t, bloque.valores, dinamicos, formatear) : "Not available yet.";
    return `<dt>${esc(titulo)}</dt><dd>${esc(texto)}</dd>`;
  }).join("");
}

function htmlGlosario() {
  return (
    '<details class="glosario"><summary>Glossary</summary><dl>' +
    GLOSARIO.map(([t, d]) => `<dt><abbr title="${esc(d)}">${esc(t)}</abbr></dt><dd>${esc(d)}</dd>`).join("") +
    "</dl></details>"
  );
}

// ---------------------------------------------------------------------------
// La gota (kit X3.1 y X3.2). El diagrama, los controles del goteo, las cifras grandes, la frase fija y la
// tabla para lectores de pantalla los dibuja web/js/gota.js (Sankey con d3-sankey; plan B: barras).
// Aquí quedan el título, el selector de opción y la línea de cobertura, que depende del deslizador.
// ---------------------------------------------------------------------------
function htmlGota(ops, p = {}) {
  const conGota = ops.filter((o) => o.gota);
  if (!conGota.length) {
    const motivo = p.abstencion ? "Not available: this field is not classified." : "Not available for this field yet.";
    return `<section class="gota" id="seccion-gota" aria-labelledby="t-gota"><h3 id="t-gota" tabindex="-1">Follow the drop</h3><p>${motivo}</p></section>`;
  }
  return (
    '<section class="gota" id="seccion-gota" aria-labelledby="t-gota">' +
    '<h3 id="t-gota" tabindex="-1">Follow the drop</h3>' +
    "<p>Where this option's water goes each year, from La Boquilla to the crop and the aquifer (m³ for this field).</p>" +
    '<div class="gota-controles">' +
    `<label>Option <select id="gota-opcion">${conGota.map((o) => `<option value="${esc(o.id)}">${esc(o.nombre)}</option>`).join("")}</select></label>` +
    "</div>" +
    '<div class="gota-contenedor" id="gota-modulo"></div>' +
    '<p class="gota-nota" id="gota-cobertura" hidden></p>' +
    "</section>"
  );
}

function opcionGota() {
  return opcionesDe(estado.fichaId).find((o) => o.id === estado.gota.opcion && o.gota);
}

function conectarGota() {
  const sel = $("#gota-opcion");
  if (!sel) return;
  sel.value = estado.gota.opcion;
  sel.addEventListener("change", () => {
    estado.gota.opcion = sel.value;
    pintarGota();
    pintarCoberturaGota();
  });
}

/**
 * Dibuja La gota de la opción elegida. El goteo y el tope se conservan al cambiar de opción; si la opción
 * no trae los bloques de goteo (null en el cubo), el módulo vuelve al riego actual y muestra la nota.
 */
function pintarGota() {
  const cont = $("#gota-modulo");
  if (!cont || !estado.fichaId) return;
  estado.gotaApi = dibujarGota(cont, opcionGota() ?? null, {
    locale: LOCALE,
    // Eficiencias del goteo con su etiqueta y su fuente, y si el retorno sin tope es una cota superior (cubo.meta.goteo).
    metaGoteo: estado.cubo.meta?.goteo ?? null,
    goteo: estado.gota.goteo,
    tope: estado.gota.tope,
    alCambiar: (e) => {
      estado.gota.goteo = e.goteo;
      estado.gota.tope = e.tope;
    },
  });
}

/** Línea de cobertura de La gota: depende del deslizador. */
function pintarCoberturaGota() {
  const nodo = $("#gota-cobertura");
  const o = opcionGota();
  const f = estado.porId.get(estado.fichaId);
  if (!nodo || !o || !f) return;
  const ev = evaluarOpcion(o, f.properties.area_ha, estado.D, estado.r, Boolean(f.properties.abstencion));
  nodo.hidden = !(ev.cobertura < 1);
  nodo.textContent = "The allocation covers part of this need; the rest comes from wells or stays unmet.";
}

// ---------------------------------------------------------------------------
// Mensaje al agricultor y ficha imprimible (kit C4; web/js/mensaje.js). La maqueta de WhatsApp está en
// español y no se envía; la ficha imprimible es la misma página con css/imprimir.css.
// ---------------------------------------------------------------------------
function htmlCompartir() {
  return (
    '<section class="compartir no-imprimir" aria-labelledby="t-compartir">' +
    '<h3 id="t-compartir">Share with the farmer</h3>' +
    '<p class="ayuda">A preview of the message the farmer would read, in Spanish, and a one-page sheet to print. Nothing is sent or stored.</p>' +
    '<div class="compartir-botones">' +
    '<button type="button" class="boton-compartir" id="boton-whatsapp" aria-expanded="false" aria-controls="vista-whatsapp">Preview WhatsApp message</button>' +
    '<button type="button" class="boton-compartir" id="boton-imprimir">Print field sheet</button>' +
    "</div>" +
    '<p class="aviso-imprimir" id="aviso-imprimir" role="status" hidden></p>' +
    '<div class="vista-whatsapp" id="vista-whatsapp" hidden></div>' +
    "</section>"
  );
}

function conectarCompartir() {
  $("#boton-whatsapp")?.addEventListener("click", () => {
    estado.whatsapp = !estado.whatsapp;
    pintarWhatsApp();
    if (estado.whatsapp) $("#vista-whatsapp").scrollIntoView({ block: "nearest", behavior: reduceMovimiento() ? "auto" : "smooth" });
  });
  $("#boton-imprimir")?.addEventListener("click", () => {
    imprimir();
  });
}

/** Maqueta del mensaje con la dotación y la lluvia elegidas (las reglas son las de reglas.js). */
function pintarWhatsApp() {
  const vista = $("#vista-whatsapp");
  const boton = $("#boton-whatsapp");
  const f = estado.porId.get(estado.fichaId);
  if (!vista || !boton || !f) return;
  boton.setAttribute("aria-expanded", String(estado.whatsapp));
  vista.hidden = !estado.whatsapp;
  if (!estado.whatsapp) {
    vista.innerHTML = "";
    return;
  }
  try {
    vista.innerHTML = htmlWhatsApp(f.properties, opcionesDe(f.properties.id), {
      reglas,
      D: estado.D,
      r: estado.r,
      sinOpciones: estado.cubo.parcelas?.[f.properties.id]?.sin_opciones ?? null,
    });
  } catch (err) {
    console.warn("ROOT: WhatsApp preview not available", err);
    vista.innerHTML = "<p>The message preview is not available for this field.</p>";
  }
}

/** «Print field sheet»: manifest.json (las fuentes del pie) se lee aquí, la primera vez que se imprime. */
async function imprimir() {
  const f = estado.porId.get(estado.fichaId);
  if (!f) return;
  const aviso = $("#aviso-imprimir");
  if (aviso) {
    aviso.hidden = true;
    aviso.textContent = "";
  }
  try {
    const lectura = await cargarOpcional("data/manifest.json");
    await imprimirFicha({
      D: estado.D,
      r: estado.r,
      cubo: estado.cubo,
      manifiesto: datosDe(lectura),
      // manifest.json existe pero no se pudo leer: la hoja lo dice (no usa la lista de respaldo en silencio).
      errorManifiesto: lectura?.estado === "error" ? lectura.detalle : null,
      parcela: f.properties,
    });
  } catch (err) {
    console.error("ROOT: the field sheet could not be printed", err);
    // Se quitan los agregados de la hoja (los marca mensaje.js con data-impresion) y se avisa en pantalla.
    for (const n of $$("[data-impresion]")) n.remove();
    document.documentElement.classList.remove("imprimir-ficha");
    if (aviso) {
      aviso.textContent = `The field sheet could not be printed: ${err?.message ?? err}`;
      aviso.hidden = false;
    }
  }
}

// ---------------------------------------------------------------------------
// «About & Data» (kit C5; web/js/acerca.js), en un diálogo modal que se abre desde la barra de la marca.
// manifest.json y pruebas.json se leen la primera vez que se abre (carga perezosa).
// ---------------------------------------------------------------------------
function abrirAcerca() {
  const dlg = $("#acerca");
  if (!dlg.open) {
    estado.disparadorAcerca = document.activeElement;
    if (typeof dlg.showModal === "function") dlg.showModal();
    else dlg.setAttribute("open", "");
  }
  estado.acerca ??= Promise.all([
    cargarOpcional("data/manifest.json"),
    cargarOpcional("data/pruebas.json"),
    cargarRelieve(),
  ]).then(([lecturaManifest, lecturaPruebas, relieve]) => {
    const errores = {};
    if (lecturaManifest.estado !== "ok") errores.manifest = lecturaManifest;
    if (lecturaPruebas.estado !== "ok") errores.pruebas = lecturaPruebas;
    const montado = montarAcerca($("#acerca-cuerpo"), {
      manifest: datosDe(lecturaManifest),
      pruebas: datosDe(lecturaPruebas),
      cubo: estado.cubo,
      relieve,
      errores,
    });
    // Si algo no se pudo leer, la próxima apertura lo vuelve a intentar (no se guarda el error).
    if (errores.manifest?.estado === "error" || errores.pruebas?.estado === "error") estado.acerca = null;
    // «Challenge data sources» (web/js/contexto.js) en su hueco, después de los datos NASA: la tabla de recursos del reto
    // con sus tres estados, calculada de contexto.json (no escrita a mano).
    const hueco = montado?.elemento.querySelector('[data-bloque="recursos"]');
    if (hueco) {
      if (estado.lecturas.contexto) {
        hueco.innerHTML = `<p class="acerca-vacio">Challenge data sources: contexto.json could not be read (${esc(estado.lecturas.contexto)}).</p>`;
      } else {
        try {
          montarRecursosReto(hueco, { contexto: estado.contexto, nivel: 3 });
        } catch (err) {
          console.error("ROOT: the challenge data sources could not be built", err);
          hueco.innerHTML = '<p class="acerca-vacio">Challenge data sources could not be shown here.</p>';
        }
      }
    }
    // Título del diálogo: el encabezado principal de la sección (el primero con id).
    const titulo = montado?.elemento.querySelector(".acerca-titulo[id]");
    if (titulo) {
      dlg.setAttribute("aria-labelledby", titulo.id);
      dlg.removeAttribute("aria-label");
    }
    document.body.dataset.acerca = "listo";
    return montado;
  }).catch((err) => {
    console.warn("ROOT: About & Data could not be built", err);
    $("#acerca-cuerpo").innerHTML = '<p class="ayuda">The data sources and test results could not be shown here.</p>';
    estado.acerca = null; // se reintenta la próxima vez que se abra
    return null;
  });
  return estado.acerca;
}

function cerrarAcerca() {
  const dlg = $("#acerca");
  if (typeof dlg.close === "function") dlg.close();
  else {
    dlg.removeAttribute("open");
    alCerrarAcerca();
  }
}

/** Al cerrar (botón, Escape o clic fuera), el foco vuelve a donde estaba. */
function alCerrarAcerca() {
  const volver = estado.disparadorAcerca;
  estado.disparadorAcerca = null;
  if (volver && document.contains(volver) && typeof volver.focus === "function") volver.focus();
}

/** «How it works»: vuelve a mostrar la pantalla de inicio aunque ya se haya cerrado en esta sesión. */
function abrirInicio() {
  try {
    window.sessionStorage.removeItem(LLAVE_INICIO);
  } catch {
    // sin almacenamiento de sesión: montarInicio la muestra igual
  }
  montarInicio(document.body);
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------
function parcelaParaGota() {
  const fs = estado.visibles;
  const perenne = (p) => p.estado_plazo === "comprometida" || p.estado_plazo === "por_vencer";
  const f = fs.find((x) => x.properties.protagonista && perenne(x.properties)) ?? fs.find((x) => perenne(x.properties)) ?? fs[0];
  return f?.properties.id;
}

function conectarEventos() {
  $("#dotacion").addEventListener("input", actualizarTodo);
  $("#lluvia").addEventListener("change", actualizarTodo);

  for (const radio of $$('input[name="colorear"]')) {
    radio.addEventListener("change", () => {
      if (!radio.checked) return;
      estado.colorear = radio.value;
      // Elegir cómo colorear devuelve la línea de tiempo al año actual (la vista normal).
      if (estado.anioTiempo != null && estado.anioNormal != null) estado.linea?.fijarAnio(estado.anioNormal);
      pintarColoreado();
    });
  }

  $("#lista-parcelas").addEventListener("click", (e) => {
    const b = e.target.closest(".boton-parcela");
    if (b) abrirFicha(b.dataset.id);
  });
  $("#buscar-parcela").addEventListener("input", (e) => {
    lista.filtro = e.target.value;
    filtrarLista();
  });

  $("#indicador-mensaje").addEventListener("click", (e) => {
    if (!e.target.closest("#enlace-gota")) return;
    const id = parcelaParaGota();
    if (id) abrirFicha(id, { seccion: "gota" });
  });

  $("#zona-sel").addEventListener("change", (e) => cambiarZona(e.target.value));
  $("#lista-localidades").addEventListener("click", (e) => {
    const b = e.target.closest(".boton-localidad");
    if (b) mostrarLocalidad(Number(b.dataset.localidad));
  });

  $("#ficha-cerrar").addEventListener("click", () => cerrarFicha());
  document.addEventListener("keydown", (e) => {
    // Con «About & Data» abierto, Escape cierra solo el diálogo (lo hace el navegador), no la ficha.
    if (e.key === "Escape" && estado.fichaId && !$("#acerca").open) cerrarFicha();
  });

  // «Simulate a storm» (relieve.js ya mostró la tarjeta): en escritorio, la tarjeta de la tormenta entra a la
  // vista del panel; en teléfono el panel queda debajo del mapa, así que se lleva el mapa a la vista.
  $("#capa-relieve").addEventListener("click", (e) => {
    if (!e.target.closest(".relieve-boton-tormenta")) return;
    const comportamiento = reduceMovimiento() ? "auto" : "smooth";
    if (esAncho()) $("#capa-relieve .relieve-tormenta:not([hidden])")?.scrollIntoView({ block: "nearest", behavior: comportamiento });
    else $("#mapa").scrollIntoView({ block: "center", behavior: comportamiento });
  });

  // Barra de la marca: pantalla de inicio y «About & Data».
  $("#boton-inicio").addEventListener("click", abrirInicio);
  $("#boton-acerca").addEventListener("click", () => {
    abrirAcerca();
  });
  $("#acerca-cerrar").addEventListener("click", cerrarAcerca);
  $("#acerca").addEventListener("close", alCerrarAcerca);
  $("#acerca").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) cerrarAcerca(); // clic en el fondo, fuera del contenido
  });
}

/**
 * Espera a que el mapa termine lo pendiente: el repintado programado (setData) y el teselado de la
 * fuente de las parcelas. No se usa el evento «idle»: sin red, una tesela fallida del mapa base
 * puede dejarlo sin dispararse nunca. Se revisa cuadro a cuadro, con un límite de unos segundos.
 */
function esperarMapa() {
  return new Promise((ok) => {
    if (!estado.mapaListo) {
      ok(false);
      return;
    }
    let cuadros = 0;
    const revisar = () => {
      cuadros += 1;
      // Dos cuadros como mínimo: el repintado programado con requestAnimationFrame ya llamó a setData.
      // También: la cámara quieta (encuadre de una zona) y la fuente de las localidades, si existe.
      const mapa = estado.mapa;
      const lista = (id) => !mapa.getSource(id) || mapa.isSourceLoaded(id);
      const fuentes = mapa.isSourceLoaded("parcelas") && lista("localidades") && lista("relieve-rutas");
      if (cuadros > 2 && !estado.pintadoPendiente && !mapa.isMoving() && fuentes) ok(true);
      else if (cuadros > 600) ok(false);
      else requestAnimationFrame(revisar);
    };
    requestAnimationFrame(revisar);
  });
}

// Ganchos mínimos para la prueba de humo (tests/e2e/web_smoke.mjs): solo leen; no cambian el comportamiento.
window.raizDepuracion = {
  esperarMapa,
  /** Estado de la capa de relieve (web/js/relieve.js); null si aún no se agrega. */
  relieve() {
    return estado.relieve?.estado() ?? null;
  },
  /** Visibilidad de la capa de rutas en MapLibre y cuántas rutas se dibujan en la vista actual. */
  async rutasRelieve() {
    const capa = "relieve-rutas-linea";
    if (!(await esperarMapa()) || !estado.mapa.getLayer(capa)) return { visibilidad: null, dibujadas: 0 };
    return {
      visibilidad: estado.mapa.getLayoutProperty(capa, "visibility") ?? "visible",
      dibujadas: estado.mapa.queryRenderedFeatures({ layers: [capa] }).length,
    };
  },
  /** Vista 3D del gemelo: estado, cámara, terreno, capas y fuentes propias (prefijo «gemelo-»), y el último cálculo. */
  gemelo3d() {
    const mapa = estado.mapa;
    const vista = estado.vista3d;
    if (!mapa || !vista) return null;
    const d = vista.depuracion;
    const estilo = mapa.getStyle();
    return {
      activo: vista.activo(),
      disponible: vista.disponible(zonaGemelo()),
      zona: zonaGemelo(),
      pitch: mapa.getPitch(),
      bearing: mapa.getBearing(),
      minZoom: mapa.getMinZoom(),
      terreno: mapa.getTerrain() ?? null,
      capas: (mapa.getLayersOrder?.() ?? []).filter((id) => id.startsWith("gemelo-")),
      fuentes: Object.keys(estilo?.sources ?? {}).filter((id) => id.startsWith("gemelo-")),
      montado: d.montado,
      version: d.version,
      exageracion: d.exageracion,
      teselasFallidas: d.teselasFallidas.length,
      relieveCargado: mapa.getSource("gemelo-dem") ? mapa.isSourceLoaded("gemelo-dem") : false,
      cuenta: d.cuenta,
      columnas: d.columnas?.features.map((f) => f.properties) ?? null,
      planas: d.planas?.features.map((f) => f.properties) ?? null,
    };
  },
  /**
   * Un punto de la página sobre una columna de la vista 3D: el más cercano al centro del mapa cuyo entorno cae en
   * la misma columna (lejos de sus bordes) y que no tapa otro elemento. null si no hay ninguno.
   */
  puntoDeColumna() {
    const mapa = estado.mapa;
    const vista = estado.vista3d;
    if (!mapa || !vista?.activo()) return null;
    const lienzo = mapa.getCanvas();
    const caja = lienzo.getBoundingClientRect();
    const paso = 10;
    const borde = 3;
    let mejor = null;
    for (let y = paso; y < caja.height - paso; y += paso) {
      for (let x = paso; x < caja.width - paso; x += paso) {
        const id = vista.columnaEn([x, y]);
        if (id == null) continue;
        if ([[borde, 0], [-borde, 0], [0, borde], [0, -borde]].some(([dx, dy]) => vista.columnaEn([x + dx, y + dy]) !== id)) continue;
        if (document.elementFromPoint(caja.left + x, caja.top + y) !== lienzo) continue;
        const d = Math.hypot(x - caja.width / 2, y - caja.height / 2);
        if (!mejor || d < mejor.d) mejor = { x: caja.left + x, y: caja.top + y, id, d };
      }
    }
    return mejor && { x: mejor.x, y: mejor.y, id: mejor.id };
  },
  /** Elevación del relieve (m, con la exageración) en las esquinas y el centro de los límites de la zona 3D. */
  elevacionesDeZona() {
    const mapa = estado.mapa;
    const b = estado.gemelo?.terreno?.zonas?.[zonaGemelo()]?.bounds;
    if (!mapa || !Array.isArray(b) || !mapa.getTerrain()) return [];
    const [o, s, e, n] = b.map(Number);
    return [[o, s], [o, n], [e, s], [e, n], [(o + e) / 2, (s + n) / 2]].map((c) => mapa.queryTerrainElevation(c));
  },
  /**
   * El mapa de MapLibre, SOLO para la prueba de identidad de las columnas (tests/e2e/web_smoke.mjs): la prueba pinta
   * cada columna con un código para saber cuál se ve en cada píxel y después deja el mapa como estaba.
   */
  get mapa() {
    return estado.mapa;
  },
  /** Columna que la vista 3D ve en un punto de la página (coordenadas de la ventana); null si no hay. */
  columnaEn(x, y) {
    if (!estado.mapa || !estado.vista3d?.activo()) return null;
    const caja = estado.mapa.getCanvas().getBoundingClientRect();
    return estado.vista3d.columnaEn([x - caja.left, y - caja.top]);
  },
  /** Espera a que la cámara se quede quieta y el mapa termine de cargar (relieve incluido); con límite. */
  esperarQuieto(ms = 20000) {
    const mapa = estado.mapa;
    if (!mapa) return Promise.resolve(false);
    const t0 = performance.now();
    return new Promise((ok) => {
      const revisar = () => {
        const quieto = mapa.loaded() && !mapa.isMoving();
        if (quieto || performance.now() - t0 > ms) requestAnimationFrame(() => requestAnimationFrame(() => ok(quieto)));
        else setTimeout(revisar, 80);
      };
      setTimeout(revisar, 120);
    });
  },
  /** Estado de La gota en la ficha abierta (web/js/gota.js). */
  gota() {
    return estado.gotaApi?.estado() ?? null;
  },
  /** Nombres de las localidades del equipo dibujadas en la vista actual del mapa. */
  async localidadesDibujadas() {
    if (!(await esperarMapa()) || !estado.mapa.getLayer("localidades-punto")) return [];
    return [...new Set(estado.mapa.queryRenderedFeatures({ layers: ["localidades-punto"] }).map((f) => f.properties.nombre))];
  },
  /** Número de parcelas distintas dibujadas en la vista actual del mapa. */
  async parcelasDibujadas() {
    if (!(await esperarMapa())) return 0;
    const ids = estado.mapa.queryRenderedFeatures({ layers: ["parcelas-relleno"] }).map((f) => f.properties.id);
    return new Set(ids).size;
  },
  /**
   * Un píxel de la pantalla que cae DENTRO del polígono dibujado de la parcela y que no tapa otro
   * elemento (marcador, indicador). El centro de la caja no sirve: las parcelas reales son
   * irregulares y cóncavas, y el centro puede quedar fuera. Se prueba una rejilla sobre la caja y
   * se elige el punto válido más cercano al centro. null si la parcela no se ve.
   */
  async pixelDeParcela(id) {
    const f = estado.porId.get(id);
    if (!f || !(await esperarMapa())) return null;
    const mapa = estado.mapa;
    const lienzo = mapa.getCanvas();
    const caja = lienzo.getBoundingClientRect();
    const ext = extension({ features: [f] });
    const a = mapa.project(ext[0]);
    const b = mapa.project(ext[1]);
    const x0 = Math.min(a.x, b.x), x1 = Math.max(a.x, b.x);
    const y0 = Math.min(a.y, b.y), y1 = Math.max(a.y, b.y);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const pasos = 12;
    let mejor = null;
    for (let i = 0; i <= pasos; i++) {
      for (let j = 0; j <= pasos; j++) {
        const x = x0 + ((x1 - x0) * i) / pasos;
        const y = y0 + ((y1 - y0) * j) / pasos;
        const enMapa = mapa.queryRenderedFeatures([x, y], { layers: ["parcelas-relleno"] });
        if (enMapa[0]?.properties?.id !== id) continue;
        if (document.elementFromPoint(caja.left + x, caja.top + y) !== lienzo) continue;
        const d = Math.hypot(x - cx, y - cy);
        if (!mejor || d < mejor.d) mejor = { x: caja.left + x, y: caja.top + y, d };
      }
    }
    return mejor && { x: mejor.x, y: mejor.y };
  },
};

// Cualquier error del arranque (no solo de la lectura de datos) se dice en la página.
iniciar().catch((err) => mostrarErrorCarga(`The page could not start: ${err?.message ?? err}`, err));
