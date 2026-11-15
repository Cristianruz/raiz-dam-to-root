// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// tests/e2e/pwa_smoke.mjs — Prueba de humo de la aplicación instalable y SIN CONEXIÓN (web/sw.js,
// web/js/instalar.js, web/manifest.webmanifest y web/data/precache.json de motor/pwa.py) con Playwright.
//
// Uso:   node tests/e2e/pwa_smoke.mjs
//        RAIZ_CAPTURAS=<carpeta> node tests/e2e/pwa_smoke.mjs   (dónde dejar las capturas pwa_*.png)
// No forma parte de `node --test tests/` (necesita Chromium). Termina con código 0 si todo pasa y 1 si algo falla.
//
// Qué hace:
// - copia web/ a una carpeta temporal y trabaja SOLO sobre esa copia (no toca el repo);
// - prueba las DOS PÁGINAS REALES, sin inyectar nada y cada una con SUS selectores (sin alternativas del tipo
//   «#a, #b», que dejan pasar la página equivocada): la PORTADA (index.html, el tablero; es lo que abre la
//   aplicación instalada) y el EXPLORADOR de parcelas (explorer.html, la página anterior). Comprueba que las dos
//   enlazan el manifest y css/instalar.css y que su módulo de entrada importa instalar.js y llama a
//   montarInstalacion; si falta una pieza, la prueba falla;
// - sirve la copia en localhost (http.createServer, sin dependencias) y abre la página con red;
// - verifica con red: el listado data/precache.json corresponde a lo que hay en web/, el service worker queda
//   activo y al mando de la página, el indicador dice «Online» y «Ready to work offline», la caché
//   «raiz-<version>» guarda todos los archivos del listado, el manifest enlazado es válido y sus iconos
//   cargan, RED PRIMERO (un archivo que cambia en el servidor llega nuevo, no la copia guardada) y el botón
//   «Install app» (aparece con beforeinstallprompt, se pulsa con el teclado, abre el diálogo y desaparece);
// - CORTA LA RED de verdad: context.setOffline(true) y además apaga el servidor (nada puede contestar);
// - verifica sin red: el indicador pasa a «Offline — showing the last synced copy», la portada RECARGA y
//   arranca desde la copia, el mapa tiene su lienzo y las parcelas están DIBUJADAS (con el mapa listo no basta
//   que estén en una lista: «0 dibujadas» es una falla; solo sin mapa cuenta la lista), el deslizador
//   cambia los indicadores; el EXPLORADOR también abre sin red, con su lienzo, sus parcelas dibujadas (o
//   listadas si no hay mapa) y su deslizador; la portada abre sin red en los cuatro idiomas (?lang=en, es, pt, fr); cada archivo del listado sale de la copia con los mismos octetos que en disco
//   (incluidas las teselas de relieve y el archivo renovado con red primero), una petición a otro origen
//   falla sin romper nada y no hay errores de página; lo mismo en un teléfono de 390 × 844 sin
//   desplazamiento horizontal;
// - LA RED SE CORTA A MEDIA COPIA (otra visita, con otro servidor que deja sin contestar las descargas de datos
//   del service worker): lo que la página necesita para abrir se guarda antes que los datos; si se recarga con
//   el worker aún instalándose, la página lee ella misma el almacén y dice «Offline copy not complete yet»; el
//   servidor deja de contestar (el navegador no se entera) y luego se corta la red: el indicador NO dice
//   «showing the last synced copy» sino «Offline — no complete offline copy yet; reconnect before reloading»,
//   el worker informa «incompleta» (no «ninguna») también cuando se le vuelve a preguntar sin red, la recarga
//   sin red abre el index.html guardado (no la página de error del navegador) y el aviso cabe en el teléfono;
//   al volver la red la copia continúa donde quedó, termina («Ready to work offline») y entonces sí, sin red,
//   el indicador dice «showing the last synced copy»;
// - antes de abrir el navegador, la regla de los rótulos (textosDe): ese texto solo sale con una copia completa;
// - quien escucha (alCambiar): recibe su primer aviso después de montar y con lo guardado ya leído, puede usar
//   el controlador, y si su función lanza el indicador sigue en pie; sincronizar sin cambios no toca la región
//   de estado (el lector de pantalla no la repite);
// - guarda capturas en RAIZ_CAPTURAS (por omisión, una carpeta temporal que se anuncia al final).
// No supone un juego de datos: las dotaciones de referencia y los archivos se leen de la propia copia.

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { LLAVE_INICIO } from "../../web/js/acerca.js";
import { AVISO_COPIA, PEDIR_SINCRONIZAR, TEXTOS, textosDe } from "../../web/js/instalar.js";
import { IDIOMAS } from "../../web/js/i18n.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const WEB = path.join(RAIZ, "web");
const TEMPORAL = fs.mkdtempSync(path.join(os.tmpdir(), "raiz-pwa-"));
const COPIA = path.join(TEMPORAL, "web");
const CAPTURAS = process.env.RAIZ_CAPTURAS ? path.resolve(process.env.RAIZ_CAPTURAS) : path.join(TEMPORAL, "capturas");

const LISTADO = "data/precache.json";
const MARCA = "<!-- pwa_smoke: este texto llegó por la red después de guardarse la copia -->";
const SONDA = "data/archivo_que_no_existe.json"; // la prueba lo pide sin red a propósito: su falla es la esperada
const ESPERA_COPIA_MS = 90000; // tope de la prueba para que el service worker guarde todos los archivos
const ESPERA_DIBUJO_MS = 20000; // para que el mapa pinte las parcelas después de arrancar
// Las dos páginas de la aplicación: la portada (el tablero) y el explorador de parcelas.
const PORTADA = "index.html";
const EXPLORADOR = "explorer.html";
const PAGINAS = [PORTADA, EXPLORADOR];
const ESPERA_ARRANQUE_MS = 60000; // holgado: la máquina puede estar corriendo otras pruebas con navegador a la vez

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
  ".txt": "text/plain; charset=utf-8",
};

// ---------------------------------------------------------------- registro de resultados
const resultados = [];
function check(nombre, cond, detalle = "") {
  resultados.push({ nombre, ok: Boolean(cond), detalle });
  console.log(`${cond ? "PASA" : "FALLA"}  ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}
function omitir(nombre, motivo) {
  console.log(`OMITE  ${nombre} — ${motivo}`);
}

// ---------------------------------------------------------------- la copia de web/
/** Archivos de una carpeta con la regla de motor/pwa.py: todo menos sw.js y lo oculto; el listado siempre. */
function recorrer(carpeta) {
  const rutas = new Set([LISTADO]);
  const visitar = (dir, prefijo) => {
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entrada.name.startsWith(".")) continue;
      const relativa = prefijo ? `${prefijo}/${entrada.name}` : entrada.name;
      if (entrada.isDirectory()) visitar(path.join(dir, entrada.name), relativa);
      else if (entrada.isFile() && relativa !== "sw.js") rutas.add(relativa);
    }
  };
  visitar(carpeta, "");
  return [...rutas].sort();
}

/**
 * ¿La página real conecta la aplicación instalable? Devuelve las piezas que faltan (vacío si está todo):
 * <link rel="manifest" href="manifest.webmanifest">, la hoja css/instalar.css, <meta name="theme-color"> y, en
 * app.js, el import de js/instalar.js y la llamada a montarInstalacion. No toca la copia.
 */
function piezasQueFaltan() {
  const faltan = [];
  for (const pagina of PAGINAS) {
    if (!fs.existsSync(path.join(COPIA, pagina))) {
      faltan.push(`${pagina} (no existe)`);
      continue;
    }
    const html = fs.readFileSync(path.join(COPIA, pagina), "utf-8");
    // El módulo de entrada es el que la propia página carga (<script type="module" src="…">).
    const entrada = (html.match(/<script\b[^>]*type=["']module["'][^>]*src=["']([^"']+)["']/i) ?? [])[1] ?? "";
    const app = entrada && fs.existsSync(path.join(COPIA, entrada)) ? fs.readFileSync(path.join(COPIA, entrada), "utf-8") : "";
    // instalar.js vive en js/: desde app.js es «./js/instalar.js» y desde un módulo de js/, «./instalar.js».
    const importa = entrada.startsWith("js/") ? /from\s+["']\.\/instalar\.js["']/ : /from\s+["']\.\/js\/instalar\.js["']/;
    if (!/<link\b[^>]*rel=["']?manifest\b[^>]*href=["']?manifest\.webmanifest/i.test(html)) faltan.push(`${pagina}: <link rel="manifest">`);
    if (!html.includes("css/instalar.css")) faltan.push(`${pagina}: css/instalar.css`);
    if (!/<meta\b[^>]*name=["']?theme-color/i.test(html)) faltan.push(`${pagina}: <meta name="theme-color">`);
    if (!entrada) faltan.push(`${pagina}: <script type="module" src="…">`);
    else if (!importa.test(app)) faltan.push(`${pagina}: import de instalar.js en ${entrada}`);
    if (entrada && !/montarInstalacion\(/.test(app)) faltan.push(`${pagina}: montarInstalacion() en ${entrada}`);
  }
  return faltan;
}

// ---------------------------------------------------------------- servidor estático (se puede apagar de golpe)
/**
 * `retener(ruta, req)`: si devuelve true, esa petición se queda SIN respuesta (hasta caer() o apagar()).
 * caer(): el servidor deja de contestar sin cerrarse (corta cada conexión que llega y las abiertas), como un wifi
 * que sigue conectado pero ya no tiene salida; levantar() lo deshace.
 */
function servidor(retener = () => false) {
  const atendidas = [];
  let caido = false;
  const srv = http.createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    if (caido) {
      req.socket.destroy();
      return;
    }
    atendidas.push({ ruta, delWorker: (req.headers.referer ?? "").endsWith("/sw.js") });
    if (retener(ruta, req)) return;
    let archivo = path.normalize(path.join(COPIA, ruta));
    if (!archivo.startsWith(COPIA)) {
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
  return new Promise((ok) =>
    srv.listen(0, "127.0.0.1", () =>
      ok({
        puerto: srv.address().port,
        /** Peticiones atendidas: { ruta, delWorker } (las del service worker llevan Referer …/sw.js). */
        atendidas,
        caer: () => {
          caido = true;
          srv.closeAllConnections();
        },
        levantar: () => {
          caido = false;
        },
        /** Apaga el servidor y tira las conexiones abiertas: desde aquí nada contesta. */
        apagar: () =>
          new Promise((listo) => {
            if (!srv.listening) return listo();
            srv.close(() => listo());
            srv.closeAllConnections();
          }),
      }),
    ),
  );
}

// ---------------------------------------------------------------- utilidades de página
// Cada página con SUS selectores. La portada (index.html) es el tablero: indicadores en #stats, deslizador
// #allocation, mapa #map y lista #field-select; avisa que arrancó con body[data-dashboard="listo"] y el estado
// de su mapa en body[data-dashboard-map] («listo», o «local» si no hay mapa y dibuja su esquema).
// El explorador (explorer.html): #indicador-cifra, #dotacion, #mapa, .boton-parcela; body[data-listo="si"] y
// body[data-mapa] («listo» o «sin-mapa»).
/** Portada: texto de los indicadores del resumen (cambian con la dotación). */
const indicador = (page) =>
  page.evaluate(() => {
    const todo = document.querySelector("#stats").innerText.replace(/\s+/g, " ").trim();
    return { cifra: todo, todo };
  });
/** Explorador: la cifra grande del indicador y todo el bloque (rango y mensajes incluidos). */
const indicadorExplorador = (page) =>
  page.evaluate(() => ({
    cifra: document.querySelector("#indicador-cifra").innerText.replace(/\s+/g, " ").trim(),
    todo: document.querySelector("#indicador").innerText,
  }));
async function fijarDeslizador(page, valor, selector = "#allocation") {
  await page.evaluate(([v, sel]) => {
    const s = document.querySelector(sel);
    s.value = String(v);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  }, [valor, selector]);
}
/** Portada: espera a que arranque y devuelve el estado de su mapa («listo» o «local»). */
async function esperarArranque(page) {
  await page.waitForSelector("body[data-dashboard='listo']", { timeout: ESPERA_ARRANQUE_MS });
  await page.waitForFunction(() => ["listo", "local"].includes(document.body.dataset.dashboardMap), null, { timeout: ESPERA_ARRANQUE_MS });
  return page.evaluate(() => document.body.dataset.dashboardMap);
}
/** Explorador: espera a que arranque y devuelve el estado de su mapa («listo» o «sin-mapa»). */
async function esperarExplorador(page) {
  await page.waitForSelector("body[data-listo='si']", { timeout: ESPERA_ARRANQUE_MS });
  await page.waitForFunction(() => ["listo", "sin-mapa"].includes(document.body.dataset.mapa), null, { timeout: ESPERA_ARRANQUE_MS });
  return page.evaluate(() => document.body.dataset.mapa);
}
/** Portada: ¿el mapa ya dibujó parcelas? (web/js/dashboard.js lo anota cuando la capa tiene polígonos a la vista). */
async function portadaDibujoParcelas(page) {
  try {
    await page.waitForFunction(() => document.body.dataset.dashboardMapRendered === "si", null, { timeout: ESPERA_DIBUJO_MS });
    return true;
  } catch {
    return false;
  }
}
/** Oyentes de errores de una página: solo cuentan los de la propia aplicación (no las teselas de otro origen). */
function vigilar(page, base, errores) {
  const propia = (url = "") => url.startsWith(base) && !url.endsWith("/favicon.ico") && !url.endsWith(SONDA);
  page.on("pageerror", (e) => errores.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && propia(m.location()?.url ?? "")) errores.push(`consola: ${m.text()} (${m.location().url})`);
  });
}

/** Contexto de navegador nuevo (su propio almacenamiento: sin service worker ni cachés de otra visita). */
async function nuevoContexto(navegador, base) {
  const ctx = await navegador.newContext({ viewport: { width: 1366, height: 860 }, reducedMotion: "reduce" });
  // La pantalla de inicio se da por cerrada (como en web_smoke.mjs): su diálogo modal taparía los controles.
  await ctx.addInitScript((llave) => {
    try {
      window.sessionStorage.setItem(llave, "cerrado");
    } catch {
      // sin almacenamiento: la pantalla aparecería (no pasa en Chromium)
    }
  }, LLAVE_INICIO);
  // Otros orígenes (teselas del mapa base) se cortan de inmediato, como en una máquina sin salida a internet.
  await ctx.route((url) => !url.href.startsWith(base), (route) => route.abort());
  return ctx;
}

/**
 * Espera a que todas las rutas estén guardadas en alguna caché de la página; false si se acaba el tiempo.
 * (Se pregunta varias veces desde aquí: page.waitForFunction no espera a un predicado asíncrono.)
 */
async function esperarEnCache(page, rutas, limiteMs) {
  const fin = Date.now() + limiteMs;
  for (;;) {
    const estan = await page.evaluate(async (lista) => {
      for (const ruta of lista) if (!(await caches.match(new URL(ruta, location.href).href))) return false;
      return true;
    }, rutas);
    if (estan) return true;
    if (Date.now() > fin) return false;
    await new Promise((seguir) => setTimeout(seguir, 200));
  }
}

/** Lo que dice y marca el indicador (.instalar), o null si no está en la página. */
const leerCaja = (page) =>
  page.evaluate(() => {
    const caja = document.querySelector(".instalar");
    if (!caja) return null;
    return { texto: caja.innerText.replace(/\s+/g, " ").trim(), red: caja.dataset.red, copia: caja.dataset.copia, visible: !caja.hidden };
  });

// ---------------------------------------------------------------- la regla de los rótulos (sin navegador)
function reglaDeLosRotulos() {
  const copias = ["desconocida", "ninguna", "guardando", "lista", "incompleta"];
  const fallas = [];
  for (const red of ["online", "offline"]) {
    for (const copia of copias) {
      const rotulos = textosDe({ red, copia });
      const dicho = `${rotulos.red} ${rotulos.copia ?? ""}`;
      const afirmaCopia = dicho.includes(TEXTOS.sinConexion) || dicho.includes(TEXTOS.copiaLista);
      if (afirmaCopia !== (copia === "lista")) fallas.push(`${red}/${copia}: «${dicho.trim()}»`);
      if (red === "offline" && ["ninguna", "guardando", "incompleta"].includes(copia) && rotulos.red !== TEXTOS.sinConexionSinCopia) {
        fallas.push(`${red}/${copia} no advierte: «${dicho.trim()}»`);
      }
    }
  }
  check(
    `regla de los rótulos: «${TEXTOS.sinConexion}» y «${TEXTOS.copiaLista}» solo con una copia completa; sin ella y sin red, «${TEXTOS.sinConexionSinCopia}»`,
    fallas.length === 0,
    fallas.join(" · "),
  );
}

// ---------------------------------------------------------------- la red se corta a media copia
/**
 * Otra visita (contexto y servidor nuevos): el servidor deja sin contestar las descargas de DATOS que hace el
 * service worker, así que la copia se queda a medias; luego el servidor deja de contestar y se corta la red.
 * Es la primera visita en la mesa del Open House con el wifi que se cae mientras se guarda la copia.
 * Al final la red vuelve: la copia continúa donde quedó y solo entonces el indicador puede decir que hay copia.
 */
async function corteAMediaCopia(navegador, precache) {
  let reteniendo = true;
  const retenidas = new Set();
  const srv = await servidor((ruta, req) => {
    const delWorker = (req.headers.referer ?? "").endsWith("/sw.js");
    if (!reteniendo || !delWorker || !ruta.startsWith("/data/") || ruta === `/${LISTADO}`) return false;
    retenidas.add(ruta);
    return true;
  });
  const base = `http://localhost:${srv.puerto}/`;
  const ctx = await nuevoContexto(navegador, base);
  const dice = (caja, texto) => Boolean(caja) && caja.texto.includes(texto);
  const advierte = (caja) => dice(caja, TEXTOS.sinConexionSinCopia) && !dice(caja, TEXTOS.sinConexion) && !dice(caja, TEXTOS.copiaLista);
  const descrita = (caja) => (caja ? `${caja.texto} · copia: ${caja.copia}` : "(sin .instalar)");
  try {
    const page = await ctx.newPage();
    const erroresDePagina = [];
    page.on("pageerror", (e) => erroresDePagina.push(e.message));
    await page.goto(base, { waitUntil: "load" });
    await esperarArranque(page);

    // Lo que la página necesita para abrir (todo lo que no es dato) debe quedar guardado aunque los datos no lleguen.
    const paraAbrir = precache.archivos.filter((r) => !r.startsWith("data/"));
    let guardadoParaAbrir = false;
    try {
      await page.waitForSelector(".instalar[data-copia='guardando']", { timeout: ESPERA_ARRANQUE_MS });
      guardadoParaAbrir = await esperarEnCache(page, paraAbrir, ESPERA_ARRANQUE_MS);
    } catch {
      guardadoParaAbrir = false;
    }
    // Con eso guardado, al worker solo le quedan datos por pedir: se espera a que el servidor retenga alguno.
    for (let i = 0; i < 50 && retenidas.size === 0; i += 1) await new Promise((seguir) => setTimeout(seguir, 100));
    const aMedias = await leerCaja(page);
    const almacen = await page.evaluate(async (listado) => {
      const salida = [];
      for (const nombre of (await caches.keys()).filter((n) => n.startsWith("raiz-"))) {
        const c = await caches.open(nombre);
        salida.push({ nombre, entradas: (await c.keys()).length, conListado: Boolean(await c.match(new URL(listado, location.href).href)) });
      }
      return salida;
    }, LISTADO);
    check(
      "a media copia: lo que la página necesita para abrir se guarda antes que los datos, y ninguna caché tiene aún el listado (no hay copia completa)",
      guardadoParaAbrir && retenidas.size > 0 && almacen.length === 1 && !almacen[0].conListado && almacen[0].entradas < precache.archivos.length,
      `${paraAbrir.length} archivos para abrir · ${almacen.map((c) => `${c.nombre}: ${c.entradas} de ${precache.archivos.length}`).join(", ")} · ${retenidas.size} descarga(s) de datos sin respuesta`,
    );
    check(
      `a media copia, con red: «${TEXTOS.enLinea}» y «${TEXTOS.copiaGuardando}», sin «${TEXTOS.copiaLista}»`,
      aMedias?.red === "online" && aMedias.copia === "guardando" && dice(aMedias, TEXTOS.enLinea) && dice(aMedias, TEXTOS.copiaGuardando) &&
        !dice(aMedias, TEXTOS.copiaLista),
      descrita(aMedias),
    );

    // Se recarga con red y el worker sigue instalándose (detenido en sus descargas: no avisa nada). La página
    // lee ella misma el almacén de cachés y dice lo que hay: una copia a medias.
    await page.reload({ waitUntil: "load" });
    await esperarArranque(page);
    await page.waitForSelector(".instalar[data-copia]:not([hidden])", { timeout: ESPERA_ARRANQUE_MS }).catch(() => {});
    const sinWorker = await leerCaja(page);
    const registro = await page.evaluate(async () => {
      const r = await navigator.serviceWorker.getRegistration();
      return { instalando: Boolean(r?.installing), activo: Boolean(r?.active), alMando: Boolean(navigator.serviceWorker.controller) };
    });
    check(
      `recargada con el worker aún instalándose: la página lee el almacén y dice «${TEXTOS.enLinea}» y «${TEXTOS.copiaIncompleta}»`,
      registro.instalando && !registro.activo && !registro.alMando && sinWorker?.visible && sinWorker.red === "online" &&
        sinWorker.copia === "incompleta" && dice(sinWorker, TEXTOS.copiaIncompleta) && !dice(sinWorker, TEXTOS.copiaLista),
      `${descrita(sinWorker)} · worker instalando: ${registro.instalando}, activo: ${registro.activo}`,
    );

    // ---------------------------------------------------------- el servidor deja de contestar (wifi sin salida)
    // El navegador sigue creyendo que hay conexión: es el worker quien avisa que ya no alcanzó al servidor.
    srv.caer();
    let termino = true;
    try {
      await page.waitForSelector(".instalar[data-red='offline'][data-copia='incompleta']", { timeout: ESPERA_ARRANQUE_MS });
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: ESPERA_ARRANQUE_MS });
    } catch {
      termino = false;
    }
    const sinServidor = await leerCaja(page);
    const navegadorEnLinea = await page.evaluate(() => navigator.onLine);
    check(
      `el servidor deja de contestar a media copia: el indicador dice «${TEXTOS.sinConexionSinCopia}» y NO «${TEXTOS.sinConexion}»`,
      termino && navegadorEnLinea && sinServidor?.red === "offline" && sinServidor.copia === "incompleta" && advierte(sinServidor),
      `${descrita(sinServidor)} · navigator.onLine: ${navegadorEnLinea}`,
    );

    // ---------------------------------------------------------- se corta la red
    await ctx.setOffline(true);
    await page.waitForFunction(() => navigator.onLine === false, null, { timeout: 5000 }).catch(() => {});
    const alCortar = await leerCaja(page);
    check(
      "se corta la red con la copia a medias: el indicador sigue advirtiendo que no hay copia completa",
      alCortar?.red === "offline" && alCortar.copia !== "lista" && advierte(alCortar),
      descrita(alCortar),
    );

    // Al worker se le vuelve a preguntar SIN red: hay una caché a medias, así que contesta «incompleta» (no «ninguna»).
    const aviso = await page.evaluate(
      ({ pedir, tipoAviso }) =>
        new Promise((resolver) => {
          const reloj = setTimeout(() => resolver(null), 10000);
          navigator.serviceWorker.addEventListener("message", (evento) => {
            if (evento.data?.tipo !== tipoAviso) return;
            clearTimeout(reloj);
            resolver(evento.data);
          });
          navigator.serviceWorker.ready.then((r) => r.active.postMessage({ tipo: pedir }));
        }),
      { pedir: PEDIR_SINCRONIZAR, tipoAviso: AVISO_COPIA },
    );
    check(
      "sin red y con una caché a medias, el worker contesta «incompleta» (no «ninguna») y que no alcanzó al servidor",
      aviso?.estado === "incompleta" && aviso.conRed === false && aviso.guardados > 0 && aviso.version === precache.version,
      aviso ? `estado: ${aviso.estado} · conRed: ${aviso.conRed} · guardados: ${aviso.guardados} · versión ${aviso.version}` : "el worker no contestó",
    );
    check("a media copia y al cortar la red no hay errores de página", erroresDePagina.length === 0, erroresDePagina.slice(0, 4).join(" | "));
    await page.screenshot({ path: path.join(CAPTURAS, "pwa_corte.png") });

    // El aviso largo cabe en el teléfono.
    await page.setViewportSize({ width: 390, height: 844 });
    const t = await page.evaluate(() => {
      const r = document.querySelector(".instalar").getBoundingClientRect();
      return { ancho: document.documentElement.scrollWidth, ventana: window.innerWidth, dentro: r.width > 0 && r.left >= 0 && r.right <= window.innerWidth + 0.5 };
    });
    check(
      "teléfono (390 × 844): el aviso de que no hay copia completa cabe y no hay desplazamiento horizontal",
      t.ancho <= t.ventana && t.dentro,
      `ancho del documento ${t.ancho} de ${t.ventana} px`,
    );
    await page.screenshot({ path: path.join(CAPTURAS, "pwa_corte_telefono.png") });
    await page.setViewportSize({ width: 1366, height: 860 });

    // ---------------------------------------------------------- recarga sin red con la copia a medias
    const titulo = (fs.readFileSync(path.join(COPIA, "index.html"), "utf-8").match(/<title>([^<]*)<\/title>/i) ?? [])[1] ?? "";
    let abrio = "";
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
      abrio = await page.title();
    } catch (err) {
      abrio = `no abrió: ${String(err.message).split("\n")[0]}`;
    }
    check(
      "recarga sin red con la copia a medias: abre el index.html guardado, no la página de error del navegador",
      titulo !== "" && abrio === titulo && page.url() === base,
      abrio,
    );
    // Si la página monta el indicador aunque no lleguen los datos, debe seguir advirtiendo.
    await page.waitForSelector(".instalar[data-red='offline']:not([hidden])", { timeout: 10000 }).catch(() => {});
    const recargada = await leerCaja(page).catch(() => null);
    if (recargada?.visible) {
      check("recargada sin red con la copia a medias: el indicador advierte que no hay copia completa", advierte(recargada), descrita(recargada));
    } else {
      omitir("indicador tras recargar con la copia a medias", "la página no lo monta cuando no llegan los datos");
    }
    await page.screenshot({ path: path.join(CAPTURAS, "pwa_corte_recarga.png") }).catch(() => {});

    // ---------------------------------------------------------- vuelve la red: la copia continúa donde quedó
    reteniendo = false;
    srv.levantar();
    const alVolver = srv.atendidas.length;
    await ctx.setOffline(false);
    let completa = true;
    try {
      await page.reload({ waitUntil: "load" });
      await esperarArranque(page);
      await page.waitForSelector(".instalar[data-red='online'][data-copia='lista']", { timeout: ESPERA_COPIA_MS });
    } catch {
      completa = false;
    }
    const conCopia = await leerCaja(page);
    const delWorker = srv.atendidas.slice(alVolver).filter((a) => a.delWorker).map((a) => a.ruta.slice(1));
    const repetidas = delWorker.filter((ruta) => paraAbrir.includes(ruta));
    check(
      `vuelve la red: la copia continúa donde quedó (no vuelve a bajar lo ya guardado) y el indicador dice «${TEXTOS.enLinea}» y «${TEXTOS.copiaLista}»`,
      completa && dice(conCopia, TEXTOS.enLinea) && dice(conCopia, TEXTOS.copiaLista) && delWorker.length > 0 && repetidas.length === 0,
      `${descrita(conCopia)} · el worker pidió ${delWorker.length} archivo(s), ${repetidas.length} de los que ya tenía`,
    );

    // Ahora sí hay copia completa: sin red, la página arranca y el indicador lo puede decir.
    await ctx.setOffline(true);
    srv.caer();
    let mapa = "";
    try {
      await page.reload({ waitUntil: "load" });
      mapa = await esperarArranque(page);
      await page.waitForSelector(".instalar[data-red='offline'][data-copia='lista']", { timeout: ESPERA_ARRANQUE_MS });
    } catch (err) {
      mapa = `no arrancó: ${String(err.message).split("\n")[0]}`;
    }
    const alFinal = await leerCaja(page).catch(() => null);
    check(
      `con la copia ya completa, sin red: la página arranca y el indicador dice «${TEXTOS.sinConexion}»`,
      alFinal?.red === "offline" && alFinal.copia === "lista" && dice(alFinal, TEXTOS.sinConexion) && !dice(alFinal, TEXTOS.sinConexionSinCopia),
      `${descrita(alFinal)} · mapa: ${mapa}`,
    );
  } finally {
    await ctx.close().catch(() => {});
    await srv.apagar();
  }
}

async function main() {
  reglaDeLosRotulos();

  // ------------------------------------------------------------ la copia y su listado
  fs.cpSync(WEB, COPIA, { recursive: true });
  fs.mkdirSync(CAPTURAS, { recursive: true });
  const necesarios = ["sw.js", "js/instalar.js", "css/instalar.css", "manifest.webmanifest", LISTADO];
  const ausentes = necesarios.filter((f) => !fs.existsSync(path.join(COPIA, f)));
  check("web/ trae las piezas de la aplicación instalable", ausentes.length === 0, ausentes.length ? `faltan: ${ausentes.join(", ")}` : necesarios.join(", "));
  if (ausentes.length) return terminar();

  // La página real, tal cual: si no conecta el módulo, la prueba falla (no se inyecta nada en la copia).
  const faltanPiezas = piezasQueFaltan();
  check("las dos páginas reales (portada y explorador) conectan la aplicación instalable (manifest, theme-color, css/instalar.css y montarInstalacion)",
    faltanPiezas.length === 0, faltanPiezas.length ? `faltan: ${faltanPiezas.join(", ")}` : "se prueba tal cual, sin inyectar nada");
  if (faltanPiezas.length) return terminar();

  const precache = JSON.parse(fs.readFileSync(path.join(COPIA, LISTADO), "utf-8"));
  const enDisco = recorrer(COPIA);
  const sobran = precache.archivos.filter((r) => !enDisco.includes(r));
  const faltan = enDisco.filter((r) => !precache.archivos.includes(r));
  check(
    "data/precache.json lista exactamente lo que hay en web/ (si falla: python3 motor/pwa.py)",
    sobran.length === 0 && faltan.length === 0,
    sobran.length || faltan.length
      ? `no existen: ${sobran.join(", ") || "—"} · sin listar: ${faltan.join(", ") || "—"}`
      : `${precache.archivos.length} archivos · versión ${precache.version}`,
  );

  const srv = await servidor();
  const base = `http://localhost:${srv.puerto}/`;
  const navegador = await chromium.launch();
  try {
    const ctx = await nuevoContexto(navegador, base);
    const page = await ctx.newPage();
    const errores = [];
    vigilar(page, base, errores);

    // ---------------------------------------------------------- con red
    await page.goto(base, { waitUntil: "load" });
    try {
      await esperarArranque(page);
    } catch {
      const aviso = await page.locator(".error-carga").allInnerTexts();
      check("la página arranca con red (body[data-listo])", false, [...aviso, ...errores].join(" | "));
      return terminar(navegador, srv);
    }
    check("la página arranca con red", true, base);

    let alMando = true;
    try {
      await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), null, { timeout: ESPERA_COPIA_MS });
    } catch {
      alMando = false;
    }
    const worker = await page.evaluate(async () => {
      const registro = await navigator.serviceWorker.getRegistration();
      return { estado: registro?.active?.state ?? "sin registro", guion: registro?.active?.scriptURL ?? "", alcance: registro?.scope ?? "" };
    });
    check(
      "el service worker queda activo y al mando de la página (skipWaiting + clients.claim)",
      alMando && worker.estado === "activated" && worker.guion === `${base}sw.js` && worker.alcance === base,
      `${worker.estado} · ${worker.guion} · alcance ${worker.alcance}`,
    );
    if (!alMando) return terminar(navegador, srv);

    const caja = page.locator(".instalar");
    let copiaLista = true;
    try {
      await page.waitForSelector(".instalar[data-copia='lista']", { timeout: ESPERA_COPIA_MS });
    } catch {
      copiaLista = false;
    }
    const textoCaja = (await caja.count()) ? (await caja.innerText()).replace(/\s+/g, " ").trim() : "(sin .instalar)";
    check(
      `indicador con red: «${TEXTOS.enLinea}» y «${TEXTOS.copiaLista}» (el service worker terminó de guardar)`,
      copiaLista && (await caja.isVisible()) && textoCaja.includes(TEXTOS.enLinea) && textoCaja.includes(TEXTOS.copiaLista) &&
        (await caja.getAttribute("data-red")) === "online",
      textoCaja,
    );
    check(
      "el indicador es una región de estado accesible (role=status) y el botón de instalar aún no aparece",
      (await caja.locator("[role='status']").count()) === 1 && !(await caja.locator(".instalar-boton").isVisible()),
    );

    // La caché «raiz-<version>» y solo esa, con todos los archivos del listado.
    const cache = await page.evaluate(async (archivos) => {
      const nombres = (await caches.keys()).filter((n) => n.startsWith("raiz-"));
      const guardados = [];
      for (const nombre of nombres) {
        const c = await caches.open(nombre);
        const faltan = [];
        for (const ruta of archivos) if (!(await c.match(new URL(ruta, location.href).href))) faltan.push(ruta);
        guardados.push({ nombre, entradas: (await c.keys()).length, faltan });
      }
      return guardados;
    }, precache.archivos);
    check(
      `la caché raiz-${precache.version} guarda los ${precache.archivos.length} archivos del listado (y no queda otra)`,
      cache.length === 1 && cache[0].nombre === `raiz-${precache.version}` && cache[0].faltan.length === 0,
      cache.map((c) => `${c.nombre}: ${c.entradas} entradas, faltan ${c.faltan.length}${c.faltan.length ? ` (${c.faltan.slice(0, 3).join(", ")}…)` : ""}`).join(" · "),
    );

    // Manifest enlazado: válido, con rutas relativas, y sus iconos cargan con el tamaño declarado.
    const manifest = await page.evaluate(async () => {
      const enlace = document.querySelector("link[rel='manifest']");
      if (!enlace) return null;
      const m = await fetch(enlace.href).then((r) => r.json());
      const iconos = [];
      for (const i of m.icons ?? []) {
        const url = new URL(i.src, enlace.href).href;
        const medida = await new Promise((ok) => {
          const img = new Image();
          img.onload = () => ok(`${img.naturalWidth}x${img.naturalHeight}`);
          img.onerror = () => ok("no carga");
          img.src = url;
        });
        iconos.push({ src: i.src, sizes: i.sizes, purpose: i.purpose, medida });
      }
      return { name: m.name, short_name: m.short_name, start_url: m.start_url, scope: m.scope, display: m.display, iconos };
    });
    check(
      "el manifest enlazado es válido: nombre, start_url y scope relativos, standalone, iconos del tamaño declarado y uno maskable",
      manifest && manifest.name && manifest.short_name && manifest.start_url === "./" && manifest.scope === "./" &&
        manifest.display === "standalone" && manifest.iconos.length >= 2 && manifest.iconos.every((i) => i.medida === i.sizes) &&
        manifest.iconos.some((i) => i.purpose === "maskable"),
      manifest ? `${manifest.name} · ${manifest.iconos.map((i) => `${i.src} ${i.medida} (${i.purpose})`).join(", ")}` : "index.html no enlaza el manifest",
    );
    await page.screenshot({ path: path.join(CAPTURAS, "pwa_online.png") });

    // Quien escucha (alCambiar), en otra pestaña: su función usa el controlador y además lanza.
    const aparte = await ctx.newPage();
    const erroresAparte = [];
    aparte.on("pageerror", (e) => erroresAparte.push(e.message));
    await aparte.goto(base, { waitUntil: "load" });
    const escucha = await aparte.evaluate(async () => {
      const { montarInstalacion } = await import("./js/instalar.js");
      const pausa = (ms) => new Promise((seguir) => setTimeout(seguir, ms));
      const caja = document.createElement("div");
      document.body.append(caja);
      const salida = { lanzo: "", dentro: false, avisos: [] };
      let devuelto = false;
      try {
        const ctl = montarInstalacion(caja, {
          alCambiar: (e) => {
            if (!devuelto) salida.dentro = true;
            salida.avisos.push(`${e.red}/${e.copia}/${ctl.estado().copia}`); // usa el controlador que devolvió el montaje
            throw new Error("falla de quien escucha");
          },
        });
        devuelto = true;
        await ctl.listo;
        await pausa(800);
        salida.nodos = caja.querySelectorAll(".instalar:not([hidden])").length;
        salida.texto = caja.innerText.replace(/\s+/g, " ").trim();
        // Sin cambios de estado, sincronizar no debe tocar la región role=status.
        let mutaciones = 0;
        const ojo = new MutationObserver((lista) => {
          mutaciones += lista.length;
        });
        ojo.observe(caja.querySelector("[role='status']"), { subtree: true, childList: true, characterData: true, attributes: true });
        for (let i = 0; i < 3; i += 1) {
          ctl.sincronizar();
          await pausa(400);
        }
        ojo.disconnect();
        salida.mutaciones = mutaciones;
        ctl.destruir();
        salida.trasDestruir = caja.querySelectorAll(".instalar").length;
      } catch (error) {
        salida.lanzo = String(error);
      }
      return salida;
    });
    await aparte.close();
    check(
      "alCambiar: el primer aviso llega después de montar y con lo guardado ya leído, puede usar el controlador y, si lanza, el indicador sigue en pie (el error se reporta aparte)",
      escucha.lanzo === "" && !escucha.dentro && escucha.avisos[0] === "online/lista/lista" && escucha.nodos === 1 &&
        escucha.texto.includes(TEXTOS.copiaLista) && escucha.trasDestruir === 0 && erroresAparte.some((e) => e.includes("falla de quien escucha")),
      `avisos: ${escucha.avisos.join(", ") || "—"} · ${escucha.lanzo || escucha.texto} · errores reportados aparte: ${erroresAparte.length}`,
    );
    check(
      "sincronizar sin cambios de estado no toca la región role=status (no se vuelve a anunciar)",
      escucha.mutaciones === 0,
      `${escucha.mutaciones} mutación(es) en tres sincronizaciones`,
    );

    // RED PRIMERO: el archivo cambia en el servidor DESPUÉS de guardarse la copia; con red debe llegar el nuevo.
    fs.appendFileSync(path.join(COPIA, "index.html"), `\n${MARCA}\n`);
    const antesDePedir = srv.atendidas.length;
    const conRed = await page.evaluate(async () => (await fetch("index.html")).text());
    check(
      "red primero: con red, un archivo que cambió en el servidor llega nuevo (no la copia guardada)",
      conRed.includes(MARCA) && srv.atendidas.slice(antesDePedir).some((a) => a.ruta === "/index.html"),
      `el servidor atendió ${srv.atendidas.length - antesDePedir} petición(es)`,
    );

    // «Install app»: el navegador avisa (beforeinstallprompt), el botón aparece y se pulsa con el teclado.
    const boton = caja.locator(".instalar-boton");
    await page.evaluate(() => {
      window.pruebaInstalar = { dialogos: 0, evitado: false };
      const aviso = new Event("beforeinstallprompt", { cancelable: true });
      aviso.prompt = () => {
        window.pruebaInstalar.dialogos += 1;
        return Promise.resolve();
      };
      aviso.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });
      window.dispatchEvent(aviso);
      window.pruebaInstalar.evitado = aviso.defaultPrevented;
    });
    const visible = await boton.isVisible();
    const rotulo = visible ? (await boton.innerText()).trim() : "";
    check(`«${TEXTOS.instalar}» aparece cuando el navegador avisa que se puede instalar`, visible && rotulo === TEXTOS.instalar, rotulo || "no aparece");
    if (visible) {
      await boton.focus();
      const conFoco = await boton.evaluate((b) => {
        const estilo = getComputedStyle(b);
        return document.activeElement === b && b.matches(":focus-visible") && estilo.outlineStyle !== "none" && parseFloat(estilo.outlineWidth) > 0;
      });
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => window.pruebaInstalar.dialogos > 0, null, { timeout: 5000 }).catch(() => {});
      const tras = await page.evaluate(() => ({ ...window.pruebaInstalar, foco: document.activeElement?.className ?? "" }));
      check(
        "el botón se alcanza con el teclado (foco visible), Enter abre el diálogo del navegador una vez y el botón se retira",
        conFoco && tras.dialogos === 1 && tras.evitado && !(await boton.isVisible()) && tras.foco.includes("instalar-estado"),
        `foco visible: ${conFoco} · diálogos: ${tras.dialogos} · foco después: ${tras.foco || "—"}`,
      );
    }

    // ---------------------------------------------------------- se corta la red
    // Lo que debe salir de la copia: cada archivo del listado, con los octetos que hoy tiene el servidor.
    const tamanos = Object.fromEntries(precache.archivos.map((r) => [r, fs.statSync(path.join(COPIA, r)).size]));
    await ctx.setOffline(true);
    await srv.apagar();
    const atendidasAlCortar = srv.atendidas.length;
    let avisoSinRed = true;
    try {
      await page.waitForSelector(".instalar[data-red='offline']", { timeout: 5000 });
    } catch {
      avisoSinRed = false;
    }
    const textoSinRed = (await caja.innerText()).replace(/\s+/g, " ").trim();
    check(`al perder la conexión el indicador dice «${TEXTOS.sinConexion}»`, avisoSinRed && textoSinRed.includes(TEXTOS.sinConexion), textoSinRed);

    // ---------------------------------------------------------- sin red: recarga y uso
    let estadoMapa = "";
    try {
      await page.reload({ waitUntil: "load" });
      estadoMapa = await esperarArranque(page);
    } catch (err) {
      const aviso = await page.locator(".error-carga").allInnerTexts().catch(() => []);
      check("sin red, la página recarga y arranca desde la copia", false, [String(err.message).split("\n")[0], ...aviso, ...errores].join(" | "));
      return terminar(navegador, srv);
    }
    check("sin red, la página recarga y arranca desde la copia", true, `mapa: ${estadoMapa}`);

    const lienzos = await page.locator("#map canvas").count();
    const dibujadas = estadoMapa === "listo" ? await portadaDibujoParcelas(page) : false;
    const listadas = await page.locator("#field-select option").count();
    check("sin red, portada: el mapa tiene su lienzo", lienzos > 0 && estadoMapa === "listo", `${lienzos} lienzo(s) · mapa: ${estadoMapa}`);
    // Con el mapa listo las parcelas deben estar DIBUJADAS; la lista sola solo cuenta cuando no hay mapa.
    check(
      "sin red, portada: las parcelas están dibujadas en el mapa (sin mapa: listadas) y el selector de parcela las trae",
      (estadoMapa === "listo" ? dibujadas : listadas > 0) && listadas > 0,
      `mapa: ${estadoMapa} · dibujadas: ${dibujadas ? "sí" : "no"} · ${listadas} en la lista`,
    );

    const marcas = await page.evaluate(async () => (await (await fetch("data/cubo.json")).json()).dotaciones.marcas.map((m) => m.valor));
    await fijarDeslizador(page, marcas[0]);
    const indicadorA = await indicador(page);
    await fijarDeslizador(page, marcas[marcas.length - 1]);
    const indicadorB = await indicador(page);
    check(
      "sin red, portada: el deslizador cambia los indicadores",
      indicadorA.cifra !== indicadorB.cifra && indicadorA.cifra !== "" && indicadorA.todo !== indicadorB.todo,
      `dotación ${marcas[0]}: ${indicadorA.cifra.slice(0, 80)} → dotación ${marcas[marcas.length - 1]}: ${indicadorB.cifra.slice(0, 80)}`,
    );

    const cajaSinRed = page.locator(".instalar");
    await page.waitForSelector(".instalar[data-red='offline']", { timeout: 5000 }).catch(() => {});
    // El estado y el botón de instalación se montan de forma asíncrona; esperar el indicador concreto.
    await cajaSinRed.locator(".instalar-red").waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    const textoRecargada = (await cajaSinRed.count()) ? (await cajaSinRed.innerText()).replace(/\s+/g, " ").trim() : "(sin .instalar)";
    check(
      `sin red: el indicador «${TEXTOS.sinConexion}» está a la vista`,
      (await cajaSinRed.count()) === 1 && (await cajaSinRed.locator(".instalar-red").isVisible()) && textoRecargada.includes(TEXTOS.sinConexion) &&
        !textoRecargada.includes(TEXTOS.enLinea),
      textoRecargada,
    );

    // Cada archivo del listado sale de la copia con los octetos del servidor (también el renovado con red primero).
    const deLaCopia = await page.evaluate(async (rutas) => {
      const salida = {};
      for (const ruta of rutas) {
        try {
          const r = await fetch(ruta);
          salida[ruta] = r.ok ? (await r.arrayBuffer()).byteLength : -r.status;
        } catch {
          salida[ruta] = -1;
        }
      }
      return salida;
    }, precache.archivos);
    // El listado se compara aparte: lo guarda el worker al terminar, tal como lo leyó.
    const distintos = precache.archivos.filter((r) => deLaCopia[r] !== tamanos[r]);
    const teselas = precache.archivos.filter((r) => r.startsWith("data/dem/") && r.endsWith(".png"));
    check(
      `sin red: los ${precache.archivos.length} archivos del listado salen de la copia con los mismos octetos (${teselas.length} teselas de relieve)`,
      distintos.length === 0,
      distintos.length ? distintos.slice(0, 5).map((r) => `${r}: ${deLaCopia[r]} de ${tamanos[r]}`).join(" · ") : `${Object.values(tamanos).reduce((a, b) => a + b, 0)} octetos`,
    );
    const portada = await page.evaluate(async () => (await fetch("index.html")).text());
    check("sin red: el archivo renovado con red primero es el que sale de la copia (la última copia sincronizada)", portada.includes(MARCA));

    const ajenas = await page.evaluate(async (sonda) => {
      const otroOrigen = await fetch("https://example.invalid/otra/cosa.json").then(() => "respondió", () => "falló");
      const noGuardado = await fetch(sonda).then((r) => `estado ${r.status}`, () => "falló");
      return { otroOrigen, noGuardado, viva: document.body.dataset.dashboard === "listo" ? "si" : "no" };
    }, SONDA);
    check(
      "sin red: una petición a otro origen y una a un archivo que no está en la copia fallan sin romper la página",
      ajenas.otroOrigen === "falló" && ajenas.noGuardado === "falló" && ajenas.viva === "si",
      `otro origen: ${ajenas.otroOrigen} · no guardado: ${ajenas.noGuardado}`,
    );
    await page.screenshot({ path: path.join(CAPTURAS, "pwa_offline.png") });

    // ---------------------------------------------------------- sin red: el explorador de parcelas
    // La otra página de la aplicación también debe abrir desde la copia, con sus parcelas a la vista.
    const explorador = await ctx.newPage();
    vigilar(explorador, base, errores);
    let mapaExplorador = "";
    let abrioExplorador = true;
    try {
      await explorador.goto(`${base}${EXPLORADOR}`, { waitUntil: "load" });
      mapaExplorador = await esperarExplorador(explorador);
    } catch (err) {
      abrioExplorador = false;
      const aviso = await explorador.locator(".error-carga").allInnerTexts().catch(() => []);
      check(`sin red: ${EXPLORADOR} abre y arranca desde la copia`, false, [String(err.message).split("\n")[0], ...aviso].join(" | "));
    }
    if (abrioExplorador) {
      check(`sin red: ${EXPLORADOR} abre y arranca desde la copia`, true, `mapa: ${mapaExplorador}`);
      const lienzosExp = await explorador.locator("#mapa canvas").count();
      const dibujadasExp = mapaExplorador === "listo" ? await explorador.evaluate(() => window.raizDepuracion?.parcelasDibujadas?.() ?? 0) : 0;
      const listadasExp = await explorador.locator(".boton-parcela[data-id]").count();
      check(`sin red, ${EXPLORADOR}: el mapa tiene su lienzo`, lienzosExp > 0 && mapaExplorador === "listo", `${lienzosExp} lienzo(s) · mapa: ${mapaExplorador}`);
      // «0 dibujadas» con el mapa listo es una falla; la lista de parcelas solo cuenta cuando la página avisa «sin-mapa».
      check(
        `sin red, ${EXPLORADOR}: las parcelas están dibujadas en el mapa (sin mapa: listadas)`,
        mapaExplorador === "listo" ? dibujadasExp > 0 : listadasExp > 0,
        `mapa: ${mapaExplorador} · ${dibujadasExp} dibujadas · ${listadasExp} en la lista`,
      );
      await fijarDeslizador(explorador, marcas[0], "#dotacion");
      const expA = await indicadorExplorador(explorador);
      await fijarDeslizador(explorador, marcas[marcas.length - 1], "#dotacion");
      const expB = await indicadorExplorador(explorador);
      check(
        `sin red, ${EXPLORADOR}: el deslizador cambia el indicador`,
        expA.cifra !== expB.cifra && expA.cifra !== "" && expA.todo !== expB.todo,
        `dotación ${marcas[0]}: ${expA.cifra} → dotación ${marcas[marcas.length - 1]}: ${expB.cifra}`,
      );
      await explorador.waitForSelector(".instalar[data-red='offline']", { timeout: 5000 }).catch(() => {});
      const textoExp = (await explorador.locator(".instalar").count()) ? (await explorador.locator(".instalar").innerText()).replace(/\s+/g, " ").trim() : "(sin .instalar)";
      check(`sin red, ${EXPLORADOR}: el indicador «${TEXTOS.sinConexion}» está a la vista`, textoExp.includes(TEXTOS.sinConexion) && !textoExp.includes(TEXTOS.enLinea), textoExp);
      const enlace = await explorador.locator("#enlace-tablero").getAttribute("href").catch(() => null);
      check(`${EXPLORADOR}: la cabecera enlaza la portada («Dashboard» → ${PORTADA})`, enlace === PORTADA, String(enlace));
      await explorador.screenshot({ path: path.join(CAPTURAS, "pwa_explorador_offline.png") });
    }
    await explorador.close();

    // ---------------------------------------------------------- sin red: la portada en los cuatro idiomas
    // La aplicación instalada debe abrir sin red en cualquiera de sus idiomas: «?lang=xx» no puede pedir nada a la
    // red (el worker ignora la búsqueda de la liga) y los diccionarios (js/textos_*.js) salen de la copia.
    const diccionarios = precache.archivos.filter((r) => /^js\/textos_[^/]+\.js$/.test(r));
    check("la copia guarda el módulo de idiomas y los diccionarios del tablero (js/i18n.js y js/textos_*.js)",
      precache.archivos.includes("js/i18n.js") && diccionarios.length > 0, diccionarios.join(", ") || "sin diccionarios");
    for (const codigo of IDIOMAS) {
      const enIdioma = await ctx.newPage();
      vigilar(enIdioma, base, errores);
      let estado = null;
      try {
        await enIdioma.goto(`${base}?lang=${codigo}`, { waitUntil: "load" });
        await esperarArranque(enIdioma);
        estado = await enIdioma.evaluate(() => ({
          lang: document.documentElement.lang,
          titulo: document.title,
          // Una clave de texto a la vista («tablero.…» o «asesor.…») delata un diccionario que no cargó.
          claves: (document.body.innerText.match(/\b(?:tablero|asesor)\.[a-z_]+(?:\.[a-z_0-9]+)+/g) ?? []).slice(0, 5),
          parcelas: document.querySelectorAll("#field-select option").length,
        }));
      } catch (err) {
        estado = { error: String(err.message).split("\n")[0] };
      }
      check(
        `sin red: la portada abre en «${codigo}» desde la copia (<html lang>, sin claves de texto a la vista, con sus parcelas)`,
        estado && !estado.error && estado.lang === codigo && estado.claves.length === 0 && estado.parcelas > 0,
        JSON.stringify(estado),
      );
      await enIdioma.close();
    }

    // ---------------------------------------------------------- sin red, en el teléfono
    const telefono = await ctx.newPage();
    vigilar(telefono, base, errores);
    await telefono.setViewportSize({ width: 390, height: 844 });
    let mapaTelefono = "";
    try {
      await telefono.goto(base, { waitUntil: "load" });
      mapaTelefono = await esperarArranque(telefono);
    } catch (err) {
      check("teléfono (390 × 844) sin red: la aplicación abre desde la copia", false, String(err.message).split("\n")[0]);
      return terminar(navegador, srv);
    }
    await telefono.waitForSelector(".instalar[data-red='offline']", { timeout: 5000 }).catch(() => {});
    const t = await telefono.evaluate(() => {
      const caja = document.querySelector(".instalar");
      const r = caja?.getBoundingClientRect();
      return {
        ancho: document.documentElement.scrollWidth,
        ventana: window.innerWidth,
        texto: caja?.innerText.replace(/\s+/g, " ").trim() ?? "",
        dentro: Boolean(r) && r.width > 0 && r.left >= 0 && r.right <= window.innerWidth + 0.5,
      };
    });
    check(
      "teléfono (390 × 844) sin red: la aplicación abre desde la copia, el indicador cabe y no hay desplazamiento horizontal",
      t.ancho <= t.ventana && t.dentro && t.texto.includes(TEXTOS.sinConexion),
      `ancho del documento ${t.ancho} de ${t.ventana} px · mapa: ${mapaTelefono} · ${t.texto}`,
    );
    await telefono.screenshot({ path: path.join(CAPTURAS, "pwa_telefono_offline.png") });

    check("con la red cortada el servidor no atendió ninguna petición", srv.atendidas.length === atendidasAlCortar, `${srv.atendidas.length - atendidasAlCortar} petición(es)`);
    check("sin errores de página ni de consola de la propia aplicación", errores.length === 0, errores.slice(0, 6).join(" | "));
    if (!teselas.length) omitir("teselas de relieve sin red", "web/data/dem/ no trae teselas");

    // ---------------------------------------------------------- otra visita: la red se corta a media copia
    await ctx.close();
    await corteAMediaCopia(navegador, precache);
  } finally {
    await navegador.close().catch(() => {});
    await srv.apagar();
  }
  return terminar();
}

function terminar(navegador, srv) {
  const fallas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallas.length} de ${resultados.length} comprobaciones pasan. Capturas: ${CAPTURAS}`);
  if (fallas.length) console.log(`FALLAN:\n${fallas.map((f) => `  - ${f.nombre}${f.detalle ? ` — ${f.detalle}` : ""}`).join("\n")}`);
  const cerrar = Promise.resolve(navegador?.close()).catch(() => {}).then(() => srv?.apagar());
  return cerrar.then(() => {
    fs.rmSync(COPIA, { recursive: true, force: true });
    process.exitCode = fallas.length ? 1 : 0;
  });
}

main().catch((err) => {
  console.error(err);
  fs.rmSync(COPIA, { recursive: true, force: true });
  process.exit(1);
});
