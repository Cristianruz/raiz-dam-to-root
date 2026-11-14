// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// Reglas que calcula la web con el deslizador (kit v4 §2.4; S9 §5).
// ÚNICA implementación: la usan web/app.js y las pruebas (tests/reglas.test.js).
// Ninguna cifra vive aquí: todo entra por parámetro desde cubo.json / parcelas.geojson.

/** Llave de lluvia del cubo: 0 -> "0", -20 -> "-20". */
export function llaveLluvia(r) {
  return String(Number(r));
}

/** Cobertura = min(1, D / L50). Lámina cero (descanso) => 1. D <= 0 => 0. */
export function cobertura(D, L50) {
  if (!(L50 > 0)) return 1;
  if (!(D > 0)) return 0;
  return Math.min(1, D / L50);
}

/**
 * Hectáreas que alcanzan, con su rango (bajo con L90, alto con L10).
 * lamina = {p10, p50, p90} en millares/ha.
 */
export function hectareasQueAlcanzan(areaHa, D, lamina) {
  return {
    p50: areaHa * cobertura(D, lamina.p50),
    bajo: areaHa * cobertura(D, lamina.p90),
    alto: areaHa * cobertura(D, lamina.p10),
  };
}

/** Semáforo de agua: verde si D cubre L90; ámbar si cubre L50; rojo si no; gris si abstenida. */
export function semaforoAgua(D, lamina, abstenida = false) {
  if (abstenida) return "gris";
  if (!(lamina.p50 > 0)) return "verde"; // "no irrigation needed"
  if (D >= lamina.p90) return "verde";
  if (D >= lamina.p50) return "ambar";
  return "rojo";
}

/**
 * Agua ya comprometida por los perennes en la zona:
 * demanda_perenne[r].pXX / (D * superficie_total_ha).
 * Devuelve fracciones (1 = 100 %), banderas para los mensajes y el % sin clasificar.
 */
export function aguaComprometida(zona, D, r) {
  const total = zona.superficie_total_ha;
  const abst = zona.superficie_abstenida_ha || 0;
  const base = {
    alMenos: abst > 0,
    fraccionSinClasificar: total > 0 ? abst / total : 0,
  };
  if (!(D > 0) || !(total > 0)) {
    return { ...base, sinDotacion: true, p10: null, p50: null, p90: null, excede: false };
  }
  const dem = zona.demanda_perenne_millares[llaveLluvia(r)];
  const disp = D * total;
  const p50 = dem.p50 / disp;
  return { ...base, sinDotacion: false, p10: dem.p10 / disp, p50, p90: dem.p90 / disp, excede: p50 > 1 };
}

/** Evalúa una opción del cubo para una parcela: cobertura, hectáreas y semáforo de agua. */
export function evaluarOpcion(opcion, areaHa, D, r, abstenida = false) {
  const lamina = opcion.agua.lamina_bruta[llaveLluvia(r)];
  return {
    lamina,
    cobertura: cobertura(D, lamina.p50),
    hectareas: hectareasQueAlcanzan(areaHa, D, lamina),
    semaforo: semaforoAgua(D, lamina, abstenida),
    advertencia: Boolean(opcion.advertir_si_rojo) && semaforoAgua(D, lamina, abstenida) === "rojo",
  };
}

/** Conteos de la zona para la dotación activa: semáforo de la opción ACTUAL y estado del plazo. */
export function conteosZona(features, cubo, D, r) {
  const c = { verde: 0, ambar: 0, rojo: 0, gris: 0, libre: 0, por_vencer: 0, comprometida: 0, sin_dato: 0, clasificadas: 0 };
  for (const f of features) {
    const p = f.properties;
    const ops = cubo.parcelas[p.id]?.opciones || [];
    const actual = ops.find((o) => o.id === "ACTUAL");
    const sem = p.abstencion || !actual ? "gris" : evaluarOpcion(actual, p.area_ha, D, r).semaforo;
    c[sem] += 1;
    if (!p.abstencion) c.clasificadas += 1;
    c[p.estado_plazo ?? "sin_dato"] += 1;
  }
  return c;
}

/** Sustituye marcadores {{f1}}… y dinámicos {{d}}, {{ha}}, {{cobertura}} en un texto. */
export function rellenarMarcadores(texto, valores, dinamicos, formatear = String) {
  return texto.replace(/\{\{(\w+)\}\}/g, (todo, k) => {
    if (dinamicos && k in dinamicos) return formatear(dinamicos[k], k);
    if (valores && k in valores) return formatear(valores[k], k);
    return todo; // marcador desconocido: se deja visible para que la prueba lo detecte
  });
}
