// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// Funciones puras de web/js/relieve.js (kit A9, parte web; S9 §4 bis): las MISMAS que usa la página.
// - prepararRutas: de segmentos sueltos (D8) a piezas sin tramos repetidos y caminos para las gotas;
// - puntoEn: punto a una distancia del inicio de un camino;
// - htmlRelieveParcela: línea del renglón Soil (zona sin relieve, relieve null, aporte cero, sin rótulo);
// - leerOpcional / cargarRelieve: «no existe» (404) no es lo mismo que «no se pudo leer» (500, JSON roto).
// Las coordenadas y valores de aquí son datos de prueba inventados para el caso, no cifras de la página.
import { test } from "node:test";
import assert from "node:assert/strict";
import { prepararRutas, puntoEn, htmlRelieveParcela, leerOpcional, cargarRelieve } from "../web/js/relieve.js";

const linea = (coords, zona) => ({
  type: "Feature",
  properties: zona ? { zona } : {},
  geometry: { type: "LineString", coordinates: coords },
});

test("prepararRutas: dos nacimientos que confluyen dan dos caminos y piezas sin tramos repetidos", () => {
  // A -> C y B -> C, luego C -> D: la pieza C -> D lleva magnitud 2 (dos nacimientos drenan por ahí).
  const fc = { type: "FeatureCollection", features: [linea([[0, 0], [1, 1]]), linea([[2, 0], [1, 1]]), linea([[1, 1], [1, 2]])] };
  const r = prepararRutas(fc);
  assert.equal(r.segmentos, 3);
  assert.equal(r.caminos.length, 2, "un camino por nacimiento");
  for (const c of r.caminos) {
    assert.deepEqual(c.coords.at(-1), [1, 2], "cada camino llega a la salida");
    assert.ok(c.largo > 0);
  }
  const tramos = r.piezas.features.flatMap((f) => f.geometry.coordinates.slice(1).map((b, i) => `${f.geometry.coordinates[i]}>${b}`));
  assert.equal(new Set(tramos).size, tramos.length, "ningún tramo se dibuja dos veces");
  assert.equal(tramos.length, 3);
  const salida = r.piezas.features.find((f) => f.geometry.coordinates[0][0] === 1 && f.geometry.coordinates[0][1] === 1);
  assert.equal(salida.properties.mag, 2, "aguas abajo de la confluencia la magnitud suma");
  assert.ok(salida.properties.w > r.piezas.features.find((f) => f !== salida).properties.w, "más magnitud, más grosor");
  assert.equal(r.hayZona, false);
});

test("prepararRutas: conserva la zona y acepta MultiLineString; vacío sin fallar", () => {
  const fc = {
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: { zona: "z1" }, geometry: { type: "MultiLineString", coordinates: [[[0, 0], [0, 1], [0, 2]]] } },
      linea([[5, 5], [5, 6]], "z2"),
      { type: "Feature", properties: {}, geometry: null },
    ],
  };
  const r = prepararRutas(fc);
  assert.equal(r.hayZona, true);
  assert.deepEqual(r.caminos.map((c) => c.zona).sort(), ["z1", "z2"]);
  assert.deepEqual(r.piezas.features.map((f) => f.properties.zona).sort(), ["z1", "z2"]);
  const vacio = prepararRutas({ type: "FeatureCollection", features: [] });
  assert.deepEqual([vacio.segmentos, vacio.caminos.length, vacio.piezas.features.length], [0, 0, 0]);
  assert.equal(prepararRutas(null).segmentos, 0);
});

test("puntoEn: extremos e interpolación a lo largo del camino", () => {
  const { caminos } = prepararRutas({ type: "FeatureCollection", features: [linea([[0, 0], [0, 1], [0, 3]])] });
  const c = caminos[0];
  assert.deepEqual(puntoEn(c, -1), [0, 0]);
  assert.deepEqual(puntoEn(c, 0), [0, 0]);
  assert.deepEqual(puntoEn(c, c.largo + 1), [0, 3]);
  const [x, y] = puntoEn(c, c.largo / 2); // a la mitad del largo total (3 unidades): en y = 1.5
  assert.equal(x, 0);
  assert.ok(Math.abs(y - 1.5) < 1e-9, `y = ${y}`);
});

const relieveDatos = { zonas: { z1: { rotulo: "rótulo de prueba" }, z2: {} } };

test("htmlRelieveParcela: sin relieve, relieve null o sin ningún indicador => cadena vacía", () => {
  assert.equal(htmlRelieveParcela({ properties: { id: "X" } }), "");
  assert.equal(htmlRelieveParcela({ properties: { id: "X", relieve: null } }), "");
  assert.equal(htmlRelieveParcela({ id: "X", relieve: { pendiente_media_pct: null, aportacion_externa_ha: null, frac_depresion: null } }), "");
});

test("htmlRelieveParcela: indicadores de los datos, aporte cero y rótulo de la zona", () => {
  const p = { id: "X", zona: "z1", relieve: { pendiente_media_pct: 2.25, aportacion_externa_ha: 0, frac_depresion: 0.5 } };
  const html = htmlRelieveParcela(p, { relieve: relieveDatos });
  assert.match(html, /mean slope <strong>2\.3%<\/strong>/);
  assert.match(html, /receives no runoff from upslope/, "aporte 0: sin escurrimiento desde arriba");
  assert.match(html, /<strong>50%<\/strong> of the field in terrain depressions/);
  assert.match(html, /\(rótulo de prueba\)/);
  const conAporte = htmlRelieveParcela({ ...p, relieve: { ...p.relieve, aportacion_externa_ha: 12.34 } }, { relieve: relieveDatos });
  assert.match(conAporte, /receives runoff from up to <strong>12\.3 ha<\/strong> upslope/);
});

test("htmlRelieveParcela: zona sin rótulo en relieve.json y datos faltantes se dicen, no se inventan", () => {
  const p = { id: "X", zona: "z2", relieve: { pendiente_media_pct: null, aportacion_externa_ha: 3, frac_depresion: null } };
  // z2 no trae rótulo y las otras zonas traen rótulos distintos: no se elige uno.
  const html = htmlRelieveParcela(p, { relieve: { zonas: { z1: { rotulo: "r1" }, z3: { rotulo: "r2" }, z2: {} } } });
  assert.match(html, /mean slope: no data/);
  assert.match(html, /terrain depressions: no data/);
  assert.match(html, /scale label not available/);
  // Si todas las zonas con rótulo dicen lo mismo, ese rótulo común vale para la parcela.
  assert.match(htmlRelieveParcela(p, { relieve: relieveDatos }), /\(rótulo de prueba\)/);
});

test("leerOpcional y cargarRelieve: 404 es «ausente»; 500 o JSON roto es «error» y no se guarda", async () => {
  const original = globalThis.fetch;
  const respuestas = new Map();
  let llamadas = 0;
  globalThis.fetch = async (url) => {
    llamadas += 1;
    const r = respuestas.get(url);
    if (r instanceof Error) throw r;
    return { status: r.status, ok: r.status >= 200 && r.status < 300, json: async () => JSON.parse(r.cuerpo) };
  };
  try {
    respuestas.set("a.json", { status: 404, cuerpo: "" });
    respuestas.set("b.json", { status: 500, cuerpo: "" });
    respuestas.set("c.json", { status: 200, cuerpo: "{roto" });
    respuestas.set("d.json", new Error("sin red"));
    assert.equal((await leerOpcional("a.json")).estado, "ausente");
    const b = await leerOpcional("b.json");
    assert.equal(b.estado, "error");
    assert.match(b.detalle, /HTTP 500/);
    assert.match((await leerOpcional("c.json")).detalle, /invalid JSON/);
    assert.match((await leerOpcional("d.json")).detalle, /network error/);

    // cargarRelieve: un error no queda en caché (se reintenta); un archivo válido sí.
    respuestas.set("r.json", { status: 500, cuerpo: "" });
    assert.equal(await cargarRelieve("r.json"), null);
    respuestas.set("r.json", { status: 200, cuerpo: JSON.stringify(relieveDatos) });
    const antes = llamadas;
    assert.deepEqual(await cargarRelieve("r.json"), relieveDatos, "tras el error se vuelve a pedir");
    await cargarRelieve("r.json");
    assert.equal(llamadas, antes + 1, "una lectura válida se guarda");
  } finally {
    globalThis.fetch = original;
  }
});
