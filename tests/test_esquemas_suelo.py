# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Pruebas del validador del buzón para el perfil de suelo y la aptitud de cada cultivo.

Contrato: docs/decisiones/2026-11-14_suelo_aptitud.md («Entregas nuevas»).
Esquemas: motor/esquemas.py (suelo_parcelas.csv, pieza A14, y suelo_requisitos.json, pieza A15);
reglas nuevas en motor/ensamblar.py (suma_cercana y forma_texto para el CSV; suelo_requisitos para
el JSON).

Por cada archivo: un buzón válido que entra y varios inválidos que se rechazan con un motivo legible
(columna faltante, id que no existe en parcelas_base, fracciones que no suman 100 ± 2, clase de textura
fuera de la lista, pH fuera de la escala, capa mal escrita; cultivo fuera de las clases del proyecto,
bloque sin fuente, óptimo fuera del tolerado, clase repetida en apta y limitante, condición con una
llave desconocida…). Todo se escribe en tmp_path: nunca en data/processed ni en web/data.

TODOS LOS VALORES SON DE PRUEBA (tests/fixtures/suelo/generar.py: no son datos, no tienen fuente y no
se usan en la web). Las listas (clases de textura, cultivos, columnas, suma y tolerancia) se leen de
motor/esquemas.py y se comparan con el documento de la decisión, no se escriben aquí.
"""
import importlib.util
import json
import re
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

DECISION = "docs/decisiones/2026-11-14_suelo_aptitud.md"
PERFIL, REQUISITOS = "suelo_parcelas.csv", "suelo_requisitos.json"
NUEVOS = {PERFIL: ("A14", "csv"), REQUISITOS: ("A15", "json")}
REGLAS_NUEVAS_CSV = {"suma_cercana", "forma_texto", "todas_o_ninguna"}
ZONAS = LIMITES["zonas_ids"]                 # de data/params.json (zona_piloto.zonas)
CUBO_REAL = RAIZ / "web/data/cubo.json"


def _generador():
    """El generador de la fixture (tests/fixtures/suelo/generar.py), cargado por ruta."""
    spec = importlib.util.spec_from_file_location("generar_suelo", RAIZ / "tests/fixtures/suelo/generar.py")
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


GEN = _generador()
COLUMNAS = GEN.ENC_PERFIL.split(",")
# Filas de prueba del perfil como {id: {columna: celda}} (para cambiar una celda en cada caso inválido).
BASE = {f.split(",")[0]: dict(zip(COLUMNAS, f.split(","))) for f in GEN.FILAS_PERFIL}
UNA = next(iter(BASE))                       # la parcela de prueba cuya fila se altera


def perfil_con(pid=UNA, quitar=None, **cambios):
    """El CSV de prueba con las celdas de la parcela `pid` cambiadas (o sin la columna `quitar`)."""
    filas = {i: dict(f) for i, f in BASE.items()}
    filas[pid].update({c: str(v) for c, v in cambios.items()})
    columnas = [c for c in COLUMNAS if c != quitar]
    return "\n".join([",".join(columnas), *(",".join(f[c] for c in columnas) for f in filas.values())]) + "\n"


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


def seccion_de_la_decision(titulo):
    """El texto de la decisión desde el encabezado que nombra `titulo` hasta el siguiente encabezado."""
    texto = (RAIZ / DECISION).read_text(encoding="utf-8")
    inicio = texto.index(f"### `{titulo}`")
    fin = texto.find("\n#", inicio + 1)
    return texto[inicio:fin if fin > 0 else len(texto)]


# ---------------------------------------------------------------------------------------
# Los esquemas: pieza, fuente de las reglas, contrato de la decisión
# ---------------------------------------------------------------------------------------
def test_los_dos_esquemas_con_su_pieza_y_su_fuente():
    for nombre, (pieza, tipo) in NUEVOS.items():
        esq = esquemas.ESQUEMAS[nombre]
        assert esq["pieza"] == pieza and esq["tipo"] == tipo, nombre
        assert DECISION in esq["fuente_reglas"], nombre
        assert "por definición" in esq["fuente_reglas"], f"{nombre}: los límites físicos se declaran «por definición»"
        # Un archivo para las dos zonas: sin sufijo de zona y sin versión simulada.
        assert nombre not in esquemas.ARCHIVOS_POR_ZONA
        assert "alimenta" not in esq and nombre not in ens.esperados_simulados()
    assert esquemas.ESQUEMAS[REQUISITOS]["regla"] in ens.REGLAS_JSON


def test_columnas_exactas_del_contrato():
    """Las columnas del esquema son las de la tabla de la decisión, en su orden."""
    en_la_tabla = []
    for linea in seccion_de_la_decision(PERFIL).splitlines():
        celdas = [c.strip() for c in linea.strip().strip("|").split("|")]
        if len(celdas) == 2 and celdas[0].startswith("`"):
            en_la_tabla += re.findall(r"`([^`]+)`", celdas[0])
    assert en_la_tabla == COLUMNAS, "la fixture usa las columnas de la decisión"
    assert list(esquemas.ESQUEMAS[PERFIL]["columnas"]) == en_la_tabla
    columnas = esquemas.ESQUEMAS[PERFIL]["columnas"]
    assert columnas["id"].get("unico") and columnas["id"].get("id_parcela")
    for opcional in ("nitrogeno_g_kg", "cic_cmol_kg", "salinidad_ce_ds_m"):
        assert columnas[opcional].get("nulo") is True, f"{opcional} puede venir vacío"
    # Las columnas de suelo admiten vacío solo todas juntas (parcela que el mapa no cubre): regla
    # todas_o_ninguna. La capa y las celdas siempre van.
    juntas = ("arena_pct", "limo_pct", "arcilla_pct", "clase_textura", "ph", "carbono_organico_g_kg")
    regla = next(r for r in esquemas.ESQUEMAS[PERFIL]["reglas"] if r["regla"] == "todas_o_ninguna")
    assert tuple(regla["columnas"]) == juntas
    for obligatoria in ("profundidad_cm", "n_celdas"):
        assert not columnas[obligatoria].get("nulo"), obligatoria


def test_clases_de_textura_son_las_de_la_decision():
    """Las 12 clases USDA se leen de la tabla de la decisión, no de memoria."""
    fila = next(l for l in seccion_de_la_decision(PERFIL).splitlines() if l.startswith("| `clase_textura`"))
    clases = tuple(re.findall(r"`([^`]+)`", fila.split("|")[2]))
    assert len(clases) == len(set(clases)) == len(esquemas.CLASES_TEXTURA)
    assert clases == esquemas.CLASES_TEXTURA
    assert tuple(esquemas.ESQUEMAS[PERFIL]["columnas"]["clase_textura"]["valores"]) == clases
    assert tuple(esquemas.ESQUEMAS[REQUISITOS]["clases_textura"]) == clases


def test_suma_y_tolerancia_son_las_de_la_decision():
    m = re.search(r"suman (\d+) ± (\d+)", seccion_de_la_decision(PERFIL))
    regla = next(r for r in esquemas.ESQUEMAS[PERFIL]["reglas"] if r["regla"] == "suma_cercana")
    assert (regla["total"], regla["tolerancia"]) == (int(m.group(1)), int(m.group(2)))
    assert regla["columnas"] == ["arena_pct", "limo_pct", "arcilla_pct"]


def test_bloques_y_llaves_del_json_son_los_de_la_decision():
    """ph, textura, salinidad_umbral_ds_m y nutrientes están en el ejemplo de la decisión con sus llaves."""
    ejemplo = seccion_de_la_decision(REQUISITOS)
    obj = json.loads(ejemplo[ejemplo.index("```json") + len("```json"):ejemplo.index("```", ejemplo.index("```json") + 1)])
    cultivo = next(iter(obj["cultivos"].values()))
    assert set(esquemas.BLOQUES_REQUISITO) | {"nutrientes"} == set(cultivo)
    assert set(cultivo["ph"]) >= {"optimo", "tolerado", "fuente"}
    assert set(cultivo["textura"]) >= {"apta", "limitante", "fuente"}
    assert set(cultivo["salinidad_umbral_ds_m"]) >= {"valor", "fuente"}
    assert set(cultivo["nutrientes"][0]) >= {"elemento", "condicion", "texto_en", "fuente"}
    assert set(cultivo["nutrientes"][0]["condicion"]) <= set(esquemas.CONDICIONES_NUTRIENTE)
    # El ejemplo de la decisión (ceros como marcadores de forma) tiene la forma que pide el validador,
    # salvo su llave de cultivo, que es un marcador.
    obj["cultivos"] = {esquemas.CULTIVOS_SUELO[0]: cultivo}
    res = ens.Resultado()
    ens.regla_suelo_requisitos(obj, ens.Contexto(LIMITES), res, esquemas.ESQUEMAS[REQUISITOS])
    assert res.motivos() == [], res.motivos()


def test_las_reglas_nuevas_solo_las_usan_los_esquemas_de_suelo():
    assert REGLAS_NUEVAS_CSV <= set(ens.REGLAS_CSV)
    for nombre, esq in esquemas.ESQUEMAS.items():
        usadas = {r["regla"] for r in esq.get("reglas", [])}
        if nombre == PERFIL:
            assert usadas == REGLAS_NUEVAS_CSV
        else:
            assert not usadas & REGLAS_NUEVAS_CSV, f"{nombre} no debía cambiar"
        if nombre != REQUISITOS:
            assert esq.get("regla") != "suelo_requisitos", f"{nombre} no debía cambiar"


def test_cultivos_admitidos_son_las_clases_del_proyecto_y_los_de_las_secuencias_del_cubo():
    admitidos = set(esquemas.ESQUEMAS[REQUISITOS]["cultivos"])
    assert admitidos == set(esquemas.CULTIVOS_SUELO) >= set(esquemas.CULTIVOS_GAEZ)
    # Lo que no es un cultivo no lleva requisitos: la abstención, el barbecho y no sembrar.
    assert not admitidos & {"sin_clasificar", "barbecho", esquemas.NO_SIEMBRA}
    if not CUBO_REAL.is_file():
        pytest.skip("web/data/cubo.json aún no existe")
    cubo = json.loads(CUBO_REAL.read_text(encoding="utf-8"))
    en_secuencias = {c for p in cubo["parcelas"].values() for o in p.get("opciones") or [] for c in o.get("secuencia") or []}
    assert en_secuencias, "el cubo real trae opciones con secuencia"
    faltan = en_secuencias - {esquemas.NO_SIEMBRA} - admitidos
    assert not faltan, (f"las secuencias del cubo nombran {sorted(faltan)}: agréguelos a "
                        "esquemas.CULTIVOS_DE_SECUENCIAS para que suelo_requisitos.json pueda traer sus rangos")


# ---------------------------------------------------------------------------------------
# Los dos archivos en el buzón
# ---------------------------------------------------------------------------------------
def test_los_dos_entran_juntos_y_se_registran(tmp_path):
    archivos = {PERFIL: GEN.texto_perfil(), REQUISITOS: GEN.texto_requisitos()}
    rep = correr(buzon(tmp_path, archivos), tmp_path)
    assert rep["rechazados"] == [] and rep["retenidos"] == []
    assert nombres(rep["entraron"]) == sorted([*archivos, "parcelas_base.geojson"])
    por_nombre = {x["archivo"]: x for x in rep["entraron"]}
    for nombre, (pieza, _) in NUEVOS.items():
        assert por_nombre[nombre]["pieza"] == pieza and por_nombre[nombre]["zona"] is None
    fuentes = {f["archivo"]: f for f in rep["fuentes"]}
    for nombre in NUEVOS:
        assert fuentes[nombre]["fuente"] and fuentes[nombre]["fecha"] and fuentes[nombre]["sha256"]
    # El CSV por parcela dice cuántas parcelas trae de cada zona (un archivo para las dos).
    assert por_nombre[PERFIL]["zonas"] == {ZONAS[0]: 2, ZONAS[1]: 1}
    assert set(por_nombre[PERFIL]["zonas"]) == set(ZONAS)


def test_perfil_sin_parcelas_base_queda_retenido(tmp_path):
    """El perfil comprueba sus id: si parcelas_base aún no llega, se retiene (no se rechaza)."""
    archivos = {PERFIL: GEN.texto_perfil(), REQUISITOS: GEN.texto_requisitos()}
    rep = correr(buzon(tmp_path, archivos, copiar=()), tmp_path)
    assert nombres(rep["retenidos"]) == [PERFIL]
    assert nombres(rep["entraron"]) == [REQUISITOS] and rep["rechazados"] == []


@pytest.mark.parametrize("nombre", [f"suelo_parcelas_{ZONAS[-1]}.csv", f"suelo_requisitos_{ZONAS[-1]}.json"])
def test_sufijo_de_zona_no_se_admite(tmp_path, nombre):
    """Son UN archivo para las dos zonas: con sufijo de zona no están en la tabla."""
    texto = GEN.texto_perfil() if nombre.endswith(".csv") else GEN.texto_requisitos()
    assert "no se sabe cómo validarlo" in rechazo(tmp_path, nombre, texto)


# ---------------------------------------------------------------------------------------
# suelo_parcelas.csv (A14)
# ---------------------------------------------------------------------------------------
def test_perfil_valido_entra(tmp_path):
    x = entra(tmp_path, PERFIL, GEN.texto_perfil())
    # Una parcela de parcelas_base sin fila solo se avisa (la fixture deja una sin perfil a propósito).
    assert len(x["avisos"]) == 1 and "sin filas en este archivo" in x["avisos"][0], x["avisos"]


def test_perfil_admite_vacios_donde_el_contrato_lo_dice(tmp_path):
    """Nitrógeno, CIC y salinidad pueden venir vacíos; la fixture trae una parcela así."""
    vacias = [pid for pid, f in BASE.items() if not f["nitrogeno_g_kg"] and not f["cic_cmol_kg"] and not f["salinidad_ce_ds_m"]]
    assert vacias, "la fixture trae una parcela sin nitrógeno, CIC ni salinidad"
    entra(tmp_path, PERFIL, perfil_con(UNA, nitrogeno_g_kg="", cic_cmol_kg="", salinidad_ce_ds_m=""))


@pytest.mark.parametrize("fracciones", [(40, 40, 18), (40, 40, 22), (33.3, 33.3, 33.4), (100, 0, 0)])
def test_perfil_la_suma_admite_la_tolerancia(tmp_path, fracciones):
    """100 ± 2 con los dos extremos incluidos (98 y 102 entran)."""
    arena, limo, arcilla = fracciones
    entra(tmp_path, PERFIL, perfil_con(arena_pct=arena, limo_pct=limo, arcilla_pct=arcilla))


PERFIL_INVALIDO = {
    "columna faltante": (dict(quitar="n_celdas"), "faltan columnas obligatorias: n_celdas"),
    "id que no existe en parcelas_base": (dict(id="P9999"), "id no existe en parcelas_base.geojson"),
    "id repetido": (dict(id=list(BASE)[1]), "id repetido"),
    "fracciones que suman más": (dict(arena_pct=40, limo_pct=40, arcilla_pct=25),
                                 "arena_pct + limo_pct + arcilla_pct debe sumar 100 ± 2"),
    "fracciones que suman menos": (dict(arena_pct=40, limo_pct=40, arcilla_pct=17.5),
                                   "arena_pct + limo_pct + arcilla_pct debe sumar 100 ± 2"),
    "porcentaje mayor que 100": (dict(arena_pct=120, limo_pct=0, arcilla_pct=0), "arena_pct fuera de [0, 100]"),
    "porcentaje negativo": (dict(arena_pct=60, limo_pct=-10, arcilla_pct=50), "limo_pct fuera de [0, 100]"),
    "fracción vacía": (dict(arcilla_pct=""), "fila a medias"),
    "clase de textura en otro idioma": (dict(clase_textura="franco"), "clase_textura fuera de la lista permitida"),
    "clase de textura con mayúscula": (dict(clase_textura="Loam"), "clase_textura fuera de la lista permitida"),
    "pH fuera de la escala": (dict(ph=14.5), "ph fuera de [0, 14]"),
    "pH negativo": (dict(ph=-1), "ph fuera de [0, 14]"),
    "pH con coma decimal": (dict(ph="siete"), "ph: no es un número"),
    "carbono negativo": (dict(carbono_organico_g_kg=-0.5), "carbono_organico_g_kg menor que 0"),
    "nitrógeno negativo": (dict(nitrogeno_g_kg=-0.1), "nitrogeno_g_kg menor que 0"),
    "CIC negativa": (dict(cic_cmol_kg=-3), "cic_cmol_kg menor que 0"),
    "salinidad negativa": (dict(salinidad_ce_ds_m=-1), "salinidad_ce_ds_m menor que 0"),
    "capa vacía": (dict(profundidad_cm=""), "profundidad_cm: celda vacía no permitida"),
    "capa sin guion": (dict(profundidad_cm="30"), "profundidad_cm no tiene la forma «a-b»"),
    "capa con texto": (dict(profundidad_cm="0-30 cm"), "profundidad_cm no tiene la forma «a-b»"),
    "capa al revés": (dict(profundidad_cm="30-0"), "profundidad_cm: el primer número debe ser menor que el segundo"),
    "celdas negativas": (dict(n_celdas=-1), "n_celdas menor que 0"),
    "fila a medias": (dict(ph=""), "fila a medias"),
    "celdas no enteras": (dict(n_celdas=2.5), "n_celdas: debe ser entero"),
}


@pytest.mark.parametrize("caso", sorted(PERFIL_INVALIDO))
def test_perfil_invalido_se_rechaza_con_su_motivo(tmp_path, caso):
    cambios, clave = PERFIL_INVALIDO[caso]
    m = rechazo(tmp_path, PERFIL, perfil_con(**cambios))
    assert clave in m, m


def test_perfil_parcela_sin_dato_y_parcela_menor_que_una_celda_entran(tmp_path):
    """Una parcela que el mapa no cubre lleva su fila con todas las columnas de suelo vacías (entra con
    aviso); una parcela más chica que una celda lleva n_celdas = 0 (se usó la celda más cercana)."""
    vacia = dict(arena_pct="", limo_pct="", arcilla_pct="", clase_textura="", ph="", carbono_organico_g_kg="",
                 nitrogeno_g_kg="", cic_cmol_kg="", salinidad_ce_ds_m="", n_celdas=0)
    entra(tmp_path, PERFIL, perfil_con(**vacia))
    entra(tmp_path, PERFIL, perfil_con(n_celdas=0))


def test_perfil_el_motivo_dice_la_fila_y_el_valor(tmp_path):
    """Motivo legible: qué columna, qué fila del archivo y qué valor llegó."""
    m = rechazo(tmp_path, PERFIL, perfil_con(arena_pct=40, limo_pct=40, arcilla_pct=25))
    assert "fila 2: suma 105" in m
    m = rechazo(tmp_path, PERFIL, perfil_con(profundidad_cm="30"))
    assert "fila 2: '30'" in m and "por ejemplo 0-30" in m
    m = rechazo(tmp_path, PERFIL, perfil_con(clase_textura="franco"))
    assert all(c in m for c in esquemas.CLASES_TEXTURA), "el motivo lista las clases permitidas"


# ---------------------------------------------------------------------------------------
# suelo_requisitos.json (A15)
# ---------------------------------------------------------------------------------------
def requisitos_con(cambio):
    return GEN.texto_requisitos(cambio)


def cultivo_de_prueba(o, nombre="alfalfa"):
    return o["cultivos"][nombre]


def test_requisitos_valido_entra(tmp_path):
    x = entra(tmp_path, REQUISITOS, GEN.texto_requisitos())
    # El cultivo de prueba sin ningún rango solo se avisa: su aptitud quedará en «no published range».
    assert len(x["avisos"]) == 1 and "algodon" in x["avisos"][0] and "no published range" in x["avisos"][0], x["avisos"]


def test_requisitos_admite_todas_las_clases_de_cultivo_del_proyecto(tmp_path):
    def todas(o):
        base = cultivo_de_prueba(o)
        o["cultivos"] = {c: base for c in esquemas.CULTIVOS_SUELO}
    entra(tmp_path, REQUISITOS, requisitos_con(todas))


REQUISITOS_VALIDOS = {
    "sin la escala de pH (es opcional)": lambda o: o.pop(esquemas.ESCALA_PH),
    "escala de pH en null": lambda o: o.update({esquemas.ESCALA_PH: None}),
    "nutrientes en null": lambda o: cultivo_de_prueba(o).update(nutrientes=None),
    "condición en null": lambda o: cultivo_de_prueba(o)["nutrientes"][0].update(condicion=None),
    "óptimo igual al tolerado": lambda o: cultivo_de_prueba(o)["ph"].update(optimo=[2.0, 5.0]),
    "rango de un solo valor": lambda o: cultivo_de_prueba(o)["ph"].update(optimo=[3.5, 3.5]),
    "toda la escala de pH": lambda o: cultivo_de_prueba(o)["ph"].update(tolerado=[esquemas.PH_MIN, esquemas.PH_MAX]),
    "textura solo con limitantes": lambda o: cultivo_de_prueba(o)["textura"].update(apta=[]),
    "umbral de salinidad en cero": lambda o: cultivo_de_prueba(o)["salinidad_umbral_ds_m"].update(valor=0),
}


@pytest.mark.parametrize("caso", sorted(REQUISITOS_VALIDOS))
def test_requisitos_variantes_validas_entran(tmp_path, caso):
    entra(tmp_path, REQUISITOS, requisitos_con(REQUISITOS_VALIDOS[caso]))


def _agregar_cultivo(nombre):
    def cambio(o):
        o["cultivos"][nombre] = cultivo_de_prueba(o)
    return cambio


REQUISITOS_INVALIDOS = {
    "sin fuente del archivo": (lambda o: o.pop("fuente"), "falta fuente"),
    "fuente del archivo vacía": (lambda o: o.update(fuente="  "), "falta fuente"),
    "sin cultivos": (lambda o: o.update(cultivos={}), "falta cultivos"),
    "cultivos que no es objeto": (lambda o: o.update(cultivos=["alfalfa"]), "falta cultivos"),
    "cultivo que no es clase del proyecto": (_agregar_cultivo("avena"), "cultivo fuera de las clases de cultivo del proyecto"),
    "requisitos de no sembrar": (_agregar_cultivo(esquemas.NO_SIEMBRA), "cultivo fuera de las clases de cultivo del proyecto"),
    "requisitos de la abstención": (_agregar_cultivo("sin_clasificar"), "cultivo fuera de las clases de cultivo del proyecto"),
    "requisitos que no son objeto": (lambda o: o["cultivos"].update(alfalfa="ver tabla"),
                                     "los requisitos de un cultivo deben ser un objeto"),
    "falta un bloque": (lambda o: cultivo_de_prueba(o).pop("textura"), "falta la llave textura (null si la fuente no da ese rango)"),
    "pH sin fuente": (lambda o: cultivo_de_prueba(o)["ph"].pop("fuente"), "ph sin fuente"),
    "textura con fuente vacía": (lambda o: cultivo_de_prueba(o)["textura"].update(fuente=""), "textura sin fuente"),
    "salinidad sin fuente": (lambda o: cultivo_de_prueba(o)["salinidad_umbral_ds_m"].update(fuente=None),
                             "salinidad_umbral_ds_m sin fuente"),
    "bloque que no es objeto": (lambda o: cultivo_de_prueba(o).update(ph=[3.0, 4.0]), "ph debe ser un objeto con su fuente, o null"),
    "óptimo que no es un par": (lambda o: cultivo_de_prueba(o)["ph"].update(optimo=[3.0]), "ph.optimo debe ser un par [min, max]"),
    "óptimo con texto": (lambda o: cultivo_de_prueba(o)["ph"].update(optimo=["3.0", "4.0"]), "ph.optimo debe ser un par [min, max]"),
    "sin tolerado": (lambda o: cultivo_de_prueba(o)["ph"].pop("tolerado"), "ph.tolerado debe ser un par [min, max]"),
    "óptimo al revés": (lambda o: cultivo_de_prueba(o)["ph"].update(optimo=[4.0, 3.0]), "ph.optimo: min mayor que max"),
    "tolerado fuera de la escala": (lambda o: cultivo_de_prueba(o)["ph"].update(tolerado=[2.0, 14.5]),
                                    "ph.tolerado fuera de la escala de pH [0, 14]"),
    "tolerado negativo": (lambda o: cultivo_de_prueba(o)["ph"].update(tolerado=[-1.0, 5.0]),
                          "ph.tolerado fuera de la escala de pH [0, 14]"),
    "óptimo fuera del tolerado": (lambda o: cultivo_de_prueba(o)["ph"].update(optimo=[3.0, 6.0]),
                                  "ph.optimo no está contenido en ph.tolerado"),
    "clase de textura desconocida": (lambda o: cultivo_de_prueba(o)["textura"].update(apta=["franco"]),
                                     "textura.apta: clase de textura fuera de la lista"),
    "limitante que no es lista": (lambda o: cultivo_de_prueba(o)["textura"].update(limitante="clay"),
                                  "textura.limitante debe ser una lista de clases de textura"),
    "clase en apta y en limitante": (lambda o: cultivo_de_prueba(o)["textura"].update(limitante=["clay", "loam"]),
                                     "textura: una clase no puede estar en apta y en limitante"),
    "clase repetida en apta": (lambda o: cultivo_de_prueba(o)["textura"].update(apta=["loam", "loam"]),
                               "textura.apta: clase de textura repetida"),
    "textura sin ninguna clase": (lambda o: cultivo_de_prueba(o)["textura"].update(apta=[], limitante=[]),
                                  "textura sin ninguna clase en apta ni en limitante"),
    "umbral de salinidad negativo": (lambda o: cultivo_de_prueba(o)["salinidad_umbral_ds_m"].update(valor=-1),
                                     "salinidad_umbral_ds_m.valor debe ser un número ≥ 0"),
    "umbral de salinidad como texto": (lambda o: cultivo_de_prueba(o)["salinidad_umbral_ds_m"].update(valor="2.0"),
                                       "salinidad_umbral_ds_m.valor debe ser un número ≥ 0"),
    "sin la llave nutrientes": (lambda o: cultivo_de_prueba(o).pop("nutrientes"), "falta la llave nutrientes"),
    "nutrientes que no es lista": (lambda o: cultivo_de_prueba(o).update(nutrientes={"Zn": "x"}), "nutrientes debe ser una lista"),
    "nutriente sin elemento": (lambda o: cultivo_de_prueba(o)["nutrientes"][0].pop("elemento"), "nutriente sin elemento"),
    "nutriente sin texto": (lambda o: cultivo_de_prueba(o)["nutrientes"][1].update(texto_en=""), "nutriente sin texto_en"),
    "nutriente sin fuente": (lambda o: cultivo_de_prueba(o)["nutrientes"][2].pop("fuente"), "nutriente sin fuente"),
    # texto_en va tal cual a la ficha: sin «first», «only» ni promesas (CLAUDE.md, regla 10).
    "texto del nutriente con lenguaje que la ficha no admite": (
        lambda o: cultivo_de_prueba(o)["nutrientes"][0].update(texto_en="TEST DATA: the only note that saves water."),
        "texto_en con lenguaje que la ficha no admite (CLAUDE.md, regla 10): «only» (palabra prohibida), «saves» (promete ahorros)"),
    "condición con una llave desconocida": (lambda o: cultivo_de_prueba(o)["nutrientes"][0].update(condicion={"ph_igual_a": 4.0}),
                                            "condicion con una llave desconocida"),
    "condición que no es objeto": (lambda o: cultivo_de_prueba(o)["nutrientes"][0].update(condicion="pH alto"),
                                   "condicion debe ser un objeto"),
    "condición con un pH fuera de la escala": (lambda o: cultivo_de_prueba(o)["nutrientes"][0].update(condicion={"ph_mayor_que": 20}),
                                               "condicion.ph_mayor_que debe ser un pH de la escala [0, 14]"),
    "condición con una textura desconocida": (lambda o: cultivo_de_prueba(o)["nutrientes"][2].update(condicion={"textura_en": ["arcilla"]}),
                                              "condicion.textura_en: clase de textura fuera de la lista"),
    "condición con la lista de texturas vacía": (lambda o: cultivo_de_prueba(o)["nutrientes"][2].update(condicion={"textura_en": []}),
                                                 "condicion.textura_en: lista vacía"),
    "escala de pH al revés": (lambda o: o[esquemas.ESCALA_PH].update(acido_menor_que=11.0),
                              "escala_ph: acido_menor_que no puede ser mayor que alcalino_mayor_que"),
    "escala de pH sin fuente": (lambda o: o[esquemas.ESCALA_PH].pop("fuente"), "escala_ph sin fuente"),
    "escala de pH fuera de la escala": (lambda o: o[esquemas.ESCALA_PH].update(alcalino_mayor_que=15),
                                        "escala_ph.alcalino_mayor_que debe ser un pH de la escala [0, 14]"),
    "escala de pH que no es objeto": (lambda o: o.update({esquemas.ESCALA_PH: [4.0, 10.0]}), "escala_ph debe ser un objeto"),
}


@pytest.mark.parametrize("caso", sorted(REQUISITOS_INVALIDOS))
def test_requisitos_invalido_se_rechaza_con_su_motivo(tmp_path, caso):
    cambio, clave = REQUISITOS_INVALIDOS[caso]
    m = rechazo(tmp_path, REQUISITOS, requisitos_con(cambio))
    assert clave in m, m


def test_requisitos_el_motivo_dice_el_cultivo_y_el_valor(tmp_path):
    """Motivo legible: qué cultivo, qué bloque y qué valor llegó."""
    m = rechazo(tmp_path, REQUISITOS, requisitos_con(lambda o: cultivo_de_prueba(o)["ph"].update(optimo=[3.0, 6.0])))
    assert "cultivo alfalfa: [3, 6] no cabe en [2, 5]" in m
    m = rechazo(tmp_path, REQUISITOS, requisitos_con(_agregar_cultivo("avena")))
    assert "avena" in m and all(c in m for c in esquemas.CULTIVOS_SUELO), "el motivo lista los cultivos admitidos"
    m = rechazo(tmp_path, REQUISITOS, requisitos_con(lambda o: cultivo_de_prueba(o)["nutrientes"][0].update(condicion={"ph_igual_a": 4.0})))
    assert "cultivo alfalfa, nutriente 1: ph_igual_a" in m and all(k in m for k in esquemas.CONDICIONES_NUTRIENTE)


def test_requisitos_que_no_es_json_o_no_es_objeto(tmp_path):
    assert "no es JSON válido" in rechazo(tmp_path, REQUISITOS, "{ fuente: sin comillas }")
    assert "no es un objeto JSON" in rechazo(tmp_path / "b", REQUISITOS, "[]")


def test_requisitos_avisa_sin_rechazar(tmp_path):
    """Un bloque sin etiqueta y una llave de primer nivel que el contrato no nombra solo se avisan."""
    def cambio(o):
        cultivo_de_prueba(o)["ph"].pop("etiqueta")
        o["fecha_lectura"] = "2026-11-14"
    x = entra(tmp_path, REQUISITOS, requisitos_con(cambio))
    avisos = " | ".join(x["avisos"])
    assert "cultivo alfalfa: ph sin etiqueta" in avisos
    assert "llaves adicionales (se copian sin validar): fecha_lectura" in avisos


def test_varios_errores_se_reportan_juntos(tmp_path):
    """El rechazo junta todos los motivos del archivo: quien entrega los corrige de una vez."""
    def cambio(o):
        o.pop("fuente")
        cultivo_de_prueba(o)["ph"].update(optimo=[4.0, 3.0])
        cultivo_de_prueba(o, "sorgo")["textura"].update(apta=["franco"])
    m = rechazo(tmp_path, REQUISITOS, requisitos_con(cambio))
    assert "falta fuente" in m and "ph.optimo: min mayor que max" in m and "cultivo sorgo" in m
