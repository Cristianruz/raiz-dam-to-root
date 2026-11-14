# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Genera los datos SIMULADOS del contrato v4 (kit §2.2–2.5) a partir de
data/simulados.json y data/params.json.

Sirve para que la web arranque antes de que lleguen las entregas reales.
Aplica las mismas reglas que usará el motor real (B4 y X3.1) para que los
datos simulados sean coherentes entre sí: plazo restante, compromiso, estado
del plazo, bloque de zona y balance de La gota.

Uso:  python motor/simulados.py   (escribe web/data/parcelas.geojson,
                                    web/data/cubo.json, web/data/explicaciones.json)
"""
import json
import math
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
LLUVIAS = ("0", "-20")  # llaves del cubo (kit §2.3)


def leer_json(ruta):
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def escribir_json(ruta, datos):
    Path(ruta).parent.mkdir(parents=True, exist_ok=True)
    Path(ruta).write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def cuadrado(lat, lon, area_ha, este_m, norte_m):
    """Polígono cuadrado de area_ha centrado en (lat, lon) + desplazamiento en metros."""
    lado = math.sqrt(area_ha * 10000.0)               # m
    m_por_grado_lat = 111320.0                          # aproximación esférica
    m_por_grado_lon = 111320.0 * math.cos(math.radians(lat))
    clat = lat + norte_m / m_por_grado_lat
    clon = lon + este_m / m_por_grado_lon
    dlat = lado / 2 / m_por_grado_lat
    dlon = lado / 2 / m_por_grado_lon
    anillo = [[clon - dlon, clat - dlat], [clon + dlon, clat - dlat],
              [clon + dlon, clat + dlat], [clon - dlon, clat + dlat],
              [clon - dlon, clat - dlat]]
    return {"type": "Polygon", "coordinates": [[[round(x, 6), round(y, 6)] for x, y in anillo]]}


def plazo_de(params, clave):
    """Plazo {min, max} en años según la clave de params.plazo."""
    v = params["plazo"][clave]["valor"]
    return {"min": v["min"], "max": v["max"]} if isinstance(v, dict) else {"min": v, "max": v}


def estado_plazo(cultivo, edad, params, abstencion):
    """libre / por_vencer / comprometida / None (kit B4 paso 6)."""
    if abstencion:
        return None
    if cultivo == "nogal":
        return "comprometida"
    if cultivo == "alfalfa":
        umbral = params["plazo"]["alfalfa_por_vencer"]["valor"]
        if edad is not None and edad >= umbral:
            return "por_vencer"
        return "comprometida"  # sin memoria: comprometida, "age not available"
    return "libre"


def gota(area, l50, neta, conduccion, c_ret, ef_goteo):
    """Bloques de La gota (kit X3.1) en m³, con la lámina P50 de lluvia 0."""
    m3_millar = 1000.0
    llegan = l50 * m3_millar * area
    salen = llegan / conduccion if conduccion else 0.0
    et = neta * m3_millar * area
    retorno = c_ret * salen
    base = {
        "m3_salen_presa": salen, "m3_perdidas_canal": salen - llegan,
        "m3_llegan_parcela": llegan, "m3_consume_cultivo_et": et,
        "m3_regresan_acuifero": retorno, "m3_otras_perdidas": salen - et - retorno,
        "supuestos": ["SIMULATED: conduction efficiency = params mean; return coefficient applied to dam outflow"],
    }
    # Goteo con tope: misma ET, menos agua en parcela.
    llegan_g = (et / ef_goteo) if ef_goteo else 0.0
    salen_g = llegan_g / conduccion if conduccion else 0.0
    ret_g = c_ret * salen_g
    con_tope = {
        "m3_salen_presa": salen_g, "m3_perdidas_canal": salen_g - llegan_g,
        "m3_llegan_parcela": llegan_g, "m3_consume_cultivo_et": et,
        "m3_regresan_acuifero": ret_g, "m3_otras_perdidas": salen_g - et - ret_g,
        "supuestos": ["SIMULATED: drip efficiency is a mock value until P5 delivers supuestos.json"],
    }
    # Goteo sin tope: misma agua de presa, se riega más superficie (supuesto declarado).
    lamina_g = (neta / ef_goteo) if ef_goteo else 0.0
    area_total = (llegan / (lamina_g * m3_millar)) if lamina_g else 0.0
    et_s = neta * m3_millar * area_total
    ret_s = min(c_ret * salen, salen - et_s) if salen else 0.0
    sin_tope = {
        "m3_salen_presa": salen, "m3_perdidas_canal": salen - llegan,
        "m3_llegan_parcela": llegan, "m3_consume_cultivo_et": et_s,
        "m3_regresan_acuifero": ret_s, "m3_otras_perdidas": salen - et_s - ret_s,
        "supuestos": ["SIMULATED: water no longer released is reassigned to extra drip area with the same crop"],
    }
    tope = {
        "et_historica_m3": et, "et_goteo_sin_tope_m3": et_s,
        "cumple_sin_tope": et_s <= et,
        "base_historica": "SIMULATED: ET of the current irrigation method (gota.m3_consume_cultivo_et)",
    }
    redondeo = lambda b: {k: (round(v, 1) if isinstance(v, float) else v) for k, v in b.items()}
    return redondeo(base), redondeo(con_tope), redondeo(sin_tope), redondeo(tope)


def generar():
    params = leer_json(RAIZ / "data/params.json")
    sim = leer_json(RAIZ / "data/simulados.json")
    # Centro de las geometrías simuladas: centro del rectángulo de la zona piloto si ya está
    # definido; si no, el punto de clima del kit.
    bbox = params["zona_piloto"]["bbox"]["valor"]
    if bbox:
        centro = {"lon": (bbox[0] + bbox[2]) / 2, "lat": (bbox[1] + bbox[3]) / 2}
    else:
        centro = params["zona_piloto"]["punto_clima"]["valor"]
    conduccion = params["eficiencia"]["conduccion"]["valor"]["media"]
    c_ret = params["gota"]["c_retorno_superficial"]["valor"]
    ef_goteo = sim["eficiencia_goteo_mock"]
    anio_actual = params["memoria"]["anio_actual"]["valor"]

    features, cubo_parcelas, explicaciones = [], {}, {}
    for p in sim["parcelas"]:
        memoria = [{"anio": int(a), "estado": e} for a, e in sorted(p["memoria"].items())]
        edad = p["edad_perenne_anios"]
        props = {k: p[k] for k in ("id", "area_ha", "modulo", "ftw_confianza", "protagonista",
                                   "cultivo_actual", "prob_max", "acuerdo_metodos", "abstencion",
                                   "dias_suelo_desnudo_feb_abr", "ndvi_ultimo_mes",
                                   "dias_suelo_desnudo_mediana", "edad_perenne_anios")}
        props["memoria"] = memoria
        props["estado_plazo"] = estado_plazo(p["cultivo_actual"], edad, params, p["abstencion"])
        geom = cuadrado(centro["lat"], centro["lon"], p["area_ha"],
                        p["desplazamiento_m"]["este"], p["desplazamiento_m"]["norte"])
        features.append({"type": "Feature", "properties": props, "geometry": geom})

        opciones = []
        for o in sim["opciones"][p["id"]]:
            plazo = plazo_de(params, o["plazo_clave"])
            if o["descuenta_edad"] and edad is not None:
                restante = {"min": max(0, plazo["min"] - edad), "max": max(0, plazo["max"] - edad)}
                nota_edad = None
            else:
                restante = dict(plazo)
                nota_edad = "age not available" if (o["descuenta_edad"] and edad is None) else None
            if o["plazo_clave"] == "nogal_horizonte":
                nota_edad = "calculation horizon; orchards live longer"
            compromiso = {r: {"min": round(o["lamina"][r]["p50"] * restante["min"], 2),
                              "max": round(o["lamina"][r]["p50"] * restante["max"], 2)} for r in LLUVIAS}
            g, g_con, g_sin, tope = gota(p["area_ha"], o["lamina"]["0"]["p50"], o["neta_p50"],
                                         conduccion, c_ret, ef_goteo)
            llave = f"EXP_{p['id']}_{o['id']}"
            opciones.append({
                "id": o["id"], "nombre": o["nombre"], "secuencia": o["secuencia"],
                "agua": {"lamina_bruta": o["lamina"], "plazo_anios": plazo,
                         "plazo_restante": restante, "compromiso_millares_ha": compromiso,
                         "nota_plazo": nota_edad},
                "suelo": o["suelo"],
                "dinero": None,
                "semaforo": {"suelo": o["semaforo_suelo"], "dinero": "gris"},
                "meses_cultivo": o["meses_cultivo"],
                "filtros": o["filtros"],
                "advertir_si_rojo": o["advertir_si_rojo"],
                "preguntas_ref": llave,
                "gota": g, "gota_goteo_con_tope": g_con, "gota_goteo_sin_tope": g_sin,
                "tope_consumo": tope,
            })
            explicaciones[llave] = explicacion_simulada(o, plazo, restante)
        cubo_parcelas[p["id"]] = {"opciones": opciones}

    # Bloque zona (kit B4 paso 7)
    no_abst = [f["properties"] for f in features if not f["properties"]["abstencion"]]
    perennes = [x for x in no_abst if x["cultivo_actual"] in ("alfalfa", "nogal")]
    demanda = {}
    for r in LLUVIAS:
        demanda[r] = {}
        for q in ("p10", "p50", "p90"):
            demanda[r][q] = round(sum(
                x["area_ha"] * next(o for o in cubo_parcelas[x["id"]]["opciones"] if o["id"] == "ACTUAL")
                ["agua"]["lamina_bruta"][r][q] for x in perennes), 2)
    estados = [f["properties"]["estado_plazo"] for f in features]
    zona = {
        "nombre": "zona piloto",
        "superficie_total_ha": round(sum(f["properties"]["area_ha"] for f in features), 2),
        "superficie_clasificada_ha": round(sum(x["area_ha"] for x in no_abst), 2),
        "superficie_abstenida_ha": round(sum(f["properties"]["area_ha"] for f in features
                                             if f["properties"]["abstencion"]), 2),
        "superficie_perenne_ha": round(sum(x["area_ha"] for x in perennes), 2),
        "demanda_perenne_millares": demanda,
        "conteos": {"total": len(features), "libre": estados.count("libre"),
                    "por_vencer": estados.count("por_vencer"),
                    "comprometida": estados.count("comprometida"),
                    "abstenida": estados.count(None)},
    }

    distrito_blk, dotaciones_blk = bloques_distrito_dotaciones(params)
    distrito_blk["capas_disponibles"] = ["cultivos", "suelo_desnudo", "memoria_2025"]
    cubo = {
        "meta": {"version": "4.0", "generado": None, "mock": True,
                 "mock_campos": ["parcelas", "zona", "explicaciones", "geometria"],
                 "fuentes": ["data/params.json", "data/simulados.json"],
                 "notas": [sim["_nota"]]},
        "distrito": distrito_blk,
        "dotaciones": dotaciones_blk,
        "lluvia_pct": params["lluvia_pct"]["valor"],
        "zona": zona,
        "parcelas": cubo_parcelas,
    }
    geo = {"type": "FeatureCollection", "meta": {"mock": True, "anio_actual": anio_actual}, "features": features}
    expl = {"meta": {"mock": True, "dinamicos": ["d", "ha", "cobertura"],
                     "nota": "SIMULATED template texts; C3 replaces them"}, "explicaciones": explicaciones}

    escribir_json(RAIZ / "web/data/parcelas.geojson", geo)
    escribir_json(RAIZ / "web/data/cubo.json", cubo)
    escribir_json(RAIZ / "web/data/explicaciones.json", expl)
    return geo, cubo, expl


def bloques_distrito_dotaciones(params):
    """Bloques «distrito» y «dotaciones» del cubo (kit §2.3), copiados de params con su fuente.
    Los usan los simulados y el motor real (motor/b4_cubo.py)."""
    dz = params["dotaciones"]
    marcas = []
    for clave, nombre in (("como_2025", "Like 2025"), ("como_2026", "Like 2026"), ("anio_normal", "Normal year")):
        d = dz[clave]
        marcas.append({"id": clave, "nombre": nombre, "min": d["valor"]["min"], "max": d["valor"]["max"],
                       "valor": d["valor"]["valor"], "nota": d["nota"], "fuente": d["fuente"],
                       "fecha_consulta": d["fecha_consulta"], "etiqueta": d["etiqueta"]})
    distrito = params["distrito"]
    distrito_blk = {
        "boquilla": {"namo_hm3": distrito["namo_hm3"]["valor"], "fuente_namo": distrito["namo_hm3"]["fuente"],
                     "almacenamiento_hm3": distrito["almacenamiento_hm3"]["valor"],
                     "fecha_almacenamiento": distrito["almacenamiento_hm3"]["fecha"],
                     "fuente_almacenamiento": distrito["almacenamiento_hm3"]["fuente"]},
        "acuifero_0831": {"disponibilidad_hm3_anio": params["acuifero"]["disponibilidad_hm3_anio"]["valor"],
                          "fuente": params["acuifero"]["disponibilidad_hm3_anio"]["fuente"]},
        "capas_disponibles": [],
    }
    dotaciones_blk = {
        "unidad": "millares_por_ha",
        "equivalencia": params["unidades"]["millar"]["nota"],
        "deslizador": dz["deslizador"]["valor"],
        "marcas": marcas,
        "punto_medicion": f"{dz['punto_medicion']['valor']} {dz['punto_medicion']['etiqueta']}; {dz['punto_medicion']['nota']}",
    }
    return distrito_blk, dotaciones_blk


def explicacion_simulada(o, plazo, restante):
    """Cinco respuestas del reto con marcadores, SIN dígitos (kit C3)."""
    l = o["lamina"]["0"]
    return {
        "textos": {
            "por_que": "This option asks for {{f1}} thousand m³ per hectare per year and commits water for {{f2}} to {{f3}} years. With your allocation of {{d}} thousand m³/ha it covers {{cobertura}} of the need: enough for {{ha}} hectares.",
            "evidencia": "Water need from the FAO Penman–Monteith method with NASA POWER climate (range {{f4}} to {{f5}} thousand m³/ha). Field history from NASA HLS greenness. SIMULATED text until the explanation step runs.",
            "beneficios": "Shows how many years this choice ties up water before you plant, next to the dam allocation.",
            "que_no_sabemos": "Field efficiency in this district has not been measured; the band shows that uncertainty. Field boundaries are estimated.",
            "riesgos": "Check with your module technician: allocation, measuring point and local soil conditions can change the answer.",
        },
        "valores": {"f1": l["p50"], "f2": plazo["min"], "f3": plazo["max"], "f4": l["p10"], "f5": l["p90"]},
    }


if __name__ == "__main__":
    g, c, e = generar()
    print(f"Simulados: {len(g['features'])} parcelas, {sum(len(v['opciones']) for v in c['parcelas'].values())} opciones, {len(e['explicaciones'])} explicaciones")
