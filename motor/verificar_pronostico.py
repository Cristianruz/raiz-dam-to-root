# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex
"""Verificación reproducible con biblioteca estándar: hashes, lluvia original y retroprueba.

Comprueba web/data/pronostico.json contra sus archivos de origen. Corre dentro del comando único como prueba de
pytest (tests/test_pronostico_web.py::test_verificador_pasa_con_lo_publicado) y suelto: python motor/verificar_pronostico.py
"""
import csv
import hashlib
import json
import math
import statistics
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def verificar(raiz=RAIZ):
    raiz = Path(raiz)
    datos = json.loads((raiz/'web/data/pronostico.json').read_text(encoding='utf-8'))
    checks=[]
    def check(nombre,ok):
        checks.append({'nombre':nombre,'ok':bool(ok)})
    for fuente in datos['fuentes']:
        ruta=raiz/fuente['archivo']
        check(f"Hash: {fuente['archivo']}",ruta.is_file() and hashlib.sha256(ruta.read_bytes()).hexdigest()==fuente['sha256'])
    for nombre,zona in datos['zonas'].items():
        if zona is None:
            continue
        with (raiz/zona['fuente_clima']).open(encoding='utf-8-sig', newline='') as f:
            diario=list(csv.DictReader(f))
        for row in zona['anios']:
            total=sum(float(r['lluvia_mm']) for r in diario if f"{row['anio']-1}-10-01"<=r['fecha']<=f"{row['anio']}-09-30")
            check(f"{nombre}: lluvia original {row['anio']}",math.isclose(total,row['lluvia_mm'],abs_tol=1e-6))
        casos=zona['validacion_lluvia']['casos']
        for caso in casos:
            anteriores=[r for r in zona['anios'] if r['anio']<caso['anio']]
            check(f"{nombre}: sin futuro {caso['anio']}",max(r['anio'] for r in anteriores)==caso['entrenamiento_fin']<caso['anio'])
            check(f"{nombre}: mediana anterior {caso['anio']}",math.isclose(statistics.median(r['lluvia_mm'] for r in anteriores),caso['p50_mm'],abs_tol=1e-6))
        if casos:
            mae=sum(abs(r['observado_mm']-r['p50_mm']) for r in casos)/len(casos)
            cobertura=sum(r['p10_mm']<=r['observado_mm']<=r['p90_mm'] for r in casos)/len(casos)
            check(f'{nombre}: MAE recalculado',math.isclose(mae,zona['validacion_lluvia']['mae_mm'],abs_tol=1e-6))
            check(f'{nombre}: cobertura recalculada',math.isclose(cobertura,zona['validacion_lluvia']['cobertura'],abs_tol=1e-6))
    return {'correctas':sum(c['ok'] for c in checks),'total':len(checks),
            'fallos':[c['nombre'] for c in checks if not c['ok']],
            'alcance':'Integridad y reproducción del cálculo. No valida mediciones de riego ni producción en campo.'}


if __name__=='__main__':
    reporte=verificar()
    print(json.dumps(reporte,ensure_ascii=False,indent=2))
    raise SystemExit(bool(reporte['fallos']))
