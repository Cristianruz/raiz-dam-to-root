# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""ETo diaria FAO-56 Penman-Monteith (Allen et al. 1998, capítulo 3).

Implementación paso a paso, sin dependencias externas, para poder auditarla.
Las ecuaciones citadas son las de FAO-56.
"""
import math

GSC = 0.0820          # constante solar, MJ m-2 min-1 (ec. 21)
SIGMA = 4.903e-9      # Stefan-Boltzmann, MJ K-4 m-2 dia-1 (ec. 39)
ALBEDO = 0.23         # pasto de referencia (ec. 38)


def e0(t):
    """Presión de saturación de vapor a la temperatura t (°C), kPa (ec. 11)."""
    return 0.6108 * math.exp(17.27 * t / (t + 237.3))


def ra(lat_deg, j):
    """Radiación extraterrestre diaria, MJ m-2 dia-1 (ec. 21-25)."""
    phi = math.radians(lat_deg)
    dr = 1 + 0.033 * math.cos(2 * math.pi * j / 365)
    delta = 0.409 * math.sin(2 * math.pi * j / 365 - 1.39)
    ws = math.acos(max(-1.0, min(1.0, -math.tan(phi) * math.tan(delta))))
    return (24 * 60 / math.pi) * GSC * dr * (
        ws * math.sin(phi) * math.sin(delta) + math.cos(phi) * math.cos(delta) * math.sin(ws))


def eto_dia(tmax, tmin, rs, u2, lat_deg, z, j, rh_media=None, ea=None):
    """ETo diaria en mm/dia.

    tmax, tmin: °C · rs: radiación solar MJ m-2 dia-1 · u2: viento a 2 m, m/s
    lat_deg: latitud en grados · z: elevación en m · j: día del año
    ea: presión real de vapor (kPa); si no se da, se calcula con rh_media (%) (ec. 19).
    """
    t = (tmax + tmin) / 2                                   # ec. 9
    p = 101.3 * ((293 - 0.0065 * z) / 293) ** 5.26          # ec. 7
    gamma = 0.665e-3 * p                                    # ec. 8
    es = (e0(tmax) + e0(tmin)) / 2                          # ec. 12
    delta = 4098 * e0(t) / (t + 237.3) ** 2                 # ec. 13
    if ea is None:
        ea = rh_media / 100 * es                            # ec. 19
    ra_ = ra(lat_deg, j)
    rso = (0.75 + 2e-5 * z) * ra_                           # ec. 37
    rns = (1 - ALBEDO) * rs                                 # ec. 38
    cociente = min(rs / rso, 1.0) if rso > 0 else 0.0
    rnl = SIGMA * ((tmax + 273.16) ** 4 + (tmin + 273.16) ** 4) / 2 \
        * (0.34 - 0.14 * math.sqrt(ea)) * (1.35 * cociente - 0.35)   # ec. 39
    rn = rns - rnl                                          # ec. 40
    g = 0.0                                                 # ec. 42 (diario)
    num = 0.408 * delta * (rn - g) + gamma * (900 / (t + 273)) * u2 * (es - ea)
    den = delta + gamma * (1 + 0.34 * u2)
    return max(num / den, 0.0)                              # ec. 6


def rhmin_estimada(tmax, ea):
    """Humedad relativa mínima aproximada para la ec. 62, en %."""
    return min(100.0, 100 * ea / e0(tmax))
