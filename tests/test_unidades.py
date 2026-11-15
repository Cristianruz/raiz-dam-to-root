# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""K-TEST 2: unidades. 1 millar/ha = 1,000 m³/ha = 10 cm = 100 mm (S9 §5; kit B4).

Los valores se leen de data/params.json (unidades.millar). Las únicas constantes
de este archivo son definiciones del Sistema Internacional (1 ha = 10,000 m²;
1 m = 100 cm; 1 cm = 10 mm), no datos del proyecto.
"""
import json
import re
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
PARAMS = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
CUBO = json.loads((RAIZ / "web/data/cubo.json").read_text(encoding="utf-8"))
GEO = json.loads((RAIZ / "web/data/parcelas.geojson").read_text(encoding="utf-8"))
MILLAR = PARAMS["unidades"]["millar"]["valor"]

# Definiciones SI (no son cifras del proyecto)
M2_POR_HA = 10_000
CM_POR_M = 100
MM_POR_CM = 10


def test_millar_tiene_fuente():
    entrada = PARAMS["unidades"]["millar"]
    assert entrada.get("fuente"), "unidades.millar debe citar su fuente"
    assert set(MILLAR) >= {"m3_por_ha", "lamina_cm", "lamina_mm"}


def test_m3_por_ha_equivale_a_la_lamina_en_cm():
    # Una lámina de h metros sobre 1 ha es h × 10,000 m³.
    lamina_cm = MILLAR["m3_por_ha"] / M2_POR_HA * CM_POR_M
    assert lamina_cm == pytest.approx(MILLAR["lamina_cm"])


def test_lamina_en_cm_equivale_a_la_lamina_en_mm():
    assert MILLAR["lamina_cm"] * MM_POR_CM == pytest.approx(MILLAR["lamina_mm"])


def test_lamina_en_mm_equivale_a_m3_por_ha():
    # B4: 100 mm = 1 millar/ha. Una lámina de lamina_mm sobre 1 ha son m3_por_ha m³.
    m3 = MILLAR["lamina_mm"] / MM_POR_CM / CM_POR_M * M2_POR_HA
    assert m3 == pytest.approx(MILLAR["m3_por_ha"])


def test_equivalencia_que_muestra_la_web_coincide_con_params():
    # El texto dotaciones.equivalencia del cubo lo lee la web: sus cifras deben ser las de params.
    texto = CUBO["dotaciones"]["equivalencia"]
    en_texto = {float(x.replace(",", "")) for x in re.findall(r"\d[\d,]*(?:\.\d+)?", texto)}
    for clave in ("m3_por_ha", "lamina_cm", "lamina_mm"):
        assert float(MILLAR[clave]) in en_texto, f"la equivalencia no menciona {clave} = {MILLAR[clave]}"


def test_la_gota_usa_la_misma_unidad():
    # X3.1: m3_llegan_parcela = lámina bruta P50 (lluvia 0, millares/ha) × m³ por millar/ha × área.
    area = {f["properties"]["id"]: f["properties"]["area_ha"] for f in GEO["features"]}
    revisadas = 0
    for pid, pc in CUBO["parcelas"].items():
        for op in pc["opciones"]:
            l50 = op["agua"]["lamina_bruta"]["0"]["p50"]
            esperado = l50 * MILLAR["m3_por_ha"] * area[pid]
            assert op["gota"]["m3_llegan_parcela"] == pytest.approx(esperado, rel=1e-3, abs=0.1), (
                f"{pid}/{op['id']}: m3_llegan_parcela no es lámina × área en m³")
            revisadas += 1
    assert revisadas > 0


def test_conversion_mm_de_b4():
    """B4 convierte la lámina neta en mm a m³ con unidades.millar (lamina_mm y m3_por_ha) de params."""
    import sys
    sys.path.insert(0, str(RAIZ / "motor"))
    import b4_cubo
    params = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
    mm = MILLAR["lamina_mm"]  # una lámina neta igual a 1 millar/ha expresada en mm
    g = b4_cubo.bloque_gota(1.0, 1.0, mm, params, MILLAR["m3_por_ha"])
    assert g["m3_consume_cultivo_et"] == pytest.approx(MILLAR["m3_por_ha"]), "mm → m³/ha no usa params.unidades.millar"
    assert g["m3_llegan_parcela"] == pytest.approx(MILLAR["m3_por_ha"])
