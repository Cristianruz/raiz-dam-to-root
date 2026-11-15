// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; Codex.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  cuantil,
  demandaHistorica,
  evaluarPlan,
} from "../web/js/recomendador.js";
const datos = JSON.parse(
  fs.readFileSync(new URL("../web/data/pronostico.json", import.meta.url)),
);
const geo = JSON.parse(
  fs.readFileSync(new URL("../web/data/parcelas.geojson", import.meta.url)),
);
const suelo = JSON.parse(
  fs.readFileSync(new URL("../web/data/suelo.json", import.meta.url)),
);
const parcela = geo.features.find(
  (f) => f.properties.zona === "delicias_saucillo",
).properties;
const entrada = {
  cultivo: "barbecho",
  objetivo: "maiz_forrajero",
  area: 10,
  dotacion: 10,
  lluvia: 0,
  eficiencia: 0.8,
  sistema: "goteo",
  fecha: "2027-04-15",
  nivel: 0.9,
  dotacionConfirmada: true,
  ph: 7,
  salinidad: 1,
  atrazina: "no",
  phytophthora: "no",
};
const run = (over = {}) =>
  evaluarPlan({
    datos,
    zona: "delicias_saucillo",
    parcela,
    perfil: suelo.perfil.parcelas[parcela.id],
    entrada: { ...entrada, ...over },
  });
const maize = (r) => r.resultados.find((x) => x.id === "maiz_forrajero");

test("balance independiente: neta y eficiencia, sin números precocinados", () => {
  const rot = {
    presiembra_mm: [0, 0],
    serie: [{ anio: 2000, lluvia: { 0: { neta_mm: 100, etc_mm: 120 } } }],
  };
  assert.equal(demandaHistorica(rot, { rangoEficiencia: [0.5, 0.5] }).p50, 2);
  assert.equal(demandaHistorica(rot, { rangoEficiencia: [1, 1] }).p50, 1);
  assert.equal(demandaHistorica(rot, { rangoEficiencia: [0, 1] }), null);
  assert.equal(cuantil([10, 20], 0.5), 15);
});
test("datos reales: más agua aumenta área y eficiencia reduce demanda", () => {
  const low = maize(run({ dotacion: 2 })),
    high = maize(run({ dotacion: 8 }));
  assert.ok(high.areaPlan > low.areaPlan);
  assert.ok(
    maize(run({ eficiencia: 0.9 })).demanda.p50 <
      maize(run({ eficiencia: 0.5 })).demanda.p50,
  );
  assert.equal(maize(run({ dotacion: 0 })).areaPlan, 0);
});
test("menos lluvia no reduce demanda de riego", () =>
  assert.ok(
    maize(run({ lluvia: -20 })).demanda.p50 >= maize(run()).demanda.p50,
  ));
test("volumen disponible se convierte correctamente sin duplicar dotación", () => {
  const r = maize(run({ volumenDisponible: 10000, dotacion: 100 }));
  assert.equal(r.presupuesto, 10);
  assert.equal(r.dotacion, 1);
  assert.ok(Math.abs(r.areaPlan - 10 / r.demanda.plan) < 1e-10);
});
test("confirmaciones y salinidad faltantes nunca se aprueban", () => {
  const r = maize(
    run({
      cultivo: null,
      eficiencia: null,
      dotacionConfirmada: false,
      salinidad: null,
    }),
  );
  assert.equal(r.estado, "condicionado");
  assert.ok(r.pendientes.some((s) => s.includes("ECe")));
});
test("condiciones comprobables producen plan hídrico, no pronóstico de rendimiento", () => {
  const r = maize(run());
  assert.equal(r.estado, "plan_calculado");
  assert.ok(
    r.evidencias.some(
      (e) => e.criterio === "Salinidad · maiz_forrajero" && e.fuente,
    ),
  );
  assert.equal(r.rendimiento, undefined);
});
test("fecha fuera de ventana y chile después de chile bloquean la acción", () => {
  assert.equal(maize(run({ fecha: "2027-12-15" })).estado, "bloqueado");
  const r = run({
    cultivo: "chile",
    objetivo: "chile",
    fecha: "2027-03-10",
  }).resultados.find((x) => x.id === "chile");
  assert.equal(r.estado, "bloqueado");
  assert.ok(r.bloqueos.some((s) => s.includes("después de chile")));
});
test("no reemplazar nogal por un cultivo anual dentro del modelo", () =>
  assert.equal(maize(run({ cultivo: "nogal" })).estado, "bloqueado"));
test("se distingue salinidad desconocida, baja y limitante con su fuente", () => {
  const bajo = maize(run({ salinidad: 1 })),
    alto = maize(run({ salinidad: 5 }));
  assert.equal(bajo.estado, "plan_calculado");
  assert.equal(alto.estado, "condicionado");
  assert.ok(
    alto.evidencias.some((e) => e.estado === "supera_umbral" && e.fuente),
  );
});
test("no aceptar áreas inválidas, eficiencias imposibles o fechas inexistentes", () => {
  for (const e of [
    { area: 0 },
    { area: null },
    { eficiencia: 0 },
    { eficiencia: 1.5 },
    { fecha: "2027-02-30" },
    { nivel: 2 },
  ]) {
    const r = run(e);
    assert.ok(r.errores.length);
    assert.deepEqual(r.resultados, []);
  }
});
test("registro de campo contrastado con el mismo ciclo sin fingir calibración", () => {
  const anio = datos.zonas.delicias_saucillo.anios[0].anio;
  const r = maize(run({ anioObservado: anio, riegoObservado: 5000 }));
  assert.equal(r.contraste.diferencia_m3, 5000 - r.contraste.modelo_central_m3);
  assert.ok(r.contraste.alcance.includes("No es calibración"));
  assert.ok(run({ riegoObservado: 5000 }).errores.length);
});
test("no confundir series de dos zonas ni resultados aleatorios", () => {
  const a = maize(run()),
    b = maize(
      evaluarPlan({
        datos,
        zona: "lazaro_cardenas",
        parcela: geo.features.find(
          (f) => f.properties.zona === "lazaro_cardenas",
        ).properties,
        entrada,
      }),
    );
  assert.notEqual(a.demanda.p50, b.demanda.p50);
  assert.deepEqual(run(), run());
});
