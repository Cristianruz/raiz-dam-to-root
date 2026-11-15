// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
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
// - gemelo digital (docs/decisiones/2026-11-14_gemelo_digital.md): la página abre en la zona de gemelo.json →
//   zona_inicial (no en «All areas»); vista 3D (botón «3D twin view» en los controles del mapa: «not available» con su
//   motivo en «All areas»; con teclado; relieve con la exageración de la zona; una columna por parcela clasificada que
//   pide agua; el deslizador y la lluvia cambian las alturas; clic, toque o Enter abren la ficha; la columna que
//   devuelve columnaEn es la que se ve en el píxel, comprobado pintando cada columna con un código binario; al
//   desactivar, mapa plano y sin capas del gemelo); línea de tiempo (el año pasado colorea el mapa con la memoria y
//   cuenta los seis estados; 2025 con su nota [P]; Play/Pause o «Next year» con movimiento reducido); tarjeta «Twin
//   status» (fechas, nota fija, sin undefined/NaN); manifest.webmanifest, theme-color e indicador «Online». Los
//   contextos bloquean el service worker (si no, page.route dejaría de aplicar las variantes en memoria);
//   tests/e2e/pwa_smoke.mjs prueba el worker con la página real;
// - ficha completa (etapa 2 del gemelo): frase resumen en sus tres casos (con agua, lámina cero, abstenida) y que
//   cambia con el deslizador; gráfica del NDVI con sus umbrales de los datos y con huecos donde hay null (variante en
//   memoria); enlace directo #P0757 (abre la ficha sin pantalla de inicio, el hash sigue a la ficha, un id
//   desconocido avisa, «hashchange» a una parcela de otra zona cambia de zona); aptitud de suelo con su rótulo y su
//   estado en texto en cada tarjeta; perfil de suelo una vez (grupo de textura, «not in the map», «needs a soil
//   test», nota de zona, parcela sin dato); lámina local de referencia con sus hectáreas que cambian con el
//   deslizador y «no local reference» donde toca; propuesta del equipo rotulada; nogal sin rotación con su motivo;
//   dotacion_minima que cambia de estado con el deslizador; GEDI con su nota junto al valor; riesgo de helada junto a
//   la siembra; la hoja de P0757 en una carta y una A4; suelo.json y contexto.json en HTTP 500 se dicen;
// - paneles y registro (etapa 3 de la integración): «Regional context» plegable en el panel (cerrado al abrir la
//   página; al abrirlo, la zona y el año de la línea de tiempo, el clima del año, una tarjeta por grupo de series y la
//   nota de que no describen una parcela; las advertencias de la sesión de datos a la vista; la malla de GRACE con sus
//   mascons; un año con días faltantes lo dice; cambiar el año de la línea de tiempo cambia el valor mostrado; cambiar
//   de zona y «All areas»); «Challenge data sources» en «About & Data» con los conteos de contexto.json; H1-b junto a
//   H1 (su veredicto, cifras y fuente, sin cambiar el de H1) y los documentos enlazados; etiquetas [P]/[V] y fuente de
//   La Boquilla y del acuífero; nota de cada marca, equivalencia y punto de medición en inglés; ventana de suelo
//   desnudo de cubo.meta en la capa y en la ficha; leyenda del relieve con las rutas cortadas (rutas_depresiones);
//   La gota con el rótulo y la fuente de las eficiencias del goteo a la vista y «upper bound» sin tope; contexto.json
//   en HTTP 500 lo dicen «Regional context» y «Challenge data sources»;
// - guarda capturas en tests/e2e/capturas/ (o en RAIZ_CAPTURAS).
// No supone un juego de datos: los valores esperados y las parcelas de cada prueba se leen de los datos.
// Las comprobaciones que cuentan TODAS las parcelas (las de antes del gemelo) pasan primero a «All areas».
// Los casos que los datos no traen (superficie abstenida, capa ausente, una parcela abstenida, el goteo)
// se prueban además con una variante del cubo y de las parcelas servida en memoria (page.route).

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { aguaComprometida, conteosZona, cobertura, evaluarOpcion } from "../../web/reglas.js";
import { fraseResumen, formatoHectareas } from "../../web/js/resumen.js";
import { ESTADOS_APTITUD, ROTULO_APTITUD, grupoDeTextura } from "../../web/js/suelo.js";
import { NOTA_GEDI, NOTA_REGIONAL, riesgoDeHelada, climaDelAnio, contarEstados, diasIncompletos, formatoNumero, textoMascon } from "../../web/js/contexto.js";
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
const OPCIONALES_DATOS = ["relieve.json", "relieve_rutas.geojson", "manifest.json", "pruebas.json", "gemelo.json",
  "suelo.json", "contexto.json", "ndvi_mensual.json"];
const existe = (nombre) => fs.existsSync(path.join(DATOS, nombre));
const ausentes = OPCIONALES_DATOS.filter((f) => !existe(f));
const esAusente = (url = "") => ausentes.some((f) => url.split("?")[0].endsWith(`/data/${f}`));
const leerOpcional = (nombre) => (existe(nombre) ? leerJSON(nombre) : null);
const relieve = leerOpcional("relieve.json");
const rutasRelieve = leerOpcional("relieve_rutas.geojson");
const pruebasWeb = leerOpcional("pruebas.json");
const gemelo = leerOpcional("gemelo.json");
const suelo = leerOpcional("suelo.json");
const contexto = leerOpcional("contexto.json");
const ndviMensual = leerOpcional("ndvi_mensual.json");
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
async function abrir(navegador, base, opciones, etiqueta, alterados = {}, { inicio = false, hash = "" } = {}) {
  // Sin service worker: con él al mando, page.route deja de interceptar las peticiones del mismo origen.
  const ctx = await navegador.newContext({ serviceWorkers: "block", ...opciones });
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
  await page.goto(`${base}/index.html${hash}`, { waitUntil: "load" });
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
  // Rótulo de las eficiencias del goteo (cubo.meta.goteo) A LA VISTA junto a las cifras, sin abrir ningún desplegable.
  const mg = c.meta?.goteo?.disponible ? c.meta.goteo : null;
  if (mg?.ea_goteo && Number.isFinite(mg.ea_goteo.valor)) {
    const rot = page.locator("#gota-etiqueta-goteo");
    const textoRot = (await rot.isVisible()) ? await rot.innerText() : "";
    const pct = (f) => nf({ style: "percent", maximumFractionDigits: 0 }).format(f);
    const corta = String(mg.ea_goteo.fuente ?? "").split(": ")[0];
    check(
      `${prefijo}el goteo muestra junto a sus cifras las eficiencias (${pct(mg.ea_goteo.valor)}), su rótulo «${mg.ea_goteo.etiqueta}» y la fuente FAO`,
      textoRot.includes(pct(mg.ea_goteo.valor)) && textoRot.includes(mg.ea_goteo.etiqueta) && textoRot.includes(corta) && /FAO/.test(textoRot) &&
        (!mg.ea_superficial_referencia || textoRot.includes(pct(mg.ea_superficial_referencia.valor))),
      textoRot.replace(/\n/g, " ").slice(0, 200),
    );
  }
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
    // El retorno al acuífero sin tope es una cota superior (cubo.meta.goteo.retorno_sin_tope_es_cota_superior).
    if (c.meta?.goteo?.retorno_sin_tope_es_cota_superior === true) {
      const acu = await page.locator('#gota-cifras [data-cifra="acuifero"]').innerText();
      check(`${prefijo}sin tope: «Back to aquifer» rotulado «upper bound», con su nota a la vista`, acu.includes("upper bound") && (await page.locator("#gota-cota").isVisible()), acu.replace(/\n/g, " "));
    }
    await revisarSankey(page, sin, "sin_tope", `${prefijo}La gota de ${id}, goteo sin tope`);
    await capturar(capturas?.sin);
    await page.locator("#gota-tope").click();
  }
  if (c.meta?.goteo?.retorno_sin_tope_es_cota_superior === true && con) {
    const acuCon = await page.locator('#gota-cifras [data-cifra="acuifero"]').innerText().catch(() => "");
    check(`${prefijo}con tope: el retorno no lleva «upper bound»`, !acuCon.includes("upper bound") && (await page.locator("#gota-cota").isHidden()), acuCon.replace(/\n/g, " "));
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

  // Rutas cortadas (relieve.json → rutas_depresiones): profundidad mínima, su etiqueta y su nota, de los datos.
  const conCorte = zonasRel.filter((z) => z.rutas_depresiones);
  if (conCorte.length) {
    const corte = (await page.locator("#capa-relieve .relieve-depresiones").count()) ? await texto(page, "#capa-relieve .relieve-depresiones") : "";
    check(
      `${prefijo}leyenda del relieve: rutas cortadas en depresiones de al menos ${conCorte.map((z) => `${fmt3(z.rutas_depresiones.prof_min_m)} m`).join(", ")}, con su etiqueta y su nota`,
      corte.startsWith("Cut paths:") && conCorte.every((z) => corte.includes(`${fmt3(z.rutas_depresiones.prof_min_m)} m`) && corte.includes(z.rutas_depresiones.etiqueta) && corte.includes(z.rutas_depresiones.nota)),
      corte.slice(0, 200),
    );
  } else {
    omitir(`${prefijo}leyenda de rutas cortadas`, "relieve.json sin rutas_depresiones");
  }

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
  const deManifest = () => peticiones.filter((u) => /\/data\/manifest\.json(\?|$)/.test(u)).length;
  const dePruebas = () => peticiones.filter((u) => /\/data\/pruebas\.json(\?|$)/.test(u)).length;
  // manifest.json se lee UNA vez al arrancar (la tarjeta «Twin status» muestra la fecha de cada fuente); pruebas.json, no.
  check(`${prefijo}pruebas.json no se pide al cargar la página; manifest.json, una sola vez (Twin status)`, dePruebas() === 0 && deManifest() <= 1, pedidos().join(", "));
  const manifestAntes = deManifest();
  const fichaAbierta = await page.locator("#ficha").isVisible();
  await page.locator("#boton-acerca").click();
  await page.waitForSelector("body[data-acerca='listo']", { timeout: 10000 });
  const dlg = page.locator("#acerca");
  check(
    `${prefijo}«About & Data» se abre como diálogo modal, entonces lee pruebas.json y reutiliza la lectura de manifest.json`,
    (await dlg.isVisible()) && (await dlg.evaluate((d) => d.open && d.matches(":modal"))) && dePruebas() >= 1 && deManifest() === Math.max(1, manifestAntes),
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
  await pruebaRecursosReto(page, prefijo, telefono);
  await pruebaH1b(page, prefijo, telefono);
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

// ---------------------------------------------------------------- gemelo digital (docs/decisiones/2026-11-14_gemelo_digital.md)
// Zona inicial, vista 3D, línea de tiempo, tarjeta «Twin status» y aplicación instalable, conectadas por app.js.
const zonasCubo = Object.keys(cubo.zonas ?? {});
const zonaDeProp = (p) => p.zona ?? zonasCubo[0];
/** Zona con la que debe abrir la página: gemelo.json → zona_inicial si está en el cubo; si no, la primera del cubo. */
const zonaInicialDe = (c) => {
  const ids = Object.keys(c.zonas ?? {});
  if (ids.length < 2) return null;
  return gemelo?.zona_inicial && c.zonas[gemelo.zona_inicial] ? gemelo.zona_inicial : ids[0];
};
const zonaInicial = zonaInicialDe(cubo);
const nombreZonaCubo = (id, c = cubo) => c.zonas?.[id]?.nombre_mostrar ?? c.zonas?.[id]?.nombre ?? id;
const camara = gemelo?.camara ?? {};
const MEMORIA_CLAVES = ["perenne", "verano", "invierno", "doble", "descanso", "sin_dato"];

/** Pasa a «All areas» (para las comprobaciones que cuentan todas las parcelas); sin selector (una zona), nada. */
async function verTodas(page) {
  if (!(await page.locator("#selector-zona").isVisible())) return;
  if ((await page.locator("#zona-sel").inputValue()) !== "") await page.locator("#zona-sel").selectOption("");
  await page.evaluate(() => window.raizDepuracion.esperarMapa());
}
async function elegirZona(page, id) {
  await page.locator("#zona-sel").selectOption(id);
  await page.evaluate(() => window.raizDepuracion.esperarMapa());
}
const dosCuadros = (page) => page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
const gemelo3d = (page) => page.evaluate(() => window.raizDepuracion.gemelo3d());
const quieto = (page) => page.evaluate(() => window.raizDepuracion.esperarQuieto());

/** La página abre en la zona inicial (decisión del gemelo, punto 6): selector, lista, mapa e indicador de esa zona. */
async function pruebaZonaInicial(page, prefijo) {
  if (!zonaInicial) {
    omitir(`${prefijo}zona inicial`, "el cubo trae menos de dos zonas: no hay selector");
    return;
  }
  const nombre = nombreZonaCubo(zonaInicial);
  const valor = await page.locator("#zona-sel").inputValue();
  check(`${prefijo}la página abre en ${nombre} (gemelo.json → zona_inicial), no en «All areas»`, valor === zonaInicial, valor || "«All areas»");
  const deZona = props.filter((p) => zonaDeProp(p) === zonaInicial);
  const enLista = await page.locator(".boton-parcela:visible").count();
  const resumen = await texto(page, "#lista-resumen");
  check(`${prefijo}zona inicial: la lista muestra sus ${deZona.length} parcelas y lo dice`, enLista === deZona.length && resumen.includes(nombre), `${enLista} · ${resumen}`);
  const dibujadas = await page.evaluate(() => window.raizDepuracion.parcelasDibujadas());
  check(`${prefijo}zona inicial: el mapa encuadra y dibuja sus ${deZona.length} parcelas`, dibujadas === deZona.length, `${dibujadas} dibujadas`);
  const D = Number(await page.locator("#dotacion").inputValue());
  const ac = aguaComprometida(cubo.zonas[zonaInicial], D, 0);
  const pct = nf({ style: "percent", maximumFractionDigits: 0 }).format(ac.p50).replace("-", "−");
  const ind = await indicador(page);
  check(`${prefijo}zona inicial: el indicador usa el bloque de ${nombre} (${pct})`, ac.sinDotacion || ind.includes(pct), (await texto(page, "#indicador-cifra")).trim());
}

/** Manifest de la aplicación instalable, theme-color e indicador Online en la cabecera (instalar.js). */
async function pruebaInstalable(page, prefijo) {
  const enlace = await page.evaluate(async () => {
    const l = document.querySelector('link[rel="manifest"]');
    if (!l) return null;
    const r = await fetch(l.href);
    return { href: l.getAttribute("href"), ok: r.ok, datos: r.ok ? await r.json() : null, tema: document.querySelector('meta[name="theme-color"]')?.content ?? null };
  });
  check(`${prefijo}<link rel="manifest" href="manifest.webmanifest"> enlazado y legible`, enlace?.href === "manifest.webmanifest" && enlace.ok && Boolean(enlace.datos?.icons?.length), JSON.stringify(enlace?.href));
  check(`${prefijo}theme-color de index.html = theme_color del manifest`, Boolean(enlace?.tema) && enlace.tema.toUpperCase() === String(enlace?.datos?.theme_color).toUpperCase(), `${enlace?.tema} · ${enlace?.datos?.theme_color}`);
  await page.waitForSelector("#marca-instalar .instalar:not([hidden])", { timeout: 10000 }).catch(() => null);
  const ind = page.locator("#marca-instalar .instalar [role='status']");
  const textoInd = (await ind.count()) ? (await ind.first().innerText()).trim() : "";
  check(`${prefijo}cabecera: indicador de conexión accesible (role=status) que dice «Online»`, textoInd.startsWith("Online"), textoInd || "sin indicador");
  check(`${prefijo}cabecera: «Install app» solo si el navegador lo ofrece (aquí no)`, (await page.locator("#marca-instalar button:visible", { hasText: "Install app" }).count()) === 0);
}

/** Tarjeta «Twin status»: observado, modelado y escenario, fechas de las fuentes, nota fija; sin undefined ni NaN. */
async function pruebaEstadoGemelo(page, prefijo) {
  await page.waitForSelector("body[data-estado-gemelo='listo']", { timeout: 10000 }).catch(() => null);
  const t = page.locator("#estado-gemelo .estado-gemelo");
  check(`${prefijo}Twin status: la tarjeta está en el panel`, (await t.count()) === 1 && (await page.locator(".panel #estado-gemelo").count()) === 1);
  const cuerpo = await t.evaluate((el) => el.textContent);
  check(`${prefijo}Twin status: sin «undefined», «NaN», «null» ni «Invalid Date»`, !/undefined|NaN|\bnull\b|Invalid Date/.test(cuerpo));
  const grupos = await t.locator("[data-grupo]").evaluateAll((xs) => xs.map((x) => x.dataset.grupo));
  check(`${prefijo}Twin status: grupos observado, modelado y escenario`, ["observado", "modelado", "escenario"].every((g) => grupos.includes(g)), grupos.join(", "));
  check(`${prefijo}Twin status: nota fija (sin sensores en campo, no pronostica la presa)`, cuerpo.includes("no in-field sensors") && cuerpo.includes("It does not forecast the dam."));
  if (existe("manifest.json")) {
    const fechas = await t.locator("[data-grupo='observado'] .estado-gemelo-fecha").allInnerTexts();
    check(
      `${prefijo}Twin status: cada fuente observada con su fecha (manifest.json)`,
      (await t.getAttribute("data-fuentes")) === "si" && fechas.length >= 3 && fechas.every((f) => /Data retrieved: \w{3} \d{1,2}, \d{4}/.test(f)),
      fechas.join(" | "),
    );
  }
  if (zonaInicial) check(`${prefijo}Twin status: la zona en vista es la zona inicial`, (await t.getAttribute("data-zona")) === zonaInicial);
  await fijarDeslizador(page, D2);
  const valor = await t.locator("[data-fila='dotacion'] [data-valor]").first().innerText().catch(() => "");
  check(`${prefijo}Twin status: «Your scenario» repite la dotación del deslizador`, valor.includes(`${fmt3(D2)} thousand m³/ha`), valor);
}

/** Línea de tiempo: el año pasado colorea el mapa con la memoria (seis estados) y cuenta; 2025 con su nota [P]. */
async function pruebaLineaDeTiempo(page, prefijo, reducida) {
  const anios = gemelo?.tiempo?.anios;
  if (!Array.isArray(anios)) {
    check(`${prefijo}sin gemelo.tiempo: «Timeline: not available»`, (await texto(page, "#bloque-tiempo")).includes("Timeline: not available"));
    return;
  }
  const [a0, a1] = [Math.min(...anios), Math.max(...anios)];
  const rango = page.locator("#linea-tiempo .tiempo-rango");
  const fijarAnio = (a) => rango.evaluate((el, v) => { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); }, a);
  const cuentas = () => page.locator("#linea-tiempo .tiempo-estado").evaluateAll((xs) => Object.fromEntries(xs.map((x) => [x.dataset.estado, x.querySelector(".tiempo-cuenta-numero")?.textContent.trim()])));
  const visibles = props.filter((p) => !zonaInicial || zonaDeProp(p) === (zonaInicial));
  const esperadas = (a) => {
    const c = Object.fromEntries(MEMORIA_CLAVES.map((k) => [k, 0]));
    for (const p of visibles) {
      const e = Array.isArray(p.memoria) ? p.memoria.find((m) => m.anio === a)?.estado : null;
      c[MEMORIA_CLAVES.includes(e) ? e : "sin_dato"] += 1;
    }
    return Object.fromEntries(Object.entries(c).map(([k, v]) => [k, nf({ maximumFractionDigits: 0 }).format(v)]));
  };
  const etiqueta = await texto(page, "#linea-tiempo .tiempo-etiqueta");
  check(`${prefijo}línea de tiempo «Agricultural year» en el panel, abre en ${a1}`, etiqueta.includes("Agricultural year") && (await rango.inputValue()) === String(a1) && (await page.locator(".panel #linea-tiempo .tiempo").count()) === 1);
  const c1 = await cuentas();
  await fijarAnio(a0);
  const c0 = await cuentas();
  const ley0 = await texto(page, "#leyenda");
  const clases = await page.locator("#leyenda li").evaluateAll((xs) => xs.map((x) => x.dataset.clase));
  check(`${prefijo}línea de tiempo en ${a0}: el mapa y su leyenda muestran la memoria de ${a0} (seis estados)`,
    ley0.includes(`Field memory: ${a0}`) && MEMORIA_CLAVES.every((k) => clases.includes(k)) && (await page.evaluate(() => document.body.dataset.anioTiempo)) === String(a0), ley0.split("\n")[0]);
  check(`${prefijo}línea de tiempo en ${a0}: conteos del año (de parcelas.geojson) y distintos de ${a1}`, JSON.stringify(c0) === JSON.stringify(esperadas(a0)) && JSON.stringify(c0) !== JSON.stringify(c1), JSON.stringify(c0));
  const listaLetra = await page.locator(".boton-parcela:visible .sem-circulo").first().innerText();
  check(`${prefijo}línea de tiempo en ${a0}: la lista de parcelas usa las letras de la memoria`, ["P", "S", "W", "D", "R", "?"].includes(listaLetra.trim()), listaLetra);
  const destacado = Object.keys(gemelo.tiempo.destacados ?? {})[0];
  if (destacado) {
    await fijarAnio(Number(destacado));
    const d = gemelo.tiempo.destacados[destacado];
    const nota = page.locator(`#linea-tiempo .tiempo-destacado[data-anio="${destacado}"]`);
    const textoNota = (await nota.isVisible()) ? await nota.innerText() : "";
    check(`${prefijo}línea de tiempo en ${destacado}: nota destacada con su texto, fuente y etiqueta ${d.etiqueta}`, textoNota.includes(d.texto) && textoNota.includes(d.fuente) && textoNota.includes(d.etiqueta), textoNota.replace(/\n/g, " · "));
    await page.locator("#bloque-tiempo").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(CAPTURAS, `${reducida ? "telefono" : "escritorio"}_linea_tiempo_${destacado}.png`) });
  }
  // Reproducción: con movimiento reducido el botón dice «Next year» y avanza un año por pulsación.
  await fijarAnio(a0);
  const boton = page.locator("#linea-tiempo .tiempo-boton");
  if (reducida) {
    const t = (await boton.innerText()).trim();
    await boton.click();
    check(`${prefijo}línea de tiempo con movimiento reducido: «Next year» sin aria-pressed avanza un año`, t === "Next year" && (await boton.getAttribute("aria-pressed")) === null && (await rango.inputValue()) === String(a0 + 1), `${t} → ${await rango.inputValue()}`);
  } else {
    await boton.click();
    const pulsado = await boton.getAttribute("aria-pressed");
    await page.waitForTimeout(Number(gemelo.tiempo.intervalo_ms) + 400);
    const avanzado = Number(await rango.inputValue());
    await boton.click();
    check(`${prefijo}línea de tiempo: Play (aria-pressed) avanza los años y Pause la detiene`, pulsado === "true" && avanzado >= a0 + 2 && (await boton.getAttribute("aria-pressed")) === "false", `${pulsado} · año ${avanzado}`);
  }
  // Elegir cómo colorear devuelve la línea de tiempo al año actual; también volver a mano al último año.
  await page.locator('input[name="colorear"][value="plazo"]').check();
  const ley1 = await texto(page, "#leyenda");
  check(`${prefijo}línea de tiempo: elegir «Water term» devuelve el año ${a1} y colorea por plazo`,
    (await rango.inputValue()) === String(a1) && ley1.includes("Water term") && (await page.evaluate(() => document.body.dataset.anioTiempo)) === "", ley1.split("\n")[0]);
  await page.locator('input[name="colorear"][value="semaforo"]').check();
  await fijarAnio(a0);
  await fijarAnio(a1);
  check(`${prefijo}línea de tiempo: volver a ${a1} restablece el semáforo de agua`, (await texto(page, "#leyenda")).includes("Enough water for the current rotation?"));
}

/**
 * ¿Qué columna se VE en cada píxel? Se pinta cada columna con un código binario (un cuadro por bit, blanco o negro) y
 * se compara con columnaEn (el clic, el toque, Enter y la etiqueta dependen de ella). Devuelve el acierto fuera de
 * los bordes. Al terminar deja las capas de la aplicación como estaban (las de la vista 3D se retiran al desactivar).
 */
async function identidadColumnas(page) {
  await page.mouse.move(1, 1); // sin etiqueta de columna apuntada
  const previo = await page.evaluate(() => {
    const m = window.raizDepuracion.mapa;
    const lienzo = m.getCanvas();
    const caja = lienzo.getBoundingClientRect();
    const ids = window.raizDepuracion.gemelo3d().columnas.map((c) => c.id);
    const puntos = [];
    for (let y = 6; y < caja.height - 6; y += 6) {
      for (let x = 6; x < caja.width - 6; x += 6) {
        if (document.elementFromPoint(caja.left + x, caja.top + y) === lienzo) puntos.push([x, y]);
      }
    }
    const vistas = puntos.map(([x, y]) => window.raizDepuracion.columnaEn(caja.left + x, caja.top + y));
    // Lo que se dibuja sobre el lienzo sin recibir el puntero (etiquetas de localidades, marcadores, controles) también
    // saldría en la captura: se oculta mientras se pinta el código (y se devuelve al terminar).
    const sobreLienzo = [...document.querySelectorAll("#mapa *")].filter((el) => el !== lienzo && !el.contains(lienzo));
    const estiloPrevio = sobreLienzo.map((el) => el.style.visibility);
    for (const el of sobreLienzo) el.style.visibility = "hidden";
    const ocultas = m.getLayersOrder().filter((id) => !["gemelo-columna-agua", "gemelo-columna-falta", "gemelo-camara", "fondo"].includes(id));
    const visibilidad = Object.fromEntries(ocultas.map((id) => [id, m.getLayoutProperty(id, "visibility") ?? "visible"]));
    const fondo = m.getPaintProperty("fondo", "background-color");
    for (const id of ocultas) m.setLayoutProperty(id, "visibility", "none");
    m.setPaintProperty("fondo", "background-color", "#000000");
    m.setPaintProperty("gemelo-columna-falta", "fill-extrusion-pattern", null);
    // Sin transición de color: si no, el cuadro capturado podría quedar a medio camino entre dos códigos.
    for (const capa of ["gemelo-columna-agua", "gemelo-columna-falta"]) m.setPaintProperty(capa, "fill-extrusion-color-transition", { duration: 0, delay: 0 });
    window.__identidad = { puntos, vistas, ids, visibilidad, fondo, cuadros: [], sobreLienzo, estiloPrevio };
    return { caja: { x: caja.left, y: caja.top, width: caja.width, height: caja.height }, bits: Math.ceil(Math.log2(ids.length + 1)) };
  });
  const cuadro = async (expr) => {
    await page.evaluate((e) => {
      const m = window.raizDepuracion.mapa;
      m.setPaintProperty("gemelo-columna-agua", "fill-extrusion-color", e);
      m.setPaintProperty("gemelo-columna-falta", "fill-extrusion-color", e);
    }, expr);
    await quieto(page);
    await dosCuadros(page);
    await page.waitForTimeout(150);
    await dosCuadros(page);
    const png = await page.screenshot({ clip: previo.caja });
    await page.evaluate(async (b64) => {
      const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
      const lienzo = new OffscreenCanvas(img.width, img.height);
      const ctx = lienzo.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      window.__identidad.cuadros.push({ ancho: img.width, datos: ctx.getImageData(0, 0, img.width, img.height).data });
    }, png.toString("base64"));
  };
  const ids = await page.evaluate(() => window.__identidad.ids);
  for (let k = 0; k < previo.bits; k++) {
    const con = ids.filter((_, i) => ((i + 1) >> k) & 1);
    await cuadro(con.length ? ["match", ["get", "id"], con, "#ffffff", "#000000"] : "#000000");
  }
  await cuadro("#ffffff");
  return page.evaluate(() => {
    const m = window.raizDepuracion.mapa;
    const { puntos, vistas, ids, visibilidad, fondo, cuadros, sobreLienzo, estiloPrevio } = window.__identidad;
    sobreLienzo.forEach((el, i) => { el.style.visibility = estiloPrevio[i]; });
    for (const [id, v] of Object.entries(visibilidad)) if (m.getLayer(id)) m.setLayoutProperty(id, "visibility", v);
    m.setPaintProperty("fondo", "background-color", fondo);
    const todo = cuadros.pop();
    const escala = todo.ancho / m.getCanvas().getBoundingClientRect().width;
    const codigo = (x, y) => {
      const q = (Math.round(y * escala) * todo.ancho + Math.round(x * escala)) * 4;
      if (todo.datos[q + 1] < 40) return 0;
      let v = 0;
      for (let k = 0; k < cuadros.length; k++) {
        const g = cuadros[k].datos[q + 1];
        if (g > 28 && g < 60) return -1;
        if (g >= 60) v |= 1 << k;
      }
      return v;
    };
    let n = 0, bien = 0, otra = 0, ninguna = 0, bordes = 0;
    const ejemplos = [];
    puntos.forEach(([x, y], j) => {
      const v = codigo(x, y);
      if (v < 0 || [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => codigo(x + dx, y + dy) !== v)) { bordes += 1; return; }
      if (v === 0) return;
      n += 1;
      const verdad = ids[v - 1] ?? "?";
      if (vistas[j] === verdad) bien += 1;
      else if (vistas[j] == null) ninguna += 1;
      else { otra += 1; if (ejemplos.length < 3) ejemplos.push(`(${x},${y}) se ve ${verdad}, columnaEn ${vistas[j]}`); }
    });
    delete window.__identidad;
    return { n, bien, otra, ninguna, bordes, ejemplos };
  });
}

/** Lo que la vista 3D debe dibujar en una zona (el mismo cálculo que gemelo3d.js, con la lámina del cubo). */
function columnasEsperadas(zonaId, D, r) {
  const k = gemelo.columnas.metros_por_millar;
  const cols = new Map();
  let sinRiego = 0;
  let sinClasificar = 0;
  let clasificadas = 0;
  for (const p of props) {
    if (zonaId != null && p.zona != null && p.zona !== zonaId) continue;
    const actual = actualDe(p.id);
    const l50 = !p.abstencion && actual ? actual.agua?.lamina_bruta?.[String(r)]?.p50 ?? null : null;
    if (l50 == null) sinClasificar += 1;
    else {
      clasificadas += 1;
      if (l50 > 0) cols.set(p.id, { cubre: Math.min(Math.max(D, 0), l50) * k, pide: l50 * k });
      else sinRiego += 1;
    }
  }
  return { cols, sinRiego, sinClasificar, clasificadas };
}
const mismasColumnas = (vistas, esperadas) =>
  vistas.length === esperadas.cols.size &&
  vistas.every((c) => esperadas.cols.has(c.id) && Math.abs(c.cubre_m - esperadas.cols.get(c.id).cubre) < 1e-6 && Math.abs(c.pide_m - esperadas.cols.get(c.id).pide) < 1e-6);

/** Vista 3D del gemelo (gemelo3d.js conectada por app.js). */
async function pruebaGemelo3D(page, prefijo, telefono) {
  const boton = page.locator("#boton-gemelo");
  const motivo = page.locator("#gemelo-motivo");
  if (!(await boton.count())) {
    check(`${prefijo}3D: el botón «3D twin view» está en los controles del mapa`, false, "sin botón");
    return;
  }
  check(`${prefijo}3D: el botón está en los controles del mapa`, (await page.locator("#mapa .maplibregl-ctrl #boton-gemelo").count()) === 1);
  const z = zonaInicial ?? zonasCubo[0] ?? Object.keys(gemelo?.terreno?.zonas ?? {})[0];
  if (!gemelo?.terreno?.zonas?.[z]) {
    check(`${prefijo}3D: sin gemelo.json o sin teselas, «3D twin view: not available» con su motivo`,
      (await boton.innerText()).trim() === "3D twin view: not available" && (await boton.getAttribute("aria-disabled")) === "true" && (await motivo.isVisible()));
    return;
  }
  const nombre = nombreZonaCubo(z);
  const exag = gemelo.terreno.zonas[z].exageracion ?? gemelo.terreno.exageracion;
  if (zonasCubo.length > 1) {
    await verTodas(page);
    const t = (await boton.innerText()).trim();
    const m = (await motivo.isVisible()) ? await motivo.innerText() : "";
    await boton.dispatchEvent("click"); // aria-disabled: Playwright no lo pulsa; el clic debe quedar sin efecto
    check(`${prefijo}3D: con «All areas» dice «3D twin view: not available», su motivo, y no se activa`,
      t === "3D twin view: not available" && (await boton.getAttribute("aria-disabled")) === "true" && m.includes("Choose one pilot area") &&
        (await boton.getAttribute("aria-pressed")) === "false" && !(await gemelo3d(page)).activo, `${t} · ${m}`);
    await elegirZona(page, z);
  }
  check(`${prefijo}3D: en ${nombre} el botón «3D twin view» se ofrece (aria-pressed=false)`,
    (await boton.innerText()).trim() === "3D twin view" && (await boton.getAttribute("aria-pressed")) === "false" && (await boton.getAttribute("aria-disabled")) === null && !(await motivo.isVisible()));

  // Activar con el teclado
  await boton.focus();
  await page.keyboard.press("Enter");
  if (telefono) {
    const g0 = await gemelo3d(page);
    check(`${prefijo}3D con movimiento reducido: la cámara se inclina sin animación`, Math.abs(g0.pitch - camara.pitch) < 0.5 && Math.abs(g0.bearing - camara.bearing) < 0.5, `pitch ${g0.pitch}`);
  }
  await quieto(page);
  let g = await gemelo3d(page);
  check(`${prefijo}3D: se activa con el teclado (aria-pressed=true) con el relieve de ${nombre} (×${fmt3(exag)}, la de la zona)`,
    (await boton.getAttribute("aria-pressed")) === "true" && g.activo && g.terreno?.source === "gemelo-dem" && g.terreno?.exaggeration === exag, JSON.stringify(g.terreno));
  check(`${prefijo}3D: cámara del gemelo (pitch ${camara.pitch}, bearing ${camara.bearing})`, Math.abs(g.pitch - camara.pitch) < 0.5 && Math.abs(g.bearing - camara.bearing) < 0.5, `${g.pitch} / ${g.bearing}`);
  const elev = await page.evaluate(() => window.raizDepuracion.elevacionesDeZona());
  check(`${prefijo}3D: el lienzo tiene terreno (teselas cargadas, elevación > 0 en la zona, ninguna tesela fallida)`,
    g.relieveCargado && g.teselasFallidas === 0 && elev.some((e) => e > 0), elev.map((e) => Math.round(e)).join(", "));
  check(`${prefijo}3D: zoom mínimo = terreno.minzoom + 1 mientras está activa`, g.minZoom === gemelo.terreno.minzoom + 1, String(g.minZoom));
  let D = Number(await page.locator("#dotacion").inputValue());
  let esp = columnasEsperadas(z, D, 0);
  check(`${prefijo}3D: una columna por parcela clasificada que pide agua (${esp.cols.size}) y planas las demás (${esp.sinRiego} sin riego, ${esp.sinClasificar} sin clasificar)`,
    g.cuenta?.columna === esp.cols.size && g.cuenta?.sin_riego === esp.sinRiego && g.cuenta?.sin_clasificar === esp.sinClasificar &&
      g.cuenta.columna + g.cuenta.sin_riego === esp.clasificadas && mismasColumnas(g.columnas, esp), JSON.stringify(g.cuenta));
  const leyenda = await texto(page, "#bloque-gemelo3d");
  check(`${prefijo}3D: la leyenda aparece junto al mapa con la exageración (×${fmt3(exag)}), la escala y la fuente`,
    (await page.locator("#bloque-gemelo3d").isVisible()) && leyenda.includes(`×${fmt3(exag)}`) && leyenda.includes(`${fmt3(gemelo.columnas.metros_por_millar)} m of height`) && leyenda.includes(gemelo.terreno.fuente));
  await page.locator("#mapa").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, `${telefono ? "telefono" : "escritorio"}_gemelo3d.png`) });

  // El deslizador y la lluvia cambian las alturas.
  const antes = g.columnas;
  await fijarDeslizador(page, D === D1 ? D2 : D1);
  D = Number(await page.locator("#dotacion").inputValue());
  await dosCuadros(page);
  g = await gemelo3d(page);
  esp = columnasEsperadas(z, D, 0);
  check(`${prefijo}3D: mover el deslizador cambia las alturas (azul hasta lo que cubre la dotación)`, mismasColumnas(g.columnas, esp) && JSON.stringify(g.columnas) !== JSON.stringify(antes));
  const seca = cubo.lluvia_pct.find((x) => x !== 0);
  if (seca !== undefined) {
    await page.locator("#lluvia").check();
    await dosCuadros(page);
    const gs = await gemelo3d(page);
    check(`${prefijo}3D: «Rain ${seca}%» cambia lo que pide cada columna`, mismasColumnas(gs.columnas, columnasEsperadas(z, D, seca)) && JSON.stringify(gs.columnas) !== JSON.stringify(g.columnas));
    await page.locator("#lluvia").uncheck();
    await dosCuadros(page);
  }

  // Clic (o toque) en una columna abre su ficha.
  await quieto(page);
  const punto = await page.evaluate(() => window.raizDepuracion.puntoDeColumna());
  if (punto) {
    if (telefono) await page.touchscreen.tap(punto.x, punto.y);
    else await page.mouse.click(punto.x, punto.y);
    await page.waitForSelector("#ficha:not([hidden])", { timeout: 5000 }).catch(() => null);
    const titulo = (await page.locator("#ficha").isVisible()) ? await texto(page, "#ficha-titulo") : "";
    check(`${prefijo}3D: ${telefono ? "tocar" : "clic en"} la columna de ${punto.id} abre su ficha`, titulo === `Field ${punto.id}`, titulo);
    await cerrarFicha(page);
  } else {
    check(`${prefijo}3D: hay columnas a la vista para tocar`, false, "ningún punto sobre una columna");
  }

  if (!telefono) {
    // Enter con el mapa enfocado abre la columna bajo la mira del centro.
    await page.locator("#mapa canvas").focus();
    await page.keyboard.press("Enter");
    const centro = await page.evaluate(() => {
      const c = document.querySelector("#mapa canvas").getBoundingClientRect();
      return window.raizDepuracion.columnaEn(c.left + c.width / 2, c.top + c.height / 2);
    });
    if (centro) {
      await page.waitForSelector("#ficha:not([hidden])", { timeout: 5000 }).catch(() => null);
      const titulo = (await page.locator("#ficha").isVisible()) ? await texto(page, "#ficha-titulo") : "";
      check(`${prefijo}3D: Enter en el mapa abre la columna bajo la mira (${centro})`, titulo === `Field ${centro}`, titulo);
      await cerrarFicha(page);
    } else {
      omitir(`${prefijo}3D: Enter sobre una columna`, "ninguna columna bajo el centro del mapa en esta vista");
    }
    await page.locator("#boton-gemelo").focus();

    // Identidad: la columna que se ve en cada píxel es la que columnaEn devuelve (vista inicial y una girada).
    const r1 = await identidadColumnas(page);
    check(`${prefijo}3D: en la vista inicial, columnaEn da la columna que se ve en el píxel (≥ 99.5 % de ${r1.n} puntos fuera de bordes)`,
      r1.n > 200 && r1.bien / r1.n >= 0.995, `${((100 * r1.bien) / Math.max(1, r1.n)).toFixed(2)} % · otra ${r1.otra} · ninguna ${r1.ninguna} ${r1.ejemplos.join(" ; ")}`);
    const col = g.columnas[Math.floor(g.columnas.length * 0.6)];
    const centroCol = porId.get(col.id) ? (() => { const f = parcelas.features.find((x) => x.properties.id === col.id); const c = f.geometry.type === "Polygon" ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0]; return [c.reduce((a, p) => a + p[0], 0) / c.length, c.reduce((a, p) => a + p[1], 0) / c.length]; })() : null;
    await page.evaluate((c) => window.raizDepuracion.mapa.jumpTo({ center: c, zoom: 13.4, bearing: 120, pitch: 60 }), centroCol);
    await quieto(page);
    const r2 = await identidadColumnas(page);
    check(`${prefijo}3D: en una vista girada (zoom 13.4, bearing 120), columnaEn da la columna que se ve (≥ 99.5 % de ${r2.n} puntos)`,
      r2.n > 200 && r2.bien / r2.n >= 0.995, `${((100 * r2.bien) / Math.max(1, r2.n)).toFixed(2)} % · otra ${r2.otra} · ninguna ${r2.ninguna} ${r2.ejemplos.join(" ; ")}`);
    // Desactivar deja el mapa plano y sin capas del gemelo (las tramas de la identidad se fueron con ellas).
    await boton.click();
    await quieto(page);
    const plano = await gemelo3d(page);
    check(`${prefijo}3D: desactivar deja pitch 0, bearing 0, sin terreno ni capas o fuentes «gemelo-», y aria-pressed=false`,
      !plano.activo && plano.pitch === 0 && plano.bearing === 0 && plano.terreno === null && plano.capas.length === 0 && plano.fuentes.length === 0 &&
        (await boton.getAttribute("aria-pressed")) === "false" && !(await page.locator("#bloque-gemelo3d").isVisible()) && plano.minZoom < gemelo.terreno.minzoom + 1,
      JSON.stringify({ pitch: plano.pitch, bearing: plano.bearing, capas: plano.capas, fuentes: plano.fuentes, minZoom: plano.minZoom }));
    const vuelven = await page.evaluate(() => window.raizDepuracion.parcelasDibujadas());
    check(`${prefijo}3D: al desactivar, el mapa plano sigue dibujando las parcelas`, vuelven > 0, `${vuelven}`);

    // Otra zona con su propia exageración; después «All areas» retira la vista sola.
    const otra = zonasCubo.find((id) => id !== z && gemelo.terreno.zonas[id]);
    if (otra) {
      await boton.click();
      await quieto(page);
      await elegirZona(page, otra);
      await quieto(page);
      const go = await gemelo3d(page);
      const exagOtra = gemelo.terreno.zonas[otra].exageracion ?? gemelo.terreno.exageracion;
      const leyOtra = await texto(page, "#bloque-gemelo3d");
      check(`${prefijo}3D: al cambiar a ${nombreZonaCubo(otra)} sigue activa con SU exageración (×${fmt3(exagOtra)}) en el relieve y en la leyenda`,
        go.activo && go.zona === otra && go.terreno?.exaggeration === exagOtra && go.exageracion === exagOtra && leyOtra.includes(`×${fmt3(exagOtra)}`), JSON.stringify(go.terreno));
      const espOtra = columnasEsperadas(otra, D, 0);
      check(`${prefijo}3D: en ${nombreZonaCubo(otra)}, una columna por parcela clasificada que pide agua (${espOtra.cols.size})`, mismasColumnas(go.columnas, espOtra), JSON.stringify(go.cuenta));
      await page.screenshot({ path: path.join(CAPTURAS, `escritorio_gemelo3d_${otra}.png`) });
      await verTodas(page);
      await quieto(page);
      const gt = await gemelo3d(page);
      check(`${prefijo}3D: con «All areas» la vista se retira sola: mapa plano, sin capas del gemelo y el botón «not available»`,
        !gt.activo && gt.pitch === 0 && gt.bearing === 0 && gt.capas.length === 0 && gt.terreno === null && (await boton.innerText()).trim() === "3D twin view: not available",
        JSON.stringify({ pitch: gt.pitch, capas: gt.capas.length }));
      await elegirZona(page, z);
    }
  } else {
    await page.locator("#mapa").scrollIntoViewIfNeeded();
    check(`${prefijo}3D: sin desplazamiento horizontal con la vista activa`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
    await boton.click();
    await quieto(page);
    const plano = await gemelo3d(page);
    check(`${prefijo}3D: desactivar deja el mapa plano (pitch 0) y sin capas del gemelo`, !plano.activo && plano.pitch === 0 && plano.capas.length === 0 && plano.terreno === null);
  }
}


// ---------------------------------------------------------------- ficha completa (etapa 2 del gemelo)
const nfFicha = (v, d = 1) => (v == null || !Number.isFinite(Number(v)) ? "—" : nf({ maximumFractionDigits: d }).format(v).replace("-", "−"));
const pctFicha = (f) => nf({ style: "percent", maximumFractionDigits: 0 }).format(f).replace("-", "−");
const P0757 = porId.has("P0757") ? "P0757" : protagonistas.find((id) => opcionesDe(id).length > 3) ?? conNecesidad;
/** Parcela cuya opción ACTUAL no pide agua (lámina cero) y una abstenida, para los tres casos de la frase. */
const conLaminaCero = candidatos.find((id) => !porId.get(id).abstencion && actualDe(id) && !(l50(actualDe(id)) > 0));
/** Una opción con su lámina local de referencia (de un solo cultivo) y otra sin ella (dos cultivos o corte de verano). */
const opcionesTodas = Object.entries(cubo.parcelas).flatMap(([pid, pc]) => pc.opciones.map((o) => ({ pid, o })));
const conRefLocal = opcionesTodas.find(({ pid, o }) => pid === P0757 && o.agua?.lamina_local) ?? opcionesTodas.find(({ o }) => o.agua?.lamina_local && Number.isFinite(o.agua.lamina_local.valor_millares_ha));
const conPropuesta = opcionesTodas.find(({ pid, o }) => protagonistas.includes(pid) && o.origen_opcion === "team_proposal") ?? opcionesTodas.find(({ o }) => o.origen_opcion === "team_proposal");
const conSinRotacion = [...protagonistas, ...candidatos].find((id) => cubo.parcelas?.[id]?.sin_rotacion);
const conDotMin = opcionesTodas.find(({ pid, o }) => pid === P0757 && (o.filtros ?? []).some((f) => f.tipo === "dotacion_minima")) ??
  opcionesTodas.find(({ o }) => (o.filtros ?? []).some((f) => f.tipo === "dotacion_minima"));

/** Frase resumen esperada (la misma función de web/js/resumen.js con la evaluación de web/reglas.js). */
function fraseEsperada(id, D) {
  const p = porId.get(id);
  const actual = actualDe(id) ?? null;
  const evaluacion = actual && !p.abstencion ? evaluarOpcion(actual, p.area_ha, D, 0) : null;
  // El mismo formato que app.js (pintarResumen): hectáreas y área con formatoHectareas; años con la precisión del dato.
  const fh = formatoHectareas(p.area_ha);
  return fraseResumen({ parcela: p, opcionActual: actual, evaluacion, D, formato: (v, k) => (k === "ha" || k === "area" ? fh(v) : k === "anios" ? nfFicha(v, 3) : nfFicha(v)) });
}

/**
 * C2 de la revisión total y punto 6 de la revisión con Playwright («Enough for 8 of 7.95 hectares», «20.7 of 20.66»):
 * con cada marca de dotación, ninguna cifra de hectáreas que alcanzan (tarjeta, rango, lámina local, frase) pasa del
 * área, y el área se escribe igual que en formatoHectareas. Devuelve la lista de textos que fallan.
 */
async function hectareasSobreArea(page, id) {
  const area = porId.get(id).area_ha;
  const fh = formatoHectareas(area);
  const num = (x) => Number(String(x).replace(/,/g, "").replace("−", "-"));
  const malos = [];
  for (const m of marcas) {
    await fijarDeslizador(page, m.valor);
    const textos = await page.locator("#ficha .alcanza, #ficha .lamina-local-alcanza, #ficha-resumen").allInnerTexts();
    for (const t of textos.map((x) => x.replace(/\s+/g, " "))) {
      for (const [, x, y] of t.matchAll(/([\d,.]+)(?:–[\d,.]+)? of ([\d,.]+) hectares?/g)) if (!(num(x) <= area) || y !== fh(area)) malos.push(`${m.id}: ${t}`);
      for (const [, a, b] of t.matchAll(/range ([\d,.]+) to ([\d,.]+)/g)) if (!(num(a) <= area && num(b) <= area)) malos.push(`${m.id}: ${t}`);
      for (const [, y] of t.matchAll(/whole field \(([\d,.]+) ha\)/g)) if (y !== nfFicha(area, 3)) malos.push(`${m.id}: ${t}`);
      for (const [, x] of t.matchAll(/high estimate of its need: ([\d,.]+) hectares?/g)) if (!(num(x) < area)) malos.push(`${m.id}: ${t}`);
    }
  }
  return malos;
}

/**
 * Ficha completa: frase resumen (tres casos), NDVI con umbrales, aptitud y perfil de suelo, lámina local, propuesta del
 * equipo, nogal sin rotación, dotacion_minima en vivo, GEDI con su nota, riesgo de helada y la advertencia con plazo.
 */
async function pruebaFichaCompleta(page, prefijo, telefono) {
  const sufijo = telefono ? "telefono" : "escritorio";
  // --- Frase resumen: con agua (cambia con el deslizador), lámina cero y abstenida ---
  if (P0757) {
    await abrirDesdeLista(page, P0757);
    for (const D of [D1, D2]) {
      await fijarDeslizador(page, D);
      const frase = (await texto(page, "#ficha-resumen")).trim();
      check(`${prefijo}frase resumen de ${P0757} con ${D} thousand m³/ha (con agua): la de resumen.js con la dotación`, frase === fraseEsperada(P0757, D) && frase.startsWith(`With ${nfFicha(D)} thousand m³/ha`), frase);
    }
    const caso = await page.locator("#ficha-resumen").getAttribute("data-caso");
    check(`${prefijo}frase resumen de ${P0757}: caso «parcial» o «completa»`, ["parcial", "completa"].includes(caso), caso);
    // Punto 1 de la revisión con Playwright: el plazo del agua de la opción ACTUAL va en la frase (leído del cubo).
    const plazo = actualDe(P0757)?.agua?.plazo_anios;
    if (plazo) {
      const fraseP = (await texto(page, "#ficha-resumen")).trim();
      const esperado = plazo.max <= 1 ? "ties up water for one season" : `ties up water for ${plazo.min === plazo.max ? nfFicha(plazo.min, 3) : `${nfFicha(plazo.min, 3)}–${nfFicha(plazo.max, 3)}`} years`;
      check(`${prefijo}frase resumen de ${P0757}: lleva el plazo del agua de la opción actual («${esperado}»)`, fraseP.includes(esperado), fraseP);
    }
    // Pendientes de web del motor (1c6619b): «Remaining term» en todas las tarjetas con plazo restante, y la ventana de
    // siembra solo de los cultivos de la secuencia publicada (avena_maiz sin la alfalfa del catálogo).
    for (const o of opcionesDe(P0757)) {
      const t = tarjeta(page, o.id);
      if (o.agua?.plazo_restante) {
        const agua = (await t.locator('[data-parte="agua"]').innerText()).replace(/\s+/g, " ");
        check(`${prefijo}${P0757}/${o.id}: «Remaining term» también en las alternativas`, agua.includes("Remaining term:"), agua.slice(-160));
      }
      const pasos = (cubo.opciones_catalogo?.[o.rotacion]?.secuencia ?? []).filter((x) => x?.siembra?.desde);
      const esperados = pasos.filter((x) => !Array.isArray(o.secuencia) || !o.secuencia.length || o.secuencia.includes(x.cultivo)).length;
      const vistos = await t.locator(".siembra-cultivo").count();
      check(`${prefijo}${P0757}/${o.id}: ventanas de siembra solo de los cultivos de la secuencia publicada (${esperados})`, vistos === esperados, `${vistos} vistas · secuencia ${JSON.stringify(o.secuencia)}`);
    }
    const frase = await texto(page, "#ficha-resumen");
    check(`${prefijo}frase resumen: describe, sin «best», «recommended» ni pesos`, !/\b(best|recommended|weight|score)\b/i.test(frase));
    // --- NDVI mensual con sus umbrales (leídos de ndvi_mensual.json) ---
    const serie = ndviMensual?.parcelas?.[P0757];
    if (serie) {
      const conDato = serie.filter((v) => v != null).length;
      const g = await page.evaluate(() => {
        const r = document.querySelector("#ficha-ndvi .resumen-ndvi");
        return {
          estado: r?.dataset.estado,
          puntos: r?.querySelectorAll("circle.resumen-ndvi-punto").length ?? 0,
          huecos: r?.querySelectorAll("rect.resumen-ndvi-hueco").length ?? 0,
          umbrales: [...(r?.querySelectorAll("line[data-umbral]") ?? [])].map((x) => x.dataset.umbral),
          texto: r?.innerText ?? "",
          cabe: r ? r.getBoundingClientRect().right <= document.querySelector("#ficha").getBoundingClientRect().right + 1 : false,
        };
      });
      check(`${prefijo}NDVI de ${P0757}: un punto por mes con dato (${conDato}) y sin huecos`, g.estado === "con_datos" && g.puntos === conDato && g.huecos === serie.length - conDato, JSON.stringify({ ...g, texto: undefined }));
      const umbrales = Object.entries(ndviMensual.umbrales ?? {}).filter(([, u]) => u).map(([k]) => k);
      check(`${prefijo}NDVI: líneas de referencia de los datos (${umbrales.join(", ") || "ninguna"}) con su valor`,
        umbrales.every((k) => g.umbrales.includes(k)) && umbrales.every((k) => g.texto.includes(nf({ maximumFractionDigits: 3 }).format(ndviMensual.umbrales[k].valor))), g.umbrales.join(", "));
      check(`${prefijo}NDVI: la gráfica cabe en la ficha (sin desbordar)`, g.cabe);
      await page.locator("#ficha-ndvi").scrollIntoViewIfNeeded();
      await esperarAnimaciones(page);
      await page.screenshot({ path: path.join(CAPTURAS, `${sufijo}_ficha_resumen_ndvi.png`) });
    } else {
      omitir(`${prefijo}NDVI de ${P0757}`, "ndvi_mensual.json no trae la parcela");
    }
    // --- Lámina local de referencia: valor, hectáreas que cambian con el deslizador y su límite ---
    if (conRefLocal && conRefLocal.pid === P0757) {
      const ll = conRefLocal.o.agua.lamina_local;
      const area = porId.get(P0757).area_ha;
      const caja = tarjeta(page, conRefLocal.o.id).locator(".lamina-local").first();
      const vistos = [];
      for (const D of [D1, D2]) {
        await fijarDeslizador(page, D);
        const t = (await caja.innerText()).replace(/\s+/g, " ");
        vistos.push(t);
        const fh = formatoHectareas(area);
        const cob = cobertura(D, ll.valor_millares_ha);
        const alcanza = cob >= 1 ? `enough for the whole field (${nfFicha(area, 3)} ha)` : `enough for ${fh(area * cob)} of ${fh(area)} hectares`;
        check(`${prefijo}lámina local de ${P0757}/${conRefLocal.o.id} con ${D}: ${nfFicha(ll.valor_millares_ha)} thousand m³/ha (I8: un decimal) y «${alcanza}»`,
          t.includes(`${nfFicha(ll.valor_millares_ha)} thousand m³/ha`) && t.includes(alcanza), t);
      }
      check(`${prefijo}lámina local: las hectáreas cambian con el deslizador`, vistos[0] !== vistos[1]);
      const titulo = ll.tipo === "aplicada"
        ? `Typically applied in this district (${ll.periodo ? `${ll.periodo.desde}–${ll.periodo.hasta} records; ` : ""}measurement point not confirmed)`
        : "Recommended by INIFAP";
      check(`${prefijo}lámina local: rótulo «${titulo}» y su límite a la vista`, vistos[1].includes(titulo) && /district average, not this field|regional recommendation, not this field/.test(vistos[1]), vistos[1]);
      check(`${prefijo}lámina local: el semáforo sigue con la lámina del modelo`, (await tarjeta(page, conRefLocal.o.id).getAttribute("data-semaforo")) === evaluarOpcion(conRefLocal.o, area, D2, 0).semaforo);
      await caja.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(CAPTURAS, `${sufijo}_ficha_lamina_local.png`) });
    }
    for (const o of opcionesDe(P0757)) {
      const sinRef = !o.agua?.lamina_local && l50(o) > 0;
      if (!sinRef) continue;
      const t = await tarjeta(page, o.id).locator(".lamina-local").innerText().catch(() => "");
      check(`${prefijo}${P0757}/${o.id} (${o.secuencia.join(" + ")}): «no local reference»`, /no local reference/.test(t), t);
    }
    // --- Aptitud de suelo con su rótulo y su estado en texto, en cada tarjeta ---
    const apt = suelo?.aptitud?.[P0757];
    if (apt) {
      for (const o of opcionesDe(P0757)) {
        const a = apt[o.id];
        const fila = tarjeta(page, o.id).locator(".renglon-suelo .suelo-aptitud");
        const t = (await fila.innerText().catch(() => "")).replace(/\s+/g, " ");
        const estadoVisto = await fila.getAttribute("data-estado").catch(() => null);
        if (a?.nota === "nothing is planted") {
          check(`${prefijo}aptitud ${P0757}/${o.id}: «Soil fit: nothing is planted»`, /Soil fit: nothing is planted/.test(t), t);
        } else if (a) {
          const e = ESTADOS_APTITUD[a.estado];
          check(`${prefijo}aptitud ${P0757}/${o.id}: estado «${e.etiqueta}» en texto y con su rótulo`, estadoVisto === a.estado && t.includes(e.etiqueta) && t.includes(suelo.rotulo_aptitud ?? ROTULO_APTITUD), t);
        }
      }
      const orden = await page.locator("#ficha .tarjeta").evaluateAll((ts) => ts.map((x) => x.dataset.opcion));
      check(`${prefijo}la aptitud no reordena ni quita opciones (orden del cubo)`, JSON.stringify(orden) === JSON.stringify(opcionesDe(P0757).map((o) => o.id)), orden.join(", "));
    }
    // --- Perfil de suelo: una vez por ficha, con el grupo de textura y lo que el mapa no trae ---
    const perfil = suelo?.perfil?.parcelas?.[P0757];
    if (perfil) {
      check(`${prefijo}perfil de suelo de ${P0757}: una sola vez en la ficha`, (await page.locator("#ficha .suelo-perfil").count()) === 1);
      const t = (await texto(page, "#seccion-evidencia")).replace(/\s+/g, " ");
      const grupo = grupoDeTextura(perfil.clase_textura, suelo.requisitos?.grupos_textura);
      check(`${prefijo}perfil: textura por su grupo (${grupo}) y la clase exacta plegada`, grupo != null && t.includes(`Texture group: ${grupo}`) && (await page.locator("#ficha .suelo-clase-exacta").count()) === 1, t.slice(0, 160));
      const faltan = [["Total nitrogen", perfil.nitrogeno_g_kg], ["Salinity (electrical conductivity)", perfil.salinidad_ce_ds_m]].filter(([, v]) => v == null);
      check(`${prefijo}perfil: lo que el mapa no trae dice «not in the map» (${faltan.map(([k]) => k).join(", ")})`, faltan.every(([k]) => t.includes(`${k}: not in the map`) || t.includes(`${k} not in the map`)), t.slice(0, 400));
      check(`${prefijo}perfil: «Phosphorus, potassium, iron, zinc: needs a soil test»`, t.includes("Phosphorus, potassium, iron, zinc: needs a soil test"));
      const zona = zonaDeProp(porId.get(P0757));
      const alc = suelo.alcalinidad_zona?.[zona];
      if (alc?.mayoria) {
        check(`${prefijo}nota de zona: ${alc.n_sobre_optimo} de ${alc.n_con_ph} parcelas con pH sobre el óptimo de la mayoría de ${alc.n_cultivos} cultivos`, t.includes(`Area note: ${alc.n_sobre_optimo} of ${alc.n_con_ph} mapped fields`) && t.includes(`most of the ${alc.n_cultivos} crops`), t.slice(t.indexOf("Area note"), t.indexOf("Area note") + 200));
      }
      // --- GEDI con su nota SIEMPRE junto al valor ---
      if (contexto?.gedi) {
        const li = page.locator('#seccion-evidencia li[data-evidencia="GEDI height reading"]');
        const tg = (await li.innerText().catch(() => "")).replace(/\s+/g, " ");
        check(`${prefijo}GEDI de ${P0757}: el valor y su nota en el mismo renglón`, tg.startsWith("GEDI height reading:") && tg.includes(NOTA_GEDI) && (await li.locator(".evidencia-nota").isVisible()), tg.slice(0, 200));
      }
      await page.locator("#seccion-evidencia").scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(CAPTURAS, `${sufijo}_ficha_suelo_evidencia.png`) });
    }
    // --- dotacion_minima evaluado en vivo contra el deslizador ---
    if (conDotMin && conDotMin.pid === P0757) {
      const f = conDotMin.o.filtros.find((x) => x.tipo === "dotacion_minima");
      const minimo = cubo.filtros_catalogo[f.id].regla.lamina_minima_cm / cubo.dotaciones.lamina_cm_por_millar.valor;
      const li = tarjeta(page, conDotMin.o.id).locator(`.filtros li[data-filtro="${f.id}"]`);
      const vistos = [];
      for (const D of [deslizador.min, minimo, deslizador.max]) {
        await fijarDeslizador(page, D);
        const e = await li.getAttribute("data-estado");
        vistos.push(`${D}:${e}`);
        check(`${prefijo}dotacion_minima «${f.id}» con ${D} thousand m³/ha (mínimo ${nfFicha(minimo, 3)}): ${D >= minimo ? "passes" : "warning"}, nunca «needs a local check»`, e === (D >= minimo ? "passes" : "warning"), (await li.innerText()).replace(/\s+/g, " ").slice(0, 160));
      }
      check(`${prefijo}dotacion_minima cambia de estado al mover el deslizador`, new Set(vistos.map((x) => x.split(":")[1])).size === 2, vistos.join(" · "));
      await fijarDeslizador(page, deslizador.min);
      await li.scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(CAPTURAS, `${sufijo}_ficha_dotacion_minima.png`) });
    }
    // --- Riesgo de helada junto a la fecha de siembra (opciones que lo tienen) ---
    for (const o of opcionesDe(P0757)) {
      const sec = cubo.opciones_catalogo?.[o.rotacion]?.secuencia ?? [];
      const conRiesgo = sec.filter((x) => x?.siembra?.desde).map((x) => riesgoDeHelada({ contexto, fechaSiembra: x.siembra.desde, zonaId: zonaDeProp(porId.get(P0757)) })).filter(Boolean);
      if (!conRiesgo.length) continue;
      const t = (await tarjeta(page, o.id).locator(".siembra").innerText()).replace(/\s+/g, " ");
      check(`${prefijo}riesgo de helada junto a la siembra en ${P0757}/${o.id}: ${conRiesgo.map((r) => pctFicha(r.prob)).join(", ")}`, conRiesgo.every((r) => t.includes(`${pctFicha(r.prob)}`)) && /Planting window/.test(t) && /chance of a frost after/.test(t), t);
    }
    // --- advertir_si_rojo con el plazo del dato ---
    const conAdv = opcionesDe(P0757).find((o) => o.advertir_si_rojo);
    if (conAdv) {
      const D = [deslizador.min, D1, D2].find((x) => evaluarOpcion(conAdv, porId.get(P0757).area_ha, x, 0).semaforo === "rojo");
      if (D != null) {
        await fijarDeslizador(page, D);
        const plazo = conAdv.agua.plazo_anios;
        const t = await tarjeta(page, conAdv.id).locator(".advertencia").innerText();
        const esperado = `${plazo.min === plazo.max ? plazo.min : `${plazo.min}–${plazo.max}`} ${plazo.max === 1 ? "year" : "years"}`;
        check(`${prefijo}advertir_si_rojo en ${P0757}/${conAdv.id}: recuerda que la alfalfa obliga ${esperado}`, t.includes(esperado) && (!conAdv.secuencia.includes("alfalfa") || t.includes("alfalfa")), t);
      }
    }
    await fijarDeslizador(page, D2);
    await cerrarFicha(page);
  } else {
    omitir(`${prefijo}ficha completa`, "ninguna parcela con opciones en estos datos");
  }
  // --- Frase en lámina cero y en una abstenida ---
  if (conLaminaCero) {
    await abrirDesdeLista(page, conLaminaCero);
    const f = (await texto(page, "#ficha-resumen")).trim();
    check(`${prefijo}frase resumen de ${conLaminaCero} (lámina cero): «needs no irrigation»`, (await page.locator("#ficha-resumen").getAttribute("data-caso")) === "sin_riego" && f === fraseEsperada(conLaminaCero, D2) && f.includes("needs no irrigation"), f);
    await cerrarFicha(page);
  } else {
    omitir(`${prefijo}frase en lámina cero`, "ninguna opción ACTUAL con lámina cero");
  }
  if (abstenidas.length) {
    const id = suelo?.perfil?.parcelas?.P0316 && porId.get("P0316")?.abstencion ? "P0316" : abstenidas[0];
    await abrirDesdeLista(page, id);
    const f = (await texto(page, "#ficha-resumen")).trim();
    check(`${prefijo}frase resumen de ${id} (abstenida): «Not classified — check with a technician»`, (await page.locator("#ficha-resumen").getAttribute("data-caso")) === "abstenida" && f.startsWith("Not classified — check with a technician"), f);
    const p = suelo?.perfil?.parcelas?.[id];
    if (p && ["ph", "clase_textura", "arena_pct"].every((k) => p[k] == null)) {
      check(`${prefijo}${id} sin dato de suelo: «Soil profile: no soil data for this field»`, (await texto(page, "#seccion-evidencia")).includes("Soil profile: no soil data for this field"));
    }
    await cerrarFicha(page);
  }
  // --- Propuesta del equipo rotulada ---
  if (conPropuesta) {
    await abrirDesdeLista(page, conPropuesta.pid);
    const t = await tarjeta(page, conPropuesta.o.id).locator(".tarjeta-cabeza").innerText();
    check(`${prefijo}propuesta del equipo ${conPropuesta.pid}/${conPropuesta.o.id}: rótulo «${conPropuesta.o.etiqueta_opcion}» junto al nombre`, t.includes(conPropuesta.o.nombre) && t.includes(conPropuesta.o.etiqueta_opcion), t.replace(/\s+/g, " "));
    const oficiales = opcionesDe(conPropuesta.pid).filter((o) => o.origen_opcion !== "team_proposal").map((o) => o.id);
    let sinRotulo = true;
    for (const id of oficiales) sinRotulo &&= (await tarjeta(page, id).locator(".insignia-propuesta").count()) === 0;
    check(`${prefijo}las opciones de la tabla oficial no llevan el rótulo de propuesta`, sinRotulo);
    await cerrarFicha(page);
  }
  // --- Nogal sin rotación: su motivo y su fuente en lugar de las alternativas ---
  if (conSinRotacion) {
    const sr = cubo.parcelas[conSinRotacion].sin_rotacion;
    await abrirDesdeLista(page, conSinRotacion);
    const t = (await page.locator("#ficha [data-parte='sin-rotacion']").innerText().catch(() => "")).replace(/\s+/g, " ");
    check(`${prefijo}${conSinRotacion} (no rota): una tarjeta y su motivo y fuente del dato`, (await page.locator("#ficha .tarjeta").count()) === 1 && t.includes(sr.motivo) && t.includes(sr.fuente.slice(0, 40)), t.slice(0, 160));
    await page.locator("#ficha [data-parte='sin-rotacion']").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(CAPTURAS, `${sufijo}_ficha_nogal_sin_rotacion.png`) });
    await cerrarFicha(page);
  }
  if (telefono) {
    check(`${prefijo}con la ficha completa, sin desplazamiento horizontal`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  }
}

/** Enlace directo: #P0757 abre su ficha (sin pantalla de inicio), el hash sigue a la ficha, un id desconocido avisa. */
async function pruebaEnlaceDirecto(navegador, base, prefijo, opciones) {
  if (!P0757) return;
  const ctxE = await abrir(navegador, base, opciones, `${prefijo}enlace #${P0757}`, {}, { inicio: true, hash: `#${P0757}` });
  const { page } = ctxE;
  const titulo = (await page.locator("#ficha").isVisible()) ? await texto(page, "#ficha-titulo") : "";
  check(`${prefijo}#${P0757} abre la ficha de ${P0757} al cargar`, titulo === `Field ${P0757}`, titulo || "ficha cerrada");
  check(`${prefijo}con un enlace directo no aparece la pantalla de inicio encima de la ficha`, (await page.locator(".acerca-inicio").count()) === 0);
  const otro = protagonistas.find((x) => x !== P0757 && zonaDeProp(porId.get(x)) === zonaDeProp(porId.get(P0757))) ?? candidatos.find((x) => x !== P0757 && zonaDeProp(porId.get(x)) === zonaDeProp(porId.get(P0757)));
  if (otro) {
    await abrirDesdeLista(page, otro);
    check(`${prefijo}al abrir otra ficha el hash cambia a #${otro}`, (await page.evaluate(() => location.hash)) === `#${otro}`);
  }
  await cerrarFicha(page);
  check(`${prefijo}al cerrar la ficha el hash se quita`, (await page.evaluate(() => location.hash)) === "");
  // Una parcela de otra zona por «hashchange»: la página pasa a su zona y abre la ficha.
  const deOtraZona = protagonistas.find((x) => zonaDeProp(porId.get(x)) !== zonaDeProp(porId.get(P0757)));
  if (deOtraZona && zonasCubo.length > 1) {
    await page.evaluate((h) => { location.hash = h; }, `#${deOtraZona}`);
    await page.waitForFunction((id) => document.querySelector("#ficha-titulo")?.textContent === `Field ${id}`, deOtraZona, { timeout: 8000 }).catch(() => null);
    check(`${prefijo}«hashchange» a #${deOtraZona}: cambia a su zona y abre la ficha`, (await texto(page, "#ficha-titulo")) === `Field ${deOtraZona}` && (await page.locator("#zona-sel").inputValue()) === zonaDeProp(porId.get(deOtraZona)));
    await cerrarFicha(page);
  }
  // El ancla «Skip to the map» (#principal) no es un id de parcela y no avisa.
  await page.evaluate(() => { location.hash = "#principal"; });
  await page.waitForTimeout(150);
  check(`${prefijo}#principal (ancla de la página) no muestra el aviso de enlace`, await page.locator("#aviso-enlace").isHidden());
  check(`${prefijo}enlace directo: sin errores de consola`, ctxE.errores.length === 0, ctxE.errores.join(" | "));
  await ctxE.ctx.close();
  // Un id que no existe: aviso visible, ninguna ficha, la página sigue.
  const ctxX = await abrir(navegador, base, opciones, `${prefijo}enlace desconocido`, {}, { hash: "#ZZ9999" });
  const aviso = (await ctxX.page.locator("#aviso-enlace").isVisible()) ? await texto(ctxX.page, "#aviso-enlace") : "";
  check(`${prefijo}#ZZ9999 (id desconocido): aviso visible, sin ficha y la página sigue`, aviso.includes("ZZ9999") && aviso.includes("no field with that ID") && (await ctxX.page.locator("#ficha").isHidden()) && (await ctxX.page.locator(".boton-parcela").count()) === props.length, aviso);
  if (!prefijo) await ctxX.page.screenshot({ path: path.join(CAPTURAS, "escritorio_enlace_desconocido.png") });
  check(`${prefijo}enlace desconocido: sin errores de consola`, ctxX.errores.length === 0, ctxX.errores.join(" | "));
  await ctxX.ctx.close();
}

/** NDVI con huecos (variante en memoria de ndvi_mensual.json): la línea se corta donde hay null y el hueco se rotula. */
async function pruebaNDVIHuecos(navegador, base) {
  if (!ndviMensual || !P0757 || !ndviMensual.parcelas?.[P0757]) {
    omitir("NDVI con huecos", "sin ndvi_mensual.json o sin la parcela");
    return;
  }
  const n = structuredClone(ndviMensual);
  const serie = n.parcelas[P0757];
  // DATOS DE PRUEBA: dos meses sin dato (uno suelto y otro al final) para cortar la línea.
  const nulos = [1, serie.length - 1];
  for (const i of nulos) serie[i] = null;
  const conDato = serie.filter((v) => v != null).length;
  const tramos = [];
  let corrida = 0;
  for (const v of serie) {
    if (v == null) { if (corrida) tramos.push(corrida); corrida = 0; } else corrida += 1;
  }
  if (corrida) tramos.push(corrida);
  const ctxN = await abrir(navegador, base, { viewport: { width: 1366, height: 860 }, reducedMotion: "reduce" }, "NDVI con huecos", { "ndvi_mensual.json": n }, { hash: `#${P0757}` });
  const g = await ctxN.page.evaluate(() => {
    const r = document.querySelector("#ficha-ndvi .resumen-ndvi");
    return {
      puntos: r?.querySelectorAll("circle.resumen-ndvi-punto").length ?? 0,
      huecos: [...(r?.querySelectorAll("rect.resumen-ndvi-hueco[data-mes]") ?? [])].map((x) => x.dataset.mes),
      trazos: r?.querySelectorAll("path.resumen-ndvi-linea").length ?? 0,
      clave: r?.querySelector('[data-clave="hueco"]')?.textContent ?? "",
    };
  });
  check(`NDVI con huecos: ${conDato} puntos, una banda rayada por mes sin dato (${nulos.length}) y la línea cortada en ${tramos.filter((t) => t > 1).length} trazos`,
    g.puntos === conDato && JSON.stringify(g.huecos) === JSON.stringify(nulos.map((i) => n.meses[i])) && g.trazos === tramos.filter((t) => t > 1).length && /No data/.test(g.clave), JSON.stringify(g));
  await ctxN.page.locator("#ficha-ndvi").scrollIntoViewIfNeeded();
  await ctxN.page.screenshot({ path: path.join(CAPTURAS, "escritorio_ndvi_huecos.png") });
  check("NDVI con huecos: sin errores de consola", ctxN.errores.length === 0, ctxN.errores.join(" | "));
  await ctxN.ctx.close();
}

// ---------------------------------------------------------------- paneles y registro (etapa 3 de la integración)
const zonaContexto = zonaInicial ?? (zonasCubo.length === 1 ? zonasCubo[0] : null);
// Frases que las advertencias de la sesión de datos deben poner a la vista (data/recursos_reto.json → tarjetas).
const ADVERTENCIAS = { evapotranspiracion: "comparison, not validation", segundo_clima: "not the FAO-56 reference evapotranspiration", agua_almacenada: "basin series", temperatura_minima: "not from NASA" };

/** Abre «Regional context» (plegable) y espera a que se dibuje. */
async function abrirContexto(page) {
  const bloque = page.locator("#bloque-contexto");
  if (!(await bloque.evaluate((d) => d.open))) await page.locator("#bloque-contexto > summary").click();
  await page.waitForFunction(() => Boolean(document.body.dataset.contexto), null, { timeout: 10000 }).catch(() => null);
}

/** Año agrícola con lluvia de IMERG en dos años de la línea de tiempo con valores distintos (para el cambio de año). */
function aniosDistintos(zona) {
  const [a0, a1] = gemelo?.tiempo?.anios ?? [];
  if (!contexto || !zona || a0 == null) return null;
  const valor = (a) => climaDelAnio(contexto, zona, a)?.lluviaImerg;
  const otro = [...Array(a1 - a0).keys()].map((k) => a1 - 1 - k).find((a) => valor(a) != null && valor(a) !== valor(a1));
  return valor(a1) != null && otro != null ? [a1, otro] : null;
}

async function pruebaContextoRegional(page, prefijo, telefono) {
  const bloque = page.locator("#bloque-contexto");
  check(`${prefijo}Regional context: bloque plegable en el panel, cerrado al abrir la página`, (await page.locator(".panel #bloque-contexto").count()) === 1 && !(await bloque.evaluate((d) => d.open)) && (await texto(page, "#bloque-contexto > summary")).includes("Regional context"));
  await abrirContexto(page);
  if (!contexto) {
    check(`${prefijo}sin contexto.json: «Regional context: not available yet.»`, (await texto(page, "#contexto-regional")).includes("not available yet"));
    return;
  }
  if (!zonaContexto) {
    omitir(`${prefijo}Regional context por zona`, "el cubo no trae zonas");
    return;
  }
  const raiz = page.locator("#contexto-regional .contexto");
  const anio = Number(await page.locator("#linea-tiempo .tiempo-rango").inputValue().catch(() => "NaN"));
  const donde = await texto(page, "#contexto-regional .contexto-donde");
  const nombre = contexto.zonas?.[zonaContexto]?.nombre ?? zonaContexto;
  check(`${prefijo}Regional context ligado a la zona (${nombre}) y al año de la línea de tiempo (${anio})`, donde.includes(nombre) && donde.includes(`agricultural year ${anio}`), donde);
  const nota = await raiz.locator("p.contexto-nota").last().innerText();
  check(`${prefijo}Regional context: nota de que las series regionales no describen una parcela`, nota === NOTA_REGIONAL && /not a single field/.test(nota) && (await texto(page, "#bloque-contexto > summary")).includes("not a single field"));
  // Una tarjeta por grupo de series de contexto.json, con gráfica si la serie llegó.
  const tarjetas = await raiz.locator(".contexto-tarjeta[data-tarjeta]").evaluateAll((xs) => xs.map((x) => ({ id: x.dataset.tarjeta, figuras: x.querySelectorAll(".contexto-figura svg").length })));
  const ids = (contexto.tarjetas ?? []).map((t) => t.id);
  check(`${prefijo}Regional context: una tarjeta por grupo de series (${ids.length}) más GAEZ, con gráficas`, ids.every((id) => tarjetas.some((x) => x.id === id)) && tarjetas.filter((x) => x.figuras > 0).length >= Math.min(ids.length, 5), tarjetas.map((x) => `${x.id}:${x.figuras}`).join(" "));
  // Advertencias de la sesión de datos, a la vista (no plegadas).
  for (const [tarjeta, frase] of Object.entries(ADVERTENCIAS)) {
    const t = contexto.tarjetas?.find((x) => x.id === tarjeta);
    if (!t?.advertencias?.length) {
      check(`${prefijo}Regional context: la tarjeta ${tarjeta} trae su advertencia en contexto.json`, false, "sin advertencias en los datos");
      continue;
    }
    const li = raiz.locator(`[data-tarjeta="${tarjeta}"] .contexto-advertencia`);
    const textos = (await li.count()) ? await li.allInnerTexts() : [];
    check(`${prefijo}Regional context: a la vista en «${t.titulo}»: «${frase}»`, textos.some((x) => x.includes(frase)) && (await li.first().isVisible()), textos.join(" | ").slice(0, 160));
  }
  // GRACE: serie de cuenca con su malla y la de sus mascons (cifras de la entrega).
  const grace = Object.values(contexto.contexto_regional?.cuenca ?? {})[0];
  if (grace?.malla_mascon) {
    const meta = await raiz.locator('[data-tarjeta="agua_almacenada"] .contexto-meta').first().innerText();
    check(`${prefijo}Regional context: GRACE dice «Basin scale» y ${formatoNumero(grace.malla_mascon.mascon_grados)}° mascons (de la línea de LEEME)`, meta.includes("Basin scale") && meta.includes(textoMascon(grace)), meta.replace(/\n/g, " "));
  }
  // Cambiar el año de la línea de tiempo cambia el valor mostrado.
  const par = aniosDistintos(zonaContexto);
  const rango = page.locator("#linea-tiempo .tiempo-rango");
  const fijarAnio = (a) => rango.evaluate((el, v) => { el.value = String(v); el.dispatchEvent(new Event("input", { bubbles: true })); }, a);
  const lluviaImerg = () => raiz.locator(".contexto-cifra-lado .contexto-cifra").first().innerText();
  if (par) {
    const [a1, a2] = par;
    await fijarAnio(a1);
    const v1 = await lluviaImerg();
    await fijarAnio(a2);
    const v2 = await lluviaImerg();
    const d2 = await texto(page, "#contexto-regional .contexto-donde");
    const e1 = formatoNumero(climaDelAnio(contexto, zonaContexto, a1).lluviaImerg);
    const e2 = formatoNumero(climaDelAnio(contexto, zonaContexto, a2).lluviaImerg);
    check(`${prefijo}Regional context: mover la línea de tiempo de ${a1} a ${a2} cambia la lluvia mostrada (${e1} → ${e2} mm)`, v1.includes(e1) && v2.includes(e2) && v1 !== v2 && d2.includes(`agricultural year ${a2}`), `${v1.replace(/\n/g, " ")} → ${v2.replace(/\n/g, " ")}`);
    const resaltado = await raiz.locator('.contexto-figura[data-grafica="clima-lluvia"] .contexto-elegido-texto').textContent().catch(() => "");
    check(`${prefijo}Regional context: la gráfica de lluvia resalta ${a2}`, resaltado === String(a2), resaltado);
    await fijarAnio(a1);
  } else {
    omitir(`${prefijo}Regional context: cambio de año`, "ningún par de años con lluvia distinta en la línea de tiempo");
  }
  // Un año con días faltantes que sí tiene total lo dice junto a su cifra.
  const [t0, t1] = gemelo?.tiempo?.anios ?? [];
  const incompleto = t0 == null ? null : [...Array(t1 - t0 + 1).keys()].map((k) => t1 - k).find((a) => {
    const c = climaDelAnio(contexto, zonaContexto, a);
    return c && c.lluviaPower != null && diasIncompletos(c.diasConDato, c.diasDelAnio);
  });
  if (incompleto != null) {
    await fijarAnio(incompleto);
    const c = climaDelAnio(contexto, zonaContexto, incompleto);
    const cifras = await raiz.locator(".contexto-clima-cifras").innerText();
    check(`${prefijo}Regional context: ${incompleto} con días faltantes dice «${diasIncompletos(c.diasConDato, c.diasDelAnio)}»`, cifras.includes(diasIncompletos(c.diasConDato, c.diasDelAnio)), cifras.replace(/\n/g, " ").slice(0, 200));
    await fijarAnio(t1);
  } else {
    omitir(`${prefijo}Regional context: año con días faltantes`, "ningún año de la línea de tiempo tiene total con días faltantes");
  }
  const cuerpo = await raiz.evaluate((el) => el.textContent);
  check(`${prefijo}Regional context: sin «undefined», «NaN» ni «null»`, !/undefined|NaN|\bnull\b/.test(cuerpo));
  if (telefono) check(`${prefijo}Regional context: sin desplazamiento horizontal en el teléfono`, await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.locator("#bloque-contexto").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: path.join(CAPTURAS, `${telefono ? "telefono" : "escritorio"}_contexto_regional.png`) });
  await raiz.locator('[data-tarjeta="evapotranspiracion"] .contexto-tarjeta-titulo').evaluate((el) => el.scrollIntoView({ block: "center" }));
  await page.screenshot({ path: path.join(CAPTURAS, `${telefono ? "telefono" : "escritorio"}_contexto_advertencias.png`) });
  // Otra zona y «All areas».
  const otra = zonasCubo.find((z) => z !== zonaContexto && contexto.zonas?.[z]);
  if (otra && zonaInicial) {
    await elegirZona(page, otra);
    const d = await texto(page, "#contexto-regional .contexto-donde");
    check(`${prefijo}Regional context sigue al cambio de zona (${contexto.zonas[otra].nombre})`, d.includes(contexto.zonas[otra].nombre), d);
    await page.locator("#zona-sel").selectOption("");
    await page.evaluate(() => window.raizDepuracion.esperarMapa());
    check(`${prefijo}Regional context con «All areas»: pide elegir una zona y conserva la nota`, (await texto(page, "#contexto-regional")).includes("Choose one pilot area") && (await texto(page, "#contexto-regional")).includes("not a single field"));
    await elegirZona(page, zonaInicial);
  }
  await page.locator("#bloque-contexto > summary").click(); // se pliega de nuevo (no estorba a las pruebas que siguen)
}

/** «Challenge data sources» en «About & Data» (diálogo ya abierto): tres estados y conteos de contexto.json. */
async function pruebaRecursosReto(page, prefijo, telefono) {
  const hueco = page.locator('#acerca [data-bloque="recursos"]');
  if (!contexto) {
    check(`${prefijo}sin contexto.json: «Challenge data sources: not available yet.»`, (await hueco.innerText()).includes("not available yet"));
    return;
  }
  const filas = await hueco.locator("tbody tr[data-recurso]").evaluateAll((xs) => xs.map((x) => ({ id: x.dataset.recurso, estado: x.dataset.estado, texto: x.textContent })));
  const titulo = await hueco.locator(".contexto-titulo").innerText().catch(() => "");
  check(`${prefijo}About & Data: tabla «Challenge data sources» con un renglón por recurso de contexto.json (${contexto.recursos.length})`, titulo === "Challenge data sources" && filas.length === contexto.recursos.length && contexto.recursos.every((r) => filas.some((f) => f.id === r.id && f.estado === r.estado)), `${filas.length} renglones`);
  const cuenta = contarEstados(contexto.recursos);
  const resumen = (await hueco.locator(".contexto-recursos-resumen").innerText()).replace(/\s+/g, " ");
  const esperado = [["in_use", "in use"], ["requested", "requested, not delivered yet"], ["not_applicable", "not applicable"]];
  check(`${prefijo}Challenge data sources: conteos que cuadran con contexto.json (${esperado.map(([k]) => `${k} ${cuenta[k]}`).join(", ")})`,
    resumen.includes(`${formatoNumero(cuenta.total)} entries`) && esperado.every(([k, t]) => resumen.includes(`${formatoNumero(cuenta[k])} ${t}`)) && cuenta.in_use + cuenta.requested + cuenta.not_applicable === cuenta.total, resumen);
  const estados = await hueco.locator("tbody .contexto-estado").allInnerTexts();
  for (const [k, texto] of [["in_use", "In use"], ["requested", "Requested, not delivered yet"], ["not_applicable", "Not applicable"]]) {
    if (cuenta[k]) check(`${prefijo}Challenge data sources: estado «${texto}» con símbolo y texto`, estados.filter((x) => x.includes(texto)).length === cuenta[k]);
  }
  const era5 = contexto.recursos.find((r) => r.id === "era5_land");
  if (era5) check(`${prefijo}Challenge data sources: ERA5-Land rotulado con su organismo (ECMWF/Copernicus, no NASA)`, filas.find((f) => f.id === "era5_land")?.texto.includes("ECMWF") && !/^NASA/.test(era5.organismo));
  await hueco.locator(".contexto-titulo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, `${telefono ? "telefono" : "escritorio"}_recursos_reto.png`) });
}

/** H1-b junto a H1 en «About & Data» (diálogo abierto) y los documentos enlazados. */
async function pruebaH1b(page, prefijo, telefono) {
  const h1 = pruebasWeb?.pruebas?.find((p) => p.id === "backtest_h1");
  const h1b = h1?.complementos?.find((c) => c.id === "h1b");
  if (!h1b) {
    omitir(`${prefijo}H1-b`, "pruebas.json no trae el complemento de H1");
    return;
  }
  const tarjetaH1 = page.locator('#acerca .acerca-prueba[data-prueba="backtest_h1"]');
  const bloque = tarjetaH1.locator('.acerca-complemento[data-complemento="h1b"]');
  const t = (await bloque.count()) ? await bloque.innerText() : "";
  const valores = (h1b.metricas ?? []).map((m) => nf({ maximumFractionDigits: 2 }).format(m.valor));
  check(`${prefijo}About & Data: H1-b junto a H1, «${h1b.resumen}», con sus cifras (${valores.join(", ")}) y su fuente`,
    t.includes(h1b.resumen) && valores.every((v) => t.includes(v)) && (h1b.fuentes ?? []).every((f) => t.includes(f)) && (!h1b.nota || t.includes(h1b.nota)), t.replace(/\n/g, " ").slice(0, 240));
  check(`${prefijo}About & Data: H1 conserva su veredicto (${h1.estado}) con H1-b al lado`, (await tarjetaH1.getAttribute("data-estado")) === h1.estado && (await bloque.getAttribute("data-estado")) === h1b.estado);
  for (const d of (pruebasWeb.documentos ?? []).filter((x) => x.existe)) {
    const a = page.locator(`#acerca .acerca-documentos a[href="${d.url}"]`);
    const li = page.locator(`#acerca .acerca-documentos li[data-documento="${d.id}"]`);
    check(`${prefijo}About & Data: enlace a ${d.ruta}${d.nota ? " con su nota" : ""}`, (await a.count()) === 1 && (!d.nota || (await li.innerText()).includes(d.nota)));
  }
  const rev = (pruebasWeb.documentos ?? []).find((d) => d.id === "revision_protagonistas" && d.existe);
  if (rev) check(`${prefijo}About & Data: la revisión de las protagonistas dice que la hizo una sesión de IA y que falta la de una persona`, /AI session/.test(rev.nota) && /person/.test(rev.nota));
  await bloque.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, `${telefono ? "telefono" : "escritorio"}_acerca_h1b.png`) });
}

/** Pendientes de la auditoría del motor en el panel y en los controles: distrito, textos en inglés, ventana de suelo. */
async function pruebaAuditoriaMotor(page, prefijo, telefono) {
  const d = cubo.distrito ?? {};
  const b = d.boquilla;
  if (b) {
    const alm = await texto(page, '#boquilla [data-dato="almacenamiento"]');
    const namo = await texto(page, '#boquilla [data-dato="namo"]');
    check(`${prefijo}La Boquilla: almacenamiento con su fuente y su etiqueta ${b.etiqueta_almacenamiento}`, alm.includes(b.fuente_almacenamiento) && alm.includes(b.etiqueta_almacenamiento), alm);
    check(`${prefijo}La Boquilla: capacidad (NAMO) con su fuente y su etiqueta ${b.etiqueta_namo}`, namo.includes(b.fuente_namo) && namo.includes(b.etiqueta_namo), namo);
  }
  const llave = Object.keys(d).find((k) => k.startsWith("acuifero_"));
  if (llave) {
    const a = await texto(page, '#acuifero [data-dato="acuifero"]');
    check(`${prefijo}acuífero: fuente y etiqueta ${d[llave].etiqueta}`, a.includes(d[llave].fuente) && a.includes(d[llave].etiqueta), a);
  }
  // Textos de las marcas, la equivalencia y el punto de medición en inglés (los del cubo, copia de params). En el
  // teléfono «Units and measuring point» está plegado: se lee el contenido del nodo (textContent), no lo pintado.
  const { equivalencia_en: eqEn, punto_medicion_en: pmEn } = cubo.dotaciones;
  const contenido = (sel) => page.locator(sel).evaluate((el) => el.textContent);
  if (eqEn) check(`${prefijo}equivalencia en inglés (equivalencia_en), sin lang="es"`, (await contenido("#equivalencia")) === eqEn && (await page.locator("#equivalencia").getAttribute("lang")) === null, await contenido("#equivalencia"));
  if (pmEn) check(`${prefijo}punto de medición en inglés (punto_medicion_en), sin lang="es"`, (await contenido("#punto-medicion")) === pmEn && (await page.locator("#punto-medicion").getAttribute("lang")) === null, await contenido("#punto-medicion"));
  for (const m of marcas.filter((x) => x.nota_en)) {
    await page.locator(`.boton-marca[data-marca="${m.id}"]`).click();
    const info = await page.locator("#info-marca-fuente").textContent();
    check(`${prefijo}marca ${m.id}: nota en inglés «${m.nota_en}» (no la de español)`, info.includes(`Note: ${m.nota_en}`) && (m.nota === m.nota_en || !info.includes(m.nota)), info.slice(-120));
  }
  // Ventana de suelo desnudo (cubo.meta.ventana_desnudo) en la capa del mapa.
  const v = cubo.meta?.ventana_desnudo;
  if (v && (await page.locator('input[name="colorear"][value="suelo_desnudo"]').count())) {
    const md = (x) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(0, Number(x.slice(0, 2)) - 1, Number(x.slice(3, 5)))));
    const ventana = `(${md(v.inicio)} – ${md(v.fin)})`;
    await page.locator('input[name="colorear"][value="suelo_desnudo"]').check();
    const ley = await texto(page, "#leyenda");
    check(`${prefijo}capa de suelo desnudo con la ventana de cubo.meta.ventana_desnudo ${ventana}`, ley.includes(`Bare soil in the windy season ${ventana}`), ley.split("\n")[0]);
    await page.locator('input[name="colorear"][value="semaforo"]').check();
    if (P0757) {
      await abrirDesdeLista(page, P0757);
      const vs = await page.locator("#ficha .ventana-desnudo").allInnerTexts();
      check(`${prefijo}ficha de ${P0757}: renglón Soil con la ventana de suelo desnudo ${ventana}`, vs.length === opcionesDe(P0757).length && vs.every((x) => x.trim() === ventana), vs.slice(0, 2).join(" | "));
      await cerrarFicha(page);
    }
  }
  await page.locator("#boquilla").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, `${telefono ? "telefono" : "escritorio"}_distrito_etiquetas.png`) });
}

// ---------------------------------------------------------------- pruebas de escritorio
async function pruebasEscritorio(page, peticiones) {
  // Gemelo digital (en la zona inicial); después, «All areas» para las comprobaciones de todas las parcelas.
  await pruebaInstalable(page, "");
  await pruebaZonaInicial(page, "");
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_inicio_zona.png") });
  await pruebaEstadoGemelo(page, "");
  await page.locator("#estado-gemelo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, "escritorio_estado_gemelo.png") });
  await pruebaLineaDeTiempo(page, "", false);
  await pruebaContextoRegional(page, "", false);
  await pruebaGemelo3D(page, "", false);
  await verTodas(page);
  await pruebaAuditoriaMotor(page, "", false);

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
    // Punto 2 / I3: la fuente (en español en params.json) queda dentro de «Source and note», plegado; no se ve en la franja.
    const franja = await page.locator("#controles").innerText();
    check(`marca ${m.id}: «Source and note» y «Units and measuring point» plegados en escritorio; la fuente no se ve en la franja fija`,
      !(await page.locator("#info-marca-detalle").evaluate((d) => d.open)) && !(await page.locator("#unidades").evaluate((d) => d.open)) && !franja.includes(m.fuente),
      franja.replace(/\s+/g, " ").slice(0, 160));
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
  check("segunda cifra «… of … classified fields don't have enough water…» (I4: el total son las clasificadas)", /\d of [\d,]+ classified fields don't have enough water for their current rotation/.test(segunda), segunda);

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
      const sobreArea = await hectareasSobreArea(page, id);
      check(`ficha de ${id}: con cada marca, ninguna cifra de hectáreas que alcanzan pasa del área y el área va con su precisión (C2)`, sobreArea.length === 0, sobreArea.slice(0, 3).join(" | "));
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
    check(`necesidad cero (${id}/${o.id}): alcanza para toda la parcela`, alcanza.startsWith(`Enough for the whole field (${area} ha)`), alcanza);
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
  // dotacion_minima no entra aquí: la página lo evalúa EN VIVO contra el deslizador (pruebaFichaCompleta).
  const conEstado = Object.entries(cubo.parcelas).flatMap(([pid, p]) =>
    p.opciones.flatMap((o) => (o.filtros ?? []).filter((f) => f.estado && f.tipo !== "dotacion_minima").map((f) => ({ pid, o, f }))),
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

  // Ficha completa (etapa 2 del gemelo): frase, NDVI, suelo, lámina local, propuesta, nogal, filtros en vivo, GEDI.
  await pruebaFichaCompleta(page, "", false);

  // Ficha imprimible: la parcela con más tarjetas (peor caso para que quepa en una hoja); P0757 si está (protagonista
  // con cuatro tarjetas, la lámina local y la aptitud de suelo).
  const masOpciones = (P0757 && opcionesDe(P0757).length >= Math.max(...candidatos.map((id) => opcionesDe(id).length)) ? P0757 : null) ??
    candidatos.filter((id) => !porId.get(id).abstencion).sort((a, b) => opcionesDe(b).length - opcionesDe(a).length)[0];
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
  // Gemelo digital en el teléfono (zona inicial, movimiento reducido); después, «All areas».
  await pruebaInstalable(page, "teléfono: ");
  await pruebaZonaInicial(page, "teléfono: ");
  await pruebaLineaDeTiempo(page, "teléfono: ", true);
  await pruebaEstadoGemelo(page, "teléfono: ");
  await page.locator("#estado-gemelo").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(CAPTURAS, "telefono_estado_gemelo.png") });
  await pruebaContextoRegional(page, "teléfono: ", true);
  await pruebaGemelo3D(page, "teléfono: ", true);
  await pruebaAuditoriaMotor(page, "teléfono: ", true);
  check("teléfono: con el gemelo conectado, sin desplazamiento horizontal", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.evaluate(() => window.scrollTo(0, 0));
  await verTodas(page);
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

  // Ficha completa en el teléfono (movimiento reducido).
  await pruebaFichaCompleta(page, "teléfono: ", true);

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
      ind.includes(pct(ac.p50)) && ind.includes("at least") === ac.alMenos &&
        ind.includes(ac.alMenos ? `Likely range for the classified area: ${pct(ac.p10)} to ${pct(ac.p90)}; unclassified fields can raise it, not lower it` : `Likely range: ${pct(ac.p10)} to ${pct(ac.p90)}`),
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

  // La página abre en la zona inicial (gemelo.json → zona_inicial; si no está en el cubo, la primera), no en «All areas».
  const esperada = zonaInicialDe(c);
  check(`dos zonas: la página abre en ${nombreZonaCubo(esperada, c)}, no en «All areas»`, (await sel.inputValue()) === esperada, await sel.inputValue());
  const zIni = [za, zb].find((x) => x.id === esperada);
  if (zIni) await revisar(`al abrir, ${zIni.nombre}`, c.zonas[zIni.id], porZona[zIni.id], zIni.prefijo_id);
  await sel.selectOption("");
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

    // Enlace directo #id (escritorio y teléfono) y NDVI con huecos (variante en memoria).
    await pruebaEnlaceDirecto(navegador, base, "", { viewport: { width: 1366, height: 860 }, reducedMotion: "reduce" });
    await pruebaEnlaceDirecto(navegador, base, "teléfono: ", { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    await pruebaNDVIHuecos(navegador, base);

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
    await verTodas(alt.page); // el indicador se compara con el bloque total (cubo.zona)
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
      "gemelo.json": new Respuesta(500),
      "suelo.json": new Respuesta(500),
      "contexto.json": new Respuesta(500),
    });
    // manifest.json roto: la tarjeta «Twin status» dice que no hay fuentes y no inventa fechas.
    await fal.page.waitForSelector("body[data-estado-gemelo='listo']", { timeout: 10000 }).catch(() => null);
    const tarjetaFal = await texto(fal.page, "#estado-gemelo");
    check("manifest.json roto: Twin status dice «Sources: not available» y ninguna fecha", tarjetaFal.includes("Sources: not available") && !/Data retrieved: \w{3} \d/.test(tarjetaFal));
    // gemelo.json en HTTP 500: la vista 3D y la línea de tiempo dicen que no están disponibles, y por qué.
    const boton3D = fal.page.locator("#boton-gemelo");
    const motivo3D = (await fal.page.locator("#gemelo-motivo").isVisible()) ? await texto(fal.page, "#gemelo-motivo") : "";
    check("gemelo.json en HTTP 500: «3D twin view: not available» con su motivo («could not be read»)",
      (await boton3D.count()) === 1 && (await boton3D.innerText()).trim() === "3D twin view: not available" && (await boton3D.getAttribute("aria-disabled")) === "true" && motivo3D.includes("could not be read"), motivo3D);
    check("gemelo.json en HTTP 500: la línea de tiempo dice «Timeline: not available»", (await texto(fal.page, "#bloque-tiempo")).includes("Timeline: not available"));
    if (zonasCubo.length > 1) {
      check("gemelo.json en HTTP 500: la página abre igual en una zona (la primera de cubo.zonas)", (await fal.page.locator("#zona-sel").inputValue()) === zonasCubo[0]);
    }
    await verTodas(fal.page);
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
    check("contexto.json en HTTP 500: «Challenge data sources: contexto.json could not be read (…HTTP 500)»", acerca.includes("Challenge data sources: contexto.json could not be read") && acerca.includes("HTTP 500"));
    await fal.page.keyboard.press("Escape");
    await abrirContexto(fal.page);
    const ctxFal = await texto(fal.page, "#contexto-regional");
    check("contexto.json en HTTP 500: «Regional context: could not be read (…HTTP 500)», no «not available yet»", ctxFal.includes("Regional context: could not be read") && ctxFal.includes("HTTP 500") && !ctxFal.includes("not available yet"), ctxFal);
    await fal.page.locator("#bloque-contexto > summary").click();
    const idImp = candidatos.find((x) => !porId.get(x).abstencion && opcionesDe(x).length);
    if (idImp) {
      await abrirDesdeLista(fal.page, idImp);
      // suelo.json y contexto.json en HTTP 500: la ficha dice que no se pudieron leer (no «not available yet»).
      const ev = (await texto(fal.page, "#seccion-evidencia")).replace(/\s+/g, " ");
      check("suelo.json en HTTP 500: «Soil profile: could not be loaded (…HTTP 500)» y la aptitud lo dice en cada tarjeta",
        ev.includes("Soil profile: could not be loaded") && ev.includes("HTTP 500") && (await fal.page.locator('.suelo-aptitud[data-situacion="error"]').count()) === opcionesDe(idImp).length, ev.slice(0, 160));
      check("contexto.json en HTTP 500: «Satellite evidence: could not be read (contexto.json: HTTP 500)»", ev.includes("Satellite evidence: could not be read (contexto.json: HTTP 500)"), ev.slice(-160));
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
    await verTodas(baja.page);
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
