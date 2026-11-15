# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""E1 · ECOSTRESS por parcela y mes, contra la ETc del modelo (FAO-56) en los mismos días.

Entradas: data/raw/reto/ecostress_pasos_<zona>.csv — la salida de AppEEARS tal cual (archivo
          raiz-ecostress-<zona>-ECO-L3T-JET-002-results.csv de las solicitudes de E0, leído el 14-nov-2026 en el navegador de
          Cristian con su sesión y subido sin cambios; sha256 igual al de la lista del paquete de AppEEARS): un renglón por
          parcela y paso de ECOSTRESS, columnas Category, ID, Latitude, Longitude, Date («AAAA-MM-DD hh:mm:ss UTC»),
          ECOSTRESS_Tile, ECO_L3T_JET_002_ETdaily, ECO_L3T_JET_002_ETinstUncertainty, ECO_L3T_JET_002_cloud,
          ECO_L3T_JET_002_water.
          En --dir: cultivos_parcelas.csv (A4), eto_diaria.csv y eto_diaria_lazaro_cardenas.csv (A1), supuestos.json.
Salida:   ecostress_parcelas.csv — contrato del integrador (mensaje del 14-nov, 21:00): id, mes, et_mm_dia, n_escenas;
          columnas adicionales: zona, etc_modelo_mm, razon. Los mismos 12 meses que hls_mensual_parcelas.csv (2025-10 a 2026-09).
Uso:      python E1_ecostress_parcelas.py --dir data/reto --crudo data/raw/reto --unidad mm_dia

Reglas:
- Fecha del paso: la del tiempo solar local (UTC + longitud / 15 h); los pasos de estas zonas son de 7 a 17 h locales.
- Paso despejado = ETdaily finita, cloud = 0 y water = 0 (en estos archivos, todo paso con ETdaily tiene cloud = 0). et_mm_dia = mediana de los pasos despejados del mes (vacía si no
  hubo); n_escenas = número de pasos despejados del mes.
- Unidades: la guía de usuario de ECOSTRESS colección 2 (ECO_L1C-4_Grid_Tile_User_Guide_V2) dice en el texto que la ET
  «is upscaled to a daily ET estimate in millimeters per day and recorded in the L3T JET product as ETdaily», mientras que su
  Tabla 10 y AppEEARS dicen W/m². --unidad es obligatorio y el script se detiene si los valores no cuadran con la unidad
  declarada (mm/día: percentil 99 de los pasos despejados menor que 20; W/m²: mediana mayor que 30). Con estos datos
  (14-nov-2026): mediana 1.0–1.1 y percentil 99 3.7–4.0, máximo 5.8: cuadra con mm/día y no con W/m² (un flujo medio de
  1 W/m² sería casi nada de ET). ETinstUncertainty sí está en W/m² (instantánea, 20–45).
- etc_modelo_mm: mediana, en los mismos días de los pasos despejados, de la ETc del modelo = Kc del cultivo clasificado
  (A5: FAO-56, Tablas 11 y 12) × ETo de NASA POWER del día. Solo parcelas clasificadas y días dentro del ciclo del cultivo.
  razon = et_mm_dia / etc_modelo_mm. Es un contraste: ECOSTRESS mide la ET real de un día despejado a 70 m; la ETc de FAO-56
  es la de un cultivo sano, sin falta de agua, en condiciones estándar.
- Rótulo: «satellite ET at 70 m on clear days, not a field measurement».
"""
import collections
import csv
import datetime as dt
import glob
import math
import os
import statistics

import A5_demanda_plazo as A5
from comun import carpeta, registrar_fuentes

MESES = [f"{a}-{m:02d}" for a, m in [(2025, 10), (2025, 11), (2025, 12)] + [(2026, m) for m in range(1, 10)]]
ETO = {"delicias_saucillo": "eto_diaria.csv", "lazaro_cardenas": "eto_diaria_lazaro_cardenas.csv"}


def flotante(v):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return x if math.isfinite(x) else None


def kc_del_dia(cultivo, fecha):
    """Kc del modelo (A5) para el cultivo clasificado en esa fecha; None fuera del ciclo."""
    if cultivo not in A5.CULTIVOS:
        return None
    k = A5.CULTIVOS[cultivo]
    if "dias" not in k:                                   # alfalfa: constante todo el año
        return k["kc"][1]
    mes, dia = k["siembra"]
    for anio in (fecha.year - 1, fecha.year):
        ini = dt.date(anio, mes, dia)
        curva = A5.kc_curva(cultivo, ini, None)
        if fecha in curva:
            return curva[fecha]
    return None


def main():
    def extra(ap):
        ap.add_argument("--crudo", required=True)
        ap.add_argument("--unidad", required=True, choices=["mm_dia", "w_m2"])
    a = carpeta("E1: ECOSTRESS por parcela y mes", extra)
    if a.unidad != "mm_dia":
        raise SystemExit("Solo se entrega en mm/día; si ETdaily viene en W/m², la conversión necesita la duración del día "
                         "con la que se integró (ver docstring) y no se entrega sin confirmarla")
    A5.cargar_supuestos("supuestos.json")                 # Kc del nogal ajustado por cobertura (como en A5)
    pasos = []
    for ruta in sorted(glob.glob(os.path.join(a.crudo, "ecostress_pasos_*.csv"))):
        zona = os.path.basename(ruta)[len("ecostress_pasos_"):-4]
        for r in csv.DictReader(open(ruta)):
            utc = dt.datetime.strptime(r["Date"], "%Y-%m-%d %H:%M:%S UTC")
            local = utc + dt.timedelta(hours=float(r["Longitude"]) / 15)
            pasos.append({"id": r["ID"], "zona": zona, "fecha": local.date().isoformat(),
                          "et_diaria": r["ECO_L3T_JET_002_ETdaily"], "nube": r["ECO_L3T_JET_002_cloud"],
                          "agua": r["ECO_L3T_JET_002_water"]})
    if not pasos:
        raise SystemExit(f"Falta ecostress_pasos_<zona>.csv en {a.crudo}")
    despejados = [p for p in pasos if flotante(p["et_diaria"]) is not None and flotante(p["nube"]) == 0
                  and flotante(p["agua"]) == 0]
    vals = sorted(flotante(p["et_diaria"]) for p in despejados)
    p99 = vals[int(0.99 * (len(vals) - 1))]
    print(f"{len(pasos)} pasos; {len(despejados)} despejados; et_diaria despejada: mediana {statistics.median(vals):.2f}, p99 {p99:.2f}")
    if p99 >= 20:
        raise SystemExit("Los valores no parecen mm/día (percentil 99 de 20 o más): revisar la unidad antes de entregar")
    cultivo = {r["id"]: r["cultivo_actual"] for r in csv.DictReader(open("cultivos_parcelas.csv"))}
    eto = {z: {dt.date.fromisoformat(r["fecha"]): float(r["eto_mm"]) for r in csv.DictReader(open(f))} for z, f in ETO.items()}
    zona_de = {}
    por_mes = collections.defaultdict(list)
    for p in despejados:
        f = dt.date.fromisoformat(p["fecha"])
        zona_de[p["id"]] = p["zona"]
        kc = kc_del_dia(cultivo.get(p["id"], ""), f)
        etc = kc * eto[p["zona"]][f] if kc is not None and f in eto[p["zona"]] else None
        por_mes[(p["id"], f.strftime("%Y-%m"))].append((flotante(p["et_diaria"]), etc))
    for p in pasos:
        zona_de.setdefault(p["id"], p["zona"])
    filas = []
    for pid in sorted(zona_de):
        for mes in MESES:
            obs = por_mes.get((pid, mes), [])
            et = round(statistics.median(v for v, _ in obs), 2) if obs else ""
            etcs = [e for _, e in obs if e is not None]
            etc = round(statistics.median(etcs), 2) if etcs and len(etcs) == len(obs) else ""
            razon = round(et / etc, 2) if et != "" and etc not in ("", 0) else ""
            filas.append({"id": pid, "mes": mes, "et_mm_dia": et, "n_escenas": len(obs), "zona": zona_de[pid],
                          "etc_modelo_mm": etc, "razon": razon})
    with open("ecostress_parcelas.csv", "w", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)
    registrar_fuentes("E1", ["ecostress_parcelas.csv"],
                      "NASA ECOSTRESS ECO_L3T_JET.002 (ET diaria a 70 m, colección 2) vía AppEEARS (LP DAAC), muestra por puntos de las "
                      "solicitudes raiz_ecostress_<zona> del 14-nov-2026; pasos despejados (cloud = 0, water = 0); ETc del modelo "
                      "FAO-56 (A5) con ETo de NASA POWER; satellite ET at 70 m on clear days, not a field measurement",
                      "datos/colab/E0_ecostress_solicitud.py + navegador (AppEEARS) + datos/colab/E1_ecostress_parcelas.py")
    con = [f for f in filas if f["et_mm_dia"] != ""]
    print(f"{len(zona_de)} parcelas; {len(con)} parcela-mes con dato de {len(filas)}")
    por_cultivo = collections.defaultdict(list)
    for f in con:
        if f["razon"] != "":
            por_cultivo[cultivo.get(f["id"], "")].append(f["razon"])
    for c, r in sorted(por_cultivo.items()):
        print(f"  {c:16s} razón ECOSTRESS/ETc: mediana {statistics.median(r):.2f} en {len(r)} parcela-mes")


if __name__ == "__main__":
    main()
