// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// web/js/relieve.js — Relieve y tormenta (S9 §4 bis; kit A9, parte web). Módulo ES, sin dependencias.
//
// Qué exporta (lo conecta app.js; este archivo no toca el resto de la página):
//   agregarCapaRelieve(mapa, ctx) -> Promise<controlador>
//       Lee relieve_rutas.geojson y relieve.json, agrega al mapa de MapLibre la capa
//       «Terrain & runoff» (oculta por omisión) y dibuja en ctx.contenedor el interruptor,
//       el botón «Simulate a storm», la leyenda y la tarjeta de la tormenta.
//       Si falta cualquiera de los dos archivos, la capa no se agrega y el bloque dice
//       «Terrain layer: not run» (kit A9, PRUEBA).
//   htmlRelieveParcela(p, opciones) -> string
//       Línea para el renglón Soil de la ficha con properties.relieve (pendiente media, área que
//       escurre hacia la parcela y fracción en depresión) y el rótulo de escala de relieve.json.
//       Cadena vacía si la parcela no trae relieve.
//   cargarRelieve(url) -> Promise<objeto de relieve.json | null>
//       Lee relieve.json una sola vez por URL; htmlRelieveParcela usa lo último leído.
//
// Reglas de este archivo:
// - Ninguna cifra escrita a mano: el umbral de las rutas, la lámina de la tormenta, su definición,
//   periodo y fuente, y el rótulo de escala salen de relieve.json; los indicadores de la parcela, de
//   parcelas.geojson. Los números del código son medidas de diseño (duración, radios, anchos), no datos.
// - Colores leídos de variables CSS (css/relieve.css, que a su vez toma --agua de style.css).
// - Zona, no parcela: las rutas son regionales (NASADEM, 30 m) y no son diseño de drenaje parcelario.
//   La tormenta es ilustrativa: no es un pronóstico, no da profundidades ni hidrograma.
// - Animación de unos 3 s con requestAnimationFrame y fin explícito (sin bucles infinitos); con
//   prefers-reduced-motion no hay animación: solo se resaltan las rutas.

const LOCALE = "en-US";

// Medidas de diseño de la animación (no son datos).
const DURACION_MS = 3000; // kit A9: «durante unos 3 s»
const CAIDA_MS = 600; // las gotas aparecen escalonadas al inicio, como lluvia que cae
const DESVANECER_MS = 600; // y se desvanecen al final
const MAX_GOTAS = 450;
const RECORRIDO_PX = 150; // recorrido medio de una gota en pantalla durante la animación
const RADIO_GOTA_PX = 3;
const GROSOR_MAXIMO = 4; // factor de grosor de las rutas más concentradas

// Identificadores de MapLibre (fuente y capas propias de este módulo).
const FUENTE = "relieve-rutas";
const CAPA_BORDE = "relieve-rutas-borde";
const CAPA_LINEA = "relieve-rutas-linea";

let contadorBloques = 0;
const lecturas = new Map(); // url -> Promise de relieve.json
let ultimoRelieve = null; // último relieve.json válido (para htmlRelieveParcela)

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

const formatos = new Map();
function formateador(opciones) {
  const llave = JSON.stringify(opciones);
  if (!formatos.has(llave)) formatos.set(llave, new Intl.NumberFormat(LOCALE, opciones));
  return formatos.get(llave);
}
/** Número leído de los datos, con hasta `decimales` decimales; «—» si no es número. */
function fmt(v, decimales) {
  const n = num(v);
  return n == null ? "—" : formateador({ maximumFractionDigits: decimales }).format(n);
}
function fmtPct(fraccion) {
  const n = num(fraccion);
  return n == null ? "—" : formateador({ style: "percent", maximumFractionDigits: 0 }).format(n);
}
function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Color de una variable CSS; si falta, la de respaldo; si tampoco, el color del texto de la página. */
function colorCSS(nombre, respaldo) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim();
  if (v) return v;
  if (respaldo) return colorCSS(respaldo, null);
  return getComputedStyle(document.body).color;
}

function coloresRelieve() {
  return {
    ruta: colorCSS("relieve-ruta", "agua"),
    rutaFuerte: colorCSS("relieve-ruta-fuerte", "agua-osc"),
    borde: colorCSS("relieve-borde", "blanco"),
    gota: colorCSS("relieve-gota", "agua"),
    gotaBorde: colorCSS("relieve-gota-borde", "blanco"),
  };
}

function reduceMovimiento() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function nombrePorOmision(id) {
  return String(id ?? "").replace(/_/g, " ");
}

async function leerJSON(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null; // sin red o archivo ilegible: se trata como «no corrido»
  }
}

// ---------------------------------------------------------------------------
// relieve.json
// ---------------------------------------------------------------------------
function relieveValido(d) {
  return Boolean(d && d.zonas && typeof d.zonas === "object" && Object.keys(d.zonas).length > 0);
}

/** Lee relieve.json (una vez por URL). Devuelve el objeto, o null si falta o no trae zonas. */
export function cargarRelieve(url = "data/relieve.json") {
  if (!lecturas.has(url)) {
    lecturas.set(
      url,
      leerJSON(url).then((d) => {
        if (!relieveValido(d)) return null;
        ultimoRelieve = d;
        return d;
      }),
    );
  }
  return lecturas.get(url);
}

/** [[id, bloque]] de la zona activa; con zona null, todas las zonas de relieve.json. */
function bloquesZona(relieve, zona) {
  const zonas = relieve?.zonas ?? {};
  if (zona) return zonas[zona] ? [[zona, zonas[zona]]] : [];
  return Object.entries(zonas);
}

/** Rótulo de escala para una parcela: el de su zona; si no, el común a todas las zonas. */
function rotuloDeZona(relieve, zona) {
  const zonas = relieve?.zonas ?? {};
  if (zona && zonas[zona]?.rotulo) return zonas[zona].rotulo;
  const todos = [...new Set(Object.values(zonas).map((z) => z?.rotulo).filter(Boolean))];
  return todos.length === 1 ? todos[0] : null;
}

// ---------------------------------------------------------------------------
// Rutas: de segmentos sueltos a líneas continuas y caminos para las gotas
// ---------------------------------------------------------------------------
/**
 * relieve_rutas.geojson trae segmentos de celda a celda (dirección de flujo D8). Aquí se encadenan:
 * - piezas: líneas continuas sin repetir tramos, partidas en cada confluencia, con su «magnitud»
 *   (cuántos nacimientos drenan por ahí; crece aguas abajo). Se dibujan con grosor según la magnitud.
 * - caminos: de cada nacimiento hasta su salida, con longitudes acumuladas; las gotas los recorren.
 * Funciona también con líneas largas ya simplificadas (LineString o MultiLineString de varios puntos).
 * Si un Feature trae properties.zona, la pieza y el camino la conservan (filtro por zona activa).
 */
function prepararRutas(fc) {
  const llave = (c) => `${c[0]},${c[1]}`;
  const segs = [];
  for (const f of fc?.features ?? []) {
    const g = f?.geometry;
    if (!g) continue;
    const zona = f.properties?.zona ?? null;
    const lineas = g.type === "LineString" ? [g.coordinates] : g.type === "MultiLineString" ? g.coordinates : [];
    for (const l of lineas) {
      for (let i = 1; i < (l?.length ?? 0); i++) {
        if (!Array.isArray(l[i - 1]) || !Array.isArray(l[i])) continue;
        segs.push({ a: l[i - 1], b: l[i], ka: llave(l[i - 1]), kb: llave(l[i]), zona });
      }
    }
  }

  const salidas = new Map(); // nodo -> [índices de segmentos que salen]
  const entradas = new Map(); // nodo -> número de segmentos que llegan
  segs.forEach((s, i) => {
    if (!salidas.has(s.ka)) salidas.set(s.ka, []);
    salidas.get(s.ka).push(i);
    entradas.set(s.kb, (entradas.get(s.kb) ?? 0) + 1);
  });
  const siguiente = (nodo) => salidas.get(nodo)?.[0];
  const nacimientos = [...salidas.keys()].filter((k) => !entradas.has(k));

  // Magnitud: cuántos nacimientos pasan por cada nodo (se recorre cada camino una vez).
  const magnitud = new Map();
  const caminos = [];
  for (const origen of nacimientos) {
    const coords = [];
    const vistos = new Set();
    let nodo = origen;
    let i = siguiente(nodo);
    let zona = null;
    while (i != null && !vistos.has(nodo)) {
      vistos.add(nodo);
      magnitud.set(nodo, (magnitud.get(nodo) ?? 0) + 1);
      const s = segs[i];
      if (!coords.length) coords.push(s.a);
      coords.push(s.b);
      zona = zona ?? s.zona;
      nodo = s.kb;
      i = siguiente(nodo);
    }
    if (coords.length > 1) caminos.push(medirCamino(coords, zona));
  }

  // Piezas sin tramos repetidos: empiezan en un nacimiento, una confluencia o una bifurcación.
  const usado = new Uint8Array(segs.length);
  const piezas = [];
  const esInicio = (nodo) => (entradas.get(nodo) ?? 0) !== 1 || (salidas.get(nodo)?.length ?? 0) > 1;
  const recorrer = (i0) => {
    const s0 = segs[i0];
    const coords = [s0.a, s0.b];
    usado[i0] = 1;
    let nodo = s0.kb;
    while (!esInicio(nodo)) {
      const i = siguiente(nodo);
      if (i == null || usado[i]) break;
      usado[i] = 1;
      coords.push(segs[i].b);
      nodo = segs[i].kb;
    }
    const mag = magnitud.get(s0.ka) ?? 1;
    piezas.push({
      type: "Feature",
      properties: { mag, w: Math.min(GROSOR_MAXIMO, 1 + Math.log2(mag) / 2), zona: s0.zona },
      geometry: { type: "LineString", coordinates: coords },
    });
  };
  segs.forEach((s, i) => { if (!usado[i] && esInicio(s.ka)) recorrer(i); });
  segs.forEach((s, i) => { if (!usado[i]) recorrer(i); }); // ciclos o datos sin nacimiento claro

  return {
    piezas: { type: "FeatureCollection", features: piezas },
    caminos,
    hayZona: segs.some((s) => s.zona != null),
    segmentos: segs.length,
  };
}

/** Longitudes acumuladas de un camino (grados de latitud equivalentes; la longitud se corrige por el coseno). */
function medirCamino(coords, zona) {
  const acum = [0];
  let oeste = Infinity, este = -Infinity, sur = Infinity, norte = -Infinity;
  for (let i = 0; i < coords.length; i++) {
    const [x, y] = coords[i];
    oeste = Math.min(oeste, x); este = Math.max(este, x);
    sur = Math.min(sur, y); norte = Math.max(norte, y);
    if (i > 0) {
      const [x0, y0] = coords[i - 1];
      const dx = (x - x0) * Math.cos((((y + y0) / 2) * Math.PI) / 180);
      acum.push(acum[i - 1] + Math.hypot(dx, y - y0));
    }
  }
  return { coords, acum, largo: acum[acum.length - 1], caja: [oeste, sur, este, norte], zona };
}

/** Punto a la distancia s del inicio del camino (búsqueda binaria en las longitudes acumuladas). */
function puntoEn(camino, s) {
  const { coords, acum, largo } = camino;
  if (s <= 0) return coords[0];
  if (s >= largo) return coords[coords.length - 1];
  let lo = 0, hi = acum.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (acum[m] <= s) lo = m; else hi = m;
  }
  const tramo = acum[hi] - acum[lo];
  const t = tramo > 0 ? (s - acum[lo]) / tramo : 0;
  const [x0, y0] = coords[lo];
  const [x1, y1] = coords[hi];
  return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
}

// ---------------------------------------------------------------------------
// Capa del mapa
// ---------------------------------------------------------------------------
/** Grosor de las rutas según el zoom y la magnitud (propiedad w); `factor` las engruesa al resaltar. */
function expresionAncho(factor, extra) {
  const w = ["get", "w"];
  return ["interpolate", ["linear"], ["zoom"],
    9, ["+", ["*", w, 0.6 * factor], extra * 0.6],
    13, ["+", ["*", w, 1.4 * factor], extra],
    16, ["+", ["*", w, 3 * factor], extra * 1.5]];
}

function agregarAlMapa(mapa, piezas, colores, antesDe) {
  quitarDelMapa(mapa);
  const antes = antesDe && mapa.getLayer(antesDe) ? antesDe : undefined;
  mapa.addSource(FUENTE, { type: "geojson", data: piezas });
  const disposicion = { visibility: "none", "line-cap": "round", "line-join": "round" };
  mapa.addLayer({
    id: CAPA_BORDE, type: "line", source: FUENTE, layout: { ...disposicion },
    paint: { "line-color": colores.borde, "line-width": expresionAncho(1, 2), "line-opacity": 0.85 },
  }, antes);
  mapa.addLayer({
    id: CAPA_LINEA, type: "line", source: FUENTE, layout: { ...disposicion },
    paint: { "line-color": colores.ruta, "line-width": expresionAncho(1, 0), "line-opacity": 0.95 },
  }, antes);
}

function quitarDelMapa(mapa) {
  for (const id of [CAPA_LINEA, CAPA_BORDE]) if (mapa.getLayer?.(id)) mapa.removeLayer(id);
  if (mapa.getSource?.(FUENTE)) mapa.removeSource(FUENTE);
}

/**
 * Ejecuta `accion` (agregar fuente y capas). Si el estilo del mapa aún no termina de cargar,
 * MapLibre lanza «Style is not done loading»: entonces se espera al evento «load» y se repite una vez.
 */
async function conEstilo(mapa, accion) {
  try {
    return accion();
  } catch (err) {
    if (!/not done loading/i.test(String(err?.message ?? ""))) throw err;
    await new Promise((ok) => mapa.once("load", ok));
    return accion();
  }
}

// ---------------------------------------------------------------------------
// Animación de la tormenta (lienzo encima del mapa; se quita al terminar)
// ---------------------------------------------------------------------------
/**
 * Gotas (círculos) que caen sobre las rutas visibles y bajan por ellas durante DURACION_MS.
 * Las que llegan a la salida se quedan ahí: se ve hacia dónde escurre el agua y dónde se junta.
 * Devuelve {promesa, detener}; la promesa se resuelve al terminar (o al detenerla).
 */
function animarTormenta(mapa, caminos, colores) {
  const contenedor = mapa.getCanvasContainer?.() ?? mapa.getContainer();
  const lienzoMapa = mapa.getCanvas();
  const lienzo = document.createElement("canvas");
  lienzo.className = "relieve-lienzo-tormenta";
  lienzo.setAttribute("aria-hidden", "true");
  if (lienzoMapa?.parentNode === contenedor) lienzoMapa.after(lienzo);
  else contenedor.append(lienzo);
  const ctx = lienzo.getContext("2d");

  const ajustar = () => {
    const caja = mapa.getContainer();
    const dpr = window.devicePixelRatio || 1;
    const ancho = caja.clientWidth;
    const alto = caja.clientHeight;
    lienzo.style.width = `${ancho}px`;
    lienzo.style.height = `${alto}px`;
    lienzo.width = Math.max(1, Math.round(ancho * dpr));
    lienzo.height = Math.max(1, Math.round(alto * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  ajustar();
  mapa.on("resize", ajustar);

  // Escala de pantalla: píxeles por unidad de longitud (grado de latitud) en el centro del mapa.
  const centro = mapa.getCenter();
  const p0 = mapa.project([centro.lng, centro.lat]);
  const p1 = mapa.project([centro.lng, centro.lat + 0.01]);
  const pxPorUnidad = Math.max(1e-9, Math.hypot(p1.x - p0.x, p1.y - p0.y) / 0.01);

  // Solo los caminos que se ven (si ninguno se ve, todos).
  const b = mapa.getBounds();
  const enVista = caminos.filter((c) => c.caja[2] >= b.getWest() && c.caja[0] <= b.getEast() && c.caja[3] >= b.getSouth() && c.caja[1] <= b.getNorth());
  const usar = enVista.length ? enVista : caminos;
  const total = usar.reduce((a, c) => a + c.largo, 0);

  const gotas = [];
  for (const c of usar) {
    const n = total > 0 ? Math.max(1, Math.round((MAX_GOTAS * c.largo) / total)) : 1;
    for (let k = 0; k < n; k++) {
      gotas.push({
        camino: c,
        s0: Math.random() * c.largo,
        v: (RECORRIDO_PX * (0.7 + Math.random() * 0.6)) / pxPorUnidad / DURACION_MS,
        retraso: Math.random() * CAIDA_MS,
      });
    }
  }

  let cuadro = null;
  let reloj = null;
  let fin;
  const promesa = new Promise((ok) => { fin = ok; });
  let terminado = false;
  const terminar = () => {
    if (terminado) return;
    terminado = true;
    if (cuadro != null) cancelAnimationFrame(cuadro);
    clearTimeout(reloj);
    mapa.off("resize", ajustar);
    lienzo.remove();
    fin({ animada: true, gotas: gotas.length });
  };

  const t0 = performance.now();
  const dibujar = (ahora) => {
    const t = ahora - t0;
    if (t >= DURACION_MS) {
      terminar();
      return;
    }
    ctx.clearRect(0, 0, lienzo.width, lienzo.height);
    ctx.fillStyle = colores.gota;
    ctx.strokeStyle = colores.gotaBorde;
    ctx.lineWidth = 1;
    const desvanece = Math.min(1, Math.max(0, (DURACION_MS - t) / DESVANECER_MS));
    for (const g of gotas) {
      const tg = t - g.retraso;
      if (tg < 0) continue;
      const cae = Math.min(1, tg / (CAIDA_MS / 2));
      const [lng, lat] = puntoEn(g.camino, g.s0 + g.v * tg);
      const p = mapa.project([lng, lat]);
      ctx.globalAlpha = cae * desvanece;
      ctx.beginPath();
      ctx.arc(p.x, p.y, RADIO_GOTA_PX * (0.4 + 0.6 * cae), 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    cuadro = requestAnimationFrame(dibujar);
  };
  cuadro = requestAnimationFrame(dibujar);
  // Respaldo: si el navegador pausa requestAnimationFrame (pestaña oculta), la animación igual termina.
  reloj = setTimeout(terminar, DURACION_MS + DESVANECER_MS);

  return { promesa, detener: terminar, gotas: gotas.length };
}

// ---------------------------------------------------------------------------
// Textos (inglés; ninguna cifra escrita: todas llegan de relieve.json)
// ---------------------------------------------------------------------------
function htmlControles(ids) {
  return (
    `<div class="relieve-controles">` +
    `<label class="interruptor relieve-interruptor" for="${ids.mostrar}">` +
    `<input type="checkbox" role="switch" id="${ids.mostrar}" aria-controls="${ids.leyenda}"> <span>Terrain &amp; runoff</span></label>` +
    `<button type="button" class="relieve-boton-tormenta" id="${ids.boton}" aria-controls="${ids.tormenta}" aria-describedby="${ids.ayuda}">` +
    `<span class="relieve-icono-lluvia" aria-hidden="true"></span>Simulate a storm</button>` +
    `</div>` +
    `<p class="relieve-ayuda" id="${ids.ayuda}">Shows where rain runs off and gathers across the pilot area (zone context, not field drainage design).</p>` +
    `<div class="relieve-leyenda" id="${ids.leyenda}" hidden></div>` +
    `<div class="relieve-tormenta" id="${ids.tormenta}" hidden></div>` +
    `<p class="relieve-aviso" data-parte="aviso" hidden></p>` +
    `<p class="relieve-solo-lector" data-parte="estado" role="status" aria-live="polite"></p>`
  );
}

/** Valores distintos de una propiedad entre las zonas; con más de uno, cada uno lleva su zona. */
function distintos(bloques, valor, nombreZona) {
  const grupos = new Map();
  for (const [id, z] of bloques) {
    const v = valor(z);
    const llave = JSON.stringify(v ?? null);
    if (!grupos.has(llave)) grupos.set(llave, { v, zonas: [] });
    grupos.get(llave).zonas.push(nombreZona(id));
  }
  const lista = [...grupos.values()];
  return lista.map((g) => ({ v: g.v, prefijo: lista.length > 1 ? `${g.zonas.join(", ")}: ` : "" }));
}

function htmlLeyenda(relieve, bloques, nombreZona) {
  const umbrales = distintos(bloques, (z) => ({ ha: z.umbral_ruta_ha ?? null, etiqueta: z.umbral_ruta_etiqueta ?? null }), nombreZona);
  const rotulos = distintos(bloques, (z) => z.rotulo ?? null, nombreZona);
  // Una zona (o el mismo umbral en todas): «where the runoff of at least X ha of land concentrates».
  // Umbrales distintos por zona: «where runoff concentrates (Zona A: at least X ha; Zona B: …)».
  const etiquetaDe = (v) => (v?.etiqueta ? ` <span class="relieve-etiqueta">${esc(v.etiqueta)}</span>` : "");
  const haDe = (v) => `at least <strong>${esc(fmt(v.ha, 3))} ha</strong> of land`;
  const textoUmbral = ({ v, prefijo }) =>
    `${esc(prefijo)}${num(v?.ha) == null ? "threshold not available" : haDe(v)}${etiquetaDe(v)}`;
  const unico = umbrales.length === 1 ? umbrales[0].v : null;
  const rutas =
    unico && num(unico.ha) != null
      ? `Runoff paths: where the runoff of ${haDe(unico)} concentrates${etiquetaDe(unico)}`
      : `Runoff paths: where runoff concentrates (${umbrales.map(textoUmbral).join("; ")})`;
  const escala = rotulos
    .map(({ v, prefijo }) => `${esc(prefijo)}${v ? esc(v) : "scale label not available"}`)
    .join("; ");
  return (
    `<ul>` +
    `<li><span class="relieve-muestra-ruta" aria-hidden="true"></span><span>${rutas}</span></li>` +
    `<li><span class="relieve-muestra-gota" aria-hidden="true"></span><span>Rain drops in “Simulate a storm”</span></li>` +
    `</ul>` +
    `<p class="relieve-escala">Scale: ${escala}</p>` +
    `<p class="fuente">Thicker lines: more runoff paths have joined. Zone context, not a field measurement.` +
    `${relieve?.fuente ? ` Source: ${esc(relieve.fuente)}` : ""}</p>`
  );
}

function htmlTormenta(bloques, nombreZona) {
  const varias = bloques.length > 1;
  const filas = bloques
    .map(([id, z]) => {
      const t = z?.tormenta ?? {};
      const mm = num(t.mm);
      return (
        `<div class="relieve-tormenta-zona">` +
        `<p class="relieve-tormenta-titulo">Reference storm${varias ? ` — ${esc(nombreZona(id))}` : ""}</p>` +
        `<p class="relieve-tormenta-cifra">${mm == null ? "<strong>no data</strong>" : `<strong>${esc(fmt(mm, 3))} mm</strong>`}` +
        `${t.definicion ? ` <span class="relieve-tormenta-def">${esc(t.definicion)}</span>` : ""}</p>` +
        `${t.periodo ? `<p class="relieve-tormenta-periodo">Period: ${esc(t.periodo)}</p>` : ""}` +
        `<p class="fuente">Source: ${t.fuente ? esc(t.fuente) : "not available"}</p>` +
        `</div>`
      );
    })
    .join("");
  return (
    filas +
    `<p class="relieve-nota">Illustrative heavy rain from the area's own record, not a forecast. ` +
    `It shows where runoff flows and gathers; it gives no flood depths and does not design field drainage.</p>`
  );
}

/** Línea de la ficha (renglón Soil) con los tres indicadores de relieve y el rótulo de escala. */
export function htmlRelieveParcela(p, opciones = {}) {
  const props = p?.properties ?? p;
  const r = props?.relieve;
  if (!r || typeof r !== "object") return "";
  const pendiente = num(r.pendiente_media_pct);
  const aporte = num(r.aportacion_externa_ha);
  const depresion = num(r.frac_depresion);
  if (pendiente == null && aporte == null && depresion == null) return "";
  const rotulo = opciones.rotulo ?? rotuloDeZona(opciones.relieve ?? ultimoRelieve, props.zona);
  const partes = [
    pendiente == null ? "mean slope: no data" : `mean slope <strong>${esc(fmt(pendiente, 1))}%</strong>`,
    aporte == null
      ? "runoff from upslope: no data"
      : aporte > 0
        ? `receives runoff from up to <strong>${esc(fmt(aporte, 1))} ha</strong> upslope`
        : "receives no runoff from upslope",
    depresion == null ? "terrain depressions: no data" : `<strong>${esc(fmtPct(depresion))}</strong> of the field in terrain depressions`,
  ];
  return (
    `<p class="relieve-parcela"><span class="relieve-parcela-titulo">Terrain (context):</span> ${partes.join(" · ")} ` +
    `<span class="relieve-escala">(${esc(rotulo ?? "scale label not available")})</span></p>`
  );
}

// ---------------------------------------------------------------------------
// API principal
// ---------------------------------------------------------------------------
function resolverContenedor(c) {
  if (!c) return null;
  if (typeof c === "string") return document.querySelector(c);
  return c instanceof Element ? c : null;
}

/**
 * Agrega la capa «Terrain & runoff» y su bloque de controles.
 * @param mapa  mapa de MapLibre ya creado (o null si no hay mapa: solo se lee relieve.json para la ficha)
 * @param ctx   {rutasUrl, relieveUrl, zonaActiva, contenedor, nombreZona, antesDe}
 * @returns     controlador {disponible, elemento, mostrar, visible, fijarZona, simularTormenta, detener, destruir, estado}
 */
export async function agregarCapaRelieve(mapa, ctx = {}) {
  const {
    rutasUrl = "data/relieve_rutas.geojson",
    relieveUrl = "data/relieve.json",
    zonaActiva = null,
    contenedor = null,
    nombreZona = nombrePorOmision,
    antesDe = undefined,
  } = ctx;

  // Bloque de controles: dentro del contenedor del integrador o, si no hay, flotando sobre el mapa.
  contadorBloques += 1;
  const sufijo = `relieve-${contadorBloques}`;
  const ids = {
    mostrar: `${sufijo}-mostrar`,
    boton: `${sufijo}-tormenta-boton`,
    ayuda: `${sufijo}-ayuda`,
    leyenda: `${sufijo}-leyenda`,
    tormenta: `${sufijo}-tormenta`,
  };
  const elemento = document.createElement("div");
  elemento.className = "relieve";
  const destino = resolverContenedor(contenedor);
  if (destino) destino.append(elemento);
  else if (mapa?.getContainer) {
    elemento.classList.add("relieve-flotante");
    mapa.getContainer().append(elemento);
  }

  const [relieve, rutasFc] = await Promise.all([cargarRelieve(relieveUrl), leerJSON(rutasUrl)]);
  const rutasOk = Array.isArray(rutasFc?.features) && rutasFc.features.length > 0;
  const estado = {
    disponible: false,
    visible: false,
    resaltado: false,
    animacion: null,
    zona: zonaActiva ?? null,
    rutas: null,
  };

  const noCorrido = (texto) => {
    elemento.dataset.relieve = "no-corrido";
    elemento.innerHTML = `<p class="relieve-no-corrido" role="note">${esc(texto)}</p>`;
  };

  const controlador = {
    disponible: false,
    elemento,
    mostrar: () => {},
    visible: () => false,
    fijarZona: () => {},
    simularTormenta: async () => ({ animada: false }),
    detener: () => {},
    destruir: () => elemento.remove(),
    estado: () => ({ disponible: false, visible: false, animando: false, resaltado: false, zona: estado.zona, caminos: 0, gotas: 0 }),
  };

  if (!relieve || !rutasOk) {
    noCorrido("Terrain layer: not run");
    return controlador;
  }
  if (!mapa || typeof mapa.addSource !== "function") {
    noCorrido("Terrain layer: needs the map, which is not available here.");
    return controlador;
  }

  estado.rutas = prepararRutas(rutasFc);
  if (!estado.rutas.piezas.features.length) {
    noCorrido("Terrain layer: not run");
    return controlador;
  }
  const colores = coloresRelieve();
  try {
    await conEstilo(mapa, () => agregarAlMapa(mapa, estado.rutas.piezas, colores, antesDe));
  } catch (err) {
    console.warn("Raíz: terrain layer not added", err);
    noCorrido("Terrain layer: needs the map, which is not available here.");
    return controlador;
  }

  elemento.dataset.relieve = "listo";
  elemento.innerHTML = htmlControles(ids);
  const interruptor = elemento.querySelector(`#${ids.mostrar}`);
  const boton = elemento.querySelector(`#${ids.boton}`);
  const leyenda = elemento.querySelector(`#${ids.leyenda}`);
  const tarjeta = elemento.querySelector(`#${ids.tormenta}`);
  const aviso = elemento.querySelector('[data-parte="aviso"]');
  const anuncio = elemento.querySelector('[data-parte="estado"]');

  const bloques = () => bloquesZona(relieve, estado.zona);
  const caminosZona = () => {
    const { caminos, hayZona } = estado.rutas;
    return hayZona && estado.zona ? caminos.filter((c) => c.zona === estado.zona) : caminos;
  };

  const resaltar = (si) => {
    estado.resaltado = si;
    mapa.setPaintProperty(CAPA_LINEA, "line-color", si ? colores.rutaFuerte : colores.ruta);
    mapa.setPaintProperty(CAPA_LINEA, "line-width", expresionAncho(si ? 1.6 : 1, 0));
    mapa.setPaintProperty(CAPA_BORDE, "line-width", expresionAncho(si ? 1.6 : 1, 2));
    elemento.dataset.resaltado = String(si);
  };

  const detener = () => {
    estado.animacion?.detener();
    estado.animacion = null;
    elemento.dataset.animando = "false";
  };

  const mostrar = (si = true) => {
    const v = Boolean(si) && bloques().length > 0;
    estado.visible = v;
    for (const id of [CAPA_BORDE, CAPA_LINEA]) mapa.setLayoutProperty(id, "visibility", v ? "visible" : "none");
    interruptor.checked = v;
    leyenda.hidden = !v;
    if (!v) {
      detener();
      resaltar(false);
      tarjeta.hidden = true;
    }
    elemento.dataset.visible = String(v);
  };

  const pintarZona = () => {
    const bs = bloques();
    const hay = bs.length > 0;
    interruptor.disabled = !hay;
    boton.disabled = !hay;
    aviso.hidden = hay;
    aviso.textContent = hay ? "" : "Terrain layer: not run for this pilot area.";
    if (!hay) mostrar(false);
    leyenda.innerHTML = hay ? htmlLeyenda(relieve, bs, nombreZona) : "";
    if (!tarjeta.hidden) tarjeta.innerHTML = htmlTormenta(bs, nombreZona);
    // Filtro por zona solo si las rutas traen properties.zona; si no, se muestran todas las rutas.
    const filtro = estado.rutas.hayZona && estado.zona ? ["==", ["get", "zona"], estado.zona] : null;
    for (const id of [CAPA_BORDE, CAPA_LINEA]) mapa.setFilter(id, filtro);
  };

  const simularTormenta = async () => {
    const bs = bloques();
    if (!bs.length) return { animada: false };
    detener();
    mostrar(true);
    resaltar(true);
    tarjeta.innerHTML = htmlTormenta(bs, nombreZona);
    tarjeta.hidden = false;
    const mm = bs.length === 1 ? num(bs[0][1]?.tormenta?.mm) : null;
    const lamina = mm == null ? "" : ` of ${fmt(mm, 3)} mm`;
    if (reduceMovimiento()) {
      elemento.dataset.animando = "false";
      anuncio.textContent = `Reference storm${lamina}: runoff paths highlighted (reduced motion, no animation).`;
      return { animada: false };
    }
    const caminos = caminosZona();
    if (!caminos.length) {
      // La zona tiene relieve.json pero sus rutas no vienen en el archivo: nada que animar.
      elemento.dataset.animando = "false";
      anuncio.textContent = `Reference storm${lamina}: no runoff paths for this pilot area in the terrain file.`;
      return { animada: false };
    }
    const anim = animarTormenta(mapa, caminos, colores);
    estado.animacion = anim;
    elemento.dataset.animando = "true";
    anuncio.textContent = `Simulating a reference storm${lamina}: drops follow the runoff paths.`;
    const r = await anim.promesa;
    if (estado.animacion === anim) {
      estado.animacion = null;
      elemento.dataset.animando = "false";
      anuncio.textContent = "Storm simulation finished: runoff gathers along the thicker paths.";
    }
    return r;
  };

  interruptor.addEventListener("change", () => mostrar(interruptor.checked));
  boton.addEventListener("click", () => { simularTormenta(); });

  pintarZona();
  mostrar(false); // oculta por omisión

  estado.disponible = true;
  Object.assign(controlador, {
    disponible: true,
    mostrar,
    visible: () => estado.visible,
    fijarZona: (zona) => {
      detener();
      estado.zona = zona ?? null;
      pintarZona();
    },
    simularTormenta,
    detener,
    destruir: () => {
      detener();
      quitarDelMapa(mapa);
      elemento.remove();
    },
    estado: () => ({
      disponible: true,
      visible: estado.visible,
      animando: Boolean(estado.animacion),
      resaltado: estado.resaltado,
      zona: estado.zona,
      caminos: caminosZona().length,
      gotas: estado.animacion?.gotas ?? 0,
    }),
  });
  return controlador;
}
