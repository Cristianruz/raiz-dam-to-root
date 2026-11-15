# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Pruebas de motor/pruebas_web.py (las cinco pruebas a la vista, S9 §6) y de las reglas de
web/js/acerca.js que se pueden revisar sin navegador (sin cifras escritas a mano, sin «first»/«only»).

Cada prueba arma un repo mínimo en tmp_path con los archivos que importan; la última revisa el repo real
escribiendo en tmp_path (nunca toca web/data/pruebas.json).
"""
import csv
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "motor"))
sys.path.insert(0, str(RAIZ / "tests"))
import pruebas_web  # noqa: E402

IDS = ["mapa_cultivos", "backtest_h1", "experimento_h3", "verificador", "contraste_et"]


# --- Repo mínimo de prueba ---------------------------------------------------------------
def escribir(raiz, rel, texto):
    p = Path(raiz) / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(texto, encoding="utf-8")
    return p


def parcelas(raiz, filas):
    """filas: [(zona, abstencion, acuerdo_metodos)]."""
    feats = [{"type": "Feature", "geometry": None,
              "properties": {"id": f"P{i}", "zona": z, "abstencion": a, "acuerdo_metodos": m}}
             for i, (z, a, m) in enumerate(filas)]
    escribir(raiz, "web/data/parcelas.geojson", json.dumps({"type": "FeatureCollection", "features": feats}))


def llm_eval(raiz, casos=30, malos=0, trampas=5, alteradas=0, plantilla=None):
    plantilla = casos if plantilla is None else plantilla
    lineas = ["# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026",
              f"# casos correctos: {casos - malos} de {casos}",
              f"# cifras alteradas: {alteradas} de 71 números en los casos aprobados (meta 0 %)",
              f"# uso de plantilla: {plantilla} de {casos}",
              "caso,esperado,obtenido,correcto,motivo"]
    for i in range(casos):
        trampa = i >= casos - trampas
        esperado = "falla" if trampa else "pasa"
        correcto = "no" if i < malos else "sí"
        obtenido = esperado if correcto == "sí" else ("pasa" if trampa else "falla")
        lineas.append(f"C{i},{esperado},{obtenido},{correcto},")
    escribir(raiz, "docs/figuras/llm_eval.csv", "\n".join(lineas) + "\n")


def pruebas_md(raiz, filas, corrida="2026-11-14T19:37:29+00:00"):
    tabla = "\n".join(f"| {p} | {e} | {d} |" for p, e, d in filas)
    escribir(raiz, "docs/pruebas.md", f"# Resultado\n\nCorrida: {corrida} · duración 4.5 s\n\n"
                                      f"| Paso | Estado | Detalle |\n|---|---|---|\n{tabla}\n")


def por_id(datos):
    return {p["id"]: p for p in datos["pruebas"]}


def partes(prueba):
    return {x["id"]: x["estado"] for x in prueba["partes"]}


# --- Repo vacío: todo «not run», nada se inventa -----------------------------------------
def test_repo_vacio_todo_not_run(tmp_path):
    r = pruebas_web.construir(raiz=tmp_path, web=tmp_path / "salida")
    assert r["ejecutado"] and set(r["pruebas"]) == set(IDS)
    assert set(r["pruebas"].values()) == {"not run"}, r["pruebas"]
    assert r["puerta"] == "not run" and r["corrida"] is None
    d = json.loads((tmp_path / "salida/pruebas.json").read_text(encoding="utf-8"))
    assert d["_encabezado"].startswith("AI-assisted (Claude Code)")
    assert [p["numero"] for p in d["pruebas"]] == [1, 2, 3, 4, 5]
    for p in d["pruebas"]:
        assert p["metricas"] == [], f"{p['id']}: sin archivos no puede haber cifras"
        assert p["criterio"] and p["titulo"]
    h1 = por_id(d)["backtest_h1"]
    assert "docs/resultado_H1.md" in h1["resumen"]
    assert "not run" in partes(por_id(d)["contraste_et"]).values()


# --- Prueba 1: mapa de cultivos ---------------------------------------------------------
def test_mapa_fraccion_abstenida_y_por_zona(tmp_path):
    parcelas(tmp_path, [("a", True, "1/1"), ("a", False, "1/1"), ("a", True, "1/1"),
                        ("b", False, "1/1")])
    d = pruebas_web.calcular(tmp_path)
    mapa = por_id(d)["mapa_cultivos"]
    total = next(m for m in mapa["metricas"] if m["id"] == "abstenidas")
    assert (total["valor"], total["total"], total["fraccion"]) == (2, 4, 0.5)
    zonas = {m["zona"]: (m["valor"], m["total"]) for m in mapa["metricas"] if m["id"] == "abstenidas_zona"}
    assert zonas == {"a": (2, 3), "b": (0, 1)}
    assert partes(mapa) == {"reglas": "run", "random_forest": "not run", "validacion": "not run"}
    assert mapa["estado"] == "partial"


def test_mapa_detecta_random_forest_y_validacion(tmp_path):
    parcelas(tmp_path, [("a", False, "2/2"), ("a", True, "1/2")])
    escribir(tmp_path, "docs/figuras/tabla_metodos.csv",
             "enfoque,f1_macro,f1_por_clase,tiempo\nreglas,0.61,x,1\nrandom_forest,0.72,x,2\n")
    d = pruebas_web.calcular(tmp_path)
    mapa = por_id(d)["mapa_cultivos"]
    assert partes(mapa) == {"reglas": "run", "random_forest": "run", "validacion": "run"}
    assert mapa["estado"] == "run"
    f1 = [m["valor"] for m in mapa["metricas"] if m["id"] == "f1_macro"]
    assert f1 == [0.61, 0.72], "el F1 macro se lee de tabla_metodos.csv, tal cual"
    # una sola zona: no hay desglose por zona
    assert not [m for m in mapa["metricas"] if m["id"] == "abstenidas_zona"]


# --- Pruebas 2 y 3: documentos de resultado ----------------------------------------------
def test_h1_y_h3_leen_el_veredicto_del_documento(tmp_path):
    escribir(tmp_path, "docs/resultado_H1.md",
             "# Resultado H1\n\nCriterion: the model meets the criterion if its error is lower.\n\n"
             "**Result:** the model does not meet the preregistered criterion (truth: SIH).\n")
    escribir(tmp_path, "docs/resultado_H3.md", "# H3\n\nTemplate: H3 supported / not supported\n\n"
                                               "- Verdict: **H3 supported** with (a) and (b).\n")
    d = por_id(pruebas_web.calcular(tmp_path))
    assert d["backtest_h1"]["estado"] == "failed", "la línea «Result» manda sobre la que describe el criterio"
    assert d["backtest_h1"]["resumen"].startswith("Result: the model does not meet")
    assert d["backtest_h1"]["fuentes"] == ["docs/resultado_H1.md"]
    assert d["experimento_h3"]["estado"] == "passed"
    assert "H3 supported" in d["experimento_h3"]["resumen"]


def test_documento_sin_veredicto_queda_run(tmp_path):
    escribir(tmp_path, "docs/resultado_H1.md", "# H1\n\nEn proceso: faltan datos del SIH.\n")
    h1 = por_id(pruebas_web.calcular(tmp_path))["backtest_h1"]
    # La web está en inglés (CLAUDE.md regla 9): sin veredicto, una nota en inglés, no el texto del documento.
    assert h1["estado"] == "run"
    assert h1["resumen"] == "Run: docs/resultado_H1.md does not state a verdict yet."


def test_resumen_usa_el_rotulo_para_la_pagina(tmp_path):
    escribir(tmp_path, "docs/resultado_H1.md",
             "# Resultado\n\n**H1: does not meet the preregistered criterion.** En el punto principal el error\n"
             "es mayor.\n\nRótulo para la página: \"H1 does not meet the preregistered criterion (partial back-test)\".\n")
    h1 = por_id(pruebas_web.calcular(tmp_path))["backtest_h1"]
    assert h1["estado"] == "failed"
    assert h1["resumen"] == "H1 does not meet the preregistered criterion (partial back-test)"


def test_resumen_sin_rotulo_toma_solo_la_frase_en_negrita(tmp_path):
    # Sin «Rótulo para la página», el resumen es la frase en negrita del veredicto, sin el párrafo en español.
    escribir(tmp_path, "docs/resultado_H3.md",
             "# H3\n\n**H3 not supported.** El criterio (a) no se cumple; el (b) sí. Resultado tal como se obtuvo,\n"
             "con el criterio preregistrado.\n")
    h3 = por_id(pruebas_web.calcular(tmp_path))["experimento_h3"]
    assert h3["estado"] == "failed" and h3["resumen"] == "H3 not supported."


ESPANOL = re.compile(r"\b(el|los|las|que|del|criterio|cumple|resultado|según|mayor|punto|se obtuvo)\b", re.I)


def test_resumen_real_en_ingles_y_completo():
    # Los resúmenes de H1 y H3 que muestra «About & Data»: en inglés y sin cortar a media frase.
    d = por_id(pruebas_web.calcular(RAIZ))
    for id_ in ("backtest_h1", "experimento_h3"):
        resumen = d[id_]["resumen"] or ""
        if d[id_]["estado"] == "not run":
            continue
        assert not ESPANOL.search(resumen), f"{id_}: resumen con palabras en español: {resumen!r}"
        assert re.search(r"[.!?)]$", resumen.strip()), f"{id_}: resumen cortado: {resumen!r}"


# --- Prueba 4: verificador ---------------------------------------------------------------
def test_verificador_con_set_dorado_y_plantillas(tmp_path):
    llm_eval(tmp_path)
    pruebas_md(tmp_path, [("verificador", "OK", "VERIFICADOR OK")])
    v = por_id(pruebas_web.calcular(tmp_path))["verificador"]
    assert partes(v) == {"set_dorado": "passed", "texto_llm": "not run", "explicaciones": "passed"}
    assert v["estado"] == "partial", "sin texto de LLM, el criterio «por la IA» no corrió completo"
    m = {x["id"]: x for x in v["metricas"]}
    assert (m["casos_correctos"]["valor"], m["casos_correctos"]["total"]) == (30, 30)
    assert (m["trampas"]["valor"], m["trampas"]["total"]) == (5, 5)
    assert (m["cifras_alteradas"]["valor"], m["cifras_alteradas"]["total"]) == (0, 71)


def test_verificador_falla_con_un_caso_mal_o_pocos_casos(tmp_path):
    llm_eval(tmp_path, malos=1)
    assert partes(por_id(pruebas_web.calcular(tmp_path))["verificador"])["set_dorado"] == "failed"
    llm_eval(tmp_path, casos=10, trampas=2)
    v = por_id(pruebas_web.calcular(tmp_path))["verificador"]
    assert partes(v)["set_dorado"] == "failed", "S9 §6 pide 30 casos"
    llm_eval(tmp_path, plantilla=20)
    assert partes(por_id(pruebas_web.calcular(tmp_path))["verificador"])["texto_llm"] == "run"


# --- Prueba 5: contraste de ET y pruebas automáticas -------------------------------------------
def test_et_con_contraste_y_puerta(tmp_path):
    filas = "\n".join(f"2026-{m:02d},{10 * m},{9 * m}," for m in range(1, 13))
    escribir(tmp_path, "data/processed/et_contraste.csv", "mes,et_modelo_mm,et_ssebop_mm,et_wapor_mm\n" + filas + "\n")
    escribir(tmp_path, "tests/test_fao56_ejemplos.py", "def test_x():\n    assert True\n")
    pruebas_md(tmp_path, [("contrato", "OK", "CONTRATO OK"), ("pytest", "OK", "3 passed")])
    et = por_id(pruebas_web.calcular(tmp_path))["contraste_et"]
    # WaPOR v3 es su propia parte: con la columna vacía dice «not run» (kit Q1, punto 5).
    assert partes(et) == {"contraste_et": "run", "contraste_wapor": "not run", "fao56": "passed", "balance": "passed"}
    assert et["estado"] == "partial"
    nombres = {x["id"]: x["nombre"] for x in et["partes"]}
    assert nombres["contraste_et"] == "Regional ET contrast (SSEBop VIIRS)"
    m = {x["id"]: x["valor"] for x in et["metricas"]}
    assert m["meses"] == 12 and m["et_modelo_mm"] == 780.0 and m["et_ssebop_mm"] == 702.0
    assert "et_wapor_mm" not in m, "una columna vacía no produce cifra"
    # Sin fuente registrada no se supone el área; el periodo sale de la columna mes.
    etiqueta = next(x["etiqueta"] for x in et["metricas"] if x["id"] == "et_modelo_mm")
    assert etiqueta == "Modeled crop ET, area of the delivered file, Jan 2026–Dec 2026 total"


def test_et_rotulo_con_el_rectangulo_de_la_fuente(tmp_path):
    escribir(tmp_path, "data/processed/et_contraste.csv",
             "mes,et_modelo_mm,et_ssebop_mm,et_wapor_mm\n2025-10,10,9,\n2026-09,20,18,\n")
    escribir(tmp_path, "data/processed/fuentes.json", json.dumps({"fuentes": [
        {"archivo": "et_contraste.csv", "fuente": "SSEBop, media del rectángulo original [-1.5, 2, -1, 2.5]; oct-sep"}]}))
    et = por_id(pruebas_web.calcular(tmp_path))["contraste_et"]
    etiquetas = {x["id"]: x["etiqueta"] for x in et["metricas"]}
    assert etiquetas["et_ssebop_mm"] == "SSEBop VIIRS ET, original pilot rectangle [-1.5, 2, -1, 2.5], Oct 2025–Sep 2026 total"
    assert "pilot-area total" not in json.dumps(etiquetas)


def test_et_sin_contraste_dice_not_run_y_balance_fallido(tmp_path):
    pruebas_md(tmp_path, [("contrato", "FALLA", "el balance no cierra")])
    et = por_id(pruebas_web.calcular(tmp_path))["contraste_et"]
    assert partes(et) == {"contraste_et": "not run", "contraste_wapor": "not run", "fao56": "not run",
                          "balance": "failed"}
    assert et["estado"] == "failed"
    nota = next(x["nota"] for x in et["partes"] if x["id"] == "contraste_et")
    assert "Regional ET contrast: not run" in nota  # rótulo del kit A8


# --- Puerta automática -------------------------------------------------------------------------
def test_puerta_lee_docs_pruebas_md(tmp_path):
    pruebas_md(tmp_path, [("origen", "OMITIDO", "no solicitado"), ("pytest", "OK", "322 passed"),
                          ("node", "PENDIENTE", "")])
    p = pruebas_web.calcular(tmp_path)["puerta"]
    assert p["estado"] == "passed" and p["corrida"] == "2026-11-14T19:37:29+00:00"
    assert [(s["id"], s["estado"]) for s in p["pasos"]] == [("origen", "skipped"), ("pytest", "passed"),
                                                            ("node", "pending")]
    assert p["pasos"][1]["nombre"] == "Python tests" and p["pasos"][1]["detalle"] == "322 passed"
    pruebas_md(tmp_path, [("pytest", "FALLA", "1 failed")])
    assert pruebas_web.calcular(tmp_path)["puerta"]["estado"] == "failed"


# --- Criterios: cada cifra sale de S9 §6 ------------------------------------------------------
def renglones_s9():
    texto = (RAIZ / "docs/sintesis/S9_proyecto_definitivo.md").read_text(encoding="utf-8")
    seccion = texto.split("## 6. Pruebas a la vista", 1)[1].split("\n## ", 1)[0]
    anexo_b = texto.split("## Anexo B", 1)[1]
    renglones = {}
    for linea in seccion.splitlines():
        m = re.match(r"\|\s*(\d)\s*\|", linea)
        if m:
            renglones[int(m.group(1))] = linea
    return renglones, anexo_b


def test_criterios_con_cifras_de_s9():
    renglones, anexo_b = renglones_s9()
    assert set(renglones) == {1, 2, 3, 4, 5}
    for p in pruebas_web.PRUEBAS_S9:
        fuente = renglones[p["numero"]] + (anexo_b if p["id"] == "experimento_h3" else "")
        for cifra in re.findall(r"\d+(?:\.\d+)?", p["titulo"] + " " + p["criterio"]):
            assert cifra in fuente, f"{p['id']}: la cifra {cifra} del criterio no está en S9 §6"


def test_umbrales_del_mapa_coinciden_con_params():
    mapa = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))["mapa"]
    criterio = pruebas_web.PRUEBAS_S9[0]["criterio"]
    assert f"{mapa['bloque_km']['valor']:g} km" in criterio
    assert f"p < {mapa['umbral_abstencion']['valor']:g}" in criterio


def test_textos_sin_palabras_prohibidas(tmp_path):
    datos = json.dumps(pruebas_web.calcular(RAIZ), ensure_ascii=False)
    assert not re.search(r"\b(first|only)\b", datos, re.I), "CLAUDE.md regla 10"
    assert not re.search(r"\bsav(e|es|ing|ings)\b", datos, re.I), "no prometer ahorros"


# --- web/js/acerca.js (revisión estática) ------------------------------------------------------
def test_acerca_js_sin_cifras_ni_palabras_prohibidas():
    import test_sin_cifras as sc  # mismo detector que K-TEST 7

    ruta = RAIZ / "web/js/acerca.js"
    fuente = ruta.read_text(encoding="utf-8")
    assert fuente.startswith("// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026")
    malas = sc.cifras_sin_fuente(sc.fragmentos_js(fuente), "acerca.js")
    assert not malas, sc.mensaje("js/acerca.js", malas)
    visibles = " ".join(t for _, t in sc.fragmentos_js(fuente))
    assert not re.search(r"\b(first|only)\b", visibles, re.I), "CLAUDE.md regla 10"
    assert not re.search(r"\bsav(e|es|ing|ings)\b", visibles, re.I), "no prometer ahorros"
    # Los tres pasos de la pantalla de inicio (kit C5 paso 2), sin números en el texto: los pone el <ol>.
    for paso in ("Set the water allocation", "Tap a field", "Compare rotations"):
        assert f'titulo: "{paso}"' in fuente
    assert "<ol" in fuente and "sessionStorage" in fuente
    assert "This tool supports, never replaces, the judgment of farmers and local experts." in fuente
    assert "SI/AI tools used" in fuente


def test_acerca_css_con_encabezado():
    assert (RAIZ / "web/css/acerca.css").read_text(encoding="utf-8").startswith(
        "/* AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 */")


# --- Repo real ---------------------------------------------------------------------------------
def test_datos_actuales(tmp_path):
    r = pruebas_web.construir(raiz=RAIZ, web=tmp_path)
    d = json.loads((tmp_path / "pruebas.json").read_text(encoding="utf-8"))
    assert [p["id"] for p in d["pruebas"]] == IDS
    for p in d["pruebas"]:
        assert p["estado"] in pruebas_web.ESTADOS, p
        for x in p["partes"]:
            assert x["estado"] in pruebas_web.ESTADOS, x
    pr = por_id(d)
    # H1 y H3: «not run» si y solo si falta su documento de resultado
    for h, id_ in (("H1", "backtest_h1"), ("H3", "experimento_h3")):
        falta = not (RAIZ / f"docs/resultado_{h}.md").exists()
        assert (pr[id_]["estado"] == "not run") == falta
    # ET: «not run» si no hay et_contraste en data/processed
    sin_et = not list((RAIZ / "data/processed").glob("et_contraste*.csv"))
    assert (partes(pr["contraste_et"])["contraste_et"] == "not run") == sin_et
    # La fracción abstenida se cuenta en parcelas.geojson
    geo = RAIZ / "web/data/parcelas.geojson"
    if geo.exists():
        props = [f["properties"] for f in json.loads(geo.read_text(encoding="utf-8"))["features"]]
        m = next(x for x in pr["mapa_cultivos"]["metricas"] if x["id"] == "abstenidas")
        assert m["valor"] == sum(1 for p in props if p.get("abstencion") is True)
        assert m["total"] == len(props)
    # El verificador refleja llm_eval.csv
    csv_eval = RAIZ / "docs/figuras/llm_eval.csv"
    if csv_eval.exists():
        filas = list(csv.DictReader(l for l in csv_eval.read_text(encoding="utf-8").splitlines()
                                    if not l.startswith("#")))
        m = next(x for x in pr["verificador"]["metricas"] if x["id"] == "casos_correctos")
        assert m["total"] == len(filas)
    assert d["enlaces"]["readme_ia"].endswith("#siai-tools-used")
    assert r["puerta"] in ("passed", "failed", "not run")


# --- H1-b junto a H1 y documentos enlazados (integración, etapa 3) ------------------------------
H1B_MINIMO = """# Resultado de H1-b · forma estacional en ciclos anteriores

**H1-b does not hold.** La forma del modelo no describe la salida mejor que las formas simples. **No cambia H1**.

## Resultado
| | Modelo de demanda | L1-s (curva de ETo de NASA POWER) | L1 (lineal) |
|---|---|---|---|
| Fracción del ciclo al 14-jul | 71–80 % | 67.4 % | 61.2 % |
| Mediana del error (puntos porcentuales, 26 años) | **8.66** | **3.34** | 7.9 |

- Condición 1: **no**. Gana en 6 de 26.
"""


def test_h1b_va_junto_a_h1_sin_cambiar_su_veredicto(tmp_path):
    escribir(tmp_path, "docs/resultado_H1.md", "**H1: does not meet the preregistered criterion.** Texto.\n")
    escribir(tmp_path, "docs/resultado_H1b.md", H1B_MINIMO)
    h1 = por_id(pruebas_web.calcular(tmp_path))["backtest_h1"]
    assert h1["estado"] == "failed" and h1["resumen"].startswith("H1: does not meet")
    (h1b,) = h1["complementos"]
    assert h1b["id"] == "h1b" and h1b["estado"] == "failed" and h1b["resumen"] == "H1-b does not hold."
    assert h1b["nota"] == "It does not change the H1 verdict."
    assert h1b["fuentes"][0] == "docs/resultado_H1b.md"
    mets = {m["id"]: m for m in h1b["metricas"]}
    assert (mets["anios_gana"]["valor"], mets["anios_gana"]["total"]) == (6, 26)
    # Cada mediana se toma de SU columna (por el encabezado del documento, no por la posición).
    assert (mets["mediana_modelo"]["valor"], mets["mediana_l1s"]["valor"], mets["mediana_l1"]["valor"]) == (8.66, 3.34, 7.9)
    assert all(m["fuente"] == "docs/resultado_H1b.md" for m in h1b["metricas"])
    # El criterio no lleva cifras (las dos condiciones del documento); «L1» y «L1-s» son nombres de las formas simples.
    assert not re.search(r"\d", re.sub(r"\bL1(-s)?\b", "", h1b["criterio"])), h1b["criterio"]


def test_h1b_sin_documento_dice_not_run_y_h1_sigue_igual(tmp_path):
    escribir(tmp_path, "docs/resultado_H1.md", "**H1: does not meet the preregistered criterion.**\n")
    h1 = por_id(pruebas_web.calcular(tmp_path))["backtest_h1"]
    assert h1["estado"] == "failed"
    (h1b,) = h1["complementos"]
    assert h1b["estado"] == "not run" and h1b["metricas"] == [] and "docs/resultado_H1b.md" in h1b["resumen"]


def test_h1b_holds_se_publica_igual(tmp_path):
    escribir(tmp_path, "docs/resultado_H1b.md", "**H1-b holds.** El modelo gana.\n")
    (h1b,) = por_id(pruebas_web.calcular(tmp_path))["backtest_h1"]["complementos"]
    assert h1b["estado"] == "passed" and h1b["resumen"] == "H1-b holds."


def test_documentos_enlazados_y_nota_de_la_revision(tmp_path):
    escribir(tmp_path, "docs/modelo_vs_practica.md", "# El modelo frente a la práctica\n")
    escribir(tmp_path, "docs/revision_protagonistas.md",
             "**Quién revisó:** la sesión de datos (asistente de IA). La revisión de una persona sigue pendiente.\n")
    docs = {d["id"]: d for d in pruebas_web.calcular(tmp_path)["documentos"]}
    assert set(docs) == {"modelo_vs_practica", "revision_protagonistas"}
    for d in docs.values():
        assert d["existe"] and d["url"] == f"{pruebas_web.REPOSITORIO}/blob/main/{d['ruta']}" and d["titulo"]
    assert docs["revision_protagonistas"]["nota"] == pruebas_web.NOTA_REVISION_IA
    # Si el documento ya no dice que falta la revisión de una persona, la nota no lo afirma.
    escribir(tmp_path, "docs/revision_protagonistas.md", "**Quién revisó:** Lara, en campo, el 15-nov.\n")
    docs = {d["id"]: d for d in pruebas_web.calcular(tmp_path)["documentos"]}
    assert docs["revision_protagonistas"]["nota"] == pruebas_web.NOTA_REVISION_VER
    # Sin el documento: existe = False (la página no enlaza un archivo que no está).
    (tmp_path / "docs/modelo_vs_practica.md").unlink()
    docs = {d["id"]: d for d in pruebas_web.calcular(tmp_path)["documentos"]}
    assert docs["modelo_vs_practica"]["existe"] is False


def test_h1b_y_documentos_del_repo_real():
    d = pruebas_web.calcular(RAIZ)
    h1 = por_id(d)["backtest_h1"]
    if (RAIZ / "docs/resultado_H1b.md").exists():
        (h1b,) = h1["complementos"]
        assert h1b["estado"] in ("failed", "passed") and "H1-b" in h1b["resumen"]
        assert {m["id"] for m in h1b["metricas"]} == {"anios_gana", "mediana_modelo", "mediana_l1s", "mediana_l1"}
        assert not ESPANOL.search(h1b["resumen"]) and not ESPANOL.search(h1b.get("nota") or "")
    for doc in d["documentos"]:
        assert doc["existe"] == (RAIZ / doc["ruta"]).exists()
