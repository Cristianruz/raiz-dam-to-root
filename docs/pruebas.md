<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Resultado de las pruebas (generado por `python construir.py`; no se edita a mano)

Corrida: 2026-11-15T05:31:31+00:00 · duración 72.0 s

| Paso | Estado | Detalle |
|---|---|---|
| origen | OMITIDO | no solicitado (use --origen) |
| ensamblar | OMITIDO | sin RAIZ_BUZON: no se validaron entregas en esta corrida (se usa la caché previa de data/processed) |
| simulados | OK | cubo REAL: 1239 parcelas, 458 clasificadas, 1282 opciones |
| relieve | OK | zonas: delicias_saucillo, lazaro_cardenas |
| gemelo | OK | gemelo: OK · contexto: OK · suelo: OK |
| pwa | OK | precache 7e906f1fd81a00c4 |
| manifest | OK | 113541 cifras (0 simuladas), 35 fuentes de origen, 59 avisos |
| contrato | OK | CONTRATO OK |
| verificador | OK | VERIFICADOR OK; set dorado en docs/figuras/llm_eval.csv |
| pytest | OK | 1104 passed, 30 warnings in 65.37s (0:01:05) |
| node | OK | 208 pass, 0 fail, 0 skipped |

La prueba con navegador (`node tests/e2e/web_smoke.mjs`) se corre aparte y antes de cada publicación.
Después de escribir esta tabla, el paso 5c (`motor/pruebas_web.py`) genera `web/data/pruebas.json` a partir de ella: la sección «About & Data» de la web la muestra como «puerta automática».
