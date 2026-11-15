<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Decisión: el gemelo usa todas las bases de datos del reto que cubren la zona (14-nov-2026, 14:55)

**Quién decide:** Cristian (integrador): «utiliza todas las bases de datos que nos compartieron del Space Apps».

**Lista de partida:** `docs/referencias/recursos_reto.md` (pestaña Resources del reto, consultada el 14-nov a las 12:50).

## Criterio
Cada base entra con un papel que se pueda explicar en una frase. Ninguna cambia el cálculo del agua de la parcela (cubo, kit §2): entran como **estado observado**, **contraste** o **evidencia**, cada una con su resolución a la vista. Las que no cubren Chihuahua se declaran como no aplicables, con su equivalente mexicano.

## Papel de cada recurso

| Recurso de la lista | Estado | Papel en el gemelo | Entrega |
|---|---|---|---|
| Landsat y Sentinel-2 (HLS) | En uso | Verdor mensual por parcela y memoria 2016–2026 | `hls_mensual_parcelas.csv`, `memoria_parcelas.csv` |
| NASA POWER | En uso | Clima diario y agua que pide cada cultivo (FAO-56) | `eto_diaria[_zona].csv` |
| NASA POWER (heladas) | Entregado (14-nov) | Riesgo de helada por fecha de siembra (kit A2) | `heladas.json` |
| SRTM / NASADEM | En uso | Relieve 3D, rutas de escurrimiento y tormenta | `nasadem_zona_piloto[_zona].tif`, `relieve_*` |
| GPM IMERG | En uso | Lluvia diaria y tormenta de diseño | `imerg_diaria[_zona].csv` |
| VIIRS (SSEBop) | En uso | Contraste regional de evapotranspiración (A8) | `et_contraste.csv` |
| SMAP | Entregado (14-nov) | Estado observado: humedad del suelo de la región, mes a mes | `contexto_regional.csv` |
| MODIS | Entregado (14-nov) | Verdor de la zona desde antes de HLS; segundo contraste de ET; temperatura de la superficie | `contexto_regional.csv` |
| GRACE / GRACE-FO | Entregado (14-nov) | Estado observado: agua almacenada en la cuenca (superficie + suelo + acuífero), mes a mes | `contexto_regional.csv` |
| GLDAS | Entregado (14-nov) | Tercer contraste de ET y de humedad en la zona de raíces (modelo de superficie) | `contexto_regional.csv` |
| NLDAS | Entregado (14-nov) | Segunda fuente de clima para acotar la incertidumbre de POWER (lluvia y evaporación potencial) | `contexto_regional.csv` |
| ERA5 (ERA5-Land) | Entregado (14-nov) | Segunda fuente de temperatura mínima y días con helada | `contexto_regional.csv` |
| GEDI | Entregado (14-nov) | Evidencia por parcela: altura del dosel (distingue huerta de cultivo bajo) | `gedi_parcelas.csv` |
| ECOSTRESS | **Pedido** | Contraste de ET a escala de parcela (A8 hoy solo es regional) | `ecostress_parcelas.csv` |
| GAEZ (FAO) | **Pedido** | Evidencia regional: aptitud agroclimática por cultivo | `gaez_zona.csv` |
| OpenET | No aplica | No cubre México (S9 §11). En su lugar: SSEBop VIIRS | — |
| USDA, NRCS, CDL, NAIP, NLCD, PRISM, NWIS, CoCoRaHS, AMS, NASS, LANDFIRE | No aplica | Cubren solo Estados Unidos. Equivalentes locales en uso: SIAP (estadística agrícola), SIH/Conagua (presas) y SDR Chihuahua | — |

**Estado al 14-nov, 15:45:** las filas «Entregado» ya pasaron el validador del buzón (26 entregas, 0 rechazadas) y falta mostrarlas en la página; siguen pedidas ECOSTRESS y GAEZ. «Pedido» pasa a «En uso» solo cuando la entrega llega al buzón y pasa el validador. Si una no llega antes del congelamiento, la página lo dice con su motivo («not run: …»); no se rellena con nada.

## Dónde se ve en el gemelo
1. **Estado del gemelo → «Regional context»:** una serie por variable y zona, con su resolución y su fuente. Al mover la línea de tiempo se resalta el año elegido.
2. **Ficha de la parcela:** altura del dosel de GEDI y ET de ECOSTRESS, cuando la parcela tenga dato; riesgo de helada en las opciones con siembra en la ventana de A2.
3. **«About & Data» → «Challenge data sources»:** la tabla de arriba, generada de `data/recursos_reto.json` y de lo que de verdad hay en `data/processed`.

## Contrato de las entregas nuevas
Todas llegan a `Raiz_entregas/` con su línea en `LEEME.md` (`archivo | fuente | fecha | script`). En `fuente` va el identificador exacto del producto y su versión, y el periodo.

### `contexto_regional.csv` (un solo archivo, las dos zonas)
Promedio mensual sobre el rectángulo de cada zona (`data/params.json`, `zona_piloto.zonas`). Formato largo, una fila por zona, fuente, variable y mes:

| Columna | Contenido |
|---|---|
| `zona` | `delicias_saucillo` o `lazaro_cardenas`. Solo para `grace`: `cuenca` (ver la nota de GRACE) |
| `fuente` | `smap`, `modis`, `grace`, `gldas`, `nldas` o `era5_land` |
| `variable` | ver la tabla siguiente |
| `mes` | `AAAA-MM` |
| `valor` | número; vacío si no hay dato |
| `unidad` | ver la tabla siguiente |
| `resolucion_m` | tamaño nominal de la celda del producto, en metros |
| `n_celdas` | celdas del producto que entran en el promedio de la zona |

| `fuente` | `variable` | `unidad` | Qué es |
|---|---|---|---|
| `smap` | `humedad_superficial` | `m3/m3` | humedad de la capa superficial |
| `smap` | `humedad_raiz` | `m3/m3` | humedad de la zona de raíces |
| `modis` | `ndvi` | `adimensional` | verdor medio de la zona |
| `modis` | `et` | `mm/mes` | evapotranspiración |
| `modis` | `temp_superficie_dia` | `°C` | temperatura diurna de la superficie |
| `grace` | `agua_almacenada_anomalia` | `cm` | anomalía del espesor de agua equivalente |
| `gldas` | `et` | `mm/mes` | evapotranspiración del modelo |
| `gldas` | `humedad_raiz` | `kg/m2` | humedad de la zona de raíces del modelo |
| `nldas` | `lluvia` | `mm/mes` | precipitación |
| `nldas` | `evaporacion_potencial` | `mm/mes` | evaporación potencial |
| `era5_land` | `tmin_media` | `°C` | media mensual de la temperatura mínima diaria |
| `era5_land` | `dias_helada` | `dias` | días del mes con temperatura mínima ≤ 0 °C (misma definición que el kit A2) |

Periodo: desde 2000-01, o desde el primer mes del producto si empieza después, hasta el último mes disponible. Llave única: (`zona`, `fuente`, `variable`, `mes`).

**Nota de GRACE (acordada con la sesión de datos, 14-nov 15:35):** el límite entre dos celdas de GRACE (mascons de 3°) pasa por la zona, así que la diferencia entre Delicias–Saucillo y Lázaro Cárdenas sería un efecto de la malla y no información local. GRACE se entrega como **una sola serie**, con `zona` = `cuenca`: el promedio sobre el rectángulo que envuelve las dos zonas (`zona_piloto.bbox`), ponderado por la fracción cubierta. La página la muestra igual para las dos zonas y la rotula como dato de cuenca.

**Otras precisiones:**
- `dias_helada` de ERA5-Land se cuenta por celda y se promedia en la zona: puede traer decimales.
- ERA5-Land es de ECMWF/Copernicus, no de NASA; la tabla de recursos lo rotula así.
- Los archivos intermedios que Earth Engine deja en el buzón (`ctx_*.csv`, `gedi_disparos_*.csv`) son crudos: el validador los lista aparte y no los toma como entregas.

### `gedi_parcelas.csv` (un solo archivo, las dos zonas)
| Columna | Contenido |
|---|---|
| `id` | id de `parcelas_base.geojson` |
| `n_disparos` | disparos válidos de GEDI dentro de la parcela (0 si no hay) |
| `altura_mediana_m` | mediana de la altura relativa 98 (rh98), en metros; vacío si `n_disparos` = 0 |
| `altura_p90_m` | percentil 90 de rh98, en metros; vacío si `n_disparos` = 0 |

Una fila por parcela. El filtro de calidad aplicado se escribe en la línea de `LEEME.md`.

### `ecostress_parcelas.csv` (un solo archivo, las dos zonas)
| Columna | Contenido |
|---|---|
| `id` | id de `parcelas_base.geojson` |
| `mes` | `AAAA-MM` (mismos 12 meses que `hls_mensual_parcelas.csv`) |
| `et_mm_dia` | mediana de la ET diaria de las escenas despejadas del mes, en mm/día; vacío si no hubo escena |
| `n_escenas` | escenas despejadas que entraron |

### `gaez_zona.csv`
| Columna | Contenido |
|---|---|
| `zona` | id de la zona |
| `cultivo` | uno de las clases de cultivo del proyecto (`alfalfa`, `algodon`, `maiz_forrajero`, `sorgo`, `trigo`, …) |
| `variable` | nombre del indicador de GAEZ tal como lo publica FAO |
| `valor` | número |
| `unidad` | unidad o escala del indicador |
| `resolucion_m` | tamaño nominal de la celda, en metros |

### `heladas.json`
Sin cambios: es la pieza A2 del kit, calculada con la columna `tmin` de `eto_diaria.csv`.

## Límites que se declaran en la página
- SMAP, GRACE, GLDAS, NLDAS, ERA5-Land, MODIS y GAEZ son **regionales**: describen la zona o la cuenca, no una parcela. Cada serie lleva su resolución.
- GRACE mide toda el agua almacenada (superficie, suelo y acuífero) a escala de cuenca; no separa el acuífero ni el distrito.
- GEDI muestrea con disparos separados: muchas parcelas no tienen ninguno, y eso se muestra como «no data», no como cero.
- Ninguna de estas series pronostica la presa ni cambia el semáforo de agua.
