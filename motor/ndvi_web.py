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
- umbrales: las dos líneas de referencia de la gráfica de la ficha, {"verde": {...} | null, "desnudo": {...} |
  null}, cada una {valor, etiqueta, fuente, archivo}. Salen de data/processed/supuestos.json
  (umbral_verde_ndvi y umbral_desnudo_ndvi: los que usó la sesión de datos para la memoria y los días de suelo
  desnudo); si supuestos.json no trae uno, de data/params.json (memoria.ndvi_verde y suelo.ndvi_desnudo). Un
  umbral sin valor entre −1 y 1 o sin fuente va en null (la gráfica no dibuja esa línea) y se avisa. Si los
  dos archivos traen valores distintos se usa el de supuestos.json y se avisa.
- El archivo lleva además «_encabezado» y «_nota» (regla 4 de CLAUDE.md); la página no los usa.
Si no hay CSV, no escribe nada, borra el archivo viejo y lo informa: la ficha no ofrece la gráfica.

API:  construir(processed, web, params_ruta) -> resumen {"ejecutado": bool, …}
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
ARCHIVO_SUPUESTOS = "supuestos.json"
# Umbral de la gráfica -> (llave de data/processed/supuestos.json, ruta en data/params.json).
UMBRALES = {
    "verde": ("umbral_verde_ndvi", ("memoria", "ndvi_verde")),
    "desnudo": ("umbral_desnudo_ndvi", ("suelo", "ndvi_desnudo")),
}


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


def _entrada_umbral(d):
    """{valor, etiqueta, fuente} de una entrada de supuestos o de params; None si no trae un valor de NDVI
    (entre −1 y 1) con su fuente."""
    if not isinstance(d, dict):
        return None
    v = d.get("valor")
    fuente = d.get("fuente")
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) or not -1.0 <= v <= 1.0:
        return None
    if not (isinstance(fuente, str) and fuente.strip()):
        return None
    return {"valor": v, "etiqueta": d.get("etiqueta"), "fuente": fuente}


def umbrales(processed, params_ruta, avisos):
    """Las dos líneas de referencia de la gráfica: supuestos.json y, si falta, params.json (ver arriba)."""
    ruta_sup = Path(processed) / ARCHIVO_SUPUESTOS
    sup = leer_json(ruta_sup) if ruta_sup.exists() else {}
    params = leer_json(params_ruta) if params_ruta and Path(params_ruta).exists() else {}
    salida = {}
    for clave, (llave_sup, ruta_params) in UMBRALES.items():
        de_sup = _entrada_umbral(sup.get(llave_sup) if isinstance(sup, dict) else None)
        bloque = params
        for parte in ruta_params:
            bloque = bloque.get(parte) if isinstance(bloque, dict) else None
        de_params = _entrada_umbral(bloque)
        if de_sup and de_params and de_sup["valor"] != de_params["valor"]:
            avisos.append(f"umbral {clave} del NDVI: {ARCHIVO_SUPUESTOS} dice {de_sup['valor']} y params.json "
                          f"{de_params['valor']}; se usa el de {ARCHIVO_SUPUESTOS}")
        if de_sup:
            salida[clave] = {**de_sup, "archivo": f"data/processed/{ARCHIVO_SUPUESTOS}"}
        elif de_params:
            salida[clave] = {**de_params, "archivo": "data/params.json"}
        else:
            salida[clave] = None
            avisos.append(f"umbral {clave} del NDVI: ni {ARCHIVO_SUPUESTOS} ({llave_sup}) ni params.json "
                          f"({'.'.join(ruta_params)}) traen un valor con fuente; la gráfica no dibuja esa línea")
    return salida


def construir(processed=RAIZ / "data/processed", web=RAIZ / "web/data", params_ruta=RAIZ / "data/params.json"):
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
    avisos = []
    lineas_umbral = umbrales(processed, params_ruta, avisos)

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
    lineas += [" },", f' "umbrales": {js(lineas_umbral)},', f' "fuente": {js(fuente)}', "}"]
    web.mkdir(parents=True, exist_ok=True)
    salida.write_text("\n".join(lineas) + "\n", encoding="utf-8")

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
            "umbrales": {k: (v or {}).get("valor") for k, v in lineas_umbral.items()},
            "bytes": salida.stat().st_size, "avisos": avisos}


if __name__ == "__main__":
    print(json.dumps(construir(), ensure_ascii=False, indent=1))
