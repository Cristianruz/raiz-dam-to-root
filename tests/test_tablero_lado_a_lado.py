# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Bloque del resumen del tablero «con la lluvia del registro y con menos lluvia» (web/index.html,
web/js/dashboard.js → ladoALado): las zonas piloto y las opciones de la parcela, lado a lado.

Comprueba, sin navegador, que el bloque no trae un cálculo propio ni cifras escritas a mano:
- el marcado está en la portada, con sus textos por clave (data-i18n) y el aviso de juicio;
- la función usa las reglas comunes (aguaComprometida y evaluarOpcion, web/reglas.js) y las lluvias del cubo;
- sus textos existen en los cuatro idiomas.
La prueba con navegador (tests/e2e/dashboard_smoke.mjs) comprueba lo que se ve: filas, barras y cambios.
"""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PORTADA = (RAIZ / "web/index.html").read_text(encoding="utf-8")
TABLERO = (RAIZ / "web/js/dashboard.js").read_text(encoding="utf-8")
TEXTOS = (RAIZ / "web/js/textos_tablero.js").read_text(encoding="utf-8")
CLAVES = ["ceja", "titulo", "enlace", "zonas", "zonas_nota", "zona_meta", "registro", "menos", "opciones",
          "opciones_sin", "opciones_nota", "pide", "sin_riego", "ha", "sin_opciones"]


def _funcion():
    """Texto de la función ladoALado, de su encabezado a la función que sigue."""
    inicio = TABLERO.index("function ladoALado()")
    return TABLERO[inicio:TABLERO.index("\nfunction ", inicio + 1)]


def test_el_bloque_esta_en_la_portada_con_textos_por_clave_y_aviso():
    bloque = PORTADA[PORTADA.index('class="rain-compare"'):]
    bloque = bloque[:bloque.index("</section>")]
    for ident in ("lado-zonas", "lado-opciones", "lado-opciones-titulo"):
        assert f'id="{ident}"' in bloque, ident
    for clave in ("ceja", "titulo", "zonas", "zonas_nota", "opciones_nota"):
        assert f'data-i18n="tablero.lado.{clave}"' in bloque, clave
    assert 'data-i18n="tablero.aviso"' in bloque, "falta el aviso de juicio en el bloque"


def test_la_funcion_usa_las_reglas_comunes_y_las_lluvias_del_cubo():
    f = _funcion()
    assert "aguaComprometida(" in f and "evaluarOpcion(" in f, "el bloque debe calcular con web/reglas.js"
    assert "cube.lluvia_pct" in f, "las lluvias salen del cubo, no se escriben"
    assert "state.allocation" in f, "la dotación es la del deslizador"
    # se pinta con cada cambio de dotación, lluvia, zona (stats) y de parcela (fieldDetails)
    assert len(re.findall(r"\bladoALado\(\);", TABLERO)) >= 2


def test_las_lluvias_del_cubo_traen_la_del_registro_y_una_menor():
    cubo = json.loads((RAIZ / "web/data/cubo.json").read_text(encoding="utf-8"))
    assert 0 in cubo["lluvia_pct"] and any(r < 0 for r in cubo["lluvia_pct"])
    for zona in cubo["zonas"].values():
        for r in cubo["lluvia_pct"]:
            assert str(r) in zona["demanda_perenne_millares"]


def test_los_textos_del_bloque_estan_en_los_cuatro_idiomas():
    for clave in CLAVES:
        m = re.search(r'"lado\.%s": \[(.*?)\],\n' % re.escape(clave), TEXTOS, flags=re.S)
        assert m, f"falta tablero.lado.{clave}"
        textos = re.findall(r'"((?:[^"\\\\]|\\\\.)*)"', m.group(1))
        assert len(textos) == 4 and all(t.strip() for t in textos), (clave, textos)
