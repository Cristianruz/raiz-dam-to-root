# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""K-TEST 3: ejemplo de escala de S9 §5, sobre la MISMA función que usa la página.

Los valores esperados se leen de tests/casos/escala_s9.json (fuente: S9 §5, láminas
INIFAP [V]). Las hectáreas se calculan llamando a web/reglas.js con node; aquí no se
reimplementa la fórmula.
"""
import functools
import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
CASO = json.loads((RAIZ / "tests/casos/escala_s9.json").read_text(encoding="utf-8"))

# Script de node: importa web/reglas.js y evalúa cada caso con hectareasQueAlcanzan y cobertura.
# Una lámina sin banda se pasa como {p10, p50, p90} iguales.
SCRIPT_NODE = """
const { pathToFileURL } = await import('node:url');
const reglas = await import(pathToFileURL(process.argv[1]).href);
const caso = JSON.parse(process.argv[2]);
const salida = caso.casos.map((c) => {
  const L = c.lamina_millares_ha;
  const banda = { p10: L, p50: L, p90: L };
  return {
    cultivo: c.cultivo,
    hectareas: reglas.hectareasQueAlcanzan(caso.area_ha, caso.dotacion_millares_ha, banda),
    cobertura: reglas.cobertura(caso.dotacion_millares_ha, L),
    semaforo: reglas.semaforoAgua(caso.dotacion_millares_ha, banda, false),
  };
});
console.log(JSON.stringify(salida));
"""


def numeros(texto):
    return {float(x) for x in re.findall(r"\d+(?:\.\d+)?", texto)}


@functools.lru_cache(maxsize=1)
def evaluar_en_node():
    assert shutil.which("node"), "Se necesita node (Node 22) para ejecutar web/reglas.js"
    p = subprocess.run(["node", "--input-type=module", "-e", SCRIPT_NODE,
                        str(RAIZ / "web/reglas.js"), json.dumps(CASO)],
                       capture_output=True, text=True, encoding="utf-8", timeout=60)
    assert p.returncode == 0, f"node falló: {p.stderr}"
    return {r["cultivo"]: r for r in json.loads(p.stdout)}


def test_la_cita_esta_en_s9_y_el_caso_sale_de_ella():
    s9 = (RAIZ / CASO["documento"]).read_text(encoding="utf-8")
    assert CASO["cita"] in s9, "La cita del caso ya no coincide con S9 §5"
    en_cita = numeros(CASO["cita"])
    usados = [CASO["area_ha"], CASO["dotacion_millares_ha"], CASO["total_millares"]]
    for c in CASO["casos"]:
        usados += [c["lamina_millares_ha"], c["hectareas_esperadas"]]
    for v in usados:
        assert float(v) in en_cita, f"{v} no aparece en la cita de S9"


def test_total_de_millares():
    # 10 ha × 3.5 millares/ha = 35 millares (S9 §5).
    assert CASO["area_ha"] * CASO["dotacion_millares_ha"] == pytest.approx(CASO["total_millares"])


@pytest.mark.parametrize("caso", CASO["casos"], ids=lambda c: c["cultivo"])
def test_hectareas_que_alcanzan_con_reglas_js(caso):
    resultado = evaluar_en_node()[caso["cultivo"]]
    tolerancia = 0.5 * 10 ** -CASO["decimales_publicados"]  # precisión con la que S9 publica el dato
    ha = resultado["hectareas"]
    assert abs(ha["p50"] - caso["hectareas_esperadas"]) <= tolerancia, (
        f"{caso['cultivo']}: reglas.js da {ha['p50']} ha; S9 publica {caso['hectareas_esperadas']}")
    # Sin banda, el rango colapsa al valor central.
    assert ha["bajo"] == ha["p50"] == ha["alto"]
    # Con 3.5 millares/ha ninguna de las tres láminas queda cubierta: cobertura < 1 y semáforo rojo.
    assert resultado["cobertura"] < 1
    assert resultado["semaforo"] == "rojo"
