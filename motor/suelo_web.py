#!/usr/bin/env python3
# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Perfil de suelo por parcela y aptitud de cada opción para la web: escribe web/data/suelo.json.

Decisión: docs/decisiones/2026-11-14_suelo_aptitud.md (qué se agrega, qué no es y el contrato de las
dos entregas: suelo_parcelas.csv, pieza A14, y suelo_requisitos.json, pieza A15). Nada de esto cambia
el cálculo del agua de la parcela (cubo, kit §2): la aptitud es una evidencia más junto al agua y al
plazo. No es un análisis de suelo (es un mapa regional modelado) y no decide por el agricultor.

API (el integrador la conecta a construir.py DESPUÉS de motor/b4_cubo.py, porque lee el cubo; este
módulo no depende de ningún otro motor):
    construir(processed=data/processed, web=web/data, cubo_ruta=None, generado=None) -> dict
        Lee las entregas YA validadas de `processed` (motor/ensamblar.py) y las opciones del cubo
        (`cubo_ruta`; por omisión <web>/cubo.json) y escribe <web>/suelo.json. Devuelve
        {"ejecutado": True, "salida": ruta, "bloques": {"perfil": bool, "requisitos": bool,
        "aptitud": bool}, "parcelas_con_perfil": n, "opciones_evaluadas": n, "estados": {estado: n},
        "avisos": [...]}. No modifica nada más. `generado` fija la marca de tiempo (solo para la fixture).
    armar(processed, cubo, generado=None) -> (suelo, avisos)
        Lo mismo sin escribir (para las pruebas). `cubo` es el contenido de cubo.json o None.
    aptitud_de_opcion(secuencia, perfil, requisitos) -> dict   y   aptitud_de_cultivo(cultivo, perfil,
        requisitos) -> dict: las reglas de abajo para UNA opción o UN cultivo (`requisitos` ya pasado
        por normalizar_requisitos).
CLI:
    python motor/suelo_web.py [--processed DIR] [--web DIR] [--cubo RUTA]

Contenido de suelo.json (lo lee web/js/suelo.js; toda cifra de la página sale de aquí):
  _encabezado, _nota, generado (fecha y hora UTC), decision
  rotulo           texto fijo de escala, en inglés: «Regional soil map; not a soil test». La resolución
                   del mapa NO va aquí ni se escribe a mano: está en perfil.fuente, que es la línea de
                   data/processed/fuentes.json del archivo (LEEME.md del buzón: producto, versión, capa).
  motivo_pedido    el texto común de lo pedido y aún no entregado
  idioma_fuentes   idioma de los textos de «fuente» de las entregas (líneas de LEEME.md), para que la
                   página los marque con su atributo «lang»
  perfil           null + perfil_motivo, o {archivo, fuente, fecha, profundidad_cm, parcelas: {id:
                   {arena_pct, limo_pct, arcilla_pct, clase_textura, ph, carbono_organico_g_kg,
                   nitrogeno_g_kg, cic_cmol_kg, salinidad_ce_ds_m, n_celdas}}, resumen_zona: {zona: {n,
                   clases: {clase: n}, ph: {min, mediana, max}}} | null}. Un valor que la entrega trae
                   vacío va en null, nunca en cero. profundidad_cm es la capa del archivo («0-30»); si
                   las filas no traen todas la misma, va en null y cada parcela lleva la suya.
  requisitos       null + requisitos_motivo, o el contenido de suelo_requisitos.json tal cual (fuente,
                   cultivos y, si viene, escala_ph) más «entrega» {archivo, fuente, fecha}
  aptitud          null + aptitud_motivo (+ aptitud_falta: qué archivos faltan) si falta cualquiera de los
                   dos o el cubo; si están: {id_parcela: {id_opcion: {estado, nota, por_cultivo: [{cultivo,
                   estado, nota, motivos: [{criterio: "ph" | "textura" | "salinidad", estado, valor_parcela,
                   rango_o_lista, fuente}], sin_dato_de_parcela: [criterio]}], avisos_nutrientes:
                   [{elemento, texto_en, fuente, cultivo}]}}}. Solo entran las parcelas con perfil y
                   con opciones en el cubo. rango_o_lista: {optimo: [min, max], tolerado: [min, max]}
                   (ph), {apta: [...], limitante: [...]} (textura) o {umbral_ds_m: valor} (salinidad).
  avisos           lo que el motor no pudo leer o encontró inconsistente (lista de textos)
  rotulo_aptitud   texto fijo, en inglés, que acompaña a la aptitud en cada tarjeta: los rangos son generales
                   y mundiales, no ensayos locales (decisión del integrador con la sesión de datos, 14-nov)
  margen_ph        {valor, etiqueta, fuente, archivo} de data/processed/supuestos.json → suelo_margen_ph, o
                   null: el margen del estado «near_limit» (ver las reglas). Sin él no hay ese estado.
  coincidencia_textura  {valor, etiqueta, fuente, archivo} de supuestos.json → suelo_coincidencia_textura, o
                   null: fracción de parcelas en que los dos mapas de suelo dan la misma clase exacta (la
                   ficha la dice junto a la clase exacta; el grupo de textura sale de requisitos.grupos_textura)
  alcalinidad_zona {zona: {n_con_ph, n_sobre_optimo, n_cultivos, cultivos, mayoria}} | null: cuántas
                   parcelas de la zona tienen un pH por encima del óptimo general de la MAYORÍA de los cultivos
                   con rango publicado (n_sobre_optimo de n_con_ph; n_cultivos = cultivos con rango de pH), y si
                   son la mayoría de la zona (mayoria). La ficha da el mensaje de zona solo con mayoria = true.
                   null sin perfil o sin requisitos.
  tipo_suelo       null + tipo_suelo_motivo (sin tipo_suelo_parcelas.csv, pieza B8), o {archivo, fuente, fecha,
                   catalogo: {archivo, fuente, fecha} (suelo_tipos.json, B7) | null, explica_en, no_coinciden_en,
                   ordenes: {orden: {definicion_en, fertilidad_en, fuente, etiqueta}}, elementos: {elemento:
                   {significado_en, fuente, etiqueta}} (solo los que usan las parcelas), zonas: {zona: {texto_en,
                   suelos: [{grupo, pct}], fuente, etiqueta}} (suelos del municipio según INEGI, de mayor a menor),
                   grupos: {gran_grupo: {orden, elementos, descripcion_en, texto_en}}, parcelas: {id: {gran_grupo,
                   zona}}}: la descripción depende solo del gran grupo y va una vez. Una parcela sin gran grupo no
                   entra (la ficha dice que el mapa no la trae). Sin suelo_reglas.json, texto_en y los
                   textos del bloque van en null; sin suelo_tipos.json, las descripciones van en null.
  nutrientes       null + nutrientes_motivo (sin suelo_nutrientes_parcelas.csv o sin suelo_reglas.json), o
                   {archivo, fuente, fecha, reglas: {archivo, fuente, fecha}, aviso_en, resolucion_m: {valor,
                   archivo, fuente} | null, nombres_en: {símbolo: nombre}, fuentes: {llave: {fuente, etiqueta}},
                   conjuntos: {llave: {notas: [{caso, estado, elementos, texto_en, fuente}], sin_dato_en?}},
                   parcelas: {id: llave}}. Las parcelas con las mismas tres listas comparten su conjunto de notas
                   (llave = las listas tal como llegan, «B;Cu;Fe;Mn;Ni;Zn|P|»; sin pH, «sin_dato»). «fuente» de
                   cada nota es una llave de «fuentes» (así la cita larga no se repite).

REGLAS DE APTITUD (cinco estados: fits, tolerated, near_limit, outside_range y no_published_range):
- Por criterio:
  · pH: dentro del rango óptimo (extremos incluidos) → fits; fuera del óptimo y dentro del tolerado →
    tolerated; fuera del tolerado por MENOS que margen_ph (supuestos.json → suelo_margen_ph) → near_limit
    («near the published limit»: el mapa es un modelo de 250 m y la diferencia es menor que su margen);
    fuera del tolerado por margen_ph o más (o sin margen) → outside_range;
  · textura: la clase de la parcela está en «apta» → fits; en «limitante» → outside_range; en ninguna de
    las dos → tolerated;
  · salinidad: solo se evalúa si la parcela trae salinidad_ce_ds_m Y el cultivo trae umbral: menor o
    igual al umbral → fits; mayor → outside_range.
  Un criterio sin dato de la parcela o sin rango publicado NO cuenta (no se supone nada).
- El estado de un cultivo es el PEOR de sus criterios evaluados (outside_range > near_limit > tolerated >
  fits). Sin ningún criterio evaluable → no_published_range, con su nota.
- El estado de la opción es el PEOR de sus cultivos con rango; si ninguno tiene rango →
  no_published_range.
- «descanso» (no sembrar; esquemas.NO_SIEMBRA) o una secuencia vacía no se evalúan: no_published_range
  con la nota «nothing is planted».
- Una parcela cuya fila de suelo_parcelas.csv llega sin ningún valor de suelo (el mapa no la cubre) se
  queda en «perfil» tal como llegó (todo en null), pero no entra a «aptitud»: no hay nada que comparar.
- La aptitud nunca descarta ni reordena opciones: hay una entrada por opción del cubo, en su orden, y el
  semáforo de agua no la usa. Es una evidencia más (rotulo_aptitud).
- Avisos de nutrientes: se agrega el de cada cultivo de la opción cuando su condición se cumple con el
  perfil de la parcela (ph_mayor_que y ph_menor_que: desigualdad estricta; textura_en: la clase de la
  parcela está en la lista; varias llaves: todas). Sin condición → siempre.
- Nada se interpola ni se redondea más allá de lo que trae la entrega. Los únicos valores calculados son
  los del resumen por zona (conteos, mínimo, máximo y mediana del pH; la mediana lleva a lo más un
  decimal más que la entrega). Este archivo no trae ningún rango, umbral ni corte: todos se LEEN de
  suelo_requisitos.json.

NOTAS DE NUTRIENTES Y TIPO DE SUELO (entregas B7 y B8; textos de suelo_reglas.json → textos_ficha_en, tal cual,
con sus {marcadores} llenos con los datos; nada se calcula: las listas por parcela ya vienen calculadas por la
sesión de datos en suelo_nutrientes_parcelas.csv):
- menos_disponibles no vacía → una nota «less_available» con su texto; si trae Fe, además la nota del hierro.
- cerca_del_limite sin N, K, Ca, Mg ni S (la decisión del integrador que trae textos_ficha_en) → «near_limit».
- toxicidad_posible no vacía → «possible_toxicity» ({ph_toxico} = disponibilidad_ph.toxicidad_ph_menor_que.valor).
- las dos listas vacías con pH → «within_range» (sin_aviso_ph); sin pH → ninguna nota y sin_dato_en.
- La resolución del mapa (resolucion_m) se lee de la línea de fuente de suelo_parcelas.csv (LEEME.md del buzón,
  «ISRIC SoilGrids 2.0 (<n> m, …»): no se escribe a mano. Si esa línea no trae una sola, va en null y la ficha no la dice.
"""
import argparse
import csv
import datetime
import json
import math
import re
import statistics
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from motor import esquemas as E  # noqa: E402

ENCABEZADO = "AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026"
NOMBRE_SALIDA = "suelo.json"
NOMBRE_FUENTES = "fuentes.json"
NOMBRE_CUBO = "cubo.json"
DECISION = "docs/decisiones/2026-11-14_suelo_aptitud.md"

# Entregas (docs/decisiones/2026-11-14_suelo_aptitud.md): un archivo para las dos zonas.
ARCHIVO_PERFIL = "suelo_parcelas.csv"
ARCHIVO_REQUISITOS = "suelo_requisitos.json"

# Textos fijos en inglés (la página los muestra tal cual; sin cifras).
ROTULO = "Regional soil map; not a soil test"
MOTIVO_PEDIDO = "Requested from the data team — not delivered yet"
MOTIVO_ILEGIBLE = "The delivered file could not be read; see the build log"
MOTIVO_SIN_CUBO = "The options of each field are not built yet"
NOTA_NO_SIEMBRA = "nothing is planted"
NOTA_SIN_RANGO = "no published range for this crop"
NOTA_SIN_VALOR = "no soil value of this field to compare with the published range"
# Rótulo de la aptitud (decisión del integrador con la sesión de datos, 14-nov): los rangos de ECOCROP son
# generales y mundiales; no son ensayos del DR-005.
ROTULO_APTITUD = "General published range (FAO ECOCROP, worldwide), not a local trial"
# Supuestos de la sesión de datos que usa este módulo (data/processed/supuestos.json).
ARCHIVO_SUPUESTOS = "supuestos.json"
SUPUESTO_MARGEN_PH = "suelo_margen_ph"
SUPUESTO_COINCIDENCIA = "suelo_coincidencia_textura"
# Las líneas de LEEME.md del buzón (el texto de «fuente» de cada entrega) llegan en inglés desde la reentrega
# del 15-nov (buzón v11); antes iban en español.
IDIOMA_FUENTES = "en"

# Estados de aptitud, de mejor a peor (el peor manda), y el que no entra en esa escala.
FITS, TOLERATED, NEAR, OUTSIDE = "fits", "tolerated", "near_limit", "outside_range"
SEVERIDAD = (FITS, TOLERATED, NEAR, OUTSIDE)
# Decimales con que se compara la distancia al borde del rango con el margen: evita que 7.6 − 7.1 (que en
# coma flotante da 0.49999…) quede por debajo de un margen de 0.5. Es precisión de cálculo, no un dato.
DECIMALES_DISTANCIA = 9
SIN_RANGO = "no_published_range"
ESTADOS = (*SEVERIDAD, SIN_RANGO)
CRITERIO_PH, CRITERIO_TEXTURA, CRITERIO_SALINIDAD = "ph", "textura", "salinidad"
# Bloque de suelo_requisitos.json de cada criterio (esquemas.BLOQUES_REQUISITO).
BLOQUE_DE = {CRITERIO_PH: "ph", CRITERIO_TEXTURA: "textura", CRITERIO_SALINIDAD: "salinidad_umbral_ds_m"}

# Tipo de suelo por parcela (B8) y notas de nutrientes (B7): un archivo para las dos zonas cada uno.
ARCHIVO_TIPO = "tipo_suelo_parcelas.csv"
ARCHIVO_CATALOGO = "suelo_tipos.json"
ARCHIVO_NUTRIENTES = "suelo_nutrientes_parcelas.csv"
ARCHIVO_REGLAS = "suelo_reglas.json"
# Zona → llave de suelo_tipos.json → zona con los suelos del municipio (textos_ficha_en.tipo_suelo.zona.cuando:
# «zona delicias_saucillo; {lista} = suelo_tipos.json → zona.municipio_delicias_pct»). Lázaro Cárdenas no la tiene.
LISTA_MUNICIPIO_DE_ZONA = {"delicias_saucillo": E.ZONA_PCT}
# Nutrientes que la ficha NO muestra como «near the limit» (textos_ficha_en.suelo.cerca_del_limite.cuando: «con
# cerca_del_limite sin N, K, Ca, Mg ni S (decisión del integrador)»; docs/suelo_tipos_y_nutrientes.md §6 de la rama
# datos-satelite: a pH 8.1 el grupo queda a 0.1 de su rango y en suelos calcáreos el Ca y el Mg dominan el complejo
# de cambio). Son símbolos químicos, no cifras.
NO_MOSTRAR_CERCA = ("N", "K", "Ca", "Mg", "S")
HIERRO = "Fe"   # la nota del hierro va cuando Fe está en menos_disponibles (textos_ficha_en.suelo.hierro.cuando)
# Estado de cada nota (la ficha lo dice con texto y símbolo) y llave de su fuente en nutrientes.fuentes.
NOTA_MENOS, NOTA_CERCA, NOTA_TOXICIDAD, NOTA_EN_RANGO = "less_available", "near_limit", "possible_toxicity", "within_range"
FUENTE_DISPONIBILIDAD = "disponibilidad_ph"
# Llave del conjunto de notas de una parcela: sus tres listas tal como llegan, unidas por «|»; sin pH, «sin_dato».
COLUMNAS_LISTAS = ("menos_disponibles", "cerca_del_limite", "toxicidad_posible")
LLAVE_SIN_DATO = "sin_dato"
# Resolución del mapa de suelo en la línea de fuente de su entrega («ISRIC SoilGrids 2.0 (<n> m, …»).
RESOLUCION_EN_FUENTE = re.compile(r"(?<![\d.,])(\d+) m\b")
MARCADOR = re.compile(r"\{[a-z_]+\}")

# Columnas numéricas del perfil (las demás: clase_textura, profundidad_cm y n_celdas).
COLUMNAS_NUMERICAS = ("arena_pct", "limo_pct", "arcilla_pct", "ph", "carbono_organico_g_kg",
                      "nitrogeno_g_kg", "cic_cmol_kg", "salinidad_ce_ds_m")
VACIOS = {"", "nan", "na", "n/a", "null", "none"}   # igual que motor/ensamblar.py


# ---------------------------------------------------------------------------------------
# Lectura
# ---------------------------------------------------------------------------------------
def leer_json(ruta):
    return json.loads(Path(ruta).read_text(encoding="utf-8-sig"))


def leer_csv(ruta):
    with open(ruta, newline="", encoding="utf-8-sig") as f:
        return [fila for fila in csv.DictReader(f) if any((v or "").strip() for v in fila.values())]


def numero(texto):
    """Celda de CSV como número finito, tal como llega (un entero se queda entero); None si está vacía
    o no es un número."""
    t = (texto or "").strip()
    if t.lower() in VACIOS:
        return None
    try:
        v = float(t)
    except ValueError:
        return None
    if not math.isfinite(v):
        return None
    return int(v) if v.is_integer() else v


def decimales_de(texto):
    """Decimales con que la entrega escribió un número («7.85» → 2; «8» → 0)."""
    t = (texto or "").strip()
    return len(t.split(".", 1)[1]) if "." in t else 0


def finito(v):
    """El número si es finito (los booleanos no cuentan); None en otro caso."""
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else None


def texto_lleno(v):
    return v.strip() if isinstance(v, str) and v.strip() else None


def fuentes_registradas(processed):
    """{archivo: {"fuente", "fecha"}} de las entregas de processed/fuentes.json (LEEME.md del buzón)."""
    ruta = Path(processed) / NOMBRE_FUENTES
    if not ruta.is_file():
        return {}
    registro = {}
    for f in leer_json(ruta).get("fuentes", []):
        if f.get("tipo", "entrega") == "entrega" and f.get("archivo"):
            registro[f["archivo"]] = {"fuente": f.get("fuente"), "fecha": f.get("fecha")}
    return registro


def procedencia(nombre, registradas):
    """De qué entrega sale un bloque: {"archivo", "fuente", "fecha"} (lo que falte va en None)."""
    r = registradas.get(nombre) or {}
    return {"archivo": nombre, "fuente": r.get("fuente"), "fecha": r.get("fecha")}


def zonas_de_parcelas(processed, avisos):
    """{id: zona} de parcelas_base.geojson (sin «zona» = la zona por omisión); None si no se puede leer."""
    ruta = Path(processed) / E.ARCHIVO_PARCELAS
    if not ruta.is_file():
        avisos.append(f"{E.ARCHIVO_PARCELAS} no está en las entregas validadas: el resumen de suelo por zona va en null")
        return None
    try:
        parcelas = leer_json(ruta).get("features") or []
    except (json.JSONDecodeError, UnicodeDecodeError, AttributeError) as ex:
        avisos.append(f"{E.ARCHIVO_PARCELAS}: no se pudo leer ({type(ex).__name__}: {ex}); el resumen por zona va en null")
        return None
    zonas = {}
    for p in parcelas:
        props = (p or {}).get("properties") or {}
        if texto_lleno(props.get("id")):
            zonas[props["id"].strip()] = texto_lleno(props.get("zona")) or E.ZONA_POR_OMISION
    return zonas


# ---------------------------------------------------------------------------------------
# Perfil de suelo (suelo_parcelas.csv)
# ---------------------------------------------------------------------------------------
def resumen_por_zona(parcelas, decimales_ph, zona_de):
    """{zona: {n, clases: {clase: n}, ph: {min, mediana, max}}} con las parcelas del archivo. La mediana
    del pH lleva a lo más un decimal más que la entrega (el punto medio de dos valores)."""
    por_zona = {}
    for pid, perfil in parcelas.items():
        zona = zona_de.get(pid)
        if zona is not None:
            por_zona.setdefault(zona, []).append(perfil)
    resumen = {}
    for zona in sorted(por_zona):
        perfiles = por_zona[zona]
        cuenta = Counter(p["clase_textura"] for p in perfiles if p["clase_textura"])
        # En el orden de la lista de clases (la del contrato); una clase ajena iría al final.
        orden = [c for c in E.CLASES_TEXTURA if c in cuenta] + sorted(c for c in cuenta if c not in E.CLASES_TEXTURA)
        phs = sorted(p["ph"] for p in perfiles if p["ph"] is not None)
        if phs:
            mediana = round(statistics.median(phs), decimales_ph + 1)
            mediana = int(mediana) if float(mediana).is_integer() else mediana
        resumen[zona] = {
            "n": len(perfiles),
            "clases": {c: cuenta[c] for c in orden},
            "ph": {"min": phs[0], "mediana": mediana, "max": phs[-1]} if phs else None,
        }
    return resumen


def bloque_perfil(ruta, registro, zona_de, avisos):
    """El bloque «perfil»: una entrada por fila de suelo_parcelas.csv, con sus valores tal como llegan."""
    filas = leer_csv(ruta)
    parcelas, capas, decimales_ph = {}, {}, 0
    for fila in filas:
        pid = fila["id"].strip()
        perfil = {c: numero(fila[c]) for c in COLUMNAS_NUMERICAS[:3]}
        perfil["clase_textura"] = texto_lleno(fila["clase_textura"])
        perfil.update({c: numero(fila[c]) for c in COLUMNAS_NUMERICAS[3:]})
        celdas = numero(fila["n_celdas"])
        perfil["n_celdas"] = celdas if isinstance(celdas, int) else None
        parcelas[pid] = perfil
        capas[pid] = texto_lleno(fila["profundidad_cm"])
        decimales_ph = max(decimales_ph, decimales_de(fila["ph"]))
    distintas = {c for c in capas.values() if c}
    profundidad = distintas.pop() if len(distintas) == 1 and all(capas.values()) else None
    if profundidad is None and parcelas:
        avisos.append(f"{ARCHIVO_PERFIL}: las filas no traen todas la misma profundidad_cm; va en null y cada "
                      "parcela lleva la suya")
        for pid, perfil in parcelas.items():
            perfil["profundidad_cm"] = capas[pid]
    resumen = None
    if zona_de is not None:
        ajenas = sorted(pid for pid in parcelas if pid not in zona_de)
        if ajenas:
            avisos.append(f"{ARCHIVO_PERFIL}: parcelas que no están en {E.ARCHIVO_PARCELAS} y no entran al resumen "
                          f"por zona: {len(ajenas)} (p. ej. {', '.join(ajenas[:3])})")
        resumen = resumen_por_zona(parcelas, decimales_ph, zona_de)
    return {**registro, "profundidad_cm": profundidad, "parcelas": parcelas, "resumen_zona": resumen}


# ---------------------------------------------------------------------------------------
# Requisitos de cada cultivo (suelo_requisitos.json)
# ---------------------------------------------------------------------------------------
def bloque_requisitos(ruta, registro):
    """El contenido de suelo_requisitos.json tal cual, más de dónde llegó."""
    contenido = leer_json(ruta)
    if not isinstance(contenido, dict) or not isinstance(contenido.get("cultivos"), dict):
        raise ValueError(f"{ARCHIVO_REQUISITOS} no trae el objeto «cultivos»")
    return {**contenido, "entrega": registro}


def _par(v):
    """(min, max) de un par [min, max] con min ≤ max; None si no lo es."""
    if isinstance(v, list) and len(v) == 2 and finito(v[0]) is not None and finito(v[1]) is not None and v[0] <= v[1]:
        return v[0], v[1]
    return None


def _clases(v):
    """La lista si es una lista de textos; None si no."""
    return v if isinstance(v, list) and all(isinstance(c, str) for c in v) else None


def normalizar_requisitos(cultivos, avisos):
    """{cultivo: {"ph", "textura", "salinidad_umbral_ds_m", "nutrientes"}} listo para comparar. El archivo
    ya pasó el validador del buzón (motor/ensamblar.py, regla suelo_requisitos); aquí solo se protege al
    motor: un bloque que no tenga la forma del contrato se deja en None (no cuenta) y se avisa. Ningún
    valor se cambia ni se completa."""
    listos = {}
    for cultivo, req in cultivos.items():
        if not isinstance(req, dict):
            avisos.append(f"{ARCHIVO_REQUISITOS}: los requisitos de «{cultivo}» no son un objeto; no se usan")
            continue
        ph = req.get("ph")
        if isinstance(ph, dict):
            optimo, tolerado = _par(ph.get("optimo")), _par(ph.get("tolerado"))
            ph = {"optimo": optimo, "tolerado": tolerado, "fuente": texto_lleno(ph.get("fuente"))} \
                if optimo and tolerado and tolerado[0] <= optimo[0] and optimo[1] <= tolerado[1] else False
        textura = req.get("textura")
        if isinstance(textura, dict):
            apta, limitante = _clases(textura.get("apta")), _clases(textura.get("limitante"))
            textura = {"apta": apta, "limitante": limitante, "fuente": texto_lleno(textura.get("fuente"))} \
                if apta is not None and limitante is not None and not set(apta) & set(limitante) else False
        salinidad = req.get("salinidad_umbral_ds_m")
        if isinstance(salinidad, dict):
            valor = finito(salinidad.get("valor"))
            salinidad = {"valor": valor, "fuente": texto_lleno(salinidad.get("fuente"))} if valor is not None else False
        bloques = {"ph": ph, "textura": textura, "salinidad_umbral_ds_m": salinidad}
        for nombre, bloque in bloques.items():
            if bloque is False or (bloque is not None and not isinstance(bloque, dict)):
                avisos.append(f"{ARCHIVO_REQUISITOS}: «{cultivo}».{nombre} no tiene la forma del contrato; no cuenta")
                bloques[nombre] = None
        nutrientes = []
        for nut in req.get("nutrientes") or []:
            cond = nut.get("condicion") if isinstance(nut, dict) else None
            if not isinstance(nut, dict) or (cond is not None and not isinstance(cond, dict)) \
                    or any(k not in E.CONDICIONES_NUTRIENTE for k in (cond or {})):
                avisos.append(f"{ARCHIVO_REQUISITOS}: un aviso de nutrientes de «{cultivo}» no tiene la forma del "
                              "contrato; no se usa")
                continue
            nutrientes.append(nut)
        listos[cultivo] = {**bloques, "nutrientes": nutrientes}
    return listos


# ---------------------------------------------------------------------------------------
# Aptitud (las reglas del encabezado)
# ---------------------------------------------------------------------------------------
def peor(estados):
    """El peor de varios estados de aptitud; no_published_range si no hay ninguno en la escala."""
    en_escala = [e for e in estados if e in SEVERIDAD]
    return max(en_escala, key=SEVERIDAD.index) if en_escala else SIN_RANGO


def criterio_ph(perfil, bloque, margen=None):
    """Motivo del pH, o None si no cuenta (sin pH de la parcela o sin rango publicado). `margen` (número o
    None): fuera del tolerado por menos que el margen → near_limit; sin margen no existe ese estado."""
    ph = finito(perfil.get("ph"))
    if ph is None or not bloque:
        return None
    optimo, tolerado = bloque["optimo"], bloque["tolerado"]
    if optimo[0] <= ph <= optimo[1]:
        estado = FITS
    elif tolerado[0] <= ph <= tolerado[1]:
        estado = TOLERATED
    else:
        distancia = round(tolerado[0] - ph if ph < tolerado[0] else ph - tolerado[1], DECIMALES_DISTANCIA)
        estado = NEAR if finito(margen) is not None and distancia < margen else OUTSIDE
    return {"criterio": CRITERIO_PH, "estado": estado, "valor_parcela": ph,
            "rango_o_lista": {"optimo": list(optimo), "tolerado": list(tolerado)}, "fuente": bloque["fuente"]}


def criterio_textura(perfil, bloque):
    """Motivo de la textura, o None si no cuenta (sin clase de la parcela o sin listas publicadas)."""
    clase = texto_lleno(perfil.get("clase_textura"))
    if clase is None or not bloque:
        return None
    if clase in bloque["apta"]:
        estado = FITS
    elif clase in bloque["limitante"]:
        estado = OUTSIDE
    else:
        estado = TOLERATED
    return {"criterio": CRITERIO_TEXTURA, "estado": estado, "valor_parcela": clase,
            "rango_o_lista": {"apta": list(bloque["apta"]), "limitante": list(bloque["limitante"])},
            "fuente": bloque["fuente"]}


def criterio_salinidad(perfil, bloque):
    """Motivo de la salinidad, o None si no cuenta: solo se evalúa si la parcela trae conductividad
    eléctrica y el cultivo trae umbral."""
    ce = finito(perfil.get("salinidad_ce_ds_m"))
    if ce is None or not bloque:
        return None
    return {"criterio": CRITERIO_SALINIDAD, "estado": FITS if ce <= bloque["valor"] else OUTSIDE, "valor_parcela": ce,
            "rango_o_lista": {"umbral_ds_m": bloque["valor"]}, "fuente": bloque["fuente"]}


CRITERIOS = ((CRITERIO_PH, criterio_ph), (CRITERIO_TEXTURA, criterio_textura), (CRITERIO_SALINIDAD, criterio_salinidad))


def aptitud_de_cultivo(cultivo, perfil, requisitos, margen_ph=None):
    """{cultivo, estado, nota, motivos, sin_dato_de_parcela} de UN cultivo en el suelo de UNA parcela.
    `requisitos` es la salida de normalizar_requisitos; `margen_ph`, el de supuestos.json (o None)."""
    if cultivo == E.NO_SIEMBRA:
        return {"cultivo": cultivo, "estado": SIN_RANGO, "nota": NOTA_NO_SIEMBRA, "motivos": [], "sin_dato_de_parcela": []}
    req = requisitos.get(cultivo)
    if req is None:
        return {"cultivo": cultivo, "estado": SIN_RANGO, "nota": NOTA_SIN_RANGO, "motivos": [], "sin_dato_de_parcela": []}
    motivos, sin_dato = [], []
    for criterio, comparar in CRITERIOS:
        bloque = req[BLOQUE_DE[criterio]]
        motivo = comparar(perfil, bloque, margen_ph) if criterio == CRITERIO_PH else comparar(perfil, bloque)
        if motivo is not None:
            motivos.append(motivo)
        elif bloque:
            sin_dato.append(criterio)   # hay rango publicado, pero la parcela no trae ese valor
    nota = None if motivos else (NOTA_SIN_VALOR if sin_dato else NOTA_SIN_RANGO)
    return {"cultivo": cultivo, "estado": peor(m["estado"] for m in motivos), "nota": nota, "motivos": motivos,
            "sin_dato_de_parcela": sin_dato}


def condicion_cumplida(condicion, perfil):
    """True si el perfil de la parcela cumple la condición de un aviso de nutrientes (sin condición →
    siempre). Si la condición pide un valor que la parcela no trae, no se cumple: no se supone nada."""
    if not condicion:
        return True
    ph = finito(perfil.get("ph"))
    if "ph_mayor_que" in condicion and not (ph is not None and ph > condicion["ph_mayor_que"]):
        return False
    if "ph_menor_que" in condicion and not (ph is not None and ph < condicion["ph_menor_que"]):
        return False
    if "textura_en" in condicion and perfil.get("clase_textura") not in condicion["textura_en"]:
        return False
    return True


def aptitud_de_opcion(secuencia, perfil, requisitos, margen_ph=None):
    """{estado, nota, por_cultivo, avisos_nutrientes} de UNA opción (su secuencia de cultivos) en el
    suelo de UNA parcela."""
    cultivos = list(dict.fromkeys(c.strip() for c in secuencia or [] if isinstance(c, str) and c.strip()))
    por_cultivo = [aptitud_de_cultivo(c, perfil, requisitos, margen_ph) for c in cultivos]
    sembrados = [c for c in cultivos if c != E.NO_SIEMBRA]
    avisos = []
    for cultivo in sembrados:
        for nut in (requisitos.get(cultivo) or {}).get("nutrientes", []):
            if condicion_cumplida(nut.get("condicion"), perfil):
                avisos.append({"elemento": nut.get("elemento"), "texto_en": nut.get("texto_en"),
                               "fuente": nut.get("fuente"), "cultivo": cultivo})
    return {
        "estado": peor(c["estado"] for c in por_cultivo),
        "nota": None if sembrados else NOTA_NO_SIEMBRA,
        "por_cultivo": por_cultivo,
        "avisos_nutrientes": avisos,
    }


def perfil_vacio(perfil):
    """True si la fila de la parcela no trae ningún valor de suelo (el mapa no la cubre)."""
    return all(perfil.get(c) is None for c in (*COLUMNAS_NUMERICAS, "clase_textura"))


def bloque_aptitud(perfil, requisitos, cubo, avisos, margen_ph=None):
    """{id_parcela: {id_opcion: aptitud}} de las parcelas con perfil y con opciones en el cubo. Una parcela
    con la fila vacía (perfil_vacio) no entra: no hay nada que comparar."""
    listos = normalizar_requisitos(requisitos["cultivos"], avisos)
    aptitud, sin_perfil, vacias, en_secuencias = {}, 0, 0, set()
    for pid, parcela in ((cubo or {}).get("parcelas") or {}).items():
        opciones = [o for o in (parcela or {}).get("opciones") or [] if isinstance(o, dict) and texto_lleno(o.get("id"))]
        if not opciones:
            continue
        for o in opciones:
            en_secuencias.update(c for c in o.get("secuencia") or [] if isinstance(c, str) and c != E.NO_SIEMBRA)
        suelo = perfil["parcelas"].get(pid)
        if suelo is None:
            sin_perfil += 1
            continue
        if perfil_vacio(suelo):
            vacias += 1
            continue
        aptitud[pid] = {o["id"]: aptitud_de_opcion(o.get("secuencia"), suelo, listos, margen_ph) for o in opciones}
    if sin_perfil:
        avisos.append(f"parcelas con opciones en el cubo y sin fila en {ARCHIVO_PERFIL} (van sin aptitud): {sin_perfil}")
    if vacias:
        avisos.append(f"parcelas con opciones en el cubo y con su fila de {ARCHIVO_PERFIL} sin ningún valor de suelo "
                      f"(van sin aptitud): {vacias}")
    sin_requisitos = sorted(en_secuencias - set(listos))
    if sin_requisitos:
        avisos.append(f"{ARCHIVO_REQUISITOS} no trae requisitos de: {', '.join(sin_requisitos)}; su aptitud queda en "
                      f"«{SIN_RANGO}»")
    sin_uso = sorted(set(listos) - en_secuencias)
    if sin_uso:
        avisos.append(f"{ARCHIVO_REQUISITOS} trae requisitos de cultivos que ninguna opción del cubo siembra: "
                      f"{', '.join(sin_uso)}")
    fuera_de_lista = sorted(en_secuencias - set(E.CULTIVOS_SUELO))
    if fuera_de_lista:
        avisos.append(f"las secuencias del cubo nombran cultivos que el validador aún no admite en {ARCHIVO_REQUISITOS}: "
                      f"{', '.join(fuera_de_lista)} (agréguelos a esquemas.CULTIVOS_DE_SECUENCIAS)")
    return aptitud


def supuesto(processed, llave, avisos):
    """{valor, etiqueta, fuente, archivo} de data/processed/supuestos.json → <llave>, o None si el archivo o la
    llave faltan o el valor no es un número con fuente (no se inventa ni se completa)."""
    ruta = Path(processed) / ARCHIVO_SUPUESTOS
    if not ruta.is_file():
        return None
    try:
        d = leer_json(ruta).get(llave)
    except (json.JSONDecodeError, UnicodeDecodeError, AttributeError) as ex:
        avisos.append(f"{ARCHIVO_SUPUESTOS}: no se pudo leer ({type(ex).__name__}: {ex}); {llave} va en null")
        return None
    if d is None:
        return None
    valor = finito(d.get("valor")) if isinstance(d, dict) else None
    if valor is None or not texto_lleno(d.get("fuente")):
        avisos.append(f"{ARCHIVO_SUPUESTOS}: {llave} no trae un número con fuente; va en null")
        return None
    return {"valor": valor, "etiqueta": texto_lleno(d.get("etiqueta")), "fuente": d["fuente"],
            "archivo": f"data/processed/{ARCHIVO_SUPUESTOS}"}


def alcalinidad_por_zona(perfil, requisitos, zona_de, avisos):
    """{zona: {n_con_ph, n_sobre_optimo, n_cultivos, cultivos, mayoria}} (ver el encabezado): una parcela cuenta
    si su pH queda por encima del óptimo de MÁS de la mitad de los cultivos con rango de pH publicado; la zona
    da su mensaje si esas parcelas son MÁS de la mitad de las suyas con pH. None si no hay con qué contar."""
    if perfil is None or requisitos is None or zona_de is None:
        return None
    listos = normalizar_requisitos(requisitos.get("cultivos") or {}, [])
    techos = {c: r["ph"]["optimo"][1] for c, r in sorted(listos.items()) if r.get("ph")}
    if not techos:
        avisos.append(f"{ARCHIVO_REQUISITOS} no trae ningún rango de pH: alcalinidad_zona va en null")
        return None
    por_zona = {}
    for pid, p in perfil["parcelas"].items():
        zona, ph = zona_de.get(pid), finito(p.get("ph"))
        if zona is None or ph is None:
            continue
        z = por_zona.setdefault(zona, {"n_con_ph": 0, "n_sobre_optimo": 0})
        z["n_con_ph"] += 1
        if 2 * sum(1 for techo in techos.values() if ph > techo) > len(techos):
            z["n_sobre_optimo"] += 1
    return {zona: {**z, "n_cultivos": len(techos), "cultivos": list(techos),
                   "mayoria": 2 * z["n_sobre_optimo"] > z["n_con_ph"]}
            for zona, z in sorted(por_zona.items())}


# ---------------------------------------------------------------------------------------
# Tipo de suelo (tipo_suelo_parcelas.csv + suelo_tipos.json) y notas de nutrientes
# (suelo_nutrientes_parcelas.csv + suelo_reglas.json); ver el encabezado
# ---------------------------------------------------------------------------------------
def lista_celda(texto):
    """Celda «P;B;Zn» como lista, en el orden de la entrega; [] si está vacía."""
    return [x.strip() for x in (texto or "").split(E.SEPARADOR_LISTA) if x.strip()]


def lista_en(nombres):
    """«boron», «boron and zinc», «boron, copper and zinc» (para el marcador {nutrientes} o {lista})."""
    nombres = [str(n) for n in nombres]
    return nombres[0] if len(nombres) == 1 else f"{', '.join(nombres[:-1])} and {nombres[-1]}"


def llenar(plantilla, avisos, donde, **valores):
    """La plantilla de textos_ficha_en con sus {marcadores} llenos; None (y un aviso) si no hay plantilla o si
    queda algún marcador sin dato. No se completa nada a mano."""
    if not texto_lleno(plantilla):
        return None
    texto = plantilla
    for llave, valor in valores.items():
        texto = texto.replace("{" + llave + "}", str(valor))
    if MARCADOR.search(texto):
        avisos.append(f"{ARCHIVO_REGLAS}: el texto de {donde} trae un marcador sin dato ({texto}); va en null")
        return None
    return texto


def texto_de(textos, *ruta):
    """textos_ficha_en → <ruta> → texto_en, o None si falta algún tramo."""
    d = textos
    for parte in ruta:
        d = d.get(parte) if isinstance(d, dict) else None
    return texto_lleno((d or {}).get("texto_en")) if isinstance(d, dict) else None


def leer_reglas(processed, avisos):
    """suelo_reglas.json, o None si no llegó o no se pudo leer (con aviso)."""
    ruta = Path(processed) / ARCHIVO_REGLAS
    if not ruta.is_file():
        return None
    try:
        reglas = leer_json(ruta)
    except (json.JSONDecodeError, UnicodeDecodeError) as ex:
        avisos.append(f"{ARCHIVO_REGLAS}: no se pudo leer ({type(ex).__name__}: {ex})")
        return None
    return reglas if isinstance(reglas, dict) else None


def resolucion_del_mapa(registradas, avisos):
    """{valor, archivo, fuente} con la resolución del mapa de suelo (suelo_parcelas.csv, de donde salen las notas)
    leída de su línea de fuente; None si la línea no está o no trae UNA sola resolución."""
    fuente = (registradas.get(ARCHIVO_PERFIL) or {}).get("fuente") or ""
    valores = {int(m) for m in RESOLUCION_EN_FUENTE.findall(fuente)}
    if len(valores) != 1:
        if fuente:
            avisos.append(f"{ARCHIVO_PERFIL}: su línea de fuente no trae una sola resolución en metros; la ficha no la dice")
        return None
    return {"valor": valores.pop(), "archivo": ARCHIVO_PERFIL, "fuente": fuente}


def nota(caso, estado, elementos, texto):
    return {"caso": caso, "estado": estado, "elementos": list(elementos), "texto_en": texto, "fuente": FUENTE_DISPONIBILIDAD}


def notas_de_fila(fila, textos, nombres, ph_toxico, avisos):
    """Las notas de UNA parcela (reglas del encabezado), con los textos de textos_ficha_en."""
    suelo = (textos or {}).get("suelo") or {}
    nombrar = lambda simbolos: lista_en([nombres.get(s, s) for s in simbolos])  # noqa: E731
    menos, cerca = lista_celda(fila.get("menos_disponibles")), lista_celda(fila.get("cerca_del_limite"))
    toxicos = lista_celda(fila.get("toxicidad_posible"))
    notas = []
    if menos:
        notas.append(nota("menos_disponibles", NOTA_MENOS, menos,
                          llenar(texto_de(suelo, "menos_disponibles"), avisos, "menos_disponibles", nutrientes=nombrar(menos))))
        if HIERRO in menos and texto_de(suelo, "hierro"):
            notas.append(nota("hierro", NOTA_MENOS, [HIERRO], texto_de(suelo, "hierro")))
    a_la_vista = [s for s in cerca if s not in NO_MOSTRAR_CERCA]
    if a_la_vista:
        notas.append(nota("cerca_del_limite", NOTA_CERCA, a_la_vista,
                          llenar(texto_de(suelo, "cerca_del_limite"), avisos, "cerca_del_limite", nutrientes=nombrar(a_la_vista))))
    if toxicos:
        valores = {"ph_toxico": ph_toxico} if ph_toxico is not None else {}
        notas.append(nota("toxicidad", NOTA_TOXICIDAD, toxicos, llenar(texto_de(suelo, "toxicidad"), avisos, "toxicidad", **valores)))
    if not menos and not cerca:
        notas.append(nota("sin_aviso_ph", NOTA_EN_RANGO, [], texto_de(suelo, "sin_aviso_ph")))
    # Una nota sin texto (la entrega no trae ese caso) no se muestra: no se inventa ninguna frase.
    return [n for n in notas if n["texto_en"]]


def bloque_nutrientes(ruta, registro, reglas, registradas, avisos):
    """El bloque «nutrientes»: las notas de cada fila de suelo_nutrientes_parcelas.csv."""
    if reglas is None:
        raise ValueError(f"falta {ARCHIVO_REGLAS}")
    textos = reglas.get("textos_ficha_en") or {}
    disponibilidad = reglas.get("disponibilidad_ph") or {}
    nombres = {k: v for k, v in (textos.get("nombres_nutrientes_en") or {}).items() if texto_lleno(v)}
    ph_toxico = finito((disponibilidad.get("toxicidad_ph_menor_que") or {}).get("valor"))
    sin_dato = texto_de(textos.get("suelo") or {}, "sin_dato")
    # Casi todas las parcelas comparten las mismas listas: cada combinación se escribe una vez en «conjuntos» y la
    # parcela lleva su llave (las listas tal como llegan, «B;Cu;Fe;Mn;Ni;Zn|P|»). Así suelo.json no repite el mismo
    # texto en cada parcela.
    parcelas, conjuntos = {}, {}
    for fila in leer_csv(ruta):
        pid = fila["id"].strip()
        if numero(fila.get("ph")) is None:
            llave = LLAVE_SIN_DATO
            conjuntos.setdefault(llave, {"notas": [], "sin_dato_en": sin_dato})
        else:
            llave = "|".join(E.SEPARADOR_LISTA.join(lista_celda(fila.get(c))) for c in COLUMNAS_LISTAS)
            if llave not in conjuntos:
                conjuntos[llave] = {"notas": notas_de_fila(fila, textos, nombres, ph_toxico, avisos)}
        parcelas[pid] = llave
    usados = sorted({s for c in conjuntos.values() for n in c["notas"] for s in n["elementos"]})
    sin_nombre = [s for s in usados if s not in nombres]
    if sin_nombre:
        avisos.append(f"{ARCHIVO_REGLAS}: textos_ficha_en.nombres_nutrientes_en no nombra {', '.join(sin_nombre)}; "
                      "va el símbolo")
    return {
        **registro,
        "reglas": procedencia(ARCHIVO_REGLAS, registradas),
        "aviso_en": texto_de(textos.get("suelo") or {}, "aviso") or texto_lleno(reglas.get("texto_aviso_en")),
        "resolucion_m": resolucion_del_mapa(registradas, avisos),
        "nombres_en": {s: nombres[s] for s in usados if s in nombres},
        "fuentes": {FUENTE_DISPONIBILIDAD: {"fuente": texto_lleno(disponibilidad.get("fuente")),
                                            "etiqueta": texto_lleno(disponibilidad.get("etiqueta"))}},
        "conjuntos": conjuntos,
        "parcelas": parcelas,
    }


def leer_catalogo(processed, avisos):
    """suelo_tipos.json, o None si no llegó o no se pudo leer (con aviso)."""
    ruta = Path(processed) / ARCHIVO_CATALOGO
    if not ruta.is_file():
        return None
    try:
        catalogo = leer_json(ruta)
    except (json.JSONDecodeError, UnicodeDecodeError) as ex:
        avisos.append(f"{ARCHIVO_CATALOGO}: no se pudo leer ({type(ex).__name__}: {ex})")
        return None
    return catalogo if isinstance(catalogo, dict) else None


def suelos_del_municipio(catalogo, zona, plantilla, avisos):
    """{texto_en, suelos: [{grupo, pct}], fuente, etiqueta} de la zona (INEGI, del catálogo), o None. Los nombres
    son los grupos de la WRB del catálogo (por su nombre_es); lo que no es un grupo (zona urbana, cuerpo de agua) no
    es un suelo y no entra a la lista."""
    llave = LISTA_MUNICIPIO_DE_ZONA.get(zona)
    bloque = (catalogo or {}).get("zona") or {}
    pct = bloque.get(llave) if llave else None
    if not isinstance(pct, dict):
        return None
    grupo_de = {texto_lleno(g.get("nombre_es")): k for k, g in (catalogo.get("wrb") or {}).items() if isinstance(g, dict)}
    suelos, fuera = [], []
    for nombre, valor in pct.items():
        if nombre in grupo_de and finito(valor) is not None:
            suelos.append({"grupo": grupo_de[nombre], "pct": valor})
        else:
            fuera.append(nombre)
    if fuera:
        avisos.append(f"{ARCHIVO_CATALOGO}: zona.{llave} trae {', '.join(fuera)}, que no son grupos de suelo de la WRB del "
                      "catálogo; no van en la lista de suelos del municipio")
    suelos.sort(key=lambda s: -s["pct"])
    texto = llenar(plantilla, avisos, "tipo_suelo.zona", lista=", ".join(f"{s['grupo']} {s['pct']}%" for s in suelos)) \
        if suelos else None
    return {"texto_en": texto, "suelos": suelos, "fuente": texto_lleno(bloque.get("fuente")),
            "etiqueta": texto_lleno(bloque.get("etiqueta"))}


def bloque_tipo(ruta, registro, catalogo, reglas, registradas, avisos):
    """El bloque «tipo_suelo»: el gran grupo USDA de cada fila de tipo_suelo_parcelas.csv con su descripción. Lo que
    depende solo del gran grupo (orden, elementos, descripción y texto) va una vez en «grupos»; cada parcela lleva su
    gran grupo y su zona."""
    textos = ((reglas or {}).get("textos_ficha_en") or {}).get("tipo_suelo") or {}
    ordenes_cat = (catalogo or {}).get("usda_ordenes") or {}
    prefijos_cat = (catalogo or {}).get("usda_prefijos_gran_grupo") or {}
    parcelas, grupos, ordenes, elementos, zonas, sin_grupo, desconocidos = {}, {}, {}, {}, set(), [], set()
    for fila in leer_csv(ruta):
        pid, grupo, orden = fila["id"].strip(), texto_lleno(fila.get("gran_grupo_usda")), texto_lleno(fila.get("orden_usda"))
        if grupo is None:
            sin_grupo.append(pid)
            continue
        zona = texto_lleno(fila.get("zona"))
        zonas.add(zona)
        parcelas[pid] = {"gran_grupo": grupo, "zona": zona}
        celda = lista_celda(fila.get("elementos"))
        if grupo in grupos:
            if (grupos[grupo]["orden"], grupos[grupo]["elementos_entrega"]) != (orden, celda):
                avisos.append(f"{ARCHIVO_TIPO}: {grupo} llega con otro orden o con otros elementos en {pid}; vale el primero")
            continue
        propios = []
        for e in celda:
            if isinstance(prefijos_cat.get(e), dict):
                propios.append(e)
                elementos[e] = prefijos_cat[e]
            else:
                desconocidos.add(e)
        cat_orden = ordenes_cat.get(orden) if isinstance(ordenes_cat.get(orden), dict) else None
        if cat_orden:
            ordenes[orden] = cat_orden
        grupos[grupo] = {
            "orden": orden, "elementos": propios, "elementos_entrega": celda,
            "descripcion_en": texto_lleno((cat_orden or {}).get("definicion_en")),
            "texto_en": llenar(texto_de(textos, "parcela"), avisos, "tipo_suelo.parcela", gran_grupo=grupo, orden=orden)
            if orden else None,
        }
    for g in grupos.values():
        g.pop("elementos_entrega")
    if sin_grupo:
        avisos.append(f"{ARCHIVO_TIPO}: parcelas sin gran grupo (la ficha dice que el mapa no lo trae): {len(sin_grupo)}")
    if desconocidos and catalogo is not None:
        avisos.append(f"{ARCHIVO_TIPO}: elementos que el catálogo no describe: {', '.join(sorted(desconocidos))}")
    con_lista = {z: suelos_del_municipio(catalogo, z, texto_de(textos, "zona"), avisos) for z in sorted(zonas, key=str)}
    return {
        **registro,
        "catalogo": procedencia(ARCHIVO_CATALOGO, registradas) if catalogo is not None else None,
        "explica_en": texto_de(textos, "explica") or texto_lleno((catalogo or {}).get("texto_explica_en")),
        "no_coinciden_en": texto_de(textos, "no_coinciden"),
        "ordenes": {o: {"definicion_en": texto_lleno(d.get("definicion_en")), "fertilidad_en": texto_lleno(d.get("fertilidad_en")),
                        "fuente": texto_lleno(d.get("fuente")), "etiqueta": texto_lleno(d.get("etiqueta"))}
                    for o, d in sorted(ordenes.items())},
        "elementos": {e: {"significado_en": texto_lleno(d.get("significado_en")), "fuente": texto_lleno(d.get("fuente")),
                          "etiqueta": texto_lleno(d.get("etiqueta"))} for e, d in sorted(elementos.items())},
        "zonas": {z: b for z, b in con_lista.items() if b},
        "grupos": dict(sorted(grupos.items())),
        "parcelas": parcelas,
    }


# ---------------------------------------------------------------------------------------
# Armado
# ---------------------------------------------------------------------------------------
ERRORES_DE_LECTURA = (KeyError, ValueError, TypeError, AttributeError, csv.Error, json.JSONDecodeError, UnicodeDecodeError)


def armar(processed, cubo, generado=None):
    """(suelo, avisos) con lo que hay en `processed` y las opciones de `cubo` (contenido de cubo.json o
    None). No escribe nada."""
    processed = Path(processed)
    avisos = []
    registradas = fuentes_registradas(processed)
    suelo = {
        "_encabezado": ENCABEZADO,
        "_nota": ("Lo escribe motor/suelo_web.py con las entregas validadas de data/processed y las opciones de "
                  "cubo.json; no se edita a mano. Un bloque en null lleva su motivo en «<bloque>_motivo»."),
        "generado": generado or datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "decision": DECISION,
        "rotulo": ROTULO,
        "rotulo_aptitud": ROTULO_APTITUD,
        "motivo_pedido": MOTIVO_PEDIDO,
        "idioma_fuentes": IDIOMA_FUENTES,
        "margen_ph": supuesto(processed, SUPUESTO_MARGEN_PH, avisos),
        "coincidencia_textura": supuesto(processed, SUPUESTO_COINCIDENCIA, avisos),
    }
    faltan = []

    def bloque_opcional(nombre, archivo, leer):
        """Bloque de una entrega: null + motivo si no llegó o no se pudo leer; nunca se rellena."""
        ruta = processed / archivo
        if not ruta.is_file():
            suelo[nombre], suelo[f"{nombre}_motivo"] = None, MOTIVO_PEDIDO
            faltan.append(archivo)
            return None
        try:
            valor = leer(ruta, procedencia(archivo, registradas))
        except ERRORES_DE_LECTURA as ex:
            avisos.append(f"{archivo}: no se pudo leer ({type(ex).__name__}: {ex}); el bloque «{nombre}» va en null")
            suelo[nombre], suelo[f"{nombre}_motivo"] = None, MOTIVO_ILEGIBLE
            return None
        suelo[nombre], suelo[f"{nombre}_motivo"] = valor, None
        return valor

    zona_de = {}
    perfil = bloque_opcional("perfil", ARCHIVO_PERFIL, lambda ruta, registro: bloque_perfil(
        ruta, registro, zona_de.setdefault("z", zonas_de_parcelas(processed, avisos)), avisos))
    requisitos = bloque_opcional("requisitos", ARCHIVO_REQUISITOS, bloque_requisitos)
    suelo["alcalinidad_zona"] = alcalinidad_por_zona(perfil, requisitos, zona_de.get("z"), avisos)
    margen = (suelo["margen_ph"] or {}).get("valor")

    suelo["aptitud"], suelo["aptitud_falta"] = None, faltan
    if perfil is None or requisitos is None:
        # Falta una entrega (se pidió y no ha llegado) o llegó y no se pudo leer.
        suelo["aptitud_motivo"] = MOTIVO_PEDIDO if faltan else MOTIVO_ILEGIBLE
    elif not isinstance(cubo, dict) or not isinstance(cubo.get("parcelas"), dict):
        suelo["aptitud_motivo"] = MOTIVO_SIN_CUBO
        avisos.append(f"{NOMBRE_CUBO} no está o no trae «parcelas»: la aptitud va en null (corra antes motor/b4_cubo.py)")
    else:
        try:
            suelo["aptitud"], suelo["aptitud_motivo"] = bloque_aptitud(perfil, requisitos, cubo, avisos, margen), None
        except ERRORES_DE_LECTURA as ex:
            avisos.append(f"aptitud: no se pudo calcular ({type(ex).__name__}: {ex}); va en null")
            suelo["aptitud"], suelo["aptitud_motivo"] = None, MOTIVO_ILEGIBLE

    # Tipo de suelo (B8) y notas de nutrientes (B7). Las notas necesitan los textos de suelo_reglas.json: sin él,
    # el bloque va en null como pedido y no entregado.
    # (aptitud_falta se queda con lo que le falta a la aptitud: lo que falte de aquí no entra.)
    suelo["aptitud_falta"] = list(faltan)
    reglas, catalogo = leer_reglas(processed, avisos), leer_catalogo(processed, avisos)
    bloque_opcional("tipo_suelo", ARCHIVO_TIPO, lambda ruta, registro: bloque_tipo(
        ruta, registro, catalogo, reglas, registradas, avisos))
    if reglas is None:
        suelo["nutrientes"], suelo["nutrientes_motivo"] = None, MOTIVO_PEDIDO
    else:
        bloque_opcional("nutrientes", ARCHIVO_NUTRIENTES, lambda ruta, registro: bloque_nutrientes(
            ruta, registro, reglas, registradas, avisos))
    suelo["avisos"] = avisos
    return suelo, avisos


def volcar(suelo):
    """JSON con una llave de primer nivel por renglón y cada bloque compacto (la aptitud repite las
    fuentes en cada motivo: así pesa menos). allow_nan=False: un NaN o un infinito falla aquí y no
    llega a la página."""
    renglones = [f" {json.dumps(k, ensure_ascii=False)}: "
                 f"{json.dumps(v, ensure_ascii=False, separators=(',', ':'), allow_nan=False)}"
                 for k, v in suelo.items()]
    return "{\n" + ",\n".join(renglones) + "\n}\n"


def construir(processed=RAIZ / "data/processed", web=RAIZ / "web/data", cubo_ruta=None, generado=None):
    """Escribe <web>/suelo.json con lo que hay en `processed` y las opciones del cubo. Devuelve un resumen."""
    processed, web = Path(processed), Path(web)
    cubo_ruta = Path(cubo_ruta) if cubo_ruta else web / NOMBRE_CUBO
    cubo, avisos_cubo = None, []
    if cubo_ruta.is_file():
        try:
            cubo = leer_json(cubo_ruta)
        except (json.JSONDecodeError, UnicodeDecodeError) as ex:
            avisos_cubo.append(f"{cubo_ruta.name}: no se pudo leer ({type(ex).__name__}: {ex})")
    suelo, avisos = armar(processed, cubo, generado=generado)
    avisos[:0] = avisos_cubo
    web.mkdir(parents=True, exist_ok=True)
    salida = web / NOMBRE_SALIDA
    salida.write_text(volcar(suelo), encoding="utf-8")
    opciones = [o for parcela in (suelo["aptitud"] or {}).values() for o in parcela.values()]
    return {
        "ejecutado": True,
        "salida": str(salida),
        "bloques": {b: suelo[b] is not None for b in ("perfil", "requisitos", "aptitud")},
        "parcelas_con_perfil": len(suelo["perfil"]["parcelas"]) if suelo["perfil"] else 0,
        "opciones_evaluadas": len(opciones),
        "estados": {e: n for e, n in ((e, sum(1 for o in opciones if o["estado"] == e)) for e in ESTADOS) if n},
        "avisos": avisos,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Escribe web/data/suelo.json (perfil de suelo y aptitud de cada opción).")
    ap.add_argument("--processed", default=str(RAIZ / "data/processed"), help="entregas validadas")
    ap.add_argument("--web", default=str(RAIZ / "web/data"), help="carpeta de salida")
    ap.add_argument("--cubo", default=None, help="cubo.json con las opciones (por omisión, <web>/cubo.json)")
    args = ap.parse_args(argv)
    resumen = construir(processed=args.processed, web=args.web, cubo_ruta=args.cubo)
    print(json.dumps(resumen, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
