# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Escribe web/data/gemelo.json: lo que la vista 3D y la línea de tiempo del gemelo digital leen.

Decisión y contrato: docs/decisiones/2026-11-14_gemelo_digital.md (nunca se escribe a mano).
De dónde sale cada parte:
  terreno.zonas.<id>   teselas ya generadas en web/data/dem/<id>/ (motor/dem_teselas.py):
                         teselas     plantilla de la ruta, relativa a web/
                         bounds      rectángulo de la zona (params.zona_piloto.zonas), el mismo con el
                                     que se eligieron las teselas: MapLibre no pide ninguna de fuera
                         elev_min_m, elev_max_m   mínimo y máximo de TODAS las teselas de la zona,
                                     decodificadas aquí (incluyen el margen alrededor del rectángulo)
                       Una zona solo entra si están todas sus teselas; si ninguna zona las tiene,
                       "terreno": null y la página dice «3D twin view: not available».
  terreno.minzoom, maxzoom, exageracion; columnas; camara; tiempo.intervalo_ms; tiempo.destacados
                       valores de diseño de data/params.json, bloque «gemelo»
  terreno.zonas.<id>.exageracion
                       exageración de esa zona (params.gemelo.exageracion_por_zona); si la zona no trae
                       la suya, la general (exageracion_vertical). La vista 3D usa la de la zona y, si falta,
                       terreno.exageracion. Motivo: Lázaro Cárdenas tiene cerca de tres veces el desnivel
                       de Delicias–Saucillo y con el mismo factor sus cerros tapan las columnas.
  zona_inicial         zona con la que abre la página (params.gemelo.zona_inicial; decisión, punto 6);
                       null, con aviso, si falta o no es una zona de params.zona_piloto.zonas
  terreno.fuente, terreno.rotulo   textos fijos del contrato de la decisión
  tiempo.anios         [primer año, último año] de la memoria de web/data/parcelas.geojson
  ndvi                 archivo, fuente y meses de web/data/ndvi_mensual.json
El archivo lleva además «_encabezado» y «_nota» (regla 4 de CLAUDE.md); la página no los usa.

construir() llama primero a motor/ndvi_web.py, para que «ndvi.meses» y «ndvi.fuente» siempre
coincidan con ndvi_mensual.json sin depender del orden en que se conecten al comando único.
Solo usa la biblioteca estándar (corre en GitHub Actions, donde no hay rasterio).

Para quien monte la vista 3D: MapLibre dibuja el relieve con teselas de UN nivel menos que el zoom
del mapa. Hay relieve desde el zoom del mapa terreno.minzoom + 1; por debajo, el terreno queda plano.

API:  construir(web, params_ruta, processed) -> resumen {"ejecutado": bool, "terreno": […] | None, "avisos": […], …}
Uso:  python motor/gemelo_web.py
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))  # para importar dem_teselas.py y ndvi_web.py
import dem_teselas  # noqa: E402
import ndvi_web  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
ENCABEZADO = "AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026"
SALIDA = "gemelo.json"
# Textos fijos del contrato (docs/decisiones/2026-11-14_gemelo_digital.md).
FUENTE_TERRENO = "NASADEM (NASA/NASADEM_HGT/001), 30 m, vía Google Earth Engine"
ROTULO_TERRENO = "regional, 30 m (NASADEM); vertical exaggeration applied"


def leer_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


def _exageracion_de_zona(g, zid, avisos):
    """Exageración de una zona: la de params.gemelo.exageracion_por_zona; si no la trae, la general."""
    general = g["exageracion_vertical"]["valor"]
    por_zona = (g.get("exageracion_por_zona") or {}).get("valor") or {}
    v = por_zona.get(zid)
    if v is None:
        return general
    if isinstance(v, bool) or not isinstance(v, (int, float)) or not v > 0:
        avisos.append(f"gemelo.exageracion_por_zona.{zid} no es un número positivo ({v!r}); se usa la general")
        return general
    return v


def _zona_inicial(g, zonas_params, avisos):
    """Id de la zona con la que abre la página, o None (con aviso) si falta o no es una zona de params."""
    v = (g.get("zona_inicial") or {}).get("valor")
    if v is None:
        avisos.append("zona_inicial: params.gemelo no la trae; queda en null (la página abre en la primera zona)")
        return None
    if v not in zonas_params:
        avisos.append(f"zona_inicial: {v!r} no es una zona de params.zona_piloto.zonas; queda en null")
        return None
    return v


def _terreno_de_zona(zona, web, processed, minzoom, maxzoom, avisos):
    """Bloque de una zona, o None si le faltan teselas o alguna no se puede leer."""
    zid = zona["id"]
    carpeta = web / "dem" / zid
    esperadas = dem_teselas.teselas_de_bbox(zona["bbox"], minzoom, maxzoom)
    faltan = [t for t in esperadas if not dem_teselas.ruta_tesela(carpeta, *t).exists()]
    if faltan:
        if len(faltan) < len(esperadas):  # si no hay ninguna, la zona simplemente no tiene relieve
            avisos.append(f"terreno de {zid}: faltan {len(faltan)} de {len(esperadas)} teselas "
                          f"(la primera: {'/'.join(map(str, faltan[0]))}); regenere con python motor/dem_teselas.py")
        else:
            avisos.append(f"terreno de {zid}: sin teselas en web/data/dem/{zid}/")
        return None, 0
    minimo, maximo, peso = None, None, 0
    for t in esperadas:
        ruta = dem_teselas.ruta_tesela(carpeta, *t)
        try:
            ancho, alto, filas = dem_teselas.leer_png_rgb(ruta)
            if (ancho, alto) != (dem_teselas.LADO, dem_teselas.LADO):
                raise ValueError(f"mide {ancho} × {alto} px")
            lo, hi = dem_teselas.rango_de_filas(filas)
        except Exception as e:  # tesela dañada: la zona no se ofrece
            avisos.append(f"terreno de {zid}: no se pudo leer {'/'.join(map(str, t))}.png ({e})")
            return None, 0
        minimo = lo if minimo is None else min(minimo, lo)
        maximo = hi if maximo is None else max(maximo, hi)
        peso += ruta.stat().st_size
    # ¿Las teselas salieron del ráster que hoy está en data/processed? (lo anota dem_teselas en origen.json)
    origen, tif = carpeta / "origen.json", dem_teselas.ruta_tif(processed, zid)
    if origen.exists() and tif.exists() and leer_json(origen).get("origen", {}).get("sha256") != dem_teselas.sha256_archivo(tif):
        avisos.append(f"terreno de {zid}: las teselas se generaron con otro {tif.name}; "
                      "regenere con python motor/dem_teselas.py")
    bloque = {"teselas": f"data/dem/{zid}/{{z}}/{{x}}/{{y}}.png", "bounds": list(zona["bbox"]),
              "elev_min_m": round(minimo, 2), "elev_max_m": round(maximo, 2)}
    return bloque, peso


def _anios_de_la_memoria(web, avisos):
    """[primer año, último año] de properties.memoria de parcelas.geojson, o None si no hay."""
    ruta = web / "parcelas.geojson"
    if not ruta.exists():
        avisos.append("tiempo.anios: no existe web/data/parcelas.geojson; queda en null")
        return None
    anios = {m["anio"] for f in leer_json(ruta).get("features", []) for m in (f["properties"].get("memoria") or [])
             if isinstance(m.get("anio"), int)}
    if not anios:
        avisos.append("tiempo.anios: ninguna parcela trae memoria; queda en null")
        return None
    return [min(anios), max(anios)]


def construir(web=RAIZ / "web/data", params_ruta=RAIZ / "data/params.json", processed=RAIZ / "data/processed"):
    web, processed = Path(web), Path(processed)
    params = leer_json(params_ruta)
    g = params.get("gemelo")
    salida = web / SALIDA
    if not g:
        if salida.exists():
            salida.unlink()  # sin valores de diseño no hay gemelo: la página dice que la vista 3D no está disponible
        return {"ejecutado": False, "motivo": "data/params.json no tiene el bloque «gemelo»"}
    avisos = []

    # 1) NDVI mensual (primero, para que gemelo.json describa el archivo que queda escrito).
    r_ndvi = ndvi_web.construir(processed=processed, web=web, params_ruta=params_ruta)
    ndvi = None
    if r_ndvi["ejecutado"]:
        d = leer_json(web / ndvi_web.SALIDA)
        ndvi = {"archivo": f"data/{ndvi_web.SALIDA}", "fuente": d["fuente"], "meses": d["meses"]}
        avisos += r_ndvi["avisos"]
    else:
        avisos.append(f"ndvi: {r_ndvi['motivo']}; queda en null")

    # 2) Terreno: una entrada por zona con su juego completo de teselas.
    dem = g["dem"]["valor"]
    zonas, peso, n_teselas = {}, 0, 0
    zonas_params = [z["id"] for z in params["zona_piloto"]["zonas"]["valor"]]
    for zid in (g.get("exageracion_por_zona") or {}).get("valor") or {}:
        if zid not in zonas_params:
            avisos.append(f"gemelo.exageracion_por_zona: {zid} no es una zona de params.zona_piloto.zonas")
    for zona in params["zona_piloto"]["zonas"]["valor"]:
        bloque, bytes_zona = _terreno_de_zona(zona, web, processed, dem["minzoom"], dem["maxzoom"], avisos)
        if bloque:
            bloque["exageracion"] = _exageracion_de_zona(g, zona["id"], avisos)
            zonas[zona["id"]] = bloque
            peso += bytes_zona
            n_teselas += len(dem_teselas.teselas_de_bbox(zona["bbox"], dem["minzoom"], dem["maxzoom"]))
    terreno = None
    if zonas:
        terreno = {"encoding": dem_teselas.CODIFICACION, "tileSize": dem_teselas.LADO,
                   "minzoom": dem["minzoom"], "maxzoom": dem["maxzoom"], "zonas": zonas,
                   "exageracion": g["exageracion_vertical"]["valor"],
                   "fuente": FUENTE_TERRENO, "rotulo": ROTULO_TERRENO}

    # 3) Línea de tiempo.
    anios = _anios_de_la_memoria(web, avisos)
    d = g["anio_destacado"]
    if anios and not anios[0] <= d["valor"] <= anios[1]:
        avisos.append(f"tiempo.destacados: {d['valor']} queda fuera de los años de la memoria {anios}")
    tiempo = {"anios": anios, "intervalo_ms": g["reproduccion_intervalo_ms"]["valor"],
              "destacados": {str(d["valor"]): {"texto": d["texto"], "fuente": d["fuente"], "etiqueta": d["etiqueta"]}}}

    m = g["metros_por_millar"]
    gemelo = {
        "_encabezado": ENCABEZADO,
        "_nota": "Generado por motor/gemelo_web.py a partir de data/params.json (bloque gemelo), web/data/dem/, "
                 "web/data/parcelas.geojson y web/data/ndvi_mensual.json; nunca se edita a mano "
                 "(contrato: docs/decisiones/2026-11-14_gemelo_digital.md).",
        "terreno": terreno,
        "columnas": {"metros_por_millar": m["valor"], "nota": m["nota_web"], "etiqueta": m["etiqueta"]},
        "camara": {"pitch": g["camara"]["valor"]["pitch"], "bearing": g["camara"]["valor"]["bearing"]},
        "tiempo": tiempo,
        "ndvi": ndvi,
        "zona_inicial": _zona_inicial(g, zonas_params, avisos),
    }
    web.mkdir(parents=True, exist_ok=True)
    salida.write_text(json.dumps(gemelo, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return {"ejecutado": True, "terreno": sorted(zonas) if zonas else None, "teselas": n_teselas, "dem_bytes": peso,
            "anios": anios, "ndvi_meses": len(ndvi["meses"]) if ndvi else 0, "avisos": avisos}


if __name__ == "__main__":
    print(json.dumps(construir(), ensure_ascii=False, indent=1))
