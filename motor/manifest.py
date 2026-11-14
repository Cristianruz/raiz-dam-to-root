# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
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
except ImportError:  # pragma: no cover - depende de cómo se llame
    from relieve_web import ZONA_POR_OMISION

RAIZ = Path(__file__).resolve().parent.parent
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
SCRIPT_SIMULADOS = "motor/simulados.py"
SCRIPT_ENSAMBLADO = "motor/ensamblar.py"
SCRIPT_RELIEVE = "motor/relieve_web.py"
SCRIPT_PRUEBAS = "motor/pruebas_web.py"
ARCHIVO_RELIEVE = "web/data/relieve.json"
ARCHIVO_PARCELAS = "web/data/parcelas.geojson"
ARCHIVO_PRUEBAS = "web/data/pruebas.json"
ENTREGA_RELIEVE_PARCELAS = "relieve_parcelas.csv"  # A9: indicadores de relieve por parcela
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
    if dot.get("equivalencia"):
        # Texto con cifras (1 millar/ha = 1,000 m³/ha = 10 cm): se rastrea a params.unidades.millar.
        con_param("dotaciones.equivalencia", dot["equivalencia"], obtener(params, "unidades.millar"), "dotaciones")

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
        base = f"zonas.{zid}"
        for ruta, valor in hojas_numericas(z, base):
            if ruta == f"{base}.tormenta.mm":
                m.agregar(ARCHIVO_RELIEVE, ruta, valor, t.get("fuente"), fecha, script, etiqueta_tormenta, mock,
                          periodo=t.get("periodo"), definicion=t.get("definicion"))
            elif ruta == f"{base}.umbral_ruta_ha":
                m.agregar(ARCHIVO_RELIEVE, ruta, valor, fuente_zona, fecha, script,
                          z.get("umbral_ruta_etiqueta"), mock)
            else:  # cifra nueva en relieve.json: se registra igual, con la fuente del archivo, y se avisa
                m.avisos.append(f"relieve.json:{ruta}: cifra sin regla propia en motor/manifest.py")
                m.agregar(ARCHIVO_RELIEVE, ruta, valor, fuente_zona, fecha, script, None, mock)
        for ruta, texto in textos_con_digitos(z, base):
            en_tormenta = ruta.startswith(f"{base}.tormenta.")
            etiqueta_texto = etiqueta_tormenta if en_tormenta else (z.get("rotulo_etiqueta") or ETIQUETA_ROTULO_RELIEVE)
            m.agregar(ARCHIVO_RELIEVE, ruta, texto, t.get("fuente") if en_tormenta else fuente_zona, fecha,
                      script, etiqueta_texto, mock)


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
        base = f"pruebas[{i}]"
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

    # 3) opciones de cada parcela (B4 y X3.1)
    mock_op = mock_cubo("parcelas")
    fuente, fecha, script, etiqueta = origen_calculo(meta, "parcelas", mock_op, hoy)
    for pid, pc in (cubo.get("parcelas") or {}).items():
        for i, op in enumerate(pc.get("opciones") or []):
            base = f"parcelas.{pid}.opciones[{i}]"
            for bloque in BLOQUES_OPCION:
                for ruta, valor in hojas_numericas(obtener(op, bloque), f"{base}.{bloque}"):
                    m.agregar("web/data/cubo.json", ruta, valor, fuente, fecha, script, etiqueta, mock_op)
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
