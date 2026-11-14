# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Pruebas del ensamblador del buzón (motor/ensamblar.py; kit v4 K-ENS y tabla 0.4-B).

Cubre:
- buzón None o vacío: nada entra, todo sigue simulado y (con None) no se escribe nada;
- tests/fixtures/buzon_ok: todo entra y se copia sin modificar, con su sha256 en fuentes.json;
- tests/fixtures/buzon_malo: cada archivo se rechaza con su motivo (parcelas_base es válido a
  propósito: es la referencia de ids);
- CSV que llegan antes que parcelas_base.geojson: quedan retenidos, no rechazados;
- los demás esquemas de la tabla 0.4-B (un caso válido y uno inválido de cada uno), el GeoTIFF
  (EPSG, escala, extensión, BigTIFF y lector sin Pillow), LEEME.md, subcarpetas de rol y la CLI;
- los formatos del acuerdo con la sesión de datos (14-nov-2026): rotaciones.json y
  demanda_cultivos.csv (A5), memoria_parcelas.csv y memoria_resumen.csv (A3-M),
  cultivos_parcelas.csv con «1/1 (reglas)» (A4) y relieve_meta.json (A9), y los crudos de
  Earth Engine (hls_*.tif, piloto_consumo.tif), que se listan aparte y no se rechazan;
- las dos zonas piloto (docs/decisiones/2026-11-14_dos_zonas.md) con tests/fixtures/buzon_dos_zonas:
  propiedad «zona», prefijo del id y centroide en el rectángulo de su zona, archivos con sufijo
  «_<zona>», NASADEM por zona y la entrega real de una zona (data/processed) que sigue validando.
Todas escriben en tmp_path: nunca en data/processed ni en docs/entregas_log.md.

Los valores de las pruebas son DE PRUEBA (no son datos). Los límites que dependen de
data/params.json se leen de ahí, no se escriben aquí.

Regenerar los GeoTIFF de las fixtures (necesita Pillow):
    python tests/test_ensamblar.py --regenerar-tif
"""
import hashlib
import json
import math
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from motor import ensamblar as ens  # noqa: E402
from motor import esquemas  # noqa: E402

FIXTURES = RAIZ / "tests/fixtures"
BUZON_OK = FIXTURES / "buzon_ok"
BUZON_MALO = FIXTURES / "buzon_malo"
BUZON_DOS_ZONAS = FIXTURES / "buzon_dos_zonas"
PROCESADOS = RAIZ / "data/processed"
PARAMS = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
LIMITES = ens.limites_derivados(PARAMS)
OMISION = esquemas.ZONA_POR_OMISION     # sin «zona» o sin sufijo
OTRA = "lazaro_cardenas"                # la zona con sufijo de la fixture buzon_dos_zonas
ARCOSEG = 1 / 3600          # 1 arcosegundo en grados (definición)
MARGEN_FIXTURE = 0.02       # margen de prueba alrededor de zona_piloto.bbox (≈ 2 km de A9)
ENCABEZADO_TIF = "AI-assisted (Claude Code) - Raiz, NASA Space Apps 2026 - fixture: valores de prueba"
LINEA_LEEME = "| {archivo} | Valores de prueba (fixture) | 2026-11-14 | tests/test_ensamblar.py |"


# ---------------------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------------------
def sha(ruta):
    return hashlib.sha256(Path(ruta).read_bytes()).hexdigest()


def correr(buzon, tmp_path, **kw):
    """ensamblar() con salida y bitácora en tmp_path."""
    return ens.ensamblar(buzon, salida=tmp_path / "salida", log=tmp_path / "log.md", **kw)


def nombres(lista):
    return sorted(x["archivo"] for x in lista)


def motivos_de(rep, archivo):
    return " | ".join(next(x["motivos"] for x in rep["rechazados"] if x["archivo"] == archivo))


def archivos_de(buzon):
    return sorted(p.name for p in buzon.iterdir() if p.is_file() and p.name != "LEEME.md")


def buzon_con(tmp_path, archivos, base=BUZON_OK, copiar=("parcelas_base.geojson",), lineas_extra=None):
    """Arma un buzón en tmp_path/buzon: copia `copiar` de `base`, escribe `archivos`
    ({nombre: texto o bytes}) y un LEEME.md con una línea por archivo."""
    b = tmp_path / "buzon"
    b.mkdir(parents=True, exist_ok=True)
    for n in copiar:
        shutil.copy(base / n, b / n)
    for n, contenido in archivos.items():
        (b / n).write_bytes(contenido if isinstance(contenido, bytes) else contenido.encode("utf-8"))
    lineas = ["| archivo | fuente | fecha | script |", "|---|---|---|---|"]
    lineas += [LINEA_LEEME.format(archivo=n) for n in [*copiar, *archivos]]
    lineas += lineas_extra or []
    (b / "LEEME.md").write_text("\n".join(lineas) + "\n", encoding="utf-8")
    return b


def escribir_geotiff(ruta, *, oeste, norte, ancho, alto, escala=ARCOSEG, epsg=4326, georef=True,
                     transformacion=False, big_tiff=False, raster_punto=False):
    """GeoTIFF mínimo con Pillow: una banda uint16 constante (valor de prueba) y, si georef,
    GeoKeyDirectoryTag (EPSG en GeographicTypeGeoKey), ModelPixelScale y ModelTiepoint."""
    from PIL import Image, TiffImagePlugin, TiffTags
    img = Image.new("I;16", (ancho, alto), 1)
    ifd = TiffImagePlugin.ImageFileDirectory_v2()
    ifd[270] = ENCABEZADO_TIF
    if georef:
        g = esquemas.GEOTIFF
        raster = g["raster_punto"] if raster_punto else 1
        ifd[g["tag_geokeys"]] = (1, 1, 0, 3, g["geokey_modelo"], 0, 1, g["modelo_geografico"],
                                 g["geokey_raster"], 0, 1, raster, g["geokey_geografico"], 0, 1, epsg)
        ifd.tagtype[g["tag_geokeys"]] = TiffTags.SHORT
        if transformacion:
            ifd[g["tag_transformacion"]] = (escala, 0.0, 0.0, oeste, 0.0, -escala, 0.0, norte,
                                            0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0)
            ifd.tagtype[g["tag_transformacion"]] = TiffTags.DOUBLE
        else:
            ifd[g["tag_escala"]] = (escala, escala, 0.0)
            ifd.tagtype[g["tag_escala"]] = TiffTags.DOUBLE
            ifd[g["tag_tiepoint"]] = (0.0, 0.0, 0.0, oeste, norte, 0.0)
            ifd.tagtype[g["tag_tiepoint"]] = TiffTags.DOUBLE
    img.save(ruta, tiffinfo=ifd, compression="tiff_adobe_deflate", big_tiff=big_tiff)


def geotiff_que_cubre(ruta, bbox, **kw):
    """GeoTIFF de 1″ que cubre bbox con MARGEN_FIXTURE (los parámetros en kw lo alteran)."""
    escala = kw.pop("escala", ARCOSEG)
    ancho = math.ceil((bbox[2] - bbox[0] + 2 * MARGEN_FIXTURE) / escala)
    alto = math.ceil((bbox[3] - bbox[1] + 2 * MARGEN_FIXTURE) / escala)
    escribir_geotiff(ruta, oeste=bbox[0] - MARGEN_FIXTURE, norte=bbox[3] + MARGEN_FIXTURE,
                     ancho=ancho, alto=alto, escala=escala, **kw)


# ---------------------------------------------------------------------------------------
# Buzón None, vacío y sin LEEME
# ---------------------------------------------------------------------------------------
def test_buzon_none_todo_simulado_y_no_escribe(tmp_path):
    rep = correr(None, tmp_path)
    assert rep["entraron"] == [] and rep["rechazados"] == [] and rep["retenidos"] == []
    assert rep["fuentes"] == []
    assert rep["sigue_simulado"] == ens.esperados_simulados() and rep["sigue_simulado"]
    assert not (tmp_path / "salida").exists() and not (tmp_path / "log.md").exists()
    for llave in ("entraron", "rechazados", "retenidos", "sigue_simulado", "fuentes"):
        assert llave in rep
    # RAIZ_BUZON vacía equivale a no tener buzón (no lee la carpeta actual).
    assert correr("", tmp_path)["buzon"] is None and not (tmp_path / "salida").exists()


def test_buzon_vacio_nada_entra(tmp_path):
    vacio = tmp_path / "vacio"
    vacio.mkdir()
    rep = correr(vacio, tmp_path)
    assert rep["entraron"] == [] and rep["rechazados"] == [] and rep["retenidos"] == []
    assert rep["sigue_simulado"] == ens.esperados_simulados()
    assert json.loads((tmp_path / "salida/fuentes.json").read_text(encoding="utf-8"))["fuentes"] == []
    assert "| 0 |" in (tmp_path / "log.md").read_text(encoding="utf-8")


def test_buzon_inexistente_es_error(tmp_path):
    with pytest.raises(FileNotFoundError):
        correr(tmp_path / "no_existe", tmp_path)


def test_sin_leeme_nada_entra(tmp_path):
    b = tmp_path / "b"
    b.mkdir()
    shutil.copy(BUZON_OK / "eto_diaria.csv", b)
    rep = correr(b, tmp_path)
    assert nombres(rep["rechazados"]) == ["eto_diaria.csv"]
    assert "LEEME.md" in motivos_de(rep, "eto_diaria.csv")


# ---------------------------------------------------------------------------------------
# buzon_ok: todo entra, se copia sin modificar y con sha256
# ---------------------------------------------------------------------------------------
def entregas_de(buzon):
    """Archivos de la fixture que son entregas (sin los crudos de Earth Engine)."""
    return [n for n in archivos_de(buzon) if not ens.es_crudo(n)]


def test_buzon_ok_todo_entra_y_se_copia_con_sha256(tmp_path):
    rep = correr(BUZON_OK, tmp_path)
    esperados = entregas_de(BUZON_OK)
    assert len(esperados) == 13
    assert rep["rechazados"] == [], rep["rechazados"]
    assert rep["retenidos"] == []
    assert nombres(rep["entraron"]) == esperados
    salida = tmp_path / "salida"
    for n in esperados:
        assert (salida / n).read_bytes() == (BUZON_OK / n).read_bytes(), f"{n} se modificó al copiar"
    fuentes = json.loads((salida / "fuentes.json").read_text(encoding="utf-8"))["fuentes"]
    assert sorted(f["archivo"] for f in fuentes) == esperados
    for f in fuentes:
        assert f["sha256"] == sha(BUZON_OK / f["archivo"])
        for llave in ("fuente", "fecha", "script", "url_o_api", "fecha_consulta", "pieza"):
            assert f[llave], (f["archivo"], llave)
        assert f["rol"] is None and f["tipo"] == "entrega"
    for e in rep["entraron"]:
        assert e["sha256"] == sha(BUZON_OK / e["archivo"])
    # Lo que entró ya no está en «sigue simulado»; lo demás sí.
    for n in esperados:
        assert n not in rep["sigue_simulado"]
    assert "dotaciones.json" in rep["sigue_simulado"]
    # El crudo de Earth Engine se lista aparte: no entra, no se rechaza y no se copia.
    assert [c["archivo"] for c in rep["crudos"]] == ["hls_ndvi_memoria_2016.tif"]
    assert not (salida / "hls_ndvi_memoria_2016.tif").exists()
    # Bitácora: encabezado y una línea por corrida.
    log = (tmp_path / "log.md").read_text(encoding="utf-8")
    assert log.startswith("<!-- AI-assisted") and "| 13: " in log
    # Una sola zona (sin «zona» ni sufijos): todo es de la zona por omisión.
    por_nombre = {x["archivo"]: x for x in rep["entraron"]}
    for n, x in por_nombre.items():
        assert x["zona"] == (OMISION if n in esquemas.ARCHIVOS_POR_ZONA else None), n
    assert por_nombre["parcelas_base.geojson"]["zonas"] == {OMISION: 3}
    assert por_nombre["relieve_parcelas.csv"]["zonas"] == {OMISION: 3}
    assert not por_nombre["nasadem_zona_piloto.tif"]["avisos"]   # cubre el rectángulo de su zona


def test_buzon_ok_avisa_faltante_power_menor_al_5pct(tmp_path):
    rep = correr(BUZON_OK, tmp_path)
    eto = next(x for x in rep["entraron"] if x["archivo"] == "eto_diaria.csv")
    assert any("ws2m: 1 faltantes" in a for a in eto["avisos"]), eto["avisos"]


def test_bitacora_agrega_una_linea_por_corrida(tmp_path):
    correr(BUZON_OK, tmp_path)
    correr(BUZON_OK, tmp_path)
    filas = [l for l in (tmp_path / "log.md").read_text(encoding="utf-8").splitlines()
             if l.startswith("| 20")]
    assert len(filas) == 2


def test_fuentes_json_compatible_con_manifest(tmp_path):
    """motor/manifest.py exige archivo, url_o_api, fecha_consulta y sha256 en cada fuente."""
    correr(BUZON_OK, tmp_path)
    crudo = json.loads((tmp_path / "salida/fuentes.json").read_text(encoding="utf-8"))
    assert crudo["_encabezado"].startswith("AI-assisted")
    for f in crudo["fuentes"]:
        assert all(f.get(k) for k in ("archivo", "url_o_api", "fecha_consulta", "sha256"))


def test_salida_por_omision_con_salida_propia_no_toca_docs(tmp_path):
    """Con salida distinta de data/processed y sin log, la bitácora va a <salida>/entregas_log.md."""
    rep = ens.ensamblar(BUZON_OK, salida=tmp_path / "s")
    assert Path(rep["log"]) == tmp_path / "s/entregas_log.md"
    assert (tmp_path / "s/entregas_log.md").exists()


# ---------------------------------------------------------------------------------------
# buzon_malo: cada archivo rechazado con su motivo
# ---------------------------------------------------------------------------------------
MOTIVOS_MALO = {
    "eto_diaria.csv": ["fecha", "AAAA-MM-DD", "2026/01/05"],
    "hls_mensual_parcelas.csv": ["NDVI", "fuera de [-1, 1]"],
    "suelo_desnudo.csv": ["faltan columnas", "dias_suelo_desnudo_feb_abr"],
    "relieve_parcelas.csv": ["no existe en parcelas_base.geojson", "T0999"],
    "relieve_rutas.geojson": ["sin línea en LEEME.md"],
    "cultivos_parcelas.csv": ["LEEME.md", "14/11/2026", "AAAA-MM-DD"],
    "nasadem_zona_piloto.tif": ["34735", "no está georreferenciado"],
    "rotaciones.json": ["lamina_bruta_millares.0: no se cumple p10 ≤ p50 ≤ p90", "R_PRUEBA_A", "p10=13 > p50=12"],
    "demanda_cultivos.csv": ["lluvia_pct fuera de la lista permitida", "-10"],
    "memoria_parcelas.csv": ["estado fuera de la lista permitida", "cultivado"],
    "memoria_resumen.csv": ["anios_con_dato menor que 0"],
    "relieve_meta.json": ["umbral_ruta_ha debe ser mayor que 0"],
}


def test_buzon_malo_cada_archivo_rechazado_con_su_motivo(tmp_path):
    rep = correr(BUZON_MALO, tmp_path)
    assert nombres(rep["entraron"]) == ["parcelas_base.geojson"]
    assert nombres(rep["rechazados"]) == sorted(MOTIVOS_MALO)
    assert rep["retenidos"] == []
    for archivo, claves in MOTIVOS_MALO.items():
        texto = motivos_de(rep, archivo)
        for clave in claves:
            assert clave in texto, f"{archivo}: falta «{clave}» en «{texto}»"
    # Lo rechazado no se copia ni entra a fuentes.json.
    salida = tmp_path / "salida"
    assert sorted(p.name for p in salida.iterdir() if p.name != "fuentes.json") == ["parcelas_base.geojson"]
    fuentes = json.loads((salida / "fuentes.json").read_text(encoding="utf-8"))["fuentes"]
    assert [f["archivo"] for f in fuentes] == ["parcelas_base.geojson"]
    # El crudo sin línea en LEEME.md no es un rechazo: va a «crudos».
    assert [c["archivo"] for c in rep["crudos"]] == ["piloto_consumo.tif"]


def test_rechazo_conserva_copia_anterior_y_lo_dice(tmp_path):
    correr(BUZON_OK, tmp_path)
    b = buzon_con(tmp_path, {"suelo_desnudo.csv": (BUZON_MALO / "suelo_desnudo.csv").read_text(encoding="utf-8")})
    rep = correr(b, tmp_path)
    x = next(x for x in rep["rechazados"] if x["archivo"] == "suelo_desnudo.csv")
    assert any("copia validada anterior" in a for a in x["avisos"])
    salida = tmp_path / "salida"
    assert (salida / "suelo_desnudo.csv").read_bytes() == (BUZON_OK / "suelo_desnudo.csv").read_bytes()
    fuentes = {f["archivo"]: f for f in json.loads((salida / "fuentes.json").read_text(encoding="utf-8"))["fuentes"]}
    # Las fuentes de la corrida anterior se conservan mientras su copia siga igual.
    assert set(fuentes) == set(entregas_de(BUZON_OK))


# ---------------------------------------------------------------------------------------
# Retenidos: los CSV con id llegan antes que parcelas_base.geojson
# ---------------------------------------------------------------------------------------
CON_ID = ["cultivos_parcelas.csv", "hls_mensual_parcelas.csv", "memoria_parcelas.csv", "memoria_resumen.csv",
          "relieve_parcelas.csv", "suelo_desnudo.csv"]


def test_csv_antes_que_parcelas_quedan_retenidos(tmp_path):
    b = tmp_path / "b"
    shutil.copytree(BUZON_OK, b)
    (b / "parcelas_base.geojson").unlink()
    rep = correr(b, tmp_path)
    assert nombres(rep["retenidos"]) == CON_ID
    assert rep["rechazados"] == []
    assert nombres(rep["entraron"]) == ["demanda_cultivos.csv", "eto_diaria.csv", "nasadem_zona_piloto.tif",
                                        "relieve_meta.json", "relieve_rutas.geojson", "rotaciones.json"]
    for x in rep["retenidos"]:
        assert "aún no llega" in x["motivo"]
        assert not (tmp_path / "salida" / x["archivo"]).exists()
    assert {"suelo_desnudo.csv", "relieve_parcelas.csv"} <= set(rep["sigue_simulado"])
    assert "parcelas_base.geojson" in " ".join(rep["avisos"])   # LEEME la menciona y no está


def test_parcelas_rechazada_retiene_csv(tmp_path):
    b = tmp_path / "b"
    shutil.copytree(BUZON_OK, b)
    geo = json.loads((b / "parcelas_base.geojson").read_text(encoding="utf-8"))
    geo["features"][0]["properties"]["area_ha"] = LIMITES["area_min_ha"] / 2
    (b / "parcelas_base.geojson").write_text(json.dumps(geo), encoding="utf-8")
    rep = correr(b, tmp_path)
    assert "area_ha menor que" in motivos_de(rep, "parcelas_base.geojson")
    assert nombres(rep["retenidos"]) == CON_ID
    assert all("se rechazó" in x["motivo"] for x in rep["retenidos"])


def test_csv_con_otro_error_y_sin_parcelas_se_rechaza(tmp_path):
    """Si además del id hay otro error, se rechaza (no se retiene)."""
    b = tmp_path / "b"
    shutil.copytree(BUZON_MALO, b)
    (b / "parcelas_base.geojson").unlink()
    rep = correr(b, tmp_path)
    assert "hls_mensual_parcelas.csv" in nombres(rep["rechazados"])
    assert "los id no se comprobaron" in motivos_de(rep, "hls_mensual_parcelas.csv")
    assert nombres(rep["retenidos"]) == ["relieve_parcelas.csv"]   # su único error era el id


# ---------------------------------------------------------------------------------------
# LEEME.md, subcarpetas de rol, ignorados y desconocidos
# ---------------------------------------------------------------------------------------
def test_subcarpetas_de_rol(tmp_path):
    b = tmp_path / "entregas"
    (b / "P2").mkdir(parents=True)
    (b / "P4").mkdir()
    shutil.copy(BUZON_OK / "LEEME.md", b)
    for n in ("parcelas_base.geojson", "suelo_desnudo.csv"):
        shutil.copy(BUZON_OK / n, b / "P2" / n)
    shutil.copy(BUZON_OK / "eto_diaria.csv", b / "P4")
    rep = correr(b, tmp_path)
    roles = {x["archivo"]: x["rol"] for x in rep["entraron"]}
    assert roles == {"parcelas_base.geojson": "P2", "suelo_desnudo.csv": "P2", "eto_diaria.csv": "P4"}
    fuentes = {f["archivo"]: f for f in rep["fuentes"]}
    assert fuentes["eto_diaria.csv"]["rol"] == "P4" and fuentes["eto_diaria.csv"]["ruta_buzon"] == "P4/eto_diaria.csv"
    assert "[P2]" in (tmp_path / "log.md").read_text(encoding="utf-8")


def test_nombre_repetido_en_dos_roles_se_rechaza(tmp_path):
    b = tmp_path / "entregas"
    for rol in ("P2", "P4"):
        (b / rol).mkdir(parents=True)
        shutil.copy(BUZON_OK / "eto_diaria.csv", b / rol)
    shutil.copy(BUZON_OK / "LEEME.md", b)
    rep = correr(b, tmp_path)
    assert [x["archivo"] for x in rep["rechazados"]] == ["eto_diaria.csv", "eto_diaria.csv"]
    assert "se repite" in rep["rechazados"][0]["motivos"][0]


def test_leeme_con_tabla_sin_pipes_externos_y_prosa_previa(tmp_path):
    b = tmp_path / "b"
    b.mkdir()
    shutil.copy(BUZON_OK / "eto_diaria.csv", b)
    (b / "LEEME.md").write_text(
        "# Entregas\nNota con | una barra que no es tabla\n\n"
        "archivo | fuente | fecha | script\n--- | --- | --- | ---\n"
        "`eto_diaria.csv` | NASA POWER (prueba) | 2026-11-14 | `colab/A1_power_eto.ipynb`\n", encoding="utf-8")
    rep = correr(b, tmp_path)
    assert nombres(rep["entraron"]) == ["eto_diaria.csv"]
    assert rep["fuentes"][0]["script"] == "colab/A1_power_eto.ipynb"


@pytest.mark.parametrize("linea, clave", [
    ("| eto_diaria.csv | NASA POWER | 2026-13-01 | colab/A1.ipynb |", "AAAA-MM-DD"),
    ("| eto_diaria.csv |  | 2026-11-14 | colab/A1.ipynb |", "no dice la fuente"),
    ("| eto_diaria.csv | NASA POWER | 2026-11-14 |  |", "no dice el script"),
    ("| eto_diaria.csv | NASA POWER | 2026-11-14 |", "columnas"),
])
def test_leeme_lineas_invalidas(tmp_path, linea, clave):
    b = tmp_path / "b"
    b.mkdir()
    shutil.copy(BUZON_OK / "eto_diaria.csv", b)
    (b / "LEEME.md").write_text(f"| archivo | fuente | fecha | script |\n|---|---|---|---|\n{linea}\n", encoding="utf-8")
    rep = correr(b, tmp_path)
    assert clave in motivos_de(rep, "eto_diaria.csv")


def test_leeme_sin_encabezado_nada_entra(tmp_path):
    b = tmp_path / "b"
    b.mkdir()
    shutil.copy(BUZON_OK / "eto_diaria.csv", b)
    (b / "LEEME.md").write_text("| nombre | origen | dia | cuaderno |\n| eto_diaria.csv | x | 2026-11-14 | y |\n",
                                encoding="utf-8")
    rep = correr(b, tmp_path)
    assert "no trae la tabla" in motivos_de(rep, "eto_diaria.csv")
    assert rep["entraron"] == []


def test_ignorados_y_desconocidos(tmp_path):
    b = buzon_con(tmp_path, {"notas.txt": "hola", "filtros.py": "# código\n", ".DS_Store": b"\0"})
    rep = correr(b, tmp_path)
    assert "tabla 0.4-B" in motivos_de(rep, "notas.txt")
    ignorados = {x["archivo"]: x["motivo"] for x in rep["ignorados"]}
    assert "código" in ignorados["filtros.py"] and ".DS_Store" in ignorados


# ---------------------------------------------------------------------------------------
# eto_diaria: faltantes de POWER
# ---------------------------------------------------------------------------------------
def test_eto_faltantes_desde_el_5pct_se_rechaza(tmp_path):
    lineas = (BUZON_OK / "eto_diaria.csv").read_text(encoding="utf-8").splitlines()
    n = len(lineas) - 1
    k = math.ceil(esquemas.FALTANTES_MAX_FRACCION * n)       # justo en el límite
    for i in range(1, k + 1):
        partes = lineas[i].split(",")
        partes[1] = str(esquemas.FALTANTE_POWER)               # eto_mm
        lineas[i] = ",".join(partes)
    b = buzon_con(tmp_path, {"eto_diaria.csv": "\n".join(lineas) + "\n"}, copiar=())
    rep = correr(b, tmp_path)
    assert "eto_mm" in motivos_de(rep, "eto_diaria.csv") and "faltantes" in motivos_de(rep, "eto_diaria.csv")


@pytest.mark.parametrize("columna, valor, clave", [
    ("tmin", "40.0", "tmin ≤ tmax"),
    ("eto_mm", "16.0", "eto_mm fuera de [0, 15]"),
    ("lluvia_mm", "-1.0", "lluvia_mm menor que 0"),
    ("eto_mm", '"2,5"', "coma decimal"),
])
def test_eto_rangos(tmp_path, columna, valor, clave):
    lineas = (BUZON_OK / "eto_diaria.csv").read_text(encoding="utf-8").splitlines()
    partes = lineas[3].split(",")
    partes[lineas[0].split(",").index(columna)] = valor
    lineas[3] = ",".join(partes)
    b = buzon_con(tmp_path, {"eto_diaria.csv": "\n".join(lineas) + "\n"}, copiar=())
    assert clave in motivos_de(correr(b, tmp_path), "eto_diaria.csv")


def test_hls_banda_desconocida_solo_avisa(tmp_path):
    texto = (BUZON_OK / "hls_mensual_parcelas.csv").read_text(encoding="utf-8") + "T0001,2026-01,B5,0.3,0.2,0.4,3\n"
    b = buzon_con(tmp_path, {"hls_mensual_parcelas.csv": texto})
    rep = correr(b, tmp_path)
    hls = next(x for x in rep["entraron"] if x["archivo"] == "hls_mensual_parcelas.csv")
    assert any("bandas sin rango conocido" in a and "B5" in a for a in hls["avisos"])


def test_hls_reflectancia_fuera_de_0_1(tmp_path):
    texto = (BUZON_OK / "hls_mensual_parcelas.csv").read_text(encoding="utf-8").replace(
        "T0001,2026-01,NIR,0.31,0.28,0.34", "T0001,2026-01,NIR,3100,2800,3400")
    b = buzon_con(tmp_path, {"hls_mensual_parcelas.csv": texto})
    assert "de NIR (reflectancia" in motivos_de(correr(b, tmp_path), "hls_mensual_parcelas.csv")


def test_eto_fecha_repetida(tmp_path):
    lineas = (BUZON_OK / "eto_diaria.csv").read_text(encoding="utf-8").splitlines()
    lineas.append(lineas[1])
    b = buzon_con(tmp_path, {"eto_diaria.csv": "\n".join(lineas) + "\n"}, copiar=())
    assert "fecha repetido" in motivos_de(correr(b, tmp_path), "eto_diaria.csv")


def test_csv_con_punto_y_coma_da_pista(tmp_path):
    texto = (BUZON_OK / "eto_diaria.csv").read_text(encoding="utf-8").replace(",", ";")
    b = buzon_con(tmp_path, {"eto_diaria.csv": texto}, copiar=())
    assert "separador" in motivos_de(correr(b, tmp_path), "eto_diaria.csv")


# ---------------------------------------------------------------------------------------
# suelo_desnudo: días de la ventana derivados de params (1-feb a 30-abr)
# ---------------------------------------------------------------------------------------
def test_dias_ventana_derivados_de_params():
    ventana = PARAMS["suelo"]["ventana_desnudo"]["valor"]
    anio = PARAMS["memoria"]["anio_actual"]["valor"]
    assert LIMITES["dias_ventana_anio_actual"] == ens.dias_ventana(anio, ventana)
    # Un año bisiesto suma un día (el máximo de la memoria lo considera).
    assert ens.dias_ventana(2024, ventana) == ens.dias_ventana(2026, ventana) + 1
    assert LIMITES["dias_ventana_max"] >= LIMITES["dias_ventana_anio_actual"]


def test_suelo_dias_fuera_de_la_ventana(tmp_path):
    maximo = LIMITES["dias_ventana_anio_actual"]
    texto = (BUZON_OK / "suelo_desnudo.csv").read_text(encoding="utf-8").replace("T0002,61,", f"T0002,{maximo + 1},")
    b = buzon_con(tmp_path, {"suelo_desnudo.csv": texto})
    assert f"fuera de [0, {maximo}]" in motivos_de(correr(b, tmp_path), "suelo_desnudo.csv")


def test_suelo_dias_no_enteros_y_viento_mayor_que_desnudo(tmp_path):
    texto = (BUZON_OK / "suelo_desnudo.csv").read_text(encoding="utf-8")
    texto = texto.replace("T0001,6,2,", "T0001,6.5,2,").replace("T0002,61,20,", "T0002,10,20,")
    b = buzon_con(tmp_path, {"suelo_desnudo.csv": texto})
    m = motivos_de(correr(b, tmp_path), "suelo_desnudo.csv")
    assert "debe ser entero" in m and "dias_desnudo_viento_alto ≤ dias_suelo_desnudo_feb_abr" in m


# ---------------------------------------------------------------------------------------
# Resto de la tabla 0.4-B: un caso válido y uno inválido por esquema
# ---------------------------------------------------------------------------------------
def dotaciones_desde_params(**cambios):
    """dotaciones.json válido construido con los valores de data/params.json."""
    d = PARAMS["dotaciones"]
    marcas = []
    for mid in sorted(esquemas.MARCAS):
        p = d[mid]
        marcas.append({"id": mid, "nombre": mid, **p["valor"], "nota": p["nota"], "fuente": p["fuente"],
                       "fecha_consulta": p["fecha_consulta"], "etiqueta": p["etiqueta"]})
    obj = {"dotaciones": {"unidad": "millares_por_ha", "equivalencia": PARAMS["unidades"]["millar"]["nota"],
                          "deslizador": d["deslizador"]["valor"], "marcas": marcas,
                          "punto_medicion": d["punto_medicion"]["valor"]},
           "distrito": {"boquilla": {"namo_hm3": PARAMS["distrito"]["namo_hm3"]["valor"],
                                     "fuente_namo": PARAMS["distrito"]["namo_hm3"]["fuente"],
                                     "almacenamiento_hm3": None},
                        "acuifero_0831": {"disponibilidad_hm3_anio": PARAMS["acuifero"]["disponibilidad_hm3_anio"]["valor"],
                                          "fuente": PARAMS["acuifero"]["disponibilidad_hm3_anio"]["fuente"]}}}
    for marca in obj["dotaciones"]["marcas"]:
        marca.update(cambios.get(marca["id"], {}))
    return json.dumps(obj, ensure_ascii=False)


def _umbral_ndvi():
    return PARAMS["memoria"]["ndvi_verde"]["valor"]


VALIDOS = {
    "memoria_mensual.csv": "id,anio_agricola,mes,ndvi_mediana,n_validos\nT0001,2025,2024-10,0.45,3\nT0001,2025,11,,0\n",
    "memoria_parcelas.csv": ("id,anio_agricola,estado,meses_verdes,max_verano,max_invierno,dias_suelo_desnudo_feb_abr,meses_validos\n"
                             "T0001,2025,perenne,10,0.7,0.5,0,12\nT0002,2024,verano,4,0.6,0.1,90,11\n"),
    "memoria_resumen.csv": ("id,dias_suelo_desnudo_mediana,anios_con_dato,estado_2025\n"
                            "T0001,0,4,perenne\nT0002,,0,\nT0003,55.0,11,verano\n"),
    "memoria_validacion.csv": "clase,estado,n\nalfalfa,perenne,1\n",
    "etiquetas_unidas.csv": ("id,punto_id,bloque,uso,clase_P2,clase_P3,clase_desempate,clase_final,acuerdo\n"
                             "M01,pt1,B1,entrenamiento,alfalfa,alfalfa,,alfalfa,true\n"
                             "M02,pt2,B2,validación,chile,nogal,chile,chile,false\n"),
    "cultivos_parcelas.csv": None,   # se arma con cultivos_csv (8 columnas)
    "tabla_metodos.csv": "enfoque,f1_macro,f1_por_clase,tiempo\nreglas,0.61,alfalfa:0.8,1 min\nrandom_forest,0.72,alfalfa:0.9,3 min\n",
    "olofsson.csv": "clase,exactitud_usuario\nalfalfa,0.9\n",
    "demanda_parcelas.csv": ("id,opcion,lluvia_pct,bruta_mm_p10,bruta_mm_p50,bruta_mm_p90,neta_mm_p50,etc_mm_p50\n"
                             "T0001,ACTUAL,0,1500,1700,1900,1200,1300\nT0001,ACTUAL,-20,1550,1750,1950,1250,1300\n"),
    "etc_mensual.csv": "id,opcion,mes,etc_mm_p50\nT0001,ACTUAL,2026-05,180\nT0001,ACTUAL,6,190\n",
    "et_contraste.csv": "mes,et_modelo_mm,et_ssebop_mm,et_wapor_mm\n2025-10,90,80,\n2025-11,60,55,\n",
    "h3_series.csv": None,   # se arma con el umbral de params
    "historial_superficie.csv": "anio_agricola,superficie_ha\n2016,1\n",
    "calibracion.csv": "x,y\n1,2\n",
    "cifras.csv": "clave,valor,unidad,fuente,fecha,etiqueta\nprueba_a,1.5,ha,fuente de prueba,2026-11-14,[S]\nprueba_b,2,,fuente de prueba,,[S]\n",
    "heladas.json": json.dumps({"ultima_primavera": {"p10": 60, "p50": 75, "p90": 95},
                                "primera_otono": {"p10": "10-28", "p50": "11-10", "p90": "11-25"},
                                "prob_helada_despues_de": {"02-01": 0.6, "02-08": 0.5}, "fuente": "prueba"}),
    "dotaciones.json": None,  # se arma con params
    "supuestos.json": json.dumps({"_encabezado": "x", "eficiencia": {
        "parcelaria": {"valor": {"min": 0.4, "max": 0.7}, "fuente": "assumption", "etiqueta": "[S]"},
        "goteo": {"valor": None, "fuente": None, "etiqueta": "[S]", "nota": "pendiente"}},
        "plazo_alfalfa": {"min": 3, "max": 4, "fuente": "FIRA", "etiqueta": "[P]"}}),
    "rotaciones.json": (BUZON_OK / "rotaciones.json").read_text(encoding="utf-8"),
    "demanda_cultivos.csv": (BUZON_OK / "demanda_cultivos.csv").read_text(encoding="utf-8"),
    "relieve_meta.json": (BUZON_OK / "relieve_meta.json").read_text(encoding="utf-8"),
    "fuentes_A1.csv": f"archivo,url_o_api,fecha_consulta,sha256\npower.json,https://power.larc.nasa.gov/api/temporal/daily/point,2026-11-14,{'a' * 64}\n",
    "resultado_H1.md": "# Resultado H1\nmeets the preregistered criterion (prueba)\n",
    "plantillas_explicaciones.md": "<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->\n¿Por qué? Pide {{f1}} millares por {{f2}}.\n",
    "figura_tornado.png": None,  # se arma con la firma PNG
}

INVALIDOS = {
    "memoria_mensual.csv": ("id,anio_agricola,mes,ndvi_mediana,n_validos\nT0001,2025,13,0.45,3\n", "mes"),
    "memoria_parcelas.csv": ("id,anio_agricola,estado,meses_verdes,max_verano,max_invierno,dias_suelo_desnudo_feb_abr,meses_validos\n"
                             "T0001,2025,perennial,10,0.7,0.5,0,12\n", "estado fuera de la lista"),
    "memoria_resumen.csv": ("id,dias_suelo_desnudo_mediana,anios_con_dato,estado_2025\nT0001,0,11,perennial\n",
                            "estado_2025 fuera de la lista"),
    "etiquetas_unidas.csv": ("id,punto_id,bloque,uso,clase_P2,clase_P3,clase_desempate,clase_final,acuerdo\n"
                             "M01,pt1,B1,entrenamiento,alfalfa,alfalfa,,alfalfa,true\n"
                             "M02,pt2,B1,validacion,chile,chile,,chile,true\n", "un mismo bloque con más de un uso"),
    "cultivos_parcelas.csv": (None, "prob_max fuera de [0, 1]"),   # se arma con cultivos_csv
    "tabla_metodos.csv": ("enfoque,f1_macro,f1_por_clase,tiempo\nreglas,1.2,x,1 min\n", "f1_macro"),
    "demanda_parcelas.csv": ("id,opcion,lluvia_pct,bruta_mm_p10,bruta_mm_p50,bruta_mm_p90,neta_mm_p50,etc_mm_p50\n"
                             "T0001,ACTUAL,0,1800,1700,1900,1200,1300\n", "bruta_mm_p10 ≤ bruta_mm_p50 ≤ bruta_mm_p90"),
    "etc_mensual.csv": ("id,opcion,mes,etc_mm_p50\nT0009,ACTUAL,2026-05,180\n", "no existe en parcelas_base.geojson"),
    "et_contraste.csv": ("mes,et_modelo_mm,et_ssebop_mm,et_wapor_mm\n2025-10,-5,80,\n", "et_modelo_mm menor que 0"),
    "h3_series.csv": ("anio_agricola,grupo,umbral_ndvi,n_parcelas,proporcion_con_cultivo_verano\n2025,anuales,0.5,10,0.4\n",
                      "umbral_ndvi fuera de la lista"),
    "cifras.csv": ("clave,valor,unidad,fuente,fecha,etiqueta\nnamo,1,hm3,x,2026-11-14,[P]\nnamo,2,hm3,x,2026-11-14,[P]\n", "clave repetido"),
    "heladas.json": (json.dumps({"ultima_primavera": {"p10": 60, "p50": 75, "p90": 95},
                                 "primera_otono": {"p10": 300, "p50": 290, "p90": 320},
                                 "prob_helada_despues_de": {"02-01": 1.5}, "fuente": "x"}), "probabilidad fuera de [0, 1]"),
    "dotaciones.json": (None, "fuera del deslizador"),
    "supuestos.json": (json.dumps({"eficiencia_parcelaria": {"valor": 0.5}}), "sin fuente ni marca"),
    "rotaciones.json": (None, "plazo fuera de la lista"),   # se arma con rotaciones_con
    "demanda_cultivos.csv": ("cultivo,lluvia_pct,etc_mm_p50,neta_mm_p50,bruta_millares_p10,bruta_millares_p50,bruta_millares_p90\n"
                             "alfalfa,0,1000,900,10,12,14\nalfalfa,0,1000,900,10,12,14\n",
                             "fila repetida para (cultivo, lluvia_pct)"),
    "relieve_meta.json": (None, "falta tormenta.fuente"),   # se arma desde la fixture
    "fuentes_A1.csv": ("archivo,url_o_api,fecha_consulta,sha256\npower.json,https://x,2026-11-14,abc\n", "sha256"),
    "plantillas_explicaciones.md": ("¿Por qué? Pide 7 millares (valor de prueba).\n", "cifras escritas a mano"),
    "figura_tornado.png": (b"no soy un png", "no es PNG"),
    "relieve_parcelas.csv": ("id,pendiente_media_pct,aportacion_externa_ha,frac_depresion\nT0001,120,0,1.5\n", "pendiente_media_pct fuera de [0, 100]"),
    "relieve_rutas.geojson": (json.dumps({"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {}, "geometry": {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]]}}]}),
        "geometría Polygon no permitida"),
}


def contenido_valido(nombre):
    if nombre == "h3_series.csv":
        u = _umbral_ndvi()
        return f"anio_agricola,grupo,umbral_ndvi,n_parcelas,proporcion_con_cultivo_verano\n2025,anuales,{u},10,0.4\n2024,nogal,{u},5,\n"
    if nombre == "dotaciones.json":
        return dotaciones_desde_params()
    if nombre == "figura_tornado.png":
        return ens.FIRMA_PNG + b"\0" * 16
    if nombre == "cultivos_parcelas.csv":
        return cultivos_csv("T0001,alfalfa,0.81,2/2,false,4,libre,alfalfa\n"
                            "T0002,sin_clasificar,0.55,1/2,true\nT0003,nogal,0.92,2/2,False,9,comprometida,")
    return VALIDOS[nombre]


def rotaciones_con(cambio):
    """rotaciones.json de la fixture buzon_ok con un cambio aplicado (función sobre el dict)."""
    obj = json.loads((BUZON_OK / "rotaciones.json").read_text(encoding="utf-8"))
    cambio(obj)
    return json.dumps(obj, ensure_ascii=False)


def relieve_meta_con(cambio):
    """relieve_meta.json de la fixture buzon_ok con un cambio aplicado."""
    obj = json.loads((BUZON_OK / "relieve_meta.json").read_text(encoding="utf-8"))
    cambio(obj)
    return json.dumps(obj, ensure_ascii=False)


@pytest.mark.parametrize("nombre", sorted(VALIDOS))
def test_resto_de_la_tabla_valido_entra(tmp_path, nombre):
    b = buzon_con(tmp_path, {nombre: contenido_valido(nombre)})
    rep = correr(b, tmp_path)
    assert nombre in nombres(rep["entraron"]), rep["rechazados"]


@pytest.mark.parametrize("nombre", sorted(INVALIDOS))
def test_resto_de_la_tabla_invalido_se_rechaza(tmp_path, nombre):
    contenido, clave = INVALIDOS[nombre]
    if nombre == "dotaciones.json":
        tope = LIMITES["deslizador_max"]
        contenido = dotaciones_desde_params(anio_normal={"min": tope, "max": tope + 2, "valor": tope + 1})
    elif nombre == "cultivos_parcelas.csv":
        contenido = cultivos_csv("T0001,alfalfa,1.3,2/2,false")
    elif nombre == "rotaciones.json":
        contenido = rotaciones_con(lambda o: o["rotaciones"][1].update(plazo="bienal"))
    elif nombre == "relieve_meta.json":
        contenido = relieve_meta_con(lambda o: o["tormenta"].pop("fuente"))
    b = buzon_con(tmp_path, {nombre: contenido})
    rep = correr(b, tmp_path)
    assert nombre in nombres(rep["rechazados"]), rep["entraron"]
    assert clave in motivos_de(rep, nombre)


def test_cultivos_regla_de_abstencion(tmp_path):
    umbral = LIMITES["umbral_abstencion"]
    texto = cultivos_csv(f"T0001,alfalfa,{umbral / 2},2/2,false\nT0002,chile,0.9,1/2,false\nT0003,nogal,0.9,2/2,true\n")
    b = buzon_con(tmp_path, {"cultivos_parcelas.csv": texto})
    m = motivos_de(correr(b, tmp_path), "cultivos_parcelas.csv")
    assert "abstencion debe ser true" in m and "2 casos" in m
    assert "abstenida con cultivo_actual distinto de sin_clasificar" in m


ENC_CULTIVOS = ("id,cultivo_actual,prob_max,acuerdo_metodos,abstencion,"
                "edad_perenne_anios,estado_plazo,grupo_fenologico\n")


def cultivos_csv(filas):
    """cultivos_parcelas.csv de prueba. Las filas con solo las 5 columnas del kit reciben
    vacías las 3 que agrega A4 (edad_perenne_anios, estado_plazo, grupo_fenologico)."""
    return ENC_CULTIVOS + "".join(f + (",,," if f.count(",") == 4 else "") + "\n"
                                  for f in filas.strip("\n").split("\n"))


def test_cultivos_solo_reglas_1_de_1_admite_prob_max_vacio(tmp_path):
    """Extensión del contrato (validar_contrato.py, 14-nov): «1/1» = solo reglas fenológicas
    mientras no está el Random Forest; entonces prob_max puede venir vacío."""
    texto = cultivos_csv("T0001,alfalfa,,1/1,false\nT0002,nogal,,1/1,false\nT0003,sin_clasificar,,1/1,true\n")
    b = buzon_con(tmp_path, {"cultivos_parcelas.csv": texto})
    rep = correr(b, tmp_path)
    assert "cultivos_parcelas.csv" in nombres(rep["entraron"]), rep["rechazados"]


@pytest.mark.parametrize("acuerdo", ["2/2", "1/2"])
def test_cultivos_prob_max_vacio_sin_1_de_1_se_rechaza(tmp_path, acuerdo):
    abst, cultivo = ("true", "sin_clasificar") if acuerdo == "1/2" else ("false", "alfalfa")
    texto = cultivos_csv(f"T0001,{cultivo},,{acuerdo},{abst}")
    b = buzon_con(tmp_path, {"cultivos_parcelas.csv": texto})
    rep = correr(b, tmp_path)
    assert "cultivos_parcelas.csv" in nombres(rep["rechazados"]), rep["entraron"]
    assert "prob_max: celda vacía no permitida salvo con acuerdo_metodos 1/1" in motivos_de(rep, "cultivos_parcelas.csv")


def test_cultivos_prob_max_invalido_con_1_de_1_dice_el_error_real(tmp_path):
    """Una celda mal escrita no se confunde con una vacía."""
    texto = cultivos_csv("T0001,alfalfa,abc,1/1,false")
    m = motivos_de(correr(buzon_con(tmp_path, {"cultivos_parcelas.csv": texto}), tmp_path), "cultivos_parcelas.csv")
    assert "prob_max: no es un número" in m and "celda vacía" not in m


@pytest.mark.parametrize("acuerdo", ["3/3", "0/2", "2/3"])
def test_cultivos_acuerdo_fuera_de_la_lista_del_contrato(tmp_path, acuerdo):
    texto = cultivos_csv(f"T0001,sin_clasificar,0.9,{acuerdo},true")
    m = motivos_de(correr(buzon_con(tmp_path, {"cultivos_parcelas.csv": texto}), tmp_path), "cultivos_parcelas.csv")
    assert "acuerdo_metodos fuera de la lista permitida" in m


def test_acuerdos_metodos_iguales_a_validar_contrato():
    """La lista del buzón es la misma que acepta validar_contrato.py (allí está escrita en línea)."""
    fuente = (RAIZ / "validar_contrato.py").read_text(encoding="utf-8")
    lista = re.search(r'acuerdo_metodos"\) not in \(([^)]*)\)', fuente)
    assert lista, "no se encontró la lista de acuerdo_metodos en validar_contrato.py"
    assert set(re.findall(r'"([^"]+)"', lista.group(1))) == set(esquemas.ACUERDOS_METODOS)


@pytest.mark.parametrize("nombre,encabezado,fila", [
    ("memoria_resumen.csv", "id,dias_suelo_desnudo_mediana,anios_con_dato,estado_2025", "T0001,55.5,4,perenne"),
    ("memoria_parcelas.csv",
     "id,anio_agricola,estado,meses_verdes,max_verano,max_invierno,dias_suelo_desnudo_feb_abr,meses_validos",
     "T0001,2025,verano,4,0.6,0.1,55.5,11"),
])
def test_memoria_dias_deben_ser_enteros(tmp_path, nombre, encabezado, fila):
    """Contrato §2.2: los días de suelo desnudo son enteros (validar_contrato los pide con entero=True)."""
    b = buzon_con(tmp_path, {nombre: f"{encabezado}\n{fila}\n"})
    rep = correr(b, tmp_path)
    assert nombre in nombres(rep["rechazados"]), rep["entraron"]
    assert "debe ser entero" in motivos_de(rep, nombre)


def test_cultivos_abstencion_por_ftw(tmp_path):
    """ftw_confianza (de parcelas_base) < umbral obliga a abstenerse."""
    geo = json.loads((BUZON_OK / "parcelas_base.geojson").read_text(encoding="utf-8"))
    geo["features"][0]["properties"]["ftw_confianza"] = LIMITES["ftw_confianza_min"] - 1
    texto = cultivos_csv("T0001,alfalfa,0.9,2/2,false")
    b = buzon_con(tmp_path, {"parcelas_base.geojson": json.dumps(geo), "cultivos_parcelas.csv": texto}, copiar=())
    assert "ftw_confianza" in motivos_de(correr(b, tmp_path), "cultivos_parcelas.csv")


def test_memoria_dias_ventana_por_anio(tmp_path):
    """2025 no es bisiesto: un día más que la ventana de ese año se rechaza; en 2024 (bisiesto) entra."""
    ventana = PARAMS["suelo"]["ventana_desnudo"]["valor"]
    d25, d24 = ens.dias_ventana(2025, ventana), ens.dias_ventana(2024, ventana)
    enc = "id,anio_agricola,estado,meses_verdes,max_verano,max_invierno,dias_suelo_desnudo_feb_abr,meses_validos\n"
    b = buzon_con(tmp_path, {"memoria_parcelas.csv": enc + f"T0001,2025,verano,4,0.6,0.1,{d25 + 1},11\n"
                                                         f"T0001,2024,verano,4,0.6,0.1,{d24},11\n"})
    m = motivos_de(correr(b, tmp_path), "memoria_parcelas.csv")
    assert "ventana" in m and "2025" in m and "2024" not in m


def test_fuentes_de_origen_van_a_fuentes_json(tmp_path):
    b = buzon_con(tmp_path, {"fuentes_A1.csv": VALIDOS["fuentes_A1.csv"]}, copiar=())
    rep = correr(b, tmp_path)
    origen = [f for f in rep["fuentes"] if f["tipo"] == "origen"]
    assert len(origen) == 1 and origen[0]["de"] == "fuentes_A1.csv" and origen[0]["archivo"] == "power.json"
    assert origen[0]["url_o_api"].startswith("https://power.larc.nasa.gov")


def test_rutas_de_1mb_o_mas_se_rechazan(tmp_path):
    rutas = json.loads((BUZON_OK / "relieve_rutas.geojson").read_text(encoding="utf-8"))
    rutas["_relleno"] = "x" * esquemas.TAMANO_MAX_RUTAS_BYTES
    b = buzon_con(tmp_path, {"relieve_rutas.geojson": json.dumps(rutas)}, copiar=())
    assert "debe pesar menos de" in motivos_de(correr(b, tmp_path), "relieve_rutas.geojson")


def test_parcelas_avisos_bbox_y_protagonistas(tmp_path):
    geo = json.loads((BUZON_OK / "parcelas_base.geojson").read_text(encoding="utf-8"))
    geo["features"][0]["properties"]["protagonista"] = False
    oeste = LIMITES["bbox"][0]
    geo["features"][1]["geometry"]["coordinates"][0][0][0] = oeste - 1
    geo["features"][1]["geometry"]["coordinates"][0][-1][0] = oeste - 1
    b = buzon_con(tmp_path, {"parcelas_base.geojson": json.dumps(geo)}, copiar=())
    rep = correr(b, tmp_path)
    avisos = " ".join(rep["entraron"][0]["avisos"])
    # Sin «zona», la parcela es de la zona por omisión: solo se avisa (no se exige el rectángulo).
    assert "fuera del rectángulo de su zona" in avisos and "protagonistas" in avisos


@pytest.mark.parametrize("cambio, clave", [
    (lambda p: p.update(id="T0001"), "id repetido"),
    (lambda p: p.update(ftw_confianza=101), "ftw_confianza fuera de [0, 100]"),
    (lambda p: p.update(protagonista="sí"), "protagonista: debe ser true o false"),
    (lambda p: p.pop("modulo"), "falta la propiedad modulo"),
])
def test_parcelas_propiedades_invalidas(tmp_path, cambio, clave):
    geo = json.loads((BUZON_OK / "parcelas_base.geojson").read_text(encoding="utf-8"))
    cambio(geo["features"][1]["properties"])
    b = buzon_con(tmp_path, {"parcelas_base.geojson": json.dumps(geo)}, copiar=())
    assert clave in motivos_de(correr(b, tmp_path), "parcelas_base.geojson")


def test_parcelas_coordenadas_proyectadas(tmp_path):
    geo = json.loads((BUZON_OK / "parcelas_base.geojson").read_text(encoding="utf-8"))
    geo["features"][0]["geometry"]["coordinates"] = [[[400000, 3110000], [400300, 3110000], [400300, 3110300],
                                                     [400000, 3110000]]]
    b = buzon_con(tmp_path, {"parcelas_base.geojson": json.dumps(geo)}, copiar=())
    assert "proyectadas" in motivos_de(correr(b, tmp_path), "parcelas_base.geojson")


# ---------------------------------------------------------------------------------------
# Formatos del acuerdo con la sesión de datos (14-nov-2026) y crudos de Earth Engine
# ---------------------------------------------------------------------------------------
def test_cultivos_1_de_1_reglas_entra_con_prob_max_vacio_y_avisa(tmp_path):
    """«1/1 (reglas)» (solo reglas; Random Forest pendiente) se lee como «1/1»: prob_max puede
    venir vacío y el reporte dice cuántas celdas se leyeron así. El archivo se copia tal cual."""
    texto = cultivos_csv("T0001,alfalfa,,1/1 (reglas),False,3,por_vencer,alfalfa\n"
                         "T0002,sin_clasificar,,1/1 (reglas),True,,,anual_verano")
    b = buzon_con(tmp_path, {"cultivos_parcelas.csv": texto})
    rep = correr(b, tmp_path)
    x = next(x for x in rep["entraron"] if x["archivo"] == "cultivos_parcelas.csv")
    assert any("2 celdas «1/1 (reglas)» se leyeron como «1/1»" in a for a in x["avisos"]), x["avisos"]
    assert (tmp_path / "salida/cultivos_parcelas.csv").read_text(encoding="utf-8") == texto


@pytest.mark.parametrize("fila, clave", [
    ("T0002,sin_clasificar,,1/1 (reglas),True,,por_vencer,anual_verano", "abstenida con estado_plazo"),
    ("T0002,sin_clasificar,,1/1 (reglas),True,4,,anual_verano", "abstenida con edad_perenne_anios"),
    ("T0002,alfalfa,,1/1 (reglas),False,3,vencida,alfalfa", "estado_plazo fuera de la lista"),
    ("T0002,alfalfa,,1/1 (regla),False,3,libre,alfalfa", "acuerdo_metodos"),
    ("T0002,alfalfa,,2/2 (reglas),False,3,libre,alfalfa", "acuerdo_metodos"),
    ("T0002,alfalfa,,1/1 (reglas),False,-1,libre,alfalfa", "edad_perenne_anios menor que 0"),
])
def test_cultivos_formato_a4_invalido(tmp_path, fila, clave):
    b = buzon_con(tmp_path, {"cultivos_parcelas.csv": cultivos_csv(fila)})
    rep = correr(b, tmp_path)
    assert "cultivos_parcelas.csv" in nombres(rep["rechazados"]), rep["entraron"]
    assert clave in motivos_de(rep, "cultivos_parcelas.csv")


def test_cultivos_sin_columnas_de_a4_se_rechaza(tmp_path):
    texto = "id,cultivo_actual,prob_max,acuerdo_metodos,abstencion\nT0001,alfalfa,0.9,2/2,false\n"
    m = motivos_de(correr(buzon_con(tmp_path, {"cultivos_parcelas.csv": texto}), tmp_path), "cultivos_parcelas.csv")
    assert "faltan columnas obligatorias: edad_perenne_anios, estado_plazo, grupo_fenologico" in m


@pytest.mark.parametrize("cambio, clave", [
    (lambda o: o["rotaciones"][0]["lamina_bruta_millares"]["-20"].update(p90=1), "lamina_bruta_millares.-20: no se cumple p10 ≤ p50 ≤ p90"),
    (lambda o: o["rotaciones"][0]["lamina_bruta_millares"].pop("-20"), "se esperan exactamente las llaves 0, -20"),
    (lambda o: o["rotaciones"][0]["lamina_bruta_millares"].update({"-10": {}}), "se esperan exactamente las llaves"),
    (lambda o: o["rotaciones"][0]["lamina_bruta_millares"]["0"].update(etc_mm_p50=-5), "lamina_bruta_millares.0.etc_mm_p50 menor que 0"),
    (lambda o: o["rotaciones"][0]["lamina_bruta_millares"]["0"].pop("neta_mm_p50"), "falta lamina_bruta_millares.0.neta_mm_p50"),
    (lambda o: o["rotaciones"][0].update(plazo_anios={"min": 4, "max": 3}), "plazo_anios: no se cumple min ≤ max"),
    (lambda o: o["rotaciones"][1].update(id="R_PRUEBA_A"), "id repetido en rotaciones"),
    (lambda o: o["rotaciones"][1].update(cultivos=["sorgo"]), "cultivo que no está en el objeto «cultivos»"),
    (lambda o: o["rotaciones"][1].update(cultivos="chile"), "cultivos debe ser una lista"),
    (lambda o: o["rotaciones"][1].pop("nombre"), "falta nombre"),
    (lambda o: o["params"].update(sin_etiqueta={"valor": 1}), "params: entrada sin etiqueta"),
    (lambda o: o["params"].update(suelto=2000), "params: entrada sin valor ni etiqueta"),
    (lambda o: o.pop("anios_clima"), "falta la llave anios_clima"),
    (lambda o: o.update(rotaciones={}), "rotaciones debe ser una lista"),
    (lambda o: o.update(opciones=[]) or o.pop("rotaciones"), "falta la llave rotaciones"),
])
def test_rotaciones_invalidas(tmp_path, cambio, clave):
    b = buzon_con(tmp_path, {"rotaciones.json": rotaciones_con(cambio)}, copiar=())
    rep = correr(b, tmp_path)
    assert "rotaciones.json" in nombres(rep["rechazados"]), rep["entraron"]
    assert clave in motivos_de(rep, "rotaciones.json")


def test_rotaciones_descanso_sin_cultivos_entra(tmp_path):
    """Una rotación de descanso trae «cultivos» vacía y lámina 0: es válida."""
    obj = json.loads((BUZON_OK / "rotaciones.json").read_text(encoding="utf-8"))
    assert any(r["cultivos"] == [] for r in obj["rotaciones"])
    b = buzon_con(tmp_path, {"rotaciones.json": json.dumps(obj)}, copiar=())
    assert nombres(correr(b, tmp_path)["entraron"]) == ["rotaciones.json"]


@pytest.mark.parametrize("cambio, clave", [
    (lambda o: o.update(celda_ha=-0.1), "celda_ha debe ser mayor que 0"),
    (lambda o: o["tormenta"].update(mm=-1), "tormenta.mm menor que 0"),
    (lambda o: o.update(tormenta=15), "tormenta debe ser un objeto"),
    (lambda o: o.update(rotulo=""), "rotulo: vacío o null no permitido"),
    (lambda o: o.pop("umbral_ruta_etiqueta"), "falta umbral_ruta_etiqueta"),
])
def test_relieve_meta_invalido(tmp_path, cambio, clave):
    b = buzon_con(tmp_path, {"relieve_meta.json": relieve_meta_con(cambio)}, copiar=())
    assert clave in motivos_de(correr(b, tmp_path), "relieve_meta.json")


@pytest.mark.parametrize("cambio, clave", [
    (lambda t: t.replace("chile,0,500,450,5,6,7", "chile,0,500,450,8,6,7"),
     "bruta_millares_p10 ≤ bruta_millares_p50 ≤ bruta_millares_p90"),
    (lambda t: t.replace("chile,0,500,450,", "chile,0,500,-450,"), "neta_mm_p50 menor que 0"),
    (lambda t: t.replace("bruta_millares_p90", "bruta_mm_p90"), "faltan columnas obligatorias: bruta_millares_p90"),
])
def test_demanda_cultivos_invalida(tmp_path, cambio, clave):
    texto = cambio((BUZON_OK / "demanda_cultivos.csv").read_text(encoding="utf-8"))
    b = buzon_con(tmp_path, {"demanda_cultivos.csv": texto}, copiar=())
    assert clave in motivos_de(correr(b, tmp_path), "demanda_cultivos.csv")


@pytest.mark.parametrize("nombre, cambio, clave", [
    ("memoria_parcelas.csv", lambda t: t.replace("T0001,2025,perenne,10,", "T0001,2025,perenne,13,"), "meses_verdes fuera de [0, 12]"),
    ("memoria_parcelas.csv", lambda t: t.replace("T0001,2025,perenne,10,0.7,", "T0001,2025,perenne,10,1.7,"), "max_verano fuera de [-1, 1]"),
    ("memoria_parcelas.csv", lambda t: t + "T0001,2025,perenne,10,0.7,0.5,0,12\n", "fila repetida para (id, anio_agricola)"),
    ("memoria_parcelas.csv", lambda t: t.replace("T0001,2025,", "T0001,2025.5,"), "anio_agricola: debe ser entero"),
    ("memoria_resumen.csv", lambda t: t.replace("T0002,45,", "T0002,91,"), "dias_suelo_desnudo_mediana fuera de [0, "),
    ("memoria_resumen.csv", lambda t: t.replace("T0002,45,2,", "T0002,45,,"), "anios_con_dato: celda vacía no permitida"),
])
def test_memoria_formato_invalido(tmp_path, nombre, cambio, clave):
    texto = cambio((BUZON_OK / nombre).read_text(encoding="utf-8"))
    b = buzon_con(tmp_path, {nombre: texto})
    assert clave in motivos_de(correr(b, tmp_path), nombre)


@pytest.mark.parametrize("nombre", ["hls_mensual_2025_10_a_2026_09.tif", "hls_reflect_2026_03.tif",
                                    "hls_ndvi_memoria_2019.tif", "piloto_consumo.tif", "HLS_NDVI_MEMORIA_2020.TIF"])
def test_crudos_de_earth_engine_se_listan_aparte(tmp_path, nombre):
    """Sin línea en LEEME.md y sin ser TIFF válidos: no se rechazan, no se copian, no van a fuentes.json."""
    b = buzon_con(tmp_path, {nombre: b"crudo de prueba (fixture)"}, copiar=())
    (b / "P2").mkdir()
    (b / "P2" / "piloto_consumo.tif").write_bytes(b"crudo de prueba (fixture)")
    rep = correr(b, tmp_path)
    assert rep["rechazados"] == [] and rep["entraron"] == [] and rep["fuentes"] == []
    assert sorted((c["archivo"], c["rol"]) for c in rep["crudos"]) == sorted([(nombre, None), ("P2/piloto_consumo.tif", "P2")])
    assert sorted(p.name for p in (tmp_path / "salida").iterdir()) == ["fuentes.json"]
    # Que LEEME.md los mencione tampoco es problema (ni aviso de «no están en el buzón»).
    assert not any("no están en el buzón" in a for a in rep["avisos"])
    assert ens.TITULO_CRUDOS in ens.texto_reporte(rep)


def test_nasadem_no_es_crudo_y_se_sigue_validando():
    assert not ens.es_crudo("nasadem_zona_piloto.tif") and not ens.es_crudo("hls_mensual_parcelas.csv")


def test_parcelas_con_ftw_null_se_sigue_rechazando(tmp_path):
    """Una parcela con ftw_confianza null se rechaza (la sesión de datos lo corrige en el origen)."""
    geo = json.loads((BUZON_OK / "parcelas_base.geojson").read_text(encoding="utf-8"))
    geo["features"][2]["properties"]["ftw_confianza"] = None
    b = buzon_con(tmp_path, {"parcelas_base.geojson": json.dumps(geo)}, copiar=())
    assert "ftw_confianza: vacío o null no permitido" in motivos_de(correr(b, tmp_path), "parcelas_base.geojson")


# ---------------------------------------------------------------------------------------
# GeoTIFF
# ---------------------------------------------------------------------------------------
def test_fixture_tif_lector_stdlib_igual_a_pillow():
    pytest.importorskip("PIL")
    for tif in (BUZON_OK / "nasadem_zona_piloto.tif", BUZON_MALO / "nasadem_zona_piloto.tif"):
        a, b = ens.leer_tiff_stdlib(tif), ens.leer_tiff_pillow(tif)
        assert (a["ancho"], a["alto"]) == (b["ancho"], b["alto"])
        assert set(a["etiquetas"]) - {256, 257} == set(b["etiquetas"]) - {256, 257}
        for t in set(b["etiquetas"]) - {256, 257}:
            assert tuple(a["etiquetas"][t]) == pytest.approx(tuple(b["etiquetas"][t]))


def test_fixture_tif_entra_sin_pillow(tmp_path, monkeypatch):
    """Sin Pillow (como en GitHub Actions) el lector de la biblioteca estándar valida igual."""
    monkeypatch.setattr(ens, "leer_tiff", ens.leer_tiff_stdlib)
    b = buzon_con(tmp_path, {}, copiar=("nasadem_zona_piloto.tif",))
    rep = correr(b, tmp_path)
    assert nombres(rep["entraron"]) == ["nasadem_zona_piloto.tif"]
    assert any("Pillow no está instalado" in a for a in rep["entraron"][0]["avisos"])
    b2 = buzon_con(tmp_path / "malo", {}, base=BUZON_MALO, copiar=("nasadem_zona_piloto.tif",))
    assert "34735" in motivos_de(correr(b2, tmp_path / "malo"), "nasadem_zona_piloto.tif")


@pytest.mark.parametrize("kw, clave", [
    ({}, None),
    ({"big_tiff": True}, None),
    ({"raster_punto": True}, None),
    ({"epsg": 32613}, "se esperaba EPSG 4326"),
    ({"escala": 10 * ARCOSEG}, "escala del píxel"),
    ({"transformacion": True}, "ModelTransformationTag"),
])
def test_geotiff_casos(tmp_path, kw, clave):
    pytest.importorskip("PIL")
    b = buzon_con(tmp_path, {}, copiar=())
    geotiff_que_cubre(b / "nasadem_zona_piloto.tif", LIMITES["bbox"], **kw)
    (b / "LEEME.md").write_text("| archivo | fuente | fecha | script |\n"
                                + LINEA_LEEME.format(archivo="nasadem_zona_piloto.tif") + "\n", encoding="utf-8")
    rep = correr(b, tmp_path)
    if clave is None:
        assert nombres(rep["entraron"]) == ["nasadem_zona_piloto.tif"], rep["rechazados"]
    else:
        assert clave in motivos_de(rep, "nasadem_zona_piloto.tif")
    if kw.get("big_tiff"):   # el lector de la biblioteca estándar también lee BigTIFF
        t = ens.leer_tiff_stdlib(b / "nasadem_zona_piloto.tif")
        assert t["etiquetas"][esquemas.GEOTIFF["tag_escala"]][0] == pytest.approx(ARCOSEG)


def test_geotiff_que_no_cubre_la_zona(tmp_path):
    pytest.importorskip("PIL")
    bbox = LIMITES["bbox"]
    b = buzon_con(tmp_path, {}, copiar=())
    escribir_geotiff(b / "nasadem_zona_piloto.tif", oeste=bbox[0], norte=bbox[3], ancho=10, alto=10)
    (b / "LEEME.md").write_text("| archivo | fuente | fecha | script |\n"
                                + LINEA_LEEME.format(archivo="nasadem_zona_piloto.tif") + "\n", encoding="utf-8")
    m = motivos_de(correr(b, tmp_path), "nasadem_zona_piloto.tif")
    assert f"no cubre el rectángulo de la zona {OMISION}" in m and "ni las parcelas" not in m


def params_sin_zonas():
    """data/params.json sin zona_piloto.zonas (como antes de la decisión de dos zonas)."""
    params = json.loads(json.dumps(PARAMS))
    del params["zona_piloto"]["zonas"]
    return params


@pytest.mark.parametrize("sin_zonas, clave", [
    (True, "zona_piloto.bbox de data/params.json es null"),
    (False, f"el rectángulo de la zona {OMISION} (zona_piloto.zonas) de data/params.json es null"),
])
def test_geotiff_bbox_null_solo_avisa(tmp_path, sin_zonas, clave):
    """Sin rectángulo en params no se comprueba la cobertura: se avisa (nunca se inventa)."""
    if sin_zonas:
        params = params_sin_zonas()
        params["zona_piloto"]["bbox"]["valor"] = None
    else:
        params = json.loads(json.dumps(PARAMS))
        next(z for z in params["zona_piloto"]["zonas"]["valor"] if z["id"] == OMISION)["bbox"] = None
    b = buzon_con(tmp_path, {}, copiar=("nasadem_zona_piloto.tif",))
    rep = correr(b, tmp_path, params=params)
    assert nombres(rep["entraron"]) == ["nasadem_zona_piloto.tif"]
    assert any(clave in a for a in rep["entraron"][0]["avisos"]), rep["entraron"][0]["avisos"]


def test_no_es_tiff(tmp_path):
    b = buzon_con(tmp_path, {"nasadem_zona_piloto.tif": b"GIF89a no soy tiff"}, copiar=())
    assert "TIFF" in motivos_de(correr(b, tmp_path), "nasadem_zona_piloto.tif")


# ---------------------------------------------------------------------------------------
# Dos zonas piloto (docs/decisiones/2026-11-14_dos_zonas.md)
# ---------------------------------------------------------------------------------------
def parcelas_dos_zonas(cambio=None):
    """parcelas_base.geojson de buzon_dos_zonas con un cambio (función sobre la lista de features)."""
    geo = json.loads((BUZON_DOS_ZONAS / "parcelas_base.geojson").read_text(encoding="utf-8"))
    if cambio:
        cambio(geo["features"])
    return json.dumps(geo, ensure_ascii=False)


def feature_de(features, pid):
    return next(f for f in features if f["properties"]["id"] == pid)


def cuadro_en(bbox, lado=0.003):
    """Anillo cuadrado de prueba en el centro de bbox (para mover una parcela de zona)."""
    o, s = (bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2
    return [[[o, s], [o + lado, s], [o + lado, s + lado], [o, s + lado], [o, s]]]


def test_dos_zonas_todo_entra_con_su_zona(tmp_path):
    rep = correr(BUZON_DOS_ZONAS, tmp_path)
    esperados = archivos_de(BUZON_DOS_ZONAS)
    assert rep["rechazados"] == [] and rep["retenidos"] == [], rep["rechazados"]
    assert nombres(rep["entraron"]) == esperados
    por_nombre = {x["archivo"]: x for x in rep["entraron"]}
    salida = tmp_path / "salida"
    for n in esperados:
        # Se copia con su nombre tal cual y sin modificar.
        assert (salida / n).read_bytes() == (BUZON_DOS_ZONAS / n).read_bytes(), n
        if n.split(".")[0].endswith(f"_{OTRA}"):
            assert por_nombre[n]["zona"] == OTRA, n
    # Los archivos con sufijo se validan con el esquema de su base (pieza de la base).
    assert por_nombre[f"rotaciones_{OTRA}.json"]["pieza"] == esquemas.ESQUEMAS["rotaciones.json"]["pieza"]
    assert por_nombre[f"nasadem_zona_piloto_{OTRA}.tif"]["pieza"] == "A9"
    # Archivos con las dos zonas: cuántos elementos de cada una.
    assert por_nombre["parcelas_base.geojson"]["zona"] is None
    assert por_nombre["parcelas_base.geojson"]["zonas"] == {OMISION: 2, OTRA: 2}
    assert por_nombre["relieve_parcelas.csv"]["zonas"] == {OMISION: 2, OTRA: 2}
    assert por_nombre["relieve_rutas.geojson"]["zonas"] == {OMISION: 1, OTRA: 1}
    assert not por_nombre[f"nasadem_zona_piloto_{OTRA}.tif"]["avisos"]
    # fuentes.json lleva la zona de los archivos por zona; el reporte y la bitácora también.
    fuentes = {f["archivo"]: f for f in rep["fuentes"]}
    assert fuentes[f"eto_diaria_{OTRA}.csv"]["zona"] == OTRA and "zona" not in fuentes["relieve_parcelas.csv"]
    assert f"zona {OTRA}" in ens.texto_reporte(rep)
    assert f"(zona {OTRA})" in (tmp_path / "log.md").read_text(encoding="utf-8")
    assert not any("protagonistas" in a for a in por_nombre["parcelas_base.geojson"]["avisos"])


def test_parcela_fuera_del_rectangulo_de_su_zona_se_rechaza(tmp_path):
    """Una parcela L (zona lazaro_cardenas) cuyo centroide cae en el rectángulo de la otra zona."""
    def mover(features):
        feature_de(features, "L0001")["geometry"]["coordinates"] = cuadro_en(LIMITES["zonas"][OMISION]["bbox"])
    b = buzon_con(tmp_path, {"parcelas_base.geojson": parcelas_dos_zonas(mover)}, copiar=())
    m = motivos_de(correr(b, tmp_path), "parcelas_base.geojson")
    assert f"centroide fuera del rectángulo de su zona {OTRA}" in m and "L0001" in m


@pytest.mark.parametrize("pid, nuevo", [("L0002", "P0099"), ("P0002", "0002")])
def test_parcela_con_zona_y_sin_su_prefijo_se_rechaza(tmp_path, pid, nuevo):
    def cambiar(features):
        feature_de(features, pid)["properties"]["id"] = nuevo
    zona = OTRA if pid.startswith(LIMITES["zonas"][OTRA]["prefijo_id"]) else OMISION
    b = buzon_con(tmp_path, {"parcelas_base.geojson": parcelas_dos_zonas(cambiar)}, copiar=())
    m = motivos_de(correr(b, tmp_path), "parcelas_base.geojson")
    assert f"id sin el prefijo «{LIMITES['zonas'][zona]['prefijo_id']}» de su zona {zona}" in m and nuevo in m


@pytest.mark.parametrize("valor, clave", [
    ("meoqui", "zona fuera de la lista permitida"),
    (None, "zona: vacío o null no permitido"),
    (7, "zona: debe ser texto"),
])
def test_parcela_con_zona_invalida_se_rechaza(tmp_path, valor, clave):
    def cambiar(features):
        feature_de(features, "L0001")["properties"]["zona"] = valor
    b = buzon_con(tmp_path, {"parcelas_base.geojson": parcelas_dos_zonas(cambiar)}, copiar=())
    assert clave in motivos_de(correr(b, tmp_path), "parcelas_base.geojson")


def test_ids_unicos_entre_zonas(tmp_path):
    def repetir(features):
        feature_de(features, "L0002")["properties"]["id"] = "L0001"
    b = buzon_con(tmp_path, {"parcelas_base.geojson": parcelas_dos_zonas(repetir)}, copiar=())
    assert "id repetido" in motivos_de(correr(b, tmp_path), "parcelas_base.geojson")


def test_parcela_sin_zona_es_de_la_zona_por_omision_sin_prefijo(tmp_path):
    """Compatibilidad: sin «zona», no se exige prefijo (los T… de buzon_ok entran) y cuenta en la
    zona por omisión; mezclar parcelas con y sin «zona» también es válido."""
    def quitar(features):
        feature_de(features, "P0001")["properties"].pop("zona")
        p2 = feature_de(features, "P0002")["properties"]
        p2.pop("zona")
        p2["id"] = "T0002"
    b = buzon_con(tmp_path, {"parcelas_base.geojson": parcelas_dos_zonas(quitar)}, copiar=())
    rep = correr(b, tmp_path)
    assert rep["rechazados"] == [], rep["rechazados"]
    assert rep["entraron"][0]["zonas"] == {OMISION: 2, OTRA: 2}


def test_rotaciones_de_la_otra_zona_valido_entra(tmp_path):
    nombre = f"rotaciones_{OTRA}.json"
    b = buzon_con(tmp_path, {nombre: (BUZON_DOS_ZONAS / nombre).read_text(encoding="utf-8")}, copiar=())
    rep = correr(b, tmp_path)
    assert nombres(rep["entraron"]) == [nombre] and rep["entraron"][0]["zona"] == OTRA
    assert (tmp_path / "salida" / nombre).read_bytes() == (BUZON_DOS_ZONAS / nombre).read_bytes()
    # «rotaciones.json» sigue simulado: el de la otra zona no lo sustituye.
    assert "rotaciones.json" in rep["sigue_simulado"]


def test_archivo_con_sufijo_se_valida_con_el_esquema_de_su_base(tmp_path):
    nombre = f"rotaciones_{OTRA}.json"
    b = buzon_con(tmp_path, {nombre: rotaciones_con(lambda o: o["rotaciones"][1].update(plazo="bienal"))}, copiar=())
    rep = correr(b, tmp_path)
    assert "plazo fuera de la lista" in motivos_de(rep, nombre)
    assert rep["rechazados"][0]["zona"] == OTRA


@pytest.mark.parametrize("nombre, base", [
    ("rotaciones_meoqui.json", "rotaciones.json"),
    ("eto_diaria_lazaro.csv", "eto_diaria.csv"),
    ("relieve_meta_norte.json", "relieve_meta.json"),
    ("demanda_cultivos_LAZARO_CARDENAS.csv", "demanda_cultivos.csv"),
])
def test_sufijo_de_zona_desconocido_se_rechaza(tmp_path, nombre, base):
    sufijo = nombre.rsplit(".", 1)[0][len(base.rsplit(".", 1)[0]) + 1:]
    b = buzon_con(tmp_path, {nombre: (BUZON_OK / base).read_bytes()}, copiar=())
    rep = correr(b, tmp_path)
    m = motivos_de(rep, nombre)
    assert f"sufijo de zona «{sufijo}» desconocido" in m and ", ".join(LIMITES["zonas_ids"]) in m
    assert not (tmp_path / "salida" / nombre).exists()


def test_sufijo_de_la_zona_por_omision_se_rechaza(tmp_path):
    """La zona por omisión va sin sufijo: dos nombres para la misma zona no pueden convivir."""
    nombre = f"eto_diaria_{OMISION}.csv"
    b = buzon_con(tmp_path, {nombre: (BUZON_OK / "eto_diaria.csv").read_bytes()}, copiar=())
    assert "van sin sufijo" in motivos_de(correr(b, tmp_path), nombre)


def test_sufijo_sin_zonas_en_params_se_rechaza_y_lo_demas_sigue(tmp_path):
    """Sin zona_piloto.zonas: un sufijo no se puede comprobar (rechazo); lo demás funciona como
    con una zona y las parcelas con «zona» solo se avisan."""
    b = tmp_path / "b"
    shutil.copytree(BUZON_DOS_ZONAS, b)
    rep = correr(b, tmp_path, params=params_sin_zonas())
    sufijados = sorted(n for n in archivos_de(b) if f"_{OTRA}." in n)
    assert nombres(rep["rechazados"]) == sufijados
    assert all("no trae zona_piloto.zonas" in motivos_de(rep, n) for n in sufijados)
    parcelas = next(x for x in rep["entraron"] if x["archivo"] == "parcelas_base.geojson")
    assert any("no trae zona_piloto.zonas" in a for a in parcelas["avisos"])


@pytest.mark.parametrize("cambio, entra, clave", [
    (lambda f: f[1]["properties"].update(zona="meoqui"), False, "zona fuera de la lista permitida"),
    (lambda f: f[1]["properties"].pop("zona"), True, None),
    (lambda f: f[1].update(properties=None), True, None),
])
def test_rutas_con_zona(tmp_path, cambio, entra, clave):
    rutas = json.loads((BUZON_DOS_ZONAS / "relieve_rutas.geojson").read_text(encoding="utf-8"))
    cambio(rutas["features"])
    b = buzon_con(tmp_path, {"relieve_rutas.geojson": json.dumps(rutas)}, copiar=())
    rep = correr(b, tmp_path)
    if entra:   # sin «zona» (o sin properties) la línea es de la zona por omisión
        assert rep["entraron"][0]["zonas"] == {OMISION: 2}
    else:
        assert clave in motivos_de(rep, "relieve_rutas.geojson")


def test_nasadem_cubre_el_rectangulo_de_su_zona_no_la_envolvente(tmp_path):
    """El NASADEM de una zona cubre SU rectángulo: con sufijo entra; el mismo archivo sin sufijo
    (zona por omisión) no cubre esa zona y se rechaza."""
    tif = (BUZON_DOS_ZONAS / f"nasadem_zona_piloto_{OTRA}.tif").read_bytes()
    b = buzon_con(tmp_path, {f"nasadem_zona_piloto_{OTRA}.tif": tif, "nasadem_zona_piloto.tif": tif}, copiar=())
    rep = correr(b, tmp_path)
    assert nombres(rep["entraron"]) == [f"nasadem_zona_piloto_{OTRA}.tif"]
    assert f"no cubre el rectángulo de la zona {OMISION}" in motivos_de(rep, "nasadem_zona_piloto.tif")
    assert rep["rechazados"][0]["zona"] == OMISION
    # Y el de la zona por omisión (buzon_ok) no cubre la otra zona.
    b2 = buzon_con(tmp_path / "2", {f"nasadem_zona_piloto_{OTRA}.tif": (BUZON_OK / "nasadem_zona_piloto.tif").read_bytes()},
                   copiar=())
    assert f"no cubre el rectángulo de la zona {OTRA}" in motivos_de(correr(b2, tmp_path / "2"),
                                                                     f"nasadem_zona_piloto_{OTRA}.tif")


def test_nasadem_que_cubre_las_parcelas_pero_no_el_rectangulo(tmp_path):
    """Compatibilidad (rectángulo ampliado después de exportar): si no cubre el rectángulo de su
    zona pero sí todas sus parcelas del parcelas_base.geojson de la corrida, entra con aviso; si
    tampoco cubre las parcelas, se rechaza."""
    pytest.importorskip("PIL")
    geo = json.loads((BUZON_OK / "parcelas_base.geojson").read_text(encoding="utf-8"))
    # Caja de los vértices de las parcelas de la fixture (todas sin «zona»: zona por omisión).
    puntos = [ens.revisar_coordenadas(f["geometry"]["type"], f["geometry"]["coordinates"])[1] for f in geo["features"]]
    caja = [min(p[0] for p in puntos), min(p[1] for p in puntos), max(p[2] for p in puntos), max(p[3] for p in puntos)]
    b = buzon_con(tmp_path, {"nasadem_zona_piloto.tif": b""})
    geotiff_que_cubre(b / "nasadem_zona_piloto.tif", caja)
    rep = correr(b, tmp_path)
    tif = next(x for x in rep["entraron"] if x["archivo"] == "nasadem_zona_piloto.tif")
    assert any("re-exportar" in a and f"las {len(geo['features'])} parcelas de la zona {OMISION}" in a
               for a in tif["avisos"]), tif["avisos"]
    # Sin parcelas en la corrida no hay con qué comprobar: se rechaza.
    b2 = buzon_con(tmp_path / "2", {"nasadem_zona_piloto.tif": (b / "nasadem_zona_piloto.tif").read_bytes()}, copiar=())
    assert "no cubre el rectángulo" in motivos_de(correr(b2, tmp_path / "2"), "nasadem_zona_piloto.tif")
    # Con parcelas fuera de lo que cubre: se rechaza y lo dice.
    geo["features"][0]["geometry"]["coordinates"] = cuadro_en(LIMITES["zonas"][OMISION]["bbox"])
    geo["features"][0]["geometry"]["coordinates"][0] = [[x - 0.1, y] for x, y in geo["features"][0]["geometry"]["coordinates"][0]]
    b3 = buzon_con(tmp_path / "3", {"parcelas_base.geojson": json.dumps(geo),
                                    "nasadem_zona_piloto.tif": (b / "nasadem_zona_piloto.tif").read_bytes()}, copiar=())
    assert "ni las parcelas de la zona" in motivos_de(correr(b3, tmp_path / "3"), "nasadem_zona_piloto.tif")


def test_entrega_real_de_una_zona_sigue_validando(tmp_path):
    """La entrega real actual (data/processed: parcelas sin «zona», archivos sin sufijo) entra
    completa como un buzón, con LEEME.md generado aquí (fuente «prueba»)."""
    entregas = sorted(p.name for p in PROCESADOS.iterdir()
                      if p.is_file() and not p.name.startswith(".") and p.name != ens.NOMBRE_FUENTES)
    if ens.E.ARCHIVO_PARCELAS not in entregas:
        pytest.skip("data/processed aún no tiene parcelas_base.geojson")
    b = tmp_path / "buzon"
    b.mkdir()
    for n in entregas:
        shutil.copy(PROCESADOS / n, b / n)
    (b / "LEEME.md").write_text("| archivo | fuente | fecha | script |\n|---|---|---|---|\n"
                                + "".join(f"| {n} | prueba | 2026-11-14 | tests/test_ensamblar.py |\n" for n in entregas),
                                encoding="utf-8")
    rep = correr(b, tmp_path)
    assert rep["rechazados"] == [] and rep["retenidos"] == [], [(x["archivo"], x["motivos"]) for x in rep["rechazados"]]
    assert nombres(rep["entraron"]) == entregas
    for x in rep["entraron"]:
        assert x["zona"] == (OMISION if x["archivo"] in esquemas.ARCHIVOS_POR_ZONA else None), x["archivo"]
        assert set(x.get("zonas") or {OMISION: 0}) == {OMISION}, x["archivo"]


# ---------------------------------------------------------------------------------------
# Esquemas y límites
# ---------------------------------------------------------------------------------------
def test_limites_salen_de_params():
    assert LIMITES["area_min_ha"] == PARAMS["mapa"]["area_min_ha"]["valor"]
    assert LIMITES["bbox"] == PARAMS["zona_piloto"]["bbox"]["valor"]
    assert LIMITES["lluvia_pct"] == PARAMS["lluvia_pct"]["valor"]
    assert LIMITES["umbrales_ndvi"][0] == _umbral_ndvi()
    zonas = PARAMS["zona_piloto"]["zonas"]["valor"]
    assert LIMITES["zonas_ids"] == sorted(z["id"] for z in zonas)
    for z in zonas:
        assert LIMITES["zonas"][z["id"]]["bbox"] == z["bbox"]
        assert LIMITES["zonas"][z["id"]]["prefijo_id"] == z["prefijo_id"]
    # La zona por omisión y la de la fixture con sufijo existen en params.
    assert {OMISION, OTRA} <= set(LIMITES["zonas_ids"])
    assert ens.limites_derivados(params_sin_zonas())["zonas"] is None


def test_params_sin_clave_avisa_y_no_inventa(tmp_path):
    params = json.loads(json.dumps(PARAMS))
    del params["mapa"]["area_min_ha"]
    rep = correr(BUZON_OK, tmp_path, params=params)
    parcelas = next(x for x in rep["entraron"] if x["archivo"] == "parcelas_base.geojson")
    assert any("area_min_ha" in a for a in parcelas["avisos"])


def _campos_json(campos):
    """Todos los campos de un esquema de objeto JSON, incluidos los anidados."""
    for campo in campos.values():
        yield campo
        if campo["tipo"] == "objeto":
            yield from _campos_json(campo["campos"])
        elif campo["tipo"] == "lista":
            yield campo["elemento"]


def test_esquemas_usan_reglas_y_tipos_conocidos():
    tipos_campo = {"texto", "numero", "entero", "fecha", "mes", "mes_o_numero", "bool", "k_de_n", "sha256"}
    todos = list(esquemas.ESQUEMAS.items()) + list(esquemas.PATRONES)
    for nombre, esq in todos:
        assert esq["tipo"] in ens.VALIDADORES, nombre
        assert esq.get("fuente_reglas"), nombre
        json_campos = list(_campos_json({**esq.get("campos", {}), **esq.get("rotacion", {})}))
        for campo in json_campos:
            assert campo["tipo"] in tipos_campo | {"objeto", "lista"}, (nombre, campo)
        for campo in [*esq.get("columnas", {}).values(), *esq.get("propiedades", {}).values(),
                      *(c for c in json_campos if c["tipo"] not in ("objeto", "lista"))]:
            assert campo["tipo"] in tipos_campo, (nombre, campo)
            for cota in (campo.get("min"), campo.get("max"), campo.get("mayor_que"), campo.get("valores")):
                if isinstance(cota, str):
                    assert cota[1:] in esquemas.LIMITES_DERIVADOS, (nombre, cota)
            if "nulo_si" in campo:   # solo CSV, y la columna de la condición existe
                assert esq["tipo"] == "csv" and campo["nulo_si"]["columna"] in esq["columnas"], (nombre, campo)
        for regla in esq.get("reglas", []):
            assert regla["regla"] in ens.REGLAS_CSV, (nombre, regla)
        if esq["tipo"] == "json":
            assert esq["regla"] in ens.REGLAS_JSON, nombre


# ---------------------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------------------
def cli(*args, env=None):
    import os
    entorno = {k: v for k, v in os.environ.items() if k != "RAIZ_BUZON"}
    entorno.update(env or {})
    return subprocess.run([sys.executable, str(RAIZ / "motor/ensamblar.py"), *args], cwd=RAIZ,
                          capture_output=True, text=True, encoding="utf-8", env=entorno, timeout=120)


def test_cli_buzon_ok(tmp_path):
    p = cli("--buzon", str(BUZON_OK), "--salida", str(tmp_path / "s"))
    assert p.returncode == 0, p.stderr
    assert "ENTRARON (13)" in p.stdout and "RECHAZADOS (0)" in p.stdout
    assert "CRUDOS DE EARTH ENGINE (se procesan con A3; no entran al contrato): 1" in p.stdout
    assert "hls_ndvi_memoria_2016.tif" in p.stdout
    assert (tmp_path / "s/entregas_log.md").exists()


def test_cli_buzon_malo_sale_con_1(tmp_path):
    p = cli("--buzon", str(BUZON_MALO), "--salida", str(tmp_path / "s"))
    assert p.returncode == 1 and "RECHAZADOS (12)" in p.stdout
    assert "CRUDOS DE EARTH ENGINE (se procesan con A3; no entran al contrato): 1" in p.stdout


def test_cli_variable_raiz_buzon_y_json(tmp_path):
    p = cli("--salida", str(tmp_path / "s"), "--json", env={"RAIZ_BUZON": str(BUZON_OK)})
    assert p.returncode == 0, p.stderr
    rep = json.loads(p.stdout)
    assert len(rep["entraron"]) == 13 and [c["archivo"] for c in rep["crudos"]] == ["hls_ndvi_memoria_2016.tif"]


def test_cli_sin_buzon_no_escribe(tmp_path):
    p = cli("--salida", str(tmp_path / "s"))
    assert p.returncode == 0 and "todo sigue simulado" in p.stdout
    assert not (tmp_path / "s").exists()


def test_cli_buzon_inexistente_sale_con_2(tmp_path):
    p = cli("--buzon", str(tmp_path / "no_existe"), "--salida", str(tmp_path / "s"))
    assert p.returncode == 2 and "no existe" in p.stderr


# ---------------------------------------------------------------------------------------
# Regenerar los GeoTIFF de las fixtures (python tests/test_ensamblar.py --regenerar-tif)
# ---------------------------------------------------------------------------------------
def regenerar_tif():
    # Sin sufijo = la zona por omisión: cubre su rectángulo (no la envolvente zona_piloto.bbox).
    geotiff_que_cubre(BUZON_OK / "nasadem_zona_piloto.tif", LIMITES["zonas"][OMISION]["bbox"])
    escribir_geotiff(BUZON_MALO / "nasadem_zona_piloto.tif", oeste=0, norte=0, ancho=8, alto=8, georef=False)
    tif_otra = BUZON_DOS_ZONAS / f"nasadem_zona_piloto_{OTRA}.tif"
    geotiff_que_cubre(tif_otra, LIMITES["zonas"][OTRA]["bbox"])
    for t in (BUZON_OK / "nasadem_zona_piloto.tif", BUZON_MALO / "nasadem_zona_piloto.tif", tif_otra):
        print(f"{t.relative_to(RAIZ)}: {t.stat().st_size} bytes, sha256 {sha(t)[:12]}…")


if __name__ == "__main__":
    if "--regenerar-tif" in sys.argv:
        regenerar_tif()
    else:
        print(__doc__)
