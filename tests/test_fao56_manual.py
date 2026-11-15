# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Prueba 5 de S9 §6, parte FAO-56: la ETo del proyecto contra los ejemplos resueltos del manual.

El cálculo vive en datos/colab/eto_fao56.py (pieza A1 de la sesión de datos) y es el mismo que produjo
data/processed/eto_diaria*.csv. Aquí se corre dentro del comando único (python construir.py → pytest),
para que la página diga «run» y no «not run» (motor/pruebas_web.py busca tests/test_fao*56*.py).

Manual: Allen et al. (1998), FAO Irrigation and Drainage Paper 56, versión en línea de FAO:
https://www.fao.org/3/X0490E/x0490e00.htm (capítulo 3, Ejemplo 8; capítulo 4, Ejemplo 18).
Las entradas y los resultados de abajo son los publicados en esos ejemplos.
"""
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "datos" / "colab"))
from eto_fao56 import eto_dia, ra  # noqa: E402


def test_ejemplo_18_eto_diaria_bruselas():
    """Capítulo 4, Ejemplo 18: Bruselas (50°48' N, 100 m), 6 de julio; ETo publicada ≈ 3.9 mm/día."""
    eto = eto_dia(tmax=21.5, tmin=12.3, rs=22.07, u2=2.078, lat_deg=50 + 48 / 60, z=100, j=187, ea=1.409)
    assert abs(eto - 3.9) < 0.1, eto


def test_ejemplo_8_radiacion_extraterrestre():
    """Capítulo 3, Ejemplo 8: 20° S, 3 de septiembre (día 246); Ra publicada = 32.2 MJ m⁻² día⁻¹."""
    assert abs(ra(-20, 246) - 32.2) < 0.2
