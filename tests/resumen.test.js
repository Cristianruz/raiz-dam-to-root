// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Pruebas de las funciones puras de web/js/resumen.js y web/js/estado_gemelo.js (sin DOM, con Node).
// Conectada al comando único (node --test tests/*.test.js, paso de construir.py).
// Uso:  node --test tests/resumen.test.js
// Los números de este archivo son DATOS DE PRUEBA, no cifras del proyecto.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const RAIZ = new URL("..", import.meta.url).href.replace(/\/$/, "");
const { fraseResumen, casoResumen, modeloNDVI, idDeHash, hashDe, formatoHectareas, hectareasTexto } = await import(`${RAIZ}/web/js/resumen.js`);
const { modeloEstado, NOTA_GEMELO } = await import(`${RAIZ}/web/js/estado_gemelo.js`);
const { evaluarOpcion } = await import(`${RAIZ}/web/reglas.js`);

const parcela = { id: "T1", area_ha: 10, abstencion: false, cultivo_actual: "maiz_forrajero" };
// Opción ACTUAL de un cultivo anual: su plazo (agua.plazo_anios, plazo_restante) es de un año, como en el contrato.
const opcion = { id: "ACTUAL", nombre: "Current rotation: Forage maize", secuencia: ["maiz_forrajero"],
  agua: { lamina_bruta: { 0: { p10: 4, p50: 5, p90: 6 }, "-20": { p10: 5, p50: 6, p90: 7 } },
    plazo_anios: { min: 1, max: 1 }, plazo_restante: { min: 1, max: 1 }, nota_plazo: null } };
const ANUAL = " Forage maize ties up water for one season.";
const con = (D, r = 0, p = parcela, o = opcion) => ({ parcela: p, opcionActual: o, evaluacion: evaluarOpcion(o, p.area_ha, D, r, Boolean(p.abstencion)), D });

test("fraseResumen: parcial, con la plantilla del contrato", () => {
  assert.equal(casoResumen(con(2.5)), "parcial");
  assert.equal(fraseResumen(con(2.5)), `With 2.5 thousand m³/ha, the current rotation (Forage maize) has enough water for 5 of 10 hectares.${ANUAL}`);
  assert.equal(fraseResumen(con(3, -20)), `With 3 thousand m³/ha, the current rotation (Forage maize) has enough water for 5 of 10 hectares.${ANUAL}`);
  assert.match(fraseResumen(con(0)), /^With 0 thousand m³\/ha, .* for 0 of 10 hectares\. Forage maize ties up water for one season\.$/);
});

test("fraseResumen: completa (verde) y completa (ámbar, lo dice)", () => {
  assert.equal(casoResumen(con(6)), "completa");
  assert.equal(fraseResumen(con(6)), `With 6 thousand m³/ha, the current rotation (Forage maize) has enough water for all 10 hectares.${ANUAL}`);
  assert.equal(con(5.5).evaluacion.semaforo, "ambar");
  assert.match(fraseResumen(con(5.5)), /for all 10 hectares at the median estimate of its need, not at the high estimate\. Forage maize ties up water for one season\.$/);
});

test("fraseResumen: lámina cero y parcela abstenida", () => {
  const descanso = { id: "ACTUAL", nombre: "Current rotation: Do not plant / standing stubble", secuencia: ["descanso"], agua: { lamina_bruta: { 0: { p10: 0, p50: 0, p90: 0 } } } };
  assert.equal(casoResumen(con(3, 0, parcela, descanso)), "sin_riego");
  assert.equal(fraseResumen(con(3, 0, parcela, descanso)), "The current rotation (Do not plant / standing stubble) needs no irrigation, so the water allocation does not limit its 10 hectares.");
  assert.equal(fraseResumen(con(0, 0, parcela, descanso)), fraseResumen(con(12, 0, parcela, descanso)), "sin riego no depende de la dotación");
  const abstenida = { ...parcela, abstencion: true };
  assert.equal(casoResumen({ parcela: abstenida, opcionActual: null, evaluacion: null, D: 3 }), "abstenida");
  assert.match(fraseResumen({ parcela: abstenida, opcionActual: null, evaluacion: null, D: 3 }), /^Not classified — check with a technician\./);
  assert.doesNotMatch(fraseResumen({ parcela: abstenida, D: 3 }), /\d/, "la frase de una parcela abstenida no lleva cifras");
});

test("fraseResumen: sin opción ACTUAL, sin dotación o sin argumentos lo dice y no rompe", () => {
  for (const a of [undefined, {}, { parcela, opcionActual: null, evaluacion: null, D: 3 }, { ...con(3), D: null }, { ...con(3), D: NaN }]) {
    assert.equal(casoResumen(a), "sin_calculo");
    assert.match(fraseResumen(a), /^No water need is computed/);
  }
});

test("fraseResumen: nunca recomienda, ni compara ingresos, ni usa palabras vetadas; sin «undefined» ni «NaN»", () => {
  const vetadas = /\b(best|better|recommend\w*|should|income|profit|margin|first|only|sav(e|es|ed|ing|ings))\b|\$|undefined|NaN|null/i;
  for (let D = 0; D <= 12; D += 0.5) for (const r of [0, -20]) assert.doesNotMatch(fraseResumen(con(D, r)), vetadas);
});

test("fraseResumen: nombre de la rotación y formato de la app", () => {
  const sinNombre = { ...opcion, nombre: undefined, secuencia: ["maiz_forrajero", "cereal_invierno"] };
  assert.match(fraseResumen(con(2.5, 0, parcela, sinNombre)), /\(maiz forrajero → cereal invierno\)/);
  assert.match(fraseResumen(con(2.5, 0, parcela, { ...opcion, nombre: "", secuencia: [] })), /\(maiz forrajero\)/);
  assert.equal(fraseResumen({ ...con(2.5), formato: (v, k) => `<${k}:${v}>` }),
    `With <d:2.5> thousand m³/ha, the current rotation (Forage maize) has enough water for <ha:5> of <area:10> hectares.${ANUAL}`);
  // Punto 6 de la revisión: lo que alcanza y el área con el mismo formato (los decimales del área), hacia abajo.
  assert.match(fraseResumen(con(1, 0, { ...parcela, area_ha: 7.953 })), /for 1\.59 of 7\.953 hectares\. Forage maize/, "mismo formato para los dos números");
});

test("idDeHash y hashDe", () => {
  const ids = new Set(["P0757", "L0175"]);
  for (const h of ["#P0757", "#p0757", "P0757", "p0757", "  #p0757  ", "#P0757 "]) assert.equal(idDeHash(h, ids), "P0757", h);
  assert.equal(idDeHash("#l0175", ids), "L0175");
  for (const h of ["#P9999", "", "#", null, undefined, "#principal", "#%", "#P0757x"]) assert.equal(idDeHash(h, ids), null, String(h));
  assert.equal(idDeHash("#p0757", ["P0757"]), "P0757");
  assert.equal(idDeHash("#p0757", new Map([["P0757", {}]])), "P0757");
  assert.equal(idDeHash("#p0757", { P0757: true }), "P0757");
  assert.equal(idDeHash("#p0757", null), null);
  assert.equal(hashDe("P0757"), "#P0757");
  assert.equal(hashDe(null), "");
  assert.equal(hashDe(""), "");
  assert.equal(idDeHash(hashDe("Ñ 1/a"), ["ñ 1/a"]), "ñ 1/a", "ida y vuelta con un id que se codifica");
});

test("modeloNDVI: huecos, corridas, extremos y umbrales", () => {
  const meses = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  const m = modeloNDVI({ serie: [0.5, null, 0.3, 0.7, null, 0.2], meses, umbrales: { verde: { valor: 0.4 }, desnudo: 0.2 } });
  assert.equal(m.disponible, true); assert.equal(m.conDatos, true);
  assert.deepEqual(m.huecos, [1, 4]);
  assert.deepEqual(m.tramos, [[0], [2, 3], [5]]);
  assert.equal(m.ultimo, 5); assert.equal(m.maximo.i, 3); assert.equal(m.minimo.i, 5);
  assert.deepEqual(m.dominio, [0, 1]);
  assert.deepEqual(m.umbrales.map((u) => [u.clave, u.valor, u.rotulo]), [["verde", 0.4, "green ≥ 0.4"], ["desnudo", 0.2, "bare < 0.2"]]);
  assert.deepEqual(m.puntos.map((p) => p.inicial).join(""), "ONDJFM");
  assert.equal(m.puntos[0].largo, "October 2025"); assert.equal(m.puntos[3].enero, true); assert.equal(m.puntos[3].anio, 2026);
});

test("modeloNDVI: lo que no es un NDVI es un hueco; sin serie no hay gráfica; un negativo extiende la base", () => {
  const meses = ["2026-01", "2026-02", "2026-03"];
  assert.deepEqual(modeloNDVI({ serie: [0.1, 5, "0.3"], meses }).huecos, [1, 2]);
  assert.deepEqual(modeloNDVI({ serie: [0.1], meses }).huecos, [1, 2], "una serie corta deja huecos, no ceros");
  assert.equal(modeloNDVI({ serie: undefined, meses }).disponible, false);
  assert.equal(modeloNDVI({ serie: [null, null, null], meses }).conDatos, false);
  assert.equal(modeloNDVI({ serie: [0.1], meses: [] }).disponible, false);
  assert.equal(modeloNDVI().disponible, false);
  assert.deepEqual(modeloNDVI({ serie: [0.1, -0.25, 0.3], meses }).dominio, [-0.3, 1]);
  assert.deepEqual(modeloNDVI({ serie: [0.1, 0.2, 0.3], meses, umbrales: { ndvi_verde: 0.4, suelo_desnudo: { valor: 2 } } }).umbrales.map((u) => u.clave), ["verde"], "un umbral fuera de −1…1 no se dibuja");
  assert.equal(modeloNDVI({ serie: [0.1], meses: ["sin forma"] }).puntos[0].largo, "sin forma");
});

test("modeloEstado con los datos publicados (web/data): fechas del manifest y conteos del cubo", () => {
  const leer = (n) => JSON.parse(fs.readFileSync(new URL(`${RAIZ}/web/data/${n}`), "utf-8"));
  const [manifest, cubo, gemelo] = [leer("manifest.json"), leer("cubo.json"), leer("gemelo.json")];
  const zona = Object.keys(cubo.zonas)[0];
  const m = modeloEstado({ manifest, cubo, gemelo, zonaId: zona });
  assert.equal(m.reconstruido.iso, cubo.meta.generado);
  assert.equal(m.fuentesDisponibles, true);
  assert.deepEqual(m.grupos.map((g) => g.titulo), ["Observed", "Modeled", "Your scenario"]);
  for (const z of m.zonas) {
    const c = cubo.zonas[z.id].conteos;
    assert.equal(z.total, c.total); assert.equal(z.clasificadas, c.total - c.abstenida); assert.equal(z.enVista, z.id === zona);
  }
  assert.equal(m.total.total, cubo.zona.conteos.total);
  const fechasManifest = new Set(manifest.fuentes_de_origen.map((f) => f.fecha));
  for (const g of m.grupos.slice(0, 2)) for (const f of g.filas) {
    assert.ok(f.archivos.length > 0, `${f.clave}: sin archivos`);
    assert.ok(fechasManifest.has(f.fechas.desde.iso) && fechasManifest.has(f.fechas.hasta.iso), `${f.clave}: fecha que no está en el manifest`);
    assert.ok(f.fuente, `${f.clave}: sin fuente`);
    for (const a of f.archivos) assert.ok(a.zona == null || a.zona === cubo.zonas[zona].nombre_mostrar, `${f.clave}: archivo de otra zona`);
  }
  assert.ok(m.grupos[2].filas.every((f) => !("fechas" in f)), "el escenario no lleva fechas");
  const claves = m.grupos.flatMap((g) => g.filas.map((f) => f.clave));
  assert.equal(new Set(claves).size, claves.length, "llaves de renglón repetidas");
});

test("modeloEstado: sin manifest, sin cubo y con datos incompletos no rompe ni inventa fechas", () => {
  const vacio = modeloEstado();
  assert.equal(vacio.reconstruido, null); assert.equal(vacio.fuentesDisponibles, false); assert.deepEqual(vacio.zonas, []); assert.equal(vacio.total, null);
  assert.ok(vacio.grupos.slice(0, 2).every((g) => g.filas.every((f) => f.fechas === null && f.archivos.length === 0)));
  const raro = modeloEstado({ manifest: { fuentes_de_origen: [null, 7, { archivo: "imerg_x.csv", fecha: "ayer", fuente: "otra cosa" }, { archivo: "nasadem_a.tif", fecha_consulta: "2026-01-02", fuente: "NASADEM x" }] },
    cubo: { meta: { generado: "no es fecha", mock: true }, zona: { nombre: "piloto", conteos: { total: 3, abstenida: 1 } } }, zonaId: "no_existe" });
  assert.equal(raro.reconstruido, null); assert.equal(raro.simulado, true);
  assert.deepEqual(raro.zonas, [{ id: "piloto", nombre: "piloto", total: 3, clasificadas: 2, enVista: false }]);
  const filas = Object.fromEntries(raro.grupos.flatMap((g) => g.filas.map((f) => [f.clave, f])));
  assert.equal(filas.precipitacion.fechas, null); assert.equal(filas.precipitacion.fuente, null, "fuente no reconocida: no se afirma ninguna");
  assert.equal(filas.terreno.fechas.desde.iso, "2026-01-02"); assert.equal(filas.terreno.fuente, "NASADEM");
  assert.equal(typeof NOTA_GEMELO, "string");
});

test("fraseResumen: la aclaración final del nombre no se anida entre paréntesis", () => {
  const nogal = { ...opcion, nombre: "Current rotation: Pecan orchard (does not rotate)" };
  assert.equal(fraseResumen(con(6, 0, parcela, nogal)), "With 6 thousand m³/ha, the current rotation (Pecan orchard) has enough water for all 10 hectares. Pecan orchard ties up water for one season.");
});

// Punto 1 de la revisión con Playwright (2026-11-15): el plazo del agua va en la frase principal, no 2,5 pantallas abajo.
// Lee agua.plazo_anios, agua.plazo_restante y agua.nota_plazo de la opción ACTUAL; ninguna cifra en el texto del módulo.
const conAgua = (extra) => ({ ...opcion, agua: { ...opcion.agua, ...extra } });
const alfalfa = { ...conAgua({ plazo_anios: { min: 3, max: 4 }, plazo_restante: { min: 0, max: 1 } }), nombre: "Current rotation: Alfalfa", secuencia: ["alfalfa"] };
const huerta = {
  ...conAgua({ plazo_anios: { min: 10, max: 10 }, plazo_restante: { min: 10, max: 10 }, nota_plazo: "calculation horizon; orchards live longer" }),
  nombre: "Current rotation: Pecan orchard (does not rotate)", secuencia: ["nogal"],
};

test("fraseResumen: el plazo del agua de la opción actual va en la misma frase (perenne, huerta, anual)", () => {
  assert.equal(fraseResumen(con(2.5, 0, parcela, alfalfa)),
    "With 2.5 thousand m³/ha, the current rotation (Alfalfa) has enough water for 5 of 10 hectares. Alfalfa ties up water for 3–4 years (0–1 years left).");
  assert.equal(fraseResumen(con(6, 0, parcela, huerta)),
    "With 6 thousand m³/ha, the current rotation (Pecan orchard) has enough water for all 10 hectares. Pecan orchard ties up water for 10 years (calculation horizon; orchards live longer).",
    "huerta: el horizonte con su nota; el restante igual al plazo no se repite");
  assert.ok(fraseResumen(con(2.5)).endsWith(" Forage maize ties up water for one season."), "anual: una temporada, sin cifra");
  const restante = (min, max) => fraseResumen(con(2.5, 0, parcela, { ...alfalfa, agua: { ...alfalfa.agua, plazo_restante: { min, max } } }));
  assert.match(restante(2, 2), / ties up water for 3–4 years \(2 years left\)\.$/);
  assert.match(restante(1, 1), / ties up water for 3–4 years \(1 year left\)\.$/, "singular");
  assert.match(restante(0, 0), / ties up water for 3–4 years \(0 years left\)\.$/);
  const sinRestante = { ...alfalfa, agua: { ...alfalfa.agua, plazo_restante: null } };
  assert.match(fraseResumen(con(2.5, 0, parcela, sinRestante)), / Alfalfa ties up water for 3–4 years\.$/);
  const fijo = { ...alfalfa, agua: { ...alfalfa.agua, plazo_anios: { min: 2, max: 2 }, plazo_restante: null } };
  assert.match(fraseResumen(con(2.5, 0, parcela, fijo)), / ties up water for 2 years\.$/);
});

test("fraseResumen: sin plazo en los datos lo dice; sin riego, abstenida o sin cálculo no hablan de plazo", () => {
  const sinPlazo = { ...alfalfa, agua: { ...alfalfa.agua, plazo_anios: null, plazo_restante: null } };
  assert.match(fraseResumen(con(2.5, 0, parcela, sinPlazo)), /hectares\. The data do not give how many years it ties up water\.$/);
  const roto = { ...alfalfa, agua: { ...alfalfa.agua, plazo_anios: { min: null, max: "x" } } };
  assert.match(fraseResumen(con(2.5, 0, parcela, roto)), /The data do not give how many years it ties up water\.$/);
  const descanso = { id: "ACTUAL", nombre: "Current rotation: Do not plant / standing stubble", secuencia: ["descanso"],
    agua: { lamina_bruta: { 0: { p10: 0, p50: 0, p90: 0 } }, plazo_anios: { min: 1, max: 1 }, plazo_restante: { min: 1, max: 1 } } };
  assert.doesNotMatch(fraseResumen(con(3, 0, parcela, descanso)), /ties up|water term/);
  assert.doesNotMatch(fraseResumen({ parcela: { ...parcela, abstencion: true }, opcionActual: alfalfa, D: 3 }), /ties up/);
  assert.doesNotMatch(fraseResumen({ parcela, opcionActual: null, D: 3 }), /ties up/);
});

test("fraseResumen: los años del plazo pasan por el formato de la app (clave «anios») y el nombre va con mayúscula", () => {
  assert.equal(fraseResumen({ ...con(2.5, 0, parcela, alfalfa), formato: (v, k) => `<${k}:${v}>` }),
    "With <d:2.5> thousand m³/ha, the current rotation (Alfalfa) has enough water for <ha:5> of <area:10> hectares. Alfalfa ties up water for <anios:3>–<anios:4> years (<anios:0>–<anios:1> years left).");
  const sinNombre = { ...alfalfa, nombre: "", secuencia: ["alfalfa"] };
  assert.match(fraseResumen(con(2.5, 0, parcela, sinNombre)), /\(alfalfa\) has enough .* Alfalfa ties up water for 3–4 years/);
});

test("fraseResumen con los datos publicados (web/data): el plazo de la opción ACTUAL sale del cubo", (t) => {
  const ruta = new URL("../web/data/cubo.json", import.meta.url);
  const rutaP = new URL("../web/data/parcelas.geojson", import.meta.url);
  if (!fs.existsSync(ruta) || !fs.existsSync(rutaP)) return t.skip("web/data aún no se construye (python construir.py)");
  const cubo = JSON.parse(fs.readFileSync(ruta, "utf8"));
  const props = new Map(JSON.parse(fs.readFileSync(rutaP, "utf8")).features.map((f) => [f.properties.id, f.properties]));
  let vistas = 0;
  for (const [id, pc] of Object.entries(cubo.parcelas ?? {})) {
    const p = props.get(id);
    const actual = (pc.opciones ?? []).find((o) => o.id === "ACTUAL");
    if (!p || p.abstencion || !actual || !(actual.agua?.lamina_bruta?.["0"]?.p50 > 0)) continue;
    const D = cubo.dotaciones.marcas?.[0]?.valor ?? cubo.dotaciones.deslizador.min;
    const frase = fraseResumen({ parcela: p, opcionActual: actual, evaluacion: evaluarOpcion(actual, p.area_ha, D, 0), D });
    const { min, max } = actual.agua.plazo_anios;
    if (max <= 1) assert.match(frase, /ties up water for one season\.$/, id);
    else {
      assert.ok(frase.includes(` ties up water for ${min === max ? min : `${min}–${max}`} years`), `${id}: ${frase}`);
      if (actual.agua.nota_plazo) assert.ok(frase.includes(actual.agua.nota_plazo), `${id}: nota del plazo`);
    }
    vistas += 1;
  }
  if (!vistas) t.skip("ninguna parcela con opción ACTUAL que pida agua");
});

// Punto 6 de la revisión con Playwright (2026-11-15): «Enough for 20.7 of 20.66 hectares» (un decimal y tres).
test("formatoHectareas: mismo formato para lo que alcanza y para el área; nunca más que el área", () => {
  const f = formatoHectareas(20.66);
  assert.equal(f(20.66), "20.66");
  assert.equal(f(20.655), "20.65", "hacia abajo: no se escribe más de lo calculado");
  assert.equal(f(20.6599999), "20.65");
  assert.equal(f(20.7), "20.66", "nunca más que el área");
  assert.equal(f(1), "1", "sin ceros de relleno");
  assert.equal(f(12.3456), "12.34");
  assert.equal(f(null), "—");
  assert.equal(f(NaN), "—");
  const g = formatoHectareas(20.7);
  assert.equal(g(20.66), "20.6", "un área con un decimal: lo que alcanza, con uno");
  assert.equal(formatoHectareas(10)(5.75), "5.7", "área entera: al menos un decimal para lo que alcanza");
  assert.equal(formatoHectareas(7.9531)(1.59999), "1.599", "tres decimales como máximo (los de un dato)");
  assert.equal(formatoHectareas(0.35)(0.35 * 0.999), "0.34");
  assert.equal(formatoHectareas(null)(3.27), "3.2", "sin área: un decimal, hacia abajo");
  // Para cualquier cobertura menor que uno, el texto de lo que alcanza no supera al del área.
  for (const area of [0.35, 7.95, 10.76, 20.66, 20.7, 128.4]) {
    const fa = formatoHectareas(area);
    for (let c = 0; c < 1; c += 0.0137) assert.ok(Number(fa(area * c).replace(/,/g, "")) <= Number(fa(area).replace(/,/g, "")), `${area} × ${c}`);
  }
});

test("hectareasTexto: singular solo para un valor de uno", () => {
  assert.equal(hectareasTexto(1), "hectare");
  for (const v of [0, 0.5, 1.5, 2, 20.66, null]) assert.equal(hectareasTexto(v), "hectares", String(v));
});
