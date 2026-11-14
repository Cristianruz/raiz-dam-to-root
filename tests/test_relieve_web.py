# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Pruebas de motor/relieve_web.py (capa de relieve y tormenta para la web).

- Sin entregas no escribe nada y borra la capa vieja.
- Un bloque por zona; un relieve_meta de una zona desconocida se ignora Y se dice en «avisos».
- Con cero zonas válidas: «ejecutado» False con su motivo, y la capa vieja se borra.
- «rutas_depresiones» de relieve_meta (profundidad mínima, etiqueta, nota, celdas y retazos omitidos) se
  copia tal cual por zona, para que la leyenda explique las rutas cortadas; si A9 no lo trae, null y aviso.
Todos los valores escritos aquí son DATOS DE PRUEBA."""
import json
import shutil
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "motor"))
import relieve_web  # noqa: E402


def _depresiones(celdas):
    """Bloque rutas_depresiones DE PRUEBA con la forma que entrega A9."""
    return {"prof_min_m": 3.0, "etiqueta": "DATO DE PRUEBA [S]", "celdas_de_ruta_omitidas": celdas,
            "retazos_omitidos": celdas // 7, "retazo_min_celdas": 10, "nota": "DATO DE PRUEBA: no path inside closed depressions"}


def _meta(mm, fuente, depresiones=None):
    meta = {"rotulo": "regional, 30 m (NASADEM); not field drainage design", "umbral_ruta_ha": 50.0,
            "umbral_ruta_etiqueta": "assumption [S]",
            "tormenta": {"mm": mm, "definicion": "DATO DE PRUEBA", "fuente": fuente, "periodo": "DATO DE PRUEBA"}}
    if depresiones is not None:
        meta["rutas_depresiones"] = depresiones
    return meta


def _rutas(proc):
    proc.mkdir(parents=True, exist_ok=True)
    (proc / "relieve_rutas.geojson").write_text(json.dumps({"type": "FeatureCollection", "features": []}))


def test_sin_entregas_no_escribe_y_borra_capas_viejas(tmp_path):
    web = tmp_path / "web"; web.mkdir()
    (web / "relieve.json").write_text("{}")
    r = relieve_web.construir(processed=tmp_path / "vacio", web=web)
    assert r["ejecutado"] is False and r["motivo"] and r["avisos"] == []
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
    # El archivo de la zona desconocida no se ignora en silencio: se nombra en los avisos.
    ignorados = [a for a in r["avisos"] if "relieve_meta_zona_inventada.json" in a and "zona_inventada" in a]
    assert len(ignorados) == 1 and "se ignora" in ignorados[0], r["avisos"]


def test_cero_zonas_validas_no_ejecuta_y_dice_por_que(tmp_path):
    proc, web = tmp_path / "processed", tmp_path / "web"
    _rutas(proc)
    web.mkdir()
    (web / "relieve.json").write_text("{}")             # capa vieja de una corrida anterior
    (web / "relieve_rutas.geojson").write_text("{}")
    (proc / "relieve_meta_zona_inventada.json").write_text(json.dumps(_meta(3.0, "prueba C")))
    r = relieve_web.construir(processed=proc, web=web)
    assert r["ejecutado"] is False
    assert "zona de params.zona_piloto.zonas" in r["motivo"]
    assert any("zona_inventada" in a for a in r["avisos"]), r["avisos"]
    assert not (web / "relieve.json").exists() and not (web / "relieve_rutas.geojson").exists(), \
        "sin zonas válidas la web no debe mostrar una capa vieja"


def test_rutas_depresiones_se_copia_por_zona(tmp_path):
    proc = tmp_path / "processed"
    _rutas(proc)
    dep_a, dep_b = _depresiones(700), _depresiones(140)
    (proc / "relieve_meta.json").write_text(json.dumps(_meta(1.0, "prueba A", dep_a)))
    (proc / "relieve_meta_lazaro_cardenas.json").write_text(json.dumps(_meta(2.0, "prueba B", dep_b)))
    r = relieve_web.construir(processed=proc, web=tmp_path / "web")
    assert r["ejecutado"] and r["avisos"] == []
    zonas = json.loads((tmp_path / "web/relieve.json").read_text())["zonas"]
    assert zonas["delicias_saucillo"]["rutas_depresiones"] == dep_a   # tal cual: cifras, etiqueta y nota
    assert zonas["lazaro_cardenas"]["rutas_depresiones"] == dep_b


def test_sin_rutas_depresiones_queda_null_y_se_avisa(tmp_path):
    proc = tmp_path / "processed"
    _rutas(proc)
    (proc / "relieve_meta.json").write_text(json.dumps(_meta(1.0, "prueba A")))
    r = relieve_web.construir(processed=proc, web=tmp_path / "web")
    assert r["ejecutado"]
    assert json.loads((tmp_path / "web/relieve.json").read_text())["zonas"]["delicias_saucillo"]["rutas_depresiones"] is None
    assert any("rutas_depresiones" in a for a in r["avisos"]), r["avisos"]


def test_datos_actuales_si_existen(tmp_path):
    proc = RAIZ / "data/processed"
    if not (proc / "relieve_rutas.geojson").exists():
        return
    r = relieve_web.construir(processed=proc, web=tmp_path)
    assert r["ejecutado"]
    d = json.loads((tmp_path / "relieve.json").read_text())
    for zona, z in d["zonas"].items():
        assert z["tormenta"]["mm"] is not None and z["tormenta"]["fuente"], "la tormenta debe traer lámina y fuente"
        # rutas_depresiones es la del relieve_meta de la zona, sin cambios.
        sufijo = "" if zona == relieve_web.ZONA_POR_OMISION else f"_{zona}"
        entregado = json.loads((proc / f"relieve_meta{sufijo}.json").read_text(encoding="utf-8")).get("rutas_depresiones")
        assert z["rutas_depresiones"] == entregado
