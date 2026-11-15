# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Materiales del envío (kit C7 y C8) sin navegador: la plantilla de las diapositivas y los subtítulos del video.

- docs/pitch/diapositivas.html es una PLANTILLA: su texto visible no lleva cifras escritas a mano (las inyecta
  tests/e2e/diapositivas_pdf.mjs con web/data/*.json), ni «first»/«only»/«save…»; tiene 7 diapositivas o menos y la
  portada que pide la guía de envío (proyecto, equipo, reto, sede y el marcador de integrantes).
- docs/pitch/video_30s.srt sale de la sección 5 de docs/pitch/guion_video_30s.md (lo escribe
  tests/e2e/grabar_video.mjs): mismos tiempos y textos, sin dígitos, de 28 a 29 s en total.
- Los dos scripts de tests/e2e/ llevan el encabezado de la regla 4.
La grabación y el PDF (Chromium y ffmpeg) se prueban al correr esos scripts, como web_smoke.mjs.
"""
import re
from pathlib import Path

import pytest

from test_sin_cifras import PROHIBIDAS, cifras_sin_fuente, texto_visible_html

RAIZ = Path(__file__).resolve().parent.parent
PITCH = RAIZ / "docs" / "pitch"
PLANTILLA = PITCH / "diapositivas.html"
SRT = PITCH / "video_30s.srt"
GUION = PITCH / "guion_video_30s.md"
ENCABEZADO_JS = "// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026"


def _segundos(t):
    h, m, s = t.strip().replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


def leer_srt(texto):
    """[(inicio, fin, texto)] de un .srt."""
    cues = []
    for bloque in re.split(r"\n\s*\n", texto.strip()):
        lineas = bloque.strip().splitlines()
        ini, fin = lineas[1].split("-->")
        cues.append((_segundos(ini), _segundos(fin), " ".join(lineas[2:]).strip()))
    return cues


def srt_del_guion():
    md = GUION.read_text(encoding="utf-8")
    seccion = next(s for s in re.split(r"^## ", md, flags=re.M) if re.match(r"5\.\s", s))
    alterno = re.search(r"MIENTRAS SIGA P0244\]\*\*[^`]*`([^`]+)`", seccion)
    return leer_srt(re.search(r"```text\n(.*?)```", seccion, re.S).group(1)), alterno.group(1) if alterno else None


# --- Diapositivas -------------------------------------------------------------------------
def test_plantilla_de_diapositivas_sin_cifras_escritas_a_mano():
    malas = cifras_sin_fuente(texto_visible_html(PLANTILLA.read_text(encoding="utf-8")), "diapositivas.html")
    assert not malas, "cifras escritas a mano en docs/pitch/diapositivas.html (deben inyectarse de web/data):\n" + "\n".join(
        f"línea {n}: {t[:100]!r}" for n, t in malas[:10])


def test_plantilla_sin_palabras_prohibidas():
    malas = [t for _, t in texto_visible_html(PLANTILLA.read_text(encoding="utf-8")) if PROHIBIDAS.search(t)]
    assert not malas, f"«first», «only» o «save…» en las diapositivas (CLAUDE.md regla 10): {malas[:5]}"


def test_siete_diapositivas_o_menos_con_la_portada_de_la_guia():
    html = PLANTILLA.read_text(encoding="utf-8")
    assert html.startswith("<!doctype html>\n<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->")
    n = len(re.findall(r'<section class="diapositiva\b', html))
    assert 1 <= n <= 7, f"{n} diapositivas: el máximo es 7 con la portada (kit C8)"
    portada = html.split('<section class="diapositiva', 2)[1]
    for texto in ("ROOT", "From Dam to Root", "Orbital Farming", "Field Shift: Adapting Farms with NASA Data",
                  "Chihuahua", "[INTEGRANTES]"):
        assert texto in portada, f"la portada no trae «{texto}»"
    assert "Next phase / vision" in html, "lo que no se construyó va rotulado «Next phase / vision» (kit C8)"


def test_imagenes_de_las_diapositivas_son_capturas_de_la_pagina():
    html = PLANTILLA.read_text(encoding="utf-8")
    fuentes = re.findall(r'<img\s[^>]*src="([^"]+)"', html)
    assert fuentes and all(f.startswith("capturas/") for f in fuentes), fuentes
    assert not re.search(r"(?i)nasa[-_ ]?(logo|meatball|worm)", html), "sin logotipos de la NASA (regla 9)"


# --- Video ----------------------------------------------------------------------------------
def test_srt_sale_del_guion():
    if not SRT.exists():
        pytest.skip("pendiente: docs/pitch/video_30s.srt lo escribe node tests/e2e/grabar_video.mjs")
    guion, alterno = srt_del_guion()
    srt = leer_srt(SRT.read_text(encoding="utf-8"))
    assert len(srt) == len(guion)
    for i, ((a0, a1, at), (b0, b1, bt)) in enumerate(zip(srt, guion), start=1):
        assert (a0, a1) == (b0, b1), f"subtítulo {i}: tiempos distintos del guion"
        assert at == bt or (i == 4 and at == alterno), f"subtítulo {i}: «{at}» no es el del guion"


def test_srt_sin_digitos_y_de_28_a_29_segundos():
    if not SRT.exists():
        pytest.skip("pendiente: docs/pitch/video_30s.srt")
    srt = leer_srt(SRT.read_text(encoding="utf-8"))
    assert not [t for _, _, t in srt if re.search(r"\d", t)], "el texto que se agrega al video no lleva dígitos"
    assert not [t for _, _, t in srt if PROHIBIDAS.search(t)]
    assert all(len(t.split()) <= 11 for _, _, t in srt), "una línea por toma, de 10 palabras como máximo"
    assert 28.0 <= srt[-1][1] <= 29.0, f"dura {srt[-1][1]} s: debe quedar de 28 a 29 s (guía de envío)"


@pytest.mark.parametrize("script", ["grabar_video.mjs", "diapositivas_pdf.mjs"])
def test_scripts_de_los_materiales_con_encabezado(script):
    ruta = RAIZ / "tests" / "e2e" / script
    assert ruta.read_text(encoding="utf-8").startswith(ENCABEZADO_JS), f"tests/e2e/{script} sin el encabezado de la regla 4"
