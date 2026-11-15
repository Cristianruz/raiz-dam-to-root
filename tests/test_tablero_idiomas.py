# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Textos de los datos del tablero en cuatro idiomas (docs/decisiones/2026-11-15_tablero_principal_idiomas.md).

En web/data/dashboard.json y web/data/pronostico.json (y en data/investigacion_dashboard.json, de donde salen), cada
texto que el tablero muestra va en la llave de siempre en INGLÉS y, al lado, <llave>_es, <llave>_pt y <llave>_fr
(web/js/i18n.js → deDato elige). Esta prueba exige:
- las cuatro variantes, no vacías, en cada texto mostrado (lista explícita de rutas: si se quitan las variantes de
  un texto, falla; y si aparece una variante suelta en cualquier otro lugar, también se le exigen las cuatro);
- los mismos números en las cuatro (una traducción no puede cambiar una cifra, una página o un año);
- ninguna palabra vetada de su idioma (regla 10) y la lluvia nunca como pronóstico ni con un año futuro;
- que las llaves de siempre sigan ahí (no se cambian ni se quitan: web/js/ las lee).
Los textos que vienen de las entregas de datos (catálogo, requisitos, supuestos, parámetros) se quedan en inglés.
"""
import json
import re
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
ARCHIVOS = {
    "dashboard.json": RAIZ / "web/data/dashboard.json",
    "pronostico.json": RAIZ / "web/data/pronostico.json",
    "investigacion_dashboard.json": RAIZ / "data/investigacion_dashboard.json",
}
VARIANTES = ("es", "pt", "fr")
SUFIJOS = tuple(f"_{c}" for c in VARIANTES)

# Rutas de los textos que el tablero muestra, por archivo («*» = cualquier llave o índice).
MOSTRADOS = {
    "dashboard.json": (
        "etiqueta", "fuente", "historia_etiqueta", "historia_fuente", "mapa_atribucion",
        "fuentes.*.titulo", "fuentes.*.descripcion",
        "eventos.*.periodo", "eventos.*.titulo", "eventos.*.detalle", "eventos.*.fuente",
        "rotaciones.*.*.nombre",
    ),
    "pronostico.json": (
        "metodo.nombre", "metodo.etiqueta", "metodo.fuente",
        "zonas.*.clima_origen", "zonas.*.pronostico_lluvia.titulo", "zonas.*.pronostico_lluvia.nota",
        "zonas.*.rotaciones.*.nombre",
    ),
    "investigacion_dashboard.json": (
        "etiqueta", "fuente", "historia_etiqueta", "historia_fuente", "mapa_atribucion",
        "fuentes.*.titulo", "fuentes.*.descripcion",
        "eventos.*.periodo", "eventos.*.titulo", "eventos.*.detalle", "eventos.*.fuente",
        "textos_pronostico.metodo.nombre", "textos_pronostico.metodo.etiqueta", "textos_pronostico.metodo.fuente",
        "textos_pronostico.zona.clima_origen",
        "textos_pronostico.pronostico_lluvia.titulo", "textos_pronostico.pronostico_lluvia.nota",
    ),
}
# Llaves que web/js/ lee y que no pueden cambiar de nombre ni desaparecer.
LLAVES_DE_SIEMPRE = {
    "dashboard.json": ("fecha", "etiqueta", "fuente", "fuentes", "historia", "historia_fuente", "eventos",
                       "mapa_atribucion", "rotaciones"),
    "pronostico.json": ("metodo", "catalogo", "requisitos", "supuestos", "zonas", "fuentes"),
}
LLAVES_DE_ZONA = ("fuente_clima", "heladas_primavera", "clima_origen", "fecha_corte", "anios", "rotaciones",
                  "parametros", "ciclos_excluidos", "validacion_lluvia", "pronostico_lluvia")
LLAVES_DE_METODO = ("nombre", "minimo_entrenamiento", "niveles_plan", "intervalo", "nivel_plan",
                    "conversion_mm_millares_ha", "cm_por_millar", "m3_por_millar", "etiqueta", "fuente")

# Regla 10 y decisión del 15-nov: palabras vetadas de cada idioma; la lluvia no se llama pronóstico ni predicción.
VETADAS = {
    "en": r"\b(first|only|best|recommend\w*|forecast\w*|predict\w*|sav(e|es|ed|ing|ings))\b",
    "es": r"\b(mejor(es)?|recomi?end\w*|ahorr\w*|pron[oó]stic\w*|predicci[oó]n\w*|predic\w+)\b",
    "pt": r"\b(melhor(es)?|recomend\w*|poup\w*|previs[aã]o|previs[oõ]es|progn[oó]stic\w*|predi[cç][aã]o)\b",
    "fr": r"\b(meilleure?s?|recommand\w*|[eé]conomis\w*|pr[eé]vision\w*|pronostic\w*|pr[eé]diction\w*)\b",
}


def cargar(nombre):
    return json.loads(ARCHIVOS[nombre].read_text(encoding="utf-8"))


def resolver(obj, ruta):
    """[(ruta concreta, diccionario padre, llave)] de una ruta con comodines."""
    partes = ruta.split(".")
    frente = [("", obj)]
    for parte in partes[:-1]:
        nuevo = []
        for donde, o in frente:
            if parte == "*":
                hijos = o.items() if isinstance(o, dict) else enumerate(o) if isinstance(o, list) else ()
                nuevo += [(f"{donde}.{k}".lstrip("."), v) for k, v in hijos
                          if not (isinstance(k, str) and k.startswith("_"))]
            elif isinstance(o, dict) and parte in o:
                nuevo.append((f"{donde}.{parte}".lstrip("."), o[parte]))
        frente = nuevo
    return [(f"{donde}.{partes[-1]}".lstrip("."), o, partes[-1]) for donde, o in frente if isinstance(o, dict)]


def textos_mostrados(nombre):
    """[(ruta, {en, es, pt, fr})] de cada texto mostrado; una zona o una rotación sin entrega (null) no cuenta."""
    datos, salida = cargar(nombre), []
    for ruta in MOSTRADOS[nombre]:
        encontrados = resolver(datos, ruta)
        assert encontrados, f"{nombre}: la ruta {ruta} ya no existe (¿cambió una llave?)"
        for donde, padre, llave in encontrados:
            salida.append((donde, {"en": padre.get(llave), **{c: padre.get(f"{llave}_{c}") for c in VARIANTES}}))
    return salida


def variantes_sueltas(obj, ruta=""):
    """Rutas de textos que traen alguna variante (_es, _pt o _fr): a todas se les exigen las cuatro."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            donde = f"{ruta}.{k}".lstrip(".")
            if isinstance(k, str) and k.endswith(SUFIJOS) and isinstance(v, str):
                yield f"{ruta}.{k[:-3]}".lstrip("."), obj, k[:-3]
            yield from variantes_sueltas(v, donde)
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from variantes_sueltas(v, f"{ruta}.{i}".lstrip("."))


def numeros(texto):
    return sorted(re.findall(r"\d+", texto))


@pytest.mark.parametrize("nombre", sorted(MOSTRADOS))
def test_cada_texto_mostrado_trae_las_cuatro_variantes(nombre):
    faltan = [f"{ruta} [{c}]" for ruta, t in textos_mostrados(nombre) for c in ("en",) + VARIANTES
              if not (isinstance(t[c], str) and t[c].strip())]
    assert not faltan, f"{nombre}: textos sin su variante de idioma:\n" + "\n".join(faltan[:30])


@pytest.mark.parametrize("nombre", sorted(MOSTRADOS))
def test_una_variante_suelta_tambien_exige_las_cuatro(nombre):
    faltan = []
    for ruta, padre, llave in variantes_sueltas(cargar(nombre)):
        for c in ("",) + SUFIJOS:
            if not (isinstance(padre.get(llave + c), str) and padre[llave + c].strip()):
                faltan.append(f"{ruta}{c or ' (inglés)'}")
    assert not faltan, f"{nombre}: variantes incompletas:\n" + "\n".join(sorted(set(faltan))[:30])


@pytest.mark.parametrize("nombre", sorted(MOSTRADOS))
def test_los_mismos_numeros_en_los_cuatro_idiomas(nombre):
    distintos = [f"{ruta}: en {numeros(t['en'])} · {c} {numeros(t[c])}" for ruta, t in textos_mostrados(nombre)
                 for c in VARIANTES if numeros(t[c]) != numeros(t["en"])]
    assert not distintos, f"{nombre}: una traducción cambió un número:\n" + "\n".join(distintos[:30])


@pytest.mark.parametrize("nombre", sorted(MOSTRADOS))
def test_sin_palabras_vetadas_ni_lluvia_como_pronostico(nombre):
    malas = [f"{ruta} [{c}]: {t[c][:110]!r}" for ruta, t in textos_mostrados(nombre) for c in VETADAS
             if isinstance(t[c], str) and re.search(VETADAS[c], t[c], re.I)]
    assert not malas, f"{nombre}: textos con palabras vetadas (regla 10; la lluvia es un rango histórico):\n" + "\n".join(malas[:30])


def test_detector_de_palabras_vetadas():
    for idioma, ejemplos in {"en": ("The best crop", "Rainfall forecast", "We recommend it", "only one"),
                             "es": ("El mejor cultivo", "Pronóstico de lluvia", "Se recomienda", "Ahorra agua"),
                             "pt": ("A melhor cultura", "Previsão de chuva", "Recomendamos", "Poupa água"),
                             "fr": ("La meilleure culture", "Prévision de pluie", "Nous recommandons", "Économise l'eau")}.items():
        for texto in ejemplos:
            assert re.search(VETADAS[idioma], texto, re.I), f"{idioma}: no detectó «{texto}»"
    assert not re.search(VETADAS["en"], "Historical rainfall range (NASA POWER)", re.I)
    assert not re.search(VETADAS["es"], "Rango histórico de lluvia; describe años pasados", re.I)


def test_el_rango_de_lluvia_no_nombra_un_anio_futuro_en_sus_textos():
    """El bloque conserva su llave (web/js la lee) pero sus textos dicen «rango histórico» y no traen ningún año."""
    for zid, zona in cargar("pronostico.json")["zonas"].items():
        if zona is None:
            continue
        bloque = zona["pronostico_lluvia"]
        for llave in ("titulo", "nota"):
            for c in ("",) + SUFIJOS:
                assert not re.search(r"\d", bloque[llave + c]), f"{zid}: {llave}{c} trae cifras: {bloque[llave + c]}"
        assert "Historical rainfall range" in bloque["titulo"]
        ultimo = max(a["anio"] for a in zona["anios"])
        assert bloque["periodo"] == [min(a["anio"] for a in zona["anios"]), ultimo], "el rango sale de ciclos ya observados"


def test_las_llaves_de_siempre_siguen_en_su_lugar():
    for nombre, llaves in LLAVES_DE_SIEMPRE.items():
        datos = cargar(nombre)
        assert not [k for k in llaves if k not in datos], f"{nombre}: faltan llaves que web/js/ lee"
    pronostico = cargar("pronostico.json")
    assert not [k for k in LLAVES_DE_METODO if k not in pronostico["metodo"]]
    for zid, zona in pronostico["zonas"].items():
        if zona is not None:
            assert not [k for k in LLAVES_DE_ZONA if k not in zona], zid
            assert {"anio", "p10_mm", "p50_mm", "p90_mm", "n"} <= set(zona["pronostico_lluvia"]), zid
    dashboard = cargar("dashboard.json")
    assert all({"titulo", "descripcion", "archivo"} <= set(f) for f in dashboard["fuentes"])
    assert all({"periodo", "tipo", "titulo", "detalle", "fuente"} <= set(e) for e in dashboard["eventos"])
    assert all({"anio", "superficie_ha"} <= set(h) for h in dashboard["historia"])


def test_el_nombre_en_espanol_de_cada_rotacion_es_el_de_la_entrega():
    pronostico = cargar("pronostico.json")
    for zid, sufijo in (("delicias_saucillo", ""), ("lazaro_cardenas", "_lazaro_cardenas")):
        entrega = json.loads((RAIZ / f"data/processed/rotaciones{sufijo}.json").read_text(encoding="utf-8"))
        nombres = {r["id"]: r["nombre"] for r in entrega["rotaciones"]}
        for rid, r in pronostico["zonas"][zid]["rotaciones"].items():
            assert r["nombre_es"] == nombres[rid] and r["nombre"] != "", rid
