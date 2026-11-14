<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Recursos oficiales del reto «Field Shift: Adapting Farms with NASA Data»

Fuente: https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/ (pestañas Details y Resources),
consultada el 14-nov-2026 a las 12:50 (hora de Chihuahua) en el navegador. La página dice que se podrían añadir más recursos.

## El reto (pestaña Details), resumido
- **Encargo:** la página pide «create a decision‑support tool that uses NASA Earth observations» junto con suelo
  local, características de los cultivos y prioridades del agricultor, para explorar estrategias de rotación que
  mejoren la salud del suelo y adapten la parcela a condiciones cambiantes.
- **Objetivos:** combinar observaciones de la NASA con información agrícola local (app, modelo, mapa interactivo u
  otra herramienta). Datos sugeridos: SMAP, ECOSTRESS, GPM, Landsat, MODIS, NASA POWER, GRACE y GRACE‑FO, SRTM u otros
  productos de elevación de la NASA. Puede señalar cuándo las parcelas suelen estar desnudas, temporadas de mayor
  vulnerabilidad y rotaciones que corten ciclos de plagas, reduzcan la demanda de agua, mejoren la infiltración o den
  ingreso extra. Se pueden comparar al menos tres estrategias, incluida la actual, y para cada una explicar por qué se
  sugiere, qué evidencia la sostiene, qué beneficios ofrece, dónde faltan datos y qué riesgos requieren revisión local.
  El resultado es de apoyo: no sustituye el juicio del agricultor ni la experiencia agrícola local.
- **Consideraciones (opcionales), por bloque:**
  1. *Condiciones y datos:* relación de temperatura, humedad del suelo, lluvia, evaporación y estrés de la vegetación
     con la vulnerabilidad; explicar términos (evapotranspiración, anomalías de humedad, NDVI, riesgo de helada,
     balance de agua); diferencia entre satélite y medición en tierra.
  2. *IA, modelos y fusión de datos:* comparar enfoques; resaltar transiciones, periodos de suelo desnudo y estrés;
     explicar la incertidumbre y dónde hace falta validación local; armonizar resoluciones a una malla común.
  3. *Rotaciones:* ciclo de nutrientes, erosión, materia orgánica, plagas, agua, forraje y mercado; alinear con
     prioridades del agricultor; explicar leguminosas, cultivos de cobertura, de raíz profunda y tolerantes a sequía.
  4. *Mapas y visualización:* tendencias en el tiempo, vulnerabilidad por parcela, líneas de tiempo, capas
     comparadas y deslizadores de escenarios.
  5. *Diseño para el agricultor:* fácil de interpretar; que el agricultor capture sus prioridades o restricciones
     (agua, equipo, mercado); recordar que apoya y no reemplaza el juicio local.

*(Texto resumido, no copiado; para la cita textual, abrir la página. Solo la frase entre comillas es literal.)*

## Recursos (pestaña Resources), agrupados como en la página

### NASA Data & Resources
| Recurso | URL |
|---|---|
| Soil Moisture Active Passive (SMAP) | https://www.earthdata.nasa.gov/data/platforms/space-based-platforms/smap |
| Global Precipitation Measurement (GPM) & IMERG | https://gpm.nasa.gov/data |
| Landsat | https://earthexplorer.usgs.gov/ |
| MODIS | https://lpdaac.usgs.gov/products/ |
| VIIRS | https://search.earthdata.nasa.gov/search |
| NASA POWER | https://power.larc.nasa.gov/ |
| Shuttle Radar Topography Mission (SRTM) | https://www.earthdata.nasa.gov/data/instruments/srtm |
| ECOSTRESS | https://ecostress.jpl.nasa.gov/data |
| USDA Ag Data Commons | https://www.nal.usda.gov/services/agdatacommons |
| Web Soil Survey (WSS) | https://websoilsurvey.nrcs.usda.gov/app/ |
| Cropland Data Layer (CDL): CropScape | https://nassgeodata.gmu.edu/CropScape/ |
| PRISM Climate Data (Oregon State University) | https://prism.oregonstate.edu/ |
| USDA NRCS SSURGO/STATSGO2 | https://www.nrcs.usda.gov/resources/data-and-reports/soils |
| National Agriculture Imagery Program (NAIP) | https://naip-usdaonline.hub.arcgis.com/ |
| USGS National Land Cover Database (NLCD) | https://www.usgs.gov/centers/eros/science/national-land-cover-database |
| NLDAS/GLDAS (Land Data Assimilation Systems) | https://www.earthdata.nasa.gov/ (la página indica buscar «NLDAS» o «GLDAS» en Earthdata Search) |
| FAO Global Agro-Ecological Zones (GAEZ) | https://gaez.fao.org/ |
| CoCoRaHS | https://www.cocorahs.org/Maps |
| USGS National Water Information Systems (NWIS) | https://waterdata.usgs.gov/nwis |
| USDA AMS Market News | https://www.ams.usda.gov/market-news |
| USDA NASS QuickStats | https://quickstats.nass.usda.gov/ |
| OpenET | https://openetdata.org/ |
| USFS LANDFIRE | https://www.landfire.gov/ |
| Global Ecosystem Dynamics Investigation (GEDI) | https://gedi.umd.edu/data |

### Space Agency Partner Resources — ESA
| Recurso | URL |
|---|---|
| Copernicus Sentinel-2 | https://dataspace.copernicus.eu/ |
| ERA5: ECMWF Reanalysis | enlace de la página a cds.climate.copernicus.eu/datasets (no se pudo leer la ruta completa) |

## Cruce con los datos que usa Raíz (pertinencia)
| Dato en Raíz | ¿En la lista oficial? | Renglón |
|---|---|---|
| HLS v2 (Landsat 8/9 + Sentinel-2 armonizados) | Sí: Landsat y Sentinel-2 (ESA) están en la lista; HLS es el producto de la NASA que los combina | Landsat; Copernicus Sentinel-2 |
| NASA POWER (clima diario, ETo) | Sí | NASA POWER |
| NASADEM (relieve, 30 m) | Sí: es la versión reprocesada de SRTM; la página dice «SRTM or other NASA elevation products» | SRTM |
| GPM IMERG V07 (lluvia diaria, tormenta) | Sí | GPM & IMERG |
| SSEBop VIIRS (ET regional, A8) | VIIRS está en la lista; SSEBop es un producto de USGS sobre VIIRS | VIIRS |
| Fields of The World (límites de parcelas) | No está en la lista (dato de terceros, CC-BY-4.0); la página permite datos locales y de terceros | — |
| SIH/Conagua, SIAP, SDR Chihuahua | No (datos locales oficiales de México) | — |
