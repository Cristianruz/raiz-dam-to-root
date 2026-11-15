// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// web/js/tiempo.js — Línea de tiempo del gemelo digital: el estado observado de cada parcela, año agrícola por
// año agrícola (docs/decisiones/2026-11-14_gemelo_digital.md, «Qué cambia en el producto», punto 2).
// Módulo ES, sin dependencias. Estilos: web/css/tiempo.css (cargue esa hoja junto con este módulo).
//
// QUÉ EXPORTA (lo conecta app.js; este archivo no toca el mapa, las capas ni los controles de la aplicación):
//   crearLineaDeTiempo({ contenedor, gemelo, alCambiar, reducirMovimiento, anioInicial }) -> controlador
//     contenedor         elemento del DOM donde se dibuja. El módulo AGREGA ahí un solo nodo (<div class="tiempo">)
//                        y al destruirse retira ese nodo; no borra lo demás que tenga el contenedor. El diseño
//                        se acomoda al ancho de ese nodo (angosto: una columna; ancho: control y leyenda lado a
//                        lado, con la clase «tiempo-ancha» que el módulo pone al medirse).
//     gemelo             contenido de web/data/gemelo.json (contrato de la decisión). Se usa gemelo.tiempo:
//                          anios         [mínimo, máximo] del deslizador (si trae más años, se toman los extremos);
//                          intervalo_ms  espera entre un año y el siguiente al reproducir;
//                          destacados    { "<año>": { texto, fuente, etiqueta } } (p. ej. 2025).
//                        Si falta gemelo.tiempo.anios, se dibuja «Timeline: not available» y el controlador
//                        queda inerte (disponible() === false): el módulo no inventa los años.
//     alCambiar          función(anio, { origen, anterior }): se llama en CADA cambio de año, después de que el
//                        módulo ya se repintó, para que la aplicación recoloree el mapa con estadoDe().
//                        origen: "deslizador" (la persona movió el control), "reproduccion" (avance automático o
//                        el salto al inicio al pulsar Play en el último año), "boton" (un paso con el botón, en
//                        movimiento reducido) o "api" (fijarAnio). No se llama al crear ni si el año no cambia.
//     reducirMovimiento  booleano, o función que lo devuelve; si falta, se consulta prefers-reduced-motion (y se
//                        atiende si cambia). Con movimiento reducido NO hay reproducción automática: el botón dice
//                        «Next year», avanza un año por pulsación y una nota visible lo explica.
//     anioInicial        opcional: año con el que abre (por omisión, el último de gemelo.tiempo.anios, que es el
//                        estado más reciente del gemelo). Fuera del rango, se ajusta al extremo más cercano.
//
//   controlador:
//     fijarDatos({ features, rotulo })
//                          parcelas con las que se calculan los conteos: arreglo de Features de parcelas.geojson
//                          (las de la zona que esté viendo la persona). Se lee feature.properties.memoria:
//                          [{ anio, estado }]. rotulo es opcional (p. ej. el nombre de la zona) y se escribe junto
//                          al total. No llama a alCambiar (el año no cambia).
//     anio() -> number     año agrícola elegido.
//     fijarAnio(a) -> number
//                          elige un año (se redondea y se ajusta al rango); devuelve el que quedó. No pausa.
//     reproducir() -> boolean
//                          avanza un año de inmediato y luego uno cada gemelo.tiempo.intervalo_ms; se detiene solo
//                          en el último año (no hay bucle). Si ya está en el último, vuelve al más antiguo y hace UNA
//                          pasada. Devuelve true si quedó reproduciendo. Con movimiento reducido (o si el dato del
//                          intervalo falta) avanza UN año y devuelve false.
//     pausar()             detiene la reproducción; el año se queda donde está.
//     reproduciendo() -> boolean
//     estadoDe(feature, anio) -> "perenne" | "verano" | "invierno" | "doble" | "descanso" | "sin_dato"
//                          estado de la memoria de esa parcela en ese año (por omisión, el año elegido). "sin_dato"
//                          si la parcela no trae memoria, si no trae ese año o si el estado no es uno de los seis.
//                          Acepta un Feature o sus properties; tolera la memoria como texto JSON (así la entrega
//                          MapLibre en queryRenderedFeatures).
//     conteos(anio) -> { perenne, verano, invierno, doble, descanso, sin_dato }
//                          parcelas por estado en ese año (por omisión, el elegido), de las dadas en fijarDatos.
//     disponible() -> boolean
//     destruir()           detiene la reproducción, suelta los oyentes y retira su nodo; queda inerte.
//
//   También, sin DOM (para pruebas con Node y para quien quiera calcular sin dibujar):
//     ESTADOS                        los seis estados, en orden: [{ clave, texto, letra, trama }]. El color de cada
//                                    uno es la variable CSS --mem-<clave> de style.css (tiempo.css la toma de ahí).
//     estadoDe(feature, anio)        igual que el del controlador, con el año obligatorio.
//     contarEstados(features, anio)  igual que conteos().
//     rangoDeAnios(gemelo)           [mínimo, máximo] de gemelo.tiempo.anios, o null si falta o no sirve.
//
// QUÉ DIBUJA (todo con el prefijo «tiempo-»):
//   · Etiqueta «Agricultural year», el año elegido (sin separador de miles) y un botón Play/Pause con texto y
//     aria-pressed. Deslizador nativo (input type=range): flechas, Inicio, Fin y Re/Av Pág funcionan solas;
//     Espacio y Enter, en el botón. Bajo el deslizador, una marca por año; los años destacados llevan ★.
//   · Nota fija: «Rule-based reading of monthly greenness (NASA HLS); not a crop census.»
//   · Nota del año destacado (texto, fuente y etiqueta de gemelo.tiempo.destacados). Su espacio queda reservado
//     aunque el año elegido no sea destacado, para que la página no brinque durante la reproducción.
//   · Leyenda de los seis estados (color + letra + trama) con el número de parcelas de cada uno en el año
//     elegido y una barra con su parte del total. Nada depende solo del color.
//
// DECISIONES DE ESTE ARCHIVO (para quien lo integre o lo revise):
//   1. Ninguna cifra escrita a mano: los años, el intervalo y las notas salen de gemelo.json; los conteos, de las
//      parcelas dadas. Los números del código son el paso del eje (un año) y medidas de diseño.
//   2. Mover el deslizador a mano pausa la reproducción (la persona toma el control). También se pausa si la
//      pestaña deja de verse, para que al volver no haya un salto de varios años.
//   3. Los lectores de pantalla oyen el año por el propio deslizador (aria-valuetext, que incluye la nota del año
//      destacado). Los cambios hechos con el botón o por la reproducción se anuncian en una región aria-live.
//   4. La fuente de un año destacado se marca lang="es": la interfaz va en inglés, el dato no.
//   5. El módulo describe lo observado; no reparte agua, no pronostica y no recomienda.

const LOCALE = "en-US";
const SIN_DATO = "sin_dato";
const PASO_ANIOS = 1; // el eje avanza de un año agrícola en un año agrícola (unidad del eje, no un dato)
const MAX_MARCAS = 40; // medida de diseño: con más años que estos, solo se marcan los extremos y los destacados
const ANCHO_DOS_COLUMNAS_PX = 680; // medida de diseño: desde este ancho del módulo, control y leyenda lado a lado
const CONSULTA_MOVIMIENTO = "(prefers-reduced-motion: reduce)";
const ESTRELLA = "★";
const RAYA = "–";

// Los seis estados de la memoria de la parcela (mismas letras y tramas que la ficha y la capa de memoria de app.js).
export const ESTADOS = Object.freeze([
  Object.freeze({ clave: "perenne", texto: "Perennial", letra: "P", trama: "ninguna" }),
  Object.freeze({ clave: "verano", texto: "Summer crop", letra: "S", trama: "horizontal" }),
  Object.freeze({ clave: "invierno", texto: "Winter crop", letra: "W", trama: "vertical" }),
  Object.freeze({ clave: "doble", texto: "Double crop", letra: "D", trama: "cruz" }),
  Object.freeze({ clave: "descanso", texto: "Rest", letra: "R", trama: "diagonal" }),
  Object.freeze({ clave: SIN_DATO, texto: "No data", letra: "?", trama: "puntos" }),
]);
const CLAVES = new Set(ESTADOS.map((e) => e.clave));

// Textos de la interfaz (inglés; sin cifras: los años, los conteos y el intervalo salen de los datos).
const TEXTOS = Object.freeze({
  grupo: "Timeline of the twin: observed state of each field, by agricultural year",
  anio: "Agricultural year",
  reproducir: "Play",
  pausar: "Pause",
  siguiente: "Next year",
  volver: "Back to start",
  nota: "Rule-based reading of monthly greenness (NASA HLS); not a crop census.",
  modoReducido: "Reduced motion is on, so there is no automatic playback: each press moves one year forward.",
  modoSinIntervalo: "The playback interval is missing from the twin data: each press moves one year forward.",
  noDisponible: "Timeline: not available",
  destacado: "Highlighted year",
  estrella: "A star",
  guiaUno: "on the slider marks a highlighted year:",
  guiaVarios: "on the slider marks the highlighted years:",
  fuente: "Source:",
  sinFuente: "not available",
  etiqueta: "Label:",
  conteos: "Observed state of the fields in",
  leyenda: "Legend, with the number of fields in each observed state",
  parcela: "field",
  parcelas: "fields",
  sinParcelas: "No fields to count",
  fin: "Playback reached the last year.",
});

const formatoEntero = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });

function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Entero de un dato (número, o texto con un número), o null. No convierte null, "" ni true en un número. */
function entero(v) {
  const esNumero = typeof v === "number";
  const esTexto = typeof v === "string" && v.trim() !== "";
  if (!esNumero && !esTexto) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

/** Memoria de una parcela: [{ anio, estado }] o null. Acepta un Feature o sus properties. */
function memoriaDe(feature) {
  const propiedades = feature?.properties ?? feature;
  let memoria = propiedades?.memoria;
  if (typeof memoria === "string") {
    try {
      memoria = JSON.parse(memoria);
    } catch {
      memoria = null;
    }
  }
  return Array.isArray(memoria) ? memoria : null;
}

/** Estado de la memoria de una parcela en un año agrícola: una de las seis claves de ESTADOS. */
export function estadoDe(feature, anio) {
  const buscado = entero(anio);
  const memoria = memoriaDe(feature);
  if (!memoria || buscado === null) return SIN_DATO;
  for (const registro of memoria) {
    if (entero(registro?.anio) === buscado) return CLAVES.has(registro.estado) ? registro.estado : SIN_DATO;
  }
  return SIN_DATO;
}

/** Parcelas por estado en un año: { perenne, verano, invierno, doble, descanso, sin_dato }. */
export function contarEstados(features, anio) {
  const cuenta = {};
  for (const e of ESTADOS) cuenta[e.clave] = 0;
  for (const f of Array.isArray(features) ? features : []) cuenta[estadoDe(f, anio)] += 1;
  return cuenta;
}

/** [mínimo, máximo] de gemelo.tiempo.anios, o null si el dato falta o no son años enteros. */
export function rangoDeAnios(gemelo) {
  const lista = gemelo?.tiempo?.anios;
  if (!Array.isArray(lista) || !lista.length) return null;
  const anios = lista.map(entero);
  if (anios.includes(null)) return null;
  return [Math.min(...anios), Math.max(...anios)];
}

/** Años destacados que caen dentro del rango: Map(año -> { texto, fuente, etiqueta }), en orden. */
function destacadosDe(gemelo, minimo, maximo) {
  const datos = gemelo?.tiempo?.destacados;
  const mapa = new Map();
  if (!datos || typeof datos !== "object") return mapa;
  const anios = Object.keys(datos)
    .map(entero)
    .filter((a) => a !== null && a >= minimo && a <= maximo)
    .sort((a, b) => a - b);
  for (const a of anios) {
    const d = datos[String(a)];
    if (d && typeof d === "object") mapa.set(a, d);
  }
  return mapa;
}

function listaDeFeatures(features) {
  if (Array.isArray(features)) return features;
  return Array.isArray(features?.features) ? features.features : []; // tolera el FeatureCollection completo
}

let serie = 0; // para que los id no choquen si hay más de una línea de tiempo en la página

export function crearLineaDeTiempo({ contenedor, gemelo, alCambiar, reducirMovimiento, anioInicial } = {}) {
  if (!contenedor || typeof contenedor.append !== "function") {
    throw new TypeError("crearLineaDeTiempo: falta el contenedor (un elemento del DOM)");
  }
  const documento = contenedor.ownerDocument ?? document;
  const ventana = documento.defaultView ?? globalThis;
  serie += 1;
  const id = `tiempo-${serie}`;

  const raiz = documento.createElement("div");
  raiz.className = "tiempo";
  raiz.setAttribute("role", "group");
  raiz.setAttribute("aria-label", TEXTOS.grupo);

  let features = [];
  let rotulo = "";
  let destruido = false;

  // ---------------------------------------------------------------------------
  // Sin años en el dato no hay línea de tiempo: se dice y el controlador queda inerte.
  // ---------------------------------------------------------------------------
  const rango = rangoDeAnios(gemelo);
  if (!rango) {
    raiz.classList.add("tiempo-inerte");
    raiz.innerHTML = `<p class="tiempo-no-disponible">${esc(TEXTOS.noDisponible)}</p>`;
    contenedor.append(raiz);
    return {
      disponible: () => false,
      fijarDatos(datos) {
        features = listaDeFeatures(datos?.features);
      },
      anio: () => null,
      fijarAnio: () => null,
      reproducir: () => false,
      pausar() {},
      reproduciendo: () => false,
      estadoDe: (feature, anio) => estadoDe(feature, anio),
      conteos: (anio) => contarEstados(features, anio),
      destruir() {
        raiz.remove();
      },
    };
  }

  const [minimo, maximo] = rango;
  const destacados = destacadosDe(gemelo, minimo, maximo);
  const intervalo = Number(gemelo?.tiempo?.intervalo_ms);
  const hayIntervalo = typeof gemelo?.tiempo?.intervalo_ms === "number" && Number.isFinite(intervalo) && intervalo > 0;
  const consulta = reducirMovimiento == null ? ventana.matchMedia?.(CONSULTA_MOVIMIENTO) ?? null : null;

  let anioActual = acotar(anioInicial) ?? maximo;
  let temporizador = null;
  const cache = new Map(); // año -> conteos de las parcelas dadas

  // ---------------------------------------------------------------------------
  // Esqueleto (los valores del deslizador se fijan después, desde el dato; aquí no hay cifras)
  // ---------------------------------------------------------------------------
  const filasEstados = ESTADOS.map(
    (e) =>
      `<li class="tiempo-estado" data-estado="${esc(e.clave)}">` +
      `<span class="tiempo-muestra tiempo-trama-${esc(e.trama)}" aria-hidden="true"><span class="tiempo-letra">${esc(e.letra)}</span></span>` +
      `<span class="tiempo-nombre">${esc(e.texto)}</span>` +
      `<span class="tiempo-barra" aria-hidden="true"><span class="tiempo-barra-relleno"></span></span>` +
      `<span class="tiempo-cuenta"><span class="tiempo-cuenta-numero"></span><span class="tiempo-voz tiempo-cuenta-unidad"></span></span>` +
      `</li>`,
  ).join("");

  const notasDestacadas = [...destacados]
    .map(([anio, d]) => {
      const fuente = d.fuente ? `<span lang="es">${esc(d.fuente)}</span>` : esc(TEXTOS.sinFuente);
      const etiqueta = d.etiqueta
        ? ` · <span class="tiempo-destacado-etiqueta">${esc(TEXTOS.etiqueta)} <span lang="es">${esc(d.etiqueta)}</span></span>`
        : "";
      return (
        `<div class="tiempo-destacado tiempo-oculto" role="note" data-anio="${esc(anio)}">` +
        `<p class="tiempo-destacado-titulo"><span class="tiempo-estrella" aria-hidden="true">${ESTRELLA}</span> ` +
        `<span class="tiempo-destacado-anio">${esc(anio)}</span> · ${esc(TEXTOS.destacado)}</p>` +
        `<p class="tiempo-destacado-texto">${esc(d.texto ?? "")}</p>` +
        `<p class="tiempo-destacado-fuente">${esc(TEXTOS.fuente)} ${fuente}${etiqueta}</p>` +
        `</div>`
      );
    })
    .join("");
  const guia = destacados.size
    ? `<p class="tiempo-destacados-guia"><span class="tiempo-estrella" aria-hidden="true">${ESTRELLA}</span>` +
      `<span class="tiempo-voz">${esc(TEXTOS.estrella)}</span> ` +
      `${esc(destacados.size === 1 ? TEXTOS.guiaUno : TEXTOS.guiaVarios)} ` +
      `<span class="tiempo-destacados-anios">${esc([...destacados.keys()].join(", "))}</span></p>`
    : "";

  raiz.innerHTML =
    `<div class="tiempo-cuerpo">` +
    `<div class="tiempo-control">` +
    `<div class="tiempo-cabecera">` +
    `<label class="tiempo-etiqueta" for="${id}-anio">${esc(TEXTOS.anio)}</label>` +
    `<strong class="tiempo-valor"></strong>` +
    `<button type="button" class="tiempo-boton"><span class="tiempo-icono" aria-hidden="true"></span><span class="tiempo-boton-texto"></span></button>` +
    `</div>` +
    `<div class="tiempo-pista">` +
    `<input type="range" class="tiempo-rango" id="${id}-anio" aria-describedby="${id}-nota">` +
    `<div class="tiempo-marcas" aria-hidden="true"></div>` +
    `</div>` +
    `<p class="tiempo-modo" id="${id}-modo" hidden></p>` +
    `<p class="tiempo-nota" id="${id}-nota">${esc(TEXTOS.nota)}</p>` +
    `</div>` +
    `<div class="tiempo-destacados"${destacados.size ? "" : " hidden"}>${guia}${notasDestacadas}</div>` +
    `<div class="tiempo-conteos">` +
    `<p class="tiempo-conteos-titulo" id="${id}-conteos"><strong>${esc(TEXTOS.conteos)} <span class="tiempo-conteos-anio"></span></strong> ` +
    `<span class="tiempo-total"></span></p>` +
    `<ul class="tiempo-estados" aria-label="${esc(TEXTOS.leyenda)}">${filasEstados}</ul>` +
    `</div>` +
    `</div>` +
    `<p class="tiempo-voz tiempo-anuncio" aria-live="polite"></p>`;

  const $ = (selector) => raiz.querySelector(selector);
  const dom = {
    valor: $(".tiempo-valor"),
    boton: $(".tiempo-boton"),
    botonTexto: $(".tiempo-boton-texto"),
    rango: $(".tiempo-rango"),
    marcas: $(".tiempo-marcas"),
    modo: $(".tiempo-modo"),
    guia: $(".tiempo-destacados-guia"),
    notas: [...raiz.querySelectorAll(".tiempo-destacado")],
    conteosAnio: $(".tiempo-conteos-anio"),
    total: $(".tiempo-total"),
    anuncio: $(".tiempo-anuncio"),
    filas: new Map(
      [...raiz.querySelectorAll(".tiempo-estado")].map((li) => [
        li.dataset.estado,
        {
          li,
          numero: li.querySelector(".tiempo-cuenta-numero"),
          unidad: li.querySelector(".tiempo-cuenta-unidad"),
          relleno: li.querySelector(".tiempo-barra-relleno"),
        },
      ]),
    ),
  };

  // El deslizador toma sus límites del dato (gemelo.tiempo.anios), no del marcado.
  dom.rango.min = String(minimo);
  dom.rango.max = String(maximo);
  dom.rango.step = String(PASO_ANIOS);
  dom.rango.value = String(anioActual);
  if (minimo === maximo) dom.boton.hidden = true; // con un solo año no hay nada que reproducir

  pintarMarcas();
  pintarAnio();
  pintarBoton();

  dom.rango.addEventListener("input", alDeslizar);
  dom.boton.addEventListener("click", alPulsar);
  consulta?.addEventListener?.("change", alCambiarPreferencia);
  documento.addEventListener("visibilitychange", alOcultarse);

  contenedor.append(raiz);

  // Diseño según el ancho del propio módulo (no el de la ventana): se mide al crear y cada vez que cambia.
  const acomodar = (ancho) => raiz.classList.toggle("tiempo-ancha", ancho >= ANCHO_DOS_COLUMNAS_PX);
  acomodar(raiz.getBoundingClientRect().width);
  const observador =
    typeof ventana.ResizeObserver === "function"
      ? new ventana.ResizeObserver((entradas) => {
          // El cambio de clase se difiere un cuadro: hecho dentro del aviso, cambia el alto del nodo observado y el
          // navegador emite «ResizeObserver loop completed with undelivered notifications».
          const ancho = entradas[entradas.length - 1].contentRect.width;
          ventana.requestAnimationFrame(() => {
            if (!destruido) acomodar(ancho);
          });
        })
      : null;
  observador?.observe(raiz);

  // ---------------------------------------------------------------------------
  // Cálculo
  // ---------------------------------------------------------------------------
  /** Año entero dentro del rango, o null si no es un número. */
  function acotar(valor) {
    const n = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor;
    if (typeof n !== "number" || !Number.isFinite(n)) return null;
    return Math.min(maximo, Math.max(minimo, Math.round(n)));
  }

  function conteosDe(anio) {
    if (!cache.has(anio)) cache.set(anio, contarEstados(features, anio));
    return cache.get(anio);
  }

  function sinMovimiento() {
    if (typeof reducirMovimiento === "function") return Boolean(reducirMovimiento());
    if (reducirMovimiento != null) return Boolean(reducirMovimiento);
    return consulta?.matches ?? false;
  }

  /** true si el botón avanza un año por pulsación en vez de reproducir (movimiento reducido, o sin intervalo). */
  function pasoManual() {
    return sinMovimiento() || !hayIntervalo;
  }

  function fmtAnio(anio) {
    return String(anio); // un año no lleva separador de miles
  }

  function fmtParcelas(n) {
    return `${formatoEntero.format(n)} ${n === 1 ? TEXTOS.parcela : TEXTOS.parcelas}`;
  }

  // ---------------------------------------------------------------------------
  // Dibujo
  // ---------------------------------------------------------------------------
  function pintarMarcas() {
    const cuantos = (maximo - minimo) / PASO_ANIOS + 1;
    const todas = cuantos <= MAX_MARCAS;
    const partes = [];
    for (let a = minimo; a <= maximo; a += PASO_ANIOS) {
      const extremo = a === minimo || a === maximo;
      const destacado = destacados.has(a);
      if (!todas && !extremo && !destacado) continue;
      const clases = ["tiempo-marca", extremo ? "tiempo-marca-extremo" : "", destacado ? "tiempo-marca-destacada" : ""];
      // Posición de la marca sobre la pista, de cero (primer año) a uno (último).
      const parte = maximo > minimo ? (a - minimo) / (maximo - minimo) : 0;
      partes.push(
        `<span class="${clases.filter(Boolean).join(" ")}" data-anio="${esc(a)}" style="--tiempo-lugar: ${parte}">` +
          `<span class="tiempo-marca-raya">${destacado ? ESTRELLA : ""}</span>` +
          (extremo ? `<span class="tiempo-marca-anio">${esc(fmtAnio(a))}</span>` : "") +
          `</span>`,
      );
    }
    dom.marcas.innerHTML = partes.join("");
  }

  function pintarAnio() {
    const destacado = destacados.get(anioActual);
    dom.valor.textContent = fmtAnio(anioActual);
    dom.valor.classList.toggle("tiempo-valor-destacado", Boolean(destacado));
    if (Number(dom.rango.value) !== anioActual) dom.rango.value = String(anioActual);
    dom.rango.setAttribute(
      "aria-valuetext",
      destacado ? `${fmtAnio(anioActual)}, ${TEXTOS.destacado}: ${destacado.texto ?? ""}` : fmtAnio(anioActual),
    );
    // Parte recorrida de la pista (de cero a uno): tiempo.css pinta con ella el tramo azul.
    dom.rango.style.setProperty("--tiempo-avance", String(maximo > minimo ? (anioActual - minimo) / (maximo - minimo) : 0));
    for (const marca of dom.marcas.children) {
      marca.classList.toggle("tiempo-marca-actual", Number(marca.dataset.anio) === anioActual);
    }
    // Nota del año destacado: todas ocupan el mismo lugar; se ve la del año elegido, o la guía si no es destacado.
    for (const nota of dom.notas) nota.classList.toggle("tiempo-oculto", Number(nota.dataset.anio) !== anioActual);
    dom.guia?.classList.toggle("tiempo-oculto", Boolean(destacado));
    raiz.dataset.anio = fmtAnio(anioActual);
    raiz.classList.toggle("tiempo-en-destacado", Boolean(destacado));
    pintarConteos();
  }

  function pintarConteos() {
    const cuenta = conteosDe(anioActual);
    const total = features.length;
    dom.conteosAnio.textContent = fmtAnio(anioActual);
    dom.total.textContent = total ? [fmtParcelas(total), rotulo].filter(Boolean).join(" · ") : TEXTOS.sinParcelas;
    for (const e of ESTADOS) {
      const fila = dom.filas.get(e.clave);
      const n = cuenta[e.clave];
      fila.numero.textContent = total ? formatoEntero.format(n) : RAYA;
      fila.unidad.textContent = total ? ` ${n === 1 ? TEXTOS.parcela : TEXTOS.parcelas}` : ` (${TEXTOS.sinParcelas})`;
      fila.relleno.style.setProperty("--tiempo-parte", String(total ? n / total : 0));
      if (total) fila.li.dataset.cuenta = String(n);
      else delete fila.li.dataset.cuenta;
    }
  }

  function pintarBoton() {
    const manual = pasoManual();
    const enElUltimo = anioActual >= maximo;
    raiz.classList.toggle("tiempo-sin-movimiento", sinMovimiento());
    dom.boton.classList.toggle("tiempo-boton-manual", manual);
    if (manual) {
      // Un paso por pulsación: no es un botón de dos estados, así que no lleva aria-pressed.
      dom.boton.removeAttribute("aria-pressed");
      dom.boton.dataset.icono = enElUltimo ? "volver" : "siguiente";
      dom.botonTexto.textContent = enElUltimo ? TEXTOS.volver : TEXTOS.siguiente;
      dom.modo.textContent = sinMovimiento() ? TEXTOS.modoReducido : TEXTOS.modoSinIntervalo;
      dom.modo.hidden = false;
      dom.boton.setAttribute("aria-describedby", dom.modo.id);
    } else {
      const activo = temporizador !== null;
      dom.boton.setAttribute("aria-pressed", String(activo));
      dom.boton.dataset.icono = activo ? "pausar" : "reproducir";
      dom.botonTexto.textContent = activo ? TEXTOS.pausar : TEXTOS.reproducir;
      dom.modo.hidden = true;
      dom.boton.removeAttribute("aria-describedby");
    }
  }

  function anunciar(texto) {
    dom.anuncio.textContent = texto;
  }

  function textoDelAnio() {
    const destacado = destacados.get(anioActual);
    const base = `${TEXTOS.anio} ${fmtAnio(anioActual)}`;
    return destacado ? `${base}. ${TEXTOS.destacado}: ${destacado.texto ?? ""}` : base;
  }

  // ---------------------------------------------------------------------------
  // Cambios de año
  // ---------------------------------------------------------------------------
  /** Cambia el año, repinta y avisa a la aplicación. Devuelve true si el año cambió. */
  function cambiar(valor, origen) {
    const nuevo = acotar(valor);
    if (nuevo === null || nuevo === anioActual) {
      if (Number(dom.rango.value) !== anioActual) dom.rango.value = String(anioActual);
      return false;
    }
    const anterior = anioActual;
    anioActual = nuevo;
    pintarAnio();
    pintarBoton();
    if (origen !== "deslizador") anunciar(textoDelAnio()); // el deslizador ya dice su valor
    if (typeof alCambiar === "function") {
      try {
        alCambiar(anioActual, { origen, anterior });
      } catch (error) {
        console.error("tiempo.js: alCambiar falló", error);
      }
    }
    return true;
  }

  /** Un año hacia adelante; desde el último, vuelve al más antiguo. */
  function avanzar(origen) {
    return cambiar(anioActual >= maximo ? minimo : anioActual + PASO_ANIOS, origen);
  }

  function detener() {
    if (temporizador === null) return false;
    ventana.clearTimeout(temporizador);
    temporizador = null;
    return true;
  }

  function programar() {
    temporizador = ventana.setTimeout(tic, intervalo);
  }

  /** Texto del final de la reproducción (se anuncia junto con el último año). */
  function anunciarFin() {
    anunciar(`${textoDelAnio()}. ${TEXTOS.fin}`);
  }

  function tic() {
    temporizador = null;
    if (destruido) return;
    const siguiente = Math.min(maximo, anioActual + PASO_ANIOS);
    // El paso siguiente se programa ANTES de avisar, para que alCambiar vea reproduciendo() === true
    // mientras la reproducción sigue, y false en el paso que llega al último año (ahí se detiene sola).
    const sigue = siguiente < maximo && !pasoManual();
    if (sigue) programar();
    cambiar(siguiente, "reproduccion");
    if (sigue) return;
    pintarBoton();
    if (anioActual >= maximo) anunciarFin();
  }

  function reproducir() {
    if (destruido || minimo === maximo) return false;
    if (pasoManual()) {
      detener();
      avanzar("boton");
      pintarBoton();
      return false;
    }
    if (temporizador !== null) return true;
    programar();
    avanzar("reproduccion"); // primer paso inmediato (o el regreso al inicio, si estaba en el último año)
    if (anioActual >= maximo) {
      // El primer paso ya llegó al último año (rango de dos años): no queda nada que reproducir.
      detener();
      anunciarFin();
    }
    pintarBoton();
    return temporizador !== null;
  }

  function pausar() {
    if (detener()) pintarBoton();
  }

  // ---------------------------------------------------------------------------
  // Oyentes
  // ---------------------------------------------------------------------------
  function alDeslizar() {
    pausar(); // la persona tomó el control
    cambiar(dom.rango.value, "deslizador");
  }

  function alPulsar() {
    if (temporizador !== null) pausar();
    else reproducir();
  }

  function alCambiarPreferencia() {
    if (sinMovimiento()) detener();
    pintarBoton();
  }

  function alOcultarse() {
    if (documento.hidden) pausar();
  }

  // ---------------------------------------------------------------------------
  // Controlador
  // ---------------------------------------------------------------------------
  return {
    disponible: () => !destruido,
    fijarDatos(datos) {
      if (destruido) return;
      features = listaDeFeatures(datos?.features);
      rotulo = typeof datos?.rotulo === "string" ? datos.rotulo.trim() : "";
      cache.clear();
      pintarConteos();
    },
    anio: () => anioActual,
    fijarAnio(valor) {
      if (!destruido) cambiar(valor, "api");
      return anioActual;
    },
    reproducir,
    pausar,
    reproduciendo: () => temporizador !== null,
    estadoDe: (feature, anio = anioActual) => estadoDe(feature, anio),
    conteos: (anio = anioActual) => ({ ...conteosDe(entero(anio) ?? anioActual) }),
    destruir() {
      if (destruido) return;
      detener();
      destruido = true;
      dom.rango.removeEventListener("input", alDeslizar);
      dom.boton.removeEventListener("click", alPulsar);
      consulta?.removeEventListener?.("change", alCambiarPreferencia);
      documento.removeEventListener("visibilitychange", alOcultarse);
      observador?.disconnect();
      raiz.remove();
    },
  };
}
