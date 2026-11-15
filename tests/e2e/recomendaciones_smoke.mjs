// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// tests/e2e/recomendaciones_smoke.mjs — Prueba de humo del plan y del asesor del tablero (web/js/asesor.js,
// web/js/recomendador.js y web/js/textos_asesor.js) con Playwright.
//
// Uso:   node tests/e2e/recomendaciones_smoke.mjs
//        RAIZ_CAPTURAS=<carpeta> node tests/e2e/recomendaciones_smoke.mjs   (dónde dejar las capturas; opcional)
// Arranca sola: sirve web/ en localhost (http.createServer, sin dependencias) y no pide variables de entorno.
// No forma parte de `node --test tests/` (necesita Chromium). Termina con código 0 si todo pasa y 1 si algo falla.
//
// Qué comprueba, primero en un teléfono (390 × 844) y en los cuatro idiomas (index.html?lang=en, es, pt y fr):
// - el plan de P0757 muestra LAS MISMAS hectáreas que la ficha de la parcela (explorer.html#P0757) con cada
//   dotación de referencia del cubo, opción por opción;
// - cada tarjeta lleva el aviso de juicio en el idioma de la página, y los textos son los de ese idioma;
// - ninguna clave de texto a la vista, ningún «NaN» ni «undefined», ninguna palabra vetada (regla 10);
// - una restricción se describe con su fuente; la parcela sin clasificar no tiene plan y dice por qué; la parcela
//   en descanso muestra las opciones del cubo; las comprobaciones del botón pasan;
// - el bloque de lluvia se llama «Historical rainfall range (NASA POWER)» y no menciona el año futuro;
// - en el teléfono: sin desplazamiento horizontal y controles de al menos 44 px de alto;
// - al cambiar de idioma con la página abierta, el asesor se vuelve a dibujar y conserva lo capturado;
// - un volumen total capturado da las hectáreas que la ficha escribe para la dotación equivalente;
// - con datos hostiles (marcado HTML y direcciones «javascript:» dentro de cubo.json y pronostico.json, servidos
//   solo a la página de la prueba) nada entra al DOM como marcado y los enlaces llevan http o https.
// No supone un juego de datos: dotaciones, parcelas y ventanas de siembra se leen de web/data.

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { TEXTOS_ASESOR } from "../../web/js/textos_asesor.js";
import { IDIOMAS } from "../../web/js/i18n.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const WEB = path.resolve(AQUI, "..", "..", "web");
const CAPTURAS = process.env.RAIZ_CAPTURAS ? path.resolve(process.env.RAIZ_CAPTURAS) : fs.mkdtempSync(path.join(os.tmpdir(), "root-plan-"));
const ESPERA_MS = 60000; // holgado: la máquina puede estar corriendo otras pruebas con navegador a la vez
const TELEFONO = { width: 390, height: 844 };
const ESCRITORIO = { width: 1366, height: 860 };
const PARCELA = "P0757";
const REGION = { en: "en-US", es: "es-MX", pt: "pt-BR", fr: "fr-FR" };
const ALTO_MINIMO = 44;

const leerJson = (ruta) => JSON.parse(fs.readFileSync(path.join(WEB, ruta), "utf-8"));
const cubo = leerJson("data/cubo.json");
const geo = leerJson("data/parcelas.geojson");
const pronostico = leerJson("data/pronostico.json");
const MARCAS = cubo.dotaciones.marcas.map((m) => m.valor);
const propiedades = (id) => geo.features.find((f) => f.properties.id === id).properties;
const ZONA = propiedades(PARCELA).zona;

// Palabras que la herramienta no usa (regla 10), por idioma; \p{L} para que los acentos cuenten como letras.
const palabra = (raices) => new RegExp(`(?<![\\p{L}])(?:${raices})(?![\\p{L}])`, "iu");
const VETADAS = {
  en: palabra("first|only|best|better|recommend\\p{L}*|sav(?:e|es|ed|ing|ings)|free(?:s|d|ing)? up"),
  es: palabra("mejor\\p{L}*|recomend\\p{L}*|ahorr\\p{L}*|únic[oa]s?"),
  pt: palabra("melhor\\p{L}*|recomend\\p{L}*|poup\\p{L}*|econom\\p{L}*|econôm\\p{L}*"),
  fr: palabra("meilleur\\p{L}*|recommand\\p{L}*|économis\\p{L}*"),
};
// Frases de la versión anterior que ordenaban o pronosticaban: no deben volver, en ningún idioma.
const FRASES_RETIRADAS = /No ejecutar este plan|No establecer un cultivo|Planificar como máximo|no se recomiendan|PLAN HÍDRICO|Predicción de referencia|Lluvia de referencia · ciclo/i;

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

// ---------------------------------------------------------------- registro de resultados
const resultados = [];
function check(nombre, cond, detalle = "") {
  resultados.push({ nombre, ok: Boolean(cond), detalle });
  console.log(`${cond ? "PASA" : "FALLA"}  ${nombre}${!cond && detalle ? ` — ${detalle}` : ""}`);
}

// ---------------------------------------------------------------- servidor local de web/
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
      res.writeHead(200, { "Content-Type": TIPOS[path.extname(archivo)] ?? "application/octet-stream", "Cache-Control": "no-store" });
      res.end(datos);
    });
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

// ---------------------------------------------------------------- utilerías de página
async function nuevaPagina(navegador, viewport) {
  const ctx = await navegador.newContext({ viewport, serviceWorkers: "block", acceptDownloads: true });
  const page = await ctx.newPage();
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  // Sin red hacia afuera (teselas del mapa): se aborta de inmediato; la página dibuja los polígonos locales.
  await page.route((url) => url.hostname !== "127.0.0.1", (route) => route.abort());
  return { ctx, page, errores };
}
async function abrirTablero(page, base, idioma, parcela = PARCELA) {
  await page.goto(`${base}/index.html?lang=${idioma}#${parcela}`, { waitUntil: "load" });
  await page.waitForSelector('body[data-dashboard="listo"]', { timeout: ESPERA_MS });
  await irA(page, "recomendaciones");
}
async function irA(page, vista) {
  await page.evaluate((v) => {
    location.hash = v;
  }, vista);
  await page.waitForSelector(`[data-panel="${vista}"]:not([hidden])`, { timeout: ESPERA_MS });
}
async function elegirParcela(page, id) {
  await irA(page, "resumen");
  await page.evaluate((v) => {
    location.hash = v;
  }, id);
  await page.waitForFunction((v) => document.querySelector("#field-select")?.value === v, id, { timeout: ESPERA_MS });
  await irA(page, "recomendaciones");
}
async function fijarDotacion(page, selector, valor) {
  await page.evaluate(
    ([s, v]) => {
      const el = document.querySelector(s);
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    },
    [selector, valor],
  );
}
/** Tarjetas del plan: id, estado, hectáreas escritas como en la ficha (data-*), texto visible y aviso. */
function leerPlan(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("#recommendations [data-plan-option]")].map((el) => ({
      id: el.dataset.planOption,
      estado: el.dataset.state,
      area: el.dataset.area ?? null,
      ha: el.dataset.ha ?? null,
      bajo: el.dataset.haLow ?? null,
      alto: el.dataset.haHigh ?? null,
      cobertura: el.querySelector("[data-plan-coverage]")?.textContent ?? "",
      aviso: el.querySelector(".aviso-juicio")?.textContent ?? null,
      avisoVisible: Boolean(el.querySelector(".aviso-juicio")?.getClientRects().length),
      rotulo: el.querySelector(".pill")?.textContent ?? "",
    })),
  );
}
/** Lo que la ficha de explorer.html escribe en «Enough for…» de cada opción. */
function leerFicha(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll(".tarjeta[data-opcion]")].map((el) => {
      const p = el.querySelector(".alcanza");
      return { id: el.dataset.opcion, tipo: p?.dataset.alcanza ?? null, texto: p?.textContent ?? "" };
    }),
  );
}
const textoDe = (page, selectores) =>
  page.evaluate((s) => s.map((x) => document.querySelector(x)?.textContent ?? "").join("\n"), selectores);
const sinDesplazamiento = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
/** Controles visibles de los contenedores del asesor con menos de 44 px de alto. */
function controlesBajos(page, selector) {
  return page.evaluate(
    ([s, minimo]) =>
      [...document.querySelectorAll(s)]
        .filter((el) => el.getClientRects().length && getComputedStyle(el).visibility !== "hidden")
        .map((el) => ({ que: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}`, alto: Math.round(el.getBoundingClientRect().height * 10) / 10 }))
        .filter((x) => x.alto < minimo - 0.5),
    [selector, ALTO_MINIMO],
  );
}
const MIOS = ["#decision-inputs", "#decision-summary", "#recommendations", "#decision-checks", "#forecast-analysis"];
const CONTROLES =
  "#decision-form select, #decision-form input:not([type=checkbox]), #decision-form button, #decision-form label.confirmation, " +
  "#recommendations summary, #forecast-analysis button, #forecast-analysis summary";

/** Fecha «MM-DD» fuera de la ventana de siembra de la rotación actual de la parcela (del catálogo del cubo). */
function fechaFueraDeVentana(parcela) {
  const rotacion = cubo.parcelas[parcela].opciones.find((o) => o.id === "ACTUAL").rotacion;
  const { desde, hasta } = cubo.opciones_catalogo[rotacion].secuencia[0].siembra;
  const dentro = (mmdd) => (desde <= hasta ? mmdd >= desde && mmdd <= hasta : mmdd >= desde || mmdd <= hasta);
  return Array.from({ length: 12 }, (_, i) => `${String(i + 1).padStart(2, "0")}-15`).find((m) => !dentro(m));
}

// ---------------------------------------------------------------- las hectáreas de la ficha
async function hectareasDeLaFicha(navegador, base) {
  const { ctx, page, errores } = await nuevaPagina(navegador, ESCRITORIO);
  await page.goto(`${base}/explorer.html#${PARCELA}`, { waitUntil: "load" });
  await page.waitForSelector("body[data-listo='si']", { timeout: ESPERA_MS });
  await page.waitForSelector('.tarjeta[data-opcion="ACTUAL"] .alcanza', { timeout: ESPERA_MS });
  const porDotacion = new Map();
  for (const D of MARCAS) {
    await fijarDotacion(page, "#dotacion", D);
    await page.waitForFunction((v) => Number(document.querySelector("#dotacion").value) === v, D);
    porDotacion.set(D, await leerFicha(page));
  }
  check("ficha (explorer.html): sin errores de página", errores.length === 0, errores.join(" | "));
  await ctx.close();
  return porDotacion;
}
/** Compara una tarjeta del plan con lo que escribe la ficha para la misma opción. */
function mismasHectareas(tarjeta, ficha) {
  const numeros = ficha.texto.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
  if (ficha.tipo === "toda") return tarjeta.ha === tarjeta.area && numeros[0] === tarjeta.area;
  if (ficha.tipo === "parte") {
    const [ha, area, bajo, alto] = numeros;
    return tarjeta.ha === ha && tarjeta.area === area && tarjeta.bajo === bajo && tarjeta.alto === alto;
  }
  return false;
}

// ---------------------------------------------------------------- un idioma, de principio a fin
async function probarIdioma(navegador, base, idioma, ficha) {
  const T = TEXTOS_ASESOR[idioma];
  const e = `[${idioma}] `;
  const { ctx, page, errores } = await nuevaPagina(navegador, TELEFONO);
  await abrirTablero(page, base, idioma);
  check(`${e}<html lang> es el idioma de la liga`, (await page.evaluate(() => document.documentElement.lang)) === idioma);

  // --- mismas hectáreas que la ficha, con cada dotación de referencia
  const numero = (texto) => new Intl.NumberFormat(REGION[idioma], { minimumFractionDigits: (texto.split(".")[1] ?? "").length }).format(Number(texto.replaceAll(",", "")));
  for (const D of MARCAS) {
    await fijarDotacion(page, "#allocation", D);
    const plan = await leerPlan(page);
    const deLaFicha = ficha.get(D);
    check(`${e}D=${D}: el plan trae las opciones de la ficha, en su orden`, plan.map((x) => x.id).join() === deLaFicha.map((x) => x.id).join(), `${plan.map((x) => x.id)} · ${deLaFicha.map((x) => x.id)}`);
    for (const x of plan) {
      const f = deLaFicha.find((y) => y.id === x.id);
      check(`${e}D=${D} ${x.id}: mismas hectáreas que la ficha`, Boolean(f) && mismasHectareas(x, f), `plan ${x.ha} de ${x.area} (${x.bajo} a ${x.alto}) · ficha «${f?.texto}»`);
      if (f?.tipo === "parte")
        check(`${e}D=${D} ${x.id}: el texto lleva esas hectáreas con el formato del idioma`, x.cobertura.includes(numero(x.ha)) && x.cobertura.includes(numero(x.area)), x.cobertura);
    }
    check(`${e}D=${D}: aviso de juicio a la vista en cada tarjeta`, plan.length > 0 && plan.every((x) => x.aviso === T["asesor.aviso_juicio"] && x.avisoVisible), plan.map((x) => x.aviso).join(" | "));
  }
  await fijarDotacion(page, "#allocation", MARCAS[1] ?? MARCAS[0]);

  // --- textos del idioma, sin claves, sin roturas, sin palabras vetadas
  const rotulos = ["restriccion", "revisar", "calculado", "sin_datos"].map((k) => T[`asesor.estado.${k}`]);
  const plan = await leerPlan(page);
  check(`${e}rótulos de las tarjetas en el idioma`, plan.every((x) => rotulos.includes(x.rotulo)), plan.map((x) => x.rotulo).join(" | "));
  check(`${e}formulario en el idioma`, (await page.locator("#decision-form h3").textContent()) === T["asesor.form.titulo"] && (await page.locator('#decision-form button[type="submit"]').textContent()) === T["asesor.form.calcular"]);
  check(`${e}pasos del formulario en el idioma`, (await page.locator("#tab-parcela span").textContent()) === T["asesor.paso.parcela"] && (await page.locator("#tab-suelo span").textContent()) === T["asesor.paso.suelo"]);

  // --- restricción: descrita, con su fuente
  const mmdd = fechaFueraDeVentana(PARCELA);
  await page.locator("#rec-date").fill(`2027-${mmdd}`);
  await page.waitForSelector('#recommendations [data-plan-option="ACTUAL"][data-state="restriccion"]', { timeout: ESPERA_MS });
  const restriccion = (await page.locator('#recommendations [data-plan-option="ACTUAL"] .blocking-reasons li').first().textContent()) ?? "";
  const [antes, despues] = T["asesor.restriccion.frase"].split("{texto}");
  check(`${e}restricción descrita, con su cierre y su fuente`, restriccion.startsWith(antes) && restriccion.includes(despues.trim()) && restriccion.includes(T["asesor.fuente"]), restriccion);
  check(`${e}la restricción no cambia las hectáreas`, (await leerPlan(page)).find((x) => x.id === "ACTUAL").ha === plan.find((x) => x.id === "ACTUAL").ha);
  if (idioma === "en") console.log(`\n  Restricción (en): ${restriccion}\n`);
  const conRestriccion = await textoDe(page, MIOS);
  await page.locator("#rec-date").fill("");
  await page.waitForSelector('#recommendations [data-plan-option="ACTUAL"]:not([data-state="restriccion"])', { timeout: ESPERA_MS });

  // --- comprobaciones del botón
  await page.locator("#run-checks").click();
  const comprobaciones = await page.locator("#decision-checks li").allTextContents();
  check(`${e}comprobaciones del botón: todas pasan`, comprobaciones.length >= 5 && comprobaciones.every((c) => c.startsWith("✓")), comprobaciones.join(" | "));

  // --- teléfono: nada se sale y los controles miden 44 px
  check(`${e}teléfono, plan: sin desplazamiento horizontal`, await sinDesplazamiento(page));
  for (const paso of ["parcela", "agua", "suelo"]) {
    await page.locator(`#tab-${paso}`).click();
    const bajos = await controlesBajos(page, CONTROLES);
    check(`${e}teléfono, paso «${paso}»: controles de al menos ${ALTO_MINIMO} px`, bajos.length === 0, JSON.stringify(bajos));
  }
  await page.locator("#tab-parcela").click();
  if (idioma === "en") console.log(`\n  Tarjeta (en):\n${(await page.locator('#recommendations [data-plan-option="ACTUAL"]').innerText()).replace(/^/gm, "    ")}\n`);
  await page.screenshot({ path: path.join(CAPTURAS, `plan-${idioma}-telefono.png`), fullPage: true });

  // --- lluvia histórica
  await irA(page, "predicciones");
  const lluvia = await textoDe(page, ["#forecast-analysis"]);
  const anioFuturo = String(pronostico.zonas[ZONA].pronostico_lluvia.anio);
  check(`${e}lluvia: título del rango histórico en el idioma`, (await page.locator("#forecast-analysis h2").textContent()) === T["asesor.lluvia.titulo"]);
  check(`${e}lluvia: no menciona el año futuro (${anioFuturo})`, !lluvia.includes(anioFuturo));
  check(`${e}lluvia: conserva la frase que niega que se pronostique la presa`, lluvia.includes(T["asesor.lluvia.intro"]));
  check(`${e}teléfono, lluvia: sin desplazamiento horizontal`, await sinDesplazamiento(page));
  const bajosLluvia = await controlesBajos(page, CONTROLES);
  check(`${e}teléfono, lluvia: controles de al menos ${ALTO_MINIMO} px`, bajosLluvia.length === 0, JSON.stringify(bajosLluvia));
  await page.screenshot({ path: path.join(CAPTURAS, `lluvia-${idioma}-telefono.png`), fullPage: true });
  await irA(page, "recomendaciones");

  const todo = `${await textoDe(page, MIOS)}\n${conRestriccion}\n${lluvia}`;
  check(`${e}ninguna clave de texto a la vista`, !/asesor\.[a-z_]+/.test(todo), todo.match(/asesor\.[a-z_.]+/)?.[0]);
  check(`${e}sin NaN, undefined, null ni Infinity`, !/\b(NaN|undefined|null|Infinity)\b/.test(todo), todo.match(/.{0,30}\b(NaN|undefined|null|Infinity)\b.{0,30}/s)?.[0]);
  check(`${e}sin marcadores sin llenar`, !/\{\w+\}/.test(todo), todo.match(/\{\w+\}/)?.[0]);
  for (const codigo of new Set(["en", idioma]))
    check(`${e}ninguna palabra vetada (${codigo})`, !VETADAS[codigo].test(todo), todo.match(new RegExp(`.{0,40}${VETADAS[codigo].source}.{0,40}`, "isu"))?.[0]);
  check(`${e}sin las frases retiradas (órdenes y «predicción»)`, !FRASES_RETIRADAS.test(todo), todo.match(FRASES_RETIRADAS)?.[0]);
  if (idioma === "en") {
    // En inglés, lo que escribe la herramienta no lleva letras propias del español (las fuentes citadas sí pueden).
    const propio = await page.evaluate(() =>
      [...document.querySelectorAll("#decision-form label, #decision-form button, #decision-form p, #decision-form h3, #decision-summary > p, #recommendations dt, #recommendations summary, #recommendations .pill, #recommendations [data-plan-coverage], #recommendations .aviso-juicio, #forecast-analysis h2, #forecast-analysis h3, #forecast-analysis th, #forecast-analysis button, #forecast-analysis summary")]
        .map((el) => el.textContent)
        .join("\n"),
    );
    check(`${e}textos de la herramienta en inglés`, !/[áéíóúñ¿¡]/i.test(propio), propio.match(/.{0,30}[áéíóúñ¿¡].{0,30}/i)?.[0]);
  }

  // --- parcela sin clasificar: sin plan, con el motivo
  const sinClasificar = geo.features.find((f) => f.properties.zona === ZONA && f.properties.abstencion).properties.id;
  await elegirParcela(page, sinClasificar);
  check(`${e}parcela sin clasificar (${sinClasificar}): sin tarjetas`, (await leerPlan(page)).length === 0);
  check(`${e}parcela sin clasificar: dice el motivo`, ((await page.locator("#decision-summary").textContent()) ?? "").trim() === T["asesor.plan.sin_clasificar"]);
  await page.locator("#run-checks").click();
  check(`${e}parcela sin clasificar: el botón de comprobaciones no falla`, (await page.locator("#decision-checks li").count()) === 1);

  // --- parcela en descanso: las opciones del cubo
  const descanso = geo.features.find((f) => f.properties.zona === ZONA && !f.properties.abstencion && f.properties.cultivo_actual === "barbecho").properties.id;
  await elegirParcela(page, descanso);
  const planDescanso = await leerPlan(page);
  check(`${e}parcela en descanso (${descanso}): salen las opciones del cubo`, planDescanso.map((x) => x.id).join() === cubo.parcelas[descanso].opciones.map((o) => o.id).join() && planDescanso.length > 1, planDescanso.map((x) => x.id).join());
  check(`${e}parcela en descanso: aviso en cada tarjeta`, planDescanso.every((x) => x.aviso === T["asesor.aviso_juicio"]));

  check(`${e}sin errores de página`, errores.length === 0, errores.join(" | "));
  await ctx.close();
}

// ---------------------------------------------------------------- cambio de idioma con la página abierta, y escritorio
async function probarCambioDeIdioma(navegador, base, ficha) {
  const { ctx, page, errores } = await nuevaPagina(navegador, ESCRITORIO);
  await abrirTablero(page, base, "en");
  await page.locator("#tab-suelo").click();
  await page.locator("#rec-ph").fill("7");
  check("escritorio: sin desplazamiento horizontal", await sinDesplazamiento(page));
  // Volumen total capturado: equivale a su dotación y da las hectáreas que la ficha escribe para esa dotación.
  const D = MARCAS.at(-1);
  const volumen = D * propiedades(PARCELA).area_ha * pronostico.metodo.m3_por_millar;
  await page.locator("#tab-agua").click();
  await page.locator("#rec-volume").fill(String(volumen));
  const conVolumen = (await leerPlan(page)).find((x) => x.id === "ACTUAL");
  const fichaD = ficha.get(D).find((x) => x.id === "ACTUAL");
  const haFicha = fichaD.tipo === "toda" ? Number(conVolumen.area) : Number((fichaD.texto.match(/\d[\d,]*(?:\.\d+)?/) ?? [])[0]?.replaceAll(",", ""));
  check(`escritorio: un volumen de ${volumen} m³ da las hectáreas de la ficha con D=${D}`, Math.abs(Number(conVolumen.ha.replaceAll(",", "")) - haFicha) <= 0.011, `plan ${conVolumen.ha} · ficha «${fichaD.texto}»`);
  await page.locator("#rec-volume").fill("");
  // Lo que la persona despliega en una tarjeta sigue abierto cuando el deslizador vuelve a dibujar el plan.
  await page.locator('#recommendations [data-plan-option="ACTUAL"] details[data-parte="calculo"] summary').click();
  await fijarDotacion(page, "#allocation", MARCAS[0]);
  check("escritorio: un desplegable abierto sigue abierto al mover la dotación", await page.locator('#recommendations [data-plan-option="ACTUAL"] details[data-parte="calculo"]').evaluate((d) => d.open));
  await fijarDotacion(page, "#allocation", MARCAS[1] ?? MARCAS[0]);
  await page.locator("#tab-suelo").click();
  const antes = await leerPlan(page);
  for (const idioma of ["es", "pt", "fr", "en"]) {
    await page.evaluate(async (codigo) => {
      const m = await import("./js/i18n.js");
      m.fijarIdioma(codigo);
    }, idioma);
    const T = TEXTOS_ASESOR[idioma];
    const plan = await leerPlan(page);
    check(`cambio a ${idioma}: el asesor se vuelve a dibujar`, plan.length > 0 && plan.every((x) => x.aviso === T["asesor.aviso_juicio"]) && (await page.locator("#decision-form h3").textContent()) === T["asesor.form.titulo"] && (await page.locator("#forecast-analysis h2").textContent()) === T["asesor.lluvia.titulo"]);
    check(`cambio a ${idioma}: conserva lo capturado y el paso`, (await page.locator("#rec-ph").inputValue()) === "7" && (await page.locator("#step-suelo").isVisible()));
    check(`cambio a ${idioma}: las hectáreas no cambian`, plan.map((x) => `${x.id}:${x.ha}/${x.area}`).join() === antes.map((x) => `${x.id}:${x.ha}/${x.area}`).join());
  }
  await page.screenshot({ path: path.join(CAPTURAS, "plan-en-escritorio.png"), fullPage: true });
  check("cambio de idioma: sin errores de página", errores.length === 0, errores.join(" | "));
  await ctx.close();
}

// ---------------------------------------------------------------- datos hostiles: todo se escapa
async function probarDatosHostiles(navegador, base) {
  const { ctx, page, errores } = await nuevaPagina(navegador, TELEFONO);
  const MARCA = '<img src=x onerror="window.__xss=1"><b class="xss">';
  const ENLACE = "https://example.org/a?b=1&c=2";
  // Solo se tocan campos que dibuja el asesor (opciones y filtros de la parcela, y el archivo de lluvia).
  const cuboHostil = structuredClone(cubo);
  for (const o of cuboHostil.parcelas[PARCELA].opciones) {
    o.nombre = `${MARCA}${o.nombre}`;
    for (const f of o.filtros) {
      f.motivo = `${MARCA}${f.motivo}`;
      f.fuente = `${MARCA} javascript:alert(1) data:text/html,<script>window.__xss=1</script> ${ENLACE}. ${f.fuente}`;
      f.etiqueta = MARCA;
    }
  }
  const lluviaHostil = structuredClone(pronostico);
  const z = lluviaHostil.zonas[ZONA];
  z.fecha_corte = MARCA;
  z.fuente_clima = MARCA;
  z.validacion_lluvia.casos[0].anio = MARCA;
  z.validacion_lluvia.casos[0].entrenamiento_fin = MARCA;
  z.ciclos_excluidos = [{ anio: MARCA, dias_faltantes: z.ciclos_excluidos?.[0]?.dias_faltantes ?? null }];
  z.anios.at(-1).anio = MARCA;
  const servir = (objeto) => (route) => route.fulfill({ contentType: "application/json; charset=utf-8", body: JSON.stringify(objeto) });
  await page.route("**/data/cubo.json", servir(cuboHostil));
  await page.route("**/data/pronostico.json", servir(lluviaHostil));
  await abrirTablero(page, base, "en");
  const visto = await page.evaluate((mios) => {
    const cajas = mios.map((s) => document.querySelector(s)).filter(Boolean);
    for (const caja of cajas) for (const d of caja.querySelectorAll("details")) d.open = true;
    return {
      intrusos: cajas.reduce((n, caja) => n + caja.querySelectorAll("img, script, b.xss").length, 0),
      enlaces: cajas.flatMap((caja) => [...caja.querySelectorAll("a")].map((a) => a.getAttribute("href"))),
      texto: cajas.map((caja) => caja.textContent).join("\n"),
      xss: window.__xss ?? null,
    };
  }, MIOS);
  check("datos hostiles: nada entra al DOM como marcado", visto.intrusos === 0 && visto.xss === null, JSON.stringify({ intrusos: visto.intrusos, xss: visto.xss }));
  check("datos hostiles: el texto se muestra tal cual, escapado", visto.texto.includes("<img src=x") && visto.texto.includes("javascript:alert"));
  check("datos hostiles: los enlaces llevan http o https y ningún otro esquema", visto.enlaces.length > 0 && visto.enlaces.every((h) => /^https?:\/\//.test(h ?? "")), visto.enlaces.join(" | "));
  check("datos hostiles: la dirección https de una fuente queda como enlace", visto.enlaces.includes(ENLACE), visto.enlaces.slice(0, 3).join(" | "));
  check("datos hostiles: la página sigue en pie (plan y lluvia dibujados)", (await leerPlan(page)).length > 0 && (await page.locator("#forecast-analysis h2").count()) === 1);
  check("datos hostiles: sin errores de página", errores.length === 0, errores.join(" | "));
  await ctx.close();
}

async function main() {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  const srv = await servidor();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const navegador = await chromium.launch();
  try {
    const ficha = await hectareasDeLaFicha(navegador, base);
    for (const idioma of IDIOMAS) await probarIdioma(navegador, base, idioma, ficha);
    await probarCambioDeIdioma(navegador, base, ficha);
    await probarDatosHostiles(navegador, base);
  } finally {
    await navegador.close().catch(() => {});
    srv.closeAllConnections();
    await new Promise((ok) => srv.close(ok));
  }
  const fallas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallas.length} de ${resultados.length} comprobaciones pasan. Capturas: ${CAPTURAS}`);
  if (fallas.length) console.log(`FALLAN:\n${fallas.map((f) => `  - ${f.nombre}${f.detalle ? ` — ${f.detalle}` : ""}`).join("\n")}`);
  process.exitCode = fallas.length ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
