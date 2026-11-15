<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Automated test results (written by `python construir.py`; not edited by hand)

English version of [docs/pruebas.md](../pruebas.md); if they differ, the Spanish original prevails.

Run: 2026-11-15T05:49:14+00:00 · duration 51.2 s

| Step | Status | Detail |
|---|---|---|
| Re-download of source data (optional) | skipped | no solicitado (use --origen) |
| Team deliveries validated against the data contract | skipped | sin RAIZ_BUZON: no se validaron entregas en esta corrida (se usa la caché previa de data/processed) |
| Cube engine | passed | cubo REAL: 1239 parcelas, 458 clasificadas, 1267 opciones |
| Terrain & runoff layer | passed | zonas: delicias_saucillo, lazaro_cardenas |
| Digital twin, regional context and soil | passed | gemelo: OK · contexto: OK · suelo: OK |
| Offline app (installable page) | passed | precache 770f9cc34a4faa66 |
| Manifest of every figure | passed | 112946 cifras (0 simuladas), 35 fuentes de origen, 59 avisos |
| Data contract, including the water balance of “Follow the drop” | passed | CONTRATO OK |
| Figure checker on the page's explanations | passed | VERIFICADOR OK; set dorado en docs/figuras/llm_eval.csv |
| Python tests | passed | 1131 passed, 30 warnings in 46.55s |
| JavaScript tests | passed | 208 pass, 0 fail, 0 skipped |

The browser test (`node tests/e2e/web_smoke.mjs`) runs separately, before each publication.
After this table is written, step 5c (`motor/pruebas_web.py`) builds `web/data/pruebas.json` from it: «About & Data» shows it as the automated gate.
