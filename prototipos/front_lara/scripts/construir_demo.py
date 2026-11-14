#!/usr/bin/env python3
"""Genera dist/raiz-demo.html: el prototipo completo en UN solo archivo
(Leaflet, estilos, código y datos incrustados). Se abre con doble clic,
sin servidor y sin internet — ideal como respaldo para la demo.

Uso:  python3 scripts/construir_demo.py
"""
import json
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "web"
DIST = RAIZ / "dist"


def leer(p):
    return (WEB / p).read_text(encoding="utf-8")


def script_seguro(js):
    return js.replace("</script", "<\\/script")


datos = {
    "parcelas": json.loads(leer("data/parcelas.geojson")),
    "escenarios": json.loads(leer("data/escenarios.json")),
    "cultivos": json.loads(leer("data/cultivos.json")),
}

html = leer("index.html")
html = html.replace('<link rel="stylesheet" href="vendor/leaflet.css">', f"<style>{leer('vendor/leaflet.css')}</style>")
html = html.replace('<link rel="stylesheet" href="styles.css">', f"<style>{leer('styles.css')}</style>")
html = html.replace('<script src="vendor/leaflet.js"></script>', f"<script>{script_seguro(leer('vendor/leaflet.js'))}</script>")
html = html.replace('<script src="calculos.js"></script>',
                    f"<script>window.RAIZ_DATA = {script_seguro(json.dumps(datos, ensure_ascii=False))};</script>\n"
                    f"  <script>{script_seguro(leer('calculos.js'))}</script>")
html = html.replace('<script src="app.js"></script>', f"<script>{script_seguro(leer('app.js'))}</script>")

assert 'src="' not in html.split("<body>")[1].split("<svg")[0], "Quedó un recurso externo sin incrustar"
DIST.mkdir(exist_ok=True)
(DIST / "raiz-demo.html").write_text(html, encoding="utf-8")
print(f"OK → {DIST / 'raiz-demo.html'} ({len(html) // 1024} KB)")
