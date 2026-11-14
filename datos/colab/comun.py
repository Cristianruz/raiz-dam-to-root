# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Utilidades comunes de las piezas de datos: carpeta de trabajo y registro de fuentes con sha256."""
import argparse
import csv
import datetime as dt
import hashlib
import os


def carpeta(descripcion, extra=None):
    """Lee --dir (por omisión, la carpeta actual) y se cambia a ella. Devuelve los argumentos."""
    ap = argparse.ArgumentParser(description=descripcion)
    ap.add_argument("--dir", default=".", help="carpeta de trabajo, p. ej. data/processed")
    if extra:
        extra(ap)
    a = ap.parse_args()
    os.chdir(a.dir)
    return a


def sha256(ruta):
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for bloque in iter(lambda: f.read(1 << 20), b""):
            h.update(bloque)
    return h.hexdigest()


def registrar_fuentes(pieza, salidas, fuente, script):
    """Escribe fuentes_<pieza>.csv: archivo | fuente | fecha | script | sha256."""
    with open(f"fuentes_{pieza}.csv", "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["archivo", "fuente", "fecha", "script", "sha256"])
        for s in salidas:
            if os.path.exists(s):
                w.writerow([s, fuente, dt.date.today().isoformat(), script, sha256(s)])
