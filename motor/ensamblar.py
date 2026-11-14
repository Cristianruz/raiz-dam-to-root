#!/usr/bin/env python3
# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Ensamblador del buzón de entregas (kit v4: K-ENS pasos 1, 2 y 6(a); tabla 0.4-B).

Qué hace:
1) Lee el buzón: la carpeta sincronizada de Drive Raiz_entregas (antes Raiz/entregas/; plana,
   o con subcarpetas <rol>/) y su LEEME.md, con una línea por archivo:
   «archivo | fuente | fecha | script» (fecha AAAA-MM-DD). Un archivo SIN línea no entra.
   Las exportaciones crudas de Earth Engine (hls_*.tif, piloto_consumo.tif; ver
   esquemas.CRUDOS_EARTH_ENGINE) no son entregas: se listan aparte como «crudos», sin
   validarlas, sin copiarlas y sin pedirles línea en LEEME.md.
2) Valida cada archivo contra motor/esquemas.py. parcelas_base.geojson va PRIMERO: los
   demás comprueban sus id contra él; si aún no llega (o se rechazó), los CSV con id
   quedan «retenidos» (no rechazados) hasta la siguiente corrida.
3) Un archivo válido se copia SIN MODIFICAR a data/processed/ y se registra con su sha256
   en data/processed/fuentes.json (archivo, fuente, fecha, script, sha256, rol). Uno
   inválido se ignora y se reporta con sus motivos: NUNCA se corrige en silencio. Si ya
   había una copia validada anterior, se conserva y el reporte lo dice.
4) Agrega una línea por corrida a docs/entregas_log.md (hora, qué entró, qué se rechazó).
Todavía NO toca web/data/: la integración con el contrato llega con el motor B4.

Dos zonas piloto (docs/decisiones/2026-11-14_dos_zonas.md; zonas en data/params.json →
zona_piloto.zonas):
- parcelas_base.geojson trae las dos zonas; cada parcela puede traer «zona». Con «zona», el id
  lleva el prefijo de la zona y el centroide (promedio de los vértices del anillo exterior) cae
  en el rectángulo de la zona. Sin «zona» = esquemas.ZONA_POR_OMISION, sin exigir prefijo.
- Los archivos de esquemas.ARCHIVOS_POR_ZONA llegan uno por zona: «<base>_<zona>.<ext>» se valida
  con el esquema de su base; el sufijo debe ser una zona conocida (y no la zona por omisión, que
  va sin sufijo). Se copian con su nombre tal cual.
- nasadem_zona_piloto[_<zona>].tif debe cubrir el rectángulo de SU zona. Si no lo cubre pero sí
  cubre todas las parcelas de esa zona en el parcelas_base.geojson de la misma corrida, entra con
  un aviso para re-exportar (compatibilidad: la entrega de una zona se exportó antes de ampliar
  el rectángulo).
- El reporte dice la zona de cada archivo («zona») y, en los archivos con las dos zonas
  (parcelas_base, relieve_rutas y los CSV por parcela), cuántos elementos trae de cada una («zonas»).
Si params no trae zona_piloto.zonas, todo funciona como con una zona (zona_piloto.bbox) y se avisa.

Uso:
  python motor/ensamblar.py --buzon RUTA [--salida CARPETA] [--log ARCHIVO] [--json]
  RAIZ_BUZON=RUTA python motor/ensamblar.py
- Sin buzón (ni --buzon ni RAIZ_BUZON): no hay entregas, todo sigue simulado y no se
  escribe nada.
- Con --salida distinta de data/processed, la bitácora va a <salida>/entregas_log.md
  (salvo --log), para que una prueba no ensucie docs/.
- Código de salida: 0 si nada se rechazó; 1 si hubo rechazos; 2 si el buzón no existe.

Solo usa la biblioteca estándar. El GeoTIFF se lee con Pillow si está instalado; si no,
con un lector mínimo de etiquetas TIFF de la biblioteca estándar, y el reporte lo dice.
"""
import argparse
import csv
import datetime
import fnmatch
import hashlib
import json
import math
import os
import re
import shutil
import struct
import sys
from collections import Counter
from pathlib import Path, PurePosixPath

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from motor import esquemas as E  # noqa: E402

ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
SALIDA_POR_OMISION = RAIZ / "data/processed"
LOG_POR_OMISION = RAIZ / "docs/entregas_log.md"
PARAMS_POR_OMISION = RAIZ / "data/params.json"
NOMBRE_FUENTES = "fuentes.json"
NOMBRE_LOG_SALIDA = "entregas_log.md"
# Título de la sección de crudos de Earth Engine en el reporte impreso (acuerdo de formatos).
TITULO_CRUDOS = "CRUDOS DE EARTH ENGINE (se procesan con A3; no entran al contrato)"

# Celdas que cuentan como vacías (pandas escribe NaN; Earth Engine deja la celda vacía).
VACIOS = {"", "nan", "na", "n/a", "null", "none"}
RE_FECHA = re.compile(r"^\d{4}-\d{2}-\d{2}$")
RE_MES = re.compile(r"^(\d{4})-(\d{2})$")
RE_MES_DIA = re.compile(r"^(\d{2})-(\d{2})$")
RE_K_DE_N = re.compile(r"^(\d+)/(\d+)$")
RE_SHA256 = re.compile(r"^[0-9a-fA-F]{64}$")
RE_SEPARADOR_MD = re.compile(r"^:?-{3,}:?$")
FIRMA_PNG = b"\x89PNG\r\n\x1a\n"
MAX_EJEMPLOS = 3

VACIO, FALTANTE, VALIDO, ERROR = "vacio", "faltante", "valido", "error"


# =========================================================================================
# Utilidades
# =========================================================================================
def ahora():
    """Hora local con zona horaria, sin microsegundos."""
    return datetime.datetime.now().astimezone().isoformat(timespec="seconds")


def sha256_de(ruta):
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def mostrar_ruta(ruta):
    """Ruta relativa al repo si está dentro; si no, solo las dos últimas partes."""
    if ruta is None:
        return None
    p = Path(ruta).resolve()
    try:
        return p.relative_to(RAIZ).as_posix()
    except ValueError:
        return "…/" + "/".join(p.parts[-2:])


def fmt(v):
    """Número legible para los motivos (sin ceros de sobra)."""
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return f"{v:g}" if isinstance(v, float) else str(v)


def es_numero(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def es_fecha(texto):
    if not RE_FECHA.match(texto):
        return False
    try:
        datetime.date.fromisoformat(texto)
    except ValueError:
        return False
    return True


def es_mes(texto):
    m = RE_MES.match(texto)
    return bool(m) and 1 <= int(m.group(2)) <= 12


def es_mes_dia(texto):
    m = RE_MES_DIA.match(texto)
    if not m:
        return False
    try:
        datetime.date(2000, int(m.group(1)), int(m.group(2)))  # año bisiesto: admite 02-29
    except ValueError:
        return False
    return True


def valor_en_params(params, ruta):
    """params['a']['b']['c'] para ruta 'a.b.c'; None si falta algún tramo."""
    nodo = params
    for k in ruta.split("."):
        if not isinstance(nodo, dict) or k not in nodo:
            return None
        nodo = nodo[k]
    return nodo


def dias_ventana(anio, ventana):
    """Días del calendario de la ventana {'inicio': 'MM-DD', 'fin': 'MM-DD'} en un año,
    con ambos extremos incluidos (1-feb a 30-abr: 89 en año no bisiesto, 90 en bisiesto)."""
    mi, di = (int(x) for x in ventana["inicio"].split("-"))
    mf, df = (int(x) for x in ventana["fin"].split("-"))
    return (datetime.date(anio, mf, df) - datetime.date(anio, mi, di)).days + 1


def es_bbox(v):
    """True si v es [oeste, sur, este, norte] con cuatro números."""
    return isinstance(v, list) and len(v) == 4 and all(map(es_numero, v))


def zonas_de_params(params):
    """({id: {"nombre", "prefijo_id", "bbox"}}, [ids]) de zona_piloto.zonas.valor (decisión de
    dos zonas); (None, None) si params no las trae. Un prefijo o un bbox ausente o mal escrito
    queda en None: la comprobación se omite y se avisa (nunca se inventa)."""
    crudo = valor_en_params(params, "zona_piloto.zonas.valor")
    if not isinstance(crudo, list):
        return None, None
    zonas = {}
    for z in crudo:
        if not isinstance(z, dict) or not isinstance(z.get("id"), str) or not z["id"].strip():
            continue
        prefijo = z.get("prefijo_id")
        zonas[z["id"].strip()] = {
            "nombre": z.get("nombre"),
            "prefijo_id": prefijo.strip() if isinstance(prefijo, str) and prefijo.strip() else None,
            "bbox": list(z["bbox"]) if es_bbox(z.get("bbox")) else None,
        }
    return (zonas, sorted(zonas)) if zonas else (None, None)


def limites_derivados(params):
    """Límites que los esquemas piden como «@nombre», calculados de data/params.json.
    Lo que params no trae queda en None (la comprobación se omite y se avisa)."""
    lim = {
        "area_min_ha": valor_en_params(params, "mapa.area_min_ha.valor"),
        "anio_actual": valor_en_params(params, "memoria.anio_actual.valor"),
        "anio_inicio": valor_en_params(params, "memoria.anio_inicio.valor"),
        "lluvia_pct": valor_en_params(params, "lluvia_pct.valor"),
        "umbral_abstencion": valor_en_params(params, "mapa.umbral_abstencion.valor"),
        "ftw_confianza_min": valor_en_params(params, "mapa.ftw_confianza_min.valor"),
    }
    bbox = valor_en_params(params, "zona_piloto.bbox.valor")
    lim["bbox"] = list(bbox) if es_bbox(bbox) else None
    lim["zonas"], lim["zonas_ids"] = zonas_de_params(params)
    deslizador = valor_en_params(params, "dotaciones.deslizador.valor") or {}
    lim["deslizador_min"] = deslizador.get("min") if isinstance(deslizador, dict) else None
    lim["deslizador_max"] = deslizador.get("max") if isinstance(deslizador, dict) else None
    verde = valor_en_params(params, "memoria.ndvi_verde.valor")
    sensibilidad = valor_en_params(params, "memoria.ndvi_verde.sensibilidad") or []
    lim["umbrales_ndvi"] = [verde, *sensibilidad] if es_numero(verde) else None
    ventana = valor_en_params(params, "suelo.ventana_desnudo.valor")
    lim["ventana_desnudo"] = ventana if isinstance(ventana, dict) else None
    lim["dias_ventana_anio_actual"] = lim["dias_ventana_max"] = None
    try:
        if lim["ventana_desnudo"] and isinstance(lim["anio_actual"], int):
            lim["dias_ventana_anio_actual"] = dias_ventana(lim["anio_actual"], ventana)
            if isinstance(lim["anio_inicio"], int):
                lim["dias_ventana_max"] = max(dias_ventana(a, ventana)
                                              for a in range(lim["anio_inicio"], lim["anio_actual"] + 1))
    except (KeyError, ValueError, AttributeError):
        lim["ventana_desnudo"] = None
    return lim


def cargar_params(params):
    """params: dict, ruta a un JSON o None (data/params.json)."""
    if isinstance(params, dict):
        return params
    ruta = Path(params) if params else PARAMS_POR_OMISION
    return json.loads(ruta.read_text(encoding="utf-8"))


def esquema_de(nombre):
    """Esquema por nombre exacto o, si no, por patrón (motor/esquemas.py)."""
    if nombre in E.ESQUEMAS:
        return E.ESQUEMAS[nombre]
    for patron, esq in E.PATRONES:
        if fnmatch.fnmatchcase(nombre.lower(), patron):
            return esq
    return None


def separar_sufijo_zona(nombre):
    """(base, sufijo) si el nombre es «<base sin extensión>_<sufijo>.<ext>» de una base de
    E.ARCHIVOS_POR_ZONA (p. ej., rotaciones_lazaro_cardenas.json → rotaciones.json,
    lazaro_cardenas); (None, None) si no. No dice si el sufijo es una zona conocida."""
    if nombre in E.ESQUEMAS:
        return None, None
    for base in E.ARCHIVOS_POR_ZONA:
        raiz, ext = base.rsplit(".", 1)
        if nombre.startswith(raiz + "_") and nombre.endswith("." + ext):
            sufijo = nombre[len(raiz) + 1:-(len(ext) + 1)]
            if sufijo:
                return base, sufijo
    return None, None


def identificar(nombre, limites):
    """(esquema, zona, motivos) de un archivo del buzón (decisión de dos zonas).
    - Nombre exacto de la tabla: su esquema; si es de E.ARCHIVOS_POR_ZONA, la zona por omisión.
    - «<base>_<zona>.<ext>»: el esquema de la base y la zona del sufijo, que debe ser un id de
      zona_piloto.zonas distinto de la zona por omisión (esa va sin sufijo); si no, un motivo.
    - Si no, el esquema por patrón (sin zona)."""
    base, sufijo = separar_sufijo_zona(nombre)
    if base is None:
        return esquema_de(nombre), (E.ZONA_POR_OMISION if nombre in E.ARCHIVOS_POR_ZONA else None), []
    zonas = limites.get("zonas")
    if zonas is None:
        motivo = (f"sufijo de zona «{sufijo}»: data/params.json no trae zona_piloto.zonas, no se sabe "
                  "de qué zona es")
    elif sufijo == E.ZONA_POR_OMISION:
        motivo = (f"sufijo «_{sufijo}»: los archivos de la zona {sufijo} van sin sufijo ({base}; "
                  f"{E.FUENTE_DOS_ZONAS})")
    elif sufijo not in zonas:
        motivo = (f"sufijo de zona «{sufijo}» desconocido: las zonas de data/params.json "
                  f"(zona_piloto.zonas) son {', '.join(limites['zonas_ids'])}")
    else:
        motivo = None
    return E.ESQUEMAS[base], sufijo, [motivo] if motivo else []


# =========================================================================================
# Resultado de validar un archivo
# =========================================================================================
class Resultado:
    """Motivos de rechazo (agrupados: «mensaje (N casos; ej.: …)»), avisos e info."""

    def __init__(self):
        self._motivos = {}
        self._avisos = {}
        self.info = {}

    def motivo(self, texto, donde=None):
        n, ejemplos = self._motivos.setdefault(texto, [0, []])
        self._motivos[texto][0] = n + 1
        if donde is not None and len(ejemplos) < MAX_EJEMPLOS:
            ejemplos.append(str(donde))

    def aviso(self, texto):
        self._avisos.setdefault(texto, None)

    def motivos(self):
        salida = []
        for texto, (n, ejemplos) in self._motivos.items():
            if not ejemplos:
                salida.append(texto)
            elif n == 1:
                salida.append(f"{texto} ({ejemplos[0]})")
            else:
                salida.append(f"{texto} ({n} casos; ej.: {'; '.join(ejemplos)})")
        return salida

    @property
    def avisos(self):
        return list(self._avisos)


class Contexto:
    """Lo que comparten los validadores: límites de params e ids de parcelas_base."""

    def __init__(self, limites):
        self.limites = limites
        self.ids = None          # set de ids de parcelas_base.geojson cuando entra
        self.props = {}          # propiedades de cada parcela (para la regla de abstención)
        self.estado_parcelas = "no_llego"   # no_llego | rechazado | ok
        self.zona_de_id = {}     # id de parcela → zona (sin «zona» = la zona por omisión)
        self.cajas_zona = {}     # zona → [oeste, sur, este, norte] de los vértices de sus parcelas
        self.n_parcelas_zona = {}  # zona → número de parcelas
        self.zona_archivo = None   # zona del archivo que se valida (por sufijo o por omisión)

    def rectangulo(self, zona):
        """(bbox, rótulo) contra el que se compara un archivo o una parcela de esa zona: el
        rectángulo de la zona en zona_piloto.zonas; si params no trae zonas, la envolvente
        zona_piloto.bbox (como con una sola zona). bbox es None si params no lo trae."""
        zonas = self.limites.get("zonas")
        if zonas is None:
            return self.limites.get("bbox"), "zona_piloto.bbox"
        return (zonas.get(zona) or {}).get("bbox"), f"el rectángulo de la zona {zona} (zona_piloto.zonas)"

    def razon_sin_ids(self):
        if self.estado_parcelas == "rechazado":
            return (f"{E.ARCHIVO_PARCELAS} se rechazó en esta corrida: no hay ids contra los "
                    "cuales comprobar; se valida cuando llegue uno válido")
        return f"{E.ARCHIVO_PARCELAS} aún no llega al buzón: los id se comprueban cuando llegue"


def cota(valor, ctx, res, que):
    """Resuelve un límite: número tal cual o «@nombre» desde data/params.json."""
    if isinstance(valor, str) and valor.startswith("@"):
        nombre = valor[1:]
        v = ctx.limites.get(nombre)
        if v is None:
            res.aviso(f"data/params.json no trae «{nombre}» ({E.LIMITES_DERIVADOS.get(nombre, 'sin descripción')}): "
                      f"no se comprobó {que}")
        return v
    return valor


def en_lista(valor, permitidos):
    if isinstance(valor, tuple):          # k_de_n ya convertido: se compara como «k/n»
        valor = "/".join(map(str, valor))
    for p in permitidos:
        if es_numero(valor) and es_numero(p):
            if math.isclose(valor, p, rel_tol=0, abs_tol=1e-9):
                return True
        elif valor == p:
            return True
    return False


def revisar_valor(nombre, valor, campo, ctx, res, donde):
    """Rango, lista cerrada e id de parcela de un valor ya convertido."""
    if es_numero(valor):
        mn = cota(campo.get("min"), ctx, res, f"el mínimo de {nombre}")
        mx = cota(campo.get("max"), ctx, res, f"el máximo de {nombre}")
        fuera = (mn is not None and valor < mn) or (mx is not None and valor > mx)
        if fuera:
            if mn is not None and mx is not None:
                res.motivo(f"{nombre} fuera de [{fmt(mn)}, {fmt(mx)}]", donde)
            elif mn is not None:
                res.motivo(f"{nombre} menor que {fmt(mn)}", donde)
            else:
                res.motivo(f"{nombre} mayor que {fmt(mx)}", donde)
        # Cota inferior exclusiva (p. ej., un área debe ser > 0).
        mq = cota(campo.get("mayor_que"), ctx, res, f"el mínimo exclusivo de {nombre}")
        if mq is not None and not valor > mq:
            res.motivo(f"{nombre} debe ser mayor que {fmt(mq)}", donde)
    if campo.get("valores") is not None:
        permitidos = cota(campo["valores"], ctx, res, f"la lista de {nombre}")
        if permitidos is not None and not en_lista(valor, permitidos):
            res.motivo(f"{nombre} fuera de la lista permitida ({', '.join(fmt(p) for p in permitidos)})", donde)
    if campo.get("id_parcela"):
        if ctx.ids is None:
            res.info["necesita_ids"] = True
        elif valor not in ctx.ids:
            res.motivo(f"{nombre} no existe en {E.ARCHIVO_PARCELAS}", donde)


def leer_celda(texto, campo):
    """Convierte una celda de CSV según su tipo: (estado, valor, error)."""
    t = (texto or "").strip()
    # Equivalencia acordada (p. ej., «1/1 (reglas)» se lee como «1/1»): antes de convertir.
    t = (campo.get("alias") or {}).get(t, t)
    if t.lower() in VACIOS:
        return VACIO, None, None
    tipo = campo["tipo"]
    if tipo in ("numero", "entero"):
        try:
            v = float(t)
        except ValueError:
            return ERROR, None, "no es un número (¿coma decimal?)"
        if not math.isfinite(v):
            return ERROR, None, "no es un número finito"
        if "faltante" in campo and v == campo["faltante"]:
            return FALTANTE, None, None
        if tipo == "entero":
            if not v.is_integer():
                return ERROR, None, "debe ser entero"
            return VALIDO, int(v), None
        return VALIDO, v, None
    if tipo == "texto":
        return VALIDO, t, None
    if tipo == "fecha":
        return (VALIDO, t, None) if es_fecha(t) else (ERROR, None, "no es una fecha AAAA-MM-DD válida")
    if tipo == "mes":
        return (VALIDO, t, None) if es_mes(t) else (ERROR, None, "no es un mes AAAA-MM válido")
    if tipo == "mes_o_numero":
        if es_mes(t):
            return VALIDO, t, None
        if t.isdigit() and 1 <= int(t) <= 12:
            return VALIDO, int(t), None
        return ERROR, None, "no es un mes (AAAA-MM o 1–12)"
    if tipo == "bool":
        if t.lower() in ("true", "1"):
            return VALIDO, True, None
        if t.lower() in ("false", "0"):
            return VALIDO, False, None
        return ERROR, None, "no es booleano (true/false)"
    if tipo == "k_de_n":
        m = RE_K_DE_N.match(t)
        if m and int(m.group(2)) > 0 and int(m.group(1)) <= int(m.group(2)):
            return VALIDO, (int(m.group(1)), int(m.group(2))), None
        return ERROR, None, "no tiene la forma k/n (por ejemplo 2/2)"
    if tipo == "sha256":
        return (VALIDO, t.lower(), None) if RE_SHA256.match(t) else (ERROR, None, "no es un sha256 (64 hexadecimales)")
    return ERROR, None, f"tipo desconocido en el esquema: {tipo}"


def leer_valor_json(v, campo):
    """Convierte un valor de JSON (propiedad de GeoJSON): (estado, valor, error)."""
    if v is None or (isinstance(v, str) and not v.strip()):
        return VACIO, None, None
    tipo = campo["tipo"]
    if tipo in ("numero", "entero"):
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            return ERROR, None, f"debe ser número (es {type(v).__name__})"
        if not math.isfinite(v):
            return ERROR, None, "no es un número finito"
        if tipo == "entero" and not float(v).is_integer():
            return ERROR, None, "debe ser entero"
        return VALIDO, v, None
    if tipo == "texto":
        return (VALIDO, v.strip(), None) if isinstance(v, str) else (ERROR, None, f"debe ser texto (es {type(v).__name__})")
    if tipo == "bool":
        return (VALIDO, v, None) if isinstance(v, bool) else (ERROR, None, f"debe ser true o false (es {type(v).__name__})")
    return ERROR, None, f"tipo no admitido en GeoJSON: {tipo}"


# =========================================================================================
# CSV
# =========================================================================================
def pista_columnas(encabezado, faltan):
    """Explica por qué faltan columnas cuando la causa es frecuente."""
    if len(encabezado) == 1 and ";" in encabezado[0]:
        return " (¿separador «;»? Se espera coma)"
    bajas = {c.strip().lower(): c for c in encabezado}
    parecidas = [f"«{bajas[f.lower()]}»" for f in faltan if f.lower() in bajas]
    if parecidas:
        return f" (¿mayúsculas o espacios? Parecidas: {', '.join(parecidas)})"
    return ""


def validar_csv(ruta, esq, ctx):
    res = Resultado()
    try:
        with open(ruta, newline="", encoding="utf-8-sig") as f:
            filas = list(csv.reader(f))
    except UnicodeDecodeError:
        res.motivo("no es texto UTF-8")
        return res
    except csv.Error as ex:
        res.motivo(f"CSV mal formado: {ex}")
        return res
    if not filas or not any(c.strip() for c in filas[0]):
        res.motivo("archivo vacío o sin encabezado")
        return res
    encabezado = filas[0]
    columnas = esq.get("columnas", {})
    repetidas = sorted({c for c in encabezado if encabezado.count(c) > 1})
    if repetidas:
        res.motivo(f"columnas repetidas en el encabezado: {', '.join(repetidas)}")
    faltan = [c for c in columnas if c not in encabezado]
    if faltan:
        res.motivo(f"faltan columnas obligatorias: {', '.join(faltan)}; trae: {', '.join(encabezado)}"
                   + pista_columnas(encabezado, faltan))
        return res
    extra = [c for c in encabezado if c not in columnas]
    if extra and columnas:
        res.aviso(f"columnas adicionales (se copian sin validar): {', '.join(extra)}")

    datos, vacias = [], 0
    for n, fila in enumerate(filas[1:], start=2):
        if not fila or all(not c.strip() for c in fila):
            vacias += 1
            continue
        if len(fila) != len(encabezado):
            res.motivo(f"fila con distinto número de celdas que el encabezado ({len(encabezado)})",
                       f"fila {n}: {len(fila)} celdas")
            continue
        datos.append((n, dict(zip(encabezado, fila))))
    if vacias:
        res.aviso(f"{vacias} filas vacías (no se validan; el archivo se copia tal cual)")
    if not datos:
        res.motivo("no tiene filas de datos")
        return res
    res.info["filas"] = len(datos)

    convertidas = []
    faltantes = Counter()
    alias_usados = Counter()   # (columna, texto entregado, texto leído): celdas leídas por «alias»
    vistos = {c: {} for c, campo in columnas.items() if campo.get("unico")}
    ids_vistos = set()
    for n, celdas in datos:
        fila = {}
        for col, campo in columnas.items():
            crudo = celdas[col]
            if crudo.strip() in (campo.get("alias") or {}):
                alias_usados[(col, crudo.strip(), campo["alias"][crudo.strip()])] += 1
            estado, valor, error = leer_celda(crudo, campo)
            if estado == ERROR:
                res.motivo(f"{col}: {error}", f"fila {n}: {crudo.strip()!r}")
            elif estado == FALTANTE or (estado == VACIO and "faltante" in campo):
                faltantes[col] += 1
            elif estado == VACIO:
                if not campo.get("nulo") and not vacio_admitido(campo, celdas, columnas):
                    res.motivo(texto_vacio_no_permitido(col, campo), f"fila {n}")
            else:
                revisar_valor(col, valor, campo, ctx, res, f"fila {n}: {crudo.strip()}")
                if col in vistos:
                    if valor in vistos[col]:
                        res.motivo(f"{col} repetido", f"fila {n}: {crudo.strip()} (ya en la fila {vistos[col][valor]})")
                    else:
                        vistos[col][valor] = n
                if campo.get("id_parcela"):
                    ids_vistos.add(valor)
            fila[col] = valor
        convertidas.append((n, fila))

    llave = esq.get("llave")
    if llave:
        primeras = {}
        for n, fila in convertidas:
            clave = tuple(fila[c] for c in llave)
            if any(v is None for v in clave):
                continue
            if clave in primeras:
                res.motivo(f"fila repetida para ({', '.join(llave)})",
                           f"fila {n}: {', '.join(map(fmt, clave))} (ya en la fila {primeras[clave]})")
            else:
                primeras[clave] = n

    for regla in esq.get("reglas", []):
        REGLAS_CSV[regla["regla"]](regla, convertidas, ctx, res, faltantes)

    for (col, entregado, leido), k in alias_usados.items():
        res.aviso(f"{col}: {k} celdas «{entregado}» se leyeron como «{leido}» (equivalencia acordada; "
                  "el archivo se copia tal cual)")

    total = len(convertidas)
    tiene_maximo = any(r["regla"] == "faltantes_max" for r in esq.get("reglas", []))
    for col, k in faltantes.items():
        if not tiene_maximo:
            res.aviso(f"{col}: {k} faltantes de {total} filas ({k / total:.1%})")

    ids_esperados = any(c.get("id_parcela") for c in columnas.values())
    if ids_esperados and ctx.ids is not None:
        sin_fila = ctx.ids - ids_vistos
        if sin_fila:
            res.aviso(f"{len(sin_fila)} de {len(ctx.ids)} parcelas de {E.ARCHIVO_PARCELAS} sin filas en este archivo")
        # Un solo CSV con las dos zonas (las filas se distinguen por el id): parcelas por zona.
        res.info["zonas"] = dict(sorted(Counter(ctx.zona_de_id[i] for i in ids_vistos if i in ctx.zona_de_id).items()))
    return res


def vacio_admitido(campo, celdas, columnas):
    """«nulo_si»: la celda puede venir vacía solo si otra columna de la fila trae uno de los
    valores dados (p. ej., prob_max vacío con acuerdo_metodos «1/1»)."""
    cond = campo.get("nulo_si")
    if not cond:
        return False
    otra = cond["columna"]
    estado, valor, _ = leer_celda(celdas.get(otra, ""), columnas.get(otra, {"tipo": "texto"}))
    return estado == VALIDO and en_lista(valor, cond["valores"])


def texto_vacio_no_permitido(col, campo):
    cond = campo.get("nulo_si")
    if cond:
        return f"{col}: celda vacía no permitida salvo con {cond['columna']} {' o '.join(cond['valores'])}"
    return f"{col}: celda vacía no permitida"


def regla_orden(regla, filas, ctx, res, faltantes):
    """c1 ≤ c2 ≤ … en cada fila (solo entre los valores presentes)."""
    cols = regla["columnas"]
    texto = " ≤ ".join(cols)
    for n, fila in filas:
        presentes = [(c, fila[c]) for c in cols if es_numero(fila.get(c))]
        for (ca, va), (cb, vb) in zip(presentes, presentes[1:]):
            if va > vb:
                res.motivo(f"no se cumple {texto}", f"fila {n}: {ca}={fmt(va)} > {cb}={fmt(vb)}")
                break


def regla_rango_por_banda(regla, filas, ctx, res, faltantes):
    """Rango de mediana, p25 y p75 según la banda (índices y reflectancias)."""
    desconocidas = set()
    for n, fila in filas:
        banda = fila.get(regla["columna_banda"])
        if banda is None:
            continue
        grupo = next((g for g in regla["grupos"] if banda.lower() in g["bandas"]), None)
        if grupo is None:
            desconocidas.add(banda)
            continue
        for col in regla["columnas"]:
            v = fila.get(col)
            if es_numero(v) and not (grupo["min"] <= v <= grupo["max"]):
                res.motivo(f"{col} de {banda} ({grupo['nombre']}) fuera de [{fmt(grupo['min'])}, {fmt(grupo['max'])}]",
                           f"fila {n}: {fmt(v)}")
    if desconocidas:
        res.aviso(f"bandas sin rango conocido (no se validó su rango): {', '.join(sorted(desconocidas))}")


def regla_dias_ventana_por_anio(regla, filas, ctx, res, faltantes):
    """Días de la ventana 1-feb a 30-abr según el año de cada fila (bisiestos: un día más)."""
    ventana = ctx.limites.get("ventana_desnudo")
    if ventana is None:
        res.aviso("data/params.json no trae suelo.ventana_desnudo: no se comprobó el máximo de días por año")
        return
    col, col_anio = regla["columna"], regla["anio"]
    for n, fila in filas:
        v, anio = fila.get(col), fila.get(col_anio)
        if es_numero(v) and isinstance(anio, int):
            maximo = dias_ventana(anio, ventana)
            if v > maximo:
                res.motivo(f"{col} mayor que los días de la ventana {ventana['inicio']} a {ventana['fin']} del año",
                           f"fila {n}: {fmt(v)} > {maximo} en {anio}")


def regla_abstencion_a42(regla, filas, ctx, res, faltantes):
    """Kit A4.2: abstención si prob_max < umbral, si los métodos no coinciden o si
    ftw_confianza < umbral; la parcela abstenida lleva cultivo_actual = sin_clasificar."""
    umbral = ctx.limites.get("umbral_abstencion")
    ftw_min = ctx.limites.get("ftw_confianza_min")
    if umbral is None or ftw_min is None:
        res.aviso("data/params.json no trae mapa.umbral_abstencion o mapa.ftw_confianza_min: "
                  "la regla de abstención se revisa sin esos umbrales")
    for n, fila in filas:
        prob, acuerdo, abst, cultivo = (fila.get(c) for c in ("prob_max", "acuerdo_metodos", "abstencion", "cultivo_actual"))
        if not isinstance(abst, bool):
            continue
        razones = []
        if umbral is not None and es_numero(prob) and prob < umbral:
            razones.append(f"prob_max {fmt(prob)} < {fmt(umbral)}")
        if isinstance(acuerdo, tuple) and acuerdo[0] < acuerdo[1]:
            razones.append(f"métodos {acuerdo[0]}/{acuerdo[1]}")
        ftw = (ctx.props.get(fila.get("id")) or {}).get("ftw_confianza")
        if ftw_min is not None and es_numero(ftw) and ftw < ftw_min:
            razones.append(f"ftw_confianza {fmt(ftw)} < {fmt(ftw_min)}")
        if razones and not abst:
            res.motivo("abstencion debe ser true (kit A4.2)", f"fila {n}: {', '.join(razones)}")
        if abst and cultivo != "sin_clasificar":
            res.motivo("parcela abstenida con cultivo_actual distinto de sin_clasificar (kit A4.2)",
                       f"fila {n}: {cultivo}")
        if not abst and cultivo == "sin_clasificar":
            res.motivo("cultivo_actual sin_clasificar con abstencion = false (kit A4.2)", f"fila {n}")
        # Sin cultivo no hay edad de la perenne ni estado del plazo (acuerdo de formatos).
        for col in regla.get("vacias_si_abstenida", ()):
            if abst and fila.get(col) is not None:
                res.motivo(f"parcela abstenida con {col} (debe ir vacío)", f"fila {n}: {fmt(fila[col])}")


def regla_un_solo_valor_por(regla, filas, ctx, res, faltantes):
    """Cada valor de «clave» tiene un solo valor de «valor» (p. ej., un bloque, un solo uso)."""
    clave, valor = regla["clave"], regla["valor"]
    mapa = {}
    for _, fila in filas:
        if fila.get(clave) is not None and fila.get(valor) is not None:
            mapa.setdefault(fila[clave], set()).add(fila[valor])
    for k, valores in mapa.items():
        if len(valores) > 1:
            res.motivo(f"un mismo {clave} con más de un {valor}", f"{clave} {k}: {', '.join(sorted(valores))}")


def regla_faltantes_max(regla, filas, ctx, res, faltantes):
    """Faltantes (−999 de POWER o vacíos) por columna: se cuentan y se reportan; se
    rechaza el archivo si alguna columna llega a la fracción máxima."""
    total = len(filas)
    for col, k in faltantes.items():
        fraccion = k / total
        if fraccion >= regla["fraccion"]:
            res.motivo(f"{col}: {k} de {total} filas faltantes ({fraccion:.1%}); se admite menos de {regla['fraccion']:.0%}")
        else:
            res.aviso(f"{col}: {k} faltantes de {total} filas ({fraccion:.1%}); se admite menos de {regla['fraccion']:.0%}")


def regla_combinacion_permitida(regla, filas, ctx, res, faltantes):
    """La combinación de «columnas» de cada fila es una de las filas de «permitidas», la tabla
    cerrada de «tabla» (contexto_regional.csv: fuente, variable y unidad). Una fila con alguna
    de esas celdas vacía o mal escrita ya tiene su motivo y aquí se salta."""
    cols = regla["columnas"]
    permitidas = {tuple(p) for p in regla["permitidas"]}
    for n, fila in filas:
        clave = tuple(fila.get(c) for c in cols)
        if any(v is None for v in clave):
            continue
        if clave not in permitidas:
            res.motivo(f"la combinación de ({', '.join(cols)}) no está en la tabla de {regla['tabla']}",
                       f"fila {n}: {', '.join(map(fmt, clave))}")


def regla_rango_segun(regla, filas, ctx, res, faltantes):
    """Cota inclusiva de «columna» según el valor de otra columna de la fila (el valor según su
    unidad o su variable). Cada grupo: {"segun": columna, "valores": (...), "min", "max"}; una de
    las dos cotas puede faltar. Lo que no cae en ningún grupo no tiene cota (no se inventa)."""
    col = regla["columna"]
    for n, fila in filas:
        v = fila.get(col)
        if not es_numero(v):
            continue
        for g in regla["grupos"]:
            segun = fila.get(g["segun"])
            if segun not in g["valores"]:
                continue
            mn, mx = g.get("min"), g.get("max")
            if (mn is None or v >= mn) and (mx is None or v <= mx):
                continue
            if mn is not None and mx is not None:
                cota_txt = f"fuera de [{fmt(mn)}, {fmt(mx)}]"
            else:
                cota_txt = f"menor que {fmt(mn)}" if mn is not None else f"mayor que {fmt(mx)}"
            res.motivo(f"{col} con {g['segun']} «{segun}» {cota_txt}", f"fila {n}: {fmt(v)}")


def regla_vacias_segun(regla, filas, ctx, res, faltantes):
    """Las «columnas» van vacías cuando «columna» vale «valor» (sin disparos de GEDI no hay
    altura; sin escenas no hay ET) y, con «llenas_si_no», traen valor en cualquier otro caso."""
    col, valor = regla["columna"], regla["valor"]
    for n, fila in filas:
        v = fila.get(col)
        if v is None:
            continue
        for c in regla["columnas"]:
            if v == valor and fila.get(c) is not None:
                res.motivo(f"{c} debe ir vacío cuando {col} = {fmt(valor)}", f"fila {n}: {fmt(fila[c])}")
            elif v != valor and regla.get("llenas_si_no") and fila.get(c) is None:
                res.motivo(f"{c} sin valor con {col} distinto de {fmt(valor)}", f"fila {n}: {col} = {fmt(v)}")


REGLAS_CSV = {
    "orden": regla_orden,
    "rango_por_banda": regla_rango_por_banda,
    "dias_ventana_por_anio": regla_dias_ventana_por_anio,
    "abstencion_a42": regla_abstencion_a42,
    "un_solo_valor_por": regla_un_solo_valor_por,
    "faltantes_max": regla_faltantes_max,
    # Bases de datos del reto (docs/decisiones/2026-11-14_recursos_del_reto.md).
    "combinacion_permitida": regla_combinacion_permitida,
    "rango_segun": regla_rango_segun,
    "vacias_segun": regla_vacias_segun,
}


# =========================================================================================
# GeoJSON
# =========================================================================================
def _posicion(p):
    if not isinstance(p, (list, tuple)) or len(p) < 2 or not all(es_numero(c) for c in p[:2]):
        return "posición que no es [lon, lat] numérica"
    if not (-180 <= p[0] <= 180 and -90 <= p[1] <= 90):
        return f"[{fmt(p[0])}, {fmt(p[1])}] fuera de lon/lat (¿coordenadas proyectadas?)"
    return None


def _linea(linea, minimo, puntos):
    if not isinstance(linea, (list, tuple)) or len(linea) < minimo:
        return f"línea o anillo con menos de {minimo} posiciones"
    for p in linea:
        error = _posicion(p)
        if error:
            return error
        puntos.append(p)
    return None


def _anillos(poligono, puntos):
    if not isinstance(poligono, (list, tuple)) or not poligono:
        return "polígono sin anillos"
    for anillo in poligono:
        error = _linea(anillo, 4, puntos)
        if error:
            return error
        if list(anillo[0][:2]) != list(anillo[-1][:2]):
            return "anillo sin cerrar (la primera y la última posición difieren)"
    return None


def revisar_coordenadas(tipo, coords):
    """(error o None, [oeste, sur, este, norte]) de una geometría."""
    puntos = []
    if tipo == "Polygon":
        error = _anillos(coords, puntos)
    elif tipo == "MultiPolygon":
        error = None if isinstance(coords, (list, tuple)) and coords else "MultiPolygon vacío"
        for poligono in coords or []:
            error = error or _anillos(poligono, puntos)
    elif tipo == "LineString":
        error = _linea(coords, 2, puntos)
    elif tipo == "MultiLineString":
        error = None if isinstance(coords, (list, tuple)) and coords else "MultiLineString vacío"
        for linea in coords or []:
            error = error or _linea(linea, 2, puntos)
    else:
        error = f"tipo de geometría no revisado: {tipo}"
    if error or not puntos:
        return error or "sin posiciones", None
    xs, ys = [p[0] for p in puntos], [p[1] for p in puntos]
    return None, [min(xs), min(ys), max(xs), max(ys)]


def validar_geojson(ruta, esq, ctx):
    res = Resultado()
    tam_max = esq.get("tamano_max_bytes")
    tam = ruta.stat().st_size
    if tam_max and tam >= tam_max:
        res.motivo(f"pesa {tam:,} bytes; debe pesar menos de {tam_max:,} bytes")
    try:
        obj = json.loads(ruta.read_text(encoding="utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as ex:
        res.motivo(f"no es JSON válido: {ex}")
        return res
    if not isinstance(obj, dict) or obj.get("type") != "FeatureCollection":
        res.motivo("no es un FeatureCollection de GeoJSON")
        return res
    crs = obj.get("crs")
    if crs is not None and not re.search(r"4326|CRS84", json.dumps(crs)):
        res.motivo(f"declara un crs distinto de EPSG:4326 / CRS84: {json.dumps(crs)[:120]}")
    features = obj.get("features")
    if not isinstance(features, list) or not features:
        res.motivo("no trae features")
        return res
    res.info["features"] = len(features)

    geometrias = esq["geometrias"]
    propiedades = esq.get("propiedades", {})
    zonas = ctx.limites.get("zonas")
    con_zona = "zona" in propiedades          # la propiedad «zona» está en el esquema
    vistos = {p: {} for p, campo in propiedades.items() if campo.get("unico")}
    props_por_id, fuera_bbox, protagonistas = {}, 0, 0
    zona_de_id, cajas_zona, cuenta_zonas = {}, {}, Counter()
    for i, f in enumerate(features):
        if not isinstance(f, dict) or f.get("type") != "Feature":
            res.motivo("elemento de features que no es un Feature", f"feature {i}")
            continue
        p = f.get("properties") if isinstance(f.get("properties"), dict) else None
        donde = f"feature {i}" + (f" (id {p.get('id')})" if p and p.get("id") is not None else "")
        # Zona del feature: la propiedad «zona» si viene; si no, la zona por omisión.
        if p is not None and "zona" in p:
            zona = p["zona"].strip() if isinstance(p["zona"], str) else p["zona"]
        else:
            zona = E.ZONA_POR_OMISION
        zona_conocida = isinstance(zona, str) and bool(zona) and (zonas is None or zona in zonas)
        g, caja = f.get("geometry"), None
        if not isinstance(g, dict):
            res.motivo("geometría nula o ausente", donde)
        elif g.get("type") not in geometrias:
            res.motivo(f"geometría {g.get('type')} no permitida (se aceptan {', '.join(geometrias)})", donde)
        else:
            error, caja = revisar_coordenadas(g["type"], g.get("coordinates"))
            if error:
                res.motivo(f"coordenadas inválidas: {error}", donde)
                caja = None
            elif esq.get("avisar_fuera_de_bbox") and zona_conocida:
                bbox = ctx.rectangulo(zona)[0]
                if bbox and not caja_dentro(caja, bbox):
                    fuera_bbox += 1
        if not propiedades:
            continue
        if p is None:
            if any(not campo.get("opcional") for campo in propiedades.values()):
                res.motivo("feature sin properties", donde)
            elif con_zona:
                cuenta_zonas[zona] += 1      # sin properties = sin «zona»: la zona por omisión
            continue
        for nombre, campo in propiedades.items():
            if nombre not in p:
                if not campo.get("opcional"):
                    res.motivo(f"falta la propiedad {nombre}", donde)
                continue
            estado, valor, error = leer_valor_json(p[nombre], campo)
            if estado == ERROR:
                res.motivo(f"{nombre}: {error}", f"{donde}: {p[nombre]!r}")
            elif estado == VACIO:
                if not campo.get("nulo"):
                    res.motivo(f"{nombre}: vacío o null no permitido", donde)
            else:
                revisar_valor(nombre, valor, campo, ctx, res, f"{donde}: {fmt(valor)}")
                if nombre in vistos:
                    if valor in vistos[nombre]:
                        res.motivo(f"{nombre} repetido", f"{donde} (ya en feature {vistos[nombre][valor]})")
                    else:
                        vistos[nombre][valor] = i
        if esq.get("por_zona") and "zona" in p and zona_conocida:
            revisar_parcela_en_zona(p, g if caja else None, zona, ctx, res, donde)
        if con_zona and zona_conocida:
            cuenta_zonas[zona] += 1
            if caja:
                previa = cajas_zona.get(zona)
                cajas_zona[zona] = caja if previa is None else [min(previa[0], caja[0]), min(previa[1], caja[1]),
                                                                max(previa[2], caja[2]), max(previa[3], caja[3])]
        if p.get("protagonista") is True:
            protagonistas += 1
        if isinstance(p.get("id"), str):
            props_por_id[p["id"].strip()] = p
            if zona_conocida:
                zona_de_id[p["id"].strip()] = zona

    if fuera_bbox:
        if zonas is None:
            res.aviso(f"{fuera_bbox} features con vértices fuera de zona_piloto.bbox de data/params.json "
                      "(B1 recorta al rectángulo; revisar)")
        else:
            res.aviso(f"{fuera_bbox} features con vértices fuera del rectángulo de su zona (zona_piloto.zonas "
                      f"de data/params.json; sin «zona» = {E.ZONA_POR_OMISION}; B1 recorta al rectángulo; revisar)")
    if con_zona and zonas is None and any("zona" in (f.get("properties") or {}) for f in features if isinstance(f, dict)):
        res.aviso("data/params.json no trae zona_piloto.zonas: no se comprobaron el prefijo del id ni el "
                  "rectángulo de cada zona")
    esperadas = esq.get("protagonistas_esperadas")
    if esperadas is not None and protagonistas != esperadas:
        res.aviso(f"trae {protagonistas} protagonistas; el kit (B1) pide {esperadas}")
    if con_zona:
        res.info["zonas"] = dict(sorted(cuenta_zonas.items()))
    if esq.get("es_referencia_ids"):
        res.info["ids"] = set(props_por_id)
        res.info["props"] = props_por_id
        res.info["zona_de_id"] = zona_de_id
        res.info["cajas_zona"] = cajas_zona
    return res


def caja_dentro(caja, bbox):
    """True si la caja [oeste, sur, este, norte] cae completa dentro de bbox."""
    return caja[0] >= bbox[0] and caja[1] >= bbox[1] and caja[2] <= bbox[2] and caja[3] <= bbox[3]


def centroide_vertices(geometria):
    """Promedio simple de los vértices del anillo exterior (sin repetir el de cierre); en un
    MultiPolygon, de los anillos exteriores de todos sus polígonos. Basta para saber en qué
    rectángulo cae la parcela (decisión de dos zonas). None si no es un polígono."""
    tipo, coords = geometria.get("type"), geometria.get("coordinates")
    if tipo not in ("Polygon", "MultiPolygon"):
        return None
    puntos = []
    for poligono in ([coords] if tipo == "Polygon" else coords):
        anillo = poligono[0]
        puntos.extend(anillo[:-1] if list(anillo[0][:2]) == list(anillo[-1][:2]) else anillo)
    return [sum(p[0] for p in puntos) / len(puntos), sum(p[1] for p in puntos) / len(puntos)]


def revisar_parcela_en_zona(p, geometria, zona, ctx, res, donde):
    """Parcela con «zona» (decisión de dos zonas): el id empieza con el prefijo_id de la zona y
    el centroide cae en su rectángulo. Si params no trae zonas, no se comprueba (se avisa una vez
    al final de validar_geojson)."""
    datos = (ctx.limites.get("zonas") or {}).get(zona)
    if datos is None:
        return
    prefijo, pid = datos["prefijo_id"], p.get("id")
    if prefijo is None:
        res.aviso(f"zona_piloto.zonas no trae el prefijo_id de la zona {zona}: no se comprobó el prefijo de sus id")
    elif isinstance(pid, str) and not pid.strip().startswith(prefijo):
        res.motivo(f"id sin el prefijo «{prefijo}» de su zona {zona}", donde)
    if geometria is None:
        return
    bbox, rotulo = ctx.rectangulo(zona)
    if bbox is None:
        res.aviso(f"{rotulo} de data/params.json es null o no está: no se comprobó que sus parcelas caigan dentro")
        return
    c = centroide_vertices(geometria)
    if c and not (bbox[0] <= c[0] <= bbox[2] and bbox[1] <= c[1] <= bbox[3]):
        res.motivo(f"centroide fuera del rectángulo de su zona {zona} {bbox} (zona_piloto.zonas)",
                   f"{donde}: centroide [{c[0]:.5f}, {c[1]:.5f}]")


# =========================================================================================
# GeoTIFF (NASADEM): Pillow o un lector mínimo de etiquetas TIFF
# =========================================================================================
# Tipos de campo TIFF 6.0 y BigTIFF: (formato de struct, bytes, es racional).
TIPOS_TIFF = {1: ("B", 1, False), 2: ("s", 1, False), 3: ("H", 2, False), 4: ("I", 4, False),
              5: ("I", 8, True), 6: ("b", 1, False), 7: ("B", 1, False), 8: ("h", 2, False),
              9: ("i", 4, False), 10: ("i", 8, True), 11: ("f", 4, False), 12: ("d", 8, False),
              16: ("Q", 8, False), 17: ("q", 8, False), 18: ("Q", 8, False)}
ANCHO_TIFF, ALTO_TIFF = 256, 257   # ImageWidth e ImageLength (TIFF 6.0)


def _etiquetas_buscadas():
    G = E.GEOTIFF
    return (ANCHO_TIFF, ALTO_TIFF, G["tag_geokeys"], G["tag_escala"], G["tag_tiepoint"], G["tag_transformacion"])


def leer_tiff_stdlib(ruta):
    """Lee las etiquetas del primer IFD de un TIFF clásico o BigTIFF (sin decodificar píxeles)."""
    buscadas = set(_etiquetas_buscadas())
    with open(ruta, "rb") as f:
        cabecera = f.read(16)
        if cabecera[:2] == b"II":
            orden = "<"
        elif cabecera[:2] == b"MM":
            orden = ">"
        else:
            raise ValueError("no es TIFF (la firma no es II ni MM)")
        magia = struct.unpack(orden + "H", cabecera[2:4])[0]
        if magia == 42:
            grande, desplazamiento = False, struct.unpack(orden + "I", cabecera[4:8])[0]
        elif magia == 43:
            grande, desplazamiento = True, struct.unpack(orden + "Q", cabecera[8:16])[0]
        else:
            raise ValueError(f"no es TIFF (número mágico {magia})")
        f.seek(desplazamiento)
        n = struct.unpack(orden + ("Q" if grande else "H"), f.read(8 if grande else 2))[0]
        tam_entrada, tam_valor = (20, 8) if grande else (12, 4)
        entradas = f.read(n * tam_entrada)
        if len(entradas) < n * tam_entrada:
            raise ValueError("directorio de etiquetas truncado")
        etiquetas = {}
        for k in range(n):
            e = entradas[k * tam_entrada:(k + 1) * tam_entrada]
            etiqueta, tipo = struct.unpack(orden + "HH", e[:4])
            if etiqueta not in buscadas or tipo not in TIPOS_TIFF:
                continue
            cuenta = struct.unpack(orden + ("Q" if grande else "I"), e[4:4 + tam_valor])[0]
            campo = e[4 + tam_valor:]
            formato, tam_tipo, racional = TIPOS_TIFF[tipo]
            total = cuenta * tam_tipo
            if total <= tam_valor:
                datos = campo[:total]
            else:
                f.seek(struct.unpack(orden + ("Q" if grande else "I"), campo)[0])
                datos = f.read(total)
                if len(datos) < total:
                    raise ValueError(f"etiqueta {etiqueta} truncada")
            if tipo == 2:
                etiquetas[etiqueta] = (datos.rstrip(b"\0").decode("latin-1"),)
            elif racional:
                nums = struct.unpack(orden + formato * (2 * cuenta), datos)
                etiquetas[etiqueta] = tuple(nums[i] / nums[i + 1] if nums[i + 1] else math.nan
                                            for i in range(0, len(nums), 2))
            else:
                etiquetas[etiqueta] = struct.unpack(orden + formato * cuenta, datos)
    if ANCHO_TIFF not in etiquetas or ALTO_TIFF not in etiquetas:
        raise ValueError("faltan ImageWidth o ImageLength")
    return {"lector": "biblioteca estándar (Pillow no está instalado)",
            "ancho": int(etiquetas[ANCHO_TIFF][0]), "alto": int(etiquetas[ALTO_TIFF][0]),
            "etiquetas": etiquetas}


def leer_tiff_pillow(ruta):
    """Abre el TIFF con Pillow y devuelve tamaño y etiquetas GeoTIFF (como tuplas)."""
    import PIL
    from PIL import Image
    with Image.open(ruta) as im:
        if im.format != "TIFF":
            raise ValueError(f"Pillow lo reconoce como {im.format}, no como TIFF")
        etiquetas = {}
        for t in _etiquetas_buscadas():
            v = im.tag_v2.get(t)
            if v is not None:
                etiquetas[t] = tuple(v) if isinstance(v, (tuple, list)) else (v,)
        return {"lector": f"Pillow {PIL.__version__}", "ancho": im.size[0], "alto": im.size[1],
                "etiquetas": etiquetas}


def leer_tiff(ruta):
    try:
        import PIL  # noqa: F401
    except ImportError:
        return leer_tiff_stdlib(ruta)
    return leer_tiff_pillow(ruta)


def leer_geokeys(valores):
    """GeoKeyDirectory: {KeyID: valor}. Solo valores en línea (TIFFTagLocation = 0)."""
    if len(valores) < 4:
        return None, "GeoKeyDirectoryTag con menos de 4 valores"
    n = int(valores[3])
    if len(valores) < 4 + 4 * n:
        return None, "GeoKeyDirectoryTag truncado"
    claves = {}
    for k in range(n):
        clave, lugar, _, valor = (int(x) for x in valores[4 + 4 * k:8 + 4 * k])
        claves[clave] = valor if lugar == 0 else None
    return claves, None


def validar_geotiff(ruta, esq, ctx):
    res = Resultado()
    G = E.GEOTIFF
    try:
        tif = leer_tiff(ruta)
    except Exception as ex:  # noqa: BLE001 - cualquier error de lectura es motivo de rechazo
        quien = "Pillow" if "PIL" in sys.modules else "el lector de la biblioteca estándar"
        res.motivo(f"{quien} no pudo leerlo como TIFF: {type(ex).__name__}: {ex}")
        return res
    res.info.update({"lector": tif["lector"], "ancho": tif["ancho"], "alto": tif["alto"]})
    if tif["lector"].startswith("biblioteca"):
        res.aviso("Pillow no está instalado: las etiquetas se leyeron con el lector mínimo de la biblioteca estándar")
    et = tif["etiquetas"]

    raster = None
    geokeys = et.get(G["tag_geokeys"])
    if not geokeys:
        res.motivo(f"sin GeoKeyDirectoryTag ({G['tag_geokeys']}): el TIFF no está georreferenciado")
    else:
        claves, error = leer_geokeys(geokeys)
        if error:
            res.motivo(error)
        else:
            epsg = claves.get(G["geokey_geografico"])
            if epsg != G["epsg"]:
                extra = (f"; trae ProjectedCSTypeGeoKey ({G['geokey_proyectado']}) = {claves[G['geokey_proyectado']]}"
                         if G["geokey_proyectado"] in claves else "")
                res.motivo(f"GeographicTypeGeoKey ({G['geokey_geografico']}) = {epsg}; se esperaba EPSG {G['epsg']}{extra}")
            modelo = claves.get(G["geokey_modelo"])
            if modelo is not None and modelo != G["modelo_geografico"]:
                res.aviso(f"GTModelTypeGeoKey ({G['geokey_modelo']}) = {modelo}; se esperaba {G['modelo_geografico']} (geográfico)")
            raster = claves.get(G["geokey_raster"])

    escala, amarre = et.get(G["tag_escala"]), et.get(G["tag_tiepoint"])
    if escala is None or amarre is None:
        faltan = [f"{nombre} ({t})" for nombre, t, v in (("ModelPixelScaleTag", G["tag_escala"], escala),
                                                       ("ModelTiepointTag", G["tag_tiepoint"], amarre)) if v is None]
        extra = (f"; trae ModelTransformationTag ({G['tag_transformacion']}), que aquí no se acepta"
                 if G["tag_transformacion"] in et else "")
        res.motivo(f"sin {' ni '.join(faltan)}: no se puede ubicar la malla{extra}")
        return res
    if len(escala) < 2 or len(amarre) < 6:
        res.motivo("ModelPixelScaleTag o ModelTiepointTag incompletos")
        return res
    sx, sy = float(escala[0]), float(escala[1])
    objetivo = G["escala_arcoseg"] / 3600
    escala_ok = True
    for eje, s in (("X", sx), ("Y", sy)):
        if not (s > 0) or abs(s - objetivo) > G["tolerancia_escala"] * objetivo:
            escala_ok = False
            res.motivo(f"escala del píxel en {eje} = {s:.8g}° ({s * 3600:.3g}″); se esperaba "
                       f"≈ {fmt(G['escala_arcoseg'])}″ ± {G['tolerancia_escala']:.0%} (~30 m)")
    i, j, _, x, y, _ = (float(v) for v in amarre[:6])
    oeste, norte = x - i * sx, y + j * sy
    if raster == G["raster_punto"]:      # PixelIsPoint: el amarre es el centro del píxel
        oeste, norte = oeste - sx / 2, norte + sy / 2
    este, sur = oeste + tif["ancho"] * sx, norte - tif["alto"] * sy
    extension = [oeste, sur, este, norte]
    res.info["extension"] = extension
    # Cada NASADEM cubre el rectángulo de SU zona (sufijo; sin sufijo = la zona por omisión).
    zona = ctx.zona_archivo or E.ZONA_POR_OMISION
    bbox, rotulo = ctx.rectangulo(zona)
    if bbox is None:
        res.aviso(f"{rotulo} de data/params.json es null o no está: no se comprobó que la extensión cubra la zona")
    elif escala_ok:
        tol = sx / 2   # medio píxel de holgura en los bordes

        def cubre(caja):
            return (oeste <= caja[0] + tol and sur <= caja[1] + tol and este >= caja[2] - tol
                    and norte >= caja[3] - tol)

        if not cubre(bbox):
            texto = f"la extensión [{oeste:.5f}, {sur:.5f}, {este:.5f}, {norte:.5f}] no cubre {rotulo} {bbox}"
            # Compatibilidad: si cubre todas las parcelas de su zona en el parcelas_base.geojson de
            # esta corrida, entra con un aviso (se exportó antes de ampliar el rectángulo).
            caja = ctx.cajas_zona.get(zona)
            if caja and cubre(caja):
                res.aviso(f"{texto}; sí cubre las {ctx.n_parcelas_zona.get(zona, 0)} parcelas de la zona {zona} "
                          f"en {E.ARCHIVO_PARCELAS} (vértices en [{caja[0]:.5f}, {caja[1]:.5f}, {caja[2]:.5f}, "
                          f"{caja[3]:.5f}]): entra; re-exportar NASADEM con el rectángulo de la zona")
            elif caja:
                res.motivo(f"{texto} ni las parcelas de la zona {zona} en {E.ARCHIVO_PARCELAS} "
                           f"(vértices en [{caja[0]:.5f}, {caja[1]:.5f}, {caja[2]:.5f}, {caja[3]:.5f}])")
            else:
                res.motivo(texto)
    return res


# =========================================================================================
# JSON (heladas, dotaciones, supuestos, rotaciones y objetos con «campos»)
# Cada regla recibe (obj, ctx, res, esq): esq es el esquema del archivo (motor/esquemas.py).
# =========================================================================================
def _texto_lleno(v):
    return isinstance(v, str) and bool(v.strip())


def _revisar_orden(valores, orden, res, nombre, donde):
    """c1 ≤ c2 ≤ … entre los valores numéricos presentes de un objeto JSON."""
    presentes = [(c, valores.get(c)) for c in orden if es_numero(valores.get(c))]
    for (ca, va), (cb, vb) in zip(presentes, presentes[1:]):
        if va > vb:
            prefijo = f"{donde}: " if donde else ""
            res.motivo(f"{nombre}: no se cumple {' ≤ '.join(orden)}", f"{prefijo}{ca}={fmt(va)} > {cb}={fmt(vb)}")
            return


def revisar_objeto(obj, campos, ctx, res, ruta="", donde=None):
    """Valida las llaves de un objeto JSON contra «campos» (vocabulario de motor/esquemas.py:
    tipos de campo más «objeto» y «lista»). ruta: prefijo de los nombres en los motivos
    (p. ej. «tormenta.»); donde: a qué elemento pertenece (p. ej. «rotación alfalfa»)."""
    for nombre, campo in campos.items():
        nom = f"{ruta}{nombre}"
        if nombre not in obj:
            res.motivo(f"falta {nom}", donde)
            continue
        v, tipo = obj[nombre], campo["tipo"]
        if tipo == "objeto":
            if not isinstance(v, dict):
                res.motivo(f"{nom} debe ser un objeto", donde)
                continue
            if campo.get("llaves_exactas") and set(v) != set(campo["campos"]):
                prefijo = f"{donde}: " if donde else ""
                res.motivo(f"{nom}: se esperan exactamente las llaves {', '.join(campo['campos'])}",
                           f"{prefijo}trae {', '.join(map(str, v)) or 'ninguna'}")
            revisar_objeto(v, campo["campos"], ctx, res, f"{nom}.", donde)
            if campo.get("orden"):
                _revisar_orden(v, campo["orden"], res, nom, donde)
        elif tipo == "lista":
            if not isinstance(v, list):
                res.motivo(f"{nom} debe ser una lista", donde)
            elif not v and not campo.get("vacia"):
                res.motivo(f"{nom}: lista vacía", donde)
            else:
                for elemento in v:
                    _revisar_valor_json(nom, elemento, campo["elemento"], ctx, res, donde)
        else:
            _revisar_valor_json(nom, v, campo, ctx, res, donde)


def _revisar_valor_json(nombre, v, campo, ctx, res, donde):
    """Tipo, vacío, rango y lista de un valor suelto de JSON."""
    estado, valor, error = leer_valor_json(v, campo)
    prefijo = f"{donde}: " if donde else ""
    if estado == ERROR:
        res.motivo(f"{nombre}: {error}", f"{prefijo}{v!r}"[:120])
    elif estado == VACIO:
        if not campo.get("nulo"):
            res.motivo(f"{nombre}: vacío o null no permitido", donde)
    else:
        revisar_valor(nombre, valor, campo, ctx, res, f"{prefijo}{fmt(valor)}")


def regla_objeto(obj, ctx, res, esq):
    """Objeto JSON con llaves fijas (relieve_meta.json): valida esq["campos"]."""
    if not isinstance(obj, dict):
        res.motivo("no es un objeto JSON")
        return
    revisar_objeto(obj, esq["campos"], ctx, res)


def regla_heladas(obj, ctx, res, esq=None):
    if not isinstance(obj, dict):
        res.motivo("no es un objeto JSON")
        return
    for bloque in ("ultima_primavera", "primera_otono"):
        b = obj.get(bloque)
        if not isinstance(b, dict) or any(p not in b for p in ("p10", "p50", "p90")):
            res.motivo(f"{bloque}: faltan p10, p50 o p90")
            continue
        vals = [b["p10"], b["p50"], b["p90"]]
        if all(es_numero(v) for v in vals) or all(isinstance(v, str) and (es_mes_dia(v) or es_fecha(v)) for v in vals):
            if not (vals[0] <= vals[1] <= vals[2]):
                res.motivo(f"{bloque}: no se cumple p10 ≤ p50 ≤ p90", f"{vals}")
        else:
            res.aviso(f"{bloque}: no se pudo comprobar p10 ≤ p50 ≤ p90 (valores {vals})")
    prob = obj.get("prob_helada_despues_de")
    if not isinstance(prob, dict) or not prob:
        res.motivo("falta prob_helada_despues_de (objeto {\"MM-DD\": probabilidad})")
    else:
        for fecha, p in prob.items():
            if not es_mes_dia(fecha):
                res.motivo("prob_helada_despues_de: llave que no es MM-DD", fecha)
            if not es_numero(p) or not (0 <= p <= 1):
                res.motivo("prob_helada_despues_de: probabilidad fuera de [0, 1]", f"{fecha}: {p}")
    if not _texto_lleno(obj.get("fuente")):
        res.motivo("falta fuente")


def regla_dotaciones(obj, ctx, res, esq=None):
    lim = ctx.limites
    if not isinstance(obj, dict) or not isinstance(obj.get("dotaciones"), dict):
        res.motivo("falta el bloque «dotaciones» del contrato (kit §2.3)")
        return
    d = obj["dotaciones"]
    if d.get("unidad") != "millares_por_ha":
        res.motivo(f"dotaciones.unidad = {d.get('unidad')!r}; el contrato pide 'millares_por_ha'")
    if not _texto_lleno(d.get("equivalencia")):
        res.motivo("falta dotaciones.equivalencia")
    des = d.get("deslizador")
    if not isinstance(des, dict) or not all(es_numero(des.get(k)) for k in ("min", "max", "paso")):
        res.motivo("dotaciones.deslizador debe traer min, max y paso numéricos")
    else:
        if not des["min"] < des["max"] or not des["paso"] > 0:
            res.motivo("dotaciones.deslizador: se espera min < max y paso > 0", f"{des}")
        if (lim["deslizador_min"], lim["deslizador_max"]) != (des["min"], des["max"]):
            res.aviso(f"el deslizador entregado [{fmt(des['min'])}, {fmt(des['max'])}] difiere del de "
                      f"data/params.json [{lim['deslizador_min']}, {lim['deslizador_max']}]")
    marcas = d.get("marcas")
    if not isinstance(marcas, list) or not marcas:
        res.motivo("faltan dotaciones.marcas")
    else:
        ids = sorted(str(m.get("id")) for m in marcas if isinstance(m, dict))
        if ids != sorted(E.MARCAS) or len(marcas) != len(E.MARCAS):
            res.motivo(f"dotaciones.marcas trae {ids}; el contrato pide {sorted(E.MARCAS)}")
        dmin, dmax = lim["deslizador_min"], lim["deslizador_max"]
        if dmin is None or dmax is None:
            res.aviso("data/params.json no trae dotaciones.deslizador: no se comprobó que las marcas caigan dentro")
        for m in marcas:
            if not isinstance(m, dict):
                res.motivo("marca que no es objeto")
                continue
            mid = m.get("id")
            for campo in ("nombre", "fuente", "etiqueta"):
                if not _texto_lleno(m.get(campo)):
                    res.motivo(f"marca {mid}: falta {campo}")
            for campo in ("nota", "fecha_consulta"):
                if campo not in m:
                    res.motivo(f"marca {mid}: falta la llave {campo} (puede ser null)")
            mn, mx, v = m.get("min"), m.get("max"), m.get("valor")
            if not all(es_numero(x) for x in (mn, mx, v)):
                res.motivo(f"marca {mid}: min, max y valor deben ser números")
                continue
            if not mn <= v <= mx:
                res.motivo(f"marca {mid}: valor fuera de su rango", f"{fmt(v)} no está en [{fmt(mn)}, {fmt(mx)}]")
            elif not math.isclose(v, (mn + mx) / 2, rel_tol=0, abs_tol=1e-9):
                res.motivo(f"marca {mid}: valor no es el punto medio del rango (kit B2)", f"{fmt(v)}")
            if dmin is not None and dmax is not None and (mn < dmin or mx > dmax):
                res.motivo(f"marca {mid}: rango fuera del deslizador de data/params.json",
                           f"[{fmt(mn)}, {fmt(mx)}] fuera de [{fmt(dmin)}, {fmt(dmax)}]")
    if not _texto_lleno(d.get("punto_medicion")):
        res.aviso("falta dotaciones.punto_medicion")
    dist = obj.get("distrito")
    if dist is None:
        res.aviso("no trae el bloque «distrito» (kit §2.3; B2 paso 3)")
        return
    if not isinstance(dist, dict):
        res.motivo("distrito no es un objeto")
        return
    boq = dist.get("boquilla") or {}
    if not es_numero(boq.get("namo_hm3")) or boq["namo_hm3"] <= 0:
        res.motivo("distrito.boquilla.namo_hm3 debe ser un número positivo")
    if not _texto_lleno(boq.get("fuente_namo")):
        res.motivo("falta distrito.boquilla.fuente_namo")
    alm = boq.get("almacenamiento_hm3")
    if alm is not None:
        if not es_numero(alm) or alm < 0:
            res.motivo("distrito.boquilla.almacenamiento_hm3 debe ser número ≥ 0 o null")
        if not (isinstance(boq.get("fecha_almacenamiento"), str) and es_fecha(boq["fecha_almacenamiento"])):
            res.motivo("almacenamiento_hm3 sin fecha_almacenamiento AAAA-MM-DD")
        if not _texto_lleno(boq.get("fuente_almacenamiento")):
            res.motivo("almacenamiento_hm3 sin fuente_almacenamiento")
    acu = dist.get("acuifero_0831") or {}
    if not es_numero(acu.get("disponibilidad_hm3_anio")):
        res.motivo("distrito.acuifero_0831.disponibilidad_hm3_anio debe ser un número")
    if not _texto_lleno(acu.get("fuente")):
        res.motivo("falta distrito.acuifero_0831.fuente")


# Llaves de un grupo de supuestos que son descripción, no valores.
LLAVES_DESCRIPTIVAS = ("nota", "fuente", "etiqueta", "unidad", "descripcion", "descripción",
                       "fecha", "fecha_consulta", "version", "versión")


def regla_supuestos(obj, ctx, res, esq=None):
    if not isinstance(obj, dict):
        res.motivo("no es un objeto JSON")
        return
    hojas = []

    def recorrer(nodo, ruta):
        if "valor" in nodo or ("min" in nodo and "max" in nodo):
            hojas.append((ruta or "(raíz)", nodo))
            return
        for k, v in nodo.items():
            if k.startswith("_"):
                continue
            sub = f"{ruta}.{k}" if ruta else k
            if isinstance(v, dict):
                recorrer(v, sub)
            elif k not in LLAVES_DESCRIPTIVAS:
                res.motivo("valor suelto sin {valor, fuente, etiqueta}", f"{sub} = {v!r}"[:120])

    recorrer(obj, "")
    if not hojas:
        res.motivo("no trae ningún supuesto con «valor» (o «min» y «max»)")
    for ruta, h in hojas:
        valor = h.get("valor")
        marca = f"{h.get('fuente') or ''} {h.get('etiqueta') or ''}".lower()
        declarado = any(t in marca for t in ("assumption", "supuesto", "[s]", "estimate"))
        if valor is None and not ("min" in h and "max" in h):
            res.aviso(f"{ruta}: valor null (pendiente)")
        elif not _texto_lleno(h.get("fuente")) and not declarado:
            res.motivo("supuesto sin fuente ni marca «assumption»", ruta)
        for rango in (h, valor if isinstance(valor, dict) else {}):
            mn, mx = rango.get("min"), rango.get("max")
            if es_numero(mn) and es_numero(mx) and mn > mx:
                res.motivo("rango con min > max", f"{ruta}: [{fmt(mn)}, {fmt(mx)}]")


def regla_rotaciones(obj, ctx, res, esq):
    """rotaciones.json (A5, acuerdo de formatos del 14-nov-2026): llaves de primer nivel,
    params con valor y etiqueta, y cada rotación según esq["rotacion"] (id único, plazo en su
    lista, plazo_anios min ≤ max, lámina con llaves «0» y «-20» y P10 ≤ P50 ≤ P90). Los
    cultivos de cada rotación deben estar en el objeto «cultivos» del mismo archivo."""
    if not isinstance(obj, dict):
        res.motivo("no es un objeto JSON")
        return
    for llave, tipo in esq["llaves"].items():
        if llave not in obj:
            res.motivo(f"falta la llave {llave}")
        elif tipo == "objeto" and not isinstance(obj[llave], dict):
            res.motivo(f"{llave} debe ser un objeto")
        elif tipo == "lista" and not isinstance(obj[llave], list):
            res.motivo(f"{llave} debe ser una lista")

    params = obj.get("params")
    if isinstance(params, dict):
        for k, p in params.items():
            if str(k).startswith("_"):
                continue
            faltan = [c for c in esq["llaves_param"] if not isinstance(p, dict) or c not in p]
            if faltan:
                res.motivo(f"params: entrada sin {' ni '.join(faltan)}", k)
            elif not _texto_lleno(p.get("etiqueta")):
                res.motivo("params: etiqueta vacía", k)

    rotaciones = obj.get("rotaciones")
    if not isinstance(rotaciones, list):
        return
    if not rotaciones:
        res.motivo("la lista rotaciones está vacía")
        return
    cultivos = obj.get("cultivos") if isinstance(obj.get("cultivos"), dict) else None
    campos = esq["rotacion"]
    vistos = {c: {} for c, campo in campos.items() if campo.get("unico")}
    for i, r in enumerate(rotaciones):
        if not isinstance(r, dict):
            res.motivo("rotación que no es objeto", f"posición {i}")
            continue
        donde = f"rotación {r['id']}" if _texto_lleno(r.get("id")) else f"rotación en la posición {i}"
        revisar_objeto(r, campos, ctx, res, donde=donde)
        for c, ya in vistos.items():
            v = r.get(c)
            if isinstance(v, str) and v.strip():
                if v in ya:
                    res.motivo(f"{c} repetido en rotaciones", f"{v} (posiciones {ya[v]} y {i})")
                else:
                    ya[v] = i
        if cultivos is not None and isinstance(r.get("cultivos"), list):
            for c in r["cultivos"]:
                if isinstance(c, str) and c not in cultivos:
                    res.motivo("rotación con un cultivo que no está en el objeto «cultivos»", f"{donde}: {c}")


REGLAS_JSON = {
    "heladas": regla_heladas,
    "dotaciones": regla_dotaciones,
    "supuestos": regla_supuestos,
    "rotaciones": regla_rotaciones,
    "objeto": regla_objeto,
}


def validar_json(ruta, esq, ctx):
    res = Resultado()
    try:
        obj = json.loads(ruta.read_text(encoding="utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as ex:
        res.motivo(f"no es JSON válido: {ex}")
        return res
    REGLAS_JSON[esq["regla"]](obj, ctx, res, esq)
    return res


# =========================================================================================
# Textos y figuras
# =========================================================================================
def validar_texto(ruta, esq, ctx):
    res = Resultado()
    try:
        texto = ruta.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        res.motivo("no es texto UTF-8")
        return res
    if not texto.strip():
        res.motivo("está vacío")
        return res
    if esq.get("sin_cifras"):
        for n, linea in enumerate(texto.splitlines(), start=1):
            if "AI-assisted" in linea:      # el encabezado obligatorio lleva el año del evento
                continue
            sin_marcadores = re.sub(r"\{\{[^{}]*\}\}", "", linea)
            if re.search(r"\d", sin_marcadores):
                res.motivo("trae cifras escritas a mano (deben ser marcadores {{f1}}, kit tabla 0.4-B)",
                           f"línea {n}: {linea.strip()[:60]}")
    return res


def validar_png(ruta, esq, ctx):
    res = Resultado()
    with open(ruta, "rb") as f:
        if f.read(len(FIRMA_PNG)) != FIRMA_PNG:
            res.motivo("no es PNG (la firma del archivo no coincide)")
    return res


def validar_fuentes_origen(ruta, esq, ctx):
    """fuentes_<pieza>.csv: valida como CSV y guarda las filas para fuentes.json."""
    res = validar_csv(ruta, esq, ctx)
    if not res.motivos():
        with open(ruta, newline="", encoding="utf-8-sig") as f:
            res.info["origen"] = [{c: (fila.get(c) or "").strip() for c in esq["columnas"]}
                                  for fila in csv.DictReader(f) if any((v or "").strip() for v in fila.values())]
    return res


VALIDADORES = {
    "csv": validar_csv,
    "geojson": validar_geojson,
    "geotiff": validar_geotiff,
    "json": validar_json,
    "texto": validar_texto,
    "png": validar_png,
}


def validador_de(esq):
    return validar_fuentes_origen if esq.get("es_fuentes_de_origen") else VALIDADORES[esq["tipo"]]


# =========================================================================================
# LEEME.md e inventario del buzón
# =========================================================================================
def leer_leeme(buzon):
    """(entradas {archivo: {...}}, error_global, avisos). La tabla empieza en el encabezado
    «archivo | fuente | fecha | script» (primera línea de la tabla); se aceptan «|» inicial
    y final y la línea separadora de Markdown. Lo que va antes del encabezado (título,
    comentario, notas) y las líneas sin «|» no cuentan. Sin encabezado, nada entra."""
    ruta = next((p for p in sorted(buzon.iterdir()) if p.is_file() and p.name.lower() == E.NOMBRE_LEEME.lower()), None)
    if ruta is None:
        return {}, f"no hay {E.NOMBRE_LEEME} en la raíz del buzón: ningún archivo puede entrar", []
    try:
        lineas = ruta.read_text(encoding="utf-8-sig").splitlines()
    except UnicodeDecodeError:
        return {}, f"{E.NOMBRE_LEEME} no es texto UTF-8: ningún archivo puede entrar", []
    entradas, avisos, encabezado = {}, [], False
    for n, linea in enumerate(lineas, start=1):
        limpia = linea.strip()
        if "|" not in limpia:
            continue
        if limpia.startswith("|"):
            limpia = limpia[1:]
        if limpia.endswith("|"):
            limpia = limpia[:-1]
        celdas = [c.strip() for c in limpia.split("|")]
        if not encabezado:
            # Antes del encabezado todo es prosa (título, notas), aunque traiga «|».
            encabezado = [c.lower() for c in celdas] == list(E.ENCABEZADO_LEEME)
            continue
        if all(RE_SEPARADOR_MD.match(c) for c in celdas if c) and any(celdas):
            continue
        archivo = PurePosixPath(celdas[0].strip("`").strip().replace("\\", "/")).name if celdas[0] else ""
        if not archivo:
            avisos.append(f"{E.NOMBRE_LEEME} línea {n}: sin nombre de archivo (se ignora)")
            continue
        errores = []
        if len(celdas) != len(E.ENCABEZADO_LEEME):
            errores.append(f"la línea {n} de {E.NOMBRE_LEEME} tiene {len(celdas)} columnas; se esperaban "
                           f"{len(E.ENCABEZADO_LEEME)} ({' | '.join(E.ENCABEZADO_LEEME)})")
            fuente = fecha = script = ""
        else:
            fuente, fecha, script = celdas[1], celdas[2].strip("`"), celdas[3].strip("`")
            if not fuente:
                errores.append(f"la línea {n} de {E.NOMBRE_LEEME} no dice la fuente")
            if not script:
                errores.append(f"la línea {n} de {E.NOMBRE_LEEME} no dice el script")
            if not es_fecha(fecha):
                errores.append(f"la línea {n} de {E.NOMBRE_LEEME} trae la fecha «{fecha}», que no es AAAA-MM-DD")
        if archivo in entradas:
            avisos.append(f"{E.NOMBRE_LEEME}: «{archivo}» aparece en las líneas {entradas[archivo]['linea']} y {n}; "
                          "se usa la última")
        entradas[archivo] = {"fuente": fuente, "fecha": fecha, "script": script, "linea": n, "errores": errores}
    if not encabezado:
        return {}, (f"{E.NOMBRE_LEEME} no trae la tabla «{' | '.join(E.ENCABEZADO_LEEME)}»: "
                    "ningún archivo puede entrar"), []
    return entradas, None, avisos


def es_crudo(nombre):
    """True si el nombre es una exportación cruda de Earth Engine (E.CRUDOS_EARTH_ENGINE)."""
    return any(fnmatch.fnmatchcase(nombre.lower(), patron) for patron in E.CRUDOS_EARTH_ENGINE)


def inventario(buzon):
    """(archivos, ignorados, crudos) del buzón (raíz y <rol>/). Los crudos de Earth Engine
    no son entregas: se listan aparte, sin validarlos, sin copiarlos y sin pedirles LEEME."""
    archivos, ignorados, crudos = [], [], []
    for ruta in sorted(buzon.rglob("*")):
        if not ruta.is_file():
            continue
        rel = ruta.relative_to(buzon)
        nombre = ruta.name
        if any(parte.startswith(".") for parte in rel.parts) or nombre.lower() in E.ARCHIVOS_DE_SISTEMA:
            ignorados.append({"archivo": rel.as_posix(), "motivo": "archivo oculto o del sistema"})
            continue
        if nombre.lower() == E.NOMBRE_LEEME.lower():
            if len(rel.parts) > 1:
                ignorados.append({"archivo": rel.as_posix(),
                                  "motivo": f"solo cuenta el {E.NOMBRE_LEEME} de la raíz del buzón"})
            continue
        if ruta.suffix.lower() in E.EXTENSIONES_CODIGO:
            ignorados.append({"archivo": rel.as_posix(),
                              "motivo": "código: no entra por el buzón; Cristian lo revisa y lo copia a mano"})
            continue
        rol = rel.parts[0] if len(rel.parts) > 1 else None
        if es_crudo(nombre):
            crudos.append({"archivo": rel.as_posix(), "rol": rol, "bytes": ruta.stat().st_size})
            continue
        archivos.append({"ruta": ruta, "rel": rel.as_posix(), "nombre": nombre, "rol": rol})
    return archivos, ignorados, crudos


# =========================================================================================
# Copia, fuentes.json y bitácora
# =========================================================================================
def copiar_sin_modificar(origen, destino):
    """Copia byte a byte (vía un temporal) y comprueba el sha256; devuelve el sha256."""
    sha = sha256_de(origen)
    temporal = destino.with_name(destino.name + ".ensamblando")
    shutil.copy2(origen, temporal)
    if sha256_de(temporal) != sha:
        temporal.unlink()
        raise OSError("la copia no coincide con el original (sha256)")
    os.replace(temporal, destino)
    return sha


def fusionar_fuentes(salida, nuevas, entraron):
    """Fuentes de esta corrida más las anteriores cuyo archivo sigue igual en la salida."""
    ruta = salida / NOMBRE_FUENTES
    previas, avisos = [], []
    if ruta.exists():
        try:
            crudo = json.loads(ruta.read_text(encoding="utf-8"))
            previas = crudo.get("fuentes", []) if isinstance(crudo, dict) else []
        except (json.JSONDecodeError, UnicodeDecodeError):
            avisos.append(f"{NOMBRE_FUENTES} anterior no se pudo leer: se reescribe solo con esta corrida")
    conservadas = []
    for f in previas:
        if not isinstance(f, dict):
            continue
        if f.get("tipo") == "origen":
            de = f.get("de")
            if de not in entraron and de and (salida / de).exists():
                conservadas.append(f)
            continue
        archivo = f.get("archivo")
        if not archivo or archivo in entraron:
            continue
        copia = salida / archivo
        if copia.exists() and sha256_de(copia) == f.get("sha256"):
            conservadas.append(f)
        else:
            avisos.append(f"{NOMBRE_FUENTES}: se retira «{archivo}» (la copia ya no está o cambió fuera del ensamblador)")
    todas = conservadas + nuevas
    todas.sort(key=lambda f: (f.get("tipo") != "entrega", f.get("archivo") or "", f.get("de") or ""))
    return todas, avisos


def escribir_fuentes(salida, fuentes, hora):
    datos = {
        "_encabezado": ENCABEZADO,
        "_nota": ("Lo escribe motor/ensamblar.py; no se edita a mano. tipo «entrega»: archivo del buzón "
                  "copiado sin modificar a esta carpeta (fuente, fecha y script de LEEME.md; url_o_api y "
                  "fecha_consulta repiten fuente y fecha para motor/manifest.py). tipo «origen»: filas de "
                  "los fuentes_<pieza>.csv entregados (kit K-ENS paso 6(a))."),
        "generado": hora,
        "fuentes": fuentes,
    }
    (salida / NOMBRE_FUENTES).write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


ENCABEZADO_LOG = f"""<!-- {ENCABEZADO} -->
# Bitácora de entregas del buzón

Una línea por corrida de `motor/ensamblar.py` con buzón (kit v4, K-ENS paso 1). La escribe el
ensamblador: no se edita a mano. Columnas: hora local con zona horaria; buzón; carpeta de salida;
archivos que entraron con su rol (subcarpeta `entregas/<rol>/`; «—» si llegaron sueltos) y su
zona cuando aplica (decisión de dos zonas);
rechazados con su primer motivo; retenidos (esperan a `parcelas_base.geojson`).
Las corridas de prueba con `--salida` escriben su bitácora en esa carpeta, no aquí.

| hora | buzón | salida | entraron | rechazados | retenidos |
|---|---|---|---|---|---|
"""


def _celda(texto, largo=160):
    t = str(texto).replace("|", "\\|").replace("\n", " ")
    return t if len(t) <= largo else t[:largo - 1] + "…"


def escribir_log(log, rep):
    log = Path(log)
    log.parent.mkdir(parents=True, exist_ok=True)
    if not log.exists():
        log.write_text(ENCABEZADO_LOG, encoding="utf-8")

    def lista(items, con_motivo=None):
        if not items:
            return "0"
        partes = []
        for x in items:
            texto = f"{x['archivo']} [{x.get('rol') or '—'}]"
            if x.get("zona"):
                texto += f" (zona {x['zona']})"
            elif x.get("zonas"):
                texto += f" (zonas {', '.join(x['zonas'])})"
            if con_motivo:
                motivo = x.get(con_motivo)
                motivo = motivo[0] if isinstance(motivo, list) and motivo else motivo
                texto += f": {_celda(motivo, 90)}"
            partes.append(texto)
        return f"{len(items)}: " + "; ".join(partes)

    fila = (f"| {rep['hora']} | {_celda(mostrar_ruta(rep['buzon']))} | {_celda(mostrar_ruta(rep['salida']))} | "
            f"{_celda(lista(rep['entraron']), 600)} | {_celda(lista(rep['rechazados'], 'motivos'), 900)} | "
            f"{_celda(lista(rep['retenidos']), 400)} |\n")
    with open(log, "a", encoding="utf-8") as f:
        f.write(fila)


# =========================================================================================
# Ensamblado
# =========================================================================================
def esperados_simulados():
    """Entregas que alimentan el contrato o la web: mientras no entren, sigue lo simulado."""
    return [nombre for nombre, esq in E.ESQUEMAS.items() if esq.get("alimenta")]


def ensamblar(buzon=None, salida=None, log=None, params=None):
    """Valida el buzón y copia lo válido a la salida.

    buzon:  carpeta del buzón (str o Path) o None (no hay entregas: todo sigue simulado y
            no se escribe nada).
    salida: carpeta de las copias validadas y de fuentes.json (por omisión data/processed).
    log:    bitácora (por omisión docs/entregas_log.md si la salida es data/processed; si no,
            <salida>/entregas_log.md).
    params: dict o ruta de params.json (por omisión data/params.json).
    Devuelve un dict con 'entraron', 'rechazados', 'retenidos', 'sigue_simulado' y 'fuentes'
    (más 'crudos' de Earth Engine, 'ignorados', 'avisos' y rutas)."""
    hora = ahora()
    limites = limites_derivados(cargar_params(params))
    salida = Path(salida) if salida else SALIDA_POR_OMISION
    rep = {
        "hora": hora, "buzon": None, "salida": str(salida), "log": None, "fuentes_json": None,
        "entraron": [], "rechazados": [], "retenidos": [], "crudos": [], "ignorados": [],
        "sigue_simulado": esperados_simulados(), "fuentes": [], "avisos": [],
        "nota": "web/data/ no se toca todavía: la integración al contrato llega con el motor B4.",
    }
    if buzon is None or not str(buzon).strip():
        rep["nota"] = ("Sin buzón: no hay entregas; todo sigue simulado y no se escribió nada. " + rep["nota"])
        return rep

    buzon = Path(buzon).expanduser()
    if not buzon.is_dir():
        raise FileNotFoundError(f"el buzón no existe o no es una carpeta: {buzon}")
    if log is None:
        log = LOG_POR_OMISION if salida.resolve() == SALIDA_POR_OMISION.resolve() else salida / NOMBRE_LOG_SALIDA
    rep.update({"buzon": str(buzon), "log": str(log), "fuentes_json": str(salida / NOMBRE_FUENTES)})

    leeme, error_leeme, avisos = leer_leeme(buzon)
    archivos, ignorados, crudos = inventario(buzon)
    rep["ignorados"], rep["crudos"] = ignorados, crudos
    repetidos = Counter(a["nombre"] for a in archivos)
    # parcelas_base.geojson primero: los demás comprueban sus ids contra él.
    archivos.sort(key=lambda a: (a["nombre"] != E.ARCHIVO_PARCELAS, a["nombre"], a["rel"]))
    # Un crudo mencionado en LEEME.md sí está en el buzón (no se avisa como faltante).
    presentes = {a["nombre"] for a in archivos} | {PurePosixPath(c["archivo"]).name for c in crudos}
    sobran = sorted(set(leeme) - presentes)
    if sobran:
        avisos.append(f"{E.NOMBRE_LEEME} menciona archivos que no están en el buzón: {', '.join(sobran)}")

    salida.mkdir(parents=True, exist_ok=True)
    ctx = Contexto(limites)
    nuevas_fuentes, nombres_entraron = [], set()
    for a in archivos:
        nombre = a["nombre"]
        # Esquema y zona (por sufijo «_<zona>» o la zona por omisión); un sufijo desconocido es motivo.
        esq, zona, motivos_zona = identificar(nombre, limites)
        motivos, res = [], None
        linea = leeme.get(nombre)
        if error_leeme:
            motivos.append(error_leeme)
        elif linea is None:
            motivos.append(f"sin línea en {E.NOMBRE_LEEME} («{' | '.join(E.ENCABEZADO_LEEME)}»): no entra")
        else:
            motivos.extend(linea["errores"])
        if repetidos[nombre] > 1:
            motivos.append(f"el nombre se repite en el buzón ({repetidos[nombre]} veces): no se sabe cuál es la entrega")
        motivos.extend(motivos_zona)
        if esq is None:
            motivos.append("no está en la tabla 0.4-B del kit (motor/esquemas.py): no se sabe cómo validarlo")
        else:
            ctx.zona_archivo = zona
            try:
                res = validador_de(esq)(a["ruta"], esq, ctx)
                motivos.extend(res.motivos())
            except Exception as ex:  # noqa: BLE001 - un archivo roto se reporta, no detiene el ensamblado
                motivos.append(f"error al validar: {type(ex).__name__}: {ex}")
            finally:
                ctx.zona_archivo = None
        avisos_archivo = res.avisos if res else []
        # «zona»: la del archivo (sufijo o por omisión) o None si no aplica; «zonas»: elementos
        # por zona en los archivos que traen las dos (parcelas, rutas y CSV por parcela).
        base = {"archivo": nombre, "rol": a["rol"], "pieza": esq.get("pieza") if esq else None,
                "ruta_buzon": a["rel"], "zona": zona}
        if res and res.info.get("zonas"):
            base["zonas"] = res.info["zonas"]
        necesita_ids = bool(res and res.info.get("necesita_ids") and ctx.ids is None)

        if necesita_ids and not motivos:
            rep["retenidos"].append({**base, "motivo": ctx.razon_sin_ids(), "avisos": avisos_archivo})
        elif motivos:
            if necesita_ids:
                motivos.append(f"además, los id no se comprobaron: {ctx.razon_sin_ids()}")
            if (salida / nombre).exists():
                avisos_archivo = avisos_archivo + [f"se conserva la copia validada anterior en {mostrar_ruta(salida)}"]
            rep["rechazados"].append({**base, "motivos": motivos, "avisos": avisos_archivo})
        else:
            try:
                sha = copiar_sin_modificar(a["ruta"], salida / nombre)
            except OSError as ex:
                rep["rechazados"].append({**base, "motivos": [f"no se pudo copiar: {ex}"], "avisos": avisos_archivo})
            else:
                nombres_entraron.add(nombre)
                rep["entraron"].append({**base, "sha256": sha, "destino": mostrar_ruta(salida / nombre),
                                        "avisos": avisos_archivo})
                nuevas_fuentes.append({
                    "archivo": nombre, "tipo": "entrega", "pieza": base["pieza"], "rol": a["rol"],
                    "fuente": linea["fuente"], "fecha": linea["fecha"], "script": linea["script"],
                    "url_o_api": linea["fuente"], "fecha_consulta": linea["fecha"],
                    "sha256": sha, "ruta_buzon": a["rel"], "ingreso": hora,
                    **({"zona": zona} if zona else {}),
                })
                for fila in (res.info.get("origen") or []):
                    nuevas_fuentes.append({"tipo": "origen", "de": nombre, "pieza": base["pieza"],
                                           "archivo": fila["archivo"], "url_o_api": fila["url_o_api"],
                                           "fecha_consulta": fila["fecha_consulta"], "sha256": fila["sha256"]})
        if nombre == E.ARCHIVO_PARCELAS and ctx.estado_parcelas == "no_llego":
            if nombre in nombres_entraron:
                ctx.ids, ctx.props, ctx.estado_parcelas = res.info["ids"], res.info["props"], "ok"
                ctx.zona_de_id, ctx.cajas_zona = res.info["zona_de_id"], res.info["cajas_zona"]
                ctx.n_parcelas_zona = res.info.get("zonas") or {}
            else:
                ctx.estado_parcelas = "rechazado"

    fuentes, avisos_fuentes = fusionar_fuentes(salida, nuevas_fuentes, nombres_entraron)
    escribir_fuentes(salida, fuentes, hora)
    rep["fuentes"] = fuentes
    rep["avisos"] = avisos + avisos_fuentes
    rep["sigue_simulado"] = [n for n in esperados_simulados() if n not in nombres_entraron]
    escribir_log(log, rep)
    return rep


# =========================================================================================
# Reporte y CLI
# =========================================================================================
def texto_reporte(rep):
    lineas = [f"ENSAMBLADO DEL BUZÓN — {rep['hora']}"]
    if rep["buzon"] is None:
        lineas.append(rep["nota"])
        lineas.append(f"SIGUE SIMULADO ({len(rep['sigue_simulado'])}): {', '.join(rep['sigue_simulado'])}")
        return "\n".join(lineas)
    lineas += [f"Buzón ......: {rep['buzon']}",
               f"Salida .....: {rep['salida']} (copias validadas y {NOMBRE_FUENTES})",
               f"Bitácora ...: {rep['log']}", ""]

    def etiqueta(x):
        partes = [x.get("pieza") or "?", f"rol {x.get('rol') or '—'}"]
        if x.get("zona"):
            partes.append(f"zona {x['zona']}")
        if x.get("zonas"):
            partes.append("zonas " + ", ".join(f"{z} ({n})" for z, n in x["zonas"].items()))
        return f"[{' · '.join(partes)}]"

    lineas.append(f"ENTRARON ({len(rep['entraron'])})")
    for x in rep["entraron"]:
        lineas.append(f"  + {x['archivo']} {etiqueta(x)} sha256 {x['sha256'][:12]}… → {x['destino']}")
        lineas += [f"      aviso: {a}" for a in x["avisos"]]
    lineas.append(f"RECHAZADOS ({len(rep['rechazados'])})")
    for x in rep["rechazados"]:
        lineas.append(f"  x {x['archivo']} {etiqueta(x)}")
        lineas += [f"      motivo: {m}" for m in x["motivos"]]
        lineas += [f"      aviso: {a}" for a in x["avisos"]]
    lineas.append(f"RETENIDOS ({len(rep['retenidos'])})")
    for x in rep["retenidos"]:
        lineas.append(f"  ~ {x['archivo']} {etiqueta(x)}: {x['motivo']}")
    if rep.get("crudos"):
        lineas.append(f"{TITULO_CRUDOS}: {len(rep['crudos'])}")
        lineas += [f"  · {x['archivo']} ({x['bytes'] / 1e6:.1f} MB)" for x in rep["crudos"]]
    if rep["ignorados"]:
        lineas.append(f"IGNORADOS ({len(rep['ignorados'])})")
        lineas += [f"  - {x['archivo']}: {x['motivo']}" for x in rep["ignorados"]]
    lineas.append(f"SIGUE SIMULADO ({len(rep['sigue_simulado'])}): {', '.join(rep['sigue_simulado']) or 'nada'}")
    lineas.append(f"FUENTES: {len(rep['fuentes'])} en {rep['fuentes_json']}")
    lineas += [f"AVISO: {a}" for a in rep["avisos"]]
    lineas.append(rep["nota"])
    return "\n".join(lineas)


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Valida el buzón de entregas y copia lo válido a data/processed.")
    ap.add_argument("--buzon", default=os.environ.get("RAIZ_BUZON") or None,
                    help="carpeta del buzón (Raiz/entregas/); por omisión, la variable RAIZ_BUZON")
    ap.add_argument("--salida", default=None, help="carpeta de las copias validadas (por omisión data/processed)")
    ap.add_argument("--log", default=None, help="bitácora (por omisión docs/entregas_log.md o <salida>/entregas_log.md)")
    ap.add_argument("--params", default=None, help="params.json (por omisión data/params.json)")
    ap.add_argument("--json", action="store_true", help="imprime el reporte completo en JSON")
    args = ap.parse_args(argv)
    try:
        rep = ensamblar(args.buzon, salida=args.salida, log=args.log, params=args.params)
    except FileNotFoundError as ex:
        print(f"ERROR: {ex}", file=sys.stderr)
        return 2
    print(json.dumps(rep, ensure_ascii=False, indent=1) if args.json else texto_reporte(rep))
    return 1 if rep["rechazados"] else 0


if __name__ == "__main__":
    sys.exit(main())
