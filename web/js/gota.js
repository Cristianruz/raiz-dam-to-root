// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/gota.js — «Follow the drop» (La gota, kit X3.1 y X3.2) dentro de la ficha de la parcela.
//
// Uso (desde app.js):
//   import { dibujarGota } from "./js/gota.js";
//   const gota = dibujarGota(divDeLaFicha, opcion, { alCambiar: (e) => … });
//   gota.estado();   // { goteo, tope, variante: "actual" | "con_tope" | "sin_tope" | null, plan: "sankey" | "barras" | null }
//   gota.mostrar({ goteo: true, tope: false });   // cambia la variante sin animar
//   gota.destruir(); // detiene gotas y observadores y vacía el contenedor
//
// Qué dibuja (reemplaza el contenido del contenedor; el título «Follow the drop», el selector de opción y la
// línea de cobertura que depende del deslizador se quedan en app.js):
// - un diagrama Sankey con d3-sankey (window.d3.sankey): Needed from La Boquilla → Canal losses / Field →
//   Crop (ET) / Back to aquifer / Other losses. Los números y los altos salen del bloque «gota» de la opción
//   (m³), con UNA escala común a las tres variantes: con goteo, la presa se ve más corta. El primer nodo es el
//   agua que la opción NECESITA, contada desde La Boquilla, no lo que la presa entrega (I15 de la revisión total);
//   cuánto de eso cubre la dotación elegida lo dice app.js en la línea de cobertura;
// - gotas (círculos) que recorren las bandas UNA sola vez (~3 s) cuando el diagrama entra en pantalla;
//   nada se anima con prefers-reduced-motion (ni en el modo estático de la ficha imprimible);
// - el botón «What if this field switches to drip?» y el conmutador «Consumption cap: on/off» SOLO si el
//   cubo trae los bloques de goteo; si vienen en null, la nota «Drip scenario not available yet…»;
// - con goteo, las cifras grandes «Dam water» y «Back to aquifer» (y, sin tope, «Crop consumption (ET)»
//   contra la base histórica y el aviso según tope_consumo.cumple_sin_tope), calculadas de los bloques;
// - la frase fija de X3.2 (reescrita sin «only»), la fuente del coeficiente de retorno (de gota.supuestos),
//   los supuestos de la variante y una tabla oculta a la vista con los mismos números (lectores de pantalla);
// - con goteo, A LA VISTA junto a sus cifras (no solo en el desplegable): las eficiencias de campo del goteo y del
//   riego superficial con su etiqueta («[V] indicative, not local») y su fuente (FAO), de ctx.metaGoteo
//   (= cubo.meta.goteo); sin tope, «upper bound» junto al retorno al acuífero si
//   metaGoteo.retorno_sin_tope_es_cota_superior es true (decisión docs/decisiones/2026-11-14_opciones_b3.md §3).
// Plan B (kit X3.2): si d3-sankey no está o falla, barras horizontales apiladas con los mismos números.
//
// Reglas de este archivo:
// - Ninguna cifra escrita a mano en los textos: todo número visible sale del bloque de la opción.
//   Los números del código (DISENO, TIEMPOS) son medidas de dibujo y de tiempo, no datos.
// - Sin colores en el JS: cada elemento lleva una clase «gota-tipo-…» y los colores viven en web/css/gota.css.
// - Comentarios en español; la interfaz, en inglés.

const LOCALE_POR_OMISION = "en-US";
const MENOS = "−"; // signo menos tipográfico

// ---------------------------------------------------------------------------
// Textos de la interfaz (sin números)
// ---------------------------------------------------------------------------
const TEXTOS = {
  boton: "What if this field switches to drip?",
  tope: "Consumption cap:",
  encendido: "on",
  apagado: "off",
  sinGoteo: "Drip scenario not available yet: no sourced drip efficiency.",
  sinDatos: "Water flows not available for this option yet.",
  sinAgua: "This option takes no water from the dam, so there is no flow to follow.",
  presa: "Dam water:",
  acuifero: "Back to aquifer:",
  consumo: "Crop consumption (ET):",
  vsActual: "vs. current irrigation",
  vsHistorico: "vs. historical",
  // Aviso del escenario sin tope (kit X3.2 §3). Decisión de Cristian del 15-nov-2026: la página marca el
  // escenario y no aconseja (CLAUDE.md, regla 10); ver docs/decisiones/2026-11-15_correcciones_motor.md §5.
  noRecomendado: "Flagged: district consumption (ET) would exceed its historical level.",
  // Frase fija de X3.2 §4, con la misma decisión: en lugar de decir cuándo conviene el goteo, dice cuándo la
  // página muestra el escenario sin aviso y cuándo lo marca. La cita y «consumo, no solo extracción» no cambian.
  frase:
    "Efficiency reduces dam withdrawals but can reduce aquifer recharge (Grafton et al., Science 2018). " +
    "We count consumption (ET), not just withdrawals. " +
    "The drip scenario is shown without a warning when district ET stays at or below its historical level; if ET would rise above it, the page flags the scenario.",
  fuenteRetorno: "Return-flow coefficient:",
  // Eficiencias del goteo (cubo.meta.goteo): rótulo y fuente a la vista junto a las cifras.
  eficiencias: "Field efficiencies used: drip",
  superficial: "surface",
  fuenteEficiencias: "Source:",
  cotaSuperior: "upper bound",
  cotaSuperiorNota: "Without the cap, the aquifer return keeps its coefficient: an upper bound, not a measurement.",
  fuenteFalta: "source not stated in the data for this option.",
  supuestos: "Assumptions behind these flows",
  baseHistorica: "Historical base:",
  reparto:
    "In the diagram, the aquifer return and the other losses are split between the canal and the field in " +
    "proportion to the water each one loses (display assumption). Every total shown is the data.",
  unidades: "Cubic metres per year for this field.",
  mostrando: "Showing:",
  tablaTitulo: "Follow the drop: where this option's water goes, in cubic metres per year for this field",
  tablaFlujo: "Flow",
  tablaVisible: "(shown)",
  sinDato: "no data",
};

// Variantes del contrato v4 (kit §2.3: opciones[].gota, .gota_goteo_con_tope, .gota_goteo_sin_tope).
const VARIANTES = [
  { id: "actual", llave: "gota", nombre: "current irrigation", columna: "Current irrigation" },
  { id: "con_tope", llave: "gota_goteo_con_tope", nombre: "drip with the consumption cap on", columna: "Drip, consumption cap on" },
  { id: "sin_tope", llave: "gota_goteo_sin_tope", nombre: "drip with the consumption cap off", columna: "Drip, consumption cap off" },
];

// Flujos del bloque gota (kit X3.1, contrato §2.3): clave corta → lector del campo del contrato.
// Se leen con funciones (no con el nombre del campo en una cadena) para que ninguna cadena lleve dígitos.
// Un bloque sirve solo si los seis son números.
const FLUJOS = {
  presa: (b) => b.m3_salen_presa,
  canal: (b) => b.m3_perdidas_canal,
  parcela: (b) => b.m3_llegan_parcela,
  et: (b) => b.m3_consume_cultivo_et,
  acuifero: (b) => b.m3_regresan_acuifero,
  otras: (b) => b.m3_otras_perdidas,
};

// Nodos del Sankey en el orden en que se apilan dentro de cada columna (nodeSort(null) respeta este orden).
// «tipo» elige el color en gota.css: agua (flujo), et (Brote), acuifero (Tierra), perdidas (Ámbar).
// «id» es la clave de FLUJOS. El primer nodo es la necesidad de la opción contada desde la presa (I15): su rótulo lo
// dice, para que no se lea como agua que la presa entrega.
const NODOS = [
  { id: "presa", nombre: "Needed from La Boquilla", corto: "Water needed", tipo: "agua" },
  { id: "parcela", nombre: "Field", corto: "Field", tipo: "agua" },
  { id: "canal", nombre: "Canal losses", corto: "Canal losses", tipo: "perdidas" },
  { id: "et", nombre: "Crop (ET)", corto: "Crop (ET)", tipo: "et" },
  { id: "acuifero", nombre: "Back to aquifer", corto: "Back to aquifer", tipo: "acuifero" },
  { id: "otras", nombre: "Other losses", corto: "Other losses", tipo: "perdidas" },
];

// Renglones de la tabla para lectores de pantalla y de la leyenda con valores del plan B.
const FILAS = [
  { flujo: "presa", texto: "Water this option needs, counted from La Boquilla (dam)", tipo: "agua" },
  { flujo: "canal", texto: "Canal losses", tipo: "perdidas" },
  { flujo: "parcela", texto: "Reaches the field", tipo: "agua" },
  { flujo: "et", texto: "Crop consumption (ET)", tipo: "et" },
  { flujo: "acuifero", texto: "Back to aquifer", tipo: "acuifero" },
  { flujo: "otras", texto: "Other losses (evaporation, runoff)", tipo: "perdidas" },
];

// Clave de colores del Sankey (las cifras ya van en las etiquetas del diagrama).
const CLAVE_COLORES = [
  { tipo: "agua", texto: "Water on its way (dam, canal, field)" },
  { tipo: "et", texto: "Crop consumption (ET)" },
  { tipo: "acuifero", texto: "Back to aquifer" },
  { tipo: "perdidas", texto: "Losses (canal, evaporation, runoff)" },
];

// Filas del plan B (barras apiladas): mismo mensaje que el Sankey con menos código.
const FILAS_BARRAS = [
  { id: "presa", rotulo: "Needed from La Boquilla", segmentos: [["presa", "agua"]] },
  { id: "canal", rotulo: "Along the canal", segmentos: [["canal", "perdidas"], ["parcela", "agua"]] },
  { id: "destino", rotulo: "Where it ends up", segmentos: [["et", "et"], ["acuifero", "acuifero"], ["otras", "perdidas"]] },
];

// Medidas de dibujo en píxeles (no son datos).
const DISENO = {
  anchoNodo: 14,
  anchoNodoCompacto: 10,
  separacion: 30, // entre nodos de una columna: deja sitio a una etiqueta de dos renglones
  altoMin: 190,
  altoMax: 280,
  proporcionAlto: 0.5, // alto del dibujo respecto al ancho, dentro de [altoMin, altoMax]
  margenArriba: 14,
  margenAbajo: 18,
  etiquetaMin: 104, // ancho reservado a la derecha para las etiquetas de la última columna
  etiquetaMax: 176,
  proporcionEtiqueta: 0.34,
  anchoCompacto: 480, // por debajo: nombres cortos y cifras compactas (la tabla conserva las completas)
  respaldoAncho: 600, // si el contenedor aún no tiene ancho (oculto)
  sepTexto: 6,
  renglonArriba: -3,
  renglon: 14,
  transicion: 700, // ms del cambio suave entre variantes
};

// Tiempos de las gotas: dos etapas encadenadas (presa → canal/parcela y después → destinos), ~3 s en total.
const TIEMPOS = {
  etapas: [
    { inicio: 0, viaje: 1300 },
    { inicio: 1300, viaje: 1200 },
  ],
  escalon: 140, // ms entre gotas de una misma banda
  maxPorBanda: 4,
  anchoPorGota: 10, // px de banda por gota
  dispersion: 0.7, // fracción del ancho de la banda que ocupan las gotas
  radio: 3.5,
  fundido: 6, // aparición y desaparición rápidas en los extremos
  visible: 0.35, // fracción del diagrama en pantalla para soltarlas
};

// Una instancia por contenedor: volver a dibujar destruye la anterior.
const instancias = new WeakMap();

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
/**
 * Dibuja La gota de UNA opción del cubo dentro de `contenedor` (reemplaza su contenido).
 * @param {HTMLElement} contenedor  elemento ya insertado en la ficha (un <div> propio de la sección).
 * @param {object|null} opcion      opción del cubo (kit §2.3): usa gota, gota_goteo_con_tope,
 *                                  gota_goteo_sin_tope y tope_consumo; los de goteo pueden ser null.
 * @param {object} [ctx]            todo opcional:
 *   d3                 biblioteca d3 con d3-sankey (por omisión window.d3);
 *   locale             formato de números (por omisión "en-US");
 *   reducirMovimiento  true/false; por omisión, prefers-reduced-motion del sistema;
 *   estatico           true = versión fija para la ficha imprimible (sin controles, gotas ni transiciones);
 *   prefijo            prefijo de los id (por omisión "gota": #gota-goteo, #gota-tope, #gota-cifras…);
 *   goteo, tope        estado inicial (por omisión: riego actual; tope encendido);
 *   alCambiar          función que recibe estado() cada vez que el usuario cambia la variante;
 *   metaGoteo          cubo.meta.goteo: { ea_goteo, ea_superficial_referencia: { valor, etiqueta, fuente },
 *                      retorno_sin_tope_es_cota_superior } (opcional; sin él, no hay rótulo de eficiencias);
 *   planB              true = fuerza las barras apiladas (pruebas).
 * @returns {{estado: Function, mostrar: Function, destruir: Function}}
 */
export function dibujarGota(contenedor, opcion, ctx = {}) {
  if (!contenedor || typeof contenedor.append !== "function") {
    throw new TypeError("dibujarGota: el primer argumento debe ser un elemento del DOM");
  }
  instancias.get(contenedor)?.destruir();
  const api = crearGota(contenedor, opcion ?? null, ctx ?? {});
  instancias.set(contenedor, api);
  return api;
}

// ---------------------------------------------------------------------------
// Utilidades puras
// ---------------------------------------------------------------------------
const esNumero = (v) => typeof v === "number" && Number.isFinite(v);
const positivo = (v) => (esNumero(v) && v > 0 ? v : 0);
const acotar = (v, min, max) => Math.min(max, Math.max(min, v));

/** Un bloque gota sirve si trae los seis flujos como números. */
function bloqueValido(b) {
  return Boolean(b) && typeof b === "object" && Object.values(FLUJOS).every((leer) => esNumero(leer(b)));
}

/** Cambio relativo a / b − 1; null si no se puede calcular. */
function cambio(a, b) {
  return esNumero(a) && esNumero(b) && b > 0 ? a / b - 1 : null;
}

function formatos(locale) {
  const entero = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const compacto = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const pct = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" });
  const pctLlano = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 });
  const conMenos = (s) => s.replace("-", MENOS);
  return {
    m3: (v) => (esNumero(v) ? `${conMenos(entero.format(v))} m³` : TEXTOS.sinDato),
    m3Corto: (v) => (esNumero(v) ? `${conMenos(compacto.format(v))} m³` : TEXTOS.sinDato),
    cambio: (f) => (esNumero(f) ? conMenos(pct.format(f)) : "—"),
    pct: (f) => (esNumero(f) ? pctLlano.format(f) : "—"),
  };
}

/** Fuente en corto: hasta el primer «: » (lo que sigue son los valores de la tabla citada); el texto entero si no hay. */
function fuenteCorta(texto) {
  const s = String(texto ?? "").trim();
  const i = s.indexOf(": ");
  return i > 0 ? s.slice(0, i) : s;
}

/** Lo que va dentro del primer paréntesis (con paréntesis anidados); si no hay, el texto entero. */
function entreParentesis(texto) {
  const i = texto.indexOf("(");
  if (i < 0) return texto;
  let nivel = 0;
  for (let j = i; j < texto.length; j++) {
    if (texto[j] === "(") nivel++;
    else if (texto[j] === ")" && --nivel === 0) return texto.slice(i + 1, j).trim();
  }
  return texto;
}

/**
 * Bandas del Sankey a partir de un bloque gota (m³).
 * Presa → parcela (m3_llegan_parcela) y presa → canal (m3_perdidas_canal); parcela → ET.
 * El retorno al acuífero y las otras pérdidas vienen del canal Y de la parcela, y el cubo no los separa:
 * para dibujar, se reparten en proporción a lo que pierde cada tramo (kit X3.1: «en proporción a las
 * pérdidas de cada tramo»; se declara en los supuestos). Con un bloque balanceado, lo que sale de cada nodo
 * suma exactamente su valor del cubo.
 */
export function bandasGota(b) {
  const canal = positivo(b.m3_perdidas_canal);
  const llegan = positivo(b.m3_llegan_parcela);
  const et = positivo(b.m3_consume_cultivo_et);
  const ret = positivo(b.m3_regresan_acuifero);
  const otras = positivo(b.m3_otras_perdidas);
  const sobranteParcela = Math.max(0, llegan - et);
  const fuentes = canal + sobranteParcela;
  const parteCanal = fuentes > 0 ? canal / fuentes : 0;
  return [
    { id: "presa-parcela", source: "presa", target: "parcela", value: llegan, tipo: "agua" },
    { id: "presa-canal", source: "presa", target: "canal", value: canal, tipo: "perdidas" },
    { id: "parcela-et", source: "parcela", target: "et", value: et, tipo: "et" },
    { id: "parcela-acuifero", source: "parcela", target: "acuifero", value: ret * (1 - parteCanal), tipo: "acuifero" },
    { id: "parcela-otras", source: "parcela", target: "otras", value: otras * (1 - parteCanal), tipo: "perdidas" },
    { id: "canal-acuifero", source: "canal", target: "acuifero", value: ret * parteCanal, tipo: "acuifero" },
    { id: "canal-otras", source: "canal", target: "otras", value: otras * parteCanal, tipo: "perdidas" },
  ].filter((x) => x.value > 0);
}

/** Elemento HTML con atributos e hijos (texto o nodos). Los textos entran como texto, nunca como HTML. */
function el(etiqueta, atributos = {}, hijos = []) {
  const nodo = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(atributos)) {
    if (v === null || v === undefined || v === false) continue;
    nodo.setAttribute(k, v === true ? "" : String(v));
  }
  for (const h of [].concat(hijos)) if (h !== null && h !== undefined) nodo.append(h);
  return nodo;
}

function reducirMovimiento(ctx) {
  if (typeof ctx.reducirMovimiento === "boolean") return ctx.reducirMovimiento;
  return Boolean(globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

// Avance suave de las gotas (cúbica de entrada y salida).
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// ---------------------------------------------------------------------------
// Instancia
// ---------------------------------------------------------------------------
function crearGota(contenedor, opcion, ctx) {
  const pre = ctx.prefijo || "gota";
  const estatico = Boolean(ctx.estatico);
  const quieto = estatico || reducirMovimiento(ctx);
  const fmt = formatos(ctx.locale || LOCALE_POR_OMISION);
  const d3 = ctx.d3 ?? globalThis.d3;
  const conSankey =
    !ctx.planB && typeof d3?.sankey === "function" && typeof d3?.sankeyLinkHorizontal === "function" && typeof d3?.select === "function";

  const variantes = VARIANTES.map((v) => ({ ...v, bloque: opcion?.[v.llave] ?? null })).filter((v) => bloqueValido(v.bloque));
  const porId = Object.fromEntries(variantes.map((v) => [v.id, v]));
  const hayConTope = Boolean(porId.con_tope);
  const haySinTope = Boolean(porId.sin_tope);
  const hayGoteo = hayConTope || haySinTope;

  // Nodos del DOM que usan el pintado y la limpieza (se crean después; null si la opción no trae flujos).
  let caja = null;
  let boton = null;
  let interruptor = null;
  let estadoTope = null;
  let listo = false; // true cuando el esqueleto completo existe (opción con flujos que dibujar)

  const st = {
    goteo: Boolean(ctx.goteo) && hayGoteo,
    tope: ctx.tope !== false,
    plan: null,
    ancho: 0,
    gotasLanzadas: false,
    cuadro: 0,
    observadores: [],
    destruido: false,
  };

  const api = {
    estado: () => ({ goteo: st.goteo, tope: st.tope, variante: varianteActiva()?.id ?? null, plan: st.plan }),
    mostrar: (cambios = {}) => {
      if ("goteo" in cambios) st.goteo = Boolean(cambios.goteo) && hayGoteo;
      if ("tope" in cambios) st.tope = Boolean(cambios.tope);
      if (listo) pintar(false);
    },
    destruir: () => {
      parar();
      st.destruido = true;
      contenedor.replaceChildren();
      if (instancias.get(contenedor) === api) instancias.delete(contenedor);
    },
  };

  function varianteActiva() {
    if (!porId.actual) return null;
    if (!st.goteo) return porId.actual;
    if (st.tope) return porId.con_tope ?? porId.sin_tope ?? porId.actual;
    return porId.sin_tope ?? porId.con_tope ?? porId.actual;
  }

  // --- Esqueleto -----------------------------------------------------------
  contenedor.replaceChildren();
  const raiz = el("div", { class: `gota-modulo${quieto ? " gota-quieto" : ""}${estatico ? " gota-estatica" : ""}` });
  contenedor.append(raiz);

  if (!porId.actual) {
    raiz.append(el("p", { class: "gota-mod-nota" }, TEXTOS.sinDatos));
    return api;
  }
  const base = porId.actual.bloque;
  if (!(base.m3_salen_presa > 0)) {
    raiz.append(el("p", { class: "gota-mod-nota" }, TEXTOS.sinAgua));
    return api;
  }

  // Controles del goteo: solo si el cubo trae al menos un bloque de goteo (y nunca en la versión estática).
  if (!estatico && hayGoteo) {
    boton = el("button", { type: "button", class: "gota-mod-boton", id: `${pre}-goteo`, "aria-pressed": "false" }, TEXTOS.boton);
    const controles = el("div", { class: "gota-mod-controles" }, boton);
    if (hayConTope && haySinTope) {
      interruptor = el("input", { type: "checkbox", role: "switch", id: `${pre}-tope` });
      estadoTope = el("span", { class: "gota-mod-estado", id: `${pre}-tope-estado` });
      controles.append(
        el("label", { class: "gota-mod-interruptor", id: `${pre}-tope-control`, for: `${pre}-tope` }, [
          interruptor,
          el("span", {}, [`${TEXTOS.tope} `, estadoTope]),
        ]),
      );
    }
    raiz.append(controles);
    boton.addEventListener("click", () => {
      st.goteo = !st.goteo;
      cambiar();
    });
    interruptor?.addEventListener("change", () => {
      st.tope = interruptor.checked;
      cambiar();
    });
  }
  if (!hayGoteo) raiz.append(el("p", { class: "gota-mod-nota", id: `${pre}-sin-goteo` }, TEXTOS.sinGoteo));

  const cifras = el("div", { class: "gota-mod-cifras", id: `${pre}-cifras` });
  const alerta = el("p", { class: "gota-mod-alerta", id: `${pre}-alerta`, hidden: true });
  raiz.append(el("div", { class: "gota-mod-vivo", "aria-live": "polite" }, [cifras, alerta]));
  // Rótulo de las eficiencias del goteo (cubo.meta.goteo): a la vista junto a las cifras, solo con una variante de goteo.
  const meta = ctx.metaGoteo && typeof ctx.metaGoteo === "object" ? ctx.metaGoteo : null;
  const rotuloGoteo = el("p", { class: "gota-mod-etiqueta", id: `${pre}-etiqueta-goteo`, hidden: true });
  const notaCota = el("p", { class: "gota-mod-cota", id: `${pre}-cota`, hidden: true }, TEXTOS.cotaSuperiorNota);
  raiz.append(rotuloGoteo, notaCota);

  const mostrando = el("p", { class: "gota-mod-mostrando", id: `${pre}-mostrando` });
  caja = el("div", { class: "gota-mod-diagrama", id: `${pre}-diagrama` });
  const leyenda = el("ul", { class: "gota-mod-leyenda", id: `${pre}-leyenda` });
  const tabla = el("table", { class: "gota-mod-tabla", id: `${pre}-tabla` });
  const supRetorno = (base.supuestos ?? []).find((s) => typeof s === "string" && /return|retorno/i.test(s));
  // La fuente del coeficiente viene de los datos, en español: lang="es" para el lector de pantalla.
  const fuente = el("p", { class: "gota-mod-fuente", id: `${pre}-fuente` }, [
    `${TEXTOS.fuenteRetorno} `,
    supRetorno ? el("span", { lang: "es" }, entreParentesis(supRetorno)) : TEXTOS.fuenteFalta,
  ]);
  const listaSupuestos = el("ul", { id: `${pre}-supuestos` });
  raiz.append(
    mostrando,
    caja,
    leyenda,
    // Una tabla no se encoge a un píxel: se oculta su envoltura.
    el("div", { class: "gota-solo-lector" }, tabla),
    el("p", { class: "gota-mod-frase", id: `${pre}-frase` }, TEXTOS.frase),
    fuente,
    el("details", { class: "gota-mod-supuestos" }, [el("summary", {}, TEXTOS.supuestos), listaSupuestos]),
  );

  listo = true;
  pintar(false);
  vigilar();
  return api;

  // --- Pintado -------------------------------------------------------------
  function cambiar() {
    pintar(true);
    if (typeof ctx.alCambiar === "function") ctx.alCambiar(api.estado());
  }

  function pintar(animar) {
    const v = varianteActiva();
    if (boton) boton.setAttribute("aria-pressed", String(st.goteo));
    if (interruptor) {
      interruptor.checked = st.tope;
      interruptor.disabled = !st.goteo;
      estadoTope.textContent = st.tope ? TEXTOS.encendido : TEXTOS.apagado;
    }
    mostrando.textContent = `${TEXTOS.mostrando} ${v.nombre}. ${TEXTOS.unidades}`;
    pintarCifras(v);
    dibujarDiagrama(v, animar);
    pintarLeyenda(v);
    pintarTabla(v);
    pintarSupuestos(v);
  }

  function cifra(rotulo, valor, comparacion, clave) {
    return el("p", { class: "gota-mod-cifra", "data-cifra": clave }, [
      el("span", { class: "gota-mod-cifra-rotulo" }, rotulo),
      " ",
      el("strong", { class: "gota-mod-cifra-valor" }, valor),
      el("small", {}, comparacion),
    ]);
  }

  /** Rótulo de las eficiencias: «Field efficiencies used: drip 90%, surface 60% · [V] indicative, not local · Source: FAO…». */
  function pintarRotuloGoteo(v) {
    const ea = meta?.ea_goteo;
    const sup = meta?.ea_superficial_referencia;
    const hay = v.id !== "actual" && ea && esNumero(ea.valor);
    rotuloGoteo.hidden = !hay;
    if (!hay) {
      rotuloGoteo.replaceChildren();
      return;
    }
    const valores = [`${TEXTOS.eficiencias} ${fmt.pct(ea.valor)}`];
    if (sup && esNumero(sup.valor)) valores.push(`${TEXTOS.superficial} ${fmt.pct(sup.valor)}`);
    rotuloGoteo.replaceChildren(
      el("span", {}, valores.join(", ")),
      " ",
      ea.etiqueta ? el("strong", { class: "gota-mod-etiqueta-texto" }, ea.etiqueta) : null,
      ea.fuente ? el("span", { class: "gota-mod-etiqueta-fuente" }, [` ${TEXTOS.fuenteEficiencias} `, el("span", { lang: "es" }, fuenteCorta(ea.fuente))]) : null,
    );
  }

  // Cifras grandes del goteo (X3.2 §3), calculadas de los bloques del cubo.
  function pintarCifras(v) {
    const partes = [];
    alerta.hidden = true;
    alerta.textContent = "";
    pintarRotuloGoteo(v);
    // Sin tope, el retorno al acuífero conserva su coeficiente: es una cota superior (lo dice cubo.meta.goteo).
    const cota = v.id === "sin_tope" && meta?.retorno_sin_tope_es_cota_superior === true;
    notaCota.hidden = !cota;
    if (v.id !== "actual") {
      const b = v.bloque;
      partes.push(cifra(TEXTOS.presa, fmt.cambio(cambio(b.m3_salen_presa, base.m3_salen_presa)), TEXTOS.vsActual, "presa"));
      partes.push(cifra(TEXTOS.acuifero, fmt.cambio(cambio(b.m3_regresan_acuifero, base.m3_regresan_acuifero)),
        cota ? `${TEXTOS.vsActual} · ${TEXTOS.cotaSuperior}` : TEXTOS.vsActual, "acuifero"));
      if (v.id === "sin_tope") {
        const t = opcion.tope_consumo;
        const conBase = Boolean(t) && esNumero(t.et_goteo_sin_tope_m3) && esNumero(t.et_historica_m3);
        const z = conBase ? cambio(t.et_goteo_sin_tope_m3, t.et_historica_m3) : cambio(b.m3_consume_cultivo_et, base.m3_consume_cultivo_et);
        partes.push(cifra(TEXTOS.consumo, fmt.cambio(z), conBase ? TEXTOS.vsHistorico : TEXTOS.vsActual, "consumo"));
        // El aviso depende SOLO de la regla del tope que calcula el motor (kit X3.1).
        if (t?.cumple_sin_tope === false) {
          alerta.textContent = TEXTOS.noRecomendado;
          alerta.hidden = false;
        }
      }
    }
    cifras.replaceChildren(...partes);
  }

  function pintarLeyenda(v) {
    const items =
      st.plan === "sankey"
        ? CLAVE_COLORES.map((c) => [c.tipo, c.texto, null])
        : FILAS.map((f) => [f.tipo, f.texto, fmt.m3(FLUJOS[f.flujo](v.bloque))]);
    leyenda.replaceChildren(
      ...items.map(([tipo, texto, valor]) =>
        el("li", {}, [
          el("span", { class: `gota-muestra gota-tipo-${tipo}`, "aria-hidden": "true" }),
          el("span", {}, texto),
          valor ? el("span", { class: "gota-mod-v" }, valor) : null,
        ]),
      ),
    );
  }

  // Tabla para lectores de pantalla: los mismos números que el diagrama, de todas las variantes del cubo.
  function pintarTabla(v) {
    const cabeza = el("tr", {}, [
      el("th", { scope: "col" }, TEXTOS.tablaFlujo),
      ...variantes.map((x) => el("th", { scope: "col" }, x.id === v.id ? `${x.columna} ${TEXTOS.tablaVisible}` : x.columna)),
    ]);
    const cuerpo = FILAS.map((f) =>
      el("tr", {}, [
        el("th", { scope: "row" }, f.texto),
        ...variantes.map((x) => el("td", { "data-flujo": f.flujo, "data-variante": x.id }, fmt.m3(FLUJOS[f.flujo](x.bloque)))),
      ]),
    );
    tabla.replaceChildren(el("caption", {}, TEXTOS.tablaTitulo), el("thead", {}, cabeza), el("tbody", {}, cuerpo));
  }

  function pintarSupuestos(v) {
    const lista = (v.bloque.supuestos ?? []).filter((s) => typeof s === "string" && s.trim());
    if (v.id === "sin_tope" && opcion.tope_consumo?.base_historica) lista.push(`${TEXTOS.baseHistorica} ${opcion.tope_consumo.base_historica}`);
    if (st.plan === "sankey") lista.push(TEXTOS.reparto);
    listaSupuestos.replaceChildren(...lista.map((s) => el("li", {}, s)));
  }

  // --- Diagrama ------------------------------------------------------------
  function dibujarDiagrama(v, animar) {
    detenerGotas();
    if (conSankey && st.plan !== "barras") {
      try {
        dibujarSankey(v, animar);
        st.plan = "sankey";
        raiz.dataset.gotaPlan = "sankey";
        return;
      } catch (error) {
        // Plan B (kit X3.2): se avisa en la consola (no es un error de la página) y se dibujan barras.
        console.warn("La gota: d3-sankey falló; se usan barras apiladas (plan B).", error);
        caja.replaceChildren();
      }
    }
    st.plan = "barras";
    raiz.dataset.gotaPlan = "barras";
    dibujarBarras(v);
  }

  /** Grafo de d3-sankey para un bloque, dentro de [0, ancho] × [y0, y1]; null si no hay bandas. */
  function disponer(bloque, ancho, y0, y1, anchoNodo) {
    const links = bandasGota(bloque);
    if (!links.length) return null;
    const usados = new Set(links.flatMap((x) => [x.source, x.target]));
    const nodes = NODOS.filter((n) => usados.has(n.id)).map((n) => ({ ...n, valorCubo: FLUJOS[n.id](bloque) }));
    return d3
      .sankey()
      .nodeId((d) => d.id)
      .nodeAlign(d3.sankeyJustify)
      .nodeSort(null)
      .nodeWidth(anchoNodo)
      .nodePadding(DISENO.separacion)
      .extent([
        [0, y0],
        [ancho, y1],
      ])({ nodes, links });
  }

  /** Suma y número de nodos de cada columna (no dependen del alto del dibujo). */
  function columnas(grafo) {
    const cols = new Map();
    for (const n of grafo.nodes) {
      const c = cols.get(n.layer) ?? { suma: 0, n: 0 };
      c.suma += n.value;
      c.n += 1;
      cols.set(n.layer, c);
    }
    return [...cols.values()];
  }

  function dibujarSankey(v, animar) {
    const W = Math.round(caja.clientWidth) || DISENO.respaldoAncho;
    st.ancho = W;
    const compacto = W < DISENO.anchoCompacto;
    const anchoNodo = compacto ? DISENO.anchoNodoCompacto : DISENO.anchoNodo;
    const reservado = acotar(W * DISENO.proporcionEtiqueta, DISENO.etiquetaMin, DISENO.etiquetaMax);
    const anchoSankey = Math.max(W - reservado, anchoNodo * 3);
    const H = acotar(W * DISENO.proporcionAlto, DISENO.altoMin, DISENO.altoMax);
    const pad = DISENO.separacion;

    // Escala común (m³ → px) para las tres variantes: d3-sankey ajusta cada dibujo a su alto, así que a
    // cada variante se le da el alto que, con la escala del caso más grande, deja la misma escala.
    const cols = new Map();
    let ky = Infinity;
    for (const x of variantes) {
      const g = disponer(x.bloque, anchoSankey, 0, H, anchoNodo);
      if (!g) continue;
      const c = columnas(g);
      cols.set(x.id, c);
      for (const col of c) if (col.suma > 0) ky = Math.min(ky, (H - (col.n - 1) * pad) / col.suma);
    }
    if (!cols.has(v.id) || !Number.isFinite(ky)) throw new Error("La gota: la variante no tiene flujos que dibujar");
    const altoDe = (c) => Math.max(...c.map((col) => ky * col.suma + (col.n - 1) * pad));
    const altoMax = Math.max(...[...cols.values()].map(altoDe));
    const arriba = DISENO.margenArriba;
    const grafo = disponer(v.bloque, anchoSankey, arriba, arriba + altoDe(cols.get(v.id)), anchoNodo);
    const altoSvg = arriba + altoMax + DISENO.margenAbajo;

    const dur = animar && !quieto ? DISENO.transicion : 0;
    const mover = (sel) => (dur > 0 ? sel.transition().duration(dur).ease(d3.easeCubicInOut) : sel);
    const camino = d3.sankeyLinkHorizontal();

    const svg = d3
      .select(caja)
      .selectAll("svg.gota-svg")
      .data([null])
      .join((entra) =>
        entra
          .append("svg")
          .attr("class", "gota-svg")
          .attr("aria-hidden", "true")
          .attr("focusable", "false")
          .attr("data-gotas", quieto ? "omitidas" : "pendientes")
          .call((s) => {
            s.append("g").attr("class", "gota-bandas");
            s.append("g").attr("class", "gota-nodos");
            s.append("g").attr("class", "gota-etiquetas");
            s.append("g").attr("class", "gota-gotitas");
          }),
      )
      .attr("width", W)
      .attr("height", altoSvg)
      .attr("viewBox", [0, 0, W, altoSvg])
      .attr("data-variante", v.id)
      .attr("data-escala", ky)
      .classed("gota-svg--compacto", compacto);

    // Bandas (el ancho de cada banda es su valor en m³ con la escala común)
    svg
      .select(".gota-bandas")
      .selectAll("path")
      .data(grafo.links, (d) => d.id)
      .join(
        (entra) => entra.append("path").attr("d", camino).attr("stroke-width", 0),
        (sigue) => sigue,
        (sale) => sale.call((s) => mover(s).attr("stroke-width", 0).remove()),
      )
      .attr("class", (d) => `gota-banda gota-tipo-${d.tipo}`)
      .attr("data-gota-banda", (d) => d.id)
      .attr("data-valor", (d) => d.value)
      .call((s) =>
        mover(s)
          .attr("d", camino)
          .attr("stroke-width", (d) => Math.max(1, d.width)),
      );

    // Nodos: data-valor es el número del cubo (lo leen las pruebas)
    svg
      .select(".gota-nodos")
      .selectAll("rect")
      .data(grafo.nodes, (d) => d.id)
      .join(
        (entra) =>
          entra
            .append("rect")
            .attr("x", (d) => d.x0)
            .attr("y", (d) => d.y0)
            .attr("width", (d) => d.x1 - d.x0)
            .attr("height", 0),
        (sigue) => sigue,
        (sale) => sale.call((s) => mover(s).attr("height", 0).remove()),
      )
      .attr("class", (d) => `gota-nodo gota-tipo-${d.tipo}`)
      .attr("data-gota-nodo", (d) => d.id)
      .attr("data-valor", (d) => d.valorCubo)
      .call((s) =>
        mover(s)
          .attr("x", (d) => d.x0)
          .attr("y", (d) => d.y0)
          .attr("width", (d) => d.x1 - d.x0)
          .attr("height", (d) => Math.max(1, d.y1 - d.y0)),
      );

    // Etiquetas: nombre y m³ a la derecha de cada nodo (en pantallas angostas, nombre corto y cifra compacta)
    const posicion = (d) => `translate(${d.x1 + DISENO.sepTexto},${(d.y0 + d.y1) / 2})`;
    svg
      .select(".gota-etiquetas")
      .selectAll("text")
      .data(grafo.nodes, (d) => d.id)
      .join(
        (entra) =>
          entra
            .append("text")
            .attr("transform", posicion)
            .call((t) => {
              t.append("tspan").attr("class", "gota-etiqueta-nombre").attr("x", 0).attr("dy", DISENO.renglonArriba);
              t.append("tspan").attr("class", "gota-etiqueta-valor").attr("x", 0).attr("dy", DISENO.renglon);
            }),
        (sigue) => sigue,
        (sale) => sale.remove(),
      )
      .attr("class", "gota-etiqueta")
      .attr("data-gota-etiqueta", (d) => d.id)
      .call((t) => {
        t.select(".gota-etiqueta-nombre").text((d) => (compacto ? d.corto : d.nombre));
        t.select(".gota-etiqueta-valor").text((d) => (compacto ? fmt.m3Corto(d.valorCubo) : fmt.m3(d.valorCubo)));
      })
      .call((s) => mover(s).attr("transform", posicion));
  }

  // Plan B: barras horizontales apiladas; ancho de cada fila contra la mayor salida de presa de las variantes.
  function dibujarBarras(v) {
    if (!caja.querySelector(".gota-pb")) {
      caja.replaceChildren(
        el(
          "div",
          { class: "gota-pb", "aria-hidden": "true" },
          FILAS_BARRAS.map((fila) =>
            el("div", { class: "gota-pb-fila" }, [
              el("span", { class: "gota-pb-rotulo" }, fila.rotulo),
              el(
                "div",
                { class: "gota-pb-pista" },
                el(
                  "div",
                  { class: "gota-pb-barra", "data-fila": fila.id },
                  fila.segmentos.map(([flujo, tipo]) => el("span", { class: `gota-pb-seg gota-tipo-${tipo}`, "data-flujo": flujo })),
                ),
              ),
            ]),
          ),
        ),
      );
    }
    const escala = Math.max(...variantes.map((x) => x.bloque.m3_salen_presa));
    for (const fila of FILAS_BARRAS) {
      const barra = caja.querySelector(`.gota-pb-barra[data-fila="${fila.id}"]`);
      const valores = fila.segmentos.map(([flujo]) => positivo(FLUJOS[flujo](v.bloque)));
      const total = valores.reduce((a, b) => a + b, 0);
      barra.style.width = `${escala > 0 ? (total / escala) * 100 : 0}%`;
      Array.from(barra.children).forEach((seg, i) => {
        seg.style.width = `${total > 0 ? (valores[i] / total) * 100 : 0}%`;
      });
    }
  }

  // --- Gotas (una sola vez, ~3 s) -------------------------------------------
  function lanzarGotas() {
    if (st.gotasLanzadas || quieto || st.destruido || st.plan !== "sankey") return;
    const svg = caja.querySelector("svg.gota-svg");
    if (!svg) return;
    st.gotasLanzadas = true;
    const capa = svg.querySelector(".gota-gotitas");
    const gotas = [];
    d3.select(svg)
      .selectAll(".gota-bandas path")
      .each(function (d) {
        const etapa = d.source.layer === 0 ? TIEMPOS.etapas[0] : TIEMPOS.etapas[1];
        const largo = this.getTotalLength();
        const n = acotar(Math.round(d.width / TIEMPOS.anchoPorGota), 1, TIEMPOS.maxPorBanda);
        for (let i = 0; i < n; i++) {
          const c = document.createElementNS(svg.namespaceURI, "circle");
          c.setAttribute("class", "gota-gotita");
          c.setAttribute("r", TIEMPOS.radio);
          c.setAttribute("opacity", 0);
          capa.append(c);
          gotas.push({
            c,
            camino: this,
            largo,
            dy: ((i + 0.5) / n - 0.5) * d.width * TIEMPOS.dispersion,
            inicio: etapa.inicio + i * TIEMPOS.escalon,
            viaje: etapa.viaje,
          });
        }
      });
    svg.dataset.gotas = "corriendo";
    const t0 = performance.now();
    const cuadro = (ahora) => {
      let vivas = 0;
      for (const g of gotas) {
        if (!g.c.isConnected) continue;
        const p = (ahora - t0 - g.inicio) / g.viaje;
        if (p < 0) {
          vivas++;
          continue;
        }
        if (p >= 1) {
          g.c.remove();
          continue;
        }
        const punto = g.camino.getPointAtLength(suave(p) * g.largo);
        g.c.setAttribute("cx", punto.x);
        g.c.setAttribute("cy", punto.y + g.dy);
        g.c.setAttribute("opacity", Math.min(1, p * TIEMPOS.fundido, (1 - p) * TIEMPOS.fundido));
        vivas++;
      }
      if (vivas && !st.destruido) {
        st.cuadro = requestAnimationFrame(cuadro);
      } else {
        st.cuadro = 0;
        svg.dataset.gotas = "terminadas";
      }
    };
    st.cuadro = requestAnimationFrame(cuadro);
  }

  function detenerGotas() {
    if (st.cuadro) cancelAnimationFrame(st.cuadro);
    st.cuadro = 0;
    const svg = caja?.querySelector("svg.gota-svg");
    if (!svg) return;
    svg.querySelectorAll(".gota-gotita").forEach((c) => c.remove());
    if (svg.dataset.gotas === "corriendo") svg.dataset.gotas = "interrumpidas";
  }

  // --- Observadores ----------------------------------------------------------
  function vigilar() {
    if (estatico) return;
    // Las gotas salen cuando el diagrama entra en pantalla (la sección suele quedar abajo en la ficha).
    if (!quieto && st.plan === "sankey") {
      if (typeof IntersectionObserver === "function") {
        const io = new IntersectionObserver(
          (entradas) => {
            if (entradas.some((e) => e.isIntersecting && e.intersectionRatio >= TIEMPOS.visible)) {
              io.disconnect();
              lanzarGotas();
            }
          },
          { threshold: [0, TIEMPOS.visible, 1] },
        );
        io.observe(caja);
        st.observadores.push(io);
      } else {
        lanzarGotas();
      }
    }
    // Si cambia el ancho de la ficha (giro del teléfono, ventana), se redibuja a la nueva medida, sin animar.
    if (typeof ResizeObserver === "function") {
      const ro = new ResizeObserver(() => {
        if (!contenedor.isConnected) {
          parar();
          return;
        }
        const w = Math.round(caja.clientWidth);
        if (st.plan === "sankey" && w > 0 && Math.abs(w - st.ancho) > 1) dibujarDiagrama(varianteActiva(), false);
      });
      ro.observe(caja);
      st.observadores.push(ro);
    }
  }

  function parar() {
    detenerGotas();
    for (const o of st.observadores) o.disconnect();
    st.observadores = [];
    if (caja && d3?.select && st.plan === "sankey") d3.select(caja).selectAll("*").interrupt();
  }
}
