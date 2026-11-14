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

import {
  llaveLluvia,
  aguaComprometida,
  evaluarOpcion,
  conteosZona,
  rellenarMarcadores,
} from "./reglas.js";

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
  mapa: null,
  mapaListo: false,
  marcadores: new Map(),
  pintadoPendiente: false,
  avisoTeselas: false,
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
function fmtPctSigno(fraccion) {
  if (fraccion == null || !Number.isFinite(fraccion)) return "—";
  return conMenos(formateador({ style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" }).format(fraccion));
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

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
async function iniciar() {
  observarCabecera();
  try {
    const [cubo, parcelas, explicaciones] = await Promise.all([
      cargarJSON("data/cubo.json"),
      cargarJSON("data/parcelas.geojson"),
      cargarJSON("data/explicaciones.json"),
    ]);
    estado.cubo = cubo;
    estado.parcelas = parcelas;
    estado.explicaciones = explicaciones;
  } catch (err) {
    console.error(err);
    const aviso = document.createElement("p");
    aviso.className = "error-carga";
    aviso.textContent = `The data files could not be loaded: ${err.message}`;
    $("#principal").prepend(aviso);
    return;
  }

  for (const f of estado.parcelas.features) estado.porId.set(f.properties.id, f);

  mostrarAvisoSimulado();
  iniciarControles();
  iniciarColoreado();
  pintarDistrito();
  pintarPie();
  conectarEventos();
  actualizarTodo();
  fijarMedidas(); // la cabecera ya tiene su alto final: el mapa se encuadra con él
  crearMapa();
  document.body.dataset.listo = "si";
}

/**
 * Medidas que usa style.css: --alto-cabecera (marca + controles; alto del área del mapa en escritorio)
 * y --tope-ficha (borde inferior de los controles fijos en pantalla; la ficha empieza ahí).
 */
function fijarMedidas() {
  const raiz = document.documentElement.style;
  const controles = $("#controles");
  raiz.setProperty("--alto-cabecera", `${$("#marca").offsetHeight + controles.offsetHeight}px`);
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
  const conteos = conteosZona(estado.parcelas.features, estado.cubo, estado.D, estado.r);
  actualizarIndicador(conteos);
  actualizarConteos(conteos);
  pintarColoreado();
  if (estado.fichaId) actualizarFicha();
}

function actualizarIndicador(conteos) {
  const { D, r } = estado;
  const ac = aguaComprometida(estado.cubo.zona, D, r);
  const cifra = $("#indicador-cifra");
  const rango = $("#indicador-rango");
  const mensaje = $("#indicador-mensaje");
  const partes = [];

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
    const valores = estado.parcelas.features.map((f) => esq.valor(f.properties)).filter((v) => v != null);
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
    const presentes = new Set(Array.from(salida.values()).map((v) => v.clave));
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

/** Filtro de la lista por id o cultivo; el resumen dice cuántas parcelas se ven. */
function filtrarLista() {
  const q = lista.filtro.trim().toLowerCase();
  let visibles = 0;
  for (const n of lista.nodos.values()) {
    const ver = !q || n.busqueda.includes(q);
    n.li.hidden = !ver;
    if (ver) visibles += 1;
  }
  const total = lista.nodos.size;
  $("#lista-resumen").textContent =
    visibles === total ? `${fmt(total, 0)} fields` : `Showing ${fmt(visibles, 0)} of ${fmt(total, 0)} fields`;
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
    features: estado.parcelas.features.map((f) => {
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
function margenMapa(ext = extension(estado.parcelas)) {
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
  const ext = extension(estado.parcelas);
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
  // ha movido el mapa, se vuelve a encuadrar la extensión de las parcelas.
  let movidoPorUsuario = false;
  const marcarMovido = (e) => { if (e.originalEvent) movidoPorUsuario = true; };
  mapa.on("dragstart", marcarMovido);
  mapa.on("zoomstart", marcarMovido);
  mapa.on("resize", () => {
    if (movidoPorUsuario) return;
    mapa.fitBounds(ext, { padding: margenMapa(ext), maxZoom: 17, duration: 0 });
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
    estado.mapaListo = true;
    pintarMapa();
    // «listo» cuando las parcelas ya están dibujadas (la fuente GeoJSON se procesa aparte, después de «load»).
    mapa.once("idle", () => { document.body.dataset.mapa = "listo"; });
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
    const c = salida.get(id);
    el.textContent = c.simbolo ? `${id} ${c.simbolo}` : `${id} · ${c.texto}`;
    el.style.borderColor = c.color;
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
  estado.gota = { opcion: (ops.find((o) => o.id === "ACTUAL") ?? ops[0])?.id ?? null, goteo: false, tope: true };
  construirFicha(f);
  fijarMedidas();
  const ficha = $("#ficha");
  ficha.hidden = false;
  ficha.scrollTop = 0;
  pintarColoreado();
  if (opciones.seccion === "gota") {
    const h = $("#t-gota");
    h?.scrollIntoView({ block: "start", behavior: reduceMovimiento() ? "auto" : "smooth" });
    h?.focus({ preventScroll: true });
  } else {
    $("#ficha-titulo").focus({ preventScroll: true });
  }
}

function cerrarFicha() {
  if (!estado.fichaId) return;
  const id = estado.fichaId;
  estado.fichaId = null;
  $("#ficha").hidden = true;
  $("#ficha-cuerpo").innerHTML = "";
  pintarColoreado();
  const volver = estado.disparador && document.contains(estado.disparador) ? estado.disparador : $(`.boton-parcela[data-id="${CSS.escape(id)}"]`);
  volver?.focus?.();
}

function construirFicha(f) {
  const p = f.properties;
  const ops = opcionesDe(p.id);
  $("#ficha-titulo").textContent = `Field ${p.id}`;
  // Parcela abstenida: sin tarjetas; la memoria sí se muestra (kit C2.1 y C2.2).
  const sinOpciones = p.abstencion
    ? '<p class="nota-abstenida">The crop map is not sure what grows here, so no options are computed. ' +
      "Check the current crop with a technician; the field memory above still shows its history.</p>"
    : "<p>No options computed for this field yet.</p>";
  $("#ficha-cuerpo").innerHTML = [
    htmlEncabezado(p),
    htmlMemoria(p),
    `<section aria-labelledby="t-opciones"><h3 id="t-opciones">Current rotation and alternatives</h3>` +
      (ops.length ? `<div class="tarjetas">${ops.map((o) => htmlTarjeta(o)).join("")}</div>` : sinOpciones) +
      "</section>",
    htmlGota(ops, p),
    `<p class="aviso-juicio">${esc(AVISO_JUICIO)}</p>`,
    htmlGlosario(),
  ].join("");
  conectarGota();
  actualizarFicha();
  construirFilasGota();
  pintarGota(true);
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

function htmlTarjeta(o) {
  const esActual = o.id === "ACTUAL";
  return (
    `<article class="tarjeta" data-opcion="${esc(o.id)}">` +
    '<header class="tarjeta-cabeza">' +
    (esActual ? '<span class="insignia-actual">Current rotation</span>' : "") +
    `<h4>${esc(o.nombre)}</h4></header>` +
    '<div class="renglon renglon-agua" data-parte="agua"></div>' +
    htmlSuelo(o) +
    htmlDinero(o) +
    htmlMeses(o) +
    htmlFiltros(o) +
    '<p class="advertencia" data-parte="advertencia" role="alert" hidden></p>' +
    '<details class="porque" data-parte="porque"><summary>Why?</summary><dl data-parte="respuestas"></dl></details>' +
    "</article>"
  );
}

function htmlSuelo(o) {
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
// La gota (plan B de X3.2: barras horizontales apiladas; el Sankey llegará después)
// ---------------------------------------------------------------------------
// Accesores a los campos del bloque gota del contrato (kit §2.3).
const FILAS_GOTA = [
  {
    rotulo: "Leaves La Boquilla",
    segmentos: [{ texto: "Released from the dam", colorVar: "gota-agua", v: (g) => g.m3_salen_presa }],
  },
  {
    rotulo: "Along the canal",
    segmentos: [
      { texto: "Canal losses", colorVar: "gota-canal", v: (g) => g.m3_perdidas_canal },
      { texto: "Reaches the field", colorVar: "gota-agua", v: (g) => g.m3_llegan_parcela },
    ],
  },
  {
    rotulo: "Where it ends up",
    segmentos: [
      { texto: "Crop consumption (ET)", colorVar: "gota-et", v: (g) => g.m3_consume_cultivo_et },
      { texto: "Back to aquifer", colorVar: "gota-acuifero", v: (g) => g.m3_regresan_acuifero },
      { texto: "Other losses", colorVar: "gota-otras", v: (g) => g.m3_otras_perdidas },
    ],
  },
];

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
    // Botón e interruptor del goteo: pintarGota los oculta si la opción no trae los bloques de goteo.
    '<button type="button" class="boton-goteo" id="gota-goteo" aria-pressed="false">What if this field switches to drip?</button>' +
    '<label class="interruptor" id="gota-tope-control" for="gota-tope"><input type="checkbox" role="switch" id="gota-tope" checked disabled>' +
    '<span>Consumption cap: <span class="estado-interruptor" id="gota-tope-estado">on</span></span></label>' +
    "</div>" +
    '<p class="gota-sin-goteo" id="gota-sin-goteo" hidden>Drip scenario not available yet: no sourced drip efficiency.</p>' +
    '<div class="gota-cifras" id="gota-cifras" aria-live="polite"></div>' +
    '<div class="gota-filas" id="gota-filas"></div>' +
    '<ul class="gota-leyenda" id="gota-leyenda"></ul>' +
    '<p class="gota-alerta" id="gota-alerta" hidden></p>' +
    '<p class="gota-nota" id="gota-cobertura" hidden></p>' +
    '<p class="fuente" id="gota-supuestos"></p>' +
    "</section>"
  );
}

function opcionGota() {
  return opcionesDe(estado.fichaId).find((o) => o.id === estado.gota.opcion && o.gota);
}

/** ¿La opción trae el escenario de goteo? (null mientras no haya eficiencia de goteo con fuente) */
function hayGoteo(o) {
  return Boolean(o?.gota_goteo_con_tope);
}

function varianteGota(o) {
  if (!estado.gota.goteo || !hayGoteo(o)) return o.gota;
  return (estado.gota.tope ? o.gota_goteo_con_tope : o.gota_goteo_sin_tope) ?? o.gota_goteo_con_tope;
}

function conectarGota() {
  const sel = $("#gota-opcion");
  if (!sel) return;
  sel.value = estado.gota.opcion;
  sel.addEventListener("change", () => {
    estado.gota.opcion = sel.value;
    construirFilasGota();
    pintarGota(true);
    pintarCoberturaGota();
  });
  $("#gota-goteo").addEventListener("click", () => {
    if (!hayGoteo(opcionGota())) return; // sin escenario de goteo no hay nada que alternar
    estado.gota.goteo = !estado.gota.goteo;
    pintarGota(true);
  });
  $("#gota-tope").addEventListener("change", (e) => {
    estado.gota.tope = e.target.checked;
    pintarGota(true);
  });
}

function construirFilasGota() {
  const cont = $("#gota-filas");
  if (!cont) return;
  cont.innerHTML = FILAS_GOTA.map(
    (fila, i) =>
      `<div class="gota-fila"><span class="rotulo">${esc(fila.rotulo)}</span>` +
      `<div class="gota-pista" aria-hidden="true"><div class="gota-barra" data-fila="${i}">` +
      fila.segmentos.map((s) => `<span class="gota-seg" style="background-color: var(--${s.colorVar})"></span>`).join("") +
      "</div></div></div>",
  ).join("");
}

function pintarGota(animar) {
  const o = opcionGota();
  if (!o || !$("#gota-filas")) return;
  // Sin bloques de goteo (null en el cubo): se vuelve al riego actual y se ocultan botón e interruptor.
  const conGoteo = hayGoteo(o);
  if (!conGoteo) estado.gota.goteo = false;
  const base = o.gota;
  const v = varianteGota(o) ?? base;
  const variantes = [base, o.gota_goteo_con_tope, o.gota_goteo_sin_tope].filter(Boolean);
  const escala = Math.max(...variantes.map((g) => g.m3_salen_presa ?? 0));
  const d3 = window.d3;
  const duracion = animar && !reduceMovimiento() ? 700 : 0;

  // Botones y estados
  const boton = $("#gota-goteo");
  boton.hidden = !conGoteo;
  boton.setAttribute("aria-pressed", String(estado.gota.goteo));
  $("#gota-tope-control").hidden = !conGoteo;
  $("#gota-sin-goteo").hidden = conGoteo;
  const tope = $("#gota-tope");
  tope.disabled = !estado.gota.goteo || !o.gota_goteo_sin_tope;
  tope.checked = estado.gota.tope;
  $("#gota-tope-estado").textContent = estado.gota.tope ? "on" : "off";

  // Barras: ancho total de la fila contra la mayor salida de presa; segmentos en proporción.
  FILAS_GOTA.forEach((fila, i) => {
    const barra = $(`.gota-barra[data-fila="${i}"]`);
    if (!barra) return;
    const valores = fila.segmentos.map((s) => Math.max(0, s.v(v) ?? 0));
    const total = valores.reduce((a, b) => a + b, 0);
    const anchoFila = escala > 0 ? (total / escala) * 100 : 0;
    const anchos = valores.map((x) => (total > 0 ? (x / total) * 100 : 0));
    const segs = Array.from(barra.children);
    if (d3 && duracion > 0) {
      d3.select(barra).transition().duration(duracion).style("width", `${anchoFila}%`);
      d3.selectAll(segs).data(anchos).transition().duration(duracion).style("width", (a) => `${a}%`);
    } else {
      barra.style.width = `${anchoFila}%`;
      segs.forEach((s, j) => { s.style.width = `${anchos[j]}%`; });
    }
  });

  // Leyenda con valores (alternativa en texto a las barras)
  const items = [];
  for (const fila of FILAS_GOTA) {
    for (const s of fila.segmentos) {
      if (items.some((x) => x.texto === s.texto)) continue;
      items.push({ ...s, valor: s.v(v) });
    }
  }
  $("#gota-leyenda").innerHTML = items
    .map((s) => `<li>${muestra(s.colorVar, "ninguna")}<span>${esc(s.texto)}</span><span class="v">${esc(fmt(s.valor, 0))} m³</span></li>`)
    .join("");

  // Cifras grandes del goteo (X3.2): cambios contra el riego actual.
  const cifras = [];
  const alerta = $("#gota-alerta");
  alerta.hidden = true;
  if (estado.gota.goteo && v !== base) {
    const cambio = (a, b) => (b > 0 ? a / b - 1 : null);
    cifras.push(`<p class="gota-cifra">Dam water: ${esc(fmtPctSigno(cambio(v.m3_salen_presa, base.m3_salen_presa)))}<small>vs. current irrigation</small></p>`);
    cifras.push(`<p class="gota-cifra">Back to aquifer: ${esc(fmtPctSigno(cambio(v.m3_regresan_acuifero, base.m3_regresan_acuifero)))}<small>vs. current irrigation</small></p>`);
    const t = o.tope_consumo;
    if (!estado.gota.tope && t) {
      cifras.push(`<p class="gota-cifra">Crop consumption (ET): ${esc(fmtPctSigno(cambio(t.et_goteo_sin_tope_m3, t.et_historica_m3)))}<small>vs. historical</small></p>`);
      if (t.cumple_sin_tope === false) {
        alerta.textContent = "Not recommended: district consumption would exceed the historical level.";
        alerta.hidden = false;
      }
    }
  }
  $("#gota-cifras").innerHTML = cifras.join("");

  const supuestos = [...(v.supuestos ?? [])];
  if (estado.gota.goteo && !estado.gota.tope && o.tope_consumo?.base_historica) supuestos.push(`Historical base: ${o.tope_consumo.base_historica}`);
  $("#gota-supuestos").textContent = supuestos.length ? `Assumptions: ${supuestos.join("; ")}` : "";
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
// Eventos
// ---------------------------------------------------------------------------
function parcelaParaGota() {
  const fs = estado.parcelas.features;
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

  $("#ficha-cerrar").addEventListener("click", cerrarFicha);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && estado.fichaId) cerrarFicha();
  });
}

// Ganchos mínimos para la prueba de humo (tests/e2e/web_smoke.mjs): solo leen; no cambian el comportamiento.
/** Espera a que el mapa termine de dibujar lo pendiente (repintado programado y teselas de la fuente). */
function esperarMapa() {
  return new Promise((ok) => {
    if (!estado.mapaListo) {
      ok(false);
      return;
    }
    // Dos cuadros: el repintado programado con requestAnimationFrame ya llamó a setData.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (estado.mapa.loaded()) ok(true);
        else estado.mapa.once("idle", () => ok(true));
      }),
    );
  });
}

window.raizDepuracion = {
  esperarMapa,
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
