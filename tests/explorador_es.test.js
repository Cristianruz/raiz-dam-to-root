// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// tests/explorador_es.test.js — Español opcional del explorador (web/js/explorador_es.js): traduce la interfaz,
// nunca cambia un número y deja en inglés lo que no conoce (docs/decisiones/2026-11-15_ingles_primero.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ES, traducir, idiomaExplorador } from "../web/js/explorador_es.js";

const cifras = (s) => s.match(/\d+(?:[.,]\d+)*/g) ?? [];

test("traduce rótulos de la interfaz y conserva los espacios", () => {
  assert.equal(traducir("Fields"), "Parcelas");
  assert.equal(traducir("  Water allocation "), "  Dotación de agua ");
  assert.equal(traducir("Why?"), "¿Por qué?");
});

test("las cifras salen iguales y en el mismo orden", () => {
  for (const [en, es] of [
    ["Enough for 12.4 of 20 hectares", "Alcanza para 12.4 de 20 hectáreas"],
    ["Field P0757", "Parcela P0757"],
    ["Alfalfa · 3.2 ha · Not enough water", "Alfalfa · 3.2 ha · Agua insuficiente"],
    ["Commits water for 3–5 years", "Compromete agua por 3–5 años"],
    ["1,230 fields in Delicias – Saucillo", "1,230 parcelas en Delicias – Saucillo"],
  ]) {
    const hecho = traducir(en);
    assert.equal(hecho, es);
    assert.deepEqual(cifras(hecho), cifras(en), en);
  }
});

test("frases con el nombre de un cultivo y rótulo con valor", () => {
  assert.equal(traducir("Current rotation: Pecan orchard"), "Rotación actual: Huerta de nogal");
  assert.equal(traducir("Alfalfa ties up water for 3–5 years (2–4 years left)."),
    "Alfalfa compromete agua por 3–5 años (quedan 2–4 años).");
  assert.equal(traducir("Forage maize: salinity not compared — not in the map."),
    "Maíz forrajero: salinidad sin comparar: no está en el mapa.");
});

test("lo que no está en el diccionario queda en inglés, sin cambios", () => {
  const fuente = "NASA HLS v2.0 via Google Earth Engine; two pilot areas";
  assert.equal(traducir(fuente), fuente);
  assert.equal(traducir(""), "");
});

test("cada traducción conserva tantos «#» como su forma en inglés y no usa palabras vetadas", () => {
  const vetadas = /\b(mejor|recomend\w*|ahorr\w*|solos?|first|only)\b/i;
  for (const [en, es] of ES) {
    assert.equal((es.match(/#/g) ?? []).length, (en.match(/#/g) ?? []).length, en);
    assert.ok(!vetadas.test(es), es);
  }
});

test("sin elección, el explorador abre en inglés", () => {
  assert.equal(idiomaExplorador(), "en");
});

test("los espacios que no se cortan entre cifra y unidad no impiden traducir", () => {
  assert.equal(traducir("With 3.5\u00a0thousand m³/ha, the current rotation (Alfalfa) has enough water for 0.97 of 7.95 hectares."),
    "Con 3.5 millares/ha, la rotación actual (Alfalfa) tiene agua suficiente para 0.97 de 7.95 hectáreas.");
});

test("dos frases en un texto: cada una se traduce y ningún patrón se traga las dos", () => {
  assert.equal(
    traducir("With 3.5 thousand m³/ha, the current rotation (Alfalfa) has enough water for 0.97 of 7.95 hectares. Alfalfa ties up water for 3–4 years (0–1 years left)."),
    "Con 3.5 millares/ha, la rotación actual (Alfalfa) tiene agua suficiente para 0.97 de 7.95 hectáreas. Alfalfa compromete agua por 3–4 años (quedan 0–1 años).");
});
