// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Pruebas de los textos del plan y del asesor (web/js/textos_asesor.js) en los cuatro idiomas del proyecto:
// mismas claves, mismos marcadores, sin cifras, sin el lenguaje que la regla 10 de CLAUDE.md no admite, y
// con el aviso de juicio en cada idioma. También: los módulos no llevan textos propios (todo pasa por t()).
// Uso: node --test tests/textos_asesor.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { TEXTOS_ASESOR } from "../web/js/textos_asesor.js";
import { IDIOMAS, claves, fijarIdioma, t, tiene } from "../web/js/i18n.js";
import { avisoJuicio, planDeParcela, textoRestriccion } from "../web/js/recomendador.js";

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), "utf-8");
const marcadores = (texto) => [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const BASE = "en";

// Palabras que la herramienta no usa: no ordena, no puntúa, no nombra una opción por encima de otra y no
// promete nada (regla 10). Con \p{L} para que los acentos cuenten como letras.
const palabra = (raices) => new RegExp(`(?<![\\p{L}])(?:${raices})(?![\\p{L}])`, "iu");
const VETADAS = {
  en: palabra("first|only|best|better|recommend\\p{L}*|sav(?:e|es|ed|ing|ings)|free(?:s|d|ing)? up"),
  es: palabra("mejor\\p{L}*|recomend\\p{L}*|ahorr\\p{L}*|únic[oa]s?"),
  pt: palabra("melhor\\p{L}*|recomend\\p{L}*|poup\\p{L}*|econom\\p{L}*|econôm\\p{L}*"),
  fr: palabra("meilleur\\p{L}*|recommand\\p{L}*|économis\\p{L}*"),
};
// «Pronóstico» y «predicción» quedan fuera, salvo en las frases que niegan que la herramienta pronostique.
const PRONOSTICO = {
  en: /forecast|predict/i,
  es: /pron[oó]stic|predic/i,
  pt: /previs[ãa]o|previs[õo]es|prev[êe](?![\p{L}])|predi/iu,
  fr: /pr[ée]vision|pr[ée]voi|pr[ée]di/i,
};
const NIEGAN_PRONOSTICO = ["asesor.alcance", "asesor.lluvia.intro"];

test("los cuatro idiomas traen exactamente las mismas claves", () => {
  assert.deepEqual(Object.keys(TEXTOS_ASESOR).sort(), [...IDIOMAS].sort());
  const base = Object.keys(TEXTOS_ASESOR[BASE]).sort();
  assert.ok(base.length > 0);
  for (const codigo of IDIOMAS) {
    assert.deepEqual(Object.keys(TEXTOS_ASESOR[codigo]).sort(), base, `claves de ${codigo}`);
    for (const clave of base) {
      assert.ok(clave.startsWith("asesor."), clave);
      assert.ok(tiene(clave, codigo), `${clave} registrada en ${codigo}`);
      const texto = TEXTOS_ASESOR[codigo][clave];
      assert.equal(typeof texto, "string");
      assert.ok(texto.trim().length > 0, `${codigo} ${clave} vacío`);
    }
    assert.ok(base.every((clave) => claves(codigo).includes(clave)), `registradas en i18n · ${codigo}`);
  }
});

test("los mismos marcadores {nombre} en los cuatro idiomas", () => {
  for (const [clave, texto] of Object.entries(TEXTOS_ASESOR[BASE]))
    for (const codigo of IDIOMAS)
      assert.deepEqual(marcadores(TEXTOS_ASESOR[codigo][clave]), marcadores(texto), `${codigo} ${clave}`);
});

test("ningún texto trae cifras: llegan por marcador, con el formato del idioma", () => {
  for (const codigo of IDIOMAS)
    for (const [clave, texto] of Object.entries(TEXTOS_ASESOR[codigo]))
      assert.ok(!/\p{Nd}/u.test(texto), `${codigo} ${clave}: ${texto}`);
});

test("regla 10 en los cuatro idiomas: sin palabras vetadas", () => {
  for (const codigo of IDIOMAS)
    for (const [clave, texto] of Object.entries(TEXTOS_ASESOR[codigo])) {
      const hallada = texto.match(VETADAS[codigo]);
      assert.equal(hallada, null, `${codigo} ${clave}: «${hallada?.[0]}» en «${texto}»`);
    }
  // El detector sí ve lo que busca.
  assert.match("the best option", VETADAS.en);
  assert.match("solo riega", /solo/);
  assert.match("la opción única", VETADAS.es);
  assert.match("a melhor opção", VETADAS.pt);
  assert.match("la meilleure option", VETADAS.fr);
  assert.doesNotMatch("agronômicos", VETADAS.pt);
});

test("«pronóstico» y «predicción» aparecen solo para negar que la herramienta pronostique", () => {
  for (const codigo of IDIOMAS) {
    for (const [clave, texto] of Object.entries(TEXTOS_ASESOR[codigo])) {
      if (NIEGAN_PRONOSTICO.includes(clave)) continue;
      assert.doesNotMatch(texto, PRONOSTICO[codigo], `${codigo} ${clave}`);
    }
    for (const clave of NIEGAN_PRONOSTICO) assert.match(TEXTOS_ASESOR[codigo][clave], PRONOSTICO[codigo], `${codigo} ${clave} conserva la negación`);
  }
  assert.equal(TEXTOS_ASESOR.en["asesor.lluvia.titulo"], "Historical rainfall range (NASA POWER)");
  assert.match(TEXTOS_ASESOR.en["asesor.lluvia.intro"], /it does not forecast the dam/);
});

test("el aviso de juicio, fiel en los cuatro idiomas", () => {
  assert.equal(TEXTOS_ASESOR.en["asesor.aviso_juicio"], "This tool supports, never replaces, the judgment of farmers and local experts.");
  assert.equal(TEXTOS_ASESOR.es["asesor.aviso_juicio"], "Esta herramienta apoya, y no sustituye, el juicio del agricultor ni del técnico.");
  assert.match(TEXTOS_ASESOR.pt["asesor.aviso_juicio"], /apoia, e não substitui, o julgamento do agricultor nem do técnico/);
  assert.match(TEXTOS_ASESOR.fr["asesor.aviso_juicio"], /appuie, et ne remplace pas, le jugement de l'agriculteur ni du technicien/);
  for (const codigo of IDIOMAS) {
    fijarIdioma(codigo);
    assert.equal(avisoJuicio(), TEXTOS_ASESOR[codigo]["asesor.aviso_juicio"]);
  }
  fijarIdioma(BASE);
});

test("cada clave que piden los módulos existe, y cada clave registrada se usa", () => {
  const fuentes = ["../web/js/asesor.js", "../web/js/recomendador.js"].map(leer).join("\n");
  const literales = new Set([...fuentes.matchAll(/["'`](asesor\.[a-z_.]+)["'`]/g)].map((m) => m[1]));
  const prefijos = new Set([...fuentes.matchAll(/`(asesor\.[a-z_.]+\.)\$\{[^}]+\}(_[a-z]+)?`/g)].map((m) => `${m[1]}|${m[2] ?? ""}`));
  assert.ok(literales.size > 0 && prefijos.size > 0);
  const registradas = Object.keys(TEXTOS_ASESOR[BASE]);
  for (const clave of literales) assert.ok(registradas.includes(clave), `falta el texto de ${clave}`);
  const usada = (clave) =>
    literales.has(clave) ||
    [...prefijos].some((p) => {
      const [inicio, fin] = p.split("|");
      return clave.startsWith(inicio) && clave.endsWith(fin);
    });
  for (const clave of registradas) assert.ok(usada(clave), `texto sin usar: ${clave}`);
});

test("los módulos no llevan textos propios: sin letras del español fuera de los comentarios ni palabras vetadas", () => {
  for (const archivo of ["../web/js/asesor.js", "../web/js/recomendador.js"]) {
    const sinComentarios = leer(archivo).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/.*$/gm, "$1");
    assert.deepEqual(sinComentarios.match(/[^\n]*[áéíóúñ¿¡][^\n]*/gi) ?? [], [], `${archivo}: texto fuera de textos_asesor.js`);
    // «#recommendations» es el id del contenedor en web/index.html (no es texto visible).
    const sinIds = sinComentarios.replaceAll('"#recommendations"', "");
    assert.equal(sinIds.match(VETADAS.en), null, `${archivo}: palabra vetada`);
  }
});

test("un plan completo no deja claves a la vista ni palabras vetadas en ningún idioma", () => {
  const cubo = JSON.parse(leer("../web/data/cubo.json"));
  const geo = JSON.parse(leer("../web/data/parcelas.geojson"));
  const pronostico = JSON.parse(leer("../web/data/pronostico.json"));
  const parcela = geo.features.find((f) => f.properties.id === "P0632").properties;
  for (const codigo of IDIOMAS) {
    fijarIdioma(codigo);
    const p = planDeParcela({
      cubo,
      parcela,
      dotacion: cubo.dotaciones.marcas[1].valor,
      lluvia: cubo.lluvia_pct[0],
      entrada: { fecha: "2027-04-15", ph: 9.5, salinidad: 9, cultivo: "alfalfa" },
      requisitos: pronostico.requisitos,
    });
    assert.equal(p.estado, "calculado");
    // Textos que arma la herramienta (los de los datos se muestran como vienen y se revisan en su propia prueba).
    const propios = [p.alcance, p.aviso_juicio, ...p.avisos.filter((a) => a.id !== "sin_rotacion").map((a) => a.texto)];
    for (const x of p.tarjetas) {
      propios.push(x.rotulo, x.descripcion);
      for (const y of [...x.restricciones, ...x.pendientes, ...x.cumplidas]) if (y.origen !== "cubo") propios.push(y.texto);
      for (const r of x.restricciones) if (r.origen !== "cubo") propios.push(textoRestriccion(r));
    }
    assert.ok(propios.length > 8, codigo);
    for (const texto of propios) {
      assert.doesNotMatch(texto, /asesor\.[a-z_]/, `${codigo}: clave a la vista en «${texto}»`);
      assert.doesNotMatch(texto, /\{\w+\}/, `${codigo}: marcador sin llenar en «${texto}»`);
      assert.equal(texto.match(VETADAS[codigo]), null, `${codigo}: «${texto}»`);
    }
    assert.equal(t("asesor.clave_que_no_existe"), "asesor.clave_que_no_existe", "una clave que falta queda a la vista");
  }
  fijarIdioma(BASE);
});
