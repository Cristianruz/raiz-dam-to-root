#!/usr/bin/env python3
"""Valida que los archivos de web/data/ cumplan el contrato de datos de Raíz.

Uso:  python3 scripts/validar_datos.py           (desde la raíz del repo)
Sale con código 1 si hay errores, para usarlo antes de cada commit o en CI.
"""
import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "web" / "data"
errores, avisos = [], []


def leer(nombre):
    try:
        return json.loads((DATA / nombre).read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        errores.append(f"{nombre}: no se pudo leer ({e})")
        return None


def num(obj, campo, donde, minimo=None, maximo=None):
    v = obj.get(campo)
    if not isinstance(v, (int, float)) or isinstance(v, bool):
        errores.append(f"{donde}: '{campo}' debe ser número (vale {v!r})")
        return
    if minimo is not None and v < minimo:
        errores.append(f"{donde}: '{campo}' = {v} es menor que {minimo}")
    if maximo is not None and v > maximo:
        errores.append(f"{donde}: '{campo}' = {v} es mayor que {maximo}")


esc = leer("escenarios.json")
cul = leer("cultivos.json")
par = leer("parcelas.geojson")

ids_cultivo = set()
if cul:
    for c in cul.get("cultivos", []):
        d = f"cultivos.json[{c.get('id')}]"
        if not c.get("id") or c["id"] in ids_cultivo:
            errores.append(f"{d}: id vacío o repetido")
        ids_cultivo.add(c.get("id"))
        num(c, "demanda_neta_mm", d, 0, 3000)
        num(c, "eficiencia", d, 0.01, 1)
        num(c, "rendimiento_t_ha", d, 0)
        num(c, "precio_mxn_t", d, 0)
        num(c, "costo_mxn_ha", d, 0)
        if c.get("suelo_efecto") not in ("mejora", "neutral", "desgaste"):
            errores.append(f"{d}: suelo_efecto debe ser mejora | neutral | desgaste")
        if not c.get("validado"):
            avisos.append(f"{d}: pendiente de validar")

if esc:
    vistos = set()
    if not esc.get("escenarios"):
        errores.append("escenarios.json: no hay escenarios")
    for e in esc.get("escenarios", []):
        d = f"escenarios.json[{e.get('id')}]"
        if not e.get("id") or e["id"] in vistos:
            errores.append(f"{d}: id vacío o repetido")
        vistos.add(e.get("id"))
        num(e, "lamina_cm", d, 0, 300)
        if not e.get("fuente"):
            errores.append(f"{d}: falta 'fuente'")
        if not e.get("validado"):
            avisos.append(f"{d}: pendiente de validar")

if par:
    vistos = set()
    feats = par.get("features", [])
    if par.get("type") != "FeatureCollection" or not feats:
        errores.append("parcelas.geojson: debe ser un FeatureCollection con al menos una parcela")
    for f in feats:
        p = f.get("properties", {})
        d = f"parcelas.geojson[{p.get('id')}]"
        if not p.get("id") or p["id"] in vistos:
            errores.append(f"{d}: id vacío o repetido")
        vistos.add(p.get("id"))
        num(p, "superficie_ha", d, 0.01)
        g = f.get("geometry") or {}
        if g.get("type") not in ("Polygon", "MultiPolygon"):
            errores.append(f"{d}: la geometría debe ser Polygon o MultiPolygon")
        else:
            anillo = g["coordinates"][0] if g["type"] == "Polygon" else g["coordinates"][0][0]
            lon, lat = anillo[0][0], anillo[0][1]
            if not (-118 < lon < -86 and 14 < lat < 33):
                errores.append(f"{d}: coordenadas fuera de México ({lon}, {lat}); ¿están en EPSG:4326 y en orden lon, lat?")
        for cid in [p.get("cultivo_actual"), *p.get("alternativas", [])]:
            if cid not in ids_cultivo:
                errores.append(f"{d}: cultivo '{cid}' no existe en cultivos.json")
        if len(p.get("alternativas", [])) != 2:
            avisos.append(f"{d}: se esperaban 2 alternativas")
        for i, pt in enumerate(p.get("ndvi", [])):
            if not (-1 <= pt.get("ndvi", 9) <= 1):
                errores.append(f"{d}: ndvi[{i}] fuera de rango")
        if not p.get("validado"):
            avisos.append(f"{d}: pendiente de validar")

for a in avisos:
    print("AVISO ", a)
for e in errores:
    print("ERROR ", e)
print(f"\n{len(errores)} errores, {len(avisos)} avisos")
sys.exit(1 if errores else 0)
