<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Verificación de fuentes leídas en los archivos crudos (sesión de datos, 14-nov-2026)

Completa los «por verificar» de `docs/equipo/verificar_datos_nasa.md` con lo que traen los propios archivos.

| Dato | Qué se verificó y dónde | Resultado |
|---|---|---|
| NASA POWER | Encabezado de `data/raw/power/power_crudo_*.json` (respuesta original de la API daily, community=AG) | Unidades: T2M_MAX y T2M_MIN en °C, RH2M en %, WS2M en m/s, ALLSKY_SFC_SW_DWN en MJ/m²/día, PRECTOTCORR en mm/día. Valor de relleno −999 (A1 descarta esos días: 1,100, sobre todo 1981–1983 y los últimos días). Radiación con dato desde 1984-01-01 |
| Fields of The World | `Mexico.parquet` (vectores alpha, particionado por país) y su metadato GeoParquet 1.1 | Columnas: `schema, metrics:area, metrics:perimeter, id, determination:datetime, determination:method, geometry, bbox, admin:country_code, admin:subdivision_code` (fiboa). **No hay columna de confianza.** `determination:datetime` = 2025-01-01. 393 row groups, 45.4 millones de polígonos en México |
| Confianza de FTW | `prue_v1_confidence_global.tif` (COG, compresión ZSTD) | Float32, 1/240° (~460 m), EPSG:4326, nodata −1. En la zona: 0.11–0.58. El llms.txt de FTW recomienda filtrar ≥ 0.4 (≥ 0.5 conservador); el contrato usa 0–100 y abstención < 50 |
| Cita de FTW | llms.txt de source.coop/ftw/global-data | «Field boundaries: Fields of The World global predictions (CC-BY-4.0), source.coop/ftw/global-data» |
| Celda de POWER | Cálculo de la malla MERRA-2 (0.5° × 0.625°) y CERES (1°) | El punto 28.19 N −105.45 O y las 4 esquinas y el centro del bbox caen en la misma celda |
| SSEBop VIIRS v6 mensual (A8) | Catálogo de Earth Engine `projects/usgs-ssebop/viirs_et_v6_monthly` | Banda única `et`; 77 imágenes; la última es de 2026-09. Unidades: **mm**, factor de escala **1.0**, malla 1 km (ficha de gee-community-catalog.org/projects/usgs_viirs, 14-nov) |
