# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Fixture de las bases de datos del reto para tests/test_contexto_web.py, tests/contexto.test.js
y la página de prueba de web/js/contexto.js. SON DATOS DE PRUEBA, no datos reales.

Qué escribe:
- escribir_processed(destino): un data/processed DE PRUEBA con las cuatro entregas nuevas del
  contrato (docs/decisiones/2026-11-14_recursos_del_reto.md): contexto_regional.csv,
  gedi_parcelas.csv, ecostress_parcelas.csv y gaez_zona.csv; además heladas.json, et_contraste.csv,
  el clima diario de las dos zonas (eto_diaria[_zona].csv e imerg_diaria[_zona].csv), fuentes.json y
  un supuestos.json con los dos criterios para leer GEDI (piso del instrumento y umbral de dosel alto).
  Los valores salen de fórmulas fijas (senos del día del año): no hay azar y no significan nada.
  Las resoluciones y los nombres de fuente también son de prueba. Trae huecos a propósito:
  · eto_mm con el centinela de faltante de POWER durante DIAS_FALTANTES días de un año en una zona;
  · DIAS_AUSENTES filas ausentes en otro año de la otra zona;
  · meses sin fila (GRACE) y un valor vacío (SMAP) en contexto_regional.csv; GRACE va como una
    sola serie con zona «cuenca» (nota de GRACE del contrato);
  · parcelas sin disparos de GEDI y meses sin escena de ECOSTRESS;
  · GEDI: una parcela con dosel alto, una sin dosel alto (lectura en el piso del instrumento) y una con
    menos disparos que el mínimo del criterio.
  La «fuente» de contexto_regional.csv en fuentes.json es LARGA a propósito (como la línea real de
  LEEME, que enumera sus seis productos): sirve para probar que la página no la repite por tarjeta.
  et_contraste.csv va sin sufijo de zona: el motor lo asigna a la zona por omisión.
- main(): regenera tests/fixtures/contexto_reto/contexto_lleno.json con motor/contexto_web.py
  sobre ese processed (en una carpeta temporal) y con «generado» fijo (GENERADO_PRUEBA).

Uso:  python tests/fixtures/contexto_reto/generar.py
Las zonas y sus prefijos se leen de data/params.json; los ids de parcela son los de
tests/fixtures/buzon_dos_zonas/parcelas_base.geojson (para validar los CSV con motor/ensamblar.py).
"""
import datetime
import json
import math
import sys
import tempfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]
if str(RAIZ) not in sys.path:
    sys.path.insert(0, str(RAIZ))

from motor import contexto_web  # noqa: E402
from motor import esquemas  # noqa: E402

SALIDA_JSON = AQUI / "contexto_lleno.json"
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
ROTULO = "DE PRUEBA (tests/fixtures/contexto_reto/generar.py): no es un dato ni tiene fuente real"
GENERADO_PRUEBA = "2026-11-14T00:00:00+00:00"
FECHA_PRUEBA = "2026-11-14"

PARAMS = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
ZONAS = [z["id"] for z in PARAMS["zona_piloto"]["zonas"]["valor"]]
ZONA_A, ZONA_B = ZONAS[0], ZONAS[1]
IDS = {ZONA_A: ("P0001", "P0002"), ZONA_B: ("L0001", "L0002")}

# Periodo de prueba: cuatro años agrícolas completos (oct a sep) y el arranque de un quinto.
PRIMER_DIA = datetime.date(2021, 10, 1)
ULTIMO_DIA = datetime.date(2025, 11, 30)
# Huecos de prueba en el clima diario (por encima del umbral de faltantes del validador en SU año).
ANIO_CON_FALTANTES, DIAS_FALTANTES = 2024, 30     # eto_mm = centinela de POWER, zona B, desde el 1 de enero
ANIO_CON_AUSENTES, DIAS_AUSENTES = 2023, 25       # filas ausentes, zona A, desde el 1 de marzo
# Meses de ECOSTRESS y de et_contraste (doce meses de un año agrícola de prueba).
MESES_PARCELA = [f"2024-{m:02d}" for m in (10, 11, 12)] + [f"2025-{m:02d}" for m in range(1, 10)]
RESOLUCIONES_PRUEBA = {"smap": 9000, "modis": 500, "grace": 300000, "gldas": 27000, "nldas": 13000,
                       "era5_land": 11000}
CELDAS_PRUEBA = {"smap": 6, "modis": 1800, "grace": 1, "gldas": 2, "nldas": 4, "era5_land": 5}


def onda(dia_del_anio, desfase):
    """Seno de periodo anual, entre −1 y 1 (solo para dar forma a los valores de prueba)."""
    return math.sin(2 * math.pi * (dia_del_anio - desfase) / 365)


def vaiven(anio):
    """Factor de prueba que cambia de un año agrícola a otro (para que los años no salgan iguales)."""
    return 1 + 0.25 * math.sin(1.7 * anio)


def dias():
    d = PRIMER_DIA
    while d <= ULTIMO_DIA:
        yield d
        d += datetime.timedelta(days=1)


def meses():
    anio, mes = PRIMER_DIA.year, PRIMER_DIA.month
    while (anio, mes) <= (ULTIMO_DIA.year, ULTIMO_DIA.month):
        yield anio, mes
        anio, mes = (anio + 1, 1) if mes == 12 else (anio, mes + 1)


def escribir(ruta, lineas):
    Path(ruta).write_text("\n".join(lineas) + "\n", encoding="utf-8")


# ---------------------------------------------------------------------------------------
# Clima diario de prueba
# ---------------------------------------------------------------------------------------
def clima_power(zona):
    desvio = 0.0 if zona == ZONA_A else 1.5      # la zona B, un poco más fría (de prueba)
    lineas = ["fecha,eto_mm,tmin,tmax,lluvia_mm,ws2m"]
    for d in dias():
        n = d.timetuple().tm_yday
        if zona == ZONA_A and d.year == ANIO_CON_AUSENTES and 0 <= (d - datetime.date(d.year, 3, 1)).days < DIAS_AUSENTES:
            continue                                # fila ausente
        agricola = contexto_web.anio_agricola(d.year, d.month)
        eto = (4 + 3 * onda(n, 80)) * (1 + 0.04 * math.cos(agricola))
        if zona == ZONA_B and d.year == ANIO_CON_FALTANTES and n <= DIAS_FALTANTES:
            eto = esquemas.FALTANTE_POWER           # centinela de faltante
        tmin = 10 + 12 * onda(n, 110) - desvio - 1.5 * math.sin(agricola)
        lluvia = vaiven(agricola) * 6 * max(0.0, onda(n, 170)) if d.toordinal() % 5 == 0 else 0.0
        lineas.append(f"{d.isoformat()},{eto:.2f},{tmin:.2f},{tmin + 14:.2f},{lluvia:.2f},2.00")
    return lineas


def clima_imerg(zona):
    factor = 1.15 if zona == ZONA_A else 1.30    # IMERG de prueba, algo más lluvioso que POWER de prueba
    lineas = ["fecha,lluvia_mm"]
    for d in dias():
        n = d.timetuple().tm_yday
        agricola = contexto_web.anio_agricola(d.year, d.month)
        lluvia = factor * vaiven(agricola + 0.3) * 6 * max(0.0, onda(n, 170)) if d.toordinal() % 5 == 0 else 0.0
        lineas.append(f"{d.isoformat()},{lluvia:.3f}")
    return lineas


# ---------------------------------------------------------------------------------------
# Entregas nuevas de prueba
# ---------------------------------------------------------------------------------------
def valor_contexto(fuente, variable, anio, mes, zona):
    """Valor de prueba dentro del límite físico de su unidad (fórmula fija; no significa nada)."""
    agricola = contexto_web.anio_agricola(anio, mes)
    s = onda(30 * mes, 100) * (0.8 + 0.2 * math.sin(2.3 * agricola))    # forma estacional que cambia cada año
    tendencia = (anio - PRIMER_DIA.year) * 0.01
    z = 0.0 if zona == ZONA_A else 0.02
    formulas = {
        ("smap", "humedad_superficial"): 0.14 + 0.06 * s + z,
        ("smap", "humedad_raiz"): 0.20 + 0.04 * s + z,
        ("modis", "ndvi"): 0.32 + 0.12 * s + tendencia + z,
        ("modis", "et"): 45 + 35 * s + 100 * z,
        ("modis", "temp_superficie_dia"): 30 + 14 * s,
        ("grace", "agua_almacenada_anomalia"): -4 - 6 * tendencia * 10 + 3 * s,
        ("gldas", "et"): 38 + 30 * s + 100 * z,
        ("gldas", "humedad_raiz"): 300 + 60 * s,
        ("nldas", "lluvia"): (22 + 20 * s) * vaiven(agricola),
        ("nldas", "evaporacion_potencial"): 160 + 90 * s,
        ("era5_land", "tmin_media"): 9 + 10 * s - 50 * z,
        ("era5_land", "dias_helada"): max(0.0, -8 * s - 2),
    }
    return formulas[(fuente, variable)]


def contexto_regional():
    lineas = ["zona,fuente,variable,mes,valor,unidad,resolucion_m,n_celdas"]
    for zona in ZONAS:
        for fuente, variable, unidad in esquemas.COMBINACIONES_CONTEXTO:
            # GRACE va una sola vez, con zona «cuenca» (nota de GRACE del contrato).
            if fuente == esquemas.FUENTE_DE_CUENCA:
                if zona != ZONA_A:
                    continue
                zona_fila = esquemas.ZONA_CUENCA
            else:
                zona_fila = zona
            for anio, mes in meses():
                texto_mes = f"{anio:04d}-{mes:02d}"
                if fuente == "grace" and anio == 2023 and mes in (3, 4, 5):
                    continue                                    # meses sin fila (hueco de prueba)
                valor = f"{valor_contexto(fuente, variable, anio, mes, zona):.4f}"
                if (fuente, variable, texto_mes) == ("smap", "humedad_raiz", "2024-07"):
                    valor = ""                                  # valor vacío (sin dato)
                celdas = CELDAS_PRUEBA[fuente]
                if (fuente, variable) == ("nldas", "lluvia") and mes == 1:
                    celdas -= 1                                 # n_celdas que varía de un mes a otro
                lineas.append(f"{zona_fila},{fuente},{variable},{texto_mes},{valor},{unidad},"
                              f"{RESOLUCIONES_PRUEBA[fuente]},{celdas}")
    return lineas


# Criterios DE PRUEBA para leer GEDI (la forma de supuestos.json; valores distintos de los reales a
# propósito, para que ninguna prueba pase con un número escrito en el código).
PISO_GEDI_PRUEBA = {"min": 2.4, "valor": 2.6, "max": 3.0}
UMBRAL_GEDI_PRUEBA, MIN_DISPAROS_PRUEBA = 4, 2


def gedi_parcelas():
    """Cuatro parcelas: dosel alto (a1), sin disparos (a2), un solo disparo (b1: menos que el mínimo
    del criterio) y sin dosel alto con disparos de sobra (b2: lectura en el piso del instrumento)."""
    a1, a2 = IDS[ZONA_A]
    b1, b2 = IDS[ZONA_B]
    return ["id,n_disparos,altura_mediana_m,altura_p90_m",
            f"{a1},4,6.2,8.1", f"{a2},0,,", f"{b1},1,0.4,0.4", f"{b2},5,2.6,2.9"]


def supuestos():
    """supuestos.json DE PRUEBA con las dos claves que lee motor/contexto_web.py (la forma de la entrega real)."""
    return {
        "_encabezado": ENCABEZADO, "_nota": ROTULO,
        contexto_web.CLAVE_PISO_GEDI: {**PISO_GEDI_PRUEBA, "etiqueta": "etiqueta de prueba (piso)",
                                       "fuente": f"piso del instrumento {ROTULO}"},
        contexto_web.CLAVE_UMBRAL_GEDI: {
            "valor": UMBRAL_GEDI_PRUEBA,
            "min_disparos": {"valor": MIN_DISPAROS_PRUEBA, "etiqueta": "etiqueta de prueba",
                             "fuente": f"mínimo de disparos {ROTULO}"},
            "etiqueta": "etiqueta de prueba (umbral), assumption [S]",
            "fuente": f"umbral de dosel alto {ROTULO}"},
    }


def ecostress_parcelas():
    a1, a2 = IDS[ZONA_A]
    b1, b2 = IDS[ZONA_B]
    lineas = ["id,mes,et_mm_dia,n_escenas"]
    for i, mes in enumerate(MESES_PARCELA):
        s = onda(30 * int(mes[5:]), 100)
        lineas.append(f"{a1},{mes},{2.6 + 2.2 * s:.2f},{2 + i % 3}")
        # La segunda parcela se queda sin escena en los tres últimos meses (su último dato es anterior).
        lineas.append(f"{a2},{mes},{1.9 + 1.5 * s:.2f},1" if i < len(MESES_PARCELA) - 3 else f"{a2},{mes},,0")
        lineas.append(f"{b1},{mes},{2.2 + 1.8 * s:.2f},1" if i % 2 == 0 else f"{b1},{mes},,0")
        lineas.append(f"{b2},{mes},,0")                          # parcela sin ninguna escena
    return lineas


def gaez_zona():
    lineas = ["zona,cultivo,variable,valor,unidad,resolucion_m"]
    for zona in ZONAS:
        for i, cultivo in enumerate(esquemas.CULTIVOS_GAEZ[:3], start=1):
            lineas.append(f"{zona},{cultivo},Indicador de prueba,{40 + 10 * i},indice de prueba,9000")
    return lineas


def heladas():
    """Forma del kit A2 (paso 5) con valores de prueba: probabilidades cada 7 días del 1-feb al 12-abr."""
    fechas, d = [], datetime.date(2001, 2, 1)       # año no bisiesto cualquiera, solo para listar MM-DD
    while d <= datetime.date(2001, 4, 12):
        fechas.append(d.strftime("%m-%d"))
        d += datetime.timedelta(days=7)
    paso = 0.9 / (len(fechas) - 1)
    return {
        "_encabezado": ENCABEZADO, "_nota": ROTULO,
        "ultima_primavera": {"p10": "02-20", "p50": "03-12", "p90": "04-02"},
        "primera_otono": {"p10": "10-28", "p50": "11-14", "p90": "12-01"},
        "prob_helada_despues_de": {f: round(0.95 - i * paso, 2) for i, f in enumerate(fechas)},
        "fuente": f"Tmin de eto_diaria.csv {ROTULO}",
    }


def et_contraste():
    lineas = ["mes,et_modelo_mm,et_ssebop_mm,et_wapor_mm"]
    for mes in MESES_PARCELA:
        s = onda(30 * int(mes[5:]), 100)
        lineas.append(f"{mes},{90 + 80 * s:.1f},{60 + 40 * s:.1f},")
    return lineas


def fuente_de_prueba(nombre):
    """Texto de «fuente» DE PRUEBA de una entrega (el de fuentes.json). El de contexto_regional.csv
    es largo a propósito: un producto de prueba por cada fuente del contrato, con sus variables."""
    base = f"{nombre}: {ROTULO}"
    if nombre != "contexto_regional.csv":
        return base
    productos = "; ".join(
        f"{fuente} = PRODUCTO/DE/PRUEBA/{fuente.upper()} "
        f"(variables de prueba: {', '.join(v for f, v, _ in esquemas.COMBINACIONES_CONTEXTO if f == fuente)}; "
        f"celda de prueba de {RESOLUCIONES_PRUEBA[fuente]} m)"
        for fuente in esquemas.FUENTES_CONTEXTO)
    return (f"{base}. Texto largo a propósito, como una línea de LEEME que enumera sus productos: {productos}. "
            "Periodo de prueba: el del archivo")


def escribir_processed(destino):
    """Escribe en `destino` el data/processed DE PRUEBA y devuelve la lista de archivos."""
    destino = Path(destino)
    destino.mkdir(parents=True, exist_ok=True)
    archivos = {}
    for zona in ZONAS:
        archivos[contexto_web.nombre_de_zona("eto_diaria.csv", zona)] = clima_power(zona)
        archivos[contexto_web.nombre_de_zona("imerg_diaria.csv", zona)] = clima_imerg(zona)
    archivos["contexto_regional.csv"] = contexto_regional()
    archivos["gedi_parcelas.csv"] = gedi_parcelas()
    archivos["ecostress_parcelas.csv"] = ecostress_parcelas()
    archivos["gaez_zona.csv"] = gaez_zona()
    archivos["et_contraste.csv"] = et_contraste()
    for nombre, lineas in archivos.items():
        escribir(destino / nombre, lineas)
    (destino / "heladas.json").write_text(json.dumps(heladas(), ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    (destino / "supuestos.json").write_text(json.dumps(supuestos(), ensure_ascii=False, indent=1) + "\n",
                                            encoding="utf-8")
    nombres = sorted([*archivos, "heladas.json", "supuestos.json"])
    fuentes = {"_encabezado": ENCABEZADO, "_nota": ROTULO, "generado": GENERADO_PRUEBA,
               "fuentes": [{"archivo": n, "tipo": "entrega", "fuente": fuente_de_prueba(n), "fecha": FECHA_PRUEBA,
                            "script": "tests/fixtures/contexto_reto/generar.py"} for n in nombres]}
    (destino / "fuentes.json").write_text(json.dumps(fuentes, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return nombres


def contexto_de_prueba(processed):
    """contexto.json DE PRUEBA (dict) de un processed de prueba, con «generado» fijo y su rótulo."""
    catalogo = json.loads((RAIZ / "data/recursos_reto.json").read_text(encoding="utf-8"))
    contexto, avisos = contexto_web.armar(processed, PARAMS, catalogo)
    assert not avisos, avisos
    contexto["generado"] = GENERADO_PRUEBA
    contexto["_nota"] = f"{ROTULO}. Lo regenera tests/fixtures/contexto_reto/generar.py."
    return contexto


def texto_json(contexto):
    return json.dumps(contexto, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n"


def main():
    with tempfile.TemporaryDirectory() as tmp:
        escribir_processed(tmp)
        SALIDA_JSON.write_text(texto_json(contexto_de_prueba(tmp)), encoding="utf-8")
    print(f"{SALIDA_JSON.relative_to(RAIZ)}: {SALIDA_JSON.stat().st_size:,} bytes (DATOS DE PRUEBA)")


if __name__ == "__main__":
    main()
