*AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026*

# Raíz – From Dam to Root

Team **Los Norteados** · NASA Space Apps Challenge 2026, Chihuahua local event · Challenge *Field Shift: Adapting Farms with NASA Data*

> **Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover.** (S9 §1)

**Status (Nov 14, 2026):** the web app reads real team deliveries (`web/data/cubo.json` → `meta.mock: false`). Every **[PENDING]** item is replaced with its result, or with "not run", before submission. **Live site:** https://cristianruz.github.io/raiz-dam-to-root/ [PENDING: GitHub Actions publishes it from `main` when every test passes; this branch is not merged yet].

Labels used everywhere: **[V]** verified in a primary source · **[P]** press or secondary source · **[S]** declared assumption · **[NE]** not found.

## Summary

Raíz is a pre-planting web tool for the DR-005 Delicias irrigation district (Chihuahua, Mexico). For each estimated field it shows every crop option as a multi-year water commitment and sets it against the dam allocation that the user picks.

Why it matters (all figures: `docs/sintesis/S9_proyecto_definitivo.md` §2):

- Farmers decide what to plant before they know how much water the dam will deliver. The district covers 73,002 ha and 8,113 producers [V].
- Alfalfa and pecan covered 39,421 of the 62,219 ha planted in 2016-17: 63 % [V, Conagua; own calculation]. Both are perennial crops.
- In 2025 the district received no dam water: 12,000–15,000 ha were planted with wells (local press of December 2025, S9 Annex A) and 87.4 hm³ of groundwater were authorized for survival irrigation, mostly pecan (El Diario de Delicias, Jan 31, 2025, S9 Annex A) [P].
- La Boquilla dam started the 2026 cycle at 38 % (labeled [P] in S9 §2, which does not name the outlet) and held 825.577 hm³ on Nov 9, 2026, less than a third of its capacity (Impacto Noticias, Nov 9, 2026, with Conagua's daily report; S8 §2) [P].
- The Meoqui-Delicias aquifer (0831) has an availability of −167.12 hm³/year (official Conagua deficit, not a measured loss), and 83.3 % of its recharge comes from irrigation return flows [V].
- **The mechanism:** an annual crop can be skipped in a dry year; a perennial cannot. Its water stays committed for years and, when the dam falls short, it comes from the aquifer.

In a non-exhaustive search (Nov 10, 2026) we did not find a tool that shows the farmer, field by field, each crop as a multi-year water commitment against what the dam delivers (S9 §4). Related work: Mall and Herman (2019) on shortage risk from perennial expansion in California (a regional study, not a tool) and FieldSense (per-field crop history with HLS).

**Pilot areas** (`docs/decisiones/2026-11-14_dos_zonas.md`; rectangles in `data/params.json` → `zona_piloto.zonas`, [S]):

- **On the map today:** the original pilot rectangle, with 338 fields covering 5,794.33 ha; 120 are classified and 218 abstain ("not classified"), which is 65.4 % of the area (computed from `web/data/cubo.json` → `zona`: 3,789.08 ÷ 5,794.33 ha).
- **In progress:** `delicias_saucillo`, extended west to include Colonia Campesina, Colonia Nicolás Bravo (Km 92) and El Molino, and a new area, `lazaro_cardenas` (Meoqui). The live map keeps the original rectangle until the new deliveries are integrated.

## How it works

**Three screens** (S9 §3; build status in brackets):

1. **Control center** [built]. Map of the pilot area; allocation slider in *millares* per hectare (1 millar/ha = 1,000 m³/ha = 10 cm of water depth, S9 §5) with three press marks, *Like 2025* [P], and *Like 2026* and *Normal year* [P], to be confirmed (`data/params.json` → `dotaciones`), and a "Rain −20 %" toggle. Main indicator: **water already committed**, the share of the allocation that perennial fields ask for before a single hectare of annual crops is planted; shown as "at least" while fields abstain. Fields are colored by "Enough water?" or by water term. Terrain and runoff layer with "Simulate a storm": data built (`web/data/relieve.json`); map display [PENDING]. **Two pilot areas:** the map is ready for `delicias_saucillo` and `lazaro_cardenas` (`docs/decisiones/2026-11-14_dos_zonas.md`): a *Pilot area* selector appears when the data carry more than one area, and the team's reference localities are drawn as points, listed as "Team reference localities (not fields)" (`web/data/cubo.json` → `localidades`). The live data still cover the original rectangle, so the selector stays hidden until the new deliveries arrive.
2. **Field sheet** [built]. Field memory since 2016; the current rotation and two alternatives (three for established alfalfa: summer irrigation cut), each with Water · Soil · Money rows; "Follow the drop" (dam → canal → field → crop → aquifer); and "Why?" with the five answers the challenge asks for. The drip scenario is shown as not available and the Money row as "no data" (see Limitations). Fixed notice: *this tool supports, never replaces, the judgment of farmers and local experts.*
3. **Message to the farmer** [PENDING]: WhatsApp preview in Spanish and a printable field sheet.

**Four pieces of our own** (S9 §4): the *water term* (each crop as a multi-year water commitment: free, ending soon or committed), the *field memory* (year-by-year state from monthly HLS greenness, with rules and no labels), *the drop* (where each millar goes, counting consumption and recharge) and *tests in sight* (five tests published whatever the result).

**Calculation** (S9 §5): gross field depth L = (ETc − effective rain) ÷ field efficiency, as a P10–P50–P90 band (FAO-56 with NASA POWER, Monte Carlo). Coverage = min(1, D ÷ L P50) for allocation D; hectares covered = area × coverage, always with its range. Traffic light: green if D covers P90, amber if it covers P50, red if it does not, gray if the crop map abstains. Term: annual crop 1 year; alfalfa 3–4 years [P, FIRA]; pecan, a 10-year calculation horizon [S]. Water already committed = Σ(area × L P50 of perennial fields) ÷ (D × total area). The slider rules live in one function, `web/reglas.js`, shared by the page and the tests.

**Pipeline:** team members deliver tables to the shared Drive folder `Raiz_entregas/`, one line per file in `LEEME.md`. `motor/ensamblar.py` validates each delivery against the data contract (`motor/esquemas.py`) and copies the valid ones, unchanged, to `data/processed/`. `python construir.py` rebuilds the cube, the relief layer and the manifest from that cache, runs the contract validator, the figure checker and every test, and writes the result table to `docs/pruebas.md`. GitHub Actions publishes `web/` when, and just when, those checks pass. The page reads its figures from `web/data/`; no figure is written by hand in the HTML or JavaScript (`tests/test_sin_cifras.py`).

## NASA Data

| Dataset | Product / ID | Resolution (as stated in repo docs) | What Raíz uses it for | In the official challenge resources? | Status |
|---|---|---|---|---|---|
| HLS v2, Harmonized Landsat Sentinel-2 | `NASA/HLS/HLSL30/v002`, `NASA/HLS/HLSS30/v002`, via Google Earth Engine | 30 m (kit v4, A4) | Monthly greenness per field: 2026 crop map (rules), field memory 2016–2026, bare-soil days (`web/data/manifest.json`) | Yes: listed as Landsat and Copernicus Sentinel-2; HLS is the NASA product that harmonizes them | In use |
| NASA POWER | Daily API, community AG | One MERRA-2 cell of 0.5° × 0.625° per zone (`web/data/manifest.json`) | Daily climate from 1984-01-01 to 2026-11-09 (`web/data/manifest.json`) for FAO-56 reference ET and crop water need; storm depth: 95th percentile of the days with rain ≥ 1 mm, from the PRECTOTCORR variable (`web/data/relieve.json` → `zonas.*.tormenta`) | Yes | In use |
| NASADEM | `NASA/NASADEM_HGT/001`, via Earth Engine | 30 m (`data/processed/relieve_meta.json`) | Slope, runoff routes and "Simulate a storm" at zone scale, not per field | Yes: listed as "SRTM or other NASA elevation products" | In use (map display [PENDING]) |
| GPM IMERG V07 | `NASA/GPM_L3/IMERG_V07` (kit v4, A9) | — | Planned alternative source of the storm depth | Yes | Requested, not yet integrated: no IMERG file in `data/processed/`; the storm uses NASA POWER PRECTOTCORR |
| SSEBop VIIRS v6 (USGS product on NASA VIIRS) | `projects/usgs-ssebop/viirs_et_v6_monthly` (community catalog) | 1 km (S8, decision 4) | Regional contrast of the modeled ET (test 5), never per field | VIIRS yes; SSEBop is a USGS product built on it | Not run |

Source of the "official resources" column: `docs/referencias/recursos_reto.md`.

**Third-party and local data** (not in the official list):

- **Fields of The World 2025** global field-boundary predictions (Source Cooperative, CC-BY-4.0): field polygons and a confidence layer. A neural network used outside its training domain; fields with confidence below 50 abstain (`data/params.json` → `mapa.ftw_confianza_min`). *Field boundaries are NN predictions outside the model's training domain; filtered by confidence; manual review of the showcased fields [PENDING].*
- **Conagua**: aquifer 0831 technical report (DR_0831, return-flow coefficients [V]), dam storage (via press [P]) and district statistics; **SIH** daily La Boquilla outflow, the back-test truth (not downloaded yet).
- **INIFAP** crop water depths [V], FIRA alfalfa stand life [P] and IMTA canal conveyance efficiency [V], as cited in S9 and `data/params.json`.
- **WaPOR v3** (FAO, 300 m, S8 decision 4): second regional ET contrast, not run. OpenStreetMap base map.

## Validation

**Five tests in sight** (S9 §6). Each criterion was declared before seeing the result; each result is published here with the same visibility, favorable, unfavorable or not run.

| # | Test | Criterion (declared beforehand) | Current result |
|---|---|---|---|
| 1 | Crop map | Macro F1 with 5 km spatial blocks; areas with Olofsson; abstain if p < 0.6 | **Partial.** Phenological rules so far (`acuerdo_metodos` = "1/1" in every field); Random Forest [PENDING]; blind labels and Olofsson accuracy [PENDING]. 218 of 338 fields abstain (counted in `web/data/parcelas.geojson`); 132 of them are summer annual crops the rules cannot separate (`data/processed/cultivos_parcelas.csv`) |
| 2 | Back-test 2026 (H1, preregistered) | With data up to Mar 14, the error at Jul 14 must be lower than baselines L1 and L1-s. Truth: La Boquilla outflow (SIH) | **Not run.** The SIH series `LBQCH.csv` is not in the repo |
| 3 | 2025 natural experiment (H3, preregistered) | In the year without dam water, the share of annual-crop fields with an active summer crop (maximum monthly NDVI in Jun–Sep ≥ 0.40) falls at least 25 percentage points below the 2019–2024 median of the same share; among pecan orchards, the same share stays within 10 percentage points of its median. The number of fields in each group is published (S9 §6 and Annex B) | **Not run yet** (assigned to P3; its inputs, field memory and crop map, are delivered) |
| 4 | Figure checker | 30 cases, with traps; 0 % of figures altered by the AI | **Run on templates.** `motor/verificador.py` runs as step 7b of `python construir.py`: the live explanations pass (`VERIFICADOR OK`), and the golden set (`tests/casos/set_dorado.json`: 25 legitimate texts and 5 traps) gives 30 of 30 cases correct, 0 of 71 numbers altered in the approved cases (target 0 %) and template use in 30 of 30 (`docs/figuras/llm_eval.csv`). There is no LLM API key, so every explanation is a template whose numbers are filled from the data; the checker has not yet been run on LLM-written text |
| 5 | Regional ET contrast and automated checks | ET vs SSEBop VIIRS (USGS) and WaPOR v3 (FAO) at zone scale; FAO-56 vs the manual's solved examples; water balance of the drop | ET contrast: **not run**. FAO-56: two solved examples reproduced on the data branch (`docs/revisiones/2026-11-14_0915_datos-satelite.md`), not yet in the build. Water balance of the drop: checked by `validar_contrato.py` on every build, **passes** |

**Open question: model vs INIFAP depth.** For alfalfa, the model's gross field depth is 28.4 millares/ha at P50 (P10–P90: 23.13–35.16; `data/processed/rotaciones.json`, rain 0 %), while S9 §5 cites 17.5 millares/ha from INIFAP [V]. The model's net depth at P50 is 1,626 mm (same file), that is 16.26 millares/ha (computed with 100 mm = 1 millar/ha, `data/params.json`), so most of the gap comes from dividing by the field (on-farm) efficiency: a declared range of 0.45–0.70 [S] with no measured value for DR-005 (`rotaciones.json` → `params.ea_gravedad`; `data/params.json` → `eficiencia.parcelaria` is still null). We will discuss with a district technician which on-farm efficiency is realistic for gravity irrigation and under which conditions the INIFAP depths apply. Until then, if the efficiency range is too low, hectares covered are understated and committed water is overstated.

**Automated gate.** `python construir.py` rebuilds everything from `data/processed/` and exits with code 1 if any step fails. Each full run writes its step table (contract, figure checker, pytest, node) to `docs/pruebas.md`; the run recorded there passes every step.

| Check | Where |
|---|---|
| Team deliveries validated against the contract schemas before entering `data/processed/` | `motor/ensamblar.py`, `motor/esquemas.py`, `tests/test_ensamblar.py` |
| Data contract v4 (P10 ≤ P50 ≤ P90, abstained fields without options, closed water balance); altered cubes are rejected | `validar_contrato.py`, `tests/test_contrato.py` |
| Cube engine with one and two zones; each field uses the depths of its own zone | `tests/test_b4.py` |
| `manifest.json` lists every figure of the cube with source, date, script and label | `tests/test_contrato.py` |
| Units, and the S9 scale example (INIFAP depths [V]) computed with the page's own function | `tests/test_unidades.py`, `tests/test_escala.py` |
| Slider rules: zero allocation, traffic light, committed water above 100 %, "at least" | `tests/reglas.test.js` |
| No hand-written figures in `index.html` or in the strings of `app.js` | `tests/test_sin_cifras.py` |
| Figure checker: no number outside placeholders, every placeholder defined, citations from the allowed list, banned wording; 30-case golden set with 5 traps | `motor/verificador.py` (step 7b), `tests/test_verificador.py`, `tests/casos/set_dorado.json` |
| Relief layer per zone | `tests/test_relieve_web.py` |
| Vendored libraries match their sha384 | `tests/versiones.test.js` |
| Browser smoke test (Playwright; desktop and phone; map without tile network) | `tests/e2e/web_smoke.mjs`: run locally, not yet in CI (needs Chromium) |

**Continuous integration** (`.github/workflows/publicar.yml`): every push and pull request runs `python construir.py`, plus a pip-audit job; on a push to `main` it deploys `web/` to GitHub Pages when, and just when, the test job passes. Code reviews by independent agents are logged in `docs/revisiones/` and `docs/progreso.md`.

## Limitations

The tool does not allocate, sell or trade water (art. 22 of Mexico's National Water Law, S9 §11); it does not forecast the dam; it does not promise that any water will be freed; it supports, never replaces, the judgment of farmers and technicians. Main open limitations today: field boundaries estimated by a model outside its training domain; a rules-based crop map with high abstention; the field-efficiency assumption [S]; no drip scenario; a Money row without verified data; NASADEM at 30 m used at zone scale; no LiDAR; one NASA POWER cell per zone; OpenET does not cover Mexico yet. Full list: [LIMITATIONS.md](LIMITATIONS.md).

## SI/AI tools used

| Component | Tool | What the AI did | What the team did | How it is verified |
|---|---|---|---|---|
| Integration code (engine, validator, web, tests, CI) | Claude Code (integrator session, Cristian), with multi-agent workflows: implementer agents and independent reviewer agents with fresh context | Wrote code and documents from the kit prompts and the data contract; reviewers report findings and do not edit | Design, specifications, acceptance tests and decisions. Claude Code commits in Cristian's session on a working branch; Cristian merges to `main` | `python construir.py` gate before publishing; review protocol in `docs/prompts/`, logs in `docs/revisiones/` and `docs/progreso.md` |
| Data scripts and Earth Engine runs | A separate Claude session in the browser | Wrote and ran Earth Engine (HLS, field memory, NASADEM), Fields of The World extraction, NASA POWER with FAO-56, the rules crop map, water demand and relief (`AI_USAGE.md`) | Specification (kit v4), thresholds and review | Independent reviews of the data branch (`docs/revisiones/`); mailbox validator; sha256 of each delivery (`data/processed/fuentes.json`) |
| Teammates' work (P2–P6) | Gemini in Google Colab or Claude in the browser | Scoped notebooks and data-verification cells | Running, checking and delivering | Fresh-context review (`docs/prompts/para_gemini.md`); mailbox validator. Their lines in `AI_USAGE.md` are [PENDING]: each teammate fills them in on delivery |
| Crop map 2026 | Phenological rules so far; Random Forest (machine learning) [PENDING] | Classification [PENDING] | Declared rules and thresholds; blind labels [PENDING] | Abstention rule; Olofsson accuracy with 95 % CI [PENDING] |
| Field memory | None (rules on monthly NDVI) | — | Declared rules and thresholds | H3 (not run yet) |
| Explanations | No LLM in the app today: template texts with placeholders, drafted with Claude Code | Drafted the template wording, without numbers | Facts and sources; final texts [PENDING] | The page has no hand-written figures (`tests/test_sin_cifras.py`); figure checker on every build: 30 of 30 golden cases correct, 0 % of numbers altered, all explanations are templates because there is no LLM API key (`docs/figuras/llm_eval.csv`) |
| Field boundaries | Fields of The World neural network (2025 global predictions, CC-BY-4.0; third-party data) | Field segmentation | Confidence filter; manual review of the featured fields [PENDING] | FTW confidence layer |
| Prior research | Claude (incl. Research mode and agents), ChatGPT (incl. Deep Research), Gemini, DeepSeek and NotebookLM | Search and synthesis of sources | Each figure checked in its original source | Labels [V], [P], [S], [NE] |
| Project documents before the event | Claude (project chat) | Drafted the project definition, approach, event plan, build kit v4 and proposal, without code | Review by the team | Labels [V], [P], [S], [NE]; `AI_USAGE.md` |
| Page texts (this README, `LIMITATIONS.md`) | Claude Code: a drafting agent and a figure-review agent, working from the repo files | Draft in English | Editing and checking every figure [PENDING] | Every figure cited inline with its source file |
| Images or video | [PENDING] | — | Screen captures of the real app | — |

**Where AI is not used:** the dam volume is not forecast (the user picks the allocation; its marks are published figures); the planting decision is not made by the tool; water is not computed by an LLM (FAO-56 and explicit rules do that); no numbers are generated by AI (they come from the data files, and texts carry placeholders).

*AI never generates the numbers or makes the decision; farmers and technicians decide.* Task-by-task log: [AI_USAGE.md](AI_USAGE.md).

## References

- Allen, R. G., Pereira, L. S., Raes, D. and Smith, M. (1998). *Crop evapotranspiration — Guidelines for computing crop water requirements.* FAO Irrigation and Drainage Paper 56.
- Conagua (2024). *Actualización de la disponibilidad media anual de agua en el acuífero Meoqui-Delicias (0831)*, technical report DR_0831. https://sigagis.conagua.gob.mx/gas1/Edos_Acuiferos_18/chihuahua/DR_0831.pdf
- IMTA, COMEII 2021: canal conveyance efficiency, measured 2012–2016 [V] (`data/params.json`). FIRA AGROCOSTOS 2025: alfalfa stand life [P]. INIFAP: crop water depths [V]. [PENDING: full citations]
- Grafton, R. Q. et al. (2018), *Science*: irrigation efficiency and return flows. Mall, N. K. and Herman, J. D. (2019): shortage risk from perennial-crop expansion in California. Olofsson, P. et al. (2014): area and accuracy assessment. [PENDING: full citations]
- Senay, G. B., Kagone, S. and Velpuri, N. M. (2020). Operational Global Actual Evapotranspiration using the SSEBop model. USGS data release, https://doi.org/10.5066/P9OUVUUI (planned contrast; not run).
- Press (figures labeled [P]): El Diario de Chihuahua, Oct 28, 2024 (*Like 2025* mark) and Jul 27, 2026 (*Like 2026* and *Normal year* marks; article not read directly) (`data/params.json` → `dotaciones`); Impacto Noticias, Nov 9, 2026, with Conagua's daily report (La Boquilla storage; S8 §2); El Diario de Delicias, Jan 31, 2025 (87.4 hm³ of groundwater in 2025; S9 Annex A); local press of December 2025 (12,000–15,000 ha planted with wells; S9 Annex A, which does not name the outlet). The 38 % at the start of the 2026 cycle is labeled [P] in S9 §2, which does not name the outlet.
- Data: NASA POWER Daily API, https://power.larc.nasa.gov/api/temporal/daily/point (community AG); HLS `NASA/HLS/HLSL30/v002` and `NASA/HLS/HLSS30/v002`; NASADEM `NASA/NASADEM_HGT/001`; Fields of The World 2025 global predictions, Source Cooperative `source.coop/ftw/global-data` (CC-BY-4.0). [PENDING: formal dataset citations]
- Challenge: https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/
- Libraries: MapLibre GL JS 5.24.0, d3 7.9.0 and d3-sankey 0.12.3, copied unchanged from npm and verified by sha384 (`web/vendor/VERSIONS.json`); pytest 9.1.0 (`requirements.txt`). Development skills and agents copied with their licenses (`.claude/skills/README.md`, `.claude/agents/README.md`).

## How to run

Requirements: Python 3.12 and Node 22, the versions pinned in `.github/workflows/publicar.yml`.

```bash
python -m pip install -r requirements.txt
python construir.py              # rebuild everything from the cache (data/processed) and run every check
python construir.py --rapido     # same, without pytest and node (to iterate)
python construir.py --origen     # re-download what has a public API (npm libraries), then rebuild
RAIZ_BUZON=/path/to/Raiz_entregas python construir.py   # validate new team deliveries from the synced Drive folder
python -m http.server --directory web                   # view the site locally
node tests/e2e/web_smoke.mjs     # browser smoke test (needs Playwright and Chromium)
```

`python construir.py` runs these steps in order (if one fails, it is reported and the rest still run) and prints a report of ten lines plus lines 5b and 7b; the numbers below are the report lines:

- **1. Origin:** with `--origen`, re-downloads the npm libraries and lists the Earth Engine pieces; otherwise skipped.
- **2–4. Mailbox:** `motor/ensamblar.py` validates the mailbox (`RAIZ_BUZON`) against `motor/esquemas.py` and copies valid deliveries to `data/processed/` (log in `docs/entregas_log.md`); the report counts what entered, was rejected or held, and lists what is still simulated.
- **5. Cube:** `motor/b4_cubo.py` builds `web/data/cubo.json`, `parcelas.geojson` and `explicaciones.json` from real data when its required inputs are in `data/processed/`; otherwise `motor/simulados.py` regenerates the simulated data.
- **5b. Relief:** `motor/relieve_web.py` copies the runoff routes and the storm depth per zone to `web/data/relieve.json` and `relieve_rutas.geojson`, or reports "not run".
- **6. Manifest:** `motor/manifest.py` writes `web/data/manifest.json` (source, date, script and label of every figure).
- **7. Contract:** `python validar_contrato.py` must print `CONTRATO OK`.
- **7b. Figure checker:** `motor/verificador.py web/data/explicaciones.json --reporte` must print `VERIFICADOR OK`; it also runs the golden set (`tests/casos/set_dorado.json`) and rewrites `docs/figuras/llm_eval.csv`.
- **8. pytest:** `pytest -q tests/`. **9. node:** `node --test` on `tests/**/*.test.js`.
- **10. Result:** exit code 0 when everything passes; pieces that do not exist yet are reported as pending, not as failures. A full run (not `--rapido`) also writes the step table to `docs/pruebas.md`.

`--origen` re-downloads the npm tarballs listed in `web/vendor/VERSIONS.json` and compares their hashes; NASA POWER and Fields of The World arrive through the mailbox; the Earth Engine pieces (A3, A3-M, A8, A9) are listed in order but run in a separate session, never here. Dependabot (`.github/dependabot.yml`) checks the actions and Python dependencies weekly.

## Repository layout

| Path | Contents |
|---|---|
| `construir.py` | Single rebuild command |
| `validar_contrato.py` | Data-contract validator (kit v4 §2.2–2.5, extended for two zones) |
| `requirements.txt`, `package.json` | Python dependencies with exact versions; Node test script (no dependencies) |
| `data/params.json` | Every constant of the project, with value, unit, source and label |
| `data/opciones_b4.json` | Provisional crop options per current crop [S], until the team's rotation table arrives |
| `data/processed/` | Validated cache of the team's deliveries, with sha256 in `fuentes.json` |
| `data/raw/`, `data/simulados.json` | Untouched public data (empty so far); inputs of the simulated data (not data) |
| `motor/` | `ensamblar.py` and `esquemas.py` (mailbox), `b4_cubo.py` (cube and the drop), `relieve_web.py` (relief layer), `manifest.py`, `verificador.py` (figure checker), `simulados.py` |
| `tests/` | pytest suites (`test_contrato.py`, `test_ensamblar.py`, `test_b4.py`, `test_unidades.py`, `test_escala.py`, `test_sin_cifras.py`, `test_relieve_web.py`, `test_verificador.py`) and `node --test` suites (`reglas.test.js`, `versiones.test.js`); `e2e/web_smoke.mjs` (browser smoke test); `fixtures/` and `casos/` (S9 scale example and the checker's golden set) with their sources |
| `web/` | Static site: `index.html`, `app.js`, `style.css`, `reglas.js`, `vendor/` (pinned libraries) and `data/` (`parcelas.geojson`, `cubo.json`, `explicaciones.json`, `manifest.json`, `relieve.json`, `relieve_rutas.geojson`) |
| `datos/` | Placeholder; the data scripts live on the `datos-satelite` branch and in Drive |
| `docs/sintesis/`, `docs/kit/` | Project definition (S9), decisions (S8), event plan (S10); build kit v4 |
| `docs/decisiones/`, `docs/referencias/`, `docs/revisiones/` | Decisions (two pilot areas); challenge resources and references; independent reviews |
| `docs/equipo/`, `docs/prompts/` | Team guides by role; review protocol and prompts (implementer → reviewer → correction) |
| `docs/progreso.md`, `docs/entregas_log.md` | Build log; mailbox log |
| `docs/pruebas.md`, `docs/figuras/llm_eval.csv` | Step table of the last full `python construir.py` run; figure-checker golden-set report (both generated, not edited by hand) |
| `.github/workflows/publicar.yml`, `.github/dependabot.yml` | Build-test-publish workflow; dependency updates |
| `.claude/skills/`, `.claude/agents/` | Development skills and reviewer agents, with origin and license |
| `entregables/` | Pre-event proposal and summaries (Word) |
| `CLAUDE.md`, `AI_USAGE.md`, `LIMITATIONS.md`, `DATA_LICENSE.md` | Rules for the AI, AI usage log, declared limitations, data licenses |

## License

Code: Apache-2.0 (`LICENSE`). Third-party data and libraries keep their own licenses, for example Fields of The World, CC-BY-4.0 (`DATA_LICENSE.md`).

## Resumen en español

Raíz muestra, antes de sembrar, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa (S9 §1). Zona piloto del DR-005 Delicias, Chihuahua, con datos abiertos de la NASA (HLS, POWER y NASADEM). La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y apoya, sin sustituir, el juicio del agricultor y del técnico. Las pruebas que aún no se ejecutan se publican como «not run».
