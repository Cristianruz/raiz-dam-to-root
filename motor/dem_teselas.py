# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Teselas de relieve (NASADEM, 30 m) para la vista 3D del gemelo digital.

Decisión: docs/decisiones/2026-11-14_gemelo_digital.md. Lee los ráster ya validados por
motor/ensamblar.py y escribe teselas PNG de 256 px en codificación Terrarium:
  data/processed/nasadem_zona_piloto.tif          -> web/data/dem/delicias_saucillo/{z}/{x}/{y}.png
  data/processed/nasadem_zona_piloto_<zona>.tif   -> web/data/dem/<zona>/{z}/{x}/{y}.png
  (y, por zona, web/data/dem/<zona>/origen.json: de qué .tif salieron, con qué opciones y la
   lista de teselas, con rutas relativas a esa carpeta)
Terrarium: elevación en metros = R*256 + G + B/256 − 32768.

Por qué se versionan: rasterio NO está en GitHub Actions (requirements.txt solo trae pytest).
Las teselas se generan una vez, donde sí hay rasterio (pip install -r requirements-datos.txt),
y se guardan como archivos estáticos. `python construir.py` no las regenera: solo las lee
(motor/gemelo_web.py) y las prueba (tests/test_gemelo_motor.py).

Cómo se hacen:
- Zooms: params.gemelo.dem (minzoom..maxzoom). Solo las teselas que intersectan el rectángulo
  de la zona (params.zona_piloto.zonas), con la misma regla que usa MapLibre para decidir qué
  teselas caen dentro de los `bounds` de una fuente (así no pide ninguna que no exista).
  MapLibre dibuja el relieve con teselas de un nivel menos que el zoom del mapa: por eso el
  mínimo baja hasta donde la zona completa todavía cabe en un teléfono (nota de params.gemelo.dem).
- Remuestreo: rasterio.warp.reproject a EPSG:3857, bilinear, un mosaico por zoom.
- Fuera de la cobertura del ráster se repite la elevación válida más cercana (extensión del
  borde). Nunca se rellena con 0: dejaría un acantilado en la vista 3D.
- La elevación se guarda en pasos de 1/PASOS_POR_METRO m (el ráster trae metros enteros): las
  teselas pesan la mitad que con 1/256 m y la diferencia no se ve.
- Determinista: la misma entrada da los mismos bytes (PNG escrito aquí con zlib, sin fechas).
- Si falta rasterio o falta el .tif de una zona, lo dice y NO toca las teselas que ya existen.

API (para motor/gemelo_web.py y las pruebas; todo lo de esta lista usa solo la biblioteca estándar):
  generar(processed, web, params_ruta, zonas=None) -> resumen   (esta sí necesita rasterio)
  teselas_de_bbox(bbox, minzoom, maxzoom) -> [(z, x, y), …]   bbox = [oeste, sur, este, norte]
  limites_tesela(z, x, y) -> (oeste, sur, este, norte) en grados
  centro_de_pixel(z, x, y, columna, fila) -> (lon, lat)
  leer_tesela(ruta) -> filas de elevaciones en metros;  rango_tesela(ruta) -> (mín, máx)
  leer_png_rgb(ruta) -> (ancho, alto, filas RGB);  rango_de_filas(filas) -> (mín, máx)
  ruta_tif(processed, zona), sha256_archivo(ruta), sha256_teselas(carpeta, teselas)

Uso:  python motor/dem_teselas.py            (todas las zonas)
      python motor/dem_teselas.py --zona lazaro_cardenas
"""
import argparse
import hashlib
import json
import math
import struct
import sys
import zlib
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
ZONA_POR_OMISION = "delicias_saucillo"  # el .tif sin sufijo (docs/decisiones/2026-11-14_dos_zonas.md)
LADO = 256                # píxeles por lado de tesela (tileSize del contrato de gemelo.json)
CODIFICACION = "terrarium"
PASOS_POR_METRO = 4       # la elevación se guarda en pasos de 1/4 m; debe dividir a 256
SIN_DATO = -32768.0       # marca interna del remuestreo: Terrarium no puede guardar nada menor
RADIO_M = 6378137.0       # radio de la esfera de Web Mercator (EPSG:3857)
FIRMA_PNG = b"\x89PNG\r\n\x1a\n"


def leer_json(p):
    return json.loads(Path(p).read_text(encoding="utf-8"))


# --- Cuentas de teselas XYZ (Web Mercator) --------------------------------------------
def fraccion_x(lon):
    """Longitud -> posición horizontal en el mundo de Web Mercator, de 0 (oeste) a 1 (este)."""
    return (lon + 180.0) / 360.0


def fraccion_y(lat):
    """Latitud -> posición vertical en el mundo de Web Mercator, de 0 (norte) a 1 (sur)."""
    return (180.0 - math.degrees(math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)))) / 360.0


def rango_de_teselas(bbox, z):
    """(x0, y0, x1, y1) de las teselas del zoom z que intersectan bbox = [oeste, sur, este, norte].
    Es la regla de MapLibre para los `bounds` de una fuente: floor en oeste y norte, ceil en este y sur."""
    oeste, sur, este, norte = bbox
    n = 2 ** z
    x0, y0 = math.floor(fraccion_x(oeste) * n), math.floor(fraccion_y(norte) * n)
    x1, y1 = math.ceil(fraccion_x(este) * n) - 1, math.ceil(fraccion_y(sur) * n) - 1
    return x0, y0, max(x0, x1), max(y0, y1)


def teselas_de_bbox(bbox, minzoom, maxzoom):
    """Lista ordenada de (z, x, y) que intersectan el rectángulo, para todos los zooms pedidos."""
    lista = []
    for z in range(minzoom, maxzoom + 1):
        x0, y0, x1, y1 = rango_de_teselas(bbox, z)
        lista += [(z, x, y) for x in range(x0, x1 + 1) for y in range(y0, y1 + 1)]
    return lista


def _lon(fx):
    return fx * 360.0 - 180.0


def _lat(fy):
    return math.degrees(2 * math.atan(math.exp(math.pi * (1 - 2 * fy))) - math.pi / 2)


def limites_tesela(z, x, y):
    """(oeste, sur, este, norte) de la tesela, en grados."""
    n = 2 ** z
    return _lon(x / n), _lat((y + 1) / n), _lon((x + 1) / n), _lat(y / n)


def centro_de_pixel(z, x, y, columna, fila):
    """(lon, lat) del centro del píxel (columna, fila) de la tesela; (0, 0) es la esquina noroeste."""
    n = 2 ** z
    return _lon((x + (columna + 0.5) / LADO) / n), _lat((y + (fila + 0.5) / LADO) / n)


def ruta_tesela(carpeta_zona, z, x, y):
    return Path(carpeta_zona) / str(z) / str(x) / f"{y}.png"


# --- PNG de 8 bits RGB con la biblioteca estándar ---------------------------------------
def _trozo(tipo, cuerpo):
    return struct.pack(">I", len(cuerpo)) + tipo + cuerpo + struct.pack(">I", zlib.crc32(tipo + cuerpo))


def png_rgb(ancho, alto, lineas):
    """Bytes de un PNG RGB de 8 bits. `lineas` = alto × (1 byte de filtro + ancho × 3 bytes), ya filtradas."""
    if len(lineas) != alto * (1 + ancho * 3):
        raise ValueError("png_rgb: el tamaño de las líneas no corresponde a ancho × alto")
    return (FIRMA_PNG + _trozo(b"IHDR", struct.pack(">IIBBBBB", ancho, alto, 8, 2, 0, 0, 0))
            + _trozo(b"IDAT", zlib.compress(lineas, 9)) + _trozo(b"IEND", b""))


def _quitar_filtro(tipo, linea, previa, paso=3):
    """Deshace el filtro de una línea de PNG (tipos 0 a 4 de la especificación)."""
    if tipo == 0:
        return linea
    if tipo == 2:  # Up: el que escribe este módulo
        return bytes((a + b) & 255 for a, b in zip(linea, previa))
    sal = bytearray(linea)
    for i in range(len(sal)):
        izq = sal[i - paso] if i >= paso else 0
        arriba = previa[i]
        if tipo == 1:
            pred = izq
        elif tipo == 3:
            pred = (izq + arriba) >> 1
        elif tipo == 4:  # Paeth
            diag = previa[i - paso] if i >= paso else 0
            p = izq + arriba - diag
            da, db, dc = abs(p - izq), abs(p - arriba), abs(p - diag)
            pred = izq if (da <= db and da <= dc) else (arriba if db <= dc else diag)
        else:
            raise ValueError(f"filtro de PNG desconocido: {tipo}")
        sal[i] = (sal[i] + pred) & 255
    return bytes(sal)


def leer_png_rgb(ruta):
    """(ancho, alto, filas) de un PNG RGB de 8 bits sin entrelazar; cada fila son ancho × 3 bytes."""
    datos = Path(ruta).read_bytes()
    if datos[:8] != FIRMA_PNG:
        raise ValueError(f"{ruta}: no es un PNG")
    pos, cabecera, comprimido = 8, None, []
    while pos + 8 <= len(datos):
        largo, tipo = struct.unpack(">I4s", datos[pos:pos + 8])
        cuerpo = datos[pos + 8:pos + 8 + largo]
        if tipo == b"IHDR":
            cabecera = struct.unpack(">IIBBBBB", cuerpo)
        elif tipo == b"IDAT":
            comprimido.append(cuerpo)
        elif tipo == b"IEND":
            break
        pos += 12 + largo
    if cabecera is None:
        raise ValueError(f"{ruta}: PNG sin cabecera")
    ancho, alto, bits, color, _, _, entrelazado = cabecera
    if (bits, color, entrelazado) != (8, 2, 0):
        raise ValueError(f"{ruta}: se esperaba un PNG RGB de 8 bits sin entrelazar")
    crudo = zlib.decompress(b"".join(comprimido))
    largo_linea = 1 + ancho * 3
    if len(crudo) != alto * largo_linea:
        raise ValueError(f"{ruta}: los datos del PNG no corresponden a su tamaño")
    filas, previa = [], bytes(ancho * 3)
    for f in range(alto):
        inicio = f * largo_linea
        previa = _quitar_filtro(crudo[inicio], crudo[inicio + 1:inicio + largo_linea], previa)
        filas.append(previa)
    return ancho, alto, filas


# --- Terrarium --------------------------------------------------------------------------
def elevacion_de_rgb(r, g, b):
    """Elevación en metros de un píxel Terrarium."""
    return r * 256 + g + b / 256 - 32768


def leer_tesela(ruta):
    """Filas de elevaciones (m) de una tesela Terrarium; [fila][columna], la fila 0 es el norte."""
    _, _, filas = leer_png_rgb(ruta)
    return [[elevacion_de_rgb(r, g, b) for r, g, b in zip(f[0::3], f[1::3], f[2::3])] for f in filas]


def rango_de_filas(filas):
    """(mínimo, máximo) de elevación, en metros, de las filas RGB de una tesela. No convierte cada
    píxel: comparar los tres bytes R, G, B en orden es comparar elevaciones."""
    pixeles = [f[i:i + 3] for f in filas for i in range(0, len(f), 3)]
    return elevacion_de_rgb(*min(pixeles)), elevacion_de_rgb(*max(pixeles))


def rango_tesela(ruta):
    """(mínimo, máximo) de elevación de una tesela, en metros."""
    return rango_de_filas(leer_png_rgb(ruta)[2])


# --- De qué archivo salieron ----------------------------------------------------------------
def ruta_tif(processed, zona):
    """Ráster de la zona: sin sufijo para la zona por omisión, con sufijo _<zona> para las demás."""
    sufijo = "" if zona == ZONA_POR_OMISION else f"_{zona}"
    return Path(processed) / f"nasadem_zona_piloto{sufijo}.tif"


def sha256_archivo(ruta):
    return hashlib.sha256(Path(ruta).read_bytes()).hexdigest()


def sha256_teselas(carpeta_zona, teselas):
    """Huella del juego completo de teselas de una zona (nombre y bytes de cada una, en orden)."""
    h = hashlib.sha256()
    for z, x, y in sorted(teselas):
        h.update(f"{z}/{x}/{y}.png\n".encode("ascii"))
        h.update(ruta_tesela(carpeta_zona, z, x, y).read_bytes())
    return h.hexdigest()


# --- Generación (necesita rasterio y numpy) -------------------------------------------------
def _mosaico(np, reproject, Resampling, from_bounds, origen, transformada, crs, sin_dato_origen, z, rango):
    """Elevaciones (float32) de todas las teselas del zoom z juntas, ya con el borde extendido."""
    x0, y0, x1, y1 = rango
    nx, ny = x1 - x0 + 1, y1 - y0 + 1
    mitad = math.pi * RADIO_M
    lado_m = 2 * mitad / 2 ** z                       # ancho de una tesela en metros de Web Mercator
    oeste, norte = -mitad + x0 * lado_m, mitad - y0 * lado_m
    destino = np.full((ny * LADO, nx * LADO), SIN_DATO, dtype="float32")
    reproject(origen, destino, src_transform=transformada, src_crs=crs, src_nodata=sin_dato_origen,
              dst_transform=from_bounds(oeste, norte - ny * lado_m, oeste + nx * lado_m, norte, nx * LADO, ny * LADO),
              dst_crs="EPSG:3857", dst_nodata=SIN_DATO, resampling=Resampling.bilinear)
    valido = destino != SIN_DATO
    if not valido.any():
        raise ValueError(f"zoom {z}: el ráster no cubre ninguna tesela del rectángulo de la zona")
    filas, columnas = np.where(valido.any(axis=1))[0], np.where(valido.any(axis=0))[0]
    f0, f1, c0, c1 = filas[0], filas[-1], columnas[0], columnas[-1]
    if not valido[f0:f1 + 1, c0:c1 + 1].all():
        raise ValueError(f"zoom {z}: el ráster tiene huecos sin dato; este script solo extiende el borde de un rectángulo")
    # Extensión del borde: cada píxel de fuera copia el píxel válido más cercano (se recorta el índice).
    ii = np.clip(np.arange(destino.shape[0]), f0, f1)
    jj = np.clip(np.arange(destino.shape[1]), c0, c1)
    return destino[np.ix_(ii, jj)]


def _png_terrarium(np, elev):
    """PNG Terrarium de un bloque LADO × LADO de elevaciones (m). Filtro Up en todas las líneas."""
    # Elevación + 32768, redondeada al paso; en unidades de 1/256 m cabe en tres bytes: R, G, B.
    v = np.rint((elev.astype("float64") + 32768.0) * PASOS_POR_METRO).astype(np.int64) * (256 // PASOS_POR_METRO)
    if v.min() < 0 or v.max() >= 1 << 24:
        raise ValueError("elevación fuera de lo que Terrarium puede guardar")
    rgb = np.stack([(v >> 16) & 255, (v >> 8) & 255, v & 255], axis=-1).astype(np.uint8).reshape(LADO, LADO * 3)
    lineas = np.empty((LADO, 1 + LADO * 3), dtype=np.uint8)
    lineas[:, 0] = 2                       # filtro Up: cada línea guarda la diferencia con la de arriba
    lineas[0, 1:] = rgb[0]
    lineas[1:, 1:] = rgb[1:] - rgb[:-1]    # uint8: la resta da la vuelta sola (módulo 256)
    return png_rgb(LADO, LADO, lineas.tobytes())


def _generar_zona(mods, zona, tif, carpeta, minzoom, maxzoom):
    """Calcula en memoria todas las teselas de la zona y solo entonces escribe. Devuelve su resumen."""
    np, rasterio, reproject, Resampling, from_bounds = mods
    with rasterio.open(tif) as ds:
        origen = ds.read(1).astype("float32")
        transformada, crs, sin_dato = ds.transform, ds.crs, ds.nodata
    nuevas = {}
    for z in range(minzoom, maxzoom + 1):
        rango = rango_de_teselas(zona["bbox"], z)
        mosaico = _mosaico(np, reproject, Resampling, from_bounds, origen, transformada, crs, sin_dato, z, rango)
        for x in range(rango[0], rango[2] + 1):
            for y in range(rango[1], rango[3] + 1):
                f, c = (y - rango[1]) * LADO, (x - rango[0]) * LADO
                nuevas[(z, x, y)] = _png_terrarium(np, mosaico[f:f + LADO, c:c + LADO])
    # Escritura: solo lo que cambió; después se quitan las teselas que ya no corresponden.
    escritas = 0
    for (z, x, y), datos in nuevas.items():
        ruta = ruta_tesela(carpeta, z, x, y)
        if not ruta.exists() or ruta.read_bytes() != datos:
            ruta.parent.mkdir(parents=True, exist_ok=True)
            ruta.write_bytes(datos)
            escritas += 1
    esperadas = {ruta_tesela(carpeta, z, x, y) for z, x, y in nuevas}
    sobrantes = [p for p in carpeta.rglob("*.png") if p not in esperadas]
    for p in sobrantes:
        p.unlink()
    for d in sorted((d for d in carpeta.rglob("*") if d.is_dir()), reverse=True):
        if not any(d.iterdir()):
            d.rmdir()
    origen_json = {
        "_encabezado": ENCABEZADO,
        "_nota": "Lo escribe motor/dem_teselas.py; no se edita a mano. Dice de qué ráster salieron las teselas "
                 "de esta carpeta; tests/test_gemelo_motor.py lo compara con el .tif y con las teselas.",
        "zona": zona["id"],
        "origen": {"archivo": f"data/processed/{tif.name}", "sha256": sha256_archivo(tif)},
        "encoding": CODIFICACION, "tileSize": LADO, "minzoom": minzoom, "maxzoom": maxzoom,
        "bbox": zona["bbox"],
        "paso_vertical_m": 1 / PASOS_POR_METRO,
        "remuestreo": "bilinear (rasterio.warp.reproject a EPSG:3857); fuera del ráster se extiende el borde",
        "generado_con": {"rasterio": rasterio.__version__, "gdal": rasterio.__gdal_version__, "numpy": np.__version__},
        # Rutas relativas a esta carpeta: sirven para guardar el relieve sin conexión sin repetir las cuentas.
        "teselas": [f"{z}/{x}/{y}.png" for z, x, y in sorted(nuevas)],
        "sha256_teselas": sha256_teselas(carpeta, nuevas),
    }
    (carpeta / "origen.json").write_text(json.dumps(origen_json, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return {"generada": True, "teselas": len(nuevas), "escritas": escritas, "sin_cambio": len(nuevas) - escritas,
            "borradas": len(sobrantes), "bytes": sum(len(d) for d in nuevas.values())}


def generar(processed=RAIZ / "data/processed", web=RAIZ / "web/data", params_ruta=RAIZ / "data/params.json", zonas=None):
    """Genera las teselas de las zonas de params (o solo las de `zonas`, lista de id).
    Devuelve {"ejecutado": bool, "zonas": {id: resumen}, …}. Nunca borra teselas si no pudo generar."""
    processed, web = Path(processed), Path(web)
    params = leer_json(params_ruta)
    dem = ((params.get("gemelo") or {}).get("dem") or {}).get("valor")
    if not dem:
        return {"ejecutado": False, "motivo": "data/params.json no tiene gemelo.dem (minzoom y maxzoom); "
                                              "las teselas existentes no se tocan"}
    try:
        import numpy as np
        import rasterio
        from rasterio.transform import from_bounds
        from rasterio.warp import Resampling, reproject
    except ImportError as e:
        return {"ejecutado": False, "motivo": f"falta rasterio ({e}); instale con «pip install -r requirements-datos.txt». "
                                              "Las teselas existentes no se tocan"}
    mods = (np, rasterio, reproject, Resampling, from_bounds)
    resumen = {}
    for zona in params["zona_piloto"]["zonas"]["valor"]:
        if zonas and zona["id"] not in zonas:
            continue
        tif = ruta_tif(processed, zona["id"])
        if not tif.exists():
            resumen[zona["id"]] = {"generada": False, "motivo": f"falta {tif.name} en {processed}; "
                                                               "las teselas existentes no se tocan"}
            continue
        try:
            resumen[zona["id"]] = _generar_zona(mods, zona, tif, web / "dem" / zona["id"], dem["minzoom"], dem["maxzoom"])
        except Exception as e:  # ráster ilegible, sin cobertura o con huecos: se informa y no se toca nada
            resumen[zona["id"]] = {"generada": False, "motivo": f"{tif.name}: {e}; las teselas existentes no se tocan"}
    hechas = [r for r in resumen.values() if r["generada"]]
    return {"ejecutado": bool(hechas), "zonas": resumen, "minzoom": dem["minzoom"], "maxzoom": dem["maxzoom"],
            "bytes": sum(r["bytes"] for r in hechas)}


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Teselas Terrarium de NASADEM para la vista 3D del gemelo.")
    ap.add_argument("--zona", action="append", help="id de zona (se puede repetir); por omisión, todas")
    r = generar(zonas=ap.parse_args().zona)
    print(json.dumps(r, ensure_ascii=False, indent=1))
    todas = r.get("zonas") and all(z["generada"] for z in r["zonas"].values())
    sys.exit(0 if r["ejecutado"] and todas else 1)
