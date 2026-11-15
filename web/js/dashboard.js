// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// web/js/dashboard.js — Tablero (página secundaria, web/dashboard.html).
// La interfaz lee las cifras publicadas en web/data/. Los cálculos reutilizan reglas.js, sin otro modelo.
// Textos visibles en inglés (regla 9); comentarios e identificadores, en español.
// Todo texto que viene de los datos pasa por esc() antes de entrar a innerHTML.
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
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(
        n,
      )
    : "No data";
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
// Unidad de la dotación y de la demanda, como en la página principal.
const UNIDAD = "thousand m³/ha";
// Nombres de cultivo en inglés: los mismos de la página principal (web/app.js, CULTIVOS).
const names = {
  alfalfa: "Alfalfa",
  nogal: "Pecan orchard",
  chile: "Chile pepper",
  algodon: "Cotton",
  maiz_forrajero: "Forage maize",
  sorgo: "Sorghum",
  cereal_invierno: "Winter cereal",
  barbecho: "Fallow",
  descanso: "Rest",
  anual: "Annual crop",
  sin_clasificar: "Not classified",
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
    ? `${fmt(term.min, 0)} ${term.min === 1 ? "year" : "years"}`
    : `${fmt(term.min, 0)}–${fmt(term.max, 0)} years`;
const cropName = (id) =>
  names[id] ?? String(id ?? "Not classified").replaceAll("_", " ");
// Por vista: título, descripción y rótulo de la ruta. Las llaves son los identificadores de las vistas
// (hash, data-view y data-panel), que usan las hojas de estilo y las pruebas.
const labels = {
  resumen: [
    "Water dashboard",
    "Before you plant, see the water you are committing.",
    "Overview",
  ],
  terreno: [
    "Your field, up close",
    "Each field has its own crop, soil and water need.",
    "My field",
  ],
  cultivos: [
    "What you plant matters",
    "Compare water need, irrigation and how many years each crop commits.",
    "Crops and options",
  ],
  recomendaciones: [
    "Compare options",
    "Evidence and questions to go over with your technician.",
    "Compare options",
  ],
  predicciones: [
    "History and rainfall range",
    "Historical rainfall range with its back-test, and past events for context.",
    "History and rainfall range",
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
  return `${p.id} · ${p.abstencion ? "Not classified" : cropName(p.cultivo_actual)} · ${fmt(p.area_ha)} ha`;
}
// Enlace a la ficha de la parcela en la página principal (explorer.html#<id>).
function explorerLink(id) {
  return id ? `explorer.html#${encodeURIComponent(id)}` : "explorer.html";
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
  // Solo textos propios y números con formato: nada de esto viene como texto de los datos.
  const rows = [
    [
      "Size of the pilot area",
      `${fmt(z.superficie_total_ha, 0)} <small>ha</small>`,
      "Area of the estimated polygons",
      "⌘",
    ],
    [
      "Fields identified",
      fmt(z.conteos.total, 0),
      `${fmt(z.conteos.total - z.conteos.abstenida, 0)} with a crop classification`,
      "♧",
    ],
    [
      "Water already committed",
      percent,
      committed.sinDotacion
        ? "No allocation in this scenario"
        : "At least · need of perennial crops / allocation",
      "◉",
    ],
    [
      "Area not classified",
      `${fmt(committed.fraccionSinClasificar * 100, 0)}%`,
      "Needs checking in the field",
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
    commitment.innerHTML = `<span class="commitment-icon">${icono("drop")}</span><div><strong>${committed.sinDotacion ? "No allocation" : `At least ${percent} committed`}</strong><span>Need of perennial crops · current scenario</span></div><a href="#recomendaciones" aria-label="Compare options for this field">${icono("arrow")}</a>`;
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
    `Scenario: ${fmt(state.allocation)} ${UNIDAD} · rain change ${fmt(state.rain, 0)}% ↗`;
}

function fieldList() {
  const query = $("#field-search").value.trim().toLocaleLowerCase("en");
  const list = features().filter((f) =>
    fieldLabel(f).toLocaleLowerCase("en").includes(query),
  );
  $("#field-select").innerHTML = list.length
    ? list
        .map(
          (f) =>
            `<option value="${esc(f.properties.id)}">${esc(fieldLabel(f))}</option>`,
        )
        .join("")
    : '<option value="">No matches</option>';
  if (list.some((f) => f.properties.id === state.field))
    $("#field-select").value = state.field;
}
function fieldDetails() {
  const p = selected()?.properties;
  if (!p) {
    $("#field-detail").textContent = "No fields available in this pilot area.";
    return;
  }
  const op = current();
  const evalOp =
    !p.abstencion && op
      ? evaluarOpcion(op, p.area_ha, state.allocation, state.rain)
      : null;
  const profile = soil?.perfil?.parcelas?.[p.id];
  const sinSuelo = soilError ? "Could not load" : "No data";
  // La clase de textura se muestra como viene del perfil regional (suelo.json).
  const texture = profile?.clase_textura ?? sinSuelo;
  const term = !p.abstencion && op?.agua?.plazo_anios;
  const termLabel = term ? years(term) : "No data";
  const demand = evalOp ? `${fmt(evalOp.lamina.p50)} ${UNIDAD}` : "Not computed";
  const coverage = evalOp
    ? `${fmt(evalOp.cobertura * 100, 0)}%`
    : "Not computed";
  const title = p.abstencion
    ? "Crop not classified"
    : cropName(p.cultivo_actual);
  const ancho = evalOp && Number.isFinite(evalOp.cobertura) ? evalOp.cobertura * 100 : 0;
  $("#field-detail").innerHTML =
    `<div class="field-title"><span class="crop-symbol">${icons[p.cultivo_actual] ?? "♧"}</span><div><h4>${esc(title)}</h4><p>Field ${esc(p.id)} · ${fmt(p.area_ha)} ha</p></div></div>
        <dl class="field-metrics"><div><dt>Yearly water need · median</dt><dd>${demand}</dd></div><div><dt>Soil · regional map</dt><dd>${profile ? `pH ${fmt(profile.ph)}` : sinSuelo}</dd></div><div><dt>Actual irrigation system</dt><dd id="field-irrigation">Not recorded</dd></div><div><dt>Mean slope</dt><dd>${Number.isFinite(p.relieve?.pendiente_media_pct) ? `${fmt(p.relieve.pendiente_media_pct)}%` : "No data"}</dd></div><div><dt>Estimated texture · map</dt><dd>${esc(texture)}</dd></div><div><dt>Water term in the model</dt><dd>${termLabel}</dd></div></dl>
        <div class="coverage">Area covered in this scenario <strong>${coverage}</strong><div class="progress"><div style="width:${ancho}%"></div></div></div>
        <p class="micro">${evalOp ? `${fmt(evalOp.hectareas.p50)} of ${fmt(p.area_ha)} ha have water at the median need. Likely range: ${fmt(evalOp.hectareas.bajo)}–${fmt(evalOp.hectareas.alto)} ha.` : "Nothing is computed for a field without a crop classification. Confirm the crop with your technician."}</p>
        <a class="field-link" href="${esc(explorerLink(p.id))}">Open the field explorer <span>↗</span></a>`;
  $("#recommendation-link").href = explorerLink(p.id);
  asesor?.actualizar();
  updateHighlight();
}

function crops() {
  const rotations = research.rotaciones?.[state.zone];
  if (!rotations) {
    $("#crop-grid").textContent = "No rotation data for this pilot area.";
    return;
  }
  $("#crop-grid").innerHTML = rotations
    .map((r) => {
      const l = r.lamina_bruta_millares[String(state.rain)];
      const area = selected()?.properties.area_ha;
      const ha = hectareasQueAlcanzan(area, state.allocation, l);
      const crop = r.cultivos[0];
      // Nombre en inglés del catálogo del cubo; si la opción no está en el catálogo, el nombre como viene.
      const catalogo = cube.opciones_catalogo[r.id];
      const nombre = catalogo?.nombre_en ?? r.nombre;
      const kc = catalogo?.secuencia?.[0]?.siembra;
      const planting =
        kc?.desde && kc?.hasta ? `${kc.desde} to ${kc.hasta}` : "Not in the data";
      const plazo =
        r.plazo === "anual"
          ? "ANNUAL CROP"
          : r.plazo === "nogal"
            ? "ORCHARD · MODEL HORIZON"
            : "PERENNIAL CROP";
      return `<article class="card crop-card"><span class="crop-symbol">${icons[crop] ?? "♧"}</span><h3>${esc(nombre)}</h3><span class="pill">${plazo}</span><div class="water-number">${fmt(l.p50)} <small style="font-size:11px">${UNIDAD}</small></div><p>Likely range: ${fmt(l.p10)}–${fmt(l.p90)}</p><div class="crop-meta"><span>Water term <strong>${years(r.plazo_anios)}</strong></span><span>Planting · month-day <strong>${esc(planting)}</strong></span><span>Calculation basis <strong>${l.p50 === 0 ? "No irrigation" : "Modeled surface irrigation"}</strong></span></div><p class="micro">${state.field ? `For the area of ${esc(state.field)}: ${fmt(ha.p50)} of ${fmt(area)} ha covered at the median need. This compares area; it is not a suitability rating or advice for this field.` : "Select a field to compare area."}</p></article>`;
    })
    .join("");
}
function chart() {
  const values = research.historia ?? [];
  if (!values.length) {
    $("#history-chart").textContent = "No history data available.";
    return;
  }
  const max = Math.max(...values.map((x) => x.superficie_ha));
  // El año y la fuente vienen de dashboard.json: se escapan. La altura es un número calculado.
  const alto = (x) => {
    const pct = (x.superficie_ha / max) * 75;
    return Number.isFinite(pct) ? pct : 0;
  };
  $("#history-chart").innerHTML =
    `<div class="bars" role="img" aria-label="Irrigated area in hectares, for selected years">${values.map((x) => `<div class="bar-group"><small>${fmt(x.superficie_ha, 0)}</small><div class="bar" style="height:${alto(x)}%" title="${esc(x.anio)}: ${fmt(x.superficie_ha, 0)} ha"></div><span>${esc(x.anio)}</span></div>`).join("")}</div><details class="micro"><summary>Source and values as a table</summary><p>${esc(research.historia_fuente)}</p><table><caption>Irrigated area, hectares</caption><tbody>${values.map((x) => `<tr><th scope="row">${esc(x.anio)}</th><td>${fmt(x.superficie_ha, 0)}</td></tr>`).join("")}</tbody></table></details>`;
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
      "thousand cubic meters per hectare per year",
      e?.hectareas.p50,
      `cubo.json + parcelas.geojson; ${cube.meta.script}`,
      "Scenario; not a forecast and not planting advice",
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
  // Mismos rótulos del semáforo que la página principal (web/app.js, SEMAFORO).
  const legend = $(".map-legend");
  if (legend)
    legend.innerHTML =
      mapMode === "agua"
        ? '<span><i class="legend-green"></i>Enough water</span><span><i class="legend-yellow"></i>Tight</span><span><i class="legend-red"></i>Not enough water</span><span><i class="legend-gray"></i>Not classified</span>'
        : '<span><i class="legend-green"></i>Classified crop</span><span><i class="legend-gray"></i>Not classified</span>';
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

// Modo local, sin teselas: los polígonos de la zona dibujados en SVG con los datos ya cargados.
function drawFallback() {
  const [west, south, east, north] = zone().bbox;
  const project = ([x, y]) =>
    `${((x - west) / (east - west)) * 600},${((north - y) / (north - south)) * 320}`;
  $("#map-fallback").innerHTML =
    `<svg viewBox="0 0 600 320" role="img" aria-label="Estimated field polygons of the pilot area, without a base map">${features()
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
    message + " You can also choose a field from the list.";
  drawFallback();
}
function mapInit() {
  if (!window.maplibregl?.Map) {
    fallback("The base map is not available. The field polygons are drawn from local data.");
    return;
  }
  try {
    state.map = new maplibregl.Map({
      container: "map",
      style: {
        version: 8,
        sources: {
          // La misma fuente de teselas de la página principal (web/app.js, crearMapa): ningún dominio nuevo.
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
    // Sin red no llegan las teselas: los polígonos siguen dibujados con los datos locales y se avisa una vez.
    let warned = false;
    state.map.on("error", () => {
      if (!warned) {
        warned = true;
        $("#map-note").textContent =
          "Part of the map could not load. The field polygons and the field list use local data; the base map needs a connection.";
      }
    });
    state.map
      .getCanvas()
      .addEventListener("webglcontextlost", () =>
        fallback(
          "The graphics context was lost. The field polygons are drawn from local data.",
        ),
      );
  } catch (err) {
    fallback(
      "The interactive map could not start. The field polygons are drawn from local data.",
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
    throw new Error("the data files do not have the expected structure");
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
  const menosLluvia = cube.lluvia_pct.find((v) => v < 0);
  $("#range-labels").innerHTML =
    `<span>${fmt(slider.min)} ${UNIDAD}</span><span>${fmt(slider.max)} ${UNIDAD}</span>`;
  $("#rain-pct").textContent = `(${fmt(menosLluvia, 0)}%)`;
  // Fecha del corte en hora de Chihuahua (UTC−6 fijo; «America/Guatemala» tiene el mismo desfase sin horario de verano).
  $("#data-date").textContent =
    `Data as of ${cube.meta.generado && Number.isFinite(Date.parse(cube.meta.generado)) ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "America/Guatemala" }).format(new Date(cube.meta.generado)) : "date not available"}`;
  mapBlock = $(".map-detail-grid");
  mapAnchor = document.createComment("map-anchor");
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
    state.rain = e.target.checked ? menosLluvia : 0;
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
    download("root-timeline.csv", [
      ["period", "type", "event", "detail", "source", "status"],
      ...research.eventos
        .filter((e) => state.filter === "todos" || e.tipo === state.filter)
        .map((e) => [
          e.periodo,
          e.tipo,
          e.titulo,
          e.detalle,
          e.fuente,
          "Secondary reference; not a validated data set",
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
  // El aviso de fallo ofrece el camino a la página principal, que no depende de este tablero.
  const status = $("#load-status");
  status.className = "error";
  status.hidden = false;
  status.textContent = `The dashboard could not load: ${err.message}. Reload the page or `;
  const link = document.createElement("a");
  link.href = "explorer.html";
  link.textContent = "open the field explorer";
  status.append(link, ".");
  document.body.dataset.dashboard = "error";
});
