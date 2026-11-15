# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Opciones y filtros oficiales (B3): contrato de docs/decisiones/2026-11-14_opciones_b3.md.

Todo con la fixture DE PRUEBA tests/fixtures/opciones_b3/ (opciones_b3.json, heladas.json y supuestos.json:
valores escritos para la prueba, no son la entrega de la sesión de datos ni contenido del maestro §5.2) y con
carpetas temporales: data/processed y web/data no se tocan.

(a) Buzón (motor/ensamblar.py, regla «opciones_b3»): el archivo de prueba entra; cada archivo malo se
    rechaza con un motivo legible; las listas cerradas del esquema son las de la decisión.
(b) Motor (motor/b4_cubo.py) con el archivo en un processed temporal: las alternativas salen de
    por_cultivo_actual y el nombre, la secuencia, los indicadores y advertir_si_rojo, de «opciones»; el
    cultivo que el archivo no lista sigue con el diseño provisional y se avisa; una opción sin lámina se omite
    con aviso; el catálogo va una vez en el cubo.
(c) Filtros: tres estados. El de helada adjunta la probabilidad de heladas.json de la zona de la parcela (la
    fecha calculada más cercana anterior o igual a la siembra) y solo decide con el umbral de su «regla»; sin
    umbral, sin probabilidad, con un dato local que no tenemos o de un tipo sin evaluador queda
    «needs_local_check»: nunca aprobado.
(d) Sin el archivo, el cubo sale con el diseño provisional, como hasta ahora.
(e) Contrato (validar_contrato.py) y manifest (motor/manifest.py): la forma de «filtros» pasa, un estado
    fuera de lista no, y prob_helada lleva la fuente de heladas.json.
(f) Regla 10 de CLAUDE.md en los textos en inglés que la ficha muestra (nombre_en, por_que_en, texto_en y
    etiqueta): el buzón rechaza «first», «only», promesas de ahorro y lo demás de la lista de
    motor/verificador.py (la misma lista, importada), y las cifras, corchetes y llaves en nombre_en, que el
    motor interpola en explicaciones.json. Los textos que la ficha muestra se recorren en el cubo armado con
    la fixture y en el cubo real (web/data/cubo.json).
"""
import json
import re
import shutil
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
for ruta in (str(RAIZ), str(RAIZ / "motor")):
    if ruta not in sys.path:
        sys.path.insert(0, ruta)

import validar_contrato  # noqa: E402
from motor import b4_cubo, esquemas, manifest, verificador  # noqa: E402
from motor import ensamblar as ens  # noqa: E402

FIX = RAIZ / "tests/fixtures/opciones_b3"
PROCESADOS_DOS_ZONAS = RAIZ / "tests/fixtures/b4_dos_zonas/processed"
BUZON_OK = RAIZ / "tests/fixtures/buzon_ok"
DECISION = RAIZ / "docs/decisiones/2026-11-14_opciones_b3.md"
ARCHIVO = "opciones_b3.json"
B3 = json.loads((FIX / ARCHIVO).read_text(encoding="utf-8"))
HELADAS = json.loads((FIX / "heladas.json").read_text(encoding="utf-8"))
CFG = json.loads((RAIZ / "data/opciones_b4.json").read_text(encoding="utf-8"))
DZ, LC = "delicias_saucillo", "lazaro_cardenas"
WEB = RAIZ / "web/data"
PASSES, WARNING, NEEDS = b4_cubo.PASSES, b4_cubo.WARNING, b4_cubo.NEEDS_LOCAL_CHECK


def leer(carpeta, nombre):
    return json.loads((Path(carpeta) / nombre).read_text(encoding="utf-8"))


# ---------------------------------------------------------------------------------------
# (a) Buzón: el validador
# ---------------------------------------------------------------------------------------
def buzon_con(tmp_path, contenido):
    """Buzón temporal con opciones_b3.json (dict o texto) y su línea en LEEME.md."""
    b = tmp_path / "buzon"
    b.mkdir(parents=True, exist_ok=True)
    texto = contenido if isinstance(contenido, str) else json.dumps(contenido, ensure_ascii=False)
    (b / ARCHIVO).write_text(texto, encoding="utf-8")
    (b / "LEEME.md").write_text("| archivo | fuente | fecha | script |\n|---|---|---|---|\n"
                                f"| {ARCHIVO} | Valores de prueba (fixture) | 2026-11-14 | tests/test_opciones_b3.py |\n",
                                encoding="utf-8")
    return b


def ensamblar(tmp_path, contenido):
    return ens.ensamblar(buzon_con(tmp_path, contenido), salida=tmp_path / "salida", log=tmp_path / "log.md")


def alterado(cambio):
    """Copia de la fixture con un cambio aplicado (función sobre el dict)."""
    obj = json.loads(json.dumps(B3))
    cambio(obj)
    return obj


def test_fixture_esta_rotulada_y_no_esta_en_processed():
    assert "DATOS DE PRUEBA" in B3["_nota"] and "PRUEBA" in B3["fuente"]
    assert "PRUEBA" in HELADAS["_nota"]
    assert not (RAIZ / "data/processed" / ARCHIVO).exists() or \
        "PRUEBA" not in (RAIZ / "data/processed" / ARCHIVO).read_text(encoding="utf-8"), \
        "la fixture de prueba no va en data/processed"


def test_archivo_de_prueba_entra_por_el_validador(tmp_path):
    rep = ensamblar(tmp_path, (FIX / ARCHIVO).read_text(encoding="utf-8"))
    assert rep["rechazados"] == [], rep["rechazados"]
    entrada = next(x for x in rep["entraron"] if x["archivo"] == ARCHIVO)
    assert entrada["pieza"] == "B3"
    assert (tmp_path / "salida" / ARCHIVO).read_bytes() == (FIX / ARCHIVO).read_bytes(), "se copia sin modificar"
    avisos = " | ".join(entrada["avisos"])
    assert "cereal_invierno" in avisos and "diseño provisional" in avisos   # cultivo que el archivo no lista
    assert "helada_sin_umbral" in avisos and "no decidirá" in avisos        # filtro de helada sin umbral
    assert ARCHIVO in ens.esperados_simulados(), "mientras no llegue, el reporte lo cuenta como pendiente"


def _quitar(*ruta):
    def cambio(o):
        for parte in ruta[:-1]:
            o = o[parte]
        del o[ruta[-1]]
    return cambio


def _poner(valor, *ruta):
    def cambio(o):
        for parte in ruta[:-1]:
            o = o[parte]
        o[ruta[-1]] = valor
    return cambio


# Inicio del motivo de rechazo por lenguaje (motor/ensamblar.py); sigue «: «palabra» (motivo) (opción o filtro)».
LENGUAJE = "con lenguaje que la ficha no admite (CLAUDE.md, regla 10)"

MALOS = {
    "letra fuera de lista": (_poner("Z", "opciones", "chile", "letra_maestro"), "letra_maestro fuera de la lista"),
    "ciclo fuera de lista": (_poner("verano", "opciones", "chile", "secuencia", 0, "ciclo"), "ciclo fuera de la lista"),
    "siembra que no es MM-DD": (_poner("10 de marzo", "opciones", "chile", "secuencia", 0, "siembra", "desde"),
                                "siembra.desde no es una fecha MM-DD"),
    "siembra con día imposible": (_poner("02-31", "opciones", "chile", "secuencia", 0, "siembra", "hasta"),
                                  "siembra.hasta no es una fecha MM-DD"),
    "indicador que no es booleano": (_poner("sí", "opciones", "chile", "indicadores", "leguminosa"),
                                     "indicadores.leguminosa debe ser true, false o null"),
    "indicador sin su llave": (_quitar("opciones", "chile", "indicadores", "raiz_profunda"),
                               "indicadores sin la llave raiz_profunda"),
    "advertir que no es booleano": (_poner("no", "opciones", "alfalfa", "advertir_si_rojo"),
                                    "advertir_si_rojo debe ser true o false"),
    "opción sin nombre": (_poner(" ", "opciones", "sorgo", "nombre_en"), "opción sin nombre_en"),
    "opción sin fuente": (_poner(None, "opciones", "sorgo", "fuente"), "opción sin fuente"),
    "cultivo actual fuera del contrato": (lambda o: o["por_cultivo_actual"].update(trigo=["chile", "sorgo"]),
                                         "cultivo fuera del contrato"),
    "alternativa no definida": (lambda o: o["por_cultivo_actual"]["nogal"].append("girasol"),
                                "por_cultivo_actual nombra una opción que no está definida"),
    "tipo de filtro fuera de lista": (_poner("plaga", "filtros", 0, "tipo"), "tipo de filtro fuera de la lista"),
    "filtro sin texto": (_poner("", "filtros", 1, "texto_en"), "filtro sin texto_en"),
    "filtro sin fuente": (_poner("  ", "filtros", 2, "fuente"), "filtro sin fuente"),
    "filtro con id repetido": (lambda o: o["filtros"][1].update(id=o["filtros"][0]["id"]), "id de filtro repetido"),
    "filtro que aplica a una opción no definida": (_poner(["chile", "girasol"], "filtros", 0, "aplica_a"),
                                                   "aplica_a nombra una opción que no está definida"),
    "umbral de helada que no es probabilidad": (_poner(20, "filtros", 0, "regla", b4_cubo.UMBRAL_HELADA),
                                                "debe ser una probabilidad entre 0 y 1"),
    "sin fuente del archivo": (_quitar("fuente"), "falta fuente"),
    "sin por_cultivo_actual": (_quitar("por_cultivo_actual"), "falta por_cultivo_actual"),
    "sin filtros": (_quitar("filtros"), "falta filtros"),
    # Regla 10 (CLAUDE.md) en los textos en inglés que la ficha muestra: campo, palabra y opción o filtro.
    "texto_en con first, only y saves": (
        _poner("Sow only after the first frost-free date; this saves water.", "filtros", 0, "texto_en"),
        f"texto_en {LENGUAJE}: «first» (palabra prohibida), «only» (palabra prohibida), «saves» (promete ahorros) "
        "(filtro helada_siembra)"),
    "texto_en que pronostica la presa": (_poner("The dam will refill by spring.", "filtros", 2, "texto_en"),
                                         f"texto_en {LENGUAJE}: «will refill» (pronostica la presa) (filtro antecedente_local)"),
    "nombre_en con only": (_poner("Alfalfa only in winter", "opciones", "alfalfa", "nombre_en"),
                           f"nombre_en {LENGUAJE}: «only» (palabra prohibida) (opción alfalfa)"),
    "por_que_en que promete ahorros": (_poner("Its Savings are large.", "opciones", "sorgo", "por_que_en"),
                                       f"por_que_en {LENGUAJE}: «savings» (promete ahorros) (opción sorgo)"),
    "etiqueta de opción con only": (_poner("TEST ONLY", "opciones", "chile", "etiqueta"),
                                    f"etiqueta {LENGUAJE}: «only» (palabra prohibida) (opción chile)"),
    "etiqueta de filtro con first": (_poner("first draft [S]", "filtros", 3, "etiqueta"),
                                     f"etiqueta {LENGUAJE}: «first» (palabra prohibida) (filtro fecha_limite_prueba)"),
    # nombre_en se interpola en explicaciones.json (kit C3): ni cifras ni signos de cita o de marcador.
    "nombre_en con cifras": (
        _poner("Alfalfa, skipping 2-3 summer irrigations", "opciones", "alfalfa_corte_verano", "nombre_en"),
        "nombre_en no admite cifras (se interpola en explicaciones.json, donde toda cifra va en un marcador; "
        "escríbala con letra) (opción alfalfa_corte_verano: «2», «3»)"),
    "nombre_en con corchetes": (_poner("Alfalfa [B]", "opciones", "alfalfa", "nombre_en"),
                                "nombre_en no admite corchetes, llaves ni «Source:»"),
    "nombre_en con llaves": (_poner("Alfalfa {{f1}}", "opciones", "alfalfa", "nombre_en"),
                             "nombre_en no admite corchetes, llaves ni «Source:»"),
    "nombre_en con Source:": (_poner("Alfalfa. Source: the master table", "opciones", "alfalfa", "nombre_en"),
                              "nombre_en no admite corchetes, llaves ni «Source:»"),
    # El formato anterior al de la decisión (el de data/opciones_b4.json) ya no entra.
    "formato anterior (actual y alternativas)": (
        lambda o: (o.clear(), o.update(json.loads(json.dumps({k: v for k, v in CFG.items()})), filtros=[])),
        "falta opciones"),
}


@pytest.mark.parametrize("caso", sorted(MALOS))
def test_archivo_malo_se_rechaza_con_su_motivo(tmp_path, caso):
    cambio, motivo = MALOS[caso]
    rep = ensamblar(tmp_path, alterado(cambio))
    assert not rep["entraron"], f"{caso}: entró"
    motivos = " | ".join(next(x["motivos"] for x in rep["rechazados"] if x["archivo"] == ARCHIVO))
    assert motivo in motivos, motivos
    assert not (tmp_path / "salida" / ARCHIVO).exists(), "un archivo rechazado no se copia"


def test_json_roto_se_rechaza(tmp_path):
    rep = ensamblar(tmp_path, "{no es json")
    assert "no es JSON válido" in " | ".join(rep["rechazados"][0]["motivos"])


def test_nulls_de_lo_que_la_fuente_no_dice_solo_avisan(tmp_path):
    """Regla de la decisión: lo que el maestro no diga va en null y se avisa (no se rechaza)."""
    def cambio(o):
        o["opciones"]["chile"]["por_que_en"] = None
        o["opciones"]["chile"]["secuencia"][0]["siembra"]["hasta"] = None
        o["opciones"]["chile"]["indicadores"]["ruptura_plagas"] = None
    rep = ensamblar(tmp_path, alterado(cambio))
    assert rep["rechazados"] == [], rep["rechazados"]
    avisos = " | ".join(rep["entraron"][0]["avisos"])
    assert "por_que_en es null" in avisos and "siembra.hasta es null" in avisos


def test_menos_de_dos_alternativas_solo_avisa(tmp_path):
    rep = ensamblar(tmp_path, alterado(lambda o: o["por_cultivo_actual"].update(nogal=["descanso"])))
    assert rep["rechazados"] == []
    assert any("por_cultivo_actual.nogal" in a and "ACTUAL +" in a for a in rep["entraron"][0]["avisos"])


def test_listas_cerradas_son_las_de_la_decision():
    """Las listas del esquema se comparan con el texto del contrato en la decisión."""
    texto = DECISION.read_text(encoding="utf-8")

    def lista_de(llave):
        m = re.search(rf'"{llave}": "([^"]+)"', texto)
        assert m, f"la decisión ya no trae la lista de {llave}"
        return tuple(x.strip() for x in m.group(1).split("|"))

    esq = esquemas.ESQUEMAS[ARCHIVO]
    assert esq["letras_maestro"] == lista_de("letra_maestro")
    assert esq["tipos_filtro"] == lista_de("tipo")
    assert esq["ciclos"] == lista_de("ciclo")
    assert esq["pieza"] == "B3" and esq["tipo"] == "json" and esq["regla"] in ens.REGLAS_JSON
    # El motor y el validador leen el umbral de helada con la misma llave, y los estados son los del contrato.
    assert esquemas.UMBRAL_HELADA == b4_cubo.UMBRAL_HELADA
    assert set(validar_contrato.ESTADOS_FILTRO) == {PASSES, WARNING, NEEDS}
    assert set(esq["cultivos"]) == validar_contrato.CULTIVOS - {"sin_clasificar"}


# ---------------------------------------------------------------------------------------
# (b) Motor con el archivo en un processed temporal
# ---------------------------------------------------------------------------------------
def procesados(tmp, b3=B3, heladas=HELADAS, supuestos=True):
    """Fixture de dos zonas más los archivos DE PRUEBA de B3 (None = sin ese archivo)."""
    processed = tmp / "processed"
    shutil.copytree(PROCESADOS_DOS_ZONAS, processed)
    if b3 is not None:
        (processed / ARCHIVO).write_text(json.dumps(b3, ensure_ascii=False), encoding="utf-8")
    if heladas is not None:
        (processed / "heladas.json").write_text(json.dumps(heladas, ensure_ascii=False), encoding="utf-8")
    if supuestos:
        shutil.copy(FIX / "supuestos.json", processed / "supuestos.json")
    return processed


def correr(processed, tmp):
    web = tmp / "web"
    antes = {n: (WEB / n).read_bytes() for n in ("parcelas.geojson", "cubo.json", "explicaciones.json") if (WEB / n).exists()}
    rep = b4_cubo.construir(processed, web)
    assert all((WEB / n).read_bytes() == b for n, b in antes.items()), "B4 tocó web/data en una prueba"
    assert rep["ejecutado"], rep
    return rep, leer(web, "parcelas.geojson"), leer(web, "cubo.json"), leer(web, "explicaciones.json"), web


@pytest.fixture(scope="module")
def con_b3(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("con_b3")
    return correr(procesados(tmp), tmp)


@pytest.fixture(scope="module")
def sin_b3(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("sin_b3")
    return correr(procesados(tmp, b3=None), tmp)


def parcelas_con_opciones(geo, cubo):
    for f in geo["features"]:
        p = f["properties"]
        if cubo["parcelas"][p["id"]]["opciones"]:
            yield p, cubo["parcelas"][p["id"]]["opciones"]


def test_alternativas_salen_de_por_cultivo_actual(con_b3):
    rep, geo, cubo, _, web = con_b3
    assert rep["opciones_origen"] == b4_cubo.ORIGEN_B3
    vistos = set()
    for p, ops in parcelas_con_opciones(geo, cubo):
        cultivo = p["cultivo_actual"]
        actual = CFG["actual"][cultivo]   # la opción ACTUAL la pone el motor
        esperadas = B3["por_cultivo_actual"].get(cultivo, CFG["alternativas"][cultivo])
        assert [o["id"] for o in ops] == ["ACTUAL", *esperadas], p["id"]
        assert [o["rotacion"] for o in ops] == [actual, *esperadas]
        vistos.add(cultivo)
    assert {"alfalfa", "nogal", "barbecho", "cereal_invierno"} <= vistos, "la fixture debe cubrir estos cultivos"
    assert validar_contrato.validar(web) == []


def test_nombre_secuencia_indicadores_y_advertencia_salen_de_opciones(con_b3):
    _, geo, cubo, expl, _ = con_b3
    for p, ops in parcelas_con_opciones(geo, cubo):
        for o in ops:
            d = B3["opciones"].get(o["rotacion"])
            if d is None:
                continue   # rotación que B3 no define (cereal_invierno como ACTUAL): diseño provisional
            es_actual = o["id"] == "ACTUAL"
            assert o["nombre"] == (f"Current rotation: {d['nombre_en']}" if es_actual else d["nombre_en"])
            cultivos = [x["cultivo"] for x in d["secuencia"]]
            assert o["secuencia"] == (cultivos or ["descanso"]), (p["id"], o["id"])
            assert all(isinstance(x, str) for x in o["secuencia"]), "la secuencia del cubo sigue siendo lista de textos"
            ind = d["indicadores"]
            assert o["suelo"]["leguminosa"] == ind["leguminosa"] and o["suelo"]["raiz_profunda"] == ind["raiz_profunda"]
            # Seguir con la rotación actual no rompe su propio ciclo; las alternativas llevan el indicador de B3.
            assert o["suelo"]["ruptura_plagas"] == (False if es_actual else ind["ruptura_plagas"])
            assert o["advertir_si_rojo"] == ((not es_actual) and d["advertir_si_rojo"])
            # La explicación usa el nombre de B3.
            assert expl["explicaciones"][o["preguntas_ref"]]["textos"]["por_que"].startswith(d["nombre_en"])
    # Los dos lados de advertir_si_rojo están en la fixture: alfalfa nueva (true) y la alfalfa ACTUAL (false).
    alfalfa_nueva = [o for p, ops in parcelas_con_opciones(geo, cubo) for o in ops if o["id"] == "alfalfa"]
    alfalfa_actual = [o for p, ops in parcelas_con_opciones(geo, cubo) for o in ops
                      if o["id"] == "ACTUAL" and o["rotacion"] == "alfalfa"]
    assert alfalfa_nueva and all(o["advertir_si_rojo"] for o in alfalfa_nueva)
    assert alfalfa_actual and not any(o["advertir_si_rojo"] for o in alfalfa_actual)


def test_las_laminas_siguen_siendo_las_de_a5(con_b3, sin_b3):
    """B3 cambia qué opciones se comparan y cómo se llaman, nunca su agua (sale de rotaciones.json)."""
    con, sin = con_b3[2], sin_b3[2]

    def agua(cubo):
        return {(pid, o["rotacion"], o["id"] == "ACTUAL"): (o["agua"], o["gota"], o["gota_goteo_con_tope"])
                for pid, pc in cubo["parcelas"].items() for o in pc["opciones"]}
    a, b = agua(con), agua(sin)
    comunes = set(a) & set(b)
    assert comunes and all(a[k] == b[k] for k in comunes)


def test_cultivo_que_b3_no_lista_sigue_provisional_y_se_avisa(con_b3):
    rep, geo, cubo, _, _ = con_b3
    assert "cereal_invierno" not in B3["por_cultivo_actual"]
    assert cubo["meta"]["opciones"] == {"origen": b4_cubo.ORIGEN_B3, "archivo": f"data/processed/{ARCHIVO}",
                                        "fuente": B3["fuente"], "provisionales": ["cereal_invierno"],
                                        "completadas": {}, "etiqueta_propuesta": b4_cubo.ETIQUETA_PROPUESTA}
    aviso = [a for a in rep["avisos"] if "cereal_invierno" in a and "diseño provisional" in a]
    assert aviso and aviso[0] in cubo["meta"]["notas"]
    # La nota del diseño provisional completo ya no va; va la de la tabla oficial con su fuente.
    assert CFG["_nota"] not in cubo["meta"]["notas"]
    assert any("official rotation table" in n and B3["fuente"] in n for n in cubo["meta"]["notas"])


def test_catalogo_de_b3_va_una_vez_en_el_cubo(con_b3):
    _, geo, cubo, _, _ = con_b3
    usadas = {o["rotacion"] for _, ops in parcelas_con_opciones(geo, cubo) for o in ops}
    assert set(cubo["opciones_catalogo"]) == usadas & set(B3["opciones"])
    for rid, d in cubo["opciones_catalogo"].items():
        assert d == B3["opciones"][rid], "el catálogo es la definición de B3 tal cual (ciclo, siembra, por qué, fuente)"
    assert cubo["filtros_catalogo"] == {f["id"]: {k: v for k, v in f.items() if k != "id"} for f in B3["filtros"]}


def test_opcion_sin_lamina_en_la_zona_se_omite_con_aviso(tmp_path):
    """Una opción de B3 que no está en rotaciones.json de la zona se omite: nunca se inventa su lámina."""
    def cambio(o):
        o["opciones"]["rotacion_sin_lamina"] = json.loads(json.dumps(o["opciones"]["sorgo"]))
        o["por_cultivo_actual"]["barbecho"].append("rotacion_sin_lamina")
    rep, geo, cubo, _, web = correr(procesados(tmp_path, b3=alterado(cambio)), tmp_path)
    ids = {o["id"] for _, ops in parcelas_con_opciones(geo, cubo) for o in ops}
    assert "rotacion_sin_lamina" not in ids and "rotacion_sin_lamina" not in cubo["opciones_catalogo"]
    for z in (DZ, LC):
        aviso = [a for a in rep["avisos"] if a.startswith(f"Zona {z}: la opción rotacion_sin_lamina")]
        assert aviso and "nunca se inventa su lámina" in aviso[0] and aviso[0] in cubo["meta"]["notas"]
    assert validar_contrato.validar(web) == []


def test_menos_de_dos_alternativas_oficiales_no_se_completa_y_el_contrato_lo_marca(tmp_path):
    """Si B3 da menos de 2 alternativas para un cultivo, el motor NO inventa ni completa con las
    provisionales: lo avisa, y el contrato (ACTUAL + 2, kit §2.3) lo marca como error."""
    cambio = _poner(["descanso"], "por_cultivo_actual", "nogal")
    rep, geo, cubo, _, web = correr(procesados(tmp_path, b3=alterado(cambio)), tmp_path)
    nogales = [ops for p, ops in parcelas_con_opciones(geo, cubo) if p["cultivo_actual"] == "nogal"]
    assert nogales and all([o["id"] for o in ops] == ["ACTUAL", "descanso"] for ops in nogales)
    aviso = [a for a in rep["avisos"] if "parcelas de nogal" in a and "ACTUAL + 2" in a]
    assert aviso and aviso[0].startswith(f"{len(nogales)} parcelas"), rep["avisos"]
    assert any("mínimo ACTUAL + 2 alternativas" in e for e in validar_contrato.validar(web))


def test_menos_de_dos_alternativas_se_completa_con_la_propuesta_del_equipo_rotulada(tmp_path):
    """Decisión de opciones B3, §1 (14-nov, 16:55): si la tabla oficial da menos de 2 alternativas para un
    cultivo que sí rota, se completa con el diseño provisional y cada opción agregada lo dice."""
    cambio = _poner(["alfalfa_corte_verano"], "por_cultivo_actual", "alfalfa")
    rep, geo, cubo, _, web = correr(procesados(tmp_path, b3=alterado(cambio)), tmp_path)
    extra = [x for x in CFG["alternativas"]["alfalfa"] if x != "alfalfa_corte_verano"][:1]
    alfalfas = [ops for p, ops in parcelas_con_opciones(geo, cubo) if p["cultivo_actual"] == "alfalfa"]
    assert alfalfas
    for ops in alfalfas:
        assert [o["id"] for o in ops] == ["ACTUAL", "alfalfa_corte_verano", *extra]
        assert ops[1]["origen_opcion"] == b4_cubo.ORIGEN_OPCION_B3
        assert ops[2]["origen_opcion"] == b4_cubo.ORIGEN_OPCION_PROPUESTA
        assert ops[2]["etiqueta_opcion"] == b4_cubo.ETIQUETA_PROPUESTA
    assert cubo["meta"]["opciones"]["completadas"] == {"alfalfa": extra}
    assert any("se completa con" in a and "alfalfa" in a for a in rep["avisos"]), rep["avisos"]
    assert validar_contrato.validar(web) == []


def test_cultivo_que_no_rota_lleva_solo_actual_con_su_motivo(tmp_path):
    """El cultivo que el maestro declara «no rota» (nogal) no se completa: solo ACTUAL y «sin_rotacion»
    con el motivo y la fuente de B3; el contrato lo acepta."""
    cambio = _poner([], "por_cultivo_actual", "nogal")
    rep, geo, cubo, _, web = correr(procesados(tmp_path, b3=alterado(cambio)), tmp_path)
    nogales = [p["id"] for p, ops in parcelas_con_opciones(geo, cubo) if p["cultivo_actual"] == "nogal"]
    assert nogales
    for pid in nogales:
        pc = cubo["parcelas"][pid]
        assert [o["id"] for o in pc["opciones"]] == ["ACTUAL"]
        assert pc["sin_rotacion"]["motivo"] == B3["opciones"]["nogal"]["por_que_en"]
        assert pc["sin_rotacion"]["fuente"] == B3["opciones"]["nogal"]["fuente"]
    assert validar_contrato.validar(web) == []


def test_secuencia_distinta_de_la_de_a5_se_avisa(tmp_path):
    cambio = _poner("otro_cultivo", "opciones", "sorgo", "secuencia", 0, "cultivo")
    rep, _, cubo, _, _ = correr(procesados(tmp_path, b3=alterado(cambio)), tmp_path)
    assert any("la secuencia de sorgo" in a and "A5" in a for a in rep["avisos"]), rep["avisos"]


# ---------------------------------------------------------------------------------------
# (c) Filtros: tres estados, sin umbrales inventados
# ---------------------------------------------------------------------------------------
def heladas_de(zona):
    return (HELADAS if zona == DZ else HELADAS["zonas"][zona])["prob_helada_despues_de"]


def prob_esperada(zona, fecha):
    """La probabilidad de la fecha calculada más cercana anterior o igual; None fuera de las fechas calculadas."""
    tabla = heladas_de(zona)
    fechas = sorted(tabla)
    if not fechas[0] <= fecha <= fechas[-1]:
        return None, None
    cercana = max(x for x in fechas if x <= fecha)
    return tabla[cercana], cercana


def filtros_por_zona(geo, cubo):
    """{(zona, rotación): [filtros]} (los filtros no dependen de la parcela)."""
    salida = {}
    for p, ops in parcelas_con_opciones(geo, cubo):
        for o in ops:
            previo = salida.setdefault((p["zona"], o["rotacion"]), o["filtros"])
            assert previo == o["filtros"], "la misma rotación en la misma zona lleva los mismos filtros"
    return salida


def test_cada_opcion_lleva_los_filtros_que_le_aplican(con_b3):
    _, geo, cubo, _, _ = con_b3
    for (zona, rot), filtros in filtros_por_zona(geo, cubo).items():
        esperados = [f for f in B3["filtros"] if rot in f["aplica_a"]]
        assert [f["id"] for f in filtros] == [f["id"] for f in esperados], (zona, rot)
        for e, f in zip(filtros, esperados):
            # Campos del contrato (kit §2.3): motivo y fuente; además id, tipo, etiqueta y estado.
            assert (e["motivo"], e["fuente"], e["etiqueta"], e["tipo"]) == (f["texto_en"], f["fuente"], f["etiqueta"], f["tipo"])
            assert e["estado"] in (PASSES, WARNING, NEEDS)
            assert e["pasa"] is validar_contrato.ESTADOS_FILTRO[e["estado"]]
            assert ("razon" in e) == (e["estado"] == NEEDS), "la razón va solo cuando no se decide"


def test_helada_usa_la_probabilidad_de_la_zona_y_el_umbral_de_la_regla(con_b3):
    _, geo, cubo, _, _ = con_b3
    por_zona = filtros_por_zona(geo, cubo)
    umbral = next(f for f in B3["filtros"] if f["id"] == "helada_siembra")["regla"][b4_cubo.UMBRAL_HELADA]
    desde = B3["opciones"]["chile"]["secuencia"][0]["siembra"]["desde"]
    estados = {}
    for zona in (DZ, LC):
        f = next(x for x in por_zona[(zona, "chile")] if x["id"] == "helada_siembra")
        prob, calculada = prob_esperada(zona, desde)
        assert calculada != desde, "la fixture debe probar una siembra que cae ENTRE dos fechas calculadas"
        assert f["prob_helada"] == prob
        assert f["evidencia"] == {"cultivo": "chile", "ciclo": "PV", "siembra_desde": desde,
                                  "fecha_calculada": calculada, "umbral_prob_helada": umbral}
        assert f["estado"] == (PASSES if prob <= umbral else WARNING)
        estados[zona] = f["estado"]
    # La misma opción pasa en una zona y avisa en la otra: cada parcela usa las heladas de SU zona.
    assert estados == {DZ: PASSES, LC: WARNING}, estados
    assert cubo["meta"]["heladas"]["fuente"] == HELADAS["fuente"]
    for zona in (DZ, LC):
        fechas = sorted(heladas_de(zona))
        assert cubo["meta"]["heladas"]["fechas_calculadas"][zona] == {"desde": fechas[0], "hasta": fechas[-1]}


def test_helada_sin_umbral_muestra_la_probabilidad_y_no_decide(con_b3):
    _, geo, cubo, _, _ = con_b3
    desde = B3["opciones"]["chile"]["secuencia"][0]["siembra"]["desde"]
    for zona in (DZ, LC):
        f = next(x for x in filtros_por_zona(geo, cubo)[(zona, "chile")] if x["id"] == "helada_sin_umbral")
        assert f["estado"] == NEEDS and f["pasa"] is None and f["razon"] == b4_cubo.RAZON_SIN_UMBRAL
        assert f["prob_helada"] == prob_esperada(zona, desde)[0] and f["prob_helada"] is not None
        assert "umbral_prob_helada" not in f["evidencia"], "no se inventa un umbral"


def test_helada_fuera_de_las_fechas_calculadas_queda_sin_probabilidad(con_b3):
    _, geo, cubo, _, _ = con_b3
    desde = B3["opciones"]["sorgo"]["secuencia"][0]["siembra"]["desde"]
    assert prob_esperada(DZ, desde) == (None, None), "la fixture debe traer una siembra posterior a la última fecha calculada"
    f = next(x for x in filtros_por_zona(geo, cubo)[(DZ, "sorgo")] if x["id"] == "helada_siembra")
    assert f["prob_helada"] is None and f["evidencia"]["fecha_calculada"] is None
    assert f["estado"] == NEEDS and f["razon"] == b4_cubo.RAZON_SIN_PROBABILIDAD, "con umbral pero sin probabilidad no se aprueba"


def test_helada_con_dos_siembras_no_se_aprueba_si_a_una_le_falta_la_probabilidad(con_b3):
    _, geo, cubo, _, _ = con_b3
    f = next(x for x in filtros_por_zona(geo, cubo)[(LC, "avena_maiz")] if x["id"] == "helada_siembra")
    pasos = B3["opciones"]["avena_maiz"]["secuencia"]
    probs = [prob_esperada(LC, x["siembra"]["desde"])[0] for x in pasos]
    assert None in probs and any(p is not None for p in probs), "la fixture debe traer una siembra con y otra sin probabilidad"
    assert f["prob_helada"] == max(p for p in probs if p is not None)
    assert [x["cultivo"] for x in f["evidencia"]["otras_siembras"]] == [pasos[0]["cultivo"]]
    assert f["estado"] == NEEDS and f["razon"] == b4_cubo.RAZON_SIN_PROBABILIDAD


def test_dato_local_o_tipo_sin_evaluador_nunca_queda_aprobado(con_b3):
    _, geo, cubo, _, _ = con_b3
    por_zona = filtros_por_zona(geo, cubo)
    local = next(x for x in por_zona[(DZ, "chile")] if x["id"] == "antecedente_local")
    assert local["estado"] == NEEDS and local["pasa"] is None and local["razon"] == b4_cubo.RAZON_DATO_LOCAL
    plazo = next(x for x in por_zona[(DZ, "algodon")] if x["id"] == "fecha_limite_prueba")
    assert plazo["estado"] == NEEDS and plazo["razon"] == b4_cubo.RAZON_SIN_EVALUADOR
    # Ningún filtro pasa sin haber sido evaluado con probabilidad y umbral de sus fuentes.
    for filtros in por_zona.values():
        for f in filtros:
            if f["estado"] == PASSES:
                assert f["tipo"] == "helada" and f["prob_helada"] <= f["evidencia"]["umbral_prob_helada"]


def test_helada_que_ademas_pide_un_dato_local_no_decide_pero_muestra_la_probabilidad(tmp_path):
    cambio = _poner(["heladas.json", "dato local que no tenemos"], "filtros", 0, "necesita")
    _, geo, cubo, _, _ = correr(procesados(tmp_path, b3=alterado(cambio)), tmp_path)
    f = next(x for x in filtros_por_zona(geo, cubo)[(DZ, "chile")] if x["id"] == "helada_siembra")
    assert f["estado"] == NEEDS and f["razon"] == b4_cubo.RAZON_DATO_LOCAL and f["prob_helada"] is not None


def test_sin_heladas_json_el_filtro_de_helada_no_decide_y_se_avisa(tmp_path):
    rep, geo, cubo, _, web = correr(procesados(tmp_path, heladas=None), tmp_path)
    for filtros in filtros_por_zona(geo, cubo).values():
        for f in filtros:
            if f["tipo"] == "helada":
                assert f["prob_helada"] is None and f["estado"] == NEEDS
    assert any("heladas.json" in a for a in rep["avisos"])
    assert "heladas" not in cubo["meta"]
    assert validar_contrato.validar(web) == []


def test_prob_helada_en_los_bordes_de_las_fechas_calculadas():
    bloque = {"prob_helada_despues_de": heladas_de(DZ)}
    fechas = sorted(heladas_de(DZ))
    assert b4_cubo.prob_helada_en(bloque, fechas[0]) == (heladas_de(DZ)[fechas[0]], fechas[0])
    assert b4_cubo.prob_helada_en(bloque, fechas[-1]) == (heladas_de(DZ)[fechas[-1]], fechas[-1])
    assert b4_cubo.prob_helada_en(bloque, "01-15") == (None, None)   # antes de la primera fecha calculada
    assert b4_cubo.prob_helada_en(bloque, "10-15") == (None, None)   # siembra de otoño: no se extrapola
    assert b4_cubo.prob_helada_en(None, fechas[0]) == (None, None)
    # Zona que heladas.json no trae: sin bloque, sin probabilidad.
    assert b4_cubo.heladas_de_zona(HELADAS, "zona_que_no_existe") is None
    assert b4_cubo.heladas_de_zona(HELADAS, LC)["prob_helada_despues_de"] == heladas_de(LC)


# ---------------------------------------------------------------------------------------
# (d) Sin el archivo: como hasta ahora
# ---------------------------------------------------------------------------------------
def test_sin_el_archivo_el_cubo_sigue_con_el_diseno_provisional(sin_b3):
    rep, geo, cubo, _, web = sin_b3
    assert rep["opciones_origen"] == b4_cubo.ORIGEN_PROVISIONAL and rep["filtros"] == 0
    assert cubo["meta"]["notas"][0] == CFG["_nota"], "la nota de «diseño provisional» sigue primero"
    assert cubo["meta"]["opciones"] == {"origen": b4_cubo.ORIGEN_PROVISIONAL, "archivo": "data/opciones_b4.json",
                                        "etiqueta": CFG["etiqueta"]}
    assert "opciones_catalogo" not in cubo and "filtros_catalogo" not in cubo and "heladas" not in cubo["meta"]
    for p, ops in parcelas_con_opciones(geo, cubo):
        cultivo = p["cultivo_actual"]
        assert [o["id"] for o in ops] == ["ACTUAL", *CFG["alternativas"][cultivo]]
        for o in ops:
            assert o["filtros"] == []
            nombre = CFG["nombres_en"][o["rotacion"]]
            assert o["nombre"] == (f"Current rotation: {nombre}" if o["id"] == "ACTUAL" else nombre)
            assert "raiz_profunda" not in o["suelo"]
    assert validar_contrato.validar(web) == []


# ---------------------------------------------------------------------------------------
# (e) Contrato y manifest
# ---------------------------------------------------------------------------------------
def test_contrato_rechaza_estado_fuera_de_lista_y_pasa_incoherente(con_b3, tmp_path):
    _, _, _, _, web = con_b3

    def validar_con(alterar):
        destino = tmp_path / alterar.__name__
        shutil.copytree(web, destino)
        cubo = leer(destino, "cubo.json")
        filtro = next(f for pc in cubo["parcelas"].values() for o in pc["opciones"] for f in o["filtros"]
                      if f["estado"] == NEEDS)
        alterar(filtro)
        (destino / "cubo.json").write_text(json.dumps(cubo, ensure_ascii=False), encoding="utf-8")
        return " | ".join(validar_contrato.validar(destino))

    def estado_inventado(f):
        f["estado"] = "approved"

    def aprobado_sin_decidir(f):
        f["pasa"] = True   # «needs_local_check» mostrado como aprobado: justo lo que no debe pasar

    def sin_motivo(f):
        f["motivo"] = ""

    def probabilidad_imposible(f):
        f["prob_helada"] = 2

    assert "estado fuera de" in validar_con(estado_inventado)
    assert "no concuerda con el estado" in validar_con(aprobado_sin_decidir)
    assert "filtro sin motivo o fuente" in validar_con(sin_motivo)
    assert "prob_helada" in validar_con(probabilidad_imposible)


def test_manifest_registra_filtros_y_catalogo_con_su_fuente(con_b3, tmp_path):
    """prob_helada con la fuente de heladas.json; el umbral, con la del filtro; el catálogo, con la de B3."""
    _, _, cubo, _, web = con_b3
    raiz = tmp_path / "raiz"
    (raiz / "data/processed").mkdir(parents=True)
    shutil.copytree(web, raiz / "web/data")
    shutil.copy(RAIZ / "data/params.json", raiz / "data/params.json")
    # En la fixture la otra siembra (avena, de otoño) no tiene probabilidad. Para probar también esa regla
    # del manifest se le pone, solo en esta copia, una probabilidad de la propia tabla de heladas de prueba.
    cubo = json.loads(json.dumps(cubo))
    prestada = max(heladas_de(LC).values())
    for pc in cubo["parcelas"].values():
        for o in pc["opciones"]:
            for f in o["filtros"]:
                for otra in (f.get("evidencia") or {}).get("otras_siembras", []):
                    otra["prob_helada"] = prestada
    (raiz / "web/data/cubo.json").write_text(json.dumps(cubo, ensure_ascii=False), encoding="utf-8")
    entregas = [{"archivo": n, "tipo": "entrega", "fuente": f"fuente de prueba de {n}", "fecha": "2026-11-14",
                 "fecha_consulta": "2026-11-14", "script": f"script de prueba de {n}", "url_o_api": "prueba",
                 "sha256": "0" * 64} for n in ("heladas.json", ARCHIVO, "supuestos.json")]
    (raiz / "data/processed/fuentes.json").write_text(json.dumps({"fuentes": entregas}), encoding="utf-8")
    man = manifest.generar(raiz=raiz, escribir=False)
    cifras = man["cifras"]

    prob = cifras["cubo.json:parcelas.*.opciones[*].filtros[*].prob_helada"]
    assert prob["fuente"] == HELADAS["fuente"] and "script de prueba de heladas.json" in prob["script"]
    todas = [f["prob_helada"] for pc in cubo["parcelas"].values() for o in pc["opciones"] for f in o["filtros"]
             if f.get("prob_helada") is not None]
    assert prob["n"] == len(todas) and prob["min"] == min(todas) and prob["max"] == max(todas)
    otras = cifras["cubo.json:parcelas.*.opciones[*].filtros[*].evidencia.otras_siembras[*].prob_helada"]
    assert otras["fuente"] == HELADAS["fuente"] and otras["min"] == otras["max"] == prestada

    filtro = next(f for f in B3["filtros"] if f["id"] == "helada_siembra")
    umbral = cifras["cubo.json:parcelas.*.opciones[*].filtros[*].evidencia.umbral_prob_helada"]
    assert umbral["fuente"] == filtro["fuente"] and umbral["etiqueta"] == filtro["etiqueta"]
    assert umbral["min"] == umbral["max"] == filtro["regla"][b4_cubo.UMBRAL_HELADA]

    # Catálogo: las fechas de siembra (textos con cifras) y los parámetros de las reglas.
    siembra = cifras["cubo.json:opciones_catalogo.chile.secuencia[*].siembra.desde"]
    assert B3["opciones"]["chile"]["secuencia"][0]["siembra"]["desde"] in siembra["textos"]
    assert siembra["fuente"] == B3["opciones"]["chile"]["fuente"] and "script de prueba de opciones_b3.json" in siembra["script"]
    regla = cifras[f"cubo.json:filtros_catalogo.helada_siembra.regla.{b4_cubo.UMBRAL_HELADA}"]
    assert regla["min"] == filtro["regla"][b4_cubo.UMBRAL_HELADA] and regla["fuente"] == filtro["fuente"]
    assert not [a for a in man["avisos"] if "filtros" in a or "catalogo" in a], man["avisos"]


# ---------------------------------------------------------------------------------------
# (f) Regla 10 en los textos en inglés que la ficha muestra
# ---------------------------------------------------------------------------------------
def palabras_prohibidas(texto):
    """Palabras de la lista de motor/verificador.py (CLAUDE.md, regla 10) que aparecen en un texto."""
    return [m.group(0) for patron, _ in verificador.PROHIBIDAS for m in patron.finditer(texto)]


def textos_de_la_ficha(cubo, con_notas):
    """[(ruta, texto)] de los textos en inglés del cubo que la ficha muestra: nombre de cada opción, motivo
    y etiqueta de sus filtros, supuestos de La gota, base del tope de consumo y los catálogos de B3.
    Las fuentes (citas) no se recorren. con_notas: además, cubo.meta.notas (lo que escribe el motor)."""
    salida = []
    for pid, pc in cubo["parcelas"].items():
        for o in pc["opciones"]:
            base = f"parcelas.{pid}.opciones.{o['id']}"
            salida.append((f"{base}.nombre", o["nombre"]))
            for f in o.get("filtros") or []:
                salida += [(f"{base}.filtros.{f.get('id')}.{campo}", f.get(campo)) for campo in ("motivo", "etiqueta")]
            for bloque in ("gota", "gota_goteo_con_tope", "gota_goteo_sin_tope"):
                salida += [(f"{base}.{bloque}.supuestos", t) for t in (o.get(bloque) or {}).get("supuestos") or []]
            salida.append((f"{base}.tope_consumo.base_historica", (o.get("tope_consumo") or {}).get("base_historica")))
    for rid, d in (cubo.get("opciones_catalogo") or {}).items():
        salida += [(f"opciones_catalogo.{rid}.{campo}", d.get(campo)) for campo in ("nombre_en", "por_que_en", "etiqueta")]
    for fid, d in (cubo.get("filtros_catalogo") or {}).items():
        salida += [(f"filtros_catalogo.{fid}.{campo}", d.get(campo)) for campo in ("texto_en", "etiqueta")]
    if con_notas:
        salida += [("meta.notas", n) for n in cubo["meta"].get("notas") or []]
    return [(ruta, t) for ruta, t in salida if isinstance(t, str)]


def fuera_de_regla(textos):
    """{(ruta sin el id de parcela, palabra)} de los textos con lenguaje prohibido."""
    return sorted({(re.sub(r"^parcelas\.[^.]+\.", "parcelas.*.", ruta), palabra)
                   for ruta, t in textos for palabra in palabras_prohibidas(t)})


def test_la_fixture_no_trae_lenguaje_prohibido_en_sus_textos():
    """El rótulo de la fixture es «TEST DATA»: un rótulo con «only» o «first» no entraría por el buzón."""
    for nombre in (ARCHIVO, "heladas.json", "supuestos.json"):
        crudo = (FIX / nombre).read_text(encoding="utf-8")
        assert palabras_prohibidas(crudo) == [], nombre


def test_textos_de_la_ficha_en_el_cubo_de_prueba_sin_lenguaje_prohibido(con_b3):
    _, _, cubo, _, web = con_b3
    textos = textos_de_la_ficha(cubo, con_notas=True)
    # El recorrido no está vacío: toca cada clase de texto que la ficha muestra.
    clases = {re.sub(r"^parcelas\.[^.]+\.opciones\.[^.]+\.|^(opciones|filtros)_catalogo\.[^.]+\.", "", ruta).split(".")[-1]
              for ruta, _ in textos}
    assert {"nombre", "motivo", "etiqueta", "supuestos", "base_historica", "nombre_en", "por_que_en", "texto_en",
            "notas"} <= clases, clases
    assert any(t == B3["filtros"][0]["texto_en"] for _, t in textos)
    assert fuera_de_regla(textos) == []
    # Y las explicaciones, que llevan el nombre de B3, pasan el verificador completo (cifras, citas, lenguaje).
    assert verificador.verificar_archivo(web / "explicaciones.json") == {}


def test_textos_de_la_ficha_en_el_cubo_real_sin_lenguaje_prohibido():
    """El cubo publicado (web/data/cubo.json), llegue por donde llegue cada texto: nombres provisionales o
    de B3, filtros, supuestos de La gota. Sus notas (meta.notas) llevan fuentes citadas y no se recorren."""
    if not (WEB / "cubo.json").exists():
        pytest.skip("web/data/cubo.json aún no existe")
    cubo = leer(WEB, "cubo.json")
    assert fuera_de_regla(textos_de_la_ficha(cubo, con_notas=False)) == []
    # Las notas que escribe el motor (en inglés) tampoco: «saving» no se usa ni para negar.
    notas_del_motor = [("meta.notas", n) for n in cubo["meta"].get("notas") or [] if n.startswith("Drip scenario")]
    assert fuera_de_regla(notas_del_motor) == []


def test_muchos_textos_con_la_misma_palabra_se_cuentan(tmp_path):
    """El rótulo anterior de la fixture («TEST ONLY» en cada por_que_en): un motivo con el número de casos."""
    def cambio(o):
        for d in o["opciones"].values():
            d["por_que_en"] = "TEST ONLY: placeholder."
    rep = ensamblar(tmp_path, alterado(cambio))
    motivos = " | ".join(rep["rechazados"][0]["motivos"])
    assert f"por_que_en {LENGUAJE}: «only» (palabra prohibida) ({len(B3['opciones'])} casos; ej.: opción " in motivos


def test_la_lista_de_lenguaje_es_la_del_verificador(tmp_path, monkeypatch):
    """Una sola lista (motor/verificador.py → PROHIBIDAS): el buzón la importa, no la duplica."""
    assert ens.lenguaje_prohibido("Sow only here") == [("only", "palabra prohibida")]
    assert ens.lenguaje_prohibido("A plain sentence about sowing dates.") == []
    palabra = "zanahoria"
    con_palabra = alterado(_poner(f"TEST DATA: {palabra}.", "filtros", 1, "texto_en"))
    assert ensamblar(tmp_path / "antes", con_palabra)["rechazados"] == []
    monkeypatch.setattr(verificador, "PROHIBIDAS", [(re.compile(rf"\b{palabra}\b", re.IGNORECASE), "palabra de prueba")])
    rep = ensamblar(tmp_path / "despues", con_palabra)
    assert f"texto_en {LENGUAJE}: «{palabra}» (palabra de prueba) (filtro helada_sin_umbral)" in " | ".join(
        rep["rechazados"][0]["motivos"])


@pytest.mark.parametrize("nombre", ["Alfalfa, skipping 2-3 summer irrigations", "Alfalfa only in winter",
                                    "Alfalfa [B]", "Alfalfa {{zz}}", "Alfalfa {f", "Alfalfa. Source: the master table"])
def test_nombre_que_el_buzon_rechaza_romperia_las_explicaciones(tmp_path, nombre):
    """Por qué el buzón es estricto con nombre_en: puesto a mano en la caché, el motor lo interpola en
    explicaciones.json y el comando único falla más adelante (contrato o verificador), lejos del archivo.
    (Un marcador que sí existe, «{{f1}}», no falla aguas abajo: la explicación lo rellenaría con una cifra
    y el nombre de la opción lo mostraría crudo; el buzón lo rechaza igual, ver MALOS.)"""
    cambio = _poner(nombre, "opciones", "alfalfa", "nombre_en")
    rep = ensamblar(tmp_path, alterado(cambio))
    assert not rep["entraron"] and any("nombre_en" in m for m in rep["rechazados"][0]["motivos"])
    _, _, _, _, web = correr(procesados(tmp_path, b3=alterado(cambio)), tmp_path)
    tarde = validar_contrato.validar(web) + [e for errores in verificador.verificar_archivo(web / "explicaciones.json").values()
                                             for e in errores]
    assert tarde, "si esto dejara de fallar aguas abajo, la regla del buzón ya no haría falta"
