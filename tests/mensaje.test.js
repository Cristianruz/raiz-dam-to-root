// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Mensaje de WhatsApp en cuatro idiomas (web/js/mensaje.js; docs/decisiones/2026-11-14_whatsapp_idiomas.md).
// - Las plantillas de español, inglés, portugués y francés tienen todas las llaves, solo sus marcadores, ninguna
//   cifra escrita a mano y ninguna palabra prohibida (CLAUDE.md, reglas 3 y 10).
// - El mensaje sale completo en cada idioma con los datos reales del cubo: sin marcadores sin llenar, con sus dos
//   avisos y con los números en el formato del idioma (Intl).
// - Sin idioma pedido, abre en el del navegador si hay plantilla; si no, en español.
// Los números de este archivo son de prueba o se leen de web/data.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as reglas from "../web/reglas.js";
import { formatoHectareas } from "../web/js/resumen.js";
import {
  IDIOMAS_WHATSAPP,
  NOTA_TRADUCCION,
  idiomaInicialWhatsApp,
  problemasIdiomasWhatsApp,
  textoWhatsApp,
  tienePalabraProhibida,
} from "../web/js/mensaje.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const leer = (rel) => JSON.parse(fs.readFileSync(path.join(RAIZ, rel), "utf8"));
const cubo = leer("web/data/cubo.json");
const parcelas = leer("web/data/parcelas.geojson").features.map((f) => f.properties);
const CODIGOS = IDIOMAS_WHATSAPP.map((i) => i.codigo);

// Una parcela clasificada con varias opciones y una abstenida, de los datos reales.
const conOpciones = parcelas.find((p) => !p.abstencion && (cubo.parcelas[p.id]?.opciones ?? []).length >= 3);
const abstenida = parcelas.find((p) => p.abstencion);
const D = cubo.dotaciones?.marcas?.find((m) => Number.isFinite(Number(m.valor)))?.valor ?? cubo.dotaciones?.deslizador?.min;

// Avisos y respuesta de cada idioma, leídos del mensaje en ese idioma (no se repiten aquí).
const AVISO_JUICIO = { es: /juicio del agricultor/, en: /judgment of the farmer/, pt: /julgamento do agricultor/, fr: /jugement de l.agriculteur/ };
const RESPUESTA = { es: /Responda /, en: /Reply /, pt: /Responda /, fr: /Répondez / };

test("los cuatro idiomas de la decisión, cada uno con su locale", () => {
  assert.deepEqual(CODIGOS, ["es", "en", "pt", "fr"]);
  for (const i of IDIOMAS_WHATSAPP) assert.ok(new Intl.NumberFormat(i.locale).resolvedOptions().locale.startsWith(i.codigo), i.locale);
  // Solo la española la revisó una persona; las demás llevan la nota de traducción automática.
  assert.deepEqual(IDIOMAS_WHATSAPP.filter((i) => i.revisado).map((i) => i.codigo), ["es"]);
  assert.match(NOTA_TRADUCCION, /machine-drafted/i);
});

test("plantillas: todas las llaves, solo sus marcadores, sin cifras y sin palabras prohibidas", () => {
  assert.deepEqual(problemasIdiomasWhatsApp(), []);
});

test("el validador de lenguaje reconoce las palabras prohibidas en los cuatro idiomas", () => {
  for (const malo of ["the only option", "first choice", "you save water", "la única opción", "ahorra agua",
    "a primeira opção", "economiza água", "la seule option", "la première", "économise l'eau", "vendre l'eau",
    "the best option", "we recommend alfalfa", "la mejor opción", "le recomendamos", "a melhor opção", "recomendamos",
    "la meilleure option", "nous recommandons", "promete agua", "we promise"]) {
    assert.ok(tienePalabraProhibida(malo), malo);
  }
  for (const bueno of ["it is enough for", "alcanza para", "dá para", "cela suffit pour", "Bonjour", "compromete você", "obliga por"]) {
    assert.ok(!tienePalabraProhibida(bueno), bueno);
  }
});

test("el mensaje sale completo en cada idioma, con sus avisos y los números en su formato", { skip: !conOpciones && "sin parcela clasificada con opciones" }, () => {
  const opciones = cubo.parcelas[conOpciones.id].opciones;
  const textos = {};
  for (const codigo of CODIGOS) {
    const t = textoWhatsApp(conOpciones, opciones, { reglas, D, r: 0, idioma: codigo });
    textos[codigo] = t;
    assert.ok(!t.includes("{{"), `${codigo}: marcador sin llenar`);
    assert.match(t, AVISO_JUICIO[codigo], `${codigo}: aviso de juicio local`);
    assert.match(t, /Conagua/, `${codigo}: aviso de simulación`);
    assert.match(t, RESPUESTA[codigo], `${codigo}: respuesta`);
    assert.ok(!tienePalabraProhibida(t), `${codigo}: palabra prohibida en el mensaje`);
    // La superficie, con el separador decimal del idioma.
    const area = new Intl.NumberFormat(IDIOMAS_WHATSAPP.find((i) => i.codigo === codigo).locale, { maximumFractionDigits: 3 }).format(conOpciones.area_ha);
    assert.ok(t.includes(`(${area} ha)`), `${codigo}: superficie «${area}»`);
    // Tantas opciones numeradas como trae el cubo.
    assert.equal((t.match(/^\*\d+\. /gm) ?? []).length, opciones.length, `${codigo}: opciones numeradas`);
  }
  // Cuatro textos distintos (no se cayó a español en silencio).
  assert.equal(new Set(Object.values(textos)).size, CODIGOS.length);
});

test("las hectáreas que alcanzan, con la misma regla que la tarjeta (formatoHectareas: hacia abajo, nunca más que el área)", { skip: !conOpciones && "sin parcela clasificada con opciones" }, () => {
  const opciones = cubo.parcelas[conOpciones.id].opciones;
  const area = conOpciones.area_ha;
  const fh = formatoHectareas(area);
  const dotaciones = [...new Set([...(cubo.dotaciones?.marcas ?? []).map((m) => m.valor), cubo.dotaciones?.deslizador?.max])].filter(Number.isFinite);
  let revisadas = 0;
  for (const D of dotaciones) {
    const t = textoWhatsApp(conOpciones, opciones, { reglas, D, r: 0, idioma: "en" });
    for (const o of opciones) {
      const ev = reglas.evaluarOpcion(o, area, D, 0);
      if (!(ev.lamina.p50 > 0)) continue;
      const esperado = `it is enough for ${fh(ev.hectareas.p50)} of ${fh(area)} ha`;
      assert.ok(t.includes(esperado), `${o.id} con ${D}: falta «${esperado}»`);
      assert.ok(Number(fh(ev.hectareas.p50).replace(/,/g, "")) <= area, `${o.id} con ${D}: más que el área`);
      revisadas += 1;
    }
  }
  assert.ok(revisadas > 0, "ninguna opción con riego revisada");
});

test("parcela abstenida: pide revisarla con el técnico en cada idioma, sin pedir respuesta", { skip: !abstenida && "sin parcela abstenida" }, () => {
  for (const codigo of CODIGOS) {
    const t = textoWhatsApp(abstenida, [], { reglas, D, r: 0, idioma: codigo });
    assert.ok(!RESPUESTA[codigo].test(t), `${codigo}: no pide responder`);
    assert.match(t, AVISO_JUICIO[codigo]);
  }
});

test("el idioma guardado en el navegador va antes que el del navegador; sin almacenamiento, funciona igual", () => {
  const nav = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const alm = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const fijar = (nombre, valor) => Object.defineProperty(globalThis, nombre, { value: valor, configurable: true, writable: true });
  try {
    fijar("navigator", { languages: ["pt-BR"], language: "pt-BR" });
    fijar("localStorage", { getItem: (k) => (k === "root.whatsapp.idioma" ? "fr" : null), setItem() {} });
    assert.equal(idiomaInicialWhatsApp(), "fr");
    // Un valor guardado que no es un idioma (o una llave heredada) no cuenta.
    fijar("localStorage", { getItem: () => "constructor", setItem() {} });
    assert.equal(idiomaInicialWhatsApp(), "pt");
    // Almacenamiento bloqueado (modo privado): se lee el del navegador y nada truena.
    fijar("localStorage", { getItem() { throw new Error("bloqueado"); }, setItem() { throw new Error("bloqueado"); } });
    assert.equal(idiomaInicialWhatsApp(), "pt");
  } finally {
    for (const [nombre, d] of [["navigator", nav], ["localStorage", alm]]) {
      if (d) Object.defineProperty(globalThis, nombre, d);
      else delete globalThis[nombre];
    }
  }
});

test("sin idioma pedido: el del navegador si hay plantilla; si no, español", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const conIdiomas = (languages) =>
    Object.defineProperty(globalThis, "navigator", { value: { languages, language: languages[0] }, configurable: true, writable: true });
  try {
    conIdiomas(["pt-BR", "en-US"]);
    assert.equal(idiomaInicialWhatsApp(), "pt");
    conIdiomas(["de-DE", "fr-CA"]);
    assert.equal(idiomaInicialWhatsApp(), "fr");
    conIdiomas(["de-DE"]);
    assert.equal(idiomaInicialWhatsApp(), "es");
    // Un idioma pedido que no existe tampoco rompe el mensaje: abre en el del navegador.
    conIdiomas(["en-GB"]);
    const t = textoWhatsApp(abstenida ?? conOpciones, [], { reglas, D, r: 0, idioma: "de" });
    assert.match(t, AVISO_JUICIO.en);
  } finally {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else delete globalThis.navigator;
  }
});
