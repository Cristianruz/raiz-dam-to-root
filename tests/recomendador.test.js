// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// Pruebas del plan del tablero (web/js/recomendador.js). Lo principal: el plan da LAS MISMAS hectáreas y la
// misma cobertura que la ficha, porque usa web/reglas.js con las láminas de web/data/cubo.json.
// Uso: node --test tests/recomendador.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  AVISO_JUICIO,
  ESTADOS,
  ALCANCE,
  planDeParcela,
  comprobarPlan,
  dotacionDeEntrada,
  textoCobertura,
  textoRestriccion,
} from "../web/js/recomendador.js";
import * as modulo from "../web/js/recomendador.js";
import { evaluarOpcion } from "../web/reglas.js";
import { formatoHectareas } from "../web/js/resumen.js";

const leer = (ruta) => fs.readFileSync(new URL(ruta, import.meta.url), "utf-8");
const cubo = JSON.parse(leer("../web/data/cubo.json"));
const geo = JSON.parse(leer("../web/data/parcelas.geojson"));
const pronostico = JSON.parse(leer("../web/data/pronostico.json"));
const suelo = JSON.parse(leer("../web/data/suelo.json"));
const parcelaDe = (id) => geo.features.find((f) => f.properties.id === id).properties;
const MARCAS = cubo.dotaciones.marcas.map((m) => m.valor);
const LLUVIAS = cubo.lluvia_pct;
const PROTAGONISTAS = ["P0757", "P0632", "L0175"];
const plan = (id, dotacion, lluvia, entrada = {}) =>
  planDeParcela({
    cubo,
    parcela: parcelaDe(id),
    dotacion,
    lluvia,
    entrada,
    requisitos: pronostico.requisitos,
    perfil: suelo.perfil?.parcelas?.[id] ?? null,
    m3PorMillar: pronostico.metodo.m3_por_millar,
  });

// Palabras que la herramienta no usa en ningún texto visible (regla 10 de CLAUDE.md y encargo de la revisión).
const VETADAS = /\b(first|only|best|better|recommend\w*|sav(?:e|es|ed|ing|ings)|free(?:s|d|ing)? up)\b/i;
const ROTO = /NaN|undefined|null|Infinity/;

/** Todos los textos visibles de un plan (los que escribe el módulo y los que copia de los datos). */
function textosDe(p) {
  const textos = [p.motivo, p.alcance, p.aviso_juicio, ...p.errores, ...p.avisos.map((a) => a.texto)];
  for (const t of p.tarjetas) {
    textos.push(t.nombre, t.rotulo, t.descripcion);
    for (const r of t.restricciones) textos.push(textoRestriccion(r));
    for (const x of [...t.pendientes, ...t.cumplidas]) textos.push(x.texto);
  }
  return textos.filter((t) => t != null);
}

test("OBLIGATORIA: hectáreas y cobertura del plan idénticas a evaluarOpcion de web/reglas.js", () => {
  let comparadas = 0;
  for (const id of PROTAGONISTAS) {
    const parcela = parcelaDe(id);
    const opciones = cubo.parcelas[id].opciones;
    assert.ok(opciones.length > 0, `${id} tiene opciones en el cubo`);
    for (const D of MARCAS) {
      for (const r of LLUVIAS) {
        const p = plan(id, D, r);
        assert.equal(p.estado, "calculado", `${id} D=${D} r=${r}`);
        // TODAS las opciones del cubo, en su orden y ninguna de más.
        assert.deepEqual(p.tarjetas.map((t) => t.id), opciones.map((o) => o.id));
        for (const opcion of opciones) {
          const ficha = evaluarOpcion(opcion, parcela.area_ha, D, r);
          const tarjeta = p.tarjetas.find((t) => t.id === opcion.id);
          const donde = `${id} ${opcion.id} D=${D} r=${r}`;
          assert.deepEqual(tarjeta.hectareas, ficha.hectareas, `hectáreas · ${donde}`);
          assert.equal(tarjeta.cobertura, ficha.cobertura, `cobertura · ${donde}`);
          assert.deepEqual(tarjeta.lamina, opcion.agua.lamina_bruta[String(r)], `lámina del cubo · ${donde}`);
          // El texto de la tarjeta lleva las hectáreas con el formato de la ficha (formatoHectareas).
          if (ficha.lamina.p50 > 0 && ficha.cobertura < 1) {
            const fh = formatoHectareas(parcela.area_ha);
            assert.ok(
              tarjeta.descripcion.includes(`covers ${fh(ficha.hectareas.p50)} of ${fh(parcela.area_ha)} ha`),
              `texto · ${donde}: ${tarjeta.descripcion}`,
            );
          }
          comparadas += 1;
        }
      }
    }
  }
  assert.ok(comparadas >= PROTAGONISTAS.length * MARCAS.length * LLUVIAS.length, "se comparó cada combinación");
});

test("recorrido de todas las parcelas clasificadas: sin NaN, undefined, null ni Infinity", () => {
  const { min, max } = cubo.dotaciones.deslizador;
  const dotaciones = [...new Set([min, max, ...MARCAS])];
  let clasificadas = 0;
  for (const f of geo.features) {
    const parcela = f.properties;
    if (parcela.abstencion) continue;
    clasificadas += 1;
    for (const D of dotaciones) {
      for (const r of LLUVIAS) {
        const p = plan(parcela.id, D, r);
        const donde = `${parcela.id} D=${D} r=${r}`;
        assert.equal(p.estado, "calculado", donde);
        assert.ok(p.tarjetas.length > 0, donde);
        for (const t of p.tarjetas) {
          const cifras = [t.area, t.dotacion, t.lluvia, t.cobertura, t.lamina.p10, t.lamina.p50, t.lamina.p90, t.hectareas.p50, t.hectareas.bajo, t.hectareas.alto];
          assert.ok(cifras.every(Number.isFinite), `cifras finitas · ${donde} ${t.id}`);
          assert.ok(t.hectareas.bajo <= t.hectareas.p50 && t.hectareas.p50 <= t.hectareas.alto && t.hectareas.alto <= t.area, `rango ordenado · ${donde} ${t.id}`);
          assert.ok(Object.values(ESTADOS).includes(t.rotulo), `rótulo conocido · ${donde} ${t.id}`);
        }
        for (const texto of textosDe(p)) {
          assert.equal(typeof texto, "string");
          assert.ok(!ROTO.test(texto), `texto roto · ${donde}: ${texto}`);
          assert.ok(!VETADAS.test(texto), `palabra vetada · ${donde}: ${texto}`);
        }
      }
    }
  }
  assert.ok(clasificadas > 0);
});

test("parcela sin clasificar: sin plan, con el motivo", () => {
  const sinClasificar = geo.features.filter((f) => f.properties.abstencion);
  assert.ok(sinClasificar.length > 0);
  for (const f of sinClasificar) {
    const p = plan(f.properties.id, MARCAS[0], LLUVIAS[0]);
    assert.equal(p.estado, "sin_plan");
    assert.equal(p.tarjetas.length, 0);
    assert.match(p.motivo, /^No plan for this field: .*classification/);
  }
});

test("parcela en descanso: salen las opciones del cubo (maíz forrajero y sorgo), no una sola tarjeta", () => {
  const descanso = geo.features.find((f) => !f.properties.abstencion && f.properties.cultivo_actual === "barbecho").properties;
  const p = plan(descanso.id, MARCAS.at(-1), LLUVIAS[0]);
  const ids = p.tarjetas.map((t) => t.id);
  assert.deepEqual(ids, cubo.parcelas[descanso.id].opciones.map((o) => o.id));
  assert.ok(ids.includes("maiz_forrajero") && ids.includes("sorgo"), ids.join(", "));
  const actual = p.tarjetas.find((t) => t.id === "ACTUAL");
  assert.equal(actual.sinRiego, true);
  assert.match(actual.descripcion, /needs no irrigation water/);
});

test("describe, no ordena: sin puntaje, en el orden del cubo y con el aviso de juicio de la página", () => {
  const p = plan("P0757", MARCAS[1], LLUVIAS[0]);
  for (const t of p.tarjetas)
    for (const llave of Object.keys(t)) assert.ok(!/puntaje|score|rank|mejor|orden/i.test(llave), llave);
  assert.equal(p.aviso_juicio, AVISO_JUICIO);
  assert.ok(leer("../web/index.html").includes(AVISO_JUICIO), "es la misma frase de web/index.html");
  assert.ok(leer("../web/app.js").includes(AVISO_JUICIO), "es la misma frase de web/app.js");
  assert.equal(p.alcance, ALCANCE);
  assert.match(ALCANCE, /does not forecast the dam/);
});

test("restricción encontrada: con su fuente, descrita y sin orden al agricultor", () => {
  // La ventana de siembra sale del catálogo del cubo; las fechas de prueba se arman con ella.
  const rotacion = cubo.parcelas.P0632.opciones.find((o) => o.id === "ACTUAL").rotacion;
  const { desde, hasta } = cubo.opciones_catalogo[rotacion].secuencia[0].siembra;
  const enVentana = (mmdd) => (desde <= hasta ? mmdd >= desde && mmdd <= hasta : mmdd >= desde || mmdd <= hasta);
  const mediados = Array.from({ length: 12 }, (_, i) => `${String(i + 1).padStart(2, "0")}-15`);
  const mmddFuera = mediados.find((m) => !enVentana(m));
  const mmddDentro = mediados.find(enVentana);
  assert.ok(mmddFuera && mmddDentro, "hay fechas dentro y fuera de la ventana");

  const fuera = plan("P0632", MARCAS[1], LLUVIAS[0], { fecha: `2027-${mmddFuera}` });
  const tarjeta = fuera.tarjetas.find((t) => t.id === "ACTUAL");
  assert.equal(tarjeta.estado, "restriccion");
  assert.equal(tarjeta.rotulo, "Restriction found");
  const [r] = tarjeta.restricciones;
  assert.ok(r.fuente && r.fuente.length > 0, "la restricción lleva fuente");
  const texto = textoRestriccion(r);
  assert.ok(texto.startsWith(`Restriction found: the planting date you entered (${mmddFuera}) is outside the window`), texto);
  assert.ok(texto.includes(`${desde} to ${hasta}`), texto);
  assert.match(texto, /Review it with your module technician\.$/);
  // La restricción no cambia las hectáreas: se describe y nada más.
  const sinFecha = plan("P0632", MARCAS[1], LLUVIAS[0]).tarjetas.find((t) => t.id === "ACTUAL");
  assert.deepEqual(tarjeta.hectareas, sinFecha.hectareas);
  assert.equal(sinFecha.rotulo, "Needs a local check");
  // Dentro de la ventana: pasa a las comprobaciones cumplidas.
  const dentro = plan("P0632", MARCAS[1], LLUVIAS[0], { fecha: `2027-${mmddDentro}` }).tarjetas.find((t) => t.id === "ACTUAL");
  assert.equal(dentro.restricciones.length, 0);
  assert.ok(dentro.cumplidas.some((x) => x.id === "fecha_siembra"));
});

test("el sistema de riego solo se anota: no cambia ninguna cifra", () => {
  const base = plan("P0757", MARCAS[1], LLUVIAS[0]);
  for (const sistema of ["gravedad", "goteo", "sin_confirmar"]) {
    const p = plan("P0757", MARCAS[1], LLUVIAS[0], { sistema });
    assert.deepEqual(p.tarjetas, base.tarjetas, sistema);
    assert.equal(p.sistema_de_riego_anotado, sistema);
  }
});

test("volumen capturado: equivale a su dotación y usa la misma regla", () => {
  const parcela = parcelaDe("P0632");
  const D = MARCAS[1];
  const volumen = D * parcela.area_ha * pronostico.metodo.m3_por_millar;
  const conVolumen = plan("P0632", MARCAS[0], LLUVIAS[0], { volumenDisponible: volumen });
  const conDotacion = plan("P0632", D, LLUVIAS[0]);
  assert.equal(conVolumen.dotacion_origen, "volume_entered");
  for (const t of conVolumen.tarjetas) {
    const otra = conDotacion.tarjetas.find((x) => x.id === t.id);
    for (const k of ["p50", "bajo", "alto"]) assert.ok(Math.abs(t.hectareas[k] - otra.hectareas[k]) < 1e-9, `${t.id} ${k}`);
  }
  assert.equal(dotacionDeEntrada({ dotacion: D }), D);
  assert.equal(dotacionDeEntrada({ dotacion: Number.NaN }), null);
  assert.equal(dotacionDeEntrada({ dotacion: D, volumen, area: parcela.area_ha, m3PorMillar: null }), null);
});

test("más agua nunca baja las hectáreas; sin agua no hay hectáreas regadas", () => {
  for (const id of PROTAGONISTAS) {
    const cero = plan(id, 0, LLUVIAS[0]);
    for (const t of cero.tarjetas) if (!t.sinRiego) assert.equal(t.hectareas.p50, 0, `${id} ${t.id}`);
    const ordenadas = [...MARCAS].sort((a, b) => a - b).map((D) => plan(id, D, LLUVIAS[0]));
    for (let i = 1; i < ordenadas.length; i += 1)
      for (const t of ordenadas[i].tarjetas)
        assert.ok(t.hectareas.p50 >= ordenadas[i - 1].tarjetas.find((x) => x.id === t.id).hectareas.p50, `${id} ${t.id}`);
  }
});

test("entradas inválidas o ausentes: sin plan y sin excepción", () => {
  const malas = [{ area: 0 }, { area: Number.NaN }, { volumenDisponible: -1 }, { ph: 99 }, { salinidad: -1 }, { fecha: "2027-02-31" }, { fecha: "<img>" }];
  for (const entrada of malas) {
    const p = plan("P0757", MARCAS[1], LLUVIAS[0], entrada);
    assert.equal(p.estado, "entradas_invalidas", JSON.stringify(entrada));
    assert.equal(p.tarjetas.length, 0);
    assert.ok(p.errores.length > 0);
  }
  assert.equal(planDeParcela({ cubo, parcela: null, dotacion: MARCAS[0], lluvia: LLUVIAS[0] }).estado, "sin_plan");
  assert.equal(planDeParcela({ cubo, parcela: undefined, dotacion: null, lluvia: null }).motivo, "No field is selected.");
  assert.equal(planDeParcela({ cubo: {}, parcela: parcelaDe("P0757"), dotacion: MARCAS[0], lluvia: LLUVIAS[0] }).estado, "sin_plan");
  assert.equal(plan("P0757", Number.NaN, LLUVIAS[0]).estado, "entradas_invalidas");
  assert.equal(plan("P0757", MARCAS[0], "abc").estado, "entradas_invalidas");
  assert.equal(textoCobertura(null), textoCobertura({ estado: "sin_datos" }));
});

test("comprobaciones del botón: pasan con datos reales y no fallan con zona o validación nulas", () => {
  for (const id of PROTAGONISTAS) {
    const parcela = parcelaDe(id);
    const args = { cubo, parcela, dotacion: MARCAS[1], lluvia: LLUVIAS[0], entrada: {}, requisitos: pronostico.requisitos };
    const lista = comprobarPlan(args, pronostico.zonas[parcela.zona].validacion_lluvia);
    assert.ok(lista.length >= 5, id);
    for (const c of lista) assert.equal(c.ok, true, `${id}: ${c.nombre}`);
    // Zona nula: no hay validación de lluvia que leer; antes esto daba TypeError.
    assert.doesNotThrow(() => comprobarPlan(args, pronostico.zonas[null]?.validacion_lluvia));
    assert.doesNotThrow(() => comprobarPlan(args, null));
  }
  const sinParcela = comprobarPlan({ cubo, parcela: null, dotacion: MARCAS[0], lluvia: LLUVIAS[0] }, null);
  assert.equal(sinParcela.length, 1);
  assert.equal(sinParcela[0].ok, false);
});

test("ya no hay segundo modelo de demanda ni textos en español en los módulos del asesor", () => {
  assert.equal(modulo.demandaHistorica, undefined);
  assert.equal(modulo.evaluarPlan, undefined);
  assert.equal(modulo.cuantil, undefined);
  for (const archivo of ["../web/js/recomendador.js", "../web/js/asesor.js"]) {
    const fuente = leer(archivo);
    // Sin los comentarios (que van en español), no quedan letras propias del español en el código ni en los textos.
    const sinComentarios = fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/.*$/gm, "$1");
    const conAcento = sinComentarios.match(/[^\n]*[áéíóúñ¿¡][^\n]*/gi) ?? [];
    assert.deepEqual(conAcento, [], `${archivo}: textos en español`);
    assert.ok(!/neta_mm|presiembra|niveles_plan|ea_gravedad/.test(sinComentarios), `${archivo}: restos del segundo modelo`);
    assert.ok(!VETADAS.test(sinComentarios.replaceAll('"#recommendations"', "")), `${archivo}: palabra vetada en el código o en un texto`);
  }
  const fuente = leer("../web/js/recomendador.js");
  assert.match(fuente, /from "\.\.\/reglas\.js"/);
  for (const nombre of ["evaluarOpcion", "hectareasQueAlcanzan", "cobertura", "llaveLluvia"]) assert.ok(fuente.includes(nombre), nombre);
});
