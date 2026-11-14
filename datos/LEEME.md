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

## Dos zonas piloto (decisión del 14-nov, 12:50)
- Zonas: `delicias_saucillo` [-105.56, 28.07, -105.32, 28.19] (ids P…) y `lazaro_cardenas` [-105.66, 28.35, -105.56, 28.43] (ids L…).
- Earth Engine (`earthengine/A3_hls_nasadem.js`) exporta por zona con sufijo; los rásteres crudos están en la rama `ee-crudos`
  (`data/raw/ee_zonas/`), no en esta rama.
- Cada zona se procesa en `data/zonas/<zona>/` con los mismos scripts (B1 `--zona`, A1 con `--lat/--lon/--patron`, A3, A4, A5, A9).
- `colab/unir_zonas.py --salida data/entrega_zonas` arma la entrega: un solo archivo con las dos zonas para parcelas, CSV por
  parcela y rutas; con sufijo `_lazaro_cardenas` para clima, demanda, relieve_meta y NASADEM; y el `LEEME.md`.
- Corrida real: 940 + 299 parcelas. Protagonistas: P0757 (alfalfa de 3 años, por vencer, a 0.25 km de Km 92), P0244 (descanso en
  2026 tras años con cultivo, libre, a 0.7 km de El Molino) y L0175 (nogal, comprometida, a 2.6 km de Lázaro Cárdenas).
  No hay «anual libre» con nombre de cultivo: las anuales de verano se abstienen; la protagonista libre es una parcela en descanso.
- La entrega pasa `motor/ensamblar.py` de la rama del integrador: 22 archivos, 0 rechazados, 0 retenidos.
- **Un comando la rehace desde los crudos** (unos 55 s): `python datos/colab/correr_zonas.py`. Comprobado el 14-nov-2026 en una
  carpeta vacía: los 20 archivos de datos salen idénticos, byte por byte, a los entregados en `Raiz_entregas`. El `LEEME.md`
  de la entrega lleva además detalle escrito a mano en la columna de fuente (punto de NASA POWER, rectángulo de IMERG) y dos
  archivos del rectángulo original (`et_contraste.csv`, `h3_series.csv`, de `data/processed/`).
- Rutas de escurrimiento (A9): no se dibujan dentro de depresiones cerradas del DEM de 3 m o más (`prof_depresion_ruta_m` [S] en
  `supuestos.json`); ahí la dirección de flujo sale del relleno y no del terreno. `relieve_parcelas.csv` no depende de esto.

## Bases del reto (decisión del 14-nov, 15:30)
- `colab/A2_heladas.py` → `heladas.json` (kit A2, NASA POWER): `python datos/colab/A2_heladas.py --dir data/zonas/delicias_saucillo --otra lazaro_cardenas=../lazaro_cardenas`.
- `earthengine/contexto_regional.js` exporta las series mensuales por zona (SMAP, MODIS, GRACE, GLDAS, NLDAS, ERA5-Land) y los
  disparos de GEDI; los crudos quedan en `data/raw/reto/`.
- `colab/A10_contexto_regional.py --dir data/reto --crudo data/raw/reto` → `contexto_regional.csv` (series regionales, nunca por parcela;
  GRACE como una sola serie «cuenca»).
- `colab/A11_gedi_parcelas.py --dir data/reto --crudo data/raw/reto` (con `parcelas_base.geojson` en la carpeta) → `gedi_parcelas.csv`.

