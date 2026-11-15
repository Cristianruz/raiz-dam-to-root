// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// tests/e2e/grabar_video.mjs — Graba el video de 30 s o menos del envío (kit C7) con Playwright y lo exporta con ffmpeg.
//
// Uso:   node tests/e2e/grabar_video.mjs
//        RAIZ_URL=https://<liga pública>/ node tests/e2e/grabar_video.mjs   (graba la página publicada, no la local)
//        RAIZ_FOTOGRAMAS=<carpeta>   dónde dejar un fotograma de cada toma para revisarlo (por omisión, una temporal)
//        FFMPEG=<ruta> FFPROBE=<ruta>   si ffmpeg y ffprobe no están en el PATH
// No forma parte de `node --test tests/` (necesita Chromium y ffmpeg). Termina con 0 si todo pasa y 1 si algo falla.
//
// Qué hace (guion: docs/pitch/guion_video_30s.md):
// 1. Lee los subtítulos de la sección 5 del guion y los escribe en docs/pitch/video_30s.srt. Cada subtítulo es una
//    toma: su inicio y su fin dan la duración de la toma. Revisa que el texto no traiga dígitos, que tenga 10 palabras
//    o menos y que no diga «first», «only» ni «save…» (CLAUDE.md, reglas 3 y 10).
// 2. Levanta un servidor estático de web/ (el mismo patrón de web_smoke.mjs) o usa RAIZ_URL.
// 3. Abre la página a 1366 × 768, deviceScaleFactor 1, SIN movimiento reducido (si no, no hay gotas ni reproducción),
//    con la pantalla de inicio cerrada, y graba con recordVideo. Sigue las tomas de la sección 3 del guion con los
//    selectores de la sección 6. Un puntero dibujado por este script (no por la página) muestra dónde se hace clic.
// 4. Cada toma tiene una preparación fuera de cámara (cambiar de zona, desplazar el panel) y una acción en cámara. El
//    script anota cuándo empieza cada acción y, al exportar, recorta de la grabación un tramo de la duración exacta de la
//    toma. Así la edición no depende de lo que tarde la máquina en preparar cada toma. Dentro de una toma, el ritmo se
//    fija con fracciones de su duración (reloj.hasta), y la toma 1 recorre su tramo si la página tarda en dibujar el año
//    destacado (con WebGL por software la vista 3D dibuja pocos cuadros por segundo).
// 5. ffmpeg une los tramos, escala la página a 1708 × 960 dentro de un cuadro de 1920 × 1080 y pone los subtítulos en
//    la banda inferior (no tapan ninguna cifra de la página); en la toma 1, arriba del subtítulo, el rótulo del equipo y
//    del reto (ROTULO_TOMA1). Sale MP4 H.264 yuv420p con una pista de audio en silencio, sin música (algunas redes
//    rechazan un video sin audio). Revisa con ffprobe que dure de 28 a 29 s (guía de envío: más de 30 s deja fuera el
//    proyecto) y avisa si pasa de 10 MB.
// 6. Extrae un fotograma de cada toma (al 80 % de la toma) en RAIZ_FOTOGRAMAS para revisarlo a ojo.
//
// Variantes del guion: si la página trae la vista 3D y la línea de tiempo, graba las tomas 1 y 2 «[SI ESTÁ CONECTADO]»;
// si no, las de la sección 7. La toma 4 usa la parcela «libre» que la página marque «story field»: P0632 o, mientras
// siga marcada, P0244 (con su subtítulo de la sección 5). Las tarjetas se localizan por su estructura
// (.tarjeta[data-opcion="ACTUAL"], #t-opciones, #seccion-gota), nunca por su texto.
// No se escribe ninguna cifra: las que se ven las dibuja la página con sus datos.

import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { LLAVE_INICIO } from "../../web/js/acerca.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "..", "..");
const WEB = path.join(RAIZ, "web");
const GUION = path.join(RAIZ, "docs", "pitch", "guion_video_30s.md");
const SRT = path.join(RAIZ, "docs", "pitch", "video_30s.srt");
const MP4 = path.join(RAIZ, "docs", "pitch", "video_30s.mp4");
const TEMPORAL = fs.mkdtempSync(path.join(os.tmpdir(), "raiz-video-"));
const FOTOGRAMAS = process.env.RAIZ_FOTOGRAMAS ? path.resolve(process.env.RAIZ_FOTOGRAMAS) : path.join(TEMPORAL, "fotogramas");
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE ?? "ffprobe";

// Protagonistas del guion (sección 3). La «libre» de la toma 4 se elige con la página (ver elegirLibre).
const ALFALFA = "P0757";
const NOGAL = "L0175";
const LIBRES = ["P0632", "P0244"]; // en este orden de preferencia: P0632 es la de la decisión del 14-nov

// Formato de la grabación y del video final.
const VIEWPORT = { width: 1366, height: 768 };
const LIENZO = { ancho: 1920, alto: 1080 }; // 16:9, apto para YouTube y redes
const PAGINA = { ancho: 1708, alto: 960 }; // la página escalada (×1.25); lo que sobra abajo es la banda de subtítulos
const BANDA = LIENZO.alto - PAGINA.alto;
const FONDO = "0x14202E"; // color del marco y de la banda (texto blanco encima: contraste alto)
const FPS = 25;
const DURACION_MAX_S = 30.0; // regla del kit (C7) y de la guía de envío: más de 30 s deja fuera el proyecto
const DURACION_OBJETIVO_S = [28.0, 29.0]; // margen pedido por el coordinador (guía de envío de Space Apps)
const TAMANO_OBJETIVO_MB = 10;
// Rótulo de la toma 1, en la banda y arriba del subtítulo (guía de envío: quiénes somos y el reto). Sin dígitos.
const ROTULO_TOMA1 = "Orbital Farming · Field Shift: Adapting Farms with NASA Data";

// Ritmo del puntero y de los desplazamientos (ms).
const MOVER_MS = 380;
const DESPLAZAR_MS = 600;

// ---------------------------------------------------------------- registro de resultados
const resultados = [];
function check(nombre, cond, detalle = "") {
  resultados.push({ nombre, ok: Boolean(cond), detalle });
  console.log(`${cond ? "PASA" : "FALLA"}  ${nombre}${detalle ? ` — ${detalle}` : ""}`);
}
const aviso = (texto) => console.log(`AVISO  ${texto}`);

// ---------------------------------------------------------------- 1. subtítulos desde el guion
/** "00:00:03,500" -> 3.5 */
const aSegundos = (t) => {
  const [h, m, s] = t.replace(",", ".").split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
};
/** 3.5 -> "00:00:03,500" */
const aTiempoSrt = (s) => {
  const ms = Math.round(s * 1000);
  const p = (n, d = 2) => String(n).padStart(d, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

/** Subtítulos del bloque ```text de la sección 5 del guion, y el texto alterno de la toma 4 (P0244). */
function leerGuion() {
  const md = fs.readFileSync(GUION, "utf-8");
  const seccion = md.split(/^## /m).find((s) => /^5\.\s/.test(s));
  if (!seccion) throw new Error("el guion no tiene la sección «5. Subtítulos»");
  const bloque = seccion.match(/```text\n([\s\S]*?)```/);
  if (!bloque) throw new Error("la sección 5 del guion no trae el bloque ```text con el .srt");
  const cues = bloque[1]
    .trim()
    .split(/\n\s*\n/)
    .map((b) => {
      const [n, tiempos, ...texto] = b.trim().split("\n");
      const [ini, fin] = tiempos.split("-->").map((t) => aSegundos(t.trim()));
      return { n: Number(n), ini, fin, texto: texto.join(" ").trim() };
    });
  // «[MIENTRAS SIGA P0244]** su texto es `…`»
  const alterno = seccion.match(/MIENTRAS SIGA P0244\]\*\*[^`]*`([^`]+)`/)?.[1] ?? null;
  return { cues, alterno };
}

const PROHIBIDAS = /\b(first|only|sav(e|es|ed|ing|ings))\b/i;
function revisarSubtitulos(cues) {
  const tomas = cues.length;
  check("guion: ocho subtítulos, uno por toma, seguidos y sin huecos", tomas === 8 && cues.every((c, i) => i === 0 || Math.abs(c.ini - cues[i - 1].fin) < 1e-6), `${tomas} subtítulos`);
  const total = cues[cues.length - 1].fin - cues[0].ini;
  check(`guion: duración total ${total.toFixed(1)} s ≤ ${DURACION_MAX_S} s`, total <= DURACION_MAX_S);
  for (const c of cues) {
    const palabras = c.texto.split(/\s+/).filter((w) => w && w !== "–").length;
    const problemas = [
      /\d/.test(c.texto) ? "trae dígitos" : "",
      palabras > 10 ? `${palabras} palabras` : "",
      PROHIBIDAS.test(c.texto) ? "palabra prohibida (regla 10)" : "",
    ].filter(Boolean);
    check(`subtítulo ${c.n}: sin dígitos, 10 palabras o menos, sin «first»/«only»/«save»`, !problemas.length, problemas.join(", ") || c.texto);
  }
  if (ROTULO_TOMA1) check("rótulo de la toma 1: sin dígitos ni palabras prohibidas", !/\d/.test(ROTULO_TOMA1) && !PROHIBIDAS.test(ROTULO_TOMA1), ROTULO_TOMA1);
}

function escribirSrt(cues) {
  const texto = cues.map((c) => `${c.n}\n${aTiempoSrt(c.ini)} --> ${aTiempoSrt(c.fin)}\n${c.texto}\n`).join("\n");
  fs.writeFileSync(SRT, texto, "utf-8");
  console.log(`Subtítulos: ${SRT}`);
}

// ---------------------------------------------------------------- 2. servidor estático (patrón de web_smoke.mjs)
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

// ---------------------------------------------------------------- 3. ayudas dentro de la página
/**
 * Puntero de la grabación y desplazamiento suave. El puntero es un elemento «popover» para quedar en la capa superior,
 * también encima del diálogo modal «About & Data» (se vuelve a subir después de abrirlo). No recibe clics.
 */
async function instalarAyudas(page) {
  await page.evaluate(() => {
    if (document.getElementById("grabacion-puntero")) return;
    const estilo = document.createElement("style");
    estilo.textContent = `
      #grabacion-puntero { position: fixed; inset: auto; left: 0; top: 0; margin: 0; padding: 0; border: 0;
        background: transparent; overflow: visible; width: 30px; height: 30px; pointer-events: none;
        transform: translate(var(--x, 683px), var(--y, 500px)); transition: transform var(--t, 380ms) cubic-bezier(.3,.7,.3,1); }
      #grabacion-puntero svg { position: absolute; left: 0; top: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,.45)); }
      #grabacion-puntero .onda { position: absolute; left: -16px; top: -16px; width: 32px; height: 32px; border-radius: 50%;
        border: 3px solid #F2B705; opacity: 0; transform: scale(.3); }
      #grabacion-puntero.pulsa .onda { animation: grabacion-onda 420ms ease-out; }
      @keyframes grabacion-onda { 0% { opacity: 1; transform: scale(.3); } 100% { opacity: 0; transform: scale(1.4); } }`;
    document.head.append(estilo);
    const p = document.createElement("div");
    p.id = "grabacion-puntero";
    p.setAttribute("popover", "manual");
    p.setAttribute("aria-hidden", "true");
    p.innerHTML =
      '<span class="onda"></span>' +
      '<svg width="26" height="30" viewBox="0 0 26 30"><path d="M2 2 L2 24 L8 18.5 L12.5 28 L16.5 26.2 L12 17 L20 17 Z" ' +
      'fill="#111" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>';
    document.body.append(p);
    p.showPopover();
    // Desplazamiento suave con duración fija (el «smooth» del navegador no deja elegir la duración).
    window.__grabacionDesplazar = (el, destino, ms) =>
      new Promise((ok) => {
        const desde = el.scrollTop;
        const hasta = Math.max(0, Math.min(destino, el.scrollHeight - el.clientHeight));
        const t0 = performance.now();
        const paso = (t) => {
          const f = Math.min(1, (t - t0) / ms);
          const e = f < 0.5 ? 4 * f * f * f : 1 - (-2 * f + 2) ** 3 / 2;
          el.scrollTop = desde + (hasta - desde) * e;
          if (f < 1) requestAnimationFrame(paso);
          else ok(el.scrollTop);
        };
        requestAnimationFrame(paso);
      });
  });
}

/** Vuelve a poner el puntero arriba de todo (después de abrir un diálogo modal). */
const subirPuntero = (page) =>
  page.evaluate(() => {
    const p = document.getElementById("grabacion-puntero");
    if (p.matches(":popover-open")) p.hidePopover();
    p.showPopover();
  });

/** Mueve el puntero al centro de un elemento (sin clic). Devuelve ese punto. */
async function apuntar(page, locator, ms = MOVER_MS) {
  const caja = await locator.boundingBox();
  if (!caja) throw new Error(`no se ve el elemento al que se apunta: ${locator}`);
  const punto = { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 };
  await page.evaluate(
    ({ x, y, ms }) => {
      const p = document.getElementById("grabacion-puntero");
      p.style.setProperty("--t", `${ms}ms`);
      p.style.setProperty("--x", `${x}px`);
      p.style.setProperty("--y", `${y}px`);
    },
    { ...punto, ms },
  );
  await page.waitForTimeout(ms);
  return punto;
}

/**
 * Apunta y hace clic (con la onda del puntero). El clic es del ratón en ese punto (page.mouse), no locator.click():
 * con la vista 3D y WebGL por software la página dibuja pocos cuadros por segundo y locator.click() espera cuadros
 * antes de cada clic. Con el ratón (y no con element.click()) la página no dibuja el anillo de foco del teclado.
 */
async function clic(page, locator, ms = MOVER_MS) {
  const { x, y } = await apuntar(page, locator, ms);
  await page.evaluate(() => {
    const p = document.getElementById("grabacion-puntero");
    p.classList.remove("pulsa");
    void p.offsetWidth;
    p.classList.add("pulsa");
  });
  await page.mouse.click(x, y);
}

/** Lleva el puntero a un punto sin cifras (p. ej., junto a «Close» en la cabecera de la ficha). */
async function aparcar(page, locator, { dx = 0, dy = 0, ms = 250 } = {}) {
  const caja = await locator.boundingBox();
  if (!caja) return;
  await page.evaluate(
    ({ x, y, ms }) => {
      const p = document.getElementById("grabacion-puntero");
      p.style.setProperty("--t", `${ms}ms`);
      p.style.setProperty("--x", `${x}px`);
      p.style.setProperty("--y", `${y}px`);
    },
    { x: caja.x + dx, y: caja.y + caja.height / 2 + dy, ms },
  );
  await page.waitForTimeout(ms);
}
/** Lugar del puntero mientras se ve una ficha: a la izquierda de «Close», en la cabecera vacía. */
const aparcarEnFicha = (page, ms) => aparcar(page, page.locator("#ficha-cerrar"), { dx: -90, ms });

/** Desplaza un contenedor hasta que `objetivo` quede `margen` px bajo su borde superior (o bajo su cabecera fija). */
async function desplazarA(page, contenedor, objetivo, { margen = 10, cabecera = null, ms = DESPLAZAR_MS, alinear = "arriba" } = {}) {
  return page.evaluate(
    ({ contenedor, objetivo, margen, cabecera, ms, alinear }) => {
      const c = document.querySelector(contenedor);
      const o = document.querySelector(objetivo);
      if (!c || !o) return null;
      const alto = cabecera ? c.querySelector(cabecera)?.getBoundingClientRect().height ?? 0 : 0;
      const rc = c.getBoundingClientRect();
      const ro = o.getBoundingClientRect();
      const arriba = c.scrollTop + ro.top - rc.top - alto - margen;
      // «abajo»: el borde inferior del objetivo al borde inferior del contenedor, sin pasar de «arriba».
      const destino = alinear === "abajo" ? Math.min(arriba, c.scrollTop + ro.bottom - rc.bottom + margen) : arriba;
      return ms > 0 ? window.__grabacionDesplazar(c, destino, ms) : ((c.scrollTop = destino), destino);
    },
    { contenedor, objetivo, margen, cabecera, ms, alinear },
  );
}

/** Espera a que el mapa quede quieto (gancho de la página para las pruebas; si no está, una pausa). */
async function mapaQuieto(page) {
  const ok = await page.evaluate(() => window.raizDepuracion?.esperarMapa?.() ?? null).catch(() => null);
  if (ok == null) await page.waitForTimeout(1500);
  await page.waitForTimeout(250);
}

async function elegirZona(page, valor) {
  const sel = page.locator("#zona-sel");
  if (!(await sel.isVisible().catch(() => false))) return false;
  if ((await sel.inputValue()) === valor) return true;
  await sel.selectOption(valor);
  await mapaQuieto(page);
  return true;
}

async function cerrarFichaSiAbierta(page) {
  if (await page.locator("#ficha").isVisible()) await page.locator("#ficha-cerrar").click();
}

/** Fija el año de la línea de tiempo (como lo haría el deslizador). */
const fijarAnio = (page, anio) =>
  page.locator("#linea-tiempo .tiempo-rango").evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, anio);

// ---------------------------------------------------------------- 4. tomas
/**
 * Estado de la página que decide las variantes del guion: vista 3D y línea de tiempo conectadas, año destacado,
 * zona inicial y parcelas marcadas «story field».
 */
async function leerVariantes(page) {
  return page.evaluate(() => {
    const rango = document.querySelector("#linea-tiempo .tiempo-rango");
    const destacado = document.querySelector("#linea-tiempo .tiempo-destacado[data-anio]")?.dataset.anio;
    const historia = [...document.querySelectorAll(".boton-parcela[data-id]")]
      .filter((b) => b.querySelector(".insignia-historia"))
      .map((b) => b.dataset.id);
    return {
      boton3d: Boolean(document.querySelector("#boton-gemelo")),
      linea: Boolean(rango && document.querySelector("#linea-tiempo .tiempo-boton")),
      anioMin: rango ? Number(rango.min) : null,
      anioMax: rango ? Number(rango.max) : null,
      destacado: destacado ? Number(destacado) : null,
      zona: document.querySelector("#zona-sel")?.value ?? "",
      hayZonas: Boolean(document.querySelector("#selector-zona:not([hidden])")),
      historia,
    };
  });
}

function elegirLibre(variantes, cues, alterno) {
  const libre = LIBRES.find((id) => variantes.historia.includes(id)) ?? LIBRES[0];
  if (!variantes.historia.includes(libre)) aviso(`ninguna de ${LIBRES.join(", ")} lleva «story field»: la toma 4 abre ${libre} por su data-id`);
  if (libre === "P0244") {
    if (!alterno) throw new Error("la página marca P0244, pero el guion no trae su subtítulo alterno");
    cues[3] = { ...cues[3], texto: alterno };
  }
  return libre;
}

/** Abre la ficha de una parcela desde la lista «Fields» (la preparación ya dejó la lista a la vista). */
async function abrirDesdeLista(page, id) {
  const boton = page.locator(`.boton-parcela[data-id="${id}"]`);
  await boton.evaluate((el) => el.scrollIntoView({ block: "nearest" }));
  await clic(page, boton, 300);
  await page.waitForSelector("#ficha:not([hidden])");
  await aparcarEnFicha(page, 250); // también deja pasar la entrada de la ficha
}

/** Cerrar la ficha con el botón «Close», a la vista. */
async function cerrarFicha(page) {
  if (await page.locator("#ficha").isVisible()) {
    await clic(page, page.locator("#ficha-cerrar"), 220);
    await page.locator("#ficha").waitFor({ state: "hidden" });
  }
}

/** Lleva a la vista la sección «Fields» del panel, con la lista arriba de todo y la búsqueda vacía. */
async function prepararLista(page) {
  await page.locator("#buscar-parcela").fill("");
  await page.evaluate(() => {
    const l = document.querySelector("#lista-parcelas");
    if (l) l.scrollTop = 0;
  });
  await desplazarA(page, ".panel", "#t-campos", { margen: 14, ms: 0 });
}

/**
 * Las ocho tomas de la sección 3. Cada una: { prep } fuera de cámara y { accion } en cámara. La duración de cada toma
 * la dan los subtítulos.
 */
function tomas(ctx) {
  const { variantes, libre } = ctx;
  const conectado = variantes.boton3d && variantes.linea && variantes.destacado != null && variantes.hayZonas;
  ctx.conectado = conectado;
  const zona3d = variantes.zona; // la zona con la que abre la página (gemelo.json → zona_inicial)
  // Ver la ficha: primero la cabecera (plazo y memoria), después las tarjetas de opciones.
  const verTarjetas = (page, ms) => desplazarA(page, "#ficha", "#t-opciones", { cabecera: ".ficha-cabeza", margen: 8, ms });

  return [
    // Toma 1 · 2025
    conectado
      ? {
          nombre: "2025: vista 3D y línea de tiempo hasta el año destacado",
          async prep(page) {
            await elegirZona(page, zona3d);
            const b = page.locator("#boton-gemelo");
            if ((await b.getAttribute("aria-pressed")) !== "true") await b.click();
            await page.waitForFunction(() => window.raizDepuracion?.gemelo3d?.()?.relieveCargado, null, { timeout: 30000 }).catch(() => aviso("el relieve 3D no terminó de cargar"));
            await mapaQuieto(page);
            await desplazarA(page, ".panel", "#bloque-tiempo", { margen: 0, ms: 0 });
            // Dos años antes del destacado: «Play» avanza uno de inmediato y otro tras gemelo.json → tiempo.intervalo_ms.
            await fijarAnio(page, Math.max(variantes.anioMin, variantes.destacado - 2));
            await mapaQuieto(page);
          },
          async accion(page) {
            // «Pause» al llegar al año destacado, desde la página: un observador del año pulsa el botón en cuanto cambia
            // (si se esperara desde aquí, con pocos cuadros por segundo la reproducción podría pasarse de año).
            await page.evaluate((anio) => {
              const nodo = document.querySelector("#linea-tiempo .tiempo");
              const obs = new MutationObserver(() => {
                if (nodo.dataset.anio !== String(anio)) return;
                obs.disconnect();
                const p = document.getElementById("grabacion-puntero");
                p.classList.remove("pulsa");
                void p.offsetWidth;
                p.classList.add("pulsa");
                nodo.querySelector(".tiempo-boton").click();
                window.__grabacionAncla = Date.now(); // cuándo quedó en pausa en el año destacado
              });
              obs.observe(nodo, { attributes: true, attributeFilter: ["data-anio"] });
            }, variantes.destacado);
            await clic(page, page.locator("#linea-tiempo .tiempo-boton"), 300);
            await page.waitForFunction(() => window.__grabacionAncla, null, { timeout: 10000, polling: 100 });
            // La nota del año destacado debe verse al menos 1.8 s: si la página tardó en dibujar (WebGL por software),
            // el tramo de esta toma se recorre hacia adelante (se pierde el principio, no la nota).
            return { verHasta: (await page.evaluate(() => window.__grabacionAncla)) + 1800 };
          },
        }
      : {
          nombre: "2025 (sin el gemelo): «Like 2025» y la capa «Field memory: 2025»",
          async prep(page) {
            await elegirZona(page, "");
            await desplazarA(page, ".panel", "#t-colorear", { margen: 14, ms: 0 });
          },
          async accion(page) {
            await clic(page, page.locator('.boton-marca[data-marca="como_2025"]'));
            await page.waitForTimeout(500);
            await clic(page, page.locator('input[name="colorear"][value="memoria_2025"]'));
          },
        },
    // Toma 2 · 2025
    conectado
      ? {
          nombre: "2025: «Like 2025», columnas en rojo e indicador",
          async prep() {},
          async accion(page) {
            const boton = page.locator('.boton-marca[data-marca="como_2025"]');
            await clic(page, boton);
            await aparcar(page, boton, { dx: 20, dy: 36, ms: 300 }); // que se lea el rótulo de la marca
          },
        }
      : {
          nombre: "2025 (sin el gemelo): «Enough water?» e indicador",
          async prep() {},
          async accion(page) {
            await clic(page, page.locator('input[name="colorear"][value="semaforo"]'));
          },
        },
    // Toma 3 · El compromiso: P0757
    {
      nombre: `El compromiso: ${ALFALFA} (plazo por vencer, memoria y tarjeta actual)`,
      async prep(page) {
        // Corte de edición: «All areas»; la línea de tiempo vuelve al año actual (el mapa, al semáforo de agua).
        if (await page.locator("#boton-gemelo[aria-pressed='true']").count()) await page.locator("#boton-gemelo").click();
        await elegirZona(page, "");
        if (variantes.linea) await fijarAnio(page, variantes.anioMax);
        await mapaQuieto(page);
        await prepararLista(page);
      },
      // La cabecera (plazo y memoria) se ve hasta la mitad de la toma; después, las tarjetas.
      async accion(page, reloj) {
        await clic(page, page.locator('.boton-marca[data-marca="como_2026"]'), 300);
        await page.waitForTimeout(150);
        await abrirDesdeLista(page, ALFALFA);
        await reloj.hasta(0.5);
        await verTarjetas(page, 600);
      },
    },
    // Toma 4 · El compromiso: la parcela libre
    {
      nombre: `El compromiso: ${libre} (plazo libre)`,
      async prep() {},
      async accion(page, reloj) {
        await cerrarFicha(page);
        await abrirDesdeLista(page, libre);
        await reloj.hasta(0.5);
        await verTarjetas(page, 400);
      },
    },
    // Toma 5 · El compromiso: L0175
    {
      nombre: `El compromiso: ${NOGAL} (nogal comprometido)`,
      async prep() {},
      async accion(page, reloj) {
        await cerrarFicha(page);
        await abrirDesdeLista(page, NOGAL);
        await reloj.hasta(0.5);
        await verTarjetas(page, 400);
      },
    },
    // Toma 6 · La gota (misma ficha). El diagrama completo a la vista: las gotas salen solas una vez.
    {
      nombre: "La gota: «Follow the drop» de L0175",
      async prep() {},
      async accion(page) {
        await page.waitForTimeout(150);
        await desplazarA(page, "#ficha", "#seccion-gota .gota-mod-diagrama", { cabecera: ".ficha-cabeza", margen: 8, ms: 800, alinear: "abajo" });
      },
    },
    // Toma 7 · Las pruebas
    {
      nombre: "Las pruebas: «About & Data» → «Tests in sight»",
      async prep() {},
      async accion(page, reloj) {
        await cerrarFicha(page);
        await clic(page, page.locator("#boton-acerca"), 280);
        await page.locator("#acerca h3", { hasText: "Tests in sight" }).waitFor({ timeout: 10000 });
        await subirPuntero(page);
        // El puntero espera junto a «Close» del diálogo, en la franja vacía de su cabecera.
        await aparcar(page, page.locator("#acerca-cerrar"), { dx: -90, ms: 200 });
        const h3 = await page.locator("#acerca h3", { hasText: "Tests in sight" }).getAttribute("id");
        await desplazarA(page, "#acerca", `#${CSS_escape(h3)}`, { cabecera: ".dialogo-acerca-cabeza", margen: 6, ms: 450 });
        await reloj.hasta(0.55);
        // Un poco más abajo, despacio: el estado de las pruebas que siguen.
        await page.evaluate(() => {
          const d = document.querySelector("#acerca");
          return window.__grabacionDesplazar(d, d.scrollTop + d.clientHeight * 0.4, 900);
        });
      },
    },
    // Toma 8 · Cierre: cabecera y aviso
    {
      nombre: "Cierre: cabecera y aviso «supports, never replaces»",
      async prep(page) {
        // Detrás del diálogo (no se ve): el panel queda con el aviso a la vista.
        await page.evaluate(() => {
          const panel = document.querySelector(".panel");
          const a = document.querySelector(".panel .aviso-juicio");
          if (!panel || !a) return;
          const rc = panel.getBoundingClientRect();
          const ra = a.getBoundingClientRect();
          panel.scrollTop += ra.top - rc.top - (panel.clientHeight - ra.height) / 2;
        });
      },
      async accion(page) {
        await clic(page, page.locator("#acerca-cerrar"), 220);
        await page.waitForTimeout(200);
        // El puntero señala el aviso desde su borde izquierdo, sin tapar el texto.
        await aparcar(page, page.locator(".panel .aviso-juicio"), { dx: -6, ms: 400 });
      },
    },
  ];
}

/** CSS.escape para Node (los id de la página son simples; esto basta). */
const CSS_escape = (s) => String(s).replace(/([^\w-])/g, "\\$1");

// ---------------------------------------------------------------- 5. exportar con ffmpeg
// ffmpeg corre desde la carpeta temporal: los filtros nombran sus archivos (.ass, textos) sin ruta, y así no hay que
// escapar dos puntos ni diagonales de la ruta dentro del grafo de filtros (Windows, macOS, Linux).
function correr(programa, args) {
  return execFileSync(programa, args, { cwd: TEMPORAL, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
}
function tieneFiltro(nombre) {
  try {
    return new RegExp(`^\\s*\\S+\\s+${nombre}\\s`, "m").test(correr(FFMPEG, ["-hide_banner", "-filters"]));
  } catch {
    return false;
  }
}
function duracion(archivo) {
  return Number(correr(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", archivo]).trim());
}

/**
 * Subtítulos .ass con el tamaño del lienzo (PlayRes = 1920×1080): letra de 46 px, centrada en la banda inferior. En la
 * toma 1, el rótulo del equipo y del reto va arriba de la banda (letra de 28 px) y el subtítulo baja.
 */
const TAM_SUBTITULO = 46;
const TAM_ROTULO = 28;
function escribirAss(cues, archivo) {
  const tam = TAM_SUBTITULO;
  const margenV = Math.round((BANDA - tam * 1.2) / 2);
  const margenConRotulo = 12;
  const t = (s) => {
    const cs = Math.round(s * 100);
    return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2, "0")}:${String(Math.floor(cs / 100) % 60).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
  };
  const ass = [
    "[Script Info]",
    "; AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 (generado por tests/e2e/grabar_video.mjs)",
    "ScriptType: v4.00+",
    `PlayResX: ${LIENZO.ancho}`,
    `PlayResY: ${LIENZO.alto}`,
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Banda,Inter,${tam},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,0,0,2,60,60,${margenV},1`,
    // Rótulo: alineado arriba (8), a 10 px del borde superior de la banda; azul claro sobre el fondo oscuro.
    `Style: Rotulo,Inter,${TAM_ROTULO},&H00F0DCBF,&H00F0DCBF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,8,60,60,${PAGINA.alto + 10},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
    ...cues.map((c, i) => `Dialogue: 0,${t(c.ini)},${t(c.fin)},Banda,,0,0,${i === 0 && ROTULO_TOMA1 ? margenConRotulo : 0},,${c.texto.replace(/[{}]/g, "")}`),
    ...(ROTULO_TOMA1 ? [`Dialogue: 0,${t(cues[0].ini)},${t(cues[0].fin)},Rotulo,,0,0,0,,${ROTULO_TOMA1}`] : []),
    "",
  ].join("\n");
  fs.writeFileSync(archivo, ass, "utf-8");
}

function filtroSubtitulos(cues) {
  if (tieneFiltro("ass")) {
    escribirAss(cues, path.join(TEMPORAL, "subtitulos.ass"));
    return { filtro: "ass=subtitulos.ass", modo: "libass" };
  }
  if (tieneFiltro("drawtext")) {
    // Sin libass: un drawtext por subtítulo, centrado en la banda (el texto va en un archivo: sin escapes).
    const partes = cues.map((c, i) => {
      fs.writeFileSync(path.join(TEMPORAL, `subtitulo_${c.n}.txt`), c.texto, "utf-8");
      const y = i === 0 && ROTULO_TOMA1 ? `${LIENZO.alto}-12-text_h` : `${PAGINA.alto}+(${BANDA}-text_h)/2`;
      return `drawtext=font=Inter:textfile=subtitulo_${c.n}.txt:fontcolor=white:fontsize=${TAM_SUBTITULO}:x=(w-text_w)/2:y=${y}:enable='between(t,${c.ini},${c.fin})'`;
    });
    if (ROTULO_TOMA1) {
      fs.writeFileSync(path.join(TEMPORAL, "rotulo.txt"), ROTULO_TOMA1, "utf-8");
      partes.push(`drawtext=font=Inter:textfile=rotulo.txt:fontcolor=0xBFDCF0:fontsize=${TAM_ROTULO}:x=(w-text_w)/2:y=${PAGINA.alto + 10}:enable='between(t,${cues[0].ini},${cues[0].fin})'`);
    }
    return { filtro: partes.join(","), modo: "drawtext" };
  }
  return null;
}

/** Une los tramos, escala, enmarca y pone subtítulos. Devuelve el tamaño en MB. */
function exportar(webm, tramos, cues, crf) {
  const subt = filtroSubtitulos(cues);
  if (!subt) throw new Error("ffmpeg no trae ni libass (ass/subtitles) ni drawtext: no se pueden incrustar los subtítulos");
  const n = tramos.length;
  const x = Math.round((LIENZO.ancho - PAGINA.ancho) / 2);
  const grafo = [
    `[0:v]split=${n}${tramos.map((_, i) => `[e${i}]`).join("")}`,
    ...tramos.map((t, i) => `[e${i}]trim=start=${t.inicio.toFixed(3)}:duration=${t.duracion.toFixed(3)},setpts=PTS-STARTPTS[s${i}]`),
    `${tramos.map((_, i) => `[s${i}]`).join("")}concat=n=${n}:v=1:a=0,fps=${FPS},` +
      `scale=${PAGINA.ancho}:${PAGINA.alto}:flags=lanczos,setsar=1,pad=${LIENZO.ancho}:${LIENZO.alto}:${x}:0:color=${FONDO},` +
      `${subt.filtro},format=yuv420p[v]`,
  ].join(";");
  const total = cues[cues.length - 1].fin;
  correr(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", webm,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-filter_complex", grafo,
    "-map", "[v]", "-map", "1:a",
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-r", String(FPS), "-g", String(FPS * 2),
    "-c:a", "aac", "-b:a", "64k",
    "-t", total.toFixed(3), "-movflags", "+faststart",
    MP4,
  ]);
  console.log(`Subtítulos incrustados con ${subt.modo}; CRF ${crf}.`);
  return fs.statSync(MP4).size / 1e6;
}

function extraerFotogramas(cues) {
  fs.mkdirSync(FOTOGRAMAS, { recursive: true });
  const rutas = [];
  for (const c of cues) {
    const t = c.ini + (c.fin - c.ini) * 0.8;
    const ruta = path.join(FOTOGRAMAS, `toma_${c.n}.png`);
    correr(FFMPEG, ["-hide_banner", "-loglevel", "error", "-y", "-ss", t.toFixed(2), "-i", MP4, "-frames:v", "1", ruta]);
    rutas.push(ruta);
  }
  return rutas;
}

// Regla 3: si un subtítulo dice en palabra cuántas pruebas hay («Five tests…»), debe coincidir con las que
// publica web/data/pruebas.json. Así el video no queda desactualizado en silencio si cambia ese número.
const NUMEROS_EN_PALABRA = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
async function revisarCantidadDePruebas(page, cues) {
  const total = await page.evaluate(async () => {
    const r = await fetch("data/pruebas.json");
    const d = await r.json();
    return Array.isArray(d?.pruebas) ? d.pruebas.length : null;
  });
  for (const c of cues) {
    const m = /^(\w+) tests\b/i.exec(c.texto);
    if (!m) continue;
    const dicho = NUMEROS_EN_PALABRA.indexOf(m[1].toLowerCase());
    check(`subtítulo ${c.n}: la cantidad de pruebas dicha coincide con pruebas.json`, dicho === total,
      `dice «${m[1]}» y pruebas.json trae ${total}`);
  }
}

// ---------------------------------------------------------------- principal
async function main() {
  const { cues, alterno } = leerGuion();
  revisarSubtitulos(cues);
  for (const prog of [FFMPEG, FFPROBE]) {
    try {
      correr(prog, ["-version"]);
    } catch {
      check(`${prog} disponible`, false, "instale ffmpeg o indique FFMPEG/FFPROBE");
      return terminar();
    }
  }

  const srv = process.env.RAIZ_URL ? null : await servidor();
  const url = process.env.RAIZ_URL ?? `http://127.0.0.1:${srv.address().port}/index.html`;
  console.log(`Página: ${url}`);
  // El navegador se lanza dentro del try: si falla el arranque, el finally cierra el servidor y el proceso termina.
  let navegador = null;
  let webm = null;
  const tramos = [];
  let ctxDatos = null;
  try {
    navegador = await chromium.launch();
    const ctx = await navegador.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 1,
      reducedMotion: "no-preference", // SIN movimiento reducido (guion §6): gotas y reproducción
      serviceWorkers: "block", // la página de hoy, no una copia guardada por el worker
      recordVideo: { dir: TEMPORAL, size: VIEWPORT },
    });
    await ctx.addInitScript((llave) => {
      try {
        window.sessionStorage.setItem(llave, "cerrado"); // pantalla de inicio cerrada (guion §6)
      } catch {
        // sin almacenamiento: la pantalla aparecería
      }
    }, LLAVE_INICIO);
    const t0 = Date.now(); // la grabación empieza al crear la página
    const page = await ctx.newPage();
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));
    await page.goto(url, { waitUntil: "load" });
    await page.waitForSelector("body[data-listo='si']", { timeout: 30000 });
    await page.waitForFunction(() => ["listo", "sin-mapa"].includes(document.body.dataset.mapa), null, { timeout: 30000 });
    await page.waitForFunction(() => Boolean(document.body.dataset.relieve), null, { timeout: 15000 }).catch(() => {});
    await mapaQuieto(page);
    await instalarAyudas(page);

    const variantes = await leerVariantes(page);
    const libre = elegirLibre(variantes, cues, alterno);
    // El subtítulo alterno de la toma 4 entra aquí: se vuelve a revisar todo (sin dígitos, largo y regla 10)
    // y que la cantidad de pruebas dicha en palabra sea la de la página (regla 3: la cifra sale de los datos).
    revisarSubtitulos(cues);
    await revisarCantidadDePruebas(page, cues);
    ctxDatos = { variantes, libre };
    const lista = tomas(ctxDatos);
    console.log(`Variantes: ${ctxDatos.conectado ? "gemelo conectado (vista 3D y línea de tiempo)" : "sin el gemelo (sección 7)"} · toma 4 con ${libre} · story fields: ${variantes.historia.join(", ")}`);
    if (await page.locator("#mapa-aviso:not([hidden])").count()) aviso(`aviso del mapa: «${(await page.locator("#mapa-aviso").innerText()).trim()}» (sin red, el guion pide grabar todas las tomas así)`);
    escribirSrt(cues);

    for (const [i, toma] of lista.entries()) {
      const c = cues[i];
      const dur = c.fin - c.ini;
      await toma.prep(page);
      await page.waitForTimeout(120);
      // Reloj de la toma: hasta(f) espera a que pase la fracción f de su duración (el ritmo no depende de la máquina).
      const inicio = Date.now();
      const reloj = {
        hasta: async (f) => {
          const falta = inicio + f * dur * 1000 - Date.now();
          if (falta > 0) await page.waitForTimeout(falta);
        },
      };
      const r = (await toma.accion(page, reloj)) ?? {};
      const usado = (Date.now() - inicio) / 1000;
      // Una toma puede pedir que su tramo llegue hasta cierto momento (verHasta): entonces el tramo se recorre.
      let desde = inicio;
      if (r.verHasta && r.verHasta > inicio + dur * 1000) {
        desde = r.verHasta - dur * 1000;
        aviso(`la toma ${c.n} empieza ${((desde - inicio) / 1000).toFixed(2)} s después de su acción para que se vea lo que importa (página lenta)`);
      } else if (usado > dur) {
        aviso(`la toma ${c.n} tardó ${usado.toFixed(2)} s en su acción y dura ${dur.toFixed(2)} s: el final de la acción queda fuera`);
      }
      const fin = desde + dur * 1000 + 150;
      if (fin > Date.now()) await page.waitForTimeout(fin - Date.now());
      tramos.push({ inicio: (desde - t0) / 1000, duracion: dur });
      console.log(`toma ${c.n} · ${toma.nombre} · empieza en ${((desde - t0) / 1000).toFixed(2)} s de la grabación · acción ${usado.toFixed(2)} s de ${dur.toFixed(2)} s`);
    }
    check("la página grabó sin errores de JavaScript", errores.length === 0, errores.slice(0, 3).join(" | "));
    await page.waitForTimeout(300);
    const cierre = (Date.now() - t0) / 1000;
    await ctx.close(); // aquí Playwright termina de escribir el .webm
    webm = await page.video().path();
    // La grabación empieza un poco después de t0 (al montarse la página): ese desfase se resta a cada tramo, para que
    // cada toma empiece justo cuando arranca su acción. Se estima con la duración real del .webm, que termina al cerrar.
    const real = duracion(webm);
    const desfase = Math.max(0, Math.min(2, cierre - real));
    for (const t of tramos) t.inicio = Math.max(0, t.inicio - desfase);
    console.log(`Grabación: ${webm} (${real.toFixed(2)} s; reloj ${cierre.toFixed(2)} s; desfase ${desfase.toFixed(2)} s)`);
  } finally {
    await navegador?.close();
    srv?.close();
  }

  // Exportar: si pasa de 10 MB, se comprime más (hasta tres intentos).
  let tam = null;
  for (const crf of [22, 26, 30]) {
    tam = exportar(webm, tramos, cues, crf);
    if (tam <= TAMANO_OBJETIVO_MB) break;
    aviso(`el MP4 pesa ${tam.toFixed(1)} MB (> ${TAMANO_OBJETIVO_MB} MB): se vuelve a exportar más comprimido`);
  }
  const dur = duracion(MP4);
  const info = correr(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,pix_fmt,width,height,r_frame_rate", "-of", "default=nw=1", MP4]).trim().replace(/\n/g, " · ");
  check(`video: dura ${dur.toFixed(2)} s (ffprobe; ≤ ${DURACION_MAX_S} s y dentro de ${DURACION_OBJETIVO_S.join("–")} s)`,
    dur <= DURACION_MAX_S && dur >= DURACION_OBJETIVO_S[0] - 1e-3 && dur <= DURACION_OBJETIVO_S[1] + 5e-3);
  check("video: H.264, yuv420p", /codec_name=h264/.test(info) && /pix_fmt=yuv420p/.test(info), info);
  check(`video: ${tam.toFixed(2)} MB (objetivo < ${TAMANO_OBJETIVO_MB} MB)`, tam < TAMANO_OBJETIVO_MB);
  const rutas = extraerFotogramas(cues);
  console.log(`\nVideo: ${MP4}\nFotogramas para revisar (uno por toma):\n${rutas.map((r) => `  ${r}`).join("\n")}`);
  terminar();
}

function terminar() {
  const malas = resultados.filter((r) => !r.ok);
  console.log(`\n${resultados.length - malas.length}/${resultados.length} comprobaciones pasan.`);
  process.exitCode = malas.length ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
