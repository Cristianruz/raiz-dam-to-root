// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/contexto.js — Bases de datos del reto en la página: «Regional context», «Challenge data
// sources» y la evidencia por parcela (docs/decisiones/2026-11-14_recursos_del_reto.md).
// Módulo ES independiente, sin dependencias. Todo lo que muestra sale de web/data/contexto.json
// (lo escribe motor/contexto_web.py): este archivo no trae ninguna cifra.
//
// Qué exporta (lo conecta app.js; este archivo no toca el resto de la página):
//   cargarContexto(url = "data/contexto.json") -> Promise<objeto | null>
//       Lee contexto.json; null si el archivo no existe (la página dice «not available yet»).
//   montarContextoRegional(contenedor, { contexto, zonaId, anio, nombresCultivo, nivel })
//       -> { elemento, fijarAnio(a), fijarZona(z), destruir() } | null
//       Sección «Regional context» (reemplaza el contenido del contenedor):
//       (1) «Climate of the year»: lluvia de GPM IMERG y de NASA POWER lado a lado con su diferencia,
//           ETo y días con helada del año agrícola elegido, y una gráfica por variable con todos los
//           años y el elegido resaltado (línea, marcador y texto; no solo color);
//       (2) una tarjeta por grupo de series de contexto_regional (contexto.tarjetas): gráfica, valor
//           del año elegido, unidad, resolución y fuente. Cada serie lleva SU resolución: si las series
//           de un panel no comparten malla (MODIS y GLDAS en la tarjeta de evapotranspiración), va un
//           renglón por serie con su nombre (metaDePanel). Si el bloque es null o la serie no llegó, la
//           tarjeta existe y dice el motivo del JSON («Requested from the data team — not delivered
//           yet»), sin gráfica vacía ni ceros. GRACE llega como una sola serie de cuenca: se muestra
//           igual en todas las zonas y se rotula «Basin scale». Otra tarjeta lista la aptitud de GAEZ
//           por cultivo. La tarjeta de evapotranspiración dibuja además et_contraste junto a MODIS y
//           GLDAS, pero SOLO en la zona del contraste (et_contraste.zona): en las demás zonas dice
//           que no se corrió ahí (et_contraste.motivo_otras_zonas) y no cruza series de dos áreas;
//       (3) las fuentes: en cada tarjeta, a la vista, el nombre del recurso y la fecha del archivo; el
//           texto completo de cada fuente (la línea de LEEME, que puede ser larga) va UNA sola vez,
//           plegado, en «Sources and product versions» al final de la sección;
//       (4) la nota fija de límites (NOTA_REGIONAL) y, en cada tarjeta, a la vista, las advertencias de la sesión de
//           datos que trae contexto.tarjetas[].advertencias (comparación, no validación; la evaporación potencial de
//           NLDAS no es la ETo de FAO-56; GRACE es una serie de cuenca; ERA5-Land no es de NASA). La malla de GRACE
//           dice la del producto Y la del mascon cuando la serie trae «malla_mascon» (cifras de la entrega). Un año
//           con días faltantes que sí tiene total lo dice junto a su cifra («N of M days with data»); un año que la
//           gráfica no dibuja (parcial) dice por qué, no «no data».
//         contexto        contenido de contexto.json (null: la sección lo dice)
//         zonaId          id de la zona piloto (contexto.zonas); otra cosa: «choose a pilot area»
//         anio            año agrícola elegido en la línea de tiempo (por omisión, el último con dato)
//         nombresCultivo  opcional {id de cultivo: nombre para mostrar} (tarjeta de GAEZ)
//         nivel           opcional: nivel del encabezado de la sección (NIVEL_POR_OMISION)
//       fijarAnio(a) solo cambia lo que depende del año (no cierra las tablas abiertas).
//   montarRecursosReto(contenedor, { contexto, nivel }) -> { elemento, destruir() } | null
//       Tabla «Challenge data sources» (Resource · Agency · Role in ROOT · Status · Files), con el
//       estado en símbolo y texto, ordenada (en uso, pedidas, no aplica) y un resumen cuyos conteos
//       se calculan de contexto.recursos.
//   evidenciaDeParcela({ contexto, id, mesesCultivo }) -> [{ etiqueta, texto, nota, lectura, fuente, archivo, fecha }]
//       Renglones para la ficha: la lectura de altura de GEDI y la ET de ECOSTRESS del último mes con
//       dato. [] si los dos bloques son null. GEDI (rh, altura relativa) NO marca cero sobre suelo
//       desnudo: el renglón no se rotula «canopy height» ni se presenta como altura del cultivo.
//       ECOSTRESS: el valor, el mes y de cuántos sobrevuelos despejados sale, con su intervalo si son dos o más
//       (ecostress.escenas_parcelas, conteo, minimos_parcelas y maximos_parcelas); la nota, a la vista,
//       dice que es una estimación satelital y no una medición en la parcela (ecostress.aviso) y, si el calendario
//       del modelo (mesesCultivo, de la opción ACTUAL del cubo) no tiene cultivo en ese mes, que el valor es el
//       del campo sin cultivo. No se compara con el modelo (docs/revisiones/2026-11-15_ecostress.md).
//         texto    lo que GEDI vio. Si la sesión de datos entregó su criterio (gedi.criterios, de
//                  supuestos.json), empieza con la lectura: «tall canopy seen», «no tall canopy seen»
//                  o «too few shots to tell»; después, la mediana, los disparos y el decil alto.
//         nota     (texto o null) es parte del renglón: la ficha la escribe SIEMPRE junto al valor.
//                  La de GEDI = NOTA_GEDI (fija, sin cifras) + lo que GEDI marca en parcelas sin
//                  árboles y el criterio de dosel alto, cada uno con su etiqueta (criteriosGedi); si
//                  no hay criterios, entre qué valores leen las parcelas de la entrega (referenciaGedi).
//         lectura  para la ficha, sin texto: «tall_canopy», «no_tall_canopy», «too_few_shots»,
//                  «no_shots», o null (GEDI sin criterio entregado; ECOSTRESS).
//         fuente   texto completo de la entrega (puede ser largo); «archivo» y «fecha» la citan en
//                  corto. La fuente de cada criterio está en contexto.gedi.criterios.*.fuente.
//   riesgoDeHelada({ contexto, fechaSiembra, zonaId }) -> { prob, fuente, fecha } | null
//       Probabilidad de helada después de la fecha de siembra, de heladas.prob_helada_despues_de
//       (la fecha «MM-DD» más cercana anterior o igual). fechaSiembra: «MM-DD», «AAAA-MM-DD», Date,
//       [mes, día] o { mes, dia }. zonaId (opcional): si heladas.zonas trae esa zona, se usa su tabla;
//       si no, la de la zona base. null si no hay bloque o la fecha cae fuera de la ventana calculada.
//   Funciones puras (las mismas que usa la página; se prueban en tests/contexto.test.js):
//       num, climaDelAnio, diferenciaLluvia, anioPorOmision, graficasDeClima, seriesDeZona,
//       puntosAnuales, valorAnual, modeloTarjetas, modeloContraste, metaDePanel, citasDeTarjeta,
//       fuentesDeSeccion, escalaY, formatoResolucion, formatoNumero, etiquetaMes, ordenarRecursos,
//       contarEstados, ultimoMesConDato, lecturaDeGedi, criteriosGedi, referenciaGedi, mesDia, diasIncompletos,
//       textoMascon.
//       Textos fijos exportados: NOTA_REGIONAL, NOTA_GEDI, NOTA_GEDI_SIN_DISPAROS.
//   Las funciones «montar…» insertan css/contexto.css en la página si aún no está enlazada.
//
// Reglas de este archivo:
// - Ninguna cifra escrita a mano: valores, años, resoluciones, conteos y fechas salen de contexto.json.
//   Los números del código son medidas de diseño de las gráficas (unidades del viewBox) o conversiones
//   de unidad (metros por kilómetro), no datos.
// - Un dato que falta se dice («no data», «partial year», el motivo del JSON): nunca se dibuja como cero.
// - Sin colores en el JS: las series llevan clases «contexto-serie--a…e» y los colores viven en
//   css/contexto.css. Cada serie se distingue además por su trazo y su marcador, y cada estado por
//   su símbolo y su texto: nada depende solo del color.
// - Interfaz en inglés; comentarios en español. Sin «first» ni «only»; no se promete ahorro; la
//   herramienta no reparte, vende ni intercambia agua ni pronostica la presa.

const LOCALE = "en-US";
const HOJA = "../css/contexto.css"; // relativa a este módulo
const NIVEL_POR_OMISION = 3;

// ---------------------------------------------------------------------------
// Textos de la interfaz (sin números)
// ---------------------------------------------------------------------------
const TITULO_CONTEXTO = "Regional context";
const TITULO_CLIMA = "Climate of the year";
const TITULO_RECURSOS = "Challenge data sources";
export const NOTA_REGIONAL =
  "Regional series describe the area or the basin, not a single field. They do not forecast the dam and do not change the water light.";
// GEDI (rh, altura relativa del retorno): el instrumento no marca cero sobre suelo desnudo, así que el
// renglón de la ficha no se rotula como altura del cultivo y lleva siempre esta nota (sin cifras: el
// piso del instrumento y el umbral de dosel alto salen de gedi.criterios; ver criteriosGedi).
const ETIQUETA_GEDI = "GEDI height reading";
// Lectura de una parcela con el criterio de la sesión de datos (gedi.criterios.dosel_alto).
const LECTURAS_GEDI = {
  tall_canopy: "tall canopy seen",
  no_tall_canopy: "no tall canopy seen",
  too_few_shots: "too few shots to tell",
};
const LECTURA_SIN_DISPAROS = "no_shots";
export const NOTA_GEDI =
  "GEDI does not read zero on bare ground: a low value means low or no canopy. It tells an orchard from a low crop; it does not measure crop height.";
export const NOTA_GEDI_SIN_DISPAROS =
  "GEDI samples the ground with separate laser shots, so many fields have none. This is no data, not zero.";
// Aviso de ECOSTRESS cuando contexto.json no trae el rótulo de la entrega (ecostress.aviso, que dice la resolución):
// el mismo sentido, sin la cifra (ninguna cifra se escribe aquí).
export const AVISO_ECOSTRESS = "Satellite estimate on clear days, not a field measurement.";
// Cuando el calendario del modelo de la rotación actual no tiene cultivo en el mes del valor mostrado.
export const NOTA_ECOSTRESS_SIN_CULTIVO =
  "The crop calendar has no crop on this field in that month: the value is for the field without a crop.";
const TEXTO_NO_DISPONIBLE = "Not available yet";
const TEXTO_SIN_CONTEXTO = "Regional context: not available yet.";
const TEXTO_ELIJA_ZONA = "Choose one pilot area to see its regional context.";
const TEXTO_SIN_DATO = "no data";
const ROTULO_ANIO = "Agricultural year";
const ROTULO_MES = "Month";
const ROTULO_TABLA = "Data table";
const ROTULO_FUENTES = "Sources and product versions";
// Respaldo de et_contraste.motivo_otras_zonas (lo escribe motor/contexto_web.py).
const TEXTO_CONTRASTE_OTRA_ZONA = "Not run for this pilot area";
const AYUDA_MESES = "Point at a month to read its values, or open the data table.";
const TEXTO_SIN_MALLA = "grid not stated in the delivery";
const ROTULO_MALLAS = "Grid of each series";
const ROTULO_ADVERTENCIAS = "Limits of these series";

// Estado de un recurso (contexto.recursos[].estado). El símbolo acompaña al texto y al color.
const ESTADOS_RECURSO = {
  in_use: { texto: "In use", simbolo: "✓", orden: 0 },
  requested: { texto: "Requested, not delivered yet", simbolo: "○", orden: 1 },
  not_applicable: { texto: "Not applicable", simbolo: "–", orden: 2 },
};
const ESTADO_DESCONOCIDO = { texto: "Unknown", simbolo: "?", orden: 3 };

// Ranuras de serie en orden fijo: el color sigue a la serie, no a su posición entre las presentes.
const RANURAS = ["a", "b", "c", "d", "e"];
// Llave de contexto_regional con las series de cuenca (motor/esquemas.py, ZONA_CUENCA).
const LLAVE_CUENCA = "cuenca";

// Medidas de diseño de las gráficas, en píxeles (no son datos). Cada gráfica se dibuja al ancho real
// de su lienzo (entre ANCHO_MIN y ANCHO_MAX) para que el texto tenga siempre el mismo tamaño.
const ANCHO = 320; // ancho si el lienzo aún no tiene tamaño (sin hoja de estilos o fuera del documento)
const ANCHO_MIN = 200;
const ANCHO_MAX = 560;
const ALTO = 150;
const MARGEN = { izq: 46, der: 14, arriba: 24, abajo: 24 };
const DIVISIONES_Y = 3;
const RADIO_MARCA = 5;
const RADIO_PUNTO = 2.5;
const HOLGURA_TEXTO = 5;
const ANCHO_CLAVE = 30; // clave de la leyenda: un tramo de línea con el trazo y el marcador de la serie
const ALTO_CLAVE = 12;
const RADIO_CLAVE = 3.5;
const BORDE_TEXTO = 40; // a menos de esto del borde, el rótulo del año se alinea hacia adentro
const METROS_POR_KM = 1000;
const MESES_DEL_CALENDARIO = 12; // meses_cultivo del cubo: una marca por mes, de enero a diciembre
const ANIO_DE_REFERENCIA = 2000; // un año bisiesto, para ordenar fechas «MM-DD» y admitir el 29 de febrero
const MS_POR_DIA = 24 * 60 * 60 * 1000;
const CERO = String(0);

let contador = 0;

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

/** Número finito o null (null, "", booleanos, NaN e infinitos son «sin dato»). */
export function num(v) {
  if (v == null || v === "" || typeof v === "boolean") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const formatos = new Map();
function formateador(opciones) {
  const llave = JSON.stringify(opciones);
  if (!formatos.has(llave)) formatos.set(llave, new Intl.NumberFormat(LOCALE, opciones));
  return formatos.get(llave);
}

/** Número de los datos para leer: más decimales cuanto más chico es (0.213, 6.25, 264.7). «—» si no es número. */
export function formatoNumero(v, opciones = {}) {
  const n = num(v);
  if (n == null) return "—";
  const magnitud = Math.abs(n);
  const decimales = opciones.decimales ?? (magnitud < 1 ? 3 : magnitud < 10 ? 2 : 1);
  return formateador({ maximumFractionDigits: decimales, ...(opciones.signo ? { signDisplay: "exceptZero" } : {}) }).format(n);
}

function conUnidad(texto, unidad) {
  return unidad ? `${texto} ${unidad}` : texto;
}

/** Resolución nominal en metros como texto: kilómetros desde mil metros («9 km»), metros si es menor. */
export function formatoResolucion(metros, locale = LOCALE) {
  const m = num(metros);
  if (m == null || m <= 0) return null;
  const enKm = m >= METROS_POR_KM;
  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: enKm ? "kilometer" : "meter",
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(enKm ? m / METROS_POR_KM : m);
}

/** «AAAA-MM» como «Oct 2025» (o el texto tal cual si no es un mes). */
export function etiquetaMes(texto) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(texto ?? ""));
  if (!m) return String(texto ?? "");
  return new Intl.DateTimeFormat(LOCALE, { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1)),
  );
}

function plural(n, uno, varios) {
  return n === 1 ? uno : varios;
}

/** Inserta css/contexto.css (relativa a este módulo) si la página aún no la enlaza. */
function asegurarHoja() {
  if (typeof document === "undefined") return;
  const yaEsta = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) =>
    (l.getAttribute("href") || "").endsWith("contexto.css"),
  );
  if (yaEsta) return;
  const enlace = document.createElement("link");
  enlace.rel = "stylesheet";
  enlace.href = new URL(HOJA, import.meta.url).href;
  document.head.appendChild(enlace);
}

/** Lee contexto.json. null si no existe (404); otro fallo de red o un JSON roto se propagan. */
export async function cargarContexto(url = "data/contexto.json") {
  const r = await fetch(url, { cache: "no-cache" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.json();
}

// ---------------------------------------------------------------------------
// Clima del año (contexto.clima_anual): funciones puras
// ---------------------------------------------------------------------------
function bloqueClima(contexto, zonaId) {
  return (contexto && contexto.clima_anual && contexto.clima_anual[zonaId]) || null;
}

/** Diferencia de lluvia IMERG − POWER a un decimal (como los datos); null si falta alguna. */
export function diferenciaLluvia(imerg, power) {
  const a = num(imerg);
  const b = num(power);
  if (a == null || b == null) return null;
  const DIEZ = 10;
  return Math.round((a - b) * DIEZ) / DIEZ;
}

/** Lo que se sabe del año agrícola elegido en una zona; null si la zona no tiene clima o el año no está. */
export function climaDelAnio(contexto, zonaId, anio) {
  const bloque = bloqueClima(contexto, zonaId);
  const entrada = bloque && (bloque.anios || []).find((a) => a.anio === num(anio));
  if (!entrada) return null;
  return {
    anio: entrada.anio,
    lluviaImerg: num(entrada.lluvia_imerg_mm),
    lluviaPower: num(entrada.lluvia_power_mm),
    diferencia: diferenciaLluvia(entrada.lluvia_imerg_mm, entrada.lluvia_power_mm),
    eto: num(entrada.eto_mm),
    diasHelada: num(entrada.dias_helada),
    diasConDato: num(entrada.dias_con_dato),
    diasConDatoImerg: num(entrada.dias_con_dato_imerg),
    diasDelAnio: num(entrada.dias_del_anio),
  };
}

/** Último año agrícola de la zona con algún valor (para abrir la sección si no se da un año). */
export function anioPorOmision(contexto, zonaId) {
  const bloque = bloqueClima(contexto, zonaId);
  const conDato = ((bloque && bloque.anios) || []).filter(
    (a) => num(a.eto_mm) != null || num(a.lluvia_power_mm) != null || num(a.lluvia_imerg_mm) != null,
  );
  return conDato.length ? conDato[conDato.length - 1].anio : null;
}

function motivoDeDias(conDato, delAnio) {
  const c = num(conDato);
  const t = num(delAnio);
  if (c == null || t == null || c === 0) return TEXTO_SIN_DATO;
  return `incomplete year: ${formatoNumero(c)} of ${formatoNumero(t)} days with data`;
}

/** {año: motivo} de los años sin valor (los demás no entran). */
function motivosPorAnio(anios, detalles) {
  const salida = {};
  anios.forEach((a, i) => {
    if (detalles[i]) salida[String(a)] = detalles[i];
  });
  return salida;
}

/**
 * Días con dato de un año que SÍ tiene total pero le faltan días (bajo el umbral de faltantes, el total se calcula
 * con los días que hay): «N of M days with data». null si el año está completo o no se sabe.
 */
export function diasIncompletos(conDato, delAnio) {
  const c = num(conDato);
  const t = num(delAnio);
  if (c == null || t == null || c >= t) return null;
  return `${formatoNumero(c)} of ${formatoNumero(t)} days with data`;
}

/** Quita del principio y del final las posiciones donde ninguna serie tiene valor. */
function recortar(x, series) {
  const hay = (i) => series.some((s) => s.valores[i] != null);
  let ini = 0;
  let fin = x.length - 1;
  while (ini <= fin && !hay(ini)) ini += 1;
  while (fin >= ini && !hay(fin)) fin -= 1;
  return {
    x: x.slice(ini, fin + 1),
    series: series.map((s) => ({
      ...s,
      valores: s.valores.slice(ini, fin + 1),
      detalles: (s.detalles || []).slice(ini, fin + 1),
    })),
  };
}

/**
 * Modelos de las tres gráficas de «Climate of the year» de una zona: lluvia (IMERG y POWER), ETo y
 * días con helada, por año agrícola. [] si la zona no tiene clima. Un año sin suma va en null con su motivo.
 */
export function graficasDeClima(contexto, zonaId) {
  const bloque = bloqueClima(contexto, zonaId);
  if (!bloque || !(bloque.anios || []).length) return [];
  const anios = bloque.anios;
  const x = anios.map((a) => ({ clave: a.anio, etiqueta: String(a.anio) }));
  const serie = (nombre, ranura, campo, campoDias) => {
    const detalles = anios.map((a) => (num(a[campo]) == null ? motivoDeDias(a[campoDias], a.dias_del_anio) : null));
    return { nombre, ranura, valores: anios.map((a) => num(a[campo])), detalles, fuera: motivosPorAnio(anios.map((a) => a.anio), detalles) };
  };
  const definiciones = [
    {
      id: "clima-lluvia",
      titulo: "Rainfall",
      unidad: "mm",
      series: [
        serie("GPM IMERG", RANURAS[0], "lluvia_imerg_mm", "dias_con_dato_imerg"),
        serie("NASA POWER", RANURAS[1], "lluvia_power_mm", "dias_con_dato"),
      ],
    },
    {
      id: "clima-eto",
      titulo: "Reference evapotranspiration (ETo)",
      unidad: "mm",
      series: [serie("NASA POWER", RANURAS[0], "eto_mm", "dias_con_dato")],
    },
    {
      id: "clima-heladas",
      titulo: "Days with frost",
      unidad: "days",
      series: [serie("NASA POWER", RANURAS[0], "dias_helada", "dias_con_dato")],
    },
  ];
  return definiciones.map((d) => ({
    ...d,
    ...recortar(x, d.series),
    subtitulo: `${d.unidad} per agricultural year`,
    desdeCero: true,
    porAnio: true,
    columnaX: ROTULO_ANIO,
  }));
}

// ---------------------------------------------------------------------------
// Series regionales (contexto.contexto_regional) y et_contraste: funciones puras
// ---------------------------------------------------------------------------
/**
 * [{ anio, valor, nMeses, parcial }] de una serie regional: el valor es lo que resume el año según
 * serie.estadistica (la suma de sus doce meses o la media mensual) y solo existe si el año está completo.
 */
export function puntosAnuales(serie) {
  return ((serie && serie.anual) || []).map((a) => {
    const completo = a.completo === true;
    const valor = !completo ? null : serie.estadistica === "suma" ? num(a.suma) : num(a.media);
    return { anio: a.anio, valor, nMeses: num(a.n_meses) ?? 0, parcial: !completo && (num(a.n_meses) ?? 0) > 0 };
  });
}

/** Punto anual de un año (o null si la serie no tiene ese año). */
export function valorAnual(serie, anio) {
  return puntosAnuales(serie).find((p) => p.anio === num(anio)) || null;
}

function motivoDeMeses(punto) {
  if (!punto || !punto.nMeses) return TEXTO_SIN_DATO;
  return `partial year: ${formatoNumero(punto.nMeses)} ${plural(punto.nMeses, "month", "months")} with data`;
}

function recursoDeFuente(contexto, fuenteId) {
  if (fuenteId == null) return null;
  return ((contexto && contexto.recursos) || []).find((r) => r.fuente_contexto === fuenteId || r.id === fuenteId) || null;
}

/** Por qué no hay una serie: el motivo del recurso, el del bloque o el texto fijo. */
function motivoDeSerie(contexto, clave) {
  const recurso = recursoDeFuente(contexto, String(clave).split(".")[0]);
  return (recurso && recurso.motivo) || (contexto && contexto.contexto_regional_motivo) || TEXTO_NO_DISPONIBLE;
}

function unidadAnual(serie) {
  return serie.unidad_anual_en ?? serie.unidad_en ?? serie.unidad ?? "";
}

/**
 * Series regionales que se muestran en una zona: las de su rectángulo más las de cuenca (GRACE llega
 * como una sola serie, bajo la llave LLAVE_CUENCA, y vale igual para todas las zonas piloto).
 */
export function seriesDeZona(contexto, zonaId) {
  const regional = (contexto && contexto.contexto_regional) || null;
  if (!regional) return {};
  return { ...(regional[LLAVE_CUENCA] || {}), ...(regional[zonaId] || {}) };
}

function modeloAnualDePanel(tarjeta, indice, panel, seriesZona) {
  const presentes = panel.series
    .map((s, i) => ({ ...s, ranura: RANURAS[i], serie: seriesZona[s.clave] || null }))
    .filter((s) => s.serie);
  if (!presentes.length) return null;
  const anios = [...new Set(presentes.flatMap((s) => puntosAnuales(s.serie).map((p) => p.anio)))].sort((a, b) => a - b);
  const x = anios.map((a) => ({ clave: a, etiqueta: String(a) }));
  const series = presentes.map((s) => {
    const puntos = new Map(puntosAnuales(s.serie).map((p) => [p.anio, p]));
    return {
      nombre: s.etiqueta,
      ranura: s.ranura,
      valores: anios.map((a) => (puntos.get(a) ? puntos.get(a).valor : null)),
      detalles: anios.map((a) => (puntos.get(a) && puntos.get(a).valor != null ? null : motivoDeMeses(puntos.get(a)))),
      // Motivo de cada año sin valor, aunque el recorte del eje lo deje fuera (p. ej. un año con un solo mes).
      fuera: motivosPorAnio(anios, anios.map((a) => (puntos.get(a) && puntos.get(a).valor != null ? null : motivoDeMeses(puntos.get(a))))),
    };
  });
  const base = presentes[0].serie;
  return {
    id: `${tarjeta.id}-${indice}`,
    titulo: panel.titulo,
    // Nombre completo para lectores de pantalla: dos tarjetas pueden tener un panel con el mismo título.
    nombre: `${tarjeta.titulo}: ${panel.titulo}`,
    unidad: unidadAnual(base),
    // Una suma ya lo dice en su unidad («mm/year»); una media lo dice con palabras.
    subtitulo: base.estadistica === "suma" ? unidadAnual(base) : [unidadAnual(base), "yearly mean"].filter(Boolean).join(", "),
    desdeCero: base.estadistica === "suma",
    porAnio: true,
    columnaX: ROTULO_ANIO,
    ...recortar(x, series),
  };
}

/**
 * Tarjetas de «Regional context» para una zona: una por entrada de contexto.tarjetas, exista o no el
 * dato. Cada panel trae sus series presentes (con su resolución y su fuente) y su gráfica anual, o el
 * motivo por el que no está. `disponible` es false cuando la tarjeta no tiene nada que dibujar.
 */
export function modeloTarjetas(contexto, zonaId) {
  const seriesZona = seriesDeZona(contexto, zonaId);
  return ((contexto && contexto.tarjetas) || []).map((tarjeta) => {
    const paneles = (tarjeta.paneles || []).map((panel, i) => {
      const grafica = modeloAnualDePanel(tarjeta, i, panel, seriesZona);
      const series = (panel.series || []).map((s) => ({
        clave: s.clave,
        etiqueta: s.etiqueta,
        serie: seriesZona[s.clave] || null,
        motivo: seriesZona[s.clave] ? null : motivoDeSerie(contexto, s.clave),
      }));
      const faltantes = series.filter((s) => !s.serie);
      return {
        titulo: panel.titulo,
        series,
        grafica,
        disponible: Boolean(grafica),
        motivo: faltantes.length ? faltantes[0].motivo : null,
      };
    });
    const contraste = tarjeta.contraste ? modeloContraste(contexto, zonaId, tarjeta) : null;
    const disponible = paneles.some((p) => p.disponible) || Boolean(contraste && contraste.disponible);
    const sinDato = paneles.find((p) => !p.disponible);
    return {
      id: tarjeta.id,
      titulo: tarjeta.titulo,
      nota: tarjeta.nota || null,
      // Límites de la sesión de datos que van a la vista (data/recursos_reto.json → tarjetas[].advertencias).
      advertencias: (tarjeta.advertencias || []).filter((a) => a && a.texto),
      paneles,
      contraste,
      disponible,
      motivo: sinDato ? sinDato.motivo : null,
    };
  });
}

function textoCeldas(serie) {
  const n = num(serie.n_celdas);
  if (n != null) return `${formatoNumero(n)} ${plural(n, "grid cell", "grid cells")} in the average`;
  const rango = serie.n_celdas_rango;
  if (Array.isArray(rango) && rango.length > 1) return `${formatoNumero(rango[0])} to ${formatoNumero(rango[1])} grid cells in the average`;
  return null;
}

/** Lo que el JSON dice de la malla de UNA serie regional, en textos: ámbito con su resolución y celdas del promedio. */
function partesDeMalla(serie) {
  const resolucion = formatoResolucion(serie.resolucion_m);
  const deCuenca = serie.ambito === LLAVE_CUENCA;
  const mascon = textoMascon(serie);
  return [
    resolucion ? `${deCuenca ? "Basin scale" : "Regional"}, ${resolucion} grid` : null,
    mascon,
    deCuenca ? "One series for the whole basin, the same in every pilot area" : null,
    textoCeldas(serie),
  ].filter(Boolean);
}

/**
 * Malla real de una serie hecha de mascons (GRACE): «0.5° product grid built on 3° mascons: the real resolution is
 * the mascon's». Las dos cifras salen de serie.malla_mascon (la línea de LEEME de la entrega); sin ese campo, null.
 */
export function textoMascon(serie) {
  const m = serie && serie.malla_mascon;
  const mascon = m && num(m.mascon_grados);
  if (mascon == null) return null;
  const malla = num(m.malla_grados);
  const deMalla = malla != null ? `${formatoNumero(malla)}° product grid built on` : "Built on";
  return `${deMalla} ${formatoNumero(mascon)}° mascons: the real resolution is the mascon's`;
}

/**
 * Malla de las series presentes de un panel (un elemento de modeloTarjetas(…)[i].paneles):
 * [{ etiqueta, partes, texto }]. Cada serie lleva SU resolución y SUS celdas:
 * - si todas las presentes dicen lo mismo, un solo renglón con etiqueta null;
 * - si difieren en ámbito, resolución o celdas, un renglón por serie con la etiqueta de la serie
 *   (la misma de la leyenda), para que ninguna herede la malla de otra.
 * `partes` son los textos sueltos y `texto` los junta. [] si no hay series o ninguna dice su malla.
 */
export function metaDePanel(panel) {
  const SEPARADOR = " · ";
  const presentes = ((panel && panel.series) || []).filter((s) => s && s.serie);
  const renglones = presentes.map((s) => ({ etiqueta: s.etiqueta ?? null, partes: partesDeMalla(s.serie) }));
  if (!renglones.some((r) => r.partes.length)) return [];
  const iguales = new Set(renglones.map((r) => JSON.stringify(r.partes))).size === 1;
  const lista = iguales
    ? [{ etiqueta: null, partes: renglones[0].partes }]
    : renglones.map((r) => (r.partes.length ? r : { ...r, partes: [TEXTO_SIN_MALLA] }));
  return lista.map((r) => ({ ...r, texto: r.partes.join(SEPARADOR) }));
}

function nombreDeZona(contexto, zonaId) {
  const zona = contexto && contexto.zonas && contexto.zonas[zonaId];
  return (zona && zona.nombre) || (zonaId == null ? null : String(zonaId));
}

/**
 * Gráfica mensual de et_contraste (A8). El contraste es de UNA zona piloto (et_contraste.zona):
 * - en esa zona: { disponible: true, … } con sus columnas y, junto a ellas, las series regionales de
 *   ET de la misma zona en esos meses. Las columnas sin ningún valor no se dibujan: van en `sinDato`;
 * - en otra zona: { disponible: false, zona, zonaNombre, motivo } y ninguna serie. No se dibuja, para
 *   no poner en los mismos ejes el contraste de un área y las series regionales de otra;
 * - si el JSON no dice de qué zona es el contraste: sus columnas solas, sin series regionales.
 * null si no hay bloque et_contraste, si la tarjeta no lo define o si no hay nada que dibujar.
 */
export function modeloContraste(contexto, zonaId, tarjeta) {
  const bloque = contexto && contexto.et_contraste;
  const definicion = tarjeta && tarjeta.contraste;
  if (!bloque || !definicion || !(bloque.meses || []).length) return null;
  const base = {
    id: `${tarjeta.id}-contraste`,
    titulo: definicion.titulo,
    nombre: `${tarjeta.titulo}: ${definicion.titulo}`,
    zona: bloque.zona ?? null,
  };
  if (base.zona != null && base.zona !== zonaId) {
    return {
      ...base,
      disponible: false,
      zonaNombre: nombreDeZona(contexto, base.zona),
      motivo: bloque.motivo_otras_zonas || TEXTO_CONTRASTE_OTRA_ZONA,
    };
  }
  const meses = bloque.meses.map(String);
  const candidatas = [];
  Object.entries(definicion.columnas || {}).forEach(([columna, nombre]) => {
    const valores = (bloque.columnas && bloque.columnas[columna]) || [];
    candidatas.push({ nombre, valores: meses.map((_, i) => num(valores[i])) });
  });
  // Las series regionales entran solo cuando el JSON dice que el contraste es de esta misma zona.
  const seriesZona = base.zona != null ? seriesDeZona(contexto, zonaId) : {};
  (base.zona != null ? definicion.series_regionales || [] : []).forEach((s) => {
    const serie = seriesZona[s.clave];
    const porMes = new Map(serie ? serie.meses.map((m, i) => [m, num(serie.valores[i])]) : []);
    candidatas.push({ nombre: s.etiqueta, valores: meses.map((m) => porMes.get(m) ?? null) });
  });
  const conRanura = candidatas.map((c, i) => ({ ...c, ranura: RANURAS[i % RANURAS.length] }));
  const series = conRanura
    .filter((c) => c.valores.some((v) => v != null))
    .map((c) => ({ nombre: c.nombre, ranura: c.ranura, valores: c.valores, detalles: c.valores.map((v) => (v == null ? TEXTO_SIN_DATO : null)) }));
  if (!series.length) return null;
  return {
    ...base,
    disponible: true,
    unidad: definicion.unidad_en || "",
    subtitulo: definicion.unidad_en || "",
    x: meses.map((m) => ({ clave: m, etiqueta: etiquetaMes(m) })),
    series,
    sinDato: conRanura.filter((c) => !c.valores.some((v) => v != null)).map((c) => c.nombre),
    desdeCero: true,
    porAnio: false,
    columnaX: ROTULO_MES,
    nota: definicion.nota || null,
    recurso: definicion.recurso || null,
    archivo: bloque.archivo || null,
    fuente: bloque.fuente || null,
    fecha: bloque.fecha || null,
  };
}

// ---------------------------------------------------------------------------
// Fuentes de lo que se dibuja: funciones puras
// ---------------------------------------------------------------------------
function cita(contexto, recursoId, origen) {
  const recurso = recursoDeFuente(contexto, recursoId);
  return {
    recurso: (recurso && recurso.nombre) || (recursoId == null ? null : String(recursoId)),
    archivo: (origen && origen.archivo) || null,
    fuente: (origen && origen.fuente) || null,
    fecha: (origen && origen.fecha) || null,
  };
}

function sinRepetir(citas) {
  const vistas = new Set();
  return citas.filter((x) => {
    const llave = JSON.stringify([x.recurso, x.archivo, x.fuente, x.fecha]);
    if (vistas.has(llave)) return false;
    vistas.add(llave);
    return true;
  });
}

/**
 * De dónde sale lo que dibuja una tarjeta (un elemento de modeloTarjetas): [{ recurso, archivo,
 * fuente, fecha }], sin repetir. `recurso` es el nombre del recurso del reto (contexto.recursos).
 * Cuenta las series presentes y el contraste solo si se dibuja en esta zona.
 */
export function citasDeTarjeta(contexto, tarjeta) {
  const citas = [];
  ((tarjeta && tarjeta.paneles) || []).forEach((p) =>
    (p.series || []).forEach((s) => {
      if (s.serie) citas.push(cita(contexto, s.serie.fuente_id ?? String(s.clave).split(".")[0], s.serie));
    }),
  );
  const k = tarjeta && tarjeta.contraste;
  if (k && k.disponible) citas.push(cita(contexto, k.recurso, k));
  return sinRepetir(citas);
}

function citasDeGaez(contexto, zonaId) {
  const gaez = contexto && contexto.gaez;
  const filas = gaez ? (gaez.zonas || {})[zonaId] || [] : [];
  return filas.length ? [cita(contexto, "gaez", gaez)] : [];
}

/**
 * Fuentes completas de lo que la sección muestra en una zona, cada texto UNA sola vez:
 * [{ archivo, fuente, fecha, recursos: [nombres] }]. Varias series comparten archivo y, con él, la
 * misma línea de fuente (que puede ser larga): aquí se juntan en una entrada.
 */
export function fuentesDeSeccion(contexto, zonaId, tarjetas = modeloTarjetas(contexto, zonaId)) {
  const entradas = new Map();
  const citas = [...(tarjetas || []).flatMap((t) => citasDeTarjeta(contexto, t)), ...citasDeGaez(contexto, zonaId)];
  citas.forEach((x) => {
    if (!x.fuente) return;
    const llave = JSON.stringify([x.archivo, x.fuente, x.fecha]);
    if (!entradas.has(llave)) entradas.set(llave, { archivo: x.archivo, fuente: x.fuente, fecha: x.fecha, recursos: [] });
    const entrada = entradas.get(llave);
    if (x.recurso && !entrada.recursos.includes(x.recurso)) entrada.recursos.push(x.recurso);
  });
  return [...entradas.values()];
}

// ---------------------------------------------------------------------------
// Recursos del reto: funciones puras
// ---------------------------------------------------------------------------
function estadoDe(recurso) {
  return ESTADOS_RECURSO[recurso && recurso.estado] || ESTADO_DESCONOCIDO;
}

/** Copia de la lista ordenada: en uso, pedidas y no aplica; dentro de cada grupo, el orden del JSON. */
export function ordenarRecursos(recursos) {
  return (recursos || [])
    .map((r, i) => ({ r, i }))
    .sort((a, b) => estadoDe(a.r).orden - estadoDe(b.r).orden || a.i - b.i)
    .map((x) => x.r);
}

/** Conteos por estado, calculados de la lista: { in_use, requested, not_applicable, total }. */
export function contarEstados(recursos) {
  const cuenta = { in_use: 0, requested: 0, not_applicable: 0, total: 0 };
  (recursos || []).forEach((r) => {
    cuenta.total += 1;
    if (r && r.estado in cuenta) cuenta[r.estado] += 1;
  });
  return cuenta;
}

// ---------------------------------------------------------------------------
// Evidencia por parcela (GEDI y ECOSTRESS) y riesgo de helada (A2): funciones puras
// ---------------------------------------------------------------------------
/** Último mes con valor: { mes, valor } o null. */
export function ultimoMesConDato(meses, valores) {
  for (let i = (meses || []).length - 1; i >= 0; i -= 1) {
    const v = num((valores || [])[i]);
    if (v != null) return { mes: meses[i], valor: v };
  }
  return null;
}

/**
 * Entre qué valores leen las parcelas con disparos de la MISMA entrega de GEDI (gedi.referencia, que
 * calcula motor/contexto_web.py): la frase que deja comparar la lectura de una parcela con las demás.
 * null si la entrega no trae la referencia o si no hay al menos dos parcelas que comparar.
 */
export function referenciaGedi(contexto) {
  const r = contexto && contexto.gedi && contexto.gedi.referencia;
  if (!r) return null;
  const [n, minimo, mediana, maximo] = [r.n_parcelas, r.minimo_m, r.mediana_m, r.maximo_m].map(num);
  if (n == null || n <= 1 || minimo == null || mediana == null || maximo == null) return null;
  return `In this delivery, the ${formatoNumero(n)} fields with shots read from ${formatoNumero(minimo)} m to ${formatoNumero(maximo)} m; half of them read ${formatoNumero(mediana)} m or less.`;
}

/**
 * Los criterios de la sesión de datos para leer GEDI (gedi.criterios, copiados de supuestos.json), en
 * frases para la nota del renglón, cada una con la etiqueta de su supuesto:
 * { piso, dosel } (cada una texto o null).
 *   piso   lo que GEDI marca en parcelas sin árboles: el piso del instrumento, no la altura de la planta;
 *   dosel  qué cuenta como dosel alto (decil alto de la parcela y mínimo de disparos).
 * Los números salen del JSON; si un criterio no llegó o viene incompleto, su frase es null.
 */
export function criteriosGedi(contexto) {
  const k = (contexto && contexto.gedi && contexto.gedi.criterios) || null;
  const marca = (etiqueta) => (typeof etiqueta === "string" && etiqueta.trim() ? ` (${etiqueta.trim()})` : "");
  let piso = null;
  let dosel = null;
  const p = k && k.piso_instrumento;
  if (p) {
    const [valor, minimo, maximo] = [p.valor_m, p.min_m, p.max_m].map(num);
    if (valor != null && minimo != null && maximo != null) {
      piso = `Fields without trees read about ${formatoNumero(valor)} m (most between ${formatoNumero(minimo)} and ${formatoNumero(maximo)} m): the floor of the instrument, not plant height${marca(p.etiqueta)}.`;
    }
  }
  const d = k && k.dosel_alto;
  if (d) {
    const [umbral, minimo] = [d.umbral_m, d.min_disparos].map(num);
    if (umbral != null && minimo != null) {
      dosel = `Tall canopy means a top decile of ${formatoNumero(umbral)} m or more, from at least ${formatoNumero(minimo)} ${plural(minimo, "shot", "shots")}${marca(d.etiqueta)}.`;
    }
  }
  return { piso, dosel };
}

/**
 * Lectura de una parcela con el criterio de dosel alto de la entrega: «tall_canopy», «no_tall_canopy»,
 * «too_few_shots» (menos disparos que el mínimo del criterio), «no_shots» (la parcela no está en
 * gedi.parcelas) o null (hay bloque pero no hay criterio, o la parcela no trae su clasificación).
 * La clasificación la hace motor/contexto_web.py (parcela.dosel_alto); aquí no se compara con ningún umbral.
 */
export function lecturaDeGedi({ contexto, id } = {}) {
  const gedi = contexto && contexto.gedi;
  if (!gedi) return null;
  const p = (gedi.parcelas || {})[id];
  if (!p || num(p.altura_mediana_m) == null) return LECTURA_SIN_DISPAROS;
  const criterio = gedi.criterios && gedi.criterios.dosel_alto;
  const minimo = criterio ? num(criterio.min_disparos) : null;
  if (minimo == null) return null;
  if (p.dosel_alto === true) return "tall_canopy";
  if (p.dosel_alto === false) return "no_tall_canopy";
  return (num(p.n_disparos) ?? 0) < minimo ? "too_few_shots" : null;
}

/**
 * Índice (enero = cero) del mes de un texto «AAAA-MM»; null si no tiene esa forma.
 */
function indiceDeMes(mes) {
  const m = /^\d{4}-(\d{2})$/.exec(String(mes ?? ""));
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isInteger(n) && n >= 1 && n <= MESES_DEL_CALENDARIO ? n - 1 : null;
}

/**
 * ¿El calendario del modelo de la rotación actual (opción ACTUAL del cubo, meses_cultivo: una marca por mes, de enero
 * a diciembre) NO tiene cultivo en ese mes? true solo si el calendario trae los doce meses y el del valor está en
 * falso; sin calendario (parcela no clasificada) o con el mes con cultivo, false. No compara con ningún umbral.
 */
export function sinCultivoEnElMes(mesesCultivo, mes) {
  const i = indiceDeMes(mes);
  if (i == null || !Array.isArray(mesesCultivo) || mesesCultivo.length !== MESES_DEL_CALENDARIO) return false;
  return !mesesCultivo[i];
}

// Qué cuenta ecostress.escenas_parcelas (ecostress.conteo, que escribe motor/contexto_web.py): la entrega corregida
// del 15-nov cuenta sobrevuelos; la anterior, escenas (un sobrevuelo podía contar dos veces).
const CONTEO_SOBREVUELOS = "sobrevuelos";

/**
 * Texto del valor de ECOSTRESS de un mes, con lo que hay detrás:
 *   «2.11 mm/day in Aug 2026, from 2 clear overpasses (1.57 to 2.66)»   entrega corregida, dos o más sobrevuelos
 *   «0.9 mm/day in Jan 2026, from 1 clear overpass»                     un solo sobrevuelo: sin intervalo
 *   «2.11 mm/day in Aug 2026, from 2 clear-sky scenes»                  entrega anterior (cuenta escenas)
 * Nunca dice «median» (con una sola lectura no lo es). Sin el conteo en los datos, solo el valor y el mes.
 * `detras` = { n, conteo, minimo, maximo }: n lecturas; conteo = ecostress.conteo; minimo y maximo, el menor y el
 * mayor de los sobrevuelos (solo la entrega corregida los trae). También se acepta el número solo (n). Todas las
 * cifras salen de contexto.json.
 */
export function textoEcostress(valor, mes, detras) {
  const base = `${formatoNumero(valor)} mm/day in ${etiquetaMes(mes)}`;
  const d = detras != null && typeof detras === "object" ? detras : { n: detras };
  const n = num(d.n);
  if (n == null || n <= 0) return base;
  if (d.conteo !== CONTEO_SOBREVUELOS) return `${base}, from ${formatoNumero(n)} clear-sky ${plural(n, "scene", "scenes")}`;
  const [minimo, maximo] = [num(d.minimo), num(d.maximo)];
  // El intervalo solo tiene sentido con dos o más sobrevuelos y con sus dos extremos en los datos.
  // Si los dos extremos son iguales no hay intervalo que escribir («(2.11 to 2.11)»).
  const intervalo = n > 1 && minimo != null && maximo != null && minimo !== maximo ? ` (${formatoNumero(minimo)} to ${formatoNumero(maximo)})` : "";
  return `${base}, from ${formatoNumero(n)} clear ${plural(n, "overpass", "overpasses")}${intervalo}`;
}

/**
 * Renglones de evidencia de una parcela para la ficha; [] si GEDI y ECOSTRESS aún no llegan.
 * Cada renglón: { etiqueta, texto, nota, lectura, fuente, archivo, fecha }. «nota» (texto o null) va
 * siempre junto al valor: la de GEDI evita leer el piso del instrumento como la altura de un cultivo; la de
 * ECOSTRESS dice que es una estimación satelital y no una medición en la parcela (el rótulo de la entrega,
 * ecostress.aviso, con su resolución; si el archivo no lo trae, AVISO_ECOSTRESS, sin cifra).
 * `mesesCultivo` (opcional): el calendario del modelo de la rotación actual de la parcela (opción ACTUAL del cubo,
 * meses_cultivo). Si ese calendario no tiene cultivo en el mes del valor de ECOSTRESS, el renglón lo dice
 * (NOTA_ECOSTRESS_SIN_CULTIVO, al final de la nota): el valor es el del campo sin cultivo. No se elige otro mes.
 */
export function evidenciaDeParcela({ contexto, id, mesesCultivo } = {}) {
  const lista = [];
  const gedi = contexto && contexto.gedi;
  if (gedi) {
    const p = (gedi.parcelas || {})[id];
    const lectura = lecturaDeGedi({ contexto, id });
    let texto = "GEDI: no shots inside this field";
    let nota = NOTA_GEDI_SIN_DISPAROS;
    if (lectura !== LECTURA_SIN_DISPAROS) {
      const disparos = num(p.n_disparos) ?? 0;
      const alta = num(p.altura_p90_m);
      texto =
        (lectura ? `${LECTURAS_GEDI[lectura]}: ` : "") +
        `median ${formatoNumero(p.altura_mediana_m)} m from ${formatoNumero(disparos)} ${plural(disparos, "shot", "shots")}` +
        (alta != null ? `; top decile above ${formatoNumero(alta)} m` : "");
      const { piso, dosel } = criteriosGedi(contexto);
      // Con el piso del instrumento entregado no hace falta la referencia de la entrega: dicen lo mismo.
      nota = [NOTA_GEDI, piso ?? referenciaGedi(contexto), dosel].filter(Boolean).join(" ");
    }
    lista.push({ etiqueta: ETIQUETA_GEDI, texto, nota, lectura, fuente: gedi.fuente || null, archivo: gedi.archivo || null, fecha: gedi.fecha || null });
  }
  const eco = contexto && contexto.ecostress;
  if (eco) {
    const ultimo = ultimoMesConDato(eco.meses, (eco.parcelas || {})[id]);
    // Lo que hay detrás del valor de ese mes (listas alineadas a «meses», como los valores): cuántas lecturas
    // (escenas_parcelas), si son sobrevuelos o escenas (conteo) y, en la entrega corregida, el menor y el mayor.
    const i = ultimo ? (eco.meses || []).indexOf(ultimo.mes) : -1;
    const delMes = (lista) => (i >= 0 ? ((lista || {})[id] || [])[i] : null);
    const detras = { n: delMes(eco.escenas_parcelas), conteo: eco.conteo, minimo: delMes(eco.minimos_parcelas), maximo: delMes(eco.maximos_parcelas) };
    const sinCultivo = Boolean(ultimo) && sinCultivoEnElMes(mesesCultivo, ultimo.mes);
    const aviso = typeof eco.aviso === "string" && eco.aviso.trim() ? `${eco.aviso.trim().replace(/[.!?]+$/, "")}.` : AVISO_ECOSTRESS;
    lista.push({
      etiqueta: "Evapotranspiration (ECOSTRESS)",
      texto: ultimo ? textoEcostress(ultimo.valor, ultimo.mes, detras) : "ECOSTRESS: no clear scene over this field",
      // A la vista junto al valor, como la nota de GEDI: estimación satelital, no una medición en la parcela.
      nota: ultimo ? [aviso, sinCultivo ? NOTA_ECOSTRESS_SIN_CULTIVO : ""].filter(Boolean).join(" ") : null,
      lectura: null,
      fuente: eco.fuente || null,
      archivo: eco.archivo || null,
      fecha: eco.fecha || null,
    });
  }
  return lista;
}

/** { mes, dia } de «MM-DD», «AAAA-MM-DD», Date, [mes, día] o { mes, dia }; null si no es una fecha. */
export function mesDia(fecha) {
  let mes = null;
  let dia = null;
  if (fecha instanceof Date) {
    if (Number.isNaN(fecha.getTime())) return null;
    mes = fecha.getMonth() + 1;
    dia = fecha.getDate();
  } else if (Array.isArray(fecha)) {
    [mes, dia] = fecha;
  } else if (fecha && typeof fecha === "object") {
    mes = fecha.mes;
    dia = fecha.dia;
  } else if (typeof fecha === "string") {
    const m = /^(?:\d{4}-)?(\d{2})-(\d{2})$/.exec(fecha.trim());
    if (!m) return null;
    mes = Number(m[1]);
    dia = Number(m[2]);
  }
  if (!Number.isInteger(mes) || !Number.isInteger(dia)) return null;
  const d = new Date(Date.UTC(ANIO_DE_REFERENCIA, mes - 1, dia));
  if (d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null; // p. ej., 31 de abril
  return { mes, dia };
}

function diaDelAnio(md) {
  return Math.round((Date.UTC(ANIO_DE_REFERENCIA, md.mes - 1, md.dia) - Date.UTC(ANIO_DE_REFERENCIA, 0, 1)) / MS_POR_DIA);
}

function textoMesDia(md) {
  const DOS = 2;
  return `${String(md.mes).padStart(DOS, CERO)}-${String(md.dia).padStart(DOS, CERO)}`;
}

/**
 * Probabilidad de helada después de la fecha de siembra (kit A2). Usa la fecha calculada más cercana
 * anterior o igual. null si no hay bloque, si la siembra es anterior a la ventana calculada o si cae
 * un paso o más después de la última fecha (ahí A2 no calculó nada: p. ej., una siembra de otoño).
 */
export function riesgoDeHelada({ contexto, fechaSiembra, zonaId } = {}) {
  const bloque = contexto && contexto.heladas;
  const md = mesDia(fechaSiembra);
  // heladas.json trae la zona base arriba y las demás en «zonas»: una zona con bloque propio usa el suyo.
  const deZona = bloque && zonaId != null && bloque.zonas && bloque.zonas[zonaId];
  const tabla = bloque && (deZona || bloque).prob_helada_despues_de;
  if (!md || !tabla || typeof tabla !== "object") return null;
  const fechas = Object.keys(tabla)
    .map((k) => ({ md: mesDia(k), prob: num(tabla[k]) }))
    .filter((f) => f.md && f.prob != null)
    .map((f) => ({ ...f, dia: diaDelAnio(f.md) }))
    .sort((a, b) => a.dia - b.dia);
  if (!fechas.length) return null;
  const dia = diaDelAnio(md);
  const previas = fechas.filter((f) => f.dia <= dia);
  if (!previas.length) return null;
  const elegida = previas[previas.length - 1];
  // Entre dos fechas calculadas vale la anterior. Después de la última, la ventana se extiende un
  // paso (la separación entre las dos últimas fechas; un día si hay una sola): más allá no hay cálculo.
  const ultima = fechas[fechas.length - 1];
  const paso = fechas.length > 1 ? ultima.dia - fechas[fechas.length - 2].dia : 1;
  if (elegida === ultima && dia - ultima.dia >= paso) return null;
  return { prob: elegida.prob, fuente: (deZona && deZona.fuente) || bloque.fuente || null, fecha: textoMesDia(elegida.md) };
}

// ---------------------------------------------------------------------------
// Gráficas (SVG en texto; los valores entran escapados)
// ---------------------------------------------------------------------------
function pasoBonito(bruto) {
  const DIEZ = 10;
  const potencia = DIEZ ** Math.floor(Math.log10(bruto));
  const f = bruto / potencia;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : DIEZ) * potencia;
}

/** Eje vertical con marcas redondas: { min, max, paso, marcas, decimales } o null si no hay valores. */
export function escalaY(valores, desdeCero = false) {
  const finitos = (valores || []).filter((v) => Number.isFinite(v));
  if (!finitos.length) return null;
  let min = Math.min(...finitos);
  let max = Math.max(...finitos);
  if (desdeCero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (min === max) {
    // Todos los valores iguales: se abre un margen (sin bajar de cero cuando el eje nace en cero).
    const holgura = Math.abs(min) / 2 || 1;
    if (!desdeCero) min -= holgura;
    max += holgura;
  }
  const paso = pasoBonito((max - min) / DIVISIONES_Y);
  const base = Math.floor(min / paso + Number.EPSILON);
  const tope = Math.ceil(max / paso - Number.EPSILON);
  const marcas = [];
  for (let k = base; k <= tope; k += 1) marcas.push(k * paso);
  return { min: base * paso, max: tope * paso, paso, marcas, decimales: Math.max(0, -Math.floor(Math.log10(paso))) };
}

function geometria(modelo, ancho = ANCHO) {
  const n = modelo.x.length;
  const escala = escalaY(modelo.series.flatMap((s) => s.valores), modelo.desdeCero);
  if (!n || !escala) return null;
  const anchoPlot = ancho - MARGEN.izq - MARGEN.der;
  const altoPlot = ALTO - MARGEN.arriba - MARGEN.abajo;
  return {
    n,
    escala,
    ancho,
    derecha: ancho - MARGEN.der,
    pasoX: n > 1 ? anchoPlot / (n - 1) : 1,
    px: (i) => MARGEN.izq + (n > 1 ? (i * anchoPlot) / (n - 1) : anchoPlot / 2),
    py: (v) => MARGEN.arriba + altoPlot * (1 - (v - escala.min) / (escala.max - escala.min)),
    abajo: ALTO - MARGEN.abajo,
  };
}

function c(v) {
  return Number(v.toFixed(1));
}

/** Marcador de una serie en un punto: la forma cambia con la ranura (no solo el color). */
function marca(ranura, x, y, r = RADIO_MARCA) {
  const clase = `contexto-marca contexto-serie--${ranura}`;
  switch (RANURAS.indexOf(ranura)) {
    case 1: // cuadrado
      return `<rect class="${clase}" x="${c(x - r)}" y="${c(y - r)}" width="${c(2 * r)}" height="${c(2 * r)}"/>`;
    case 2: // triángulo
      return `<path class="${clase}" d="M${c(x)},${c(y - r)}L${c(x + r)},${c(y + r)}L${c(x - r)},${c(y + r)}Z"/>`;
    case 3: // rombo
      return `<path class="${clase}" d="M${c(x)},${c(y - r)}L${c(x + r)},${c(y)}L${c(x)},${c(y + r)}L${c(x - r)},${c(y)}Z"/>`;
    case 4: // triángulo invertido
      return `<path class="${clase}" d="M${c(x - r)},${c(y - r)}L${c(x + r)},${c(y - r)}L${c(x)},${c(y + r)}Z"/>`;
    default: // círculo
      return `<circle class="${clase}" cx="${c(x)}" cy="${c(y)}" r="${c(r)}"/>`;
  }
}

function trazo(serie, g) {
  let d = "";
  let puntos = "";
  serie.valores.forEach((v, i) => {
    if (v == null) return;
    const antes = i > 0 && serie.valores[i - 1] != null;
    const despues = i < serie.valores.length - 1 && serie.valores[i + 1] != null;
    d += `${antes ? "L" : "M"}${c(g.px(i))},${c(g.py(v))}`;
    // Un valor suelto entre dos huecos no forma línea: se dibuja como punto para que no se pierda.
    if (!antes && !despues) puntos += `<circle class="contexto-punto contexto-serie--${serie.ranura}" cx="${c(g.px(i))}" cy="${c(g.py(v))}" r="${RADIO_PUNTO}"/>`;
  });
  return `<path class="contexto-linea contexto-serie--${serie.ranura}" d="${d}"/>${puntos}`;
}

/** SVG de una gráfica de líneas con la posición elegida resaltada (línea, marcadores y rótulo). */
function svgGrafica(modelo, indiceElegido, ancho = ANCHO) {
  const g = geometria(modelo, ancho);
  if (!g) return "";
  const fmtMarca = (v) => formateador({ maximumFractionDigits: g.escala.decimales }).format(v);
  const rejilla = g.escala.marcas
    .map((m) => {
      const y = c(g.py(m));
      const clase = m === 0 ? "contexto-rejilla contexto-rejilla--cero" : "contexto-rejilla";
      return `<line class="${clase}" x1="${MARGEN.izq}" x2="${g.derecha}" y1="${y}" y2="${y}"/><text class="contexto-eje" x="${MARGEN.izq - HOLGURA_TEXTO}" y="${y}" dy="0.32em" text-anchor="end">${esc(fmtMarca(m))}</text>`;
    })
    .join("");
  const yEje = ALTO - HOLGURA_TEXTO;
  const extremos =
    `<text class="contexto-eje" x="${MARGEN.izq}" y="${yEje}" text-anchor="start">${esc(modelo.x[0].etiqueta)}</text>` +
    (g.n > 1 ? `<text class="contexto-eje" x="${g.derecha}" y="${yEje}" text-anchor="end">${esc(modelo.x[g.n - 1].etiqueta)}</text>` : "");
  let elegido = "";
  if (indiceElegido >= 0) {
    const x = c(g.px(indiceElegido));
    const ancla = x < MARGEN.izq + BORDE_TEXTO ? "start" : x > g.derecha - BORDE_TEXTO ? "end" : "middle";
    const marcas = modelo.series
      .map((s) => (s.valores[indiceElegido] == null ? "" : marca(s.ranura, g.px(indiceElegido), g.py(s.valores[indiceElegido]))))
      .join("");
    elegido =
      `<line class="contexto-elegido" x1="${x}" x2="${x}" y1="${MARGEN.arriba - HOLGURA_TEXTO}" y2="${g.abajo}"/>` +
      `<text class="contexto-elegido-texto" x="${x}" y="${MARGEN.arriba - 2 * HOLGURA_TEXTO}" text-anchor="${ancla}">${esc(modelo.x[indiceElegido].etiqueta)}</text>${marcas}`;
  }
  return `<svg class="contexto-svg" width="${g.ancho}" height="${ALTO}" viewBox="0 0 ${g.ancho} ${ALTO}" role="img" aria-label="${esc(descripcion(modelo, indiceElegido))}" focusable="false">
      ${rejilla}${extremos}
      ${modelo.series.map((s) => trazo(s, g)).join("")}
      ${elegido}
      <g class="contexto-cursor" visibility="hidden"><line x1="0" x2="0" y1="${MARGEN.arriba}" y2="${g.abajo}"/></g>
    </svg>`;
}

function textoValor(modelo, serie, i) {
  const v = i >= 0 ? serie.valores[i] : null;
  if (v != null) return conUnidad(formatoNumero(v), modelo.unidad);
  return (i >= 0 && serie.detalles && serie.detalles[i]) || TEXTO_SIN_DATO;
}

/** Descripción de la gráfica para lectores de pantalla (la tabla equivalente va debajo). */
function descripcion(modelo, i) {
  const nombres = modelo.series.map((s) => s.nombre).join(", ");
  const rango = `${modelo.x[0].etiqueta} to ${modelo.x[modelo.x.length - 1].etiqueta}`;
  const base = `Line chart of ${modelo.nombre || modelo.titulo}: ${nombres}, ${rango}.`;
  if (i < 0) return `${base} A data table follows.`;
  const valores = modelo.series.map((s) => `${s.nombre} ${textoValor(modelo, s, i)}`).join("; ");
  return `${base} ${modelo.x[i].etiqueta}: ${valores}. A data table follows.`;
}

/** Clave de una serie para la leyenda: su mismo trazo y su mismo marcador, en pequeño. */
function claveSerie(ranura) {
  const y = ALTO_CLAVE / 2;
  return `<svg class="contexto-clave" width="${ANCHO_CLAVE}" height="${ALTO_CLAVE}" viewBox="0 0 ${ANCHO_CLAVE} ${ALTO_CLAVE}" aria-hidden="true" focusable="false"><path class="contexto-linea contexto-serie--${ranura}" d="M1,${y}L${ANCHO_CLAVE - 1},${y}"/>${marca(ranura, ANCHO_CLAVE / 2, y, RADIO_CLAVE)}</svg>`;
}

/** Renglón bajo la gráfica: hace de leyenda (clave y nombre de cada serie) y da los valores de una posición. */
function htmlLectura(modelo, i, elegidoFuera) {
  const cabeza = i >= 0 ? `<strong class="contexto-lectura-x">${esc(modelo.x[i].etiqueta)}</strong>` : elegidoFuera ? `<strong class="contexto-lectura-x">${esc(elegidoFuera)}</strong>` : "";
  const partes = modelo.series
    .map((s) => {
      const motivoFuera = elegidoFuera ? (s.fuera && s.fuera[elegidoFuera]) || TEXTO_SIN_DATO : null;
      const valor = i >= 0 ? `<b>${esc(textoValor(modelo, s, i))}</b>` : elegidoFuera ? `<b>${esc(motivoFuera)}</b>` : "";
      return `<span class="contexto-lectura-serie">${claveSerie(s.ranura)}${esc(s.nombre)} ${valor}</span>`;
    })
    .join("");
  const ayuda = i < 0 && !elegidoFuera && !modelo.porAnio ? `<span class="contexto-lectura-ayuda">${esc(AYUDA_MESES)}</span>` : "";
  return `${cabeza}${partes}${ayuda}`;
}

function htmlTabla(modelo, indiceElegido) {
  const cabeceras = modelo.series.map((s) => `<th scope="col">${esc(conUnidad(s.nombre, modelo.unidad ? `(${modelo.unidad})` : ""))}</th>`).join("");
  const filas = modelo.x
    .map((p, i) => {
      const celdas = modelo.series
        .map((s) => (s.valores[i] != null ? `<td>${esc(formatoNumero(s.valores[i]))}</td>` : `<td class="contexto-celda-vacia">${esc((s.detalles && s.detalles[i]) || TEXTO_SIN_DATO)}</td>`))
        .join("");
      const elegida = i === indiceElegido;
      return `<tr data-indice="${i}"${elegida ? ' class="contexto-fila-elegida" aria-current="true"' : ""}><th scope="row">${esc(p.etiqueta)}</th>${celdas}</tr>`;
    })
    .join("");
  return `<details class="contexto-datos">
      <summary>${esc(ROTULO_TABLA)}<span class="solo-lector">: ${esc(modelo.nombre || modelo.titulo)}</span></summary>
      <div class="contexto-tabla-caja" tabindex="0" role="region" aria-label="${esc(ROTULO_TABLA)}: ${esc(modelo.nombre || modelo.titulo)}"><table class="contexto-tabla">
        <caption>${esc(conUnidad(modelo.nombre || modelo.titulo, modelo.subtitulo ? `(${modelo.subtitulo})` : ""))}</caption>
        <thead><tr><th scope="col">${esc(modelo.columnaX)}</th>${cabeceras}</tr></thead>
        <tbody>${filas}</tbody>
      </table></div>
    </details>`;
}

function htmlFigura(modelo) {
  const unidad = modelo.subtitulo ? `<span class="contexto-unidad">${esc(modelo.subtitulo)}</span>` : "";
  return `<figure class="contexto-figura" data-grafica="${esc(modelo.id)}">
      <figcaption class="contexto-figura-titulo">${esc(modelo.titulo)} ${unidad}</figcaption>
      <div class="contexto-lienzo"></div>
      <p class="contexto-lectura"></p>
      ${htmlTabla(modelo, -1)}
    </figure>`;
}

// ---------------------------------------------------------------------------
// «Regional context»
// ---------------------------------------------------------------------------
// Decimales por unidad (I8 de la revisión total): los milímetros de lluvia y ETo van sin decimales; el exacto, en el title.
const DECIMALES_UNIDAD = { mm: 0 };
function htmlCifra(rotulo, valor, unidad, pie) {
  const dec = DECIMALES_UNIDAD[unidad];
  const corto = formatoNumero(valor, dec != null ? { decimales: dec } : {});
  const cuerpo = valor != null ? `<span class="contexto-cifra-valor" title="${esc(`${formatoNumero(valor)} ${unidad}`)}">${esc(corto)} <small>${esc(unidad)}</small></span>` : `<span class="contexto-cifra-valor contexto-cifra-valor--vacio">${esc(TEXTO_SIN_DATO)}</span>`;
  return `<div class="contexto-cifra"><span class="contexto-cifra-rotulo">${esc(rotulo)}</span>${cuerpo}${pie ? `<span class="contexto-cifra-pie">${esc(pie)}</span>` : ""}</div>`;
}

function htmlCifras(contexto, zonaId, anio) {
  const a = climaDelAnio(contexto, zonaId, anio);
  if (!a) return `<p class="contexto-aviso">${esc(anio == null ? "No climate record for this pilot area." : `No climate record for agricultural year ${anio}.`)}</p>`;
  // El pie de una cifra dice su fuente; si no hay total, además por qué (días con dato del año); si hay total pero le
  // faltan días (bajo el umbral), cuántos tiene: el año no se presenta como completo.
  const incompleto = (dias) => diasIncompletos(dias, a.diasDelAnio);
  const pie = (fuente, valor, dias) =>
    valor != null ? (incompleto(dias) ? `${fuente}: ${incompleto(dias)}` : fuente) : `${fuente}: ${motivoDeDias(dias, a.diasDelAnio)}`;
  const diferencia =
    a.diferencia != null
      ? `Difference: <b>${esc(formatoNumero(a.diferencia, { signo: true, decimales: DECIMALES_UNIDAD.mm }))} mm</b> (GPM IMERG minus NASA POWER)`
      : "Difference: not computed, one of the two sources has no total for this year";
  return `<div class="contexto-cifras" role="group" aria-label="${esc(`${TITULO_CLIMA}: agricultural year ${a.anio}`)}">
      <div class="contexto-cifra contexto-cifra--par">
        <span class="contexto-cifra-rotulo">Rainfall of the year, two sources side by side</span>
        <div class="contexto-cifra-lado">
          ${htmlCifra("GPM IMERG", a.lluviaImerg, "mm", a.lluviaImerg != null ? incompleto(a.diasConDatoImerg) : motivoDeDias(a.diasConDatoImerg, a.diasDelAnio))}
          ${htmlCifra("NASA POWER", a.lluviaPower, "mm", a.lluviaPower != null ? incompleto(a.diasConDato) : motivoDeDias(a.diasConDato, a.diasDelAnio))}
        </div>
        <p class="contexto-cifra-diferencia">${diferencia}</p>
      </div>
      ${htmlCifra("Reference evapotranspiration (ETo)", a.eto, "mm", pie("NASA POWER", a.eto, a.diasConDato))}
      ${htmlCifra("Days with frost", a.diasHelada, plural(a.diasHelada, "day", "days"), pie("NASA POWER", a.diasHelada, a.diasConDato))}
    </div>`;
}

/**
 * Texto de una fuente tal como llegó (la línea de LEEME del buzón). Si el JSON dice en qué idioma
 * están esas líneas (contexto.idioma_fuentes), se marca para los lectores de pantalla.
 */
function htmlTextoFuente(contexto, texto) {
  const idioma = contexto && typeof contexto.idioma_fuentes === "string" ? contexto.idioma_fuentes : null;
  return `<span class="contexto-fuente-texto"${idioma ? ` lang="${esc(idioma)}"` : ""}>${esc(texto)}</span>`;
}

function htmlFuentesClima(contexto, zonaId) {
  const bloque = bloqueClima(contexto, zonaId);
  if (!bloque) return "";
  const fuentes = ["power", "imerg"]
    .map((k) => bloque.fuentes && bloque.fuentes[k])
    .filter(Boolean)
    .map((f) => `<li><code>${esc(f.archivo)}</code>: ${f.fuente ? htmlTextoFuente(contexto, f.fuente) : esc(TEXTO_NO_DISPONIBLE)}${f.fecha ? ` (${esc(f.fecha)})` : ""}</li>`)
    .join("");
  const umbral = num(bloque.umbral_faltantes);
  const faltantes = umbral != null ? `<li>A year missing ${esc(formateador({ style: "percent", maximumFractionDigits: 1 }).format(umbral))} of its days or more is not totaled; nothing is filled in.</li>` : "";
  return `<details class="contexto-datos contexto-definiciones">
      <summary>Definitions and sources</summary>
      <ul>
        ${bloque.definicion_anio ? `<li>${esc(bloque.definicion_anio)}</li>` : ""}
        ${bloque.definicion_helada ? `<li>${esc(bloque.definicion_helada)}</li>` : ""}
        ${faltantes}${fuentes}
      </ul>
    </details>`;
}

/**
 * Malla de un panel bajo su gráfica (metaDePanel): un renglón si las series la comparten; si no, una
 * lista con un renglón por serie, cada uno con su nombre.
 */
function htmlMetaPanel(panel) {
  const renglones = metaDePanel(panel);
  if (!renglones.length) return "";
  const partes = (r) => r.partes.map((p) => `<span>${esc(p)}</span>`).join(" ");
  if (renglones.length === 1 && renglones[0].etiqueta == null) return `<p class="contexto-meta">${partes(renglones[0])}</p>`;
  const filas = renglones
    .map((r) => `<li data-serie="${esc(r.etiqueta)}"><b class="contexto-meta-serie">${esc(r.etiqueta)}:</b> ${partes(r)}</li>`)
    .join("");
  return `<ul class="contexto-meta contexto-meta--series" aria-label="${esc(ROTULO_MALLAS)}">${filas}</ul>`;
}

/**
 * Fuente de una tarjeta, en corto: nombres de los recursos y fecha de sus archivos. El texto completo
 * de cada fuente va una sola vez, en la lista del final de la sección (htmlFuentesSeccion).
 */
function htmlFuenteCorta(citas) {
  const nombres = [...new Set(citas.map((x) => x.recurso).filter(Boolean))];
  if (!nombres.length) return "";
  const fechas = [...new Set(citas.map((x) => x.fecha).filter(Boolean))];
  const fecha = fechas.length ? ` · ${plural(fechas.length, "file date", "file dates")} ${fechas.join(", ")}` : "";
  return `<p class="contexto-meta"><span class="contexto-fuente">Source: ${esc(nombres.join(", "))}${esc(fecha)}</span></p>`;
}

/** Lista plegada con el texto completo de cada fuente de la sección, una sola vez cada uno. */
function htmlFuentesSeccion(contexto, fuentes) {
  if (!fuentes.length) return "";
  const filas = fuentes
    .map((f) => {
      const de = [f.archivo ? `<code>${esc(f.archivo)}</code>` : "", f.fecha ? `file date ${esc(f.fecha)}` : ""].filter(Boolean);
      const cabeza = [f.recursos.length ? `<b>${esc(f.recursos.join(", "))}</b>` : "", ...de].filter(Boolean).join(" · ");
      return `<li>${cabeza}: ${htmlTextoFuente(contexto, f.fuente)}</li>`;
    })
    .join("");
  return `<details class="contexto-datos contexto-definiciones contexto-fuentes">
      <summary>${esc(ROTULO_FUENTES)}</summary>
      <ul>${filas}</ul>
    </details>`;
}

function htmlPendiente(motivo, que) {
  return `<p class="contexto-pendiente"><span class="contexto-pendiente-simbolo" aria-hidden="true">${ESTADOS_RECURSO.requested.simbolo}</span> ${que ? `<span class="contexto-pendiente-que">${esc(que)}:</span> ` : ""}${esc(motivo || TEXTO_NO_DISPONIBLE)}</p>`;
}

/** El contraste es de otra zona piloto: se dice con el motivo del JSON; no se dibuja nada. */
function htmlContrasteDeOtraZona(k) {
  const donde = k.zonaNombre ? ` It was run for ${k.zonaNombre}. Series of two different areas are not drawn on the same chart.` : "";
  return `<p class="contexto-pendiente contexto-pendiente--otra-zona"><span class="contexto-pendiente-simbolo" aria-hidden="true">${ESTADOS_RECURSO.not_applicable.simbolo}</span> <span class="contexto-pendiente-que">${esc(k.titulo)}:</span> ${esc(k.motivo)}.${esc(donde)}</p>`;
}

function htmlTarjeta(t, nivel, contexto) {
  const cuerpo = t.paneles
    .map((p) => {
      if (!p.disponible) return htmlPendiente(p.motivo, p.titulo);
      const faltan = p.series.filter((s) => !s.serie);
      return `${htmlFigura(p.grafica)}${htmlMetaPanel(p)}${faltan.map((s) => htmlPendiente(s.motivo, s.etiqueta)).join("")}`;
    })
    .join("");
  let contraste = "";
  if (t.contraste && !t.contraste.disponible) {
    contraste = htmlContrasteDeOtraZona(t.contraste);
  } else if (t.contraste) {
    const k = t.contraste;
    const sinDato = k.sinDato.length ? `<p class="contexto-meta"><span>Not drawn, no data: ${esc(k.sinDato.join(", "))}</span></p>` : "";
    const nota = k.nota ? `<p class="contexto-meta"><span>${esc(k.nota)}</span></p>` : "";
    contraste = `${htmlFigura(k)}${sinDato}${nota}`;
  }
  const clase = t.disponible ? "contexto-tarjeta" : "contexto-tarjeta contexto-tarjeta--pendiente";
  return `<article class="${clase}" data-tarjeta="${esc(t.id)}">
      <h${nivel} class="contexto-tarjeta-titulo">${esc(t.titulo)}</h${nivel}>
      ${htmlAdvertencias(t.advertencias)}
      ${cuerpo}${contraste}
      ${htmlFuenteCorta(citasDeTarjeta(contexto, t))}
      ${t.nota ? `<p class="contexto-tarjeta-nota">${esc(t.nota)}</p>` : ""}
    </article>`;
}

/** Advertencias de la sesión de datos, a la vista (símbolo y texto; nada depende solo del color). */
function htmlAdvertencias(advertencias) {
  if (!advertencias || !advertencias.length) return "";
  const items = advertencias
    .map((a) => `<li class="contexto-advertencia" data-advertencia="${esc(a.id || "")}"><span class="contexto-advertencia-simbolo" aria-hidden="true">!</span> ${esc(a.texto)}</li>`)
    .join("");
  return `<ul class="contexto-advertencias" aria-label="${esc(ROTULO_ADVERTENCIAS)}">${items}</ul>`;
}

function nombreCultivo(id, nombres) {
  return (nombres && nombres[id]) || String(id ?? "").replace(/_/g, " ");
}

// GAEZ (gaez_zona.csv, pieza G1 de la sesión de datos): «unidad» es la cadena que publica FAO, sin cambios. Una unidad
// que empieza con un factor («10kg DW/ha») cuenta en múltiplos de ese factor; «DW» es materia seca (dry weight).
const UNIDAD_CON_FACTOR = /^(\d+(?:[.,]\d+)?)\s*(\S.*)$/;
const MARCA_DW = /\bDW\b/;
const NOTA_DW = "DW: dry weight.";

/** Valor de una fila de GAEZ como se lee: la fila de clase dice el nombre de la clase de FAO (clase_nombre), no su
 *  número; una unidad con factor lo escribe aparte («1,678.5 × 10 kg DW/ha»); lo demás, número y unidad. */
export function valorGaez(fila) {
  const f = fila || {};
  const clase = String(f.clase_nombre ?? "").trim();
  if (clase) return clase;
  const texto = formatoNumero(f.valor);
  const unidad = String(f.unidad ?? "").trim();
  const conFactor = unidad.match(UNIDAD_CON_FACTOR);
  if (!conFactor) return conUnidad(texto, unidad);
  const [, factor, resto] = conFactor;
  return `${texto} × ${factor} ${resto}`;
}

/** Cultivo de una fila de GAEZ: el nombre del proyecto y, si GAEZ evalúa la clase con otro cultivo (cultivo_gaez:
 *  Maize para el maíz forrajero, Oat para el cereal de invierno), ese nombre aparte; null si es el mismo. */
export function cultivoDeGaez(fila, nombres) {
  const nombre = nombreCultivo(fila && fila.cultivo, nombres);
  const gaez = String((fila && fila.cultivo_gaez) || "").trim();
  return { nombre, gaez: gaez && gaez.toLowerCase() !== nombre.toLowerCase() ? gaez : null };
}

/** Notas de la tarjeta de GAEZ: las de la entrega, una vez cada una (p. ej., el maíz de GAEZ es de grano), y qué es
 *  «DW» si alguna unidad lo trae. */
export function notasDeGaez(filas) {
  const lista = Array.isArray(filas) ? filas : [];
  const notas = [...new Set(lista.map((f) => String((f && f.nota) || "").trim()).filter(Boolean))];
  if (lista.some((f) => MARCA_DW.test(String((f && f.unidad) || "")))) notas.push(NOTA_DW);
  return notas;
}

function htmlTarjetaGaez(contexto, zonaId, nivel, nombres) {
  const titulo = "Agro-climatic suitability by crop";
  const cabeza = `<h${nivel} class="contexto-tarjeta-titulo">${titulo}</h${nivel}>`;
  const nota = `<p class="contexto-tarjeta-nota">Regional evidence from GAEZ (FAO): suitability of the area for a crop, not of a single field.</p>`;
  const gaez = contexto.gaez;
  const filas = gaez ? (gaez.zonas || {})[zonaId] || [] : [];
  if (!gaez || !filas.length) {
    const motivo = !gaez ? contexto.gaez_motivo : "The delivered file has no rows for this pilot area";
    return `<article class="contexto-tarjeta contexto-tarjeta--pendiente" data-tarjeta="gaez">${cabeza}${htmlPendiente(motivo, "GAEZ (FAO)")}${nota}</article>`;
  }
  // La escala se escribe una vez si todas las filas comparten resolución; si no, junto a cada valor.
  const resoluciones = [...new Set(filas.map((f) => formatoResolucion(f.resolucion_m)).filter(Boolean))];
  const unaEscala = resoluciones.length === 1 && filas.every((f) => formatoResolucion(f.resolucion_m));
  const cuerpo = filas
    .map((f) => {
      const resolucion = formatoResolucion(f.resolucion_m);
      const escala = !unaEscala && resolucion ? ` <span class="contexto-equivalente">${esc(resolucion)} grid</span>` : "";
      const cultivo = cultivoDeGaez(f, nombres);
      const comoGaez = cultivo.gaez ? ` <span class="contexto-equivalente">GAEZ: ${esc(cultivo.gaez)}</span>` : "";
      return `<tr><th scope="row">${esc(cultivo.nombre)}${comoGaez}</th><td>${esc(f.variable)}</td><td>${esc(valorGaez(f))}${escala}</td></tr>`;
    })
    .join("");
  const escalaComun = unaEscala ? `<p class="contexto-meta"><span>Regional, ${esc(resoluciones[0])} grid</span></p>` : "";
  const fuente = htmlFuenteCorta(citasDeGaez(contexto, zonaId));
  const notasEntrega = notasDeGaez(filas).map((n) => `<p class="contexto-tarjeta-nota">${esc(n)}</p>`).join("");
  return `<article class="contexto-tarjeta" data-tarjeta="gaez">${cabeza}
      <table class="contexto-tabla contexto-tabla--gaez">
        <caption class="solo-lector">${titulo}</caption>
        <thead><tr><th scope="col">Crop</th><th scope="col">Indicator</th><th scope="col">Value</th></tr></thead>
        <tbody>${cuerpo}</tbody>
      </table>
      ${escalaComun}${fuente}${notasEntrega}${nota}
    </article>`;
}

/** Ancho en píxeles al que se dibuja la gráfica de un lienzo. */
function anchoDe(lienzo) {
  const ancho = Math.floor((lienzo && lienzo.clientWidth) || 0) || ANCHO;
  return Math.max(ANCHO_MIN, Math.min(ANCHO_MAX, ancho));
}

function nivelValido(nivel) {
  const n = num(nivel);
  const MINIMO = 2;
  const MAXIMO = 5;
  return n != null && Number.isInteger(n) && n >= MINIMO && n <= MAXIMO ? n : NIVEL_POR_OMISION;
}

export function montarContextoRegional(contenedor, opciones = {}) {
  if (!contenedor || typeof document === "undefined") return null;
  asegurarHoja();
  const id = `contexto-${++contador}`;
  const nivel = nivelValido(opciones.nivel);
  const estado = {
    contexto: opciones.contexto || null,
    zonaId: opciones.zonaId ?? null,
    anio: num(opciones.anio),
    anioDado: num(opciones.anio) != null,
  };
  const raiz = document.createElement("section");
  raiz.className = "contexto";
  raiz.setAttribute("aria-labelledby", `${id}-titulo`);
  contenedor.replaceChildren(raiz);
  let graficas = new Map(); // id de la gráfica → modelo

  const zonaConocida = () =>
    Boolean(estado.contexto) &&
    ["zonas", "clima_anual", "contexto_regional"].some((b) => estado.contexto[b] && estado.contexto[b][estado.zonaId]);
  const nombreZona = () => ((estado.contexto.zonas || {})[estado.zonaId] || {}).nombre || estado.zonaId;
  const indiceElegido = (modelo) => (modelo.porAnio ? modelo.x.findIndex((p) => p.clave === estado.anio) : -1);

  function pintarFigura(figura, modelo) {
    const i = indiceElegido(modelo);
    const lienzo = figura.querySelector(".contexto-lienzo");
    const ancho = anchoDe(lienzo);
    figura.dataset.ancho = String(ancho);
    lienzo.innerHTML = svgGrafica(modelo, i, ancho);
    const fuera = modelo.porAnio && i < 0 && estado.anio != null ? String(estado.anio) : null;
    figura.querySelector(".contexto-lectura").innerHTML = htmlLectura(modelo, i, fuera);
    figura.querySelectorAll("tbody tr").forEach((fila) => {
      const elegida = Number(fila.dataset.indice) === i;
      fila.classList.toggle("contexto-fila-elegida", elegida);
      if (elegida) fila.setAttribute("aria-current", "true");
      else fila.removeAttribute("aria-current");
    });
  }

  /** Lo que depende del año: el renglón de zona y año, las cifras y el resaltado de cada gráfica. */
  function pintarAnio() {
    const linea = raiz.querySelector(".contexto-donde");
    if (linea) {
      linea.textContent = estado.anio != null ? `${nombreZona()} · agricultural year ${estado.anio}` : nombreZona();
    }
    const cifras = raiz.querySelector(".contexto-clima-cifras");
    if (cifras) cifras.innerHTML = htmlCifras(estado.contexto, estado.zonaId, estado.anio);
    raiz.querySelectorAll(".contexto-figura").forEach((figura) => {
      const modelo = graficas.get(figura.dataset.grafica);
      if (modelo) pintarFigura(figura, modelo);
    });
  }

  function dejarDeExplorar(figura) {
    figura.classList.remove("contexto-figura--explorando");
    const modelo = graficas.get(figura.dataset.grafica);
    if (modelo) pintarFigura(figura, modelo);
  }

  /**
   * Lectura de la posición bajo el puntero o el dedo. Con ratón, al salir vuelve al año elegido; con
   * el dedo se queda hasta tocar fuera de la gráfica (si no, desaparecería al levantar el dedo).
   */
  function alMover(ev) {
    const lienzo = ev.target.closest ? ev.target.closest(".contexto-lienzo") : null;
    if (ev.type === "pointerdown") {
      raiz.querySelectorAll(".contexto-figura--explorando").forEach((f) => {
        if (!lienzo || !f.contains(lienzo)) dejarDeExplorar(f);
      });
    }
    if (!lienzo || !raiz.contains(lienzo)) return;
    const figura = lienzo.closest(".contexto-figura");
    const modelo = graficas.get(figura.dataset.grafica);
    const svg = lienzo.querySelector("svg");
    const g = modelo && geometria(modelo, Number(figura.dataset.ancho) || ANCHO);
    if (!svg || !g) return;
    const caja = svg.getBoundingClientRect();
    if (!caja.width) return;
    const xv = ((ev.clientX - caja.left) / caja.width) * g.ancho;
    const i = Math.max(0, Math.min(g.n - 1, Math.round((xv - MARGEN.izq) / g.pasoX)));
    const cursor = svg.querySelector(".contexto-cursor");
    cursor.setAttribute("transform", `translate(${c(g.px(i))})`);
    cursor.setAttribute("visibility", "visible");
    figura.querySelector(".contexto-lectura").innerHTML = htmlLectura(modelo, i, null);
    figura.classList.add("contexto-figura--explorando");
  }
  function alSalir(ev) {
    if (ev.pointerType === "touch") return;
    const figura = ev.target.closest ? ev.target.closest(".contexto-figura") : null;
    if (!figura || !figura.classList.contains("contexto-figura--explorando")) return;
    if (ev.relatedTarget && figura.querySelector(".contexto-lienzo").contains(ev.relatedTarget)) return;
    dejarDeExplorar(figura);
  }
  raiz.addEventListener("pointermove", alMover);
  raiz.addEventListener("pointerdown", alMover);
  raiz.addEventListener("pointerout", alSalir);

  // Si el lienzo cambia de ancho (ventana, panel, hoja de estilos que termina de cargar), la gráfica
  // se vuelve a dibujar a ese ancho.
  const observador =
    typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver((entradas) => {
          entradas.forEach((e) => {
            const figura = e.target.closest(".contexto-figura");
            const modelo = figura && graficas.get(figura.dataset.grafica);
            if (modelo && anchoDe(e.target) !== Number(figura.dataset.ancho)) pintarFigura(figura, modelo);
          });
        });

  /** Dibuja la sección entera (al montar y al cambiar de zona). */
  function pintarTodo() {
    graficas = new Map();
    if (observador) observador.disconnect();
    const cabeza = `<h${nivel} class="contexto-titulo" id="${id}-titulo">${TITULO_CONTEXTO}</h${nivel}>`;
    if (!estado.contexto) {
      raiz.innerHTML = `${cabeza}<p class="contexto-aviso">${esc(TEXTO_SIN_CONTEXTO)}</p>`;
      return;
    }
    if (!zonaConocida()) {
      raiz.innerHTML = `${cabeza}<p class="contexto-aviso">${esc(TEXTO_ELIJA_ZONA)}</p><p class="contexto-nota">${esc(NOTA_REGIONAL)}</p>`;
      return;
    }
    if (!estado.anioDado) estado.anio = anioPorOmision(estado.contexto, estado.zonaId);
    const sub = nivel + 1;
    const clima = graficasDeClima(estado.contexto, estado.zonaId);
    const tarjetas = modeloTarjetas(estado.contexto, estado.zonaId);
    clima.forEach((m) => graficas.set(m.id, m));
    tarjetas.forEach((t) => {
      t.paneles.forEach((p) => p.grafica && graficas.set(p.grafica.id, p.grafica));
      if (t.contraste && t.contraste.disponible) graficas.set(t.contraste.id, t.contraste);
    });
    const bloqueDeClima = clima.length
      ? `<div class="contexto-clima-cifras"></div>
         <div class="contexto-rejilla-figuras">${clima.map(htmlFigura).join("")}</div>
         ${htmlFuentesClima(estado.contexto, estado.zonaId)}`
      : htmlPendiente(estado.contexto.clima_anual_motivo, null);
    raiz.innerHTML = `${cabeza}
      <p class="contexto-donde"></p>
      <section class="contexto-clima" aria-labelledby="${id}-clima">
        <h${sub} class="contexto-subtitulo" id="${id}-clima">${TITULO_CLIMA}</h${sub}>
        ${bloqueDeClima}
      </section>
      <div class="contexto-tarjetas">
        ${tarjetas.map((t) => htmlTarjeta(t, sub, estado.contexto)).join("")}
        ${htmlTarjetaGaez(estado.contexto, estado.zonaId, sub, opciones.nombresCultivo)}
      </div>
      ${htmlFuentesSeccion(estado.contexto, fuentesDeSeccion(estado.contexto, estado.zonaId, tarjetas))}
      <p class="contexto-nota">${esc(NOTA_REGIONAL)}</p>`;
    pintarAnio();
    if (observador) raiz.querySelectorAll(".contexto-lienzo").forEach((l) => observador.observe(l));
  }

  pintarTodo();
  return {
    elemento: raiz,
    fijarAnio(a) {
      estado.anio = num(a);
      estado.anioDado = estado.anio != null;
      if (zonaConocida()) {
        if (!estado.anioDado) estado.anio = anioPorOmision(estado.contexto, estado.zonaId);
        pintarAnio();
      }
    },
    fijarZona(z) {
      estado.zonaId = z ?? null;
      pintarTodo();
    },
    destruir() {
      if (observador) observador.disconnect();
      raiz.removeEventListener("pointermove", alMover);
      raiz.removeEventListener("pointerdown", alMover);
      raiz.removeEventListener("pointerout", alSalir);
      raiz.remove();
    },
  };
}

// ---------------------------------------------------------------------------
// «Challenge data sources»
// ---------------------------------------------------------------------------
function insignia(recurso) {
  const e = estadoDe(recurso);
  const clase = String((recurso && recurso.estado) || "desconocido").replace(/_/g, "-");
  return `<span class="contexto-estado contexto-estado--${esc(clase)}"><span class="contexto-estado-simbolo" aria-hidden="true">${e.simbolo}</span> ${esc(e.texto)}</span>`;
}

function htmlArchivos(r) {
  const presentes = (r.entregas_presentes || []).map((a) => `<li><code>${esc(a)}</code></li>`).join("");
  const rotulo = r.estado === "in_use" ? "missing" : "expected";
  const faltantes = (r.entregas_faltantes || []).map((a) => `<li class="contexto-archivo-falta"><code>${esc(a)}</code> <span>(${rotulo})</span></li>`).join("");
  if (!presentes && !faltantes) return "—";
  return `<ul class="contexto-archivos">${presentes}${faltantes}</ul>${r.fecha ? `<span class="contexto-archivos-fecha">File date: ${esc(r.fecha)}</span>` : ""}`;
}

function htmlPapel(r, motivoComun) {
  if (r.estado === "not_applicable") {
    return `${esc(r.motivo || TEXTO_NO_DISPONIBLE)}.${r.equivalente_local ? ` <span class="contexto-equivalente">Local equivalent: ${esc(r.equivalente_local)}.</span>` : ""}`;
  }
  // El motivo de un pedido se escribe solo si dice algo más que el estado (p. ej., «el archivo llegó
  // sin filas de esta fuente»); el motivo común ya lo dice la insignia.
  const detalle = r.estado === "requested" && r.motivo && r.motivo !== motivoComun;
  return `${esc(r.papel || "—")}${detalle ? ` <span class="contexto-equivalente">${esc(r.motivo)}.</span>` : ""}`;
}

function htmlResumenRecursos(cuenta) {
  const partes = ["in_use", "requested", "not_applicable"].map(
    (k) => `<span class="contexto-estado contexto-estado--${k.replace(/_/g, "-")}"><span class="contexto-estado-simbolo" aria-hidden="true">${ESTADOS_RECURSO[k].simbolo}</span> <b>${esc(formatoNumero(cuenta[k]))}</b> ${esc(ESTADOS_RECURSO[k].texto.toLowerCase())}</span>`,
  );
  return `<p class="contexto-recursos-resumen"><span>${esc(formatoNumero(cuenta.total))} ${plural(cuenta.total, "entry", "entries")} from the challenge resource list:</span> ${partes.join(" ")}</p>`;
}

export function montarRecursosReto(contenedor, opciones = {}) {
  if (!contenedor || typeof document === "undefined") return null;
  asegurarHoja();
  const id = `contexto-recursos-${++contador}`;
  const nivel = nivelValido(opciones.nivel);
  const contexto = opciones.contexto || null;
  const raiz = document.createElement("section");
  raiz.className = "contexto-recursos";
  raiz.setAttribute("aria-labelledby", `${id}-titulo`);
  const cabeza = `<h${nivel} class="contexto-titulo" id="${id}-titulo">${TITULO_RECURSOS}</h${nivel}>`;
  const recursos = contexto && Array.isArray(contexto.recursos) ? contexto.recursos : null;
  if (!recursos || !recursos.length) {
    raiz.innerHTML = `${cabeza}<p class="contexto-aviso">Challenge data sources: not available yet.</p>`;
  } else {
    const filas = ordenarRecursos(recursos)
      .map(
        (r) => `<tr data-recurso="${esc(r.id)}" data-estado="${esc(r.estado)}">
          <th scope="row">${esc(r.nombre)}</th>
          <td data-rotulo="Agency">${esc(r.organismo || "—")}</td>
          <td data-rotulo="Role in ROOT">${htmlPapel(r, contexto.motivo_pedido)}</td>
          <td data-rotulo="Status">${insignia(r)}</td>
          <td data-rotulo="Files">${htmlArchivos(r)}</td>
        </tr>`,
      )
      .join("");
    raiz.innerHTML = `${cabeza}
      ${htmlResumenRecursos(contarEstados(recursos))}
      <p class="contexto-recursos-nota">The status is computed from the files that passed validation, not written by hand. The water need of each field comes from NASA POWER, with the crop map from HLS; NASADEM and GPM IMERG drive the terrain and the storm simulation. The other sources are context, contrast or evidence: they do not change the water calculation of a field.</p>
      <div class="contexto-tabla-caja"><table class="contexto-tabla contexto-tabla--recursos">
        <caption class="solo-lector">${TITULO_RECURSOS}: resource, agency, role in ROOT, status and files</caption>
        <thead><tr><th scope="col">Resource</th><th scope="col">Agency</th><th scope="col">Role in ROOT</th><th scope="col">Status</th><th scope="col">Files</th></tr></thead>
        <tbody>${filas}</tbody>
      </table></div>`;
  }
  contenedor.replaceChildren(raiz);
  return {
    elemento: raiz,
    destruir() {
      raiz.remove();
    },
  };
}
