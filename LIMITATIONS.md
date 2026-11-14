*AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026*

# Limitations

Declared limitations of Raíz – From Dam to Root as of Nov 14, 2026: S9 §11, the related assumptions of S9 §4 bis, §5 and §12 and S8, and what the current build shows. Labels: **[V]** verified in a primary source · **[P]** press or secondary source · **[S]** declared assumption · **[NE]** not found.

## What the tool does not do (S9 §11)

- **It does not allocate, sell or trade water** (art. 22 of Mexico's National Water Law). It shows how much water each option asks for and for how long; the allocation and the authorized area are decided by Conagua and the irrigation modules.
- **It does not forecast the dam.** The user picks the allocation with a slider; its three marks are press figures, not predictions: *Like 2025* [P], and *Like 2026* and *Normal year* [P], to be confirmed (`data/params.json` → `dotaciones`).
- **It does not promise that any water will be freed.** "Follow the drop" counts consumption (ET), not just withdrawals: drip irrigation can reduce dam withdrawals and, at the same time, reduce aquifer recharge (Grafton et al. 2018, kit X3.2). Drip is recommended solely with a consumption cap (district ET at or below its historical level).
- **It does not replace the farmer or the technician.** It supports, never replaces, their judgment; every field sheet carries that notice.

## Field boundaries and crop map

- **Field boundaries are estimated.** They are Fields of The World 2025 global predictions (CC-BY-4.0), made by a neural network used outside its training domain: its benchmark does not include Mexico (kit v4, A4 and B1). Fields with FTW confidence below 50 abstain (`data/params.json` → `mapa.ftw_confianza_min`). The manual review of the featured fields against true color is [PENDING].
- **The 2026 crop map is rules-based so far.** Phenological rules on HLS decide every field (`acuerdo_metodos` = "1/1"); the Random Forest and its comparison with the rules are [PENDING].
- **Abstention is high.** 218 of 338 fields abstain (`web/data/parcelas.geojson`), 65.4 % of the area (computed from `web/data/cubo.json` → `zona`: 3,789.08 ÷ 5,794.33 ha). Of those fields, 132 are summer annual crops that the rules cannot separate (`data/processed/cultivos_parcelas.csv`).
- Abstained fields do not add to the perennial total, so **water already committed is a minimum** ("at least").
- **The crop map is validated against blind photo-interpretation, not field visits.** The accuracy assessment (Olofsson, 5 km spatial blocks) is [PENDING].

## Water demand

- **Field (on-farm) efficiency has not been measured for DR-005.** The demand model uses a declared range of 0.45–0.70 [S] (`data/processed/rotaciones.json` → `params.ea_gravedad`); `data/params.json` → `eficiencia.parcelaria` stays null until a sourced value arrives. The P10–P90 band carries this uncertainty.
- **Open question, model vs INIFAP:** this assumption explains most of the gap between the model's alfalfa gross depth, 28.4 millares/ha at P50 (`rotaciones.json`), and INIFAP's 17.5 millares/ha [V] (S9 §5). It will be discussed with a district technician. If the efficiency range is too low, hectares covered are understated and committed water is overstated.
- **Drip scenario not available:** there is no sourced drip efficiency (`data/params.json` → `eficiencia.goteo` is null; `web/data/cubo.json` → `meta.notas`).
- **Money row without verified data:** no verified margin data (`web/data/cubo.json` → `meta.notas`); the row shows "no data".
- **Crop options are provisional.** The current rotation and its alternatives per crop are a design of the integrator [S] (`data/opciones_b4.json`) until the team's rotation table (kit B3) arrives.
- **Pecan:** the FAO-56 "Walnut orchard" Kc [V] is adjusted with an assumed canopy cover of 0.7 [S] (`rotaciones.json`), not yet measured with NDVI (S8, decision 5). The pecan term is a 10-year calculation horizon [S], not the life of the orchard, which will be cited from INIFAP before it is published.
- **Where the "millar" is measured:** assumed at the field intake [S]; to be confirmed with a module technician. The allocation marks are press figures: *Like 2025* is [P]; *Like 2026* and *Normal year* are [P], to be confirmed, because their article was not read directly (`data/params.json` → `dotaciones`).
- **NASA POWER is one grid cell per zone**, not a station (MERRA-2, 0.5° × 0.625°; `web/data/manifest.json`). The Delicias point lies outside the original rectangle but inside the same cell; Lázaro Cárdenas falls in another cell and needs its own climate files (`docs/decisiones/2026-11-14_dos_zonas.md`).
- **OpenET does not cover Mexico yet.** The regional ET contrast with SSEBop VIIRS and WaPOR v3 (zone scale, never per field) has not been run.

## Relief and storm

- **NASADEM at 30 m is used at zone scale, not per field** (gravity-irrigated fields are leveled). "Simulate a storm" is illustrative: no hydrograph, no depths, no earthworks or drain design. Its map display is [PENDING].
- **The storm depth comes from NASA POWER PRECTOTCORR**, defined as the 95th percentile of the days with rain ≥ 1 mm at the pilot-area point, 1984-01-01 to 2026-11-09 (`web/data/relieve.json` → `zonas.*.tormenta`), not from GPM IMERG, which is not integrated. Today the relief layer covers `delicias_saucillo`.
- **No LiDAR.** INEGI LiDAR coverage of the pilot area was not confirmed [NE], so there is no ponding analysis inside fields.

## Field memory and tests

- **Field memory** is a rule-based reading of monthly greenness (NDVI threshold 0.40, sensitivity 0.35–0.45 [S], `data/params.json` → `memoria`), not a crop census. Without memory, stand age is "not available" and every alfalfa field is shown as committed.
- **Back-test H1 not run:** the SIH series `LBQCH.csv` is not in the repo. Its truth is the outflow at La Boquilla's intake works, which is not the delivery at the field (S8, decision 7).
- **H3 not run yet.** It compares shares, not fields: the share of annual-crop fields with an active summer crop in 2025 against its 2019–2024 median, and the same share among pecan orchards (S9 §6 and Annex B). Survivorship: orchards are identified in 2026, so orchards removed before 2026 are not observed; the number of fields in each group will be published.
- **Figure checker tested on templates, not on an LLM.** `motor/verificador.py` runs as step 7b of `python construir.py`: 30 of 30 golden-set cases correct, 0 of 71 numbers altered and template use in 30 of 30 (`docs/figuras/llm_eval.csv`). There is no LLM API key, so every explanation is a template with placeholders; the checker has not yet been run on LLM-written text.
- **Aquifer figure:** the availability of −167.12 hm³/year is Conagua's official deficit [V], not a measured loss.

## Pilot areas and data status

- **Pilot rectangles are design choices [S]**; the module boundary is not public [NE]. Two areas are in progress, `delicias_saucillo` extended west and `lazaro_cardenas` (`docs/decisiones/2026-11-14_dos_zonas.md`); the live map keeps the original rectangle (338 fields) until the new deliveries are integrated.
- **The web reads real deliveries** (`web/data/cubo.json` → `meta.mock: false`). Still missing from the team: the allocation table (`dotaciones.json`), the assumptions table (`supuestos.json`) and the figure table (`cifras.csv`), as the `python construir.py` report lists.
- With few fields in a group, its shares rest on few fields.
