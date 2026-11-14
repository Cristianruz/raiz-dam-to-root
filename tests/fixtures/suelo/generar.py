# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Fixture del módulo «suelo y aptitud» para tests/test_esquemas_suelo.py, tests/test_suelo_web.py,
tests/suelo.test.js y la página de prueba de web/js/suelo.js. SON DATOS DE PRUEBA, no datos reales.

Contrato: docs/decisiones/2026-11-14_suelo_aptitud.md (suelo_parcelas.csv y suelo_requisitos.json).

Qué escribe:
- escribir_processed(destino): un data/processed DE PRUEBA con las dos entregas del contrato
  (suelo_parcelas.csv y suelo_requisitos.json), el parcelas_base.geojson de la fixture de dos zonas
  (tests/fixtures/buzon_dos_zonas) y un fuentes.json con sus líneas de prueba.
- escribir_cubo(ruta): un cubo.json DE PRUEBA con solo lo que el motor lee (parcelas → opciones → id,
  secuencia).
- main(): regenera tests/fixtures/suelo/suelo_lleno.json con motor/suelo_web.py sobre ese processed
  (en una carpeta temporal) y con «generado» fijo (GENERADO_PRUEBA).

Los valores son OBVIAMENTE DE ENSAYO (un pH de 3.5 o de 11, rangos «óptimos» de pH 3 a 4, celdas de
999 m…): no describen ningún suelo ni ningún cultivo y no deben leerse como agronomía. Están puestos
para cubrir cada rama de las reglas de aptitud (motor/suelo_web.py):
  P0001 (loam, pH 3.5, con salinidad)
    ACTUAL          alfalfa                  → fits (pH en el óptimo, textura apta, salinidad bajo el umbral)
    maiz_forrajero  maiz_forrajero           → tolerated (pH fuera del óptimo y dentro del tolerado)
    sorgo           sorgo                    → outside_range por textura (clase limitante)
    algodon         algodon                  → no_published_range (sus tres bloques van en null)
    descanso        descanso                 → no_published_range, «nothing is planted»
  P0002 (loamy sand, pH 4.5, sin nitrógeno, CIC ni salinidad)
    ACTUAL          sorgo                    → fits (textura apta; sin rango de pH)
    alfalfa         alfalfa                  → tolerated (pH tolerado; textura en ninguna lista; la
                                               salinidad no cuenta: la parcela no la trae)
    avena_maiz      cereal_invierno + maíz   → outside_range por pH: el cereal queda fuera y el maíz en
                                               su óptimo; manda el peor
    nogal           nogal                    → no_published_range (el archivo no trae ese cultivo)
  L0001 (clay, pH 11, salinidad alta)
    ACTUAL          alfalfa                  → outside_range (pH, textura y salinidad)
    cereal_algodon  cereal_invierno + algodón → fits (el cereal en su óptimo; el algodón no tiene rango
                                               y no cuenta)
    no_sembrar      (secuencia vacía)        → no_published_range, «nothing is planted»
  L0002: con opciones en el cubo y SIN fila en suelo_parcelas.csv → sin aptitud («no soil data»).
  P0099: sin opciones (como una parcela abstenida) → no entra.
Avisos de nutrientes de la alfalfa de prueba: Zn (pH mayor que el corte), Fe (sin condición), P (textura
en una lista), K (pH menor que el corte Y textura en una lista) y Mn (pH mayor que el corte Y textura).

Uso:  python tests/fixtures/suelo/generar.py
Los ids de parcela son los de tests/fixtures/buzon_dos_zonas/parcelas_base.geojson (para validar las
entregas con motor/ensamblar.py).
"""
import json
import shutil
import sys
import tempfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from motor import esquemas  # noqa: E402
from motor import suelo_web  # noqa: E402

SALIDA_JSON = AQUI / "suelo_lleno.json"
BUZON_DOS_ZONAS = RAIZ / "tests/fixtures/buzon_dos_zonas"
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
ROTULO = "DE PRUEBA (tests/fixtures/suelo/generar.py): no es un dato ni tiene fuente real"
GENERADO_PRUEBA = "2026-11-14T00:00:00+00:00"
FECHA_PRUEBA = "2026-11-14"
ETIQUETA_PRUEBA = "[prueba]"
CAPA_PRUEBA = "0-30"

# Línea de fuente de cada entrega (como la de LEEME.md): la de suelo_parcelas.csv nombra producto, capa y
# celda, porque de ahí sale la resolución que la página muestra junto al rótulo de escala.
FUENTES_PRUEBA = {
    "suelo_parcelas.csv": ("DE PRUEBA (tests/fixtures/suelo/generar.py): mapa de suelos de ensayo, capa de 0 a "
                           "30 cm, celdas de 999 m, promedio de las celdas dentro de la parcela; no es un dato ni "
                           "tiene fuente real"),
    "suelo_requisitos.json": ROTULO,
    esquemas.ARCHIVO_PARCELAS: ROTULO,
}

ENC_PERFIL = ("id,arena_pct,limo_pct,arcilla_pct,clase_textura,ph,carbono_organico_g_kg,nitrogeno_g_kg,"
              "cic_cmol_kg,salinidad_ce_ds_m,profundidad_cm,n_celdas")
# Una fila por parcela con perfil (L0002 no trae fila a propósito). P0002 va sin nitrógeno, CIC ni
# salinidad («vacío si el producto no lo trae»); sus fracciones suman 101 y las de L0001, 99.5 (100 ± 2).
FILAS_PERFIL = (
    f"P0001,40,40,20,loam,3.5,1.1,0.11,11.1,1.0,{CAPA_PRUEBA},4",
    f"P0002,80,10,11,loamy sand,4.5,2.2,,,,{CAPA_PRUEBA},2",
    f"L0001,20,29.5,50,clay,11.0,3.3,0.33,33.3,9.0,{CAPA_PRUEBA},6",
)


def texto_perfil(filas=FILAS_PERFIL):
    return "\n".join([ENC_PERFIL, *filas]) + "\n"


def _con_fuente(que, **campos):
    """Un bloque de prueba con su fuente y su etiqueta de prueba."""
    return {**campos, "fuente": f"{ROTULO} ({que})", "etiqueta": ETIQUETA_PRUEBA}


def requisitos_de_prueba():
    """suelo_requisitos.json DE PRUEBA: rangos de ensayo, puestos para cubrir cada rama de las reglas."""
    return {
        "_encabezado": ENCABEZADO,
        "fuente": f"{ROTULO} (tabla de ensayo)",
        # Cortes de prueba para decir «acid», «neutral» o «alkaline» (llave opcional).
        esquemas.ESCALA_PH: _con_fuente("cortes de pH de ensayo", acido_menor_que=4.0, alcalino_mayor_que=10.0),
        "cultivos": {
            "alfalfa": {
                "ph": _con_fuente("pH de la alfalfa de ensayo", optimo=[3.0, 4.0], tolerado=[2.0, 5.0]),
                "textura": _con_fuente("textura de la alfalfa de ensayo", apta=["loam", "silt loam"], limitante=["clay"]),
                "salinidad_umbral_ds_m": _con_fuente("salinidad de la alfalfa de ensayo", valor=2.0),
                "nutrientes": [
                    _con_fuente("zinc de ensayo", elemento="Zn", condicion={"ph_mayor_que": 4.0},
                                texto_en="TEST DATA: zinc note, shown when the field pH is above the test cut."),
                    _con_fuente("hierro de ensayo", elemento="Fe",
                                texto_en="TEST DATA: iron note with no condition, shown on every field."),
                    _con_fuente("fósforo de ensayo", elemento="P", condicion={"textura_en": ["clay", "silty clay"]},
                                texto_en="TEST DATA: phosphorus note, shown on the listed test textures."),
                    _con_fuente("potasio de ensayo", elemento="K",
                                condicion={"ph_menor_que": 4.0, "textura_en": ["loam"]},
                                texto_en="TEST DATA: potassium note, shown when both test conditions hold."),
                    _con_fuente("manganeso de ensayo", elemento="Mn",
                                condicion={"ph_mayor_que": 4.0, "textura_en": ["clay"]},
                                texto_en="TEST DATA: manganese note, shown on clay above the test cut."),
                ],
            },
            "maiz_forrajero": {
                "ph": _con_fuente("pH del maíz de ensayo", optimo=[4.0, 5.0], tolerado=[3.0, 6.0]),
                "textura": None, "salinidad_umbral_ds_m": None, "nutrientes": [],
            },
            "sorgo": {
                "ph": None,
                "textura": _con_fuente("textura del sorgo de ensayo", apta=["loamy sand"], limitante=["loam"]),
                "salinidad_umbral_ds_m": None, "nutrientes": [],
            },
            # Sin ningún rango con fuente: su aptitud queda en «no published range».
            "algodon": {"ph": None, "textura": None, "salinidad_umbral_ds_m": None, "nutrientes": []},
            "cereal_invierno": {
                "ph": _con_fuente("pH del cereal de ensayo", optimo=[10.5, 11.5], tolerado=[10.0, 12.0]),
                "textura": None, "salinidad_umbral_ds_m": None, "nutrientes": [],
            },
            # Ninguna opción del cubo de prueba lo siembra (el motor lo avisa).
            "chile": {
                "ph": None, "textura": None,
                "salinidad_umbral_ds_m": _con_fuente("salinidad del chile de ensayo", valor=1.5), "nutrientes": [],
            },
        },
    }


def texto_requisitos(cambio=None):
    """El JSON de prueba como texto; `cambio` (función sobre el dict) lo altera para las pruebas."""
    obj = requisitos_de_prueba()
    if cambio is not None:
        cambio(obj)
    return json.dumps(obj, ensure_ascii=False, indent=1) + "\n"


def cubo_de_prueba():
    """Lo que el motor lee de cubo.json: parcelas → opciones → id y secuencia (ver el encabezado)."""
    def opciones(*pares):
        return {"opciones": [{"id": oid, "secuencia": list(secuencia)} for oid, secuencia in pares]}

    return {
        "_encabezado": ENCABEZADO,
        "_nota": ROTULO,
        "parcelas": {
            "P0001": opciones(("ACTUAL", ["alfalfa"]), ("maiz_forrajero", ["maiz_forrajero"]), ("sorgo", ["sorgo"]),
                              ("algodon", ["algodon"]), ("descanso", [esquemas.NO_SIEMBRA])),
            "P0002": opciones(("ACTUAL", ["sorgo"]), ("alfalfa", ["alfalfa"]),
                              ("avena_maiz", ["cereal_invierno", "maiz_forrajero"]), ("nogal", ["nogal"])),
            "L0001": opciones(("ACTUAL", ["alfalfa"]), ("cereal_algodon", ["cereal_invierno", "algodon"]),
                              ("no_sembrar", [])),
            "L0002": opciones(("ACTUAL", ["alfalfa"])),      # sin fila en suelo_parcelas.csv
            "P0099": opciones(),                              # sin opciones (como una parcela abstenida)
        },
    }


def escribir_cubo(ruta):
    ruta = Path(ruta)
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(json.dumps(cubo_de_prueba(), ensure_ascii=False) + "\n", encoding="utf-8")
    return ruta


def escribir_processed(destino):
    """Escribe en `destino` el data/processed DE PRUEBA (ver el encabezado)."""
    destino = Path(destino)
    destino.mkdir(parents=True, exist_ok=True)
    shutil.copy(BUZON_DOS_ZONAS / esquemas.ARCHIVO_PARCELAS, destino / esquemas.ARCHIVO_PARCELAS)
    (destino / suelo_web.ARCHIVO_PERFIL).write_text(texto_perfil(), encoding="utf-8")
    (destino / suelo_web.ARCHIVO_REQUISITOS).write_text(texto_requisitos(), encoding="utf-8")
    fuentes = {"_encabezado": ENCABEZADO, "_nota": ROTULO, "generado": GENERADO_PRUEBA,
               "fuentes": [{"archivo": n, "tipo": "entrega", "fuente": fuente, "fecha": FECHA_PRUEBA,
                            "script": "tests/fixtures/suelo/generar.py"} for n, fuente in FUENTES_PRUEBA.items()]}
    (destino / suelo_web.NOMBRE_FUENTES).write_text(json.dumps(fuentes, ensure_ascii=False, indent=1) + "\n",
                                                    encoding="utf-8")
    return destino


def suelo_de_prueba(processed):
    """El suelo.json que arma el motor con el processed y el cubo de prueba, con «generado» fijo."""
    suelo, _ = suelo_web.armar(processed, cubo_de_prueba(), generado=GENERADO_PRUEBA)
    return suelo


def main():
    with tempfile.TemporaryDirectory() as tmp:
        escribir_processed(tmp)
        SALIDA_JSON.write_text(suelo_web.volcar(suelo_de_prueba(tmp)), encoding="utf-8")
    print(f"{SALIDA_JSON.relative_to(RAIZ)}: {SALIDA_JSON.stat().st_size:,} bytes (DATOS DE PRUEBA)")


if __name__ == "__main__":
    main()
