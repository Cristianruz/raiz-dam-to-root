// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Pruebas de web/js/beneficios.js (función pura, sin DOM, con Node): el texto de «Benefits» del bloque «Why?» de cada
// tarjeta (hallazgo I10 de la revisión total). Compara ESTA opción con la rotación ACTUAL de la misma parcela:
// - agua por año (mediana, en el escenario de lluvia elegido), años que compromete, días de suelo desnudo (con su
//   origen: medido o estimado), leguminosa y los indicadores sin dato en la tabla de rotaciones;
// - si la opción pide más agua o más años que la actual, se dice igual de claro;
// - un dato ausente se dice («no data») y nunca se escribe cero en su lugar;
// - la opción ACTUAL dice que es la base de la comparación; una parcela sin alternativas (el nogal) devuelve null y la
//   página conserva el texto que ya tenía;
// - TODAS las opciones de web/data/cubo.json: sin NaN, undefined ni null, y sin las palabras vetadas (CLAUDE.md,
//   regla 10: nada de «saves», «best», «better», «recommended», «only», «first»; el agua no «se libera» ni «se ahorra»).
// Conectada al comando único (node --test tests/*.test.js, paso de construir.py).
// Uso:  node --test tests/beneficios.test.js
// Los números de este archivo son DATOS DE PRUEBA (opciones mínimas inventadas para la prueba), no cifras del proyecto.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const RAIZ = new URL("..", import.meta.url).href.replace(/\/$/, "");
const { beneficiosDeOpcion, textoRenglon, TEXTO_BASE } = await import(`${RAIZ}/web/js/beneficios.js`);

// --- Parcela mínima de prueba: un alfalfar con sus tres alternativas (la forma de cubo.parcelas[id].opciones) --------
const lam = (a, b) => ({ 0: { p10: a - 1, p50: a, p90: a + 1 }, "-20": { p10: b - 1, p50: b, p90: b + 1 } });
const opcion = (id, nombre, { l, plazo, restante = plazo, desnudo = null, origen = "estimado", leg = null, plagas = null, raiz = null }) => ({
  id,
  nombre,
  agua: { lamina_bruta: l, plazo_anios: plazo, plazo_restante: restante },
  suelo: { dias_desnudo: desnudo, dias_desnudo_origen: origen, leguminosa: leg, ruptura_plagas: plagas, raiz_profunda: raiz },
});
const ALFALFA = opcion("ACTUAL", "Current rotation: Alfalfa", {
  l: lam(28.4, 29.01), plazo: { min: 3, max: 4 }, restante: { min: 0, max: 1 }, desnudo: 0, origen: "medido", leg: true, plagas: false,
});
const CORTE = opcion("alfalfa_corte_verano", "Keep the alfalfa and skip summer irrigations", {
  l: lam(25.49, 25.92), plazo: { min: 3, max: 4 }, restante: { min: 0, max: 1 }, desnudo: 0, leg: true,
});
const CEREAL_MAIZ = opcion("avena_maiz", "Winter cereal, then forage maize", { l: lam(18.94, 19.21), plazo: { min: 1, max: 1 }, desnudo: 20, leg: false });
const DESCANSO = opcion("descanso", "Do not plant", { l: lam(0, 0), plazo: { min: 1, max: 1 }, desnudo: null, leg: false });
const OPS = [ALFALFA, CORTE, CEREAL_MAIZ, DESCANSO];

const de = (o, { ops = OPS, llave = "0", formato } = {}) => beneficiosDeOpcion({ opcion: o, opciones: ops, llave, formato });
// Cada renglón como una frase («rótulo: texto»), que es como se lee en la página.
const lineas = (o, ctx) => de(o, ctx).renglones.map(textoRenglon);
const texto = (o, ctx) => lineas(o, ctx).join(" ");

// Palabras vetadas (regla 10) y restos de un dato mal leído.
const VETADAS = /\b(sav(e|es|ed|ing|ings)|best|better|worse|worst|recommend\w*|only|first|should|free[sd]?|freeing|releas(e|es|ed|ing)|profit|income)\b/i;
const RESTOS = /NaN|undefined|null|\[object|Infinity/;

test("alfalfa contra el corte de verano: menos agua, el mismo plazo, la misma cobertura y también leguminosa", () => {
  const b = de(CORTE);
  assert.equal(b.caso, "comparacion");
  // Cada renglón trae su rótulo aparte (la página lo pone en negritas); el primero presenta la comparación, sin rótulo.
  assert.deepEqual(b.renglones.map((r) => r.rotulo), [null, "Water per year", "Water term", "Bare soil in the windy season", "Legume (adds nitrogen)", "Breaks the pest cycle and deep roots"]);
  assert.deepEqual(b.renglones[1], { rotulo: "Water per year", texto: "25.5 thousand m³/ha (median need), less than the current rotation's 28.4." });
  assert.deepEqual(lineas(CORTE), [
    "Compared with the current rotation of this field (Alfalfa):",
    "Water per year: 25.5 thousand m³/ha (median need), less than the current rotation's 28.4.",
    "Water term: 3–4 years (0–1 years left on this field), the same as the current rotation.",
    "Bare soil in the windy season: 0 days (estimated); the current rotation has 0 days (measured).",
    "Legume (adds nitrogen): yes, like the current rotation.",
    "Breaks the pest cycle and deep roots: no data in the rotation table for this option.",
  ]);
});

test("alfalfa contra cereal y maíz: menos agua, un año, más días de suelo desnudo (estimados) y sin leguminosa", () => {
  assert.deepEqual(lineas(CEREAL_MAIZ), [
    "Compared with the current rotation of this field (Alfalfa):",
    "Water per year: 18.9 thousand m³/ha (median need), less than the current rotation's 28.4.",
    // El alfalfar tiene un rodal a medio plazo (le quedan 0–1 años; resembrado serían 3–4): las dos cifras, sin «shorter».
    "Water term: 1 year; the current rotation's is 3–4 years (0–1 years left on this field).",
    "Bare soil in the windy season: 20 days (estimated); the current rotation has 0 days (measured).",
    "Legume (adds nitrogen): no; the current rotation is a legume.",
    "Breaks the pest cycle and deep roots: no data in the rotation table for this option.",
  ]);
});

test("alfalfa contra el descanso: sin riego, y el suelo desnudo sin dato se dice (nunca cero)", () => {
  const r = lineas(DESCANSO);
  assert.equal(r[1], "Water per year: no irrigation needed; the current rotation asks for 28.4 thousand m³/ha (median need).");
  assert.equal(r[2], "Water term: 1 year; the current rotation's is 3–4 years (0–1 years left on this field).");
  assert.equal(r[3], "Bare soil in the windy season: no data for this option; the current rotation has 0 days (measured).");
  assert.equal(r[4], "Legume (adds nitrogen): no; the current rotation is a legume.");
  assert.doesNotMatch(r[3], /: 0 days/, "un dato ausente no se escribe como cero");
});

test("el escenario de lluvia elegido cambia las láminas que se comparan", () => {
  assert.match(texto(CORTE, { llave: "-20" }), /Water per year: 25\.9 thousand m³\/ha \(median need\), less than the current rotation's 29\./);
  assert.match(texto(CORTE, { llave: "-20" }), /current rotation's 29\.\s/, "29.01 con un decimal es 29");
  // Una llave que el cubo no trae: sin dato, no la lámina de otro escenario.
  assert.match(texto(CORTE, { llave: "-40" }), /^Compared .*: Water per year: no data\. /);
});

test("la opción ACTUAL dice que es la base de la comparación", () => {
  const b = de(ALFALFA);
  assert.equal(b.caso, "base");
  assert.deepEqual(b.renglones, [{ rotulo: null, texto: TEXTO_BASE }]);
  assert.equal(textoRenglon(b.renglones[0]), TEXTO_BASE);
  assert.match(TEXTO_BASE, /current rotation/);
  assert.match(TEXTO_BASE, /baseline/);
  assert.doesNotMatch(TEXTO_BASE, /\d/, "la frase fija no lleva cifras");
});

test("sin alternativas (el nogal), sin opción ACTUAL o sin opción: null, y la página conserva lo que hay", () => {
  const nogal = opcion("ACTUAL", "Current rotation: Pecan orchard (does not rotate)", { l: lam(18.84, 19.35), plazo: { min: 10, max: 10 }, desnudo: 0, origen: "medido", leg: false });
  assert.equal(de(nogal, { ops: [nogal] }), null);
  assert.equal(de(CORTE, { ops: [CORTE, CEREAL_MAIZ] }), null, "sin ACTUAL no hay con qué comparar");
  assert.equal(beneficiosDeOpcion({ opcion: null, opciones: OPS, llave: "0" }), null);
  assert.equal(beneficiosDeOpcion(), null);
  assert.equal(beneficiosDeOpcion({ opcion: CORTE, opciones: null, llave: "0" }), null);
});

test("si la opción pide más agua o más años que la actual, se dice igual de claro", () => {
  const cereal = opcion("ACTUAL", "Current rotation: Winter cereal", { l: lam(7.82, 7.83), plazo: { min: 1, max: 1 }, desnudo: 26, origen: "medido", leg: false, plagas: false });
  const doble = opcion("avena_maiz", "Oats + forage maize", { l: lam(18.94, 19.21), plazo: { min: 1, max: 1 }, desnudo: 20, leg: false });
  const alfalfa = opcion("alfalfa", "Alfalfa", { l: lam(28.4, 29.01), plazo: { min: 3, max: 4 }, desnudo: 0, leg: true, plagas: true, raiz: true });
  const ops = [cereal, doble, alfalfa];
  assert.deepEqual(lineas(doble, { ops }), [
    "Compared with the current rotation of this field (Winter cereal):",
    "Water per year: 18.9 thousand m³/ha (median need), more than the current rotation's 7.8.",
    "Water term: 1 year, the same as the current rotation.",
    "Bare soil in the windy season: 20 days (estimated); the current rotation has 26 days (measured).",
    "Legume (adds nitrogen): no, like the current rotation.",
    "Breaks the pest cycle and deep roots: no data in the rotation table for this option.",
  ]);
  assert.deepEqual(lineas(alfalfa, { ops }), [
    "Compared with the current rotation of this field (Winter cereal):",
    "Water per year: 28.4 thousand m³/ha (median need), more than the current rotation's 7.8.",
    "Water term: 3–4 years, longer than the current rotation's 1 year.",
    "Bare soil in the windy season: 0 days (estimated); the current rotation has 26 days (measured).",
    "Legume (adds nitrogen): yes; the current rotation is not a legume.",
    // Un indicador con dato se dice con su valor; el de la actual, si lo trae.
    "Breaks the pest cycle: yes; the current rotation: no.",
    "Deep roots: yes.",
  ]);
  // Rotación actual en descanso (sin riego) frente a un cultivo que sí pide agua.
  const reposo = opcion("ACTUAL", "Current rotation: Do not plant / standing stubble", { l: lam(0, 0), plazo: { min: 1, max: 1 }, desnudo: null, origen: "medido", leg: false });
  const maiz = opcion("maiz_forrajero", "Forage maize", { l: lam(11.1, 11.4), plazo: { min: 1, max: 1 }, desnudo: 44, leg: false });
  const r = lineas(maiz, { ops: [reposo, maiz] });
  assert.equal(r[0], "Compared with the current rotation of this field (Do not plant / standing stubble):");
  assert.equal(r[1], "Water per year: 11.1 thousand m³/ha (median need), more than the current rotation, which needs no irrigation.");
  assert.equal(r[3], "Bare soil in the windy season: 44 days (estimated); no data for the current rotation.");
});

test("el plazo: «shorter» y «longer» solo sin un rodal a medio plazo; con él, las dos cifras sin calificar", () => {
  const conRestante = (restante) => ({ ...ALFALFA, agua: { ...ALFALFA.agua, plazo_restante: restante } });
  const plazo = (actual) => lineas(CEREAL_MAIZ, { ops: [actual, CEREAL_MAIZ] })[2];
  // Alfalfar recién sembrado (le queda el plazo completo): un año contra 3–4, sin ambigüedad.
  assert.equal(plazo(conRestante({ min: 3, max: 4 })), "Water term: 1 year, shorter than the current rotation's 3–4 years.");
  assert.equal(plazo(conRestante(null)), "Water term: 1 year, shorter than the current rotation's 3–4 years.");
  // Rodal joven, rodal por vencer y rodal vencido: resembrar compromete otra vez 3–4 años, así que no se califica.
  assert.equal(plazo(conRestante({ min: 2, max: 3 })), "Water term: 1 year; the current rotation's is 3–4 years (2–3 years left on this field).");
  assert.equal(plazo(conRestante({ min: 0, max: 1 })), "Water term: 1 year; the current rotation's is 3–4 years (0–1 years left on this field).");
  assert.equal(plazo(conRestante({ min: 0, max: 0 })), "Water term: 1 year; the current rotation's is 3–4 years (0 years left on this field).");
  assert.equal(plazo(conRestante({ min: 1, max: 1 })), "Water term: 1 year; the current rotation's is 3–4 years (1 year left on this field).");
  for (const r of [{ min: 2, max: 3 }, { min: 0, max: 1 }, { min: 0, max: 0 }]) assert.doesNotMatch(plazo(conRestante(r)), /shorter|longer/);
  // Solo el plazo restante en los datos: se dice lo que queda y no se califica.
  const soloResta = { ...ALFALFA, agua: { ...ALFALFA.agua, plazo_anios: null, plazo_restante: { min: 2, max: 3 } } };
  assert.equal(plazo(soloResta), "Water term: 1 year; the current rotation's is 2–3 years left on this field.");
});

test("datos en null: cada renglón dice «no data» y ninguno escribe cero, NaN, undefined ni null", () => {
  const vacia = { id: "X", nombre: "Option without data", agua: { lamina_bruta: {}, plazo_anios: null, plazo_restante: null }, suelo: null };
  const r = lineas(vacia, { ops: [ALFALFA, vacia] });
  assert.deepEqual(r, [
    "Compared with the current rotation of this field (Alfalfa):",
    "Water per year: no data for this option; the current rotation asks for 28.4 thousand m³/ha (median need).",
    "Water term: no data for this option; the current rotation's is 3–4 years (0–1 years left on this field).",
    "Bare soil in the windy season: no data for this option; the current rotation has 0 days (measured).",
    "Legume (adds nitrogen): no data for this option; the current rotation is a legume.",
    "Breaks the pest cycle and deep roots: no data in the rotation table for this option.",
  ]);
  // Sin dato en ninguna de las dos.
  const actualVacia = { id: "ACTUAL", nombre: "", agua: null, suelo: {} };
  const sinNada = lineas({ id: "Y" }, { ops: [actualVacia, { id: "Y" }] });
  assert.deepEqual(sinNada, [
    "Compared with the current rotation of this field:",
    "Water per year: no data.",
    "Water term: no data.",
    "Bare soil in the windy season: no data.",
    "Legume (adds nitrogen): no data for this option.",
    "Breaks the pest cycle and deep roots: no data in the rotation table for this option.",
  ]);
  // Valores que no son números (texto, NaN) cuentan como dato ausente.
  const rara = opcion("Z", "Odd", { l: { 0: { p50: "12" } }, plazo: { min: NaN, max: 2 }, desnudo: NaN, leg: "yes" });
  for (const linea of [...r, ...sinNada, ...lineas(rara, { ops: [ALFALFA, rara] })]) {
    assert.doesNotMatch(linea, RESTOS, linea);
    assert.doesNotMatch(linea, /: 0 (days|thousand|years?)/, linea);
  }
  assert.match(lineas(rara, { ops: [ALFALFA, rara] })[1], /no data for this option/);
});

test("la lámina igual, o igual con los decimales de la tarjeta, no se dice «less» ni «more»", () => {
  const igual = opcion("I", "Same", { l: lam(28.4, 29.01), plazo: { min: 3, max: 4 }, restante: { min: 0, max: 1 }, desnudo: 0, leg: true });
  const casi = opcion("C", "Almost", { l: lam(28.43, 29.0), plazo: { min: 1, max: 1 }, desnudo: 1, leg: true });
  const ops = [ALFALFA, igual, casi];
  assert.equal(lineas(igual, { ops })[1], "Water per year: 28.4 thousand m³/ha (median need), the same as the current rotation.");
  assert.equal(lineas(casi, { ops })[1], "Water per year: 28.4 thousand m³/ha (median need), about the same as the current rotation.");
  assert.match(lineas(casi, { ops })[3], /^Bare soil in the windy season: 1 day \(estimated\); the current rotation has/, "un día va en singular");
});

test("el formato lo pone quien llama (app.js pasa el de las tarjetas); por omisión, un decimal en la lámina", () => {
  const formato = { millares: (v) => `<${v}>`, dato: (v) => `[${v}]` };
  const r = lineas(CEREAL_MAIZ, { formato });
  assert.equal(r[1], "Water per year: <18.94> thousand m³/ha (median need), less than the current rotation's <28.4>.");
  assert.equal(r[2], "Water term: [1] year; the current rotation's is [3]–[4] years ([0]–[1] years left on this field).");
  assert.equal(r[3], "Bare soil in the windy season: [20] days (estimated); the current rotation has [0] days (measured).");
  // Un formato parcial se completa con el de omisión.
  assert.match(lineas(CEREAL_MAIZ, { formato: { millares: (v) => `<${v}>` } })[3], /: 20 days/);
});

test("ninguna frase lleva palabras vetadas ni promete: son diferencias descritas", () => {
  for (const o of OPS) for (const llave of ["0", "-20"]) assert.doesNotMatch(texto(o, { llave }), VETADAS);
  assert.doesNotMatch(TEXTO_BASE, VETADAS);
});

test("el módulo lleva su encabezado y su código (sin los comentarios) no trae palabras vetadas", () => {
  // Las cifras escritas a mano las busca tests/test_sin_cifras.py en todas las cadenas de web/js/*.js.
  const fuente = fs.readFileSync(fileURLToPath(`${RAIZ}/web/js/beneficios.js`), "utf-8");
  assert.ok(fuente.startsWith("// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026"), "encabezado AI-assisted");
  const codigo = fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "").replace(/\s\/\/ .*$/gm, "");
  assert.ok(codigo.includes("export function beneficiosDeOpcion"), "se leyó el código del módulo");
  assert.doesNotMatch(codigo, VETADAS);
});

test("TODAS las opciones de web/data/cubo.json: texto sin NaN, undefined ni null y sin palabras vetadas", () => {
  const cubo = JSON.parse(fs.readFileSync(fileURLToPath(`${RAIZ}/web/data/cubo.json`), "utf-8"));
  const llaves = (cubo.lluvia_pct ?? [0]).map((r) => String(Number(r)));
  let opciones = 0;
  let comparadas = 0;
  let base = 0;
  let sinAlternativas = 0;
  for (const [pid, parcela] of Object.entries(cubo.parcelas)) {
    const ops = parcela.opciones ?? [];
    const alternativas = ops.filter((o) => o.id !== "ACTUAL");
    for (const o of ops) {
      opciones += 1;
      for (const llave of llaves) {
        const b = beneficiosDeOpcion({ opcion: o, opciones: ops, llave });
        const donde = `${pid}/${o.id} (lluvia ${llave})`;
        if (!alternativas.length) {
          assert.equal(b, null, `${donde}: sin alternativas se conserva el texto de explicaciones.json`);
          sinAlternativas += 1;
          continue;
        }
        assert.ok(b && Array.isArray(b.renglones) && b.renglones.length, `${donde}: sin texto`);
        if (o.id === "ACTUAL") {
          assert.deepEqual(b.renglones.map(textoRenglon), [TEXTO_BASE], donde);
          base += 1;
          continue;
        }
        comparadas += 1;
        assert.equal(b.caso, "comparacion", donde);
        assert.ok(b.renglones.length >= 5, `${donde}: faltan renglones (${b.renglones.length})`);
        const frases = b.renglones.map(textoRenglon);
        assert.equal(b.renglones[0].rotulo, null, `${donde}: el primer renglón presenta la comparación`);
        assert.ok(b.renglones.slice(1).every((r) => typeof r.rotulo === "string" && r.rotulo && typeof r.texto === "string" && r.texto), `${donde}: renglón sin rótulo o sin texto`);
        for (const linea of frases) {
          assert.equal(typeof linea, "string", donde);
          assert.ok(linea.trim().length > 0, `${donde}: renglón vacío`);
          assert.doesNotMatch(linea, RESTOS, `${donde}: ${linea}`);
          assert.doesNotMatch(linea, VETADAS, `${donde}: ${linea}`);
          assert.doesNotMatch(linea, /\{\{|\}\}|\$\{/, `${donde}: marcador sin rellenar: ${linea}`);
        }
        // El agua de la opción y de la actual, tal como las trae el cubo en ese escenario de lluvia.
        const agua = frases.find((l) => l.startsWith("Water per year:"));
        const lo = o.agua?.lamina_bruta?.[llave]?.p50;
        const la = ops.find((x) => x.id === "ACTUAL")?.agua?.lamina_bruta?.[llave]?.p50;
        if (Number.isFinite(lo) && Number.isFinite(la) && lo > 0 && la > 0 && Math.abs(lo - la) >= 0.1) {
          assert.ok(agua.includes(lo < la ? "less than the current rotation's" : "more than the current rotation's"), `${donde}: ${agua}`);
        }
        if (lo === 0) assert.ok(agua.includes("no irrigation needed"), `${donde}: ${agua}`);
        // Un suelo desnudo sin dato nunca se escribe como cero.
        if (o.suelo?.dias_desnudo == null) assert.match(frases.find((l) => l.startsWith("Bare soil")), /no data/, donde);
      }
    }
  }
  assert.ok(opciones > 0 && comparadas > 0 && base > 0, `se recorrió el cubo: ${opciones} opciones, ${comparadas} comparadas, ${base} de base`);
  assert.equal(comparadas + base + sinAlternativas, opciones * llaves.length);
});

test("suelo desnudo: con el mismo origen se compara; con un dato medido y otro estimado se dan los dos sin ordenarlos", async () => {
  const { beneficiosDeOpcion, textoRenglon } = await import("../web/js/beneficios.js");
  const opcion = (id, dias, origen) => ({
    id, rotacion: id, nombre: id, agua: { lamina_bruta: { 0: { p50: 10 } }, plazo_anios: { min: 1, max: 1 } },
    suelo: { dias_desnudo: dias, dias_desnudo_origen: origen, leguminosa: false, ruptura_plagas: null, raiz_profunda: null },
  });
  const renglonDesnudo = (o, a) => beneficiosDeOpcion({ opcion: o, opciones: [a, o], llave: "0" }).renglones.map(textoRenglon)
    .find((x) => x.startsWith("Bare soil"));
  const actual = { ...opcion("ACTUAL", 26, "medido"), id: "ACTUAL" };
  assert.match(renglonDesnudo(opcion("b", 20, "medido"), actual), /20 days \(measured\), fewer than the current rotation's 26 days \(measured\)\.$/);
  const mixto = renglonDesnudo(opcion("c", 20, "estimado"), actual);
  assert.match(mixto, /20 days \(estimated\); the current rotation has 26 days \(measured\)\.$/);
  assert.doesNotMatch(mixto, /fewer|more than|the same as/);
});

