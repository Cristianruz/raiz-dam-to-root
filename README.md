*AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026*

# Raíz – From Dam to Root

Team **Los Norteados** · NASA Space Apps Challenge 2026, Chihuahua local event · Challenge *Field Shift: Adapting Farms with NASA Data*

> **Status (Nov 14, 2026): under construction.** The web app currently runs on **SIMULATED data** (`web/data/cubo.json` → `meta.mock: true`) while the team's real tables arrive. Every item marked **[PENDING]** is replaced with real results, or with "not run", before submission.

**Live site:** https://cristianruz.github.io/raiz-dam-to-root/ — [PENDING: GitHub Actions publishes it from `main` once every test passes]

## Summary

**Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover.**

Why it matters, in the DR-005 Delicias irrigation district (Chihuahua, Mexico):

- Farmers decide what to plant before they know how much water the dam will deliver. The district covers 73,002 ha and 8,113 producers [V].
- Alfalfa and pecan covered 39,421 of the 62,219 ha planted in 2016-17: 63 % [V, Conagua; own calculation]. Both are perennial crops.
- In 2025 the district received no water from the dams: 12,000–15,000 ha were planted with wells and 87.4 hm³ of groundwater were authorized for survival irrigation, mostly pecan [P].
- La Boquilla dam started the 2026 cycle at 38 % and held 825.577 hm³ on Nov 9, 2026, less than a third of its capacity [P].
- The Meoqui-Delicias aquifer (0831) has an availability of −167.12 hm³/year (official Conagua deficit, not a measured loss), and 83.3 % of its recharge comes from irrigation return flows [V].
- **The mechanism:** an annual crop can be skipped in a dry year; a perennial cannot. Its water stays committed for years and, when the dam falls short, it comes from the aquifer.

Labels used everywhere: **[V]** verified in a primary source · **[P]** press or secondary source · **[S]** declared assumption · **[NE]** not found. Source for every figure in this section: `docs/sintesis/S9_proyecto_definitivo.md` §2.

## How it works

**Three screens** (S9 §3):

1. **Control center.** Map of the pilot area with a water-allocation slider from 0 to 12 *millares* per hectare (thousand m³/ha) and three marks: *Like 2025* (≈1, from wells [P]), *Like 2026* (3–4 [P]) and *Normal year* (9–10 [P]); plus a "Rain −20%" toggle. Main indicator: **water already committed** — the share of the allocation that perennial crops ask for before a single hectare of annual crops is planted. Fields are colored by "Enough water?" or by water term.
2. **Field sheet.** The field memory since 2016; the current rotation and two alternatives (three for established alfalfa: summer irrigation cut), each with Water · Soil · Money rows; "Follow the drop" (dam → canal → field → crop → aquifer, with "What if this field switches to drip?" and a consumption cap); and "Why?" with the five answers the challenge asks for. Fixed notice: *this tool supports, never replaces, the judgment of farmers and local experts.*
3. **Message to the farmer.** WhatsApp preview in Spanish and a printable field sheet.

**Four pieces of our own** (S9 §4): the *water term* (each crop as a multi-year water commitment: free, ending soon or committed), the *field memory* (year-by-year state from monthly HLS greenness, with rules and no labels), *the drop* (where each millar goes, counting consumption and recharge) and *tests in sight* (five tests published whatever the result).

**Calculation** (S9 §5):

- Unit: 1 millar/ha = 1,000 m³/ha = 10 cm of water depth.
- Gross field depth L = (ETc − effective rain) ÷ field efficiency, with a P10–P50–P90 band.
- Coverage = min(1, D ÷ L P50); hectares covered = area × coverage, always shown with its range (low end with P90, high end with P10).
- Traffic light: green if D covers P90; amber if it covers P50; red if it does not cover P50; gray if the crop map abstains.
- Term: annual crop 1 year; alfalfa 3–4 years [P, FIRA]; pecan, 10-year calculation horizon [S]. Commitment = L P50 × remaining years.
- Water already committed = Σ(area × L P50 of perennial fields) ÷ (D × total area). Above 100 %, the gap comes from wells or stays unmet; with unclassified area it is shown as "at least".
- The slider rules live in one function, `web/reglas.js`, used by the page and by the automated tests.

**Pipeline:** team members deliver tables to a shared mailbox; `motor/ensamblar.py` [PENDING] validates each one against the data contract and copies the valid ones to `data/processed/`; `python construir.py` rebuilds data, calculation, manifest and tests from that cache; GitHub Actions publishes `web/` when, and just when, every test passes.

## NASA Data

| Dataset | Use in Raíz | Status |
|---|---|---|
| HLS — Harmonized Landsat Sentinel-2 v2.0 (HLSL30 and HLSS30) | Field memory 2016–2026, 2026 crop map and bare-soil days in the windy season | [PENDING] |
| NASA POWER, Daily API (community AG) | Daily climate for FAO-56 reference evapotranspiration and crop water need | [PENDING] |
| NASADEM (30 m) | Zone-scale relief and runoff layer; "Simulate a storm" | [PENDING] |
| GPM IMERG (or POWER precipitation) | Heavy-rain depth (95th percentile of daily rain) for the storm | [PENDING] |

Other open data: Fields of The World 2025 field boundaries (CC-BY-4.0); SSEBop VIIRS (USGS) and WaPOR v3 (FAO) for the regional ET contrast; Conagua (aquifer 0831 technical report, dam storage, district statistics); SIH (La Boquilla outflow, back-test truth).

## Validation

**Five tests in sight** (S9 §6). Each criterion was declared before seeing the result; each result is published, favorable or not.

| # | Test | Criterion | Result |
|---|---|---|---|
| 1 | Crop map | Macro F1 with 5 km spatial blocks; areas with Olofsson; abstain if p < 0.6 | [PENDING] |
| 2 | Back-test 2026 (H1, preregistered) | With data up to Mar 14, the error at Jul 14 must be lower than baselines L1 and L1-s. Truth: La Boquilla outflow (SIH) | [PENDING] |
| 3 | 2025 natural experiment (H3, preregistered) | In the year without dam water, the share of annual-crop fields with a summer crop falls 25 points or more below its 2019–2024 median, and pecan orchards stay within 10 points of theirs | [PENDING] |
| 4 | Figure checker | 30 cases, with traps; 0 % of figures altered by the AI | [PENDING] |
| 5 | Regional ET contrast and automated tests | ET vs SSEBop VIIRS (USGS) and WaPOR v3 (FAO); FAO-56 vs the manual's solved examples; water balance of the drop | [PENDING] |

**Automated checks** run by `python construir.py` on every push; GitHub Pages is updated solely when all of them pass:

| Check | File |
|---|---|
| Data contract v4 passes, and an altered cube (P50 > P90, stored water light, broken balance…) is rejected | `tests/test_contrato.py` |
| `manifest.json` lists every figure of the cube with source, date, script and label | `tests/test_contrato.py` |
| Units: 1 millar/ha = 1,000 m³/ha = 10 cm = 100 mm | `tests/test_unidades.py` |
| S9 scale example (INIFAP depths [V]): 10 ha at 3.5 millares/ha → 2.0 ha of alfalfa (17.5), 5.1 ha of cotton (6.8), 6.4 ha of forage maize (5.5), computed with the page's own function | `tests/test_escala.py` |
| Slider rules: D = 0, zero depth, green/amber/red/gray, committed water above 100 %, "at least" | `tests/reglas.test.js` |
| No hand-written figures in `index.html` or in the strings of `app.js` | `tests/test_sin_cifras.py` |
| Vendored libraries match their sha384; external scripts must pin version, integrity and crossorigin | `tests/versiones.test.js` |

[PENDING: FAO-56 solved examples, water balance of the drop, 30-case figure checker, coherence checks; results in `docs/pruebas.md`.]

## Limitations

The tool does not allocate, sell or trade water (art. 22 of Mexico's National Water Law), does not forecast the dam, does not promise water savings and does not replace farmers or technicians. Field boundaries are estimated; the crop map is validated against photo-interpretation, not field visits; OpenET does not cover Mexico yet. The current web data are simulated. Full list: [LIMITATIONS.md](LIMITATIONS.md).

## SI/AI tools used

| Component | Tool | What the AI did | What the team did | How it is verified |
|---|---|---|---|---|
| Code (scripts, notebooks, web, tests) | Claude Code (Cristian); Gemini in Colab (team members, scoped tasks) | Wrote code from our prompts and the data contract | Design, prompts, acceptance tests and review | Automated tests that gate publication; `validar_contrato.py` |
| Crop map | Random Forest (machine learning) + phenological rules | Classification | Blind labeling by two people; spatial validation | Olofsson, 95 % CI [PENDING] |
| Field memory | None (rules) | — | Declared rules and thresholds; sensitivity | Agreement with 2026 labels; H3 preregistered [PENDING] |
| Explanations | Claude (LLM) | Drafts with placeholders, no numbers | Facts, sources and golden set | 0 % altered numbers in 30 cases [PENDING] |
| Field boundaries | Fields of The World neural network (2025 global predictions, CC-BY-4.0; third-party data) | Field segmentation | Confidence filter; manual review of the featured fields | FTW confidence layer |
| Prior research | Claude (including Research mode and agents), ChatGPT (including Deep Research), Gemini, DeepSeek and NotebookLM | Search and synthesis of sources | Each figure checked in its original source | Labels [V], [P], [S], [NE] |
| Page texts | Claude and Gemini | Drafts in English | Editing and checking every figure | Figure → source list |
| Images or video | [PENDING] | — | Screen captures of the real app | — |

**Where AI is not used:** the dam volume is not forecast (the user picks the allocation; its marks are published figures); the planting decision is not made by the tool; water is not computed by an LLM (FAO-56 and explicit rules do that); no numbers are generated by AI (the LLM writes text, and a checker verifies every number).

*AI never generates the numbers or makes the decision; farmers and technicians decide.* Task-by-task log: [AI_USAGE.md](AI_USAGE.md).

## References

- Conagua (2024). *Actualización de la disponibilidad media anual de agua en el acuífero Meoqui-Delicias (0831)*, technical report DR_0831. https://sigagis.conagua.gob.mx/gas1/Edos_Acuiferos_18/chihuahua/DR_0831.pdf
- Allen, R. G., Pereira, L. S., Raes, D. and Smith, M. (1998). *Crop evapotranspiration — Guidelines for computing crop water requirements.* FAO Irrigation and Drainage Paper 56.
- IMTA, COMEII 2021: canal conveyance efficiency, mean 0.60, measured range 0.470–0.681 (2012–2016) [V].
- FIRA: alfalfa stand life of 3–4 years [P]. INIFAP: crop water depths used in the scale example [V]. [PENDING: full citations]
- Grafton, R. Q. et al. (2018), *Science* — irrigation efficiency and return flows. [PENDING: full citation]
- Mall, N. K. and Herman, J. D. (2019) — water-shortage risk from perennial-crop expansion in California. [PENDING: full citation]
- Press (figures labeled [P]): El Diario de Chihuahua (Oct 28, 2024; Jul 27, 2026), Impacto Noticias (Nov 9, 2026), Quadratín Chihuahua (Oct 31, 2026), El Diario de Delicias (Jan 31, 2025).
- NASA POWER Daily API: https://power.larc.nasa.gov/api/temporal/daily/point (community AG). HLS collections `NASA/HLS/HLSL30/v002` and `NASA/HLS/HLSS30/v002`. NASADEM. GPM IMERG.
- Fields of The World, 2025 global field-boundary predictions (CC-BY-4.0).
- Libraries: MapLibre GL JS 5.24.0, d3 7.9.0 and d3-sankey 0.12.3, copied unchanged from npm and verified by sha384 (`web/vendor/VERSIONS.json`); pytest 8.4.2.

## How to run

Requirements: Python 3.12 or newer and Node 22.

```bash
python -m pip install -r requirements.txt
python construir.py              # rebuild everything from the cache (data/processed) and run every test
python construir.py --rapido     # same, without pytest and node (to iterate)
python construir.py --origen     # re-download source data that has a public API, then rebuild
RAIZ_BUZON=/path/to/Raiz python construir.py   # read team deliveries from the synced mailbox
python -m http.server --directory web          # view the site locally
```

`python construir.py` runs, in order: (a) `motor/ensamblar.py` (validates the mailbox; reported as pending while that file does not exist); (b) `motor/simulados.py` (regenerates the simulated data while no real delivery has come in); (c) `motor/manifest.py` (writes `web/data/manifest.json`: source, date, script and label of every figure); (d) `python validar_contrato.py` (must print `CONTRATO OK`); (e) `pytest -q tests/`; (f) `node --test` on `tests/**/*.test.js`; (g) a 10-line report. It exits with 0 when everything passes; pieces that do not exist yet are reported as pending, not as failures.

`--origen` re-downloads the npm tarballs listed in `web/vendor/VERSIONS.json` and compares their sha512 and every file's sha384; NASA POWER and Fields of The World are listed as "pending: delivered through the mailbox"; the Earth Engine pieces (A3, A3-M, A8, A9) are listed in order but run in a separate session, not here.

**Continuous integration** (`.github/workflows/publicar.yml`): on every push and pull request it installs `requirements.txt` and runs `python construir.py`; a separate job audits the Python dependencies with pip-audit. On a push to `main`, and when the test job passes, it deploys `web/` to GitHub Pages (the repository needs *Settings → Pages → Source: GitHub Actions*). Dependabot (`.github/dependabot.yml`) checks the actions and Python dependencies weekly.

## Repository layout

| Path | Contents |
|---|---|
| `construir.py` | Single rebuild command |
| `validar_contrato.py` | Data-contract validator (kit v4 §2.2–2.5) |
| `requirements.txt` | Python dependencies, exact versions |
| `data/params.json` | Every constant of the project, with value, unit, source and label |
| `data/raw/`, `data/processed/` | Untouched public data; validated cache of the team's tables |
| `data/simulados.json` | Inputs of the simulated data (not data) |
| `datos/` | Colab notebooks (A1 to A8) |
| `motor/` | Mailbox assembler, simulated data, manifest and model steps (B1–B4, X3.1) |
| `tests/` | Automated tests (pytest and `node --test`) and test cases with their sources |
| `web/` | Static site: `index.html`, `app.js`, `style.css`, `reglas.js`, `vendor/` (pinned libraries) and `data/` (`parcelas.geojson`, `cubo.json`, `explicaciones.json`, `manifest.json`) |
| `docs/` | Project definition (S9), decisions (S8), build kit (v4), event plan (S10), reviews |
| `entregables/` | Pre-event proposal and summaries (Word) |
| `.github/` | Build-test-publish workflow and Dependabot |
| `CLAUDE.md`, `AI_USAGE.md`, `LIMITATIONS.md` | Rules for the AI, AI usage log, declared limitations |

## License

Code: Apache-2.0 [PENDING: LICENSE file]. Third-party data keep their own licenses (for example, Fields of The World, CC-BY-4.0).
