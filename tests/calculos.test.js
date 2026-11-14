// Ejecutar: node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const C = require("../web/calculos.js");

const trigo = { id: "trigo", demanda_neta_mm: 450, eficiencia: 0.65, rendimiento_t_ha: 6, precio_mxn_t: 6000, costo_mxn_ha: 25000 };
const alfalfa = { id: "alfalfa", demanda_neta_mm: 1300, eficiencia: 0.65, rendimiento_t_ha: 18, precio_mxn_t: 4000, costo_mxn_ha: 45000 };
const nogal = { id: "nogal", demanda_neta_mm: 1150, eficiencia: 0.70, rendimiento_t_ha: 1.8, precio_mxn_t: 80000, costo_mxn_ha: 70000, perenne_estricto: true };

test("1 cm sobre 1 ha son 100 m³", () => {
  assert.equal(C.volumenDisponible(1, 1), 100);
  assert.equal(C.volumenDisponible(30, 18), 54000);
});

test("lámina bruta = neta / eficiencia", () => {
  assert.ok(Math.abs(C.laminaBrutaCm(alfalfa) - 200) < 1e-9); // 130 cm / 0.65
});

test("con agua de sobra se riega toda la parcela", () => {
  const r = C.evaluar(trigo, 10, 100);
  assert.equal(r.haRegables, 10);
  assert.equal(r.cobertura, 1);
});

test("con agua escasa la superficie regable es proporcional", () => {
  // Alfalfa pide 200 cm; con 50 cm alcanza para 1/4 de la parcela.
  const r = C.evaluar(alfalfa, 20, 50);
  assert.ok(Math.abs(r.haRegables - 5) < 1e-9);
  assert.ok(Math.abs(r.ingresoNeto - 5 * (18 * 4000 - 45000)) < 1e-6);
});

test("dotación cero no riega nada", () => {
  const r = C.evaluar(trigo, 10, 0);
  assert.equal(r.haRegables, 0);
  assert.equal(r.ingresoNeto, 0);
  assert.equal(r.pesosPorM3, 0);
});

test("perenne sin agua suficiente queda marcado y no es la mejor", () => {
  const cultivos = { nogal, trigo };
  const filas = C.compararParcela({ id: "X", superficie_ha: 10, cultivo_actual: "nogal", alternativas: ["trigo"] }, cultivos, 30);
  const n = filas.find((f) => f.cultivoId === "nogal");
  assert.equal(n.riesgoPerenne, true);
  assert.equal(filas.find((f) => f.esMejor).cultivoId, "trigo");
});

test("cultivo inexistente da error claro", () => {
  assert.throws(() => C.compararParcela({ id: "X", superficie_ha: 1, cultivo_actual: "maiz", alternativas: [] }, {}, 30), /maiz/);
});

test("semáforo", () => {
  assert.equal(C.semaforo(0.95), "verde");
  assert.equal(C.semaforo(0.6), "ambar");
  assert.equal(C.semaforo(0.2), "rojo");
});
