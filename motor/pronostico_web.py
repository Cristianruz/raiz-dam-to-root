# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
"""Series anuales completas, demanda A5 y retroprueba temporal de la lluvia de NASA POWER (web/data/pronostico.json).

No estima rendimiento ni valida la demanda contra riegos observados. La lluvia que publica es un RANGO HISTÓRICO
(cuantiles de los ciclos octubre–septiembre ya observados), no un pronóstico de la lluvia ni de la presa.

Los supuestos de diseño (mínimo de ciclos de la retroprueba, niveles del plan, cuantiles del rango y su cobertura
nominal) se leen de data/params.json → tablero; la variante de lluvia, de params.lluvia_pct, y las conversiones
de unidades, de params.unidades.millar. Aquí no se escribe ninguna de esas cifras (regla 2).
Los textos que el tablero muestra salen en inglés (regla 9); las llaves no cambian (las lee web/js/).
Uso: python motor/pronostico_web.py · Verificación: python motor/verificar_pronostico.py · Pruebas: tests/test_pronostico_web.py
"""
import calendar
import csv
import datetime as dt
import hashlib
import importlib.util
import json
import math
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
if str(RAIZ) not in sys.path:  # para correrlo como «python motor/pronostico_web.py»
    sys.path.insert(0, str(RAIZ))
from motor.dashboard_web import en_ingles, nombres_en  # noqa: E402 - nombre en inglés de cada rotación (catálogo B3)


def cuantil(valores, q):
    valores = sorted(valores)
    if not valores:
        return None
    pos = (len(valores) - 1) * q
    lo = int(pos)
    hi = min(lo + 1, len(valores) - 1)
    return valores[lo] + (valores[hi] - valores[lo]) * (pos - lo)


def leer_supuestos(raiz=RAIZ):
    """Supuestos de diseño del tablero, de data/params.json (bloques tablero, lluvia_pct y unidades.millar).
    Si falta alguno se detiene con KeyError: no hay valores por omisión escritos en el código."""
    params = json.loads((Path(raiz) / 'data/params.json').read_text(encoding='utf-8'))
    tablero = params['tablero']
    intervalo = tablero['intervalo_lluvia']['valor']
    nominal = tablero['cobertura_nominal']['valor']
    if not math.isclose(intervalo[1] - intervalo[0], nominal, abs_tol=1e-9):
        raise ValueError(f'params.tablero: cobertura_nominal ({nominal}) no es la distancia entre los cuantiles '
                         f'de intervalo_lluvia ({intervalo})')
    if tablero['nivel_plan']['valor'] not in tablero['niveles_plan']['valor']:
        raise ValueError('params.tablero: nivel_plan debe ser uno de niveles_plan')
    return {'minimo_ciclos': tablero['minimo_ciclos']['valor'], 'niveles_plan': tablero['niveles_plan']['valor'],
            'nivel_plan': tablero['nivel_plan']['valor'], 'intervalo': intervalo, 'cobertura_nominal': nominal,
            # Variantes de lluvia del cubo: (llave, factor de la lluvia diaria). −20 % → factor 0.8.
            'lluvia': [(str(pct), (100 + pct) / 100) for pct in params['lluvia_pct']['valor']],
            'millar': params['unidades']['millar']['valor']}


def mediana(valores):
    """Centro del rango: el cuantil medio (la mediana)."""
    return cuantil(valores, 1 / 2)


def retroprueba(serie, minimo, intervalo=None, cobertura_nominal=None):
    """Origen expansivo: nunca usa el año objetivo ni años posteriores. «minimo»: ciclos previos que se exigen
    (params.tablero.minimo_ciclos); «intervalo»: los dos cuantiles del rango (params.tablero.intervalo_lluvia; sin
    él se leen de data/params.json)."""
    if intervalo is None:
        supuestos = leer_supuestos()
        intervalo, cobertura_nominal = supuestos['intervalo'], supuestos['cobertura_nominal']
    bajo, alto = intervalo
    salida = []
    for i in range(minimo, len(serie)):
        antes = serie[:i]
        lluvia = [x['lluvia_mm'] for x in antes]
        salida.append({'anio': serie[i]['anio'], 'entrenamiento_fin': antes[-1]['anio'],
                       'observado_mm': serie[i]['lluvia_mm'], 'p10_mm': cuantil(lluvia, bajo),
                       'p50_mm': mediana(lluvia), 'p90_mm': cuantil(lluvia, alto),
                       'persistencia_mm': antes[-1]['lluvia_mm']})
    if not salida:
        return {'casos': [], 'n': 0, 'mae_mm': None, 'cobertura': None, 'mae_persistencia_mm': None}
    n = len(salida)
    mae = sum(abs(x['observado_mm'] - x['p50_mm']) for x in salida) / n
    base = sum(abs(x['observado_mm'] - x['persistencia_mm']) for x in salida) / n
    return {'casos': salida, 'n': n, 'mae_mm': mae, 'mae_persistencia_mm': base,
            'habilidad_vs_persistencia': 1 - mae / base if base else None,
            'cobertura': sum(x['p10_mm'] <= x['observado_mm'] <= x['p90_mm'] for x in salida) / n,
            'cobertura_nominal': cobertura_nominal}


def leer_clima(ruta):
    clima = {}
    with ruta.open(encoding='utf-8-sig', newline='') as f:
        for fila in csv.DictReader(f):
            try:
                valores = tuple(float(fila[k]) for k in ('eto_mm', 'lluvia_mm', 'tmin'))
                if all(math.isfinite(x) and x > -900 for x in valores) and min(valores[:2]) >= 0:
                    fecha = dt.date.fromisoformat(fila['fecha'])
                    if fecha in clima:
                        raise ValueError(f'Fecha duplicada en {ruta.name}: {fecha}')
                    clima[fecha] = valores
            except (TypeError, KeyError):
                continue
    return clima


def anios_completos(clima):
    if not clima:
        return []
    salida = []
    for anio in range(min(clima).year + 1, max(clima).year + 1):
        inicio, fin = dt.date(anio-1, 10, 1), dt.date(anio, 9, 30)
        fechas = [inicio + dt.timedelta(days=i) for i in range((fin-inicio).days+1)]
        if all(f in clima for f in fechas):
            salida.append({'anio': anio, 'lluvia_mm': sum(clima[d][1] for d in fechas),
                           'eto_mm': sum(clima[d][0] for d in fechas),
                           'dias_helada': sum(clima[d][2] <= 0 for d in fechas)})
    return salida


def cargar_a5(raiz):
    # Reutilizar las fórmulas del motor; instancia nueva por zona para no compartir su caché.
    carpeta = raiz / 'datos/colab'
    sys.path.insert(0, str(carpeta))
    try:
        spec = importlib.util.spec_from_file_location('a5_pronostico', carpeta / 'A5_demanda_plazo.py')
        modulo = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(modulo)
        return modulo
    finally:
        sys.path.pop(0)


def construir(raiz=RAIZ):
    raiz = Path(raiz)
    proc = raiz / 'data/processed'
    archivos = ['opciones_b3.json', 'suelo_requisitos.json', 'supuestos.json', 'fuentes.json']
    sup = leer_supuestos(raiz)
    millar = sup['millar']
    out = {'_encabezado': 'AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex',
           'metodo': {'nombre': 'Historical rainfall range (NASA POWER) and FAO-56 crop water demand (A5 model)',
                      'minimo_entrenamiento': sup['minimo_ciclos'], 'niveles_plan': sup['niveles_plan'],
                      'intervalo': sup['intervalo'], 'nivel_plan': sup['nivel_plan'],
                      'conversion_mm_millares_ha': millar['lamina_mm'], 'cm_por_millar': millar['lamina_cm'],
                      'm3_por_millar': millar['m3_por_ha'],
                      'etiqueta': '[S] planning method: not a yield estimate and not a projection of dam water',
                      'fuente': 'FAO-56 and datos/colab/A5_demanda_plazo.py for the demand; back-test of the annual '
                                'rainfall with an expanding window that uses no later years. Design assumptions: '
                                'data/params.json, block tablero'},
           'catalogo': json.loads((proc / 'opciones_b3.json').read_text(encoding='utf-8')),
           'requisitos': json.loads((proc / 'suelo_requisitos.json').read_text(encoding='utf-8')),
           'supuestos': json.loads((proc / 'supuestos.json').read_text(encoding='utf-8')), 'zonas': {}}
    for zona, suf in [('delicias_saucillo', ''), ('lazaro_cardenas', '_lazaro_cardenas')]:
        nombre_clima, nombre_rot = f'eto_diaria{suf}.csv', f'rotaciones{suf}.json'
        archivos += [nombre_clima, nombre_rot]
        if not (proc/nombre_clima).exists() or not (proc/nombre_rot).exists():
            out['zonas'][zona] = None
            continue
        clima = leer_clima(proc / nombre_clima)
        rot = json.loads((proc / nombre_rot).read_text(encoding='utf-8'))
        serie = anios_completos(clima)
        # Mantener el inicio climático del modelo; incluir solo nuevos ciclos completamente observados.
        inicio = rot['params']['periodo_clima']['valor'][0]
        serie = [x for x in serie if x['anio'] > inicio]
        nombres = nombres_en(raiz)
        modelo = cargar_a5(raiz)
        modelo.CULTIVOS = rot['cultivos']
        modelo._CACHE.clear()
        clima_a5 = {d: v[:2] for d, v in clima.items()}
        demandas = {}
        for r in rot['rotaciones']:
            reduccion = None
            if r['id'] == 'alfalfa_corte_verano':
                cv = rot['params']['corte_verano_moderado']['valor']
                fr = sum(cv['riegos_omitidos']) / len(cv['riegos_omitidos']) / cv['riegos_jul_sep']
                reduccion = {m: fr for m in (7,8,9)}
            filas = []
            for anual in serie:
                fila = {'anio': anual['anio'], 'lluvia': {}}
                for lluvia, factor in sup['lluvia']:
                    neta, etc = modelo.neta_anio(r['cultivos'], anual['anio'], clima_a5, 0, factor, reduccion)
                    fila['lluvia'][lluvia] = {'neta_mm': round(neta, 6), 'etc_mm': round(etc, 6)}
                filas.append(fila)
            pres = [0.,0.]
            for cultivo in r['cultivos']:
                c = rot['cultivos'][cultivo]
                if not c.get('perenne'):
                    fijo = c.get('presiembra_fija')
                    margen = [fijo,fijo] if fijo is not None else rot['params']['presiembra_mm']['valor']
                    pres = [a+b for a,b in zip(pres,margen)]
            demandas[r['id']] = {**en_ingles(r, nombres), 'presiembra_mm': pres, 'serie': filas,
                                  'fecha_base': {c: rot['cultivos'][c].get('siembra') for c in r['cultivos']}}
        # Frecuencia histórica exacta desde cada fecha de primavera; sin interpolar semanas.
        heladas = {}
        inicio_cal = dt.date(2024,1,1)
        for i in range(182):
            ref = inicio_cal + dt.timedelta(days=i)
            mmdd = ref.strftime('%m-%d')
            casos_helada = []
            for anual in serie:
                anio = anual['anio']
                try:
                    dia = dt.date(anio,ref.month,ref.day)
                except ValueError:
                    continue
                fin_helada = dt.date(anio,6,30)
                fechas = [dia+dt.timedelta(days=j) for j in range((fin_helada-dia).days+1)]
                if all(f in clima for f in fechas):
                    casos_helada.append(any(clima[f][2]<=0 for f in fechas))
            heladas[mmdd] = {'n':len(casos_helada), 'con_helada':sum(casos_helada),
                             'frecuencia':sum(casos_helada)/len(casos_helada) if casos_helada else None}
        lluvia = [x['lluvia_mm'] for x in serie]
        out['zonas'][zona] = {'fuente_clima': f'data/processed/{nombre_clima}',
            'heladas_primavera':heladas, 'clima_origen': 'NASA POWER (regional grid cell); ETo by FAO-56. Not an SMN weather station and not a rain gauge in the field.',
            'fecha_corte': str(max(clima)) if clima else None,
            'anios': serie, 'rotaciones': demandas, 'parametros': rot['params'],
            'ciclos_excluidos': [
                {'anio': anio, 'dias_faltantes': sum(dt.date(anio-1,10,1)+dt.timedelta(days=i) not in clima
                   for i in range((dt.date(anio,9,30)-dt.date(anio-1,10,1)).days+1))}
                for anio in range(inicio+1,max(clima).year+1)
                if dt.date(anio,9,30)<=max(clima) and anio not in {x['anio'] for x in serie}],
            'validacion_lluvia': retroprueba(serie, sup['minimo_ciclos'], sup['intervalo'], sup['cobertura_nominal']),
            'pronostico_lluvia': {'anio': max(serie[-1]['anio']+1,max(clima).year+int(max(clima).month>=10)) if serie else None,
                                  'p10_mm': cuantil(lluvia, sup['intervalo'][0]), 'p50_mm': mediana(lluvia),
                                  'p90_mm': cuantil(lluvia, sup['intervalo'][1]), 'n': len(serie),
                                  # Lo que este bloque es, en palabras (la llave se conserva porque web/js la lee).
                                  'titulo': 'Historical rainfall range (NASA POWER)',
                                  'periodo': [serie[0]['anio'], serie[-1]['anio']] if serie else None,
                                  'nota': 'Range of the rainfall of the complete October–September cycles on '
                                          'record: lower and upper quantiles and the median. It describes past '
                                          'years; it does not say what a coming year will bring, and it says '
                                          'nothing about dam water.'}}
    archivos += ['../params.json']
    out['fuentes'] = [{'archivo': str((proc/a).resolve().relative_to(raiz)),
                       'sha256': hashlib.sha256((proc/a).read_bytes()).hexdigest()}
                      for a in archivos if (proc/a).exists()]
    for codigo in ['motor/pronostico_web.py','datos/colab/A5_demanda_plazo.py','web/js/recomendador.js','web/js/asesor.js','web/data/suelo.json','web/data/parcelas.geojson','web/data/cubo.json']:
        ruta = raiz / codigo
        if ruta.exists():
            out['fuentes'].append({'archivo': codigo, 'sha256': hashlib.sha256(ruta.read_bytes()).hexdigest()})
    destino = raiz / 'web/data/pronostico.json'
    destino.write_text(json.dumps(out,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    return {'ejecutado': True, 'zonas': list(out['zonas'])}


if __name__ == '__main__':
    print(construir())
