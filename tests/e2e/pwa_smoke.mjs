// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// tests/e2e/pwa_smoke.mjs — Prueba de humo de la aplicación instalable y SIN CONEXIÓN (web/sw.js,
// web/js/instalar.js, web/manifest.webmanifest y web/data/precache.json de motor/pwa.py) con Playwright.
//
// Uso:   node tests/e2e/pwa_smoke.mjs
//        RAIZ_CAPTURAS=<carpeta> node tests/e2e/pwa_smoke.mjs   (dónde dejar las capturas pwa_*.png)
// No forma parte de `node --test tests/` (necesita Chromium). Termina con código 0 si todo pasa y 1 si algo falla.
//
// Qué hace:
// - copia web/ a una carpeta temporal y trabaja SOLO sobre esa copia (no toca el repo);
// - si la copia aún no conecta el módulo (ni index.html ni app.js nombran instalar.js), le agrega a SU
//   index.html el <link rel="manifest">, la hoja css/instalar.css y un <script type="module"> que llama a
//   montarInstalacion; cuando la aplicación ya lo conecte, la prueba usa esa conexión tal cual;
// - sirve la copia en localhost (http.createServer, sin dependencias) y abre la página con red;
// - verifica con red: el listado data/precache.json corresponde a lo que hay en web/, el service worker queda
//   activo y al mando de la página, el indicador dice «Online» y «Ready to work offline», la caché
//   «raiz-<version>» guarda todos los archivos del listado, el manifest enlazado es válido y sus iconos
//   cargan, RED PRIMERO (un archivo que cambia en el servidor llega nuevo, no la copia guardada) y el botón
//   «Install app» (aparece con beforeinstallprompt, se pulsa con el teclado, abre el diálogo y desaparece);
// - CORTA LA RED de verdad: context.setOffline(true) y además apaga el servidor (nada puede contestar);
// - verifica sin red: el indicador pasa a «Offline — showing the last synced copy», la página RECARGA y
//   arranca desde la copia, el mapa tiene su lienzo y las parcelas están dibujadas o listadas, el deslizador
//   cambia el indicador, cada archivo del listado sale de la copia con los mismos octetos que en disco
//   (incluidas las teselas de relieve y el archivo renovado con red primero), una petición a otro origen
//   falla sin romper nada y no hay errores de página; lo mismo en un teléfono de 390 × 844 sin
//   desplazamiento horizontal;
// - guarda capturas en RAIZ_CAPTURAS (por omisión, una carpeta temporal que se anuncia al final).
// No supone un juego de datos: las dotaciones de referencia y los archivos se leen de la propia copia.

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { LLAVE_INICIO } from "../../web/js/acerca.js";
import { TEXTOS } from "../../web/js/instalar.js";

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
const ESPERA_ARRANQUE_MS = 30000;

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

/** Conecta el módulo en la COPIA si la aplicación aún no lo hace. Devuelve qué se agregó. */
function conectarEnLaCopia() {
  const ruta = path.join(COPIA, "index.html");
  let html = fs.readFileSync(ruta, "utf-8");
  const app = fs.existsSync(path.join(COPIA, "app.js")) ? fs.readFileSync(path.join(COPIA, "app.js"), "utf-8") : "";
  const agregado = [];
  const etiquetas = [];
  if (!/<link\b[^>]*rel=["']?manifest\b/i.test(html)) {
    etiquetas.push('<link rel="manifest" href="manifest.webmanifest">');
    agregado.push("manifest");
  }
  if (!html.includes("css/instalar.css")) {
    etiquetas.push('<link rel="stylesheet" href="css/instalar.css">');
    agregado.push("css/instalar.css");
  }
  if (!html.includes("instalar.js") && !app.includes("instalar.js")) {
    etiquetas.push(
      '<script type="module">',
      '  import { montarInstalacion } from "./js/instalar.js";',
      '  const caja = document.createElement("div");',
      '  caja.id = "instalacion-de-prueba";',
      '  (document.querySelector("#marca") ?? document.body).append(caja);',
      "  montarInstalacion(caja);",
      "</script>",
    );
    agregado.push("montarInstalacion");
  }
  if (etiquetas.length) {
    if (!html.includes("</head>")) throw new Error("index.html de la copia no tiene </head>");
    html = html.replace("</head>", `${etiquetas.join("\n")}\n</head>`);
    fs.writeFileSync(ruta, html);
  }
  return agregado;
}

// ---------------------------------------------------------------- servidor estático (se puede apagar de golpe)
function servidor() {
  const atendidas = [];
  const srv = http.createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    atendidas.push(ruta);
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
        atendidas,
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
/** Texto del indicador: la cifra grande y todo el bloque (rango y mensajes incluidos). */
const indicador = (page) =>
  page.evaluate(() => ({
    cifra: document.querySelector("#indicador-cifra").innerText.replace(/\s+/g, " ").trim(),
    todo: document.querySelector("#indicador").innerText,
  }));
async function fijarDeslizador(page, valor) {
  await page.evaluate((v) => {
    const s = document.querySelector("#dotacion");
    s.value = String(v);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  }, valor);
}
async function esperarArranque(page) {
  await page.waitForSelector("body[data-listo='si']", { timeout: ESPERA_ARRANQUE_MS });
  await page.waitForFunction(() => ["listo", "sin-mapa"].includes(document.body.dataset.mapa), null, { timeout: ESPERA_ARRANQUE_MS });
  return page.evaluate(() => document.body.dataset.mapa);
}
/** Oyentes de errores de una página: solo cuentan los de la propia aplicación (no las teselas de otro origen). */
function vigilar(page, base, errores) {
  const propia = (url = "") => url.startsWith(base) && !url.endsWith("/favicon.ico") && !url.endsWith(SONDA);
  page.on("pageerror", (e) => errores.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && propia(m.location()?.url ?? "")) errores.push(`consola: ${m.text()} (${m.location().url})`);
  });
}

async function main() {
  // ------------------------------------------------------------ la copia y su listado
  fs.cpSync(WEB, COPIA, { recursive: true });
  fs.mkdirSync(CAPTURAS, { recursive: true });
  const necesarios = ["sw.js", "js/instalar.js", "css/instalar.css", "manifest.webmanifest", LISTADO];
  const ausentes = necesarios.filter((f) => !fs.existsSync(path.join(COPIA, f)));
  check("web/ trae las piezas de la aplicación instalable", ausentes.length === 0, ausentes.length ? `faltan: ${ausentes.join(", ")}` : necesarios.join(", "));
  if (ausentes.length) return terminar();

  const agregado = conectarEnLaCopia();
  console.log(agregado.length ? `(a la copia de index.html se le agregó: ${agregado.join(", ")})` : "(la aplicación ya conecta el módulo: se prueba tal cual)");

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

    // RED PRIMERO: el archivo cambia en el servidor DESPUÉS de guardarse la copia; con red debe llegar el nuevo.
    fs.appendFileSync(path.join(COPIA, "index.html"), `\n${MARCA}\n`);
    const antesDePedir = srv.atendidas.length;
    const conRed = await page.evaluate(async () => (await fetch("index.html")).text());
    check(
      "red primero: con red, un archivo que cambió en el servidor llega nuevo (no la copia guardada)",
      conRed.includes(MARCA) && srv.atendidas.slice(antesDePedir).includes("/index.html"),
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

    const lienzos = await page.locator("#mapa canvas").count();
    const dibujadas = estadoMapa === "listo" ? await page.evaluate(() => window.raizDepuracion?.parcelasDibujadas?.() ?? 0) : 0;
    const listadas = await page.locator(".boton-parcela[data-id]").count();
    check("sin red: el mapa tiene su lienzo", lienzos > 0 && estadoMapa === "listo", `${lienzos} lienzo(s) · mapa: ${estadoMapa}`);
    check("sin red: las parcelas están dibujadas en el mapa o listadas", dibujadas > 0 || listadas > 0, `${dibujadas} dibujadas · ${listadas} en la lista`);

    const marcas = await page.evaluate(async () => (await (await fetch("data/cubo.json")).json()).dotaciones.marcas.map((m) => m.valor));
    await fijarDeslizador(page, marcas[0]);
    const indicadorA = await indicador(page);
    await fijarDeslizador(page, marcas[marcas.length - 1]);
    const indicadorB = await indicador(page);
    check(
      "sin red: el deslizador cambia el indicador",
      indicadorA.cifra !== indicadorB.cifra && indicadorA.cifra !== "" && indicadorA.todo !== indicadorB.todo,
      `dotación ${marcas[0]}: ${indicadorA.cifra} → dotación ${marcas[marcas.length - 1]}: ${indicadorB.cifra}`,
    );

    const cajaSinRed = page.locator(".instalar");
    await page.waitForSelector(".instalar[data-red='offline']", { timeout: 5000 }).catch(() => {});
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
      return { otroOrigen, noGuardado, viva: document.body.dataset.listo };
    }, SONDA);
    check(
      "sin red: una petición a otro origen y una a un archivo que no está en la copia fallan sin romper la página",
      ajenas.otroOrigen === "falló" && ajenas.noGuardado === "falló" && ajenas.viva === "si",
      `otro origen: ${ajenas.otroOrigen} · no guardado: ${ajenas.noGuardado}`,
    );
    await page.screenshot({ path: path.join(CAPTURAS, "pwa_offline.png") });

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
