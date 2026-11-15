// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// tests/e2e/dashboard_smoke.mjs — Prueba de humo del tablero (web/index.html, la portada de la aplicación) con
// Playwright. Arranca sola: levanta su propio servidor estático de web/ (http.createServer, sin dependencias).
//
// Uso:   node tests/e2e/dashboard_smoke.mjs
//        RAIZ_CAPTURAS=<carpeta> node tests/e2e/dashboard_smoke.mjs   (dónde dejar las capturas dashboard_*.png)
// No forma parte de `node --test tests/` (necesita Chromium). Termina con código 0 si todo pasa y 1 si algo falla.
//
// Qué comprueba:
// - en los cuatro idiomas (?lang=en, es, pt y fr), en escritorio: <html lang> y <title>, ninguna clave sin
//   traducir a la vista («tablero.…»), ninguna palabra vetada de ese idioma (regla 10), el aviso de juicio en la
//   ficha y en el pie, la nota de borrador junto al selector en portugués y en francés, los enlaces al explorador
//   (explorer.html y explorer.html#<id>), ningún enlace a PDF ni a research/, las cinco vistas sin desplazamiento
//   horizontal y sin errores de página;
// - en inglés, además: ningún texto visible en español (acentos o palabras como «de», «tu», «parcela») fuera de
//   los nombres de lugar y de los textos que vienen de los datos;
// - el selector de idioma: cambia todo sin recargar, actualiza «?lang=» y la elección se conserva al recargar
//   (con «?lang=» y sin él);
// - el tablero funciona: color del mapa, dotaciones de referencia, accesos, cambio de zona, parcela sin
//   clasificar, descargas CSV (un −20 se exporta como número, no como «'-20») y filtro de eventos;
// - en teléfono (390 × 844, inglés y español; 320 de ancho, inglés) y en tableta (768 × 1024, francés): sin
//   desplazamiento horizontal, el mapa mide al menos un tercio del alto útil y nada lo tapa en su centro, y los
//   controles miden 44 px; en teléfono, la navegación es la barra de pestañas inferior;
// - red: ninguna petición a dominios que no sean el propio y tile.openstreetmap.org (las teselas se cortan en la
//   prueba: sin ellas la ficha y los polígonos siguen ahí);
// - sin la biblioteca del mapa: modo local con los polígonos dibujados; sin suelo.json y sin cubo.json: lo dice;
// - un dato con marcado HTML no entra a la página como marcado.
//
// Lo que NO es de este frente y la prueba tolera, diciéndolo (líneas AVISO): lo que dibuja js/asesor.js
// (#decision-inputs, #decision-summary, #recommendations, #decision-checks, #forecast-analysis y
// #field-irrigation) y los textos que vienen de web/data/dashboard.json (eventos, fuente de la historia).

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { IDIOMAS, NOMBRE_IDIOMA, BORRADOR_DE_MAQUINA } from "../../web/js/i18n.js";
import { TEXTOS_TABLERO } from "../../web/js/textos_tablero.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const WEB = path.join(RAIZ, "web");
const CAPTURAS = process.env.RAIZ_CAPTURAS
  ? path.resolve(process.env.RAIZ_CAPTURAS)
  : fs.mkdtempSync(path.join(os.tmpdir(), "raiz-dashboard-"));
fs.mkdirSync(CAPTURAS, { recursive: true });

const HOST_TESELAS = "tile.openstreetmap.org";
const PRODUCTO = "ROOT – From Dam to Root";
const VISTAS = ["resumen", "terreno", "cultivos", "recomendaciones", "predicciones"];
// Lo que dibuja js/asesor.js (otro frente) y lo que viene escrito en los datos.
const DE_ASESOR = "#decision-inputs, #decision-summary, #recommendations, #decision-checks, #forecast-analysis, #field-irrigation";
const DE_DATOS = "#timeline, #history-chart details, #zona-dashboard, #allocation-presets";
const AVISO_EXACTO = {
  en: "This tool supports, never replaces, the judgment of farmers and local experts.",
  es: "Esta herramienta apoya, y no sustituye, el juicio del agricultor ni del técnico.",
};
// En portugués y en francés el aviso debe decir las dos cosas: apoya y no sustituye.
const AVISO_PATRON = { pt: /apoia, e não substitui/, fr: /appuie, et ne remplace pas/ };
// Palabras vetadas por idioma (CLAUDE.md, regla 10), como palabra completa y con letras acentuadas.
const palabra = (alternativas) => new RegExp(`(?<!\\p{L})(${alternativas})(?!\\p{L})`, "iu");
const VETADAS = {
  en: palabra("first|only|best|better|recommend\\p{L}*|sav(?:e|es|ed|ing|ings)"),
  es: palabra("mejor(?:es)?|recomend\\p{L}*|ahorr\\p{L}*|predicci\\p{L}*"),
  pt: palabra("melhor(?:es)?|recomend\\p{L}*|poup\\p{L}*|econom\\p{L}*"),
  fr: palabra("meilleur\\p{L}*|recommand\\p{L}*|économis\\p{L}*|economis\\p{L}*"),
};
// Señales de texto en español dentro de la interfaz en inglés.
const ESPANOL = palabra("de|del|la|las|los|el|tu|tus|su|sus|parcela|parcelas|cultivo|cultivos|agua|riego|lluvia|año|años|con|sin|para|por|una|que|es|se|\\p{L}*[áéíóúñ]\\p{L}*");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

// ---------------------------------------------------------------- servidor estático
function servidor() {
  const srv = http.createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let archivo = path.normalize(path.join(WEB, ruta));
    if (!archivo.startsWith(WEB)) {
      res.writeHead(403).end();
      return;
    }
    if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, "index.html");
    fs.readFile(archivo, (err, datos) => {
      if (err) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, { "Content-Type": TIPOS[path.extname(archivo)] ?? "application/octet-stream" });
      res.end(datos);
    });
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

// ---------------------------------------------------------------- registro de resultados
const resultados = [];
function check(nombre, cond, detalle = "") {
  resultados.push({ nombre, ok: Boolean(cond), detalle });
  console.log(`${cond ? "PASA" : "FALLA"}  ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}
const avisos = new Set();
function aviso(texto) {
  if (!avisos.has(texto)) console.log(`AVISO  ${texto}`);
  avisos.add(texto);
}
const corto = (lista, n = 3) => lista.slice(0, n).map((s) => JSON.stringify(s.slice(0, 90))).join(" | ");

// ---------------------------------------------------------------- utilidades de página
const hostsAjenos = new Set();
let teselasPedidas = 0;
/** Página nueva: corta las teselas (la prueba no depende de la red) y apunta toda petición a otro dominio. */
async function abrir(browser, base, { ancho = 1440, alto = 900, opciones = {} } = {}) {
  const contexto = await browser.newContext({
    viewport: { width: ancho, height: alto },
    deviceScaleFactor: 1,
    acceptDownloads: true,
    serviceWorkers: "block",
    reducedMotion: "reduce",
    locale: "en-US",
    ...opciones,
  });
  const page = await contexto.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.route("**/*", (ruta) => {
    const url = new URL(ruta.request().url());
    if (url.origin === base || url.protocol === "data:" || url.protocol === "blob:") return ruta.continue();
    if (url.hostname === HOST_TESELAS) teselasPedidas += 1;
    else hostsAjenos.add(url.hostname);
    return ruta.abort();
  });
  return { page, contexto, errores };
}
async function listo(page) {
  await page.waitForSelector('body[data-dashboard="listo"]', { timeout: 60000 });
  await page.waitForSelector("body[data-dashboard-map]", { timeout: 30000 });
  if ((await page.locator("body").getAttribute("data-dashboard-map")) === "listo") {
    await page.waitForSelector("body[data-dashboard-map-rendered]", { timeout: 30000 });
  }
}
async function irA(page, vista) {
  await page.locator(`nav a[data-view="${vista}"]`).click();
  await page.locator(`[data-panel="${vista}"]`).waitFor({ state: "visible" });
}
const sinDesplazamiento = (page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
/**
 * Textos a la vista (y los que se anuncian: aria-label, title, placeholder, alt), separados en tres grupos:
 * los de este frente, los que dibuja el asesor y los que vienen de los datos.
 */
function textosVisibles(page) {
  return page.evaluate(
    ([deAsesor, deDatos]) => {
      const grupos = { propios: [], asesor: [], datos: [] };
      const grupoDe = (el) => (el.closest(deAsesor) ? "asesor" : el.closest(deDatos) ? "datos" : "propios");
      const visible = (el) => el.checkVisibility() && !el.closest("script, style, template");
      const andador = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let nodo = andador.nextNode(); nodo; nodo = andador.nextNode()) {
        const texto = nodo.nodeValue.replace(/\s+/g, " ").trim();
        const el = nodo.parentElement;
        if (texto && el && visible(el)) grupos[grupoDe(el)].push(texto);
      }
      for (const el of document.body.querySelectorAll("[aria-label], [title], [placeholder], [alt]")) {
        if (!visible(el)) continue;
        for (const atributo of ["aria-label", "title", "placeholder", "alt"]) {
          const valor = el.getAttribute(atributo);
          if (valor && valor.trim()) grupos[grupoDe(el)].push(valor.trim());
        }
      }
      return grupos;
    },
    [DE_ASESOR, DE_DATOS],
  );
}

// ---------------------------------------------------------------- comprobaciones por idioma
async function revisarIdioma(browser, base, codigo, geo) {
  const { page, contexto, errores } = await abrir(browser, base);
  await page.goto(`${base}/index.html?lang=${codigo}`);
  await listo(page);
  const T = TEXTOS_TABLERO[codigo];
  check(`[${codigo}] <html lang="${codigo}">`, (await page.locator("html").getAttribute("lang")) === codigo);
  const titulo = await page.title();
  check(`[${codigo}] el título lleva el nombre del producto y sigue al idioma`, titulo === `${PRODUCTO} · ${T["tablero.titulo"]}`, titulo);
  check(`[${codigo}] el lema está en la cabecera`, (await page.locator("#page-description").innerText()).trim() === T["tablero.lema"]);

  // Selector de idioma y nota de borrador.
  const opciones = await page.locator("#idioma option").allInnerTexts();
  check(`[${codigo}] el selector ofrece los cuatro idiomas con su nombre`, JSON.stringify(opciones) === JSON.stringify(IDIOMAS.map((c) => NOMBRE_IDIOMA[c])), opciones.join(", "));
  check(`[${codigo}] el selector está a la vista y marca el idioma en uso`, (await page.locator("#idioma").isVisible()) && (await page.locator("#idioma").inputValue()) === codigo);
  const nota = page.locator("#idioma-nota");
  if (BORRADOR_DE_MAQUINA.includes(codigo)) {
    check(`[${codigo}] nota de traducción hecha por máquina junto al selector`, (await nota.isVisible()) && (await nota.innerText()).trim() === T["tablero.idioma.borrador"]);
  } else {
    check(`[${codigo}] sin nota de borrador (no es una traducción por máquina)`, !(await nota.isVisible()));
  }

  // Aviso de juicio en la ficha y en el pie.
  const avisoFicha = (await page.locator("#field-notice").innerText()).trim();
  const avisoPie = (await page.locator("#footer-notice").innerText()).trim();
  check(`[${codigo}] aviso de juicio en la ficha`, avisoFicha === T["tablero.aviso"] && (await page.locator("#field-notice").isVisible()), avisoFicha);
  check(`[${codigo}] aviso de juicio en el pie`, avisoPie === T["tablero.aviso"] && (await page.locator("#footer-notice").isVisible()));
  if (AVISO_EXACTO[codigo]) check(`[${codigo}] el aviso dice la frase acordada`, avisoFicha === AVISO_EXACTO[codigo]);
  else check(`[${codigo}] el aviso dice que apoya y que no sustituye`, AVISO_PATRON[codigo].test(avisoFicha), avisoFicha);

  // Puentes al explorador de parcelas.
  const parcela = await page.locator("#field-select").inputValue();
  check(`[${codigo}] enlace de la ficha a explorer.html#<id>`, (await page.locator(".field-link").getAttribute("href")) === `explorer.html#${encodeURIComponent(parcela)}`);
  check(`[${codigo}] enlace visible al explorador con su rótulo`, (await page.locator('a[href="explorer.html"]:visible').allInnerTexts()).some((s) => s.includes(T["tablero.abrir_explorador"])));
  check(`[${codigo}] el pie dice dónde están la leyenda de etiquetas, «About & Data» y «Tests in sight»`, (await page.locator("footer").innerText()).includes(T["tablero.pie.leyenda"]));

  // Vista por vista: claves sin traducir, palabras vetadas, español en la interfaz en inglés, desplazamiento.
  const sinTraducir = [];
  const vetadas = [];
  const enEspanol = [];
  for (const vista of VISTAS) {
    await irA(page, vista);
    const grupos = await textosVisibles(page);
    for (const texto of [...grupos.propios, ...grupos.asesor, ...grupos.datos]) {
      if (/tablero\.[a-z_]/.test(texto)) sinTraducir.push(`${vista}: ${texto}`);
    }
    for (const texto of grupos.propios) {
      if (VETADAS[codigo].test(texto)) vetadas.push(`${vista}: ${texto}`);
      if (codigo === "en" && ESPANOL.test(texto)) enEspanol.push(`${vista}: ${texto}`);
    }
    if (codigo === "en") {
      const ajenos = grupos.asesor.filter((s) => ESPANOL.test(s) || VETADAS.en.test(s));
      if (ajenos.length) aviso(`[en] vista «${vista}»: ${ajenos.length} textos de js/asesor.js siguen en español o con palabras vetadas (otro frente): ${corto(ajenos, 2)}`);
      const deDatos = grupos.datos.filter((s) => ESPANOL.test(s));
      if (deDatos.length) aviso(`[en] vista «${vista}»: ${deDatos.length} textos de los datos están en español (dashboard.json o citas del cubo): ${corto(deDatos, 2)}`);
    }
    check(`[${codigo}] vista «${vista}» sin desplazamiento horizontal`, await sinDesplazamiento(page));
    const [ceja] = [await page.locator("#breadcrumb").innerText()];
    check(`[${codigo}] vista «${vista}» con su nombre en la ruta`, ceja.trim().length > 0 && !ceja.includes("tablero."), ceja);
  }
  check(`[${codigo}] ninguna clave sin traducir a la vista`, sinTraducir.length === 0, corto(sinTraducir));
  check(`[${codigo}] ninguna palabra vetada en los textos del tablero`, vetadas.length === 0, corto(vetadas));
  if (codigo === "en") check("[en] ningún texto del tablero en español", enEspanol.length === 0, corto(enEspanol));

  // Sin PDF ni carpeta de investigación; nombres de vistas retirados.
  const enlacesPdf = await page.evaluate((deAsesor) => [...document.querySelectorAll('a[href*="research/"], a[href$=".pdf"]')].filter((a) => !a.closest(deAsesor)).map((a) => a.getAttribute("href")), DE_ASESOR);
  check(`[${codigo}] ningún enlace a PDF ni a research/`, enlacesPdf.length === 0, enlacesPdf.join(", "));
  check(`[${codigo}] sin tarjeta de «próxima etapa» ni sección de fuentes en PDF`, (await page.locator(".ml-card, .source, [data-panel='investigacion']").count()) === 0);
  check(`[${codigo}] cinco vistas en la navegación`, (await page.locator("nav a[data-view]").count()) === VISTAS.length);
  const nombres = (await page.locator("nav a[data-view]").allInnerTexts()).map((s) => s.trim());
  check(`[${codigo}] la navegación nombra las vistas con los textos del idioma`, JSON.stringify(nombres) === JSON.stringify(["resumen", "terreno", "cultivos", "comparar", "historia"].map((v) => T[`tablero.nav.${v}`])), nombres.join(" / "));
  check(`[${codigo}] lista de parcelas completa`, (await page.locator("#field-select option").count()) === geo.features.filter((f) => f.properties.zona === "delicias_saucillo").length);
  await irA(page, "resumen");
  await page.screenshot({ path: path.join(CAPTURAS, `dashboard_${codigo}_1440.png`) });
  check(`[${codigo}] sin errores de página`, errores.length === 0, errores.slice(0, 2).join(" | "));
  await contexto.close();
}

// ---------------------------------------------------------------- selector de idioma
async function revisarSelector(browser, base) {
  const { page, contexto, errores } = await abrir(browser, base);
  await page.goto(`${base}/index.html?lang=en`);
  await listo(page);
  const antes = await page.locator("#field-detail").innerText();
  await page.locator("#idioma").selectOption("es");
  await page.waitForFunction(() => document.documentElement.lang === "es");
  check("selector: cambia <html lang> sin recargar", (await page.evaluate(() => performance.getEntriesByType("navigation").length)) === 1);
  check("selector: la cabecera, la navegación y la ficha pasan al español", (await page.locator("#page-title").innerText()).trim() === TEXTOS_TABLERO.es["tablero.titulo"] && (await page.locator('nav a[data-view="terreno"]').innerText()).trim() === TEXTOS_TABLERO.es["tablero.nav.terreno"] && (await page.locator("#field-detail").innerText()) !== antes);
  check("selector: el título de la pestaña sigue al idioma", (await page.title()) === `${PRODUCTO} · ${TEXTOS_TABLERO.es["tablero.titulo"]}`);
  check("selector: la leyenda del mapa y las dotaciones de referencia cambian", (await page.locator(".map-legend").innerText()).includes(TEXTOS_TABLERO.es["tablero.leyenda.verde"]) && (await page.locator("[data-allocation]").last().innerText()).trim() === TEXTOS_TABLERO.es["tablero.marca.normal"]);
  check("selector: la liga conserva la elección (?lang=es)", new URL(page.url()).searchParams.get("lang") === "es", page.url());
  await page.reload();
  await listo(page);
  check("selector: el idioma elegido se conserva al recargar", (await page.locator("html").getAttribute("lang")) === "es" && (await page.locator("#idioma").inputValue()) === "es");
  // Sin «?lang=»: el navegador de la prueba está en inglés; la elección se recuerda en el propio navegador.
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${base}/index.html`);
  await listo(page);
  check("sin ?lang= y con el navegador en inglés, la página abre en inglés", (await page.locator("html").getAttribute("lang")) === "en");
  await page.locator("#idioma").selectOption("fr");
  await page.waitForFunction(() => document.documentElement.lang === "fr");
  check("selector: sin ?lang= la liga queda igual", !new URL(page.url()).searchParams.has("lang"));
  await page.reload();
  await listo(page);
  check("selector: sin ?lang= la elección también se conserva al recargar", (await page.locator("html").getAttribute("lang")) === "fr" && (await page.locator("#idioma-nota").isVisible()));
  check("selector: sin errores de página", errores.length === 0, errores.slice(0, 2).join(" | "));
  await contexto.close();
}

// ---------------------------------------------------------------- el tablero funciona (inglés, escritorio)
async function revisarFunciones(browser, base, geo) {
  const { page, contexto, errores } = await abrir(browser, base);
  const T = TEXTOS_TABLERO.en;
  await page.goto(`${base}/index.html?lang=en`);
  await listo(page);
  await page.locator('[data-map-mode="cultivo"]').click();
  check("mapa: «Crop» queda marcado y la leyenda cambia", (await page.locator('[data-map-mode="cultivo"]').getAttribute("aria-pressed")) === "true" && (await page.locator(".map-legend").innerText()).includes(T["tablero.leyenda.clasificado"]));
  await page.locator('[data-map-mode="agua"]').click();
  check("mapa: la leyenda del agua usa los estados del explorador", (await page.locator(".map-legend").innerText()).includes(T["tablero.leyenda.verde"]));
  const original = await page.locator("#allocation").inputValue();
  const marca = page.locator("[data-allocation]").first();
  const valor = await marca.getAttribute("data-allocation");
  await marca.click();
  check("dotación: una marca de referencia mueve el deslizador y queda marcada", (await page.locator("#allocation").inputValue()) === valor && (await marca.getAttribute("aria-pressed")) === "true");
  await page.locator("#allocation").fill(original);
  if (await page.locator("[data-parcel-chip]").count()) {
    const acceso = page.locator("[data-parcel-chip]").first();
    const id = await acceso.getAttribute("data-parcel-chip");
    await acceso.click();
    check("accesos: elegir una parcela la pone en la ficha", (await page.locator("#field-select").inputValue()) === id && (await page.locator("#field-detail").innerText()).includes(id));
    if ((await page.locator("body").getAttribute("data-dashboard-map")) === "listo") {
      check("accesos: el marcador del mapa lleva el ID", (await page.locator(".map-selection-marker").innerText()) === id);
    }
  }
  const cifras = await page.locator("#stats").innerText();
  const { min, max } = await page.evaluate(() => ({ min: document.querySelector("#allocation").min, max: document.querySelector("#allocation").max }));
  await page.locator("#allocation").fill(min);
  const sinAgua = await page.locator("#stats").innerText();
  check("dotación en el mínimo: las cifras cambian y dicen que no hay dotación", sinAgua !== cifras && sinAgua.includes(T["tablero.cifra.sin_dotacion_nota"]));
  await page.locator("#allocation").fill(max);
  await page.locator("#rain").check();
  await page.locator("#zona-dashboard").selectOption("lazaro_cardenas");
  check("zona: la lista trae las parcelas de la otra zona", (await page.locator("#field-select option").count()) === geo.features.filter((f) => f.properties.zona === "lazaro_cardenas").length);
  const sinClasificar = geo.features.find((f) => f.properties.zona === "lazaro_cardenas" && f.properties.abstencion).properties.id;
  await page.locator("#field-select").selectOption(sinClasificar);
  check("parcela sin clasificar: no se calcula nada", (await page.locator("#field-detail").innerText()).includes(T["tablero.sin_calculo"]));

  // Descarga del resumen: columnas en inglés y la lluvia como número.
  let espera = page.waitForEvent("download");
  await page.locator("#exportar").click();
  let csv = fs.readFileSync(await (await espera).path(), "utf-8");
  const [encabezado, fila] = csv.replace(/^﻿/, "").split("\r\n");
  check("CSV del resumen: columnas en inglés", encabezado.startsWith('"pilot_area","field","crop","area_ha"') && !ESPANOL.test(encabezado.replaceAll('"', " ").replaceAll("_", " ")), encabezado);
  check("CSV del resumen: trae la parcela y el alcance", fila.includes(sinClasificar) && fila.includes(T["tablero.csv.alcance"]));
  const menosLluvia = await page.evaluate(() => fetch("data/cubo.json").then((r) => r.json()).then((c) => c.lluvia_pct.find((v) => v < 0)));
  check("CSV del resumen: la lluvia se exporta como número, sin apóstrofo", fila.includes(`,${menosLluvia},`) && !csv.includes(`'${menosLluvia}`), fila.slice(0, 120));

  await irA(page, "terreno");
  await page.locator("#terrain-slot .map-detail-grid").waitFor({ state: "visible" });
  check("vista del terreno: el mapa y la ficha pasan a esa vista", await page.locator("#terrain-slot .map-detail-grid").isVisible());
  await irA(page, "cultivos");
  check("vista de cultivos: una tarjeta por opción de rotación", (await page.locator(".crop-card").count()) > 0);
  await irA(page, "predicciones");
  const total = await page.locator(".event").count();
  await page.locator('[data-filter="sequia"]').click();
  const filtrados = await page.locator(".event").count();
  check("eventos: el filtro deja menos eventos", filtrados > 0 && filtrados < total, `${filtrados} de ${total}`);
  espera = page.waitForEvent("download");
  await page.locator("#export-timeline").click();
  csv = fs.readFileSync(await (await espera).path(), "utf-8");
  check("CSV de la cronología: columnas en inglés y solo los eventos filtrados", csv.includes('"period","type","event","detail","source","status"') && csv.trim().split("\r\n").length === filtrados + 1);
  await page.goto(`${base}/index.html?lang=en#investigacion`);
  await listo(page);
  check("un enlace viejo a la vista de fuentes abre el resumen", await page.locator('[data-panel="resumen"]').isVisible());
  check("funciones: sin errores de página", errores.length === 0, errores.slice(0, 2).join(" | "));
  await contexto.close();
}

// ---------------------------------------------------------------- teléfono, como aplicación
async function revisarTelefono(browser, base, codigo, ancho, alto) {
  const { page, contexto, errores } = await abrir(browser, base, { ancho, alto, opciones: { isMobile: true, hasTouch: true } });
  await page.goto(`${base}/index.html?lang=${codigo}`);
  await listo(page);
  const rotulo = `[${codigo} ${ancho}×${alto}]`;
  for (const vista of VISTAS) {
    await irA(page, vista);
    check(`${rotulo} vista «${vista}» sin desplazamiento horizontal`, await sinDesplazamiento(page), await page.evaluate(() => `${document.documentElement.scrollWidth} de ${innerWidth}`));
  }
  await irA(page, "resumen");
  const medidas = await page.evaluate(() => {
    const caja = (sel) => document.querySelector(sel)?.getBoundingClientRect();
    const mapa = document.querySelector("#map").hidden ? caja("#map-fallback") : caja("#map");
    const barra = caja(".sidebar");
    const cabecera = caja(".topbar");
    const lienzo = document.querySelector("#map").hidden ? document.querySelector("#map-fallback") : document.querySelector("#map");
    lienzo.scrollIntoView({ block: "center" });
    const r = lienzo.getBoundingClientRect();
    const encima = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      mapa: mapa.height,
      util: innerHeight - cabecera.height - barra.height,
      barraAbajo: barra.bottom > innerHeight - 40 && barra.width > innerWidth * 0.8,
      centroLibre: Boolean(encima && lienzo.contains(encima)),
      encima: encima ? `${encima.tagName}.${encima.className}` : "nada",
    };
  });
  check(`${rotulo} el mapa mide al menos un tercio del alto útil`, medidas.mapa >= medidas.util / 3, `${Math.round(medidas.mapa)} px de ${Math.round(medidas.util)} útiles`);
  check(`${rotulo} nada tapa el centro del mapa`, medidas.centroLibre, medidas.encima);
  // Hasta 600 px la navegación es la barra de pestañas inferior; en tableta sigue en el costado.
  if (ancho <= 600) check(`${rotulo} navegación por pestañas abajo`, medidas.barraAbajo);
  const chicos = await page.evaluate(() => {
    const selectores = ["nav a[data-view]", "#idioma", ".top-actions .icon-button", "#exportar", "#zona-dashboard", "#fit-map", "[data-map-mode]", "#focus-field", "[data-allocation]", "[data-parcel-chip]", "#field-search", "#field-select", ".maplibregl-ctrl-group button"];
    const fuera = [];
    for (const sel of selectores) {
      for (const el of document.querySelectorAll(sel)) {
        if (!el.checkVisibility()) continue;
        const r = el.getBoundingClientRect();
        if (r.height < 43.5 || r.width < 43.5) fuera.push(`${sel} ${Math.round(r.width)}×${Math.round(r.height)}`);
      }
    }
    return fuera;
  });
  check(`${rotulo} controles de al menos 44 px`, chicos.length === 0, chicos.slice(0, 4).join(" | "));
  check(`${rotulo} el selector de idioma está a la vista`, await page.locator("#idioma").isVisible());
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(CAPTURAS, `dashboard_${codigo}_${ancho}.png`) });
  check(`${rotulo} sin errores de página`, errores.length === 0, errores.slice(0, 2).join(" | "));
  await contexto.close();
}

// ---------------------------------------------------------------- sin mapa, sin datos y datos con marcado
async function revisarFallos(browser, base) {
  // Sin la biblioteca del mapa (como al abrir sin red y sin copia): modo local con los polígonos.
  let { page, contexto, errores } = await abrir(browser, base, { ancho: 390, alto: 844 });
  await page.route("**/vendor/maplibre-gl-*/maplibre-gl.js", (r) => r.abort());
  await page.goto(`${base}/index.html?lang=en`);
  await page.waitForSelector('body[data-dashboard="listo"]', { timeout: 60000 });
  check("sin la biblioteca del mapa: modo local", (await page.locator("body").getAttribute("data-dashboard-map")) === "local");
  check("modo local: los polígonos de la zona están dibujados y se pueden elegir", (await page.locator("#map-fallback").isVisible()) && (await page.locator("#map-fallback path.fallback-field").count()) > 0);
  check("modo local: el aviso lo dice y remite al listado", (await page.locator("#map-note").innerText()).includes(TEXTOS_TABLERO.en["tablero.mapa.elige_lista"]) && (await page.locator("#map-note").isVisible()));
  const otra = await page.locator("#map-fallback path.fallback-field").nth(3).getAttribute("data-id");
  await page.locator("#map-fallback path.fallback-field").nth(3).focus();
  await page.keyboard.press("Enter");
  check("modo local: una parcela se elige con el teclado", (await page.locator("#field-select").inputValue()) === otra);
  check("modo local: sin desplazamiento horizontal ni errores", (await sinDesplazamiento(page)) && errores.length === 0, errores.slice(0, 2).join(" | "));
  await contexto.close();

  // Un fallo del perfil regional de suelo se distingue de la ausencia de una medición.
  ({ page, contexto } = await abrir(browser, base));
  await page.route("**/data/suelo.json", (r) => r.fulfill({ status: 500, body: "error" }));
  await page.goto(`${base}/index.html?lang=en`);
  await page.waitForSelector('body[data-dashboard="listo"]', { timeout: 60000 });
  check("sin suelo.json: la ficha dice que no se pudo cargar", (await page.locator("#field-detail").innerText()).includes(TEXTOS_TABLERO.en["tablero.no_cargo"]));
  await contexto.close();

  // Un fallo en los datos principales se dice, en el idioma en uso, con el camino al explorador.
  ({ page, contexto } = await abrir(browser, base));
  await page.route("**/data/cubo.json", (r) => r.fulfill({ status: 500, body: "error" }));
  await page.goto(`${base}/index.html?lang=es`);
  await page.waitForSelector('body[data-dashboard="error"]', { timeout: 60000 });
  const fallo = await page.locator("#load-status").innerText();
  check("sin cubo.json: el fallo se dice en el idioma en uso", fallo.includes("data/cubo.json") && fallo.startsWith(TEXTOS_TABLERO.es["tablero.error.carga"].split("{")[0]), fallo);
  check("sin cubo.json: se ofrece el enlace al explorador", (await page.locator('#load-status a[href="explorer.html"]').count()) === 1);
  await page.locator("#idioma").selectOption("en");
  check("sin cubo.json: el aviso de fallo cambia con el idioma", (await page.locator("#load-status").innerText()).startsWith(TEXTOS_TABLERO.en["tablero.error.carga"].split("{")[0]));
  await contexto.close();

  // Un texto de los datos con marcado HTML se muestra como texto.
  ({ page, contexto, errores } = await abrir(browser, base));
  const sucio = '<img src="x" onerror="window.__inyectado = true">';
  await page.route("**/data/dashboard.json", async (r) => {
    const datos = JSON.parse(fs.readFileSync(path.join(WEB, "data", "dashboard.json"), "utf-8"));
    datos.historia[0].anio = sucio;
    datos.historia_fuente = sucio;
    datos.eventos[0].titulo = sucio;
    datos.eventos[0].periodo = sucio;
    await r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(datos) });
  });
  await page.goto(`${base}/index.html?lang=en`);
  await page.waitForSelector('body[data-dashboard="listo"]', { timeout: 60000 });
  await irA(page, "predicciones");
  const inyeccion = await page.evaluate(() => ({ marcado: document.querySelectorAll("#history-chart img, #timeline img").length, ejecutado: window.__inyectado === true, texto: document.querySelector("#timeline h3").textContent }));
  check("datos con marcado HTML: entran como texto, no como marcado", inyeccion.marcado === 0 && !inyeccion.ejecutado && inyeccion.texto === sucio, JSON.stringify(inyeccion));
  check("datos con marcado HTML: sin errores de página", errores.length === 0, errores.slice(0, 2).join(" | "));
  await contexto.close();
}

// ---------------------------------------------------------------- principal
const srv = await servidor();
const base = `http://127.0.0.1:${srv.address().port}`;
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
let fatal = null;
try {
  // Comprobaciones de los archivos, antes de abrir el navegador.
  const html = fs.readFileSync(path.join(WEB, "index.html"), "utf-8");
  const fuentes = ["js/dashboard.js", "js/interfaz.js", "js/textos_tablero.js"].map((f) => fs.readFileSync(path.join(WEB, f), "utf-8")).join("\n");
  check('index.html: <html lang="en"> de respaldo y el nombre del producto en <title>', /<html lang="en">/.test(html) && html.includes(`<title>${PRODUCTO}`));
  check("index.html: sin enlaces a research/ ni a PDF", !/research\/|\.pdf/i.test(html));
  check("index.html: sin «Raíz» como nombre del producto", !/ra[ií]z\b/i.test(html.replace(/icons\/raiz-[\w.-]+/g, "").replace(/<!--[\s\S]*?-->/g, "")));
  check("el tablero no nombra dominios nuevos: sin arcgisonline y con las teselas de OpenStreetMap", !/arcgisonline|esri/i.test(fuentes + html) && fuentes.includes(`https://${HOST_TESELAS}/{z}/{x}/{y}.png`) && fuentes.includes("© OpenStreetMap contributors"));

  const geo = JSON.parse(fs.readFileSync(path.join(WEB, "data", "parcelas.geojson"), "utf-8"));
  for (const codigo of IDIOMAS) await revisarIdioma(browser, base, codigo, geo);
  await revisarSelector(browser, base);
  await revisarFunciones(browser, base, geo);
  await revisarTelefono(browser, base, "en", 390, 844);
  await revisarTelefono(browser, base, "es", 390, 844);
  await revisarTelefono(browser, base, "en", 320, 700);
  await revisarTelefono(browser, base, "fr", 768, 1024);
  await revisarFallos(browser, base);
  check("red: ninguna petición a dominios que no sean el propio y tile.openstreetmap.org", hostsAjenos.size === 0, [...hostsAjenos].join(", "));
  console.log(`NOTA   teselas pedidas a ${HOST_TESELAS} (cortadas por la prueba): ${teselasPedidas}`);
} catch (err) {
  fatal = err;
} finally {
  await browser.close();
  srv.close();
}

const fallas = resultados.filter((r) => !r.ok);
console.log("");
console.log(`Dashboard: ${resultados.length - fallas.length} de ${resultados.length} comprobaciones pasan. Capturas: ${CAPTURAS}`);
if (avisos.size) console.log(`Avisos (no son de este frente): ${avisos.size}`);
for (const f of fallas) console.log(`  FALLA  ${f.nombre}${f.detalle ? ` — ${f.detalle}` : ""}`);
if (fatal) console.log(`  ERROR  la prueba se interrumpió: ${fatal.stack ?? fatal}`);
process.exit(fallas.length || fatal ? 1 : 0);
