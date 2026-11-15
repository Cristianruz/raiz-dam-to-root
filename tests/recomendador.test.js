// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// Pruebas del plan del tablero (web/js/recomendador.js). Lo principal: el plan da LAS MISMAS hectáreas y la
// misma cobertura que la ficha, porque usa web/reglas.js con las láminas de web/data/cubo.json.
// Los textos del plan (cuatro idiomas) se prueban además en tests/textos_asesor.test.js.
// Uso: node --test tests/recomendador.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  ESTADOS,
  avisoJuicio,
  alcance,
  rotuloDeEstado,
  planDeParcela,
  comprobarPlan,
  dotacionDeEntrada,
  formatoHa,
  textoCobertura,
  textoRestriccion,
} from "../web/js/recomendador.js";
import * as modulo from "../web/js/recomendador.js";
import { evaluarOpcion } from "../web/reglas.js";
import { formatoHectareas } from "../web/js/resumen.js";
import { IDIOMAS, fijarIdioma } from "../web/js/i18n.js";
import { enlaceSeguro, fuenteHtml } from "../web/js/asesor.js";

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
const ROTO = /\b(NaN|undefined|null|Infinity)\b/; // con límites de palabra: «nulle part» es francés, no un dato roto
const CLAVE_A_LA_VISTA = /asesor\.[a-z_]+\.?[a-z_]*/;

/** Todos los textos visibles de un plan (los que arma el módulo y los que copia de los datos). */
function textosDe(p) {
  const textos = [p.motivo, p.alcance, p.aviso_juicio, ...p.errores, ...p.avisos.map((a) => a.texto)];
  for (const x of p.tarjetas) {
    textos.push(x.nombre, x.rotulo, x.descripcion);
    for (const r of x.restricciones) textos.push(textoRestriccion(r));
    for (const y of [...x.pendientes, ...x.cumplidas]) textos.push(y.texto);
  }
  return textos.filter((y) => y != null);
}

test("OBLIGATORIA: hectáreas y cobertura del plan idénticas a evaluarOpcion de web/reglas.js", () => {
  let comparadas = 0;
  for (const codigo of IDIOMAS) {
    fijarIdioma(codigo); // el idioma cambia los textos, nunca las cifras
    for (const id of PROTAGONISTAS) {
      const parcela = parcelaDe(id);
      const opciones = cubo.parcelas[id].opciones;
      assert.ok(opciones.length > 0, `${id} tiene opciones en el cubo`);
      for (const D of MARCAS) {
        for (const r of LLUVIAS) {
          const p = plan(id, D, r);
          assert.equal(p.estado, "calculado", `${id} D=${D} r=${r}`);
          // TODAS las opciones del cubo, en su orden y ninguna de más.
          assert.deepEqual(p.tarjetas.map((x) => x.id), opciones.map((o) => o.id));
          for (const opcion of opciones) {
            const ficha = evaluarOpcion(opcion, parcela.area_ha, D, r);
            const tarjeta = p.tarjetas.find((x) => x.id === opcion.id);
            const donde = `${codigo} ${id} ${opcion.id} D=${D} r=${r}`;
            assert.deepEqual(tarjeta.hectareas, ficha.hectareas, `hectáreas · ${donde}`);
            assert.equal(tarjeta.cobertura, ficha.cobertura, `cobertura · ${donde}`);
            assert.deepEqual(tarjeta.lamina, opcion.agua.lamina_bruta[String(r)], `lámina del cubo · ${donde}`);
            // Las hectáreas escritas llevan el redondeo de la ficha (formatoHectareas de web/js/resumen.js).
            const fh = formatoHectareas(parcela.area_ha);
            assert.deepEqual(
              tarjeta.hectareas_ficha,
              { area: fh(parcela.area_ha), p50: fh(ficha.hectareas.p50), bajo: fh(ficha.hectareas.bajo), alto: fh(ficha.hectareas.alto) },
              `hectáreas escritas · ${donde}`,
            );
            if (ficha.lamina.p50 > 0 && ficha.cobertura < 1) {
              const local = formatoHa(parcela.area_ha);
              assert.ok(tarjeta.descripcion.includes(local(ficha.hectareas.p50)), `texto · ${donde}: ${tarjeta.descripcion}`);
              assert.ok(tarjeta.descripcion.includes(local(parcela.area_ha)), `texto · ${donde}: ${tarjeta.descripcion}`);
            }
            comparadas += 1;
          }
        }
      }
    }
  }
  fijarIdioma("en");
  assert.ok(comparadas >= IDIOMAS.length * PROTAGONISTAS.length * MARCAS.length * LLUVIAS.length, "se comparó cada combinación");
  // En inglés, el texto lleva exactamente las cifras que escribe la ficha.
  const x = plan("P0757", MARCAS[1], LLUVIAS[0]).tarjetas.find((y) => y.id === "ACTUAL");
  assert.ok(x.descripcion.includes(`covers ${x.hectareas_ficha.p50} of ${x.hectareas_ficha.area} ha`), x.descripcion);
});

test("recorrido de todas las parcelas clasificadas: sin NaN, undefined, null ni Infinity (cuatro idiomas)", () => {
  const { min, max } = cubo.dotaciones.deslizador;
  const dotaciones = [...new Set([min, max, ...MARCAS])];
  let clasificadas = 0;
  for (const codigo of IDIOMAS) {
    fijarIdioma(codigo);
    const rotulos = ESTADOS.map(rotuloDeEstado);
    for (const f of geo.features) {
      const parcela = f.properties;
      if (parcela.abstencion) continue;
      clasificadas += 1;
      for (const D of dotaciones) {
        for (const r of LLUVIAS) {
          const p = plan(parcela.id, D, r);
          const donde = `${codigo} ${parcela.id} D=${D} r=${r}`;
          assert.equal(p.estado, "calculado", donde);
          assert.ok(p.tarjetas.length > 0, donde);
          for (const x of p.tarjetas) {
            const cifras = [x.area, x.dotacion, x.lluvia, x.cobertura, x.lamina.p10, x.lamina.p50, x.lamina.p90, x.hectareas.p50, x.hectareas.bajo, x.hectareas.alto];
            assert.ok(cifras.every(Number.isFinite), `cifras finitas · ${donde} ${x.id}`);
            assert.ok(x.hectareas.bajo <= x.hectareas.p50 && x.hectareas.p50 <= x.hectareas.alto && x.hectareas.alto <= x.area, `rango ordenado · ${donde} ${x.id}`);
            assert.ok(rotulos.includes(x.rotulo), `rótulo conocido · ${donde} ${x.id}`);
          }
          for (const texto of textosDe(p)) {
            assert.equal(typeof texto, "string");
            assert.ok(!ROTO.test(texto), `texto roto · ${donde}: ${texto}`);
            assert.ok(!CLAVE_A_LA_VISTA.test(texto), `clave a la vista · ${donde}: ${texto}`);
            assert.ok(!texto.includes("—"), `cifra sin dato · ${donde}: ${texto}`);
          }
        }
      }
    }
  }
  fijarIdioma("en");
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
  const ids = p.tarjetas.map((x) => x.id);
  assert.deepEqual(ids, cubo.parcelas[descanso.id].opciones.map((o) => o.id));
  assert.ok(ids.includes("maiz_forrajero") && ids.includes("sorgo"), ids.join(", "));
  const actual = p.tarjetas.find((x) => x.id === "ACTUAL");
  assert.equal(actual.sinRiego, true);
  assert.match(actual.descripcion, /needs no irrigation water/);
});

test("describe, no ordena: sin puntaje, en el orden del cubo y con el aviso de juicio de la ficha", () => {
  const p = plan("P0757", MARCAS[1], LLUVIAS[0]);
  for (const x of p.tarjetas)
    for (const llave of Object.keys(x)) assert.ok(!/puntaje|score|rank|mejor|orden/i.test(llave), llave);
  assert.equal(p.aviso_juicio, avisoJuicio());
  assert.equal(p.aviso_juicio, "This tool supports, never replaces, the judgment of farmers and local experts.");
  assert.ok(leer("../web/explorer.html").includes(p.aviso_juicio), "es la misma frase de la ficha (web/explorer.html)");
  assert.ok(leer("../web/app.js").includes(p.aviso_juicio), "es la misma frase de web/app.js");
  assert.equal(p.alcance, alcance());
  assert.match(p.alcance, /does not forecast the dam/);
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
  const tarjeta = fuera.tarjetas.find((x) => x.id === "ACTUAL");
  assert.equal(tarjeta.estado, "restriccion");
  assert.equal(tarjeta.rotulo, "Restriction found");
  const [r] = tarjeta.restricciones;
  assert.ok(r.fuente && r.fuente.length > 0, "la restricción lleva fuente");
  const texto = textoRestriccion(r);
  assert.match(texto, /^Restriction found: The planting date you entered \(.+\) is outside the window reported for winter cereal \(.+ to .+\)\./);
  assert.match(texto, /Review it with your module technician\.$/);
  // La restricción no cambia las hectáreas: se describe y nada más.
  const sinFecha = plan("P0632", MARCAS[1], LLUVIAS[0]).tarjetas.find((x) => x.id === "ACTUAL");
  assert.deepEqual(tarjeta.hectareas, sinFecha.hectareas);
  assert.equal(sinFecha.rotulo, "Needs a local check");
  // Dentro de la ventana: pasa a las comprobaciones cumplidas.
  const dentro = plan("P0632", MARCAS[1], LLUVIAS[0], { fecha: `2027-${mmddDentro}` }).tarjetas.find((x) => x.id === "ACTUAL");
  assert.equal(dentro.restricciones.length, 0);
  assert.ok(dentro.cumplidas.some((y) => y.id === "fecha_siembra"));
});

test("el sistema de riego se anota y no cambia ninguna cifra", () => {
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
  assert.equal(conVolumen.dotacion_origen, "volumen_capturado");
  for (const x of conVolumen.tarjetas) {
    const otra = conDotacion.tarjetas.find((y) => y.id === x.id);
    for (const k of ["p50", "bajo", "alto"]) assert.ok(Math.abs(x.hectareas[k] - otra.hectareas[k]) < 1e-9, `${x.id} ${k}`);
  }
  assert.equal(dotacionDeEntrada({ dotacion: D }), D);
  assert.equal(dotacionDeEntrada({ dotacion: Number.NaN }), null);
  assert.equal(dotacionDeEntrada({ dotacion: D, volumen, area: parcela.area_ha, m3PorMillar: null }), null);
});

test("más agua nunca baja las hectáreas; sin agua no hay hectáreas regadas", () => {
  for (const id of PROTAGONISTAS) {
    const cero = plan(id, 0, LLUVIAS[0]);
    for (const x of cero.tarjetas) if (!x.sinRiego) assert.equal(x.hectareas.p50, 0, `${id} ${x.id}`);
    const ordenadas = [...MARCAS].sort((a, b) => a - b).map((D) => plan(id, D, LLUVIAS[0]));
    for (let i = 1; i < ordenadas.length; i += 1)
      for (const x of ordenadas[i].tarjetas)
        assert.ok(x.hectareas.p50 >= ordenadas[i - 1].tarjetas.find((y) => y.id === x.id).hectareas.p50, `${id} ${x.id}`);
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
  assert.equal(plan("P0757", MARCAS[0], null).estado, "entradas_invalidas");
  assert.equal(textoCobertura(null), textoCobertura({ estado: "sin_datos" }));
});

test("comprobaciones del botón: pasan con datos reales y no fallan con zona o validación nulas", () => {
  for (const id of PROTAGONISTAS) {
    const parcela = parcelaDe(id);
    const args = { cubo, parcela, dotacion: MARCAS[1], lluvia: LLUVIAS[0], entrada: {}, requisitos: pronostico.requisitos };
    const lista = comprobarPlan(args, pronostico.zonas[parcela.zona].validacion_lluvia);
    assert.ok(lista.length >= 5, id);
    for (const c of lista) {
      assert.equal(c.ok, true, `${id}: ${c.nombre}`);
      assert.ok(!CLAVE_A_LA_VISTA.test(c.nombre) && !CLAVE_A_LA_VISTA.test(c.detalle), `${c.nombre} · ${c.detalle}`);
    }
    // Zona nula: no hay validación de lluvia que leer; antes esto daba TypeError.
    assert.doesNotThrow(() => comprobarPlan(args, pronostico.zonas[null]?.validacion_lluvia));
    assert.doesNotThrow(() => comprobarPlan(args, null));
  }
  const sinParcela = comprobarPlan({ cubo, parcela: null, dotacion: MARCAS[0], lluvia: LLUVIAS[0] }, null);
  assert.equal(sinParcela.length, 1);
  assert.equal(sinParcela[0].ok, false);
});

test("ya no hay segundo modelo de demanda; el plan usa las reglas de la ficha", () => {
  assert.equal(modulo.demandaHistorica, undefined);
  assert.equal(modulo.evaluarPlan, undefined);
  assert.equal(modulo.cuantil, undefined);
  for (const archivo of ["../web/js/recomendador.js", "../web/js/asesor.js"]) {
    const sinComentarios = leer(archivo).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/.*$/gm, "$1");
    assert.ok(!/neta_mm|presiembra|niveles_plan|nivel_plan|ea_gravedad|ea_goteo|rangoEficiencia/.test(sinComentarios), `${archivo}: restos del segundo modelo`);
  }
  const fuente = leer("../web/js/recomendador.js");
  assert.match(fuente, /from "\.\.\/reglas\.js"/);
  for (const nombre of ["evaluarOpcion", "hectareasQueAlcanzan", "cobertura", "llaveLluvia"]) assert.ok(fuente.includes(nombre), nombre);
});

test("fuentes: el texto se escapa y un enlace lleva http o https, ningún otro esquema", () => {
  for (const mala of ["javascript:alert(1)", "JAVASCRIPT:alert(1)", "data:text/html,<b>x</b>", "ftp://example.org/a", "//example.org/a", "example.org", "", null, undefined])
    assert.equal(enlaceSeguro(mala), null, String(mala));
  assert.equal(enlaceSeguro("https://example.org/a?b=1"), "https://example.org/a?b=1");
  assert.equal(enlaceSeguro("http://example.org/"), "http://example.org/");
  const html = fuenteHtml('<img src=x onerror="alert(1)"> see javascript:alert(1) and https://example.org/a?b=1&c=2. End');
  assert.ok(!/<img|<script/i.test(html), html);
  assert.ok(html.includes("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"), html);
  assert.equal((html.match(/<a /g) ?? []).length, 1, html);
  assert.ok(html.includes('<a href="https://example.org/a?b=1&amp;c=2" target="_blank" rel="noopener noreferrer">'), html);
  assert.ok(!/href="(?!https?:)/i.test(html), html);
  assert.ok(html.endsWith(". End"), html);
  assert.equal(fuenteHtml(null), "");
});
