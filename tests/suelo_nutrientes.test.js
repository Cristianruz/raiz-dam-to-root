// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Tipo de suelo y notas de nutrientes de la ficha (web/js/suelo.js; suelo.json → tipo_suelo y nutrientes, que
// escribe motor/suelo_web.py con las entregas B7 y B8). Las MISMAS funciones que usa la página.
// - L0175 (nogal): las notas de los nutrientes menos disponibles (hierro, zinc, cobre, manganeso y boro entre
//   ellos), cada una con su estado en texto y símbolo y con «Regional soil map (… m), not a lab test — needs a
//   local check» (la resolución sale de suelo.json, no se escribe aquí);
// - P0757: su tipo de suelo en una línea, con la descripción del catálogo y los suelos del municipio (INEGI);
// - lo que falta se dice: parcela sin tipo de suelo, sin pH, bloque pedido y no entregado, suelo.json viejo.
// Datos: web/data/suelo.json (lo real de hoy). Los valores esperados se leen de ahí.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  ESTADOS_NUTRIENTE,
  TEXTO_SIN_TIPO,
  escalaDeNota,
  htmlNotasDeNutrientes,
  htmlPerfilDeSuelo,
  htmlTipoDeSuelo,
  modeloNotasDeNutrientes,
  modeloTipoDeSuelo,
} from "../web/js/suelo.js";

const URL_REAL = new URL("../web/data/suelo.json", import.meta.url);
const REAL = existsSync(URL_REAL) ? JSON.parse(readFileSync(URL_REAL, "utf8")) : null;
const CON_BLOQUES = REAL?.tipo_suelo && REAL?.nutrientes ? REAL : null;
const sinBloques = !CON_BLOQUES && "web/data/suelo.json no trae tipo_suelo y nutrientes";
const FUENTE_JS = readFileSync(new URL("../web/js/suelo.js", import.meta.url), "utf8");

/** Texto que se ve o se anuncia de un HTML: sin etiquetas y con los espacios juntos. */
function textoVisible(html) {
  return String(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const notasDe = (suelo, id) => suelo.nutrientes.conjuntos[suelo.nutrientes.parcelas[id]].notas;

test("L0175: notas de hierro, zinc, cobre, manganeso y boro con su estado en texto y símbolo", { skip: sinBloques }, () => {
  const m = modeloNotasDeNutrientes({ suelo: CON_BLOQUES, id: "L0175" });
  assert.equal(m.situacion, "ok");
  const menos = m.notas.find((n) => n.caso === "menos_disponibles");
  const simbolos = menos.elementos.map((e) => e.simbolo);
  for (const s of ["Fe", "Zn", "Cu", "Mn", "B"]) assert.ok(simbolos.includes(s), s);
  assert.equal(menos.etiqueta, ESTADOS_NUTRIENTE.less_available.etiqueta);
  assert.equal(menos.icono, ESTADOS_NUTRIENTE.less_available.icono);
  // El texto es el de suelo.json, tal cual.
  assert.deepEqual(m.notas.map((n) => n.texto), notasDe(CON_BLOQUES, "L0175").map((n) => n.texto_en));
  const t = textoVisible(htmlNotasDeNutrientes({ suelo: CON_BLOQUES, id: "L0175" }));
  assert.ok(t.startsWith("Nutrient notes"), t);
  for (const nombre of ["iron", "zinc", "copper", "manganese", "boron"]) assert.ok(t.includes(nombre), nombre);
  for (const n of m.notas) assert.ok(t.includes(n.etiqueta) && t.includes(n.texto), n.caso);
  assert.ok(t.includes(CON_BLOQUES.nutrientes.aviso_en));
});

test("cada nota lleva la escala del mapa con la resolución de suelo.json", { skip: sinBloques }, () => {
  const res = CON_BLOQUES.nutrientes.resolucion_m.valor;
  const escala = escalaDeNota(CON_BLOQUES.nutrientes);
  assert.equal(escala, `Regional soil map (${res} m), not a lab test — needs a local check`);
  const html = htmlNotasDeNutrientes({ suelo: CON_BLOQUES, id: "L0175" });
  const veces = html.split(escala).length - 1;
  assert.equal(veces, notasDe(CON_BLOQUES, "L0175").length, "una vez por nota");
  // Sin resolución en suelo.json, la escala se dice sin cifra (nunca se inventa una).
  assert.equal(escalaDeNota({ ...CON_BLOQUES.nutrientes, resolucion_m: null }), "Regional soil map, not a lab test — needs a local check");
});

test("los estados se distinguen por texto y símbolo, no solo por color", () => {
  const vistos = new Set();
  for (const e of Object.values(ESTADOS_NUTRIENTE)) {
    assert.ok(e.etiqueta && e.icono);
    assert.ok(!vistos.has(e.icono), `símbolo repetido: ${e.icono}`);
    vistos.add(e.icono);
  }
  for (const k of ["less_available", "near_limit", "possible_toxicity", "within_range"]) assert.ok(ESTADOS_NUTRIENTE[k], k);
});

test("P0757: su tipo de suelo en una línea, con la descripción del catálogo y los suelos del municipio", { skip: sinBloques }, () => {
  const tipo = CON_BLOQUES.tipo_suelo;
  const p = tipo.parcelas.P0757;
  const g = tipo.grupos[p.gran_grupo];
  const m = modeloTipoDeSuelo({ suelo: CON_BLOQUES, id: "P0757" });
  assert.equal(m.situacion, "ok");
  assert.equal(m.granGrupo, p.gran_grupo);
  assert.equal(m.orden, g.orden);
  assert.equal(m.descripcion, g.descripcion_en);
  assert.equal(m.texto, g.texto_en);
  assert.deepEqual(m.elementos.map((e) => e.significado), g.elementos.map((e) => tipo.elementos[e].significado_en));
  assert.equal(m.municipio.texto, tipo.zonas[p.zona].texto_en);
  const html = htmlTipoDeSuelo({ suelo: CON_BLOQUES, id: "P0757" });
  const t = textoVisible(html);
  assert.ok(t.startsWith(`Soil type: ${p.gran_grupo} (${g.orden})`), t);
  for (const x of [g.texto_en, tipo.explica_en, tipo.zonas[p.zona].texto_en, tipo.no_coinciden_en]) assert.ok(t.includes(x), x);
  // La descripción del orden va en la línea (con su primera letra en minúscula).
  assert.ok(t.includes(g.descripcion_en.toLowerCase()), g.descripcion_en);
  // Y lo que dice cada parte del nombre, también en minúscula dentro de la frase.
  const linea = textoVisible(html.slice(0, html.indexOf("</p>")));
  for (const e of g.elementos) {
    const s = tipo.elementos[e].significado_en;
    assert.ok(linea.includes(s[0].toLowerCase() + s.slice(1)), `${s} en «${linea}»`);
  }
});

test("L0175 (Lázaro Cárdenas): su tipo de suelo sin la lista del municipio de Delicias", { skip: sinBloques }, () => {
  const p = CON_BLOQUES.tipo_suelo.parcelas.L0175;
  const m = modeloTipoDeSuelo({ suelo: CON_BLOQUES, id: "L0175" });
  assert.equal(m.situacion, "ok");
  assert.equal(m.municipio, null);
  const t = textoVisible(htmlTipoDeSuelo({ suelo: CON_BLOQUES, id: "L0175" }));
  assert.ok(t.startsWith(`Soil type: ${p.gran_grupo}`) && !t.includes("INEGI"), t);
});

test("la ficha (htmlPerfilDeSuelo) trae el tipo de suelo y las notas dentro del perfil", { skip: sinBloques }, () => {
  const t = textoVisible(htmlPerfilDeSuelo({ suelo: CON_BLOQUES, id: "L0175" }));
  assert.ok(t.includes("Soil type:") && t.includes("Nutrient notes"), t.slice(0, 300));
  assert.ok(t.indexOf("Soil type:") > t.indexOf("Texture"), "después del perfil (textura, pH…)");
});

test("lo que falta se dice: sin tipo de suelo, sin pH, bloque pedido y suelo.json viejo", { skip: sinBloques }, () => {
  const s = structuredClone(CON_BLOQUES);
  delete s.tipo_suelo.parcelas.P0757;
  assert.equal(modeloTipoDeSuelo({ suelo: s, id: "P0757" }).situacion, "sin_parcela");
  assert.ok(textoVisible(htmlTipoDeSuelo({ suelo: s, id: "P0757" })).includes(TEXTO_SIN_TIPO));
  // Parcela sin pH (P0316 en los reales): el texto «sin dato» de suelo.json, ninguna nota.
  const sinPh = Object.entries(s.nutrientes.parcelas).find(([, llave]) => s.nutrientes.conjuntos[llave].sin_dato_en)?.[0];
  if (sinPh) {
    const m = modeloNotasDeNutrientes({ suelo: s, id: sinPh });
    assert.equal(m.situacion, "sin_dato");
    const t = textoVisible(htmlNotasDeNutrientes({ suelo: s, id: sinPh }));
    assert.ok(t.toLowerCase().includes(s.nutrientes.conjuntos[s.nutrientes.parcelas[sinPh]].sin_dato_en.toLowerCase()), t);
    // Aunque el perfil no tenga dato, el tipo de suelo de la parcela se muestra si existe.
    const ficha = textoVisible(htmlPerfilDeSuelo({ suelo: s, id: sinPh }));
    if (s.tipo_suelo.parcelas[sinPh]) assert.ok(ficha.includes("Soil type:"), ficha);
  }
  // Bloques pedidos y no entregados (null con su motivo).
  const pedido = { ...s, tipo_suelo: null, tipo_suelo_motivo: "Requested from the data team — not delivered yet", nutrientes: null, nutrientes_motivo: "Requested from the data team — not delivered yet" };
  assert.ok(textoVisible(htmlTipoDeSuelo({ suelo: pedido, id: "P0757" })).endsWith("Soil type: requested from the data team — not delivered yet"));
  assert.ok(textoVisible(htmlNotasDeNutrientes({ suelo: pedido, id: "P0757" })).endsWith("Nutrient notes: requested from the data team — not delivered yet"));
  // suelo.json de antes de esta pieza (sin las llaves): la ficha no dice nada de esto.
  const viejo = { ...s };
  delete viejo.tipo_suelo;
  delete viejo.nutrientes;
  assert.equal(htmlTipoDeSuelo({ suelo: viejo, id: "P0757" }), "");
  assert.equal(htmlNotasDeNutrientes({ suelo: viejo, id: "P0757" }), "");
  assert.equal(htmlTipoDeSuelo({ suelo: null, id: "P0757" }), "");
});

test("una nota con un estado desconocido no se pierde ni inventa estado", { skip: sinBloques }, () => {
  const s = structuredClone(CON_BLOQUES);
  const llave = s.nutrientes.parcelas.L0175;
  s.nutrientes.conjuntos[llave].notas[0].estado = "otro";
  const m = modeloNotasDeNutrientes({ suelo: s, id: "L0175" });
  assert.equal(m.notas[0].etiqueta, null);
  assert.ok(textoVisible(htmlNotasDeNutrientes({ suelo: s, id: "L0175" })).includes(m.notas[0].texto));
});

test("el HTML de estas piezas escapa lo que viene de los datos", { skip: sinBloques }, () => {
  const s = structuredClone(CON_BLOQUES);
  s.tipo_suelo.grupos[s.tipo_suelo.parcelas.P0757.gran_grupo].texto_en = "<script>x</script>";
  s.nutrientes.conjuntos[s.nutrientes.parcelas.P0757].notas[0].texto_en = "<img src=x>";
  const html = htmlTipoDeSuelo({ suelo: s, id: "P0757" }) + htmlNotasDeNutrientes({ suelo: s, id: "P0757" });
  assert.ok(!html.includes("<script>") && !html.includes("<img") && html.includes("&lt;script&gt;"));
});

test("textos fijos de estas piezas sin cifras", () => {
  const fijos = [TEXTO_SIN_TIPO, ...Object.values(ESTADOS_NUTRIENTE).flatMap((e) => [e.etiqueta, e.icono]),
    escalaDeNota({ resolucion_m: null })];
  for (const t of fijos) assert.ok(!/\d/.test(t), t);
  assert.equal(TEXTO_SIN_TIPO, "No soil type in the map for this field");
  assert.ok(FUENTE_JS.includes("does not replace the judgment of the farmer or the technician"));
});
