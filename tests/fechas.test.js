// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Fechas de la hoja impresa (web/js/mensaje.js → fmtFechaUi) con la zona horaria de la zona piloto.
// - Una fecha sin hora («AAAA-MM-DD», como la fecha de consulta de las fuentes) es un día del calendario:
//   sale el mismo día en cualquier zona horaria. Antes, new Date("2026-11-14") se leía como medianoche UTC y
//   en Chihuahua (UTC−6) la hoja decía «Accessed Nov 13, 2026» (nota de la sesión de datos, 14-nov 20:05).
// - Con hora, es un instante: se dice en la hora local de quien imprime (como antes).
// La zona se fija ANTES de importar el módulo (import dinámico): node --test corre cada archivo en su propio
// proceso, así que no afecta a las demás pruebas. Las fechas de aquí son de prueba.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.TZ = "America/Chihuahua";
const { fmtFechaUi } = await import("../web/js/mensaje.js");

test("la zona horaria de la prueba es la de Chihuahua (la que mostraba el error)", () => {
  assert.equal(Intl.DateTimeFormat().resolvedOptions().timeZone, "America/Chihuahua");
  // Sin la corrección, este es el día que salía: la medianoche UTC del 14 es el 13 en Chihuahua.
  assert.equal(new Date("2026-11-14").getDate(), 13);
  assert.equal(new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date("2026-11-14")), "Nov 13, 2026");
});

test("una fecha sin hora sale el mismo día: «Nov 14, 2026» para 2026-11-14", () => {
  assert.equal(fmtFechaUi("2026-11-14"), "Nov 14, 2026");
  assert.equal(fmtFechaUi("2026-11-14", "long"), "November 14, 2026");
  assert.equal(fmtFechaUi(" 2026-11-14 "), "Nov 14, 2026");
  // Primer y último día del año: tampoco cambian de año.
  assert.equal(fmtFechaUi("2026-01-01"), "Jan 1, 2026");
  assert.equal(fmtFechaUi("2026-12-31"), "Dec 31, 2026");
});

test("una fecha sin hora que no existe se deja tal cual (no se corre al mes siguiente)", () => {
  assert.equal(fmtFechaUi("2026-02-30"), "2026-02-30");
  assert.equal(fmtFechaUi("2026-13-01"), "2026-13-01");
});

test("con hora es un instante: se dice en la hora local", () => {
  // 02:00 UTC del 15 son las 20:00 del 14 en Chihuahua.
  assert.equal(fmtFechaUi("2026-11-15T02:00:00+00:00"), "Nov 14, 2026");
  assert.equal(fmtFechaUi("2026-11-14T21:33:59Z"), "Nov 14, 2026");
  assert.equal(fmtFechaUi(new Date(2026, 10, 14, 23, 30)), "Nov 14, 2026");
  assert.equal(fmtFechaUi(new Date(2026, 10, 14, 23, 30), "long"), "November 14, 2026");
});

test("lo que no es fecha se devuelve como texto", () => {
  assert.equal(fmtFechaUi("not a date"), "not a date");
  assert.equal(fmtFechaUi(undefined), "");
});
