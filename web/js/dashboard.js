// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; dashboard desarrollado con Codex.
// La interfaz lee las cifras publicadas. Los cálculos reutilizan reglas.js, sin otro modelo.
import { prepararInterfaz, icono } from "./interfaz.js";
import { crearAsesor } from "./asesor.js";
import { montarInstalacion } from "./instalar.js";
import {
  aguaComprometida,
  evaluarOpcion,
  hectareasQueAlcanzan,
} from "../reglas.js";

const $ = (s) => document.querySelector(s);
const fmt = (n, digits = 1) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat("es-MX", { maximumFractionDigits: digits }).format(
        n,
      )
    : "Sin dato";
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
const names = {
  alfalfa: "Alfalfa",
  nogal: "Nogal",
  chile: "Chile",
  algodon: "Algodón",
  maiz_forrajero: "Maíz forrajero",
  sorgo: "Sorgo forrajero",
  cereal_invierno: "Cereal de invierno",
  barbecho: "Barbecho",
  descanso: "Descanso",
  anual: "Cultivo anual",
  sin_clasificar: "Sin clasificar",
};
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
    ? `${fmt(term.min, 0)} ${term.min === 1 ? "año" : "años"}`
    : `${fmt(term.min, 0)}–${fmt(term.max, 0)} años`;
const cropName = (id) =>
  names[id] ?? String(id ?? "Sin clasificar").replaceAll("_", " ");
const labels = {
  resumen: [
    "Tu territorio, en tus manos",
    "Conoce el agua que comprometes, antes de sembrar.",
    "Resumen",
  ],
  terreno: [
    "Tu terreno, de cerca",
    "Cada parcela cuenta una historia distinta.",
    "Mi terreno",
  ],
  cultivos: [
    "Lo que siembras importa",
    "Compara agua, riego y compromiso a lo largo del tiempo.",
    "Cultivos y opciones",
  ],
  recomendaciones: [
    "Decidir con más contexto",
    "Evidencia y preguntas para conversar con tu técnico.",
    "Recomendaciones",
  ],
  predicciones: [
    "Mirar atrás para avanzar",
    "Lluvia con retroprueba temporal y contexto histórico.",
    "Historia y predicciones",
  ],
  investigacion: [
    "De dónde viene cada decisión",
    "Investigación abierta, fuentes y límites a la vista.",
    "Fuentes y metodología",
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
let mapMode = "agua";
let selectionMarker = null;
let mapBlock, mapAnchor;

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
function fieldLabel(f) {
  const p = f.properties;
  return `${p.id} · ${p.abstencion ? "Sin clasificar" : cropName(p.cultivo_actual)} · ${fmt(p.area_ha)} ha`;
}

function route() {
  let view = location.hash.slice(1) || "resumen";
  // Conservar enlaces históricos a IDs de parcela de la antigua página principal.
  const linked = geo?.features.find((f) => f.properties.id === view);
  if (linked) {
    $("#zona-dashboard").value = linked.properties.zona;
    if (state.zone !== linked.properties.zona) changeZone();
    chooseField(linked.properties.id);
    view = "terreno";
  }
  state.view = Object.hasOwn(labels, view) ? view : "resumen";
  document.querySelectorAll("[data-panel]").forEach((el) => {
    el.hidden = el.dataset.panel !== state.view;
  });
  document.querySelectorAll("nav [data-view]").forEach((el) => {
    const active = el.dataset.view === state.view;
    el.classList.toggle("active", active);
    if (active) el.setAttribute("aria-current", "page");
    else el.removeAttribute("aria-current");
  });
  const [title, description, crumb] = labels[state.view];
  $("#page-title").textContent = title;
  $("#page-description").textContent = description;
  $("#breadcrumb").textContent = crumb;
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
  const rows = [
    [
      "Superficie de la zona",
      `${fmt(z.superficie_total_ha, 0)} <small>ha</small>`,
      "Área de polígonos estimados",
      "⌘",
    ],
    [
      "Parcelas identificadas",
      fmt(z.conteos.total, 0),
      `${fmt(z.conteos.total - z.conteos.abstenida, 0)} con clasificación de cultivo`,
      "♧",
    ],
    [
      "Agua comprometida",
      percent,
      committed.sinDotacion
        ? "Sin dotación en este escenario"
        : "Al menos · demanda de perennes / dotación",
      "◉",
    ],
    [
      "Área sin clasificar",
      `${fmt(committed.fraccionSinClasificar * 100, 0)}%`,
      "Necesita verificación en campo",
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
    commitment.innerHTML = `<span class="commitment-icon">${icono("drop")}</span><div><strong>${committed.sinDotacion ? "Sin dotación" : `Al menos ${percent} comprometido`}</strong><span>Demanda de cultivos perennes · escenario actual</span></div><a href="#recomendaciones" aria-label="Explorar planes de agua">${icono("arrow")}</a>`;
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
    `Escenario: ${fmt(state.allocation)} millares/ha · lluvia ${fmt(state.rain, 0)}% ↗`;
}

function fieldList() {
  const query = $("#field-search").value.trim().toLocaleLowerCase("es");
  const list = features().filter((f) =>
    fieldLabel(f).toLocaleLowerCase("es").includes(query),
  );
  $("#field-select").innerHTML = list.length
    ? list
        .map(
          (f) =>
            `<option value="${esc(f.properties.id)}">${esc(fieldLabel(f))}</option>`,
        )
        .join("")
    : '<option value="">No hay coincidencias</option>';
  if (list.some((f) => f.properties.id === state.field))
    $("#field-select").value = state.field;
}
function fieldDetails() {
  const p = selected()?.properties;
  if (!p) {
    $("#field-detail").textContent =
      "No hay parcelas disponibles en esta zona.";
    return;
  }
  const op = current();
  const evalOp =
    !p.abstencion && op
      ? evaluarOpcion(op, p.area_ha, state.allocation, state.rain)
      : null;
  const profile = soil?.perfil?.parcelas?.[p.id];
  const textureNames = {
    "clay loam": "Franco arcilloso",
    "sandy clay loam": "Franco arcilloarenoso",
    "sandy loam": "Franco arenoso",
  };
  const texture = profile?.clase_textura
    ? (textureNames[profile.clase_textura] ?? profile.clase_textura)
    : soilError
      ? "No se pudo cargar"
      : "Sin dato";
  const term = !p.abstencion && op?.agua?.plazo_anios;
  const termLabel = term ? years(term) : "Sin dato";
  const demand = evalOp
    ? `${fmt(evalOp.lamina.p50)} millares/ha`
    : "Sin cálculo";
  const coverage = evalOp
    ? `${fmt(evalOp.cobertura * 100, 0)}%`
    : "Sin cálculo";
  const title = p.abstencion
    ? "Cultivo sin clasificar"
    : cropName(p.cultivo_actual);
  $("#field-detail").innerHTML =
    `<div class="field-title"><span class="crop-symbol">${icons[p.cultivo_actual] ?? "♧"}</span><div><h4>${esc(title)}</h4><p>Parcela ${esc(p.id)} · ${fmt(p.area_ha)} ha</p></div></div>
        <dl class="field-metrics"><div><dt>Demanda anual · mediana</dt><dd>${demand}</dd></div><div><dt>Suelo · mapa regional</dt><dd>${profile ? `pH ${fmt(profile.ph)}` : soilError ? "No se pudo cargar" : "Sin dato"}</dd></div><div><dt>Sistema de riego real</dt><dd id="field-irrigation">Sin registrar</dd></div><div><dt>Pendiente media</dt><dd>${Number.isFinite(p.relieve?.pendiente_media_pct) ? `${fmt(p.relieve.pendiente_media_pct)}%` : "Sin dato"}</dd></div><div><dt>Textura estimada · mapa</dt><dd>${esc(texture)}</dd></div><div><dt>Compromiso del modelo</dt><dd>${termLabel}</dd></div></dl>
        <div class="coverage">Área cubierta por el escenario <strong>${coverage}</strong><div class="progress"><div style="width:${evalOp ? evalOp.cobertura * 100 : 0}%"></div></div></div>
        <p class="micro">${evalOp ? `${fmt(evalOp.hectareas.p50)} de ${fmt(p.area_ha)} ha con agua a demanda mediana. Banda: ${fmt(evalOp.hectareas.bajo)}–${fmt(evalOp.hectareas.alto)} ha.` : "No se infiere una recomendación sin clasificación. Confirma el cultivo con tu técnico."}</p>
        <a class="field-link" href="index.html#${encodeURIComponent(p.id)}">Ver ficha y opciones de parcela <span>↗</span></a>`;
  $("#recommendation-link").href =
    `index.html#${encodeURIComponent(p.id)}`;
  recommendations(p, evalOp);
  updateHighlight();
}
function recommendations() {
  asesor?.actualizar();
}

function crops() {
  const rotations = research.rotaciones[state.zone];
  if (!rotations) {
    $("#crop-grid").textContent = "No hay datos de rotaciones para esta zona.";
    return;
  }
  $("#crop-grid").innerHTML = rotations
    .map((r) => {
      const l = r.lamina_bruta_millares[String(state.rain)];
      const area = selected()?.properties.area_ha;
      const ha = hectareasQueAlcanzan(area, state.allocation, l);
      const crop = r.cultivos[0];
      const kc = cube.opciones_catalogo[r.id]?.secuencia?.[0]?.siembra;
      const planting =
        kc?.desde && kc?.hasta
          ? `${kc.desde} a ${kc.hasta}`
          : "Consultar ficha técnica";
      return `<article class="card crop-card"><span class="crop-symbol">${icons[crop] ?? "♧"}</span><h3>${esc(r.nombre)}</h3><span class="pill">${r.plazo === "anual" ? "CULTIVO ANUAL" : r.plazo === "nogal" ? "HUERTA · HORIZONTE DEL MODELO" : "CULTIVO PERENNE"}</span><div class="water-number">${fmt(l.p50)} <small style="font-size:11px">millares/ha</small></div><p>Banda P10–P90: ${fmt(l.p10)}–${fmt(l.p90)}</p><div class="crop-meta"><span>Compromiso <strong>${years(r.plazo_anios)}</strong></span><span>Siembra · mes-día <strong>${esc(planting)}</strong></span><span>Base del cálculo A5 <strong>${l.p50 === 0 ? "Sin riego" : "Riego superficial modelado"}</strong></span></div><p class="micro">${state.field ? `Para el área de ${esc(state.field)}: ${fmt(ha.p50)} de ${fmt(area)} ha cubiertas a mediana. Comparación de área, no aptitud ni recomendación para esta parcela.` : "Selecciona una parcela para comparar superficie."}</p></article>`;
    })
    .join("");
}
function chart() {
  const values = research.historia;
  const max = Math.max(...values.map((x) => x.superficie_ha));
  $("#history-chart").innerHTML =
    `<div class="bars" role="img" aria-label="Superficie regada en hectáreas, por años seleccionados">${values.map((x) => `<div class="bar-group"><small>${fmt(x.superficie_ha, 0)}</small><div class="bar" style="height:${(x.superficie_ha / max) * 75}%" title="${x.anio}: ${fmt(x.superficie_ha, 0)} ha"></div><span>${x.anio}</span></div>`).join("")}</div><details class="micro"><summary>Fuente y valores accesibles</summary><p>${esc(research.historia_fuente)}</p><table><caption>Superficie regada, hectáreas</caption><tbody>${values.map((x) => `<tr><th scope="row">${x.anio}</th><td>${fmt(x.superficie_ha, 0)}</td></tr>`).join("")}</tbody></table></details>`;
}
function timeline() {
  $("#timeline").innerHTML = research.eventos
    .filter((e) => state.filter === "todos" || e.tipo === state.filter)
    .map(
      (e) =>
        `<article class="event"><time>${esc(e.periodo)}</time><div><h3>${esc(e.titulo)}</h3><p>${esc(e.detalle)}</p><small>[P] ${esc(e.fuente)}</small></div></article>`,
    )
    .join("");
  document.querySelectorAll("[data-filter]").forEach((b) => {
    const active = b.dataset.filter === state.filter;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
}
function download(name, rows) {
  // Evitar interpretación como fórmula de celdas de texto al abrir el CSV en una hoja de cálculo.
  const cell = (value) =>
    `"${String(value ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""')}"`;
  const csv =
    "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportSummary() {
  const p = selected()?.properties,
    op = current();
  const e =
    op && !p.abstencion
      ? evaluarOpcion(op, p.area_ha, state.allocation, state.rain)
      : null;
  download(`raiz-${state.field}-resumen.csv`, [
    [
      "zona",
      "parcela",
      "cultivo",
      "area_ha",
      "dotacion_millares_ha",
      "lluvia_pct",
      "demanda_p10",
      "demanda_p50",
      "demanda_p90",
      "ha_cubiertas_p50",
      "fuente",
      "alcance",
    ],
    [
      zone().nombre_mostrar,
      p.id,
      p.abstencion ? "sin_clasificar" : p.cultivo_actual,
      p.area_ha,
      state.allocation,
      state.rain,
      e?.lamina.p10,
      e?.lamina.p50,
      e?.lamina.p90,
      e?.hectareas.p50,
      `cubo.json + parcelas.geojson; ${cube.meta.script}`,
      "Escenario; no es pronostico ni recomendacion de siembra",
    ],
  ]);
}
function paddingMapa() {
  return window.innerWidth <= 850
    ? { top: 90, bottom: 390, left: 22, right: 22 }
    : { top: 90, bottom: 100, left: 105, right: 365 };
}
function chooseField(id) {
  if (!features().some((f) => f.properties.id === id)) return;
  state.field = id;
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
  const legend = $(".map-legend");
  if (legend)
    legend.innerHTML =
      mapMode === "agua"
        ? '<span><i class="legend-green"></i>Cubre banda alta</span><span><i class="legend-yellow"></i>Cubre mediana</span><span><i class="legend-red"></i>Falta agua</span><span><i class="legend-gray"></i>Sin clasificar</span>'
        : '<span><i class="legend-green"></i>Cultivo clasificado</span><span><i class="legend-gray"></i>Sin clasificar</span>';
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
        selectionMarker = new maplibregl.Marker({
          element: el,
          anchor: "bottom",
        });
      }
      selectionMarker.getElement().textContent = state.field;
      selectionMarker
        .setLngLat([(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2])
        .addTo(state.map);
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
}

function drawFallback() {
  const [west, south, east, north] = zone().bbox;
  const project = ([x, y]) =>
    `${((x - west) / (east - west)) * 600},${((north - y) / (north - south)) * 320}`;
  $("#map-fallback").innerHTML =
    `<svg viewBox="0 0 600 320" role="img" aria-label="Polígonos estimados de la zona, sin mapa base">${features()
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
            ? {
                verde: "#8ed665",
                ambar: "#f1c263",
                rojo: "#ed8b78",
                gris: "#73837b",
              }[estado]
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
              `<path tabindex="0" role="button" aria-label="${esc(fieldLabel(f))}" style="--field-color:${color}" class="fallback-field${f.properties.id === state.field ? " selected" : ""}" data-id="${esc(f.properties.id)}" d="${rings.map((ring) => "M" + ring.map(project).join(" L") + " Z").join(" ")}"><title>${esc(fieldLabel(f))}</title></path>`,
          )
          .join("");
      })
      .join("")}</svg>`;
}
function fallback(message) {
  $("#map").hidden = true;
  $("#map-fallback").hidden = false;
  document.body.dataset.dashboardMap = "local";
  $("#map-note").textContent =
    message + " Puedes elegir una parcela en el listado.";
  drawFallback();
}
function mapInit() {
  if (!window.maplibregl?.Map) {
    fallback("Mapa base no disponible. Se muestran los polígonos locales.");
    return;
  }
  try {
    state.map = new maplibregl.Map({
      container: "map",
      style: {
        version: 8,
        sources: {
          imagery: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: research.mapa_atribucion,
          },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#12221a" },
          },
          {
            id: "imagery",
            type: "raster",
            source: "imagery",
            paint: { "raster-saturation": -0.35, "raster-opacity": 0.75 },
          },
        ],
      },
      bounds: zone().bbox,
      fitBoundsOptions: { padding: paddingMapa() },
      attributionControl: { compact: true },
    });
    state.map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
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
    let warned = false;
    state.map.on("error", () => {
      if (!warned) {
        warned = true;
        $("#map-note").textContent =
          "No se pudo cargar parte del mapa. Los polígonos y el listado utilizan datos locales; la imagen base requiere conexión.";
      }
    });
    state.map
      .getCanvas()
      .addEventListener("webglcontextlost", () =>
        fallback(
          "Se perdió el contexto gráfico. Se muestran los polígonos locales.",
        ),
      );
  } catch (err) {
    fallback(
      "No se pudo iniciar el mapa interactivo. Se muestran los polígonos locales.",
    );
  }
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
    throw new Error("Los archivos no tienen la estructura de datos esperada.");
  $("#zona-dashboard").innerHTML = Object.entries(cube.zonas)
    .map(
      ([id, z]) =>
        `<option value="${esc(id)}">${esc(z.nombre_mostrar)}</option>`,
    )
    .join("");
  state.zone = $("#zona-dashboard").value;
  const slider = cube.dotaciones.deslizador;
  Object.assign($("#allocation"), {
    min: slider.min,
    max: slider.max,
    step: slider.paso,
    value:
      cube.dotaciones.marcas.find((m) => m.id === "como_2026")?.valor ??
      slider.min,
  });
  state.allocation = Number($("#allocation").value);
  $("#range-labels").innerHTML =
    `<span>${fmt(slider.min)} millares/ha</span><span>${fmt(slider.max)} millares/ha</span>`;
  $("#rain-pct").textContent = `(${cube.lluvia_pct.find((v) => v < 0)}%)`;
  $("#data-date").textContent =
    `Corte de datos · ${cube.meta.generado && Number.isFinite(Date.parse(cube.meta.generado)) ? new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeZone: "America/Guatemala" }).format(new Date(cube.meta.generado)) : "Fecha no disponible"}`;
  $("#sources").innerHTML = research.fuentes
    .map(
      (f) =>
        `<article class="source"><div><h3>${esc(f.titulo)}</h3><p>${esc(f.descripcion)}</p></div><a href="${esc(f.archivo)}" target="_blank" rel="noopener">Consultar PDF ↗</a></article>`,
    )
    .join("");
  mapBlock = $(".map-detail-grid");
  mapAnchor = document.createComment("Posición original del mapa y ficha");
  mapBlock.before(mapAnchor);
  prepararInterfaz({
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
  chart();
  timeline();
  $("#zona-dashboard").addEventListener("change", changeZone);
  $("#allocation").addEventListener("input", (e) => {
    state.allocation = Number(e.target.value);
    stats();
    fieldDetails();
    crops();
  });
  $("#rain").addEventListener("change", (e) => {
    state.rain = e.target.checked ? cube.lluvia_pct.find((v) => v < 0) : 0;
    stats();
    fieldDetails();
    crops();
  });
  $("#field-search").addEventListener("input", fieldList);
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
    if (e.key === "Enter" || e.key === " ") {
      const el = e.target.closest("[data-id]");
      if (el) {
        e.preventDefault();
        chooseField(el.dataset.id);
      }
    }
  });
  document.querySelectorAll("[data-filter]").forEach((b) =>
    b.addEventListener("click", () => {
      state.filter = b.dataset.filter;
      timeline();
    }),
  );
  $("#exportar").addEventListener("click", exportSummary);
  $("#export-timeline").addEventListener("click", () =>
    download("raiz-cronologia.csv", [
      ["periodo", "tipo", "evento", "detalle", "fuente", "estado"],
      ...research.eventos
        .filter((e) => state.filter === "todos" || e.tipo === state.filter)
        .map((e) => [
          e.periodo,
          e.tipo,
          e.titulo,
          e.detalle,
          e.fuente,
          "Referencia secundaria; no es dataset validado",
        ]),
    ]),
  );
  $("#app-content").hidden = false;
  $("#load-status").hidden = true;
  asesor = await crearAsesor(() => ({
    zona: state.zone,
    parcela: selected()?.properties,
    suelo: soil,
    dotacion: state.allocation,
    lluvia: state.rain,
  }));
  route();
  mapInit();
  window.addEventListener("hashchange", route);
  document.body.dataset.dashboard = "listo";
}
montarInstalacion($("#dashboard-install"));
init().catch((err) => {
  $("#load-status").className = "error";
  $("#load-status").textContent =
    `No se pudo cargar el dashboard: ${err.message}. Recarga la página o abre el explorador técnico desde el menú.`;
  document.body.dataset.dashboard = "error";
});
