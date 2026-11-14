<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Resultado de las pruebas (generado por `python construir.py`; no se edita a mano)

Corrida: 2026-11-14T20:22:34+00:00 · duración 5.1 s

| Paso | Estado | Detalle |
|---|---|---|
| origen | OMITIDO | no solicitado (use --origen) |
| ensamblar | OK | buzón validado |
| simulados | OK | cubo REAL: 338 parcelas, 120 clasificadas, 399 opciones |
| relieve | OK | zonas: delicias_saucillo |
| manifest | OK | 13935 cifras (0 simuladas), 14 fuentes de origen, 29 avisos |
| contrato | OK | CONTRATO OK |
| verificador | OK | VERIFICADOR OK; set dorado en docs/figuras/llm_eval.csv |
| pytest | OK | 342 passed in 4.29s |
| node | OK | 23 pass, 0 fail, 0 skipped |

La prueba con navegador (`node tests/e2e/web_smoke.mjs`) se corre aparte y antes de cada publicación.
Después de escribir esta tabla, el paso 5c (`motor/pruebas_web.py`) genera `web/data/pruebas.json` a partir de ella: la sección «About & Data» de la web la muestra como «puerta automática».
