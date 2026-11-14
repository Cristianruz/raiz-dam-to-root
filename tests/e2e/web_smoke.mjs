// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// tests/e2e/web_smoke.mjs — Prueba de humo de la web (C1 + C2) con Playwright.
//
// Uso:   node tests/e2e/web_smoke.mjs
// No forma parte de `node --test tests/` (necesita Chromium). Termina con código 0 si todo pasa y 1 si algo falla.
//
// Qué hace:
// - levanta un servidor estático local de web/ (http.createServer, sin dependencias);
// - abre la página en escritorio y en un viewport de teléfono;
// - simula «sin red» para las teselas de OSM (las aborta): el mapa debe seguir con fondo sólido;
// - verifica: sin errores de consola (salvo esas fallas de red), indicador que cambia con el deslizador y la lluvia,
//   las marcas mueven el deslizador, dotación 0 => mensaje «sin dotación», la ficha abre en las parcelas protagonistas
//   y su «enough for» cambia con el deslizador, la leyenda de la memoria muestra los seis estados;
// - guarda capturas en tests/e2e/capturas/.
// Los valores esperados se leen de web/data/ (nada escrito a mano).

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const WEB = path.join(RAIZ, "web");
const CAPTURAS = path.join(AQUI, "capturas");

// Hosts externos opcionales: sus fallas de red no cuentan como error (teselas; tipografía si algún día se carga de la red).
const HOSTS_OPCIONALES = ["tile.openstreetmap.org", "fonts.googleapis.com", "fonts.gstatic.com"];
const esOpcional = (url = "") => HOSTS_OPCIONALES.some((h) => url.includes(h));

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

const leerJSON = (rel) => JSON.parse(fs.readFileSync(path.join(WEB, rel), "utf-8"));
const cubo = leerJSON("data/cubo.json");
const parcelas = leerJSON("data/parcelas.geojson");

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

// ---------------------------------------------------------------- utilidades de página
async function abrir(navegador, base, opciones, etiqueta, cuboAlterado = null) {
  const ctx = await navegador.newContext(opciones);
  const page = await ctx.newPage();
  // Variante del cubo solo para esta página (casos que los datos simulados no producen).
  if (cuboAlterado) {
    await page.route("**/data/cubo.json", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(cuboAlterado) }),
    );
  }
  const errores = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const url = m.location()?.url ?? "";
    if (esOpcional(url) || esOpcional(m.text())) return;
    errores.push(m.text());
  });
  page.on("pageerror", (e) => errores.push(`pageerror: ${e.message}`));
  page.on("requestfailed", (r) => {
    if (!esOpcional(r.url())) errores.push(`requestfailed: ${r.url()}`);
  });
  // Sin red para las teselas (como en esta máquina): se abortan de inmediato.
  await page.route((url) => esOpcional(url.href), (route) => route.abort());
  await page.goto(`${base}/index.html`, { waitUntil: "load" });
  await page.waitForSelector("body[data-listo='si']", { timeout: 15000 });
  await page.waitForFunction(() => document.body.dataset.mapa === "listo" || document.body.dataset.mapa === "sin-mapa", null, { timeout: 20000 });
  console.log(`\n[${etiqueta}] mapa: ${await page.evaluate(() => document.body.dataset.mapa)}`);
  return { ctx, page, errores };
}

async function fijarDeslizador(page, valor) {
  await page.evaluate((v) => {
    const s = document.querySelector("#dotacion");
    s.value = String(v);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  }, valor);
}
const texto = (page, sel) => page.locator(sel).innerText();
// Espera a que terminen las animaciones CSS (p. ej. la entrada de la ficha) antes de una captura.
const esperarAnimaciones = (page) =>
  page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"), null, { timeout: 5000 });
const indicador = (page) => page.evaluate(() => document.querySelector("#indicador").innerText);

// ---------------------------------------------------------------- pruebas
async function pruebasEscritorio(page) {
  const { deslizador, marcas } = cubo.dotaciones;
  const protagonistas = parcelas.features.filter((f) => f.properties.protagonista).map((f) => f.properties.id);

  // Aviso de datos simulados
  const visibleMock = await page.locator("#aviso-simulado").isVisible();
  check("aviso SIMULATED DATA visible cuando meta.mock = true", visibleMock === Boolean(cubo.meta?.mock));

  // Atributos del deslizador desde el cubo
  const attrs = await page.evaluate(() => {
    const s = document.querySelector("#dotacion");
    return { min: Number(s.min), max: Number(s.max), step: Number(s.step) };
  });
  check(
    "deslizador con min/max/paso de cubo.dotaciones.deslizador",
    attrs.min === deslizador.min && attrs.max === deslizador.max && attrs.step === deslizador.paso,
    JSON.stringify(attrs),
  );

  // Tres marcas: llevan el deslizador a su valor y muestran la fuente
  const nBotones = await page.locator(".boton-marca").count();
  check("una marca por elemento de dotaciones.marcas", nBotones === marcas.length, `${nBotones} botones`);
  for (const m of marcas) {
    await page.locator(`.boton-marca[data-marca="${m.id}"]`).click();
    const v = Number(await page.locator("#dotacion").inputValue());
    const info = await page.locator("#info-marca").textContent();
    const pulsado = await page.locator(`.boton-marca[data-marca="${m.id}"]`).getAttribute("aria-pressed");
    check(`marca ${m.id} lleva el deslizador a ${m.valor} y muestra fuente`, v === m.valor && info.includes(m.fuente) && pulsado === "true", `valor ${v}`);
  }

  // El indicador cambia al mover el deslizador (con el teclado)
  await page.locator(`.boton-marca[data-marca="${marcas[0].id}"]`).click();
  const ind1 = await indicador(page);
  await page.locator("#dotacion").focus();
  await page.keyboard.press("ArrowRight");
  const vTeclado = Number(await page.locator("#dotacion").inputValue());
  const ind2 = await indicador(page);
  check("deslizador operable con teclado (ArrowRight sube un paso)", vTeclado === marcas[0].valor + deslizador.paso, `valor ${vTeclado}`);
  check("el indicador cambia al mover el deslizador", ind1 !== ind2);

  // Lluvia −20 cambia el indicador
  const antesLluvia = await indicador(page);
  await page.locator("#lluvia").check();
  const conLluvia = await indicador(page);
  check("el indicador cambia al activar lluvia −20", antesLluvia !== conLluvia);
  const etiquetaLluvia = await texto(page, "#lluvia-etiqueta");
  const seca = cubo.lluvia_pct.find((x) => x !== 0);
  check("la etiqueta de lluvia sale de cubo.lluvia_pct", etiquetaLluvia.includes(String(Math.abs(seca))), etiquetaLluvia);
  await page.locator("#lluvia").uncheck();

  // Dotación 0 => mensaje «sin dotación» (con la tecla Home: mínimo del deslizador)
  await page.locator("#dotacion").focus();
  await page.keyboard.press("Home");
  const msg0 = await indicador(page);
  check(
    "dotación mínima (0) muestra el mensaje de sin dotación",
    deslizador.min === 0 ? msg0.includes("No dam allocation: perennial crops depend on wells or go unmet") : true,
    msg0.split("\n")[1] ?? "",
  );

  // Por encima de 100 %: mensaje y enlace a La gota (si el cubo lo produce en alguna marca)
  const total = cubo.zona.superficie_total_ha;
  const marcaExcede = marcas.find((m) => cubo.zona.demanda_perenne_millares["0"].p50 / (m.valor * total) > 1);
  if (marcaExcede) {
    await page.locator(`.boton-marca[data-marca="${marcaExcede.id}"]`).click();
    const ind = await indicador(page);
    check("indicador > 100 % muestra el mensaje y el enlace «Follow the drop»", ind.includes("ask for more than the allocation") && (await page.locator("#enlace-gota").isVisible()));
    await page.locator("#enlace-gota").click();
    await page.waitForSelector("#ficha:not([hidden])");
    check("el enlace abre la ficha en la sección «Follow the drop»", await page.locator("#seccion-gota").isVisible());
    await page.locator("#ficha-cerrar").click();
  }

  // Segunda cifra: X de Y parcelas
  const segunda = await texto(page, "#indicador-segunda");
  check("segunda cifra «… of … fields don't have enough water…»", /fields don't have enough water for their current rotation/.test(segunda), segunda);

  // Capas solo si están en capas_disponibles
  const capas = await page.locator("#capas input").evaluateAll((xs) => xs.map((x) => x.value));
  check("capas = distrito.capas_disponibles", JSON.stringify(capas) === JSON.stringify(cubo.distrito.capas_disponibles), capas.join(", "));

  // Cada capa disponible cambia la leyenda; «Field memory» toma el año del id de la capa
  for (const capa of cubo.distrito.capas_disponibles) {
    await page.locator(`#capas input[value="${capa}"]`).check();
    const ley = await texto(page, "#leyenda");
    const anio = capa.startsWith("memoria_") ? capa.split("_")[1] : null;
    check(`capa ${capa}: leyenda con su fuente${anio ? ` y el año ${anio}` : ""}`, ley.includes("Source:") && (!anio || ley.includes(`Field memory: ${anio}`)), ley.split("\n")[0]);
    if (anio) await page.screenshot({ path: path.join(CAPTURAS, "escritorio_capa_memoria.png") });
  }
  await page.locator('input[name="colorear"][value="semaforo"]').check();

  // Captura del centro de control
  await page.locator(`.boton-marca[data-marca="${marcas[1]?.id ?? marcas[0].id}"]`).click();
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_centro_control.png") });

  // Ficha en las protagonistas (con teclado desde la lista) y «enough for» que cambia con el deslizador
  for (const id of protagonistas) {
    await page.locator(`.boton-parcela[data-id="${id}"]`).focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector("#ficha:not([hidden])");
    const titulo = await texto(page, "#ficha-titulo");
    check(`ficha de ${id} abre con el teclado`, titulo.includes(id), titulo);
    const alcanza = page.locator('.tarjeta[data-opcion="ACTUAL"] .alcanza');
    const sem = page.locator('.tarjeta[data-opcion="ACTUAL"]');
    await fijarDeslizador(page, marcas[0].valor);
    const a1 = await alcanza.innerText();
    const s1 = await sem.getAttribute("data-semaforo");
    await fijarDeslizador(page, marcas[marcas.length - 1].valor);
    const a2 = await alcanza.innerText();
    const s2 = await sem.getAttribute("data-semaforo");
    check(`«enough for» de ${id} cambia con el deslizador`, a1 !== a2 && /Enough for/.test(a1), `${a1} → ${a2} (${s1} → ${s2})`);

    const estados = await page.locator(".leyenda-memoria li").evaluateAll((xs) => xs.map((x) => x.dataset.estado));
    check(`leyenda de la memoria de ${id} con los seis estados`, ["perenne", "verano", "invierno", "doble", "descanso", "sin_dato"].every((e) => estados.includes(e)), estados.join(","));
    const nota = await page.locator(".nota-fija").innerText();
    check(`nota fija de la memoria en ${id}`, nota.includes("Rule-based reading of monthly greenness; not a crop census."));
    const aviso = await page.locator("#ficha .aviso-juicio").innerText();
    check(`aviso de juicio local en ${id}`, aviso.includes("This tool supports, never replaces, the judgment of farmers and local experts."));
    const nPreguntas = await page.locator('.tarjeta[data-opcion="ACTUAL"] .porque dt').count();
    check(`botón Why? con las cinco respuestas en ${id}`, nPreguntas === 5);
    const sinMarcadores = await page.locator("#ficha").evaluate((el) => !/\{\{\w+\}\}/.test(el.innerText) && !/\{\{\w+\}\}/.test(el.textContent));
    check(`sin marcadores {{…}} sin rellenar en ${id}`, sinMarcadores);
    await page.keyboard.press("Escape");
    check(`Escape cierra la ficha de ${id}`, await page.locator("#ficha").isHidden());
  }

  // Advertencia «advertir_si_rojo»: visible solo cuando el semáforo de agua de esa opción queda en rojo
  const conAviso = Object.entries(cubo.parcelas).flatMap(([pid, p]) => p.opciones.filter((o) => o.advertir_si_rojo).map((o) => [pid, o]));
  for (const [pid, o] of conAviso) {
    await page.locator(`.boton-parcela[data-id="${pid}"]`).click();
    await page.waitForSelector("#ficha:not([hidden])");
    const tarjeta = page.locator(`.tarjeta[data-opcion="${o.id}"]`);
    for (const m of [marcas[0], marcas[marcas.length - 1]]) {
      await fijarDeslizador(page, m.valor);
      const sem = await tarjeta.getAttribute("data-semaforo");
      const visible = await tarjeta.locator(".advertencia").isVisible();
      check(`advertir_si_rojo en ${pid}/${o.id} con ${m.id}: aviso ${visible ? "visible" : "oculto"} y semáforo ${sem}`, visible === (sem === "rojo"));
    }
    await page.locator("#ficha-cerrar").click();
  }

  // Clic en el mapa abre la ficha
  const px = await page.evaluate((id) => window.raizDepuracion.pixelDeParcela(id), protagonistas[0]);
  if (px) {
    await page.mouse.click(px.x, px.y + 12);
    await page.waitForSelector("#ficha:not([hidden])", { timeout: 5000 }).catch(() => {});
    check("clic sobre una parcela del mapa abre su ficha", (await texto(page, "#ficha-titulo").catch(() => "")).includes(protagonistas[0]));
  } else {
    check("clic sobre una parcela del mapa abre su ficha", false, "mapa no disponible");
  }

  // La gota: botón de goteo y cifras
  await page.locator("#t-gota").scrollIntoViewIfNeeded();
  await page.locator("#gota-goteo").click();
  const cifras = await texto(page, "#gota-cifras");
  check("«What if this field switches to drip?» muestra Dam water y Back to aquifer", cifras.includes("Dam water") && cifras.includes("Back to aquifer"), cifras.replace(/\n/g, " "));
  await page.locator(".tarjeta[data-opcion='ACTUAL'] .porque summary").click();
  await page.locator("#ficha").evaluate((el) => { el.scrollTop = 0; });
  await esperarAnimaciones(page);
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_ficha.png") });
  await page.locator("#seccion-gota").scrollIntoViewIfNeeded();
  await esperarAnimaciones(page);
  await page.waitForTimeout(1000); // transición d3 de las barras (no es animación CSS)
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_ficha_gota.png") });
  await page.locator("#ficha-cerrar").click();
}

async function pruebasTelefono(page) {
  const protagonistas = parcelas.features.filter((f) => f.properties.protagonista).map((f) => f.properties.id);
  const sinDesborde = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check("teléfono: sin desplazamiento horizontal de la página", sinDesborde);
  const orden = await page.evaluate(() => {
    const mapa = document.querySelector("#mapa").getBoundingClientRect();
    const panel = document.querySelector(".panel").getBoundingClientRect();
    return panel.top >= mapa.bottom - 1;
  });
  check("teléfono: el panel lateral pasa debajo del mapa", orden);
  const altoControles = await page.evaluate(() => document.querySelector("#controles").offsetHeight / window.innerHeight);
  check("teléfono: los controles fijos ocupan menos del 40 % de la pantalla", altoControles < 0.4, `${Math.round(altoControles * 100)} %`);
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_centro_control.png") });
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_centro_control_completa.png"), fullPage: true });

  const id = protagonistas[1] ?? protagonistas[0];
  await page.locator(`.boton-parcela[data-id="${id}"]`).click();
  await page.waitForSelector("#ficha:not([hidden])");
  const ancho = await page.evaluate(() => {
    const f = document.querySelector("#ficha");
    return { cabe: f.scrollWidth <= f.clientWidth + 1, deslizadorVisible: document.querySelector("#dotacion").getBoundingClientRect().bottom <= f.getBoundingClientRect().top + 1 };
  });
  check("teléfono: la ficha se lee sin desplazamiento horizontal", ancho.cabe);
  check("teléfono: el deslizador queda visible con la ficha abierta", ancho.deslizadorVisible);
  const alcanza = page.locator('.tarjeta[data-opcion="ACTUAL"] .alcanza');
  const a1 = await alcanza.innerText();
  await fijarDeslizador(page, cubo.dotaciones.marcas[0].valor);
  const a2 = await alcanza.innerText();
  check("teléfono: «enough for» cambia con el deslizador", a1 !== a2, `${a1} → ${a2}`);
  await esperarAnimaciones(page);
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_ficha.png") });
  await page.locator('.tarjeta[data-opcion="ACTUAL"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_ficha_tarjeta.png") });
  await page.locator("#seccion-gota").scrollIntoViewIfNeeded();
  await page.locator("#gota-goteo").click();
  // Con movimiento reducido las barras quedan en su ancho final de inmediato: se comparan con el cubo.
  const op = cubo.parcelas[id].opciones.find((o) => o.id === "ACTUAL");
  const escala = Math.max(op.gota.m3_salen_presa, op.gota_goteo_con_tope.m3_salen_presa, op.gota_goteo_sin_tope.m3_salen_presa);
  const esperado = (op.gota_goteo_con_tope.m3_salen_presa / escala) * 100;
  const anchoBarra = await page.locator('.gota-barra[data-fila="0"]').evaluate((el) => parseFloat(el.style.width));
  check("teléfono (movimiento reducido): barra de La gota con goteo = salida de presa del cubo", Math.abs(anchoBarra - esperado) < 0.01, `${anchoBarra.toFixed(2)} % vs ${esperado.toFixed(2)} %`);
  const leyenda = await page.locator("#gota-leyenda").innerText();
  const fmtM3 = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
  check("teléfono: la leyenda de La gota muestra los m³ del cubo (goteo con tope)", leyenda.includes(fmtM3(op.gota_goteo_con_tope.m3_consume_cultivo_et)) && leyenda.includes(fmtM3(op.gota_goteo_con_tope.m3_regresan_acuifero)));
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_ficha_gota.png") });
}

function htmlSinCifras() {
  // Texto visible de index.html (sin comentarios, scripts ni etiquetas): no debe llevar dígitos.
  let s = fs.readFileSync(path.join(WEB, "index.html"), "utf-8");
  s = s.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style)\b[\s\S]*?<\/\1>/g, "");
  const visibles = [...s.matchAll(/\s(?:aria-label|title|alt|placeholder)="([^"]*)"/g)].map((m) => m[1]);
  const textoVisible = s.replace(/<[^>]+>/g, " ");
  const malos = [...(textoVisible.match(/.{0,15}\d.{0,15}/g) ?? []), ...visibles.filter((v) => /\d/.test(v))];
  check("index.html sin cifras en el texto visible", malos.length === 0, malos.join(" | "));
}

// ---------------------------------------------------------------- principal
async function main() {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  htmlSinCifras();
  const srv = await servidor();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const navegador = await chromium.launch();
  try {
    const esc = await abrir(navegador, base, { viewport: { width: 1366, height: 860 } }, "escritorio");
    await pruebasEscritorio(esc.page);
    check("escritorio: sin errores de consola", esc.errores.length === 0, esc.errores.join(" | "));
    await esc.ctx.close();

    const tel = await abrir(
      navegador,
      base,
      { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" },
      "teléfono",
    );
    await pruebasTelefono(tel.page);
    check("teléfono: sin errores de consola", tel.errores.length === 0, tel.errores.join(" | "));
    await tel.ctx.close();

    // Cubo alterado: superficie abstenida > 0 («at least») y una capa ausente de capas_disponibles.
    const alterado = structuredClone(cubo);
    const primera = parcelas.features[0].properties;
    alterado.zona.superficie_abstenida_ha = primera.area_ha;
    const quitada = alterado.distrito.capas_disponibles.pop();
    const alt = await abrir(navegador, base, { viewport: { width: 1366, height: 860 } }, "cubo alterado", alterado);
    await fijarDeslizador(alt.page, cubo.dotaciones.marcas[cubo.dotaciones.marcas.length - 1].valor);
    const ind = await indicador(alt.page);
    const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(primera.area_ha / cubo.zona.superficie_total_ha);
    check("superficie abstenida > 0: el indicador dice «at least» y el % sin clasificar", ind.includes("at least") && ind.includes(`${pct} of the area is not classified`), pct);
    const capasAlt = await alt.page.locator("#capas input").evaluateAll((xs) => xs.map((x) => x.value));
    check(`una capa ausente de capas_disponibles (${quitada}) no se muestra`, !capasAlt.includes(quitada), capasAlt.join(", "));
    check("cubo alterado: sin errores de consola", alt.errores.length === 0, alt.errores.join(" | "));
    await alt.ctx.close();
  } catch (err) {
    check("la prueba de humo terminó sin excepciones", false, err.stack ?? String(err));
  } finally {
    await navegador.close();
    srv.close();
  }
  const fallas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallas.length}/${resultados.length} comprobaciones pasan. Capturas en ${path.relative(RAIZ, CAPTURAS)}/`);
  process.exit(fallas.length ? 1 : 0);
}

main();
