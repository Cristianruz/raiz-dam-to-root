# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Pruebas de motor/contexto_web.py (bases de datos del reto → web/data/contexto.json).

Decisión: docs/decisiones/2026-11-14_recursos_del_reto.md.
(a) Con data/processed REAL (hoy sin las entregas nuevas): el clima del año existe para las dos
    zonas y sus sumas coinciden con un cálculo independiente hecho aquí; los días con helada
    coinciden con contar Tmin ≤ 0 °C; los bloques de entregas ausentes van en null con su motivo;
    el estado de cada recurso es coherente con los archivos presentes.
(b) Con un processed DE PRUEBA (tests/fixtures/contexto_reto/generar.py, escrito en tmp_path) que
    sí trae las cuatro entregas nuevas y heladas.json: los bloques salen llenos, alineados y sin NaN;
    esos mismos archivos pasan el validador del buzón (motor/ensamblar.py).
(c) El JSON nunca trae NaN ni Infinity; un año con faltantes por encima del umbral va en null con
    sus «dias_con_dato» reales; la fixture contexto_lleno.json está al día.
Todo se escribe en tmp_path: nunca en data/processed ni en web/data. Los valores de (b) y (c) son
DE PRUEBA; los umbrales se leen de motor/esquemas.py y de data/params.json, no se escriben aquí.
"""
import csv
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
for ruta in (RAIZ, RAIZ / "tests"):
    if str(ruta) not in sys.path:
        sys.path.insert(0, str(ruta))

from motor import contexto_web as cw  # noqa: E402
from motor import esquemas  # noqa: E402

PROCESADOS = RAIZ / "data/processed"
PARAMS_RUTA = RAIZ / "data/params.json"
RECURSOS_RUTA = RAIZ / "data/recursos_reto.json"
PARAMS = json.loads(PARAMS_RUTA.read_text(encoding="utf-8"))
CATALOGO = json.loads(RECURSOS_RUTA.read_text(encoding="utf-8"))
ZONAS = [z["id"] for z in PARAMS["zona_piloto"]["zonas"]["valor"]]
NUEVOS = ("contexto_regional", "gedi", "ecostress", "gaez", "heladas")
ARCHIVO_DE = {"contexto_regional": "contexto_regional.csv", "gedi": "gedi_parcelas.csv",
              "ecostress": "ecostress_parcelas.csv", "gaez": "gaez_zona.csv", "heladas": "heladas.json"}
FIXTURE = RAIZ / "tests/fixtures/contexto_reto"


def _generador():
    """El generador de la fixture (tests/fixtures/contexto_reto/generar.py), cargado por ruta."""
    spec = importlib.util.spec_from_file_location("generar_contexto_reto", FIXTURE / "generar.py")
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


GEN = _generador()


def sin_constantes(texto):
    """json.loads que falla si el texto trae NaN, Infinity o -Infinity (no son JSON)."""
    def rechazar(nombre):
        raise AssertionError(f"el JSON trae {nombre}")
    return json.loads(texto, parse_constant=rechazar)


def construir_en(tmp_path, processed):
    resumen = cw.construir(processed=processed, web=tmp_path / "web", params_ruta=PARAMS_RUTA,
                           recursos_ruta=RECURSOS_RUTA)
    texto = (tmp_path / "web/contexto.json").read_text(encoding="utf-8")
    return resumen, sin_constantes(texto), texto


@pytest.fixture(scope="module")
def real(tmp_path_factory):
    if not (PROCESADOS / "eto_diaria.csv").is_file():
        pytest.skip("data/processed aún no trae eto_diaria.csv")
    tmp = tmp_path_factory.mktemp("contexto_real")
    return construir_en(tmp, PROCESADOS)


@pytest.fixture(scope="module")
def lleno(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("contexto_lleno")
    GEN.escribir_processed(tmp / "processed")
    resumen, contexto, texto = construir_en(tmp, tmp / "processed")
    return {"resumen": resumen, "contexto": contexto, "texto": texto, "processed": tmp / "processed"}


# ---------------------------------------------------------------------------------------
# Cálculo independiente del clima (no usa nada de motor/contexto_web.py)
# ---------------------------------------------------------------------------------------
def filas_del_anio_agricola(ruta, anio):
    """Filas con fecha del 1 de octubre de anio−1 al 30 de septiembre de anio (comparando el texto ISO)."""
    desde, hasta = f"{anio - 1}-10-01", f"{anio}-09-30"
    with open(ruta, newline="", encoding="utf-8") as f:
        return [fila for fila in csv.DictReader(f) if desde <= fila["fecha"] <= hasta]


def archivo_de_zona(base, zona):
    return base if zona == esquemas.ZONA_POR_OMISION else base.replace(".csv", f"_{zona}.csv")


# ---------------------------------------------------------------------------------------
# (a) data/processed real
# ---------------------------------------------------------------------------------------
def test_real_clima_anual_de_las_dos_zonas(real):
    _, contexto, _ = real
    assert set(contexto["clima_anual"]) == set(ZONAS)
    assert contexto["clima_anual_motivo"] is None
    for zona in ZONAS:
        bloque = contexto["clima_anual"][zona]
        anios = [a["anio"] for a in bloque["anios"]]
        assert anios == list(range(anios[0], anios[-1] + 1)), "años seguidos, sin saltos"
        assert PARAMS["memoria"]["anio_inicio"]["valor"] in anios and PARAMS["memoria"]["anio_actual"]["valor"] in anios
        for a in bloque["anios"]:
            assert set(a) == {"anio", "lluvia_imerg_mm", "lluvia_power_mm", "eto_mm", "dias_helada",
                              "dias_con_dato", "dias_con_dato_imerg", "dias_del_anio"}
            assert a["dias_del_anio"] in (365, 366) and 0 <= a["dias_con_dato"] <= a["dias_del_anio"]
        for clave in ("power", "imerg"):
            f = bloque["fuentes"][clave]
            assert f["archivo"] and f["fuente"] and f["fecha"], (zona, clave)
        assert "NASA POWER" in bloque["fuentes"]["power"]["fuente"]
        assert "IMERG" in bloque["fuentes"]["imerg"]["fuente"]


@pytest.mark.parametrize("zona", ZONAS)
@pytest.mark.parametrize("llave_anio", ["anio_inicio", "anio_actual_menos_uno"])
def test_real_sumas_coinciden_con_un_calculo_independiente(real, zona, llave_anio):
    """Dos años de la memoria del proyecto: el primero y el anterior al año en curso (de params)."""
    _, contexto, _ = real
    memoria = PARAMS["memoria"]
    anio = memoria["anio_inicio"]["valor"] if llave_anio == "anio_inicio" else memoria["anio_actual"]["valor"] - 1
    entrada = next(a for a in contexto["clima_anual"][zona]["anios"] if a["anio"] == anio)
    faltante = float(esquemas.FALTANTE_POWER)
    power = [f for f in filas_del_anio_agricola(PROCESADOS / archivo_de_zona("eto_diaria.csv", zona), anio)
             if faltante not in (float(f["eto_mm"]), float(f["lluvia_mm"]), float(f["tmin"]))]
    imerg = [f for f in filas_del_anio_agricola(PROCESADOS / archivo_de_zona("imerg_diaria.csv", zona), anio)
             if f["lluvia_mm"].strip()]
    assert entrada["dias_con_dato"] == len(power) and entrada["dias_con_dato_imerg"] == len(imerg)
    # Con el año bajo el umbral de faltantes del validador, las sumas existen y son las de sus días.
    umbral = esquemas.FALTANTES_MAX_FRACCION
    assert (entrada["dias_del_anio"] - len(power)) / entrada["dias_del_anio"] < umbral, "año de la memoria casi completo"
    assert (entrada["dias_del_anio"] - len(imerg)) / entrada["dias_del_anio"] < umbral
    assert entrada["eto_mm"] == pytest.approx(sum(float(f["eto_mm"]) for f in power), abs=0.051)
    assert entrada["lluvia_power_mm"] == pytest.approx(sum(float(f["lluvia_mm"]) for f in power), abs=0.051)
    assert entrada["lluvia_imerg_mm"] == pytest.approx(sum(float(f["lluvia_mm"]) for f in imerg), abs=0.051)
    # Helada = Tmin ≤ 0 °C (kit A2 paso 1).
    assert entrada["dias_helada"] == sum(1 for f in power if float(f["tmin"]) <= 0)
    # Un decimal en mm (redondeo de presentación).
    for llave in ("eto_mm", "lluvia_power_mm", "lluvia_imerg_mm"):
        assert round(entrada[llave], 1) == entrada[llave]


def test_real_anios_incompletos_van_en_null_con_sus_dias(real):
    """El primer año de POWER empieza en enero y el último apenas arranca: no se rellenan."""
    _, contexto, _ = real
    umbral = esquemas.FALTANTES_MAX_FRACCION
    for zona in ZONAS:
        for a in contexto["clima_anual"][zona]["anios"]:
            falta_power = (a["dias_del_anio"] - a["dias_con_dato"]) / a["dias_del_anio"]
            falta_imerg = (a["dias_del_anio"] - a["dias_con_dato_imerg"]) / a["dias_del_anio"]
            if falta_power >= umbral:
                assert a["eto_mm"] is None and a["lluvia_power_mm"] is None and a["dias_helada"] is None, a
            else:
                assert a["eto_mm"] is not None and a["lluvia_power_mm"] is not None and a["dias_helada"] is not None, a
            assert (a["lluvia_imerg_mm"] is None) == (falta_imerg >= umbral), a
        primero, ultimo = contexto["clima_anual"][zona]["anios"][0], contexto["clima_anual"][zona]["anios"][-1]
        assert primero["eto_mm"] is None and 0 < primero["dias_con_dato"] < primero["dias_del_anio"]
        assert ultimo["lluvia_imerg_mm"] is None and ultimo["dias_con_dato_imerg"] > 0


def test_real_bloques_de_entregas_ausentes_en_null_con_motivo(real):
    resumen, contexto, _ = real
    for bloque in NUEVOS:
        presente = (PROCESADOS / ARCHIVO_DE[bloque]).is_file()
        assert resumen["bloques"][bloque] is presente
        if presente:
            assert contexto[bloque] is not None and contexto[f"{bloque}_motivo"] is None
        else:
            assert contexto[bloque] is None
            assert contexto[f"{bloque}_motivo"] == cw.MOTIVO_PEDIDO
            assert "not delivered yet" in contexto[f"{bloque}_motivo"]


def test_real_et_contraste_tal_cual(real):
    _, contexto, _ = real
    ruta = PROCESADOS / "et_contraste.csv"
    if not ruta.is_file():
        assert contexto["et_contraste"] is None and contexto["et_contraste_motivo"]
        return
    with open(ruta, newline="", encoding="utf-8") as f:
        filas = list(csv.DictReader(f))
    bloque = contexto["et_contraste"]
    assert bloque["meses"] == [f["mes"] for f in filas]
    assert set(bloque["columnas"]) == set(filas[0]) - {"mes"}
    for columna, valores in bloque["columnas"].items():
        assert len(valores) == len(filas)
        assert valores == [float(f[columna]) if f[columna].strip() else None for f in filas]
    assert bloque["fuente"] and bloque["fecha"]


def test_real_estado_de_cada_recurso_coherente_con_los_archivos(real):
    _, contexto, _ = real
    recursos = {r["id"]: r for r in contexto["recursos"]}
    assert list(recursos) == [r["id"] for r in CATALOGO["recursos"]], "uno por renglón, en su orden"
    for rec in CATALOGO["recursos"]:
        r = recursos[rec["id"]]
        for llave in ("nombre", "organismo", "papel"):
            assert r[llave] == rec[llave]
        for nombre in r["entregas_presentes"]:
            assert (PROCESADOS / nombre).is_file(), (r["id"], nombre)
        for nombre in r["entregas_faltantes"]:
            assert not (PROCESADOS / nombre).is_file() or rec.get("fuente_contexto"), (r["id"], nombre)
        if not rec["aplica"]:
            assert r["estado"] == "not_applicable" and r["motivo"] == rec["motivo_no_aplica"]
            assert r["equivalente_local"] == rec["equivalente_local"] and not r["entregas_presentes"]
        elif r["entregas_presentes"]:
            assert r["estado"] == "in_use" and r["motivo"] is None
            assert [f["archivo"] for f in r["fuentes"]] == r["entregas_presentes"]
            assert all(f["fuente"] and f["fecha"] for f in r["fuentes"]), r["id"]
            assert r["fecha"] == max(f["fecha"] for f in r["fuentes"])
        else:
            assert r["estado"] == "requested" and r["motivo"] and r["fuentes"] == [] and r["fecha"] is None
    # Los archivos de un archivo por zona se esperan con su sufijo.
    assert set(recursos["power"]["entregas_presentes"] + recursos["power"]["entregas_faltantes"]) == {
        archivo_de_zona("eto_diaria.csv", z) for z in ZONAS}


def test_real_resumen_y_json_sin_nan(real):
    resumen, contexto, texto = real
    assert resumen["ejecutado"] is True and resumen["avisos"] == [] and contexto["avisos"] == []
    assert sum(resumen["recursos"].values()) == len(CATALOGO["recursos"])
    assert contexto["_encabezado"].startswith("AI-assisted (Claude Code)")
    assert contexto["generado"].endswith("+00:00")
    assert contexto["zonas"] == {z["id"]: {"nombre": z["nombre"]} for z in PARAMS["zona_piloto"]["zonas"]["valor"]}
    assert "NaN" not in texto and "Infinity" not in texto
    assert texto.endswith("\n")


# ---------------------------------------------------------------------------------------
# Definiciones: año agrícola (params) y helada (kit A2)
# ---------------------------------------------------------------------------------------
def test_definicion_del_anio_agricola_es_la_de_params():
    unidad = PARAMS["memoria"]["anio_actual"]["unidad"]
    assert all(m in unidad for m in cw.MARCAS_PARAMS_ANIO), unidad
    assert cw.INICIO_ANIO_AGRICOLA == (10, 1) and cw.FIN_ANIO_AGRICOLA == (9, 30)
    assert "October 1" in cw.DEFINICION_ANIO and "September 30" in cw.DEFINICION_ANIO and "A3-M" in cw.DEFINICION_ANIO
    actual = PARAMS["memoria"]["anio_actual"]["valor"]
    assert cw.anio_agricola(actual - 1, 10) == actual and cw.anio_agricola(actual, 9) == actual
    assert cw.anio_agricola(actual, 10) == actual + 1
    assert cw.dias_del_anio_agricola(2024) == 366 and cw.dias_del_anio_agricola(2025) == 365
    assert "0 °C" in cw.DEFINICION_HELADA and cw.UMBRAL_HELADA_C == 0


def test_params_que_ya_no_confirma_el_anio_avisa(tmp_path):
    params = json.loads(json.dumps(PARAMS))
    params["memoria"]["anio_actual"]["unidad"] = "año agrícola"
    _, avisos = cw.armar(tmp_path, params, CATALOGO)
    assert any("no confirma el año agrícola" in a for a in avisos)


# ---------------------------------------------------------------------------------------
# (b) processed DE PRUEBA con las cuatro entregas nuevas y heladas.json
# ---------------------------------------------------------------------------------------
def test_lleno_los_archivos_de_prueba_pasan_el_validador(lleno, tmp_path):
    """Los CSV de prueba cumplen el contrato: entran por el buzón con motor/ensamblar.py."""
    from test_ensamblar import BUZON_DOS_ZONAS, buzon_con, correr, nombres
    nuevos = ["contexto_regional.csv", "gedi_parcelas.csv", "ecostress_parcelas.csv", "gaez_zona.csv",
              "heladas.json", "et_contraste.csv", *(archivo_de_zona(b, z) for z in ZONAS
                                                    for b in ("eto_diaria.csv", "imerg_diaria.csv"))]
    archivos = {n: (lleno["processed"] / n).read_text(encoding="utf-8") for n in nuevos}
    rep = correr(buzon_con(tmp_path, archivos, base=BUZON_DOS_ZONAS), tmp_path)
    assert rep["rechazados"] == [], rep["rechazados"]
    assert rep["retenidos"] == [] and set(nuevos) <= set(nombres(rep["entraron"]))


def test_lleno_todos_los_bloques(lleno):
    contexto, resumen = lleno["contexto"], lleno["resumen"]
    assert all(resumen["bloques"].values()), resumen["bloques"]
    assert resumen["avisos"] == []
    for bloque in (*NUEVOS, "et_contraste", "clima_anual"):
        assert contexto[bloque] is not None and contexto[f"{bloque}_motivo"] is None, bloque


def test_lleno_contexto_regional_alineado(lleno):
    bloque = lleno["contexto"]["contexto_regional"]
    cuenca = esquemas.ZONA_CUENCA
    assert set(bloque) == {*ZONAS, cuenca}, "las zonas de params y la serie de cuenca de GRACE"
    claves = {f"{f}.{v}": u for f, v, u in esquemas.COMBINACIONES_CONTEXTO}
    de_cuenca = {c for c in claves if c.startswith(f"{esquemas.FUENTE_DE_CUENCA}.")}
    assert set(bloque[cuenca]) == de_cuenca, "GRACE: una sola serie, bajo «cuenca»"
    for zona in (*ZONAS, cuenca):
        if zona != cuenca:
            assert set(bloque[zona]) == set(claves) - de_cuenca, "las otras 11 series de la tabla, por zona"
        for clave, serie in bloque[zona].items():
            assert serie["ambito"] == ("cuenca" if zona == cuenca else "zona")
            assert serie["unidad"] == claves[clave]
            assert f"{serie['fuente_id']}.{serie['variable']}" == clave
            assert len(serie["meses"]) == len(serie["valores"]) > 0
            assert serie["meses"] == sorted(set(serie["meses"])), "meses únicos y en orden"
            # Meses seguidos del calendario (los huecos van como null, no se saltan).
            primero, ultimo = serie["meses"][0], serie["meses"][-1]
            n = (int(ultimo[:4]) - int(primero[:4])) * 12 + int(ultimo[5:]) - int(primero[5:]) + 1
            assert len(serie["meses"]) == n
            assert serie["resolucion_m"] == GEN.RESOLUCIONES_PRUEBA[serie["fuente_id"]]
            assert serie["fuente"] and serie["fecha"] == GEN.FECHA_PRUEBA
            assert serie["unidad_en"] == CATALOGO["unidades"][serie["unidad"]]["en"]
            aditiva = serie["unidad"] in cw.UNIDADES_ADITIVAS
            assert serie["estadistica"] == ("suma" if aditiva else "media")
            assert sum(a["n_meses"] for a in serie["anual"]) == sum(v is not None for v in serie["valores"])
            for a in serie["anual"]:
                assert a["completo"] == (a["n_meses"] == 12)
                assert (a["suma"] is not None) == (aditiva and a["completo"]), (clave, a)
                assert (a["media"] is None) == (a["n_meses"] == 0)


def test_lleno_media_y_suma_anual_con_un_calculo_independiente(lleno):
    """nldas.lluvia (se suma) y modis.ndvi (se promedia) del año agrícola 2024, leídos del CSV de prueba."""
    with open(lleno["processed"] / "contexto_regional.csv", newline="", encoding="utf-8") as f:
        filas = list(csv.DictReader(f))
    zona, anio = ZONAS[0], 2024
    for fuente, variable in (("nldas", "lluvia"), ("modis", "ndvi")):
        valores = [float(x["valor"]) for x in filas
                   if (x["zona"], x["fuente"], x["variable"]) == (zona, fuente, variable)
                   and f"{anio - 1}-10" <= x["mes"] <= f"{anio}-09" and x["valor"].strip()]
        assert len(valores) == 12
        entrada = next(a for a in lleno["contexto"]["contexto_regional"][zona][f"{fuente}.{variable}"]["anual"]
                       if a["anio"] == anio)
        assert entrada["media"] == pytest.approx(sum(valores) / 12, abs=1e-4)
        if fuente == "nldas":
            assert entrada["suma"] == pytest.approx(sum(valores), abs=0.051)
        else:
            assert entrada["suma"] is None


def test_lleno_huecos_no_se_rellenan(lleno):
    series = lleno["contexto"]["contexto_regional"][ZONAS[0]]
    # GRACE (serie de cuenca): tres meses sin fila → null en su lugar y año incompleto.
    grace = lleno["contexto"]["contexto_regional"][esquemas.ZONA_CUENCA]["grace.agua_almacenada_anomalia"]
    por_mes = dict(zip(grace["meses"], grace["valores"]))
    assert [por_mes[m] for m in ("2023-03", "2023-04", "2023-05")] == [None, None, None]
    anio = next(a for a in grace["anual"] if a["anio"] == 2023)
    assert anio["n_meses"] == 9 and anio["completo"] is False and anio["media"] is not None
    # SMAP: un valor vacío → null; el año no está completo.
    smap = series["smap.humedad_raiz"]
    assert dict(zip(smap["meses"], smap["valores"]))["2024-07"] is None
    assert next(a for a in smap["anual"] if a["anio"] == 2024)["completo"] is False
    # n_celdas que varía de un mes a otro: null con su rango, no un valor escogido.
    nldas = series["nldas.lluvia"]
    assert nldas["n_celdas"] is None and nldas["n_celdas_rango"] == [GEN.CELDAS_PRUEBA["nldas"] - 1,
                                                                    GEN.CELDAS_PRUEBA["nldas"]]
    assert series["smap.humedad_superficial"]["n_celdas"] == GEN.CELDAS_PRUEBA["smap"]


def test_lleno_gedi_solo_parcelas_con_disparos(lleno):
    gedi = lleno["contexto"]["gedi"]
    assert gedi["n_total"] == 4 and gedi["n_con_dato"] == len(gedi["parcelas"]) == 2
    assert gedi["parcelas"]["P0001"] == {"n_disparos": 4, "altura_mediana_m": 6.2, "altura_p90_m": 8.1}
    assert "P0002" not in gedi["parcelas"] and "L0002" not in gedi["parcelas"], "sin disparos: no es cero, no entra"
    assert gedi["fuente"] and gedi["fecha"]


def test_lleno_ecostress_alineado_a_los_meses(lleno):
    eco = lleno["contexto"]["ecostress"]
    assert eco["meses"] == GEN.MESES_PARCELA
    assert set(eco["parcelas"]) == {"P0001", "P0002", "L0001", "L0002"}
    for valores in eco["parcelas"].values():
        assert len(valores) == len(eco["meses"])
    assert eco["parcelas"]["P0002"][-3:] == [None, None, None] and eco["parcelas"]["P0002"][-4] is not None
    assert set(eco["parcelas"]["L0002"]) == {None}


def test_lleno_gaez_y_heladas(lleno):
    gaez = lleno["contexto"]["gaez"]
    assert set(gaez["zonas"]) == set(ZONAS) and gaez["fuente"]
    for filas in gaez["zonas"].values():
        assert [set(f) for f in filas] == [{"cultivo", "variable", "valor", "unidad", "resolucion_m"}] * len(filas)
        assert all(f["cultivo"] in esquemas.CULTIVOS_GAEZ and isinstance(f["valor"], float) for f in filas)
    heladas = lleno["contexto"]["heladas"]
    original = json.loads((lleno["processed"] / "heladas.json").read_text(encoding="utf-8"))
    assert {k: v for k, v in heladas.items() if k != "entrega"} == original, "el contenido de heladas.json, tal cual"
    assert heladas["entrega"]["fuente"] and heladas["entrega"]["fecha"] == GEN.FECHA_PRUEBA


def test_lleno_recursos_pasan_a_en_uso(lleno):
    recursos = {r["id"]: r for r in lleno["contexto"]["recursos"]}
    for rid in ("smap", "modis", "grace", "gldas", "nldas", "era5_land", "gedi", "ecostress", "gaez", "power_heladas"):
        assert recursos[rid]["estado"] == "in_use" and recursos[rid]["motivo"] is None, rid
        assert recursos[rid]["fuentes"][0]["fuente"]
    assert recursos["hls"]["estado"] == "requested", "la fixture no trae HLS: sigue pedido"
    assert {r["estado"] for r in recursos.values()} == {"in_use", "requested", "not_applicable"}


def test_lleno_json_sin_nan_ni_infinito(lleno):
    assert "NaN" not in lleno["texto"] and "Infinity" not in lleno["texto"]
    sin_constantes(lleno["texto"])

    def recorrer(nodo):
        if isinstance(nodo, float):
            assert nodo == nodo and abs(nodo) != float("inf")
        elif isinstance(nodo, dict):
            for v in nodo.values():
                recorrer(v)
        elif isinstance(nodo, list):
            for v in nodo:
                recorrer(v)
    recorrer(lleno["contexto"])


# ---------------------------------------------------------------------------------------
# (c) Faltantes, fuentes parciales y archivos ilegibles (datos de prueba)
# ---------------------------------------------------------------------------------------
def test_anio_con_faltantes_por_encima_del_umbral_va_en_null(lleno):
    """Centinela de POWER en eto_mm (zona B) y filas ausentes (zona A): la suma no se rellena."""
    clima = lleno["contexto"]["clima_anual"]
    umbral = esquemas.FALTANTES_MAX_FRACCION
    con_ausentes = next(a for a in clima[GEN.ZONA_A]["anios"] if a["anio"] == GEN.ANIO_CON_AUSENTES)
    assert con_ausentes["dias_con_dato"] == con_ausentes["dias_del_anio"] - GEN.DIAS_AUSENTES
    assert GEN.DIAS_AUSENTES / con_ausentes["dias_del_anio"] >= umbral
    assert con_ausentes["eto_mm"] is None and con_ausentes["lluvia_power_mm"] is None and con_ausentes["dias_helada"] is None
    assert con_ausentes["lluvia_imerg_mm"] is not None, "IMERG de ese año está completo"
    con_centinela = next(a for a in clima[GEN.ZONA_B]["anios"] if a["anio"] == GEN.ANIO_CON_FALTANTES)
    assert con_centinela["dias_con_dato"] == con_centinela["dias_del_anio"] - GEN.DIAS_FALTANTES
    assert con_centinela["eto_mm"] is None, "eto_mm con −999 por encima del umbral"
    assert con_centinela["lluvia_power_mm"] is not None and con_centinela["dias_helada"] is not None, \
        "la lluvia y la Tmin de esos días sí están"


def test_pocos_faltantes_por_debajo_del_umbral_se_suman_sin_rellenar(tmp_path):
    """Dos días con −999 en un año (menos que el umbral): la suma usa los días que sí hay."""
    processed = tmp_path / "processed"
    GEN.escribir_processed(processed)
    ruta = processed / "eto_diaria.csv"
    lineas = ruta.read_text(encoding="utf-8").splitlines()
    anio, quitados, suma = 2022, 0, 0.0
    for i, linea in enumerate(lineas[1:], start=1):
        celdas = linea.split(",")
        if not f"{anio - 1}-10-01" <= celdas[0] <= f"{anio}-09-30":
            continue
        if quitados < 2:
            celdas[1] = str(esquemas.FALTANTE_POWER)
            lineas[i] = ",".join(celdas)
            quitados += 1
        else:
            suma += float(celdas[1])
    ruta.write_text("\n".join(lineas) + "\n", encoding="utf-8")
    _, contexto, _ = construir_en(tmp_path, processed)
    entrada = next(a for a in contexto["clima_anual"][esquemas.ZONA_POR_OMISION]["anios"] if a["anio"] == anio)
    assert entrada["dias_con_dato"] == entrada["dias_del_anio"] - 2
    assert entrada["eto_mm"] == pytest.approx(suma, abs=0.051)


def test_contexto_regional_sin_filas_de_una_fuente(tmp_path):
    """El archivo llegó, pero sin GRACE: GRACE sigue «requested» con su motivo; las demás, en uso."""
    processed = tmp_path / "processed"
    GEN.escribir_processed(processed)
    ruta = processed / "contexto_regional.csv"
    lineas = [l for l in ruta.read_text(encoding="utf-8").splitlines() if ",grace," not in l]
    ruta.write_text("\n".join(lineas) + "\n", encoding="utf-8")
    _, contexto, _ = construir_en(tmp_path, processed)
    recursos = {r["id"]: r for r in contexto["recursos"]}
    assert recursos["grace"]["estado"] == "requested" and recursos["grace"]["motivo"] == cw.MOTIVO_SIN_FILAS
    assert recursos["grace"]["entregas_faltantes"] == ["contexto_regional.csv"]
    assert recursos["smap"]["estado"] == "in_use"
    assert esquemas.ZONA_CUENCA not in contexto["contexto_regional"], "sin GRACE no hay serie de cuenca"
    assert all("grace." not in clave for z in ZONAS for clave in contexto["contexto_regional"][z])


def test_archivo_ilegible_va_en_null_con_aviso(tmp_path):
    processed = tmp_path / "processed"
    GEN.escribir_processed(processed)
    (processed / "gedi_parcelas.csv").write_text("id,disparos\nP0001,4\n", encoding="utf-8")   # sin sus columnas
    (processed / "heladas.json").write_text("{ no es json", encoding="utf-8")
    resumen, contexto, _ = construir_en(tmp_path, processed)
    assert contexto["gedi"] is None and contexto["gedi_motivo"] == cw.MOTIVO_ILEGIBLE
    assert contexto["heladas"] is None and contexto["heladas_motivo"] == cw.MOTIVO_ILEGIBLE
    assert len(resumen["avisos"]) == 2 and all("no se pudo leer" in a for a in resumen["avisos"])
    assert contexto["ecostress"] is not None, "los demás bloques no se pierden"


def test_processed_vacio_todo_en_null_con_motivo(tmp_path):
    (tmp_path / "vacio").mkdir()
    resumen, contexto, _ = construir_en(tmp_path, tmp_path / "vacio")
    assert not any(resumen["bloques"].values())
    assert contexto["clima_anual"] is None and contexto["clima_anual_motivo"] == cw.MOTIVO_SIN_CLIMA
    for bloque in (*NUEVOS, "et_contraste"):
        assert contexto[bloque] is None and contexto[f"{bloque}_motivo"] == cw.MOTIVO_PEDIDO
    assert {r["estado"] for r in contexto["recursos"]} == {"requested", "not_applicable"}


def test_no_escribe_fuera_de_la_carpeta_web(lleno, tmp_path):
    antes = sorted(p.name for p in lleno["processed"].iterdir())
    cw.construir(processed=lleno["processed"], web=tmp_path / "salida", params_ruta=PARAMS_RUTA,
                 recursos_ruta=RECURSOS_RUTA)
    assert sorted(p.name for p in lleno["processed"].iterdir()) == antes
    assert [p.name for p in (tmp_path / "salida").iterdir()] == ["contexto.json"]


# ---------------------------------------------------------------------------------------
# Catálogo (data/recursos_reto.json), fixture y CLI
# ---------------------------------------------------------------------------------------
def test_catalogo_de_recursos_bien_formado():
    assert CATALOGO["_encabezado"].startswith("AI-assisted (Claude Code)")
    assert (RAIZ / CATALOGO["decision"]).is_file()
    ids = [r["id"] for r in CATALOGO["recursos"]]
    assert len(ids) == len(set(ids)) == 17, "un renglón por fila de la tabla de la decisión"
    for r in CATALOGO["recursos"]:
        assert r["nombre"] and r["organismo"] and isinstance(r["aplica"], bool), r["id"]
        if r["aplica"]:
            assert r["papel"] and r["entregas"], r["id"]
            for base in r["entregas"]:
                assert base in esquemas.ESQUEMAS, f"{r['id']}: {base} no es una entrega del buzón"
        else:
            assert r["motivo_no_aplica"] and r["equivalente_local"] and r["entregas"] == [], r["id"]
        # CLAUDE.md regla 10: sin «first» ni «only»; no se prometen ahorros.
        texto = " ".join(str(r.get(k) or "") for k in ("nombre", "organismo", "papel", "motivo_no_aplica",
                                                       "equivalente_local")).lower()
        assert not any(f" {p} " in f" {texto} " for p in ("first", "only", "save", "saves", "savings")), r["id"]
    # Cada fuente de contexto_regional.csv tiene su recurso, y cada serie de la tabla, su tarjeta.
    assert {r["fuente_contexto"] for r in CATALOGO["recursos"] if r.get("fuente_contexto")} == set(esquemas.FUENTES_CONTEXTO)
    en_tarjetas = [s["clave"] for t in CATALOGO["tarjetas"] for p in t["paneles"] for s in p["series"]]
    assert sorted(en_tarjetas) == sorted(f"{f}.{v}" for f, v, _ in esquemas.COMBINACIONES_CONTEXTO)
    assert set(CATALOGO["unidades"]) == set(esquemas.UNIDADES_CONTEXTO)
    for t in CATALOGO["tarjetas"]:
        assert set(t["recursos"]) <= set(ids), t["id"]
        for p in t["paneles"]:
            unidades = {u for f, v, u in esquemas.COMBINACIONES_CONTEXTO
                        if f"{f}.{v}" in [s["clave"] for s in p["series"]]}
            assert len(unidades) == 1, f"{t['id']}: un panel, una sola unidad (nunca dos ejes)"


def test_fixture_contexto_lleno_al_dia(lleno):
    """tests/fixtures/contexto_reto/contexto_lleno.json = lo que hoy escribe el motor con los datos de prueba."""
    esperado = GEN.texto_json(GEN.contexto_de_prueba(lleno["processed"]))
    assert (FIXTURE / "contexto_lleno.json").read_text(encoding="utf-8") == esperado, \
        "regenere la fixture: python tests/fixtures/contexto_reto/generar.py"
    assert "DE PRUEBA" in json.loads(esperado)["_nota"]


def test_cli_escribe_en_la_carpeta_indicada(lleno, tmp_path):
    p = subprocess.run([sys.executable, str(RAIZ / "motor/contexto_web.py"), "--processed", str(lleno["processed"]),
                        "--web", str(tmp_path / "w")], cwd=RAIZ, capture_output=True, text=True, encoding="utf-8",
                       timeout=120)
    assert p.returncode == 0, p.stderr
    resumen = json.loads(p.stdout)
    assert resumen["ejecutado"] is True and all(resumen["bloques"].values())
    sin_constantes((tmp_path / "w/contexto.json").read_text(encoding="utf-8"))


def test_web_data_contexto_json_generado_y_valido():
    """El archivo generado para la página: mismas llaves que escribe el motor y sin NaN."""
    ruta = RAIZ / "web/data/contexto.json"
    if not ruta.is_file():
        pytest.skip("web/data/contexto.json aún no se genera (python motor/contexto_web.py)")
    contexto = sin_constantes(ruta.read_text(encoding="utf-8"))
    assert contexto["_encabezado"].startswith("AI-assisted (Claude Code)")
    for bloque in ("clima_anual", *NUEVOS, "et_contraste"):
        assert bloque in contexto and f"{bloque}_motivo" in contexto
        assert (contexto[bloque] is None) == bool(contexto[f"{bloque}_motivo"]), bloque
    assert [r["id"] for r in contexto["recursos"]] == [r["id"] for r in CATALOGO["recursos"]]
    assert "DE PRUEBA" not in json.dumps(contexto, ensure_ascii=False), "la página no lleva datos de prueba"
