# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
"""Datos del tablero (web/dashboard.html): referencias curadas, superficie regada y rotaciones por zona.

Lee   data/investigacion_dashboard.json   textos curados (en inglés) y la lista de años de la gráfica de historia
      data/raw/conagua/dr005_superficies_volumenes_1998_2025.csv   superficie regada por año agrícola (Conagua)
      data/processed/rotaciones[_lazaro_cardenas].json             demanda por rotación (A5), sin recalcular
      data/processed/opciones_b3.json                              nombre en inglés de cada rotación (nombre_en)
Escribe web/data/dashboard.json. No recalcula el modelo y no teclea cifras (regla 2): un año que el CSV no trae,
o un CSV que no está, deja la superficie en null y lo avisa; nunca se suple con otro valor.

Las llaves no cambian (las leen web/js/dashboard.js y web/js/asesor.js). Lo único que cambia respecto de
rotaciones.json es «nombre»: sale en inglés (regla 9) y el nombre original queda en «nombre_es».
Uso: python motor/dashboard_web.py · Pruebas: tests/test_dashboard_web.py
"""
import csv
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ZONAS = (('delicias_saucillo', 'rotaciones.json'), ('lazaro_cardenas', 'rotaciones_lazaro_cardenas.json'))
CATALOGO = 'data/processed/opciones_b3.json'
# Llaves de trabajo del archivo curado que no se publican tal cual (la lista de años se publica como «historia»).
LLAVES_DE_TRABAJO = ('_nota', 'historia_anios')


def leer_json(ruta):
    return json.loads(Path(ruta).read_text(encoding='utf-8'))


def nombres_en(raiz=RAIZ):
    """{id de la rotación: nombre en inglés}, del catálogo B3 (el mismo texto que usa la ficha de la página)."""
    ruta = Path(raiz) / CATALOGO
    if not ruta.exists():
        return {}
    opciones = leer_json(ruta).get('opciones') or {}
    return {k: v['nombre_en'] for k, v in opciones.items() if isinstance(v, dict) and v.get('nombre_en')}


def en_ingles(rotacion, nombres):
    """Copia de la rotación con «nombre» en inglés y el original en «nombre_es». Sin nombre_en no se inventa
    una traducción: queda el nombre original."""
    nombre = nombres.get(rotacion.get('id'))
    if not nombre:
        return dict(rotacion)
    return {**rotacion, 'nombre': nombre, 'nombre_es': rotacion.get('nombre')}


def leer_superficies(ruta, columna):
    """{año: valor de la columna} del CSV de Conagua. Celda vacía o que no es número: null."""
    salida = {}
    with Path(ruta).open(encoding='utf-8-sig', newline='') as f:
        for fila in csv.DictReader(f):
            try:
                anio = int(fila['anio'])
            except (KeyError, TypeError, ValueError):
                continue
            try:
                numero = float(fila[columna])
                salida[anio] = int(numero) if numero.is_integer() else numero
            except (KeyError, TypeError, ValueError):
                salida[anio] = None
    return salida


def historia(datos, raiz):
    """[{anio, superficie_ha}] de los años de historia_anios, leídos del CSV; (lista, avisos)."""
    anios = datos.get('historia_anios')
    if not anios:
        return None, []
    ruta = Path(raiz) / datos['historia_archivo']
    avisos, superficies = [], {}
    if ruta.exists():
        superficies = leer_superficies(ruta, datos['historia_columna'])
    else:
        avisos.append(f"no está {datos['historia_archivo']}: la superficie regada queda en null")
    for anio in anios:
        if ruta.exists() and superficies.get(anio) is None:
            avisos.append(f"{datos['historia_archivo']} no trae {datos['historia_columna']} de {anio}: queda en null")
    return [{'anio': anio, 'superficie_ha': superficies.get(anio)} for anio in anios], avisos


def construir(raiz=RAIZ):
    raiz = Path(raiz)
    datos = leer_json(raiz / 'data/investigacion_dashboard.json')
    serie, avisos = historia(datos, raiz)
    if serie is not None:
        datos['historia'] = serie
    for llave in LLAVES_DE_TRABAJO:
        datos.pop(llave, None)
    nombres = nombres_en(raiz)
    datos['rotaciones'] = {}
    for zona, archivo in ZONAS:
        origen = raiz / 'data/processed' / archivo
        datos['rotaciones'][zona] = ([en_ingles(r, nombres) for r in leer_json(origen)['rotaciones']]
                                     if origen.exists() else None)
    for aviso in avisos:
        print(f"  aviso (dashboard): {aviso}")
    destino = raiz / 'web/data/dashboard.json'
    destino.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return datos


if __name__ == '__main__':
    construir()
