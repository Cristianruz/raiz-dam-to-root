# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Esquemas del buzón de entregas: SOLO DATOS (la lógica vive en motor/ensamblar.py).

Fuentes de lo que aquí se exige:
- kit v4, tabla 0.4-B (columnas obligatorias de cada entrega) y K-ENS paso 2
  (columnas y tipos; ids existentes en parcelas_base; P10 ≤ P50 ≤ P90; NDVI entre −1 y 1;
  prob_max entre 0 y 1; estados de la memoria en su lista; dotaciones dentro del deslizador);
- el contrato v4 (kit §2.2–2.5) para las listas de valores, que se importan de
  validar_contrato.py para no tenerlas dos veces;
- el acuerdo vigente con la sesión que corre Earth Engine y Colab (14-nov-2026): carpeta
  de Drive Raiz_entregas (antes Raiz/entregas/; plana o con <rol>/), una línea por archivo en
  LEEME.md con «archivo | fuente | fecha | script» y los rangos de cada archivo (ver «fuente_reglas»);
- el acuerdo de formatos entre la sesión de datos y el integrador (14-nov-2026, FUENTE_FORMATOS):
  rotaciones.json y demanda_cultivos.csv (A5), memoria_parcelas.csv y memoria_resumen.csv (A3-M),
  cultivos_parcelas.csv (A4) y relieve_meta.json (A9) reemplazan o amplían sus filas de la
  tabla 0.4-B; los crudos de Earth Engine (CRUDOS_EARTH_ENGINE) no son entregas;
- la decisión de dos zonas piloto (docs/decisiones/2026-11-14_dos_zonas.md, FUENTE_DOS_ZONAS):
  propiedad «zona» en parcelas_base.geojson y relieve_rutas.geojson, ids con el prefijo de su
  zona y archivos por zona con sufijo «_<zona>» (ARCHIVOS_POR_ZONA). Sin «zona» o sin sufijo =
  ZONA_POR_OMISION (compatibilidad con la entrega de una sola zona);
- la decisión de usar las bases de datos del reto (docs/decisiones/2026-11-14_recursos_del_reto.md,
  FUENTE_RECURSOS): contexto_regional.csv (A10), gedi_parcelas.csv (A11), ecostress_parcelas.csv
  (A12) y gaez_zona.csv (A13), cada uno UN archivo para las dos zonas (no van en ARCHIVOS_POR_ZONA).
  No cambian el cálculo del agua: alimentan web/data/contexto.json (motor/contexto_web.py).
- la decisión de opciones y filtros oficiales (docs/decisiones/2026-11-14_opciones_b3.md, FUENTE_B3):
  opciones_b3.json (B3), un solo archivo para las dos zonas. Se valida su estructura (regla de JSON
  «opciones_b3»); que cada opción tenga lámina en rotaciones.json de cada zona lo comprueba el motor
  (motor/b4_cubo.py omite con aviso la que no la tenga).
- la decisión de perfil de suelo y aptitud (docs/decisiones/2026-11-14_suelo_aptitud.md, FUENTE_SUELO):
  suelo_parcelas.csv (A14) y suelo_requisitos.json (A15), cada uno UN archivo para las dos zonas (no
  van en ARCHIVOS_POR_ZONA). No cambian el cálculo del agua: alimentan web/data/suelo.json
  (motor/suelo_web.py).

Vocabulario de un campo (columna de CSV, propiedad de GeoJSON o llave de un objeto JSON):
  tipo      texto | numero | entero | fecha (AAAA-MM-DD) | mes (AAAA-MM) |
            mes_o_numero (AAAA-MM o 1–12) | bool | k_de_n ("2/2") | sha256 (64 hex);
            solo en objetos JSON, además: objeto (con «campos», «orden» y «llaves_exactas»)
            y lista (con «elemento» y «vacia»: True si puede venir vacía)
  min, max  cota inclusiva. Un número escrito aquí es una cota de definición
            (NDVI ∈ [−1, 1], fracción ∈ [0, 1], 12 meses) o una cota del kit o del acuerdo,
            citada en «fuente_reglas». Un texto «@nombre» es un límite derivado de
            data/params.json (ver LIMITES_DERIVADOS); si params no lo trae, la comprobación
            se omite y se avisa (nunca se inventa el valor).
  mayor_que cota inferior EXCLUSIVA (p. ej., un área > 0).
  alias     {texto entregado: texto que se valida}: equivalencias acordadas (p. ej.,
            «1/1 (reglas)» se lee como «1/1»); el reporte avisa cuántas celdas se leyeron así.
  nulo      True: la celda puede venir vacía (o null en JSON).
  opcional  True (solo propiedades de GeoJSON): la propiedad puede faltar del todo; si viene,
            se valida como las demás (p. ej., «zona»: si viene, debe ser un id de zona).
  nulo_si   {"columna": c, "valores": [...]} (solo CSV): la celda puede venir vacía SOLO si la
            columna c de la misma fila trae uno de esos valores (p. ej., prob_max vacío solo
            con acuerdo_metodos «1/1»). Una celda mal escrita sigue siendo error, no «vacía».
  faltante  valor centinela que cuenta como faltante (−999 de NASA POWER).
  valores   lista cerrada de valores permitidos.
  unico     True: no se repite en el archivo.
  id_parcela True: debe existir en parcelas_base.geojson (si aún no llega, el archivo
            queda «retenido», no rechazado).

Reglas de tabla («reglas»): orden (c1 ≤ c2 ≤ …), rango_por_banda, dias_ventana_por_anio,
abstencion_a42, un_solo_valor_por, faltantes_max y, para las bases de datos del reto,
combinacion_permitida (la combinación de varias columnas es una fila de una tabla cerrada),
rango_segun (cota de una columna según el valor de otra: el valor según su unidad),
valores_segun (lista cerrada de una columna según el valor de otra: la zona según la fuente) y
vacias_segun (columnas que van vacías cuando otra vale cierto valor y, con «llenas_si_no»,
llenas en cualquier otro caso). ensamblar.py las aplica por nombre.
Para el suelo (FUENTE_SUELO): suma_cercana (varias columnas suman un total ± una tolerancia: arena, limo
y arcilla) y forma_texto (un texto con la forma de una expresión regular: la capa «a-b»).
Reglas de JSON («regla»): heladas, dotaciones, supuestos, rotaciones y objeto (valida «campos»).
Regla de JSON «suelo_requisitos» (FUENTE_SUELO): fuente del archivo; «cultivos» con llaves de su lista y,
por cultivo, ph, textura y salinidad_umbral_ds_m (cada uno null o con su fuente) y nutrientes[]; rangos de
pH dentro de la escala y el óptimo dentro del tolerado; texturas de la lista de clases y sin repetir.
Regla de JSON «opciones_b3» (FUENTE_B3): opciones con letra_maestro, secuencia (ciclo y siembra MM-DD),
indicadores booleanos o null y advertir_si_rojo; por_cultivo_actual que solo nombra opciones definidas;
filtros con tipo de su lista, aplica_a, texto_en y fuente. Las listas cerradas viven en su esquema.
Sus textos para la ficha (nombre_en, por_que_en, texto_en, etiqueta) se rechazan si traen el lenguaje de la
regla 10 de CLAUDE.md (la lista de motor/verificador.py), y nombre_en, además, si trae cifras o corchetes.
Llave de GeoJSON «por_zona» (parcelas_base): si una parcela trae «zona», su id empieza con el
prefijo_id de esa zona y su centroide cae en el rectángulo (bbox) de esa zona.
"""
import sys
from pathlib import Path

_RAIZ = Path(__file__).resolve().parent.parent
if str(_RAIZ) not in sys.path:
    sys.path.insert(0, str(_RAIZ))

# Listas del contrato v4 (kit §2.2 y §2.3): una sola fuente, el validador del contrato.
from validar_contrato import CULTIVOS, ESTADOS_MEMORIA, ESTADOS_PLAZO, LLUVIAS, MARCAS  # noqa: E402

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

# Exportaciones crudas de Earth Engine que la sesión de datos deja en la misma carpeta de Drive
# (FUENTE_FORMATOS). NO son entregas: A3 las procesa y entrega sus CSV. El ensamblador las lista
# aparte («crudos»): no las valida, no las copia y no les pide línea en LEEME.md. Patrones de
# fnmatch sobre el nombre en minúsculas. nasadem_zona_piloto.tif SÍ es entrega (A9) y se valida.
CRUDOS_EARTH_ENGINE = ("hls_mensual_*.tif", "hls_reflect_*.tif", "hls_ndvi_memoria_*.tif",
                       "piloto_consumo.tif",
                       # Intermedios de las bases de datos del reto (decisión de recursos del reto,
                       # «Otras precisiones»): de ellos salen contexto_regional.csv y gedi_parcelas.csv.
                       "ctx_*.csv", "gedi_disparos_*.csv")

# ---------------------------------------------------------------------------------------
# Dos zonas piloto (FUENTE_DOS_ZONAS). Las zonas (id, nombre, prefijo_id, bbox) viven en
# data/params.json → zona_piloto.zonas: aquí solo las convenciones de nombres.
# ---------------------------------------------------------------------------------------
# Zona de los archivos SIN sufijo y de las parcelas o rutas SIN propiedad «zona» (la entrega
# de una sola zona sigue validando). Sus archivos van sin sufijo: «_delicias_saucillo» se rechaza
# para que no haya dos archivos de la misma zona con nombres distintos.
ZONA_POR_OMISION = "delicias_saucillo"
# Archivos que van uno por zona: «<base>_<zona>.<ext>» (p. ej., rotaciones_lazaro_cardenas.json).
# Se validan con el esquema de su base y se copian a data/processed con su nombre tal cual.
ARCHIVOS_POR_ZONA = ("eto_diaria.csv", "imerg_diaria.csv", "rotaciones.json", "demanda_cultivos.csv",
                     "relieve_meta.json", "nasadem_zona_piloto.tif")

# ---------------------------------------------------------------------------------------
# Límites derivados de data/params.json. ensamblar.limites_derivados() los calcula.
# ---------------------------------------------------------------------------------------
LIMITES_DERIVADOS = {
    "area_min_ha": "mapa.area_min_ha.valor (kit B1 paso 3: se filtran los campos menores)",
    "bbox": ("zona_piloto.bbox.valor ([oeste, sur, este, norte], EPSG:4326; envolvente de las "
             "zonas: solo se usa si params no trae zona_piloto.zonas)"),
    "zonas": ("zona_piloto.zonas.valor: id, nombre, prefijo_id y bbox [oeste, sur, este, norte] "
              "de cada zona (decisión de dos zonas)"),
    "zonas_ids": "los id de zona_piloto.zonas.valor (valores permitidos de la propiedad «zona»)",
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

# acuerdo_metodos (kit §2.2: "2/2" y "1/2" = reglas + Random Forest) más la extensión del
# contrato del integrador (validar_contrato.py, 14-nov): "1/1" = solo reglas fenológicas
# mientras el Random Forest (A4.2) no está; solo entonces prob_max puede venir vacío.
# validar_contrato.py la tiene escrita en línea (no exporta constante): una prueba compara ambas.
ACUERDO_SOLO_REGLAS = "1/1"
ACUERDOS_METODOS = ("2/2", "1/2", ACUERDO_SOLO_REGLAS)
# Texto que entrega hoy A4 (solo reglas; el Random Forest está pendiente): se lee como «1/1».
ALIAS_ACUERDO = {"1/1 (reglas)": ACUERDO_SOLO_REGLAS}

# Plazo de compromiso de cada rotación de rotaciones.json (A5): las tres llaves con que
# data/params.json y motor/b4_cubo.py buscan el plazo (alfalfa 3–4 años, nogal, anual).
PLAZOS_ROTACION = ("alfalfa", "nogal", "anual")

FUENTE_TABLA = "kit v4, tabla 0.4-B"
FUENTE_KENS = "kit v4, K-ENS paso 2"
FUENTE_ACUERDO = "acuerdo con la sesión de Earth Engine y Colab (14-nov-2026)"
FUENTE_FORMATOS = ("acuerdo de formatos entre la sesión de datos y el integrador (14-nov-2026; "
                   "reemplaza o amplía la fila de la tabla 0.4-B)")
FUENTE_DOS_ZONAS = "decisión de dos zonas piloto (docs/decisiones/2026-11-14_dos_zonas.md)"

FUENTE_RECURSOS = ("decisión de usar las bases de datos del reto "
                   "(docs/decisiones/2026-11-14_recursos_del_reto.md, «Contrato de las entregas nuevas»)")

# opciones_b3.json (B3): listas cerradas del contrato de la decisión, tal cual.
FUENTE_B3 = ("decisión de opciones y filtros oficiales "
             "(docs/decisiones/2026-11-14_opciones_b3.md, «Contrato de opciones_b3.json»)")
LETRAS_MAESTRO = ("ACTUAL", "A", "B", "C", "D", "E", "nogal_no_rota", "no_sembrar")
CICLOS_SIEMBRA = ("OI", "PV", "perenne")  # «perenne»: cultivo que no se siembra por ciclo (nogal)
TIPOS_FILTRO = ("helada", "sucesion", "fecha_limite", "residuo_herbicida", "salinidad", "intervalo",
                "dotacion_minima")  # la página lo evalúa en vivo contra la dotación del deslizador
INDICADORES_OPCION = ("leguminosa", "ruptura_plagas", "raiz_profunda")
# Llave de «regla» con el umbral del filtro de helada (la misma que lee motor/b4_cubo.py: una prueba
# compara ambas). Es opcional: la decisión pide NO inventar umbral; sin ella la ficha no decide.
UMBRAL_HELADA = "prob_helada_max"
# Contrato del cubo (kit §2.3): mínimo ACTUAL + 2 alternativas. Con menos, el archivo entra y se avisa.
ALTERNATIVAS_MINIMAS = 2

# contexto_regional.csv: las 12 filas (fuente, variable, unidad) de la tabla de FUENTE_RECURSOS,
# tal cual. Una fila del archivo con otra combinación se rechaza (regla combinacion_permitida).
COMBINACIONES_CONTEXTO = (
    ("smap", "humedad_superficial", "m3/m3"),
    ("smap", "humedad_raiz", "m3/m3"),
    ("modis", "ndvi", "adimensional"),
    ("modis", "et", "mm/mes"),
    ("modis", "temp_superficie_dia", "°C"),
    ("grace", "agua_almacenada_anomalia", "cm"),
    ("gldas", "et", "mm/mes"),
    ("gldas", "humedad_raiz", "kg/m2"),
    ("nldas", "lluvia", "mm/mes"),
    ("nldas", "evaporacion_potencial", "mm/mes"),
    ("era5_land", "tmin_media", "°C"),
    ("era5_land", "dias_helada", "dias"),
)
# Nota de GRACE de FUENTE_RECURSOS (acordada con la sesión de datos): el límite entre dos celdas de
# GRACE pasa por la zona, así que GRACE llega como UNA sola serie, con «zona» = «cuenca» (promedio
# del rectángulo que envuelve las dos zonas). Ninguna otra fuente usa «cuenca».
ZONA_CUENCA = "cuenca"
FUENTE_DE_CUENCA = "grace"
# Listas cerradas de cada columna, derivadas de la tabla (sin repetir y en su orden).
FUENTES_CONTEXTO = tuple(dict.fromkeys(f for f, _, _ in COMBINACIONES_CONTEXTO))
VARIABLES_CONTEXTO = tuple(dict.fromkeys(v for _, v, _ in COMBINACIONES_CONTEXTO))
UNIDADES_CONTEXTO = tuple(dict.fromkeys(u for _, _, u in COMBINACIONES_CONTEXTO))
# Límites físicos POR DEFINICIÓN del valor según su unidad o su variable (no son cotas de datos):
# una fracción de volumen está en [0, 1]; el NDVI, como toda diferencia normalizada, en [−1, 1];
# una lámina (mm/mes) y una masa por área (kg/m2) no son negativas; un mes tiene a lo más 31 días.
# °C y cm (anomalía, puede ser negativa) no llevan límite: no se inventa ninguno.
DIAS_MAX_DE_UN_MES = 31
LIMITES_CONTEXTO = (
    {"segun": "unidad", "valores": ("m3/m3",), "min": 0, "max": 1},
    {"segun": "variable", "valores": ("ndvi",), "min": -1, "max": 1},
    {"segun": "unidad", "valores": ("mm/mes", "kg/m2"), "min": 0},
    {"segun": "unidad", "valores": ("dias",), "min": 0, "max": DIAS_MAX_DE_UN_MES},
)
# gaez_zona.csv: clases de cultivo del proyecto (contrato v4, kit §2.2) que SÍ son un cultivo:
# «sin_clasificar» (abstención) y «barbecho» (sin cultivo) no tienen aptitud agroclimática.
CULTIVOS_GAEZ = tuple(sorted(CULTIVOS - {"sin_clasificar", "barbecho"}))

# Perfil de suelo y aptitud: suelo_parcelas.csv (A14) y suelo_requisitos.json (A15).
FUENTE_SUELO = ("decisión de perfil de suelo y aptitud de cada cultivo "
                "(docs/decisiones/2026-11-14_suelo_aptitud.md, «Entregas nuevas»)")
# Las 12 clases de textura USDA de la decisión, tal cual y en su orden (una prueba las compara con el
# documento). Lista cerrada de clase_textura y de textura.apta, textura.limitante y condicion.textura_en.
CLASES_TEXTURA = ("sand", "loamy sand", "sandy loam", "loam", "silt loam", "silt", "sandy clay loam",
                  "clay loam", "silty clay loam", "sandy clay", "silty clay", "clay")
# «suman 100 ± 2» (FUENTE_SUELO): arena, limo y arcilla son porcentajes de la misma capa.
SUMA_TEXTURA_PCT = 100
TOLERANCIA_SUMA_TEXTURA_PCT = 2
# Límites POR DEFINICIÓN (no son cotas de datos): un porcentaje está en [0, 100] y la escala de pH va
# de 0 a 14.
PORCENTAJE = {"tipo": "numero", "min": 0, "max": 100}
PH_MIN, PH_MAX = 0, 14
# profundidad_cm: la capa promediada como «a-b» en centímetros (FUENTE_SUELO: «p. ej. 0-30»): dos enteros
# separados por un guion; una capa tiene espesor, así que a < b.
FORMA_PROFUNDIDAD = r"^(\d+)-(\d+)$"
# Cultivos que pueden llevar requisitos de suelo (llaves de «cultivos» en suelo_requisitos.json): las
# clases del proyecto que SÍ son un cultivo (CULTIVOS_GAEZ) más los nombres con que las secuencias del cubo
# nombren un cultivo sin ser clase del contrato (CULTIVOS_DE_SECUENCIAS). Revisado web/data/cubo.json
# (opciones[].secuencia) el 14-nov-2026: alfalfa, algodon, cereal_invierno, maiz_forrajero, nogal y sorgo,
# todas clases del contrato (la avena de la opción «avena_maiz» va como «cereal_invierno»), así que hoy
# no hay ninguno que agregar. Una prueba (tests/test_esquemas_suelo.py) compara esta lista con el cubo.
CULTIVOS_DE_SECUENCIAS = ()
CULTIVOS_SUELO = tuple(sorted({*CULTIVOS_GAEZ, *CULTIVOS_DE_SECUENCIAS}))
# Cómo nombra el cubo la opción que no siembra (motor/b4_cubo.py): no es un cultivo y no lleva requisitos.
NO_SIEMBRA = "descanso"
# Bloques de requisitos de un cultivo (cada uno null o con su fuente) y llaves de «condicion» de un aviso
# de nutrientes (FUENTE_SUELO, «suelo_requisitos.json»). «textura_en» no está escrita en el ejemplo de la
# decisión (que solo muestra ph_mayor_que): la pide la tarea del módulo junto con ph_menor_que.
BLOQUES_REQUISITO = ("ph", "textura", "salinidad_umbral_ds_m")
CONDICIONES_NUTRIENTE = ("ph_mayor_que", "ph_menor_que", "textura_en")
# Llave OPCIONAL de suelo_requisitos.json con los cortes para decir si un pH es ácido, neutro o alcalino
# ({acido_menor_que, alcalino_mayor_que, fuente}). No está en el contrato de la decisión: sin ella la
# ficha escribe solo el número (ningún corte se escribe a mano en la web).
ESCALA_PH = "escala_ph"
# Llave OPCIONAL de suelo_requisitos.json con el reparto de las clases de textura en los grupos de ECOCROP
# ({valor: {light: [...], medium: [...], heavy: [...]}, etiqueta, fuente}); la ficha muestra la textura por su
# grupo y la clase exacta en el detalle (decisión del integrador con la sesión de datos, 14-nov).
GRUPOS_TEXTURA = "grupos_textura"

ID = {"tipo": "texto", "id_parcela": True}
INDICE = {"tipo": "numero", "min": -1, "max": 1}     # NDVI y demás diferencias normalizadas
FRACCION = {"tipo": "numero", "min": 0, "max": 1}
MESES_ANIO = {"tipo": "entero", "min": 0, "max": 12}
NO_NEGATIVO = {"tipo": "numero", "min": 0}
# Propiedad «zona» (FUENTE_DOS_ZONAS): opcional; si viene, un id de zona_piloto.zonas.
ZONA = {"tipo": "texto", "opcional": True, "valores": "@zonas_ids"}


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
            "zona": ZONA,
        },
        "es_referencia_ids": True,
        "protagonistas_esperadas": PROTAGONISTAS_ESPERADAS,
        "avisar_fuera_de_bbox": True,
        # Con «zona»: id con el prefijo de la zona y centroide dentro de su rectángulo.
        "por_zona": True,
        "alimenta": "parcelas.geojson: geometría, id, area_ha, modulo, ftw_confianza, protagonista, zona",
        "fuente_reglas": (f"{FUENTE_TABLA}; kit §2.2; {FUENTE_ACUERDO}; {FUENTE_DOS_ZONAS}: un solo "
                          "archivo con las dos zonas, «zona» opcional (sin ella = zona por omisión), "
                          "ids únicos entre zonas y, con «zona», con el prefijo de la zona y el "
                          "centroide en su rectángulo"),
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
    "imerg_diaria.csv": {
        "pieza": "A9", "tipo": "csv",
        "columnas": {
            "fecha": {"tipo": "fecha", "unico": True},
            "lluvia_mm": {"tipo": "numero", "min": 0, "nulo": True},
        },
        "reglas": [],
        "fuente_reglas": ("Pedido a la sesión de datos (14-nov): lluvia diaria de NASA GPM IMERG V07 promediada "
                          "sobre la zona; lluvia ≥ 0 por definición; un archivo por zona con sufijo «_<zona>»"),
    },
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
            "dias_suelo_desnudo_feb_abr": {"tipo": "entero", "min": 0, "nulo": True},
            "meses_validos": MESES_ANIO,
        },
        "llave": ("id", "anio_agricola"),
        "reglas": [
            {"regla": "orden", "columnas": ["meses_verdes", "meses_validos"]},
            {"regla": "dias_ventana_por_anio", "columna": "dias_suelo_desnudo_feb_abr",
             "anio": "anio_agricola"},
        ],
        "alimenta": "parcelas.geojson: memoria",
        "fuente_reglas": (f"{FUENTE_TABLA}; {FUENTE_KENS} (estados de la memoria en su lista); kit A3-M; "
                          "días de suelo desnudo enteros como en suelo_desnudo.csv (kit §2.2); "
                          f"{FUENTE_FORMATOS}: días entre 0 y los de la ventana de cada año (89; 90 en "
                          "año bisiesto, derivados de params)"),
    },
    "memoria_resumen.csv": {
        "pieza": "A3-M", "tipo": "csv",
        "columnas": {
            "id": _con(ID, unico=True),
            "dias_suelo_desnudo_mediana": {"tipo": "entero", "min": 0, "max": "@dias_ventana_max",
                                           "nulo": True},
            "anios_con_dato": {"tipo": "entero", "min": 0},
            "estado_2025": {"tipo": "texto", "valores": sorted(ESTADOS_MEMORIA), "nulo": True},
        },
        # La edad de la perenne ya no viene aquí: la trae cultivos_parcelas.csv (A4).
        "alimenta": "parcelas.geojson: dias_suelo_desnudo_mediana",
        "fuente_reglas": (f"{FUENTE_TABLA}; {FUENTE_KENS}; kit §2.2 (dias_suelo_desnudo_mediana es "
                          "«integer o null»: la mediana de un número par de años debe redondearse "
                          f"en el origen, no aquí); {FUENTE_FORMATOS} (anios_con_dato; la edad pasa "
                          "a cultivos_parcelas.csv)"),
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
            "prob_max": _con(FRACCION, nulo_si={"columna": "acuerdo_metodos",
                                                "valores": (ACUERDO_SOLO_REGLAS,)}),
            "acuerdo_metodos": {"tipo": "k_de_n", "valores": ACUERDOS_METODOS, "alias": ALIAS_ACUERDO},
            "abstencion": {"tipo": "bool"},
            # Columnas que A4 agrega (FUENTE_FORMATOS): la edad de la perenne viene aquí, no en
            # memoria_resumen.csv; estado_plazo con la lista del contrato (kit §2.2).
            "edad_perenne_anios": {"tipo": "entero", "min": 0, "nulo": True},
            "estado_plazo": {"tipo": "texto", "valores": sorted(e for e in ESTADOS_PLAZO if e), "nulo": True},
            "grupo_fenologico": {"tipo": "texto", "nulo": True},
        },
        # Una parcela abstenida no tiene cultivo: tampoco edad ni estado del plazo.
        "reglas": [{"regla": "abstencion_a42", "vacias_si_abstenida": ["edad_perenne_anios", "estado_plazo"]}],
        "alimenta": ("parcelas.geojson: cultivo_actual, prob_max, acuerdo_metodos, abstencion, "
                     "edad_perenne_anios"),
        "fuente_reglas": (f"{FUENTE_TABLA}; {FUENTE_KENS} (prob_max entre 0 y 1); kit §2.2 y A4.2 "
                          "(abstención si prob_max < umbral, si los métodos no coinciden o si "
                          "ftw_confianza < umbral; la abstenida es «sin_clasificar»); extensión del "
                          "contrato en validar_contrato.py (14-nov): acuerdo_metodos «1/1» = solo "
                          f"reglas, y entonces prob_max puede venir vacío; {FUENTE_FORMATOS}: «1/1 (reglas)» "
                          "se lee como «1/1»; edad_perenne_anios, estado_plazo y grupo_fenologico; la "
                          "abstenida lleva edad y estado_plazo vacíos"),
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
        # Sin «alimenta»: el motor B4 toma la lámina de rotaciones.json y demanda_cultivos.csv
        # (FUENTE_FORMATOS). Si llega, se sigue validando con la fila del kit.
        "fuente_reglas": f"{FUENTE_TABLA}; {FUENTE_KENS} (P10 ≤ P50 ≤ P90); kit A5 (lluvia 0 y −20)",
    },
    "demanda_cultivos.csv": {
        "pieza": "A5", "tipo": "csv",
        "columnas": {
            "cultivo": {"tipo": "texto"},
            "lluvia_pct": {"tipo": "numero", "valores": "@lluvia_pct"},
            "etc_mm_p50": NO_NEGATIVO,
            "neta_mm_p50": NO_NEGATIVO,
            "bruta_millares_p10": NO_NEGATIVO,
            "bruta_millares_p50": NO_NEGATIVO,
            "bruta_millares_p90": NO_NEGATIVO,
        },
        "llave": ("cultivo", "lluvia_pct"),
        "reglas": [{"regla": "orden", "columnas": ["bruta_millares_p10", "bruta_millares_p50",
                                                   "bruta_millares_p90"]}],
        "alimenta": "cubo.json: lámina de los cultivos sueltos sin rotación (motor/b4_cubo.py)",
        "fuente_reglas": (f"{FUENTE_FORMATOS}: lámina por cultivo y variante de lluvia (0 y −20, de "
                          f"params); {FUENTE_KENS} (P10 ≤ P50 ≤ P90); láminas y ETc ≥ 0 por definición"),
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
                          "de amarre de ~30 m (≈ 1″) y extensión que cubre la zona; kit A9 paso 1; "
                          f"{FUENTE_DOS_ZONAS}: un archivo por zona (sin sufijo = zona por omisión) "
                          "que cubre el rectángulo de SU zona en zona_piloto.zonas"),
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
        "propiedades": {"zona": ZONA},
        "tamano_max_bytes": TAMANO_MAX_RUTAS_BYTES,
        "alimenta": "capa «Terrain & runoff» y botón «Simulate a storm»",
        "fuente_reglas": (f"{FUENTE_ACUERDO}; kit A9 paso 3 (< 1 MB); {FUENTE_DOS_ZONAS}: un solo "
                          "archivo, «zona» opcional en cada línea (sin ella = zona por omisión)"),
    },
    "relieve_meta.json": {
        "pieza": "A9", "tipo": "json", "regla": "objeto",
        "campos": {
            "rotulo": {"tipo": "texto"},
            "umbral_ruta_ha": {"tipo": "numero", "mayor_que": 0},
            "umbral_ruta_etiqueta": {"tipo": "texto"},
            "celda_ha": {"tipo": "numero", "mayor_que": 0},
            "tormenta": {"tipo": "objeto", "campos": {
                "mm": NO_NEGATIVO,
                "definicion": {"tipo": "texto"},
                "fuente": {"tipo": "texto"},
                "periodo": {"tipo": "texto"},
            }},
        },
        "alimenta": "capa «Terrain & runoff» y botón «Simulate a storm» (rótulo, umbral de ruta y tormenta)",
        "fuente_reglas": (f"{FUENTE_FORMATOS}: rótulo, umbral de ruta con su etiqueta, celda y tormenta "
                          "con definición, fuente y periodo; áreas > 0 y lluvia ≥ 0 por definición"),
    },
    # ---- B2 y B3 (P5) ----------------------------------------------------------------
    "dotaciones.json": {
        "pieza": "B2", "tipo": "json", "regla": "dotaciones",
        "alimenta": "cubo.json: dotaciones y distrito; data/params.json",
        "fuente_reglas": (f"{FUENTE_TABLA}; kit §2.3 y B2; {FUENTE_KENS} (dotaciones dentro del "
                          "deslizador de data/params.json)"),
    },
    "rotaciones.json": {
        # Formato acordado (FUENTE_FORMATOS); sustituye a la lista «opciones» del kit B3.
        "pieza": "A5", "tipo": "json", "regla": "rotaciones",
        # Llaves de primer nivel y su tipo.
        "llaves": {"params": "objeto", "cultivos": "objeto", "rotaciones": "lista", "anios_clima": "lista"},
        # Cada entrada de «params» trae al menos estas llaves.
        "llaves_param": ("valor", "etiqueta"),
        # Campos de cada rotación (mismo vocabulario de campo; «unico» se cuenta en la lista).
        "rotacion": {
            "id": {"tipo": "texto", "unico": True},
            "nombre": {"tipo": "texto"},
            # Ids de «cultivos» del mismo archivo; vacía = descanso (sin cultivo).
            "cultivos": {"tipo": "lista", "elemento": {"tipo": "texto"}, "vacia": True},
            "plazo": {"tipo": "texto", "valores": PLAZOS_ROTACION},
            "plazo_anios": {"tipo": "objeto", "orden": ("min", "max"),
                            "campos": {"min": NO_NEGATIVO, "max": NO_NEGATIVO}},
            # Llaves exactamente "0" y "-20" (variantes de lluvia del contrato, LLUVIAS).
            "lamina_bruta_millares": {"tipo": "objeto", "llaves_exactas": True, "campos": {
                lluvia: {"tipo": "objeto", "orden": ("p10", "p50", "p90"), "campos": {
                    c: NO_NEGATIVO for c in ("p10", "p50", "p90", "neta_mm_p50", "etc_mm_p50")}}
                for lluvia in LLUVIAS}},
        },
        "alimenta": "cubo.json: opciones[] (secuencia, plazo y lámina bruta P10/P50/P90)",
        "fuente_reglas": (f"{FUENTE_FORMATOS}: params (cada uno con valor y etiqueta), cultivos, "
                          "rotaciones y anios_clima; cada rotación con id único, nombre, cultivos, plazo "
                          "(alfalfa, nogal o anual), plazo_anios con min ≤ max y lamina_bruta_millares "
                          f"con llaves «0» y «-20» (contrato); {FUENTE_KENS} (P10 ≤ P50 ≤ P90); "
                          "láminas, años y mm ≥ 0 por definición"),
    },
    "supuestos.json": {
        "pieza": "B3", "tipo": "json", "regla": "supuestos",
        "alimenta": "data/params.json: plazos, eficiencias y relación cobertura–Kc del nogal",
        "fuente_reglas": f"{FUENTE_TABLA}; kit B3 paso 4 (valor o rango, fuente o «assumption»)",
    },
    "opciones_b3.json": {
        "pieza": "B3", "tipo": "json", "regla": "opciones_b3",
        "letras_maestro": LETRAS_MAESTRO,
        "ciclos": CICLOS_SIEMBRA,
        "indicadores": INDICADORES_OPCION,
        "tipos_filtro": TIPOS_FILTRO,
        "umbral_helada": UMBRAL_HELADA,
        "alternativas_minimas": ALTERNATIVAS_MINIMAS,
        # Cultivos actuales que pueden llevar opciones: los del contrato menos la parcela abstenida.
        "cultivos": tuple(sorted(CULTIVOS - {"sin_clasificar"})),
        "alimenta": ("cubo.json: alternativas, nombre, secuencia, indicadores, advertir_si_rojo y filtros "
                     "de cada opción (motor/b4_cubo.py); mientras no llegue, diseño provisional"),
        "fuente_reglas": (f"{FUENTE_B3}: fuente del archivo; opciones por id de rotación, cada una con "
                          "letra_maestro (ACTUAL, A–E, nogal_no_rota o no_sembrar), nombre_en, secuencia "
                          "(ciclo OI o PV, cultivo y siembra desde/hasta en MM-DD o null), indicadores "
                          "(leguminosa, ruptura_plagas y raiz_profunda: true, false o null), advertir_si_rojo, "
                          "fuente y etiqueta; por_cultivo_actual con cultivos del contrato (kit §2.2) que solo "
                          "nombra opciones definidas; filtros con id único, tipo de su lista, aplica_a con "
                          "opciones definidas, texto_en, fuente y etiqueta. Lo que la fuente no diga va en null "
                          "(se avisa); el filtro de helada no lleva umbral inventado: prob_helada_max es "
                          "opcional y, si viene, está entre 0 y 1 (probabilidad). Menos de 2 alternativas por "
                          "cultivo solo se avisa (contrato del cubo, kit §2.3)"),
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
    # ---- A10 a A13 (bases de datos del reto; FUENTE_RECURSOS) --------------------------
    # Un solo archivo para las dos zonas (no van en ARCHIVOS_POR_ZONA). No llevan «alimenta»:
    # no hay versión simulada; si faltan, web/data/contexto.json lleva el bloque en null con su
    # motivo (motor/contexto_web.py) y la página dice «not delivered yet».
    "contexto_regional.csv": {
        "pieza": "A10", "tipo": "csv",
        "columnas": {
            # La lista de «zona» depende de la fuente (regla valores_segun): las zonas de params,
            # o «cuenca» para GRACE.
            "zona": {"tipo": "texto"},
            "fuente": {"tipo": "texto", "valores": FUENTES_CONTEXTO},
            "variable": {"tipo": "texto", "valores": VARIABLES_CONTEXTO},
            "mes": {"tipo": "mes"},
            "valor": {"tipo": "numero", "nulo": True},
            "unidad": {"tipo": "texto", "valores": UNIDADES_CONTEXTO},
            "resolucion_m": {"tipo": "numero", "mayor_que": 0},
            "n_celdas": {"tipo": "entero", "min": 1},
        },
        "llave": ("zona", "fuente", "variable", "mes"),
        "reglas": [
            {"regla": "valores_segun", "columna": "zona", "segun": "fuente",
             "casos": {FUENTE_DE_CUENCA: (ZONA_CUENCA,)}, "resto": "@zonas_ids"},
            {"regla": "combinacion_permitida", "columnas": ["fuente", "variable", "unidad"],
             "permitidas": COMBINACIONES_CONTEXTO,
             "tabla": "docs/decisiones/2026-11-14_recursos_del_reto.md"},
            {"regla": "rango_segun", "columna": "valor", "grupos": LIMITES_CONTEXTO},
        ],
        "fuente_reglas": (f"{FUENTE_RECURSOS}: promedio mensual por zona, fuente y variable; zona de "
                          "zona_piloto.zonas (params), salvo GRACE, que llega como una sola serie con zona "
                          "«cuenca» (nota de GRACE); fuente, variable y unidad en una de las 12 filas de "
                          "su tabla; llave (zona, fuente, variable, mes); valor vacío si no hay dato. "
                          "Límites físicos por definición: m3/m3 entre 0 y 1; NDVI entre −1 y 1; mm/mes y "
                          "kg/m2 ≥ 0; días del mes entre 0 y 31; resolución > 0 y al menos una celda. "
                          "°C y cm (anomalía) sin límite: no se inventa ninguno"),
    },
    "gedi_parcelas.csv": {
        "pieza": "A11", "tipo": "csv",
        "columnas": {
            "id": _con(ID, unico=True),
            "n_disparos": {"tipo": "entero", "min": 0},
            "altura_mediana_m": _con(NO_NEGATIVO, nulo=True),
            "altura_p90_m": _con(NO_NEGATIVO, nulo=True),
        },
        "reglas": [
            # Sin disparos no hay altura (vacía, nunca cero); con disparos, las dos alturas.
            {"regla": "vacias_segun", "columna": "n_disparos", "valor": 0,
             "columnas": ["altura_mediana_m", "altura_p90_m"], "llenas_si_no": True},
            {"regla": "orden", "columnas": ["altura_mediana_m", "altura_p90_m"]},
        ],
        "fuente_reglas": (f"{FUENTE_RECURSOS}: una fila por parcela de parcelas_base.geojson; n_disparos "
                          "entero ≥ 0; alturas (rh98) vacías si n_disparos = 0 y presentes si no; "
                          "alturas ≥ 0 y mediana ≤ percentil 90 por definición"),
    },
    "ecostress_parcelas.csv": {
        "pieza": "A12", "tipo": "csv",
        "columnas": {
            "id": ID,
            "mes": {"tipo": "mes"},
            "et_mm_dia": _con(NO_NEGATIVO, nulo=True),
            "n_escenas": {"tipo": "entero", "min": 0},
        },
        "llave": ("id", "mes"),
        # «vacío si no hubo escena» (FUENTE_RECURSOS): sin escenas no hay ET. Con escenas puede
        # venir vacía (no se exige «llenas_si_no»).
        "reglas": [{"regla": "vacias_segun", "columna": "n_escenas", "valor": 0, "columnas": ["et_mm_dia"]}],
        "fuente_reglas": (f"{FUENTE_RECURSOS}: id de parcelas_base.geojson; mes AAAA-MM; llave (id, mes); "
                          "et_mm_dia vacío si no hubo escena (n_escenas = 0); n_escenas entero ≥ 0; "
                          "ET ≥ 0 por definición"),
    },
    "gaez_zona.csv": {
        "pieza": "A13", "tipo": "csv",
        "columnas": {
            "zona": {"tipo": "texto", "valores": "@zonas_ids"},
            "cultivo": {"tipo": "texto", "valores": CULTIVOS_GAEZ},
            "variable": {"tipo": "texto"},
            "valor": {"tipo": "numero"},
            "unidad": {"tipo": "texto"},
            "resolucion_m": {"tipo": "numero", "mayor_que": 0},
        },
        "fuente_reglas": (f"{FUENTE_RECURSOS}: zona de zona_piloto.zonas (params); cultivo de las clases "
                          "del proyecto (contrato v4, kit §2.2; sin «sin_clasificar» ni «barbecho», que no "
                          "son cultivos); variable y unidad tal como las publica FAO (texto no vacío); "
                          "valor numérico; resolución > 0 por definición"),
    },
    # ---- A14 y A15 (perfil de suelo y aptitud; FUENTE_SUELO) ---------------------------
    # Un solo archivo para las dos zonas (no van en ARCHIVOS_POR_ZONA). Sin «alimenta»: no hay versión
    # simulada; si faltan, web/data/suelo.json lleva el bloque en null con su motivo (motor/suelo_web.py)
    # y la página dice «not delivered yet».
    "suelo_parcelas.csv": {
        "pieza": "A14", "tipo": "csv",
        "columnas": {
            "id": _con(ID, unico=True),
            # Vacías juntas = parcela que el mapa no cubre (regla todas_o_ninguna); nunca a medias.
            "arena_pct": _con(PORCENTAJE, nulo=True),
            "limo_pct": _con(PORCENTAJE, nulo=True),
            "arcilla_pct": _con(PORCENTAJE, nulo=True),
            "clase_textura": {"tipo": "texto", "valores": CLASES_TEXTURA, "nulo": True},
            "ph": {"tipo": "numero", "min": PH_MIN, "max": PH_MAX, "nulo": True},
            "carbono_organico_g_kg": _con(NO_NEGATIVO, nulo=True),
            # «vacío si el producto no lo trae» (nitrógeno y CIC) o «si no hay producto con cobertura».
            "nitrogeno_g_kg": _con(NO_NEGATIVO, nulo=True),
            "cic_cmol_kg": _con(NO_NEGATIVO, nulo=True),
            "salinidad_ce_ds_m": _con(NO_NEGATIVO, nulo=True),
            "profundidad_cm": {"tipo": "texto"},
            # 0 = parcela más chica que una celda: se usó la celda más cercana (distancia_celda_m).
            "n_celdas": {"tipo": "entero", "min": 0},
        },
        "reglas": [
            {"regla": "todas_o_ninguna",
             "columnas": ["arena_pct", "limo_pct", "arcilla_pct", "clase_textura", "ph", "carbono_organico_g_kg"],
             "aviso_ninguna": "parcelas sin dato de suelo (el mapa no las cubre; la ficha dice «no soil data»)"},
            {"regla": "suma_cercana", "columnas": ["arena_pct", "limo_pct", "arcilla_pct"],
             "total": SUMA_TEXTURA_PCT, "tolerancia": TOLERANCIA_SUMA_TEXTURA_PCT},
            {"regla": "forma_texto", "columna": "profundidad_cm", "patron": FORMA_PROFUNDIDAD,
             "forma": "«a-b» en centímetros (por ejemplo 0-30)", "creciente": True},
        ],
        "fuente_reglas": (f"{FUENTE_SUELO}: una fila por parcela de parcelas_base.geojson (id único); arena, "
                          "limo y arcilla en % que suman 100 ± 2; clase_textura de las 12 clases USDA de su "
                          "tabla; nitrógeno, CIC y salinidad vacíos si el producto no los trae; "
                          "profundidad_cm «a-b» (p. ej. 0-30) con a < b; n_celdas ≥ 0 (0 = parcela más chica que una celda, "
                          "con la celda más cercana); fila sin dato solo con todas sus columnas de suelo vacías. Límites "
                          "por definición: porcentajes entre 0 y 100; pH entre 0 y 14 (la escala); carbono, "
                          "nitrógeno, CIC y conductividad eléctrica ≥ 0"),
    },
    "suelo_requisitos.json": {
        "pieza": "A15", "tipo": "json", "regla": "suelo_requisitos",
        "cultivos": CULTIVOS_SUELO,
        "bloques": BLOQUES_REQUISITO,
        "clases_textura": CLASES_TEXTURA,
        "ph_min": PH_MIN, "ph_max": PH_MAX,
        "condiciones": CONDICIONES_NUTRIENTE,
        "escala_ph": ESCALA_PH,
        "grupos_textura": GRUPOS_TEXTURA,
        "fuente_reglas": (f"{FUENTE_SUELO}: fuente del archivo; «cultivos» con llaves de las clases de cultivo "
                          "del proyecto (contrato v4, kit §2.2; sin «sin_clasificar» ni «barbecho», que no son "
                          "cultivos), las mismas con que el cubo nombra los cultivos de cada secuencia; por "
                          "cultivo, ph {optimo, tolerado}, textura {apta, limitante} y salinidad_umbral_ds_m "
                          "{valor}: cada bloque es null («un bloque sin fuente va en null») o trae su fuente; "
                          "optimo y tolerado son pares [min, max] con min ≤ max y el óptimo dentro del "
                          "tolerado; apta y limitante solo con clases USDA de la tabla y sin repetir; "
                          "nutrientes[] con elemento, texto_en y fuente, y condicion opcional (ph_mayor_que, "
                          "ph_menor_que, textura_en); texto_en va tal cual a la ficha, así que se rechaza si trae "
                          "el lenguaje de la regla 10 de CLAUDE.md. Límites por definición: pH entre 0 y 14 (la escala); "
                          "conductividad eléctrica ≥ 0. Llave opcional escala_ph {acido_menor_que, "
                          "alcalino_mayor_que, fuente}: si viene, dentro de la escala y en orden"),
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
