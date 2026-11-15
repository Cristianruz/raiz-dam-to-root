# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Pruebas del validador del buzón para las bases de datos del reto.

Contrato: docs/decisiones/2026-11-14_recursos_del_reto.md («Contrato de las entregas nuevas»).
Esquemas: motor/esquemas.py (contexto_regional.csv A10, gedi_parcelas.csv A11,
ecostress_parcelas.csv A12 y gaez_zona.csv A13); reglas nuevas en motor/ensamblar.py
(combinacion_permitida, rango_segun, valores_segun y vacias_segun).

Por cada archivo: un buzón válido que entra y varios inválidos que se rechazan con un motivo
legible (columna faltante, combinación fuente/variable/unidad que no está en la tabla, llave
repetida, id que no existe en parcelas_base, alturas con n_disparos = 0, valor fuera del límite
físico…). GRACE llega como una sola serie con zona «cuenca» (nota de GRACE de la decisión) y los
intermedios de Earth Engine (ctx_*.csv, gedi_disparos_*.csv) se listan aparte como crudos.
Todo se escribe en tmp_path: nunca en data/processed ni en web/data.

TODOS LOS VALORES SON DE PRUEBA (no son datos, no tienen fuente y no se usan en la web). Las
zonas y las clases de cultivo se leen de data/params.json y de motor/esquemas.py, no se escriben aquí.
"""
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
for ruta in (RAIZ, RAIZ / "tests"):
    if str(ruta) not in sys.path:
        sys.path.insert(0, str(ruta))

from motor import ensamblar as ens  # noqa: E402
from motor import esquemas  # noqa: E402
# Utilidades del ensamblador (no se modifican): buzón en tmp_path con parcelas_base y LEEME.md.
from test_ensamblar import BUZON_DOS_ZONAS, LIMITES, buzon_con, correr, motivos_de, nombres  # noqa: E402

DECISION = "docs/decisiones/2026-11-14_recursos_del_reto.md"
NUEVOS = {"contexto_regional.csv": "A10", "gedi_parcelas.csv": "A11",
          "ecostress_parcelas.csv": "A12", "gaez_zona.csv": "A13"}
ZONAS = LIMITES["zonas_ids"]                 # de data/params.json (zona_piloto.zonas)
ZONA_A, ZONA_B = ZONAS[0], ZONAS[1]
CUENCA = esquemas.ZONA_CUENCA                # «zona» de GRACE: una sola serie de cuenca
DE_CUENCA = esquemas.FUENTE_DE_CUENCA
# Parcelas de la fixture de dos zonas (tests/fixtures/buzon_dos_zonas/parcelas_base.geojson).
IDS = ("P0001", "P0002", "L0001", "L0002")
MESES = ("2026-01", "2026-02")
RESOLUCION_PRUEBA = 9000          # DE PRUEBA: no es la resolución de ningún producto
CELDAS_PRUEBA = 6                 # DE PRUEBA


# ---------------------------------------------------------------------------------------
# Archivos DE PRUEBA válidos
# ---------------------------------------------------------------------------------------
ENC_CONTEXTO = "zona,fuente,variable,mes,valor,unidad,resolucion_m,n_celdas"
# Un valor de prueba por unidad, dentro de su límite físico (°C y cm: negativos a propósito).
VALOR_PRUEBA = {"m3/m3": "0.21", "adimensional": "0.35", "mm/mes": "42.5", "°C": "-3.5",
                "cm": "-7.25", "kg/m2": "310.0", "dias": "4"}


def fila_contexto(zona, fuente, variable, mes, valor, unidad, resolucion=RESOLUCION_PRUEBA, celdas=CELDAS_PRUEBA):
    return f"{zona},{fuente},{variable},{mes},{valor},{unidad},{resolucion},{celdas}"


def zona_de(fuente, zona):
    """La zona con que va una fuente: GRACE siempre «cuenca»; las demás, la zona pedida."""
    return CUENCA if fuente == DE_CUENCA else zona


def contexto_valido():
    """Las 12 combinaciones de la tabla y dos meses; un valor vacío (sin dato). Cada fuente va en las
    dos zonas, salvo GRACE, que va una sola vez con zona «cuenca»."""
    filas = [fila_contexto(zona_de(f, z), f, v, m, VALOR_PRUEBA[u], u)
             for z in (ZONA_A, ZONA_B) for (f, v, u) in esquemas.COMBINACIONES_CONTEXTO for m in MESES
             if f != DE_CUENCA or z == ZONA_A]
    filas[0] = fila_contexto(ZONA_A, *esquemas.COMBINACIONES_CONTEXTO[0][:2], MESES[0], "",
                             esquemas.COMBINACIONES_CONTEXTO[0][2])
    return "\n".join([ENC_CONTEXTO, *filas]) + "\n"


ENC_GEDI = "id,n_disparos,altura_mediana_m,altura_p90_m"
GEDI_VALIDO = "\n".join([ENC_GEDI, "P0001,4,6.2,8.1", "P0002,0,,", "L0001,1,0.4,0.4", "L0002,0,,"]) + "\n"

ENC_ECOSTRESS = "id,mes,et_mm_dia,n_escenas"
ECOSTRESS_VALIDO = "\n".join([ENC_ECOSTRESS, "P0001,2026-01,1.8,3", "P0001,2026-02,2.4,2", "P0002,2026-01,,0",
                              "L0001,2026-01,0.0,1", "L0002,2026-02,,0"]) + "\n"

ENC_GAEZ = "zona,cultivo,variable,valor,unidad,resolucion_m"


def gaez_valido():
    cultivos = esquemas.CULTIVOS_GAEZ
    filas = [f"{z},{c},Indicador de prueba,{i},clase,{RESOLUCION_PRUEBA}"
             for z in (ZONA_A, ZONA_B) for i, c in enumerate(cultivos[:3], start=1)]
    return "\n".join([ENC_GAEZ, *filas]) + "\n"


def buzon(tmp_path, archivos, **kw):
    """Buzón de prueba con el parcelas_base.geojson de la fixture de dos zonas."""
    return buzon_con(tmp_path, archivos, base=BUZON_DOS_ZONAS, **kw)


def entra(tmp_path, nombre, texto):
    rep = correr(buzon(tmp_path, {nombre: texto}), tmp_path)
    assert rep["rechazados"] == [], rep["rechazados"]
    assert rep["retenidos"] == []
    assert nombre in nombres(rep["entraron"])
    assert (tmp_path / "salida" / nombre).read_text(encoding="utf-8") == texto, "se copia sin modificar"
    return next(x for x in rep["entraron"] if x["archivo"] == nombre)


def rechazo(tmp_path, nombre, texto):
    """Motivos (un solo texto) con que se rechaza el archivo; nada suyo llega a la salida."""
    rep = correr(buzon(tmp_path, {nombre: texto}), tmp_path)
    assert nombre in nombres(rep["rechazados"]), f"{nombre} debió rechazarse; entraron: {nombres(rep['entraron'])}"
    assert not (tmp_path / "salida" / nombre).exists()
    return motivos_de(rep, nombre)


def cambiar(texto, vieja, nueva):
    assert texto.count(vieja) == 1, f"la fila de prueba «{vieja}» debe estar una sola vez"
    return texto.replace(vieja, nueva)


# ---------------------------------------------------------------------------------------
# Los esquemas: pieza, fuente de las reglas y un archivo para las dos zonas
# ---------------------------------------------------------------------------------------
def test_los_cuatro_esquemas_con_su_pieza_y_su_fuente():
    for nombre, pieza in NUEVOS.items():
        esq = esquemas.ESQUEMAS[nombre]
        assert esq["pieza"] == pieza and esq["tipo"] == "csv", nombre
        assert DECISION in esq["fuente_reglas"], nombre
        assert "por definición" in esq["fuente_reglas"], f"{nombre}: los límites físicos se declaran «por definición»"
        # Un archivo para las dos zonas: sin sufijo de zona y sin versión simulada.
        assert nombre not in esquemas.ARCHIVOS_POR_ZONA
        assert "alimenta" not in esq and nombre not in ens.esperados_simulados()


def test_columnas_exactas_del_contrato():
    columnas = {n: tuple(esquemas.ESQUEMAS[n]["columnas"]) for n in NUEVOS}
    assert columnas == {
        "contexto_regional.csv": tuple(ENC_CONTEXTO.split(",")),
        "gedi_parcelas.csv": tuple(ENC_GEDI.split(",")),
        "ecostress_parcelas.csv": tuple(ENC_ECOSTRESS.split(",")),
        "gaez_zona.csv": tuple(ENC_GAEZ.split(",")),
    }
    assert esquemas.ESQUEMAS["contexto_regional.csv"]["llave"] == ("zona", "fuente", "variable", "mes")
    assert esquemas.ESQUEMAS["ecostress_parcelas.csv"]["llave"] == ("id", "mes")


def test_tabla_de_combinaciones_es_la_de_la_decision():
    """Las 12 filas (fuente, variable, unidad) se leen de la tabla de la decisión, no de memoria."""
    texto = (RAIZ / DECISION).read_text(encoding="utf-8")
    filas = []
    for linea in texto.splitlines():
        celdas = [c.strip() for c in linea.strip().strip("|").split("|")]
        if len(celdas) == 4 and all(c.startswith("`") and c.endswith("`") for c in celdas[:3]):
            filas.append(tuple(c.strip("`") for c in celdas[:3]))
    assert filas[0] == ("fuente", "variable", "unidad"), "la primera fila es el encabezado de la tabla"
    filas = filas[1:]
    assert len(filas) == 12, filas
    assert tuple(filas) == esquemas.COMBINACIONES_CONTEXTO
    assert set(esquemas.FUENTES_CONTEXTO) == {"smap", "modis", "grace", "gldas", "nldas", "era5_land"}
    # Cada unidad con límite físico está en la tabla; °C y cm no llevan límite inventado.
    con_limite = {v for g in esquemas.LIMITES_CONTEXTO if g["segun"] == "unidad" for v in g["valores"]}
    assert con_limite <= set(esquemas.UNIDADES_CONTEXTO)
    assert not con_limite & {"°C", "cm"}


def test_sufijo_de_zona_no_se_admite(tmp_path):
    """Son UN archivo para las dos zonas: «contexto_regional_<zona>.csv» no está en la tabla."""
    nombre = f"contexto_regional_{ZONA_B}.csv"
    assert "no se sabe cómo validarlo" in rechazo(tmp_path, nombre, contexto_valido())


def test_los_cuatro_entran_juntos_y_se_registran(tmp_path):
    archivos = {"contexto_regional.csv": contexto_valido(), "gedi_parcelas.csv": GEDI_VALIDO,
                "ecostress_parcelas.csv": ECOSTRESS_VALIDO, "gaez_zona.csv": gaez_valido()}
    rep = correr(buzon(tmp_path, archivos), tmp_path)
    assert rep["rechazados"] == [] and rep["retenidos"] == []
    assert nombres(rep["entraron"]) == sorted([*archivos, "parcelas_base.geojson"])
    por_nombre = {x["archivo"]: x for x in rep["entraron"]}
    for nombre, pieza in NUEVOS.items():
        assert por_nombre[nombre]["pieza"] == pieza and por_nombre[nombre]["zona"] is None
    fuentes = {f["archivo"]: f for f in rep["fuentes"]}
    for nombre in NUEVOS:
        assert fuentes[nombre]["fuente"] and fuentes[nombre]["fecha"] and fuentes[nombre]["sha256"]
    # Los CSV por parcela dicen cuántas parcelas traen de cada zona.
    assert por_nombre["gedi_parcelas.csv"]["zonas"] == {ZONA_A: 2, ZONA_B: 2}


def test_por_parcela_sin_parcelas_base_quedan_retenidos(tmp_path):
    """gedi y ecostress comprueban sus id: si parcelas_base aún no llega, se retienen (no se rechazan)."""
    archivos = {"gedi_parcelas.csv": GEDI_VALIDO, "ecostress_parcelas.csv": ECOSTRESS_VALIDO,
                "gaez_zona.csv": gaez_valido()}
    rep = correr(buzon(tmp_path, archivos, copiar=()), tmp_path)
    assert nombres(rep["retenidos"]) == ["ecostress_parcelas.csv", "gedi_parcelas.csv"]
    assert nombres(rep["entraron"]) == ["gaez_zona.csv"] and rep["rechazados"] == []


# ---------------------------------------------------------------------------------------
# contexto_regional.csv (A10)
# ---------------------------------------------------------------------------------------
def test_contexto_valido_entra(tmp_path):
    x = entra(tmp_path, "contexto_regional.csv", contexto_valido())
    assert x["avisos"] == [], x["avisos"]


def test_contexto_columna_faltante(tmp_path):
    lineas = [",".join(l.split(",")[:-1]) for l in contexto_valido().splitlines()]     # sin n_celdas
    m = rechazo(tmp_path, "contexto_regional.csv", "\n".join(lineas) + "\n")
    assert "faltan columnas obligatorias: n_celdas" in m


def test_contexto_combinacion_que_no_esta_en_la_tabla(tmp_path):
    """smap no entrega «et»: cada valor está en su lista, pero la combinación no es una fila de la tabla."""
    texto = contexto_valido() + fila_contexto(ZONA_A, "smap", "et", MESES[0], "40", "mm/mes") + "\n"
    m = rechazo(tmp_path, "contexto_regional.csv", texto)
    assert "la combinación de (fuente, variable, unidad) no está en la tabla" in m and DECISION in m
    assert "smap, et, mm/mes" in m


def test_contexto_unidad_que_no_corresponde_a_la_variable(tmp_path):
    vieja = fila_contexto(CUENCA, "grace", "agua_almacenada_anomalia", MESES[1], VALOR_PRUEBA["cm"], "cm")
    nueva = fila_contexto(CUENCA, "grace", "agua_almacenada_anomalia", MESES[1], VALOR_PRUEBA["cm"], "mm/mes")
    m = rechazo(tmp_path, "contexto_regional.csv", cambiar(contexto_valido(), vieja, nueva))
    assert "no está en la tabla" in m and "grace, agua_almacenada_anomalia, mm/mes" in m


# GRACE: una sola serie de cuenca (nota de GRACE de la decisión).
def test_contexto_grace_va_con_zona_cuenca_y_solo_grace():
    regla = next(r for r in esquemas.ESQUEMAS["contexto_regional.csv"]["reglas"] if r["regla"] == "valores_segun")
    assert regla["casos"] == {"grace": ("cuenca",)} and regla["resto"] == "@zonas_ids"
    assert "nota de GRACE" in esquemas.ESQUEMAS["contexto_regional.csv"]["fuente_reglas"]
    texto = (RAIZ / DECISION).read_text(encoding="utf-8")
    assert "Solo para `grace`: `cuenca`" in texto and "una sola serie" in texto, "el contrato sigue diciéndolo"
    filas_grace = [l for l in contexto_valido().splitlines() if ",grace," in l]
    assert len(filas_grace) == len(MESES) and all(l.startswith(f"{CUENCA},") for l in filas_grace)


def test_contexto_grace_con_zona_de_parcelas_se_rechaza(tmp_path):
    """GRACE repartido por zona sería un efecto de la malla, no información local: no entra."""
    texto = contexto_valido().replace(f"{CUENCA},grace,", f"{ZONA_A},grace,")
    m = rechazo(tmp_path, "contexto_regional.csv", texto)
    assert f"zona «{ZONA_A}» no se admite con fuente «grace» (se admite: cuenca)" in m


def test_contexto_cuenca_con_otra_fuente_se_rechaza(tmp_path):
    vieja = fila_contexto(ZONA_B, "smap", "humedad_raiz", MESES[1], VALOR_PRUEBA["m3/m3"], "m3/m3")
    nueva = fila_contexto(CUENCA, "smap", "humedad_raiz", MESES[1], VALOR_PRUEBA["m3/m3"], "m3/m3")
    m = rechazo(tmp_path, "contexto_regional.csv", cambiar(contexto_valido(), vieja, nueva))
    assert f"zona «cuenca» no se admite con fuente «smap» (se admite: {', '.join(ZONAS)})" in m


def test_contexto_sin_zonas_en_params_avisa_y_no_inventa(tmp_path):
    """Si params no trae zona_piloto.zonas, la zona de las demás fuentes no se comprueba y se avisa."""
    import json
    params = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
    del params["zona_piloto"]["zonas"]
    rep = correr(buzon_con(tmp_path, {"contexto_regional.csv": contexto_valido()}, copiar=()), tmp_path, params=params)
    x = next(e for e in rep["entraron"] if e["archivo"] == "contexto_regional.csv")
    assert any("zonas_ids" in a for a in x["avisos"]), x["avisos"]


def test_contexto_llave_repetida(tmp_path):
    repetida = fila_contexto(ZONA_B, "nldas", "lluvia", MESES[0], VALOR_PRUEBA["mm/mes"], "mm/mes")
    m = rechazo(tmp_path, "contexto_regional.csv", contexto_valido() + repetida + "\n")
    assert "fila repetida para (zona, fuente, variable, mes)" in m and "nldas" in m


@pytest.mark.parametrize("fuente, variable, unidad, valor, clave", [
    ("smap", "humedad_superficial", "m3/m3", "1.4", "valor con unidad «m3/m3» fuera de [0, 1]"),
    ("smap", "humedad_raiz", "m3/m3", "-0.1", "valor con unidad «m3/m3» fuera de [0, 1]"),
    ("modis", "ndvi", "adimensional", "1.2", "valor con variable «ndvi» fuera de [-1, 1]"),
    ("modis", "et", "mm/mes", "-1", "valor con unidad «mm/mes» menor que 0"),
    ("gldas", "humedad_raiz", "kg/m2", "-5", "valor con unidad «kg/m2» menor que 0"),
    ("era5_land", "dias_helada", "dias", "32", "valor con unidad «dias» fuera de [0, 31]"),
])
def test_contexto_valor_fuera_del_limite_fisico(tmp_path, fuente, variable, unidad, valor, clave):
    vieja = fila_contexto(ZONA_B, fuente, variable, MESES[1], VALOR_PRUEBA[unidad], unidad)
    nueva = fila_contexto(ZONA_B, fuente, variable, MESES[1], valor, unidad)
    m = rechazo(tmp_path, "contexto_regional.csv", cambiar(contexto_valido(), vieja, nueva))
    assert clave in m and valor in m


@pytest.mark.parametrize("fuente, variable, unidad, valor", [
    ("era5_land", "tmin_media", "°C", "-45.5"),
    ("modis", "temp_superficie_dia", "°C", "71"),
    ("grace", "agua_almacenada_anomalia", "cm", "-250"),
])
def test_contexto_celsius_y_cm_sin_limite_inventado(tmp_path, fuente, variable, unidad, valor):
    vieja = fila_contexto(zona_de(fuente, ZONA_A), fuente, variable, MESES[1], VALOR_PRUEBA[unidad], unidad)
    nueva = fila_contexto(zona_de(fuente, ZONA_A), fuente, variable, MESES[1], valor, unidad)
    entra(tmp_path, "contexto_regional.csv", cambiar(contexto_valido(), vieja, nueva))


@pytest.mark.parametrize("cambio, clave", [
    (lambda f: f.replace(f"{ZONA_B},gldas,et,", "zona_inventada,gldas,et,", 1),
     "zona «zona_inventada» no se admite con fuente «gldas»"),
    (lambda f: f.replace(f"{ZONA_B},gldas,et,", ",gldas,et,", 1), "zona: celda vacía no permitida"),
    (lambda f: f.replace(",gldas,et,", ",merra,et,", 1), "fuente fuera de la lista permitida"),
    (lambda f: f.replace(",gldas,et,", ",gldas,escurrimiento,", 1), "variable fuera de la lista permitida"),
    (lambda f: f.replace(f",gldas,et,{MESES[0]},", ",gldas,et,2026-13,", 1), "no es un mes AAAA-MM válido"),
    (lambda f: f.replace(f",gldas,et,{MESES[0]},{VALOR_PRUEBA['mm/mes']},", f",gldas,et,{MESES[0]},mucho,", 1),
     "valor: no es un número"),
    (lambda f: f.replace(f",mm/mes,{RESOLUCION_PRUEBA},", ",mm/mes,0,", 1), "resolucion_m debe ser mayor que 0"),
    (lambda f: f.replace(f",mm/mes,{RESOLUCION_PRUEBA},{CELDAS_PRUEBA}", f",mm/mes,{RESOLUCION_PRUEBA},0", 1),
     "n_celdas menor que 1"),
    (lambda f: f.replace(f",mm/mes,{RESOLUCION_PRUEBA},{CELDAS_PRUEBA}", f",mm/mes,{RESOLUCION_PRUEBA},2.5", 1),
     "n_celdas: debe ser entero"),
    (lambda f: f.replace(f",mm/mes,{RESOLUCION_PRUEBA},", ",mm/mes,,", 1), "resolucion_m: celda vacía no permitida"),
])
def test_contexto_celdas_invalidas(tmp_path, cambio, clave):
    texto = cambio(contexto_valido())
    assert texto != contexto_valido(), "el cambio de prueba no se aplicó"
    assert clave in rechazo(tmp_path, "contexto_regional.csv", texto)


def test_contexto_dias_helada_con_decimales_entra(tmp_path):
    """Los días con helada de ERA5-Land se promedian entre celdas: pueden traer decimales."""
    vieja = fila_contexto(ZONA_A, "era5_land", "dias_helada", MESES[0], VALOR_PRUEBA["dias"], "dias")
    nueva = fila_contexto(ZONA_A, "era5_land", "dias_helada", MESES[0], "3.6", "dias")
    entra(tmp_path, "contexto_regional.csv", cambiar(contexto_valido(), vieja, nueva))


# ---------------------------------------------------------------------------------------
# Intermedios de Earth Engine: crudos, no entregas
# ---------------------------------------------------------------------------------------
def test_intermedios_de_earth_engine_se_listan_como_crudos(tmp_path):
    """ctx_*.csv y gedi_disparos_*.csv no son entregas: ni entran, ni se rechazan, ni piden LEEME."""
    b = buzon(tmp_path, {"contexto_regional.csv": contexto_valido(), "gedi_parcelas.csv": GEDI_VALIDO})
    for nombre in ("ctx_smap_2026.csv", "ctx_grace.csv", "gedi_disparos_delicias_saucillo.csv"):
        (b / nombre).write_text("columna_de_prueba\n1\n", encoding="utf-8")       # sin línea en LEEME.md
        assert ens.es_crudo(nombre)
    rep = correr(b, tmp_path)
    assert rep["rechazados"] == []
    assert sorted(c["archivo"] for c in rep["crudos"]) == ["ctx_grace.csv", "ctx_smap_2026.csv",
                                                           "gedi_disparos_delicias_saucillo.csv"]
    assert nombres(rep["entraron"]) == ["contexto_regional.csv", "gedi_parcelas.csv", "parcelas_base.geojson"]
    for c in rep["crudos"]:
        assert not (tmp_path / "salida" / c["archivo"]).exists()
    # Las entregas de verdad no se confunden con crudos.
    for nombre in NUEVOS:
        assert not ens.es_crudo(nombre)


# ---------------------------------------------------------------------------------------
# gedi_parcelas.csv (A11)
# ---------------------------------------------------------------------------------------
def test_gedi_valido_entra(tmp_path):
    x = entra(tmp_path, "gedi_parcelas.csv", GEDI_VALIDO)
    assert x["zonas"] == {ZONA_A: 2, ZONA_B: 2}


@pytest.mark.parametrize("vieja, nueva, clave", [
    # id que no existe en parcelas_base.geojson
    ("L0002,0,,", "L0999,0,,", "id no existe en parcelas_base.geojson"),
    # alturas con n_disparos = 0 (sin disparos no hay altura: vacío, nunca cero)
    ("P0002,0,,", "P0002,0,0,0", "altura_mediana_m debe ir vacío cuando n_disparos = 0"),
    ("L0002,0,,", "L0002,0,,5.5", "altura_p90_m debe ir vacío cuando n_disparos = 0"),
    # con disparos, las alturas no van vacías
    ("P0001,4,6.2,8.1", "P0001,4,,8.1", "altura_mediana_m sin valor con n_disparos distinto de 0"),
    ("P0001,4,6.2,8.1", "P0001,4,6.2,", "altura_p90_m sin valor con n_disparos distinto de 0"),
    # mediana ≤ percentil 90 y alturas ≥ 0
    ("P0001,4,6.2,8.1", "P0001,4,9.5,8.1", "no se cumple altura_mediana_m ≤ altura_p90_m"),
    ("L0001,1,0.4,0.4", "L0001,1,-0.4,0.4", "altura_mediana_m menor que 0"),
    # n_disparos entero ≥ 0
    ("L0001,1,0.4,0.4", "L0001,-1,0.4,0.4", "n_disparos menor que 0"),
    ("L0001,1,0.4,0.4", "L0001,1.5,0.4,0.4", "n_disparos: debe ser entero"),
    # una fila por parcela
    ("L0002,0,,", "P0002,0,,", "id repetido"),
])
def test_gedi_invalidos(tmp_path, vieja, nueva, clave):
    assert clave in rechazo(tmp_path, "gedi_parcelas.csv", cambiar(GEDI_VALIDO, vieja, nueva))


def test_gedi_columna_faltante(tmp_path):
    texto = "\n".join(",".join(l.split(",")[:3]) for l in GEDI_VALIDO.splitlines()) + "\n"   # sin altura_p90_m
    assert "faltan columnas obligatorias: altura_p90_m" in rechazo(tmp_path, "gedi_parcelas.csv", texto)


# ---------------------------------------------------------------------------------------
# ecostress_parcelas.csv (A12)
# ---------------------------------------------------------------------------------------
def test_ecostress_valido_entra(tmp_path):
    x = entra(tmp_path, "ecostress_parcelas.csv", ECOSTRESS_VALIDO)
    assert x["zonas"] == {ZONA_A: 2, ZONA_B: 2}


def test_ecostress_columna_faltante(tmp_path):
    texto = ECOSTRESS_VALIDO.replace(ENC_ECOSTRESS, "id,mes,et,n_escenas")
    m = rechazo(tmp_path, "ecostress_parcelas.csv", texto)
    assert "faltan columnas obligatorias: et_mm_dia" in m


def test_ecostress_llave_repetida(tmp_path):
    m = rechazo(tmp_path, "ecostress_parcelas.csv", ECOSTRESS_VALIDO + "P0001,2026-02,2.6,1\n")
    assert "fila repetida para (id, mes)" in m and "P0001, 2026-02" in m


@pytest.mark.parametrize("vieja, nueva, clave", [
    ("L0001,2026-01,0.0,1", "L0777,2026-01,0.0,1", "id no existe en parcelas_base.geojson"),
    ("P0001,2026-01,1.8,3", "P0001,2026-01,-1.8,3", "et_mm_dia menor que 0"),
    ("P0001,2026-01,1.8,3", "P0001,enero,1.8,3", "mes: no es un mes AAAA-MM válido"),
    ("P0001,2026-01,1.8,3", "P0001,2026-01,1.8,-3", "n_escenas menor que 0"),
    ("P0001,2026-01,1.8,3", "P0001,2026-01,1.8,", "n_escenas: celda vacía no permitida"),
    # «vacío si no hubo escena»: una ET con cero escenas no tiene de dónde salir
    ("P0002,2026-01,,0", "P0002,2026-01,2.2,0", "et_mm_dia debe ir vacío cuando n_escenas = 0"),
])
def test_ecostress_invalidos(tmp_path, vieja, nueva, clave):
    assert clave in rechazo(tmp_path, "ecostress_parcelas.csv", cambiar(ECOSTRESS_VALIDO, vieja, nueva))


def test_ecostress_et_vacia_con_escenas_entra(tmp_path):
    """Con escenas la ET puede venir vacía (el contrato solo pide vacío cuando no hubo escena)."""
    entra(tmp_path, "ecostress_parcelas.csv", cambiar(ECOSTRESS_VALIDO, "P0001,2026-02,2.4,2", "P0001,2026-02,,2"))


# Entrega corregida del 15-nov (nota «15-nov 00:34» de datos/PARA_INTEGRADOR.md, rama datos-satelite): las columnas de
# antes, en el mismo orden, y al final el menor y el mayor de los sobrevuelos usados y la incertidumbre. DE PRUEBA.
ENC_ECOSTRESS_NUEVO = "id,mes,et_mm_dia,n_escenas,zona,etc_modelo_mm,razon,et_min_mm_dia,et_max_mm_dia,incertidumbre_w_m2"
ECOSTRESS_NUEVO = "\n".join([
    ENC_ECOSTRESS_NUEVO,
    f"P0001,2026-01,1.8,3,{ZONA_A},5.0,0.36,1.2,2.6,90",
    f"P0001,2026-02,2.4,1,{ZONA_A},,,2.4,2.4,75",
    f"P0002,2026-01,,0,{ZONA_A},,,,,",
    f"L0001,2026-01,0.0,2,{ZONA_B},,,0.0,0.1,40",
    f"L0002,2026-02,,0,{ZONA_B},,,,,",
]) + "\n"


def test_ecostress_columnas_opcionales_del_intervalo():
    """La ficha lee et_min_mm_dia y et_max_mm_dia (el intervalo entre sobrevuelos): se declaran, y como opcionales,
    porque la entrega anterior no las trae (I7 de la revisión independiente de ECOSTRESS)."""
    esq = esquemas.ESQUEMAS["ecostress_parcelas.csv"]
    assert tuple(esq["columnas_opcionales"]) == ("et_min_mm_dia", "et_max_mm_dia")
    assert not set(esq["columnas_opcionales"]) & set(esq["columnas"]), "una columna es obligatoria u opcional, no las dos"
    assert all(c["nulo"] and c["min"] == 0 for c in esq["columnas_opcionales"].values())
    assert "incertidumbre_w_m2" not in esq["columnas_opcionales"], "no se muestra: sigue sin declararse"


def test_ecostress_entrega_corregida_entra_y_la_anterior_tambien(tmp_path):
    """Las dos formas del archivo pasan: la anterior (cuatro columnas) y la corregida (con el intervalo)."""
    x = entra(tmp_path / "nuevo", "ecostress_parcelas.csv", ECOSTRESS_NUEVO)
    assert x["zonas"] == {ZONA_A: 2, ZONA_B: 2}
    # Las opcionales se validan: ya no están entre las «adicionales (se copian sin validar)»; las demás, sí.
    aviso = next(a for a in x["avisos"] if a.startswith("columnas adicionales"))
    assert "et_min_mm_dia" not in aviso and "et_max_mm_dia" not in aviso
    assert all(c in aviso for c in ("zona", "etc_modelo_mm", "razon", "incertidumbre_w_m2"))
    entra(tmp_path / "anterior", "ecostress_parcelas.csv", ECOSTRESS_VALIDO)


@pytest.mark.parametrize("vieja, nueva, clave", [
    (",1.2,2.6,90", ",-1.2,2.6,90", "et_min_mm_dia menor que 0"),
    (",1.2,2.6,90", ",1.2,dos,90", "et_max_mm_dia"),
    # Por definición: menor ≤ mediana ≤ mayor.
    (",1.2,2.6,90", ",1.9,2.6,90", "no se cumple et_min_mm_dia ≤ et_mm_dia ≤ et_max_mm_dia"),
    (",1.2,2.6,90", ",1.2,1.7,90", "no se cumple et_min_mm_dia ≤ et_mm_dia ≤ et_max_mm_dia"),
    # Sin sobrevuelos no hay ni menor ni mayor.
    (f"P0002,2026-01,,0,{ZONA_A},,,,,", f"P0002,2026-01,,0,{ZONA_A},,,0.5,,", "et_min_mm_dia debe ir vacío cuando n_escenas = 0"),
    (f"L0002,2026-02,,0,{ZONA_B},,,,,", f"L0002,2026-02,,0,{ZONA_B},,,,0.9,", "et_max_mm_dia debe ir vacío cuando n_escenas = 0"),
])
def test_ecostress_intervalo_invalido(tmp_path, vieja, nueva, clave):
    assert clave in rechazo(tmp_path, "ecostress_parcelas.csv", cambiar(ECOSTRESS_NUEVO, vieja, nueva))


def test_ecostress_una_sola_de_las_dos_opcionales_tambien_se_valida(tmp_path):
    """Una columna opcional que viene se valida aunque la otra falte (y la que falta no se pide)."""
    solo_min = "\n".join(",".join(f.split(",")[:8]) for f in ECOSTRESS_NUEVO.strip().split("\n")) + "\n"
    assert solo_min.splitlines()[0].endswith(",et_min_mm_dia")
    entra(tmp_path / "bien", "ecostress_parcelas.csv", solo_min)
    assert "et_min_mm_dia menor que 0" in rechazo(tmp_path / "mal", "ecostress_parcelas.csv", cambiar(solo_min, ",1.2\n", ",-1.2\n"))


# ---------------------------------------------------------------------------------------
# gaez_zona.csv (A13)
# ---------------------------------------------------------------------------------------
def test_gaez_valido_entra(tmp_path):
    entra(tmp_path, "gaez_zona.csv", gaez_valido())


def test_gaez_cultivos_son_las_clases_del_proyecto():
    assert set(esquemas.CULTIVOS_GAEZ) < set(esquemas.CULTIVOS)
    assert set(esquemas.CULTIVOS) - set(esquemas.CULTIVOS_GAEZ) == {"sin_clasificar", "barbecho"}


def test_gaez_columna_faltante(tmp_path):
    texto = "\n".join(",".join(l.split(",")[:-1]) for l in gaez_valido().splitlines()) + "\n"   # sin resolucion_m
    assert "faltan columnas obligatorias: resolucion_m" in rechazo(tmp_path, "gaez_zona.csv", texto)


def _gaez_con(columna, valor):
    """gaez_valido() con una celda cambiada en la primera fila de datos."""
    lineas = gaez_valido().splitlines()
    celdas = lineas[1].split(",")
    celdas[ENC_GAEZ.split(",").index(columna)] = valor
    lineas[1] = ",".join(celdas)
    return "\n".join(lineas) + "\n"


@pytest.mark.parametrize("columna, valor, clave", [
    ("zona", "zona_inventada", "zona fuera de la lista permitida"),
    # «trigo» no es una clase del proyecto (el cereal de invierno es «cereal_invierno»)
    ("cultivo", "trigo", "cultivo fuera de la lista permitida"),
    ("cultivo", "sin_clasificar", "cultivo fuera de la lista permitida"),
    ("variable", "", "variable: celda vacía no permitida"),
    ("unidad", "", "unidad: celda vacía no permitida"),
    ("valor", "alto", "valor: no es un número"),
    ("valor", "", "valor: celda vacía no permitida"),
    ("resolucion_m", "0", "resolucion_m debe ser mayor que 0"),
    ("resolucion_m", "-9000", "resolucion_m debe ser mayor que 0"),
])
def test_gaez_invalidos(tmp_path, columna, valor, clave):
    assert clave in rechazo(tmp_path, "gaez_zona.csv", _gaez_con(columna, valor))


# ---------------------------------------------------------------------------------------
# Lo que ya había no cambia
# ---------------------------------------------------------------------------------------
def test_las_reglas_nuevas_solo_las_usan_los_esquemas_nuevos():
    reglas_nuevas = {"combinacion_permitida", "rango_segun", "valores_segun", "vacias_segun"}
    assert reglas_nuevas <= set(ens.REGLAS_CSV)
    for nombre, esq in esquemas.ESQUEMAS.items():
        usadas = {r["regla"] for r in esq.get("reglas", [])}
        if nombre not in NUEVOS:
            assert not usadas & reglas_nuevas, f"{nombre} no debía cambiar"
