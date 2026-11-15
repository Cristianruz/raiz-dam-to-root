// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// tests/e2e/offline_smoke.mjs — Prueba de humo de la copia SIN RED (motor/demo_offline.py) con Playwright.
//
// Uso:   node tests/e2e/offline_smoke.mjs
//        RAIZ_CAPTURAS=<carpeta> node tests/e2e/offline_smoke.mjs   (dónde dejar las capturas offline_*.png)
// No forma parte de `node --test tests/` (necesita Chromium). Termina con código 0 si todo pasa y 1 si algo falla.
//
// Qué hace:
// - construye la copia con `python3 motor/demo_offline.py --salida <carpeta temporal>/raiz-offline.html`
//   (una carpeta donde solo está ese archivo: nada de css/, js/ ni data/ a su lado);
// - la abre con file:// en un contexto con TODA la red cortada (solo pasan file:, blob: y data:);
// - verifica: sin errores de página ni de consola (salvo las teselas, que no tienen red), la nota de la copia
//   con el commit que informó la construcción, el sustituto de fetch (copia incrustada, 404 si falta, lo
//   demás al fetch de verdad), los archivos que no son JSON (teselas de relieve) por fetch, por XMLHttpRequest
//   y desde MapLibre, el lienzo del mapa y las parcelas dibujadas o listadas, el indicador que
//   cambia con el deslizador, la ficha de una parcela clasificada con una tarjeta por opción, el mensaje
//   de WhatsApp sin enlazar hojas de estilos que no existen, «Regional context» (plegable del panel) dibujado con
//   el contexto.json de la copia y «About & Data» si la página trae el botón (con «Challenge data sources» y H1-b
//   cuando la copia trae contexto.json y pruebas.json);
// - guarda capturas en RAIZ_CAPTURAS (por omisión, una carpeta temporal que se anuncia al final).
// No supone un juego de datos: las dotaciones de referencia y la parcela de la prueba se leen de la copia.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { LLAVE_INICIO } from "../../web/js/acerca.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const TEMPORAL = fs.mkdtempSync(path.join(os.tmpdir(), "raiz-offline-"));
const ARCHIVO = path.join(TEMPORAL, "raiz-offline.html");
const CAPTURAS = process.env.RAIZ_CAPTURAS ? path.resolve(process.env.RAIZ_CAPTURAS) : path.join(TEMPORAL, "capturas");

// ---------------------------------------------------------------- registro de resultados
const resultados = [];
function check(nombre, cond, detalle = "") {
  resultados.push({ nombre, ok: Boolean(cond), detalle });
  console.log(`${cond ? "PASA" : "FALLA"}  ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}
function omitir(nombre, motivo) {
  console.log(`OMITE  ${nombre} — ${motivo}`);
}

// ---------------------------------------------------------------- utilidades de página
const ESPERA_IMPRESION_MS = 1500; // tope de la prueba para que «Print field sheet» llame a imprimir
const esLocal = (url = "") => /^(file|blob|data):/.test(url);
const esRemota = (url = "") => /^https?:/.test(url);
const texto = (page, sel) => page.locator(sel).innerText();
const indicador = (page) => page.evaluate(() => document.querySelector("#indicador").innerText);
const esperarAnimaciones = (page) =>
  page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== "running"), null, { timeout: 5000 });

async function fijarDeslizador(page, valor) {
  await page.evaluate((v) => {
    const s = document.querySelector("#dotacion");
    s.value = String(v);
    s.dispatchEvent(new Event("input", { bubbles: true }));
  }, valor);
}

/** Construye la copia sin red y devuelve lo que informó la construcción (o null si falló). */
function construir() {
  try {
    const salida = execFileSync(process.env.PYTHON ?? "python3", ["motor/demo_offline.py", "--salida", ARCHIVO], {
      cwd: RAIZ,
      encoding: "utf-8",
    });
    return {
      nota: salida.match(/^Nota en la página: (.*)$/m)?.[1] ?? "",
      total: salida.match(/^Tamaño total: (.*)$/m)?.[1] ?? "",
    };
  } catch (err) {
    console.log(`${err.stdout ?? ""}${err.stderr ?? ""}`);
    return null;
  }
}

async function main() {
  const construccion = construir();
  const junto = fs.existsSync(TEMPORAL) ? fs.readdirSync(TEMPORAL) : [];
  check(
    "motor/demo_offline.py construye la copia: un solo archivo, sin nada a su lado",
    construccion && junto.length === 1 && junto[0] === path.basename(ARCHIVO),
    construccion ? `${construccion.total} · ${ARCHIVO}` : "la construcción falló",
  );
  if (!construccion) return terminar();
  fs.mkdirSync(CAPTURAS, { recursive: true });

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
    // SIN RED: solo pasan el archivo, las URL Blob de los módulos y las URI data:.
    const cortadas = [];
    await ctx.route("**/*", (route) => {
      const url = route.request().url();
      if (esLocal(url)) return route.continue();
      cortadas.push(url);
      return route.abort();
    });

    const page = await ctx.newPage();
    const urlPagina = pathToFileURL(ARCHIVO).href;
    const peticiones = [];
    const errores = [];
    page.on("request", (r) => peticiones.push(r.url()));
    page.on("pageerror", (e) => errores.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      // Las teselas del mapa base no tienen red: su falla es la esperada (la web lo avisa en el mapa).
      if (esRemota(m.location()?.url ?? "") || /https?:\/\//.test(m.text())) return;
      errores.push(`consola: ${m.text()}`);
    });
    page.on("requestfailed", (r) => {
      if (!esRemota(r.url())) errores.push(`requestfailed: ${r.url()}`);
    });

    await page.goto(urlPagina, { waitUntil: "load" });
    try {
      await page.waitForSelector("body[data-listo='si']", { timeout: 20000 });
    } catch {
      const aviso = await page.locator(".error-carga").allInnerTexts();
      check("la copia arranca desde file:// (body[data-listo])", false, [...aviso, ...errores].join(" | "));
      return terminar(navegador);
    }
    await page.waitForFunction(() => ["listo", "sin-mapa"].includes(document.body.dataset.mapa), null, { timeout: 30000 });
    await page.waitForFunction(() => Boolean(document.body.dataset.relieve), null, { timeout: 15000 });
    const estadoMapa = await page.evaluate(() => document.body.dataset.mapa);
    check("la copia arranca desde file://, sin servidor", page.url().startsWith("file://"), `mapa: ${estadoMapa}`);

    // Nota visible de la copia, con el commit que informó la construcción.
    const nota = page.locator("#nota-offline");
    check(
      "la nota de la copia sin red está a la vista y dice de qué commit salió",
      (await nota.isVisible()) &&
        (await nota.innerText()).trim() === construccion.nota &&
        construccion.nota.startsWith("Offline copy built from the repository") &&
        construccion.nota.includes("no network needed; base map tiles need a connection"),
      construccion.nota,
    );

    // Sustituto de fetch: copia incrustada (sin mirar la consulta), 404 si no viene, lo demás al fetch de verdad.
    const f = await page.evaluate(async () => {
      const esta = await fetch("data/cubo.json?v=prueba");
      const cubo = await esta.json();
      const falta = await fetch("data/archivo_que_no_viene.json");
      const ajena = await fetch("https://example.invalid/otra/cosa.json").then(() => "respondió", () => "falló");
      return {
        estado: esta.status,
        tipo: esta.headers.get("content-type"),
        conParcelas: Object.keys(cubo.parcelas ?? {}).length > 0,
        falta: falta.status,
        ajena,
      };
    });
    check(
      "fetch: data/cubo.json sale de la copia incrustada (estado y tipo JSON)",
      f.estado === 200 && /^application\/json/.test(f.tipo ?? "") && f.conParcelas,
      `${f.estado} · ${f.tipo}`,
    );
    check("fetch: un archivo de data/ que no viene en la copia contesta 404", f.falta === 404, String(f.falta));
    check("fetch: lo que no es un archivo de data/ sigue al fetch de verdad (sin red, falla)", f.ajena === "falló", f.ajena);

    // Lo que no es JSON (p. ej. las teselas de relieve de data/dem/) viaja en base64: fetch y XMLHttpRequest
    // devuelven los mismos octetos que el archivo de web/data/.
    const binarios = await page.evaluate(() =>
      [...document.querySelectorAll("script[data-raiz-dato]")].filter((b) => b.type !== "application/json").map((b) => b.dataset.raizDato),
    );
    if (binarios.length) {
      const nombre = binarios[0];
      const enDisco = fs.statSync(path.join(RAIZ, "web", "data", nombre)).size;
      const b = await page.evaluate(async (n) => {
        const porFetch = await fetch(`data/${n}`);
        const octetos = (await porFetch.arrayBuffer()).byteLength;
        const porXhr = await new Promise((ok) => {
          const x = new XMLHttpRequest();
          x.open("GET", `data/${n}`);
          x.responseType = "arraybuffer";
          x.onload = () => ok({ estado: x.status, octetos: x.response?.byteLength ?? 0 });
          x.onerror = () => ok({ estado: -1, octetos: 0 });
          x.send();
        });
        return { estado: porFetch.status, tipo: porFetch.headers.get("content-type"), octetos, porXhr };
      }, nombre);
      check(
        `data/${nombre} (uno de ${binarios.length} archivos que no son JSON) llega entero por fetch y por XMLHttpRequest`,
        b.estado === 200 && b.octetos === enDisco && b.porXhr.estado === 200 && b.porXhr.octetos === enDisco,
        `${b.tipo} · ${b.octetos} y ${b.porXhr.octetos} de ${enDisco} octetos`,
      );
    } else {
      omitir("archivos de datos que no son JSON", "web/data/ solo trae JSON y GeoJSON");
    }

    // Relieve del gemelo (gemelo.json): MapLibre, en file://, pide las teselas con XMLHttpRequest. Un mapa
    // aparte con esa fuente raster-dem debe cargarla sin red y sin errores.
    const relieve3d = await page.evaluate(async () => {
      const gemelo = await fetch("data/gemelo.json").then((r) => (r.ok ? r.json() : null));
      const terreno = gemelo?.terreno;
      const zona = terreno?.zonas ? Object.values(terreno.zonas)[0] : null;
      if (!zona?.teselas || !window.maplibregl) return null;
      const caja = document.createElement("div");
      caja.style.cssText = "position:fixed;left:0;top:0;width:256px;height:256px;visibility:hidden";
      document.body.append(caja);
      const fuente = { type: "raster-dem", tiles: [zona.teselas], bounds: zona.bounds };
      for (const k of ["tileSize", "encoding", "minzoom", "maxzoom"]) if (terreno[k] !== undefined) fuente[k] = terreno[k];
      const errores = [];
      const mapa = new window.maplibregl.Map({
        container: caja,
        style: { version: 8, sources: { dem: fuente }, layers: [{ id: "sombra", type: "hillshade", source: "dem" }] },
        bounds: zona.bounds,
        attributionControl: false,
      });
      mapa.on("error", (e) => errores.push(String(e?.error?.message ?? e)));
      const cargada = await new Promise((ok) => {
        mapa.once("idle", () => ok(mapa.isSourceLoaded("dem")));
        setTimeout(() => ok(false), 15000);
      });
      mapa.remove();
      caja.remove();
      return { cargada, errores, teselas: zona.teselas };
    });
    if (relieve3d) {
      check(
        "MapLibre carga las teselas de relieve del gemelo desde la copia (raster-dem, sin red)",
        relieve3d.cargada && relieve3d.errores.length === 0,
        `${relieve3d.teselas}${relieve3d.errores.length ? ` · ${relieve3d.errores.join(" | ")}` : ""}`,
      );
    } else {
      omitir("teselas de relieve del gemelo en MapLibre", "la copia no trae gemelo.json con terreno");
    }

    // Mapa: el lienzo existe y las parcelas están dibujadas o, al menos, listadas.
    const lienzos = await page.locator("#mapa canvas").count();
    const dibujadas = estadoMapa === "listo" ? await page.evaluate(() => window.raizDepuracion.parcelasDibujadas()) : 0;
    const listadas = await page.locator(".boton-parcela[data-id]").count();
    check("el mapa tiene su lienzo", lienzos > 0 && estadoMapa === "listo", `${lienzos} lienzo(s) · mapa: ${estadoMapa}`);
    check("las parcelas están dibujadas en el mapa o listadas", dibujadas > 0 || listadas > 0, `${dibujadas} dibujadas · ${listadas} en la lista`);

    // Lo que la prueba necesita de los datos, leído de la propia copia.
    const d = await page.evaluate(async () => {
      const [cubo, parcelas] = await Promise.all(["data/cubo.json", "data/parcelas.geojson"].map((u) => fetch(u).then((r) => r.json())));
      const marcas = cubo.dotaciones.marcas.map((m) => m.valor);
      const clasificadas = parcelas.features
        .map((p) => p.properties)
        .filter((p) => !p.abstencion && (cubo.parcelas?.[p.id]?.opciones?.length ?? 0) > 0)
        .sort((a, b) => Number(Boolean(b.protagonista)) - Number(Boolean(a.protagonista))) // primero las de la historia
        .map((p) => ({ id: p.id, opciones: cubo.parcelas[p.id].opciones.length }));
      const incrustados = [...document.querySelectorAll("script[data-raiz-dato]")].map((b) => b.dataset.raizDato);
      return { marcas, clasificadas, incrustados };
    });

    // El deslizador cambia el indicador principal.
    const [d1, d2] = [d.marcas[0], d.marcas[d.marcas.length - 1]];
    await fijarDeslizador(page, d1);
    const conD1 = await indicador(page);
    const cifraD1 = await texto(page, "#indicador-cifra");
    await fijarDeslizador(page, d2);
    const conD2 = await indicador(page);
    check(
      "el indicador principal cambia al mover el deslizador de dotación",
      conD1.trim().length > 0 && conD1 !== conD2,
      `con ${d1}: «${cifraD1.replace(/\s+/g, " ")}» · con ${d2}: «${(await texto(page, "#indicador-cifra")).replace(/\s+/g, " ")}»`,
    );
    if (estadoMapa === "listo") await page.evaluate(() => window.raizDepuracion.esperarMapa());
    await page.screenshot({ path: path.join(CAPTURAS, "offline_1_centro_control.png") });

    // Ficha de una parcela clasificada, abierta desde la lista: una tarjeta por opción.
    const enLista = new Set(await page.locator(".boton-parcela[data-id]").evaluateAll((xs) => xs.map((x) => x.dataset.id)));
    const parcela = d.clasificadas.find((p) => enLista.has(p.id));
    if (parcela) {
      await page.locator(`.boton-parcela[data-id="${parcela.id}"]`).click();
      await page.waitForSelector("#ficha:not([hidden])");
      const tarjetas = await page.locator("#ficha .tarjeta[data-opcion]").count();
      check(
        `la ficha de la parcela clasificada ${parcela.id} abre desde la lista con una tarjeta por opción`,
        (await texto(page, "#ficha-titulo")).trim().length > 0 && tarjetas === parcela.opciones,
        `${tarjetas} tarjetas de ${parcela.opciones}`,
      );
      await esperarAnimaciones(page);
      await page.screenshot({ path: path.join(CAPTURAS, "offline_2_ficha.png") });
      // Mensaje de WhatsApp e impresión: su módulo «asegura» sus hojas de estilos; en la copia ya van incrustadas
      // y no debe esperar a una hoja que no existe (la segunda impresión tardaría varios segundos).
      if ((await page.locator("#boton-whatsapp").count()) > 0) {
        await page.locator("#boton-whatsapp").click();
        check("el mensaje de WhatsApp se muestra en la ficha", await page.locator("#vista-whatsapp").isVisible());
        await page.locator("#boton-whatsapp").click();
      }
      if ((await page.locator("#boton-imprimir").count()) > 0) {
        await page.evaluate(() => {
          window.__impresiones = 0;
          window.print = () => {
            window.__impresiones += 1;
          };
        });
        const tiempos = [];
        for (const vez of [1, 2]) {
          const t0 = Date.now();
          await page.locator("#boton-imprimir").click();
          const llamo = await page
            .waitForFunction((n) => window.__impresiones >= n, vez, { timeout: 8000 })
            .then(() => true)
            .catch(() => false);
          tiempos.push(llamo ? Date.now() - t0 : Infinity);
          await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
        }
        check(
          "«Print field sheet» llama a imprimir sin esperar hojas de estilos (dos veces seguidas)",
          tiempos.every((t) => t < ESPERA_IMPRESION_MS),
          tiempos.map((t) => `${t} ms`).join(" · "),
        );
      }
    } else {
      check("hay una parcela clasificada en la lista para abrir su ficha", false, `${d.clasificadas.length} clasificadas en los datos`);
    }

    // «Regional context» (etapa 3), si la página trae el bloque: se dibuja con el contexto.json incrustado, sin red.
    if ((await page.locator("#bloque-contexto").count()) > 0) {
      // La ficha abierta deja el panel inert: se cierra antes de abrir el bloque.
      if (await page.locator("#ficha").isVisible()) await page.locator("#ficha-cerrar").click();
      await page.locator("#bloque-contexto > summary").click();
      await page.waitForFunction(() => Boolean(document.body.dataset.contexto), null, { timeout: 10000 }).catch(() => null);
      const marca = await page.evaluate(() => document.body.dataset.contexto ?? "");
      const tarjetas = await page.locator("#contexto-regional .contexto-tarjeta").count();
      const conDatos = d.incrustados.includes("contexto.json");
      check(
        "«Regional context» se abre en la copia sin red" + (conDatos ? " y dibuja sus tarjetas con el contexto.json incrustado" : ""),
        conDatos ? marca === "listo" && tarjetas > 0 : ["ausente", "listo"].includes(marca),
        `${marca} · ${tarjetas} tarjetas`,
      );
      await page.locator("#bloque-contexto > summary").click();
    } else {
      omitir("«Regional context»", "la página no trae el bloque #bloque-contexto");
    }

    // «About & Data», si la página trae el botón: lee manifest.json y pruebas.json de la copia.
    if ((await page.locator("#boton-acerca").count()) > 0) {
      await page.locator("#boton-acerca").click();
      await page.waitForSelector("body[data-acerca='listo']", { timeout: 10000 });
      const dlg = page.locator("#acerca");
      const filas = await page.locator("#acerca .acerca-tabla tbody tr[data-familia]").count();
      const pruebas = await page.locator("#acerca .acerca-prueba").count();
      check(
        "«About & Data» abre y muestra lo que lee de la copia (manifest.json, pruebas.json)",
        (await dlg.evaluate((x) => x.open)) &&
          (!d.incrustados.includes("manifest.json") || filas > 0) &&
          (!d.incrustados.includes("pruebas.json") || pruebas > 0),
        `${filas} filas de datos · ${pruebas} pruebas`,
      );
      if (d.incrustados.includes("contexto.json")) {
        const recursos = await page.locator('#acerca [data-bloque="recursos"] tbody tr[data-recurso]').count();
        check("«About & Data»: «Challenge data sources» con el contexto.json de la copia", recursos > 0, `${recursos} recursos`);
      }
      if (d.incrustados.includes("pruebas.json")) {
        const h1b = await page.locator('#acerca .acerca-complemento[data-complemento="h1b"]').count();
        check("«About & Data»: H1-b junto a H1 con el pruebas.json de la copia", h1b === 1, `${h1b} bloque(s)`);
      }
      await page.screenshot({ path: path.join(CAPTURAS, "offline_3_acerca.png") });
      await page.keyboard.press("Escape");
    } else {
      omitir("«About & Data»", "la página no trae el botón #boton-acerca");
    }

    // Nada salió a buscar un archivo junto a la página, y la red estuvo cortada todo el tiempo.
    const hojas = await page.locator('link[rel="stylesheet"]').evaluateAll((xs) => xs.map((x) => x.getAttribute("href") ?? ""));
    check(
      "ninguna hoja de estilos enlazada apunta a un archivo (todas van incrustadas)",
      hojas.every((h) => h.startsWith("data:")),
      hojas.filter((h) => !h.startsWith("data:")).join(", "),
    );
    const aArchivos = peticiones.filter((u) => u.startsWith("file:") && u.split(/[?#]/)[0] !== urlPagina);
    check("la página no pide ningún otro archivo del disco", aArchivos.length === 0, aArchivos.join(", "));
    const remotas = peticiones.filter(esRemota);
    check(
      "sin red: todas las peticiones http(s) quedaron cortadas (solo teselas del mapa base)",
      remotas.every((u) => cortadas.includes(u)),
      `${remotas.length} cortadas · ${[...new Set(remotas.map((u) => new URL(u).host))].join(", ") || "ninguna"}`,
    );
    check("sin errores de página ni de consola", errores.length === 0, errores.join(" | "));
    await ctx.close();
  } catch (err) {
    check("la prueba de humo terminó sin excepciones", false, err.stack ?? String(err));
  }
  return terminar(navegador);
}

async function terminar(navegador) {
  if (navegador) await navegador.close();
  fs.rmSync(ARCHIVO, { force: true });
  if (fs.existsSync(TEMPORAL) && fs.readdirSync(TEMPORAL).length === 0) fs.rmdirSync(TEMPORAL);
  const fallas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - fallas.length}/${resultados.length} comprobaciones pasan. Capturas en ${CAPTURAS}/`);
  process.exit(fallas.length ? 1 : 0);
}

main();
