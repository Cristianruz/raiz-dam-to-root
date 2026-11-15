// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Funciones puras de web/js/suelo.js (perfil de suelo y aptitud de cada opción;
// docs/decisiones/2026-11-14_suelo_aptitud.md): las MISMAS que usa la página.
// - formato: porcentajes, rangos, capa, números y el valor que no se confunde con la cota;
// - pH: «acid», «neutral» o «alkaline» SOLO con los cortes de suelo.json; sin cortes, el número solo;
// - aptitud: el peor estado manda; textos de los motivos con el valor de la parcela, el rango y la fuente;
//   avisos de nutrientes; opción que no siembra; cultivo sin rango; criterio sin dato de la parcela;
// - perfil: barra de textura con sus porcentajes en texto, lo no mapeado, el rótulo de escala y la fuente;
// - casos null: sin archivo, bloque pedido y no entregado, parcela sin suelo, opción sin cálculo, error;
// - lectura: 404 no es lo mismo que un error de lectura.
// Datos: tests/fixtures/suelo/suelo_lleno.json (DE PRUEBA: lo genera el motor con valores de ensayo) y,
// si existe, web/data/suelo.json (lo real de hoy). Los valores esperados se leen de ahí.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  ESTADOS_APTITUD,
  NOTA_EVIDENCIA,
  ROTULO_APTITUD,
  TEXTO_NO_EN_MAPA,
  TEXTO_NO_MAPEADO,
  TEXTO_PEDIDO,
  grupoDeTextura,
  htmlNotaDeZona,
  modeloNotaDeZona,
  nombrarLista,
  perfilVacio,
  aptitudDeOpcion,
  cargarSuelo,
  formatoCapa,
  formatoNumero,
  formatoPct,
  formatoQueDistingue,
  formatoRango,
  htmlAptitud,
  htmlPerfilDeSuelo,
  leerSuelo,
  minusculaInicial,
  modeloPerfil,
  nombreDeClase,
  nombreDeCultivo,
  num,
  peorEstado,
  situacionDeAptitud,
  textoDeMotivo,
  ubicarPh,
} from "../web/js/suelo.js";

const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), "utf8"));
const LLENO = leer("./fixtures/suelo/suelo_lleno.json"); // DATOS DE PRUEBA
const URL_REAL = new URL("../web/data/suelo.json", import.meta.url);
const REAL = existsSync(URL_REAL) ? leer(URL_REAL) : null;
const FUENTE_JS = readFileSync(new URL("../web/js/suelo.js", import.meta.url), "utf8");
const MOTIVO = LLENO.motivo_pedido;
// Un suelo.json como el de hoy: sin las dos entregas (bloques en null con su motivo).
const SIN_ENTREGAS = {
  ...LLENO,
  perfil: null, perfil_motivo: MOTIVO,
  requisitos: null, requisitos_motivo: MOTIVO,
  aptitud: null, aptitud_motivo: MOTIVO, aptitud_falta: ["suelo_parcelas.csv", "suelo_requisitos.json"],
};
const PARCELAS = LLENO.perfil.parcelas;
const ESCALA = LLENO.requisitos.escala_ph;
const NOMBRES = { alfalfa: "Alfalfa", maiz_forrajero: "Forage maize", cereal_invierno: "Winter cereal", algodon: "Cotton", sorgo: "Forage sorghum" };
const TODAS = Object.entries(LLENO.aptitud).flatMap(([idParcela, ops]) => Object.keys(ops).map((idOpcion) => ({ idParcela, idOpcion })));
// Parcela con opciones en el cubo de prueba y SIN fila en suelo_parcelas.csv (ver la fixture).
const SIN_SUELO = "L0002";

/** Texto que se ve o se anuncia de un HTML: sin etiquetas, con los aria-label. */
function textoVisible(html) {
  const anunciado = [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]).join(" ");
  return `${html.replace(/<[^>]*>/g, " ")} ${anunciado}`.replace(/\s+/g, " ").trim();
}
const SIN_BASURA = /\b(undefined|NaN|null)\b|\[object/;

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------
test("num: null, vacío, booleanos y no finitos son «sin dato»", () => {
  assert.equal(num(null), null);
  assert.equal(num(undefined), null);
  assert.equal(num(""), null);
  assert.equal(num(true), null);
  assert.equal(num(NaN), null);
  assert.equal(num(Infinity), null);
  assert.equal(num("7.5"), 7.5);
  assert.equal(num(0), 0);
});

test("formatoPct: el valor ya viene en por ciento; sin dato es una raya, nunca cero", () => {
  assert.equal(formatoPct(40), "40%");
  assert.equal(formatoPct(29.5), "29.5%");
  assert.equal(formatoPct(33.333), "33.3%");
  assert.equal(formatoPct(0), "0%");
  assert.equal(formatoPct(null), "—");
  assert.equal(formatoPct(""), "—");
  assert.equal(formatoPct(NaN), "—");
  for (const p of Object.values(PARCELAS)) assert.equal(formatoPct(p.arena_pct), `${p.arena_pct}%`);
});

test("formatoRango: «min–max», un solo valor si son iguales y raya si no es un par", () => {
  assert.equal(formatoRango([6.5, 7.5]), "6.5–7.5");
  assert.equal(formatoRango([10, 12]), "10–12");
  assert.equal(formatoRango([7, 7]), "7");
  assert.equal(formatoRango([6.25, 7.125]), "6.25–7.13");
  assert.equal(formatoRango(null), "—");
  assert.equal(formatoRango([6.5]), "—");
  assert.equal(formatoRango([6.5, null]), "—");
  assert.equal(formatoRango("6.5-7.5"), "—");
  const ph = LLENO.requisitos.cultivos.alfalfa.ph;
  assert.equal(formatoRango(ph.optimo), `${ph.optimo[0]}–${ph.optimo[1]}`);
});

test("formatoCapa: «a-b» de la entrega como «a–b cm»; otra forma no se inventa", () => {
  assert.equal(formatoCapa(LLENO.perfil.profundidad_cm), `${LLENO.perfil.profundidad_cm.replace("-", "–")} cm`);
  assert.equal(formatoCapa("5-15"), "5–15 cm");
  assert.equal(formatoCapa("30"), null);
  assert.equal(formatoCapa(null), null);
  assert.equal(formatoCapa(""), null);
});

test("formatoNumero: sin ceros de relleno ni separador de miles", () => {
  assert.equal(formatoNumero(11), "11");
  assert.equal(formatoNumero(3.5), "3.5");
  assert.equal(formatoNumero(0.111), "0.11");
  assert.equal(formatoNumero(1234.5), "1234.5");
  assert.equal(formatoNumero(null), "—");
});

test("formatoQueDistingue: un valor apenas fuera del rango no se escribe como el borde del rango", () => {
  assert.equal(formatoQueDistingue(7.504, [6.5, 7.5]), "7.504");
  assert.equal(formatoQueDistingue(7.5, [6.5, 7.5]), "7.5", "igual a la cota: se escribe igual");
  assert.equal(formatoQueDistingue(7.55, [6.5, 7.5]), "7.55");
  assert.equal(formatoQueDistingue(6.4999, [6.5, 7.5]), "6.4999");
  assert.equal(formatoQueDistingue(2.00001, [2]), "2.00001");
  assert.equal(formatoQueDistingue(3.5, []), "3.5");
  assert.equal(formatoQueDistingue(null, [1]), "—");
});

test("nombres: clase de textura y cultivo para mostrar", () => {
  assert.equal(nombreDeClase("sandy clay loam"), "Sandy clay loam");
  assert.equal(nombreDeClase(""), null);
  assert.equal(nombreDeClase(null), null);
  assert.equal(nombreDeCultivo("maiz_forrajero", NOMBRES), "Forage maize");
  assert.equal(nombreDeCultivo("maiz_forrajero"), "maiz forrajero");
  assert.equal(nombreDeCultivo("nogal", NOMBRES), "nogal");
  assert.equal(minusculaInicial("Requested from the data team"), "requested from the data team");
  assert.equal(minusculaInicial(""), "");
});

// ---------------------------------------------------------------------------
// pH: la clase sale de los cortes del JSON, nunca de un número escrito aquí
// ---------------------------------------------------------------------------
test("ubicarPh: ácido, neutro o alcalino según los cortes de suelo.json", () => {
  const { acido_menor_que: acido, alcalino_mayor_que: alcalino } = ESCALA;
  assert.ok(acido < alcalino);
  assert.equal(ubicarPh(acido - 0.1, ESCALA), "acid");
  assert.equal(ubicarPh(alcalino + 0.1, ESCALA), "alkaline");
  assert.equal(ubicarPh((acido + alcalino) / 2, ESCALA), "neutral");
  assert.equal(ubicarPh(acido, ESCALA), "neutral", "el corte mismo no es ácido");
  assert.equal(ubicarPh(alcalino, ESCALA), "neutral", "el corte mismo no es alcalino");
  // Las tres parcelas de prueba caen una en cada clase.
  assert.deepEqual(Object.values(PARCELAS).map((p) => ubicarPh(p.ph, ESCALA)), ["acid", "neutral", "alkaline"]);
});

test("ubicarPh: sin cortes en el JSON no se dice ninguna clase", () => {
  const ph = PARCELAS.P0001.ph;
  assert.equal(ubicarPh(ph, null), null);
  assert.equal(ubicarPh(ph, undefined), null);
  assert.equal(ubicarPh(ph, {}), null);
  assert.equal(ubicarPh(ph, { acido_menor_que: ESCALA.acido_menor_que }), null, "un solo corte no alcanza");
  assert.equal(ubicarPh(ph, { acido_menor_que: ESCALA.alcalino_mayor_que, alcalino_mayor_que: ESCALA.acido_menor_que }), null, "cortes al revés");
  assert.equal(ubicarPh(null, ESCALA), null);
});

// ---------------------------------------------------------------------------
// Aptitud: estados, peor estado y textos de los motivos
// ---------------------------------------------------------------------------
test("las cinco etiquetas de aptitud, cada una con su símbolo", () => {
  assert.deepEqual(
    Object.fromEntries(Object.entries(ESTADOS_APTITUD).map(([k, v]) => [k, v.etiqueta])),
    {
      fits: "Fits this soil",
      tolerated: "Tolerated by this soil",
      near_limit: "Near the published limit",
      outside_range: "Outside the published range",
      no_published_range: "No published range",
    },
  );
  const iconos = Object.values(ESTADOS_APTITUD).map((e) => e.icono);
  assert.equal(new Set(iconos).size, iconos.length, "un símbolo distinto por estado");
  assert.ok(iconos.every((i) => typeof i === "string" && i.trim().length > 0));
});

test("peorEstado: fuera > tolerado > dentro; lo que no tiene rango no cuenta", () => {
  assert.equal(peorEstado([]), "no_published_range");
  assert.equal(peorEstado(null), "no_published_range");
  assert.equal(peorEstado(["no_published_range"]), "no_published_range");
  assert.equal(peorEstado(["fits", "fits"]), "fits");
  assert.equal(peorEstado(["fits", "tolerated"]), "tolerated");
  assert.equal(peorEstado(["tolerated", "fits"]), "tolerated");
  assert.equal(peorEstado(["tolerated", "outside_range", "fits"]), "outside_range");
  assert.equal(peorEstado(["tolerated", "near_limit", "fits"]), "near_limit");
  assert.equal(peorEstado(["near_limit", "outside_range"]), "outside_range");
  assert.equal(peorEstado(["no_published_range", "fits"]), "fits");
  assert.equal(peorEstado(["otro_estado", "tolerated"]), "tolerated");
});

test("peorEstado coincide con el motor en cada opción y en cada cultivo de la fixture", () => {
  assert.ok(TODAS.length > 0);
  const vistos = new Set();
  for (const { idParcela, idOpcion } of TODAS) {
    const o = LLENO.aptitud[idParcela][idOpcion];
    assert.equal(peorEstado(o.por_cultivo.map((c) => c.estado)), o.estado, `${idParcela}/${idOpcion}`);
    for (const c of o.por_cultivo) assert.equal(peorEstado(c.motivos.map((m) => m.estado)), c.estado, `${idParcela}/${idOpcion}/${c.cultivo}`);
    vistos.add(o.estado);
  }
  assert.deepEqual([...vistos].sort(), Object.keys(ESTADOS_APTITUD).sort(), "la fixture cubre los cuatro estados");
});

const motivoDe = (idParcela, idOpcion, criterio, cultivo) =>
  LLENO.aptitud[idParcela][idOpcion].por_cultivo.find((c) => !cultivo || c.cultivo === cultivo).motivos.find((m) => m.criterio === criterio);

test("textoDeMotivo, pH: dice el valor de la parcela y el rango con que se comparó", () => {
  const dentro = motivoDe("P0001", "ACTUAL", "ph");
  const tolerado = motivoDe("P0001", "maiz_forrajero", "ph");
  const fuera = motivoDe("L0001", "ACTUAL", "ph");
  assert.deepEqual([dentro.estado, tolerado.estado, fuera.estado], ["fits", "tolerated", "outside_range"]);
  assert.equal(textoDeMotivo(dentro), `pH ${dentro.valor_parcela} is within the optimal range (${formatoRango(dentro.rango_o_lista.optimo)})`);
  assert.equal(
    textoDeMotivo(tolerado),
    `pH ${tolerado.valor_parcela} is outside the optimal range (${formatoRango(tolerado.rango_o_lista.optimo)}) ` +
      `and within the tolerated range (${formatoRango(tolerado.rango_o_lista.tolerado)})`,
  );
  assert.equal(textoDeMotivo(fuera), `pH ${fuera.valor_parcela} is outside the tolerated range (${formatoRango(fuera.rango_o_lista.tolerado)})`);
});

test("textoDeMotivo, pH apenas fuera del rango: el valor no se redondea al borde", () => {
  const base = motivoDe("P0001", "ACTUAL", "ph");
  const borde = base.rango_o_lista.optimo[1];
  const texto = textoDeMotivo({ ...base, estado: "tolerated", valor_parcela: borde + 0.0004 });
  assert.ok(texto.startsWith(`pH ${borde + 0.0004} is outside the optimal range`), texto);
});

test("textoDeMotivo, textura: en la lista apta, en la limitante o en ninguna", () => {
  const apta = motivoDe("P0001", "ACTUAL", "textura");
  const limitante = motivoDe("P0001", "sorgo", "textura");
  const ninguna = motivoDe("P0002", "alfalfa", "textura");
  assert.deepEqual([apta.estado, limitante.estado, ninguna.estado], ["fits", "outside_range", "tolerated"]);
  assert.equal(textoDeMotivo(apta), `Loam texture is on the suitable list (${apta.rango_o_lista.apta.join(", ")})`);
  assert.equal(textoDeMotivo(limitante), `Loam texture is on the limiting list (${limitante.rango_o_lista.limitante.join(", ")})`);
  assert.equal(
    textoDeMotivo(ninguna),
    `Loamy sand texture is on neither list (suitable: ${ninguna.rango_o_lista.apta.join(", ")}; limiting: ${ninguna.rango_o_lista.limitante.join(", ")})`,
  );
  // Una lista vacía se dice; no queda un paréntesis en blanco.
  const sinAptas = textoDeMotivo({ ...ninguna, rango_o_lista: { apta: [], limitante: ["clay"] } });
  assert.ok(sinAptas.includes("suitable: none listed; limiting: clay"), sinAptas);
});

test("textoDeMotivo, salinidad: en el umbral o por debajo, o por encima", () => {
  const bajo = motivoDe("P0001", "ACTUAL", "salinidad");
  const alto = motivoDe("L0001", "ACTUAL", "salinidad");
  assert.deepEqual([bajo.estado, alto.estado], ["fits", "outside_range"]);
  assert.equal(textoDeMotivo(bajo), `Salinity ${bajo.valor_parcela} dS/m is at or below the threshold (${bajo.rango_o_lista.umbral_ds_m} dS/m)`);
  assert.equal(textoDeMotivo(alto), `Salinity ${alto.valor_parcela} dS/m is above the threshold (${alto.rango_o_lista.umbral_ds_m} dS/m)`);
});

test("textoDeMotivo: con un estado desconocido no afirma «dentro» ni «fuera»", () => {
  for (const [idParcela, idOpcion, criterio] of [["P0001", "ACTUAL", "ph"], ["P0001", "ACTUAL", "textura"], ["P0001", "ACTUAL", "salinidad"]]) {
    const texto = textoDeMotivo({ ...motivoDe(idParcela, idOpcion, criterio), estado: "estado_nuevo" });
    assert.ok(texto.includes("compared with") && !/\b(within|outside|above|below|suitable list|limiting list|neither)\b/.test(texto), texto);
    assert.ok(!SIN_BASURA.test(texto));
  }
});

test("textoDeMotivo: ningún motivo de la fixture deja basura ni queda vacío", () => {
  let n = 0;
  for (const { idParcela, idOpcion } of TODAS) {
    for (const c of LLENO.aptitud[idParcela][idOpcion].por_cultivo) {
      for (const m of c.motivos) {
        const texto = textoDeMotivo(m);
        assert.ok(texto.length > 0 && !SIN_BASURA.test(texto) && !texto.includes("—"), texto);
        n += 1;
      }
    }
  }
  assert.ok(n > 0);
  assert.ok(!SIN_BASURA.test(textoDeMotivo({})) && !SIN_BASURA.test(textoDeMotivo(null)), "un motivo vacío no rompe ni escribe «undefined»");
});

test("aptitudDeOpcion: estado, etiqueta y símbolo de cada opción de la fixture", () => {
  for (const { idParcela, idOpcion } of TODAS) {
    const a = aptitudDeOpcion({ suelo: LLENO, idParcela, idOpcion, nombresCultivo: NOMBRES });
    const o = LLENO.aptitud[idParcela][idOpcion];
    assert.equal(a.estado, o.estado, `${idParcela}/${idOpcion}`);
    assert.equal(a.etiqueta, ESTADOS_APTITUD[o.estado].etiqueta);
    assert.equal(a.icono, ESTADOS_APTITUD[o.estado].icono);
    assert.deepEqual(Object.keys(a), ["estado", "etiqueta", "icono", "nota", "motivos", "avisos"]);
    assert.ok(a.motivos.length > 0, `${idParcela}/${idOpcion}: el «Why?» siempre dice algo`);
    for (const m of a.motivos) {
      assert.ok(m.texto && !SIN_BASURA.test(m.texto), m.texto);
      // Un motivo que compara trae su fuente; un renglón que solo explica, no.
      if (m.criterio && m.estado) assert.ok(m.fuente, `${idParcela}/${idOpcion}: motivo sin fuente`);
    }
  }
});

test("aptitudDeOpcion: cada motivo que compara lleva la fuente de SU rango", () => {
  const a = aptitudDeOpcion({ suelo: LLENO, idParcela: "P0001", idOpcion: "ACTUAL" });
  const req = LLENO.requisitos.cultivos.alfalfa;
  assert.deepEqual(a.motivos.map((m) => [m.criterio, m.estado, m.fuente]), [
    ["ph", "fits", req.ph.fuente],
    ["textura", "fits", req.textura.fuente],
    ["salinidad", "fits", req.salinidad_umbral_ds_m.fuente],
  ]);
  assert.equal(a.nota, null);
  assert.ok(a.motivos[0].texto.startsWith("pH "), "«pH» no se escribe «PH»");
  assert.ok(a.motivos[1].texto.startsWith("Loam texture"));
});

test("aptitudDeOpcion: con dos cultivos, cada renglón dice de cuál habla y manda el peor", () => {
  const a = aptitudDeOpcion({ suelo: LLENO, idParcela: "P0002", idOpcion: "avena_maiz", nombresCultivo: NOMBRES });
  assert.equal(a.estado, "outside_range");
  assert.deepEqual(a.motivos.map((m) => [m.cultivo, m.estado]), [["cereal_invierno", "outside_range"], ["maiz_forrajero", "fits"]]);
  assert.ok(a.motivos[0].texto.startsWith("Winter cereal: pH "), a.motivos[0].texto);
  assert.ok(a.motivos[1].texto.startsWith("Forage maize: pH "), a.motivos[1].texto);
  // Sin nombres para mostrar, el id del cultivo con espacios.
  const sinNombres = aptitudDeOpcion({ suelo: LLENO, idParcela: "P0002", idOpcion: "avena_maiz" });
  assert.ok(sinNombres.motivos[0].texto.startsWith("Cereal invierno: pH "), sinNombres.motivos[0].texto);
});

test("aptitudDeOpcion: un cultivo sin rango no cuenta y se dice", () => {
  const a = aptitudDeOpcion({ suelo: LLENO, idParcela: "L0001", idOpcion: "cereal_algodon", nombresCultivo: NOMBRES });
  assert.equal(a.estado, "fits");
  const algodon = a.motivos.find((m) => m.cultivo === "algodon");
  assert.equal(algodon.texto, "Cotton: no published range for this crop");
  assert.equal(algodon.fuente, null);
  const solo = aptitudDeOpcion({ suelo: LLENO, idParcela: "P0001", idOpcion: "algodon", nombresCultivo: NOMBRES });
  assert.equal(solo.estado, "no_published_range");
  assert.deepEqual(solo.motivos.map((m) => m.texto), ["No published range for this crop"]);
});

test("aptitudDeOpcion: la opción que no siembra no se compara con el suelo", () => {
  for (const [idParcela, idOpcion] of [["P0001", "descanso"], ["L0001", "no_sembrar"]]) {
    const a = aptitudDeOpcion({ suelo: LLENO, idParcela, idOpcion });
    assert.equal(a.estado, "no_published_range");
    assert.equal(a.nota, "nothing is planted");
    assert.deepEqual(a.motivos.map((m) => m.texto), ["Nothing is planted, so there is no crop to compare with this soil"]);
    assert.deepEqual(a.avisos, []);
  }
});

test("aptitudDeOpcion: un criterio con rango y sin valor de la parcela se dice y no cuenta", () => {
  const a = aptitudDeOpcion({ suelo: LLENO, idParcela: "P0002", idOpcion: "alfalfa" });
  assert.equal(PARCELAS.P0002.salinidad_ce_ds_m, null);
  assert.equal(a.estado, "tolerated");
  const salinidad = a.motivos.filter((m) => m.criterio === "salinidad");
  assert.deepEqual(salinidad.map((m) => [m.estado, m.fuente, m.texto]), [[null, null, "Salinity not compared — not in the map"]]);
});

test("aptitudDeOpcion: avisos de nutrientes con su elemento, su texto y su fuente", () => {
  const elementos = (idParcela, idOpcion) => aptitudDeOpcion({ suelo: LLENO, idParcela, idOpcion }).avisos.map((n) => n.elemento);
  for (const { idParcela, idOpcion } of TODAS) {
    // Los textos de prueba son distintos entre sí: un aviso por elemento, en el orden del motor.
    assert.deepEqual(elementos(idParcela, idOpcion), LLENO.aptitud[idParcela][idOpcion].avisos_nutrientes.map((n) => n.elemento));
  }
  const conAvisos = TODAS.filter(({ idParcela, idOpcion }) => LLENO.aptitud[idParcela][idOpcion].avisos_nutrientes.length > 0);
  const sinAvisos = TODAS.filter(({ idParcela, idOpcion }) => LLENO.aptitud[idParcela][idOpcion].avisos_nutrientes.length === 0);
  assert.ok(conAvisos.length > 0 && sinAvisos.length > 0, "la fixture trae opciones con y sin avisos");
  const { idParcela, idOpcion } = conAvisos[0];
  const origen = LLENO.aptitud[idParcela][idOpcion].avisos_nutrientes[0];
  assert.deepEqual(aptitudDeOpcion({ suelo: LLENO, idParcela, idOpcion }).avisos[0], {
    elemento: origen.elemento, elementos: [origen.elemento], texto: origen.texto_en, fuente: origen.fuente, cultivo: origen.cultivo,
  });
});

test("aptitudDeOpcion: avisos con el mismo texto y la misma fuente van juntos, con sus elementos", () => {
  // Como el nogal real: un estudio del distrito que habla de varios elementos (DATOS DE PRUEBA derivados de la fixture).
  const base = LLENO.aptitud.P0001.ACTUAL;
  const igual = { texto_en: "TEST DATA: same note", fuente: "prueba", cultivo: "alfalfa" };
  const suelo = { ...LLENO, aptitud: { P0001: { ACTUAL: { ...base, avisos_nutrientes: [
    { ...igual, elemento: "Zn" }, { ...igual, elemento: "Fe" }, { texto_en: "TEST DATA: other", fuente: "prueba", elemento: "P", cultivo: "alfalfa" },
  ] } } } };
  const a = aptitudDeOpcion({ suelo, idParcela: "P0001", idOpcion: "ACTUAL" });
  assert.deepEqual(a.avisos.map((n) => n.elemento), ["Zn, Fe", "P"]);
  assert.ok(htmlAptitud({ suelo, idParcela: "P0001", idOpcion: "ACTUAL" }).includes("<strong>Zn, Fe</strong>: TEST DATA: same note"));
});

test("aptitud near_limit: dice que el pH queda apenas fuera del tolerado y el margen con su etiqueta", () => {
  const a = aptitudDeOpcion({ suelo: LLENO, idParcela: "P0001", idOpcion: "forraje_verano" });
  assert.equal(a.estado, "near_limit");
  assert.equal(a.etiqueta, "Near the published limit");
  const ph = a.motivos.find((m) => m.criterio === "ph");
  const margen = LLENO.margen_ph;
  assert.ok(ph.texto.includes("just outside the tolerated range") && ph.texto.includes(`map margin of ${formatoNumero(margen.valor)} (${margen.etiqueta})`), ph.texto);
  const html = htmlAptitud({ suelo: LLENO, idParcela: "P0001", idOpcion: "forraje_verano" });
  assert.ok(html.includes('data-estado="near_limit"') && textoVisible(html).includes("Near the published limit"));
});

test("htmlAptitud: lleva el rótulo de la aptitud (rango general y mundial, no un ensayo local)", () => {
  assert.equal(LLENO.rotulo_aptitud, ROTULO_APTITUD);
  assert.equal(ROTULO_APTITUD, "General published range (FAO ECOCROP, worldwide), not a local trial");
  for (const { idParcela, idOpcion } of SIEMBRAN) {
    assert.ok(textoVisible(htmlAptitud({ suelo: LLENO, idParcela, idOpcion })).includes(ROTULO_APTITUD), `${idParcela}/${idOpcion}`);
  }
});

test("aptitudDeOpcion: «descanso» dentro de una secuencia que sí siembra no dice «nothing is planted»", () => {
  const base = LLENO.aptitud.P0001.ACTUAL;
  const descanso = { cultivo: "descanso", estado: "no_published_range", nota: "nothing is planted", motivos: [], sin_dato_de_parcela: [] };
  const suelo = { ...LLENO, aptitud: { P0001: { ACTUAL: { ...base, por_cultivo: [...base.por_cultivo, descanso] } } } };
  const a = aptitudDeOpcion({ suelo, idParcela: "P0001", idOpcion: "ACTUAL" });
  assert.ok(!a.motivos.some((m) => /nothing is planted/i.test(m.texto)), JSON.stringify(a.motivos));
  assert.equal(a.estado, base.estado);
});

test("grupoDeTextura y nombrarLista: la textura por su grupo; una lista de grupos completos se dice por sus grupos", () => {
  const grupos = LLENO.requisitos.grupos_textura;
  for (const [grupo, clases] of Object.entries(grupos.valor)) {
    for (const c of clases) assert.equal(grupoDeTextura(c, grupos), grupo);
  }
  assert.equal(grupoDeTextura("loam", null), null);
  assert.equal(grupoDeTextura("otra", grupos), null);
  // Los grupos se nombran en el orden de requisitos.grupos_textura, no en el de la lista.
  assert.equal(nombrarLista([...grupos.valor.medium, ...grupos.valor.light], grupos), "light, medium groups");
  assert.equal(nombrarLista(grupos.valor.heavy, grupos), "heavy group");
  assert.equal(nombrarLista(["loam", "clay"], grupos), "loam, clay", "una lista que no es de grupos completos va por clases");
  assert.equal(nombrarLista([], grupos), "none listed");
  assert.equal(nombrarLista(["loam"], null), "loam");
});

test("perfilVacio y la parcela sin dato: «no soil data for this field» en el perfil y en la aptitud", () => {
  const vacia = { arena_pct: null, limo_pct: null, arcilla_pct: null, clase_textura: null, ph: null, carbono_organico_g_kg: null,
    nitrogeno_g_kg: null, cic_cmol_kg: null, salinidad_ce_ds_m: null, n_celdas: 0 };
  assert.ok(perfilVacio(vacia) && !perfilVacio(PARCELAS.P0001));
  const suelo = { ...LLENO, perfil: { ...LLENO.perfil, parcelas: { ...PARCELAS, L0002: vacia } } };
  assert.equal(modeloPerfil({ suelo, id: "L0002" }).situacion, "sin_parcela");
  assert.ok(textoVisible(htmlPerfilDeSuelo({ suelo, id: "L0002" })).includes("Soil profile: no soil data for this field"));
  assert.ok(textoVisible(htmlAptitud({ suelo, idParcela: "L0002", idOpcion: "ACTUAL" })).includes("Soil fit: no soil data for this field"));
});

test("nota de zona: solo cuando la mayoría de las parcelas supera el óptimo de la mayoría de los cultivos (dato del motor)", () => {
  for (const [zona, z] of Object.entries(LLENO.alcalinidad_zona)) {
    const m = modeloNotaDeZona({ suelo: LLENO, zonaId: zona });
    const html = htmlNotaDeZona({ suelo: LLENO, zonaId: zona, nombreZona: "Test area" });
    if (z.mayoria) {
      assert.deepEqual(m, { n_con_ph: z.n_con_ph, n_sobre_optimo: z.n_sobre_optimo, n_cultivos: z.n_cultivos });
      const t = textoVisible(html);
      assert.ok(t.includes(`${z.n_sobre_optimo} of ${z.n_con_ph} mapped fields in Test area`) && t.includes(`most of the ${z.n_cultivos} crops`), t);
      assert.ok(/evidence to weigh, not as a filter/.test(t));
    } else {
      assert.equal(m, null);
      assert.equal(html, "");
    }
  }
  assert.ok(Object.values(LLENO.alcalinidad_zona).some((z) => z.mayoria) && Object.values(LLENO.alcalinidad_zona).some((z) => !z.mayoria));
  assert.equal(htmlNotaDeZona({ suelo: { ...LLENO, alcalinidad_zona: null }, zonaId: "lazaro_cardenas" }), "");
});

test("aptitudDeOpcion: null cuando no hay aptitud que mostrar", () => {
  assert.equal(aptitudDeOpcion({ suelo: null, idParcela: "P0001", idOpcion: "ACTUAL" }), null);
  assert.equal(aptitudDeOpcion({ suelo: SIN_ENTREGAS, idParcela: "P0001", idOpcion: "ACTUAL" }), null);
  assert.equal(aptitudDeOpcion({ suelo: LLENO, idParcela: SIN_SUELO, idOpcion: "ACTUAL" }), null);
  assert.equal(aptitudDeOpcion({ suelo: LLENO, idParcela: "P0001", idOpcion: "opcion_que_no_existe" }), null);
  assert.equal(aptitudDeOpcion({ suelo: {}, idParcela: "P0001", idOpcion: "ACTUAL" }), null);
  assert.equal(aptitudDeOpcion(), null);
  if (REAL && !REAL.aptitud) assert.equal(aptitudDeOpcion({ suelo: REAL, idParcela: "P0001", idOpcion: "ACTUAL" }), null);
});

test("situacionDeAptitud: dice por qué no hay aptitud", () => {
  const de = (args) => situacionDeAptitud(args);
  assert.deepEqual(de({ suelo: null, idParcela: "P0001", idOpcion: "ACTUAL" }), { situacion: "sin_archivo", motivo: "not available yet" });
  assert.deepEqual(de({ suelo: SIN_ENTREGAS, idParcela: "P0001", idOpcion: "ACTUAL" }), { situacion: "pendiente", motivo: minusculaInicial(MOTIVO) });
  assert.equal(minusculaInicial(MOTIVO), TEXTO_PEDIDO, "el motivo del motor es el texto de la página");
  assert.deepEqual(de({ suelo: LLENO, idParcela: SIN_SUELO, idOpcion: "ACTUAL" }), { situacion: "sin_parcela", motivo: "no soil data for this field" });
  assert.deepEqual(de({ suelo: LLENO, idParcela: "P0001", idOpcion: "x" }), { situacion: "sin_opcion", motivo: "not computed for this option" });
  assert.deepEqual(de({ suelo: LLENO, idParcela: "P0001", idOpcion: "ACTUAL", error: "HTTP 500" }), { situacion: "error", motivo: "could not be loaded (HTTP 500)" });
  assert.equal(de({ suelo: LLENO, idParcela: "P0001", idOpcion: "ACTUAL" }).situacion, "ok");
  // Un bloque en null sin motivo escrito usa el texto fijo.
  assert.equal(de({ suelo: { aptitud: null }, idParcela: "P0001", idOpcion: "ACTUAL" }).motivo, TEXTO_PEDIDO);
});

// ---------------------------------------------------------------------------
// HTML de la aptitud
// ---------------------------------------------------------------------------
// Opciones que no siembran nada (descanso, secuencia vacía): su fila es una línea sin insignia (ver abajo).
const NADA_SEMBRADO = TODAS.filter(({ idParcela, idOpcion }) => LLENO.aptitud[idParcela][idOpcion].nota === "nothing is planted");
const SIEMBRAN = TODAS.filter((x) => !NADA_SEMBRADO.includes(x));

test("htmlAptitud: la opción que no siembra dice «nothing is planted» en una línea, sin insignia ni rótulo", () => {
  assert.ok(NADA_SEMBRADO.length > 0, "la fixture trae opciones que no siembran");
  for (const { idParcela, idOpcion } of NADA_SEMBRADO) {
    const html = htmlAptitud({ suelo: LLENO, idParcela, idOpcion });
    const texto = textoVisible(html);
    assert.ok(texto.startsWith("Soil fit: nothing is planted"), texto);
    assert.ok(!html.includes("suelo-insignia") && !html.includes(ROTULO_APTITUD) && html.includes('data-nada-sembrado="si"'));
  }
});

test("htmlAptitud: estado en texto y símbolo, y un «Why?» con motivos y fuentes", () => {
  for (const { idParcela, idOpcion } of SIEMBRAN) {
    const html = htmlAptitud({ suelo: LLENO, idParcela, idOpcion, nombresCultivo: NOMBRES });
    const a = aptitudDeOpcion({ suelo: LLENO, idParcela, idOpcion, nombresCultivo: NOMBRES });
    const texto = textoVisible(html);
    assert.ok(!SIN_BASURA.test(texto), `${idParcela}/${idOpcion}: ${texto}`);
    assert.ok(html.includes(`data-estado="${a.estado}"`));
    assert.ok(texto.includes(`Soil fit: ${a.icono} ${a.etiqueta}`), texto);
    assert.equal((html.match(/<details/g) ?? []).length, 1);
    assert.ok(/<summary>Why\?/.test(html));
    for (const m of a.motivos) {
      assert.ok(texto.includes(m.texto), m.texto);
      if (m.fuente) assert.ok(texto.includes(`Source: ${m.fuente}`), m.fuente);
    }
    for (const n of a.avisos) assert.ok(texto.includes(n.texto) && texto.includes(`Source: ${n.fuente}`), n.texto);
    assert.equal(/Nutrient notes? inside/.test(texto), a.avisos.length > 0, "la fila avisa si hay notas de nutrientes adentro");
    assert.ok(texto.includes(NOTA_EVIDENCIA));
    // El símbolo es decorativo para el lector de pantalla: el estado está en el texto.
    assert.ok(html.includes(`<span class="suelo-icono" aria-hidden="true">${a.icono}</span> ${a.etiqueta}`));
  }
});

test("htmlAptitud: singular y plural de las notas de nutrientes salen del conteo de los datos", () => {
  const dos = htmlAptitud({ suelo: LLENO, idParcela: "P0001", idOpcion: "ACTUAL" });
  assert.equal(LLENO.aptitud.P0001.ACTUAL.avisos_nutrientes.length, 2);
  assert.ok(textoVisible(dos).includes("Nutrient notes inside"));
  const una = structuredClone(LLENO);
  una.aptitud.P0001.ACTUAL.avisos_nutrientes.length = 1;
  assert.ok(textoVisible(htmlAptitud({ suelo: una, idParcela: "P0001", idOpcion: "ACTUAL" })).includes("Nutrient note inside"));
});

test("htmlAptitud: lo pedido y no entregado, la parcela sin suelo y el error se dicen en una línea", () => {
  const casos = [
    [{ suelo: SIN_ENTREGAS, idParcela: "P0001", idOpcion: "ACTUAL" }, "Soil fit: requested from the data team — not delivered yet", "pendiente"],
    [{ suelo: null, idParcela: "P0001", idOpcion: "ACTUAL" }, "Soil fit: not available yet", "sin_archivo"],
    [{ suelo: LLENO, idParcela: SIN_SUELO, idOpcion: "ACTUAL" }, "Soil fit: no soil data for this field", "sin_parcela"],
    [{ suelo: LLENO, idParcela: "P0001", idOpcion: "x" }, "Soil fit: not computed for this option", "sin_opcion"],
    [{ suelo: null, idParcela: "P0001", idOpcion: "ACTUAL", error: "HTTP 500" }, "Soil fit: could not be loaded (HTTP 500)", "error"],
  ];
  for (const [args, esperado, situacion] of casos) {
    const html = htmlAptitud(args);
    assert.ok(textoVisible(html).endsWith(esperado), textoVisible(html));
    assert.ok(html.includes(`data-situacion="${situacion}"`) && !html.includes("<details"));
    assert.ok(!SIN_BASURA.test(textoVisible(html)));
  }
  if (REAL && !REAL.aptitud) {
    assert.ok(textoVisible(htmlAptitud({ suelo: REAL, idParcela: "P0001", idOpcion: "ACTUAL" })).endsWith(`Soil fit: ${minusculaInicial(REAL.aptitud_motivo)}`));
  }
});

// ---------------------------------------------------------------------------
// Perfil de suelo
// ---------------------------------------------------------------------------
test("modeloPerfil: textura, fracciones, pH con su clase y lo demás que traiga la entrega", () => {
  const m = modeloPerfil({ suelo: LLENO, id: "P0001" });
  const p = PARCELAS.P0001;
  assert.equal(m.situacion, "ok");
  assert.equal(m.clase, "Loam");
  assert.equal(m.grupo, "medium");
  assert.equal(m.grupoEtiqueta, LLENO.requisitos.grupos_textura.etiqueta);
  assert.deepEqual(m.coincidencia, { valor: LLENO.coincidencia_textura.valor, etiqueta: LLENO.coincidencia_textura.etiqueta, fuente: LLENO.coincidencia_textura.fuente });
  assert.deepEqual(m.fracciones.map((f) => [f.nombre, f.valor, f.texto]), [
    ["Sand", p.arena_pct, `${p.arena_pct}%`], ["Silt", p.limo_pct, `${p.limo_pct}%`], ["Clay", p.arcilla_pct, `${p.arcilla_pct}%`],
  ]);
  assert.deepEqual(m.ph, { texto: String(p.ph), clase: "acid" });
  assert.deepEqual(m.datos.map((d) => d.etiqueta), ["Organic carbon", "Total nitrogen", "Cation exchange capacity", "Salinity (electrical conductivity)"]);
  assert.deepEqual(m.datos.map((d) => d.texto), [`${p.carbono_organico_g_kg} g/kg`, `${p.nitrogeno_g_kg} g/kg`, `${p.cic_cmol_kg} cmol(+)/kg`, `${p.salinidad_ce_ds_m} dS/m`]);
  assert.equal(m.capa, formatoCapa(LLENO.perfil.profundidad_cm));
  assert.equal(m.celdas, p.n_celdas);
  assert.equal(m.rotulo, LLENO.rotulo);
  assert.equal(m.fuente, LLENO.perfil.fuente);
  assert.equal(m.fecha, LLENO.perfil.fecha);
});

test("modeloPerfil: lo que la entrega trae vacío se dice «not in the map», nunca un cero", () => {
  const m = modeloPerfil({ suelo: LLENO, id: "P0002" });
  const p = PARCELAS.P0002;
  assert.deepEqual([p.nitrogeno_g_kg, p.cic_cmol_kg, p.salinidad_ce_ds_m], [null, null, null]);
  assert.deepEqual(m.datos, [
    { etiqueta: "Organic carbon", texto: `${p.carbono_organico_g_kg} g/kg`, falta: false },
    { etiqueta: "Total nitrogen", texto: TEXTO_NO_EN_MAPA, falta: true },
    { etiqueta: "Cation exchange capacity", texto: TEXTO_NO_EN_MAPA, falta: true },
    { etiqueta: "Salinity (electrical conductivity)", texto: TEXTO_NO_EN_MAPA, falta: true },
  ]);
  assert.equal(TEXTO_NO_EN_MAPA, "not in the map");
  assert.equal(m.ph.clase, "neutral");
});

test("modeloPerfil: sin cortes de pH en el JSON, el pH va sin clase", () => {
  const sinEscala = structuredClone(LLENO);
  delete sinEscala.requisitos.escala_ph;
  assert.deepEqual(modeloPerfil({ suelo: sinEscala, id: "P0001" }).ph, { texto: String(PARCELAS.P0001.ph), clase: null });
  const sinRequisitos = { ...LLENO, requisitos: null };
  assert.equal(modeloPerfil({ suelo: sinRequisitos, id: "L0001" }).ph.clase, null);
  const html = htmlPerfilDeSuelo({ suelo: sinRequisitos, id: "L0001" });
  assert.ok(!/acid|neutral|alkaline/.test(textoVisible(html)), "sin cortes no se escribe ninguna clase");
  assert.ok(textoVisible(html).includes(`pH (in water) ${PARCELAS.L0001.ph}`));
});

test("modeloPerfil: una fracción sin dato deja la barra fuera (no se dibuja un cero)", () => {
  const roto = structuredClone(LLENO);
  roto.perfil.parcelas.P0001.limo_pct = null;
  assert.equal(modeloPerfil({ suelo: roto, id: "P0001" }).fracciones, null);
  const html = htmlPerfilDeSuelo({ suelo: roto, id: "P0001" });
  assert.ok(!html.includes("suelo-barra") && textoVisible(html).includes("Sand, silt and clay shares: no data"));
  assert.ok(!SIN_BASURA.test(textoVisible(html)));
});

test("modeloPerfil: si cada parcela trae su capa, se usa la suya", () => {
  const porParcela = structuredClone(LLENO);
  porParcela.perfil.profundidad_cm = null;
  porParcela.perfil.parcelas.P0001.profundidad_cm = "5-15";
  assert.equal(modeloPerfil({ suelo: porParcela, id: "P0001" }).capa, "5–15 cm");
  assert.equal(modeloPerfil({ suelo: porParcela, id: "P0002" }).capa, null);
  assert.ok(!textoVisible(htmlPerfilDeSuelo({ suelo: porParcela, id: "P0002" })).includes("layer"));
});

test("htmlPerfilDeSuelo: barra de textura accesible con sus porcentajes en texto", () => {
  for (const [id, p] of Object.entries(PARCELAS)) {
    const html = htmlPerfilDeSuelo({ suelo: LLENO, id });
    const texto = textoVisible(html);
    assert.ok(!SIN_BASURA.test(texto), `${id}: ${texto}`);
    const descripcion = `Texture shares: Sand ${p.arena_pct}%, Silt ${p.limo_pct}%, Clay ${p.arcilla_pct}%`;
    assert.ok(html.includes(`role="img" aria-label="${descripcion}"`), html);
    // Los porcentajes están además en texto visible, junto a la clave de cada tramo.
    for (const [nombre, valor] of [["Sand", p.arena_pct], ["Silt", p.limo_pct], ["Clay", p.arcilla_pct]]) {
      assert.ok(html.includes(`${nombre} <strong>${valor}%</strong>`), `${id}: ${nombre}`);
    }
    // Un tramo por fracción, con el ancho que da el dato.
    assert.deepEqual([...html.matchAll(/suelo-tramo suelo-tramo--(\w+)" style="flex-grow:([\d.]+)"/g)].map((x) => [x[1], Number(x[2])]),
      [["arena", p.arena_pct], ["limo", p.limo_pct], ["arcilla", p.arcilla_pct]]);
    // La textura va por su grupo (con la etiqueta del reparto); la clase exacta, en el detalle plegado.
    const grupo = grupoDeTextura(p.clase_textura, LLENO.requisitos.grupos_textura);
    assert.ok(texto.includes(`Texture group: ${grupo} ${LLENO.requisitos.grupos_textura.etiqueta}`), texto);
    assert.ok(html.includes('<details class="suelo-clase-exacta"><summary>Exact texture class</summary>') && texto.includes(`${nombreDeClase(p.clase_textura)} (USDA class).`));
    assert.ok(texto.includes(TEXTO_NO_MAPEADO));
    assert.ok(texto.includes(`${LLENO.rotulo}. Mean of ${p.n_celdas} map cells inside the field.`), texto);
    assert.ok(texto.includes(`Source: ${LLENO.perfil.fuente} (${LLENO.perfil.archivo}, ${LLENO.perfil.fecha})`));
    assert.ok(html.includes(`<span lang="${LLENO.idioma_fuentes}">`), "la fuente (línea de LEEME) va marcada con su idioma");
    assert.ok(texto.includes(`Soil profile (${formatoCapa(LLENO.perfil.profundidad_cm)} layer)`));
  }
});

test("htmlPerfilDeSuelo: nitrógeno, CIC y salinidad con su valor, o «not in the map» si el mapa no los trae", () => {
  const completo = textoVisible(htmlPerfilDeSuelo({ suelo: LLENO, id: "P0001" }));
  const parcial = textoVisible(htmlPerfilDeSuelo({ suelo: LLENO, id: "P0002" }));
  for (const rotulo of ["Total nitrogen", "Cation exchange capacity", "Salinity (electrical conductivity)"]) {
    assert.ok(completo.includes(rotulo) && !completo.includes(`${rotulo} not in the map`), rotulo);
    assert.ok(parcial.includes(`${rotulo} not in the map`), `${rotulo}: la parcela no lo trae`);
  }
  assert.ok(completo.includes("Phosphorus, potassium, iron, zinc: needs a soil test"));
  assert.ok(completo.includes("Organic carbon") && parcial.includes("Organic carbon"));
  assert.ok(completo.includes(`pH (in water) ${PARCELAS.P0001.ph} acid`), completo);
});

test("htmlPerfilDeSuelo: una celda se escribe en singular (el conteo sale del dato)", () => {
  const una = structuredClone(LLENO);
  una.perfil.parcelas.P0001.n_celdas = 1;
  assert.ok(textoVisible(htmlPerfilDeSuelo({ suelo: una, id: "P0001" })).includes("Mean of 1 map cell inside the field."));
});

test("htmlPerfilDeSuelo: lo pedido y no entregado, la parcela sin suelo y el error se dicen", () => {
  const casos = [
    [{ suelo: SIN_ENTREGAS, id: "P0001" }, "Soil profile: requested from the data team — not delivered yet", "pendiente"],
    [{ suelo: null, id: "P0001" }, "Soil profile: not available yet", "sin_archivo"],
    [{ suelo: LLENO, id: SIN_SUELO }, "Soil profile: no soil data for this field", "sin_parcela"],
    [{ suelo: LLENO, id: undefined }, "Soil profile: no soil data for this field", "sin_parcela"],
    [{ suelo: null, id: "P0001", error: "invalid JSON: x" }, "Soil profile: could not be loaded (invalid JSON: x)", "error"],
  ];
  for (const [args, esperado, situacion] of casos) {
    const html = htmlPerfilDeSuelo(args);
    assert.ok(textoVisible(html).endsWith(esperado), textoVisible(html));
    assert.ok(html.includes(`data-situacion="${situacion}"`) && !html.includes("suelo-barra"));
    assert.ok(!SIN_BASURA.test(textoVisible(html)));
  }
  assert.equal(modeloPerfil().situacion, "sin_archivo");
});

test("con el suelo.json real de hoy: si no hay entregas, la ficha lo dice", { skip: !REAL && "web/data/suelo.json aún no existe" }, () => {
  if (REAL.perfil) {
    const id = Object.keys(REAL.perfil.parcelas)[0];
    assert.ok(!SIN_BASURA.test(textoVisible(htmlPerfilDeSuelo({ suelo: REAL, id }))));
    return;
  }
  assert.equal(REAL.perfil_motivo, "Requested from the data team — not delivered yet");
  assert.equal(textoVisible(htmlPerfilDeSuelo({ suelo: REAL, id: "P0001" })).replace(/^\S+\s/, ""), "Soil profile: requested from the data team — not delivered yet");
});

test("el HTML escapa lo que viene de los datos", () => {
  const malo = structuredClone(LLENO);
  malo.perfil.fuente = 'Mapa <script>alert("x")</script> & más';
  malo.aptitud.P0001.ACTUAL.avisos_nutrientes[0].texto_en = "<img src=x onerror=alert(1)>";
  const perfil = htmlPerfilDeSuelo({ suelo: malo, id: "P0001" });
  const aptitud = htmlAptitud({ suelo: malo, idParcela: "P0001", idOpcion: "ACTUAL" });
  assert.ok(!perfil.includes("<script>") && perfil.includes("&lt;script&gt;") && perfil.includes("&amp; más"));
  assert.ok(!aptitud.includes("<img") && aptitud.includes("&lt;img"));
});

// ---------------------------------------------------------------------------
// Lectura de suelo.json: 404 no es un error de lectura
// ---------------------------------------------------------------------------
async function conFetch(simulado, accion) {
  const original = globalThis.fetch;
  globalThis.fetch = simulado;
  try {
    return await accion();
  } finally {
    globalThis.fetch = original;
  }
}
const respuesta = (status, cuerpo) => async () => ({
  status,
  ok: status >= 200 && status < 300,
  json: async () => {
    if (cuerpo instanceof Error) throw cuerpo;
    return cuerpo;
  },
});

test("cargarSuelo: el objeto si existe y null si no existe (404)", async () => {
  assert.deepEqual(await conFetch(respuesta(200, SIN_ENTREGAS), () => cargarSuelo("data/suelo.json")), SIN_ENTREGAS);
  assert.equal(await conFetch(respuesta(404, null), () => cargarSuelo("data/suelo.json")), null);
  assert.deepEqual(await conFetch(respuesta(404, null), () => leerSuelo("data/suelo.json")), { estado: "ausente", detalle: "HTTP 404" });
});

test("cargarSuelo: otro código HTTP, la red caída o un JSON roto NO son «no existe»", async () => {
  await assert.rejects(conFetch(respuesta(500, null), () => cargarSuelo("data/suelo.json")), /data\/suelo\.json: HTTP 500/);
  await assert.rejects(conFetch(async () => { throw new Error("sin red"); }, () => cargarSuelo("data/suelo.json")), /network error: sin red/);
  await assert.rejects(conFetch(respuesta(200, new SyntaxError("token inesperado")), () => cargarSuelo("data/suelo.json")), /invalid JSON: token inesperado/);
  await assert.rejects(conFetch(respuesta(200, []), () => cargarSuelo("data/suelo.json")), /unexpected content/);
  await assert.rejects(conFetch(respuesta(200, null), () => cargarSuelo("data/suelo.json")), /unexpected content/);
  assert.deepEqual(await conFetch(respuesta(503, null), () => leerSuelo()), { estado: "error", detalle: "HTTP 503" });
  // El detalle del error es lo que la página escribe.
  const detalle = (await conFetch(respuesta(500, null), () => leerSuelo())).detalle;
  assert.ok(textoVisible(htmlPerfilDeSuelo({ suelo: null, id: "P0001", error: detalle })).endsWith("Soil profile: could not be loaded (HTTP 500)"));
});

test("cargarSuelo: por omisión lee data/suelo.json y no usa la caché del navegador", async () => {
  let visto = null;
  await conFetch(async (url, opciones) => {
    visto = { url, opciones };
    return (await respuesta(200, LLENO)())
  }, () => cargarSuelo());
  assert.deepEqual(visto, { url: "data/suelo.json", opciones: { cache: "no-cache" } });
});

// ---------------------------------------------------------------------------
// Reglas del texto de la interfaz
// ---------------------------------------------------------------------------
test("la aptitud es evidencia: el módulo nunca dice «best» ni «recommended» ni promete nada", () => {
  // Fuera los comentarios; quedan el código y las cadenas.
  const codigo = FUENTE_JS.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.ok(!/\b(best|recommend\w*|first|only|sav(e|es|ed|ing|ings)|guarantee\w*|should plant)\b/i.test(codigo));
  const todo = TODAS.map(({ idParcela, idOpcion }) => textoVisible(htmlAptitud({ suelo: LLENO, idParcela, idOpcion }))).join(" ") +
    Object.keys(PARCELAS).map((id) => textoVisible(htmlPerfilDeSuelo({ suelo: LLENO, id }))).join(" ");
  // (Los textos «TEST DATA» de la fixture son de prueba; aquí solo cuentan las palabras del módulo.)
  assert.ok(!/\b(best|recommended)\b/i.test(todo));
  assert.ok(NOTA_EVIDENCIA.includes("does not replace the judgment of the farmer or the technician"));
});

test("el módulo no trae cifras: sus textos fijos no tienen dígitos", () => {
  const fijos = [TEXTO_NO_MAPEADO, TEXTO_PEDIDO, TEXTO_NO_EN_MAPA, ROTULO_APTITUD, NOTA_EVIDENCIA,
    ...Object.values(ESTADOS_APTITUD).flatMap((e) => [e.etiqueta, e.icono])];
  for (const t of fijos) assert.ok(!/\d/.test(t), t);
  assert.equal(TEXTO_NO_MAPEADO, "Phosphorus, potassium, iron, zinc: needs a soil test");
  assert.ok(FUENTE_JS.startsWith("// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026"));
});
