# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""E1 · ECOSTRESS por parcela y mes, contra la ETc del modelo (FAO-56) en los mismos días.

Entradas: data/raw/reto/ecostress_pasos_<zona>.csv — la salida de AppEEARS tal cual (archivo
          raiz-ecostress-<zona>-ECO-L3T-JET-002-results.csv de las solicitudes de E0, leído el 14-nov-2026 en el navegador de
          Cristian con su sesión y subido sin cambios; sha256 igual al de la lista del paquete de AppEEARS): un renglón por
          parcela y escena de ECOSTRESS, columnas Category, ID, Latitude, Longitude, Date («AAAA-MM-DD hh:mm:ss UTC»),
          ECOSTRESS_Tile, ECO_L3T_JET_002_ETdaily, ECO_L3T_JET_002_ETinstUncertainty, ECO_L3T_JET_002_cloud,
          ECO_L3T_JET_002_water.
          En --dir: cultivos_parcelas.csv (A4), eto_diaria.csv y eto_diaria_lazaro_cardenas.csv (A1),
          hls_mensual_parcelas.csv (A3) y supuestos.json.
Salida:   ecostress_parcelas.csv — contrato del integrador (mensaje del 14-nov, 21:00): id, mes, et_mm_dia, n_escenas;
          columnas adicionales: zona, etc_modelo_mm, razon y (desde el 15-nov) et_min_mm_dia, et_max_mm_dia e
          incertidumbre_w_m2. Los mismos 12 meses que hls_mensual_parcelas.csv (2025-10 a 2026-09).
Uso:      python E1_ecostress_parcelas.py --dir data/reto --crudo data/raw/reto --unidad mm_dia

Reglas (las del 15-nov-2026 atienden la revisión independiente docs/revisiones/2026-11-15_ecostress.md, D1, D2, D5 y D9):
- Fecha y hora del paso: tiempo solar medio local (UTC + longitud / 15 h), como el código de JPL. Las escenas de estas
  zonas van de las 6.5 a las 16.7 h locales.
- Paso despejado = ETdaily finita, cloud = 0 y water = 0. El producto ya deja vacío el píxel con nube, así que esto solo no
  quita una escena con media zona nublada; por eso las dos reglas siguientes.
- Nube en la zona (D2): se deja fuera la escena de una zona si más de supuestos.ecostress_nube_zona_max de sus puntos tienen
  cloud = 1 (20-may y 2-jul-2026: del 49 al 99 %; las demás escenas con dato, 4 % o menos).
- Hora del paso (D1): se dejan fuera los pasos con x fuera de supuestos.ecostress_fraccion_luz {min, max}, donde x es la
  fracción de las horas de luz ya transcurrida al momento del paso (0 al salir el sol, 1 al ponerse). El producto lleva el
  flujo del instante a un total del día con Rn_diaria = 1.6 · Rn / (π · sen(π · x)) (JPL, ECOv002-L3T-L4T-JET,
  ECOv002_L3T_L4T_JET.py, daily_Rn_integration_verma); cerca de la salida o de la puesta del sol multiplica un flujo chico
  y ruidoso por más de 2.2 veces lo que al mediodía. La salida del sol y las horas de luz se calculan igual que en ese
  código (FLiES/daylight_hours.py: ángulo del día, declinación de Spencer, ángulo horario de la salida; sin ecuación del
  tiempo).
- Un sobrevuelo, un valor (D5): las escenas de una misma parcela separadas por menos de supuestos.ecostress_sobrevuelo_seg
  segundos son el mismo sobrevuelo (en estos archivos, tres pares a 52 s: 16-dic-2025, 26-feb y 26-ago-2026); se
  promedian y cuentan una vez.
- et_mm_dia = mediana de los sobrevuelos del mes que pasan los filtros (vacía si no hubo); n_escenas = cuántos sobrevuelos;
  et_min_mm_dia y et_max_mm_dia = el menor y el mayor de esos sobrevuelos; incertidumbre_w_m2 = mediana de
  ETinstUncertainty de esos sobrevuelos (W/m²: desviación estándar entre los cuatro modelos del producto, PT-JPL-SM, BESS,
  MOD16 y STIC, en el instante del paso; en todos los pasos con dato va de 29 a 231, percentiles 10 y 90, con mediana 87 y
  máximo 431).
- Unidades: la guía de usuario de ECOSTRESS colección 2 (ECO_L1C-4_Grid_Tile_User_Guide_V2) dice en el texto que la ET
  «is upscaled to a daily ET estimate in millimeters per day and recorded in the L3T JET product as ETdaily», y el código
  de JPL la escribe en kg/m² por día (LE_diaria · segundos de luz / calor latente de vaporización), que son mm/día; la
  Tabla 10 de la guía dice W/m². --unidad es obligatorio y el script se detiene si los valores no cuadran con la unidad
  declarada (mm/día: percentil 99 de los pasos despejados menor que 20). ETdaily integra las horas de luz, no 24 horas.
- etc_modelo_mm: mediana, en los mismos días de los sobrevuelos usados, de la ETc del modelo = Kc del cultivo clasificado
  (A5: FAO-56, Tablas 11 y 12) × ETo de NASA POWER del día. Solo parcelas clasificadas, días dentro del ciclo del cultivo
  y, en los cultivos anuales, meses en que la parcela se ve verde en HLS (NDVI ≥ supuestos.umbral_verde_ndvi; D9: el
  calendario del modelo es un supuesto y el cereal sembrado el 1-dic se ve sin cultivo hasta febrero).
  razon = et_mm_dia / etc_modelo_mm. Son cantidades distintas: una estimación satelital de las horas de luz de un día
  despejado a 70 m frente a la demanda de 24 horas de un cultivo sano, sin falta de agua, en condiciones estándar. No es
  una validación ni un déficit medido.
- Rótulo: «satellite estimate at 70 m on clear days, not a field measurement».
"""
import collections
import csv
import datetime as dt
import glob
import json
import math
import os
import statistics

import A5_demanda_plazo as A5
from comun import carpeta, registrar_fuentes

MESES = [f"{a}-{m:02d}" for a, m in [(2025, 10), (2025, 11), (2025, 12)] + [(2026, m) for m in range(1, 10)]]
ETO = {"delicias_saucillo": "eto_diaria.csv", "lazaro_cardenas": "eto_diaria_lazaro_cardenas.csv"}
PERENNES = ("alfalfa", "nogal")


def flotante(v):
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return x if math.isfinite(x) else None


def fraccion_luz(utc, lat, lon):
    """x = fracción de las horas de luz transcurrida al momento del paso, como en el código de JPL
    (FLiES/daylight_hours.py y daily_Rn_integration_verma): hora local = UTC + lon/15; salida del sol = 12 − SHA/15;
    horas de luz = 2·SHA/15; SHA de la declinación de Spencer y la latitud."""
    hora = utc.hour + utc.minute / 60 + utc.second / 3600 + lon / 15
    dia = 2 * math.pi * (utc.timetuple().tm_yday - 1) / 365
    dec = (0.006918 - 0.399912 * math.cos(dia) + 0.070257 * math.sin(dia) - 0.006758 * math.cos(2 * dia)
           + 0.000907 * math.sin(2 * dia) - 0.002697 * math.cos(3 * dia) + 0.00148 * math.sin(3 * dia))
    c = -math.tan(math.radians(lat)) * math.tan(dec)
    sha = 0.0 if c >= 1 else 180.0 if c <= -1 else math.degrees(math.acos(c))
    salida, luz = 12.0 - sha / 15.0, 2.0 * sha / 15.0
    return (hora - salida) / luz if luz > 0 else None


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
    sup = json.load(open("supuestos.json"))
    for k in ("ecostress_sobrevuelo_seg", "ecostress_fraccion_luz", "ecostress_nube_zona_max", "umbral_verde_ndvi"):
        if k not in sup:
            raise SystemExit(f"Falta '{k}' en supuestos.json")
    SOBREVUELO_S = sup["ecostress_sobrevuelo_seg"]["valor"]
    X_MIN, X_MAX = sup["ecostress_fraccion_luz"]["min"], sup["ecostress_fraccion_luz"]["max"]
    NUBE_MAX = sup["ecostress_nube_zona_max"]["valor"]
    VERDE = sup["umbral_verde_ndvi"]["valor"]

    pasos = []
    for ruta in sorted(glob.glob(os.path.join(a.crudo, "ecostress_pasos_*.csv"))):
        zona = os.path.basename(ruta)[len("ecostress_pasos_"):-4]
        for r in csv.DictReader(open(ruta)):
            utc = dt.datetime.strptime(r["Date"], "%Y-%m-%d %H:%M:%S UTC")
            lat, lon = float(r["Latitude"]), float(r["Longitude"])
            local = utc + dt.timedelta(hours=lon / 15)
            pasos.append({"id": r["ID"], "zona": zona, "utc": utc, "fecha": local.date(), "x": fraccion_luz(utc, lat, lon),
                          "et": flotante(r["ECO_L3T_JET_002_ETdaily"]), "inc": flotante(r["ECO_L3T_JET_002_ETinstUncertainty"]),
                          "nube": flotante(r["ECO_L3T_JET_002_cloud"]), "agua": flotante(r["ECO_L3T_JET_002_water"])})
    if not pasos:
        raise SystemExit(f"Falta ecostress_pasos_<zona>.csv en {a.crudo}")

    # Nube en la zona, por escena (D2)
    por_escena = collections.defaultdict(lambda: [0, 0])
    for p in pasos:
        c = por_escena[(p["zona"], p["utc"])]
        c[0] += 1
        c[1] += p["nube"] == 1
    nubladas = {k for k, (n, nub) in por_escena.items() if n and nub / n > NUBE_MAX}
    despejados = [p for p in pasos if p["et"] is not None and p["nube"] == 0 and p["agua"] == 0]
    vals = sorted(p["et"] for p in despejados)
    p99 = vals[int(0.99 * (len(vals) - 1))]
    if p99 >= 20:
        raise SystemExit("Los valores no parecen mm/día (percentil 99 de 20 o más): revisar la unidad antes de entregar")
    usados = [p for p in despejados if (p["zona"], p["utc"]) not in nubladas and p["x"] is not None
              and X_MIN <= p["x"] <= X_MAX]
    fuera_nube = sum(1 for p in despejados if (p["zona"], p["utc"]) in nubladas)
    fuera_hora = sum(1 for p in despejados if (p["zona"], p["utc"]) not in nubladas
                     and not (p["x"] is not None and X_MIN <= p["x"] <= X_MAX))
    print(f"{len(pasos)} renglones; {len(despejados)} pasos despejados (mediana {statistics.median(vals):.2f}, p99 {p99:.2f}); "
          f"fuera por nube en la zona {fuera_nube}, por la hora {fuera_hora}; usados {len(usados)}")
    print("Escenas nubladas en la zona:", sorted(f"{z} {t:%Y-%m-%d %H:%M}" for z, t in nubladas))

    # Un sobrevuelo, un valor (D5): agrupa por parcela las escenas a menos de SOBREVUELO_S segundos
    por_parcela = collections.defaultdict(list)
    for p in usados:
        por_parcela[p["id"]].append(p)
    sobrevuelos = []
    juntadas = 0
    for pid, ps in por_parcela.items():
        ps.sort(key=lambda p: p["utc"])
        grupo = [ps[0]]
        for p in ps[1:]:
            if (p["utc"] - grupo[-1]["utc"]).total_seconds() < SOBREVUELO_S:
                grupo.append(p)
                continue
            sobrevuelos.append(grupo)
            grupo = [p]
        sobrevuelos.append(grupo)
    filas_sv = []
    for g in sobrevuelos:
        juntadas += len(g) > 1
        incs = [p["inc"] for p in g if p["inc"] is not None]
        filas_sv.append({"id": g[0]["id"], "zona": g[0]["zona"], "fecha": g[0]["fecha"],
                         "et": sum(p["et"] for p in g) / len(g), "inc": sum(incs) / len(incs) if incs else None})
    print(f"{len(filas_sv)} sobrevuelos por parcela; {juntadas} juntan dos escenas del mismo sobrevuelo")

    cultivo = {r["id"]: r["cultivo_actual"] for r in csv.DictReader(open("cultivos_parcelas.csv"))}
    ndvi = {(r["id"], r["mes"]): flotante(r["mediana"]) for r in csv.DictReader(open("hls_mensual_parcelas.csv"))
            if r["banda"] == "ndvi"}
    eto = {z: {dt.date.fromisoformat(r["fecha"]): float(r["eto_mm"]) for r in csv.DictReader(open(f))} for z, f in ETO.items()}
    zona_de = {p["id"]: p["zona"] for p in pasos}
    por_mes = collections.defaultdict(list)
    for s in filas_sv:
        f = s["fecha"]
        mes = f.strftime("%Y-%m")
        c = cultivo.get(s["id"], "")
        kc = kc_del_dia(c, f)
        verde = ndvi.get((s["id"], mes))
        if kc is not None and c not in PERENNES and not (verde is not None and verde >= VERDE):
            kc = None                                     # cultivo anual que HLS no ve verde ese mes (D9)
        etc = kc * eto[s["zona"]][f] if kc is not None and f in eto[s["zona"]] else None
        por_mes[(s["id"], mes)].append((s["et"], etc, s["inc"]))

    r2 = lambda v: round(v, 2)                            # noqa: E731
    filas = []
    for pid in sorted(zona_de):
        for mes in MESES:
            obs = por_mes.get((pid, mes), [])
            ets = [v for v, _, _ in obs]
            et = r2(statistics.median(ets)) if obs else ""
            etcs = [e for _, e, _ in obs if e is not None]
            etc = r2(statistics.median(etcs)) if etcs and len(etcs) == len(obs) else ""
            razon = round(et / etc, 2) if et != "" and etc not in ("", 0) else ""
            incs = [i for _, _, i in obs if i is not None]
            filas.append({"id": pid, "mes": mes, "et_mm_dia": et, "n_escenas": len(obs), "zona": zona_de[pid],
                          "etc_modelo_mm": etc, "razon": razon,
                          "et_min_mm_dia": r2(min(ets)) if obs else "", "et_max_mm_dia": r2(max(ets)) if obs else "",
                          "incertidumbre_w_m2": round(statistics.median(incs)) if incs else ""})
    with open("ecostress_parcelas.csv", "w", newline="") as fo:
        w = csv.DictWriter(fo, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)
    registrar_fuentes("E1", ["ecostress_parcelas.csv"],
                      "NASA ECOSTRESS ECO_L3T_JET.002 (ET diaria a 70 m, colección 2) vía AppEEARS (LP DAAC), muestra por puntos de las "
                      "solicitudes raiz_ecostress_<zona> del 14-nov-2026; sobrevuelos despejados (cloud = 0, water = 0, zona con "
                      "nube hasta ecostress_nube_zona_max, x dentro de ecostress_fraccion_luz, escenas del mismo sobrevuelo "
                      "promediadas); ETc del modelo FAO-56 (A5) con ETo de NASA POWER; satellite estimate at 70 m on clear days, "
                      "not a field measurement",
                      "datos/colab/E0_ecostress_solicitud.py + navegador (AppEEARS) + datos/colab/E1_ecostress_parcelas.py")
    con = [f for f in filas if f["et_mm_dia"] != ""]
    print(f"{len(zona_de)} parcelas; {len(con)} parcela-mes con dato de {len(filas)}")
    print("  por mes:", dict(collections.Counter(f["mes"] for f in con)))
    print("  sobrevuelos por valor:", dict(sorted(collections.Counter(f["n_escenas"] for f in con).items())))
    por_cultivo = collections.defaultdict(list)
    for f in con:
        if f["razon"] != "":
            por_cultivo[cultivo.get(f["id"], "")].append(f["razon"])
    for c, r in sorted(por_cultivo.items()):
        print(f"  {c:16s} razón ECOSTRESS/ETc: mediana {statistics.median(r):.2f} en {len(r)} parcela-mes")


if __name__ == "__main__":
    main()
