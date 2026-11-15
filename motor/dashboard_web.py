# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
"""Datos del tablero (la portada, web/index.html): referencias curadas, superficie regada y rotaciones por zona.

Lee   data/investigacion_dashboard.json   textos curados en cuatro idiomas, la lista de años de la gráfica de
                                          historia y el nombre de cada rotación en inglés, portugués y francés
      data/raw/conagua/dr005_superficies_volumenes_1998_2025.csv   superficie regada por año agrícola (Conagua)
      data/processed/rotaciones[_lazaro_cardenas].json             demanda por rotación (A5), sin recalcular
Escribe web/data/dashboard.json. No recalcula el modelo y no teclea cifras (regla 2): un año que el CSV no trae,
o un CSV que no está, deja la superficie en null y lo avisa; nunca se suple con otro valor.

Idiomas (docs/decisiones/2026-11-15_tablero_principal_idiomas.md): cada texto que el tablero muestra sale en la
llave de siempre en INGLÉS y, al lado, <llave>_es, <llave>_pt y <llave>_fr; web/js/i18n.js (deDato) elige.
Las llaves no cambian ni se quitan (las lee web/js/). De rotaciones.json solo cambia «nombre»: pasa al inglés y el
nombre de la entrega queda en «nombre_es». Los textos que vienen de las entregas de datos se quedan en inglés.
Uso: python motor/dashboard_web.py · Pruebas: tests/test_dashboard_web.py y tests/test_tablero_idiomas.py
"""
import csv
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ZONAS = (('delicias_saucillo', 'rotaciones.json'), ('lazaro_cardenas', 'rotaciones_lazaro_cardenas.json'))
CURADO = 'data/investigacion_dashboard.json'
IDIOMAS_VARIANTE = ('es', 'pt', 'fr')  # la llave sin sufijo es el inglés
# Llaves de trabajo del archivo curado que no se publican tal cual (la lista de años se publica como «historia»;
# los nombres de las rotaciones, dentro de cada rotación; los textos de pronostico.json los usa pronostico_web.py).
LLAVES_DE_TRABAJO = ('_nota', 'historia_anios', 'nombres_rotaciones', 'textos_pronostico')


def leer_json(ruta):
    return json.loads(Path(ruta).read_text(encoding='utf-8'))


def leer_curado(raiz=RAIZ):
    """El archivo curado completo (también lo lee motor/pronostico_web.py para sus textos)."""
    return leer_json(Path(raiz) / CURADO)


def nombres_rotaciones(curado):
    """{id de la rotación: {en, pt, fr}} del archivo curado; {} si no trae la tabla."""
    tabla = (curado or {}).get('nombres_rotaciones') or {}
    return {k: v for k, v in tabla.items() if isinstance(v, dict)}


def en_idiomas(rotacion, nombres):
    """Copia de la rotación con «nombre» en inglés y nombre_es (el de la entrega), nombre_pt y nombre_fr.
    Si la tabla no trae la rotación no se inventa una traducción: queda tal como llegó."""
    propios = nombres.get(rotacion.get('id')) or {}
    if not all(propios.get(c) for c in ('en', 'pt', 'fr')):
        return dict(rotacion)
    return {**rotacion, 'nombre': propios['en'], 'nombre_es': rotacion.get('nombre'),
            'nombre_pt': propios['pt'], 'nombre_fr': propios['fr']}


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
    datos = leer_curado(raiz)
    serie, avisos = historia(datos, raiz)
    if serie is not None:
        datos['historia'] = serie
    nombres = nombres_rotaciones(datos)
    for llave in LLAVES_DE_TRABAJO:
        datos.pop(llave, None)
    datos['rotaciones'] = {}
    for zona, archivo in ZONAS:
        origen = raiz / 'data/processed' / archivo
        if not origen.exists():
            datos['rotaciones'][zona] = None
            continue
        rotaciones = leer_json(origen)['rotaciones']
        sin_nombre = [r.get('id') for r in rotaciones if nombres and r.get('id') not in nombres]
        if sin_nombre:
            avisos.append(f"{CURADO} → nombres_rotaciones no trae {', '.join(map(str, sin_nombre))} ({archivo}): "
                          "su nombre queda como llegó, sin variantes de idioma")
        datos['rotaciones'][zona] = [en_idiomas(r, nombres) for r in rotaciones]
    for aviso in avisos:
        print(f"  aviso (dashboard): {aviso}")
    destino = raiz / 'web/data/dashboard.json'
    destino.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    return datos


if __name__ == '__main__':
    construir()
