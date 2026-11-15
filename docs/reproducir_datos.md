<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Cómo reproducir los datos de ROOT desde cero

> Para el jurado o para quien quiera rehacer los datos. Un comando rehace, desde los crudos del repositorio, todos los
> archivos que la sesión de datos entregó al buzón (`Raiz_entregas`) y los compara byte por byte con la entrega.
> Comprobado el 14-nov-2026 en una carpeta vacía: **35 de 35 archivos idénticos** (sha256), con ECOSTRESS incluido.

## 1. Lo que se necesita
- Python 3.11 o más reciente (probado con 3.13) y `pip install numpy rasterio shapely matplotlib`.
- El repositorio con su historial completo (`git clone` sin `--depth`): el rectángulo del prerregistro usa una versión
  anterior de un script, que se lee del historial (ver §3, etapa 1).
- Los rásteres de Earth Engine por zona, que viven en la rama `ee-crudos` (unos 200 MB):
  ```bash
  git fetch origin ee-crudos
  git archive origin/ee-crudos data/raw/ee_zonas | tar -x
  ```

## 2. Un comando
```bash
python datos/colab/correr_todo.py --salida /tmp/raiz_repro --comparar data/entrega_zonas
```
- Sin `--comparar` solo rehace los archivos (`/tmp/raiz_repro/entrega/`). Con `--comparar <carpeta>` compara cada archivo
  con esa carpeta (por ejemplo, una copia de `Raiz_entregas`) y sale con código 1 si alguno difiere o falta.
- `LEEME.md` no se compara: el de `Raiz_entregas` lleva detalle escrito a mano en la columna de fuente.

## 3. Qué hace, en orden
| Etapa | Scripts (en `datos/colab/`) | Entradas | Salidas que van a la entrega |
|---|---|---|---|
| 1. Rectángulo del prerregistro [-105.42, 28.08, -105.32, 28.16] | `B1_parcelas_ftw.py` **en su versión del commit 522585f** (con `--protagonistas P0097,P0110,P0118`), luego `A1`, `A9b`, `A3`, `A4`, `A5`, `A7`, `A8`, `A6_verdad_sih`, `A6_backtest`, `A6b` actuales | `data/raw/ftw/`, `data/raw/power/`, `data/raw/imerg/`, `data/raw/ee/`, `data/raw/ssebop/ssebop_zona_mensual.csv`, `data/raw/sih/LBQCH.csv`, `data/raw/conagua/` | `et_contraste.csv`, `h3_series.csv`; además los resultados de H1 (`h1_resultado.json`), H1-b (`h1b_resultado.json`) y H3 (`h3_resultado.json`) |
| 2. Dos zonas piloto | `correr_zonas.py`: `B1` → `A1` → `A9b` → `A3` → `A4` → `A5` → `A9` → `A7` → `A8` por zona, y `unir_zonas.py` | `data/raw/zonas/`, `data/raw/ee_zonas/`, `data/raw/power/`, `data/raw/ssebop/` | parcelas, clima, HLS, memoria, cultivos, demanda, rotaciones, relieve, IMERG y NASADEM de las dos zonas (20 archivos) |
| 3. Bases del reto y suelo | `A2_heladas`, `A10_contexto_regional`, `A11_gedi_parcelas`, `A12_nogal_cobertura`, `A13_suelo_parcelas`, `B3_opciones`, `B6_suelo_requisitos`, `B7_suelo_tipos`, `B8_tipo_suelo_parcelas`, `G1_gaez_zona`, `E0_ecostress_solicitud` (comprueba que las solicitudes son las que se subieron a AppEEARS), `E1_ecostress_parcelas` | `data/raw/reto/` y las salidas de la etapa 2 | `heladas.json`, `contexto_regional.csv`, `gedi_parcelas.csv`, `opciones_b3.json`, `suelo_parcelas.csv`, `suelo_requisitos.json`, `suelo_tipos.json`, `suelo_reglas.json`, `suelo_nutrientes_parcelas.csv`, `tipo_suelo_parcelas.csv`, `gaez_zona.csv`, `ecostress_parcelas.csv` |
| 4. Supuestos | copia de `datos/supuestos.json` | — | `supuestos.json` |

Por qué la etapa 1 usa un `B1` anterior: el prerregistro (H1 y H3) se corrió sobre las 338 parcelas que hizo esa versión.
El `B1` actual trabaja por zona y quita traslapes después de simplificar; aplicado al rectángulo daría otras geometrías.
Con la versión de 522585f las 338 parcelas salen idénticas a las usadas, y de ahí todo lo demás.

## 4. Lo que el comando NO rehace (necesita a una persona, una cuenta o internet)
Sus resultados ya están en `data/raw/` (o en la rama `ee-crudos`), con su fuente en cada `fuentes_*.csv` y en el `LEEME.md` de la entrega.

| Crudo | Cómo se obtuvo | Dónde está |
|---|---|---|
| Rásteres HLS mensuales, memoria de NDVI 2016–2026 y NASADEM | `datos/earthengine/A3_hls_nasadem.js` en el Code Editor de Earth Engine (requiere cuenta y proyecto de Google Cloud; los scripts traen el proyecto del equipo: cámbielo por el suyo) | `data/raw/ee/` (rectángulo) y rama `ee-crudos` → `data/raw/ee_zonas/` |
| Lluvia diaria GPM IMERG | `datos/earthengine/imerg_diaria.js` | `data/raw/imerg/`, `data/raw/ee_zonas/imerg_<zona>_*.csv` |
| ET mensual SSEBop | `datos/earthengine/ssebop_mensual.js` | `data/raw/ssebop/` |
| Series regionales (SMAP, MODIS, GRACE, GLDAS, NLDAS, ERA5-Land) y disparos GEDI | `datos/earthengine/contexto_regional.js` | `data/raw/reto/ctx_*.csv`, `gedi_disparos_*.csv` |
| Suelo (SoilGrids 2.0 y OpenLandMap) | `datos/earthengine/suelo.js` | `data/raw/reto/suelo_soilgrids_<zona>.csv`, `suelo_clases_<zona>.csv` |
| GAEZ v4 por celda | `datos/navegador/gaez_leer.js` (consola del navegador; servicio de imágenes de FAO) | `data/raw/reto/gaez_celdas.csv` |
| ECOSTRESS por parcela (ECO_L3T_JET.002) | AppEEARS, «Extract → Point Sample → Upload a request file» con `data/raw/reto/ecostress_solicitud_<zona>.json` (necesita cuenta de Earthdata); la salida `…-ECO-L3T-JET-002-results.csv` se guarda sin cambios | `data/raw/reto/ecostress_pasos_<zona>.csv` |
| Parcelas de Fields of The World | `datos/navegador/ftw_extraer.js` (consola del navegador en source.coop) | `data/raw/ftw/`, `data/raw/zonas/ftw_crudo_<zona>.geojson` |
| NASA POWER diario | `A1_power_eto.py --descargar` | `data/raw/power/`, `data/raw/zonas/power_crudo_lazaro_cardenas_*.json` |
| Salida de La Boquilla (SIH de Conagua) | descarga del SIH | `data/raw/sih/LBQCH.csv` |
| Estadísticas agrícolas de Conagua 1998–2025 | archivos originales de Conagua (xlsx) y su extracto del DR-005 en CSV | `data/raw/conagua/` (el extracto se hizo a mano desde los xlsx, que están junto a él; no hay script) |

## 5. Notas
- Los `fuentes_<pieza>.csv` llevan la fecha del día en que se corre: cambian de un día a otro y no se comparan.
- Las cifras dependen de `datos/supuestos.json` (cada supuesto con su fuente o marcado como `assumption`): si se cambia un
  supuesto, cambian las salidas y la comparación lo señala.
- Solo la etapa 1 tarda (unos 35 s del back-test de H1, con 10,000 corridas de Monte Carlo); lo demás corre en segundos.
