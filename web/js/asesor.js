// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; Codex.
import { icono } from "./interfaz.js";
import { evaluarPlan, demandaHistorica } from "./recomendador.js";
const fmt = (n, d = 1) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat("es-MX", { maximumFractionDigits: d }).format(n)
    : "Sin dato";
const escape = (s) =>
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
const percent = (n) =>
  Number.isFinite(n) ? `${fmt(n * 100, 0)}%` : "Sin dato";
const number = (id) => {
  const v = $(id).value.trim();
  return v === "" ? null : Number(v);
};
const input = (id, label, type = "number", extra = {}) =>
  `<label>${label}<input id="${id}" type="${type}" ${Object.entries(extra)
    .map(([k, v]) => `${k}="${escape(v)}"`)
    .join(" ")}></label>`;
function saveFile(name, obj) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function crearAsesor(contexto) {
  let datos,
    last = null,
    field = null;
  const registros = {};
  try {
    const r = await fetch("data/pronostico.json");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    datos = await r.json();
  } catch (e) {
    $("#decision-summary").textContent =
      `No se pudo cargar el motor: ${e.message}. No se generan recomendaciones.`;
    $("#forecast-analysis").textContent =
      "Pronóstico no disponible: no se pudieron leer los históricos.";
    return { actualizar() {} };
  }
  const labels = {
    barbecho: "Terreno sin cultivo · lo confirmo",
    cereal_invierno: "Avena forrajera · representante del cereal de invierno",
    maiz_forrajero: "Maíz forrajero",
    algodon: "Algodón",
    chile: "Chile",
    alfalfa: "Alfalfa",
    nogal: "Nogal",
    sorgo: "Sorgo forrajero",
  };
  $("#decision-inputs").innerHTML =
    `<form id="decision-form" class="card decision-form">
    <div class="form-heading"><h3>Datos para este cálculo</h3><span id="decision-field"></span></div>
    <div class="decision-form-grid">
    <label>¿Qué había en tu parcela?<select id="rec-crop"><option value="">No confirmado · usar detección como hipótesis</option>${Object.entries(
      labels,
    )
      .map(([id, label]) => `<option value="${id}">${label}</option>`)
      .join("")}</select></label>
    <label>¿Qué quieres comparar?<select id="rec-target"><option value="">Solo opciones del catálogo para el cultivo previo</option></select></label>
    ${input("rec-area", "Superficie que quieres evaluar · ha", "number", { min: 0.01, step: "any", required: "" })}
    ${input("rec-volume", "Volumen disponible total · m³ (opcional)", "number", { min: 0, step: "any" })}
    <label>¿Cómo riegas?<select id="rec-system"><option value="sin_confirmar">Sin confirmar</option><option value="gravedad">Gravedad / superficial</option><option value="goteo">Goteo</option></select></label>
    ${input("rec-efficiency", "Eficiencia medida · % (opcional)", "number", { min: 0.01, max: 100, step: "any" })}
    ${input("rec-date", "Fecha prevista de primera siembra", "date")}
    <label>Nivel de planificación histórico<select id="rec-level"></select></label>
    ${input("rec-ph", "pH de laboratorio (opcional)", "number", { min: 0, max: 14, step: "any" })}
    ${input("rec-ec", "ECe del suelo · dS/m (opcional)", "number", { min: 0, step: "any" })}
    <label>Antecedente de Phytophthora<select id="rec-disease"><option value="desconocido">Desconocido</option><option value="no">No reportado por el usuario</option><option value="si">Sí reportado</option></select></label>
    <label>Uso previo de atrazina<select id="rec-herbicide"><option value="desconocido">Desconocido</option><option value="no">No reportado por el usuario</option><option value="si">Sí reportado</option></select></label>
    ${input("rec-age", "Edad confirmada de alfalfa · años (opcional)", "number", { min: 0, step: "any" })}
    <label>Ciclo de un riego ya registrado<select id="rec-observed-year"><option value="">Sin medición histórica</option></select></label>
    ${input("rec-observed-volume", "Riego aplicado en ese ciclo · m³ (opcional)", "number", { min: 0, step: "any" })}
    </div>
    <label class="confirmation"><input id="rec-allocation-confirmed" type="checkbox">Confirmo que la dotación o volumen corresponden a mi disponibilidad de agua.</label>
    <p id="decision-budget" class="micro"></p>
    <p class="micro">La captura se conserva solo en esta sesión. La ECe es del suelo, no la conductividad del agua de riego. El campo vacío significa desconocido, nunca cero.</p>
    <div class="form-actions"><button class="button dark" type="submit">Calcular plan</button><button class="button" type="button" id="download-inputs">Descargar mis entradas</button></div>
    </form>`;
  // Dividir la captura en pasos sin cambiar las entradas del motor ni sus validaciones.
  const pasos = [
    {
      id: "parcela",
      label: "Tu parcela",
      icon: "map",
      descripcion:
        "Empieza por lo que conoces: qué había en tu terreno, qué quieres comparar y cuánto espacio tienes.",
      campos: ["rec-crop", "rec-target", "rec-area", "rec-date"],
    },
    {
      id: "agua",
      label: "Tu agua",
      icon: "drop",
      descripcion:
        "Indica tu disponibilidad y cómo riegas. Si no tienes una medición, el cálculo mostrará la referencia utilizada.",
      campos: ["rec-volume", "rec-system", "rec-efficiency", "rec-level"],
    },
    {
      id: "suelo",
      label: "Más contexto",
      icon: "sprout",
      descripcion:
        "Completa solo los datos que conoces. El suelo, los antecedentes y un riego registrado ayudan a contrastar el plan.",
      campos: [
        "rec-ph",
        "rec-ec",
        "rec-disease",
        "rec-herbicide",
        "rec-age",
        "rec-observed-year",
        "rec-observed-volume",
      ],
    },
  ];
  const original = $("#decision-form .decision-form-grid"),
    tabs = document.createElement("div");
  tabs.className = "decision-steps";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Pasos para preparar el plan");
  original.before(tabs);
  for (const paso of pasos) {
    const b = document.createElement("button");
    b.type = "button";
    b.id = `tab-${paso.id}`;
    b.dataset.stepTarget = paso.id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", `step-${paso.id}`);
    b.innerHTML = `${icono(paso.icon)}<span>${paso.label}</span>`;
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
    for (const id of paso.campos)
      grid.append(document.getElementById(id).closest("label"));
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
  back.textContent = "Anterior";
  const next = document.createElement("button");
  next.id = "decision-next";
  next.type = "button";
  next.className = "button";
  next.textContent = "Continuar";
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
  $("#rec-level").innerHTML = datos.metodo.niveles_plan
    .map(
      (n) =>
        `<option value="${n}" ${n === datos.metodo.nivel_plan ? "selected" : ""}>${percent(n)} de años históricos · planificación</option>`,
    )
    .join("");
  function inputs() {
    const c = contexto();
    return {
      cultivo: $("#rec-crop").value || null,
      objetivo: $("#rec-target").value || null,
      area: number("#rec-area"),
      volumenDisponible: number("#rec-volume"),
      dotacion: c.dotacion,
      lluvia: c.lluvia,
      dotacionConfirmada: $("#rec-allocation-confirmed").checked,
      sistema: $("#rec-system").value,
      eficiencia:
        number("#rec-efficiency") == null
          ? null
          : number("#rec-efficiency") / 100,
      fecha: $("#rec-date").value || null,
      nivel: Number($("#rec-level").value),
      ph: number("#rec-ph"),
      salinidad: number("#rec-ec"),
      phytophthora: $("#rec-disease").value,
      atrazina: $("#rec-herbicide").value,
      edadAlfalfa: number("#rec-age"),
      anioObservado: number("#rec-observed-year"),
      riegoObservado: number("#rec-observed-volume"),
    };
  }
  function pack(entrada = inputs()) {
    const c = contexto();
    return {
      datos,
      zona: c.zona,
      parcela: c.parcela,
      entrada,
      perfil: c.suelo?.perfil?.parcelas?.[c.parcela.id] ?? null,
    };
  }
  function graficaClima(casos) {
    if (!casos.length) return "";
    const width = 600,
      height = 150,
      pad = 12,
      max = Math.max(...casos.flatMap((x) => [x.observado_mm, x.p90_mm])) || 1;
    const x = (i) =>
        pad + (i * (width - pad * 2)) / Math.max(1, casos.length - 1),
      y = (n) => height - pad - (n / max) * (height - pad * 2);
    const line = (key) => casos.map((c, i) => `${x(i)},${y(c[key])}`).join(" ");
    const band = casos
      .map((c, i) => `${x(i)},${y(c.p10_mm)}`)
      .concat(
        [...casos]
          .reverse()
          .map((c, j) => `${x(casos.length - 1 - j)},${y(c.p90_mm)}`),
      )
      .join(" ");
    return `<article class="climate-chart"><h3>Lo que se estimó frente a lo que registró el clima</h3><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Comparación histórica de lluvia registrada, estimada y banda de incertidumbre"><polygon points="${band}" fill="#8abdda" opacity=".12"/><polyline points="${line("p50_mm")}" fill="none" stroke="#8abdda" stroke-width="2" stroke-dasharray="5 5"/><polyline points="${line("observado_mm")}" fill="none" stroke="#b9ed87" stroke-width="2.5"/></svg><div class="chart-key"><span><i></i>Registrado en NASA POWER</span><span><i class="prediction"></i>Estimación previa</span><span><i class="band"></i>Banda histórica</span><span>${casos[0].anio}–${casos.at(-1).anio} · mm</span></div></article>`;
  }
  function drawForecast(c) {
    const z = datos.zonas[c.zona];
    if (!z) {
      $("#forecast-analysis").textContent = "No hay histórico para esta zona.";
      return;
    }
    const p = z.pronostico_lluvia,
      v = z.validacion_lluvia;
    const rows = v.casos
      .map(
        (x) =>
          `<tr><th scope="row">${x.anio}</th><td>${x.entrenamiento_fin}</td><td>${fmt(x.p50_mm)}</td><td>${fmt(x.p10_mm)}–${fmt(x.p90_mm)}</td><td>${fmt(x.observado_mm)}</td><td>${fmt(Math.abs(x.observado_mm - x.p50_mm))}</td></tr>`,
      )
      .join("");
    $("#forecast-analysis").innerHTML =
      `<div class="section-heading"><h2>Predicción de referencia y retroprueba</h2><button class="button" id="download-backtest">Descargar validación</button></div>
      <p class="section-intro">Distribución climática del ciclo agrícola completo de octubre a septiembre. Es una referencia estadística con años anteriores, no un pronóstico meteorológico diario ni una predicción de la presa. La lluvia procede de una celda NASA POWER, no de una estación de la parcela.</p>
      <p class="micro">Ciclos excluidos por días faltantes: ${escape((z.ciclos_excluidos ?? []).map((x) => `${x.anio}: ${x.dias_faltantes}`).join("; ") || "ninguno")}. La referencia no incorpora las lluvias parciales del ciclo objetivo.</p><div class="forecast-metrics"><article class="card"><h3>Lluvia de referencia · ciclo ${p.anio}</h3><strong>${fmt(p.p50_mm)} mm</strong><p>Banda histórica: ${fmt(p.p10_mm)}–${fmt(p.p90_mm)} mm</p><p>${fmt(p.n, 0)} ciclos completos · hasta ${z.anios.at(-1)?.anio}</p></article>
      <article class="card"><h3>Error en años no usados al calcular</h3><strong>${fmt(v.mae_mm)} mm</strong><p>Error absoluto medio de lluvia · ${fmt(v.n, 0)} años de prueba.</p><p>Referencia «repetir el año anterior»: ${fmt(v.mae_persistencia_mm)} mm.</p></article>
      <article class="card"><h3>Cobertura observada del intervalo</h3><strong>${percent(v.cobertura)}</strong><p>Objetivo nominal: ${percent(v.cobertura_nominal)}. ${v.cobertura < v.cobertura_nominal ? "Cobertura inferior al objetivo: el intervalo necesita calibración." : "Cobertura calculada, no garantizada."}</p><p>${v.habilidad_vs_persistencia > 0 ? "El error medio fue menor que repetir el año anterior." : "No mejoró el error de repetir el año anterior; no se declara superioridad."}</p></article></div>
      ${graficaClima(v.casos)}<details class="card evidence-table"><summary>Ver cada año de prueba y los datos que estuvieron disponibles</summary><p>Para predecir un año se utilizaron exclusivamente los años anteriores. Esta retroprueba valida la lluvia frente a NASA POWER; no valida demanda real, rendimiento ni rentabilidad.</p><div class="table-scroll"><table><thead><tr><th>Año objetivo</th><th>Entrenamiento hasta</th><th>Mediana · mm</th><th>Banda · mm</th><th>Registrado · mm</th><th>Error · mm</th></tr></thead><tbody>${rows}</tbody></table></div><p>Fuente: ${escape(z.fuente_clima)}. Corte del archivo: ${z.fecha_corte}. Los ciclos incompletos se excluyen.</p></details>`;
    $("#download-backtest").onclick = () =>
      saveFile("raiz-retroprueba-lluvia.json", {
        zona: c.zona,
        fuente: z.fuente_clima,
        validacion: v,
        pronostico: p,
        fuentes: datos.fuentes,
      });
  }
  function render() {
    const c = contexto();
    if (!c.parcela) return;
    last = evaluarPlan(pack());
    const fieldIrrigation = $("#field-irrigation");
    if (fieldIrrigation)
      fieldIrrigation.textContent =
        $("#rec-system").value === "sin_confirmar"
          ? "Sin registrar"
          : $("#rec-system").selectedOptions[0].text + " · captura de usuario";
    $("#decision-budget").textContent =
      `Escenario global: ${fmt(c.dotacion)} millares/ha · lluvia ${fmt(c.lluvia, 0)}%. Si capturas volumen total, este sustituye la dotación solo en este plan.`;
    $("#decision-summary").textContent = last.errores.length
      ? last.errores.join(" ")
      : `${last.resultados.length} alternativas calculadas para ${c.parcela.id}. Las opciones bloqueadas no se recomiendan. Las condicionadas explican qué falta confirmar.`;
    $("#recommendations").innerHTML = last.resultados
      .map((r) => {
        if (!r.demanda)
          return `<article class="card"><h3>${escape(r.nombre)}</h3><p>Sin demanda histórica publicada.</p></article>`;
        const d = r.demanda,
          blocked = r.estado === "bloqueado";
        const accion = blocked
          ? "No ejecutar este plan mientras exista el impedimento."
          : r.esDescanso
            ? "No establecer un cultivo de riego en la superficie evaluada."
            : `Planificar como máximo ${fmt(r.areaPlan)} ha bajo este presupuesto y nivel de planificación; ${fmt(Math.max(0, r.area - r.areaPlan))} ha quedan fuera del plan de riego.`;
        const base = Object.entries(r.fechaBase)
          .map(([id, fecha]) => `${id}: ${fecha ? fecha.join("-") : "perenne"}`)
          .join(" · ");
        return `<article class="card decision-card ${blocked ? "blocked" : ""}" data-recommendation="${escape(r.id)}" data-state="${r.estado}"><div class="card-heading"><h3>${escape(r.nombre)}</h3><span class="pill">${blocked ? "CON IMPEDIMENTOS" : r.estado === "plan_calculado" ? "PLAN HÍDRICO CALCULADO" : "CONDICIONADO"}</span></div><p class="decision-action">${accion}</p>
      <dl class="decision-values"><div><dt>Demanda central</dt><dd>${fmt(d.p50)} millares/ha</dd></div><div><dt>Demanda para planificar</dt><dd>${fmt(d.plan)} millares/ha</dd></div><div><dt>Climas en que alcanza para toda el área</dt><dd>${percent(r.apoyoBajo)}–${percent(r.apoyoAlto)}</dd></div><div><dt>Presupuesto total</dt><dd>${fmt(r.presupuesto)} millares</dd></div></dl>
      <p class="micro">Frecuencia histórica bajo el modelo, no probabilidad de cosecha. ${fmt(d.n, 0)} ciclos. Eficiencia usada: ${percent(d.eficiencia[0])}–${percent(d.eficiencia[1])}. Banda de demanda con sensibilidad: ${fmt(d.p10)}–${fmt(d.p90)} millares/ha.</p>
      ${r.riesgoHelada ? `<p class="micro">Helada desde tu fecha de siembra hasta fin de primavera: ${r.riesgoHelada.con_helada} de ${r.riesgoHelada.n} ciclos (${percent(r.riesgoHelada.frecuencia)}). Frecuencia histórica regional, no pronóstico de helada para este año.</p>` : ""}
      ${r.bloqueos.length ? `<ul class="blocking-reasons">${r.bloqueos.map((x) => `<li>${escape(x)}</li>`).join("")}</ul>` : ""}
      <details><summary>Datos pendientes y condiciones (${r.pendientes.length})</summary><ul>${r.pendientes.map((x) => `<li>${escape(x)}</li>`).join("") || "<li>Sin condiciones faltantes detectadas por estas reglas. No implica una aprobación agronómica integral.</li>"}</ul></details>
      <details><summary>Mostrar cálculo y referencias de esta alternativa</summary><p>Demanda por año = (lámina neta ÷ eficiencia + presiembra) convertida a millares/ha. Área planificada = presupuesto total ÷ demanda del nivel elegido, limitada a tu superficie.</p><p>Fechas base A5 · mes-día: ${escape(base)}. La fecha que capturas filtra la ventana; no desplaza la curva de demanda. Fuera de este calendario el resultado no se considera una predicción específica de tu fecha.</p><ul>${r.evidencias.map((e) => `<li><strong>${escape(e.criterio)}</strong> · ${escape(e.estado)}<br>${escape(JSON.stringify(e.valor))}<br><small>${escape(e.fuente)}</small></li>`).join("")}</ul><p>Serie: ${escape(r.fuenteClima)} · el archivo de auditoría incluye todos los años.</p></details>
      ${r.contraste ? `<div class="observation"><h4>Contraste con tu registro · ${r.contraste.anio}</h4><p>Riego reportado: ${fmt(r.contraste.reportado_m3)} m³. Modelo: ${fmt(r.contraste.modelo_central_m3)} m³. Diferencia reportado − modelo: ${fmt(r.contraste.diferencia_m3)} m³.</p><p>${escape(r.contraste.alcance)}</p></div>` : ""}</article>`;
      })
      .join("");
    if (!last.errores.length && !last.resultados.length)
      $("#recommendations").textContent =
        "Confirma el cultivo previo o elige un candidato para calcular. No se inventa una alternativa para una parcela sin identificar.";
    $("#decision-checks").textContent = "";
    registros[c.parcela.id] = [...$("#decision-form").elements]
      .filter((e) => e.id)
      .map((e) => [e.id, e.type === "checkbox" ? e.checked : e.value]);
  }
  function actualizar() {
    const c = contexto();
    if (!c.parcela) return;
    if (field !== c.parcela.id) {
      $("#decision-form").reset();
      setStep("parcela");
      field = c.parcela.id;
      $("#rec-area").value = c.parcela.area_ha;
      const z = datos.zonas[c.zona];
      $("#rec-target").innerHTML =
        '<option value="">Solo opciones del catálogo para el cultivo previo</option>' +
        Object.entries(z?.rotaciones ?? {})
          .map(
            ([id, r]) =>
              `<option value="${escape(id)}">${escape(r.nombre)}</option>`,
          )
          .join("");
      $("#rec-observed-year").innerHTML =
        '<option value="">Sin medición histórica</option>' +
        (z?.anios ?? [])
          .map((x) => `<option value="${x.anio}">${x.anio}</option>`)
          .join("");
      for (const [id, value] of registros[field] ?? []) {
        const el = document.getElementById(id);
        if (el)
          el.type === "checkbox" ? (el.checked = value) : (el.value = value);
      }
      $("#decision-field").textContent =
        `Parcela ${field} · detección: ${labels[c.parcela.cultivo_actual] ?? "Sin clasificar"}`;
    }
    drawForecast(c);
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
        errores: ["Entradas inválidas: no se emitió un plan."],
        resultados: [],
        entrada: inputs(),
      };
      $("#recommendations").innerHTML = "";
      $("#decision-summary").textContent =
        "Revisa las entradas señaladas antes de calcular; no se reemplazan valores inválidos por supuestos.";
    }
  };
  $("#decision-form").addEventListener("change", changed);
  $("#decision-form").addEventListener("input", changed);
  $("#download-audit").onclick = () =>
    saveFile(`raiz-auditoria-${field}.json`, {
      ...last,
      version: "motor_recomendaciones",
      entrada_origen:
        "Captura de usuario y escenario; no verificada automáticamente",
    });
  $("#download-inputs").onclick = () =>
    saveFile(`raiz-entradas-${field}.json`, inputs());
  $("#run-checks").onclick = () => {
    const arg = pack(),
      base = evaluarPlan(arg),
      zero = evaluarPlan({
        ...arg,
        entrada: { ...arg.entrada, volumenDisponible: null, dotacion: 0 },
      });
    const more = evaluarPlan({
      ...arg,
      entrada: {
        ...arg.entrada,
        volumenDisponible: null,
        dotacion: (base.entrada.dotacion ?? 0) + 1,
      },
    });
    const checks = [];
    const add = (nombre, ok, detalle) => checks.push({ nombre, ok, detalle });
    add(
      "Repetibilidad",
      JSON.stringify(base) === JSON.stringify(evaluarPlan(arg)),
      "Mismas entradas y mismas fuentes producen el mismo resultado.",
    );
    add(
      "Agua nula no riega cultivos",
      zero.resultados.every(
        (r) => r.esDescanso || !r.demanda || r.areaPlan === 0,
      ),
      "El área de riego no se sostiene con un presupuesto nulo.",
    );
    add(
      "Más agua no reduce la superficie calculada",
      base.resultados.every(
        (r) =>
          !r.demanda ||
          r.areaPlan <=
            (more.resultados.find((m) => m.id === r.id)?.areaPlan ?? 0),
      ),
      "Se recalcula aumentando la dotación y manteniendo las demás entradas.",
    );
    const rot = Object.values(datos.zonas[arg.zona]?.rotaciones ?? {}).find(
      (r) => r.serie.some((s) => s.lluvia[String(0)].neta_mm > 0),
    );
    if (rot) {
      const a = demandaHistorica(rot, { rangoEficiencia: [0.5, 0.5] }),
        b = demandaHistorica(rot, { rangoEficiencia: [1, 1] });
      add(
        "Mayor eficiencia reduce demanda bruta",
        b.p50 < a.p50,
        "Balance recalculado con la misma serie y dos eficiencias de comprobación; no son mediciones de esta parcela.",
      );
    }
    add(
      "Retroprueba sin años futuros",
      datos.zonas[arg.zona].validacion_lluvia.casos.every(
        (x) => x.entrenamiento_fin < x.anio,
      ),
      "Cada año objetivo está separado del periodo que lo predice.",
    );
    add(
      "Entradas inválidas impiden emitir planes",
      evaluarPlan({ ...arg, entrada: { ...arg.entrada, area: 0 } }).resultados
        .length === 0,
      "Una superficie inválida no genera una recomendación.",
    );
    $("#decision-checks").innerHTML =
      `<p>${checks.filter((c) => c.ok).length} de ${checks.length} comprobaciones correctas.</p><ul>${checks.map((c) => `<li>${c.ok ? "✓" : "✕"} ${escape(c.nombre)}: ${escape(c.detalle)}</li>`).join("")}</ul>`;
  };
  actualizar();
  return { actualizar };
}
