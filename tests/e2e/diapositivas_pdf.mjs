// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// tests/e2e/diapositivas_pdf.mjs — Capturas de la página real y PDF de las diapositivas de respaldo (kit C8).
//
// Uso:   node tests/e2e/diapositivas_pdf.mjs
//        RAIZ_URL=https://<liga pública>/   capturas de la página publicada en lugar del servidor local
//        RAIZ_LIGA_PAGINA, RAIZ_LIGA_REPO, RAIZ_LIGA_VIDEO   ligas de la diapositiva de cierre (si faltan: «link pending»)
//        RAIZ_PDF_PNG=<carpeta>   además, una imagen PNG por página del PDF (con pdftoppm, si está instalado)
// No forma parte de `node --test tests/` (necesita Chromium). Termina con 0 si todo pasa y 1 si algo falla.
//
// Qué hace (contenido: docs/pitch/diapositivas.md; portada según la guía de envío de Space Apps):
// 1. Levanta un servidor estático de web/ (patrón de web_smoke.mjs) o usa RAIZ_URL, y toma las capturas reales de la
//    página que usan las diapositivas: docs/pitch/capturas/*.png (deviceScaleFactor 2 para que se lean en el PDF;
//    movimiento reducido para que la imagen quede quieta).
// 2. Calcula cada cifra del texto de las diapositivas con web/data/*.json y web/reglas.js (las mismas reglas que la
//    página) y la compara con lo que la página muestra en la captura correspondiente.
// 3. Abre docs/pitch/diapositivas.html, comprueba que la plantilla no trae cifras escritas a mano (con las excepciones
//    de tests/excepciones_cifras.json), le inyecta las cifras y la lista de pruebas (web/data/pruebas.json), revisa que
//    no quede un hueco, ni «first»/«only»/«save…», ni texto que se salga de la diapositiva, y exporta
//    docs/pitch/diapositivas.pdf (1280 × 720 px por página, máximo 7 páginas).

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { aguaComprometida, evaluarOpcion } from "../../web/reglas.js";
import { LLAVE_INICIO } from "../../web/js/acerca.js";
import { formatoHectareas } from "../../web/js/resumen.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const WEB = path.join(RAIZ, "web");
const DATOS = path.join(WEB, "data");
const PITCH = path.join(RAIZ, "docs", "pitch");
const PLANTILLA = path.join(PITCH, "diapositivas.html");
const PDF = path.join(PITCH, "diapositivas.pdf");
const CAPTURAS = path.join(PITCH, "capturas");
const MAX_DIAPOSITIVAS = 7; // kit C8 y guía de envío: portada incluida

// Protagonistas (docs/pitch/diapositivas.md): las diapositivas 3, 4 y 7 usan la alfalfa por vencer, con «Normal year».
const ALFALFA = "P0757";
const MARCA_FICHA = "anio_normal";
const MARCA_PROBLEMA = "como_2025";

// ---------------------------------------------------------------- registro de resultados
const resultados = [];
function check(nombre, cond, detalle = "") {
  resultados.push({ nombre, ok: Boolean(cond), detalle });
  console.log(`${cond ? "PASA" : "FALLA"}  ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}

// ---------------------------------------------------------------- datos y formatos (los de web/app.js)
const leer = (nombre) => JSON.parse(fs.readFileSync(path.join(DATOS, nombre), "utf-8"));
const cubo = leer("cubo.json");
const parcelas = leer("parcelas.geojson");
const gemelo = leer("gemelo.json");
const pruebas = leer("pruebas.json");

const LOCALE = "en-US";
const MENOS = "−";
const conMenos = (s) => s.replace("-", MENOS);
// Un dato que falta nunca se escribe como 0 (CLAUDE.md, regla 2): Intl.NumberFormat.format(null) da «0».
const SIN_DATO = "—";
const esNumero = (v) => typeof v === "number" && Number.isFinite(v);
const fmt = (v, d = 1) => (esNumero(v) ? conMenos(new Intl.NumberFormat(LOCALE, { maximumFractionDigits: d }).format(v)) : SIN_DATO); // calculado
const fmtDato = (v) => fmt(v, 3); // leído de un archivo
const fmtPct = (f) => (esNumero(f) ? conMenos(new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0 }).format(f)) : SIN_DATO);
const fmtRango = (a, b, f = fmtDato) => (a === b ? f(a) : `${f(a)}–${f(b)}`);
const fmtM3 = (v) => `${fmt(v, 0)} m³`; // como la etiqueta de La gota
const PALABRAS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const enPalabra = (n) => PALABRAS[n] ?? fmt(n, 0);
const mayuscula = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// Estados de las pruebas: los mismos rótulos que web/js/acerca.js («About & Data»).
const ESTADOS = { passed: "Criterion met", failed: "Criterion not met", partial: "Partly run", "not run": "Not run", run: "Ran" };

/** Todas las cifras y textos que la plantilla espera ([data-cifra] y [data-texto]), leídos de los datos. */
function calcular() {
  const props = new Map(parcelas.features.map((f) => [f.properties.id, f.properties]));
  const marcas = Object.fromEntries(cubo.dotaciones.marcas.map((m) => [m.id, m]));
  const r = 0; // interruptor de lluvia apagado (lluvia de siempre), como la página al abrir
  const c = {};
  const t = {};

  // 2 · El problema: el año destacado de la línea de tiempo, la marca de ese año y el agua ya comprometida.
  const [anio, destacado] = Object.entries(gemelo.tiempo.destacados)[0];
  const mProb = marcas[MARCA_PROBLEMA];
  const zonaId = gemelo.zona_inicial;
  const zona = cubo.zonas[zonaId];
  const comp = aguaComprometida(zona, mProb.valor, r);
  c["s2.anio"] = anio;
  c["s2.dotacion"] = fmt(mProb.valor);
  c["s2.comprometida"] = fmtPct(comp.p50);
  c["s2.rango"] = `${fmtPct(comp.p10)}–${fmtPct(comp.p90)}`;
  t["s2.marca"] = mProb.nombre;
  // La nota en inglés repite el valor al principio («≈1 millar/ha, from wells…»): ese valor ya va en la línea.
  t["s2.marca_nota"] = (mProb.nota_en ?? "").replace(/^≈[^,;]*[,;]\s*/, "");
  t["s2.marca_etiqueta"] = mProb.etiqueta ?? "";
  t["s2.marca_fuente"] = mProb.fuente ?? "";
  t["s2.zona"] = zona.nombre_mostrar ?? zonaId;
  t["s2.destacado"] = destacado.texto;
  t["s2.destacado_fuente"] = destacado.fuente;
  t["s2.destacado_etiqueta"] = destacado.etiqueta ?? "";

  // 3 · El plazo: la opción actual de la alfalfa con la marca «Normal year».
  const p = props.get(ALFALFA);
  const actual = cubo.parcelas[ALFALFA].opciones.find((o) => o.id === "ACTUAL");
  const mFicha = marcas[MARCA_FICHA];
  const ev = evaluarOpcion(actual, p.area_ha, mFicha.valor, r, p.abstencion);
  t["s3.id"] = ALFALFA;
  t["s3.cultivo"] = actual.nombre.replace(/^Current rotation:\s*/, "");
  t["s3.marca"] = mFicha.nombre;
  c["s3.dotacion"] = fmt(mFicha.valor);
  c["s3.lamina"] = fmtDato(ev.lamina.p50);
  c["s3.plazo"] = fmtRango(actual.agua.plazo_anios.min, actual.agua.plazo_anios.max);
  // Las hectáreas se escriben como en la ficha (web/js/resumen.js): con los decimales del área, hacia abajo
  // y nunca más que el área. Así la diapositiva y la captura dicen lo mismo.
  c["s3.hectareas"] = formatoHectareas(p.area_ha)(ev.hectareas.p50);
  c["s3.area"] = fmtDato(p.area_ha);

  // 4 · La gota de la opción actual de la alfalfa.
  const gota = actual.gota ?? cubo.parcelas[ALFALFA].opciones.find((o) => o.gota)?.gota;
  t["s4.id"] = ALFALFA;
  c["s4.presa"] = fmtM3(gota.m3_salen_presa);
  c["s4.cultivo"] = fmtM3(gota.m3_consume_cultivo_et);
  c["s4.acuifero"] = fmtM3(gota.m3_regresan_acuifero);

  // 5 · El gemelo: zonas, parcelas, años de la memoria y la lluvia del escenario.
  const anios = gemelo.tiempo.anios;
  c["s5.zonas"] = enPalabra(Object.keys(cubo.zonas).length);
  c["s5.parcelas"] = fmt(cubo.zona.conteos.total, 0);
  c["s5.anios"] = `${Math.min(...anios)}–${Math.max(...anios)}`;
  c["s5.lluvia"] = `${conMenos(String(Math.min(...cubo.lluvia_pct)))}%`;

  // 6 · Pruebas a la vista.
  t["s6.cuantas"] = mayuscula(enPalabra(pruebas.pruebas.length));

  // 7 · Ligas (las pone el integrador cuando existan).
  const pendiente = "[link pending]";
  t["s7.pagina"] = process.env.RAIZ_LIGA_PAGINA || pendiente;
  t["s7.repo"] = process.env.RAIZ_LIGA_REPO || pendiente;
  t["s7.video"] = process.env.RAIZ_LIGA_VIDEO || pendiente;

  return { cifras: c, textos: t, comprobar: { comp, ev, gota, zonaId, anio, p, actual } };
}

/** Lista de la diapositiva 6, una tarjeta por prueba de pruebas.json (título, estado y su resultado en una línea). */
function htmlPruebas() {
  const linea = (prueba) => {
    const partes = [];
    if (prueba.resumen) partes.push(esc(prueba.resumen));
    const m = Object.fromEntries((prueba.metricas ?? []).map((x) => [x.id, x]));
    if (m.et_modelo_mm && m.et_ssebop_mm) {
      // Contraste regional de la ET: la diferencia relativa entre el modelo y SSEBop.
      const dif = m.et_modelo_mm.valor / m.et_ssebop_mm.valor - 1;
      const signo = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" });
      partes.push(`Modeled crop ET ${esc(conMenos(signo.format(dif)))} against SSEBop VIIRS (${esc(fmt(m.et_modelo_mm.valor))} vs ${esc(fmt(m.et_ssebop_mm.valor))} ${esc(m.et_modelo_mm.unidad ?? "")}), a regional comparison`);
    } else {
      // Las métricas que pide docs/pitch/diapositivas.md van primero (p. ej. «0 numbers altered»); después, las demás.
      const preferidas = ["abstenidas", "casos_correctos", "cifras_alteradas"];
      const conTotal = (prueba.metricas ?? []).filter((x) => x.total != null && x.valor != null && !x.zona);
      const orden = [...conTotal.filter((x) => preferidas.includes(x.id)), ...conTotal.filter((x) => !preferidas.includes(x.id))];
      for (const x of orden.slice(0, 2)) {
        partes.push(`${esc(x.etiqueta)}: <b>${esc(fmt(x.valor, 3))} of ${esc(fmt(x.total, 3))}</b>`);
      }
    }
    for (const comp of prueba.complementos ?? []) {
      // «H1-b does not hold.»: si el resumen ya nombra el complemento, no se repite el prefijo.
      const nombre = String(comp.titulo ?? "").split(":")[0].trim();
      if (comp.resumen) partes.push(comp.resumen.startsWith(nombre) ? esc(comp.resumen) : `${esc(nombre)}: ${esc(comp.resumen)}`);
    }
    const noCorrio = (prueba.partes ?? []).filter((x) => x.estado === "not run").map((x) => esc(x.nombre));
    return (
      `<div class="detalle">${partes.join(" · ")}</div>` +
      (noCorrio.length ? `<div class="no-corrio">Not run: ${noCorrio.join(" · ")}</div>` : "")
    );
  };
  return pruebas.pruebas
    .map(
      (prueba) =>
        `<li><div class="cabeza"><span>${esc(prueba.titulo)}</span>` +
        `<span class="insignia" data-estado="${esc(prueba.estado)}">${esc(ESTADOS[prueba.estado] ?? prueba.estado)}</span></div>${linea(prueba)}</li>`,
    )
    .join("");
}

// ---------------------------------------------------------------- servidor estático (patrón de web_smoke.mjs)
const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};
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

// ---------------------------------------------------------------- capturas de la página
// Sin movimiento reducido: con él la línea de tiempo muestra la nota «Reduced motion is on» y la captura no sería la
// página que ve la mayoría. Las animaciones se esperan (quieto, gotas terminadas) antes de cada captura.
async function abrir(navegador, url, opciones) {
  const ctx = await navegador.newContext({ serviceWorkers: "block", reducedMotion: "no-preference", deviceScaleFactor: 2, ...opciones });
  await ctx.addInitScript((llave) => {
    try {
      window.sessionStorage.setItem(llave, "cerrado"); // sin la pantalla de inicio
    } catch {
      // sin almacenamiento: la pantalla aparecería
    }
  }, LLAVE_INICIO);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector("body[data-listo='si']", { timeout: 30000 });
  await page.waitForFunction(() => ["listo", "sin-mapa"].includes(document.body.dataset.mapa), null, { timeout: 30000 });
  await quieto(page);
  return { ctx, page };
}
async function quieto(page) {
  const ok = await page.evaluate(() => window.raizDepuracion?.esperarMapa?.() ?? null).catch(() => null);
  if (ok == null) await page.waitForTimeout(1500);
  await page.waitForTimeout(300);
}
const marca = (page, id) => page.locator(`.boton-marca[data-marca="${id}"]`).click();
async function zona(page, valor) {
  const sel = page.locator("#zona-sel");
  if ((await sel.isVisible().catch(() => false)) && (await sel.inputValue()) !== valor) {
    await sel.selectOption(valor);
    await quieto(page);
  }
}
/** Lleva un elemento al borde superior de su contenedor con desplazamiento (bajo la cabecera fija, si la hay). */
const subir = (page, contenedor, objetivo, cabecera = null, margen = 8) =>
  page.evaluate(
    ({ contenedor, objetivo, cabecera, margen }) => {
      const c = document.querySelector(contenedor);
      const o = typeof objetivo === "string" ? document.querySelector(objetivo) : null;
      if (!c || !o) return false;
      const alto = cabecera ? c.querySelector(cabecera)?.getBoundingClientRect().height ?? 0 : 0;
      c.scrollTop += o.getBoundingClientRect().top - c.getBoundingClientRect().top - alto - margen;
      return true;
    },
    { contenedor, objetivo, cabecera, margen },
  );
async function activar3D(page) {
  const b = page.locator("#boton-gemelo");
  if (!(await b.count()) || (await b.getAttribute("aria-disabled")) === "true") return false;
  if ((await b.getAttribute("aria-pressed")) !== "true") await b.click();
  await page.waitForFunction(() => window.raizDepuracion?.gemelo3d?.()?.relieveCargado, null, { timeout: 60000 }).catch(() => {});
  await quieto(page);
  return true;
}
/** Caja de la zona del mapa y el panel (sin la cabecera ni los controles). */
async function cajaPrincipal(page) {
  const m = await page.locator("#mapa").boundingBox();
  const v = page.viewportSize();
  return { x: 0, y: m.y, width: v.width, height: v.height - m.y };
}
const ruta = (nombre) => path.join(CAPTURAS, nombre);

async function capturas(navegador, url, datos) {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  const { comp, ev, gota } = datos.comprobar;
  const { ctx, page } = await abrir(navegador, url, { viewport: { width: 1366, height: 768 } });
  try {
    // 1 · Portada: la vista 3D de la zona inicial (la mitad derecha del mapa, donde están las columnas).
    await zona(page, gemelo.zona_inicial);
    const hay3D = await activar3D(page);
    check("captura: vista 3D de la zona inicial activa", hay3D);
    const m = await page.locator("#mapa").boundingBox();
    await page.screenshot({ path: ruta("portada_gemelo3d.png"), clip: { x: m.x + m.width * 0.5, y: m.y, width: m.width * 0.5, height: m.height } });

    // 2 · El problema: línea de tiempo en el año destacado, marca de ese año, indicador.
    await subir(page, ".panel", "#bloque-tiempo", null, 0);
    await page.locator("#linea-tiempo .tiempo-rango").evaluate((el, v) => {
      el.value = String(v);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, Number(datos.cifras["s2.anio"]));
    await marca(page, MARCA_PROBLEMA);
    await quieto(page);
    await page.screenshot({ path: ruta("problema_anio_sin_presa.png"), clip: await cajaPrincipal(page) });
    const indicador = await page.locator("#indicador").innerText();
    check(`diapositiva 2: la página muestra «at least ${fmtPct(comp.p50)}» con «${datos.textos["s2.marca"]}»`, indicador.includes(fmtPct(comp.p50)) && indicador.includes(fmtPct(comp.p10)) && indicador.includes(fmtPct(comp.p90)), indicador.split("\n").slice(1, 4).join(" · "));
    const nota = await page.locator(`#linea-tiempo .tiempo-destacado[data-anio="${datos.cifras["s2.anio"]}"]`).innerText().catch(() => "");
    check("diapositiva 2: la nota del año destacado está en la página", nota.includes(datos.textos["s2.destacado"]));

    // 5 · El gemelo: vista 3D y la tarjeta «Twin status» (la línea de tiempo vuelve al año actual).
    await page.locator("#linea-tiempo .tiempo-rango").evaluate((el) => {
      el.value = el.max;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await marca(page, "como_2026");
    await subir(page, ".panel", "#estado-gemelo", null, 0);
    await quieto(page);
    // La tarjeta está en el panel (a la derecha): la captura toma el panel y la parte del mapa con las columnas.
    const principal = await cajaPrincipal(page);
    const desde = m.x + m.width * 0.42;
    await page.screenshot({ path: ruta("gemelo_estado.png"), clip: { ...principal, x: desde, width: principal.width - desde } });

    // 3 · La ficha de la alfalfa con «Normal year»: las tarjetas de opciones.
    await page.locator("#boton-gemelo").click();
    await zona(page, "");
    await marca(page, MARCA_FICHA);
    await page.locator("#buscar-parcela").fill("");
    await page.locator(`.boton-parcela[data-id="${ALFALFA}"]`).click();
    await page.waitForSelector("#ficha:not([hidden])");
    await page.waitForTimeout(400);
    await subir(page, "#ficha", "#t-opciones", ".ficha-cabeza");
    await page.waitForTimeout(200);
    await page.locator("#ficha").screenshot({ path: ruta("ficha_alfalfa_tarjetas.png") });
    const tarjeta = await page.locator('.tarjeta[data-opcion="ACTUAL"]').innerText();
    const alcanza = `Enough for ${datos.cifras["s3.hectareas"]} of ${datos.cifras["s3.area"]} hectares`;
    check(`diapositiva 3: la tarjeta actual dice «${alcanza}» y la lámina ${datos.cifras["s3.lamina"]}`, tarjeta.includes(alcanza) && tarjeta.includes(datos.cifras["s3.lamina"]) && tarjeta.includes(`Commits water for ${datos.cifras["s3.plazo"]}`), `${datos.cifras["s3.hectareas"]} ha`);

    // 4 · La gota de la misma ficha, completa (ventana más alta solo para esta captura).
    await page.setViewportSize({ width: 1366, height: 1180 });
    await page.waitForTimeout(400);
    await subir(page, "#ficha", "#seccion-gota", ".ficha-cabeza");
    // Las gotas recorren el diagrama una vez al verlo (~3 s): la captura espera a que terminen.
    await page.waitForFunction(() => {
      const svg = document.querySelector("#seccion-gota svg[data-gotas]");
      return !svg || ["terminadas", "omitidas", "interrumpidas"].includes(svg.dataset.gotas);
    }, null, { timeout: 10000 }).catch(() => console.log("AVISO  las gotas no terminaron a tiempo"));
    await page.waitForTimeout(300);
    await page.locator("#seccion-gota").screenshot({ path: ruta("ficha_alfalfa_gota.png") });
    const textoGota = await page.locator("#seccion-gota").innerText();
    check("diapositiva 4: La gota muestra los m³ de la presa, del cultivo y del acuífero", [gota.m3_salen_presa, gota.m3_consume_cultivo_et, gota.m3_regresan_acuifero].every((v) => textoGota.includes(fmt(v, 0))), `${datos.cifras["s4.presa"]} · ${datos.cifras["s4.cultivo"]} · ${datos.cifras["s4.acuifero"]}`);
    await page.locator("#ficha-cerrar").click();

    // 6 · «About & Data» → «Tests in sight».
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.locator("#boton-acerca").click();
    const h3 = page.locator("#acerca h3", { hasText: "Tests in sight" });
    await h3.waitFor({ timeout: 15000 });
    const id = await h3.getAttribute("id");
    await subir(page, "#acerca", `[id="${id}"]`, ".dialogo-acerca-cabeza", 6);
    await page.waitForTimeout(300);
    await page.locator("#acerca").screenshot({ path: ruta("pruebas.png") });
    const n = await page.locator("#acerca .acerca-pruebas > li").count();
    check(`diapositiva 6: «Tests in sight» muestra ${pruebas.pruebas.length} pruebas, como pruebas.json`, n === pruebas.pruebas.length, `${n} en la página`);
  } finally {
    await ctx.close();
  }

  // 7 · Teléfono: la maqueta del mensaje de WhatsApp de la alfalfa, con «Normal year».
  const tel = await abrir(navegador, url, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    const { page: t } = tel;
    await marca(t, MARCA_FICHA);
    await t.locator("#buscar-parcela").fill(ALFALFA);
    await t.locator(`.boton-parcela[data-id="${ALFALFA}"]`).click();
    await t.waitForSelector("#ficha:not([hidden])");
    await t.locator("#boton-whatsapp").click();
    const maqueta = t.locator("#vista-whatsapp .wa-maqueta");
    await maqueta.waitFor({ timeout: 10000 });
    // El mensaje abre en el idioma del teléfono (cuatro idiomas desde el 14-nov). La diapositiva enseña el que recibe
    // el agricultor del distrito, en español: se elige en el selector «Message language» antes de la captura.
    const idioma = t.locator("#vista-whatsapp select.wa-idioma-select");
    if (await idioma.count()) {
      await idioma.selectOption("es");
      await maqueta.waitFor({ timeout: 10000 });
    }
    // En el teléfono la ficha es una hoja fija con su propio desplazamiento: se sube la maqueta al borde de la hoja y se
    // fotografía la hoja tal como se ve (la captura de un elemento más alto que la ventana saldría de la página de abajo).
    await subir(t, "#ficha", "#vista-whatsapp .wa-maqueta", ".ficha-cabeza", 6);
    await t.waitForTimeout(300);
    const hoja = await t.locator("#ficha").boundingBox();
    const v = t.viewportSize();
    const y = Math.max(0, hoja.y);
    await t.screenshot({ path: ruta("telefono_whatsapp.png"), clip: { x: 0, y, width: v.width, height: Math.min(v.height, hoja.y + hoja.height) - y } });
    const wa = await maqueta.innerText();
    check("diapositiva 7: el mensaje de WhatsApp está en español y nombra la parcela", wa.includes(ALFALFA) && /Responda/.test(wa));
  } finally {
    await tel.ctx.close();
  }
}

// ---------------------------------------------------------------- PDF
/** Excepciones de tests/excepciones_cifras.json para los archivos que no son .js (expresiones de Python → JS). */
function excepciones() {
  const lista = JSON.parse(fs.readFileSync(path.join(RAIZ, "tests", "excepciones_cifras.json"), "utf-8")).excepciones;
  return lista
    .filter((e) => !e.archivos || e.archivos.some((a) => a === "*" || a.endsWith(".html")))
    .map((e) => {
      if (e.texto) return { texto: e.texto };
      const i = e.patron.startsWith("(?i)");
      return { patron: new RegExp(i ? e.patron.slice(4) : e.patron, i ? "gi" : "g") };
    });
}
function sinExcepciones(texto) {
  let s = texto;
  for (const e of excepciones()) s = e.texto ? s.split(e.texto).join(" ") : s.replace(e.patron, " ");
  return s;
}

async function pdf(navegador, datos) {
  const ctx = await navegador.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  try {
    await page.goto(pathToFileURL(PLANTILLA).href, { waitUntil: "load" });
    // La plantilla: texto visible y atributos alt sin cifras escritas a mano.
    const plantilla = await page.evaluate(() => [document.body.innerText, ...[...document.images].map((i) => i.alt)].join("\n"));
    const conCifras = sinExcepciones(plantilla).split("\n").filter((l) => /\d/.test(l));
    check("plantilla docs/pitch/diapositivas.html sin cifras escritas a mano", conCifras.length === 0, conCifras.slice(0, 3).join(" | "));

    const n = await page.locator(".diapositiva").count();
    check(`${n} diapositivas (máximo ${MAX_DIAPOSITIVAS}, portada incluida)`, n >= 1 && n <= MAX_DIAPOSITIVAS);

    const faltan = await page.evaluate(
      ({ cifras, textos, lista }) => {
        const sin = [];
        for (const [atr, valores] of [["data-cifra", cifras], ["data-texto", textos]]) {
          for (const el of document.querySelectorAll(`[${atr}]`)) {
            const k = el.getAttribute(atr);
            if (valores[k] == null || valores[k] === "") sin.push(k);
            else el.textContent = valores[k];
          }
        }
        document.getElementById("lista-pruebas").innerHTML = lista;
        return sin;
      },
      { ...datos, lista: htmlPruebas() },
    );
    check("cada hueco de la plantilla recibió su cifra o su texto de los datos", faltan.length === 0, faltan.join(", "));
    await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, { timeout: 15000 });
    const rotas = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.getAttribute("src")));
    check("las capturas de docs/pitch/capturas/ cargan", rotas.length === 0, rotas.join(", "));

    const final = await page.evaluate(() => document.body.innerText);
    check("sin «undefined», «NaN» ni «null» en las diapositivas", !/\b(undefined|NaN|null)\b/.test(final));
    check("sin «first», «only» ni «save…» (CLAUDE.md, regla 10)", !/\b(first|only|sav(e|es|ed|ing|ings))\b/i.test(final));
    check("sin logotipos: ninguna imagen fuera de docs/pitch/capturas/", await page.evaluate(() => [...document.images].every((i) => i.getAttribute("src").startsWith("capturas/"))));
    // Lo que se sale: el borde inferior del último renglón de cada bloque de texto pasa la línea del pie.
    const desbordes = await page.evaluate(() =>
      [...document.querySelectorAll(".diapositiva")].flatMap((d, i) => {
        const pie = d.querySelector(".pie")?.getBoundingClientRect().top ?? d.getBoundingClientRect().bottom;
        return [...d.querySelectorAll(".texto, .fila-datos, .pruebas, header, figcaption")]
          .filter((el) => {
            // Un contenedor (p. ej. la columna de la portada, de alto completo) se mide por sus hijos; un texto, por sí mismo.
            const hijos = el.tagName === "FIGCAPTION" ? [] : [...el.children];
            const fondo = hijos.length ? Math.max(...hijos.map((c) => c.getBoundingClientRect().bottom)) : el.getBoundingClientRect().bottom;
            return fondo > pie + 1;
          })
          .map((el) => `diapositiva ${i + 1}: ${el.className || el.tagName}`);
      }),
    );
    check("ningún texto se sale de su diapositiva ni tapa el pie", desbordes.length === 0, desbordes.join(", "));

    await page.pdf({ path: PDF, width: "1280px", height: "720px", printBackground: true, preferCSSPageSize: true });
    const paginas = (fs.readFileSync(PDF, "latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
    check(`PDF de ${paginas} páginas, una por diapositiva`, paginas === n, PDF);
  } finally {
    await ctx.close();
  }
}

function pngPorPagina() {
  const carpeta = process.env.RAIZ_PDF_PNG;
  if (!carpeta) return;
  try {
    fs.mkdirSync(carpeta, { recursive: true });
    // pdftoppm avisa de las cajas de las letras Type 3 que escribe Chromium; son avisos, no errores: se callan.
    execFileSync("pdftoppm", ["-png", "-r", "72", PDF, path.join(carpeta, "diapositiva")], { stdio: "ignore" });
    console.log(`Páginas en PNG: ${carpeta}`);
  } catch (err) {
    console.log(`AVISO  no se pudo convertir el PDF a PNG (pdftoppm): ${err.message}`);
  }
}

// ---------------------------------------------------------------- principal
async function main() {
  const datos = calcular();
  const srv = process.env.RAIZ_URL ? null : await servidor();
  const url = process.env.RAIZ_URL ?? `http://127.0.0.1:${srv.address().port}/index.html`;
  console.log(`Página: ${url}`);
  // El navegador se lanza dentro del try: si falla el arranque, el finally cierra el servidor.
  let navegador = null;
  try {
    navegador = await chromium.launch();
    await capturas(navegador, url, datos);
    await pdf(navegador, datos);
  } finally {
    await navegador?.close();
    srv?.close();
  }
  pngPorPagina();
  console.log(`\nCapturas: ${CAPTURAS}\nPDF: ${PDF}`);
  const malas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - malas.length}/${resultados.length} comprobaciones pasan.`);
  process.exitCode = malas.length ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
