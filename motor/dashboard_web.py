# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; Codex dashboard.
"""Publica las referencias curadas y las rotaciones por zona, sin recalcular el modelo."""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent


def construir(raiz=RAIZ):
    raiz = Path(raiz)
    datos = json.loads((raiz / 'data/investigacion_dashboard.json').read_text())
    datos['rotaciones'] = {}
    for zona, archivo in [('delicias_saucillo', 'rotaciones.json'),
                          ('lazaro_cardenas', 'rotaciones_lazaro_cardenas.json')]:
        origen = raiz / 'data/processed' / archivo
        datos['rotaciones'][zona] = json.loads(origen.read_text())['rotaciones'] if origen.exists() else None
    destino = raiz / 'web/data/dashboard.json'
    destino.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + '\n')
    return datos


if __name__ == '__main__':
    construir()
