# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Genera la fixture de DOS ZONAS para tests/test_b4.py. Son DATOS DE PRUEBA, no datos reales.

Se DERIVA de data/processed (entrega real de una sola zona, delicias_saucillo):
- Toma unas parcelas de cada clase (cultivo y estado del plazo) más las protagonistas; reparte cada
  clase entre las dos zonas, alternando. Las protagonistas se quedan en delicias_saucillo y la única
  parcela de cereal de invierno va a lazaro_cardenas (para probar demanda_cultivos de esa zona).
- Las parcelas de lazaro_cardenas reciben ids L0001… (de norte a sur) y se TRASLADAN, sin deformarlas,
  al rectángulo de lazaro_cardenas de data/params.json (centro del conjunto -> centro del rectángulo).
- Todas las parcelas llevan la propiedad «zona» (convención de la decisión 2026-11-14).
- rotaciones_lazaro_cardenas.json y demanda_cultivos_lazaro_cardenas.csv = los de delicias_saucillo
  con las láminas (y la ETc y la neta) multiplicadas por FACTOR_PRUEBA. Ese factor es un DATO DE
  PRUEBA para que las dos zonas tengan láminas distintas; no es una cifra del proyecto.
- No copia lo que B4 no lee (eto_diaria, hls_mensual, nasadem, relieve_rutas, relieve_meta, fuentes).

Uso:  python tests/fixtures/b4_dos_zonas/generar.py      (reescribe tests/fixtures/b4_dos_zonas/processed/)
"""
import copy
import csv
import io
import json
import shutil
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]
ORIGEN = RAIZ / "data/processed"
DESTINO = AQUI / "processed"

ZONA_A, ZONA_B = "delicias_saucillo", "lazaro_cardenas"
FACTOR_PRUEBA = 1.10  # DATO DE PRUEBA (no real): láminas de lazaro_cardenas = delicias_saucillo × este factor
CUPO = 12             # parcelas por clase (diseño de la prueba: ~60 parcelas en total, ~30 por zona)
CSV_POR_PARCELA = ("cultivos_parcelas.csv", "memoria_parcelas.csv", "memoria_resumen.csv",
                   "suelo_desnudo.csv", "relieve_parcelas.csv")
NOTA = (f"DATOS DE PRUEBA derivados de data/processed por tests/fixtures/b4_dos_zonas/generar.py: "
        f"parcelas de {ZONA_B} trasladadas a su rectángulo y láminas × {FACTOR_PRUEBA} (factor de prueba, no real).")


def leer_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def escribir_json(p, datos):
    Path(p).write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")


def leer_csv(p):
    with open(p, encoding="utf-8", newline="") as f:
        lector = csv.DictReader(f)
        return lector.fieldnames, list(lector)


def escribir_csv(p, campos, filas):
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=campos, lineterminator="\n")
    w.writeheader()
    w.writerows(filas)
    Path(p).write_text(buf.getvalue(), encoding="utf-8")


def puntos(geom):
    """Todas las coordenadas [lon, lat] de un Polygon o MultiPolygon."""
    salida = []

    def rec(c):
        if isinstance(c[0], (int, float)):
            salida.append(c)
        else:
            for x in c:
                rec(x)
    rec(geom["coordinates"])
    return salida


def trasladar(geom, dx, dy):
    def rec(c):
        if isinstance(c[0], (int, float)):
            return [round(c[0] + dx, 6), round(c[1] + dy, 6)]
        return [rec(x) for x in c]
    return {"type": geom["type"], "coordinates": rec(geom["coordinates"])}


def dentro(geom, bbox):
    o, s, e, n = bbox
    return all(o <= x <= e and s <= y <= n for x, y in puntos(geom))


def escalar(v, decimales):
    r = round(v * FACTOR_PRUEBA, decimales)
    return int(r) if decimales == 0 else r


def generar():
    params = leer_json(RAIZ / "data/params.json")
    zonas = {z["id"]: z for z in params["zona_piloto"]["zonas"]["valor"]}
    base = leer_json(ORIGEN / "parcelas_base.geojson")
    _, cultivos = leer_csv(ORIGEN / "cultivos_parcelas.csv")
    clase = {r["id"]: (r["cultivo_actual"], r["abstencion"], r["estado_plazo"]) for r in cultivos}

    # 1) Selección: protagonistas en A; luego CUPO por clase, alternando B, A, B, A…
    zona_de = {f["properties"]["id"]: ZONA_A for f in base["features"] if f["properties"].get("protagonista")}
    por_clase = {}
    for f in base["features"]:
        pid = f["properties"]["id"]
        if pid not in zona_de and pid in clase:
            por_clase.setdefault(clase[pid], []).append(pid)
    for ids in por_clase.values():
        for k, pid in enumerate(ids[:CUPO]):
            zona_de[pid] = ZONA_B if k % 2 == 0 else ZONA_A

    # 2) Traslado rígido de las parcelas de B al centro de su rectángulo.
    feats = [copy.deepcopy(f) for f in base["features"] if f["properties"]["id"] in zona_de]
    pts_b = [p for f in feats if zona_de[f["properties"]["id"]] == ZONA_B for p in puntos(f["geometry"])]
    o, s, e, n = zonas[ZONA_B]["bbox"]
    dx = (o + e) / 2 - (min(x for x, _ in pts_b) + max(x for x, _ in pts_b)) / 2
    dy = (s + n) / 2 - (min(y for _, y in pts_b) + max(y for _, y in pts_b)) / 2
    for f in feats:
        z = zona_de[f["properties"]["id"]]
        if z == ZONA_B:
            f["geometry"] = trasladar(f["geometry"], dx, dy)
        assert dentro(f["geometry"], zonas[z]["bbox"]), f"{f['properties']['id']} queda fuera del rectángulo de {z}"

    # 3) Ids L0001… de norte a sur (latitud media de la geometría) y propiedad «zona».
    lat_media = lambda f: sum(y for _, y in puntos(f["geometry"])) / len(puntos(f["geometry"]))
    nuevo_id = {}
    prefijo = zonas[ZONA_B]["prefijo_id"]
    for k, f in enumerate(sorted((f for f in feats if zona_de[f["properties"]["id"]] == ZONA_B), key=lat_media, reverse=True)):
        nuevo_id[f["properties"]["id"]] = f"{prefijo}{k + 1:04d}"
    for f in feats:
        viejo = f["properties"]["id"]
        props = {"id": nuevo_id.get(viejo, viejo), "zona": zona_de[viejo]}
        props.update({k: v for k, v in f["properties"].items() if k not in ("id", "zona")})
        f["properties"] = props
    feats.sort(key=lambda f: (f["properties"]["zona"] != ZONA_A, f["properties"]["id"]))

    # 4) Escritura.
    if DESTINO.exists():
        shutil.rmtree(DESTINO)
    DESTINO.mkdir(parents=True)
    escribir_json(DESTINO / "parcelas_base.geojson", {"type": "FeatureCollection", "_prueba": NOTA, "features": feats})
    for nombre in CSV_POR_PARCELA:
        if not (ORIGEN / nombre).exists():
            continue
        campos, filas = leer_csv(ORIGEN / nombre)
        filas = [{**r, "id": nuevo_id.get(r["id"], r["id"])} for r in filas if r["id"] in zona_de]
        escribir_csv(DESTINO / nombre, campos, filas)
    shutil.copy(ORIGEN / "rotaciones.json", DESTINO / "rotaciones.json")
    shutil.copy(ORIGEN / "demanda_cultivos.csv", DESTINO / "demanda_cultivos.csv")

    rot = leer_json(ORIGEN / "rotaciones.json")
    rot_b = {"_prueba": {"nota": NOTA, "factor": FACTOR_PRUEBA, "derivado_de": "data/processed/rotaciones.json"}}
    rot_b.update(copy.deepcopy(rot))
    for r in rot_b["rotaciones"]:
        for banda in r["lamina_bruta_millares"].values():
            for q in list(banda):
                banda[q] = escalar(banda[q], 2 if q in ("p10", "p50", "p90") else 0)
    escribir_json(DESTINO / f"rotaciones_{ZONA_B}.json", rot_b)

    campos, filas = leer_csv(ORIGEN / "demanda_cultivos.csv")
    for r in filas:
        for c in campos:
            if c.startswith("bruta_millares_"):
                r[c] = escalar(float(r[c]), 2)
            elif c.endswith("_mm_p50"):
                r[c] = escalar(float(r[c]), 0)
    escribir_csv(DESTINO / f"demanda_cultivos_{ZONA_B}.csv", campos, filas)

    n_b = sum(1 for z in zona_de.values() if z == ZONA_B)
    print(f"fixture escrita en {DESTINO}: {len(feats)} parcelas ({len(feats) - n_b} en {ZONA_A}, {n_b} en {ZONA_B}); "
          f"traslado dx={dx:.4f}°, dy={dy:.4f}°")


if __name__ == "__main__":
    generar()
