<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
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
| NASADEM (`NASA/NASADEM_HGT/001`) | NASA (JPL; LP DAAC) | `nasadem_zona_piloto*.tif`, `relieve_parcelas.csv`, `relieve_rutas.geojson`, `relieve_meta*.json`; relief tiles in `web/data/dem/` (not on the page yet) | Catalog terms: "Unless otherwise noted, all NASA-produced data may be used for any purpose without prior permission." S9 §4 bis labels it public domain. Cite the product | `docs/equipo/verificar_datos_nasa.md` §3; S9 §4 bis |
| NASA POWER, Daily API, community AG | NASA (Langley Research Center) | `eto_diaria*.csv`, `demanda_cultivos*.csv`, `rotaciones*.json`, `heladas.json` (not on the page yet) | NASA Earth science data: free and open; cite the product. The exact acknowledgment text asked by POWER: **terms to be confirmed** | General NASA policy; `docs/equipo/verificar_datos_nasa.md` §1 records the exact text as not verified |
| GPM IMERG V07 (`NASA/GPM_L3/IMERG_V07`) | NASA, with JAXA | `imerg_diaria*.csv`; storm depth in `relieve_meta*.json` and `web/data/relieve.json` | NASA Earth science data: free and open; cite the product. Specific terms and formal citation: **terms to be confirmed** | General NASA policy; no specific statement recorded in the repo |
| SSEBop VIIRS v6 monthly (`projects/usgs-ssebop/viirs_et_v6_monthly`) | U.S. Geological Survey (USGS), on VIIRS data | `et_contraste.csv` (test 5) | "USGS-authored or produced data and information are considered to be in the U.S. Public Domain." Cite Senay, Kagone and Velpuri (2020). It was read through the Earth Engine community catalog, which the community maintains, not USGS | `docs/equipo/verificar_datos_nasa.md` §5; `docs/resultado_A8.md` |
| SIH, daily series of La Boquilla dam (`LBQCH.csv`, downloaded Nov 14, 2026) | Conagua (Comisión Nacional del Agua), Sistema de Información Hidrológica | Truth of the H1 back-test: `docs/h1_verdad_sih.md`, `docs/resultado_H1.md`. The raw file is not on this branch (`data/raw/` is empty here) | **Terms to be confirmed.** Cited as "Conagua, Sistema de Información Hidrológica (SIH), serie diaria de La Boquilla (LBQCH.csv)" with its download date | `docs/equipo/verificar_datos_nasa.md` §8 records the license as not verified |
| Conagua publications: technical report of aquifer 0831 (DR_0831, 2024); agricultural statistics of DR-005 | Conagua | Cited figures in `data/params.json`, `web/data/cubo.json` and `docs/resultado_H1.md`. No Conagua file is redistributed here | **Terms to be confirmed.** Each figure is cited with its source | `data/params.json`; S9 §2 |
| OpenStreetMap base map tiles | OpenStreetMap contributors | Base map of the page (`web/app.js`) | Attribution shown on the map: "© OpenStreetMap contributors". Tile usage terms: **terms to be confirmed** | `web/app.js` (map attribution) |

## Reference sources (cited figures; no data file enters the tool)

| Source | Holder | How it is used | License or terms of use | Where this statement is recorded |
|---|---|---|---|---|
| SIAP crop statistics, read through the state reports of SDR Chihuahua | SIAP (Servicio de Información Agroalimentaria y Pesquera); Secretaría de Desarrollo Rural of Chihuahua | Reference for a future contrast of crop areas. No SIAP figure enters the tool: the figures read so far still have to be checked against the original PDF | **Terms to be confirmed** | `docs/referencias/ref_cultivos_sdr.md` |
| INIFAP crop water depths; FIRA AGROCOSTOS 2025; IMTA, COMEII 2021 | INIFAP; FIRA; IMTA | Cited figures with labels [V] or [P] (`data/params.json`, S9 §5) | Citations of published figures. **Terms to be confirmed** | `data/params.json`; S9 |
| Press figures (allocations, dam storage, the 2025 cycle) | Each outlet named in README → References | Cited figures labeled [P] | Short citations with outlet and date | S8 §2; S9 §2 and Annex A |

## Delivered on Nov 14, 2026; not on the page yet

These files are validated in `data/processed/` (`data/processed/fuentes.json`). The page does not show them yet.

| Source | Holder | File | License or terms of use |
|---|---|---|---|
| SMAP L4 v8 (`NASA/SMAP/SPL4SMGP/008`) | NASA | `contexto_regional.csv` | NASA Earth science data: free and open; cite the product. Formal citation: **terms to be confirmed** |
| MODIS collection 6.1 (`MOD13Q1`, `MOD16A2GF`, `MOD11A2`) | NASA | `contexto_regional.csv` | Same as above |
| GRACE / GRACE-FO mascons (`NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI`) | NASA, with the German centers DLR and GFZ | `contexto_regional.csv` | Same as above |
| GLDAS-2.1 Noah (`NASA/GLDAS/V021/NOAH/G025/T3H`) | NASA | `contexto_regional.csv` | Same as above |
| NLDAS-2 forcing (`NASA/NLDAS/FORA0125_H002`) | NASA and NOAA | `contexto_regional.csv` | Same as above |
| GEDI L2A v2 (`LARSE/GEDI/GEDI02_A_002_MONTHLY`) | NASA | `gedi_parcelas.csv` | Same as above |
| ERA5-Land (`ECMWF/ERA5_LAND/DAILY_AGGR`) | ECMWF, Copernicus Climate Change Service. Not a NASA product | `contexto_regional.csv` | **Terms to be confirmed** |
| SoilGrids 2.0 (`projects/soilgrids-isric/*_mean`, 0–30 cm) | ISRIC – World Soil Information | `suelo_parcelas.csv` (texture, pH, organic carbon, CEC) | CC-BY 4.0, as recorded by the data session in `docs/suelo_parcelas.md` and `datos/LEEME.md`; cite ISRIC SoilGrids |
| OpenLandMap soil texture class | OpenLandMap (OpenGeoHub) | Column `clase_textura_olm` of `suelo_parcelas.csv`, used to report how often the two maps agree | **CC-BY-SA 4.0**: this column and anything derived from it must be shared under the same license (`docs/suelo_parcelas.md`) |
| FAO ECOCROP crop requirements, read online sheet by sheet | FAO | Published pH and texture ranges in `suelo_requisitos.json`, each with its citation and link | **Terms to be confirmed**: only cited ranges were transcribed, not the database (`docs/suelo_parcelas.md`) |
| FAO Irrigation and Drainage Paper 29 (water quality), Table 4 | FAO | Salinity thresholds in `suelo_requisitos.json`, each cited | Cited figures |
| FAO Irrigation Water Management Training Manual No. 4, Annex I, Table 8 | FAO | Indicative drip and surface field efficiencies in `supuestos.json` (La gota) | Cited figures |

Holders as listed in `data/recursos_reto.json`.

## Requested or not run

| Source | Holder | Status | License or terms of use |
|---|---|---|---|
| ECOSTRESS | NASA | Requested, not delivered yet | NASA Earth science data: free and open; cite the product |
| GAEZ | FAO and IIASA | Requested, not delivered yet | **Terms to be confirmed** |
| WaPOR v3 | FAO | Not run | CC-BY-4.0, as recorded in kit v4, A8; to be confirmed against FAO's own terms before any use |
| INEGI LiDAR | INEGI | Not used: coverage of the pilot areas not confirmed [NE] | If it is added, its notice goes here: "Fuente: INEGI, nombre del producto", with a transformation notice (S9 §4 bis) |

## Access platform

The HLS, NASADEM, GPM IMERG, SSEBop, regional context and GEDI extractions were run in Google Earth Engine, on a non-commercial project of the Community tier (`docs/ee_uso.md`). Earth Engine is the access route, not the holder of the data.

## Libraries and development tools

| Library or tool | Where it is used | License | Where this statement is recorded |
|---|---|---|---|
| MapLibre GL JS 5.24.0, d3 7.9.0, d3-sankey 0.12.3 | `web/vendor/` | Their own licenses, copied next to each library (`LICENSE` or `LICENSE.txt` in each folder) | `web/vendor/VERSIONS.json` |
| Skills copied into `.claude/skills/` | Development | Apache-2.0 or MIT, license file next to each skill | `.claude/skills/README.md` |
| Reviewer agents copied into `.claude/agents/` | Development | Apache-2.0 | `.claude/agents/README.md` |

## Open items

Terms that are not recorded in this repository and that a team member has to confirm in the original source:

1. NASA POWER: the exact acknowledgment and citation text.
2. GPM IMERG V07: the formal citation and any product-specific terms.
3. SMAP, MODIS, GRACE/GRACE-FO, GLDAS, NLDAS and GEDI: the formal citation of each product, before the page shows them.
4. ERA5-Land: the Copernicus license and its attribution text.
5. Conagua: terms of use of the SIH series and of the cited publications.
6. SIAP and SDR Chihuahua: terms of use; and the figures themselves, which still have to be checked against the original PDF.
7. INIFAP, FIRA and IMTA: full bibliographic entries.
8. OpenStreetMap: tile usage terms for the public site.
9. GAEZ and WaPOR v3: terms, if they are ever used.
10. The license of the team's own derived tables in `data/processed/` and `web/data/` is not stated in the repository. The field polygons derive from Fields of The World and carry its attribution.
