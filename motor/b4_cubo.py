# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""B4 + X3.1 · Ensambla el cubo v4 con los datos REALES de data/processed (kit B4 y X3.1).

Entradas (data/processed, ya validadas por motor/ensamblar.py):
  obligatorias: parcelas_base.geojson (B1), cultivos_parcelas.csv (A4), rotaciones.json (A5)
  opcionales:   memoria_parcelas.csv y memoria_resumen.csv (A3-M), suelo_desnudo.csv (A3),
                relieve_parcelas.csv (A9), demanda_cultivos.csv (A5)
  y además:     data/params.json (constantes con fuente) y data/opciones_b4.json (opciones por cultivo).
Salidas: web/data/parcelas.geojson, web/data/cubo.json y web/data/explicaciones.json (contrato §2.2–2.5).

Reglas (kit B4): la web calcula cobertura, hectáreas y semáforo de agua; aquí solo se precalcula
lámina por variante de lluvia, plazo, plazo restante, compromiso, estado del plazo, bloque de zona,
semáforo de suelo y La gota. Ninguna cifra se escribe a mano: todo sale de las entradas.
Si falta una entrada obligatoria, no se escribe nada y se informa (los simulados siguen vigentes).

Uso:  python motor/b4_cubo.py [--processed data/processed] [--web web/data]
"""
import argparse
import csv
import datetime as dt
import json
import statistics
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # para importar simulados.py

RAIZ = Path(__file__).resolve().parent.parent
LLUVIAS = ("0", "-20")
M3_POR_MILLAR_HA = None  # se lee de params (unidades.millar) en construir()
OBLIGATORIAS = ("parcelas_base.geojson", "cultivos_parcelas.csv", "rotaciones.json")
ANIO_VENTANA = 2026  # año no bisiesto de referencia para contar días; solo define el calendario


def leer_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def leer_csv(p):
    with open(p, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def num(v):
    """Texto de CSV -> float o None (vacío, NaN o None)."""
    if v is None:
        return None
    s = str(v).strip()
    if s == "" or s.lower() in ("nan", "none", "null"):
        return None
    return float(s)


def entero(v):
    x = num(v)
    return None if x is None else int(round(x))


def booleano(v):
    return str(v).strip().lower() in ("true", "1", "sí", "si", "yes")


# ---------------------------------------------------------------------------
# Calendario de cultivo (para meses con cultivo y días de suelo desnudo ESTIMADOS)
# ---------------------------------------------------------------------------
def dias_con_cultivo(cultivos_def, secuencia):
    """Conjunto de días del año (1..365) con cultivo en pie según siembra y etapas FAO de A5.
    Perenne = todo el año. Sin calendario declarado = None (no se estima)."""
    dias = set()
    for c in secuencia:
        d = cultivos_def.get(c)
        if d is None:
            return None
        if d.get("perenne") and not d.get("siembra"):
            return set(range(1, 366))
        if not d.get("siembra") or not d.get("dias"):
            return None
        mes, dia = d["siembra"]
        ini = dt.date(ANIO_VENTANA, mes, dia).timetuple().tm_yday
        largo = int(sum(d["dias"]))
        for k in range(largo):
            dias.add(((ini - 1 + k) % 365) + 1)
    return dias


def meses_cultivo(dias):
    if dias is None:
        return None
    meses = []
    for m in range(1, 13):
        ini = dt.date(ANIO_VENTANA, m, 1).timetuple().tm_yday
        fin = (dt.date(ANIO_VENTANA, m + 1, 1).timetuple().tm_yday - 1) if m < 12 else 365
        meses.append(1 if any(d in dias for d in range(ini, fin + 1)) else 0)
    return meses


def dias_desnudo_ventana(dias, params):
    """Días de la ventana de suelo desnudo (params.suelo.ventana_desnudo) SIN cultivo en pie."""
    if dias is None:
        return None
    v = params["suelo"]["ventana_desnudo"]["valor"]
    mi, di = (int(x) for x in v["inicio"].split("-"))
    mf, df = (int(x) for x in v["fin"].split("-"))
    a = dt.date(ANIO_VENTANA, mi, di).timetuple().tm_yday
    b = dt.date(ANIO_VENTANA, mf, df).timetuple().tm_yday
    return sum(1 for d in range(a, b + 1) if d not in dias)


# ---------------------------------------------------------------------------
# Plazo, estado y La gota
# ---------------------------------------------------------------------------
def plazo_params(params, clave):
    mapa = {"alfalfa": "alfalfa", "nogal": "nogal_horizonte", "anual": "anual"}
    v = params["plazo"][mapa[clave]]["valor"]
    return {"min": v["min"], "max": v["max"]} if isinstance(v, dict) else {"min": v, "max": v}


def estado_plazo(cultivo, edad, abstencion, params):
    if abstencion:
        return None
    if cultivo == "nogal":
        return "comprometida"
    if cultivo == "alfalfa":
        umbral = params["plazo"]["alfalfa_por_vencer"]["valor"]
        return "por_vencer" if (edad is not None and edad >= umbral) else "comprometida"
    return "libre"


def bloque_gota(area_ha, l50_millares, neta_mm, params, m3_millar):
    """X3.1 con la lámina P50 de lluvia 0. Balance: ET + acuífero + otras = presa."""
    conduccion = params["eficiencia"]["conduccion"]["valor"]["media"]
    c_ret = params["gota"]["c_retorno_superficial"]["valor"]
    mm_a_m3_ha = m3_millar / params["unidades"]["millar"]["valor"]["lamina_mm"]
    llegan = l50_millares * m3_millar * area_ha
    salen = llegan / conduccion
    et = (neta_mm or 0) * mm_a_m3_ha * area_ha
    ret = c_ret * salen
    otras = salen - et - ret
    if otras < -1e-6:
        raise ValueError(f"La gota no cierra (otras pérdidas negativas: {otras:.1f} m³); revise láminas y neta")
    r = lambda x: round(x, 1)
    return {
        "m3_salen_presa": r(salen), "m3_perdidas_canal": r(salen - llegan), "m3_llegan_parcela": r(llegan),
        "m3_consume_cultivo_et": r(et), "m3_regresan_acuifero": r(ret), "m3_otras_perdidas": r(max(otras, 0.0)),
        "supuestos": [
            f"Conduction efficiency: params.eficiencia.conduccion (mean; {params['eficiencia']['conduccion']['fuente']})",
            f"Return coefficient applied to dam outflow: params.gota.c_retorno_superficial ({params['gota']['c_retorno_superficial']['fuente']})",
            "Crop consumption = net irrigation requirement (ETc − effective rain) from A5",
        ],
    }


# ---------------------------------------------------------------------------
# Construcción
# ---------------------------------------------------------------------------
def construir(processed=RAIZ / "data/processed", web=RAIZ / "web/data", params_ruta=RAIZ / "data/params.json",
              opciones_ruta=RAIZ / "data/opciones_b4.json", escribir=True):
    processed, web = Path(processed), Path(web)
    faltan = [f for f in OBLIGATORIAS if not (processed / f).exists()]
    if faltan:
        return {"ejecutado": False, "motivo": f"faltan entradas obligatorias en {processed}: {faltan}"}

    params = leer_json(params_ruta)
    cfg = leer_json(opciones_ruta)
    m3_millar = params["unidades"]["millar"]["valor"]["m3_por_ha"]
    avisos = []

    base = leer_json(processed / "parcelas_base.geojson")
    cult = {r["id"]: r for r in leer_csv(processed / "cultivos_parcelas.csv")}
    rot = leer_json(processed / "rotaciones.json")
    rotaciones = {r["id"]: r for r in rot["rotaciones"]}
    cultivos_def = rot.get("cultivos", {})
    demanda = {}
    if (processed / "demanda_cultivos.csv").exists():
        for r in leer_csv(processed / "demanda_cultivos.csv"):
            demanda.setdefault(r["cultivo"], {})[str(int(float(r["lluvia_pct"])))] = r
    memoria = {}
    if (processed / "memoria_parcelas.csv").exists():
        for r in leer_csv(processed / "memoria_parcelas.csv"):
            memoria.setdefault(r["id"], []).append({"anio": int(float(r["anio_agricola"])), "estado": r["estado"]})
    resumen = {r["id"]: r for r in leer_csv(processed / "memoria_resumen.csv")} if (processed / "memoria_resumen.csv").exists() else {}
    suelo = {r["id"]: r for r in leer_csv(processed / "suelo_desnudo.csv")} if (processed / "suelo_desnudo.csv").exists() else {}
    relieve = {r["id"]: r for r in leer_csv(processed / "relieve_parcelas.csv")} if (processed / "relieve_parcelas.csv").exists() else {}
    if not memoria:
        avisos.append("Sin memoria (A3-M): edad y memoria quedan en null; toda alfalfa = comprometida («age not available»)")

    # Mediana de la zona de días de suelo desnudo medidos: referencia del semáforo de suelo de la opción ACTUAL.
    medidos = [entero(r.get("dias_suelo_desnudo_mediana")) for r in resumen.values()]
    medidos = [x for x in medidos if x is not None]
    mediana_zona = statistics.median(medidos) if medidos else None

    def opcion_desde(rot_id, cultivo_actual):
        """Devuelve (secuencia, plazo_clave, lamina{r:{p10,p50,p90}}, neta_mm_p50) o None."""
        if rot_id in rotaciones:
            r = rotaciones[rot_id]
            lam = {k: {q: r["lamina_bruta_millares"][k][q] for q in ("p10", "p50", "p90")} for k in LLUVIAS}
            neta = r["lamina_bruta_millares"]["0"].get("neta_mm_p50")
            sec = r["cultivos"] or ["descanso"]
            if r.get("plazo_anios") and r.get("plazo") in ("alfalfa", "nogal", "anual"):
                esperado = plazo_params(params, r["plazo"])
                if {"min": r["plazo_anios"]["min"], "max": r["plazo_anios"]["max"]} != esperado:
                    avisos.append(f"rotaciones.json {rot_id}: plazo_anios {r['plazo_anios']} ≠ params {esperado}; se usa params")
            return sec, r.get("plazo", "anual"), lam, neta
        if rot_id in demanda:  # cultivo suelto sin rotación (p. ej. cereal_invierno)
            d = demanda[rot_id]
            lam = {k: {"p10": num(d[k]["bruta_millares_p10"]), "p50": num(d[k]["bruta_millares_p50"]),
                       "p90": num(d[k]["bruta_millares_p90"])} for k in LLUVIAS}
            return [rot_id], "anual", lam, num(d["0"]["neta_mm_p50"])
        return None

    features, cubo_parcelas, usadas = [], {}, set()
    for f in base["features"]:
        pb = f["properties"]
        pid = pb["id"]
        c = cult.get(pid)
        if c is None:
            avisos.append(f"{pid}: sin fila en cultivos_parcelas.csv; se marca sin_clasificar y abstenida")
        cultivo = (c or {}).get("cultivo_actual") or "sin_clasificar"
        abst = booleano((c or {}).get("abstencion", True)) if c else True
        edad = entero((c or {}).get("edad_perenne_anios")) if not abst else None
        if cultivo not in ("alfalfa", "nogal"):
            edad = None
        acuerdo = (c or {}).get("acuerdo_metodos") or "1/1"
        acuerdo = "1/1" if acuerdo.startswith("1/1") else acuerdo
        mem = sorted(memoria.get(pid, []), key=lambda m: m["anio"]) or None
        s = suelo.get(pid, {})
        rr = resumen.get(pid, {})
        props = {
            "id": pid, "area_ha": round(float(pb["area_ha"]), 2), "modulo": pb.get("modulo"),
            "ftw_confianza": pb.get("ftw_confianza"), "protagonista": bool(pb.get("protagonista", False)),
            "cultivo_actual": cultivo, "prob_max": num((c or {}).get("prob_max")), "acuerdo_metodos": acuerdo,
            "abstencion": abst,
            "dias_suelo_desnudo_feb_abr": entero(s.get("dias_suelo_desnudo_feb_abr")),
            "ndvi_ultimo_mes": num(s.get("ndvi_ultimo_mes")),
            "memoria": mem,
            "dias_suelo_desnudo_mediana": entero(rr.get("dias_suelo_desnudo_mediana")),
            "edad_perenne_anios": edad,
            "estado_plazo": estado_plazo(cultivo, edad, abst, params),
        }
        if pid in relieve:
            r = relieve[pid]
            props["relieve"] = {"pendiente_media_pct": num(r["pendiente_media_pct"]),
                                "aportacion_externa_ha": num(r["aportacion_externa_ha"]),
                                "frac_depresion": num(r["frac_depresion"])}
        features.append({"type": "Feature", "properties": props, "geometry": f["geometry"]})

        opciones = []
        if not abst and cultivo in cfg["actual"]:
            ids = [cfg["actual"][cultivo]] + cfg["alternativas"].get(cultivo, [])
            dias_actual = None
            for k, rot_id in enumerate(ids):
                o = opcion_desde(rot_id, cultivo)
                if o is None:
                    avisos.append(f"{pid}: la opción {rot_id} no está en rotaciones.json ni en demanda_cultivos.csv; se omite")
                    continue
                sec, plazo_clave, lam, neta = o
                es_actual = (k == 0)
                plazo = plazo_params(params, plazo_clave)
                nota = None
                if plazo_clave == "nogal":
                    restante, nota = dict(plazo), "calculation horizon; orchards live longer"
                elif es_actual and plazo_clave == "alfalfa":
                    if edad is None:
                        restante, nota = dict(plazo), "age not available"
                    else:
                        restante = {"min": max(0, plazo["min"] - edad), "max": max(0, plazo["max"] - edad)}
                else:
                    restante = dict(plazo)
                compromiso = {r: {"min": round(lam[r]["p50"] * restante["min"], 2),
                                  "max": round(lam[r]["p50"] * restante["max"], 2)} for r in LLUVIAS}
                dias = dias_con_cultivo(cultivos_def, [x for x in sec if x != "descanso"]) if sec != ["descanso"] else None
                if es_actual:
                    dd = props["dias_suelo_desnudo_mediana"]
                    if dd is None:
                        dd = props["dias_suelo_desnudo_feb_abr"]
                    origen = "medido"
                    if dd is None:
                        dd, origen = dias_desnudo_ventana(dias, params), "estimado"
                    dias_actual = dd
                    if mediana_zona is None or dd is None:
                        sem_suelo = "gris"
                    else:
                        sem_suelo = "verde" if dd < mediana_zona else ("ambar" if dd == mediana_zona else "rojo")
                else:
                    dd, origen = dias_desnudo_ventana(dias, params), "estimado"
                    if dd is None or dias_actual is None:
                        sem_suelo = "gris"
                    else:
                        sem_suelo = "verde" if dd < dias_actual else ("ambar" if dd == dias_actual else "rojo")
                rot_ref = cfg["actual"][cultivo] if es_actual else rot_id
                nombre_en = cfg["nombres_en"].get(rot_ref, rot_ref)
                llave = f"EXP_ZONA_{rot_ref}"
                usadas.add((rot_ref, plazo_clave))
                opciones.append({
                    "id": "ACTUAL" if es_actual else rot_id,
                    "nombre": (f"Current rotation: {nombre_en}" if es_actual else nombre_en),
                    "secuencia": sec,
                    "agua": {"lamina_bruta": lam, "plazo_anios": plazo, "plazo_restante": restante,
                             "compromiso_millares_ha": compromiso, "nota_plazo": nota},
                    "suelo": {"dias_desnudo": dd, "dias_desnudo_origen": origen,
                              "leguminosa": "alfalfa" in sec,
                              "ruptura_plagas": (not es_actual) and set(sec) != set(ids_secuencia(cfg, cultivo, opcion_desde)),
                              "riesgo_salinidad": None},
                    "dinero": None,
                    "semaforo": {"suelo": sem_suelo, "dinero": "gris"},
                    "meses_cultivo": meses_cultivo(dias) if dias is not None else [0] * 12,
                    "filtros": [],
                    "advertir_si_rojo": (not es_actual) and ("alfalfa" in sec) and cultivo != "alfalfa",
                    "preguntas_ref": llave,
                    "gota": bloque_gota(props["area_ha"], lam["0"]["p50"], neta, params, m3_millar),
                    "gota_goteo_con_tope": None, "gota_goteo_sin_tope": None, "tope_consumo": None,
                })
        cubo_parcelas[pid] = {"opciones": opciones}

    # Bloque zona (kit B4 paso 7). Abstenidas: no suman a perennes; el indicador es un mínimo.
    props_all = [f["properties"] for f in features]
    no_abst = [p for p in props_all if not p["abstencion"]]
    perennes = [p for p in no_abst if p["cultivo_actual"] in ("alfalfa", "nogal") and cubo_parcelas[p["id"]]["opciones"]]
    demanda_zona = {r: {q: round(sum(p["area_ha"] * cubo_parcelas[p["id"]]["opciones"][0]["agua"]["lamina_bruta"][r][q]
                                     for p in perennes), 2) for q in ("p10", "p50", "p90")} for r in LLUVIAS}
    estados = [p["estado_plazo"] for p in props_all]
    zona = {
        "nombre": "zona piloto",
        "superficie_total_ha": round(sum(p["area_ha"] for p in props_all), 2),
        "superficie_clasificada_ha": round(sum(p["area_ha"] for p in no_abst), 2),
        "superficie_abstenida_ha": round(sum(p["area_ha"] for p in props_all if p["abstencion"]), 2),
        "superficie_perenne_ha": round(sum(p["area_ha"] for p in perennes), 2),
        "demanda_perenne_millares": demanda_zona,
        "conteos": {"total": len(props_all), "libre": estados.count("libre"), "por_vencer": estados.count("por_vencer"),
                    "comprometida": estados.count("comprometida"), "abstenida": estados.count(None)},
    }
    frac_abst = zona["superficie_abstenida_ha"] / zona["superficie_total_ha"] if zona["superficie_total_ha"] else 0
    n_abst = sum(1 for p in props_all if p["abstencion"])
    if n_abst * 2 > len(props_all):
        avisos.append(f"Más de la mitad de las parcelas quedan abstenidas ({n_abst} de {len(props_all)}): el kit (A4.2) pide notificarlo")

    from simulados import bloques_distrito_dotaciones  # mismo armado que los simulados, desde params
    distrito, dotaciones = bloques_distrito_dotaciones(params)
    capas = ["cultivos", "suelo_desnudo"] + (["memoria_2025"] if any(
        any(m["anio"] == 2025 for m in (p["memoria"] or [])) for p in props_all) else [])
    distrito["capas_disponibles"] = capas
    ahora = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
    cubo = {
        "meta": {"version": "4.0", "generado": ahora, "mock": False, "mock_campos": [], "script": "motor/b4_cubo.py",
                 "fuentes": [f"data/processed/{x}" for x in sorted(p.name for p in processed.iterdir() if p.is_file())]
                            + ["data/params.json", "data/opciones_b4.json"],
                 "notas": [cfg["_nota"],
                           "Drip scenario not available: no sourced drip efficiency yet (params.eficiencia.goteo is null).",
                           "Money row: no verified margin data."] + avisos},
        "distrito": distrito, "dotaciones": dotaciones, "lluvia_pct": params["lluvia_pct"]["valor"],
        "zona": zona, "parcelas": cubo_parcelas,
    }
    geo = {"type": "FeatureCollection", "meta": {"mock": False, "anio_actual": params["memoria"]["anio_actual"]["valor"],
                                                  "fuente": "Fields of The World 2025 (CC-BY-4.0) via B1; HLS via A3/A4"},
           "features": features}
    expl = {"meta": {"mock": False, "dinamicos": ["d", "ha", "cobertura"],
                     "nota": "Template texts written by the team (no LLM yet); every number comes from 'valores' or from the slider."},
            "explicaciones": {f"EXP_ZONA_{rid}": explicacion(rid, clave, rotaciones, demanda, params, cfg)
                              for rid, clave in sorted(usadas)}}
    if escribir:
        web.mkdir(parents=True, exist_ok=True)
        for nombre, datos in (("parcelas.geojson", geo), ("cubo.json", cubo), ("explicaciones.json", expl)):
            (web / nombre).write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    return {"ejecutado": True, "parcelas": len(features), "clasificadas": len(no_abst),
            "opciones": sum(len(v["opciones"]) for v in cubo_parcelas.values()),
            "fraccion_area_abstenida": round(frac_abst, 3), "avisos": avisos}


def ids_secuencia(cfg, cultivo, opcion_desde):
    o = opcion_desde(cfg["actual"][cultivo], cultivo)
    return o[0] if o else []


def explicacion(rot_id, plazo_clave, rotaciones, demanda, params, cfg):
    """Cinco respuestas del reto con marcadores, SIN dígitos (kit C3; plantilla sin LLM)."""
    if rot_id in rotaciones:
        lam = rotaciones[rot_id]["lamina_bruta_millares"]["0"]
    else:
        d = demanda[rot_id]["0"]
        lam = {"p10": num(d["bruta_millares_p10"]), "p50": num(d["bruta_millares_p50"]), "p90": num(d["bruta_millares_p90"])}
    plazo = plazo_params(params, plazo_clave)
    nombre = cfg["nombres_en"].get(rot_id, rot_id)
    # Plazo en palabras sin dígitos: una temporada, N años o de N a M años.
    if plazo["min"] == plazo["max"] == params["plazo"]["anual"]["valor"]:
        plazo_txt = "for one season"
    elif plazo["min"] == plazo["max"]:
        plazo_txt = "for {{f2}} years"
    else:
        plazo_txt = "for {{f2}} to {{f3}} years"
    return {
        "textos": {
            "por_que": f"{nombre} asks for {{{{f1}}}} thousand m³ per hectare per year and commits water {plazo_txt}. With your allocation of {{{{d}}}} thousand m³/ha it covers {{{{cobertura}}}} of the need: enough for {{{{ha}}}} hectares.",
            "evidencia": "Water need from the FAO Penman–Monteith method with NASA POWER daily climate and a Monte Carlo band (low {{f4}}, high {{f5}} thousand m³/ha). Field history from NASA HLS greenness.",
            "beneficios": "Shows how many years this choice ties up water before you plant, next to the dam allocation you expect.",
            "que_no_sabemos": "On-farm irrigation efficiency has not been measured in this district; the band reflects that assumption. Field boundaries are estimated by a neural network outside its training region.",
            "riesgos": "Check with your module technician: the allocation, where the thousand cubic meters are measured, and local soil conditions can change the answer.",
        },
        "valores": {"f1": lam["p50"], "f2": plazo["min"], "f3": plazo["max"], "f4": lam["p10"], "f5": lam["p90"]},
    }


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--processed", default=str(RAIZ / "data/processed"))
    ap.add_argument("--web", default=str(RAIZ / "web/data"))
    a = ap.parse_args()
    rep = construir(a.processed, a.web)
    print(json.dumps(rep, ensure_ascii=False, indent=1))
