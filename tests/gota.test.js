// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// «Follow the drop» describe, no recomienda. Decisión de Cristian (15-nov-2026): la frase fija del kit X3.2 §4
// decía que el goteo «se recomienda» según la ET del distrito; la página apoya y no sustituye el juicio del
// agricultor ni del técnico (CLAUDE.md, regla 10), así que la frase dice cuándo la página marca el escenario.
// Se lee el archivo como texto: el módulo necesita el navegador (d3 y el DOM) y aquí solo importan sus textos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fuente = readFileSync(path.join(RAIZ, "web/js/gota.js"), "utf-8");

test("La gota nunca dice «recommended» ni «best»: describe el escenario y avisa", () => {
  assert.ok(!/\b(recommended|recommend|best)\b/i.test(fuente), "web/js/gota.js no debe recomendar");
});

test("la frase fija dice cuándo la página marca el escenario de goteo", () => {
  assert.ok(fuente.includes("The drip scenario is shown without a warning when district ET stays at or below its historical level"));
  assert.ok(fuente.includes("the page flags the scenario"));
  // Se conserva lo demás de la frase del kit: la cita y que se cuenta consumo, no solo extracción.
  assert.ok(fuente.includes("Grafton et al., Science 2018"));
  assert.ok(fuente.includes("We count consumption (ET), not just withdrawals."));
});

test("el aviso sin tope marca el escenario sin recomendar", () => {
  assert.ok(fuente.includes("Flagged: district consumption (ET) would exceed its historical level."));
});
