# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Pruebas de motor/relieve_web.py (capa de relieve y tormenta para la web)."""
import json
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "motor"))
import relieve_web  # noqa: E402


def _meta(mm, fuente):
    return {"rotulo": "regional, 30 m (NASADEM); not field drainage design", "umbral_ruta_ha": 50.0,
            "umbral_ruta_etiqueta": "assumption [S]",
            "tormenta": {"mm": mm, "definicion": "DATO DE PRUEBA", "fuente": fuente, "periodo": "DATO DE PRUEBA"}}


def test_sin_entregas_no_escribe_y_borra_capas_viejas(tmp_path):
    web = tmp_path / "web"; web.mkdir()
    (web / "relieve.json").write_text("{}")
    r = relieve_web.construir(processed=tmp_path / "vacio", web=web)
    assert r["ejecutado"] is False
    assert not (web / "relieve.json").exists()


def test_dos_zonas_con_sufijo(tmp_path):
    proc = tmp_path / "processed"; proc.mkdir()
    (proc / "relieve_rutas.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": []}))
    (proc / "relieve_meta.json").write_text(json.dumps(_meta(1.0, "prueba A")))
    (proc / "relieve_meta_lazaro_cardenas.json").write_text(json.dumps(_meta(2.0, "prueba B")))
    (proc / "relieve_meta_zona_inventada.json").write_text(json.dumps(_meta(3.0, "prueba C")))
    r = relieve_web.construir(processed=proc, web=tmp_path / "web")
    assert r["ejecutado"] and r["zonas"] == ["delicias_saucillo", "lazaro_cardenas"]
    d = json.loads((tmp_path / "web/relieve.json").read_text())
    assert d["zonas"]["lazaro_cardenas"]["tormenta"]["fuente"] == "prueba B"
    assert "zona_inventada" not in d["zonas"]


def test_datos_actuales_si_existen(tmp_path):
    proc = RAIZ / "data/processed"
    if not (proc / "relieve_rutas.geojson").exists():
        return
    r = relieve_web.construir(processed=proc, web=tmp_path)
    assert r["ejecutado"]
    d = json.loads((tmp_path / "relieve.json").read_text())
    for z in d["zonas"].values():
        assert z["tormenta"]["mm"] is not None and z["tormenta"]["fuente"], "la tormenta debe traer lámina y fuente"
