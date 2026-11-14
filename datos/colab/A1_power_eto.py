# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A1 · Clima diario de NASA POWER y ETo FAO-56 para la zona piloto del DR-005.

Uso (Colab o cualquier Python 3 con internet):
    python A1_power_eto.py            # descarga 1981-hoy y escribe eto_diaria.csv
Salidas:
    power_crudo_<inicio>_<fin>.json   # respuesta original de la API (sin modificar)
    eto_diaria.csv                    # fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m, rs, rh2m
Fuente: NASA POWER Daily API, community=AG (https://power.larc.nasa.gov/docs/services/api/temporal/daily/)
"""
import csv
import datetime as dt
import json
import sys
import urllib.request

from comun import carpeta, registrar_fuentes
from eto_fao56 import eto_dia

LAT, LON = 28.19, -105.45          # punto representativo de la zona (kit A1) [supuesto]
# El punto queda ~3 km al norte y oeste del bbox [-105.42, 28.08, -105.32, 28.16], pero cae en la misma celda
# de POWER que toda la zona: MERRA-2 (0.5° × 0.625°) centro 28.0 N, −105.625 O (lat 27.75–28.25,
# lon −105.9375 a −105.3125); radiación CERES SYN1deg (1° × 1°) lat 28–29, lon −106 a −105. POWER no interpola
# dentro de la celda, así que da los mismos valores que el centro del bbox.
Z = 1173                           # m; INEGI, ficha de la localidad Delicias (080210001) [V]
PARAMS = "T2M_MAX,T2M_MIN,RH2M,WS2M,ALLSKY_SFC_SW_DWN,PRECTOTCORR"
URL = ("https://power.larc.nasa.gov/api/temporal/daily/point"
       "?parameters={p}&community=AG&longitude={lon}&latitude={lat}"
       "&start={ini}&end={fin}&format=JSON")


def descargar(ini, fin):
    url = URL.format(p=PARAMS, lon=LON, lat=LAT, ini=ini, fin=fin)
    with urllib.request.urlopen(url, timeout=120) as r:
        datos = json.load(r)
    with open(f"power_crudo_{ini}_{fin}.json", "w") as f:
        json.dump(datos, f)
    return datos


def main():
    carpeta("A1: NASA POWER y ETo FAO-56")
    hoy = dt.date.today().strftime("%Y%m%d")
    tramos = [("19810101", "19951231"), ("19960101", "20101231"), ("20110101", hoy)]
    filas, faltantes = [], 0
    for ini, fin in tramos:
        d = descargar(ini, fin)
        unidades = {k: v.get("units") for k, v in d.get("parameters", {}).items()}
        if "MJ" not in str(unidades.get("ALLSKY_SFC_SW_DWN", "")):
            sys.exit(f"Unidades de radiación inesperadas: {unidades}")
        p = d["properties"]["parameter"]
        for fecha in sorted(p["T2M_MAX"]):
            v = {k: p[k][fecha] for k in p}
            if any(x == -999 for x in v.values()):
                faltantes += 1
                continue
            f = dt.datetime.strptime(fecha, "%Y%m%d").date()
            eto = eto_dia(v["T2M_MAX"], v["T2M_MIN"], v["ALLSKY_SFC_SW_DWN"], v["WS2M"],
                          LAT, Z, f.timetuple().tm_yday, rh_media=v["RH2M"])
            filas.append([f.isoformat(), round(eto, 3), v["T2M_MIN"], v["T2M_MAX"],
                          v["PRECTOTCORR"], v["WS2M"], v["ALLSKY_SFC_SW_DWN"], v["RH2M"]])
    with open("eto_diaria.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["fecha", "eto_mm", "tmin", "tmax", "lluvia_mm", "ws2m", "rs", "rh2m"])
        w.writerows(filas)

    registrar_fuentes("A1", ["eto_diaria.csv"], "NASA POWER Daily API, community=AG, punto 28.19 N −105.45 O (misma celda MERRA-2 0.5°×0.625° y CERES 1° que el bbox)",
                      "datos/colab/A1_power_eto.py")
    # Prueba de aceptación (kit A1)
    etos = [r[1] for r in filas]
    assert all(0 <= e <= 15 for e in etos), "ETo fuera de 0-15 mm/d"
    por_anio = {}
    for r in filas:
        a = r[0][:4]
        por_anio.setdefault(a, [0.0, 0.0, 0])
        por_anio[a][0] += r[1]
        por_anio[a][1] += r[4]
        por_anio[a][2] += 1
    completos = [v for v in por_anio.values() if v[2] >= 360]
    eto_anual = sum(v[0] for v in completos) / len(completos)
    lluvia_anual = sum(v[1] for v in completos) / len(completos)
    print(f"Días: {len(filas)} · faltantes descartados: {faltantes}")
    print(f"ETo anual media: {eto_anual:.0f} mm (control de sanidad 1,400-2,600)")
    print(f"Lluvia anual media POWER: {lluvia_anual:.0f} mm (estación Delicias 1990-2004: 284 mm, Conagua 2024)")


if __name__ == "__main__":
    main()
