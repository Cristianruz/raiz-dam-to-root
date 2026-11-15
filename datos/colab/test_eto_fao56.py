# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Prueba de aceptación de A1: FAO-56, capítulo 4, Ejemplo 18 (Bruselas, 6 de julio).

Datos del ejemplo: lat 50°48' N, z = 100 m, J = 187, Tmax 21.5 °C, Tmin 12.3 °C,
ea = 1.409 kPa (de RHmax 84 % y RHmin 63 %), u2 = 2.078 m/s, Rs = 22.07 MJ m-2 dia-1.
Resultado publicado: ETo ≈ 3.9 mm/dia.
"""
from eto_fao56 import eto_dia, ra


def test_ejemplo18():
    eto = eto_dia(tmax=21.5, tmin=12.3, rs=22.07, u2=2.078,
                  lat_deg=50 + 48 / 60, z=100, j=187, ea=1.409)
    assert abs(eto - 3.9) < 0.1, eto


def test_ra_ejemplo8():
    # FAO-56 Ejemplo 8: 20° S, 3 de septiembre (J = 246): Ra = 32.2 MJ m-2 dia-1
    assert abs(ra(-20, 246) - 32.2) < 0.2


if __name__ == "__main__":
    test_ejemplo18()
    test_ra_ejemplo8()
    print("PRUEBAS FAO-56 OK")
