# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Un comando para rehacer, desde los crudos del repositorio, todas las piezas de datos de la sesión de datos y
compararlas, byte por byte, con una entrega.

    python datos/colab/correr_todo.py --salida /tmp/raiz_repro
    python datos/colab/correr_todo.py --salida /tmp/raiz_repro --comparar data/entrega_zonas

Etapas, cada una en su subcarpeta de --salida:
  1. rectangulo_original/  Rectángulo del prerregistro [-105.42, 28.08, -105.32, 28.16]. B1 en la versión del commit
     522585f (la que hizo las 338 parcelas del prerregistro; el B1 actual trabaja por zonas) y, después, A1, A9b, A3, A4,
     A5, A7, A8, A6 (verdad del SIH y back-test de H1) y A6b (H1-b) en su versión actual. De aquí salen et_contraste.csv
     y h3_series.csv de la entrega y los resultados de H1 y H1-b (docs/resultado_H1.md, docs/resultado_H1b.md).
  2. zonas/ y entrega/  Las dos zonas piloto con correr_zonas.py (B1 → A1 → A9b → A3 → A4 → A5 → A9 → A7 → A8 → unir_zonas).
  3. reto/  Bases del reto y suelo: A2 (heladas), A10 (contexto regional), A11 (GEDI), A12 (nogal, referencia),
     A13 (suelo por parcela), B3 (opciones), B6 (requisitos de suelo por cultivo) y B7 (tipos de suelo, reglas de
     nutrientes y riesgo de nutrientes por parcela).
Al final copia a entrega/ lo que va al buzón y, si se da --comparar, compara cada archivo por sha256 (LEEME.md no se
compara: el de Raiz_entregas lleva detalle escrito a mano). Sale con código 1 si algún archivo difiere o falta.

Lo que este comando NO rehace, porque necesita a una persona, una cuenta o internet: las consultas de Earth Engine
(datos/earthengine/*.js), la extracción de Fields of The World en el navegador (datos/navegador/ftw_extraer.js) y las
descargas de NASA POWER, SIH y Conagua. Sus crudos están en data/raw/; los rásteres por zona, en la rama `ee-crudos`
(se copian a data/raw/ee_zonas/). Paso a paso: docs/reproducir_datos.md.
"""
import argparse
import hashlib
import os
import shutil
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(os.path.dirname(AQUI))
R = lambda *p: os.path.join(RAIZ, *p)
COMMIT_B1_ORIGINAL = "522585f"
PROTAGONISTAS_ORIGINAL = "P0097,P0110,P0118"
SIH = R("data", "raw", "sih", "LBQCH.csv")
CONAGUA = R("data", "raw", "conagua")
# Lo que va al buzón desde cada etapa (lo demás de la entrega lo arma unir_zonas.py).
DEL_RECTANGULO = ("et_contraste.csv", "h3_series.csv")
DEL_RETO = ("contexto_regional.csv", "gedi_parcelas.csv", "opciones_b3.json", "suelo_parcelas.csv",
            "suelo_requisitos.json", "suelo_tipos.json", "suelo_reglas.json", "suelo_nutrientes_parcelas.csv")


def correr(script, carpeta, *args, cwd=None):
    ruta = script if os.path.isabs(script) else os.path.join(AQUI, script)
    print(f"  · {os.path.basename(ruta)} {' '.join(os.path.basename(x) if os.sep in x else x for x in args)}", flush=True)
    r = subprocess.run([sys.executable, ruta, "--dir", carpeta, *args], capture_output=True, text=True, cwd=cwd)
    if r.returncode != 0:
        print(r.stdout[-2000:], r.stderr[-2000:], sep="\n")
        raise SystemExit(f"Falló {os.path.basename(ruta)} en {carpeta}")


def git_show(commit, ruta, destino):
    r = subprocess.run(["git", "-C", RAIZ, "show", f"{commit}:{ruta}"], capture_output=True)
    if r.returncode != 0:
        raise SystemExit(f"No se pudo leer {ruta} del commit {commit} (¿el clon tiene el historial completo?)")
    open(destino, "wb").write(r.stdout)


def sha(ruta):
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def rectangulo_original(d, salida):
    os.makedirs(d, exist_ok=True)
    print(f"1 · Rectángulo original → {d}", flush=True)
    viejo = os.path.join(salida, f"_b1_{COMMIT_B1_ORIGINAL}")
    os.makedirs(viejo, exist_ok=True)
    for f in ("B1_parcelas_ftw.py", "comun.py"):
        git_show(COMMIT_B1_ORIGINAL, f"datos/colab/{f}", os.path.join(viejo, f))
    shutil.copyfile(R("datos", "supuestos.json"), os.path.join(d, "supuestos.json"))
    for f in os.listdir(R("data", "raw", "ee")):
        if f.endswith(".tif"):
            destino = os.path.join(d, f)
            if os.path.lexists(destino):
                os.remove(destino)
            os.symlink(R("data", "raw", "ee", f), destino)
    correr(os.path.join(viejo, "B1_parcelas_ftw.py"), d, "--crudo", R("data", "raw", "ftw", "ftw_zona_piloto_crudo.geojson"),
           "--protagonistas", PROTAGONISTAS_ORIGINAL, cwd=viejo)
    correr("A1_power_eto.py", d, "--crudo", R("data", "raw", "power"))
    correr("A9b_imerg.py", d, "--crudo", R("data", "raw", "imerg"))
    for s in ("A3_parcelas_hls.py", "A4_cultivos_reglas.py", "A5_demanda_plazo.py", "A7_h3.py"):
        correr(s, d)
    correr("A8_et_contraste.py", d, "--ssebop", R("data", "raw", "ssebop", "ssebop_zona_mensual.csv"))
    correr("A6_verdad_sih.py", d, "--sih", SIH)
    correr("A6_backtest.py", d, "--conagua", CONAGUA, "--sih", SIH)
    correr("A6b_forma_historica.py", d, "--conagua", CONAGUA, "--sih", SIH)


def zonas(zonas_dir, entrega):
    print(f"2 · Dos zonas piloto → {zonas_dir} y {entrega}", flush=True)
    r = subprocess.run([sys.executable, os.path.join(AQUI, "correr_zonas.py"), "--zonas-dir", zonas_dir, "--salida", entrega])
    if r.returncode != 0:
        raise SystemExit("Falló correr_zonas.py")


def reto(d, zonas_dir, entrega):
    os.makedirs(d, exist_ok=True)
    print(f"3 · Bases del reto y suelo → {d}", flush=True)
    shutil.copyfile(R("datos", "supuestos.json"), os.path.join(d, "supuestos.json"))
    shutil.copyfile(os.path.join(entrega, "parcelas_base.geojson"), os.path.join(d, "parcelas_base.geojson"))
    base, otra = os.path.join(zonas_dir, "delicias_saucillo"), os.path.join(zonas_dir, "lazaro_cardenas")
    correr("A2_heladas.py", base, "--otra", f"lazaro_cardenas={otra}")
    shutil.copyfile(os.path.join(base, "heladas.json"), os.path.join(entrega, "heladas.json"))
    crudo = R("data", "raw", "reto")
    correr("A10_contexto_regional.py", d, "--crudo", crudo)
    correr("A11_gedi_parcelas.py", d, "--crudo", crudo)
    shutil.copyfile(os.path.join(d, "gedi_parcelas.csv"), os.path.join(entrega, "gedi_parcelas.csv"))
    correr("A12_nogal_cobertura.py", d, "--entrega", entrega)
    correr("A13_suelo_parcelas.py", d, "--crudo", crudo)
    correr("B3_opciones.py", d, "--rotaciones", os.path.join(entrega, "rotaciones.json"),
           os.path.join(entrega, "rotaciones_lazaro_cardenas.json"))
    correr("B6_suelo_requisitos.py", d, "--opciones", os.path.join(d, "opciones_b3.json"))
    correr("B7_suelo_tipos.py", d, "--suelo", os.path.join(d, "suelo_parcelas.csv"), "--supuestos", R("datos", "supuestos.json"),
           "--requisitos", os.path.join(d, "suelo_requisitos.json"))


def comparar(entrega, referencia):
    nombres = sorted(set(os.listdir(entrega)) | set(os.listdir(referencia)))
    malos = 0
    print(f"\nComparación con {referencia} (sha256):")
    for n in nombres:
        if n == "LEEME.md" or n.startswith("fuentes_"):
            continue
        a, b = os.path.join(entrega, n), os.path.join(referencia, n)
        if not os.path.exists(a) or not os.path.exists(b):
            estado = "falta en la corrida" if not os.path.exists(a) else "no está en la referencia"
            malos += 1
        else:
            estado = "igual" if sha(a) == sha(b) else "DIFIERE"
            malos += estado != "igual"
        print(f"  {estado:24s} {n}")
    print(f"{len([n for n in nombres if n != 'LEEME.md' and not n.startswith('fuentes_')]) - malos} iguales, {malos} distintos o faltantes")
    return malos


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--salida", required=True, help="carpeta nueva o vacía donde se rehace todo")
    ap.add_argument("--comparar", default=None, help="carpeta con la entrega a comparar, p. ej. data/entrega_zonas")
    a = ap.parse_args()
    salida = os.path.abspath(a.salida)
    if os.path.isdir(salida) and os.listdir(salida):
        raise SystemExit(f"{salida} no está vacía: use una carpeta nueva para que la comparación sea limpia")
    if not os.path.isdir(R("data", "raw", "ee_zonas")):
        raise SystemExit("Faltan los rásteres por zona: copie la rama ee-crudos a data/raw/ee_zonas/ (docs/reproducir_datos.md)")
    rect, zonas_dir, entrega, d_reto = (os.path.join(salida, x) for x in ("rectangulo_original", "zonas", "entrega", "reto"))
    rectangulo_original(rect, salida)
    zonas(zonas_dir, entrega)
    reto(d_reto, zonas_dir, entrega)
    for n in DEL_RECTANGULO:
        shutil.copyfile(os.path.join(rect, n), os.path.join(entrega, n))
    for n in DEL_RETO:
        shutil.copyfile(os.path.join(d_reto, n), os.path.join(entrega, n))
    shutil.copyfile(R("datos", "supuestos.json"), os.path.join(entrega, "supuestos.json"))
    print(f"\nEntrega rehecha en {entrega} ({len(os.listdir(entrega))} archivos, con el LEEME.md que genera unir_zonas.py)")
    if a.comparar:
        sys.exit(1 if comparar(entrega, os.path.abspath(a.comparar)) else 0)


if __name__ == "__main__":
    main()
