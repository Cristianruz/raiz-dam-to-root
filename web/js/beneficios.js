// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/beneficios.js — «Benefits» del bloque «Why?» de cada tarjeta de la ficha (hallazgo I10 de la revisión total:
// el reto pide decir, para cada estrategia de rotación, qué beneficios trae; la frase fija que había describía la
// herramienta y no la estrategia, y era la misma en todas las opciones).
//
// Qué hace: compara ESTA opción con la rotación ACTUAL de la MISMA parcela, solo con los datos de esa parcela en
// web/data/cubo.json (cubo.parcelas[id].opciones). Un renglón por tema:
//   · agua por año          agua.lamina_bruta[lluvia].p50 (la mediana, en el escenario de lluvia elegido);
//   · años que compromete   agua.plazo_anios (desde la siembra) y agua.plazo_restante (lo que le queda a esta parcela);
//   · suelo desnudo         suelo.dias_desnudo (temporada de viento) con su origen: medido o estimado;
//   · leguminosa            suelo.leguminosa;
//   · plagas y raíz         suelo.ruptura_plagas y suelo.raiz_profunda; en null, «no data in the rotation table».
//
// Reglas (CLAUDE.md, regla 10: la herramienta apoya y no sustituye el juicio del agricultor ni del técnico):
//   · son diferencias descritas, no promesas ni un orden entre opciones: el texto dice «less», «more», «fewer»,
//     «shorter», «longer» o «the same» y da las dos cifras; nunca califica una opción ni dice qué conviene;
//   · si la opción pide más agua o más años que la actual, se dice igual de claro que cuando pide menos;
//   · del agua no se dice que se libere ni que se ahorre: solo cuánta pide cada una;
//   · un dato ausente se dice («no data»); nunca se escribe cero en su lugar ni se omite en silencio;
//   · ninguna cifra escrita a mano: todo número sale de la opción y de la ACTUAL. El formato lo pone quien llama
//     (app.js pasa el de las tarjetas: un decimal para la lámina, la precisión del dato para días y años);
//   · el plazo tiene dos lecturas cuando hay un rodal en pie: los años desde la siembra (plazo_anios) y los que le
//     quedan a esta parcela (plazo_restante). Un alfalfar al que le quedan 0–1 años vuelve a comprometer 3–4 si se
//     resiembra, así que decir «shorter» o «longer» ahí sería tomar partido por una de las dos lecturas: se dan las
//     cifras de las dos opciones, sin calificar. «shorter» y «longer» se dicen solo cuando ninguna de las dos tiene
//     un plazo restante distinto del completo y un rango queda entero por debajo o por encima del otro.
//
// Módulo puro (sin DOM ni estado): lo prueba tests/beneficios.test.js con Node, también contra todas las opciones
// de web/data/cubo.json.
//
// API:
//   TEXTO_BASE                                frase de la opción ACTUAL (es la base de la comparación)
//   beneficiosDeOpcion({ opcion, opciones, llave, formato })
//       opcion    la opción de la tarjeta (cubo.parcelas[id].opciones[i])
//       opciones  todas las opciones de esa parcela (de ahí sale la ACTUAL)
//       llave     llave de lluvia del cubo (llaveLluvia(r) de web/reglas.js)
//       formato   opcional: { millares(v), dato(v) }; lo que falte usa el formato por omisión
//     -> { caso: "base", renglones: [{ rotulo: null, texto: TEXTO_BASE }] }      para la opción ACTUAL
//      | { caso: "comparacion", renglones: [{ rotulo, texto }, …] }              para una alternativa; el primero
//                                                                                presenta la comparación (sin rótulo)
//      | null   sin opción, sin ACTUAL o sin alternativas (el nogal): la página conserva el texto que ya tenía
//   textoRenglon({ rotulo, texto })           -> «rótulo: texto» (o solo el texto si no lleva rótulo)

const LOCALE = "en-US";
const MENOS = "−"; // signo menos tipográfico, como en app.js
const ID_ACTUAL = "ACTUAL";
// Decimales por omisión (los de las tarjetas: fmtMillares y fmtDato de app.js). Son formato, no datos.
const DECIMALES = { millares: 1, dato: 3 };

export const TEXTO_BASE =
  "This is the field's current rotation: the baseline. Under “Benefits”, each alternative is compared with it.";

// Rótulo de cada renglón (sin números).
const ROTULOS = {
  agua: "Water per year",
  plazo: "Water term",
  desnudo: "Bare soil in the windy season",
  leguminosa: "Legume (adds nitrogen)",
};
// Indicadores de la tabla de rotaciones que hoy llegan en null: campo del contrato y su nombre en la tarjeta.
const INDICADORES = [
  ["ruptura_plagas", "Breaks the pest cycle"],
  ["raiz_profunda", "Deep roots"],
];
// Origen de los días de suelo desnudo (suelo.dias_desnudo_origen), como en la tarjeta.
const ORIGEN = { medido: "measured", estimado: "estimated" };
const PREFIJO_ACTUAL = /^\s*current rotation\s*:\s*/i;

const esNum = (v) => typeof v === "number" && Number.isFinite(v);
const booleano = (v) => (typeof v === "boolean" ? v : null);
const siNo = (v) => (v ? "yes" : "no");
const minuscula = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const renglon = (rotulo, texto) => ({ rotulo, texto });

function numero(v, decimales) {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: decimales }).format(v).replace("-", MENOS);
}
const FORMATO = {
  millares: (v) => numero(v, DECIMALES.millares),
  dato: (v) => numero(v, DECIMALES.dato),
};

/** «rótulo: texto» de un renglón (o solo el texto si no lleva rótulo): el renglón como una sola frase. */
export function textoRenglon(r) {
  return r?.rotulo ? `${r.rotulo}: ${r.texto}` : String(r?.texto ?? "");
}

/** Mediana de la lámina bruta en el escenario de lluvia pedido; null si el cubo no la trae (no se toma otra). */
function mediana(o, llave) {
  const v = o?.agua?.lamina_bruta?.[llave]?.p50;
  return esNum(v) ? v : null;
}

/** Un rango del cubo ({ min, max }) si sus dos extremos son números; si no, null. */
function rango(r) {
  return r && typeof r === "object" && esNum(r.min) && esNum(r.max) ? r : null;
}
const textoRango = (r, f) => (r.min === r.max ? f.dato(r.min) : `${f.dato(r.min)}–${f.dato(r.max)}`);
/** «year» para un valor único igual a uno; un rango («0–1 years») va en plural. */
const anios = (r) => (r.min === r.max && r.max === 1 ? "year" : "years");

// ---------------------------------------------------------------------------
// Textos de cada renglón (lo que sigue al rótulo)
// ---------------------------------------------------------------------------
/** Agua por año: la mediana de la opción y la de la actual, con «less», «more» o «the same». */
function textoAgua(o, a, llave, f) {
  const vo = mediana(o, llave);
  const va = mediana(a, llave);
  const cuanto = (v) => `${f.millares(v)} thousand m³/ha`;
  const actual =
    va == null
      ? "no data for the current rotation"
      : va > 0
        ? `the current rotation asks for ${cuanto(va)} (median need)`
        : "the current rotation needs no irrigation";
  if (vo == null) return va == null ? "no data." : `no data for this option; ${actual}.`;
  if (!(vo > 0)) {
    return va != null && !(va > 0) ? "no irrigation needed, like the current rotation." : `no irrigation needed; ${actual}.`;
  }
  const esta = `${cuanto(vo)} (median need)`;
  if (va == null) return `${esta}; ${actual}.`;
  if (!(va > 0)) return `${esta}, more than the current rotation, which needs no irrigation.`;
  if (vo === va) return `${esta}, the same as the current rotation.`;
  // Distintas en el dato, iguales con los decimales de la tarjeta: no se dice «less» ni «more» sobre cifras iguales.
  if (f.millares(vo) === f.millares(va)) return `${esta}, about the same as the current rotation.`;
  return `${esta}, ${vo < va ? "less" : "more"} than the current rotation's ${f.millares(va)}.`;
}

/** «3–4 years (0–1 years left on this field)»: el plazo desde la siembra y, si difiere, lo que le queda a la parcela. */
function plazoDe(agua, f) {
  const total = rango(agua?.plazo_anios);
  const resta = rango(agua?.plazo_restante);
  if (!total && !resta) return null;
  const queda = resta ? `${textoRango(resta, f)} ${anios(resta)} left on this field` : "";
  if (!total) return queda;
  const completo = `${textoRango(total, f)} ${anios(total)}`;
  return resta && (resta.min !== total.min || resta.max !== total.max) ? `${completo} (${queda})` : completo;
}

/** El plazo completo de una opción si no trae un plazo restante distinto (no hay un rodal en pie a medio plazo). */
function plazoSinRodal(agua) {
  const total = rango(agua?.plazo_anios);
  const resta = rango(agua?.plazo_restante);
  return total && (!resta || (resta.min === total.min && resta.max === total.max)) ? total : null;
}

/**
 * Años que compromete: los de la opción y los de la actual. «shorter» o «longer» solo sin rodal a medio plazo en
 * ninguna de las dos y con rangos que no se tocan; en los demás casos se dan las dos cifras sin calificar.
 */
function textoPlazo(o, a, f) {
  const to = plazoDe(o?.agua, f);
  const ta = plazoDe(a?.agua, f);
  if (!to && !ta) return "no data.";
  if (!to) return `no data for this option; the current rotation's is ${ta}.`;
  if (!ta) return `${to}; no data for the current rotation.`;
  if (to === ta) return `${to}, the same as the current rotation.`;
  const ro = plazoSinRodal(o.agua);
  const ra = plazoSinRodal(a.agua);
  if (ro && ra && ro.max < ra.min) return `${to}, shorter than the current rotation's ${ta}.`;
  if (ro && ra && ro.min > ra.max) return `${to}, longer than the current rotation's ${ta}.`;
  return `${to}; the current rotation's is ${ta}.`;
}

/** «20 days (estimated)»: los días de suelo desnudo con su origen; null si el dato falta (nunca cero). */
function desnudoDe(suelo, f) {
  const dias = suelo?.dias_desnudo;
  if (!esNum(dias)) return null;
  const origen = ORIGEN[suelo.dias_desnudo_origen];
  return `${f.dato(dias)} ${dias === 1 ? "day" : "days"}${origen ? ` (${origen})` : ""}`;
}

/** Días de suelo desnudo en la temporada de viento: los de la opción y los de la actual. */
function textoDesnudo(o, a, f) {
  const to = desnudoDe(o?.suelo, f);
  const ta = desnudoDe(a?.suelo, f);
  if (!to && !ta) return "no data.";
  if (!to) return `no data for this option; the current rotation has ${ta}.`;
  if (!ta) return `${to}; no data for the current rotation.`;
  const vo = o.suelo.dias_desnudo;
  const va = a.suelo.dias_desnudo;
  const comparacion = vo === va ? "the same as" : vo < va ? "fewer than" : "more than";
  return `${to}, ${comparacion} the current rotation's ${ta}.`;
}

/** Leguminosa: sí o no, y si la actual lo es. */
function textoLeguminosa(o, a) {
  const vo = booleano(o?.suelo?.leguminosa);
  const va = booleano(a?.suelo?.leguminosa);
  const actual = va ? "the current rotation is a legume" : "the current rotation is not a legume";
  if (vo == null) return `no data for this option${va == null ? "" : `; ${actual}`}.`;
  if (va == null) return `${siNo(vo)}; no data for the current rotation.`;
  return vo === va ? `${siNo(vo)}, like the current rotation.` : `${siNo(vo)}; ${actual}.`;
}

/** Ruptura de plagas y raíz profunda: con dato, su valor; en null, un solo renglón que dice que la tabla no lo trae. */
function renglonesIndicadores(o, a) {
  const renglones = [];
  const sinDato = [];
  for (const [campo, nombre] of INDICADORES) {
    const vo = booleano(o?.suelo?.[campo]);
    if (vo == null) {
      sinDato.push(nombre);
      continue;
    }
    const va = booleano(a?.suelo?.[campo]);
    if (va == null) renglones.push(renglon(nombre, `${siNo(vo)}.`));
    else if (vo === va) renglones.push(renglon(nombre, `${siNo(vo)}, like the current rotation.`));
    else renglones.push(renglon(nombre, `${siNo(vo)}; the current rotation: ${siNo(va)}.`));
  }
  if (sinDato.length) {
    const nombres = sinDato.map((n, i) => (i ? minuscula(n) : n)).join(" and ");
    renglones.push(renglon(nombres, "no data in the rotation table for this option."));
  }
  return renglones;
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export function beneficiosDeOpcion({ opcion, opciones, llave, formato } = {}) {
  const ops = Array.isArray(opciones) ? opciones.filter(Boolean) : [];
  const actual = ops.find((o) => o.id === ID_ACTUAL) ?? null;
  const hayAlternativas = ops.some((o) => o.id !== ID_ACTUAL);
  // Sin con qué comparar (el nogal no rota y solo trae la ACTUAL): la página conserva lo que ya decía.
  if (!opcion || !actual || !hayAlternativas) return null;
  if (opcion.id === ID_ACTUAL) return { caso: "base", renglones: [renglon(null, TEXTO_BASE)] };
  const f = { ...FORMATO, ...(formato ?? {}) };
  const nombre = String(actual.nombre ?? "").replace(PREFIJO_ACTUAL, "").trim();
  return {
    caso: "comparacion",
    renglones: [
      renglon(null, `Compared with the current rotation of this field${nombre ? ` (${nombre})` : ""}:`),
      renglon(ROTULOS.agua, textoAgua(opcion, actual, String(llave), f)),
      renglon(ROTULOS.plazo, textoPlazo(opcion, actual, f)),
      renglon(ROTULOS.desnudo, textoDesnudo(opcion, actual, f)),
      renglon(ROTULOS.leguminosa, textoLeguminosa(opcion, actual)),
      ...renglonesIndicadores(opcion, actual),
    ],
  };
}
