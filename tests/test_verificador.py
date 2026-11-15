# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""K-TEST 6: verificador de cifras (kit v4 C3 paso 3; S9 §6 prueba 4).

- Los casos del set dorado (tests/casos/set_dorado.json) dan el veredicto esperado y
  cada trampa falla por el motivo esperado. El número de casos y de trampas se lee
  del propio archivo (con su fuente: kit C3 paso 5).
- web/data/explicaciones.json pasa el verificador («VERIFICADOR OK»).
- docs/figuras/llm_eval.csv se regenera con 0 % de cifras alteradas y coincide con
  el archivo guardado.
- Pruebas del detector con ejemplos cortos: cada regla por separado.
"""
import copy
import json
import subprocess
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from motor import verificador as v  # noqa: E402

SET = v.cargar_set_dorado()
CASOS = SET["casos"]
DINAMICOS = set(SET["dinamicos"])
FUENTES = v.fuentes_permitidas_desde_repo()


# --- Set dorado ----------------------------------------------------------------------
def test_set_dorado_tamano_y_trampas():
    """Tantos casos y trampas como dice el archivo (kit C3 paso 5), ids únicos, 5 respuestas."""
    assert len(CASOS) == SET["n_casos"]
    trampas = [c for c in CASOS if c["esperado"] == "falla"]
    assert len(trampas) >= SET["n_trampas"]
    assert len({c["id"] for c in CASOS}) == len(CASOS)
    for c in CASOS:
        assert set(c["textos"]) == set(v.PREGUNTAS), c["id"]
        assert c["esperado"] in ("pasa", "falla"), c["id"]
        assert {"id", "descripcion", "textos", "valores", "esperado", "motivo_esperado"} <= set(c), c["id"]
        if c["esperado"] == "falla":
            assert c["motivo_esperado"], f"{c['id']}: una trampa debe decir por qué falla"


@pytest.mark.parametrize("caso", CASOS, ids=[c["id"] for c in CASOS])
def test_caso_del_set_dorado(caso):
    obtenido, errores = v.evaluar_caso(caso, FUENTES, DINAMICOS)
    assert obtenido == caso["esperado"], f"{caso['id']} ({caso['descripcion']}): {errores}"
    if caso["esperado"] == "falla":
        codigos = {v.codigo_de(e) for e in errores}
        assert caso["motivo_esperado"] in codigos, f"{caso['id']}: falló por {codigos}"


def test_trampa_de_lenguaje_marca_cada_frase():
    """La trampa de lenguaje trae «first», «only» y «saves»: se marcan las tres."""
    trampa = next(c for c in CASOS if c["motivo_esperado"] == "lenguaje_prohibido")
    _, errores = v.evaluar_caso(trampa, FUENTES, DINAMICOS)
    texto = " ".join(errores)
    for palabra in ("«first»", "«only»", "«saves»"):
        assert palabra in texto


# --- explicaciones.json real -------------------------------------------------------------
def test_explicaciones_reales_pasan():
    resultado = v.verificar_archivo(v.RUTA_EXPLICACIONES)
    assert resultado == {}, json.dumps(resultado, ensure_ascii=False, indent=1)


def test_cli_imprime_verificador_ok():
    r = subprocess.run([sys.executable, str(RAIZ / "motor/verificador.py"), str(v.RUTA_EXPLICACIONES)],
                       capture_output=True, text=True, cwd=RAIZ)
    assert r.returncode == 0, r.stdout + r.stderr
    assert "VERIFICADOR OK" in r.stdout


def test_cifra_metida_en_explicacion_real_falla(tmp_path):
    """Prueba de aceptación: se mete un número a mano en una explicación real → falla y sale con 1."""
    datos = json.loads(v.RUTA_EXPLICACIONES.read_text(encoding="utf-8"))
    alterado = copy.deepcopy(datos)
    llave = next(iter(alterado["explicaciones"]))
    textos = alterado["explicaciones"][llave]["textos"]
    textos["por_que"] = textos["por_que"] + " Expect 12 t/ha."
    ruta = tmp_path / "explicaciones.json"
    ruta.write_text(json.dumps(alterado, ensure_ascii=False), encoding="utf-8")

    resultado = v.verificar_archivo(ruta)
    assert llave in resultado
    assert any(v.codigo_de(e) == "cifra_escrita" for e in resultado[llave])
    r = subprocess.run([sys.executable, str(RAIZ / "motor/verificador.py"), str(ruta)],
                       capture_output=True, text=True, cwd=RAIZ)
    assert r.returncode == 1 and "VERIFICADOR OK" not in r.stdout


# --- Reporte docs/figuras/llm_eval.csv -------------------------------------------------
def test_reporte_eval_cero_cifras_alteradas(tmp_path):
    salida = tmp_path / "llm_eval.csv"
    r = v.generar_reporte_eval(salida)
    assert r["casos"] == SET["n_casos"]
    assert r["correctos"] == r["casos"], [f for f in r["filas"] if f["correcto"] != "sí"]
    assert r["numeros_fuera"] == 0 and r["pct_alterados"] == 0.0
    assert r["numeros_total"] > 0
    assert r["plantilla"] == r["casos"]       # no hay llave de LLM: todo es plantilla
    lineas = salida.read_text(encoding="utf-8").splitlines()
    assert lineas[0] == f"# {v.ENCABEZADO}"
    filas = [l for l in lineas if not l.startswith("#")]
    assert filas[0] == "caso,esperado,obtenido,correcto,motivo"
    assert len(filas) - 1 == SET["n_casos"]


def test_reporte_guardado_esta_al_dia(tmp_path):
    """docs/figuras/llm_eval.csv es igual al que genera hoy el verificador."""
    fresco = tmp_path / "llm_eval.csv"
    v.generar_reporte_eval(fresco)
    assert v.RUTA_REPORTE.exists(), "falta docs/figuras/llm_eval.csv: python motor/verificador.py --reporte"
    assert v.RUTA_REPORTE.read_text(encoding="utf-8") == fresco.read_text(encoding="utf-8"), \
        "docs/figuras/llm_eval.csv está desactualizado: python motor/verificador.py --reporte"


# --- Detector, regla por regla (ejemplos cortos) ----------------------------------------
def _textos(**cambios):
    """Cinco respuestas válidas; se reemplazan las que se pasen."""
    base = {q: "Plain text for this answer." for q in v.PREGUNTAS}
    base.update(cambios)
    return base


def _codigos(textos, valores=None, fuentes=FUENTES):
    return {v.codigo_de(e) for e in v.verificar(textos, valores or {}, DINAMICOS, fuentes)}


@pytest.mark.parametrize("texto", [
    "Asks for 12 thousand m³.",
    "Asks for {{f1}}0 thousand m³.",          # dígito pegado al marcador
    "Asks for {{ f1 }} thousand m³.",          # marcador mal escrito: el 1 queda fuera
    "Asks for １２ thousand m³.",               # dígitos de ancho completo
    "Around 3.5 thousand m³/ha.",
])
def test_regla_a_digitos_fuera_de_marcadores(texto):
    assert "cifra_escrita" in _codigos(_textos(por_que=texto), {"f1": 1})


def test_regla_a_superindices_de_unidad_permitidos():
    assert _codigos(_textos(por_que="Asks for {{f1}} thousand m³ per hectare, or hm³ in the district."),
                    {"f1": 1}) == set()


def test_marcador_mal_formado_sin_digito():
    assert "marcador_mal_formado" in _codigos(_textos(por_que="Enough for {{ ha }} hectares."))


def test_regla_b_marcadores():
    assert _codigos(_textos(por_que="{{f1}} and {{d}}, {{ha}}, {{cobertura}}."), {"f1": 2.5}) == set()
    assert "marcador_inexistente" in _codigos(_textos(por_que="Yield {{f9}}."), {"f1": 2.5})
    assert "marcador_inexistente" in _codigos(_textos(por_que="Price {{precio}}."))
    assert "valor_no_numerico" in _codigos(_textos(por_que="Need {{f1}}."), {"f1": "12 t/ha"})
    assert "valor_no_numerico" in _codigos(_textos(por_que="Need {{f1}}."), {"f1": None})


@pytest.mark.parametrize("cita", ["[NASA POWER]", "[nasa hls]", "Source: NASADEM.", "Fuente: Conagua.",
                                  "[FAO Penman-Monteith]", "Sources: NASA POWER; Fields of The World.",
                                  "(Source: NASA HLS)"])
def test_regla_c_citas_permitidas(cita):
    assert _codigos(_textos(evidencia=f"Data for this field {cita}")) == set()


@pytest.mark.parametrize("cita", ["[Wikipedia]", "Source: a seed company.", "[]", "[NASA POWER; Wikipedia]"])
def test_regla_c_citas_no_permitidas(cita):
    assert "cita_no_permitida" in _codigos(_textos(evidencia=f"Data for this field {cita}"))


def test_regla_c_lista_explicita():
    """Con una lista pasada como parámetro manda esa lista."""
    textos = _textos(evidencia="Data [NASA POWER].")
    assert _codigos(textos, fuentes={"NASA POWER"}) == set()
    assert "cita_no_permitida" in _codigos(textos, fuentes={"Conagua"})


def test_fuentes_desde_repo_incluye_las_fijas():
    for f in v.FUENTES_FIJAS:
        assert f in FUENTES


@pytest.mark.parametrize("frase", [
    "The first tool for farmers.", "Your ONLY option.", "Drip saves water.", "Real savings.",
    "Save water this year.", "Sell water to your neighbor.", "Trade your water.", "Buy extra water.",
    "A water market for the module.", "We allocate water by field.", "Puede vender agua.",
    "Intercambiar agua con el módulo.", "Repartir agua entre parcelas.", "Habrá ahorro.",
    "Vas a ahorrar.", "Agua ahorrada.", "The dam will fill this summer.", "Our forecast for the dam.",
    "El pronóstico de la presa.",
])
def test_regla_d_lenguaje_prohibido(frase):
    assert "lenguaje_prohibido" in _codigos(_textos(beneficios=frase))


@pytest.mark.parametrize("frase", [
    "Your allocation covers part of the need.", "One season of commitment.",
    "Firstly planted fields.", "A well-known saver of time is planning.",
])
def test_regla_d_frases_permitidas(frase):
    assert _codigos(_textos(beneficios=frase)) == set()


def test_estructura_de_las_respuestas():
    sin_riesgos = _textos()
    del sin_riesgos["riesgos"]
    assert "falta_respuesta" in _codigos(sin_riesgos)
    assert "respuesta_desconocida" in _codigos(_textos(extra="Text."))
    assert "texto_invalido" in _codigos(_textos(riesgos=""))
