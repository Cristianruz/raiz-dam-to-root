/*
 * Raíz — cálculos de la ficha comparativa.
 * Funciones puras: se usan en el navegador (window.RaizCalc) y en las pruebas de Node.
 *
 * Supuestos del modelo (documentados en README_web.md):
 *  - La dotación (lamina_cm) es lo que llega a la parcela.
 *  - Lámina bruta que pide el cultivo = demanda neta (FAO-56) / eficiencia de aplicación.
 *  - Si el agua no alcanza para toda la parcela, se riega la superficie que alcance
 *    y el resto queda sin sembrar (ingreso 0, sin costo).
 *  - Un cultivo perenne estricto (p. ej. nogal) no puede reducir superficie: se marca en riesgo.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.RaizCalc = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const M3_POR_HA_POR_CM = 100; // 1 cm de lámina sobre 1 ha = 100 m³

  /** Volumen disponible para la parcela (m³). */
  function volumenDisponible(laminaCm, superficieHa) {
    return Math.max(0, laminaCm) * M3_POR_HA_POR_CM * superficieHa;
  }

  /** Lámina bruta que requiere el cultivo en el ciclo (cm). */
  function laminaBrutaCm(cultivo) {
    if (!(cultivo.eficiencia > 0)) throw new Error(`Eficiencia inválida para ${cultivo.id}`);
    return cultivo.demanda_neta_mm / 10 / cultivo.eficiencia;
  }

  /** Margen por hectárea regada (MXN/ha). */
  function margenPorHa(cultivo) {
    return cultivo.rendimiento_t_ha * cultivo.precio_mxn_t - cultivo.costo_mxn_ha;
  }

  /**
   * Evalúa un cultivo en una parcela con una dotación dada.
   * @returns {object} indicadores de la ficha
   */
  function evaluar(cultivo, superficieHa, laminaCm) {
    const requerida = laminaBrutaCm(cultivo);
    const volumen = volumenDisponible(laminaCm, superficieHa);
    const haRegables = requerida > 0 ? Math.min(superficieHa, volumen / (requerida * M3_POR_HA_POR_CM)) : superficieHa;
    const cobertura = superficieHa > 0 ? haRegables / superficieHa : 0;
    const margenHa = margenPorHa(cultivo);
    const ingresoNeto = haRegables * margenHa;
    const aguaUsadaM3 = haRegables * requerida * M3_POR_HA_POR_CM;
    return {
      cultivoId: cultivo.id,
      laminaRequeridaCm: requerida,
      haRegables,
      cobertura,
      margenHa,
      ingresoNeto,
      aguaUsadaM3,
      // Pesos de margen por cada m³ usado (productividad económica del agua)
      pesosPorM3: aguaUsadaM3 > 0 ? ingresoNeto / aguaUsadaM3 : 0,
      riesgoPerenne: Boolean(cultivo.perenne_estricto) && cobertura < 0.999,
    };
  }

  /** Compara el cultivo actual contra sus alternativas. */
  function compararParcela(parcela, cultivosPorId, laminaCm) {
    const ids = [parcela.cultivo_actual, ...(parcela.alternativas || [])];
    const filas = ids.map((id) => {
      const c = cultivosPorId[id];
      if (!c) throw new Error(`Cultivo "${id}" de ${parcela.id} no existe en cultivos.json`);
      return Object.assign({ cultivo: c, esActual: id === parcela.cultivo_actual },
        evaluar(c, parcela.superficie_ha, laminaCm));
    });
    // La mejor opción: mayor ingreso neto, sin riesgo de perder un perenne.
    const candidatas = filas.filter((f) => !f.riesgoPerenne);
    const mejor = (candidatas.length ? candidatas : filas)
      .reduce((a, b) => (b.ingresoNeto > a.ingresoNeto ? b : a));
    filas.forEach((f) => (f.esMejor = f === mejor));
    return filas;
  }

  /** Semáforo para el mapa según la cobertura del cultivo actual. */
  function semaforo(cobertura) {
    if (cobertura >= 0.9) return "verde";
    if (cobertura >= 0.5) return "ambar";
    return "rojo";
  }

  return { M3_POR_HA_POR_CM, volumenDisponible, laminaBrutaCm, margenPorHa, evaluar, compararParcela, semaforo };
});
