// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/mensaje.js — Mensaje al agricultor (maqueta de WhatsApp) y ficha imprimible (kit C4; S9 §3, pantalla 3).
// Módulo ES, sin dependencias. No envía nada, no guarda nada y no tiene formularios.
//
// Qué exporta (lo conecta app.js; este archivo no toca el resto de la página):
//   htmlWhatsApp(parcela, opciones, ctx) -> string
//       MAQUETA visual de un mensaje de WhatsApp, en español, para el agricultor: saludo breve, las
//       opciones numeradas (la actual y las alternativas), por opción una línea de agua (cuánta pide al
//       año, por cuántos años obliga y para cuántas hectáreas alcanza con la dotación elegida) y una de
//       suelo; «Responda 1, 2 o 3» y el aviso «Es una simulación; la asignación oficial la decide Conagua.»
//         parcela   properties de la parcela (o el Feature completo) de parcelas.geojson
//         opciones  cubo.parcelas[id].opciones (en el orden del cubo; la ACTUAL va primero)
//         ctx       { reglas, D, r, plantilla?, sinOpciones? }
//           reglas     el módulo web/reglas.js (se usa reglas.evaluarOpcion; la regla vive solo ahí)
//           D          dotación elegida con el deslizador (millares/ha)
//           r          lluvia elegida (0 o la variante seca de cubo.lluvia_pct)
//           plantilla  contenido de web/data/whatsapp_plantilla.json (opcional). Si falta, se usa la
//                      última leída con cargarPlantillaWhatsApp() y, si tampoco hay, la plantilla interna.
//           sinOpciones código cubo.parcelas[id].sin_opciones de una parcela CLASIFICADA sin opciones
//                      («sin_clima_zona», «sin_actual»): el mensaje dice qué falta, no «el mapa no sabe».
//       Inserta css/mensaje.css en la página si aún no está enlazada.
//   textoWhatsApp(parcela, opciones, ctx) -> string
//       El mismo mensaje como texto plano con el formato de WhatsApp (*negrita*, _cursiva_).
//   cargarPlantillaWhatsApp(url = "data/whatsapp_plantilla.json") -> Promise<plantilla | null>
//       Lee la plantilla una sola vez por URL y la valida; null si no existe o no sirve.
//       Llámela solo si el archivo existe: en Chromium un 404 deja un error en la consola.
//   imprimirFicha(ctx = {}) -> Promise<boolean>
//       Imprime la ficha abierta con window.print() y la hoja css/imprimir.css (@media print): encabezado,
//       memoria, tarjetas con sus tres renglones, La gota estática, la dotación y la lluvia elegidas, la
//       fecha, las fuentes y el aviso de juicio local; oculta los controles y el mapa. false si no hay ficha.
//         ctx  { D?, r?, cubo?, manifiesto?, errorManifiesto?, parcela?, ficha?, fecha?, imprimir? }
//           D, r        dotación y lluvia elegidas; si faltan, se leen de la pantalla (#dotacion, #lluvia)
//           cubo        cubo.json (marca de la dotación, punto de medición, zona, meta.generado, meta.fuentes)
//           manifiesto  manifest.json (fuentes_de_origen: la lista de fuentes); sin él, cubo.meta.fuentes
//           errorManifiesto  detalle si manifest.json existe pero no se pudo leer (la hoja lo dice)
//           parcela     properties de la parcela (para el nombre de la zona piloto)
//           ficha       el elemento de la ficha (por omisión #ficha)
//           fecha       fecha de impresión (por omisión, hoy)
//           imprimir    función que imprime (por omisión window.print; las pruebas la sustituyen)
//   fmtFechaUi(valor, estilo = "medium") -> string
//       Fecha de la hoja impresa en inglés. «AAAA-MM-DD» (sin hora) sale el mismo día en cualquier zona
//       horaria; un instante con hora o un Date, en la hora local. Se exporta para las pruebas (tests/fechas.test.js).
//
// Formato de web/data/whatsapp_plantilla.json (todas las llaves son opcionales; la que falte o no pase la
// validación se toma de la plantilla interna). Texto en español, con marcadores {{…}} y SIN dígitos:
//   saludo          {{parcela}} {{area}} {{d}} {{lluvia}}
//   opcion          {{n}} {{nombre}}                         (título de cada opción)
//   agua            {{estado}} {{lamina}} {{plazo}} {{d}} {{ha}} {{area}} {{rango_ha}}
//   agua_sin_riego  {{estado}} {{plazo}}                     (opción con necesidad cero: descanso)
//   agua_sin_dato   {{estado}}                               (la opción no trae lámina para esa lluvia)
//   suelo           {{dias}} {{origen}} {{leguminosa}} {{plagas}}
//   suelo_sin_dias  {{leguminosa}} {{plagas}}
//   respuesta       {{numeros}}                              («Responda {{numeros}}.» -> «Responda 1, 2 o 3.»)
//   sin_opciones    {{parcela}} {{area}}                     (parcela abstenida: el mapa no sabe qué hay)
//   sin_calculo     {{parcela}} {{area}} {{motivo}}          (parcela CLASIFICADA sin opciones: el motivo sale
//                                                             del código cubo.parcelas.<id>.sin_opciones)
// Se acepta *negrita* y _cursiva_ como en WhatsApp. El aviso de simulación y el de juicio local son fijos.
//
// Reglas de este archivo:
// - Ninguna cifra escrita a mano: los números salen de parcelas.geojson, cubo.json y de las reglas de
//   web/reglas.js (evaluarOpcion); la numeración de las opciones y «Responda 1, 2 o 3» se calculan con el
//   número de opciones. Los números del código son medidas de diseño (tiempos de espera), no datos.
// - Interfaz en inglés; el mensaje de WhatsApp, en español (CLAUDE.md, regla 9).
// - No se promete ahorro, no se reparte, vende ni intercambia agua y no se pronostica la presa.

const LOCALE_ES = "es-MX"; // mensaje al agricultor
const LOCALE_UI = "en-US"; // ficha imprimible (interfaz)
const RUTA_PLANTILLA = "data/whatsapp_plantilla.json";
const HOJA_MENSAJE = new URL("../css/mensaje.css", import.meta.url).href;
const HOJA_IMPRIMIR = new URL("../css/imprimir.css", import.meta.url).href;
const ESPERA_HOJA_MS = 3000; // tope de espera de la hoja de impresión antes de imprimir de todos modos

// ---------------------------------------------------------------------------
// Textos del mensaje (español). Ninguno lleva dígitos: los números entran por marcadores.
// ---------------------------------------------------------------------------
const PLANTILLA_INTERNA = {
  saludo:
    "Buen día. Estas son las opciones de agua para su parcela {{parcela}} ({{area}} ha) " +
    "con una dotación de {{d}} millares/ha y {{lluvia}}:",
  opcion: "{{n}}. {{nombre}}",
  agua:
    "Agua {{estado}}: pide {{lamina}} millares/ha al año y obliga por {{plazo}}. " +
    "Con {{d}} millares/ha alcanza para {{ha}} de {{area}} ha{{rango_ha}}.",
  agua_sin_riego: "Agua {{estado}}: no necesita riego; obliga por {{plazo}}.",
  agua_sin_dato: "Agua: sin dato de lámina para esta lluvia.",
  suelo:
    "Suelo: {{dias}} días desnudo en temporada de viento ({{origen}}); " +
    "leguminosa: {{leguminosa}}; rompe ciclo de plagas: {{plagas}}.",
  suelo_sin_dias: "Suelo: sin dato de días desnudo; leguminosa: {{leguminosa}}; rompe ciclo de plagas: {{plagas}}.",
  respuesta: "Responda {{numeros}}.",
  sin_opciones:
    "Buen día. En su parcela {{parcela}} ({{area}} ha) el mapa de cultivos no está seguro de qué hay sembrado, " +
    "así que no calculamos opciones. Revísela con su técnico.",
  sin_calculo:
    "Buen día. Su parcela {{parcela}} ({{area}} ha) sí está clasificada, pero aún no calculamos sus opciones: " +
    "{{motivo}}. Revísela con su técnico.",
};
// Motivo de una parcela clasificada sin opciones, por código (motor/b4_cubo.py; la web pone el texto).
const MOTIVOS_SIN_OPCIONES_ES = {
  sin_clima_zona: "falta el clima de su zona",
  sin_actual: "no se pudo armar su rotación actual con los datos de su zona",
};
const MOTIVO_SIN_OPCIONES_ES = "faltan datos de su zona";
// Marcadores que acepta cada llave de una plantilla externa (los demás la invalidan).
const MARCADORES = {
  saludo: ["parcela", "area", "d", "lluvia"],
  opcion: ["n", "nombre"],
  agua: ["estado", "lamina", "plazo", "d", "ha", "area", "rango_ha"],
  agua_sin_riego: ["estado", "plazo"],
  agua_sin_dato: ["estado"],
  suelo: ["dias", "origen", "leguminosa", "plagas"],
  suelo_sin_dias: ["leguminosa", "plagas"],
  respuesta: ["numeros"],
  sin_opciones: ["parcela", "area"],
  sin_calculo: ["parcela", "area", "motivo"],
};
// Avisos fijos (kit C4 y CLAUDE.md, regla 10): no se toman de la plantilla.
const AVISO_SIMULACION = "Es una simulación; la asignación oficial la decide Conagua.";
const AVISO_JUICIO_ES = "Esta herramienta apoya y no sustituye el juicio del agricultor ni del técnico.";
// Palabras que una plantilla externa no puede usar (CLAUDE.md, regla 10; guía de P6).
// (\b no sirve con letras acentuadas: se usan lookarounds de Unicode.)
const PROHIBIDAS =
  /(?<![\p{L}\p{N}_])(first|only|sav(?:e|es|ed|ing|ings)|guarantee\p{L}*|sell|trade|exchange|forecast|primer[oa]?s?|únic[oa]s?|ahorr\p{L}*|garantiza\p{L}*|repart\p{L}*|vend\p{L}*|intercambi\p{L}*|pronóstic\p{L}*)(?![\p{L}\p{N}_])/iu;

// Semáforo de agua en palabras (símbolo + texto: nada depende del color).
const ESTADO_AGUA = {
  verde: "✓ suficiente",
  ambar: "⚠ justa",
  rojo: "✕ insuficiente",
  gris: "? sin clasificar",
};
const ORIGEN_ES = { medido: "medido", estimado: "estimado" };

// Nombres en español (el cubo los trae en inglés para la interfaz).
const CULTIVOS_ES = {
  alfalfa: "Alfalfa",
  nogal: "Nogal",
  chile: "Chile",
  maiz_forrajero: "Maíz forrajero",
  sorgo: "Sorgo forrajero",
  algodon: "Algodón",
  cereal_invierno: "Cereal de invierno",
  forraje_verano: "Forraje de verano",
  avena: "Avena",
  barbecho: "Barbecho",
  descanso: "No sembrar (rastrojo en pie)",
  sin_clasificar: "Sin clasificar",
};
// Opciones cuyo nombre no se arma solo con la secuencia de cultivos.
const OPCIONES_ES = {
  alfalfa_corte_verano: "Alfalfa con corte de riego en verano",
};
const ROTACION_ACTUAL_ES = "Rotación actual";

// Textos de la ficha imprimible (inglés).
const AVISO_JUICIO = "This tool supports, never replaces, the judgment of farmers and local experts.";
const VARIANTE_GOTA = {
  actual: "current irrigation",
  con_tope: "drip with consumption cap",
  sin_tope: "drip without consumption cap",
};

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const formatos = new Map();
function formateador(locale, opciones) {
  const llave = locale + JSON.stringify(opciones);
  if (!formatos.has(llave)) formatos.set(llave, new Intl.NumberFormat(locale, opciones));
  return formatos.get(llave);
}
const MENOS = "−"; // signo menos tipográfico, como en la pantalla
const conMenos = (s) => s.replace("-", MENOS);

/** Número con hasta `decimales` decimales; «—» si no es número. */
function fmtNum(v, decimales, locale) {
  const n = num(v);
  return n == null ? "—" : conMenos(formateador(locale, { maximumFractionDigits: decimales }).format(n));
}
// Igual que la pantalla (app.js): lo calculado con un decimal; lo leído de un archivo, con su precisión.
const fmtEs = (v) => fmtNum(v, 1, LOCALE_ES);
const fmtDatoEs = (v) => fmtNum(v, 3, LOCALE_ES);
const fmtUi = (v) => fmtNum(v, 1, LOCALE_UI);
const fmtDatoUi = (v) => fmtNum(v, 3, LOCALE_UI);
function fmtRango(a, b, f) {
  return num(a) === num(b) ? f(a) : `${f(a)}–${f(b)}`;
}
/**
 * Hectáreas que alcanzan, en español, con la misma regla que la tarjeta (web/js/resumen.js,
 * hectareasQueAlcanzanTexto): nunca se leen más que la superficie («8 de 7,95») ni «0» si alcanza algo.
 * Con x ≥ superficie va la superficie; si x redondeada a un decimal llega a ella, x con su precisión (o «casi»);
 * si redondeada se lee cero, «menos de» el paso del formato.
 */
function haQueAlcanzanEs(x, area) {
  const v = num(x);
  const a = num(area);
  if (v == null || a == null) return fmtEs(x);
  const r1 = Math.round(v * 10) / 10;
  if (v >= a) return fmtDatoEs(a);
  if (v > 0 && r1 === 0) return `menos de ${fmtEs(1 / 10)}`;
  if (r1 >= a) return Math.round(v * 1000) / 1000 < a ? fmtDatoEs(v) : `casi ${fmtDatoEs(a)}`;
  return fmtEs(v);
}
function fmtPctEs(fraccion) {
  const n = num(fraccion);
  return n == null ? "—" : formateador(LOCALE_ES, { style: "percent", maximumFractionDigits: 0 }).format(n);
}
function fmtSignoUi(v) {
  return conMenos(formateador(LOCALE_UI, { maximumFractionDigits: 3, signDisplay: "exceptZero" }).format(v));
}
// Una fecha sin hora («AAAA-MM-DD», como la fecha de consulta de las fuentes) es un día del calendario, no un
// instante: new Date("2026-11-14") la lee como medianoche UTC y en Chihuahua (UTC−6) la hoja diría «Nov 13».
// Por eso se arma con Date.UTC y se formatea en UTC (el mismo día en cualquier zona). Con hora (p. ej.
// cubo.meta.generado) o un Date, es un instante: se dice en la hora local de quien imprime, como antes.
const FORMA_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;
export function fmtFechaUi(valor, estilo = "medium") {
  const dia = typeof valor === "string" ? FORMA_DIA.exec(valor.trim()) : null;
  if (dia) {
    const [anio, mes, d] = dia.slice(1).map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, d));
    // Un día que no existe (p. ej. 30 de febrero) no se corre al mes siguiente: se deja tal cual.
    if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() !== mes - 1 || fecha.getUTCDate() !== d) return String(valor);
    return new Intl.DateTimeFormat(LOCALE_UI, { dateStyle: estilo, timeZone: "UTC" }).format(fecha);
  }
  const fecha = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor ?? "");
  return new Intl.DateTimeFormat(LOCALE_UI, { dateStyle: estilo }).format(fecha);
}

/** Sustituye {{marcador}} por su valor; un marcador sin valor queda visible (se nota en la revisión). */
function rellenar(texto, valores) {
  return texto.replace(/\{\{(\w+)\}\}/g, (todo, k) => (k in valores ? String(valores[k]) : todo));
}

/** Formato de WhatsApp sobre texto ya escapado: *negrita* y _cursiva_. */
function formatoWhatsApp(htmlEscapado) {
  return htmlEscapado
    .replace(/\*([^*\n]+)\*/g, (_, t) => `<strong>${t}</strong>`)
    .replace(/_([^_\n]+)_/g, (_, t) => `<em>${t}</em>`);
}

/** Enlaza una hoja de estilos si la página aún no la tiene. Devuelve una promesa que se cumple al cargarla. */
function asegurarHoja(href, doc = globalThis.document) {
  if (!doc?.head) return Promise.resolve();
  const ya = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).find((l) => l.href === href);
  if (ya) return ya.sheet ? Promise.resolve() : esperarCarga(ya);
  const link = doc.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  const carga = esperarCarga(link);
  doc.head.append(link);
  return carga;
}
function esperarCarga(link) {
  return new Promise((ok) => {
    const listo = () => ok();
    link.addEventListener("load", listo, { once: true });
    link.addEventListener("error", listo, { once: true });
    setTimeout(listo, ESPERA_HOJA_MS);
  });
}

// ---------------------------------------------------------------------------
// Plantilla externa (web/data/whatsapp_plantilla.json)
// ---------------------------------------------------------------------------
const lecturas = new Map(); // url -> Promise de la plantilla validada
let plantillaCargada = null; // última plantilla válida leída

/** Deja solo las llaves conocidas, de texto, sin dígitos fuera de los marcadores, sin palabras prohibidas
 *  y con marcadores permitidos. null si no queda ninguna. */
function validarPlantilla(obj) {
  if (!obj || typeof obj !== "object") return null;
  const buena = {};
  for (const [llave, permitidos] of Object.entries(MARCADORES)) {
    const t = obj[llave];
    if (typeof t !== "string" || !t.trim()) continue;
    const sinMarcadores = t.replace(/\{\{\w+\}\}/g, "");
    const usados = [...t.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    const motivo = /\d/.test(sinMarcadores)
      ? "digits outside the {{…}} markers"
      : PROHIBIDAS.test(t)
        ? "a forbidden word"
        : usados.some((u) => !permitidos.includes(u))
          ? "an unknown marker"
          : sinMarcadores.includes("{{") || sinMarcadores.includes("}}")
            ? "a broken marker"
            : "";
    if (motivo) {
      console.warn(`whatsapp_plantilla.json: «${llave}» ignored (${motivo}); the built-in text is used.`);
      continue;
    }
    buena[llave] = t;
  }
  return Object.keys(buena).length ? buena : null;
}

export function cargarPlantillaWhatsApp(url = RUTA_PLANTILLA) {
  if (!lecturas.has(url)) {
    const lectura = fetch(url)
      .then((resp) => (resp.ok ? resp.json() : null))
      .then((obj) => {
        const p = validarPlantilla(obj);
        if (p) plantillaCargada = p;
        return p;
      })
      .catch(() => null);
    lecturas.set(url, lectura);
  }
  return lecturas.get(url);
}

function plantillaDe(ctx) {
  const externa = ctx?.plantilla ? validarPlantilla(ctx.plantilla) : plantillaCargada;
  return { ...PLANTILLA_INTERNA, ...(externa ?? {}) };
}

// ---------------------------------------------------------------------------
// Mensaje de WhatsApp: se arma una vez y se escribe como HTML o como texto
// ---------------------------------------------------------------------------
function propiedades(parcela) {
  return parcela?.properties ?? parcela ?? {};
}

function nombreCultivoEs(c) {
  return CULTIVOS_ES[c] ?? String(c ?? "").replace(/_/g, " ");
}

/** Nombre de la opción en español: el del cubo si lo trae (nombre_es), si no, se arma con su secuencia. */
function nombreOpcionEs(o, p) {
  if (typeof o.nombre_es === "string" && o.nombre_es.trim()) return o.nombre_es;
  const secuencia = Array.isArray(o.secuencia) && o.secuencia.length ? o.secuencia : [];
  // «Avena y maíz forrajero»: mayúscula solo al inicio.
  const cultivos = (secuencia.length ? secuencia : [p.cultivo_actual])
    .filter(Boolean)
    .map((c, i) => (i === 0 ? nombreCultivoEs(c) : nombreCultivoEs(c).toLowerCase()));
  const lista = cultivos.length ? new Intl.ListFormat(LOCALE_ES, { type: "conjunction" }).format(cultivos) : "";
  if (o.id === "ACTUAL") return lista ? `${ROTACION_ACTUAL_ES}: ${lista}` : ROTACION_ACTUAL_ES;
  return OPCIONES_ES[o.id] ?? (o.id in CULTIVOS_ES ? CULTIVOS_ES[o.id] : lista || o.nombre || String(o.id));
}

function textoPlazoEs(plazo) {
  const min = num(plazo?.min);
  const max = num(plazo?.max);
  if (min == null && max == null) return "un plazo sin dato";
  const unidad = (max ?? min) === 1 ? "año" : "años";
  return `${fmtRango(min ?? max, max ?? min, fmtDatoEs)} ${unidad}`;
}

function textoLluviaEs(r) {
  const v = num(r);
  if (!v) return "la lluvia de siempre";
  return `${fmtPctEs(Math.abs(v) / 100)} ${v < 0 ? "menos" : "más"} lluvia`;
}

function siNoEs(v) {
  if (v === true) return "sí";
  if (v === false) return "no";
  return "sin dato";
}

/** Una opción: título, línea de agua (con las reglas de reglas.js) y línea de suelo. */
function armarOpcion(o, i, p, ctx, t) {
  const area = fmtDatoEs(p.area_ha);
  const D = num(ctx.D);
  let ev = null;
  try {
    ev = ctx.reglas.evaluarOpcion(o, num(p.area_ha) ?? 0, D ?? 0, num(ctx.r) ?? 0, Boolean(p.abstencion));
  } catch {
    ev = null; // la opción no trae lámina para esa lluvia
  }
  const estado = ESTADO_AGUA[ev?.semaforo] ?? ESTADO_AGUA.gris;
  const plazo = textoPlazoEs(o.agua?.plazo_anios);
  let agua;
  if (!ev || num(ev.lamina?.p50) == null) {
    agua = rellenar(t.agua_sin_dato, { estado });
  } else if (!(ev.lamina.p50 > 0)) {
    agua = rellenar(t.agua_sin_riego, { estado, plazo });
  } else {
    const h = ev.hectareas;
    const bajo = haQueAlcanzanEs(h.bajo, p.area_ha);
    const alto = haQueAlcanzanEs(h.alto, p.area_ha);
    const rango = bajo === alto ? "" : ` (entre ${bajo} y ${alto})`;
    agua = rellenar(t.agua, {
      estado,
      lamina: fmtDatoEs(ev.lamina.p50),
      plazo,
      d: fmtEs(D),
      ha: haQueAlcanzanEs(h.p50, p.area_ha),
      area,
      rango_ha: rango,
    });
  }
  const su = o.suelo ?? {};
  const comunes = { leguminosa: siNoEs(su.leguminosa), plagas: siNoEs(su.ruptura_plagas) };
  const suelo =
    num(su.dias_desnudo) == null
      ? rellenar(t.suelo_sin_dias, comunes)
      : rellenar(t.suelo, {
          ...comunes,
          dias: fmtDatoEs(su.dias_desnudo),
          origen: ORIGEN_ES[su.dias_desnudo_origen] ?? "sin origen",
        });
  return {
    id: o.id,
    semaforo: ev?.semaforo ?? "gris",
    titulo: rellenar(t.opcion, { n: fmtNum(i + 1, 0, LOCALE_ES), nombre: nombreOpcionEs(o, p) }),
    agua,
    suelo,
  };
}

/** Partes del mensaje: { saludo, opciones[], respuesta, avisos[] }. */
function armarMensaje(parcela, opciones, ctx = {}) {
  if (typeof ctx?.reglas?.evaluarOpcion !== "function") {
    throw new Error("mensaje.js: ctx.reglas must be web/reglas.js (evaluarOpcion is missing)");
  }
  const p = propiedades(parcela);
  const t = plantillaDe(ctx);
  const ops = Array.isArray(opciones) ? opciones : [];
  const avisos = [AVISO_SIMULACION, AVISO_JUICIO_ES];
  const datosParcela = { parcela: p.id ?? "", area: fmtDatoEs(p.area_ha) };
  if (!ops.length) {
    // Abstenida: el mapa no sabe qué hay. Clasificada sin opciones (zona sin clima, rotación actual sin
    // armar): el cultivo sí se conoce y el mensaje dice lo que falta (ctx.sinOpciones = código del cubo).
    if (p.abstencion) return { saludo: rellenar(t.sin_opciones, datosParcela), opciones: [], respuesta: "", avisos };
    const motivo = MOTIVOS_SIN_OPCIONES_ES[ctx.sinOpciones] ?? MOTIVO_SIN_OPCIONES_ES;
    return { saludo: rellenar(t.sin_calculo, { ...datosParcela, motivo }), opciones: [], respuesta: "", avisos };
  }
  const saludo = rellenar(t.saludo, { ...datosParcela, d: fmtEs(ctx.D), lluvia: textoLluviaEs(ctx.r) });
  const partes = ops.map((o, i) => armarOpcion(o, i, p, ctx, t));
  const numeros = new Intl.ListFormat(LOCALE_ES, { type: "disjunction" }).format(
    ops.map((_, i) => fmtNum(i + 1, 0, LOCALE_ES)),
  );
  return { saludo, opciones: partes, respuesta: rellenar(t.respuesta, { numeros }), avisos };
}

export function textoWhatsApp(parcela, opciones, ctx = {}) {
  const m = armarMensaje(parcela, opciones, ctx);
  const bloques = [m.saludo];
  for (const o of m.opciones) bloques.push([`*${o.titulo}*`, o.agua, o.suelo].join("\n"));
  if (m.respuesta) bloques.push(`*${m.respuesta}*`);
  bloques.push(m.avisos.map((a) => `_${a}_`).join("\n"));
  return bloques.join("\n\n");
}

export function htmlWhatsApp(parcela, opciones, ctx = {}) {
  asegurarHoja(HOJA_MENSAJE);
  const m = armarMensaje(parcela, opciones, ctx);
  const linea = (clase, texto) => `<p class="${clase}">${formatoWhatsApp(esc(texto))}</p>`;
  const lista = m.opciones.length
    ? '<ol class="wa-opciones">' +
      m.opciones
        .map(
          (o) =>
            `<li class="wa-opcion" data-opcion="${esc(o.id)}" data-semaforo="${esc(o.semaforo)}">` +
            `<p class="wa-titulo"><strong>${formatoWhatsApp(esc(o.titulo))}</strong></p>` +
            linea("wa-agua", o.agua) +
            linea("wa-suelo", o.suelo) +
            "</li>",
        )
        .join("") +
      "</ol>"
    : "";
  return (
    '<figure class="wa-maqueta">' +
    '<figcaption class="wa-rotulo">WhatsApp message preview — a mock-up: nothing is sent. ' +
    "The farmer reads it in Spanish.</figcaption>" +
    '<div class="wa-telefono" lang="es">' +
    '<div class="wa-barra" aria-hidden="true"><span class="wa-avatar">R</span>' +
    '<span class="wa-contacto"><strong>ROOT</strong><small>vista previa · no se envía</small></span></div>' +
    '<div class="wa-chat"><div class="wa-burbuja">' +
    linea("wa-saludo", m.saludo) +
    lista +
    (m.respuesta ? `<p class="wa-respuesta"><strong>${formatoWhatsApp(esc(m.respuesta))}</strong></p>` : "") +
    m.avisos.map((a) => `<p class="wa-aviso"><em>${esc(a)}</em></p>`).join("") +
    "</div></div></div></figure>"
  );
}

// ---------------------------------------------------------------------------
// Ficha imprimible
// ---------------------------------------------------------------------------
const CLASE_AGREGADO = "solo-impresion"; // visible solo en papel (css/imprimir.css)
const MARCA_AGREGADO = "data-impresion"; // marca de lo que agrega este módulo (para quitarlo después)
const CLASE_RAIZ = "imprimir-ficha"; // en <html> mientras se imprime con el botón

function quitarAgregados(doc) {
  for (const n of doc.querySelectorAll(`[${MARCA_AGREGADO}]`)) n.remove();
  doc.documentElement.classList.remove(CLASE_RAIZ);
}

/** Dotación y lluvia elegidas: de ctx o, si faltan, de los controles de la pantalla. */
function elegidos(ctx, doc) {
  const cubo = ctx.cubo;
  const D = num(ctx.D) ?? num(doc.getElementById("dotacion")?.value);
  const r = num(ctx.r);
  if (r != null) return { D, textoLluvia: r === 0 ? "no change" : `${fmtSignoUi(r)}%` };
  // Sin ctx.r: el interruptor de la pantalla. Encendido = la variante seca, con el rótulo que muestra la
  // pantalla (lo escribe app.js con cubo.lluvia_pct); apagado = sin cambio.
  const sw = doc.getElementById("lluvia");
  if (!sw) return { D, textoLluvia: "not available" };
  if (!sw.checked) return { D, textoLluvia: "no change" };
  const lluvias = (cubo?.lluvia_pct ?? []).map(Number);
  const seca = lluvias.find((v) => v !== (lluvias.includes(0) ? 0 : lluvias[0]));
  if (seca !== undefined) return { D, textoLluvia: `${fmtSignoUi(seca)}%` };
  return { D, textoLluvia: doc.getElementById("lluvia-etiqueta")?.textContent?.trim() || "not available" };
}

function filaDato(titulo, valor) {
  return `<div><dt>${esc(titulo)}</dt><dd>${valor}</dd></div>`;
}

function htmlDatosImpresion(ctx, doc) {
  const cubo = ctx.cubo ?? {};
  const { D, textoLluvia } = elegidos(ctx, doc);
  const dot = cubo.dotaciones ?? {};
  const marca = D == null ? null : (dot.marcas ?? []).find((m) => num(m.valor) === D);
  let dotacion = D == null ? "not available" : `${esc(fmtUi(D))} thousand m³/ha`;
  if (marca) {
    const detalle = [
      `range ${fmtRango(marca.min, marca.max, fmtDatoUi)}`,
      marca.fuente ? `source: ${marca.fuente}` : "",
      marca.etiqueta ?? "",
    ].filter(Boolean);
    dotacion += ` · <strong>${esc(marca.nombre)}</strong> <span class="impresion-detalle">(${esc(detalle.join("; "))})</span>`;
  }
  const p = propiedades(ctx.parcela);
  const zona = p.zona && cubo.zonas?.[p.zona] ? cubo.zonas[p.zona].nombre_mostrar ?? cubo.zonas[p.zona].nombre : null;
  const filas = [
    filaDato("Water allocation", dotacion),
    filaDato("Rain", esc(textoLluvia)),
    dot.punto_medicion ? filaDato("Measured at", esc(dot.punto_medicion)) : "",
    zona ? filaDato("Pilot area", esc(zona)) : "",
    filaDato("Printed", esc(fmtFechaUi(ctx.fecha ?? new Date(), "long"))),
    cubo.meta?.generado ? filaDato("Data generated", esc(fmtFechaUi(cubo.meta.generado))) : "",
  ];
  return `<h3 class="impresion-titulo">Values used on this sheet</h3><dl class="impresion-lista">${filas.join("")}</dl>`;
}

/** Forma corta de una fuente para el papel: hasta el primer «;» o « (» (el detalle completo está en
 *  manifest.json y en la sección About & Data). */
function fuenteCorta(texto) {
  const t = String(texto).trim();
  const corte = [t.indexOf(";"), t.indexOf(" (")].filter((i) => i > 0);
  return corte.length ? t.slice(0, Math.min(...corte)).trim() : t;
}

/** Lista de fuentes: manifest.json (fuentes_de_origen) o, sin él, los archivos de cubo.meta.fuentes. */
function htmlFuentes(ctx) {
  const deManifiesto = (ctx.manifiesto?.fuentes_de_origen ?? []).filter((f) => f?.fuente);
  let items = [];
  let pie = "";
  if (deManifiesto.length) {
    // Fuentes sin repetir; la fecha de consulta, una sola vez si todas coinciden.
    const fechas = new Set(deManifiesto.map((f) => f.fecha_consulta ?? f.fecha).filter(Boolean));
    const unaFecha = fechas.size === 1;
    const vistos = new Set();
    for (const f of deManifiesto) {
      const corta = fuenteCorta(f.fuente);
      if (vistos.has(corta)) continue;
      vistos.add(corta);
      const fecha = f.fecha_consulta ?? f.fecha;
      items.push(esc(corta) + (!unaFecha && fecha ? ` <span class="impresion-detalle">(${esc(fmtFechaUi(fecha))})</span>` : ""));
    }
    if (unaFecha) pie = `<p class="impresion-detalle">Accessed ${esc(fmtFechaUi([...fechas][0]))}. Full source list in manifest.json.</p>`;
  } else {
    const archivos = (ctx.cubo?.meta?.fuentes ?? [])
      .map((f) => String(f).split("/").pop())
      .filter((f) => f && !f.startsWith("."));
    if (archivos.length) items = [`Data files: ${esc(archivos.join(", "))}`];
    // ctx.errorManifiesto: manifest.json existe pero no se pudo leer; se dice en la hoja (no en silencio).
    if (ctx.errorManifiesto) {
      pie = `<p class="impresion-detalle">The source list in manifest.json could not be read (${esc(ctx.errorManifiesto)}); the data files of the cube are listed instead.</p>`;
    }
  }
  const lista = items.length
    ? `<ul class="impresion-fuentes-lista">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`
    : "<p>Not available.</p>";
  return `<h3 class="impresion-titulo">Sources</h3>${lista}${pie}`;
}

/** Leyenda de La gota estática: qué opción y qué variante quedaron en pantalla. */
function htmlLeyendaGota(gota) {
  const sel = gota.querySelector("#gota-opcion");
  const opcion = sel?.selectedOptions?.[0]?.textContent?.trim();
  const goteo = gota.querySelector("#gota-goteo");
  const conGoteo = goteo && !goteo.hidden && goteo.getAttribute("aria-pressed") === "true";
  const tope = gota.querySelector("#gota-tope");
  const variante = !conGoteo ? VARIANTE_GOTA.actual : tope?.checked === false ? VARIANTE_GOTA.sin_tope : VARIANTE_GOTA.con_tope;
  return `Static view${opcion ? ` of <strong>${esc(opcion)}</strong>` : ""}, ${esc(variante)}.`;
}

export async function imprimirFicha(ctx = {}) {
  const doc = globalThis.document;
  const ficha = ctx.ficha ?? doc?.getElementById("ficha");
  if (!ficha || ficha.hidden) return false;
  await asegurarHoja(HOJA_IMPRIMIR, doc);
  quitarAgregados(doc); // por si quedó algo de una impresión anterior

  const cuerpo = ficha.querySelector("#ficha-cuerpo") ?? ficha;
  const nuevo = (etiqueta, clase, html) => {
    const n = doc.createElement(etiqueta);
    n.className = `${CLASE_AGREGADO} ${clase}`;
    n.setAttribute(MARCA_AGREGADO, "");
    n.innerHTML = html;
    return n;
  };

  // Dotación, lluvia, fecha y zona: debajo del encabezado de la ficha.
  const datos = nuevo("section", "impresion-datos", htmlDatosImpresion(ctx, doc));
  const encabezado = cuerpo.querySelector(".ficha-encabezado");
  if (encabezado) encabezado.after(datos);
  else cuerpo.prepend(datos);

  // La gota: sin controles en papel; una línea dice qué se ve.
  const gota = cuerpo.querySelector("#seccion-gota, .gota");
  if (gota) {
    const leyenda = nuevo("p", "impresion-gota", htmlLeyendaGota(gota));
    // Debajo del título de la sección (el que nombra aria-labelledby); si no hay, al inicio.
    const idTitulo = gota.getAttribute("aria-labelledby");
    const titulo = idTitulo ? doc.getElementById(idTitulo) : null;
    if (titulo && gota.contains(titulo)) titulo.after(leyenda);
    else gota.prepend(leyenda);
  }

  // Fuentes y aviso de juicio local al final (el aviso ya va en la ficha; si faltara, se agrega).
  const avisoFalta = !cuerpo.querySelector(".aviso-juicio");
  cuerpo.append(
    nuevo(
      "section",
      "impresion-fuentes",
      htmlFuentes(ctx) + (avisoFalta ? `<p class="aviso-juicio">${esc(AVISO_JUICIO)}</p>` : ""),
    ),
  );

  doc.documentElement.classList.add(CLASE_RAIZ);
  // Se limpia al terminar la impresión (en algunos navegadores print() no espera al diálogo).
  globalThis.addEventListener?.("afterprint", () => quitarAgregados(doc), { once: true });
  (ctx.imprimir ?? (() => globalThis.print()))();
  return true;
}
