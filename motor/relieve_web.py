# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Capa «Terrain & runoff» para la web (S9 §4 bis; kit A9, parte web).

Copia a web/data/ lo que la web necesita para dibujar las rutas de escurrimiento y el botón
«Simulate a storm», desde data/processed (entregas validadas por motor/ensamblar.py):
  relieve_rutas.geojson                     -> web/data/relieve_rutas.geojson (sin cambios)
  relieve_meta[_<zona>].json               -> web/data/relieve.json (un bloque por zona)
Si no hay entregas de relieve, no escribe nada y lo informa: la web dice «terrain layer: not run».
Lo mismo si ningún relieve_meta es de una zona de params.zona_piloto.zonas: «ejecutado» False con su
motivo. Un relieve_meta de una zona desconocida se ignora y se dice en «avisos» (nunca en silencio).
Cada zona lleva también «rutas_depresiones» tal como lo entrega A9 (profundidad mínima de la depresión
sin ruta, su etiqueta, la nota y cuántas celdas y retazos de ruta se omitieron), para que la leyenda
pueda explicar por qué hay rutas cortadas; si A9 no lo trae, queda en null.
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


def quitar_capa(web):
    """Borra de web/data la capa de relieve: sin entregas válidas la web no debe mostrar una capa vieja."""
    for viejo in (web / "relieve_rutas.geojson", web / "relieve.json"):
        if viejo.exists():
            viejo.unlink()


def construir(processed=RAIZ / "data/processed", web=RAIZ / "web/data", params_ruta=RAIZ / "data/params.json"):
    processed, web = Path(processed), Path(web)
    rutas = processed / "relieve_rutas.geojson"
    metas = sorted(processed.glob("relieve_meta*.json"))
    if not rutas.exists() or not metas:
        quitar_capa(web)
        return {"ejecutado": False, "motivo": "sin relieve_rutas.geojson o relieve_meta*.json en data/processed",
                "avisos": []}

    zonas_ids = {z["id"] for z in leer_json(params_ruta)["zona_piloto"].get("zonas", {}).get("valor", [])}
    bloques, avisos = {}, []
    for m in metas:
        sufijo = m.stem[len("relieve_meta"):].lstrip("_")
        zona = sufijo or ZONA_POR_OMISION
        if zonas_ids and zona not in zonas_ids:
            # El ensamblador ya rechaza sufijos desconocidos; si aun así hay uno en la caché, se dice.
            avisos.append(f"{m.name}: la zona «{zona}» no está en params.zona_piloto.zonas; se ignora")
            continue
        d = leer_json(m)
        t = d.get("tormenta") or {}
        dep = d.get("rutas_depresiones")
        bloques[zona] = {
            "rotulo": d.get("rotulo"),
            "umbral_ruta_ha": d.get("umbral_ruta_ha"),
            "umbral_ruta_etiqueta": d.get("umbral_ruta_etiqueta"),
            "tormenta": {"mm": t.get("mm"), "definicion": t.get("definicion"),
                         "fuente": t.get("fuente"), "periodo": t.get("periodo")},
            # Por qué hay rutas cortadas (A9 no dibuja rutas dentro de depresiones cerradas del modelo).
            "rutas_depresiones": dict(dep) if isinstance(dep, dict) else None,
        }
        if not isinstance(dep, dict):
            avisos.append(f"{m.name}: no trae «rutas_depresiones»; la leyenda no podrá explicar las rutas cortadas")
    if not bloques:
        quitar_capa(web)
        return {"ejecutado": False, "avisos": avisos,
                "motivo": "ningún relieve_meta*.json de data/processed es de una zona de params.zona_piloto.zonas"}
    web.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(rutas, web / "relieve_rutas.geojson")
    salida = {"_encabezado": "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026",
              "fuente": "data/processed/relieve_meta*.json (A9, NASADEM vía Earth Engine)",
              "zonas": bloques}
    (web / "relieve.json").write_text(json.dumps(salida, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return {"ejecutado": True, "zonas": sorted(bloques), "avisos": avisos,
            "rutas_bytes": (web / "relieve_rutas.geojson").stat().st_size}


if __name__ == "__main__":
    print(json.dumps(construir(), ensure_ascii=False, indent=1))
