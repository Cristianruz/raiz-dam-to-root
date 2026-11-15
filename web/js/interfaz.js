// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// web/js/interfaz.js — Presentación del tablero (web/dashboard.html): iconos, selector de color del mapa,
// dotaciones de referencia y accesos a parcelas. Los marcadores y accesos se construyen con parcelas publicadas.
// Textos visibles en inglés (regla 9); los que vienen del cubo entran por textContent o por atributos del DOM.
export const icono = (nombre) =>
  `<svg class="ui-icon" aria-hidden="true"><use href="icons/interface.svg#${nombre}"></use></svg>`;
// Parte en español de las etiquetas de evidencia del cubo («[P], por confirmar») leída en inglés,
// igual que en la página principal (web/app.js, etiquetaEn).
const etiquetaEn = (etiqueta) =>
  String(etiqueta ?? "").replace("por confirmar", "to be confirmed");
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
  $(".brand").innerHTML = `${icono("sprout")}<span>ROOT</span>`;
  $(".workspace-icon").innerHTML = icono("map");
  $(".icon-button").innerHTML = icono("info");
  $("#exportar").innerHTML =
    `${icono("download")}<span>Download summary</span>`;
  $("#fit-map").innerHTML = `${icono("target")}<span>See the whole area</span>`;
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
  switcher.setAttribute("aria-label", "Color fields by");
  switcher.innerHTML = `<button type="button" data-map-mode="agua" aria-pressed="true">${icono("drop")}<span>Water</span></button><button type="button" data-map-mode="cultivo" aria-pressed="false">${icono("sprout")}<span>Crop</span></button><button type="button" id="focus-field">${icono("target")}<span>My field</span></button>`;
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
  presets.setAttribute("role", "group");
  presets.setAttribute("aria-label", "Reference allocations");
  for (const m of cubo.dotaciones.marcas) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.allocation = m.valor;
    // El nombre de la marca ya viene en inglés del cubo («Like 2026»); fuente y nota, en su versión en inglés
    // cuando el cubo la trae (fuente_en, nota_en).
    b.textContent = m.nombre;
    b.title = [etiquetaEn(m.etiqueta), m.fuente_en ?? m.fuente, m.nota_en ?? m.nota]
      .filter(Boolean)
      .join(" · ");
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
  chips.setAttribute("role", "group");
  chips.setAttribute("aria-label", "Shortcuts to fields in this pilot area");
  area.append(chips);
}
