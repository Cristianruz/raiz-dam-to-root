// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// tests/e2e/web_smoke.mjs — Prueba de humo de la web (C1 + C2) con Playwright.
//
// Uso:   node tests/e2e/web_smoke.mjs
//        RAIZ_DATOS=<carpeta> RAIZ_CAPTURAS=<carpeta> node tests/e2e/web_smoke.mjs   (otro juego de datos)
// No forma parte de `node --test tests/` (necesita Chromium). Termina con código 0 si todo pasa y 1 si algo falla.
//
// Qué hace:
// - levanta un servidor estático local de web/ (http.createServer, sin dependencias); /data/ sale de
//   web/data o de la carpeta RAIZ_DATOS (cubo.json, parcelas.geojson, explicaciones.json);
// - abre la página en escritorio y en un viewport de teléfono;
// - simula «sin red» para las teselas de OSM (las aborta): el mapa debe seguir con fondo sólido;
// - verifica: sin errores de consola (salvo esas fallas de red), indicador que cambia con el deslizador y la lluvia,
//   las marcas mueven el deslizador, dotación 0 => mensaje «sin dotación», el mapa dibuja todas las parcelas,
//   la lista de parcelas es completa, se desplaza y se filtra, la ficha abre en las parcelas protagonistas con
//   una tarjeta por opción, «enough for» cambia con el deslizador, «no irrigation needed» con necesidad cero,
//   la ficha de una parcela abstenida, el clic en el mapa, y La gota con y sin escenario de goteo;
// - guarda capturas en tests/e2e/capturas/ (o en RAIZ_CAPTURAS).
// No supone un juego de datos: los valores esperados y las parcelas de cada prueba se leen de los datos.
// Los casos que los datos no traen (superficie abstenida, capa ausente, una parcela abstenida, el goteo)
// se prueban además con una variante del cubo y de las parcelas servida en memoria (page.route).

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
const DATOS = process.env.RAIZ_DATOS ? path.resolve(process.env.RAIZ_DATOS) : path.join(WEB, "data");
const CAPTURAS = process.env.RAIZ_CAPTURAS ? path.resolve(process.env.RAIZ_CAPTURAS) : path.join(AQUI, "capturas");

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

const leerJSON = (nombre) => JSON.parse(fs.readFileSync(path.join(DATOS, nombre), "utf-8"));
const cubo = leerJSON("cubo.json");
const parcelas = leerJSON("parcelas.geojson");
const explicaciones = leerJSON("explicaciones.json");

// ---------------------------------------------------------------- lectura de los datos (nada escrito a mano)
const props = parcelas.features.map((f) => f.properties);
const porId = new Map(props.map((p) => [p.id, p]));
const opcionesDe = (id, c = cubo) => c.parcelas?.[id]?.opciones ?? [];
const actualDe = (id, c = cubo) => opcionesDe(id, c).find((o) => o.id === "ACTUAL");
const l50 = (o) => o?.agua?.lamina_bruta?.["0"]?.p50; // la prueba trabaja con la lluvia base (interruptor apagado)
const protagonistas = props.filter((p) => p.protagonista).map((p) => p.id);
// Orden de búsqueda de parcelas para cada prueba: primero las protagonistas, luego las demás.
const candidatos = [...protagonistas, ...props.filter((p) => !p.protagonista).map((p) => p.id)];
const { deslizador, marcas } = cubo.dotaciones;
const D1 = marcas[0].valor;
const D2 = marcas[marcas.length - 1].valor;
// «enough for» cambia entre D1 y D2 solo si la necesidad mediana supera la menor de las dos dotaciones.
const conNecesidad = candidatos.find((id) => !porId.get(id).abstencion && l50(actualDe(id)) > Math.min(D1, D2));
// Una opción con necesidad cero (descanso / barbecho): debe decir «No irrigation needed» (kit §2.4).
const sinNecesidad = candidatos
  .filter((id) => !porId.get(id).abstencion)
  .map((id) => [id, opcionesDe(id).find((o) => o.agua?.lamina_bruta?.["0"] && !(l50(o) > 0))])
  .find(([, o]) => o);
const abstenidas = candidatos.filter((id) => porId.get(id).abstencion);
const esMock = Boolean(cubo.meta?.mock || parcelas.meta?.mock || explicaciones.meta?.mock);

// ---------------------------------------------------------------- servidor estático
function servidor() {
  const srv = http.createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const raizServida = ruta.startsWith("/data/") ? DATOS : WEB;
    const relativa = ruta.startsWith("/data/") ? ruta.slice("/data".length) : ruta;
    let archivo = path.normalize(path.join(raizServida, relativa));
    if (!archivo.startsWith(raizServida)) {
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
/** Prueba que los datos no permiten (p. ej. ninguna parcela abstenida): se anuncia y no cuenta. */
function omitir(nombre, motivo) {
  console.log(`OMITE  ${nombre} — ${motivo}`);
}

// ---------------------------------------------------------------- utilidades de página
async function abrir(navegador, base, opciones, etiqueta, alterados = {}) {
  const ctx = await navegador.newContext(opciones);
  const page = await ctx.newPage();
  // Variantes de los datos solo para esta página (casos que los datos no producen).
  for (const [archivo, contenido] of Object.entries(alterados)) {
    await page.route(`**/data/${archivo}`, (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(contenido) }),
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
  await page.waitForFunction(() => document.body.dataset.mapa === "listo" || document.body.dataset.mapa === "sin-mapa", null, { timeout: 30000 });
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
const tarjeta = (page, opcion) => page.locator(`.tarjeta[data-opcion="${opcion}"]`);

async function abrirDesdeLista(page, id) {
  await cerrarFicha(page); // la ficha abierta tapa la lista (escritorio: a la derecha; teléfono: hoja inferior)
  await page.locator("#buscar-parcela").fill("");
  await page.locator(`.boton-parcela[data-id="${id}"]`).click();
  await page.waitForSelector("#ficha:not([hidden])");
}
async function cerrarFicha(page) {
  if (await page.locator("#ficha").isVisible()) await page.locator("#ficha-cerrar").click();
}

// ---------------------------------------------------------------- pruebas reutilizables
/** Ficha de una parcela abstenida: «Not classified — check with technician», memoria y ninguna tarjeta. */
async function pruebaFichaAbstenida(page, id, prefijo, captura = null, p = porId.get(id)) {
  await abrirDesdeLista(page, id);
  const cuerpo = await texto(page, "#ficha");
  check(`${prefijo}ficha de la parcela abstenida ${id} dice «Not classified — check with technician»`, cuerpo.includes("Not classified — check with technician"));
  check(`${prefijo}ficha abstenida ${id} sin tarjetas de opciones`, (await page.locator("#ficha .tarjeta").count()) === 0);
  const celdas = await page.locator("#ficha .franja .celda").count();
  if (Array.isArray(p.memoria)) {
    check(`${prefijo}ficha abstenida ${id} con la memoria de la parcela (una celda por año)`, celdas === p.memoria.length, `${celdas} celdas`);
  } else {
    check(`${prefijo}ficha abstenida ${id}: «Field memory: not run»`, cuerpo.includes("Field memory: not run"));
  }
  check(`${prefijo}aviso de juicio local en la ficha abstenida ${id}`, cuerpo.includes("This tool supports, never replaces, the judgment of farmers and local experts."));
  if (captura) {
    await esperarAnimaciones(page);
    await page.screenshot({ path: path.join(CAPTURAS, captura) });
  }
  await cerrarFicha(page);
}

/**
 * La gota de la opción ACTUAL de una parcela (la ficha debe estar abierta).
 * Con bloques de goteo: botón visible, cifras «Dam water» y «Back to aquifer», barra = salida de presa del cubo
 * (si reducida = true, sin transición) y leyenda con los m³. Sin ellos: botón e interruptor ocultos y la nota.
 */
async function pruebaGota(page, id, c, prefijo, reducida) {
  const op = actualDe(id, c);
  await page.locator("#seccion-gota").scrollIntoViewIfNeeded();
  const boton = page.locator("#gota-goteo");
  if (!op?.gota) {
    check(`${prefijo}La gota de ${id} sin bloque gota: dice «Not available»`, (await texto(page, "#seccion-gota")).includes("Not available"));
    return;
  }
  if (!op.gota_goteo_con_tope) {
    check(`${prefijo}sin escenario de goteo en ${id}: botón de goteo oculto`, await boton.isHidden());
    check(`${prefijo}sin escenario de goteo en ${id}: interruptor del tope oculto`, await page.locator("#gota-tope-control").isHidden());
    const nota = page.locator("#gota-sin-goteo");
    check(
      `${prefijo}sin escenario de goteo en ${id}: nota «Drip scenario not available yet»`,
      (await nota.isVisible()) && (await nota.innerText()).includes("Drip scenario not available yet: no sourced drip efficiency."),
    );
    const leyenda = await texto(page, "#gota-leyenda");
    const fmtM3 = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
    check(`${prefijo}La gota de ${id} muestra los m³ del riego actual del cubo`, leyenda.includes(fmtM3(op.gota.m3_salen_presa)) && leyenda.includes(fmtM3(op.gota.m3_regresan_acuifero)));
    return;
  }
  check(`${prefijo}con escenario de goteo en ${id}: botón visible`, await boton.isVisible());
  await boton.click();
  const cifras = await texto(page, "#gota-cifras");
  check(`${prefijo}«What if this field switches to drip?» muestra Dam water y Back to aquifer`, cifras.includes("Dam water") && cifras.includes("Back to aquifer"), cifras.replace(/\n/g, " "));
  const fmtM3 = (v) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v);
  const leyenda = await texto(page, "#gota-leyenda");
  check(`${prefijo}la leyenda de La gota muestra los m³ del cubo (goteo con tope)`, leyenda.includes(fmtM3(op.gota_goteo_con_tope.m3_consume_cultivo_et)) && leyenda.includes(fmtM3(op.gota_goteo_con_tope.m3_regresan_acuifero)));
  if (reducida) {
    // Con movimiento reducido las barras quedan en su ancho final de inmediato: se comparan con el cubo.
    const variantes = [op.gota, op.gota_goteo_con_tope, op.gota_goteo_sin_tope].filter(Boolean);
    const escala = Math.max(...variantes.map((g) => g.m3_salen_presa));
    const esperado = (op.gota_goteo_con_tope.m3_salen_presa / escala) * 100;
    const anchoBarra = await page.locator('.gota-barra[data-fila="0"]').evaluate((el) => parseFloat(el.style.width));
    check(`${prefijo}(movimiento reducido) barra de La gota con goteo = salida de presa del cubo`, Math.abs(anchoBarra - esperado) < 0.01, `${anchoBarra.toFixed(2)} % vs ${esperado.toFixed(2)} %`);
  }
  if (op.gota_goteo_sin_tope && op.tope_consumo) {
    await page.locator("#gota-tope").click();
    const sinTope = await texto(page, "#gota-cifras");
    check(`${prefijo}sin tope: muestra Crop consumption (ET) vs. historical`, sinTope.includes("Crop consumption (ET)"));
    const alerta = page.locator("#gota-alerta");
    check(`${prefijo}sin tope: aviso «Not recommended» solo si cumple_sin_tope = false`, (await alerta.isVisible()) === (op.tope_consumo.cumple_sin_tope === false));
    await page.locator("#gota-tope").click();
  }
}

// ---------------------------------------------------------------- pruebas de escritorio
async function pruebasEscritorio(page) {
  // Aviso de datos simulados: visible si y solo si algún archivo trae meta.mock = true
  const visibleMock = await page.locator("#aviso-simulado").isVisible();
  check(`aviso SIMULATED DATA ${esMock ? "visible" : "oculto"} (meta.mock = ${esMock})`, visibleMock === esMock);

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

  // Marcas: llevan el deslizador a su valor y muestran la fuente
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

  // Lluvia seca cambia el indicador
  const antesLluvia = await indicador(page);
  await page.locator("#lluvia").check();
  const conLluvia = await indicador(page);
  check("el indicador cambia al activar la lluvia seca", antesLluvia !== conLluvia);
  const etiquetaLluvia = await texto(page, "#lluvia-etiqueta");
  const seca = cubo.lluvia_pct.find((x) => x !== 0);
  check("la etiqueta de lluvia sale de cubo.lluvia_pct", etiquetaLluvia.includes(String(Math.abs(seca))), etiquetaLluvia);
  await page.locator("#lluvia").uncheck();

  // Dotación mínima => mensaje «sin dotación» (con la tecla Home: mínimo del deslizador)
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
  } else {
    omitir("indicador > 100 %", "ninguna marca lo produce con estos datos");
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

  // El mapa dibuja todas las parcelas
  const dibujadas = await page.evaluate(() => window.raizDepuracion.parcelasDibujadas());
  check("el mapa dibuja todas las parcelas de parcelas.geojson", dibujadas === props.length, `${dibujadas} de ${props.length}`);

  // Lista de parcelas: completa, se desplaza dentro de su caja y se filtra
  const nLista = await page.locator(".boton-parcela").count();
  check("la lista tiene una entrada por parcela", nLista === props.length, `${nLista} de ${props.length}`);
  const caja = await page.locator("#lista-parcelas").evaluate((ul) => ({
    alto: ul.clientHeight,
    contenido: ul.scrollHeight,
    desborde: getComputedStyle(ul).overflowY,
    ventana: window.innerHeight,
  }));
  check(
    "la lista se desplaza dentro de su caja (no alarga la página)",
    caja.alto <= caja.ventana && (caja.contenido <= caja.alto + 1 || ["auto", "scroll"].includes(caja.desborde)),
    JSON.stringify(caja),
  );
  const ultima = page.locator(".boton-parcela").last();
  await ultima.scrollIntoViewIfNeeded();
  check("la última parcela de la lista se alcanza desplazando", await ultima.isVisible());
  // Tiempo de una actualización completa con el deslizador (lista en su lugar, sin reconstruir).
  const ms = await page.evaluate(([a, b]) => {
    const s = document.querySelector("#dotacion");
    const n = 20;
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      s.value = String(i % 2 ? a : b);
      s.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return (performance.now() - t0) / n;
  }, [D1, D2]);
  check("cada movimiento del deslizador actualiza la página en menos de 100 ms", ms < 100, `${ms.toFixed(1)} ms por movimiento con ${props.length} parcelas`);
  const buscado = protagonistas[0] ?? props[0].id;
  await page.locator("#buscar-parcela").fill(buscado);
  const visibles = await page.locator(".boton-parcela:visible").count();
  const esperados = props.filter((p) => p.id.toLowerCase().includes(buscado.toLowerCase())).length;
  check(`el buscador filtra la lista por id (${buscado})`, visibles === esperados && (await texto(page, "#lista-resumen")).includes("Showing"), `${visibles} visibles`);
  await page.locator("#buscar-parcela").fill("");
  check("al vaciar el buscador vuelve la lista completa", (await page.locator(".boton-parcela:visible").count()) === props.length);

  // Captura del centro de control
  await page.locator(`.boton-marca[data-marca="${marcas[1]?.id ?? marcas[0].id}"]`).click();
  await page.evaluate(() => window.raizDepuracion.esperarMapa());
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_centro_control.png") });

  // Ficha en las protagonistas (con teclado desde la lista)
  for (const id of protagonistas) {
    const p = porId.get(id);
    const ops = opcionesDe(id);
    await page.locator(`.boton-parcela[data-id="${id}"]`).focus();
    await page.keyboard.press("Enter");
    await page.waitForSelector("#ficha:not([hidden])");
    const titulo = await texto(page, "#ficha-titulo");
    check(`ficha de ${id} abre con el teclado`, titulo.includes(id), titulo);

    if (p.abstencion) {
      check(`ficha de ${id} (abstenida) sin tarjetas`, (await page.locator("#ficha .tarjeta").count()) === 0);
    } else {
      // Una tarjeta por opción del cubo, cada una con sus renglones Water · Soil · Money y las cinco respuestas de Why?
      const resumen = await page.locator("#ficha .tarjeta").evaluateAll((ts) =>
        ts.map((t) => ({
          id: t.dataset.opcion,
          renglones: ["agua", "suelo", "dinero"].map((r) => t.querySelector(`.renglon-${r} h5`)?.textContent.trim().split(/\s/)[0] ?? ""),
          preguntas: t.querySelectorAll(".porque dt").length,
        })),
      );
      check(
        `ficha de ${id}: una tarjeta por opción del cubo (${ops.length})`,
        resumen.length === ops.length && ops.every((o, i) => resumen[i]?.id === o.id),
        resumen.map((r) => r.id).join(", "),
      );
      check(`ficha de ${id}: cada tarjeta con Water, Soil y Money`, resumen.every((r) => r.renglones.join(",") === "Water,Soil,Money"), JSON.stringify(resumen.map((r) => r.renglones)));
      check(`ficha de ${id}: botón Why? con las cinco respuestas en cada tarjeta`, resumen.every((r) => r.preguntas === 5));
      const confianza = await texto(page, "#ficha .ficha-cultivo");
      check(`ficha de ${id}: cultivo con su confianza (o «confidence not available»)`, /confidence/.test(confianza) && !/—\s*—/.test(confianza), confianza);
    }
    if (Array.isArray(p.memoria)) {
      const estados = await page.locator(".leyenda-memoria li").evaluateAll((xs) => xs.map((x) => x.dataset.estado));
      check(`leyenda de la memoria de ${id} con los seis estados`, ["perenne", "verano", "invierno", "doble", "descanso", "sin_dato"].every((e) => estados.includes(e)), estados.join(","));
      const nota = await page.locator(".nota-fija").innerText();
      check(`nota fija de la memoria en ${id}`, nota.includes("Rule-based reading of monthly greenness; not a crop census."));
    }
    const aviso = await page.locator("#ficha .aviso-juicio").innerText();
    check(`aviso de juicio local en ${id}`, aviso.includes("This tool supports, never replaces, the judgment of farmers and local experts."));
    const sinMarcadores = await page.locator("#ficha").evaluate((el) => !/\{\{\w+\}\}/.test(el.innerText) && !/\{\{\w+\}\}/.test(el.textContent));
    check(`sin marcadores {{…}} sin rellenar en ${id}`, sinMarcadores);
    await page.keyboard.press("Escape");
    check(`Escape cierra la ficha de ${id}`, await page.locator("#ficha").isHidden());
  }

  // «enough for» cambia con el deslizador: parcela cuya opción ACTUAL necesita agua (lámina P50 > 0)
  if (conNecesidad) {
    await abrirDesdeLista(page, conNecesidad);
    const alcanza = tarjeta(page, "ACTUAL").locator(".alcanza");
    await fijarDeslizador(page, D1);
    const a1 = await alcanza.innerText();
    const s1 = await tarjeta(page, "ACTUAL").getAttribute("data-semaforo");
    await fijarDeslizador(page, D2);
    const a2 = await alcanza.innerText();
    const s2 = await tarjeta(page, "ACTUAL").getAttribute("data-semaforo");
    check(`«enough for» de ${conNecesidad} cambia con el deslizador`, a1 !== a2 && /Enough for/.test(a1), `${a1} → ${a2} (${s1} → ${s2})`);
    await cerrarFicha(page);
  } else {
    omitir("«enough for» cambia con el deslizador", "ninguna opción ACTUAL necesita más agua que la menor marca");
  }

  // Necesidad cero: «No irrigation needed», semáforo verde y alcanza para toda la parcela (kit §2.4)
  if (sinNecesidad) {
    const [id, o] = sinNecesidad;
    await abrirDesdeLista(page, id);
    const t = tarjeta(page, o.id);
    const lamina = await t.locator(".lamina").innerText();
    const sem = await t.getAttribute("data-semaforo");
    const area = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(porId.get(id).area_ha);
    const alcanza = await t.locator(".alcanza").innerText();
    check(`necesidad cero (${id}/${o.id}): «No irrigation needed», semáforo verde`, lamina.includes("No irrigation needed") && sem === "verde", `${lamina} · ${sem}`);
    check(`necesidad cero (${id}/${o.id}): alcanza para toda la parcela`, alcanza.includes(`of ${area} hectares`) && alcanza.startsWith(`Enough for ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(porId.get(id).area_ha)}`), alcanza);
    await cerrarFicha(page);
  } else {
    omitir("necesidad cero «No irrigation needed»", "ninguna opción con lámina P50 = 0 en estos datos");
  }

  // Parcela abstenida: su ficha (se prueba también con la variante en memoria)
  if (abstenidas.length) await pruebaFichaAbstenida(page, abstenidas[0], "", "escritorio_ficha_abstenida.png");
  else omitir("ficha de una parcela abstenida", "ninguna parcela abstenida en estos datos (se prueba con la variante en memoria)");

  // Advertencia «advertir_si_rojo»: visible solo cuando el semáforo de agua de esa opción queda en rojo
  const conAviso = Object.entries(cubo.parcelas).flatMap(([pid, p]) => p.opciones.filter((o) => o.advertir_si_rojo).map((o) => [pid, o]));
  for (const [pid, o] of conAviso.slice(0, 3)) {
    await abrirDesdeLista(page, pid);
    const t = tarjeta(page, o.id);
    for (const m of [marcas[0], marcas[marcas.length - 1]]) {
      await fijarDeslizador(page, m.valor);
      const sem = await t.getAttribute("data-semaforo");
      const visible = await t.locator(".advertencia").isVisible();
      check(`advertir_si_rojo en ${pid}/${o.id} con ${m.id}: aviso ${visible ? "visible" : "oculto"} y semáforo ${sem}`, visible === (sem === "rojo"));
    }
    await cerrarFicha(page);
  }
  if (!conAviso.length) omitir("advertir_si_rojo", "ninguna opción lo trae en estos datos");

  // Clic en el mapa abre la ficha: una parcela clasificada (protagonista si hay) y una abstenida
  const clasificada = candidatos.find((id) => !porId.get(id).abstencion) ?? candidatos[0];
  const aClicar = [clasificada];
  for (const id of abstenidas.slice(0, 5)) {
    // la primera abstenida que se vea en el mapa (las muy pequeñas pueden quedar bajo un píxel)
    if (await page.evaluate((x) => window.raizDepuracion.pixelDeParcela(x), id)) {
      aClicar.push(id);
      break;
    }
  }
  for (const id of aClicar) {
    await cerrarFicha(page);
    const px = await page.evaluate((x) => window.raizDepuracion.pixelDeParcela(x), id);
    if (!px) {
      check(`clic sobre la parcela ${id} del mapa abre su ficha`, false, "la parcela no se ve en el mapa");
      continue;
    }
    await page.mouse.click(px.x, px.y);
    await page.waitForSelector("#ficha:not([hidden])", { timeout: 5000 }).catch(() => {});
    const titulo = await texto(page, "#ficha-titulo").catch(() => "");
    const abst = porId.get(id).abstencion;
    const cuerpo = abst ? await texto(page, "#ficha").catch(() => "") : "";
    check(
      `clic sobre la parcela ${id}${abst ? " (abstenida)" : ""} del mapa abre su ficha`,
      titulo.includes(id) && (!abst || cuerpo.includes("Not classified — check with technician")),
      titulo,
    );
  }
  await cerrarFicha(page);

  // Ficha de la primera protagonista (o de la parcela clasificada): Why? abierto y La gota
  const idFicha = clasificada;
  await abrirDesdeLista(page, idFicha);
  await pruebaGota(page, idFicha, cubo, "", false);
  if (await tarjeta(page, "ACTUAL").count()) await tarjeta(page, "ACTUAL").locator(".porque summary").click();
  await page.locator("#ficha").evaluate((el) => { el.scrollTop = 0; });
  await esperarAnimaciones(page);
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_ficha.png") });
  await page.locator(".tarjetas, #t-opciones").first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_ficha_tarjetas.png") });
  await page.locator("#seccion-gota").scrollIntoViewIfNeeded();
  await esperarAnimaciones(page);
  await page.waitForTimeout(1000); // transición d3 de las barras (no es animación CSS)
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_ficha_gota.png") });
  await cerrarFicha(page);
}

// ---------------------------------------------------------------- pruebas de teléfono
async function pruebasTelefono(page) {
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
  const dibujadas = await page.evaluate(() => window.raizDepuracion.parcelasDibujadas());
  check("teléfono: el mapa dibuja todas las parcelas", dibujadas === props.length, `${dibujadas} de ${props.length}`);
  const lista = await page.locator("#lista-parcelas").evaluate((ul) => ({ alto: ul.clientHeight, ventana: window.innerHeight, desborde: getComputedStyle(ul).overflowY }));
  check("teléfono: la lista de parcelas se desplaza dentro de su caja (más baja que la pantalla)", lista.alto < lista.ventana && ["auto", "scroll"].includes(lista.desborde), JSON.stringify(lista));
  await page.evaluate(() => window.raizDepuracion.esperarMapa());
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_centro_control.png") });
  await page.locator("#t-campos").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_lista.png") });
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_centro_control_completa.png"), fullPage: true });

  // Una protagonista que necesite agua (para que «enough for» cambie); si no hay, otra parcela que sí.
  const id = protagonistas.slice(1).find((x) => !porId.get(x).abstencion && l50(actualDe(x)) > Math.min(D1, D2)) ?? conNecesidad ?? candidatos[0];
  await abrirDesdeLista(page, id);
  const ancho = await page.evaluate(() => {
    const f = document.querySelector("#ficha");
    return { cabe: f.scrollWidth <= f.clientWidth + 1, deslizadorVisible: document.querySelector("#dotacion").getBoundingClientRect().bottom <= f.getBoundingClientRect().top + 1 };
  });
  check("teléfono: la ficha se lee sin desplazamiento horizontal", ancho.cabe);
  check("teléfono: el deslizador queda visible con la ficha abierta", ancho.deslizadorVisible);
  if (await tarjeta(page, "ACTUAL").count()) {
    const alcanza = tarjeta(page, "ACTUAL").locator(".alcanza");
    await fijarDeslizador(page, D2);
    const a1 = await alcanza.innerText();
    await fijarDeslizador(page, D1);
    const a2 = await alcanza.innerText();
    check("teléfono: «enough for» cambia con el deslizador", a1 !== a2, `${a1} → ${a2}`);
  }
  await esperarAnimaciones(page);
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_ficha.png") });
  if (await tarjeta(page, "ACTUAL").count()) {
    await tarjeta(page, "ACTUAL").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(CAPTURAS, "telefono_ficha_tarjeta.png") });
  }
  await pruebaGota(page, id, cubo, "teléfono: ", true);
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_ficha_gota.png") });
  await cerrarFicha(page);

  if (abstenidas.length) await pruebaFichaAbstenida(page, abstenidas[0], "teléfono: ", "telefono_ficha_abstenida.png");
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

// ---------------------------------------------------------------- variante en memoria
/**
 * Variante de los datos para los casos que estos datos no traen. Solo vive en la memoria de la prueba:
 * - superficie abstenida > 0 («at least») y una capa quitada de capas_disponibles;
 * - una parcela abstenida (si los datos no traen ninguna, se marca así la última; sus opciones quedan vacías);
 * - el escenario de goteo en la opción ACTUAL de una parcela clasificada (si los datos no lo traen, se derivan
 *   bloques de prueba escalando su bloque «gota»; NO son datos: solo ejercitan el botón y las barras).
 */
function variante() {
  const c = structuredClone(cubo);
  const g = structuredClone(parcelas);
  const primera = g.features[0].properties;
  c.zona.superficie_abstenida_ha = primera.area_ha;
  const quitada = c.distrito.capas_disponibles.pop();

  let idAbst = abstenidas[0];
  if (!idAbst) {
    const p = g.features[g.features.length - 1].properties;
    Object.assign(p, { abstencion: true, cultivo_actual: "sin_clasificar", estado_plazo: null, edad_perenne_anios: null });
    c.parcelas[p.id] = { opciones: [] };
    idAbst = p.id;
  }
  const pAbst = g.features.find((f) => f.properties.id === idAbst).properties;

  const idGoteo = candidatos.find((id) => id !== idAbst && !porId.get(id).abstencion && actualDe(id, c)?.gota);
  const op = idGoteo && actualDe(idGoteo, c);
  if (op && !op.gota_goteo_con_tope) {
    const escalar = (gota, k) =>
      Object.fromEntries(Object.entries(gota).map(([llave, v]) => [llave, typeof v === "number" ? v * k : ["TEST ONLY: scaled copy of the current block"]]));
    op.gota_goteo_con_tope = escalar(op.gota, 0.8);
    op.gota_goteo_sin_tope = { ...escalar(op.gota, 1), m3_consume_cultivo_et: op.gota.m3_consume_cultivo_et * 1.2 };
    op.tope_consumo = {
      et_historica_m3: op.gota.m3_consume_cultivo_et,
      et_goteo_sin_tope_m3: op.gota.m3_consume_cultivo_et * 1.2,
      cumple_sin_tope: false,
      base_historica: "TEST ONLY",
    };
  }
  return { c, g, primera, quitada, idAbst, pAbst, idGoteo };
}

// ---------------------------------------------------------------- principal
async function main() {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  console.log(`Datos: ${path.relative(RAIZ, DATOS) || DATOS} · ${props.length} parcelas · ${abstenidas.length} abstenidas · mock = ${esMock}`);
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

    // Variante en memoria: superficie abstenida > 0, capa ausente, parcela abstenida y escenario de goteo.
    const v = variante();
    const alt = await abrir(
      navegador,
      base,
      { viewport: { width: 1366, height: 860 }, reducedMotion: "reduce" },
      "variante en memoria",
      { "cubo.json": v.c, "parcelas.geojson": v.g },
    );
    await fijarDeslizador(alt.page, D2);
    const ind = await indicador(alt.page);
    const pct = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(v.primera.area_ha / cubo.zona.superficie_total_ha);
    check("superficie abstenida > 0: el indicador dice «at least» y el % sin clasificar", ind.includes("at least") && ind.includes(`${pct} of the area is not classified`), pct);
    const capasAlt = await alt.page.locator("#capas input").evaluateAll((xs) => xs.map((x) => x.value));
    check(`una capa ausente de capas_disponibles (${v.quitada}) no se muestra`, !capasAlt.includes(v.quitada), capasAlt.join(", "));
    await pruebaFichaAbstenida(alt.page, v.idAbst, "variante: ", null, v.pAbst);
    if (v.idGoteo) {
      await abrirDesdeLista(alt.page, v.idGoteo);
      await pruebaGota(alt.page, v.idGoteo, v.c, "variante: ", true);
      await cerrarFicha(alt.page);
    } else {
      omitir("variante: escenario de goteo", "ninguna parcela clasificada con bloque gota");
    }
    check("variante en memoria: sin errores de consola", alt.errores.length === 0, alt.errores.join(" | "));
    await alt.ctx.close();
  } catch (err) {
    check("la prueba de humo terminó sin excepciones", false, err.stack ?? String(err));
  } finally {
    await navegador.close();
    srv.close();
  }
  const fallas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallas.length}/${resultados.length} comprobaciones pasan. Capturas en ${path.relative(RAIZ, CAPTURAS) || CAPTURAS}/`);
  process.exit(fallas.length ? 1 : 0);
}

main();
