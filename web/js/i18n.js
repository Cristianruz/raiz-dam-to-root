// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/i18n.js — Idioma de la interfaz del tablero (decisión de Cristian, 15-nov-2026): español, inglés, portugués
// y francés, los mismos del mensaje de WhatsApp (docs/decisiones/2026-11-14_whatsapp_idiomas.md).
//
// Qué hace:
// - guarda los textos de cada módulo por idioma (registrar) y los entrega con t(clave, valores);
// - elige el idioma en este orden: «?lang=xx» en la liga, el último elegido (localStorage, solo comodidad), el del
//   navegador (navigator.languages) y, si ninguno es de los cuatro, inglés;
// - avisa a quien se suscriba cuando cambia (alCambiarIdioma) y pone <html lang="…">;
// - da formato a números y fechas con el idioma elegido (fmtNumero, fmtFecha): ninguna cifra se escribe a mano.
// Sin dependencias y sin tocar la red. Un texto que falte en un idioma se toma del inglés; si tampoco está, queda la
// clave a la vista, para que una prueba lo detecte.

// Orden del selector de idioma. El nombre de cada idioma va en su propio idioma.
export const IDIOMAS = ["en", "es", "pt", "fr"];
export const NOMBRE_IDIOMA = { en: "English", es: "Español", pt: "Português", fr: "Français" };
// Configuración regional para Intl (separadores de miles y de decimales, nombres de meses).
const REGION = { en: "en-US", es: "es-MX", pt: "pt-BR", fr: "fr-FR" };
export const IDIOMA_BASE = "en";
// Las traducciones al portugués y al francés (y el inglés, del original en español) son borradores hechos con IA:
// la interfaz lo dice junto al selector hasta que las revise una persona hablante (misma regla que el WhatsApp).
export const BORRADOR_DE_MAQUINA = ["pt", "fr"];
const LLAVE = "root.idioma";

const textos = Object.fromEntries(IDIOMAS.map((c) => [c, {}]));
const suscritos = new Set();
let actual = null;

const valido = (c) => (typeof c === "string" && IDIOMAS.includes(c.toLowerCase().slice(0, 2)) ? c.toLowerCase().slice(0, 2) : null);

function leerGuardado() {
  try {
    return valido(globalThis.localStorage?.getItem(LLAVE));
  } catch {
    return null; // navegación privada o almacenamiento bloqueado: se sigue sin él
  }
}

function elegir() {
  let deLaLiga = null;
  try {
    deLaLiga = valido(new URLSearchParams(globalThis.location?.search ?? "").get("lang"));
  } catch {
    deLaLiga = null;
  }
  if (deLaLiga) return deLaLiga;
  const guardado = leerGuardado();
  if (guardado) return guardado;
  for (const c of globalThis.navigator?.languages ?? []) {
    const v = valido(c);
    if (v) return v;
  }
  return IDIOMA_BASE;
}

/** Idioma en uso: «en», «es», «pt» o «fr». */
export function idioma() {
  if (!actual) {
    actual = elegir();
    if (globalThis.document?.documentElement) globalThis.document.documentElement.lang = actual;
  }
  return actual;
}

/** Cambia el idioma, lo recuerda (si el navegador deja) y avisa a los suscritos. Devuelve el idioma que quedó. */
export function fijarIdioma(codigo) {
  const nuevo = valido(codigo) ?? IDIOMA_BASE;
  const cambio = nuevo !== idioma();
  actual = nuevo;
  try {
    globalThis.localStorage?.setItem(LLAVE, nuevo);
  } catch {
    // sin almacenamiento: el idioma vale para esta visita
  }
  if (globalThis.document?.documentElement) globalThis.document.documentElement.lang = nuevo;
  if (cambio) for (const fn of [...suscritos]) fn(nuevo);
  return nuevo;
}

/** Suscribe una función al cambio de idioma; devuelve otra para darse de baja. */
export function alCambiarIdioma(fn) {
  suscritos.add(fn);
  return () => suscritos.delete(fn);
}

/** Agrega textos: { en: { clave: "…" }, es: {…}, pt: {…}, fr: {…} }. Cada módulo registra los suyos. */
export function registrar(diccionarios) {
  for (const c of IDIOMAS) Object.assign(textos[c], diccionarios?.[c] ?? {});
}

/**
 * Texto de una clave en el idioma en uso; los marcadores {nombre} se sustituyen con `valores` (ya con formato).
 * Si falta en ese idioma, el del inglés; si tampoco, la clave.
 */
export function t(clave, valores = {}) {
  const plantilla = textos[idioma()][clave] ?? textos[IDIOMA_BASE][clave] ?? clave;
  return String(plantilla).replace(/\{(\w+)\}/g, (todo, k) => (k in valores ? String(valores[k]) : todo));
}

/** ¿Existe la clave en ese idioma (o en el que está en uso)? Para las pruebas de cobertura de textos. */
export function tiene(clave, codigo = idioma()) {
  return Object.prototype.hasOwnProperty.call(textos[valido(codigo) ?? IDIOMA_BASE], clave);
}

/** Claves registradas en un idioma (para comprobar que los cuatro traen las mismas). */
export function claves(codigo = IDIOMA_BASE) {
  return Object.keys(textos[valido(codigo) ?? IDIOMA_BASE]);
}

/** Texto de un dato que trae variantes por idioma: obj[`${llave}_${idioma}`], si no obj[llave] (el inglés). */
export function deDato(obj, llave) {
  if (!obj || typeof obj !== "object") return null;
  return obj[`${llave}_${idioma()}`] ?? obj[llave] ?? null;
}

/** Número con los separadores del idioma en uso; «—» si no es un número. */
export function fmtNumero(valor, opciones = {}) {
  if (typeof valor !== "number" || !Number.isFinite(valor)) return "—";
  return new Intl.NumberFormat(REGION[idioma()], opciones).format(valor);
}

/** Fecha (ISO o Date) con el idioma en uso; el texto tal cual si no es una fecha. */
export function fmtFecha(valor, opciones = { dateStyle: "medium", timeZone: "UTC" }) {
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor ?? "");
  return new Intl.DateTimeFormat(REGION[idioma()], opciones).format(fecha);
}

/** Solo para pruebas: olvida el idioma elegido y los textos registrados. */
export function reiniciarParaPruebas() {
  actual = null;
  suscritos.clear();
  for (const c of IDIOMAS) textos[c] = {};
}
