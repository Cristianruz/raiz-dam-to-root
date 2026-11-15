# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Textos en inglés junto a su original en español: las MISMAS cifras y sin el lenguaje de la regla 10.

La interfaz es inglés (CLAUDE.md, regla 9). Los textos que nacen en español en data/params.json, en el motor o en
construir.py llevan un campo paralelo en inglés (fuente_en, nota_en, valor_en, detalle_en…) y la página lo prefiere.
Esta prueba cuida que la traducción no cambie ningún número y que no traiga palabras que la página no admite:

- cada par «X» / «X_en» de data/params.json y de web/data/*.json: la misma lista de cifras en los dos textos
  (regla 2: ninguna cifra inventada; una traducción que cambia un número lo sería) y el inglés sin «first», «only»,
  «best» ni «recommended» (regla 10);
- los textos de params que la página muestra tienen su variante en inglés, y el cubo, gemelo.json y relieve.json la
  copian tal cual;
- los supuestos de La gota citan la fuente en inglés;
- el detalle de cada paso de construir.py (Paso.detalle y Paso.detalle_en) se arma con los mismos valores, en cada
  camino del comando único; las dos tablas escritas (docs/pruebas.md y docs/en/test_results.md) y la puerta de
  web/data/pruebas.json coinciden renglón por renglón;
- el idioma de las citas del buzón (idioma_fuentes) es el mismo en todos los archivos que lo declaran.
Las pruebas con módulos falsos trabajan en tmp_path: nunca tocan web/data ni docs del repo.
"""
import json
import re
import sys
import types
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))
import construir  # noqa: E402
from motor import b4_cubo, contexto_web, ndvi_web, pruebas_web, suelo_web  # noqa: E402

PARAMS = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
WEB = RAIZ / "web/data"
# Una cifra: dígitos con sus separadores de miles o decimales («4,976», «122.8»). Un guion, dos puntos o un espacio
# la cortan: «28-oct-2024» son 28 y 2024; «12:08», 12 y 08.
NUMERO = re.compile(r"\d+(?:[.,]\d+)*")
# Los exponentes de una unidad cuentan igual escritos como superíndice o como dígito («kg/m2» y «kg/m²»).
SUPERINDICES = str.maketrans("²³", "23")
# Lenguaje que la página no admite (regla 10 de CLAUDE.md y el pedido de esta pieza).
PROHIBIDAS = re.compile(r"\b(first|only|best|recommended)\b", re.IGNORECASE)


def cifras(texto):
    """Lista ordenada de las cifras de un texto (con repeticiones): el orden de las palabras cambia entre idiomas
    («9-nov-2026» y «Nov 9, 2026»); los números y cuántas veces aparece cada uno, no."""
    return sorted(NUMERO.findall(str(texto).translate(SUPERINDICES)))


def pares(obj, ruta=""):
    """(ruta, texto original, texto en inglés) de cada llave «X_en» que tiene al lado su «X», los dos textos."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k.endswith("_en") and isinstance(v, str) and isinstance(obj.get(k[:-3]), str):
                yield f"{ruta}.{k[:-3]}".lstrip("."), obj[k[:-3]], v
            yield from pares(v, f"{ruta}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from pares(v, f"{ruta}[{i}]")


def revisar(ruta, es, en):
    """Errores de un par (lista de textos; vacía si está bien)."""
    errores = []
    if cifras(es) != cifras(en):
        errores.append(f"{ruta}: las cifras no coinciden — español {cifras(es)} · inglés {cifras(en)}")
    hallada = PROHIBIDAS.search(en)
    if hallada:
        errores.append(f"{ruta}: el texto en inglés dice «{hallada.group(0)}» (regla 10): {en!r}")
    return errores


# ---------------------------------------------------------------------------
# El detector
# ---------------------------------------------------------------------------
def test_detector_de_cifras_y_de_lenguaje():
    assert cifras("El Diario, 28-oct-2024 (S8 §2): 4,976 ha desde 11 pozos") == sorted(["28", "2024", "8", "2", "4,976", "11"])
    assert cifras("Oct 28, 2024") == cifras("28-oct-2024")
    assert cifras("chat, 14-nov-2026 12:08") == cifras("chat, Nov 14, 2026, 12:08")
    # El exponente de una unidad cuenta como un dígito más, igual en los dos textos (hm³ = hm3).
    assert cifras("122.8 de 614 hm³/año") == cifras("122.8 of 614 hm3/year") == ["122.8", "3", "614"]
    assert cifras("kg/m2") == cifras("kg/m²")
    assert revisar("x", "9 a 10", "9 to 10") == []
    assert revisar("x", "9 a 10", "9 to 11"), "una cifra distinta se detecta"
    assert revisar("x", "9 a 10", "9 to 10 and 10"), "una cifra de más se detecta"
    for palabra in ("first", "Only", "BEST", "recommended"):
        assert revisar("x", "texto", f"the {palabra} one"), palabra
    assert revisar("x", "texto", "firstly, the bestseller") == [], "solo palabras completas"


# ---------------------------------------------------------------------------
# data/params.json y web/data/*.json
# ---------------------------------------------------------------------------
# Textos de params que la página muestra (por el cubo, gemelo.json o los supuestos de La gota): con variante en inglés.
PARAMS_CON_INGLES = (
    ("zona_piloto", "localidades_equipo", "fuente"),
    ("unidades", "millar", "nota"),
    ("dotaciones", "como_2025", "fuente"), ("dotaciones", "como_2025", "nota"),
    ("dotaciones", "como_2026", "fuente"), ("dotaciones", "como_2026", "nota"),
    ("dotaciones", "anio_normal", "fuente"), ("dotaciones", "anio_normal", "nota"),
    ("dotaciones", "punto_medicion", "valor"), ("dotaciones", "punto_medicion", "nota"),
    ("eficiencia", "conduccion", "fuente"),
    ("gota", "c_retorno_superficial", "fuente"),
    ("distrito", "namo_hm3", "fuente"), ("distrito", "almacenamiento_hm3", "fuente"),
    ("acuifero", "disponibilidad_hm3_anio", "fuente"),
    ("gemelo", "anio_destacado", "fuente"),
)


def test_params_cada_texto_que_muestra_la_pagina_tiene_su_ingles():
    for *camino, campo in PARAMS_CON_INGLES:
        bloque = PARAMS
        for parte in camino:
            bloque = bloque[parte]
        assert isinstance(bloque.get(campo), str) and bloque[campo].strip(), ".".join([*camino, campo])
        en = bloque.get(f"{campo}_en")
        assert isinstance(en, str) and en.strip(), f"params.{'.'.join(camino)}.{campo}_en falta: la página mostraría el español"
        assert en != bloque[campo], f"params.{'.'.join(camino)}.{campo}_en es una copia del texto en español"


def test_params_pares_con_las_mismas_cifras_y_sin_lenguaje_prohibido():
    encontrados = list(pares(PARAMS))
    assert len(encontrados) >= len(PARAMS_CON_INGLES)
    errores = [e for ruta, es, en in encontrados for e in revisar(f"params.{ruta}", es, en)]
    assert not errores, "\n".join(errores)


@pytest.mark.parametrize("archivo", ["cubo.json", "gemelo.json", "relieve.json", "pruebas.json", "contexto.json",
                                     "suelo.json", "ndvi_mensual.json", "explicaciones.json"])
def test_web_data_pares_con_las_mismas_cifras_y_sin_lenguaje_prohibido(archivo):
    ruta = WEB / archivo
    if not ruta.exists():
        pytest.skip(f"sin web/data/{archivo}")
    errores = [e for donde, es, en in pares(json.loads(ruta.read_text(encoding="utf-8")))
               for e in revisar(f"{archivo}:{donde}", es, en)]
    assert not errores, "\n".join(errores[:20])


@pytest.mark.parametrize("archivo", ["cubo.json", "gemelo.json", "relieve.json", "pruebas.json", "contexto.json",
                                     "suelo.json", "ndvi_mensual.json", "explicaciones.json"])
def test_web_data_ningun_ingles_vacio_junto_a_su_original(archivo):
    """Un «X_en» vacío junto a un «X» con texto dejaría la página sin la cita: revisar() compara cifras y no lo vería
    (hallazgo del revisor de código del 15-nov). Limitación conocida de revisar(): compara las cifras sin su orden."""
    ruta = WEB / archivo
    if not ruta.exists():
        pytest.skip(f"sin web/data/{archivo}")
    # Excepción: una unidad puede quedar vacía en inglés a propósito («adimensional» → sin unidad, como el NDVI).
    vacios = [donde for donde, es, en in pares(json.loads(ruta.read_text(encoding="utf-8")))
              if es.strip() and not en.strip() and not donde.endswith(".unidad")]
    assert not vacios, "\n".join(vacios[:20])


def test_el_cubo_copia_el_ingles_de_params():
    ruta = WEB / "cubo.json"
    if not ruta.exists():
        pytest.skip("sin web/data/cubo.json")
    cubo = json.loads(ruta.read_text(encoding="utf-8"))
    if cubo["meta"].get("mock"):
        pytest.skip("cubo simulado: motor/simulados.py no lleva las variantes en inglés")
    d, dz = PARAMS["distrito"], PARAMS["dotaciones"]
    b = cubo["distrito"]["boquilla"]
    assert b["fuente_namo_en"] == d["namo_hm3"]["fuente_en"] and b["fuente_namo"] == d["namo_hm3"]["fuente"]
    assert b["fuente_almacenamiento_en"] == d["almacenamiento_hm3"]["fuente_en"]
    assert b["fuente_almacenamiento"] == d["almacenamiento_hm3"]["fuente"], "el campo en español no cambia"
    acuifero = PARAMS["acuifero"]["disponibilidad_hm3_anio"]
    assert cubo["distrito"]["acuifero_0831"]["fuente_en"] == acuifero["fuente_en"]
    assert cubo["distrito"]["acuifero_0831"]["fuente"] == acuifero["fuente"]
    for marca in cubo["dotaciones"]["marcas"]:
        assert marca["fuente_en"] == dz[marca["id"]]["fuente_en"] and marca["fuente"] == dz[marca["id"]]["fuente"]
        assert marca["nota_en"] == dz[marca["id"]]["nota_en"]
    loc = PARAMS["zona_piloto"]["localidades_equipo"]
    assert cubo["localidades"] and all(x["fuente_en"] == loc["fuente_en"] and x["fuente"] == loc["fuente"]
                                       for x in cubo["localidades"])
    # Ningún aviso de «falta la variante en inglés» en el cubo publicado.
    assert not [n for n in cubo["meta"]["notas"] if "variante en inglés" in n]


def test_supuestos_de_la_gota_citan_la_fuente_en_ingles():
    """Los supuestos del bloque «gota» son frases en inglés con la cita de params dentro: va la de inglés."""
    bloque = b4_cubo.bloque_gota(10.0, 5.0, 300.0, PARAMS, PARAMS["unidades"]["millar"]["valor"]["m3_por_ha"])
    texto = " | ".join(bloque["supuestos"])
    for entrada in (PARAMS["eficiencia"]["conduccion"], PARAMS["gota"]["c_retorno_superficial"]):
        assert entrada["fuente_en"] in texto and entrada["fuente"] not in texto
    assert not PROHIBIDAS.search(texto)
    # Sin fuente_en en params, el respaldo es la cita en español (nunca un texto vacío).
    sin_ingles = json.loads(json.dumps(PARAMS))
    del sin_ingles["gota"]["c_retorno_superficial"]["fuente_en"]
    respaldo = b4_cubo.bloque_gota(10.0, 5.0, 300.0, sin_ingles, 1000)["supuestos"]
    assert any(PARAMS["gota"]["c_retorno_superficial"]["fuente"] in s for s in respaldo)


def test_gemelo_y_relieve_llevan_la_cita_en_ingles():
    gemelo, relieve = WEB / "gemelo.json", WEB / "relieve.json"
    if gemelo.exists():
        g = json.loads(gemelo.read_text(encoding="utf-8"))
        d = PARAMS["gemelo"]["anio_destacado"]
        assert g["tiempo"]["destacados"][str(d["valor"])]["fuente_en"] == d["fuente_en"]
        if g["terreno"]:
            assert "vía" in g["terreno"]["fuente"] and "vía" not in g["terreno"]["fuente_en"]
    if relieve.exists():
        r = json.loads(relieve.read_text(encoding="utf-8"))
        assert "vía" in r["fuente"] and "vía" not in r["fuente_en"] and "via Earth Engine" in r["fuente_en"]


def test_idioma_de_las_citas_del_buzon_es_el_mismo_en_todos_los_archivos():
    """Cinco archivos declaran el idioma de las citas del buzón (idioma_fuentes): el mismo valor en todos, y el de
    las constantes del motor. Si el buzón volviera al español, se cambia en un lugar por módulo y esta prueba avisa
    si uno se queda atrás."""
    constantes = {b4_cubo.IDIOMA_FUENTES, contexto_web.IDIOMA_FUENTES, suelo_web.IDIOMA_FUENTES, ndvi_web.IDIOMA_FUENTES}
    assert len(constantes) == 1, constantes
    esperado = constantes.pop()
    leidos = {}
    for archivo, llave in (("cubo.json", ("meta", "idioma_fuentes")), ("manifest.json", ("idioma_fuentes",)),
                           ("ndvi_mensual.json", ("idioma_fuentes",)), ("contexto.json", ("idioma_fuentes",)),
                           ("suelo.json", ("idioma_fuentes",))):
        ruta = WEB / archivo
        if not ruta.exists():
            continue
        valor = json.loads(ruta.read_text(encoding="utf-8"))
        if archivo == "cubo.json" and valor["meta"].get("mock"):
            continue   # los simulados no declaran idioma: la página los toma por español
        for parte in llave:
            valor = valor.get(parte) if isinstance(valor, dict) else None
        leidos[archivo] = valor
    assert all(v == esperado for v in leidos.values()), leidos


# ---------------------------------------------------------------------------
# construir.py: el detalle de cada paso en los dos idiomas
# ---------------------------------------------------------------------------
def test_paso_sin_detalle_en_ingles_repite_el_detalle():
    assert construir.Paso("pytest", construir.OK, "12 passed in 3.4s").detalle_en == "12 passed in 3.4s"
    assert construir.Paso("origen", construir.OMITIDO, "no solicitado", "not requested").detalle_en == "not requested"
    assert str(construir.Paso("origen", construir.OMITIDO, "no solicitado", "not requested")) == "OMITIDO — no solicitado", \
        "el reporte de la terminal sigue en español"


@pytest.fixture
def falsos(tmp_path, monkeypatch):
    """construir con RAIZ en tmp_path y un registro de módulos falsos que cada prueba llena."""
    (tmp_path / "data/processed").mkdir(parents=True)
    (tmp_path / "motor").mkdir()
    (tmp_path / "motor/ensamblar.py").write_text("# falso\n", encoding="utf-8")
    modulos = {}
    monkeypatch.setattr(construir, "RAIZ", tmp_path)
    monkeypatch.setattr(construir, "importar", lambda nombre: modulos[nombre])
    return tmp_path, modulos


def pasos_de_todos_los_caminos(raiz, modulos, monkeypatch):
    """Un Paso por cada camino de construir.py que escribe un detalle con palabras (no solo la salida de otro
    programa). Devuelve [(rótulo del camino, Paso)]."""
    salida = []
    reporte_vacio = {k: [] for k in construir.LLAVES_REPORTE}

    # (a) ensamblado: sin buzón, con buzón, con rechazados que conservan su copia, reporte incompleto, excepción.
    modulos["motor.ensamblar"] = types.SimpleNamespace(ensamblar=lambda buzon=None: dict(reporte_vacio))
    monkeypatch.delenv("RAIZ_BUZON", raising=False)
    salida.append(("ensamblar sin buzón", construir.paso_ensamblar()[0]))
    monkeypatch.setenv("RAIZ_BUZON", str(raiz))
    lleno = {**reporte_vacio, "entraron": list(range(35)), "rechazados": [{"archivo": "a.csv"}, {"archivo": "b.csv"}]}
    modulos["motor.ensamblar"] = types.SimpleNamespace(ensamblar=lambda buzon=None: dict(lleno))
    salida.append(("ensamblar con buzón", construir.paso_ensamblar()[0]))
    (raiz / "data/processed/a.csv").write_text("copia anterior\n", encoding="utf-8")
    con_copia = {**lleno, "salida": str(raiz / "data/processed")}
    modulos["motor.ensamblar"] = types.SimpleNamespace(ensamblar=lambda buzon=None: dict(con_copia))
    salida.append(("ensamblar con rechazados que conservan copia", construir.paso_ensamblar()[0]))
    modulos["motor.ensamblar"] = types.SimpleNamespace(ensamblar=lambda buzon=None: {"entraron": []})
    salida.append(("ensamblar con reporte incompleto", construir.paso_ensamblar()[0]))
    modulos["motor.ensamblar"] = types.SimpleNamespace(ensamblar=lambda buzon=None: [1, 2, 3])
    salida.append(("ensamblar que no devuelve un dict", construir.paso_ensamblar()[0]))

    def falla(*_a, **_k):
        raise ValueError("fila 12: valor 3.5 fuera de rango")
    modulos["motor.ensamblar"] = types.SimpleNamespace(ensamblar=falla)
    salida.append(("ensamblar con excepción", construir.paso_ensamblar()[0]))

    # (b) cubo: real, B4 con excepción, faltan entradas con cubo real publicado y con cubo simulado.
    rep_b4 = {"parcelas": 1239, "clasificadas": 458, "opciones": 1267, "avisos": []}
    modulos["motor.b4_cubo"] = types.SimpleNamespace(OBLIGATORIAS=(), construir=lambda: dict(rep_b4))
    salida.append(("cubo real", construir.paso_simulados(None)))
    modulos["motor.b4_cubo"] = types.SimpleNamespace(OBLIGATORIAS=(), construir=falla)
    salida.append(("B4 con excepción", construir.paso_simulados(None)))
    modulos["motor.b4_cubo"] = types.SimpleNamespace(OBLIGATORIAS=("entrada_b4.csv", "otra_2.csv"), construir=falla)
    (raiz / "web/data").mkdir(parents=True, exist_ok=True)
    (raiz / "web/data/cubo.json").write_text(json.dumps({"meta": {"mock": False}}), encoding="utf-8")
    salida.append(("faltan entradas y el cubo publicado es real", construir.paso_simulados(None)))
    (raiz / "web/data/cubo.json").write_text(json.dumps({"meta": {"mock": True}}), encoding="utf-8")
    modulos["motor.simulados"] = types.SimpleNamespace(generar=lambda: (
        {"features": [{}] * 338}, {"parcelas": {"S1": {"opciones": [{}, {}, {}]}}}, {"explicaciones": {}}))
    salida.append(("simulados", construir.paso_simulados(None)))

    # (b2) relieve: no se genera, sin zonas, con zonas.
    for rotulo, rep in (
        ("relieve sin entradas", {"ejecutado": False, "motivo": "sin relieve_rutas.geojson o relieve_meta*.json en data/processed",
                                  "motivo_en": "no relieve_rutas.geojson or relieve_meta*.json in data/processed"}),
        ("relieve sin zonas", {"ejecutado": True, "zonas": [], "rutas_bytes": 0}),
        ("relieve con dos zonas", {"ejecutado": True, "zonas": ["delicias_saucillo", "lazaro_cardenas"], "rutas_bytes": 9}),
    ):
        modulos["motor.relieve_web"] = types.SimpleNamespace(construir=lambda rep=rep: dict(rep))
        salida.append((rotulo, construir.paso_relieve()))

    # (b3) gemelo: los tres bien; uno falla y otro no se genera.
    for m in ("motor.gemelo_web", "motor.contexto_web", "motor.suelo_web"):
        modulos[m] = types.SimpleNamespace(construir=lambda: {"ejecutado": True})
    salida.append(("gemelo, contexto y suelo", construir.paso_gemelo()))
    modulos["motor.contexto_web"] = types.SimpleNamespace(construir=falla)
    modulos["motor.suelo_web"] = types.SimpleNamespace(construir=lambda: {"ejecutado": False, "motivo": "sin entrega"})
    salida.append(("gemelo con una falla y uno sin generar", construir.paso_gemelo()))

    # (c) manifest, (d) contrato, (d2) verificador, (5c) pruebas de la web y (e) pytest.
    modulos["motor.manifest"] = types.SimpleNamespace(generar=lambda: {
        "resumen": {"cifras": 112946, "simuladas": 0, "fuentes_de_origen": 35, "avisos": 59}, "avisos": []})
    salida.append(("manifest", construir.paso_manifest()))
    monkeypatch.setattr(construir, "correr", lambda cmd, timeout=600: (0, "CONTRATO OK\n"))
    salida.append(("contrato cumplido", construir.paso_contrato()))
    monkeypatch.setattr(construir, "correr", lambda cmd, timeout=600: (1, "CONTRATO CON ERRORES (3):\n - uno\n"))
    salida.append(("contrato con errores", construir.paso_contrato()))
    monkeypatch.setattr(construir, "correr", lambda cmd, timeout=600: (0, "VERIFICADOR OK\n"))
    salida.append(("verificador bien", construir.paso_verificador()))
    monkeypatch.setattr(construir, "correr", lambda cmd, timeout=600: (2, "error\n"))
    salida.append(("verificador con falla", construir.paso_verificador()))
    salida.append(("pytest sin resumen", construir.paso_pytest()))
    monkeypatch.setattr(construir, "correr", lambda cmd, timeout=600: (0, "1134 passed, 30 warnings in 48.08s\n"))
    salida.append(("pytest con resumen", construir.paso_pytest()))
    modulos["motor.pruebas_web"] = types.SimpleNamespace(construir=lambda: {
        "pruebas": {"a": "partial", "b": "partial", "c": "failed"}, "puerta": "passed", "corrida": "x",
        "ruta": "web/data/pruebas.json"})
    salida.append(("pruebas de la web", construir.paso_pruebas_web()))
    return salida


def test_cada_camino_de_construir_da_las_mismas_cifras_en_los_dos_idiomas(falsos, monkeypatch, capsys):
    raiz, modulos = falsos
    caminos = pasos_de_todos_los_caminos(raiz, modulos, monkeypatch)
    capsys.readouterr()   # lo que los pasos imprimen no es parte de la prueba
    assert len(caminos) >= 20
    errores = []
    for rotulo, paso in caminos:
        assert isinstance(paso.detalle_en, str), rotulo
        errores += revisar(f"{rotulo} ({paso.nombre}, {paso.estado})", paso.detalle, paso.detalle_en)
    assert not errores, "\n".join(errores)
    por_rotulo = dict(caminos)
    # Los caminos con palabras en español tienen su inglés (no una copia): se revisan los que hoy ve «About & Data».
    for rotulo in ("ensamblar sin buzón", "ensamblar con buzón", "cubo real", "relieve con dos zonas",
                   "gemelo, contexto y suelo", "manifest", "contrato cumplido", "verificador bien"):
        paso = por_rotulo[rotulo]
        assert paso.detalle_en != paso.detalle, f"{rotulo}: el detalle en inglés es una copia del de español"
        assert not re.search(r"[áéíóúñ]|\b(sin|de|parcelas|cifras|zonas|suelo|buzón)\b", paso.detalle_en), \
            f"{rotulo}: quedó español en el detalle en inglés: {paso.detalle_en!r}"
    assert por_rotulo["cubo real"].detalle_en == "REAL cube: 1239 fields, 458 classified, 1267 options"
    assert por_rotulo["manifest"].detalle_en == "112946 figures (0 simulated), 35 source files, 59 notices"
    assert por_rotulo["gemelo, contexto y suelo"].detalle_en == "twin: OK · context: OK · soil: OK"
    assert por_rotulo["ensamblar con buzón"].detalle_en == "deliveries validated: 35 accepted, 2 rejected"


def test_tabla_en_ingles_lleva_el_detalle_en_ingles(tmp_path, monkeypatch):
    (tmp_path / "docs").mkdir()
    monkeypatch.setattr(construir, "RAIZ", tmp_path)
    construir.escribir_pruebas_md([construir.Paso("simulados", "OK", "cubo REAL: 7 parcelas", "REAL cube: 7 fields"),
                                   construir.Paso("pytest", "OK", "3 passed in 0.1s")], 1.0)
    es = (tmp_path / "docs/pruebas.md").read_text(encoding="utf-8")
    en = (tmp_path / "docs/en/test_results.md").read_text(encoding="utf-8")
    assert "| simulados | OK | cubo REAL: 7 parcelas |" in es and "REAL cube" not in es, "docs/pruebas.md sigue en español"
    assert "| Cube engine | passed | REAL cube: 7 fields |" in en and "parcelas" not in en
    assert "| Python tests | passed | 3 passed in 0.1s |" in en
    # motor/pruebas_web.py lee de las dos tablas de la MISMA corrida el detalle en cada idioma.
    puerta = pruebas_web.leer_puerta(tmp_path)
    assert [(p["id"], p["detalle"], p["detalle_en"]) for p in puerta["pasos"]] == [
        ("simulados", "cubo REAL: 7 parcelas", "REAL cube: 7 fields"),
        ("pytest", "3 passed in 0.1s", "3 passed in 0.1s")]
    # Si la tabla en inglés es de OTRA corrida, o no existe, no se mezcla: detalle_en queda en null.
    otra = en.replace("Run: ", "Run: 1999-01-01T00:00:00+00:00 · antes ")
    (tmp_path / "docs/en/test_results.md").write_text(otra, encoding="utf-8")
    assert [p["detalle_en"] for p in pruebas_web.leer_puerta(tmp_path)["pasos"]] == [None, None]
    (tmp_path / "docs/en/test_results.md").unlink()
    assert [p["detalle_en"] for p in pruebas_web.leer_puerta(tmp_path)["pasos"]] == [None, None]


def filas_de(ruta, encabezado):
    return pruebas_web.filas_de_tabla(ruta.read_text(encoding="utf-8"), encabezado)


def test_las_dos_tablas_y_la_puerta_del_repo_coinciden():
    """Lo escrito por la última corrida completa: docs/pruebas.md, docs/en/test_results.md y web/data/pruebas.json."""
    es, en, web = RAIZ / "docs/pruebas.md", RAIZ / "docs/en/test_results.md", WEB / "pruebas.json"
    if not (es.exists() and en.exists() and web.exists()):
        pytest.skip("sin una corrida completa registrada")
    filas_es, filas_en = filas_de(es, "Paso"), filas_de(en, "Step")
    assert len(filas_es) == len(filas_en) and filas_es
    errores = []
    for f_es, f_en in zip(filas_es, filas_en):
        assert f_en[0] == pruebas_web.NOMBRES_PASOS.get(f_es[0], f_es[0])
        errores += revisar(f"paso {f_es[0]}", f_es[2], f_en[2])
    assert not errores, "\n".join(errores)
    pasos = json.loads(web.read_text(encoding="utf-8"))["puerta"]["pasos"]
    en_por_nombre = {f[0]: f[2] for f in filas_en}
    es_por_id = {f[0]: f[2] for f in filas_es}
    corrida_es = re.search(r"Corrida:\s*(\S+)", es.read_text(encoding="utf-8")).group(1)
    if json.loads(web.read_text(encoding="utf-8"))["puerta"]["corrida"] != corrida_es:
        pytest.skip("pruebas.json es de otra corrida que docs/pruebas.md (construir.py --rapido)")
    for p in pasos:
        assert p["detalle"] == es_por_id[p["id"]]
        assert p["detalle_en"] == en_por_nombre[p["nombre"]], f"{p['id']}: la página muestra el detalle de la tabla en inglés"
