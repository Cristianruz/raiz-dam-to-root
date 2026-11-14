<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Resultado de las pruebas (generado por `python construir.py`; no se edita a mano)

Corrida: 2026-11-14T21:41:59+00:00 · duración 16.9 s

| Paso | Estado | Detalle |
|---|---|---|
| origen | OMITIDO | no solicitado (use --origen) |
| ensamblar | OMITIDO | sin RAIZ_BUZON: no se validaron entregas en esta corrida (se usa la caché previa de data/processed) |
| simulados | OK | cubo REAL: 1239 parcelas, 458 clasificadas, 1492 opciones |
| relieve | OK | zonas: delicias_saucillo, lazaro_cardenas |
| manifest | OK | 55189 cifras (0 simuladas), 23 fuentes de origen, 33 avisos |
| contrato | OK | CONTRATO OK |
| verificador | OK | VERIFICADOR OK; set dorado en docs/figuras/llm_eval.csv |
| pytest | OK | 542 passed, 30 warnings in 15.38s |
| node | OK | 57 pass, 0 fail, 0 skipped |

La prueba con navegador (`node tests/e2e/web_smoke.mjs`) se corre aparte y antes de cada publicación.
Después de escribir esta tabla, el paso 5c (`motor/pruebas_web.py`) genera `web/data/pruebas.json` a partir de ella: la sección «About & Data» de la web la muestra como «puerta automática».
