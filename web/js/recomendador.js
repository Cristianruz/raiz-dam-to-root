// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
// Plan de la vista «Planificar» del tablero. NO es un modelo de demanda: cada lámina, cobertura y hectárea
// sale de web/data/cubo.json (parcelas[id].opciones[].agua.lamina_bruta[lluvia], con p10/p50/p90) y de las
// reglas de web/reglas.js, las MISMAS que usa la ficha de la parcela (web/explorer.html). Por eso el plan y la
// ficha dan las mismas hectáreas para la misma parcela, dotación y lluvia (tests/recomendador.test.js).
// El módulo es puro (sin DOM): describe lo que cubre la dotación y las restricciones encontradas, con su
// fuente. No ordena, no puntúa y no nombra una opción por encima de otra (regla 10 de CLAUDE.md).
// Ninguna cifra ni texto visible vive aquí: las cifras entran por parámetro desde los datos o las captura la
// persona, y los textos salen de web/js/textos_asesor.js en el idioma en uso (t de web/js/i18n.js).
import {
  evaluarOpcion,
  hectareasQueAlcanzan,
  cobertura,
  llaveLluvia,
} from "../reglas.js";
import { formatoHectareas } from "./resumen.js";
import { t, tiene, fmtNumero, fmtFecha, deDato, idioma, IDIOMA_BASE } from "./i18n.js";
import "./textos_asesor.js"; // registra los textos «asesor.…» en los cuatro idiomas

/** Aviso de juicio, en el idioma en uso. En inglés es la misma frase de la ficha (web/app.js). */
export const avisoJuicio = () => t("asesor.aviso_juicio");
/** Lo que el plan declara de sí mismo (va en la tarjeta y en el archivo que se descarga). */
export const alcance = () => t("asesor.alcance");
/** Rótulo de una tarjeta: describe el resultado, nunca califica la opción. */
export const rotuloDeEstado = (estado) => t(`asesor.estado.${estado}`);
/** Estados posibles de una tarjeta. */
export const ESTADOS = ["restriccion", "revisar", "calculado", "sin_datos"];

/** Nombre de un cultivo del contrato (ids de cubo.json y parcelas.geojson) en el idioma en uso. */
export function nombreCultivo(id) {
  const clave = `asesor.cultivo.${id}`;
  return tiene(clave, IDIOMA_BASE) ? t(clave) : String(id ?? "");
}

const esNumero = (v) => typeof v === "number" && Number.isFinite(v);
const UN_DECIMAL = 1; // decimales del pH en el texto
const DOS_DECIMALES = 2; // decimales de la salinidad en el texto
const numero = (v, decimales) => fmtNumero(v, { maximumFractionDigits: decimales });

/**
 * Hectáreas con el MISMO redondeo de la ficha (formatoHectareas de web/js/resumen.js: los decimales del área,
 * hacia abajo) y los separadores del idioma en uso. No se copia la regla: se toma su resultado y se le da formato.
 */
export function formatoHa(areaHa) {
  const comoLaFicha = formatoHectareas(areaHa);
  return (valor) => {
    const canonico = comoLaFicha(valor);
    const n = Number(canonico.replaceAll(",", ""));
    if (!Number.isFinite(n)) return t("asesor.sin_dato");
    const decimales = (canonico.split(".")[1] ?? "").length;
    return fmtNumero(n, { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
  };
}

/** «MM-DD» dentro de una ventana que puede cruzar el fin de año. null si la ventana no está completa. */
function dentroDeVentana(mmdd, desde, hasta) {
  if (!desde || !hasta) return null;
  return desde <= hasta ? mmdd >= desde && mmdd <= hasta : mmdd >= desde || mmdd <= hasta;
}

/** Fecha «AAAA-MM-DD» real (no un 31 de febrero). */
function fechaValida(texto) {
  if (typeof texto !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const ms = Date.parse(texto);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, texto.length) === texto;
}

const ANIO_BISIESTO = 2024; // solo para dar nombre al mes y al día de un «MM-DD»; el año no se muestra
/** «MM-DD» como día y mes en el idioma en uso («Apr 15», «15 abr»). Si no se puede leer, el texto tal cual. */
function mesDia(mmdd) {
  const [mes, dia] = String(mmdd ?? "").split("-").map(Number);
  if (!Number.isInteger(mes) || !Number.isInteger(dia)) return String(mmdd ?? "");
  return fmtFecha(new Date(Date.UTC(ANIO_BISIESTO, mes - 1, dia)), { month: "short", day: "numeric", timeZone: "UTC" });
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
 * Frase de la tarjeta: lo que cubre la dotación, con las hectáreas de la ficha.
 * La lectura «prudente» es el extremo bajo de hectareasQueAlcanzan (con la lámina alta), rotulada como tal.
 */
export function textoCobertura(tarjeta) {
  if (!tarjeta || tarjeta.estado === "sin_datos") return t("asesor.cobertura.sin_datos");
  const fh = formatoHa(tarjeta.area);
  const area = fh(tarjeta.area);
  if (tarjeta.sinRiego) return t("asesor.cobertura.sin_riego", { area });
  const { p50, bajo, alto } = tarjeta.hectareas;
  if (tarjeta.cobertura >= 1) {
    const toda = t("asesor.cobertura.toda", { area });
    return bajo < tarjeta.area ? `${toda} ${t("asesor.cobertura.prudente", { bajo: fh(bajo) })}` : toda;
  }
  return t("asesor.cobertura.parte", { ha: fh(p50), area, bajo: fh(bajo), alto: fh(alto) });
}

/** Texto visible de una restricción encontrada; el cierre deja la decisión en manos de la persona y su técnico. */
export function textoRestriccion(r) {
  return t("asesor.restriccion.frase", { texto: r.texto });
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
 * Los textos de los datos (motivo, fuente) se muestran como vienen; deDato toma su variante por idioma si existe.
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
  const eceEvaluable =
    esNumero(ece) && cultivos.length > 0 && cultivos.every((c) => esNumero(requisito(c)?.salinidad_umbral_ds_m?.valor));

  // Ventana de siembra del cultivo que abre la secuencia (catálogo del cubo), contra la fecha capturada.
  const secuencia = cubo.opciones_catalogo?.[opcion.rotacion]?.secuencia;
  const apertura = Array.isArray(secuencia) ? secuencia[0] : null;
  const mmdd = entrada.fecha ? entrada.fecha.slice(entrada.fecha.indexOf("-") + 1) : null;
  const enVentana = mmdd && apertura ? dentroDeVentana(mmdd, apertura.siembra?.desde, apertura.siembra?.hasta) : null;

  for (const f of Array.isArray(opcion.filtros) ? opcion.filtros : []) {
    const estado = estadoDeFiltro(f);
    const texto = deDato(f, "motivo") ?? deDato(f, "filtro") ?? String(f.id ?? "");
    const fuente = deDato(f, "fuente");
    if (f.id === "fecha_siembra" && enVentana != null) {
      const valores = {
        fecha: mesDia(mmdd),
        cultivo: nombreCultivo(apertura.cultivo),
        desde: mesDia(apertura.siembra.desde),
        hasta: mesDia(apertura.siembra.hasta),
      };
      const fuenteVentana = deDato(apertura, "fuente") ?? fuente;
      if (enVentana) item(cumplidas, f.id, t("asesor.fecha.dentro", valores), fuenteVentana, f.etiqueta, "captura");
      else item(restricciones, f.id, t("asesor.fecha.fuera", valores), fuenteVentana, f.etiqueta, "captura");
      if (secuencia.length > 1) item(pendientes, f.id, t("asesor.fecha.siguientes"), fuente, f.etiqueta, "cubo");
      continue;
    }
    if (f.id === "salinidad" && eceEvaluable) continue; // se evalúa abajo con la medición capturada
    if (estado === "warning") item(restricciones, f.id, texto, fuente, f.etiqueta, "cubo");
    else if (estado === "passes") item(cumplidas, f.id, texto, fuente, f.etiqueta, "cubo");
    else item(pendientes, f.id, texto, fuente, f.etiqueta, "cubo");
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
      const valores = {
        ph: numero(ph, UN_DECIMAL),
        origen: t(phCapturado ? "asesor.ph.origen_laboratorio" : "asesor.ph.origen_mapa"),
        cultivo: nombreCultivo(c),
        min: numero(min, UN_DECIMAL),
        max: numero(max, UN_DECIMAL),
      };
      const origen = phCapturado ? "captura" : "mapa_de_suelo";
      if (ph < min || ph > max) item(pendientes, `ph_${c}`, t("asesor.ph.fuera", valores), deDato(req.ph, "fuente"), null, origen);
      else item(cumplidas, `ph_${c}`, t("asesor.ph.dentro", valores), deDato(req.ph, "fuente"), null, origen);
    }
    if (eceEvaluable) {
      const u = req.salinidad_umbral_ds_m;
      const valores = { ece: numero(ece, DOS_DECIMALES), cultivo: nombreCultivo(c), umbral: numero(u.valor, DOS_DECIMALES) };
      if (ece > u.valor) item(pendientes, `ece_${c}`, t("asesor.ece.arriba", valores), deDato(u, "fuente"), null, "captura");
      else item(cumplidas, `ece_${c}`, t("asesor.ece.abajo", valores), deDato(u, "fuente"), null, "captura");
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
 *                             dotacionConfirmada, sistema (el sistema solo se anota; no cambia ninguna cifra)
 * @param {object} [a.requisitos] intervalos generales de suelo por cultivo (pronostico.json → requisitos)
 * @param {object} [a.perfil]  perfil del mapa regional de suelo para la parcela
 * @param {number} [a.m3PorMillar] constante de conversión, de los datos; solo hace falta si se captura volumen
 * @returns {{estado: "sin_plan"|"entradas_invalidas"|"calculado", motivo: string|null, errores: string[],
 *            avisos: object[], tarjetas: object[]}}  Los textos van en el idioma en uso al momento de llamar.
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
  const base = {
    estado: "sin_plan",
    motivo: null,
    errores: [],
    avisos: [],
    tarjetas: [],
    alcance: alcance(),
    aviso_juicio: avisoJuicio(),
    idioma: idioma(),
  };
  if (!parcela) return { ...base, motivo: t("asesor.plan.sin_parcela") };
  const resumenParcela = {
    id: parcela.id ?? null,
    zona: parcela.zona ?? null,
    cultivo_detectado: parcela.cultivo_actual ?? null,
    clasificacion_no_confiable: Boolean(parcela.abstencion),
    area_del_poligono_ha: parcela.area_ha ?? null,
  };
  // Parcela sin clasificar: sin plan, con el motivo. No se inventa una opción para un cultivo desconocido.
  if (parcela.abstencion || parcela.cultivo_actual === "sin_clasificar")
    return { ...base, parcela: resumenParcela, motivo: t("asesor.plan.sin_clasificar") };
  const opciones = cubo?.parcelas?.[parcela.id]?.opciones;
  if (!Array.isArray(opciones) || !opciones.length)
    return { ...base, parcela: resumenParcela, motivo: t("asesor.plan.sin_opciones") };

  // --- Entradas ---------------------------------------------------------------------------------
  const errores = [];
  const area = entrada.area == null ? parcela.area_ha : entrada.area;
  if (!esNumero(area) || !(area > 0)) errores.push(t("asesor.error.area"));
  const volumen = entrada.volumenDisponible ?? null;
  const D = dotacionDeEntrada({ dotacion, volumen, area, m3PorMillar });
  if (D == null && !errores.length) errores.push(t(volumen == null ? "asesor.error.dotacion" : "asesor.error.volumen"));
  const r = Number(lluvia);
  if (lluvia == null || lluvia === "" || !Number.isFinite(r)) errores.push(t("asesor.error.lluvia"));
  const PH_MAXIMO = 14; // tope de la escala de pH, por definición; no es una cifra de los datos
  if (entrada.ph != null && (!esNumero(entrada.ph) || entrada.ph < 0 || entrada.ph > PH_MAXIMO)) errores.push(t("asesor.error.ph"));
  if (entrada.salinidad != null && (!esNumero(entrada.salinidad) || entrada.salinidad < 0)) errores.push(t("asesor.error.salinidad"));
  if (entrada.fecha && !fechaValida(entrada.fecha)) errores.push(t("asesor.error.fecha"));
  if (errores.length)
    return { ...base, estado: "entradas_invalidas", parcela: resumenParcela, errores, motivo: t("asesor.plan.entradas_invalidas") };

  // --- Avisos generales (no cambian ninguna cifra) -------------------------------------------------
  const avisos = [];
  const detectado = parcela.cultivo_actual;
  const confirmado = entrada.cultivo ?? null;
  const cultivoDistinto = confirmado != null && confirmado !== detectado;
  if (confirmado == null)
    avisos.push({ id: "cultivo_sin_confirmar", texto: t("asesor.nota.cultivo_sin_confirmar", { cultivo: nombreCultivo(detectado) }), fuente: null, etiqueta: null });
  else if (cultivoDistinto)
    avisos.push({
      id: "cultivo_distinto",
      texto: t("asesor.nota.cultivo_distinto", { reportado: nombreCultivo(confirmado), detectado: nombreCultivo(detectado) }),
      fuente: null,
      etiqueta: null,
    });
  if (!entrada.dotacionConfirmada)
    avisos.push({ id: "dotacion_escenario", texto: t("asesor.nota.dotacion_escenario"), fuente: null, etiqueta: null });
  const sinRotacion = cubo.parcelas[parcela.id].sin_rotacion;
  if (deDato(sinRotacion, "motivo"))
    avisos.push({ id: "sin_rotacion", texto: deDato(sinRotacion, "motivo"), fuente: deDato(sinRotacion, "fuente"), etiqueta: sinRotacion.etiqueta ?? null });

  // --- Una tarjeta por opción del cubo, en su orden ---------------------------------------------
  const llave = llaveLluvia(r);
  const comoLaFicha = formatoHectareas(area);
  const tarjetas = opciones.map((opcion) => {
    const lamina = opcion.agua?.lamina_bruta?.[llave];
    const comun = {
      id: opcion.id,
      nombre: deDato(opcion, "nombre") ?? String(opcion.id ?? ""),
      rotacion: opcion.rotacion ?? null,
      etiqueta: opcion.etiqueta_opcion ?? null,
      area,
      dotacion: D,
      lluvia: r,
    };
    if (!lamina || ![lamina.p10, lamina.p50, lamina.p90].every(esNumero))
      return { ...comun, estado: "sin_datos", rotulo: rotuloDeEstado("sin_datos"), restricciones: [], pendientes: [], cumplidas: [], descripcion: textoCobertura(null) };
    const ev = evaluarOpcion(opcion, area, D, r); // MISMA regla que la ficha
    const revision = revisarOpcion({ opcion, cubo, entrada, requisitos, perfil });
    if (cultivoDistinto)
      revision.pendientes.unshift({ id: "cultivo_distinto", texto: t("asesor.nota.cultivo_distinto_tarjeta"), fuente: null, etiqueta: null, origen: "captura" });
    const estado = revision.restricciones.length ? "restriccion" : revision.pendientes.length ? "revisar" : "calculado";
    const tarjeta = {
      ...comun,
      estado,
      rotulo: rotuloDeEstado(estado),
      lamina: ev.lamina,
      cobertura: ev.cobertura,
      hectareas: ev.hectareas,
      // Las hectáreas escritas como en la ficha (formato de web/js/resumen.js), para comparar las dos páginas.
      hectareas_ficha: { area: comoLaFicha(area), p50: comoLaFicha(ev.hectareas.p50), bajo: comoLaFicha(ev.hectareas.bajo), alto: comoLaFicha(ev.hectareas.alto) },
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
    dotacion_origen: volumen == null ? "escenario" : "volumen_capturado",
    cultivo_confirmado: confirmado,
    sistema_de_riego_anotado: entrada.sistema ?? null,
  };
}

/**
 * Comprobaciones de consistencia del software con los datos de esta parcela (botón de comprobaciones).
 * No son ensayos agronómicos. `validacion` es zonas[zona].validacion_lluvia de pronostico.json, o null.
 */
export function comprobarPlan(args, validacion = null) {
  const lista = [];
  const agregar = (clave, ok, detalle) =>
    lista.push({ id: clave, nombre: t(`asesor.prueba.${clave}`), ok: Boolean(ok), detalle: detalle ?? t(`asesor.prueba.${clave}_detalle`) });
  const plan = planDeParcela(args);
  if (plan.estado !== "calculado") {
    agregar("plan_existe", false, plan.motivo ?? plan.errores.join(" "));
    return lista;
  }
  const conRiego = (p) => p.tarjetas.filter((x) => x.estado !== "sin_datos" && !x.sinRiego);
  const sinVolumen = { ...args, entrada: { ...args.entrada, volumenDisponible: null } };
  agregar("repetible", JSON.stringify(plan) === JSON.stringify(planDeParcela(args)));
  agregar(
    "mismas_hectareas",
    plan.tarjetas
      .filter((x) => x.estado !== "sin_datos")
      .every((x) => {
        const h = hectareasQueAlcanzan(x.area, x.dotacion, x.lamina);
        return h.p50 === x.hectareas.p50 && h.bajo === x.hectareas.bajo && h.alto === x.hectareas.alto && cobertura(x.dotacion, x.lamina.p50) === x.cobertura;
      }),
  );
  const cero = planDeParcela({ ...sinVolumen, dotacion: 0 });
  agregar("sin_agua", cero.estado === "calculado" && conRiego(cero).every((x) => x.hectareas.p50 === 0));
  const paso = Number(args.cubo?.dotaciones?.deslizador?.paso);
  if (Number.isFinite(paso) && paso > 0) {
    const mas = planDeParcela({ ...sinVolumen, dotacion: plan.dotacion + paso });
    agregar(
      "mas_agua",
      mas.estado === "calculado" &&
        plan.tarjetas.every((x) => x.estado === "sin_datos" || x.hectareas.p50 <= (mas.tarjetas.find((m) => m.id === x.id)?.hectareas.p50 ?? -Infinity)),
    );
  }
  agregar("invalidas", planDeParcela({ ...args, entrada: { ...args.entrada, area: 0 } }).tarjetas.length === 0);
  if (Array.isArray(validacion?.casos) && validacion.casos.length)
    agregar("lluvia", validacion.casos.every((x) => x.entrenamiento_fin < x.anio));
  return lista;
}
