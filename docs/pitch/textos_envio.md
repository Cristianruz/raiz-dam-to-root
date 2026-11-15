<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Textos para el formulario de envío (en inglés)

**BORRADOR para que el equipo lo ajuste (responsable de presentación y pitch, con el integrador).** Versión del 15-nov. Los textos salen del `README.md`, de `LIMITATIONS.md`, de `DATA_LICENSE.md` y de los datos de la página (`web/data/*.json`); cada cifra lleva su fuente en la sección 12. Todas las piezas del gemelo están en la página (`web/app.js` importa y monta la vista 3D, la línea de tiempo, la tarjeta de estado, la app instalable, el contexto regional y el suelo), y el escenario de goteo también (`web/data/cubo.json` → `meta.goteo.disponible`: true). Por eso ya no hay variantes «[SI ESTÁ CONECTADO]».

## Antes de pegar (Cristian)

Lo que solo Cristian puede resolver. Nada de esto va dentro de los bloques que se pegan: los bloques están completos y en inglés. Los únicos textos «to be confirmed» que llevan son los de las licencias de «References» (punto 11).

1. **Liga del video.** El archivo es `docs/pitch/video_30s.mp4` (30 s o menos; se vuelve a grabar sobre la página final con `node tests/e2e/grabar_video.mjs`). Súbalo, pruebe la liga en incógnito y póngala en la sección 2.
2. **Liga del PDF de las diapositivas.** El archivo es `docs/pitch/diapositivas.pdf` (lo genera `node tests/e2e/diapositivas_pdf.mjs` de `docs/pitch/diapositivas.html`). Antes de exportarlo, cambie el marcador «[INTEGRANTES]» de la portada por los nombres.
3. **Nombres de los integrantes** en el formulario, tal como están inscritos.
4. **Liga de OSF**, si el preregistro se publicó. Si no existe, se deja la frase de la sección 2.
5. **Nombre exacto y límite de caracteres de cada campo** del formulario real, incluido «Use of Super Intelligence (SI)» (secciones 3 a 10). Si un campo es más corto, recorte desde el final del bloque.
6. **Cómo surgió la idea (hallazgo C2 de `docs/revisiones/2026-11-14_2300_revision_vs_guia_spaceapps.md`).** La guía 2026 indica que la SI no debe usarse para concebir la idea. Lo que el repo registra es esto: del 10 al 13 de noviembre, Cristian usó a Claude, en el chat del proyecto, para redactar la documentación previa (proyecto definitivo S9, enfoque, kit, plan del evento y anteproyecto), sin código, y el equipo la revisó (`AI_USAGE.md`, primera fila). El bloque de SI (sección 9) dice ese hecho y nada más: no afirma que la idea sea del equipo ni lo contrario. **Falta una frase suya, con sus palabras, sobre cómo surgió la idea**, para ponerla al final del primer apartado del bloque. La revisión propone esta; úsela solo si puede sostener cada parte, porque el repo respalda la del medio (Claude ayudó a estructurar y a escribir) y no dice de dónde salió la idea ni quién tomó cada decisión de diseño: `The problem, the district, the data and the goal of showing each crop as a multi-year water commitment came from the team's research and the challenge; Claude helped us structure and write the concept, and the team chose and owns every design decision.` No borre la fila de `AI_USAGE.md`.
7. **Investigación previa con otras herramientas.** `README.md` («SI/AI tools used») nombra a ChatGPT, Gemini, DeepSeek y NotebookLM para la búsqueda y la síntesis previas; `AI_USAGE.md` no lo registra, y por eso el bloque de SI no lo dice. Si se usaron, agregue una línea a `AI_USAGE.md` y esta frase al bloque: `Prior research: Claude, ChatGPT, Gemini, DeepSeek and NotebookLM for search and synthesis; each figure was checked in its original source.`
8. **OpenAI Codex en el formulario.** El tablero (la portada) lo hizo P4 (Tena) con OpenAI Codex y se corrigió después con Claude Code (`AI_USAGE.md`, filas del 15-nov; `README.md` → «SI/AI tools used»). El bloque de SI de la sección 9 ya lo nombra: declárelo también en el campo del formulario, con ese nombre, y no lo quite al recortar.
9. **Líneas de cada integrante en `AI_USAGE.md`.** El renglón de P2 a P6 (Gemini en Colab o Claude en el navegador) sigue «por llenar». Si nadie usó esas herramientas, quite del bloque de SI el renglón «Notebooks».
10. **Cita de software de AppEEARS.** AppEEARS pide que se cite la herramienta. El repo registra la versión (3.137) y los identificadores de las dos solicitudes (`docs/ecostress.md`; `data/processed/fuentes.json`), y, desde el 15-nov, el texto de la cita: está en el README que AppEEARS genera con cada solicitud (`data/raw/reto/ecostress_readme_*.md`) y ya va copiado, textual, en «References». **Resuelto: no hay nada que hacer.**
11. **Licencias sin confirmar en «References».** El bloque lleva cinco «terms to be confirmed», de licencias o términos de uso: SIH/Conagua; INIFAP, FIRA e IMTA; ERA5-Land; el catálogo de suelo y las reglas de nutrientes; y ECOCROP. Se dejan a propósito, porque el repo no tiene el texto de esos términos: no los complete de memoria.

## 1. Qué piden el plan, el kit y la guía de envío 2026

| Punto | Lo que dice | Dónde |
|---|---|---|
| Horas | Envío inicial el domingo a las 13:00; envío final antes de las 14:30, con captura de la confirmación | `docs/sintesis/S10_plan_sapo.md` §7; kit Q2 |
| Idioma | Todo el formulario en inglés | Kit Q2 |
| Demo | Video de 30 segundos o menos con subtítulos en inglés, o diapositivas (máximo 7) | Kit Q2 |
| Ligas | Web, repositorio, video y diapositivas, sin inicio de sesión y probadas en incógnito | Kit Q2 |
| NASA Data | Cada producto con nombre, versión, resolución, periodo, acceso y uso | Kit Q2; guía de envío 2026 (la trajo Cristian) |
| IA | Campo «Use of Super Intelligence (SI)» | Guía de envío 2026 |
| Referencias | Bibliotecas, datos, artículos y prensa, con licencia | Kit Q2; `DATA_LICENSE.md` |
| Pruebas | Las cinco pruebas con su resultado o con «not run» | Kit Q2 |
| Prohibido | Logotipos, banderas o identificadores de misión de la NASA | Kit Q2; `CLAUDE.md`, regla 9 |
| Socios | La Agencia Espacial Mexicana no es Space Agency Partner en 2026: no se menciona como tal. ERA5-Land es de ECMWF, no de la NASA | Indicación del coordinador (15-nov) |
| Categorías | En el formulario se mantienen Local Impact y Best Use of Data | `docs/sintesis/S9_proyecto_definitivo.md` §7 |

**Cómo usar este archivo**
- Lo que va dentro de los bloques `text` se pega en el formulario. Lo de fuera son notas internas: no se pegan.
- **Nombres de los campos por confirmar.** Los títulos de las secciones 3 a 9 siguen la guía de envío 2026 que trajo Cristian. Antes de pegar, confirme en el formulario real el texto exacto de cada campo y su límite de caracteres; si un campo es más corto, recorte desde el final de cada bloque.
- **Idioma de las ligas.** Los bloques solo enlazan `README.md`, `LIMITATIONS.md`, `DATA_LICENSE.md` y las traducciones de `docs/en/` (índice en `docs/en/README.md`: `result_H1.md`, `result_H1b.md`, `H1b_specification.md`, `result_H3.md`, `model_vs_practice.md`, `story_fields_review.md`). Nunca enlace un `docs/*.md` en español desde el formulario.
- «[LINK: pendiente — quién la da]» marca una liga que falta. Los pendientes que solo resuelve Cristian están arriba, en «Antes de pegar (Cristian)»; fuera de las licencias de «References» (punto 11), ningún bloque lleva marcadores.
- Si el `README.md` o los datos cambian después de la última corrida, vuelva a leer las cifras contra la sección 12.

## 2. Ligas

| Campo | Liga |
|---|---|
| Live project (web) | https://cristianruz.github.io/raiz-dam-to-root/ (GitHub Pages publica `main`, origen GitHub Actions; el PR #4 ya está fusionado). Con el tablero como portada (decisión del 15-nov), esta liga abre el tablero y el explorador de parcelas queda en https://cristianruz.github.io/raiz-dam-to-root/explorer.html; una parcela se abre con `explorer.html#P0757` |
| Repository | https://github.com/Cristianruz/raiz-dam-to-root (público; la misma liga está en `motor/pruebas_web.py` → `REPOSITORIO`) |
| Demo video (30 s or less) | [LINK: pendiente — responsable de video (P6)] |
| Backup slides (PDF, 7 or fewer) | [LINK: pendiente — responsable de presentación y pitch] |
| Preregistration (OSF) | No hay liga de OSF en el repo (`docs/reparto_faltantes.md`, H3). Si el formulario la pide, escriba: `Criteria declared before the analysis; documents and commits listed in README.md → Status → Preregistration.` |

Antes de pegar la liga de la web, ábrala en incógnito y compruebe que muestra la versión completa: la portada es el tablero y, en `explorer.html`, está el botón «3D twin view».

## 3. Project Name

```text
ROOT – From Dam to Root
```

Team: Orbital Farming · Local event: Chihuahua · Challenge: Field Shift: Adapting Farms with NASA Data

## 4. High-Level Project Summary

```text
In the DR-005 Delicias irrigation district of Chihuahua, Mexico, farmers choose their crops before they know how much water the dam will deliver, and the Meoqui-Delicias aquifer (0831) already has an official availability of −167.12 hm³ per year (Conagua 2024). ROOT is a digital twin of two pilot areas that shows, field by field and before planting, how much water each crop option needs per year, for how many years it commits that water, and how many hectares the dam allocation chosen by the user can cover. It runs on open NASA data: HLS greenness for the field memory and the crop map, NASA POWER climate with FAO-56 for crop water need, NASADEM terrain and GPM IMERG rain, with SMAP, MODIS, GRACE/GRACE-FO, GLDAS, NLDAS and GEDI as regional context and field evidence. It is meant for farmers and irrigation-module technicians, who keep the decision. It matters because an annual crop can be skipped in a dry year but a perennial cannot: its water stays committed for years and, when the dam falls short, it comes from the aquifer.
```

Versión de una línea, por si el campo es muy corto:

```text
Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover.
```

## 5. Detailed Project Description

Los subtítulos repiten el vocabulario del reto Field Shift. Si el campo tiene límite de caracteres, recorte primero «PLAIN-LANGUAGE GLOSSARY» y «COMMON ANALYSIS GRID»: los dos están completos en el `README.md`.

```text
THE PROBLEM
In the DR-005 Delicias irrigation district (73,002 ha; 8,113 producers), farmers decide what to plant before they know how much water the dam will deliver. Alfalfa and pecan, both perennial crops, covered 39,421 of the 62,219 ha planted in 2016-17 (63 %). In 2025 the district received no dam water: between 12,000 and 15,000 ha were planted with wells and 87.4 hm³ of groundwater were authorized for survival irrigation, mostly pecan (press figures). The Meoqui-Delicias aquifer has an official availability of −167.12 hm³ per year, and 83.3 % of its recharge comes from irrigation return flows. An annual crop can be skipped in a dry year; a perennial crop cannot. Its water stays committed for years and, when the dam falls short, it comes from the aquifer.

WHAT ROOT DOES
ROOT is a digital twin of two pilot areas, 1,239 estimated fields: a replica that is updated with data and lets a farmer or a technician try out decisions before planting. It has no field sensors and no real-time data; it is rebuilt from satellite and climate data on each run.
1. Control center. A map of the fields, an allocation slider in thousand cubic meters per hectare with three reference marks taken from the press, and a "Rain −20 %" switch. The main indicator is the water already committed: the share of the allocation that perennial fields ask for before a single hectare of annual crops is planted. A 3D view draws the terrain from NASADEM and a water column on each field: blue up to the chosen allocation, red for what is missing. A timeline replays the agricultural years 2016–2026 and highlights 2025, the year without dam water. A "Terrain & runoff" overlay with "Simulate a storm" shows runoff routes at area scale. A "Twin status" card separates what is observed, what is modeled and what is the user's scenario, with the date of each source. A "Regional context" panel shows monthly series per area.
2. Field sheet. The field memory since 2016 and its monthly greenness, soil and satellite evidence (mapped soil properties, soil type, rule-based nutrient notes, canopy height and clear-day ET), the current rotation and its alternatives with Water, Soil and Money rows, a "Follow the drop" diagram (dam, canal, field, crop, aquifer) with a drip scenario labeled "indicative, not local", and a "Why?" section with the five answers the challenge asks for: why it is suggested (the reason given by the project's rotation table, with its label and source), evidence, benefits (each alternative compared with the field's current rotation: water per year, years of commitment, bare-soil days and whether it is a legume), what we don't know and risks needing local review.
3. Message to the farmer. A WhatsApp preview in Spanish and a printable field sheet, generated from the same data.
The app installs on a phone or a laptop and keeps working without a network, with the last synced copy.

ROTATION COMPARISON
Each classified field compares at least three rotation strategies, including the current rotation, side by side, and none is marked as the best; pecan orchards are the exception described below. The alternatives come from the project's rotation table. Each option shows how much water it asks for per year (median and P10–P90 range), how many years it commits that water, and how many of the field's hectares the chosen allocation covers. An established alfalfa stand is compared with keeping it while skipping two to three summer irrigations, breaking it with a winter cereal followed by forage maize, and leaving the field to rest with standing stubble; a stand younger than two years is not offered the summer cut. Where the table gives fewer than two alternatives (fallow and winter cereal), ROOT completes them with team proposals and labels them "[S] team proposal, not from the agronomic guide". Pecan is a documented exception: an orchard does not rotate, so ROOT compares no alternative crops there. It shows the water the orchard commits over a 10-year calculation horizon, the depth typically applied in the district as a local reference, and a drip scenario with a consumption cap.

BARE-FIELD PERIODS & VULNERABLE SEASONS
The field memory counts bare-soil days each year: days with NDVI below 0.2 from February 1 to April 30, the windy season, from monthly HLS greenness; the sheet shows the median over the years. Each option shows the months it keeps a crop on the field and its estimated bare-soil days. Next to each planting window the sheet shows the probability of a frost after that date, from NASA POWER minimum temperatures (1984–2025). The frost probability informs; it does not discard an option.

PATTERNS FROM NASA DATA
HLS greenness gives each field a year-by-year state since 2016 (summer crop, winter crop, double crop, rest or perennial), with declared rules and no labels. In 2025, the year without dam water, the share of annual-crop fields with an active summer crop fell far less than the 25 points we expected. In the analysis declared beforehand, on the original rectangle of 338 fields, it was 82.6 % against a 2019–2024 median of 84.2 % (−1.6 points). Post hoc, in the two pilot areas the page shows, it fell 16.0 points in Delicias – Saucillo (580 annual-crop fields) and 0.0 in Lázaro Cárdenas (210). Pecan orchards stayed green; satellite greenness does not tell where the water came from. The model's crop water demand is above what satellites see: modeled crop ET of 1,139.5 mm against 746.3 mm from SSEBop VIIRS over October 2025 to September 2026 (+53 %) on the original rectangle, and +28 % and +3 % post hoc in the two pilot areas, as a regional comparison. Regional series from SMAP, MODIS, GRACE/GRACE-FO, GLDAS, NLDAS and ERA5-Land show soil moisture, long-term greenness, ET, stored water in the basin and frost days, as context for the area, never for a single field.

FARMER PRIORITIES
The tool answers the farmer's planting question in the farmer's units: thousand cubic meters per hectare ("millares"), years of commitment and hectares covered. Each option carries Water, Soil and Money rows, and a row of switches, "What matters most to you?", highlights options by the priority you pick (for example less water, a shorter water commitment, nitrogen fixing or less bare soil); it does not rank them. Forage value, organic matter and market are listed as "no data in ROOT yet", and the Money row says "No verified data" because we have no verified margins: a number without a source does not enter. The message to the farmer is in Spanish and can be printed. The page asks for no name or phone number and sends nothing. The decision stays with the farmer and the technician.

UNCERTAINTY & HUMAN JUDGMENT
- Every water depth is a P10–P50–P90 band from a Monte Carlo run of FAO-56 (2,000 runs over the 1991–2025 climate, with the uncertain field efficiency and reference-ET bias), and hectares covered are always shown with their range.
- The crop map abstains instead of guessing: 781 of 1,239 fields (63.0 %) are not classified and are shown in gray, with no options. Committed water is therefore shown as "at least".
- Rotation filters that need field data the tool does not have, or whose source sets no threshold, are shown as "needs a local check", never as passed; most filters are in that state.
- Labels on every figure: [V] verified in a primary source, [P] press, [S] declared assumption.
- Fixed notice on every sheet: this tool supports, never replaces, the judgment of farmers and local experts.

PLAIN-LANGUAGE GLOSSARY
- Millar: a thousand cubic meters of water per hectare, the unit used in the district.
- Water term: how many years a crop ties up water: one season for annual crops, several years for alfalfa, a long horizon for orchards.
- ET (evapotranspiration): the water the crop transpires plus what evaporates from the soil; the water actually consumed.
- NDVI ("greenness"): a satellite index of how green a field is, read from NASA HLS images.
- Bare soil: days with almost no green cover; bare soil in the windy season can blow away.
- Frost risk: chance of a freezing night in the planting window, from NASA POWER temperatures.
- Water balance: every cubic meter that leaves the dam ends up as crop consumption, aquifer recharge or other losses.
- Consumption cap: a rule that drip irrigation may not raise the crop's water consumption above its historical level.
- Crop roles in a rotation (general agronomy, not measured in these fields): a nitrogen-fixing legume such as alfalfa adds nitrogen to the soil; a deep-rooting crop such as alfalfa explores water and nutrients below annual crops; a winter cereal or standing stubble covers the soil in the windy season and reduces erosion; a drought-tolerant crop such as sorghum asks less of the allocation in a short year.

COMMON ANALYSIS GRID
The field is the unit of analysis. Each source is brought to it, or to its pilot area, without creating detail the data do not have:
- HLS (30 m): for each month, the median of the pixels whose centers fall inside the field.
- NASADEM (30 m): an area-scale relief layer and three context indicators per field (fitted slope, the largest single inflow from outside the field as a minimum, and the share of the field in closed pits of the elevation model, mostly within its noise); never field drainage design.
- NASA POWER: one grid cell per pilot area (MERRA-2, 0.5° × 0.625°); every field of an area shares its daily climate and its crop water depths.
- GPM IMERG: daily rain averaged over each pilot area.
- SoilGrids 2.0 (250 m): the mean of the cells whose centers fall inside the field. GEDI: the shots whose cells fall inside the field.
- Regional series: averages over each area rectangle; GRACE/GRACE-FO is one series for the whole basin.

SCALABILITY
The method uses open global data (HLS, NASA POWER, NASADEM, GPM IMERG and Fields of The World boundaries) and keeps every district constant, with its source and label, in one parameters file. One command rebuilds the whole site from the validated data and runs every check. It has not been tried in another district: there, the field efficiencies, the water terms and the allocations would have to be checked with local technicians.

VALIDATION: FIVE TESTS IN SIGHT
Each criterion was declared before the analysis. Details in README.md and, in English, in docs/en/ (result_H1.md, result_H1b.md, result_H3.md, model_vs_practice.md).
1. Crop map: partial. Phenological rules on HLS classify 458 of 1,239 fields; 781 abstain (63.0 %). Random Forest, spatial validation and accuracy assessment: not run.
2. Back-test 2026 (H1): does not meet its criterion (partial back-test; press-reported truth). At July 14, 2026 the model's median is 904.6 hm³ against 447.65 hm³; the simple baselines were closer (404.5 and 367.2 hm³). The model computes the full crop demand and overestimates the level. A follow-up test of the seasonal shape over the 1999–2024 cycles (H1-b, declared before running; it does not change H1) does not hold either: the model beats the two simple shapes in 6 of 26 years.
3. 2025 natural experiment (H3): not supported. In the analysis declared beforehand (original rectangle, 338 fields), among 184 annual-crop fields the share with an active summer crop was 82.6 % in 2025 against a 2019–2024 median of 84.2 % (−1.6 points; the criterion asked for −25 or more); among 44 pecan orchards the share stayed at 100 %. Post hoc, in the two pilot areas of the page: −16.0 points in Delicias – Saucillo (580 annual-crop fields) and 0.0 in Lázaro Cárdenas (210); still not supported.
4. Figure checker: partial. Golden set passed: 30 of 30 cases correct, 5 of 5 traps caught, 0 of 71 numbers altered. Texts written by an LLM: not run; all texts are templates filled from the data.
5. Regional ET contrast and automated checks: partial. On the original rectangle, modeled crop ET of 1,139.5 mm against SSEBop VIIRS v6 of 746.3 mm over October 2025 to September 2026 (+53 %), as a regional comparison, not a field-level validation. Post hoc, in the two pilot areas of the page: 837 against 652 mm in Delicias – Saucillo (+28 %) and 590 against 574 mm in Lázaro Cárdenas (+3 %); the gap narrows because fallow fields weigh more there, not because the model fits better. WaPOR v3: not run. FAO-56 worked examples: passed for the reference ET (Examples 8 and 18 of the manual); crop coefficients and net depth are not covered by that test. Water balance of the drop: passed.

LIMITATIONS
ROOT does not allocate, sell or trade water: under article 22 of Mexico's National Water Law, allocations are decided by Conagua and the irrigation modules. It does not forecast the dam. It does not promise that any water will be freed: "Follow the drop" counts consumption, and drip irrigation can reduce dam withdrawals and aquifer recharge at the same time. The twin has no field sensors and no real-time data. 63 % of the fields are not classified and have no options. Field boundaries are estimated by a model outside its training domain. The field-efficiency range is an assumption. The model computes the full crop requirement: it is higher than the depths recommended by INIFAP and those applied in the district for alfalfa, pecan, cotton and forage maize; for chile it is above INIFAP's recommendation (14.26 against 9.2 thousand m³/ha) and below the depth applied in the district (16.1). For alfalfa, it is 28.4 thousand m³/ha against INIFAP's 17.5. The gap does not come from the efficiency alone: the model's crop ET is also above the district estimate. The drip scenario uses indicative FAO efficiencies that were not measured in the district. Soil values come from SoilGrids 2.0, a global model, not from samples; the soil type and the nutrient notes on the sheet are readings of global maps and published rules, and no soil nutrient, iron included, was measured in these fields. GRACE/GRACE-FO is one series for the whole basin, built on 3° mascons, far larger than a field. ECOSTRESS sees few clear days per month. Most rotation filters need a local check. The tool highlights options by the priority the farmer picks and does not rank them: no weights, no score and no "best" option. The Money row has no verified data. The full list is in LIMITATIONS.md.

WHAT COMES NEXT
Ask a district technician which on-farm efficiency is realistic for gravity irrigation and under which conditions the INIFAP depths apply; classify the remaining fields with the team's blind labels and assess the accuracy of the crop map; review fields and options with farmers of the two pilot areas.

This tool supports, never replaces, the judgment of farmers and local experts.
```

**Por qué el bloque de arriba ya no trae variantes.** La vista 3D, la línea de tiempo, la tarjeta «Twin status», la app instalable y el contexto regional están en la página (`web/app.js`, líneas de importación de `gemelo3d.js`, `tiempo.js`, `estado_gemelo.js`, `instalar.js` y `contexto.js`), y el goteo también. Si el domingo alguna pieza falla en la sede, quite su frase del punto 1 o 2 de «WHAT ROOT DOES»; no agregue otra.

**Palabra «preregistered».** No hay liga de OSF en el repo, así que estos textos dicen «declared before the analysis». Dónde se fijó cada criterio: S9 §6 (fechado el 10-nov; en el repo desde el commit `fa49050`, 12-nov) y el Anexo B para H3; `docs/h1_especificacion_operativa.md` para los puntos abiertos de H1 (commit `b9baced`, 14-nov a las 14:11, antes de correr el modelo); `docs/h1b_especificacion.md` para H1-b (commit `695caf8`, 14-nov a las 16:20). La página dice lo mismo: titula las pruebas «Back-test 2026 (H1, criterion declared before the analysis)» y «Natural experiment of 2025 (H3, criterion declared before the analysis)» (`web/data/pruebas.json`). Si el jurado pregunta por el preregistro, la respuesta está en `docs/pitch/preguntas_dificiles.md` («¿Dónde está el preregistro?»).

**Lámina de alfalfa.** «LIMITATIONS» dice que la diferencia no viene solo de la eficiencia (`docs/modelo_vs_practica.md` §2, punto 3). Es lo mismo que dicen ahora `README.md` («Open question») y `LIMITATIONS.md` («Water demand»).

## 6. NASA Data

```text
In use (the page or a published test reads it):
- HLS v2, Harmonized Landsat Sentinel-2: HLSL30 v002 and HLSS30 v002. 30 m. Monthly composites for the agricultural years 2016–2026. Accessed through Google Earth Engine (NASA/HLS/HLSL30/v002, NASA/HLS/HLSS30/v002). Used for: monthly NDVI per field, which gives the field memory, the 2026 crop map (phenological rules), bare-soil days and test H3.
- NASA POWER, Daily API, community AG. One MERRA-2 grid cell of 0.5° × 0.625° per pilot area. 1984-01-01 to 2026-11-09. Accessed through the POWER Daily API. Used for: daily maximum and minimum temperature, rain, wind, solar radiation and relative humidity, which give the FAO-56 reference ET and each crop's water need; daily minimum temperature (T2M_MIN, 1984–2025) for frost dates and the frost probability by planting date; climatology of test H1.
- NASADEM, NASADEM_HGT v001. 30 m, each pilot area plus 2 km. Accessed through Google Earth Engine (NASA/NASADEM_HGT/001). Used for: elevation, which gives the slope, the runoff routes and "Simulate a storm" at area scale, three context indicators per field and the relief of the 3D view.
- GPM IMERG V07. Half-hourly values averaged per day and over each pilot area. 2001-01-01 to 2026-11-13. Accessed through Google Earth Engine (NASA/GPM_L3/IMERG_V07). Used for: daily rain per area and the reference storm of "Simulate a storm" (95th percentile of the days with 1 mm or more).
- VIIRS, through SSEBop VIIRS v6 monthly, a USGS product. 1 km. October 2025 to September 2026. Accessed through the Earth Engine community catalog (projects/usgs-ssebop/viirs_et_v6_monthly). Used for: actual ET as a regional contrast of the modeled ET (test 5), never per field.
- SMAP L4 v8 (SPL4SMGP, version 8). 9 km. 2015-04 to 2026-10. Accessed through Google Earth Engine (NASA/SMAP/SPL4SMGP/008). Used for: monthly surface and root-zone soil moisture per area, in the regional context panel.
- MODIS collection 6.1: MOD13Q1 (NDVI, 250 m, 2000-02 to 2026-10), MOD16A2GF (ET, 500 m, 2000-01 to 2025-12) and MOD11A2 (daytime land surface temperature, 1 km, 2000-02 to 2026-10). Accessed through Google Earth Engine. Used for: the area's greenness before the HLS record, a second ET series and surface temperature, in the regional context panel.
- GRACE / GRACE-FO, JPL mascons with CRI (NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI). A 0.5° grid built on 3° mascons; one series for the whole basin. 2002-04 to 2024-10. Accessed through Google Earth Engine. Used for: the anomaly of the water stored in the basin (surface, soil and aquifer together), as regional context, never as a value of a field.
- GLDAS-2.1 Noah (NASA/GLDAS/V021/NOAH/G025/T3H). 27,830 m. 2000-01 to 2026-09. Accessed through Google Earth Engine. Used for: ET and root-zone soil moisture from a land surface model, as regional context.
- NLDAS-2 forcing (NASA/NLDAS/FORA0125_H002). 13,915 m. 2000-01 to 2026-10. Accessed through Google Earth Engine. Used for: a second source of rain and potential evaporation, as regional context.
- GEDI L2A v2, monthly raster (LARSE/GEDI/GEDI02_A_002_MONTHLY). Rasterized at 25 m; shots from 2019-04 to 2025-04, filtered by quality and sensitivity. Accessed through Google Earth Engine. Used for: canopy height (rh98) per field, to tell an orchard from a low crop; 1,072 of 1,239 fields have at least one shot.
- ECOSTRESS ECO_L3T_JET.002 (collection 2). 70 m. October 1, 2025 to September 30, 2026. Accessed through AppEEARS, version 3.137 (LP DAAC), one sample point per field. Used for: daily ET on clear days per field (monthly median of the clear overpasses, leaving out passes near sunrise or sunset and scenes with the area under cloud), shown in the field sheet as a satellite estimate, not a field measurement and not a validation of the model; some months have no clear scene.

Challenge resources that do not cover Mexico: OpenET does not cover Mexico, so the ET contrast uses SSEBop on VIIRS. USDA, NRCS, CDL, NAIP, NLCD, PRISM, NWIS, CoCoRaHS, AMS, NASS and LANDFIRE cover the United States; the local equivalents are SIAP (crop statistics), SIH/Conagua (dams) and SDR Chihuahua.
```

Nota: las resoluciones de las series regionales son las de `data/processed/contexto_regional.csv` (`resolucion_m`), como en `README.md` («NASA Data»). La fila de ECOSTRESS sale de `docs/ecostress.md` y de `web/data/contexto.json` → `ecostress`.

## 7. Space Agency Partner Data

```text
- Copernicus Sentinel-2 (ESA), through the NASA HLS v2 product (HLSS30), which harmonizes it with Landsat. It is part of the monthly greenness of every field.
- ERA5-Land (ECMWF/ERA5_LAND/DAILY_AGGR; ECMWF and the Copernicus Climate Change Service), listed by the challenge under Space Agency Partner Resources ("ERA5: ECMWF Reanalysis"). Monthly mean of the daily minimum temperature and frost days, about 11 km, 2000-01 to 2026-10, in the regional context panel. It is a reanalysis, not a NASA product.
```

Nota: la Agencia Espacial Mexicana no es Space Agency Partner en 2026 y no se nombra aquí. ERA5 va aquí porque la pestaña «Resources» del reto lo lista bajo «SPACE AGENCY PARTNER RESOURCES», junto a Sentinel-2 (leída en el navegador el 14-nov-2026, 23:20); el texto aclara que es de ECMWF y no de la NASA.

## 8. Other data

```text
- Fields of The World 2025 global field-boundary predictions (Source Cooperative, CC-BY-4.0): field polygons and a confidence layer. Field boundaries are neural-network predictions outside the model's training domain, filtered by confidence.
- ISRIC SoilGrids 2.0 (250 m, 0–30 cm; CC-BY 4.0): texture, pH, organic carbon and cation exchange capacity per field. It is a global model, not a soil sample.
- OpenLandMap (CC-BY-SA 4.0): the USDA soil great group of each field, shown as its soil type (a prediction of a global model, not a soil survey), and a texture class used to report how often it agrees with SoilGrids'.
- Nutrient rules for the "Nutrient notes" of the field sheet: NOM-021-SEMARNAT-2000, Montana State University Extension, NMSU guides and the Illinois Agronomy Handbook, with local evidence from Gutiérrez González et al. (2022). A risk by rule, not a diagnosis.
- FAO ECOCROP: published pH and texture ranges by crop, for the suitability reading of the Soil row; FAO Irrigation and Drainage Paper 29, Table 4, for salinity thresholds.
- FAO Irrigation Water Management Training Manual No. 4, Annex I, Table 8: indicative field application efficiencies of the drip scenario.
- GAEZ v4 (FAO and IIASA; CC BY-NC-SA; cells of about 9 km): agro-climatic suitability of each pilot area by crop, in the regional context panel; never a value of a field.
- Conagua: technical report of aquifer 0831 (return-flow coefficients), agricultural statistics of DR-005, and the SIH daily series of La Boquilla dam, used as the truth of the H1 back-test.
- INIFAP crop water depths, FIRA alfalfa stand life and IMTA canal conveyance efficiency, as cited in the project documents; depths applied in DR-005 from Villalobos-Cano et al. (2024), shown as a local reference.
- WaPOR v3 (FAO): second regional ET contrast, not run.
- OpenStreetMap base map: © OpenStreetMap contributors (ODbL), https://www.openstreetmap.org/copyright.
Licenses and terms of use of every source are listed in DATA_LICENSE.md.
```

## 9. Use of Super Intelligence (SI)

**Nota interna:** la guía 2026 llama así al campo: «Use of Super Intelligence (SI)», con la pregunta «Did you utilize any Super Intelligence (SI) tools and software in preparing your solution? If yes, how did you use them?». **Confirme el texto exacto en el formulario.** El bloque describe solo lo que registra `AI_USAGE.md`; los componentes estadísticos de la herramienta salen de `README.md` y de los datos. No lleva marcadores: lo que falta confirmar está en «Antes de pegar (Cristian)», puntos 6 a 8.

```text
Yes. We used SI tools where their work can be checked, and we say where they are not used.

Where and how we used them
- Project documents before the event (November 10 to 13): a team member used Claude, in a project chat, to write the pre-event documents, without code: the project definition, the approach, the event plan, the build kit and the proposal. The team reviewed them.
- Code, tests and reviews: Claude Code wrote the integration code (data engine, contract validator, web page, tests and the build-and-publish workflow) from our specifications and the data contract. It worked with implementer agents and independent reviewer agents with fresh context; reviewers report findings and do not edit. Changes reach the main branch through pull requests, merged at the request of the team's integrator.
- Data scripts and Earth Engine runs: a separate Claude session in the browser wrote and ran the Google Earth Engine extractions (HLS, NASADEM, GPM IMERG, SSEBop, the regional context series and GEDI), the Fields of The World extraction, the NASA POWER and FAO-56 scripts, the frost dates, the rules crop map and the H1, H3 and ET analyses. Its work was reviewed by independent agents and checked by the mailbox validator, with a checksum for each delivered file.
- Dashboard (home page): a teammate wrote its initial version with OpenAI Codex: the page, its advisor and crop-comparison modules, and the back-test of the historical rainfall range with its verifier. Three independent reviewer agents read it, and Claude Code then corrected it: four languages, the source of every figure, and wording that describes instead of instructing.
- Notebooks: the team's guides assign Gemini in Google Colab, or Claude in the browser, to scoped notebooks and data-verification cells; each teammate logs that use in AI_USAGE.md.
- Writing: Claude Code drafted the page texts, the pitch scripts and these submission texts in English, and translated into English the project documents that the page links. The team reviews them before submission.
- Video and slides: Claude Code wrote the script that drives the real app and records its screen, and the template of the backup slides. No image or footage was generated with SI.

Machine-learning and statistical components of the tool
- Field boundaries: the Fields of The World neural network (third-party global predictions), filtered by its confidence.
- Crop map 2026: phenological rules on HLS greenness with declared thresholds; no machine learning in the current map. A Random Forest classifier is planned and marked "not run".
- Water need: FAO-56 with a Monte Carlo of 2,000 runs, which gives each depth its P10–P50–P90 band.
- Field memory: rules on monthly greenness, no machine learning.

Where SI is not used
- No LLM writes a figure on the page. Every number is read from the data files; the explanations are templates with placeholders. A figure checker runs on every build and passed its golden set (30 of 30 cases, 0 numbers altered); an automated test stops publication if a hand-written figure appears in the page code.
- The dam volume is not forecast, and the planting decision is not made by the tool.
Every code and document file carries an "AI-assisted" header, and AI_USAGE.md (in Spanish) logs each task. SI never generates the numbers or makes the decision; farmers and technicians decide.
```

## 10. References

```text
Articles, reports and manuals
- Allen et al. (1998). Crop evapotranspiration — Guidelines for computing crop water requirements. FAO Irrigation and Drainage Paper 56.
- Brouwer, Prins and Heibloem (1989). Irrigation Water Management Training Manual No. 4, "Irrigation Scheduling". FAO. Annex I, Table 8. https://www.fao.org/3/t7202e/t7202e08.htm
- FAO Irrigation and Drainage Paper 29 (water quality), Table 4: salinity thresholds.
- Conagua (2024). Actualización de la disponibilidad media anual de agua en el acuífero Meoqui-Delicias (0831), technical report DR_0831. https://sigagis.conagua.gob.mx/gas1/Edos_Acuiferos_18/chihuahua/DR_0831.pdf
- Conagua: agricultural statistics of DR-005; Sistema de Información Hidrológica (SIH), daily series of La Boquilla, downloaded Nov 14, 2026. Terms of use to be confirmed.
- INIFAP: crop water depths (Agenda Técnica Agrícola de Chihuahua 2017; Folleto Técnico 53). FIRA AGROCOSTOS 2025: alfalfa stand life. IMTA, COMEII 2021: canal conveyance efficiency. Cited figures; terms to be confirmed.
- Villalobos-Cano et al. (2024). Sustainability 16(5): 1851. https://doi.org/10.3390/su16051851
- Grafton et al. (2018), Science: irrigation efficiency and return flows. Mall and Herman (2019): shortage risk from perennial-crop expansion in California. Olofsson et al. (2014): area and accuracy assessment.

Data
- Masek, J., et al. (2021). HLS Operational Land Imager Surface Reflectance and TOA Brightness Daily Global 30m v2.0. NASA EOSDIS LP DAAC. https://doi.org/10.5067/HLS/HLSL30.002
- HLS Sentinel-2 Multi-spectral Instrument Surface Reflectance Daily Global 30m v2.0. NASA EOSDIS LP DAAC. https://doi.org/10.5067/HLS/HLSS30.002
- NASA JPL (2020). NASADEM Merged DEM Global 1 arc second V001. NASA EOSDIS LP DAAC. https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001
- NASA POWER (NASA Langley Research Center), Daily API, community AG. https://power.larc.nasa.gov/api/temporal/daily/point
- NASA GPM IMERG V07, Earth Engine collection NASA/GPM_L3/IMERG_V07.
- Regional context and GEDI, by Earth Engine identifier: NASA/SMAP/SPL4SMGP/008; MODIS/061/MOD13Q1, MOD16A2GF and MOD11A2; NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI; NASA/GLDAS/V021/NOAH/G025/T3H; NASA/NLDAS/FORA0125_H002; LARSE/GEDI/GEDI02_A_002_MONTHLY. NASA Earth science data: free and open; cite the product.
- Hook, S. and Halverson, G. (2024). ECOSTRESS ECO_L3T_JET.002. NASA LP DAAC. https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002
- Senay, G. B., Kagone, S. and Velpuri, N. M. (2020). Operational Global Actual Evapotranspiration using the SSEBop model. U.S. Geological Survey data release. https://doi.org/10.5066/P9OUVUUI (U.S. Public Domain).
- ERA5-Land, ECMWF and Copernicus Climate Change Service (ECMWF/ERA5_LAND/DAILY_AGGR). Terms to be confirmed.
- Fields of The World global predictions, Source Cooperative, source.coop/ftw/global-data. CC-BY-4.0.
- Poggio, L., et al. (2021). SoilGrids 2.0: producing soil information for the globe with quantified spatial uncertainty. SOIL 7, 217–240. https://doi.org/10.5194/soil-7-217-2021 (ISRIC – World Soil Information). CC-BY 4.0.
- Hengl, T. (2018). Soil texture classes (USDA system) for 6 soil depths at 250 m (v02). Zenodo. https://doi.org/10.5281/zenodo.1475451 (OpenLandMap). CC-BY-SA 4.0.
- Hengl and Nauman (2018). Predicted USDA soil great groups at 250 m (v01). Zenodo. https://doi.org/10.5281/zenodo.1476844 (OpenLandMap). CC-BY-SA 4.0.
- Soil catalog and nutrient rules: Driessen et al. (2001), Lecture Notes on the Major Soils of the World, FAO World Soil Resources Reports 94; NOM-021-SEMARNAT-2000; Montana State University Extension, 4449-8 (2017); NMSU guides H-657 and H-658; Illinois Agronomy Handbook, chapter 8; Gutiérrez González et al. (2022), https://doi.org/10.47808/revistabioagro.v10i1.395. Terms to be confirmed.
- FAO ECOCROP, crop sheets by species, ecocrop.apps.fao.org, read Nov 14, 2026. Just cited ranges were transcribed; terms to be confirmed.
- FAO and IIASA, GAEZ v4, http://www.fao.org/gaez/; Fischer et al. (2021), https://doi.org/10.4060/cb4744en. CC BY-NC-SA.
- OpenStreetMap base map tiles: © OpenStreetMap contributors (ODbL), https://www.openstreetmap.org/copyright.
- Copernicus Sentinel-2 true color, in the figure of the featured-field review: contains modified Copernicus Sentinel data 2026.

Tools and libraries
- Google Earth Engine: access platform for HLS, NASADEM, GPM IMERG, SSEBop, the regional context series, GEDI, SoilGrids and OpenLandMap (non-commercial project of the Community tier).
- Used to request the ECOSTRESS point samples: AppEEARS Team. (2026). Application for Extracting and Exploring Analysis Ready Samples (AppEEARS). Ver. 3.137. NASA EOSDIS Land Processes Distributed Active Archive Center (LP DAAC), USGS/Earth Resources Observation and Science (EROS) Center, Sioux Falls, South Dakota, USA. Accessed November 15, 2026. https://appeears.earthdatacloud.nasa.gov
- MapLibre GL JS 5.24.0 (BSD 3-clause), d3 7.9.0 (ISC) and d3-sankey 0.12.3 (BSD 3-clause), copied unchanged from npm and verified by hash; their license files are next to each library.
- pytest 9.1.0 (Python tests) and Playwright with Chromium (browser smoke tests, run locally).

Press (figures labeled as press)
- El Diario de Chihuahua, Oct 28, 2024 and Jul 27, 2026 (allocation marks).
- Impacto Noticias, Nov 9, 2026, with Conagua's daily report (La Boquilla storage).
- El Diario de Delicias, Jan 31, 2025 (groundwater authorized in 2025).
- Local press of December 2025 (hectares planted with wells in 2025).

Challenge
- https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/

Licenses and terms of every source: DATA_LICENSE.md.
```

Notas:
- **Licencias que el repo no registra:** pytest, Playwright (tampoco su versión), FAO ECOCROP, ERA5-Land, Conagua, INIFAP, FIRA, IMTA y la versión exacta de CC BY-NC-SA de GAEZ (4.0 o 3.0 IGO). En el bloque van como «terms to be confirmed» o sin licencia; `DATA_LICENSE.md` las lista en «Open items». No las complete de memoria.
- Las fichas completas de Grafton, Mall y Herman y Olofsson no están en el repo (`README.md`, «References»). Si el formulario las exige completas, complételas antes del envío final con la fuente a la vista.
- Las licencias de MapLibre GL JS, d3 y d3-sankey salen de los archivos de licencia copiados en `web/vendor/` (`DATA_LICENSE.md`, «Libraries and development tools»).

## 11. Lista de envío (kit Q2 y guía 2026)

- [ ] Todo el formulario en inglés; ninguna liga a un documento en español.
- [ ] Nombres de los campos y límites de caracteres confirmados en el formulario real, incluido «Use of Super Intelligence (SI)».
- [ ] Los diez puntos de «Antes de pegar (Cristian)» están resueltos; fuera de los «to be confirmed» de «References», ningún bloque lleva marcadores ni texto en español.
- [ ] Video de 30 segundos o menos con subtítulos en inglés, o diapositivas (máximo 7).
- [ ] Ligas sin inicio de sesión, probadas en incógnito: web, repositorio, video y diapositivas.
- [ ] La sección «NASA Data» enumera cada producto con versión, resolución, periodo, acceso y uso.
- [ ] Ningún logotipo, bandera o identificador de misión de la NASA; la Agencia Espacial Mexicana no aparece como socio.
- [ ] «References» completas: bibliotecas, datos, artículos y prensa, con su licencia o «to be confirmed».
- [ ] Las cinco pruebas con su resultado o con «not run».
- [ ] Revisión de cifras de las 12:30: página, video, póster y ficha impresa coinciden con `cifras.csv` y `manifest.json`.
- [ ] Los 6 integrantes confirmados en la sede de Chihuahua.
- [ ] Captura de pantalla de la confirmación del envío.

## 12. Cifras de estos textos y su origen

| Cifra | Origen |
|---|---|
| −167.12 hm³ al año (acuífero 0831; Conagua 2024); 83.3 % de la recarga | S9 §2; `README.md`, «Summary» |
| 73,002 ha; 8,113 productores; 39,421 de 62,219 ha (63 %) | S9 §2; `README.md`, «Summary» |
| 12,000 a 15,000 ha con pozos; 87.4 hm³ de agua subterránea [P] | S9 §2 y Anexo A |
| 1,239 parcelas; 458 clasificadas; 781 sin clasificar (63.0 %) | `web/data/cubo.json` → `zona.conteos`; `web/data/pruebas.json`, prueba 1 |
| Años agrícolas 2016–2026; resaltado de 2025 | `web/data/gemelo.json` → `tiempo` |
| Banda P10–P50–P90; 2,000 corridas; clima 1991–2025 | S9 §5; `data/processed/rotaciones.json` → `params.corridas`, `params.periodo_clima` |
| Suelo desnudo: NDVI < 0.2 del 1-feb al 30-abr | S9 §5 |
| Heladas: NASA POWER, 1984–2025 | `data/processed/heladas.json` (`fuentes.json`, entrada `heladas.json`) |
| Plazos: 1 año; 3 a 4 años; horizonte de 10 años | S9 §5 |
| Nogal: sin alternativas; 105 huertas | `web/data/cubo.json` → `opciones_catalogo.nogal`, `parcelas.<id>.sin_rotacion`; `web/data/parcelas.geojson`; `docs/decisiones/2026-11-15_nogal_sin_alternativas.md` |
| H1: 904.6, 447.65, 404.5 y 367.2 hm³ | `docs/resultado_H1.md`; `README.md`, prueba 2 |
| H1-b: ciclos de 1999 a 2024; 6 de 26 años | `docs/resultado_H1b.md`; `web/data/pruebas.json` |
| H3, rectángulo original (338 parcelas): 184 parcelas anuales; 82.6 % y 84.2 %; −1.6 puntos; 44 huertas; 100 % | `docs/resultado_H3.md`; `README.md`, prueba 3 |
| H3, post hoc en las dos zonas: −16.0 puntos en Delicias–Saucillo (580 parcelas anuales) y 0.0 en Lázaro Cárdenas (210) | `docs/resultado_H3.md`, tabla «Dos zonas piloto» (en inglés: `docs/en/result_H3.md`) |
| Verificador: 30 de 30; 5 de 5; 0 de 71 | `docs/figuras/llm_eval.csv`; `web/data/pruebas.json`, prueba 4 |
| ET: 1,139.5 mm y 746.3 mm; +53 % | Suma de `data/processed/et_contraste.csv` (buzón v10, con el cereal sembrado el 1-dic [S]); antes 1,139.3 mm y la diferencia no cambia (`docs/resultado_A8.md`; `data/processed/fuentes.json`, entrada `et_contraste.csv`) |
| ET, post hoc en las dos zonas: 837 frente a 652 mm (+28 %) y 590 frente a 574 mm (+3 %) | `docs/resultado_A8.md`, tabla «Dos zonas piloto» |
| Chile: 14.26 del modelo, 9.2 recomendados por el INIFAP y 16.1 aplicados en el distrito (millares/ha) | `docs/modelo_vs_practica.md` §1 (en inglés: `docs/en/model_vs_practice.md`) |
| FAO-56: Ejemplos 8 y 18 | `tests/test_fao56_manual.py`; `web/data/pruebas.json`, prueba 5 |
| Alfalfa: 28.4 frente a 17.5 millares/ha | `data/processed/rotaciones.json`; S9 §5; `README.md`, «Open question» |
| GEDI: 1,072 de 1,239 parcelas | `data/processed/fuentes.json`, entrada `gedi_parcelas.csv` |
| Resoluciones y periodos de la sección 6 | `data/processed/fuentes.json`; `data/processed/contexto_regional.csv` (`resolucion_m`, `mes`); `README.md`, «NASA Data» |
| ECOSTRESS: 70 m; 1-oct-2025 a 30-sep-2026; AppEEARS 3.137 | `docs/ecostress.md`; `data/processed/fuentes.json`, entrada `ecostress_parcelas.csv` |
| Alfalfa de menos de dos años sin corte de verano | `web/data/cubo.json` → `filtros_catalogo.corte_verano_alfalfa_establecida.regla.edad_min_anios`; `meta.notas` |
| GRACE: malla de 0.5° sobre mascons de 3° | `data/processed/fuentes.json`, entrada `contexto_regional.csv` |
| ERA5-Land: unos 11 km | `data/processed/contexto_regional.csv` (`resolucion_m` = 11,132) |
| Goteo y riego superficial (no van en el texto) | `data/processed/supuestos.json` → `ea_goteo`, `ea_superficial_referencia` |
| Versiones de bibliotecas | `web/vendor/VERSIONS.json`; `requirements.txt` |
