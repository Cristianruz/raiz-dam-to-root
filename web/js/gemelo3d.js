// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// web/js/gemelo3d.js — Vista 3D del gemelo digital: relieve de NASADEM y columnas de agua por parcela
// (docs/decisiones/2026-11-14_gemelo_digital.md, «Qué cambia en el producto», punto 1). Módulo ES, sin dependencias.
//
// QUÉ EXPORTA (lo conecta app.js; este archivo no toca las capas, las fuentes ni los controles de la aplicación):
//   crearGemelo3D({ mapa, gemelo, reglas, alElegirParcela, reducirMovimiento, alAvisar, maplibre }) -> controlador
//     mapa               instancia de maplibregl.Map ya creada (la de la aplicación).
//     gemelo             contenido de web/data/gemelo.json (contrato de la decisión), o null si no se pudo leer.
//     reglas             módulo web/reglas.js: se usa reglas.evaluarOpcion (lámina y cobertura de la opción ACTUAL).
//     alElegirParcela    función(id): se llama con un clic, o con Enter, sobre una columna.
//     reducirMovimiento  booleano, o función que lo devuelve; si falta, se consulta prefers-reduced-motion.
//     alAvisar           opcional: función({ tipo, mensaje, zonaId, detalle }). Tipos:
//                          "no_disponible"  no hay relieve para la zona pedida (la vista no se activa, o se desactiva);
//                          "tesela"         una tesela del relieve no cargó (la vista sigue; una vez por activación);
//                          "sin_escala"     gemelo.columnas.metros_por_millar no es un número (no hay columnas);
//                          "error"          el navegador no pudo montar la vista (se desmonta sola).
//                        `mensaje` va en inglés y sin cifras escritas a mano.
//     maplibre           opcional: la biblioteca (por omisión, window.maplibregl); se usan addProtocol y removeProtocol.
//
//   controlador:
//     disponible(zonaId) -> boolean   true solo si gemelo.terreno.zonas[zonaId] existe (con su plantilla de teselas).
//                                     Con false, la página dice «3D twin view: not available» y no ofrece la vista.
//     activar(zonaId) -> boolean      monta el relieve de esa zona (fuente raster-dem + sombreado + terreno), inclina
//                                     la cámara (gemelo.camara) y dibuja las columnas. false si no está disponible.
//                                     Si el estilo del mapa aún no termina de cargar, se monta al terminar.
//     desactivar()                    retira capas, fuentes e imágenes propias (prefijo «gemelo-»), quita el terreno
//                                     y devuelve la inclinación y el rumbo a cero. No toca las capas de la aplicación.
//     actualizar({ features, cubo, D, r, zonaId })
//                                     datos con los que se calculan las columnas. Se puede llamar en cada cambio
//                                     (deslizador, lluvia, zona) y pasar solo lo que cambió; las llamadas se agrupan
//                                     con requestAnimationFrame. Inactiva, la vista solo guarda los datos.
//                                       features  arreglo de Features de parcelas.geojson (se usan las de la zona);
//                                       cubo      cubo.json;   D  dotación (millares/ha);   r  lluvia (0, −20…).
//                                       zonaId    si cambia a otra zona con relieve, se cambia de relieve; si esa
//                                                 zona no tiene relieve (o es «todas»), la vista se desactiva y avisa.
//     activo() -> boolean
//     leyendaHTML() -> string         leyenda en inglés; la exageración y los metros por millar salen de gemelo.json.
//     columnaEn(punto) -> id | null   columna bajo un punto de la pantalla ({x, y} o [x, y] del mapa). Sirve para que
//                                     el clic de la aplicación sobre sus propias capas ceda ante una columna.
//     depuracion                      (solo lectura, para pruebas) último cálculo: { version, zonaId, D, r,
//                                     metrosPorMillar, columnas, planas, cuenta, fuenteRelieve, teselasFallidas }.
//     destruir()                      desactiva sin animación y suelta todo; el controlador queda inerte.
//
// QUÉ DIBUJA (todo con el prefijo «gemelo-»):
//   · Parcela clasificada cuya opción ACTUAL pide agua (L50 > 0, lámina bruta P50 para la lluvia r): una columna.
//       de 0 a min(D, L50) × metros_por_millar          azul (Agua): lo que cubre la dotación elegida;
//       de min(D, L50) × k a L50 × k                     rojo con rayas: lo que falta.
//   · Parcela clasificada con L50 = 0: sin columna, plana, con borde verde continuo.
//   · Parcela sin clasificar (abstención, o sin opción ACTUAL): plana, gris, con rayas y borde punteado.
//   Nada depende solo del color: lo que falta va arriba y rayado; lo no clasificado, plano, rayado y punteado.
//
// DECISIONES DE ESTE ARCHIVO (para quien lo integre o lo revise):
//   1. Las teselas se piden con un protocolo propio de MapLibre («gemelo-dem://» + la URL absoluta, que se arma con
//      document.baseURI + terreno.zonas[zona].teselas). Así el módulo se entera de una tesela que falta (MapLibre
//      calla los 404) y la entrega como «no encontrada»: MapLibre usa entonces la tesela madre y la vista sigue,
//      sin errores del mapa en la consola (queda solo el 404 de red del navegador).
//   2. La codificación es la de terreno.encoding. Se le pasa a MapLibre con sus factores equivalentes
//      (encoding «custom») para restarle elev_min_m de la zona: el relieve se dibuja respecto al punto más bajo de
//      la zona y no como una meseta de más de un kilómetro sobre el plano sin datos (sin acantilados en el borde
//      del relieve ni donde falte una tesela). La forma del relieve y el sombreado no cambian.
//   3. Ninguna cifra escrita a mano: exageración, metros por millar, cámara, zooms y límites salen de gemelo.json;
//      las láminas, de cubo.json por reglas.js. Los números del código son medidas de diseño (anchos, duración).
//   4. Colores leídos de variables CSS (css/gemelo.css, que toma --agua, --rojo, --brote… de style.css).
//   5. La vista no reparte agua, no pronostica y no recomienda: dibuja lo que la rotación actual pide y lo que
//      la dotación elegida cubre.

const LOCALE = "en-US";

// Identificadores propios en MapLibre (fuentes, capas, imágenes y protocolo).
const PREFIJO = "gemelo-";
const PROTOCOLO = "gemelo-dem";
const SEPARADOR = "://";
const FUENTE_RELIEVE = "gemelo-dem";
const FUENTE_SOMBRA = "gemelo-dem-sombra";
const FUENTE_COLUMNAS = "gemelo-columnas";
const FUENTE_PLANAS = "gemelo-planas";
const CAPA_SOMBRA = "gemelo-sombra";
const CAPA_PLANA = "gemelo-plana";
const CAPA_PLANA_BORDE = "gemelo-plana-borde";
const CAPA_SIN_RIEGO = "gemelo-sin-riego";
const CAPA_SIN_RIEGO_BORDE = "gemelo-sin-riego-borde";
const CAPA_APUNTADA = "gemelo-columna-apuntada";
const CAPA_AGUA = "gemelo-columna-agua";
const CAPA_FALTA = "gemelo-columna-falta";
const CAPA_CAMARA = "gemelo-camara"; // capa «custom» sin dibujo: recibe la matriz de proyección de cada cuadro
const IMAGEN_PLANA = "gemelo-trama-plana";
const IMAGEN_FALTA = "gemelo-trama-falta";
const FUENTES = [FUENTE_COLUMNAS, FUENTE_PLANAS, FUENTE_SOMBRA, FUENTE_RELIEVE];
const IMAGENES = [IMAGEN_PLANA, IMAGEN_FALTA];
const CAPAS_COLUMNA = [CAPA_AGUA, CAPA_FALTA];

// Clases de parcela dentro de la vista.
const COLUMNA = "columna";
const SIN_RIEGO = "sin_riego";
const SIN_CLASIFICAR = "sin_clasificar";

// Medidas de diseño (no son datos).
const DURACION_CAMARA_MS = 900;
const FUERZA_SOMBRA = 0.55; // intensidad del sombreado del relieve
const LADO_TRAMA_PX = 16; // lado de la imagen de las rayas (se registra a doble densidad)
const GROSOR_TRAMA_PX = 2.5;
const OPACIDAD_PLANA = 0.85;
const OPACIDAD_SIN_RIEGO = 0.18;
const SEPARACION_ETIQUETA_PX = 14;
const MARGEN_ETIQUETA_PX = 8;
const BAJO_LA_MIRA_PX = 26;

// Decodificación de las teselas según terreno.encoding (las mismas fórmulas que usa MapLibre):
// altura (m) = R × rojo + G × verde + B × azul − base.
const CODIFICACIONES = {
  terrarium: { rojo: 256, verde: 1, azul: 1 / 256, base: 32768 },
  mapbox: { rojo: 6553.6, verde: 25.6, azul: 0.1, base: 10000 },
};
// Estado HTTP con el que se entrega a MapLibre una tesela que no cargó: lo trata como «no existe», sigue con la
// tesela madre y no lo reporta como error del mapa.
const NO_ENCONTRADA = 404;

const TEXTOS = {
  noDisponible: "Terrain for this area is not available, so the twin view stays flat.",
  tesela: "Some terrain tiles could not be loaded: the relief may look flat in places. Fields and columns are still shown.",
  sinEscala: "The column scale is missing from the twin data, so water columns are not drawn.",
  error: "The twin view could not be drawn in this browser. The flat map still works.",
  ayuda:
    "Twin view. Move the map with the arrow keys to bring a water column under the center mark, then press Enter to open that field.",
  tecla: "Press Enter to open this field",
  sinColumna: "No water column under the center mark",
};

let contadorVistas = 0;

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
function formateador(opciones) {
  const llave = JSON.stringify(opciones);
  if (!formatos.has(llave)) formatos.set(llave, new Intl.NumberFormat(LOCALE, opciones));
  return formatos.get(llave);
}
/** Número leído de los datos, con su precisión (hasta tres decimales); «—» si no es número. */
function fmt(v) {
  const n = num(v);
  return n == null ? "—" : formateador({ maximumFractionDigits: 3 }).format(n);
}
function fmtPct(fraccion) {
  const n = num(fraccion);
  return n == null ? "—" : formateador({ style: "percent", maximumFractionDigits: 0 }).format(n);
}

/** Color de una variable CSS; si falta, la de respaldo; si tampoco, el color del texto de la página. */
function colorCSS(nombre, respaldo) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--${nombre}`).trim();
  if (v) return v;
  if (respaldo) return colorCSS(respaldo, null);
  return getComputedStyle(document.body).color;
}

function coloresGemelo() {
  return {
    agua: colorCSS("gemelo-agua", "agua"),
    aguaApuntada: colorCSS("gemelo-agua-apuntada", "agua-osc"),
    falta: colorCSS("gemelo-falta", "rojo"),
    faltaTrama: colorCSS("gemelo-falta-trama", "rojo-claro"),
    plana: colorCSS("gemelo-plana", "gris"),
    planaTrama: colorCSS("gemelo-plana-trama", "tinta-suave"),
    planaBorde: colorCSS("gemelo-plana-borde", "tinta-suave"),
    sinRiego: colorCSS("gemelo-sin-riego", "brote"),
    sombra: colorCSS("gemelo-sombra", "tierra"),
    luz: colorCSS("gemelo-luz", "blanco"),
    tinta: colorCSS("gemelo-tinta", "tinta"),
  };
}

function prefiereMenosMovimiento() {
  return globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * URL absoluta de la plantilla de teselas: document.baseURI + la ruta de gemelo.json.
 * Se arma con texto (y no con new URL sobre la plantilla) para conservar {z}, {x} y {y} sin codificar.
 */
function urlAbsoluta(plantilla) {
  const texto = String(plantilla);
  if (/^[a-z][a-z+.-]*:/i.test(texto)) return texto; // ya es absoluta
  if (texto.startsWith("/")) return new URL(document.baseURI).origin + texto;
  return new URL(".", document.baseURI).href + texto; // carpeta de la página (sin archivo, consulta ni ancla)
}

/** Rayas diagonales sin costuras, como imagen para fill-pattern y fill-extrusion-pattern. */
function imagenDeRayas(fondo, raya) {
  const lado = LADO_TRAMA_PX;
  const lienzo = document.createElement("canvas");
  lienzo.width = lado;
  lienzo.height = lado;
  const ctx = lienzo.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, lado, lado);
  ctx.strokeStyle = raya;
  ctx.lineWidth = GROSOR_TRAMA_PX;
  ctx.lineCap = "square";
  ctx.beginPath();
  for (const d of [-lado, 0, lado]) {
    ctx.moveTo(d, lado);
    ctx.lineTo(d + lado, 0);
  }
  ctx.stroke();
  return ctx.getImageData(0, 0, lado, lado);
}

// ---------------------------------------------------------------------------
// Geometría para saber qué columna está bajo un punto de la pantalla
// (la consulta de MapLibre no suma la altura del terreno a las extrusiones: se calcula aquí)
// ---------------------------------------------------------------------------
const mercatorPorGeometria = new WeakMap(); // geometry -> { anillos, centro, centroXY, zPorMetro }

/** Anillos exteriores de la parcela en coordenadas Mercator (0 a 1), su centro y la escala vertical. */
function enMercator(geometria, Mercator) {
  let g = mercatorPorGeometria.get(geometria);
  if (g) return g;
  const poligonos =
    geometria.type === "Polygon" ? [geometria.coordinates] : geometria.type === "MultiPolygon" ? geometria.coordinates : [];
  const anillos = [];
  let lng = 0;
  let lat = 0;
  let n = 0;
  for (const poligono of poligonos) {
    const exterior = poligono?.[0];
    if (!Array.isArray(exterior) || exterior.length < 3) continue;
    const xy = new Float64Array(exterior.length * 2);
    exterior.forEach((c, i) => {
      const m = Mercator.fromLngLat([c[0], c[1]]);
      xy[i * 2] = m.x;
      xy[i * 2 + 1] = m.y;
      lng += c[0];
      lat += c[1];
      n += 1;
    });
    anillos.push(xy);
  }
  if (n) {
    const centro = [lng / n, lat / n];
    const m = Mercator.fromLngLat(centro);
    g = { anillos, centro, centroXY: [m.x, m.y], zPorMetro: m.meterInMercatorCoordinateUnits() };
  } else {
    g = { anillos, centro: null, centroXY: null, zPorMetro: 0 };
  }
  mercatorPorGeometria.set(geometria, g);
  return g;
}

/** Proyecta los vértices de un anillo a píxeles de pantalla, a una altura z. Devuelve null si alguno queda detrás de la cámara. */
function anilloEnPantalla(m, xy, z, ancho, alto) {
  const salida = new Float64Array(xy.length);
  for (let i = 0; i < xy.length; i += 2) {
    const x = xy[i];
    const y = xy[i + 1];
    const w = m[3] * x + m[7] * y + m[11] * z + m[15];
    if (!(w > 0)) return null;
    salida[i] = ((m[0] * x + m[4] * y + m[8] * z + m[12]) / w + 1) * 0.5 * ancho;
    salida[i + 1] = (1 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w) * 0.5 * alto;
  }
  return salida;
}

/** ¿El punto (px, py) cae dentro del polígono? `v` es [x, y, x, y…]; `indices` elige los vértices (o todos). */
function puntoDentro(px, py, v, indices) {
  const n = indices ? indices.length : v.length / 2;
  let dentro = false;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const a = (indices ? indices[i] : i) * 2;
    const b = (indices ? indices[j] : j) * 2;
    const ya = v[a + 1];
    const yb = v[b + 1];
    if (ya > py !== yb > py && px < ((v[b] - v[a]) * (py - ya)) / (yb - ya) + v[a]) dentro = !dentro;
  }
  return dentro;
}

/** ¿El punto cae sobre la columna? Tapa, pie o cualquiera de sus caras laterales. */
function puntoEnColumna(px, py, pie, cima) {
  if (puntoDentro(px, py, cima) || puntoDentro(px, py, pie)) return true;
  // Caras laterales: cuadrilátero entre cada lado del pie y el mismo lado de la tapa.
  const n = pie.length / 2;
  const cara = new Float64Array(8);
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    cara.set([pie[j * 2], pie[j * 2 + 1], pie[i * 2], pie[i * 2 + 1], cima[i * 2], cima[i * 2 + 1], cima[j * 2], cima[j * 2 + 1]]);
    if (puntoDentro(px, py, cara)) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Protocolo de las teselas del relieve (uno para todas las vistas activas)
// ---------------------------------------------------------------------------
const oyentesDeTeselas = new Set(); // funciones(url) de las vistas montadas

function errorDeTesela(url) {
  const error = new Error(`Terrain tile not available: ${url}`);
  error.status = NO_ENCONTRADA;
  return error;
}

/** Pide una tesela. Si no llega (404, sin red), avisa a las vistas y la entrega como «no encontrada». */
async function pedirTesela(parametros, control) {
  const url = String(parametros.url).slice(PROTOCOLO.length + SEPARADOR.length);
  let respuesta = null;
  try {
    respuesta = await fetch(url, { signal: control?.signal });
  } catch (error) {
    if (control?.signal?.aborted) throw error; // MapLibre canceló la tesela (salió de la vista): no es una falla
  }
  if (!respuesta?.ok) {
    for (const oyente of oyentesDeTeselas) oyente(url);
    throw errorDeTesela(url);
  }
  return { data: await respuesta.arrayBuffer() };
}

function registrarProtocolo(biblioteca, oyente) {
  if (typeof biblioteca?.addProtocol !== "function") return false;
  if (!oyentesDeTeselas.size) biblioteca.addProtocol(PROTOCOLO, pedirTesela);
  oyentesDeTeselas.add(oyente);
  return true;
}

function soltarProtocolo(biblioteca, oyente) {
  if (!oyentesDeTeselas.delete(oyente)) return;
  if (!oyentesDeTeselas.size && typeof biblioteca?.removeProtocol === "function") biblioteca.removeProtocol(PROTOCOLO);
}

// ---------------------------------------------------------------------------
// Fuente del relieve
// ---------------------------------------------------------------------------
/** Codificación para MapLibre: la del JSON, con la base desplazada a elev_min_m de la zona (decisión 2). */
function codificacionRelieve(terreno, zona) {
  const factores = CODIFICACIONES[terreno.encoding];
  const piso = num(zona.elev_min_m);
  if (!factores || piso == null) return { encoding: terreno.encoding };
  return {
    encoding: "custom",
    redFactor: factores.rojo,
    greenFactor: factores.verde,
    blueFactor: factores.azul,
    baseShift: factores.base + piso,
  };
}

/** Especificación de la fuente raster-dem de una zona (la misma para el terreno y para el sombreado). */
function fuenteRelieve(terreno, zona, conProtocolo) {
  const url = urlAbsoluta(zona.teselas);
  const fuente = {
    type: "raster-dem",
    tiles: [conProtocolo ? PROTOCOLO + SEPARADOR + url : url],
    ...codificacionRelieve(terreno, zona),
  };
  for (const llave of ["tileSize", "minzoom", "maxzoom"]) {
    const v = num(terreno[llave]);
    if (v != null) fuente[llave] = v;
  }
  const limites = zona.bounds;
  if (Array.isArray(limites) && limites.length === 4 && limites.every((v) => num(v) != null)) {
    fuente.bounds = limites.map(Number);
  }
  if (terreno.fuente) fuente.attribution = esc(terreno.fuente);
  return fuente;
}

// ---------------------------------------------------------------------------
// Cálculo de las columnas (sin MapLibre: se puede probar con Node)
// ---------------------------------------------------------------------------
/**
 * Clasifica las parcelas de la zona y calcula la altura de sus columnas.
 * Devuelve { columnas, planas, firmaPlanas, porId, cuenta }: dos FeatureCollection (las columnas cambian con D;
 * las planas, no), el detalle por parcela y los conteos.
 *   cubre_m = min(D, L50) × metrosPorMillar     pide_m = L50 × metrosPorMillar     falta_m = pide_m − cubre_m
 */
export function calcularColumnas({ features, cubo, D, r, zonaId, metrosPorMillar, reglas }) {
  const columnas = [];
  const planas = [];
  const firma = [];
  const porId = new Map();
  const cuenta = { [COLUMNA]: 0, [SIN_RIEGO]: 0, [SIN_CLASIFICAR]: 0 };
  const k = num(metrosPorMillar);
  const dotacion = Math.max(num(D) ?? 0, 0);
  const lluvia = r ?? cubo?.lluvia_pct?.[0];

  for (const f of Array.isArray(features) ? features : []) {
    const p = f?.properties;
    if (!p || p.id == null || !f.geometry) continue;
    if (zonaId != null && p.zona != null && p.zona !== zonaId) continue; // la vista trabaja sobre una zona a la vez
    const opciones = cubo?.parcelas?.[p.id]?.opciones;
    const actual = Array.isArray(opciones) ? opciones.find((o) => o.id === "ACTUAL") : null;
    let l50 = null;
    let cobertura = null;
    if (!p.abstencion && actual) {
      try {
        const evaluada = reglas.evaluarOpcion(actual, p.area_ha, dotacion, lluvia);
        l50 = num(evaluada.lamina?.p50);
        cobertura = num(evaluada.cobertura);
      } catch {
        l50 = null; // el cubo no trae la lámina de esa lluvia: se dibuja como parcela sin dato
      }
    }
    const clase = l50 == null ? SIN_CLASIFICAR : l50 > 0 ? COLUMNA : SIN_RIEGO;
    cuenta[clase] += 1;
    porId.set(p.id, { clase, l50, cobertura });
    if (clase !== COLUMNA) {
      planas.push({ type: "Feature", geometry: f.geometry, properties: { id: p.id, clase } });
      firma.push(`${p.id}:${clase}`);
      continue;
    }
    if (k == null) continue; // sin escala no hay altura que dibujar (se avisa aparte)
    const cubre = Math.min(dotacion, l50) * k;
    const pide = l50 * k;
    columnas.push({
      type: "Feature",
      geometry: f.geometry,
      properties: { id: p.id, clase, l50, cobertura, cubre_m: cubre, pide_m: pide, falta_m: pide - cubre },
    });
  }
  return {
    columnas: { type: "FeatureCollection", features: columnas },
    planas: { type: "FeatureCollection", features: planas },
    firmaPlanas: firma.join("|"),
    porId,
    cuenta,
  };
}

// ---------------------------------------------------------------------------
// Leyenda
// ---------------------------------------------------------------------------
function htmlLeyenda(gemelo) {
  const terreno = gemelo?.terreno ?? {};
  const columnas = gemelo?.columnas ?? {};
  const exageracion = num(terreno.exageracion);
  const metros = num(columnas.metros_por_millar);
  const escala = [];
  if (terreno.rotulo) escala.push(`Terrain: ${esc(terreno.rotulo)}`);
  if (exageracion != null) escala.push(`Vertical exaggeration of the terrain: ×${esc(fmt(exageracion))}`);
  if (metros != null) {
    const notas = [columnas.etiqueta ? `Label: ${esc(columnas.etiqueta)}` : "", esc(columnas.nota ?? "")].filter(Boolean);
    escala.push(
      `Column scale: ${esc(fmt(metros))} m of height for each thousand m³/ha` + (notas.length ? ` (${notas.join("; ")})` : ""),
    );
  }
  const muestra = (clase) => `<span class="gemelo-muestra gemelo-muestra-${clase}" aria-hidden="true"></span>`;
  return (
    '<div class="gemelo-leyenda">' +
    '<p class="gemelo-leyenda-titulo">Column height = water the current rotation asks for per hectare</p>' +
    '<ul class="gemelo-leyenda-lista">' +
    `<li>${muestra("columna")}<span>Blue: covered by the chosen allocation · Red: not covered</span></li>` +
    `<li>${muestra("plana")}<span>Flat grey: not classified</span></li>` +
    `<li>${muestra("sin-riego")}<span>Flat with a green outline: the current rotation asks for no irrigation</span></li>` +
    "</ul>" +
    escala.map((t) => `<p class="gemelo-leyenda-escala">${t}</p>`).join("") +
    `<p class="gemelo-leyenda-fuente">Source: ${terreno.fuente ? esc(terreno.fuente) : "not available"}</p>` +
    "</div>"
  );
}

// ---------------------------------------------------------------------------
// La vista
// ---------------------------------------------------------------------------
export function crearGemelo3D({ mapa, gemelo, reglas, alElegirParcela, reducirMovimiento, alAvisar, maplibre } = {}) {
  if (typeof reglas?.evaluarOpcion !== "function") {
    throw new TypeError("crearGemelo3D: falta reglas.evaluarOpcion (pase el módulo web/reglas.js)");
  }
  const biblioteca = maplibre ?? globalThis.maplibregl;
  const numeroVista = (contadorVistas += 1);
  const est = {
    activo: false, // la vista está pedida (aunque el estilo del mapa aún no termine de cargar)
    montado: false, // las capas propias ya están en el mapa
    destruido: false,
    zonaId: null,
    datos: { features: null, cubo: null, D: null, r: null },
    cuadro: 0, // requestAnimationFrame pendiente del cálculo
    cuadroPuntero: 0,
    version: 0,
    ultimo: null, // último resultado de calcularColumnas
    firmaPlanas: null,
    fuenteRelieve: null,
    conProtocolo: false,
    teselasFallidas: [],
    matriz: null, // Mercator (0 a 1, con altura) -> espacio de recorte, del último cuadro dibujado
    avisados: new Set(), // tipos de aviso ya emitidos en esta activación
    apuntada: null,
    conTeclado: false,
    ultimoPuntero: null,
    pusoCursor: false,
    maxPitchPrevio: null,
    habiaOyenteDeError: false,
    dom: null,
  };

  let estiloListo = Boolean(mapa?.loaded?.() || mapa?.isStyleLoaded?.());
  const pendientesDeEstilo = [];
  if (mapa && !estiloListo) {
    const alListo = () => {
      if (estiloListo) return;
      estiloListo = true;
      for (const f of pendientesDeEstilo.splice(0)) f();
    };
    mapa.once("load", alListo);
    mapa.once("idle", alListo);
  }
  const cuandoEstiloListo = (f) => (estiloListo ? f() : pendientesDeEstilo.push(f));

  // -------------------------------------------------------------- avisos
  /** Emite un aviso (una vez por tipo en cada activación; `repetible` lo emite siempre). */
  function avisar(tipo, mensaje, { detalle = null, zonaId = est.zonaId, repetible = false } = {}) {
    if (!repetible && est.avisados.has(tipo)) return;
    est.avisados.add(tipo);
    if (typeof alAvisar !== "function") return;
    try {
      alAvisar({ tipo, mensaje, zonaId: zonaId ?? null, detalle });
    } catch (error) {
      console.warn("Raíz: twin view notice handler failed", error);
    }
  }

  function alFallarTesela(url) {
    const zona = gemelo?.terreno?.zonas?.[est.zonaId];
    if (!est.montado || !zona) return;
    const base = urlAbsoluta(zona.teselas).split("{")[0];
    if (!url.startsWith(base)) return; // la tesela es de otra vista
    if (!est.teselasFallidas.includes(url)) est.teselasFallidas.push(url);
    avisar("tesela", TEXTOS.tesela, { detalle: url });
  }

  /** Errores del mapa que vienen de las fuentes propias (imagen ilegible, tesela sin protocolo…). */
  function alErrorDelMapa(ev) {
    const idFuente = ev?.sourceId ?? ev?.source?.id ?? "";
    if (String(idFuente).startsWith(PREFIJO)) {
      const detalle = String(ev?.error?.url ?? ev?.error?.message ?? "");
      if (!est.teselasFallidas.includes(detalle)) est.teselasFallidas.push(detalle);
      avisar("tesela", TEXTOS.tesela, { detalle });
      return;
    }
    // Error ajeno al gemelo: si nadie más escuchaba «error», se conserva el aviso que MapLibre daría por omisión.
    if (!est.habiaOyenteDeError) console.error(ev?.error ?? ev);
  }

  // -------------------------------------------------------------- disponibilidad
  function zonaDe(zonaId) {
    if (zonaId == null) return null;
    const zona = gemelo?.terreno?.zonas?.[zonaId];
    return zona && typeof zona === "object" && typeof zona.teselas === "string" && zona.teselas ? zona : null;
  }

  function disponible(zonaId) {
    return Boolean(mapa && !est.destruido && zonaDe(zonaId));
  }

  // -------------------------------------------------------------- cámara
  function sinMovimiento() {
    if (typeof reducirMovimiento === "function") return Boolean(reducirMovimiento());
    if (reducirMovimiento != null) return Boolean(reducirMovimiento);
    return prefiereMenosMovimiento();
  }

  function moverCamara(destino, animar) {
    if (!Object.keys(destino).length) return;
    if (animar && !sinMovimiento()) mapa.easeTo({ ...destino, duration: DURACION_CAMARA_MS });
    else mapa.jumpTo(destino);
  }

  function inclinarCamara() {
    const destino = {};
    const pitch = num(gemelo?.camara?.pitch);
    const bearing = num(gemelo?.camara?.bearing);
    if (pitch != null) {
      // Si el mapa limita la inclinación por debajo de la del gemelo, se amplía mientras la vista esté activa.
      if (pitch > mapa.getMaxPitch()) {
        est.maxPitchPrevio = mapa.getMaxPitch();
        mapa.setMaxPitch(pitch);
      }
      destino.pitch = pitch;
    }
    if (bearing != null) destino.bearing = bearing;
    moverCamara(destino, true);
  }

  function aplanarCamara(animar) {
    const previo = est.maxPitchPrevio;
    est.maxPitchPrevio = null;
    const restaurar = () => {
      if (previo == null || est.activo || mapa.getPitch() > previo) return;
      mapa.setMaxPitch(previo);
    };
    const animado = animar && !sinMovimiento();
    if (animado && previo != null) mapa.once("moveend", restaurar);
    moverCamara({ pitch: 0, bearing: 0 }, animar);
    if (!animado) restaurar();
  }

  // -------------------------------------------------------------- capas
  /** La sombra del relieve va sobre el fondo y el mapa base, y debajo de todo lo demás (capas de la aplicación). */
  function capaSobreElFondo() {
    const orden = mapa.getLayersOrder?.() ?? [];
    return orden.find((id) => {
      const tipo = mapa.getLayer(id)?.type;
      return tipo !== "background" && tipo !== "raster";
    });
  }

  function agregarRelieve(zona) {
    const terreno = gemelo.terreno;
    est.fuenteRelieve = fuenteRelieve(terreno, zona, est.conProtocolo);
    mapa.addSource(FUENTE_RELIEVE, est.fuenteRelieve);
    mapa.addSource(FUENTE_SOMBRA, { ...est.fuenteRelieve }); // segunda fuente idéntica: MapLibre lo pide así
    const c = coloresGemelo();
    mapa.addLayer(
      {
        id: CAPA_SOMBRA,
        type: "hillshade",
        source: FUENTE_SOMBRA,
        paint: {
          "hillshade-exaggeration": FUERZA_SOMBRA,
          "hillshade-shadow-color": c.sombra,
          "hillshade-accent-color": c.sombra,
          "hillshade-highlight-color": c.luz,
        },
      },
      capaSobreElFondo(),
    );
    const exageracion = num(terreno.exageracion);
    mapa.setTerrain(exageracion == null ? { source: FUENTE_RELIEVE } : { source: FUENTE_RELIEVE, exaggeration: exageracion });
  }

  function agregarParcelas() {
    const c = coloresGemelo();
    const vacio = { type: "FeatureCollection", features: [] };
    const rayasPlana = imagenDeRayas(c.plana, c.planaTrama);
    const rayasFalta = imagenDeRayas(c.falta, c.faltaTrama);
    if (rayasPlana) mapa.addImage(IMAGEN_PLANA, rayasPlana, { pixelRatio: 2 });
    if (rayasFalta) mapa.addImage(IMAGEN_FALTA, rayasFalta, { pixelRatio: 2 });

    mapa.addSource(FUENTE_PLANAS, { type: "geojson", data: vacio });
    mapa.addSource(FUENTE_COLUMNAS, { type: "geojson", data: vacio, promoteId: "id" });

    const deClase = (clase) => ["==", ["get", "clase"], clase];
    const apuntada = ["boolean", ["feature-state", "apuntada"], false];

    // Sin clasificar: plana, gris, con rayas (si el navegador no dio la imagen, gris liso) y borde punteado.
    mapa.addLayer({
      id: CAPA_PLANA,
      type: "fill",
      source: FUENTE_PLANAS,
      filter: deClase(SIN_CLASIFICAR),
      paint: rayasPlana
        ? { "fill-pattern": IMAGEN_PLANA, "fill-opacity": OPACIDAD_PLANA }
        : { "fill-color": c.plana, "fill-opacity": OPACIDAD_PLANA },
    });
    mapa.addLayer({
      id: CAPA_PLANA_BORDE,
      type: "line",
      source: FUENTE_PLANAS,
      filter: deClase(SIN_CLASIFICAR),
      paint: { "line-color": c.planaBorde, "line-width": 1, "line-dasharray": [2, 2] },
    });
    // La rotación actual no pide riego: sin columna, con borde verde continuo.
    mapa.addLayer({
      id: CAPA_SIN_RIEGO,
      type: "fill",
      source: FUENTE_PLANAS,
      filter: deClase(SIN_RIEGO),
      paint: { "fill-color": c.sinRiego, "fill-opacity": OPACIDAD_SIN_RIEGO },
    });
    mapa.addLayer({
      id: CAPA_SIN_RIEGO_BORDE,
      type: "line",
      source: FUENTE_PLANAS,
      filter: deClase(SIN_RIEGO),
      paint: { "line-color": c.sinRiego, "line-width": 2.5 },
    });
    // Contorno al pie de la columna apuntada (puntero o mira del teclado).
    mapa.addLayer({
      id: CAPA_APUNTADA,
      type: "line",
      source: FUENTE_COLUMNAS,
      paint: { "line-color": c.tinta, "line-width": 4, "line-opacity": ["case", apuntada, 1, 0] },
    });
    // Columna: abajo, lo que cubre la dotación (azul liso); arriba, lo que falta (rojo con rayas).
    mapa.addLayer({
      id: CAPA_AGUA,
      type: "fill-extrusion",
      source: FUENTE_COLUMNAS,
      filter: [">", ["get", "cubre_m"], 0],
      paint: {
        "fill-extrusion-color": ["case", apuntada, c.aguaApuntada, c.agua],
        "fill-extrusion-base": 0,
        "fill-extrusion-height": ["get", "cubre_m"],
      },
    });
    mapa.addLayer({
      id: CAPA_FALTA,
      type: "fill-extrusion",
      source: FUENTE_COLUMNAS,
      filter: [">", ["get", "falta_m"], 0],
      paint: {
        ...(rayasFalta ? { "fill-extrusion-pattern": IMAGEN_FALTA } : { "fill-extrusion-color": c.falta }),
        "fill-extrusion-base": ["get", "cubre_m"],
        "fill-extrusion-height": ["get", "pide_m"],
      },
    });
    // Capa «custom» que no dibuja: MapLibre le entrega en cada cuadro la matriz de proyección (API pública),
    // con la que columnaEn() sabe qué columna hay bajo el puntero. Va al final para no partir las capas planas.
    mapa.addLayer({
      id: CAPA_CAMARA,
      type: "custom",
      render(_gl, cuadro) {
        const matriz = cuadro?.defaultProjectionData?.mainMatrix;
        if (matriz) est.matriz = Float64Array.from(matriz);
      },
    });
  }

  function quitarCapasYFuentes() {
    for (const id of mapa.getLayersOrder?.() ?? []) {
      if (id.startsWith(PREFIJO)) mapa.removeLayer(id);
    }
    if (mapa.getTerrain?.()?.source === FUENTE_RELIEVE) mapa.setTerrain(null);
    for (const id of FUENTES) {
      if (mapa.getSource(id)) mapa.removeSource(id);
    }
    for (const id of IMAGENES) {
      if (mapa.hasImage(id)) mapa.removeImage(id);
    }
  }

  // -------------------------------------------------------------- columnas
  function pintar() {
    if (!est.montado) return;
    const metros = num(gemelo?.columnas?.metros_por_millar);
    if (metros == null) avisar("sin_escala", TEXTOS.sinEscala);
    const resultado = calcularColumnas({ ...est.datos, zonaId: est.zonaId, metrosPorMillar: metros, reglas });
    mapa.getSource(FUENTE_COLUMNAS)?.setData(resultado.columnas);
    if (resultado.firmaPlanas !== est.firmaPlanas) {
      // Las parcelas planas no dependen de la dotación: solo se reenvían si cambió su lista.
      mapa.getSource(FUENTE_PLANAS)?.setData(resultado.planas);
      est.firmaPlanas = resultado.firmaPlanas;
    }
    est.ultimo = resultado;
    est.version += 1;
    if (est.apuntada != null && resultado.porId.get(est.apuntada)?.clase !== COLUMNA) apuntar(null);
    else pintarEtiqueta();
  }

  function programarPintado() {
    if (!est.montado || est.cuadro) return;
    est.cuadro = requestAnimationFrame(() => {
      est.cuadro = 0;
      pintar();
    });
  }

  // -------------------------------------------------------------- puntero, teclado y etiqueta
  /**
   * Columna bajo un punto de la pantalla, o null. Cada columna se proyecta con la matriz del último cuadro:
   * va de la altura del terreno en su centro (como la dibuja MapLibre) hasta esa altura más pide_m.
   * Si varias quedan bajo el punto, gana la más cercana a la cámara.
   */
  function columnaEn(punto) {
    if (!est.montado || !punto) return null;
    const [px, py] = Array.isArray(punto) ? punto : [punto.x, punto.y];
    if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
    const Mercator = biblioteca?.MercatorCoordinate;
    const columnas = est.ultimo?.columnas.features ?? [];
    const m = est.matriz;
    if (!m || !Mercator) return columnaSegunMapLibre([px, py]);
    const caja = mapa.getContainer();
    const ancho = caja.clientWidth;
    const alto = caja.clientHeight;
    let mejor = null;
    let distanciaMejor = Infinity;
    for (const f of columnas) {
      const g = enMercator(f.geometry, Mercator);
      if (!g.centro) continue;
      const suelo = mapa.queryTerrainElevation?.(g.centro) ?? 0; // metros, ya con la exageración
      const zPie = suelo * g.zPorMetro;
      const zCima = (suelo + f.properties.pide_m) * g.zPorMetro;
      const distancia = m[3] * g.centroXY[0] + m[7] * g.centroXY[1] + m[11] * zPie + m[15];
      if (!(distancia > 0) || distancia >= distanciaMejor) continue;
      for (const xy of g.anillos) {
        const pie = anilloEnPantalla(m, xy, zPie, ancho, alto);
        const cima = pie && anilloEnPantalla(m, xy, zCima, ancho, alto);
        if (cima && puntoEnColumna(px, py, pie, cima)) {
          mejor = f.properties.id;
          distanciaMejor = distancia;
          break;
        }
      }
    }
    return mejor;
  }

  /** Respaldo si aún no hay matriz (ningún cuadro dibujado): la consulta de MapLibre, sin la altura del terreno. */
  function columnaSegunMapLibre(xy) {
    const capas = CAPAS_COLUMNA.filter((id) => mapa.getLayer(id));
    if (!capas.length) return null;
    return mapa.queryRenderedFeatures(xy, { layers: capas })[0]?.properties?.id ?? null;
  }

  function centroDelMapa() {
    const caja = mapa.getContainer();
    return [caja.clientWidth / 2, caja.clientHeight / 2];
  }

  function marcarApuntada(id, valor) {
    if (id == null || !mapa.getSource(FUENTE_COLUMNAS)) return;
    mapa.setFeatureState({ source: FUENTE_COLUMNAS, id }, { apuntada: valor });
  }

  function apuntar(id) {
    if (id !== est.apuntada) {
      marcarApuntada(est.apuntada, false);
      marcarApuntada(id, true);
      est.apuntada = id;
    }
    pintarEtiqueta();
  }

  /** Texto de la columna apuntada: lo que pide la rotación actual y cuánto cubre la dotación elegida. */
  function textoDeColumna(id) {
    const d = est.ultimo?.porId.get(id);
    if (!d || d.clase !== COLUMNA) return null;
    return {
      titulo: `Field ${id}`,
      detalle: `Asks ${fmt(d.l50)} thousand m³/ha per year (median); the chosen allocation covers ${fmtPct(d.cobertura)}`,
    };
  }

  function pintarEtiqueta() {
    const dom = est.dom;
    if (!dom) return;
    const texto = est.apuntada == null ? null : textoDeColumna(est.apuntada);
    dom.mira.hidden = !est.conTeclado;
    if (!texto && !est.conTeclado) {
      dom.etiqueta.hidden = true;
      return;
    }
    dom.etiqueta.innerHTML = texto
      ? `<strong>${esc(texto.titulo)}</strong>${esc(texto.detalle)}` +
        (est.conTeclado ? `<span class="gemelo-etiqueta-tecla">${esc(TEXTOS.tecla)}</span>` : "")
      : esc(TEXTOS.sinColumna);
    dom.etiqueta.hidden = false;
    // Con teclado, la etiqueta va bajo la mira; con el puntero, junto a él. Siempre dentro del mapa.
    const caja = mapa.getContainer();
    const [cx, cy] = centroDelMapa();
    const ancho = dom.etiqueta.offsetWidth;
    const alto = dom.etiqueta.offsetHeight;
    let x = cx - ancho / 2;
    let y = cy + BAJO_LA_MIRA_PX;
    if (!est.conTeclado && est.ultimoPuntero) {
      x = est.ultimoPuntero[0] + SEPARACION_ETIQUETA_PX;
      y = est.ultimoPuntero[1] + SEPARACION_ETIQUETA_PX;
      if (y + alto > caja.clientHeight - MARGEN_ETIQUETA_PX) y = est.ultimoPuntero[1] - SEPARACION_ETIQUETA_PX - alto;
    }
    x = Math.max(MARGEN_ETIQUETA_PX, Math.min(x, caja.clientWidth - ancho - MARGEN_ETIQUETA_PX));
    y = Math.max(MARGEN_ETIQUETA_PX, Math.min(y, caja.clientHeight - alto - MARGEN_ETIQUETA_PX));
    dom.etiqueta.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    // El lector de pantalla solo anuncia lo que apunta la mira del teclado (no cada paso del puntero).
    if (est.conTeclado) {
      const voz = texto ? `${texto.titulo}. ${texto.detalle}. ${TEXTOS.tecla}.` : TEXTOS.sinColumna;
      if (dom.voz.textContent !== voz) dom.voz.textContent = voz;
    }
  }

  function ponerCursor(mano) {
    const lienzo = mapa.getCanvas();
    if (mano) {
      lienzo.style.cursor = "pointer";
      est.pusoCursor = true;
    } else if (est.pusoCursor) {
      lienzo.style.cursor = "";
      est.pusoCursor = false;
    }
  }

  function elegir(id) {
    if (id == null || typeof alElegirParcela !== "function") return;
    alElegirParcela(id);
  }

  const alClic = (ev) => elegir(columnaEn(ev.point));

  function alMoverPuntero(ev) {
    est.ultimoPuntero = [ev.point.x, ev.point.y];
    if (est.conTeclado) {
      est.conTeclado = false; // el puntero toma el mando: se guarda la mira
      est.dom.voz.textContent = "";
    }
    if (est.cuadroPuntero) return;
    est.cuadroPuntero = requestAnimationFrame(() => {
      est.cuadroPuntero = 0;
      if (!est.montado || est.conTeclado || !est.ultimoPuntero) return;
      const id = columnaEn(est.ultimoPuntero);
      ponerCursor(id != null);
      apuntar(id);
    });
  }

  function alSalirPuntero() {
    est.ultimoPuntero = null;
    ponerCursor(false);
    if (!est.conTeclado) apuntar(null);
  }

  function apuntarConLaMira() {
    if (est.montado && est.conTeclado) apuntar(columnaEn(centroDelMapa()));
  }

  function alEnfocar() {
    let conTeclado = true;
    try {
      conTeclado = mapa.getCanvas().matches(":focus-visible");
    } catch {
      conTeclado = true; // navegador sin :focus-visible: se muestra la mira
    }
    if (!conTeclado) return;
    est.conTeclado = true;
    apuntarConLaMira();
  }

  function alDesenfocar() {
    if (!est.conTeclado) return;
    est.conTeclado = false;
    est.dom.voz.textContent = "";
    apuntar(null);
  }

  function alTecla(ev) {
    if (ev.key !== "Enter" || ev.altKey || ev.ctrlKey || ev.metaKey) return;
    if (!est.conTeclado && est.apuntada == null) {
      est.conTeclado = true; // Enter con el mapa enfocado por otro medio: se muestra la mira y se usa
      apuntarConLaMira();
    }
    if (est.apuntada == null) return;
    ev.preventDefault();
    elegir(est.apuntada);
  }

  const alMoverMapa = () => {
    if (est.conTeclado) apuntarConLaMira();
    else if (est.apuntada != null) pintarEtiqueta();
  };

  function ponerDOM() {
    const caja = mapa.getContainer();
    const lienzo = mapa.getCanvas();
    const crear = (etiqueta, clase) => {
      const el = document.createElement(etiqueta);
      el.className = clase;
      caja.appendChild(el);
      return el;
    };
    const mira = crear("div", "gemelo-mira");
    mira.hidden = true;
    mira.setAttribute("aria-hidden", "true");
    const etiqueta = crear("div", "gemelo-etiqueta");
    etiqueta.hidden = true;
    etiqueta.setAttribute("aria-hidden", "true"); // su texto llega al lector por la región viva
    const voz = crear("div", "gemelo-voz");
    voz.setAttribute("aria-live", "polite");
    const ayuda = crear("p", "gemelo-voz");
    ayuda.id = `${PREFIJO}ayuda-${numeroVista}`;
    ayuda.textContent = TEXTOS.ayuda;
    const descritoAntes = lienzo.getAttribute("aria-describedby");
    lienzo.setAttribute("aria-describedby", [descritoAntes, ayuda.id].filter(Boolean).join(" "));
    caja.dataset.gemelo = "activo";
    est.dom = { mira, etiqueta, voz, ayuda, descritoAntes };

    mapa.on("click", alClic);
    mapa.on("mousemove", alMoverPuntero);
    mapa.on("mouseout", alSalirPuntero);
    mapa.on("move", alMoverMapa);
    lienzo.addEventListener("keydown", alTecla);
    lienzo.addEventListener("focus", alEnfocar);
    lienzo.addEventListener("blur", alDesenfocar);
    if (document.activeElement === lienzo) alEnfocar();
  }

  function quitarDOM() {
    const dom = est.dom;
    if (!dom) return;
    const lienzo = mapa.getCanvas();
    mapa.off("click", alClic);
    mapa.off("mousemove", alMoverPuntero);
    mapa.off("mouseout", alSalirPuntero);
    mapa.off("move", alMoverMapa);
    lienzo.removeEventListener("keydown", alTecla);
    lienzo.removeEventListener("focus", alEnfocar);
    lienzo.removeEventListener("blur", alDesenfocar);
    if (dom.descritoAntes) lienzo.setAttribute("aria-describedby", dom.descritoAntes);
    else lienzo.removeAttribute("aria-describedby");
    for (const el of [dom.mira, dom.etiqueta, dom.voz, dom.ayuda]) el.remove();
    delete mapa.getContainer().dataset.gemelo;
    ponerCursor(false);
    est.dom = null;
    est.apuntada = null;
    est.conTeclado = false;
    est.ultimoPuntero = null;
  }

  // -------------------------------------------------------------- montar y desmontar
  function montar(conCamara) {
    const zona = zonaDe(est.zonaId);
    if (!zona || est.montado) return;
    try {
      est.habiaOyenteDeError = Boolean(mapa.listens?.("error"));
      mapa.on("error", alErrorDelMapa);
      est.conProtocolo = registrarProtocolo(biblioteca, alFallarTesela);
      agregarRelieve(zona);
      agregarParcelas();
      est.montado = true;
      ponerDOM();
      if (conCamara) inclinarCamara();
      pintar();
    } catch (error) {
      console.warn("Raíz: twin view not available", error);
      est.montado = true; // para que desmontar retire lo que alcanzó a entrar
      desmontar(false, false);
      est.activo = false;
      avisar("error", TEXTOS.error, { detalle: String(error?.message ?? error) });
    }
  }

  function desmontar(conCamara, animar) {
    if (est.cuadro) cancelAnimationFrame(est.cuadro);
    if (est.cuadroPuntero) cancelAnimationFrame(est.cuadroPuntero);
    est.cuadro = 0;
    est.cuadroPuntero = 0;
    if (est.montado) {
      quitarDOM();
      try {
        quitarCapasYFuentes();
      } catch (error) {
        console.warn("Raíz: twin view layers could not be removed cleanly", error);
      }
      soltarProtocolo(biblioteca, alFallarTesela);
      mapa.off("error", alErrorDelMapa);
    }
    est.montado = false;
    est.firmaPlanas = null;
    est.fuenteRelieve = null;
    est.matriz = null;
    if (conCamara) aplanarCamara(animar);
  }

  function activar(zonaId) {
    if (est.destruido || !mapa) return false;
    if (!disponible(zonaId)) {
      avisar("no_disponible", TEXTOS.noDisponible, { zonaId, repetible: true });
      return false;
    }
    if (est.activo && est.zonaId === zonaId) return true;
    const cambioDeZona = est.activo;
    if (cambioDeZona) desmontar(false, false); // otra zona: se cambia el relieve y se conserva la cámara
    est.activo = true;
    est.zonaId = zonaId;
    est.avisados.clear();
    est.teselasFallidas = [];
    cuandoEstiloListo(() => {
      if (est.activo && est.zonaId === zonaId && !est.montado) montar(!cambioDeZona);
    });
    return true;
  }

  function desactivar() {
    if (!est.activo) return;
    est.activo = false;
    desmontar(true, true);
  }

  function actualizar(datos = {}) {
    if (est.destruido) return;
    for (const llave of ["features", "cubo", "D", "r"]) {
      if (datos[llave] !== undefined) est.datos[llave] = datos[llave];
    }
    if (!est.activo) return;
    if (datos.zonaId !== undefined && datos.zonaId !== est.zonaId) {
      // Si la zona nueva no tiene relieve (o es «todas las zonas»), activar ya avisó: la vista 3D se retira.
      if (!activar(datos.zonaId)) desactivar();
      return; // al montar la zona nueva se pinta con los datos guardados
    }
    programarPintado();
  }

  function destruir() {
    if (est.destruido) return;
    const estabaActivo = est.activo;
    est.activo = false;
    if (mapa) desmontar(estabaActivo, false);
    est.destruido = true;
    est.ultimo = null;
    est.datos = { features: null, cubo: null, D: null, r: null };
  }

  return {
    disponible,
    activar,
    desactivar,
    actualizar,
    activo: () => est.activo,
    leyendaHTML: () => htmlLeyenda(gemelo),
    columnaEn,
    destruir,
    get depuracion() {
      return {
        version: est.version,
        montado: est.montado,
        zonaId: est.zonaId,
        D: est.datos.D,
        r: est.datos.r,
        metrosPorMillar: num(gemelo?.columnas?.metros_por_millar),
        columnas: est.ultimo?.columnas ?? null,
        planas: est.ultimo?.planas ?? null,
        cuenta: est.ultimo ? { ...est.ultimo.cuenta } : null,
        fuenteRelieve: est.fuenteRelieve ? { ...est.fuenteRelieve } : null,
        teselasFallidas: [...est.teselasFallidas],
      };
    },
  };
}
