// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// K-TEST 4: reglas de la web (kit v4 §2.4; S9 §5) sobre la MISMA función que usa la página
// (web/reglas.js). Las entradas salen de los datos (web/data/cubo.json y parcelas.geojson):
// la dotación D de cada caso se deriva de las láminas del propio cubo, sin cifras de memoria.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as R from "../web/reglas.js";

const leer = (rel) => JSON.parse(readFileSync(new URL(rel, import.meta.url), "utf8"));
const cubo = leer("../web/data/cubo.json");
const geo = leer("../web/data/parcelas.geojson");
const explicaciones = leer("../web/data/explicaciones.json");

const opciones = Object.entries(cubo.parcelas).flatMap(([id, p]) => p.opciones.map((o) => ({ id, o })));
const area = Object.fromEntries(geo.features.map((f) => [f.properties.id, f.properties.area_ha]));
const lluvias = cubo.lluvia_pct;
const r0 = lluvias[0];

// Opción de referencia: banda estricta P10 < P50 < P90 (para que exista la zona ámbar).
const ref = opciones.find(({ o }) => {
  const L = o.agua.lamina_bruta[R.llaveLluvia(r0)];
  return L.p10 < L.p50 && L.p50 < L.p90 && L.p10 > 0;
});
assert.ok(ref, "el cubo no tiene ninguna opción con banda P10 < P50 < P90");
const L = ref.o.agua.lamina_bruta[R.llaveLluvia(r0)];
const A = area[ref.id];
const cerca = (a, b, msg) => assert.ok(Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b)), `${msg}: ${a} ≠ ${b}`);

test("llaveLluvia: cada variante de lluvia del cubo tiene su lámina", () => {
  for (const r of lluvias) {
    const llave = R.llaveLluvia(r);
    assert.equal(llave, String(r));
    for (const { o } of opciones) assert.ok(o.agua.lamina_bruta[llave], `falta lamina_bruta["${llave}"] en ${o.id}`);
  }
});

test("D = 0: cobertura 0, cero hectáreas, semáforo rojo y «sin dotación» en la zona", () => {
  assert.equal(R.cobertura(0, L.p50), 0);
  const ha = R.hectareasQueAlcanzan(A, 0, L);
  assert.deepEqual([ha.bajo, ha.p50, ha.alto], [0, 0, 0]);
  assert.equal(R.semaforoAgua(0, L), "rojo");
  for (const r of lluvias) {
    const z = R.aguaComprometida(cubo.zona, 0, r);
    assert.equal(z.sinDotacion, true);
    assert.equal(z.p50, null);
    assert.equal(z.excede, false);
  }
});

test("lámina cero (descanso): cobertura 1 y semáforo verde con cualquier D", () => {
  const descanso = opciones.find(({ o }) => o.agua.lamina_bruta[R.llaveLluvia(r0)].p50 === 0);
  const L0 = descanso ? descanso.o.agua.lamina_bruta[R.llaveLluvia(r0)] : { p10: 0, p50: 0, p90: 0 };
  const des = cubo.dotaciones.deslizador;
  for (const D of [des.min, ...cubo.dotaciones.marcas.map((m) => m.valor), des.max]) {
    assert.equal(R.cobertura(D, L0.p50), 1, `cobertura con D = ${D}`);
    assert.equal(R.semaforoAgua(D, L0), "verde", `semáforo con D = ${D}`);
    assert.equal(R.hectareasQueAlcanzan(A, D, L0).p50, A);
  }
});

test("verde: D cubre L90 (en el límite y por encima)", () => {
  assert.equal(R.semaforoAgua(L.p90, L), "verde");
  assert.equal(R.semaforoAgua(L.p90 + cubo.dotaciones.deslizador.paso, L), "verde");
  assert.equal(R.cobertura(L.p90, L.p50), 1);
});

test("ámbar: D cubre L50 pero no L90", () => {
  assert.equal(R.semaforoAgua(L.p50, L), "ambar");
  assert.equal(R.semaforoAgua((L.p50 + L.p90) / 2, L), "ambar");
});

test("rojo: D no cubre L50; cobertura = D ÷ L50", () => {
  const D = L.p50 / 2;
  assert.equal(R.semaforoAgua(D, L), "rojo");
  cerca(R.cobertura(D, L.p50), D / L.p50, "cobertura");
  cerca(R.hectareasQueAlcanzan(A, D, L).p50, A * (D / L.p50), "hectáreas");
});

test("gris: parcela abstenida, con cualquier D", () => {
  for (const D of [0, L.p50, L.p90]) {
    assert.equal(R.semaforoAgua(D, L, true), "gris");
    assert.equal(R.evaluarOpcion(ref.o, A, D, r0, true).semaforo, "gris");
  }
});

test("hectáreas que alcanzan: rango bajo con L90 y alto con L10", () => {
  const D = (L.p10 + L.p50) / 2; // entre L10 y L50
  const ha = R.hectareasQueAlcanzan(A, D, L);
  assert.ok(ha.bajo < ha.p50 && ha.p50 < ha.alto, `rango desordenado: ${JSON.stringify(ha)}`);
  cerca(ha.bajo, A * R.cobertura(D, L.p90), "extremo bajo");
  cerca(ha.alto, A * R.cobertura(D, L.p10), "extremo alto");
  assert.equal(ha.alto, A, "con D > L10 el extremo alto es toda la parcela");
  const ev = R.evaluarOpcion(ref.o, A, D, r0);
  assert.deepEqual(ev.hectareas, ha);
  assert.equal(ev.semaforo, R.semaforoAgua(D, L));
});

test("agua ya comprometida por encima de 100 %: excede y rango ordenado", () => {
  for (const r of lluvias) {
    const dem = cubo.zona.demanda_perenne_millares[R.llaveLluvia(r)];
    const total = cubo.zona.superficie_total_ha;
    const D = dem.p50 / (2 * total); // los perennes piden el doble de la dotación
    const z = R.aguaComprometida(cubo.zona, D, r);
    assert.equal(z.sinDotacion, false);
    assert.equal(z.excede, true);
    cerca(z.p50, 2, "p50 = 200 %");
    assert.ok(z.p10 <= z.p50 && z.p50 <= z.p90);
    const holgado = R.aguaComprometida(cubo.zona, (2 * dem.p90) / total, r);
    assert.equal(holgado.excede, false);
  }
});

test("superficie abstenida > 0: el indicador es un mínimo («at least»)", () => {
  assert.equal(R.aguaComprometida(cubo.zona, L.p50, r0).alMenos, cubo.zona.superficie_abstenida_ha > 0);
  const total = cubo.zona.superficie_total_ha;
  const zona = { ...cubo.zona, superficie_abstenida_ha: total / 4 };
  const z = R.aguaComprometida(zona, L.p50, r0);
  assert.equal(z.alMenos, true);
  cerca(z.fraccionSinClasificar, 1 / 4, "fracción sin clasificar");
  assert.equal(R.aguaComprometida(zona, 0, r0).alMenos, true, "también con D = 0");
});

test("advertencia de filtro: solo cuando el semáforo de agua queda en rojo", () => {
  const conAviso = opciones.find(({ o }) => o.advertir_si_rojo);
  const op = conAviso ? conAviso.o : { ...ref.o, advertir_si_rojo: true };
  const Lw = op.agua.lamina_bruta[R.llaveLluvia(r0)];
  assert.equal(R.evaluarOpcion(op, A, 0, r0).advertencia, true);
  assert.equal(R.evaluarOpcion(op, A, Lw.p90, r0).advertencia, false);
  assert.equal(R.evaluarOpcion({ ...op, advertir_si_rojo: false }, A, 0, r0).advertencia, false);
});

test("conteos de la zona: cada parcela cae en un semáforo y en un estado", () => {
  for (const D of [0, cubo.dotaciones.deslizador.max]) {
    const c = R.conteosZona(geo.features, cubo, D, r0);
    assert.equal(c.verde + c.ambar + c.rojo + c.gris, geo.features.length);
    assert.equal(c.libre + c.por_vencer + c.comprometida + c.sin_dato, geo.features.length);
    assert.equal(c.clasificadas, geo.features.filter((f) => !f.properties.abstencion).length);
    assert.equal(c.gris, geo.features.filter((f) => f.properties.abstencion).length);
  }
});

test("rellenarMarcadores: valores, dinámicos y marcador desconocido visible", () => {
  const [llave, exp] = Object.entries(explicaciones.explicaciones)[0];
  const dinamicos = Object.fromEntries(explicaciones.meta.dinamicos.map((k) => [k, `<${k}>`]));
  const texto = Object.values(exp.textos).join(" ");
  const lleno = R.rellenarMarcadores(texto, exp.valores, dinamicos);
  assert.ok(!/\{\{\w+\}\}/.test(lleno), `${llave}: quedaron marcadores sin llenar: ${lleno}`);
  // El marcador desconocido se deja tal cual para que la prueba del verificador lo detecte.
  assert.equal(R.rellenarMarcadores("a {{desconocido}} b", exp.valores, dinamicos), "a {{desconocido}} b");
  // Los dinámicos tienen prioridad y formatear recibe (valor, clave).
  const k = Object.keys(exp.valores)[0];
  assert.equal(R.rellenarMarcadores(`{{${k}}}`, exp.valores, { [k]: "din" }), "din");
  assert.equal(R.rellenarMarcadores(`{{${k}}}`, exp.valores, {}, (v, clave) => `${clave}=${v}`), `${k}=${exp.valores[k]}`);
});
