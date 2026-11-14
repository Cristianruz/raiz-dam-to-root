# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""B4 + X3.1 · Ensambla el cubo v4 con los datos REALES de data/processed (kit B4 y X3.1), por zona.

Entradas (data/processed, ya validadas por motor/ensamblar.py):
  obligatorias: parcelas_base.geojson (B1), cultivos_parcelas.csv (A4), rotaciones.json (A5)
  opcionales:   memoria_parcelas.csv y memoria_resumen.csv (A3-M), suelo_desnudo.csv (A3),
                relieve_parcelas.csv (A9), demanda_cultivos.csv (A5)
                supuestos.json (eficiencias del escenario de goteo), heladas.json (A2) y
                opciones_b3.json (B3: opciones y filtros oficiales; si no ha llegado, diseño provisional)
  por zona:     rotaciones_<zona>.json y demanda_cultivos_<zona>.csv (A5 con el clima de esa zona)
  y además:     data/params.json (constantes con fuente) y data/opciones_b4.json (opciones por cultivo).
Salidas: web/data/parcelas.geojson, web/data/cubo.json y web/data/explicaciones.json (contrato §2.2–2.5).

Escenario de goteo de La gota (kit X3.1; decisión docs/decisiones/2026-11-14_opciones_b3.md §3):
- Entradas: supuestos.json → ea_goteo y ea_superficial_referencia (valores indicativos con fuente y
  etiqueta) y la eficiencia parcelaria con que A5 calculó las láminas (rotaciones[_zona].json →
  params.ea_gravedad; si no viene ahí, supuestos.json → ea_gravedad).
- X3.1 no dice cómo pasar de la lámina por gravedad de A5 (rango de eficiencias más riego de presiembra)
  a la entrega con goteo. Hay dos lecturas: (1) ET ÷ ea_goteo y (2) entrega actual ×
  ea_superficial_referencia ÷ ea_goteo. Se toma la MAYOR entrega de las dos (el menor ahorro) y nunca
  más que la entrega actual. La referencia superficial debe caer dentro del rango de A5: si no, la zona
  queda sin escenario de goteo (no se mezclan supuestos que no cuadran).
- Con tope: misma ET y misma superficie; baja lo que sale de la presa y, con el mismo coeficiente de
  retorno, lo que regresa al acuífero. Sin tope: sale lo mismo de la presa, el agua «ahorrada» riega más
  superficie con el mismo cultivo y la ET sube en esa proporción; el retorno se deja con el mismo
  coeficiente como COTA SUPERIOR (X3.1) y se limita a presa − ET. tope_consumo compara las dos ET.
- Sin ea_goteo con fuente los tres bloques quedan en null con la nota de siempre. Una opción que no pide
  agua (descanso) no lleva escenario de goteo. La fuente y la etiqueta van una vez en cubo.meta.goteo;
  cada bloque repite la etiqueta en su primer supuesto (la ficha lo muestra).

Opciones y filtros oficiales (B3; contrato en la misma decisión, §1):
- Con data/processed/opciones_b3.json, las alternativas de cada cultivo salen de por_cultivo_actual y el
  nombre, la secuencia, los indicadores y advertir_si_rojo, de «opciones». La opción ACTUAL la sigue
  poniendo el motor (mapa «actual» de data/opciones_b4.json). Un cultivo que el archivo no liste sigue con
  el diseño provisional y se avisa. Una opción sin lámina en los archivos de la zona se omite con aviso.
- opciones[].secuencia sigue siendo la lista de cultivos (contrato §2.3); el detalle de B3 (ciclo, fechas
  de siembra, por qué, fuente) va UNA vez en cubo.opciones_catalogo.<rotación>, y cada opción dice su
  «rotacion». Los filtros tal como llegaron van en cubo.filtros_catalogo.<id>.
- opciones[].filtros lleva una entrada por filtro que aplica a la opción, con los campos del contrato
  («motivo» = texto_en y «fuente») más id, tipo, etiqueta, estado («passes», «warning» o
  «needs_local_check»), «pasa» (true, false o null = sin decidir) y «razon» (código) cuando no se decide.
  Nunca se decide con un umbral inventado: el filtro de helada adjunta prob_helada (heladas.json de la
  zona de la parcela, en la fecha calculada más cercana anterior o igual a la siembra «desde»; null fuera
  de las fechas calculadas) y solo pasa o advierte si el filtro trae regla.prob_helada_max. Con varias
  siembras manda la de mayor probabilidad, y si a alguna le falta la probabilidad el filtro no se aprueba.
  Un filtro que necesita un dato que no tenemos, o de un tipo que el motor no sabe evaluar, queda
  «needs_local_check».

Dos zonas (decisión docs/decisiones/2026-11-14_dos_zonas.md):
- La zona de cada parcela es properties.zona; si falta, es delicias_saucillo (compatibilidad con la
  entrega de una sola zona). La zona debe estar en params.zona_piloto.zonas.
- Cada zona usa SUS archivos de clima y demanda: sin sufijo para delicias_saucillo y con el sufijo
  _<zona> para las demás. Si una zona con parcelas no tiene su rotaciones_<zona>.json, sus parcelas
  quedan sin opciones (con el motivo «sin_clima_zona») y se avisa: nunca se usa el clima de otra zona.
- El cubo lleva el bloque «zona» (todas las parcelas, como antes), el bloque «zonas» (uno por zona
  con parcelas, con bbox y nombre_mostrar de params) y «localidades» (params.zona_piloto.localidades_equipo).
- Llaves de explicaciones: EXP_ZONA_<rotación> con una sola zona con datos (compatibilidad);
  EXP_ZONA_<zona>_<rotación> cuando hay más de una zona con datos (cada zona con sus láminas).

Reglas (kit B4): la web calcula cobertura, hectáreas y semáforo de agua; aquí solo se precalcula
lámina por variante de lluvia, plazo, plazo restante, compromiso, estado del plazo, bloques de zona,
semáforo de suelo y La gota. Ninguna cifra se escribe a mano: todo sale de las entradas.
Si falta una entrada obligatoria, no se escribe nada y se informa (los simulados siguen vigentes).

Uso:  python motor/b4_cubo.py [--processed data/processed] [--web web/data]
"""
import argparse
import csv
import datetime as dt
import json
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # para importar simulados.py

RAIZ = Path(__file__).resolve().parent.parent
LLUVIAS = ("0", "-20")
M3_POR_MILLAR_HA = None  # se lee de params (unidades.millar) en construir()
OBLIGATORIAS = ("parcelas_base.geojson", "cultivos_parcelas.csv", "rotaciones.json")
ANIO_VENTANA = 2026  # año no bisiesto de referencia para contar días; solo define el calendario
# Decisión 2026-11-14: los archivos sin sufijo y las parcelas sin propiedad «zona» son de esta zona.
ZONA_SIN_SUFIJO = "delicias_saucillo"
# Motivo (código, no texto) de una parcela clasificada que queda sin opciones; la web pone el texto.
SIN_CLIMA_ZONA = "sin_clima_zona"
SIN_ACTUAL = "sin_actual"  # la opción ACTUAL no se pudo armar con los archivos de la zona
# Escenario de goteo: eficiencias de data/processed/supuestos.json (decisión del 14-nov, §3).
ARCHIVO_SUPUESTOS = "supuestos.json"
EA_GOTEO, EA_SUPERFICIAL, EA_A5 = "ea_goteo", "ea_superficial_referencia", "ea_gravedad"
# Opciones y filtros oficiales (decisión del 14-nov, §1) y heladas por fecha (kit A2).
ARCHIVO_B3 = "opciones_b3.json"
ARCHIVO_HELADAS = "heladas.json"
PASSES, WARNING, NEEDS_LOCAL_CHECK = "passes", "warning", "needs_local_check"
# Datos que el motor SÍ tiene (campo «necesita» de un filtro); cualquier otro es un dato local.
DATOS_DISPONIBLES = ("heladas.json", "memoria")
# Llave de «regla» con el umbral del filtro de helada (número, o {valor: número}); sin ella no se decide.
UMBRAL_HELADA = "prob_helada_max"
# Por qué un filtro queda «needs_local_check» (códigos; el texto lo pone la web).
RAZON_DATO_LOCAL = "dato_local"            # el filtro pide un dato que no tenemos por parcela
RAZON_SIN_UMBRAL = "sin_umbral"            # la fuente no fija umbral: se muestra la probabilidad y no se decide
RAZON_SIN_PROBABILIDAD = "sin_probabilidad"  # sin fecha de siembra, fuera de las fechas calculadas o sin heladas.json
RAZON_SIN_EVALUADOR = "sin_evaluador"      # tipo de filtro que el motor no sabe evaluar
ORIGEN_B3, ORIGEN_PROVISIONAL = "b3", "provisional"
# Contrato §2.3: cubo.json pesa menos de 5 MB (lo comprueba validar_contrato.py). Los bloques de goteo y
# los filtros se repiten en cada opción: desde esta fracción del límite se avisa, antes de que falle.
LIMITE_CUBO_BYTES = 5 * 1024 * 1024
FRACCION_AVISO_PESO = 0.9


def leer_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def leer_csv(p):
    with open(p, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def num(v):
    """Texto de CSV -> float o None (vacío, NaN o None)."""
    if v is None:
        return None
    s = str(v).strip()
    if s == "" or s.lower() in ("nan", "none", "null"):
        return None
    return float(s)


def entero(v):
    x = num(v)
    return None if x is None else int(round(x))


def booleano(v):
    return str(v).strip().lower() in ("true", "1", "sí", "si", "yes")


def es_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def con_texto(v):
    return isinstance(v, str) and bool(v.strip())


# ---------------------------------------------------------------------------
# Zonas: metadatos de params y archivos de clima y demanda de cada zona
# ---------------------------------------------------------------------------
def zonas_de_params(params):
    """{id: {id, nombre, prefijo_id, bbox, localidades}} en el orden de params.zona_piloto.zonas."""
    lista = ((params.get("zona_piloto") or {}).get("zonas") or {}).get("valor") or []
    return {z["id"]: z for z in lista}


def sufijo_zona(zona):
    """'' para la zona sin sufijo (delicias_saucillo); '_<zona>' para las demás."""
    return "" if zona == ZONA_SIN_SUFIJO else f"_{zona}"


def cargar_zona(processed, zona):
    """Clima y demanda de UNA zona: rotaciones[_zona].json (láminas de A5 con el clima de la zona;
    sin él, la zona no tiene opciones) y demanda_cultivos[_zona].csv (opcional: cultivos sueltos).
    Devuelve None si falta rotaciones[_zona].json."""
    suf = sufijo_zona(zona)
    ruta_rot = processed / f"rotaciones{suf}.json"
    if not ruta_rot.exists():
        return None
    rot = leer_json(ruta_rot)
    demanda = {}
    ruta_dem = processed / f"demanda_cultivos{suf}.csv"
    if ruta_dem.exists():
        for r in leer_csv(ruta_dem):
            demanda.setdefault(r["cultivo"], {})[str(int(float(r["lluvia_pct"])))] = r
    return {"rotaciones": {r["id"]: r for r in rot["rotaciones"]}, "cultivos_def": rot.get("cultivos", {}),
            "demanda": demanda, "archivo_rot": ruta_rot.name, "params_a5": rot.get("params") or {},
            "archivo_dem": ruta_dem.name if ruta_dem.exists() else None}


def bloque_localidades(params, avisos):
    """Localidades del equipo (puntos de referencia del mapa; no son parcelas), con su fuente."""
    loc = (params.get("zona_piloto") or {}).get("localidades_equipo")
    if not loc or not loc.get("valor"):
        avisos.append("params.zona_piloto.localidades_equipo no existe: «localidades» queda vacía")
        return []
    return [{"nombre": x["nombre"], "municipio": x.get("municipio"), "lat": x["lat"], "lon": x["lon"],
             "fuente": loc.get("fuente")} for x in loc["valor"]]


# ---------------------------------------------------------------------------
# Calendario de cultivo (para meses con cultivo y días de suelo desnudo ESTIMADOS)
# ---------------------------------------------------------------------------
def dias_con_cultivo(cultivos_def, secuencia):
    """Conjunto de días del año (1..365) con cultivo en pie según siembra y etapas FAO de A5.
    Perenne = todo el año. Sin calendario declarado = None (no se estima)."""
    dias = set()
    for c in secuencia:
        d = cultivos_def.get(c)
        if d is None:
            return None
        if d.get("perenne") and not d.get("siembra"):
            return set(range(1, 366))
        if not d.get("siembra") or not d.get("dias"):
            return None
        mes, dia = d["siembra"]
        ini = dt.date(ANIO_VENTANA, mes, dia).timetuple().tm_yday
        largo = int(sum(d["dias"]))
        for k in range(largo):
            dias.add(((ini - 1 + k) % 365) + 1)
    return dias


def meses_cultivo(dias):
    if dias is None:
        return None
    meses = []
    for m in range(1, 13):
        ini = dt.date(ANIO_VENTANA, m, 1).timetuple().tm_yday
        fin = (dt.date(ANIO_VENTANA, m + 1, 1).timetuple().tm_yday - 1) if m < 12 else 365
        meses.append(1 if any(d in dias for d in range(ini, fin + 1)) else 0)
    return meses


def dias_desnudo_ventana(dias, params):
    """Días de la ventana de suelo desnudo (params.suelo.ventana_desnudo) SIN cultivo en pie."""
    if dias is None:
        return None
    v = params["suelo"]["ventana_desnudo"]["valor"]
    mi, di = (int(x) for x in v["inicio"].split("-"))
    mf, df = (int(x) for x in v["fin"].split("-"))
    a = dt.date(ANIO_VENTANA, mi, di).timetuple().tm_yday
    b = dt.date(ANIO_VENTANA, mf, df).timetuple().tm_yday
    return sum(1 for d in range(a, b + 1) if d not in dias)


# ---------------------------------------------------------------------------
# Plazo, estado y La gota
# ---------------------------------------------------------------------------
def plazo_params(params, clave):
    mapa = {"alfalfa": "alfalfa", "nogal": "nogal_horizonte", "anual": "anual"}
    v = params["plazo"][mapa[clave]]["valor"]
    return {"min": v["min"], "max": v["max"]} if isinstance(v, dict) else {"min": v, "max": v}


def estado_plazo(cultivo, edad, abstencion, params):
    if abstencion:
        return None
    if cultivo == "nogal":
        return "comprometida"
    if cultivo == "alfalfa":
        umbral = params["plazo"]["alfalfa_por_vencer"]["valor"]
        return "por_vencer" if (edad is not None and edad >= umbral) else "comprometida"
    return "libre"


def flujos_gota(area_ha, l50_millares, neta_mm, params, m3_millar):
    """Flujos SIN redondear de X3.1 (m³) con la lámina P50 de lluvia 0: los usan el bloque «gota» y el
    escenario de goteo. Balance: ET + acuífero + otras = presa."""
    conduccion = params["eficiencia"]["conduccion"]["valor"]["media"]
    c_ret = params["gota"]["c_retorno_superficial"]["valor"]
    mm_a_m3_ha = m3_millar / params["unidades"]["millar"]["valor"]["lamina_mm"]
    llegan = l50_millares * m3_millar * area_ha
    salen = llegan / conduccion
    et = (neta_mm or 0) * mm_a_m3_ha * area_ha
    ret = c_ret * salen
    otras = salen - et - ret
    if otras < -1e-6:
        raise ValueError(f"La gota no cierra (otras pérdidas negativas: {otras:.1f} m³); revise láminas y neta")
    return {"salen": salen, "llegan": llegan, "et": et, "ret": ret, "otras": otras,
            "conduccion": conduccion, "c_ret": c_ret}


def redondear(x):
    return round(x, 1)


def _bloque(salen, llegan, et, ret, supuestos):
    """Bloque de La gota del contrato (§2.3) con sus seis flujos redondeados; «otras» cierra el balance."""
    return {"m3_salen_presa": redondear(salen), "m3_perdidas_canal": redondear(salen - llegan),
            "m3_llegan_parcela": redondear(llegan), "m3_consume_cultivo_et": redondear(et),
            "m3_regresan_acuifero": redondear(ret), "m3_otras_perdidas": redondear(max(salen - et - ret, 0.0)),
            "supuestos": supuestos}


def bloque_gota(area_ha, l50_millares, neta_mm, params, m3_millar, flujos=None):
    """X3.1 con la lámina P50 de lluvia 0. Balance: ET + acuífero + otras = presa."""
    f = flujos or flujos_gota(area_ha, l50_millares, neta_mm, params, m3_millar)
    return _bloque(f["salen"], f["llegan"], f["et"], f["ret"], [
        f"Conduction efficiency: params.eficiencia.conduccion (mean; {params['eficiencia']['conduccion']['fuente']})",
        f"Return coefficient applied to dam outflow: params.gota.c_retorno_superficial ({params['gota']['c_retorno_superficial']['fuente']})",
        "Crop consumption = net irrigation requirement (ETc − effective rain) from A5",
    ])


# ---------------------------------------------------------------------------
# Escenario de goteo (kit X3.1) con las eficiencias de data/processed/supuestos.json
# ---------------------------------------------------------------------------
def leer_goteo(processed):
    """(goteo, motivo). goteo = {ea_goteo, ea_superficial_referencia: {valor, etiqueta, fuente}} más el
    rango de ea_gravedad de supuestos.json (respaldo si rotaciones no lo trae), o None con el motivo.
    Cada valor debe venir con fuente y etiqueta: sin ellas no hay escenario (nunca se inventa)."""
    ruta = Path(processed) / ARCHIVO_SUPUESTOS
    if not ruta.exists():
        return None, f"falta {ARCHIVO_SUPUESTOS} en la caché"
    sup = leer_json(ruta)
    goteo = {"archivo": f"data/processed/{ARCHIVO_SUPUESTOS}"}
    for clave in (EA_GOTEO, EA_SUPERFICIAL):
        d = sup.get(clave) if isinstance(sup, dict) else None
        v = d.get("valor") if isinstance(d, dict) else None
        if not es_num(v) or not 0 < v <= 1:
            return None, f"{ARCHIVO_SUPUESTOS} no trae {clave} con un valor entre 0 y 1"
        if not (con_texto(d.get("fuente")) and con_texto(d.get("etiqueta"))):
            return None, f"{ARCHIVO_SUPUESTOS}: {clave} viene sin fuente o sin etiqueta"
        goteo[clave] = {"valor": v, "etiqueta": d["etiqueta"], "fuente": d["fuente"]}
    if not goteo[EA_GOTEO]["valor"] > goteo[EA_SUPERFICIAL]["valor"]:
        return None, (f"{ARCHIVO_SUPUESTOS}: {EA_GOTEO} no es mayor que {EA_SUPERFICIAL}; "
                      "con esos valores el goteo no cambia la entrega")
    goteo["_ea_a5_respaldo"] = sup.get(EA_A5)
    return goteo, None


def rango_ea_a5(dz, goteo):
    """Rango {valor: [min, max], etiqueta, fuente, archivo} de la eficiencia parcelaria con que A5
    calculó las láminas de la zona: rotaciones[_zona].json → params.ea_gravedad y, si no viene ahí,
    supuestos.json → ea_gravedad. None si ninguno trae un rango."""
    candidatos = ((f"data/processed/{dz['archivo_rot']}", dz["params_a5"].get(EA_A5)),
                  (goteo["archivo"], goteo.get("_ea_a5_respaldo")))
    for archivo, d in candidatos:
        v = d.get("valor") if isinstance(d, dict) else None
        if isinstance(v, dict):
            v = [v.get("min"), v.get("max")]
        if isinstance(v, list) and len(v) == 2 and all(es_num(x) for x in v) and v[0] <= v[1]:
            return {"valor": [v[0], v[1]], "etiqueta": d.get("etiqueta"), "fuente": d.get("fuente"), "archivo": archivo}
    return None


def bloques_goteo(f, goteo):
    """(gota_goteo_con_tope, gota_goteo_sin_tope, tope_consumo) de una opción a partir de sus flujos SIN
    redondear (flujos_gota) y de las eficiencias de leer_goteo(). (None, None, None) si la opción no
    pide agua. Fórmulas (kit X3.1; la lectura elegida está en el encabezado de este archivo):
      entrega con goteo = la MAYOR de (ET ÷ ea_goteo) y (entrega actual × ea_superficial ÷ ea_goteo),
                          sin pasar de la entrega actual;
      con tope: misma ET; presa = entrega con goteo ÷ conducción; acuífero = coeficiente × presa;
      sin tope: misma presa y misma entrega; ET × (presa actual ÷ presa con goteo);
                acuífero = el menor de (coeficiente × presa) y (presa − ET);
      en los dos, «otras pérdidas» cierra el balance."""
    llegan, salen, et, conduccion, c_ret = f["llegan"], f["salen"], f["et"], f["conduccion"], f["c_ret"]
    if not llegan > 0:
        return None, None, None
    ea_g, ea_s = goteo[EA_GOTEO]["valor"], goteo[EA_SUPERFICIAL]["valor"]
    llegan_g = min(llegan, max(et / ea_g, llegan * ea_s / ea_g))
    salen_g = llegan_g / conduccion
    ret_g = c_ret * salen_g
    if salen_g - et - ret_g < -1e-6:
        raise ValueError("El goteo con tope no cierra (otras pérdidas negativas); revise las eficiencias de "
                         f"{ARCHIVO_SUPUESTOS} y el coeficiente de retorno")
    # Sin tope: el agua que deja de salir de la presa riega más superficie con el mismo cultivo.
    et_s = et * (salen / salen_g)
    ret_s = min(c_ret * salen, salen - et_s)
    if ret_s < -1e-6:
        raise ValueError("El goteo sin tope no cierra (la ET supera lo que sale de la presa)")
    etiqueta = goteo[EA_GOTEO]["etiqueta"]
    # Frases cortas (van en cada opción y el cubo pesa): la lectura completa está en cubo.meta.notas.
    origen = f"Drip and surface field efficiencies: {etiqueta} ({ARCHIVO_SUPUESTOS})"
    con = _bloque(salen_g, llegan_g, et, ret_g, [
        origen,
        "Same crop ET and area; real recharge may fall more (drip percolates less)",
    ])
    sin = _bloque(salen, llegan, et_s, max(ret_s, 0.0), [
        origen,
        "Same dam water irrigates more area of the same crop; aquifer return is an upper bound",
    ])
    tope = {"et_historica_m3": redondear(et), "et_goteo_sin_tope_m3": redondear(et_s),
            "cumple_sin_tope": bool(et_s <= et + 1e-9),
            "base_historica": "ET of the current irrigation method for this option (gota.m3_consume_cultivo_et)"}
    return con, sin, tope


# ---------------------------------------------------------------------------
# Opciones (láminas de la zona de la parcela)
# ---------------------------------------------------------------------------
def opcion_desde(dz, rot_id, params, avisos):
    """Con los datos de UNA zona (cargar_zona): (secuencia, plazo_clave, lamina{r:{p10,p50,p90}},
    neta_mm_p50) o None si la opción no está en rotaciones ni en demanda de esa zona."""
    if rot_id in dz["rotaciones"]:
        r = dz["rotaciones"][rot_id]
        lam = {k: {q: r["lamina_bruta_millares"][k][q] for q in ("p10", "p50", "p90")} for k in LLUVIAS}
        neta = r["lamina_bruta_millares"]["0"].get("neta_mm_p50")
        sec = r["cultivos"] or ["descanso"]
        if r.get("plazo_anios") and r.get("plazo") in ("alfalfa", "nogal", "anual"):
            esperado = plazo_params(params, r["plazo"])
            if {"min": r["plazo_anios"]["min"], "max": r["plazo_anios"]["max"]} != esperado:
                avisos.append(f"{dz['archivo_rot']} {rot_id}: plazo_anios {r['plazo_anios']} ≠ params {esperado}; se usa params")
        return sec, r.get("plazo", "anual"), lam, neta
    if rot_id in dz["demanda"]:  # cultivo suelto sin rotación (p. ej. cereal_invierno)
        d = dz["demanda"][rot_id]
        lam = {k: {"p10": num(d[k]["bruta_millares_p10"]), "p50": num(d[k]["bruta_millares_p50"]),
                   "p90": num(d[k]["bruta_millares_p90"])} for k in LLUVIAS}
        return [rot_id], "anual", lam, num(d["0"]["neta_mm_p50"])
    return None


def bloque_zona(nombre, props, cubo_parcelas):
    """Bloque de zona (kit B4 paso 7) sobre un conjunto de parcelas. Abstenidas: no suman a perennes;
    el indicador es un mínimo. Se usa igual para el total («zona») y para cada zona («zonas.<id>»)."""
    no_abst = [p for p in props if not p["abstencion"]]
    perennes = [p for p in no_abst if p["cultivo_actual"] in ("alfalfa", "nogal") and cubo_parcelas[p["id"]]["opciones"]]
    demanda = {r: {q: round(sum(p["area_ha"] * cubo_parcelas[p["id"]]["opciones"][0]["agua"]["lamina_bruta"][r][q]
                                for p in perennes), 2) for q in ("p10", "p50", "p90")} for r in LLUVIAS}
    estados = [p["estado_plazo"] for p in props]
    return {
        "nombre": nombre,
        "superficie_total_ha": round(sum(p["area_ha"] for p in props), 2),
        "superficie_clasificada_ha": round(sum(p["area_ha"] for p in no_abst), 2),
        "superficie_abstenida_ha": round(sum(p["area_ha"] for p in props if p["abstencion"]), 2),
        "superficie_perenne_ha": round(sum(p["area_ha"] for p in perennes), 2),
        "demanda_perenne_millares": demanda,
        "conteos": {"total": len(props), "libre": estados.count("libre"), "por_vencer": estados.count("por_vencer"),
                    "comprometida": estados.count("comprometida"), "abstenida": estados.count(None)},
    }


# ---------------------------------------------------------------------------
# Opciones y filtros oficiales (B3): data/processed/opciones_b3.json y heladas.json
# ---------------------------------------------------------------------------
def heladas_de_zona(heladas, zona):
    """Bloque de heladas de una zona: la raíz del archivo es la zona sin sufijo y las demás van en
    heladas.zonas.<id>. None si el archivo no trae esa zona."""
    if not isinstance(heladas, dict):
        return None
    bloque = heladas if zona == ZONA_SIN_SUFIJO else (heladas.get("zonas") or {}).get(zona)
    if isinstance(bloque, dict) and isinstance(bloque.get("prob_helada_despues_de"), dict):
        return bloque
    return None


def prob_helada_en(bloque, fecha):
    """(probabilidad, fecha calculada) de helada después de «fecha» (MM-DD): la de la fecha calculada
    más cercana anterior o igual. (None, None) si la fecha queda fuera de las fechas calculadas (antes
    de la primera o después de la última): no se extrapola."""
    tabla = (bloque or {}).get("prob_helada_despues_de") or {}
    fechas = sorted(tabla)  # «MM-DD» con ceros: el orden alfabético es el del calendario
    if not fechas or not con_texto(fecha) or not fechas[0] <= fecha <= fechas[-1]:
        return None, None
    cercana = max(x for x in fechas if x <= fecha)
    return tabla[cercana], cercana


def umbral_helada(regla):
    """Umbral del filtro de helada si su «regla» lo trae (prob_helada_max: número o {valor}); si no, None."""
    v = (regla or {}).get(UMBRAL_HELADA) if isinstance(regla, dict) else None
    if isinstance(v, dict):
        v = v.get("valor")
    return v if es_num(v) and 0 <= v <= 1 else None


def evidencia_helada(definicion, bloque_heladas):
    """(prob_helada, evidencia, completa) de una opción de B3: la probabilidad de helada después de la
    siembra «desde» de cada cultivo de su secuencia. Si hay varias siembras manda la de mayor probabilidad
    y las demás van en «otras_siembras». Sin fechas o sin heladas de la zona, la probabilidad es None.
    «completa» es True solo si TODAS las siembras tienen probabilidad: con alguna sin calcular el filtro
    no se da por pasado."""
    siembras = []
    for paso in (definicion or {}).get("secuencia") or []:
        desde = ((paso or {}).get("siembra") or {}).get("desde") if isinstance(paso, dict) else None
        if not con_texto(desde):
            continue
        prob, calculada = prob_helada_en(bloque_heladas, desde)
        siembras.append({"cultivo": paso.get("cultivo"), "ciclo": paso.get("ciclo"), "siembra_desde": desde,
                         "fecha_calculada": calculada, "prob_helada": prob})
    if not siembras:
        return None, {}, False
    con_prob = [x for x in siembras if x["prob_helada"] is not None]
    principal = max(con_prob, key=lambda x: x["prob_helada"]) if con_prob else siembras[0]
    evidencia = {k: v for k, v in principal.items() if k != "prob_helada"}
    otras = [x for x in siembras if x is not principal]
    if otras:
        evidencia["otras_siembras"] = otras
    return principal["prob_helada"], evidencia, len(con_prob) == len(siembras)


def filtros_de_opcion(rot_ref, b3, bloque_heladas):
    """Entradas de opciones[].filtros para la rotación rot_ref: una por filtro de B3 que la nombra en
    «aplica_a». Campos del contrato (§2.3): «motivo» (= texto_en) y «fuente»; además id, tipo, etiqueta,
    estado, «pasa» (true, false o null) y «razon» cuando no se decide. Ver el encabezado del archivo."""
    salida = []
    for f in b3.get("filtros") or []:
        if rot_ref not in (f.get("aplica_a") or []):
            continue
        entrada = {"id": f.get("id"), "tipo": f.get("tipo"), "estado": NEEDS_LOCAL_CHECK, "pasa": None,
                   "motivo": f.get("texto_en"), "fuente": f.get("fuente"), "etiqueta": f.get("etiqueta")}
        faltan = [n for n in (f.get("necesita") or []) if n not in DATOS_DISPONIBLES]
        prob, umbral, completa = None, None, False
        if f.get("tipo") == "helada":
            prob, evidencia, completa = evidencia_helada((b3.get("opciones") or {}).get(rot_ref), bloque_heladas)
            umbral = umbral_helada(f.get("regla"))
            if umbral is not None:
                evidencia["umbral_prob_helada"] = umbral
            entrada["prob_helada"] = prob
            entrada["evidencia"] = evidencia
        if faltan:
            entrada["razon"] = RAZON_DATO_LOCAL
        elif f.get("tipo") != "helada":
            entrada["razon"] = RAZON_SIN_EVALUADOR
        elif prob is None:
            entrada["razon"] = RAZON_SIN_PROBABILIDAD
        elif umbral is None:
            entrada["razon"] = RAZON_SIN_UMBRAL
        elif prob > umbral:
            # Una siembra conocida ya supera el umbral de la fuente: advertencia, falten o no las demás.
            entrada["estado"], entrada["pasa"] = WARNING, False
        elif not completa:
            # Ninguna siembra conocida supera el umbral, pero falta la probabilidad de otra: no se aprueba.
            entrada["razon"] = RAZON_SIN_PROBABILIDAD
        else:
            entrada["estado"], entrada["pasa"] = PASSES, True
        salida.append(entrada)
    return salida


def completar_distrito_dotaciones(distrito, dotaciones, params, avisos):
    """Agrega a los bloques «distrito» y «dotaciones» (motor/simulados.py los arma desde params) lo que la
    página necesita para no escribir nada a mano: la etiqueta de La Boquilla y del acuífero tal como está
    en params, y la variante en inglés de los textos en español (nota_en, equivalencia_en,
    punto_medicion_en). Solo agrega campos; los que ya existen no cambian. Lo que params no traiga queda
    en null y se avisa."""
    d = params["distrito"]
    distrito["boquilla"]["etiqueta_namo"] = d["namo_hm3"].get("etiqueta")
    distrito["boquilla"]["etiqueta_almacenamiento"] = d["almacenamiento_hm3"].get("etiqueta")
    distrito["acuifero_0831"]["etiqueta"] = params["acuifero"]["disponibilidad_hm3_anio"].get("etiqueta")
    faltan = []
    dz = params["dotaciones"]
    for marca in dotaciones["marcas"]:
        marca["nota_en"] = dz[marca["id"]].get("nota_en")
        if marca.get("nota") and not marca["nota_en"]:
            faltan.append(f"dotaciones.{marca['id']}.nota_en")
    dotaciones["equivalencia_en"] = params["unidades"]["millar"].get("nota_en")
    if not dotaciones["equivalencia_en"]:
        faltan.append("unidades.millar.nota_en")
    pm = dz["punto_medicion"]
    if pm.get("valor_en") and pm.get("nota_en"):
        # Misma composición que el texto en español: valor, etiqueta y nota.
        dotaciones["punto_medicion_en"] = f"{pm['valor_en']} {pm['etiqueta']}; {pm['nota_en']}"
    else:
        dotaciones["punto_medicion_en"] = None
        faltan.append("dotaciones.punto_medicion.valor_en o nota_en")
    if faltan:
        avisos.append("data/params.json no trae la variante en inglés de: " + ", ".join(faltan)
                      + "; quedan en null (la página muestra el texto en español)")


def ventana_desnudo(params):
    """Ventana de suelo desnudo (params.suelo.ventana_desnudo) para cubo.meta: la página lee de aquí los
    meses de la «temporada de viento» en vez de escribirlos a mano."""
    v = params["suelo"]["ventana_desnudo"]
    return {"inicio": v["valor"]["inicio"], "fin": v["valor"]["fin"], "unidad": v.get("unidad"),
            "fuente": v.get("fuente"), "etiqueta": v.get("etiqueta")}


# ---------------------------------------------------------------------------
# Construcción
# ---------------------------------------------------------------------------
def construir(processed=RAIZ / "data/processed", web=RAIZ / "web/data", params_ruta=RAIZ / "data/params.json",
              opciones_ruta=RAIZ / "data/opciones_b4.json", escribir=True):
    processed, web = Path(processed), Path(web)
    faltan = [f for f in OBLIGATORIAS if not (processed / f).exists()]
    if faltan:
        return {"ejecutado": False, "motivo": f"faltan entradas obligatorias en {processed}: {faltan}"}

    params = leer_json(params_ruta)
    cfg = leer_json(opciones_ruta)
    m3_millar = params["unidades"]["millar"]["valor"]["m3_por_ha"]
    avisos = []

    base = leer_json(processed / "parcelas_base.geojson")
    cult = {r["id"]: r for r in leer_csv(processed / "cultivos_parcelas.csv")}
    memoria = {}
    if (processed / "memoria_parcelas.csv").exists():
        for r in leer_csv(processed / "memoria_parcelas.csv"):
            memoria.setdefault(r["id"], []).append({"anio": int(float(r["anio_agricola"])), "estado": r["estado"]})
    resumen = {r["id"]: r for r in leer_csv(processed / "memoria_resumen.csv")} if (processed / "memoria_resumen.csv").exists() else {}
    suelo = {r["id"]: r for r in leer_csv(processed / "suelo_desnudo.csv")} if (processed / "suelo_desnudo.csv").exists() else {}
    relieve = {r["id"]: r for r in leer_csv(processed / "relieve_parcelas.csv")} if (processed / "relieve_parcelas.csv").exists() else {}
    if not memoria:
        avisos.append("Sin memoria (A3-M): edad y memoria quedan en null; toda alfalfa = comprometida («age not available»)")

    # Zona de cada parcela (sin propiedad = zona sin sufijo) y datos de clima y demanda de cada zona.
    zonas_meta = zonas_de_params(params)
    zona_de = {f["properties"]["id"]: (f["properties"].get("zona") or ZONA_SIN_SUFIJO) for f in base["features"]}
    desconocidas = sorted(set(zona_de.values()) - set(zonas_meta))
    if desconocidas:
        raise ValueError(f"zonas de parcelas_base.geojson que no están en params.zona_piloto.zonas: {desconocidas}")
    zonas_presentes = [z for z in zonas_meta if z in set(zona_de.values())]  # orden de params
    datos_zona = {z: cargar_zona(processed, z) for z in zonas_presentes}
    for z in zonas_presentes:
        if datos_zona[z] is None:
            n = sum(1 for v in zona_de.values() if v == z)
            avisos.append(f"Zona {z}: falta rotaciones{sufijo_zona(z)}.json (láminas con el clima de la zona); "
                          f"sus {n} parcelas quedan sin opciones (no se usa el clima de otra zona)")
    zonas_con_datos = [z for z in zonas_presentes if datos_zona[z] is not None]
    prefijar = len(zonas_con_datos) > 1  # llaves EXP_ZONA_<zona>_<rotación> solo con más de una zona con datos

    def llave_expl(zona, rot_ref):
        return f"EXP_ZONA_{zona}_{rot_ref}" if prefijar else f"EXP_ZONA_{rot_ref}"

    # Mediana POR ZONA de días de suelo desnudo medidos: referencia del semáforo de suelo de la opción ACTUAL.
    mediana_zona = {}
    for z in zonas_presentes:
        medidos = [entero(resumen[pid].get("dias_suelo_desnudo_mediana"))
                   for pid, zz in zona_de.items() if zz == z and pid in resumen]
        medidos = [x for x in medidos if x is not None]
        mediana_zona[z] = statistics.median(medidos) if medidos else None

    # Escenario de goteo (X3.1): eficiencias de supuestos.json y, por zona, que la referencia superficial
    # caiga en el rango de eficiencia con que A5 calculó las láminas de esa zona.
    goteo, motivo_goteo = leer_goteo(processed)
    goteo_zona, rangos_a5 = {}, {}
    for z in zonas_con_datos:
        rangos_a5[z] = rango_ea_a5(datos_zona[z], goteo) if goteo else None
        goteo_zona[z] = None
        if goteo is None:
            continue
        if rangos_a5[z] is None:
            avisos.append(f"Zona {z}: ni {datos_zona[z]['archivo_rot']} ni {ARCHIVO_SUPUESTOS} traen el rango "
                          f"{EA_A5} con que A5 calculó las láminas; la zona queda sin escenario de goteo")
        elif not rangos_a5[z]["valor"][0] <= goteo[EA_SUPERFICIAL]["valor"] <= rangos_a5[z]["valor"][1]:
            avisos.append(f"Zona {z}: {EA_SUPERFICIAL} ({goteo[EA_SUPERFICIAL]['valor']}) queda fuera del rango "
                          f"{EA_A5} de A5 {rangos_a5[z]['valor']}; la zona queda sin escenario de goteo")
        else:
            goteo_zona[z] = goteo
    hay_goteo = any(goteo_zona.values())

    # Opciones y filtros oficiales (B3) si ya llegaron; si no, el diseño provisional de data/opciones_b4.json.
    b3 = leer_json(processed / ARCHIVO_B3) if (processed / ARCHIVO_B3).exists() else None
    def_b3 = (b3 or {}).get("opciones") or {}
    heladas = leer_json(processed / ARCHIVO_HELADAS) if (processed / ARCHIVO_HELADAS).exists() else None
    if b3 is not None and heladas is None and any(f.get("tipo") == "helada" for f in b3.get("filtros") or []):
        avisos.append(f"Falta {ARCHIVO_HELADAS}: los filtros de helada quedan «{NEEDS_LOCAL_CHECK}» sin probabilidad")
    provisionales, omitidas, filtros_cache, secuencias_distintas = set(), {}, {}, set()

    def nombre_en(rot_id):
        """Nombre en inglés de una rotación: el de B3 si la define; si no, el del diseño provisional."""
        d = def_b3.get(rot_id) or {}
        return d["nombre_en"] if con_texto(d.get("nombre_en")) else cfg["nombres_en"].get(rot_id, rot_id)

    def alternativas_de(cultivo, actual):
        """Alternativas de un cultivo actual: las de B3 (por_cultivo_actual) o, si B3 no ha llegado o no
        lista ese cultivo, las provisionales. La rotación ACTUAL no se repite como alternativa."""
        if b3 is not None:
            lista = (b3.get("por_cultivo_actual") or {}).get(cultivo)
            if isinstance(lista, list):
                return [x for x in dict.fromkeys(lista) if x != actual]
            provisionales.add(cultivo)
        return cfg["alternativas"].get(cultivo, [])

    def filtros_de(zona, rot_ref):
        """Filtros de B3 de una rotación en una zona (no dependen de la parcela: se calculan una vez)."""
        if b3 is None:
            return []
        if (zona, rot_ref) not in filtros_cache:
            filtros_cache[(zona, rot_ref)] = filtros_de_opcion(rot_ref, b3, heladas_de_zona(heladas, zona))
        return filtros_cache[(zona, rot_ref)]

    features, cubo_parcelas, usadas = [], {}, set()
    for f in base["features"]:
        pb = f["properties"]
        pid = pb["id"]
        zona = zona_de[pid]
        dz = datos_zona[zona]
        c = cult.get(pid)
        if c is None:
            avisos.append(f"{pid}: sin fila en cultivos_parcelas.csv; se marca sin_clasificar y abstenida")
        cultivo = (c or {}).get("cultivo_actual") or "sin_clasificar"
        abst = booleano((c or {}).get("abstencion", True)) if c else True
        edad = entero((c or {}).get("edad_perenne_anios")) if not abst else None
        if cultivo not in ("alfalfa", "nogal"):
            edad = None
        acuerdo = (c or {}).get("acuerdo_metodos") or "1/1"
        acuerdo = "1/1" if acuerdo.startswith("1/1") else acuerdo
        mem = sorted(memoria.get(pid, []), key=lambda m: m["anio"]) or None
        s = suelo.get(pid, {})
        rr = resumen.get(pid, {})
        props = {
            "id": pid, "zona": zona, "area_ha": round(float(pb["area_ha"]), 2), "modulo": pb.get("modulo"),
            "ftw_confianza": pb.get("ftw_confianza"), "protagonista": bool(pb.get("protagonista", False)),
            "cultivo_actual": cultivo, "prob_max": num((c or {}).get("prob_max")), "acuerdo_metodos": acuerdo,
            "abstencion": abst,
            "dias_suelo_desnudo_feb_abr": entero(s.get("dias_suelo_desnudo_feb_abr")),
            "ndvi_ultimo_mes": num(s.get("ndvi_ultimo_mes")),
            "memoria": mem,
            "dias_suelo_desnudo_mediana": entero(rr.get("dias_suelo_desnudo_mediana")),
            "edad_perenne_anios": edad,
            "estado_plazo": estado_plazo(cultivo, edad, abst, params),
        }
        if pid in relieve:
            r = relieve[pid]
            props["relieve"] = {"pendiente_media_pct": num(r["pendiente_media_pct"]),
                                "aportacion_externa_ha": num(r["aportacion_externa_ha"]),
                                "frac_depresion": num(r["frac_depresion"])}
        features.append({"type": "Feature", "properties": props, "geometry": f["geometry"]})

        opciones = []
        if not abst and cultivo in cfg["actual"] and dz is None:
            # Parcela clasificada de una zona sin clima: sin opciones y con el motivo (ya avisado por zona).
            cubo_parcelas[pid] = {"opciones": [], "sin_opciones": SIN_CLIMA_ZONA}
            continue
        if not abst and cultivo in cfg["actual"]:
            ids = [cfg["actual"][cultivo]] + alternativas_de(cultivo, cfg["actual"][cultivo])
            sec_actual = (opcion_desde(dz, cfg["actual"][cultivo], params, avisos) or [[]])[0]
            dias_actual = None
            for k, rot_id in enumerate(ids):
                o = opcion_desde(dz, rot_id, params, avisos)
                if o is None:
                    # Sin lámina en los archivos de la zona: se omite (nunca se inventa) y se avisa por zona.
                    omitidas[(zona, rot_id)] = omitidas.get((zona, rot_id), 0) + 1
                    continue
                sec, plazo_clave, lam, neta = o
                es_actual = (k == 0)
                plazo = plazo_params(params, plazo_clave)
                nota = None
                if plazo_clave == "nogal":
                    restante, nota = dict(plazo), "calculation horizon; orchards live longer"
                elif es_actual and plazo_clave == "alfalfa":
                    if edad is None:
                        restante, nota = dict(plazo), "age not available"
                    else:
                        restante = {"min": max(0, plazo["min"] - edad), "max": max(0, plazo["max"] - edad)}
                else:
                    restante = dict(plazo)
                compromiso = {r: {"min": round(lam[r]["p50"] * restante["min"], 2),
                                  "max": round(lam[r]["p50"] * restante["max"], 2)} for r in LLUVIAS}
                dias = dias_con_cultivo(dz["cultivos_def"], [x for x in sec if x != "descanso"]) if sec != ["descanso"] else None
                if es_actual:
                    dd = props["dias_suelo_desnudo_mediana"]
                    if dd is None:
                        dd = props["dias_suelo_desnudo_feb_abr"]
                    origen = "medido"
                    if dd is None:
                        dd, origen = dias_desnudo_ventana(dias, params), "estimado"
                    dias_actual = dd
                    ref = mediana_zona[zona]
                    if ref is None or dd is None:
                        sem_suelo = "gris"
                    else:
                        sem_suelo = "verde" if dd < ref else ("ambar" if dd == ref else "rojo")
                else:
                    dd, origen = dias_desnudo_ventana(dias, params), "estimado"
                    if dd is None or dias_actual is None:
                        sem_suelo = "gris"
                    else:
                        sem_suelo = "verde" if dd < dias_actual else ("ambar" if dd == dias_actual else "rojo")
                rot_ref = cfg["actual"][cultivo] if es_actual else rot_id
                usadas.add((zona, rot_ref, plazo_clave))
                # Indicadores de suelo, secuencia y advertencia: de B3 si define la rotación; si no,
                # los del diseño provisional. La lámina y el calendario son siempre los de A5 (sec).
                d_b3 = def_b3.get(rot_ref)
                suelo_op = {"dias_desnudo": dd, "dias_desnudo_origen": origen}
                if d_b3 is not None:
                    ind = d_b3.get("indicadores") or {}
                    sec_b3 = [x["cultivo"] for x in d_b3.get("secuencia") or [] if con_texto((x or {}).get("cultivo"))]
                    secuencia = sec_b3 or sec
                    if sec_b3 and set(sec_b3) != {x for x in sec if x != "descanso"}:
                        secuencias_distintas.add(rot_ref)
                    suelo_op.update({"leguminosa": ind.get("leguminosa"),
                                     # Seguir con la rotación actual no rompe su propio ciclo de plagas.
                                     "ruptura_plagas": False if es_actual else ind.get("ruptura_plagas"),
                                     "raiz_profunda": ind.get("raiz_profunda"), "riesgo_salinidad": None})
                    advertir = (not es_actual) and d_b3.get("advertir_si_rojo") is True
                else:
                    secuencia = sec
                    suelo_op.update({"leguminosa": "alfalfa" in sec,
                                     "ruptura_plagas": (not es_actual) and set(sec) != set(sec_actual),
                                     "riesgo_salinidad": None})
                    advertir = (not es_actual) and ("alfalfa" in sec) and cultivo != "alfalfa"
                flujos = flujos_gota(props["area_ha"], lam["0"]["p50"], neta, params, m3_millar)
                con_tope, sin_tope, tope = bloques_goteo(flujos, goteo_zona[zona]) if goteo_zona[zona] else (None, None, None)
                opciones.append({
                    "id": "ACTUAL" if es_actual else rot_id,
                    "rotacion": rot_ref,
                    "nombre": (f"Current rotation: {nombre_en(rot_ref)}" if es_actual else nombre_en(rot_ref)),
                    "secuencia": secuencia,
                    "agua": {"lamina_bruta": lam, "plazo_anios": plazo, "plazo_restante": restante,
                             "compromiso_millares_ha": compromiso, "nota_plazo": nota},
                    "suelo": suelo_op,
                    "dinero": None,
                    "semaforo": {"suelo": sem_suelo, "dinero": "gris"},
                    "meses_cultivo": meses_cultivo(dias) if dias is not None else [0] * 12,
                    "filtros": filtros_de(zona, rot_ref),
                    "advertir_si_rojo": advertir,
                    "preguntas_ref": llave_expl(zona, rot_ref),
                    "gota": bloque_gota(props["area_ha"], lam["0"]["p50"], neta, params, m3_millar, flujos),
                    "gota_goteo_con_tope": con_tope, "gota_goteo_sin_tope": sin_tope, "tope_consumo": tope,
                })
        if opciones and not any(o["id"] == "ACTUAL" for o in opciones):
            # Sin la opción ACTUAL no hay comparación posible (kit B4: ACTUAL nunca se elimina):
            # la parcela queda sin opciones y se avisa; nunca se publica un cubo que rompa el contrato.
            avisos.append(f"{pid}: no se pudo armar la opción ACTUAL ({cultivo}) con los archivos de su zona; queda sin opciones")
            cubo_parcelas[pid] = {"opciones": [], "sin_opciones": SIN_ACTUAL}
        else:
            cubo_parcelas[pid] = {"opciones": opciones}

    # Bloque «zona» (todas las parcelas; compatibilidad) y bloque «zonas» (uno por zona con parcelas).
    props_all = [f["properties"] for f in features]
    zona = bloque_zona("zona piloto", props_all, cubo_parcelas)
    zonas = {}
    for z in zonas_presentes:
        meta_z = zonas_meta[z]
        zonas[z] = {**bloque_zona(z, [p for p in props_all if p["zona"] == z], cubo_parcelas),
                    "nombre_mostrar": meta_z.get("nombre") or z, "bbox": list(meta_z["bbox"]),
                    "clima_disponible": datos_zona[z] is not None}
    localidades = bloque_localidades(params, avisos)

    no_abst = [p for p in props_all if not p["abstencion"]]
    frac_abst = zona["superficie_abstenida_ha"] / zona["superficie_total_ha"] if zona["superficie_total_ha"] else 0
    n_abst = sum(1 for p in props_all if p["abstencion"])
    if n_abst * 2 > len(props_all):
        avisos.append(f"Más de la mitad de las parcelas quedan abstenidas ({n_abst} de {len(props_all)}): el kit (A4.2) pide notificarlo")
    for (z, rot_id), n in sorted(omitidas.items()):
        avisos.append(f"Zona {z}: la opción {rot_id} no está en {datos_zona[z]['archivo_rot']} ni en "
                      f"demanda_cultivos{sufijo_zona(z)}.csv; se omite en {n} parcelas (nunca se inventa su lámina)")
    if provisionales:
        avisos.append(f"{ARCHIVO_B3} no trae alternativas para: {', '.join(sorted(provisionales))}; esas parcelas "
                      f"siguen con el diseño provisional (data/opciones_b4.json, {cfg.get('etiqueta')})")
    for rot_id in sorted(secuencias_distintas):
        avisos.append(f"{ARCHIVO_B3}: la secuencia de {rot_id} no nombra los mismos cultivos con que A5 calculó "
                      "su lámina; se muestra la de B3 y la lámina sigue siendo la de A5")
    avisos = list(dict.fromkeys(avisos))  # sin repetidos, en orden de aparición

    from simulados import bloques_distrito_dotaciones  # mismo armado que los simulados, desde params
    distrito, dotaciones = bloques_distrito_dotaciones(params)
    completar_distrito_dotaciones(distrito, dotaciones, params, avisos)
    capas = ["cultivos", "suelo_desnudo"] + (["memoria_2025"] if any(
        any(m["anio"] == 2025 for m in (p["memoria"] or [])) for p in props_all) else [])
    distrito["capas_disponibles"] = capas

    # Notas del cubo: de dónde salen las opciones, el escenario de goteo y el renglón Dinero.
    if b3 is None:
        notas = [cfg["_nota"]]
        meta_opciones = {"origen": ORIGEN_PROVISIONAL, "archivo": "data/opciones_b4.json", "etiqueta": cfg.get("etiqueta")}
    else:
        notas = [f"Crop options and filters: official rotation table ({ARCHIVO_B3}). Source: {b3.get('fuente')}",
                 f"Filters are never decided with an invented threshold: «{NEEDS_LOCAL_CHECK}» means the filter needs "
                 "local data the tool does not have, or its source sets no threshold."]
        meta_opciones = {"origen": ORIGEN_B3, "archivo": f"data/processed/{ARCHIVO_B3}", "fuente": b3.get("fuente"),
                         "provisionales": sorted(provisionales)}
    if hay_goteo:
        notas += [
            "Drip scenario: the drip and surface field efficiencies are indicative values from the cited source, "
            f"not measured in this district ({goteo[EA_GOTEO]['etiqueta']}). Source: {goteo[EA_GOTEO]['fuente']}",
            "Drip scenario, how kit X3.1 was read (it does not say how to go from the gravity water depth to drip): "
            f"field delivery with drip is the larger of crop ET ÷ {EA_GOTEO} and current delivery × {EA_SUPERFICIAL} ÷ "
            f"{EA_GOTEO} (the smaller saving). With the consumption cap, ET and area stay the same. Without it, dam "
            "water stays the same, the freed water irrigates more area of the same crop and ET rises in that "
            "proportion; the aquifer return keeps the same coefficient as an upper bound. Options that take no "
            "water have no drip scenario.",
        ]
        meta_goteo = {"disponible": True, "archivo": goteo["archivo"],
                      EA_GOTEO: goteo[EA_GOTEO], EA_SUPERFICIAL: goteo[EA_SUPERFICIAL],
                      "zonas": {z: {"disponible": goteo_zona[z] is not None, EA_A5: rangos_a5[z]} for z in zonas_con_datos}}
    else:
        notas.append("Drip scenario not available: no sourced drip efficiency yet (params.eficiencia.goteo is null).")
        meta_goteo = {"disponible": False,
                      "motivo": motivo_goteo or f"{EA_SUPERFICIAL} queda fuera del rango {EA_A5} de A5 (ver notas)"}
    notas.append("Money row: no verified margin data.")

    ahora = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    # Archivos de la caché que alimentan el cubo. Los ocultos (.gitkeep) no son fuentes de datos.
    en_cache = sorted(x.name for x in processed.iterdir() if x.is_file() and not x.name.startswith("."))
    meta = {"version": "4.0", "generado": ahora, "mock": False, "mock_campos": [], "script": "motor/b4_cubo.py",
            "fuentes": [f"data/processed/{x}" for x in en_cache] + ["data/params.json", "data/opciones_b4.json"],
            "notas": notas + avisos, "opciones": meta_opciones, "goteo": meta_goteo,
            "ventana_desnudo": ventana_desnudo(params)}
    cubo = {"meta": meta, "distrito": distrito, "dotaciones": dotaciones, "lluvia_pct": params["lluvia_pct"]["valor"],
            "zona": zona, "zonas": zonas, "localidades": localidades}
    if b3 is not None:
        # Catálogo de B3, una sola vez: el detalle de cada rotación usada (ciclo, siembra, por qué, fuente)
        # y los filtros tal como llegaron. Las opciones lo encuentran por su «rotacion» y los filtros por su id.
        refs = sorted({o["rotacion"] for pc in cubo_parcelas.values() for o in pc["opciones"]})
        cubo["opciones_catalogo"] = {r: def_b3[r] for r in refs if r in def_b3}
        cubo["filtros_catalogo"] = {f["id"]: {k: v for k, v in f.items() if k != "id"} for f in b3.get("filtros") or []}
        if any(e.get("tipo") == "helada" for lista in filtros_cache.values() for e in lista) and heladas is not None:
            ventanas = {}
            for z in zonas_presentes:
                fechas = sorted((heladas_de_zona(heladas, z) or {}).get("prob_helada_despues_de") or {})
                ventanas[z] = {"desde": fechas[0], "hasta": fechas[-1]} if fechas else None
            meta["heladas"] = {"archivo": f"data/processed/{ARCHIVO_HELADAS}", "fuente": heladas.get("fuente"),
                               "nota": heladas.get("nota"),
                               "definicion": (heladas.get("definicion") or {}).get("prob_helada_despues_de"),
                               "fechas_calculadas": ventanas}
    cubo["parcelas"] = cubo_parcelas
    geo = {"type": "FeatureCollection", "meta": {"mock": False, "anio_actual": params["memoria"]["anio_actual"]["valor"],
                                                  "fuente": "Fields of The World 2025 (CC-BY-4.0) via B1; HLS via A3/A4"},
           "features": features}
    expl = {"meta": {"mock": False, "dinamicos": ["d", "ha", "cobertura"],
                     "nota": "Template texts written by the team (no LLM yet); every number comes from 'valores' or from the slider."},
            "explicaciones": {llave_expl(z, rid): explicacion(rid, clave, datos_zona[z], params, nombre_en(rid))
                              for z, rid, clave in sorted(usadas)}}
    peso = len(json.dumps(cubo, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
    if peso > FRACCION_AVISO_PESO * LIMITE_CUBO_BYTES:
        aviso = (f"cubo.json pesa {peso} bytes: está cerca del límite del contrato ({LIMITE_CUBO_BYTES} bytes, kit §2.3). "
                 "Lo que más pesa se repite en cada opción: los bloques de La gota y los filtros con su motivo y su fuente")
        avisos.append(aviso)
        meta["notas"].append(aviso)
    if escribir:
        web.mkdir(parents=True, exist_ok=True)
        for nombre, datos in (("parcelas.geojson", geo), ("cubo.json", cubo), ("explicaciones.json", expl)):
            (web / nombre).write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    return {"ejecutado": True, "parcelas": len(features), "clasificadas": len(no_abst),
            "opciones": sum(len(v["opciones"]) for v in cubo_parcelas.values()),
            "fraccion_area_abstenida": round(frac_abst, 3),
            "zonas": {z: zonas[z]["conteos"]["total"] for z in zonas},
            "zonas_sin_clima": [z for z in zonas_presentes if datos_zona[z] is None],
            "opciones_origen": meta_opciones["origen"], "goteo": hay_goteo,
            "con_goteo": sum(1 for v in cubo_parcelas.values() for o in v["opciones"] if o["gota_goteo_con_tope"]),
            "filtros": sum(len(o["filtros"]) for v in cubo_parcelas.values() for o in v["opciones"]),
            "cubo_bytes": peso, "avisos": avisos}


def explicacion(rot_id, plazo_clave, dz, params, nombre):
    """Cinco respuestas del reto con marcadores, SIN dígitos (kit C3; plantilla sin LLM).
    Las láminas salen de los datos de la zona (dz = cargar_zona); «nombre» es el de la rotación en inglés."""
    if rot_id in dz["rotaciones"]:
        lam = dz["rotaciones"][rot_id]["lamina_bruta_millares"]["0"]
    else:
        d = dz["demanda"][rot_id]["0"]
        lam = {"p10": num(d["bruta_millares_p10"]), "p50": num(d["bruta_millares_p50"]), "p90": num(d["bruta_millares_p90"])}
    plazo = plazo_params(params, plazo_clave)
    # Plazo en palabras sin dígitos: una temporada, N años o de N a M años.
    if plazo["min"] == plazo["max"] == params["plazo"]["anual"]["valor"]:
        plazo_txt = "for one season"
    elif plazo["min"] == plazo["max"]:
        plazo_txt = "for {{f2}} years"
    else:
        plazo_txt = "for {{f2}} to {{f3}} years"
    return {
        "textos": {
            "por_que": f"{nombre} asks for {{{{f1}}}} thousand m³ per hectare per year and commits water {plazo_txt}. With your allocation of {{{{d}}}} thousand m³/ha it covers {{{{cobertura}}}} of the need: enough for {{{{ha}}}} hectares.",
            "evidencia": "Water need from the FAO Penman–Monteith method with NASA POWER daily climate and a Monte Carlo band (low {{f4}}, high {{f5}} thousand m³/ha). Field history from NASA HLS greenness.",
            "beneficios": "Shows how many years this choice ties up water before you plant, next to the dam allocation you expect.",
            "que_no_sabemos": "On-farm irrigation efficiency has not been measured in this district; the band reflects that assumption. Field boundaries are estimated by a neural network outside its training region.",
            "riesgos": "Check with your module technician: the allocation, where the thousand cubic meters are measured, and local soil conditions can change the answer.",
        },
        "valores": {"f1": lam["p50"], "f2": plazo["min"], "f3": plazo["max"], "f4": lam["p10"], "f5": lam["p90"]},
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--processed", default=str(RAIZ / "data/processed"))
    ap.add_argument("--web", default=str(RAIZ / "web/data"))
    a = ap.parse_args()
    rep = construir(a.processed, a.web)
    print(json.dumps(rep, ensure_ascii=False, indent=1))
