#!/usr/bin/env python3
# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Bases de datos del reto para la web: escribe web/data/contexto.json.

Decisión: docs/decisiones/2026-11-14_recursos_del_reto.md (papel de cada base de datos del reto y
contrato de las entregas nuevas). Nada de esto cambia el cálculo del agua de la parcela (cubo,
kit §2): entra como estado observado, contraste o evidencia, cada cosa con su resolución y su fuente.

API (el integrador la conecta a construir.py; este módulo no depende de ningún otro motor):
    construir(processed=data/processed, web=web/data, params_ruta=data/params.json,
              recursos_ruta=data/recursos_reto.json) -> dict
        Lee las entregas YA validadas de `processed` (motor/ensamblar.py) y escribe
        `web`/contexto.json. Devuelve {"ejecutado": True, "salida": ruta, "bloques": {nombre: bool},
        "recursos": {estado: n}, "avisos": [...]}. No modifica nada más.
    armar(processed, params, catalogo) -> (contexto, avisos)
        Lo mismo sin escribir (para las pruebas).
CLI:
    python motor/contexto_web.py [--processed DIR] [--web DIR] [--params RUTA] [--recursos RUTA]

Contenido de contexto.json (lo lee web/js/contexto.js; toda cifra de la página sale de aquí):
  _encabezado, generado (fecha y hora UTC), decision
  zonas            {id: {"nombre"}} de data/params.json → zona_piloto.zonas
  motivo_pedido    el texto común de lo pedido y aún no entregado
  idioma_fuentes   idioma de los textos de «fuente» (las líneas de LEEME.md del buzón), para que la
                   página los marque con su atributo «lang»
  recursos         uno por renglón de data/recursos_reto.json: id, nombre, organismo, papel, aplica,
                   estado («in_use» si AL MENOS UNA de sus entregas está en processed; «requested» si
                   aplica y no hay ninguna; «not_applicable»), entregas_presentes, entregas_faltantes,
                   motivo, equivalente_local, fuentes [{archivo, fuente, fecha}] (de fuentes.json), fecha
                   y fuente_contexto (su valor de «fuente» en contexto_regional.csv, o null)
  clima_anual      {zona: {definicion_anio, definicion_helada, umbral_faltantes, anios: [{anio,
                   lluvia_imerg_mm, lluvia_power_mm, eto_mm, dias_helada, dias_con_dato,
                   dias_con_dato_imerg, dias_del_anio}], fuentes: {power, imerg}}}
                   calculado de eto_diaria[_zona].csv (NASA POWER) e imerg_diaria[_zona].csv.
  contexto_regional  null + contexto_regional_motivo, o {zona: {"fuente.variable": {fuente_id,
                   variable, ambito, unidad, unidad_en, estadistica, unidad_anual_en, resolucion_m,
                   n_celdas, archivo, fuente, fecha, meses, valores, anual: [{anio, media, n_meses,
                   suma, completo}]}}}. GRACE llega como UNA serie de cuenca (nota de GRACE de la
                   decisión): va bajo la llave «cuenca» (esquemas.ZONA_CUENCA) con ambito «cuenca», y
                   la página la muestra igual en las dos zonas; las demás series llevan ambito «zona».
  gedi             null + gedi_motivo, o {archivo, fuente, fecha, parcelas: {id: {n_disparos,
                   altura_mediana_m, altura_p90_m}} (solo n_disparos > 0), n_con_dato, n_total,
                   referencia: {n_parcelas, minimo_m, mediana_m, maximo_m} | null}. «referencia» es
                   cómo se reparte altura_mediana_m entre las parcelas con disparos de ESA entrega:
                   GEDI (rh98) no marca cero sobre suelo desnudo, y con esto la ficha deja comparar
                   la lectura de una parcela con las demás en vez de leerla como altura del cultivo.
  ecostress        null + ecostress_motivo, o {archivo, fuente, fecha, meses, parcelas: {id: [valores
                   por mes]}}
  gaez             null + gaez_motivo, o {archivo, fuente, fecha, zonas: {zona: [{cultivo, variable,
                   valor, unidad, resolucion_m}]}}
  heladas          null + heladas_motivo, o el contenido de heladas.json más «entrega» {archivo,
                   fuente, fecha}
  et_contraste     null + et_contraste_motivo, o {zona, motivo_otras_zonas, archivo, fuente, fecha,
                   meses, columnas: {columna: [valores]}}. «zona» es la zona piloto del contraste:
                   et_contraste.csv no lleva sufijo de zona, así que es de la zona por omisión
                   (esquemas.ZONA_POR_OMISION; docs/decisiones/2026-11-14_dos_zonas.md). La página lo
                   dibuja solo en esa zona; en las demás dice «motivo_otras_zonas» y no cruza sus
                   series regionales con las de otra área.
  En cada bloque, «archivo», «fuente» y «fecha» son la entrega de data/processed y su línea de
  fuentes.json (LEEME.md del buzón). La página escribe el texto de «fuente» una sola vez por sección.
  tarjetas, unidades  cómo agrupa y rotula la página las series (de data/recursos_reto.json)
  avisos           lo que el motor no pudo leer o encontró inconsistente (lista de textos)

Reglas:
- Nada se inventa ni se interpola. Un bloque sin entrega va en null con su motivo (texto fijo en
  inglés: la página lo muestra tal cual). Un mes o un año sin dato va en null, nunca en cero.
- Año agrícola Y = del 1 de octubre de Y−1 al 30 de septiembre de Y (kit v4, A3-M paso 3; es la
  definición de la memoria del proyecto y de data/params.json → memoria.anio_actual).
- Helada = Tmin ≤ 0 °C (kit v4, A2 paso 1).
- Un año con días faltantes (−999 o fila ausente) desde la fracción que ya usa el validador para
  eto_diaria.csv (esquemas.FALTANTES_MAX_FRACCION) va con su suma en null y su «dias_con_dato» real.
- Los únicos números escritos aquí son definiciones con su fuente (inicio del año agrícola, umbral
  de helada, 12 meses) y decimales de redondeo; ninguno es un dato.
"""
import argparse
import csv
import datetime
import json
import math
import statistics
import sys
from collections import Counter
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from motor import esquemas as E  # noqa: E402

ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
NOMBRE_SALIDA = "contexto.json"
NOMBRE_FUENTES = "fuentes.json"
DECISION = "docs/decisiones/2026-11-14_recursos_del_reto.md"

# ---------------------------------------------------------------------------------------
# Definiciones (con su fuente; no son datos)
# ---------------------------------------------------------------------------------------
# Kit v4, A3-M paso 3: «Año agrícola Y = del 1 de octubre de Y−1 al 30 de septiembre de Y».
INICIO_ANIO_AGRICOLA = (10, 1)   # (mes, día)
FIN_ANIO_AGRICOLA = (9, 30)      # (mes, día)
MESES_DEL_ANIO = 12
# Kit v4, A2 paso 1: «helada = Tmin ≤ 0 °C» (la misma definición del contrato para ERA5-Land).
UMBRAL_HELADA_C = 0
MESES_EN = ("January", "February", "March", "April", "May", "June", "July", "August",
            "September", "October", "November", "December")
DEFINICION_ANIO = (f"Agricultural year: from {MESES_EN[INICIO_ANIO_AGRICOLA[0] - 1]} {INICIO_ANIO_AGRICOLA[1]} of "
                   f"the previous year to {MESES_EN[FIN_ANIO_AGRICOLA[0] - 1]} {FIN_ANIO_AGRICOLA[1]} of the named "
                   "year (kit v4, A3-M step 3; data/params.json, memoria.anio_actual)")
DEFINICION_HELADA = (f"Frost day: daily minimum temperature at or below {UMBRAL_HELADA_C} °C "
                     "(kit v4, A2 step 1)")
# Texto de data/params.json (memoria.anio_actual.unidad) que confirma la definición del año.
MARCAS_PARAMS_ANIO = ("1-oct", "30-sep")

# Las líneas de LEEME.md del buzón (el texto de «fuente» de cada entrega) se escriben en español,
# como el resto de la operación del equipo (CLAUDE.md, OPERACIÓN). La interfaz va en inglés: la
# página marca esos textos con este idioma para los lectores de pantalla.
IDIOMA_FUENTES = "es"

# Redondeos de presentación (no cambian el dato de origen).
DECIMALES_MM = 1
DECIMALES_MEDIA = 4
DECIMALES_ALTURA = 2   # los de la entrega de GEDI (metros con centésimas)
# Unidades del contrato que se suman en el año (láminas y días); las demás se promedian.
UNIDADES_ADITIVAS = ("mm/mes", "dias")

# Motivos: textos fijos en inglés (la página los muestra tal cual).
MOTIVO_PEDIDO = "Requested from the data team — not delivered yet"
MOTIVO_SIN_FILAS = "The delivered file has no rows for this source yet"
MOTIVO_ILEGIBLE = "The delivered file could not be read; see the build log"
MOTIVO_SIN_CLIMA = "No daily weather file in the validated deliveries"
# et_contraste.csv es de una sola zona (ver bloque_et_contraste): lo que dice la página en las demás.
MOTIVO_CONTRASTE_OTRA_ZONA = "Not run for this pilot area"

# Entregas nuevas (docs/decisiones/2026-11-14_recursos_del_reto.md): un archivo para las dos zonas.
ARCHIVO_CONTEXTO = "contexto_regional.csv"
ARCHIVO_GEDI = "gedi_parcelas.csv"
ARCHIVO_ECOSTRESS = "ecostress_parcelas.csv"
ARCHIVO_GAEZ = "gaez_zona.csv"
ARCHIVO_HELADAS = "heladas.json"
ARCHIVO_ET_CONTRASTE = "et_contraste.csv"
ARCHIVO_POWER = "eto_diaria.csv"
ARCHIVO_IMERG = "imerg_diaria.csv"
VACIOS = {"", "nan", "na", "n/a", "null", "none"}   # igual que motor/ensamblar.py


# ---------------------------------------------------------------------------------------
# Lectura
# ---------------------------------------------------------------------------------------
def leer_json(ruta):
    return json.loads(Path(ruta).read_text(encoding="utf-8-sig"))


def leer_csv(ruta):
    with open(ruta, newline="", encoding="utf-8-sig") as f:
        return [fila for fila in csv.DictReader(f) if any((v or "").strip() for v in fila.values())]


def numero(texto, faltante=None):
    """Celda de CSV como número finito; None si está vacía, no es número o es el centinela de faltante."""
    t = (texto or "").strip()
    if t.lower() in VACIOS:
        return None
    try:
        v = float(t)
    except ValueError:
        return None
    if not math.isfinite(v) or (faltante is not None and v == faltante):
        return None
    return v


def numero_limpio(texto):
    """Como numero(), pero un entero se queda entero (9000, no 9000.0): para resoluciones."""
    v = numero(texto)
    return int(v) if v is not None and float(v).is_integer() else v


def entero(texto):
    v = numero(texto)
    return int(v) if v is not None and float(v).is_integer() else None


def redondear(v, decimales):
    """round() sin «-0.0»; None se queda en None."""
    if v is None:
        return None
    r = round(v, decimales)
    return 0.0 if r == 0 else r


def nombre_de_zona(base, zona):
    """Archivo de una zona: sin sufijo para la zona por omisión; «<base>_<zona>.<ext>» para las demás."""
    if zona == E.ZONA_POR_OMISION:
        return base
    raiz, ext = base.rsplit(".", 1)
    return f"{raiz}_{zona}.{ext}"


def zonas_de(params):
    """{id: {"nombre"}} de zona_piloto.zonas; si params no las trae, solo la zona por omisión."""
    crudo = ((params.get("zona_piloto") or {}).get("zonas") or {}).get("valor")
    zonas = {}
    for z in crudo if isinstance(crudo, list) else []:
        if isinstance(z, dict) and isinstance(z.get("id"), str) and z["id"].strip():
            zonas[z["id"].strip()] = {"nombre": z.get("nombre") or z["id"].strip()}
    return zonas or {E.ZONA_POR_OMISION: {"nombre": E.ZONA_POR_OMISION}}


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


def entrega(nombre, registradas):
    """{"archivo", "fuente", "fecha"} de una entrega presente (fuente y fecha en None si no está registrada)."""
    r = registradas.get(nombre) or {}
    return {"archivo": nombre, "fuente": r.get("fuente"), "fecha": r.get("fecha")}


def procedencia(registro):
    """De qué entrega sale un bloque: {"archivo", "fuente", "fecha"}. `registro` es lo que armar() le
    pasa al lector del bloque (entrega(nombre, registradas)); lo que falte va en None."""
    return {"archivo": registro.get("archivo"), "fuente": registro.get("fuente"), "fecha": registro.get("fecha")}


# ---------------------------------------------------------------------------------------
# Año agrícola
# ---------------------------------------------------------------------------------------
def anio_agricola(anio, mes):
    """Año agrícola de un mes del calendario: octubre a diciembre pertenecen al año siguiente."""
    return anio + 1 if mes >= INICIO_ANIO_AGRICOLA[0] else anio


def dias_del_anio_agricola(anio):
    """Días del calendario del año agrícola (365, o 366 si incluye un 29 de febrero)."""
    inicio = datetime.date(anio - 1, *INICIO_ANIO_AGRICOLA)
    fin = datetime.date(anio, *FIN_ANIO_AGRICOLA)
    return (fin - inicio).days + 1


def suficiente(dias_con_dato, dias_del_anio):
    """True si los faltantes del año quedan por debajo de la fracción que rechaza el validador."""
    return (dias_del_anio - dias_con_dato) / dias_del_anio < E.FALTANTES_MAX_FRACCION


# ---------------------------------------------------------------------------------------
# Clima del año (NASA POWER y GPM IMERG; se calcula con lo que ya hay)
# ---------------------------------------------------------------------------------------
def _fecha(texto):
    try:
        return datetime.date.fromisoformat((texto or "").strip())
    except ValueError:
        return None


def clima_de_zona(processed, zona, registradas):
    """Bloque de clima_anual de una zona, o None si no hay ningún archivo de clima de esa zona."""
    n_power, n_imerg = nombre_de_zona(ARCHIVO_POWER, zona), nombre_de_zona(ARCHIVO_IMERG, zona)
    hay_power, hay_imerg = (processed / n_power).is_file(), (processed / n_imerg).is_file()
    if not hay_power and not hay_imerg:
        return None
    cuenta = {}   # año agrícola → acumuladores

    def del_anio(fecha):
        return cuenta.setdefault(anio_agricola(fecha.year, fecha.month), Counter())

    if hay_power:
        for fila in leer_csv(processed / n_power):
            fecha = _fecha(fila.get("fecha"))
            if fecha is None:
                continue
            c = del_anio(fecha)
            eto = numero(fila.get("eto_mm"), E.FALTANTE_POWER)
            lluvia = numero(fila.get("lluvia_mm"), E.FALTANTE_POWER)
            tmin = numero(fila.get("tmin"), E.FALTANTE_POWER)
            if eto is not None:
                c["eto_n"] += 1
                c["eto_mm"] += eto
            if lluvia is not None:
                c["lluvia_power_n"] += 1
                c["lluvia_power_mm"] += lluvia
            if tmin is not None:
                c["tmin_n"] += 1
                c["dias_helada"] += 1 if tmin <= UMBRAL_HELADA_C else 0
            if eto is not None and lluvia is not None and tmin is not None:
                c["power_n"] += 1
    if hay_imerg:
        for fila in leer_csv(processed / n_imerg):
            fecha = _fecha(fila.get("fecha"))
            lluvia = numero(fila.get("lluvia_mm"))
            if fecha is None:
                continue
            c = del_anio(fecha)
            if lluvia is not None:
                c["imerg_n"] += 1
                c["lluvia_imerg_mm"] += lluvia
    if not cuenta:
        return None

    anios = []
    for anio in range(min(cuenta), max(cuenta) + 1):
        c = cuenta.get(anio, Counter())
        dias = dias_del_anio_agricola(anio)

        def suma(llave_valor, llave_n, decimales=DECIMALES_MM):
            return redondear(c[llave_valor], decimales) if suficiente(c[llave_n], dias) else None

        anios.append({
            "anio": anio,
            "lluvia_imerg_mm": suma("lluvia_imerg_mm", "imerg_n"),
            "lluvia_power_mm": suma("lluvia_power_mm", "lluvia_power_n"),
            "eto_mm": suma("eto_mm", "eto_n"),
            "dias_helada": int(c["dias_helada"]) if suficiente(c["tmin_n"], dias) else None,
            "dias_con_dato": int(c["power_n"]),
            "dias_con_dato_imerg": int(c["imerg_n"]),
            "dias_del_anio": dias,
        })
    return {
        "definicion_anio": DEFINICION_ANIO,
        "definicion_helada": DEFINICION_HELADA,
        "umbral_faltantes": E.FALTANTES_MAX_FRACCION,
        "anios": anios,
        "fuentes": {
            "power": entrega(n_power, registradas) if hay_power else None,
            "imerg": entrega(n_imerg, registradas) if hay_imerg else None,
        },
    }


# ---------------------------------------------------------------------------------------
# contexto_regional.csv (SMAP, MODIS, GRACE, GLDAS, NLDAS y ERA5-Land)
# ---------------------------------------------------------------------------------------
def _mes(texto):
    """(año, mes) de «AAAA-MM»; None si no lo es."""
    partes = (texto or "").strip().split("-")
    if len(partes) != 2 or not all(p.isdigit() for p in partes):
        return None
    anio, mes = int(partes[0]), int(partes[1])
    return (anio, mes) if 1 <= mes <= MESES_DEL_ANIO else None


def _texto_mes(anio, mes):
    return f"{anio:04d}-{mes:02d}"


def _meses_entre(primero, ultimo):
    """Todos los meses del calendario de `primero` a `ultimo`, ambos incluidos."""
    meses, (anio, mes) = [], primero
    while (anio, mes) <= ultimo:
        meses.append((anio, mes))
        anio, mes = (anio + 1, 1) if mes == MESES_DEL_ANIO else (anio, mes + 1)
    return meses


def _unico(valores):
    """El valor si todas las filas traen el mismo; None si varía o no hay ninguno."""
    distintos = {v for v in valores if v is not None}
    return distintos.pop() if len(distintos) == 1 else None


def resumen_anual(meses, valores, aditiva):
    """[{anio, media, n_meses, suma, completo}] por año agrícola. La media usa solo los meses con
    dato; la suma (unidades que se suman) solo existe si el año tiene sus 12 meses."""
    por_anio = {}
    for (anio, mes), v in zip(meses, valores):
        por_anio.setdefault(anio_agricola(anio, mes), []).append(v)
    salida = []
    for anio in sorted(por_anio):
        con_dato = [v for v in por_anio[anio] if v is not None]
        completo = len(con_dato) == MESES_DEL_ANIO
        salida.append({
            "anio": anio,
            "media": redondear(sum(con_dato) / len(con_dato), DECIMALES_MEDIA) if con_dato else None,
            "n_meses": len(con_dato),
            "suma": redondear(sum(con_dato), DECIMALES_MM) if aditiva and completo else None,
            "completo": completo,
        })
    return salida


def bloque_contexto(ruta, zonas, unidades, registro, avisos):
    """(bloque por zona, fuentes con al menos un valor) de contexto_regional.csv."""
    series, ajenas = {}, set()   # (zona, fuente, variable) → filas; zonas que params no conoce
    for fila in leer_csv(ruta):
        zona, fuente, variable = (fila[c].strip() for c in ("zona", "fuente", "variable"))
        # «cuenca» es la zona de GRACE (una sola serie, la misma para las dos zonas piloto).
        if zona not in zonas and zona != E.ZONA_CUENCA:
            ajenas.add(zona)
            continue
        series.setdefault((zona, fuente, variable), []).append(fila)
    for zona in sorted(ajenas):
        avisos.append(f"{ARCHIVO_CONTEXTO}: zona «{zona}» que no está en data/params.json; sus filas no se usan")

    bloque, fuentes_con_valor = {}, set()
    for (zona, fuente, variable), filas in sorted(series.items()):
        por_mes = {}
        for fila in filas:
            m = _mes(fila["mes"])
            if m is not None:
                por_mes[m] = numero(fila["valor"])
        if not por_mes:
            continue
        meses = _meses_entre(min(por_mes), max(por_mes))
        valores = [por_mes.get(m) for m in meses]
        if any(v is not None for v in valores):
            fuentes_con_valor.add(fuente)
        unidad = _unico(fila["unidad"].strip() for fila in filas)
        resolucion = _unico(numero_limpio(fila["resolucion_m"]) for fila in filas)
        celdas = [entero(fila["n_celdas"]) for fila in filas]
        clave = f"{fuente}.{variable}"
        if unidad is None or resolucion is None:
            avisos.append(f"{ARCHIVO_CONTEXTO}: {zona} {clave} trae más de una unidad o resolución; va en null")
        aditiva = unidad in UNIDADES_ADITIVAS
        rotulo = unidades.get(unidad) or {}
        serie = {
            "fuente_id": fuente,
            "variable": variable,
            # «cuenca»: una sola serie para las dos zonas (GRACE); «zona»: promedio del rectángulo de la zona.
            "ambito": "cuenca" if zona == E.ZONA_CUENCA else "zona",
            "unidad": unidad,
            "unidad_en": rotulo.get("en", unidad),
            # Lo que resume el año: la suma de los 12 meses (láminas, días) o la media mensual.
            "estadistica": "suma" if aditiva else "media",
            "unidad_anual_en": rotulo.get("anual_en", rotulo.get("en", unidad)) if aditiva else rotulo.get("en", unidad),
            "resolucion_m": resolucion,
            "n_celdas": _unico(celdas),
            **procedencia(registro),
            "meses": [_texto_mes(*m) for m in meses],
            "valores": valores,
            "anual": resumen_anual(meses, valores, aditiva),
        }
        if serie["n_celdas"] is None and any(c is not None for c in celdas):
            presentes = [c for c in celdas if c is not None]
            serie["n_celdas_rango"] = [min(presentes), max(presentes)]   # varía de un mes a otro
        bloque.setdefault(zona, {})[clave] = serie
    return bloque, fuentes_con_valor


# ---------------------------------------------------------------------------------------
# Evidencia por parcela y por zona
# ---------------------------------------------------------------------------------------
def referencia_gedi(parcelas):
    """Cómo se reparte la lectura de GEDI (altura_mediana_m) entre las parcelas con disparos de ESTA
    entrega: cuántas son, y su mínimo, su mediana y su máximo. Nada se supone: sale del propio archivo.
    Sirve de vara en la ficha, porque rh98 no marca cero sobre suelo desnudo y una lectura baja no es la
    altura de un cultivo. None si ninguna parcela trae lectura."""
    lecturas = sorted(p["altura_mediana_m"] for p in parcelas.values() if p["altura_mediana_m"] is not None)
    if not lecturas:
        return None
    return {
        "n_parcelas": len(lecturas),
        "minimo_m": lecturas[0],
        "mediana_m": redondear(statistics.median(lecturas), DECIMALES_ALTURA),
        "maximo_m": lecturas[-1],
    }


def bloque_gedi(ruta, registro):
    filas = leer_csv(ruta)
    parcelas = {}
    for fila in filas:
        n = entero(fila["n_disparos"])
        if n:   # sin disparos no hay altura: la parcela no entra (la página dice «no shots»)
            parcelas[fila["id"].strip()] = {
                "n_disparos": n,
                "altura_mediana_m": numero(fila["altura_mediana_m"]),
                "altura_p90_m": numero(fila["altura_p90_m"]),
            }
    return {**procedencia(registro), "parcelas": parcelas, "n_con_dato": len(parcelas), "n_total": len(filas),
            "referencia": referencia_gedi(parcelas)}


def bloque_ecostress(ruta, registro):
    filas = leer_csv(ruta)
    meses = sorted({fila["mes"].strip() for fila in filas if _mes(fila["mes"]) is not None})
    indice = {m: i for i, m in enumerate(meses)}
    parcelas = {}
    for fila in filas:
        mes = fila["mes"].strip()
        if mes in indice:
            parcelas.setdefault(fila["id"].strip(), [None] * len(meses))[indice[mes]] = numero(fila["et_mm_dia"])
    return {**procedencia(registro), "meses": meses, "parcelas": parcelas}


def bloque_gaez(ruta, zonas, registro, avisos):
    por_zona, ajenas = {}, set()
    for fila in leer_csv(ruta):
        zona = fila["zona"].strip()
        if zona not in zonas:
            if zona not in ajenas:
                avisos.append(f"{ARCHIVO_GAEZ}: zona «{zona}» que no está en data/params.json; sus filas no se usan")
            ajenas.add(zona)
            continue
        por_zona.setdefault(zona, []).append({
            "cultivo": fila["cultivo"].strip(),
            "variable": fila["variable"].strip(),
            "valor": numero(fila["valor"]),
            "unidad": fila["unidad"].strip(),
            "resolucion_m": numero_limpio(fila["resolucion_m"]),
        })
    return {**procedencia(registro), "zonas": por_zona}


def bloque_heladas(ruta, registro):
    """El contenido de heladas.json (kit A2) tal cual, más de dónde llegó."""
    contenido = leer_json(ruta)
    if not isinstance(contenido, dict):
        raise ValueError("heladas.json no es un objeto")
    return {**contenido, "entrega": procedencia(registro)}


def bloque_et_contraste(ruta, registro):
    """Meses y columnas de et_contraste.csv tal cual (A8), y la zona piloto a la que pertenecen.

    et_contraste.csv es un archivo SIN sufijo de zona y no va en esquemas.ARCHIVOS_POR_ZONA: es de la
    zona por omisión (docs/decisiones/2026-11-14_dos_zonas.md: «Los archivos sin sufijo son de
    delicias_saucillo»). La página lo dibuja junto a MODIS y GLDAS solo en esa zona; en las demás
    dice «motivo_otras_zonas», porque cruzar las series regionales de una zona con el contraste de
    otra compararía dos áreas distintas en los mismos ejes.
    """
    filas = leer_csv(ruta)
    columnas = [c for c in (filas[0].keys() if filas else []) if c and c != "mes"]
    return {
        "zona": E.ZONA_POR_OMISION,
        "motivo_otras_zonas": MOTIVO_CONTRASTE_OTRA_ZONA,
        **procedencia(registro),
        "meses": [fila["mes"].strip() for fila in filas],
        "columnas": {c: [numero(fila.get(c)) for fila in filas] for c in columnas},
    }


# ---------------------------------------------------------------------------------------
# Recursos del reto: estado según lo que de verdad hay en data/processed
# ---------------------------------------------------------------------------------------
def estado_de_recursos(catalogo, processed, zonas, registradas, fuentes_contexto):
    """fuentes_contexto: fuentes con valor en contexto_regional.csv (set), o None si no se leyó."""
    salida = []
    for rec in catalogo.get("recursos", []):
        esperadas = []
        for base in rec.get("entregas") or []:
            esperadas.append(base)
            if base in E.ARCHIVOS_POR_ZONA:
                esperadas += [nombre_de_zona(base, z) for z in zonas if z != E.ZONA_POR_OMISION]
        presentes, faltantes, sin_filas = [], [], False
        for nombre in esperadas:
            existe = (processed / nombre).is_file()
            if existe and nombre == ARCHIVO_CONTEXTO and rec.get("fuente_contexto"):
                # El archivo es de seis fuentes: el recurso solo cuenta si trae filas suyas con valor.
                existe = fuentes_contexto is not None and rec["fuente_contexto"] in fuentes_contexto
                sin_filas = not existe
            (presentes if existe else faltantes).append(nombre)
        aplica = bool(rec.get("aplica"))
        if not aplica:
            estado, motivo = "not_applicable", rec.get("motivo_no_aplica")
        elif presentes:
            estado, motivo = "in_use", None
        else:
            estado, motivo = "requested", (MOTIVO_SIN_FILAS if sin_filas else MOTIVO_PEDIDO)
        fuentes = [entrega(n, registradas) for n in presentes]
        fechas = sorted(f["fecha"] for f in fuentes if f["fecha"])
        salida.append({
            "id": rec.get("id"), "nombre": rec.get("nombre"), "organismo": rec.get("organismo"),
            "papel": rec.get("papel"), "aplica": aplica, "estado": estado,
            "entregas_presentes": presentes, "entregas_faltantes": faltantes,
            "motivo": motivo, "equivalente_local": rec.get("equivalente_local"),
            "fuentes": fuentes, "fecha": fechas[-1] if fechas else None,
            # Fuente de contexto_regional.csv que corresponde al recurso (la página liga serie y recurso).
            "fuente_contexto": rec.get("fuente_contexto"),
        })
    return salida


# ---------------------------------------------------------------------------------------
# Armado
# ---------------------------------------------------------------------------------------
def _confirmar_definicion_del_anio(params, avisos):
    """La definición del año agrícola está escrita en params (memoria.anio_actual.unidad): se avisa si deja de estarlo."""
    unidad = (((params.get("memoria") or {}).get("anio_actual") or {}).get("unidad")) or ""
    if not all(marca in unidad for marca in MARCAS_PARAMS_ANIO):
        avisos.append("data/params.json (memoria.anio_actual.unidad) no confirma el año agrícola de octubre a "
                      "septiembre: revise INICIO_ANIO_AGRICOLA en motor/contexto_web.py")


def armar(processed, params, catalogo):
    """(contexto, avisos) con lo que hay en `processed`. No escribe nada."""
    processed = Path(processed)
    avisos = []
    zonas = zonas_de(params)
    registradas = fuentes_registradas(processed)
    unidades = catalogo.get("unidades") or {}
    _confirmar_definicion_del_anio(params, avisos)

    contexto = {
        "_encabezado": ENCABEZADO,
        "_nota": ("Lo escribe motor/contexto_web.py con las entregas validadas de data/processed; no se edita a "
                  "mano. Un bloque en null lleva su motivo en «<bloque>_motivo»."),
        "generado": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "decision": catalogo.get("decision", DECISION),
        "zonas": zonas,
        # Motivo común de lo pedido y no entregado (el de cada bloque y cada recurso sin entrega).
        "motivo_pedido": MOTIVO_PEDIDO,
        "idioma_fuentes": IDIOMA_FUENTES,
    }

    def bloque_opcional(nombre, archivo, leer):
        """Bloque de una entrega: null + motivo si no llegó o no se pudo leer; nunca se rellena."""
        ruta = processed / archivo
        if not ruta.is_file():
            contexto[nombre], contexto[f"{nombre}_motivo"] = None, MOTIVO_PEDIDO
            return None
        try:
            valor = leer(ruta, entrega(archivo, registradas))
        except (KeyError, ValueError, AttributeError, csv.Error, json.JSONDecodeError, UnicodeDecodeError) as ex:
            avisos.append(f"{archivo}: no se pudo leer ({type(ex).__name__}: {ex}); el bloque «{nombre}» va en null")
            contexto[nombre], contexto[f"{nombre}_motivo"] = None, MOTIVO_ILEGIBLE
            return None
        contexto[nombre], contexto[f"{nombre}_motivo"] = valor, None
        return valor

    # Clima del año: con lo que ya hay (NASA POWER y GPM IMERG).
    clima = {}
    for zona in zonas:
        try:
            bloque = clima_de_zona(processed, zona, registradas)
        except (KeyError, ValueError, csv.Error, UnicodeDecodeError) as ex:
            avisos.append(f"clima de {zona}: no se pudo leer ({type(ex).__name__}: {ex})")
            bloque = None
        if bloque is not None:
            clima[zona] = bloque
    contexto["clima_anual"] = clima or None
    contexto["clima_anual_motivo"] = None if clima else MOTIVO_SIN_CLIMA

    # Series regionales: el lector devuelve además qué fuentes traen valor (para el estado de cada recurso).
    fuentes_contexto = None

    def leer_contexto(ruta, registro):
        nonlocal fuentes_contexto
        bloque, fuentes_contexto = bloque_contexto(ruta, zonas, unidades, registro, avisos)
        return bloque

    bloque_opcional("contexto_regional", ARCHIVO_CONTEXTO, leer_contexto)
    bloque_opcional("gedi", ARCHIVO_GEDI, bloque_gedi)
    bloque_opcional("ecostress", ARCHIVO_ECOSTRESS, bloque_ecostress)
    bloque_opcional("gaez", ARCHIVO_GAEZ, lambda ruta, registro: bloque_gaez(ruta, zonas, registro, avisos))
    bloque_opcional("heladas", ARCHIVO_HELADAS, bloque_heladas)
    bloque_opcional("et_contraste", ARCHIVO_ET_CONTRASTE, bloque_et_contraste)

    contexto["recursos"] = estado_de_recursos(catalogo, processed, zonas, registradas, fuentes_contexto)
    contexto["tarjetas"] = catalogo.get("tarjetas") or []
    contexto["unidades"] = unidades
    contexto["avisos"] = avisos
    return contexto, avisos


def construir(processed=RAIZ / "data/processed", web=RAIZ / "web/data", params_ruta=RAIZ / "data/params.json",
              recursos_ruta=RAIZ / "data/recursos_reto.json"):
    """Escribe <web>/contexto.json con lo que hay en `processed`. Devuelve un resumen."""
    processed, web = Path(processed), Path(web)
    contexto, avisos = armar(processed, leer_json(params_ruta), leer_json(recursos_ruta))
    web.mkdir(parents=True, exist_ok=True)
    salida = web / NOMBRE_SALIDA
    # allow_nan=False: si se colara un NaN o un infinito, falla aquí y no llega a la página.
    salida.write_text(json.dumps(contexto, ensure_ascii=False, indent=1, allow_nan=False) + "\n", encoding="utf-8")
    bloques = ("clima_anual", "contexto_regional", "gedi", "ecostress", "gaez", "heladas", "et_contraste")
    return {
        "ejecutado": True,
        "salida": str(salida),
        "bloques": {b: contexto[b] is not None for b in bloques},
        "recursos": dict(sorted(Counter(r["estado"] for r in contexto["recursos"]).items())),
        "avisos": avisos,
    }


def main(argv=None):
    ap = argparse.ArgumentParser(description="Escribe web/data/contexto.json (bases de datos del reto).")
    ap.add_argument("--processed", default=str(RAIZ / "data/processed"), help="entregas validadas")
    ap.add_argument("--web", default=str(RAIZ / "web/data"), help="carpeta de salida")
    ap.add_argument("--params", default=str(RAIZ / "data/params.json"))
    ap.add_argument("--recursos", default=str(RAIZ / "data/recursos_reto.json"))
    args = ap.parse_args(argv)
    resumen = construir(processed=args.processed, web=args.web, params_ruta=args.params, recursos_ruta=args.recursos)
    print(json.dumps(resumen, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
