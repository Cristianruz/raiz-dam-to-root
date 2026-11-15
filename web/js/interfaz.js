// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; presentación con Codex.
// Referencia adjunta solo visual. Los marcadores y accesos se construyen con parcelas publicadas.
export const icono = (nombre) =>
  `<svg class="ui-icon" aria-hidden="true"><use href="icons/interface.svg#${nombre}"></use></svg>`;
export function prepararInterfaz({ cubo, cambiarModo, centrarParcela }) {
  const $ = (s) => document.querySelector(s);
  document.querySelectorAll("nav [data-view]").forEach((a) => {
    const names = {
      resumen: "home",
      terreno: "map",
      cultivos: "sprout",
      recomendaciones: "sparkles",
      predicciones: "chart",
    };
    a.querySelector("span").innerHTML = icono(names[a.dataset.view]);
  });
  $(".brand").innerHTML = `${icono("sprout")}<span>RAÍZ</span>`;
  $(".workspace-icon").innerHTML = icono("map");
  $(".icon-button").innerHTML = icono("info");
  $("#exportar").innerHTML =
    `${icono("download")}<span>Descargar resumen</span>`;
  $("#fit-map").innerHTML = `${icono("target")}<span>Ver zona completa</span>`;
  const scene = $(".map-detail-grid"),
    mapCard = $(".map-card"),
    water = $(".water-card");
  const area = document.createElement("div");
  area.className = "scene-map-area";
  scene.prepend(area);
  area.append(mapCard, water);
  const switcher = document.createElement("div");
  switcher.className = "map-mode-switch";
  switcher.setAttribute("role", "group");
  switcher.setAttribute("aria-label", "Colorear parcelas");
  switcher.innerHTML = `<button type="button" data-map-mode="agua" aria-pressed="true">${icono("drop")}<span>Agua</span></button><button type="button" data-map-mode="cultivo" aria-pressed="false">${icono("sprout")}<span>Cultivo</span></button><button type="button" id="focus-field">${icono("target")}<span>Mi parcela</span></button>`;
  area.append(switcher);
  switcher.addEventListener("click", (e) => {
    const b = e.target.closest("[data-map-mode]");
    if (b) {
      switcher
        .querySelectorAll("[data-map-mode]")
        .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      cambiarModo(b.dataset.mapMode);
    }
  });
  $("#focus-field").onclick = centrarParcela;
  const presets = document.createElement("div");
  presets.id = "allocation-presets";
  presets.className = "allocation-presets";
  presets.setAttribute("aria-label", "Dotaciones de referencia");
  for (const m of cubo.dotaciones.marcas) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.allocation = m.valor;
    b.textContent = m.nombre
      .replace(/^Like /, "Como ")
      .replace("Normal year", "Año normal");
    b.title = `${m.etiqueta} · ${m.fuente} · ${m.nota}`;
    b.onclick = () => {
      const range = $("#allocation");
      range.value = m.valor;
      range.dispatchEvent(new Event("input", { bubbles: true }));
    };
    presets.append(b);
  }
  $("#range-labels").after(presets);
  const budget = document.createElement("div");
  budget.id = "water-commitment";
  budget.className = "water-commitment";
  water.append(budget);
  const chips = document.createElement("div");
  chips.id = "scene-parcels";
  chips.className = "scene-parcels";
  chips.setAttribute("aria-label", "Accesos a parcelas de esta zona");
  area.append(chips);
}
