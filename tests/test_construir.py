# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Pruebas de construir.py (el comando único, CLAUDE.md regla 6) en lo que puede fallar en silencio:

- sin RAIZ_BUZON el ensamblado no dice «OK — buzón validado» (queda OMITIDO);
- si faltan entradas de B4 y la web ya publica un cubo REAL, el paso FALLA y no lo reemplaza con simulados;
  si el cubo publicado es simulado, se regeneran los simulados y el detalle lo dice («SIMULADOS (faltan: …)»);
- la línea «Sigue simulado» del reporte se arma con cubo.meta.mock (lo que ve la web);
- relieve con cero zonas no se reporta OK.
Cada prueba trabaja en tmp_path con módulos falsos: nunca toca web/data ni data/processed del repo.
"""
import json
import sys
import types
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))
import construir  # noqa: E402


def cubo_publicado(raiz, mock):
    (raiz / "web/data").mkdir(parents=True, exist_ok=True)
    (raiz / "web/data/cubo.json").write_text(json.dumps({"meta": {"mock": mock, "mock_campos": None}}), encoding="utf-8")


@pytest.fixture
def falsos(tmp_path, monkeypatch):
    """construir con RAIZ en tmp_path y motor.* falsos; devuelve el registro de llamadas."""
    (tmp_path / "data/processed").mkdir(parents=True)
    (tmp_path / "motor").mkdir()
    (tmp_path / "motor/ensamblar.py").write_text("# falso\n", encoding="utf-8")
    llamadas = []

    def simulados_generar():
        llamadas.append("simulados")
        return ({"features": [{}]}, {"parcelas": {"S1": {"opciones": [{}]}}}, {"explicaciones": {}})

    modulos = {
        "motor.b4_cubo": types.SimpleNamespace(OBLIGATORIAS=("entrada_b4.csv",), construir=lambda: llamadas.append("b4")),
        "motor.simulados": types.SimpleNamespace(generar=simulados_generar),
        "motor.ensamblar": types.SimpleNamespace(
            ensamblar=lambda buzon=None: {k: [] for k in construir.LLAVES_REPORTE}),
        "motor.relieve_web": types.SimpleNamespace(construir=lambda: {"ejecutado": True, "zonas": [], "rutas_bytes": 0}),
    }
    monkeypatch.setattr(construir, "RAIZ", tmp_path)
    monkeypatch.setattr(construir, "importar", lambda nombre: modulos[nombre])
    return tmp_path, llamadas


def test_sin_buzon_el_ensamblado_queda_omitido(falsos, monkeypatch):
    monkeypatch.delenv("RAIZ_BUZON", raising=False)
    paso, reporte = construir.paso_ensamblar()
    assert paso.estado == construir.OMITIDO and "sin RAIZ_BUZON" in paso.detalle
    assert reporte is not None


def test_con_buzon_el_ensamblado_dice_cuantas_entraron(falsos, monkeypatch):
    monkeypatch.setenv("RAIZ_BUZON", str(falsos[0]))
    paso, _ = construir.paso_ensamblar()
    assert paso.estado == construir.OK and "entraron 0" in paso.detalle


def test_faltan_entradas_y_cubo_real_publicado_falla_sin_reemplazar(falsos):
    raiz, llamadas = falsos
    cubo_publicado(raiz, mock=False)
    paso = construir.paso_simulados(None)
    assert paso.estado == construir.FALLA
    assert "entrada_b4.csv" in paso.detalle and "REAL" in paso.detalle
    assert "simulados" not in llamadas, "no debe reemplazar la web real con simulados"
    assert json.loads((raiz / "web/data/cubo.json").read_text(encoding="utf-8"))["meta"]["mock"] is False


def test_faltan_entradas_con_cubo_simulado_regenera_y_lo_dice(falsos):
    raiz, llamadas = falsos
    cubo_publicado(raiz, mock=True)
    paso = construir.paso_simulados(None)
    assert paso.estado == construir.OK and llamadas == ["simulados"]
    assert paso.detalle.startswith("SIMULADOS (faltan: entrada_b4.csv)"), paso.detalle


def test_sigue_simulado_lee_cubo_meta_mock(falsos):
    raiz, _ = falsos
    cubo_publicado(raiz, mock=True)
    reporte = {"sigue_simulado": []}
    assert construir.estado_simulado(reporte).startswith("cubo SIMULADO")
    cubo_publicado(raiz, mock=False)
    assert construir.estado_simulado(reporte).startswith("cubo real")


def test_relieve_sin_zonas_no_es_ok(falsos):
    paso = construir.paso_relieve()
    assert paso.estado == construir.PENDIENTE and "sin zonas" in paso.detalle
