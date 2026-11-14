// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// web/js/instalar.js — Aplicación instalable y sin conexión: registra el service worker (web/sw.js), ofrece
// «Install app» y dice si hay conexión y si la copia sin conexión ya está guardada
// (docs/decisiones/2026-11-14_gemelo_digital.md, «Qué cambia en el producto», punto 4).
// Módulo ES, sin dependencias. Estilos: web/css/instalar.css (cargue esa hoja junto con este módulo).
//
// QUÉ EXPORTA (lo conecta app.js; este archivo no toca el mapa, la ficha ni los controles de la aplicación)
//   montarInstalacion(contenedor, { alCambiar, rutaWorker } = {}) -> controlador
//     contenedor   elemento del DOM donde se dibuja. El módulo AGREGA ahí un solo nodo (<div class="instalar">)
//                  y al destruirse lo retira; no borra lo demás que tenga el contenedor. El nodo se acomoda al
//                  ancho disponible (sus piezas bajan de renglón): sirve en la barra de la marca, en el panel
//                  o en el teléfono.
//     alCambiar    opcional: función(estado) que se llama cada vez que cambia algo de estado() (p. ej. para
//                  repetirlo en la tarjeta «Estado del gemelo»).
//     rutaWorker   opcional: ruta del service worker, relativa a la página (por omisión «./sw.js»).
//
//     Qué dibuja:
//       · «Online» u «Offline — showing the last synced copy» (eventos online/offline del navegador; además,
//         si el service worker avisa que no alcanzó al servidor, también cuenta como sin conexión);
//       · «Preparing the offline copy…» mientras el service worker guarda los archivos, «Ready to work offline»
//         cuando terminó (mensaje del worker) y «Offline copy not complete yet» si faltó alguno;
//       · el botón «Install app», solo cuando el navegador avisa que la aplicación se puede instalar
//         (evento beforeinstallprompt); al pulsarlo abre el diálogo del navegador.
//     Todo va en una región role="status" (los cambios se anuncian) y cada estado lleva texto y una figura
//     distinta: nada depende solo del color.
//
//     El worker se registra cuando la página terminó de cargar (evento load), para que la descarga de la copia
//     no compita con el arranque; hasta entonces el nodo está oculto.
//     Si el navegador no tiene service workers, o la página no viene de https ni de localhost (p. ej. la copia
//     de un solo archivo abierta con file://), NO dibuja nada y no falla: devuelve un controlador con
//     soportado === false. Si el registro del worker falla, retira lo dibujado.
//     La copia se vuelve a comparar con el servidor al montar, al recuperar la conexión, al volver a la pestaña
//     y, mientras el servidor no conteste, cada medio minuto.
//
//   controlador:
//     soportado            booleano: hay service workers y contexto seguro (se sabe al montar).
//     listo                Promise<boolean>: true cuando el worker quedó registrado; false si no se pudo.
//     estado() -> { red, copia, version, instalable }
//                            red         "online" | "offline"
//                            copia       "ninguna" | "guardando" | "lista" | "incompleta"
//                            version     versión de la copia guardada (web/data/precache.json), o null
//                            instalable  true si el botón «Install app» está a la vista
//     sincronizar()        pide al worker que compare su copia con el servidor y la renueve si cambió.
//     destruir()           suelta los oyentes y retira su nodo; queda inerte.
//
//   TEXTOS               los textos de la interfaz (en inglés), para las pruebas.
//   PEDIR_SINCRONIZAR, AVISO_COPIA
//                        tipos de los mensajes con web/sw.js (allá están con el mismo valor).
//
// Para conectar la aplicación (index.html): <link rel="manifest" href="manifest.webmanifest">,
// <link rel="stylesheet" href="css/instalar.css"> y, desde app.js, montarInstalacion(<un contenedor>).
// Este módulo no escribe cifras: la versión y los conteos llegan del worker, que los lee de precache.json.

export const TEXTOS = Object.freeze({
  grupo: "App and connection",
  instalar: "Install app",
  enLinea: "Online",
  sinConexion: "Offline — showing the last synced copy",
  copiaLista: "Ready to work offline",
  copiaGuardando: "Preparing the offline copy…",
  copiaIncompleta: "Offline copy not complete yet",
});
export const PEDIR_SINCRONIZAR = "raiz-sincronizar";
export const AVISO_COPIA = "raiz-copia";

const RUTA_WORKER = "./sw.js";
const REINTENTO_MS = 30000; // si el worker no alcanzó al servidor, cada cuánto se le pide que lo intente otra vez
const COPIAS = ["ninguna", "guardando", "lista", "incompleta"];
const TEXTO_DE_COPIA = { guardando: TEXTOS.copiaGuardando, lista: TEXTOS.copiaLista, incompleta: TEXTOS.copiaIncompleta };

// ---------------------------------------------------------------- aviso de instalación (uno por página)
// El navegador puede avisar antes de que la aplicación monte este módulo: el aviso se guarda desde que el
// módulo se importa y cada montaje lo recoge.
let avisoInstalacion = null;
const montajes = new Set(); // funciones «repintar» de los montajes vivos
const repintarTodos = () => montajes.forEach((repintar) => repintar());

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
  window.addEventListener("beforeinstallprompt", (evento) => {
    // Con un botón a la vista se evita la barra automática del navegador; sin montaje, se deja como esté.
    if (montajes.size) evento.preventDefault();
    avisoInstalacion = evento;
    repintarTodos();
  });
  window.addEventListener("appinstalled", () => {
    avisoInstalacion = null;
    repintarTodos();
  });
}

// ---------------------------------------------------------------- utilidades
/** ¿Hay service workers y la página viene de https o de localhost? (nunca lanza) */
function hayServiceWorker() {
  try {
    return (
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      "serviceWorker" in navigator &&
      Boolean(navigator.serviceWorker) &&
      window.isSecureContext === true &&
      /^https?:$/.test(window.location.protocol)
    );
  } catch {
    return false; // p. ej. un marco aislado donde leer navigator.serviceWorker lanza
  }
}

function crear(etiqueta, clase, texto) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  if (texto) nodo.textContent = texto;
  return nodo;
}

/** Una pastilla del estado: figura (decorativa) + texto. */
function pastilla(clase) {
  const caja = crear("span", `instalar-pastilla ${clase}`);
  const figura = crear("span", "instalar-figura");
  figura.setAttribute("aria-hidden", "true");
  const texto = crear("span", "instalar-texto");
  caja.append(figura, texto);
  return { caja, texto };
}

const INERTE = Object.freeze({
  soportado: false,
  listo: Promise.resolve(false),
  estado: () => ({ red: "online", copia: "ninguna", version: null, instalable: false }),
  sincronizar() {},
  destruir() {},
});

const controladores = new WeakMap(); // contenedor -> controlador (montar dos veces reemplaza al anterior)

// ---------------------------------------------------------------- montaje
export function montarInstalacion(contenedor, { alCambiar, rutaWorker = RUTA_WORKER } = {}) {
  if (!contenedor || typeof contenedor.append !== "function" || !hayServiceWorker()) return INERTE;
  controladores.get(contenedor)?.destruir();

  const sw = navigator.serviceWorker;
  let vivo = true;
  let enLinea = navigator.onLine !== false; // lo que dice el navegador
  let conRed = null; // lo que dice el worker: true/false según alcanzó o no al servidor; null si no se sabe
  let copia = "ninguna";
  let version = null;
  let ultimo = "";
  let reintento = 0; // temporizador del próximo intento de sincronizar (solo mientras el servidor no contesta)

  // --- nodos
  const raiz = crear("div", "instalar");
  raiz.setAttribute("role", "group");
  raiz.setAttribute("aria-label", TEXTOS.grupo);
  raiz.hidden = true; // se muestra cuando el worker quedó registrado
  const estadoNodo = crear("p", "instalar-estado");
  estadoNodo.setAttribute("role", "status");
  estadoNodo.tabIndex = -1; // recibe el foco cuando el botón desaparece tras pulsarlo
  const red = pastilla("instalar-red");
  const guardada = pastilla("instalar-copia");
  estadoNodo.append(red.caja, guardada.caja);
  const boton = crear("button", "instalar-boton", TEXTOS.instalar);
  boton.type = "button";
  boton.hidden = true;
  raiz.append(estadoNodo, boton);
  contenedor.append(raiz);

  // --- estado y pintura
  const estado = () => ({
    red: enLinea && conRed !== false ? "online" : "offline",
    copia,
    version,
    instalable: vivo && Boolean(avisoInstalacion) && !raiz.hidden,
  });

  function repintar() {
    if (!vivo) return;
    const e = estado();
    raiz.dataset.red = e.red;
    raiz.dataset.copia = e.copia;
    red.texto.textContent = e.red === "online" ? TEXTOS.enLinea : TEXTOS.sinConexion;
    // Sin conexión, el texto de arriba ya dice que se ve la copia: la segunda pastilla sobra.
    const textoCopia = e.red === "online" ? TEXTO_DE_COPIA[e.copia] : undefined;
    guardada.texto.textContent = textoCopia ?? "";
    guardada.caja.hidden = !textoCopia;
    if (!avisoInstalacion && !boton.hidden && document.activeElement === boton) estadoNodo.focus();
    boton.hidden = !avisoInstalacion;
    const firma = JSON.stringify(e);
    if (firma !== ultimo) {
      ultimo = firma;
      if (typeof alCambiar === "function") alCambiar(e);
    }
  }

  // --- service worker
  function sincronizar() {
    if (!vivo) return;
    sw.ready.then((registro) => registro.active?.postMessage({ tipo: PEDIR_SINCRONIZAR })).catch(() => {});
  }

  function alMensaje(evento) {
    const m = evento.data;
    if (!m || m.tipo !== AVISO_COPIA || !COPIAS.includes(m.estado)) return;
    if (typeof m.conRed === "boolean") conRed = m.conRed;
    // Con una copia completa ya guardada, «guardando» es su renovación: la anterior sigue sirviendo.
    if (!(m.estado === "guardando" && copia === "lista")) {
      copia = m.estado;
      version = m.version ?? null;
    }
    // El navegador dice que hay conexión pero el servidor no contestó: se vuelve a intentar más tarde.
    clearTimeout(reintento);
    if (conRed === false && enLinea) reintento = setTimeout(sincronizar, REINTENTO_MS);
    repintar();
  }

  function alConectar() {
    enLinea = true;
    conRed = null; // se vuelve a preguntar al worker
    repintar();
    sincronizar();
  }
  function alDesconectar() {
    enLinea = false;
    clearTimeout(reintento);
    repintar();
  }
  function alVolver() {
    if (document.visibilityState === "visible") sincronizar();
  }

  async function alPulsar() {
    const aviso = avisoInstalacion;
    if (!aviso) return;
    avisoInstalacion = null; // un aviso sirve para un solo diálogo; el navegador manda otro si hace falta
    repintarTodos();
    try {
      await aviso.prompt();
      await aviso.userChoice;
    } catch {
      // el navegador no abrió el diálogo: no hay nada más que hacer
    }
  }

  sw.addEventListener("message", alMensaje);
  sw.startMessages?.();
  window.addEventListener("online", alConectar);
  window.addEventListener("offline", alDesconectar);
  document.addEventListener("visibilitychange", alVolver);
  boton.addEventListener("click", alPulsar);
  montajes.add(repintar);

  function destruir() {
    if (!vivo) return;
    vivo = false;
    clearTimeout(reintento);
    montajes.delete(repintar);
    sw.removeEventListener("message", alMensaje);
    window.removeEventListener("online", alConectar);
    window.removeEventListener("offline", alDesconectar);
    document.removeEventListener("visibilitychange", alVolver);
    boton.removeEventListener("click", alPulsar);
    raiz.remove();
    if (controladores.get(contenedor) === controlador) controladores.delete(contenedor);
  }

  // El worker se registra cuando la página terminó de cargar: su descarga de la copia no compite con el arranque.
  const cargada = new Promise((resolver) => {
    if (document.readyState === "complete") resolver();
    else window.addEventListener("load", resolver, { once: true });
  });
  const listo = cargada
    .then(() => (vivo ? sw.register(rutaWorker, { updateViaCache: "none" }) : Promise.reject(new Error("destruido"))))
    .then(
      () => {
        if (!vivo) return false;
        raiz.hidden = false;
        repintar();
        sincronizar();
        return true;
      },
      () => {
        destruir(); // sin worker no hay copia sin conexión: no se muestra nada
        return false;
      },
    );

  const controlador = { soportado: true, listo, estado, sincronizar, destruir };
  controladores.set(contenedor, controlador);
  repintar();
  return controlador;
}
