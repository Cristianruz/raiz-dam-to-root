// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// tests/i18n.test.js — El tablero abre en inglés aunque el navegador esté en español; el selector, la liga
// (?lang=es) o la elección guardada lo cambian (docs/decisiones/2026-11-15_ingles_primero.md).
import { test } from "node:test";
import assert from "node:assert/strict";

// Cada prueba importa una copia nueva del módulo: i18n.js recuerda el idioma elegido al primer uso.
let copia = 0;
async function cargar({ languages = [], search = "", guardado = null } = {}) {
  const almacen = new Map(guardado ? [["root.idioma", guardado]] : []);
  for (const [nombre, valor] of [
    ["navigator", { languages, language: languages[0] }],
    ["location", { search }],
    ["localStorage", { getItem: (k) => almacen.get(k) ?? null, setItem: (k, v) => almacen.set(k, v) }],
  ]) {
    Object.defineProperty(globalThis, nombre, { value: valor, configurable: true, writable: true });
  }
  copia += 1;
  return import(`../web/js/i18n.js?copia=${copia}`);
}

test("abre en inglés aunque el navegador pida español", async () => {
  const m = await cargar({ languages: ["es-MX", "es"] });
  assert.equal(m.idioma(), "en");
});

test("el inglés va primero en el selector y el español está disponible", async () => {
  const m = await cargar();
  assert.equal(m.IDIOMAS[0], "en");
  assert.ok(m.IDIOMAS.includes("es"));
});

test("el selector cambia al español y lo recuerda", async () => {
  const m = await cargar({ languages: ["en-US"] });
  assert.equal(m.fijarIdioma("es"), "es");
  assert.equal(m.idioma(), "es");
  assert.equal(globalThis.localStorage.getItem("root.idioma"), "es");
});

test("la liga ?lang=es y la elección guardada siguen valiendo", async () => {
  assert.equal((await cargar({ search: "?lang=es" })).idioma(), "es");
  assert.equal((await cargar({ guardado: "es" })).idioma(), "es");
});
