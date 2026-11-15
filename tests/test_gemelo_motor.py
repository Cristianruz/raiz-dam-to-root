# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Pruebas del motor del gemelo digital (docs/decisiones/2026-11-14_gemelo_digital.md), sin red.

Qué se comprueba:
1. web/data/gemelo.json cumple el contrato de la decisión, sus valores de diseño son los de
   data/params.json (bloque «gemelo») y coincide con lo que motor/gemelo_web.py escribe hoy.
2. Cada tesela de relieve declarada existe, mide 256 px y decodifica (Terrarium) a elevaciones
   dentro de [elev_min_m, elev_max_m]; ningún píxel vale 0 ni queda más de 50 m bajo el mínimo
   (eso sería un acantilado en la vista 3D).
3. Las teselas salieron del ráster que hoy está en data/processed (huella en origen.json).
4. Con rasterio (no está en GitHub Actions: esas pruebas se marcan «skip» con su motivo): cinco
   puntos de una tesela coinciden con el ráster; regenerar da los mismos bytes; fuera del ráster la tesela
   queda plana (mediana del borde del ráster) tras una rampa, sin estrías ni escalón (revisión I16).
5. motor/dem_teselas.py no borra teselas cuando falta rasterio o falta el .tif.
6. web/data/ndvi_mensual.json: una serie por parcela de parcelas.geojson, valores en [−1, 1] o
   null, y coincide con el CSV de HLS.
Lo que se escribe va a tmp_path: estas pruebas no tocan web/data.
"""
import csv
import json
import math
import shutil
import sys
import zlib
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "motor"))
import dem_teselas  # noqa: E402
import gemelo_web  # noqa: E402
import ndvi_web  # noqa: E402

WEB = RAIZ / "web/data"
PROCESSED = RAIZ / "data/processed"
PARAMS_RUTA = RAIZ / "data/params.json"
DECISION = "docs/decisiones/2026-11-14_gemelo_digital.md"
META = {"_encabezado", "_nota"}          # claves de la regla 4; la página no las usa
TOLERANCIA_M = 0.01                      # gemelo.json guarda las elevaciones con 2 decimales
MOTIVO_SIN_RASTERIO = ("rasterio no está instalado (solo hace falta para regenerar teselas: "
                       "pip install -r requirements-datos.txt)")


def leer(ruta):
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def params():
    return leer(PARAMS_RUTA)


@pytest.fixture(scope="module")
def gemelo():
    ruta = WEB / "gemelo.json"
    assert ruta.exists(), "falta web/data/gemelo.json: corra python motor/gemelo_web.py"
    return leer(ruta)


@pytest.fixture(scope="module")
def zonas_params(params):
    return {z["id"]: z for z in params["zona_piloto"]["zonas"]["valor"]}


@pytest.fixture(scope="module")
def teselas(gemelo, zonas_params):
    """{zona: {(z, x, y): (mínimo, máximo, hay_cero)}}: cada tesela declarada se decodifica una vez."""
    t = gemelo["terreno"]
    if t is None:
        pytest.skip("gemelo.json dice «terreno»: null (no hay teselas de relieve)")
    cero = bytes([128, 0, 0])            # Terrarium: R=128, G=0, B=0 es elevación 0
    resultado = {}
    for zid, bloque in t["zonas"].items():
        resultado[zid] = {}
        for z, x, y in dem_teselas.teselas_de_bbox(bloque["bounds"], t["minzoom"], t["maxzoom"]):
            ruta = WEB.parent / bloque["teselas"].format(z=z, x=x, y=y)
            assert ruta.exists(), f"tesela declarada que no existe: {ruta.relative_to(RAIZ)}"
            ancho, alto, filas = dem_teselas.leer_png_rgb(ruta)
            assert (ancho, alto) == (t["tileSize"], t["tileSize"]), f"{ruta.name}: {ancho} × {alto} px"
            minimo, maximo = dem_teselas.rango_de_filas(filas)
            hay_cero = any(f[i:i + 3] == cero for f in filas for i in range(0, len(f), 3))
            resultado[zid][(z, x, y)] = (minimo, maximo, hay_cero)
    return resultado


# --- 1. Contrato de gemelo.json -----------------------------------------------------------
def test_gemelo_cumple_el_contrato(gemelo, zonas_params):
    assert set(gemelo) - META == {"terreno", "columnas", "camara", "tiempo", "ndvi", "zona_inicial"}
    assert gemelo["zona_inicial"] is None or gemelo["zona_inicial"] in zonas_params
    assert gemelo["_encabezado"].startswith("AI-assisted (Claude Code)")
    t = gemelo["terreno"]
    if t is not None:
        assert set(t) == {"encoding", "tileSize", "minzoom", "maxzoom", "zonas", "exageracion", "fuente", "rotulo"}
        assert t["encoding"] == "terrarium" and t["tileSize"] == 256
        assert isinstance(t["minzoom"], int) and isinstance(t["maxzoom"], int) and t["minzoom"] <= t["maxzoom"]
        assert t["zonas"], "terreno sin zonas debe ser null"
        assert t["fuente"] == "NASADEM (NASA/NASADEM_HGT/001), 30 m, vía Google Earth Engine"
        assert t["rotulo"] == "regional, 30 m (NASADEM); vertical exaggeration applied"
        for zid, b in t["zonas"].items():
            assert zid in zonas_params, f"zona {zid} fuera de params.zona_piloto.zonas"
            assert set(b) == {"teselas", "bounds", "elev_min_m", "elev_max_m", "exageracion"}
            assert isinstance(b["exageracion"], (int, float)) and b["exageracion"] > 0, zid
            assert b["teselas"] == f"data/dem/{zid}/{{z}}/{{x}}/{{y}}.png"
            assert b["bounds"] == zonas_params[zid]["bbox"], "bounds debe ser el rectángulo de la zona en params"
            assert b["elev_min_m"] < b["elev_max_m"]
    assert set(gemelo["columnas"]) == {"metros_por_millar", "nota", "etiqueta"}
    assert set(gemelo["camara"]) == {"pitch", "bearing"}
    tiempo = gemelo["tiempo"]
    assert set(tiempo) == {"anios", "intervalo_ms", "destacados"}
    for d in tiempo["destacados"].values():
        assert set(d) == {"texto", "fuente", "etiqueta"} and d["texto"] and d["fuente"]
    if gemelo["ndvi"] is not None:
        assert set(gemelo["ndvi"]) == {"archivo", "fuente", "meses"}
        assert gemelo["ndvi"]["archivo"] == "data/ndvi_mensual.json"


def test_valores_de_diseno_son_los_de_params(gemelo, params):
    g = params["gemelo"]
    if gemelo["terreno"] is not None:
        assert gemelo["terreno"]["exageracion"] == g["exageracion_vertical"]["valor"]
        por_zona = g.get("exageracion_por_zona", {}).get("valor", {})
        for zid, b in gemelo["terreno"]["zonas"].items():
            # La de la zona si params la trae; si no, la general (respaldo).
            assert b["exageracion"] == por_zona.get(zid, g["exageracion_vertical"]["valor"]), zid
        assert gemelo["terreno"]["minzoom"] == g["dem"]["valor"]["minzoom"]
        assert gemelo["terreno"]["maxzoom"] == g["dem"]["valor"]["maxzoom"]
    assert gemelo["columnas"] == {"metros_por_millar": g["metros_por_millar"]["valor"],
                                  "nota": g["metros_por_millar"]["nota_web"], "etiqueta": "Diseño"}
    assert gemelo["camara"] == g["camara"]["valor"]
    assert gemelo["tiempo"]["intervalo_ms"] == g["reproduccion_intervalo_ms"]["valor"]
    assert gemelo["zona_inicial"] == g["zona_inicial"]["valor"]
    d = g["anio_destacado"]
    assert gemelo["tiempo"]["destacados"] == {str(d["valor"]): {"texto": d["texto"], "fuente": d["fuente"],
                                                                "etiqueta": d["etiqueta"]}}


def test_params_gemelo_declara_fuente_y_etiqueta(params):
    g = params["gemelo"]
    for clave in ("exageracion_vertical", "metros_por_millar", "camara", "reproduccion_intervalo_ms", "dem",
                  "exageracion_por_zona", "zona_inicial"):
        e = g[clave]
        assert e["etiqueta"] == "Diseño" and e["fuente"] == f"Decisión {DECISION}", clave
        assert e["valor"] is not None and e["unidad"] and e["nota"], clave
    d = g["anio_destacado"]
    assert d["etiqueta"] == "[P]" and d["fuente"].startswith("S9 §2") and d["unidad"] and d["nota"]
    # Regla 10 de CLAUDE.md en los textos que llegan a la página.
    for texto in (d["texto"], g["metros_por_millar"]["nota_web"]):
        palabras = texto.lower().replace(":", " ").replace(".", " ").replace(",", " ").split()
        assert "first" not in palabras and "only" not in palabras, texto


def test_exageracion_por_zona_sigue_el_desnivel(gemelo, params, zonas_params):
    """Diseño: con más desnivel, menos exageración, para que el relieve exagerado de cada zona se lea parecido
    (Lázaro Cárdenas tiene cerca de tres veces el desnivel de Delicias–Saucillo)."""
    por_zona = params["gemelo"]["exageracion_por_zona"]["valor"]
    assert set(por_zona) <= set(zonas_params), "exageracion_por_zona nombra una zona que no está en params"
    if gemelo["terreno"] is None:
        pytest.skip("sin terreno")
    zonas = gemelo["terreno"]["zonas"]
    desnivel = {zid: b["elev_max_m"] - b["elev_min_m"] for zid, b in zonas.items()}
    for a in zonas:
        for b in zonas:
            if desnivel[a] > desnivel[b]:
                assert zonas[a]["exageracion"] <= zonas[b]["exageracion"], (a, b)


def test_exageracion_y_zona_inicial_con_respaldo(tmp_path, params):
    """Sin exageracion_por_zona cada zona lleva la general; una zona_inicial desconocida queda en null con aviso."""
    import copy
    p = copy.deepcopy(params)
    p["gemelo"].pop("exageracion_por_zona")
    p["gemelo"]["zona_inicial"]["valor"] = "zona_que_no_existe"
    ruta = tmp_path / "params.json"
    ruta.write_text(json.dumps(p), encoding="utf-8")
    web = tmp_path / "web"
    shutil.copytree(WEB / "dem", web / "dem")
    shutil.copy(WEB / "parcelas.geojson", web / "parcelas.geojson")
    r = gemelo_web.construir(web=web, params_ruta=ruta, processed=PROCESSED)
    g = leer(web / "gemelo.json")
    assert g["zona_inicial"] is None and any("zona_inicial" in a for a in r["avisos"]), r["avisos"]
    if g["terreno"] is not None:
        assert all(b["exageracion"] == p["gemelo"]["exageracion_vertical"]["valor"] for b in g["terreno"]["zonas"].values())


def test_anios_son_los_de_la_memoria(gemelo):
    geo = leer(WEB / "parcelas.geojson")
    anios = {m["anio"] for f in geo["features"] for m in (f["properties"].get("memoria") or [])}
    assert gemelo["tiempo"]["anios"] == [min(anios), max(anios)]
    for anio in gemelo["tiempo"]["destacados"]:
        assert min(anios) <= int(anio) <= max(anios), "el año destacado debe estar en la línea de tiempo"


def test_gemelo_y_ndvi_estan_al_dia(tmp_path):
    """Lo versionado en web/data es lo que los scripts escriben hoy con params y las entregas actuales."""
    web = tmp_path / "web"
    web.mkdir()
    shutil.copy(WEB / "parcelas.geojson", web / "parcelas.geojson")
    if (WEB / "dem").exists():
        shutil.copytree(WEB / "dem", web / "dem")
    r = gemelo_web.construir(web=web, params_ruta=PARAMS_RUTA, processed=PROCESSED)
    assert r["ejecutado"] and r["avisos"] == [], r
    for nombre in ("gemelo.json", "ndvi_mensual.json"):
        assert (web / nombre).read_bytes() == (WEB / nombre).read_bytes(), \
            f"web/data/{nombre} no está al día: corra python motor/gemelo_web.py"


# --- 2. Teselas de relieve ----------------------------------------------------------------
def test_cada_tesela_declarada_existe_y_esta_en_su_rango(gemelo, teselas):
    for zid, por_tesela in teselas.items():
        b = gemelo["terreno"]["zonas"][zid]
        assert por_tesela, f"{zid}: sin teselas"
        for (z, x, y), (minimo, maximo, _) in por_tesela.items():
            assert b["elev_min_m"] - TOLERANCIA_M <= minimo <= maximo <= b["elev_max_m"] + TOLERANCIA_M, \
                f"{zid} {z}/{x}/{y}: {minimo}–{maximo} m fuera de [{b['elev_min_m']}, {b['elev_max_m']}]"
        # elev_min_m y elev_max_m son exactamente el mínimo y el máximo de las teselas.
        assert abs(min(m for m, _, _ in por_tesela.values()) - b["elev_min_m"]) <= TOLERANCIA_M
        assert abs(max(m for _, m, _ in por_tesela.values()) - b["elev_max_m"]) <= TOLERANCIA_M


def test_sin_acantilados(gemelo, teselas):
    """Ningún píxel con elevación 0 (relleno) ni más de 50 m por debajo del mínimo de la zona."""
    for zid, por_tesela in teselas.items():
        piso = gemelo["terreno"]["zonas"][zid]["elev_min_m"] - 50
        for (z, x, y), (minimo, _, hay_cero) in por_tesela.items():
            assert not hay_cero, f"{zid} {z}/{x}/{y}: hay píxeles con elevación 0"
            assert minimo >= piso, f"{zid} {z}/{x}/{y}: {minimo} m queda bajo {piso} m"


def test_no_sobran_teselas(gemelo):
    """En cada carpeta de zona están las teselas declaradas y ninguna más (ni zooms de otra corrida)."""
    if gemelo["terreno"] is None:
        pytest.skip("sin terreno")
    t = gemelo["terreno"]
    for zid, b in t["zonas"].items():
        esperadas = {f"{z}/{x}/{y}.png" for z, x, y in dem_teselas.teselas_de_bbox(b["bounds"], t["minzoom"], t["maxzoom"])}
        presentes = {p.relative_to(WEB / "dem" / zid).as_posix() for p in (WEB / "dem" / zid).rglob("*.png")}
        assert presentes == esperadas


def test_origen_coincide_con_el_raster_y_con_las_teselas(gemelo):
    """origen.json: huella del .tif de data/processed y del juego de teselas. Si falla, el ráster cambió
    (o alguien tocó una tesela) y hay que regenerar: python motor/dem_teselas.py y python motor/gemelo_web.py."""
    if gemelo["terreno"] is None:
        pytest.skip("sin terreno")
    t = gemelo["terreno"]
    for zid, b in t["zonas"].items():
        origen = leer(WEB / "dem" / zid / "origen.json")
        assert origen["_encabezado"].startswith("AI-assisted (Claude Code)")
        assert (origen["zona"], origen["bbox"]) == (zid, b["bounds"])
        assert (origen["encoding"], origen["tileSize"], origen["minzoom"], origen["maxzoom"]) == \
               (t["encoding"], t["tileSize"], t["minzoom"], t["maxzoom"])
        lista = dem_teselas.teselas_de_bbox(b["bounds"], t["minzoom"], t["maxzoom"])
        assert origen["teselas"] == [f"{z}/{x}/{y}.png" for z, x, y in sorted(lista)]
        assert origen["sha256_teselas"] == dem_teselas.sha256_teselas(WEB / "dem" / zid, lista), \
            f"{zid}: las teselas no son las que anota origen.json"
        tif = dem_teselas.ruta_tif(PROCESSED, zid)
        assert origen["origen"]["archivo"] == f"data/processed/{tif.name}"
        if tif.exists():
            assert origen["origen"]["sha256"] == dem_teselas.sha256_archivo(tif), \
                f"{zid}: {tif.name} cambió después de generar las teselas"


def test_fuente_del_terreno_coincide_con_fuentes_json(gemelo):
    """El texto fijo del contrato no contradice lo que declara la entrega del ráster."""
    ruta = PROCESSED / "fuentes.json"
    if gemelo["terreno"] is None or not ruta.exists():
        pytest.skip("sin terreno o sin data/processed/fuentes.json")
    por_archivo = {f["archivo"]: f["fuente"] for f in leer(ruta)["fuentes"]}
    for zid in gemelo["terreno"]["zonas"]:
        fuente = por_archivo.get(dem_teselas.ruta_tif(PROCESSED, zid).name)
        if fuente is None:
            continue
        for parte in ("NASADEM (NASA/NASADEM_HGT/001)", "30 m", "Google Earth Engine"):
            assert parte in fuente and parte in gemelo["terreno"]["fuente"], (zid, parte)


def test_regla_de_teselas_es_la_de_maplibre():
    """floor en oeste y norte, ceil en este y sur: las teselas que MapLibre pide dentro de `bounds`."""
    z = 10
    oeste, sur, este, norte = dem_teselas.limites_tesela(z, 211, 428)
    # Un rectángulo estrictamente dentro de una tesela pide esa tesela y ninguna otra.
    dentro = [oeste + 0.01, sur + 0.01, este - 0.01, norte - 0.01]
    assert dem_teselas.teselas_de_bbox(dentro, z, z) == [(z, 211, 428)]
    # Si cruza al este y al sur, entran las vecinas; un zoom más y son cuatro veces más finas.
    cruza = [oeste + 0.01, sur - 0.01, este + 0.01, norte - 0.01]
    assert dem_teselas.teselas_de_bbox(cruza, z, z) == [(z, 211, 428), (z, 211, 429), (z, 212, 428), (z, 212, 429)]
    assert len(dem_teselas.teselas_de_bbox(dentro, z, z + 1)) > 1
    # El centro del píxel central cae en el centro de la tesela.
    lon, lat = dem_teselas.centro_de_pixel(z, 211, 428, 127.5, 127.5)
    assert oeste < lon < este and sur < lat < norte
    assert abs(lon - (oeste + este) / 2) < 1e-9


# --- PNG con la biblioteca estándar ---------------------------------------------------------
def _filtrar(tipo, fila, previa, paso=3):
    """Filtro de PNG «hacia adelante» (referencia para probar el lector)."""
    sal = bytearray()
    for i, v in enumerate(fila):
        izq = fila[i - paso] if i >= paso else 0
        arriba = previa[i]
        diag = previa[i - paso] if i >= paso else 0
        if tipo == 0:
            pred = 0
        elif tipo == 1:
            pred = izq
        elif tipo == 2:
            pred = arriba
        elif tipo == 3:
            pred = (izq + arriba) >> 1
        else:
            p = izq + arriba - diag
            da, db, dc = abs(p - izq), abs(p - arriba), abs(p - diag)
            pred = izq if (da <= db and da <= dc) else (arriba if db <= dc else diag)
        sal.append((v - pred) & 255)
    return bytes([tipo]) + bytes(sal)


def test_lector_de_png_entiende_los_cinco_filtros(tmp_path):
    ancho, alto = 7, 10
    filas = [bytes((f * 37 + i * 11 + (i % 3) * 50) & 255 for i in range(ancho * 3)) for f in range(alto)]
    lineas, previa = b"", bytes(ancho * 3)
    for f, fila in enumerate(filas):
        lineas += _filtrar(f % 5, fila, previa)
        previa = fila
    ruta = tmp_path / "a.png"
    ruta.write_bytes(dem_teselas.png_rgb(ancho, alto, lineas))
    assert dem_teselas.leer_png_rgb(ruta) == (ancho, alto, filas)
    # La suma de verificación de cada trozo es correcta (un navegador rechaza el PNG si no lo es).
    datos, pos = ruta.read_bytes(), 8
    while pos < len(datos):
        largo = int.from_bytes(datos[pos:pos + 4], "big")
        assert zlib.crc32(datos[pos + 4:pos + 8 + largo]) == int.from_bytes(datos[pos + 8 + largo:pos + 12 + largo], "big")
        pos += 12 + largo


def test_terrarium():
    assert dem_teselas.elevacion_de_rgb(128, 0, 0) == 0
    assert dem_teselas.elevacion_de_rgb(132, 126, 64) == 132 * 256 + 126 + 0.25 - 32768
    assert 256 % dem_teselas.PASOS_POR_METRO == 0


def test_lector_coincide_con_pillow(gemelo):
    """Otra biblioteca lee lo mismo que el lector propio (si Pillow está instalado)."""
    imagen = pytest.importorskip("PIL.Image", reason="Pillow no está instalado (no es obligatorio)")
    if gemelo["terreno"] is None:
        pytest.skip("sin terreno")
    ruta = sorted((WEB / "dem").rglob("*.png"))[0]
    _, _, filas = dem_teselas.leer_png_rgb(ruta)
    with imagen.open(ruta) as im:
        assert im.mode == "RGB" and im.tobytes() == b"".join(filas)


# --- 4. Con rasterio: contra el ráster ----------------------------------------------------
def _bilineal(banda, transformada, lon, lat):
    """Elevación del ráster en (lon, lat), interpolando entre los cuatro centros de celda vecinos."""
    px = (lon - transformada.c) / transformada.a - 0.5
    py = (lat - transformada.f) / transformada.e - 0.5
    x0, y0 = math.floor(px), math.floor(py)
    fx, fy = px - x0, py - y0
    return float(banda[y0][x0] * (1 - fx) * (1 - fy) + banda[y0][x0 + 1] * fx * (1 - fy)
                 + banda[y0 + 1][x0] * (1 - fx) * fy + banda[y0 + 1][x0 + 1] * fx * fy)


def test_cinco_puntos_de_una_tesela_coinciden_con_el_raster(gemelo, zonas_params):
    rasterio = pytest.importorskip("rasterio", reason=MOTIVO_SIN_RASTERIO)
    t = gemelo["terreno"]
    if t is None:
        pytest.skip("sin terreno")
    for zid, b in t["zonas"].items():
        tif = dem_teselas.ruta_tif(PROCESSED, zid)
        if not tif.exists():
            continue
        oeste, sur, este, norte = b["bounds"]
        z = t["maxzoom"]
        n = 2 ** z
        # La tesela del zoom máximo que contiene el centro del rectángulo de la zona.
        x = math.floor(dem_teselas.fraccion_x((oeste + este) / 2) * n)
        y = math.floor(dem_teselas.fraccion_y((sur + norte) / 2) * n)
        to, ts, te, tn = dem_teselas.limites_tesela(z, x, y)
        # Cinco puntos dentro de la tesela Y del rectángulo de la zona (ahí el ráster tiene dato).
        o, s, e, nn = max(oeste, to), max(sur, ts), min(este, te), min(norte, tn)
        elev = dem_teselas.leer_tesela(WEB.parent / b["teselas"].format(z=z, x=x, y=y))
        with rasterio.open(tif) as ds:
            banda, transformada = ds.read(1).astype("float64"), ds.transform
        for u, v in ((0.5, 0.5), (0.2, 0.2), (0.8, 0.2), (0.2, 0.8), (0.8, 0.8)):
            columna = math.floor((dem_teselas.fraccion_x(o + u * (e - o)) * n - x) * 256)
            fila = math.floor((dem_teselas.fraccion_y(s + v * (nn - s)) * n - y) * 256)
            lon, lat = dem_teselas.centro_de_pixel(z, x, y, columna, fila)
            esperado = _bilineal(banda, transformada, lon, lat)
            assert abs(elev[fila][columna] - esperado) <= 2.0, \
                f"{zid} {z}/{x}/{y} píxel ({columna}, {fila}): tesela {elev[fila][columna]} m, ráster {esperado:.2f} m"


def test_regenerar_da_los_mismos_bytes(tmp_path, gemelo):
    """Determinista: con las mismas versiones, regenerar reproduce byte por byte lo versionado."""
    rasterio = pytest.importorskip("rasterio", reason=MOTIVO_SIN_RASTERIO)
    import numpy
    if gemelo["terreno"] is None:
        pytest.skip("sin terreno")
    r = dem_teselas.generar(processed=PROCESSED, web=tmp_path, params_ruta=PARAMS_RUTA)
    assert r["ejecutado"], r
    mismas_versiones = True
    for zid in gemelo["terreno"]["zonas"]:
        con = leer(WEB / "dem" / zid / "origen.json")["generado_con"]
        mismas_versiones &= con == dem_teselas.versiones(numpy, rasterio)
    if not mismas_versiones:
        pytest.skip("otra versión de rasterio, GDAL, numpy o zlib que la que generó las teselas versionadas")
    nuevos = sorted(p.relative_to(tmp_path / "dem").as_posix() for p in (tmp_path / "dem").rglob("*") if p.is_file())
    viejos = sorted(p.relative_to(WEB / "dem").as_posix() for p in (WEB / "dem").rglob("*") if p.is_file())
    assert nuevos == viejos
    for nombre in nuevos:
        assert (tmp_path / "dem" / nombre).read_bytes() == (WEB / "dem" / nombre).read_bytes(), nombre


@pytest.fixture
def zona_sintetica(tmp_path):
    """Un ráster pequeño (DATOS DE PRUEBA) que cubre solo el centro del rectángulo de una zona inventada."""
    rasterio = pytest.importorskip("rasterio", reason=MOTIVO_SIN_RASTERIO)
    import numpy as np
    from rasterio.transform import from_origin
    proc = tmp_path / "processed"
    proc.mkdir()
    bbox = [-105.50, 28.10, -105.40, 28.16]
    paso = 0.0005
    oeste, norte, columnas, filas = -105.47, 28.14, 80, 40      # cubre −105.47…−105.43 y 28.12…28.14
    banda = (1200 + np.arange(columnas)[None, :] * 2 + np.arange(filas)[:, None] * 3).astype("int16")
    with rasterio.open(proc / "nasadem_zona_piloto_prueba.tif", "w", driver="GTiff", height=filas, width=columnas,
                       count=1, dtype="int16", crs="EPSG:4326", transform=from_origin(oeste, norte, paso, paso)) as ds:
        ds.write(banda, 1)
    params = {"zona_piloto": {"zonas": {"valor": [{"id": "prueba", "bbox": bbox}]}},
              "gemelo": {"dem": {"valor": {"minzoom": 10, "maxzoom": 12}}}}
    (tmp_path / "params.json").write_text(json.dumps(params), encoding="utf-8")
    cobertura = (oeste, norte - filas * paso, oeste + columnas * paso, norte)
    return {"processed": proc, "web": tmp_path / "web", "params": tmp_path / "params.json", "bbox": bbox,
            "cobertura": cobertura, "min": int(banda.min()), "max": int(banda.max()), "banda": banda}


def _mosaico_de_zoom(carpeta, lista, z):
    """Elevaciones de todas las teselas del zoom z juntas (filas de norte a sur), y la tesela de cada bloque."""
    import numpy as np
    del_zoom = [t for t in lista if t[0] == z]
    xs, ys = sorted({x for _, x, _ in del_zoom}), sorted({y for _, _, y in del_zoom})
    mosaico = np.zeros((len(ys) * 256, len(xs) * 256))
    for _, x, y in del_zoom:
        f, c = ys.index(y) * 256, xs.index(x) * 256
        mosaico[f:f + 256, c:c + 256] = dem_teselas.leer_tesela(dem_teselas.ruta_tesela(carpeta, z, x, y))
    return mosaico, xs[0], ys[0]


def test_fuera_del_raster_queda_plano_con_rampa_y_sin_acantilados(zona_sintetica):
    """Revisión I16: fuera del ráster ya no se copia el borde (dibujaba estrías en la vista 3D). Lejos del ráster
    la tesela vale la mediana del borde del ráster (un valor plano que ya está en el ráster); cerca, una rampa
    de dem_teselas.RAMPA_M lleva del borde a ese valor sin escalón."""
    import numpy as np
    s = zona_sintetica
    r = dem_teselas.generar(processed=s["processed"], web=s["web"], params_ruta=s["params"])
    assert r["ejecutado"] and r["zonas"]["prueba"]["generada"], r
    carpeta = s["web"] / "dem" / "prueba"
    lista = dem_teselas.teselas_de_bbox(s["bbox"], 10, 12)
    assert r["zonas"]["prueba"]["teselas"] == len(lista)
    for z, x, y in lista:
        minimo, maximo = dem_teselas.rango_tesela(dem_teselas.ruta_tesela(carpeta, z, x, y))
        # Todo píxel, también fuera del ráster, queda entre el mínimo y el máximo del ráster: ni 0 ni huecos.
        assert s["min"] - 0.5 <= minimo <= maximo <= s["max"] + 0.5, (z, x, y, minimo, maximo)
    b = s["banda"]
    plano = float(np.median(np.concatenate([b[0], b[-1], b[1:-1, 0], b[1:-1, -1]])))
    origen = leer(carpeta / "origen.json")["fuera_del_raster"]
    assert origen["valor_m"] == plano and origen["rampa_m"] == dem_teselas.RAMPA_M and origen["etiqueta"] == "Diseño"
    paso = 1 / dem_teselas.PASOS_POR_METRO
    oeste, sur, este, norte = s["cobertura"]
    for z in (10, 11, 12):
        mosaico, x0, y0 = _mosaico_de_zoom(carpeta, lista, z)
        pixel_m = 2 * math.pi * dem_teselas.RADIO_M / 2 ** z / 256
        n = 2 ** z
        # Fila y columna del mosaico de cada borde de la cobertura del ráster.
        c_oeste, c_este = (dem_teselas.fraccion_x(oeste) * n - x0) * 256, (dem_teselas.fraccion_x(este) * n - x0) * 256
        f_norte, f_sur = (dem_teselas.fraccion_y(norte) * n - y0) * 256, (dem_teselas.fraccion_y(sur) * n - y0) * 256
        filas, cols = np.arange(mosaico.shape[0]) + 0.5, np.arange(mosaico.shape[1]) + 0.5
        df = np.maximum(np.maximum(f_norte - filas, filas - f_sur), 0)[:, None]
        dc = np.maximum(np.maximum(c_oeste - cols, cols - c_este), 0)[None, :]
        distancia_m = np.hypot(df, dc) * pixel_m
        lejos = distancia_m > dem_teselas.RAMPA_M + 2 * pixel_m
        assert lejos.any(), f"zoom {z}: la prueba debe mirar píxeles más allá de la rampa"
        assert np.all(np.abs(mosaico[lejos] - plano) <= paso / 2), f"zoom {z}: lejos del ráster no queda plano"
        # Sin escalón ni estría: el mayor salto entre píxeles vecinos fuera del ráster no pasa del que hay dentro
        # más la pendiente de la rampa (del borde más alejado del valor plano, repartido en RAMPA_M).
        dentro = distancia_m == 0
        saltos_f, saltos_c = np.abs(np.diff(mosaico, axis=0)), np.abs(np.diff(mosaico, axis=1))
        interior = max(saltos_f[dentro[1:] & dentro[:-1]].max(), saltos_c[dentro[:, 1:] & dentro[:, :-1]].max())
        rampa = (max(s["max"] - plano, plano - s["min"])) * pixel_m / dem_teselas.RAMPA_M
        assert max(saltos_f.max(), saltos_c.max()) <= interior + rampa + 2 * paso, f"zoom {z}: escalón en el borde del ráster"


def test_teselas_versionadas_quedan_planas_lejos_del_raster(gemelo, teselas):
    """Sin rasterio: la esquina de la tesela del zoom mínimo (lejos del ráster) vale el valor plano que anota
    origen.json. Si falla, las teselas son de antes de la revisión I16: python motor/dem_teselas.py."""
    t = gemelo["terreno"]
    for zid, b in t["zonas"].items():
        fuera = leer(WEB / "dem" / zid / "origen.json").get("fuera_del_raster")
        assert fuera and fuera["etiqueta"] == "Diseño", f"{zid}: origen.json sin «fuera_del_raster»"
        z, x, y = dem_teselas.teselas_de_bbox(b["bounds"], t["minzoom"], t["minzoom"])[0]
        elev = dem_teselas.leer_tesela(WEB.parent / b["teselas"].format(z=z, x=x, y=y))
        for f, c in ((0, 0), (0, 255), (255, 0), (255, 255)):
            assert abs(elev[f][c] - fuera["valor_m"]) <= 1 / dem_teselas.PASOS_POR_METRO / 2, (zid, z, x, y, f, c)


def test_generar_es_idempotente_y_quita_lo_que_sobra(zona_sintetica):
    s = zona_sintetica
    carpeta = s["web"] / "dem" / "prueba"
    dem_teselas.generar(processed=s["processed"], web=s["web"], params_ruta=s["params"])
    antes = {p.relative_to(carpeta).as_posix(): p.read_bytes() for p in carpeta.rglob("*") if p.is_file()}
    # Una tesela de otra corrida (otro zoom) y una tesela alterada.
    sobrante = carpeta / "13" / "1" / "1.png"
    sobrante.parent.mkdir(parents=True)
    sobrante.write_bytes(b"vieja")
    alterada = next(carpeta.rglob("12/*/*.png"))
    alterada.write_bytes(b"alterada")
    r = dem_teselas.generar(processed=s["processed"], web=s["web"], params_ruta=s["params"])
    z = r["zonas"]["prueba"]
    assert (z["escritas"], z["borradas"], z["sin_cambio"]) == (1, 1, z["teselas"] - 1)
    despues = {p.relative_to(carpeta).as_posix(): p.read_bytes() for p in carpeta.rglob("*") if p.is_file()}
    assert despues == antes, "la misma entrada debe dejar los mismos archivos, byte por byte"
    assert not (carpeta / "13").exists()


# --- 5. Sin rasterio o sin .tif no se borra nada ---------------------------------------------
def _tesela_vieja(web):
    vieja = web / "dem" / dem_teselas.ZONA_POR_OMISION / "9" / "1" / "1.png"
    vieja.parent.mkdir(parents=True)
    vieja.write_bytes(b"tesela de una corrida anterior")
    return vieja


def test_sin_tif_lo_dice_y_no_borra(tmp_path):
    vieja = _tesela_vieja(tmp_path / "web")
    (tmp_path / "vacio").mkdir()
    r = dem_teselas.generar(processed=tmp_path / "vacio", web=tmp_path / "web", params_ruta=PARAMS_RUTA)
    assert r["ejecutado"] is False
    assert "falta" in json.dumps(r, ensure_ascii=False)
    assert vieja.read_bytes() == b"tesela de una corrida anterior"


def test_sin_rasterio_lo_dice_y_no_borra(tmp_path, monkeypatch):
    vieja = _tesela_vieja(tmp_path / "web")
    monkeypatch.setitem(sys.modules, "rasterio", None)       # «import rasterio» falla como si no estuviera
    r = dem_teselas.generar(processed=PROCESSED, web=tmp_path / "web", params_ruta=PARAMS_RUTA)
    assert r["ejecutado"] is False and "rasterio" in r["motivo"] and "requirements-datos.txt" in r["motivo"]
    assert vieja.read_bytes() == b"tesela de una corrida anterior"


def test_requirements_datos_fija_la_version_que_genero_las_teselas(gemelo):
    lineas = (RAIZ / "requirements-datos.txt").read_text(encoding="utf-8").splitlines()
    assert lineas[0] == "# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026"
    fijas = [x.strip() for x in lineas if x.strip() and not x.startswith("#")]
    assert len(fijas) == 1 and fijas[0].startswith("rasterio=="), fijas
    if gemelo["terreno"] is not None:
        for zid in gemelo["terreno"]["zonas"]:
            assert fijas[0] == "rasterio==" + leer(WEB / "dem" / zid / "origen.json")["generado_con"]["rasterio"]


# --- gemelo_web.py en carpetas temporales -------------------------------------------------
def _web_minima(tmp_path, memoria=((2019, "verano"), (2021, "descanso"))):
    web = tmp_path / "web"
    web.mkdir()
    geo = {"type": "FeatureCollection", "features": [
        {"type": "Feature", "geometry": None,
         "properties": {"id": "P0001", "memoria": [{"anio": a, "estado": e} for a, e in memoria]}}]}
    (web / "parcelas.geojson").write_text(json.dumps(geo), encoding="utf-8")
    return web


def test_sin_teselas_terreno_es_null(tmp_path):
    web = _web_minima(tmp_path)
    r = gemelo_web.construir(web=web, params_ruta=PARAMS_RUTA, processed=tmp_path / "sin_entregas")
    d = leer(web / "gemelo.json")
    assert r["ejecutado"] and r["terreno"] is None and d["terreno"] is None
    assert d["ndvi"] is None and not (web / "ndvi_mensual.json").exists(), "sin CSV de HLS no hay NDVI"
    assert d["tiempo"]["anios"] == [2019, 2021]
    assert any("sin teselas" in a for a in r["avisos"]) and any("ndvi" in a for a in r["avisos"])


def test_zona_con_teselas_incompletas_no_se_ofrece(tmp_path, gemelo):
    if gemelo["terreno"] is None or len(gemelo["terreno"]["zonas"]) < 2:
        pytest.skip("hacen falta dos zonas con teselas")
    web = _web_minima(tmp_path)
    shutil.copytree(WEB / "dem", web / "dem")
    incompleta = sorted(gemelo["terreno"]["zonas"])[0]
    next((web / "dem" / incompleta).rglob("*.png")).unlink()
    r = gemelo_web.construir(web=web, params_ruta=PARAMS_RUTA, processed=tmp_path / "sin_entregas")
    d = leer(web / "gemelo.json")
    assert incompleta not in d["terreno"]["zonas"] and len(d["terreno"]["zonas"]) == len(gemelo["terreno"]["zonas"]) - 1
    assert any(incompleta in a and "faltan" in a for a in r["avisos"])


def test_sin_bloque_gemelo_en_params_no_hay_gemelo(tmp_path, params):
    web = _web_minima(tmp_path)
    (web / "gemelo.json").write_text("{}", encoding="utf-8")
    sin = {k: v for k, v in params.items() if k != "gemelo"}
    (tmp_path / "params.json").write_text(json.dumps(sin), encoding="utf-8")
    r = gemelo_web.construir(web=web, params_ruta=tmp_path / "params.json", processed=tmp_path / "sin_entregas")
    assert r["ejecutado"] is False and not (web / "gemelo.json").exists()


# --- 6. NDVI mensual ------------------------------------------------------------------------
@pytest.fixture(scope="module")
def ndvi():
    ruta = WEB / "ndvi_mensual.json"
    if not ruta.exists():
        pytest.skip("sin web/data/ndvi_mensual.json (no hay entrega hls_mensual_parcelas.csv)")
    return leer(ruta)


@pytest.fixture(scope="module")
def csv_ndvi():
    """{(id, mes): mediana} de la banda ndvi del CSV entregado."""
    with (PROCESSED / "hls_mensual_parcelas.csv").open(encoding="utf-8", newline="") as f:
        return {(r["id"], r["mes"]): float(r["mediana"]) for r in csv.DictReader(f) if r["banda"] == "ndvi"}


def test_ndvi_una_serie_por_parcela(ndvi, gemelo):
    assert set(ndvi) - META == {"meses", "parcelas", "umbrales", "fuente"}
    meses = ndvi["meses"]
    assert meses == sorted(set(meses)) and all(len(m) == 7 and m[4] == "-" for m in meses)
    ids = [f["properties"]["id"] for f in leer(WEB / "parcelas.geojson")["features"]]
    assert sorted(ndvi["parcelas"]) == sorted(ids), "una serie por cada parcela de parcelas.geojson"
    for pid, serie in ndvi["parcelas"].items():
        assert len(serie) == len(meses), pid
        for v in serie:
            assert v is None or (isinstance(v, (int, float)) and -1 <= v <= 1 and round(v, 3) == v), (pid, v)
    assert gemelo["ndvi"] == {"archivo": "data/ndvi_mensual.json", "fuente": ndvi["fuente"], "meses": meses}


def test_ndvi_coincide_con_el_csv(ndvi, csv_ndvi):
    assert ndvi["meses"] == sorted({m for _, m in csv_ndvi})
    ids = sorted(ndvi["parcelas"])
    for pid in (ids[0], ids[len(ids) // 2], ids[-1]):         # tres parcelas: primera, de en medio y última
        for mes, v in zip(ndvi["meses"], ndvi["parcelas"][pid]):
            esperado = csv_ndvi.get((pid, mes))
            assert v == (None if esperado is None else round(esperado, 3)), (pid, mes)
    con_dato = sum(v is not None for s in ndvi["parcelas"].values() for v in s)
    assert con_dato == sum(1 for (pid, _), v in csv_ndvi.items() if pid in ndvi["parcelas"] and -1 <= v <= 1)


def test_ndvi_fuente_es_la_de_fuentes_json(ndvi):
    por_archivo = {f["archivo"]: f["fuente"] for f in leer(PROCESSED / "fuentes.json")["fuentes"]}
    assert ndvi["fuente"] == por_archivo["hls_mensual_parcelas.csv"] and "HLS" in ndvi["fuente"]


def test_ndvi_null_si_falta_o_no_es_valido(tmp_path):
    proc, web = tmp_path / "processed", tmp_path / "web"
    proc.mkdir()
    (proc / "hls_mensual_parcelas.csv").write_text(
        "id,mes,banda,mediana,p25,p75,n_validos\n"
        "P0002,2026-02,ndvi,0.12349,0,0,1\n"      # DATOS DE PRUEBA
        "P0002,2026-01,ndvi,0.5,0,0,1\n"
        "P0002,2026-01,lswi,0.9,0,0,1\n"          # otra banda: no cuenta
        "P0001,2026-01,ndvi,,0,0,0\n"             # vacío
        "P0001,2026-02,ndvi,1.7,0,0,1\n"          # fuera de [−1, 1]
        "P0003,2026-03,ndvi,-0.2,0,0,1\n", encoding="utf-8")
    r = ndvi_web.construir(processed=proc, web=web)
    d = leer(web / "ndvi_mensual.json")
    assert d["meses"] == ["2026-01", "2026-02", "2026-03"]
    assert d["parcelas"] == {"P0001": [None, None, None], "P0002": [0.5, 0.123, None], "P0003": [None, None, -0.2]}
    assert d["fuente"] is None and any("fuente" in a for a in r["avisos"]), "sin fuentes.json la fuente no se inventa"
    # Con parcelas.geojson: una serie por parcela de la página, aunque el CSV no la traiga.
    geo = {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": None, "properties": {"id": i}}
                                                     for i in ("P0002", "P0009")]}
    (web / "parcelas.geojson").write_text(json.dumps(geo), encoding="utf-8")
    ndvi_web.construir(processed=proc, web=web)
    assert leer(web / "ndvi_mensual.json")["parcelas"] == {"P0002": [0.5, 0.123, None], "P0009": [None, None, None]}


def test_ndvi_sin_csv_borra_el_archivo_viejo(tmp_path):
    web = tmp_path / "web"
    web.mkdir()
    (web / "ndvi_mensual.json").write_text("{}", encoding="utf-8")
    r = ndvi_web.construir(processed=tmp_path / "sin_entregas", web=web)
    assert r["ejecutado"] is False and not (web / "ndvi_mensual.json").exists()


# --- 6b. Umbrales de referencia de la gráfica del NDVI (ficha) -------------------------------
def test_ndvi_umbrales_son_los_de_supuestos_con_su_fuente(ndvi):
    """Las dos líneas de referencia salen de data/processed/supuestos.json (las que usó la sesión de datos para
    la memoria y el suelo desnudo), con su valor, su fuente y su etiqueta; nunca escritas a mano."""
    sup = leer(PROCESSED / "supuestos.json")
    for clave, (llave, _) in ndvi_web.UMBRALES.items():
        u = ndvi["umbrales"][clave]
        assert u == {"valor": sup[llave]["valor"], "etiqueta": sup[llave]["etiqueta"], "fuente": sup[llave]["fuente"],
                     "archivo": "data/processed/supuestos.json"}, clave
        assert -1 <= u["valor"] <= 1 and u["fuente"]
    assert ndvi["umbrales"]["desnudo"]["valor"] < ndvi["umbrales"]["verde"]["valor"]


def _csv_minimo(proc):
    proc.mkdir(parents=True, exist_ok=True)
    (proc / "hls_mensual_parcelas.csv").write_text(
        "id,mes,banda,mediana,p25,p75,n_validos\nP0001,2026-01,ndvi,0.5,0,0,1\n", encoding="utf-8")  # DATOS DE PRUEBA


def test_ndvi_umbrales_sin_supuestos_salen_de_params(tmp_path, params):
    proc, web = tmp_path / "processed", tmp_path / "web"
    _csv_minimo(proc)
    ndvi_web.construir(processed=proc, web=web, params_ruta=PARAMS_RUTA)
    u = leer(web / "ndvi_mensual.json")["umbrales"]
    for clave, (_, ruta) in ndvi_web.UMBRALES.items():
        bloque = params
        for parte in ruta:
            bloque = bloque[parte]
        assert u[clave]["valor"] == bloque["valor"] and u[clave]["fuente"] == bloque["fuente"]
        assert u[clave]["archivo"] == "data/params.json"


def test_ndvi_umbral_sin_fuente_o_fuera_de_rango_va_en_null_y_se_avisa(tmp_path):
    proc, web = tmp_path / "processed", tmp_path / "web"
    _csv_minimo(proc)
    # DATOS DE PRUEBA: un umbral sin fuente y otro fuera de [−1, 1]; params sin los bloques.
    (proc / "supuestos.json").write_text(json.dumps({
        "umbral_verde_ndvi": {"valor": 0.5, "etiqueta": "[prueba]"},
        "umbral_desnudo_ndvi": {"valor": 3, "etiqueta": "[prueba]", "fuente": "prueba"}}), encoding="utf-8")
    (tmp_path / "params.json").write_text("{}", encoding="utf-8")
    r = ndvi_web.construir(processed=proc, web=web, params_ruta=tmp_path / "params.json")
    assert leer(web / "ndvi_mensual.json")["umbrales"] == {"verde": None, "desnudo": None}
    assert sum("umbral" in a for a in r["avisos"]) == 2


def test_ndvi_umbrales_distintos_en_supuestos_y_params_se_avisa(tmp_path, params):
    proc, web = tmp_path / "processed", tmp_path / "web"
    _csv_minimo(proc)
    verde = params["memoria"]["ndvi_verde"]["valor"]
    otro = round(verde / 2, 3)                        # DATOS DE PRUEBA: distinto del de params
    (proc / "supuestos.json").write_text(json.dumps({
        "umbral_verde_ndvi": {"valor": otro, "etiqueta": "[prueba]", "fuente": "prueba"}}), encoding="utf-8")
    r = ndvi_web.construir(processed=proc, web=web, params_ruta=PARAMS_RUTA)
    u = leer(web / "ndvi_mensual.json")["umbrales"]
    assert u["verde"]["valor"] == otro and u["verde"]["archivo"] == "data/processed/supuestos.json"
    assert u["desnudo"]["archivo"] == "data/params.json", "el que supuestos no trae sale de params"
    assert any("umbral verde" in a and "se usa el de supuestos.json" in a for a in r["avisos"])
