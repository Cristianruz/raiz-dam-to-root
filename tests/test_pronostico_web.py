# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
"""Rango histórico de lluvia y demanda del tablero (motor/pronostico_web.py) y su verificador."""
import datetime as dt
import json
import re
from pathlib import Path
import pytest
from motor.pronostico_web import cuantil, retroprueba, anios_completos, leer_clima, cargar_a5, leer_supuestos

RAIZ = Path(__file__).resolve().parent.parent


def test_cuantiles_no_inventan_fuera_de_la_muestra():
    assert cuantil([10,20,30],.5)==20
    assert cuantil([10,20],.1)==11
    assert cuantil([],.5) is None


def test_un_solo_dia_faltante_excluye_el_ciclo_completo():
    start=dt.date(2023,10,1)
    fechas=[start+dt.timedelta(days=i) for i in range(366)]
    clima={d:(2.,1.,10.) for d in fechas}
    assert anios_completos(clima)[0]['lluvia_mm']==366
    del clima[dt.date(2024,2,29)]
    assert anios_completos(clima)==[]


def test_backtest_no_usa_el_objetivo_ni_el_futuro():
    serie=[{'anio':2000+i,'lluvia_mm':float(i)} for i in range(20)]
    base=retroprueba(serie,10)
    altered=[dict(x) for x in serie]
    altered[-1]['lluvia_mm']=1e6
    nuevo=retroprueba(altered,10)
    assert base['casos'][:-1]==nuevo['casos'][:-1]
    assert base['casos'][-1]['p50_mm']==nuevo['casos'][-1]['p50_mm']
    assert nuevo['casos'][-1]['observado_mm']!=base['casos'][-1]['observado_mm']
    assert all(x['entrenamiento_fin']<x['anio'] for x in nuevo['casos'])


def test_lluvia_publicada_es_suma_del_archivo_diario():
    datos=json.loads((RAIZ/'web/data/pronostico.json').read_text())
    for zona in datos['zonas'].values():
        clima=leer_clima(RAIZ/zona['fuente_clima'])
        row=zona['anios'][0]
        real=sum(v[1] for d,v in clima.items() if dt.date(row['anio']-1,10,1)<=d<=dt.date(row['anio'],9,30))
        assert row['lluvia_mm']==pytest.approx(real)
        assert len(zona['validacion_lluvia']['casos'])==len(zona['anios'])-datos['metodo']['minimo_entrenamiento']
        casos=zona['validacion_lluvia']['casos']
        assert zona['validacion_lluvia']['mae_mm']==pytest.approx(sum(abs(r['observado_mm']-r['p50_mm']) for r in casos)/len(casos))


def test_demanda_publicada_reutiliza_motor_a5_en_ambas_zonas():
    publicado=json.loads((RAIZ/'web/data/pronostico.json').read_text())
    for zona,suf in [('delicias_saucillo',''),('lazaro_cardenas','_lazaro_cardenas')]:
        z=publicado['zonas'][zona]
        rot=json.loads((RAIZ/f'data/processed/rotaciones{suf}.json').read_text())
        modelo=cargar_a5(RAIZ);modelo.CULTIVOS=rot['cultivos'];modelo._CACHE.clear()
        clima={d:v[:2] for d,v in leer_clima(RAIZ/z['fuente_clima']).items()}
        for cultivo in ['maiz_forrajero','chile','nogal']:
            row=z['rotaciones'][cultivo]['serie'][-1]
            neta,etc=modelo.neta_anio([cultivo],row['anio'],clima,0,1)
            assert row['lluvia']['0']['neta_mm']==pytest.approx(neta,abs=1e-5)
            assert row['lluvia']['0']['etc_mm']==pytest.approx(etc,abs=1e-5)


def test_falta_de_validacion_no_da_metricas_falsas():
    r=retroprueba([{'anio':2020,'lluvia_mm':100}],10)
    assert r['n']==0 and r['mae_mm'] is None


def test_verificador_detecta_manipulacion_de_la_prediccion(tmp_path):
    import shutil
    from motor.verificar_pronostico import verificar
    publicado=json.loads((RAIZ/'web/data/pronostico.json').read_text())
    (tmp_path/'web/data').mkdir(parents=True)
    for fuente in publicado['fuentes']:
        origen=RAIZ/fuente['archivo']
        destino=tmp_path/fuente['archivo']
        destino.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(origen,destino)
    salida=tmp_path/'web/data/pronostico.json'
    salida.write_text(json.dumps(publicado))
    assert verificar(tmp_path)['fallos']==[]
    publicado['zonas']['delicias_saucillo']['validacion_lluvia']['casos'][0]['p50_mm']+=100
    salida.write_text(json.dumps(publicado))
    reporte=verificar(tmp_path)
    assert any('mediana anterior' in f for f in reporte['fallos'])
    assert any('MAE' in f for f in reporte['fallos'])


# --- Supuestos de diseño en data/params.json (regla 2) y verificador dentro del comando único -----------------
def test_verificador_pasa_con_lo_publicado():
    """motor/verificar_pronostico.py corre dentro de pytest (y por eso de `python construir.py`): hashes de los
    archivos de origen, lluvia de cada ciclo contra el archivo diario, retroprueba sin años posteriores."""
    from motor.verificar_pronostico import verificar
    reporte = verificar(RAIZ)
    assert reporte['total'] > 0 and reporte['fallos'] == [], reporte['fallos'][:10]
    assert reporte['correctas'] == reporte['total']


def test_metodo_publica_los_supuestos_de_params_y_no_cifras_del_codigo():
    params = json.loads((RAIZ / 'data/params.json').read_text(encoding='utf-8'))
    tablero, millar = params['tablero'], params['unidades']['millar']['valor']
    metodo = json.loads((RAIZ / 'web/data/pronostico.json').read_text(encoding='utf-8'))['metodo']
    assert metodo['minimo_entrenamiento'] == tablero['minimo_ciclos']['valor']
    assert metodo['niveles_plan'] == tablero['niveles_plan']['valor']
    assert metodo['nivel_plan'] == tablero['nivel_plan']['valor']
    assert metodo['intervalo'] == tablero['intervalo_lluvia']['valor']
    assert (metodo['conversion_mm_millares_ha'], metodo['cm_por_millar'], metodo['m3_por_millar']) == (
        millar['lamina_mm'], millar['lamina_cm'], millar['m3_por_ha'])
    for entrada in tablero.values():
        assert entrada['etiqueta'] == '[S]' and entrada['fuente'] and entrada['fuente_en'] and entrada['nota']
        assert 'valor' in entrada and entrada['unidad']


def test_supuestos_incoherentes_detienen_el_motor(tmp_path):
    params = json.loads((RAIZ / 'data/params.json').read_text(encoding='utf-8'))
    params['tablero']['cobertura_nominal']['valor'] = 0.5
    (tmp_path / 'data').mkdir()
    (tmp_path / 'data/params.json').write_text(json.dumps(params), encoding='utf-8')
    with pytest.raises(ValueError):
        leer_supuestos(tmp_path)
    del params['tablero']
    (tmp_path / 'data/params.json').write_text(json.dumps(params), encoding='utf-8')
    with pytest.raises(KeyError):
        leer_supuestos(tmp_path)


def test_la_variante_de_lluvia_sale_de_params_lluvia_pct():
    params = json.loads((RAIZ / 'data/params.json').read_text(encoding='utf-8'))
    sup = leer_supuestos(RAIZ)
    assert [k for k, _ in sup['lluvia']] == [str(p) for p in params['lluvia_pct']['valor']]
    assert all(f == pytest.approx(1 + p / 100) for (_, f), p in zip(sup['lluvia'], params['lluvia_pct']['valor']))
    publicado = json.loads((RAIZ / 'web/data/pronostico.json').read_text(encoding='utf-8'))
    fila = publicado['zonas']['delicias_saucillo']['rotaciones']['alfalfa']['serie'][0]
    assert list(fila['lluvia']) == [k for k, _ in sup['lluvia']]


def test_el_motor_no_trae_los_supuestos_escritos_en_el_codigo():
    """Ni el mínimo de ciclos, ni los niveles, ni los cuantiles, ni la cobertura nominal, ni el factor de lluvia."""
    codigo = (RAIZ / 'motor/pronostico_web.py').read_text(encoding='utf-8')
    sin_comentarios = '\n'.join(l.split('#')[0] for l in codigo.split('\n'))
    assert not re.search(r'(?<![\w.])0?\.(1|8|9|95)\b', sin_comentarios), 'quedan cuantiles o factores escritos en el código'
    assert 'minimo=10' not in sin_comentarios and "'minimo_entrenamiento': 10" not in sin_comentarios


def test_la_retroprueba_publica_el_resultado_sea_favorable_o_no():
    """Lo que LIMITATIONS.md cita: error medio contra «repetir el año anterior» y años dentro del rango, por zona."""
    zonas = json.loads((RAIZ / 'web/data/pronostico.json').read_text(encoding='utf-8'))['zonas']
    for zona in zonas.values():
        v = zona['validacion_lluvia']
        dentro = sum(c['p10_mm'] <= c['observado_mm'] <= c['p90_mm'] for c in v['casos'])
        assert v['cobertura'] == pytest.approx(dentro / v['n'])
        assert v['mae_persistencia_mm'] == pytest.approx(
            sum(abs(c['observado_mm'] - c['persistencia_mm']) for c in v['casos']) / v['n'])
        assert v['cobertura_nominal'] == leer_supuestos(RAIZ)['cobertura_nominal']
