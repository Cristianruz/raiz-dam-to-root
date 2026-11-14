# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""NDVI mensual por parcela para la ficha del gemelo digital.

Decisión y contrato: docs/decisiones/2026-11-14_gemelo_digital.md.
  data/processed/hls_mensual_parcelas.csv  (id, mes, banda, mediana, p25, p75, n_validos; entrega A3)
    -> web/data/ndvi_mensual.json
       { "meses": ["2025-10", …], "parcelas": { "<id>": [0.31, null, …] }, "fuente": "…" }
- Solo se usa la banda «ndvi» y su columna «mediana» (mediana mensual de HLS dentro de la parcela).
- meses: todos los meses que trae el CSV, ordenados. Cada parcela lleva una lista alineada a meses.
- null si la parcela no tiene ese mes, o si el valor no es un número entre −1 y 1 (no se inventa nada).
- Redondeo a 3 decimales.
- Hay una serie por cada parcela de web/data/parcelas.geojson (las que la página dibuja); si ese
  archivo aún no existe, por cada parcela del CSV.
- fuente: la que declara data/processed/fuentes.json para hls_mensual_parcelas.csv; null si no está.
- El archivo lleva además «_encabezado» y «_nota» (regla 4 de CLAUDE.md); la página no los usa.
Si no hay CSV, no escribe nada, borra el archivo viejo y lo informa: la ficha no ofrece la gráfica.

API:  construir(processed, web) -> resumen {"ejecutado": bool, …}
Uso:  python motor/ndvi_web.py
"""
import csv
import json
import math
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
ENTRADA = "hls_mensual_parcelas.csv"
SALIDA = "ndvi_mensual.json"
BANDA = "ndvi"
DECIMALES = 3


def leer_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def _ndvi(texto):
    """Número entre −1 y 1 redondeado, o None si la celda está vacía, no es número o se sale del rango."""
    try:
        v = float(texto)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(v) or not -1.0 <= v <= 1.0:
        return None
    return round(v, DECIMALES)


def _fuente(processed):
    """Fuente declarada en fuentes.json para la entrega (la escribe motor/ensamblar.py)."""
    ruta = Path(processed) / "fuentes.json"
    if not ruta.exists():
        return None
    for f in leer_json(ruta).get("fuentes", []):
        if f.get("archivo") == ENTRADA:
            return f.get("fuente")
    return None


def _ids_de_la_web(web):
    """Ids de web/data/parcelas.geojson, o None si todavía no existe."""
    ruta = Path(web) / "parcelas.geojson"
    if not ruta.exists():
        return None
    return [f["properties"]["id"] for f in leer_json(ruta).get("features", [])]


def construir(processed=RAIZ / "data/processed", web=RAIZ / "web/data"):
    processed, web = Path(processed), Path(web)
    entrada, salida = processed / ENTRADA, web / SALIDA
    if not entrada.exists():
        if salida.exists():
            salida.unlink()  # sin entrega: la ficha no debe mostrar una serie vieja
        return {"ejecutado": False, "motivo": f"sin {ENTRADA} en data/processed"}

    valores, meses, descartados, repetidos = {}, set(), 0, 0
    with entrada.open(encoding="utf-8", newline="") as f:
        for fila in csv.DictReader(f):
            if fila.get("banda") != BANDA:
                continue
            pid, mes = fila["id"], fila["mes"]
            meses.add(mes)
            v = _ndvi(fila.get("mediana"))
            if v is None:
                descartados += 1
            if (pid, mes) in valores:
                repetidos += 1       # se conserva la primera fila de cada parcela y mes
                continue
            valores[(pid, mes)] = v
    meses = sorted(meses)
    ids_csv = {pid for pid, _ in valores}
    ids_web = _ids_de_la_web(web)
    ids = sorted(set(ids_web)) if ids_web is not None else sorted(ids_csv)
    parcelas = {pid: [valores.get((pid, m)) for m in meses] for pid in ids}
    fuente = _fuente(processed)

    # Una parcela por línea: el archivo se versiona y así sus diferencias se pueden leer.
    def js(x):
        return json.dumps(x, ensure_ascii=False, separators=(",", ":"))

    lineas = ["{",
              f' "_encabezado": {js(ENCABEZADO)},',
              ' "_nota": ' + js(f"Generado por motor/ndvi_web.py a partir de data/processed/{ENTRADA} (banda {BANDA}, "
                                "columna mediana); nunca se edita a mano. Cada lista está alineada a «meses»; "
                                "null = sin dato.") + ",",
              f' "meses": {js(meses)},',
              ' "parcelas": {']
    lineas += [f'  {js(pid)}: {js(serie)}' + ("," if i < len(ids) - 1 else "") for i, (pid, serie) in enumerate(parcelas.items())]
    lineas += [" },", f' "fuente": {js(fuente)}', "}"]
    web.mkdir(parents=True, exist_ok=True)
    salida.write_text("\n".join(lineas) + "\n", encoding="utf-8")

    avisos = []
    if fuente is None:
        avisos.append(f"data/processed/fuentes.json no declara la fuente de {ENTRADA}: «fuente» queda en null")
    if ids_web is not None and (faltan := sorted(set(ids_web) - ids_csv)):
        avisos.append(f"{len(faltan)} parcelas de parcelas.geojson no están en {ENTRADA}: su serie va en null")
    if descartados:
        avisos.append(f"{descartados} valores de NDVI vacíos o fuera de [−1, 1]: van en null")
    if repetidos:
        avisos.append(f"{repetidos} filas repetidas (misma parcela y mes): se usó la primera")
    return {"ejecutado": True, "meses": meses, "parcelas": len(ids),
            "sin_dato": sum(v is None for s in parcelas.values() for v in s),
            "bytes": salida.stat().st_size, "avisos": avisos}


if __name__ == "__main__":
    print(json.dumps(construir(), ensure_ascii=False, indent=1))
