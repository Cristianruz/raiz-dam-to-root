<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Automated test results (written by `python construir.py`; not edited by hand)

English version of [docs/pruebas.md](../pruebas.md); if they differ, the Spanish original prevails.

Run: 2026-11-15T19:01:35+00:00 · duration 67.9 s

| Step | Status | Detail |
|---|---|---|
| Re-download of source data (optional) | skipped | not requested (use --origen) |
| Team deliveries validated against the data contract | skipped | RAIZ_BUZON is not set: no deliveries were validated in this run (the earlier cache in data/processed is used) |
| Cube engine | passed | REAL cube: 1239 fields, 458 classified, 1267 options |
| Terrain & runoff layer | passed | areas: delicias_saucillo, lazaro_cardenas |
| Digital twin, regional context and soil | passed | twin: OK · context: OK · soil: OK · dashboard: OK · rainfall range: OK |
| Offline app (installable page) | passed | precache 99260831582aec05 |
| Manifest of every figure | passed | 141424 figures (0 simulated), 35 source files, 59 notices |
| Data contract, including the water balance of “Follow the drop” | passed | CONTRACT OK |
| Figure checker on the page's explanations | passed | CHECKER OK; golden set in docs/figuras/llm_eval.csv |
| Python tests | passed | 1260 passed, 30 warnings in 54.70s |
| JavaScript tests | passed | 290 pass, 0 fail, 0 skipped |

The browser test (`node tests/e2e/web_smoke.mjs`) runs separately, before each publication.
After this table is written, step 5c (`motor/pruebas_web.py`) builds `web/data/pruebas.json` from it: «About & Data» shows it as the automated gate.
