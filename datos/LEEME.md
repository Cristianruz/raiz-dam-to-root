<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# datos/ · Piezas de datos de Raíz (sesión de datos)

Orden de ejecución (cada script lee y escribe en la carpeta de trabajo):

| Paso | Dónde | Script | Entradas | Salidas |
|---|---|---|---|---|
| 1 | Code Editor de Earth Engine, proyecto `iondroplet` (solo lo corre Cristian) | `earthengine/A3_hls_nasadem.js` | — | En Drive `Raiz_entregas/` (Drive no crea subcarpetas; después se mueven a `Raiz/entregas/`). Orden: `piloto_consumo` (medir EECU) → `hls_mensual_2025_10_a_2026_09` → `hls_reflect_2025_10_a_2026_09` → `hls_ndvi_memoria_<año>` de 2025, 2026, 2024 … 2016 → `nasadem_zona_piloto` |
| 2 | Navegador (consola en source.coop) y Python | `navegador/ftw_extraer.js` → `data/raw/ftw/ftw_zona_piloto_crudo.geojson`; luego `colab/B1_parcelas_ftw.py --crudo <ruta>` | — | `parcelas_base.geojson` (338 parcelas, 5,794 ha, sin traslapes) |
| 3 | Python con internet | `colab/A1_power_eto.py` | — | `eto_diaria.csv`, `power_crudo_*.json` |
| 4 | Python | `colab/A3_parcelas_hls.py` | pasos 1–3 | `hls_mensual_parcelas.csv`, `suelo_desnudo.csv`, `memoria_parcelas.csv` |
| 5 | Python | `colab/A4_cultivos_reglas.py` | paso 4 | `cultivos_parcelas.csv` |
| 6 | Python | `colab/A5_demanda_plazo.py` | paso 3 | `demanda_cultivos.csv`, `rotaciones.json` |
| 7 | Python | `colab/A9_relieve.py` | pasos 1–3 | `relieve_parcelas.csv`, `relieve_rutas.geojson`, `relieve_meta.json` |

Todos los scripts aceptan `--dir <carpeta>` (p. ej. `--dir data/processed`) y trabajan dentro de ella.
Antes de correr, copiar `datos/supuestos.json` a esa carpeta: A3, A4, A5 y A9 leen de ahí Ea, sesgo de ETo,
presiembra, Kc del nogal, plazos y umbrales, cada uno con su fuente o marcado como `assumption`, y se detienen si falta uno.
Cada script escribe `fuentes_<pieza>.csv` (archivo, fuente, fecha, script, sha256) junto a sus salidas.

Dependencias: `pip install rasterio shapely numpy duckdb`.
Prueba de FAO-56: `python colab/test_eto_fao56.py` (Ejemplos 8 y 18 del manual).
Zona piloto [S]: `[-105.42, 28.08, -105.32, 28.16]` (oeste, sur, este, norte), la misma en todos los scripts.
La trazabilidad de cada archivo entregado está en los `fuentes_*.csv` (incluye sha256).

Notas para el integrador (B4):
- `dias_suelo_desnudo_mediana` queda en null: solo hay 2026 (`suelo_desnudo.csv` trae `dias_suelo_desnudo_feb_abr`).
- `rotaciones.json`: `plazo_anios` siempre {min, max}; láminas con llaves "0" y "-20" (p10, p50, p90, neta_mm_p50, etc_mm_p50).
- Entregas: Drive `Raiz_entregas/` (sin mover a mano) con `LEEME.md`, una línea por archivo
  `archivo | fuente | fecha | script`. Las líneas salen de `python colab/comun.py <carpeta>`; `nasadem_zona_piloto.tif`
  se anota a mano porque lo escribe Earth Engine. Orden: primero `parcelas_base.geojson`.
- Punto de NASA POWER (28.19 N, −105.45 O): fuera del bbox por ~3 km, pero en la misma celda MERRA-2
  (0.5° × 0.625°, centro 28.0 N, −105.625 O) y CERES (1°) que las cuatro esquinas y el centro del bbox.

Corrida real (14-nov-2026): 338 parcelas; protagonistas P0097 (alfalfa, 3 años, por vencer), P0110 (nogal,
comprometida) y P0118 (barbecho en 2026 tras años perenne, libre), elegidas por confianza FTW ≥ 55, 6–40 ha y
12 meses válidos; revisarlas a ojo en el mapa. Las 14 entregas pasan `motor/ensamblar.py` de la otra rama sin rechazos.
