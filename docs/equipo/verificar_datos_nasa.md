<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Verificar los datos NASA y de terceros antes de usarlos o entregarlos

**Para qué:** cada dato que entra a Raíz se revisa antes de usarlo y antes de entregar la tabla que sale de él. Se revisan:
- unidades;
- rango;
- faltantes;
- fechas;
- proyección (CRS);
- cobertura de la zona;
- licencia y cita.

Así el ensamblador no lo rechaza y nadie tiene que defender ante el jurado una cifra mal leída.

**Cómo se usa:**
1. Cargue el archivo en Colab.
2. Pegue el prompt de su sección en Gemini, debajo del G0 de su pieza o en un chat aparte.
3. Pida **una sola celda** que imprima la verificación.
4. Pegue la salida en la revisión con contexto nuevo (`docs/prompts/para_gemini.md`).

**Reglas:**
- **Rango de control:** solo se usan los que da el kit, con su sección. Si el kit no da rango, el prompt dice «sin rango de control» y solo imprime los valores: no se inventa uno.
- **Nada de memoria:** lo que esta guía marca **«por verificar en el catálogo»** no se pudo abrir desde la máquina de construcción el 14-nov. Antes de afirmarlo en la página, ábralo en el navegador (vea [herramientas.md](herramientas.md)). Ni Gemini ni Claude lo deben «recordar».

## 0. Qué se verificó en el catálogo oficial (14-nov-2026)

| Dato | Qué se confirmó | Dónde | Resultado |
|---|---|---|---|
| HLS L30 v002 | ID `NASA/HLS/HLSL30/v002`; bandas B1–B7, B9–B11; NIR = **B5**; banda `Fmask` | Ficha STAC del catálogo de Earth Engine (`earthengine-stac.storage.googleapis.com/catalog/NASA/NASA_HLS_HLSL30_v002.json`) | Confirmado. Serie desde **2013-04-11** |
| HLS S30 v002 | ID `NASA/HLS/HLSS30/v002`; NIR angosto = **B8A**; SWIR 1 = **B11**; SWIR 2 = **B12**; **B8** = NIR ancho; **B5** = borde rojo 1 | Ficha STAC `NASA_HLS_HLSS30_v002.json` | Confirmado. Serie desde **2015-11-28** |
| Fmask (L30 y S30) | Bit 0 cirrus (reservado, sin uso), **1 nube, 2 adyacente a nube o sombra, 3 sombra, 4 nieve o hielo**, 5 agua, bits 6–7 aerosol | Fichas STAC de HLS | Confirmado; coincide con el kit A3 |
| Escala de HLS en Earth Engine | Las fichas **no declaran** factor de escala por banda. La visualización de ejemplo usa reflectancias entre 0 y 1 | Fichas STAC de HLS | **Por verificar** con un píxel (§2): el 0.0001 y el −9999 del kit A3 son de los archivos de LP DAAC |
| NASADEM | ID `NASA/NASADEM_HGT/001`; banda `elevation` en m, alturas sobre el geoide EGM96; 30 m; misión de febrero de 2000 | Ficha STAC `NASA_NASADEM_HGT_001.json` | Confirmado |
| GPM IMERG V07 | ID `NASA/GPM_L3/IMERG_V07`; banda `precipitation` en **mm/hr**; un dato cada **30 min**; celda de 0.1° | Ficha STAC `NASA_GPM_L3_IMERG_V07.json` | Confirmado. El «agregado diario» del kit A9 hay que calcularlo (§4) |
| WaPOR v3 nivel 1 | ID `FAO/WAPOR/3/L1_AETI_D`; banda `L1-AETI-D`; escala **0.1**; por década (10 días); ~300 m; desde 2018-01-01 | Ficha STAC `FAO/FAO_WAPOR_3_L1_AETI_D.json` | ID confirmado. **Unidades por verificar** (§6) |
| SSEBop VIIRS v6 mensual | ID `projects/usgs-ssebop/viirs_et_v6_monthly`; banda `et`; mm; escala 1.0; 1 km | Catálogo comunitario `awesome-gee-community-datasets` (`docs/projects/usgs_viirs.md`, en GitHub). **No es el catálogo oficial** | ID confirmado. Banda y escala **por verificar** imprimiendo la imagen en Earth Engine |
| NASA POWER | Parámetros, unidades y valor de relleno | No se pudo abrir `power.larc.nasa.gov` desde la máquina de construcción | **Por verificar en el catálogo** (diccionario de parámetros de POWER); el prompt de §1 los lee del propio JSON |
| Fields of The World 2025 | Columnas, escala de la confianza y cita | No se pudo abrir `source.coop` | **Por verificar** |
| SIH `LBQCH.csv` | Nombres de columnas | No hay copia en el repo; S8 §3 lo deja pendiente | **Por verificar al abrir el archivo** |

## Lista general (para cualquier archivo)

| Revisar | Cómo |
|---|---|
| Unidades | Imprima las unidades que trae el propio archivo (encabezado, metadatos o ficha). Una conversión se escribe con su explicación; por ejemplo, «100 mm = 1 millar/ha» (kit B4) |
| Rango | Mínimo y máximo de cada columna numérica. Compárelos solo con el rango de control del kit, si existe |
| Faltantes | Cuente los nulos y los centinelas (por ejemplo, −999 de POWER o el valor de «sin dato» de una exportación). Conviértalos a NaN y repórtelos; nunca los rellene ni los borre en silencio |
| Fechas | Primera y última fecha, días o meses que faltan, fechas repetidas y zona horaria (UTC o local) |
| CRS y escala | CRS del archivo (EPSG) y tamaño de celda. En grados (EPSG:4326), las áreas y pendientes se calculan en metros (reproyectar) |
| Cobertura de la zona | ¿El dato cubre el rectángulo `zona_piloto.bbox` de `data/params.json` y todas las parcelas de `parcelas_base.geojson`? |
| `id` | Todos existen en `parcelas_base.geojson` (cambio c). Excepción: en `etiquetas_unidas.csv`, el `id` es el del polígono de `parcelas_muestra.geojson` |
| Licencia y cita | La línea de `LEEME.md` (fuente), `fuentes_<pieza>.csv` (`url_o_api`, `fecha_consulta`, `sha256`) y la cita para «References» del README (§10) |

---

## 1. NASA POWER (A1, A2, A5, A6 y A9)

**Qué es:** clima diario de un punto, de la NASA POWER Daily API.
- **Endpoint:** `https://power.larc.nasa.gov/api/temporal/daily/point`, con `community=AG` y `format=JSON` (kit A1).
- **Punto:** 28.19 N, −105.45 O (kit A1; `data/params.json` → `zona_piloto.punto_clima`).
- **Periodo:** desde 1981-01-01 hasta la fecha más reciente disponible.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Parámetros | Exactamente `T2M_MAX`, `T2M_MIN`, `RH2M`, `WS2M`, `ALLSKY_SFC_SW_DWN`, `PRECTOTCORR` | Kit A1, paso 1 |
| Unidades | Radiación en MJ m⁻² d⁻¹ y viento a 2 m (kit A1, paso 2). Las demás, **las que declare el propio JSON** (sección de parámetros); **por verificar en el catálogo** de POWER | Kit A1; JSON de POWER |
| `community` | `AG` en la URL de la consulta (la comunidad fija las unidades) | Kit A1 |
| Faltantes | −999 → NaN, contados y reportados. El ensamblador rechaza la tabla desde el 5 % de faltantes | Kit A1, paso 3; `motor/esquemas.py` (acuerdo del 14-nov) |
| Fechas | Una fila por día, sin huecos ni repetidos, desde 1981-01-01 | Kit A1 |
| Lugar | Las coordenadas del JSON coinciden con el punto. POWER es una celda regional, no una estación | Kit A1 y A2 |
| Coherencia | `tmin ≤ tmax`; `lluvia_mm ≥ 0`; `ws2m ≥ 0` | `motor/esquemas.py` |

**Rangos de control** (solo los del kit):
- ETo diaria entre 0 y 15 mm/d (kit A1).
- Suma anual promedio de ETo: rango de control estimado de 1,400–2,600 mm/año en el centro-sur de Chihuahua. Si queda fuera, revise las unidades (kit A1).
- La ETo mensual promedio tiene su pico en mayo–junio (kit A1).
- Lluvia anual promedio: rango de control de 250–500 mm. La zona recibe ~300–400 mm según el maestro; la estación Delicias registra 284 mm (1990–2004) según el documento técnico del acuífero 0831, Conagua 2024 (kit A1).
- Heladas (kit A2):
  - la última helada p50 cae en febrero–abril y la primera p50 en octubre–diciembre;
  - control: INEGI 1983 reporta marzo y noviembre para Delicias.

**Prompt 1: el JSON crudo** (antes de calcular ETo):
```text
Eres revisor de datos. NO inventes cifras ni rangos: imprime solo lo que trae el archivo.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que abra el JSON crudo de NASA POWER e imprima:
1) la URL o los parámetros de la consulta, si vienen en el JSON (¿community = AG?);
2) las coordenadas del punto que devuelve el JSON y si coinciden con 28.19 N, −105.45 O;
3) para cada parámetro (T2M_MAX, T2M_MIN, RH2M, WS2M, ALLSKY_SFC_SW_DWN, PRECTOTCORR): si existe, su nombre largo y sus UNIDADES tal como las declara el JSON. Si el JSON no trae unidades, escribe "unidades: no declaradas en el JSON; por verificar en el catálogo de POWER";
4) el valor de relleno que declare el JSON (se espera -999, kit A1) y cuántos valores lo tienen, por parámetro;
5) primera y última fecha, número de días y días que faltan en el calendario.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Prompt 2: `eto_diaria.csv`** (antes de entregarla o de usarla en A2, A5, A6 o A9):
```text
Eres revisor de datos. NO inventes cifras: usa solo el archivo y los rangos de control que te doy, con su fuente.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea entregas/eto_diaria.csv e imprima:
1) columnas y tipos: ¿son exactamente fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m?
2) primera y última fecha; fechas repetidas; días que faltan en el calendario;
3) por columna: mínimo, máximo, nulos y cuántos -999 quedan (deben ser 0: el -999 se convierte en NaN);
4) ¿toda eto_mm está entre 0 y 15 mm/d? (kit A1);
5) suma anual promedio de eto_mm, solo con años completos, y si cae en 1,400–2,600 mm/año (rango de control estimado, kit A1);
6) mes con mayor eto_mm promedio (debe ser mayo o junio, kit A1);
7) lluvia anual promedio, solo con años completos, y si cae en 250–500 mm (rango de control, kit A1);
8) número de filas con tmin > tmax (debe ser 0); filas con lluvia_mm < 0 o ws2m < 0 (deben ser 0);
9) fracción de faltantes por columna.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar:**
- **`LEEME.md` (fuente):** `NASA POWER Daily API (community=AG), 28.19 N −105.45 O, 1981–2026`, el ejemplo acordado.
- **`fuentes_A1.csv`:** en `url_o_api`, la URL completa de la consulta; `fecha_consulta`; `sha256` del JSON crudo.
- **README → References:** el proyecto NASA POWER (NASA Langley Research Center), Daily API, comunidad AG, con la fecha de consulta. **El texto de agradecimiento y la licencia, por verificar en el catálogo** (páginas de POWER).

---

## 2. HLS L30 y S30 v002 (A3, A3-M y A4.2)

**Qué es:** Harmonized Landsat Sentinel-2, reflectancia de superficie a 30 m (NASA LP DAAC).
- **Colecciones de Earth Engine:** `NASA/HLS/HLSL30/v002` (Landsat 8/9) y `NASA/HLS/HLSS30/v002` (Sentinel-2) (kit A3; verificado en §0).
- Las exportaciones las hace la sesión de Chrome. Usted recibe CSV o GeoTIFF.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Renombrado del NIR | L30: B2 azul, B3 verde, B4 rojo, **B5 NIR**, B6 SWIR1, B7 SWIR2. S30: B2 azul, B3 verde, B4 rojo, **B8A NIR**, **B11 SWIR1**, **B12 SWIR2**. Nunca B8 ni B5 de S30 como NIR | Kit A3, paso 2; catálogo (§0) |
| Fmask | Se enmascaran los bits 1, 2, 3 y 4. **El bit 5 (agua) no se enmascara**: el riego por inundación puede marcarse como agua | Kit A3, paso 3; catálogo (§0) |
| Escala y relleno | Kit A3: escala 0.0001 y relleno −9999 (archivos de LP DAAC). En Earth Engine la ficha no declara escala (§0). **Prueba:** si las medianas de reflectancia están entre 0 y 1, la escala ya está aplicada; si están en miles, falta. **Nunca dos veces.** Una exportación de la sesión de Chrome puede traer su propio factor y su propio valor de «sin dato»: léalos en su línea de `LEEME.md` o pregúntelos | Kit A3; catálogo |
| Omisiones de Fmask | El Fmask de L30 tiene omisiones antes de abr-2022. Busque NDVI anómalos en invierno en los años anteriores | Kit A3, paso 3 |
| Fechas de inicio | L30 desde 2013-04-11; S30 desde 2015-11-28 (§0). El año agrícola 2016 (oct-2015 a sep-2016) empieza solo con L30. Márquelo, como pide A3-M, paso 2 | Catálogo; kit A3-M |
| Año agrícola | Del 1-oct de Y−1 al 30-sep de Y. Para 2026, de oct-2025 a sep-2026 | Kit A3 y A3-M |
| Cobertura | Todas las parcelas de `parcelas_base.geojson` tienen filas. % de parcelas con ≥ 8 meses válidos (meta ≥ 80 %) | Kit A3, prueba |
| Rangos | NDVI y LSWI entre −1 y 1; reflectancias entre 0 y 1 ya escaladas; `p25 ≤ mediana ≤ p75`; `n_validos ≥ 0`; `mes` en formato AAAA-MM | Kit K-ENS; `motor/esquemas.py` |
| Suelo desnudo | Días con NDVI < 0.2 del 1-feb al 30-abr; entre 0 y los días de esa ventana. `dias_desnudo_viento_alto ≤ dias_suelo_desnudo_feb_abr` | S9 §5; `motor/esquemas.py` |

**Controles** (solo los del kit):
- **NDVI de las 3 protagonistas** (kit A3, prueba):
  - la alfalfa, verde casi todo el año, con caídas por corte;
  - el chile, verde en verano y bajo en invierno;
  - el nogal, verde en verano y sin hojas en invierno.
  - Si no se ve así, se notifica.
- **Memoria** (kit A3-M, prueba): % de parcelas-año con estado distinto de `sin_dato`; tabla de acuerdo de 2026 con las etiquetas; sensibilidad 0.35 / 0.40 / 0.45 (S9 §5).

**Prompt: `hls_mensual_parcelas.csv` y `suelo_desnudo.csv`**
```text
Eres revisor de datos. NO inventes cifras ni rangos: usa el archivo y los controles que te doy, con su fuente.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea entregas/hls_mensual_parcelas.csv, entregas/suelo_desnudo.csv y entregas/parcelas_base.geojson e imprima:
1) columnas: ¿hls_mensual_parcelas.csv trae exactamente id, mes, banda, mediana, p25, p75, n_validos? ¿suelo_desnudo.csv trae id, dias_suelo_desnudo_feb_abr, dias_desnudo_viento_alto, ndvi_ultimo_mes, meses_validos?
2) id que no existen en parcelas_base.geojson (deben ser 0) y parcelas de parcelas_base sin filas;
3) meses presentes (formato AAAA-MM) y si cubren de 2025-10 a 2026-09;
4) bandas presentes; para cada banda: mínimo, máximo, nulos. NDVI y LSWI deben estar entre -1 y 1. Si una reflectancia pasa de 1, escribe "escala 0.0001 NO aplicada"; si está entre 0 y 1, "escala ya aplicada" (no la apliques otra vez);
5) filas donde no se cumpla p25 ≤ mediana ≤ p75 (deben ser 0);
6) % de parcelas con 8 o más meses válidos (meta ≥ 80 %, kit A3);
7) en suelo_desnudo.csv: mínimo y máximo de días, y si alguno pasa de los días que hay entre el 1-feb y el 30-abr de 2026 (calcúlalos con el calendario); filas con dias_desnudo_viento_alto > dias_suelo_desnudo_feb_abr (deben ser 0);
8) gráfica del NDVI mensual de las 3 protagonistas (protagonista = true). Describe en una línea si la alfalfa se ve verde casi todo el año con caídas por corte, el chile verde en verano y bajo en invierno, y el nogal verde en verano y sin hojas en invierno (kit A3).
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Prompt: memoria (A3-M)**
```text
Eres revisor de datos. NO inventes cifras: usa los archivos y las reglas de S9 §5 que te pego.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea entregas/memoria_mensual.csv, entregas/memoria_parcelas.csv y entregas/memoria_resumen.csv e imprima:
1) años agrícolas presentes y, para cada uno, cuántas parcelas y si usa L30, S30 o ambas (el año 2016 empieza en oct-2015, antes del inicio de S30: debe marcarse);
2) estados fuera de la lista perenne, verano, invierno, doble, descanso, sin_dato (deben ser 0);
3) filas con meses_verdes > meses_validos (deben ser 0); max_verano y max_invierno entre -1 y 1;
4) % de parcelas-año con estado distinto de sin_dato (kit A3-M, prueba);
5) la franja año por año de las 3 protagonistas;
6) en memoria_resumen.csv: edad_perenne_anios negativa (debe ser 0 filas) y cuántas en null.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar:**
- **`LEEME.md` (fuente):** `HLS L30/S30 v002 (NASA LP DAAC; Earth Engine NASA/HLS/HLSL30/v002 y NASA/HLS/HLSS30/v002), exportación de la sesión de Chrome, <periodo>, zona piloto`.
- **`fuentes_A3.csv`:** en `url_o_api`, el ID de la colección y el nombre del archivo exportado; su `sha256`.
- **README → References:** son las citas que da el catálogo de Earth Engine (§0); en S30, su enlace «cite-as».
  - Masek, J., Ju, J., Roger, J., Skakun, S., Vermote, E., Claverie, M., Dungan, J., Yin, Z., Freitag, B., Justice, C. (2021). *HLS Operational Land Imager Surface Reflectance and TOA Brightness Daily Global 30m v2.0* [Data set]. NASA EOSDIS Land Processes Distributed Active Archive Center. https://doi.org/10.5067/HLS/HLSL30.002
  - *HLS Sentinel-2 Multi-spectral Instrument Surface Reflectance Daily Global 30m v2.0* [Data set]. NASA EOSDIS LP DAAC. https://doi.org/10.5067/HLS/HLSS30.002
- **Licencia:** datos de NASA, de acceso abierto. Términos de uso del catálogo: «NASA promotes the full and open sharing of all data with research and applications communities, private industry, academia, and the general public.»

---

## 3. NASADEM (A9 y elevación de A1)

**Qué es:** modelo de elevación de la NASA (reprocesamiento de SRTM).
- **ID:** `NASA/NASADEM_HGT/001`, banda `elevation` (kit A9; verificado en §0).
- **Archivo acordado:** `nasadem_zona_piloto.tif`: 30 m, EPSG:4326, zona piloto + 2 km. Lo entrega la sesión de Chrome.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Banda y unidades | `elevation`, en metros, sobre el geoide EGM96 | Catálogo (§0) |
| CRS y celda | EPSG:4326; celda de ~1 segundo de arco (~30 m) | Acuerdo (cambio c); catálogo: «1 arc second» |
| Extensión | Cubre `zona_piloto.bbox` más 2 km por lado | Acuerdo (cambio c); kit A9, paso 1 |
| Sin dato | Cuántas celdas sin dato hay y dónde | Lista general |
| Fecha | Dato de una sola vez (misión de febrero de 2000). Las parcelas se renivelan: el relieve fino no es actual | Catálogo; S9 §4 bis |
| Pendiente | **Se calcula en metros**: reproyecte a UTM o convierta el tamaño de celda de grados a metros. En la zona agrícola, la pendiente queda entre 0 y 5 %; si no, revise unidades y proyección | Kit A9, prueba |
| Punto de POWER (A1) | El punto de POWER (kit A1) queda **fuera** del TIF (zona piloto + 2 km). Para la elevación de A1 se pide el valor a la sesión de Chrome o se usa un dato documentado | Kit A1, paso 2; `data/params.json` |
| Rutas | El mapa de acumulación sigue los drenes y canales que se ven en la imagen | Kit A9, prueba |
| Rótulo | "regional, 30 m (NASADEM); not field drainage design" | Kit A9 |

**Prompt: `nasadem_zona_piloto.tif`**
```text
Eres revisor de datos. NO inventes cifras ni rangos.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que abra entregas/nasadem_zona_piloto.tif con rasterio (dime el comando de instalación si hace falta) e imprima:
1) CRS (EPSG), tamaño de celda en grados y su equivalente aproximado en metros, número de filas y columnas, tipo de dato y valor de "sin dato";
2) extensión (oeste, sur, este, norte) y si contiene el rectángulo de la zona piloto que te pego (zona_piloto.bbox de data/params.json) con margen;
3) elevación mínima, máxima y media, y cuántas celdas sin dato;
4) si el punto 28.19 N, -105.45 O (punto de POWER, kit A1) cae dentro o fuera del TIF;
5) pendiente en % calculada EN METROS (reproyecta a la zona UTM que corresponde a la zona piloto e imprime cuál usaste) y su percentil 50 y 95 dentro de la zona piloto. Control del kit A9: entre 0 y 5 % en la zona agrícola.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
[PEGA AQUÍ zona_piloto.bbox de data/params.json]
```

**Cómo citar:**
- **`LEEME.md` (fuente):** `NASADEM (NASA/NASADEM_HGT/001, banda elevation, 30 m), exportado por la sesión de Chrome, zona piloto + 2 km`.
- **README → References** (cita del catálogo): NASA JPL (2020). *NASADEM Merged DEM Global 1 arc second V001* [Data set]. NASA EOSDIS Land Processes DAAC. https://doi.org/10.5067/MEaSUREs/NASADEM/NASADEM_HGT.001
- **Licencia:**
  - términos del catálogo: «Unless otherwise noted, all NASA-produced data may be used for any purpose without prior permission.»;
  - S9 §4 bis: «dominio público».

---

## 4. GPM IMERG V07 (A9)

**Qué es:** lluvia estimada por satélite, de la misión GPM.
- **ID:** `NASA/GPM_L3/IMERG_V07` (kit A9; verificado en §0).
- Se usa para la tormenta de referencia: el percentil 95 de la lluvia diaria de los días con lluvia.
- La extracción la hace la sesión de Chrome. Si no alcanza la cuota, se usa `eto_diaria.csv` (POWER), como permite el kit A9, paso 4.

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Banda y unidades | `precipitation`, en **mm/hr** | Catálogo (§0) |
| Paso de tiempo | Un dato cada 30 minutos. **Lluvia del día = suma de (mm/hr × 0.5 h)** de las medias horas del día. Declare si el día es UTC o local | Catálogo; conversión de unidades |
| Celda | 0.1°, más grande que muchas parcelas: es un dato regional | Catálogo |
| Corrida | El catálogo cita la corrida «Final» (`3B-HH/07`) y la «Late» (`3B-HH-L/07`). Las fechas recientes pueden ser «Late»: declárelo | Catálogo |
| «Día con lluvia» | El kit no fija el umbral: va declarado en `supuestos.json` (P5), con fuente o «assumption» | Kit A9, paso 4 |
| Comparación | Compare la serie con `lluvia_mm` de `eto_diaria.csv` (POWER) en los mismos días. Sin rango de control: solo se reporta | — |

**Prompt: serie diaria de IMERG**
```text
Eres revisor de datos. NO inventes cifras ni umbrales.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea la serie de GPM IMERG que dejó la sesión de Chrome e imprima:
1) columnas, unidades declaradas (se espera mm/hr si viene cada media hora, o mm/día si ya viene agregada) y paso de tiempo;
2) si viene cada media hora: la lluvia diaria = suma de (mm/hr × 0.5) por día, diciendo si el día es UTC o local;
3) primera y última fecha, días que faltan y valores negativos (deben ser 0);
4) el umbral de "día con lluvia" que te pego de supuestos.json (si no lo pego, detente y pídemelo) y el percentil 95 de la lluvia diaria de esos días, con su periodo;
5) la misma estadística con lluvia_mm de eto_diaria.csv (POWER), en los mismos días, para comparar.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar:**
- **`LEEME.md` / `fuentes_A9.csv`:** `GPM IMERG V07 (NASA/GPM_L3/IMERG_V07), lluvia diaria agregada de medias horas, <periodo>, zona piloto`.
- **README → References:** Huffman, G.J., E.F. Stocker, D.T. Bolvin, E.J. Nelkin, J. Tan. *GPM IMERG Final Precipitation L3 Half Hourly 0.1 degree x 0.1 degree V07*. Goddard Earth Sciences Data and Information Services Center (GES DISC). https://doi.org/10.5067/GPM/IMERG/3B-HH/07
  - El texto de cita del catálogo dice «V06», pero su DOI es el de V07: use V07.
- **Licencia** (términos del catálogo): «All NASA-produced data from the GPM mission is made freely available for the public to use.»

---

## 5. SSEBop VIIRS v6 (A8)

**Qué es:** evapotranspiración real estimada con el modelo SSEBop sobre VIIRS (USGS).
- **ID del kit A8:** `projects/usgs-ssebop/viirs_et_v6_monthly`. El ID está confirmado en el catálogo comunitario (§0); no está en el catálogo oficial de Earth Engine.
- **Siempre regional**, nunca por parcela (S8, decisión 4).

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Banda, unidades y escala | `et`, en mm, escala 1.0, según el catálogo comunitario. **Por verificar:** la sesión de Chrome imprime las bandas y propiedades de una imagen | Kit A8, paso 2; catálogo comunitario |
| Resolución | 1 km (1/96°) | S8, decisión 4; catálogo comunitario |
| Periodo | 12 meses, de oct-2025 a sep-2026, en mm por mes | Kit A8, prueba |
| Área | Promedio sobre el rectángulo de la zona piloto. Incluye caminos, parcelas sin clasificar y vegetación no agrícola | Kit A8, pasos 2 y 4 |
| Magnitud absoluta | La documentación del producto advierte que, para balances de agua en valor absoluto, puede requerirse una corrección de sesgo regional (Senay et al. 2020). Apoya el rótulo "regional comparison; not field-level validation" | Catálogo comunitario; kit A8 |

**Prompt: `et_contraste.csv`** (sirve también para WaPOR, §6):
```text
Eres revisor de datos. NO inventes cifras.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea entregas/et_contraste.csv e imprima:
1) columnas: ¿son exactamente mes, et_modelo_mm, et_ssebop_mm, et_wapor_mm?
2) ¿hay 12 meses, de 2025-10 a 2026-09, sin repetidos? (kit A8, prueba);
3) por columna: mínimo, máximo, nulos y valores negativos (deben ser 0). et_wapor_mm puede estar vacía si no hubo acceso a WaPOR (kit A8, paso 3);
4) la conversión de unidades que se aplicó a cada serie, según la explicación del cuaderno; si no está escrita, "REVISAR";
5) diferencia mensual en mm y en % del modelo frente a SSEBop y frente a WaPOR;
6) si algún texto dice "validated" para parcelas (debe ser no) y si aparece el rótulo "regional comparison; not field-level validation".
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar** (catálogo comunitario, `docs/projects/usgs_viirs.md`):
- **README → References:**
  - Senay, G.B., et al. (2023). Improving the Operational Simplified Surface Energy Balance Evapotranspiration Model Using the Forcing and Normalizing Operation. *Remote Sensing* 15(1): 260. https://doi.org/10.3390/rs15010260
  - Senay, G.B., Kagone, S., Velpuri, N.M. (2020). Operational Global Actual Evapotranspiration using the SSEBop model. U.S. Geological Survey data release. https://doi.org/10.5066/P9OUVUUI
- **Licencia:** «USGS-authored or produced data and information are considered to be in the U.S. Public Domain.»

---

## 6. WaPOR v3 nivel 1 (A8)

**Qué es:** evapotranspiración e intercepción reales de la FAO (WaPOR).
- **ID en el catálogo de Earth Engine:** `FAO/WAPOR/3/L1_AETI_D` (§0). El kit A8 pide verificar el acceso: con este ID hay acceso sin descarga pesada.
- **Siempre regional** (S8, decisión 4).

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Banda y escala | `L1-AETI-D`, multiplicada por 0.1 | Catálogo (§0) |
| Unidades | **Por verificar.** La ficha dice dos cosas: en la descripción, «dekadal, in mm/day», el promedio diario de la década; en la banda, «[mm]». Si es mm/día: la ET del mes es la suma, por década, de (valor × 0.1 × días de la década). La tercera década del mes tiene los días que restan. Imprima un valor y compárelo con SSEBop antes de decidir | Catálogo |
| Paso de tiempo | Década (10 días). Tres por mes | Catálogo |
| Resolución | ~300 m | Kit A8; S8, decisión 4; catálogo |
| Contenido | AETI = evaporación del suelo + transpiración + intercepción. No es solo la ET del cultivo | Catálogo |
| Periodo | Desde 2018-01-01: cubre oct-2025 a sep-2026 | Catálogo |

**Prompt:** el de §5 (`et_contraste.csv`). Además pida:
```text
Imprime, para un mes, los valores de las décadas de WaPOR tal como vienen, el factor 0.1 aplicado, los días de cada década y la suma mensual en mm, para que se vea la conversión paso a paso.
```

**Cómo citar:**
- **README → References:** la ficha de Earth Engine cita «FAO 2018. WaPOR Database Methodology: Level 1. Remote Sensing for Water Productivity Technical Report: Methodology Series. Rome, FAO». **La cita específica de la versión 3, por verificar en el portal de WaPOR de la FAO.**
- **Licencia:**
  - kit A8: CC-BY-4.0;
  - la ficha de Earth Engine remite a la política de datos abiertos de la FAO («Open Data Licensing For Statistical Databases»).

  Cite las dos y confirme en el portal de WaPOR.

---

## 7. Fields of The World 2025 (B1)

**Qué es:** predicciones globales de límites de parcelas, hechas con una red neuronal sobre Sentinel-2.
- **Fuente:** Source Cooperative, `source.coop/ftw/global-data`, licencia CC-BY-4.0, en GeoParquet o PMTiles (kit B1).
- **Advertencia:** fuera del dominio de entrenamiento. El benchmark no incluye México, y el riego árido de Norteamérica no está en el entrenamiento (kit A4 y B1).

| Revisar | Qué debe salir | Fuente |
|---|---|---|
| Recorte | Solo el rectángulo de la zona piloto; nunca el producto global | Kit B1, paso 2 |
| Área | `area_ha` calculada en una proyección en metros, no en grados. Se filtran los campos menores de 1 ha | Kit B1, paso 3 |
| Confianza | `ftw_confianza` en escala 0–100. Si la fuente viene en 0–1, se convierte y se dice. Reporte el % de parcelas con confianza < 50; si es > 40 %, se notifica | Kit B1, pasos 3 y prueba |
| Columnas | `id` (único), `area_ha`, `modulo` (null si no puede asignarse), `ftw_confianza`, `protagonista`. En la muestra, además `punto_id` (único) y `bloque` | Tabla 0.4-B; kit §2.2 |
| Protagonistas | Exactamente 3 con `protagonista = true`, revisadas a mano contra color verdadero | Kit B1, paso 4 |
| Geometrías | Polygon o MultiPolygon válidos, dentro del rectángulo | `motor/esquemas.py` |
| Columnas de origen y cita formal | **Por verificar** en `source.coop` (no se pudo abrir el 14-nov) | — |

**Prompt: `parcelas_base.geojson`**
```text
Eres revisor de datos. NO inventes cifras.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea entregas/parcelas_base.geojson (y parcelas_muestra.geojson si existe) con geopandas e imprima:
1) CRS, número de parcelas, columnas, tipos de geometría y geometrías inválidas;
2) ¿están id, area_ha, modulo, ftw_confianza, protagonista? (en la muestra, además punto_id y bloque) ¿Hay id o punto_id repetidos?
3) area_ha: mínimo y máximo; y area_ha recalculada en una proyección en metros (dime cuál) frente a la del archivo (diferencia máxima en %); parcelas con menos de 1 ha (kit B1: se filtran);
4) ftw_confianza: mínimo y máximo (escala 0–100, kit B1) y % de parcelas con confianza < 50 (si es > 40 %, avísame, kit B1);
5) cuántas tienen protagonista = true (deben ser 3) y sus id;
6) parcelas que caen fuera del rectángulo de la zona piloto que te pego.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
[PEGA AQUÍ zona_piloto.bbox de data/params.json]
```

**Cómo citar:**
- **`LEEME.md` (fuente):** `Fields of The World 2025 (Source Cooperative, source.coop/ftw/global-data, CC-BY-4.0), recorte de la zona piloto`.
- **README → References:** Fields of The World, predicciones globales de límites de parcelas 2025, Source Cooperative, CC-BY-4.0. **La cita formal, por verificar** en `source.coop`.
- **Licencia:**
  - CC-BY-4.0 exige atribución: va en References y en la página;
  - frase obligatoria de la página: "Field boundaries are NN predictions outside the model's training domain; filtered by confidence and manually reviewed for the showcased fields." (kit A4).

---

## 8. SIH: LBQCH.csv (A6)

**Qué es:** la serie diaria oficial de la presa La Boquilla, del Sistema de Información Hidrológica de Conagua.
- Se descargó en el navegador el viernes 13 (S10 §7).
- Es la **verdad** del back-test H1: salida por obra de toma del 14-mar al 14-jul-2026 (kit A6; S8, decisión 7).

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
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea entradas/LBQCH.csv (prueba la codificación y el separador; dime cuáles usaste) e imprima:
1) los nombres de columna TAL COMO VIENEN y las primeras 5 filas;
2) cuál columna es la fecha y cuál el caudal de salida por obra de toma, elegidas POR NOMBRE (dime por qué); si no hay una columna clara de caudal en m³/s, detente y avísame;
3) primera y última fecha; días que faltan y días con caudal cero o negativo entre el 2026-03-14 y el 2026-07-14;
4) el volumen diario en hm³ = caudal (m³/s) × 86,400 ÷ 10^6 (kit A6) y su suma del 2026-03-14 al 2026-07-14, y del 2026-03-14 al 2026-05-13 (punto secundario);
5) si hubo huecos o ceros: "usar respaldo del preregistro (447.65 hm³, prensa; press-reported; equals the storage drop)", como dice el kit A6.
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```

**Cómo citar:**
- **`LEEME.md` / `fuentes_A6.csv`:** `Conagua, Sistema de Información Hidrológica (SIH), serie diaria de La Boquilla (LBQCH.csv), descargada el 2026-11-13`, con su `sha256`.
- **README → References:** el nombre oficial del producto y la licencia, **por verificar** en el portal del SIH.

---

## 9. Otros datos de terceros

| Dato | Pieza | Qué revisar | Etiqueta y cita |
|---|---|---|---|
| Conagua 2024, «Actualización de la disponibilidad media anual de agua en el acuífero Meoqui-Delicias (0831)», `https://sigagis.conagua.gob.mx/gas1/Edos_Acuiferos_18/chihuahua/DR_0831.pdf` | B2, X3.1 | Que cada cifra que se tome tenga su página y su tabla. Confirmar a qué volumen se refiere el 614 (kit X3.1) | [V] (kit §2.5) |
| Conagua, Estadística Agrícola 2016-2017, Cuadro 3.5 (archivo 29) | A4.2 | La zona piloto no es el distrito: la comparación lo dice (kit A4.2) | [V] (kit A4.2) |
| Prensa: dotaciones (El Diario de Chihuahua), almacenamiento, NAMO | B2, `cifras.csv` | Fecha de publicación y de lectura. Si la nota no se leyó directamente, «por confirmar» (kit B2) | [P] |
| SMN, estación 8044 Delicias | A2 (opcional) | Que sea la estación correcta; diferencia en días frente a POWER (kit A2) | — |
| INEGI, LiDAR de 5 m (solo si cubre la zona) | A9, paso 6 | Año de vuelo, datum y exactitud del metadato (S9 §4 bis) | «Fuente: INEGI, nombre del producto», con aviso de transformación (S9 §4 bis) |
| IMTA / COMEII 2021, eficiencia de conducción | X3.1 | Rango 2012–2016 (`data/params.json`) | [V] (kit §2.5) |

---

## 10. Resumen: cómo citar cada dato

| Dato | En `LEEME.md` (columna fuente) | `url_o_api` en `fuentes_<pieza>.csv` | Licencia |
|---|---|---|---|
| NASA POWER | `NASA POWER Daily API (community=AG), 28.19 N −105.45 O, 1981–2026` | URL completa de la consulta | Datos de NASA; texto exacto por verificar |
| HLS L30/S30 v002 | `HLS L30/S30 v002 (NASA LP DAAC; Earth Engine …), <periodo>` | ID de la colección + archivo exportado | Datos abiertos de NASA (términos del catálogo) |
| NASADEM | `NASADEM (NASA/NASADEM_HGT/001), 30 m` | ID + archivo exportado | «May be used for any purpose without prior permission» |
| GPM IMERG V07 | `GPM IMERG V07 (NASA/GPM_L3/IMERG_V07), <periodo>` | ID + archivo exportado | «Freely available for the public to use» |
| SSEBop VIIRS v6 | `SSEBop VIIRS v6 mensual (USGS, 1 km), <periodo>` | `projects/usgs-ssebop/viirs_et_v6_monthly` + archivo | Dominio público de EE. UU. (USGS) |
| WaPOR v3 | `WaPOR v3 nivel 1 AETI por década (FAO, 300 m), <periodo>` | `FAO/WAPOR/3/L1_AETI_D` + archivo | CC-BY-4.0 (kit A8); política de datos abiertos de la FAO |
| Fields of The World 2025 | `Fields of The World 2025 (Source Cooperative, CC-BY-4.0)` | `source.coop/ftw/global-data` + recorte | CC-BY-4.0: atribución obligatoria |
| SIH LBQCH.csv | `Conagua SIH, La Boquilla, serie diaria` | URL de descarga + fecha | Por verificar |

En «References» del README van todas, con la fecha de consulta (kit Q2: «References completas: bibliotecas, datos, artículos y prensa»). La sección **NASA Data** enumera cada dataset de la NASA usado (kit Q2). **Sin logotipos de NASA.**
