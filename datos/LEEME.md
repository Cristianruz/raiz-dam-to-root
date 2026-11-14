# datos/ · Piezas de datos de Raíz (sesión de datos)

Orden de ejecución (cada script lee y escribe en la carpeta de trabajo):

| Paso | Dónde | Script | Entradas | Salidas |
|---|---|---|---|---|
| 1 | Code Editor de Earth Engine, proyecto `iondroplet` | `earthengine/A3_hls_nasadem.js` | — | En Drive `Raiz_entregas/`: `hls_mensual_2025_10_a_2026_09.tif`, `hls_ndvi_memoria_2015_10_a_2026_09.tif`, `nasadem_zona_piloto.tif` |
| 2 | Python con internet | `colab/B1_parcelas_ftw.py --listar`, luego `--url <GeoParquet>` | — | `parcelas_base.geojson` |
| 3 | Python con internet | `colab/A1_power_eto.py` | — | `eto_diaria.csv`, `power_crudo_*.json` |
| 4 | Python | `colab/A3_parcelas_hls.py` | pasos 1–3 | `hls_mensual_parcelas.csv`, `suelo_desnudo.csv`, `memoria_parcelas.csv` |
| 5 | Python | `colab/A4_cultivos_reglas.py` | paso 4 | `cultivos_parcelas.csv` |
| 6 | Python | `colab/A5_demanda_plazo.py` | paso 3 | `demanda_cultivos.csv`, `rotaciones.json` |
| 7 | Python | `colab/A9_relieve.py` | pasos 1–3 | `relieve_parcelas.csv`, `relieve_rutas.geojson`, `relieve_meta.json` |

Dependencias: `pip install rasterio shapely numpy duckdb`.
Prueba de FAO-56: `python colab/test_eto_fao56.py` (Ejemplos 8 y 18 del manual).
Zona piloto [S]: `[-105.42, 28.08, -105.32, 28.16]` (oeste, sur, este, norte), la misma en todos los scripts.
Cada archivo entregado se anota en `Raiz/entregas/LEEME.md` como `archivo | fuente | fecha | script`.
