// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Pruebas de los textos del tablero (web/js/textos_tablero.js) con Node, sin DOM:
// - los cuatro idiomas (inglés, español, portugués y francés) traen las mismas claves y ningún texto vacío;
// - cada clave lleva los mismos marcadores {nombre} en los cuatro;
// - ningún texto lleva dígitos (regla 3: las cifras entran por marcadores, con formato);
// - ninguna palabra vetada por la regla 10 en su idioma (no se ordena, no se nombra una opción mejor y no se
//   promete ahorro);
// - el aviso de juicio dice lo acordado en inglés y en español, y existe en portugués y en francés;
// - toda clave que usan web/index.html (data-i18n, data-i18n-attr), js/dashboard.js y js/interfaz.js existe.
// Conectada al comando único (node --test tests/*.test.js, paso de construir.py).
// Uso:  node --test tests/textos_tablero.test.js
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { IDIOMAS, claves, fijarIdioma, t, tiene } from "../web/js/i18n.js";
import { ORDEN, TEXTOS_TABLERO } from "../web/js/textos_tablero.js";

const WEB = fileURLToPath(new URL("../web/", import.meta.url));
const leer = (ruta) => fs.readFileSync(WEB + ruta, "utf-8");
const marcadores = (texto) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

// Palabras vetadas por idioma (CLAUDE.md, regla 10). Se buscan como palabra completa, con letras acentuadas.
const palabra = (alternativas) => new RegExp(`(?<!\\p{L})(${alternativas})(?!\\p{L})`, "iu");
const VETADAS = {
  en: palabra("first|only|best|better|recommend\\p{L}*|sav(?:e|es|ed|ing|ings)"),
  es: palabra("mejor(?:es)?|recomend\\p{L}*|ahorr\\p{L}*|predicci\\p{L}*"),
  pt: palabra("melhor(?:es)?|recomend\\p{L}*|poup\\p{L}*|econom\\p{L}*"),
  fr: palabra("meilleur\\p{L}*|recommand\\p{L}*|économis\\p{L}*|economis\\p{L}*"),
};

test("los cuatro idiomas del proyecto, en el orden del selector", () => {
  assert.deepEqual(ORDEN, IDIOMAS);
  assert.deepEqual(Object.keys(TEXTOS_TABLERO), IDIOMAS);
});

test("las mismas claves en los cuatro idiomas, todas con el prefijo «tablero.» y con texto", () => {
  const base = Object.keys(TEXTOS_TABLERO.en).sort();
  assert.ok(base.length > 0);
  for (const codigo of IDIOMAS) {
    assert.deepEqual(Object.keys(TEXTOS_TABLERO[codigo]).sort(), base, `claves distintas en «${codigo}»`);
    for (const [clave, texto] of Object.entries(TEXTOS_TABLERO[codigo])) {
      assert.ok(clave.startsWith("tablero."), `${clave}: sin el prefijo`);
      assert.equal(typeof texto, "string", `${codigo} ${clave}: no es texto`);
      assert.ok(texto.trim().length > 0, `${codigo} ${clave}: vacío`);
    }
  }
});

test("los mismos marcadores {nombre} en los cuatro idiomas", () => {
  for (const [clave, texto] of Object.entries(TEXTOS_TABLERO.en)) {
    for (const codigo of IDIOMAS) {
      assert.deepEqual(marcadores(TEXTOS_TABLERO[codigo][clave]), marcadores(texto), `${codigo} ${clave}: marcadores distintos`);
    }
  }
});

test("ningún texto lleva dígitos: las cifras entran por marcadores", () => {
  for (const codigo of IDIOMAS) {
    for (const [clave, texto] of Object.entries(TEXTOS_TABLERO[codigo])) {
      assert.ok(!/\p{Nd}/u.test(texto), `${codigo} ${clave}: lleva un dígito: ${texto}`);
    }
  }
});

test("ninguna palabra vetada por la regla 10, en cada idioma", () => {
  for (const codigo of IDIOMAS) {
    for (const [clave, texto] of Object.entries(TEXTOS_TABLERO[codigo])) {
      const hallada = VETADAS[codigo].exec(texto);
      assert.equal(hallada, null, `${codigo} ${clave}: «${hallada?.[0]}» en: ${texto}`);
    }
  }
});

test("el detector de palabras vetadas reconoce las de cada idioma", () => {
  assert.ok(VETADAS.en.test("the best option") && VETADAS.en.test("We recommend it") && VETADAS.en.test("saving water"));
  assert.ok(VETADAS.es.test("la mejor opción") && VETADAS.es.test("Recomendaciones") && VETADAS.es.test("ahorro de agua"));
  assert.ok(VETADAS.pt.test("a melhor opção") && VETADAS.pt.test("recomendação") && VETADAS.pt.test("economia de água"));
  assert.ok(VETADAS.fr.test("la meilleure option") && VETADAS.fr.test("recommandé") && VETADAS.fr.test("économiser l'eau"));
  assert.ok(!VETADAS.en.test("Before you plant") && !VETADAS.es.test("Antes de sembrar"));
});

test("el aviso de juicio, en los cuatro idiomas", () => {
  assert.equal(TEXTOS_TABLERO.en["tablero.aviso"], "This tool supports, never replaces, the judgment of farmers and local experts.");
  assert.equal(TEXTOS_TABLERO.es["tablero.aviso"], "Esta herramienta apoya, y no sustituye, el juicio del agricultor ni del técnico.");
  assert.match(TEXTOS_TABLERO.pt["tablero.aviso"], /apoia, e não substitui/);
  assert.match(TEXTOS_TABLERO.fr["tablero.aviso"], /appuie, et ne remplace pas/);
});

test("al importar el módulo los textos quedan registrados y t() responde en cada idioma", () => {
  for (const codigo of IDIOMAS) {
    assert.deepEqual(claves(codigo).filter((c) => c.startsWith("tablero.")).sort(), Object.keys(TEXTOS_TABLERO.en).sort());
    fijarIdioma(codigo);
    assert.equal(t("tablero.aviso"), TEXTOS_TABLERO[codigo]["tablero.aviso"]);
    assert.equal(t("tablero.marca.como", { anio: "AAAA" }), TEXTOS_TABLERO[codigo]["tablero.marca.como"].replace("{anio}", "AAAA"));
  }
  fijarIdioma("en");
});

test("toda clave que usa la página existe", () => {
  const html = leer("index.html");
  const usadas = new Set();
  for (const m of html.matchAll(/data-i18n="([^"]+)"/g)) usadas.add(m[1]);
  for (const m of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const par of m[1].split(";")) usadas.add(par.split(":")[1].trim());
  }
  for (const archivo of ["js/dashboard.js", "js/interfaz.js"]) {
    for (const m of leer(archivo).matchAll(/["'`:](tablero\.[A-Za-z_.]+)["'`]/g)) usadas.add(m[1]);
  }
  assert.ok(usadas.size > 50, `se esperaban muchas claves en uso y hay ${usadas.size}`);
  for (const clave of usadas) assert.ok(tiene(clave, "en"), `clave sin texto: ${clave}`);
});

test("la página trae el texto de respaldo en inglés junto a cada clave", () => {
  const html = leer("index.html");
  // El elemento con data-i18n lleva escrito el mismo texto que el diccionario en inglés (espacios aparte).
  for (const m of html.matchAll(/data-i18n="([^"]+)"[^>]*>\s*([^<]*?)\s*</g)) {
    const [, clave, escrito] = m;
    if (!escrito) continue; // el texto va después de un hijo (icono): lo cubre la prueba con navegador
    const limpio = escrito.replace(/\s+/g, " ").replaceAll("&amp;", "&");
    assert.equal(limpio, TEXTOS_TABLERO.en[clave], `${clave}: el texto del HTML no es el del diccionario`);
  }
});
