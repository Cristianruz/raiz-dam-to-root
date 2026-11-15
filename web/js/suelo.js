// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/suelo.js — Perfil de suelo de la parcela y aptitud de cada opción para ese suelo
// (docs/decisiones/2026-11-14_suelo_aptitud.md). Módulo ES independiente, sin dependencias. Todo lo
// que muestra sale de web/data/suelo.json (lo escribe motor/suelo_web.py): este archivo no trae ninguna
// cifra, ningún rango y ningún corte.
//
// Qué exporta (lo conecta app.js; este archivo no toca el resto de la página):
//   cargarSuelo(url = "data/suelo.json") -> Promise<objeto | null>
//       Lee suelo.json. null si el archivo no existe (HTTP 404: la pieza no se ha corrido). Cualquier
//       otra falla (otro código HTTP, red caída, JSON roto) NO es «no existe»: lanza un Error con el
//       detalle, para que la página lo diga (páselo como «error» a las funciones html…).
//   leerSuelo(url) -> Promise<{estado: "ok", datos} | {estado: "ausente" | "error", detalle}>
//       Lo mismo sin lanzar (como leerOpcional de web/js/relieve.js).
//   htmlPerfilDeSuelo({ suelo, id, error }) -> string
//       HTML del perfil de UNA parcela (va una vez por ficha): la textura por su GRUPO (light, medium o heavy,
//       de requisitos.grupos_textura, con su etiqueta) y una barra apilada de arena, limo y arcilla (cada
//       tramo con su trama y los porcentajes en texto); la clase exacta va en un detalle plegado, con la nota
//       de coincidencia de los dos mapas (suelo.coincidencia_textura); pH (con «acid», «neutral» o «alkaline»
//       SOLO si suelo.json trae los cortes en requisitos.escala_ph; si no, el número solo), carbono
//       orgánico y capacidad de intercambio catiónico; nitrógeno y salinidad cuando el mapa los trae y, si
//       no, «not in the map»; la línea fija «Phosphorus, potassium, iron, zinc: needs a soil test»; el rótulo
//       de escala (suelo.rotulo) y la fuente del archivo (perfil.fuente: de ahí sale la resolución del mapa,
//       que no se escribe a mano).
//         suelo null (404)            → «Soil profile: not available yet»
//         error (texto)               → «Soil profile: could not be loaded (…)»
//         suelo.perfil null           → «Soil profile: requested from the data team — not delivered yet»
//                                       (el motivo de suelo.perfil_motivo)
//         la parcela no está, o su fila llega sin ningún valor (el mapa no la cubre)
//                                     → «Soil profile: no soil data for this field»
//   htmlNotaDeZona({ suelo, zonaId, nombreZona }) -> string
//       Mensaje de la zona cuando la mayoría de sus parcelas tiene un pH por encima del óptimo general de la
//       mayoría de los cultivos comparados (suelo.alcalinidad_zona, calculado por el motor); "" si no.
//   aptitudDeOpcion({ suelo, idParcela, idOpcion, nombresCultivo }) -> objeto | null
//       { estado, etiqueta, icono, nota, motivos, avisos } de UNA opción, o null si no hay aptitud que
//       mostrar (sin archivo, bloque en null, parcela sin suelo u opción sin cálculo).
//         estado    «fits» | «tolerated» | «near_limit» | «outside_range» | «no_published_range» (lo calcula
//                   el motor; «near_limit»: fuera del tolerado por menos que suelo.margen_ph)
//         etiqueta  «Fits this soil» | «Tolerated by this soil» | «Near the published limit» | «Outside the
//                   published range» | «No published range»; icono: su símbolo (nunca solo el color)
//         nota      texto del motor cuando la opción no siembra nada («nothing is planted»), o null
//         motivos   [{ cultivo, criterio, estado, texto, fuente }]: «texto» es legible y trae el valor de
//                   la parcela y el rango o la lista con que se comparó; «fuente» es la del rango (null
//                   en los renglones que solo explican: cultivo sin rango, criterio sin dato de la parcela)
//         avisos    [{ elemento, texto, fuente, cultivo }]: avisos de nutrientes cuya condición se cumple
//         nombresCultivo  opcional {id de cultivo: nombre para mostrar}; sin él, el id con espacios
//   htmlAptitud({ suelo, idParcela, idOpcion, nombresCultivo, error }) -> string
//       Fila compacta para el renglón Soil de CADA tarjeta de opción: «Soil fit:» + estado en texto y
//       símbolo, el rótulo de la aptitud (suelo.rotulo_aptitud: rango general y mundial, no un ensayo local) y
//       un <details> «Why?» con los motivos, los avisos de nutrientes y sus fuentes. Si no hay aptitud, una
//       línea que dice por qué (pedido y no entregado, sin suelo para la parcela…). La aptitud nunca descarta
//       ni reordena opciones: es una evidencia más.
//   asegurarHojaSuelo()
//       Enlaza css/suelo.css si la página aún no lo hace (las funciones html… ya la llaman).
//   Funciones puras (las mismas que usa la página; se prueban en tests/suelo.test.js):
//       num, formatoNumero, formatoPct, formatoRango, formatoCapa, formatoQueDistingue, nombreDeClase,
//       nombreDeCultivo, ubicarPh, peorEstado, textoDeMotivo, modeloPerfil, situacionDeAptitud,
//       minusculaInicial, grupoDeTextura, nombrarLista, perfilVacio, modeloNotaDeZona. Textos fijos exportados:
//       ESTADOS_APTITUD, TEXTO_NO_MAPEADO, TEXTO_PEDIDO, TEXTO_NO_EN_MAPA, NOTA_EVIDENCIA, ROTULO_APTITUD.
//
// Reglas de este archivo:
// - Ninguna cifra escrita a mano: valores, rangos, umbrales, cortes de pH, capa, celdas, fuentes y fechas
//   salen de suelo.json. Los números del código son decimales de presentación, no datos.
// - La aptitud es evidencia, no una orden: aquí no se califica ningún cultivo como el mejor ni se
//   aconseja sembrarlo. Un dato que falta se dice; nunca se dibuja como cero.
// - Sin colores en el JS: los colores y las tramas viven en css/suelo.css. Cada estado lleva símbolo y
//   texto, y cada tramo de la barra, su trama y su porcentaje en texto: nada depende solo del color.
// - Interfaz en inglés; comentarios en español. No se promete ahorro; la herramienta apoya y no
//   sustituye el juicio del agricultor ni del técnico.

const LOCALE = "en-US";
const HOJA = "../css/suelo.css"; // relativa a este módulo
const URL_SUELO = "data/suelo.json";
const HTTP_NO_EXISTE = 404;

// Decimales de presentación (no son datos ni cambian el dato de suelo.json).
const DECIMALES_VALOR = 2; // pH, g/kg, cmol(+)/kg y dS/m
const DECIMALES_PCT = 1; // arena, limo y arcilla
const DECIMALES_MAX = 6; // tope al separar un valor de la cota con la que se compara

// ---------------------------------------------------------------------------
// Textos de la interfaz (sin números)
// ---------------------------------------------------------------------------
const TITULO_PERFIL = "Soil profile";
const TITULO_APTITUD = "Soil fit";
export const TEXTO_NO_MAPEADO = "Phosphorus, potassium, iron, zinc: needs a soil test";
// Lo que el mapa de suelo podría traer y no trae para la parcela (nitrógeno, salinidad, CIC).
export const TEXTO_NO_EN_MAPA = "not in the map";
// Respaldo del rótulo de la aptitud si suelo.json no trae «rotulo_aptitud» (lo publica motor/suelo_web.py).
export const ROTULO_APTITUD = "General published range (FAO ECOCROP, worldwide), not a local trial";
export const TEXTO_PEDIDO = "requested from the data team — not delivered yet";
const TEXTO_SIN_ARCHIVO = "not available yet";
const TEXTO_SIN_PARCELA = "no soil data for this field";
const TEXTO_SIN_OPCION = "not computed for this option";
const TEXTO_NO_CARGO = "could not be loaded";
const TEXTO_SIN_FRACCIONES = "Sand, silt and clay shares: no data";
const TEXTO_NADA_SEMBRADO = "Nothing is planted, so there is no crop to compare with this soil";
const ROTULO_RESPALDO = "Regional soil map; not a soil test"; // si suelo.json no trajera «rotulo»
export const NOTA_EVIDENCIA =
  "Evidence from a regional soil map and published crop ranges, to weigh next to water and commitment. " +
  "It supports and does not replace the judgment of the farmer or the technician.";

// Estado de aptitud (lo calcula motor/suelo_web.py). «nivel» ordena de mejor a peor; el estado sin
// rango no entra en esa escala. El símbolo acompaña siempre al texto.
export const ESTADOS_APTITUD = {
  fits: { etiqueta: "Fits this soil", icono: "✓", nivel: 0 },
  tolerated: { etiqueta: "Tolerated by this soil", icono: "≈", nivel: 1 },
  near_limit: { etiqueta: "Near the published limit", icono: "△", nivel: 2 },
  outside_range: { etiqueta: "Outside the published range", icono: "▲", nivel: 3 },
  no_published_range: { etiqueta: "No published range", icono: "○", nivel: null },
};
// Grupos de textura de ECOCROP, en el orden en que se nombran (las llaves de requisitos.grupos_textura).
const NOMBRES_GRUPO = { light: "light", medium: "medium", heavy: "heavy" };
const SIN_RANGO = "no_published_range";
const NO_SIEMBRA = "descanso"; // como nombra el cubo la opción que no siembra (motor/esquemas.py, NO_SIEMBRA)
const ICONO_PENDIENTE = "○";
const ICONO_AVISO = "⚑";

// Clase de pH según los cortes de suelo.json (requisitos.escala_ph); sin cortes no se dice ninguna.
const CLASES_PH = { acido: "acid", neutro: "neutral", alcalino: "alkaline" };

// Fracciones de la textura, en el orden de la barra.
const FRACCIONES = [
  { llave: "arena_pct", clase: "arena", nombre: "Sand" },
  { llave: "limo_pct", clase: "limo", nombre: "Silt" },
  { llave: "arcilla_pct", clase: "arcilla", nombre: "Clay" },
];

// Criterio que tiene rango publicado pero no se pudo comparar: la parcela no trae ese valor.
const SIN_DATO_DE_PARCELA = {
  ph: "pH not compared — not in the map for this field",
  textura: "texture not compared — not in the map for this field",
  salinidad: "salinity not compared — not in the map",
};

// ---------------------------------------------------------------------------
// Utilidades y formato (funciones puras)
// ---------------------------------------------------------------------------
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Número finito o null (null, "", booleanos, NaN e infinitos son «sin dato»). */
export function num(v) {
  if (v == null || v === "" || typeof v === "boolean") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const formatos = new Map();
function formateador(decimales) {
  if (!formatos.has(decimales)) {
    formatos.set(decimales, new Intl.NumberFormat(LOCALE, { maximumFractionDigits: decimales, useGrouping: false }));
  }
  return formatos.get(decimales);
}

/** Número de los datos para leer, con hasta `decimales` decimales y sin ceros de relleno; «—» si no es número. */
export function formatoNumero(v, decimales = DECIMALES_VALOR) {
  const n = num(v);
  return n == null ? "—" : formateador(decimales).format(n);
}

/** Porcentaje que YA viene en por ciento (arena_pct): el número con su signo «%»; «—» si no es número. */
export function formatoPct(v) {
  const n = num(v);
  return n == null ? "—" : `${formateador(DECIMALES_PCT).format(n)}%`;
}

/** Rango [min, max] como «min–max» (un solo valor si son iguales); «—» si no es un par de números. */
export function formatoRango(par, decimales = DECIMALES_VALOR) {
  if (!Array.isArray(par)) return "—";
  const [a, b] = [num(par[0]), num(par[1])];
  if (a == null || b == null) return "—";
  return a === b ? formatoNumero(a, decimales) : `${formatoNumero(a, decimales)}–${formatoNumero(b, decimales)}`;
}

/** Capa «a-b» en centímetros como «a–b cm»; null si el texto no tiene esa forma. */
export function formatoCapa(texto) {
  const m = /^(\d+)-(\d+)$/.exec(String(texto ?? "").trim());
  return m ? `${m[1]}–${m[2]} cm` : null;
}

/**
 * Un valor escrito con los decimales que hagan falta para que NO se lea igual que una cota de la que
 * es distinto (un pH apenas fuera del rango no debe escribirse como el borde del rango). Empieza en
 * `decimales` y sube hasta DECIMALES_MAX.
 */
export function formatoQueDistingue(v, cotas = [], decimales = DECIMALES_VALOR) {
  const n = num(v);
  if (n == null) return "—";
  const otras = cotas.map(num).filter((c) => c != null && c !== n);
  let d = decimales;
  while (d < DECIMALES_MAX && otras.some((c) => formatoNumero(c, d) === formatoNumero(n, d))) d += 1;
  return formatoNumero(n, d);
}

function capital(texto) {
  const t = String(texto ?? "");
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

/** El texto con su primera letra en minúscula (para escribirlo después de «Soil profile: »). */
export function minusculaInicial(texto) {
  const t = String(texto ?? "");
  return t ? t[0].toLowerCase() + t.slice(1) : t;
}

/** Clase de textura para mostrar: «sandy clay loam» → «Sandy clay loam»; null si no hay clase. */
export function nombreDeClase(clase) {
  const t = typeof clase === "string" ? clase.trim() : "";
  return t ? capital(t) : null;
}

/** Nombre de un cultivo para mostrar: el de `nombres` si lo trae; si no, su id con espacios. */
export function nombreDeCultivo(id, nombres) {
  const propio = nombres && typeof nombres === "object" ? nombres[id] : null;
  return typeof propio === "string" && propio.trim() ? propio.trim() : String(id ?? "").replace(/_/g, " ");
}

function plural(n, uno, varios) {
  return n === 1 ? uno : varios;
}

/**
 * Dónde cae un pH según los cortes de suelo.json (requisitos.escala_ph): «acid» por debajo de
 * acido_menor_que, «alkaline» por encima de alcalino_mayor_que y «neutral» entre los dos. null si no
 * hay pH o si el JSON no trae los dos cortes: entonces la ficha escribe solo el número.
 */
export function ubicarPh(ph, escala) {
  const valor = num(ph);
  const acido = num(escala?.acido_menor_que);
  const alcalino = num(escala?.alcalino_mayor_que);
  if (valor == null || acido == null || alcalino == null || acido > alcalino) return null;
  if (valor < acido) return CLASES_PH.acido;
  if (valor > alcalino) return CLASES_PH.alcalino;
  return CLASES_PH.neutro;
}

/**
 * Grupo de textura (light, medium o heavy) de una clase según requisitos.grupos_textura ({valor: {grupo:
 * [clases]}, etiqueta, fuente}); null si no hay grupos o la clase no está en ninguno.
 */
export function grupoDeTextura(clase, grupos) {
  const valor = grupos && typeof grupos === "object" ? grupos.valor : null;
  if (!valor || typeof valor !== "object" || typeof clase !== "string") return null;
  for (const [grupo, clases] of Object.entries(valor)) {
    if (Array.isArray(clases) && clases.includes(clase)) return NOMBRES_GRUPO[grupo] ?? grupo;
  }
  return null;
}

/**
 * Una lista de clases dicha por sus grupos cuando la lista es la unión EXACTA de grupos completos («medium,
 * light»); si no, las clases tal cual. «none listed» si está vacía.
 */
export function nombrarLista(valores, grupos) {
  if (!Array.isArray(valores) || !valores.length) return "none listed";
  const valor = grupos && typeof grupos === "object" ? grupos.valor : null;
  if (valor && typeof valor === "object") {
    const conjunto = new Set(valores);
    const enteros = Object.entries(valor).filter(([, clases]) => Array.isArray(clases) && clases.length && clases.every((c) => conjunto.has(c)));
    const cubiertas = new Set(enteros.flatMap(([, clases]) => clases));
    if (enteros.length && cubiertas.size === conjunto.size && [...conjunto].every((c) => cubiertas.has(c))) {
      return `${enteros.map(([g]) => NOMBRES_GRUPO[g] ?? g).join(", ")} ${plural(enteros.length, "group", "groups")}`;
    }
  }
  return valores.join(", ");
}

/** True si la fila de la parcela no trae ningún valor de suelo (el mapa no la cubre: P0316 en los datos reales). */
export function perfilVacio(p) {
  if (!p || typeof p !== "object") return true;
  const campos = ["arena_pct", "limo_pct", "arcilla_pct", "ph", "carbono_organico_g_kg", "nitrogeno_g_kg", "cic_cmol_kg", "salinidad_ce_ds_m"];
  return campos.every((k) => num(p[k]) == null) && !(typeof p.clase_textura === "string" && p.clase_textura.trim());
}

/** El peor de varios estados de aptitud (outside_range > near_limit > tolerated > fits); sin ninguno en esa escala, «no_published_range». */
export function peorEstado(estados) {
  let peor = null;
  for (const e of estados ?? []) {
    const nivel = ESTADOS_APTITUD[e]?.nivel;
    if (nivel != null && (peor == null || nivel > ESTADOS_APTITUD[peor].nivel)) peor = e;
  }
  return peor ?? SIN_RANGO;
}

/**
 * Texto legible de UN motivo de suelo.json ({criterio, estado, valor_parcela, rango_o_lista}): dice el
 * valor de la parcela y el rango o la lista con que se comparó. La fuente va aparte (motivo.fuente).
 * Con un estado que este módulo no conoce no afirma nada: escribe solo el valor y con qué se comparó.
 */
export function textoDeMotivo(motivo, { margen = null, grupos = null } = {}) {
  const m = motivo ?? {};
  const r = m.rango_o_lista ?? {};
  if (m.criterio === "ph") {
    const cotas = [...(Array.isArray(r.optimo) ? r.optimo : []), ...(Array.isArray(r.tolerado) ? r.tolerado : [])];
    const valor = `pH ${formatoQueDistingue(m.valor_parcela, cotas)}`;
    const optimo = formatoRango(r.optimo);
    const tolerado = formatoRango(r.tolerado);
    if (m.estado === "fits") return `${valor} is within the optimal range (${optimo})`;
    if (m.estado === "tolerated") return `${valor} is outside the optimal range (${optimo}) and within the tolerated range (${tolerado})`;
    if (m.estado === "near_limit") {
      const cuanto = num(margen?.valor ?? margen);
      const etiqueta = margen?.etiqueta ? ` (${margen.etiqueta})` : "";
      return `${valor} is just outside the tolerated range (${tolerado})` +
        (cuanto != null ? `, by less than the map margin of ${formatoNumero(cuanto)}${etiqueta}` : "");
    }
    if (m.estado === "outside_range") return `${valor} is outside the tolerated range (${tolerado})`;
    return `${valor}, compared with the optimal range (${optimo}) and the tolerated range (${tolerado})`;
  }
  if (m.criterio === "textura") {
    const grupo = grupoDeTextura(m.valor_parcela, grupos);
    const clase = `${nombreDeClase(m.valor_parcela) ?? "This"} texture${grupo ? ` (${grupo} group)` : ""}`;
    const apta = nombrarLista(r.apta, grupos);
    const limitante = nombrarLista(r.limitante, grupos);
    if (m.estado === "fits") return `${clase} is on the suitable list (${apta})`;
    if (m.estado === "outside_range") return `${clase} is on the limiting list (${limitante})`;
    if (m.estado === "tolerated") return `${clase} is on neither list (suitable: ${apta}; limiting: ${limitante})`;
    return `${clase}, compared with the lists (suitable: ${apta}; limiting: ${limitante})`;
  }
  if (m.criterio === "salinidad") {
    const valor = `Salinity ${formatoQueDistingue(m.valor_parcela, [r.umbral_ds_m])} dS/m`;
    const umbral = `${formatoNumero(r.umbral_ds_m)} dS/m`;
    if (m.estado === "fits") return `${valor} is at or below the threshold (${umbral})`;
    if (m.estado === "outside_range") return `${valor} is above the threshold (${umbral})`;
    return `${valor}, compared with the threshold (${umbral})`;
  }
  return `${m.criterio ?? "criterion"}: ${ESTADOS_APTITUD[m.estado]?.etiqueta ?? "no data"}`;
}

// ---------------------------------------------------------------------------
// Lectura de suelo.json
// ---------------------------------------------------------------------------
/**
 * Lee suelo.json sin lanzar. Distingue «no existe» de «no se pudo leer»:
 *   {estado: "ok", datos} · {estado: "ausente", detalle} (HTTP 404: la pieza no se ha corrido)
 *   {estado: "error", detalle} (otro código HTTP, red caída, JSON inválido o contenido que no es un objeto)
 */
export async function leerSuelo(url = URL_SUELO) {
  let resp;
  try {
    resp = await fetch(url, { cache: "no-cache" });
  } catch (err) {
    return { estado: "error", detalle: `network error: ${err?.message ?? err}` };
  }
  if (resp.status === HTTP_NO_EXISTE) return { estado: "ausente", detalle: `HTTP ${resp.status}` };
  if (!resp.ok) return { estado: "error", detalle: `HTTP ${resp.status}` };
  let datos;
  try {
    datos = await resp.json();
  } catch (err) {
    return { estado: "error", detalle: `invalid JSON: ${err?.message ?? err}` };
  }
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return { estado: "error", detalle: "unexpected content" };
  return { estado: "ok", datos };
}

/** Lee suelo.json: el objeto, o null si no existe (404). Otra falla lanza un Error con su detalle. */
export async function cargarSuelo(url = URL_SUELO) {
  const lectura = await leerSuelo(url);
  if (lectura.estado === "ok") return lectura.datos;
  if (lectura.estado === "ausente") return null;
  throw new Error(`${url}: ${lectura.detalle}`);
}

/** Inserta css/suelo.css (relativa a este módulo) si la página aún no la enlaza. Sin documento, no hace nada. */
export function asegurarHojaSuelo() {
  if (typeof document === "undefined") return;
  const yaEsta = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) =>
    (l.getAttribute("href") || "").endsWith("suelo.css"),
  );
  if (yaEsta) return;
  const enlace = document.createElement("link");
  enlace.rel = "stylesheet";
  enlace.href = new URL(HOJA, import.meta.url).href;
  document.head.appendChild(enlace);
}

// ---------------------------------------------------------------------------
// Perfil de suelo de la parcela
// ---------------------------------------------------------------------------
/**
 * Lo que la ficha dice del suelo de una parcela, sin HTML:
 *   {situacion: "sin_archivo" | "error" | "pendiente" | "sin_parcela", motivo}
 *   {situacion: "ok", clase, fracciones: [{clase, nombre, valor, texto}] | null, ph: {texto, clase} | null,
 *    datos: [{etiqueta, texto}], capa, celdas, rotulo, fuente, fecha, archivo, idioma}
 * «motivo» es el texto que va después de «Soil profile: ».
 */
export function modeloPerfil({ suelo, id, error } = {}) {
  if (error) return { situacion: "error", motivo: `${TEXTO_NO_CARGO} (${error})` };
  if (!suelo || typeof suelo !== "object") return { situacion: "sin_archivo", motivo: TEXTO_SIN_ARCHIVO };
  const perfil = suelo.perfil;
  if (!perfil || typeof perfil !== "object") {
    return { situacion: "pendiente", motivo: minusculaInicial(suelo.perfil_motivo || suelo.motivo_pedido || TEXTO_PEDIDO) };
  }
  const p = perfil.parcelas?.[id];
  if (!p || typeof p !== "object" || perfilVacio(p)) return { situacion: "sin_parcela", motivo: TEXTO_SIN_PARCELA };

  const valores = FRACCIONES.map((f) => ({ clase: f.clase, nombre: f.nombre, valor: num(p[f.llave]), texto: formatoPct(p[f.llave]) }));
  const fracciones = valores.every((f) => f.valor != null && f.valor >= 0) ? valores : null;
  const ph = num(p.ph);
  const datos = [];
  // Con dato: el valor y su unidad. Sin dato: «not in the map» (nunca un cero), marcado para el estilo.
  const agregar = (etiqueta, valor, unidad) => {
    const hay = num(valor) != null;
    datos.push({ etiqueta, texto: hay ? `${formatoNumero(valor)} ${unidad}` : TEXTO_NO_EN_MAPA, falta: !hay });
  };
  agregar("Organic carbon", p.carbono_organico_g_kg, "g/kg");
  agregar("Total nitrogen", p.nitrogeno_g_kg, "g/kg");
  agregar("Cation exchange capacity", p.cic_cmol_kg, "cmol(+)/kg");
  agregar("Salinity (electrical conductivity)", p.salinidad_ce_ds_m, "dS/m");
  const celdas = num(p.n_celdas);
  const grupos = suelo.requisitos?.grupos_textura ?? null;
  const coincide = suelo.coincidencia_textura;
  return {
    situacion: "ok",
    clase: nombreDeClase(p.clase_textura),
    grupo: grupoDeTextura(p.clase_textura, grupos),
    grupoEtiqueta: grupos?.etiqueta || null,
    grupoFuente: grupos?.fuente || null,
    coincidencia: coincide && num(coincide.valor) != null ? { valor: num(coincide.valor), etiqueta: coincide.etiqueta || null, fuente: coincide.fuente || null } : null,
    fracciones,
    ph: ph == null ? null : { texto: formatoNumero(ph), clase: ubicarPh(ph, suelo.requisitos?.escala_ph) },
    datos,
    capa: formatoCapa(p.profundidad_cm ?? perfil.profundidad_cm),
    celdas: celdas != null && celdas > 0 ? celdas : null,
    rotulo: suelo.rotulo || ROTULO_RESPALDO,
    fuente: perfil.fuente || null,
    fecha: perfil.fecha || null,
    archivo: perfil.archivo || null,
    idioma: suelo.idioma_fuentes || null,
  };
}

function htmlPendiente(clase, titulo, motivo, situacion) {
  return (
    `<p class="${clase} suelo-pendiente" data-situacion="${esc(situacion)}">` +
    `<span class="suelo-icono" aria-hidden="true">${ICONO_PENDIENTE}</span> ` +
    `<span class="suelo-pendiente-que">${esc(titulo)}:</span> ${esc(motivo)}</p>`
  );
}

function htmlBarra(fracciones) {
  const descripcion = fracciones.map((f) => `${f.nombre} ${f.texto}`).join(", ");
  const tramos = fracciones
    .filter((f) => f.valor > 0)
    .map((f) => `<span class="suelo-tramo suelo-tramo--${f.clase}" style="flex-grow:${esc(String(f.valor))}"></span>`)
    .join("");
  const leyenda = fracciones
    .map(
      (f) =>
        `<li><span class="suelo-clave suelo-tramo--${f.clase}" aria-hidden="true"></span>${esc(f.nombre)} <strong>${esc(f.texto)}</strong></li>`,
    )
    .join("");
  return (
    `<div class="suelo-barra" role="img" aria-label="${esc(`Texture shares: ${descripcion}`)}">${tramos}</div>` +
    `<ul class="suelo-leyenda">${leyenda}</ul>`
  );
}

const FORMATO_PCT = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0 });

/**
 * Textura por su grupo (light / medium / heavy, con la etiqueta del reparto) y, plegada, la clase exacta con la
 * nota de coincidencia de los dos mapas. Sin grupos: la clase exacta a la vista, como antes.
 */
function htmlTextura(m) {
  if (!m.grupo) return `<p class="suelo-textura">Texture: <strong>${esc(m.clase ?? "no data")}</strong></p>`;
  const etiqueta = m.grupoEtiqueta ? ` <span class="suelo-etiqueta">${esc(m.grupoEtiqueta)}</span>` : "";
  const c = m.coincidencia;
  const nota = c
    ? `<p class="suelo-coincidencia">The two global soil maps compared give the same exact class in ${esc(FORMATO_PCT.format(c.valor))} of the fields${c.etiqueta ? ` (${esc(c.etiqueta)})` : ""}; elsewhere they differ, so read the group, not the exact class.` +
      (c.fuente ? ` <span class="suelo-fuente">Source: <span lang="es">${esc(c.fuente)}</span></span>` : "") + "</p>"
    : "";
  return (
    `<p class="suelo-textura">Texture group: <strong>${esc(m.grupo)}</strong>${etiqueta}</p>` +
    '<details class="suelo-clase-exacta"><summary>Exact texture class</summary>' +
    `<p>${esc(m.clase ?? "no data")} (USDA class).</p>${nota}` +
    (m.grupoFuente ? `<p class="suelo-fuente">Groups: <span lang="es">${esc(m.grupoFuente)}</span></p>` : "") +
    "</details>"
  );
}

/**
 * Mensaje de la zona (suelo.alcalinidad_zona, que calcula el motor): {n_con_ph, n_sobre_optimo, n_cultivos} si
 * la mayoría de las parcelas de la zona tiene un pH por encima del óptimo general de la mayoría de los cultivos;
 * null en otro caso (sin dato, o sin mayoría).
 */
export function modeloNotaDeZona({ suelo, zonaId } = {}) {
  const z = suelo?.alcalinidad_zona?.[zonaId];
  if (!z || z.mayoria !== true) return null;
  const [con, sobre, cultivos] = [z.n_con_ph, z.n_sobre_optimo, z.n_cultivos].map(num);
  if (con == null || sobre == null || cultivos == null) return null;
  return { n_con_ph: con, n_sobre_optimo: sobre, n_cultivos: cultivos };
}

/** HTML del mensaje de zona (ver modeloNotaDeZona); "" si no toca. */
export function htmlNotaDeZona({ suelo, zonaId, nombreZona } = {}) {
  const m = modeloNotaDeZona({ suelo, zonaId });
  if (!m) return "";
  const zona = nombreZona ? ` in ${nombreZona}` : " in this area";
  return (
    '<p class="suelo-nota-zona" data-zona="' + esc(zonaId) + '"><span class="suelo-icono" aria-hidden="true">' + ICONO_AVISO + "</span> " +
    `<strong>Area note:</strong> ${esc(formatoNumero(m.n_sobre_optimo))} of ${esc(formatoNumero(m.n_con_ph))} mapped fields${esc(zona)} ` +
    `have a soil pH above the general optimal range of most of the ${esc(formatoNumero(m.n_cultivos))} crops compared here. ` +
    "Crops already grown in the area share this, so read the soil fit as evidence to weigh, not as a filter.</p>"
  );
}

/** HTML del perfil de suelo de una parcela (ver el encabezado del archivo). */
export function htmlPerfilDeSuelo({ suelo, id, error } = {}) {
  asegurarHojaSuelo();
  const m = modeloPerfil({ suelo, id, error });
  if (m.situacion !== "ok") return htmlPendiente("suelo-perfil", TITULO_PERFIL, m.motivo, m.situacion);

  const renglones = [];
  if (m.ph) {
    renglones.push(
      `<div><dt>pH (in water)</dt><dd><strong>${esc(m.ph.texto)}</strong>` +
        (m.ph.clase ? ` <span class="suelo-ph-clase">${esc(m.ph.clase)}</span>` : "") +
        "</dd></div>",
    );
  }
  for (const d of m.datos) {
    renglones.push(`<div${d.falta ? ' data-falta="si"' : ""}><dt>${esc(d.etiqueta)}</dt><dd>${d.falta ? esc(d.texto) : `<strong>${esc(d.texto)}</strong>`}</dd></div>`);
  }
  const celdas = m.celdas == null ? "" : ` Mean of ${esc(formatoNumero(m.celdas))} map ${plural(m.celdas, "cell", "cells")} inside the field.`;
  const cita = [m.archivo, m.fecha].filter(Boolean).join(", ");
  // La línea de fuente de la entrega es larga (producto, versión, capas, cómo se promedió): va plegada, con el
  // archivo y la fecha a la vista en el resumen.
  const fuente = m.fuente
    ? `<details class="suelo-fuente-detalle"><summary>Source${cita ? ` (${esc(cita)})` : ""}</summary>` +
      `<p class="suelo-fuente">Source: <span${m.idioma ? ` lang="${esc(m.idioma)}"` : ""}>${esc(m.fuente)}</span>${cita ? ` (${esc(cita)})` : ""}</p></details>`
    : `<p class="suelo-fuente">Source: not stated in the delivery${cita ? ` (${esc(cita)})` : ""}</p>`;
  return (
    '<div class="suelo-perfil" data-situacion="ok">' +
    `<p class="suelo-perfil-titulo"><span class="suelo-titulo">${TITULO_PERFIL}</span>` +
    (m.capa ? ` <span class="suelo-capa">(${esc(m.capa)} layer)</span>` : "") +
    "</p>" +
    htmlTextura(m) +
    (m.fracciones ? htmlBarra(m.fracciones) : `<p class="suelo-sin-dato">${TEXTO_SIN_FRACCIONES}</p>`) +
    (renglones.length ? `<dl class="suelo-datos">${renglones.join("")}</dl>` : "") +
    `<p class="suelo-no-mapeado">${TEXTO_NO_MAPEADO}</p>` +
    `<p class="suelo-escala">${esc(m.rotulo)}.${celdas}</p>` +
    fuente +
    "</div>"
  );
}

// ---------------------------------------------------------------------------
// Aptitud de una opción
// ---------------------------------------------------------------------------
/**
 * Por qué hay o no aptitud que mostrar para una opción, sin HTML:
 *   {situacion: "ok", entrada} · {situacion: "sin_archivo" | "error" | "pendiente" | "sin_parcela" | "sin_opcion", motivo}
 * «motivo» es el texto que va después de «Soil fit: ».
 */
export function situacionDeAptitud({ suelo, idParcela, idOpcion, error } = {}) {
  if (error) return { situacion: "error", motivo: `${TEXTO_NO_CARGO} (${error})` };
  if (!suelo || typeof suelo !== "object") return { situacion: "sin_archivo", motivo: TEXTO_SIN_ARCHIVO };
  if (!suelo.aptitud || typeof suelo.aptitud !== "object") {
    return { situacion: "pendiente", motivo: minusculaInicial(suelo.aptitud_motivo || suelo.motivo_pedido || TEXTO_PEDIDO) };
  }
  const parcela = suelo.aptitud[idParcela];
  if (!parcela || typeof parcela !== "object") return { situacion: "sin_parcela", motivo: TEXTO_SIN_PARCELA };
  const entrada = parcela[idOpcion];
  if (!entrada || typeof entrada !== "object") return { situacion: "sin_opcion", motivo: TEXTO_SIN_OPCION };
  return { situacion: "ok", entrada };
}

/** Aptitud de una opción lista para mostrar, o null si no hay (ver el encabezado del archivo). */
export function aptitudDeOpcion({ suelo, idParcela, idOpcion, nombresCultivo } = {}) {
  const s = situacionDeAptitud({ suelo, idParcela, idOpcion });
  if (s.situacion !== "ok") return null;
  const entrada = s.entrada;
  const porCultivo = Array.isArray(entrada.por_cultivo) ? entrada.por_cultivo.filter((c) => c && typeof c === "object") : [];
  // El estado lo calcula el motor; si faltara o no fuera uno conocido, es el peor de sus cultivos.
  const estado = ESTADOS_APTITUD[entrada.estado] ? entrada.estado : peorEstado(porCultivo.map((c) => c.estado));
  // Con varios cultivos sembrados, cada renglón dice de cuál habla.
  const sembrados = porCultivo.filter((c) => c.cultivo !== NO_SIEMBRA).length;
  const variosCultivos = sembrados > 1;
  const contexto = { margen: suelo.margen_ph ?? null, grupos: suelo.requisitos?.grupos_textura ?? null };
  const motivos = [];
  for (const c of porCultivo) {
    // «descanso» dentro de una secuencia que sí siembra: no hay nada que decir de él (los demás cultivos hablan).
    if (c.cultivo === NO_SIEMBRA && sembrados > 0) continue;
    const prefijo = variosCultivos && c.cultivo !== NO_SIEMBRA ? `${capital(nombreDeCultivo(c.cultivo, nombresCultivo))}: ` : "";
    const frase = (texto) => (prefijo ? prefijo + minusculaPrudente(texto) : mayusculaPrudente(texto));
    for (const m of Array.isArray(c.motivos) ? c.motivos : []) {
      motivos.push({ cultivo: c.cultivo, criterio: m.criterio ?? null, estado: m.estado ?? null, texto: frase(textoDeMotivo(m, contexto)), fuente: m.fuente || null });
    }
    for (const criterio of Array.isArray(c.sin_dato_de_parcela) ? c.sin_dato_de_parcela : []) {
      if (SIN_DATO_DE_PARCELA[criterio]) motivos.push({ cultivo: c.cultivo, criterio, estado: null, texto: frase(SIN_DATO_DE_PARCELA[criterio]), fuente: null });
    }
    if (c.nota) {
      const texto = c.cultivo === NO_SIEMBRA ? TEXTO_NADA_SEMBRADO : frase(c.nota);
      motivos.push({ cultivo: c.cultivo, criterio: null, estado: c.estado ?? null, texto, fuente: null });
    }
  }
  if (!motivos.length && entrada.nota) motivos.push({ cultivo: null, criterio: null, estado, texto: TEXTO_NADA_SEMBRADO, fuente: null });
  // Avisos con el mismo texto y la misma fuente (p. ej. un estudio que habla de varios elementos) van juntos,
  // con sus elementos en una lista: no se repite la misma frase una vez por elemento.
  const avisos = [];
  for (const a of Array.isArray(entrada.avisos_nutrientes) ? entrada.avisos_nutrientes : []) {
    if (!a || typeof a !== "object" || !a.texto_en) continue;
    const igual = avisos.find((x) => x.texto === a.texto_en && x.fuente === (a.fuente || null));
    if (igual) {
      if (a.elemento && !igual.elementos.includes(a.elemento)) igual.elementos.push(a.elemento);
      igual.elemento = igual.elementos.join(", ");
      continue;
    }
    avisos.push({ elemento: a.elemento ?? null, elementos: a.elemento ? [a.elemento] : [], texto: a.texto_en, fuente: a.fuente || null, cultivo: a.cultivo ?? null });
  }
  return {
    estado,
    etiqueta: ESTADOS_APTITUD[estado].etiqueta,
    icono: ESTADOS_APTITUD[estado].icono,
    nota: entrada.nota || null,
    motivos,
    avisos,
  };
}

/** Tras «Cultivo: », la frase empieza en minúscula; «pH» se escribe siempre igual. */
function minusculaPrudente(texto) {
  const t = String(texto ?? "");
  return t.startsWith("pH") ? t : minusculaInicial(t);
}

/** Al inicio del renglón, la frase empieza en mayúscula; «pH» se escribe siempre igual. */
function mayusculaPrudente(texto) {
  const t = String(texto ?? "");
  return t.startsWith("pH") ? t : capital(t);
}

function htmlFuente(fuente) {
  return fuente ? ` <span class="suelo-fuente">Source: ${esc(fuente)}</span>` : "";
}

/** Fila compacta de aptitud de una opción, con su «Why?» (ver el encabezado del archivo). */
export function htmlAptitud({ suelo, idParcela, idOpcion, nombresCultivo, error } = {}) {
  asegurarHojaSuelo();
  const s = situacionDeAptitud({ suelo, idParcela, idOpcion, error });
  if (s.situacion !== "ok") return htmlPendiente("suelo-aptitud", TITULO_APTITUD, s.motivo, s.situacion);
  const a = aptitudDeOpcion({ suelo, idParcela, idOpcion, nombresCultivo });
  // La opción que no siembra nada: no hay cultivo que comparar; se dice en una línea, sin insignia ni rótulo.
  if (a.nota && !a.motivos.some((m) => m.cultivo && m.cultivo !== NO_SIEMBRA)) {
    return (
      `<div class="suelo-aptitud" data-situacion="ok" data-estado="${esc(a.estado)}" data-nada-sembrado="si">` +
      `<p class="suelo-aptitud-fila"><span class="suelo-titulo">${TITULO_APTITUD}:</span> ${esc(minusculaInicial(TEXTO_NADA_SEMBRADO))}</p></div>`
    );
  }
  const motivos = a.motivos
    .map((m) => {
      const icono = ESTADOS_APTITUD[m.estado]?.icono;
      return (
        `<li${m.estado ? ` data-estado="${esc(m.estado)}"` : ""}>` +
        (icono ? `<span class="suelo-icono" aria-hidden="true">${icono}</span> ` : "") +
        `${esc(m.texto)}.${htmlFuente(m.fuente)}</li>`
      );
    })
    .join("");
  const avisos = a.avisos
    .map((n) => `<li>${n.elemento ? `<strong>${esc(n.elemento)}</strong>: ` : ""}${esc(n.texto)}${htmlFuente(n.fuente)}</li>`)
    .join("");
  const marca = a.avisos.length
    ? ` <span class="suelo-marca-aviso"><span class="suelo-icono" aria-hidden="true">${ICONO_AVISO}</span> ` +
      `${plural(a.avisos.length, "Nutrient note", "Nutrient notes")} inside</span>`
    : "";
  return (
    `<div class="suelo-aptitud" data-situacion="ok" data-estado="${esc(a.estado)}">` +
    `<p class="suelo-aptitud-fila"><span class="suelo-titulo">${TITULO_APTITUD}:</span> ` +
    `<span class="suelo-insignia suelo-insignia--${esc(a.estado)}"><span class="suelo-icono" aria-hidden="true">${a.icono}</span> ${esc(a.etiqueta)}</span>` +
    `${marca}</p>` +
    `<p class="suelo-aptitud-rotulo">${esc(suelo.rotulo_aptitud || ROTULO_APTITUD)}</p>` +
    '<details class="suelo-porque"><summary>Why?<span class="suelo-solo-lector"> Soil fit of this option</span></summary>' +
    (motivos ? `<ul class="suelo-motivos">${motivos}</ul>` : "") +
    (avisos ? `<p class="suelo-avisos-titulo">${plural(a.avisos.length, "Nutrient note", "Nutrient notes")}</p><ul class="suelo-avisos">${avisos}</ul>` : "") +
    `<p class="suelo-evidencia">${NOTA_EVIDENCIA}</p>` +
    "</details></div>"
  );
}
