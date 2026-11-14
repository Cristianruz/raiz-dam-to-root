# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Esquemas del buzón de entregas: SOLO DATOS (la lógica vive en motor/ensamblar.py).

Fuentes de lo que aquí se exige:
- kit v4, tabla 0.4-B (columnas obligatorias de cada entrega) y K-ENS paso 2
  (columnas y tipos; ids existentes en parcelas_base; P10 ≤ P50 ≤ P90; NDVI entre −1 y 1;
  prob_max entre 0 y 1; estados de la memoria en su lista; dotaciones dentro del deslizador);
- el contrato v4 (kit §2.2–2.5) para las listas de valores, que se importan de
  validar_contrato.py para no tenerlas dos veces;
- el acuerdo vigente con la sesión que corre Earth Engine y Colab (14-nov-2026): carpeta
  Raiz/entregas/ (plana o con entregas/<rol>/), una línea por archivo en LEEME.md con
  «archivo | fuente | fecha | script» y los rangos de cada archivo (ver «fuente_reglas»).

Vocabulario de un campo (columna de CSV o propiedad de GeoJSON):
  tipo      texto | numero | entero | fecha (AAAA-MM-DD) | mes (AAAA-MM) |
            mes_o_numero (AAAA-MM o 1–12) | bool | k_de_n ("2/2") | sha256 (64 hex)
  min, max  cota inclusiva. Un número escrito aquí es una cota de definición
            (NDVI ∈ [−1, 1], fracción ∈ [0, 1], 12 meses) o una cota del kit o del acuerdo,
            citada en «fuente_reglas». Un texto «@nombre» es un límite derivado de
            data/params.json (ver LIMITES_DERIVADOS); si params no lo trae, la comprobación
            se omite y se avisa (nunca se inventa el valor).
  nulo      True: la celda puede venir vacía (o null en JSON).
  faltante  valor centinela que cuenta como faltante (−999 de NASA POWER).
  valores   lista cerrada de valores permitidos.
  unico     True: no se repite en el archivo.
  id_parcela True: debe existir en parcelas_base.geojson (si aún no llega, el archivo
            queda «retenido», no rechazado).

Reglas de tabla («reglas»): orden (c1 ≤ c2 ≤ …), rango_por_banda, dias_ventana_por_anio,
abstencion_a42, un_solo_valor_por y faltantes_max. ensamblar.py las aplica por nombre.
"""
import sys
from pathlib import Path

_RAIZ = Path(__file__).resolve().parent.parent
if str(_RAIZ) not in sys.path:
    sys.path.insert(0, str(_RAIZ))

# Listas del contrato v4 (kit §2.2 y §2.3): una sola fuente, el validador del contrato.
from validar_contrato import CULTIVOS, ESTADOS_MEMORIA, MARCAS  # noqa: E402

# ---------------------------------------------------------------------------------------
# Buzón y LEEME.md (acuerdo con la sesión de Earth Engine)
# ---------------------------------------------------------------------------------------
NOMBRE_LEEME = "LEEME.md"
ENCABEZADO_LEEME = ("archivo", "fuente", "fecha", "script")
# Archivos del sistema que crean Drive, macOS o Windows: se ignoran sin reportarlos como entrega.
ARCHIVOS_DE_SISTEMA = ("desktop.ini", "thumbs.db", "icon\r")
# Código: no entra por el buzón. Cristian lo revisa y lo copia a mano (kit §0.1, regla 2).
EXTENSIONES_CODIGO = (".py", ".ipynb", ".js", ".sh")

# El archivo que se valida PRIMERO: los demás validan sus ids contra él.
ARCHIVO_PARCELAS = "parcelas_base.geojson"

# ---------------------------------------------------------------------------------------
# Límites derivados de data/params.json. ensamblar.limites_derivados() los calcula.
# ---------------------------------------------------------------------------------------
LIMITES_DERIVADOS = {
    "area_min_ha": "mapa.area_min_ha.valor (kit B1 paso 3: se filtran los campos menores)",
    "bbox": "zona_piloto.bbox.valor ([oeste, sur, este, norte], EPSG:4326)",
    "anio_actual": "memoria.anio_actual.valor (año agrícola en curso)",
    "anio_inicio": "memoria.anio_inicio.valor (primer año de la memoria)",
    "dias_ventana_anio_actual": ("suelo.ventana_desnudo.valor (1-feb a 30-abr) en el año "
                                 "memoria.anio_actual: días del calendario, ambos extremos incluidos. "
                                 "SUPUESTO DOCUMENTADO: la ventana de 2026 cae en un año no bisiesto"),
    "dias_ventana_max": ("el mayor número de días de la ventana entre memoria.anio_inicio y "
                         "memoria.anio_actual (los años bisiestos suman un día)"),
    "deslizador_min": "dotaciones.deslizador.valor.min (millares/ha)",
    "deslizador_max": "dotaciones.deslizador.valor.max (millares/ha)",
    "lluvia_pct": "lluvia_pct.valor (variantes de lluvia del cubo)",
    "umbral_abstencion": "mapa.umbral_abstencion.valor (abstención si prob_max < umbral)",
    "ftw_confianza_min": "mapa.ftw_confianza_min.valor (abstención si ftw_confianza < umbral)",
    "umbrales_ndvi": "memoria.ndvi_verde.valor más memoria.ndvi_verde.sensibilidad",
}

# ---------------------------------------------------------------------------------------
# Constantes de validación con su fuente
# ---------------------------------------------------------------------------------------
FALTANTE_POWER = -999            # kit A1 paso 3: valores faltantes de NASA POWER
FALTANTES_MAX_FRACCION = 0.05    # acuerdo: se cuentan y reportan; se rechaza desde el 5 %
TAMANO_MAX_RUTAS_BYTES = 1_000_000  # kit A9 paso 3: relieve_rutas.geojson < 1 MB (1 MB = 10^6 bytes)
PROTAGONISTAS_ESPERADAS = 3      # kit B1 paso 4: 3 protagonistas (si no, solo se avisa)

# GeoTIFF (OGC GeoTIFF 1.1). NASADEM se exporta en EPSG:4326 a ~30 m (kit A9 paso 1).
GEOTIFF = {
    "tag_geokeys": 34735,        # GeoKeyDirectoryTag
    "tag_escala": 33550,         # ModelPixelScaleTag (ScaleX, ScaleY, ScaleZ)
    "tag_tiepoint": 33922,       # ModelTiepointTag (I, J, K, X, Y, Z)
    "tag_transformacion": 34264,  # ModelTransformationTag (alternativa que aquí NO se acepta)
    "geokey_modelo": 1024,       # GTModelTypeGeoKey (2 = geográfico)
    "geokey_raster": 1025,       # GTRasterTypeGeoKey (1 = PixelIsArea, 2 = PixelIsPoint)
    "geokey_geografico": 2048,   # GeographicTypeGeoKey
    "geokey_proyectado": 3072,   # ProjectedCSTypeGeoKey (solo para explicar el rechazo)
    "modelo_geografico": 2,
    "raster_punto": 2,
    "epsg": 4326,
    # 1 arcosegundo = 1/3600 de grado (definición): resolución nativa de NASADEM.
    "escala_arcoseg": 1.0,
    # Tolerancia de la escala del píxel [S]: Earth Engine exporta «scale=30» en EPSG:4326 como
    # 30 m / 111,319.49 m por grado ≈ 0.97″; ±10 % acepta eso y la malla nativa de 1″.
    "tolerancia_escala": 0.10,
}

# Bandas de hls_mensual_parcelas.csv (kit A3 paso 2: azul, verde, rojo, NIR, SWIR1, SWIR2;
# índices NDVI y LSWI). BSI también es una diferencia normalizada, acotada en [−1, 1].
BANDAS_INDICE = ("ndvi", "lswi", "bsi")
BANDAS_REFLECTANCIA = ("azul", "verde", "rojo", "nir", "swir1", "swir2",
                       "blue", "green", "red")

# Clases de las etiquetas (kit A4.1 paso 3).
CLASES_ETIQUETA = ("alfalfa", "nogal", "maiz_forrajero", "sorgo", "chile", "algodon",
                   "cereal_invierno", "barbecho", "no_se", "forraje_verano")
USOS_ETIQUETA = ("entrenamiento", "validacion", "validación")

FUENTE_TABLA = "kit v4, tabla 0.4-B"
FUENTE_KENS = "kit v4, K-ENS paso 2"
FUENTE_ACUERDO = "acuerdo con la sesión de Earth Engine y Colab (14-nov-2026)"

ID = {"tipo": "texto", "id_parcela": True}
INDICE = {"tipo": "numero", "min": -1, "max": 1}     # NDVI y demás diferencias normalizadas
FRACCION = {"tipo": "numero", "min": 0, "max": 1}
MESES_ANIO = {"tipo": "entero", "min": 0, "max": 12}
NO_NEGATIVO = {"tipo": "numero", "min": 0}


def _con(base, **cambios):
    """Copia de un campo base con cambios (solo para escribir los esquemas sin repetir)."""
    return {**base, **cambios}


# ---------------------------------------------------------------------------------------
# Esquemas por nombre exacto de archivo (tabla 0.4-B)
# ---------------------------------------------------------------------------------------
ESQUEMAS = {
    # ---- B1 (parcelas) ---------------------------------------------------------------
    "parcelas_base.geojson": {
        "pieza": "B1", "tipo": "geojson",
        "geometrias": ("Polygon", "MultiPolygon"),
        "propiedades": {
            "id": {"tipo": "texto", "unico": True},
            "area_ha": {"tipo": "numero", "min": "@area_min_ha"},
            "modulo": {"tipo": "texto", "nulo": True},
            "ftw_confianza": {"tipo": "numero", "min": 0, "max": 100},
            "protagonista": {"tipo": "bool"},
        },
        "es_referencia_ids": True,
        "protagonistas_esperadas": PROTAGONISTAS_ESPERADAS,
        "avisar_fuera_de_bbox": True,
        "alimenta": "parcelas.geojson: geometría, id, area_ha, modulo, ftw_confianza, protagonista",
        "fuente_reglas": f"{FUENTE_TABLA}; kit §2.2; {FUENTE_ACUERDO}",
    },
    "parcelas_muestra.geojson": {
        "pieza": "B1", "tipo": "geojson",
        "geometrias": ("Polygon", "MultiPolygon"),
        "propiedades": {
            "id": {"tipo": "texto"},
            "area_ha": {"tipo": "numero", "min": "@area_min_ha"},
            "modulo": {"tipo": "texto", "nulo": True},
            "ftw_confianza": {"tipo": "numero", "min": 0, "max": 100},
            "protagonista": {"tipo": "bool"},
            "punto_id": {"tipo": "texto", "unico": True},
            "bloque": {"tipo": "texto"},
        },
        "fuente_reglas": f"{FUENTE_TABLA} (en la muestra, además punto_id y bloque)",
    },
    # ---- A1 y A2 (clima) -------------------------------------------------------------
    "eto_diaria.csv": {
        "pieza": "A1", "tipo": "csv",
        "columnas": {
            "fecha": {"tipo": "fecha", "unico": True},
            "eto_mm": {"tipo": "numero", "min": 0, "max": 15, "faltante": FALTANTE_POWER},
            "tmin": {"tipo": "numero", "faltante": FALTANTE_POWER},
            "tmax": {"tipo": "numero", "faltante": FALTANTE_POWER},
            "lluvia_mm": {"tipo": "numero", "min": 0, "faltante": FALTANTE_POWER},
            "ws2m": {"tipo": "numero", "min": 0, "faltante": FALTANTE_POWER},
        },
        "reglas": [
            {"regla": "orden", "columnas": ["tmin", "tmax"]},
            {"regla": "faltantes_max", "fraccion": FALTANTES_MAX_FRACCION},
        ],
        "fuente_reglas": (f"{FUENTE_TABLA}; kit A1 (ETo entre 0 y 15 mm/d; −999 = faltante); "
                          f"{FUENTE_ACUERDO} (tmin ≤ tmax; lluvia ≥ 0; faltantes < 5 %); "
                          "viento ≥ 0 por definición"),
    },
    "heladas.json": {
        "pieza": "A2", "tipo": "json", "regla": "heladas",
        "fuente_reglas": "kit A2 paso 5 (ultima_primavera, primera_otono, prob_helada_despues_de, fuente)",
    },
    # ---- A3 (HLS 2026) ---------------------------------------------------------------
    "hls_mensual_parcelas.csv": {
        "pieza": "A3", "tipo": "csv",
        "columnas": {
            "id": ID,
            "mes": {"tipo": "mes"},
            "banda": {"tipo": "texto"},
            "mediana": {"tipo": "numero", "nulo": True},
            "p25": {"tipo": "numero", "nulo": True},
            "p75": {"tipo": "numero", "nulo": True},
            "n_validos": {"tipo": "entero", "min": 0},
        },
        "llave": ("id", "mes", "banda"),
        "reglas": [
            {"regla": "orden", "columnas": ["p25", "mediana", "p75"]},
            {"regla": "rango_por_banda", "columna_banda": "banda",
             "columnas": ["mediana", "p25", "p75"],
             "grupos": [
                 {"nombre": "índice", "bandas": BANDAS_INDICE, "min": -1, "max": 1},
                 {"nombre": "reflectancia (escala 0.0001 aplicada)", "bandas": BANDAS_REFLECTANCIA,
                  "min": 0, "max": 1},
             ]},
        ],
        "fuente_reglas": f"{FUENTE_TABLA}; kit A3; {FUENTE_ACUERDO}",
    },
    "suelo_desnudo.csv": {
        "pieza": "A3", "tipo": "csv",
        "columnas": {
            "id": _con(ID, unico=True),
            "dias_suelo_desnudo_feb_abr": {"tipo": "entero", "min": 0, "max": "@dias_ventana_anio_actual"},
            "dias_desnudo_viento_alto": {"tipo": "entero", "min": 0, "max": "@dias_ventana_anio_actual"},
            "ndvi_ultimo_mes": _con(INDICE, nulo=True),
            "meses_validos": MESES_ANIO,
        },
        "reglas": [{"regla": "orden", "columnas": ["dias_desnudo_viento_alto", "dias_suelo_desnudo_feb_abr"]}],
        "alimenta": "parcelas.geojson: dias_suelo_desnudo_feb_abr, ndvi_ultimo_mes",
        "fuente_reglas": (f"{FUENTE_TABLA}; kit §2.2 (días enteros); {FUENTE_ACUERDO} "
                          "(días entre 0 y los de la ventana 1-feb a 30-abr; los días con viento alto "
                          "son parte de los días desnudos)"),
    },
    # ---- A3-M (memoria 2016–2026) ----------------------------------------------------
    "memoria_mensual.csv": {
        "pieza": "A3-M", "tipo": "csv",
        "columnas": {
            "id": ID,
            "anio_agricola": {"tipo": "entero", "max": "@anio_actual"},
            "mes": {"tipo": "mes_o_numero"},
            "ndvi_mediana": _con(INDICE, nulo=True),
            "n_validos": {"tipo": "entero", "min": 0},
        },
        "llave": ("id", "anio_agricola", "mes"),
        "fuente_reglas": f"{FUENTE_TABLA}; {FUENTE_KENS}",
    },
    "memoria_parcelas.csv": {
        "pieza": "A3-M", "tipo": "csv",
        "columnas": {
            "id": ID,
            "anio_agricola": {"tipo": "entero", "max": "@anio_actual"},
            "estado": {"tipo": "texto", "valores": sorted(ESTADOS_MEMORIA)},
            "meses_verdes": MESES_ANIO,
            "max_verano": _con(INDICE, nulo=True),
            "max_invierno": _con(INDICE, nulo=True),
            "dias_suelo_desnudo_feb_abr": {"tipo": "numero", "min": 0, "nulo": True},
            "meses_validos": MESES_ANIO,
        },
        "llave": ("id", "anio_agricola"),
        "reglas": [
            {"regla": "orden", "columnas": ["meses_verdes", "meses_validos"]},
            {"regla": "dias_ventana_por_anio", "columna": "dias_suelo_desnudo_feb_abr",
             "anio": "anio_agricola"},
        ],
        "alimenta": "parcelas.geojson: memoria",
        "fuente_reglas": f"{FUENTE_TABLA}; {FUENTE_KENS} (estados de la memoria en su lista); kit A3-M",
    },
    "memoria_resumen.csv": {
        "pieza": "A3-M", "tipo": "csv",
        "columnas": {
            "id": _con(ID, unico=True),
            "edad_perenne_anios": {"tipo": "entero", "min": 0, "nulo": True},
            "dias_suelo_desnudo_mediana": {"tipo": "numero", "min": 0, "max": "@dias_ventana_max",
                                           "nulo": True},
            "estado_2025": {"tipo": "texto", "valores": sorted(ESTADOS_MEMORIA), "nulo": True},
        },
        "alimenta": "parcelas.geojson: edad_perenne_anios, dias_suelo_desnudo_mediana",
        "fuente_reglas": f"{FUENTE_TABLA}; {FUENTE_KENS}; kit §2.2",
    },
    "memoria_validacion.csv": {
        "pieza": "A3-M", "tipo": "csv", "columnas": {},
        "fuente_reglas": f"{FUENTE_TABLA} (tabla de acuerdo con las etiquetas de 2026; columnas libres)",
    },
    # ---- A4 (mapa de cultivos) -------------------------------------------------------
    "etiquetas_unidas.csv": {
        "pieza": "A4.1", "tipo": "csv",
        "columnas": {
            "id": {"tipo": "texto"},     # polígono de la muestra, no de parcelas_base
            "punto_id": {"tipo": "texto", "unico": True},
            "bloque": {"tipo": "texto"},
            "uso": {"tipo": "texto", "valores": USOS_ETIQUETA},
            "clase_P2": {"tipo": "texto", "valores": CLASES_ETIQUETA, "nulo": True},
            "clase_P3": {"tipo": "texto", "valores": CLASES_ETIQUETA, "nulo": True},
            "clase_desempate": {"tipo": "texto", "valores": CLASES_ETIQUETA, "nulo": True},
            "clase_final": {"tipo": "texto", "valores": CLASES_ETIQUETA},
            "acuerdo": {"tipo": "texto"},
        },
        "reglas": [{"regla": "un_solo_valor_por", "clave": "bloque", "valor": "uso"}],
        "fuente_reglas": f"{FUENTE_TABLA}; kit A4.1 (clases; ningún bloque aporta puntos a los dos usos)",
    },
    "cultivos_parcelas.csv": {
        "pieza": "A4.2", "tipo": "csv",
        "columnas": {
            "id": _con(ID, unico=True),
            "cultivo_actual": {"tipo": "texto", "valores": sorted(CULTIVOS)},
            "prob_max": FRACCION,
            "acuerdo_metodos": {"tipo": "k_de_n"},
            "abstencion": {"tipo": "bool"},
        },
        "reglas": [{"regla": "abstencion_a42"}],
        "alimenta": "parcelas.geojson: cultivo_actual, prob_max, acuerdo_metodos, abstencion",
        "fuente_reglas": (f"{FUENTE_TABLA}; {FUENTE_KENS} (prob_max entre 0 y 1); kit §2.2 y A4.2 "
                          "(abstención si prob_max < umbral, si los métodos no coinciden o si "
                          "ftw_confianza < umbral; la abstenida es «sin_clasificar»)"),
    },
    "tabla_metodos.csv": {
        "pieza": "A4.2", "tipo": "csv",
        "columnas": {
            "enfoque": {"tipo": "texto", "unico": True},
            "f1_macro": FRACCION,
            "f1_por_clase": {"tipo": "texto"},
            "tiempo": {"tipo": "texto"},
        },
        "fuente_reglas": f"{FUENTE_TABLA}; F1 entre 0 y 1 por definición",
    },
    "olofsson.csv": {
        "pieza": "A4.3", "tipo": "csv", "columnas": {},
        "fuente_reglas": f"{FUENTE_TABLA} (según el prompt A4.3; columnas libres)",
    },
    # ---- A5 (demanda) ----------------------------------------------------------------
    "demanda_parcelas.csv": {
        "pieza": "A5", "tipo": "csv",
        "columnas": {
            "id": ID,
            "opcion": {"tipo": "texto"},
            "lluvia_pct": {"tipo": "numero", "valores": "@lluvia_pct"},
            "bruta_mm_p10": NO_NEGATIVO,
            "bruta_mm_p50": NO_NEGATIVO,
            "bruta_mm_p90": NO_NEGATIVO,
            "neta_mm_p50": {"tipo": "numero"},
            "etc_mm_p50": NO_NEGATIVO,
        },
        "llave": ("id", "opcion", "lluvia_pct"),
        "reglas": [{"regla": "orden", "columnas": ["bruta_mm_p10", "bruta_mm_p50", "bruta_mm_p90"]}],
        "alimenta": "cubo.json: opciones[].agua.lamina_bruta (y La gota)",
        "fuente_reglas": f"{FUENTE_TABLA}; {FUENTE_KENS} (P10 ≤ P50 ≤ P90); kit A5 (lluvia 0 y −20)",
    },
    "etc_mensual.csv": {
        "pieza": "A5", "tipo": "csv",
        "columnas": {
            "id": ID,
            "opcion": {"tipo": "texto"},
            "mes": {"tipo": "mes_o_numero"},
            "etc_mm_p50": NO_NEGATIVO,
        },
        "llave": ("id", "opcion", "mes"),
        "fuente_reglas": f"{FUENTE_TABLA}; ETc ≥ 0 por definición",
    },
    # ---- A6, A7 y A8 (pruebas) -------------------------------------------------------
    "h3_series.csv": {
        "pieza": "A7", "tipo": "csv",
        "columnas": {
            "anio_agricola": {"tipo": "entero", "max": "@anio_actual"},
            "grupo": {"tipo": "texto"},
            "umbral_ndvi": {"tipo": "numero", "valores": "@umbrales_ndvi"},
            "n_parcelas": {"tipo": "entero", "min": 0},
            "proporcion_con_cultivo_verano": _con(FRACCION, nulo=True),
        },
        "llave": ("anio_agricola", "grupo", "umbral_ndvi"),
        "fuente_reglas": f"{FUENTE_TABLA}; kit A7 (umbral de mes verde y su sensibilidad, de params)",
    },
    "et_contraste.csv": {
        "pieza": "A8", "tipo": "csv",
        "columnas": {
            "mes": {"tipo": "mes_o_numero", "unico": True},
            "et_modelo_mm": _con(NO_NEGATIVO, nulo=True),
            "et_ssebop_mm": _con(NO_NEGATIVO, nulo=True),
            "et_wapor_mm": _con(NO_NEGATIVO, nulo=True),
        },
        "fuente_reglas": f"{FUENTE_TABLA}; kit A8 (WaPOR puede faltar); ET ≥ 0 por definición",
    },
    "historial_superficie.csv": {
        "pieza": "B2", "tipo": "csv", "columnas": {},
        "fuente_reglas": f"{FUENTE_TABLA} (solo si sobra tiempo; columnas libres)",
    },
    "calibracion.csv": {
        "pieza": "B2-cal", "tipo": "csv", "columnas": {},
        "fuente_reglas": f"{FUENTE_TABLA} (solo si el preregistro la declara; columnas libres)",
    },
    # ---- A9 (relieve) ----------------------------------------------------------------
    "nasadem_zona_piloto.tif": {
        "pieza": "A9", "tipo": "geotiff",
        "fuente_reglas": (f"{FUENTE_ACUERDO}: TIFF con GeoKeyDirectoryTag, EPSG:4326, escala y punto "
                          "de amarre de ~30 m (≈ 1″) y extensión que cubre zona_piloto.bbox; kit A9 paso 1"),
    },
    "relieve_parcelas.csv": {
        "pieza": "A9", "tipo": "csv",
        "columnas": {
            "id": _con(ID, unico=True),
            "pendiente_media_pct": {"tipo": "numero", "min": 0, "max": 100},
            "aportacion_externa_ha": NO_NEGATIVO,
            "frac_depresion": FRACCION,
        },
        "alimenta": "capa «Terrain & runoff» y renglón Suelo de la ficha",
        "fuente_reglas": f"{FUENTE_ACUERDO}; kit A9 paso 5 (fuente_dem opcional, paso 6)",
    },
    "relieve_rutas.geojson": {
        "pieza": "A9", "tipo": "geojson",
        "geometrias": ("LineString", "MultiLineString"),
        "propiedades": {},
        "tamano_max_bytes": TAMANO_MAX_RUTAS_BYTES,
        "alimenta": "capa «Terrain & runoff» y botón «Simulate a storm»",
        "fuente_reglas": f"{FUENTE_ACUERDO}; kit A9 paso 3 (< 1 MB)",
    },
    # ---- B2 y B3 (P5) ----------------------------------------------------------------
    "dotaciones.json": {
        "pieza": "B2", "tipo": "json", "regla": "dotaciones",
        "alimenta": "cubo.json: dotaciones y distrito; data/params.json",
        "fuente_reglas": (f"{FUENTE_TABLA}; kit §2.3 y B2; {FUENTE_KENS} (dotaciones dentro del "
                          "deslizador de data/params.json)"),
    },
    "rotaciones.json": {
        "pieza": "B3", "tipo": "json", "regla": "rotaciones",
        "alimenta": "cubo.json: opciones[] (secuencia y filtros)",
        "fuente_reglas": f"{FUENTE_TABLA}; kit B3 paso 1 (cada opción con secuencia y fuente)",
    },
    "supuestos.json": {
        "pieza": "B3", "tipo": "json", "regla": "supuestos",
        "alimenta": "data/params.json: plazos, eficiencias y relación cobertura–Kc del nogal",
        "fuente_reglas": f"{FUENTE_TABLA}; kit B3 paso 4 (valor o rango, fuente o «assumption»)",
    },
    "cifras.csv": {
        "pieza": "P5", "tipo": "csv",
        "columnas": {
            "clave": {"tipo": "texto", "unico": True},
            "valor": {"tipo": "texto"},
            "unidad": {"tipo": "texto", "nulo": True},
            "fuente": {"tipo": "texto"},
            "fecha": {"tipo": "fecha", "nulo": True},
            "etiqueta": {"tipo": "texto"},
        },
        "alimenta": "web/data/manifest.json: cifras",
        "fuente_reglas": f"{FUENTE_TABLA} (clave, valor, unidad, fuente, fecha, etiqueta)",
    },
    # ---- Textos (P6) y resultados ----------------------------------------------------
    "resultado_H1.md": {"pieza": "A6", "tipo": "texto", "fuente_reglas": FUENTE_TABLA},
    "resultado_H3.md": {"pieza": "A7", "tipo": "texto", "fuente_reglas": FUENTE_TABLA},
    "textos_ui.md": {"pieza": "P6", "tipo": "texto", "fuente_reglas": FUENTE_TABLA},
    "whatsapp_plantilla.md": {"pieza": "P6", "tipo": "texto", "fuente_reglas": FUENTE_TABLA},
    "plantillas_explicaciones.md": {
        "pieza": "P6", "tipo": "texto", "sin_cifras": True,
        "fuente_reglas": f"{FUENTE_TABLA} (5 preguntas con marcadores {{{{f1}}}}, sin números)",
    },
}

# ---------------------------------------------------------------------------------------
# Esquemas por patrón (se prueban en orden si el nombre no está en ESQUEMAS)
# ---------------------------------------------------------------------------------------
PATRONES = [
    ("fuentes_*.csv", {
        "pieza": "fuentes", "tipo": "csv",
        "columnas": {
            "archivo": {"tipo": "texto"},
            "url_o_api": {"tipo": "texto"},
            "fecha_consulta": {"tipo": "fecha"},
            "sha256": {"tipo": "sha256"},
        },
        "es_fuentes_de_origen": True,
        "fuente_reglas": f"{FUENTE_TABLA} (todas las piezas con datos de origen); kit K-ENS paso 6(a)",
    }),
    ("*.png", {
        "pieza": "figura", "tipo": "png",
        "fuente_reglas": f"{FUENTE_TABLA} (figuras PNG de A4.3, A5, A6, A7 y A8)",
    }),
]
