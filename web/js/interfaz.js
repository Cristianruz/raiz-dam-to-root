// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// web/js/interfaz.js — Presentación del tablero (web/index.html): iconos, selector de color del mapa,
// dotaciones de referencia, accesos a parcelas, selector de idioma y el pintado de los textos fijos.
// Los marcadores y accesos se construyen con parcelas publicadas. Todo texto visible sale de t("tablero.…")
// (js/textos_tablero.js); lo que viene del cubo entra por textContent o por atributos del DOM.
import {
  t,
  idioma,
  fijarIdioma,
  IDIOMAS,
  NOMBRE_IDIOMA,
  BORRADOR_DE_MAQUINA,
} from "./i18n.js";
import "./textos_tablero.js";

export const icono = (nombre) =>
  `<svg class="ui-icon" aria-hidden="true"><use href="icons/interface.svg#${nombre}"></use></svg>`;

// Pone el texto de un elemento sin tocar a sus hijos (iconos, flechas): cambia el primer nodo de texto
// directo que tenga contenido y conserva el espacio que lo separa de sus vecinos.
function ponerTexto(el, texto) {
  const nodo = [...el.childNodes].find(
    (n) => n.nodeType === Node.TEXT_NODE && n.nodeValue.trim(),
  );
  if (!nodo) {
    if (el.children.length) el.append(texto);
    else el.textContent = texto;
    return;
  }
  const antes = /^\s/.test(nodo.nodeValue) ? " " : "";
  const despues = /\s$/.test(nodo.nodeValue) ? " " : "";
  nodo.nodeValue = antes + texto + despues;
}

/**
 * Pinta los textos fijos en el idioma en uso: data-i18n="clave" (texto del elemento) y
 * data-i18n-attr="atributo:clave;atributo:clave" (aria-label, title, placeholder).
 */
export function pintarTextos(raiz = document) {
  raiz
    .querySelectorAll("[data-i18n]")
    .forEach((el) => ponerTexto(el, t(el.dataset.i18n)));
  raiz.querySelectorAll("[data-i18n-attr]").forEach((el) => {
    for (const par of el.dataset.i18nAttr.split(";")) {
      const [atributo, clave] = par.split(":").map((s) => s.trim());
      if (atributo && clave) el.setAttribute(atributo, t(clave));
    }
  });
}

/**
 * Selector de idioma de la cabecera: los cuatro nombres de NOMBRE_IDIOMA, cada uno en su idioma. Al elegir,
 * cambia el idioma sin recargar (fijarIdioma lo recuerda) y, si la liga traía «?lang=», la actualiza para que
 * una recarga conserve la elección. La nota de borrador acompaña a las traducciones hechas por máquina.
 */
export function prepararIdioma() {
  const selector = document.querySelector("#idioma");
  if (!selector) return;
  selector.replaceChildren(
    ...IDIOMAS.map((codigo) => {
      const opcion = document.createElement("option");
      opcion.value = codigo;
      opcion.lang = codigo;
      opcion.textContent = NOMBRE_IDIOMA[codigo];
      return opcion;
    }),
  );
  selector.value = idioma();
  selector.addEventListener("change", () => {
    const nuevo = fijarIdioma(selector.value);
    const liga = new URL(location.href);
    if (liga.searchParams.has("lang")) {
      liga.searchParams.set("lang", nuevo);
      history.replaceState(null, "", liga);
    }
  });
}
/** Estado del selector y de la nota de borrador; se llama al cargar y en cada cambio de idioma. */
export function pintarIdioma() {
  const selector = document.querySelector("#idioma");
  if (selector) selector.value = idioma();
  const nota = document.querySelector("#idioma-nota");
  if (!nota) return;
  const borrador = BORRADOR_DE_MAQUINA.includes(idioma());
  nota.hidden = !borrador;
  nota.textContent = borrador ? t("tablero.idioma.borrador") : "";
}

// Nombre de una dotación de referencia. El cubo trae «Like <año>» y «Normal year» (en inglés); el año se toma
// del propio nombre y la frase, de los textos del tablero. Otro nombre se muestra como viene.
function nombreDeMarca(m) {
  if (m.id === "anio_normal") return t("tablero.marca.normal");
  const conAnio = /^Like (\d+)$/.exec(m.nombre ?? "");
  return conAnio ? t("tablero.marca.como", { anio: conAnio[1] }) : (m.nombre ?? "");
}
// Fuente, nota y etiqueta de la marca: el cubo las trae en español y, con sufijo _en, en inglés.
function detalleDeMarca(m) {
  const enEspanol = idioma() === "es";
  const de = (llave) => (enEspanol ? m[llave] : (m[`${llave}_en`] ?? m[llave]));
  const etiqueta = String(m.etiqueta ?? "").replace(
    "por confirmar",
    t("tablero.etiqueta.por_confirmar"),
  );
  return [etiqueta, de("fuente"), de("nota")].filter(Boolean).join(" · ");
}

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
    `${icono("download")}<span data-i18n="tablero.descargar_resumen"></span>`;
  $("#fit-map").innerHTML =
    `${icono("target")}<span data-i18n="tablero.mapa.zona_completa"></span>`;
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
  switcher.dataset.i18nAttr = "aria-label:tablero.mapa.colorear";
  switcher.innerHTML = `<button type="button" data-map-mode="agua" aria-pressed="true">${icono("drop")}<span data-i18n="tablero.mapa.modo.agua"></span></button><button type="button" data-map-mode="cultivo" aria-pressed="false">${icono("sprout")}<span data-i18n="tablero.mapa.modo.cultivo"></span></button><button type="button" id="focus-field">${icono("target")}<span data-i18n="tablero.mapa.modo.mi_parcela"></span></button>`;
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
  presets.dataset.i18nAttr = "aria-label:tablero.agua.marcas_aria";
  const marcas = [];
  for (const m of cubo.dotaciones.marcas) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.allocation = m.valor;
    b.onclick = () => {
      const range = $("#allocation");
      range.value = m.valor;
      range.dispatchEvent(new Event("input", { bubbles: true }));
    };
    marcas.push([b, m]);
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
  chips.dataset.i18nAttr = "aria-label:tablero.mapa.accesos_aria";
  area.append(chips);
  // Lo que depende del idioma se vuelve a pintar con esta función (al cargar y en cada cambio).
  const repintar = () => {
    pintarTextos();
    pintarIdioma();
    for (const [b, m] of marcas) {
      b.textContent = nombreDeMarca(m);
      b.title = detalleDeMarca(m);
    }
  };
  repintar();
  return { repintar };
}
