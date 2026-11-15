// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// Vista «Planificar» y bloque de lluvia histórica del tablero (web/dashboard.html).
// - El plan sale de web/js/recomendador.js, que usa las láminas de data/cubo.json y las reglas de web/reglas.js:
//   las mismas cifras que la ficha de la página publicada. Aquí solo se dibuja.
// - La interfaz describe; no ordena ni califica las opciones. Cada tarjeta lleva el aviso de juicio.
// - Todo texto que viene de los datos o de la persona se escapa antes de entrar al DOM.
// - Los textos visibles van en inglés (regla 9); los comentarios, en español.
import { icono } from "./interfaz.js";
import {
  AVISO_JUICIO,
  ALCANCE,
  planDeParcela,
  comprobarPlan,
  textoRestriccion,
  nombreCultivo,
} from "./recomendador.js";
import { formatoHectareas } from "./resumen.js";

const SIN_DATO = "No data";
const fmt = (n, d = 1) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: d }).format(n)
    : SIN_DATO;
const percent = (n) => (Number.isFinite(n) ? `${fmt(n * 100, 0)}%` : SIN_DATO);
/** Escapa un texto para meterlo en HTML (contenido o atributo). */
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
const $ = (s) => document.querySelector(s);
/** Valor numérico de un campo: null si está vacío (vacío significa desconocido, nunca cero). */
const number = (id) => {
  const v = $(id)?.value.trim() ?? "";
  return v === "" ? null : Number(v);
};
const input = (id, label, type = "number", extra = {}) =>
  `<label>${esc(label)}<input id="${esc(id)}" type="${esc(type)}" ${Object.entries(extra)
    .map(([k, v]) => `${esc(k)}="${esc(v)}"`)
    .join(" ")}></label>`;

/** Un enlace solo se arma con http o https; cualquier otro esquema se deja como texto. */
function enlaceSeguro(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
const URL_EN_TEXTO = /https?:\/\/[^\s<>"')]+/g;
/** Texto de una fuente, escapado, con sus direcciones http(s) convertidas en enlaces. */
function fuenteHtml(texto) {
  const s = String(texto ?? "");
  let salida = "";
  let desde = 0;
  for (const m of s.matchAll(URL_EN_TEXTO)) {
    const cruda = m[0].replace(/[.,;:]+$/, "");
    const href = enlaceSeguro(cruda);
    salida += esc(s.slice(desde, m.index));
    salida += href
      ? `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${esc(cruda)}</a>`
      : esc(cruda);
    desde = m.index + cruda.length;
  }
  return salida + esc(s.slice(desde));
}
/** Descarga un objeto como archivo JSON (todo ocurre en el navegador). */
function descargarJson(name, obj) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function leer(ruta) {
  const r = await fetch(ruta);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Cultivos que la persona puede confirmar (ids del contrato de datos).
const CULTIVOS_DEL_FORMULARIO = [
  "barbecho",
  "cereal_invierno",
  "maiz_forrajero",
  "algodon",
  "chile",
  "alfalfa",
  "nogal",
  "sorgo",
];
const SISTEMAS = {
  sin_confirmar: "Not recorded",
  gravedad: "Surface (gravity)",
  goteo: "Drip",
};
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Crea el asesor del tablero. `contexto()` devuelve el estado vigente:
 * { zona, parcela (properties de parcelas.geojson), suelo, dotacion, lluvia } y, si se quiere evitar una
 * segunda lectura, `cubo` (opcional). Devuelve { actualizar }.
 */
export async function crearAsesor(contexto) {
  let cubo = null; // data/cubo.json: de aquí salen las láminas del plan
  let datos = null; // data/pronostico.json: lluvia histórica, intervalos de suelo y la conversión de volumen
  let last = null;
  let field = null;
  const registros = {};
  try {
    cubo = contexto()?.cubo ?? (await leer("data/cubo.json"));
  } catch (e) {
    $("#decision-summary").textContent =
      `The data file could not be loaded (${e.message}), so no plan is shown.`;
    $("#forecast-analysis").textContent =
      "The historical rainfall range is not available: the data file could not be loaded.";
    return { actualizar() {} };
  }
  try {
    datos = await leer("data/pronostico.json");
  } catch {
    datos = null; // el plan sigue: solo faltan la lluvia histórica y los intervalos de suelo
  }
  const m3PorMillar = Number(datos?.metodo?.m3_por_millar);
  const conVolumen = Number.isFinite(m3PorMillar) && m3PorMillar > 0;

  $("#decision-inputs").innerHTML =
    `<form id="decision-form" class="card decision-form">
    <div class="form-heading"><h3>Data for this calculation</h3><span id="decision-field"></span></div>
    <div class="decision-form-grid">
    <label>What was on your field?<select id="rec-crop"><option value="">Not confirmed · use the satellite classification as a working assumption</option>${CULTIVOS_DEL_FORMULARIO.map(
      (id) =>
        `<option value="${esc(id)}">${esc(mayuscula(nombreCultivo(id)))}</option>`,
    ).join("")}</select></label>
    ${input("rec-area", "Area you want to evaluate · ha", "number", { min: 0.01, step: "any", required: "" })}
    ${input("rec-date", "Planned planting date (optional)", "date")}
    ${conVolumen ? input("rec-volume", "Total water available · m³ (optional)", "number", { min: 0, step: "any" }) : ""}
    <label>How do you irrigate? (kept as a note; it does not change any figure)<select id="rec-system">${Object.entries(
      SISTEMAS,
    )
      .map(([id, label]) => `<option value="${esc(id)}">${esc(label)}</option>`)
      .join("")}</select></label>
    ${input("rec-ph", "Soil pH from a lab (optional)", "number", { min: 0, max: 14, step: "any" })}
    ${input("rec-ec", "Soil salinity, ECe · dS/m (optional)", "number", { min: 0, step: "any" })}
    </div>
    <label class="confirmation"><input id="rec-allocation-confirmed" type="checkbox">I confirm that the allocation or the volume matches the water I will have.</label>
    <p id="decision-budget" class="micro"></p>
    <p class="micro">What you enter stays in this browser session and is not sent anywhere. ECe is the salinity of the soil, not of the irrigation water. An empty field means unknown, never zero.</p>
    <div class="form-actions"><button class="button dark" type="submit">Show the water coverage</button><button class="button" type="button" id="download-inputs">Download my inputs</button></div>
    </form>`;
  // Dividir la captura en pasos sin cambiar las entradas ni sus validaciones.
  const pasos = [
    {
      id: "parcela",
      label: "Your field",
      icon: "map",
      descripcion:
        "Start with what you know: what was on your field, how much area you want to look at and when you plan to plant.",
      campos: ["rec-crop", "rec-area", "rec-date"],
    },
    {
      id: "agua",
      label: "Your water",
      icon: "drop",
      descripcion:
        "The plan uses the allocation of the scenario above. If you know your total volume, enter it and the plan uses it instead.",
      campos: ["rec-volume", "rec-system"],
    },
    {
      id: "suelo",
      label: "Your soil",
      icon: "sprout",
      descripcion:
        "Fill in what you have measured. Lab results are compared with general published ranges and shown as points to review, not as verdicts.",
      campos: ["rec-ph", "rec-ec"],
    },
  ];
  const original = $("#decision-form .decision-form-grid"),
    tabs = document.createElement("div");
  tabs.className = "decision-steps";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Steps to prepare the plan");
  original.before(tabs);
  for (const paso of pasos) {
    const b = document.createElement("button");
    b.type = "button";
    b.id = `tab-${paso.id}`;
    b.dataset.stepTarget = paso.id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", `step-${paso.id}`);
    b.innerHTML = `${icono(paso.icon)}<span>${esc(paso.label)}</span>`;
    b.onclick = () => setStep(paso.id);
    tabs.append(b);
    const panel = document.createElement("section");
    panel.id = `step-${paso.id}`;
    panel.dataset.formStep = paso.id;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", b.id);
    const description = document.createElement("p");
    description.className = "step-description";
    description.textContent = paso.descripcion;
    panel.append(description);
    const grid = document.createElement("div");
    grid.className = "decision-form-grid";
    for (const id of paso.campos) {
      const campo = document.getElementById(id); // rec-volume no existe si falta la conversión
      if (campo) grid.append(campo.closest("label"));
    }
    panel.append(grid);
    original.before(panel);
  }
  original.remove();
  $("#step-agua").append($("#decision-form .confirmation"));
  let pasoActual = "parcela";
  const back = document.createElement("button");
  back.id = "decision-back";
  back.type = "button";
  back.className = "button";
  back.textContent = "Back";
  const next = document.createElement("button");
  next.id = "decision-next";
  next.type = "button";
  next.className = "button";
  next.textContent = "Continue";
  $("#decision-form .form-actions").prepend(back);
  $("#decision-form .form-actions").append(next);
  function setStep(id) {
    pasoActual = id;
    for (const paso of pasos) {
      const active = paso.id === id;
      document.getElementById(`step-${paso.id}`).hidden = !active;
      const b = document.getElementById(`tab-${paso.id}`);
      b.setAttribute("aria-selected", String(active));
      b.tabIndex = active ? 0 : -1;
    }
    const index = pasos.findIndex((p) => p.id === id);
    back.hidden = index === 0;
    next.hidden = index === pasos.length - 1;
  }
  back.onclick = () =>
    setStep(
      pasos[Math.max(0, pasos.findIndex((p) => p.id === pasoActual) - 1)].id,
    );
  next.onclick = () =>
    setStep(
      pasos[
        Math.min(
          pasos.length - 1,
          pasos.findIndex((p) => p.id === pasoActual) + 1,
        )
      ].id,
    );
  tabs.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const index = pasos.findIndex((p) => p.id === pasoActual);
    const target =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? pasos.length - 1
          : (index + (e.key === "ArrowRight" ? 1 : -1) + pasos.length) %
            pasos.length;
    setStep(pasos[target].id);
    document.getElementById(`tab-${pasoActual}`).focus();
  });
  setStep("parcela");

  /** Lo que capturó la persona. El sistema de riego se anota y no cambia ninguna cifra. */
  function inputs() {
    return {
      cultivo: $("#rec-crop").value || null,
      area: number("#rec-area"),
      volumenDisponible: conVolumen ? number("#rec-volume") : null,
      dotacionConfirmada: $("#rec-allocation-confirmed").checked,
      sistema: $("#rec-system").value,
      fecha: $("#rec-date").value || null,
      ph: number("#rec-ph"),
      salinidad: number("#rec-ec"),
    };
  }
  /** Argumentos de planDeParcela con el escenario vigente del tablero. */
  function pack(entrada = inputs()) {
    const c = contexto() ?? {};
    return {
      cubo,
      parcela: c.parcela ?? null,
      dotacion: c.dotacion,
      lluvia: c.lluvia,
      entrada,
      requisitos: datos?.requisitos ?? null,
      perfil: c.suelo?.perfil?.parcelas?.[c.parcela?.id] ?? null,
      m3PorMillar: conVolumen ? m3PorMillar : null,
    };
  }

  // ------------------------------------------------------------------ lluvia histórica
  /** Gráfica de la comprobación: lluvia observada frente al rango armado con los años anteriores. */
  function graficaClima(casos) {
    const utiles = casos.filter((c) =>
      [c.observado_mm, c.p10_mm, c.p50_mm, c.p90_mm].every(Number.isFinite),
    );
    if (!utiles.length) return "";
    const width = 600,
      height = 150,
      pad = 12,
      max =
        Math.max(...utiles.flatMap((x) => [x.observado_mm, x.p90_mm])) || 1;
    const x = (i) =>
        pad + (i * (width - pad * 2)) / Math.max(1, utiles.length - 1),
      y = (n) => height - pad - (n / max) * (height - pad * 2);
    const line = (key) =>
      utiles.map((c, i) => `${x(i)},${y(c[key])}`).join(" ");
    const band = utiles
      .map((c, i) => `${x(i)},${y(c.p10_mm)}`)
      .concat(
        [...utiles]
          .reverse()
          .map((c, j) => `${x(utiles.length - 1 - j)},${y(c.p90_mm)}`),
      )
      .join(" ");
    return `<article class="climate-chart"><h3>Range built from earlier years against the rainfall observed</h3><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Observed rainfall by year, the median of earlier years and the range of earlier years"><polygon points="${band}" fill="#8abdda" opacity=".12"/><polyline points="${line("p50_mm")}" fill="none" stroke="#8abdda" stroke-width="2" stroke-dasharray="5 5"/><polyline points="${line("observado_mm")}" fill="none" stroke="#b9ed87" stroke-width="2.5"/></svg><div class="chart-key"><span><i></i>Observed (NASA POWER)</span><span><i class="prediction"></i>Median of earlier years</span><span><i class="band"></i>Range of earlier years</span><span>${esc(utiles[0].anio)}–${esc(utiles.at(-1).anio)} · mm</span></div></article>`;
  }
  /** «Historical rainfall range (NASA POWER)» y su comprobación contra los años observados, tal cual salga. */
  function drawRainfall(c) {
    const destino = $("#forecast-analysis");
    if (!destino) return;
    const z = datos?.zonas?.[c.zona];
    const p = z?.pronostico_lluvia,
      v = z?.validacion_lluvia;
    if (!z || !p || !v || !Array.isArray(v.casos)) {
      destino.textContent = "No historical rainfall record is available for this zone.";
      return;
    }
    const [bajo, alto] = Array.isArray(datos.metodo?.intervalo) ? datos.metodo.intervalo : [];
    const percentiles =
      Number.isFinite(bajo) && Number.isFinite(alto)
        ? `between the ${percent(bajo)} and ${percent(alto)} points of the past cycles`
        : "between the low and high ends of the past cycles";
    const rows = v.casos
      .map(
        (x) =>
          `<tr><th scope="row">${esc(x.anio)}</th><td>${esc(x.entrenamiento_fin)}</td><td>${fmt(x.p50_mm)}</td><td>${fmt(x.p10_mm)}–${fmt(x.p90_mm)}</td><td>${fmt(x.observado_mm)}</td><td>${fmt(Math.abs(x.observado_mm - x.p50_mm))}</td></tr>`,
      )
      .join("");
    const excluidos =
      (z.ciclos_excluidos ?? [])
        .map((x) => `${x.anio} (${x.dias_faltantes} missing days)`)
        .join("; ") || "none";
    const frenteAlAnterior = !Number.isFinite(v.mae_mm) || !Number.isFinite(v.mae_persistencia_mm)
      ? ""
      : v.mae_mm < v.mae_persistencia_mm
        ? "The gap of the range median is the lower of the two."
        : "The gap of the range median is not lower than that.";
    const dentro = !Number.isFinite(v.cobertura) || !Number.isFinite(v.cobertura_nominal)
      ? ""
      : v.cobertura < v.cobertura_nominal
        ? "Fewer years fell inside than the range is built for: the range is narrower than the record."
        : "The observed share reaches the share the range is built for. It is a past result, not a guarantee.";
    destino.innerHTML =
      `<div class="section-heading"><h2>Historical rainfall range (NASA POWER)</h2><button class="button" id="download-backtest">Download the check</button></div>
      <p class="section-intro">Rainfall of the full agricultural cycle, October to September, in past years. It describes the record: it is not a weather forecast and it does not forecast the dam. The rainfall comes from a NASA POWER regional grid cell, not from a station or a rain gauge on the field.</p>
      <p class="micro">Cycles left out for missing days: ${esc(excluidos)}.</p><div class="forecast-metrics"><article class="card"><h3>Historical rainfall range (NASA POWER)</h3><strong>${fmt(p.p50_mm)} mm</strong><p>Median of ${fmt(p.n, 0)} complete cycles, through ${esc(z.anios?.at(-1)?.anio ?? SIN_DATO)}.</p><p>Range: ${fmt(p.p10_mm)}–${fmt(p.p90_mm)} mm, ${esc(percentiles)}.</p></article>
      <article class="card"><h3>Check against observed years · typical gap</h3><strong>${fmt(v.mae_mm)} mm</strong><p>Mean absolute gap between the median of earlier years and the rainfall then observed, over ${fmt(v.n, 0)} years.</p><p>Repeating the rainfall of the previous year gives a gap of ${fmt(v.mae_persistencia_mm)} mm. ${esc(frenteAlAnterior)} The difference was not tested for statistical significance.</p></article>
      <article class="card"><h3>Check against observed years · years inside the range</h3><strong>${percent(v.cobertura)}</strong><p>The range is built to hold ${percent(v.cobertura_nominal)} of the years. ${esc(dentro)}</p></article></div>
      ${graficaClima(v.casos)}<details class="card evidence-table"><summary>See each year checked and the data used for it</summary><p>For each year, the range was built with earlier years and nothing later, then compared with the rainfall NASA POWER recorded. This check was not declared before the analysis. It checks rainfall; it does not check water need, harvest or income.</p><div class="table-scroll"><table><thead><tr><th>Year checked</th><th>Data used through</th><th>Median · mm</th><th>Range · mm</th><th>Observed · mm</th><th>Gap · mm</th></tr></thead><tbody>${rows}</tbody></table></div><p>Source file: ${esc(z.fuente_clima)}. Data cut-off: ${esc(z.fecha_corte)}. Incomplete cycles are left out.</p></details>`;
    $("#download-backtest").onclick = () =>
      descargarJson("root-rainfall-range-check.json", {
        zona: c.zona,
        fuente: z.fuente_clima,
        fecha_corte: z.fecha_corte,
        rango_historico: { p10_mm: p.p10_mm, p50_mm: p.p50_mm, p90_mm: p.p90_mm, n: p.n },
        comprobacion: v,
        fuentes: datos.fuentes,
      });
  }

  // ------------------------------------------------------------------ plan
  const fuenteDe = (x) =>
    x.fuente
      ? ` <small>Source: ${fuenteHtml(x.fuente)}${x.etiqueta ? ` ${esc(x.etiqueta)}` : ""}</small>`
      : "";
  const listaHtml = (items) =>
    items.map((x) => `<li>${esc(x.texto)}${fuenteDe(x)}</li>`).join("");
  /** Una tarjeta del plan: lo que cubre la dotación, las restricciones con su fuente y el aviso de juicio. */
  function tarjetaHtml(t) {
    const aviso = `<p class="aviso-juicio">${esc(AVISO_JUICIO)}</p>`;
    const cabeza = `<div class="card-heading"><h3>${esc(t.nombre)}</h3><span class="pill">${esc(t.rotulo)}</span></div>`;
    if (t.estado === "sin_datos")
      return `<article class="card decision-card" data-plan-option="${esc(t.id)}" data-state="${esc(t.estado)}">${cabeza}<p class="decision-action" data-plan-coverage>${esc(t.descripcion)}</p>${aviso}</article>`;
    const fh = formatoHectareas(t.area);
    const plazo =
      t.plazo && Number.isFinite(t.plazo.min) && Number.isFinite(t.plazo.max) && t.plazo.max > 0
        ? `<div><dt>Water term of this option</dt><dd>${t.plazo.min === t.plazo.max ? fmt(t.plazo.max, 0) : `${fmt(t.plazo.min, 0)}–${fmt(t.plazo.max, 0)}`} ${t.plazo.max === 1 ? "year" : "years"}</dd></div>`
        : "";
    const valores = t.sinRiego
      ? `<dl class="decision-values"><div><dt>Water need per year · median</dt><dd>No irrigation needed</dd></div><div><dt>Allocation evaluated</dt><dd>${fmt(t.dotacion, 2)} thousand m³/ha</dd></div>${plazo}</dl>`
      : `<dl class="decision-values"><div><dt>Water need per year · median</dt><dd>${fmt(t.lamina.p50, 2)} thousand m³/ha</dd></div><div><dt>Low to high estimate of its need</dt><dd>${fmt(t.lamina.p10, 2)}–${fmt(t.lamina.p90, 2)} thousand m³/ha</dd></div><div><dt>Allocation evaluated</dt><dd>${fmt(t.dotacion, 2)} thousand m³/ha</dd></div><div><dt>Share of the median need covered</dt><dd>${percent(t.cobertura)}</dd></div>${plazo}</dl>`;
    const restricciones = t.restricciones.length
      ? `<ul class="blocking-reasons">${t.restricciones.map((r) => `<li>${esc(textoRestriccion(r))}${fuenteDe(r)}</li>`).join("")}</ul>`
      : "";
    const pendientes = t.pendientes.length
      ? `<details><summary>Needs a local check (${fmt(t.pendientes.length, 0)})</summary><ul>${listaHtml(t.pendientes)}</ul></details>`
      : "";
    const cumplidas = t.cumplidas.length
      ? `<details><summary>Checks that pass (${fmt(t.cumplidas.length, 0)})</summary><ul>${listaHtml(t.cumplidas)}</ul><p>These are the rules the tool could evaluate. They are not a full agronomic review.</p></details>`
      : "";
    return `<article class="card decision-card ${t.estado === "restriccion" ? "restricted" : ""}" data-plan-option="${esc(t.id)}" data-state="${esc(t.estado)}" data-area="${esc(fh(t.area))}" data-ha="${esc(fh(t.hectareas.p50))}" data-ha-low="${esc(fh(t.hectareas.bajo))}" data-ha-high="${esc(fh(t.hectareas.alto))}">${cabeza}<p class="decision-action" data-plan-coverage>${esc(t.descripcion)}</p>
      ${valores}${restricciones}${pendientes}${cumplidas}
      <details><summary>How this is calculated</summary><p>Covered hectares = area × the share of the median water need that the allocation covers, never above the whole area. The low end of the range uses the high estimate of the need; the high end uses the low estimate. The water need comes from the project data file (data/cubo.json) and the rule is the one the field card uses (reglas.js), so both show the same hectares for the same field, allocation and rainfall.</p><p>${esc(ALCANCE)}</p></details>
      ${aviso}</article>`;
  }
  function render() {
    const c = contexto() ?? {};
    last = planDeParcela(pack());
    const fieldIrrigation = $("#field-irrigation");
    if (fieldIrrigation)
      fieldIrrigation.textContent =
        $("#rec-system").value === "sin_confirmar"
          ? SISTEMAS.sin_confirmar
          : `${SISTEMAS[$("#rec-system").value] ?? SISTEMAS.sin_confirmar} · entered by you`;
    $("#decision-budget").textContent =
      `Scenario: allocation of ${fmt(c.dotacion, 2)} thousand m³/ha · ${Number(c.lluvia) < 0 ? `less rain (${fmt(Number(c.lluvia), 0)}%)` : "rainfall as in the record"}.${conVolumen ? " A total volume, if you enter one, replaces the allocation in this plan and nowhere else." : ""}`;
    const resumen = $("#decision-summary");
    if (last.estado !== "calculado") {
      resumen.textContent = last.errores.length
        ? `${last.errores.join(" ")} ${last.motivo ?? ""}`.trim()
        : (last.motivo ?? "No plan is shown.");
      $("#recommendations").innerHTML = "";
    } else {
      const total = last.tarjetas.length;
      resumen.innerHTML =
        `<p>${fmt(total, 0)} ${total === 1 ? "option" : "options"} from the project data for field ${esc(last.parcela.id)}, with an allocation of ${fmt(last.dotacion, 2)} thousand m³/ha on ${esc(formatoHectareas(last.area)(last.area))} ha. Each card describes what the water covers and any restriction found, with its source. The cards follow the order of the data file; that order is not a ranking.</p>` +
        (last.avisos.length
          ? `<ul class="plan-notes">${last.avisos.map((a) => `<li>${esc(a.texto)}${fuenteDe(a)}</li>`).join("")}</ul>`
          : "");
      $("#recommendations").innerHTML = last.tarjetas.map(tarjetaHtml).join("");
    }
    $("#decision-checks").textContent = "";
    if (c.parcela?.id)
      registros[c.parcela.id] = [...$("#decision-form").elements]
        .filter((e) => e.id)
        .map((e) => [e.id, e.type === "checkbox" ? e.checked : e.value]);
  }
  function actualizar() {
    const c = contexto() ?? {};
    drawRainfall(c);
    if (!c.parcela) {
      field = null;
      last = planDeParcela(pack());
      $("#decision-summary").textContent = last.motivo ?? "No field is selected.";
      $("#recommendations").innerHTML = "";
      return;
    }
    if (field !== c.parcela.id) {
      $("#decision-form").reset();
      setStep("parcela");
      field = c.parcela.id;
      $("#rec-area").value = Number.isFinite(c.parcela.area_ha) ? c.parcela.area_ha : "";
      for (const [id, value] of registros[field] ?? []) {
        const el = document.getElementById(id);
        if (el)
          el.type === "checkbox" ? (el.checked = value) : (el.value = value);
      }
      $("#decision-field").textContent =
        `Field ${field} · satellite classification: ${c.parcela.abstencion ? nombreCultivo("sin_clasificar") : nombreCultivo(c.parcela.cultivo_actual)}`;
    }
    render();
  }
  // Mostrar el paso del campo inválido antes de pedir al navegador que lo enfoque.
  $("#decision-form").noValidate = true;
  $("#decision-form").onsubmit = (e) => {
    e.preventDefault();
    const invalid = $("#decision-form").querySelector(":invalid");
    if (invalid) {
      const step = invalid.closest("[data-form-step]");
      if (step) setStep(step.dataset.formStep);
      changed();
      invalid.reportValidity();
      return;
    }
    render();
  };
  const changed = () => {
    if ($("#decision-form").checkValidity()) render();
    else {
      last = {
        estado: "entradas_invalidas",
        errores: ["Invalid inputs: no plan is shown."],
        tarjetas: [],
        entrada: inputs(),
      };
      $("#recommendations").innerHTML = "";
      $("#decision-summary").textContent =
        "Check the fields marked before calculating. Invalid values are not replaced by assumptions.";
    }
  };
  $("#decision-form").addEventListener("change", changed);
  $("#decision-form").addEventListener("input", changed);
  $("#download-audit").onclick = () =>
    descargarJson(`root-water-coverage-${field ?? "no-field"}.json`, {
      ...last,
      entrada: inputs(),
      version: "plan_from_cubo_json_and_reglas_js",
      entrada_origen: "Entered by the user and taken from the scenario; not verified by the tool",
    });
  $("#download-inputs").onclick = () =>
    descargarJson(`root-inputs-${field ?? "no-field"}.json`, inputs());
  $("#run-checks").onclick = () => {
    const c = contexto() ?? {};
    // Zona o parcela nulas: comprobarPlan lo dice con palabras; no se lee nada de una zona que no existe.
    const checks = comprobarPlan(pack(), datos?.zonas?.[c.zona]?.validacion_lluvia ?? null);
    $("#decision-checks").innerHTML =
      `<p>${fmt(checks.filter((x) => x.ok).length, 0)} of ${fmt(checks.length, 0)} checks pass. They are consistency checks of the software, not agronomic trials.</p><ul>${checks.map((x) => `<li>${x.ok ? "✓" : "✕"} ${esc(x.nombre)}: ${esc(x.detalle)}</li>`).join("")}</ul>`;
  };
  actualizar();
  return { actualizar };
}
