// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/acerca.js — Pantalla de inicio de tres pasos y sección «About & Data» (kit C5, pasos 2 y 3;
// S9 §4 «Pruebas a la vista» y §6). Módulo ES, sin dependencias.
//
// Qué exporta (lo conecta app.js; este archivo no toca el resto de la página):
//   montarInicio(contenedor = document.body, opciones = {}) -> { elemento, cerrar } | null
//       Pantalla de inicio: «Set the water allocation · Tap a field · Compare rotations» como lista
//       ordenada <ol> (los números los dibuja la lista; el texto no lleva dígitos). Es un diálogo
//       modal: el foco entra al diálogo, Tab no sale de él y Escape, el botón «Start exploring», la
//       «×» o un clic fuera de la tarjeta lo cierran; al cerrar, el foco vuelve a donde estaba.
//       Al cerrarla se anota en sessionStorage (LLAVE_INICIO) y no vuelve a aparecer en la sesión.
//       Devuelve null (y no dibuja nada) si ya se cerró en esta sesión. sessionStorage va siempre en
//       try/catch: si el navegador lo bloquea, la pantalla aparece y se cierra igual.
//         opciones.alCerrar  función opcional que se llama al cerrar
//   montarAcerca(contenedor, ctx) -> { elemento, destruir } | null
//       Sección «About & Data» (reemplaza el contenido del contenedor):
//       - tabla de los datos NASA (dato, producto, para qué se usa, archivos): sale de
//         manifest.fuentes_de_origen (producto y fuente tal como se registraron) y de cubo.meta.fuentes
//         (archivos que están en la caché del build); la escala de NASADEM, de relieve.zonas[].rotulo.
//         Las resoluciones NO se escriben aquí: van dentro de la fuente registrada;
//       - cómo encajan las escalas (armonización), solo con los conjuntos de datos presentes;
//       - las cinco pruebas de S9 §6 con su estado (pruebas.json): «not run» con la misma tarjeta y la
//         misma insignia que un resultado favorable; la puerta automática (docs/pruebas.md);
//       - el rastro de cifras de manifest.json, la liga al repo, «SI/AI tools used» en una línea con
//         liga al README y el aviso de juicio local.
//         ctx = { manifest, pruebas, cubo, relieve, errores }
//           manifest  contenido de web/data/manifest.json (fuentes_de_origen, resumen, generado, mock)
//           pruebas   contenido de web/data/pruebas.json (motor/pruebas_web.py); null si no existe
//           errores   { manifest?, pruebas? }: por qué falta cada archivo, {estado: "ausente" | "error",
//                     detalle}. «ausente» (404) = no se ha construido; «error» (500, red, JSON roto) = no se
//                     pudo leer. Sin esta información se dice «could not be read», nunca una causa supuesta.
//           cubo      contenido de web/data/cubo.json (meta.fuentes; zonas[].nombre_mostrar)
//           relieve   contenido de web/data/relieve.json (zonas[].rotulo y tormenta.fuente); opcional
//       Cualquiera puede faltar (null): la parte que depende de él lo dice y el resto se dibuja.
//   LLAVE_INICIO: llave de sessionStorage de la pantalla de inicio (las pruebas pueden fijarla).
//   Ambas funciones insertan css/acerca.css en la página si aún no está enlazada.
//
// Reglas de este archivo:
// - Ninguna cifra escrita a mano: los conteos, fechas, fracciones y criterios salen de pruebas.json,
//   manifest.json, cubo.json y relieve.json. Los números del código son medidas de diseño, no datos.
// - Sin colores en el JS: los estados llevan clases «acerca-estado--…» y los colores viven en css/acerca.css.
// - Interfaz en inglés; comentarios en español. Sin «first» ni «only»; no se promete ahorro; la
//   herramienta no reparte, vende ni intercambia agua ni pronostica la presa.

const LOCALE = "en-US";
export const LLAVE_INICIO = "raiz.inicio.cerrado";
const HOJA = "../css/acerca.css"; // relativa a este módulo

// ---------------------------------------------------------------------------
// Textos de la interfaz (sin números)
// ---------------------------------------------------------------------------
const AVISO_JUICIO = "This tool supports, never replaces, the judgment of farmers and local experts.";
const LIMITES = "It does not allocate, sell or trade water, and it does not forecast the dam.";

const PASOS_INICIO = [
  {
    titulo: "Set the water allocation",
    texto: "Move the slider or tap a reference mark: the water the dam delivers per hectare, in millares (thousand m³ per hectare).",
  },
  {
    titulo: "Tap a field",
    texto: "On the map or in the field list. Colors and symbols show whether the allocation covers the field's crop.",
  },
  {
    titulo: "Compare rotations",
    texto: "The current rotation and its alternatives: how much water each needs per year, for how many years, and how many hectares the allocation covers.",
  },
];

// Estado de una prueba o de una parte (pruebas.json). El símbolo acompaña al color: nada depende solo del color.
const ESTADOS = {
  passed: { texto: "Criterion met", simbolo: "✓" },
  failed: { texto: "Criterion not met", simbolo: "✕" },
  partial: { texto: "Partly run", simbolo: "◐" },
  "not run": { texto: "Not run", simbolo: "○" },
  run: { texto: "Ran", simbolo: "●" },
};
// Pasos de la puerta automática (docs/pruebas.md).
const ESTADOS_PASO = {
  passed: { texto: "Passed", simbolo: "✓" },
  failed: { texto: "Failed", simbolo: "✕" },
  pending: { texto: "Pending", simbolo: "…" },
  skipped: { texto: "Skipped", simbolo: "–" },
  "not run": { texto: "Not run", simbolo: "○" },
};

// Conjuntos de datos NASA. «patron» decide qué entradas de manifest.fuentes_de_origen pertenecen al
// conjunto (la fuente lo menciona); «producto» reconoce la entrada cuya fuente EMPIEZA con el producto
// (de ahí sale el nombre del producto que se muestra). Una entrada puede pertenecer a dos conjuntos
// (p. ej., relieve_meta.json: NASADEM y la lluvia de la tormenta).
const FAMILIAS = [
  { id: "hls", patron: /\bHLS\b/, producto: /^NASA HLS\b/, dato: "Satellite imagery: Harmonized Landsat and Sentinel (HLS)" },
  { id: "power", patron: /\bPOWER\b/, producto: /^NASA POWER\b/, dato: "Daily weather: NASA POWER" },
  { id: "nasadem", patron: /\bNASADEM/, producto: /^NASADEM\b/, dato: "Elevation: NASADEM" },
  { id: "imerg", patron: /\bIMERG\b|\bGPM\b/, producto: /^(NASA )?GPM\b/, dato: "Rainfall: GPM IMERG" },
  { id: "viirs", patron: /\bSSEBop\b|\bVIIRS\b/, producto: /^(USGS )?SSEBop\b|^VIIRS\b/, dato: "Evapotranspiration: SSEBop on VIIRS" },
  { id: "modis", patron: /\bMODIS\b/, producto: /^(NASA )?MODIS\b/, dato: "Vegetation: MODIS" },
];

// Para qué se usa cada archivo (nombre sin extensión ni sufijo de zona). Un objeto da un texto por
// conjunto de datos («*» = cualquier otro). Lo que no está aquí se describe por su pieza del kit.
const USOS = {
  eto_diaria: "Reference evapotranspiration (FAO-56) behind each crop's water need",
  demanda_cultivos: "Yearly water need of each crop, with its uncertainty band",
  rotaciones: "Yearly water need of each rotation option, with its uncertainty band",
  hls_mensual_parcelas: "Monthly greenness of each field this season",
  cultivos_parcelas: "This season's crop map",
  memoria_parcelas: "Field memory: perennial, summer, winter, double crop or rest, year by year",
  memoria_resumen: "Median bare-soil days of each field (Soil row)",
  suelo_desnudo: { power: "Wind on bare-soil days (Soil row)", "*": "Bare-soil days in the windy season (Soil row)" },
  nasadem_zona_piloto: "Elevation of the pilot area",
  relieve_rutas: "Runoff routes of the “Terrain & runoff” layer",
  relieve_parcelas: "Mean slope and run-on of each field (Soil row)",
  relieve_meta: { nasadem: "Scale label of the “Terrain & runoff” layer", "*": "Storm depth of “Simulate a storm”" },
  et_contraste: "Regional contrast of the modeled ET (test of the water need)",
};
const USO_IMERG_TORMENTA = "Storm depth of “Simulate a storm”";
const USO_IMERG_RESERVA = "Daily rainfall over the pilot area; not used in the calculation yet";

const NOMBRES_ENLACES = {
  repositorio: "Code, data and tests on GitHub",
  pruebas_md: "Latest automated test log",
  readme_ia: "Full declaration in the README",
};

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

function num(v) {
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
/** Número leído de los datos (hasta dos decimales); «—» si no es número. */
function fmt(v) {
  const n = num(v);
  return n == null ? "—" : formateador({ maximumFractionDigits: 2 }).format(n);
}
function fmtPct(fraccion) {
  const n = num(fraccion);
  return n == null ? "—" : formateador({ style: "percent", maximumFractionDigits: 0 }).format(n);
}
/** Fecha ISO de los datos como «Nov 14, 2026, 19:37 UTC» (o el texto tal cual si no es fecha). */
function fmtFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  const conHora = /T\d/.test(String(iso));
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: "medium",
    ...(conHora ? { timeStyle: "short", timeZone: "UTC" } : { timeZone: "UTC" }),
  }).format(d) + (conHora ? " UTC" : "");
}

function unicos(lista) {
  return [...new Set(lista.filter((x) => x != null && x !== ""))];
}

/** Inserta css/acerca.css (relativa a este módulo) si la página aún no la enlaza. */
function asegurarHoja() {
  if (typeof document === "undefined") return;
  const yaEsta = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) =>
    (l.getAttribute("href") || "").endsWith("acerca.css"),
  );
  if (yaEsta) return;
  const enlace = document.createElement("link");
  enlace.rel = "stylesheet";
  enlace.href = new URL(HOJA, import.meta.url).href;
  document.head.appendChild(enlace);
}

/** sessionStorage puede no existir o lanzar (ventana privada, sitio bloqueado): siempre en try/catch. */
function leerSesion(llave) {
  try {
    return window.sessionStorage.getItem(llave);
  } catch {
    return null;
  }
}
function escribirSesion(llave, valor) {
  try {
    window.sessionStorage.setItem(llave, valor);
  } catch {
    // sin almacenamiento: la pantalla se cierra igual; puede volver a aparecer al recargar
  }
}

function insignia(estado, tabla = ESTADOS) {
  const e = tabla[estado] || { texto: String(estado ?? "Unknown"), simbolo: "?" };
  const clase = String(estado ?? "desconocido").replace(/\s+/g, "-");
  return `<span class="acerca-estado acerca-estado--${esc(clase)}"><span class="acerca-estado-simbolo" aria-hidden="true">${e.simbolo}</span> ${esc(e.texto)}</span>`;
}

function enlace(url, texto) {
  if (!url) return "";
  return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(texto)}<span class="solo-lector"> (opens in a new tab)</span></a>`;
}

function nombreArchivo(ruta) {
  return String(ruta ?? "").split("/").pop();
}

// ---------------------------------------------------------------------------
// Pantalla de inicio
// ---------------------------------------------------------------------------
export function montarInicio(contenedor = typeof document !== "undefined" ? document.body : null, opciones = {}) {
  if (!contenedor || leerSesion(LLAVE_INICIO)) return null;
  asegurarHoja();
  const id = `acerca-inicio-${++contador}`;
  const previo = document.activeElement;

  const fondo = document.createElement("div");
  fondo.className = "acerca-inicio";
  fondo.innerHTML = `
    <section class="acerca-inicio-tarjeta" role="dialog" aria-modal="true" aria-labelledby="${id}-titulo" aria-describedby="${id}-lema" tabindex="-1">
      <button type="button" class="acerca-inicio-x" aria-label="Close the introduction"><span aria-hidden="true">×</span></button>
      <h2 class="acerca-inicio-titulo" id="${id}-titulo">ROOT – From Dam to Root</h2>
      <p class="acerca-inicio-lema" id="${id}-lema">Before you plant, see the water you are committing.</p>
      <ol class="acerca-inicio-pasos">
        ${PASOS_INICIO.map((p) => `<li><strong>${esc(p.titulo)}</strong><span>${esc(p.texto)}</span></li>`).join("")}
      </ol>
      <p class="acerca-inicio-aviso">${esc(AVISO_JUICIO)}</p>
      <button type="button" class="acerca-inicio-boton">Start exploring</button>
    </section>`;
  const tarjeta = fondo.querySelector(".acerca-inicio-tarjeta");
  let cerrada = false;

  function enfocables() {
    // Enfocables con Tab: tabIndex no negativo (la tarjeta misma lleva tabindex negativo y no cuenta).
    return Array.from(tarjeta.querySelectorAll("button, a[href], [tabindex]")).filter(
      (el) => !el.disabled && el.tabIndex >= 0,
    );
  }
  function alTeclear(ev) {
    if (ev.key === "Escape") {
      ev.preventDefault();
      ev.stopPropagation(); // que Escape no cierre además otra cosa de la página (p. ej., la ficha)
      cerrar();
    } else if (ev.key === "Tab") {
      // Trampa de foco: Tab y Mayús+Tab circulan dentro de la tarjeta.
      const lista = enfocables();
      if (!lista.length) return;
      const primero = lista[0];
      const ultimo = lista[lista.length - 1];
      if (ev.shiftKey && (document.activeElement === primero || document.activeElement === tarjeta)) {
        ev.preventDefault();
        ultimo.focus();
      } else if (!ev.shiftKey && document.activeElement === ultimo) {
        ev.preventDefault();
        primero.focus();
      }
    }
  }
  function cerrar() {
    if (cerrada) return;
    cerrada = true;
    escribirSesion(LLAVE_INICIO, "cerrado");
    document.removeEventListener("keydown", alTeclear, true);
    fondo.remove();
    if (previo && typeof previo.focus === "function" && document.contains(previo)) previo.focus();
    if (typeof opciones.alCerrar === "function") opciones.alCerrar();
  }

  fondo.querySelector(".acerca-inicio-x").addEventListener("click", cerrar);
  fondo.querySelector(".acerca-inicio-boton").addEventListener("click", cerrar);
  fondo.addEventListener("click", (ev) => {
    if (ev.target === fondo) cerrar(); // clic fuera de la tarjeta
  });
  document.addEventListener("keydown", alTeclear, true);
  contenedor.appendChild(fondo);
  fondo.querySelector(".acerca-inicio-boton").focus();
  return { elemento: fondo, cerrar };
}

// ---------------------------------------------------------------------------
// About & Data: datos NASA
// ---------------------------------------------------------------------------
/** Primer tramo de la fuente registrada, antes de « vía », «;» o «,» fuera de paréntesis. */
function productoCorto(fuente) {
  const s = String(fuente ?? "").trim();
  let prof = 0;
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (c === "(") prof += 1;
    else if (c === ")") prof = Math.max(0, prof - 1);
    else if (prof === 0 && (c === ";" || c === ",")) return s.slice(0, i).trim();
    else if (prof === 0 && /^ (vía|via) /i.test(s.slice(i, i + 5))) return s.slice(0, i).trim();
  }
  return s;
}

/** Nombre del archivo sin extensión ni sufijo de zona («demanda_cultivos_lazaro_cardenas.csv» -> «demanda_cultivos»). */
function baseArchivo(f, zonasIds) {
  let base = nombreArchivo(f?.archivo).replace(/\.[^.]+$/, "");
  const zonas = unicos([f?.zona, ...zonasIds]);
  for (const z of zonas) {
    if (base.endsWith(`_${z}`)) return base.slice(0, -(z.length + 1));
  }
  return base;
}

function usoDe(f, familia, zonasIds, tormentas) {
  const base = baseArchivo(f, zonasIds);
  if (familia.id === "imerg" && base.startsWith("imerg")) {
    return tormentas.some((t) => familia.patron.test(t)) ? USO_IMERG_TORMENTA : USO_IMERG_RESERVA;
  }
  const uso = USOS[base];
  if (typeof uso === "string") return uso;
  if (uso && typeof uso === "object") return uso[familia.id] ?? uso["*"];
  return f?.pieza ? `Input of kit piece ${f.pieza}` : nombreArchivo(f?.archivo);
}

/** Quita los productos que son el principio de otro («NASA HLS v…» dentro de «NASA HLS v… (…)»). */
function sinPrefijos(lista) {
  return lista.filter((p) => !lista.some((q) => q !== p && q.startsWith(p)));
}

function filasNasa(manifest, cubo, relieve) {
  const fuentes = Array.isArray(manifest?.fuentes_de_origen) ? manifest.fuentes_de_origen : [];
  const enCache = new Set((cubo?.meta?.fuentes || []).map(nombreArchivo));
  const zonasIds = Object.keys(cubo?.zonas || {});
  const zonasRelieve = Object.values(relieve?.zonas || {});
  const tormentas = zonasRelieve.map((z) => String(z?.tormenta?.fuente ?? "")).filter(Boolean);
  const filas = [];
  const usadas = new Set();
  for (const familia of FAMILIAS) {
    const miembros = fuentes.filter((f) => familia.patron.test(String(f?.fuente ?? "")));
    if (!miembros.length) continue;
    miembros.forEach((f) => usadas.add(f));
    const cortos = miembros.map((f) => productoCorto(f.fuente));
    let productos = sinPrefijos(unicos(cortos.filter((p) => familia.producto.test(p))));
    if (!productos.length) productos = unicos(cortos).slice(0, 1);
    const escala = familia.id === "nasadem" ? unicos(zonasRelieve.map((z) => z?.rotulo)) : [];
    filas.push({
      familia,
      productos,
      escala,
      usos: unicos(miembros.map((f) => usoDe(f, familia, zonasIds, tormentas))),
      archivos: miembros.map((f) => ({ ...f, enCache: enCache.has(nombreArchivo(f.archivo)) })),
    });
  }
  const otras = fuentes.filter((f) => !usadas.has(f));
  return { filas, otras, hayCache: enCache.size > 0 };
}

function htmlArchivo(f, hayCache) {
  const cache = hayCache
    ? f.enCache
      ? `<span class="acerca-cache">in the build cache</span>`
      : `<span class="acerca-cache acerca-cache--no">not in the build cache</span>`
    : "";
  const detalle = [
    f.fecha ? `Date: ${esc(f.fecha)}` : "",
    f.script ? `Script: <code>${esc(f.script)}</code>` : "",
  ].filter(Boolean).join(" · ");
  return `<li><details><summary><code>${esc(nombreArchivo(f.archivo))}</code> ${cache}</summary>` +
    `<p class="acerca-fuente-registrada" lang="es">${esc(f.fuente)}</p>` +
    (detalle ? `<p class="acerca-pie">${detalle}</p>` : "") +
    `</details></li>`;
}

/** Por qué falta un archivo opcional: «was not built (…)» si no existe (404); si no, «could not be read (…)». */
function motivoFalta(archivo, error, comoConstruir) {
  if (error?.estado === "ausente") return `${archivo} was not built (${comoConstruir})`;
  return `${archivo} could not be read${error?.detalle ? ` (${error.detalle})` : ""}`;
}

function htmlDatosNasa(manifest, cubo, relieve, id, error) {
  const cabeza = `<h3 id="${id}-nasa">NASA data</h3>`;
  if (!manifest) {
    return `<section class="acerca-bloque" aria-labelledby="${id}-nasa">${cabeza}` +
      `<p class="acerca-vacio">The list of data sources is not available: ${esc(motivoFalta("manifest.json", error, "python construir.py"))}.</p></section>`;
  }
  const { filas, otras, hayCache } = filasNasa(manifest, cubo, relieve);
  const cuerpo = filas.length
    ? `<div class="acerca-tabla-caja"><table class="acerca-tabla">
        <caption class="solo-lector">NASA data used by ROOT, read from manifest.json</caption>
        <thead><tr><th scope="col">Data</th><th scope="col">Product</th><th scope="col">What ROOT uses it for</th><th scope="col">Files and recorded source</th></tr></thead>
        <tbody>${filas
          .map(
            (r) => `<tr data-familia="${esc(r.familia.id)}">
              <th scope="row" data-etiqueta="Data">${esc(r.familia.dato)}</th>
              <td data-etiqueta="Product">${r.productos.map((p) => `<span class="acerca-producto">${esc(p)}</span>`).join("")}` +
              (r.escala.length ? `<span class="acerca-escala">Scale: ${r.escala.map(esc).join(" · ")}</span>` : "") +
              `</td>
              <td data-etiqueta="What ROOT uses it for"><ul class="acerca-usos">${r.usos.map((u) => `<li>${esc(u)}</li>`).join("")}</ul></td>
              <td data-etiqueta="Files and recorded source"><ul class="acerca-archivos">${r.archivos.map((f) => htmlArchivo(f, hayCache)).join("")}</ul></td>
            </tr>`,
          )
          .join("")}</tbody></table></div>`
    : `<p class="acerca-vacio">No NASA data source is recorded in manifest.json yet.</p>`;
  const otrasHtml = otras.length
    ? `<details class="acerca-otras"><summary>Other sources in the build</summary><ul class="acerca-archivos">${otras
        .map(
          (f) => `<li><details><summary><code>${esc(nombreArchivo(f.archivo))}</code> <span lang="es">${esc(productoCorto(f.fuente))}</span></summary>` +
            `<p class="acerca-fuente-registrada" lang="es">${esc(f.fuente)}</p>` +
            (f.fecha ? `<p class="acerca-pie">Date: ${esc(f.fecha)}</p>` : "") + `</details></li>`,
        )
        .join("")}</ul></details>`
    : "";
  return `<section class="acerca-bloque" aria-labelledby="${id}-nasa">${cabeza}` +
    `<p class="acerca-ayuda">Each product, date and source below is copied from manifest.json, which the build writes from the team deliveries. Resolutions are stated in each recorded source.</p>` +
    cuerpo + otrasHtml + htmlEscalas(filas, manifest, relieve, id) + `</section>`;
}

/** Cómo encajan las escalas (kit C5: armonización de resoluciones), solo con los datos presentes. */
function htmlEscalas(filas, manifest, relieve) {
  const hay = new Set(filas.map((r) => r.familia.id));
  const rotulos = unicos(Object.values(relieve?.zonas || {}).map((z) => z?.rotulo));
  const ftw = (manifest?.fuentes_de_origen || []).some((f) => /Fields of The World/i.test(String(f?.fuente ?? "")));
  const items = [];
  if (hay.has("hls")) items.push("HLS greenness is summarized per field, month by month.");
  if (hay.has("power")) {
    items.push("NASA POWER weather is one grid-cell series per pilot area, so fields with the same rotation in the same area share one water need.");
  }
  if (hay.has("nasadem")) {
    items.push(
      `NASADEM terrain is read at zone scale${rotulos.length ? ` (${rotulos.map(esc).join(" · ")})` : ""}: ` +
        "the slope and run-on shown for each field are context, not detail inside the field.",
    );
  }
  if (ftw) {
    items.push("Field boundaries are neural-network predictions from Fields of The World, used outside the model's training domain and filtered by confidence.");
  }
  if (!items.length) return "";
  return `<h4 class="acerca-subtitulo">How the scales fit together</h4><ul class="acerca-escalas">${items
    .map((t) => `<li>${t}</li>`)
    .join("")}</ul>`;
}

// ---------------------------------------------------------------------------
// About & Data: pruebas
// ---------------------------------------------------------------------------
function nombreZona(id, cubo) {
  return cubo?.zonas?.[id]?.nombre_mostrar || cubo?.zonas?.[id]?.nombre || id;
}

function textoMetrica(m, cubo) {
  let valor = fmt(m.valor);
  if (num(m.total) != null) valor += ` of ${fmt(m.total)}`;
  if (m.unidad) valor += ` ${m.unidad}`;
  if (num(m.fraccion) != null) valor += ` (${fmtPct(m.fraccion)})`;
  const zona = m.zona ? ` — ${nombreZona(m.zona, cubo)}` : "";
  return `<span class="acerca-metrica-etiqueta">${esc(m.etiqueta)}${esc(zona)}:</span> <strong>${esc(valor)}</strong>`;
}

function htmlPrueba(p, cubo) {
  const numero = num(p.numero);
  const metricas = Array.isArray(p.metricas) && p.metricas.length
    ? `<ul class="acerca-metricas">${p.metricas.map((m) => `<li>${textoMetrica(m, cubo)}</li>`).join("")}</ul>`
    : "";
  const partes = Array.isArray(p.partes) && p.partes.length
    ? `<ul class="acerca-partes">${p.partes
        .map(
          (x) => `<li>${insignia(x.estado)} <span class="acerca-parte-nombre">${esc(x.nombre)}</span>` +
            (x.nota ? `<span class="acerca-parte-nota">${esc(x.nota)}</span>` : "") + `</li>`,
        )
        .join("")}</ul>`
    : "";
  const fuentes = unicos(p.fuentes || []);
  return `<li class="acerca-prueba" data-prueba="${esc(p.id)}" data-estado="${esc(p.estado)}"${numero != null ? ` value="${numero}"` : ""}>
      <div class="acerca-prueba-cabeza"><h4 class="acerca-prueba-titulo">${esc(p.titulo)}</h4>${insignia(p.estado)}</div>
      <p class="acerca-criterio"><span class="acerca-rotulo">Criterion, declared before the result:</span> ${esc(p.criterio)}</p>
      ${p.resumen ? `<p class="acerca-resumen">${esc(p.resumen)}</p>` : ""}
      ${metricas}${partes}
      ${fuentes.length ? `<p class="acerca-pie">Source: ${fuentes.map((f) => `<code>${esc(f)}</code>`).join(" · ")}</p>` : ""}
    </li>`;
}

function htmlPuerta(puerta, id) {
  if (!puerta) return "";
  const pasos = Array.isArray(puerta.pasos) ? puerta.pasos : [];
  const tabla = pasos.length
    ? `<details class="acerca-pasos"><summary>Steps of the last recorded run</summary>
        <div class="acerca-tabla-caja"><table class="acerca-tabla acerca-tabla--pasos">
          <thead><tr><th scope="col">Step</th><th scope="col">Result</th><th scope="col">Detail (as logged)</th></tr></thead>
          <tbody>${pasos
            .map(
              (s) => `<tr><th scope="row" data-etiqueta="Step">${esc(s.nombre || s.id)}</th>` +
                `<td data-etiqueta="Result">${insignia(s.estado, ESTADOS_PASO)}</td>` +
                `<td data-etiqueta="Detail (as logged)" lang="es">${esc(s.detalle)}</td></tr>`,
            )
            .join("")}</tbody></table></div></details>`
    : "";
  return `<div class="acerca-puerta" data-estado="${esc(puerta.estado)}">
      <div class="acerca-prueba-cabeza"><h4 class="acerca-prueba-titulo" id="${id}-puerta">Automated gate</h4>${insignia(puerta.estado, ESTADOS_PASO)}</div>
      <p><code>${esc(puerta.comando || "python construir.py")}</code> rebuilds everything from the cached data and runs every check; the site is published when, and just when, they pass.</p>
      <p class="acerca-pie">Last recorded run: ${esc(fmtFecha(puerta.corrida))} · <code>${esc(puerta.fuente || "")}</code></p>
      ${puerta.nota ? `<p class="acerca-pie">${esc(puerta.nota)}</p>` : ""}
      ${tabla}
    </div>`;
}

function htmlPruebas(pruebas, cubo, id, error) {
  const cabeza = `<h3 id="${id}-pruebas">Tests in sight</h3>`;
  const lista = Array.isArray(pruebas?.pruebas) ? pruebas.pruebas : null;
  if (!lista) {
    // Archivo leído pero sin la lista de pruebas: tampoco es «not built».
    const motivo = pruebas && !error ? { estado: "error", detalle: "no test list in the file" } : error;
    return `<section class="acerca-bloque" aria-labelledby="${id}-pruebas">${cabeza}` +
      `<p class="acerca-vacio">Test results are not available: ${esc(motivoFalta("pruebas.json", motivo, "python construir.py"))}.</p></section>`;
  }
  return `<section class="acerca-bloque" aria-labelledby="${id}-pruebas">${cabeza}
      <p class="acerca-ayuda">Each criterion was declared before seeing the result${
        pruebas.fuente_criterios ? ` (<code>${esc(pruebas.fuente_criterios)}</code>)` : ""
      }. Every result is published here the same way: favorable, unfavorable or not run.</p>
      <ol class="acerca-pruebas">${lista.map((p) => htmlPrueba(p, cubo)).join("")}</ol>
      ${htmlPuerta(pruebas.puerta, id)}
      ${pruebas.generado ? `<p class="acerca-pie">Test status read from the repository on ${esc(fmtFecha(pruebas.generado))} (<code>web/data/pruebas.json</code>).</p>` : ""}
    </section>`;
}

// ---------------------------------------------------------------------------
// About & Data: rastro de cifras, repo, IA y aviso
// ---------------------------------------------------------------------------
function htmlRastro(manifest) {
  const r = manifest?.resumen;
  if (!r) return "";
  const simuladas = num(r.simuladas);
  // El manifest registra las cifras de cubo.json, parcelas.geojson, explicaciones.json, relieve.json y
  // pruebas.json (construir.py lo regenera después del paso 5c): la frase dice lo que hay.
  return `<p class="acerca-rastro">Every figure on this page, test results included, is traced in <code>manifest.json</code> with its source, date and script: ` +
    `<strong>${esc(fmt(r.cifras))}</strong> figures from <strong>${esc(fmt(r.fuentes_de_origen))}</strong> source files` +
    (simuladas != null ? `, <strong>${esc(fmt(simuladas))}</strong> of them simulated` : "") +
    (manifest.generado ? `. Generated ${esc(fmtFecha(manifest.generado))}.` : ".") +
    (manifest.mock ? ` <span class="acerca-simulado">Simulated data: not real fields or measurements.</span>` : "") +
    `</p>`;
}

function htmlCierre(pruebas, id) {
  const enlaces = pruebas?.enlaces || {};
  const ligas = [enlace(enlaces.repositorio, NOMBRES_ENLACES.repositorio), enlace(enlaces.pruebas_md, NOMBRES_ENLACES.pruebas_md)]
    .filter(Boolean)
    .join(" · ");
  return `<section class="acerca-bloque" aria-labelledby="${id}-repo">
      <h3 id="${id}-repo">Repository and AI</h3>
      ${ligas ? `<p class="acerca-ligas">${ligas}</p>` : ""}
      <p class="acerca-ia"><strong>SI/AI tools used:</strong> Claude Code, Claude and Gemini helped write the code, data scripts and texts; field boundaries are neural-network predictions (Fields of The World). AI never generates the numbers or makes the decision: farmers and technicians decide.${
        enlaces.readme_ia ? ` ${enlace(enlaces.readme_ia, NOMBRES_ENLACES.readme_ia)}.` : ""
      }</p>
      <p class="acerca-aviso">${esc(AVISO_JUICIO)}</p>
      <p class="acerca-limites">${esc(LIMITES)}</p>
    </section>`;
}

export function montarAcerca(contenedor, ctx = {}) {
  if (!contenedor) return null;
  asegurarHoja();
  const { manifest = null, pruebas = null, cubo = null, relieve = null, errores = {} } = ctx || {};
  const id = `acerca-${++contador}`;
  const seccion = document.createElement("section");
  seccion.className = "acerca";
  seccion.setAttribute("aria-labelledby", `${id}-titulo`);
  seccion.innerHTML = `
    <h2 class="acerca-titulo" id="${id}-titulo">About &amp; Data</h2>
    <p class="acerca-entrada">Where the numbers come from and how we test them. No number in this section is typed by hand: each one is read from the data files.</p>
    ${htmlRastro(manifest)}
    ${htmlDatosNasa(manifest, cubo, relieve, id, errores?.manifest)}
    ${htmlPruebas(pruebas, cubo, id, errores?.pruebas)}
    ${htmlCierre(pruebas, id)}`;
  contenedor.replaceChildren(seccion);
  return {
    elemento: seccion,
    destruir() {
      seccion.remove();
    },
  };
}
