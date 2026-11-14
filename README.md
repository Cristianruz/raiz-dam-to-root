*AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026*

# Raíz – From Dam to Root

Team **Los Norteados** · NASA Space Apps Challenge 2026, Chihuahua local event · Challenge *Field Shift: Adapting Farms with NASA Data*

> **Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover.** (S9 §1)

**Status (Nov 14, 2026).** The app reads real team deliveries (`web/data/cubo.json` → `meta.mock: false`): two pilot areas and 1,239 estimated fields. Pull request #1 is merged into `main`. Every test result is published with the same visibility, favorable or not. What was not executed is labeled "not run".

Four items depend on people and are not done:

- **Public link.** Not yet: https://cristianruz.github.io/raiz-dam-to-root/ goes live when GitHub Pages is enabled for this repository (`docs/reparto_faltantes.md`, item H1). Until then, run the site locally or build the single-file offline demo (see [How to run](#how-to-run)).
- **Video.** Not yet: a video of 30 seconds or less, without voice, with English subtitles, recorded from the real app (kit v4, C7).
- **Preregistration.** Not yet: the public OSF link and the published text are not in this repository (`docs/reparto_faltantes.md`, item H3). The H3 text is in S9, Annex B. The operating points that H1 left open were fixed before running, in [`docs/h1_especificacion_operativa.md`](docs/h1_especificacion_operativa.md).
- **Featured fields.** Not yet: the manual review, in true color, of the three featured fields P0757, P0244 and L0175 (`web/data/parcelas.geojson` → `protagonista`; `docs/reparto_faltantes.md`, item D3).

Labels used everywhere: **[V]** verified in a primary source · **[P]** press or secondary source · **[S]** declared assumption · **[NE]** not found.

## Summary

Raíz is a **digital twin of the pilot areas** of the DR-005 Delicias irrigation district (Chihuahua, Mexico). It is a replica of the pilot areas that is updated with data and lets a farmer or a technician try out decisions before planting. We do not use the label to promise more than there is ([`docs/decisiones/2026-11-14_gemelo_digital.md`](docs/decisiones/2026-11-14_gemelo_digital.md)).

For each estimated field, Raíz shows every crop option as a multi-year water commitment and sets it against the dam allocation that the user picks.

| Part of a twin | In Raíz today | Where it comes from |
|---|---|---|
| Replica of the terrain and the fields | 1,239 estimated fields on a map; slope and runoff routes of each area | Fields of The World; NASADEM, 30 m |
| Observed state | Greenness of each field, year by year, 2016–2026; bare-soil days | HLS (Landsat + Sentinel-2) |
| Physical model | Water that each crop asks for; runoff routes | FAO-56 with NASA POWER; NASADEM with GPM IMERG rain |
| Scenarios | Allocation, rain −20 %, a storm, another rotation | Rules of kit v4 §2.4, computed on the device (`web/reglas.js`) |
| Synchronization | Each run of `python construir.py` rebuilds the data from the validated cache; new deliveries are validated when the mailbox (`RAIZ_BUZON`) is given | `web/data/manifest.json` records the source of every figure, and its date where one is recorded |

**What the twin is not.** It has no field sensors and no real-time data: it is refreshed on each run, from satellite and climate data. It does not forecast the dam. It does not decide for the farmer. A 3D view, a timeline, a status card, an installable app and a regional context panel are being built; the page does not have them yet (see [In progress](#in-progress-not-on-the-page-yet)).

Why it matters (all figures: `docs/sintesis/S9_proyecto_definitivo.md` §2):

- Farmers decide what to plant before they know how much water the dam will deliver. The district covers 73,002 ha and 8,113 producers [V].
- Alfalfa and pecan covered 39,421 of the 62,219 ha planted in 2016-17: 63 % [V, Conagua; own calculation]. Both are perennial crops.
- In 2025 the district received no dam water. Between 12,000 and 15,000 ha were planted with wells (local press of December 2025, S9 Annex A). 87.4 hm³ of groundwater were authorized for survival irrigation, mostly pecan (El Diario de Delicias, Jan 31, 2025, S9 Annex A) [P].
- La Boquilla dam started the 2026 cycle at 38 % (labeled [P] in S9 §2, which does not name the outlet). It held 825.577 hm³ on Nov 9, 2026, less than a third of its capacity (Impacto Noticias, Nov 9, 2026, with Conagua's daily report; S8 §2) [P].
- The Meoqui-Delicias aquifer (0831) has an availability of −167.12 hm³/year. This is Conagua's official deficit, not a measured loss. 83.3 % of its recharge comes from irrigation return flows [V].
- **The mechanism:** an annual crop can be skipped in a dry year; a perennial cannot. Its water stays committed for years and, when the dam falls short, it comes from the aquifer.

In a non-exhaustive search (Nov 10, 2026) we did not find a tool that shows the farmer, field by field, each crop as a multi-year water commitment against what the dam delivers (S9 §4). Related work: Mall and Herman (2019) on shortage risk from perennial expansion in California (a regional study, not a tool) and FieldSense (per-field crop history with HLS).

**Pilot areas** ([`docs/decisiones/2026-11-14_dos_zonas.md`](docs/decisiones/2026-11-14_dos_zonas.md); rectangles in `data/params.json` → `zona_piloto.zonas`, [S]). Counts from `web/data/cubo.json` → `zona` and `zonas`:

| Pilot area | Fields | Classified | Not classified | Area (ha) | Not classified (ha) |
|---|---|---|---|---|---|
| Delicias – Saucillo (`delicias_saucillo`) | 940 | 357 | 583 (62.0 %) | 19,145.19 | 11,976.04 |
| Lázaro Cárdenas, Meoqui (`lazaro_cardenas`) | 299 | 101 | 198 (66.2 %) | 5,847.82 | 4,575.50 |
| Both areas | 1,239 | 458 | 781 (63.0 %) | 24,993.01 | 16,551.54 |

- Fields without a class have no crop options. They are 66.2 % of the area (computed: 16,551.54 ÷ 24,993.01 ha).
- Of the 458 classified fields, 235 are free, 74 are ending soon and 149 are committed (`web/data/cubo.json` → `zona.conteos`).
- Delicias – Saucillo was extended west to include Colonia Campesina, Colonia Nicolás Bravo (Km 92) and El Molino. The team's reference localities are drawn as points, not fields.
- The earliest results (H3 and the ET contrast) were computed on the original rectangle of 338 fields. The team changed to these two areas afterwards, so results on the new areas are reported as post hoc.

## How it works

**Three screens** (S9 §3). All three are on the page today.

1. **Control center.**
   - Map of the pilot areas with a *Pilot area* selector.
   - Allocation slider in *millares* per hectare (1 millar/ha = 1,000 m³/ha = 10 cm of water depth, S9 §5). It has three press marks: *Like 2025* [P], and *Like 2026* and *Normal year* [P], to be confirmed (`data/params.json` → `dotaciones`). A "Rain −20 %" switch sits next to it.
   - Main indicator: **water already committed**. It is the share of the allocation that perennial fields ask for before a single hectare of annual crops is planted. It is shown as "at least" while fields are not classified.
   - Fields are colored by "Enough water?" or by water term.
   - **Terrain & runoff** overlay with **Simulate a storm**: runoff routes from NASADEM and a reference storm from GPM IMERG, at area scale (`web/data/relieve.json`).
   - A searchable field list, the team's reference localities, and panels for La Boquilla dam and the aquifer.
   - **About & Data**: the NASA data in use, the five tests with their current result, and links to this repository.
2. **Field sheet.**
   - Field memory since 2016.
   - The current rotation and two alternatives (three for established alfalfa: a summer irrigation cut), each with Water · Soil · Money rows.
   - **Follow the drop**, a Sankey diagram: dam → canal → field → crop → aquifer.
   - **Why?** with the five answers the challenge asks for.
   - The drip scenario is shown as not available and the Money row as "no data" (see Limitations).
   - Fixed notice: *this tool supports, never replaces, the judgment of farmers and local experts.*
3. **Message to the farmer.** A WhatsApp preview in Spanish and a printable field sheet, generated from the same data.

**Four pieces of our own** (S9 §4):

- The *water term*: each crop as a multi-year water commitment (free, ending soon or committed).
- The *field memory*: year-by-year state from monthly HLS greenness, with rules and no labels.
- *The drop*: where each millar goes, counting consumption and recharge.
- *Tests in sight*: five tests published whatever the result.

**Calculation** (S9 §5):

- Gross field depth L = (ETc − effective rain) ÷ field efficiency, as a P10–P50–P90 band (FAO-56 with NASA POWER, Monte Carlo).
- Coverage = min(1, D ÷ L P50) for allocation D. Hectares covered = area × coverage, always with its range.
- Traffic light: green if D covers P90, amber if it covers P50, red if it does not, gray if the crop map abstains.
- Term: annual crop, 1 year; alfalfa, 3–4 years [P, FIRA]; pecan, a 10-year calculation horizon [S].
- Water already committed = Σ(area × L P50 of perennial fields) ÷ (D × total area).
- The slider rules live in one function, `web/reglas.js`, shared by the page and the tests.

**Pipeline.**

- Team members deliver tables to the shared Drive folder `Raiz_entregas/`, with one line per file in `LEEME.md`.
- `motor/ensamblar.py` validates each delivery against the data contract (`motor/esquemas.py`). It copies the valid ones, unchanged, to `data/processed/` and records their sha256 in `data/processed/fuentes.json`.
- `python construir.py` rebuilds the cube, the relief layer and the manifest from that cache. It runs the contract validator, the figure checker and every test, and writes the result table to [`docs/pruebas.md`](docs/pruebas.md).
- GitHub Actions publishes `web/` when, and just when, those checks pass.
- The page reads its figures from `web/data/`. No figure is written by hand in the HTML or the JavaScript (`tests/test_sin_cifras.py`).

### In progress (not on the page yet)

These pieces are being built on the working branch. The page does not do any of this yet: `web/index.html` does not load these modules.

- **3D twin view.** NASADEM relief with a declared vertical exaggeration, and a water column on each field: blue up to the chosen allocation, red for what is missing. Files so far: `web/js/gemelo3d.js`, `motor/gemelo_web.py`, `motor/dem_teselas.py`, `web/data/gemelo.json`, `web/data/dem/`.
- **Timeline.** A control for the agricultural years 2016–2026, with playback. It highlights 2025, the year without dam water [P]. File so far: `web/js/tiempo.js`.
- **Twin status card.** It separates what is observed, what is modeled and what is a scenario, with the date of each source.
- **Installable app.** It installs on a phone or a laptop and keeps working without a network, with the last synced copy. Until it exists, the offline backup is the single-file demo (`python motor/demo_offline.py`).
- **Regional context.** Monthly series per area from SMAP, MODIS, GRACE/GRACE-FO, GLDAS, NLDAS and ERA5-Land, and GEDI canopy height per field. The data were delivered and validated on Nov 14 (`data/processed/contexto_regional.csv`, `data/processed/gedi_parcelas.csv`). The page does not show them yet (`web/js/contexto.js`, `motor/contexto_web.py`, `web/data/contexto.json`). ECOSTRESS and GAEZ are requested and not delivered.
- **Frost filter.** Frost dates from NASA POWER are delivered (`data/processed/heladas.json`). They are not applied to the crop options yet (`docs/reparto_faltantes.md`, item I9).

## NASA Data

Status values: **in use** (the page or a published test reads it) · **delivered, not on the page yet** (validated in `data/processed/`, see In progress) · **requested, not delivered yet**. Resolutions and periods are the ones recorded in `data/processed/fuentes.json`, in the delivered files or in the data-session documents named in each row.

| Product | What Raíz uses it for | Resolution and period, as recorded in the repo | Status |
|---|---|---|---|
| HLS v2, Harmonized Landsat Sentinel-2 (`NASA/HLS/HLSL30/v002`, `NASA/HLS/HLSS30/v002`, via Google Earth Engine) | Monthly greenness per field: 2026 crop map (rules), field memory, bare-soil days, test H3 | 30 m (`docs/equipo/verificar_datos_nasa.md` §2). Agricultural years 2016–2026 | In use |
| NASA POWER, Daily API, community AG | Daily climate for FAO-56 reference ET and crop water need, one file per area; climatology of test H1; contrast of the storm depth | One MERRA-2 cell of 0.5° × 0.625° per area. 1984-01-01 to 2026-11-09 (`data/processed/eto_diaria.csv`) | In use |
| NASA POWER, `T2M_MIN` (frost dates, kit A2) | Dates of the last spring frost and of the earliest autumn frost; frost probability by date | Same grid cells. 1984–2025, 42 complete years | Delivered, not on the page yet |
| NASADEM (`NASA/NASADEM_HGT/001`, via Earth Engine) | Slope, runoff routes and "Simulate a storm" at area scale; three context indicators in the Soil row | 30 m; each area plus 2 km | In use |
| GPM IMERG V07 (`NASA/GPM_L3/IMERG_V07`, via Earth Engine) | Daily rain per area; reference storm of "Simulate a storm" | Half-hourly values averaged per UTC day and over each area rectangle (grid size not recorded in `fuentes.json`). 2001-01-01 to 2026-11-13 | In use |
| SSEBop VIIRS v6 monthly, a USGS product on VIIRS (`projects/usgs-ssebop/viirs_et_v6_monthly`, community catalog) | Regional contrast of the modeled ET (test 5), never per field | 1 km (`docs/resultado_A8.md`). Oct 2025–Sep 2026 | In use |
| SMAP L4 v8 (`NASA/SMAP/SPL4SMGP/008`) | Regional context: surface and root-zone soil moisture, monthly | 9,000 m. 2015-04 to 2026-10 | Delivered, not on the page yet |
| MODIS collection 6.1 (`MOD13Q1`, `MOD16A2GF`, `MOD11A2`) | Regional context: greenness of the area before the HLS record, a second ET series, daytime land surface temperature | 250 m (NDVI), 500 m (ET), 1,000 m (temperature). 2000-02 to 2026-10; ET from 2000-01 to 2025-12 | Delivered, not on the page yet |
| GRACE / GRACE-FO (`NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI`) | Regional context: anomaly of the water stored in the basin (surface, soil and aquifer together) | One basin series; 0.5° grid over 3° mascons. 2002-04 to 2024-10 | Delivered, not on the page yet |
| GLDAS-2.1 Noah (`NASA/GLDAS/V021/NOAH/G025/T3H`) | Regional context: ET and root-zone moisture from a land surface model | 27,830 m. 2000-01 to 2026-09 | Delivered, not on the page yet |
| NLDAS-2 forcing (`NASA/NLDAS/FORA0125_H002`) | Regional context: a second source of rain and potential evaporation | 13,915 m. 2000-01 to 2026-10 | Delivered, not on the page yet |
| GEDI L2A v2 (`LARSE/GEDI/GEDI02_A_002_MONTHLY`) | Evidence per field: canopy height (rh98), to tell an orchard from a low crop | Rasterized at 25 m. Shots from 2019-04 to 2025-04; 1,072 of 1,239 fields have at least one shot | Delivered, not on the page yet |
| ECOSTRESS | Field-scale ET contrast | — | Requested, not delivered yet (needs a NASA Earthdata account; `docs/reparto_faltantes.md`, items H6 and D8) |

Sources of the regional rows: `data/processed/fuentes.json` (product identifiers) and `data/processed/contexto_regional.csv` (columns `resolucion_m` and `mes`). Role of each resource: [`docs/decisiones/2026-11-14_recursos_del_reto.md`](docs/decisiones/2026-11-14_recursos_del_reto.md). The official challenge list as we read it: [`docs/referencias/recursos_reto.md`](docs/referencias/recursos_reto.md).

**Challenge resources that do not cover Mexico** (same decision document): OpenET does not cover Mexico, so the ET contrast uses SSEBop on VIIRS. USDA, NRCS, CDL, NAIP, NLCD, PRISM, NWIS, CoCoRaHS, AMS, NASS and LANDFIRE cover the United States; the local equivalents are SIAP (crop statistics), SIH/Conagua (dams) and SDR Chihuahua.

**Third-party and local data:**

- **Fields of The World 2025** global field-boundary predictions (Source Cooperative, CC-BY-4.0): field polygons and a confidence layer. *Field boundaries are NN predictions outside the model's training domain; filtered by confidence.* Fields with confidence below 50 abstain (`data/params.json` → `mapa.ftw_confianza_min`). The manual review of the featured fields is not done yet.
- **ERA5-Land** (`ECMWF/ERA5_LAND/DAILY_AGGR`; ECMWF and Copernicus, not a NASA product): monthly mean of the daily minimum temperature and frost days, 11,132 m, 2000-01 to 2026-10. Delivered, not on the page yet.
- **Conagua.** Technical report of aquifer 0831 (DR_0831; return-flow coefficients [V]). Dam storage, through the press [P]. **SIH** daily series of La Boquilla (downloaded Nov 14, 2026): the truth of the H1 back-test ([`docs/h1_verdad_sih.md`](docs/h1_verdad_sih.md)).
- **INIFAP** crop water depths [V], **FIRA** alfalfa stand life [P] and **IMTA** canal conveyance efficiency [V], as cited in S9 and `data/params.json`.
- **GAEZ** (FAO): requested, not delivered yet. **WaPOR v3** (FAO, 300 m; S8, decision 4): second regional ET contrast, not run. OpenStreetMap base map.

Licenses and terms of use of every source: [DATA_LICENSE.md](DATA_LICENSE.md).

## Validation

**Five tests in sight** (S9 §6). Each criterion was declared before seeing the result. The status and summary are those of `web/data/pruebas.json`, which the page shows under About & Data. About & Data also lists every delivered file recorded in `manifest.json`, including the ones whose series are not drawn yet.

| # | Test | Criterion (declared beforehand) | Current result |
|---|---|---|---|
| 1 | Crop map | Macro F1 with 5 km spatial blocks; areas with Olofsson; abstain if p < 0.6 | **Partial.** Phenological rules on HLS: run. They classify 458 of 1,239 fields; 781 abstain (63.0 %): 583 of 940 in Delicias – Saucillo and 198 of 299 in Lázaro Cárdenas. Random Forest: **not run**; every field reports a single method, because the team's blind labels are not delivered (`docs/reparto_faltantes.md`, items H5 and D7). Spatial validation (macro F1) and Olofsson accuracy: **not run** |
| 2 | Back-test 2026 (H1, preregistered) | With data up to Mar 14, the error at Jul 14 must be lower than that of baselines L1 and L1-s. Truth: La Boquilla outflow (SIH) | **Does not meet the preregistered criterion** (partial back-test; press-reported truth). At the main point (Jul 14, 2026) the model's P50 is 904.6 hm³ (P10–P90: 727.2–1,131.4). The truth is 447.65 hm³, labeled "press-reported; equals the storage drop". The baselines were closer: L1-s 404.5 hm³ and L1 367.2 hm³. The truth lies outside the model's P10–P90 band. The official SIH series has 18 zero days in March, so the preregistered fallback applies; the SIH outflow integral, 296.31 hm³, is reported beside it as a floor. The model computes the full crop demand and overestimates the level. The closing figures of the 2026 cycle are not published, so the result document calls it a partial back-test. Details and sensitivities: [`docs/resultado_H1.md`](docs/resultado_H1.md), figure [`docs/h1_backtest.png`](docs/h1_backtest.png) |
| 3 | 2025 natural experiment (H3, preregistered) | In the year without dam water, the share of annual-crop fields with an active summer crop (maximum monthly NDVI in Jun–Sep ≥ 0.40) falls at least 25 percentage points below its 2019–2024 median. Among pecan orchards, the same share stays within 10 points of its median. The number of fields in each group is published (S9 §6 and Annex B) | **Not supported.** Registered analysis (original rectangle): among 184 annual-crop fields the share was 82.6 % in 2025 against a 2019–2024 median of 84.2 % (−1.6 points; the criterion asked for −25 or more). Part (a) fails. Among 44 pecan orchards the share stayed at 100 %. Part (b) holds. Sensitivity at NDVI 0.35 and 0.45: −0.3 and −6.8 points. Post hoc, with the deviation declared: extended Delicias – Saucillo −16.0 points (580 fields) and Lázaro Cárdenas 0.0 points (210 fields); still not supported. Details and alternative explanations: [`docs/resultado_H3.md`](docs/resultado_H3.md), figure [`docs/h3_series.png`](docs/h3_series.png) |
| 4 | Figure checker | 30 cases, with traps; 0 % of figures altered by the AI | **Partial.** Golden set: passed, with 30 of 30 cases correct, 5 of 5 traps caught and 0 of 71 numbers altered in the approved texts (`docs/figuras/llm_eval.csv`). Explanations shown on the page: passed (step "verificador" of `python construir.py`). Texts written by an LLM: **not run**. There is no LLM API key, so all 30 texts are templates whose numbers are filled from the data |
| 5 | Regional ET contrast and automated checks | ET against SSEBop VIIRS (USGS) and WaPOR v3 (FAO) at area scale; FAO-56 against the manual's worked examples; water balance of the drop | **Partial.** SSEBop contrast: run for the original rectangle, as a regional comparison, not a field-level validation. Modeled crop ETc 1,139.3 mm against SSEBop VIIRS v6 746.3 mm over the 12 months from Oct 2025 to Sep 2026 (+393 mm, +53 %). The model gives the potential demand of the classified, well-watered crops; SSEBop estimates actual ET averaged over the whole rectangle ([`docs/resultado_A8.md`](docs/resultado_A8.md), figure [`docs/et_contraste.png`](docs/et_contraste.png)). Post hoc, for the two pilot areas: Delicias – Saucillo 830 mm against 652 mm (+27 %) and Lázaro Cárdenas 590 mm against 574 mm (+3 %). The gap narrows because fallow fields (modeled ETc of zero) weigh 42 % and 60 % of the classified area there, not because the model fits better. WaPOR v3: **not run**. FAO-56 worked examples: **not run** in this build (two examples were reproduced on the data branch, `docs/revisiones/2026-11-14_0915_datos-satelite.md`). Water balance of the drop: **passed**, checked by `validar_contrato.py` on every build |

**Open question: model against INIFAP depth.**

- For alfalfa, the model's gross field depth is 28.4 millares/ha at P50 (P10–P90: 23.13–35.16; `data/processed/rotaciones.json`, rain 0 %). S9 §5 cites 17.5 millares/ha from INIFAP [V].
- The model's net depth at P50 is 1,626 mm (same file), that is 16.26 millares/ha (100 mm = 1 millar/ha). So most of the gap comes from dividing by the field (on-farm) efficiency.
- That efficiency is a declared range of 0.45–0.70 [S], with no measured value for DR-005 (`rotaciones.json` → `params.ea_gravedad`; `data/params.json` → `eficiencia.parcelaria` is still null).
- H1 and the ET contrast point the same way: the district operates with less water than the model computes as full demand (`docs/resultado_H1.md`).
- **H1-b (follow-up, specified before running; it does not change H1): does not hold.** Over the 1999–2024 cycles the seasonal shape of the demand model beats the two simple shapes in 6 of 26 years; its median error is 8.66 percentage points, against 3.34 for the NASA POWER reference-ET curve and 7.9 for the linear shape. The model places demand earlier than the dam releases it ([`docs/resultado_H1b.md`](docs/resultado_H1b.md), specification in [`docs/h1b_especificacion.md`](docs/h1b_especificacion.md)).
- **Model against local practice.** The model's full crop requirement is higher than the depths recommended by INIFAP and those applied in the district for alfalfa, pecan, cotton and forage maize, and lower for chile; the comparison, crop by crop and with its sources, is in [`docs/modelo_vs_practica.md`](docs/modelo_vs_practica.md).
- **Example fields checked on imagery.** A check of the three example fields on Sentinel-2 true color is in [`docs/revision_protagonistas.md`](docs/revision_protagonistas.md); it was done by an AI session and a person still has to confirm it.
- We will ask a district technician which on-farm efficiency is realistic for gravity irrigation, and under which conditions the INIFAP depths apply. Until then, if the efficiency range is too low, hectares covered are understated and committed water is overstated.

**Automated gate.** `python construir.py` rebuilds everything from `data/processed/` and exits with code 1 if any step fails. Each full run writes its step table (contract, figure checker, pytest, node) to [`docs/pruebas.md`](docs/pruebas.md) and to `web/data/pruebas.json`. That table is the record of the last full run, step by step, whether it passed or failed; the page shows it under About & Data. Nothing is published unless every step passes.

| Check | Where |
|---|---|
| Team deliveries validated against the contract schemas before entering `data/processed/` | `motor/ensamblar.py`, `motor/esquemas.py`, `tests/test_ensamblar.py`, `tests/test_esquemas_reto.py` |
| Data contract v4 (P10 ≤ P50 ≤ P90, abstained fields without options, closed water balance); altered cubes are rejected | `validar_contrato.py`, `tests/test_contrato.py` |
| Cube engine with one and two areas; each field uses the depths of its own area | `tests/test_b4.py` |
| `manifest.json` lists every figure of the cube with source, date, script and label | `tests/test_contrato.py` |
| Units, and the S9 scale example (INIFAP depths [V]) computed with the page's own function | `tests/test_unidades.py`, `tests/test_escala.py` |
| Slider rules: zero allocation, traffic light, committed water above 100 %, "at least" | `tests/reglas.test.js` |
| No hand-written figures in `index.html` or in the strings of the page's JavaScript | `tests/test_sin_cifras.py` |
| Figure checker: no number outside placeholders, every placeholder defined, citations from the allowed list, banned wording; 30-case golden set with 5 traps | `motor/verificador.py`, `tests/test_verificador.py`, `tests/casos/set_dorado.json` |
| Relief layer per area; the five tests as the page shows them | `tests/test_relieve_web.py`, `tests/relieve.test.js`, `tests/test_pruebas_web.py` |
| The build command does not replace a real cube with simulated data | `tests/test_construir.py` |
| Single-file offline demo | `tests/test_demo_offline.py`; `tests/e2e/offline_smoke.mjs` (Chromium, no network) |
| Vendored libraries match their sha384 | `tests/versiones.test.js` |
| Browser smoke test (Playwright; desktop and phone; map without tile network) | `tests/e2e/web_smoke.mjs`: run locally before each release, not in CI (needs Chromium) |

**Continuous integration** (`.github/workflows/publicar.yml`): every push and pull request runs `python construir.py`, plus a pip-audit job. On a push to `main` it deploys `web/` to GitHub Pages when, and just when, the test job passes. Code reviews by independent agents are logged in `docs/revisiones/` and `docs/progreso.md`.

## Limitations

The tool does not allocate, sell or trade water (art. 22 of Mexico's National Water Law, S9 §11). It does not forecast the dam. It does not promise that any water will be freed. It supports, never replaces, the judgment of farmers and technicians.

Main open limitations today:

- 63 % of the fields are not classified and have no options; the crop map is rules-based, with no Random Forest and no accuracy assessment.
- H1 does not meet its preregistered criterion and H3 is not supported.
- Field boundaries are estimated by a model outside its training domain.
- Crop options and filters are provisional (`data/opciones_b4.json`).
- The field-efficiency range is an assumption [S]; the model's alfalfa depth is above INIFAP's.
- No drip scenario; a Money row without data.
- NASADEM at 30 m is used at area scale; runoff routes are not drawn inside closed depressions of the elevation model.
- The twin has no field sensors and no real-time data; regional series do not describe a field.

Full list: [LIMITATIONS.md](LIMITATIONS.md).

## SI/AI tools used

| Component | Tool | What the AI did | What the team did | How it is verified |
|---|---|---|---|---|
| Integration code (engine, validator, web, tests, CI) | Claude Code (integrator session, Cristian), with multi-agent workflows: implementer agents and independent reviewer agents with fresh context | Wrote code and documents from the kit prompts and the data contract. Reviewers report findings and do not edit | Design, specifications, acceptance tests and decisions. Claude Code commits in Cristian's session on a working branch; Cristian merges to `main` | `python construir.py` gate before publishing; review protocol in `docs/prompts/`; logs in `docs/revisiones/` and `docs/progreso.md` |
| Data scripts and Earth Engine runs | A separate Claude session in the browser | Wrote and ran Earth Engine (HLS, field memory, NASADEM, GPM IMERG, SSEBop, regional context, GEDI), the Fields of The World extraction, NASA POWER with FAO-56, frost dates, the rules crop map, water demand, relief, and the H1, H3 and ET analyses (`AI_USAGE.md`; scripts named in `data/processed/fuentes.json`) | Specification (kit v4), thresholds and review | Independent reviews of the data branch (`docs/revisiones/`); mailbox validator; sha256 of each delivery (`data/processed/fuentes.json`) |
| Teammates' work (P2–P6) | Gemini in Google Colab or Claude in the browser | Scoped notebooks and data-verification cells | Running, checking and delivering | Fresh-context review (`docs/prompts/para_gemini.md`); mailbox validator. Their lines in `AI_USAGE.md` are filled in by each teammate |
| Crop map 2026 | Phenological rules. Random Forest (machine learning): not run | No AI in the current map | Declared rules and thresholds | Abstention rule. Olofsson accuracy with 95 % CI: not run |
| Field memory | None (rules on monthly NDVI) | — | Declared rules and thresholds | H3: run, not supported (`docs/resultado_H3.md`) |
| Explanations | No LLM in the app: template texts with placeholders, drafted with Claude Code | Drafted the template wording, without numbers | Facts and sources | The page has no hand-written figures (`tests/test_sin_cifras.py`). Figure checker on every build: 30 of 30 golden cases correct, 0 % of numbers altered (`docs/figuras/llm_eval.csv`) |
| Field boundaries | Fields of The World neural network (2025 global predictions, CC-BY-4.0; third-party data) | Field segmentation | Confidence filter. Manual review of the featured fields: not yet | FTW confidence layer |
| Prior research | Claude (incl. Research mode and agents), ChatGPT (incl. Deep Research), Gemini, DeepSeek and NotebookLM | Search and synthesis of sources | Each figure checked in its original source | Labels [V], [P], [S], [NE] |
| Project documents before the event | Claude (project chat) | Drafted the project definition, approach, event plan, build kit v4 and proposal, without code | Review by the team | Labels [V], [P], [S], [NE]; `AI_USAGE.md` |
| Page texts (this README, `LIMITATIONS.md`, `DATA_LICENSE.md`) | Claude Code: a drafting agent working from the repo files; a figure-review agent on an earlier version | Draft in English | Specification of the content; review before submission | Every figure cited inline with its source file |
| Images or video | None generated with AI so far. The video is not made yet | — | Screen captures of the real app | — |

**Where AI is not used:**

- The dam volume is not forecast. The user picks the allocation; its marks are published figures.
- The planting decision is not made by the tool.
- Water is not computed by an LLM. FAO-56 and explicit rules do that.
- No numbers are generated by AI. They come from the data files, and texts carry placeholders.

*AI never generates the numbers or makes the decision; farmers and technicians decide.* Task-by-task log: [AI_USAGE.md](AI_USAGE.md).

## References

Articles and reports:

- Allen et al. (1998). *Crop evapotranspiration — Guidelines for computing crop water requirements.* FAO Irrigation and Drainage Paper 56.
- Conagua (2024). *Actualización de la disponibilidad media anual de agua en el acuífero Meoqui-Delicias (0831)*, technical report DR_0831. https://sigagis.conagua.gob.mx/gas1/Edos_Acuiferos_18/chihuahua/DR_0831.pdf
- Conagua, Sistema de Información Hidrológica (SIH): daily series of La Boquilla (`LBQCH.csv`), downloaded Nov 14, 2026 (`docs/h1_verdad_sih.md`).
- IMTA, COMEII 2021: canal conveyance efficiency, measured 2012–2016 [V] (`data/params.json`). FIRA AGROCOSTOS 2025: alfalfa stand life [P]. INIFAP: crop water depths [V] (S9 §5).
- Grafton et al. (2018), *Science*: irrigation efficiency and return flows. Mall and Herman (2019): shortage risk from perennial-crop expansion in California. Olofsson et al. (2014): area and accuracy assessment. Villalobos-Cano et al. (2024), cited in `docs/resultado_H1.md`.
- The entries of the two lines above are cited as S9, kit v4 and the result documents cite them. Their full bibliographic entries are not in this repository.

Data:

- Masek, J., Ju, J., Roger, J., Skakun, S., Vermote, E., Claverie, M., Dungan, J., Yin, Z., Freitag, B., Justice, C. (2021). *HLS Operational Land Imager Surface Reflectance and TOA Brightness Daily Global 30m v2.0* [Data set]. NASA EOSDIS Land Processes Distributed Active Archive Center. https://doi.org/10.5067/HLS/HLSL30.002
- *HLS Sentinel-2 Multi-spectral Instrument Surface Reflectance Daily Global 30m v2.0* [Data set]. NASA EOSDIS LP DAAC. https://doi.org/10.5067/HLS/HLSS30.002
- NASA JPL (2020). *NASADEM Merged DEM Global 1 arc second V001* [Data set]. NASA EOSDIS Land Processes DAAC. https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001
- NASA POWER (NASA Langley Research Center), Daily API, community AG. https://power.larc.nasa.gov/api/temporal/daily/point, queried Nov 14, 2026.
- NASA GPM IMERG V07, Earth Engine collection `NASA/GPM_L3/IMERG_V07`, queried Nov 14, 2026.
- Senay, G. B., Kagone, S. and Velpuri, N. M. (2020). Operational Global Actual Evapotranspiration using the SSEBop model. U.S. Geological Survey data release. https://doi.org/10.5066/P9OUVUUI
- Senay, G. B., et al. (2023). Improving the Operational Simplified Surface Energy Balance Evapotranspiration Model Using the Forcing and Normalizing Operation. *Remote Sensing* 15(1): 260. https://doi.org/10.3390/rs15010260
- Fields of The World global predictions (CC-BY-4.0), Source Cooperative, `source.coop/ftw/global-data`.
- Regional context and GEDI, by Earth Engine identifier (`data/processed/fuentes.json`): `NASA/SMAP/SPL4SMGP/008`; `MODIS/061/MOD13Q1`, `MODIS/061/MOD16A2GF`, `MODIS/061/MOD11A2`; `NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI`; `NASA/GLDAS/V021/NOAH/G025/T3H`; `NASA/NLDAS/FORA0125_H002`; `ECMWF/ERA5_LAND/DAILY_AGGR`; `LARSE/GEDI/GEDI02_A_002_MONTHLY`. Queried Nov 14, 2026.
- The formal citations of the HLS, NASADEM and SSEBop entries are the ones recorded in `docs/equipo/verificar_datos_nasa.md`. The formal citations of the other products are not in this repository; they are listed as open in [DATA_LICENSE.md](DATA_LICENSE.md).

Press (figures labeled [P]):

- El Diario de Chihuahua, Oct 28, 2024 (*Like 2025* mark) and Jul 27, 2026 (*Like 2026* and *Normal year* marks; article not read directly) (`data/params.json` → `dotaciones`).
- Impacto Noticias, Nov 9, 2026, with Conagua's daily report (La Boquilla storage; S8 §2).
- El Diario de Delicias, Jan 31, 2025 (87.4 hm³ of groundwater in 2025; S9 Annex A).
- Local press of December 2025 (12,000–15,000 ha planted with wells; S9 Annex A, which does not name the outlet).
- The 38 % at the start of the 2026 cycle is labeled [P] in S9 §2, which does not name the outlet.

Challenge and libraries:

- Challenge: https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/
- MapLibre GL JS 5.24.0, d3 7.9.0 and d3-sankey 0.12.3, copied unchanged from npm and verified by sha384 (`web/vendor/VERSIONS.json`). pytest 9.1.0 (`requirements.txt`). rasterio 1.4.3, used to regenerate the relief tiles (`requirements-datos.txt`).
- Development skills and agents copied with their licenses (`.claude/skills/README.md`, `.claude/agents/README.md`).

## How to run

Requirements: Python 3.12 and Node 22, the versions pinned in `.github/workflows/publicar.yml`.

```bash
python -m pip install -r requirements.txt
python construir.py              # rebuild everything from the cache (data/processed) and run every check
node tests/e2e/web_smoke.mjs     # browser smoke test (needs Playwright and Chromium)
python motor/demo_offline.py     # single-file demo that opens without a network: dist/raiz-offline.html
```

Other options:

```bash
python construir.py --rapido     # same rebuild, without pytest and node (to iterate)
python construir.py --origen     # re-download what has a public API (npm libraries), then rebuild
RAIZ_BUZON=/path/to/Raiz_entregas python construir.py   # validate new team deliveries from the synced Drive folder
python -m http.server --directory web                   # view the site locally
node tests/e2e/offline_smoke.mjs # check the offline demo in Chromium with the network cut
```

`python construir.py` runs these steps in order. If one fails, it is reported and the rest still run. The numbers below are the lines of its final report.

- **1. Origin.** With `--origen`, it re-downloads the npm libraries and lists the Earth Engine pieces; otherwise the step is skipped.
- **2–4. Mailbox.** `motor/ensamblar.py` validates the mailbox (`RAIZ_BUZON`) against `motor/esquemas.py` and copies valid deliveries to `data/processed/` (log in `docs/entregas_log.md`). The report counts what entered, was rejected or was held, and lists what is still simulated. Without `RAIZ_BUZON` the step is skipped and the previous cache is used.
- **5. Cube.** `motor/b4_cubo.py` builds `web/data/cubo.json`, `parcelas.geojson` and `explicaciones.json` from real data. If inputs are missing while the published cube is real, the step fails; it does not replace the site with simulated data.
- **5b. Relief.** `motor/relieve_web.py` writes the runoff routes and the storm depth per area to `web/data/relieve.json` and `relieve_rutas.geojson`.
- **6. Manifest.** `motor/manifest.py` writes `web/data/manifest.json` (source, date, script and label of every figure).
- **7. Contract.** `python validar_contrato.py` must print `CONTRATO OK`.
- **7b. Figure checker.** `motor/verificador.py` must print `VERIFICADOR OK`. It also runs the golden set (`tests/casos/set_dorado.json`) and rewrites `docs/figuras/llm_eval.csv`.
- **8. pytest** on `tests/`. **9. node** `--test` on the `tests/**/*.test.js` files.
- **5c. Tests in sight.** After the tests, a full run writes the step table to `docs/pruebas.md`, and `motor/pruebas_web.py` writes `web/data/pruebas.json` from it. The manifest is then written again to include those figures.
- **10. Result.** Exit code 0 when everything passes. Pieces that do not exist yet are reported as pending, not as failures.

`python motor/demo_offline.py` reads the current `web/` and writes one HTML file with the styles, the libraries, the modules and the data inside it. It opens with a double click, without a server. The remote base-map tiles are not embedded: without a network the fields are drawn on a plain background. `dist/` is not versioned.

The Earth Engine pieces run in a separate session, never in this repository. NASA POWER and Fields of The World arrive through the mailbox. Dependabot (`.github/dependabot.yml`) checks the actions and the Python dependencies weekly.

## Repository layout

| Path | Contents |
|---|---|
| `construir.py` | Single rebuild command |
| `validar_contrato.py` | Data-contract validator (kit v4 §2.2–2.5, extended for two areas) |
| `requirements.txt`, `requirements-datos.txt`, `package.json` | Python dependencies with exact versions; rasterio, needed just to regenerate the relief tiles; Node test script (no dependencies) |
| `data/params.json` | Every constant of the project, with value, unit, source and label |
| `data/opciones_b4.json` | Provisional crop options per current crop [S], until the team's rotation table arrives |
| `data/recursos_reto.json` | Challenge data resources and their role in Raíz |
| `data/processed/` | Validated cache of the team's deliveries, with sha256 in `fuentes.json` |
| `data/raw/`, `data/simulados.json` | Untouched public data (empty on this branch); inputs of the simulated data used before real deliveries (not data) |
| `motor/` | `ensamblar.py` and `esquemas.py` (mailbox), `b4_cubo.py` (cube and the drop), `relieve_web.py` (relief layer), `manifest.py`, `verificador.py` (figure checker), `pruebas_web.py` (tests in sight), `demo_offline.py` (single-file demo), `simulados.py`. In progress: `gemelo_web.py`, `dem_teselas.py`, `ndvi_web.py`, `contexto_web.py` |
| `tests/` | pytest suites (`test_*.py`) and `node --test` suites (`*.test.js`); `e2e/web_smoke.mjs` and `e2e/offline_smoke.mjs` (browser smoke tests); `fixtures/` and `casos/` (S9 scale example and the checker's golden set) with their sources |
| `web/` | Static site: `index.html`, `app.js`, `style.css`, `reglas.js`, `js/` and `css/` (modules of the page), `vendor/` (pinned libraries) and `data/` (generated files the page reads) |
| `dist/` | Output of `motor/demo_offline.py` (not versioned) |
| `datos/` | Placeholder; the data scripts live on the `datos-satelite` branch and in Drive |
| `prototipos/front_lara/` | A teammate's front-end prototype, kept unchanged; not the published page (`docs/revisiones/2026-11-14_1445_front_lara.md`) |
| `docs/sintesis/`, `docs/kit/` | Project definition (S9), decisions (S8), event plan (S10); build kit v4 |
| `docs/decisiones/`, `docs/referencias/`, `docs/revisiones/` | Decisions (two pilot areas, digital twin, challenge resources); challenge resources and references; independent reviews |
| `docs/resultado_H1.md`, `docs/resultado_H1b.md`, `docs/resultado_H3.md`, `docs/resultado_A8.md`, `docs/modelo_vs_practica.md`, `docs/revision_protagonistas.md`, `docs/h1_verdad_sih.md`, `docs/h1_especificacion_operativa.md`, `docs/h1b_especificacion.md` | Results of the back-test, the natural experiment and the ET contrast, with their figures (`docs/*.png`); the SIH truth and the H1 operating specification |
| `docs/equipo/`, `docs/prompts/` | Team guides by role; review protocol and prompts (implementer → reviewer → correction) |
| `docs/progreso.md`, `docs/entregas_log.md`, `docs/reparto_faltantes.md` | Build log; mailbox log; what is missing and who does it |
| `docs/pruebas.md`, `docs/figuras/llm_eval.csv` | Step table of the last full `python construir.py` run; figure-checker golden-set report (both generated, not edited by hand) |
| `.github/workflows/publicar.yml`, `.github/dependabot.yml` | Build-test-publish workflow; dependency updates |
| `.claude/skills/`, `.claude/agents/` | Development skills and reviewer agents, with origin and license |
| `entregables/` | Pre-event proposal and summaries (Word) |
| `CLAUDE.md`, `AI_USAGE.md`, `LIMITATIONS.md`, `DATA_LICENSE.md` | Rules for the AI, AI usage log, declared limitations, data licenses |

## License

Code: Apache-2.0 (`LICENSE`). Third-party data and libraries keep their own licenses, for example Fields of The World, CC-BY-4.0 ([DATA_LICENSE.md](DATA_LICENSE.md)).

## Resumen en español

Raíz muestra, antes de sembrar, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa (S9 §1). Es un gemelo digital de dos zonas piloto del DR-005 Delicias, Chihuahua, con datos abiertos de la NASA (HLS, POWER, NASADEM y GPM IMERG). No tiene sensores en campo ni datos en tiempo real: se actualiza en cada corrida. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y apoya, sin sustituir, el juicio del agricultor y del técnico. Los resultados desfavorables se publican igual que los favorables, y las pruebas que no se han ejecutado aparecen como «not run».
