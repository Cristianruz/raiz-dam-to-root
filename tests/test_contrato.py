# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""K-TEST 8: contrato de datos v4 (kit §2.2–2.5) con validar_contrato.py.

1) Los archivos de web/data pasan el validador.
2) Un cubo alterado SÍ da error (si no, el validador no está validando).
3) manifest.json (§2.5) tiene una entrada por cada número de los bloques que muestra
   la web, con fuente, script y la marca de datos simulados.
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
for ruta in (str(RAIZ), str(RAIZ / "motor")):
    if ruta not in sys.path:
        sys.path.insert(0, ruta)

import validar_contrato  # noqa: E402
from motor import manifest  # noqa: E402

ARCHIVOS = ("parcelas.geojson", "cubo.json", "explicaciones.json")


def leer(nombre):
    return json.loads((RAIZ / "web/data" / nombre).read_text(encoding="utf-8"))


def copia_alterada(tmp_path, alterar):
    """Copia web/data a tmp_path, aplica alterar(cubo, geo, expl) y devuelve la carpeta."""
    for n in ARCHIVOS:
        shutil.copy(RAIZ / "web/data" / n, tmp_path / n)
    cubo, geo, expl = leer("cubo.json"), leer("parcelas.geojson"), leer("explicaciones.json")
    alterar(cubo, geo, expl)
    for n, d in zip(ARCHIVOS, (geo, cubo, expl)):
        (tmp_path / n).write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    return tmp_path


def primera_opcion(cubo):
    pid = next(iter(cubo["parcelas"]))
    return cubo["parcelas"][pid]["opciones"][0]


# --- 1) datos actuales --------------------------------------------------------
def test_contrato_ok():
    errores = validar_contrato.validar(RAIZ / "web/data")
    assert errores == [], "\n".join(errores)


def test_cli_imprime_contrato_ok():
    p = subprocess.run([sys.executable, "validar_contrato.py"], cwd=RAIZ,
                       capture_output=True, text=True, encoding="utf-8")
    assert p.returncode == 0 and "CONTRATO OK" in p.stdout, p.stdout + p.stderr


# --- 2) alteraciones que deben fallar ------------------------------------------
def p50_mayor_que_p90(cubo, geo, expl):
    banda = primera_opcion(cubo)["agua"]["lamina_bruta"]["0"]
    banda["p50"] = banda["p90"] + banda["p50"]  # P50 > P90 a partir de los propios datos


def semaforo_de_agua_guardado(cubo, geo, expl):
    primera_opcion(cubo)["semaforo"]["agua"] = "verde"


def balance_de_gota_roto(cubo, geo, expl):
    g = primera_opcion(cubo)["gota"]
    g["m3_otras_perdidas"] = g["m3_otras_perdidas"] + g["m3_salen_presa"]


def digito_en_explicacion(cubo, geo, expl):
    llave = next(iter(expl["explicaciones"]))
    expl["explicaciones"][llave]["textos"]["por_que"] += " " + str(cubo["dotaciones"]["deslizador"]["max"])


def estado_plazo_fuera_de_lista(cubo, geo, expl):
    geo["features"][0]["properties"]["estado_plazo"] = "vendida"


ALTERACIONES = {
    "P50 > P90": (p50_mayor_que_p90, "P10 ≤ P50 ≤ P90"),
    "semáforo de agua guardado": (semaforo_de_agua_guardado, "semáforo de agua"),
    "balance de La gota roto": (balance_de_gota_roto, "balance no cierra"),
    "dígito escrito en una explicación": (digito_en_explicacion, "dígitos fuera de los marcadores"),
    "estado_plazo fuera de lista": (estado_plazo_fuera_de_lista, "estado_plazo fuera de lista"),
}


@pytest.mark.parametrize("nombre", list(ALTERACIONES))
def test_cubo_alterado_da_error(tmp_path, nombre):
    alterar, mensaje = ALTERACIONES[nombre]
    errores = validar_contrato.validar(copia_alterada(tmp_path, alterar))
    assert errores, f"el validador aceptó un contrato con «{nombre}»"
    assert any(mensaje in e for e in errores), f"se esperaba un error con «{mensaje}»: {errores}"


# --- 3) manifest.json (§2.5) -----------------------------------------------------
@pytest.fixture(scope="module")
def man():
    return manifest.generar(escribir=False)


def hojas(obj, ruta):
    return manifest.hojas_numericas(obj, ruta)


def test_manifest_cubre_cada_cifra_del_cubo(man):
    cubo = leer("cubo.json")
    esperadas = {r for r, _ in hojas(cubo["zona"], "zona")}
    for k in ("namo_hm3", "almacenamiento_hm3"):
        if isinstance(cubo["distrito"]["boquilla"].get(k), (int, float)):
            esperadas.add(f"distrito.boquilla.{k}")
    esperadas.add("distrito.acuifero_0831.disponibilidad_hm3_anio")
    esperadas |= {r for r, _ in hojas(cubo["dotaciones"]["deslizador"], "dotaciones.deslizador")}
    for i, _ in enumerate(cubo["dotaciones"]["marcas"]):
        esperadas |= {f"dotaciones.marcas[{i}].{k}" for k in ("min", "max", "valor")}
    for pid, pc in cubo["parcelas"].items():
        for i, op in enumerate(pc["opciones"]):
            base = f"parcelas.{pid}.opciones[{i}]"
            for b in ("agua.lamina_bruta", "agua.plazo_anios", "agua.plazo_restante",
                      "agua.compromiso_millares_ha", "gota", "gota_goteo_con_tope",
                      "gota_goteo_sin_tope", "tope_consumo"):
                esperadas |= {r for r, _ in hojas(manifest.obtener(op, b), f"{base}.{b}")}
    claves = {c["clave"] for c in man["cifras"].values() if c["archivo"] == "web/data/cubo.json"}
    faltan = sorted(esperadas - claves)
    assert not faltan, f"cifras del cubo sin entrada en el manifest: {faltan[:10]}"


def test_manifest_valores_y_campos(man):
    cubo = leer("cubo.json")
    for llave, c in man["cifras"].items():
        for campo in ("clave", "archivo", "valor", "fuente", "fecha", "script", "etiqueta", "mock"):
            assert campo in c, f"{llave}: falta {campo}"
        assert c["fuente"] and c["script"], f"{llave}: sin fuente o sin script"
        if c["archivo"] == "web/data/cubo.json" and isinstance(c["valor"], (int, float)):
            # El valor del manifest es el del cubo en esa ruta.
            assert valor_en_ruta(cubo, c["clave"]) == c["valor"], llave


def test_manifest_marca_lo_simulado(man):
    meta = leer("cubo.json")["meta"]
    assert man["mock"] == bool(meta.get("mock"))
    if meta.get("mock"):
        zona = [c for c in man["cifras"].values() if c["clave"].startswith("zona.")]
        assert zona and all(c["mock"] for c in zona), "las cifras simuladas de zona deben llevar mock: true"
        assert all(c["script"] == manifest.SCRIPT_SIMULADOS for c in zona)
    # distrito y dotaciones toman fuente y etiqueta de data/params.json
    params = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
    namo = man["cifras"]["cubo.json:distrito.boquilla.namo_hm3"]
    assert namo["fuente"] == params["distrito"]["namo_hm3"]["fuente"]
    assert namo["etiqueta"] == params["distrito"]["namo_hm3"]["etiqueta"]


def valor_en_ruta(obj, ruta):
    """Lee una ruta «a.b[0].c» (la notación del manifest)."""
    for parte in ruta.split("."):
        nombre, *indices = parte.split("[")
        if nombre:
            obj = obj[nombre]
        for ind in indices:
            obj = obj[int(ind.rstrip("]"))]
    return obj


def test_manifest_no_altera_el_contrato():
    # Generar el manifest no debe tocar los archivos del contrato.
    antes = {n: (RAIZ / "web/data" / n).read_bytes() for n in ARCHIVOS}
    manifest.generar(escribir=False)
    assert all((RAIZ / "web/data" / n).read_bytes() == b for n, b in antes.items())
