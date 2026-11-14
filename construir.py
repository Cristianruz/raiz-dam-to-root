#!/usr/bin/env python3
# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Comando único de reconstrucción (kit v4 §0.2 y K-INT; CLAUDE.md regla 6).

    python construir.py            reconstruye todo desde la caché (data/processed)
    python construir.py --rapido   igual, pero sin pytest ni node (para iterar)
    python construir.py --origen   antes de reconstruir, vuelve a pedir los datos de
                                   origen que tienen API sin sesión y lista las piezas
                                   de Earth Engine (no las ejecuta)

Pasos (en este orden; si uno falla, se reporta y se sigue con los demás):
  (a) motor/ensamblar.py: valida las entregas del buzón (variable RAIZ_BUZON) y las
      copia a data/processed. Si el archivo aún no existe, queda «pendiente».
  (b) motor/simulados.py: regenera los datos simulados mientras no haya datos reales
      (si el ensamblador metió entregas, se conservan los datos ensamblados).
  (c) motor/manifest.py: genera web/data/manifest.json.
  (d) python validar_contrato.py: debe imprimir «CONTRATO OK».
  (e) pytest -q tests/
  (f) node --test con los archivos tests/**/*.test.js
  (g) reporte de 10 líneas. Sale con 0 solo si todo pasa; lo pendiente (piezas que
      aún no existen) no cuenta como falla.

Solo usa la biblioteca estándar de Python (pytest y node se llaman como procesos).
"""
import argparse
import base64
import hashlib
import importlib
import importlib.util
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
OK, FALLA, PENDIENTE, OMITIDO = "OK", "FALLA", "PENDIENTE", "OMITIDO"

# Piezas de Earth Engine: las corre otra sesión (CLAUDE.md, «Operación»). Orden del kit §0.3.
PIEZAS_EARTH_ENGINE = (
    ("A3", "HLS del año agrícola 2026 (series mensuales y suelo desnudo)"),
    ("A3-M", "memoria de la parcela 2016–2026, una exportación por año, de 2025 hacia atrás"),
    ("A8", "contraste regional de ET (SSEBop VIIRS y WaPOR v3)"),
    ("A9", "relieve y escurrimiento con NASADEM (exportación de NASADEM)"),
)
# Fuentes con API sin sesión que todavía llegan por el buzón (no hay script de descarga en el repo).
FUENTES_POR_BUZON = (
    ("NASA POWER (A1, clima diario)", "pendiente: lo entrega el buzón"),
    ("Fields of The World 2025 (B1, parcelas)", "pendiente: lo entrega el buzón"),
)


class Paso:
    """Resultado de un paso: estado (OK, FALLA, PENDIENTE u OMITIDO) y detalle de una línea."""

    def __init__(self, nombre, estado, detalle=""):
        self.nombre, self.estado, self.detalle = nombre, estado, detalle

    def __str__(self):
        return f"{self.estado} — {self.detalle}" if self.detalle else self.estado


def titulo(texto):
    print(f"\n── {texto} " + "─" * max(0, 66 - len(texto)), flush=True)


def leer_json(ruta):
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def importar(nombre):
    """Importa un módulo de motor/ con la raíz del repo en sys.path."""
    for ruta in (str(RAIZ), str(RAIZ / "motor")):
        if ruta not in sys.path:
            sys.path.insert(0, ruta)
    return importlib.import_module(nombre)


# --- --origen ---------------------------------------------------------------
def sha_b64(datos, algoritmo):
    return f"{algoritmo}-" + base64.b64encode(hashlib.new(algoritmo, datos).digest()).decode()


def descargar(url, intentos=2):
    """Descarga con urllib (respeta HTTPS_PROXY y SSL_CERT_FILE del entorno)."""
    ultimo = None
    for _ in range(intentos):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                return r.read()
        except Exception as ex:  # noqa: BLE001 - se reporta tal cual
            ultimo = ex
    raise ultimo


def paso_origen():
    """Re-descarga los tarballs de npm de web/vendor/VERSIONS.json y compara sha512 y sha384."""
    titulo("(origen) Datos de origen con API sin sesión")
    versiones = leer_json(RAIZ / "web/vendor/VERSIONS.json")
    errores, revisados = [], 0
    for lib in versiones.get("librerias", []):
        nombre, version = lib["nombre"], lib["version"]
        url = f"{lib['registro'].rstrip('/')}/{nombre}/-/{nombre.split('/')[-1]}-{version}.tgz"
        try:
            tgz = descargar(url)
        except Exception as ex:  # noqa: BLE001
            errores.append(f"{nombre}@{version}: no se pudo descargar ({ex})")
            print(f"  FALLA {nombre}@{version}: {ex}")
            continue
        if sha_b64(tgz, "sha512") != lib.get("tarball_integrity"):
            errores.append(f"{nombre}@{version}: el sha512 del tarball no coincide con VERSIONS.json")
        # Se lee el tarball en memoria; no se extrae nada al disco.
        with tarfile.open(fileobj=io.BytesIO(tgz), mode="r:gz") as tar:
            for a in lib.get("archivos", []):
                revisados += 1
                try:
                    datos = tar.extractfile(a["ruta_en_tarball"]).read()
                except (KeyError, AttributeError):
                    errores.append(f"{nombre}: {a['ruta_en_tarball']} no está en el tarball")
                    continue
                local = RAIZ / "web" / a["archivo"]
                sha_tar = sha_b64(datos, "sha384")
                sha_local = sha_b64(local.read_bytes(), "sha384") if local.exists() else None
                if sha_tar != a["sha384"]:
                    errores.append(f"{a['archivo']}: el sha384 del tarball no coincide con VERSIONS.json")
                if sha_local != a["sha384"]:
                    errores.append(f"{a['archivo']}: la copia local no coincide con VERSIONS.json")
        print(f"  {nombre}@{version}: tarball descargado de {url}")
    for fuente, estado in FUENTES_POR_BUZON:
        print(f"  {fuente}: {estado}")
    print("  Earth Engine (lo ejecuta otra sesión; aquí no se corre). Orden:")
    for i, (pieza, que) in enumerate(PIEZAS_EARTH_ENGINE, 1):
        print(f"    {i}. {pieza}: {que}")
    for e in errores:
        print("  ERROR", e)
    if errores:
        return Paso("origen", FALLA, f"{len(errores)} diferencias en web/vendor (ver arriba)")
    return Paso("origen", OK, f"npm: {revisados} archivos de web/vendor coinciden (sha384); "
                              "POWER y FTW pendientes del buzón; Earth Engine listado")


# --- (a) ensamblado -----------------------------------------------------------
LLAVES_REPORTE = ("entraron", "rechazados", "retenidos", "sigue_simulado", "fuentes")


def paso_ensamblar():
    titulo("(a) Ensamblado del buzón (motor/ensamblar.py)")
    if not (RAIZ / "motor/ensamblar.py").exists():
        print("  motor/ensamblar.py aún no existe: se trabaja con los datos simulados.")
        return Paso("ensamblar", PENDIENTE, "motor/ensamblar.py aún no existe"), None
    try:
        ensamblar = importar("motor.ensamblar")
    except Exception as ex:  # noqa: BLE001 - cualquier error de importación se reporta
        print(f"  No se pudo importar motor/ensamblar.py: {type(ex).__name__}: {ex}")
        return Paso("ensamblar", FALLA, f"no se pudo importar ({type(ex).__name__}: {ex})"), None
    buzon = os.environ.get("RAIZ_BUZON") or None
    print(f"  Buzón: {buzon or 'sin RAIZ_BUZON (buzón vacío)'}")
    try:
        reporte = ensamblar.ensamblar(buzon=buzon)
    except Exception as ex:  # noqa: BLE001
        print(f"  ensamblar() falló: {type(ex).__name__}: {ex}")
        return Paso("ensamblar", FALLA, f"ensamblar() falló ({type(ex).__name__}: {ex})"), None
    if not isinstance(reporte, dict):
        return Paso("ensamblar", FALLA, f"ensamblar() devolvió {type(reporte).__name__}, no un dict"), None
    print("  " + json.dumps(reporte, ensure_ascii=False, indent=1, default=str).replace("\n", "\n  "))
    faltan = [k for k in LLAVES_REPORTE if k not in reporte]
    if faltan:
        return Paso("ensamblar", FALLA, f"al reporte le faltan las llaves {faltan}"), reporte
    return Paso("ensamblar", OK, "buzón validado"), reporte


def contar(x):
    """Número de elementos de una lista o dict del reporte (0 si es None)."""
    return len(x) if isinstance(x, (list, dict, tuple, set)) else (0 if x is None else 1)


# --- (b) simulados ------------------------------------------------------------
def paso_simulados(reporte):
    titulo("(b) Cubo: motor B4 con datos reales (motor/b4_cubo.py) o simulados (motor/simulados.py)")
    # Si data/processed ya tiene las entradas obligatorias de B4 (validadas por el ensamblador),
    # el cubo se arma con datos REALES; si no, se regeneran los simulados.
    try:
        b4 = importar("motor.b4_cubo")
        faltan = [f for f in b4.OBLIGATORIAS if not (RAIZ / "data/processed" / f).exists()]
    except Exception as ex:  # noqa: BLE001
        print(f"  No se pudo importar motor/b4_cubo.py: {type(ex).__name__}: {ex}")
        return Paso("simulados", FALLA, f"no se pudo importar B4 ({type(ex).__name__}: {ex})")
    if not faltan:
        try:
            rep = b4.construir()
        except Exception as ex:  # noqa: BLE001
            print(f"  b4_cubo.construir() falló: {type(ex).__name__}: {ex}")
            return Paso("simulados", FALLA, f"B4 falló ({type(ex).__name__}: {ex})")
        for a in rep.get("avisos", []):
            print(f"  aviso: {a}")
        print(f"  DATOS REALES: {rep['parcelas']} parcelas ({rep['clasificadas']} clasificadas), {rep['opciones']} opciones")
        return Paso("simulados", OK, f"cubo REAL: {rep['parcelas']} parcelas, {rep['clasificadas']} clasificadas, "
                                     f"{rep['opciones']} opciones")
    print(f"  Faltan entradas de B4 en data/processed ({', '.join(faltan)}): se usan los datos simulados.")
    try:
        geo, cubo, expl = importar("motor.simulados").generar()
    except Exception as ex:  # noqa: BLE001
        print(f"  simulados.generar() falló: {type(ex).__name__}: {ex}")
        return Paso("simulados", FALLA, f"{type(ex).__name__}: {ex}")
    n_op = sum(len(p.get("opciones", [])) for p in cubo["parcelas"].values())
    print(f"  {len(geo['features'])} parcelas, {n_op} opciones, {len(expl['explicaciones'])} explicaciones")
    return Paso("simulados", OK, f"regenerados: {len(geo['features'])} parcelas, {n_op} opciones")


# --- (b2) relieve para la web ------------------------------------------------
def paso_relieve():
    titulo("(b2) Capa de relieve y tormenta (motor/relieve_web.py)")
    try:
        rep = importar("motor.relieve_web").construir()
    except Exception as ex:  # noqa: BLE001
        print(f"  relieve_web.construir() falló: {type(ex).__name__}: {ex}")
        return Paso("relieve", FALLA, f"{type(ex).__name__}: {ex}")
    if not rep.get("ejecutado"):
        print(f"  {rep.get('motivo')}: la web dirá «terrain layer: not run».")
        return Paso("relieve", OMITIDO, rep.get("motivo", ""))
    print(f"  zonas con relieve: {', '.join(rep['zonas'])}; rutas {rep['rutas_bytes']} bytes")
    return Paso("relieve", OK, f"zonas: {', '.join(rep['zonas'])}")


# --- (c) manifest --------------------------------------------------------------
def paso_manifest():
    titulo("(c) Manifest (motor/manifest.py)")
    try:
        man = importar("motor.manifest").generar()
    except Exception as ex:  # noqa: BLE001
        print(f"  manifest.generar() falló: {type(ex).__name__}: {ex}")
        return Paso("manifest", FALLA, f"{type(ex).__name__}: {ex}")
    r = man["resumen"]
    print(f"  web/data/manifest.json: {r['cifras']} cifras ({r['simuladas']} simuladas), "
          f"{r['fuentes_de_origen']} fuentes de origen, {r['avisos']} avisos")
    for a in man["avisos"][:5]:
        print("  aviso:", a)
    if len(man["avisos"]) > 5:
        print(f"  … y {len(man['avisos']) - 5} avisos más (lista completa en manifest.json → avisos)")
    return Paso("manifest", OK, f"{r['cifras']} cifras ({r['simuladas']} simuladas), "
                                f"{r['fuentes_de_origen']} fuentes de origen, {r['avisos']} avisos")


# --- (d) contrato ----------------------------------------------------------------
def correr(cmd, timeout=600):
    """Ejecuta un proceso en la raíz del repo; devuelve (código, salida combinada)."""
    p = subprocess.run(cmd, cwd=RAIZ, capture_output=True, text=True, encoding="utf-8",
                       errors="replace", timeout=timeout)
    return p.returncode, (p.stdout or "") + (p.stderr or "")


def paso_contrato():
    titulo("(d) Contrato (python validar_contrato.py)")
    codigo, salida = correr([sys.executable, "validar_contrato.py"])
    print("  " + salida.strip().replace("\n", "\n  "))
    primera = salida.strip().splitlines()[0] if salida.strip() else "sin salida"
    if codigo == 0 and "CONTRATO OK" in salida:
        return Paso("contrato", OK, "CONTRATO OK")
    return Paso("contrato", FALLA, primera)


# --- (d2) verificador de cifras (kit C3 y K-TEST prueba 6) ----------------------------
def paso_verificador():
    titulo("(d2) Verificador de cifras (motor/verificador.py --reporte)")
    codigo, salida = correr([sys.executable, "motor/verificador.py", "web/data/explicaciones.json", "--reporte"])
    print("  " + salida.strip().replace("\n", "\n  "))
    ok = codigo == 0 and "VERIFICADOR OK" in salida
    return Paso("verificador", OK if ok else FALLA, "VERIFICADOR OK; set dorado en docs/figuras/llm_eval.csv"
                if ok else f"código {codigo}: ver salida")


def escribir_pruebas_md(pasos, total_s):
    """docs/pruebas.md (kit K-TEST): fecha, lista de pruebas y su resultado. Se genera, no se edita."""
    ahora = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(timespec="seconds")
    filas = "\n".join(f"| {p.nombre} | {p.estado} | {p.detalle} |" for p in pasos)
    texto = (
        "<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->\n"
        "# Resultado de las pruebas (generado por `python construir.py`; no se edita a mano)\n\n"
        f"Corrida: {ahora} · duración {total_s:.1f} s\n\n"
        "| Paso | Estado | Detalle |\n|---|---|---|\n" + filas + "\n\n"
        "La prueba con navegador (`node tests/e2e/web_smoke.mjs`) se corre aparte y antes de cada publicación.\n"
    )
    (RAIZ / "docs/pruebas.md").write_text(texto, encoding="utf-8")


# --- (e) pytest --------------------------------------------------------------------
def paso_pytest():
    titulo("(e) Pruebas de Python (pytest -q tests/)")
    if importlib.util.find_spec("pytest") is None:
        print("  pytest no está instalado: python -m pip install -r requirements.txt")
        return Paso("pytest", FALLA, "pytest no está instalado (pip install -r requirements.txt)")
    codigo, salida = correr([sys.executable, "-m", "pytest", "-q", "-rs", "-p", "no:cacheprovider", "tests/"])
    print("  " + salida.strip().replace("\n", "\n  "))
    lineas = [l for l in salida.strip().splitlines() if re.search(r"\d+ (passed|failed|error|skipped)", l)]
    resumen = lineas[-1].strip("= ") if lineas else f"código {codigo}"
    return Paso("pytest", OK if codigo == 0 else FALLA, resumen)


# --- (f) node --test -------------------------------------------------------------------
def paso_node():
    titulo("(f) Pruebas de JavaScript (node --test)")
    if shutil.which("node") is None:
        print("  node no está instalado (se necesita Node 22).")
        return Paso("node", FALLA, "node no está instalado")
    # Node 22 trata «tests/» como un archivo; se pasan los archivos de prueba explícitos.
    archivos = sorted(str(p.relative_to(RAIZ)) for p in (RAIZ / "tests").rglob("*.test.js"))
    if not archivos:
        return Paso("node", FALLA, "no hay archivos tests/**/*.test.js")
    codigo, salida = correr(["node", "--test", "--test-reporter=tap", *archivos])
    # Se muestran los nombres de las pruebas y el resumen. De cada prueba que falla se
    # muestra su bloque YAML de TAP (el mensaje de error), sin la pila de llamadas.
    en_falla = False
    for l in salida.splitlines():
        if re.match(r"^\s*(not ok|ok) \d+ - ", l):
            en_falla = l.lstrip().startswith("not ok")
            print("  " + l)
        elif l.startswith("# ") and not l.startswith("# Subtest"):
            en_falla = False
            print("  " + l)
        elif en_falla:
            if re.match(r"^\s*(stack:|\.\.\.$)", l):
                en_falla = False
            elif l.strip() and not re.match(r"^\s*(duration_ms|type|location|failureType|code|name|operator):", l):
                print("  " + l)
    cuenta = {k: int(v) for k, v in re.findall(r"^# (tests|pass|fail|skipped|todo|cancelled) (\d+)", salida, re.M)}
    resumen = (f"{cuenta.get('pass', 0)} pass, {cuenta.get('fail', 0)} fail, "
               f"{cuenta.get('skipped', 0)} skipped")
    ok = codigo == 0 and cuenta.get("fail", 0) == 0 and cuenta.get("cancelled", 0) == 0
    return Paso("node", OK if ok else FALLA, resumen)


# --- (g) reporte -------------------------------------------------------------------------
def estado_simulado(reporte):
    """Qué sigue simulado: lo que no está en la caché validada (data/processed) según el ensamblador,
    o, si no hay reporte, las marcas de cubo.meta."""
    if reporte and reporte.get("sigue_simulado") is not None:
        cache = {f.name for f in (RAIZ / "data/processed").iterdir() if f.is_file()} if (RAIZ / "data/processed").exists() else set()
        s = [x for x in (reporte["sigue_simulado"] or []) if x not in cache]
        return (", ".join(map(str, s)) or "nada") + f" (caché data/processed: {len(cache)} archivos)"
    try:
        meta = leer_json(RAIZ / "web/data/cubo.json").get("meta", {})
    except Exception as ex:  # noqa: BLE001
        return f"no se pudo leer cubo.json ({ex})"
    if not meta.get("mock"):
        return "nada (cubo.meta.mock = false)"
    return "cubo.meta.mock = true; campos: " + ", ".join(meta.get("mock_campos") or ["todos"])


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Comando único de Raíz: reconstruye datos, cálculo, manifest y pruebas.")
    ap.add_argument("--origen", action="store_true",
                    help="vuelve a pedir los datos de origen con API sin sesión y lista las piezas de Earth Engine")
    ap.add_argument("--rapido", action="store_true", help="salta pytest y node para iterar")
    args = ap.parse_args(argv)
    inicio = time.time()

    origen = paso_origen() if args.origen else Paso("origen", OMITIDO, "no solicitado (use --origen)")
    ens, reporte = paso_ensamblar()
    sim = paso_simulados(reporte)
    rel = paso_relieve()
    man = paso_manifest()
    con = paso_contrato()
    ver = paso_verificador()
    if args.rapido:
        py = Paso("pytest", OMITIDO, "--rapido")
        js = Paso("node", OMITIDO, "--rapido")
    else:
        py = paso_pytest()
        js = paso_node()

    pasos = (origen, ens, sim, rel, man, con, ver, py, js)
    fallas = [p.nombre for p in pasos if p.estado == FALLA]
    pendientes = [p.nombre for p in pasos if p.estado == PENDIENTE]
    if reporte:
        entregas = (f"entraron {contar(reporte.get('entraron'))} · rechazados {contar(reporte.get('rechazados'))} · "
                    f"retenidos {contar(reporte.get('retenidos'))} · fuentes {contar(reporte.get('fuentes'))}")
    else:
        entregas = "sin ensamblador: no se leyó el buzón"
    if fallas:
        final = f"FALLA en {', '.join(fallas)}"
    elif args.rapido:
        final = "OK sin pytest ni node (--rapido)"
    else:
        final = "OK: todo pasa"
    if pendientes:
        final += f" · pendiente: {', '.join(pendientes)}"
    codigo = 1 if fallas else 0

    titulo("REPORTE")
    lineas = (
        f" 1. Origen ........: {origen}",
        f" 2. Ensamblado ....: {ens}",
        f" 3. Entregas ......: {entregas}",
        f" 4. Sigue simulado : {estado_simulado(reporte)}",
        f" 5. Cubo ..........: {sim}",
        f" 5b. Relieve ......: {rel}",
        f" 6. Manifest ......: {man}",
        f" 7. Contrato ......: {con}",
        f" 7b. Verificador ..: {ver}",
        f" 8. pytest ........: {py}",
        f" 9. node --test ...: {js}",
        f"10. RESULTADO .....: {final} · {time.time() - inicio:.1f} s · código de salida {codigo}",
    )
    print("\n".join(lineas))
    if not args.rapido:
        escribir_pruebas_md(pasos, time.time() - inicio)
    return codigo


if __name__ == "__main__":
    sys.exit(main())
