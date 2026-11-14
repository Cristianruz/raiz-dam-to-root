# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Pruebas de motor/suelo_web.py (perfil de suelo y aptitud de cada opción → web/data/suelo.json).

Decisión: docs/decisiones/2026-11-14_suelo_aptitud.md.
(a) Sin entregas (como hoy): los tres bloques van en null con su motivo, nada se rellena y el JSON es
    válido. Con data/processed REAL, cada bloque es coherente con los archivos presentes, y el
    web/data/suelo.json publicado es el que el motor arma hoy.
(b) Con un processed DE PRUEBA (tests/fixtures/suelo/generar.py, escrito en tmp_path): el perfil trae
    los valores del CSV tal cual (lo vacío en null), el resumen por zona coincide con un cálculo hecho
    aquí, y la aptitud de CADA opción coincide con un cálculo independiente escrito en esta prueba y
    con la tabla de casos de la fixture (óptimo, tolerado, fuera por pH, fuera por textura, sin rango,
    descanso). El peor estado manda; los avisos de nutrientes respetan su condición.
(c) El JSON nunca trae NaN ni Infinity; el motor no modifica sus entradas; la fixture suelo_lleno.json
    está al día; las entregas de prueba pasan el validador del buzón y, con ellas en el buzón, el
    módulo se enciende solo.
Todo se escribe en tmp_path: nunca en data/processed ni en web/data. Los valores de (b) y (c) son DE
PRUEBA; los rangos y cortes se leen de la fixture, no se escriben aquí.
"""
import csv
import hashlib
import importlib.util
import io
import json
import re
import statistics
import subprocess
import sys
from collections import Counter
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
for ruta in (RAIZ, RAIZ / "tests"):
    if str(ruta) not in sys.path:
        sys.path.insert(0, str(ruta))

from motor import esquemas  # noqa: E402
from motor import suelo_web as sw  # noqa: E402
from test_ensamblar import BUZON_DOS_ZONAS, buzon_con, correr, nombres  # noqa: E402

PROCESADOS = RAIZ / "data/processed"
WEB_REAL = RAIZ / "web/data"
FIXTURE = RAIZ / "tests/fixtures/suelo"
BLOQUES = ("perfil", "requisitos", "aptitud")
ARCHIVO_DE = {"perfil": sw.ARCHIVO_PERFIL, "requisitos": sw.ARCHIVO_REQUISITOS}
ESTADOS = {"fits", "tolerated", "outside_range", "no_published_range"}


def _generador():
    """El generador de la fixture (tests/fixtures/suelo/generar.py), cargado por ruta."""
    spec = importlib.util.spec_from_file_location("generar_suelo", FIXTURE / "generar.py")
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


GEN = _generador()


def sin_constantes(texto):
    """json.loads que falla si el texto trae NaN, Infinity o -Infinity (no son JSON)."""
    def rechazar(nombre):
        raise AssertionError(f"el JSON trae {nombre}")
    return json.loads(texto, parse_constant=rechazar)


def construir_en(tmp_path, processed, cubo_ruta=None):
    resumen = sw.construir(processed=processed, web=tmp_path / "web", cubo_ruta=cubo_ruta)
    texto = (tmp_path / "web/suelo.json").read_text(encoding="utf-8")
    return resumen, sin_constantes(texto), texto


def huella(carpeta):
    return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(Path(carpeta).iterdir()) if p.is_file()}


@pytest.fixture(scope="module")
def lleno(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("suelo_lleno")
    processed = GEN.escribir_processed(tmp / "processed")
    cubo = GEN.escribir_cubo(tmp / "cubo.json")
    antes = (huella(processed), cubo.read_bytes())
    resumen, suelo, texto = construir_en(tmp, processed, cubo)
    return {"resumen": resumen, "suelo": suelo, "texto": texto, "processed": processed, "cubo": cubo, "antes": antes}


# Entradas DE PRUEBA leídas aparte del motor (para los cálculos independientes).
FILAS = {f["id"]: f for f in csv.DictReader(io.StringIO(GEN.texto_perfil()))}
REQ = GEN.requisitos_de_prueba()["cultivos"]
OPCIONES = {pid: {o["id"]: o["secuencia"] for o in p["opciones"]} for pid, p in GEN.cubo_de_prueba()["parcelas"].items()}
ZONA_DE = {f["properties"]["id"]: f["properties"]["zona"] for f in json.loads(
    (BUZON_DOS_ZONAS / "parcelas_base.geojson").read_text(encoding="utf-8"))["features"]}


# ---------------------------------------------------------------------------------------
# (a) Sin entregas (como hoy)
# ---------------------------------------------------------------------------------------
def test_sin_entregas_los_tres_bloques_van_en_null_con_su_motivo(tmp_path):
    (tmp_path / "processed").mkdir()
    cubo = GEN.escribir_cubo(tmp_path / "cubo.json")
    resumen, suelo, _ = construir_en(tmp_path, tmp_path / "processed", cubo)
    for bloque in BLOQUES:
        assert suelo[bloque] is None, bloque
        assert suelo[f"{bloque}_motivo"] == sw.MOTIVO_PEDIDO == "Requested from the data team — not delivered yet"
    assert suelo["aptitud_falta"] == [sw.ARCHIVO_PERFIL, sw.ARCHIVO_REQUISITOS]
    assert suelo["motivo_pedido"] == sw.MOTIVO_PEDIDO and suelo["avisos"] == []
    assert suelo["_encabezado"] == "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
    assert suelo["decision"] == "docs/decisiones/2026-11-14_suelo_aptitud.md"
    assert resumen["bloques"] == {b: False for b in BLOQUES}
    assert resumen["parcelas_con_perfil"] == 0 and resumen["opciones_evaluadas"] == 0 and resumen["estados"] == {}


def test_sin_cubo_y_sin_entregas_no_falla(tmp_path):
    (tmp_path / "processed").mkdir()
    _, suelo, _ = construir_en(tmp_path, tmp_path / "processed")      # <web>/cubo.json no existe
    assert all(suelo[b] is None for b in BLOQUES) and suelo["aptitud_motivo"] == sw.MOTIVO_PEDIDO


def test_real_cada_bloque_es_coherente_con_las_entregas_presentes(tmp_path):
    """Con data/processed real: un bloque existe si y solo si su entrega llegó (hoy, ninguna)."""
    if not PROCESADOS.is_dir():
        pytest.skip("data/processed aún no existe")
    antes = huella(PROCESADOS)
    resumen, suelo, _ = construir_en(tmp_path, PROCESADOS, WEB_REAL / "cubo.json")
    assert huella(PROCESADOS) == antes, "el motor no modifica data/processed"
    for bloque, archivo in ARCHIVO_DE.items():
        if (PROCESADOS / archivo).is_file():
            assert suelo[bloque] is not None or suelo[f"{bloque}_motivo"] == sw.MOTIVO_ILEGIBLE, bloque
        else:
            assert suelo[bloque] is None and suelo[f"{bloque}_motivo"] == sw.MOTIVO_PEDIDO, bloque
            assert archivo in suelo["aptitud_falta"]
    if suelo["perfil"] is None or suelo["requisitos"] is None:
        assert suelo["aptitud"] is None and suelo["aptitud_motivo"]
    assert resumen["bloques"] == {b: suelo[b] is not None for b in BLOQUES}


def test_el_suelo_json_publicado_es_el_que_el_motor_arma_hoy(tmp_path):
    """web/data/suelo.json se regenera con el comando; no se edita a mano."""
    publicado = WEB_REAL / "suelo.json"
    if not publicado.is_file() or not PROCESADOS.is_dir():
        pytest.skip("web/data/suelo.json o data/processed aún no existen")
    _, fresco, _ = construir_en(tmp_path, PROCESADOS, WEB_REAL / "cubo.json")
    actual = sin_constantes(publicado.read_text(encoding="utf-8"))
    for s in (fresco, actual):
        s.pop("generado")
    assert actual == fresco, "web/data/suelo.json está viejo: corra python motor/suelo_web.py"


# ---------------------------------------------------------------------------------------
# (b) Perfil: los valores de la entrega, tal cual
# ---------------------------------------------------------------------------------------
def test_lleno_bloques_presentes_y_resumen(lleno):
    suelo, resumen = lleno["suelo"], lleno["resumen"]
    assert all(suelo[b] is not None and suelo[f"{b}_motivo"] is None for b in BLOQUES)
    assert suelo["aptitud_falta"] == []
    assert resumen["bloques"] == {b: True for b in BLOQUES}
    assert resumen["parcelas_con_perfil"] == len(FILAS)
    evaluadas = [o for p in suelo["aptitud"].values() for o in p.values()]
    assert resumen["opciones_evaluadas"] == len(evaluadas)
    assert resumen["estados"] == dict(Counter(o["estado"] for o in evaluadas))
    assert set(resumen["estados"]) == ESTADOS, "la fixture cubre los cuatro estados"


def test_lleno_perfil_trae_los_valores_del_csv_sin_cambiarlos(lleno):
    perfil = lleno["suelo"]["perfil"]
    assert perfil["archivo"] == sw.ARCHIVO_PERFIL
    assert perfil["fuente"] == GEN.FUENTES_PRUEBA[sw.ARCHIVO_PERFIL] and perfil["fecha"] == GEN.FECHA_PRUEBA
    assert perfil["profundidad_cm"] == GEN.CAPA_PRUEBA
    assert set(perfil["parcelas"]) == set(FILAS)
    campos = ["arena_pct", "limo_pct", "arcilla_pct", "clase_textura", "ph", "carbono_organico_g_kg",
              "nitrogeno_g_kg", "cic_cmol_kg", "salinidad_ce_ds_m", "n_celdas"]
    for pid, fila in FILAS.items():
        p = perfil["parcelas"][pid]
        assert list(p) == campos, "los campos del contrato de suelo.json, en su orden"
        assert p["clase_textura"] == fila["clase_textura"]
        for c in campos:
            if c == "clase_textura":
                continue
            if fila[c] == "":
                assert p[c] is None, f"{pid}.{c}: una celda vacía va en null, nunca en cero"
            else:
                assert p[c] == float(fila[c]), f"{pid}.{c}: el valor de la entrega, sin redondear"
        assert isinstance(p["n_celdas"], int)
    vacias = [pid for pid, f in FILAS.items() if f["salinidad_ce_ds_m"] == ""]
    assert vacias, "la fixture trae una parcela sin salinidad"


def test_lleno_resumen_por_zona_coincide_con_un_calculo_independiente(lleno):
    resumen = lleno["suelo"]["perfil"]["resumen_zona"]
    zonas = sorted({ZONA_DE[pid] for pid in FILAS})
    assert sorted(resumen) == zonas and len(zonas) > 1, "un archivo para las dos zonas"
    for zona in zonas:
        filas = [f for pid, f in FILAS.items() if ZONA_DE[pid] == zona]
        phs = [float(f["ph"]) for f in filas]
        assert resumen[zona]["n"] == len(filas)
        assert resumen[zona]["clases"] == dict(Counter(f["clase_textura"] for f in filas))
        assert sum(resumen[zona]["clases"].values()) == len(filas)
        assert resumen[zona]["ph"] == {"min": min(phs), "mediana": statistics.median(phs), "max": max(phs)}
    # Las clases van en el orden de la lista del contrato.
    for zona in zonas:
        orden = [esquemas.CLASES_TEXTURA.index(c) for c in resumen[zona]["clases"]]
        assert orden == sorted(orden)


def test_lleno_requisitos_es_el_contenido_de_la_entrega_con_su_fuente(lleno):
    requisitos = dict(lleno["suelo"]["requisitos"])
    entrega = requisitos.pop("entrega")
    assert entrega == {"archivo": sw.ARCHIVO_REQUISITOS, "fuente": GEN.FUENTES_PRUEBA[sw.ARCHIVO_REQUISITOS],
                       "fecha": GEN.FECHA_PRUEBA}
    assert requisitos == GEN.requisitos_de_prueba(), "el contenido de suelo_requisitos.json, tal cual"
    assert requisitos["fuente"] and requisitos[esquemas.ESCALA_PH]["fuente"]


# ---------------------------------------------------------------------------------------
# (b) Aptitud: tabla de casos de la fixture y cálculo independiente
# ---------------------------------------------------------------------------------------
# Lo que la fixture declara en su encabezado (tests/fixtures/suelo/generar.py): estado de cada opción.
CASOS = {
    ("P0001", "ACTUAL"): "fits",                       # óptimo
    ("P0001", "maiz_forrajero"): "tolerated",          # tolerado
    ("P0001", "sorgo"): "outside_range",               # fuera por textura
    ("P0001", "algodon"): "no_published_range",        # sin rango (bloques en null)
    ("P0001", "descanso"): "no_published_range",       # descanso
    ("P0002", "ACTUAL"): "fits",
    ("P0002", "alfalfa"): "tolerated",
    ("P0002", "avena_maiz"): "outside_range",          # fuera por pH (un cultivo); manda el peor
    ("P0002", "nogal"): "no_published_range",          # sin rango (el archivo no trae el cultivo)
    ("L0001", "ACTUAL"): "outside_range",              # fuera por pH, textura y salinidad
    ("L0001", "cereal_algodon"): "fits",               # el cultivo sin rango no cuenta
    ("L0001", "no_sembrar"): "no_published_range",     # secuencia vacía
}
NIVELES = ["fits", "tolerated", "outside_range"]       # de mejor a peor


def estado_independiente(secuencia, fila):
    """La regla de aptitud escrita aquí, sin usar motor/suelo_web.py: el peor nivel de los criterios que
    se pueden comparar, cultivo por cultivo; «no_published_range» si ninguno se puede comparar."""
    por_cultivo = []
    for cultivo in secuencia:
        req = REQ.get(cultivo)
        if cultivo == "descanso" or req is None:
            continue
        niveles = []
        if req["ph"] is not None:
            ph, (o_min, o_max), (t_min, t_max) = float(fila["ph"]), req["ph"]["optimo"], req["ph"]["tolerado"]
            niveles.append(0 if o_min <= ph <= o_max else 1 if t_min <= ph <= t_max else 2)
        if req["textura"] is not None:
            clase = fila["clase_textura"]
            niveles.append(0 if clase in req["textura"]["apta"] else 2 if clase in req["textura"]["limitante"] else 1)
        if req["salinidad_umbral_ds_m"] is not None and fila["salinidad_ce_ds_m"] != "":
            niveles.append(0 if float(fila["salinidad_ce_ds_m"]) <= req["salinidad_umbral_ds_m"]["valor"] else 2)
        if niveles:
            por_cultivo.append(max(niveles))
    return NIVELES[max(por_cultivo)] if por_cultivo else "no_published_range"


def test_lleno_la_tabla_de_casos_cubre_las_seis_situaciones():
    assert set(CASOS.values()) == ESTADOS
    assert set(CASOS) == {(pid, oid) for pid in FILAS for oid in OPCIONES[pid]}, "un caso por opción con perfil"
    for caso, estado in CASOS.items():
        assert estado_independiente(OPCIONES[caso[0]][caso[1]], FILAS[caso[0]]) == estado, caso


@pytest.mark.parametrize("caso", sorted(CASOS))
def test_lleno_estado_de_cada_opcion(lleno, caso):
    pid, oid = caso
    aptitud = lleno["suelo"]["aptitud"][pid][oid]
    assert aptitud["estado"] == CASOS[caso]
    assert aptitud["estado"] == estado_independiente(OPCIONES[pid][oid], FILAS[pid])
    assert [c["cultivo"] for c in aptitud["por_cultivo"]] == OPCIONES[pid][oid]
    for cultivo in aptitud["por_cultivo"]:
        assert cultivo["estado"] == estado_independiente([cultivo["cultivo"]], FILAS[pid])
        assert cultivo["estado"] in ESTADOS and set(cultivo) == {"cultivo", "estado", "nota", "motivos", "sin_dato_de_parcela"}


def test_lleno_solo_entran_las_parcelas_con_perfil_y_con_opciones(lleno):
    aptitud = lleno["suelo"]["aptitud"]
    assert set(aptitud) == set(FILAS)
    sin_perfil = [pid for pid, ops in OPCIONES.items() if ops and pid not in FILAS]
    sin_opciones = [pid for pid, ops in OPCIONES.items() if not ops]
    assert sin_perfil and sin_opciones, "la fixture trae una parcela sin perfil y otra sin opciones"
    assert not set(aptitud) & set(sin_perfil + sin_opciones)
    for pid in FILAS:
        assert list(aptitud[pid]) == list(OPCIONES[pid])
    assert any("sin fila en suelo_parcelas.csv" in a and a.endswith(f": {len(sin_perfil)}") for a in lleno["suelo"]["avisos"])


def test_lleno_el_peor_estado_manda(lleno):
    aptitud = lleno["suelo"]["aptitud"]
    # Dos cultivos con rango: uno fuera y otro en su óptimo → la opción queda fuera.
    doble = aptitud["P0002"]["avena_maiz"]
    assert [c["estado"] for c in doble["por_cultivo"]] == ["outside_range", "fits"] and doble["estado"] == "outside_range"
    # Un cultivo con dos criterios en «tolerated» y ninguno peor → «tolerated».
    assert [m["estado"] for m in aptitud["P0002"]["alfalfa"]["por_cultivo"][0]["motivos"]] == ["tolerated", "tolerated"]
    # Un cultivo con rango y otro sin rango: el que no tiene rango no cuenta.
    mixta = aptitud["L0001"]["cereal_algodon"]
    assert [c["estado"] for c in mixta["por_cultivo"]] == ["fits", "no_published_range"] and mixta["estado"] == "fits"
    # En cada cultivo y en cada opción, el estado es el peor de sus partes.
    for opciones in aptitud.values():
        for o in opciones.values():
            for c in o["por_cultivo"]:
                niveles = [NIVELES.index(m["estado"]) for m in c["motivos"]]
                assert c["estado"] == (NIVELES[max(niveles)] if niveles else "no_published_range")
            con_rango = [NIVELES.index(c["estado"]) for c in o["por_cultivo"] if c["estado"] != "no_published_range"]
            assert o["estado"] == (NIVELES[max(con_rango)] if con_rango else "no_published_range")


def test_peor_estado():
    assert sw.peor([]) == "no_published_range"
    assert sw.peor(["no_published_range"]) == "no_published_range"
    assert sw.peor(["fits", "fits"]) == "fits"
    assert sw.peor(["fits", "tolerated"]) == sw.peor(["tolerated", "fits"]) == "tolerated"
    assert sw.peor(["tolerated", "outside_range", "fits"]) == "outside_range"
    assert sw.peor(["no_published_range", "fits"]) == "fits", "lo que no tiene rango no cuenta"
    assert sw.SEVERIDAD == ("fits", "tolerated", "outside_range") and set(sw.ESTADOS) == ESTADOS


def test_lleno_cada_motivo_trae_valor_rango_y_fuente(lleno):
    for pid, opciones in lleno["suelo"]["aptitud"].items():
        fila = FILAS[pid]
        for o in opciones.values():
            for c in o["por_cultivo"]:
                req = REQ.get(c["cultivo"])
                for m in c["motivos"]:
                    assert set(m) == {"criterio", "estado", "valor_parcela", "rango_o_lista", "fuente"}
                    if m["criterio"] == "ph":
                        assert m["valor_parcela"] == float(fila["ph"])
                        assert m["rango_o_lista"] == {"optimo": req["ph"]["optimo"], "tolerado": req["ph"]["tolerado"]}
                        assert m["fuente"] == req["ph"]["fuente"]
                    elif m["criterio"] == "textura":
                        assert m["valor_parcela"] == fila["clase_textura"]
                        assert m["rango_o_lista"] == {"apta": req["textura"]["apta"], "limitante": req["textura"]["limitante"]}
                        assert m["fuente"] == req["textura"]["fuente"]
                    else:
                        assert m["criterio"] == "salinidad"
                        assert m["valor_parcela"] == float(fila["salinidad_ce_ds_m"])
                        assert m["rango_o_lista"] == {"umbral_ds_m": req["salinidad_umbral_ds_m"]["valor"]}
                        assert m["fuente"] == req["salinidad_umbral_ds_m"]["fuente"]
                    assert m["fuente"], "ningún motivo sin fuente"


def test_lleno_la_salinidad_solo_cuenta_si_estan_la_parcela_y_el_umbral(lleno):
    aptitud = lleno["suelo"]["aptitud"]
    # P0002 no trae salinidad: la alfalfa de prueba tiene umbral, pero el criterio no cuenta y se dice.
    sin_ce = aptitud["P0002"]["alfalfa"]["por_cultivo"][0]
    assert FILAS["P0002"]["salinidad_ce_ds_m"] == "" and REQ["alfalfa"]["salinidad_umbral_ds_m"]
    assert "salinidad" not in [m["criterio"] for m in sin_ce["motivos"]] and sin_ce["sin_dato_de_parcela"] == ["salinidad"]
    # P0001 sí la trae: cuenta con la alfalfa (tiene umbral) y no con el maíz de prueba (sin umbral).
    assert "salinidad" in [m["criterio"] for m in aptitud["P0001"]["ACTUAL"]["por_cultivo"][0]["motivos"]]
    maiz = aptitud["P0001"]["maiz_forrajero"]["por_cultivo"][0]
    assert [m["criterio"] for m in maiz["motivos"]] == ["ph"] and maiz["sin_dato_de_parcela"] == []


def test_lleno_descanso_y_sin_rango_llevan_su_nota(lleno):
    aptitud = lleno["suelo"]["aptitud"]
    descanso = aptitud["P0001"]["descanso"]
    assert descanso["nota"] == "nothing is planted" == sw.NOTA_NO_SIEMBRA
    assert descanso["por_cultivo"] == [{"cultivo": esquemas.NO_SIEMBRA, "estado": "no_published_range",
                                        "nota": "nothing is planted", "motivos": [], "sin_dato_de_parcela": []}]
    vacia = aptitud["L0001"]["no_sembrar"]
    assert vacia == {"estado": "no_published_range", "nota": "nothing is planted", "por_cultivo": [], "avisos_nutrientes": []}
    for pid, oid in (("P0001", "algodon"), ("P0002", "nogal")):      # bloques en null; cultivo ausente
        o = aptitud[pid][oid]
        assert o["nota"] is None and o["por_cultivo"][0]["nota"] == sw.NOTA_SIN_RANGO and o["por_cultivo"][0]["motivos"] == []
    # Una opción con cultivo evaluado no lleva nota.
    assert aptitud["P0001"]["ACTUAL"]["nota"] is None and aptitud["P0001"]["ACTUAL"]["por_cultivo"][0]["nota"] is None


def test_con_rango_y_sin_valor_de_la_parcela_se_dice():
    """Solo hay umbral de salinidad y la parcela no trae salinidad: nada que comparar, y la nota lo dice."""
    listos = sw.normalizar_requisitos(REQ, [])
    perfil = {"ph": 4.5, "clase_textura": "loam", "salinidad_ce_ds_m": None}
    c = sw.aptitud_de_cultivo("chile", perfil, listos)
    assert REQ["chile"]["ph"] is None and REQ["chile"]["textura"] is None
    assert c["estado"] == "no_published_range" and c["nota"] == sw.NOTA_SIN_VALOR and c["sin_dato_de_parcela"] == ["salinidad"]


# ---------------------------------------------------------------------------------------
# (b) Extremos de los rangos y avisos de nutrientes
# ---------------------------------------------------------------------------------------
def test_los_extremos_de_los_rangos_estan_incluidos():
    listos = sw.normalizar_requisitos(REQ, [])
    (o_min, o_max), (t_min, t_max) = REQ["alfalfa"]["ph"]["optimo"], REQ["alfalfa"]["ph"]["tolerado"]
    paso = (o_min - t_min) / 2                       # un valor entre el tolerado y el óptimo de la fixture
    assert paso > 0
    esperado = [(o_min, "fits"), (o_max, "fits"), (o_min - paso, "tolerated"), (o_max + paso, "tolerated"),
                (t_min, "tolerated"), (t_max, "tolerated"), (t_min - paso, "outside_range"), (t_max + paso, "outside_range")]
    for ph, estado in esperado:
        assert sw.criterio_ph({"ph": ph}, listos["alfalfa"]["ph"])["estado"] == estado, ph
    umbral = REQ["alfalfa"]["salinidad_umbral_ds_m"]["valor"]
    bloque = listos["alfalfa"]["salinidad_umbral_ds_m"]
    assert sw.criterio_salinidad({"salinidad_ce_ds_m": umbral}, bloque)["estado"] == "fits", "igual al umbral: dentro"
    assert sw.criterio_salinidad({"salinidad_ce_ds_m": umbral + paso}, bloque)["estado"] == "outside_range"
    assert sw.criterio_salinidad({"salinidad_ce_ds_m": None}, bloque) is None
    assert sw.criterio_salinidad({"salinidad_ce_ds_m": umbral}, None) is None
    assert sw.criterio_ph({"ph": None}, listos["alfalfa"]["ph"]) is None and sw.criterio_ph({"ph": o_min}, None) is None
    textura = listos["alfalfa"]["textura"]
    assert sw.criterio_textura({"clase_textura": REQ["alfalfa"]["textura"]["apta"][0]}, textura)["estado"] == "fits"
    assert sw.criterio_textura({"clase_textura": REQ["alfalfa"]["textura"]["limitante"][0]}, textura)["estado"] == "outside_range"
    otra = next(c for c in esquemas.CLASES_TEXTURA if c not in textura["apta"] + textura["limitante"])
    assert sw.criterio_textura({"clase_textura": otra}, textura)["estado"] == "tolerated"
    assert sw.criterio_textura({"clase_textura": None}, textura) is None


def avisos_independientes(secuencia, fila):
    """Los elementos cuyo aviso aplica, con la condición evaluada aquí (sin usar el motor)."""
    elementos = []
    for cultivo in secuencia:
        for nut in (REQ.get(cultivo) or {}).get("nutrientes", []):
            cond = nut.get("condicion") or {}
            ph = float(fila["ph"])
            cumple = (("ph_mayor_que" not in cond or ph > cond["ph_mayor_que"])
                      and ("ph_menor_que" not in cond or ph < cond["ph_menor_que"])
                      and ("textura_en" not in cond or fila["clase_textura"] in cond["textura_en"]))
            if cumple:
                elementos.append(nut["elemento"])
    return elementos


def test_lleno_los_avisos_de_nutrientes_respetan_su_condicion(lleno):
    aptitud = lleno["suelo"]["aptitud"]
    # Lo que la fixture declara: sin condición → siempre; cada condición, solo donde se cumple.
    assert [n["elemento"] for n in aptitud["P0001"]["ACTUAL"]["avisos_nutrientes"]] == ["Fe", "K"]
    assert [n["elemento"] for n in aptitud["P0002"]["alfalfa"]["avisos_nutrientes"]] == ["Zn", "Fe"]
    assert [n["elemento"] for n in aptitud["L0001"]["ACTUAL"]["avisos_nutrientes"]] == ["Zn", "Fe", "P", "Mn"]
    for pid, opciones in aptitud.items():
        for oid, o in opciones.items():
            assert [n["elemento"] for n in o["avisos_nutrientes"]] == avisos_independientes(OPCIONES[pid][oid], FILAS[pid]), (pid, oid)
            for n in o["avisos_nutrientes"]:
                assert set(n) == {"elemento", "texto_en", "fuente", "cultivo"}
                origen = next(x for x in REQ[n["cultivo"]]["nutrientes"] if x["elemento"] == n["elemento"])
                assert n["texto_en"] == origen["texto_en"] and n["fuente"] == origen["fuente"]
    # Una opción sin alfalfa de prueba no hereda sus avisos.
    assert aptitud["P0001"]["sorgo"]["avisos_nutrientes"] == []


def test_condicion_de_un_aviso():
    perfil = {"ph": 4.5, "clase_textura": "clay"}
    assert sw.condicion_cumplida(None, perfil) and sw.condicion_cumplida({}, perfil)
    assert sw.condicion_cumplida({"ph_mayor_que": 4.0}, perfil) and not sw.condicion_cumplida({"ph_mayor_que": 4.5}, perfil)
    assert sw.condicion_cumplida({"ph_menor_que": 5.0}, perfil) and not sw.condicion_cumplida({"ph_menor_que": 4.5}, perfil)
    assert sw.condicion_cumplida({"textura_en": ["clay"]}, perfil) and not sw.condicion_cumplida({"textura_en": ["loam"]}, perfil)
    # Varias llaves: todas.
    assert sw.condicion_cumplida({"ph_mayor_que": 4.0, "textura_en": ["clay"]}, perfil)
    assert not sw.condicion_cumplida({"ph_mayor_que": 4.0, "textura_en": ["loam"]}, perfil)
    # Si la condición pide un valor que la parcela no trae, no se cumple (no se supone nada).
    assert not sw.condicion_cumplida({"ph_mayor_que": 4.0}, {"ph": None, "clase_textura": "clay"})
    assert not sw.condicion_cumplida({"textura_en": ["clay"]}, {"ph": 4.5, "clase_textura": None})


# ---------------------------------------------------------------------------------------
# (c) Sin NaN, sin tocar las entradas, bloques a medias, fixture al día y buzón
# ---------------------------------------------------------------------------------------
def test_lleno_json_sin_nan_y_sin_tocar_las_entradas(lleno):
    assert "NaN" not in lleno["texto"] and "Infinity" not in lleno["texto"]
    sin_constantes(lleno["texto"])
    assert (huella(lleno["processed"]), lleno["cubo"].read_bytes()) == lleno["antes"], "el motor no modifica sus entradas"


def test_una_celda_nan_va_en_null_y_no_llega_como_nan(tmp_path):
    """Si una entrega trajera «NaN» (pandas) en una celda opcional, la página recibe null."""
    processed = GEN.escribir_processed(tmp_path / "processed")
    filas = [f.replace(",0.11,", ",NaN,") for f in GEN.FILAS_PERFIL]
    assert filas != list(GEN.FILAS_PERFIL)
    (processed / sw.ARCHIVO_PERFIL).write_text(GEN.texto_perfil(filas), encoding="utf-8")
    _, suelo, texto = construir_en(tmp_path, processed, GEN.escribir_cubo(tmp_path / "cubo.json"))
    assert suelo["perfil"]["parcelas"]["P0001"]["nitrogeno_g_kg"] is None and "NaN" not in texto
    with pytest.raises(ValueError):
        sw.volcar({"x": float("nan")})


@pytest.mark.parametrize("falta", [sw.ARCHIVO_PERFIL, sw.ARCHIVO_REQUISITOS])
def test_con_una_sola_entrega_no_hay_aptitud(tmp_path, falta):
    processed = GEN.escribir_processed(tmp_path / "processed")
    (processed / falta).unlink()
    resumen, suelo, _ = construir_en(tmp_path, processed, GEN.escribir_cubo(tmp_path / "cubo.json"))
    presente = "requisitos" if falta == sw.ARCHIVO_PERFIL else "perfil"
    ausente = "perfil" if falta == sw.ARCHIVO_PERFIL else "requisitos"
    assert suelo[presente] is not None and suelo[ausente] is None and suelo[f"{ausente}_motivo"] == sw.MOTIVO_PEDIDO
    assert suelo["aptitud"] is None and suelo["aptitud_motivo"] == sw.MOTIVO_PEDIDO and suelo["aptitud_falta"] == [falta]
    assert resumen["bloques"] == {"perfil": presente == "perfil", "requisitos": presente == "requisitos", "aptitud": False}


def test_sin_cubo_no_hay_aptitud_y_se_dice(tmp_path):
    processed = GEN.escribir_processed(tmp_path / "processed")
    resumen, suelo, _ = construir_en(tmp_path, processed)             # <web>/cubo.json no existe
    assert suelo["perfil"] is not None and suelo["requisitos"] is not None
    assert suelo["aptitud"] is None and suelo["aptitud_motivo"] == sw.MOTIVO_SIN_CUBO and suelo["aptitud_falta"] == []
    assert any("cubo.json" in a for a in resumen["avisos"])


def test_una_entrega_ilegible_va_en_null_con_aviso_y_no_detiene(tmp_path):
    processed = GEN.escribir_processed(tmp_path / "processed")
    (processed / sw.ARCHIVO_PERFIL).write_text("id,ph\nP0001,3.5\n", encoding="utf-8")       # sin las columnas del contrato
    (processed / sw.ARCHIVO_REQUISITOS).write_text("{ esto no es JSON", encoding="utf-8")
    resumen, suelo, _ = construir_en(tmp_path, processed, GEN.escribir_cubo(tmp_path / "cubo.json"))
    for bloque in BLOQUES:
        assert suelo[bloque] is None and suelo[f"{bloque}_motivo"] == sw.MOTIVO_ILEGIBLE, bloque
    assert suelo["aptitud_falta"] == []
    assert sum("no se pudo leer" in a for a in resumen["avisos"]) == 2


def test_capas_distintas_van_por_parcela(tmp_path):
    processed = GEN.escribir_processed(tmp_path / "processed")
    filas = list(GEN.FILAS_PERFIL)
    filas[0] = filas[0].replace(f",{GEN.CAPA_PRUEBA},", ",0-5,")
    (processed / sw.ARCHIVO_PERFIL).write_text(GEN.texto_perfil(filas), encoding="utf-8")
    resumen, suelo, _ = construir_en(tmp_path, processed, GEN.escribir_cubo(tmp_path / "cubo.json"))
    perfil = suelo["perfil"]
    assert perfil["profundidad_cm"] is None
    assert {pid: p["profundidad_cm"] for pid, p in perfil["parcelas"].items()} == {"P0001": "0-5", "P0002": GEN.CAPA_PRUEBA,
                                                                                 "L0001": GEN.CAPA_PRUEBA}
    assert any("profundidad_cm" in a for a in resumen["avisos"])


def test_un_bloque_de_requisitos_mal_formado_no_cuenta_y_se_avisa():
    """El validador del buzón ya lo rechazaría; si aun así llegara, el motor no inventa: lo deja fuera."""
    crudo = GEN.requisitos_de_prueba()["cultivos"]
    crudo["alfalfa"]["ph"]["optimo"] = [1.0, 9.0]                   # no cabe en el tolerado de prueba
    crudo["sorgo"]["textura"]["limitante"] = crudo["sorgo"]["textura"]["apta"]
    crudo["alfalfa"]["nutrientes"][0]["condicion"] = {"llave_desconocida": 1}
    avisos = []
    listos = sw.normalizar_requisitos(crudo, avisos)
    assert listos["alfalfa"]["ph"] is None and listos["sorgo"]["textura"] is None
    assert listos["alfalfa"]["textura"] is not None, "los demás bloques siguen"
    assert len(listos["alfalfa"]["nutrientes"]) == len(crudo["alfalfa"]["nutrientes"]) - 1
    assert len(avisos) == 3 and all("no" in a for a in avisos)
    assert sw.aptitud_de_cultivo("sorgo", {"ph": 4.5, "clase_textura": "loam"}, listos)["estado"] == "no_published_range"


def test_avisos_del_motor_sobre_cultivos(lleno):
    avisos = " | ".join(lleno["suelo"]["avisos"])
    assert "no trae requisitos de: nogal" in avisos, "un cultivo sembrado sin requisitos se dice"
    assert "ninguna opción del cubo siembra: chile" in avisos
    assert "aún no admite" not in avisos, "los cultivos de las secuencias de prueba son clases del proyecto"


def test_textos_fijos_sin_cifras_y_sin_promesas(lleno):
    """El rótulo de escala no trae la resolución escrita a mano (sale de la línea de fuente del archivo)."""
    suelo = lleno["suelo"]
    assert suelo["rotulo"] == sw.ROTULO == "Regional soil map; not a soil test"
    fijos = [sw.ROTULO, sw.MOTIVO_PEDIDO, sw.MOTIVO_ILEGIBLE, sw.MOTIVO_SIN_CUBO, sw.NOTA_NO_SIEMBRA, sw.NOTA_SIN_RANGO,
             sw.NOTA_SIN_VALOR]
    for texto in fijos:
        assert not re.search(r"\d", texto), texto
        assert not re.search(r"\b(first|only|best|recommended|sav(e|es|ed|ing|ings))\b", texto, re.I), texto
    assert re.search(r"\d+ m\b", suelo["perfil"]["fuente"]), "la resolución está en la línea de fuente de la entrega"
    assert suelo["idioma_fuentes"] == "es"


def test_fixture_suelo_lleno_esta_al_dia(tmp_path):
    """tests/fixtures/suelo/suelo_lleno.json es lo que arma el motor con el processed de prueba."""
    GEN.escribir_processed(tmp_path)
    assert (FIXTURE / "suelo_lleno.json").read_text(encoding="utf-8") == sw.volcar(GEN.suelo_de_prueba(tmp_path)), \
        "regenere la fixture: python tests/fixtures/suelo/generar.py"


def test_las_entregas_de_prueba_pasan_el_validador_y_encienden_el_modulo(tmp_path):
    """Buzón → motor/ensamblar.py → processed → motor/suelo_web.py: con las entregas, el módulo se enciende solo."""
    archivos = {sw.ARCHIVO_PERFIL: GEN.texto_perfil(), sw.ARCHIVO_REQUISITOS: GEN.texto_requisitos()}
    rep = correr(buzon_con(tmp_path, archivos, base=BUZON_DOS_ZONAS), tmp_path)
    assert rep["rechazados"] == [] and rep["retenidos"] == []
    assert set(archivos) <= set(nombres(rep["entraron"]))
    resumen, suelo, _ = construir_en(tmp_path, tmp_path / "salida", GEN.escribir_cubo(tmp_path / "cubo.json"))
    assert resumen["bloques"] == {b: True for b in BLOQUES}
    # La fuente y la fecha son las de la línea de LEEME.md del buzón (fuentes.json del ensamblador).
    registro = {f["archivo"]: f for f in rep["fuentes"]}
    assert suelo["perfil"]["fuente"] == registro[sw.ARCHIVO_PERFIL]["fuente"]
    assert suelo["perfil"]["fecha"] == registro[sw.ARCHIVO_PERFIL]["fecha"]
    assert suelo["requisitos"]["entrega"]["fuente"] == registro[sw.ARCHIVO_REQUISITOS]["fuente"]
    assert {(pid, oid): o["estado"] for pid, ops in suelo["aptitud"].items() for oid, o in ops.items()} == CASOS


def test_cli_escribe_suelo_json(tmp_path):
    processed = GEN.escribir_processed(tmp_path / "processed")
    cubo = GEN.escribir_cubo(tmp_path / "cubo.json")
    r = subprocess.run([sys.executable, str(RAIZ / "motor/suelo_web.py"), "--processed", str(processed),
                        "--web", str(tmp_path / "web"), "--cubo", str(cubo)], capture_output=True, text=True, cwd=RAIZ)
    assert r.returncode == 0, r.stderr
    resumen = json.loads(r.stdout)
    assert resumen["ejecutado"] is True and resumen["bloques"] == {b: True for b in BLOQUES}
    assert Path(resumen["salida"]) == tmp_path / "web/suelo.json"
    suelo = sin_constantes((tmp_path / "web/suelo.json").read_text(encoding="utf-8"))
    assert suelo["perfil"]["parcelas"].keys() == FILAS.keys()


def test_cubo_por_omision_es_el_de_la_carpeta_web(tmp_path):
    """Sin cubo_ruta, las opciones salen de <web>/cubo.json (como en la página real)."""
    processed = GEN.escribir_processed(tmp_path / "processed")
    GEN.escribir_cubo(tmp_path / "web/cubo.json")
    resumen, suelo, _ = construir_en(tmp_path, processed)
    assert resumen["bloques"]["aptitud"] and set(suelo["aptitud"]) == set(FILAS)
