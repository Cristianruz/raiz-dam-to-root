// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// web/js/dashboard.js — Tablero (portada de la aplicación, web/index.html).
// La interfaz lee las cifras publicadas en web/data/. Los cálculos reutilizan reglas.js, sin otro modelo.
// - Cuatro idiomas: todo texto visible sale de t("tablero.…") (js/textos_tablero.js); los números, de fmtNumero
//   y las fechas, de fmtFecha (js/i18n.js). Al cambiar el idioma se vuelve a pintar todo, sin recargar.
// - Los textos que vienen de los datos se leen con deDato (variantes _es, _pt y _fr junto a la llave) y pasan
//   por esc() antes de entrar a innerHTML.
// - El mapa usa las teselas de OpenStreetMap (las mismas del explorador) y, sin red o sin WebGL, el modo local.
import {
  t,
  tiene,
  idioma,
  alCambiarIdioma,
  fmtNumero,
  fmtFecha,
  deDato,
} from "./i18n.js";
import {
  prepararInterfaz,
  prepararIdioma,
  pintarTextos,
  pintarIdioma,
  icono,
} from "./interfaz.js";
import { crearAsesor } from "./asesor.js";
import { formatoHa, nombreOpcion } from "./recomendador.js";
import { montarInstalacion } from "./instalar.js";
import {
  aguaComprometida,
  evaluarOpcion,
  hectareasQueAlcanzan,
} from "../reglas.js";

const $ = (s) => document.querySelector(s);
const PRODUCTO = "ROOT – From Dam to Root"; // el nombre no se traduce
const fmt = (n, digits = 1) =>
  Number.isFinite(n)
    ? fmtNumero(n, { maximumFractionDigits: digits })
    : t("tablero.sin_dato");
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
// Texto del tablero listo para innerHTML (los valores pueden traer identificadores de los datos).
const T = (clave, valores) => esc(t(clave, valores));
const icons = {
  alfalfa: "♧",
  nogal: "♣",
  chile: "🌶",
  algodon: "✿",
  maiz_forrajero: "🌽",
  sorgo: "♧",
  cereal_invierno: "🌾",
  descanso: "◌",
  barbecho: "◌",
};
const years = (term) =>
  term.min === term.max
    ? t(term.min === 1 ? "tablero.anio" : "tablero.anios", {
        n: fmt(term.min, 0),
      })
    : t("tablero.anios_rango", {
        min: fmt(term.min, 0),
        max: fmt(term.max, 0),
      });
// Nombre de un cultivo por su identificador del cubo; uno desconocido se muestra como viene.
const cropName = (id) =>
  tiene(`tablero.cultivo.${id}`, "en")
    ? t(`tablero.cultivo.${id}`)
    : String(id ?? t("tablero.cultivo.sin_clasificar")).replaceAll("_", " ");
// Nombre de una opción de rotación de dashboard.json; una desconocida, con el nombre que traigan los datos.
const optionName = (r) =>
  tiene(`tablero.opcion.${r.id}`, "en")
    ? t(`tablero.opcion.${r.id}`)
    : (deDato(r, "nombre") ?? String(r.id ?? ""));
// Por vista: claves del título, de la descripción y del rótulo de la ruta. Las llaves son los identificadores
// de las vistas (hash, data-view y data-panel), que usan las hojas de estilo y las pruebas.
const vistas = {
  resumen: ["tablero.titulo", "tablero.lema", "tablero.nav.resumen"],
  terreno: [
    "tablero.vista.terreno.titulo",
    "tablero.vista.terreno.desc",
    "tablero.nav.terreno",
  ],
  cultivos: [
    "tablero.vista.cultivos.titulo",
    "tablero.vista.cultivos.desc",
    "tablero.nav.cultivos",
  ],
  recomendaciones: [
    "tablero.nav.comparar",
    "tablero.vista.comparar.desc",
    "tablero.nav.comparar",
  ],
  predicciones: [
    "tablero.nav.historia",
    "tablero.vista.historia.desc",
    "tablero.nav.historia",
  ],
};
const state = {
  zone: null,
  field: null,
  allocation: null,
  rain: 0,
  filter: "todos",
  view: "resumen",
  map: null,
  mapReady: false,
};
let cube, geo, research, soil;
let soilError = false;
let asesor = null;
let interfaz = null;
let mapMode = "agua";
let selectionMarker = null;
let mapBlock, mapAnchor;
// Aviso bajo el mapa: clave del texto y si se agrega «también puedes elegir en el listado» (modo local).
let notaMapa = { clave: "tablero.mapa.nota", lista: false };
let fallo = null; // error de carga, para volver a decirlo en otro idioma

async function read(path) {
  const r = await fetch(path);
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}
function features() {
  return geo.features.filter((f) => f.properties.zona === state.zone);
}
function selected() {
  return geo.features.find((f) => f.properties.id === state.field);
}
function options() {
  return cube.parcelas[state.field]?.opciones ?? [];
}
function current() {
  return options().find((o) => o.id === "ACTUAL");
}
function zone() {
  return cube.zonas[state.zone];
}
// Hectáreas con el MISMO formato del plan y de la ficha del explorador (formatoHa: los decimales del área,
// hacia abajo y nunca más que el área), para que las cuatro vistas digan el mismo número.
const haDe = (areaHa) => formatoHa(areaHa);
function fieldLabel(f) {
  const p = f.properties;
  return `${p.id} · ${p.abstencion ? t("tablero.cultivo.sin_clasificar") : cropName(p.cultivo_actual)} · ${haDe(p.area_ha)(p.area_ha)} ha`;
}
// Enlace a la ficha de la parcela en el explorador (explorer.html#<id>).
function explorerLink(id) {
  return id ? `explorer.html#${encodeURIComponent(id)}` : "explorer.html";
}
// Todos los enlaces «Abrir el explorador» llevan la parcela elegida (el de «Acerca y datos» no es de una parcela).
function enlacesAlExplorador() {
  const destino = explorerLink(selected()?.properties.id);
  document
    .querySelectorAll('a[href^="explorer.html"]:not(.icon-button)')
    .forEach((a) => a.setAttribute("href", destino));
}

// Zona, parcela, dotación y lluvia se conservan entre visitas de la misma sesión (ida y vuelta al explorador,
// recarga). Si el navegador no deja usar sessionStorage (navegación privada), se sigue sin él.
const LLAVE_ESTADO = "root.tablero.estado";
function leerEstadoGuardado() {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(LLAVE_ESTADO) ?? "null");
    return guardado && typeof guardado === "object" ? guardado : {};
  } catch {
    return {};
  }
}
function recordarEstado() {
  try {
    sessionStorage.setItem(
      LLAVE_ESTADO,
      JSON.stringify({
        zona: state.zone,
        parcela: state.field,
        dotacion: state.allocation,
        lluvia: state.rain,
      }),
    );
  } catch {
    // sin almacenamiento: el estado vale para esta visita
  }
}

// Título, descripción y ruta de la vista en uso, y el título de la pestaña del navegador.
function pintarCabecera() {
  const [titulo, descripcion, ruta] = vistas[state.view];
  $("#page-title").textContent = t(titulo);
  $("#page-description").textContent = t(descripcion);
  $("#breadcrumb").textContent = t(ruta);
  document.title = `${PRODUCTO} · ${t(titulo)}`;
}
function route() {
  let view = location.hash.slice(1) || "resumen";
  // Un hash con el ID de una parcela abre esa parcela en la vista del terreno.
  const linked = geo?.features.find((f) => f.properties.id === view);
  if (linked) {
    $("#zona-dashboard").value = linked.properties.zona;
    if (state.zone !== linked.properties.zona) changeZone();
    chooseField(linked.properties.id);
    view = "terreno";
  }
  state.view = Object.hasOwn(vistas, view) ? view : "resumen";
  document.querySelectorAll("[data-panel]").forEach((el) => {
    el.hidden = el.dataset.panel !== state.view;
  });
  document.querySelectorAll("nav [data-view]").forEach((el) => {
    const active = el.dataset.view === state.view;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  pintarCabecera();
  if (mapBlock) {
    if (state.view === "terreno") $("#terrain-slot").append(mapBlock);
    else mapAnchor.after(mapBlock);
    requestAnimationFrame(() => state.map?.resize());
  }
  window.scrollTo({ top: 0, behavior: "instant" });
}

function stats() {
  const z = zone();
  const committed = aguaComprometida(z, state.allocation, state.rain);
  const percent =
    committed.p50 == null ? "—" : `${fmt(committed.p50 * 100, 0)}%`;
  // Textos del tablero y números con formato: nada de esto llega como texto de los datos.
  const rows = [
    [
      T("tablero.cifra.superficie"),
      `${fmt(z.superficie_total_ha, 0)} <small>ha</small>`,
      T("tablero.cifra.superficie_nota"),
      "⌘",
    ],
    [
      T("tablero.cifra.parcelas"),
      fmt(z.conteos.total, 0),
      T("tablero.cifra.parcelas_nota", {
        n: fmt(z.conteos.total - z.conteos.abstenida, 0),
      }),
      "♧",
    ],
    [
      T("tablero.cifra.comprometida"),
      percent,
      committed.sinDotacion
        ? T("tablero.cifra.sin_dotacion_nota")
        : T("tablero.cifra.comprometida_nota"),
      "◉",
    ],
    [
      T("tablero.cifra.sin_clasificar"),
      `${fmt(committed.fraccionSinClasificar * 100, 0)}%`,
      T("tablero.cifra.sin_clasificar_nota"),
      "↗",
    ],
  ];
  $("#stats").innerHTML = rows
    .map(
      ([title, value, sub, icon]) =>
        `<article class="stat"><div class="stat-label">${title}<span>${icon}</span></div><div class="stat-value">${value}</div><div class="stat-caption">${sub}</div></article>`,
    )
    .join("");
  const commitment = $("#water-commitment");
  if (commitment)
    commitment.innerHTML = `<span class="commitment-icon">${icono("drop")}</span><div><strong>${committed.sinDotacion ? T("tablero.compromiso.sin_dotacion") : T("tablero.compromiso.al_menos", { pct: percent })}</strong><span>${T("tablero.compromiso.nota")}</span></div><a href="#recomendaciones" aria-label="${T("tablero.compromiso.aria")}">${icono("arrow")}</a>`;
  document
    .querySelectorAll("[data-allocation]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(Number(b.dataset.allocation) === state.allocation),
      ),
    );
  actualizarColoresMapa();
  $("#allocation-value").textContent = fmt(state.allocation);
  $("#scenario-label").textContent =
    `${t("tablero.escenario", { dotacion: fmt(state.allocation), unidad: t("tablero.unidad"), lluvia: fmt(state.rain, 0) })} ↗`;
  ladoALado();
}

// Bloque del resumen «con la lluvia del registro y con menos lluvia»: las zonas piloto y las opciones de la
// parcela elegida, lado a lado. No hay otro cálculo: usa aguaComprometida y evaluarOpcion (reglas.js) con cada
// lluvia del cubo (cube.lluvia_pct) y la dotación del deslizador. La barra de la lluvia en uso va resaltada.
const CIEN = 100;
const DOS_DECIMALES = 2; // la lámina, como en «Comparar opciones»
function ladoALado() {
  const cajaZonas = $("#lado-zonas");
  const cajaOpciones = $("#lado-opciones");
  if (!cajaZonas || !cajaOpciones || !cube) return;
  const lluvias = cube.lluvia_pct;
  const rotulo = (r) =>
    r < 0 ? t("tablero.lado.menos", { pct: fmt(r, 0) }) : t("tablero.lado.registro");
  // Una barra: rótulo, pista con el relleno (fracción de «tope») y, si se pide, la marca de la dotación.
  const barra = ({ r, texto, valor, tope, cifra, marca = null }) => {
    const ancho =
      Number.isFinite(valor) && tope > 0 ? Math.min(1, valor / tope) * CIEN : 0;
    const clases = `lado-barra${r === state.rain ? " activa" : ""}`;
    const excede = marca != null && valor > 1 ? " excede" : "";
    const raya =
      marca == null
        ? ""
        : `<span class="lado-marca" style="left:${marca * CIEN}%"></span>`;
    return `<span class="${clases}"><span class="lado-rotulo">${esc(texto)}</span><span class="lado-pista"><span class="lado-relleno${excede}" style="width:${ancho}%"></span>${raya}</span><strong>${esc(cifra)}</strong></span>`;
  };
  // Zonas: agua que ya piden los perennes, como parte de la dotación elegida, con cada lluvia.
  const zonas = Object.entries(cube.zonas).map(([id, z]) => ({
    id,
    z,
    valores: lluvias.map((r) => aguaComprometida(z, state.allocation, r)),
  }));
  const tope = Math.max(
    1,
    ...zonas.flatMap((x) => x.valores.map((c) => c.p50 ?? 0)),
  );
  cajaZonas.innerHTML = zonas
    .map(
      ({ id, z, valores }) =>
        `<button type="button" class="lado-fila" data-zona="${esc(id)}" aria-pressed="${id === state.zone}"><span class="lado-nombre">${esc(z.nombre_mostrar)}</span><span class="lado-meta">${T("tablero.lado.zona_meta", { parcelas: fmt(z.conteos.total, 0), ha: fmt(z.superficie_total_ha, 0) })}</span>${valores
          .map((c, i) =>
            barra({
              r: lluvias[i],
              texto: rotulo(lluvias[i]),
              valor: c.p50,
              tope,
              // Kit §2.4: sin dotación no se divide (se dice «sin dotación»); con superficie sin clasificar la
              // cifra es un mínimo («al menos»); siempre con su rango p10–p90.
              cifra: c.sinDotacion
                ? t("tablero.compromiso.sin_dotacion")
                : t(c.alMenos ? "tablero.lado.al_menos" : "tablero.lado.pct", {
                    pct: `${fmt(c.p50 * CIEN, 0)}%`,
                    bajo: `${fmt(c.p10 * CIEN, 0)}%`,
                    alto: `${fmt(c.p90 * CIEN, 0)}%`,
                  }),
              marca: c.sinDotacion ? null : 1 / tope,
            }),
          )
          .join("")}</button>`,
    )
    .join("");
  // Kit §2.4: si los perennes piden más que la dotación, se dice de dónde sale la diferencia y se enlaza con
  // «Follow the drop», que está en la ficha de la parcela del explorador.
  const notaExcede = $("#lado-excede");
  if (notaExcede) {
    const pasa = zonas.some((x) => x.valores.some((c) => c.excede));
    notaExcede.hidden = !pasa;
    notaExcede.innerHTML = pasa
      ? `${T("tablero.lado.excede")} <a href="${esc(explorerLink(state.field))}">${T("tablero.lado.gota")} <span>↗</span></a>`
      : "";
  }
  // Opciones de la parcela elegida: hectáreas que la dotación cubre con la necesidad mediana, con cada lluvia.
  const p = selected()?.properties;
  $("#lado-opciones-titulo").textContent = p
    ? t("tablero.lado.opciones", { id: p.id })
    : t("tablero.lado.opciones_sin");
  const ops = p && !p.abstencion ? options() : [];
  if (!ops.length) {
    cajaOpciones.innerHTML = `<p class="micro">${T(p ? "tablero.lado.sin_opciones" : "tablero.ficha.sin_parcelas")}</p>`;
    return;
  }
  const ha = haDe(p.area_ha);
  cajaOpciones.innerHTML = ops
    .map(
      (op) =>
        `<div class="lado-fila"><span class="lado-nombre">${esc(nombreOpcion(op))}</span>${lluvias
          .map((r) => {
            const e = evaluarOpcion(op, p.area_ha, state.allocation, r);
            const pide =
              e.lamina.p50 > 0
                ? t("tablero.lado.pide", {
                    rotulo: rotulo(r),
                    lamina: fmt(e.lamina.p50, DOS_DECIMALES),
                    unidad: t("tablero.unidad"),
                  })
                : t("tablero.lado.sin_riego", { rotulo: rotulo(r) });
            // Kit §2.4: las hectáreas van con su rango (bajo con la estimación alta de la necesidad y al revés).
            const bajo = ha(e.hectareas.bajo);
            const alto = ha(e.hectareas.alto);
            return barra({
              r,
              texto: pide,
              valor: e.cobertura,
              tope: 1,
              cifra: t(
                bajo === alto ? "tablero.lado.ha" : "tablero.lado.ha_rango",
                {
                  cubiertas: ha(e.hectareas.p50),
                  area: ha(p.area_ha),
                  bajo,
                  alto,
                },
              ),
            });
          })
          .join("")}</div>`,
    )
    .join("");
}

function fieldList() {
  const query = $("#field-search").value.trim().toLocaleLowerCase(idioma());
  const list = features().filter((f) =>
    fieldLabel(f).toLocaleLowerCase(idioma()).includes(query),
  );
  $("#field-select").innerHTML = list.length
    ? list
        .map(
          (f) =>
            `<option value="${esc(f.properties.id)}">${esc(fieldLabel(f))}</option>`,
        )
        .join("")
    : `<option value="">${T("tablero.ficha.sin_coincidencias")}</option>`;
  if (list.some((f) => f.properties.id === state.field))
    $("#field-select").value = state.field;
}
// Buscar una parcela: la lista se filtra y, si la parcela abierta ya no está en ella, se abre la primera
// coincidencia, para que el selector y la ficha digan lo mismo. Si no hay coincidencias en esta zona y lo escrito
// es el ID de una parcela de otra zona piloto, se abre esa zona con su parcela.
function buscarParcela() {
  fieldList();
  const consulta = $("#field-search").value.trim().toLocaleLowerCase(idioma());
  if (!consulta) return;
  const ids = [...$("#field-select").options].map((o) => o.value).filter(Boolean);
  if (ids.length) {
    if (!ids.includes(state.field)) chooseField(ids[0]);
    return;
  }
  const otra = geo.features.find(
    (f) =>
      f.properties.zona !== state.zone &&
      String(f.properties.id).toLocaleLowerCase(idioma()) === consulta,
  );
  if (!otra) return;
  $("#zona-dashboard").value = otra.properties.zona;
  changeZone();
  chooseField(otra.properties.id);
}
// Clase de textura del perfil regional (suelo.json la trae en inglés): con nombre en los cuatro idiomas si es
// una de las conocidas; si no, como viene.
function texturaDe(clase) {
  const clave = `tablero.textura.${String(clase).replaceAll(" ", "_")}`;
  return tiene(clave, "en") ? t(clave) : String(clase);
}
function fieldDetails() {
  const p = selected()?.properties;
  enlacesAlExplorador();
  if (!p) {
    $("#field-detail").textContent = t("tablero.ficha.sin_parcelas");
    return;
  }
  const op = current();
  const evalOp =
    !p.abstencion && op
      ? evaluarOpcion(op, p.area_ha, state.allocation, state.rain)
      : null;
  const profile = soil?.perfil?.parcelas?.[p.id];
  const sinSuelo = soilError ? t("tablero.no_cargo") : t("tablero.sin_dato");
  const texture = profile?.clase_textura
    ? texturaDe(profile.clase_textura)
    : sinSuelo;
  const term = !p.abstencion && op?.agua?.plazo_anios;
  const termLabel = term ? years(term) : t("tablero.sin_dato");
  const sinCalculo = t("tablero.sin_calculo");
  // Kit §2.4: una lámina cero (descanso) se dice «no necesita riego», no «0».
  const demand = !evalOp
    ? sinCalculo
    : evalOp.lamina.p50 > 0
      ? `${fmt(evalOp.lamina.p50)} ${t("tablero.unidad")}`
      : t("tablero.ficha.sin_riego");
  // Porcentaje entero HACIA ABAJO, igual que el explorador (web/app.js, fmtCobertura): una dotación que no
  // alcanza no se lee con un punto de más, y las dos páginas dicen la misma cifra.
  const coverage = evalOp
    ? `${fmt(Math.floor(evalOp.cobertura * CIEN), 0)}%`
    : sinCalculo;
  const title = p.abstencion
    ? t("tablero.ficha.sin_clasificar")
    : cropName(p.cultivo_actual);
  const ancho =
    evalOp && Number.isFinite(evalOp.cobertura) ? evalOp.cobertura * 100 : 0;
  const pendiente = Number.isFinite(p.relieve?.pendiente_media_pct)
    ? `${fmt(p.relieve.pendiente_media_pct)}%`
    : t("tablero.sin_dato");
  const ha = haDe(p.area_ha);
  const nota = evalOp
    ? T("tablero.ficha.hectareas", {
        cubiertas: ha(evalOp.hectareas.p50),
        area: ha(p.area_ha),
        bajo: ha(evalOp.hectareas.bajo),
        alto: ha(evalOp.hectareas.alto),
      })
    : T("tablero.ficha.sin_calculo_nota");
  $("#field-detail").innerHTML =
    `<div class="field-title"><span class="crop-symbol">${icons[p.cultivo_actual] ?? "♧"}</span><div><h4>${esc(title)}</h4><p>${T("tablero.ficha.parcela", { id: p.id, area: ha(p.area_ha) })}</p></div></div>
        <div class="coverage">${T("tablero.ficha.cobertura")} <strong>${esc(coverage)}</strong><div class="progress"><div style="width:${ancho}%"></div></div></div>
        <p class="micro">${nota}</p>
        <dl class="field-metrics"><div><dt>${T("tablero.ficha.demanda")}</dt><dd>${esc(demand)}</dd></div><div><dt>${T("tablero.ficha.suelo")}</dt><dd>${esc(profile ? `pH ${fmt(profile.ph)}` : sinSuelo)}</dd></div><div><dt>${T("tablero.ficha.riego")}</dt><dd id="field-irrigation">${T("tablero.ficha.sin_registrar")}</dd></div><div><dt>${T("tablero.ficha.pendiente")}</dt><dd>${esc(pendiente)}</dd></div><div><dt>${T("tablero.ficha.textura")}</dt><dd>${esc(texture)}</dd></div><div><dt>${T("tablero.ficha.plazo")}</dt><dd>${esc(termLabel)}</dd></div></dl>
        <a class="field-link" href="${esc(explorerLink(p.id))}">${T("tablero.abrir_explorador")} <span>↗</span></a>`;
  asesor?.actualizar();
  updateHighlight();
  ladoALado();
}

function crops() {
  const rotations = research.rotaciones?.[state.zone];
  if (!rotations) {
    $("#crop-grid").textContent = t("tablero.cultivos.sin_datos");
    return;
  }
  const unidad = T("tablero.unidad");
  $("#crop-grid").innerHTML = rotations
    .map((r) => {
      const l = r.lamina_bruta_millares[String(state.rain)];
      const area = selected()?.properties.area_ha;
      const alcanza = hectareasQueAlcanzan(area, state.allocation, l);
      const ha = haDe(area);
      const crop = r.cultivos[0];
      const kc = cube.opciones_catalogo[r.id]?.secuencia?.[0]?.siembra;
      const planting =
        kc?.desde && kc?.hasta
          ? t("tablero.cultivos.siembra_rango", {
              desde: kc.desde,
              hasta: kc.hasta,
            })
          : t("tablero.cultivos.sin_siembra");
      const plazo =
        r.plazo === "anual"
          ? "tablero.cultivos.plazo.anual"
          : r.plazo === "nogal"
            ? "tablero.cultivos.plazo.huerta"
            : "tablero.cultivos.plazo.perenne";
      const nota = state.field
        ? T("tablero.cultivos.area", {
            id: state.field,
            cubiertas: ha(alcanza.p50),
            area: ha(area),
          })
        : T("tablero.cultivos.sin_parcela");
      return `<article class="card crop-card" data-rotacion="${esc(r.id)}"><span class="crop-symbol">${icons[crop] ?? "♧"}</span><h3>${esc(optionName(r))}</h3><span class="pill">${T(plazo)}</span><div class="water-number">${fmt(l.p50)} <small style="font-size:11px">${unidad}</small></div><p>${T("tablero.cultivos.rango", { bajo: fmt(l.p10), alto: fmt(l.p90) })}</p><div class="crop-meta"><span>${T("tablero.cultivos.compromiso")} <strong>${esc(years(r.plazo_anios))}</strong></span><span>${T("tablero.cultivos.siembra")} <strong>${esc(planting)}</strong></span><span>${T("tablero.cultivos.base")} <strong>${l.p50 === 0 ? T("tablero.cultivos.sin_riego") : T("tablero.cultivos.riego_modelado")}</strong></span></div><p class="micro">${nota}</p></article>`;
    })
    .join("");
}
function chart() {
  const values = research.historia ?? [];
  if (!values.length) {
    $("#history-chart").textContent = t("tablero.historia.sin_datos");
    return;
  }
  const max = Math.max(...values.map((x) => x.superficie_ha));
  // El año y la fuente vienen de dashboard.json: se escapan. La altura es un número calculado.
  const alto = (x) => {
    const pct = (x.superficie_ha / max) * 75;
    return Number.isFinite(pct) ? pct : 0;
  };
  $("#history-chart").innerHTML =
    `<div class="bars" role="img" aria-label="${T("tablero.historia.aria")}">${values.map((x) => `<div class="bar-group"><small>${fmt(x.superficie_ha, 0)}</small><div class="bar" style="height:${alto(x)}%" title="${esc(x.anio)}: ${fmt(x.superficie_ha, 0)} ha"></div><span>${esc(x.anio)}</span></div>`).join("")}</div><details class="micro"><summary>${T("tablero.historia.fuente_resumen")}</summary><p>${esc(deDato(research, "historia_fuente"))}</p><table><caption>${T("tablero.historia.tabla")}</caption><tbody>${values.map((x) => `<tr><th scope="row">${esc(x.anio)}</th><td>${fmt(x.superficie_ha, 0)}</td></tr>`).join("")}</tbody></table></details>`;
}
function eventosFiltrados() {
  return research.eventos.filter(
    (e) => state.filter === "todos" || e.tipo === state.filter,
  );
}
function timeline() {
  $("#timeline").innerHTML = eventosFiltrados()
    .map(
      (e) =>
        `<article class="event"><time>${esc(deDato(e, "periodo"))}</time><div><h3>${esc(deDato(e, "titulo"))}</h3><p>${esc(deDato(e, "detalle"))}</p><small>[P] ${esc(deDato(e, "fuente"))}</small></div></article>`,
    )
    .join("");
  document.querySelectorAll("[data-filter]").forEach((b) => {
    const active = b.dataset.filter === state.filter;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
}
function download(name, rows) {
  // Los números se escriben tal cual (un −20 debe seguir siendo un número en la hoja de cálculo).
  // A los textos que empiezan como fórmula se les antepone un apóstrofo para que la hoja no los ejecute.
  const cell = (value) => {
    if (typeof value === "number")
      return Number.isFinite(value) ? String(value) : "";
    const text = String(value ?? "");
    const seguro = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${seguro.replaceAll('"', '""')}"`;
  };
  const csv =
    "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
// Los nombres de las columnas van en inglés en los cuatro idiomas (un mismo archivo para quien lo procese).
function exportSummary() {
  const p = selected()?.properties,
    op = current();
  if (!p) return;
  const e =
    op && !p.abstencion
      ? evaluarOpcion(op, p.area_ha, state.allocation, state.rain)
      : null;
  download(`root-${state.field}-summary.csv`, [
    [
      "pilot_area",
      "field",
      "crop",
      "area_ha",
      "allocation_thousand_cubic_m_per_ha",
      "rain_change_pct",
      "water_need_low",
      "water_need_median",
      "water_need_high",
      "water_need_unit",
      "hectares_covered_median",
      "source",
      "scope",
    ],
    [
      zone().nombre_mostrar,
      p.id,
      p.abstencion ? "not_classified" : p.cultivo_actual,
      p.area_ha,
      state.allocation,
      state.rain,
      e?.lamina.p10,
      e?.lamina.p50,
      e?.lamina.p90,
      t("tablero.csv.unidad"),
      e?.hectareas.p50,
      `cubo.json + parcelas.geojson; ${cube.meta.script}`,
      t("tablero.csv.alcance"),
    ],
  ]);
}
function exportTimeline() {
  download("root-timeline.csv", [
    ["period", "type", "event", "detail", "source", "status"],
    ...eventosFiltrados().map((e) => [
      deDato(e, "periodo"),
      e.tipo,
      deDato(e, "titulo"),
      deDato(e, "detalle"),
      deDato(e, "fuente"),
      t("tablero.csv.estado"),
    ]),
  ]);
}
// Margen del encuadre del mapa: en teléfono el mapa va solo, sin tarjetas encima; en escritorio la ficha y
// la dotación flotan sobre el mapa.
function paddingMapa() {
  return window.innerWidth <= 850
    ? { top: 28, bottom: 28, left: 22, right: 22 }
    : { top: 90, bottom: 100, left: 105, right: 365 };
}
function chooseField(id) {
  if (!features().some((f) => f.properties.id === id)) return;
  state.field = id;
  recordarEstado();
  fieldDetails();
  crops();
  const f = selected();
  if (state.mapReady)
    state.map.fitBounds(boundsOf(f), {
      padding: paddingMapa(),
      maxZoom: 15,
      duration: 0,
    });
  if ([...$("#field-select").options].some((o) => o.value === id))
    $("#field-select").value = id;
}
function changeZone() {
  state.zone = $("#zona-dashboard").value;
  const fs = features();
  state.field = (
    fs.find((f) => f.properties.protagonista && !f.properties.abstencion) ??
    fs.find((f) => !f.properties.abstencion) ??
    fs[0]
  )?.properties.id;
  $("#field-search").value = "";
  recordarEstado();
  fieldList();
  accesosParcelas();
  stats();
  fieldDetails();
  crops();
  if (state.mapReady) {
    state.map.setFilter("fields-fill", ["==", ["get", "zona"], state.zone]);
    state.map.setFilter("fields-line", ["==", ["get", "zona"], state.zone]);
    state.map.fitBounds(zone().bbox, { padding: paddingMapa(), duration: 0 });
  }
  drawFallback();
}
function boundsOf(feature) {
  const points =
    feature.geometry.type === "MultiPolygon"
      ? feature.geometry.coordinates.flat(2)
      : feature.geometry.coordinates.flat();
  return [
    Math.min(...points.map((p) => p[0])),
    Math.min(...points.map((p) => p[1])),
    Math.max(...points.map((p) => p[0])),
    Math.max(...points.map((p) => p[1])),
  ];
}
function datosDelMapa() {
  return {
    ...geo,
    features: geo.features.map((f) => {
      const p = f.properties,
        op = cube.parcelas[p.id]?.opciones?.find((o) => o.id === "ACTUAL");
      const agua_estado =
        p.abstencion || !op
          ? "gris"
          : evaluarOpcion(op, p.area_ha, state.allocation, state.rain).semaforo;
      return { ...f, properties: { ...p, agua_estado } };
    }),
  };
}
function actualizarColoresMapa() {
  if (!$("#map-fallback").hidden) drawFallback();
  const agua = [
    "match",
    ["get", "agua_estado"],
    "verde",
    "#8ed665",
    "ambar",
    "#f1c263",
    "rojo",
    "#ed8b78",
    "#73837b",
  ];
  const cultivos = ["case", ["get", "abstencion"], "#73837b", "#8ed665"];
  if (state.mapReady) {
    state.map.getSource("fields").setData(datosDelMapa());
    state.map.setPaintProperty(
      "fields-fill",
      "fill-color",
      mapMode === "agua" ? agua : cultivos,
    );
    state.map.setPaintProperty(
      "fields-line",
      "line-color",
      mapMode === "agua" ? agua : cultivos,
    );
  }
  // Los mismos estados del semáforo que el explorador (web/app.js, SEMAFORO).
  const legend = $(".map-legend");
  if (legend)
    legend.innerHTML =
      mapMode === "agua"
        ? `<span><i class="legend-green"></i>${T("tablero.leyenda.verde")}</span><span><i class="legend-yellow"></i>${T("tablero.leyenda.ambar")}</span><span><i class="legend-red"></i>${T("tablero.leyenda.rojo")}</span><span><i class="legend-gray"></i>${T("tablero.leyenda.gris")}</span>`
        : `<span><i class="legend-green"></i>${T("tablero.leyenda.clasificado")}</span><span><i class="legend-gray"></i>${T("tablero.leyenda.gris")}</span>`;
}
function accesosParcelas() {
  const box = $("#scene-parcels");
  if (!box) return;
  let candidatos = features().filter(
    (f) => f.properties.protagonista && !f.properties.abstencion,
  );
  if (!candidatos.length)
    candidatos = features().filter((f) => !f.properties.abstencion);
  box.replaceChildren();
  for (const f of candidatos.slice(0, 3)) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.parcelChip = f.properties.id;
    b.textContent = `${f.properties.id} · ${cropName(f.properties.cultivo_actual)}`;
    b.onclick = () => chooseField(f.properties.id);
    box.append(b);
  }
}
function updateHighlight() {
  if (state.mapReady) {
    state.map.setFilter("selected-line", ["==", ["get", "id"], state.field]);
    const feature = selected();
    if (feature) {
      const bounds = boundsOf(feature);
      if (!selectionMarker) {
        const el = document.createElement("div");
        el.className = "map-selection-marker";
        // El marcador rotula la parcela elegida: es un indicador, no un control (sin punto de tabulación).
        el.setAttribute("role", "img");
        el.tabIndex = -1;
        selectionMarker = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        });
      }
      selectionMarker.getElement().textContent = state.field;
      selectionMarker
        .setLngLat([(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2])
        .addTo(state.map);
      selectionMarker.getElement().setAttribute("aria-label", state.field);
    }
  }
  document
    .querySelectorAll("[data-parcel-chip]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        String(b.dataset.parcelChip === state.field),
      ),
    );
  document
    .querySelectorAll(".fallback-field")
    .forEach((p) =>
      p.classList.toggle("selected", p.dataset.id === state.field),
    );
  puntoDeTabulacion();
}
// Modo local: un solo punto de tabulación para todo el mapa (el polígono elegido o, si no hay, el primero).
// De un polígono a otro se pasa con las flechas; Enter o la barra espaciadora lo eligen.
function puntoDeTabulacion() {
  const poligonos = [...document.querySelectorAll(".fallback-field")];
  const entrada = poligonos.find((p) => p.dataset.id === state.field) ?? poligonos[0];
  for (const p of poligonos) p.tabIndex = p === entrada ? 0 : -1;
}

// Modo local, sin teselas: los polígonos de la zona dibujados en SVG con los datos ya cargados.
function drawFallback() {
  const [west, south, east, north] = zone().bbox;
  const project = ([x, y]) =>
    `${((x - west) / (east - west)) * 600},${((north - y) / (north - south)) * 320}`;
  $("#map-fallback").innerHTML =
    `<svg viewBox="0 0 600 320" role="img" aria-label="${T("tablero.mapa.local_aria")}">${features()
      .map((f) => {
        const op = cube.parcelas[f.properties.id]?.opciones?.find(
          (o) => o.id === "ACTUAL",
        );
        const estado =
          f.properties.abstencion || !op
            ? "gris"
            : evaluarOpcion(
                op,
                f.properties.area_ha,
                state.allocation,
                state.rain,
              ).semaforo;
        const color =
          mapMode === "agua"
            ? ({
                verde: "#8ed665",
                ambar: "#f1c263",
                rojo: "#ed8b78",
                gris: "#73837b",
              }[estado] ?? "#73837b")
            : f.properties.abstencion
              ? "#73837b"
              : "#8ed665";
        const polygons =
          f.geometry.type === "MultiPolygon"
            ? f.geometry.coordinates
            : [f.geometry.coordinates];
        return polygons
          .map(
            (rings) =>
              `<path tabindex="-1" role="button" aria-label="${esc(fieldLabel(f))}" style="--field-color:${color}" class="fallback-field${f.properties.id === state.field ? " selected" : ""}" data-id="${esc(f.properties.id)}" d="${rings.map((ring) => "M" + ring.map(project).join(" L") + " Z").join(" ")}"><title>${esc(fieldLabel(f))}</title></path>`,
          )
          .join("");
      })
      .join("")}</svg>`;
  puntoDeTabulacion();
}
// Textos de los controles de la biblioteca del mapa, en el idioma en uso (opción «locale» de MapLibre).
function textosDelMapa() {
  return {
    "NavigationControl.ZoomIn": t("tablero.mapa.acercar"),
    "NavigationControl.ZoomOut": t("tablero.mapa.alejar"),
    "AttributionControl.ToggleAttribution": t("tablero.mapa.atribucion"),
    "CooperativeGesturesHandler.MobileHelpText": t("tablero.mapa.gesto_tactil"),
    "CooperativeGesturesHandler.WindowsHelpText": t("tablero.mapa.gesto_ctrl"),
    "CooperativeGesturesHandler.MacHelpText": t("tablero.mapa.gesto_cmd"),
    "Map.Title": t("tablero.mapa.aria"),
    "Marker.Title": t("tablero.nav.terreno"),
  };
}
// La biblioteca fija sus textos al crear el mapa: al cambiar el idioma se vuelven a poner en sus controles.
function rotularMapa() {
  const caja = $("#map");
  const poner = (selector, clave, atributos) => {
    const el = caja.querySelector(selector);
    if (!el) return;
    if (!atributos) el.textContent = t(clave);
    else for (const a of atributos) el.setAttribute(a, t(clave));
  };
  const rotulo = ["aria-label", "title"];
  poner(".maplibregl-ctrl-zoom-in", "tablero.mapa.acercar", rotulo);
  poner(".maplibregl-ctrl-zoom-out", "tablero.mapa.alejar", rotulo);
  poner(".maplibregl-ctrl-attrib-button", "tablero.mapa.atribucion", rotulo);
  poner(".maplibregl-canvas", "tablero.mapa.aria", ["aria-label"]);
  poner(".maplibregl-mobile-message", "tablero.mapa.gesto_tactil");
  const escritorio = caja.querySelector(".maplibregl-desktop-message");
  if (escritorio)
    escritorio.textContent = t(
      /mac/i.test(navigator.platform ?? "") ? "tablero.mapa.gesto_cmd" : "tablero.mapa.gesto_ctrl",
    );
}
function pintarNotaMapa() {
  $("#map-note").textContent =
    t(notaMapa.clave) +
    (notaMapa.lista ? ` ${t("tablero.mapa.elige_lista")}` : "");
}
function fallback(clave) {
  $("#map").hidden = true;
  $("#map-fallback").hidden = false;
  document.body.dataset.dashboardMap = "local";
  notaMapa = { clave, lista: true };
  pintarNotaMapa();
  drawFallback();
}
function mapInit() {
  if (!window.maplibregl?.Map) {
    fallback("tablero.mapa.sin_base");
    return;
  }
  try {
    state.map = new maplibregl.Map({
      container: "map",
      style: {
        version: 8,
        sources: {
          // La misma fuente de teselas del explorador (web/app.js, crearMapa): ningún dominio nuevo.
          osm: {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            maxzoom: 19,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#12221a" },
          },
          {
            id: "osm",
            type: "raster",
            source: "osm",
            // Atenuado para el fondo oscuro del tablero; los polígonos llevan el color.
            paint: {
              "raster-saturation": -0.6,
              "raster-brightness-max": 0.6,
              "raster-opacity": 0.8,
            },
          },
        ],
      },
      bounds: zone().bbox,
      fitBoundsOptions: { padding: paddingMapa() },
      attributionControl: { compact: true },
      // En pantalla táctil, un dedo desplaza la página y dos mueven el mapa (el mapa no atrapa el desplazamiento).
      cooperativeGestures: window.matchMedia?.("(pointer: coarse)").matches ?? false,
      locale: textosDelMapa(),
    });
    state.map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    rotularMapa();
    state.map.on("style.load", () => {
      state.map.addSource("fields", { type: "geojson", data: datosDelMapa() });
      state.map.addLayer({
        id: "fields-fill",
        type: "fill",
        source: "fields",
        filter: ["==", ["get", "zona"], state.zone],
        paint: {
          "fill-color": ["case", ["get", "abstencion"], "#b6bcb0", "#aed379"],
          "fill-opacity": 0.4,
        },
      });
      state.map.addLayer({
        id: "fields-line",
        type: "line",
        source: "fields",
        filter: ["==", ["get", "zona"], state.zone],
        paint: {
          "line-color": ["case", ["get", "abstencion"], "#bcc2aa", "#bddc6c"],
          "line-width": 1,
        },
      });
      state.map.addLayer({
        id: "selected-line",
        type: "line",
        source: "fields",
        filter: ["==", ["get", "id"], state.field],
        paint: { "line-color": "#ffdf61", "line-width": 3 },
      });
      state.mapReady = true;
      document.body.dataset.dashboardMap = "listo";
      actualizarColoresMapa();
      updateHighlight();
      state.map.on("render", () => {
        if (state.map.queryRenderedFeatures({ layers: ["fields-fill"] }).length)
          document.body.dataset.dashboardMapRendered = "si";
      });
      state.map.on("click", "fields-fill", (e) =>
        chooseField(e.features[0].properties.id),
      );
      state.map.on("mouseenter", "fields-fill", () => {
        state.map.getCanvas().style.cursor = "pointer";
      });
      state.map.on("mouseleave", "fields-fill", () => {
        state.map.getCanvas().style.cursor = "";
      });
    });
    // Sin red no llegan las teselas: los polígonos siguen dibujados con los datos locales y se avisa una vez.
    state.map.on("error", () => {
      if (notaMapa.clave === "tablero.mapa.nota") {
        notaMapa = { clave: "tablero.mapa.sin_teselas", lista: false };
        pintarNotaMapa();
      }
    });
    state.map
      .getCanvas()
      .addEventListener("webglcontextlost", () =>
        fallback("tablero.mapa.sin_contexto"),
      );
  } catch (err) {
    fallback("tablero.mapa.sin_inicio");
  }
}

// Lo que el propio tablero escribe y depende del idioma (lo fijo del HTML lo pinta interfaz.js).
function pintarDatos() {
  const slider = cube.dotaciones.deslizador;
  const unidad = T("tablero.unidad");
  $("#range-labels").innerHTML =
    `<span>${fmt(slider.min)} ${unidad}</span><span>${fmt(slider.max)} ${unidad}</span>`;
  $("#rain-pct").textContent =
    `(${fmt(cube.lluvia_pct.find((v) => v < 0), 0)}%)`;
  // Fecha del corte en hora de Chihuahua (UTC−6 fijo; «America/Guatemala» tiene el mismo desfase sin horario de verano).
  const generado = cube.meta.generado;
  $("#data-date").textContent = t("tablero.corte", {
    fecha:
      generado && Number.isFinite(Date.parse(generado))
        ? fmtFecha(generado, {
            dateStyle: "medium",
            timeZone: "America/Guatemala",
          })
        : t("tablero.corte_sin_fecha"),
  });
  pintarNotaMapa();
  rotularMapa();
  pintarCabecera();
  fieldList();
  accesosParcelas();
  stats();
  fieldDetails();
  crops();
  chart();
  timeline();
}
// El aviso de fallo ofrece el camino al explorador, que no depende de este tablero.
function pintarFallo() {
  const status = $("#load-status");
  delete status.dataset.i18n;
  status.className = "error";
  status.hidden = false;
  status.textContent = `${t("tablero.error.carga", { detalle: fallo })} `;
  const link = document.createElement("a");
  link.href = "explorer.html";
  link.textContent = t("tablero.abrir_explorador");
  status.append(link);
}

async function init() {
  [cube, geo, research] = await Promise.all([
    read("data/cubo.json"),
    read("data/parcelas.geojson"),
    read("data/dashboard.json"),
  ]);
  try {
    soil = await read("data/suelo.json");
  } catch {
    soil = null;
    soilError = true;
  }
  if (!cube.zonas || !Array.isArray(geo.features) || !research.eventos)
    throw new Error(t("tablero.error.estructura"));
  // Los nombres de lugar se muestran como vienen del cubo.
  $("#zona-dashboard").innerHTML = Object.entries(cube.zonas)
    .map(
      ([id, z]) =>
        `<option value="${esc(id)}">${esc(z.nombre_mostrar)}</option>`,
    )
    .join("");
  // Lo elegido antes en esta sesión (zona, parcela, dotación y lluvia) vuelve a su lugar; lo que falte o ya no
  // exista en los datos se toma de los controles y de las referencias del cubo, sin suponerlo.
  const guardado = leerEstadoGuardado();
  if (Object.hasOwn(cube.zonas, guardado.zona ?? ""))
    $("#zona-dashboard").value = guardado.zona;
  state.zone = $("#zona-dashboard").value;
  const slider = cube.dotaciones.deslizador;
  const dotacionGuardada =
    typeof guardado.dotacion === "number" &&
    guardado.dotacion >= slider.min &&
    guardado.dotacion <= slider.max
      ? guardado.dotacion
      : null;
  Object.assign($("#allocation"), {
    min: slider.min,
    max: slider.max,
    step: slider.paso,
    value:
      dotacionGuardada ??
      cube.dotaciones.marcas.find((m) => m.id === "como_2026")?.valor ??
      slider.min,
  });
  state.allocation = Number($("#allocation").value);
  // La casilla de lluvia: la guardada en la sesión o, si no hay, como la deje el navegador al volver a la página.
  const menosLluvia = cube.lluvia_pct.find((v) => v < 0);
  if (typeof guardado.lluvia === "number")
    $("#rain").checked = guardado.lluvia < 0 && menosLluvia != null;
  const lluviaDeLaCasilla = () =>
    $("#rain").checked && menosLluvia != null ? menosLluvia : 0;
  state.rain = lluviaDeLaCasilla();
  mapBlock = $(".map-detail-grid");
  mapAnchor = document.createComment("map-anchor");
  mapBlock.before(mapAnchor);
  interfaz = prepararInterfaz({
    cubo: cube,
    cambiarModo: (modo) => {
      mapMode = modo;
      actualizarColoresMapa();
    },
    centrarParcela: () => {
      if (state.field) chooseField(state.field);
    },
  });
  changeZone();
  if (guardado.parcela) chooseField(guardado.parcela); // solo si sigue en la zona
  pintarDatos();
  $("#zona-dashboard").addEventListener("change", changeZone);
  $("#lado-zonas")?.addEventListener("click", (e) => {
    const boton = e.target.closest("[data-zona]");
    if (!boton || boton.dataset.zona === state.zone) return;
    $("#zona-dashboard").value = boton.dataset.zona;
    changeZone();
    // El bloque se vuelve a pintar: el foco regresa al botón de la zona elegida.
    $('#lado-zonas [aria-pressed="true"]')?.focus();
  });
  $("#allocation").addEventListener("input", (e) => {
    state.allocation = Number(e.target.value);
    recordarEstado();
    stats();
    fieldDetails();
    crops();
  });
  $("#rain").addEventListener("change", () => {
    state.rain = lluviaDeLaCasilla();
    recordarEstado();
    stats();
    fieldDetails();
    crops();
  });
  $("#field-search").addEventListener("input", buscarParcela);
  $("#field-select").addEventListener("change", (e) =>
    chooseField(e.target.value),
  );
  $("#fit-map").addEventListener("click", () => {
    if (state.mapReady)
      state.map.fitBounds(zone().bbox, { padding: paddingMapa(), duration: 0 });
  });
  $("#map-fallback").addEventListener("click", (e) => {
    const el = e.target.closest("[data-id]");
    if (el) chooseField(el.dataset.id);
  });
  $("#map-fallback").addEventListener("keydown", (e) => {
    const el = e.target.closest("[data-id]");
    if (!el) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      chooseField(el.dataset.id);
      return;
    }
    // Flechas: de un polígono al siguiente o al anterior, sin salir del mapa.
    const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!paso) return;
    e.preventDefault();
    const poligonos = [...$("#map-fallback").querySelectorAll("[data-id]")];
    poligonos[(poligonos.indexOf(el) + paso + poligonos.length) % poligonos.length].focus();
  });
  document.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", () => {
      state.filter = b.dataset.filter;
      timeline();
    }),
  );
  $("#exportar").addEventListener("click", exportSummary);
  $("#export-timeline").addEventListener("click", exportTimeline);
  $("#app-content").hidden = false;
  $("#load-status").hidden = true;
  // La navegación y el mapa se montan ANTES de esperar al asesor: con un archivo lento (pronostico.json) la
  // vista de la liga, las pestañas y el mapa ya responden; el asesor se dibuja cuando llegue.
  route();
  mapInit();
  window.addEventListener("hashchange", route);
  document.body.dataset.dashboardNav = "lista";
  // El asesor recibe el cubo ya leído (no lo vuelve a pedir) y el estado vigente en cada llamada.
  asesor = await crearAsesor(() => ({
    cubo: cube,
    zona: state.zone,
    parcela: selected()?.properties,
    suelo: soil,
    dotacion: state.allocation,
    lluvia: state.rain,
  }));
  document.body.dataset.dashboard = "listo";
}

// Arranque: el idioma y los textos fijos se pintan antes de leer los datos.
prepararIdioma();
pintarTextos();
pintarIdioma();
document.title = `${PRODUCTO} · ${t("tablero.titulo")}`;
// Cambio de idioma: todo se vuelve a pintar con los datos ya cargados, sin recargar la página.
alCambiarIdioma(() => {
  if (interfaz) interfaz.repintar();
  else {
    pintarTextos();
    pintarIdioma();
  }
  if (fallo) pintarFallo();
  else if (interfaz) pintarDatos();
  else document.title = `${PRODUCTO} · ${t("tablero.titulo")}`;
});
montarInstalacion($("#dashboard-install"));
init().catch((err) => {
  fallo = err.message;
  pintarFallo();
  document.body.dataset.dashboard = "error";
});
