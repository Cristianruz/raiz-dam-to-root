/* Raíz — mapa, selector de dotación y ficha comparativa. */
(function () {
  "use strict";
  const C = window.RaizCalc;

  const estado = {
    datos: null,          // { parcelas, escenarios, cultivos }
    cultivosPorId: {},
    laminaCm: 30,
    escenarioId: null,    // null = personalizado
    parcelaId: null,
    capas: {},            // id -> capa Leaflet
  };

  const $ = (sel) => document.querySelector(sel);
  const fmtNum = (n, d = 0) => n.toLocaleString("es-MX", { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtMXN = (n) => (n < 0 ? "−" : "") + "$" + fmtNum(Math.abs(Math.round(n)));
  const fmtPct = (x) => fmtNum(x * 100) + "%";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- Carga de datos ---------- */
  async function cargarDatos() {
    // En la versión de un solo archivo los datos vienen incrustados.
    if (window.RAIZ_DATA) return window.RAIZ_DATA;
    const get = (u) => fetch(u, { cache: "no-store" }).then((r) => {
      if (!r.ok) throw new Error(`No se pudo leer ${u} (${r.status})`);
      return r.json();
    });
    const [parcelas, escenarios, cultivos] = await Promise.all([
      get("data/parcelas.geojson"), get("data/escenarios.json"), get("data/cultivos.json"),
    ]);
    return { parcelas, escenarios, cultivos };
  }

  /* ---------- Selector de dotación ---------- */
  function construirSelector() {
    const cont = $("#escenarios");
    cont.innerHTML = "";
    estado.datos.escenarios.escenarios.forEach((e) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.dataset.id = e.id;
      b.innerHTML = `${esc(e.nombre)}<small>${fmtNum(e.lamina_cm)} cm</small>`;
      b.title = e.condicion || "";
      b.addEventListener("click", () => fijarEscenario(e.id));
      cont.appendChild(b);
    });
    const slider = $("#laminaSlider");
    const maxEsc = Math.max(...estado.datos.escenarios.escenarios.map((e) => e.lamina_cm));
    slider.max = String(Math.max(100, Math.ceil(maxEsc / 10) * 10));
    slider.addEventListener("input", () => {
      const v = Number(slider.value);
      const coincide = estado.datos.escenarios.escenarios.find((e) => e.lamina_cm === v);
      estado.escenarioId = coincide ? coincide.id : null;
      estado.laminaCm = v;
      actualizar();
    });
    if (estado.datos.escenarios.distrito) $("#distrito").textContent = estado.datos.escenarios.distrito;
  }

  function fijarEscenario(id) {
    const e = estado.datos.escenarios.escenarios.find((x) => x.id === id);
    if (!e) return;
    estado.escenarioId = id;
    estado.laminaCm = e.lamina_cm;
    $("#laminaSlider").value = String(e.lamina_cm);
    actualizar();
  }

  function escenarioActual() {
    return estado.datos.escenarios.escenarios.find((e) => e.id === estado.escenarioId) || null;
  }

  /* ---------- Mapa ---------- */
  let mapa;
  function construirMapa() {
    mapa = L.map("mapa", { zoomControl: true, attributionControl: true });
    // Imagen satelital (requiere internet). Si no carga, las parcelas se ven sobre fondo liso.
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, attribution: "Imagen: Esri, Maxar, Earthstar Geographics",
    }).addTo(mapa);

    const grupo = L.featureGroup().addTo(mapa);
    estado.datos.parcelas.features.forEach((f) => {
      const capa = L.geoJSON(f, { style: () => estilo(f, false) });
      capa.on("click", () => seleccionarParcela(f.properties.id));
      capa.addTo(grupo);
      // Punto visible cuando el zoom es lejano y el polígono se ve muy chico.
      const punto = L.circleMarker(capa.getBounds().getCenter(), { radius: 9, weight: 2, color: "#fffdf8", fillOpacity: 1 });
      punto.on("click", () => seleccionarParcela(f.properties.id, { centrar: true }));
      punto.bindTooltip(f.properties.nombre || f.properties.id, {
        permanent: true, direction: "top", offset: [0, -10], className: "etiqueta-parcela",
      });
      estado.capas[f.properties.id] = { capa, punto, feature: f };
    });
    const ajustarPuntos = () => {
      const lejos = mapa.getZoom() < 14;
      Object.values(estado.capas).forEach(({ punto }) => {
        if (lejos && !mapa.hasLayer(punto)) punto.addTo(mapa);
        if (!lejos && mapa.hasLayer(punto)) mapa.removeLayer(punto);
      });
    };
    mapa.on("zoomend", ajustarPuntos);
    mapa.fitBounds(grupo.getBounds(), { padding: [60, 60] });
    ajustarPuntos();
  }

  const COLORES = { verde: "#2e7d4f", ambar: "#c58a10", rojo: "#b5432c" };
  function estilo(f, seleccionada) {
    const p = f.properties;
    const c = estado.cultivosPorId[p.cultivo_actual];
    const ev = C.evaluar(c, p.superficie_ha, estado.laminaCm);
    const color = COLORES[C.semaforo(ev.cobertura)];
    return { color: seleccionada ? "#fffdf8" : color, weight: seleccionada ? 4 : 2, fillColor: color, fillOpacity: 0.55 };
  }

  function repintarMapa() {
    Object.entries(estado.capas).forEach(([id, { capa, punto, feature }]) => {
      const s = estilo(feature, id === estado.parcelaId);
      capa.setStyle(s);
      punto.setStyle({ fillColor: s.fillColor, radius: id === estado.parcelaId ? 12 : 9 });
    });
  }

  function seleccionarParcela(id, { centrar = false } = {}) {
    if (!estado.capas[id]) return;
    estado.parcelaId = id;
    try { history.replaceState(null, "", "#" + id.toLowerCase()); } catch (_) { /* marco con sandbox */ }
    if (centrar) mapa.fitBounds(estado.capas[id].capa.getBounds(), { padding: [80, 80], maxZoom: 15 });
    actualizar();
  }

  function renderLista() {
    const cont = $("#listaParcelas");
    cont.innerHTML = "";
    estado.datos.parcelas.features.forEach((f) => {
      const p = f.properties;
      const ev = C.evaluar(estado.cultivosPorId[p.cultivo_actual], p.superficie_ha, estado.laminaCm);
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-current", String(p.id === estado.parcelaId));
      b.innerHTML = `<i class="pt ${C.semaforo(ev.cobertura)}"></i>${esc(p.nombre || p.id)}`;
      b.title = `${p.id} · ${fmtPct(ev.cobertura)} regable con el cultivo actual`;
      b.addEventListener("click", () => seleccionarParcela(p.id, { centrar: true }));
      cont.appendChild(b);
    });
  }

  /* ---------- Ficha ---------- */
  function sparkline(serie) {
    if (!serie || serie.length < 2) return "";
    const W = 300, H = 64, pad = 4;
    const xs = (i) => pad + (i * (W - 2 * pad)) / (serie.length - 1);
    const ys = (v) => H - pad - v * (H - 2 * pad); // NDVI 0..1
    const pts = serie.map((d, i) => `${xs(i).toFixed(1)},${ys(d.ndvi).toFixed(1)}`).join(" ");
    const area = `${pad},${H - pad} ${pts} ${W - pad},${H - pad}`;
    return `<div class="tarjeta ndvi"><h3>Historial satelital (NDVI)</h3>
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Serie de NDVI de ${serie[0].fecha} a ${serie[serie.length - 1].fecha}">
        <polygon points="${area}" fill="#2e7d4f" opacity=".14"/>
        <polyline points="${pts}" fill="none" stroke="#2e7d4f" stroke-width="2" vector-effect="non-scaling-stroke"/>
      </svg>
      <div class="eje"><span>${esc(serie[0].fecha)}</span><span>NDVI 0–1</span><span>${esc(serie[serie.length - 1].fecha)}</span></div></div>`;
  }

  function mensaje(filas, p) {
    const actual = filas.find((f) => f.esActual);
    const mejor = filas.find((f) => f.esMejor);
    const e = escenarioActual();
    let t = e
      ? `En el escenario <b>${esc(e.nombre)}</b> (${fmtNum(estado.laminaCm)} cm), `
      : `Con una dotación de <b>${fmtNum(estado.laminaCm)} cm</b>, `;
    if (actual.cobertura >= 0.999) t += `el agua alcanza para regar toda la parcela con <b>${esc(actual.cultivo.nombre.toLowerCase())}</b>.`;
    else t += `<b>${esc(actual.cultivo.nombre.toLowerCase())}</b> sólo alcanza para <b>${fmtNum(actual.haRegables, 1)} de ${fmtNum(p.superficie_ha)} ha</b> (${fmtPct(actual.cobertura)}).`;
    if (actual.riesgoPerenne) t += ` <span class="alerta">Riesgo: es un cultivo perenne y no se puede dejar parte sin riego.</span>`;
    if (mejor && !mejor.esActual) {
      const dif = mejor.ingresoNeto - actual.ingresoNeto;
      t += ` Cambiar a <strong>${esc(mejor.cultivo.nombre.toLowerCase())}</strong> permite regar ${fmtNum(mejor.haRegables, 1)} ha con un ingreso neto estimado de <strong>${fmtMXN(mejor.ingresoNeto)}</strong>`;
      t += dif > 0 ? ` (${fmtMXN(dif)} más que hoy).` : `.`;
    } else {
      t += ` El cultivo actual sigue siendo la mejor opción con esta dotación.`;
    }
    return t;
  }

  function tabla(filas) {
    const th = filas.map((f) => `<th class="${f.esMejor ? "mejor" : ""}"><span class="tag">${f.esActual ? "Actual" : "Alternativa"}${f.esMejor ? " · mejor" : ""}</span>${esc(f.cultivo.nombre)}</th>`).join("");
    const fila = (titulo, fn) => `<tr><td>${titulo}</td>${filas.map((f) => `<td class="${f.esMejor ? "mejor" : ""}">${fn(f)}</td>`).join("")}</tr>`;
    const suelo = { mejora: "Mejora", neutral: "Neutral", desgaste: "Desgasta" };
    return `<div class="tarjeta"><h3>Ficha comparativa</h3><div class="tabla-scroll"><table class="comp">
      <thead><tr><th></th>${th}</tr></thead><tbody>
      ${fila("Agua que pide (cm)", (f) => fmtNum(f.laminaRequeridaCm))}
      ${fila("Hectáreas regables", (f) => `${fmtNum(f.haRegables, 1)}<div class="barra-cob" title="${fmtPct(f.cobertura)}"><span style="width:${(f.cobertura * 100).toFixed(1)}%"></span></div>`)}
      ${fila("Margen por ha", (f) => `<span class="${f.margenHa < 0 ? "neg" : ""}">${fmtMXN(f.margenHa)}</span>`)}
      ${fila("Ingreso neto estimado", (f) => `<b class="${f.ingresoNeto < 0 ? "neg" : ""}">${fmtMXN(f.ingresoNeto)}</b>`)}
      ${fila("Pesos por m³ de agua", (f) => fmtNum(f.pesosPorM3, 1))}
      ${fila("Suelo", (f) => `<span class="suelo-${esc(f.cultivo.suelo_efecto)}" title="${esc(f.cultivo.suelo_nota || "")}">${suelo[f.cultivo.suelo_efecto] || "—"}</span>`)}
      </tbody></table></div></div>`;
  }

  function fuentes(filas, p) {
    const e = escenarioActual();
    const li = (txt, ok) => `<li>${txt}${ok ? "" : ' <span class="pend">· pendiente de validar</span>'}</li>`;
    const items = [];
    items.push(li(`Parcela ${esc(p.id)}: ${esc(p.fuente || "sin fuente")}`, p.validado));
    if (e) items.push(li(`Escenario ${esc(e.nombre)}: ${esc(e.fuente || "sin fuente")}. ${esc(e.supuestos || "")}`, e.validado));
    else items.push(li(`Dotación personalizada de ${fmtNum(estado.laminaCm)} cm (definida por el usuario).`, true));
    filas.forEach((f) => items.push(li(`${esc(f.cultivo.nombre)}: demanda neta ${fmtNum(f.cultivo.demanda_neta_mm)} mm, eficiencia ${fmtPct(f.cultivo.eficiencia)}. ${esc(f.cultivo.fuente || "")}`, f.cultivo.validado)));
    return `<details class="fuentes"><summary>Fuentes y supuestos</summary><ul>${items.join("")}
      <li>La superficie que no alcanza a regarse se considera sin sembrar (ingreso y costo cero).</li></ul></details>`;
  }

  function renderFicha() {
    const cont = $("#ficha");
    if (!estado.parcelaId) { cont.innerHTML = `<p class="vacio">Selecciona una parcela en el mapa.</p>`; return; }
    const p = estado.capas[estado.parcelaId].feature.properties;
    let filas;
    try { filas = C.compararParcela(p, estado.cultivosPorId, estado.laminaCm); }
    catch (err) { cont.innerHTML = `<p class="neg">Error en los datos: ${esc(err.message)}</p>`; return; }
    cont.innerHTML = `
      <h2>${esc(p.nombre || p.id)}</h2>
      <p class="meta"><code>${esc(p.id)}</code> · ${fmtNum(p.superficie_ha)} ha · ${esc(p.modulo || "")}</p>
      <div class="tarjeta mensaje">${mensaje(filas, p)}</div>
      ${tabla(filas)}
      ${sparkline(p.ndvi)}
      ${fuentes(filas, p)}`;
  }

  /* ---------- Aviso de datos de ejemplo ---------- */
  function avisoDatos() {
    const d = estado.datos;
    const pend = [
      ...d.parcelas.features.map((f) => f.properties),
      ...d.escenarios.escenarios,
      ...d.cultivos.cultivos,
    ].filter((x) => !x.validado).length;
    const el = $("#avisoDatos");
    if (pend > 0) {
      el.hidden = false;
      el.textContent = `Prototipo con datos de ejemplo: ${pend} registros aún no están validados por el equipo. Las cifras sirven para probar el flujo, no para decidir.`;
    } else el.hidden = true;
  }

  /* ---------- Ciclo principal ---------- */
  function actualizar() {
    $("#laminaValor").textContent = `${fmtNum(estado.laminaCm)} cm`;
    document.querySelectorAll("#escenarios button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.id === estado.escenarioId)));
    repintarMapa();
    renderLista();
    renderFicha();
  }

  function parcelaDesdeHash() {
    const h = (location.hash || "").slice(1).toLowerCase();
    return Object.keys(estado.capas).find((id) => id.toLowerCase() === h) || null;
  }

  async function iniciar() {
    try {
      estado.datos = await cargarDatos();
    } catch (err) {
      $("#ficha").innerHTML = `<p class="neg">${esc(err.message)}.<br>Abre la página con un servidor local: <code>python3 -m http.server</code> dentro de <code>web/</code>.</p>`;
      return;
    }
    estado.datos.cultivos.cultivos.forEach((c) => (estado.cultivosPorId[c.id] = c));
    construirSelector();
    construirMapa();
    avisoDatos();
    const inicial = estado.datos.escenarios.escenarios.find((e) => e.id === "restringido") || estado.datos.escenarios.escenarios[0];
    estado.parcelaId = parcelaDesdeHash() || estado.datos.parcelas.features[0].properties.id;
    fijarEscenario(inicial.id);
    window.addEventListener("hashchange", () => { const id = parcelaDesdeHash(); if (id) seleccionarParcela(id, { centrar: true }); });
  }

  iniciar();
})();
