# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; Codex dashboard.
"""La vista debe conservar la demanda de cada zona y no suplir datos faltantes."""
import json
from pathlib import Path
import pytest
from motor.dashboard_web import construir
from motor.manifest import generar

RAIZ = Path(__file__).resolve().parent.parent


def test_rotaciones_son_copia_exacta_por_zona():
    publicado = json.loads((RAIZ / 'web/data/dashboard.json').read_text())
    for zona, nombre in [('delicias_saucillo', 'rotaciones.json'),
                         ('lazaro_cardenas', 'rotaciones_lazaro_cardenas.json')]:
        origen = json.loads((RAIZ / 'data/processed' / nombre).read_text())
        assert publicado['rotaciones'][zona] == origen['rotaciones']


def test_zona_sin_entrega_es_null_y_no_copia_la_otra(tmp_path):
    (tmp_path / 'data/processed').mkdir(parents=True)
    (tmp_path / 'web/data').mkdir(parents=True)
    (tmp_path / 'data/investigacion_dashboard.json').write_text('{"eventos": []}')
    (tmp_path / 'data/processed/rotaciones.json').write_text('{"rotaciones": [{"id": "prueba"}]}')
    datos = construir(tmp_path)
    assert datos['rotaciones']['delicias_saucillo'] == [{'id': 'prueba'}]
    assert datos['rotaciones']['lazaro_cardenas'] is None


def test_referencia_ausente_falla_sin_inventar(tmp_path):
    with pytest.raises(FileNotFoundError):
        construir(tmp_path)


def test_manifest_registra_cifras_de_referencia_y_modelo():
    manifest = generar(escribir=False)
    entradas = [c for c in manifest['cifras'].values() if c['archivo'] == 'web/data/dashboard.json']
    assert entradas
    assert any('historia' in c['clave'] and '[P]' in c['etiqueta'] for c in entradas)
    assert any('rotaciones' in c['clave'] and '[S]' in c['etiqueta'] for c in entradas)
    assert all(c['fuente'] and c['fecha'] and not c['mock'] for c in entradas)
