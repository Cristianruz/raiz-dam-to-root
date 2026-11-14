<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Resultado de las pruebas (generado por `python construir.py`; no se edita a mano)

Corrida: 2026-11-14T20:32:20+00:00 · duración 9.4 s

| Paso | Estado | Detalle |
|---|---|---|
| origen | OMITIDO | no solicitado (use --origen) |
| ensamblar | OK | buzón validado |
| simulados | OK | cubo REAL: 1239 parcelas, 458 clasificadas, 1492 opciones |
| relieve | OK | zonas: delicias_saucillo, lazaro_cardenas |
| manifest | OK | 51427 cifras (0 simuladas), 22 fuentes de origen, 33 avisos |
| contrato | OK | CONTRATO OK |
| verificador | OK | VERIFICADOR OK; set dorado en docs/figuras/llm_eval.csv |
| pytest | OK | 342 passed in 7.99s |
| node | OK | 23 pass, 0 fail, 0 skipped |

La prueba con navegador (`node tests/e2e/web_smoke.mjs`) se corre aparte y antes de cada publicación.
Después de escribir esta tabla, el paso 5c (`motor/pruebas_web.py`) genera `web/data/pruebas.json` a partir de ella: la sección «About & Data» de la web la muestra como «puerta automática».
