// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// tests/tiempo.test.js — Prueba de Node de las funciones sin DOM de web/js/tiempo.js (línea de tiempo del gemelo):
// rangoDeAnios, estadoDe y contarEstados, las mismas que usa la página para contar los seis estados de cada año.
// La parte con navegador (deslizador, Play/Pause, movimiento reducido, nota de 2025, mapa) está en
// tests/e2e/web_smoke.mjs. No supone un juego de datos: lo esperado se calcula de web/data/parcelas.geojson.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ESTADOS, estadoDe, contarEstados, rangoDeAnios } from "../web/js/tiempo.js";

const DATOS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "web", "data");
const leer = (n) => JSON.parse(fs.readFileSync(path.join(DATOS, n), "utf-8"));
const parcelas = leer("parcelas.geojson");
const gemelo = fs.existsSync(path.join(DATOS, "gemelo.json")) ? leer("gemelo.json") : null;
const CLAVES = ESTADOS.map((e) => e.clave);

test("los seis estados, en el orden de la ficha y con las letras de la capa de memoria", () => {
  assert.deepEqual(CLAVES, ["perenne", "verano", "invierno", "doble", "descanso", "sin_dato"]);
  assert.deepEqual(ESTADOS.map((e) => e.letra), ["P", "S", "W", "D", "R", "?"]);
});

test("rangoDeAnios: los extremos de gemelo.tiempo.anios; null si falta", () => {
  assert.equal(rangoDeAnios(null), null);
  assert.equal(rangoDeAnios({ tiempo: {} }), null);
  assert.deepEqual(rangoDeAnios({ tiempo: { anios: [2020, 2018, 2019] } }), [2018, 2020]);
  if (gemelo?.tiempo?.anios) assert.deepEqual(rangoDeAnios(gemelo), [Math.min(...gemelo.tiempo.anios), Math.max(...gemelo.tiempo.anios)]);
});

test("estadoDe: el de la memoria de ese año; sin_dato si falta el año, la memoria o el estado no es de los seis", () => {
  const f = { properties: { memoria: [{ anio: 2019, estado: "verano" }, { anio: 2020, estado: "raro" }] } };
  assert.equal(estadoDe(f, 2019), "verano");
  assert.equal(estadoDe(f.properties, 2019), "verano", "acepta las properties");
  assert.equal(estadoDe(f, 2020), "sin_dato");
  assert.equal(estadoDe(f, 2021), "sin_dato");
  assert.equal(estadoDe({ properties: {} }, 2019), "sin_dato");
  // MapLibre entrega la memoria como texto JSON en queryRenderedFeatures.
  assert.equal(estadoDe({ properties: { memoria: JSON.stringify(f.properties.memoria) } }, 2019), "verano");
});

test("contarEstados con las parcelas reales: cada parcela en un solo estado, igual a contar a mano", { skip: gemelo?.tiempo?.anios ? false : "sin gemelo.tiempo" }, () => {
  const [a0, a1] = rangoDeAnios(gemelo);
  for (let a = a0; a <= a1; a += 1) {
    const c = contarEstados(parcelas.features, a);
    assert.deepEqual(Object.keys(c).sort(), [...CLAVES].sort());
    assert.equal(Object.values(c).reduce((x, y) => x + y, 0), parcelas.features.length, `${a}: suma = parcelas`);
    const aMano = Object.fromEntries(CLAVES.map((k) => [k, 0]));
    for (const f of parcelas.features) {
      const e = (f.properties.memoria ?? []).find((m) => m.anio === a)?.estado;
      aMano[CLAVES.includes(e) ? e : "sin_dato"] += 1;
    }
    assert.deepEqual(c, aMano, String(a));
  }
});
