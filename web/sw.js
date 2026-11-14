// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// web/sw.js — Service worker del gemelo digital: la aplicación sigue funcionando sin red con la última copia
// sincronizada (docs/decisiones/2026-11-14_gemelo_digital.md, «Qué cambia en el producto», punto 4).
// Sin dependencias. Lo registra web/js/instalar.js; el listado de archivos lo genera motor/pwa.py.
//
// QUÉ HACE
//   Al instalarse    lee data/precache.json ({ version, archivos }) y guarda TODOS esos archivos en la caché
//                    «raiz-<version>»: primero lo que la página necesita para abrir (HTML, estilos, código y
//                    bibliotecas), después los datos y al final las teselas de relieve, para que una copia que
//                    se corta a la mitad al menos abra. Activa de inmediato (skipWaiting) aunque algún archivo
//                    falle: el estado que informa a la página dice si la copia quedó completa.
//   Al activarse     borra las cachés «raiz-…» viejas y toma el control de las páginas abiertas (clients.claim).
//   En cada petición GET del mismo origen (dentro de la carpeta de la aplicación): RED PRIMERO.
//                      · la red contesta a tiempo  -> se entrega esa respuesta y se renueva su copia;
//                      · la red falla, tarda más que LIMITE_RED_MS o contesta con error del servidor
//                                                  -> se entrega la copia guardada (si la hay);
//                      · navegación sin red        -> index.html de la copia.
//                    Así nunca se sirve una versión vieja habiendo red.
//   Otros orígenes   (las teselas del mapa base) y lo que no es GET: no se tocan; si fallan, falla solo esa
//                    petición, igual que sin service worker.
//
// MENSAJES (los usa web/js/instalar.js)
//   Página -> worker   { tipo: "raiz-sincronizar" }
//                      Vuelve a leer data/precache.json de la red; si la versión cambió, guarda una copia nueva
//                      completa y borra la anterior. Siempre contesta con el estado.
//   Worker -> páginas  { tipo: "raiz-copia", estado, version, total, guardados, faltantes, conRed }
//                        estado     "guardando"   se están descargando los archivos de la copia
//                                   "lista"       hay una copia COMPLETA: la aplicación abre sin red
//                                   "incompleta"  hay una copia a medias: faltó guardar algún archivo o la red
//                                                 se cortó antes de terminar. NO es un respaldo: sin red, la
//                                                 aplicación puede no abrir
//                                   "ninguna"     no hay nada guardado
//                        version    versión de la copia de la que se habla (o null)
//                        total      archivos del listado (null si no se pudo leer: copia a medias y sin red)
//                        guardados  cuántos están ya en la copia
//                        faltantes  rutas que no se pudieron guardar en el último intento
//                        conRed     true si el servidor contestó en el último intento de sincronizar;
//                                   false si no hubo red (o se fue mientras se guardaba); null si no se intentó
//
// La marca de «copia completa» es el propio listado: data/precache.json se guarda AL FINAL, dentro de su caché.
// Solo «lista» permite decir que hay respaldo: la página (web/js/instalar.js) rotula «showing the last synced
// copy» únicamente con ese estado.
// Los números de este archivo son límites técnicos (tiempo de espera, descargas a la vez), no datos.

const PREFIJO = "raiz-";
const LISTADO = "data/precache.json";
const PORTADA = "index.html";
const DATOS = "data/";            // carpeta de los datos: se guardan después de lo que la página necesita para abrir
const TESELAS = "data/dem/";      // teselas de relieve (solo la vista 3D): se guardan al final
const PEDIR_SINCRONIZAR = "raiz-sincronizar";
const AVISO_COPIA = "raiz-copia";
const LIMITE_RED_MS = 3000;       // espera máxima a la red antes de contestar con la copia guardada
const DESCARGAS_A_LA_VEZ = 6;     // al guardar la copia
const AVISO_CADA_MS = 400;        // separación mínima entre dos avisos de avance
const ERROR_DEL_SERVIDOR = 500;   // de este estado HTTP en adelante se prefiere la copia guardada

const BASE = new URL("./", self.location.href); // carpeta de la aplicación (la de este archivo)
const absoluta = (ruta) => new URL(ruta, BASE).href;
const sinConsulta = (url) => url.split(/[?#]/)[0];
const BUSQUEDA = { ignoreSearch: true, ignoreVary: true };

// ------------------------------------------------------------------------------------------ copias guardadas
/** Nombres de las cachés de Raíz, de la más vieja a la más nueva (el navegador las entrega en orden de creación). */
async function nombresDeCopias() {
  return (await caches.keys()).filter((nombre) => nombre.startsWith(PREFIJO));
}

/** Listado guardado en una caché (su marca de «completa»), o null si no lo tiene o es de otra versión. */
async function listadoDe(nombre) {
  try {
    const cache = await caches.open(nombre);
    const guardado = await cache.match(absoluta(LISTADO));
    const listado = guardado ? await guardado.json() : null;
    return listadoValido(listado) && PREFIJO + listado.version === nombre ? listado : null;
  } catch {
    return null;
  }
}

function listadoValido(listado) {
  return Boolean(listado) && typeof listado.version === "string" && listado.version !== "" &&
    Array.isArray(listado.archivos) && listado.archivos.every((ruta) => typeof ruta === "string");
}

let vigenteEnMemoria; // { nombre, listado } | null; undefined = todavía no se busca (o hay que volver a buscar)

/** La copia completa más nueva: { nombre, listado }, o null si no hay ninguna. */
async function copiaVigente() {
  if (vigenteEnMemoria !== undefined) return vigenteEnMemoria;
  let hallada = null;
  for (const nombre of (await nombresDeCopias()).reverse()) {
    const listado = await listadoDe(nombre);
    if (listado) {
      hallada = { nombre, listado };
      break;
    }
  }
  vigenteEnMemoria = hallada;
  return hallada;
}

/** Borra las cachés de Raíz que no sean `conservar`. */
async function borrarOtras(conservar) {
  const nombres = await nombresDeCopias();
  await Promise.all(nombres.filter((nombre) => nombre !== conservar).map((nombre) => caches.delete(nombre)));
  vigenteEnMemoria = undefined;
}

/** Limpieza al activar: queda la copia completa más nueva (o, si no hay ninguna, la más nueva a medio guardar). */
async function limpiar() {
  vigenteEnMemoria = undefined;
  const vigente = await copiaVigente();
  const nombres = await nombresDeCopias();
  const conservar = vigente ? vigente.nombre : nombres[nombres.length - 1];
  if (conservar) await borrarOtras(conservar);
}

// ------------------------------------------------------------------------------------------ avisos a la página
async function avisar(detalle) {
  const ventanas = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const ventana of ventanas) ventana.postMessage({ tipo: AVISO_COPIA, ...detalle });
  return detalle;
}

/**
 * Estado de lo que hay guardado, sin tocar la red.
 * `intento`: { listado, faltantes } del guardado que acaba de quedar incompleto (si lo hubo).
 */
async function estadoGuardado(conRed, intento = null) {
  const faltantes = intento ? intento.faltantes : [];
  const vigente = await copiaVigente();
  if (vigente) {
    const total = vigente.listado.archivos.length;
    return { estado: "lista", version: vigente.listado.version, total, guardados: total, faltantes, conRed };
  }
  // Sin copia completa. ¿Quedó una a medias? (la red se cortó o faltó algún archivo): eso no es un respaldo.
  // La del intento que acaba de fallar o, si solo se pregunta, la más nueva que haya.
  const nombres = await nombresDeCopias();
  const aMedias = intento ? PREFIJO + intento.listado.version : nombres[nombres.length - 1];
  const guardados = aMedias ? (await (await caches.open(aMedias)).keys()).length : 0;
  const hayAlgo = guardados > 0 || faltantes.length > 0;
  return {
    estado: hayAlgo ? "incompleta" : "ninguna",
    version: hayAlgo && aMedias ? aMedias.slice(PREFIJO.length) : null,
    total: intento ? intento.listado.archivos.length : null,
    guardados,
    faltantes,
    conRed,
  };
}

// ------------------------------------------------------------------------------------------ guardar la copia
/** Turno de un archivo al guardar la copia: 0 lo que la página necesita para abrir, 1 los datos, 2 las teselas. */
function turno(ruta) {
  if (ruta.startsWith(TESELAS)) return 2;
  return ruta.startsWith(DATOS) ? 1 : 0;
}

/**
 * Descarga a la caché «raiz-<version>» los archivos del listado que aún no estén (si una descarga anterior se
 * interrumpió, continúa donde quedó) y, solo si están todos, guarda el listado como marca de «completa».
 * Devuelve las rutas que no se pudieron guardar.
 */
async function guardarCopia(listado, respuestaListado, conRed) {
  const cache = await caches.open(PREFIJO + listado.version);
  const total = listado.archivos.length;
  // El orden del listado se conserva dentro de cada turno (sort es estable).
  const cola = listado.archivos.filter((ruta) => ruta !== LISTADO).sort((a, b) => turno(a) - turno(b));
  const faltantes = [];
  let guardados = total - cola.length; // el listado cuenta desde el principio: ya se leyó
  let ultimoAviso = 0;
  const avance = () => {
    const ahora = Date.now();
    if (ahora - ultimoAviso < AVISO_CADA_MS) return;
    ultimoAviso = ahora;
    avisar({ estado: "guardando", version: listado.version, total, guardados, faltantes: [], conRed });
  };
  avance();

  const descargar = async () => {
    for (let ruta = cola.shift(); ruta !== undefined; ruta = cola.shift()) {
      const url = absoluta(ruta);
      try {
        if (!(await cache.match(url))) {
          // «no-cache»: se revalida con el servidor, para no guardar una copia vieja de la caché HTTP.
          const respuesta = await fetch(new Request(url, { cache: "no-cache" }));
          if (!respuesta.ok) throw new Error(respuesta.statusText);
          await cache.put(url, respuesta);
        }
        guardados += 1;
      } catch {
        faltantes.push(ruta);
      }
      avance();
    }
  };
  await Promise.all(Array.from({ length: DESCARGAS_A_LA_VEZ }, descargar));

  if (!faltantes.length) await cache.put(absoluta(LISTADO), respuestaListado); // la marca de «completa», al final
  vigenteEnMemoria = undefined;
  return faltantes.sort();
}

/** Lee el listado de la red. Devuelve { listado, respuesta, conRed }; listado null si no se pudo. */
async function leerListado() {
  let respuesta;
  try {
    respuesta = await fetch(new Request(absoluta(LISTADO), { cache: "no-store" }));
  } catch {
    return { listado: null, respuesta: null, conRed: false };
  }
  try {
    const listado = respuesta.ok ? await respuesta.clone().json() : null;
    return { listado: listadoValido(listado) ? listado : null, respuesta, conRed: true };
  } catch {
    return { listado: null, respuesta, conRed: true };
  }
}

async function hacerSincronizacion() {
  const { listado, respuesta, conRed } = await leerListado();
  if (!listado) return avisar(await estadoGuardado(conRed)); // sin red o sin listado: se informa lo que haya
  const nombre = PREFIJO + listado.version;
  const vigente = await copiaVigente();
  if (!vigente || vigente.nombre !== nombre) {
    const faltantes = await guardarCopia(listado, respuesta, conRed);
    if (faltantes.length) {
      // ¿Faltaron porque el servidor no los tiene o porque la red se fue a media copia? Se vuelve a preguntar
      // por el listado: si ya no contesta, la página debe decir «sin conexión» y reintentar más tarde.
      const sigue = await leerListado();
      return avisar(await estadoGuardado(sigue.conRed, { listado, faltantes }));
    }
  }
  // La copia anterior se borra aquí, salvo durante la instalación: mientras otro worker siga al mando,
  // sus copias se quedan hasta que este se active (limpiar), para no quitarle el respaldo antes de tiempo.
  if (!instalando) await borrarOtras(nombre);
  return avisar(await estadoGuardado(conRed));
}

let instalando = false; // true solo mientras corre el evento «install» de este worker
let sincronizacionEnCurso = null;
/** Una sola sincronización a la vez: quien la pide mientras corre recibe la misma respuesta. */
function sincronizar() {
  if (!sincronizacionEnCurso) {
    sincronizacionEnCurso = hacerSincronizacion()
      .catch(async () => avisar(await estadoGuardado(null)))
      .finally(() => {
        sincronizacionEnCurso = null;
      });
  }
  return sincronizacionEnCurso;
}

// ------------------------------------------------------------------------------------------ red primero
function sirveParaLaCopia(respuesta) {
  return respuesta.ok && respuesta.type === "basic" && !respuesta.redirected;
}

/** Renueva en la copia vigente el archivo que la red acaba de entregar. */
async function renovarCopia(pedido, respuesta) {
  const llave = sinConsulta(pedido.url);
  if (llave === absoluta(LISTADO)) return; // el listado es la marca de su caché: solo lo escribe guardarCopia
  const vigente = await copiaVigente();
  if (!vigente) return;
  const cache = await caches.open(vigente.nombre);
  await cache.put(llave, respuesta);
}

/** Una respuesta guardada que llegó tras una redirección no sirve para una navegación: se entrega limpia. */
function sinRedireccion(respuesta) {
  if (!respuesta.redirected) return respuesta;
  return new Response(respuesta.body, { status: respuesta.status, statusText: respuesta.statusText, headers: respuesta.headers });
}

/** Busca el archivo en las copias, de la más nueva a la más vieja; para una navegación, también la portada. */
async function buscarEnCopias(pedido) {
  const nombres = (await nombresDeCopias()).reverse();
  const llaves = [sinConsulta(pedido.url)];
  if (pedido.mode === "navigate") llaves.push(absoluta(PORTADA));
  for (const llave of llaves) {
    for (const nombre of nombres) {
      const guardada = await (await caches.open(nombre)).match(llave, BUSQUEDA);
      if (guardada) return pedido.mode === "navigate" ? sinRedireccion(guardada) : guardada;
    }
  }
  return null;
}

const RED_LENTA = Symbol("red lenta");
const RED_CAIDA = Symbol("red caída");

async function responder(pedido, red) {
  let reloj;
  const limite = new Promise((resolver) => {
    reloj = setTimeout(resolver, LIMITE_RED_MS, RED_LENTA);
  });
  const primera = await Promise.race([red, limite]).catch(() => RED_CAIDA);
  clearTimeout(reloj);
  const contesto = primera instanceof Response;
  if (contesto && primera.status < ERROR_DEL_SERVIDOR) return primera; // la red contestó a tiempo

  const guardada = await buscarEnCopias(pedido);
  if (guardada) return guardada;
  if (contesto) return primera; // error del servidor y nada guardado: se entrega tal cual
  if (primera === RED_LENTA) return red.catch(() => Response.error()); // red lenta y nada guardado: se espera
  return Response.error();
}

// ------------------------------------------------------------------------------------------ eventos
self.addEventListener("install", (evento) => {
  // Aunque la copia quede incompleta (o no haya red), el worker se instala: la página lo vuelve a pedir.
  instalando = true;
  evento.waitUntil(
    sincronizar()
      .catch(() => {})
      .then(() => {
        instalando = false;
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", (evento) => {
  // Las páginas abiertas quedan bajo este worker; al estar listo, instalar.js le pide el estado de la copia.
  evento.waitUntil(limpiar().catch(() => {}).then(() => self.clients.claim()));
});

self.addEventListener("message", (evento) => {
  if (!evento.data || evento.data.tipo !== PEDIR_SINCRONIZAR) return;
  evento.waitUntil(sincronizar());
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return;
  if (!pedido.url.startsWith(BASE.href)) return; // otro origen (teselas del mapa) u otra carpeta: sin tocar
  if (pedido.headers.has("range")) return; // descargas por partes: las atiende el navegador

  const red = fetch(pedido);
  // La copia se renueva aunque ya se haya contestado con la guardada (la red llegó tarde).
  evento.waitUntil(
    red.then((respuesta) => (sirveParaLaCopia(respuesta) ? renovarCopia(pedido, respuesta.clone()) : undefined)).catch(() => {}),
  );
  evento.respondWith(responder(pedido, red));
});
