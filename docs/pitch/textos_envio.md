<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Textos para el formulario de envío (en inglés)

**BORRADOR para que el equipo lo ajuste (responsable de presentación y pitch, con el integrador).** Cada texto sale del `README.md` del 14-nov, incluidos los cambios de las 22:53 (commit `b73e8b3`: H1-b y «Model against local practice»); no agrega cifras nuevas. Una sola frase se aparta del README: la del goteo (sección 5), porque en ese punto el README quedó atrasado. Además, estos textos no copian una frase del README que otro documento del repo contradice (nota al final de la sección 5).

## 1. Qué piden el plan y el kit

| Punto | Lo que dice | Dónde |
|---|---|---|
| Horas | Envío inicial el domingo a las 13:00; envío final antes de las 14:30, con captura de la confirmación | `docs/sintesis/S10_plan_sapo.md` §7; kit Q2 |
| Idioma | Todo el formulario en inglés | Kit Q2 |
| Demo | Video de 30 segundos o menos con subtítulos en inglés, o diapositivas (máximo 7) | Kit Q2 |
| Ligas | Web, repositorio, video y diapositivas, sin inicio de sesión y probadas en incógnito | Kit Q2 |
| NASA Data | La sección enumera cada dataset utilizado | Kit Q2 |
| IA | La sección «SI/AI tools used» va completa, y la declaración figura también en el README, en los encabezados de archivo y en la descripción del repositorio | Kit Q2 |
| Referencias | Bibliotecas, datos, artículos y prensa | Kit Q2 |
| Pruebas | Las cinco pruebas con su resultado o con «not run» | Kit Q2 |
| Prohibido | Logotipos, banderas o identificadores de misión de la NASA | Kit Q2; `CLAUDE.md`, regla 9 |
| Categorías | En el formulario se mantienen Local Impact y Best Use of Data | `docs/sintesis/S9_proyecto_definitivo.md` §7 |

**Cómo usar este archivo**
- Los nombres de los campos son los habituales del formulario. Las guías 2026 de entrega no están en el repo: ajuste los nombres y los límites de caracteres al formulario real.
- «[SI ESTÁ CONECTADO]» marca una frase que se agrega si esa pieza del gemelo ya está en la página el domingo. Si no lo está, se omite.
- «[LINK: pendiente — quién la da]» marca una liga que falta.
- Si el `README.md` cambia después de la última corrida, vuelva a leer las cifras de estos textos contra él.

## 2. Ligas

| Campo | Liga |
|---|---|
| Live project (web) | [LINK: pendiente — integrador; se activa al publicar el repositorio y encender GitHub Pages, `docs/reparto_faltantes.md`, H1] |
| Repository | [LINK: pendiente — integrador; el repositorio debe quedar público] |
| Demo video (30 s or less) | [LINK: pendiente — responsable de video (P6)] |
| Backup slides (PDF, 7 or fewer) | [LINK: pendiente — responsable de presentación y pitch] |
| Preregistration (OSF) | [LINK: pendiente — integrador; `docs/reparto_faltantes.md`, H3] |

## 3. Project name

```text
Raíz – From Dam to Root
```

Team: Los Norteados · Local event: Chihuahua · Challenge: Field Shift: Adapting Farms with NASA Data

## 4. High-level summary (short)

```text
Raíz is a digital twin of two pilot areas of the DR-005 Delicias irrigation district in Chihuahua, Mexico. Before you plant, it shows the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover. The user picks the dam allocation with a slider. For each estimated field, Raíz compares the current rotation with alternatives, using open NASA data (HLS, NASA POWER, NASADEM and GPM IMERG). Every test result is published with the same visibility, favorable or not. The tool supports, never replaces, the judgment of farmers and local experts.
```

Versión de una línea, por si el campo es muy corto:

```text
Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover.
```

## 5. Project details (long description)

```text
THE PROBLEM
In the DR-005 Delicias irrigation district (73,002 ha; 8,113 producers), farmers decide what to plant before they know how much water the dam will deliver. Alfalfa and pecan, both perennial crops, covered 39,421 of the 62,219 ha planted in 2016-17 (63 %). In 2025 the district received no dam water: between 12,000 and 15,000 ha were planted with wells and 87.4 hm³ of groundwater were authorized for survival irrigation, mostly pecan (press figures). The Meoqui-Delicias aquifer has an official availability of −167.12 hm³ per year, and 83.3 % of its recharge comes from irrigation return flows.

The mechanism behind the project: an annual crop can be skipped in a dry year; a perennial crop cannot. Its water stays committed for years and, when the dam falls short, it comes from the aquifer.

WHAT RAÍZ DOES
Raíz is a digital twin of two pilot areas: a replica that is updated with data and lets a farmer or a technician try out decisions before planting. It has three screens.

1. Control center. A map of 1,239 estimated fields, an allocation slider in thousand cubic meters per hectare with three reference marks taken from the press, and a "Rain −20 %" switch. The main indicator is the water already committed: the share of the allocation that perennial fields ask for before a single hectare of annual crops is planted. A "Terrain & runoff" overlay with "Simulate a storm" shows runoff routes at area scale.
2. Field sheet. The field memory since 2016, the current rotation and two or three alternatives with Water, Soil and Money rows, a "Follow the drop" diagram (dam, canal, field, crop, aquifer), and a "Why?" section with the five answers the challenge asks for.
3. Message to the farmer. A WhatsApp preview in Spanish and a printable field sheet, generated from the same data.

HOW IT WORKS
- Field memory: monthly greenness from HLS (Harmonized Landsat Sentinel-2) classifies each agricultural year of each field with declared rules and no labels.
- Water need: FAO-56 with NASA POWER daily climate gives the gross field depth of each option as a P10–P50–P90 band (Monte Carlo).
- Coverage: hectares covered = area × min(1, allocation ÷ median depth), always shown with its range. A traffic light is green if the allocation covers the high estimate, amber if it covers the median, red if it does not, and gray if the crop map abstains.
- Water term: an annual crop commits water for 1 year; alfalfa for 3–4 years (press source); pecan is computed over a 10-year horizon (a declared assumption).
- Follow the drop: counts consumption (ET) and aquifer recharge, not just dam withdrawals.
- One command, python construir.py, rebuilds everything from the validated data cache and runs every check. The page reads its figures from data files; no figure is written by hand in the HTML or the JavaScript, and an automated test checks it. Publishing happens when, and just when, every check passes.

VALIDATION: FIVE TESTS IN SIGHT
Each criterion was declared before seeing the result.
1. Crop map: partial. Phenological rules on HLS classify 458 of 1,239 fields; 781 abstain (63.0 %). Random Forest, spatial validation and accuracy assessment: not run.
2. Back-test 2026 (H1): does not meet the preregistered criterion (partial back-test; press-reported truth). At July 14, 2026 the model's median is 904.6 hm³ against 447.65 hm³; the simple baselines were closer (404.5 and 367.2 hm³). The model computes the full crop demand and overestimates the level. A follow-up test of the seasonal shape over the 1999–2024 cycles (H1-b, specified before running; it does not change H1) does not hold either: the model beats the two simple shapes in 6 of 26 years and places demand earlier than the dam releases it.
3. 2025 natural experiment (H3): not supported. Among 184 annual-crop fields, the share with an active summer crop was 82.6 % in 2025 against a 2019–2024 median of 84.2 % (−1.6 points; the criterion asked for −25 or more). Among 44 pecan orchards the share stayed at 100 %.
4. Figure checker: partial. Golden set passed: 30 of 30 cases correct, 5 of 5 traps caught, 0 of 71 numbers altered. Texts written by an LLM: not run; all texts are templates filled from the data.
5. Regional ET contrast and automated checks: partial. Modeled crop ET of 1,139.3 mm against SSEBop VIIRS v6 of 746.3 mm over October 2025 to September 2026 (+53 %), as a regional comparison, not a field-level validation. WaPOR v3 and the FAO-56 worked examples: not run. Water balance of the drop: passed.

LIMITATIONS
The tool does not allocate, sell or trade water. It does not forecast the dam. It does not promise that any water will be freed. The twin has no field sensors and no real-time data: it is refreshed on each run, from satellite and climate data. 63 % of the fields are not classified and have no options. Field boundaries are estimated by a model outside its training domain. Crop options are provisional. The field-efficiency range is an assumption. The model computes the full crop requirement: it is higher than the depths recommended by INIFAP and those applied in the district for alfalfa, pecan, cotton and forage maize, and lower for chile; for alfalfa, 28.4 thousand m³/ha against INIFAP's 17.5. The drip scenario uses indicative FAO efficiencies that were not measured in the district. The Money row has no data. The full list is in LIMITATIONS.md.

WHAT COMES NEXT
Ask a district technician which on-farm efficiency is realistic for gravity irrigation and under which conditions the INIFAP depths apply; classify the remaining fields with the team's blind labels and assess the accuracy of the crop map; review fields and options with farmers of the two pilot areas.

This tool supports, never replaces, the judgment of farmers and local experts.
```

Frases que se agregan si la pieza ya está en la página:

| Marca | Frase en inglés | Dónde va |
|---|---|---|
| [SI ESTÁ CONECTADO] vista 3D | `A 3D view draws the terrain from NASADEM and a water column on each field: blue up to the chosen allocation, red for what is missing.` | En «WHAT RAÍZ DOES», punto 1 |
| [SI ESTÁ CONECTADO] línea de tiempo | `A timeline replays the agricultural years 2016–2026 and highlights 2025, the year without dam water.` | En «WHAT RAÍZ DOES», punto 1 |
| [SI ESTÁ CONECTADO] tarjeta de estado | `A status card separates what is observed, what is modeled and what is a scenario, with the date of each source.` | En «WHAT RAÍZ DOES», después del punto 3 |
| [SI ESTÁ CONECTADO] app instalable | `The app installs on a phone or a laptop and keeps working without a network, with the last synced copy.` | En «WHAT RAÍZ DOES», después del punto 3 |
| [SI ESTÁ CONECTADO] contexto regional | `A regional context panel shows monthly series per area from SMAP, MODIS, GRACE/GRACE-FO, GLDAS and NLDAS, and GEDI canopy height per field.` | En «WHAT RAÍZ DOES», después del punto 3 |

Si ninguna queda conectada, agregue esta frase al final de «LIMITATIONS»: `A 3D view, a timeline, a status card, an installable app and a regional context panel are being built; the page does not have them yet.`

**La frase del goteo en «LIMITATIONS» tiene dos variantes.** El bloque de arriba trae la del goteo conectado: desde la corrida de las 22:46 del 14-nov, `web/data/cubo.json` ya trae el escenario de goteo (`meta.goteo`), con el motor todavía en revisión.

| Marca | Frase en inglés |
|---|---|
| [SI EL GOTEO ESTÁ CONECTADO] (la del bloque) | `The drip scenario uses indicative FAO efficiencies that were not measured in the district.` |
| [SI EL GOTEO NO ESTÁ] (respaldo, si la revisión lo retira) | `The drip scenario is not on the page yet: the drip efficiency in the data is an indicative FAO value that was not measured in the district.` |

Con el goteo conectado, agregue además al punto 2 de «WHAT RAÍZ DOES»: `"Follow the drop" also shows a drip scenario, labeled "indicative, not local".`

Por qué esta frase no copia al README: `README.md` («No drip scenario») y `LIMITATIONS.md` («There is no sourced drip efficiency») quedaron atrasados. La eficiencia tiene fuente en `data/processed/supuestos.json` → `ea_goteo` (un valor indicativo de la FAO, no local) y la decisión `docs/decisiones/2026-11-14_opciones_b3.md` §3 ordena conectar el escenario. El integrador corrige esos dos archivos; antes del envío, compruebe que el formulario y el README digan lo mismo.

Nota sobre la palabra «preregistered»: el `README.md` la usa para H1 y H3, y la liga pública de OSF todavía no está en el repo. Si la liga no llega antes del envío, el integrador decide si se conserva la palabra o se cambia por «declared beforehand in the project documents».

Nota sobre H1-b y la lámina del modelo: la prueba 2 ya incluye H1-b (prueba posterior, especificada antes de correr; no cambia H1) y «LIMITATIONS» dice que el modelo queda por encima de lo recomendado y de lo aplicado en el distrito. Las dos cosas salen del `README.md`, «Open question: model against INIFAP depth», puntos «H1-b» y «Model against local practice». Estos textos **no** copian la frase del README «So most of the gap comes from dividing by the field (on-farm) efficiency»: `docs/modelo_vs_practica.md` (§2, punto 3) dice que en alfalfa la diferencia viene de la ET y no solo de la eficiencia. El integrador corrige esa frase en `README.md` y en `LIMITATIONS.md` («Water demand»); antes del envío, compruebe que el formulario y el README digan lo mismo. La sección «Tests in sight» de la página todavía no menciona H1-b.

## 6. NASA Data

```text
In use (the page or a published test reads it):
- HLS v2, Harmonized Landsat Sentinel-2 (HLSL30 and HLSS30 v002, 30 m, via Google Earth Engine): monthly greenness per field for the 2026 crop map, the field memory 2016–2026, bare-soil days and test H3.
- NASA POWER, Daily API, community AG: daily climate for FAO-56 reference ET and crop water need, one grid cell per pilot area; climatology of test H1.
- NASADEM (30 m): slope, runoff routes and "Simulate a storm" at area scale; three context indicators in the Soil row.
- GPM IMERG V07: daily rain per area and the reference storm of "Simulate a storm".
- VIIRS, through SSEBop VIIRS v6 monthly (a USGS product, 1 km): regional contrast of the modeled ET, never per field.

Delivered and validated on Nov 14, 2026; not on the page yet:
- NASA POWER minimum temperature: frost dates.
- SMAP L4: surface and root-zone soil moisture, monthly, as regional context.
- MODIS collection 6.1 (MOD13Q1, MOD16A2GF, MOD11A2): greenness of the area before the HLS record, a second ET series and daytime land surface temperature.
- GRACE / GRACE-FO: anomaly of the water stored in the basin, as one basin series.
- GLDAS-2.1 Noah: ET and root-zone moisture from a land surface model.
- NLDAS-2 forcing: a second source of rain and potential evaporation.
- GEDI L2A: canopy height per field, to tell an orchard from a low crop; 1,072 of 1,239 fields have at least one shot.

Requested, not delivered yet:
- ECOSTRESS: field-scale ET contrast.

Challenge resources that do not cover Mexico: OpenET does not cover Mexico, so the ET contrast uses SSEBop on VIIRS. USDA, NRCS, CDL, NAIP, NLCD, PRISM, NWIS, CoCoRaHS, AMS, NASS and LANDFIRE cover the United States; the local equivalents are SIAP (crop statistics), SIH/Conagua (dams) and SDR Chihuahua.
```

**[SI ESTÁ CONECTADO]** Si el panel de contexto regional ya está en la página, cambie el segundo encabezado por: `Delivered and validated on Nov 14, 2026; shown in the regional context panel:`

## 7. Space agency partner and other data

```text
- Copernicus Sentinel-2 (ESA), through the NASA HLS product that harmonizes it with Landsat.
- ERA5-Land (ECMWF and Copernicus; not a NASA product): monthly mean of the daily minimum temperature and frost days. Delivered, not on the page yet.
- Fields of The World 2025 global field-boundary predictions (Source Cooperative, CC-BY-4.0): field polygons and a confidence layer. Field boundaries are neural-network predictions outside the model's training domain, filtered by confidence.
- Conagua: technical report of aquifer 0831 (return-flow coefficients) and the SIH daily series of La Boquilla dam, used as the truth of the H1 back-test.
- INIFAP crop water depths, FIRA alfalfa stand life and IMTA canal conveyance efficiency, as cited in the project documents.
- GAEZ (FAO): requested, not delivered yet. WaPOR v3 (FAO): second regional ET contrast, not run.
- OpenStreetMap base map.
Licenses and terms of use of every source are listed in DATA_LICENSE.md.
```

## 8. SI/AI tools used

```text
We used AI where its work can be checked.
- Code and documents: Claude Code wrote the integration code, tests and documents from our specifications and the data contract, with implementer agents and independent reviewer agents with fresh context. A separate Claude session wrote and ran the data scripts and the Earth Engine runs. Teammates used Gemini in Google Colab or Claude in the browser for scoped notebooks.
- Field boundaries: Fields of The World neural network (third-party data), filtered by confidence.
- Crop map 2026: phenological rules, with no AI in the current map. Random Forest: not run.
- Field memory: no AI; rules on monthly greenness with declared thresholds.
- Explanations: no LLM in the app. They are template texts with placeholders, drafted with Claude Code; the numbers are filled from the data.
- Prior research: Claude, ChatGPT, Gemini, DeepSeek and NotebookLM for search and synthesis; each figure was checked in its original source.
- Page texts, pitch scripts and these submission texts: drafted with Claude Code from the repository files; the team reviews them before submission.
- Images or video: none generated with AI. The video is a screen capture of the real app.

How it is verified: one command rebuilds everything and stops publishing if a check fails; no figure is written by hand on the page; a figure checker passed its golden set (30 of 30 cases, 0 numbers altered); every file carries an "AI-assisted" header and AI_USAGE.md logs each task.

Where AI is not used: the dam volume is not forecast; the planting decision is not made by the tool; water is computed with FAO-56 and explicit rules, not by an LLM; no numbers are generated by AI.

AI never generates the numbers or makes the decision; farmers and technicians decide.
```

## 9. References

```text
Articles and reports
- Allen et al. (1998). Crop evapotranspiration — Guidelines for computing crop water requirements. FAO Irrigation and Drainage Paper 56.
- Conagua (2024). Actualización de la disponibilidad media anual de agua en el acuífero Meoqui-Delicias (0831), technical report DR_0831. https://sigagis.conagua.gob.mx/gas1/Edos_Acuiferos_18/chihuahua/DR_0831.pdf
- Conagua, Sistema de Información Hidrológica (SIH): daily series of La Boquilla, downloaded Nov 14, 2026.
- IMTA, COMEII 2021: canal conveyance efficiency. FIRA AGROCOSTOS 2025: alfalfa stand life. INIFAP: crop water depths.
- Grafton et al. (2018), Science: irrigation efficiency and return flows. Mall and Herman (2019): shortage risk from perennial-crop expansion in California. Olofsson et al. (2014): area and accuracy assessment. Villalobos-Cano et al. (2024).

Data
- Masek, J., et al. (2021). HLS Operational Land Imager Surface Reflectance and TOA Brightness Daily Global 30m v2.0. NASA EOSDIS LP DAAC. https://doi.org/10.5067/HLS/HLSL30.002
- HLS Sentinel-2 Multi-spectral Instrument Surface Reflectance Daily Global 30m v2.0. NASA EOSDIS LP DAAC. https://doi.org/10.5067/HLS/HLSS30.002
- NASA JPL (2020). NASADEM Merged DEM Global 1 arc second V001. NASA EOSDIS LP DAAC. https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001
- NASA POWER (NASA Langley Research Center), Daily API, community AG. https://power.larc.nasa.gov/api/temporal/daily/point
- NASA GPM IMERG V07, Earth Engine collection NASA/GPM_L3/IMERG_V07.
- Senay, G. B., Kagone, S. and Velpuri, N. M. (2020). Operational Global Actual Evapotranspiration using the SSEBop model. U.S. Geological Survey data release. https://doi.org/10.5066/P9OUVUUI
- Fields of The World global predictions (CC-BY-4.0), Source Cooperative, source.coop/ftw/global-data.
- Regional context and GEDI, by Earth Engine identifier: NASA/SMAP/SPL4SMGP/008; MODIS/061/MOD13Q1, MOD16A2GF and MOD11A2; NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI; NASA/GLDAS/V021/NOAH/G025/T3H; NASA/NLDAS/FORA0125_H002; ECMWF/ERA5_LAND/DAILY_AGGR; LARSE/GEDI/GEDI02_A_002_MONTHLY.

Press (figures labeled as press)
- El Diario de Chihuahua, Oct 28, 2024 and Jul 27, 2026 (allocation marks).
- Impacto Noticias, Nov 9, 2026, with Conagua's daily report (La Boquilla storage).
- El Diario de Delicias, Jan 31, 2025 (groundwater authorized in 2025).
- Local press of December 2025 (hectares planted with wells in 2025).

Challenge and libraries
- Challenge: https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/
- MapLibre GL JS 5.24.0, d3 7.9.0 and d3-sankey 0.12.3, copied unchanged and verified by hash. pytest 9.1.0.
```

Nota: el `README.md` avisa que las fichas bibliográficas completas de varios artículos no están en el repositorio. Si el formulario las exige completas, complételas antes del envío final.

**[SI EL GOTEO ESTÁ CONECTADO]** agregue esta referencia a «Articles and reports». Sale de `data/processed/supuestos.json` → `ea_goteo`; el `README.md` todavía no la trae:

```text
- Brouwer, Prins and Heibloem (1989). Irrigation Water Management Training Manual No. 4, "Irrigation Scheduling". FAO. Annex I, Table 8, "Indicative values of the field application efficiency (ea)". https://www.fao.org/3/t7202e/t7202e08.htm
```

## 10. Lista de envío (kit Q2)

- [ ] Todo el formulario en inglés.
- [ ] Video de 30 segundos o menos con subtítulos en inglés, o diapositivas (máximo 7).
- [ ] Ligas sin inicio de sesión, probadas en incógnito: web, repositorio, video y diapositivas.
- [ ] La sección «NASA Data» enumera cada dataset utilizado.
- [ ] La sección «SI/AI tools used» está completa, y la declaración figura también en el README, en los encabezados de archivo y en la descripción del repositorio.
- [ ] Ningún logotipo, bandera o identificador de misión de la NASA.
- [ ] «References» completas: bibliotecas, datos, artículos y prensa.
- [ ] Las cinco pruebas con su resultado o con «not run».
- [ ] Revisión de cifras de las 12:30: página, video, póster y ficha impresa coinciden con `cifras.csv` y `manifest.json`.
- [ ] Los 6 integrantes confirmados en la sede de Chihuahua.
- [ ] Captura de pantalla de la confirmación del envío.

## 11. Cifras de estos textos y su origen

Todas están en el `README.md` del 14-nov, que las cita con su archivo.

| Cifra | Sección del `README.md` |
|---|---|
| 73,002 ha; 8,113 productores; 39,421 de 62,219 ha (63 %) | «Summary», «Why it matters» (S9 §2) |
| 12,000 a 15,000 ha con pozos; 87.4 hm³ de agua subterránea [P] | «Summary» (S9 §2 y Anexo A) |
| −167.12 hm³ al año; 83.3 % de la recarga | «Summary» (S9 §2) |
| 1,239 parcelas; 458 clasificadas; 781 sin clasificar (63.0 %) | «Pilot areas»; «Validation», prueba 1 |
| Plazos: 1 año; 3 a 4 años; horizonte de 10 años | «How it works», «Calculation» |
| H1: 904.6, 447.65, 404.5 y 367.2 hm³ | «Validation», prueba 2 (`docs/resultado_H1.md`) |
| H1-b: ciclos de 1999 a 2024; 6 de 26 años | «Open question: model against INIFAP depth», punto «H1-b» (`docs/resultado_H1b.md`; especificación en `docs/h1b_especificacion.md`) |
| H3: 184 parcelas; 82.6 % y 84.2 %; −1.6 puntos; 44 huertas; 100 % | «Validation», prueba 3 (`docs/resultado_H3.md`) |
| Verificador: 30 de 30; 5 de 5; 0 de 71 | «Validation», prueba 4 (`docs/figuras/llm_eval.csv`) |
| ET: 1,139.3 mm y 746.3 mm; +53 % | «Validation», prueba 5 (`docs/resultado_A8.md`) |
| Alfalfa: 28.4 frente a 17.5 millares/ha | «Open question: model against INIFAP depth» (la lista de cultivos por encima y por debajo, sin cifras, sale del punto «Model against local practice»; detalle en `docs/modelo_vs_practica.md`) |
| GEDI: 1,072 de 1,239 parcelas | «NASA Data» |
| Goteo: ninguna cifra en el texto | No viene del README. La eficiencia indicativa está en `data/processed/supuestos.json` → `ea_goteo` |
| Versiones de bibliotecas | «References» |
