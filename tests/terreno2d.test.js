// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Funciones puras de web/js/terreno2d.js (sombreado, rampa de elevación y velo del mapa 2D): las MISMAS que usa
// la página.
// - rectangulosDeZonas / poligonoInvertido: el velo gris cubre todo menos los rectángulos de las zonas piloto;
// - extremosDeElevacion / rampaDeColor: los extremos de la rampa se leen de gemelo.json, nunca del código;
// - fuenteDem: la fuente raster-dem de una zona, con la codificación y los zooms de gemelo.json;
// - resolucionDelModelo: la resolución del rótulo sale del texto de la fuente de los datos;
// - htmlLeyendaTerreno: rótulo, interruptor, rampa con los extremos de cada zona y la fuente.
// Los rectángulos, elevaciones y textos de aquí son DATOS DE PRUEBA inventados para el caso, no cifras de la página.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import {
  rectangulosDeZonas,
  poligonoInvertido,
  extremosDeElevacion,
  rampaDeColor,
  fuenteDem,
  resolucionDelModelo,
  htmlLeyendaTerreno,
  ventanaDeTesela,
  enmascararTesela,
  IDS,
} from "../web/js/terreno2d.js";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const cubo = {
  zonas: {
    z1: { nombre_mostrar: "Zona uno", bbox: [-10, 20, -8, 21] },
    z2: { nombre_mostrar: "Zona dos", bbox: [-7, 22, -6, 23] },
    sin_caja: { nombre_mostrar: "Sin rectángulo" },
    rota: { bbox: [5, 5, 4, 6] }, // oeste > este: no es un rectángulo
    texto: { bbox: ["a", 1, 2, 3] },
  },
};

const gemelo = {
  terreno: {
    encoding: "terrarium",
    tileSize: 256,
    minzoom: 7,
    maxzoom: 12,
    fuente: "MODELO DE PRUEBA (X/Y/001), 30 m, vía un servicio",
    zonas: {
      z1: { teselas: "data/dem/z1/{z}/{x}/{y}.png", bounds: [-10, 20, -8, 21], elev_min_m: 100.5, elev_max_m: 300.5 },
      z2: { teselas: "data/dem/z2/{z}/{x}/{y}.png", bounds: [-7, 22, -6, 23], elev_min_m: "90", elev_max_m: "1090" },
      plana: { teselas: "data/dem/plana/{z}/{x}/{y}.png", bounds: [0, 0, 1, 1], elev_min_m: 50, elev_max_m: 50 },
      sin_teselas: { bounds: [0, 0, 1, 1], elev_min_m: 1, elev_max_m: 2 },
    },
  },
};

/** Área con signo de un anillo (positiva: sentido contrario a las manecillas). */
function areaConSigno(anillo) {
  let a = 0;
  for (let i = 0; i < anillo.length - 1; i++) a += anillo[i][0] * anillo[i + 1][1] - anillo[i + 1][0] * anillo[i][1];
  return a / 2;
}

/** ¿El punto cae dentro del anillo? (regla par-impar). */
function dentro([x, y], anillo) {
  let d = false;
  for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
    const [xi, yi] = anillo[i];
    const [xj, yj] = anillo[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}

/** ¿El velo cubre el punto? Dentro del anillo exterior y fuera de todos los huecos. */
function cubre(poligono, punto) {
  const [exterior, ...huecos] = poligono.geometry.coordinates;
  return dentro(punto, exterior) && !huecos.some((h) => dentro(punto, h));
}

test("rectangulosDeZonas: un rectángulo por zona con bbox válido; lo demás se omite", () => {
  assert.deepEqual(rectangulosDeZonas(cubo), [
    { id: "z1", bbox: [-10, 20, -8, 21] },
    { id: "z2", bbox: [-7, 22, -6, 23] },
  ]);
  assert.deepEqual(rectangulosDeZonas({}), []);
  assert.deepEqual(rectangulosDeZonas(null), []);
});

test("poligonoInvertido: cubre el mundo menos los rectángulos de las zonas", () => {
  const velo = poligonoInvertido(rectangulosDeZonas(cubo));
  assert.equal(velo.type, "Feature");
  assert.equal(velo.geometry.type, "Polygon");
  const [exterior, ...huecos] = velo.geometry.coordinates;
  assert.equal(huecos.length, 2, "un hueco por zona");
  for (const anillo of velo.geometry.coordinates) {
    assert.deepEqual(anillo[0], anillo[anillo.length - 1], "cada anillo cierra en su primer punto");
    assert.equal(anillo.length, 5);
  }
  // RFC 7946: el exterior gira contra las manecillas y los huecos, a favor.
  assert.ok(areaConSigno(exterior) > 0);
  for (const h of huecos) assert.ok(areaConSigno(h) < 0);
  // Dentro de una zona no hay velo; fuera de todas, sí (también entre las dos zonas y lejos de ellas).
  assert.equal(cubre(velo, [-9, 20.5]), false, "centro de z1");
  assert.equal(cubre(velo, [-6.5, 22.5]), false, "centro de z2");
  assert.equal(cubre(velo, [-7.5, 21.5]), true, "entre las dos zonas");
  assert.equal(cubre(velo, [-10.1, 20.5]), true, "justo al oeste de z1");
  assert.equal(cubre(velo, [100, -40]), true, "lejos");
  // Los huecos son exactamente los rectángulos de los datos.
  const esquinas = (h) => [Math.min(...h.map((p) => p[0])), Math.min(...h.map((p) => p[1])), Math.max(...h.map((p) => p[0])), Math.max(...h.map((p) => p[1]))];
  assert.deepEqual(huecos.map(esquinas), [[-10, 20, -8, 21], [-7, 22, -6, 23]]);
});

test("poligonoInvertido: sin rectángulos no hay velo (no se cubre todo el mapa)", () => {
  assert.equal(poligonoInvertido([]), null);
  assert.equal(poligonoInvertido(undefined), null);
});

test("extremosDeElevacion: mínimo y máximo de cada zona, leídos de gemelo.json", () => {
  assert.deepEqual(extremosDeElevacion(gemelo), [
    { id: "z1", min: 100.5, max: 300.5 },
    { id: "z2", min: 90, max: 1090 },
  ]);
  // Una zona sin desnivel o sin teselas no tiene rampa; sin terreno, ninguna.
  assert.deepEqual(extremosDeElevacion({ terreno: null }), []);
  assert.deepEqual(extremosDeElevacion(null), []);
});

test("rampaDeColor: interpolación lineal de la elevación entre los extremos de los datos", () => {
  // Por debajo del mínimo de los datos (las teselas enmascaradas fuera de la zona) no hay color.
  assert.deepEqual(rampaDeColor(100, 300, ["bajo", "medio", "alto"]), [
    "interpolate", ["linear"], ["elevation"], 98, "transparent", 100, "bajo", 200, "medio", 300, "alto",
  ]);
  assert.deepEqual(rampaDeColor(0, 90, ["a", "b", "c", "d"]), [
    "interpolate", ["linear"], ["elevation"], -0.9, "transparent", 0, "a", 30, "b", 60, "c", 90, "d",
  ]);
  // Sin desnivel, sin colores o con un color vacío no hay rampa.
  assert.equal(rampaDeColor(5, 5, ["a", "b"]), null);
  assert.equal(rampaDeColor(null, 5, ["a", "b"]), null);
  assert.equal(rampaDeColor(1, 5, ["a"]), null);
  assert.equal(rampaDeColor(1, 5, ["a", ""]), null);
});

test("fuenteDem: raster-dem con la plantilla, la codificación, los zooms y los límites de gemelo.json", () => {
  const t = gemelo.terreno;
  assert.deepEqual(fuenteDem(t, t.zonas.z1, "https://ejemplo.test/app/index.html"), {
    type: "raster-dem",
    tiles: ["https://ejemplo.test/app/data/dem/z1/{z}/{x}/{y}.png"],
    encoding: "terrarium",
    tileSize: 256,
    minzoom: 7,
    maxzoom: 12,
    bounds: [-10, 20, -8, 21],
  });
  assert.equal(fuenteDem(t, t.zonas.sin_teselas, "https://ejemplo.test/"), null, "sin plantilla de teselas no hay fuente");
  assert.equal(fuenteDem({ ...t, encoding: "otra" }, t.zonas.z1, "https://ejemplo.test/"), null, "codificación que MapLibre no lee");
});

test("resolucionDelModelo: la cifra sale del texto de la fuente de los datos", () => {
  assert.equal(resolucionDelModelo(gemelo.terreno.fuente), "30 m");
  assert.equal(resolucionDelModelo("Modelo de elevación sin resolución declarada"), null);
  assert.equal(resolucionDelModelo(null), null);
});

test("htmlLeyendaTerreno: rótulo con la resolución de los datos, interruptor, extremos por zona y fuente", () => {
  const nombres = { z1: "Zona uno", z2: "Zona dos" };
  const html = htmlLeyendaTerreno({
    gemelo,
    extremos: extremosDeElevacion(gemelo),
    hayVelo: true,
    nombreZona: (id) => nombres[id],
    ids: { interruptor: "t-int", leyenda: "t-ley" },
  });
  assert.match(html, /Regional terrain, 30 m elevation model/);
  assert.match(html, /<input type="checkbox" role="switch" id="t-int" aria-controls="t-ley" checked>/);
  assert.match(html, /Terrain shading/);
  // Los extremos de cada zona, con el formato de la página (en-US), al metro.
  assert.match(html, /Zona uno: <strong>101 m<\/strong> to <strong>301 m<\/strong>/);
  assert.match(html, /Zona dos: <strong>90 m<\/strong> to <strong>1,090 m<\/strong>/);
  assert.match(html, /class="terreno2d-rampa"/);
  assert.match(html, /outside the pilot areas/);
  assert.match(html, /Source: MODELO DE PRUEBA \(X\/Y\/001\), 30 m, vía un servicio/);
  assert.doesNotMatch(html, /\b(first|only)\b/i);

  // Sin resolución en la fuente el rótulo no inventa la cifra; sin velo no se anuncia.
  const sinCifra = htmlLeyendaTerreno({
    gemelo: { terreno: { ...gemelo.terreno, fuente: null } },
    extremos: extremosDeElevacion(gemelo),
    hayVelo: false,
    nombreZona: (id) => id,
    ids: { interruptor: "a", leyenda: "b" },
    encendido: false,
  });
  assert.match(sinCifra, /Regional terrain, elevation model/);
  assert.doesNotMatch(sinCifra, /outside the pilot areas/);
  assert.match(sinCifra, /Source: not available/);
  assert.doesNotMatch(sinCifra, /role="switch"[^>]*checked/);

  // Sin relieve en los datos: se dice, y no hay interruptor ni rampa.
  const sinRelieve = htmlLeyendaTerreno({ gemelo: null, extremos: [], hayVelo: true, nombreZona: (id) => id, ids: { interruptor: "a", leyenda: "b" } });
  assert.match(sinRelieve, /Terrain shading: not available/);
  assert.doesNotMatch(sinRelieve, /role="switch"/);
  assert.doesNotMatch(sinRelieve, /terreno2d-rampa"/);
});

// --- Teselas enmascaradas: la rampa solo colorea dentro del rectángulo de la zona ----------------------------
/** PNG RGB de 8 bits con el filtro Up en todas las líneas, como los escribe motor/dem_teselas.py. */
function pngDePrueba(ancho, alto, pixel) {
  const trozo = (tipo, cuerpo) => {
    const b = Buffer.concat([Buffer.from(tipo, "ascii"), cuerpo]);
    const cabeza = Buffer.alloc(4);
    cabeza.writeUInt32BE(cuerpo.length);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(b));
    return Buffer.concat([cabeza, b, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const filas = [];
  for (let f = 0; f < alto; f++) filas.push(Buffer.from(Array.from({ length: ancho }, (_, c) => pixel(c, f)).flat()));
  const lineas = filas.map((fila, f) => Buffer.concat([Buffer.from([2]), Buffer.from(fila.map((v, i) => (v - (f ? filas[f - 1][i] : 0)) & 255))]));
  return new Uint8Array(Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    trozo("IHDR", ihdr),
    trozo("IDAT", zlib.deflateSync(Buffer.concat(lineas))),
    trozo("IEND", Buffer.alloc(0)),
  ]));
}

/** Píxeles [fila][columna] = [r, g, b] de un PNG RGB de 8 bits (filtros None y Up); revisa los CRC. */
function leerPNG(bytes) {
  const b = Buffer.from(bytes);
  assert.deepEqual([...b.subarray(0, 8)], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  let pos = 8;
  let ancho = 0;
  let alto = 0;
  const idat = [];
  while (pos < b.length) {
    const largo = b.readUInt32BE(pos);
    const tipo = b.toString("ascii", pos + 4, pos + 8);
    const cuerpo = b.subarray(pos + 8, pos + 8 + largo);
    assert.equal(zlib.crc32(b.subarray(pos + 4, pos + 8 + largo)), b.readUInt32BE(pos + 8 + largo), `CRC de ${tipo}`);
    if (tipo === "IHDR") {
      ancho = cuerpo.readUInt32BE(0);
      alto = cuerpo.readUInt32BE(4);
      assert.deepEqual([...cuerpo.subarray(8)], [8, 2, 0, 0, 0]);
    }
    if (tipo === "IDAT") idat.push(cuerpo);
    pos += 12 + largo;
  }
  const crudo = zlib.inflateSync(Buffer.concat(idat));
  const largoLinea = 1 + ancho * 3;
  assert.equal(crudo.length, alto * largoLinea);
  const filas = [];
  let previa = Buffer.alloc(ancho * 3);
  for (let f = 0; f < alto; f++) {
    const filtro = crudo[f * largoLinea];
    const linea = Buffer.from(crudo.subarray(f * largoLinea + 1, (f + 1) * largoLinea));
    assert.ok(filtro === 0 || filtro === 2, `filtro ${filtro}`);
    if (filtro === 2) for (let i = 0; i < linea.length; i++) linea[i] = (linea[i] + previa[i]) & 255;
    previa = linea;
    filas.push(Array.from({ length: ancho }, (_, c) => [...linea.subarray(c * 3, c * 3 + 3)]));
  }
  return { ancho, alto, filas };
}

test("ventanaDeTesela: columnas y filas cuyos centros caen dentro del rectángulo", () => {
  // La tesela 0/0/0 es el mundo: con 4 píxeles por lado, cada columna mide 90° de longitud.
  assert.deepEqual(ventanaDeTesela(0, 0, 0, [-180, -85, 180, 85], 4), { c0: 0, c1: 3, f0: 0, f1: 3, completa: true });
  // Mitad este del mundo y hemisferio norte: columnas 2 y 3, filas 0 y 1.
  assert.deepEqual(ventanaDeTesela(0, 0, 0, [0, 0, 180, 85], 4), { c0: 2, c1: 3, f0: 0, f1: 1, completa: false });
  // Zoom 1, tesela (1, 0): va de 0° a 180° y del ecuador al norte; el rectángulo cubre solo su cuarto suroeste.
  assert.deepEqual(ventanaDeTesela(1, 1, 0, [0, 0, 90, 66], 4), { c0: 0, c1: 1, f0: 2, f1: 3, completa: false });
  // Un rectángulo que no toca ningún centro de píxel de la tesela.
  assert.equal(ventanaDeTesela(1, 0, 0, [10, 10, 20, 20], 4), null);
});

test("enmascararTesela: fuera del rectángulo, el valor más bajo de la codificación; dentro, igual", async () => {
  const pixel = (c, f) => [130 + f, 40 + c, (c * 16 + f) & 255];
  const original = pngDePrueba(4, 4, pixel);
  const salida = await enmascararTesela(original, { z: 0, x: 0, y: 0, bbox: [0, 0, 180, 85] });
  const { ancho, alto, filas } = leerPNG(salida);
  assert.deepEqual([ancho, alto], [4, 4]);
  for (let f = 0; f < 4; f++) {
    for (let c = 0; c < 4; c++) {
      const dentro = c >= 2 && f <= 1;
      assert.deepEqual(filas[f][c], dentro ? pixel(c, f) : [0, 0, 0], `píxel (${c}, ${f})`);
    }
  }
  // Tesela cubierta entera por el rectángulo: se devuelven los mismos bytes, sin recodificar.
  assert.equal(await enmascararTesela(original, { z: 0, x: 0, y: 0, bbox: [-180, -85, 180, 85] }), original);
  // Lo que no es un PNG como los de las teselas se devuelve tal cual (la capa se dibuja sin máscara).
  const otro = new Uint8Array([1, 2, 3]);
  assert.equal(await enmascararTesela(otro, { z: 0, x: 0, y: 0, bbox: [0, 0, 180, 85] }), otro);
});

test("enmascararTesela: una tesela real de web/data/dem conserva sus elevaciones dentro de la zona", async () => {
  const gemeloReal = JSON.parse(fs.readFileSync(path.join(RAIZ, "web/data/gemelo.json"), "utf-8"));
  const t = gemeloReal.terreno;
  if (!t) return; // sin relieve en los datos no hay tesela que revisar
  const [zid, zona] = Object.entries(t.zonas)[0];
  const lista = JSON.parse(fs.readFileSync(path.join(RAIZ, "web/data/dem", zid, "origen.json"), "utf-8")).teselas;
  const nombre = lista.find((n) => n.startsWith(`${t.maxzoom}/`));
  const [z, x, y] = nombre.replace(".png", "").split("/").map(Number);
  const original = new Uint8Array(fs.readFileSync(path.join(RAIZ, "web/data/dem", zid, nombre)));
  const antes = leerPNG(original);
  const ventana = ventanaDeTesela(z, x, y, zona.bounds, antes.ancho);
  assert.ok(ventana && !ventana.completa, "la primera tesela del zoom máximo asoma fuera del rectángulo de la zona");
  const despues = leerPNG(await enmascararTesela(original, { z, x, y, bbox: zona.bounds }));
  let fuera = 0;
  for (let f = 0; f < antes.alto; f++) {
    for (let c = 0; c < antes.ancho; c++) {
      const dentro = c >= ventana.c0 && c <= ventana.c1 && f >= ventana.f0 && f <= ventana.f1;
      if (!dentro) fuera += 1;
      assert.deepEqual(despues.filas[f][c], dentro ? antes.filas[f][c] : [0, 0, 0], `píxel (${c}, ${f})`);
    }
  }
  assert.ok(fuera > 0);
});

test("IDS: fuentes y capas propias con el prefijo del módulo", () => {
  assert.equal(IDS.fuenteColor("z1"), "terreno2d-dem-color-z1");
  assert.equal(IDS.fuenteDem("z1"), "terreno2d-dem-z1");
  assert.equal(IDS.capaColor("z1"), "terreno2d-color-z1");
  assert.equal(IDS.capaSombra("z1"), "terreno2d-sombra-z1");
  assert.equal(IDS.velo, "terreno2d-velo");
});
