# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""A6 (paso 2) · VERDAD del back-test H1: salida acumulada por obra de toma de La Boquilla, integrada de la serie
diaria oficial del SIH de Conagua (LBQCH.csv). Solo calcula la verdad; NO corre el modelo ni las líneas base.

Preregistro, sección 4: volumen diario (hm³) = caudal ObraToma (m³/s) × 86,400 ÷ 10⁶, del 14-mar al 14-jul-2026
(punto principal) y al 13-may-2026 (punto secundario). No equivale a la entrega en parcela.
Las columnas se leen por nombre. Se reportan huecos y ceros del periodo.
Entrada: --sih data/raw/sih/LBQCH.csv · Salida: h1_verdad_sih.json y h1_verdad_sih_diario.csv
"""
import csv
import datetime as dt
import io
import json

from comun import carpeta, registrar_fuentes

INICIO = dt.date(2026, 3, 14)
PUNTOS = {"secundario_13_may": dt.date(2026, 5, 13), "principal_14_jul": dt.date(2026, 7, 14)}
PRENSA = {"secundario_13_may": 228.86, "principal_14_jul": 447.65}


def main():
    a = carpeta("A6: verdad del back-test H1 (SIH)", lambda ap: ap.add_argument("--sih", required=True))
    texto = open(a.sih, encoding="utf-8").read()
    cuerpo = texto[texto.index("Estacion,Fecha"):]
    filas = {dt.date.fromisoformat(r["Fecha"]): r for r in csv.DictReader(io.StringIO(cuerpo))}
    num = lambda r, k: None if r is None or r.get(k) in (None, "") else float(r[k])
    diario, res = [], {}
    fin = max(PUNTOS.values())
    d, acum = INICIO, 0.0
    huecos, ceros = [], []
    while d <= fin:
        q = num(filas.get(d), "ObraToma(m3/s)")
        if q is None:
            huecos.append(d.isoformat())
        elif q == 0:
            ceros.append(d.isoformat())
        v = (q or 0.0) * 86400 / 1e6
        acum += v
        diario.append([d.isoformat(), q, round(v, 4), round(acum, 3), num(filas.get(d), "VolumenAlm(Mm3)")])
        for nombre, p in PUNTOS.items():
            if d == p:
                alm0, alm1 = num(filas.get(INICIO), "VolumenAlm(Mm3)"), num(filas.get(p), "VolumenAlm(Mm3)")
                res[nombre] = {"fecha": p.isoformat(), "salida_acumulada_hm3": round(acum, 2),
                               "dias": (p - INICIO).days + 1,
                               "caida_almacenamiento_hm3": None if None in (alm0, alm1) else round(alm0 - alm1, 2),
                               "prensa_hm3": PRENSA[nombre]}
        d += dt.timedelta(days=1)
    ultima = max(filas)
    salida = {"fuente": "Conagua SIH, https://sih.conagua.gob.mx/basedatos/Presas/LBQCH.csv (descargada el 2026-11-14; "
                        f"última fecha {ultima.isoformat()})",
              "definicion": "Σ ObraToma (m³/s) × 86,400 ÷ 10⁶, del 14-mar-2026 a la fecha del punto, ambos días incluidos",
              "almacenamiento_14_mar_2026_hm3": num(filas.get(INICIO), "VolumenAlm(Mm3)"),
              "puntos": res, "dias_sin_dato": huecos, "dias_con_cero": len(ceros),
              "primer_dia_con_extraccion": next((x[0] for x in diario if x[1]), None),
              "advertencia": "Salida por obra de toma en la presa; no equivale a la entrega en parcela ni separa usuarios fuera del DR-005."}
    json.dump(salida, open("h1_verdad_sih.json", "w"), ensure_ascii=False, indent=1)
    with open("h1_verdad_sih_diario.csv", "w", newline="") as fo:
        w = csv.writer(fo)
        w.writerow(["fecha", "obra_toma_m3s", "volumen_dia_hm3", "acumulado_hm3", "almacenamiento_hm3"])
        w.writerows(diario)
    registrar_fuentes("A6_verdad", ["h1_verdad_sih.json", "h1_verdad_sih_diario.csv"], salida["fuente"], "datos/colab/A6_verdad_sih.py")
    print(json.dumps(salida, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
