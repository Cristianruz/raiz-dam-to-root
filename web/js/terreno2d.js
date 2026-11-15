// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/terreno2d.js — Relieve del mapa plano: sombreado, rampa de elevación, velo fuera de las zonas piloto,
// barra de escala y su leyenda. Módulo ES, sin dependencias.
//
// QUÉ EXPORTA (lo conecta app.js con una llamada; este archivo no toca las capas ni los controles de la aplicación):
//   agregarTerreno2D(mapa, ctx) -> controlador
//     mapa   instancia de maplibregl.Map ya creada y con su estilo cargado (la de la aplicación), o null.
//     ctx    { gemelo, cubo, nombreZona, junto, contenedor, encendido, maplibre }
//       gemelo       contenido de web/data/gemelo.json (terreno.zonas.<id>: teselas, bounds, elev_min_m, elev_max_m;
//                    terreno.encoding, tileSize, minzoom, maxzoom, fuente), o null si no se pudo leer.
//       cubo         cubo.json: de cubo.zonas.<id>.bbox salen los rectángulos de las zonas piloto (el velo).
//       nombreZona   función(id) -> nombre para la leyenda (por omisión, el id sin guiones bajos).
//       junto        selector o elemento: el bloque de la leyenda se inserta justo ANTES de él (p. ej. el bloque
//                    «Terrain overlay» del panel). `contenedor`: selector o elemento DENTRO del cual se agrega.
//                    Sin ninguno de los dos, el bloque no se inserta (queda en controlador.elemento).
//       encendido    estado inicial del interruptor (por omisión, true).
//       maplibre     la biblioteca (por omisión, window.maplibregl): se usa ScaleControl.
//   controlador: { disponible, elemento, mostrar(si), visible(), estado(), destruir() }
//     disponible   true si al menos una zona tiene relieve dibujado.
//     mostrar(si)  enciende o apaga el sombreado y la rampa (el velo y la barra de escala no se apagan).
//     estado()     { disponible, visible, zonas, capas, velo, escala, error } (solo lectura, para pruebas).
//   Funciones puras (sin DOM ni mapa), las que prueba tests/terreno2d.test.js:
//     rectangulosDeZonas(cubo), poligonoInvertido(rectangulos), extremosDeElevacion(gemelo),
//     rampaDeColor(min, max, colores), fuenteDem(terreno, zona, base), resolucionDelModelo(texto),
//     ventanaDeTesela(z, x, y, bbox, lado), enmascararTesela(bytes, {z, x, y, bbox}), htmlLeyendaTerreno({...}), IDS.
//
// QUÉ DIBUJA (todo con el prefijo «terreno2d-», encima del fondo y del mapa base y debajo de las parcelas):
//   · por zona con relieve en gemelo.json: dos fuentes raster-dem con las teselas de NASADEM que ya usa la vista 3D
//     (web/data/dem/<zona>/, codificación Terrarium), una capa «color-relief» (rampa hipsométrica) y una capa
//     «hillshade» (sombreado). MapLibre 5.24.0 (web/vendor/) trae los dos tipos de capa;
//   · un velo gris sobre todo lo que queda fuera de los rectángulos de las zonas piloto (polígono invertido);
//   · la barra de escala de MapLibre (ScaleControl), abajo a la izquierda.
//
// REGLAS DE ESTE ARCHIVO
// - Ninguna cifra escrita a mano: los extremos de la rampa son elev_min_m y elev_max_m de cada zona en gemelo.json;
//   los rectángulos del velo, los bbox de cubo.json; la resolución del rótulo («30 m») se lee del texto de la
//   fuente (gemelo.terreno.fuente). Si un dato falta, se dice («not available») y no se inventa.
//   Los números del código son medidas de diseño (opacidades, fuerza del sombreado, ancho de la barra).
// - Cada zona usa su propia rampa (su mínimo y su máximo): el mismo color no es la misma altitud en dos zonas, y la
//   leyenda lo dice con los extremos de cada una.
// - Colores leídos de variables CSS (css/terreno2d.css). MapLibre solo entiende colores simples (hex, rgb, hsl).
// - Decisión 1: la rampa solo colorea DENTRO del rectángulo de la zona. Las teselas cubren más que la zona (y más
//   que el ráster: fuera de él son un plano de relleno), y MapLibre no recorta una capa a un polígono. Por eso las
//   teselas se piden con un protocolo propio («terreno2d-dem://») que entrega las de la rampa con los píxeles de
//   fuera del rectángulo en el valor más bajo de la codificación; la rampa es transparente por debajo del mínimo
//   de la zona. El sombreado recibe las teselas tal cual (enmascaradas dibujaría un acantilado en el borde): fuera
//   de la zona queda bajo el velo. Sin flujos de compresión en el navegador, la rampa se dibuja sin máscara.
//   Cada tesela se lee una sola vez para las dos capas y su lectura no se cancela al mover el mapa.
// - Con la vista 3D activa (el mapa tiene terreno) el sombreado propio se oculta: esa vista trae el suyo.
// - Es contexto regional del modelo de elevación; no es una medición de la parcela ni diseño de drenaje.

const LOCALE = "en-US";

// Medidas de diseño (no son datos).
const FUERZA_SOMBRA = 0.4; // hillshade-exaggeration
const OPACIDAD_COLOR = 0.55; // la rampa deja ver el mapa base
const OPACIDAD_VELO = 0.45;
const ANCHO_ESCALA_PX = 110;
const FRACCION_BAJO_EL_MINIMO = 100; // la rampa se vuelve transparente una centésima del desnivel bajo el mínimo
// Rectángulo del velo: el mundo que Web Mercator dibuja (las latitudes no llegan a los polos).
const MUNDO = [-180, -85, 180, 85];
// Variables CSS de los colores de la rampa, de la más baja a la más alta.
const VARIABLES_RAMPA = ["terreno2d-rampa-baja", "terreno2d-rampa-media", "terreno2d-rampa-alta"];

// Protocolo propio de MapLibre para las teselas de la rampa: se entregan enmascaradas (decisión 1 de abajo).
const PROTOCOLO = "terreno2d-dem";
const SEPARADOR = "://";

/** Identificadores propios en MapLibre. */
export const IDS = {
  fuenteDem: (zona) => `terreno2d-dem-${zona}`,
  fuenteColor: (zona) => `terreno2d-dem-color-${zona}`,
  capaColor: (zona) => `terreno2d-color-${zona}`,
  capaSombra: (zona) => `terreno2d-sombra-${zona}`,
  velo: "terreno2d-velo",
};

let contadorBloques = 0;

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

const formato = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
/** Elevación leída de los datos, al metro (el modelo trae metros enteros; las teselas, cuartos de metro). */
function fmt(v) {
  return formato.format(v);
}

function nombrePorOmision(id) {
  return String(id ?? "").replace(/_/g, " ");
}

/** Color de una variable CSS; si falta, la de respaldo; si tampoco, el color del texto de la página. */
function colorCSS(nombre, respaldo) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim();
  if (v) return v;
  if (respaldo) return colorCSS(respaldo, null);
  return getComputedStyle(document.body).color;
}

function resolverElemento(c) {
  if (!c) return null;
  if (typeof c === "string") return document.querySelector(c);
  return c instanceof Element ? c : null;
}

// ---------------------------------------------------------------------------
// Funciones puras (se prueban con Node)
// ---------------------------------------------------------------------------
/** ¿[oeste, sur, este, norte] con cuatro números, oeste < este y sur < norte? */
function esRectangulo(b) {
  return Array.isArray(b) && b.length === 4 && b.every((v) => num(v) != null) && Number(b[0]) < Number(b[2]) && Number(b[1]) < Number(b[3]);
}

/** Rectángulos de las zonas piloto: [{ id, bbox }] con los bbox válidos de cubo.zonas (los que la web ya lee). */
export function rectangulosDeZonas(cubo) {
  return Object.entries(cubo?.zonas ?? {})
    .filter(([, z]) => esRectangulo(z?.bbox))
    .map(([id, z]) => ({ id, bbox: z.bbox.map(Number) }));
}

/**
 * Polígono invertido (GeoJSON Feature): el mundo con un hueco por rectángulo. Es el velo de lo que queda fuera
 * de las zonas piloto. Sin rectángulos devuelve null: no se cubre todo el mapa.
 */
export function poligonoInvertido(rectangulos) {
  const lista = (Array.isArray(rectangulos) ? rectangulos : []).filter((r) => esRectangulo(r?.bbox));
  if (!lista.length) return null;
  const [o, s, e, n] = MUNDO;
  // RFC 7946: el anillo exterior gira contra las manecillas; los huecos, a favor.
  const exterior = [[o, s], [e, s], [e, n], [o, n], [o, s]];
  const huecos = lista.map(({ bbox: [ho, hs, he, hn] }) => [[ho, hs], [ho, hn], [he, hn], [he, hs], [ho, hs]]);
  return { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [exterior, ...huecos] } };
}

/**
 * Extremos de elevación de cada zona con relieve: [{ id, min, max }], de gemelo.terreno.zonas.<id>.elev_min_m y
 * elev_max_m. Una zona sin teselas, sin extremos o sin desnivel no entra (no tendría rampa).
 */
export function extremosDeElevacion(gemelo) {
  return Object.entries(gemelo?.terreno?.zonas ?? {})
    .map(([id, z]) => ({ id, min: num(z?.elev_min_m), max: num(z?.elev_max_m), teselas: z?.teselas }))
    .filter((z) => z.teselas && z.min != null && z.max != null && z.min < z.max)
    .map(({ id, min, max }) => ({ id, min, max }));
}

/**
 * Expresión de MapLibre para «color-relief-color»: interpolación lineal de la elevación entre `min` y `max`, con
 * los colores repartidos a pasos iguales. Por debajo del mínimo (una centésima del desnivel antes) no hay color:
 * ahí caen los píxeles enmascarados de fuera de la zona. null si no hay desnivel o faltan colores.
 */
export function rampaDeColor(min, max, colores) {
  const a = num(min);
  const b = num(max);
  if (a == null || b == null || a >= b) return null;
  if (!Array.isArray(colores) || colores.length < 2 || colores.some((c) => !c)) return null;
  const paso = (b - a) / (colores.length - 1);
  const paradas = colores.flatMap((c, i) => [i === colores.length - 1 ? b : a + paso * i, c]);
  return ["interpolate", ["linear"], ["elevation"], a - (b - a) / FRACCION_BAJO_EL_MINIMO, "transparent", ...paradas];
}

/** Codificaciones de teselas de elevación que MapLibre lee sin más datos. */
const CODIFICACIONES = new Set(["terrarium", "mapbox"]);

/**
 * Fuente raster-dem de una zona con lo que declara gemelo.json (plantilla de teselas, codificación, tamaño, zooms
 * y límites). `base`: dirección de la página, para resolver la plantilla. null si la zona no trae teselas o la
 * codificación no es una que MapLibre lea.
 */
export function fuenteDem(terreno, zona, base) {
  if (!zona?.teselas || !CODIFICACIONES.has(terreno?.encoding)) return null;
  // new URL codificaría las llaves de {z}/{x}/{y}: se resuelve la carpeta y se le pega la plantilla.
  const fuente = { type: "raster-dem", tiles: [new URL(".", base).href + zona.teselas], encoding: terreno.encoding };
  for (const llave of ["tileSize", "minzoom", "maxzoom"]) {
    const v = num(terreno[llave]);
    if (v != null) fuente[llave] = v;
  }
  if (esRectangulo(zona.bounds)) fuente.bounds = zona.bounds.map(Number);
  return fuente;
}

// ---------------------------------------------------------------------------
// Teselas enmascaradas para la rampa (puras: se prueban con Node)
// ---------------------------------------------------------------------------
/** Latitud -> posición vertical en el mundo de Web Mercator, de 0 (norte) a 1 (sur). */
function fraccionY(lat) {
  return (1 - Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) / Math.PI) / 2;
}

/**
 * Píxeles de la tesela z/x/y cuyo centro cae dentro de bbox = [oeste, sur, este, norte]:
 * { c0, c1, f0, f1, completa } (columnas y filas, inclusive; la fila 0 es el norte), o null si ninguno.
 */
export function ventanaDeTesela(z, x, y, bbox, lado) {
  const n = 2 ** z;
  const [oeste, sur, este, norte] = bbox.map(Number);
  // Centro de la columna c: (x + (c + 0.5) / lado) / n, en fracción del mundo; igual para las filas.
  const columna = (lon) => (((lon + 180) / 360) * n - x) * lado - 0.5;
  const fila = (lat) => (fraccionY(lat) * n - y) * lado - 0.5;
  const c0 = Math.max(0, Math.ceil(columna(oeste)));
  const c1 = Math.min(lado - 1, Math.floor(columna(este)));
  const f0 = Math.max(0, Math.ceil(fila(norte)));
  const f1 = Math.min(lado - 1, Math.floor(fila(sur)));
  if (c0 > c1 || f0 > f1) return null;
  return { c0, c1, f0, f1, completa: c0 === 0 && f0 === 0 && c1 === lado - 1 && f1 === lado - 1 };
}

const FIRMA_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const TROZO_FINAL = [0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]; // IEND con su CRC
const FILTRO_NINGUNO = 0;
const FILTRO_ARRIBA = 2; // el que escribe motor/dem_teselas.py en todas las líneas
const CANALES = 3; // RGB de 8 bits

let tablaCRC = null;
/** CRC-32 de PNG (el de zlib). */
function crc32(bytes) {
  if (!tablaCRC) {
    tablaCRC = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      tablaCRC[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of bytes) crc = tablaCRC[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Pasa los bytes por un flujo de compresión o descompresión del navegador (formato zlib, el de PNG). */
async function porFlujo(bytes, flujo) {
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(flujo)).arrayBuffer());
}

/** ¿El navegador trae los flujos de compresión que necesita la máscara? */
function hayFlujosDeCompresion() {
  return typeof CompressionStream === "function" && typeof DecompressionStream === "function";
}

/**
 * Tesela de elevación con los píxeles de FUERA del rectángulo de la zona en el valor más bajo de la codificación
 * (R = G = B = cero): la rampa no los colorea. Los de dentro quedan byte por byte iguales.
 * Devuelve los mismos bytes si la tesela cae entera dentro del rectángulo, o si no es un PNG como los que escribe
 * motor/dem_teselas.py (RGB de 8 bits, sin entrelazar, filtros «ninguno» o «arriba»): la capa se dibuja sin máscara.
 * No usa <canvas>: el resultado no depende de la protección contra huellas del navegador.
 */
export async function enmascararTesela(bytes, { z, x, y, bbox }) {
  if (!hayFlujosDeCompresion() || bytes.length < FIRMA_PNG.length || FIRMA_PNG.some((b, i) => bytes[i] !== b)) return bytes;
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tipoDe = (pos) => String.fromCharCode(...bytes.subarray(pos + 4, pos + 8));
  let cabecera = null;
  const comprimido = [];
  for (let pos = FIRMA_PNG.length; pos + 12 <= bytes.length; ) {
    const largo = vista.getUint32(pos);
    const tipo = tipoDe(pos);
    if (tipo === "IHDR") cabecera = bytes.subarray(pos, pos + 12 + largo);
    else if (tipo === "IDAT") comprimido.push(bytes.subarray(pos + 8, pos + 8 + largo));
    pos += 12 + largo;
  }
  if (!cabecera || !comprimido.length) return bytes;
  const datos = new DataView(cabecera.buffer, cabecera.byteOffset + 8, cabecera.byteLength - 12);
  const ancho = datos.getUint32(0);
  const alto = datos.getUint32(4);
  // Profundidad 8, color RGB (2), sin entrelazar: lo que escribe motor/dem_teselas.py.
  if (datos.getUint8(8) !== 8 || datos.getUint8(9) !== 2 || datos.getUint8(12) !== 0 || ancho !== alto) return bytes;
  const ventana = ventanaDeTesela(z, x, y, bbox, ancho);
  if (ventana?.completa) return bytes;
  const crudo = await porFlujo(new Blob(comprimido), new DecompressionStream("deflate"));
  const largoLinea = 1 + ancho * CANALES;
  if (crudo.length !== alto * largoLinea) return bytes;
  const salida = new Uint8Array(crudo.length); // todo en cero: filtro «ninguno» y píxeles en el valor más bajo
  let previa = new Uint8Array(ancho * CANALES);
  for (let f = 0; f < alto; f++) {
    const inicio = f * largoLinea;
    const filtro = crudo[inicio];
    const linea = crudo.slice(inicio + 1, inicio + largoLinea);
    if (filtro === FILTRO_ARRIBA) for (let i = 0; i < linea.length; i++) linea[i] = (linea[i] + previa[i]) & 0xff;
    else if (filtro !== FILTRO_NINGUNO) return bytes;
    previa = linea;
    if (ventana && f >= ventana.f0 && f <= ventana.f1) {
      salida.set(linea.subarray(ventana.c0 * CANALES, (ventana.c1 + 1) * CANALES), inicio + 1 + ventana.c0 * CANALES);
    }
  }
  const idat = await porFlujo(salida, new CompressionStream("deflate"));
  const trozo = new Uint8Array(12 + idat.length);
  new DataView(trozo.buffer).setUint32(0, idat.length);
  trozo.set([0x49, 0x44, 0x41, 0x54], 4); // «IDAT»
  trozo.set(idat, 8);
  new DataView(trozo.buffer).setUint32(8 + idat.length, crc32(trozo.subarray(4, 8 + idat.length)));
  const png = new Uint8Array(FIRMA_PNG.length + cabecera.length + trozo.length + TROZO_FINAL.length);
  png.set(FIRMA_PNG, 0);
  png.set(cabecera, FIRMA_PNG.length);
  png.set(trozo, FIRMA_PNG.length + cabecera.length);
  png.set(TROZO_FINAL, FIRMA_PNG.length + cabecera.length + trozo.length);
  return png;
}

/** Resolución del modelo de elevación tal como la declara el texto de la fuente (p. ej. «30 m»); null si no la trae. */
export function resolucionDelModelo(texto) {
  const hallado = String(texto ?? "").match(/(?:^|[\s,;(])(\d+(?:\.\d+)?)\s*m(?![\w³²])/);
  return hallado ? `${hallado[1]} m` : null;
}

/**
 * Leyenda del bloque: rótulo, interruptor, rampa con los extremos de cada zona, velo y fuente.
 * @param gemelo     gemelo.json (se usa terreno.fuente)
 * @param extremos   resultado de extremosDeElevacion (solo las zonas que se dibujan)
 * @param hayVelo    true si el mapa lleva el velo fuera de las zonas piloto
 * @param nombreZona función(id) -> nombre
 * @param ids        { titulo, interruptor, leyenda } (id de los elementos, para aria-controls y aria-labelledby)
 * @param encendido  estado inicial del interruptor
 */
export function htmlLeyendaTerreno({ gemelo, extremos, hayVelo, nombreZona = nombrePorOmision, ids, encendido = true }) {
  const fuente = gemelo?.terreno?.fuente ?? null;
  const resolucion = resolucionDelModelo(fuente);
  const titulo =
    `<p class="terreno2d-titulo"${ids?.titulo ? ` id="${esc(ids.titulo)}"` : ""}>` +
    `Regional terrain, ${resolucion ? `${esc(resolucion)} ` : ""}elevation model</p>`;
  const velo = hayVelo
    ? `<p class="terreno2d-velo-nota"><span class="terreno2d-muestra-velo" aria-hidden="true"></span>` +
      `<span>Greyed out: outside the pilot areas</span></p>`
    : "";
  const pieFuente = `<p class="fuente">Source: ${fuente ? esc(fuente) : "not available"}</p>`;
  if (!extremos?.length) {
    return (
      titulo +
      `<p class="terreno2d-no-disponible" data-parte="no-disponible">Terrain shading: not available (no elevation tiles in the data)</p>` +
      velo
    );
  }
  const zonas = extremos
    .map((z) => `<li>${esc(nombreZona(z.id))}: <strong>${esc(fmt(z.min))} m</strong> to <strong>${esc(fmt(z.max))} m</strong></li>`)
    .join("");
  return (
    titulo +
    `<label class="interruptor terreno2d-interruptor" for="${esc(ids.interruptor)}">` +
    `<input type="checkbox" role="switch" id="${esc(ids.interruptor)}" aria-controls="${esc(ids.leyenda)}"${encendido ? " checked" : ""}> ` +
    `<span>Terrain shading</span></label>` +
    `<div class="terreno2d-leyenda" id="${esc(ids.leyenda)}"${encendido ? "" : " hidden"}>` +
    `<div class="terreno2d-rampa" aria-hidden="true"></div>` +
    `<p class="terreno2d-rampa-extremos"><span>Lower ground</span><span>Higher ground</span></p>` +
    `<ul class="terreno2d-zonas">${zonas}</ul>` +
    `<p class="terreno2d-nota">Each pilot area uses its own colour range. Shading and colours come from the elevation model: ` +
    `zone context, not a field measurement.</p>` +
    `</div>` +
    velo +
    pieFuente
  );
}

// ---------------------------------------------------------------------------
// Protocolo de las teselas (una sola vez por biblioteca; cada zona se anota en el registro)
// ---------------------------------------------------------------------------
const TESELA_TAL_CUAL = "sombra"; // para el sombreado
const TESELA_ENMASCARADA = "color"; // para la rampa
const registro = new Map(); // zona -> { plantilla, bbox, leidas: Map(url -> Promise<Uint8Array>) }

/** Lee una tesela de la zona una sola vez (el sombreado y la rampa piden la misma); si falla, se reintenta después. */
function leerTesela(anotada, z, x, y) {
  const url = anotada.plantilla.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  if (!anotada.leidas.has(url)) {
    const lectura = fetch(url).then(async (respuesta) => {
      if (!respuesta.ok) throw new Error(`terrain tile not available (HTTP ${respuesta.status}): ${url}`);
      return new Uint8Array(await respuesta.arrayBuffer());
    });
    lectura.catch(() => anotada.leidas.delete(url));
    anotada.leidas.set(url, lectura);
  }
  return anotada.leidas.get(url);
}

/**
 * MapLibre pide «terreno2d-dem://<sombra|color>/<zona>/<z>/<x>/<y>». La lectura no se cancela aunque MapLibre ya no
 * quiera la tesela (son archivos locales y pequeños, y la otra capa suele pedir la misma): así no quedan peticiones
 * abortadas a medias cada vez que el mapa se mueve.
 */
async function pedirTesela(parametros) {
  const [tipo, zona, z, x, y] = String(parametros?.url ?? "").slice((PROTOCOLO + SEPARADOR).length).split("/");
  const anotada = registro.get(decodeURIComponent(zona ?? ""));
  if (!anotada) throw new Error(`terrain tile of an unknown pilot area: ${zona}`);
  const bytes = await leerTesela(anotada, z, x, y);
  let salida = bytes;
  if (tipo === TESELA_ENMASCARADA) {
    try {
      salida = await enmascararTesela(bytes, { z: Number(z), x: Number(x), y: Number(y), bbox: anotada.bbox });
    } catch (err) {
      console.warn("ROOT: terrain tile drawn without its mask", err); // la tesela se dibuja completa
    }
  }
  // Siempre una copia: MapLibre puede quedarse con el búfer, y `bytes` se guarda para la otra capa.
  return { data: salida.slice().buffer };
}

/**
 * Anota la zona y devuelve las plantillas con el protocolo propio { sombra, color }, o null si la biblioteca no
 * admite protocolos o la zona no trae rectángulo (entonces las dos capas usan las teselas tal cual).
 */
function plantillasDeZona(biblioteca, zona, plantilla, bbox) {
  if (typeof biblioteca?.addProtocol !== "function" || !esRectangulo(bbox)) return null;
  if (!registro.size) biblioteca.addProtocol(PROTOCOLO, pedirTesela);
  registro.set(zona, { plantilla, bbox: bbox.map(Number), leidas: new Map() });
  const de = (tipo) => `${PROTOCOLO}${SEPARADOR}${tipo}/${encodeURIComponent(zona)}/{z}/{x}/{y}`;
  return { sombra: de(TESELA_TAL_CUAL), color: de(TESELA_ENMASCARADA) };
}

function soltarZona(biblioteca, zona) {
  if (!registro.delete(zona)) return;
  if (!registro.size && typeof biblioteca?.removeProtocol === "function") biblioteca.removeProtocol(PROTOCOLO);
}

// ---------------------------------------------------------------------------
// API principal
// ---------------------------------------------------------------------------
/** Primera capa que no es fondo ni mapa base: lo propio va justo debajo de ella (debajo de las parcelas). */
function capaSobreElFondo(mapa) {
  const orden = mapa.getLayersOrder?.() ?? [];
  return orden.find((id) => {
    const tipo = mapa.getLayer(id)?.type;
    return tipo !== "background" && tipo !== "raster";
  });
}

/**
 * Agrega al mapa plano el sombreado, la rampa de elevación, el velo y la barra de escala, y arma su leyenda.
 * Nunca lanza: si algo inesperado falla, lo dice en la consola y devuelve un controlador inerte (la página sigue).
 * @returns controlador { disponible, elemento, mostrar, visible, estado, destruir }
 */
export function agregarTerreno2D(mapa, ctx = {}) {
  try {
    return montar(mapa, ctx);
  } catch (err) {
    console.error("ROOT: the terrain shading block could not be built", err);
    const error = err?.message ?? String(err);
    return {
      disponible: false,
      elemento: null,
      mostrar() {},
      visible: () => false,
      estado: () => ({ disponible: false, visible: false, zonas: [], capas: [], velo: false, escala: false, error }),
      destruir() {},
    };
  }
}

function montar(mapa, ctx) {
  const {
    gemelo = null,
    cubo = null,
    nombreZona = nombrePorOmision,
    junto = null,
    contenedor = null,
    encendido = true,
    maplibre = globalThis.maplibregl,
  } = ctx;

  contadorBloques += 1;
  const ids = {
    titulo: `terreno2d-${contadorBloques}-titulo`,
    interruptor: `terreno2d-${contadorBloques}-interruptor`,
    leyenda: `terreno2d-${contadorBloques}-leyenda`,
  };
  const est = { visible: Boolean(encendido), zonas: [], velo: false, escala: null, error: null, destruido: false };

  // ---- mapa: fuentes y capas -------------------------------------------------------------
  const terreno = gemelo?.terreno ?? null;
  const rectangulos = rectangulosDeZonas(cubo);
  const todas = extremosDeElevacion(gemelo);

  function agregarAlMapa() {
    const antes = capaSobreElFondo(mapa);
    const colores = VARIABLES_RAMPA.map((v) => colorCSS(v));
    for (const z of todas) {
      const fuente = fuenteDem(terreno, terreno.zonas[z.id], document.baseURI);
      const rampa = rampaDeColor(z.min, z.max, colores);
      if (!fuente || !rampa) continue;
      // Dos fuentes con las mismas teselas: la del sombreado, tal cual; la de la rampa, enmascarada fuera del
      // rectángulo de la zona. Sin protocolos en la biblioteca, las dos leen las teselas directamente.
      const propias = plantillasDeZona(maplibre, z.id, fuente.tiles[0], fuente.bounds);
      mapa.addSource(IDS.fuenteDem(z.id), propias ? { ...fuente, tiles: [propias.sombra] } : fuente);
      mapa.addSource(IDS.fuenteColor(z.id), propias ? { ...fuente, tiles: [propias.color] } : { ...fuente });
      mapa.addLayer(
        {
          id: IDS.capaColor(z.id),
          type: "color-relief",
          source: IDS.fuenteColor(z.id),
          paint: { "color-relief-color": rampa, "color-relief-opacity": OPACIDAD_COLOR },
        },
        antes,
      );
      mapa.addLayer(
        {
          id: IDS.capaSombra(z.id),
          type: "hillshade",
          source: IDS.fuenteDem(z.id),
          paint: {
            "hillshade-exaggeration": FUERZA_SOMBRA,
            "hillshade-shadow-color": colorCSS("terreno2d-sombra", "tinta"),
            "hillshade-accent-color": colorCSS("terreno2d-sombra", "tinta"),
            "hillshade-highlight-color": colorCSS("terreno2d-luz", "blanco"),
          },
        },
        antes,
      );
      est.zonas.push(z);
    }
    const velo = poligonoInvertido(rectangulos);
    if (velo) {
      mapa.addSource(IDS.velo, { type: "geojson", data: velo });
      mapa.addLayer(
        { id: IDS.velo, type: "fill", source: IDS.velo, paint: { "fill-color": colorCSS("terreno2d-velo", "gris"), "fill-opacity": OPACIDAD_VELO } },
        antes,
      );
      est.velo = true;
    }
    if (typeof maplibre?.ScaleControl === "function") {
      est.escala = new maplibre.ScaleControl({ maxWidth: ANCHO_ESCALA_PX, unit: "metric" });
      mapa.addControl(est.escala, "bottom-left");
    }
    mapa.on("terrain", aplicar);
  }

  /** Visibilidad de las capas: la rampa sigue al interruptor; el sombreado, además, cede ante la vista 3D. */
  function aplicar() {
    if (!mapa || est.destruido) return;
    const conTerreno = Boolean(mapa.getTerrain?.());
    for (const z of est.zonas) {
      if (mapa.getLayer(IDS.capaColor(z.id))) mapa.setLayoutProperty(IDS.capaColor(z.id), "visibility", est.visible ? "visible" : "none");
      if (mapa.getLayer(IDS.capaSombra(z.id))) {
        mapa.setLayoutProperty(IDS.capaSombra(z.id), "visibility", est.visible && !conTerreno ? "visible" : "none");
      }
    }
  }

  if (mapa) {
    try {
      agregarAlMapa();
      aplicar();
    } catch (err) {
      // No es «not available»: el navegador o MapLibre no pudieron dibujarlo. Se dice en el bloque y en la consola.
      console.error("ROOT: the terrain shading could not be drawn", err);
      est.error = err?.message ?? String(err);
    }
  }

  // ---- bloque de la leyenda -------------------------------------------------------------------
  const elemento = document.createElement("div");
  elemento.className = "terreno2d";
  elemento.dataset.terreno2d = est.error ? "error" : est.zonas.length ? "listo" : "sin-relieve";
  elemento.setAttribute("role", "group");
  elemento.setAttribute("aria-labelledby", ids.titulo);
  elemento.innerHTML = est.error
    ? `<p class="terreno2d-titulo" id="${ids.titulo}">Regional terrain</p>` +
      `<p class="terreno2d-no-disponible terreno2d-error" role="alert">Terrain shading: could not be drawn (${esc(est.error)})</p>`
    : htmlLeyendaTerreno({ gemelo, extremos: est.zonas, hayVelo: est.velo, nombreZona, ids, encendido: est.visible });
  const interruptor = elemento.querySelector(`#${ids.interruptor}`);
  const leyenda = elemento.querySelector(`#${ids.leyenda}`);
  const alCambiar = () => mostrar(interruptor.checked);
  interruptor?.addEventListener("change", alCambiar);
  const vecino = resolverElemento(junto);
  const destino = resolverElemento(contenedor);
  if (vecino) vecino.insertAdjacentElement("beforebegin", elemento);
  else if (destino) destino.append(elemento);

  function mostrar(si) {
    est.visible = Boolean(si);
    if (interruptor) interruptor.checked = est.visible;
    if (leyenda) leyenda.hidden = !est.visible;
    aplicar();
  }

  return {
    disponible: est.zonas.length > 0,
    elemento,
    mostrar,
    visible: () => est.visible,
    estado: () => ({
      disponible: est.zonas.length > 0,
      visible: est.visible,
      zonas: est.zonas.map((z) => ({ ...z })),
      capas: est.zonas.flatMap((z) => [IDS.capaColor(z.id), IDS.capaSombra(z.id)]),
      velo: est.velo,
      escala: Boolean(est.escala),
      error: est.error,
    }),
    destruir() {
      if (est.destruido) return;
      est.destruido = true;
      interruptor?.removeEventListener("change", alCambiar);
      elemento.remove();
      if (!mapa) return;
      mapa.off("terrain", aplicar);
      for (const z of est.zonas) {
        for (const capa of [IDS.capaSombra(z.id), IDS.capaColor(z.id)]) if (mapa.getLayer(capa)) mapa.removeLayer(capa);
        for (const fuente of [IDS.fuenteDem(z.id), IDS.fuenteColor(z.id)]) if (mapa.getSource(fuente)) mapa.removeSource(fuente);
        soltarZona(maplibre, z.id);
      }
      if (mapa.getLayer(IDS.velo)) mapa.removeLayer(IDS.velo);
      if (mapa.getSource(IDS.velo)) mapa.removeSource(IDS.velo);
      if (est.escala) mapa.removeControl(est.escala);
    },
  };
}
