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


def test_tabla_de_pruebas_tambien_en_ingles(tmp_path, monkeypatch):
    """docs/en/test_results.md: la misma tabla de docs/pruebas.md con los nombres en inglés de la web,
    porque «About & Data» la enlaza y la guía de envío pide que lo enlazado esté en inglés."""
    (tmp_path / "docs").mkdir()
    monkeypatch.setattr(construir, "RAIZ", tmp_path)
    construir.escribir_pruebas_md([construir.Paso("contrato", "OK", "CONTRATO OK"),
                                 construir.Paso("pytest", "FALLA", "1 failed")], 12.3)
    es = (tmp_path / "docs/pruebas.md").read_text(encoding="utf-8")
    en = (tmp_path / "docs/en/test_results.md").read_text(encoding="utf-8")
    assert "| contrato | OK | CONTRATO OK |" in es
    assert en.startswith("<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->")
    assert "# Automated test results" in en
    assert "| Data contract, including the water balance of “Follow the drop” | passed | CONTRATO OK |" in en
    assert "| Python tests | failed | 1 failed |" in en


# --- Revisión de dda5abb: puntos 8, 9 y 10 -------------------------------------------------------
def test_rechazado_que_conserva_la_copia_anterior_queda_como_advertencia(falsos, monkeypatch):
    """Punto 8: un archivo rechazado cuya copia validada anterior sigue en data/processed (la web la seguirá
    usando) no deja el paso en «OK»: queda en ADVERTENCIA con la lista de esos archivos. El código de salida no
    cambia (el proyecto no tiene modo estricto)."""
    raiz, _ = falsos
    salida = raiz / "data/processed"
    (salida / "cultivos_parcelas.csv").write_text("copia validada anterior\n", encoding="utf-8")
    reporte = {**{k: [] for k in construir.LLAVES_REPORTE}, "salida": str(salida),
               "rechazados": [{"archivo": "cultivos_parcelas.csv", "motivos": ["prueba"]},
                              {"archivo": "nuevo_sin_copia.csv", "motivos": ["prueba"]}]}
    monkeypatch.setattr(construir, "importar", lambda nombre: types.SimpleNamespace(ensamblar=lambda buzon=None: reporte))
    monkeypatch.setenv("RAIZ_BUZON", str(raiz))
    paso, _ = construir.paso_ensamblar()
    assert paso.estado == construir.ADVERTENCIA
    assert "cultivos_parcelas.csv" in paso.detalle and "nuevo_sin_copia.csv" not in paso.detalle, paso.detalle
    # Sin copia anterior conservada, un rechazo no es advertencia de este tipo (no hay dato viejo en uso).
    reporte["rechazados"] = reporte["rechazados"][1:]
    assert construir.paso_ensamblar()[0].estado == construir.OK


def pasos_falsos(monkeypatch, raiz, estados=None):
    """Sustituye cada paso de construir.main por uno que registra su nombre y devuelve el estado pedido."""
    orden, estados = [], estados or {}

    def paso(nombre):
        def correr(*_, **__):
            orden.append(nombre)
            return construir.Paso(nombre, estados.get(nombre, construir.OK), estados.get(f"{nombre}_detalle", ""))
        return correr

    monkeypatch.setattr(construir, "RAIZ", raiz)
    monkeypatch.setattr(construir, "paso_ensamblar", lambda: (paso("ensamblar")(), None))
    for nombre in ("simulados", "relieve", "gemelo", "pwa", "manifest", "contrato", "verificador", "pytest", "node",
                   "pruebas_web"):
        monkeypatch.setattr(construir, f"paso_{nombre}", paso(nombre))
    monkeypatch.setattr(construir, "escribir_pruebas_md", lambda *_: orden.append("pruebas_md"))
    return orden


@pytest.mark.parametrize("argv", [["--rapido"], []])
def test_la_lista_sin_conexion_se_arma_despues_del_manifest(tmp_path, monkeypatch, argv):
    """Punto 10: la precarga de la app sin conexión (motor/pwa.py) toma la huella de manifest.json; con --rapido
    corría antes del manifest y quedaba vieja. Ahora la última pwa va después del último manifest, con o sin --rapido."""
    orden = pasos_falsos(monkeypatch, tmp_path)
    assert construir.main(argv) == 0
    ultimo = max(i for i, n in enumerate(orden) if n == "pwa")
    assert ultimo > max(i for i, n in enumerate(orden) if n == "manifest"), orden


def test_advertencia_del_ensamblado_se_ve_en_el_reporte_sin_cambiar_el_codigo(tmp_path, monkeypatch, capsys):
    pasos_falsos(monkeypatch, tmp_path, {"ensamblar": construir.ADVERTENCIA,
                                         "ensamblar_detalle": "rechazados con copia anterior: cultivos_parcelas.csv"})
    assert construir.main(["--rapido"]) == 0
    salida = capsys.readouterr().out.split("REPORTE", 1)[1]
    assert "ADVERTENCIA — rechazados con copia anterior: cultivos_parcelas.csv" in salida
    assert "advertencia: ensamblar" in salida.strip().splitlines()[-1], salida


def test_gemelo_sigue_con_los_demas_modulos_si_uno_falla(falsos, monkeypatch):
    """Punto 9: si un módulo del gemelo falla, los demás se construyen igual (no quedan JSON viejos) y el paso
    FALLA nombrando cada módulo que falló."""
    llamadas = []

    def modulo(nombre, falla):
        def construir_():
            llamadas.append(nombre)
            if falla:
                raise RuntimeError(f"{nombre} roto (prueba)")
            return {"ejecutado": True}
        return types.SimpleNamespace(construir=construir_)

    mods = {"motor.gemelo_web": modulo("gemelo", True), "motor.contexto_web": modulo("contexto", False),
            "motor.suelo_web": modulo("suelo", True)}
    monkeypatch.setattr(construir, "importar", lambda nombre: mods[nombre])
    paso = construir.paso_gemelo()
    assert llamadas == ["gemelo", "contexto", "suelo"]
    assert paso.estado == construir.FALLA
    assert "motor.gemelo_web" in paso.detalle and "motor.suelo_web" in paso.detalle and "contexto: OK" in paso.detalle
