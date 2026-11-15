# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Pruebas del tipo de suelo (B8) y de las notas de nutrientes (B7) que motor/suelo_web.py agrega a suelo.json.

(a) Con data/processed REAL: L0175 (nogal, Lázaro Cárdenas) trae las notas de los nutrientes menos disponibles
    (B, Cu, Fe, Mn y Zn entre ellos), la del hierro y la de «near the limit»; P0757 trae su gran grupo, su orden,
    la descripción del catálogo y los suelos del municipio según INEGI. Los textos son los de
    suelo_reglas.json → textos_ficha_en, con los {marcadores} llenos con los datos; los valores esperados se
    leen aquí de los archivos (nunca de memoria).
(b) Lo que falta no rompe: sin las entregas, cada bloque va en null con su motivo; una parcela sin gran grupo o
    sin pH no inventa nada.
Todo se escribe en tmp_path: nunca en data/processed ni en web/data.
"""
import csv
import json
import shutil
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from motor import suelo_web as sw  # noqa: E402

PROCESADOS = RAIZ / "data/processed"
CUBO_REAL = RAIZ / "web/data/cubo.json"
ENTREGAS = ("tipo_suelo_parcelas.csv", "suelo_tipos.json", "suelo_nutrientes_parcelas.csv", "suelo_reglas.json")
HAY_REALES = all((PROCESADOS / a).is_file() for a in ENTREGAS)
reales = pytest.mark.skipif(not HAY_REALES, reason="faltan las entregas B7 y B8 en data/processed")


def leer_filas(nombre, carpeta=PROCESADOS):
    with open(carpeta / nombre, newline="", encoding="utf-8-sig") as f:
        return {fila["id"]: fila for fila in csv.DictReader(f)}


def lista(celda):
    return [x.strip() for x in (celda or "").split(";") if x.strip()]


def de_parcela(suelo, pid):
    """El conjunto de notas de una parcela (nutrientes.parcelas → llave → nutrientes.conjuntos)."""
    nut = suelo["nutrientes"]
    return nut["conjuntos"][nut["parcelas"][pid]]


def tipo_de(suelo, pid):
    """{gran_grupo, zona} de la parcela más lo de su gran grupo (tipo_suelo.grupos)."""
    t = suelo["tipo_suelo"]
    p = t["parcelas"][pid]
    return {**p, **t["grupos"][p["gran_grupo"]]}


@pytest.fixture(scope="module")
def suelo_real(tmp_path_factory):
    if not HAY_REALES:
        pytest.skip("faltan las entregas B7 y B8 en data/processed")
    tmp = tmp_path_factory.mktemp("suelo_real")
    sw.construir(processed=PROCESADOS, web=tmp, cubo_ruta=CUBO_REAL if CUBO_REAL.is_file() else None)
    return json.loads((tmp / "suelo.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def reglas():
    return json.loads((PROCESADOS / "suelo_reglas.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def tipos():
    return json.loads((PROCESADOS / "suelo_tipos.json").read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------------------
# (a) Notas de nutrientes con los archivos reales
# ---------------------------------------------------------------------------------------
@reales
def test_l0175_trae_hierro_zinc_cobre_manganeso_y_boro(suelo_real, reglas):
    fila = leer_filas("suelo_nutrientes_parcelas.csv")["L0175"]
    notas = de_parcela(suelo_real, "L0175")["notas"]
    menos = [n for n in notas if n["caso"] == "menos_disponibles"]
    assert len(menos) == 1 and menos[0]["estado"] == "less_available"
    assert menos[0]["elementos"] == lista(fila["menos_disponibles"])
    assert {"Fe", "Zn", "Cu", "Mn", "B"} <= set(menos[0]["elementos"])
    # El texto es el de textos_ficha_en con los nombres en inglés del mismo archivo.
    textos = reglas["textos_ficha_en"]
    nombres = [textos["nombres_nutrientes_en"][s] for s in lista(fila["menos_disponibles"])]
    plantilla = textos["suelo"]["menos_disponibles"]["texto_en"]
    prefijo, sufijo = plantilla.split("{nutrientes}")
    assert menos[0]["texto_en"].startswith(prefijo) and menos[0]["texto_en"].endswith(sufijo)
    for nombre in nombres:
        assert nombre in menos[0]["texto_en"]
    for nombre in ("iron", "zinc", "copper", "manganese", "boron"):
        assert nombre in menos[0]["texto_en"]


@reales
def test_l0175_trae_la_nota_del_hierro_y_la_del_limite(suelo_real, reglas):
    fila = leer_filas("suelo_nutrientes_parcelas.csv")["L0175"]
    textos = reglas["textos_ficha_en"]["suelo"]
    notas = {n["caso"]: n for n in de_parcela(suelo_real, "L0175")["notas"]}
    assert notas["hierro"]["texto_en"] == textos["hierro"]["texto_en"] and notas["hierro"]["elementos"] == ["Fe"]
    cerca = lista(fila["cerca_del_limite"])
    assert notas["cerca_del_limite"]["estado"] == "near_limit" and notas["cerca_del_limite"]["elementos"] == cerca
    nombres = [reglas["textos_ficha_en"]["nombres_nutrientes_en"][s] for s in cerca]
    assert notas["cerca_del_limite"]["texto_en"] == textos["cerca_del_limite"]["texto_en"].replace(
        "{nutrientes}", sw.lista_en(nombres))


@reales
def test_cada_nota_trae_su_fuente_y_la_resolucion_sale_de_la_entrega(suelo_real, reglas):
    nut = suelo_real["nutrientes"]
    assert set(nut["parcelas"].values()) == set(nut["conjuntos"]), "cada conjunto lo usa alguna parcela"
    for llave, c in nut["conjuntos"].items():
        for n in c["notas"]:
            assert n["fuente"] in nut["fuentes"], (llave, n)
            assert n["texto_en"] and "{" not in n["texto_en"], (llave, n)
    assert nut["fuentes"]["disponibilidad_ph"]["fuente"] == reglas["disponibilidad_ph"]["fuente"]
    assert nut["aviso_en"] == reglas["textos_ficha_en"]["suelo"]["aviso"]["texto_en"]
    # La resolución del mapa no se escribe a mano: es la que dice la línea de fuente de suelo_parcelas.csv.
    fuentes = {f["archivo"]: f for f in json.loads((PROCESADOS / "fuentes.json").read_text(encoding="utf-8"))["fuentes"]}
    res = nut["resolucion_m"]
    assert res["archivo"] == "suelo_parcelas.csv"
    assert f"{res['valor']} m" in fuentes["suelo_parcelas.csv"]["fuente"]
    assert nut["archivo"] == "suelo_nutrientes_parcelas.csv" and nut["fuente"] and nut["fecha"]


@reales
def test_n_k_ca_mg_y_s_no_salen_como_cerca_del_limite(suelo_real):
    """textos_ficha_en.suelo.cerca_del_limite.cuando: sin N, K, Ca, Mg ni S (decisión del integrador)."""
    filas = leer_filas("suelo_nutrientes_parcelas.csv")
    assert set(lista(filas["P0757"]["cerca_del_limite"])) == {"N", "K", "Ca", "Mg", "S"}
    casos = [n["caso"] for n in de_parcela(suelo_real, "P0757")["notas"]]
    assert "cerca_del_limite" not in casos and "menos_disponibles" in casos
    for c in suelo_real["nutrientes"]["conjuntos"].values():
        for n in c["notas"]:
            if n["caso"] == "cerca_del_limite":
                assert not set(n["elementos"]) & {"N", "K", "Ca", "Mg", "S"}


@reales
def test_parcela_sin_ph_no_inventa_notas(suelo_real, reglas):
    filas = leer_filas("suelo_nutrientes_parcelas.csv")
    sin_ph = [pid for pid, f in filas.items() if not f["ph"].strip()]
    assert sin_ph, "los datos reales traen una parcela sin pH (P0316)"
    for pid in sin_ph:
        p = de_parcela(suelo_real, pid)
        assert p["notas"] == [] and p["sin_dato_en"] == reglas["textos_ficha_en"]["suelo"]["sin_dato"]["texto_en"]


@reales
def test_sin_nutrientes_fuera_de_rango_se_dice(suelo_real, reglas):
    """Si las dos listas vienen vacías con pH, la nota es la de sin_aviso_ph (con los reales hoy no hay ninguna)."""
    filas = leer_filas("suelo_nutrientes_parcelas.csv")
    for pid, f in filas.items():
        if f["ph"].strip() and not f["menos_disponibles"].strip() and not f["cerca_del_limite"].strip():
            notas = de_parcela(suelo_real, pid)["notas"]
            assert [n["caso"] for n in notas] == ["sin_aviso_ph"]
            assert notas[0]["texto_en"] == reglas["textos_ficha_en"]["suelo"]["sin_aviso_ph"]["texto_en"]


# ---------------------------------------------------------------------------------------
# (a) Tipo de suelo con los archivos reales
# ---------------------------------------------------------------------------------------
@reales
def test_p0757_trae_su_tipo_de_suelo(suelo_real, reglas, tipos):
    fila = leer_filas("tipo_suelo_parcelas.csv")["P0757"]
    t = tipo_de(suelo_real, "P0757")
    assert t["gran_grupo"] == fila["gran_grupo_usda"] and t["orden"] == fila["orden_usda"]
    assert t["zona"] == fila["zona"]
    assert t["elementos"] == lista(fila["elementos"])
    assert t["descripcion_en"] == tipos["usda_ordenes"][fila["orden_usda"]]["definicion_en"]
    plantilla = reglas["textos_ficha_en"]["tipo_suelo"]["parcela"]["texto_en"]
    assert t["texto_en"] == plantilla.replace("{gran_grupo}", fila["gran_grupo_usda"]).replace("{orden}", fila["orden_usda"])
    bloque = suelo_real["tipo_suelo"]
    for e in t["elementos"]:
        assert bloque["elementos"][e]["significado_en"] == tipos["usda_prefijos_gran_grupo"][e]["significado_en"]
    assert bloque["ordenes"][t["orden"]]["fertilidad_en"] == tipos["usda_ordenes"][t["orden"]]["fertilidad_en"]
    assert bloque["explica_en"] == reglas["textos_ficha_en"]["tipo_suelo"]["explica"]["texto_en"]
    assert bloque["no_coinciden_en"] == reglas["textos_ficha_en"]["tipo_suelo"]["no_coinciden"]["texto_en"]
    assert bloque["archivo"] == "tipo_suelo_parcelas.csv" and bloque["fuente"] and bloque["fecha"]


@reales
def test_suelos_del_municipio_segun_inegi(suelo_real, reglas, tipos):
    """La lista de la zona: suelo_tipos.json → zona.municipio_delicias_pct, de mayor a menor, con los nombres WRB."""
    z = suelo_real["tipo_suelo"]["zonas"]["delicias_saucillo"]
    pct = tipos["zona"]["municipio_delicias_pct"]
    por_nombre_es = {g.get("nombre_es"): k for k, g in tipos["wrb"].items()}
    esperados = sorted(((por_nombre_es[n], v) for n, v in pct.items() if n in por_nombre_es), key=lambda x: -x[1])
    assert [(s["grupo"], s["pct"]) for s in z["suelos"]] == esperados
    prefijo = reglas["textos_ficha_en"]["tipo_suelo"]["zona"]["texto_en"].split("{lista}")[0]
    assert z["texto_en"].startswith(prefijo) and esperados[0][0] in z["texto_en"]
    assert z["fuente"] == tipos["zona"]["fuente"]
    # Lázaro Cárdenas no tiene la lista del municipio en el catálogo.
    assert "lazaro_cardenas" not in suelo_real["tipo_suelo"]["zonas"]


def test_zona_urbana_y_cuerpo_de_agua_no_son_suelo_ni_avisan():
    """Las superficies del cuadro del INEGI que no son suelo (sw.NO_SUELO) completan el 100 % del municipio: no entran a
    la lista ni avisan. Otra llave que no sea un grupo WRB del catálogo sí avisa. Valores de prueba."""
    catalogo = {"wrb": {"Cambisols": {"nombre_es": "Cambisol"}},
                "zona": {"fuente": "prueba", "etiqueta": "[V]",
                         "municipio_delicias_pct": {"Cambisol": 90.0, sw.NO_SUELO[0]: 9.0, sw.NO_SUELO[1]: 1.0}}}
    avisos = []
    z = sw.suelos_del_municipio(catalogo, "delicias_saucillo", "Soils: {lista}.", avisos)
    assert [s["grupo"] for s in z["suelos"]] == ["Cambisols"] and avisos == []
    catalogo["zona"]["municipio_delicias_pct"]["Inventado"] = 1.0
    sw.suelos_del_municipio(catalogo, "delicias_saucillo", "Soils: {lista}.", avisos)
    assert len(avisos) == 1 and "Inventado" in avisos[0] and not any(n in avisos[0] for n in sw.NO_SUELO)


@reales
def test_todas_las_parcelas_del_archivo_traen_su_tipo(suelo_real):
    filas = leer_filas("tipo_suelo_parcelas.csv")
    con_grupo = {pid for pid, f in filas.items() if f["gran_grupo_usda"].strip()}
    assert set(suelo_real["tipo_suelo"]["parcelas"]) == con_grupo
    for pid in con_grupo:
        t = tipo_de(suelo_real, pid)
        assert (t["gran_grupo"], t["orden"], t["zona"]) == (filas[pid]["gran_grupo_usda"], filas[pid]["orden_usda"], filas[pid]["zona"])
    assert set(suelo_real["nutrientes"]["parcelas"]) == set(leer_filas("suelo_nutrientes_parcelas.csv"))
    assert suelo_real["tipo_suelo_motivo"] is None and suelo_real["nutrientes_motivo"] is None


# ---------------------------------------------------------------------------------------
# (b) Lo que falta no rompe
# ---------------------------------------------------------------------------------------
def test_sin_las_entregas_los_bloques_van_en_null_con_su_motivo(tmp_path):
    (tmp_path / "processed").mkdir()
    sw.construir(processed=tmp_path / "processed", web=tmp_path / "web")
    suelo = json.loads((tmp_path / "web/suelo.json").read_text(encoding="utf-8"))
    for bloque in ("tipo_suelo", "nutrientes"):
        assert suelo[bloque] is None and suelo[f"{bloque}_motivo"] == sw.MOTIVO_PEDIDO


@reales
def test_una_parcela_sin_gran_grupo_y_otra_sin_ph_no_rompen(tmp_path):
    processed = tmp_path / "processed"
    processed.mkdir()
    for a in (*ENTREGAS, "fuentes.json", "suelo_parcelas.csv"):
        shutil.copy(PROCESADOS / a, processed / a)
    # L0175 sin gran grupo ni orden; P0757 sin pH (como P0316 en los reales).
    for nombre, pid, vaciar in (("tipo_suelo_parcelas.csv", "L0175", ("gran_grupo_usda", "orden_usda", "elementos")),
                                ("suelo_nutrientes_parcelas.csv", "P0757", None)):
        filas = list(csv.DictReader(open(processed / nombre, newline="", encoding="utf-8-sig")))
        for f in filas:
            if f["id"] == pid:
                for k in (vaciar or [c for c in f if c not in ("id", "zona")]):
                    f[k] = ""
        with open(processed / nombre, "w", newline="", encoding="utf-8") as s:
            w = csv.DictWriter(s, fieldnames=list(filas[0]))
            w.writeheader()
            w.writerows(filas)
    sw.construir(processed=processed, web=tmp_path / "web")
    suelo = json.loads((tmp_path / "web/suelo.json").read_text(encoding="utf-8"))
    assert "L0175" not in suelo["tipo_suelo"]["parcelas"]
    assert de_parcela(suelo, "P0757")["notas"] == []
    assert de_parcela(suelo, "L0175")["notas"], "las demás parcelas siguen igual"


@reales
def test_sin_reglas_no_hay_notas_y_el_tipo_sigue(tmp_path):
    """Sin suelo_reglas.json no hay textos para las notas: el bloque va en null; el tipo de suelo sigue con su nombre."""
    processed = tmp_path / "processed"
    processed.mkdir()
    for a in ("tipo_suelo_parcelas.csv", "suelo_tipos.json", "suelo_nutrientes_parcelas.csv", "fuentes.json"):
        shutil.copy(PROCESADOS / a, processed / a)
    sw.construir(processed=processed, web=tmp_path / "web")
    suelo = json.loads((tmp_path / "web/suelo.json").read_text(encoding="utf-8"))
    assert suelo["nutrientes"] is None and suelo["nutrientes_motivo"] == sw.MOTIVO_PEDIDO
    p = tipo_de(suelo, "P0757")
    assert p["gran_grupo"] and p["texto_en"] is None


def test_lista_en_ingles():
    assert sw.lista_en(["boron"]) == "boron"
    assert sw.lista_en(["boron", "zinc"]) == "boron and zinc"
    assert sw.lista_en(["boron", "copper", "zinc"]) == "boron, copper and zinc"
