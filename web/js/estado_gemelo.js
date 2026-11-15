// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/estado_gemelo.js — Tarjeta «Twin status» del gemelo digital: separa lo OBSERVADO, lo MODELADO y lo
// que es ESCENARIO de quien usa la página, con la fecha de cada fuente
// (docs/decisiones/2026-11-14_gemelo_digital.md, «Qué cambia en el producto», punto 3).
// Módulo ES independiente, sin dependencias. Estilos: web/css/resumen.css (montarEstadoGemelo la inserta
// si la página aún no la enlaza).
//
// QUÉ EXPORTA (lo conecta app.js; este archivo no toca el mapa, los controles ni la ficha):
//
//   montarEstadoGemelo(contenedor, { manifest, cubo, gemelo, zonaId, nivel, escenario }) -> controlador | null
//       Dibuja la tarjeta y reemplaza el contenido del contenedor. Cualquiera de los tres archivos puede
//       faltar (null): la parte que depende de él lo dice y el resto se dibuja.
//         manifest   contenido de web/data/manifest.json. Se usa fuentes_de_origen[]: archivo, fuente,
//                    fecha (o fecha_consulta si falta) y zona. Sin manifest: «Sources: not available».
//         cubo       contenido de web/data/cubo.json. Se usan meta.generado («Last rebuilt»), meta.mock y
//                    zonas[id].{nombre_mostrar, conteos.total, conteos.abstenida} («Fields mirrored»:
//                    clasificadas = total − abstenida). Un cubo de una sola zona (cubo.zona) también sirve.
//         gemelo     contenido de web/data/gemelo.json; opcional. Agrega a «Greenness history» los años
//                    agrícolas (tiempo.anios) y los meses del NDVI (ndvi.meses), y a «Terrain» el rótulo
//                    de escala (terreno.rotulo).
//         zonaId     zona que está viendo la persona (llave de cubo.zonas). Con una zona conocida: se
//                    marca «in view» y de las fuentes se muestran las de esa zona y las comunes. Con
//                    null, «todas» o un id desconocido: todas las zonas y todas las fuentes.
//         nivel      opcional: nivel del encabezado «Twin status» (por omisión, el de un bloque del panel).
//         escenario  opcional: igual que fijarEscenario.
//       controlador:
//         elemento                       el nodo <section class="estado-gemelo"> de la tarjeta
//         fijarZona(zonaId)              cambia la zona (conserva abiertos los «Source files» abiertos)
//         fijarEscenario({ dotacion, lluvia, tormenta })
//                                        valor ACTUAL de lo que la persona mueve, como TEXTO ya formateado
//                                        por la app (p. ej. el mismo texto del deslizador). Opcional: sin
//                                        él, el grupo «Your scenario» describe los tres controles sin valor.
//                                        null o "" quita un valor. No redibuja el resto.
//         fijarDatos({ manifest, cubo, gemelo })
//                                        cambia lo que reciba (p. ej. manifest.json llegó después) y redibuja
//         destruir()                     retira la tarjeta; el controlador queda inerte
//   modeloEstado({ manifest, cubo, gemelo, zonaId }) -> objeto
//       Función pura (la misma que usa la tarjeta; para pruebas con Node):
//         { reconstruido, simulado, fuentesDisponibles, zonas: [{ id, nombre, total, clasificadas, enVista }],
//           total: { total, clasificadas } | null,
//           grupos: [{ clave, titulo, nota, filas: [{ clave, etiqueta, fuente, detalles, fechas, archivos }] }] }
//   NOTA_GEMELO: la nota fija de la tarjeta.
//
// QUÉ DIBUJA (todo con el prefijo «estado-gemelo»):
//   · «Twin status» y «Last rebuilt» (cubo.meta.generado con Intl.DateTimeFormat, en la hora de quien mira);
//   · «Fields mirrored»: por zona, parcelas del gemelo y cuántas están clasificadas (con una barra de la
//     parte clasificada, que repite el texto y no lo sustituye);
//   · tres grupos, cada uno con su símbolo, su título y su explicación (nada depende solo del color):
//       «Observed»       field boundaries · greenness history · terrain · climate · rain
//       «Modeled»        water need (FAO Penman–Monteith with NASA POWER) · runoff paths (NASADEM)
//       «Your scenario»  allocation · rain · storm (lo que la persona mueve; sin fecha: no es un dato)
//     Cada renglón de «Observed» y «Modeled» agrupa los archivos de manifest.fuentes_de_origen de ese tipo
//     (por el nombre del archivo), dice su fecha (la más antigua y la más reciente si difieren) y abre
//     «Source files» con cada archivo, su fecha y su fuente TAL COMO se registró (en español).
//   · la nota fija: «Updated on each rebuild from satellite and climate data; no in-field sensors. It does
//     not forecast the dam.»
//   Ganchos para las pruebas con navegador: la raíz lleva data-zona (zona en vista o "") y data-fuentes
//   ("si" | "no"); cada grupo, data-grupo ("observado" | "modelado" | "escenario"); cada renglón, data-fila
//   (verdor, terreno, clima, precipitacion · limites, agua, rutas · dotacion, lluvia, tormenta); cada zona,
//   data-zona y aria-current="true" si está en vista; el valor de un control del escenario, data-valor.
//
// DECISIONES DE ESTE ARCHIVO (para quien lo integre o lo revise):
//   1. Ninguna cifra escrita a mano: conteos, fechas, años, meses y rótulos salen de manifest.json,
//      cubo.json y gemelo.json. El código no trae números de los datos.
//   2. El nombre corto de la fuente de un renglón observado NO se escribe aquí: se reconoce en la fuente
//      registrada (CONJUNTOS). Si la fuente cambia, el renglón cambia; si no se reconoce, no se afirma
//      ninguna y queda la fuente registrada dentro de «Source files».
//   3. El método de los renglones modelados sí es texto fijo: describe el modelo de ROOT (decisión del
//      gemelo, tabla «Modelo físico»), no un dato.
//   4. Un renglón sin archivo en el manifest lo dice («no source file registered»); nunca una fecha supuesta.
//   5. Sin colores en el JS: viven en css/resumen.css. Todo texto de los datos se escapa antes de insertarse.
//   6. Interfaz en inglés; comentarios en español. La tarjeta describe; no reparte agua, no pronostica la
//      presa y no promete ahorros.

const LOCALE = "en-US";
const HOJA = "../css/resumen.css"; // relativa a este módulo
const NIVEL_POR_OMISION = 2;

// ---------------------------------------------------------------------------
// Textos de la interfaz (sin números)
// ---------------------------------------------------------------------------
const TITULO = "Twin status";
export const NOTA_GEMELO =
  "Updated on each rebuild from satellite and climate data; no in-field sensors. It does not forecast the dam.";
const TEXTO_RECONSTRUIDO = "Last rebuilt";
const TEXTO_ESPEJO = "Fields mirrored";
const TEXTO_NO_DISPONIBLE = "not available";
const TEXTO_SIN_FUENTES = "Sources: not available";
const DETALLE_SIN_FUENTES = "The list of source files (manifest.json) was not loaded, so source dates are not shown.";
const TEXTO_SIN_ARCHIVO = "no source file registered";
// La fecha del manifest es la de consulta de la entrega (kit v4), no la de las observaciones: se dice así.
const TEXTO_FECHA = "Data retrieved";
const TEXTO_ARCHIVOS = "Source files";
const TEXTO_EN_VISTA = "in view";
const TEXTO_TODAS = "All pilot areas";
const TEXTO_SIMULADO = "Simulated data: this build uses placeholder values, not real fields or measurements.";
const TEXTO_AHORA = "Now";

// Renglones de cada grupo. «archivos» reconoce por su nombre los archivos de manifest.fuentes_de_origen
// que pertenecen al renglón (tipo de archivo, con o sin sufijo de zona).
const GRUPOS = [
  {
    clave: "observado",
    titulo: "Observed",
    simbolo: "◉",
    nota: "Read from satellite and climate data.",
    filas: [
      { clave: "verdor", etiqueta: "Greenness history", archivos: /^(hls_mensual|memoria_|suelo_desnudo)/ },
      { clave: "terreno", etiqueta: "Terrain", archivos: /^nasadem/ },
      { clave: "clima", etiqueta: "Climate", archivos: /^(eto_diaria|heladas)/ },
      { clave: "precipitacion", etiqueta: "Rain", archivos: /^imerg/ }, // «lluvia» es la llave del escenario
    ],
  },
  {
    clave: "modelado",
    titulo: "Modeled",
    simbolo: "ƒ",
    nota: "Computed from the observed data with a stated method.",
    filas: [
      // Los límites son predicciones de una red neuronal sobre imágenes de satélite (fuera de su dominio de
      // entrenamiento), no un levantamiento: van con lo modelado, no con lo observado.
      { clave: "limites", etiqueta: "Field boundaries", metodo: "Fields of The World: neural-network predictions from satellite images, not surveyed", archivos: /^parcelas_base/ },
      { clave: "agua", etiqueta: "Water need", metodo: "FAO Penman–Monteith with NASA POWER", archivos: /^(demanda_cultivos|rotaciones)/ },
      { clave: "rutas", etiqueta: "Runoff paths", metodo: "NASADEM", archivos: /^relieve_/ },
    ],
  },
  {
    clave: "escenario",
    titulo: "Your scenario",
    simbolo: "⇄",
    nota: "What you set on this page to try a decision before planting. Not a measurement.",
    filas: [
      { clave: "dotacion", etiqueta: "Allocation", descripcion: "The water allocation you set with the slider." },
      { clave: "lluvia", etiqueta: "Rain", descripcion: "Normal rain or a drier season, as you choose." },
      { clave: "tormenta", etiqueta: "Storm", descripcion: "“Simulate a storm” on the terrain layer, when you run it." },
    ],
  },
];
const CLAVES_ESCENARIO = GRUPOS.find((g) => g.clave === "escenario").filas.map((f) => f.clave);

// Conjuntos de datos que se reconocen en la fuente registrada (decisión 2). El primero que aparece en
// el texto es la fuente principal del archivo.
const CONJUNTOS = [
  { nombre: "Fields of The World", patron: /Fields of The World/i },
  { nombre: "NASA HLS", patron: /\bHLS\b/ },
  { nombre: "NASADEM", patron: /\bNASADEM/ },
  { nombre: "NASA POWER", patron: /\bPOWER\b/ },
  { nombre: "GPM IMERG", patron: /\bIMERG\b/ },
];

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const esNumero = (v) => typeof v === "number" && Number.isFinite(v);
const esObjeto = (v) => v != null && typeof v === "object" && !Array.isArray(v);

const formatoEntero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const entero = (n) => formatoEntero.format(n);
const plural = (n, uno, varios) => (n === 1 ? uno : varios);

// Fechas. Un día («AAAA-MM-DD») no tiene hora: se formatea en UTC para que no se corra un día.
const FORMA_DIA = /^(\d+)-(\d+)-(\d+)$/;
const FORMA_MES = /^(\d+)-(\d+)$/;
const formatoDia = new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: "UTC" });
const formatoMes = new Intl.DateTimeFormat(LOCALE, { month: "short", year: "numeric", timeZone: "UTC" });
// «Last rebuilt» es un instante: se dice en la hora de quien mira, con su zona horaria.
const formatoInstante = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "numeric", timeZoneName: "short",
});

/** «2026-11-14» -> { iso, texto }; null si no es una fecha. */
function dia(texto) {
  const iso = String(texto ?? "").trim();
  const m = FORMA_DIA.exec(iso);
  if (!m) return null;
  const fecha = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return Number.isNaN(fecha.getTime()) ? null : { iso, texto: formatoDia.format(fecha) };
}

/** Instante ISO («2026-11-14T21:33:59+00:00») -> { iso, texto }; null si no se puede leer. */
function instante(texto) {
  const iso = String(texto ?? "").trim();
  if (!iso) return null;
  const fecha = new Date(iso);
  return Number.isNaN(fecha.getTime()) ? null : { iso, texto: formatoInstante.format(fecha) };
}

/** «2025-10» -> «Oct 2025»; si no tiene esa forma, tal cual. */
function mesCorto(texto) {
  const m = FORMA_MES.exec(String(texto ?? "").trim());
  if (!m) return String(texto);
  const fecha = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, 1));
  return Number.isNaN(fecha.getTime()) ? String(texto) : formatoMes.format(fecha);
}

/** Inserta css/resumen.css (relativa a este módulo) si la página aún no la enlaza. */
function asegurarHoja() {
  if (typeof document === "undefined") return;
  const yaEsta = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) =>
    (l.getAttribute("href") || "").endsWith("resumen.css"),
  );
  if (yaEsta) return;
  const enlace = document.createElement("link");
  enlace.rel = "stylesheet";
  enlace.href = new URL(HOJA, import.meta.url).href;
  document.head.appendChild(enlace);
}

let consecutivo = 0;
function idNuevo() {
  consecutivo += 1;
  return `estado-gemelo-${consecutivo}`;
}

// ---------------------------------------------------------------------------
// Modelo (funciones puras)
// ---------------------------------------------------------------------------
function zonasDelCubo(cubo) {
  if (esObjeto(cubo?.zonas) && Object.keys(cubo.zonas).length) return cubo.zonas;
  // Cubo de una sola zona (contrato v4 sin «zonas»): se muestra esa.
  if (esObjeto(cubo?.zona)) return { [cubo.zona.nombre ?? "zona"]: cubo.zona };
  return {};
}

function nombreZona(zonas, id) {
  const z = zonas[id];
  return String(z?.nombre_mostrar ?? z?.nombre ?? id);
}

/** Conjunto de datos que aparece antes en la fuente registrada, o null si no se reconoce ninguno. */
function conjuntoPrincipal(fuente) {
  const texto = String(fuente ?? "");
  let mejor = null;
  for (const conjunto of CONJUNTOS) {
    const donde = texto.search(conjunto.patron);
    if (donde >= 0 && (mejor == null || donde < mejor.donde)) mejor = { donde, nombre: conjunto.nombre };
  }
  return mejor ? mejor.nombre : null;
}

function detallesDelGemelo(clave, gemelo) {
  const detalles = [];
  if (clave === "verdor") {
    const anios = Array.isArray(gemelo?.tiempo?.anios) ? gemelo.tiempo.anios.filter(esNumero) : [];
    if (anios.length) {
      const desde = Math.min(...anios);
      const hasta = Math.max(...anios);
      // Años sin separador de miles.
      detalles.push(desde === hasta ? `agricultural year ${desde}` : `agricultural years ${desde}–${hasta}`);
    }
    const meses = Array.isArray(gemelo?.ndvi?.meses) ? gemelo.ndvi.meses.filter(Boolean) : [];
    if (meses.length) {
      const primero = mesCorto(meses[0]);
      const ultimo = mesCorto(meses[meses.length - 1]);
      detalles.push(primero === ultimo ? `monthly NDVI, ${primero}` : `monthly NDVI, ${primero} to ${ultimo}`);
    }
  }
  if (clave === "terreno" && typeof gemelo?.terreno?.rotulo === "string" && gemelo.terreno.rotulo.trim()) {
    detalles.push(gemelo.terreno.rotulo.trim());
  }
  return detalles;
}

function filaConFuentes(fila, fuentes, zonas, gemelo) {
  const archivos = fuentes
    .filter((f) => fila.archivos.test(String(f?.archivo ?? "")))
    .map((f) => ({
      archivo: String(f.archivo),
      fuente: f.fuente == null ? null : String(f.fuente),
      fecha: dia(f.fecha) ?? dia(f.fecha_consulta),
      zona: f.zona == null ? null : nombreZona(zonas, f.zona),
    }));
  const dias = archivos.map((a) => a.fecha).filter(Boolean).sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0));
  const reconocidas = archivos.map((a) => conjuntoPrincipal(a.fuente)).filter(Boolean);
  return {
    clave: fila.clave,
    etiqueta: fila.etiqueta,
    // Modelado: el método es del modelo (texto fijo). Observado: lo que diga la fuente registrada.
    fuente: fila.metodo ?? (Array.from(new Set(reconocidas)).join(" · ") || null),
    detalles: detallesDelGemelo(fila.clave, gemelo),
    fechas: dias.length ? { desde: dias[0], hasta: dias[dias.length - 1] } : null,
    archivos,
  };
}

export function modeloEstado({ manifest, cubo, gemelo, zonaId } = {}) {
  const zonas = zonasDelCubo(cubo);
  const idsZonas = Object.keys(zonas);
  const enVista = zonaId != null && idsZonas.includes(String(zonaId)) ? String(zonaId) : null;

  const filasZonas = idsZonas.map((id) => {
    const conteos = zonas[id]?.conteos ?? {};
    const total = esNumero(conteos.total) ? conteos.total : null;
    const clasificadas = total != null && esNumero(conteos.abstenida) ? total - conteos.abstenida : null;
    return { id, nombre: nombreZona(zonas, id), total, clasificadas, enVista: id === enVista };
  });
  const sumables = filasZonas.filter((z) => z.total != null);
  const total =
    filasZonas.length > 1 && sumables.length === filasZonas.length
      ? {
          total: sumables.reduce((a, z) => a + z.total, 0),
          clasificadas: sumables.every((z) => z.clasificadas != null) ? sumables.reduce((a, z) => a + z.clasificadas, 0) : null,
        }
      : null;

  const fuentesDisponibles = Array.isArray(manifest?.fuentes_de_origen);
  const fuentes = (fuentesDisponibles ? manifest.fuentes_de_origen : []).filter(
    (f) => esObjeto(f) && (enVista == null || f.zona == null || String(f.zona) === enVista),
  );

  return {
    reconstruido: instante(cubo?.meta?.generado),
    simulado: Boolean(cubo?.meta?.mock || manifest?.mock),
    fuentesDisponibles,
    // Idioma del texto «fuente» de cada archivo (manifest.idioma_fuentes); null si el manifest no lo declara.
    idiomaFuentes: typeof manifest?.idioma_fuentes === "string" && manifest.idioma_fuentes ? manifest.idioma_fuentes : null,
    zonas: filasZonas,
    total,
    grupos: GRUPOS.map((g) => ({
      clave: g.clave,
      titulo: g.titulo,
      simbolo: g.simbolo,
      nota: g.nota,
      filas: g.filas.map((fila) =>
        fila.archivos
          ? filaConFuentes(fila, fuentes, zonas, gemelo)
          : { clave: fila.clave, etiqueta: fila.etiqueta, descripcion: fila.descripcion },
      ),
    })),
  };
}

// ---------------------------------------------------------------------------
// Dibujo
// ---------------------------------------------------------------------------
const htmlTiempo = (f) => `<time datetime="${esc(f.iso)}">${esc(f.texto)}</time>`;

function htmlFechas(fechas) {
  if (!fechas) return "";
  return fechas.desde.iso === fechas.hasta.iso ? htmlTiempo(fechas.desde) : `${htmlTiempo(fechas.desde)} – ${htmlTiempo(fechas.hasta)}`;
}

function htmlConteo(total, clasificadas) {
  if (total == null) return `<span class="estado-gemelo-conteo">${esc(TEXTO_NO_DISPONIBLE)}</span>`;
  const partes = [`<strong>${esc(entero(total))}</strong> ${plural(total, "field", "fields")}`];
  if (clasificadas != null) partes.push(`<strong>${esc(entero(clasificadas))}</strong> classified`);
  return `<span class="estado-gemelo-conteo">${partes.join(" · ")}</span>`;
}

function htmlBarra(total, clasificadas) {
  if (!(total > 0) || clasificadas == null) return "";
  const parte = Math.max(0, Math.min(1, clasificadas / total));
  // La barra repite el texto de al lado (parte clasificada): es un apoyo visual, no otro dato.
  return `<span class="estado-gemelo-barra" aria-hidden="true"><span style="width: ${(parte * 100).toFixed(1)}%"></span></span>`;
}

function htmlEspejo(modelo, sub) {
  const titulo = `<h${sub} class="estado-gemelo-subtitulo">${esc(TEXTO_ESPEJO)}</h${sub}>`;
  if (!modelo.zonas.length) {
    return `<div class="estado-gemelo-espejo">${titulo}<p class="estado-gemelo-falta">${esc(TEXTO_ESPEJO)}: ${esc(TEXTO_NO_DISPONIBLE)}</p></div>`;
  }
  const zonas = modelo.zonas
    .map(
      (z) =>
        `<li class="estado-gemelo-zona" data-zona="${esc(z.id)}"${z.enVista ? ' aria-current="true"' : ""}>` +
        `<span class="estado-gemelo-zona-nombre">${esc(z.nombre)}` +
        (z.enVista ? ` <span class="estado-gemelo-en-vista">${esc(TEXTO_EN_VISTA)}</span>` : "") +
        "</span>" +
        htmlConteo(z.total, z.clasificadas) +
        htmlBarra(z.total, z.clasificadas) +
        "</li>",
    )
    .join("");
  const total = modelo.total
    ? `<li class="estado-gemelo-zona estado-gemelo-zona--total" data-zona=""><span class="estado-gemelo-zona-nombre">${esc(TEXTO_TODAS)}</span>${htmlConteo(modelo.total.total, modelo.total.clasificadas)}</li>`
    : "";
  return `<div class="estado-gemelo-espejo">${titulo}<ul class="estado-gemelo-zonas">${zonas}${total}</ul></div>`;
}

function htmlArchivos(fila, idioma) {
  if (!fila.archivos.length) return "";
  // La fuente se muestra tal como se registró. Solo se marca su idioma si no es el de la página (inglés); un
  // manifest que no lo declare se toma por español, como antes de la reentrega en inglés del buzón.
  const lang = idioma === "en" ? "" : ` lang="${esc(idioma || "es")}"`;
  const items = fila.archivos
    .map(
      (a) =>
        "<li>" +
        `<span class="estado-gemelo-archivo">${esc(a.archivo)}</span>` +
        (a.fecha ? ` · ${htmlTiempo(a.fecha)}` : "") +
        (a.zona ? ` · ${esc(a.zona)}` : "") +
        (a.fuente ? `<span class="estado-gemelo-registrada"${lang}>${esc(a.fuente)}</span>` : "") +
        "</li>",
    )
    .join("");
  return (
    `<details class="estado-gemelo-archivos" data-fila="${esc(fila.clave)}">` +
    `<summary>${esc(TEXTO_ARCHIVOS)} (${esc(entero(fila.archivos.length))})</summary><ul>${items}</ul></details>`
  );
}

function htmlFila(fila, modelo, escenario) {
  const etiqueta = `<span class="estado-gemelo-etiqueta">${esc(fila.etiqueta)}</span>`;
  // Escenario: lo que la persona mueve. Sin fecha (no es un dato) y, si la app lo dio, con su valor actual.
  if (fila.descripcion != null) {
    const valor = String(escenario[fila.clave] ?? "").trim();
    return (
      `<li class="estado-gemelo-fila" data-fila="${esc(fila.clave)}">${etiqueta}` +
      `<span class="estado-gemelo-detalle">${esc(fila.descripcion)}</span>` +
      `<span class="estado-gemelo-valor" data-valor="${esc(fila.clave)}"${valor ? "" : " hidden"}>${esc(TEXTO_AHORA)}: <strong>${esc(valor)}</strong></span>` +
      "</li>"
    );
  }
  const fuente = fila.fuente ? `<span class="estado-gemelo-fuente">${esc(fila.fuente)}</span>` : "";
  const detalles = fila.detalles.map((d) => `<span class="estado-gemelo-detalle">${esc(d)}</span>`).join("");
  let fecha;
  if (fila.fechas) {
    fecha = `<span class="estado-gemelo-fecha"><span class="estado-gemelo-fecha-rotulo">${esc(TEXTO_FECHA)}:</span> ${htmlFechas(fila.fechas)}</span>`;
  } else if (!modelo.fuentesDisponibles) {
    fecha = `<span class="estado-gemelo-fecha estado-gemelo-fecha--falta">${esc(TEXTO_FECHA)}: ${esc(TEXTO_NO_DISPONIBLE)}</span>`;
  } else {
    fecha = `<span class="estado-gemelo-fecha estado-gemelo-fecha--falta">${esc(fila.archivos.length ? `${TEXTO_FECHA}: ${TEXTO_NO_DISPONIBLE}` : TEXTO_SIN_ARCHIVO)}</span>`;
  }
  // La etiqueta y la fecha comparten renglón si caben; si no, la fecha baja (en el teléfono o en el panel).
  return `<li class="estado-gemelo-fila" data-fila="${esc(fila.clave)}"><span class="estado-gemelo-fila-cabeza">${etiqueta}${fecha}</span>${fuente}${detalles}${htmlArchivos(fila, modelo.idiomaFuentes)}</li>`;
}

function htmlGrupo(grupo, modelo, escenario, sub, id) {
  const idTitulo = `${id}-${grupo.clave}`;
  const sinFuentes =
    grupo.clave !== "escenario" && !modelo.fuentesDisponibles
      ? `<p class="estado-gemelo-sin-fuentes"><strong>${esc(TEXTO_SIN_FUENTES)}</strong> <span>${esc(DETALLE_SIN_FUENTES)}</span></p>`
      : "";
  return (
    `<section class="estado-gemelo-grupo estado-gemelo-grupo--${grupo.clave}" data-grupo="${grupo.clave}" aria-labelledby="${idTitulo}">` +
    `<h${sub} class="estado-gemelo-grupo-titulo" id="${idTitulo}"><span class="estado-gemelo-simbolo" aria-hidden="true">${esc(grupo.simbolo)}</span> ${esc(grupo.titulo)}</h${sub}>` +
    `<p class="estado-gemelo-grupo-nota">${esc(grupo.nota)}</p>` +
    sinFuentes +
    `<ul class="estado-gemelo-filas">${grupo.filas.map((f) => htmlFila(f, modelo, escenario)).join("")}</ul>` +
    "</section>"
  );
}

function htmlTarjeta(modelo, escenario, nivel, id) {
  const sub = nivel + 1;
  const reconstruido = modelo.reconstruido
    ? `<time datetime="${esc(modelo.reconstruido.iso)}">${esc(modelo.reconstruido.texto)}</time>`
    : `<span class="estado-gemelo-falta">${esc(TEXTO_NO_DISPONIBLE)}</span>`;
  return (
    '<header class="estado-gemelo-cabeza">' +
    `<h${nivel} class="estado-gemelo-titulo" id="${id}-titulo">${esc(TITULO)}</h${nivel}>` +
    `<p class="estado-gemelo-reconstruido"><span class="estado-gemelo-rotulo">${esc(TEXTO_RECONSTRUIDO)}:</span> ${reconstruido}</p>` +
    "</header>" +
    (modelo.simulado ? `<p class="estado-gemelo-simulado" role="note">${esc(TEXTO_SIMULADO)}</p>` : "") +
    htmlEspejo(modelo, sub) +
    `<div class="estado-gemelo-grupos">${modelo.grupos.map((g) => htmlGrupo(g, modelo, escenario, sub, id)).join("")}</div>` +
    `<p class="estado-gemelo-nota">${esc(NOTA_GEMELO)}</p>`
  );
}

const controladores = new WeakMap(); // contenedor -> controlador (para soltar el anterior al volver a montar)

export function montarEstadoGemelo(contenedor, opciones = {}) {
  if (!contenedor || typeof document === "undefined") return null;
  asegurarHoja();
  controladores.get(contenedor)?.destruir();

  const id = idNuevo();
  const estado = {
    manifest: opciones.manifest ?? null,
    cubo: opciones.cubo ?? null,
    gemelo: opciones.gemelo ?? null,
    zonaId: opciones.zonaId ?? null,
    nivel: Number.isInteger(opciones.nivel) ? opciones.nivel : NIVEL_POR_OMISION,
    escenario: {},
    vivo: true,
  };
  const raiz = document.createElement("section");
  raiz.className = "estado-gemelo";
  raiz.setAttribute("aria-labelledby", `${id}-titulo`);
  contenedor.replaceChildren(raiz);

  function guardarEscenario(valores) {
    if (!esObjeto(valores)) return;
    for (const clave of CLAVES_ESCENARIO) {
      if (!(clave in valores)) continue;
      const texto = String(valores[clave] ?? "").trim();
      if (texto) estado.escenario[clave] = texto;
      else delete estado.escenario[clave];
    }
  }

  function pintar() {
    // Los «Source files» que la persona abrió siguen abiertos al cambiar de zona.
    const abiertos = new Set(Array.from(raiz.querySelectorAll("details[open]"), (d) => d.dataset.fila));
    const modelo = modeloEstado(estado);
    raiz.dataset.zona = modelo.zonas.find((z) => z.enVista)?.id ?? "";
    raiz.dataset.fuentes = modelo.fuentesDisponibles ? "si" : "no";
    raiz.innerHTML = htmlTarjeta(modelo, estado.escenario, estado.nivel, id);
    for (const d of raiz.querySelectorAll("details")) if (abiertos.has(d.dataset.fila)) d.open = true;
  }

  function pintarEscenario() {
    for (const clave of CLAVES_ESCENARIO) {
      const nodo = raiz.querySelector(`[data-valor="${clave}"]`);
      if (!nodo) continue;
      const texto = estado.escenario[clave] ?? "";
      nodo.querySelector("strong").textContent = texto;
      nodo.hidden = !texto;
    }
  }

  const controlador = {
    elemento: raiz,
    fijarZona(zonaId) {
      if (!estado.vivo || zonaId === estado.zonaId) return;
      estado.zonaId = zonaId ?? null;
      pintar();
    },
    fijarEscenario(valores) {
      if (!estado.vivo) return;
      guardarEscenario(valores);
      pintarEscenario();
    },
    fijarDatos(nuevos = {}) {
      if (!estado.vivo) return;
      for (const k of ["manifest", "cubo", "gemelo"]) if (k in nuevos) estado[k] = nuevos[k] ?? null;
      pintar();
    },
    destruir() {
      if (!estado.vivo) return;
      estado.vivo = false;
      raiz.remove();
      if (controladores.get(contenedor) === controlador) controladores.delete(contenedor);
    },
  };
  controladores.set(contenedor, controlador);
  guardarEscenario(opciones.escenario);
  pintar();
  return controlador;
}
