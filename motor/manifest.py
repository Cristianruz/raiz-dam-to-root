# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Genera web/data/manifest.json (kit v4 §2.5). Nunca se escribe a mano.

Contenido:
- fuentes_de_origen[]: copia de data/processed/fuentes.json (lo escribe
  motor/ensamblar.py con archivo, URL o API, fecha de consulta y sha256).
  Si no existe, lista vacía.
- cifras{}: una entrada por cada número que muestra la web, con
  clave (ruta JSON dentro del archivo), archivo, valor, fuente, fecha,
  script, etiqueta y mock.

De dónde sale cada campo:
- distrito, dotaciones y lluvia_pct del cubo: fuente, etiqueta y fecha de
  data/params.json (el cubo los copia de ahí).
- zona, zonas.<id> (superficies, demanda y conteos por zona), opciones de cada
  parcela (lámina, plazo, compromiso, suelo, La gota y tope), parcelas.geojson
  y valores de explicaciones.json: son cálculos del motor. Si el bloque es
  simulado, la fuente dice «datos simulados» y el script es motor/simulados.py.
- zonas.<id>.bbox: rectángulo de params.zona_piloto.zonas (fuente y etiqueta de
  ahí; motor/b4_cubo.py lo copia al cubo). localidades[*].lat/lon: centroides de
  params.zona_piloto.localidades_equipo. Si el cubo no coincide con params.json,
  se avisa.
- web/data/relieve.json (A9, lo copia motor/relieve_web.py): tormenta.mm con la
  fuente, el periodo y la definición de la tormenta; umbral_ruta_ha con su
  etiqueta; los textos con cifras (rótulo de escala, periodo, definición) con la
  fuente del archivo. La fecha y el script de origen salen de la entrega
  relieve_meta[_<zona>].json en data/processed/fuentes.json.
- parcelas.geojson: cada hoja numérica de properties. Las de PROPIEDADES_PARCELA y memoria[*].anio
  son cálculo del motor (B1, A3, A3-M, A4.2); las de properties.relieve (pendiente media, área que
  escurre hacia la parcela y fracción en depresión, A9) llevan la fuente, la fecha y el script de la
  entrega relieve_parcelas.csv en data/processed/fuentes.json. Una hoja numérica sin regla propia se
  registra igual (con la fuente del archivo) y se avisa en «avisos»: nunca se salta en silencio.
- web/data/pruebas.json (motor/pruebas_web.py, paso 5c de construir.py): las cifras de «About & Data»
  (métricas de cada prueba, número de la prueba, criterios y textos con cifras), con la fuente citada en
  cada una. construir.py vuelve a generar el manifest después del paso 5c para que entren las de la
  corrida actual.
- Escenario de goteo de La gota (gota_goteo_con_tope, gota_goteo_sin_tope y tope_consumo de cada
  opción; kit X3.1): la fuente y la etiqueta de las eficiencias de data/processed/supuestos.json
  («[V] indicative, not local»), que el cubo copia en meta.goteo; fecha y script de la entrega
  supuestos.json en fuentes.json. Las eficiencias mismas (meta.goteo.*) se registran igual, y el rango
  con que A5 calculó las láminas de cada zona, con su etiqueta y su archivo.
- Filtros oficiales (B3) de cada opción: prob_helada (y la de las demás siembras) con la fuente de
  data/processed/heladas.json; cualquier otra cifra del filtro (su umbral), con la fuente y la etiqueta
  del propio filtro. cubo.opciones_catalogo y cubo.filtros_catalogo (cifras y textos con cifras: fechas
  de siembra, reglas): fuente y etiqueta de cada entrada; fecha y script de la entrega opciones_b3.json.
- cubo.meta.ventana_desnudo (inicio y fin), dotaciones.equivalencia_en y la nota en inglés de cada marca
  si lleva cifras: fuente y etiqueta de data/params.json (son copias de ahí).
- relieve.json → rutas_depresiones (profundidad mínima, celdas y retazos omitidos y la nota): fuente,
  fecha y script de la entrega relieve_meta[_<zona>].json; etiqueta del propio bloque.
- gemelo.json, contexto.json, suelo.json y ndvi_mensual.json (lo que muestran el gemelo, la ficha completa y los
  paneles «Regional context» y «Challenge data sources»): se recorren TODAS sus hojas numéricas y sus textos con
  cifras. Cada una con su regla (la entrega de data/processed de la que sale, con su fuente, fecha y script); lo que
  no tiene regla propia se registra igual con la fuente del archivo y se avisa una vez por patrón en «avisos»:
  nunca se salta. En contexto.json, las listas de meses de cada serie se registran como su periodo (primer y
  último mes) para que el manifiesto no crezca con los meses.
- mock: se decide por bloque con las marcas del propio archivo
  (cubo.meta.mock y cubo.meta.mock_campos; meta.mock de parcelas.geojson y de
  explicaciones.json). Si el cubo no trae la lista por campo, manda
  cubo.meta.mock.
- fecha: la del dato si params.json la tiene (fecha o fecha_consulta); en los
  cálculos, cubo.meta.generado o, si es null, la fecha de generación de este
  manifest. Lo que no tiene fecha queda en null y se cuenta en «avisos».
- Agrupación por patrón de ruta: parcelas.<id> -> parcelas.*, zonas.<id> ->
  zonas.*, índices [n] -> [*]. Campos extra de una entrada (periodo y definición
  de la tormenta) se conservan en su patrón.

Uso:  python motor/manifest.py      (escribe web/data/manifest.json)
"""
import datetime
import json
import re
import sys
from pathlib import Path

try:  # como módulo (construir.py, pruebas) o como script (python motor/manifest.py)
    from motor.relieve_web import ZONA_POR_OMISION
    from motor.contexto_web import tramo_de_fuente
except ImportError:  # pragma: no cover - depende de cómo se llame
    from relieve_web import ZONA_POR_OMISION
    from contexto_web import tramo_de_fuente

RAIZ = Path(__file__).resolve().parent.parent
ENCABEZADO = "AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026"
SCRIPT_SIMULADOS = "motor/simulados.py"
SCRIPT_ENSAMBLADO = "motor/ensamblar.py"
SCRIPT_RELIEVE = "motor/relieve_web.py"
SCRIPT_PRUEBAS = "motor/pruebas_web.py"
ARCHIVO_CUBO = "web/data/cubo.json"
ARCHIVO_RELIEVE = "web/data/relieve.json"
ARCHIVO_PARCELAS = "web/data/parcelas.geojson"
ARCHIVO_PRUEBAS = "web/data/pruebas.json"
ARCHIVO_GEMELO = "web/data/gemelo.json"
SCRIPT_GEMELO = "motor/gemelo_web.py"
ARCHIVO_NDVI = "web/data/ndvi_mensual.json"
SCRIPT_NDVI = "motor/ndvi_web.py"
ARCHIVO_SUELO = "web/data/suelo.json"
SCRIPT_SUELO = "motor/suelo_web.py"
ARCHIVO_CONTEXTO = "web/data/contexto.json"
SCRIPT_CONTEXTO = "motor/contexto_web.py"
# Cifra de gemelo.json -> valor de diseño de data/params.json (bloque «gemelo») del que sale (su fuente y su etiqueta).
DISENO_GEMELO = {
    "terreno.exageracion": "exageracion_vertical",
    "terreno.minzoom": "dem",
    "terreno.maxzoom": "dem",
    "columnas.metros_por_millar": "metros_por_millar",
    "camara.pitch": "camara",
    "camara.bearing": "camara",
    "tiempo.intervalo_ms": "reproduccion_intervalo_ms",
}
ENTREGA_RELIEVE_PARCELAS = "relieve_parcelas.csv"  # A9: indicadores de relieve por parcela
ETIQUETA_DEFINICION = "Definición"
ETIQUETA_REGLA_VALIDADOR = "Regla del validador del buzón (motor/esquemas.py)"
ETIQUETA_CATALOGO = "Catálogo de recursos del reto (data/recursos_reto.json)"
ETIQUETA_SIN_REGLA = "Sin regla propia en motor/manifest.py"
ARCHIVO_CATALOGO_RETO = "data/recursos_reto.json"
FUENTE_UMBRAL_FALTANTES = ("motor/esquemas.py, FALTANTES_MAX_FRACCION: un año con esa fracción de días faltantes "
                           "o más no se suma (acuerdo del validador de eto_diaria.csv)")
# clima_anual de contexto.json: de qué entrega sale cada campo de un año (power = eto_diaria, imerg = imerg_diaria).
CLIMA_POR_CAMPO = {"lluvia_imerg_mm": "imerg", "dias_con_dato_imerg": "imerg", "lluvia_power_mm": "power",
                   "eto_mm": "power", "dias_helada": "power", "dias_con_dato": "power"}
# Campos del calendario del año agrícola (la definición del año, no una entrega).
CLIMA_CALENDARIO = ("anio", "dias_del_anio")
ENTREGA_SUPUESTOS = "supuestos.json"      # eficiencias del escenario de goteo (kit X3.1)
ENTREGA_HELADAS = "heladas.json"          # A2: probabilidad de helada por fecha (filtro de helada)
ENTREGA_B3 = "opciones_b3.json"           # B3: opciones y filtros oficiales
FUENTE_SIMULADA = "Datos simulados (data/simulados.json y data/params.json); no son datos reales"
ETIQUETA_SIMULADA = "SIMULADO"
ETIQUETA_CALCULO = "Cálculo"
ETIQUETA_CRITERIO = "Criterio declarado antes del resultado (S9 §6)"
ETIQUETA_DOCUMENTO = "Leído del documento de resultado citado"
ETIQUETA_CORRIDA = "Registro de la corrida de python construir.py"
# Rótulo de escala del relieve sin etiqueta propia en relieve.json: resolución nominal del producto.
ETIQUETA_ROTULO_RELIEVE = "Resolución nominal de NASADEM (NASA, 30 m; S9 §4 bis)"

# Bloques numéricos de cada opción que la ficha muestra (kit C2 y X3.2).
BLOQUES_OPCION = ("agua.lamina_bruta", "agua.plazo_anios", "agua.plazo_restante",
                  "agua.compromiso_millares_ha", "suelo.dias_desnudo", "gota",
                  "gota_goteo_con_tope", "gota_goteo_sin_tope", "tope_consumo")
# Bloques del escenario de goteo: llevan la fuente y la etiqueta de las eficiencias de supuestos.json.
BLOQUES_GOTEO = ("gota_goteo_con_tope", "gota_goteo_sin_tope", "tope_consumo")
# Propiedades numéricas de cada parcela que muestran el mapa y la ficha (kit C1 y C2): cálculo del motor.
PROPIEDADES_PARCELA = ("area_ha", "ftw_confianza", "prob_max", "dias_suelo_desnudo_feb_abr",
                       "ndvi_ultimo_mes", "dias_suelo_desnudo_mediana", "edad_perenne_anios",
                       "memoria[*].anio")
# properties.relieve (A9; la ficha las muestra en el renglón Soil): fuente de la entrega relieve_parcelas.csv.
PROPIEDADES_RELIEVE = ("relieve.pendiente_media_pct", "relieve.aportacion_externa_ha", "relieve.frac_depresion")


def leer_json(ruta):
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def es_numero(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def hojas_numericas(obj, ruta):
    """Recorre obj y devuelve [(ruta, número)]. Objetos con '.', listas con [i]."""
    if es_numero(obj):
        return [(ruta, obj)]
    salida = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            salida += hojas_numericas(v, f"{ruta}.{k}" if ruta else str(k))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            salida += hojas_numericas(v, f"{ruta}[{i}]")
    return salida


def obtener(obj, ruta_puntos):
    """obj['a']['b'] a partir de 'a.b'; None si falta algún tramo."""
    for parte in ruta_puntos.split("."):
        if not isinstance(obj, dict) or parte not in obj:
            return None
        obj = obj[parte]
    return obj


class Manifest:
    """Acumula las entradas de cifras y los avisos."""

    def __init__(self, hoy):
        self.hoy = hoy
        self.cifras = {}
        self.avisos = []

    def agregar(self, archivo, clave, valor, fuente, fecha, script, etiqueta, mock, **extra):
        """Una cifra. «extra»: campos opcionales que acompañan a la fuente (p. ej. periodo)."""
        llave = f"{Path(archivo).name}:{clave}"
        if llave in self.cifras:
            self.avisos.append(f"clave repetida: {llave}")
        if not fuente:
            self.avisos.append(f"sin fuente: {llave}")
        if not fecha:
            self.avisos.append(f"sin fecha: {llave}")
        if not script:
            self.avisos.append(f"sin script: {llave}")
        self.cifras[llave] = {"clave": clave, "archivo": archivo, "valor": valor, "fuente": fuente,
                              "fecha": fecha, "script": script, "etiqueta": etiqueta, "mock": bool(mock),
                              **{k: v for k, v in extra.items() if v is not None}}


def es_simulado(meta, bloque):
    """mock del bloque según las marcas del archivo (general y por campo)."""
    meta = meta or {}
    general = bool(meta.get("mock"))
    campos = meta.get("mock_campos")
    if not general:
        return False
    if isinstance(campos, list):
        return bloque in campos
    return True


def origen_calculo(meta, bloque, mock, hoy):
    """(fuente, fecha, script, etiqueta) de un número calculado por el motor."""
    meta = meta or {}
    fecha = meta.get("generado") or hoy
    if mock:
        return FUENTE_SIMULADA, fecha, SCRIPT_SIMULADOS, ETIQUETA_SIMULADA
    # Los archivos ocultos de la caché (p. ej. data/processed/.gitkeep) no son fuentes de datos.
    fuentes = [f for f in (meta.get("fuentes") or []) if not Path(str(f)).name.startswith(".")]
    scripts = meta.get("scripts") or {}
    script = scripts.get(bloque) or meta.get("script") or SCRIPT_ENSAMBLADO
    return ("; ".join(map(str, fuentes)) or None), fecha, script, ETIQUETA_CALCULO


def cifras_de_params(m, cubo, params, script_cubo, mock_de):
    """distrito, dotaciones y lluvia_pct: valor del cubo; fuente y etiqueta de params.json."""
    archivo = "web/data/cubo.json"

    def con_param(clave, valor, p, bloque):
        if p is None:
            m.avisos.append(f"params.json no tiene la entrada de {clave}")
            p = {}
        fecha = p.get("fecha") or p.get("fecha_consulta")
        m.agregar(archivo, clave, valor, p.get("fuente"), fecha, script_cubo, p.get("etiqueta"), mock_de(bloque))

    def comparar(clave, valor_cubo, valor_params):
        if valor_params is not None and valor_cubo != valor_params:
            m.avisos.append(f"{clave}: el cubo dice {valor_cubo} y params.json {valor_params}")

    distrito = cubo.get("distrito") or {}
    pares = (("distrito.boquilla.namo_hm3", "distrito.namo_hm3"),
             ("distrito.boquilla.almacenamiento_hm3", "distrito.almacenamiento_hm3"),
             ("distrito.acuifero_0831.disponibilidad_hm3_anio", "acuifero.disponibilidad_hm3_anio"))
    for clave_cubo, clave_params in pares:
        valor = obtener({"distrito": distrito}, clave_cubo)
        if not es_numero(valor):
            continue  # null: la web dice «no data»; no hay cifra que rastrear
        p = obtener(params, clave_params)
        comparar(clave_cubo, valor, (p or {}).get("valor"))
        con_param(clave_cubo, valor, p, "distrito")

    dot = cubo.get("dotaciones") or {}
    p_des = obtener(params, "dotaciones.deslizador")
    for k, v in (dot.get("deslizador") or {}).items():
        if es_numero(v):
            comparar(f"dotaciones.deslizador.{k}", v, ((p_des or {}).get("valor") or {}).get(k))
            con_param(f"dotaciones.deslizador.{k}", v, p_des, "dotaciones")
    for i, marca in enumerate(dot.get("marcas") or []):
        p_marca = obtener(params, f"dotaciones.{marca.get('id')}")
        for k in ("min", "max", "valor"):
            if es_numero(marca.get(k)):
                comparar(f"dotaciones.marcas[{i}].{k}", marca[k], ((p_marca or {}).get("valor") or {}).get(k))
                con_param(f"dotaciones.marcas[{i}].{k}", marca[k], p_marca, "dotaciones")
        if tiene_digito(marca.get("nota_en")):
            # Nota en inglés con cifras (copia de params.dotaciones.<marca>.nota_en).
            if marca["nota_en"] != (p_marca or {}).get("nota_en"):
                m.avisos.append(f"dotaciones.marcas[{i}].nota_en: el cubo no coincide con params.json")
            con_param(f"dotaciones.marcas[{i}].nota_en", marca["nota_en"], p_marca, "dotaciones")
    cm = dot.get("lamina_cm_por_millar") or {}
    if es_numero(cm.get("valor")):
        p_mil = obtener(params, "unidades.millar")
        comparar("dotaciones.lamina_cm_por_millar.valor", cm["valor"], ((p_mil or {}).get("valor") or {}).get("lamina_cm"))
        con_param("dotaciones.lamina_cm_por_millar.valor", cm["valor"], p_mil, "dotaciones")
    for campo in ("equivalencia", "equivalencia_en"):
        if dot.get(campo):
            # Texto con cifras (1 millar/ha = 1,000 m³/ha = 10 cm): se rastrea a params.unidades.millar.
            con_param(f"dotaciones.{campo}", dot[campo], obtener(params, "unidades.millar"), "dotaciones")

    p_lluvia = obtener(params, "lluvia_pct")
    for i, v in enumerate(cubo.get("lluvia_pct") or []):
        if es_numero(v):
            con_param(f"lluvia_pct[{i}]", v, p_lluvia, "lluvia_pct")


def cifras_de_zonas(m, cubo, params, script_cubo, mock_de, hoy):
    """zonas.<id>.*: superficies, demanda y conteos de cada zona (cálculo de B4, motor/b4_cubo.py)
    y zonas.<id>.bbox (rectángulo de params.zona_piloto.zonas, que B4 copia al cubo)."""
    archivo = "web/data/cubo.json"
    zonas = cubo.get("zonas") or {}
    if not zonas:
        return  # cubo de una sola zona o simulado: no hay bloque «zonas»
    meta = cubo.get("meta") or {}
    p_zonas = obtener(params, "zona_piloto.zonas")
    if p_zonas is None:
        m.avisos.append("params.json no tiene la entrada de zona_piloto.zonas")
        p_zonas = {}
    fecha_p = p_zonas.get("fecha") or p_zonas.get("fecha_consulta")
    bbox_params = {z.get("id"): z.get("bbox") for z in (p_zonas.get("valor") or []) if isinstance(z, dict)}
    mock_z = mock_de("zonas") or mock_de("zona")
    fuente, fecha, script, etiqueta = origen_calculo(meta, "zonas", mock_z, hoy)
    for zid, bloque in zonas.items():
        calculo = {k: v for k, v in (bloque or {}).items() if k != "bbox"}
        for ruta, valor in hojas_numericas(calculo, f"zonas.{zid}"):
            m.agregar(archivo, ruta, valor, fuente, fecha, script, etiqueta, mock_z)
        bbox = (bloque or {}).get("bbox")
        if bbox is None:
            continue
        if zid not in bbox_params:
            m.avisos.append(f"zonas.{zid}: la zona no está en params.zona_piloto.zonas")
        elif bbox != bbox_params[zid]:
            m.avisos.append(f"zonas.{zid}.bbox: el cubo dice {bbox} y params.json {bbox_params[zid]}")
        for ruta, valor in hojas_numericas(bbox, f"zonas.{zid}.bbox"):
            m.agregar(archivo, ruta, valor, p_zonas.get("fuente"), fecha_p, script_cubo,
                      p_zonas.get("etiqueta"), mock_z)


def cifras_de_localidades(m, cubo, params, script_cubo, mock_de):
    """localidades[*].lat/lon: centroides de params.zona_piloto.localidades_equipo (B4 los copia)."""
    archivo = "web/data/cubo.json"
    locs = cubo.get("localidades") or []
    if not locs:
        return
    p = obtener(params, "zona_piloto.localidades_equipo")
    if p is None:
        m.avisos.append("params.json no tiene la entrada de zona_piloto.localidades_equipo")
        p = {}
    fecha = p.get("fecha") or p.get("fecha_consulta")
    por_nombre = {x.get("nombre"): x for x in (p.get("valor") or []) if isinstance(x, dict)}
    mock_l = mock_de("localidades")
    for i, loc in enumerate(locs):
        ref = por_nombre.get((loc or {}).get("nombre"))
        if p and ref is None:
            m.avisos.append(f"localidades[{i}] ({(loc or {}).get('nombre')}): no está en "
                            "params.zona_piloto.localidades_equipo")
        for k in ("lat", "lon"):
            v = (loc or {}).get(k)
            if not es_numero(v):
                continue
            if ref is not None and es_numero(ref.get(k)) and ref[k] != v:
                m.avisos.append(f"localidades[{i}].{k}: el cubo dice {v} y params.json {ref[k]}")
            m.agregar(archivo, f"localidades[{i}].{k}", v, p.get("fuente"), fecha, script_cubo,
                      p.get("etiqueta"), mock_l)


def fecha_y_script(entrega, script_cubo):
    """(fecha, script) de una cifra que el motor copia o calcula desde una entrega de fuentes.json."""
    entrega = entrega or {}
    fecha = entrega.get("fecha_consulta") or entrega.get("fecha")
    return fecha, "; ".join(x for x in (entrega.get("script"), script_cubo) if x) or None


def origen_goteo(meta, fuentes_origen, script_cubo):
    """(fuente, fecha, script, etiqueta) de los bloques de goteo: los de las eficiencias de
    data/processed/supuestos.json que el cubo copia en meta.goteo. None si el cubo no trae el escenario."""
    g = (meta or {}).get("goteo") or {}
    ea = g.get("ea_goteo") or {}
    if not g.get("disponible") or not ea.get("fuente"):
        return None
    fecha, script = fecha_y_script(entrega_de(fuentes_origen, ENTREGA_SUPUESTOS), script_cubo)
    return ea["fuente"], fecha or meta.get("generado"), script, ea.get("etiqueta")


def cifras_de_meta(m, cubo, params, fuentes_origen, script_cubo, mock_de):
    """cubo.meta: las eficiencias del escenario de goteo (meta.goteo, copia de supuestos.json y del rango
    de A5 de cada zona) y la ventana de suelo desnudo (meta.ventana_desnudo, copia de params)."""
    meta = cubo.get("meta") or {}
    mock = mock_de("meta")
    g = meta.get("goteo") or {}
    if g.get("disponible"):
        fecha, script = fecha_y_script(entrega_de(fuentes_origen, ENTREGA_SUPUESTOS), script_cubo)
        for clave in ("ea_goteo", "ea_superficial_referencia"):
            d = g.get(clave) or {}
            if es_numero(d.get("valor")):
                m.agregar(ARCHIVO_CUBO, f"meta.goteo.{clave}.valor", d["valor"], d.get("fuente"),
                          fecha or meta.get("generado"), script, d.get("etiqueta"), mock)
        for zid, z in (g.get("zonas") or {}).items():
            r = (z or {}).get("ea_gravedad") or {}
            archivo = Path(str(r.get("archivo") or "")).name
            fecha_r, script_r = fecha_y_script(entrega_de(fuentes_origen, archivo), script_cubo)
            for ruta, valor in hojas_numericas(r.get("valor"), f"meta.goteo.zonas.{zid}.ea_gravedad.valor"):
                m.agregar(ARCHIVO_CUBO, ruta, valor, r.get("fuente"), fecha_r or meta.get("generado"), script_r,
                          r.get("etiqueta"), mock)
    v = meta.get("ventana_desnudo") or {}
    p = obtener(params, "suelo.ventana_desnudo") or {}
    for k in ("inicio", "fin"):
        if tiene_digito(v.get(k)):
            if v[k] != (p.get("valor") or {}).get(k):
                m.avisos.append(f"meta.ventana_desnudo.{k}: el cubo dice {v[k]} y params.json {(p.get('valor') or {}).get(k)}")
            m.agregar(ARCHIVO_CUBO, f"meta.ventana_desnudo.{k}", v[k], p.get("fuente"),
                      p.get("fecha") or p.get("fecha_consulta"), script_cubo, p.get("etiqueta"), mock)


def cifras_de_filtros(m, base, op, meta, fuentes_origen, script_cubo, mock):
    """Filtros oficiales de una opción (B3): prob_helada con la fuente de heladas.json (A2); cualquier
    otra cifra del filtro (su umbral), con la fuente y la etiqueta del propio filtro."""
    filtros = op.get("filtros") or []
    if not filtros:
        return
    h = meta.get("heladas") or {}
    entrega_h = entrega_de(fuentes_origen, ENTREGA_HELADAS) or {}
    fecha_h, script_h = fecha_y_script(entrega_h, script_cubo)
    fecha_b, script_b = fecha_y_script(entrega_de(fuentes_origen, ENTREGA_B3), script_cubo)
    for j, fl in enumerate(filtros):
        if not isinstance(fl, dict):
            continue
        for ruta, valor in hojas_numericas(fl, f"{base}.filtros[{j}]"):
            if ruta.rsplit(".", 1)[-1] == "prob_helada":
                m.agregar(ARCHIVO_CUBO, ruta, valor, h.get("fuente") or entrega_h.get("fuente"),
                          fecha_h or meta.get("generado"), script_h, ETIQUETA_CALCULO, mock)
            else:
                m.agregar(ARCHIVO_CUBO, ruta, valor, fl.get("fuente"), fecha_b or meta.get("generado"), script_b,
                          fl.get("etiqueta"), mock)


def cifras_de_lamina_local(m, base, op, fuentes_origen, script_cubo, mock, fecha_cubo):
    """agua.lamina_local de una opción (supuestos.json → lamina_local_cm, convertida a millares/ha con la
    constante de params): cada cifra con la fuente y la etiqueta de su entrada; el periodo, de la misma fuente."""
    ll = (op.get("agua") or {}).get("lamina_local")
    if not isinstance(ll, dict):
        return
    fecha, script = fecha_y_script(entrega_de(fuentes_origen, ENTREGA_SUPUESTOS), script_cubo)
    for ruta, valor in hojas_numericas(ll, f"{base}.agua.lamina_local"):
        m.agregar(ARCHIVO_CUBO, ruta, valor, ll.get("fuente"), fecha or fecha_cubo, script, ll.get("etiqueta"), mock)


def cifras_de_ndvi(m, ndvi, fuentes_origen):
    """web/data/ndvi_mensual.json (motor/ndvi_web.py): los valores mensuales (entrega hls_mensual_parcelas.csv) y
    los dos umbrales de referencia de la gráfica, cada uno con la fuente y la etiqueta de su archivo."""
    e = entrega_de(fuentes_origen, "hls_mensual_parcelas.csv") or {}
    fecha, script = fecha_y_script(e, SCRIPT_NDVI)
    for pid, serie in (ndvi.get("parcelas") or {}).items():
        for i, v in enumerate(serie or []):
            if es_numero(v):
                m.agregar(ARCHIVO_NDVI, f"parcelas.{pid}[{i}]", v, ndvi.get("fuente") or e.get("fuente"), fecha, script,
                          ETIQUETA_CALCULO, False)
    for clave, u in (ndvi.get("umbrales") or {}).items():
        if isinstance(u, dict) and es_numero(u.get("valor")):
            archivo = Path(str(u.get("archivo") or "")).name
            f_u, s_u = fecha_y_script(entrega_de(fuentes_origen, archivo), SCRIPT_NDVI)
            m.agregar(ARCHIVO_NDVI, f"umbrales.{clave}.valor", u["valor"], u.get("fuente"), f_u or fecha, s_u,
                      u.get("etiqueta"), False)
    # Los meses del eje (textos con cifras): de la misma entrega.
    for i, mes in enumerate(ndvi.get("meses") or []):
        if tiene_digito(mes):
            m.agregar(ARCHIVO_NDVI, f"meses[{i}]", mes, ndvi.get("fuente") or e.get("fuente"), fecha, script,
                      ETIQUETA_CALCULO, False)
    barrer(m, ARCHIVO_NDVI, ndvi, lambda r: r, (ndvi.get("fuente") or e.get("fuente"), fecha, script, ETIQUETA_SIN_REGLA))


def cifras_de_suelo(m, suelo, fuentes_origen):
    """web/data/suelo.json (motor/suelo_web.py): el perfil de cada parcela (entrega suelo_parcelas.csv), los
    requisitos de cada cultivo (suelo_requisitos.json, con la fuente de cada bloque), lo que el motor calcula
    (resumen y alcalinidad por zona, valores copiados en la aptitud) y los dos supuestos de supuestos.json."""
    def de(archivo, fuente=None, etiqueta=ETIQUETA_CALCULO):
        e = entrega_de(fuentes_origen, archivo) or {}
        fecha, script = fecha_y_script(e, SCRIPT_SUELO)
        return fuente or e.get("fuente"), fecha, script, etiqueta

    perfil = suelo.get("perfil") or {}
    origen_perfil = de("suelo_parcelas.csv", perfil.get("fuente"))
    for pid, p in (perfil.get("parcelas") or {}).items():
        for ruta, v in hojas_numericas(p, f"perfil.parcelas.{pid}"):
            m.agregar(ARCHIVO_SUELO, ruta, v, *origen_perfil, False)
    for ruta, v in hojas_numericas(perfil.get("resumen_zona") or {}, "perfil.resumen_zona"):
        m.agregar(ARCHIVO_SUELO, re.sub(r"resumen_zona\.([^.]+)", r"resumen_zona.zonas.\1", ruta), v, *origen_perfil, False)
    req = suelo.get("requisitos") or {}
    for cultivo, r in (req.get("cultivos") or {}).items():
        for bloque, d in (r or {}).items():
            fuente = d.get("fuente") if isinstance(d, dict) else None
            for ruta, v in hojas_numericas(d, f"requisitos.cultivos.{cultivo}.{bloque}"):
                m.agregar(ARCHIVO_SUELO, ruta, v, *de("suelo_requisitos.json", fuente or req.get("fuente"),
                                                     (d or {}).get("etiqueta") if isinstance(d, dict) else None), False)
    for ruta, v in hojas_numericas(suelo.get("alcalinidad_zona") or {}, "alcalinidad_zona"):
        m.agregar(ARCHIVO_SUELO, re.sub(r"^alcalinidad_zona\.([^.]+)", r"alcalinidad_zona.zonas.\1", ruta), v,
                  *de("suelo_parcelas.csv", "Cálculo de motor/suelo_web.py con suelo_parcelas.csv y suelo_requisitos.json"),
                  False)
    for clave in ("margen_ph", "coincidencia_textura"):
        d = suelo.get(clave)
        if isinstance(d, dict) and es_numero(d.get("valor")):
            m.agregar(ARCHIVO_SUELO, f"{clave}.valor", d["valor"], *de("supuestos.json", d.get("fuente"), d.get("etiqueta")),
                      False)
    # La aptitud copia el valor de la parcela y el rango publicado en cada motivo (una cifra por opción).
    for pid, ops in (suelo.get("aptitud") or {}).items():
        for oid, a in (ops or {}).items():
            for ruta, v in hojas_numericas(a, f"aptitud.parcelas.{pid}.{oid}"):
                m.agregar(ARCHIVO_SUELO, ruta, v, *de("suelo_requisitos.json", None), False)
    # Textos con cifras que la ficha escribe: avisos de nutrientes y notas de los requisitos (suelo_requisitos.json),
    # la capa del perfil (suelo_parcelas.csv) y las fechas de las dos entregas.
    for ruta, texto in textos_con_digitos(suelo, ""):
        ruta = ruta.lstrip(".")
        if ruta.startswith("_") or ruta in ("generado", "decision"):
            continue  # encabezado, fecha de generación y ruta del documento de la decisión: no son cifras de la página
        clave = renombrar_suelo(ruta)
        if ruta.startswith(("aptitud.", "requisitos.")):
            origen = de("suelo_requisitos.json", req.get("fuente"))
        elif ruta.startswith("perfil."):
            origen = origen_perfil
        else:
            continue  # lo deja al barrido (se registra y se avisa)
        m.agregar(ARCHIVO_SUELO, clave, texto, *origen, False)
    barrer(m, ARCHIVO_SUELO, suelo, renombrar_suelo, (suelo.get("rotulo") or ARCHIVO_SUELO, None, SCRIPT_SUELO,
                                                     ETIQUETA_SIN_REGLA))


def renombrar_suelo(ruta):
    """Ruta del manifest para una ruta de suelo.json (ids de parcela y de zona en su lugar del patrón)."""
    ruta = re.sub(r"^aptitud\.([^.\[]+)", r"aptitud.parcelas.\1", ruta)
    ruta = re.sub(r"^perfil\.resumen_zona\.([^.\[]+)", r"perfil.resumen_zona.zonas.\1", ruta)
    return re.sub(r"^alcalinidad_zona\.([^.\[]+)", r"alcalinidad_zona.zonas.\1", ruta)


def barrer(m, archivo, datos, renombrar, origen, textos=True):
    """Red de seguridad (regla 11): toda hoja numérica (y todo texto con cifras) de `datos` que aún no tenga entrada
    en el manifest se registra con `origen` (fuente, fecha, script, etiqueta) y se avisa UNA vez por patrón. Nunca se
    salta una cifra. Se omiten las llaves «_…» (encabezado y nota del archivo, regla 4), «generado» y «decision»."""
    nombre = Path(archivo).name
    vistas = {c["clave"] for c in m.cifras.values() if c["archivo"] == archivo}
    pendientes = list(hojas_numericas(datos, ""))
    if textos:
        pendientes += [(r.lstrip("."), x) for r, x in textos_con_digitos(datos, "")]
    avisados = set()
    for ruta, valor in pendientes:
        if ruta.startswith("_") or ruta.split(".")[0] in ("generado", "decision"):
            continue
        clave = renombrar(ruta)
        if clave in vistas:
            continue
        patron = patron_de(clave)
        if patron not in avisados:
            avisados.add(patron)
            m.avisos.append(f"{nombre}:{patron}: cifra sin regla propia en motor/manifest.py (registrada con la fuente "
                            "del archivo)")
        m.agregar(archivo, clave, valor, *origen, False)
        vistas.add(clave)


def renombrar_contexto(ruta):
    """Ruta del manifest para una ruta de contexto.json: la zona del clima y de las series va como «zonas.<id>» (así
    el patrón no crece con las zonas)."""
    ruta = re.sub(r"^clima_anual\.([^.\[]+)", r"clima_anual.zonas.\1", ruta)
    return re.sub(r"^contexto_regional\.([^.\[]+)", r"contexto_regional.zonas.\1", ruta)


def _serie_de(contexto, ruta):
    """(serie, ruta de la serie) de contexto_regional para una ruta «contexto_regional.<zona>.<fuente>.<variable>…»."""
    regional = contexto.get("contexto_regional") or {}
    for zona, series in regional.items():
        for clave, serie in (series or {}).items():
            base = f"contexto_regional.{zona}.{clave}"
            if ruta == base or ruta.startswith(base + ".") or ruta.startswith(base + "["):
                return serie, base
    return None, None


def cifras_de_contexto(m, contexto, fuentes_origen):
    """web/data/contexto.json (motor/contexto_web.py): TODAS sus cifras y sus textos con cifras, cada uno con su regla.
    - gedi.*: entrega gedi_parcelas.csv; gedi.criterios.*: supuestos.json, con la fuente y la etiqueta del criterio.
    - heladas.*: entrega heladas.json.
    - clima_anual.<zona>: lluvia de IMERG (imerg_diaria) y de POWER, ETo, días con helada y días con dato (eto_diaria),
      cada uno con la fuente de su entrega (bloque «fuentes»); año y días del año: la definición del año agrícola;
      umbral_faltantes: la regla del validador.
    - contexto_regional.<zona>.<serie>: la entrega contexto_regional.csv (fuente y fecha de la serie); el resumen
      anual es cálculo del motor con esa entrega; «malla_mascon», la frase de la línea de LEEME (texto_fuente). Los
      meses de una serie se registran como su periodo.
    - et_contraste, ecostress y gaez: su entrega.
    - recursos, tarjetas, unidades y zonas: el catálogo data/recursos_reto.json (nombres de productos con dígitos) y,
      para las fechas de cada recurso, la entrega citada.
    Lo que no tenga regla propia se registra con la fuente del archivo y se avisa (barrer)."""
    def de(archivo, fuente=None, etiqueta=ETIQUETA_CALCULO):
        e = entrega_de(fuentes_origen, archivo) or {}
        fecha, script = fecha_y_script(e, SCRIPT_CONTEXTO)
        return fuente or e.get("fuente"), fecha, script, etiqueta

    g = contexto.get("gedi") or {}
    h = contexto.get("heladas") or {}
    k = contexto.get("et_contraste") or {}
    catalogo = (ARCHIVO_CATALOGO_RETO, contexto.get("generado"), SCRIPT_CONTEXTO, ETIQUETA_CATALOGO)

    def origen(ruta):
        partes = ruta.split(".")
        cabeza = re.sub(r"\[.*$", "", partes[0])   # «recursos[3]» -> «recursos»
        if cabeza == "gedi":
            if ruta.startswith("gedi.criterios."):
                nombre = partes[2] if len(partes) > 2 else None
                d = (g.get("criterios") or {}).get(nombre)
                if isinstance(d, dict):
                    return de("supuestos.json", d.get("fuente"), d.get("etiqueta"))
                return de("supuestos.json", None, ETIQUETA_CALCULO)
            return de(g.get("archivo") or "gedi_parcelas.csv", g.get("fuente"))
        if cabeza == "heladas":
            return de("heladas.json", h.get("fuente"))
        if cabeza == "clima_anual" and len(partes) >= 3:
            zona = re.sub(r"\[.*$", "", partes[1])
            bloque = (contexto.get("clima_anual") or {}).get(zona) or {}
            campo = re.sub(r"\[.*$", "", partes[-1])
            if campo == "umbral_faltantes":
                return FUENTE_UMBRAL_FALTANTES, None, SCRIPT_CONTEXTO, ETIQUETA_REGLA_VALIDADOR
            if campo in CLIMA_CALENDARIO:
                return bloque.get("definicion_anio"), contexto.get("generado"), SCRIPT_CONTEXTO, ETIQUETA_DEFINICION
            if campo in ("definicion_anio", "definicion_helada"):
                return "motor/contexto_web.py (definiciones del kit v4 citadas en el texto)", contexto.get("generado"), \
                    SCRIPT_CONTEXTO, ETIQUETA_DEFINICION
            llave = CLIMA_POR_CAMPO.get(campo)
            if llave is None and len(partes) >= 4 and partes[2] == "fuentes":
                llave = partes[3]   # fuentes.<power|imerg>.fecha: la fecha de esa entrega
            f = (bloque.get("fuentes") or {}).get(llave) or {}
            if llave and f:
                return de(f.get("archivo"), f.get("fuente"), ETIQUETA_CALCULO)
            return None
        if cabeza == "contexto_regional":
            serie, base = _serie_de(contexto, ruta)
            if serie is None:
                return None
            # La línea de LEEME enumera los seis productos: cada serie cita el tramo de SU producto («grace = …»).
            tramo = tramo_de_fuente(serie.get("fuente"), serie.get("fuente_id") or "")
            fuente = f"{serie.get('archivo') or 'contexto_regional.csv'}, {serie.get('fuente_id')} = {tramo.strip(' ;')}" \
                if tramo else serie.get("fuente")
            if ruta.startswith(base + ".malla_mascon"):
                # La malla y el mascon salen de la frase de la línea de LEEME («malla de … sobre mascons de …»).
                return de(serie.get("archivo") or "contexto_regional.csv", fuente,
                          "Línea de LEEME de la entrega (sesión de datos)")
            etiqueta = ETIQUETA_CALCULO if ruta.startswith(base + ".anual") else "Entrega validada (contexto_regional.csv)"
            return de(serie.get("archivo") or "contexto_regional.csv", fuente, etiqueta)
        if cabeza == "et_contraste":
            return de(k.get("archivo") or "et_contraste.csv", k.get("fuente"), "Entrega validada (et_contraste.csv)")
        if cabeza in ("ecostress", "gaez"):
            b = contexto.get(cabeza) or {}
            return de(b.get("archivo") or f"{cabeza}.csv", b.get("fuente"))
        if cabeza == "recursos":
            if partes[-1].startswith("fecha"):
                i = re.match(r"recursos\[(\d+)\]", ruta)
                rec = (contexto.get("recursos") or [])[int(i.group(1))] if i else {}
                j = re.search(r"\.fuentes\[(\d+)\]", ruta)
                fue = (rec.get("fuentes") or [])[int(j.group(1))] if j else ((rec.get("fuentes") or [{}]) or [{}])[-1]
                return de(fue.get("archivo"), fue.get("fuente"), ETIQUETA_CALCULO)
            return catalogo
        if cabeza in ("tarjetas", "unidades", "zonas", "motivo_pedido", "idioma_fuentes") or cabeza.endswith("_motivo"):
            return catalogo
        return None

    for ruta, valor in hojas_numericas(contexto, ""):
        o = origen(ruta)
        if o is not None:
            m.agregar(ARCHIVO_CONTEXTO, renombrar_contexto(ruta), valor, *o, False)
    # Textos con cifras. Los meses de cada serie (listas «…meses[i]») se registran como su periodo, una entrada por lista.
    periodos = {}
    for ruta, texto in textos_con_digitos(contexto, ""):
        ruta = ruta.lstrip(".")
        if ruta.startswith("_") or ruta in ("generado", "decision"):
            continue
        lista = re.match(r"^(.*\.meses)\[\d+\]$", ruta)
        if lista:
            periodos.setdefault(lista.group(1), []).append(texto)
            continue
        o = origen(ruta)
        if o is not None:
            m.agregar(ARCHIVO_CONTEXTO, renombrar_contexto(ruta), texto, *o, False)
    for base, meses in periodos.items():
        o = origen(base) or (contexto.get("decision"), contexto.get("generado"), SCRIPT_CONTEXTO, ETIQUETA_SIN_REGLA)
        m.agregar(ARCHIVO_CONTEXTO, renombrar_contexto(base) + ".periodo", f"{meses[0]} … {meses[-1]}", *o, False,
                  meses=len(meses))
    # Red de seguridad: lo que no tuvo regla (meses ya registrados como periodo) se registra con la fuente del archivo.
    sin_meses = lambda r: renombrar_contexto(r)   # noqa: E731
    barrer(m, ARCHIVO_CONTEXTO, quitar_meses(contexto), sin_meses,
           (contexto.get("decision") or ARCHIVO_CONTEXTO, contexto.get("generado"), SCRIPT_CONTEXTO, ETIQUETA_SIN_REGLA))


def quitar_meses(obj):
    """Copia sin las listas «meses» (para el barrido de contexto.json: los meses ya se registraron como periodo)."""
    if isinstance(obj, dict):
        return {k: quitar_meses(v) for k, v in obj.items() if k != "meses"}
    if isinstance(obj, list):
        return [quitar_meses(v) for v in obj]
    return obj


def cifras_de_catalogos(m, cubo, fuentes_origen, script_cubo, mock_de):
    """cubo.opciones_catalogo y cubo.filtros_catalogo (copia de opciones_b3.json): cifras y textos con
    cifras (fechas de siembra, parámetros de las reglas, frases), con la fuente y la etiqueta de cada
    entrada; fecha y script de la entrega opciones_b3.json."""
    meta = cubo.get("meta") or {}
    fuente_archivo = (meta.get("opciones") or {}).get("fuente")
    fecha, script = fecha_y_script(entrega_de(fuentes_origen, ENTREGA_B3), script_cubo)
    mock = mock_de("parcelas")
    for bloque in ("opciones_catalogo", "filtros_catalogo"):
        for clave, d in (cubo.get(bloque) or {}).items():
            if not isinstance(d, dict):
                continue
            base = f"{bloque}.{clave}"
            for ruta, valor in hojas_numericas(d, base) + textos_con_digitos(d, base):
                m.agregar(ARCHIVO_CUBO, ruta, valor, d.get("fuente") or fuente_archivo,
                          fecha or meta.get("generado"), script, d.get("etiqueta"), mock)


def entrega_de_relieve(fuentes_origen, zona):
    """Fila de data/processed/fuentes.json de la entrega relieve_meta[_<zona>].json; None si no está.
    La zona es la que registró el ensamblador o, si no la trae, la del sufijo del archivo."""
    encontrada = None
    for fo in fuentes_origen or []:
        if not isinstance(fo, dict) or fo.get("tipo", "entrega") != "entrega":
            continue
        archivo = str(fo.get("archivo") or "")
        if not (archivo.startswith("relieve_meta") and archivo.endswith(".json")):
            continue
        z = fo.get("zona") or archivo[len("relieve_meta"):-len(".json")].lstrip("_") or ZONA_POR_OMISION
        if z == zona:
            encontrada = fo  # si hay varias, la última registrada
    return encontrada


def entrega_de(fuentes_origen, archivo):
    """Fila de data/processed/fuentes.json de la entrega «archivo» (la última registrada); None si no está."""
    encontrada = None
    for fo in fuentes_origen or []:
        if isinstance(fo, dict) and fo.get("tipo", "entrega") == "entrega" and str(fo.get("archivo") or "") == archivo:
            encontrada = fo
    return encontrada


def tiene_digito(v):
    return isinstance(v, str) and bool(re.search(r"\d", v))


def textos_con_digitos(obj, ruta):
    """[(ruta, texto)] de los textos que llevan algún dígito, sin contar fuentes ni etiquetas."""
    salida = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k.endswith("fuente") or k.endswith("etiqueta"):
                continue
            salida += textos_con_digitos(v, f"{ruta}.{k}")
    elif isinstance(obj, list):  # p. ej. la secuencia de una opción del catálogo de B3
        for i, v in enumerate(obj):
            salida += textos_con_digitos(v, f"{ruta}[{i}]")
    elif isinstance(obj, str) and re.search(r"\d", obj):
        salida.append((ruta, obj))
    return salida


def cifras_de_relieve(m, relieve, fuentes_origen):
    """web/data/relieve.json (A9; lo copia motor/relieve_web.py), por zona:
    - tormenta.mm: fuente de la tormenta, con su periodo y su definición;
    - umbral_ruta_ha: con su etiqueta (umbral_ruta_etiqueta);
    - textos con cifras que la web muestra (rótulo de escala, periodo, definición).
    Fecha y script de origen: los de la entrega relieve_meta[_<zona>].json en fuentes.json."""
    fuente_archivo = relieve.get("fuente")
    mock = bool(relieve.get("mock"))
    for zid, z in (relieve.get("zonas") or {}).items():
        if not isinstance(z, dict):
            continue
        entrega = entrega_de_relieve(fuentes_origen, zid) or {}
        fecha = entrega.get("fecha_consulta") or entrega.get("fecha")
        script = "; ".join(x for x in (entrega.get("script"), SCRIPT_RELIEVE) if x)
        fuente_zona = fuente_archivo or entrega.get("fuente")
        t = z.get("tormenta") or {}
        etiqueta_tormenta = t.get("etiqueta") or ETIQUETA_CALCULO  # P95 calculado sobre la serie diaria
        # rutas_depresiones (A9): la regla que corta las rutas dentro de las depresiones cerradas del
        # modelo; sus cifras y su nota llevan la fuente de la entrega relieve_meta y la etiqueta del bloque.
        dep = z.get("rutas_depresiones") or {}
        fuente_dep = entrega.get("fuente") or fuente_zona
        etiqueta_dep = dep.get("etiqueta") or ETIQUETA_CALCULO
        base = f"zonas.{zid}"
        for ruta, valor in hojas_numericas(z, base):
            if ruta.startswith(f"{base}.rutas_depresiones."):
                m.agregar(ARCHIVO_RELIEVE, ruta, valor, fuente_dep, fecha, script, etiqueta_dep, mock)
            elif ruta == f"{base}.tormenta.mm":
                m.agregar(ARCHIVO_RELIEVE, ruta, valor, t.get("fuente"), fecha, script, etiqueta_tormenta, mock,
                          periodo=t.get("periodo"), definicion=t.get("definicion"))
            elif ruta == f"{base}.umbral_ruta_ha":
                m.agregar(ARCHIVO_RELIEVE, ruta, valor, fuente_zona, fecha, script,
                          z.get("umbral_ruta_etiqueta"), mock)
            else:  # cifra nueva en relieve.json: se registra igual, con la fuente del archivo, y se avisa
                m.avisos.append(f"relieve.json:{ruta}: cifra sin regla propia en motor/manifest.py")
                m.agregar(ARCHIVO_RELIEVE, ruta, valor, fuente_zona, fecha, script, None, mock)
        for ruta, texto in textos_con_digitos(z, base):
            if ruta.startswith(f"{base}.rutas_depresiones."):
                m.agregar(ARCHIVO_RELIEVE, ruta, texto, fuente_dep, fecha, script, etiqueta_dep, mock)
                continue
            en_tormenta = ruta.startswith(f"{base}.tormenta.")
            etiqueta_texto = etiqueta_tormenta if en_tormenta else (z.get("rotulo_etiqueta") or ETIQUETA_ROTULO_RELIEVE)
            m.agregar(ARCHIVO_RELIEVE, ruta, texto, t.get("fuente") if en_tormenta else fuente_zona, fecha,
                      script, etiqueta_texto, mock)


def cifras_de_gemelo(m, gemelo, params, fuentes_origen):
    """web/data/gemelo.json (motor/gemelo_web.py; decisión del gemelo digital):
    - valores de diseño de params.gemelo (exageración general y la de cada zona, zooms del relieve, metros por
      millar, cámara, intervalo de la línea de tiempo), con su fuente y su etiqueta «Diseño»;
    - bounds de cada zona: el rectángulo de params.zona_piloto.zonas;
    - elev_min_m y elev_max_m de cada zona: mínimo y máximo de sus teselas de relieve (la zona y su margen), de la
      entrega nasadem_zona_piloto[_<zona>].tif;
    - tiempo.anios: los años de la memoria de parcelas (entrega memoria_parcelas.csv);
    - tileSize: el formato de las teselas (XYZ de 256 px); textos con dígitos: el rótulo y los meses del NDVI."""
    g = params.get("gemelo") or {}
    zonas_p = obtener(params, "zona_piloto.zonas") or {}
    terreno = gemelo.get("terreno") or {}

    def diseno(clave):
        e = g.get(clave)
        if not isinstance(e, dict):
            m.avisos.append(f"params.json no tiene la entrada gemelo.{clave}")
            e = {}
        return e.get("fuente"), e.get("fecha") or e.get("fecha_consulta"), SCRIPT_GEMELO, e.get("etiqueta")

    def de_entrega(archivo, fuente=None, etiqueta=ETIQUETA_CALCULO):
        e = entrega_de(fuentes_origen, archivo) or {}
        script = "; ".join(x for x in (e.get("script"), SCRIPT_GEMELO) if x)
        return fuente or e.get("fuente"), e.get("fecha_consulta") or e.get("fecha"), script, etiqueta

    def tif_de(zid):
        con_sufijo = f"nasadem_zona_piloto_{zid}.tif"
        return con_sufijo if entrega_de(fuentes_origen, con_sufijo) else "nasadem_zona_piloto.tif"

    por_zona = (g.get("exageracion_por_zona") or {}).get("valor") or {}
    for ruta, valor in hojas_numericas(gemelo, ""):
        partes = ruta.split(".")
        if ruta in DISENO_GEMELO:
            origen = diseno(DISENO_GEMELO[ruta])
        elif ruta.startswith("terreno.zonas.") and len(partes) >= 4:
            zid, campo = partes[2], partes[3]
            if campo == "exageracion":
                origen = diseno("exageracion_por_zona" if zid in por_zona else "exageracion_vertical")
            elif campo.startswith("bounds"):
                origen = (zonas_p.get("fuente"), zonas_p.get("fecha"), SCRIPT_GEMELO, zonas_p.get("etiqueta"))
            elif campo in ("elev_min_m", "elev_max_m"):
                origen = de_entrega(tif_de(zid), terreno.get("fuente"))
            else:
                origen = None
        elif ruta == "terreno.tileSize":
            origen = ("Formato de las teselas de relieve (XYZ de 256 px, terrarium; motor/dem_teselas.py)", None,
                      SCRIPT_GEMELO, "Método")
        elif ruta.startswith("tiempo.anios"):
            origen = de_entrega("memoria_parcelas.csv")
        else:
            origen = None
        if origen is None:  # cifra nueva en gemelo.json: se registra con la fuente del relieve y se avisa
            m.avisos.append(f"gemelo.json:{ruta}: cifra sin regla propia en motor/manifest.py")
            origen = (terreno.get("fuente"), None, SCRIPT_GEMELO, None)
        m.agregar(ARCHIVO_GEMELO, ruta, valor, *origen, False)
    for ruta, texto in textos_con_digitos(gemelo, ""):
        ruta = ruta.lstrip(".")
        if ruta.startswith("_"):
            continue  # encabezado y nota del archivo (regla 4), no son cifras de la página
        if ruta.startswith("ndvi.meses"):
            origen = de_entrega("hls_mensual_parcelas.csv", (gemelo.get("ndvi") or {}).get("fuente"))
        elif ruta == "terreno.rotulo":
            origen = (terreno.get("fuente"), None, SCRIPT_GEMELO, ETIQUETA_ROTULO_RELIEVE)
        else:
            origen = (terreno.get("fuente"), None, SCRIPT_GEMELO, None)
        m.agregar(ARCHIVO_GEMELO, ruta, texto, *origen, False)


def cifras_de_parcelas(m, geo, fuentes_origen, origen_geo, mock, script_cubo):
    """parcelas.geojson: TODAS las hojas numéricas de properties, cada una con su regla.
    - PROPIEDADES_PARCELA (y memoria[*].anio): cálculo del motor (origen_geo);
    - properties.relieve.*: entrega relieve_parcelas.csv (A9) de fuentes.json, copiada por B4;
    - cualquier otra: se registra con la fuente del archivo y se avisa una vez por patrón (no se salta)."""
    fuente, fecha, script, etiqueta = origen_geo
    entrega = entrega_de(fuentes_origen, ENTREGA_RELIEVE_PARCELAS) or {}
    if mock:
        relieve_origen = origen_geo
    else:
        scripts = "; ".join(x for x in (entrega.get("script"), script_cubo) if x) or None
        relieve_origen = (entrega.get("fuente"), entrega.get("fecha_consulta") or entrega.get("fecha"),
                          scripts, ETIQUETA_CALCULO)
    sin_regla = set()
    for i, f in enumerate(geo.get("features") or []):
        for ruta, valor in hojas_numericas(f.get("properties") or {}, ""):
            patron = re.sub(r"\[\d+\]", "[*]", ruta)
            clave = f"features[{i}].properties.{ruta}"
            if patron in PROPIEDADES_PARCELA:
                m.agregar(ARCHIVO_PARCELAS, clave, valor, fuente, fecha, script, etiqueta, mock)
            elif patron in PROPIEDADES_RELIEVE or patron.startswith("relieve."):
                if patron not in PROPIEDADES_RELIEVE and patron not in sin_regla:
                    sin_regla.add(patron)
                    m.avisos.append(f"parcelas.geojson:properties.{patron}: cifra de relieve sin regla propia en "
                                    "motor/manifest.py (se registra con la fuente de relieve_parcelas.csv)")
                if not mock and not entrega and "relieve_entrega" not in sin_regla:
                    sin_regla.add("relieve_entrega")
                    m.avisos.append("parcelas.geojson:properties.relieve.*: la entrega relieve_parcelas.csv no está "
                                    "en data/processed/fuentes.json")
                m.agregar(ARCHIVO_PARCELAS, clave, valor, *relieve_origen, mock)
            else:
                if patron not in sin_regla:
                    sin_regla.add(patron)
                    m.avisos.append(f"parcelas.geojson:properties.{patron}: cifra sin regla propia en "
                                    "motor/manifest.py (se registra con la fuente del archivo)")
                m.agregar(ARCHIVO_PARCELAS, clave, valor, fuente, fecha, script, None, mock)


def cifras_de_pruebas(m, pruebas):
    """web/data/pruebas.json (motor/pruebas_web.py): cifras y textos con cifras de «About & Data».
    - métricas (valor, total, fracción y su rótulo si lleva cifras): la fuente citada en la métrica;
    - número, título y criterio de cada prueba: S9 §6 (criterio declarado antes del resultado);
    - resumen y notas con cifras: el documento o el archivo citado en la prueba o en la parte;
    - puerta automática (corrida y detalle de cada paso): docs/pruebas.md, escrito por construir.py."""
    fecha = pruebas.get("generado")
    script = pruebas.get("script") or SCRIPT_PRUEBAS
    fuente_criterios = pruebas.get("fuente_criterios")
    for i, p in enumerate(pruebas.get("pruebas") or []):
        if not isinstance(p, dict):
            continue
        cifras_de_una_prueba(m, p, f"pruebas[{i}]", fuente_criterios, fecha, script)
        # Complementos de una prueba (p. ej. H1-b junto a H1): mismas reglas, con su propio criterio y su documento.
        for j, c in enumerate(p.get("complementos") or []):
            if isinstance(c, dict):
                cifras_de_una_prueba(m, c, f"pruebas[{i}].complementos[{j}]", fuente_criterios, fecha, script)
    for j, d in enumerate(pruebas.get("documentos") or []):
        for campo in ("titulo", "nota", "ruta", "url"):
            if isinstance(d, dict) and tiene_digito(d.get(campo)):
                m.agregar(ARCHIVO_PRUEBAS, f"documentos[{j}].{campo}", d[campo], d.get("ruta"), fecha, script,
                          ETIQUETA_DOCUMENTO, False)
    cifras_de_puerta(m, pruebas, fecha, script)


def cifras_de_una_prueba(m, p, base, fuente_criterios, fecha, script):
    """Número, título, criterio, resumen, métricas y notas con cifras de una prueba (o de un complemento)."""
    if True:
        f_crit = p.get("criterio_fuente") or fuente_criterios
        f_prueba = "; ".join(map(str, p.get("fuentes") or [])) or None
        if es_numero(p.get("numero")):
            m.agregar(ARCHIVO_PRUEBAS, f"{base}.numero", p["numero"], f_crit, fecha, script, ETIQUETA_CRITERIO, False)
        for campo in ("titulo", "criterio"):
            if tiene_digito(p.get(campo)):
                m.agregar(ARCHIVO_PRUEBAS, f"{base}.{campo}", p[campo], f_crit, fecha, script, ETIQUETA_CRITERIO, False)
        if tiene_digito(p.get("resumen")):
            m.agregar(ARCHIVO_PRUEBAS, f"{base}.resumen", p["resumen"], f_prueba, fecha, script,
                      ETIQUETA_DOCUMENTO, False)
        for j, met in enumerate(p.get("metricas") or []):
            if not isinstance(met, dict):
                continue
            f_met = met.get("fuente") or f_prueba
            for k in ("valor", "total", "fraccion"):
                if es_numero(met.get(k)):
                    m.agregar(ARCHIVO_PRUEBAS, f"{base}.metricas[{j}].{k}", met[k], f_met, fecha, script,
                              ETIQUETA_CALCULO, False)
            if tiene_digito(met.get("etiqueta")):
                m.agregar(ARCHIVO_PRUEBAS, f"{base}.metricas[{j}].etiqueta", met["etiqueta"], f_met, fecha, script,
                          ETIQUETA_CALCULO, False)
        for j, parte in enumerate(p.get("partes") or []):
            if isinstance(parte, dict) and tiene_digito(parte.get("nota")):
                m.agregar(ARCHIVO_PRUEBAS, f"{base}.partes[{j}].nota", parte["nota"], parte.get("fuente") or f_prueba,
                          fecha, script, ETIQUETA_DOCUMENTO, False)
        if tiene_digito(p.get("nota")):
            m.agregar(ARCHIVO_PRUEBAS, f"{base}.nota", p["nota"], f_prueba, fecha, script, ETIQUETA_DOCUMENTO, False)


def cifras_de_puerta(m, pruebas, fecha, script):
    """Puerta automática (docs/pruebas.md) y fecha de generación de pruebas.json."""
    puerta = pruebas.get("puerta") or {}
    f_puerta = puerta.get("fuente") or "docs/pruebas.md"
    if tiene_digito(puerta.get("corrida")):
        m.agregar(ARCHIVO_PRUEBAS, "puerta.corrida", puerta["corrida"], f_puerta, puerta["corrida"], "construir.py",
                  ETIQUETA_CORRIDA, False)
    for j, paso in enumerate(puerta.get("pasos") or []):
        if isinstance(paso, dict) and tiene_digito(paso.get("detalle")):
            m.agregar(ARCHIVO_PRUEBAS, f"puerta.pasos[{j}].detalle", paso["detalle"], f_puerta,
                      puerta.get("corrida") or fecha, "construir.py", ETIQUETA_CORRIDA, False)
    if tiene_digito(fecha):
        m.agregar(ARCHIVO_PRUEBAS, "generado", fecha, ARCHIVO_PRUEBAS, fecha, script, ETIQUETA_CORRIDA, False)


def generar(raiz=RAIZ, escribir=True, hoy=None):
    """Construye el manifest a partir de web/data/* y data/params.json.

    Devuelve el diccionario; con escribir=True lo guarda en web/data/manifest.json.
    """
    raiz = Path(raiz)
    hoy = hoy or datetime.date.today().isoformat()
    params = leer_json(raiz / "data/params.json")
    cubo = leer_json(raiz / "web/data/cubo.json")
    geo = leer_json(raiz / "web/data/parcelas.geojson")
    ruta_expl = raiz / "web/data/explicaciones.json"
    expl = leer_json(ruta_expl) if ruta_expl.exists() else None
    meta = cubo.get("meta") or {}
    m = Manifest(hoy)

    # Fuentes de origen (las escribe el ensamblador); el relieve toma de aquí su fecha y su script.
    ruta_fuentes = raiz / "data/processed/fuentes.json"
    fuentes_origen = []
    if ruta_fuentes.exists():
        crudo = leer_json(ruta_fuentes)
        fuentes_origen = crudo.get("fuentes", []) if isinstance(crudo, dict) else crudo
        if not isinstance(fuentes_origen, list):
            m.avisos.append("data/processed/fuentes.json no es una lista de fuentes")
            fuentes_origen = []
        for fo in fuentes_origen:
            faltan = [k for k in ("archivo", "url_o_api", "fecha_consulta", "sha256") if not (fo or {}).get(k)]
            if faltan:
                m.avisos.append(f"fuente de origen incompleta ({', '.join(faltan)}): {fo}")

    # Script que escribió el cubo: el simulador mientras el cubo sea simulado.
    script_cubo = SCRIPT_SIMULADOS if meta.get("mock") else (meta.get("script") or SCRIPT_ENSAMBLADO)

    def mock_cubo(bloque):
        return es_simulado(meta, bloque)

    # 1) distrito, dotaciones y lluvia_pct (fuente y etiqueta de params.json)
    cifras_de_params(m, cubo, params, script_cubo, mock_cubo)

    # 2) zona (B4)
    mock_zona = mock_cubo("zona")
    fuente, fecha, script, etiqueta = origen_calculo(meta, "zona", mock_zona, hoy)
    for ruta, valor in hojas_numericas(cubo.get("zona") or {}, "zona"):
        m.agregar("web/data/cubo.json", ruta, valor, fuente, fecha, script, etiqueta, mock_zona)

    # 2b) zonas.<id> (B4 por zona; bbox de params) y localidades del equipo (params)
    cifras_de_zonas(m, cubo, params, script_cubo, mock_cubo, hoy)
    cifras_de_localidades(m, cubo, params, script_cubo, mock_cubo)

    # 2c) cubo.meta (eficiencias del goteo y ventana de suelo desnudo) y catálogos de B3
    cifras_de_meta(m, cubo, params, fuentes_origen, script_cubo, mock_cubo)
    cifras_de_catalogos(m, cubo, fuentes_origen, script_cubo, mock_cubo)

    # 3) opciones de cada parcela (B4 y X3.1)
    mock_op = mock_cubo("parcelas")
    fuente, fecha, script, etiqueta = origen_calculo(meta, "parcelas", mock_op, hoy)
    # El escenario de goteo real lleva la fuente y la etiqueta de las eficiencias de supuestos.json.
    del_goteo = None if mock_op else origen_goteo(meta, fuentes_origen, script_cubo)
    for pid, pc in (cubo.get("parcelas") or {}).items():
        for i, op in enumerate(pc.get("opciones") or []):
            base = f"parcelas.{pid}.opciones[{i}]"
            for bloque in BLOQUES_OPCION:
                origen = del_goteo if (bloque in BLOQUES_GOTEO and del_goteo) else (fuente, fecha, script, etiqueta)
                for ruta, valor in hojas_numericas(obtener(op, bloque), f"{base}.{bloque}"):
                    m.agregar("web/data/cubo.json", ruta, valor, *origen, mock_op)
            cifras_de_filtros(m, base, op, meta, fuentes_origen, script_cubo, mock_op)
            cifras_de_lamina_local(m, base, op, fuentes_origen, script_cubo, mock_op, fecha)
            dinero = op.get("dinero")
            if isinstance(dinero, dict):  # solo existe con fuente (contrato §2.3)
                for k in ("margen_min", "margen_max"):
                    if es_numero(dinero.get(k)):
                        m.agregar("web/data/cubo.json", f"{base}.dinero.{k}", dinero[k], dinero.get("fuente"),
                                  fecha, script, dinero.get("etiqueta") or ETIQUETA_CALCULO, mock_op)

    # 4) parcelas.geojson (B1, A3, A3-M y A4.2)
    meta_geo = geo.get("meta") or {}
    mock_geo = bool(meta_geo.get("mock", meta.get("mock")))
    origen_geo = origen_calculo({**meta, **meta_geo}, "parcelas_geojson", mock_geo, hoy)
    cifras_de_parcelas(m, geo, fuentes_origen, origen_geo, mock_geo, script_cubo)

    # 5) valores de los marcadores de explicaciones.json (C3)
    if expl is not None:
        meta_e = expl.get("meta") or {}
        mock_e = bool(meta_e.get("mock", meta.get("mock")))
        fuente, fecha, script, etiqueta = origen_calculo({**meta, **meta_e}, "explicaciones", mock_e, hoy)
        for llave, v in (expl.get("explicaciones") or {}).items():
            for ruta, valor in hojas_numericas(v.get("valores") or {}, f"explicaciones.{llave}.valores"):
                m.agregar("web/data/explicaciones.json", ruta, valor, fuente, fecha, script, etiqueta, mock_e)
    else:
        m.avisos.append("web/data/explicaciones.json no existe")

    # 6) relieve.json (A9): tormenta y umbral de las rutas, por zona. Sin entregas de relieve no
    #    existe (motor/relieve_web.py lo borra) y la web dice «terrain layer: not run».
    ruta_relieve = raiz / ARCHIVO_RELIEVE
    if ruta_relieve.exists():
        cifras_de_relieve(m, leer_json(ruta_relieve), fuentes_origen)

    # 6b) gemelo.json (motor/gemelo_web.py): vista 3D y línea de tiempo del gemelo. Sin el bloque «gemelo» de
    #     params no existe y la página dice «3D twin view: not available».
    ruta_gemelo = raiz / ARCHIVO_GEMELO
    if ruta_gemelo.exists():
        cifras_de_gemelo(m, leer_json(ruta_gemelo), params, fuentes_origen)

    # 6c) ndvi_mensual.json, suelo.json y contexto.json: lo que la ficha de la parcela muestra (gráfica del NDVI con
    #     sus umbrales, perfil y aptitud de suelo, GEDI y riesgo de helada).
    for archivo, funcion in ((ARCHIVO_NDVI, cifras_de_ndvi), (ARCHIVO_SUELO, cifras_de_suelo),
                             (ARCHIVO_CONTEXTO, cifras_de_contexto)):
        if (raiz / archivo).exists():
            funcion(m, leer_json(raiz / archivo), fuentes_origen)

    # 7) pruebas.json (paso 5c): las cifras de «About & Data». Si aún no existe, no hay nada que rastrear.
    ruta_pruebas = raiz / ARCHIVO_PRUEBAS
    if ruta_pruebas.exists():
        cifras_de_pruebas(m, leer_json(ruta_pruebas))

    simuladas = sum(1 for c in m.cifras.values() if c["mock"])
    cifras = agrupar_cifras(m.cifras)
    manifest = {
        "_encabezado": ENCABEZADO,
        "_nota": "Generado por motor/manifest.py a partir de web/data/* y data/params.json; nunca se edita a mano (kit v4 §2.5).",
        "generado": hoy,
        "mock": bool(meta.get("mock")),
        "resumen": {"cifras": len(m.cifras), "patrones": len(cifras), "simuladas": simuladas,
                    "fuentes_de_origen": len(fuentes_origen), "avisos": len(m.avisos)},
        "avisos": m.avisos,
        "fuentes_de_origen": fuentes_origen,
        "_nota_cifras": "Agrupadas por patrón de ruta: parcelas.<id> -> parcelas.*, zonas.<id> -> zonas.*, índices [n] -> [*]. Cada patrón lleva su fuente, fecha, script, etiqueta, número de valores y rango (los textos con cifras, en «textos»); así el manifiesto no crece con el número de parcelas ni de zonas.",
        "cifras": cifras,
    }
    if escribir:
        destino = raiz / "web/data/manifest.json"
        destino.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return manifest


CAMPOS_ENTRADA = ("clave", "archivo", "valor", "fuente", "fecha", "script", "etiqueta", "mock")


def patron_de(clave):
    """Ruta sin id de parcela, sin id de zona ni índices: parcelas.* / zonas.* / [*]."""
    patron = re.sub(r"parcelas\.[^.\[]+", "parcelas.*", clave)
    patron = re.sub(r"(^|\.)zonas\.[^.\[]+", r"\1zonas.*", patron)
    return re.sub(r"\[\d+\]", "[*]", patron)


def agrupar_cifras(cifras):
    """Agrupa las cifras por patrón de ruta (sin id de parcela o de zona ni índice) para que el
    manifiesto no crezca con el número de parcelas. Conserva fuente, fecha, script, etiqueta, mock
    y los campos extra (p. ej. periodo); si un patrón mezcla valores distintos de esos campos, se
    guardan todos en una lista. Los valores de texto (textos con cifras) van en «textos»."""
    grupos = {}
    for c in cifras.values():
        patron = patron_de(c["clave"])
        llave = f"{Path(c['archivo']).name}:{patron}"
        extra = [k for k in c if k not in CAMPOS_ENTRADA]
        g = grupos.get(llave)
        if g is None:
            g = grupos[llave] = {"clave": patron, "archivo": c["archivo"], "n": 0, "min": None, "max": None,
                                 "fuente": c["fuente"], "fecha": c["fecha"], "script": c["script"],
                                 "etiqueta": c["etiqueta"], "mock": c["mock"], **{k: c[k] for k in extra}}
        g["n"] += 1
        v = c["valor"]
        if es_numero(v):
            g["min"] = v if g["min"] is None else min(g["min"], v)
            g["max"] = v if g["max"] is None else max(g["max"], v)
        elif isinstance(v, str):
            textos = g.setdefault("textos", [])
            if v not in textos:
                textos.append(v)
        for k in ("fuente", "fecha", "etiqueta", "script", *extra):
            if k not in g:
                g[k] = c[k]
            elif c[k] != g[k]:
                otros = g[k] if isinstance(g[k], list) else [g[k]]
                if c[k] not in otros:
                    g[k] = otros + [c[k]]
        g["mock"] = g["mock"] or c["mock"]
    return grupos


if __name__ == "__main__":
    man = generar()
    r = man["resumen"]
    print(f"manifest.json: {r['cifras']} cifras ({r['simuladas']} simuladas), "
          f"{r['fuentes_de_origen']} fuentes de origen, {r['avisos']} avisos")
    for a in man["avisos"][:10]:
        print(" aviso:", a)
    sys.exit(0)
