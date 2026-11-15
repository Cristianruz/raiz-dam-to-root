// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; Codex.
// Motor puro: clima histórico, balance FAO A5, restricciones con fuente y entradas explícitas.
export function cuantil(valores, q) {
  if (!valores.length) return null;
  const v = [...valores].sort((a, b) => a - b),
    pos = (v.length - 1) * q;
  const lo = Math.floor(pos),
    hi = Math.min(lo + 1, v.length - 1);
  return v[lo] + (v[hi] - v[lo]) * (pos - lo);
}
export function demandaHistorica(
  rotacion,
  { lluvia = 0, eficiencia = null, rangoEficiencia, nivel = 0.9 } = {},
) {
  if (!rotacion?.serie?.length) return null;
  const ea = eficiencia == null ? rangoEficiencia : [eficiencia, eficiencia];
  if (
    !ea ||
    !(ea[0] > 0) ||
    ea[1] > 1 ||
    ea[1] < ea[0] ||
    nivel < 0 ||
    nivel > 1
  )
    return null;
  const [pmin, pmax] = rotacion.presiembra_mm;
  const filas = rotacion.serie.map((s) => {
    const dato = s.lluvia[String(lluvia)];
    if (!dato || !Number.isFinite(dato.neta_mm) || dato.neta_mm < 0)
      return null;
    return {
      anio: s.anio,
      neta_mm: dato.neta_mm,
      etc_mm: dato.etc_mm,
      bajo: (dato.neta_mm / ea[1] + pmin) / 100,
      central: (dato.neta_mm / ((ea[0] + ea[1]) / 2) + (pmin + pmax) / 2) / 100,
      alto: (dato.neta_mm / ea[0] + pmax) / 100,
    };
  });
  if (filas.some((f) => !f)) return null;
  return {
    filas,
    n: filas.length,
    p10: cuantil(
      filas.map((f) => f.bajo),
      0.1,
    ),
    p50: cuantil(
      filas.map((f) => f.central),
      0.5,
    ),
    p90: cuantil(
      filas.map((f) => f.alto),
      0.9,
    ),
    plan: cuantil(
      filas.map((f) => f.alto),
      nivel,
    ),
    nivel,
    eficiencia: ea,
    fuente:
      "FAO-56; datos/colab/A5_demanda_plazo.py; clima NASA POWER de la zona. Sin corrección de sesgo ETo; fechas base del modelo.",
  };
}
function ventana(mmdd, desde, hasta) {
  if (!desde || !hasta) return null;
  return desde <= hasta
    ? mmdd >= desde && mmdd <= hasta
    : mmdd >= desde || mmdd <= hasta;
}
export function evaluarPlan({
  datos,
  zona,
  parcela,
  entrada = {},
  perfil = null,
}) {
  const z = datos.zonas[zona],
    cat = datos.catalogo;
  const warnings = [],
    errors = [];
  if (parcela.zona && parcela.zona !== zona)
    errors.push("La parcela no pertenece a la zona climática seleccionada.");
  const area = Object.hasOwn(entrada, "area") ? entrada.area : parcela.area_ha;
  if (!Number.isFinite(area) || area <= 0)
    errors.push("La superficie debe ser positiva.");
  const volumen = entrada.volumenDisponible;
  const D =
    volumen == null
      ? entrada.dotacion
      : volumen / (area * datos.metodo.m3_por_millar);
  if (!Number.isFinite(D) || D < 0)
    errors.push(
      "La dotación o el volumen disponible deben ser válidos y no negativos.",
    );
  if (
    entrada.eficiencia != null &&
    (!(entrada.eficiencia > 0) || entrada.eficiencia > 1)
  )
    errors.push(
      "La eficiencia medida debe ser mayor que cero y no superar el total aplicado.",
    );
  if (
    entrada.ph != null &&
    (!Number.isFinite(entrada.ph) || entrada.ph < 0 || entrada.ph > 14)
  )
    errors.push("El pH capturado no es válido.");
  if (
    entrada.salinidad != null &&
    (!Number.isFinite(entrada.salinidad) || entrada.salinidad < 0)
  )
    errors.push("La salinidad capturada no es válida.");
  if (
    entrada.nivel != null &&
    (!Number.isFinite(entrada.nivel) ||
      entrada.nivel <= 0 ||
      entrada.nivel >= 1)
  )
    errors.push(
      "El nivel de planificación debe estar entre los extremos de la distribución.",
    );
  if (
    entrada.fecha &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(entrada.fecha) ||
      !Number.isFinite(Date.parse(entrada.fecha)) ||
      new Date(entrada.fecha).toISOString().slice(0, 10) !== entrada.fecha)
  )
    errors.push("La fecha de siembra no es válida.");
  if ((entrada.anioObservado == null) !== (entrada.riegoObservado == null))
    errors.push(
      "Para contrastar un riego necesitas tanto su ciclo como su volumen aplicado.",
    );
  if (
    entrada.riegoObservado != null &&
    (!Number.isFinite(entrada.riegoObservado) || entrada.riegoObservado < 0)
  )
    errors.push("El volumen aplicado observado no es válido.");
  if (!z?.anios?.length)
    errors.push("No hay ciclos climáticos completos para la zona.");
  if (errors.length) return { errores: errors, resultados: [], entrada };
  const cultivo =
    entrada.cultivo || (!parcela.abstencion ? parcela.cultivo_actual : null);
  const confirmado = Boolean(entrada.cultivo);
  let ids = cultivo
    ? [
        cultivo === "barbecho" ? "descanso" : cultivo,
        ...(cat.por_cultivo_actual[cultivo] ?? []),
      ]
    : [];
  if (entrada.objetivo) ids.push(entrada.objetivo);
  ids = [...new Set(ids)].filter((id) => z.rotaciones[id]);
  if (!confirmado)
    warnings.push(
      "Confirma el cultivo previo; la clasificación satelital no es una identificación de campo.",
    );
  if (!entrada.dotacionConfirmada)
    warnings.push(
      "La dotación es un escenario: confirma la disponibilidad con el módulo.",
    );
  let rango = z.parametros.ea_gravedad.valor,
    eficiencia = entrada.eficiencia ?? null;
  let fuenteEa = z.parametros.ea_gravedad.fuente;
  if (eficiencia != null)
    fuenteEa =
      "Eficiencia capturada por el usuario como medida; requiere respaldo del aforo.";
  else if (entrada.sistema && entrada.sistema !== "sin_confirmar") {
    const clave = { gravedad: "ea_superficial_referencia", goteo: "ea_goteo" }[
      entrada.sistema
    ];
    if (clave && datos.supuestos[clave]) {
      rango = [datos.supuestos[clave].valor, datos.supuestos[clave].valor];
      fuenteEa = datos.supuestos[clave].fuente;
    }
  }
  if (eficiencia == null)
    warnings.push(
      "La eficiencia no está medida. La superficie calculada depende de la referencia o rango declarado.",
    );
  const nivel = entrada.nivel ?? datos.metodo.nivel_plan;
  const resultados = ids.map((id) => {
    const rot = z.rotaciones[id],
      opcion = cat.opciones[id],
      cultivos = rot.cultivos;
    const d = demandaHistorica(rot, {
      lluvia: entrada.lluvia ?? 0,
      eficiencia,
      rangoEficiencia: rango,
      nivel,
    });
    const bloqueos = [],
      pendientes = [...warnings],
      evidencias = [];
    let riesgoHelada = null;
    const evidencia = (criterio, estado, valor, fuente) =>
      evidencias.push({ criterio, estado, valor, fuente });
    if (!d)
      return {
        id,
        nombre: rot.nombre,
        estado: "sin_datos",
        bloqueos: [],
        pendientes: ["Demanda histórica no disponible."],
        evidencias: [],
      };
    if (cultivo === "nogal" && id !== "nogal")
      bloqueos.push(
        "Una huerta establecida no se reemplaza por una rotación anual dentro de este modelo.",
      );
    const reglas = cat.filtros.filter((f) => f.aplica_a.includes(id));
    for (const f of reglas) {
      const reg = f.regla;
      if (f.id === "helada_siembra") {
        riesgoHelada = entrada.fecha
          ? (z.heladas_primavera?.[entrada.fecha.slice(5)] ?? null)
          : null;
        pendientes.push(
          riesgoHelada
            ? "Revisa la frecuencia histórica de helada. La fuente no define un umbral para aprobar o rechazar la siembra."
            : "Falta una fecha de primavera con histórico para evaluar la helada; no se supone riesgo nulo.",
        );
        evidencia(
          "Helada desde siembra hasta fin de primavera",
          "frecuencia_historica",
          riesgoHelada,
          `${z.fuente_clima}; Tmin no positiva; ${f.fuente}. Dato regional, no estación de la parcela.`,
        );
      }
      if (f.id === "chile_sin_solanaceas") {
        if (confirmado && cultivo === "chile")
          bloqueos.push(
            "No establecer chile después de chile: riesgo de continuidad de patógenos.",
          );
        if (entrada.phytophthora === "si")
          bloqueos.push(
            "Antecedente declarado de Phytophthora: requiere un historial de rotación y revisión fitosanitaria antes de reintroducir chile.",
          );
        if (!entrada.phytophthora || entrada.phytophthora === "desconocido")
          pendientes.push(
            "Falta historial de Phytophthora y de cultivos hospedantes.",
          );
        evidencia(
          "Sucesión y sanidad",
          bloqueos.length ? "revisar" : "condicional",
          cultivo,
          f.fuente,
        );
      }
      if (f.id === "alfalfa_no_en_anio_seco") {
        const minimo = reg.lamina_minima_cm / datos.metodo.cm_por_millar;
        if (D < minimo)
          bloqueos.push(
            "La dotación no cubre siquiera el establecimiento de alfalfa previsto en esta rotación.",
          );
        evidencia(
          "Establecimiento de alfalfa",
          D < minimo ? "bloqueado" : "comparado",
          { dotacion: D, minimo_millares_ha: minimo },
          f.fuente,
        );
      }
      if (f.id === "corte_verano_alfalfa_establecida") {
        if (entrada.edadAlfalfa == null)
          pendientes.push(
            "Falta edad confirmada de la alfalfa para evaluar el corte de riego.",
          );
        else if (entrada.edadAlfalfa < reg.edad_min_anios)
          bloqueos.push(
            "La alfalfa no tiene la edad mínima para el escenario de corte de riego.",
          );
        evidencia(
          "Edad de alfalfa",
          "comparado",
          entrada.edadAlfalfa,
          f.fuente,
        );
      }
      if (f.id === "atrazina" && entrada.atrazina !== "no") {
        pendientes.push(
          "Verifica el producto de atrazina usado y su intervalo de seguridad; no se aprueba automáticamente.",
        );
        evidencia(
          "Residuo de herbicida",
          "pendiente",
          entrada.atrazina ?? null,
          f.fuente,
        );
      }
      if (
        ["soca_algodon", "alfalfa_tras_alfalfa", "corte_verano_suelo"].includes(
          f.id,
        )
      ) {
        pendientes.push(
          f.id === "soca_algodon"
            ? "Confirma el calendario de cosecha y destrucción de soca."
            : f.id === "alfalfa_tras_alfalfa"
              ? "Confirma el intervalo entre la alfalfa previa y su reestablecimiento."
              : "El corte de verano necesita profundidad y salinidad de suelo medidas; no se deducen del mapa.",
        );
        evidencia(f.id, "pendiente", null, f.fuente);
      }
    }
    const mantener =
      confirmado && cultivo === id && ["alfalfa", "nogal"].includes(cultivo);
    const sec = opcion?.secuencia?.[0];
    if (cultivos.length && !mantener) {
      if (!entrada.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(entrada.fecha))
        pendientes.push("Falta la fecha de siembra prevista.");
      else {
        const dentro = ventana(
          entrada.fecha.slice(5),
          sec?.siembra?.desde,
          sec?.siembra?.hasta,
        );
        if (dentro === false)
          bloqueos.push(
            "La fecha prevista está fuera de la ventana publicada para el primer cultivo.",
          );
        if (dentro == null)
          pendientes.push(
            "No hay una ventana local completa con fuente para validar esa fecha.",
          );
        evidencia(
          "Fecha de siembra",
          dentro === false
            ? "fuera_de_ventana"
            : dentro
              ? "en_ventana"
              : "sin_rango",
          entrada.fecha,
          sec?.fuente ?? "No hay ventana local verificada.",
        );
      }
      if (cultivos.length > 1)
        pendientes.push(
          "Rotación múltiple: confirmar las fechas de los siguientes cultivos; la fecha capturada corresponde solo al primero.",
        );
    }
    for (const c of cultivos) {
      const req = datos.requisitos.cultivos[c];
      if (!req) {
        pendientes.push(`No hay requisitos de suelo publicados para ${c}.`);
        continue;
      }
      const ph = entrada.ph ?? perfil?.ph;
      if (req.ph && ph != null) {
        const [min, max] = req.ph.tolerado;
        const fuera = ph < min || ph > max;
        if (fuera)
          pendientes.push(
            `El pH está fuera del intervalo general publicado para ${c}; revisar localmente, sin descartarlo solo por el mapa.`,
          );
        evidencia(
          `pH · ${c}`,
          fuera ? "fuera_del_rango_general" : "dentro_del_rango_general",
          {
            valor: ph,
            origen: entrada.ph == null ? "mapa_regional" : "captura_usuario",
            intervalo: req.ph.tolerado,
          },
          req.ph.fuente,
        );
      } else pendientes.push(`Falta pH o rango publicado para ${c}.`);
      const sal = req.salinidad_umbral_ds_m;
      if (entrada.salinidad == null)
        pendientes.push(
          `Falta ECe de laboratorio para ${c}; no se supone salinidad nula.`,
        );
      else if (sal?.valor != null) {
        const supera = entrada.salinidad > sal.valor;
        if (supera)
          pendientes.push(
            `La ECe supera el umbral de respuesta sin merma publicado para ${c}; revisar manejo de salinidad.`,
          );
        evidencia(
          `Salinidad · ${c}`,
          supera ? "supera_umbral" : "bajo_umbral",
          { ece: entrada.salinidad, umbral: sal.valor },
          sal.fuente,
        );
      } else
        pendientes.push(
          `No hay umbral numérico de salinidad publicado para ${c}.`,
        );
      if (req.textura && !perfil?.clase_textura)
        pendientes.push(`Falta textura regional o medida para ${c}.`);
      if (req.textura?.limitante?.includes(perfil?.clase_textura))
        pendientes.push(
          `La textura del mapa tiene una limitación general para ${c}; confirmar en campo antes de decidir.`,
        );
      if (req.textura)
        evidencia(
          `Textura · ${c}`,
          "orientacion_regional",
          {
            textura: perfil?.clase_textura ?? null,
            origen: "mapa_regional",
            limitante:
              req.textura.limitante?.includes(perfil?.clase_textura) ?? null,
          },
          req.textura.fuente,
        );
    }
    if (cultivos.includes("cereal_invierno"))
      pendientes.push(
        "Cereal de invierno representa avena forrajera; su validación local de riego en Delicias está pendiente.",
      );
    const areaPlan = d.plan > 0 ? Math.min(area, (area * D) / d.plan) : 0;
    const apoyoBajo = d.filas.filter((f) => f.alto <= D).length / d.n;
    const apoyoAlto = d.filas.filter((f) => f.bajo <= D).length / d.n;
    evidencia(
      "Balance hídrico",
      "calculado",
      {
        area_ha: area,
        dotacion: D,
        presupuesto_millares: D * area,
        demanda_plan: d.plan,
        area_plan_ha: areaPlan,
        nivel,
        eficiencia: d.eficiencia,
      },
      d.fuente,
    );
    evidencia(
      "Eficiencia",
      eficiencia == null ? "referencia_no_medida" : "captura_usuario",
      d.eficiencia,
      fuenteEa,
    );
    if (opcion)
      evidencia(
        "Candidato",
        id === entrada.objetivo ? "seleccion_usuario" : "catalogo",
        id,
        opcion.fuente,
      );
    const observada = entrada.anioObservado
      ? d.filas.find((f) => f.anio === entrada.anioObservado)
      : null;
    const factor = area * datos.metodo.m3_por_millar;
    const contraste =
      observada && entrada.riegoObservado != null
        ? {
            anio: observada.anio,
            reportado_m3: entrada.riegoObservado,
            modelo_central_m3: observada.central * factor,
            modelo_bajo_m3: observada.bajo * factor,
            modelo_alto_m3: observada.alto * factor,
            diferencia_m3: entrada.riegoObservado - observada.central * factor,
            alcance:
              "Contraste con registro del usuario; exige misma superficie, cultivo, calendario y ciclo. No es calibración ni validación con una sola medición.",
          }
        : null;
    return {
      id,
      nombre: rot.nombre,
      estado: bloqueos.length
        ? "bloqueado"
        : pendientes.length
          ? "condicionado"
          : "plan_calculado",
      bloqueos,
      pendientes: [...new Set(pendientes)],
      evidencias,
      demanda: d,
      areaPlan,
      area,
      apoyoBajo,
      apoyoAlto,
      presupuesto: D * area,
      dotacion: D,
      contraste,
      esDescanso: !cultivos.length,
      plazo: rot.plazo_anios,
      fechaBase: rot.fecha_base,
      fuenteClima: z.fuente_clima,
      riesgoHelada,
    };
  });
  return {
    errores: [],
    resultados,
    entrada: { ...entrada, area, dotacion: D },
    zona,
    parcela: {
      id: parcela.id,
      zona: parcela.zona,
      cultivo_detectado: parcela.cultivo_actual,
      clasificacion_no_confiable: parcela.abstencion,
      area_del_poligono_ha: parcela.area_ha,
    },
    cultivoUsado: cultivo,
    confirmado,
    fuentes: datos.fuentes,
    metodo: datos.metodo,
    alcance:
      "Planes de agua condicionados a entradas y restricciones. No son pronósticos de rendimiento, rentabilidad ni asignación de presa.",
  };
}
