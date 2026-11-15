// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// tests/e2e/grabar_video.mjs — Graba el video de 30 s o menos del envío (kit C7) con Playwright y lo exporta con ffmpeg.
//
// Uso:   node tests/e2e/grabar_video.mjs
//        RAIZ_URL=https://<liga pública>/ node tests/e2e/grabar_video.mjs   (graba la página publicada, no la local)
//        RAIZ_VIDEO=recorrido node tests/e2e/grabar_video.mjs   (el recorrido largo, de uno a dos minutos: las mismas
//                                     tomas con más calma y siete golpes más: el idioma, menos lluvia, las zonas piloto
//                                     y el registro de lluvia en la portada; el suelo, las otras dos parcelas y la
//                                     vista 3D; guion docs/pitch/guion_video_recorrido.md → video_recorrido.mp4 y .srt)
//        RAIZ_LIGA_PAGINA=<liga>      liga pública que se escribe en la tarjeta de cierre (por omisión, la del proyecto)
//        RAIZ_FOTOGRAMAS=<carpeta>    dónde dejar un fotograma de cada tramo para revisarlo (por omisión, una temporal)
//        FFMPEG=<ruta> FFPROBE=<ruta> si ffmpeg y ffprobe no están en el PATH
// No forma parte de `node --test tests/` (necesita Chromium y ffmpeg). Termina con 0 si todo pasa y 1 si algo falla.
//
// El video de 30 s sigue los cinco tiempos de la guía de Space Apps (preséntate, el reto y por qué, el nombre y el
// lema, cómo funciona con el prototipo y los datos de NASA y de agencias socias, y la mirada al futuro).
// El video (guion: docs/pitch/guion_video_30s.md) tiene estas partes:
//   qué es            tarjeta de apertura animada (docs/pitch/video/tarjetas.html, vista «apertura»);
//   cómo funciona     tarjeta «How it works» animada (vista «como»): tres pasos y cuatro señas de cómo está hecha;
//   qué la distingue  tarjeta «Beyond crop selection» animada (vista «aparte»): nueve señas de lo que reúne;
//   se ve que funciona siete golpes cortos sobre la página REAL, cada uno con su acción y su consecuencia;
//   cierre            tarjeta de cierre (vista «cierre») con el aviso de juicio y la liga pública.
//
// Qué hace:
// 1. Lee los subtítulos de la sección 5 del guion y los escribe en docs/pitch/video_30s.srt. Cada subtítulo es una
//    toma: su inicio y su fin dan la duración de la toma. Revisa que ningún texto que este script agrega (subtítulos,
//    rótulos y tarjetas) traiga dígitos ni diga «first», «only», «save…», «best» ni «recommend…» (CLAUDE.md, reglas
//    2, 3 y 10), y que cada subtítulo tenga 10 palabras o menos.
// 2. Levanta un servidor estático de web/ (el mismo patrón de web_smoke.mjs), que además sirve las tarjetas del video.
//    Con RAIZ_URL la página se toma de esa liga; las tarjetas siguen saliendo del repo.
// 3. Decide dónde está cada cosa sin leer textos: si existe web/explorer.html (o responde en RAIZ_URL), el explorador
//    de parcelas se graba ahí; si no, en la raíz. Si la raíz es el tablero (carga js/dashboard.js y su <body> llega a
//    data-dashboard="listo"), el primer golpe (mover la dotación) se graba en el tablero en inglés (?lang=en); si no
//    llega a tiempo o la raíz no es el tablero, ese golpe se graba en el explorador. Los tiempos no cambian.
// 4. Abre la página a 1366 × 768 con escala de dispositivo 1.5 (la grabación sale a 2050 × 1152: los acercamientos
//    casi no pierden nitidez), SIN movimiento reducido, con la pantalla de inicio cerrada, y graba con recordVideo. La
//    escala se pide al navegador (--force-device-scale-factor): con solo deviceScaleFactor, Playwright graba a
//    1366 × 768 y rellena de gris. Si aun así la grabación no llena el cuadro, el script lo nota y recorta a escala 1.
//    Un puntero y un resaltado dibujados por este script (capas temporales encima de la página, nunca dentro de su
//    contenido) muestran dónde se hace clic y dónde mirar.
// 5. Cada toma se graba en uno o más TRAMOS. Cada tramo tiene una preparación fuera de cámara y una acción en cámara,
//    y devuelve su ENCUADRE (el rectángulo de la página que se verá) y su RESALTADO. El script anota cuándo empieza
//    cada tramo y, al exportar, recorta de la grabación su duración exacta: la edición no depende de lo que tarde la
//    máquina. Si una acción tarda más que su tramo, el tramo se recorre para terminar con el resultado a la vista; y
//    donde la respuesta de la página tarda (abrir la ficha, abrir «Why?») el tramo CORTA EN EL CLIC y el resultado
//    llega en el tramo siguiente, ya dibujado. Una marca de color que este script muestra un instante (fuera de
//    cámara) da la correspondencia exacta entre el reloj y la grabación; el tramo de la vista 3D, que la grabación
//    recibe con retraso, se coloca buscando en el .webm el instante en que aparece su anillo. Los tramos se graban
//    en el orden que conviene a la página y se montan en el orden del guion.
// 6. ffmpeg recorta y escala cada tramo a la zona de página (1920 × 890), con un acercamiento lento, y pone abajo la
//    banda de la toma (rótulo y subtítulo, capturada de tarjetas.html), que sube y aparece. Las tarjetas son
//    animadas: se capturan cuadro por cuadro, llevando sus animaciones al instante de cada cuadro. Las tomas se unen
//    con transiciones (xfade) y una barra avanza bajo la página mientras duran los golpes; dentro de una toma, los
//    tramos van con cortes limpios (son la acción y su resultado). Sale MP4 H.264 yuv420p, 1920 × 1080, 25 fps, con una
//    pista de audio en silencio, sin música. Revisa con ffprobe que dure de 28 a 29 s (guía de envío: más de 30 s
//    deja fuera el proyecto) y que pese menos de 10 MB.
// 7. Extrae un fotograma de cada tarjeta y de cada tramo en RAIZ_FOTOGRAMAS para revisarlo a ojo.
//
// Los elementos se localizan por su estructura (ids, clases y data-*), nunca por su texto, y nunca por su lugar en
// la cabecera. No se escribe ninguna cifra: las que se ven las dibuja la página con sus datos.

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
// Dos videos con las mismas tomas: el del formulario (30 s o menos; por omisión) y el recorrido largo para el README y
// la exposición (RAIZ_VIDEO=recorrido). Cada uno tiene su guion, sus salidas y sus límites de duración y de peso.
const VIDEOS = {
  oficial: { guion: "guion_video_30s.md", salida: "video_30s", maxima: 30.0, objetivo: [28.0, 29.0], megas: 10 },
  recorrido: { guion: "guion_video_recorrido.md", salida: "video_recorrido", maxima: 120.0, objetivo: [60.0, 120.0], megas: 30 },
};
const RECORRIDO = process.env.RAIZ_VIDEO === "recorrido";
const VIDEO = VIDEOS[RECORRIDO ? "recorrido" : "oficial"];
const GUION = path.join(RAIZ, "docs", "pitch", VIDEO.guion);
const SRT = path.join(RAIZ, "docs", "pitch", `${VIDEO.salida}.srt`);
const MP4 = path.join(RAIZ, "docs", "pitch", `${VIDEO.salida}.mp4`);
const TARJETAS = "docs/pitch/video/tarjetas.html"; // dentro del repo; el servidor local la sirve bajo /__repo__/
const TEMPORAL = fs.mkdtempSync(path.join(os.tmpdir(), "raiz-video-"));
const FOTOGRAMAS = process.env.RAIZ_FOTOGRAMAS ? path.resolve(process.env.RAIZ_FOTOGRAMAS) : path.join(TEMPORAL, "fotogramas");
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const FFPROBE = process.env.FFPROBE ?? "ffprobe";
// La liga del proyecto no es una cifra: se escribe tal cual en la tarjeta de cierre.
const LIGA = process.env.RAIZ_LIGA_PAGINA || "https://cristianruz.github.io/raiz-dam-to-root/";

// Protagonista de los golpes de la ficha y opción cuyo «Why?» se abre (por su data-opcion; si la parcela no la trae,
// se usa su primera alternativa).
const PARCELA = "P0757";
const OPCION_PORQUE = "avena_maiz";

// Formato de la grabación y del video final. Son medidas de diseño, no datos.
const VIEWPORT = { width: 1366, height: 768 };
const ESCALA = 1.5; // escala de dispositivo de la grabación (con 2 la página dibuja demasiado lento por software)
const GRABACION = { width: Math.ceil((VIEWPORT.width * ESCALA) / 2) * 2, height: Math.ceil((VIEWPORT.height * ESCALA) / 2) * 2 };
const SOSTEN_MS = 900; // lo que el final de cada acción queda a la vista antes del corte
const ASENTAR_MS = 450; // pausa entre la preparación de un tramo y su acción
const LIENZO = { ancho: 1920, alto: 1080 }; // 16:9, apto para YouTube y redes
const BANDA = 190; // banda inferior: rótulo y subtítulo
const PAGINA = { ancho: LIENZO.ancho, alto: LIENZO.alto - BANDA }; // zona donde se ve la página
const ASPECTO = PAGINA.ancho / PAGINA.alto;
const FONDO = "0x0B100E"; // --tinta de las tarjetas (el fondo del tablero): fondo de la banda y del lienzo
const FPS = 25;
// Movimiento del montaje (medidas de diseño, no datos):
// - transiciones entre tomas (xfade de ffmpeg): entre tarjetas, al entrar a la página, entre golpes y al cierre;
// - cada tramo de la página se acerca despacio (ACERCAR_POR_S por segundo), calculado al doble de tamaño para que
//   no tiemble; la banda de la toma sube y aparece; una barra del acento avanza bajo la página durante los golpes.
const TRANSICION = {
  tarjetas: { tipo: "smoothup", dur: 0.44 },
  entrar: { tipo: "circleopen", dur: 0.52 },
  golpes: { tipo: "slideleft", dur: 0.36 },
  salir: { tipo: "circleclose", dur: 0.52 },
};
const ACERCAR_POR_S = 0.011;
const SUPERMUESTREO = 2;
const BANDA_ENTRA_S = 0.34;
const BANDA_SUBE_PX = 38;
const BARRA = { alto: 4, color: "0xB9ED87" };
const ENTRADA_S = 0.3; // el video abre con un fundido desde el fondo
// Una tarjeta que entra por una transición empieza a animarse durante ella: se capturan estos cuadros de más.
const ANTICIPO_CUADROS = 14;
// Video del formulario: 30 s es regla del kit (C7) y de la guía de envío (más deja fuera el proyecto); se apunta a
// 28–29 s (margen pedido por el coordinador) y a menos de 10 MB.
const DURACION_MAX_S = VIDEO.maxima;
const DURACION_OBJETIVO_S = VIDEO.objetivo;
const TAMANO_OBJETIVO_MB = VIDEO.megas;
const GOLPE_MIN_S = 2.4; // un golpe de la página no dura menos que esto
const CIERRE_MIN_S = 2.5;
const AVISO_JUICIO = "This tool supports, never replaces, the judgment of farmers and local experts.";

// Las tomas, en el orden del guion (una por subtítulo de la sección 5). `rotulo`: el nombre del golpe en la banda.
// Las tarjetas siguen la estructura que pide la guía de Space Apps para el video de 30 s: quién (equipo), qué reto
// y por qué (reto), nombre y lema (apertura y aparte), cómo funciona (como y las tomas de la página) y mirada al
// futuro (futuro y cierre).
const EQUIPO = { tipo: "tarjeta", vista: "equipo" };
const RETO = { tipo: "tarjeta", vista: "reto" };
const FUTURO = { tipo: "tarjeta", vista: "futuro" };
const APERTURA = { tipo: "tarjeta", vista: "apertura" };
const COMO = { tipo: "tarjeta", vista: "como" };
const APARTE = { tipo: "tarjeta", vista: "aparte" }; // lo que la aplicación reúne además de la rotación
const CIERRE = { tipo: "tarjeta", vista: "cierre" };
const GOLPES = {
  dotacion: { tipo: "pagina", clave: "dotacion", rotulo: "Water allocation" },
  idioma: { tipo: "pagina", clave: "idioma", rotulo: "Language" },
  lluvia: { tipo: "pagina", clave: "lluvia", rotulo: "Drier scenario" },
  zonas: { tipo: "pagina", clave: "zonas", rotulo: "Pilot areas" },
  historia: { tipo: "pagina", clave: "historia", rotulo: "Rainfall record" },
  parcela: { tipo: "pagina", clave: "parcela", rotulo: "Select a field" },
  porque: { tipo: "pagina", clave: "porque", rotulo: "Rationale" },
  gota: { tipo: "pagina", clave: "gota", rotulo: "Follow the drop" },
  evidencia: { tipo: "pagina", clave: "evidencia", rotulo: "Satellite evidence" },
  suelo: { tipo: "pagina", clave: "suelo", rotulo: "Soil and evidence" },
  otras: { tipo: "pagina", clave: "otras", rotulo: "Other fields" },
  anios: { tipo: "pagina", clave: "anios", rotulo: "Past cycles" },
  compartir: { tipo: "pagina", clave: "compartir", rotulo: "Share" },
  pruebas: { tipo: "pagina", clave: "pruebas", rotulo: "Published tests" },
};
const G = GOLPES;
const TOMAS = RECORRIDO
  ? [APERTURA, COMO, APARTE, G.dotacion, G.idioma, G.lluvia, G.zonas, G.historia, G.parcela, G.porque, G.gota, G.evidencia, G.suelo, G.otras, G.anios, G.compartir, G.pruebas, CIERRE]
  : [EQUIPO, RETO, APERTURA, APARTE, COMO, G.dotacion, G.parcela, G.evidencia, FUTURO, CIERRE];
// Las otras dos parcelas de ejemplo (solo en el recorrido): una con el plazo libre y un nogal comprometido.
const OTRAS_PARCELAS = ["P0632", "L0175"];

// Ritmo del puntero y de los desplazamientos (ms).
const MOVER_MS = 340;
const DESPLAZAR_MS = 500;

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

/** Subtítulos del bloque ```text de la sección 5 del guion. */
function leerGuion() {
  const md = fs.readFileSync(GUION, "utf-8");
  const seccion = md.split(/^## /m).find((s) => /^5\.\s/.test(s));
  if (!seccion) throw new Error("el guion no tiene la sección «5. Subtítulos»");
  const bloque = seccion.match(/```text\n([\s\S]*?)```/);
  if (!bloque) throw new Error("la sección 5 del guion no trae el bloque ```text con el .srt");
  return bloque[1]
    .trim()
    .split(/\n\s*\n/)
    .map((b) => {
      const [n, tiempos, ...texto] = b.trim().split("\n");
      const [ini, fin] = tiempos.split("-->").map((t) => aSegundos(t.trim()));
      return { n: Number(n), ini, fin, texto: texto.join(" ").trim() };
    });
}

// Regla 10 y lo pedido para el video: ni «first», ni «only», ni «save…», ni «best», ni «recommend…».
const PROHIBIDAS = /\b(first|only|sav(e|es|ed|ing|ings)|best|recommend(s|ed|ing|ation|ations)?)\b/i;
/** Problemas de un texto que este script agrega al video: dígitos, palabras prohibidas y, si se pide, su largo. */
function problemasDeTexto(texto, maxPalabras = null) {
  const palabras = texto.split(/\s+/).filter((w) => w && !/^[–·→-]+$/.test(w)).length;
  return [
    /\d/.test(texto) ? "trae dígitos" : "",
    maxPalabras != null && palabras > maxPalabras ? `${palabras} palabras` : "",
    PROHIBIDAS.test(texto) ? "palabra prohibida (regla 10)" : "",
  ].filter(Boolean);
}

function revisarGuion(cues) {
  check(`guion: ${TOMAS.length} subtítulos, uno por toma, seguidos y sin huecos`,
    cues.length === TOMAS.length && cues[0].ini === 0 && cues.every((c, i) => i === 0 || Math.abs(c.ini - cues[i - 1].fin) < 1e-6), `${cues.length} subtítulos`);
  const total = cues[cues.length - 1].fin - cues[0].ini;
  check(`guion: duración total ${total.toFixed(1)} s ≤ ${DURACION_MAX_S} s`, total <= DURACION_MAX_S);
  for (const c of cues) {
    const problemas = problemasDeTexto(c.texto, 10);
    check(`subtítulo ${c.n}: sin dígitos, 10 palabras o menos, sin palabras prohibidas`, !problemas.length, problemas.join(", ") || c.texto);
  }
  for (const [i, t] of TOMAS.entries()) {
    if (!t.rotulo) continue;
    const problemas = problemasDeTexto(t.rotulo, 3);
    check(`rótulo de la toma ${i + 1}: sin dígitos, tres palabras o menos, sin palabras prohibidas`, !problemas.length, problemas.join(", ") || t.rotulo);
  }
  // Ritmo: cada golpe de la página con tiempo para su acción; el cierre, a la vista lo suficiente.
  const cortas = cues.filter((c, i) => TOMAS[i]?.tipo === "pagina" && c.fin - c.ini < GOLPE_MIN_S - 1e-6).map((c) => c.n);
  check(`guion: ningún golpe de la página dura menos de ${GOLPE_MIN_S} s`, !cortas.length, cortas.length ? `tomas ${cortas.join(", ")}` : "");
  const cierre = cues[cues.length - 1];
  check(`guion: el cierre dura ${CIERRE_MIN_S} s o más`, cierre && cierre.fin - cierre.ini >= CIERRE_MIN_S - 1e-6, cierre ? `${(cierre.fin - cierre.ini).toFixed(1)} s` : "");
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
  ".woff2": "font/woff2",
};
// Lo único del repo, fuera de web/, que el servidor entrega: las tarjetas del video y la tipografía de la página.
const REPO_SERVIDO = ["docs/pitch/video/", "web/vendor/"];
function servidor() {
  const srv = http.createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    let archivo;
    if (ruta.startsWith("/__repo__/")) {
      const relativa = path.posix.normalize(ruta.slice("/__repo__/".length));
      if (!REPO_SERVIDO.some((p) => relativa.startsWith(p))) {
        res.writeHead(403).end();
        return;
      }
      archivo = path.join(RAIZ, relativa);
    } else {
      archivo = path.normalize(path.join(WEB, ruta));
      if (!archivo.startsWith(WEB)) {
        res.writeHead(403).end();
        return;
      }
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
 * Capas de la grabación: el resaltado (anillos alrededor de lo que hay que mirar) y, encima, el puntero. Las dos son
 * elementos «popover» para quedar en la capa superior, también encima del diálogo modal «About & Data» (se vuelven a
 * subir después de abrirlo). No reciben clics ni tocan el contenido de la página. Se instalan otra vez en cada página.
 */
async function instalarAyudas(page) {
  await page.evaluate(() => {
    if (document.getElementById("grabacion-puntero")) return;
    const estilo = document.createElement("style");
    estilo.textContent = `
      #grabacion-resaltado { position: fixed; inset: 0; width: 100vw; height: 100vh; max-width: none; max-height: none;
        margin: 0; padding: 0; border: 0; background: transparent; overflow: hidden; pointer-events: none; }
      #grabacion-resaltado .anillo { position: absolute; box-sizing: border-box; border: 3px solid #F2B705; border-radius: 10px;
        box-shadow: 0 0 0 2px rgba(29, 35, 41, .28), 0 0 14px rgba(242, 183, 5, .5); opacity: 0; transition: opacity 180ms ease-out; }
      #grabacion-puntero { position: fixed; inset: auto; left: 0; top: 0; margin: 0; padding: 0; border: 0;
        background: transparent; overflow: visible; width: 30px; height: 30px; pointer-events: none;
        transform: translate(var(--x, 683px), var(--y, 500px));
        transition: transform var(--t, 340ms) cubic-bezier(.3,.7,.3,1), opacity 160ms linear; }
      #grabacion-puntero svg { position: absolute; left: 0; top: 0; filter: drop-shadow(0 1px 2px rgba(0,0,0,.45)); }
      #grabacion-puntero .onda { position: absolute; left: -16px; top: -16px; width: 32px; height: 32px; border-radius: 50%;
        border: 3px solid #F2B705; opacity: 0; transform: scale(.3); }
      #grabacion-puntero.pulsa .onda { animation: grabacion-onda 420ms ease-out; }
      @keyframes grabacion-onda { 0% { opacity: 1; transform: scale(.3); } 100% { opacity: 0; transform: scale(1.4); } }`;
    document.head.append(estilo);
    const capa = document.createElement("div");
    capa.id = "grabacion-resaltado";
    capa.setAttribute("popover", "manual");
    capa.setAttribute("aria-hidden", "true");
    document.body.append(capa);
    capa.showPopover();
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
          window.__grabacionColocarAnillos?.(); // en el mismo cuadro: el anillo no se queda atrás de su elemento
          if (f < 1) requestAnimationFrame(paso);
          else ok(el.scrollTop);
        };
        requestAnimationFrame(paso);
      });

    // Resaltado: anillos que SIGUEN a sus elementos en cada cuadro (también mientras la página se desplaza).
    // objetivos: [{ sel: [selectores], cada }] — un anillo con la unión de sus elementos o, con `cada`, uno por
    // elemento. recorte/cabecera: un anillo solo se ve si cabe entero en ese contenedor, bajo su cabecera fija;
    // dentroDe: y si además cabe entero en ese rectángulo de la ventana (el encuadre del tramo).
    const estado = { anillos: [], raf: 0, opciones: {} };
    const union = (els) => {
      let u = null;
      for (const e of els) {
        const r = e.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        u = u
          ? { x0: Math.min(u.x0, r.left), y0: Math.min(u.y0, r.top), x1: Math.max(u.x1, r.right), y1: Math.max(u.y1, r.bottom) }
          : { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom };
      }
      return u;
    };
    const colocar = () => {
      const { recorte, cabecera, margen = 6, dentroDe = null } = estado.opciones;
      let lim = null;
      const c = recorte ? document.querySelector(recorte) : null;
      if (c) {
        const r = c.getBoundingClientRect();
        const cab = cabecera ? c.querySelector(cabecera)?.getBoundingClientRect() : null;
        lim = { x0: r.left, y0: cab ? cab.bottom : r.top, x1: r.right, y1: r.bottom };
      }
      for (const a of estado.anillos) {
        const u = union(a.els);
        const cabe = u && (!lim || (u.x0 >= lim.x0 - 1 && u.x1 <= lim.x1 + 1 && u.y0 - margen >= lim.y0 - 1 && u.y1 + margen <= lim.y1 + 1)) &&
          (!dentroDe || (u.x0 - margen >= dentroDe.x && u.x1 + margen <= dentroDe.x + dentroDe.w && u.y0 - margen >= dentroDe.y && u.y1 + margen <= dentroDe.y + dentroDe.h));
        if (u) {
          a.nodo.style.left = `${u.x0 - margen}px`;
          a.nodo.style.top = `${u.y0 - margen}px`;
          a.nodo.style.width = `${u.x1 - u.x0 + 2 * margen}px`;
          a.nodo.style.height = `${u.y1 - u.y0 + 2 * margen}px`;
        }
        a.nodo.dataset.visible = cabe ? "si" : "no";
        a.nodo.style.opacity = cabe ? "1" : "0";
      }
    };
    window.__grabacionColocarAnillos = colocar;
    const paso = () => {
      colocar();
      estado.raf = requestAnimationFrame(paso);
    };
    window.__grabacionQuitarResaltado = () => {
      cancelAnimationFrame(estado.raf);
      estado.anillos = [];
      capa.replaceChildren();
    };
    /** Un anillo por grupo de elementos (la unión del grupo). Para quien ya tiene los elementos en la mano. */
    window.__grabacionResaltarElementos = (grupos, opciones = {}) => {
      window.__grabacionQuitarResaltado();
      estado.opciones = opciones;
      for (const els of grupos) {
        if (!els.length) continue;
        const nodo = document.createElement("div");
        nodo.className = "anillo";
        capa.append(nodo);
        estado.anillos.push({ els, nodo });
      }
      paso();
      return estado.anillos.length;
    };
    window.__grabacionResaltar = (objetivos, opciones = {}) => {
      const grupos = [];
      for (const o of objetivos) {
        const els = o.sel.flatMap((s) => [...document.querySelectorAll(s)]);
        if (o.cada) els.forEach((e) => grupos.push([e]));
        else grupos.push(els);
      }
      return window.__grabacionResaltarElementos(grupos, opciones);
    };
    /** Anillos a la vista en este momento, como rectángulos de la ventana. */
    window.__grabacionAnillos = () =>
      [...capa.children]
        .filter((n) => n.dataset.visible === "si")
        .map((n) => {
          const r = n.getBoundingClientRect();
          return { x: r.left, y: r.top, w: r.width, h: r.height };
        });
  });
}

/**
 * Marca de sincronía: un cuadro de color en la esquina, un instante y fuera de cámara. Devuelve cuándo se pintó (reloj
 * de la máquina). Después se busca en la grabación: así se sabe qué segundo del .webm es cada instante del reloj.
 */
const COLOR_MARCA = "#FF00FF";
async function marcarSincronia(page) {
  return page.evaluate((color) =>
    new Promise((ok) => {
      const m = document.createElement("div");
      m.setAttribute("popover", "manual");
      m.style.cssText = `position:fixed;inset:auto;left:0;top:0;width:72px;height:72px;margin:0;padding:0;border:0;background:${color};`;
      document.body.append(m);
      m.showPopover();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        const t = Date.now();
        setTimeout(() => {
          m.remove();
          setTimeout(() => ok(t), 250);
        }, 800);
      }));
    }), COLOR_MARCA);
}

/** Segundo de la grabación en que aparece la marca de sincronía (null si no se encuentra). */
function buscarMarca(webm, hastaS) {
  const crudo = execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-t", hastaS.toFixed(2), "-i", webm,
    "-vf", `fps=${FPS},crop=24:24:6:6,scale=1:1`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { cwd: TEMPORAL, maxBuffer: 64 * 1024 * 1024 });
  for (let i = 0; i * 3 + 2 < crudo.length; i++) {
    if (crudo[i * 3] > 200 && crudo[i * 3 + 1] < 90 && crudo[i * 3 + 2] > 200) return i / FPS;
  }
  return null;
}

/**
 * Segundo de la grabación en que aparece un anillo del resaltado: se mira, cuadro por cuadro, el color de un punto de
 * su borde izquierdo (ámbar sobre el fondo claro de la página). null si no aparece en el intervalo.
 */
function buscarAnillo(webm, ancla, escala) {
  const x = Math.max(0, Math.round(ancla.x * escala));
  const y = Math.max(0, Math.round(ancla.y * escala) - 2);
  const crudo = execFileSync(FFMPEG, ["-hide_banner", "-loglevel", "error", "-ss", ancla.buscarDesde.toFixed(2), "-t", (ancla.buscarHasta - ancla.buscarDesde).toFixed(2), "-i", webm,
    "-vf", `fps=${FPS},crop=4:4:${x}:${y},scale=1:1`, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], { cwd: TEMPORAL, maxBuffer: 64 * 1024 * 1024 });
  for (let i = 0; i * 3 + 2 < crudo.length; i++) {
    const [r, g, b] = [crudo[i * 3], crudo[i * 3 + 1], crudo[i * 3 + 2]];
    if (r > 180 && b < 130 && r - b > 90 && g > 110) return ancla.buscarDesde + i / FPS;
  }
  return null;
}

/** Vuelve a poner el resaltado y el puntero arriba de todo (después de abrir un diálogo modal). */
const subirCapas = (page) =>
  page.evaluate(() => {
    for (const id of ["grabacion-resaltado", "grabacion-puntero"]) {
      const p = document.getElementById(id);
      if (p.matches(":popover-open")) p.hidePopover();
      p.showPopover();
    }
  });

const resaltar = (page, objetivos, opciones = {}) => page.evaluate(([o, op]) => window.__grabacionResaltar(o, op), [objetivos, opciones]);
const quitarResaltado = (page) => page.evaluate(() => window.__grabacionQuitarResaltado());
const anillos = (page) => page.evaluate(() => window.__grabacionAnillos());
/** El puntero se esconde en los tramos sin clic (para no tapar lo que se lee) y vuelve en el siguiente clic. */
const verPuntero = (page, ver) =>
  page.evaluate((ver) => {
    document.getElementById("grabacion-puntero").style.opacity = ver ? "1" : "0";
  }, ver);

/** Mueve el puntero dibujado a un punto de la ventana. */
async function moverPuntero(page, x, y, ms = MOVER_MS) {
  await page.evaluate(
    ({ x, y, ms }) => {
      const p = document.getElementById("grabacion-puntero");
      p.style.opacity = "1";
      p.style.setProperty("--t", `${ms}ms`);
      p.style.setProperty("--x", `${x}px`);
      p.style.setProperty("--y", `${y}px`);
    },
    { x, y, ms },
  );
  await page.waitForTimeout(ms);
}

/** Mueve el puntero al centro de un elemento (sin clic). Devuelve ese punto. */
async function apuntar(page, locator, ms = MOVER_MS) {
  const caja = await locator.boundingBox();
  if (!caja) throw new Error(`no se ve el elemento al que se apunta: ${locator}`);
  const punto = { x: caja.x + caja.width / 2, y: caja.y + caja.height / 2 };
  await moverPuntero(page, punto.x, punto.y, ms);
  return punto;
}

/** La onda del puntero (el clic se ve). */
const pulsar = (page) =>
  page.evaluate(() => {
    const p = document.getElementById("grabacion-puntero");
    p.classList.remove("pulsa");
    void p.offsetWidth;
    p.classList.add("pulsa");
  });

/**
 * Apunta y hace clic (con la onda del puntero). El clic es del ratón en ese punto (page.mouse), no locator.click():
 * con la vista 3D y WebGL por software la página dibuja pocos cuadros por segundo y locator.click() espera cuadros
 * antes de cada clic. Después el ratón de verdad se aparta a la esquina: así el botón no se queda con su estilo de
 * «ratón encima» mientras se lee.
 */
async function clic(page, locator, ms = MOVER_MS) {
  const { x, y } = await apuntar(page, locator, ms);
  await pulsar(page);
  await page.mouse.click(x, y);
  await page.mouse.move(1, VIEWPORT.height - 1);
  return { x, y };
}

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
      // «asoma»: el borde superior del objetivo apenas dentro del borde inferior del contenedor (margen = lo que asoma).
      const destino =
        alinear === "abajo" ? Math.min(arriba, c.scrollTop + ro.bottom - rc.bottom + margen)
        : alinear === "asoma" ? c.scrollTop + ro.top - rc.bottom + margen
        : arriba;
      return ms > 0 ? window.__grabacionDesplazar(c, destino, ms) : ((c.scrollTop = destino), destino);
    },
    { contenedor, objetivo, margen, cabecera, ms, alinear },
  );
}

/** Unión de las cajas de todos los elementos de unos selectores, en px de la ventana; null si no hay ninguno a la vista. */
const cajaDe = (page, ...selectores) =>
  page.evaluate((selectores) => {
    let u = null;
    for (const e of selectores.flatMap((s) => [...document.querySelectorAll(s)])) {
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      u = u
        ? { x0: Math.min(u.x0, r.left), y0: Math.min(u.y0, r.top), x1: Math.max(u.x1, r.right), y1: Math.max(u.y1, r.bottom) }
        : { x0: r.left, y0: r.top, x1: r.right, y1: r.bottom };
    }
    return u ? { x: u.x0, y: u.y0, w: u.x1 - u.x0, h: u.y1 - u.y0 } : null;
  }, selectores);

const limitar = (v, a, b) => Math.max(a, Math.min(b, v));
/**
 * Encuadre: el rectángulo de la ventana que se verá en la zona de página del video, siempre con su proporción y
 * dentro de la ventana. `ancho` en px de la página (cuanto menor, más cerca); `x`, `y`: su esquina (se ajusta a la
 * ventana); si se da `centro`, se centra en esa caja en el eje que no traiga esquina.
 */
function encuadre({ ancho, x = null, y = null, centro = null }) {
  const w = limitar(ancho, 320, VIEWPORT.width);
  const h = w / ASPECTO;
  const cx = centro ? centro.x + centro.w / 2 - w / 2 : 0;
  const cy = centro ? centro.y + centro.h / 2 - h / 2 : 0;
  return {
    x: limitar(x ?? cx, 0, VIEWPORT.width - w),
    y: limitar(y ?? cy, 0, VIEWPORT.height - h),
    w,
    h,
  };
}
const dentro = (r, e, holgura = 2) => r.x >= e.x - holgura && r.y >= e.y - holgura && r.x + r.w <= e.x + e.w + holgura && r.y + r.h <= e.y + e.h + holgura;

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

/** Fija el año de la línea de tiempo (como lo haría el deslizador). */
const fijarAnio = (page, anio) =>
  page.locator("#linea-tiempo .tiempo-rango").evaluate((el, v) => {
    el.value = String(v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, anio);

/** Estado del explorador que decide cómo se graba: vista 3D y línea de tiempo, año destacado y zona inicial. */
async function leerVariantes(page) {
  return page.evaluate(() => {
    const rango = document.querySelector("#linea-tiempo .tiempo-rango");
    const destacado = document.querySelector("#linea-tiempo .tiempo-destacado[data-anio]")?.dataset.anio;
    return {
      boton3d: Boolean(document.querySelector("#boton-gemelo")),
      linea: Boolean(rango && document.querySelector("#linea-tiempo .tiempo-boton")),
      anioMin: rango ? Number(rango.min) : null,
      anioMax: rango ? Number(rango.max) : null,
      destacado: destacado ? Number(destacado) : null,
      zona: document.querySelector("#zona-sel")?.value ?? "",
      hayZonas: Boolean(document.querySelector("#selector-zona:not([hidden])")),
    };
  });
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

// ---------------------------------------------------------------- 4. los golpes de la página
/**
 * En un tramo que corta en el clic, fracción de su duración que se espera antes de mover el puntero: el clic cae cerca
 * del final de la duración, así el tramo (que termina en el clic) no empieza antes que su preparación.
 */
const antesDelClic = (reloj) => Math.max(0.3, 1 - 0.75 / reloj.dur);
const FICHA = { recorte: "#ficha", cabecera: ".ficha-cabeza" };
/** Encuadre de la ficha entera: de su borde izquierdo al derecho, desde un poco arriba de su cabecera. */
async function encuadreFicha(page) {
  const f = await cajaDe(page, "#ficha");
  return encuadre({ ancho: f.w + 28, x: f.x - 14, y: f.y - 8 });
}

/**
 * Los tramos de la página, en el orden en que se GRABAN (el montaje sigue el orden del guion). Cada tramo:
 *   { toma: clave de TOMAS, parte: fracción de la duración de su toma, nombre, prep(page), accion(page, reloj) }
 * La acción devuelve { encuadre, resaltado: «si» si debe quedar un anillo a la vista, verHasta? }.
 */
function tramosDelExplorador(ctx) {
  const { variantes } = ctx;
  const conGemelo = variantes.boton3d && variantes.linea && variantes.destacado != null;
  const tarjetaPorque = () => ctx.selectorPorque; // lo fija la preparación de «porque»
  const lista = [];

  // ---- Set the water (si la portada es el tablero, este golpe se graba allá: ver tramoDelTablero)
  if (!ctx.dotacionEnTablero) {
    lista.push({
      toma: "dotacion", parte: 1, nombre: "explorador: de «Like 2026» a «Like 2025»; cambian el mapa y el indicador",
      async prep(page) {
        await page.locator('.boton-marca[data-marca="como_2026"]').click();
        await page.mouse.move(1, VIEWPORT.height - 1);
        await page.evaluate(() => document.querySelector(".panel")?.scrollTo(0, 0));
        await mapaQuieto(page);
        const b = await cajaDe(page, '.boton-marca[data-marca="como_2026"]');
        await moverPuntero(page, b.x + b.w + 150, b.y + b.h + 60, 0);
      },
      async accion(page, reloj) {
        const controles = await cajaDe(page, "#controles");
        const valor = await cajaDe(page, "#dotacion-valor");
        const e = encuadre({ ancho: Math.max(1000, valor.x + valor.w + 16), x: 0, y: controles.y + 8 });
        await reloj.hasta(0.12);
        await clic(page, page.locator('.boton-marca[data-marca="como_2025"]'));
        await resaltar(page, [{ sel: ["#indicador-cifra"] }]);
        await moverPuntero(page, e.x + e.w * 0.62, e.y + e.h * 0.3, 500);
        return { encuadre: e, resaltado: "si" };
      },
    });
  }

  // ---- Look back (solo en el recorrido): el gemelo en 3D y su línea de tiempo hasta el año destacado
  lista.push(
    conGemelo
      ? {
          toma: "anios", parte: 1, nombre: "vista 3D: «Play» hasta el año destacado y su nota",
          async prep(page) {
            await elegirZona(page, variantes.zona);
            const b = page.locator("#boton-gemelo");
            if ((await b.getAttribute("aria-pressed")) !== "true") await b.click();
            await page.waitForFunction(() => window.raizDepuracion?.gemelo3d?.()?.relieveCargado, null, { timeout: 30000 }).catch(() => aviso("el relieve 3D no terminó de cargar"));
            await mapaQuieto(page);
            await desplazarA(page, ".panel", "#bloque-tiempo", { margen: 0, ms: 0 });
            // Dos años antes del destacado: «Play» avanza uno de inmediato y otro tras gemelo.json → tiempo.intervalo_ms.
            await fijarAnio(page, Math.max(variantes.anioMin, variantes.destacado - 2));
            await mapaQuieto(page);
            const b2 = await cajaDe(page, "#linea-tiempo .tiempo-boton");
            await moverPuntero(page, b2.x - 60, b2.y + b2.h + 50, 0);
          },
          async accion(page, reloj) {
            const mapa = await cajaDe(page, "#mapa");
            const e = encuadre({ ancho: 950, x: VIEWPORT.width, y: mapa.y - 4 });
            // «Pause» al llegar al año destacado, desde la página: un observador del año pulsa el botón en cuanto cambia
            // (si se esperara desde aquí, con pocos cuadros por segundo la reproducción podría pasarse de año).
            await page.evaluate((anio) => {
              window.__grabacionAncla = 0;
              const nodo = document.querySelector("#linea-tiempo .tiempo");
              const obs = new MutationObserver(() => {
                if (nodo.dataset.anio !== String(anio)) return;
                obs.disconnect();
                nodo.querySelector(".tiempo-boton").click();
                window.__grabacionResaltar([{ sel: [`#linea-tiempo .tiempo-destacado[data-anio="${anio}"]`] }]);
                window.__grabacionAncla = Date.now(); // cuándo quedó en pausa en el año destacado
              });
              obs.observe(nodo, { attributes: true, attributeFilter: ["data-anio"] });
            }, variantes.destacado);
            await clic(page, page.locator("#linea-tiempo .tiempo-boton"), 280);
            await page.waitForFunction(() => window.__grabacionAncla, null, { timeout: 15000, polling: 100 });
            await verPuntero(page, false);
            // Con WebGL por software la vista 3D dibuja pocos cuadros por segundo y la grabación llega con retraso:
            // el reloj no dice cuándo se VE el año destacado. El tramo se ancla a la grabación misma (anclaVisual): el
            // instante en que aparece el anillo de la nota queda al 45 % del tramo (antes, el año anterior; después,
            // el destacado). Hay que dejar que la página termine de dibujar y seguir grabando lo que dura el resto.
            await mapaQuieto(page);
            await page.waitForTimeout(Math.max(1500, reloj.dur * 550 + 700));
            return { encuadre: e, resaltado: "si", anclaVisual: { antes: reloj.dur * 0.45 } };
          },
        }
      : null, // sin la vista 3D no hay toma «Look back» (solo la pide el recorrido)
  );

  // ---- Pick a field: clic en la parcela (corte en el clic), su frase principal y, después, sus opciones lado a lado
  lista.push({
    toma: "parcela", parte: 0.19, nombre: `${PARCELA}: clic en la lista «Fields» (el tramo corta en el clic)`,
    async prep(page) {
      await quitarResaltado(page);
      if (await page.locator("#boton-gemelo[aria-pressed='true']").count()) await page.locator("#boton-gemelo").click();
      await elegirZona(page, "");
      if (variantes.linea) await fijarAnio(page, variantes.anioMax);
      await page.locator('.boton-marca[data-marca="como_2026"]').click();
      await page.mouse.move(1, VIEWPORT.height - 1);
      await mapaQuieto(page);
      await prepararLista(page);
      const boton = page.locator(`.boton-parcela[data-id="${PARCELA}"]`);
      await boton.evaluate((el) => el.scrollIntoView({ block: "nearest" }));
      const b = await boton.boundingBox();
      await moverPuntero(page, b.x + b.width / 2 - 90, b.y + b.height + 90, 0);
    },
    async accion(page, reloj) {
      // El mismo encuadre que tendrá la ficha al abrirse (se abre sobre el mapa, junto a la lista): el corte no salta.
      const mapa = await cajaDe(page, "#mapa");
      const e = encuadre({ ancho: 1039, x: VIEWPORT.width, y: mapa.y + 4 });
      const boton = `.boton-parcela[data-id="${PARCELA}"]`;
      await resaltar(page, [{ sel: [boton] }], { margen: 3 });
      await reloj.hasta(antesDelClic(reloj));
      const { x, y } = await apuntar(page, page.locator(boton), 320);
      await pulsar(page);
      await page.waitForTimeout(220);
      const cortarEn = Date.now() - 20;
      await page.mouse.click(x, y);
      await page.mouse.move(1, VIEWPORT.height - 1);
      await page.waitForSelector("#ficha:not([hidden])");
      return { encuadre: e, resaltado: "no", cortarEn };
    },
  });
  lista.push({
    toma: "parcela", parte: 0.325, nombre: `${PARCELA}: la frase principal de la ficha (agua, hectáreas y años)`,
    async prep(page) {
      await quitarResaltado(page);
      await verPuntero(page, false);
      await page.waitForTimeout(500); // la entrada de la ficha y su dibujo
    },
    async accion(page) {
      await resaltar(page, [{ sel: ["#ficha-resumen"] }], FICHA);
      return { encuadre: await encuadreFicha(page), resaltado: "si" };
    },
  });
  lista.push({
    toma: "parcela", parte: 0.485, nombre: `${PARCELA}: las tarjetas de las opciones; agua por año y hectáreas de cada una`,
    async prep(page) {
      await quitarResaltado(page);
      await verPuntero(page, false);
    },
    async accion(page) {
      await desplazarA(page, "#ficha", '.tarjeta[data-opcion="ACTUAL"]', { cabecera: ".ficha-cabeza", margen: 8, ms: DESPLAZAR_MS });
      // Un anillo por tarjeta: su lámina por año y las hectáreas para las que alcanza.
      await page.evaluate(([op]) => {
        const objetivos = [...document.querySelectorAll("#ficha .tarjeta[data-opcion]")].map((t) => ({
          sel: [".lamina", ".alcanza"].map((c) => `#ficha .tarjeta[data-opcion="${CSS.escape(t.dataset.opcion)}"] [data-parte="agua"] ${c}`),
        }));
        window.__grabacionResaltar(objetivos, op);
      }, [FICHA]);
      return { encuadre: await encuadreFicha(page), resaltado: "si" };
    },
  });

  // ---- Satellite evidence: la memoria de la parcela por año (NASA HLS) y su curva de verdor. Se lee bien quieta.
  lista.push({
    toma: "evidencia", parte: 1, nombre: `${PARCELA}: la memoria satelital por año y la curva de verdor`,
    async prep(page) {
      await quitarResaltado(page);
      await verPuntero(page, false);
      await desplazarA(page, "#ficha", "#ficha-resumen", { cabecera: ".ficha-cabeza", margen: 8, ms: 0 });
    },
    async accion(page, reloj) {
      await desplazarA(page, "#ficha", "#ficha section.memoria", { cabecera: ".ficha-cabeza", margen: 10, ms: DESPLAZAR_MS });
      await resaltar(page, [{ sel: ["#ficha section.memoria"] }], FICHA);
      const e = await encuadreFicha(page);
      await reloj.hasta(0.55);
      // Después, la curva de verdor, si cabe entera a la vista (en la ficha y en el encuadre); si no, el anillo se
      // queda en la memoria.
      const curva = await cajaDe(page, "#ficha .resumen-ndvi-lienzo");
      const ficha = await cajaDe(page, "#ficha");
      const holgada = curva ? { x: curva.x - 8, y: curva.y - 8, w: curva.w + 16, h: curva.h + 16 } : null;
      if (holgada && dentro(holgada, e) && dentro(holgada, ficha)) await resaltar(page, [{ sel: ["#ficha .resumen-ndvi-lienzo"] }], FICHA);
      return { encuadre: e, resaltado: "si" };
    },
  });

  // ---- Ask why: «Why?» de una alternativa: «Why it's suggested» y, en otro tramo, «Benefits»
  const respuesta = (k) => {
    const dd = `${tarjetaPorque()} dd[data-respuesta="${k}"]`;
    return [`${tarjetaPorque()} dt:has(+ dd[data-respuesta="${k}"])`, dd];
  };
  const encuadrePorque = async (page) => {
    const cabeza = await cajaDe(page, "#ficha .ficha-cabeza");
    const tarjeta = await cajaDe(page, tarjetaPorque());
    return encuadre({ ancho: 800, centro: tarjeta, y: cabeza.y + cabeza.h - 4 });
  };
  lista.push({
    toma: "porque", parte: 0.225, nombre: "clic en «Why?» de una alternativa (el tramo corta en el clic)",
    async prep(page) {
      await quitarResaltado(page);
      // La alternativa pedida por su data-opcion; si la parcela no la trae, su primera alternativa.
      const pedida = `#ficha .tarjeta[data-opcion="${OPCION_PORQUE}"]`;
      const hay = await page.locator(pedida).count();
      if (!hay) {
        const otra = await page.locator('#ficha .tarjeta:not([data-opcion="ACTUAL"])').first().getAttribute("data-opcion").catch(() => null);
        if (!otra) throw new Error(`${PARCELA} no trae alternativas: no hay «Why?» que abrir`);
        aviso(`${PARCELA} no trae la opción «${OPCION_PORQUE}»: se abre el «Why?» de «${otra}»`);
        ctx.selectorPorque = `#ficha .tarjeta[data-opcion="${otra}"]`;
      } else ctx.selectorPorque = pedida;
      // El botón «Why?» queda a media altura: arriba se ve el final de la tarjeta a la que pertenece.
      await desplazarA(page, "#ficha", `${ctx.selectorPorque} details.porque > summary`, { cabecera: ".ficha-cabeza", margen: 210, ms: 0 });
      const s = await cajaDe(page, `${ctx.selectorPorque} details.porque > summary`);
      await moverPuntero(page, s.x + s.w + 120, s.y - 70, 0);
    },
    async accion(page, reloj) {
      const e = await encuadrePorque(page);
      const resumen = `${tarjetaPorque()} details.porque > summary`;
      await resaltar(page, [{ sel: [resumen] }], { ...FICHA, margen: 5 });
      await reloj.hasta(antesDelClic(reloj));
      const { x, y } = await apuntar(page, page.locator(resumen), 320);
      await pulsar(page);
      await page.waitForTimeout(220);
      const cortarEn = Date.now() - 20;
      await page.mouse.click(x, y);
      await page.mouse.move(1, VIEWPORT.height - 1);
      await page.waitForSelector(`${tarjetaPorque()} details.porque[open]`);
      return { encuadre: e, resaltado: "no", cortarEn };
    },
  });
  lista.push({
    toma: "porque", parte: 0.325, nombre: "«Why it's suggested»: el motivo de la tabla oficial y la frase del agua",
    async prep(page) {
      await quitarResaltado(page);
      await verPuntero(page, false);
      await desplazarA(page, "#ficha", respuesta("por_que")[0], { cabecera: ".ficha-cabeza", margen: 12, ms: 0 });
    },
    async accion(page) {
      await resaltar(page, [{ sel: respuesta("por_que") }], FICHA);
      return { encuadre: await encuadrePorque(page), resaltado: "si" };
    },
  });
  lista.push({
    toma: "porque", parte: 0.45, nombre: "«Benefits»: la opción frente a la rotación actual de la parcela",
    async prep(page) {
      await quitarResaltado(page);
      await desplazarA(page, "#ficha", respuesta("beneficios")[0], { cabecera: ".ficha-cabeza", margen: 12, ms: 0 });
    },
    async accion(page) {
      await resaltar(page, [{ sel: respuesta("beneficios") }], FICHA);
      const abierto = await page.locator(`${tarjetaPorque()} details.porque[open]`).count();
      const e = await encuadrePorque(page);
      const beneficios = await cajaDe(page, respuesta("beneficios")[1]);
      check("toma «Ask why»: el bloque «Why?» está abierto y «Benefits» queda dentro del encuadre",
        abierto === 1 && beneficios && dentro(beneficios, e), beneficios ? `«Benefits» mide ${Math.round(beneficios.w)} × ${Math.round(beneficios.h)} px` : "no se ve «Benefits»");
      return { encuadre: e, resaltado: "si" };
    },
  });

  // ---- Follow the drop: el diagrama entra en pantalla y las gotas salen solas una vez
  lista.push({
    toma: "gota", parte: 1, nombre: `«Follow the drop» de ${PARCELA}: de la presa al cultivo y al acuífero`,
    async prep(page) {
      await quitarResaltado(page);
      await verPuntero(page, false);
      // El diagrama apenas asoma: las gotas salen cuando entra en pantalla, ya en cámara.
      await desplazarA(page, "#ficha", "#seccion-gota", { margen: 70, ms: 0, alinear: "asoma" });
    },
    async accion(page) {
      await desplazarA(page, "#ficha", "#seccion-gota .gota-mod-diagrama", { cabecera: ".ficha-cabeza", margen: 8, ms: DESPLAZAR_MS, alinear: "abajo" });
      const diagrama = await cajaDe(page, "#seccion-gota .gota-mod-diagrama");
      // El primer nodo (la presa) y su etiqueta; si cambia su nombre interno, el primer nodo del diagrama.
      const presa = (await page.locator('#seccion-gota [data-gota-nodo="presa"]').count())
        ? ['#seccion-gota [data-gota-nodo="presa"]', '#seccion-gota [data-gota-etiqueta="presa"]']
        : ["#seccion-gota [data-gota-nodo]:first-of-type"];
      await resaltar(page, [{ sel: presa }], FICHA);
      return { encuadre: encuadre({ ancho: diagrama.w + 36, centro: diagrama }), resaltado: "si" };
    },
  });

  // ---- Soil and evidence (solo en el recorrido): la sección de suelo y evidencia satelital de la ficha, con sus fuentes
  lista.push({
    toma: "suelo", parte: 1, nombre: `${PARCELA}: la sección «Soil and satellite evidence» de la ficha`,
    async prep(page) {
      await quitarResaltado(page);
      await verPuntero(page, false);
      await desplazarA(page, "#ficha", "#t-evidencia", { cabecera: ".ficha-cabeza", margen: 220, ms: 0 });
    },
    async accion(page) {
      await desplazarA(page, "#ficha", "#t-evidencia", { cabecera: ".ficha-cabeza", margen: 12, ms: DESPLAZAR_MS });
      await resaltar(page, [{ sel: ["#ficha #t-evidencia"] }], FICHA);
      return { encuadre: await encuadreFicha(page), resaltado: "si" };
    },
  });

  // ---- Share: el mensaje para el agricultor cambia de idioma
  lista.push({
    toma: "compartir", parte: 1, nombre: "«Share with the farmer»: el mensaje de WhatsApp cambia de idioma",
    async prep(page) {
      await quitarResaltado(page);
      await desplazarA(page, "#ficha", "#boton-whatsapp", { cabecera: ".ficha-cabeza", margen: 12, ms: 0 });
      if ((await page.locator("#boton-whatsapp").getAttribute("aria-expanded")) !== "true") await page.locator("#boton-whatsapp").click();
      await page.waitForSelector("#vista-whatsapp .wa-maqueta");
      await page.waitForTimeout(700); // la página lleva sola la vista previa a la pantalla
      await desplazarA(page, "#ficha", "#vista-whatsapp select", { cabecera: ".ficha-cabeza", margen: 14, ms: 0 });
      await page.mouse.move(1, VIEWPORT.height - 1);
      const s = await cajaDe(page, "#vista-whatsapp select");
      await moverPuntero(page, s.x + s.w + 120, s.y + s.h + 80, 0);
    },
    async accion(page, reloj) {
      const cabeza = await cajaDe(page, "#ficha .ficha-cabeza");
      const telefono = await cajaDe(page, "#vista-whatsapp .wa-telefono");
      const e = encuadre({ ancho: 900, centro: telefono, y: cabeza.y + cabeza.h - 4 });
      const selector = page.locator("#vista-whatsapp select");
      const ahora = await page.locator("#vista-whatsapp .wa-maqueta").getAttribute("data-idioma");
      // Al idioma del agricultor (español); si el mensaje ya abrió en español, al inglés. Los valores son los del selector.
      const valores = await selector.locator("option").evaluateAll((os) => os.map((o) => o.value));
      const destino = ["es", "en"].find((v) => v !== ahora && valores.includes(v)) ?? valores.find((v) => v !== ahora);
      await reloj.hasta(0.14);
      await apuntar(page, selector, 300);
      await pulsar(page);
      await page.locator("#vista-whatsapp select").selectOption(destino);
      await page.waitForSelector(`#vista-whatsapp .wa-maqueta[data-idioma="${destino}"]`);
      await resaltar(page, [{ sel: ["#vista-whatsapp .wa-saludo"] }], FICHA);
      const s = await cajaDe(page, "#vista-whatsapp select");
      await moverPuntero(page, s.x + s.w + 70, s.y + s.h / 2, 300);
      return { encuadre: e, resaltado: "si" };
    },
  });

  // ---- Other fields (solo en el recorrido): las otras dos parcelas de ejemplo, cada una con su frase y su plazo
  for (const id of OTRAS_PARCELAS) {
    lista.push({
      toma: "otras", parte: 1 / OTRAS_PARCELAS.length, nombre: `${id}: su frase principal y su plazo`,
      async prep(page) {
        await quitarResaltado(page);
        await verPuntero(page, false);
        if (await page.locator("#ficha").isVisible()) await page.locator("#ficha-cerrar").click();
        await prepararLista(page);
        const boton = page.locator(`.boton-parcela[data-id="${id}"]`);
        await boton.evaluate((el) => el.scrollIntoView({ block: "nearest" }));
        await boton.click();
        await page.waitForSelector("#ficha:not([hidden])");
        await page.mouse.move(1, VIEWPORT.height - 1);
        await page.waitForTimeout(700); // la entrada de la ficha y su dibujo
      },
      async accion(page) {
        await resaltar(page, [{ sel: ["#ficha-resumen"] }, { sel: ["#ficha .ficha-plazo"] }], FICHA);
        return { encuadre: await encuadreFicha(page), resaltado: "si" };
      },
    });
  }

  // ---- Check the tests: «About & Data» → la lista de pruebas con su estado, también las que no cumplen
  lista.push({
    toma: "pruebas", parte: 1, nombre: "«About & Data»: las pruebas publicadas con su estado",
    async prep(page) {
      await quitarResaltado(page);
      await verPuntero(page, false);
      if (await page.locator("#ficha").isVisible()) await page.locator("#ficha-cerrar").click();
      await page.locator("#boton-acerca").click();
      await page.locator("#acerca .acerca-pruebas").waitFor({ timeout: 10000 });
      await page.mouse.move(1, VIEWPORT.height - 1);
      await subirCapas(page);
      // Arriba queda el encabezado de la sección de las pruebas (el título inmediatamente antes de la lista).
      await page.evaluate(() => {
        const d = document.querySelector("#acerca");
        const lista = d.querySelector(".acerca-pruebas");
        const titulo = lista.closest("section")?.querySelector("h3") ?? lista;
        const cab = d.querySelector(".dialogo-acerca-cabeza")?.getBoundingClientRect().height ?? 0;
        d.scrollTop += titulo.getBoundingClientRect().top - d.getBoundingClientRect().top - cab - 10;
      });
    },
    async accion(page, reloj) {
      const dialogo = await cajaDe(page, "#acerca");
      const cabeza = await cajaDe(page, "#acerca .dialogo-acerca-cabeza");
      const e = encuadre({ ancho: dialogo.w + 8, x: dialogo.x - 4, y: cabeza.y + cabeza.h - 6 });
      // Un anillo por prueba, en su estado («Criterion not met», «Partial»…): se ve cuál es, salga como salga.
      await resaltar(page, [{ sel: ["#acerca .acerca-prueba > .acerca-prueba-cabeza .acerca-estado"], cada: true }],
        { recorte: "#acerca", cabecera: ".dialogo-acerca-cabeza", margen: 5, dentroDe: e });
      await reloj.hasta(0.2);
      // Despacio hacia abajo: la segunda prueba sube bajo la cabecera y asoma la tercera.
      const segunda = (await page.locator("#acerca .acerca-prueba").count()) > 1 ? "#acerca .acerca-prueba:nth-of-type(2)" : "#acerca .acerca-prueba";
      await desplazarA(page, "#acerca", segunda, { cabecera: ".dialogo-acerca-cabeza", margen: 10, ms: 1300 });
      return { encuadre: e, resaltado: "si" };
    },
  });

  // Orden de grabación: lo que pide «despuesDe» va justo después del último tramo de esa toma.
  const ordenada = lista.filter((t) => t && !t.despuesDe);
  for (const t of lista.filter((t) => t && t.despuesDe)) {
    const i = ordenada.map((x) => x.toma).lastIndexOf(t.despuesDe);
    ordenada.splice(i + 1, 0, t);
  }
  return ordenada;
}

/**
 * Los tramos de la portada nueva (el tablero). Todo se localiza desde el deslizador `#allocation` y por estructura:
 * su tarjeta es el <article> que lo contiene, las marcas son los botones con aria-pressed de esa tarjeta y lo que
 * «responde» son los textos de la tarjeta que cambian con el clic. Ningún texto ni otro id del tablero.
 */
function tramosDelTablero() {
  /** Cajas de la tarjeta de la dotación, de su deslizador y de la primera marca sin pulsar; null si no hay deslizador. */
  const estructura = (page) =>
    page.evaluate(() => {
      const d = document.querySelector("#allocation");
      if (!d) return null;
      const t = d.closest("article") ?? d.parentElement;
      const caja = (e) => {
        const r = e.getBoundingClientRect();
        return { x: r.left, y: r.top, w: r.width, h: r.height };
      };
      const libre = [...t.querySelectorAll("button[aria-pressed]")].find((b) => b.getAttribute("aria-pressed") === "false");
      return { tarjeta: caja(t), deslizador: caja(d), libre: libre ? caja(libre) : null, valor: d.value };
    });
  const lista = [];
  let dotacionInicial = null; // la dotación con que abre la portada: las tomas que siguen vuelven a ella

  lista.push({
    toma: "dotacion", parte: 1, nombre: "tablero (portada, en inglés): una marca de la dotación; cambian el mapa y el indicador",
    async prep(page) {
      // La tarjeta de la dotación, entera, en la parte baja de la ventana: arriba y a su derecha queda el mapa.
      await page.evaluate((alto) => {
        const d = document.querySelector("#allocation");
        if (!d) return;
        const t = d.closest("article") ?? d.parentElement;
        window.scrollBy(0, t.getBoundingClientRect().bottom - (alto - 110));
      }, VIEWPORT.height);
      await page.waitForTimeout(900); // el mapa termina de dibujar donde quedó
      const e = await estructura(page);
      if (e) await moverPuntero(page, e.tarjeta.x + e.tarjeta.w + 140, e.tarjeta.y + 40, 0);
    },
    async accion(page, reloj) {
      const antes = await estructura(page);
      if (!antes) {
        check("tablero: la portada trae el deslizador de la dotación (#allocation)", false, "no hay #allocation: no se puede mover la dotación");
        await verPuntero(page, false);
        return { encuadre: encuadre({ ancho: VIEWPORT.width, x: 0, y: 0 }), resaltado: "no" };
      }
      dotacionInicial = antes.valor;
      const t = antes.tarjeta;
      const ancho = Math.max(900, t.w * 2.4);
      const e = encuadre({ ancho, x: t.x - 26, y: t.y + t.h + 14 - ancho / ASPECTO });
      // Primero, el anillo en el control: el deslizador y sus marcas. Y un observador de la tarjeta: en cuanto cambie lo
      // que dice (la cifra, el indicador), el anillo pasa, un instante después, a lo que cambió. Lo hace la página misma,
      // en el momento: mientras el mapa se vuelve a pintar, las órdenes de este script llegan tarde. Los textos se
      // comparan por su lugar, porque la tarjeta puede volver a dibujarlos.
      await page.evaluate(() => {
        const d = document.querySelector("#allocation");
        const t = d.closest("article") ?? d.parentElement;
        const marcas = [...t.querySelectorAll("button[aria-pressed]")];
        const textos = () => [...t.querySelectorAll("output, strong")];
        const antes = textos().map((n) => n.textContent);
        window.__grabacionCambio = null;
        window.__grabacionResaltarElementos([[d, ...marcas]], { margen: 8 });
        const obs = new MutationObserver(() => {
          if (!textos().some((n, k) => n.textContent !== antes[k])) return;
          obs.disconnect();
          const en = Date.now();
          setTimeout(() => {
            const distintos = textos().filter((n, k) => n.textContent !== antes[k]);
            window.__grabacionResaltarElementos(distintos.map((n) => [n]), { margen: 8 });
            window.__grabacionCambio = { en, cuantos: distintos.length };
          }, 250);
        });
        obs.observe(t, { subtree: true, childList: true, characterData: true });
      });
      await reloj.hasta(0.1);
      // El clic: en la primera marca sin pulsar; si la tarjeta no trae marcas, sobre la pista del deslizador.
      const destino = antes.libre
        ? { x: antes.libre.x + antes.libre.w / 2, y: antes.libre.y + antes.libre.h / 2 }
        : { x: antes.deslizador.x + antes.deslizador.w * (Number(antes.valor) > 2 ? 0.1 : 0.8), y: antes.deslizador.y + antes.deslizador.h / 2 };
      await moverPuntero(page, destino.x, destino.y, 380);
      await pulsar(page);
      const clicEn = Date.now();
      await page.mouse.click(destino.x, destino.y);
      const cambio = await page.waitForFunction(() => window.__grabacionCambio, null, { timeout: 6000 }).then((h) => h.jsonValue()).catch(() => null);
      const valor = await page.evaluate(() => document.querySelector("#allocation").value);
      check("tablero: al pulsar la marca cambian el deslizador y lo que dice la tarjeta de la dotación",
        Boolean(cambio) && cambio.cuantos > 0 && valor !== antes.valor, cambio ? `${cambio.cuantos} texto(s) con anillo` : "la tarjeta no cambió");
      await page.mouse.move(1, VIEWPORT.height - 1);
      await moverPuntero(page, t.x + t.w + 150, t.y + t.h * 0.45, 420);
      // El tramo se coloca alrededor del cambio: antes se ve el control y el clic; después, lo que cambió (casi 2 s).
      return { encuadre: e, resaltado: "si", verHasta: (cambio?.en ?? clicEn) + 1950 };
    },
  });

  // ---- Your language (solo en el recorrido): el selector de idioma de la portada, del inglés al español
  /** El selector de idioma, por estructura: el <select> cuyas opciones traen «en» y «es». */
  const selectorDeIdioma = (page) =>
    page.evaluateHandle(() => [...document.querySelectorAll("select")].find((s) => ["en", "es"].every((v) => [...s.options].some((o) => o.value === v))) ?? null);
  const ponerIdioma = async (page, idioma) => {
    const sel = (await selectorDeIdioma(page)).asElement();
    if (sel) await sel.selectOption(idioma);
    return Boolean(sel);
  };
  lista.push({
    toma: "idioma", parte: 1, nombre: "tablero: el selector de idioma, del inglés al español",
    async prep(page) {
      await page.evaluate(() => {
        window.__grabacionQuitarResaltado();
        window.scrollTo(0, 0);
      });
      await ponerIdioma(page, "en");
      await page.mouse.move(1, VIEWPORT.height - 1);
      await page.waitForTimeout(700);
      await moverPuntero(page, VIEWPORT.width * 0.55, 150, 0);
    },
    async accion(page, reloj) {
      const e = encuadre({ ancho: VIEWPORT.width, x: 0, y: 0 });
      const sel = (await selectorDeIdioma(page)).asElement();
      if (!sel) {
        check("tablero: la portada trae un selector de idioma con inglés y español", false);
        return { encuadre: e, resaltado: "no" };
      }
      await page.evaluate(() => {
        const s = [...document.querySelectorAll("select")].find((x) => ["en", "es"].every((v) => [...x.options].some((o) => o.value === v)));
        window.__grabacionResaltarElementos([[s]], { margen: 6 });
      });
      await reloj.hasta(0.2);
      const c = await sel.boundingBox();
      await moverPuntero(page, c.x + c.width / 2, c.y + c.height / 2, 380);
      await pulsar(page);
      const titulo = await page.evaluate(() => document.querySelector("main h1")?.textContent ?? "");
      await sel.selectOption("es");
      const cambio = await page.waitForFunction((t) => (document.querySelector("main h1")?.textContent ?? "") !== t, titulo, { timeout: 5000 }).then(() => true).catch(() => false);
      check("tablero: al elegir español cambia el título de la portada", cambio);
      // El anillo pasa al título de la página, ya en español.
      await page.evaluate(() => {
        const h = document.querySelector("main h1");
        if (h) window.__grabacionResaltarElementos([[h]], { margen: 10 });
      });
      await moverPuntero(page, c.x - 120, c.y + c.height + 70, 420);
      return { encuadre: e, resaltado: "si" };
    },
    // La portada vuelve al inglés: el idioma elegido se guarda y lo demás del video va en inglés.
    async despues(page) {
      await page.evaluate(() => window.__grabacionQuitarResaltado());
      await ponerIdioma(page, "en");
      await page.waitForTimeout(400);
    },
  });
  // ---- Less rain, Pilot areas y Rainfall record (solo en el recorrido): lo que el tablero hace con la lluvia y
  //      con las dos zonas piloto. Los tres golpes dejan la portada como estaba.
  const caja = (page, selector) =>
    page.evaluate((sel) => {
      const n = document.querySelector(sel);
      if (!n) return null;
      const r = n.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }, selector);
  /** Deja la portada en el resumen, con la dotación con que abrió, la lluvia del registro y la zona pedida. */
  const dejarComoAbrio = (page, { lluvia = false, zona = null } = {}) =>
    page.evaluate(
      ([dotacion, conMenosLluvia, zonaPedida]) => {
        window.__grabacionQuitarResaltado();
        const evento = (n, tipo) => n.dispatchEvent(new Event(tipo, { bubbles: true }));
        if (location.hash && location.hash !== "#resumen") location.hash = "#resumen";
        const d = document.querySelector("#allocation");
        if (d && dotacion != null && d.value !== dotacion) {
          d.value = dotacion;
          evento(d, "input");
          evento(d, "change");
        }
        const c = document.querySelector("#rain");
        if (c && c.checked !== conMenosLluvia) c.click();
        const z = document.querySelector("#zona-dashboard");
        if (z && zonaPedida && z.value !== zonaPedida) {
          z.value = zonaPedida;
          evento(z, "change");
        }
        window.scrollTo(0, 0);
      },
      [dotacionInicial, lluvia, zona],
    );
  let zonaInicial = null;

  lista.push({
    toma: "lluvia", parte: 0.5, nombre: "tablero: la casilla de menos lluvia; cambia el indicador del agua comprometida",
    async prep(page) {
      zonaInicial = await page.evaluate(() => document.querySelector("#zona-dashboard")?.value ?? null);
      await dejarComoAbrio(page);
      await page.evaluate((alto) => {
        const d = document.querySelector("#allocation");
        if (!d) return;
        const t = d.closest("article") ?? d.parentElement;
        window.scrollBy(0, t.getBoundingClientRect().bottom - (alto - 110));
      }, VIEWPORT.height);
      await page.waitForTimeout(900);
      const e = await estructura(page);
      if (e) await moverPuntero(page, e.tarjeta.x + e.tarjeta.w + 140, e.tarjeta.y + 60, 0);
    },
    async accion(page, reloj) {
      const antes = await estructura(page);
      const casilla = await caja(page, "#rain");
      if (!antes || !casilla) {
        check("tablero: la portada trae la casilla de menos lluvia (#rain)", false);
        return { encuadre: encuadre({ ancho: VIEWPORT.width, x: 0, y: 0 }), resaltado: "no" };
      }
      const t = antes.tarjeta;
      const ancho = Math.max(900, t.w * 2.4);
      const e = encuadre({ ancho, x: t.x - 26, y: t.y + t.h + 14 - ancho / ASPECTO });
      await page.evaluate(() => {
        const c = document.querySelector("#rain");
        window.__grabacionResaltarElementos([[c.closest("label") ?? c]], { margen: 8 });
      });
      await reloj.hasta(0.18);
      await moverPuntero(page, casilla.x + casilla.w / 2, casilla.y + casilla.h / 2, 380);
      await pulsar(page);
      const dice = await page.evaluate(() => document.querySelector("#water-commitment")?.innerText ?? "");
      await page.mouse.click(casilla.x + casilla.w / 2, casilla.y + casilla.h / 2);
      const cambio = await page
        .waitForFunction((a) => (document.querySelector("#water-commitment")?.innerText ?? "") !== a, dice, { timeout: 5000 })
        .then(() => true)
        .catch(() => false);
      check("tablero: con menos lluvia cambia el indicador del agua comprometida", cambio && (await page.evaluate(() => document.querySelector("#rain").checked)));
      await page.evaluate(() => {
        const c = document.querySelector("#rain");
        const w = document.querySelector("#water-commitment");
        window.__grabacionResaltarElementos([[c.closest("label") ?? c], ...(w ? [[w]] : [])], { margen: 8 });
      });
      await page.mouse.move(1, VIEWPORT.height - 1);
      await moverPuntero(page, t.x + t.w + 150, t.y + t.h * 0.5, 420);
      return { encuadre: e, resaltado: "si" };
    },
  });

  /** Lleva el bloque «lado a lado» del resumen arriba de la ventana y devuelve su encuadre (null si la página no lo trae). */
  const encuadrarBloque = async (page) => {
    await page.evaluate(() => {
      window.__grabacionQuitarResaltado();
      const b = document.querySelector(".rain-compare");
      if (b) window.scrollBy(0, b.getBoundingClientRect().top - 64);
    });
    await page.waitForTimeout(700);
    const b = await caja(page, ".rain-compare");
    return b ? { bloque: b, e: encuadre({ ancho: Math.min(VIEWPORT.width, b.w + 56), x: b.x - 28, y: b.y - 14 }) } : null;
  };
  let delBloque = null;
  lista.push({
    toma: "lluvia", parte: 0.5, nombre: "tablero: zonas y opciones lado a lado; la barra de menos lluvia va resaltada",
    async prep(page) {
      delBloque = await encuadrarBloque(page);
      const z = await caja(page, "#lado-zonas");
      if (z) await moverPuntero(page, z.x + z.w * 0.5, z.y + 30, 0);
    },
    async accion(page, reloj) {
      if (!delBloque) {
        check("tablero: el resumen trae el bloque de zonas y opciones lado a lado (.rain-compare)", false);
        return { encuadre: encuadre({ ancho: VIEWPORT.width, x: 0, y: 0 }), resaltado: "no" };
      }
      // Primero, la zona en uso con su barra de menos lluvia; después, las opciones de la parcela con la suya.
      await page.evaluate(() => {
        const zona = document.querySelector('#lado-zonas [data-zona][aria-pressed="true"]');
        window.__grabacionResaltarElementos([[...zona.querySelectorAll(".lado-barra")]], { margen: 8 });
      });
      await reloj.hasta(0.5);
      const o = await caja(page, "#lado-opciones");
      if (o) await moverPuntero(page, o.x + o.w * 0.45, o.y + 70, 520);
      await page.evaluate(() => {
        const fila = document.querySelector("#lado-opciones .lado-fila");
        if (fila) window.__grabacionResaltarElementos([[...fila.querySelectorAll(".lado-barra")]], { margen: 8 });
      });
      return { encuadre: delBloque.e, resaltado: "si" };
    },
  });

  lista.push({
    toma: "zonas", parte: 1, nombre: "tablero: elegir la otra zona piloto en el bloque; cambian las opciones de la parcela",
    async prep(page) {
      await dejarComoAbrio(page, { zona: zonaInicial });
      await page.waitForTimeout(500);
      delBloque = await encuadrarBloque(page);
      const z = await caja(page, "#lado-zonas");
      if (z) await moverPuntero(page, z.x + z.w + 60, z.y + 40, 0);
    },
    async accion(page, reloj) {
      const otra = await caja(page, '#lado-zonas [data-zona][aria-pressed="false"]');
      if (!delBloque || !otra) {
        check("tablero: el bloque lado a lado ofrece otra zona piloto para elegir", false);
        return { encuadre: encuadre({ ancho: VIEWPORT.width, x: 0, y: 0 }), resaltado: "no" };
      }
      await page.evaluate(() => {
        window.__grabacionResaltarElementos([[document.querySelector('#lado-zonas [data-zona][aria-pressed="false"]')]], { margen: 6 });
      });
      await reloj.hasta(0.2);
      const punto = { x: otra.x + otra.w * 0.62, y: otra.y + 34 };
      await moverPuntero(page, punto.x, punto.y, 420);
      await pulsar(page);
      const titulo = await page.evaluate(() => document.querySelector("#lado-opciones-titulo")?.textContent ?? "");
      await page.mouse.click(punto.x, punto.y);
      const cambio = await page
        .waitForFunction((t) => (document.querySelector("#lado-opciones-titulo")?.textContent ?? "") !== t, titulo, { timeout: 6000 })
        .then(() => true)
        .catch(() => false);
      check("tablero: al elegir la otra zona en el bloque cambian las opciones de la parcela", cambio);
      // El anillo pasa a la zona elegida y a las opciones de su parcela.
      await page.evaluate(() => {
        const zona = document.querySelector('#lado-zonas [data-zona][aria-pressed="true"]');
        const fila = document.querySelector("#lado-opciones .lado-fila");
        window.__grabacionResaltarElementos([[zona], [document.querySelector("#lado-opciones-titulo"), ...(fila ? [fila] : [])]], { margen: 6 });
      });
      const o = await caja(page, "#lado-opciones");
      if (o) await moverPuntero(page, o.x + o.w * 0.4, o.y + 90, 480);
      return { encuadre: delBloque.e, resaltado: "si" };
    },
    async despues(page) {
      await dejarComoAbrio(page, { zona: zonaInicial });
      await page.waitForTimeout(500);
    },
  });

  lista.push({
    toma: "historia", parte: 1, nombre: "tablero: el rango histórico de lluvia de NASA POWER y su comprobación año por año",
    async prep(page) {
      await page.evaluate(() => {
        window.__grabacionQuitarResaltado();
        location.hash = "#predicciones";
      });
      await page.waitForSelector(".climate-chart", { timeout: 15000 }).catch(() => {});
      await page.evaluate(() => {
        window.scrollTo(0, 0);
        const a = document.querySelector("#forecast-analysis");
        if (a) window.scrollBy(0, a.getBoundingClientRect().top - 56);
      });
      await page.waitForTimeout(800);
      await moverPuntero(page, VIEWPORT.width * 0.55, 150, 0);
    },
    async accion(page, reloj) {
      const a = await caja(page, "#forecast-analysis");
      if (!a || !(await caja(page, ".climate-chart"))) {
        check("tablero: la vista de la historia trae la gráfica de la comprobación de lluvia", false);
        return { encuadre: encuadre({ ancho: VIEWPORT.width, x: 0, y: 0 }), resaltado: "no" };
      }
      const e = encuadre({ ancho: Math.min(VIEWPORT.width, a.w + 56), x: a.x - 28, y: 30 });
      // Primero, las tres cifras del registro; después la página baja a la gráfica y el anillo pasa a ella.
      await page.evaluate(() => {
        const cifras = [...document.querySelectorAll(".forecast-metrics .card")];
        if (cifras.length) window.__grabacionResaltarElementos(cifras.map((n) => [n]), { margen: 4 });
      });
      await reloj.hasta(0.42);
      await page.evaluate(() => {
        window.__grabacionQuitarResaltado();
        const g = document.querySelector(".climate-chart");
        window.scrollBy({ top: g.getBoundingClientRect().top - 110, behavior: "smooth" });
      });
      await page.waitForTimeout(750);
      await page.evaluate(() => window.__grabacionResaltarElementos([[document.querySelector(".climate-chart")]], { margen: 4 }));
      const g = await caja(page, ".climate-chart");
      await moverPuntero(page, g.x + g.w * 0.2, g.y + g.h * 0.5, 0);
      await moverPuntero(page, g.x + g.w * 0.8, g.y + g.h * 0.45, 900);
      return { encuadre: e, resaltado: "si" };
    },
    async despues(page) {
      await dejarComoAbrio(page, { zona: zonaInicial });
      await page.waitForTimeout(400);
    },
  });
  return lista;
}

// ---------------------------------------------------------------- 5. tarjetas y bandas (docs/pitch/video/tarjetas.html)
/** ¿La aplicación se instala y abre sin conexión? Se dice en el cierre solo si el repo lo trae (manifest y worker). */
function esAplicacionInstalable() {
  try {
    const m = JSON.parse(fs.readFileSync(path.join(WEB, "manifest.webmanifest"), "utf-8"));
    return m.display === "standalone" && fs.existsSync(path.join(WEB, "sw.js"));
  } catch {
    return false;
  }
}

/**
 * Captura las tarjetas (1920 × 1080) y la banda de cada toma de la página (1920 × BANDA) como PNG, y revisa su texto
 * dibujado: sin dígitos ni palabras prohibidas, el aviso de juicio y la liga en el cierre, y que cada banda quepa.
 */
async function capturarTarjetas(navegador, baseLocal, cues) {
  const ctx = await navegador.newContext({ viewport: { width: LIENZO.ancho, height: LIENZO.alto }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const abrir = async (parametros, alto) => {
    await page.setViewportSize({ width: LIENZO.ancho, height: alto });
    await page.goto(`${baseLocal}/__repo__/${TARJETAS}?${new URLSearchParams(parametros)}`, { waitUntil: "load" });
    await page.waitForSelector("body[data-tarjeta='lista']", { timeout: 10000 });
    const fuente = await page.evaluate(() => document.fonts.check('700 40px "Atkinson Hyperlegible"'));
    if (!fuente) throw new Error("la tarjeta no cargó Atkinson Hyperlegible de web/vendor/");
  };
  /** Texto dibujado de la vista abierta, sin la liga (una dirección no es una cifra). */
  const texto = () =>
    page.evaluate(() => {
      const v = document.querySelector("[data-vista]:not([hidden])").cloneNode(true);
      v.querySelectorAll('[data-campo="liga"], [hidden], svg').forEach((n) => n.remove());
      return v.textContent.replace(/\s+/g, " ").trim();
    });
  const imagenes = { secuencias: {} };
  const manifiesto = fs.readFileSync(path.join(WEB, "data", "manifest.json"), "utf-8");
  for (const [i, toma] of TOMAS.entries()) {
    const c = cues[i];
    const archivo = path.join(TEMPORAL, `toma_${i + 1}.png`);
    if (toma.tipo === "tarjeta") {
      const parametros = { vista: toma.vista };
      if (toma.vista === "apertura") parametros.lema = c.texto;
      // Los nombres de los integrantes no están en el repo: quien graba los da con RAIZ_INTEGRANTES.
      if (toma.vista === "equipo" && process.env.RAIZ_INTEGRANTES) parametros.integrantes = process.env.RAIZ_INTEGRANTES;
      if (toma.vista === "cierre") Object.assign(parametros, { frase: c.texto, liga: LIGA.replace(/^https?:\/\//, "").replace(/\/$/, ""), app: esAplicacionInstalable() ? "si" : "no" });
      await abrir(parametros, LIENZO.alto);
      // Para leer el texto y medir si cabe: el estado final de la animación.
      await page.evaluate(() => window.__tarjetaIr(600000));
      const t = await texto();
      const problemas = problemasDeTexto(t);
      // Nada se sale de la tarjeta.
      const cabe = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= window.innerHeight);
      check(`tarjeta «${toma.vista}»: sin dígitos ni palabras prohibidas, y cabe en el cuadro`, !problemas.length && cabe, problemas.join(", ") || t);
      if (toma.vista === "apertura") check("tarjeta «apertura»: nombre, lema del guion, equipo y reto", ["ROOT – From Dam to Root", c.texto, "Orbital Farming", "Field Shift: Adapting Farms with NASA Data"].every((s) => t.includes(s)));
      if (toma.vista === "como") {
        // Los productos de NASA que nombra la tarjeta deben estar en el manifiesto de datos de la página.
        const productos = await page.locator('[data-vista="como"] [data-producto]').evaluateAll((ns) => ns.map((n) => n.dataset.producto));
        const faltan = productos.filter((p) => !manifiesto.includes(p));
        check("tarjeta «como»: cada producto de NASA que nombra está en web/data/manifest.json", productos.length > 0 && !faltan.length, faltan.length ? `faltan: ${faltan.join(", ")}` : productos.join(", "));
        // El dato de la agencia socia (Sentinel de Copernicus, ESA, dentro de HLS) debe estar en el README.
        const socios = await page.locator('[data-vista="como"] [data-socio]').evaluateAll((ns) => ns.map((n) => n.dataset.socio));
        const leemeComo = fs.readFileSync(path.join(RAIZ, "README.md"), "utf-8");
        check("tarjeta «como»: el dato de la agencia socia que nombra está en el README", socios.length > 0 && socios.every((x) => leemeComo.includes(x)), socios.join(", "));
      }
      if (toma.vista === "equipo") check("tarjeta «equipo»: el nombre del equipo y su sede", ["Orbital Farming", "Chihuahua, Mexico"].every((x) => t.includes(x)));
      if (toma.vista === "reto") check("tarjeta «reto»: el reto elegido y lo que llevó a elegirlo", t.includes("Field Shift: Adapting Farms with NASA Data") && t.includes("What inspired us"));
      if (toma.vista === "futuro") {
        // La visión va rotulada como tal y en condicional: no es una promesa (CLAUDE.md, regla 10).
        const frases = await page.locator('[data-vista="futuro"] .vision li').allInnerTexts();
        check("tarjeta «futuro»: rotulada «Next phase / vision» y cada frase en condicional («could»)", t.includes("Next phase / vision") && frases.length > 0 && frases.every((f) => /\bcould\b/.test(f)), `${frases.length} frases`);
      }
      if (toma.vista === "aparte") {
        // Cada seña de la tarjeta describe algo que la página ya hace: el README debe seguir diciéndolo.
        const leeme = fs.readFileSync(path.join(RAIZ, "README.md"), "utf-8");
        const sostenes = ["Fields of The World neural network", "Nutrient notes", "Follow the drop", "SoilGrids", "planting window", "frost dates", "runoff routes per area", "One MERRA-2 cell", "Random Forest (machine learning): not run"];
        const faltan = sostenes.filter((x) => !leeme.includes(x));
        const senas = await page.locator('[data-vista="aparte"] .sena').count();
        check("tarjeta «aparte»: nueve señas, y el README sostiene lo que dicen (suelo, suministro, siembra y heladas, clima por zona, red neuronal)", senas === 9 && !faltan.length, faltan.length ? `el README ya no dice: ${faltan.join(" · ")}` : `${senas} señas`);
        // La seña de aprendizaje automático habla de los límites de parcela (red neuronal de terceros), no del mapa de cultivos.
        check("tarjeta «aparte»: el aprendizaje automático se atribuye a los límites de parcela, no al mapa de cultivos", /Machine-learning field map/.test(t) && /Boundaries from a neural network/.test(t));
      }
      if (toma.vista === "cierre") {
        const liga = await page.locator('[data-vista="cierre"] [data-campo="liga"]').innerText();
        check("tarjeta «cierre»: frase del guion, aviso de juicio y liga pública", t.includes(c.texto) && t.includes(AVISO_JUICIO) && LIGA.includes(liga.trim()), liga.trim());
      }
      // La tarjeta es animada: se captura cuadro por cuadro, llevando sus animaciones al instante de cada cuadro.
      const cuadros = Math.round(c.fin * FPS) - Math.round(c.ini * FPS) + ANTICIPO_CUADROS;
      const carpeta = path.join(TEMPORAL, `tarjeta_${i + 1}`);
      fs.mkdirSync(carpeta, { recursive: true });
      const animaciones = await page.evaluate(() => document.getAnimations().length);
      for (let f = 0; f < cuadros; f += 1) {
        await page.evaluate((ms) => window.__tarjetaIr(ms), (f * 1000) / FPS);
        await page.screenshot({ path: path.join(carpeta, `c_${String(f).padStart(4, "0")}.jpg`), type: "jpeg", quality: 96 });
      }
      const primero = fs.statSync(path.join(carpeta, "c_0000.jpg")).size;
      const ultimo = fs.statSync(path.join(carpeta, `c_${String(cuadros - 1).padStart(4, "0")}.jpg`)).size;
      check(`tarjeta «${toma.vista}»: animada (${animaciones} animaciones) y capturada cuadro por cuadro`, animaciones > 0 && primero !== ultimo, `${cuadros} cuadros`);
      imagenes.secuencias[i] = path.join(carpeta, "c_%04d.jpg");
    } else {
      await abrir({ vista: "banda", rotulo: toma.rotulo, texto: c.texto }, BANDA);
      const medida = await page.evaluate(() => {
        const t = document.querySelector(".banda-texto");
        const lineas = Math.round(t.getBoundingClientRect().height / parseFloat(getComputedStyle(t).lineHeight));
        const b = document.querySelector(".banda");
        return { lineas, cabe: b.scrollHeight <= b.clientHeight && b.scrollWidth <= b.clientWidth };
      });
      check(`banda de la toma ${i + 1}: el subtítulo cabe en una o dos líneas`, medida.cabe && medida.lineas <= 2, `${medida.lineas} línea(s) · ${toma.rotulo}`);
    }
    await page.screenshot({ path: archivo });
    imagenes[i] = archivo;
  }
  await ctx.close();
  return imagenes;
}

// ---------------------------------------------------------------- 6. exportar con ffmpeg
function correr(programa, args) {
  return execFileSync(programa, args, { cwd: TEMPORAL, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
}
function duracion(archivo) {
  return Number(correr(FFPROBE, ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", archivo]).trim());
}
const par = (v) => Math.round(v / 2) * 2;

/**
 * Montaje: en el orden del guion. Cada tarjeta es su secuencia de cuadros (animada) y dura su subtítulo; cada toma de
 * la página se arma con sus tramos (cortes limpios entre ellos: son la acción y su resultado), recortados a su
 * encuadre, con un acercamiento lento, sobre el lienzo y con su banda, que sube y aparece. Las tomas se unen con
 * transiciones: la que entra espera en su primer cuadro mientras dura la transición, así cada acción sigue empezando
 * en el instante de su subtítulo y el video dura lo mismo. Devuelve el tamaño en MB y la lista de piezas con su lugar
 * en el video (para los fotogramas).
 */
function exportar(webm, cues, tramos, imagenes, crf, escala) {
  const entradas = [];
  const filtros = [];
  const piezas = []; // { nombre, ini, dur }
  const tomas = []; // { etiqueta, ini, cuadros, tipo }
  const cuantas = () => entradas.filter((a) => a === "-i").length;
  // Lo que dura la transición con que entra cada toma (0 en la primera): en cuadros enteros.
  const transicionDe = (a, b) =>
    a.tipo === "tarjeta" && b.tipo === "tarjeta" ? TRANSICION.tarjetas : a.tipo === "tarjeta" ? TRANSICION.entrar : b.tipo === "tarjeta" ? TRANSICION.salir : TRANSICION.golpes;
  const cuadrosDe = (i) => Math.round(cues[i].fin * FPS) - Math.round(cues[i].ini * FPS);
  const entra = TOMAS.map((toma, i) => {
    if (i === 0) return { tipo: null, cuadros: 0 };
    const tr = transicionDe(TOMAS[i - 1], toma);
    return { tipo: tr.tipo, cuadros: Math.min(Math.round(tr.dur * FPS), Math.floor(cuadrosDe(i - 1) / 2), ANTICIPO_CUADROS) };
  });
  let cuadrosAntes = 0;
  for (const [i, toma] of TOMAS.entries()) {
    const c = cues[i];
    const cuadros = Math.round(c.fin * FPS) - Math.round(c.ini * FPS);
    const ini = cuadrosAntes / FPS;
    if (toma.tipo === "tarjeta") {
      // La tarjeta que entra por una transición trae al principio los cuadros de esa transición: ya se está animando.
      const conAnticipo = cuadros + entra[i].cuadros;
      entradas.push("-framerate", String(FPS), "-i", imagenes.secuencias[i]);
      const k = cuantas() - 1;
      filtros.push(
        `[${k}:v]fps=${FPS},scale=${LIENZO.ancho}:${LIENZO.alto},setsar=1,tpad=stop_mode=clone:stop_duration=1,` +
          `trim=end_frame=${conAnticipo},setpts=PTS-STARTPTS,format=yuv420p,fps=${FPS}[t${i}]`,
      );
      piezas.push({ nombre: `toma_${i + 1}_${toma.vista}`, ini, dur: cuadros / FPS });
      tomas.push({ etiqueta: `t${i}`, ini, cuadros, tipo: "tarjeta" });
      cuadrosAntes += cuadros;
      continue;
    }
    const suyos = tramos.filter((t) => t.toma === toma.clave);
    if (!suyos.length) throw new Error(`la toma «${toma.clave}» no tiene tramos grabados`);
    let usados = 0;
    const partes = [];
    for (const [j, t] of suyos.entries()) {
      // El último tramo de la toma se lleva los cuadros que falten: la toma dura exactamente su subtítulo.
      const n = j === suyos.length - 1 ? cuadros - usados : Math.round((cuadros * t.parte) / suyos.reduce((s, x) => s + x.parte, 0));
      usados += n;
      const dur = n / FPS;
      entradas.push("-ss", t.inicio.toFixed(3), "-t", (dur + 0.4).toFixed(3), "-i", webm);
      const k = cuantas() - 1;
      const e = t.encuadre;
      const w = Math.min(par(e.w * escala), Math.floor((VIEWPORT.width * escala) / 2) * 2);
      const h = Math.min(par(e.h * escala), Math.floor((VIEWPORT.height * escala) / 2) * 2);
      const x = limitar(Math.round(e.x * escala), 0, Math.floor(VIEWPORT.width * escala) - w);
      const y = limitar(Math.round(e.y * escala), 0, Math.floor(VIEWPORT.height * escala) - h);
      // Acercamiento lento hacia el centro del encuadre (al doble de tamaño y de vuelta: movimiento sin temblor).
      const acercar = (ACERCAR_POR_S * dur).toFixed(4);
      filtros.push(
        `[${k}:v]fps=${FPS},crop=${w}:${h}:${x}:${y},scale=${PAGINA.ancho * SUPERMUESTREO}:${PAGINA.alto * SUPERMUESTREO}:flags=lanczos,setsar=1,` +
          `tpad=stop_mode=clone:stop_duration=1,trim=end_frame=${n},setpts=PTS-STARTPTS,` +
          `zoompan=z='1+${acercar}*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${PAGINA.ancho}x${PAGINA.alto}:fps=${FPS},` +
          `setsar=1,format=yuv420p[g${i}_${j}]`,
      );
      partes.push(`[g${i}_${j}]`);
      piezas.push({ nombre: `toma_${i + 1}_${toma.clave}_${String.fromCharCode(97 + j)}`, ini: cuadrosAntes / FPS, dur });
      cuadrosAntes += n;
    }
    // La toma completa sobre el lienzo, con su banda: la banda aparece y sube a su lugar al empezar la toma.
    entradas.push("-loop", "1", "-framerate", String(FPS), "-t", (cuadros / FPS + 1).toFixed(3), "-i", imagenes[i]);
    const kb = cuantas() - 1;
    filtros.push(`${partes.join("")}concat=n=${partes.length}:v=1:a=0,pad=${LIENZO.ancho}:${LIENZO.alto}:0:0:color=${FONDO}[pg${i}]`);
    filtros.push(`[${kb}:v]fps=${FPS},format=rgba,fade=t=in:st=0.04:d=${BANDA_ENTRA_S}:alpha=1[b${i}]`);
    filtros.push(
      `[pg${i}][b${i}]overlay=x=0:y='${PAGINA.alto}+${BANDA_SUBE_PX}*(1-min(t/${(BANDA_ENTRA_S + 0.04).toFixed(2)},1))*(1-min(t/${(BANDA_ENTRA_S + 0.04).toFixed(2)},1))':eof_action=repeat,` +
        `trim=end_frame=${cuadros},setpts=PTS-STARTPTS,format=yuv420p,fps=${FPS}[t${i}]`,
    );
    tomas.push({ etiqueta: `t${i}`, ini, cuadros, tipo: "pagina" });
  }
  // Transiciones entre tomas. Una toma de la página espera en su primer cuadro lo que dura la transición; una
  // tarjeta ya trae esos cuadros al principio (su animación corre mientras entra).
  let actual = tomas[0].etiqueta;
  let salida = 0; // lo que dura la última transición (hacia el cierre)
  for (let i = 1; i < tomas.length; i += 1) {
    const d = entra[i].cuadros / FPS;
    if (tomas[i].tipo === "tarjeta") filtros.push(`[${tomas[i].etiqueta}]fps=${FPS}[r${i}]`);
    else filtros.push(`[${tomas[i].etiqueta}]tpad=start_mode=clone:start_duration=${d.toFixed(3)},fps=${FPS}[r${i}]`);
    filtros.push(`[${actual}][r${i}]xfade=transition=${entra[i].tipo}:duration=${d.toFixed(3)}:offset=${(tomas[i].ini - d).toFixed(3)}[x${i}]`);
    actual = `x${i}`;
    if (tomas[i].tipo === "tarjeta" && tomas[i - 1].tipo === "pagina") salida = d;
  }
  // Barra de avance: crece bajo la página mientras duran los golpes (del primero al último).
  const deLaPagina = tomas.filter((t) => t.tipo === "pagina");
  const total = cuadrosAntes / FPS;
  if (deLaPagina.length) {
    const t0 = deLaPagina[0].ini;
    const ultima = deLaPagina.at(-1);
    const t1 = ultima.ini + ultima.cuadros / FPS - salida;
    entradas.push("-f", "lavfi", "-i", `color=c=${BARRA.color}:s=${LIENZO.ancho}x${BARRA.alto}:r=${FPS}`);
    const kbarra = cuantas() - 1;
    filtros.push(
      `[${actual}][${kbarra}:v]overlay=x='-w+w*(t-${t0.toFixed(3)})/${(t1 - t0).toFixed(3)}':y=${PAGINA.alto}:enable='between(t,${t0.toFixed(3)},${t1.toFixed(3)})':shortest=1[conbarra]`,
    );
    actual = "conbarra";
  }
  filtros.push(`[${actual}]fade=t=in:st=0:d=${ENTRADA_S}:color=${FONDO},format=yuv420p[v]`);
  const audio = cuantas();
  correr(FFMPEG, [
    "-hide_banner", "-loglevel", "error", "-y",
    ...entradas,
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000",
    "-filter_complex", filtros.join(";"),
    "-map", "[v]", "-map", `${audio}:a`,
    "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-r", String(FPS), "-g", String(FPS * 2),
    "-c:a", "aac", "-b:a", "64k",
    "-t", total.toFixed(3), "-movflags", "+faststart",
    MP4,
  ]);
  console.log(`Montaje: ${piezas.length} piezas en ${tomas.length} tomas, ${tomas.length - 1} transiciones; CRF ${crf}.`);
  return { tam: fs.statSync(MP4).size / 1e6, piezas };
}

/**
 * ¿La grabación llena su cuadro? Si el navegador no aplicó la escala de dispositivo, Playwright deja la página en la
 * esquina superior izquierda y rellena el resto de un gris uniforme: se mira si el cuarto inferior derecho de un
 * cuadro tiene algo dibujado (la página nunca es de un solo tono ahí).
 */
function grabacionLlenaElCuadro(webm, segundo) {
  const salida = execFileSync(FFMPEG, ["-hide_banner", "-y", "-ss", segundo.toFixed(2), "-i", webm, "-frames:v", "1",
    "-vf", "crop=iw/2:ih/2:iw/2:ih/2,signalstats,metadata=print:file=-", "-f", "null", "-"], { cwd: TEMPORAL, encoding: "utf-8", stdio: ["ignore", "pipe", "pipe"] });
  const dato = (k) => Number(new RegExp(`signalstats\\.${k}=(\\d+)`).exec(salida)?.[1]);
  const min = dato("YMIN");
  const max = dato("YMAX");
  return Number.isFinite(min) && Number.isFinite(max) && max - min > 8;
}

/** Un fotograma de cada pieza, al 80 % de su duración (con su acción ya terminada). */
function extraerFotogramas(piezas) {
  fs.mkdirSync(FOTOGRAMAS, { recursive: true });
  const rutas = [];
  for (const p of piezas) {
    const t = p.ini + p.dur * 0.8;
    const ruta = path.join(FOTOGRAMAS, `${p.nombre}.png`);
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
  const cues = leerGuion();
  revisarGuion(cues);
  if (cues.length !== TOMAS.length) return terminar();
  for (const prog of [FFMPEG, FFPROBE]) {
    try {
      correr(prog, ["-version"]);
    } catch {
      check(`${prog} disponible`, false, "instale ffmpeg o indique FFMPEG/FFPROBE");
      return terminar();
    }
  }

  const srv = await servidor(); // siempre: de aquí salen las tarjetas (y la página, si no hay RAIZ_URL)
  const baseLocal = `http://127.0.0.1:${srv.address().port}`;
  const raiz = process.env.RAIZ_URL ?? `${baseLocal}/index.html`;
  // El navegador se lanza dentro del try: si falla el arranque, el finally cierra el servidor y el proceso termina.
  let navegador = null;
  let webm = null;
  let imagenes = null;
  const tramos = []; // { toma, parte, nombre, inicio (s de la grabación), encuadre }
  try {
    // Las tarjetas, con un navegador a escala 1 (salen a 1920 × 1080 exactos); la página, con otro a escala ESCALA.
    const navegadorTarjetas = await chromium.launch();
    try {
      imagenes = await capturarTarjetas(navegadorTarjetas, baseLocal, cues);
    } finally {
      await navegadorTarjetas.close();
    }
    navegador = await chromium.launch({ args: [`--force-device-scale-factor=${ESCALA}`] });

    const ctx = await navegador.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: ESCALA,
      locale: "en-US",
      reducedMotion: "no-preference", // SIN movimiento reducido (guion §6): gotas y reproducción
      serviceWorkers: "block", // la página de hoy, no una copia guardada por el worker
      recordVideo: { dir: TEMPORAL, size: GRABACION },
    });
    await ctx.addInitScript((llave) => {
      try {
        window.sessionStorage.setItem(llave, "cerrado"); // pantalla de inicio cerrada (guion §6)
      } catch {
        // sin almacenamiento: la pantalla aparecería
      }
    }, LLAVE_INICIO);

    // ¿Dónde está el explorador de parcelas? En explorer.html si existe; si no, en la raíz. Sin leer textos.
    const urlExplorer = new URL("explorer.html", raiz).href;
    const hayExplorer = process.env.RAIZ_URL
      ? await ctx.request.get(urlExplorer).then((r) => r.ok() && /html/.test(r.headers()["content-type"] ?? "")).catch(() => false)
      : fs.existsSync(path.join(WEB, "explorer.html"));
    const explorador = hayExplorer ? urlExplorer : raiz;
    console.log(`Raíz: ${raiz}\nExplorador de parcelas: ${explorador}`);

    const t0 = Date.now(); // la grabación empieza al crear la página
    const page = await ctx.newPage();
    const errores = [];
    page.on("pageerror", (e) => errores.push(e.message));

    /** Graba un tramo: preparación fuera de cámara, acción en cámara y espera hasta el final de su duración. */
    const grabar = async (def) => {
      const c = cues[TOMAS.findIndex((t) => t.clave === def.toma)];
      const dur = (c.fin - c.ini) * def.parte;
      await def.prep(page);
      await page.waitForTimeout(ASENTAR_MS); // que la grabación ya traiga el estado que dejó la preparación
      // Reloj del tramo: hasta(f) espera a que pase la fracción f de su duración (el ritmo no depende de la máquina).
      const inicio = Date.now();
      const reloj = {
        dur, // segundos del tramo
        hasta: async (f) => {
          const falta = inicio + f * dur * 1000 - Date.now();
          if (falta > 0) await page.waitForTimeout(falta);
        },
      };
      const r = (await def.accion(page, reloj)) ?? {};
      const finAccion = Date.now();
      const usado = (finAccion - inicio) / 1000;
      // Dónde cae el tramo en el reloj. Por omisión empieza con su acción. Si la acción pide cortar en un instante
      // (cortarEn: el clic), el tramo termina ahí. Si el resultado no alcanzaría a verse SOSTEN_MS (o hasta el
      // instante verHasta que diga la acción), el tramo se recorre hacia adelante: se pierde el principio, no el resultado.
      let desde = inicio;
      if (r.cortarEn) desde = r.cortarEn - dur * 1000;
      else {
        const verHasta = r.verHasta ?? finAccion + SOSTEN_MS;
        if (verHasta > inicio + dur * 1000) {
          desde = verHasta - dur * 1000;
          aviso(`el tramo «${def.nombre}» empieza ${((desde - inicio) / 1000).toFixed(2)} s después de su acción para que el resultado quede a la vista`);
        }
      }
      const fin = desde + dur * 1000 + 160;
      if (fin > Date.now()) await page.waitForTimeout(fin - Date.now());
      // El resaltado, medido al final del tramo, debe quedar dentro del encuadre.
      const vistos = await anillos(page);
      if (r.resaltado === "si") {
        check(`tramo «${def.toma}» (${def.nombre}): el resaltado queda dentro del encuadre`,
          vistos.length > 0 && vistos.every((a) => dentro(a, r.encuadre)), `${vistos.length} anillo(s) a la vista`);
      }
      // Ancla visual: un punto del borde izquierdo del primer anillo y el intervalo del reloj en que hay que buscarlo.
      const ancla = r.anclaVisual && vistos.length
        ? { x: vistos[0].x, y: vistos[0].y + vistos[0].h / 2, antes: r.anclaVisual.antes, buscarDesde: (inicio - t0) / 1000, buscarHasta: (Date.now() - t0) / 1000 }
        : null;
      tramos.push({ toma: def.toma, parte: def.parte, nombre: def.nombre, inicio: (desde - t0) / 1000, encuadre: r.encuadre, ancla });
      if (def.despues) await def.despues(page); // fuera de cámara: deja la página como la necesita lo que sigue
      console.log(`tramo · ${def.toma} · ${def.nombre} · empieza a los ${((desde - t0) / 1000).toFixed(2)} s del reloj · acción ${usado.toFixed(2)} s de ${dur.toFixed(2)} s`);
    };

    // La portada: si la raíz es el tablero (carga js/dashboard.js) y llega a «listo», el primer golpe se graba ahí.
    const pedidas = new Set(TOMAS.filter((t) => t.tipo === "pagina").map((t) => t.clave)); // las tomas de este video
    let dotacionEnTablero = false;
    if (hayExplorer) {
      const urlTablero = new URL(raiz);
      urlTablero.searchParams.set("lang", "en");
      await page.goto(urlTablero.href, { waitUntil: "load" });
      const esTablero = await page.evaluate(() => Boolean(document.querySelector('script[src*="dashboard"]')) || document.body.hasAttribute("data-dashboard"));
      if (esTablero) {
        const listo = await page.waitForSelector("body[data-dashboard='listo']", { timeout: 20000 }).then(() => true).catch(() => false);
        if (listo) {
          await instalarAyudas(page);
          for (const def of tramosDelTablero()) if (pedidas.has(def.toma)) await grabar(def);
          dotacionEnTablero = true;
        } else aviso("el tablero no llegó a data-dashboard=\"listo\" a tiempo: el golpe de la dotación se graba en el explorador");
      }
    }
    console.log(`«Set the water» se graba en ${dotacionEnTablero ? "el tablero (portada)" : "el explorador"}.`);

    // El explorador, con su mapa listo. Sin red, a veces una petición del mapa base se queda colgada y el mapa no
    // llega a darse por listo: entonces se vuelve a cargar la página (hasta tres veces) en lugar de esperar de más.
    for (let intento = 1; intento <= 3; intento++) {
      await page.goto(explorador, { waitUntil: "load" });
      await page.waitForSelector("body[data-listo='si']", { timeout: 30000 });
      const listo = await page.waitForFunction(() => ["listo", "sin-mapa"].includes(document.body.dataset.mapa), null, { timeout: 25000 }).then(() => true).catch(() => false);
      if (listo) break;
      aviso(`el mapa del explorador no avisó que quedó listo en 25 s (intento ${intento} de 3)${intento < 3 ? ": se vuelve a cargar la página" : ": se sigue con lo que haya dibujado"}`);
    }
    await page.waitForFunction(() => Boolean(document.body.dataset.relieve), null, { timeout: 15000 }).catch(() => {});
    await mapaQuieto(page);
    await instalarAyudas(page);
    const marca = await marcarSincronia(page);

    const variantes = await leerVariantes(page);
    await revisarCantidadDePruebas(page, cues);
    if (await page.locator("#mapa-aviso:not([hidden])").count()) aviso(`aviso del mapa: «${(await page.locator("#mapa-aviso").innerText()).trim()}» (sin red, todas las tomas se graban así)`);
    escribirSrt(cues);

    const contexto = { variantes, dotacionEnTablero, selectorPorque: null };
    for (const def of tramosDelExplorador(contexto)) if (pedidas.has(def.toma)) await grabar(def);
    const sinGrabar = [...pedidas].filter((clave) => !tramos.some((t) => t.toma === clave));
    check("todas las tomas de la página se grabaron", !sinGrabar.length, sinGrabar.length ? `faltan: ${sinGrabar.join(", ")} (la portada no es el tablero o la página no trae la vista 3D)` : `${tramos.length} tramos`);
    if (sinGrabar.length) {
      await ctx.close();
      return terminar();
    }

    check("la página grabó sin errores de JavaScript", errores.length === 0, errores.slice(0, 3).join(" | "));
    await page.waitForTimeout(300);
    const cierre = (Date.now() - t0) / 1000;
    await ctx.close(); // aquí Playwright termina de escribir el .webm
    webm = await page.video().path();
    // Del reloj a la grabación: la marca de sincronía se pintó en `marca` (reloj) y aparece en cierto segundo del
    // .webm; con eso cada tramo empieza justo donde debe. Si no se encuentra, se estima con la duración del .webm
    // (la grabación empieza un poco después de t0 y termina al cerrar), que es menos exacto.
    const real = duracion(webm);
    const enVideo = buscarMarca(webm, (marca - t0) / 1000 + 4);
    check("sincronía: la marca del reloj aparece en la grabación", enVideo != null, enVideo != null ? `a los ${enVideo.toFixed(2)} s del .webm` : "se estima con la duración de la grabación");
    const desfase = enVideo != null ? (marca - t0) / 1000 - enVideo : Math.max(0, Math.min(2, cierre - real));
    for (const t of tramos) {
      t.inicio = Math.max(0, t.inicio - desfase);
      if (t.ancla) Object.assign(t.ancla, { buscarDesde: Math.max(0, t.ancla.buscarDesde - desfase), buscarHasta: t.ancla.buscarHasta - desfase + 0.5 });
    }
    console.log(`Grabación: ${webm} (${real.toFixed(2)} s; reloj ${cierre.toFixed(2)} s; desfase ${desfase.toFixed(2)} s)`);
  } finally {
    await navegador?.close();
    srv.close();
  }

  // ¿La grabación salió a la escala pedida? Si no, la página está a escala 1 en la esquina del cuadro: se recorta así.
  const llena = grabacionLlenaElCuadro(webm, tramos[tramos.length - 1].inicio + 0.5);
  if (!llena) aviso(`la grabación no salió a escala ${ESCALA} (el navegador no aplicó --force-device-scale-factor): los acercamientos se recortan a escala 1 y pierden nitidez`);
  const escala = llena ? ESCALA : 1;

  // Tramos anclados a la grabación: empiezan `antes` segundos antes de que su anillo aparezca en el .webm.
  for (const t of tramos) {
    if (!t.ancla) continue;
    const visto = buscarAnillo(webm, t.ancla, escala);
    if (visto == null) {
      aviso(`el tramo «${t.nombre}» no encontró su anillo en la grabación: se queda con el tiempo del reloj (se ve el resultado, no el cambio)`);
      continue;
    }
    t.inicio = Math.max(0, visto - t.ancla.antes);
    console.log(`tramo · ${t.toma} · anclado a la grabación: su anillo aparece a los ${visto.toFixed(2)} s del .webm`);
  }

  // Exportar: si pasa de 10 MB, se comprime más (hasta tres intentos).
  let salida = null;
  for (const crf of [22, 26, 30]) {
    salida = exportar(webm, cues, tramos, imagenes, crf, escala);
    if (salida.tam <= TAMANO_OBJETIVO_MB) break;
    aviso(`el MP4 pesa ${salida.tam.toFixed(1)} MB (> ${TAMANO_OBJETIVO_MB} MB): se vuelve a exportar más comprimido`);
  }
  const dur = duracion(MP4);
  const info = correr(FFPROBE, ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,pix_fmt,width,height,r_frame_rate", "-of", "default=nw=1", MP4]).trim().replace(/\n/g, " · ");
  const audio = correr(FFPROBE, ["-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_name", "-of", "default=nw=1:nk=1", MP4]).trim();
  check(`video: dura ${dur.toFixed(2)} s (ffprobe; ≤ ${DURACION_MAX_S} s y dentro de ${DURACION_OBJETIVO_S.join("–")} s)`,
    dur <= DURACION_MAX_S && dur >= DURACION_OBJETIVO_S[0] - 1e-3 && dur <= DURACION_OBJETIVO_S[1] + 5e-3);
  check("video: H.264, yuv420p", /codec_name=h264/.test(info) && /pix_fmt=yuv420p/.test(info), info);
  check(`video: ${LIENZO.ancho} × ${LIENZO.alto}, ${FPS} fps, con pista de audio (en silencio)`,
    new RegExp(`width=${LIENZO.ancho}\\b`).test(info) && new RegExp(`height=${LIENZO.alto}\\b`).test(info) && new RegExp(`r_frame_rate=${FPS}/1\\b`).test(info) && audio.length > 0, `audio: ${audio || "ninguno"}`);
  check(`video: ${salida.tam.toFixed(2)} MB (objetivo < ${TAMANO_OBJETIVO_MB} MB)`, salida.tam < TAMANO_OBJETIVO_MB);
  const rutas = extraerFotogramas(salida.piezas);
  console.log(`\nVideo: ${MP4}\nFotogramas para revisar (uno por tarjeta y por tramo):\n${rutas.map((r) => `  ${r}`).join("\n")}`);
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
