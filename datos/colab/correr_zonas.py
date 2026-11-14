# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Un comando para rehacer la entrega de las dos zonas piloto desde los datos crudos.

    python datos/colab/correr_zonas.py                       # rehace data/zonas/<zona>/ y data/entrega_zonas/
    python datos/colab/correr_zonas.py --zonas-dir <carpeta> --salida <carpeta>   # en otra carpeta (para comparar)

Requiere los crudos en el repositorio (data/raw/…) y los rásteres de Earth Engine de la rama `ee-crudos` copiados en
data/raw/ee_zonas/. No descarga nada: Earth Engine, NASA POWER y Fields of The World ya están en el crudo.
Orden por zona: B1 (parcelas) → A1 (clima) → A9b (lluvia IMERG) → A3 (HLS y memoria) → A4 (cultivos) → A5 (demanda)
→ A9 (relieve) → A7 (H3, análisis adicional por zona) → A8 (contraste de ET por zona). Al final, unir_zonas.py.
Si un paso falla, el comando se detiene y dice cuál.
"""
import argparse
import os
import shutil
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
R = lambda *p: os.path.join(RAIZ, *p)

# Por zona: punto y crudo de NASA POWER, y parcelas protagonistas (elegidas a mano; datos/LEEME.md).
ZONAS = {
    "delicias_saucillo": {"lat": 28.19, "lon": -105.45, "power": ("data/raw/power", "power_crudo_*.json"),
                          "protagonistas": "P0757,P0244"},
    "lazaro_cardenas": {"lat": 28.39, "lon": -105.61, "power": ("data/raw/zonas", "power_crudo_lazaro_cardenas_*.json"),
                        "protagonistas": "L0175"},
}
ANIOS_MEMORIA = range(2016, 2027)


def correr(script, carpeta, *args):
    orden = [sys.executable, os.path.join(AQUI, script), "--dir", carpeta, *args]
    print(f"  · {script} {' '.join(args)}", flush=True)
    r = subprocess.run(orden, capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout[-2000:], r.stderr[-2000:], sep="\n")
        raise SystemExit(f"Falló {script} en {carpeta}")
    ultima = [l for l in r.stdout.strip().splitlines() if l.strip()]
    if ultima:
        print(f"      {ultima[-1][:200]}")


def enlazar(origen, destino):
    if not os.path.exists(origen):
        raise SystemExit(f"Falta el crudo {origen} (rásteres de Earth Engine: rama ee-crudos → data/raw/ee_zonas/)")
    if os.path.lexists(destino):
        os.remove(destino)
    os.symlink(origen, destino)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--zonas-dir", default=R("data", "zonas"))
    ap.add_argument("--salida", default=R("data", "entrega_zonas"))
    a = ap.parse_args()
    zonas_dir, salida = os.path.abspath(a.zonas_dir), os.path.abspath(a.salida)
    ee = R("data", "raw", "ee_zonas")
    for z, cfg in ZONAS.items():
        d = os.path.join(zonas_dir, z)
        os.makedirs(d, exist_ok=True)
        print(f"Zona {z} → {d}", flush=True)
        shutil.copyfile(R("datos", "supuestos.json"), os.path.join(d, "supuestos.json"))
        enlazar(os.path.join(ee, f"hls_mensual_2025_10_a_2026_09_{z}.tif"), os.path.join(d, "hls_mensual_2025_10_a_2026_09.tif"))
        for y in ANIOS_MEMORIA:
            enlazar(os.path.join(ee, f"hls_ndvi_memoria_{y}_{z}.tif"), os.path.join(d, f"hls_ndvi_memoria_{y}.tif"))
        enlazar(os.path.join(ee, f"nasadem_{z}.tif"), os.path.join(d, "nasadem_zona_piloto.tif"))
        correr("B1_parcelas_ftw.py", d, "--crudo", R("data", "raw", "zonas", f"ftw_crudo_{z}.geojson"), "--zona", z,
               "--protagonistas", cfg["protagonistas"])
        correr("A1_power_eto.py", d, "--crudo", R(cfg["power"][0]), "--patron", cfg["power"][1],
               "--lat", str(cfg["lat"]), "--lon", str(cfg["lon"]))
        correr("A9b_imerg.py", d, "--crudo", ee, "--patron", f"imerg_{z}_*.csv")
        correr("A3_parcelas_hls.py", d)
        correr("A4_cultivos_reglas.py", d)
        correr("A5_demanda_plazo.py", d)
        correr("A9_relieve.py", d)
        correr("A7_h3.py", d)
        correr("A8_et_contraste.py", d, "--ssebop", R("data", "raw", "ssebop", f"ssebop_{z}_mensual.csv"))
    print("Entrega", flush=True)
    r = subprocess.run([sys.executable, os.path.join(AQUI, "unir_zonas.py"), "--zonas", zonas_dir, "--salida", salida],
                       capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stdout[-2000:], r.stderr[-2000:], sep="\n")
        raise SystemExit("Falló unir_zonas.py")
    print(f"  {len(r.stdout.strip().splitlines())} archivos en {salida} (más LEEME.md)")


if __name__ == "__main__":
    main()
