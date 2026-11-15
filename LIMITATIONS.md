*AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026*

# Limitations

Declared limitations of ROOT – From Dam to Root as of Nov 14, 2026. Sources: S9 §11, the related assumptions of S9 §4 bis, §5 and §12, S8, the decision documents in `docs/decisiones/`, and what the current build shows. Labels: **[V]** verified in a primary source · **[P]** press or secondary source · **[S]** declared assumption · **[NE]** not found.

## What the tool does not do (S9 §11)

- **It does not allocate, sell or trade water** (art. 22 of Mexico's National Water Law). It shows how much water each option asks for and for how long. The allocation and the authorized area are decided by Conagua and the irrigation modules.
- **It does not forecast the dam.** The user picks the allocation with a slider. Its three marks are press figures, not predictions: *Like 2025* [P], and *Like 2026* and *Normal year* [P], to be confirmed (`data/params.json` → `dotaciones`).
- **It does not promise that any water will be freed.** "Follow the drop" counts consumption (ET), not just withdrawals. Drip irrigation can reduce dam withdrawals and, at the same time, reduce aquifer recharge (Grafton et al. 2018, kit X3.2). Drip is recommended solely with a consumption cap (district ET at or below its historical level).
- **It does not replace the farmer or the technician.** It supports, never replaces, their judgment. Every field sheet carries that notice.

## What "digital twin" means here

ROOT is presented as a digital twin of the pilot areas: a replica, an observed state, a model and scenarios (`docs/decisiones/2026-11-14_gemelo_digital.md`). The label has limits:

- **No field sensors.** Nothing is measured on the ground. The observed state comes from satellite and climate data.
- **No real-time data.** The twin is refreshed on each run of `python construir.py`. Between runs it does not change. `web/data/manifest.json` records the source of every figure, and its date where one is recorded; the values that still lack a reading date are listed there under `avisos` (among them the allocation marks taken from the press and the dam capacity).
- **It does not forecast the dam and does not decide for the farmer.**
- **Several twin pieces are not on the page yet:** the 3D view, the timeline, the status card, the installable app and the regional context panel (README → *In progress*).
- **Regional series do not describe a field.** SMAP, MODIS, GRACE/GRACE-FO, GLDAS, NLDAS and ERA5-Land are averages over the rectangle of an area or over the basin. Their cell sizes, as recorded in `data/processed/contexto_regional.csv` (`resolucion_m`), go from 250 m to 55,660 m. Some series rest on one or two cells per area (`n_celdas`). None of them changes the water traffic light.

## Field boundaries and crop map

- **Field boundaries are estimated.** They are Fields of The World 2025 global predictions (CC-BY-4.0), made by a neural network used outside its training domain: its benchmark does not include Mexico (kit v4, A4 and B1). They are not a cadastre.
- **Confidence filter.** Fields with FTW confidence below 50 abstain (`data/params.json` → `mapa.ftw_confianza_min`): 137 of 1,239 fields (counted in `web/data/parcelas.geojson`, `ftw_confianza`).
- **Featured fields.** The manual review against true color of the three featured fields (P0757, P0244, L0175) is not done yet (`docs/reparto_faltantes.md`, item D3).
- **63 % of the fields are not classified and have no options.** 781 of 1,239 fields abstain: 583 of 940 in Delicias – Saucillo and 198 of 299 in Lázaro Cárdenas (`web/data/pruebas.json`). They are 66.2 % of the area (computed from `web/data/cubo.json` → `zona`: 16,551.54 ÷ 24,993.01 ha). The page shows them in gray, as "not classified", with no crop options.
- **Why they abstain** (`data/processed/cultivos_parcelas.csv`, `grupo_fenologico`; `web/data/parcelas.geojson`): 462 are summer annual crops that the rules cannot tell apart; 222 match no phenological group; 97 have a group but an FTW confidence below 50.
- **The 2026 crop map is rules-based.** Phenological rules on HLS decide every field (`acuerdo_metodos` = "1/1"). The 458 classified fields are fallow (219), alfalfa (118), pecan (105) and winter cereal (16) (`web/data/parcelas.geojson`). No field is classified as maize, sorghum, cotton or chile pepper: summer annual crops are left without a class.
- **No Random Forest.** A classifier needs labeled fields. The team's blind labels (`etiquetas_unidas.csv`) are not delivered, so the Random Forest and its comparison with the rules are not run (`docs/reparto_faltantes.md`, items H5 and D7).
- **No accuracy assessment.** The spatial validation (macro F1, 5 km blocks) and the Olofsson areas are not run. When they run, the reference is blind photo-interpretation, not field visits.
- **Water already committed is a minimum.** Fields without a class do not add to the perennial total, so the indicator reads "at least".

## Crop options

- **Options are provisional.** The current rotation and its alternatives per crop are a design of the integrator [S] (`data/opciones_b4.json`). The team's rotation table (kit B3) needs project documents that are not in the repo (`docs/reparto_faltantes.md`, item H4).
- **Hard filters are not applied.** No option carries a filter today (`web/data/cubo.json`, `filtros` is empty in all 1,492 options). Frost dates from NASA POWER are delivered (`data/processed/heladas.json`) and are not used to filter options yet.
- **Frost dates come from a grid cell, not a station.** NASA POWER is a regional cell; local frost can be more frequent. The comparison with a weather station was not run (`data/processed/heladas.json` → `nota`, `estacion_smn`).
- **Drip scenario: no data.** There is no sourced drip efficiency (`data/params.json` → `eficiencia.goteo` is null; `web/data/cubo.json` → `meta.notas`). The page shows the drip scenario as not available.
- **Money row: empty.** There is no verified margin data (`web/data/cubo.json` → `meta.notas`; `dinero` is null in every option). The row shows "no data". The state crop reports we read do not include costs or prices (`docs/referencias/ref_cultivos_sdr.md`).

## Water demand

- **Field (on-farm) efficiency is assumed, not measured.** The demand model uses a declared range of 0.45–0.70 [S], with no measured value for DR-005 (`data/processed/rotaciones.json` → `params.ea_gravedad`). `data/params.json` → `eficiencia.parcelaria` stays null until a sourced value arrives. The P10–P90 band carries this uncertainty.
- **Model depth against INIFAP.** For alfalfa the model's gross field depth is 28.4 millares/ha at P50 (P10–P90: 23.13–35.16) in Delicias – Saucillo and 27.83 in Lázaro Cárdenas (`data/processed/rotaciones.json`, `rotaciones_lazaro_cardenas.json`; rain 0 %). INIFAP's applied depth is 17.5 millares/ha [V] (S9 §5). The model's net depth is 1,626 mm, that is 16.26 millares/ha, so most of the gap comes from dividing by the assumed efficiency.
- **Other tests point the same way.** In the H1 back-test the model's demand for the cycle is close to twice the authorized volume (1,185.7 hm³ against 600 hm³). In the ET contrast the modeled ETc is 53 % above SSEBop on the original rectangle (`docs/resultado_H1.md`, `docs/resultado_A8.md`). The model computes the full demand of a well-watered crop; the district operates with less. If the efficiency range is too low, hectares covered are understated and committed water is overstated. We will ask a district technician.
- **A possible ETo bias is an assumption.** The model tests a bias of −10 % to 0 % in the reference ET [S], with no source in the repo (`rotaciones.json` → `params.sesgo_eto`).
- **Pecan.** The FAO-56 "Walnut orchard" Kc [V] is adjusted with an assumed canopy cover of 0.7 [S] (`rotaciones.json` → `params.cobertura_dosel_nogal`), not measured with NDVI yet (S8, decision 5). The pecan term is a 10-year calculation horizon [S], not the life of the orchard.
- **Alfalfa age.** The stand age is counted from the year of establishment, detected with a minimum monthly NDVI below 0.25 [S] (`data/processed/fuentes.json`, entry `cultivos_parcelas.csv`). The stand life of 3–4 years is labeled [P] (FIRA AGROCOSTOS 2025).
- **Where the "millar" is measured:** assumed at the field intake [S]; to be confirmed with a module technician. *Like 2026* and *Normal year* are [P], to be confirmed, because their article was not read directly (`data/params.json` → `dotaciones`).
- **NASA POWER is one grid cell per area**, not a station (MERRA-2, 0.5° × 0.625°). The two areas fall in different cells, so each has its own climate and demand files (`data/processed/fuentes.json`).
- **OpenET does not cover Mexico.** The regional ET contrast uses SSEBop on VIIRS.

## Relief and storm

- **NASADEM at 30 m is used at area scale, not per field.** Gravity-irrigated fields are leveled, and 30 m does not resolve their inner detail. The layer is labeled "regional, 30 m (NASADEM); not field drainage design" (`web/data/relieve.json`).
- **"Simulate a storm" is illustrative.** No hydrograph, no depths, no earthworks and no drain design.
- **Runoff routes are not drawn inside closed depressions of the elevation model.** Where the model shows a closed depression 3 m deep or more [S], the 30 m data cannot tell where water leaves, so no route is drawn there. This omits 2,931 route cells and 339 short stretches in Delicias – Saucillo, and 384 cells and 49 stretches in Lázaro Cárdenas (`data/processed/relieve_meta.json` and `relieve_meta_lazaro_cardenas.json` → `rutas_depresiones`). A route that stops on the map is a limit of the data, not a statement that the water stops.
- **A route is drawn from 50 ha of contributing area** [S], a display threshold (`web/data/relieve.json` → `umbral_ruta_ha`).
- **The storm depth is one number per area.** It is the 95th percentile of the days with rain of 1 mm or more in GPM IMERG V07, averaged over the area rectangle, 2001-01-01 to 2026-11-13: 20.2 mm in Delicias – Saucillo and 20.7 mm in Lázaro Cárdenas (`web/data/relieve.json`). The same percentile from NASA POWER, 1984-01-01 to 2026-11-09, gives 15.5 mm and 15.9 mm (`relieve_meta*.json` → `tormenta.contraste`). The two sources differ.
- **No LiDAR.** INEGI LiDAR coverage of the pilot areas was not confirmed [NE], so there is no ponding analysis inside fields.

## Field memory and tests

- **Field memory** is a rule-based reading of monthly greenness (NDVI threshold 0.40, sensitivity 0.35–0.45 [S]; `data/params.json` → `memoria`). It is not a crop census.
- **H1 does not meet its preregistered criterion.** At Jul 14, 2026 the model's P50 is 904.6 hm³ against a truth of 447.65 hm³; baselines L1-s (404.5) and L1 (367.2) were closer (`docs/resultado_H1.md`). Limits of that test:
  - It is a partial back-test: the official closing figures of the 2026 cycle are not published.
  - The truth is press-reported and equals the storage drop, which includes evaporation and inflows. The SIH series has 18 zero days, so its integral (296.31 hm³) is a floor (`docs/h1_verdad_sih.md`).
  - The press figures and the SIH series were already known when the operating points were fixed (`docs/h1_especificacion_operativa.md`).
  - The session that ran the analysis did not have the published preregistration in view. If it fixes something different, it prevails and the analysis is repeated.
  - One cycle does not support claims of accuracy or significance.
- **H3 is not supported.** Among 184 annual-crop fields the share with an active summer crop was 82.6 % in 2025 against a median of 84.2 % (−1.6 points; the criterion asked for −25) (`docs/resultado_H3.md`). Limits of that test:
  - It compares shares, not fields. Satellite greenness does not tell the source of the water; wells, weeds or monsoon rain can also reach the NDVI threshold.
  - Survivorship: orchards are identified in 2026, so orchards removed before 2026 are not observed.
  - The registered analysis is on the original rectangle (338 fields). The results on the two pilot areas are post hoc, because the areas changed after that result was known.
- **Figure checker tested on templates, not on an LLM.** 30 of 30 golden-set cases correct and 0 of 71 numbers altered (`docs/figuras/llm_eval.csv`). There is no LLM API key, so every explanation is a template with placeholders. The checker has not run on LLM-written text.
- **ET contrast: regional, one source.** The SSEBop comparison is not a field-level validation. Modeled ETc is a potential demand; SSEBop is actual ET averaged over the whole rectangle, including fields without a class and non-farm land. The registered contrast covers the original rectangle; the two areas are post hoc (`docs/resultado_A8.md`). WaPOR v3 was not run.
- **FAO-56 worked examples are not in the build.** Two examples were reproduced on the data branch (`docs/revisiones/2026-11-14_0915_datos-satelite.md`); the automated test is not in `tests/` yet (`web/data/pruebas.json`).
- **Aquifer figure:** the availability of −167.12 hm³/year is Conagua's official deficit [V], not a measured loss.

## Regional context and canopy height (delivered, not on the page yet)

- **GRACE/GRACE-FO is one basin series.** It measures all stored water together (surface, soil and aquifer) and does not separate the aquifer or the district. The border between two 3° mascons crosses the pilot areas, so a difference between areas would be a grid effect (`docs/decisiones/2026-11-14_recursos_del_reto.md`). The delivered series ends in 2024-10 (`data/processed/contexto_regional.csv`).
- **GEDI samples with separate shots.** 167 of 1,239 fields have no shot (computed from `data/processed/fuentes.json`: 1,072 fields with at least one). That is "no data", not zero.
- **ERA5-Land is not a NASA product** (ECMWF and Copernicus).
- **ECOSTRESS and GAEZ are not delivered.** There is no field-scale ET contrast.
- **None of these series forecasts the dam.**

## Pilot areas and data status

- **Pilot rectangles are design choices [S].** The module boundary is not public [NE]. The two areas are `delicias_saucillo` (940 fields, 19,145.19 ha) and `lazaro_cardenas` (299 fields, 5,847.82 ha) (`web/data/cubo.json` → `zonas`; `docs/decisiones/2026-11-14_dos_zonas.md`). They may not represent the whole district.
- **The team's reference localities are points, not fields.**
- **The web reads real deliveries** (`web/data/cubo.json` → `meta.mock: false`). Still missing from the team: the allocation table (`dotaciones.json`) and the figure table (`cifras.csv`) (`docs/reparto_faltantes.md`, items D4 and I7).
- **The public site is not online yet.** It goes live when GitHub Pages is enabled.
- With few fields in a group, its shares rest on few fields.
