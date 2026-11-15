# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
"""Datos del tablero (motor/dashboard_web.py): conserva la demanda de cada zona, no suple datos faltantes, lee la
superficie regada del CSV de Conagua (no la teclea) y el manifest etiqueta cada cifra con la de su origen."""
import csv
import json
from pathlib import Path

import pytest

from motor.dashboard_web import construir, leer_superficies
from motor.manifest import generar

RAIZ = Path(__file__).resolve().parent.parent
CURADO = RAIZ / 'data/investigacion_dashboard.json'
CSV_CONAGUA = RAIZ / 'data/raw/conagua/dr005_superficies_volumenes_1998_2025.csv'
ZONAS = [('delicias_saucillo', 'rotaciones.json'), ('lazaro_cardenas', 'rotaciones_lazaro_cardenas.json')]
VARIANTES = ('nombre_es', 'nombre_pt', 'nombre_fr')


def publicado():
    return json.loads((RAIZ / 'web/data/dashboard.json').read_text(encoding='utf-8'))


def test_rotaciones_son_copia_exacta_por_zona_salvo_el_nombre_por_idioma():
    """Las cifras son las de la entrega; solo cambia «nombre» (inglés) y el de la entrega queda en nombre_es."""
    datos = publicado()
    for zona, nombre in ZONAS:
        origen = json.loads((RAIZ / 'data/processed' / nombre).read_text(encoding='utf-8'))['rotaciones']
        salida = datos['rotaciones'][zona]
        assert [r['id'] for r in salida] == [r['id'] for r in origen]
        for r, o in zip(salida, origen):
            sin_nombres = {k: v for k, v in r.items() if k != 'nombre' and k not in VARIANTES}
            assert sin_nombres == {k: v for k, v in o.items() if k != 'nombre'}, r['id']
            assert r['nombre_es'] == o['nombre'], r['id']
            assert all(r.get(k) for k in ('nombre',) + VARIANTES), r['id']


def test_zona_sin_entrega_es_null_y_no_copia_la_otra(tmp_path):
    (tmp_path / 'data/processed').mkdir(parents=True)
    (tmp_path / 'web/data').mkdir(parents=True)
    (tmp_path / 'data/investigacion_dashboard.json').write_text('{"eventos": []}')
    (tmp_path / 'data/processed/rotaciones.json').write_text('{"rotaciones": [{"id": "prueba"}]}')
    datos = construir(tmp_path)
    assert datos['rotaciones']['delicias_saucillo'] == [{'id': 'prueba'}]
    assert datos['rotaciones']['lazaro_cardenas'] is None


def test_referencia_ausente_falla_sin_inventar(tmp_path):
    with pytest.raises(FileNotFoundError):
        construir(tmp_path)


# --- Cifras con origen (regla 2): la superficie regada sale del CSV de Conagua ------------------------------
def test_el_archivo_curado_no_teclea_superficies():
    curado = json.loads(CURADO.read_text(encoding='utf-8'))
    assert 'historia' not in curado, 'la superficie regada no se teclea: el motor la lee del CSV de Conagua'
    assert 'superficie_ha' not in CURADO.read_text(encoding='utf-8')
    assert (RAIZ / curado['historia_archivo']) == CSV_CONAGUA and curado['historia_columna'] == 'sup_total_ha'


def test_historia_publicada_es_la_columna_del_csv_de_conagua():
    curado = json.loads(CURADO.read_text(encoding='utf-8'))
    with CSV_CONAGUA.open(encoding='utf-8-sig', newline='') as f:
        del_csv = {int(fila['anio']): float(fila['sup_total_ha']) for fila in csv.DictReader(f)}
    historia = publicado()['historia']
    assert [h['anio'] for h in historia] == curado['historia_anios']
    for h in historia:
        assert h['superficie_ha'] == del_csv[h['anio']], h


def test_anio_que_el_csv_no_trae_queda_en_null_y_no_se_suple(tmp_path, capsys):
    (tmp_path / 'data/raw').mkdir(parents=True)
    (tmp_path / 'web/data').mkdir(parents=True)
    (tmp_path / 'data/raw/s.csv').write_text('anio,sup_total_ha\n2001,10\n2002,\n', encoding='utf-8')
    (tmp_path / 'data/investigacion_dashboard.json').write_text(json.dumps(
        {'eventos': [], 'historia_anios': [2001, 2002, 2003], 'historia_archivo': 'data/raw/s.csv',
         'historia_columna': 'sup_total_ha'}), encoding='utf-8')
    datos = construir(tmp_path)
    assert datos['historia'] == [{'anio': 2001, 'superficie_ha': 10}, {'anio': 2002, 'superficie_ha': None},
                                 {'anio': 2003, 'superficie_ha': None}]
    assert 'historia_anios' not in datos, 'la lista de años es una llave de trabajo: se publica como «historia»'
    assert capsys.readouterr().out.count('queda en null') == 2
    assert leer_superficies(tmp_path / 'data/raw/s.csv', 'sup_total_ha') == {2001: 10, 2002: None}


def test_sin_el_csv_la_superficie_queda_en_null(tmp_path, capsys):
    (tmp_path / 'web/data').mkdir(parents=True)
    (tmp_path / 'data').mkdir(exist_ok=True)
    (tmp_path / 'data/investigacion_dashboard.json').write_text(json.dumps(
        {'eventos': [], 'historia_anios': [2001], 'historia_archivo': 'data/raw/no_esta.csv',
         'historia_columna': 'sup_total_ha'}), encoding='utf-8')
    assert construir(tmp_path)['historia'] == [{'anio': 2001, 'superficie_ha': None}]
    assert 'no está data/raw/no_esta.csv' in capsys.readouterr().out


def test_no_quedan_las_cifras_de_prensa_sin_enlace_ni_los_pdf():
    texto = (RAIZ / 'web/data/dashboard.json').read_text(encoding='utf-8') + CURADO.read_text(encoding='utf-8')
    for retirada in ('research/', '.pdf', 'Esri', 'arcgis'):
        assert retirada not in texto, f'«{retirada}» debía salir de los datos del tablero'
    # Las dos cifras de prensa sin enlace (hectáreas dañadas en 2017 y en 2022) ya no están en los eventos.
    eventos = json.dumps(publicado()['eventos'], ensure_ascii=False)
    for retirada in ('860', '9 mil', '9,000', '9 000', 'hectáreas', 'hectares'):
        assert retirada not in eventos, f'«{retirada}» debía salir de los eventos del tablero'
    assert not (RAIZ / 'web/research').exists() and not (RAIZ / 'web/fonts').exists()


# --- Manifest: cada cifra con la fuente y la etiqueta de su origen -------------------------------------------
@pytest.fixture(scope='module')
def manifest():
    return generar(escribir=False)


def de_archivo(manifest, nombre):
    return [c for c in manifest['cifras'].values() if c['archivo'] == f'web/data/{nombre}']


def test_manifest_dashboard_etiqueta_cada_cifra_con_la_de_su_origen(manifest):
    entradas = de_archivo(manifest, 'dashboard.json')
    assert entradas
    assert all(c['fuente'] and c['fecha'] and c['etiqueta'] and not c['mock'] for c in entradas)
    historia = [c for c in entradas if c['clave'].startswith('historia[')]
    assert historia and all('[V]' in c['etiqueta'] and 'dr005_superficies_volumenes_1998_2025.csv' in c['fuente']
                            for c in historia)
    eventos = [c for c in entradas if c['clave'].startswith('eventos[')]
    assert eventos and all('[P]' in c['etiqueta'] for c in eventos)
    rotaciones = [c for c in entradas if c['clave'].startswith('rotaciones.')]
    assert rotaciones and all(c['etiqueta'] == 'Cálculo' and 'data/processed/rotaciones' in c['fuente']
                              for c in rotaciones)
    assert len({c['etiqueta'] for c in entradas}) > 2, 'no todas las cifras llevan la misma etiqueta'


def test_manifest_pronostico_atribuye_metodo_a_params_y_no_a_las_entregas(manifest):
    entradas = {c['clave']: c for c in de_archivo(manifest, 'pronostico.json')}
    assert entradas
    params = json.loads((RAIZ / 'data/params.json').read_text(encoding='utf-8'))
    for clave, origen in (('metodo.minimo_entrenamiento', 'tablero.minimo_ciclos'),
                          ('metodo.nivel_plan', 'tablero.nivel_plan'),
                          ('zonas.*.validacion_lluvia.cobertura_nominal', 'tablero.cobertura_nominal')):
        c = entradas[clave]
        bloque, llave = origen.split('.')
        assert c['etiqueta'] == params[bloque][llave]['etiqueta'] == '[S]', clave
        assert origen in c['fuente'] and 'opciones_b3' not in c['fuente'], clave
    millar = entradas['metodo.m3_por_millar']
    assert millar['etiqueta'] == params['unidades']['millar']['etiqueta'] and 'unidades.millar' in millar['fuente']
    etiquetas = {c['etiqueta'] if isinstance(c['etiqueta'], str) else tuple(c['etiqueta']) for c in entradas.values()}
    assert 'Cálculo' in etiquetas and '[S]' in etiquetas and any('[V]' in str(e) for e in etiquetas), etiquetas
    serie = entradas['zonas.*.validacion_lluvia.mae_mm']
    assert serie['etiqueta'] == 'Cálculo' and 'eto_diaria' in str(serie['fuente'])
    assert all(c['fuente'] and c['fecha'] and c['etiqueta'] and not c['mock'] for c in entradas.values())
