#!/usr/bin/env python3
# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Comando único de reconstrucción (kit v4 §0.2 y K-INT; CLAUDE.md regla 6).

    python construir.py            reconstruye todo desde la caché (data/processed)
    python construir.py --rapido   igual, pero sin pytest ni node (para iterar)
    python construir.py --origen   antes de reconstruir, vuelve a pedir los datos de
                                   origen que tienen API sin sesión y lista las piezas
                                   de Earth Engine (no las ejecuta)

Pasos (en este orden; si uno falla, se reporta y se sigue con los demás):
  (a) motor/ensamblar.py: valida las entregas del buzón (variable RAIZ_BUZON) y las
      copia a data/processed. Si el archivo aún no existe, queda «pendiente». Sin RAIZ_BUZON
      no se valida ninguna entrega: el paso queda OMITIDO (se usa la caché previa), no «OK».
      Un archivo rechazado cuya copia validada anterior sigue en data/processed deja el paso en
      ADVERTENCIA con la lista de esos archivos (la web sigue con la copia vieja); no cambia el
      código de salida (no hay modo estricto).
  (b) motor/b4_cubo.py con datos reales o motor/simulados.py mientras no los haya. Si faltan
      entradas de B4 pero web/data ya tiene un cubo REAL (meta.mock = false), el paso FALLA y NO
      reemplaza la web con simulados (un archivo renombrado o rechazado no debe pasar en silencio).
  (b2) motor/relieve_web.py: relieve.json y relieve_rutas.geojson para la web.
  (b3) motor/gemelo_web.py, motor/contexto_web.py y motor/suelo_web.py: gemelo.json, ndvi_mensual.json,
       contexto.json y suelo.json (si uno falla, los demás se construyen igual y el paso FALLA);
       motor/pwa.py: lista de precarga de la app sin conexión (otra vez al final, después del último
       manifest, también con --rapido).
  (c) motor/manifest.py: genera web/data/manifest.json.
  (d) python validar_contrato.py: debe imprimir «CONTRATO OK».
  (d2) motor/verificador.py: cifras de las explicaciones (set dorado).
  (e) pytest -q tests/
  (f) node --test con los archivos tests/**/*.test.js
  (5c) docs/pruebas.md (la tabla de esta corrida) y, a partir de ella, motor/pruebas_web.py:
       web/data/pruebas.json, las cinco pruebas a la vista de «About & Data» (S9 §6; kit C5).
       Va después de las pruebas para que la «puerta automática» de la web sea esta corrida.
       Con --rapido no se corre (pytest y node no corrieron): pruebas.json queda de la última corrida
       completa y el reporte lo dice.
  (c2) motor/manifest.py otra vez, después de 5c, para que manifest.json registre también las cifras
       de pruebas.json de esta corrida (regla 11).
  (g) reporte. Sale con 0 solo si todo pasa; lo pendiente (piezas que aún no existen)
      no cuenta como falla.

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
# Paso que terminó pero deja algo a la vista (p. ej. una entrega rechazada que conserva su copia anterior):
# se ve en el reporte final y NO cambia el código de salida.
ADVERTENCIA = "ADVERTENCIA"

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
    """Resultado de un paso: estado (OK, FALLA, PENDIENTE u OMITIDO) y detalle de una línea.

    detalle_en es el mismo detalle en inglés, armado con los MISMOS valores que el de español (ninguna cifra se
    escribe dos veces a mano): va a docs/en/test_results.md y de ahí a web/data/pruebas.json, que «About & Data»
    muestra. Si no se da (detalles que no tienen idioma: un mensaje de excepción, el resumen de pytest o de node,
    «--rapido»), es el mismo texto. docs/pruebas.md y el reporte de la terminal siguen en español.
    """

    def __init__(self, nombre, estado, detalle="", detalle_en=None):
        self.nombre, self.estado, self.detalle = nombre, estado, detalle
        self.detalle_en = detalle if detalle_en is None else detalle_en

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
        return Paso("origen", FALLA, f"{len(errores)} diferencias en web/vendor (ver arriba)",
                    f"{len(errores)} differences in web/vendor (see above)")
    return Paso("origen", OK, f"npm: {revisados} archivos de web/vendor coinciden (sha384); "
                              "POWER y FTW pendientes del buzón; Earth Engine listado",
                f"npm: {revisados} files of web/vendor match (sha384); "
                "POWER and FTW pending from the team deliveries; Earth Engine listed")


# --- (a) ensamblado -----------------------------------------------------------
LLAVES_REPORTE = ("entraron", "rechazados", "retenidos", "sigue_simulado", "fuentes")


def paso_ensamblar():
    titulo("(a) Ensamblado del buzón (motor/ensamblar.py)")
    if not (RAIZ / "motor/ensamblar.py").exists():
        print("  motor/ensamblar.py aún no existe: se trabaja con los datos simulados.")
        return Paso("ensamblar", PENDIENTE, "motor/ensamblar.py aún no existe",
                    "motor/ensamblar.py does not exist yet"), None
    try:
        ensamblar = importar("motor.ensamblar")
    except Exception as ex:  # noqa: BLE001 - cualquier error de importación se reporta
        print(f"  No se pudo importar motor/ensamblar.py: {type(ex).__name__}: {ex}")
        return Paso("ensamblar", FALLA, f"no se pudo importar ({type(ex).__name__}: {ex})",
                    f"could not be imported ({type(ex).__name__}: {ex})"), None
    buzon = os.environ.get("RAIZ_BUZON") or None
    print(f"  Buzón: {buzon or 'sin RAIZ_BUZON (buzón vacío)'}")
    try:
        reporte = ensamblar.ensamblar(buzon=buzon)
    except Exception as ex:  # noqa: BLE001
        print(f"  ensamblar() falló: {type(ex).__name__}: {ex}")
        return Paso("ensamblar", FALLA, f"ensamblar() falló ({type(ex).__name__}: {ex})",
                    f"ensamblar() failed ({type(ex).__name__}: {ex})"), None
    if not isinstance(reporte, dict):
        return Paso("ensamblar", FALLA, f"ensamblar() devolvió {type(reporte).__name__}, no un dict",
                    f"ensamblar() returned {type(reporte).__name__}, not a dict"), None
    print("  " + json.dumps(reporte, ensure_ascii=False, indent=1, default=str).replace("\n", "\n  "))
    faltan = [k for k in LLAVES_REPORTE if k not in reporte]
    if faltan:
        return Paso("ensamblar", FALLA, f"al reporte le faltan las llaves {faltan}",
                    f"the report is missing the keys {faltan}"), reporte
    if not buzon:
        # Sin buzón no se validó ninguna entrega: decir «OK — buzón validado» sería falso.
        return Paso("ensamblar", OMITIDO, "sin RAIZ_BUZON: no se validaron entregas en esta corrida "
                                          "(se usa la caché previa de data/processed)",
                    "RAIZ_BUZON is not set: no deliveries were validated in this run "
                    "(the earlier cache in data/processed is used)"), reporte
    entraron, rechazados = contar(reporte.get('entraron')), contar(reporte.get('rechazados'))
    detalle = f"buzón validado: entraron {entraron}, rechazados {rechazados}"
    detalle_en = f"deliveries validated: {entraron} accepted, {rechazados} rejected"
    conservan = rechazados_con_copia_anterior(reporte)
    if conservan:
        # La entrega nueva no entró y la web sigue con la copia anterior: no es «OK» (no cambia el código de salida).
        print(f"  ADVERTENCIA: rechazados que conservan la copia anterior en data/processed: {', '.join(conservan)}")
        return Paso("ensamblar", ADVERTENCIA, f"{detalle}; rechazados que conservan la copia anterior en "
                                              f"data/processed (se sigue usando): {', '.join(conservan)}",
                    f"{detalle_en}; rejected files that keep their earlier copy in "
                    f"data/processed (still in use): {', '.join(conservan)}"), reporte
    return Paso("ensamblar", OK, detalle, detalle_en), reporte


def rechazados_con_copia_anterior(reporte):
    """Archivos rechazados en esta corrida cuya copia validada anterior sigue en la carpeta de salida del
    ensamblador (motor/ensamblar.py la conserva y el cubo la seguirá usando)."""
    salida = Path(reporte.get("salida") or RAIZ / "data/processed")
    nombres = [x.get("archivo") for x in reporte.get("rechazados") or [] if isinstance(x, dict)]
    return sorted({n for n in nombres if n and (salida / n).is_file()})


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
        return Paso("simulados", FALLA, f"no se pudo importar B4 ({type(ex).__name__}: {ex})",
                    f"B4 could not be imported ({type(ex).__name__}: {ex})")
    if not faltan:
        try:
            rep = b4.construir()
        except Exception as ex:  # noqa: BLE001
            print(f"  b4_cubo.construir() falló: {type(ex).__name__}: {ex}")
            return Paso("simulados", FALLA, f"B4 falló ({type(ex).__name__}: {ex})",
                        f"B4 failed ({type(ex).__name__}: {ex})")
        for a in rep.get("avisos", []):
            print(f"  aviso: {a}")
        print(f"  DATOS REALES: {rep['parcelas']} parcelas ({rep['clasificadas']} clasificadas), {rep['opciones']} opciones")
        return Paso("simulados", OK, f"cubo REAL: {rep['parcelas']} parcelas, {rep['clasificadas']} clasificadas, "
                                     f"{rep['opciones']} opciones",
                    f"REAL cube: {rep['parcelas']} fields, {rep['clasificadas']} classified, "
                    f"{rep['opciones']} options")
    lista = ", ".join(faltan)
    print(f"  Faltan entradas de B4 en data/processed ({lista}).")
    # Si la web ya publica un cubo REAL, faltar una entrada es una regresión (archivo renombrado o
    # rechazado por el ensamblador): no se reemplaza en silencio la web real con simulados.
    if cubo_publicado_es_real():
        print("  web/data/cubo.json es REAL (meta.mock = false): NO se reemplaza con datos simulados.")
        return Paso("simulados", FALLA, f"faltan entradas de B4 ({lista}) y web/data tiene un cubo REAL: no se "
                                        "reemplazó con simulados (restaure las entradas; para volver a los "
                                        "simulados a propósito, borre web/data/cubo.json)",
                    f"B4 inputs are missing ({lista}) and web/data has a REAL cube: it was not replaced with "
                    "simulated data (restore the inputs; to go back to simulated data on purpose, delete "
                    "web/data/cubo.json)")
    print("  Se usan los datos SIMULADOS.")
    try:
        geo, cubo, expl = importar("motor.simulados").generar()
    except Exception as ex:  # noqa: BLE001
        print(f"  simulados.generar() falló: {type(ex).__name__}: {ex}")
        return Paso("simulados", FALLA, f"{type(ex).__name__}: {ex}")
    n_op = sum(len(p.get("opciones", [])) for p in cubo["parcelas"].values())
    print(f"  {len(geo['features'])} parcelas, {n_op} opciones, {len(expl['explicaciones'])} explicaciones")
    return Paso("simulados", OK, f"SIMULADOS (faltan: {lista}): {len(geo['features'])} parcelas, {n_op} opciones",
                f"SIMULATED (missing: {lista}): {len(geo['features'])} fields, {n_op} options")


def cubo_publicado_es_real():
    """True si web/data/cubo.json existe y dice meta.mock = false (un cubo real ya publicado)."""
    ruta = RAIZ / "web/data/cubo.json"
    if not ruta.exists():
        return False
    try:
        meta = leer_json(ruta).get("meta") or {}
    except Exception:  # noqa: BLE001 - un cubo ilegible no es un cubo real que proteger
        return False
    return meta.get("mock") is False


# --- (b2) relieve para la web ------------------------------------------------
def paso_relieve():
    titulo("(b2) Capa de relieve y tormenta (motor/relieve_web.py)")
    try:
        rep = importar("motor.relieve_web").construir()
    except Exception as ex:  # noqa: BLE001
        print(f"  relieve_web.construir() falló: {type(ex).__name__}: {ex}")
        return Paso("relieve", FALLA, f"{type(ex).__name__}: {ex}")
    for a in rep.get("avisos") or []:
        print(f"  aviso: {a}")
    if not rep.get("ejecutado"):
        print(f"  {rep.get('motivo')}: la web dirá «terrain layer: not run».")
        # motivo_en: el mismo motivo en inglés, si el módulo lo trae (motor/relieve_web.py).
        return Paso("relieve", OMITIDO, rep.get("motivo", ""), rep.get("motivo_en"))
    zonas = rep.get("zonas") or []
    if not zonas:
        # relieve.json sin zonas: la web dice «Terrain layer: not run»; no se reporta OK.
        print("  relieve.json quedó sin zonas (ningún relieve_meta de una zona de params): la web dirá «not run».")
        return Paso("relieve", PENDIENTE, "relieve.json sin zonas: ningún relieve_meta*.json de una zona de "
                                          "params.zona_piloto.zonas; la web dice «Terrain layer: not run»",
                    "relieve.json has no areas: no relieve_meta*.json belongs to an area of "
                    "params.zona_piloto.zonas; the page says «Terrain layer: not run»")
    print(f"  zonas con relieve: {', '.join(zonas)}; rutas {rep.get('rutas_bytes')} bytes")
    return Paso("relieve", OK, f"zonas: {', '.join(zonas)}", f"areas: {', '.join(zonas)}")


# --- (b3) gemelo digital, bases del reto y suelo ----------------------------------
def paso_gemelo():
    """(b3) Datos de las piezas del gemelo para la web, después del cubo (suelo_web lee cubo.json) y antes
    del manifest: gemelo.json y ndvi_mensual.json (motor/gemelo_web.py), contexto.json (motor/contexto_web.py)
    y suelo.json (motor/suelo_web.py). Cada pieza sin su entrega escribe su bloque en null con el motivo y la
    página lo dice; una excepción es FALLA. Las teselas de relieve no se regeneran aquí (necesitan rasterio:
    python motor/dem_teselas.py)."""
    titulo("(b3) Gemelo digital, bases del reto y suelo (gemelo_web, contexto_web, suelo_web)")
    detalles, detalles_en, fallas = [], [], []
    # Cada módulo con su nombre en el detalle en español y en el de inglés.
    for modulo, etiqueta, etiqueta_en in (("motor.gemelo_web", "gemelo", "twin"),
                                          ("motor.contexto_web", "contexto", "context"),
                                          ("motor.suelo_web", "suelo", "soil")):
        try:
            rep = importar(modulo).construir()
        except Exception as ex:  # noqa: BLE001
            # Se anota y se sigue con los demás módulos: si no, sus JSON quedarían de la corrida anterior.
            print(f"  {modulo}.construir() falló: {type(ex).__name__}: {ex}")
            fallas.append(f"{modulo}: {type(ex).__name__}: {ex}")
            detalles.append(f"{etiqueta}: FALLA")
            detalles_en.append(f"{etiqueta_en}: FAILED")
            continue
        for a in rep.get("avisos") or []:
            print(f"  aviso ({etiqueta}): {a}")
        if rep.get("ejecutado") is False:
            print(f"  {etiqueta}: no se generó ({rep.get('motivo')})")
            detalles.append(f"{etiqueta}: not run")
            detalles_en.append(f"{etiqueta_en}: not run")
        else:
            detalles.append(f"{etiqueta}: OK")
            detalles_en.append(f"{etiqueta_en}: OK")
    print("  " + " · ".join(detalles))
    if fallas:
        return Paso("gemelo", FALLA, " · ".join(detalles) + " — " + "; ".join(fallas),
                    " · ".join(detalles_en) + " — " + "; ".join(fallas))
    return Paso("gemelo", OK, " · ".join(detalles), " · ".join(detalles_en))


def paso_pwa():
    """Lista de precarga de la app sin conexión (motor/pwa.py): al final, para que su versión cambie con
    lo que la página carga."""
    try:
        rep = importar("motor.pwa").construir()
    except Exception as ex:  # noqa: BLE001
        print(f"  pwa.construir() falló: {type(ex).__name__}: {ex}")
        return Paso("pwa", FALLA, f"{type(ex).__name__}: {ex}")
    return Paso("pwa", OK, f"precache {rep.get('version') or ''}".strip() if isinstance(rep, dict) else "precache")


# --- (c) manifest --------------------------------------------------------------
def paso_manifest(rotulo="(c) Manifest (motor/manifest.py)"):
    titulo(rotulo)
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
                                f"{r['fuentes_de_origen']} fuentes de origen, {r['avisos']} avisos",
                f"{r['cifras']} figures ({r['simuladas']} simulated), "
                f"{r['fuentes_de_origen']} source files, {r['avisos']} notices")


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
        return Paso("contrato", OK, "CONTRATO OK", "CONTRACT OK")
    # La primera línea de la salida del validador va tal cual (está en español).
    return Paso("contrato", FALLA, primera, f"validar_contrato.py failed: {primera}")


# --- (d2) verificador de cifras (kit C3 y K-TEST prueba 6) ----------------------------
def paso_verificador():
    titulo("(d2) Verificador de cifras (motor/verificador.py --reporte)")
    codigo, salida = correr([sys.executable, "motor/verificador.py", "web/data/explicaciones.json", "--reporte"])
    print("  " + salida.strip().replace("\n", "\n  "))
    ok = codigo == 0 and "VERIFICADOR OK" in salida
    if ok:
        return Paso("verificador", OK, "VERIFICADOR OK; set dorado en docs/figuras/llm_eval.csv",
                    "CHECKER OK; golden set in docs/figuras/llm_eval.csv")
    return Paso("verificador", FALLA, f"código {codigo}: ver salida", f"exit code {codigo}: see the output")


def escribir_pruebas_md(pasos, total_s):
    """docs/pruebas.md (kit K-TEST): fecha, lista de pruebas y su resultado. Se genera, no se edita."""
    ahora = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(timespec="seconds")
    filas = "\n".join(f"| {p.nombre} | {p.estado} | {p.detalle} |" for p in pasos)
    texto = (
        "<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->\n"
        "# Resultado de las pruebas (generado por `python construir.py`; no se edita a mano)\n\n"
        f"Corrida: {ahora} · duración {total_s:.1f} s\n\n"
        "| Paso | Estado | Detalle |\n|---|---|---|\n" + filas + "\n\n"
        "La prueba con navegador (`node tests/e2e/web_smoke.mjs`) se corre aparte y antes de cada publicación.\n"
        "Después de escribir esta tabla, el paso 5c (`motor/pruebas_web.py`) genera `web/data/pruebas.json` "
        "a partir de ella: la sección «About & Data» de la web la muestra como «puerta automática».\n"
    )
    (RAIZ / "docs/pruebas.md").write_text(texto, encoding="utf-8")
    escribir_pruebas_md_en(pasos, ahora, total_s)


def escribir_pruebas_md_en(pasos, ahora, total_s):
    """docs/en/test_results.md: la misma tabla en inglés, con los nombres de los pasos que muestra la web
    (motor/pruebas_web.py, NOMBRES_PASOS). «About & Data» enlaza esta versión porque la guía de envío de
    Space Apps pide que todo lo enlazado esté en inglés. El detalle de cada paso es su detalle en inglés
    (Paso.detalle_en: los mismos valores que el de español; motor/pruebas_web.py lo lee de aquí para la página)."""
    try:
        pw = importlib.import_module("motor.pruebas_web")
    except ImportError:  # sin el módulo, los nombres quedan como id del paso (no se pierde la tabla)
        pw = None
    nombres = getattr(pw, "NOMBRES_PASOS", {}) or {}
    # Los mismos estados en inglés que usa la web (un solo mapa: motor/pruebas_web.py, ESTADOS_PASO).
    estados = getattr(pw, "ESTADOS_PASO", None) or {"OK": "passed", "FALLA": "failed", "PENDIENTE": "pending",
                                                    "OMITIDO": "skipped", "ADVERTENCIA": "warning"}
    filas = "\n".join(f"| {nombres.get(p.nombre, p.nombre)} | {estados.get(p.estado, p.estado)} | {p.detalle_en} |"
                      for p in pasos)
    texto = (
        "<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->\n"
        "# Automated test results (written by `python construir.py`; not edited by hand)\n\n"
        "English version of [docs/pruebas.md](../pruebas.md); if they differ, the Spanish original prevails.\n\n"
        f"Run: {ahora} · duration {total_s:.1f} s\n\n"
        "| Step | Status | Detail |\n|---|---|---|\n" + filas + "\n\n"
        "The browser test (`node tests/e2e/web_smoke.mjs`) runs separately, before each publication.\n"
        "After this table is written, step 5c (`motor/pruebas_web.py`) builds `web/data/pruebas.json` from it: "
        "«About & Data» shows it as the automated gate.\n"
    )
    (RAIZ / "docs/en").mkdir(parents=True, exist_ok=True)
    (RAIZ / "docs/en/test_results.md").write_text(texto, encoding="utf-8")


# --- (5c) pruebas a la vista para la web ----------------------------------------------------
def paso_pruebas_web():
    """web/data/pruebas.json (motor/pruebas_web.py): las cinco pruebas de S9 §6 con su estado real y la
    puerta automática leída de docs/pruebas.md. Un resultado desfavorable o «not run» NO es una falla del
    paso: se publica igual (S9 §6). El paso falla solo si el archivo no se puede generar."""
    titulo("(5c) Pruebas a la vista para la web (motor/pruebas_web.py)")
    try:
        rep = importar("motor.pruebas_web").construir()
    except Exception as ex:  # noqa: BLE001
        print(f"  pruebas_web.construir() falló: {type(ex).__name__}: {ex}")
        return Paso("pruebas_web", FALLA, f"{type(ex).__name__}: {ex}")
    estados = rep.get("pruebas", {})
    for id_, est in estados.items():
        print(f"  {id_}: {est}")
    print(f"  puerta automática: {rep.get('puerta')} (corrida {rep.get('corrida') or 'sin registrar'})")
    cuenta = {}
    for est in estados.values():
        cuenta[est] = cuenta.get(est, 0) + 1
    resumen = ", ".join(f"{n} {e}" for e, n in cuenta.items())
    return Paso("pruebas_web", OK, f"{rep.get('ruta')}: {len(estados)} pruebas ({resumen}); "
                                   f"puerta {rep.get('puerta')}",
                f"{rep.get('ruta')}: {len(estados)} tests ({resumen}); gate {rep.get('puerta')}")


# --- (e) pytest --------------------------------------------------------------------
def paso_pytest():
    titulo("(e) Pruebas de Python (pytest -q tests/)")
    if importlib.util.find_spec("pytest") is None:
        print("  pytest no está instalado: python -m pip install -r requirements.txt")
        return Paso("pytest", FALLA, "pytest no está instalado (pip install -r requirements.txt)",
                    "pytest is not installed (pip install -r requirements.txt)")
    codigo, salida = correr([sys.executable, "-m", "pytest", "-q", "-rs", "-p", "no:cacheprovider", "tests/"])
    print("  " + salida.strip().replace("\n", "\n  "))
    lineas = [l for l in salida.strip().splitlines() if re.search(r"\d+ (passed|failed|error|skipped)", l)]
    # El resumen de pytest ya está en inglés; sin él, el código de salida en los dos idiomas.
    resumen = lineas[-1].strip("= ") if lineas else f"código {codigo}"
    return Paso("pytest", OK if codigo == 0 else FALLA, resumen, None if lineas else f"exit code {codigo}")


# --- (f) node --test -------------------------------------------------------------------
def paso_node():
    titulo("(f) Pruebas de JavaScript (node --test)")
    if shutil.which("node") is None:
        print("  node no está instalado (se necesita Node 22).")
        return Paso("node", FALLA, "node no está instalado", "node is not installed")
    # Node 22 trata «tests/» como un archivo; se pasan los archivos de prueba explícitos.
    archivos = sorted(str(p.relative_to(RAIZ)) for p in (RAIZ / "tests").rglob("*.test.js"))
    if not archivos:
        return Paso("node", FALLA, "no hay archivos tests/**/*.test.js", "there are no tests/**/*.test.js files")
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
    """Qué sigue simulado. Manda lo que dice el cubo publicado (cubo.meta.mock y mock_campos): es lo que
    ve la web. Después, las entregas que el ensamblador aún da por simuladas y no están en la caché."""
    try:
        meta = leer_json(RAIZ / "web/data/cubo.json").get("meta", {})
        if meta.get("mock"):
            cubo = "cubo SIMULADO (cubo.meta.mock = true; campos: " + ", ".join(meta.get("mock_campos") or ["todos"]) + ")"
        else:
            cubo = "cubo real (cubo.meta.mock = false)"
    except Exception as ex:  # noqa: BLE001
        cubo = f"no se pudo leer cubo.json ({ex})"
    if reporte and reporte.get("sigue_simulado") is not None:
        cache = {f.name for f in (RAIZ / "data/processed").iterdir() if f.is_file()} if (RAIZ / "data/processed").exists() else set()
        s = [x for x in (reporte["sigue_simulado"] or []) if x not in cache]
        return f"{cubo}; entregas aún sin llegar: " + (", ".join(map(str, s)) or "ninguna") + \
            f" (caché data/processed: {len(cache)} archivos)"
    return cubo


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Comando único de ROOT: reconstruye datos, cálculo, manifest y pruebas.")
    ap.add_argument("--origen", action="store_true",
                    help="vuelve a pedir los datos de origen con API sin sesión y lista las piezas de Earth Engine")
    ap.add_argument("--rapido", action="store_true", help="salta pytest y node para iterar")
    args = ap.parse_args(argv)
    inicio = time.time()

    origen = paso_origen() if args.origen else Paso("origen", OMITIDO, "no solicitado (use --origen)",
                                                    "not requested (use --origen)")
    ens, reporte = paso_ensamblar()
    sim = paso_simulados(reporte)
    rel = paso_relieve()
    gem = paso_gemelo()
    pwa = paso_pwa()
    man = paso_manifest()
    con = paso_contrato()
    ver = paso_verificador()
    if args.rapido:
        py = Paso("pytest", OMITIDO, "--rapido")
        js = Paso("node", OMITIDO, "--rapido")
    else:
        py = paso_pytest()
        js = paso_node()

    pasos = (origen, ens, sim, rel, gem, pwa, man, con, ver, py, js)
    # docs/pruebas.md con la tabla de esta corrida y, a partir de ella, web/data/pruebas.json (5c).
    # Con --rapido pytest y node no corrieron: no se reescribe ni la tabla ni pruebas.json (su «puerta»
    # diría passed con la corrida anterior); el reporte lo dice.
    if args.rapido:
        titulo("(5c) Pruebas a la vista para la web (motor/pruebas_web.py)")
        print("  --rapido: no se regenera web/data/pruebas.json; queda el de la última corrida completa.")
        web = Paso("pruebas_web", OMITIDO, "--rapido: web/data/pruebas.json no se regeneró (puerta de la "
                                           "última corrida completa, no de esta)",
                   "--rapido: web/data/pruebas.json was not rebuilt (gate of the last full run, not of this one)")
    else:
        escribir_pruebas_md(pasos, time.time() - inicio)
        web = paso_pruebas_web()
        # (c2) El manifest otra vez, ahora con las cifras de pruebas.json de esta corrida (regla 11).
        if web.estado == OK and man.estado == OK:
            man = paso_manifest("(c2) Manifest con las cifras de pruebas.json (motor/manifest.py)")
    # Otra vez al final, también con --rapido: la versión de la precarga es la huella de lo que carga la página,
    # manifest.json (y, en la corrida completa, pruebas.json) incluido.
    pwa = paso_pwa()
    todos = (origen, ens, sim, rel, gem, pwa, man, con, ver, py, js, web)
    fallas = [p.nombre for p in todos if p.estado == FALLA]
    pendientes = [p.nombre for p in todos if p.estado == PENDIENTE]
    advertencias = [p.nombre for p in todos if p.estado == ADVERTENCIA]
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
    if advertencias:
        final += f" · advertencia: {', '.join(advertencias)} (ver su renglón)"
    codigo = 1 if fallas else 0  # una ADVERTENCIA no cambia el código de salida

    titulo("REPORTE")
    lineas = (
        f" 1. Origen ........: {origen}",
        f" 2. Ensamblado ....: {ens}",
        f" 3. Entregas ......: {entregas}",
        f" 4. Sigue simulado : {estado_simulado(reporte)}",
        f" 5. Cubo ..........: {sim}",
        f" 5b. Relieve ......: {rel}",
        f" 5d. Gemelo .......: {gem}",
        f" 5e. App sin red ..: {pwa}",
        f" 5c. Pruebas web ..: {web}",
        f" 6. Manifest ......: {man}",
        f" 7. Contrato ......: {con}",
        f" 7b. Verificador ..: {ver}",
        f" 8. pytest ........: {py}",
        f" 9. node --test ...: {js}",
        f"10. RESULTADO .....: {final} · {time.time() - inicio:.1f} s · código de salida {codigo}",
    )
    print("\n".join(lineas))
    return codigo


if __name__ == "__main__":
    sys.exit(main())
