// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// Vista «Planificar» y bloque de lluvia histórica del tablero (web/index.html).
// - El plan sale de web/js/recomendador.js, que usa las láminas de data/cubo.json y las reglas de web/reglas.js:
//   las mismas cifras que la ficha de la parcela (web/explorer.html). Aquí se dibuja y nada más.
// - La interfaz describe; no ordena ni califica las opciones. Cada tarjeta lleva el aviso de juicio.
// - Los textos visibles salen de web/js/textos_asesor.js en el idioma en uso (inglés, español, portugués o
//   francés) y todo se vuelve a dibujar cuando el idioma cambia. Las cifras llevan el formato de ese idioma.
// - Todo texto que viene de los datos o de la persona se escapa antes de entrar al DOM; un enlace se arma
//   con http o https y con ningún otro esquema.
import { icono } from "./interfaz.js";
import {
  avisoJuicio,
  alcance,
  planDeParcela,
  comprobarPlan,
  textoRestriccion,
  nombreCultivo,
  formatoHa,
} from "./recomendador.js";
import { t, fmtNumero, fmtFecha, alCambiarIdioma, idioma } from "./i18n.js";

const POR_CIENTO = 100; // la lluvia del escenario llega en puntos porcentuales
const fmt = (n, d = 1) =>
  Number.isFinite(n) ? fmtNumero(n, { maximumFractionDigits: d }) : t("asesor.sin_dato");
const percent = (n) =>
  Number.isFinite(n)
    ? fmtNumero(n, { style: "percent", maximumFractionDigits: 0 })
    : t("asesor.sin_dato");
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

/** Un enlace se arma con http o https; cualquier otro esquema se deja como texto. */
export function enlaceSeguro(url) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
const URL_EN_TEXTO = /https?:\/\/[^\s<>"')]+/g;
/** Texto de una fuente, escapado, con sus direcciones http(s) convertidas en enlaces. */
export function fuenteHtml(texto) {
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
const SISTEMAS = ["sin_confirmar", "gravedad", "goteo"];
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Crea el asesor del tablero. `contexto()` devuelve el estado vigente:
 * { zona, parcela (properties de parcelas.geojson), suelo, dotacion, lluvia } y, si se quiere evitar una
 * segunda lectura del archivo, `cubo` (opcional). Devuelve { actualizar }.
 */
export async function crearAsesor(contexto) {
  let cubo = null; // data/cubo.json: de aquí salen las láminas del plan
  let datos = null; // data/pronostico.json: lluvia histórica, intervalos de suelo y la conversión de volumen
  let last = null;
  let field = null;
  let pasoActual = "parcela";
  let pasos = [];
  let lluviaDibujada = null; // zona e idioma del bloque de lluvia ya dibujado
  const registros = {};
  try {
    cubo = contexto()?.cubo ?? (await leer("data/cubo.json"));
  } catch (e) {
    const sinDatos = () => {
      $("#decision-summary").textContent = t("asesor.carga.error", { detalle: e.message });
      $("#forecast-analysis").textContent = t("asesor.lluvia.no_disponible");
    };
    sinDatos();
    alCambiarIdioma(sinDatos);
    return { actualizar() {} };
  }
  try {
    datos = await leer("data/pronostico.json");
  } catch {
    datos = null; // el plan sigue: faltan la lluvia histórica, los intervalos de suelo y la captura de volumen
  }
  const m3PorMillar = Number(datos?.metodo?.m3_por_millar);
  const conVolumen = Number.isFinite(m3PorMillar) && m3PorMillar > 0;

  // ------------------------------------------------------------------ formulario por pasos
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
    $("#decision-back").hidden = index === 0;
    $("#decision-next").hidden = index === pasos.length - 1;
  }
  /** Lo capturado en la parcela vigente, para devolverlo al volver a ella o al cambiar de idioma. */
  function guardarCaptura() {
    const form = $("#decision-form");
    if (!form || !field) return;
    registros[field] = [...form.elements]
      .filter((e) => e.id)
      .map((e) => [e.id, e.type === "checkbox" ? e.checked : e.value]);
  }
  function restaurarCaptura() {
    for (const [id, value] of registros[field] ?? []) {
      const el = document.getElementById(id);
      if (el) el.type === "checkbox" ? (el.checked = value) : (el.value = value);
    }
  }
  function rotuloDeParcela(parcela) {
    $("#decision-field").textContent = parcela
      ? t("asesor.form.parcela", {
          id: parcela.id,
          cultivo: nombreCultivo(parcela.abstencion ? "sin_clasificar" : parcela.cultivo_actual),
        })
      : "";
  }
  /** Arma el formulario en el idioma en uso. Se llama al crear el asesor y cada vez que cambia el idioma. */
  function montarFormulario() {
    $("#decision-inputs").innerHTML =
      `<form id="decision-form" class="card decision-form">
      <div class="form-heading"><h3>${esc(t("asesor.form.titulo"))}</h3><span id="decision-field"></span></div>
      <div class="decision-form-grid">
      <label>${esc(t("asesor.form.cultivo"))}<select id="rec-crop"><option value="">${esc(t("asesor.form.cultivo_sin_confirmar"))}</option>${CULTIVOS_DEL_FORMULARIO.map(
        (id) =>
          `<option value="${esc(id)}">${esc(mayuscula(nombreCultivo(id)))}</option>`,
      ).join("")}</select></label>
      ${input("rec-area", t("asesor.form.area"), "number", { min: 0.01, step: "any", required: "", inputmode: "decimal" })}
      ${input("rec-date", t("asesor.form.fecha"), "date")}
      ${conVolumen ? input("rec-volume", t("asesor.form.volumen"), "number", { min: 0, step: "any", inputmode: "decimal" }) : ""}
      <label>${esc(t("asesor.form.sistema"))}<select id="rec-system">${SISTEMAS.map(
        (id) =>
          `<option value="${esc(id)}">${esc(t(`asesor.sistema.${id}`))}</option>`,
      ).join("")}</select></label>
      ${input("rec-ph", t("asesor.form.ph"), "number", { min: 0, max: 14, step: "any", inputmode: "decimal" })}
      ${input("rec-ec", t("asesor.form.ece"), "number", { min: 0, step: "any", inputmode: "decimal" })}
      </div>
      <label class="confirmation"><input id="rec-allocation-confirmed" type="checkbox">${esc(t("asesor.form.confirmo"))}</label>
      <p id="decision-budget" class="micro"></p>
      <p class="micro">${esc(t("asesor.form.privacidad"))}</p>
      <div class="form-actions"><button class="button dark" type="submit">${esc(t("asesor.form.calcular"))}</button><button class="button" type="button" id="download-inputs">${esc(t("asesor.form.descargar_entradas"))}</button></div>
      </form>`;
    // Dividir la captura en pasos sin cambiar las entradas ni sus validaciones.
    pasos = [
      { id: "parcela", icon: "map", campos: ["rec-crop", "rec-area", "rec-date"] },
      { id: "agua", icon: "drop", campos: ["rec-volume", "rec-system"] },
      { id: "suelo", icon: "sprout", campos: ["rec-ph", "rec-ec"] },
    ];
    const form = $("#decision-form");
    const original = form.querySelector(".decision-form-grid"),
      tabs = document.createElement("div");
    tabs.className = "decision-steps";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", t("asesor.form.pasos"));
    original.before(tabs);
    for (const paso of pasos) {
      const b = document.createElement("button");
      b.type = "button";
      b.id = `tab-${paso.id}`;
      b.dataset.stepTarget = paso.id;
      b.setAttribute("role", "tab");
      b.setAttribute("aria-controls", `step-${paso.id}`);
      b.innerHTML = `${icono(paso.icon)}<span>${esc(t(`asesor.paso.${paso.id}`))}</span>`;
      b.onclick = () => setStep(paso.id);
      tabs.append(b);
      const panel = document.createElement("section");
      panel.id = `step-${paso.id}`;
      panel.dataset.formStep = paso.id;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", b.id);
      const description = document.createElement("p");
      description.className = "step-description";
      description.textContent = t(`asesor.paso.${paso.id}_desc`);
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
    $("#step-agua").append(form.querySelector(".confirmation"));
    const back = document.createElement("button");
    back.id = "decision-back";
    back.type = "button";
    back.className = "button";
    back.textContent = t("asesor.form.atras");
    const next = document.createElement("button");
    next.id = "decision-next";
    next.type = "button";
    next.className = "button";
    next.textContent = t("asesor.form.continuar");
    form.querySelector(".form-actions").prepend(back);
    form.querySelector(".form-actions").append(next);
    const indice = () => pasos.findIndex((p) => p.id === pasoActual);
    back.onclick = () => setStep(pasos[Math.max(0, indice() - 1)].id);
    next.onclick = () => setStep(pasos[Math.min(pasos.length - 1, indice() + 1)].id);
    tabs.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      e.preventDefault();
      const target =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? pasos.length - 1
            : (indice() + (e.key === "ArrowRight" ? 1 : -1) + pasos.length) % pasos.length;
      setStep(pasos[target].id);
      document.getElementById(`tab-${pasoActual}`).focus();
    });
    // Mostrar el paso del campo inválido antes de pedir al navegador que lo enfoque.
    form.noValidate = true;
    form.onsubmit = (e) => {
      e.preventDefault();
      const invalid = form.querySelector(":invalid");
      if (invalid) {
        const step = invalid.closest("[data-form-step]");
        if (step) setStep(step.dataset.formStep);
        changed();
        invalid.reportValidity();
        return;
      }
      render();
    };
    form.addEventListener("change", changed);
    form.addEventListener("input", changed);
    $("#download-inputs").onclick = () =>
      descargarJson(`root-inputs-${field ?? "no-field"}.json`, inputs());
    setStep(pasoActual);
  }

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
      max = Math.max(...utiles.flatMap((x) => [x.observado_mm, x.p90_mm])) || 1;
    const x = (i) => pad + (i * (width - pad * 2)) / Math.max(1, utiles.length - 1),
      y = (n) => height - pad - (n / max) * (height - pad * 2);
    const line = (key) => utiles.map((c, i) => `${x(i)},${y(c[key])}`).join(" ");
    const band = utiles
      .map((c, i) => `${x(i)},${y(c.p10_mm)}`)
      .concat([...utiles].reverse().map((c, j) => `${x(utiles.length - 1 - j)},${y(c.p90_mm)}`))
      .join(" ");
    return `<article class="climate-chart"><h3>${esc(t("asesor.lluvia.grafica_titulo"))}</h3><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(t("asesor.lluvia.grafica_aria"))}"><polygon points="${band}" fill="#8abdda" opacity=".12"/><polyline points="${line("p50_mm")}" fill="none" stroke="#8abdda" stroke-width="2" stroke-dasharray="5 5"/><polyline points="${line("observado_mm")}" fill="none" stroke="#b9ed87" stroke-width="2.5"/></svg><div class="chart-key"><span><i></i>${esc(t("asesor.lluvia.leyenda_observado"))}</span><span><i class="prediction"></i>${esc(t("asesor.lluvia.leyenda_mediana"))}</span><span><i class="band"></i>${esc(t("asesor.lluvia.leyenda_rango"))}</span><span>${esc(utiles[0].anio)}–${esc(utiles.at(-1).anio)} · mm</span></div></article>`;
  }
  /** Rango histórico de lluvia (NASA POWER) y su comprobación contra los años observados, tal cual salga. */
  function drawRainfall(c) {
    const destino = $("#forecast-analysis");
    if (!destino) return;
    // No depende de la dotación: se dibuja al cambiar de zona o de idioma, no con cada movimiento del deslizador
    // (así no se cierra la tabla que la persona tenga abierta).
    const llave = `${c.zona}|${idioma()}`;
    if (llave === lluviaDibujada) return;
    lluviaDibujada = llave;
    const z = datos?.zonas?.[c.zona];
    const p = z?.pronostico_lluvia,
      v = z?.validacion_lluvia;
    if (!z || !p || !v || !Array.isArray(v.casos)) {
      destino.textContent = t(datos ? "asesor.lluvia.sin_zona" : "asesor.lluvia.no_disponible");
      return;
    }
    const [bajo, alto] = Array.isArray(datos.metodo?.intervalo) ? datos.metodo.intervalo : [];
    const rango =
      Number.isFinite(bajo) && Number.isFinite(alto)
        ? t("asesor.lluvia.rango", { bajo: fmt(p.p10_mm), alto: fmt(p.p90_mm), desde: percent(bajo), hasta: percent(alto) })
        : t("asesor.lluvia.rango_simple", { bajo: fmt(p.p10_mm), alto: fmt(p.p90_mm) });
    const rows = v.casos
      .map(
        (x) =>
          `<tr><th scope="row">${esc(x.anio)}</th><td>${esc(x.entrenamiento_fin)}</td><td>${esc(fmt(x.p50_mm))}</td><td>${esc(fmt(x.p10_mm))}–${esc(fmt(x.p90_mm))}</td><td>${esc(fmt(x.observado_mm))}</td><td>${esc(fmt(Math.abs(x.observado_mm - x.p50_mm)))}</td></tr>`,
      )
      .join("");
    const excluidos =
      (z.ciclos_excluidos ?? [])
        .map((x) => t("asesor.lluvia.excluido", { anio: x.anio, dias: fmt(x.dias_faltantes, 0) }))
        .join("; ") || t("asesor.lluvia.ninguno");
    // El resultado se dice como salga: si la mediana del rango no queda por debajo de repetir el año anterior, se dice.
    const frenteAlAnterior =
      !Number.isFinite(v.mae_mm) || !Number.isFinite(v.mae_persistencia_mm)
        ? ""
        : t(v.mae_mm < v.mae_persistencia_mm ? "asesor.lluvia.anterior_menor" : "asesor.lluvia.anterior_no_menor");
    const dentro =
      !Number.isFinite(v.cobertura) || !Number.isFinite(v.cobertura_nominal)
        ? ""
        : t(v.cobertura < v.cobertura_nominal ? "asesor.lluvia.dentro_menos" : "asesor.lluvia.dentro_alcanza");
    const titulo = esc(t("asesor.lluvia.titulo"));
    destino.innerHTML =
      `<div class="section-heading"><h2>${titulo}</h2><button class="button" id="download-backtest">${esc(t("asesor.lluvia.descargar"))}</button></div>
      <p class="section-intro">${esc(t("asesor.lluvia.intro"))}</p>
      <p class="micro">${esc(t("asesor.lluvia.excluidos", { lista: excluidos }))}</p><div class="forecast-metrics"><article class="card"><h3>${titulo}</h3><strong>${esc(fmt(p.p50_mm))} mm</strong><p>${esc(t("asesor.lluvia.mediana", { n: fmt(p.n, 0), anio: z.anios?.at(-1)?.anio ?? t("asesor.sin_dato") }))}</p><p>${esc(rango)}</p></article>
      <article class="card"><h3>${esc(t("asesor.lluvia.brecha_titulo"))}</h3><strong>${esc(fmt(v.mae_mm))} mm</strong><p>${esc(t("asesor.lluvia.brecha", { n: fmt(v.n, 0) }))}</p><p>${esc(t("asesor.lluvia.anterior", { mm: fmt(v.mae_persistencia_mm) }))} ${esc(frenteAlAnterior)} ${esc(t("asesor.lluvia.sin_significancia"))}</p></article>
      <article class="card"><h3>${esc(t("asesor.lluvia.dentro_titulo"))}</h3><strong>${esc(percent(v.cobertura))}</strong><p>${esc(t("asesor.lluvia.dentro", { nominal: percent(v.cobertura_nominal) }))} ${esc(dentro)}</p></article></div>
      ${graficaClima(v.casos)}<details class="card evidence-table"><summary>${esc(t("asesor.lluvia.detalle_titulo"))}</summary><p>${esc(t("asesor.lluvia.detalle_texto"))}</p><div class="table-scroll"><table><thead><tr><th>${esc(t("asesor.lluvia.col_anio"))}</th><th>${esc(t("asesor.lluvia.col_hasta"))}</th><th>${esc(t("asesor.lluvia.col_mediana"))}</th><th>${esc(t("asesor.lluvia.col_rango"))}</th><th>${esc(t("asesor.lluvia.col_observado"))}</th><th>${esc(t("asesor.lluvia.col_brecha"))}</th></tr></thead><tbody>${rows}</tbody></table></div><p>${esc(t("asesor.lluvia.pie", { fuente: z.fuente_clima ?? t("asesor.sin_dato"), corte: fmtFecha(z.fecha_corte) }))}</p></details>`;
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
  const unidad = () => t("asesor.unidad.millares");
  const fuenteDe = (x) =>
    x.fuente
      ? ` <small>${esc(t("asesor.fuente"))} ${fuenteHtml(x.fuente)}${x.etiqueta ? ` ${esc(x.etiqueta)}` : ""}</small>`
      : "";
  const listaHtml = (items) =>
    items.map((x) => `<li>${esc(x.texto)}${fuenteDe(x)}</li>`).join("");
  /** Una tarjeta del plan: lo que cubre la dotación, las restricciones con su fuente y el aviso de juicio. */
  function tarjetaHtml(x) {
    const aviso = `<p class="aviso-juicio">${esc(avisoJuicio())}</p>`;
    const cabeza = `<div class="card-heading"><h3>${esc(x.nombre)}</h3><span class="pill">${esc(x.rotulo)}</span></div>`;
    if (x.estado === "sin_datos")
      return `<article class="card decision-card" data-plan-option="${esc(x.id)}" data-state="${esc(x.estado)}">${cabeza}<p class="decision-action" data-plan-coverage>${esc(x.descripcion)}</p>${aviso}</article>`;
    // Una cifra con su rótulo; la unidad va aparte y más pequeña, para que la cifra se lea de un vistazo en el teléfono.
    const dato = (rotulo, valor, u = "") =>
      `<div><dt>${esc(rotulo)}</dt><dd>${esc(valor)}${u ? ` <span class="unit">${esc(u)}</span>` : ""}</dd></div>`;
    const plazo =
      x.plazo && Number.isFinite(x.plazo.min) && Number.isFinite(x.plazo.max) && x.plazo.max > 0
        ? dato(
            t("asesor.tarjeta.plazo"),
            x.plazo.min === x.plazo.max ? fmt(x.plazo.max, 0) : `${fmt(x.plazo.min, 0)}–${fmt(x.plazo.max, 0)}`,
            t(x.plazo.max === 1 ? "asesor.unidad.anio" : "asesor.unidad.anios"),
          )
        : "";
    const dotacion = dato(t("asesor.tarjeta.dotacion"), fmt(x.dotacion, 2), unidad());
    const valores = x.sinRiego
      ? dato(t("asesor.tarjeta.demanda"), t("asesor.tarjeta.sin_riego")) + dotacion + plazo
      : dato(t("asesor.tarjeta.demanda"), fmt(x.lamina.p50, 2), unidad()) +
        dato(t("asesor.tarjeta.rango"), `${fmt(x.lamina.p10, 2)}–${fmt(x.lamina.p90, 2)}`, unidad()) +
        dotacion +
        dato(t("asesor.tarjeta.cubierto"), percent(x.cobertura)) +
        plazo;
    const restricciones = x.restricciones.length
      ? `<ul class="blocking-reasons">${x.restricciones.map((r) => `<li>${esc(textoRestriccion(r))}${fuenteDe(r)}</li>`).join("")}</ul>`
      : "";
    const pendientes = x.pendientes.length
      ? `<details data-parte="pendientes"><summary>${esc(t("asesor.tarjeta.pendientes", { n: fmt(x.pendientes.length, 0) }))}</summary><ul>${listaHtml(x.pendientes)}</ul></details>`
      : "";
    const cumplidas = x.cumplidas.length
      ? `<details data-parte="cumplidas"><summary>${esc(t("asesor.tarjeta.cumplidas", { n: fmt(x.cumplidas.length, 0) }))}</summary><ul>${listaHtml(x.cumplidas)}</ul><p>${esc(t("asesor.tarjeta.cumplidas_nota"))}</p></details>`
      : "";
    const ha = x.hectareas_ficha;
    return `<article class="card decision-card ${x.estado === "restriccion" ? "restricted" : ""}" data-plan-option="${esc(x.id)}" data-state="${esc(x.estado)}" data-area="${esc(ha.area)}" data-ha="${esc(ha.p50)}" data-ha-low="${esc(ha.bajo)}" data-ha-high="${esc(ha.alto)}">${cabeza}<p class="decision-action" data-plan-coverage>${esc(x.descripcion)}</p>
      <dl class="decision-values">${valores}</dl>${restricciones}${pendientes}${cumplidas}
      <details data-parte="calculo"><summary>${esc(t("asesor.tarjeta.calculo"))}</summary><p>${esc(t("asesor.tarjeta.calculo_texto"))}</p><p>${esc(alcance())}</p></details>
      ${aviso}</article>`;
  }
  function render() {
    const c = contexto() ?? {};
    last = planDeParcela(pack());
    const sistema = $("#rec-system").value;
    const fieldIrrigation = $("#field-irrigation");
    if (fieldIrrigation)
      fieldIrrigation.textContent =
        sistema === "sin_confirmar" || !SISTEMAS.includes(sistema)
          ? t("asesor.sistema.sin_confirmar")
          : t("asesor.sistema.capturado", { sistema: t(`asesor.sistema.${sistema}`) });
    const lluvia = Number(c.lluvia);
    $("#decision-budget").textContent =
      t("asesor.form.escenario", {
        dotacion: fmt(c.dotacion, 2),
        unidad: unidad(),
        lluvia: lluvia < 0 ? t("asesor.form.lluvia_menos", { pct: percent(lluvia / POR_CIENTO) }) : t("asesor.form.lluvia_historica"),
      }) + (conVolumen ? ` ${t("asesor.form.volumen_nota")}` : "");
    const resumen = $("#decision-summary");
    if (last.estado !== "calculado") {
      resumen.textContent = last.errores.length
        ? `${last.errores.join(" ")} ${last.motivo ?? ""}`.trim()
        : (last.motivo ?? t("asesor.plan.sin_plan"));
      $("#recommendations").innerHTML = "";
    } else {
      const total = last.tarjetas.length;
      resumen.innerHTML =
        `<p>${esc(
          t(total === 1 ? "asesor.resumen.una" : "asesor.resumen.varias", {
            n: fmt(total, 0),
            id: last.parcela.id,
            dotacion: fmt(last.dotacion, 2),
            unidad: unidad(),
            area: formatoHa(last.area)(last.area),
          }),
        )}</p>` +
        (last.avisos.length
          ? `<ul class="plan-notes">${last.avisos.map((a) => `<li>${esc(a.texto)}${fuenteDe(a)}</li>`).join("")}</ul>`
          : "");
      // Al mover el deslizador las tarjetas se dibujan de nuevo: lo que la persona tenía desplegado sigue abierto.
      const lista = $("#recommendations");
      const llaveDe = (d) => `${d.closest("[data-plan-option]")?.dataset.planOption}|${d.dataset.parte}`;
      const abiertos = new Set([...lista.querySelectorAll("details[open]")].map(llaveDe));
      lista.innerHTML = last.tarjetas.map(tarjetaHtml).join("");
      for (const d of lista.querySelectorAll("details")) if (abiertos.has(llaveDe(d))) d.open = true;
    }
    $("#decision-checks").textContent = "";
    guardarCaptura();
  }
  function changed() {
    if ($("#decision-form").checkValidity()) render();
    else {
      last = {
        estado: "entradas_invalidas",
        errores: [t("asesor.form.invalido_corto")],
        tarjetas: [],
        entrada: inputs(),
      };
      $("#recommendations").innerHTML = "";
      $("#decision-summary").textContent = t("asesor.form.invalido");
    }
  }
  function actualizar() {
    const c = contexto() ?? {};
    drawRainfall(c);
    if (!c.parcela) {
      field = null;
      last = planDeParcela(pack());
      rotuloDeParcela(null);
      $("#decision-summary").textContent = last.motivo ?? t("asesor.plan.sin_parcela");
      $("#recommendations").innerHTML = "";
      return;
    }
    if (field !== c.parcela.id) {
      $("#decision-form").reset();
      setStep("parcela");
      field = c.parcela.id;
      $("#rec-area").value = Number.isFinite(c.parcela.area_ha) ? c.parcela.area_ha : "";
      restaurarCaptura();
    }
    rotuloDeParcela(c.parcela);
    render();
  }

  montarFormulario();
  $("#download-audit").onclick = () =>
    descargarJson(`root-water-coverage-${field ?? "no-field"}.json`, {
      ...last,
      entrada: inputs(),
      version: "plan_from_cubo_json_and_reglas_js",
      entrada_origen: t("asesor.descarga.origen"),
    });
  $("#run-checks").onclick = () => {
    const c = contexto() ?? {};
    // Zona o parcela nulas: comprobarPlan lo dice con palabras; no se lee nada de una zona que no existe.
    const checks = comprobarPlan(pack(), datos?.zonas?.[c.zona]?.validacion_lluvia ?? null);
    $("#decision-checks").innerHTML =
      `<p>${esc(t("asesor.prueba.resumen", { pasan: fmt(checks.filter((x) => x.ok).length, 0), total: fmt(checks.length, 0) }))}</p><ul>${checks.map((x) => `<li>${x.ok ? "✓" : "✕"} ${esc(x.nombre)}: ${esc(x.detalle)}</li>`).join("")}</ul>`;
  };
  // Cambio de idioma: el formulario se arma de nuevo con lo ya capturado y todo se vuelve a dibujar.
  alCambiarIdioma(() => {
    guardarCaptura();
    montarFormulario();
    restaurarCaptura();
    actualizar();
  });
  actualizar();
  return { actualizar };
}
