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
// - dos zonas piloto (docs/decisiones/2026-11-14_dos_zonas.md): con una sola zona el selector «Pilot area» NO
//   aparece; con un cubo y un geojson de DOS zonas derivados en memoria (page.route) aparece, y cambiar de zona
//   cambia el indicador, los conteos, la lista y el mapa; las localidades del equipo se listan y se dibujan;
// - módulos de web/js/ conectados por app.js:
//   · relieve (kit A9, parte web): la capa «Terrain & runoff» está oculta por omisión, se enciende desde el grupo de
//     capas y dibuja rutas en el mapa; su leyenda trae el umbral, el rótulo y la fuente de relieve.json; «Simulate a
//     storm» muestra la lámina de la tormenta con su definición, periodo y fuente, y anima gotas unos 3 s (termina sola);
//     con movimiento reducido no hay animación (solo se resaltan las rutas); sin relieve.json: «Terrain layer: not run»;
//     con dos zonas, la zona sin relieve dice «not run for this pilot area»; la línea de relieve en el renglón Soil;
//   · La gota (X3.2): Sankey con d3-sankey; cada nodo lleva los m³ del cubo y su alto y el ancho de cada banda son la
//     escala común por los m³; las gotas recorren las bandas una sola vez (o se omiten con movimiento reducido); con
//     bloques de goteo (los del cubo: escritorio con la transición de d3 y teléfono con movimiento reducido), el
//     botón, las cifras grandes, la misma escala para las variantes, el tope, el aviso «Not recommended» y la
//     etiqueta de las eficiencias (cubo.meta.goteo: «indicative, not local») en los supuestos; sin ellos, la nota
//     «Drip scenario not available yet». El caso que los datos NO traen se prueba con la variante en memoria;
//   · filtros oficiales (B3; decisión docs/decisiones/2026-11-14_opciones_b3.md): si el cubo trae filtros con
//     «estado», uno que no pasa nunca se dibuja como aprobado y «needs_local_check» dice «needs a local check»;
//   · mensaje (C4): maqueta de WhatsApp en español con las opciones numeradas, «Responda 1, 2 o 3.» y el aviso de
//     Conagua, que cambia con el deslizador y cabe en el teléfono; «Print field sheet» con emulación de impresión:
//     sin mapa, panel ni controles, con la ficha, los valores usados y La gota estática, en UNA hoja (carta y A4);
//   · inicio y «About & Data» (C5): la pantalla de inicio de tres pasos se cierra (Escape o «Start exploring»), no
//     vuelve en la sesión y «How it works» la reabre; «About & Data» lee manifest.json y pruebas.json solo al abrirse,
//     muestra las cinco pruebas con el estado de pruebas.json y «Not run» con su insignia, y Escape la cierra sin
//     cerrar la ficha;
// - revisión de la auditoría de la web: contraste WCAG (≥ 4.5:1) de los símbolos de los círculos y de las letras
//   de las muestras; una trama distinta por cultivo en la capa «Crops»; con la ficha abierta, el mapa y el panel
//   quedan inert (los controles no); sin desplazamiento horizontal a 320 px; en pantalla baja (844×390) la
//   ficha ocupa todo el alto; una parcela CLASIFICADA sin opciones («sin_clima_zona») no se cuenta como
//   «Not classified» ni en el indicador, y su ficha y su mensaje dicen el motivo; con relieve.json o pruebas.json
//   en HTTP 500 y manifest.json roto, la página dice «could not be loaded / could not be read» (no «not run» ni
//   «not built»); si imprimir falla, un aviso visible; si el arranque falla, el aviso .error-carga;
// - guarda capturas en tests/e2e/capturas/ (o en RAIZ_CAPTURAS).
// No supone un juego de datos: los valores esperados y las parcelas de cada prueba se leen de los datos.
// Los casos que los datos no traen (superficie abstenida, capa ausente, una parcela abstenida, el goteo)
// se prueban además con una variante del cubo y de las parcelas servida en memoria (page.route).

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { aguaComprometida, conteosZona } from "../../web/reglas.js";
import { LLAVE_INICIO } from "../../web/js/acerca.js";

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
/** Respuesta alterada que no es un JSON válido de 200 (un HTTP 500, un archivo roto): para page.route. */
class Respuesta {
  constructor(status, cuerpo = "") {
    this.status = status;
    this.cuerpo = cuerpo;
  }
}
const cubo = leerJSON("cubo.json");
const parcelas = leerJSON("parcelas.geojson");
const explicaciones = leerJSON("explicaciones.json");
// Parámetros de las zonas y de las localidades del equipo (para la variante de dos zonas).
const params = JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "params.json"), "utf-8"));

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

// Archivos opcionales de web/data: si el juego de datos no los trae, la página lo dice («not run», «not available»)
// y el 404 de su lectura no cuenta como error de consola. Si están, se leen aquí para comparar con la página.
const OPCIONALES_DATOS = ["relieve.json", "relieve_rutas.geojson", "manifest.json", "pruebas.json"];
const existe = (nombre) => fs.existsSync(path.join(DATOS, nombre));
const ausentes = OPCIONALES_DATOS.filter((f) => !existe(f));
const esAusente = (url = "") => ausentes.some((f) => url.split("?")[0].endsWith(`/data/${f}`));
const leerOpcional = (nombre) => (existe(nombre) ? leerJSON(nombre) : null);
const relieve = leerOpcional("relieve.json");
const rutasRelieve = leerOpcional("relieve_rutas.geojson");
const pruebasWeb = leerOpcional("pruebas.json");
const hayRelieve = Boolean(relieve?.zonas && Object.keys(relieve.zonas).length && rutasRelieve?.features?.length);

// Formatos que usa la página (en-US; el mensaje de WhatsApp, es-MX).
const nf = (opciones) => new Intl.NumberFormat("en-US", opciones);
const fmt3 = (v) => nf({ maximumFractionDigits: 3 }).format(v);
const fmtM3 = (v) => `${nf({ maximumFractionDigits: 0 }).format(v).replace("-", "−")} m³`;
/** Periodo de la tormenta como lo escribe la página: dos fechas ISO en inglés («Jan 1, 2001 to …»); si no, tal cual. */
const periodoEnPagina = (p) => {
  const f = String(p ?? "").match(/\d{4}-\d{2}-\d{2}/g) ?? [];
  if (f.length !== 2) return p;
  const d = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });
  return `${d.format(new Date(`${f[0]}T00:00:00Z`))} to ${d.format(new Date(`${f[1]}T00:00:00Z`))}`;
};
const fmtCambio = (f) => nf({ style: "percent", maximumFractionDigits: 0, signDisplay: "exceptZero" }).format(f).replace("-", "−");

// La gota: opción que la ficha muestra al abrirse (la ACTUAL con bloque gota; si no, la primera con bloque gota).
const opcionGota = (id, c = cubo) => opcionesDe(id, c).find((o) => o.id === "ACTUAL" && o.gota) ?? opcionesDe(id, c).find((o) => o.gota);
const CAMPOS_GOTA = {
  presa: "m3_salen_presa",
  canal: "m3_perdidas_canal",
  parcela: "m3_llegan_parcela",
  et: "m3_consume_cultivo_et",
  acuifero: "m3_regresan_acuifero",
  otras: "m3_otras_perdidas",
};
/** Un bloque gota cuenta si trae los seis flujos como números (la misma regla que web/js/gota.js). */
const bloqueGota = (b) => Boolean(b) && Object.values(CAMPOS_GOTA).every((k) => Number.isFinite(b[k]));

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
/**
 * Abre la página en un contexto nuevo. Por omisión la pantalla de inicio se da por cerrada (sessionStorage), para
 * que su diálogo modal no tape los controles; con { inicio: true } aparece como para un visitante nuevo.
 */
async function abrir(navegador, base, opciones, etiqueta, alterados = {}, { inicio = false } = {}) {
  const ctx = await navegador.newContext(opciones);
  if (!inicio) {
    await ctx.addInitScript((llave) => {
      try {
        window.sessionStorage.setItem(llave, "cerrado");
      } catch {
        // sin almacenamiento: la pantalla aparecería (no pasa en Chromium)
      }
    }, LLAVE_INICIO);
  }
  const page = await ctx.newPage();
  const peticiones = [];
  page.on("request", (r) => peticiones.push(r.url()));
  // Variantes de los datos solo para esta página (casos que los datos no producen).
  for (const [archivo, contenido] of Object.entries(alterados)) {
    await page.route(`**/data/${archivo}`, (route) =>
      contenido instanceof Respuesta
        ? route.fulfill({ status: contenido.status, contentType: "application/json", body: contenido.cuerpo })
        : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(contenido) }),
    );
  }
  const errores = [];
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const url = m.location()?.url ?? "";
    if (esOpcional(url) || esOpcional(m.text()) || esAusente(url)) return;
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
  await page.waitForFunction(() => Boolean(document.body.dataset.relieve), null, { timeout: 15000 });
  console.log(`\n[${etiqueta}] mapa: ${await page.evaluate(() => document.body.dataset.mapa)} · relieve: ${await page.evaluate(() => document.body.dataset.relieve)}`);
  return { ctx, page, errores, peticiones };
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

/**
 * Razón de contraste WCAG entre el color del texto y el fondo de cada elemento (los dos, colores calculados).
 * Devuelve [{texto, razon}] de los elementos visibles con texto.
 */
async function contrastes(page, selector) {
  return page.evaluate((sel) => {
    const rgb = (c) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
    const lum = ([r, g, b]) => {
      const f = (v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    return [...document.querySelectorAll(sel)]
      .filter((el) => el.textContent.trim() && el.getClientRects().length)
      .map((el) => {
        const cs = getComputedStyle(el);
        const [a, b] = [lum(rgb(cs.color)), lum(rgb(cs.backgroundColor))].sort((x, y) => y - x);
        return { texto: el.textContent.trim(), razon: Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100 };
      });
  }, selector);
}
async function checkContraste(page, selector, nombre) {
  const xs = await contrastes(page, selector);
  const malos = xs.filter((x) => x.razon < 4.5);
  check(`${nombre}: contraste ≥ 4.5:1 en ${xs.length} símbolos`, xs.length > 0 && malos.length === 0,
    malos.length ? malos.map((x) => `${x.texto} ${x.razon}`).join(", ") : `mínimo ${Math.min(...xs.map((x) => x.razon))}`);
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
  // Sin opciones, el mensaje de WhatsApp pide revisar la parcela con el técnico (y no pide responder un número).
  await page.locator("#boton-whatsapp").click();
  const wa = await texto(page, "#vista-whatsapp");
  check(
    `${prefijo}WhatsApp de la parcela abstenida ${id}: pide revisarla con el técnico, sin «Responda»`,
    wa.includes("Revísela con su técnico") && !wa.includes("Responda") && wa.includes("Es una simulación; la asignación oficial la decide Conagua."),
  );
  await page.locator("#boton-whatsapp").click();
  if (p.relieve) {
    check(`${prefijo}ficha abstenida ${id}: la línea de relieve se muestra aunque no haya tarjetas`, (await page.locator("#ficha .relieve-parcela").count()) === 1);
  }
  if (captura) {
    await esperarAnimaciones(page);
    await page.screenshot({ path: path.join(CAPTURAS, captura) });
  }
  await cerrarFicha(page);
}

/**
 * Espera a que el Sankey de La gota termine su transición de d3 (sus medidas dejan de cambiar) antes de medirlo.
 * Con movimiento reducido no hay transición y vuelve enseguida. Con el goteo del cubo, el cambio de variante se
 * prueba también en escritorio (con transición): medir a media transición daría los altos de la variante anterior.
 */
async function esperarSankeyQuieto(page) {
  const medidas = () =>
    page.locator("#gota-modulo svg.gota-svg").evaluate((svg) =>
      [...svg.querySelectorAll("rect[data-gota-nodo], path[data-gota-banda]")]
        .map((e) => ["y", "height", "stroke-width"].map((a) => e.getAttribute(a) ?? "").join("|"))
        .join(";"),
    );
  let previas = await medidas();
  for (let intento = 0; intento < 40; intento++) {
    await page.waitForTimeout(100);
    const ahora = await medidas();
    if (ahora === previas) return;
    previas = ahora;
  }
}

/**
 * Lee el Sankey de La gota que está en pantalla y lo compara con un bloque del cubo:
 * - cada nodo lleva en data-valor los m³ del cubo (y están todos los flujos con valor > 0);
 * - el ancho de cada banda es la escala común (data-escala, px por m³) por sus m³ (mínimo 1 px);
 * - el alto de La Boquilla es la escala por los m³ que salen de la presa, y sus bandas suman ese valor.
 */
async function revisarSankey(page, bloque, variante, etiqueta) {
  await esperarSankeyQuieto(page);
  const d = await page.locator("#gota-modulo svg.gota-svg").evaluate((svg) => ({
    variante: svg.dataset.variante,
    escala: Number(svg.dataset.escala),
    nodos: [...svg.querySelectorAll("rect[data-gota-nodo]")].map((r) => ({
      id: r.dataset.gotaNodo,
      valor: Number(r.dataset.valor),
      alto: Number(r.getAttribute("height")),
    })),
    bandas: [...svg.querySelectorAll("path[data-gota-banda]")].map((p) => ({
      id: p.dataset.gotaBanda,
      valor: Number(p.dataset.valor),
      ancho: Number(p.getAttribute("stroke-width")),
    })),
  }));
  check(`${etiqueta}: el Sankey muestra la variante «${variante}»`, d.variante === variante, d.variante);
  const esperados = Object.keys(CAMPOS_GOTA).filter((k) => bloque[CAMPOS_GOTA[k]] > 0);
  const malos = d.nodos.filter((n) => n.valor !== bloque[CAMPOS_GOTA[n.id]]);
  check(
    `${etiqueta}: cada nodo del Sankey lleva los m³ del cubo`,
    malos.length === 0 && esperados.every((k) => d.nodos.some((n) => n.id === k)),
    d.nodos.map((n) => `${n.id}=${n.valor}`).join(", "),
  );
  const bandasMal = d.bandas.filter((b) => Math.abs(b.ancho - Math.max(1, b.valor * d.escala)) > 0.5);
  check(
    `${etiqueta}: ancho de cada banda = escala común × m³`,
    d.escala > 0 && d.bandas.length > 0 && bandasMal.length === 0,
    `${d.bandas.length} bandas · escala ${d.escala.toExponential(3)} px/m³${bandasMal.length ? ` · mal: ${bandasMal.map((b) => b.id).join(", ")}` : ""}`,
  );
  const presa = d.nodos.find((n) => n.id === "presa");
  const salen = d.bandas.filter((b) => b.id.startsWith("presa-")).reduce((a, b) => a + b.valor, 0);
  const altoEsperado = bloque.m3_salen_presa * d.escala;
  check(
    `${etiqueta}: alto de La Boquilla = escala × m³ que salen de la presa, y sus bandas suman ese valor`,
    presa && Math.abs(presa.alto - altoEsperado) < 1 && Math.abs(salen - bloque.m3_salen_presa) < 1,
    presa ? `${presa.alto.toFixed(1)} px vs ${altoEsperado.toFixed(1)} px` : "sin nodo presa",
  );
  return { ...d, presa };
}

/**
 * La gota de una parcela (la ficha debe estar abierta). Sankey con los números del cubo; gotas una sola vez (o
 * ninguna con movimiento reducido); sin bloques de goteo, la nota; con ellos, botón, cifras, misma escala, tope.
 * capturas: { con, sin } = nombres de archivo para guardar La gota con goteo (tope encendido y apagado).
 */
async function pruebaGota(page, id, c, prefijo, reducida, capturas = null) {
  const capturar = async (nombre) => {
    if (!nombre) return;
    await page.locator("#gota-cifras").scrollIntoViewIfNeeded();
    await esperarSankeyQuieto(page);
    await page.screenshot({ path: path.join(CAPTURAS, nombre) });
  };
  const op = opcionGota(id, c);
  await page.locator("#seccion-gota").scrollIntoViewIfNeeded();
  if (!op?.gota) {
    check(`${prefijo}La gota de ${id} sin bloque gota: dice «Not available»`, (await texto(page, "#seccion-gota")).includes("Not available"));
    return;
  }
  if (!(op.gota.m3_salen_presa > 0)) {
    // Opción sin agua de presa (descanso o barbecho): no hay flujo que dibujar y la página lo dice.
    check(`${prefijo}La gota de ${id} sin agua de presa: dice que no hay flujo que seguir`, (await texto(page, "#seccion-gota")).includes("no flow to follow"));
    return;
  }
  const plan = await page.locator("#gota-modulo .gota-modulo").getAttribute("data-gota-plan");
  check(`${prefijo}La gota de ${id} se dibuja como Sankey (d3-sankey)`, plan === "sankey", plan ?? "sin módulo");
  const actual = await revisarSankey(page, op.gota, "actual", `${prefijo}La gota de ${id}, riego actual`);
  const celda = await page.locator('#gota-tabla td[data-flujo="presa"][data-variante="actual"]').textContent();
  check(`${prefijo}tabla oculta de La gota (lectores de pantalla) con los m³ del cubo`, celda === fmtM3(op.gota.m3_salen_presa), celda);
  const svg = page.locator("#gota-modulo svg.gota-svg");
  if (reducida) {
    check(`${prefijo}(movimiento reducido) La gota sin gotas animadas`, (await svg.getAttribute("data-gotas")) === "omitidas");
  } else {
    // Las gotas salen cuando el diagrama entra en pantalla, recorren las bandas una vez y desaparecen.
    await svg.scrollIntoViewIfNeeded();
    const fin = await page
      .waitForFunction(() => document.querySelector("#gota-modulo svg.gota-svg")?.dataset.gotas === "terminadas", null, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    check(`${prefijo}las gotas recorren las bandas una sola vez y terminan (sin animación infinita)`, fin && (await page.locator(".gota-gotita").count()) === 0);
  }

  const con = bloqueGota(op.gota_goteo_con_tope) ? op.gota_goteo_con_tope : null;
  const sin = bloqueGota(op.gota_goteo_sin_tope) ? op.gota_goteo_sin_tope : null;
  const boton = page.locator("#gota-goteo");
  if (!con && !sin) {
    check(`${prefijo}sin escenario de goteo en ${id}: no hay botón de goteo ni interruptor del tope`, (await boton.count()) === 0 && (await page.locator("#gota-tope-control").count()) === 0);
    const nota = page.locator("#gota-sin-goteo");
    check(
      `${prefijo}sin escenario de goteo en ${id}: nota «Drip scenario not available yet»`,
      (await nota.isVisible()) && (await nota.innerText()).includes("Drip scenario not available yet: no sourced drip efficiency."),
    );
    return;
  }
  check(`${prefijo}con escenario de goteo en ${id}: botón «What if this field switches to drip?» visible`, await boton.isVisible());
  // Con el teclado: Enter sobre el botón.
  await boton.focus();
  await page.keyboard.press("Enter");
  const g = con ?? sin;
  const variante = con ? "con_tope" : "sin_tope";
  const cifras = await texto(page, "#gota-cifras");
  const esperadaPresa = fmtCambio(g.m3_salen_presa / op.gota.m3_salen_presa - 1);
  const esperadaAcuifero = fmtCambio(g.m3_regresan_acuifero / op.gota.m3_regresan_acuifero - 1);
  check(
    `${prefijo}el goteo (con Enter) muestra «Dam water ${esperadaPresa}» y «Back to aquifer ${esperadaAcuifero}»`,
    (await boton.getAttribute("aria-pressed")) === "true" && cifras.includes("Dam water") && cifras.includes(esperadaPresa) && cifras.includes("Back to aquifer") && cifras.includes(esperadaAcuifero),
    cifras.replace(/\n/g, " "),
  );
  const goteo = await revisarSankey(page, g, variante, `${prefijo}La gota de ${id}, goteo`);
  const proporcion = goteo.presa.alto / actual.presa.alto;
  const esperada = g.m3_salen_presa / op.gota.m3_salen_presa;
  check(
    `${prefijo}misma escala en las variantes: la presa con goteo mide ${(esperada * 100).toFixed(1)} % de la del riego actual`,
    goteo.escala === actual.escala && Math.abs(proporcion - esperada) < 0.01,
    `${(proporcion * 100).toFixed(1)} %`,
  );
  await capturar(capturas?.[variante === "con_tope" ? "con" : "sin"]);
  // Etiqueta de las eficiencias del goteo (cubo.meta.goteo, de supuestos.json: «indicative, not local»): La gota la
  // muestra desde los datos, en los supuestos de la variante. Solo aplica al goteo del cubo (no a los bloques de prueba).
  const etiquetaGoteo = c.meta?.goteo?.disponible ? c.meta.goteo.ea_goteo?.etiqueta : null;
  if (etiquetaGoteo && (g.supuestos ?? []).some((x) => String(x).includes(etiquetaGoteo))) {
    const detalle = page.locator("#gota-modulo details.gota-mod-supuestos");
    if (!(await detalle.evaluate((el) => el.open))) {
      await detalle.locator("summary").focus();
      await page.keyboard.press("Enter");
    }
    const renglon = page.locator("#gota-supuestos li", { hasText: etiquetaGoteo });
    check(
      `${prefijo}el goteo lleva a la vista su etiqueta «${etiquetaGoteo}» (de los datos) en «Assumptions behind these flows»`,
      (await renglon.count()) > 0 && (await renglon.first().isVisible()),
    );
  } else if (c.meta?.goteo?.disponible) {
    check(`${prefijo}los bloques de goteo de ${id} llevan la etiqueta de cubo.meta.goteo en sus supuestos`, false, "ningún supuesto la trae");
  }
  if (con && sin && op.tope_consumo) {
    await page.locator("#gota-tope").click();
    const sinTope = await texto(page, "#gota-cifras");
    const et = fmtCambio(op.tope_consumo.et_goteo_sin_tope_m3 / op.tope_consumo.et_historica_m3 - 1);
    check(`${prefijo}sin tope: «Crop consumption (ET) ${et} vs. historical»`, sinTope.includes("Crop consumption (ET)") && sinTope.includes(et) && sinTope.includes("vs. historical"), sinTope.replace(/\n/g, " "));
    const alerta = page.locator("#gota-alerta");
    check(`${prefijo}sin tope: aviso «Not recommended» solo si cumple_sin_tope = false`, (await alerta.isVisible()) === (op.tope_consumo.cumple_sin_tope === false));
    await revisarSankey(page, sin, "sin_tope", `${prefijo}La gota de ${id}, goteo sin tope`);
    await capturar(capturas?.sin);
    await page.locator("#gota-tope").click();
  }
  await boton.click();
  check(`${prefijo}al quitar el goteo vuelve el riego actual y desaparecen las cifras`, (await svg.getAttribute("data-variante")) === "actual" && (await texto(page, "#gota-cifras")).trim() === "");
}

/** Espera a que la capa de rutas de relieve esté dibujada (o hasta unos segundos). */
async function esperarRutas(page) {
  let r = null;
  for (let i = 0; i < 25; i++) {
    r = await page.evaluate(() => window.raizDepuracion.rutasRelieve());
    if (r.visibilidad === "visible" && r.dibujadas > 0) break;
    await page.waitForTimeout(200);
  }
  return r;
}

/**
 * Capa «Terrain & runoff» y «Simulate a storm» (kit A9, parte web). Con movimiento reducido no hay animación.
 * Sin relieve en los datos, el bloque dice «Terrain layer: not run».
 */
async function pruebaRelieve(page, prefijo, reducida, captura = null) {
  const bloque = page.locator("#capa-relieve .relieve");
  const marca = await bloque.getAttribute("data-relieve");
  if (!hayRelieve) {
    check(`${prefijo}sin relieve en los datos: «Terrain layer: not run»`, marca === "no-corrido" && (await texto(page, "#capa-relieve")).includes("Terrain layer: not run"));
    return;
  }
  check(`${prefijo}capa de relieve lista en el grupo de capas (relieve.json y relieve_rutas.geojson)`, marca === "listo", marca);
  const interruptor = page.locator('#capa-relieve input[role="switch"]');
  check(`${prefijo}interruptor «Terrain & runoff» y botón «Simulate a storm»`, (await texto(page, "#capa-relieve")).includes("Terrain & runoff") && (await page.locator(".relieve-boton-tormenta").innerText()).includes("Simulate a storm"));
  const antes = await page.evaluate(() => window.raizDepuracion.rutasRelieve());
  check(`${prefijo}la capa de relieve está oculta por omisión`, antes.visibilidad === "none" && !(await interruptor.isChecked()), JSON.stringify(antes));
  await interruptor.check();
  const despues = await esperarRutas(page);
  check(`${prefijo}al encender «Terrain & runoff» la capa se ve y dibuja rutas en el mapa`, despues.visibilidad === "visible" && despues.dibujadas > 0, `${despues.dibujadas} tramos dibujados`);

  // Leyenda: umbral de las rutas, rótulo de escala y fuente, de relieve.json.
  const zonasRel = Object.values(relieve.zonas);
  const ley = await texto(page, "#capa-relieve .relieve-leyenda");
  check(
    `${prefijo}leyenda del relieve con el umbral (ha), el rótulo de escala y la fuente de relieve.json`,
    zonasRel.every((z) => ley.includes(`${fmt3(z.umbral_ruta_ha)} ha`) && ley.includes(z.rotulo)) && ley.includes(relieve.fuente),
    ley.replace(/\n/g, " ").slice(0, 160),
  );

  // Tormenta: lámina con su definición, periodo y fuente.
  await page.locator(".relieve-boton-tormenta").click();
  const tarjetaT = page.locator("#capa-relieve .relieve-tormenta");
  await tarjetaT.waitFor({ state: "visible", timeout: 5000 });
  const t = await tarjetaT.innerText();
  const tormentas = zonasRel.map((z) => z.tormenta);
  check(
    `${prefijo}«Simulate a storm» muestra la lámina (${tormentas.map((x) => `${fmt3(x.mm)} mm`).join(", ")}) con su definición, periodo y fuente`,
    tormentas.every((x) => t.includes(`${fmt3(x.mm)} mm`) && t.includes(x.fuente) && (!x.definicion || t.includes(x.definicion)) && (!x.periodo || t.includes(periodoEnPagina(x.periodo)))) && t.includes("not a forecast"),
    t.replace(/\n/g, " ").slice(0, 200),
  );
  const e = await page.evaluate(() => window.raizDepuracion.relieve());
  const lienzos = await page.locator(".relieve-lienzo-tormenta").count();
  if (reducida) {
    const anuncio = await page.locator('#capa-relieve [role="status"]').textContent();
    check(
      `${prefijo}(movimiento reducido) la tormenta no se anima: solo resalta las rutas`,
      !e.animando && e.resaltado && lienzos === 0 && (await bloque.getAttribute("data-animando")) === "false" && anuncio.includes("reduced motion"),
      `${JSON.stringify(e)} · «${anuncio}»`,
    );
  } else {
    check(`${prefijo}la tormenta anima gotas sobre las rutas`, e.animando && e.gotas > 0 && lienzos === 1, `${e.gotas} gotas`);
    // El panel se desplaza con suavidad hasta la tarjeta: se espera a que entre a la vista (unos cientos de ms).
    const aLaVista = await page
      .waitForFunction(() => {
        const el = document.querySelector("#capa-relieve .relieve-tormenta");
        const r = el.getBoundingClientRect();
        const panel = el.closest(".panel").getBoundingClientRect();
        return r.top >= panel.top - 1 && r.bottom <= panel.bottom + 1;
      }, null, { timeout: 2500 })
      .then(() => true)
      .catch(() => false);
    check(`${prefijo}en escritorio la tarjeta de la tormenta entra a la vista del panel`, aLaVista);
    if (captura) {
      await page.waitForTimeout(1200); // a mitad de la animación: las gotas ya bajan por las rutas
      await page.screenshot({ path: path.join(CAPTURAS, captura) });
    }
    const termina = await page
      .waitForFunction(() => !window.raizDepuracion.relieve().animando, null, { timeout: 8000 })
      .then(() => true)
      .catch(() => false);
    check(`${prefijo}la animación de la tormenta termina sola (unos 3 s) y quita su lienzo`, termina && (await page.locator(".relieve-lienzo-tormenta").count()) === 0);
  }
  await interruptor.uncheck();
  const fin = await page.evaluate(() => window.raizDepuracion.rutasRelieve());
  check(`${prefijo}al apagar «Terrain & runoff» la capa se oculta y la tarjeta de la tormenta también`, fin.visibilidad === "none" && (await tarjetaT.isHidden()));
}

/** Línea de relieve del renglón Soil (ficha abierta): pendiente, escurrimiento y depresiones, con el rótulo. */
async function pruebaRelieveFicha(page, id, prefijo) {
  const p = porId.get(id);
  const r = p.relieve;
  const lineas = page.locator("#ficha .renglon-suelo .relieve-parcela");
  const ops = opcionesDe(id);
  if (!r || !ops.length) return;
  const t = ops.length ? await lineas.first().innerText() : "";
  const rotulo = relieve?.zonas?.[p.zona ?? Object.keys(relieve?.zonas ?? {})[0]]?.rotulo;
  check(
    `${prefijo}renglón Soil de ${id}: línea de relieve en cada tarjeta, con la pendiente de la parcela y el rótulo de escala`,
    (await lineas.count()) === ops.length && t.includes("Terrain (context)") && (r.pendiente_media_pct == null || t.includes(`${nf({ maximumFractionDigits: 1 }).format(r.pendiente_media_pct)}%`)) && (!rotulo || t.includes(rotulo)),
    t.replace(/\n/g, " ").slice(0, 200),
  );
}

/** Maqueta de WhatsApp (kit C4): español, opciones numeradas, «Responda 1, 2 o 3.», aviso de Conagua. */
async function pruebaWhatsApp(page, id, prefijo, telefono, captura = null) {
  const ops = opcionesDe(id);
  const boton = page.locator("#boton-whatsapp");
  check(`${prefijo}botón «Preview WhatsApp message» en la ficha de ${id}`, (await boton.innerText()).includes("Preview WhatsApp message"));
  await boton.click();
  const maqueta = page.locator("#vista-whatsapp .wa-maqueta");
  await maqueta.waitFor({ state: "visible", timeout: 5000 });
  const t = await maqueta.innerText();
  const numeros = new Intl.ListFormat("es-MX", { type: "disjunction" }).format(ops.map((_, i) => new Intl.NumberFormat("es-MX").format(i + 1)));
  check(
    `${prefijo}maqueta de WhatsApp en español: ${ops.length} opciones numeradas y «Responda ${numeros}.»`,
    (await page.locator("#vista-whatsapp .wa-opcion").count()) === ops.length && t.includes(`Responda ${numeros}.`) && (await page.locator('#vista-whatsapp [lang="es"]').count()) > 0,
    t.split("\n").slice(0, 2).join(" "),
  );
  check(
    `${prefijo}maqueta con el aviso de Conagua y el de juicio local`,
    t.includes("Es una simulación; la asignación oficial la decide Conagua.") && t.includes("Esta herramienta apoya y no sustituye el juicio del agricultor ni del técnico."),
  );
  check(`${prefijo}la maqueta no envía nada (sin formularios ni enlaces)`, (await page.locator("#vista-whatsapp form, #vista-whatsapp a[href]").count()) === 0 && (await boton.getAttribute("aria-expanded")) === "true");
  if (l50(actualDe(id)) > Math.min(D1, D2)) {
    await fijarDeslizador(page, D1);
    const a = await maqueta.innerText();
    await fijarDeslizador(page, D2);
    const b = await maqueta.innerText();
    check(`${prefijo}la maqueta cambia con el deslizador (hectáreas que alcanzan)`, a !== b);
  }
  if (telefono) {
    const cabe = await page.evaluate(() => {
      const m = document.querySelector("#vista-whatsapp .wa-maqueta").getBoundingClientRect();
      const f = document.querySelector("#ficha");
      return m.left >= 0 && m.right <= window.innerWidth + 1 && f.scrollWidth <= f.clientWidth + 1;
    });
    check(`${prefijo}la maqueta cabe en el teléfono sin desplazamiento horizontal`, cabe);
  }
  if (captura) {
    await maqueta.scrollIntoViewIfNeeded();
    await esperarAnimaciones(page);
    await page.screenshot({ path: path.join(CAPTURAS, captura) });
  }
  await boton.click();
  check(`${prefijo}el botón vuelve a ocultar la maqueta`, (await page.locator("#vista-whatsapp").isHidden()) && (await boton.getAttribute("aria-expanded")) === "false");
}

/**
 * Con la ficha abierta, el mapa y el panel (#principal) quedan inert: el foco del teclado no se pierde detrás de
 * la ficha (WCAG 2.4.3 y 2.4.7). Los controles no: el deslizador se mueve con la ficha abierta. Al cerrar, todo
 * vuelve a ser operable y el foco regresa al botón de la lista.
 */
async function pruebaInert(page, id) {
  const abierto = await page.evaluate(() => ({
    principal: document.querySelector("#principal").inert,
    controles: document.querySelector("#controles").inert,
  }));
  check(`ficha de ${id} abierta: el mapa y el panel quedan inert; los controles no`, abierto.principal && !abierto.controles, JSON.stringify(abierto));
  await page.locator("#ficha-titulo").focus();
  const destinos = [];
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press("Shift+Tab");
    destinos.push(await page.evaluate(() => (document.activeElement.closest("#principal") ? "principal" : document.activeElement.id || document.activeElement.tagName)));
  }
  check(`ficha de ${id}: Shift+Tab desde el título no entra al mapa ni al panel tapados`, !destinos.includes("principal"), destinos.join(" → "));
  await page.locator("#ficha-cerrar").click();
  const cerrado = await page.evaluate(() => ({
    principal: document.querySelector("#principal").inert,
    foco: document.activeElement?.dataset?.id ?? document.activeElement?.id,
  }));
  check(`ficha de ${id} cerrada: el panel vuelve a ser operable y el foco regresa a la lista`, !cerrado.principal && cerrado.foco === id, JSON.stringify(cerrado));
  await abrirDesdeLista(page, id);
}

/** «Print field sheet» (kit C4): emulación de impresión, sin mapa ni controles, en una hoja (carta y A4). */
async function pruebaImpresion(page, id) {
  await page.evaluate(() => {
    window.__impresiones = 0;
    window.print = () => {
      window.__impresiones += 1;
    };
  });
  await page.locator("#boton-imprimir").click();
  const llamo = await page
    .waitForFunction(() => window.__impresiones > 0, null, { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  check(
    `«Print field sheet» de ${id} arma la hoja (valores usados, fuentes) y llama a imprimir`,
    llamo && (await page.locator("#ficha .impresion-datos").count()) === 1 && (await page.locator("#ficha .impresion-fuentes").count()) === 1,
  );
  await page.emulateMedia({ media: "print" });
  const ve = await page.evaluate(() => {
    const visible = (sel) => {
      const el = document.querySelector(sel);
      return Boolean(el && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden");
    };
    return {
      mapa: visible("#mapa"),
      panel: visible(".panel"),
      controles: visible("#controles"),
      ficha: visible("#ficha"),
      datos: visible("#ficha .impresion-datos"),
      gota: visible("#seccion-gota"),
      boton: visible("#boton-imprimir"),
      acciones: visible(".marca-acciones"),
    };
  });
  check("impresión: oculta el mapa, el panel, los controles y los botones", !ve.mapa && !ve.panel && !ve.controles && !ve.boton && !ve.acciones, JSON.stringify(ve));
  check("impresión: imprime la ficha con los valores usados y La gota estática", ve.ficha && ve.datos && ve.gota);
  const datos = await texto(page, "#ficha .impresion-datos");
  const D = Number(await page.locator("#dotacion").inputValue());
  check("impresión: la dotación elegida en la hoja es la del deslizador", datos.includes(`${nf({ maximumFractionDigits: 1 }).format(D)} thousand m³/ha`), datos.split("\n")[1] ?? "");
  for (const format of ["Letter", "A4"]) {
    const pdf = await page.pdf({ format, printBackground: true });
    const paginas = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
    check(`impresión: la ficha de ${id} (${opcionesDe(id).length} tarjetas) cabe en una hoja ${format}`, paginas === 1, `${paginas} páginas`);
  }
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_ficha_impresion.png"), fullPage: true });
  await page.emulateMedia({ media: "screen" });
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  check("tras imprimir se quitan los agregados de la hoja", (await page.locator("[data-impresion]").count()) === 0);
}

/** Pantalla de inicio de tres pasos (kit C5) en un contexto nuevo (sin la llave de sesión). */
async function pruebaInicio(navegador, base, opciones, etiqueta, prefijo, cerrarCon) {
  const ini = await abrir(navegador, base, opciones, etiqueta, {}, { inicio: true });
  const { page } = ini;
  const dialogo = page.locator('.acerca-inicio [role="dialog"]');
  check(`${prefijo}la pantalla de inicio aparece en la primera visita (diálogo modal)`, (await dialogo.isVisible()) && (await dialogo.getAttribute("aria-modal")) === "true");
  const pasos = await page.locator("ol.acerca-inicio-pasos > li strong").allInnerTexts();
  check(
    `${prefijo}tres pasos en orden: Set the water allocation · Tap a field · Compare rotations`,
    JSON.stringify(pasos) === JSON.stringify(["Set the water allocation", "Tap a field", "Compare rotations"]),
    pasos.join(" · "),
  );
  check(`${prefijo}el foco entra al diálogo de inicio`, await page.evaluate(() => Boolean(document.activeElement?.closest(".acerca-inicio"))));
  if (opciones.isMobile) {
    const cabe = await page.locator(".acerca-inicio-tarjeta").evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left >= 0 && r.right <= window.innerWidth + 1 && document.documentElement.scrollWidth <= window.innerWidth + 1;
    });
    check(`${prefijo}la pantalla de inicio cabe en el teléfono`, cabe);
  }
  await page.screenshot({ path: path.join(CAPTURAS, `${opciones.isMobile ? "telefono" : "escritorio"}_inicio.png`) });
  if (cerrarCon === "Escape") await page.keyboard.press("Escape");
  else await page.locator(".acerca-inicio-boton").click();
  check(`${prefijo}la pantalla de inicio se cierra con ${cerrarCon === "Escape" ? "Escape" : "«Start exploring»"}`, (await page.locator(".acerca-inicio").count()) === 0);
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("body[data-listo='si']", { timeout: 15000 });
  check(`${prefijo}cerrada una vez, no vuelve a aparecer en la sesión`, (await page.locator(".acerca-inicio").count()) === 0);
  await page.locator("#boton-inicio").click();
  check(`${prefijo}«How it works» vuelve a abrir los tres pasos`, await dialogo.isVisible());
  await page.locator(".acerca-inicio-x").click();
  check(`${prefijo}la «×» cierra la pantalla de inicio`, (await page.locator(".acerca-inicio").count()) === 0);
  check(`${prefijo}inicio: sin errores de consola`, ini.errores.length === 0, ini.errores.join(" | "));
  await ini.ctx.close();
}

/** «About & Data» (kit C5): carga perezosa, cinco pruebas con su estado, «Not run» visible, Escape la cierra. */
async function pruebaAcerca(page, peticiones, prefijo, telefono, captura) {
  const pedidos = () => peticiones.filter((u) => /\/data\/(manifest|pruebas)\.json(\?|$)/.test(u));
  check(`${prefijo}manifest.json y pruebas.json no se piden al cargar la página`, pedidos().length === 0, pedidos().join(", "));
  const fichaAbierta = await page.locator("#ficha").isVisible();
  await page.locator("#boton-acerca").click();
  await page.waitForSelector("body[data-acerca='listo']", { timeout: 10000 });
  const dlg = page.locator("#acerca");
  check(
    `${prefijo}«About & Data» se abre como diálogo modal y entonces lee manifest.json y pruebas.json`,
    (await dlg.isVisible()) && (await dlg.evaluate((d) => d.open && d.matches(":modal"))) && pedidos().length >= 2,
    pedidos().map((u) => u.split("/").pop()).join(", "),
  );
  check(`${prefijo}el diálogo se nombra con su título «About & Data»`, await dlg.evaluate((d) => document.getElementById(d.getAttribute("aria-labelledby"))?.textContent.trim() === "About & Data"));
  if (pruebasWeb) {
    const items = await page.locator("#acerca .acerca-prueba").evaluateAll((xs) => xs.map((x) => ({ id: x.dataset.prueba, estado: x.dataset.estado })));
    check(
      `${prefijo}About & Data: las cinco pruebas de S9 §6 con el estado de pruebas.json`,
      items.length === 5 && pruebasWeb.pruebas.length === 5 && pruebasWeb.pruebas.every((p, i) => items[i]?.id === p.id && items[i]?.estado === p.estado),
      items.map((x) => `${x.id}: ${x.estado}`).join(" · "),
    );
    const hayNoCorrida = pruebasWeb.pruebas.some((p) => p.estado === "not run" || (p.partes ?? []).some((x) => x.estado === "not run"));
    if (hayNoCorrida) {
      const insignia = page.locator("#acerca .acerca-prueba .acerca-estado--not-run").first();
      await insignia.scrollIntoViewIfNeeded();
      check(`${prefijo}About & Data: «Not run» visible, con la misma insignia que los demás resultados`, (await insignia.isVisible()) && (await insignia.innerText()).includes("Not run"));
    }
    if (pruebasWeb.enlaces?.repositorio) {
      check(`${prefijo}About & Data: liga al repositorio`, (await page.locator(`#acerca a[href="${pruebasWeb.enlaces.repositorio}"]`).count()) > 0);
    }
  } else {
    check(`${prefijo}sin pruebas.json, About & Data lo dice`, (await texto(page, "#acerca")).includes("Test results are not available"));
  }
  if (existe("manifest.json")) {
    check(`${prefijo}About & Data: tabla de datos NASA leída de manifest.json`, (await page.locator("#acerca .acerca-tabla tbody tr[data-familia]").count()) > 0);
  }
  if (telefono) {
    const cabe = await dlg.evaluate((d) => d.getBoundingClientRect().right <= window.innerWidth + 1 && d.scrollWidth <= d.clientWidth + 1);
    check(`${prefijo}About & Data cabe en el teléfono sin desplazamiento horizontal`, cabe);
  }
  await page.locator("#acerca .acerca-titulo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, captura) });
  await page.keyboard.press("Escape");
  check(
    `${prefijo}Escape cierra «About & Data»${fichaAbierta ? " y deja abierta la ficha" : ""} y devuelve el foco al botón`,
    !(await dlg.evaluate((d) => d.open)) && (await page.locator("#ficha").isVisible()) === fichaAbierta && (await page.evaluate(() => document.activeElement?.id)) === "boton-acerca",
  );
}

// ---------------------------------------------------------------- pruebas de escritorio
async function pruebasEscritorio(page, peticiones) {
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

  // Una sola zona (o sin cubo.zonas): el selector «Pilot area» no aparece
  const nZonas = Object.keys(cubo.zonas ?? {}).length;
  if (nZonas < 2) check(`con ${nZonas || "ninguna"} zona en cubo.zonas el selector «Pilot area» no aparece`, await page.locator("#selector-zona").isHidden());
  else check("con varias zonas en cubo.zonas el selector «Pilot area» aparece", await page.locator("#selector-zona").isVisible());

  // Localidades del equipo: listadas en texto (con su fuente) si el cubo las trae
  const locs = Array.isArray(cubo.localidades) ? cubo.localidades : [];
  if (locs.length) {
    const textoLoc = await texto(page, "#bloque-localidades");
    check(
      "localidades del equipo listadas en texto con su fuente",
      (await page.locator("#lista-localidades li").count()) === locs.length && locs.every((l) => textoLoc.includes(l.nombre)) && textoLoc.includes(locs[0].fuente),
      `${locs.length} localidades`,
    );
    check("la leyenda dice «Team reference localities (not fields)»", textoLoc.includes("Team reference localities (not fields)"));
    // Las etiquetas de localidades fuera de la vista se ocultan: ninguna visible asoma cortada por el borde del mapa.
    const cortadas = await page.evaluate(() => {
      const caja = document.querySelector("#mapa").getBoundingClientRect();
      return [...document.querySelectorAll(".etiqueta-localidad")]
        .filter((el) => el.getClientRects().length)
        .filter((el) => el.getBoundingClientRect().left < caja.left)
        .map((el) => el.textContent);
    });
    check("ninguna etiqueta de localidad visible queda cortada por el borde izquierdo del mapa", cortadas.length === 0, cortadas.join(", "));
  } else {
    check("sin cubo.localidades no aparece el bloque de localidades", await page.locator("#bloque-localidades").isHidden());
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
    if (capa === "cultivos") {
      // Nada depende solo del color: cada cultivo de la leyenda lleva su propia trama (WCAG 1.4.1).
      const tramas = await page.locator("#leyenda li .muestra").evaluateAll((xs) => xs.map((x) => [...x.classList].find((c) => c.startsWith("trama-"))));
      check("capa cultivos: una trama distinta por cultivo en la leyenda", tramas.length > 0 && new Set(tramas).size === tramas.length, tramas.join(", "));
    }
    if (anio) await checkContraste(page, "#leyenda .muestra-letra", `capa ${capa}: letras de la leyenda`);
  }
  await page.locator('input[name="colorear"][value="plazo"]').check();
  await checkContraste(page, "#leyenda .muestra-letra", "leyenda «Water term»");
  await page.locator('input[name="colorear"][value="semaforo"]').check();
  await checkContraste(page, "#leyenda .muestra-letra", "leyenda «Enough water?»");
  await checkContraste(page, "#conteos-semaforo .sem-circulo, #conteos-plazo .sem-circulo", "conteos del panel");
  await checkContraste(page, ".boton-parcela .sem-circulo", "círculos de la lista de parcelas");

  // Capa «Terrain & runoff» y «Simulate a storm» (con animación: el escritorio no pide movimiento reducido)
  await pruebaRelieve(page, "", false, "escritorio_relieve_tormenta.png");

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

  // Filtros oficiales (B3) con «estado»: la decisión pide tres estados y que «needs local check» NUNCA se vea
  // como aprobado. Se revisa una opción de cada estado que el cubo traiga, leyendo el renglón por su texto.
  const conEstado = Object.entries(cubo.parcelas).flatMap(([pid, p]) =>
    p.opciones.flatMap((o) => (o.filtros ?? []).filter((f) => f.estado).map((f) => ({ pid, o, f }))),
  );
  for (const estado of ["needs_local_check", "warning", "passes"]) {
    const caso = conEstado.find((x) => x.f.estado === estado);
    if (!caso) continue;
    await abrirDesdeLista(page, caso.pid);
    const renglon = tarjeta(page, caso.o.id).locator(".filtros li", { hasText: caso.f.motivo }).first();
    const visto = (await renglon.count()) ? (await renglon.innerText()).replace(/\s+/g, " ").trim() : "";
    // «Aprobado» = la marca ✓ o las palabras «passes»/«passed» fuera del texto del filtro («Does not pass» no lo es).
    const comoAprobado = visto.includes("✓") || /\bpasse[sd]\b/i.test(visto.replace(caso.f.motivo, ""));
    if (estado === "passes") {
      check(`filtro «${caso.f.id}» (passes) en ${caso.pid}/${caso.o.id}: se ve con su texto`, visto.includes(caso.f.motivo), visto);
    } else {
      check(`filtro «${caso.f.id}» (${estado}) en ${caso.pid}/${caso.o.id}: NO se dibuja como aprobado`, visto !== "" && !comoAprobado, visto || "sin renglón");
      if (estado === "needs_local_check") check(`filtro «${caso.f.id}» en ${caso.pid}/${caso.o.id}: dice «needs a local check»`, /needs a local check/i.test(visto), visto);
    }
    await cerrarFicha(page);
  }
  if (!conEstado.length) omitir("filtros oficiales con estado (passes / warning / needs local check)", "el cubo no trae filtros: opciones_b3.json no ha llegado");

  // Clic en el mapa abre la ficha: una parcela clasificada (protagonista si hay) y una abstenida
  const clasificada = candidatos.find((id) => !porId.get(id).abstencion) ?? candidatos[0];
  const aClicar = [clasificada];
  for (const id of [...abstenidas].sort((x, y) => porId.get(y).area_ha - porId.get(x).area_ha).slice(0, 5)) {
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

  // Ficha de la primera protagonista (o de la parcela clasificada): La gota (Sankey), relieve, WhatsApp, Why?
  const conFlujo = candidatos.find((id) => !porId.get(id).abstencion && opcionGota(id)?.gota?.m3_salen_presa > 0);
  const idFicha = conFlujo ?? clasificada;
  if (conFlujo && conFlujo !== clasificada && opcionGota(clasificada)?.gota) {
    // La protagonista en descanso también se prueba: su Gota no tiene flujo y debe decirlo.
    await abrirDesdeLista(page, clasificada);
    await pruebaGota(page, clasificada, cubo, "", false);
    await cerrarFicha(page);
  }
  await abrirDesdeLista(page, idFicha);
  await pruebaGota(page, idFicha, cubo, "", false, { con: "escritorio_gota_goteo_con_tope.png", sin: "escritorio_gota_goteo_sin_tope.png" });
  await pruebaRelieveFicha(page, idFicha, "");
  await pruebaWhatsApp(page, idFicha, "", false, "escritorio_ficha_whatsapp.png");
  if (await tarjeta(page, "ACTUAL").count()) await tarjeta(page, "ACTUAL").locator(".porque summary").click();
  await page.locator("#ficha").evaluate((el) => { el.scrollTop = 0; });
  await esperarAnimaciones(page);
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_ficha.png") });
  // Tarjetas arriba de la ficha (bajo su cabecera fija), con el panel Why? abierto en la opción actual.
  await page.locator("#t-opciones").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_ficha_tarjetas.png") });
  await page.locator("#seccion-gota").scrollIntoViewIfNeeded();
  await esperarAnimaciones(page);
  await page.waitForTimeout(1000); // transición d3 del Sankey (no es animación CSS)
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_ficha_gota.png") });

  // «About & Data» con la ficha abierta: Escape cierra el diálogo, no la ficha (antes de imprimir, que lee manifest.json).
  await pruebaAcerca(page, peticiones, "", false, "escritorio_acerca.png");
  await cerrarFicha(page);

  // Ficha imprimible: la parcela con más tarjetas (peor caso para que quepa en una hoja).
  const masOpciones = candidatos.filter((id) => !porId.get(id).abstencion).sort((a, b) => opcionesDe(b).length - opcionesDe(a).length)[0];
  if (masOpciones) {
    await abrirDesdeLista(page, masOpciones);
    await pruebaInert(page, masOpciones);
    await checkContraste(page, "#ficha .sem-circulo", `ficha de ${masOpciones}: círculos de los renglones`);
    await checkContraste(page, "#ficha .leyenda-memoria .muestra-letra, #ficha .franja .caja", `ficha de ${masOpciones}: letras de la memoria`);
    await pruebaImpresion(page, masOpciones);
    await cerrarFicha(page);
  } else {
    omitir("ficha imprimible", "ninguna parcela clasificada en estos datos");
  }
}

// ---------------------------------------------------------------- pruebas de teléfono
async function pruebasTelefono(page, peticiones) {
  const sinDesborde = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  check("teléfono: sin desplazamiento horizontal de la página", sinDesborde);
  // Reflujo (WCAG 1.4.10): a 320 px de ancho tampoco hay desplazamiento horizontal (rutas largas del pie).
  const tamano = page.viewportSize();
  await page.setViewportSize({ width: 320, height: tamano.height });
  const a320 = await page.evaluate(() => ({ pagina: document.documentElement.scrollWidth, ventana: document.documentElement.clientWidth }));
  check("teléfono: a 320 px, sin desplazamiento horizontal", a320.pagina <= a320.ventana, JSON.stringify(a320));
  await page.setViewportSize(tamano);
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
  await page.locator("#t-campos").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_lista.png") });
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_centro_control_completa.png"), fullPage: true });

  // Relieve con movimiento reducido (este contexto lo pide): la tormenta solo resalta las rutas.
  await pruebaRelieve(page, "teléfono: ", true);

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
  await pruebaGota(page, id, cubo, "teléfono: ", true, { con: "telefono_gota_goteo_con_tope.png", sin: "telefono_gota_goteo_sin_tope.png" });
  await page.locator("#seccion-gota").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_ficha_gota.png") });
  await pruebaWhatsApp(page, id, "teléfono: ", true, "telefono_ficha_whatsapp.png");
  await cerrarFicha(page);

  // «About & Data» en el teléfono (pantalla completa).
  await page.evaluate(() => window.scrollTo(0, 0));
  await pruebaAcerca(page, peticiones, "teléfono: ", true, "telefono_acerca.png");

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
 * - el caso de goteo que los datos NO traen, en la opción ACTUAL de una parcela clasificada que pide agua: si el
 *   cubo no trae goteo, se derivan bloques de prueba escalando su bloque «gota» (NO son datos: solo ejercitan el
 *   botón y las barras); si lo trae, se le quitan, para probar la nota «Drip scenario not available yet».
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

  const conGota = candidatos.filter((id) => id !== idAbst && !porId.get(id).abstencion && actualDe(id, c)?.gota);
  // Primero una parcela cuya opción actual pide agua: sin flujo no hay botón de goteo ni nota que probar.
  const idGoteo = conGota.find((id) => actualDe(id, c).gota.m3_salen_presa > 0) ?? conGota[0];
  const op = idGoteo && actualDe(idGoteo, c);
  if (op && op.gota_goteo_con_tope) {
    // El cubo ya trae goteo (se prueba con los datos): aquí se quita, para probar la nota de «no disponible».
    Object.assign(op, { gota_goteo_con_tope: null, gota_goteo_sin_tope: null, tope_consumo: null });
  } else if (op) {
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
  // Una parcela CLASIFICADA sin opciones (zona sin clima): el cubo la marca con el código «sin_clima_zona».
  const idSinCalculo = candidatos.find(
    (id) => id !== idAbst && id !== idGoteo && !porId.get(id).abstencion && !porId.get(id).protagonista && actualDe(id, c),
  );
  if (idSinCalculo) c.parcelas[idSinCalculo] = { opciones: [], sin_opciones: "sin_clima_zona" };
  return { c, g, primera, quitada, idAbst, pAbst, idGoteo, idSinCalculo };
}

/** Parcela clasificada sin opciones: su propia clase, fuera del denominador, y el motivo en la ficha y el mensaje. */
async function pruebaSinCalculo(page, v) {
  const id = v.idSinCalculo;
  const fila = await page.locator(`.boton-parcela[data-id="${id}"] .p-detalle`).innerText();
  check(`clasificada sin opciones ${id}: la lista dice «Not computed yet», no «Not classified»`, fila.includes("Not computed yet") && !fila.includes("Not classified"), fila);
  const conteos = await texto(page, "#conteos-semaforo");
  check("clasificada sin opciones: los conteos tienen su propia clase", conteos.includes("Not computed yet"), conteos.replace(/\n/g, " · "));
  const D = Number(await page.locator("#dotacion").inputValue());
  const cz = conteosZona(v.g.features, v.c, D, 0);
  const segunda = await texto(page, "#indicador-segunda");
  check(
    "clasificada sin opciones: no cuenta en el denominador del indicador",
    segunda.includes(`of ${nf({ maximumFractionDigits: 0 }).format(cz.clasificadas - 1)}`) && segunda.includes("not counted"),
    segunda,
  );
  await abrirDesdeLista(page, id);
  const cuerpo = await texto(page, "#ficha-cuerpo");
  check(`ficha de ${id}: dice que falta el clima de su zona (no que el mapa no sabe qué hay)`,
    cuerpo.includes("no climate data for this field's pilot area") && !cuerpo.includes("not sure what grows"), cuerpo.split("\n").slice(0, 8).join(" | "));
  await page.locator("#boton-whatsapp").click();
  const wa = await texto(page, "#vista-whatsapp");
  check(`WhatsApp de ${id}: «falta el clima de su zona», sin «no está seguro»`, wa.includes("falta el clima de su zona") && !wa.includes("no está seguro"), wa.split("\n")[1] ?? wa);
  await cerrarFicha(page);
}

// ---------------------------------------------------------------- variante de dos zonas (en memoria)
/** Extensión {o, s, e, n} de un conjunto de features. */
function extensionDe(features) {
  const ext = { o: Infinity, s: Infinity, e: -Infinity, n: -Infinity };
  const recorrer = (c) => {
    if (typeof c[0] === "number") {
      ext.o = Math.min(ext.o, c[0]); ext.e = Math.max(ext.e, c[0]);
      ext.s = Math.min(ext.s, c[1]); ext.n = Math.max(ext.n, c[1]);
    } else c.forEach(recorrer);
  };
  for (const f of features) recorrer(f.geometry.coordinates);
  return ext;
}
function trasladar(geom, dx, dy) {
  const mover = (c) => (typeof c[0] === "number" ? [c[0] + dx, c[1] + dy, ...c.slice(2)] : c.map(mover));
  return { ...geom, coordinates: mover(geom.coordinates) };
}

/** Bloque de zona como lo arma motor/b4_cubo.py (bloque_zona): mismo cálculo, sobre las parcelas de la zona. */
function bloqueZona(nombre, props, c) {
  const red = (v) => Math.round(v * 100) / 100;
  const noAbst = props.filter((p) => !p.abstencion);
  const perennes = noAbst.filter((p) => ["alfalfa", "nogal"].includes(p.cultivo_actual) && (c.parcelas[p.id]?.opciones ?? []).length);
  const llaves = c.lluvia_pct.map(String);
  const demanda = Object.fromEntries(
    llaves.map((r) => [
      r,
      Object.fromEntries(["p10", "p50", "p90"].map((q) => [q, red(perennes.reduce((s, p) => s + p.area_ha * c.parcelas[p.id].opciones[0].agua.lamina_bruta[r][q], 0))])),
    ]),
  );
  const estados = props.map((p) => p.estado_plazo ?? null);
  const cuenta = (e) => estados.filter((x) => x === e).length;
  return {
    nombre,
    superficie_total_ha: red(props.reduce((s, p) => s + p.area_ha, 0)),
    superficie_clasificada_ha: red(noAbst.reduce((s, p) => s + p.area_ha, 0)),
    superficie_abstenida_ha: red(props.filter((p) => p.abstencion).reduce((s, p) => s + p.area_ha, 0)),
    superficie_perenne_ha: red(perennes.reduce((s, p) => s + p.area_ha, 0)),
    demanda_perenne_millares: demanda,
    conteos: { total: props.length, libre: cuenta("libre"), por_vencer: cuenta("por_vencer"), comprometida: cuenta("comprometida"), abstenida: cuenta(null) },
  };
}

/**
 * Cubo y geojson de DOS zonas derivados de los datos actuales (solo en la memoria de la prueba; NO son datos):
 * - las parcelas del sur (el último ~40 % en el orden de los ids, salvo las protagonistas) pasan a la segunda zona de
 *   params.zona_piloto.zonas, con ids «<prefijo><n>» y sus geometrías trasladadas al centro del bbox de esa zona;
 * - las de la primera zona pierden la propiedad «zona» (compatibilidad: sin propiedad = la primera zona);
 * - cubo.zonas con los dos bloques recalculados aquí y cubo.localidades de params.zona_piloto.localidades_equipo.
 */
function varianteDosZonas() {
  const zp = params.zona_piloto ?? {};
  const zonas = zp.zonas?.valor ?? [];
  if (zonas.length < 2) return null;
  const [za, zb] = zonas;
  const c = structuredClone(cubo);
  const g = structuredClone(parcelas);
  if (Object.keys(cubo.zonas ?? {}).length >= 2) {
    // Los datos ya traen dos zonas REALES: se prueban tal cual, sin derivar ni reetiquetar nada.
    const zonaDe = (f) => f.properties.zona ?? za.id;
    return { c, g, za, zb, porZona: { [za.id]: g.features.filter((f) => zonaDe(f) === za.id), [zb.id]: g.features.filter((f) => zonaDe(f) === zb.id) } };
  }
  const corte = Math.floor(g.features.length * 0.6);
  const mudar = g.features.filter((f, i) => i >= corte && !f.properties.protagonista);
  const quedan = g.features.filter((f) => !mudar.includes(f));
  const ext = extensionDe(mudar);
  const dx = (zb.bbox[0] + zb.bbox[2]) / 2 - (ext.o + ext.e) / 2;
  const dy = (zb.bbox[1] + zb.bbox[3]) / 2 - (ext.s + ext.n) / 2;
  mudar.forEach((f, k) => {
    const viejo = f.properties.id;
    const nuevo = `${zb.prefijo_id}${String(k + 1).padStart(viejo.length - 1, "0")}`;
    f.properties.id = nuevo;
    f.properties.zona = zb.id;
    f.geometry = trasladar(f.geometry, dx, dy);
    c.parcelas[nuevo] = c.parcelas[viejo];
    delete c.parcelas[viejo];
  });
  for (const f of quedan) delete f.properties.zona;
  const bloque = (z, fs) => ({ ...bloqueZona(z.id, fs.map((f) => f.properties), c), nombre_mostrar: z.nombre, bbox: z.bbox, clima_disponible: true });
  c.zonas = { [za.id]: bloque(za, quedan), [zb.id]: bloque(zb, mudar) };
  const loc = zp.localidades_equipo ?? {};
  c.localidades = (loc.valor ?? []).map((l) => ({ ...l, fuente: loc.fuente }));
  return { c, g, za, zb, porZona: { [za.id]: quedan, [zb.id]: mudar } };
}

/** Pruebas de la variante de dos zonas (escritorio). */
async function pruebasDosZonas(page, v) {
  const { c, g, za, zb, porZona } = v;
  const D = D2;
  await fijarDeslizador(page, D);
  const pct = (x) => new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(x).replace("-", "−");
  const n0 = (x) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(x);
  const sel = page.locator("#zona-sel");

  check("dos zonas: el selector «Pilot area» aparece", await page.locator("#selector-zona").isVisible());
  const opciones = await sel.locator("option").allInnerTexts();
  const esperadas = ["All areas", ...Object.values(c.zonas).map((z) => z.nombre_mostrar)];
  check("dos zonas: opciones = «All areas» + nombre_mostrar de cada zona", JSON.stringify(opciones) === JSON.stringify(esperadas), opciones.join(" | "));

  /** Lo que la página debe mostrar para un conjunto de parcelas y su bloque de zona. */
  async function revisar(etiqueta, bloque, features, prefijo) {
    const ac = aguaComprometida(bloque, D, 0);
    const cnt = conteosZona(features, c, D, 0);
    const ind = await indicador(page);
    check(
      `dos zonas (${etiqueta}): el indicador usa su bloque de zona (${pct(ac.p50)}, rango ${pct(ac.p10)}–${pct(ac.p90)})`,
      ind.includes(pct(ac.p50)) && ind.includes(`Likely range: ${pct(ac.p10)} to ${pct(ac.p90)}`) && ind.includes("at least") === ac.alMenos,
      `${await texto(page, "#indicador-cifra")} · ${await texto(page, "#indicador-rango")}`,
    );
    const segunda = await texto(page, "#indicador-segunda");
    check(`dos zonas (${etiqueta}): segunda cifra con las parcelas de la zona (${cnt.rojo} of ${cnt.clasificadas})`, segunda.includes(`${n0(cnt.rojo)} of ${n0(cnt.clasificadas)}`), segunda);
    const sem = await page.locator("#conteos-semaforo .n").allInnerTexts();
    const plazo = await page.locator("#conteos-plazo .n").allInnerTexts();
    const esperadoSem = ["verde", "ambar", "rojo", "gris"].map((k) => n0(cnt[k]));
    const esperadoPlazo = ["libre", "por_vencer", "comprometida", "sin_dato"].map((k) => n0(cnt[k]));
    check(
      `dos zonas (${etiqueta}): conteos del panel solo con sus parcelas`,
      JSON.stringify(sem) === JSON.stringify(esperadoSem) && JSON.stringify(plazo) === JSON.stringify(esperadoPlazo),
      `${sem.join("/")} · ${plazo.join("/")}`,
    );
    const ids = await page.locator(".boton-parcela:visible").evaluateAll((bs) => bs.map((b) => b.dataset.id));
    check(
      `dos zonas (${etiqueta}): la lista muestra solo sus ${features.length} parcelas${prefijo ? ` (ids «${prefijo}…»)` : ""}`,
      ids.length === features.length && (!prefijo || ids.every((id) => id.startsWith(prefijo))),
      `${ids.length} en la lista`,
    );
    const dibujadas = await page.evaluate(() => window.raizDepuracion.parcelasDibujadas());
    check(`dos zonas (${etiqueta}): el mapa encuadra y dibuja sus ${features.length} parcelas`, dibujadas === features.length, `${dibujadas} dibujadas`);
    return ind;
  }

  const indTodas = await revisar("All areas", c.zona, g.features, null);
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_dos_zonas_todas.png") });

  await sel.selectOption(zb.id);
  const indB = await revisar(zb.nombre, c.zonas[zb.id], porZona[zb.id], zb.prefijo_id);
  // Relieve por zona: la zona sin bloque en relieve.json dice «not run for this pilot area» y apaga sus controles.
  if (hayRelieve) {
    const conRelieve = Boolean(relieve.zonas[zb.id]);
    const textoRel = await texto(page, "#capa-relieve");
    const apagados = await page.locator(".relieve-boton-tormenta").isDisabled();
    check(
      `dos zonas: relieve de ${zb.nombre} ${conRelieve ? "disponible" : "«not run for this pilot area», con los controles apagados"}`,
      conRelieve ? !apagados : textoRel.includes("Terrain layer: not run for this pilot area.") && apagados,
    );
  }
  check(`dos zonas: cambiar a ${zb.nombre} cambia el indicador`, indB !== indTodas);
  check("dos zonas: el resumen de la lista nombra la zona", (await texto(page, "#lista-resumen")).includes(zb.nombre));
  // La localidad de la segunda zona cae en su encuadre: su punto y su etiqueta se ven.
  const locB = c.localidades.find((l) => l.lon >= zb.bbox[0] && l.lon <= zb.bbox[2] && l.lat >= zb.bbox[1] && l.lat <= zb.bbox[3]);
  if (locB) {
    const dibujadas = await page.evaluate(() => window.raizDepuracion.localidadesDibujadas());
    const etiqueta = page.locator(".etiqueta-localidad", { hasText: locB.nombre });
    check(`dos zonas: la localidad ${locB.nombre} se dibuja en el mapa de ${zb.nombre}`, dibujadas.includes(locB.nombre) && (await etiqueta.isVisible()), dibujadas.join(", "));
  } else {
    omitir("dos zonas: localidad dentro de la segunda zona", "ninguna localidad de params cae en su bbox");
  }
  await page.evaluate(() => window.raizDepuracion.esperarMapa());
  await page.screenshot({ path: path.join(CAPTURAS, `escritorio_dos_zonas_${zb.id}.png`) });

  // Ficha abierta de una parcela de la segunda zona: se cierra al cambiar a la primera.
  const idB = porZona[zb.id][0].properties.id;
  await abrirDesdeLista(page, idB);
  await sel.selectOption(za.id);
  check(`dos zonas: la ficha de ${idB} se cierra al cambiar a ${za.nombre}`, await page.locator("#ficha").isHidden());
  const indA = await revisar(za.nombre, c.zonas[za.id], porZona[za.id], za.prefijo_id);
  check(`dos zonas: cambiar a ${za.nombre} cambia el indicador`, indA !== indB && indA !== indTodas);
  if (hayRelieve && relieve.zonas[za.id]) {
    const t = await texto(page, "#capa-relieve .relieve-leyenda").catch(() => "");
    check(
      `dos zonas: con ${za.nombre} vuelve la capa de relieve con su tormenta`,
      !(await page.locator(".relieve-boton-tormenta").isDisabled()) && (await page.locator("#capa-relieve .relieve-aviso").isHidden()),
      t.slice(0, 80),
    );
  }

  // Localidades: listadas en texto con su fuente; «Show on map» las lleva al mapa.
  const textoLoc = await texto(page, "#bloque-localidades");
  check(
    "dos zonas: localidades listadas en texto con la leyenda y su fuente",
    textoLoc.includes("Team reference localities (not fields)") && c.localidades.every((l) => textoLoc.includes(l.nombre)) && textoLoc.includes(c.localidades[0].fuente),
  );
  check("dos zonas: una etiqueta en el mapa por localidad", (await page.locator(".etiqueta-localidad").count()) === c.localidades.length);
  const locA = c.localidades.find((l) => l !== locB);
  if (locA) {
    await page.locator(".boton-localidad", { hasText: locA.nombre }).click();
    const dibujadas = await page.evaluate(() => window.raizDepuracion.localidadesDibujadas());
    const etiqueta = page.locator(".etiqueta-localidad", { hasText: locA.nombre });
    check(
      `dos zonas: «Show on map» de ${locA.nombre} la dibuja y resalta su etiqueta`,
      dibujadas.includes(locA.nombre) && (await etiqueta.isVisible()) && (await etiqueta.getAttribute("class")).includes("activa"),
      dibujadas.join(", "),
    );
    await page.screenshot({ path: path.join(CAPTURAS, "escritorio_dos_zonas_localidad.png") });
  }

  // De vuelta a todas las zonas: indicador del bloque total y lista completa.
  await sel.selectOption("");
  check("dos zonas: «All areas» vuelve al indicador total", (await indicador(page)) === indTodas);
  check("dos zonas: «All areas» vuelve a la lista completa", (await page.locator(".boton-parcela:visible").count()) === g.features.length);
}

/** Variante de dos zonas en el teléfono: el selector cabe y cambia la zona. */
async function pruebasDosZonasTelefono(page, v) {
  check("teléfono, dos zonas: el selector «Pilot area» aparece", await page.locator("#selector-zona").isVisible());
  await page.locator("#zona-sel").selectOption(v.zb.id);
  const n = await page.locator(".boton-parcela:visible").count();
  check(`teléfono, dos zonas: la lista muestra las ${v.porZona[v.zb.id].length} parcelas de ${v.zb.nombre}`, n === v.porZona[v.zb.id].length, `${n}`);
  check("teléfono, dos zonas: sin desplazamiento horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  const alto = await page.evaluate(() => document.querySelector("#controles").offsetHeight / window.innerHeight);
  check("teléfono, dos zonas: los controles fijos ocupan menos del 40 % de la pantalla", alto < 0.4, `${Math.round(alto * 100)} %`);
  await page.evaluate(() => window.raizDepuracion.esperarMapa());
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_dos_zonas.png") });
  await page.locator("#t-localidades").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_dos_zonas_localidades.png") });
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
    await pruebasEscritorio(esc.page, esc.peticiones);
    check("escritorio: sin errores de consola", esc.errores.length === 0, esc.errores.join(" | "));
    await esc.ctx.close();

    const tel = await abrir(
      navegador,
      base,
      { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" },
      "teléfono",
    );
    await pruebasTelefono(tel.page, tel.peticiones);
    check("teléfono: sin errores de consola", tel.errores.length === 0, tel.errores.join(" | "));
    await tel.ctx.close();

    // Pantalla de inicio de tres pasos (visitante nuevo): en escritorio se cierra con Escape; en teléfono, con el botón.
    await pruebaInicio(navegador, base, { viewport: { width: 1366, height: 860 } }, "inicio, escritorio", "", "Escape");
    await pruebaInicio(
      navegador,
      base,
      { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" },
      "inicio, teléfono",
      "teléfono: ",
      "boton",
    );

    // Variante en memoria: superficie abstenida > 0, capa ausente, parcela abstenida y el caso de goteo que los
    // datos no traen (bloques de prueba si el cubo no trae goteo; sin bloques si sí lo trae).
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
      omitir("variante: el otro caso de goteo", "ninguna parcela clasificada con bloque gota");
    }
    if (v.idSinCalculo) await pruebaSinCalculo(alt.page, v);
    else omitir("variante: parcela clasificada sin opciones", "ninguna parcela clasificada con opción ACTUAL");
    check("variante en memoria: sin errores de consola", alt.errores.length === 0, alt.errores.join(" | "));
    await alt.ctx.close();

    // Fallas de lectura: relieve.json y pruebas.json en HTTP 500 y manifest.json roto. No son «not run» ni
    // «not built»: la página dice que no se pudieron leer. Además, imprimir que falla deja un aviso visible.
    const fal = await abrir(navegador, base, { viewport: { width: 1366, height: 860 }, reducedMotion: "reduce" }, "fallas de lectura", {
      "relieve.json": new Respuesta(500),
      "pruebas.json": new Respuesta(500),
      "manifest.json": new Respuesta(200, "{roto"),
    });
    const rel = await texto(fal.page, "#capa-relieve");
    const marcaRel = await fal.page.evaluate(() => document.body.dataset.relieve);
    check("relieve.json en HTTP 500: «Terrain layer: could not be loaded (relieve.json: HTTP 500)», no «not run»",
      rel.includes("Terrain layer: could not be loaded") && rel.includes("relieve.json: HTTP 500") && !rel.includes("not run") && marcaRel === "error", `${rel} · ${marcaRel}`);
    await fal.page.locator("#boton-acerca").click();
    await fal.page.waitForSelector("body[data-acerca='listo']", { timeout: 10000 });
    const acerca = await texto(fal.page, "#acerca");
    check("pruebas.json en HTTP 500: About & Data dice «could not be read (HTTP 500)», no «was not built»",
      acerca.includes("pruebas.json could not be read (HTTP 500)") && !acerca.includes("pruebas.json was not built"));
    check("manifest.json roto: About & Data dice «could not be read (invalid JSON…)»", acerca.includes("manifest.json could not be read (invalid JSON"));
    await fal.page.keyboard.press("Escape");
    const idImp = candidatos.find((x) => !porId.get(x).abstencion && opcionesDe(x).length);
    if (idImp) {
      await abrirDesdeLista(fal.page, idImp);
      await fal.page.evaluate(() => {
        window.print = () => {
          throw new Error("printing blocked in this test");
        };
      });
      await fal.page.locator("#boton-imprimir").click();
      await fal.page.waitForSelector("#aviso-imprimir:not([hidden])", { timeout: 8000 }).catch(() => null);
      const avisoImp = (await fal.page.locator("#aviso-imprimir").isVisible()) ? await texto(fal.page, "#aviso-imprimir") : "";
      check("si imprimir falla, un aviso visible y sin agregados de impresión", avisoImp.includes("could not be printed") && (await fal.page.locator("[data-impresion]").count()) === 0, avisoImp);
      await cerrarFicha(fal.page);
    }
    check("fallas de lectura: sin excepciones de la página", !fal.errores.some((e) => e.startsWith("pageerror")), fal.errores.filter((e) => e.startsWith("pageerror")).join(" | "));
    await fal.ctx.close();

    // Pantalla baja (teléfono horizontal o zoom de 200 %): la ficha ocupa todo el alto, sobre los controles.
    const baja = await abrir(navegador, base, { viewport: { width: 844, height: 390 }, reducedMotion: "reduce" }, "pantalla baja");
    const idBaja = conNecesidad ?? candidatos[0];
    await abrirDesdeLista(baja.page, idBaja);
    const alto = await baja.page.evaluate(() => {
      const r = document.querySelector("#ficha").getBoundingClientRect();
      return { arriba: Math.round(r.top), fraccion: r.height / window.innerHeight, controlesInert: document.querySelector("#controles").inert };
    });
    check("pantalla baja (844×390): la ficha ocupa todo el alto y los controles tapados quedan inert", alto.arriba <= 1 && alto.fraccion > 0.95 && alto.controlesInert, JSON.stringify(alto));
    await baja.page.screenshot({ path: path.join(CAPTURAS, "pantalla_baja_ficha.png") });
    await cerrarFicha(baja.page);
    check("pantalla baja: al cerrar la ficha los controles vuelven a ser operables", !(await baja.page.evaluate(() => document.querySelector("#controles").inert)));
    check("pantalla baja: sin errores de consola", baja.errores.length === 0, baja.errores.join(" | "));
    await baja.ctx.close();

    // Arranque que falla después de leer los datos (cubo sin «dotaciones»): aviso visible, no una página a medias.
    const malo = structuredClone(cubo);
    delete malo.dotaciones;
    const ctxMalo = await navegador.newContext({ viewport: { width: 1366, height: 860 } });
    const pMalo = await ctxMalo.newPage();
    await pMalo.route((url) => esOpcional(url.href), (route) => route.abort());
    await pMalo.route("**/data/cubo.json", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(malo) }));
    await pMalo.goto(`${base}/index.html`);
    await pMalo.waitForSelector(".error-carga", { timeout: 15000 }).catch(() => null);
    const avisoMalo = (await pMalo.locator(".error-carga").count()) ? await pMalo.locator(".error-carga").first().innerText() : "";
    check("arranque fallido: aviso visible «The page could not start: …»", avisoMalo.includes("The page could not start") && (await pMalo.evaluate(() => document.body.dataset.listo)) === "error", avisoMalo);
    await ctxMalo.close();

    // Variante de dos zonas en memoria: selector, indicador, conteos, lista, mapa y localidades por zona.
    const dz = varianteDosZonas();
    if (dz) {
      console.log(`\nDos zonas (en memoria): ${dz.za.id} = ${dz.porZona[dz.za.id].length} parcelas · ${dz.zb.id} = ${dz.porZona[dz.zb.id].length} parcelas`);
      const datosDZ = { "cubo.json": dz.c, "parcelas.geojson": dz.g };
      const dos = await abrir(navegador, base, { viewport: { width: 1366, height: 860 }, reducedMotion: "reduce" }, "dos zonas en memoria", datosDZ);
      await pruebasDosZonas(dos.page, dz);
      check("dos zonas: sin errores de consola", dos.errores.length === 0, dos.errores.join(" | "));
      await dos.ctx.close();
      const dosTel = await abrir(
        navegador,
        base,
        { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" },
        "dos zonas en memoria, teléfono",
        datosDZ,
      );
      await pruebasDosZonasTelefono(dosTel.page, dz);
      check("teléfono, dos zonas: sin errores de consola", dosTel.errores.length === 0, dosTel.errores.join(" | "));
      await dosTel.ctx.close();
    } else {
      omitir("variante de dos zonas", "params.zona_piloto.zonas trae menos de dos zonas");
    }
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
