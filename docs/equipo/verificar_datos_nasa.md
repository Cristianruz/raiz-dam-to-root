<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Verificar los datos NASA y de terceros antes de usarlos o entregarlos

**Para qué:** cada dato que entra a Raíz se revisa antes de usarlo y antes de entregar la tabla que sale de él. Se revisan:
- unidades y escala;
- rango;
- faltantes y valores de «sin dato»;
- fechas;
- proyección (CRS);
- cobertura de la zona;
- licencia y cita.

Así el ensamblador no lo rechaza y nadie tiene que defender ante el jurado una cifra mal leída.

**Qué cambió a las 10:30:** casi todos los datos ya los entregó la sesión de datos (README, [«Estado a las 10:30»](README.md#estado-a-las-1030-sábado-14-nov)) y el integrador los validó. Aquí **no se vuelve a correr Earth Engine ni a descargar nada que ya esté en `Raiz_entregas`**: se revisa que lo entregado se lea bien antes de usarlo en su pieza.

**Cómo se usa:**
1. Abra el archivo en Colab, directo desde `/content/drive/MyDrive/Raiz_entregas/`.
2. Pegue el prompt de su sección en Gemini, debajo del G0 de su pieza o en un chat aparte.
3. Pida **una sola celda** que imprima la verificación.
4. Pegue la salida en la revisión con contexto nuevo (`docs/prompts/para_gemini.md`).

**Reglas:**
- **Rango de control:** solo se usan los que dan el kit, S9 o el validador (`motor/esquemas.py`), con su sección. Si no hay rango, el prompt dice «sin rango de control» y solo imprime los valores: no se inventa uno.
- **Nada de memoria:** lo que esta guía marca **«por verificar en el catálogo»** no se pudo abrir desde la máquina de construcción el 14-nov. Antes de afirmarlo en la página, ábralo en el navegador (vea [herramientas.md](herramientas.md)). Ni Gemini ni Claude lo deben «recordar».

## 0. Qué se entregó y en qué formato (14-nov, 10:30)

| Archivo en `Raiz_entregas` | Formato | De dónde sale el formato |
|---|---|---|
| `parcelas_base.geojson` | 338 campos de Fields of The World, 5,794 ha; `id` de `P0001` en adelante, de norte a sur; `id, area_ha, modulo, ftw_confianza, protagonista` | Integrador; `motor/esquemas.py` |
| `eto_diaria.csv` | `fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m` (puede traer columnas de más), del 1984-01-01 al 2026-11-09 | Integrador; `motor/esquemas.py` |
| `hls_mensual_2025_10_a_2026_09.tif` | Bandas `AAAA_MM_ndvi`, `AAAA_MM_lswi`, `AAAA_MM_bsi` y `AAAA_MM_n` (observaciones válidas). Índices en Int16 multiplicados por 10,000; −32768 = sin dato | Script A3 de la sesión de datos (docstring) |
| `hls_reflect_2025_10_a_2026_09.tif` | Bandas `AAAA_MM_azul`, `_verde`, `_rojo`, `_nir`, `_swir1` y `_swir2`. Int16 multiplicado por 10,000; −32768 = sin dato | Script A3 de la sesión de datos |
| `hls_ndvi_memoria_<año>.tif` | Un archivo por año agrícola, bandas `AAAA_MM_ndvi`. Int16 multiplicado por 10,000; −32768 = sin dato | Script A3 de la sesión de datos (docstring) |
| `hls_mensual_parcelas.csv` | `id, mes, banda, mediana, p25, p75, n_validos`; bandas **`ndvi`, `lswi` y `bsi`**, ya divididas entre 10,000 (entre −1 y 1). Las reflectancias no están en este CSV: están en `hls_reflect_…tif` | Script A3; `motor/esquemas.py` |
| `suelo_desnudo.csv` | `id, dias_suelo_desnudo_feb_abr, dias_desnudo_viento_alto, ndvi_ultimo_mes, meses_validos` | `motor/esquemas.py` |
| `memoria_parcelas.csv` | `id, anio_agricola, estado, meses_verdes, max_verano, max_invierno, dias_suelo_desnudo_feb_abr, meses_validos`, 2016–2026 | `motor/esquemas.py` |
| `memoria_resumen.csv` | `id, dias_suelo_desnudo_mediana, anios_con_dato, estado_2025` | `motor/esquemas.py`; script A3 |
| `cultivos_parcelas.csv` | `id, cultivo_actual, prob_max, acuerdo_metodos, abstencion, edad_perenne_anios, estado_plazo, grupo_fenologico`. Versión de reglas: «1/1 (reglas)» y `prob_max` vacío; 218 de 338 abstenidos (132 anuales de verano) | `motor/esquemas.py`; integrador |
| `rotaciones.json`, `demanda_cultivos.csv` | Lámina por rotación y por cultivo, P10/P50/P90, lluvia 0 % y −20 % | `motor/esquemas.py` |
| `relieve_parcelas.csv`, `relieve_rutas.geojson`, `relieve_meta.json`, `nasadem_zona_piloto.tif` | Relieve a 30 m y tormenta de referencia | `motor/esquemas.py` |

**Qué se confirmó en el catálogo oficial el 14-nov** (sirve para citar; no hay que volver a abrir Earth Engine):

| Dato | Qué se confirmó | Resultado |
|---|---|---|
| HLS L30 v002 | ID `NASA/HLS/HLSL30/v002`; NIR = **B5**; banda `Fmask` | Confirmado. Serie desde **2013-04-11** |
| HLS S30 v002 | ID `NASA/HLS/HLSS30/v002`; NIR angosto = **B8A**; SWIR 1 = **B11**; SWIR 2 = **B12** | Confirmado. Serie desde **2015-11-28** |
| Fmask (L30 y S30) | Bits **1 nube, 2 adyacente, 3 sombra, 4 nieve o hielo**, 5 agua | Confirmado; coincide con el kit A3 |
| NASADEM | ID `NASA/NASADEM_HGT/001`; banda `elevation` en m, sobre el geoide EGM96; 30 m; misión de febrero de 2000 | Confirmado |
| NASA POWER | Parámetros, unidades y valor de relleno | **Por verificar en el catálogo** (diccionario de parámetros de POWER) |
| Fields of The World 2025 | Columnas, escala de la confianza y cita | **Por verificar** en `source.coop` |
| SIH `LBQCH.csv` | Nombres de columnas | **Por verificar al abrir el archivo** (no está en el repo) |

## Lista general (para cualquier archivo)

| Revisar | Cómo |
|---|---|
| Unidades y escala | Imprima las que trae el propio archivo (encabezado, metadatos o descripción de banda). En los GeoTIFF de HLS: Int16 multiplicado por 10,000 y −32768 = sin dato; **se divide una sola vez**. Una conversión se escribe con su explicación; por ejemplo, «100 mm = 1 millar/ha» (kit B4) |
| Rango | Mínimo y máximo de cada columna numérica. Compárelos solo con un rango de control con fuente |
| Faltantes | Cuente los nulos y los centinelas (−999 de POWER, −32768 de los GeoTIFF). Conviértalos a NaN y repórtelos; nunca los rellene ni los borre en silencio |
| Fechas | Primera y última fecha, días o meses que faltan, fechas repetidas |
| CRS y escala | CRS del archivo (EPSG) y tamaño de celda. En grados (EPSG:4326), las áreas y pendientes se calculan en metros (reproyectar) |
| Cobertura de la zona | ¿El dato cubre el rectángulo `zona_piloto.bbox` de `data/params.json` ([-105.42, 28.08, -105.32, 28.16]) y los 338 campos de `parcelas_base.geojson`? |
| `id` | Todos existen en `parcelas_base.geojson`. En `etiquetas_unidas.csv`, `id` es el campo de `parcelas_base.geojson` que contiene el punto y `punto_id` es único (README §6, decisión e) |
| Licencia y cita | La línea de `LEEME.md` (fuente), `fuentes_<pieza>.csv` (`archivo, url_o_api, fecha_consulta, sha256`) y la cita para «References» del README (§10) |

---

## 1. NASA POWER (A1, A2, A5, A6 y A9)

**Qué es:** clima diario de un punto, de la NASA POWER Daily API (`https://power.larc.nasa.gov/api/temporal/daily/point`, `community=AG`; kit A1). Ya está en `eto_diaria.csv` (sesión de datos): **no se vuelve a descargar**.
- **Punto:** 28.19 N, −105.45 O (kit A1; `data/params.json` → `zona_piloto.punto_clima`). Queda fuera del rectángulo de la zona piloto [-105.42, 28.08, -105.32, 28.16], pero **en la misma celda MERRA-2 de POWER** que todo el rectángulo (sesión de datos, script A1; integrador). POWER es una celda regional, no una estación.
- **Periodo entregado:** del 1984-01-01 al 2026-11-09 (integrador). El kit A1 pedía desde 1981-01-01: si alguien pregunta por la diferencia, pásela a Cristian; no la explique de memoria.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Columnas | `fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m`; columnas de más solo dan un aviso | `motor/esquemas.py` |
| Faltantes | −999 → NaN, contados y reportados. El ensamblador rechaza la tabla desde el 5 % de faltantes | Kit A1, paso 3; `motor/esquemas.py` |
| Fechas | Una fila por día, sin huecos ni repetidos | Kit A1 |
| Coherencia | `tmin ≤ tmax`; `lluvia_mm ≥ 0`; `ws2m ≥ 0`; `eto_mm` entre 0 y 15 | `motor/esquemas.py`; kit A1 |

**Rangos de control** (solo los del kit):
- ETo diaria entre 0 y 15 mm/d (kit A1).
- Suma anual promedio de ETo: rango de control estimado de 1,400–2,600 mm/año en el centro-sur de Chihuahua (kit A1).
- La ETo mensual promedio tiene su pico en mayo–junio (kit A1).
- Lluvia anual promedio: rango de control de 250–500 mm (kit A1).
- Heladas (kit A2): la última helada p50 cae en febrero–abril y la primera p50 en octubre–diciembre; control: INEGI 1983 reporta marzo y noviembre para Delicias.

**Prompt: `eto_diaria.csv`** (antes de usarla en A2 o A6):
```text
Eres revisor de datos. NO inventes cifras: usa solo el archivo y los rangos de control que te doy, con su fuente.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea /content/drive/MyDrive/Raiz_entregas/eto_diaria.csv e imprima:
1) columnas y tipos: ¿están fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m? (otras columnas: solo lístalas);
2) primera y última fecha (se esperan 1984-01-01 y 2026-11-09, dato del integrador); fechas repetidas; días que faltan en el calendario;
3) por columna: mínimo, máximo, nulos y cuántos -999 quedan;
4) ¿toda eto_mm está entre 0 y 15 mm/d? (kit A1);
5) suma anual promedio de eto_mm, solo con años completos, y si cae en 1,400–2,600 mm/año (rango de control estimado, kit A1);
6) mes con mayor eto_mm promedio (debe ser mayo o junio, kit A1);
7) lluvia anual promedio, solo con años completos, y si cae en 250–500 mm (rango de control, kit A1);
8) filas con tmin > tmax, lluvia_mm < 0 o ws2m < 0 (deben ser 0);
9) fracción de faltantes por columna (el validador rechaza desde el 5 %).
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar:**
- **`LEEME.md` (fuente):** `NASA POWER Daily API (community=AG), 28.19 N −105.45 O, 1984–2026`.
- **README → References:** el proyecto NASA POWER (NASA Langley Research Center), Daily API, comunidad AG, con la fecha de consulta. **El texto de agradecimiento y la licencia, por verificar en el catálogo** (páginas de POWER).

---

## 2. HLS L30 y S30 v002 (A3, A3-M y A4)

**Qué es:** Harmonized Landsat Sentinel-2, reflectancia de superficie a 30 m (NASA LP DAAC). La sesión de datos lo procesó en Earth Engine (`NASA/HLS/HLSL30/v002` y `NASA/HLS/HLSS30/v002`; NIR renombrado antes de fusionar; Fmask con bits 1–4, sin enmascarar el agua) y dejó en `Raiz_entregas` los GeoTIFF y las tablas de §0. **Usted no vuelve a correr nada de eso:** revisa que lo lea bien.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Escala de los GeoTIFF | Int16 multiplicado por 10,000; −32768 = sin dato. Se convierte −32768 a NaN y se divide entre 10,000 **una sola vez**. La banda `AAAA_MM_n` de `hls_mensual_…tif` es un conteo: no se divide | Script A3 de la sesión de datos |
| Escala de los CSV | `hls_mensual_parcelas.csv` ya viene dividido: `ndvi`, `lswi` y `bsi` entre −1 y 1. **No se divide otra vez** | Script A3; `motor/esquemas.py` |
| Bandas | CSV: solo `ndvi`, `lswi` y `bsi`. Reflectancias (`azul` … `swir2`): solo en `hls_reflect_2025_10_a_2026_09.tif` | Script A3 |
| CRS y extensión | Los GeoTIFF están en EPSG:4326 y cubren el rectángulo de la zona piloto | Script de Earth Engine de la sesión de datos |
| Año agrícola | Del 1-oct de Y−1 al 30-sep de Y. Para 2026, de oct-2025 a sep-2026 | Kit A3 y A3-M |
| Fechas de inicio | L30 desde 2013-04-11; S30 desde 2015-11-28 (§0). El año agrícola 2016 empieza solo con L30 | Catálogo; kit A3-M |
| Omisiones de Fmask | El Fmask de L30 tiene omisiones antes de abr-2022. Busque NDVI anómalos en invierno en los años anteriores | Kit A3, paso 3 |
| Rangos | `p25 ≤ mediana ≤ p75`; `n_validos ≥ 0`; `mes` en formato AAAA-MM | `motor/esquemas.py` |
| Suelo desnudo | Días con NDVI < 0.2 del 1-feb al 30-abr; entre 0 y los días de esa ventana; `dias_desnudo_viento_alto ≤ dias_suelo_desnudo_feb_abr` | S9 §5; `motor/esquemas.py` |
| Estados de la memoria | `sin_dato` si hay menos de 8 meses válidos o si la ventana de verano (jun–sep) o la de invierno (dic–mar) está vacía; `perenne` si el año y el anterior **o** el siguiente tienen 8 meses verdes o más; después `doble`, `verano`, `invierno` o `descanso` según el máximo de NDVI de cada ventana frente al umbral verde (0.40, `data/params.json`) | Script A3 (docstring); S9 §5 |
| `anios_con_dato` (`memoria_resumen.csv`) | Años agrícolas en que se pudieron calcular los días de suelo desnudo (hubo NDVI válido en febrero, marzo y abril). Son los años que entran en `dias_suelo_desnudo_mediana`. **No** es «años con estado distinto de `sin_dato`» | Script A3 de la sesión de datos |
| `cultivos_parcelas.csv` | Versión de reglas: `acuerdo_metodos` «1/1 (reglas)» (el validador la lee como «1/1») y `prob_max` vacío. Versión de P2: «2/2» o «1/2» y `prob_max` entre 0 y 1, **nunca vacío**. Abstenida ⇔ `sin_clasificar`, con `edad_perenne_anios` y `estado_plazo` vacíos | `motor/esquemas.py` |

**Controles** (solo los del kit):
- **NDVI de las 3 protagonistas** (kit A3, prueba): la alfalfa, verde casi todo el año, con caídas por corte; el chile, verde en verano y bajo en invierno; el nogal, verde en verano y sin hojas en invierno. Si no se ve así, se notifica.
- **Memoria:** % de parcelas-año con estado distinto de `sin_dato`; sensibilidad 0.35 / 0.40 / 0.45 (S9 §5).

**Prompt: los GeoTIFF de HLS** (P2, antes del Random Forest):
```text
Eres revisor de datos. NO inventes cifras ni rangos: imprime solo lo que trae el archivo.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que abra con rasterio /content/drive/MyDrive/Raiz_entregas/hls_reflect_2025_10_a_2026_09.tif y /content/drive/MyDrive/Raiz_entregas/hls_mensual_2025_10_a_2026_09.tif (dime el comando de instalación si hace falta) e imprima, para cada uno:
1) CRS (EPSG), tamaño de celda, filas, columnas, tipo de dato y valor de "sin dato" declarado;
2) extensión (oeste, sur, este, norte) y si contiene el rectángulo de la zona piloto que te pego;
3) número de bandas y sus nombres (descripciones de banda); ¿siguen el patrón AAAA_MM_<banda>? ¿cubren de 2025_10 a 2026_09?
4) para 3 bandas de ejemplo: cuántos píxeles valen -32768 y el mínimo y máximo del resto; después de dividir entre 10,000, ¿las reflectancias quedan entre 0 y 1 y los índices entre -1 y 1? (las bandas _n no se dividen);
5) si algún mes no tiene ningún píxel válido.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
[PEGA AQUÍ zona_piloto.bbox de data/params.json]
```

**Prompt: `hls_mensual_parcelas.csv` y `suelo_desnudo.csv`**
```text
Eres revisor de datos. NO inventes cifras ni rangos: usa el archivo y los controles que te doy, con su fuente.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea de /content/drive/MyDrive/Raiz_entregas/ hls_mensual_parcelas.csv, suelo_desnudo.csv y parcelas_base.geojson e imprima:
1) columnas: ¿hls_mensual_parcelas.csv trae id, mes, banda, mediana, p25, p75, n_validos? ¿suelo_desnudo.csv trae id, dias_suelo_desnudo_feb_abr, dias_desnudo_viento_alto, ndvi_ultimo_mes, meses_validos?
2) id que no existen en parcelas_base.geojson (deben ser 0) y parcelas de parcelas_base sin filas;
3) meses presentes (formato AAAA-MM) y si cubren de 2025-10 a 2026-09;
4) bandas presentes (se esperan ndvi, lswi y bsi); para cada una: mínimo, máximo y nulos. Deben estar entre -1 y 1 (ya divididas entre 10,000: no las dividas otra vez);
5) filas donde no se cumpla p25 ≤ mediana ≤ p75 (deben ser 0);
6) % de parcelas con 8 o más meses válidos (meta ≥ 80 %, kit A3);
7) en suelo_desnudo.csv: mínimo y máximo de días, y si alguno pasa de los días entre el 1-feb y el 30-abr de 2026 (calcúlalos con el calendario); filas con dias_desnudo_viento_alto > dias_suelo_desnudo_feb_abr (deben ser 0).
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Prompt: memoria y cultivos**
```text
Eres revisor de datos. NO inventes cifras: usa los archivos y las reglas que te pego.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea de /content/drive/MyDrive/Raiz_entregas/ memoria_parcelas.csv, memoria_resumen.csv y cultivos_parcelas.csv e imprima:
1) años agrícolas presentes en memoria_parcelas.csv y cuántas parcelas tiene cada uno;
2) estados fuera de la lista perenne, verano, invierno, doble, descanso, sin_dato (deben ser 0);
3) filas con meses_verdes > meses_validos (deben ser 0); max_verano y max_invierno entre -1 y 1 o vacíos;
4) % de parcelas-año con estado distinto de sin_dato;
5) la franja año por año de las 3 protagonistas (si ya están marcadas en parcelas_base.geojson; si no, de 3 id que te pegue);
6) memoria_resumen.csv: ¿trae exactamente id, dias_suelo_desnudo_mediana, anios_con_dato, estado_2025? dias_suelo_desnudo_mediana: enteros o vacíos, mínimo y máximo. anios_con_dato: entero ≥ 0, sin vacíos; recuerda que cuenta los años con NDVI válido en febrero, marzo y abril (los que entran en la mediana); comprueba con memoria_parcelas.csv que coincide con el número de años con dias_suelo_desnudo_feb_abr no vacío, y cuántas parcelas tienen 0;
7) cultivos_parcelas.csv: ¿trae exactamente id, cultivo_actual, prob_max, acuerdo_metodos, abstencion, edad_perenne_anios, estado_plazo, grupo_fenologico? Valores de acuerdo_metodos y cuántas filas de cada uno ("1/1 (reglas)" = versión de reglas; "2/2" y "1/2" = reglas + Random Forest); filas con "2/2" o "1/2" y prob_max vacío (deben ser 0); prob_max fuera de [0, 1] (deben ser 0); parcelas abstenidas con cultivo_actual distinto de sin_clasificar, o con edad_perenne_anios o estado_plazo llenos (deben ser 0); edad en un cultivo distinto de alfalfa o nogal (deben ser 0); número de abstenidas y conteo por grupo_fenologico.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar:**
- **`LEEME.md` (fuente):** `HLS L30/S30 v002 (NASA LP DAAC; Earth Engine NASA/HLS/HLSL30/v002 y NASA/HLS/HLSS30/v002), exportación de la sesión de datos, <periodo>, zona piloto`.
- **`fuentes_<pieza>.csv`:** en `url_o_api`, `Raiz_entregas/<archivo>`; su `sha256`.
- **README → References** (citas del catálogo de Earth Engine):
  - Masek, J., Ju, J., Roger, J., Skakun, S., Vermote, E., Claverie, M., Dungan, J., Yin, Z., Freitag, B., Justice, C. (2021). *HLS Operational Land Imager Surface Reflectance and TOA Brightness Daily Global 30m v2.0* [Data set]. NASA EOSDIS Land Processes Distributed Active Archive Center. https://doi.org/10.5067/HLS/HLSL30.002
  - *HLS Sentinel-2 Multi-spectral Instrument Surface Reflectance Daily Global 30m v2.0* [Data set]. NASA EOSDIS LP DAAC. https://doi.org/10.5067/HLS/HLSS30.002
- **Licencia:** datos de NASA, de acceso abierto. Términos de uso del catálogo: «NASA promotes the full and open sharing of all data with research and applications communities, private industry, academia, and the general public.»

---

## 3. NASADEM y relieve (A9)

**Qué es:** modelo de elevación de la NASA (`NASA/NASADEM_HGT/001`, banda `elevation`). Ya entregado: `nasadem_zona_piloto.tif` (30 m, EPSG:4326, zona piloto + 2 km) y, de él, `relieve_parcelas.csv`, `relieve_rutas.geojson` y `relieve_meta.json`.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Banda y unidades | `elevation`, en metros, sobre el geoide EGM96 | Catálogo (§0) |
| CRS y celda | EPSG:4326; celda de ~1 segundo de arco (~30 m) | `motor/esquemas.py`; catálogo |
| Extensión | Cubre `zona_piloto.bbox` más 2 km por lado | Kit A9, paso 1; `motor/esquemas.py` |
| Fecha | Dato de una sola vez (misión de febrero de 2000). Las parcelas se renivelan: el relieve fino no es actual | Catálogo; S9 §4 bis |
| `relieve_parcelas.csv` | `id, pendiente_media_pct, aportacion_externa_ha, frac_depresion`; pendiente entre 0 y 100; fracción entre 0 y 1. En la zona agrícola, la pendiente queda entre 0 y 5 % (kit A9, prueba) | `motor/esquemas.py`; kit A9 |
| `relieve_rutas.geojson` | Líneas (LineString o MultiLineString); pesa menos de 1 MB | Kit A9, paso 3; `motor/esquemas.py` |
| `relieve_meta.json` | `rotulo`, `umbral_ruta_ha`, `umbral_ruta_etiqueta`, `celda_ha` y `tormenta` (`mm`, `definicion`, `fuente`, `periodo`). La tormenta de lo entregado sale de **NASA POWER**, como permite el kit A9, paso 4 | `motor/esquemas.py`; `relieve_meta.json` |
| Rótulo | "regional, 30 m (NASADEM); not field drainage design" | Kit A9 |

**Prompt: relieve entregado**
```text
Eres revisor de datos. NO inventes cifras ni rangos.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea de /content/drive/MyDrive/Raiz_entregas/ relieve_parcelas.csv, relieve_rutas.geojson y relieve_meta.json e imprima:
1) relieve_parcelas.csv: columnas; id que no existen en parcelas_base.geojson (deben ser 0); mínimo, mediana y máximo de pendiente_media_pct (control del kit A9: entre 0 y 5 % en la zona agrícola), aportacion_externa_ha y frac_depresion;
2) relieve_rutas.geojson: tamaño en bytes (debe ser < 1,000,000), tipos de geometría y número de líneas;
3) relieve_meta.json: todas sus llaves y valores; la tormenta con su mm, definición, fuente y periodo;
4) si el rótulo dice "regional, 30 m (NASADEM); not field drainage design".
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar:**
- **`LEEME.md` (fuente):** `NASADEM (NASA/NASADEM_HGT/001, banda elevation, 30 m), exportado por la sesión de datos, zona piloto + 2 km`.
- **README → References** (cita del catálogo): NASA JPL (2020). *NASADEM Merged DEM Global 1 arc second V001* [Data set]. NASA EOSDIS Land Processes DAAC. https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001
- **Licencia:** términos del catálogo: «Unless otherwise noted, all NASA-produced data may be used for any purpose without prior permission.»; S9 §4 bis: «dominio público».

---

## 4. GPM IMERG V07 (no se usó en lo entregado)

La tormenta de referencia de `relieve_meta.json` salió de **NASA POWER** (`eto_diaria.csv`), que el kit A9, paso 4, permite. **GPM IMERG no está en ningún archivo entregado:** no se cita en la página, ni en «NASA Data», ni en el video. Si Cristian decide usarlo después, la extracción la hace la sesión de datos y esta sección se completa entonces con sus controles (banda, unidades y paso de tiempo leídos del catálogo, no de memoria).

---

## 5. SSEBop VIIRS v6 (A8)

**Estado:** A8 está en **«not run»** (vea [P4](P4_clima_demanda.md#a8--contraste-regional-de-et-por-ahora-not-run)). Si la sesión de datos entrega la serie, estos son los controles. **Siempre regional**, nunca por parcela (S8, decisión 4).
- **ID del kit A8:** `projects/usgs-ssebop/viirs_et_v6_monthly`. Está en el catálogo comunitario `awesome-gee-community-datasets`, no en el catálogo oficial de Earth Engine. Banda `et`, en mm, escala 1.0, según ese catálogo: **la sesión de datos confirma banda, unidades y escala** al extraer la serie.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Resolución | 1 km | S8, decisión 4 |
| Periodo | 12 meses, de oct-2025 a sep-2026, en mm por mes | Kit A8, prueba |
| Área | Promedio sobre el rectángulo de la zona piloto. Incluye caminos, parcelas sin clasificar y vegetación no agrícola | Kit A8, pasos 2 y 4 |
| Magnitud absoluta | Para balances en valor absoluto puede requerirse una corrección de sesgo regional (Senay et al. 2020). Apoya el rótulo "regional comparison; not field-level validation" | Catálogo comunitario; kit A8 |

**Prompt: `et_contraste.csv`** (sirve también para WaPOR, §6):
```text
Eres revisor de datos. NO inventes cifras.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea /content/drive/MyDrive/Raiz_entregas/et_contraste.csv e imprima:
1) columnas: ¿son exactamente mes, et_modelo_mm, et_ssebop_mm, et_wapor_mm?
2) ¿hay 12 meses, de 2025-10 a 2026-09, sin repetidos? (kit A8, prueba);
3) por columna: mínimo, máximo, nulos y valores negativos (deben ser 0). et_wapor_mm puede estar vacía si no hubo acceso a WaPOR (kit A8, paso 3);
4) la conversión de unidades que se aplicó a cada serie, según la explicación del cuaderno; si no está escrita, "REVISAR";
5) diferencia mensual en mm y en % del modelo frente a SSEBop y frente a WaPOR;
6) si algún texto dice "validated" para parcelas (debe ser no) y si aparece el rótulo "regional comparison; not field-level validation".
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar** (catálogo comunitario, `docs/projects/usgs_viirs.md`):
- Senay, G.B., et al. (2023). Improving the Operational Simplified Surface Energy Balance Evapotranspiration Model Using the Forcing and Normalizing Operation. *Remote Sensing* 15(1): 260. https://doi.org/10.3390/rs15010260
- Senay, G.B., Kagone, S., Velpuri, N.M. (2020). Operational Global Actual Evapotranspiration using the SSEBop model. U.S. Geological Survey data release. https://doi.org/10.5066/P9OUVUUI
- **Licencia:** «USGS-authored or produced data and information are considered to be in the U.S. Public Domain.»

---

## 6. WaPOR v3 nivel 1 (A8)

**Estado:** como SSEBop, depende de la sesión de datos; A8 está en «not run». **Siempre regional** (S8, decisión 4).
- **ID en el catálogo de Earth Engine:** `FAO/WAPOR/3/L1_AETI_D`; banda `L1-AETI-D`, multiplicada por 0.1; por década (10 días); ~300 m; desde 2018-01-01.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Unidades | **Por verificar.** La ficha dice «dekadal, in mm/day» en la descripción y «[mm]» en la banda. Si es mm/día: la ET del mes es la suma, por década, de (valor × 0.1 × días de la década); la tercera década del mes tiene los días que restan. La sesión de datos imprime un valor y lo compara con SSEBop antes de decidir | Catálogo |
| Contenido | AETI = evaporación del suelo + transpiración + intercepción. No es solo la ET del cultivo | Catálogo |

**Prompt:** el de §5 (`et_contraste.csv`). Además pida:
```text
Imprime, para un mes, los valores de las décadas de WaPOR tal como vienen, el factor 0.1 aplicado, los días de cada década y la suma mensual en mm, para que se vea la conversión paso a paso.
```

**Cómo citar:** la ficha de Earth Engine cita «FAO 2018. WaPOR Database Methodology: Level 1. Remote Sensing for Water Productivity Technical Report: Methodology Series. Rome, FAO». **La cita específica de la versión 3, por verificar en el portal de WaPOR de la FAO.** Licencia: CC-BY-4.0 (kit A8) y la política de datos abiertos de la FAO; cite las dos.

---

## 7. Fields of The World 2025 (B1)

**Qué es:** predicciones globales de límites de parcelas, hechas con una red neuronal sobre Sentinel-2 (Source Cooperative, `source.coop/ftw/global-data`, CC-BY-4.0; kit B1). **Advertencia:** fuera del dominio de entrenamiento: el benchmark no incluye México y el riego árido de Norteamérica no está en el entrenamiento (kit A4 y B1).
- **Ya entregado:** `parcelas_base.geojson`, 338 campos, 5,794 ha, `id` de `P0001` en adelante, de norte a sur. **No hay `parcelas_muestra.geojson`.** Las 3 protagonistas aún no están marcadas: las propone P2.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Columnas | `id` (único), `area_ha`, `modulo` (null si no puede asignarse), `ftw_confianza` (0–100), `protagonista` | `motor/esquemas.py`; kit §2.2 |
| Área | `area_ha` ≥ 1 (se filtran los campos menores); calculada en metros, no en grados | Kit B1, paso 3; `data/params.json` |
| Confianza | % de parcelas con confianza < 50; si es > 40 %, se notifica. Una parcela con confianza < 50 queda abstenida en el mapa | Kit B1, prueba; kit A4.2 |
| Protagonistas | Exactamente 3 con `protagonista = true`, revisadas a mano contra color verdadero. Hoy: 0, pendientes de P2 (el ensamblador solo avisa) | Kit B1, paso 4 |
| Geometrías | Polygon o MultiPolygon válidos, dentro del rectángulo de la zona piloto | `motor/esquemas.py` |
| Columnas de origen y cita formal | **Por verificar** en `source.coop` | — |

**Prompt: `parcelas_base.geojson`**
```text
Eres revisor de datos. NO inventes cifras.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea /content/drive/MyDrive/Raiz_entregas/parcelas_base.geojson con geopandas e imprima:
1) CRS, número de parcelas (se esperan 338, dato del integrador), columnas, tipos de geometría y geometrías inválidas;
2) ¿están id, area_ha, modulo, ftw_confianza, protagonista? ¿Hay id repetidos? Primer y último id;
3) area_ha: mínimo, máximo y suma (se esperan 5,794 ha, dato del integrador); area_ha recalculada en una proyección en metros (dime cuál) frente a la del archivo (diferencia máxima en %);
4) ftw_confianza: mínimo y máximo (escala 0–100) y % de parcelas con confianza < 50 (si es > 40 %, avísame, kit B1);
5) cuántas tienen protagonista = true y sus id;
6) parcelas que caen fuera del rectángulo de la zona piloto que te pego.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
[PEGA AQUÍ zona_piloto.bbox de data/params.json]
```

**Cómo citar:**
- **`LEEME.md` (fuente):** `Fields of The World 2025 (Source Cooperative, source.coop/ftw/global-data, CC-BY-4.0), recorte de la zona piloto`.
- **README → References:** Fields of The World, predicciones globales de límites de parcelas 2025, Source Cooperative, CC-BY-4.0. **La cita formal, por verificar** en `source.coop`.
- **Licencia:** CC-BY-4.0 exige atribución (References y página). Frase obligatoria de la página: "Field boundaries are NN predictions outside the model's training domain; filtered by confidence and manually reviewed for the showcased fields." (kit A4).

---

## 8. SIH: LBQCH.csv (A6)

**Qué es:** la serie diaria oficial de la presa La Boquilla, del Sistema de Información Hidrológica de Conagua. Es la **verdad** del back-test H1: salida por obra de toma del 14-mar al 14-jul-2026 (kit A6; S8, decisión 7).
- **Estado:** no está en `data/raw/sih` del repo a las 10:30. S10 §7 pedía descargarlo el viernes en el navegador. Vea [P4 → A6](P4_clima_demanda.md#a6--back-test-h1).

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Columnas | **Se leen por nombre, no por posición.** Los nombres reales se conocen al abrir el archivo | Kit A6; S8 §3 |
| Unidades | La columna de caudal, en m³/s según su encabezado. **Volumen diario en hm³ = caudal (m³/s) × 86,400 ÷ 10⁶** | Kit A6; S8, decisión 7 |
| Periodo | Del 14-mar al 14-jul-2026 completo. Punto secundario: 13-may-2026 (no decide H1) | Kit A6 |
| Huecos y ceros | Si hay huecos o ceros en el periodo, se reportan y se usa el respaldo del preregistro: 447.65 hm³ (prensa), rotulado "press-reported; equals the storage drop". **Siempre se dice qué fuente de verdad se usó** | Kit A6, paso 2 |
| Alcance | No equivale a la entrega en parcela: se declara | Kit A6; S8, decisión 7 |

**Prompt: `LBQCH.csv`**
```text
Eres revisor de datos. NO inventes cifras ni nombres de columna.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea /content/drive/MyDrive/Raiz/entradas/LBQCH.csv (prueba la codificación y el separador; dime cuáles usaste) e imprima:
1) los nombres de columna TAL COMO VIENEN y las primeras 5 filas;
2) cuál columna es la fecha y cuál el caudal de salida por obra de toma, elegidas POR NOMBRE (dime por qué); si no hay una columna clara de caudal en m³/s, detente y avísame;
3) primera y última fecha; días que faltan y días con caudal cero o negativo entre el 2026-03-14 y el 2026-07-14;
4) el volumen diario en hm³ = caudal (m³/s) × 86,400 ÷ 10^6 (kit A6) y su suma del 2026-03-14 al 2026-07-14, y del 2026-03-14 al 2026-05-13 (punto secundario);
5) si hubo huecos o ceros: "usar respaldo del preregistro (447.65 hm³, prensa; press-reported; equals the storage drop)", como dice el kit A6.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar:** `Conagua, Sistema de Información Hidrológica (SIH), serie diaria de La Boquilla (LBQCH.csv), descargada el <fecha>`, con su `sha256`. El nombre oficial del producto y la licencia, **por verificar** en el portal del SIH.

---

## 9. Otros datos de terceros

| Dato | Pieza | Qué revisar | Etiqueta y cita |
|---|---|---|---|
| Conagua 2024, «Actualización de la disponibilidad media anual de agua en el acuífero Meoqui-Delicias (0831)», `https://sigagis.conagua.gob.mx/gas1/Edos_Acuiferos_18/chihuahua/DR_0831.pdf` | B2, X3.1 | Que cada cifra que se tome tenga su página y su tabla. Confirmar a qué volumen se refiere el 614 (kit X3.1) | [V] (kit §2.5) |
| Conagua, Estadística Agrícola 2016-2017, Cuadro 3.5 (archivo 29) | A4.2 | La zona piloto no es el distrito: la comparación lo dice (kit A4.2) | [V] (kit A4.2) |
| INIFAP, láminas aplicadas (alfalfa 17.5, algodón 6.8, maíz forrajero 5.5 millares/ha) | Mentorías; B2 | Son láminas aplicadas, no ETc; se comparan con la lámina bruta del modelo (P4, pregunta de las mentorías) | [V] (S9 §5) |
| Prensa: dotaciones (El Diario de Chihuahua), almacenamiento, NAMO | B2, `cifras.csv` | Fecha de publicación y de lectura. Si la nota no se leyó directamente, «por confirmar» (kit B2) | [P] |
| SMN, estación 8044 Delicias | A2 (opcional) | Que sea la estación correcta; diferencia en días frente a POWER (kit A2) | — |
| IMTA / COMEII 2021, eficiencia de conducción | X3.1 | Rango 2012–2016 (`data/params.json`) | [V] (kit §2.5) |

---

## 10. Resumen: cómo citar cada dato

| Dato | En `LEEME.md` (columna fuente) | `url_o_api` en `fuentes_<pieza>.csv` | Licencia |
|---|---|---|---|
| NASA POWER | `NASA POWER Daily API (community=AG), 28.19 N −105.45 O, 1984–2026` | `Raiz_entregas/eto_diaria.csv` | Datos de NASA; texto exacto por verificar |
| HLS L30/S30 v002 | `HLS L30/S30 v002 (NASA LP DAAC; Earth Engine …), <periodo>` | `Raiz_entregas/<archivo>` | Datos abiertos de NASA (términos del catálogo) |
| NASADEM | `NASADEM (NASA/NASADEM_HGT/001), 30 m` | `Raiz_entregas/<archivo>` | «May be used for any purpose without prior permission» |
| SSEBop VIIRS v6 (si A8 se ejecuta) | `SSEBop VIIRS v6 mensual (USGS, 1 km), <periodo>` | `Raiz_entregas/<archivo>` | Dominio público de EE. UU. (USGS) |
| WaPOR v3 (si A8 se ejecuta) | `WaPOR v3 nivel 1 AETI por década (FAO, 300 m), <periodo>` | `Raiz_entregas/<archivo>` | CC-BY-4.0 (kit A8); política de datos abiertos de la FAO |
| Fields of The World 2025 | `Fields of The World 2025 (Source Cooperative, CC-BY-4.0)` | `Raiz_entregas/parcelas_base.geojson` | CC-BY-4.0: atribución obligatoria |
| SIH LBQCH.csv | `Conagua SIH, La Boquilla, serie diaria` | URL de descarga + fecha | Por verificar |

En «References» del README van todas, con la fecha de consulta (kit Q2: «References completas: bibliotecas, datos, artículos y prensa»). La sección **NASA Data** enumera cada dataset de la NASA usado de verdad (POWER, HLS, NASADEM; no GPM). **Sin logotipos de NASA.**
