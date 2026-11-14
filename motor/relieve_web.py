# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Capa «Terrain & runoff» para la web (S9 §4 bis; kit A9, parte web).

Copia a web/data/ lo que la web necesita para dibujar las rutas de escurrimiento y el botón
«Simulate a storm», desde data/processed (entregas validadas por motor/ensamblar.py):
  relieve_rutas.geojson                     -> web/data/relieve_rutas.geojson (sin cambios)
  relieve_meta[_<zona>].json               -> web/data/relieve.json (un bloque por zona)
Si no hay entregas de relieve, no escribe nada y lo informa: la web dice «terrain layer: not run».
Ninguna cifra se escribe aquí: la lámina de la tormenta, su fuente y el umbral vienen de A9.

Uso:  python motor/relieve_web.py
"""
import json
import shutil
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ZONA_POR_OMISION = "delicias_saucillo"  # archivos sin sufijo (docs/decisiones/2026-11-14_dos_zonas.md)


def leer_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def construir(processed=RAIZ / "data/processed", web=RAIZ / "web/data", params_ruta=RAIZ / "data/params.json"):
    processed, web = Path(processed), Path(web)
    rutas = processed / "relieve_rutas.geojson"
    metas = sorted(processed.glob("relieve_meta*.json"))
    if not rutas.exists() or not metas:
        for viejo in (web / "relieve_rutas.geojson", web / "relieve.json"):
            if viejo.exists():
                viejo.unlink()  # sin entregas: la web no debe mostrar una capa vieja
        return {"ejecutado": False, "motivo": "sin relieve_rutas.geojson o relieve_meta*.json en data/processed"}

    zonas_ids = {z["id"] for z in leer_json(params_ruta)["zona_piloto"].get("zonas", {}).get("valor", [])}
    bloques = {}
    for m in metas:
        sufijo = m.stem[len("relieve_meta"):].lstrip("_")
        zona = sufijo or ZONA_POR_OMISION
        if zonas_ids and zona not in zonas_ids:
            continue  # el ensamblador ya rechaza sufijos desconocidos; aquí solo se ignoran
        d = leer_json(m)
        t = d.get("tormenta") or {}
        bloques[zona] = {
            "rotulo": d.get("rotulo"),
            "umbral_ruta_ha": d.get("umbral_ruta_ha"),
            "umbral_ruta_etiqueta": d.get("umbral_ruta_etiqueta"),
            "tormenta": {"mm": t.get("mm"), "definicion": t.get("definicion"),
                         "fuente": t.get("fuente"), "periodo": t.get("periodo")},
        }
    web.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(rutas, web / "relieve_rutas.geojson")
    salida = {"_encabezado": "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026",
              "fuente": "data/processed/relieve_meta*.json (A9, NASADEM vía Earth Engine)",
              "zonas": bloques}
    (web / "relieve.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return {"ejecutado": True, "zonas": sorted(bloques), "rutas_bytes": (web / "relieve_rutas.geojson").stat().st_size}


if __name__ == "__main__":
    print(json.dumps(construir(), ensure_ascii=False, indent=1))
