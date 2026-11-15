// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Pruebas de las funciones puras de web/js/prioridades.js (sin DOM, con Node): la fila «What matters most to you?»
// de la ficha (hallazgo I24: el reto pide combinar las prioridades del productor).
// - qué prioridades ofrece una parcela: solo las que el cubo respalda con dato en alguna alternativa;
// - qué opciones cumplen cada una, comparadas contra la opción ACTUAL (estrictas: empate o rango que se traslapa no
//   cuenta; menos agua debe valer en TODAS las variantes de lluvia del cubo);
// - un dato null nunca cuenta como «no cumple» (se cuenta aparte como «no data»);
// - sin pesos, sin puntaje y sin reordenar: el orden de salida es el del cubo;
// - el HTML del grupo: role="group", aria-pressed, la nota fija y las desactivadas con «no data in ROOT yet».
// Conectada al comando único (node --test tests/*.test.js, paso de construir.py).
// Uso:  node --test tests/prioridades.test.js
// Los números de este archivo son DATOS DE PRUEBA (un cubo mínimo inventado para la prueba), no cifras del proyecto.
import test from "node:test";
import assert from "node:assert/strict";

const RAIZ = new URL("..", import.meta.url).href.replace(/\/$/, "");
const {
  PRIORIDADES,
  TEXTO_TITULO,
  TEXTO_NOTA,
  TEXTO_SIN_DATO,
  evaluarPrioridad,
  prioridadesDeParcela,
  marcasDeOpcion,
  textoEstado,
  htmlGrupo,
} = await import(`${RAIZ}/web/js/prioridades.js`);

// --- Cubo mínimo de prueba ---------------------------------------------------------------------------------------
const lam = (a, b) => ({ 0: { p10: a - 1, p50: a, p90: a + 1 }, "-20": { p10: b - 1, p50: b, p90: b + 1 } });
const opcion = (id, { l, plazo, leg = null, plagas = null, raiz = null, desnudo = null, dinero = null }) => ({
  id,
  nombre: `Option ${id}`,
  agua: { lamina_bruta: l, plazo_restante: plazo },
  suelo: { leguminosa: leg, ruptura_plagas: plagas, raiz_profunda: raiz, dias_desnudo: desnudo },
  dinero,
});
const ACTUAL = opcion("ACTUAL", { l: lam(10, 11), plazo: { min: 2, max: 3 }, leg: true, plagas: false, desnudo: 5 });
const A = opcion("A", { l: lam(6, 7), plazo: { min: 1, max: 1 }, leg: false, desnudo: 20 });
const B = opcion("B", { l: lam(12, 13), plazo: { min: 3, max: 4 }, leg: true, desnudo: 0 });
const C = opcion("C", { l: lam(0, 0), plazo: { min: 2, max: 2 }, leg: false, desnudo: null }); // descanso
const D = opcion("D", { l: lam(9, 12), plazo: { min: 1, max: 2 }, leg: false, desnudo: 5 }); // menos agua solo con lluvia base
const OPS = [ACTUAL, A, B, C, D];

const fila = (filas, id) => filas.find((f) => f.id === id);

test("catálogo: las seis prioridades con dato posible y las tres sin campo en el cubo, con ids únicos", () => {
  const ids = PRIORIDADES.map((p) => p.id);
  assert.deepEqual(ids, [
    "menos_agua", "plazo_corto", "fija_nitrogeno", "rompe_plagas", "raiz_profunda", "menos_desnudo",
    "valor_forrajero", "materia_organica", "mercado",
  ]);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of PRIORIDADES) {
    assert.ok(p.etiqueta && p.marca, `${p.id} sin etiqueta o sin marca`);
  }
  assert.deepEqual(PRIORIDADES.map((p) => p.etiqueta).slice(0, 6), [
    "Less water", "Shorter water commitment", "Fixes nitrogen", "Breaks pest cycles", "Deep roots", "Less bare soil",
  ]);
});

test("disponibles: solo las que alguna ALTERNATIVA puede respaldar con dato", () => {
  const filas = prioridadesDeParcela(OPS);
  const disponibles = filas.filter((f) => f.disponible).map((f) => f.id);
  assert.deepEqual(disponibles, ["menos_agua", "plazo_corto", "fija_nitrogeno", "menos_desnudo"]);
  // ruptura_plagas: solo la ACTUAL trae dato (false) → no hay con qué respaldarla en las alternativas.
  assert.equal(fila(filas, "rompe_plagas").disponible, false);
  assert.equal(fila(filas, "raiz_profunda").disponible, false);
  for (const id of ["valor_forrajero", "materia_organica", "mercado"]) assert.equal(fila(filas, id).disponible, false, id);
});

test("menos agua: P50 menor que la ACTUAL en todas las variantes de lluvia; orden del cubo", () => {
  const f = fila(prioridadesDeParcela(OPS), "menos_agua");
  assert.deepEqual(f.cumplen, ["A", "C"]); // D es menor con lluvia base pero mayor con −20: no cuenta
  assert.deepEqual(f.sinDato, []);
  assert.equal(evaluarPrioridad("menos_agua", ACTUAL, ACTUAL), false, "la ACTUAL es la referencia, no se marca");
  assert.equal(evaluarPrioridad("menos_agua", D, ACTUAL), false);
});

test("plazo más corto: el rango restante entero por debajo del de la ACTUAL (empate o traslape no cuenta)", () => {
  const f = fila(prioridadesDeParcela(OPS), "plazo_corto");
  // A: 1 < 2 sí; C: 2 = 2 no; D: max 2 no es menor que min 2 (traslape); B: más largo.
  assert.deepEqual(f.cumplen, ["A"]);
});

test("fija nitrógeno: leguminosa true, también en la ACTUAL (es un atributo, no una comparación)", () => {
  const f = fila(prioridadesDeParcela(OPS), "fija_nitrogeno");
  assert.deepEqual(f.cumplen, ["ACTUAL", "B"]);
});

test("menos suelo desnudo: menos días que la ACTUAL; el null no cuenta como «no cumple»", () => {
  const f = fila(prioridadesDeParcela(OPS), "menos_desnudo");
  assert.deepEqual(f.cumplen, ["B"]); // D empata (5 = 5): no cuenta
  assert.deepEqual(f.sinDato, ["C"]);
  assert.equal(evaluarPrioridad("menos_desnudo", C, ACTUAL), null);
});

test("sin ACTUAL: las comparaciones no tienen referencia (null); los atributos sí se leen", () => {
  const filas = prioridadesDeParcela([A, B]);
  assert.equal(fila(filas, "menos_agua").disponible, false);
  assert.equal(fila(filas, "plazo_corto").disponible, false);
  assert.equal(fila(filas, "menos_desnudo").disponible, false);
  assert.equal(fila(filas, "fija_nitrogeno").disponible, true);
  assert.deepEqual(fila(filas, "fija_nitrogeno").cumplen, ["B"]);
});

test("solo la ACTUAL (o ninguna opción): no hay alternativas, nada disponible y el grupo no se dibuja", () => {
  for (const ops of [[ACTUAL], []]) {
    const filas = prioridadesDeParcela(ops);
    assert.ok(filas.every((f) => !f.disponible));
    assert.equal(htmlGrupo(filas, new Set()), "");
  }
});

test("raíz profunda: se ofrece si alguna alternativa trae el dato", () => {
  const conRaiz = [ACTUAL, { ...A, suelo: { ...A.suelo, raiz_profunda: true } }, { ...B, suelo: { ...B.suelo, raiz_profunda: false } }];
  const f = fila(prioridadesDeParcela(conRaiz), "raiz_profunda");
  assert.equal(f.disponible, true);
  assert.deepEqual(f.cumplen, ["A"]);
  assert.deepEqual(f.sinDato, ["ACTUAL"]);
});

test("dinero: solo con margen de fuente en la ACTUAL y en la opción; el rango entero por encima", () => {
  assert.equal(evaluarPrioridad("mercado", A, ACTUAL), null, "dinero null → sin dato");
  const act = { ...ACTUAL, dinero: { margen_min: 1, margen_max: 2, fuente: "prueba" } };
  const arriba = { ...A, dinero: { margen_min: 3, margen_max: 4, fuente: "prueba" } };
  const traslape = { ...B, dinero: { margen_min: 2, margen_max: 5, fuente: "prueba" } };
  const f = fila(prioridadesDeParcela([act, arriba, traslape, C]), "mercado");
  assert.equal(f.disponible, true);
  assert.deepEqual(f.cumplen, ["A"]);
  assert.deepEqual(f.sinDato, ["C"]);
});

test("valor forrajero y materia orgánica: el cubo no trae el campo; nunca disponibles", () => {
  for (const id of ["valor_forrajero", "materia_organica"]) {
    for (const o of OPS) assert.equal(evaluarPrioridad(id, o, ACTUAL), null, `${id}/${o.id}`);
  }
});

test("marcas de una tarjeta: solo las prioridades activas y disponibles que la opción cumple, en el orden del catálogo", () => {
  const filas = prioridadesDeParcela(OPS);
  const activas = new Set(["menos_desnudo", "menos_agua", "rompe_plagas"]); // rompe_plagas no está disponible
  assert.deepEqual(marcasDeOpcion("A", filas, activas), [fila(filas, "menos_agua").marca]);
  assert.deepEqual(marcasDeOpcion("B", filas, activas), [fila(filas, "menos_desnudo").marca]);
  assert.deepEqual(marcasDeOpcion("C", filas, activas), [fila(filas, "menos_agua").marca]);
  assert.deepEqual(marcasDeOpcion("ACTUAL", filas, activas), []);
  assert.deepEqual(marcasDeOpcion("A", filas, new Set()), []);
});

test("estado anunciado: cuántas opciones resalta cada prioridad activa y cuántas no tienen dato", () => {
  const filas = prioridadesDeParcela(OPS);
  assert.equal(textoEstado(filas, new Set()), "");
  assert.equal(textoEstado(filas, new Set(["menos_agua"])), "Less water: highlighted on 2 of 5 options.");
  assert.equal(
    textoEstado(filas, new Set(["menos_agua", "menos_desnudo"])),
    "Less water: highlighted on 2 of 5 options. Less bare soil: highlighted on 1 of 5 options (no data for 1).",
  );
});

test("HTML del grupo: role=group con su título, botones aria-pressed, desactivadas con «no data in ROOT yet» y nota fija", () => {
  const filas = prioridadesDeParcela(OPS);
  const html = htmlGrupo(filas, new Set(["menos_agua"]));
  assert.match(html, /role="group"/);
  assert.match(html, /aria-labelledby="prioridades-titulo"/);
  assert.ok(html.includes(TEXTO_TITULO) && TEXTO_TITULO === "What matters most to you?");
  assert.ok(html.includes(TEXTO_NOTA));
  assert.equal(TEXTO_SIN_DATO, "no data in ROOT yet");
  // Un botón por prioridad disponible, con su estado; el activo dice ✓ y el resto «+».
  const botones = [...html.matchAll(/<button[^>]*data-prioridad="([^"]+)"[^>]*>/g)];
  const deId = Object.fromEntries(botones.map((m) => [m[1], m[0]]));
  assert.deepEqual(Object.keys(deId).sort(), PRIORIDADES.map((p) => p.id).sort(), "todas se listan");
  assert.match(deId.menos_agua, /aria-pressed="true"/);
  assert.match(deId.plazo_corto, /aria-pressed="false"/);
  for (const id of ["rompe_plagas", "raiz_profunda", "valor_forrajero", "materia_organica", "mercado"]) {
    assert.match(deId[id], /\sdisabled[\s>]/, `${id} debe ir desactivada`);
  }
  for (const id of ["menos_agua", "plazo_corto", "fija_nitrogeno", "menos_desnudo"]) {
    assert.doesNotMatch(deId[id], /\sdisabled[\s>]/, `${id} debe poder activarse`);
  }
  assert.ok(html.includes(TEXTO_SIN_DATO));
  // Sin pesos, sin puntaje, sin «best»: no hay «score», «rank» fuera de la nota, ni «best»/«recommend».
  assert.doesNotMatch(html, /\bbest\b|recommend|score|weight/i);
});
