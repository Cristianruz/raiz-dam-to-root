# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Pruebas del validador del buzón para el catálogo de suelos y los nutrientes por parcela (B7) y el tipo de
suelo por parcela (B8).

Archivos: suelo_tipos.json, suelo_reglas.json, suelo_nutrientes_parcelas.csv (B7) y tipo_suelo_parcelas.csv
(B8). Esquemas en motor/esquemas.py (FUENTE_B7); reglas en motor/ensamblar.py: «suelo_tipos» y «suelo_reglas»
para los JSON; «lista_separada» y «todas_o_ninguna» (con «vacias_si_ninguna») para el CSV de nutrientes.

Los cuatro archivos son los REALES de la sesión de datos:
- tests/fixtures/suelo_b7/ es copia byte a byte de `git show origin/datos-satelite:data/reto/<archivo>`
  (commit 3323b1e, 14-nov-2026 20:06); se prueba siempre, también en GitHub Actions;
- si la rama origin/datos-satelite está en este clon, se prueba además su versión de hoy (`git show` a
  tmp_path); si no está (clon de GitHub Actions), esa variante se salta.
El parcelas_base.geojson es el real de data/processed/. Cada caso inválido cambia UNA cosa del archivo real y
comprueba que se rechace con un motivo legible. Todo se escribe en tmp_path: nunca en data/processed.
Las listas cerradas (símbolos, clases, llaves) se leen de motor/esquemas.py y se comparan con los archivos
reales, no se escriben aquí.
"""
import csv
import io
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
for ruta in (RAIZ, RAIZ / "tests"):
    if str(ruta) not in sys.path:
        sys.path.insert(0, str(ruta))

from motor import ensamblar as ens  # noqa: E402
from motor import esquemas  # noqa: E402
# Utilidades del ensamblador (no se modifican): buzón en tmp_path con parcelas_base y LEEME.md.
from test_ensamblar import LIMITES, PROCESADOS, buzon_con, correr, motivos_de, nombres  # noqa: E402

FIXTURE = RAIZ / "tests/fixtures/suelo_b7"
RAMA = "origin/datos-satelite"
TIPOS, REGLAS = "suelo_tipos.json", "suelo_reglas.json"
NUTRIENTES, TIPO_PARCELAS = "suelo_nutrientes_parcelas.csv", "tipo_suelo_parcelas.csv"
NUEVOS = {TIPOS: ("B7", "json"), REGLAS: ("B7", "json"), NUTRIENTES: ("B7", "csv"), TIPO_PARCELAS: ("B8", "csv")}
ZONAS = LIMITES["zonas_ids"]                 # de data/params.json (zona_piloto.zonas)
PARCELAS = json.loads((PROCESADOS / "parcelas_base.geojson").read_text(encoding="utf-8"))
POR_ZONA = dict(sorted(Counter(f["properties"]["zona"] for f in PARCELAS["features"]).items()))


# ---------------------------------------------------------------------------------------
# Utilidades: los archivos reales y sus variantes
# ---------------------------------------------------------------------------------------
def de_la_rama(nombre):
    """El archivo tal como está hoy en la rama de la sesión de datos (git show), o None si no está en el clon."""
    try:
        r = subprocess.run(["git", "show", f"{RAMA}:data/reto/{nombre}"], cwd=RAIZ, capture_output=True, timeout=60)
    except (OSError, subprocess.SubprocessError):
        return None
    return r.stdout if r.returncode == 0 else None


def json_real(nombre):
    return json.loads((FIXTURE / nombre).read_text(encoding="utf-8"))


def json_con(nombre, cambio):
    """El JSON real con un cambio (función que recibe el objeto y lo modifica)."""
    o = json_real(nombre)
    cambio(o)
    return json.dumps(o, ensure_ascii=False, indent=1) + "\n"


def csv_real(nombre):
    """(encabezado, filas como dicts) del CSV real."""
    with open(FIXTURE / nombre, newline="", encoding="utf-8") as f:
        filas = [fila for fila in csv.reader(f) if fila]
    return filas[0], [dict(zip(filas[0], fila)) for fila in filas[1:]]


ENC_NUTRIENTES, FILAS_NUTRIENTES = csv_real(NUTRIENTES)
ENC_TIPO, FILAS_TIPO = csv_real(TIPO_PARCELAS)
UNA = FILAS_NUTRIENTES[0]["id"]              # la parcela cuya fila se altera
# La parcela sin dato de suelo (todo vacío salvo id y zona): la de la nota de las 19:23.
SIN_DATO = [f["id"] for f in FILAS_NUTRIENTES if not f["ph"]]


def csv_con(nombre, pid=None, quitar=None, **cambios):
    """El CSV real con las celdas de la parcela `pid` cambiadas (o sin la columna `quitar`)."""
    encabezado, filas = csv_real(nombre)
    pid = pid or filas[0]["id"]
    assert any(f["id"] == pid for f in filas), pid
    for f in filas:
        if f["id"] == pid:
            f.update({c: str(v) for c, v in cambios.items()})
    columnas = [c for c in encabezado if c != quitar]
    salida = io.StringIO()
    w = csv.writer(salida, lineterminator="\n")
    w.writerow(columnas)
    for f in filas:
        w.writerow([f[c] for c in columnas])
    return salida.getvalue()


def buzon(tmp_path, archivos, **kw):
    """Buzón de prueba con el parcelas_base.geojson REAL de data/processed."""
    return buzon_con(tmp_path, archivos, base=PROCESADOS, **kw)


def entra(tmp_path, nombre, texto):
    rep = correr(buzon(tmp_path, {nombre: texto}), tmp_path)
    assert rep["rechazados"] == [], rep["rechazados"]
    assert rep["retenidos"] == []
    assert nombre in nombres(rep["entraron"])
    contenido = texto if isinstance(texto, bytes) else texto.encode("utf-8")
    assert (tmp_path / "salida" / nombre).read_bytes() == contenido, "se copia sin modificar"
    return next(x for x in rep["entraron"] if x["archivo"] == nombre)


def rechazo(tmp_path, nombre, texto):
    """Motivos (un solo texto) con que se rechaza el archivo; nada suyo llega a la salida."""
    rep = correr(buzon(tmp_path, {nombre: texto}), tmp_path)
    assert nombre in nombres(rep["rechazados"]), f"{nombre} debió rechazarse; entraron: {nombres(rep['entraron'])}"
    assert not (tmp_path / "salida" / nombre).exists()
    return motivos_de(rep, nombre)


# ---------------------------------------------------------------------------------------
# Los esquemas: pieza, fuente de las reglas y listas cerradas comparadas con los archivos reales
# ---------------------------------------------------------------------------------------
def test_los_cuatro_esquemas_con_su_pieza_y_su_fuente():
    for nombre, (pieza, tipo) in NUEVOS.items():
        esq = esquemas.ESQUEMAS[nombre]
        assert esq["pieza"] == pieza and esq["tipo"] == tipo, nombre
        assert esquemas.FUENTE_B7 in esq["fuente_reglas"], nombre
        assert "por definición" in esq["fuente_reglas"], f"{nombre}: los límites físicos se declaran «por definición»"
        # Un archivo para las dos zonas: sin sufijo de zona y sin versión simulada.
        assert nombre not in esquemas.ARCHIVOS_POR_ZONA
        assert "alimenta" not in esq and nombre not in ens.esperados_simulados()
        if tipo == "json":
            assert esq["regla"] in ens.REGLAS_JSON, nombre
    assert "lista_separada" in ens.REGLAS_CSV
    # La revisión independiente citada en la fuente existe en el repo.
    assert "docs/revisiones/2026-11-14_2010_suelo_gaez.md" in esquemas.FUENTE_B7
    assert (RAIZ / "docs/revisiones/2026-11-14_2010_suelo_gaez.md").is_file()


def test_elementos_quimicos_de_la_tabla_periodica():
    """Los símbolos de la IUPAC (118 elementos con nombre), sin repetir y con la forma de un símbolo."""
    simbolos = esquemas.ELEMENTOS_QUIMICOS
    assert len(simbolos) == len(set(simbolos)) == 118
    assert all(re.fullmatch(r"[A-Z][a-z]?", s) for s in simbolos)
    # Los que nombran las reglas de nutrientes y los nutrientes por parcela están en la lista.
    reglas = json_real(REGLAS)
    usados = {s for g in reglas["disponibilidad_ph"]["grupos"] for s in g["nutrientes"]}
    usados |= set(reglas["disponibilidad_ph"]["toxicidad_ph_menor_que"]["elementos"])
    usados |= {s for f in FILAS_NUTRIENTES for c in ("menos_disponibles", "cerca_del_limite", "toxicidad_posible")
               for s in f[c].split(esquemas.SEPARADOR_LISTA) if s}
    assert usados and usados <= set(simbolos), usados - set(simbolos)


def test_clases_del_csv_son_las_del_archivo_de_reglas():
    """ph_clase, mo_clase y cic_clase usan las clases de la NOM-021 tal como las escribe suelo_reglas.json;
    textura_grupo, los grupos de suelo_requisitos.json (light, medium, heavy)."""
    reglas = json_real(REGLAS)
    clases = lambda tabla: tuple(c["clase"] for c in tabla)  # noqa: E731
    assert clases(reglas["ph_clases"]["tabla"]) == esquemas.CLASES_PH
    assert clases(reglas["materia_organica"]["no_volcanicos"]) == esquemas.CLASES_MO
    assert clases(reglas["materia_organica"]["volcanicos"]) == esquemas.CLASES_MO
    assert clases(reglas["cic"]["tabla"]) == esquemas.CLASES_CIC
    columnas = esquemas.ESQUEMAS[NUTRIENTES]["columnas"]
    assert tuple(columnas["ph_clase"]["valores"]) == esquemas.CLASES_PH
    assert tuple(columnas["mo_clase"]["valores"]) == esquemas.CLASES_MO
    assert tuple(columnas["cic_clase"]["valores"]) == esquemas.CLASES_CIC
    assert tuple(columnas["textura_grupo"]["valores"]) == esquemas.GRUPOS_TEXTURA
    requisitos = PROCESADOS / "suelo_requisitos.json"
    if not requisitos.is_file():
        pytest.skip("data/processed/suelo_requisitos.json aún no existe")
    grupos = json.loads(requisitos.read_text(encoding="utf-8"))["grupos_textura"]["valor"]
    assert tuple(grupos) == esquemas.GRUPOS_TEXTURA


def test_columnas_y_llaves_son_las_de_los_archivos_reales():
    """Las columnas declaradas están en el CSV real, en su orden; lo demás es columna adicional (se copia)."""
    for nombre, encabezado in ((NUTRIENTES, ENC_NUTRIENTES), (TIPO_PARCELAS, ENC_TIPO)):
        declaradas = list(esquemas.ESQUEMAS[nombre]["columnas"])
        assert [c for c in encabezado if c in declaradas] == declaradas, nombre
    assert list(esquemas.ESQUEMAS[NUTRIENTES]["columnas"]) == ENC_NUTRIENTES, "todas las de la nota de las 19:23"
    assert [c for c in ENC_TIPO if c not in esquemas.ESQUEMAS[TIPO_PARCELAS]["columnas"]] == ["elementos", "clase_valor"]
    assert tuple(json_real(TIPOS)) == tuple(esquemas.LLAVES_SUELO_TIPOS)
    reglas = json_real(REGLAS)
    assert set(esquemas.LLAVES_REGLAS_OBLIGATORIAS) <= set(reglas) <= set(esquemas.LLAVES_REGLAS_CONOCIDAS)
    # Las condiciones del archivo real son llaves conocidas.
    condiciones = {k for avisos in reglas["cultivos"].values() if isinstance(avisos, list)
                   for a in avisos for k in (a.get("condicion") or {})}
    assert condiciones and condiciones <= set(esquemas.CONDICIONES_AVISO)


def test_la_revision_de_textos_en_ingles_cubre_todas_sus_llaves():
    """La regla 10 se revisa en todo texto en inglés de los dos JSON, no solo en texto_en."""
    llaves_tipos = {llave for _, llave, _ in ens._textos_en(json_real(TIPOS))}
    assert {"texto_en", "texto_explica_en", "definicion_en", "fertilidad_en", "significado_en"} <= llaves_tipos
    llaves_reglas = {llave for _, llave, _ in ens._textos_en(json_real(REGLAS))}
    assert {"texto_en", "texto_fe"} <= llaves_reglas


def test_las_reglas_nuevas_solo_las_usan_los_esquemas_nuevos():
    for nombre, esq in esquemas.ESQUEMAS.items():
        usadas = {r["regla"] for r in esq.get("reglas", [])}
        if nombre != NUTRIENTES:
            assert "lista_separada" not in usadas, f"{nombre} no debía cambiar"
            assert not any("vacias_si_ninguna" in r for r in esq.get("reglas", [])), f"{nombre} no debía cambiar"
        if nombre not in (TIPOS, REGLAS):
            assert esq.get("regla") not in ("suelo_tipos", "suelo_reglas"), f"{nombre} no debía cambiar"


# ---------------------------------------------------------------------------------------
# Los cuatro archivos REALES entran
# ---------------------------------------------------------------------------------------
@pytest.mark.parametrize("origen", ["fixture (commit 3323b1e)", f"rama {RAMA} de hoy"])
def test_los_cuatro_archivos_reales_entran(tmp_path, origen):
    if origen.startswith("rama"):
        archivos = {n: de_la_rama(n) for n in NUEVOS}
        if any(v is None for v in archivos.values()):
            pytest.skip(f"{RAMA} no está en este clon (git fetch origin datos-satelite)")
    else:
        archivos = {n: (FIXTURE / n).read_bytes() for n in NUEVOS}
    rep = correr(buzon(tmp_path, archivos), tmp_path)
    assert rep["rechazados"] == [], rep["rechazados"]
    assert rep["retenidos"] == []
    assert nombres(rep["entraron"]) == sorted([*NUEVOS, "parcelas_base.geojson"])
    por_nombre = {x["archivo"]: x for x in rep["entraron"]}
    for nombre, (pieza, _) in NUEVOS.items():
        assert por_nombre[nombre]["pieza"] == pieza and por_nombre[nombre]["zona"] is None, nombre
        assert (tmp_path / "salida" / nombre).read_bytes() == archivos[nombre], "se copia sin modificar"
    fuentes = {f["archivo"]: f for f in rep["fuentes"]}
    for nombre in NUEVOS:
        assert fuentes[nombre]["fuente"] and fuentes[nombre]["fecha"] and fuentes[nombre]["sha256"]
    # Los dos CSV traen una fila por parcela de las dos zonas.
    for nombre in (NUTRIENTES, TIPO_PARCELAS):
        assert por_nombre[nombre]["zonas"] == POR_ZONA, nombre
    if origen.startswith("fixture"):
        avisos = " | ".join(por_nombre[NUTRIENTES]["avisos"])
        assert f"parcelas sin dato de suelo (la ficha no muestra nutrientes): 1 ({SIN_DATO[0]})" in avisos
        assert por_nombre[TIPO_PARCELAS]["avisos"] == ["columnas adicionales (se copian sin validar): elementos, clase_valor"]
        for nombre in (TIPOS, REGLAS):
            assert por_nombre[nombre]["avisos"] == [], (nombre, por_nombre[nombre]["avisos"])


def test_la_parcela_sin_dato_es_la_de_suelo_parcelas():
    """La fila sin dato de nutrientes (todo vacío salvo id y zona) es la parcela sin perfil de suelo."""
    assert len(SIN_DATO) == 1
    fila = next(f for f in FILAS_NUTRIENTES if f["id"] == SIN_DATO[0])
    assert all(v == "" for c, v in fila.items() if c not in ("id", "zona")) and fila["zona"] in ZONAS
    perfil = PROCESADOS / "suelo_parcelas.csv"
    if not perfil.is_file():
        pytest.skip("data/processed/suelo_parcelas.csv aún no existe")
    with open(perfil, newline="", encoding="utf-8") as f:
        sin_ph = [r["id"] for r in csv.DictReader(f) if not r["ph"]]
    assert sin_ph == SIN_DATO


@pytest.mark.parametrize("nombre", [f"suelo_tipos_{ZONAS[-1]}.json", f"tipo_suelo_parcelas_{ZONAS[-1]}.csv"])
def test_sufijo_de_zona_no_se_admite(tmp_path, nombre):
    """Son UN archivo para las dos zonas: con sufijo de zona no están en la tabla."""
    base = TIPOS if nombre.endswith(".json") else TIPO_PARCELAS
    assert "no se sabe cómo validarlo" in rechazo(tmp_path, nombre, (FIXTURE / base).read_bytes())


# ---------------------------------------------------------------------------------------
# suelo_tipos.json (B7)
# ---------------------------------------------------------------------------------------
def wrb(o, grupo="Calcisols"):
    return o["wrb"][grupo]


def pct(o):
    return o["zona"][esquemas.ZONA_PCT]


def _sumar_al_primero(delta):
    def cambio(o):
        primero = next(iter(pct(o)))
        pct(o)[primero] = round(pct(o)[primero] + delta, 6)
    return cambio


TIPOS_VALIDOS = {
    "ph_rango en null": lambda o: wrb(o, "Vertisols").update(ph_rango=None),
    "ph_rango abierto por abajo": lambda o: wrb(o, "Vertisols").update(ph_rango=[None, 8.0]),
    "ph_rango de toda la escala": lambda o: wrb(o, "Vertisols").update(ph_rango=[esquemas.PH_MIN, esquemas.PH_MAX]),
    "ricos_en y pobres_en vacíos": lambda o: wrb(o).update(ricos_en=[], pobres_en=[]),
    "porcentajes en el borde de la tolerancia": _sumar_al_primero(esquemas.TOLERANCIA_PCT_ZONA),
}


@pytest.mark.parametrize("caso", sorted(TIPOS_VALIDOS))
def test_tipos_variantes_validas_entran(tmp_path, caso):
    entra(tmp_path, TIPOS, json_con(TIPOS, TIPOS_VALIDOS[caso]))


TIPOS_INVALIDOS = {
    "falta una llave de primer nivel": (lambda o: o.pop("usda_ordenes"), "falta la llave usda_ordenes"),
    "fuente vacía": (lambda o: o.update(fuente=" "), "fuente debe ser un texto no vacío"),
    "wrb vacío": (lambda o: o.update(wrb={}), "wrb debe ser un objeto no vacío"),
    "símbolo inventado en ricos_en": (lambda o: wrb(o).update(ricos_en=["Ca", "Xy"]),
                                      "ricos_en: símbolo que no es un elemento químico (tabla periódica de la IUPAC)"),
    "ion en lugar de símbolo en pobres_en": (lambda o: wrb(o).update(pobres_en=["Zn2+"]),
                                             "pobres_en: símbolo que no es un elemento químico"),
    "símbolo en minúsculas": (lambda o: wrb(o).update(pobres_en=["zn"]), "pobres_en: símbolo que no es un elemento químico"),
    "símbolo repetido": (lambda o: wrb(o).update(ricos_en=["Ca", "Ca"]), "ricos_en: símbolo repetido"),
    "ricos_en que no es lista": (lambda o: wrb(o).update(ricos_en="Ca, Mg"), "ricos_en debe ser una lista"),
    "sin pobres_en": (lambda o: wrb(o).pop("pobres_en"), "falta pobres_en"),
    "ph_rango al revés": (lambda o: wrb(o, "Vertisols").update(ph_rango=[8.0, 6.0]), "ph_rango: min mayor que max"),
    "ph_rango fuera de la escala": (lambda o: wrb(o, "Vertisols").update(ph_rango=[6.0, 15.0]), "ph_rango fuera de [0, 14]"),
    "ph_rango sin extremos": (lambda o: wrb(o, "Vertisols").update(ph_rango=[None, None]), "ph_rango debe ser un par [min, max]"),
    "ph_rango de un solo número": (lambda o: wrb(o, "Vertisols").update(ph_rango=[7.0]), "ph_rango debe ser un par [min, max]"),
    "sin ph_rango": (lambda o: wrb(o).pop("ph_rango"), "falta ph_rango"),
    "ficha sin texto_en": (lambda o: wrb(o).update(texto_en=""), "ficha sin texto_en"),
    "ficha sin fuente": (lambda o: wrb(o).pop("fuente"), "ficha sin fuente"),
    "ficha sin etiqueta": (lambda o: wrb(o).update(etiqueta=None), "ficha sin etiqueta"),
    # texto_en va tal cual a la página: sin «first», «only» ni promesas (CLAUDE.md, regla 10).
    "texto_en con «only»": (lambda o: wrb(o).update(texto_en="TEST DATA: the only lime-rich soil."),
                            "texto_en con lenguaje que la ficha no admite (CLAUDE.md, regla 10): «only» (palabra prohibida)"),
    "texto_explica_en con un pronóstico": (lambda o: o.update(texto_explica_en="TEST DATA: a soil forecast."),
                                           "texto_explica_en con lenguaje que la ficha no admite (CLAUDE.md, regla 10): "
                                           "«forecast» (pronostica la presa)"),
    "definición de un orden con «saves»": (
        lambda o: o["usda_ordenes"]["Aridisols"].update(definicion_en="TEST DATA: a soil that saves water."),
        "definicion_en con lenguaje que la ficha no admite (CLAUDE.md, regla 10): «saves» (promete ahorros)"),
    "grupo sin ficha con más llaves": (lambda o: wrb(o, "Technosols").update(texto_en="TEST DATA"),
                                       "grupo sin ficha: se escribe exactamente {ficha: null, nota}"),
    "grupo sin ficha con ficha no nula": (lambda o: wrb(o, "Technosols").update(ficha={}),
                                          "grupo sin ficha: se escribe exactamente {ficha: null, nota}"),
    "grupo sin ficha y sin nota": (lambda o: wrb(o, "Technosols").pop("nota"), "grupo sin ficha y sin nota que diga por qué"),
    "grupo que no es objeto": (lambda o: o["wrb"].update(Calcisols="lime-rich"), "grupo de wrb que no es objeto"),
    "orden USDA sin fuente": (lambda o: o["usda_ordenes"]["Aridisols"].pop("fuente"),
                              "usda_ordenes: cada entrada es un objeto con su fuente"),
    "prefijo USDA sin fuente": (lambda o: o["usda_prefijos_gran_grupo"]["torr"].update(fuente=""),
                                "usda_prefijos_gran_grupo: cada entrada es un objeto con su fuente"),
    "porcentajes que suman de más": (_sumar_al_primero(1), "zona.municipio_delicias_pct: los porcentajes deben sumar 100 ± 0.5"),
    "porcentajes que suman de menos": (_sumar_al_primero(-0.6), "zona.municipio_delicias_pct: los porcentajes deben sumar 100 ± 0.5"),
    "porcentaje negativo": (lambda o: pct(o).update(Regosol=-0.02),
                            "zona.municipio_delicias_pct: cada porcentaje es un número entre 0 y 100"),
    "porcentaje como texto": (lambda o: pct(o).update(Regosol="0.02"),
                              "zona.municipio_delicias_pct: cada porcentaje es un número entre 0 y 100"),
    "sin los porcentajes del municipio": (lambda o: o["zona"].pop(esquemas.ZONA_PCT), "falta zona.municipio_delicias_pct"),
    "zona sin fuente": (lambda o: o["zona"].pop("fuente"), "zona sin fuente"),
}


@pytest.mark.parametrize("caso", sorted(TIPOS_INVALIDOS))
def test_tipos_invalido_se_rechaza_con_su_motivo(tmp_path, caso):
    cambio, clave = TIPOS_INVALIDOS[caso]
    m = rechazo(tmp_path, TIPOS, json_con(TIPOS, cambio))
    assert clave in m, m


def test_tipos_el_motivo_dice_donde_y_que_llego(tmp_path):
    m = rechazo(tmp_path, TIPOS, json_con(TIPOS, TIPOS_INVALIDOS["símbolo inventado en ricos_en"][0]))
    assert "(wrb.Calcisols: 'Xy')" in m, m
    m = rechazo(tmp_path, TIPOS, json_con(TIPOS, TIPOS_INVALIDOS["ph_rango al revés"][0]))
    assert "(wrb.Vertisols: [8, 6])" in m, m
    m = rechazo(tmp_path, TIPOS, json_con(TIPOS, TIPOS_INVALIDOS["texto_en con «only»"][0]))
    assert "(wrb.Calcisols.texto_en)" in m, m
    m = rechazo(tmp_path, TIPOS, json_con(TIPOS, _sumar_al_primero(1)))
    assert "(suman 101)" in m, m


def test_tipos_avisa_sin_rechazar(tmp_path):
    """Una llave de primer nivel que el archivo real no trae solo se avisa."""
    x = entra(tmp_path, TIPOS, json_con(TIPOS, lambda o: o.update(fecha_lectura="2026-11-14")))
    assert x["avisos"] == ["llaves adicionales (se copian sin validar): fecha_lectura"]


def test_tipos_que_no_es_json_o_no_es_objeto(tmp_path):
    assert "no es JSON válido" in rechazo(tmp_path, TIPOS, "{ wrb: sin comillas }")
    assert "no es un objeto JSON" in rechazo(tmp_path / "b", TIPOS, "[]")


# ---------------------------------------------------------------------------------------
# suelo_reglas.json (B7)
# ---------------------------------------------------------------------------------------
def grupo(o, i):
    return o["disponibilidad_ph"]["grupos"][i]


def aviso(o, cultivo="nogal", i=0):
    return o["cultivos"][cultivo][i]


REGLAS_VALIDAS = {
    # Corrección 5 de la revisión independiente (docs/revisiones/2026-11-14_2010_suelo_gaez.md).
    "condición de la revisión: carbonatos ≥ 10 %": lambda o: aviso(o, i=1).update(
        condicion={"carbonatos_pct_mayor_o_igual": 10}),
    "condición con ph_menor_que": lambda o: aviso(o).update(condicion={"ph_menor_que": 5.5}),
    "texto_aviso_en de la revisión": lambda o: o.update(
        texto_aviso_en="Rule-based risk from a global soil map; needs a soil test."),
    "cultivo sin avisos en null": lambda o: o["cultivos"].update(nogal=None),
    "cultivo con la lista vacía": lambda o: o["cultivos"].update(chile=[]),
    "sin las tablas opcionales": lambda o: [o.pop(k) for k in ("materia_organica", "cic", "carbonatos", "salinidad")],
    "sin toxicidad por pH": lambda o: o["disponibilidad_ph"].pop("toxicidad_ph_menor_que"),
}


@pytest.mark.parametrize("caso", sorted(REGLAS_VALIDAS))
def test_reglas_variantes_validas_entran(tmp_path, caso):
    x = entra(tmp_path, REGLAS, json_con(REGLAS, REGLAS_VALIDAS[caso]))
    assert x["avisos"] == [], x["avisos"]


REGLAS_INVALIDAS = {
    "falta ph_clases": (lambda o: o.pop("ph_clases"), "falta la llave ph_clases"),
    "falta cultivos": (lambda o: o.pop("cultivos"), "falta la llave cultivos"),
    "fuente del archivo vacía": (lambda o: o.update(fuente=""), "fuente debe ser un texto no vacío"),
    # Clases de pH.
    "clase de pH al revés": (lambda o: o["ph_clases"]["tabla"][2].update(min=7.3, max=6.6), "ph_clases.tabla: min mayor que max"),
    "clase de pH fuera de la escala": (lambda o: o["ph_clases"]["tabla"][4].update(min=15), "ph_clases.tabla fuera de [0, 14]"),
    "clase de pH repetida": (lambda o: o["ph_clases"]["tabla"][1].update(clase=o["ph_clases"]["tabla"][0]["clase"]),
                             "ph_clases.tabla: clase repetida"),
    "clase de pH sin límites": (lambda o: o["ph_clases"]["tabla"][2].update(min=None, max=None),
                                "ph_clases.tabla debe ser un par [min, max]"),
    "clase de pH sin max": (lambda o: o["ph_clases"]["tabla"][2].pop("max"), "ph_clases.tabla: cada fila trae min y max"),
    "tabla de pH vacía": (lambda o: o["ph_clases"].update(tabla=[]), "ph_clases.tabla debe ser una lista no vacía"),
    "clases de pH sin fuente": (lambda o: o["ph_clases"].pop("fuente"), "ph_clases sin fuente"),
    # Tablas de clases de la NOM-021.
    "CIC al revés": (lambda o: o["cic"]["tabla"][1].update(min=15, max=5), "cic.tabla: min mayor que max"),
    "materia orgánica mayor que 100 %": (lambda o: o["materia_organica"]["no_volcanicos"][4].update(min=120),
                                         "materia_organica.no_volcanicos fuera de [0, 100]"),
    "conductividad negativa": (lambda o: o["salinidad"]["tabla_ce"][1].update(min=-1.1),
                               "salinidad.tabla_ce con un valor menor que 0"),
    "carbonatos sin fuente": (lambda o: o["carbonatos"].pop("fuente"), "carbonatos sin fuente"),
    # Disponibilidad según el pH.
    "rango de disponibilidad al revés": (lambda o: grupo(o, 1).update(mas_disponible_entre=[7.5, 5.5]),
                                         "mas_disponible_entre: min mayor que max"),
    "rango de disponibilidad fuera de la escala": (lambda o: grupo(o, 0).update(mas_disponible_entre=[6.5, 18]),
                                                   "mas_disponible_entre fuera de [0, 14]"),
    "grupo sin rango": (lambda o: grupo(o, 0).pop("mas_disponible_entre"), "mas_disponible_entre debe ser un par [min, max]"),
    "símbolo inventado en un grupo": (lambda o: grupo(o, 2)["nutrientes"].append("Qx"),
                                      "nutrientes: símbolo que no es un elemento químico (tabla periódica de la IUPAC)"),
    "nombre en lugar de símbolo": (lambda o: grupo(o, 1).update(nutrientes=["phosphorus"]),
                                   "nutrientes: símbolo que no es un elemento químico"),
    "grupo sin nutrientes": (lambda o: grupo(o, 1).update(nutrientes=[]), "nutrientes: lista vacía"),
    "un nutriente en dos grupos": (lambda o: grupo(o, 1)["nutrientes"].append("Zn"), "disponibilidad_ph: un nutriente en dos grupos"),
    "toxicidad con un pH fuera de la escala": (lambda o: o["disponibilidad_ph"]["toxicidad_ph_menor_que"].update(valor=15),
                                               "toxicidad_ph_menor_que.valor debe ser un pH de la escala [0, 14]"),
    "toxicidad con un símbolo inventado": (
        lambda o: o["disponibilidad_ph"]["toxicidad_ph_menor_que"].update(elementos=["Al", "Mn2+"]),
        "toxicidad_ph_menor_que.elementos: símbolo que no es un elemento químico"),
    "disponibilidad sin fuente": (lambda o: o["disponibilidad_ph"].update(fuente=None), "disponibilidad_ph sin fuente"),
    "texto_fe con un pronóstico": (lambda o: o["disponibilidad_ph"].update(texto_fe="TEST DATA: iron forecast."),
                                   "texto_fe con lenguaje que la ficha no admite (CLAUDE.md, regla 10): «forecast»"),
    # Avisos por cultivo.
    "texto_en de un aviso con «only» y «save»": (
        lambda o: aviso(o).update(texto_en="TEST DATA: the only fix is to save water."),
        "texto_en con lenguaje que la ficha no admite (CLAUDE.md, regla 10): «only» (palabra prohibida), "
        "«save» (promete ahorros)"),
    "aviso sin texto_en": (lambda o: aviso(o).update(texto_en="  "), "aviso sin texto_en"),
    "aviso sin fuente": (lambda o: aviso(o).pop("fuente"), "aviso sin fuente"),
    "aviso sin etiqueta": (lambda o: aviso(o, "alfalfa").pop("etiqueta"), "aviso sin etiqueta"),
    "elemento con su nombre": (lambda o: aviso(o).update(elemento="Zinc"),
                               "elemento debe ser un símbolo de elemento químico (tabla periódica de la IUPAC) o «varios»"),
    "elemento vacío": (lambda o: aviso(o).update(elemento=""), "elemento debe ser un símbolo de elemento químico"),
    "sin condición": (lambda o: aviso(o).pop("condicion"), "falta condicion (null si el aviso no depende de la parcela)"),
    "condición con una llave desconocida": (lambda o: aviso(o).update(condicion={"ph_igual_a": 7.0}),
                                            "condicion con una llave desconocida"),
    "condición que no es objeto": (lambda o: aviso(o).update(condicion="pH alto"), "condicion debe ser un objeto"),
    "condición vacía": (lambda o: aviso(o).update(condicion={}), "condicion debe ser un objeto con sus llaves o null"),
    "condición con un pH fuera de la escala": (lambda o: aviso(o).update(condicion={"ph_mayor_que": 20}),
                                               "condicion.ph_mayor_que debe ser un pH de la escala [0, 14]"),
    "condición con una clase de pH que no existe": (
        lambda o: aviso(o, "cereal_invierno").update(condicion={"ph_clase_minima": "muy alcalino"}),
        "condicion.ph_clase_minima debe ser una clase de ph_clases"),
    "condición de carbonatos al revés": (lambda o: aviso(o, i=1).update(condicion={"carbonatos_pct_entre": [25, 10]}),
                                         "condicion.carbonatos_pct_entre: min mayor que max"),
    "condición de materia orgánica mayor que 100 %": (
        lambda o: aviso(o, "alfalfa").update(condicion={"materia_organica_pct_menor_que": 200}),
        "condicion.materia_organica_pct_menor_que debe ser un porcentaje entre 0 y 100"),
    "necesita que no es lista": (lambda o: aviso(o, i=1).update(necesita="análisis"), "necesita debe ser una lista de textos"),
    "cultivo que no es clase del proyecto": (lambda o: o["cultivos"].update(avena=[]),
                                             "cultivo fuera de las clases de cultivo del proyecto"),
    "avisos que no son lista": (lambda o: o["cultivos"].update(chile="ninguno"), "los avisos de un cultivo son una lista"),
    "aviso que no es objeto": (lambda o: o["cultivos"]["maiz_forrajero"].append("Zn"), "aviso que no es objeto"),
    "nota de cultivos que no es texto": (lambda o: o["cultivos"].update(nota=["chile"]), "cultivos.nota debe ser un texto"),
}


@pytest.mark.parametrize("caso", sorted(REGLAS_INVALIDAS))
def test_reglas_invalido_se_rechaza_con_su_motivo(tmp_path, caso):
    cambio, clave = REGLAS_INVALIDAS[caso]
    m = rechazo(tmp_path, REGLAS, json_con(REGLAS, cambio))
    assert clave in m, m


def test_reglas_el_motivo_dice_donde_y_que_llego(tmp_path):
    m = rechazo(tmp_path, REGLAS, json_con(REGLAS, REGLAS_INVALIDAS["rango de disponibilidad al revés"][0]))
    assert "(disponibilidad_ph, grupo 2: [7.5, 5.5])" in m, m
    m = rechazo(tmp_path, REGLAS, json_con(REGLAS, REGLAS_INVALIDAS["condición con una llave desconocida"][0]))
    assert "cultivo nogal, aviso 1: ph_igual_a" in m and all(k in m for k in esquemas.CONDICIONES_AVISO), m
    m = rechazo(tmp_path, REGLAS, json_con(REGLAS, REGLAS_INVALIDAS["un nutriente en dos grupos"][0]))
    assert "(Zn: grupos 2 y 3)" in m, m
    m = rechazo(tmp_path, REGLAS, json_con(REGLAS, REGLAS_INVALIDAS["texto_en de un aviso con «only» y «save»"][0]))
    assert "(cultivos.nogal[0].texto_en)" in m, m


def test_reglas_avisa_sin_rechazar(tmp_path):
    x = entra(tmp_path, REGLAS, json_con(REGLAS, lambda o: o.update(fecha_lectura="2026-11-14")))
    assert x["avisos"] == ["llaves adicionales (se copian sin validar): fecha_lectura"]


def test_reglas_varios_errores_se_reportan_juntos(tmp_path):
    """El rechazo junta todos los motivos del archivo: quien entrega los corrige de una vez."""
    def cambio(o):
        o["ph_clases"].pop("fuente")
        grupo(o, 1).update(mas_disponible_entre=[7.5, 5.5])
        aviso(o, "alfalfa").update(elemento="Boron")
    m = rechazo(tmp_path, REGLAS, json_con(REGLAS, cambio))
    assert "ph_clases sin fuente" in m and "mas_disponible_entre: min mayor que max" in m and "cultivo alfalfa" in m


# ---------------------------------------------------------------------------------------
# suelo_nutrientes_parcelas.csv (B7)
# ---------------------------------------------------------------------------------------
NUTRIENTES_VALIDOS = {
    "sin ningún elemento en las listas": dict(menos_disponibles="", cerca_del_limite=""),
    "toxicidad posible con dos símbolos": dict(toxicidad_posible="Al;Mn"),
    "pH en el borde de la escala": dict(ph=esquemas.PH_MAX),
    "grupo de textura heavy": dict(textura_grupo="heavy"),
}


@pytest.mark.parametrize("caso", sorted(NUTRIENTES_VALIDOS))
def test_nutrientes_variantes_validas_entran(tmp_path, caso):
    entra(tmp_path, NUTRIENTES, csv_con(NUTRIENTES, **NUTRIENTES_VALIDOS[caso]))


NUTRIENTES_INVALIDOS = {
    "id que no existe en parcelas_base": (dict(id="P9999"), "id no existe en parcelas_base.geojson"),
    "id repetido": (dict(id=FILAS_NUTRIENTES[1]["id"]), "id repetido"),
    "zona que no existe": (dict(zona="delicias"), "zona fuera de la lista permitida"),
    "columna faltante": (dict(quitar="cic_clase"), "faltan columnas obligatorias: cic_clase"),
    "símbolo inventado": (dict(menos_disponibles="P;B;Xx"),
                          "menos_disponibles: elemento que no es un símbolo de elemento químico (tabla periódica de la IUPAC)"),
    "símbolo en minúsculas": (dict(cerca_del_limite="n;k"), "cerca_del_limite: elemento que no es un símbolo de elemento químico"),
    "ion en lugar de símbolo": (dict(toxicidad_posible="Al;Mn2+"),
                                "toxicidad_posible: elemento que no es un símbolo de elemento químico"),
    "separador coma": (dict(menos_disponibles="P,B"), "menos_disponibles: elemento que no es un símbolo de elemento químico"),
    "elemento vacío en la lista": (dict(menos_disponibles="P;;B"), "menos_disponibles: elemento vacío en la lista"),
    "separador al final": (dict(cerca_del_limite="N;K;"), "cerca_del_limite: elemento vacío en la lista"),
    "elemento repetido": (dict(menos_disponibles="P;B;P"), "menos_disponibles: elemento repetido en la lista"),
    "un elemento en las dos listas": (dict(cerca_del_limite="N;K;P"),
                                      "un mismo elemento en menos_disponibles y en cerca_del_limite (son excluyentes)"),
    "pH fuera de la escala": (dict(ph=14.5), "ph fuera de [0, 14]"),
    "pH escrito con letra": (dict(ph="ocho"), "ph: no es un número"),
    "clase de pH que no está en la lista": (dict(ph_clase="alcalino"), "ph_clase fuera de la lista permitida"),
    "clase de materia orgánica en inglés": (dict(mo_clase="medium"), "mo_clase fuera de la lista permitida"),
    "clase de CIC en masculino": (dict(cic_clase="medio"), "cic_clase fuera de la lista permitida"),
    "grupo de textura con mayúscula": (dict(textura_grupo="Medium"), "textura_grupo fuera de la lista permitida"),
    "materia orgánica mayor que 100 %": (dict(mo_pct_estimada=101), "mo_pct_estimada fuera de [0, 100]"),
    "CIC negativa": (dict(cic_cmol_kg=-1), "cic_cmol_kg menor que 0"),
    "fila a medias": (dict(ph=""), "fila a medias"),
    "fila sin dato con una lista llena": (dict(pid=SIN_DATO[0], menos_disponibles="P"),
                                          "fila sin dato (ph, ph_clase, mo_pct_estimada, mo_clase, cic_cmol_kg, cic_clase, "
                                          "textura_grupo vacías) con otras columnas llenas"),
    "fila sin dato y sin zona": (dict(pid=SIN_DATO[0], zona=""), "zona: celda vacía no permitida"),
}


@pytest.mark.parametrize("caso", sorted(NUTRIENTES_INVALIDOS))
def test_nutrientes_invalido_se_rechaza_con_su_motivo(tmp_path, caso):
    cambios, clave = NUTRIENTES_INVALIDOS[caso]
    m = rechazo(tmp_path, NUTRIENTES, csv_con(NUTRIENTES, **cambios))
    assert clave in m, m


def test_nutrientes_el_motivo_dice_la_fila_y_el_valor(tmp_path):
    m = rechazo(tmp_path, NUTRIENTES, csv_con(NUTRIENTES, menos_disponibles="P;B;Xx"))
    assert "(fila 2: 'Xx')" in m, m
    m = rechazo(tmp_path, NUTRIENTES, csv_con(NUTRIENTES, cerca_del_limite="N;K;P"))
    assert "(fila 2: P)" in m, m
    fila_sin_dato = 2 + [f["id"] for f in FILAS_NUTRIENTES].index(SIN_DATO[0])
    m = rechazo(tmp_path, NUTRIENTES, csv_con(NUTRIENTES, pid=SIN_DATO[0], toxicidad_posible="Al"))
    assert f"(fila {fila_sin_dato}: llenas toxicidad_posible)" in m, m
    m = rechazo(tmp_path, NUTRIENTES, csv_con(NUTRIENTES, ph_clase="alcalino"))
    assert all(c in m for c in esquemas.CLASES_PH), "el motivo lista las clases permitidas"


def test_nutrientes_sin_parcelas_base_queda_retenido(tmp_path):
    """Los dos CSV comprueban sus id: si parcelas_base aún no llega, se retienen (no se rechazan)."""
    archivos = {n: (FIXTURE / n).read_bytes() for n in NUEVOS}
    rep = correr(buzon(tmp_path, archivos, copiar=()), tmp_path)
    assert nombres(rep["retenidos"]) == sorted([NUTRIENTES, TIPO_PARCELAS])
    assert nombres(rep["entraron"]) == sorted([TIPOS, REGLAS]) and rep["rechazados"] == []


# ---------------------------------------------------------------------------------------
# tipo_suelo_parcelas.csv (B8)
# ---------------------------------------------------------------------------------------
TIPO_VALIDOS = {
    "parcela más chica que una celda": dict(n_celdas=0, distancia_celda_m=90),
    "fracción en los bordes": dict(fraccion_celdas=0),
    "sin las columnas adicionales": dict(quitar="clase_valor"),
}


@pytest.mark.parametrize("caso", sorted(TIPO_VALIDOS))
def test_tipo_variantes_validas_entran(tmp_path, caso):
    entra(tmp_path, TIPO_PARCELAS, csv_con(TIPO_PARCELAS, **TIPO_VALIDOS[caso]))


TIPO_INVALIDOS = {
    "id que no existe en parcelas_base": (dict(id="L9999"), "id no existe en parcelas_base.geojson"),
    "id repetido": (dict(id=FILAS_TIPO[1]["id"]), "id repetido"),
    "zona que no existe": (dict(zona="cuenca"), "zona fuera de la lista permitida"),
    "columna faltante": (dict(quitar="fraccion_celdas"), "faltan columnas obligatorias: fraccion_celdas"),
    "gran grupo vacío": (dict(gran_grupo_usda=""), "gran_grupo_usda: celda vacía no permitida"),
    "orden vacío": (dict(orden_usda=""), "orden_usda: celda vacía no permitida"),
    "fracción mayor que 1": (dict(fraccion_celdas=1.2), "fraccion_celdas fuera de [0, 1]"),
    "fracción negativa": (dict(fraccion_celdas=-0.1), "fraccion_celdas fuera de [0, 1]"),
    "fracción en porcentaje": (dict(fraccion_celdas="100%"), "fraccion_celdas: no es un número"),
    "celdas negativas": (dict(n_celdas=-1), "n_celdas menor que 0"),
    "celdas no enteras": (dict(n_celdas=2.5), "n_celdas: debe ser entero"),
    "celdas vacías": (dict(n_celdas=""), "n_celdas: celda vacía no permitida"),
    "distancia negativa": (dict(distancia_celda_m=-5), "distancia_celda_m menor que 0"),
}


@pytest.mark.parametrize("caso", sorted(TIPO_INVALIDOS))
def test_tipo_invalido_se_rechaza_con_su_motivo(tmp_path, caso):
    cambios, clave = TIPO_INVALIDOS[caso]
    m = rechazo(tmp_path, TIPO_PARCELAS, csv_con(TIPO_PARCELAS, **cambios))
    assert clave in m, m


def test_tipo_el_motivo_dice_la_fila_y_el_valor(tmp_path):
    m = rechazo(tmp_path, TIPO_PARCELAS, csv_con(TIPO_PARCELAS, fraccion_celdas=1.2))
    assert "(fila 2: 1.2)" in m, m
    m = rechazo(tmp_path, TIPO_PARCELAS, csv_con(TIPO_PARCELAS, id="L9999"))
    assert "(fila 2: L9999)" in m, m
