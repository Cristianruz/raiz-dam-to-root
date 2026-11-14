// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// Funciones puras de web/js/contexto.js (bases de datos del reto;
// docs/decisiones/2026-11-14_recursos_del_reto.md): las MISMAS que usa la página.
// - clima del año: valores del año elegido, diferencia IMERG − POWER, año por omisión y modelos de las gráficas;
// - series regionales: resumen anual (suma o media), años parciales, tarjetas con y sin entrega, et_contraste;
// - formato: resolución (m → km), números, meses; eje vertical;
// - recursos del reto: orden y conteos por estado;
// - evidencia por parcela (GEDI y ECOSTRESS) con y sin dato, y riesgo de helada por fecha de siembra.
// Datos: tests/fixtures/contexto_reto/contexto_lleno.json (DE PRUEBA, lo genera el motor con datos de
// prueba) y, si existe, web/data/contexto.json (lo real de hoy). Los valores esperados se leen de ahí.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  NOTA_REGIONAL,
  anioPorOmision,
  cargarContexto,
  climaDelAnio,
  contarEstados,
  diferenciaLluvia,
  escalaY,
  etiquetaMes,
  evidenciaDeParcela,
  formatoNumero,
  formatoResolucion,
  graficasDeClima,
  mesDia,
  modeloContraste,
  modeloTarjetas,
  montarContextoRegional,
  montarRecursosReto,
  num,
  ordenarRecursos,
  puntosAnuales,
  riesgoDeHelada,
  seriesDeZona,
  ultimoMesConDato,
  valorAnual,
} from "../web/js/contexto.js";

const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), "utf8"));
const LLENO = leer("./fixtures/contexto_reto/contexto_lleno.json"); // DATOS DE PRUEBA
const URL_REAL = new URL("../web/data/contexto.json", import.meta.url);
const REAL = existsSync(URL_REAL) ? leer(URL_REAL) : null;
const [ZONA_A, ZONA_B] = Object.keys(LLENO.zonas);
const CUENCA = "cuenca"; // llave de la serie de GRACE (motor/esquemas.py, ZONA_CUENCA)
const MOTIVO = LLENO.motivo_pedido;
// Un contexto como el de hoy: sin las entregas nuevas (bloques en null con su motivo).
const SIN_ENTREGAS = {
  ...LLENO,
  contexto_regional: null, contexto_regional_motivo: MOTIVO,
  gedi: null, gedi_motivo: MOTIVO,
  ecostress: null, ecostress_motivo: MOTIVO,
  gaez: null, gaez_motivo: MOTIVO,
  heladas: null, heladas_motivo: MOTIVO,
  recursos: LLENO.recursos.map((r) => (r.fuente_contexto ? { ...r, estado: "requested", motivo: MOTIVO } : r)),
};
const aniosDe = (zona) => LLENO.clima_anual[zona].anios;

test("num: solo números finitos; lo demás es «sin dato»", () => {
  assert.equal(num(0), 0);
  assert.equal(num("12.5"), 12.5);
  for (const v of [null, undefined, "", true, false, NaN, Infinity, "abc"]) assert.equal(num(v), null, String(v));
});

test("climaDelAnio: valores del año elegido y diferencia IMERG − POWER a un decimal", () => {
  const completo = aniosDe(ZONA_A).find((a) => a.lluvia_imerg_mm != null && a.lluvia_power_mm != null && a.eto_mm != null);
  const c = climaDelAnio(LLENO, ZONA_A, completo.anio);
  assert.equal(c.anio, completo.anio);
  assert.equal(c.lluviaImerg, completo.lluvia_imerg_mm);
  assert.equal(c.lluviaPower, completo.lluvia_power_mm);
  assert.equal(c.eto, completo.eto_mm);
  assert.equal(c.diasHelada, completo.dias_helada);
  assert.equal(c.diferencia, Math.round((completo.lluvia_imerg_mm - completo.lluvia_power_mm) * 10) / 10);
  assert.equal(c.diasConDato, completo.dias_con_dato);
  assert.equal(c.diasDelAnio, completo.dias_del_anio);
  // El año también puede llegar como texto (valor de un <select>).
  assert.deepEqual(climaDelAnio(LLENO, ZONA_A, String(completo.anio)), c);
});

test("climaDelAnio: un año sin total queda en null (no en cero) y la diferencia no se calcula", () => {
  const sinPower = aniosDe(ZONA_A).find((a) => a.lluvia_power_mm == null && a.lluvia_imerg_mm != null);
  const c = climaDelAnio(LLENO, ZONA_A, sinPower.anio);
  assert.equal(c.lluviaPower, null);
  assert.equal(c.eto, null);
  assert.equal(c.diasHelada, null);
  assert.equal(c.diferencia, null);
  assert.equal(c.lluviaImerg, sinPower.lluvia_imerg_mm);
  assert.equal(c.diasConDato, sinPower.dias_con_dato, "los días con dato son los reales");
  assert.ok(c.diasConDato < c.diasDelAnio);
});

test("climaDelAnio: null si el año o la zona no están, o no hay bloque", () => {
  assert.equal(climaDelAnio(LLENO, ZONA_A, 1800), null);
  assert.equal(climaDelAnio(LLENO, "zona_inventada", aniosDe(ZONA_A)[0].anio), null);
  assert.equal(climaDelAnio({ clima_anual: null }, ZONA_A, 2025), null);
  assert.equal(climaDelAnio(null, ZONA_A, 2025), null);
});

test("diferenciaLluvia: a un decimal y null si falta una fuente", () => {
  assert.equal(diferenciaLluvia(264.7, 271.8), -7.1);
  assert.equal(diferenciaLluvia(364, 234.8), 129.2);
  assert.equal(diferenciaLluvia(100, 100), 0);
  assert.equal(diferenciaLluvia(null, 271.8), null);
  assert.equal(diferenciaLluvia(264.7, undefined), null);
});

test("anioPorOmision: el último año con algún total (el año recién empezado no cuenta)", () => {
  const conDato = aniosDe(ZONA_A).filter((a) => a.eto_mm != null || a.lluvia_power_mm != null || a.lluvia_imerg_mm != null);
  assert.equal(anioPorOmision(LLENO, ZONA_A), conDato.at(-1).anio);
  assert.ok(aniosDe(ZONA_A).at(-1).anio > conDato.at(-1).anio, "la fixture termina con un año sin totales");
  assert.equal(anioPorOmision(LLENO, "zona_inventada"), null);
});

test("graficasDeClima: lluvia (dos fuentes), ETo y heladas, alineadas por año y sin ceros inventados", () => {
  const graficas = graficasDeClima(LLENO, ZONA_A);
  assert.deepEqual(graficas.map((g) => g.id), ["clima-lluvia", "clima-eto", "clima-heladas"]);
  const [lluvia, eto, heladas] = graficas;
  assert.deepEqual(lluvia.series.map((s) => [s.nombre, s.ranura]), [["GPM IMERG", "a"], ["NASA POWER", "b"]]);
  for (const g of graficas) {
    assert.equal(g.porAnio, true);
    assert.equal(g.desdeCero, true, "los totales se dibujan desde cero");
    for (const s of g.series) {
      assert.equal(s.valores.length, g.x.length);
      assert.equal(s.detalles.length, g.x.length);
      s.valores.forEach((v, i) => assert.equal(v == null, s.detalles[i] != null, "un hueco siempre dice por qué"));
    }
    // Se recortan los extremos sin ningún valor: el año recién empezado no alarga el eje.
    assert.ok(g.series.some((s) => s.valores[0] != null) && g.series.some((s) => s.valores.at(-1) != null));
  }
  const porAnio = new Map(aniosDe(ZONA_A).map((a) => [a.anio, a]));
  lluvia.x.forEach((p, i) => {
    assert.equal(lluvia.series[0].valores[i], porAnio.get(p.clave).lluvia_imerg_mm);
    assert.equal(lluvia.series[1].valores[i], porAnio.get(p.clave).lluvia_power_mm);
  });
  eto.x.forEach((p, i) => assert.equal(eto.series[0].valores[i], porAnio.get(p.clave).eto_mm));
  heladas.x.forEach((p, i) => assert.equal(heladas.series[0].valores[i], porAnio.get(p.clave).dias_helada));
  // El año con filas ausentes: null con sus días reales en el motivo.
  const hueco = aniosDe(ZONA_A).find((a) => a.eto_mm == null && a.dias_con_dato > 0 && lluvia.x.some((p) => p.clave === a.anio));
  const i = eto.x.findIndex((p) => p.clave === hueco.anio);
  assert.equal(eto.series[0].valores[i], null);
  assert.equal(eto.series[0].detalles[i], `incomplete year: ${hueco.dias_con_dato} of ${hueco.dias_del_anio} days with data`);
  assert.deepEqual(graficasDeClima(LLENO, "zona_inventada"), []);
  assert.deepEqual(graficasDeClima({ clima_anual: null }, ZONA_A), []);
});

test("puntosAnuales y valorAnual: suma para láminas y días, media para lo demás; el año parcial no se resume", () => {
  const series = seriesDeZona(LLENO, ZONA_A);
  const lluvia = series["nldas.lluvia"];
  assert.equal(lluvia.estadistica, "suma");
  for (const a of lluvia.anual) {
    const p = valorAnual(lluvia, a.anio);
    assert.equal(p.valor, a.completo ? a.suma : null);
    assert.equal(p.parcial, !a.completo && a.n_meses > 0);
    assert.equal(p.nMeses, a.n_meses);
  }
  const ndvi = series["modis.ndvi"];
  assert.equal(ndvi.estadistica, "media");
  const completo = ndvi.anual.find((a) => a.completo);
  assert.equal(valorAnual(ndvi, completo.anio).valor, completo.media);
  // GRACE trae un año con meses sin fila: parcial, sin valor (no se promedian nueve meses como si fueran doce).
  const grace = series["grace.agua_almacenada_anomalia"];
  const parcial = grace.anual.find((a) => !a.completo && a.n_meses > 0 && a.n_meses < 12 && a.media != null);
  assert.deepEqual(valorAnual(grace, parcial.anio), { anio: parcial.anio, valor: null, nMeses: parcial.n_meses, parcial: true });
  assert.equal(valorAnual(grace, 1800), null);
  assert.deepEqual(puntosAnuales(null), []);
  assert.deepEqual(puntosAnuales({}), []);
});

test("modeloTarjetas: con las entregas, cada tarjeta trae su gráfica, su resolución y su fuente", () => {
  const tarjetas = modeloTarjetas(LLENO, ZONA_A);
  assert.deepEqual(tarjetas.map((t) => t.id), LLENO.tarjetas.map((t) => t.id));
  const claves = new Set();
  for (const t of tarjetas) {
    assert.equal(t.disponible, true, t.id);
    assert.equal(t.motivo, null);
    for (const p of t.paneles) {
      assert.equal(p.disponible, true);
      assert.ok(p.grafica.x.length > 0 && p.grafica.porAnio);
      assert.equal(new Set(p.series.map((s) => s.serie.unidad)).size, 1, "un panel, una sola unidad (nunca dos ejes)");
      for (const s of p.series) {
        claves.add(s.clave);
        assert.ok(s.serie.resolucion_m > 0 && s.serie.fuente, s.clave);
        assert.equal(s.motivo, null);
      }
      for (const s of p.grafica.series) assert.equal(s.valores.length, p.grafica.x.length);
    }
  }
  assert.deepEqual([...claves].sort(), Object.keys(seriesDeZona(LLENO, ZONA_A)).sort(), "todas las series entregadas se dibujan");
  // Las ranuras siguen a la serie: en SMAP, la capa superficial es «a» y la zona de raíces «b».
  const smap = tarjetas.find((t) => t.id === "humedad_suelo").paneles[0].grafica;
  assert.deepEqual(smap.series.map((s) => s.ranura), ["a", "b"]);
  // Una suma se dibuja desde cero; una media no fuerza el cero.
  assert.equal(tarjetas.find((t) => t.id === "segundo_clima").paneles[0].grafica.desdeCero, true);
  assert.equal(tarjetas.find((t) => t.id === "verdor").paneles[0].grafica.desdeCero, false);
});

test("seriesDeZona: las series de la zona más la de cuenca (GRACE), igual en las dos zonas", () => {
  const clave = "grace.agua_almacenada_anomalia";
  assert.deepEqual(Object.keys(LLENO.contexto_regional[CUENCA]), [clave], "la fixture trae GRACE como serie de cuenca");
  assert.ok(!(clave in LLENO.contexto_regional[ZONA_A]) && !(clave in LLENO.contexto_regional[ZONA_B]));
  const a = seriesDeZona(LLENO, ZONA_A);
  const b = seriesDeZona(LLENO, ZONA_B);
  assert.equal(a[clave], LLENO.contexto_regional[CUENCA][clave]);
  assert.equal(b[clave], a[clave], "la misma serie en las dos zonas");
  assert.equal(a[clave].ambito, "cuenca");
  assert.notEqual(a["smap.humedad_superficial"], b["smap.humedad_superficial"], "las demás series son de cada zona");
  assert.equal(a["smap.humedad_superficial"].ambito, "zona");
  assert.equal(Object.keys(a).length, Object.keys(LLENO.contexto_regional[ZONA_A]).length + 1);
  // Una zona desconocida solo ve la serie de cuenca; sin bloque no hay nada.
  assert.deepEqual(Object.keys(seriesDeZona(LLENO, "zona_inventada")), [clave]);
  assert.deepEqual(seriesDeZona(SIN_ENTREGAS, ZONA_A), {});
  assert.deepEqual(seriesDeZona(null, ZONA_A), {});
  // La tarjeta de GRACE se dibuja en las dos zonas con la misma gráfica.
  const [ga, gb] = [ZONA_A, ZONA_B].map((z) => modeloTarjetas(LLENO, z).find((t) => t.id === "agua_almacenada").paneles[0].grafica);
  assert.deepEqual(ga.series[0].valores, gb.series[0].valores);
});

test("modeloTarjetas: sin entrega, la tarjeta existe con el motivo del JSON y sin gráfica", () => {
  const tarjetas = modeloTarjetas(SIN_ENTREGAS, ZONA_A);
  assert.equal(tarjetas.length, LLENO.tarjetas.length, "las tarjetas existen aunque no haya dato");
  for (const t of tarjetas) {
    for (const p of t.paneles) {
      assert.equal(p.disponible, false);
      assert.equal(p.grafica, null, "sin gráfica vacía");
      assert.equal(p.motivo, MOTIVO);
      assert.ok(p.series.every((s) => s.serie === null && s.motivo === MOTIVO));
    }
    // La de evapotranspiración sí dibuja et_contraste, que ya está entregado.
    assert.equal(t.disponible, t.id === "evapotranspiracion", t.id);
    assert.equal(t.motivo, MOTIVO);
  }
  // Si el archivo llegó sin una fuente, el motivo es el de ese recurso.
  const sinGrace = structuredClone(LLENO);
  delete sinGrace.contexto_regional[CUENCA];
  sinGrace.recursos = sinGrace.recursos.map((r) => (r.id === "grace" ? { ...r, estado: "requested", motivo: "DE PRUEBA: sin filas" } : r));
  const grace = modeloTarjetas(sinGrace, ZONA_A).find((t) => t.id === "agua_almacenada");
  assert.equal(grace.disponible, false);
  assert.equal(grace.motivo, "DE PRUEBA: sin filas");
  // Sin tarjetas en el JSON no hay nada que dibujar (y no falla).
  assert.deepEqual(modeloTarjetas({}, ZONA_A), []);
  assert.deepEqual(modeloTarjetas(null, ZONA_A), []);
});

test("modeloContraste: et_contraste junto a MODIS y GLDAS; lo que no trae datos no se dibuja y se dice", () => {
  const tarjeta = LLENO.tarjetas.find((t) => t.contraste);
  const lleno = modeloContraste(LLENO, ZONA_A, tarjeta);
  assert.deepEqual(lleno.x.map((p) => p.clave), LLENO.et_contraste.meses);
  assert.equal(lleno.porAnio, false);
  assert.equal(lleno.unidad, tarjeta.contraste.unidad_en);
  assert.deepEqual(lleno.sinDato, ["WaPOR"], "la columna vacía de WaPOR se nombra, no se dibuja en cero");
  // Las ranuras no se recorren al faltar una serie: el color sigue a la serie.
  const ranuras = Object.fromEntries(lleno.series.map((s) => [s.nombre, s.ranura]));
  assert.deepEqual(ranuras, {
    [tarjeta.contraste.columnas.et_modelo_mm]: "a",
    [tarjeta.contraste.columnas.et_ssebop_mm]: "b",
    MODIS: "d",
    "GLDAS (model)": "e",
  });
  assert.deepEqual(lleno.series[0].valores, LLENO.et_contraste.columnas.et_modelo_mm);
  // MODIS regional de los mismos meses, tal como viene en contexto_regional.
  const modis = seriesDeZona(LLENO, ZONA_A)["modis.et"];
  const porMes = new Map(modis.meses.map((m, i) => [m, modis.valores[i]]));
  assert.deepEqual(lleno.series.find((s) => s.nombre === "MODIS").valores, LLENO.et_contraste.meses.map((m) => porMes.get(m) ?? null));
  // Hoy: sin series regionales, solo las dos columnas entregadas.
  const hoy = modeloContraste(SIN_ENTREGAS, ZONA_A, tarjeta);
  assert.equal(hoy.series.length, 2);
  assert.deepEqual(hoy.sinDato, ["WaPOR", "MODIS", "GLDAS (model)"]);
  assert.equal(hoy.fuente, LLENO.et_contraste.fuente);
  assert.equal(modeloContraste({ ...LLENO, et_contraste: null }, ZONA_A, tarjeta), null);
  assert.equal(modeloContraste(LLENO, ZONA_A, { id: "x" }), null);
});

test("escalaY: marcas redondas, cero incluido si se pide y null sin valores", () => {
  const e = escalaY([264.7, 364, 120.5], true);
  assert.equal(e.min, 0);
  assert.ok(e.max >= 364);
  assert.ok(e.marcas.includes(0) && e.marcas.at(-1) === e.max);
  assert.ok(e.marcas.every((m, i) => i === 0 || Math.abs(m - e.marcas[i - 1] - e.paso) < 1e-9), "marcas a paso fijo");
  const chica = escalaY([0.141, 0.201], false);
  assert.ok(chica.min <= 0.141 && chica.max >= 0.201 && chica.min > 0, "sin forzar el cero en una media");
  assert.ok(chica.decimales >= 2);
  const negativa = escalaY([-6.2, -4.4], false);
  assert.ok(negativa.min <= -6.2 && negativa.max >= -4.4);
  const plana = escalaY([5, 5, 5], false);
  assert.ok(plana.min < 5 && plana.max > 5, "valores iguales: se abre un margen");
  // Todo en cero con eje desde cero (p. ej., ningún día con helada): el eje no baja de cero.
  const ceros = escalaY([0, 0], true);
  assert.equal(ceros.min, 0);
  assert.ok(ceros.max > 0 && ceros.marcas.every((m) => m >= 0));
  assert.equal(escalaY([], true), null);
  assert.equal(escalaY([null, undefined, NaN], true), null);
});

test("formatoResolucion: kilómetros desde mil metros, metros si es menor, null si no hay", () => {
  assert.equal(formatoResolucion(9000), "9 km");
  assert.equal(formatoResolucion(27830), "27.8 km");
  assert.equal(formatoResolucion(300000), "300 km");
  assert.equal(formatoResolucion(1000), "1 km");
  assert.equal(formatoResolucion(500), "500 m");
  assert.equal(formatoResolucion(30), "30 m");
  for (const v of [null, undefined, 0, -5, "abc"]) assert.equal(formatoResolucion(v), null, String(v));
  // Las resoluciones de la fixture se formatean sin «undefined» ni «NaN».
  for (const serie of Object.values(seriesDeZona(LLENO, ZONA_A))) assert.match(formatoResolucion(serie.resolucion_m), /^[\d.,]+ (km|m)$/);
});

test("formatoNumero y etiquetaMes", () => {
  assert.equal(formatoNumero(2039.4), "2,039.4");
  assert.equal(formatoNumero(364), "364");
  assert.equal(formatoNumero(6.25), "6.25");
  assert.equal(formatoNumero(0.2134), "0.213");
  assert.equal(formatoNumero(129.2, { signo: true }), "+129.2");
  assert.equal(formatoNumero(-7.1, { signo: true }), "-7.1");
  assert.equal(formatoNumero(null), "—");
  assert.equal(formatoNumero("abc"), "—");
  assert.equal(etiquetaMes("2025-10"), "Oct 2025");
  assert.equal(etiquetaMes("2026-01"), "Jan 2026");
  assert.equal(etiquetaMes(7), "7", "un mes sin año (1–12) se deja tal cual");
  assert.equal(etiquetaMes(null), "");
});

test("ordenarRecursos y contarEstados: en uso, pedidas, no aplica; conteos calculados de la lista", () => {
  for (const [nombre, contexto] of [["fixture", LLENO], ["sin entregas", SIN_ENTREGAS], ["real", REAL]]) {
    if (!contexto) continue;
    const orden = ordenarRecursos(contexto.recursos).map((r) => r.estado);
    const peso = { in_use: 0, requested: 1, not_applicable: 2 };
    assert.ok(orden.every((e, i) => i === 0 || peso[orden[i - 1]] <= peso[e]), nombre);
    const cuenta = contarEstados(contexto.recursos);
    assert.equal(cuenta.total, contexto.recursos.length);
    assert.equal(cuenta.in_use + cuenta.requested + cuenta.not_applicable, cuenta.total, nombre);
    for (const e of Object.keys(peso)) assert.equal(cuenta[e], contexto.recursos.filter((r) => r.estado === e).length, `${nombre}: ${e}`);
  }
  // Dentro de un estado se conserva el orden del JSON, y la lista original no se toca.
  const lista = [{ id: "x", estado: "not_applicable" }, { id: "b", estado: "requested" }, { id: "a", estado: "in_use" },
    { id: "c", estado: "requested" }, { id: "raro", estado: "otro" }];
  assert.deepEqual(ordenarRecursos(lista).map((r) => r.id), ["a", "b", "c", "x", "raro"]);
  assert.equal(lista[0].id, "x");
  assert.deepEqual(contarEstados(lista), { in_use: 1, requested: 2, not_applicable: 1, total: 5 });
  assert.deepEqual(contarEstados(null), { in_use: 0, requested: 0, not_applicable: 0, total: 0 });
  assert.deepEqual(ordenarRecursos(undefined), []);
});

test("recursos de hoy (web/data/contexto.json): los tres estados y cada pedido con su motivo", { skip: !REAL && "web/data/contexto.json aún no se genera" }, () => {
  const estados = new Set(REAL.recursos.map((r) => r.estado));
  assert.ok(estados.has("in_use") && estados.has("not_applicable"));
  for (const r of REAL.recursos) {
    if (r.estado === "requested") assert.ok(r.motivo && r.entregas_presentes.length === 0, r.id);
    if (r.estado === "in_use") assert.ok(r.entregas_presentes.length > 0 && r.motivo === null, r.id);
    if (r.estado === "not_applicable") assert.ok(r.motivo && r.equivalente_local, r.id);
  }
});

test("ultimoMesConDato", () => {
  assert.deepEqual(ultimoMesConDato(["2025-01", "2025-02", "2025-03"], [1.5, 2.5, null]), { mes: "2025-02", valor: 2.5 });
  assert.deepEqual(ultimoMesConDato(["2025-01"], [0]), { mes: "2025-01", valor: 0 }, "cero es un dato");
  assert.equal(ultimoMesConDato(["2025-01", "2025-02"], [null, null]), null);
  assert.equal(ultimoMesConDato(["2025-01"], undefined), null);
  assert.equal(ultimoMesConDato(undefined, undefined), null);
});

test("evidenciaDeParcela: altura del dosel de GEDI y ET de ECOSTRESS del último mes con dato", () => {
  const [conDato] = Object.entries(LLENO.gedi.parcelas).filter(([, p]) => p.n_disparos > 1);
  const [id, p] = conDato;
  const filas = evidenciaDeParcela({ contexto: LLENO, id });
  assert.deepEqual(filas.map((f) => f.etiqueta), ["Canopy height (GEDI)", "Evapotranspiration (ECOSTRESS)"]);
  assert.equal(filas[0].texto, `median ${p.altura_mediana_m} m from ${p.n_disparos} shots; top decile above ${p.altura_p90_m} m`);
  assert.equal(filas[0].fuente, LLENO.gedi.fuente);
  const ultimo = ultimoMesConDato(LLENO.ecostress.meses, LLENO.ecostress.parcelas[id]);
  assert.equal(filas[1].texto, `${formatoNumero(ultimo.valor)} mm/day, median of the clear scenes of ${etiquetaMes(ultimo.mes)}`);
  assert.equal(filas[1].fuente, LLENO.ecostress.fuente);
  // Un solo disparo: singular.
  const [unoId, uno] = Object.entries(LLENO.gedi.parcelas).find(([, q]) => q.n_disparos === 1);
  assert.ok(evidenciaDeParcela({ contexto: LLENO, id: unoId })[0].texto.startsWith(`median ${uno.altura_mediana_m} m from 1 shot;`));
});

test("evidenciaDeParcela: sin dato se dice (no es cero) y sin bloques devuelve []", () => {
  // Parcela del archivo sin disparos: no está en gedi.parcelas.
  const sinDisparos = Object.keys(LLENO.ecostress.parcelas).find((id) => !(id in LLENO.gedi.parcelas));
  const filas = evidenciaDeParcela({ contexto: LLENO, id: sinDisparos });
  assert.equal(filas[0].texto, "GEDI: no shots inside this field");
  assert.equal(filas[0].fuente, LLENO.gedi.fuente);
  // Parcela con sus últimos meses sin escena: se usa el último mes que sí tiene dato.
  const [idHueco, valores] = Object.entries(LLENO.ecostress.parcelas).find(([, v]) => v.at(-1) === null && v.some((x) => x != null));
  const ultimo = ultimoMesConDato(LLENO.ecostress.meses, valores);
  assert.notEqual(ultimo.mes, LLENO.ecostress.meses.at(-1));
  assert.ok(evidenciaDeParcela({ contexto: LLENO, id: idHueco })[1].texto.endsWith(etiquetaMes(ultimo.mes)));
  // Parcela sin ninguna escena, y parcela que ni siquiera viene en los archivos.
  const sinEscenas = Object.entries(LLENO.ecostress.parcelas).find(([, v]) => v.every((x) => x === null))[0];
  assert.equal(evidenciaDeParcela({ contexto: LLENO, id: sinEscenas })[1].texto, "ECOSTRESS: no clear scene over this field");
  assert.deepEqual(evidenciaDeParcela({ contexto: LLENO, id: "NO_EXISTE" }).map((f) => f.texto),
    ["GEDI: no shots inside this field", "ECOSTRESS: no clear scene over this field"]);
  // Bloques en null (hoy): nada que decir en la ficha.
  assert.deepEqual(evidenciaDeParcela({ contexto: SIN_ENTREGAS, id: sinDisparos }), []);
  assert.deepEqual(evidenciaDeParcela({ contexto: null, id: sinDisparos }), []);
  assert.deepEqual(evidenciaDeParcela(), []);
  // Solo uno de los dos bloques: un renglón.
  assert.equal(evidenciaDeParcela({ contexto: { ...SIN_ENTREGAS, gedi: LLENO.gedi }, id: sinDisparos }).length, 1);
  if (REAL) assert.equal(evidenciaDeParcela({ contexto: REAL, id: "P0001" }).length, (REAL.gedi ? 1 : 0) + (REAL.ecostress ? 1 : 0));
});

test("mesDia: acepta «MM-DD», «AAAA-MM-DD», Date, [mes, día] y { mes, dia }", () => {
  assert.deepEqual(mesDia("03-10"), { mes: 3, dia: 10 });
  assert.deepEqual(mesDia("2026-03-10"), { mes: 3, dia: 10 });
  assert.deepEqual(mesDia([3, 10]), { mes: 3, dia: 10 });
  assert.deepEqual(mesDia({ mes: 3, dia: 10 }), { mes: 3, dia: 10 });
  assert.deepEqual(mesDia(new Date(2026, 2, 10)), { mes: 3, dia: 10 });
  assert.deepEqual(mesDia("02-29"), { mes: 2, dia: 29 }, "el 29 de febrero es una fecha (como en el validador)");
  for (const v of ["04-31", "02-30", "13-01", "marzo", "", null, undefined, [3], { mes: 3 }, new Date("x"), 310]) assert.equal(mesDia(v), null, String(v));
});

test("riesgoDeHelada: la fecha calculada más cercana anterior o igual; fuera de la ventana, null", () => {
  const tabla = LLENO.heladas.prob_helada_despues_de;
  const fechas = Object.keys(tabla).sort();
  const [primera, segunda] = fechas;
  const ultima = fechas.at(-1);
  // Fecha exacta.
  assert.deepEqual(riesgoDeHelada({ contexto: LLENO, fechaSiembra: segunda }), { prob: tabla[segunda], fuente: LLENO.heladas.fuente, fecha: segunda });
  // Entre dos fechas: la anterior. (Un día después de la primera.)
  const [m, d] = primera.split("-").map(Number);
  assert.deepEqual(riesgoDeHelada({ contexto: LLENO, fechaSiembra: [m, d + 1] }), { prob: tabla[primera], fuente: LLENO.heladas.fuente, fecha: primera });
  // Un día antes de la segunda sigue siendo la primera.
  const [m2, d2] = segunda.split("-").map(Number);
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: { mes: m2, dia: d2 - 1 } }).fecha, primera);
  // Con año y con Date.
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: `2026-${segunda}` }).prob, tabla[segunda]);
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: new Date(2026, m2 - 1, d2) }).prob, tabla[segunda]);
  // Antes de la ventana calculada: no se extrapola.
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: "01-15" }), null);
  // Poco después de la última fecha (dentro del paso): la última. Mucho después (siembra de otoño): null.
  const [mu, du] = ultima.split("-").map(Number);
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: [mu, du + 2] }).fecha, ultima);
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: "10-15" }), null, "A2 no calculó nada para siembras de otoño");
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: [mu, du + 7] }), null, "a un paso completo de la última fecha ya no aplica");
  // Entre dos fechas calculadas siempre vale la anterior, también en la semana del 29 de febrero.
  const antesDeMarzo = fechas.filter((f) => f < "03-01").at(-1);
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: "02-29" }).fecha, antesDeMarzo);
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: "02-28" }).fecha, antesDeMarzo);
});

test("riesgoDeHelada: una zona con bloque propio en heladas.zonas usa su tabla; las demás, la base", () => {
  // Forma de la entrega real: la zona base arriba y las demás en «zonas» (valores DE PRUEBA).
  const contexto = { heladas: {
    prob_helada_despues_de: { "03-01": 0.4, "03-08": 0.2 }, fuente: "DE PRUEBA base",
    zonas: { otra_zona: { prob_helada_despues_de: { "03-01": 0.6, "03-08": 0.3 } } },
  } };
  assert.equal(riesgoDeHelada({ contexto, fechaSiembra: "03-02" }).prob, 0.4);
  assert.equal(riesgoDeHelada({ contexto, fechaSiembra: "03-02", zonaId: "zona_base" }).prob, 0.4);
  assert.deepEqual(riesgoDeHelada({ contexto, fechaSiembra: "03-09", zonaId: "otra_zona" }), { prob: 0.3, fuente: "DE PRUEBA base", fecha: "03-08" });
  if (REAL && REAL.heladas) {
    const tabla = REAL.heladas.prob_helada_despues_de;
    const fecha = Object.keys(tabla).sort()[1];
    assert.equal(riesgoDeHelada({ contexto: REAL, fechaSiembra: fecha }).prob, tabla[fecha]);
    for (const [zona, bloque] of Object.entries(REAL.heladas.zonas || {})) {
      assert.equal(riesgoDeHelada({ contexto: REAL, fechaSiembra: fecha, zonaId: zona }).prob, bloque.prob_helada_despues_de[fecha], zona);
    }
  }
});

test("riesgoDeHelada: null sin bloque, sin fecha válida o con una tabla vacía", () => {
  assert.equal(riesgoDeHelada({ contexto: SIN_ENTREGAS, fechaSiembra: "03-10" }), null);
  assert.equal(riesgoDeHelada({ contexto: null, fechaSiembra: "03-10" }), null);
  assert.equal(riesgoDeHelada({ contexto: LLENO, fechaSiembra: "no es fecha" }), null);
  assert.equal(riesgoDeHelada({ contexto: LLENO }), null);
  assert.equal(riesgoDeHelada(), null);
  assert.equal(riesgoDeHelada({ contexto: { heladas: { prob_helada_despues_de: {} } }, fechaSiembra: "03-10" }), null);
  // Una sola fecha calculada: solo esa fecha exacta.
  const una = { heladas: { prob_helada_despues_de: { "03-10": 0.4 }, fuente: "DE PRUEBA" } };
  assert.deepEqual(riesgoDeHelada({ contexto: una, fechaSiembra: "03-10" }), { prob: 0.4, fuente: "DE PRUEBA", fecha: "03-10" });
  assert.equal(riesgoDeHelada({ contexto: una, fechaSiembra: "03-11" }), null);
  if (REAL && !REAL.heladas) assert.equal(riesgoDeHelada({ contexto: REAL, fechaSiembra: "03-10" }), null);
});

test("cargarContexto: null si el archivo no existe; otros fallos se propagan", async () => {
  const fetchOriginal = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ status: 404, ok: false });
    assert.equal(await cargarContexto("data/contexto.json"), null);
    globalThis.fetch = async () => ({ status: 200, ok: true, json: async () => ({ recursos: [] }) });
    assert.deepEqual(await cargarContexto("data/contexto.json"), { recursos: [] });
    globalThis.fetch = async () => ({ status: 500, ok: false });
    await assert.rejects(() => cargarContexto("data/contexto.json"), /HTTP 500/);
  } finally {
    globalThis.fetch = fetchOriginal;
  }
});

test("el módulo se importa sin navegador y las funciones «montar…» no hacen nada sin document", () => {
  assert.equal(montarContextoRegional(null, { contexto: LLENO, zonaId: ZONA_A }), null);
  assert.equal(montarContextoRegional({}, { contexto: LLENO, zonaId: ZONA_A }), null, "sin document: null");
  assert.equal(montarRecursosReto({}, { contexto: LLENO }), null);
  assert.equal(NOTA_REGIONAL,
    "Regional series describe the area or the basin, not a single field. They do not forecast the dam and do not change the water light.");
  assert.ok(ZONA_B, "la fixture trae dos zonas");
});
