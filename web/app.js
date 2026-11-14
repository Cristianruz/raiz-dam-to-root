// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
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
// - acerca.js: pantalla de inicio de tres pasos y sección «About & Data» (kit C5). manifest.json y
//   pruebas.json se leen solo al abrir «About & Data» o al imprimir (carga perezosa).

import * as reglas from "./reglas.js";
import {
  llaveLluvia,
  aguaComprometida,
  evaluarOpcion,
  conteosZona,
  rellenarMarcadores,
} from "./reglas.js";
import { agregarCapaRelieve, htmlRelieveParcela, cargarRelieve } from "./js/relieve.js";
import { dibujarGota } from "./js/gota.js";
import { htmlWhatsApp, imprimirFicha } from "./js/mensaje.js";
import { montarInicio, montarAcerca, LLAVE_INICIO } from "./js/acerca.js";

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
};

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
  perenne: { texto: "Perennial", letra: "P", trama: "ninguna", claro: false },
  verano: { texto: "Summer crop", letra: "S", trama: "horizontal", claro: true },
  invierno: { texto: "Winter crop", letra: "W", trama: "vertical", claro: true },
  doble: { texto: "Double crop", letra: "D", trama: "cruz", claro: false },
  descanso: { texto: "Rest", letra: "R", trama: "diagonal", claro: true },
  sin_dato: { texto: "No data", letra: "?", trama: "puntos", claro: true },
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
const TRAMAS_CULTIVO = ["ninguna", "diagonal", "horizontal", "vertical", "cruz"];

const PREGUNTAS = [
  ["por_que", "Why it's suggested"],
  ["evidencia", "Evidence"],
  ["beneficios", "Benefits"],
  ["que_no_sabemos", "What we don't know"],
  ["riesgos", "Risks needing local review"],
];

const GLOSARIO = [
  ["ET", "Evapotranspiration: the water the crop transpires plus what evaporates from the soil. It is the water actually consumed."],
  ["NDVI (“greenness”)", "A satellite index of how green a field is. Raíz reads it from NASA HLS images."],
  ["Bare soil", "Days with almost no green cover. Bare soil in the windy season (Feb–Apr) can blow away."],
  ["Frost risk", "Chance of a freezing night in the planting window, from NASA POWER temperatures."],
  ["Water balance", "Every cubic metre that leaves the dam ends up as crop consumption, aquifer recharge or other losses."],
  ["Consumption cap", "A rule that drip irrigation may not raise the crop's water consumption (ET) above its historical level."],
  ["Millar", "The unit used in the district: a thousand m³ of water per hectare. See the equivalence under the slider."],
  ["Water term", "How many years a crop ties up water: one season for annual crops, several years for alfalfa, a long horizon for orchards."],
];

const AVISO_JUICIO = "This tool supports, never replaces, the judgment of farmers and local experts.";

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

/** Tinta legible sobre un color de fondo (luminancia relativa aproximada); se guarda por color. */
const tintaCache = new Map();
function textoSobre(color) {
  if (tintaCache.has(color)) return tintaCache.get(color);
  const c = window.d3?.color?.(color)?.rgb?.();
  let tinta = colorCSS("tinta");
  if (c) {
    const luz = (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
    tinta = luz > 0.55 ? colorCSS("tinta") : colorCSS("blanco");
  }
  tintaCache.set(color, tinta);
  return tinta;
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

/** Archivo opcional (manifest.json, pruebas.json): se pide una sola vez y solo cuando hace falta; null si falta. */
const opcionales = new Map();
function cargarOpcional(ruta) {
  if (!opcionales.has(ruta)) {
    opcionales.set(
      ruta,
      fetch(ruta)
        .then((resp) => (resp.ok ? resp.json() : null))
        .catch(() => null),
    );
  }
  return opcionales.get(ruta);
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
async function iniciar() {
  observarCabecera();
  try {
    // relieve.json es opcional: cargarRelieve nunca falla (null si no existe) y la ficha toma de ahí el
    // rótulo de escala de la línea de relieve aunque se abra antes que el mapa.
    const [cubo, parcelas, explicaciones, relieve] = await Promise.all([
      cargarJSON("data/cubo.json"),
      cargarJSON("data/parcelas.geojson"),
      cargarJSON("data/explicaciones.json"),
      cargarRelieve(),
    ]);
    estado.cubo = cubo;
    estado.parcelas = parcelas;
    estado.explicaciones = explicaciones;
    estado.relieveDatos = relieve;
  } catch (err) {
    console.error(err);
    const aviso = document.createElement("p");
    aviso.className = "error-carga";
    aviso.textContent = `The data files could not be loaded: ${err.message}`;
    $("#principal").prepend(aviso);
    return;
  }

  for (const f of estado.parcelas.features) estado.porId.set(f.properties.id, f);

  iniciarZonas();
  mostrarAvisoSimulado();
  iniciarControles();
  iniciarColoreado();
  pintarDistrito();
  pintarPie();
  conectarEventos();
  actualizarTodo();
  fijarMedidas(); // la cabecera ya tiene su alto final: el mapa se encuadra con él
  crearMapa();
  if (!estado.mapa) iniciarRelieve(null); // sin mapa, el bloque lo dice; con mapa, se agrega en «load»
  pintarLocalidades(); // después del mapa: sin mapa, la lista queda solo en texto
  document.body.dataset.listo = "si";
  // Pantalla de inicio de tres pasos (kit C5): una vez por sesión; «How it works» la vuelve a abrir.
  montarInicio(document.body);
}

/**
 * Medidas que usa style.css: --alto-cabecera (marca + controles; alto del área del mapa en escritorio)
 * y --tope-ficha (borde inferior de los controles fijos en pantalla; la ficha empieza ahí).
 */
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
  window.addEventListener("resize", fijarMedidas);
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

/** El selector aparece solo con más de una zona; con una (o sin cubo.zonas) la página queda como antes. */
function iniciarZonas() {
  estado.zonasIds = idsZonas();
  const varias = estado.zonasIds.length > 1;
  $("#selector-zona").hidden = !varias;
  if (varias) {
    const sel = $("#zona-sel");
    sel.innerHTML =
      '<option value="">All areas</option>' +
      estado.zonasIds.map((id) => `<option value="${esc(id)}">${esc(nombreZona(id))}</option>`).join("");
    sel.value = "";
  }
  estado.zonaSel = null;
  fijarVisibles();
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

  $("#equivalencia").textContent = equivalencia ?? "not available";
  $("#punto-medicion").textContent = punto_medicion ?? "not available";
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
    `Source: ${esc(m.fuente ?? "not available")}`,
    m.etiqueta ? `Label: ${esc(m.etiqueta)}` : "",
    m.fecha_consulta ? `Accessed: ${esc(fmtFecha(m.fecha_consulta))}` : "",
    m.nota ? `Note: ${esc(m.nota)}` : "",
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
  const conteos = conteosZona(estado.visibles, estado.cubo, estado.D, estado.r);
  actualizarIndicador(conteos);
  actualizarConteos(conteos);
  pintarColoreado();
  if (estado.fichaId) actualizarFicha();
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
    "fields don't have enough water for their current rotation.";
}

function itemConteo(simbolo, colorVar, texto, n) {
  return (
    `<li><span class="sem-circulo" style="background-color: var(--${colorVar})" aria-hidden="true">${esc(simbolo)}</span>` +
    `<span>${esc(texto)}</span><span class="n">${esc(fmt(n, 0))}</span></li>`
  );
}

function actualizarConteos(c) {
  $("#conteos-semaforo").innerHTML = Object.entries(SEMAFORO)
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
  const modo = estado.colorear;
  if (modo === "semaforo") return esquemaSemaforo();
  if (modo === "plazo") return esquemaPlazo();
  return estado.capas.get(modo) ?? esquemaSemaforo();
}

function semaforoActual(p) {
  const actual = opcionesDe(p.id).find((o) => o.id === "ACTUAL");
  if (p.abstencion || !actual) return "gris";
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
    clases: claves.map((k, i) => ({
      clave: k,
      colorVar: `cul-${k}`,
      texto: CULTIVOS[k],
      simbolo: "",
      trama: k === "sin_clasificar" ? "puntos" : TRAMAS_CULTIVO[i % TRAMAS_CULTIVO.length],
    })),
    fuente: "Crop map of the current season from NASA HLS; “Not classified” when the model is unsure.",
    clase: (p) => (p.abstencion ? "sin_clasificar" : (p.cultivo_actual ?? "sin_clasificar")),
  };
}

function capaSueloDesnudo() {
  return {
    titulo: "Bare soil in the windy season",
    continua: true,
    unidad: "days",
    fuente: "NASA HLS: days with very low greenness from February to April; median of the years with data (current season if missing).",
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

function muestra(colorVar, trama, contenido = "", colorDirecto = null) {
  const fondo = colorDirecto ? esc(colorDirecto) : `var(--${colorVar})`;
  return `<span class="muestra trama-${trama}" style="background-color: ${fondo}" aria-hidden="true">${esc(contenido)}</span>`;
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
    const clases = esq.soloPresentes ? esq.clases.filter((c) => presentes.has(c.clave) || c.clave === "sin_clasificar") : esq.clases;
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
  cont.innerHTML = cuerpo + `<p class="fuente">Source: ${esc(esq.fuente)}</p>`;
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
  const tipos = ["ninguna", "diagonal", "cruz", "puntos", "horizontal", "vertical"];
  for (const tipo of tipos) {
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
    console.warn("Raíz: map not available", err);
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
    mapa.fitBounds(estado.encuadre, { padding: margenMapa(estado.encuadre), maxZoom: 17, duration: 0 });
  });

  // Teselas del mapa base que no cargan: aviso discreto, las parcelas siguen sobre fondo sólido.
  mapa.on("error", (ev) => {
    if (ev?.sourceId === "osm" || ev?.source?.id === "osm" || ev?.tile) {
      if (!estado.avisoTeselas) {
        estado.avisoTeselas = true;
        avisoMapa("Base map tiles are unavailable: fields are drawn on a plain background.");
      }
      return;
    }
    console.warn("Raíz: map warning", ev?.error?.message ?? ev);
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
    mapa.on("click", "parcelas-relleno", (e) => {
      const id = e.features?.[0]?.properties?.id;
      if (id) abrirFicha(id);
    });
    mapa.on("mouseenter", "parcelas-relleno", () => { mapa.getCanvas().style.cursor = "pointer"; });
    mapa.on("mouseleave", "parcelas-relleno", () => { mapa.getCanvas().style.cursor = ""; });
    crearMarcadores();
    agregarLocalidades(mapa);
    iniciarRelieve(mapa); // rutas de escurrimiento debajo de los puntos de las localidades
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

/** Encuadra la zona elegida (al cambiar de zona). */
function encuadrar() {
  const ext = estado.encuadre;
  if (!estado.mapa || !ext) return;
  estado.movidoPorUsuario = false;
  estado.mapa.fitBounds(ext, { padding: margenMapa(ext), maxZoom: 17, duration: reduceMovimiento() ? 0 : 600 });
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
  $("#localidades-fuente").textContent = `Source: ${fuentes.length ? fuentes.join("; ") : "not available"}`;
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
    console.warn("Raíz: terrain layer not available", err);
  }
  estado.relieve = ctl;
  // La zona pudo cambiar mientras se leían los archivos.
  if (ctl && ctl.estado().zona !== estado.zonaSel) ctl.fijarZona(estado.zonaSel);
  document.body.dataset.relieve = ctl?.disponible ? "listo" : "no-corrido";
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
      `<p class="fuente">Storage: ${esc(b.fuente_almacenamiento ?? "no source")}. Capacity: ${esc(b.fuente_namo ?? "no source")}.</p>`;
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
      `<p class="fuente">Source: ${esc(a.fuente ?? "no source")}</p>`;
  } else {
    $("#acuifero").innerHTML = "<p>No data.</p>";
  }
}

function pintarPie() {
  const meta = estado.cubo.meta ?? {};
  const partes = [];
  if (Array.isArray(meta.fuentes) && meta.fuentes.length) partes.push(`Data files: ${meta.fuentes.join(", ")}`);
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
  const ficha = $("#ficha");
  ficha.hidden = false;
  ficha.scrollTop = 0;
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
  estado.whatsapp = false;
  $("#ficha").hidden = true;
  $("#ficha-cuerpo").innerHTML = "";
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
  $("#ficha-titulo").textContent = `Field ${p.id}`;
  // Parcela abstenida: sin tarjetas; la memoria sí se muestra (kit C2.1 y C2.2). Sin tarjetas tampoco hay
  // renglón Soil: la línea de relieve (contexto de la zona) va debajo de la nota.
  const relieve = htmlRelieveParcela(p, { relieve: estado.relieveDatos });
  const sinOpciones =
    (p.abstencion
      ? '<p class="nota-abstenida">The crop map is not sure what grows here, so no options are computed. ' +
        "Check the current crop with a technician; the field memory above still shows its history.</p>"
      : "<p>No options computed for this field yet.</p>") + relieve;
  $("#ficha-cuerpo").innerHTML = [
    htmlEncabezado(p),
    // En papel la línea de relieve va una sola vez, aquí (style.css la oculta en las tarjetas al imprimir).
    ops.length && relieve ? `<div class="solo-impresion relieve-impresion">${relieve}</div>` : "",
    htmlMemoria(p),
    `<section aria-labelledby="t-opciones"><h3 id="t-opciones">Current rotation and alternatives</h3>` +
      (ops.length ? `<div class="tarjetas">${ops.map((o) => htmlTarjeta(o, relieve)).join("")}</div>` : sinOpciones) +
      "</section>",
    htmlGota(ops, p),
    htmlCompartir(),
    `<p class="aviso-juicio">${esc(AVISO_JUICIO)}</p>`,
    htmlGlosario(),
  ].join("");
  conectarGota();
  conectarCompartir();
  actualizarFicha();
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
        `<span class="caja trama-${clave === "sin_dato" ? "puntos" : "ninguna"}" style="background-color: var(--mem-${clave});${d.claro ? " color: var(--tinta); text-shadow: none;" : ""}" aria-hidden="true">${esc(d.letra)}</span>` +
        `<span class="anio">${esc(m.anio)}</span><span class="solo-lector">: ${esc(d.texto)}</span></li>`
      );
    })
    .join("");
  const leyenda = Object.entries(MEMORIA)
    .map(
      ([k, d]) =>
        `<li data-estado="${esc(k)}"><span class="muestra trama-${k === "sin_dato" ? "puntos" : "ninguna"}" style="background-color: var(--mem-${k})" aria-hidden="true">${esc(d.letra)}</span>` +
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
  const s = tabla[clave] ?? tabla.gris;
  const claro = clave === "ambar" || clave === "gris";
  return `<span class="sem-circulo${claro ? " claro" : ""}" style="background-color: var(--sem-${esc(clave in tabla ? clave : "gris")})" aria-hidden="true">${esc(s.simbolo)}</span>`;
}

/** Tarjeta de una opción. `relieve`: la línea de relieve de la parcela (igual en todas sus tarjetas). */
function htmlTarjeta(o, relieve = "") {
  const esActual = o.id === "ACTUAL";
  return (
    `<article class="tarjeta" data-opcion="${esc(o.id)}">` +
    '<header class="tarjeta-cabeza">' +
    (esActual ? '<span class="insignia-actual">Current rotation</span>' : "") +
    `<h4>${esc(o.nombre)}</h4></header>` +
    '<div class="renglon renglon-agua" data-parte="agua"></div>' +
    htmlSuelo(o, relieve) +
    htmlDinero(o) +
    htmlMeses(o) +
    htmlFiltros(o) +
    '<p class="advertencia" data-parte="advertencia" role="alert" hidden></p>' +
    '<details class="porque" data-parte="porque"><summary>Why?</summary><dl data-parte="respuestas"></dl></details>' +
    "</article>"
  );
}

/**
 * Renglón Soil: días de suelo desnudo, leguminosa, plagas y salinidad de la opción; al final, la línea de
 * relieve de la parcela (pendiente, escurrimiento y depresiones, con el rótulo de escala de relieve.json).
 */
function htmlSuelo(o, relieve = "") {
  const su = o.suelo ?? {};
  const sem = o.semaforo?.suelo ?? "gris";
  const origen = su.dias_desnudo_origen === "medido" ? "measured" : su.dias_desnudo_origen === "estimado" ? "estimated" : "";
  return (
    `<div class="renglon renglon-suelo" data-semaforo="${esc(sem)}">${circulo(sem, SEMAFORO_OTROS)}<div>` +
    `<h5>Soil <span class="sem-texto">${esc(SEMAFORO_OTROS[sem]?.texto ?? "no data")}</span></h5>` +
    (su.dias_desnudo != null
      ? `<p>Bare soil in the windy season: <strong>${esc(fmtDato(su.dias_desnudo))} days</strong>${origen ? ` <span class="etiqueta-origen">${origen}</span>` : ""}</p>`
      : "<p>Bare soil in the windy season: no data</p>") +
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

function htmlFiltros(o) {
  const filtros = Array.isArray(o.filtros) ? o.filtros : [];
  if (!filtros.length) return "";
  return (
    '<ul class="filtros" aria-label="Rules and filters">' +
    filtros
      .map(
        (f) =>
          `<li class="${f.pasa === false ? "no" : "si"}">${f.pasa === false ? "✕ Does not pass:" : "✓"} ${esc(f.motivo ?? f.filtro)}` +
          `${f.fuente ? ` <span class="fuente">— ${esc(f.fuente)}</span>` : ""}</li>`,
      )
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
      `<p>${esc(textoPlazo(o.agua?.plazo_anios))}${o.agua?.nota_plazo ? ` <span class="fuente">(${esc(o.agua.nota_plazo)})</span>` : ""}</p>` +
      (o.id === "ACTUAL" && rest ? `<p>Remaining term: ${esc(fmtRango(rest.min, rest.max))} ${anios(rest.max)}</p>` : "") +
      (comp ? `<p>Water committed over the remaining term: ${esc(fmtRango(comp.min, comp.max))} thousand m³/ha</p>` : "") +
      "</div>";

    const adv = $('[data-parte="advertencia"]', tarjeta);
    adv.hidden = !ev.advertencia;
    const plazo = o.agua?.plazo_anios;
    adv.textContent = ev.advertencia
      ? `⚠ Warning: at this allocation this option does not get enough water, and it would commit water for ${plazo ? `${fmtRango(plazo.min, plazo.max)} ${anios(plazo.max)}` : "several years"}.`
      : "";

    $('[data-parte="respuestas"]', tarjeta).innerHTML = htmlRespuestas(o, ev);
  }
  pintarCoberturaGota();
  if (estado.whatsapp) pintarWhatsApp(); // el mensaje dice cuántas hectáreas alcanzan con la dotación elegida
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
    vista.innerHTML = htmlWhatsApp(f.properties, opcionesDe(f.properties.id), { reglas, D: estado.D, r: estado.r });
  } catch (err) {
    console.warn("Raíz: WhatsApp preview not available", err);
    vista.innerHTML = "<p>The message preview is not available for this field.</p>";
  }
}

/** «Print field sheet»: manifest.json (las fuentes del pie) se lee aquí, la primera vez que se imprime. */
async function imprimir() {
  const f = estado.porId.get(estado.fichaId);
  if (!f) return;
  try {
    const manifiesto = await cargarOpcional("data/manifest.json");
    await imprimirFicha({ D: estado.D, r: estado.r, cubo: estado.cubo, manifiesto, parcela: f.properties });
  } catch (err) {
    console.warn("Raíz: the field sheet could not be printed", err);
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
  ]).then(([manifest, pruebas, relieve]) => {
    const montado = montarAcerca($("#acerca-cuerpo"), { manifest, pruebas, cubo: estado.cubo, relieve });
    // Título del diálogo: el encabezado principal de la sección (el primero con id).
    const titulo = montado?.elemento.querySelector(".acerca-titulo[id]");
    if (titulo) {
      dlg.setAttribute("aria-labelledby", titulo.id);
      dlg.removeAttribute("aria-label");
    }
    document.body.dataset.acerca = "listo";
    return montado;
  }).catch((err) => {
    console.warn("Raíz: About & Data could not be built", err);
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

iniciar();
