// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Funciones puras de web/js/contexto.js (bases de datos del reto;
// docs/decisiones/2026-11-14_recursos_del_reto.md): las MISMAS que usa la página.
// - clima del año: valores del año elegido, diferencia IMERG − POWER, año por omisión y modelos de las gráficas;
// - series regionales: resumen anual (suma o media), años parciales, tarjetas con y sin entrega;
// - et_contraste: se dibuja solo en su zona piloto; en otra zona se dice y no se cruzan dos áreas;
// - malla de cada serie: un panel con series de mallas distintas escribe un renglón por serie (ninguna
//   hereda la resolución de otra);
// - fuentes: cada tarjeta cita en corto y el texto completo de cada fuente va una sola vez por sección;
// - formato: resolución (m → km), números, meses; eje vertical;
// - recursos del reto: orden y conteos por estado;
// - evidencia por parcela (GEDI y ECOSTRESS) con y sin dato; la lectura de GEDI no se presenta como
//   altura del cultivo: lleva su nota, los criterios de la sesión de datos (piso del instrumento y
//   umbral de dosel alto, de contexto.json) y, sin ellos, la referencia de la entrega;
// - riesgo de helada por fecha de siembra.
// Datos: tests/fixtures/contexto_reto/contexto_lleno.json (DE PRUEBA, lo genera el motor con datos de
// prueba) y, si existe, web/data/contexto.json (lo real de hoy). Los valores esperados se leen de ahí.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  AVISO_ECOSTRESS,
  NOTA_ECOSTRESS_SIN_CULTIVO,
  NOTA_GEDI,
  NOTA_GEDI_SIN_DISPAROS,
  NOTA_REGIONAL,
  sinCultivoEnElMes,
  textoEcostress,
  anioPorOmision,
  cargarContexto,
  citasDeTarjeta,
  climaDelAnio,
  contarEstados,
  criteriosGedi,
  cultivoDeGaez,
  diasIncompletos,
  diferenciaLluvia,
  escalaY,
  etiquetaMes,
  evidenciaDeParcela,
  formatoNumero,
  formatoResolucion,
  fuentesDeSeccion,
  graficasDeClima,
  lecturaDeGedi,
  mesDia,
  metaDePanel,
  modeloContraste,
  modeloTarjetas,
  montarContextoRegional,
  montarRecursosReto,
  notasDeGaez,
  num,
  ordenarRecursos,
  puntosAnuales,
  referenciaGedi,
  riesgoDeHelada,
  seriesDeZona,
  textoMascon,
  ultimoMesConDato,
  valorAnual,
  valorGaez,
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

// Lo que la página debe decir de la malla de una serie, armado aquí con el JSON (no con metaDePanel).
const celdasEsperadas = (serie) =>
  serie.n_celdas != null
    ? `${formatoNumero(serie.n_celdas)} grid ${serie.n_celdas === 1 ? "cell" : "cells"}`
    : `${formatoNumero(serie.n_celdas_rango[0])} to ${formatoNumero(serie.n_celdas_rango[1])} grid cells`;

function revisarMallas(contexto, zona) {
  let conVarias = 0;
  for (const t of modeloTarjetas(contexto, zona)) {
    for (const p of t.paneles) {
      const presentes = p.series.filter((s) => s.serie);
      const meta = metaDePanel(p);
      if (!presentes.length) {
        assert.deepEqual(meta, [], `${zona} · ${t.id}: sin series no hay malla que decir`);
        continue;
      }
      const mallas = new Set(presentes.map((s) => JSON.stringify([s.serie.ambito, s.serie.resolucion_m, s.serie.n_celdas, s.serie.n_celdas_rango ?? null])));
      const donde = `${zona} · ${t.id} · ${p.titulo}`;
      if (mallas.size === 1) {
        assert.equal(meta.length, 1, `${donde}: una malla, un renglón`);
        assert.equal(meta[0].etiqueta, null, donde);
      } else {
        conVarias += 1;
        assert.deepEqual(meta.map((r) => r.etiqueta), presentes.map((s) => s.etiqueta), `${donde}: un renglón por serie, con su nombre`);
      }
      // Cada serie presente encuentra SU resolución y SUS celdas en su renglón (el único, o el de su nombre).
      for (const s of presentes) {
        const renglon = meta.length === 1 ? meta[0] : meta.find((r) => r.etiqueta === s.etiqueta);
        assert.ok(renglon.texto.includes(`${formatoResolucion(s.serie.resolucion_m)} grid`), `${donde} · ${s.etiqueta}: ${renglon.texto}`);
        assert.ok(renglon.texto.includes(celdasEsperadas(s.serie)), `${donde} · ${s.etiqueta}: ${renglon.texto}`);
        assert.ok(renglon.texto.startsWith(s.serie.ambito === CUENCA ? "Basin scale, " : "Regional, "), donde);
        assert.equal(renglon.texto, renglon.partes.join(" · "));
      }
    }
  }
  return conVarias;
}

test("metaDePanel: cada serie con su resolución; mallas distintas en un panel, un renglón por serie", () => {
  for (const zona of [ZONA_A, ZONA_B]) assert.ok(revisarMallas(LLENO, zona) >= 1, "la fixture trae un panel con dos mallas");
  // El caso del hallazgo: «MODIS and GLDAS» no atribuye a GLDAS la resolución de MODIS.
  const panel = modeloTarjetas(LLENO, ZONA_A).find((t) => t.id === "evapotranspiracion").paneles[0];
  const [modis, gldas] = panel.series.map((s) => s.serie);
  assert.notEqual(modis.resolucion_m, gldas.resolucion_m, "la fixture trae MODIS y GLDAS con mallas distintas");
  const meta = metaDePanel(panel);
  assert.deepEqual(meta.map((r) => r.etiqueta), panel.series.map((s) => s.etiqueta));
  assert.ok(meta[0].texto.includes(formatoResolucion(modis.resolucion_m)) && !meta[0].texto.includes(formatoResolucion(gldas.resolucion_m)));
  assert.ok(meta[1].texto.includes(formatoResolucion(gldas.resolucion_m)) && !meta[1].texto.includes(formatoResolucion(modis.resolucion_m)));
  // Dos series con la misma malla (SMAP: capa superficial y zona de raíces): un renglón sin nombre.
  const smap = modeloTarjetas(LLENO, ZONA_A).find((t) => t.id === "humedad_suelo").paneles[0];
  assert.equal(smap.series.length, 2);
  assert.deepEqual(metaDePanel(smap).map((r) => r.etiqueta), [null]);
  // GRACE: escala de cuenca, y se dice que es una serie para toda la cuenca.
  const grace = metaDePanel(modeloTarjetas(LLENO, ZONA_B).find((t) => t.id === "agua_almacenada").paneles[0]);
  assert.equal(grace.length, 1);
  assert.ok(grace[0].partes.includes("One series for the whole basin, the same in every pilot area"));
  // Si falta una de las dos series, queda el renglón de la que sí está (sin nombre: no hay con quién confundirla).
  const sinGldas = { ...panel, series: panel.series.map((s, i) => (i === 1 ? { ...s, serie: null } : s)) };
  assert.deepEqual(metaDePanel(sinGldas).map((r) => [r.etiqueta, r.texto]), [[null, meta[0].texto]]);
  // Una serie que no dice su malla junto a otra que sí: se dice, no se le presta la de la otra.
  const sinMalla = { ...panel, series: panel.series.map((s, i) => (i === 1 ? { ...s, serie: { ...s.serie, resolucion_m: null, n_celdas: null } } : s)) };
  assert.deepEqual(metaDePanel(sinMalla).map((r) => [r.etiqueta, r.texto]), [[panel.series[0].etiqueta, meta[0].texto], [panel.series[1].etiqueta, "grid not stated in the delivery"]]);
  // Sin entregas, sin series o sin panel: nada que escribir.
  for (const t of modeloTarjetas(SIN_ENTREGAS, ZONA_A)) for (const p of t.paneles) assert.deepEqual(metaDePanel(p), []);
  assert.deepEqual(metaDePanel({ series: [] }), []);
  assert.deepEqual(metaDePanel(null), []);
  assert.deepEqual(metaDePanel(), []);
});

test("mallas de hoy (web/data/contexto.json): MODIS y GLDAS, cada una con su resolución en la tarjeta de ET", { skip: !(REAL && REAL.contexto_regional) && "sin contexto_regional en web/data/contexto.json" }, () => {
  for (const zona of Object.keys(REAL.zonas)) {
    revisarMallas(REAL, zona);
    const panel = modeloTarjetas(REAL, zona).find((t) => t.id === "evapotranspiracion").paneles[0];
    const presentes = panel.series.filter((s) => s.serie);
    const resoluciones = new Set(presentes.map((s) => s.serie.resolucion_m));
    if (resoluciones.size <= 1) continue; // llegó una sola de las dos, o comparten malla
    const meta = metaDePanel(panel);
    assert.deepEqual(meta.map((r) => r.etiqueta), presentes.map((s) => s.etiqueta), zona);
    presentes.forEach((s, i) => {
      assert.ok(meta[i].texto.includes(`${formatoResolucion(s.serie.resolucion_m)} grid`), `${zona} · ${s.etiqueta}: ${meta[i].texto}`);
      assert.ok(meta[i].texto.includes(celdasEsperadas(s.serie)), `${zona} · ${s.etiqueta}: ${meta[i].texto}`);
      const ajenas = presentes.filter((o) => o.serie.resolucion_m !== s.serie.resolucion_m).map((o) => formatoResolucion(o.serie.resolucion_m));
      assert.ok(ajenas.every((r) => !meta[i].texto.includes(`${r} grid`)), `${zona} · ${s.etiqueta} no lleva la resolución de otra serie: ${meta[i].texto}`);
    });
  }
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
  // En su zona: se dibuja, y dice de qué zona, recurso y archivo es.
  assert.equal(LLENO.et_contraste.zona, ZONA_A, "la fixture trae el contraste de la zona por omisión");
  assert.equal(lleno.disponible, true);
  assert.equal(lleno.zona, ZONA_A);
  assert.equal(lleno.recurso, tarjeta.contraste.recurso);
  assert.equal(lleno.archivo, LLENO.et_contraste.archivo);
});

test("modeloContraste: en otra zona piloto no se dibuja ni se cruza con sus series regionales", () => {
  const tarjeta = LLENO.tarjetas.find((t) => t.contraste);
  // La otra zona SÍ tiene MODIS y GLDAS: antes se dibujaban sobre el contraste de un área distinta.
  const deB = seriesDeZona(LLENO, ZONA_B);
  assert.ok(deB["modis.et"] && deB["gldas.et"]);
  const otra = modeloContraste(LLENO, ZONA_B, tarjeta);
  assert.equal(otra.disponible, false);
  assert.equal(otra.zona, ZONA_A);
  assert.equal(otra.zonaNombre, LLENO.zonas[ZONA_A].nombre);
  assert.equal(otra.motivo, LLENO.et_contraste.motivo_otras_zonas);
  assert.equal(otra.titulo, tarjeta.contraste.titulo);
  for (const llave of ["series", "x", "sinDato", "fuente", "nota"]) assert.equal(llave in otra, false, `sin «${llave}»: no hay nada que dibujar`);
  // Una zona que el JSON no conoce tampoco recibe el contraste de otra.
  assert.equal(modeloContraste(LLENO, "zona_inventada", tarjeta).disponible, false);
  assert.equal(modeloContraste(LLENO, null, tarjeta).disponible, false);
  // Sin el motivo en el JSON, el texto fijo de respaldo (no vacío, sin cifras).
  const sinMotivo = modeloContraste({ ...LLENO, et_contraste: { ...LLENO.et_contraste, motivo_otras_zonas: null } }, ZONA_B, tarjeta);
  assert.ok(sinMotivo.motivo && !/\d/.test(sinMotivo.motivo));
  // Si el contraste fuera de la otra zona, se dibuja allá con SUS series regionales y aquí no.
  const mudado = { ...LLENO, et_contraste: { ...LLENO.et_contraste, zona: ZONA_B } };
  const enB = modeloContraste(mudado, ZONA_B, tarjeta);
  const porMes = new Map(deB["modis.et"].meses.map((m, i) => [m, deB["modis.et"].valores[i]]));
  assert.deepEqual(enB.series.find((s) => s.nombre === "MODIS").valores, LLENO.et_contraste.meses.map((m) => porMes.get(m) ?? null));
  assert.equal(modeloContraste(mudado, ZONA_A, tarjeta).disponible, false);
});

test("modeloContraste: si el JSON no dice de qué zona es, van sus columnas solas (sin series regionales)", () => {
  const tarjeta = LLENO.tarjetas.find((t) => t.contraste);
  const { zona: _zona, ...sinZona } = LLENO.et_contraste;
  for (const zona of [ZONA_A, ZONA_B]) {
    const m = modeloContraste({ ...LLENO, et_contraste: sinZona }, zona, tarjeta);
    assert.equal(m.disponible, true);
    assert.equal(m.zona, null);
    assert.deepEqual(m.series.map((s) => s.nombre), [tarjeta.contraste.columnas.et_modelo_mm, tarjeta.contraste.columnas.et_ssebop_mm]);
    assert.deepEqual(m.sinDato, ["WaPOR"], "las series regionales ni se dibujan ni se anuncian como faltantes");
  }
});

test("modeloTarjetas: la tarjeta de evapotranspiración en la zona sin contraste conserva su panel anual", () => {
  const et = (contexto, zona) => modeloTarjetas(contexto, zona).find((t) => t.id === "evapotranspiracion");
  const enA = et(LLENO, ZONA_A);
  const enB = et(LLENO, ZONA_B);
  assert.equal(enA.contraste.disponible, true);
  assert.equal(enB.contraste.disponible, false);
  assert.equal(enB.disponible, true, "MODIS y GLDAS anuales de la propia zona sí se dibujan");
  assert.equal(enB.paneles[0].disponible, true);
  // Sin series regionales y sin contraste para esta zona, la tarjeta queda pendiente (no «disponible»).
  const pendiente = et(SIN_ENTREGAS, ZONA_B);
  assert.equal(pendiente.disponible, false);
  assert.equal(pendiente.contraste.disponible, false);
  assert.equal(et(SIN_ENTREGAS, ZONA_A).disponible, true, "en su zona, el contraste entregado sí se dibuja");
  // Las fuentes de la tarjeta: el recurso del contraste se cita solo donde el contraste se dibuja.
  const ssebop = LLENO.recursos.find((r) => r.id === LLENO.tarjetas.find((t) => t.contraste).contraste.recurso).nombre;
  assert.ok(citasDeTarjeta(LLENO, enA).some((x) => x.recurso === ssebop && x.archivo === LLENO.et_contraste.archivo));
  assert.ok(!citasDeTarjeta(LLENO, enB).some((x) => x.recurso === ssebop));
  assert.ok(!fuentesDeSeccion(LLENO, ZONA_B).some((f) => f.archivo === LLENO.et_contraste.archivo));
});

test("contraste de hoy (web/data/contexto.json): se dibuja solo en su zona", { skip: !(REAL && REAL.et_contraste) && "sin et_contraste en web/data/contexto.json" }, () => {
  const tarjeta = REAL.tarjetas.find((t) => t.contraste);
  assert.ok(REAL.et_contraste.zona in REAL.zonas, "el motor dice de qué zona piloto es el contraste");
  for (const zona of Object.keys(REAL.zonas)) {
    const m = modeloContraste(REAL, zona, tarjeta);
    assert.equal(m.disponible, zona === REAL.et_contraste.zona, zona);
    if (!m.disponible) assert.ok(m.motivo && m.zonaNombre === REAL.zonas[REAL.et_contraste.zona].nombre);
  }
});

test("citasDeTarjeta y fuentesDeSeccion: cita corta por tarjeta y cada texto de fuente una sola vez", () => {
  const tarjetas = modeloTarjetas(LLENO, ZONA_A);
  const nombreDe = (id) => LLENO.recursos.find((r) => r.id === id).nombre;
  // Cita corta: el nombre del recurso (no el texto largo de la entrega) y la fecha del archivo.
  const suelo = citasDeTarjeta(LLENO, tarjetas.find((t) => t.id === "humedad_suelo"));
  assert.deepEqual(suelo.map((x) => x.recurso), [nombreDe("smap"), nombreDe("gldas")], "una cita por recurso, sin repetir");
  for (const x of suelo) {
    assert.equal(x.archivo, "contexto_regional.csv");
    assert.equal(x.fecha, LLENO.contexto_regional[ZONA_A]["smap.humedad_raiz"].fecha);
  }
  // La fuente de contexto_regional.csv es una sola línea larga compartida por todas sus series.
  const larga = LLENO.contexto_regional[ZONA_A]["smap.humedad_raiz"].fuente;
  const todas = tarjetas.flatMap((t) => citasDeTarjeta(LLENO, t));
  assert.ok(todas.filter((x) => x.fuente === larga).length > LLENO.tarjetas.length, "muchas citas comparten el mismo texto");
  assert.ok(larga.length > LLENO.et_contraste.fuente.length);
  // En la sección, cada texto aparece una sola vez, con los recursos que lo comparten.
  const fuentes = fuentesDeSeccion(LLENO, ZONA_A);
  assert.equal(new Set(fuentes.map((f) => f.fuente)).size, fuentes.length, "sin textos repetidos");
  assert.deepEqual(fuentes.map((f) => f.archivo).sort(), ["contexto_regional.csv", LLENO.et_contraste.archivo, LLENO.gaez.archivo].sort());
  const regional = fuentes.find((f) => f.fuente === larga);
  assert.deepEqual([...regional.recursos].sort(), LLENO.recursos.filter((r) => r.fuente_contexto).map((r) => r.nombre).sort());
  assert.equal(regional.fecha, LLENO.contexto_regional[ZONA_A]["smap.humedad_raiz"].fecha);
  assert.deepEqual(fuentes.find((f) => f.archivo === LLENO.gaez.archivo).recursos, [nombreDe("gaez")]);
  // Por omisión calcula las tarjetas de la zona; da lo mismo que pasárselas.
  assert.deepEqual(fuentesDeSeccion(LLENO, ZONA_A, tarjetas), fuentes);
  // Sin entregas regionales: queda la del contraste (en su zona) y nada más; sin contexto, nada.
  assert.deepEqual(fuentesDeSeccion(SIN_ENTREGAS, ZONA_A).map((f) => f.archivo), [LLENO.et_contraste.archivo]);
  assert.deepEqual(fuentesDeSeccion(SIN_ENTREGAS, ZONA_B), []);
  assert.deepEqual(fuentesDeSeccion(null, ZONA_A), []);
  assert.deepEqual(citasDeTarjeta(LLENO, null), []);
  // Una entrega sin línea en fuentes.json: la tarjeta la cita por su recurso; no hay texto que listar.
  const sinRegistro = structuredClone(LLENO);
  for (const serie of Object.values(sinRegistro.contexto_regional[ZONA_A])) Object.assign(serie, { fuente: null, fecha: null });
  const verdor = modeloTarjetas(sinRegistro, ZONA_A).find((t) => t.id === "verdor");
  assert.deepEqual(citasDeTarjeta(sinRegistro, verdor), [{ recurso: nombreDe("modis"), archivo: "contexto_regional.csv", fuente: null, fecha: null }]);
  assert.ok(fuentesDeSeccion(sinRegistro, ZONA_A).every((f) => f.fuente));
  // Un contraste cuyo recurso no está en el catálogo: se lista su fuente, sin atribuirla a otro recurso.
  const sinRecurso = structuredClone(LLENO);
  delete sinRecurso.tarjetas.find((t) => t.contraste).contraste.recurso;
  for (const r of sinRecurso.recursos) if (r.fuente_contexto === null) delete r.fuente_contexto;
  const et = modeloTarjetas(sinRecurso, ZONA_A).find((t) => t.id === "evapotranspiracion");
  assert.equal(citasDeTarjeta(sinRecurso, et).find((x) => x.archivo === LLENO.et_contraste.archivo).recurso, null);
  assert.deepEqual(fuentesDeSeccion(sinRecurso, ZONA_A).find((f) => f.archivo === LLENO.et_contraste.archivo).recursos, []);
});

test("fuentes de hoy (web/data/contexto.json): ningún texto de fuente repetido en la sección", { skip: !(REAL && REAL.contexto_regional) && "sin contexto_regional en web/data/contexto.json" }, () => {
  for (const zona of Object.keys(REAL.zonas)) {
    const fuentes = fuentesDeSeccion(REAL, zona);
    assert.ok(fuentes.length > 0, zona);
    assert.equal(new Set(fuentes.map((f) => f.fuente)).size, fuentes.length, zona);
    for (const f of fuentes) assert.ok(f.archivo && f.recursos.length > 0, `${zona}: ${f.archivo}`);
  }
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

test("GAEZ: la clase por su nombre, el factor de la unidad de FAO aparte y el cultivo con que GAEZ evalúa la clase", () => {
  // Filas como las de gaez_zona.csv (pieza G1): «unidad» es la cadena de FAO. Valores de prueba.
  const nombres = { alfalfa: "Alfalfa", maiz_forrajero: "Forage maize" };
  assert.equal(valorGaez({ cultivo: "alfalfa", valor: 2, unidad: "Class", clase_nombre: "High" }), "High");
  assert.equal(valorGaez({ valor: 1678.5, unidad: "10kg DW/ha" }), `${formatoNumero(1678.5)} × 10 kg DW/ha`);
  assert.equal(valorGaez({ valor: 913, unidad: "kg lint/ha" }), `${formatoNumero(913)} kg lint/ha`);
  assert.equal(valorGaez({ valor: 7778, unidad: "Index (0–10000)" }), `${formatoNumero(7778)} Index (0–10000)`);
  assert.equal(valorGaez({ valor: 2, unidad: "Class" }), `${formatoNumero(2)} Class`, "sin clase_nombre, número y unidad");
  assert.equal(valorGaez(null), "—");
  assert.deepEqual(cultivoDeGaez({ cultivo: "maiz_forrajero", cultivo_gaez: "Maize" }, nombres), { nombre: "Forage maize", gaez: "Maize" });
  assert.deepEqual(cultivoDeGaez({ cultivo: "alfalfa", cultivo_gaez: "Alfalfa" }, nombres), { nombre: "Alfalfa", gaez: null });
  assert.deepEqual(cultivoDeGaez({ cultivo: "alfalfa" }, nombres), { nombre: "Alfalfa", gaez: null });
  const nota = "nota de prueba";
  assert.deepEqual(notasDeGaez([{ unidad: "10kg DW/ha" }, { nota }, { nota }]), [nota, "DW: dry weight."]);
  assert.deepEqual(notasDeGaez([{ unidad: "kg lint/ha" }]), []);
  assert.deepEqual(notasDeGaez(null), []);
});

test("GAEZ de hoy (web/data/contexto.json): cada fila de clase trae su nombre y el maíz dice con qué cultivo lo evalúa GAEZ", { skip: !(REAL && REAL.gaez) && "sin gaez en web/data/contexto.json" }, () => {
  for (const filas of Object.values(REAL.gaez.zonas)) {
    for (const f of filas.filter((x) => x.unidad === "Class")) assert.ok(f.clase_nombre, `${f.cultivo}: clase sin nombre`);
    for (const f of filas.filter((x) => x.cultivo === "maiz_forrajero")) assert.ok(cultivoDeGaez(f).gaez, "maíz sin cultivo de GAEZ");
    if (filas.some((x) => x.cultivo === "maiz_forrajero")) assert.ok(notasDeGaez(filas).some((n) => n !== "DW: dry weight."), "falta la nota del maíz");
  }
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

const CLAVES_EVIDENCIA = ["etiqueta", "texto", "nota", "lectura", "fuente", "archivo", "fecha"];
// Lo que la ficha no debe decir de GEDI: que su lectura es la altura (medida) del dosel o del cultivo.
const COMO_ALTURA_DE_CULTIVO = /canopy height|crop height \(|height of the crop/i;
const TEXTO_DE_LECTURA = { tall_canopy: "tall canopy seen", no_tall_canopy: "no tall canopy seen", too_few_shots: "too few shots to tell" };
const medidaDeGedi = (p) => `median ${formatoNumero(p.altura_mediana_m)} m from ${formatoNumero(p.n_disparos)} ${p.n_disparos === 1 ? "shot" : "shots"}; top decile above ${formatoNumero(p.altura_p90_m)} m`;
// El criterio de dosel alto aplicado aquí al JSON (sin el módulo): la lectura que debe salir de cada parcela.
function lecturaIndependiente(gedi, id) {
  const p = gedi.parcelas[id];
  if (!p) return "no_shots";
  const k = gedi.criterios && gedi.criterios.dosel_alto;
  if (!k) return null;
  if (p.n_disparos < k.min_disparos) return "too_few_shots";
  return p.altura_p90_m >= k.umbral_m ? "tall_canopy" : "no_tall_canopy";
}
// Variantes del contexto de prueba: sin los criterios de la sesión de datos, y además sin la referencia.
const SIN_CRITERIOS = {
  ...LLENO,
  gedi: { ...LLENO.gedi, criterios: null, parcelas: Object.fromEntries(Object.entries(LLENO.gedi.parcelas).map(([id, p]) => [id, { ...p, dosel_alto: null }])) },
};
const SIN_CRITERIOS_NI_REFERENCIA = { ...SIN_CRITERIOS, gedi: { ...SIN_CRITERIOS.gedi, referencia: null } };

test("evidenciaDeParcela: lectura de GEDI con su nota y ET de ECOSTRESS del último mes con dato", () => {
  const [conDato] = Object.entries(LLENO.gedi.parcelas).filter(([, p]) => p.n_disparos > 1);
  const [id, p] = conDato;
  const filas = evidenciaDeParcela({ contexto: LLENO, id });
  assert.deepEqual(filas.map((f) => f.etiqueta), ["GEDI height reading", "Evapotranspiration (ECOSTRESS)"]);
  assert.equal(filas[0].texto, `${TEXTO_DE_LECTURA[lecturaIndependiente(LLENO.gedi, id)]}: ${medidaDeGedi(p)}`);
  assert.equal(filas[0].fuente, LLENO.gedi.fuente);
  assert.deepEqual([filas[0].archivo, filas[0].fecha], [LLENO.gedi.archivo, LLENO.gedi.fecha]);
  assert.deepEqual([filas[1].archivo, filas[1].fecha], [LLENO.ecostress.archivo, LLENO.ecostress.fecha]);
  for (const f of filas) assert.deepEqual(Object.keys(f), CLAVES_EVIDENCIA, "los dos renglones traen las mismas llaves");
  const ultimo = ultimoMesConDato(LLENO.ecostress.meses, LLENO.ecostress.parcelas[id]);
  // El valor, su mes y de cuántas escenas despejadas sale (ecostress.escenas_parcelas, alineada a los meses).
  const escenas = LLENO.ecostress.escenas_parcelas[id][LLENO.ecostress.meses.indexOf(ultimo.mes)];
  assert.ok(escenas > 1, "la parcela de la fixture trae varias escenas en su último mes");
  assert.equal(filas[1].texto, `${formatoNumero(ultimo.valor)} mm/day in ${etiquetaMes(ultimo.mes)}, from ${escenas} clear-sky scenes`);
  assert.equal(filas[1].fuente, LLENO.ecostress.fuente);
  // La nota va a la vista junto al valor: el rótulo de la propia entrega (con su resolución), no un texto fijo.
  assert.equal(filas[1].nota, `${LLENO.ecostress.aviso}.`);
  assert.match(filas[1].nota, /not a field measurement\.$/);
  assert.equal(filas[1].lectura, null, "ECOSTRESS no lleva lectura");
  // Un solo disparo: singular.
  const [unoId] = Object.entries(LLENO.gedi.parcelas).find(([, q]) => q.n_disparos === 1);
  assert.ok(evidenciaDeParcela({ contexto: LLENO, id: unoId })[0].texto.includes(" from 1 shot;"));
  // Sin el criterio de la sesión de datos, el texto es la medida sola (no se clasifica nada).
  assert.equal(evidenciaDeParcela({ contexto: SIN_CRITERIOS, id })[0].texto, medidaDeGedi(p));
  assert.equal(evidenciaDeParcela({ contexto: SIN_CRITERIOS, id })[0].lectura, null);
});

test("ECOSTRESS: escenas detrás del valor, aviso a la vista y nota de «sin cultivo» (revisión del 15-nov)", () => {
  const eco = LLENO.ecostress;
  // Una parcela cuyo último mes con dato sale de UNA escena: singular y sin la palabra «median».
  const [unaId] = Object.keys(eco.parcelas).filter((id) => {
    const u = ultimoMesConDato(eco.meses, eco.parcelas[id]);
    return u && eco.escenas_parcelas[id][eco.meses.indexOf(u.mes)] === 1;
  });
  assert.ok(unaId, "la fixture trae una parcela con una sola escena en su último mes con dato");
  const una = evidenciaDeParcela({ contexto: LLENO, id: unaId }).at(-1);
  assert.match(una.texto, / from 1 clear-sky scene$/);
  // Ningún renglón dice «median», ni compara con el modelo, ni trae un cociente o un porcentaje (I3 de la revisión).
  for (const id of Object.keys(eco.parcelas)) {
    const fila = evidenciaDeParcela({ contexto: LLENO, id, mesesCultivo: Array(12).fill(0) }).at(-1);
    assert.doesNotMatch(`${fila.texto} ${fila.nota ?? ""}`, /\b(median|model|ratio)\b|%|same days|validat/i, id);
  }
  // textoEcostress: sin el número de escenas (un contexto.json anterior), solo el valor y el mes.
  assert.equal(textoEcostress(2.5, "2026-08", null), `${formatoNumero(2.5)} mm/day in ${etiquetaMes("2026-08")}`);
  assert.equal(textoEcostress(2.5, "2026-08", 3), `${formatoNumero(2.5)} mm/day in ${etiquetaMes("2026-08")}, from 3 clear-sky scenes`);
  assert.equal(textoEcostress(2.5, "2026-08", { n: 3, conteo: "escenas", minimo: 1, maximo: 4 }), `${formatoNumero(2.5)} mm/day in ${etiquetaMes("2026-08")}, from 3 clear-sky scenes`,
    "el archivo anterior cuenta escenas: ni «overpasses» ni intervalo");
  const sinEscenas = { ...LLENO, ecostress: { ...eco, escenas_parcelas: undefined } };
  assert.doesNotMatch(evidenciaDeParcela({ contexto: sinEscenas, id: unaId }).at(-1).texto, /scene/);
  // Sin el rótulo de la entrega (ecostress.aviso null): el aviso fijo, que no lleva ninguna cifra.
  const sinAviso = { ...LLENO, ecostress: { ...eco, aviso: null } };
  assert.equal(evidenciaDeParcela({ contexto: sinAviso, id: unaId }).at(-1).nota, AVISO_ECOSTRESS);
  assert.doesNotMatch(AVISO_ECOSTRESS + NOTA_ECOSTRESS_SIN_CULTIVO, /\d/, "los textos fijos no llevan cifras");
  // Sin cultivo en el mes del valor según el calendario del modelo (meses_cultivo de la opción ACTUAL): se dice.
  const u = ultimoMesConDato(eco.meses, eco.parcelas[unaId]);
  const indice = Number(u.mes.slice(5)) - 1;
  const conCultivo = Array(12).fill(0).map((_, i) => (i === indice ? 1 : 0));
  const sinCultivo = conCultivo.map((v) => 1 - v);
  assert.equal(evidenciaDeParcela({ contexto: LLENO, id: unaId, mesesCultivo: sinCultivo }).at(-1).nota, `${eco.aviso}. ${NOTA_ECOSTRESS_SIN_CULTIVO}`);
  assert.equal(evidenciaDeParcela({ contexto: LLENO, id: unaId, mesesCultivo: conCultivo }).at(-1).nota, `${eco.aviso}.`);
  // Sin calendario (parcela no clasificada) o con un calendario que no trae los doce meses: no se dice nada.
  for (const calendario of [undefined, null, [], [0, 0, 0]]) {
    assert.equal(evidenciaDeParcela({ contexto: LLENO, id: unaId, mesesCultivo: calendario }).at(-1).nota, `${eco.aviso}.`);
  }
  assert.equal(sinCultivoEnElMes(sinCultivo, u.mes), true);
  assert.equal(sinCultivoEnElMes(conCultivo, u.mes), false);
  assert.equal(sinCultivoEnElMes(sinCultivo, "sin-mes"), false);
  // El mes NO cambia: sigue siendo el último con dato (no se elige otro mes para «mejorar» la lectura).
  assert.ok(evidenciaDeParcela({ contexto: LLENO, id: unaId, mesesCultivo: sinCultivo }).at(-1).texto.includes(etiquetaMes(u.mes)));
});

// Dos contextos pequeños DE PRUEBA con el bloque de ECOSTRESS como lo escribe el motor con cada forma del archivo:
// el anterior (n_escenas cuenta escenas; sin intervalo) y el de la entrega corregida del 15-nov (cuenta sobrevuelos y
// trae el menor y el mayor de cada mes). Los valores no son datos.
const ECO_ANTERIOR = {
  ecostress: {
    archivo: "ecostress_parcelas.csv", fuente: "prueba", fecha: "prueba", aviso: "Satellite estimate at 70 m on clear days, not a field measurement",
    meses: ["2026-01", "2026-08"], conteo: "escenas",
    parcelas: { A: [0.9, 2.11], B: [0.9, null], C: [null, 0.66] },
    escenas_parcelas: { A: [1, 2], B: [1, 0], C: [0, 3] },
  },
};
const ECO_CORREGIDO = {
  ecostress: {
    ...ECO_ANTERIOR.ecostress, conteo: "sobrevuelos",
    minimos_parcelas: { A: [0.9, 1.57], B: [0.9, null], C: [null, 0.14] },
    maximos_parcelas: { A: [0.9, 2.66], B: [0.9, null], C: [null, 1.17] },
  },
};

test("ECOSTRESS con la entrega corregida: «clear overpasses» y el intervalo con dos o más; con el archivo anterior, «scenes» y sin intervalo", () => {
  const fila = (contexto, id) => evidenciaDeParcela({ contexto, id }).at(-1).texto;
  const ago = etiquetaMes("2026-08");
  const ene = etiquetaMes("2026-01");
  // Entrega corregida: dos o más sobrevuelos, con su intervalo; uno solo, sin intervalo y en singular.
  assert.equal(fila(ECO_CORREGIDO, "A"), `${formatoNumero(2.11)} mm/day in ${ago}, from 2 clear overpasses (${formatoNumero(1.57)} to ${formatoNumero(2.66)})`);
  assert.equal(fila(ECO_CORREGIDO, "C"), `${formatoNumero(0.66)} mm/day in ${ago}, from 3 clear overpasses (${formatoNumero(0.14)} to ${formatoNumero(1.17)})`);
  assert.equal(fila(ECO_CORREGIDO, "B"), `${formatoNumero(0.9)} mm/day in ${ene}, from 1 clear overpass`, "el último mes con dato; un sobrevuelo: sin intervalo");
  // Archivo anterior: los mismos valores, contados como escenas y sin intervalo.
  assert.equal(fila(ECO_ANTERIOR, "A"), `${formatoNumero(2.11)} mm/day in ${ago}, from 2 clear-sky scenes`);
  assert.equal(fila(ECO_ANTERIOR, "B"), `${formatoNumero(0.9)} mm/day in ${ene}, from 1 clear-sky scene`);
  // Entrega corregida sin uno de los extremos en ese mes: sin intervalo (no se inventa el que falta).
  const sinMaximo = { ecostress: { ...ECO_CORREGIDO.ecostress, maximos_parcelas: { A: [0.9, null] } } };
  assert.equal(fila(sinMaximo, "A"), `${formatoNumero(2.11)} mm/day in ${ago}, from 2 clear overpasses`);
  // En los dos casos: sin «median», sin contraste con el modelo, y el aviso de la entrega en la nota.
  for (const contexto of [ECO_ANTERIOR, ECO_CORREGIDO]) {
    for (const id of ["A", "B", "C"]) {
      const f = evidenciaDeParcela({ contexto, id }).at(-1);
      assert.doesNotMatch(`${f.texto} ${f.nota}`, /\b(median|model|ratio)\b|%|same days|validat/i);
      assert.equal(f.nota, `${contexto.ecostress.aviso}.`);
    }
  }
  // textoEcostress con el detalle: lo mismo, sin pasar por el bloque.
  assert.equal(textoEcostress(2.11, "2026-08", { n: 2, conteo: "sobrevuelos", minimo: 1.57, maximo: 2.66 }), fila(ECO_CORREGIDO, "A"));
  assert.equal(textoEcostress(2.11, "2026-08", { n: 1, conteo: "sobrevuelos", minimo: 2.11, maximo: 2.11 }), `${formatoNumero(2.11)} mm/day in ${ago}, from 1 clear overpass`);
});

test("ECOSTRESS con los datos reales: P0757 con cultivo en el mes; P0632 sin cultivo, con su nota", { skip: REAL?.ecostress ? false : "sin ecostress en contexto.json" }, () => {
  const cubo = JSON.parse(readFileSync(new URL("../web/data/cubo.json", import.meta.url), "utf-8"));
  const eco = REAL.ecostress;
  const actual = (id) => (cubo.parcelas[id]?.opciones ?? []).find((o) => o.id === "ACTUAL");
  for (const id of ["P0757", "P0632", "L0175"].filter((x) => eco.parcelas[x] && actual(x))) {
    const u = ultimoMesConDato(eco.meses, eco.parcelas[id]);
    const i = eco.meses.indexOf(u.mes);
    const n = eco.escenas_parcelas[id][i];
    const fila = evidenciaDeParcela({ contexto: REAL, id, mesesCultivo: actual(id).meses_cultivo }).at(-1);
    // Con el archivo de hoy o con la entrega corregida (la que declara conteo «sobrevuelos» y trae el intervalo).
    const [minimo, maximo] = [eco.minimos_parcelas?.[id]?.[i], eco.maximos_parcelas?.[id]?.[i]];
    const esperado = eco.conteo === "sobrevuelos"
      ? `${formatoNumero(u.valor)} mm/day in ${etiquetaMes(u.mes)}, from ${n} clear ${n === 1 ? "overpass" : "overpasses"}${n > 1 && minimo != null && maximo != null ? ` (${formatoNumero(minimo)} to ${formatoNumero(maximo)})` : ""}`
      : `${formatoNumero(u.valor)} mm/day in ${etiquetaMes(u.mes)}, from ${n} clear-sky ${n === 1 ? "scene" : "scenes"}`;
    assert.equal(fila.texto, esperado, id);
    assert.ok(fila.nota.startsWith(`${eco.aviso}.`), `${id}: aviso a la vista`);
    const sinCultivo = !actual(id).meses_cultivo[Number(u.mes.slice(5)) - 1];
    assert.equal(fila.nota.endsWith(NOTA_ECOSTRESS_SIN_CULTIVO), sinCultivo, `${id}: nota de sin cultivo ${sinCultivo ? "presente" : "ausente"}`);
  }
});

test("lecturaDeGedi: dosel alto, sin dosel alto, pocos disparos, sin disparos; null sin criterio", () => {
  const ids = [...Object.keys(LLENO.gedi.parcelas), ...Object.keys(LLENO.ecostress.parcelas).filter((id) => !(id in LLENO.gedi.parcelas))];
  const lecturas = Object.fromEntries(ids.map((id) => [id, lecturaDeGedi({ contexto: LLENO, id })]));
  for (const id of ids) assert.equal(lecturas[id], lecturaIndependiente(LLENO.gedi, id), id);
  assert.deepEqual(new Set(Object.values(lecturas)), new Set(["tall_canopy", "no_tall_canopy", "too_few_shots", "no_shots"]), "la fixture trae las cuatro lecturas");
  // El texto del renglón empieza con la lectura; la medida va después, completa.
  for (const id of Object.keys(LLENO.gedi.parcelas)) {
    const [gedi] = evidenciaDeParcela({ contexto: LLENO, id });
    assert.equal(gedi.lectura, lecturas[id]);
    assert.equal(gedi.texto, `${TEXTO_DE_LECTURA[lecturas[id]]}: ${medidaDeGedi(LLENO.gedi.parcelas[id])}`);
  }
  // Sin criterio entregado: null para las parcelas con disparos (no se clasifica); «no_shots» sigue diciéndose.
  for (const id of Object.keys(LLENO.gedi.parcelas)) assert.equal(lecturaDeGedi({ contexto: SIN_CRITERIOS, id }), null);
  assert.equal(lecturaDeGedi({ contexto: SIN_CRITERIOS, id: "NO_EXISTE" }), "no_shots");
  // Con criterio pero una parcela sin clasificar y con disparos de sobra (un JSON anterior): null, no se adivina.
  const [idAlto] = Object.entries(LLENO.gedi.parcelas).find(([, p]) => p.dosel_alto === true);
  const sinClasificar = { ...LLENO, gedi: { ...LLENO.gedi, parcelas: { ...LLENO.gedi.parcelas, [idAlto]: { ...LLENO.gedi.parcelas[idAlto], dosel_alto: null } } } };
  assert.equal(lecturaDeGedi({ contexto: sinClasificar, id: idAlto }), null);
  // Sin bloque: null.
  assert.equal(lecturaDeGedi({ contexto: SIN_ENTREGAS, id: idAlto }), null);
  assert.equal(lecturaDeGedi(), null);
});

test("criteriosGedi: piso del instrumento y umbral de dosel alto, con los números y la etiqueta del JSON", () => {
  const k = LLENO.gedi.criterios;
  const { piso, dosel } = criteriosGedi(LLENO);
  assert.equal(piso, `Fields without trees read about ${formatoNumero(k.piso_instrumento.valor_m)} m (most between ${formatoNumero(k.piso_instrumento.min_m)} and ${formatoNumero(k.piso_instrumento.max_m)} m): the floor of the instrument, not plant height (${k.piso_instrumento.etiqueta}).`);
  assert.equal(dosel, `Tall canopy means a top decile of ${formatoNumero(k.dosel_alto.umbral_m)} m or more, from at least ${formatoNumero(k.dosel_alto.min_disparos)} shots (${k.dosel_alto.etiqueta}).`);
  const con = (criterios) => ({ ...LLENO, gedi: { ...LLENO.gedi, criterios } });
  // Lo que no llegó o llegó incompleto no se dice (ni se completa con nada).
  assert.deepEqual(criteriosGedi(con(null)), { piso: null, dosel: null });
  assert.deepEqual(criteriosGedi(con({ ...k, piso_instrumento: null })), { piso: null, dosel });
  assert.deepEqual(criteriosGedi(con({ ...k, dosel_alto: null })), { piso, dosel: null });
  assert.equal(criteriosGedi(con({ ...k, piso_instrumento: { ...k.piso_instrumento, max_m: null } })).piso, null);
  assert.equal(criteriosGedi(con({ ...k, dosel_alto: { ...k.dosel_alto, min_disparos: null } })).dosel, null);
  // Sin etiqueta, la frase va sin paréntesis; un mínimo de un disparo, en singular.
  assert.ok(criteriosGedi(con({ ...k, piso_instrumento: { ...k.piso_instrumento, etiqueta: null } })).piso.endsWith("not plant height."));
  assert.ok(criteriosGedi(con({ ...k, dosel_alto: { ...k.dosel_alto, min_disparos: 1, etiqueta: "" } })).dosel.endsWith("from at least 1 shot."));
  assert.deepEqual(criteriosGedi(SIN_ENTREGAS), { piso: null, dosel: null });
  assert.deepEqual(criteriosGedi(), { piso: null, dosel: null });
});

test("evidenciaDeParcela: la lectura de GEDI no se presenta como altura del cultivo y lleva su nota", () => {
  // La nota fija no trae cifras: el piso del instrumento y el umbral salen de la entrega (gedi.criterios).
  for (const nota of [NOTA_GEDI, NOTA_GEDI_SIN_DISPAROS]) assert.ok(!/\d/.test(nota), nota);
  assert.ok(NOTA_GEDI.includes("does not read zero on bare ground") && NOTA_GEDI.includes("does not measure crop height"));
  const { piso, dosel } = criteriosGedi(LLENO);
  const referencia = referenciaGedi(LLENO);
  assert.ok(piso && dosel && referencia, "la fixture trae los criterios y la referencia");
  for (const id of Object.keys(LLENO.gedi.parcelas)) {
    const [gedi] = evidenciaDeParcela({ contexto: LLENO, id });
    assert.ok(!COMO_ALTURA_DE_CULTIVO.test(`${gedi.etiqueta} ${gedi.texto}`), `${gedi.etiqueta}: ${gedi.texto}`);
    assert.equal(gedi.nota, `${NOTA_GEDI} ${piso} ${dosel}`, "nota fija + piso del instrumento + criterio de dosel alto");
    // Sin criterios: nota fija + referencia de la entrega. Sin nada: la nota fija; nunca el valor solo.
    assert.equal(evidenciaDeParcela({ contexto: SIN_CRITERIOS, id })[0].nota, `${NOTA_GEDI} ${referencia}`);
    assert.equal(evidenciaDeParcela({ contexto: SIN_CRITERIOS_NI_REFERENCIA, id })[0].nota, NOTA_GEDI);
  }
  // Un contexto.json anterior a esta corrección (sin «referencia» ni «criterios» ni «dosel_alto»): la nota fija sigue.
  const { referencia: _r, criterios: _k, ...gediViejo } = LLENO.gedi;
  gediViejo.parcelas = Object.fromEntries(Object.entries(LLENO.gedi.parcelas).map(([id, { dosel_alto: _d, ...p }]) => [id, p]));
  const [idViejo, pViejo] = Object.entries(gediViejo.parcelas)[0];
  const [viejo] = evidenciaDeParcela({ contexto: { ...LLENO, gedi: gediViejo }, id: idViejo });
  assert.deepEqual([viejo.texto, viejo.nota, viejo.lectura], [medidaDeGedi(pViejo), NOTA_GEDI, null]);
});

test("referenciaGedi: entre qué valores leen las parcelas de la entrega; null si no hay con qué comparar", () => {
  const r = LLENO.gedi.referencia;
  assert.equal(
    referenciaGedi(LLENO),
    `In this delivery, the ${formatoNumero(r.n_parcelas)} fields with shots read from ${formatoNumero(r.minimo_m)} m to ${formatoNumero(r.maximo_m)} m; half of them read ${formatoNumero(r.mediana_m)} m or less.`,
  );
  const con = (referencia) => ({ ...LLENO, gedi: { ...LLENO.gedi, referencia } });
  assert.equal(referenciaGedi(con(null)), null);
  assert.equal(referenciaGedi(con({ ...r, n_parcelas: 1 })), null, "una sola parcela: no hay con qué comparar");
  assert.equal(referenciaGedi(con({ ...r, mediana_m: null })), null, "un valor que falta no se supone");
  assert.equal(referenciaGedi(con({ ...r, minimo_m: "x" })), null);
  assert.equal(referenciaGedi(SIN_ENTREGAS), null);
  assert.equal(referenciaGedi(null), null);
  assert.equal(referenciaGedi(), null);
});

test("GEDI de hoy (web/data/contexto.json): ninguna parcela se presenta como altura de cultivo; lecturas según el criterio entregado", { skip: !(REAL && REAL.gedi) && "sin gedi en web/data/contexto.json" }, () => {
  const g = REAL.gedi;
  // La referencia sale de las mismas parcelas del bloque (cálculo independiente, aquí).
  const lecturas = Object.values(g.parcelas).map((p) => p.altura_mediana_m).sort((a, b) => a - b);
  assert.equal(g.referencia.n_parcelas, lecturas.length);
  assert.deepEqual([g.referencia.minimo_m, g.referencia.maximo_m], [lecturas[0], lecturas.at(-1)]);
  const mitad = lecturas.length % 2 ? lecturas[(lecturas.length - 1) / 2] : (lecturas[lecturas.length / 2 - 1] + lecturas[lecturas.length / 2]) / 2;
  assert.ok(Math.abs(g.referencia.mediana_m - mitad) < 0.006, `${g.referencia.mediana_m} vs ${mitad}`);
  const referencia = referenciaGedi(REAL);
  for (const v of [g.referencia.n_parcelas, g.referencia.minimo_m, g.referencia.mediana_m, g.referencia.maximo_m]) assert.ok(referencia.includes(formatoNumero(v)), `${v} en: ${referencia}`);
  // La nota de toda parcela con lectura: la fija, más los criterios entregados o, si no llegaron, la referencia.
  const { piso, dosel } = criteriosGedi(REAL);
  const notaEsperada = [NOTA_GEDI, piso ?? referencia, dosel].filter(Boolean).join(" ");
  assert.ok(notaEsperada.length > NOTA_GEDI.length, "con la entrega real, la nota trae algo con qué comparar la lectura");
  if (g.criterios && g.criterios.piso_instrumento) for (const v of [g.criterios.piso_instrumento.valor_m, g.criterios.piso_instrumento.min_m, g.criterios.piso_instrumento.max_m]) assert.ok(piso.includes(`${formatoNumero(v)} `), `${v} en: ${piso}`);
  const cuenta = { tall_canopy: 0, no_tall_canopy: 0, too_few_shots: 0, null: 0 };
  for (const id of Object.keys(g.parcelas)) {
    const [gedi] = evidenciaDeParcela({ contexto: REAL, id });
    assert.ok(!COMO_ALTURA_DE_CULTIVO.test(`${gedi.etiqueta} ${gedi.texto}`), `${id}: ${gedi.etiqueta}: ${gedi.texto}`);
    assert.equal(gedi.nota, notaEsperada, id);
    assert.equal(gedi.lectura, lecturaIndependiente(g, id), id);
    assert.ok(gedi.texto.endsWith(medidaDeGedi(g.parcelas[id])), `${id}: ${gedi.texto}`);
    cuenta[String(gedi.lectura)] += 1;
  }
  // Los conteos del motor y las lecturas de la página dicen lo mismo.
  if (g.criterios && g.criterios.dosel_alto) {
    assert.deepEqual([cuenta.tall_canopy, cuenta.no_tall_canopy, cuenta.too_few_shots, cuenta.null], [g.n_dosel_alto, g.n_sin_dosel_alto, g.n_pocos_disparos, 0]);
    // El caso del hallazgo: una lectura en el piso del instrumento no se dice «dosel alto».
    const enElPiso = Object.entries(g.parcelas).find(([, p]) => p.dosel_alto === false);
    if (enElPiso) assert.ok(evidenciaDeParcela({ contexto: REAL, id: enElPiso[0] })[0].texto.startsWith("no tall canopy seen: "));
  } else {
    assert.equal(cuenta.null, Object.keys(g.parcelas).length, "sin criterio no se clasifica ninguna parcela");
  }
});

test("evidenciaDeParcela: sin dato se dice (no es cero) y sin bloques devuelve []", () => {
  // Parcela del archivo sin disparos: no está en gedi.parcelas.
  const sinDisparos = Object.keys(LLENO.ecostress.parcelas).find((id) => !(id in LLENO.gedi.parcelas));
  const filas = evidenciaDeParcela({ contexto: LLENO, id: sinDisparos });
  assert.equal(filas[0].texto, "GEDI: no shots inside this field");
  assert.equal(filas[0].nota, NOTA_GEDI_SIN_DISPAROS, "sin disparos: es «sin dato», y se explica por qué");
  assert.equal(filas[0].lectura, "no_shots");
  assert.equal(filas[0].fuente, LLENO.gedi.fuente);
  assert.deepEqual(Object.keys(filas[0]), CLAVES_EVIDENCIA);
  // Parcela con sus últimos meses sin escena: se usa el último mes que sí tiene dato.
  const [idHueco, valores] = Object.entries(LLENO.ecostress.parcelas).find(([, v]) => v.at(-1) === null && v.some((x) => x != null));
  const ultimo = ultimoMesConDato(LLENO.ecostress.meses, valores);
  assert.notEqual(ultimo.mes, LLENO.ecostress.meses.at(-1));
  assert.ok(evidenciaDeParcela({ contexto: LLENO, id: idHueco })[1].texto.includes(` in ${etiquetaMes(ultimo.mes)}, from `));
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


// ---------------------------------------------------------------------------------------------
// Integración (etapa 3): advertencias a la vista, malla de GRACE, días faltantes y años fuera del eje
// ---------------------------------------------------------------------------------------------
test("modeloTarjetas: las advertencias del catálogo llegan a la tarjeta, sin cifras escritas aquí", () => {
  const catalogo = leer("../data/recursos_reto.json");
  const conAdvertencias = catalogo.tarjetas.filter((t) => (t.advertencias || []).length);
  assert.ok(conAdvertencias.length >= 4, "ET, NLDAS, GRACE y ERA5-Land");
  const contexto = { ...LLENO, tarjetas: catalogo.tarjetas };
  for (const t of modeloTarjetas(contexto, ZONA_A)) {
    const deCatalogo = catalogo.tarjetas.find((x) => x.id === t.id).advertencias || [];
    assert.deepEqual(t.advertencias.map((a) => a.texto), deCatalogo.map((a) => a.texto), t.id);
  }
  // Sin advertencias en el JSON (un contexto.json viejo): lista vacía, nada inventado.
  assert.ok(modeloTarjetas(LLENO, ZONA_A).every((t) => Array.isArray(t.advertencias)));
});

test("textoMascon: la malla del producto y la del mascon salen de serie.malla_mascon; sin el campo, nada", () => {
  assert.equal(textoMascon({ malla_mascon: { malla_grados: 0.5, mascon_grados: 3 } }), "0.5° product grid built on 3° mascons: the real resolution is the mascon's");
  assert.equal(textoMascon({ malla_mascon: { mascon_grados: 3 } }), "Built on 3° mascons: the real resolution is the mascon's");
  for (const s of [{}, null, undefined, { malla_mascon: null }, { malla_mascon: { malla_grados: 0.5 } }]) assert.equal(textoMascon(s), null);
  // En el panel de GRACE, el renglón de la malla lo dice junto a su resolución.
  const tarjeta = modeloTarjetas(LLENO, ZONA_A).find((t) => t.id === "agua_almacenada");
  const panel = tarjeta.paneles[0];
  const conMascon = { ...panel, series: panel.series.map((s) => ({ ...s, serie: { ...s.serie, malla_mascon: { malla_grados: 0.5, mascon_grados: 3 } } })) };
  const meta = metaDePanel(conMascon);
  assert.ok(meta[0].partes.includes(textoMascon(conMascon.series[0].serie)), meta[0].texto);
});

test("mascon de hoy (web/data/contexto.json): GRACE dice su malla y la de sus mascons con las cifras de la entrega", { skip: !(REAL && REAL.contexto_regional && REAL.contexto_regional[CUENCA]) && "sin GRACE en web/data/contexto.json" }, () => {
  const grace = Object.values(REAL.contexto_regional[CUENCA])[0];
  if (!grace.malla_mascon) return; // la entrega no lo dice: la página tampoco
  const zona = Object.keys(REAL.zonas)[0];
  const panel = modeloTarjetas(REAL, zona).find((t) => t.id === "agua_almacenada").paneles[0];
  const texto = metaDePanel(panel)[0].texto;
  assert.ok(texto.includes(`${formatoNumero(grace.malla_mascon.mascon_grados)}° mascons`) && texto.includes("Basin scale"), texto);
});

test("diasIncompletos: un total con días faltantes lo dice; un año completo, no", () => {
  assert.equal(diasIncompletos(364, 365), `${formatoNumero(364)} of ${formatoNumero(365)} days with data`);
  for (const [c, d] of [[365, 365], [366, 366], [null, 365], [364, null], ["", 365]]) assert.equal(diasIncompletos(c, d), null, `${c}/${d}`);
});

test("años fuera del eje: la serie guarda el motivo de cada año sin valor (no «no data» si hay meses)", () => {
  // GRACE de la fixture: algún año parcial; su motivo queda en «fuera» aunque el recorte lo saque del eje.
  for (const t of modeloTarjetas(LLENO, ZONA_A)) {
    for (const p of t.paneles) {
      if (!p.grafica) continue;
      for (const s of p.grafica.series) {
        const serie = p.series.find((x) => x.etiqueta === s.nombre).serie;
        for (const punto of puntosAnuales(serie)) {
          if (punto.valor != null) assert.equal(s.fuera[String(punto.anio)], undefined);
          else if (punto.parcial) assert.match(s.fuera[String(punto.anio)], /^partial year: /);
        }
      }
    }
  }
  for (const g of graficasDeClima(LLENO, ZONA_A)) {
    for (const s of g.series) assert.ok(s.fuera && typeof s.fuera === "object", g.id);
  }
});
