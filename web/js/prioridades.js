// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// web/js/prioridades.js — «What matters most to you?»: las prioridades del productor en la ficha (hallazgo I24 de la
// revisión independiente: el reto pide combinar uso de agua, valor forrajero, fijación de nitrógeno, reducción de
// erosión, materia orgánica y mercado).
//
// Qué hace:
// - encima de las tarjetas de opciones, una fila de interruptores con las prioridades que el cubo YA respalda con dato
//   para esa parcela; las que no tienen dato se listan desactivadas con «no data in ROOT yet»;
// - al activar una, cada tarjeta que la cumple muestra una marca visible (símbolo ✓ y texto, no solo color); las demás
//   quedan igual. SIN pesos, SIN puntaje, SIN reordenar y SIN «best»: la nota fija lo dice bajo los interruptores
//   (CLAUDE.md regla 10: la herramienta apoya y no sustituye el juicio del agricultor ni del técnico);
// - las comparaciones contra la opción ACTUAL se calculan aquí desde web/data/cubo.json; ningún número escrito.
//
// De dónde sale cada prioridad (campos del contrato v4, kit §2):
//   Less water                agua.lamina_bruta[lluvia].p50 menor que la de la ACTUAL en TODAS las variantes de lluvia
//                             del cubo (así la marca no depende del interruptor de lluvia);
//   Shorter water commitment  agua.plazo_restante: el rango entero por debajo del de la ACTUAL (max < min de la ACTUAL);
//   Fixes nitrogen            suelo.leguminosa === true;
//   Breaks pest cycles        suelo.ruptura_plagas === true;
//   Deep roots                suelo.raiz_profunda === true;
//   Less bare soil            suelo.dias_desnudo menor que el de la ACTUAL (días desnudos en la temporada de viento);
//   Market / money            dinero.margen_min mayor que el margen_max de la ACTUAL (rango entero por encima; el kit
//                             dice que el margen con fuente se compara contra la opción actual);
//   Forage value, Organic matter: el cubo no trae ningún campo → siempre «no data in ROOT yet».
// Reglas:
// - una prioridad se OFRECE en la parcela si al menos una alternativa (opción que no es la ACTUAL) se puede evaluar
//   con dato; si solo la ACTUAL trae el dato, no hay con qué respaldarla y va desactivada;
// - un dato null nunca cuenta como «no cumple»: se cuenta aparte («no data for …») en la línea de estado;
// - las comparaciones son estrictas: empate o rangos que se traslapan no cuentan; la ACTUAL es la referencia y no se
//   marca en una comparación (en un atributo, como la leguminosa, sí puede marcarse);
// - la selección se recuerda mientras dura la página (al abrir otra ficha se aplica de nuevo); no se guarda.
//
// API:
//   PRIORIDADES                         catálogo [{ id, etiqueta, marca, evaluar(opcion, actual) }]
//   evaluarPrioridad(id, opcion, actual) -> true | false | null (null = sin dato)
//   prioridadesDeParcela(opciones)      -> [{ id, etiqueta, marca, disponible, cumplen: [ids], sinDato: [ids], total }]
//   marcasDeOpcion(idOpcion, filas, activas) -> [textos de marca]   (activas: Set de ids)
//   textoEstado(filas, activas)         -> texto de la línea de estado (aria-live)
//   htmlGrupo(filas, activas)           -> HTML de la fila ("" si la parcela no tiene ninguna prioridad con dato)
//   montarPrioridades(tarjetas, opciones) dibuja la fila antes del contenedor .tarjetas y conecta los botones.

export const TEXTO_TITULO = "What matters most to you?";
export const TEXTO_NOTA = "Just highlights — ROOT does not rank options; you and your technician decide.";
export const TEXTO_SIN_DATO = "no data in ROOT yet";
const ID_ACTUAL = "ACTUAL";

const esNum = (v) => typeof v === "number" && Number.isFinite(v);
const esBool = (v) => typeof v === "boolean";

// Escapa texto para HTML (igual que app.js; los atributos van entre comillas dobles).
function esc(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// --- Evaluadores ---------------------------------------------------------------------------------------------------

/** Atributo booleano del renglón Soil: true cumple, false no cumple, cualquier otro valor es «sin dato». */
function atributo(campo) {
  return (o) => (esBool(o?.suelo?.[campo]) ? o.suelo[campo] : null);
}

/**
 * Comparación contra la ACTUAL. `extraer(opcion)` devuelve el valor o null; `cumple(vo, va)` devuelve true, false o
 * null. Sin valor en la opción o en la ACTUAL (o sin ACTUAL): null. La ACTUAL contra sí misma da false porque todas
 * las comparaciones son estrictas (la referencia nunca se marca).
 */
function contraActual(extraer, cumple) {
  return (o, actual) => {
    const vo = extraer(o);
    const va = actual ? extraer(actual) : null;
    if (vo == null || va == null) return null;
    return cumple(vo, va);
  };
}

// Mediana de la lámina bruta por variante de lluvia: { "0": p50, "-20": p50 } (las llaves las pone el cubo).
function medianas(o) {
  const lb = o?.agua?.lamina_bruta;
  if (!lb || typeof lb !== "object") return null;
  const salida = {};
  for (const [llave, banda] of Object.entries(lb)) if (esNum(banda?.p50)) salida[llave] = banda.p50;
  return Object.keys(salida).length ? salida : null;
}
function menorEnTodas(vo, va) {
  const llaves = Object.keys(va);
  if (llaves.some((k) => !esNum(vo[k]))) return null; // a la opción le falta una variante de lluvia
  return llaves.every((k) => vo[k] < va[k]);
}

function rango(v) {
  return v && esNum(v.min) && esNum(v.max) ? v : null;
}
function margen(o) {
  const d = o?.dinero;
  return d && esNum(d.margen_min) && esNum(d.margen_max) ? d : null;
}
function numero(ruta) {
  return (o) => {
    const v = ruta(o);
    return esNum(v) ? v : null;
  };
}

// El cubo no trae el campo: nunca hay dato.
const sinCampo = () => null;

// --- Catálogo (orden fijo: es el orden de los botones y de las marcas; no es un orden de importancia) ---------------
export const PRIORIDADES = [
  {
    id: "menos_agua",
    etiqueta: "Less water",
    marca: "Less water than the current rotation (median need, in every rain scenario)",
    evaluar: contraActual(medianas, menorEnTodas),
  },
  {
    id: "plazo_corto",
    etiqueta: "Shorter water commitment",
    marca: "Commits water for fewer years than the current rotation",
    evaluar: contraActual((o) => rango(o?.agua?.plazo_restante), (vo, va) => vo.max < va.min),
  },
  {
    id: "fija_nitrogeno",
    etiqueta: "Fixes nitrogen",
    marca: "Fixes nitrogen (legume)",
    evaluar: atributo("leguminosa"),
  },
  {
    id: "rompe_plagas",
    etiqueta: "Breaks pest cycles",
    marca: "Breaks the pest cycle",
    evaluar: atributo("ruptura_plagas"),
  },
  {
    id: "raiz_profunda",
    etiqueta: "Deep roots",
    marca: "Deep roots",
    evaluar: atributo("raiz_profunda"),
  },
  {
    id: "menos_desnudo",
    etiqueta: "Less bare soil",
    marca: "Fewer days of bare soil in the windy season than the current rotation",
    evaluar: contraActual(numero((o) => o?.suelo?.dias_desnudo), (vo, va) => vo < va),
  },
  {
    id: "valor_forrajero",
    etiqueta: "Forage value",
    marca: "Forage value",
    evaluar: sinCampo,
  },
  {
    id: "materia_organica",
    etiqueta: "Organic matter",
    marca: "Organic matter",
    evaluar: sinCampo,
  },
  {
    id: "mercado",
    etiqueta: "Market / money",
    marca: "Higher margin range than the current rotation (sourced)",
    evaluar: contraActual(margen, (vo, va) => vo.margen_min > va.margen_max),
  },
];
const POR_ID = new Map(PRIORIDADES.map((p) => [p.id, p]));

/** true (cumple), false (no cumple) o null (sin dato) para una prioridad (id u objeto) y una opción del cubo. */
export function evaluarPrioridad(prioridad, opcion, actual) {
  const p = typeof prioridad === "string" ? POR_ID.get(prioridad) : prioridad;
  if (!p) throw new Error(`ROOT: unknown priority ${prioridad}`);
  const v = p.evaluar(opcion, actual ?? null);
  return v === true || v === false ? v : null;
}

/** Una fila por prioridad del catálogo: si se ofrece en esta parcela y qué opciones la cumplen (orden del cubo). */
export function prioridadesDeParcela(opciones) {
  const ops = Array.isArray(opciones) ? opciones.filter(Boolean) : [];
  const actual = ops.find((o) => o.id === ID_ACTUAL) ?? null;
  const alternativas = ops.filter((o) => o.id !== ID_ACTUAL);
  return PRIORIDADES.map((p) => {
    const resultados = ops.map((o) => ({ id: o.id, v: evaluarPrioridad(p, o, actual) }));
    return {
      id: p.id,
      etiqueta: p.etiqueta,
      marca: p.marca,
      disponible: alternativas.some((o) => evaluarPrioridad(p, o, actual) !== null),
      cumplen: resultados.filter((r) => r.v === true).map((r) => r.id),
      sinDato: resultados.filter((r) => r.v === null).map((r) => r.id),
      total: ops.length,
    };
  });
}

const activa = (f, activas) => f.disponible && activas.has(f.id);

/** Textos de las marcas de una tarjeta: las prioridades activas (y ofrecidas) que esa opción cumple. */
export function marcasDeOpcion(idOpcion, filas, activas) {
  return filas.filter((f) => activa(f, activas) && f.cumplen.includes(idOpcion)).map((f) => f.marca);
}

/** Línea de estado (se anuncia): cuántas opciones resalta cada prioridad activa y cuántas no tienen el dato. */
export function textoEstado(filas, activas) {
  return filas
    .filter((f) => activa(f, activas))
    .map((f) => `${f.etiqueta}: highlighted on ${f.cumplen.length} of ${f.total} options${f.sinDato.length ? ` (no data for ${f.sinDato.length})` : ""}.`)
    .join(" ");
}

function htmlBoton(f, activas) {
  const on = activa(f, activas);
  if (!f.disponible) {
    return (
      `<button type="button" class="prioridad-boton" data-prioridad="${esc(f.id)}" aria-pressed="false" disabled>` +
      `${esc(f.etiqueta)}<span class="solo-lector"> — ${esc(TEXTO_SIN_DATO)}</span></button>`
    );
  }
  return (
    `<button type="button" class="prioridad-boton" data-prioridad="${esc(f.id)}" aria-pressed="${on ? "true" : "false"}">` +
    `<span class="prioridad-simbolo" aria-hidden="true">${on ? "✓" : "+"}</span> ${esc(f.etiqueta)}</button>`
  );
}

/** HTML de la fila de prioridades. "" si ninguna prioridad tiene dato en la parcela (no hay nada que resaltar). */
export function htmlGrupo(filas, activas) {
  if (!filas.some((f) => f.disponible)) return "";
  const con = filas.filter((f) => f.disponible);
  const sin = filas.filter((f) => !f.disponible);
  const textoSin = TEXTO_SIN_DATO.charAt(0).toUpperCase() + TEXTO_SIN_DATO.slice(1);
  return (
    '<div class="prioridades" data-parte="prioridades">' +
    '<div class="prioridades-grupo" role="group" aria-labelledby="prioridades-titulo">' +
    `<h4 class="prioridades-titulo" id="prioridades-titulo">${esc(TEXTO_TITULO)}</h4>` +
    `<div class="prioridades-botones">${con.map((f) => htmlBoton(f, activas)).join("")}</div>` +
    (sin.length
      ? `<div class="prioridades-sin-dato"><span class="prioridades-sin-dato-titulo" aria-hidden="true">${esc(textoSin)}:</span>` +
        `${sin.map((f) => htmlBoton(f, activas)).join("")}</div>`
      : "") +
    "</div>" +
    `<p class="prioridades-nota">${esc(TEXTO_NOTA)}</p>` +
    '<p class="prioridades-estado" role="status" aria-live="polite"></p>' +
    "</div>"
  );
}

function htmlMarcas(marcas) {
  return marcas.map((m) => `<li><span class="prioridad-marca-simbolo" aria-hidden="true">✓</span> ${esc(m)}</li>`).join("");
}

// --- DOM ------------------------------------------------------------------------------------------------------------

// Selección del productor mientras dura la página (ids de PRIORIDADES). No se guarda en el navegador.
const activas = new Set();

/**
 * Dibuja la fila antes del contenedor `.tarjetas` de la ficha y una lista de marcas (vacía y oculta) en cada tarjeta,
 * bajo su cabecera. app.js la llama al armar la ficha. Sin contenedor (parcela sin tarjetas) no hace nada. Un error
 * aquí no tumba la ficha: se avisa en la consola.
 */
export function montarPrioridades(tarjetas, opciones) {
  try {
    if (!tarjetas) return;
    const filas = prioridadesDeParcela(opciones);
    const html = htmlGrupo(filas, activas);
    if (!html) return;
    tarjetas.insertAdjacentHTML("beforebegin", html);
    const raiz = tarjetas.previousElementSibling;
    const estado = raiz.querySelector(".prioridades-estado");
    const cajas = [];
    for (const t of tarjetas.querySelectorAll(".tarjeta[data-opcion]")) {
      const lista = document.createElement("ul");
      lista.className = "prioridad-marcas";
      lista.dataset.parte = "prioridades-marcas";
      lista.setAttribute("aria-label", "Matches your priorities");
      lista.hidden = true;
      const cabeza = t.querySelector(".tarjeta-cabeza");
      if (cabeza) cabeza.after(lista);
      else t.prepend(lista);
      cajas.push({ t, lista, id: t.dataset.opcion });
    }

    const pintar = () => {
      for (const b of raiz.querySelectorAll(".prioridades-botones .prioridad-boton")) {
        const on = activas.has(b.dataset.prioridad);
        b.setAttribute("aria-pressed", on ? "true" : "false");
        const s = b.querySelector(".prioridad-simbolo");
        if (s) s.textContent = on ? "✓" : "+";
      }
      for (const { t, lista, id } of cajas) {
        const marcas = marcasDeOpcion(id, filas, activas);
        lista.innerHTML = htmlMarcas(marcas);
        lista.hidden = marcas.length === 0;
        if (marcas.length) t.dataset.prioridad = "cumple";
        else delete t.dataset.prioridad;
      }
      estado.textContent = textoEstado(filas, activas);
    };

    raiz.addEventListener("click", (ev) => {
      const b = ev.target.closest(".prioridades-botones .prioridad-boton");
      if (!b || b.disabled) return;
      const id = b.dataset.prioridad;
      if (activas.has(id)) activas.delete(id);
      else activas.add(id);
      pintar();
    });
    pintar();
  } catch (err) {
    console.error("ROOT: the priorities row could not be built", err);
  }
}
