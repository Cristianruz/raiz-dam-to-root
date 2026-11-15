// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// Plan de la vista «Planificar» del tablero. NO es un modelo de demanda: cada lámina, cobertura y hectárea
// sale de web/data/cubo.json (parcelas[id].opciones[].agua.lamina_bruta[lluvia], con p10/p50/p90) y de las
// reglas de web/reglas.js, las MISMAS que usa la ficha de la página publicada. Por eso el plan y la ficha dan
// las mismas hectáreas para la misma parcela, dotación y lluvia (tests/recomendador.test.js lo comprueba).
// El módulo es puro (sin DOM): describe lo que cubre la dotación y las restricciones encontradas, con su
// fuente. No ordena, no puntúa y no nombra una opción por encima de otra (regla 10 de CLAUDE.md).
// Ninguna cifra vive aquí: todo entra por parámetro desde los datos o lo captura la persona.
import {
  evaluarOpcion,
  hectareasQueAlcanzan,
  cobertura,
  llaveLluvia,
} from "../reglas.js";
import { formatoHectareas } from "./resumen.js";

/** Aviso de juicio: la misma frase de la página publicada (web/index.html y web/app.js). */
export const AVISO_JUICIO =
  "This tool supports, never replaces, the judgment of farmers and local experts.";

/** Rótulo de cada tarjeta. Son descripciones del resultado, nunca una calificación de la opción. */
export const ESTADOS = {
  restriccion: "Restriction found",
  revisar: "Needs a local check",
  calculado: "Water coverage calculated",
  sin_datos: "No data",
};

/** Lo que el plan declara de sí mismo (va en la tarjeta y en el archivo que se descarga). */
export const ALCANCE =
  "Water coverage by option, from the same data and rules as the field card. " +
  "It does not forecast the dam, the harvest or the income, and it does not allocate water.";

// Nombres en inglés de los cultivos del contrato (ids de cubo.json y parcelas.geojson).
const CULTIVOS = {
  barbecho: "fallow / no crop",
  descanso: "fallow / no crop",
  cereal_invierno: "winter cereal",
  maiz_forrajero: "forage maize",
  algodon: "cotton",
  chile: "chile pepper",
  alfalfa: "alfalfa",
  nogal: "pecan",
  sorgo: "forage sorghum",
  sin_clasificar: "unclassified",
};
export const nombreCultivo = (id) => CULTIVOS[id] ?? String(id ?? "");

const esNumero = (v) => typeof v === "number" && Number.isFinite(v);
const numero = (v, decimales) =>
  esNumero(v)
    ? new Intl.NumberFormat("en-US", { maximumFractionDigits: decimales }).format(v)
    : "no data";
const UN_DECIMAL = 1; // decimales del pH en el texto
const DOS_DECIMALES = 2; // decimales de la salinidad en el texto

/** «MM-DD» dentro de una ventana que puede cruzar el fin de año. null si la ventana no está completa. */
function dentroDeVentana(mmdd, desde, hasta) {
  if (!desde || !hasta) return null;
  return desde <= hasta ? mmdd >= desde && mmdd <= hasta : mmdd >= desde || mmdd <= hasta;
}

/** Fecha «AAAA-MM-DD» real (no «2027-02-31»). */
function fechaValida(texto) {
  if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const t = Date.parse(texto);
  return Number.isFinite(t) && new Date(t).toISOString().slice(0, texto.length) === texto;
}

/**
 * Dotación (millares/ha) con la que se evalúa el plan: la del escenario del tablero o, si la persona capturó
 * un volumen total, ese volumen repartido en la superficie evaluada (m3PorMillar llega de los datos).
 * Devuelve null si no se puede calcular.
 */
export function dotacionDeEntrada({ dotacion, volumen = null, area, m3PorMillar = null }) {
  if (volumen == null) return esNumero(dotacion) && dotacion >= 0 ? dotacion : null;
  if (!esNumero(volumen) || volumen < 0 || !esNumero(area) || !(area > 0)) return null;
  if (!esNumero(m3PorMillar) || !(m3PorMillar > 0)) return null;
  return volumen / (area * m3PorMillar);
}

/**
 * Frase de la tarjeta: lo que cubre la dotación. Las hectáreas llevan el mismo formato que la ficha
 * (formatoHectareas de web/js/resumen.js: los decimales del área, hacia abajo).
 * La lectura «prudente» es el extremo bajo de hectareasQueAlcanzan (con la lámina alta), rotulada como tal.
 */
export function textoCobertura(t) {
  if (!t || t.estado === "sin_datos") return "No water need is published for this option, so no coverage is shown.";
  const fh = formatoHectareas(t.area);
  if (t.sinRiego) return `This option needs no irrigation water on the ${fh(t.area)} ha evaluated.`;
  const { p50, bajo, alto } = t.hectareas;
  if (t.cobertura >= 1) {
    const prudente =
      bajo < t.area
        ? ` Prudent reading, at the high estimate of its need: ${fh(bajo)} ha.`
        : "";
    return `With this allocation the water covers the whole field (${fh(t.area)} ha).${prudente}`;
  }
  return (
    `With this allocation the water covers ${fh(p50)} of ${fh(t.area)} ha ` +
    `(range ${fh(bajo)} to ${fh(alto)} ha; the low end is the prudent reading, at the high estimate of its need).`
  );
}

/** Texto visible de una restricción encontrada, con el cierre que deja la decisión en manos de la persona. */
export function textoRestriccion(r) {
  return `Restriction found: ${r.texto} Review it with your module technician.`;
}

// Estado de un filtro del cubo, igual que en la ficha (web/app.js, estadoDeFiltro).
function estadoDeFiltro(f) {
  if (f.estado) return f.estado;
  if (f.pasa === true) return "passes";
  if (f.pasa === false) return "warning";
  return "needs_local_check";
}

/**
 * Reparte los filtros de la opción (cubo.json) y lo que la persona capturó en tres listas con fuente:
 * restricciones encontradas, puntos que piden revisión local y comprobaciones que pasan.
 */
function revisarOpcion({ opcion, cubo, entrada, requisitos, perfil }) {
  const restricciones = [];
  const pendientes = [];
  const cumplidas = [];
  const item = (lista, id, texto, fuente, etiqueta, origen) =>
    lista.push({ id, texto, fuente: fuente ?? null, etiqueta: etiqueta ?? null, origen });
  const cultivos = Array.isArray(opcion.secuencia) ? opcion.secuencia : [];
  const requisito = (c) => requisitos?.cultivos?.[c] ?? null;

  // ¿La salinidad capturada alcanza para evaluar el filtro del cubo en todos los cultivos de la opción?
  const ece = entrada.salinidad;
  const umbrales = cultivos.map((c) => ({ c, u: requisito(c)?.salinidad_umbral_ds_m }));
  const eceEvaluable =
    esNumero(ece) && umbrales.length > 0 && umbrales.every((x) => esNumero(x.u?.valor));

  // Ventana de siembra del cultivo que abre la secuencia (catálogo del cubo), contra la fecha capturada.
  const secuencia = cubo.opciones_catalogo?.[opcion.rotacion]?.secuencia;
  const apertura = Array.isArray(secuencia) ? secuencia[0] : null;
  const mmdd = entrada.fecha ? entrada.fecha.slice(entrada.fecha.indexOf("-") + 1) : null;
  const enVentana = mmdd && apertura ? dentroDeVentana(mmdd, apertura.siembra?.desde, apertura.siembra?.hasta) : null;

  for (const f of Array.isArray(opcion.filtros) ? opcion.filtros : []) {
    const estado = estadoDeFiltro(f);
    const texto = f.motivo ?? f.filtro ?? f.id;
    if (f.id === "fecha_siembra" && enVentana != null) {
      const rango = `${apertura.siembra.desde} to ${apertura.siembra.hasta}, month-day`;
      const cultivo = nombreCultivo(apertura.cultivo);
      if (enVentana)
        item(cumplidas, f.id, `The planting date you entered (${mmdd}) is inside the window reported for ${cultivo} (${rango}).`, apertura.fuente ?? f.fuente, f.etiqueta, "your_input");
      else
        item(restricciones, f.id, `the planting date you entered (${mmdd}) is outside the window reported for ${cultivo} (${rango}).`, apertura.fuente ?? f.fuente, f.etiqueta, "your_input");
      if (secuencia.length > 1)
        item(pendientes, f.id, "The date you entered is checked against the opening crop of the sequence; the dates of the following crops still need a local check.", f.fuente, f.etiqueta, "cube");
      continue;
    }
    if (f.id === "salinidad" && eceEvaluable) continue; // se evalúa abajo con la medición capturada
    if (estado === "warning") item(restricciones, f.id, texto, f.fuente, f.etiqueta, "cube");
    else if (estado === "passes") item(cumplidas, f.id, texto, f.fuente, f.etiqueta, "cube");
    else item(pendientes, f.id, texto, f.fuente, f.etiqueta, "cube");
  }

  // Suelo capturado o del mapa regional contra los intervalos generales publicados. La fuente de esos
  // intervalos pide no usarlos para descartar opciones: se describen como puntos de revisión local.
  const phCapturado = esNumero(entrada.ph);
  const ph = phCapturado ? entrada.ph : perfil?.ph;
  for (const c of cultivos) {
    const req = requisito(c);
    const tolerado = req?.ph?.tolerado;
    if (esNumero(ph) && Array.isArray(tolerado) && tolerado.every(esNumero)) {
      const [min, max] = tolerado;
      const origen = phCapturado ? "your lab result" : "the regional soil map, not a lab result";
      const frase = `pH ${numero(ph, UN_DECIMAL)} (${origen}) against the general published range for ${nombreCultivo(c)} (${numero(min, UN_DECIMAL)} to ${numero(max, UN_DECIMAL)})`;
      if (ph < min || ph > max)
        item(pendientes, `ph_${c}`, `${frase}: outside the range. It is a worldwide range, not a trial in the district.`, req.ph.fuente, null, phCapturado ? "your_input" : "soil_map");
      else item(cumplidas, `ph_${c}`, `${frase}: inside the range.`, req.ph.fuente, null, phCapturado ? "your_input" : "soil_map");
    }
    if (eceEvaluable) {
      const u = req.salinidad_umbral_ds_m;
      const frase = `Soil salinity you entered (ECe ${numero(ece, DOS_DECIMALES)} dS/m) against the published threshold for ${nombreCultivo(c)} (${numero(u.valor, DOS_DECIMALES)} dS/m)`;
      if (ece > u.valor) item(pendientes, `ece_${c}`, `${frase}: above the threshold.`, u.fuente, null, "your_input");
      else item(cumplidas, `ece_${c}`, `${frase}: at or below the threshold.`, u.fuente, null, "your_input");
    }
  }
  return { restricciones, pendientes, cumplidas };
}

/**
 * Plan de una parcela: una tarjeta por cada opción que el cubo trae para ella, en el orden del cubo.
 * Las cifras de agua salen de evaluarOpcion (web/reglas.js) con las láminas del cubo.
 *
 * @param {object} a
 * @param {object} a.cubo      web/data/cubo.json
 * @param {object} a.parcela   properties de la parcela (parcelas.geojson)
 * @param {number} a.dotacion  dotación del escenario, millares/ha
 * @param {number} a.lluvia    lluvia del escenario (un valor de cubo.lluvia_pct)
 * @param {object} [a.entrada] lo que capturó la persona: cultivo, area, volumenDisponible, fecha, ph, salinidad,
 *                             dotacionConfirmada, sistema (solo se anota; no cambia ninguna cifra)
 * @param {object} [a.requisitos] intervalos generales de suelo por cultivo (pronostico.json → requisitos)
 * @param {object} [a.perfil]  perfil del mapa regional de suelo para la parcela
 * @param {number} [a.m3PorMillar] constante de conversión, de los datos; solo hace falta si se captura volumen
 * @returns {{estado: "sin_plan"|"entradas_invalidas"|"calculado", motivo: string|null, errores: string[],
 *            avisos: object[], tarjetas: object[]}}
 */
export function planDeParcela({
  cubo,
  parcela,
  dotacion,
  lluvia,
  entrada = {},
  requisitos = null,
  perfil = null,
  m3PorMillar = null,
}) {
  const base = { estado: "sin_plan", motivo: null, errores: [], avisos: [], tarjetas: [], alcance: ALCANCE, aviso_juicio: AVISO_JUICIO };
  if (!parcela) return { ...base, motivo: "No field is selected." };
  const resumenParcela = {
    id: parcela.id ?? null,
    zona: parcela.zona ?? null,
    cultivo_detectado: parcela.cultivo_actual ?? null,
    clasificacion_no_confiable: Boolean(parcela.abstencion),
    area_del_poligono_ha: parcela.area_ha ?? null,
  };
  // Parcela sin clasificar: sin plan, con el motivo. No se inventa una opción para un cultivo desconocido.
  if (parcela.abstencion || parcela.cultivo_actual === "sin_clasificar")
    return {
      ...base,
      parcela: resumenParcela,
      motivo:
        "No plan for this field: the satellite classification of its crop is not reliable, and without the crop its water need is not known. Confirm the crop with your module technician.",
    };
  const opciones = cubo?.parcelas?.[parcela.id]?.opciones;
  if (!Array.isArray(opciones) || !opciones.length)
    return { ...base, parcela: resumenParcela, motivo: "No plan for this field: the data file has no options for it." };

  // --- Entradas ---------------------------------------------------------------------------------
  const errores = [];
  const area = entrada.area == null ? parcela.area_ha : entrada.area;
  if (!esNumero(area) || !(area > 0)) errores.push("The area must be a number above zero.");
  const volumen = entrada.volumenDisponible ?? null;
  const D = dotacionDeEntrada({ dotacion, volumen, area, m3PorMillar });
  if (D == null && !errores.length)
    errores.push(
      volumen == null
        ? "The allocation of the scenario is not a valid number."
        : "The available volume must be a number of zero or more, and it needs the conversion constant from the data.",
    );
  const r = Number(lluvia);
  if (!Number.isFinite(r)) errores.push("The rainfall scenario is not valid.");
  // El pH va de cero a catorce por definición de la escala; no es una cifra de los datos.
  const PH_MAXIMO = 14;
  if (entrada.ph != null && (!esNumero(entrada.ph) || entrada.ph < 0 || entrada.ph > PH_MAXIMO))
    errores.push("The pH you entered is not valid.");
  if (entrada.salinidad != null && (!esNumero(entrada.salinidad) || entrada.salinidad < 0))
    errores.push("The soil salinity you entered is not valid.");
  if (entrada.fecha && !fechaValida(entrada.fecha)) errores.push("The planting date is not valid.");
  if (errores.length) return { ...base, estado: "entradas_invalidas", parcela: resumenParcela, errores, motivo: "No plan is shown with invalid inputs." };

  // --- Avisos generales (no cambian ninguna cifra) -------------------------------------------------
  const avisos = [];
  const detectado = parcela.cultivo_actual;
  const confirmado = entrada.cultivo ?? null;
  const cultivoDistinto = confirmado != null && confirmado !== detectado;
  if (confirmado == null)
    avisos.push({ id: "cultivo_sin_confirmar", texto: `The crop (${nombreCultivo(detectado)}) comes from a satellite classification, not from a field visit. Confirm it.`, fuente: null });
  else if (cultivoDistinto)
    avisos.push({
      id: "cultivo_distinto",
      texto: `You reported ${nombreCultivo(confirmado)}; the options below were computed for the crop detected by satellite (${nombreCultivo(detectado)}). They may not apply to your field: review them with your module technician.`,
      fuente: null,
    });
  if (!entrada.dotacionConfirmada)
    avisos.push({ id: "dotacion_escenario", texto: "The allocation is a scenario. Confirm the water you will have with your irrigation module.", fuente: null });
  const sinRotacion = cubo.parcelas[parcela.id].sin_rotacion;
  if (sinRotacion?.motivo)
    avisos.push({ id: "sin_rotacion", texto: sinRotacion.motivo, fuente: sinRotacion.fuente ?? null, etiqueta: sinRotacion.etiqueta ?? null });

  // --- Una tarjeta por opción del cubo, en su orden ---------------------------------------------
  const llave = llaveLluvia(r);
  const tarjetas = opciones.map((opcion) => {
    const lamina = opcion.agua?.lamina_bruta?.[llave];
    const comun = { id: opcion.id, nombre: opcion.nombre ?? opcion.id, rotacion: opcion.rotacion ?? null, etiqueta: opcion.etiqueta_opcion ?? null, area, dotacion: D, lluvia: r };
    if (!lamina || ![lamina.p10, lamina.p50, lamina.p90].every(esNumero))
      return { ...comun, estado: "sin_datos", rotulo: ESTADOS.sin_datos, restricciones: [], pendientes: [], cumplidas: [], descripcion: textoCobertura(null) };
    const ev = evaluarOpcion(opcion, area, D, r); // MISMA regla que la ficha
    const revision = revisarOpcion({ opcion, cubo, entrada, requisitos, perfil });
    if (cultivoDistinto)
      revision.pendientes.unshift({ id: "cultivo_distinto", texto: "Computed for the crop detected by satellite, which differs from the one you reported.", fuente: null, etiqueta: null, origen: "your_input" });
    const estado = revision.restricciones.length ? "restriccion" : revision.pendientes.length ? "revisar" : "calculado";
    const tarjeta = {
      ...comun,
      estado,
      rotulo: ESTADOS[estado],
      lamina: ev.lamina,
      cobertura: ev.cobertura,
      hectareas: ev.hectareas,
      sinRiego: !(ev.lamina.p50 > 0),
      plazo: opcion.agua?.plazo_anios ?? null,
      ...revision,
    };
    return { ...tarjeta, descripcion: textoCobertura(tarjeta) };
  });
  return {
    ...base,
    estado: "calculado",
    parcela: resumenParcela,
    avisos,
    tarjetas,
    area,
    dotacion: D,
    lluvia: r,
    dotacion_origen: volumen == null ? "scenario" : "volume_entered",
    cultivo_confirmado: confirmado,
    sistema_de_riego_anotado: entrada.sistema ?? null,
  };
}

/**
 * Comprobaciones de consistencia del software con los datos de esta parcela (botón «Run checks»).
 * No son ensayos agronómicos. `validacion` es zonas[zona].validacion_lluvia de pronostico.json, o null.
 */
export function comprobarPlan(args, validacion = null) {
  const lista = [];
  const agregar = (nombre, ok, detalle) => lista.push({ nombre, ok: Boolean(ok), detalle });
  const plan = planDeParcela(args);
  if (plan.estado !== "calculado") {
    agregar("A plan exists for these inputs", false, plan.motivo ?? plan.errores.join(" "));
    return lista;
  }
  const conRiego = (p) => p.tarjetas.filter((t) => t.estado !== "sin_datos" && !t.sinRiego);
  const sinVolumen = { ...args, entrada: { ...args.entrada, volumenDisponible: null } };
  agregar("Same inputs, same result", JSON.stringify(plan) === JSON.stringify(planDeParcela(args)), "The plan is computed twice and compared.");
  agregar(
    "Same hectares as the field card rules",
    plan.tarjetas
      .filter((t) => t.estado !== "sin_datos")
      .every((t) => {
        const h = hectareasQueAlcanzan(t.area, t.dotacion, t.lamina);
        return h.p50 === t.hectareas.p50 && h.bajo === t.hectareas.bajo && h.alto === t.hectareas.alto && cobertura(t.dotacion, t.lamina.p50) === t.cobertura;
      }),
    "Each card is compared with the shared rules of the published page (web/reglas.js).",
  );
  const cero = planDeParcela({ ...sinVolumen, dotacion: 0 });
  agregar("No water, no irrigated hectares", cero.estado === "calculado" && conRiego(cero).every((t) => t.hectareas.p50 === 0), "The plan is recomputed with an allocation of zero.");
  const paso = Number(args.cubo?.dotaciones?.deslizador?.paso);
  if (Number.isFinite(paso) && paso > 0) {
    const mas = planDeParcela({ ...sinVolumen, dotacion: plan.dotacion + paso });
    agregar(
      "More water never lowers the covered hectares",
      mas.estado === "calculado" && plan.tarjetas.every((t) => t.estado === "sin_datos" || t.hectareas.p50 <= (mas.tarjetas.find((m) => m.id === t.id)?.hectareas.p50 ?? -Infinity)),
      "The plan is recomputed with one more step of the allocation slider.",
    );
  }
  agregar("Invalid inputs give no plan", planDeParcela({ ...args, entrada: { ...args.entrada, area: 0 } }).tarjetas.length === 0, "An area of zero is rejected instead of being replaced by an assumption.");
  if (Array.isArray(validacion?.casos) && validacion.casos.length)
    agregar("The rainfall check uses no later years", validacion.casos.every((x) => x.entrenamiento_fin < x.anio), "Each year checked is compared with a range built from earlier years.");
  return lista;
}
