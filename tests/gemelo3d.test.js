// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// tests/gemelo3d.test.js — Prueba de Node de web/js/gemelo3d.js (vista 3D del gemelo): cálculo de las columnas y
// leyenda, con la exageración de cada zona (gemelo.json → terreno.zonas.<id>.exageracion; la general de respaldo).
// La parte con navegador (relieve, cámara, clic, columna que se ve en cada píxel) está en tests/e2e/web_smoke.mjs.
// No supone un juego de datos: lo esperado se calcula de cubo.json y parcelas.geojson con reglas.js.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";
import * as reglas from "../web/reglas.js";
import { calcularColumnas, crearGemelo3D } from "../web/js/gemelo3d.js";

const WEB = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "web");
const leer = (n) => JSON.parse(fs.readFileSync(path.join(WEB, "data", n), "utf-8"));
const cubo = leer("cubo.json");
const parcelas = leer("parcelas.geojson");
const gemelo = fs.existsSync(path.join(WEB, "data/gemelo.json")) ? leer("gemelo.json") : null;
const K = 60; // escala de prueba (en la web sale de gemelo.json)
const zonas = [...new Set(parcelas.features.map((f) => f.properties.zona))];
const actualDe = (id) => (cubo.parcelas[id]?.opciones ?? []).find((o) => o.id === "ACTUAL");

for (const r of cubo.lluvia_pct) {
  for (const D of [0, 1, 3.5, 9.5, 12]) {
    test(`columnas con D = ${D} y lluvia ${r}: alturas y clases de cada parcela`, () => {
      const res = calcularColumnas({ features: parcelas.features, cubo, D, r, zonaId: null, metrosPorMillar: K, reglas });
      const cols = new Map(res.columnas.features.map((f) => [f.properties.id, f.properties]));
      const planas = new Map(res.planas.features.map((f) => [f.properties.id, f.properties.clase]));
      assert.equal(cols.size + planas.size, parcelas.features.length, "cada parcela está en una sola de las dos colecciones");
      for (const f of parcelas.features) {
        const p = f.properties;
        const actual = actualDe(p.id);
        if (p.abstencion || !actual) { assert.equal(planas.get(p.id), "sin_clasificar", p.id); continue; }
        const L = actual.agua.lamina_bruta[reglas.llaveLluvia(r)].p50;
        if (!(L > 0)) { assert.equal(planas.get(p.id), "sin_riego", p.id); continue; }
        const c = cols.get(p.id);
        assert.ok(c, `${p.id} debe tener columna`);
        assert.equal(c.cubre_m, Math.min(D, L) * K);
        assert.equal(c.pide_m, L * K);
        assert.equal(c.falta_m, c.pide_m - c.cubre_m);
        assert.ok(c.cubre_m >= 0 && c.cubre_m <= c.pide_m);
        assert.equal(c.cobertura, reglas.cobertura(D, L));
      }
      assert.equal(res.cuenta.columna, cols.size);
      assert.equal(res.cuenta.sin_riego + res.cuenta.sin_clasificar, planas.size);
    });
  }
}

test("solo se dibuja la zona pedida", () => {
  for (const z of zonas) {
    const res = calcularColumnas({ features: parcelas.features, cubo, D: 3.5, r: cubo.lluvia_pct[0], zonaId: z, metrosPorMillar: K, reglas });
    const total = res.cuenta.columna + res.cuenta.sin_riego + res.cuenta.sin_clasificar;
    assert.equal(total, parcelas.features.filter((f) => f.properties.zona === z).length);
  }
});

test("las parcelas planas no cambian con la dotación (no se reenvían al mover el deslizador)", () => {
  const base = { features: parcelas.features, cubo, r: cubo.lluvia_pct[0], zonaId: zonas[0], metrosPorMillar: K, reglas };
  assert.equal(calcularColumnas({ ...base, D: 1 }).firmaPlanas, calcularColumnas({ ...base, D: 9.5 }).firmaPlanas);
});

test("sin escala, sin cubo o sin parcelas no se inventa nada", () => {
  const base = { features: parcelas.features, cubo, D: 3.5, r: cubo.lluvia_pct[0], zonaId: null, reglas };
  assert.equal(calcularColumnas({ ...base, metrosPorMillar: null }).columnas.features.length, 0);
  const sinCubo = calcularColumnas({ ...base, cubo: null, metrosPorMillar: K });
  assert.equal(sinCubo.columnas.features.length, 0);
  assert.equal(sinCubo.cuenta.sin_clasificar, parcelas.features.length);
  assert.equal(calcularColumnas({ ...base, features: null, metrosPorMillar: K }).planas.features.length, 0);
});

test("el cálculo no modifica las parcelas ni el cubo", () => {
  const antes = JSON.stringify(parcelas.features[0]) + JSON.stringify(cubo.parcelas[parcelas.features[0].properties.id]);
  calcularColumnas({ features: parcelas.features, cubo, D: 5, r: cubo.lluvia_pct[0], zonaId: null, metrosPorMillar: K, reglas });
  assert.equal(JSON.stringify(parcelas.features[0]) + JSON.stringify(cubo.parcelas[parcelas.features[0].properties.id]), antes);
});

test("sin mapa (o sin gemelo.json) la vista no está disponible y la leyenda no falla", () => {
  const sinNada = crearGemelo3D({ mapa: null, gemelo: null, reglas });
  assert.equal(sinNada.disponible(zonas[0]), false);
  assert.equal(sinNada.activar(zonas[0]), false);
  assert.equal(sinNada.activo(), false);
  assert.match(sinNada.leyendaHTML(), /Source: not available/);
  assert.doesNotMatch(sinNada.leyendaHTML().replace(/<[^>]+>/g, " "), /\d/, "sin gemelo.json la leyenda no trae ninguna cifra");
  sinNada.actualizar({ D: 3 });
  sinNada.desactivar();
  sinNada.destruir();
  assert.throws(() => crearGemelo3D({ mapa: null, gemelo: null, reglas: {} }), TypeError);
});

test("leyenda: frases fijas y cifras solo de gemelo.json", { skip: gemelo ? false : "web/data/gemelo.json aún no existe" }, () => {
  const html = crearGemelo3D({ mapa: null, gemelo, reglas }).leyendaHTML();
  const texto = html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&");
  for (const frase of ["Column height = water the current rotation asks for per hectare", "Blue: covered by the chosen allocation · Red: not covered", "Flat grey: not classified"]) assert.ok(texto.includes(frase), frase);
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });
  assert.ok(texto.includes(gemelo.terreno.rotulo) && texto.includes(gemelo.terreno.fuente));
  assert.ok(texto.includes(`×${fmt.format(gemelo.terreno.exageracion)}`));
  assert.ok(texto.includes(`${fmt.format(gemelo.columnas.metros_por_millar)} m of height`));
  let resto = texto;
  for (const t of [gemelo.terreno.rotulo, gemelo.terreno.fuente, gemelo.columnas.nota, gemelo.columnas.etiqueta, `×${fmt.format(gemelo.terreno.exageracion)}`, `${fmt.format(gemelo.columnas.metros_por_millar)} m of height`]) if (t) resto = resto.split(t).join(" ");
  assert.doesNotMatch(resto, /\d/, "todo dígito de la leyenda viene de gemelo.json");
  assert.doesNotMatch(texto, /\b(first|only)\b/i);
});

test("leyenda por zona: cada zona con SU exageración; sin la suya, la general", { skip: gemelo?.terreno ? false : "gemelo.json sin terreno" }, () => {
  const vista = crearGemelo3D({ mapa: null, gemelo, reglas });
  const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 });
  for (const [id, z] of Object.entries(gemelo.terreno.zonas)) {
    const esperada = z.exageracion ?? gemelo.terreno.exageracion;
    const texto = vista.leyendaHTML(id).replace(/<[^>]+>/g, " ");
    assert.ok(texto.includes(`(×${fmt.format(esperada)})`), `${id}: ×${esperada}`);
  }
  // Una zona sin su propia exageración usa la general (respaldo de gemelo3d.js).
  const sinPropia = structuredClone(gemelo);
  const [primera] = Object.keys(sinPropia.terreno.zonas);
  delete sinPropia.terreno.zonas[primera].exageracion;
  const texto = crearGemelo3D({ mapa: null, gemelo: sinPropia, reglas }).leyendaHTML(primera).replace(/<[^>]+>/g, " ");
  assert.ok(texto.includes(`(×${fmt.format(gemelo.terreno.exageracion)})`));
});
