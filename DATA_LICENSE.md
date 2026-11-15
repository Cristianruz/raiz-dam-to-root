<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Data licenses / Licencias de datos

The code of this repository is licensed under Apache 2.0 (`LICENSE`). That license does not cover third-party data or libraries: each keeps its own license or terms of use.

How to read this file:

- A license or policy is written here when it is recorded in a document of this repository, named in the last column.
- For NASA Earth science data we state the general policy: the data are free and open, and NASA asks that the product be cited.
- When a term is not recorded in the repository we write **terms to be confirmed** and list the source under *Open items*. We do not guess license terms.
- The sources in use are those of `data/processed/fuentes.json` and of `web/data/manifest.json` → `fuentes_de_origen`.

## Data in use (the page or a published test reads them)

| Source | Holder | Where it is used | License or terms of use | Where this statement is recorded |
|---|---|---|---|---|
| Fields of The World global predictions, 2025 | Fields of The World project; distributed through Source Cooperative (`source.coop/ftw/global-data`) | `data/processed/parcelas_base.geojson`; field polygons in `web/data/parcelas.geojson` | **CC-BY-4.0.** Attribution is required. Attribution line: "Field boundaries: Fields of The World global predictions (CC-BY-4.0), source.coop/ftw/global-data" | `docs/verificacion_fuentes_datos.md`; kit v4, A4 and B1 |
| HLS v2, Harmonized Landsat Sentinel-2 (`NASA/HLS/HLSL30/v002`, `NASA/HLS/HLSS30/v002`) | NASA (LP DAAC); built on Landsat and on Copernicus Sentinel-2 | `hls_mensual_parcelas.csv`, `memoria_parcelas.csv`, `memoria_resumen.csv`, `suelo_desnudo.csv`, `cultivos_parcelas.csv`, `h3_series.csv` | NASA open data. Catalog terms: "NASA promotes the full and open sharing of all data with research and applications communities, private industry, academia, and the general public." Cite the product (README → References) | `docs/equipo/verificar_datos_nasa.md` §2 |
| NASADEM (`NASA/NASADEM_HGT/001`) | NASA (JPL; LP DAAC) | `nasadem_zona_piloto*.tif`, `relieve_parcelas.csv`, `relieve_rutas.geojson`, `relieve_meta*.json`; relief tiles of the 3D view in `web/data/dem/` | Catalog terms: "Unless otherwise noted, all NASA-produced data may be used for any purpose without prior permission." S9 §4 bis labels it public domain. Cite the product | `docs/equipo/verificar_datos_nasa.md` §3; S9 §4 bis |
| NASA POWER, Daily API, community AG | NASA (Langley Research Center) | `eto_diaria*.csv`, `demanda_cultivos*.csv`, `rotaciones*.json`, `heladas.json` (frost probability in the field sheet) | NASA Earth science data: free and open; cite the product. The exact acknowledgment text asked by POWER: **terms to be confirmed** | General NASA policy; `docs/equipo/verificar_datos_nasa.md` §1 records the exact text as not verified |
| GPM IMERG V07 (`NASA/GPM_L3/IMERG_V07`) | NASA, with JAXA | `imerg_diaria*.csv`; storm depth in `relieve_meta*.json` and `web/data/relieve.json` | NASA Earth science data: free and open; cite the product. Specific terms and formal citation: **terms to be confirmed** | General NASA policy; no specific statement recorded in the repo |
| SSEBop VIIRS v6 monthly (`projects/usgs-ssebop/viirs_et_v6_monthly`) | U.S. Geological Survey (USGS), on VIIRS data | `et_contraste.csv` (test 5) | "USGS-authored or produced data and information are considered to be in the U.S. Public Domain." Cite Senay, Kagone and Velpuri (2020). It was read through the Earth Engine community catalog, which the community maintains, not USGS | `docs/equipo/verificar_datos_nasa.md` §5; `docs/resultado_A8.md` |
| SIH daily series: La Boquilla dam (`LBQCH.csv`, downloaded Nov 14, 2026) and the station Las Vírgenes, Chih. (`FIMCH.csv`) | Conagua (Comisión Nacional del Agua), Sistema de Información Hidrológica | Truth of the H1 back-test: `docs/h1_verdad_sih.md`, `docs/resultado_H1.md`. Both raw files are redistributed here, unchanged, in `data/raw/sih/` | **Terms to be confirmed.** Cited as "Conagua, Sistema de Información Hidrológica (SIH), serie diaria de La Boquilla (LBQCH.csv)" with its download date | `docs/equipo/verificar_datos_nasa.md` §8 records the license as not verified |
| Conagua publications: technical report of aquifer 0831 (DR_0831, 2024); agricultural statistics by crop and irrigated areas and volumes, 1998–2025 | Conagua | Cited figures in `data/params.json`, `web/data/cubo.json` and `docs/resultado_H1.md`; crop pattern and irrigated area of H1 and H1-b (`docs/h1_especificacion_operativa.md`). Two Conagua spreadsheets are redistributed here, unchanged, in `data/raw/conagua/` (`ESTADISTICA_AGRICOLA_POR_CULTIVO_1998-2025.xlsx`, `SUPERFICIES_REGADAS_Y_VOLUMENES_1998-2025.xlsx`), with two CSV extracts for DR-005 made from them (`dr005_cultivos_1998_2025.csv`, `dr005_superficies_volumenes_1998_2025.csv`). The aquifer report is cited, not redistributed | **Terms to be confirmed.** Each figure is cited with its source | `data/params.json`; S9 §2 |
| Copernicus Sentinel-2 L2A, true color (`COPERNICUS/S2_SR_HARMONIZED`, read in Earth Engine; three scenes of 2026, tile T13RDM) | European Union, Copernicus programme (ESA) | The figure `docs/figuras/protagonistas_sentinel2_2026.jpg`, shown in `docs/revision_protagonistas.md` and in `docs/en/story_fields_review.md`. Not used by the page | Notice carried next to the figure: "Contains modified Copernicus Sentinel data 2026". Full license text: **terms to be confirmed** |
| OpenStreetMap base map tiles | OpenStreetMap contributors | Base map of the page (`web/app.js`) | Open Database License (ODbL). Attribution: "© OpenStreetMap contributors (ODbL), https://www.openstreetmap.org/copyright"; the map shows "© OpenStreetMap contributors" as text, without the link. Tile usage terms: **terms to be confirmed** | `web/app.js` (map attribution) |

## Reference sources (cited figures; no data file enters the tool)

| Source | Holder | How it is used | License or terms of use | Where this statement is recorded |
|---|---|---|---|---|
| SIAP crop statistics, read through the state reports of SDR Chihuahua | SIAP (Servicio de Información Agroalimentaria y Pesquera); Secretaría de Desarrollo Rural of Chihuahua | Reference for a future contrast of crop areas. No SIAP figure enters the tool: the figures read so far still have to be checked against the original PDF | **Terms to be confirmed** | `docs/referencias/ref_cultivos_sdr.md` |
| INIFAP crop water depths; FIRA AGROCOSTOS 2025; IMTA, COMEII 2021 | INIFAP; FIRA; IMTA | Cited figures with labels [V] or [P] (`data/params.json`, S9 §5) | Citations of published figures. **Terms to be confirmed** | `data/params.json`; S9 |
| Villalobos-Cano et al. (2024), *Sustainability* 16(5): 1851, Tables 2 and 3 | The authors (journal *Sustainability*) | Depths applied in DR-005, 2009–2016 means, shown as the local reference of alfalfa and pecan (`web/data/cubo.json` → `agua.lamina_local`; `data/processed/supuestos.json`) | Citations of published figures. **Terms to be confirmed** | `cubo.json` → `agua.lamina_local.fuente`; `docs/modelo_vs_practica.md` |
| Press figures (allocations, dam storage, the 2025 cycle) | Each outlet named in README → References | Cited figures labeled [P] | Short citations with outlet and date | S8 §2; S9 §2 and Annex A |

## Delivered on Nov 14, 2026; now on the page

These files are validated in `data/processed/` (`data/processed/fuentes.json`); ECOSTRESS and GAEZ arrived with mailbox v10. The page shows them in the regional context panel (`web/data/contexto.json`), in the field sheet ("Soil and satellite evidence" and the Soil row, `web/data/suelo.json`) and in "Follow the drop" (`web/data/cubo.json` → `meta.goteo`).

| Source | Holder | File and where the page shows it | License or terms of use |
|---|---|---|---|
| SMAP L4 v8 (`NASA/SMAP/SPL4SMGP/008`) | NASA | `contexto_regional.csv`; Regional context | NASA Earth science data: free and open; cite the product. Formal citation: **terms to be confirmed** |
| MODIS collection 6.1 (`MOD13Q1`, `MOD16A2GF`, `MOD11A2`) | NASA | `contexto_regional.csv`; Regional context | Same as above |
| GRACE / GRACE-FO mascons (`NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI`) | NASA, with the German centers DLR and GFZ | `contexto_regional.csv`; Regional context | Same as above |
| GLDAS-2.1 Noah (`NASA/GLDAS/V021/NOAH/G025/T3H`) | NASA | `contexto_regional.csv`; Regional context | Same as above |
| NLDAS-2 forcing (`NASA/NLDAS/FORA0125_H002`) | NASA and NOAA | `contexto_regional.csv`; Regional context | Same as above |
| GEDI L2A v2 (`LARSE/GEDI/GEDI02_A_002_MONTHLY`) | NASA | `gedi_parcelas.csv`; field sheet | Same as above |
| ERA5-Land (`ECMWF/ERA5_LAND/DAILY_AGGR`) | ECMWF, Copernicus Climate Change Service. Not a NASA product | `contexto_regional.csv`; Regional context | **Terms to be confirmed** |
| SoilGrids 2.0 (`projects/soilgrids-isric/*_mean`, 0–30 cm) | ISRIC – World Soil Information | `suelo_parcelas.csv` (texture, pH, organic carbon, CEC); field sheet | CC-BY 4.0, as recorded by the data session in `docs/suelo_parcelas.md` and `datos/LEEME.md`; cite Poggio et al. (2021) |
| OpenLandMap soil texture class (Hengl 2018, v02, https://doi.org/10.5281/zenodo.1475451) | OpenLandMap (OpenGeoHub) | Column `clase_textura_olm` of `suelo_parcelas.csv`, used to report how often the two maps agree (`suelo.json` → `coincidencia_textura`) | **CC-BY-SA 4.0**: this column and anything derived from it must be shared under the same license (`docs/suelo_parcelas.md`) |
| FAO ECOCROP crop requirements, read online sheet by sheet | FAO | Published pH and texture ranges in `suelo_requisitos.json`, each with its citation and link; suitability in the Soil row | **Terms to be confirmed**: just cited ranges were transcribed, not the database (`docs/suelo_parcelas.md`) |
| FAO Irrigation and Drainage Paper 29 (water quality), Table 4 | FAO | Salinity thresholds in `suelo_requisitos.json` and in the salinity filter, each cited | Cited figures |
| FAO Irrigation Water Management Training Manual No. 4 (Brouwer, Prins and Heibloem 1989), Annex I, Table 8 | FAO | Indicative drip and surface field efficiencies in `supuestos.json`; drip scenario of "Follow the drop" | Cited figures |
| ECOSTRESS (`ECO_L3T_JET.002`, through AppEEARS) | NASA (LP DAAC) | `ecostress_parcelas.csv` (mailbox v10, merged with pull request #4); field sheet, "Soil and satellite evidence" | NASA Earth science data: free and open; cite the product: Hook, S. and Halverson, G. (2024), https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002 (`data/processed/fuentes.json`, entry `ecostress_parcelas.csv`). Requested through AppEEARS, version 3.137 (`docs/ecostress.md`); the software citation that AppEEARS asks for is not recorded in this repository: **to be confirmed** |
| GAEZ v4, theme res05 «Suitability and Attainable Yield» | FAO and IIASA | `gaez_zona.csv` (mailbox v10, merged with pull request #4); Regional context, "Agro-climatic suitability by crop" | **CC BY-NC-SA**, as recorded in `data/processed/fuentes.json` (entry `gaez_zona.csv`); the data script adds "version 4.0 or 3.0 IGO, according to the FAO catalog record" (`datos/colab/G1_gaez_zona.py`). NonCommercial and ShareAlike: GAEZ values and what derives from them cannot be used commercially and are shared under the same license; the Apache-2.0 license of the code does not cover them. Cite "FAO and IIASA, GAEZ v4, http://www.fao.org/gaez/" and the model, Fischer et al. (2021), https://doi.org/10.4060/cb4744en |

Holders as listed in `data/recursos_reto.json`. ECOSTRESS was read through AppEEARS, with an Earthdata account, and GAEZ through FAO's GAEZ v4 image service (`data/processed/fuentes.json`, entries `ecostress_parcelas.csv` and `gaez_zona.csv`).

## Soil type and nutrient notes (shown in the field sheet)

These four soil files (`data/processed/fuentes.json`) feed the "Soil type" line and the "Nutrient notes" of the field sheet, under "Soil and satellite evidence" (`motor/suelo_web.py`; `web/data/suelo.json` → `tipo_suelo`, `nutrientes`). How they were made: `docs/suelo_tipos_y_nutrientes.md`.

| File | Source and holder | License or terms of use |
|---|---|---|
| `tipo_suelo_parcelas.csv` (USDA great group per field) | OpenLandMap, *Predicted USDA soil great groups at 250 m* (Hengl and Nauman 2018, v01, https://doi.org/10.5281/zenodo.1476844), read in Earth Engine (`OpenLandMap/SOL/SOL_GRTGROUP_USDA-SOILTAX_C/v01`). A prediction of a global model, not a soil survey | **CC-BY-SA 4.0**, as recorded in `fuentes.json`: the file and what derives from it are shared under the same license |
| `suelo_tipos.json` (catalog of WRB groups and USDA orders; soils of the municipality of Delicias) | Driessen et al. (2001), *Lecture Notes on the Major Soils of the World*, FAO World Soil Resources Reports 94; Moorberg and Crouse (2017); SSSA, *Glossary of Soil Science Terms*, Table A2; University of Idaho and Lancaster University [P]; Plan Municipal de Desarrollo 2024–2027 of Delicias, which cites INEGI 2016. Summaries written by the data session, each block with its link | Summaries and citations of published texts. **Terms to be confirmed** for each source |
| `suelo_reglas.json` (rules that relate pH, organic matter, CEC, carbonates and salinity to nutrient availability) | NOM-021-SEMARNAT-2000; Montana State University Extension (4449-8, March 2017); NMSU guides H-657 and H-658; Illinois Agronomy Handbook, chapter 8; Gutiérrez González et al. (2022) | Cited rules and thresholds. **Terms to be confirmed** for each source |
| `suelo_nutrientes_parcelas.csv` (those rules applied to each field: a risk by rule, not a diagnosis) | Derived by the data session from `suelo_parcelas.csv` (ISRIC SoilGrids 2.0) with `suelo_reglas.json` | SoilGrids 2.0 is CC-BY 4.0 (cite Poggio et al. 2021); the rules keep the terms of their sources |

## Raw files redistributed in `data/raw/`

`data/raw/` holds 61 files (`git ls-files data/raw`, without `.gitkeep`): the unchanged inputs of the data scripts. Each keeps the license of its source. How each was obtained is in `docs/reproducir_datos.md`.

| Folder and files | Source | License or terms of use |
|---|---|---|
| `data/raw/ee/` (13 GeoTIFF: `hls_mensual_2025_10_a_2026_09.tif`, `hls_ndvi_memoria_2016.tif` to `…_2026.tif`, `nasadem_zona_piloto.tif`) | Earth Engine exports of HLS v2 and NASADEM | NASA open data, as in the table of data in use; cite the product |
| `data/raw/power/` (3 JSON) and `data/raw/zonas/power_crudo_lazaro_cardenas_*.json` (3) | Responses of the NASA POWER Daily API | NASA open data; exact acknowledgment text: **terms to be confirmed** |
| `data/raw/imerg/` (3 CSV) | GPM IMERG V07, daily values per area from Earth Engine | NASA open data; formal citation: **terms to be confirmed** |
| `data/raw/ssebop/` (3 CSV) | SSEBop VIIRS v6 monthly (USGS), means per rectangle from Earth Engine | U.S. Public Domain; cite Senay, Kagone and Velpuri (2020) |
| `data/raw/ftw/ftw_zona_piloto_crudo.geojson` and `data/raw/zonas/ftw_crudo_*.geojson` (3 files) | Fields of The World global predictions | **CC-BY-4.0**; attribution line as in the table of data in use |
| `data/raw/reto/ctx_*.csv` (16 CSV) | Regional series from Earth Engine: SMAP, MODIS, GRACE/GRACE-FO, GLDAS and NLDAS (NASA); ERA5-Land (ECMWF, Copernicus) | NASA open data; ERA5-Land: **terms to be confirmed** |
| `data/raw/reto/gedi_disparos_*.csv` (2 CSV) | GEDI L2A v2 shots from Earth Engine | NASA open data; formal citation: **terms to be confirmed** |
| `data/raw/reto/suelo_soilgrids_*.csv` (2 CSV) | ISRIC SoilGrids 2.0 cells, with OpenLandMap texture columns (`olm_tex_0`, `olm_tex_10`, `olm_tex_30`) | SoilGrids: CC-BY 4.0. The `olm_tex_*` columns are OpenLandMap data: **CC-BY-SA 4.0**, shared under the same license |
| `data/raw/reto/suelo_clases_*.csv` (2 CSV) | OpenLandMap, predicted USDA soil great groups at 250 m (Hengl and Nauman 2018, v01, https://doi.org/10.5281/zenodo.1476844), cells read in Earth Engine (`datos/earthengine/suelo.js`) | **CC-BY-SA 4.0**, as recorded in `data/processed/fuentes.json` (entry `tipo_suelo_parcelas.csv`): shared under the same license |
| `data/raw/reto/ecostress_pasos_*.csv` (2 CSV) and `data/raw/reto/ecostress_solicitud_*.json` (2 JSON) | ECOSTRESS `ECO_L3T_JET.002` point samples, the output of AppEEARS (version 3.137) kept unchanged, and the two request files that produced it (`docs/ecostress.md`) | NASA Earth science data: free and open; cite Hook, S. and Halverson, G. (2024), https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002. AppEEARS software citation: **to be confirmed**. The request files are the team's own |
| `data/raw/reto/gaez_celdas.csv` (1 CSV) | GAEZ v4 (FAO and IIASA), theme res05, values read cell by cell from FAO's image service (`datos/navegador/gaez_leer.js`) | **CC BY-NC-SA**, as recorded in `data/processed/fuentes.json` (entry `gaez_zona.csv`): NonCommercial and ShareAlike |
| `data/raw/sih/` (`LBQCH.csv`, `FIMCH.csv`) | Conagua, Sistema de Información Hidrológica | **Terms to be confirmed** |
| `data/raw/conagua/` (2 XLSX and 2 CSV extracts) | Conagua, agricultural statistics by crop and irrigated areas and volumes, 1998–2025 | **Terms to be confirmed** |

The Earth Engine raw files of the two pilot areas (monthly HLS per area, the NDVI memory rasters, GPM IMERG and NASADEM per area: 31 files, about 192 MiB, that is 201 MB, in `data/raw/ee_zonas/`) are on the `ee-crudos` branch of this repository, with the same sources and terms as `data/raw/ee/` and `data/raw/imerg/`; `datos/colab/correr_zonas.py` needs them. `data/raw/ee/` on the main branch holds the original rectangle.

The 37 data scripts in `datos/` (30 in `datos/colab/`, 5 in `datos/earthengine/`, 2 in `datos/navegador/`) are code of this repository, under Apache-2.0. `datos/supuestos.json` holds the data session's assumptions, each with its source or labeled as an assumption.

## Not run or not used

| Source | Holder | Status | License or terms of use |
|---|---|---|---|
| WaPOR v3 | FAO | Not run | CC-BY-4.0, as recorded in kit v4, A8; to be confirmed against FAO's own terms before any use |
| INEGI LiDAR | INEGI | Not used: coverage of the pilot areas not confirmed [NE] | If it is added, its notice goes here: "Fuente: INEGI, nombre del producto", with a transformation notice (S9 §4 bis) |

## Access platform

The HLS, NASADEM, GPM IMERG, SSEBop, regional context, GEDI, SoilGrids and OpenLandMap extractions were run in Google Earth Engine, on a non-commercial project of the Community tier (`docs/ee_uso.md`). Earth Engine is the access route, not the holder of the data.

## Libraries and development tools

| Library or tool | Where it is used | License | Where this statement is recorded |
|---|---|---|---|
| MapLibre GL JS 5.24.0, d3 7.9.0, d3-sankey 0.12.3 | `web/vendor/` | Their own licenses, copied next to each library: a BSD 3-clause text for MapLibre GL JS (`LICENSE.txt`) and for d3-sankey (`LICENSE`), an ISC text for d3 (`LICENSE`) | `web/vendor/VERSIONS.json`; the license files in each folder |
| pytest 9.1.0 | Python tests (`requirements.txt`) | **To be confirmed**: not recorded in this repository | `requirements.txt` |
| Playwright with Chromium | Browser smoke tests, run locally (`tests/e2e/web_smoke.mjs`, `tests/e2e/offline_smoke.mjs`); not a dependency of the page | **To be confirmed**: neither its version nor its license is recorded in this repository | `README.md`, "Automated gate" |
| Skills copied into `.claude/skills/` | Development | Apache-2.0 or MIT, license file next to each skill | `.claude/skills/README.md` |
| Reviewer agents copied into `.claude/agents/` | Development | Apache-2.0 | `.claude/agents/README.md` |

## Open items

Terms that are not recorded in this repository and that a team member has to confirm in the original source:

1. NASA POWER: the exact acknowledgment and citation text.
2. GPM IMERG V07: the formal citation and any product-specific terms.
3. SMAP, MODIS, GRACE/GRACE-FO, GLDAS, NLDAS and GEDI: the formal citation of each product, now that the page shows them.
4. ERA5-Land: the Copernicus license and its attribution text.
5. Conagua: terms of use of the SIH series (`data/raw/sih/`), of the spreadsheets redistributed in `data/raw/conagua/` and of the cited publications.
6. SIAP and SDR Chihuahua: terms of use; and the figures themselves, which still have to be checked against the original PDF.
7. INIFAP, FIRA and IMTA: full bibliographic entries.
8. OpenStreetMap: tile usage terms for the public site; the attribution on the map is text without its link to https://www.openstreetmap.org/copyright.
9. GAEZ: which version of CC BY-NC-SA (4.0 or 3.0 IGO) the FAO catalog record gives for the layers read. WaPOR v3: terms, if it is ever used.
10. FAO ECOCROP: terms of use of the online sheets.
11. Sources of the soil catalog and of the nutrient rules (`suelo_tipos.json`, `suelo_reglas.json`): terms of each text that is summarized.
12. The license of the team's own derived tables in `data/processed/` and `web/data/` is not stated in the repository. The field polygons derive from Fields of The World and carry its attribution.
13. Copernicus Sentinel data: the full license text behind the notice of the Sentinel-2 figure.
14. AppEEARS: the software citation it asks for (the repository records the version, 3.137, and the request identifiers; `docs/ecostress.md`).
