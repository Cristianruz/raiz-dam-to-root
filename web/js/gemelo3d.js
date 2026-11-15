// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/gemelo3d.js — Vista 3D del gemelo digital: relieve de NASADEM y columnas de agua por parcela
// (docs/decisiones/2026-11-14_gemelo_digital.md, «Qué cambia en el producto», punto 1). Módulo ES, sin dependencias.
//
// QUÉ EXPORTA (lo conecta app.js; este archivo no toca las capas, las fuentes ni los controles de la aplicación):
//   crearGemelo3D({ mapa, gemelo, reglas, alElegirParcela, reducirMovimiento, alAvisar, maplibre, toleranciaClicPx })
//     -> controlador
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
//     toleranciaClicPx   opcional: holgura del clic o del toque, en píxeles (la misma que usa la aplicación en 2D).
//                        Si el punto no cae exacto sobre una columna, se busca la más cercana dentro de ese radio.
//
//   controlador:
//     disponible(zonaId) -> boolean   true solo si gemelo.terreno.zonas[zonaId] existe (con su plantilla de teselas).
//                                     Con false, la página dice «3D twin view: not available» y no ofrece la vista.
//     activar(zonaId) -> boolean      monta el relieve de esa zona (fuente raster-dem + sombreado + terreno), inclina
//                                     la cámara (gemelo.camara) y dibuja las columnas. false si no está disponible o
//                                     si el montaje falló (devuelve activo()). Si el estilo del mapa aún no termina de
//                                     cargar, se monta al terminar. La exageración es la de la zona
//                                     (terreno.zonas[zonaId].exageracion) y, si la zona no trae la suya, la general
//                                     (terreno.exageracion). Un botón debe leer activo() para su aria-pressed.
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
//     leyendaHTML(zonaId) -> string   leyenda en inglés (por omisión, de la zona activa); la exageración de la zona y
//                                     los metros por millar salen de gemelo.json.
//     columnaEn(punto, { tolerancia }) -> id | null
//                                     columna que SE VE en un punto de la pantalla ({x, y} o [x, y] del mapa): si dos
//                                     columnas se tapan, gana la de adelante en ese píxel (decisión 3). Con tolerancia
//                                     (píxeles), si el punto no cae sobre ninguna se toma la más cercana en ese radio.
//                                     Sirve para que el clic de la aplicación sobre sus propias capas ceda ante una
//                                     columna.
//     depuracion                      (solo lectura, para pruebas) último cálculo: { version, montado, zonaId,
//                                     exageracion, D, r,
//                                     metrosPorMillar, columnas, planas, cuenta, fuenteRelieve, urlTeselas,
//                                     teselasFallidas }; columnas y planas son los FeatureCollection de setData;
//                                     urlTeselas es document.baseURI + la plantilla del JSON.
//     destruir()                      desactiva sin animación y suelta todo; el controlador queda inerte.
//
//   calcularColumnas({ features, cubo, D, r, zonaId, metrosPorMillar, reglas }) -> { columnas, planas, cuenta… }
//     el cálculo puro (sin mapa), para probarlo con Node.
//
// QUÉ DIBUJA (todo con el prefijo «gemelo-»):
//   · Parcela clasificada cuya opción ACTUAL pide agua (L50 > 0, lámina bruta P50 para la lluvia r): una columna.
//       de 0 a min(D, L50) × metros_por_millar          azul (Agua): lo que cubre la dotación elegida;
//       de min(D, L50) × k a L50 × k                     rojo con rayas: lo que falta.
//   · Parcela clasificada con L50 = 0: sin columna, plana, con borde verde continuo.
//   · Parcela sin clasificar (abstención, o sin opción ACTUAL): plana, gris, con rayas y borde punteado.
//   Nada depende solo del color: lo que falta va arriba y rayado; lo no clasificado, plano, rayado y punteado.
//
// CÓMO SE CONECTA (lo hace el integrador en app.js e index.html; aquí no se toca ninguno de los dos):
//   <link rel="stylesheet" href="css/gemelo.css">
//   import { crearGemelo3D } from "./js/gemelo3d.js";
//   const vista = crearGemelo3D({ mapa, gemelo, reglas, alElegirParcela: abrirFicha, alAvisar: (a) => aviso(a.mensaje) });
//   botón «3D view»:  vista.activo() ? vista.desactivar() : vista.activar(zona);   leyenda: vista.leyendaHTML()
//   en cada cambio de deslizador, lluvia o zona:  vista.actualizar({ features, cubo, D, r, zonaId: zona });
//   · El clic de la aplicación sobre sus parcelas debe ceder ante una columna (en 3D, la columna tapa a la parcela
//     de atrás):  if (vista.activo() && vista.columnaEn(e.point)) return;
//   · Un fitBounds de la aplicación con la vista activa debe conservar el rumbo (bearing: mapa.getBearing()).
//
// DECISIONES DE ESTE ARCHIVO (para quien lo integre o lo revise):
//   1. Las teselas se piden con un protocolo propio de MapLibre («gemelo-dem://» + la URL absoluta, que se arma con
//      document.baseURI + terreno.zonas[zona].teselas). Así el módulo se entera de una tesela que falta (MapLibre
//      calla los 404) y la entrega como «no encontrada»: MapLibre usa entonces la tesela madre y la vista sigue,
//      sin errores del mapa en la consola (queda solo el 404 de red del navegador).
//   2. La codificación es la de terreno.encoding. Se le pasa a MapLibre con sus factores equivalentes
//      (encoding «custom») para restarle elev_min_m de la zona: el relieve se dibuja respecto al punto más bajo de
//      la zona y no como una meseta de más de un kilómetro sobre el plano sin datos (sin acantilados en el borde
//      del relieve ni donde falte una tesela). La forma del relieve y el sombreado no cambian. Sin elev_min_m, o
//      con otra codificación, la fuente usa terreno.encoding tal cual.
//   3. La columna bajo el puntero se calcula aquí (columnaEn): la consulta de MapLibre (queryRenderedFeatures) no
//      sirve de sustituto, porque con terreno se equivoca de columna en una parte de los píxeles. Una capa «custom»
//      sin dibujo recibe la matriz de proyección de cada cuadro (API pública de MapLibre); con ella se proyecta cada
//      columna (prisma del suelo de su centro hasta su altura) para saber cuáles cubren el punto, y entre ellas gana
//      la que el rayo de ese píxel toca primero (tapa o cara lateral más cercana a la cámara en ese píxel), no la de
//      centro más cercano: así, cuando dos columnas se tapan, se elige la que se ve. El relieve no tapa columnas en
//      este cálculo (las parcelas están en el fondo del valle).
//   4. Las alturas se recalculan con setData sobre una fuente que solo trae las columnas; las parcelas planas van
//      en otra fuente que no se reenvía al mover el deslizador.
//   5. Ninguna cifra escrita a mano: exageración, metros por millar, cámara, zooms y límites salen de gemelo.json;
//      las láminas, de cubo.json por reglas.js. Los números del código son medidas de diseño (anchos, duración)
//      o constantes del formato de las teselas.
//   6. Colores leídos de variables CSS (css/gemelo.css, que toma --agua, --rojo, --brote… de style.css).
//   7. La vista no reparte agua, no pronostica y no recomienda: dibuja lo que la rotación actual pide y lo que
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
const CAPA_AGUA = "gemelo-columna-agua";
const CAPA_FALTA = "gemelo-columna-falta";
const CAPA_CAMARA = "gemelo-camara"; // capa «custom» sin dibujo: recibe la matriz de proyección de cada cuadro
const IMAGEN_PLANA = "gemelo-trama-plana";
const IMAGEN_FALTA = "gemelo-trama-falta";
const CAPAS = [
  CAPA_SOMBRA,
  CAPA_PLANA,
  CAPA_PLANA_BORDE,
  CAPA_SIN_RIEGO,
  CAPA_SIN_RIEGO_BORDE,
  CAPA_AGUA,
  CAPA_FALTA,
  CAPA_CAMARA,
];
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
const DIRECCIONES_TOLERANCIA = 8; // puntos que se prueban en cada anillo de la holgura del clic

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

/** ¿El punto (px, py) cae dentro del polígono? `v` trae sus vértices en pantalla: [x, y, x, y…]. */
function puntoDentro(px, py, v) {
  const n = v.length / 2;
  let dentro = false;
  for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
    const ya = v[i * 2 + 1];
    const yb = v[j * 2 + 1];
    if (ya > py !== yb > py && px < ((v[j * 2] - v[i * 2]) * (py - ya)) / (yb - ya) + v[i * 2]) dentro = !dentro;
  }
  return dentro;
}

/** Inversa de una matriz 4×4 guardada por columnas (la fórmula de gl-matrix); null si no tiene inversa. */
function invertir(a) {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det || !Number.isFinite(det)) return null;
  const k = 1 / det;
  return Float64Array.from([
    (a11 * b11 - a12 * b10 + a13 * b09) * k,
    (a02 * b10 - a01 * b11 - a03 * b09) * k,
    (a31 * b05 - a32 * b04 + a33 * b03) * k,
    (a22 * b04 - a21 * b05 - a23 * b03) * k,
    (a12 * b08 - a10 * b11 - a13 * b07) * k,
    (a00 * b11 - a02 * b08 + a03 * b07) * k,
    (a32 * b02 - a30 * b05 - a33 * b01) * k,
    (a20 * b05 - a22 * b02 + a23 * b01) * k,
    (a10 * b10 - a11 * b08 + a13 * b06) * k,
    (a01 * b08 - a00 * b10 - a03 * b06) * k,
    (a30 * b04 - a31 * b02 + a33 * b00) * k,
    (a21 * b02 - a20 * b04 - a23 * b00) * k,
    (a11 * b07 - a10 * b09 - a12 * b06) * k,
    (a00 * b09 - a01 * b07 + a02 * b06) * k,
    (a31 * b01 - a30 * b03 - a32 * b00) * k,
    (a20 * b03 - a21 * b01 + a22 * b00) * k,
  ]);
}

/**
 * Rayo de un píxel de la pantalla en coordenadas Mercator con altura: origen en el plano cercano y dirección
 * hacia el lejano (t = 0 cerca, t = 1 lejos). null si la matriz no se puede invertir.
 */
function rayoDelPixel(inversa, px, py, ancho, alto) {
  if (!inversa || !(ancho > 0) || !(alto > 0)) return null;
  const nx = (px / ancho) * 2 - 1;
  const ny = 1 - (py / alto) * 2;
  const punto = (nz) => {
    const m = inversa;
    const w = m[3] * nx + m[7] * ny + m[11] * nz + m[15];
    if (!w) return null;
    return [
      (m[0] * nx + m[4] * ny + m[8] * nz + m[12]) / w,
      (m[1] * nx + m[5] * ny + m[9] * nz + m[13]) / w,
      (m[2] * nx + m[6] * ny + m[10] * nz + m[14]) / w,
    ];
  };
  const cerca = punto(-1);
  const lejos = punto(1);
  if (!cerca || !lejos) return null;
  return { o: cerca, d: [lejos[0] - cerca[0], lejos[1] - cerca[1], lejos[2] - cerca[2]] };
}

/**
 * Primer punto en que el rayo toca la columna (prisma vertical de la parcela entre zPie y zCima): la tapa o una
 * cara lateral. Devuelve t (0 = plano cercano), o null si el rayo no la toca.
 */
function profundidadEnColumna(rayo, anillos, zPie, zCima) {
  const [ox, oy, oz] = rayo.o;
  const [dx, dy, dz] = rayo.d;
  let mejor = Infinity;
  // Tapa: el plano z = zCima, dentro del polígono.
  if (dz) {
    const t = (zCima - oz) / dz;
    if (t >= 0 && t < mejor) {
      const x = ox + t * dx;
      const y = oy + t * dy;
      if (anillos.some((xy) => puntoDentro(x, y, xy))) mejor = t;
    }
  }
  // Caras laterales: el rayo cruza el lado A→B del polígono a una altura entre el pie y la tapa.
  for (const xy of anillos) {
    const n = xy.length / 2;
    for (let i = 0, j = n - 1; i < n; j = i, i += 1) {
      const ax = xy[j * 2];
      const ay = xy[j * 2 + 1];
      const ex = xy[i * 2] - ax;
      const ey = xy[i * 2 + 1] - ay;
      const denom = dx * ey - dy * ex;
      if (!denom) continue;
      const wx = ax - ox;
      const wy = ay - oy;
      const t = (wx * ey - wy * ex) / denom;
      const s = (wx * dy - wy * dx) / denom;
      if (!(t >= 0) || t >= mejor || s < 0 || s > 1) continue;
      const z = oz + t * dz;
      if (z >= zPie && z <= zCima) mejor = t;
    }
  }
  return Number.isFinite(mejor) ? mejor : null;
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
  return fuente; // la fuente de los datos (terreno.fuente) va en la leyenda, no en la atribución del mapa
}

// ---------------------------------------------------------------------------
// Cálculo de las columnas (sin MapLibre: se puede probar con Node)
// ---------------------------------------------------------------------------
/**
 * Clasifica las parcelas de la zona y calcula la altura de sus columnas.
 * Devuelve { columnas, planas, firmaColumnas, firmaPlanas, porId, cuenta }: dos FeatureCollection (las columnas
 * cambian con D; las planas, no), una firma de cada una (para no reenviar al mapa lo que no cambió), el detalle
 * por parcela y los conteos.
 *   cubre_m = min(D, L50) × metrosPorMillar     pide_m = L50 × metrosPorMillar     falta_m = pide_m − cubre_m
 */
export function calcularColumnas({ features, cubo, D, r, zonaId, metrosPorMillar, reglas }) {
  const columnas = [];
  const planas = [];
  const firmaColumnas = [];
  const firmaPlanas = [];
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
      firmaPlanas.push(`${p.id}:${clase}`);
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
    firmaColumnas.push(`${p.id}:${cubre}:${pide}`);
  }
  return {
    columnas: { type: "FeatureCollection", features: columnas },
    planas: { type: "FeatureCollection", features: planas },
    firmaColumnas: firmaColumnas.join("|"),
    firmaPlanas: firmaPlanas.join("|"),
    porId,
    cuenta,
  };
}

// ---------------------------------------------------------------------------
// Leyenda
// ---------------------------------------------------------------------------
/** Exageración del relieve de una zona: la suya (terreno.zonas[id].exageracion) o, si no la trae, la general. */
function exageracionDe(terreno, zonaId) {
  return num(terreno?.zonas?.[zonaId]?.exageracion) ?? num(terreno?.exageracion);
}

// Etiquetas de los datos escritas en español (params.json → gemelo.json) y su rótulo en la interfaz en inglés.
// Una etiqueta que no está aquí se muestra tal cual, marcada como español (lang="es").
const ETIQUETAS_EN = { "Diseño": "design choice" };
function htmlEtiqueta(etiqueta) {
  const texto = String(etiqueta);
  return ETIQUETAS_EN[texto] ? esc(ETIQUETAS_EN[texto]) : `<span lang="es">${esc(texto)}</span>`;
}

function htmlLeyenda(gemelo, zonaId) {
  const terreno = gemelo?.terreno ?? {};
  const columnas = gemelo?.columnas ?? {};
  const exageracion = exageracionDe(terreno, zonaId);
  const metros = num(columnas.metros_por_millar);
  // Renglones de escala: el rótulo del relieve con su exageración, y la escala de las columnas con su nota.
  const escala = [];
  const veces = exageracion != null ? `×${esc(fmt(exageracion))}` : "";
  if (terreno.rotulo) escala.push(`Terrain: ${esc(terreno.rotulo)}` + (veces ? ` (${veces})` : ""));
  else if (veces) escala.push(`Vertical exaggeration of the terrain: ${veces}`);
  if (metros != null) {
    escala.push(
      [
        `Column scale: ${esc(fmt(metros))} m of height for each thousand m³/ha`,
        esc(columnas.nota ?? ""),
        columnas.etiqueta ? `Label: ${htmlEtiqueta(columnas.etiqueta)}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
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
    // La cita en inglés del motor (terreno.fuente_en); si el archivo no la trae, la de español («vía Google Earth
    // Engine») marcada lang="es", como en la ficha.
    `<p class="gemelo-leyenda-fuente">Source: ${terreno.fuente_en ? esc(terreno.fuente_en) : terreno.fuente ? `<span lang="es">${esc(terreno.fuente)}</span>` : "not available"}</p>` +
    "</div>"
  );
}

// ---------------------------------------------------------------------------
// La vista
// ---------------------------------------------------------------------------
export function crearGemelo3D({ mapa, gemelo, reglas, alElegirParcela, reducirMovimiento, alAvisar, maplibre, toleranciaClicPx } = {}) {
  if (typeof reglas?.evaluarOpcion !== "function") {
    throw new TypeError("crearGemelo3D: falta reglas.evaluarOpcion (pase el módulo web/reglas.js)");
  }
  const biblioteca = maplibre ?? globalThis.maplibregl;
  const holguraClic = Math.max(0, num(toleranciaClicPx) ?? 0);
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
    firmaColumnas: null, // lo último enviado con setData a cada fuente
    firmaPlanas: null,
    fuenteRelieve: null,
    conProtocolo: false,
    teselasFallidas: [],
    matriz: null, // Mercator (0 a 1, con altura) -> espacio de recorte, del último cuadro dibujado
    inversa: null, // inversa de matriz (se calcula al primer uso): espacio de recorte -> Mercator
    camaraCambio: false,
    suelos: new Map(), // id -> altura del terreno bajo la columna (se vacía si cambia el relieve cargado o el zoom)
    avisados: new Set(), // tipos de aviso ya emitidos en esta activación
    apuntada: null,
    conTeclado: false,
    ultimoPuntero: null,
    pusoCursor: false,
    inclinada: false, // la cámara ya tomó la inclinación del gemelo en esta activación
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
      console.warn("ROOT: twin view notice handler failed", error);
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
        est.maxPitchPrevio ??= mapa.getMaxPitch();
        mapa.setMaxPitch(pitch);
      }
      destino.pitch = pitch;
    }
    if (bearing != null) destino.bearing = bearing;
    moverCamara(destino, true);
  }

  function aplanarCamara(animar) {
    // El tope de inclinación que se amplió al activar vuelve a su valor cuando la cámara ya está plana
    // (si la vista se reactiva antes, se deja como está).
    const restaurar = () => {
      if (est.maxPitchPrevio == null || est.activo) return;
      mapa.setMaxPitch(est.maxPitchPrevio);
      est.maxPitchPrevio = null;
    };
    const animado = animar && !sinMovimiento();
    if (animado && est.maxPitchPrevio != null) mapa.once("moveend", restaurar);
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
    const exageracion = exageracionDe(terreno, est.zonaId);
    mapa.setTerrain(exageracion == null ? { source: FUENTE_RELIEVE } : { source: FUENTE_RELIEVE, exaggeration: exageracion });
  }

  function agregarParcelas() {
    const c = coloresGemelo();
    const vacio = { type: "FeatureCollection", features: [] };
    const rayasPlana = imagenDeRayas(c.plana, c.planaTrama);
    const rayasFalta = imagenDeRayas(c.falta, c.faltaTrama);
    // Las tramas se registran una vez y se conservan al desactivar: si se borraran justo después de activar, el hilo
    // de teselas aún las pediría y MapLibre avisaría que no las encuentra. Se retiran en destruir().
    const ponerImagen = (id, imagen) => {
      if (!imagen) return;
      if (mapa.hasImage(id)) mapa.updateImage(id, imagen);
      else mapa.addImage(id, imagen, { pixelRatio: 2 });
    };
    ponerImagen(IMAGEN_PLANA, rayasPlana);
    ponerImagen(IMAGEN_FALTA, rayasFalta);

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
    // Columna: abajo, lo que cubre la dotación (azul liso); arriba, lo que falta (rojo con rayas).
    // La columna apuntada (puntero o mira) oscurece su parte azul con feature-state: la fuente de las columnas
    // no tiene capas tendidas sobre el terreno, así que apuntar no obliga a MapLibre a redibujar el relieve.
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
        if (!matriz) return;
        const previa = est.matriz;
        let igual = Boolean(previa);
        for (let i = 0; igual && i < matriz.length; i += 1) igual = previa[i] === matriz[i];
        if (igual) return;
        est.matriz = Float64Array.from(matriz);
        est.inversa = null;
        est.camaraCambio = true; // al terminar el cuadro se revisa qué columna quedó bajo la mira o el puntero
      },
    });
  }

  function quitarCapasYFuentes() {
    for (const id of CAPAS) {
      if (mapa.getLayer(id)) mapa.removeLayer(id);
    }
    if (mapa.getTerrain?.()?.source === FUENTE_RELIEVE) mapa.setTerrain(null); // antes de quitar su fuente
    for (const id of FUENTES) {
      if (mapa.getSource(id)) mapa.removeSource(id);
    }
  }

  /** Las dos tramas propias: solo al destruir la vista (ver agregarParcelas). */
  function quitarImagenes() {
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
    // Solo se envía al mapa lo que cambió: cada setData hace que MapLibre vuelva a dibujar el relieve.
    // Las parcelas planas no dependen de la dotación; las columnas, sí.
    if (resultado.firmaColumnas !== est.firmaColumnas) {
      mapa.getSource(FUENTE_COLUMNAS)?.setData(resultado.columnas);
      est.firmaColumnas = resultado.firmaColumnas;
    }
    if (resultado.firmaPlanas !== est.firmaPlanas) {
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
   * Columna que se ve en un punto de la pantalla, o null. Cada columna se proyecta con la matriz del último cuadro:
   * va de la altura del terreno en su centro (como la dibuja MapLibre) hasta esa altura más pide_m. De las que
   * cubren el punto gana la que el rayo de ese píxel toca primero (decisión 3). Con { tolerancia } (píxeles), si el
   * punto no cae sobre ninguna, se busca en anillos cada vez más anchos y se toma la primera que aparezca.
   */
  function columnaEn(punto, { tolerancia = 0 } = {}) {
    if (!est.montado || !punto) return null;
    const [px, py] = Array.isArray(punto) ? punto : [punto.x, punto.y];
    if (!Number.isFinite(px) || !Number.isFinite(py)) return null;
    const exacta = columnaExacta(px, py);
    const radio = Math.max(0, num(tolerancia) ?? 0);
    if (exacta != null || !radio) return exacta;
    for (let r = 1; r <= radio; r += 1) {
      for (let k = 0; k < DIRECCIONES_TOLERANCIA; k += 1) {
        const angulo = (k / DIRECCIONES_TOLERANCIA) * Math.PI * 2;
        const id = columnaExacta(px + r * Math.cos(angulo), py + r * Math.sin(angulo));
        if (id != null) return id;
      }
    }
    return null;
  }

  function columnaExacta(px, py) {
    const Mercator = biblioteca?.MercatorCoordinate;
    const columnas = est.ultimo?.columnas.features ?? [];
    const m = est.matriz;
    if (!m || !Mercator) return columnaSegunMapLibre([px, py]);
    const lienzo = mapa.getCanvas(); // el tamaño con el que MapLibre dibujó el cuadro (píxeles CSS)
    const ancho = lienzo.clientWidth;
    const alto = lienzo.clientHeight;
    est.inversa ??= invertir(m);
    const rayo = rayoDelPixel(est.inversa, px, py, ancho, alto);
    let mejor = null;
    let tMejor = Infinity; // profundidad en el píxel de la mejor columna (rayo)
    let respaldo = null; // si el rayo no pudo decidir (matriz rara, borde exacto): la de centro más cercano
    let distanciaRespaldo = Infinity;
    for (const f of columnas) {
      const g = enMercator(f.geometry, Mercator);
      if (!g.centro) continue;
      const suelo = alturaDelSuelo(f.properties.id, g.centro);
      const zPie = suelo * g.zPorMetro;
      const zCima = (suelo + f.properties.pide_m) * g.zPorMetro;
      const distancia = m[3] * g.centroXY[0] + m[7] * g.centroXY[1] + m[11] * zPie + m[15];
      if (!(distancia > 0)) continue;
      let cubre = false;
      for (const xy of g.anillos) {
        const pie = anilloEnPantalla(m, xy, zPie, ancho, alto);
        const cima = pie && anilloEnPantalla(m, xy, zCima, ancho, alto);
        if (cima && puntoEnColumna(px, py, pie, cima)) {
          cubre = true;
          break;
        }
      }
      if (!cubre) continue;
      const t = rayo ? profundidadEnColumna(rayo, g.anillos, zPie, zCima) : null;
      if (t != null) {
        if (t < tMejor) {
          tMejor = t;
          mejor = f.properties.id;
        }
      } else if (distancia < distanciaRespaldo) {
        distanciaRespaldo = distancia;
        respaldo = f.properties.id;
      }
    }
    return mejor ?? respaldo;
  }

  /** Altura del terreno (metros, ya con la exageración) bajo el centro de una columna; se guarda entre consultas. */
  function alturaDelSuelo(id, centro) {
    let suelo = est.suelos.get(id);
    if (suelo === undefined) {
      suelo = mapa.queryTerrainElevation?.(centro) ?? 0;
      est.suelos.set(id, suelo);
    }
    return suelo;
  }

  const olvidarSuelos = () => est.suelos.clear();
  const alLlegarDatos = (ev) => {
    if (ev?.sourceId === FUENTE_RELIEVE) olvidarSuelos();
  };

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

  const alClic = (ev) => elegir(columnaEn(ev.point, { tolerancia: holguraClic }));

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

  /** Tras dibujar un cuadro con la cámara en otro sitio: la columna bajo la mira (o el puntero) puede ser otra. */
  const alDibujar = () => {
    if (!est.camaraCambio) return;
    est.camaraCambio = false;
    if (est.conTeclado) {
      apuntarConLaMira();
    } else if (est.ultimoPuntero) {
      const id = columnaEn(est.ultimoPuntero);
      ponerCursor(id != null);
      apuntar(id);
    }
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
    mapa.on("render", alDibujar);
    mapa.on("zoom", olvidarSuelos);
    mapa.on("terrain", olvidarSuelos);
    mapa.on("sourcedata", alLlegarDatos);
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
    mapa.off("render", alDibujar);
    mapa.off("zoom", olvidarSuelos);
    mapa.off("terrain", olvidarSuelos);
    mapa.off("sourcedata", alLlegarDatos);
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
  function montar() {
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
      if (!est.inclinada) {
        est.inclinada = true;
        inclinarCamara();
      }
      pintar();
    } catch (error) {
      console.warn("ROOT: twin view not available", error);
      est.montado = true; // para que desmontar retire lo que alcanzó a entrar
      est.activo = false;
      desmontar(est.inclinada, false);
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
        console.warn("ROOT: twin view layers could not be removed cleanly", error);
      }
      soltarProtocolo(biblioteca, alFallarTesela);
      mapa.off("error", alErrorDelMapa);
    }
    est.montado = false;
    est.firmaColumnas = null;
    est.firmaPlanas = null;
    est.fuenteRelieve = null;
    est.matriz = null;
    est.inversa = null;
    est.camaraCambio = false;
    est.suelos.clear();
    if (conCamara) {
      est.inclinada = false;
      aplanarCamara(animar);
    }
  }

  function activar(zonaId) {
    if (est.destruido || !mapa) return false;
    if (!disponible(zonaId)) {
      avisar("no_disponible", TEXTOS.noDisponible, { zonaId, repetible: true });
      return false;
    }
    if (est.activo && est.zonaId === zonaId) return true;
    if (est.activo) desmontar(false, false); // otra zona: se cambia el relieve y se conserva la cámara
    est.activo = true;
    est.zonaId = zonaId;
    est.avisados.clear();
    est.teselasFallidas = [];
    cuandoEstiloListo(() => {
      if (est.activo && est.zonaId === zonaId && !est.montado) montar();
    });
    return est.activo; // false si el montaje falló en esta misma llamada (montar ya avisó y limpió)
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
    if (mapa) {
      desmontar(estabaActivo, false);
      try {
        quitarImagenes();
      } catch (error) {
        console.warn("ROOT: twin view images could not be removed cleanly", error);
      }
    }
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
    leyendaHTML: (zonaId = est.zonaId) => htmlLeyenda(gemelo, zonaId),
    columnaEn,
    destruir,
    get depuracion() {
      return {
        version: est.version,
        montado: est.montado,
        zonaId: est.zonaId,
        exageracion: exageracionDe(gemelo?.terreno, est.zonaId),
        D: est.datos.D,
        r: est.datos.r,
        metrosPorMillar: num(gemelo?.columnas?.metros_por_millar),
        columnas: est.ultimo?.columnas ?? null,
        planas: est.ultimo?.planas ?? null,
        cuenta: est.ultimo ? { ...est.ultimo.cuenta } : null,
        fuenteRelieve: est.fuenteRelieve ? { ...est.fuenteRelieve } : null,
        urlTeselas: zonaDe(est.zonaId) ? urlAbsoluta(zonaDe(est.zonaId).teselas) : null,
        teselasFallidas: [...est.teselasFallidas],
      };
    },
  };
}
