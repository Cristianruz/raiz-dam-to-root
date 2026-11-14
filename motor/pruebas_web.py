# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Las cinco pruebas a la vista (S9 §6) para la sección «About & Data» de la web (kit C5, paso 3).

Escribe web/data/pruebas.json con cada prueba, su criterio declarado ANTES de ver el resultado
y su ESTADO REAL, leído del repo en el momento de construir:
  1. Mapa de cultivos: reglas fenológicas (web/data/parcelas.geojson), Random Forest (se detecta
     cuando acuerdo_metodos trae dos métodos, «x/2») y validación espacial con Olofsson
     (docs/figuras/tabla_metodos.csv y olofsson.csv). La fracción de parcelas abstenidas se cuenta
     en web/data/parcelas.geojson, en total y por zona.
  2. Back-test H1: «not run» si no existe docs/resultado_H1.md; si existe, su veredicto
     («meets / does not meet the preregistered criterion», kit A6). El resumen que muestra la página es la
     línea «Rótulo para la página: "…"» del documento (en inglés); si no la trae, solo la frase en negrita
     del veredicto (o la primera oración que lo dice), nunca el párrafo en español que sigue.
  3. Experimento natural H3: igual, con docs/resultado_H3.md («H3 supported / not supported», kit A7).
  4. Verificador de cifras: resumen de docs/figuras/llm_eval.csv (motor/verificador.py).
  5. Contraste regional de ET («not run» si no hay data/processed/et_contraste*.csv, kit A8), con SSEBop VIIRS
     y WaPOR v3 como partes separadas (una columna vacía = «not run», kit Q1 punto 5); los totales se rotulan
     con el área que dice la fuente registrada (p. ej. el rectángulo original) y el periodo de la columna mes; y
     pruebas automáticas: FAO-56 contra los ejemplos del manual (tests/test_fao*56*.py) y cierre
     del balance de La gota (validar_contrato.py, renglón «contrato» de la puerta).
Además, la PUERTA AUTOMÁTICA: la tabla de docs/pruebas.md, que escribe `python construir.py`
al terminar una corrida completa (se lee la última corrida registrada, con su fecha).

Estados (en inglés: la web los muestra tal cual con su rótulo):
  "passed"  cumple su criterio        "failed"  no lo cumple
  "partial" una parte corrió y otra no "not run" no se ejecutó
  "run"     corrió, pero no tiene criterio propio de aprobación (p. ej., las reglas del mapa)
Pasos de la puerta: "passed", "failed", "pending" (la pieza aún no existe) y "skipped" (omitido).
Un resultado desfavorable o no ejecutado se publica con la misma visibilidad (S9 §6; kit C6).

Cifras: los criterios son el texto de S9 §6 (y del Anexo B para H3) traducido al inglés; la prueba
tests/test_pruebas_web.py comprueba que cada número de un criterio aparece en su renglón de S9.
Las demás cifras se cuentan de los archivos citados en cada prueba («fuentes»). Ninguna se inventa;
si un archivo falta, la parte correspondiente queda «not run» y se dice por qué.

Uso:  python motor/pruebas_web.py      (escribe web/data/pruebas.json e imprime un resumen)
"""
import csv
import io
import json
import re
from datetime import datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
SCRIPT = "motor/pruebas_web.py"

# Repositorio público (git remote «origin») y anclas que cita la web.
REPOSITORIO = "https://github.com/Cristianruz/raiz-dam-to-root"
ENLACES = {
    "repositorio": REPOSITORIO,
    "readme_ia": REPOSITORIO + "#siai-tools-used",  # sección «SI/AI tools used» del README
    "pruebas_md": REPOSITORIO + "/blob/main/docs/pruebas.md",
}

# Vocabulario de estados (ver el docstring).
PASSED, FAILED, PARTIAL, NOT_RUN, RUN = "passed", "failed", "partial", "not run", "run"
ESTADOS = (PASSED, FAILED, PARTIAL, NOT_RUN, RUN)
ESTADOS_PASO = {"OK": PASSED, "FALLA": FAILED, "PENDIENTE": "pending", "OMITIDO": "skipped"}

# Nombres en inglés de los pasos de construir.py (la web los muestra); el id es el de docs/pruebas.md.
NOMBRES_PASOS = {
    "origen": "Re-download of source data (optional)",
    "ensamblar": "Team deliveries validated against the data contract",
    "simulados": "Cube engine",
    "relieve": "Terrain & runoff layer",
    "manifest": "Manifest of every figure",
    "contrato": "Data contract, including the water balance of “Follow the drop”",
    "verificador": "Figure checker on the page's explanations",
    "pytest": "Python tests",
    "node": "JavaScript tests",
}

# Criterios declarados antes de ver el resultado: S9 §6 (tabla «Pruebas a la vista») y Anexo B (H3).
# Se escriben aquí en inglés; las cifras son las de S9 (la prueba automática lo comprueba) y los
# umbrales del mapa coinciden con data/params.json → mapa (bloque_km, umbral_abstencion).
FUENTE_CRITERIOS = "docs/sintesis/S9_proyecto_definitivo.md §6 (declared before seeing the result)"
PRUEBAS_S9 = (
    {"id": "mapa_cultivos", "numero": 1, "titulo": "Crop map",
     "criterio": "Macro F1 with 5 km spatial blocks; areas with Olofsson; abstain if p < 0.6"},
    {"id": "backtest_h1", "numero": 2, "titulo": "Back-test 2026 (H1, preregistered)",
     "criterio": ("With data up to March 14, the error at July 14 must be lower than that of baselines L1 and "
                  "L1-s. Truth: outflow through the intake works of La Boquilla (SIH)")},
    {"id": "experimento_h3", "numero": 3, "titulo": "Natural experiment of 2025 (H3, preregistered)",
     "criterio": ("In the year without dam water, the share of annual-crop fields with a summer crop falls 25 "
                  "points or more below its 2019–2024 median, and the share of pecan orchards stays within 10 "
                  "points of its median. The number of fields in each group is published")},
    {"id": "verificador", "numero": 4, "titulo": "Figure checker",
     "criterio": "30 cases, with traps; 0 % of figures altered by the AI"},
    {"id": "contraste_et", "numero": 5, "titulo": "Regional ET contrast and automated checks",
     "criterio": ("Aggregated ET against SSEBop VIIRS (USGS) and WaPOR v3 (FAO); FAO-56 against the manual's "
                  "worked examples; closure of the water balance of “Follow the drop”")},
)
# Mínimo de casos del set dorado (S9 §6, prueba 4: «30 casos, con trampas»).
CASOS_MINIMOS_VERIFICADOR = 30
# Kit A4.2: «% de parcelas abstenidas (reportarlo; si es > 50 %, notifíquelo)».
AVISO_ABSTENCION = 0.5

# Veredictos de los documentos de resultados (kit A6 y A7): (frase negativa, frase positiva).
# Se busca la primera línea que diga solo una de las dos; «meets / does not meet» no decide.
VEREDICTOS = {
    "H1": (("does not meet", "meets"), ("no cumple", "cumple")),
    "H3": (("not supported", "supported"), ("no se sostiene", "se sostiene")),
}


# ---------------------------------------------------------------------------
# Lectura de archivos
# ---------------------------------------------------------------------------
def leer_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def leer_texto(p):
    p = Path(p)
    return p.read_text(encoding="utf-8") if p.exists() else None


def filas_csv(p):
    """Filas de un CSV como dicts, sin las líneas de comentario («#»)."""
    texto = leer_texto(p)
    if texto is None:
        return None
    lineas = [l for l in texto.splitlines() if l.strip() and not l.lstrip().startswith("#")]
    return list(csv.DictReader(io.StringIO("\n".join(lineas))))


def numero(v):
    """Número de una celda de CSV, o None si está vacía o no es número."""
    try:
        n = float(str(v).strip())
    except (TypeError, ValueError):
        return None
    return n if n == n else None  # descarta NaN


def fraccion(parte, total):
    return round(parte / total, 4) if total else None


def relativa(p, raiz):
    try:
        return Path(p).resolve().relative_to(Path(raiz).resolve()).as_posix()
    except ValueError:
        return Path(p).as_posix()


def metrica(id_, etiqueta, valor, total=None, unidad=None, fuente=None, zona=None, con_fraccion=False):
    m = {"id": id_, "etiqueta": etiqueta, "valor": valor}
    if total is not None:
        m["total"] = total
        if con_fraccion:
            m["fraccion"] = fraccion(valor, total)
    if unidad:
        m["unidad"] = unidad
    if zona:
        m["zona"] = zona
    if fuente:
        m["fuente"] = fuente
    return m


def parte(id_, nombre, estado, nota=None, fuente=None):
    p = {"id": id_, "nombre": nombre, "estado": estado}
    if nota:
        p["nota"] = nota
    if fuente:
        p["fuente"] = fuente
    return p


def estado_de_partes(partes):
    """Estado de una prueba a partir de sus partes (ver el docstring del módulo)."""
    estados = [p["estado"] for p in partes]
    if not estados or all(e == NOT_RUN for e in estados):
        return NOT_RUN
    if FAILED in estados:
        return FAILED
    if NOT_RUN in estados or PARTIAL in estados:
        return PARTIAL
    if all(e == PASSED for e in estados):
        return PASSED
    return RUN


# ---------------------------------------------------------------------------
# Puerta automática (docs/pruebas.md)
# ---------------------------------------------------------------------------
def leer_puerta(raiz):
    ruta = Path(raiz) / "docs/pruebas.md"
    texto = leer_texto(ruta)
    base = {"fuente": "docs/pruebas.md", "comando": "python construir.py"}
    if texto is None:
        return {**base, "estado": NOT_RUN, "corrida": None, "pasos": [],
                "nota": "docs/pruebas.md is not in the repo yet: python construir.py writes it after a full run."}
    corrida = re.search(r"Corrida:\s*(\S+)", texto)
    pasos = []
    for linea in texto.splitlines():
        celdas = [c.strip() for c in linea.strip().strip("|").split("|")] if linea.lstrip().startswith("|") else []
        if len(celdas) < 2 or celdas[0] in ("Paso", "") or set(celdas[0]) <= set("-: "):
            continue
        id_, original = celdas[0], celdas[1]
        pasos.append({"id": id_, "nombre": NOMBRES_PASOS.get(id_, id_),
                      "estado": ESTADOS_PASO.get(original, original.lower()),
                      "estado_original": original, "detalle": celdas[2] if len(celdas) > 2 else ""})
    estados = [p["estado"] for p in pasos]
    if not pasos:
        estado = NOT_RUN
    elif FAILED in estados:
        estado = FAILED
    elif PASSED in estados:
        estado = PASSED
    else:
        estado = NOT_RUN
    return {**base, "estado": estado, "corrida": corrida.group(1) if corrida else None, "pasos": pasos,
            "nota": "Last full run recorded by python construir.py. The browser smoke test "
                    "(tests/e2e/web_smoke.mjs) runs separately, before each release."}


def estado_paso(puerta, id_):
    """Estado de un paso de la puerta («passed», «failed»…) o None si no está registrado."""
    for p in puerta.get("pasos", []):
        if p["id"] == id_:
            return p["estado"]
    return None


def desde_puerta(estado):
    """Un paso de la puerta como estado de una parte: OK → passed, FALLA → failed; si no, not run."""
    return estado if estado in (PASSED, FAILED) else NOT_RUN


# ---------------------------------------------------------------------------
# Prueba 1: mapa de cultivos
# ---------------------------------------------------------------------------
def prueba_mapa(raiz):
    ruta = Path(raiz) / "web/data/parcelas.geojson"
    fuente = "web/data/parcelas.geojson"
    partes, metricas = [], []
    if not ruta.exists():
        partes.append(parte("reglas", "Phenological rules on HLS greenness", NOT_RUN,
                            "web/data/parcelas.geojson is not built yet.", fuente))
        props = []
    else:
        props = [f.get("properties") or {} for f in leer_json(ruta).get("features", [])]
        total = len(props)
        abst = sum(1 for p in props if p.get("abstencion") is True)
        metricas.append(metrica("abstenidas", "Fields where the crop map abstains", abst, total,
                                fuente=fuente, con_fraccion=True))
        zonas = sorted({p.get("zona") for p in props if p.get("zona")})
        if len(zonas) > 1:  # con dos zonas, también por zona (docs/decisiones/2026-11-14_dos_zonas.md)
            for z in zonas:
                de_z = [p for p in props if p.get("zona") == z]
                metricas.append(metrica("abstenidas_zona", "Fields where the crop map abstains",
                                        sum(1 for p in de_z if p.get("abstencion") is True), len(de_z),
                                        fuente=fuente, zona=z, con_fraccion=True))
        nota = "Crop of each field from phenological rules on monthly HLS greenness."
        if total and abst / total > AVISO_ABSTENCION:
            nota += " More than half of the fields abstain: the map shows them as not classified."
        partes.append(parte("reglas", "Phenological rules on HLS greenness", RUN if total else NOT_RUN, nota, fuente))

    # Random Forest: acuerdo_metodos dice cuántos métodos clasificaron la parcela («1/1» = solo reglas).
    metodos = [int(m.group(1)) for p in props
               if (m := re.fullmatch(r"\s*\d+\s*/\s*(\d+)\s*", str(p.get("acuerdo_metodos") or "")))]
    if metodos and max(metodos) >= 2:
        partes.append(parte("random_forest", "Random Forest", RUN,
                            "Fields report agreement between two methods (acuerdo_metodos).", fuente))
    elif props:
        partes.append(parte("random_forest", "Random Forest", NOT_RUN,
                            "Pending: every field reports a single method in acuerdo_metodos.", fuente))
    else:
        partes.append(parte("random_forest", "Random Forest", NOT_RUN, "No fields to read yet."))

    # Validación espacial por bloques (F1 macro) y exactitud Olofsson (kit A4.2 y A4.3).
    tabla = Path(raiz) / "docs/figuras/tabla_metodos.csv"
    olofsson = Path(raiz) / "docs/figuras/olofsson.csv"
    filas = filas_csv(tabla) if tabla.exists() else None
    if filas:
        for f in filas:
            llave_f1 = next((k for k in f if k and "f1" in k.lower() and "macro" in k.lower()), None)
            llave_enfoque = next((k for k in f if k and ("enfoque" in k.lower() or "method" in k.lower())), None)
            valor = numero(f.get(llave_f1)) if llave_f1 else None
            if valor is not None:
                metricas.append(metrica("f1_macro", f"Macro F1, {f.get(llave_enfoque) or 'method'}", valor,
                                        fuente="docs/figuras/tabla_metodos.csv"))
    validacion = [x for x in (tabla, olofsson) if x.exists()]
    if validacion:
        partes.append(parte("validacion", "Spatial validation (macro F1) and Olofsson accuracy", RUN,
                            "Accuracy against blind photo-interpretation, not field data.",
                            " · ".join(relativa(x, raiz) for x in validacion)))
    else:
        partes.append(parte("validacion", "Spatial validation (macro F1) and Olofsson accuracy", NOT_RUN,
                            "docs/figuras/tabla_metodos.csv and docs/figuras/olofsson.csv are not in the repo yet."))
    fuentes = [fuente, "data/params.json"] + [relativa(x, raiz) for x in validacion]
    return {"partes": partes, "metricas": metricas, "fuentes": fuentes, "estado": estado_de_partes(partes)}


# ---------------------------------------------------------------------------
# Pruebas 2 y 3: hipótesis preregistradas (documentos de resultado)
# ---------------------------------------------------------------------------
def limpiar_md(linea):
    """Quita marcas de Markdown de una línea (viñetas, encabezados, negritas)."""
    linea = re.sub(r"^\s*(?:[#>*\-+]+|\d+[.)])\s*", "", linea)
    return re.sub(r"[*_`]+", "", linea).strip()


PALABRAS_VEREDICTO = ("result", "verdict", "conclusion", "resultado", "veredicto", "conclusión")


def veredicto(texto, pares):
    """(estado, línea) de la primera línea que dice SOLO la frase positiva o SOLO la negativa.

    Primero se buscan las líneas que se anuncian como resultado («Result», «Verdict», «Resultado»…),
    para no confundir con el veredicto una línea que solo describe el criterio; después, todas."""
    estado, linea = veredicto_crudo(texto, pares)
    return estado, (limpiar_md(linea) if linea is not None else None)


# «Rótulo para la página: "…"»: la frase en inglés que el propio documento de resultado propone para la web.
ROTULO_PAGINA = re.compile(r"R[óo]tulo para la p[áa]gina:\s*[\"“«]([^\"”»\n]+)[\"”»]", re.I)


def rotulo_pagina(texto):
    """Texto del «Rótulo para la página» del documento, o None si no lo trae."""
    m = ROTULO_PAGINA.search(texto or "")
    return m.group(1).strip() if m else None


def dice_veredicto(texto, pares):
    baja = texto.lower()
    return any(neg in baja or pos in baja for neg, pos in pares)


def frase_del_veredicto(linea, pares):
    """De la línea del veredicto, solo la parte que lo dice: la frase en negrita que lo contiene o, si no hay,
    la primera oración que lo contiene. Así no se arrastra el párrafo (en español) que sigue en el documento."""
    for seg in re.findall(r"\*\*(.+?)\*\*", linea):
        if dice_veredicto(seg, pares):
            return limpiar_md(seg)
    limpia = limpiar_md(linea)
    for oracion in re.split(r"(?<=[.!?])\s+", limpia):
        if dice_veredicto(oracion, pares):
            return oracion.strip()
    return limpia


def veredicto_crudo(texto, pares):
    """(estado, línea sin limpiar) del veredicto; ver veredicto()."""
    lineas = texto.splitlines()
    anunciadas = [l for l in lineas if any(p in l.lower() for p in PALABRAS_VEREDICTO)]
    for grupo in (anunciadas, lineas):
        for linea in grupo:
            if ROTULO_PAGINA.search(linea):
                continue  # el rótulo se lee aparte; no es la línea del veredicto
            baja = linea.lower()
            for negativa, positiva in pares:
                neg = baja.count(negativa)
                pos = baja.count(positiva) - (neg if positiva in negativa else 0)
                if neg and not pos:
                    return FAILED, linea
                if pos and not neg:
                    return PASSED, linea
    return None, None


def prueba_hipotesis(raiz, hipotesis):
    rel = f"docs/resultado_{hipotesis}.md"
    texto = leer_texto(Path(raiz) / rel)
    if texto is None:
        return {"estado": NOT_RUN, "resumen": f"Not run: {rel} is not in the repo yet.", "fuentes": [],
                "partes": [], "metricas": []}
    pares = VEREDICTOS[hipotesis]
    estado, linea = veredicto_crudo(texto, pares)
    rotulo = rotulo_pagina(texto)
    if estado is None:
        # El documento existe pero no dice el veredicto con las frases del kit. El rótulo, si lo trae, puede
        # decirlo; si no, se publica «run» con una nota en inglés (no el texto del documento, en español).
        estado, _ = veredicto_crudo(rotulo, pares) if rotulo else (None, None)
        if estado is None:
            return {"estado": RUN, "resumen": rotulo or f"Run: {rel} does not state a verdict yet.",
                    "fuentes": [rel], "partes": [], "metricas": []}
    resumen = rotulo or frase_del_veredicto(linea, pares)
    return {"estado": estado, "resumen": resumen or None, "fuentes": [rel], "partes": [], "metricas": []}


# ---------------------------------------------------------------------------
# Prueba 4: verificador de cifras (docs/figuras/llm_eval.csv)
# ---------------------------------------------------------------------------
def prueba_verificador(raiz, puerta):
    rel = "docs/figuras/llm_eval.csv"
    ruta = Path(raiz) / rel
    partes, metricas = [], []
    filas = filas_csv(ruta)
    if not filas:
        partes.append(parte("set_dorado", "Golden set with traps", NOT_RUN, f"{rel} is not in the repo yet."))
    else:
        texto = leer_texto(ruta)
        casos = len(filas)
        correctos = sum(1 for f in filas if (f.get("correcto") or "").strip().lower() in ("sí", "si", "yes", "true"))
        trampas = [f for f in filas if (f.get("esperado") or "").strip() == "falla"]
        atrapadas = sum(1 for f in trampas if (f.get("obtenido") or "").strip() == "falla")
        alteradas = re.search(r"cifras alteradas:\s*(\d+)\s+de\s+(\d+)", texto)
        plantilla = re.search(r"uso de plantilla:\s*(\d+)\s+de\s+(\d+)", texto)
        metricas.append(metrica("casos_correctos", "Cases with the expected verdict", correctos, casos, fuente=rel,
                                con_fraccion=True))
        metricas.append(metrica("trampas", "Traps caught", atrapadas, len(trampas), fuente=rel))
        if alteradas:
            metricas.append(metrica("cifras_alteradas", "Numbers altered in approved texts", int(alteradas.group(1)),
                                    int(alteradas.group(2)), fuente=rel, con_fraccion=True))
        ok = (casos >= CASOS_MINIMOS_VERIFICADOR and correctos == casos and bool(trampas)
              and atrapadas == len(trampas) and alteradas is not None and int(alteradas.group(1)) == 0)
        partes.append(parte("set_dorado", "Golden set with traps", PASSED if ok else FAILED,
                            "Generated by motor/verificador.py on every build.", rel))
        if plantilla:
            n_plantilla, n_total = int(plantilla.group(1)), int(plantilla.group(2))
            metricas.append(metrica("plantillas", "Texts that are templates", n_plantilla, n_total, fuente=rel))
            if n_plantilla >= n_total:
                partes.append(parte("texto_llm", "Texts written by an LLM", NOT_RUN,
                                    "No LLM API key: every explanation is a template whose numbers are filled from "
                                    "the data; the checker has not run on LLM-written text yet.", rel))
            else:
                partes.append(parte("texto_llm", "Texts written by an LLM", RUN,
                                    "Part of the golden set was written by an LLM.", rel))
    vivo = estado_paso(puerta, "verificador")
    partes.append(parte("explicaciones", "Explanations shown on this page", desde_puerta(vivo),
                        "Checked by step «verificador» of python construir.py." if vivo else
                        "No full run of python construir.py recorded in docs/pruebas.md.", "docs/pruebas.md"))
    return {"partes": partes, "metricas": metricas, "fuentes": [rel, "docs/pruebas.md"],
            "estado": estado_de_partes(partes)}


# ---------------------------------------------------------------------------
# Prueba 5: contraste regional de ET y pruebas automáticas
# ---------------------------------------------------------------------------
def prueba_et(raiz, puerta):
    partes, metricas, fuentes = [], [], []
    archivos = sorted((Path(raiz) / "data/processed").glob("et_contraste*.csv"))
    if not archivos:
        partes.append(parte("contraste_et", "Regional ET contrast (SSEBop VIIRS, WaPOR v3)", NOT_RUN,
                            "Regional ET contrast: not run (no et_contraste.csv in data/processed)."))
    else:
        for ruta in archivos:
            rel = relativa(ruta, raiz)
            fuentes.append(rel)
            zona = ruta.stem[len("et_contraste"):].lstrip("_") or None
            filas = filas_csv(ruta) or []
            metricas.append(metrica("meses", "Months compared", len(filas), fuente=rel, zona=zona))
            for col, etiqueta in (("et_modelo_mm", "Modeled crop ET, pilot-area total"),
                                  ("et_ssebop_mm", "SSEBop VIIRS ET, pilot-area total"),
                                  ("et_wapor_mm", "WaPOR v3 ET, pilot-area total")):
                valores = [numero(f.get(col)) for f in filas]
                valores = [v for v in valores if v is not None]
                if valores:
                    metricas.append(metrica(col, etiqueta, round(sum(valores), 1), unidad="mm", fuente=rel, zona=zona))
        partes.append(parte("contraste_et", "Regional ET contrast (SSEBop VIIRS, WaPOR v3)", RUN,
                            "Regional comparison; not field-level validation. Satellite ET includes unclassified "
                            "fields, roads and non-crop vegetation; modeled ET is potential crop ET.",
                            " · ".join(fuentes)))

    # FAO-56 contra los ejemplos resueltos del manual: una prueba de pytest dedicada.
    pruebas_fao = sorted((Path(raiz) / "tests").glob("test_fao*56*.py"))
    if pruebas_fao:
        rel = " · ".join(relativa(x, raiz) for x in pruebas_fao)
        py = estado_paso(puerta, "pytest")
        partes.append(parte("fao56", "FAO-56 against the manual's worked examples",
                            desde_puerta(py) if py else RUN, "Runs with the Python tests.", rel))
        fuentes.append(rel)
    else:
        partes.append(parte("fao56", "FAO-56 against the manual's worked examples", NOT_RUN,
                            "No test against the manual's worked examples in tests/ yet."))

    contrato = estado_paso(puerta, "contrato")
    partes.append(parte("balance", "Water balance of “Follow the drop”", desde_puerta(contrato),
                        "validar_contrato.py checks that the water leaving the dam equals the sum of its "
                        "destinations in every option." if contrato else
                        "No full run of python construir.py recorded in docs/pruebas.md.", "docs/pruebas.md"))
    fuentes.append("docs/pruebas.md")
    return {"partes": partes, "metricas": metricas, "fuentes": fuentes, "estado": estado_de_partes(partes)}


# ---------------------------------------------------------------------------
# Ensamblado
# ---------------------------------------------------------------------------
def calcular(raiz=RAIZ):
    """Diccionario de pruebas.json (sin escribirlo)."""
    raiz = Path(raiz)
    puerta = leer_puerta(raiz)
    calculos = {
        "mapa_cultivos": prueba_mapa(raiz),
        "backtest_h1": prueba_hipotesis(raiz, "H1"),
        "experimento_h3": prueba_hipotesis(raiz, "H3"),
        "verificador": prueba_verificador(raiz, puerta),
        "contraste_et": prueba_et(raiz, puerta),
    }
    pruebas = []
    for base in PRUEBAS_S9:
        c = calculos[base["id"]]
        pruebas.append({**base, "criterio_fuente": FUENTE_CRITERIOS, "estado": c["estado"],
                        "resumen": c.get("resumen"), "partes": c["partes"], "metricas": c["metricas"],
                        "fuentes": c["fuentes"]})
    return {
        "_encabezado": ENCABEZADO,
        "_nota": ("Generado por motor/pruebas_web.py a partir de los archivos del repo; no se edita a mano. "
                  "Estados: passed, failed, partial, not run, run. Criterios: S9 §6."),
        "generado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "script": SCRIPT,
        "fuente_criterios": "docs/sintesis/S9_proyecto_definitivo.md §6",
        "pruebas": pruebas,
        "puerta": puerta,
        "enlaces": ENLACES,
    }


def construir(raiz=RAIZ, web=None):
    """Escribe <web>/pruebas.json (por omisión web/data/pruebas.json) y devuelve un resumen."""
    raiz = Path(raiz)
    web = Path(web) if web is not None else raiz / "web/data"
    datos = calcular(raiz)
    web.mkdir(parents=True, exist_ok=True)
    destino = web / "pruebas.json"
    destino.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return {"ejecutado": True, "ruta": relativa(destino, raiz),
            "pruebas": {p["id"]: p["estado"] for p in datos["pruebas"]},
            "puerta": datos["puerta"]["estado"], "corrida": datos["puerta"]["corrida"]}


if __name__ == "__main__":
    print(json.dumps(construir(), ensure_ascii=False, indent=1))
