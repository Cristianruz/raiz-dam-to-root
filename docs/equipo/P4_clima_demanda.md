<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# P4 · Clima, demanda, back-test, relieve y contraste de ET

**Qué le toca** (S9 §10; kit §3, A8 y A9):
- clima NASA POWER y ETo (A1);
- heladas (A2);
- demanda de agua con banda (A5);
- relieve y tormenta (A9);
- back-test H1 (A6);
- contraste regional de ET (A8).

**Lo que cambió hoy y manda sobre el kit** (detalle en [README §6](README.md#6-cambios-respecto-al-kit-mandan-sobre-el-kit)):
- **Usted no usa Earth Engine.** La sesión de Claude en el Chrome de Cristian (proyecto `iondroplet`) hace:
  - la exportación de NASADEM (A9, paso 1);
  - la serie de GPM IMERG (A9, paso 4);
  - SSEBop y WaPOR (A8, pasos 2 y 3).

  **Su trabajo empieza con los CSV o TIF que esa sesión deja en Drive.** NASA POWER no es Earth Engine: esa API sí la usa usted (A1).
- **Entrega** en `Raiz/entregas/`, carpeta plana sin `P4/`, con una línea por archivo en `Raiz/entregas/LEEME.md`. Donde el kit dice `data/processed/…` o `docs/resultado_H1.md`, se entrega en `Raiz/entregas/`.
- **Nombres exactos** de la tabla 0.4-B o del acuerdo de formatos del 14-nov ([README §6, cambio e](README.md#6-cambios-respecto-al-kit-mandan-sobre-el-kit)). Un archivo con otro nombre no entra. El acuerdo cambió dos piezas suyas:
  - **A5:** el motor del cubo lee `rotaciones.json` y `demanda_cultivos.csv`, las dos salidas de A5 en el formato acordado. Hoy las entrega la sesión de datos; usted las verifica. `demanda_parcelas.csv` y `etc_mensual.csv` (tabla 0.4-B) se siguen aceptando, pero el cubo ya no los lee. Detalle en [A5](#a5--demanda-de-agua-por-opción-con-banda).
  - **A9:** la tormenta P95 va en `relieve_meta.json`, junto con el rótulo y el umbral de las rutas. Ya no se le pasa a mano a P5; si la cifra aparece en la página, P5 la copia de ese archivo a `cifras.csv`.

| Orden | Pieza | Archivos que entrega | Hora límite |
|---|---|---|---|
| 1 | [A1 · POWER y ETo](#a1--clima-nasa-power-y-eto-fao-56) | `eto_diaria.csv`, `fuentes_A1.csv` | sáb 12:00 |
| 2 | [A2 · heladas](#a2--heladas-por-fecha) | `heladas.json`, `fuentes_A2.csv` | sáb 12:00 |
| 3 | [A5 · demanda con banda](#a5--demanda-de-agua-por-opción-con-banda) | Verificar `rotaciones.json` y `demanda_cultivos.csv` (los entrega la sesión de datos; cambio e). Solo si Cristian se lo pide: `demanda_parcelas.csv`, `etc_mensual.csv`, figura del tornado, `fuentes_A5.csv` | Entrega entre sáb 15:00 y 18:00 |
| 4 | [A9 · relieve y tormenta](#a9--relieve-y-simulación-de-tormenta) | `relieve_rutas.geojson`, `relieve_meta.json` (cambio e), `relieve_parcelas.csv`, `fuentes_A9.csv` | Pasos 1–4 (núcleo): sáb 20:30. Pasos 5–6: dom 8:00 |
| 5 | [A6 · back-test H1](#a6--back-test-h1) | `resultado_H1.md`, figura PNG, `fuentes_A6.csv` | Arranque sáb 18:00. Terminado entre dom 8:00 y 11:00 |
| 6 | [A8 · contraste de ET](#a8--contraste-regional-de-et) | `et_contraste.csv`, figura PNG, `fuentes_A8.csv` | Dom, antes de las 11:00; solo si A5 está entregada |

- **Cómo se usa cada bloque:**
  1. Abra un cuaderno en Colab y monte Drive.
  2. Pegue el bloque en Gemini y pida **una celda por paso**.
  3. Corra la prueba y verifique los datos con [verificar_datos_nasa.md](verificar_datos_nasa.md).
  4. Pida la revisión de `docs/prompts/para_gemini.md` con contexto nuevo.
  5. Guarde en `Raiz/entregas/` con su línea en `LEEME.md` y avise.
- **Antes de cada pieza, mire `Raiz/entregas/LEEME.md`.** Si el archivo ya tiene su línea (por ejemplo, `eto_diaria.csv` hecho por la sesión de datos), no lo rehaga: verifíquelo y avise a Cristian.

---

## A1 · Clima NASA POWER y ETo FAO-56

| | |
|---|---|
| **Entradas** | NASA POWER Daily API. Esta sí la descarga usted desde Colab |
| **Cuaderno** | `A1_power_eto.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00. A2, A5, A6 y A9 dependen de este archivo |
| **Verificación de datos** | [verificar_datos_nasa.md → NASA POWER](verificar_datos_nasa.md#1-nasa-power-a1-a2-a5-a6-y-a9) |

**Elevación del paso 2: no use Earth Engine.**
- El punto de POWER queda fuera de `nasadem_zona_piloto.tif`, que cubre la zona piloto más 2 km. Compruébelo con una celda: compare el punto con la extensión del TIF.
- Use una de dos opciones y declare cuál:
  - (a) pida a la sesión de Chrome el valor de NASADEM en el punto (una sola consulta);
  - (b) use un dato documentado, con su fuente.

**FAO-56 (Allen et al. 1998), ec. 6.** El PDF no está en el repo; pídalo a Cristian. El prompt permite usar `pyfao56`.

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P4 Clima, demanda y back-test.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A1.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A1.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual; aquí solo eto_diaria.csv; heladas.json es la tarea A2):
| A1 y A2 (P4) | `eto_diaria.csv` y `heladas.json` | (fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m); estructura de A2 |
Además: fuentes_A1.csv (archivo, url_o_api, fecha_consulta, sha256). En eto_diaria.csv: fecha en formato AAAA-MM-DD, una fila por día; ningún -999 (se convierte en NaN y se cuenta).

DOCUMENTOS DE REFERENCIA (pegados)
[PEGA AQUÍ la ecuación 6 de FAO-56 (Allen et al. 1998) y sus ecuaciones auxiliares, del PDF que te pase Cristian. Si no está, usa pyfao56 y dilo.]
[PEGA AQUÍ la elevación del punto con su fuente: valor de NASADEM que te dé la sesión de Chrome, u otro dato documentado.]

TAREA
NOTA DEL EQUIPO: no uso Earth Engine. La elevación del paso 2 sale del texto pegado arriba; si no está, detente y pídemela. Antes de calcular, imprime la sección de parámetros y unidades que trae el propio JSON de POWER, y el valor de relleno que declare.
Tarea A1. En A1_power_eto.ipynb (Colab; el cuaderno se guarda en Raiz/cuadernos/):
1) Descargue de la NASA POWER Daily API (endpoint https://power.larc.nasa.gov/api/temporal/daily/point, community=AG, format=JSON), para el punto 28.19 N, −105.45 W, del 1981-01-01 a la fecha más reciente disponible, los siguientes parámetros: T2M_MAX, T2M_MIN, RH2M, WS2M, ALLSKY_SFC_SW_DWN y PRECTOTCORR. Antes de utilizarlos, verifique en la documentación de POWER los nombres exactos y las unidades. Guarde el JSON crudo en Raiz/cuadernos/ (Cristian lo pasa a data/raw/power/) y regístrelo en fuentes_A1.csv (en Raiz/entregas/) (archivo, url, fecha, sha256).
2) Calcule la ETo diaria con FAO-56 Penman-Monteith (Allen et al. 1998, ec. 6). Utilice la elevación del punto (obténgala de NASADEM en Earth Engine, ID NASA/NASADEM_HGT/001, o de un dato documentado) y verifique cuidadosamente las unidades de radiación (MJ m-2 d-1) y el viento a 2 m. Si falta una variable, documente el tratamiento aplicado. Puede utilizar pyfao56 o implementarlo, pero explique cada paso.
3) Valores faltantes de POWER (-999): márquelos como NaN y reporte cuántos hay.
4) Guarde eto_diaria.csv en Raiz/entregas/ (fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m).

PRUEBA DE ACEPTACIÓN (imprímala):
- ETo diaria siempre entre 0 y 15 mm/d.
- Suma anual promedio de ETo: repórtela. [Rango de control estimado: 1,400–2,600 mm/año en el centro-sur de Chihuahua; si queda fuera, revise las unidades antes de continuar.]
- Gráfica de ETo mensual promedio (debe presentar su pico en mayo–junio).
- Lluvia anual promedio. [Rango de control: 250–500 mm; la zona recibe ~300–400 mm según el maestro; la estación Delicias registra 284 mm (1990–2004) según el documento técnico del acuífero 0831, Conagua 2024.]
Explique en 5 líneas qué es la ETo y por qué se utiliza.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En datos/A1_power_eto.ipynb (Colab):» → «En A1_power_eto.ipynb (Colab; el cuaderno se guarda en Raiz/cuadernos/):»
- «Guarde el JSON crudo en data/raw/power/ y regístrelo en fuentes_A1.csv» → «Guarde el JSON crudo en Raiz/cuadernos/ (Cristian lo pasa a data/raw/power/) y regístrelo en fuentes_A1.csv (en Raiz/entregas/)»
- «Guarde data/processed/eto_diaria.csv (» → «Guarde eto_diaria.csv en Raiz/entregas/ (»

**Prueba de aceptación** (kit A1):
```text
PRUEBA DE ACEPTACIÓN (imprímala):
- ETo diaria siempre entre 0 y 15 mm/d.
- Suma anual promedio de ETo: repórtela. [Rango de control estimado: 1,400–2,600 mm/año en el centro-sur de Chihuahua; si queda fuera, revise las unidades antes de continuar.]
- Gráfica de ETo mensual promedio (debe presentar su pico en mayo–junio).
- Lluvia anual promedio. [Rango de control: 250–500 mm; la zona recibe ~300–400 mm según el maestro; la estación Delicias registra 284 mm (1990–2004) según el documento técnico del acuífero 0831, Conagua 2024.]
Explique en 5 líneas qué es la ETo y por qué se utiliza.
```

**Plan B** (kit A1). El CSV se baja en el navegador y se carga a `Raiz/cuadernos/`, en lugar de `data/raw/power/`:
**Plan B:** si el API falla, descargar el CSV desde el visor de POWER Data Access y cargarlo manualmente a `data/raw/power/`.

**Líneas de LEEME.md** (la primera es el ejemplo acordado):
```text
eto_diaria.csv | NASA POWER Daily API (community=AG), 28.19 N −105.45 O, 1981–2026 | 2026-11-14 | colab/A1_power_eto.ipynb
fuentes_A1.csv | Fuentes de A1: JSON crudo de NASA POWER (sha256) y elevación del punto | 2026-11-14 | colab/A1_power_eto.ipynb
```
Aviso: `ENTREGA: eto_diaria.csv — prueba OK`.

---

## A2 · Heladas por fecha

| | |
|---|---|
| **Entradas** | `eto_diaria.csv` (A1). Opcional: la serie de la estación 8044 Delicias del SMN, si está en `Raiz/entradas/` |
| **Cuaderno** | `A2_heladas.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00. P5 la usa en B3 (filtro de siembra y heladas) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P4 Clima, demanda y back-test.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A2.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A2.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual; aquí solo heladas.json, con la "estructura de A2" del paso 5):
| A1 y A2 (P4) | `eto_diaria.csv` y `heladas.json` | (fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m); estructura de A2 |
Además: fuentes_A2.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
Ninguno adicional: los rangos de control vienen en el prompt.

TAREA
NOTA DEL EQUIPO: POWER es una celda regional, no una estación. El campo "fuente" de heladas.json dice de qué serie sale (eto_diaria.csv, NASA POWER) y, si se usó, la estación del SMN.
Tarea A2. En A2_heladas.ipynb (Raiz/cuadernos/), con eto_diaria.csv de Raiz/entregas/ (columna tmin):
1) Defina helada = Tmin ≤ 0 °C. Para cada año con datos completos, obtenga la fecha de la ÚLTIMA helada de primavera (enero–junio) y la PRIMERA de otoño (julio–diciembre).
2) Calcule los percentiles 10, 50 y 90 de cada una (en día del año y como fecha).
   - Nota: para la última de primavera, el percentil 90 corresponde a la helada tardía.
   - Para la primera de otoño, el percentil 10 corresponde a la helada temprana.
3) Si existe en Raiz/entradas/ la serie del SMN con la estación de referencia 8044 Delicias, repita el cálculo con la estación y compare.
   - POWER es una celda regional, no una estación. Reporte la diferencia en días.
4) Calcule la probabilidad de helada después de cada fecha de siembra entre el 1-feb y el 15-abr (cada 7 días).
5) Guarde heladas.json en Raiz/entregas/:
   - {"ultima_primavera": {p10, p50, p90}, "primera_otono": {...}, "prob_helada_despues_de": {"02-01": 0.xx, ...}, "fuente": "..."}

PRUEBA DE ACEPTACIÓN:
- La última helada p50 debe ubicarse en febrero–abril y la primera p50 en octubre–diciembre. [Control: INEGI 1983 reporta marzo y noviembre para Delicias.]
- Si no se ubica en esos rangos, revise el código antes de continuar.
Explique cómo se utilizará este resultado para el chile.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En datos/A2_heladas.ipynb, con data/processed/eto_diaria.csv (columna tmin):» → «En A2_heladas.ipynb (Raiz/cuadernos/), con eto_diaria.csv de Raiz/entregas/ (columna tmin):»
- «Si existe data/raw/smn/ con la estación» → «Si existe en Raiz/entradas/ la serie del SMN con la estación»
- «Guarde data/processed/heladas.json:» → «Guarde heladas.json en Raiz/entregas/:»

**Prueba de aceptación** (kit A2):
```text
PRUEBA DE ACEPTACIÓN:
- La última helada p50 debe ubicarse en febrero–abril y la primera p50 en octubre–diciembre. [Control: INEGI 1983 reporta marzo y noviembre para Delicias.]
- Si no se ubica en esos rangos, revise el código antes de continuar.
Explique cómo se utilizará este resultado para el chile.
```

**Plan B:** el kit no trae uno para A2. Si la estación del SMN no está, se hace solo con POWER y se declara.

**Líneas de LEEME.md:**
```text
heladas.json | Derivado de eto_diaria.csv (NASA POWER Daily, community=AG); helada = Tmin ≤ 0 °C; percentiles 10, 50 y 90 | 2026-11-14 | colab/A2_heladas.ipynb
fuentes_A2.csv | Fuentes de A2: eto_diaria.csv (sha256) y, si se usó, la serie del SMN | 2026-11-14 | colab/A2_heladas.ipynb
```
Aviso: `ENTREGA: heladas.json — prueba OK`.

---

## A5 · Demanda de agua por opción, con banda

| | |
|---|---|
| **Entradas** | `eto_diaria.csv` (A1); `supuestos.json` (P5, B3) y las opciones de rotación de B3 (P5; mientras no lleguen, pida a Cristian su diseño provisional, `data/opciones_b4.json`); `hls_mensual_parcelas.csv` (A3, para el nogal y las etapas); `cultivos_parcelas.csv` (A4.2) |
| **Documentos que no están en el repo (pídalos a Cristian)** | Archivo 27, §2.1 (FAO-56, Tabla 12, Kc) y §2.2 (Tabla 11, duraciones); maestro §5.2 (fechas de siembra); INIFAP 2017; archivo 33, módulo de clima, paso 4 (lluvia efectiva); preregistro (periodo de referencia del clima) |
| **Cuaderno** | `A5_demanda.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00–18:00; entrega entre 15:00 y 18:00 (kit §3) |

**A5 cambió con el acuerdo de formatos del 14-nov (cambio e). Léalo antes de empezar:**
- **Lo que lee el cubo.** El motor del cubo (`motor/b4_cubo.py`) toma la lámina de dos salidas de A5, que hoy entrega la sesión de datos:
  - `rotaciones.json`: llaves `params` (cada una con `valor` y `etiqueta`), `cultivos`, `rotaciones` y `anios_clima`. Cada rotación lleva `id`, `nombre`, `cultivos` (lista; vacía = descanso), `plazo` (`alfalfa`, `nogal` o `anual`), `plazo_anios` (`min` ≤ `max`) y `lamina_bruta_millares` con las llaves exactas `"0"` y `"-20"`; en cada una, `p10`, `p50`, `p90`, `neta_mm_p50` y `etc_mm_p50`;
  - `demanda_cultivos.csv`: `cultivo, lluvia_pct, etc_mm_p50, neta_mm_p50, bruta_millares_p10, bruta_millares_p50, bruta_millares_p90`, para los cultivos sueltos sin rotación.
- **`rotaciones.json` ya no es una entrada de P5.** Es la salida de A5 y sustituye a la lista de opciones del kit B3. Solo quien entrega A5 guarda un archivo con ese nombre: en la carpeta plana, dos archivos iguales se pisan.
- **`demanda_parcelas.csv` y `etc_mensual.csv`** (tabla 0.4-B) se siguen validando si llegan, pero el cubo ya no los lee.
- **Qué hace usted.** Si `rotaciones.json` y `demanda_cultivos.csv` ya tienen línea en `LEEME.md`, no los rehaga: verifíquelos con el prompt de verificación de abajo, que aplica la prueba de A5, y avise a Cristian. El bloque del kit (abajo) solo se corre si Cristian le pide hacer A5. En ese caso, pregúntele en qué archivos entrega: los del acuerdo o los de la tabla 0.4-B.

**Si `supuestos.json` no trae lo que el cálculo necesita, deténgase y avise.** Nunca ponga un valor «típico». Lo que debe traer:
- el rango de eficiencia parcelaria;
- la relación cobertura–Kc del nogal;
- el cultivo representativo de `forraje_verano`, si se usa.

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P4 Clima, demanda y back-test.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A5.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A5.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A5 (P4) | `demanda_parcelas.csv`, `etc_mensual.csv` y figura del tornado | (id, opcion, lluvia_pct, bruta_mm_p10, bruta_mm_p50, bruta_mm_p90, neta_mm_p50, etc_mm_p50); (id, opcion, mes, etc_mm_p50) |
Además: fuentes_A5.csv (archivo, url_o_api, fecha_consulta, sha256). lluvia_pct solo vale 0 o -20. En cada fila, bruta_mm_p10 ≤ bruta_mm_p50 ≤ bruta_mm_p90. Los id son los de parcelas_base.geojson; los nombres de opcion, los de las opciones de B3 que te pego.
CAMBIO ACORDADO EL 14-NOV: el cubo lee la lámina de rotaciones.json y demanda_cultivos.csv (salidas de A5 en otro formato), que entrega otra sesión. NO escribas archivos con esos nombres salvo que te lo pida y te pegue su formato.

DOCUMENTOS DE REFERENCIA (pegados)
S8, decisión 5 (copiada tal cual):
| 5 | Nogal | Kc en función de la cobertura del dosel estimada con NDVI; se muestra como rango |
S9 §5, primera viñeta de cálculo (copiada tal cual):
- **Lámina bruta en parcela** L = (ETc − lluvia efectiva) ÷ eficiencia parcelaria, con P10, P50 y P90 (S3; sin cambio).
[PEGA AQUÍ archivo 27 §2.1 (FAO-56, Tabla 12) y §2.2 (Tabla 11), que te pasa Cristian.]
[PEGA AQUÍ maestro §5.2 (fechas de siembra) e INIFAP 2017, que te pasa Cristian.]
[PEGA AQUÍ archivo 33, módulo de clima, paso 4 (fórmulas de lluvia efectiva), que te pasa Cristian.]
[PEGA AQUÍ el periodo de referencia del clima que fija el preregistro, que te pasa Cristian.]
[PEGA AQUÍ el contenido de supuestos.json (P5): eficiencia parcelaria, relación cobertura–Kc del nogal y cultivo representativo de forraje_verano.]
[PEGA AQUÍ las opciones de rotación de B3 que te pase Cristian o P5 (secuencias y fechas de siembra).]

TAREA
NOTA DEL EQUIPO: los parámetros inciertos se sortean UNA vez por corrida y se reutilizan en todas las parcelas, opciones y variantes de lluvia (semilla fija). Si falta un documento o un valor de supuestos.json, detente y avísame. Las opciones de rotación de B3 te las pego: ya no vienen en rotaciones.json, que es una salida de A5 (cambio acordado el 14-nov).
Tarea A5. En A5_demanda.ipynb (Raiz/cuadernos/):
1) Para cada cultivo y para cada opción de rotación (definidas por B3; se las pego), calcule la ETc diaria = Kc × ETo con los Kc de FAO-56, Tabla 12 (archivo 27, sección 2.1) y las duraciones de etapa de FAO-56, Tabla 11 (archivo 27, sección 2.2). Las fechas de siembra provienen del maestro (sección 5.2) y de INIFAP 2017; las fechas de las etapas pueden ajustarse con el NDVI de A3.
   - Alfalfa: Kc mid 0.95 para el balance anual (efecto promediado de cortes) y 1.20 / 1.15 (mid / end) por periodo de corte. Use 0.95 en el balance anual y declare la versión utilizada.
   - Nogal pecanero (S8, decisión 5): Kc en función de la cobertura del dosel estimada con el NDVI de A3; el resultado se muestra como rango. Valores publicados de referencia: 0.3 en huerta joven a 1.1–1.39 en huerta madura [V según la investigación]. La relación entre cobertura y Kc se lee de supuestos.json con su fuente; si no está declarada, deténgase y notifíquelo. Variante de sensibilidad: FAO-56 "Stone fruit" sin cobertura y con helada, 0.45 / 0.90 / 0.65.
   - Ajuste por clima árido: Kc mid con la Ec. 62 de FAO-56, con u2 y RHmin de NASA POWER; p = p_tab + 0.04(5 − ETc), acotado a 0.1–0.8.
   - Si el mapa usa la clase agrupada "forraje_verano", calcule su demanda con el cultivo representativo declarado en supuestos.json y dígalo en la salida.
2) Lluvia efectiva: con la fórmula USDA-SCS y, como escenario conservador, la FAO "dependable rain" (fórmulas en el archivo 33, módulo de clima, paso 4). Utilice la conservadora por defecto.
3) Cadena:
   - lámina neta = ETc − lluvia efectiva;
   - lámina bruta EN PARCELA = neta ÷ eficiencia parcelaria;
   - más presiembra y fracción de lavado.
   La lámina bruta en parcela es la que usa la herramienta (millares por hectárea en la toma de la parcela). La eficiencia de conducción NO entra aquí: se usa en A6 y en La gota.
   EFICIENCIA PARCELARIA: no existe un valor medido para el DR-005. Trátela como PARÁMETRO DE ESCENARIO: lea su rango de supuestos.json, donde el equipo lo declara como "assumption" con su justificación. No escriba un valor "típico" de memoria; si el rango no está declarado, deténgase y notifíquelo.
4) MONTE CARLO con 2,000 corridas (10,000 si el tiempo lo permite):
   - clima: años históricos completos del periodo de referencia que fije el preregistro (cada corrida toma la ETo y la lluvia de un año);
   - ETo ± sesgo;
   - Kc en su rango;
   - eficiencia parcelaria: uniforme en el rango declarado (supuesto, rotulado como tal);
   - presiembra 15–20 cm.
   Los parámetros inciertos se sortean una vez por corrida y son comunes a todas las parcelas. Se obtiene la lámina bruta anual en parcela P10/P50/P90 por parcela y opción. Las secuencias de más de un año se anualizan (total ÷ años de la secuencia).
5) Variante de lluvia: repita con la lluvia diaria multiplicada por 0.8 (lluvia −20%). Se obtienen las 2 variantes del cubo (lluvia_pct = 0 y −20). NO se calculan escenarios de temperatura.
6) Guarde en Raiz/entregas/ demanda_parcelas.csv (id, opcion, lluvia_pct, bruta_mm_p10, bruta_mm_p50, bruta_mm_p90, neta_mm_p50, etc_mm_p50) y etc_mensual.csv (id, opcion, mes, etc_mm_p50).

PRUEBA DE ACEPTACIÓN (imprímala):
- ETc anual de alfalfa (neta, sin eficiencias): repórtela. [Rango de control estimado: 1,100–1,700 mm.] Compárela con la lámina INIFAP de 170–180 cm (que es lámina aplicada) y reporte la eficiencia implícita = ETc neta / lámina INIFAP.
- ETc de algodón vs ~68 cm aplicados (INIFAP) y de chile vs ~92 cm: la misma comparación.
- Que P10 ≤ P50 ≤ P90 en todas las filas.
- Gráfico de tornado con el efecto de cada parámetro.
Explique qué parámetro tiene mayor influencia en la incertidumbre.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En datos/A5_demanda.ipynb:» → «En A5_demanda.ipynb (Raiz/cuadernos/):»
- «6) Guarde demanda_parcelas.csv (» → «6) Guarde en Raiz/entregas/ demanda_parcelas.csv (»

**Ajustes por el acuerdo de formatos (cambio e):**
- «(definidas por B3 en rotaciones.json)» → «(definidas por B3; se las pego)»;
- «los nombres de opcion, los de rotaciones.json» → «los nombres de opcion, los de las opciones de B3 que te pego»;
- se agregaron el aviso «CAMBIO ACORDADO EL 14-NOV», la última frase de la NOTA DEL EQUIPO y el «[PEGA AQUÍ las opciones de rotación de B3 …]».

**Prueba de aceptación** (kit A5):
```text
PRUEBA DE ACEPTACIÓN (imprímala):
- ETc anual de alfalfa (neta, sin eficiencias): repórtela. [Rango de control estimado: 1,100–1,700 mm.] Compárela con la lámina INIFAP de 170–180 cm (que es lámina aplicada) y reporte la eficiencia implícita = ETc neta / lámina INIFAP.
- ETc de algodón vs ~68 cm aplicados (INIFAP) y de chile vs ~92 cm: la misma comparación.
- Que P10 ≤ P50 ≤ P90 en todas las filas.
- Gráfico de tornado con el efecto de cada parámetro.
Explique qué parámetro tiene mayor influencia en la incertidumbre.
```

**Plan B** (kit A5):
**Plan B:** si el Monte Carlo no está a tiempo, un rango simple (mínimo y máximo de la eficiencia parcelaria declarada), rotulado «simple range».

**Líneas de LEEME.md:**
```text
demanda_parcelas.csv | FAO-56 (Kc × ETo) con eto_diaria.csv (NASA POWER), opciones de B3 y supuestos.json; Monte Carlo <N> corridas; lluvia 0 y −20 % | 2026-11-14 | colab/A5_demanda.ipynb
etc_mensual.csv | ETc mensual P50 por parcela y opción (mismo cálculo que demanda_parcelas.csv) | 2026-11-14 | colab/A5_demanda.ipynb
A5_tornado.png | Sensibilidad de la lámina bruta a cada parámetro (Monte Carlo de A5) | 2026-11-14 | colab/A5_demanda.ipynb
fuentes_A5.csv | Fuentes de A5: eto_diaria.csv, opciones de B3, supuestos.json, tablas FAO-56 (archivo 27) (sha256) | 2026-11-14 | colab/A5_demanda.ipynb
```
Aviso: `ENTREGA: demanda_parcelas.csv — prueba OK`.

**Prompt de verificación de `rotaciones.json` y `demanda_cultivos.csv`** (cuando los entrega la sesión de datos; cuaderno `A5_verificacion.ipynb` en `Raiz/cuadernos/`):
```text
Eres revisor de datos. NO inventes cifras: usa los archivos y los controles del kit que te doy, con su fuente.
Escribe UNA celda (primera línea: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026) que lea entregas/rotaciones.json y entregas/demanda_cultivos.csv e imprima:
1) llaves de primer nivel de rotaciones.json (deben ser params, cultivos, rotaciones y anios_clima) y cuántos años trae anios_clima;
2) por rotación: id, nombre, cultivos, plazo, plazo_anios y, para lluvia "0" y "-20", p10, p50, p90, neta_mm_p50 y etc_mm_p50; marca las que no cumplan p10 ≤ p50 ≤ p90 (deben ser 0) y los cultivos que no estén en el objeto cultivos;
3) demanda_cultivos.csv: columnas exactas cultivo, lluvia_pct, etc_mm_p50, neta_mm_p50, bruta_millares_p10, bruta_millares_p50, bruta_millares_p90; lluvia_pct solo 0 o -20; filas que no cumplan p10 ≤ p50 ≤ p90 (deben ser 0);
4) PRUEBA DEL KIT A5: ETc anual de alfalfa (etc_mm_p50) y si cae en el rango de control estimado de 1,100–1,700 mm; la eficiencia implícita = ETc neta / lámina INIFAP de 170–180 cm (convierte con 1 millar/ha = 10 cm de lámina, S9 §5); la misma comparación para algodón (~68 cm aplicados, INIFAP) y chile (~92 cm);
5) si la lámina con lluvia -20 es mayor o igual que con lluvia 0 en cada rotación y cultivo (menos lluvia, más riego).
Termina con una tabla VERIFICACIÓN | resultado | OK o REVISAR.
```
Si algo sale REVISAR, no corrija el archivo: avise a Cristian con la tabla.

---

## A9 · Relieve y simulación de tormenta

Núcleo: pasos 1 a 4 (S9 §4 bis y §8). Segunda línea: pasos 5 y 6.

| | |
|---|---|
| **Lo hace la sesión de Chrome** | **Paso 1:** exportación de NASADEM (`NASA/NASADEM_HGT/001`, banda `elevation`) a `nasadem_zona_piloto.tif` (30 m, EPSG:4326, zona piloto + 2 km), con su línea en `LEEME.md`. **Paso 4, si alcanza la cuota:** la serie diaria de GPM IMERG de la zona |
| **Le toca a usted** | Pasos 2, 3, 4 (cálculo del percentil), 5 y 6, en Colab |
| **Entradas** | `nasadem_zona_piloto.tif`; la serie de IMERG de la sesión de Chrome o, si no la hay, `eto_diaria.csv` (POWER); `parcelas_base.geojson`; `supuestos.json` (umbral de acumulación de las rutas y umbral de «día con lluvia») |
| **Cuaderno** | `A9_relieve.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Pasos 1–4: sáb 15:00–20:30. Pasos 5–6: dom 8:00 |
| **Verificación de datos** | [NASADEM](verificar_datos_nasa.md#3-nasadem-a9-y-elevación-de-a1) y [GPM IMERG](verificar_datos_nasa.md#4-gpm-imerg-v07-a9) |

**Tres cuidados:**
1. **Pendiente.** El TIF viene en grados (EPSG:4326). Para la pendiente en %, reproyecte a metros (UTM) o convierta el tamaño de celda a metros antes de calcular. Si no, la pendiente sale mal (kit A9, prueba).
2. **Umbrales.** El de acumulación de las rutas se declara en `supuestos.json` (kit A9, paso 3). El de «día con lluvia» no lo fija el kit. Pida a P5 que declare los dos, con fuente o «assumption». No los invente.
3. **La lámina de la tormenta (paso 4) va en `relieve_meta.json`** (acuerdo de formatos del 14-nov, cambio e); ya no se le pasa a mano a P5. Ese archivo lleva `rotulo`, `umbral_ruta_ha`, `umbral_ruta_etiqueta`, `celda_ha` y `tormenta` con `mm`, `definicion`, `fuente` y `periodo`. Ninguno puede ir vacío; si le falta uno, deténgase y avise. Si `relieve_meta.json` ya tiene su línea en `LEEME.md`, no lo rehaga: compárelo con su cálculo y avise a Cristian.

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P4 Clima, demanda y back-test.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A9.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A9.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
A9 no tiene fila en la tabla 0.4-B. Los nombres y columnas salen del prompt A9 y del acuerdo con la sesión de Chrome:
- nasadem_zona_piloto.tif: 30 m, EPSG:4326, zona piloto + 2 km. LO ENTREGA LA SESIÓN DE CHROME; yo solo lo leo.
- relieve_rutas.geojson: líneas (LineString o MultiLineString), < 1 MB, geometrías simplificadas.
- relieve_parcelas.csv: id, pendiente_media_pct, aportacion_externa_ha, frac_depresion (más fuente_dem solo si se usa LiDAR, paso 6).
- relieve_meta.json (CAMBIO ACORDADO EL 14-NOV): un objeto JSON con rotulo (el rótulo de la capa: "regional, 30 m (NASADEM); not field drainage design"), umbral_ruta_ha (el umbral de acumulación de supuestos.json, en hectáreas, > 0), umbral_ruta_etiqueta (la etiqueta de ese umbral en supuestos.json), celda_ha (área de una celda del modelo de elevación, en hectáreas, > 0, calculada en metros) y tormenta: {mm, definicion, fuente, periodo} (paso 4). Ningún campo vacío: si falta uno, detente y avísame.
- fuentes_A9.csv: archivo, url_o_api, fecha_consulta, sha256.
La lámina de la tormenta de referencia (paso 4) va en relieve_meta.json (tormenta.mm, con su definición, fuente y periodo). No crees otro archivo.

DOCUMENTOS DE REFERENCIA (pegados)
S9 §4 bis, tabla de las capas (copiada tal cual):
| **Capa «Relieve y escurrimiento»** en el centro de control | Pendiente, dirección de flujo y acumulación de flujo calculadas con NASADEM (30 m, NASA) sobre la zona piloto; líneas animadas que siguen las rutas por donde se concentra el agua | Zona, no parcela. Rótulo: «regional, 30 m» |
| **Botón «Simular tormenta»** | Lámina de una lluvia fuerte de la propia serie (percentil 95 de la lluvia diaria de GPM IMERG o POWER en la zona) distribuida sobre la acumulación de flujo; muestra hacia dónde escurre y dónde se junta | Ilustrativo; sin hidrograma ni profundidades |
| **Renglón Suelo de la ficha** | Pendiente media de la parcela, si recibe escurrimiento de parcelas vecinas y si cae en una depresión del terreno | Indicador de contexto, junto a los días de suelo desnudo (erosión) |
[PEGA AQUÍ de supuestos.json (P5): el umbral de acumulación para las rutas y el umbral de "día con lluvia", cada uno con su fuente o "assumption".]
[PEGA AQUÍ lo que diga la sesión de Chrome sobre su serie de GPM IMERG: archivo, unidades, periodo y zona horaria. Si no hay serie, uso eto_diaria.csv (POWER), como permite el paso 4.]

TAREA
NOTA DEL EQUIPO: el paso 1 (exportación de NASADEM) y la extracción de GPM IMERG del paso 4 los hace la sesión de Chrome; yo empiezo en el paso 2 con nasadem_zona_piloto.tif. Antes de calcular la pendiente, imprime el CRS y el tamaño de celda; si están en grados, reproyecta a metros. Usa pysheds, richdem o whitebox (dime cuál y por qué, y el comando de instalación).
Tarea A9. En A9_relieve.ipynb (Raiz/cuadernos/):
1) Elevación: NASADEM (Earth Engine: NASA/NASADEM_HGT/001, banda elevation) recortada al rectángulo de la zona piloto más un margen de 2 km. Exporte UNA vez a GeoTIFF con Export.image.toDrive a 30 m. Corrida piloto y consumo de EECU anotados.
2) En Colab (no en Earth Engine), con una biblioteca de hidrología de terreno (pysheds, richdem o whitebox; diga cuál y por qué): rellene depresiones, calcule dirección de flujo D8, acumulación de flujo, pendiente en % y profundidad de depresión (diferencia entre el modelo relleno y el original).
3) Rutas de escurrimiento: celdas con acumulación ≥ un umbral declarado en supuestos.json; conviértalas en líneas y guárdelas en Raiz/entregas/relieve_rutas.geojson (< 1 MB, geometrías simplificadas).
4) Tormenta de referencia: percentil 95 de la lluvia diaria de los días con lluvia en la zona, de GPM IMERG (NASA/GPM_L3/IMERG_V07, agregado diario) o, si no alcanza la cuota, de eto_diaria.csv (POWER). Guarde el valor en mm con su fuente y periodo en Raiz/entregas/relieve_meta.json (tormenta: mm, definicion, fuente, periodo; cambio acordado el 14-nov).
5) Por parcela (contexto, no medición): pendiente media (%), acumulación máxima que entra a la parcela desde fuera (área de aportación en ha) y fracción del área en depresión > 0.1 m. Guarde Raiz/entregas/relieve_parcelas.csv (id, pendiente_media_pct, aportacion_externa_ha, frac_depresion).
6) Si existe en entradas/ un modelo LiDAR del INEGI que cubra la zona (descargado antes del evento en el navegador), repita 2 y 5 con ese modelo y añada la columna fuente_dem. Si no existe, no lo busque durante el evento.

PRUEBA: el mapa de acumulación sigue los drenes y canales visibles en la imagen; pendientes entre 0 y 5 % en la zona agrícola (si no, revise unidades y proyección); el texto lleva "regional, 30 m (NASADEM); not field drainage design". Si no se ejecuta, la capa no aparece y la página dice "terrain layer: not run".
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En datos/A9_relieve.ipynb:» → «En A9_relieve.ipynb (Raiz/cuadernos/):»
- «guárdelas en relieve_rutas.geojson (» → «guárdelas en Raiz/entregas/relieve_rutas.geojson (»
- «Guarde relieve_parcelas.csv (» → «Guarde Raiz/entregas/relieve_parcelas.csv (»
- «Guarde el valor en mm con su fuente y periodo.» → «Guarde el valor en mm con su fuente y periodo en Raiz/entregas/relieve_meta.json (tormenta: mm, definicion, fuente, periodo; cambio acordado el 14-nov).» (ruta y cambio e)

**Prueba de aceptación** (kit A9):
```text
PRUEBA: el mapa de acumulación sigue los drenes y canales visibles en la imagen; pendientes entre 0 y 5 % en la zona agrícola (si no, revise unidades y proyección); el texto lleva "regional, 30 m (NASADEM); not field drainage design". Si no se ejecuta, la capa no aparece y la página dice "terrain layer: not run".
```

**Plan B:**
- El kit no trae uno para A9.
- Si hay retraso, la tormenta animada pasa a una imagen fija con las rutas (S9 §4 bis; kit R3).
- Si no se ejecuta, la capa no aparece y la página dice "terrain layer: not run" (prueba de A9).

**Líneas de LEEME.md:**
```text
relieve_rutas.geojson | NASADEM (NASA/NASADEM_HGT/001, 30 m) exportado por la sesión de Chrome; acumulación D8 ≥ umbral de supuestos.json; regional, 30 m (NASADEM); not field drainage design | 2026-11-14 | colab/A9_relieve.ipynb
relieve_meta.json | Rótulo y umbral de rutas (supuestos.json); tormenta P95 de la lluvia diaria de GPM IMERG V07 (o NASA POWER), <periodo> (kit A9, paso 4; acuerdo de formatos del 14-nov) | 2026-11-14 | colab/A9_relieve.ipynb
relieve_parcelas.csv | NASADEM 30 m + parcelas_base.geojson; indicadores de contexto, no medición | 2026-11-15 | colab/A9_relieve.ipynb
fuentes_A9.csv | Fuentes de A9: nasadem_zona_piloto.tif, serie de GPM IMERG V07 (o eto_diaria.csv), supuestos.json (sha256) | 2026-11-14 | colab/A9_relieve.ipynb
```
Aviso: `ENTREGA: relieve_rutas.geojson — prueba OK`.

---

## A6 · Back-test H1

| | |
|---|---|
| **Entradas** | `LBQCH.csv` del SIH (descargado el viernes en el navegador; S10 §7), en `Raiz/entradas/`; patrón de cultivos de Conagua (`Raiz/entradas/`); `eto_diaria.csv` hasta el 13-mar-2026 |
| **Documento clave** | `preregistro_H1.md` (archivo 30). No está en el repo: pídalo a Cristian. **No se modifica el criterio** |
| **Cuaderno** | `A6_backtest.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Arranque sáb 18:00–20:30; resultado sáb 20:30–1:00; `resultado_H1.md` terminado entre dom 8:00 y 11:00 (kit §3) |
| **Verificación de datos** | [verificar_datos_nasa.md → SIH LBQCH.csv](verificar_datos_nasa.md#8-sih-lbqchcsv-a6) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P4 Clima, demanda y back-test.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A6.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A6.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A6 (P4) | `resultado_H1.md` y figura PNG | Según el preregistro (archivo 30) |
Además: fuentes_A6.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
S8, decisión 7 (copiada tal cual):
| 7 | Back-test | Verdad = salida por obra de toma de La Boquilla del 14-mar al 14-jul-2026; hm³ diarios = caudal (m³/s) × 86,400 ÷ 10⁶. No equivale a la entrega en parcela |
S9 §6, prueba 2 (copiada tal cual):
| 2 | Back-test 2026 (H1, preregistrado) | Con datos al 14-mar, el error al 14-jul debe ser menor que el de las líneas base L1 y L1-s. Verdad: salida por obra de toma de La Boquilla (SIH) |
[PEGA AQUÍ preregistro_H1.md completo (archivo 30), que te pasa Cristian. Sin él, no se empieza.]
[PEGA AQUÍ los encabezados (nombres de columna) de LBQCH.csv tal como vienen en el archivo.]

TAREA
NOTA DEL EQUIPO: uso SOLO la información disponible al 14-mar-2026 para el modelo; la verdad (SIH) se lee por nombre de columna. El resultado se reporta tal como salga, favorable o no.
Tarea A6. Lea preregistro_H1.md (archivo 30; no está en el repo: se lo pasa Cristian) (publicado; NO modifique el criterio) y siga EXACTAMENTE su protocolo, en A6_backtest.ipynb (Raiz/cuadernos/):
1) Utilice ÚNICAMENTE la información disponible al 14-mar-2026:
   - almacenamiento de La Boquilla del SIH (Raiz/entradas/);
   - el patrón de cultivos de ciclos previos de Conagua (Raiz/entradas/);
   - POWER hasta el 13-mar-2026;
   - el volumen autorizado que fije el preregistro (cifras de prensa, marcadas como tales).
2) VERDAD (preregistro, sección 4; S8, decisión 7): salida acumulada por obra de toma de La Boquilla del 14-mar al 14-jul-2026, integrada de la serie diaria oficial del SIH (archivo LBQCH.csv; lea las columnas por nombre, no por posición): volumen diario en hm³ = caudal (m³/s) × 86,400 ÷ 10⁶. Declare que no equivale a la entrega en parcela.
   Si la serie no puede leerse, o trae huecos o ceros en el periodo, repórtelo y use el respaldo del preregistro: 447.65 hm³ (prensa), rotulado "press-reported; equals the storage drop". Indique siempre qué fuente de verdad se usó.
3) Calcule la extracción proyectada del modelo y de las líneas base del preregistro (L1, L1-s y L2; L3 es opcional) en el punto principal (14-jul-2026). Como comprobación de consistencia, repita en el punto secundario (13-may-2026; 228.86 hm³ de prensa, que equivale a la caída de almacenamiento) con su advertencia; ese punto no decide H1.
4) Métricas:
   - error absoluto en hm³ por fecha;
   - skill = 1 − MAE_modelo/MAE_línea base;
   - intervalo Monte Carlo P10–P90, con el número de corridas del preregistro.
5) Una gráfica: línea del modelo con su banda P10–P90, L1-s, L1, L2 y los puntos observados, cada uno con su rótulo de fuente.
6) Redacte resultado_H1.md (en Raiz/entregas/) con el resultado TAL COMO SE OBTENGA, comparado con el criterio preregistrado: |error del modelo| < |error de L1-s| y < |error de L1| en el punto principal.

PRUEBA: la gráfica es clara y el texto indica explícitamente "meets / does not meet the preregistered criterion" y la fuente de verdad utilizada.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «Lea docs/preregistro_H1.md (publicado;» → «Lea preregistro_H1.md (archivo 30; no está en el repo: se lo pasa Cristian) (publicado;»
- «en datos/A6_backtest.ipynb:» → «en A6_backtest.ipynb (Raiz/cuadernos/):»
- «almacenamiento de La Boquilla de data/raw/sih;» → «almacenamiento de La Boquilla del SIH (Raiz/entradas/);»
- «el patrón de cultivos de ciclos previos de data/raw/conagua;» → «el patrón de cultivos de ciclos previos de Conagua (Raiz/entradas/);»
- «6) Redacte docs/resultado_H1.md» → «6) Redacte resultado_H1.md (en Raiz/entregas/)»

**Prueba de aceptación** (kit A6):
```text
PRUEBA: la gráfica es clara y el texto indica explícitamente "meets / does not meet the preregistered criterion" y la fuente de verdad utilizada.
```

**Plan B:** el kit no trae uno para A6, y el back-test es núcleo: no se corta (S9 §8; kit R3).
- Si la serie del SIH no sirve, se usa el respaldo de prensa que el prompt indica, con su rótulo.
- Si A5 se entregó con su plan B (rango simple), A6 usa ese rango con el mismo rótulo, «simple range».

**Líneas de LEEME.md:**
```text
resultado_H1.md | Back-test H1 según el preregistro (archivo 30); verdad: SIH LBQCH.csv (Conagua), caudal × 86,400 ÷ 10⁶ = hm³/día, o respaldo de prensa rotulado; meets / does not meet | 2026-11-15 | colab/A6_backtest.ipynb
A6_backtest.png | Modelo P10–P90, L1-s, L1, L2 y observados con su fuente | 2026-11-15 | colab/A6_backtest.ipynb
fuentes_A6.csv | Fuentes de A6: LBQCH.csv (SIH, Conagua), patrón de cultivos de Conagua, eto_diaria.csv al 13-mar-2026 (sha256) | 2026-11-15 | colab/A6_backtest.ipynb
```
Aviso: `ENTREGA: resultado_H1.md — prueba OK`.

---

## A8 · Contraste regional de ET

Solo si A5 está entregada. **Nunca por parcela**; el rótulo es «regional» (S8, decisión 4).

| | |
|---|---|
| **Lo hace la sesión de Chrome** | Pasos 2 y 3, en Earth Engine: la serie mensual de SSEBop VIIRS v6 y, si hay acceso, la de WaPOR v3 nivel 1, promediadas sobre el rectángulo de la zona piloto. El consumo de EECU lo anota esa sesión |
| **Le toca a usted** | Paso 1 (ET modelada con `etc_mensual.csv`), paso 4 (tabla, figura y diferencias) y paso 5 |
| **Entradas** | `etc_mensual.csv` (A5), `cultivos_parcelas.csv` (A4.2) y `parcelas_base.geojson` (`area_ha`); las series de la sesión de Chrome |
| **Cuaderno** | `A8_et_contraste.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Dom, antes de las 11:00 (kit A8) |
| **Verificación de datos** | [SSEBop](verificar_datos_nasa.md#5-ssebop-viirs-v6-a8) y [WaPOR](verificar_datos_nasa.md#6-wapor-v3-nivel-1-a8) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P4 Clima, demanda y back-test.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A8.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A8.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A8 (P4) | `et_contraste.csv` y figura PNG | (mes, et_modelo_mm, et_ssebop_mm, et_wapor_mm) |
Además: fuentes_A8.csv (archivo, url_o_api, fecha_consulta, sha256). 12 filas (oct-2025 a sep-2026), en mm por mes; et_wapor_mm vacío si no hubo acceso a WaPOR.

DOCUMENTOS DE REFERENCIA (pegados)
S8, decisión 4 (copiada tal cual):
| 4 | Contraste de ET | ET modelada agregada a la zona frente a SSEBop VIIRS v6 (USGS, 1 km) y WaPOR v3 nivel 1 (FAO, 300 m). Nunca por parcela; rótulo «regional» |
[PEGA AQUÍ lo que diga la sesión de Chrome sobre sus series de SSEBop y WaPOR: archivo, banda, unidades, factor de escala y periodo.]

TAREA
NOTA DEL EQUIPO: los pasos 2 y 3 (Earth Engine) los hizo la sesión de Chrome; yo hago los pasos 1, 4 y 5 con sus series. Antes de comparar, convierte todo a mm por mes y dime qué conversión aplicaste a cada serie.
Tarea A8. En A8_et_contraste.ipynb (Raiz/cuadernos/):
1) ET modelada: con etc_mensual.csv (A5), ETc mensual P50 de la opción ACTUAL de cada parcela clasificada, agregada a la zona piloto como promedio ponderado por superficie (mm por mes), de oct-2025 a sep-2026.
2) SSEBop VIIRS v6 mensual (USGS; 1 km; Earth Engine: projects/usgs-ssebop/viirs_et_v6_monthly): promedio sobre el rectángulo de la zona piloto, mismos meses. Verifique en el catálogo la banda, las unidades y el factor de escala antes de usarlo. Haga primero una corrida piloto y anote el consumo de EECU.
3) WaPOR v3 nivel 1 (FAO; 300 m; CC-BY-4.0): verifique cómo se accede (catálogo de Earth Engine o portal de la FAO). Si no hay acceso sin una descarga pesada, use solo SSEBop y declárelo.
4) Tabla y figura con las series mensuales; diferencia en mm y en %. Declare que la ET de satélite incluye parcelas sin clasificar, caminos y vegetación no agrícola del rectángulo, y que la modelada es ETc potencial del cultivo, no ET medida.
5) Guarde en Raiz/entregas/ et_contraste.csv (mes, et_modelo_mm, et_ssebop_mm, et_wapor_mm) y la figura.

PRUEBA: 12 meses con unidades comprobadas (mm por mes); el texto lleva el rótulo "regional comparison; not field-level validation" y no usa "validated" para parcelas. Si la tarea no se ejecuta, la página dice "regional ET contrast: not run".
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En datos/A8_et_contraste.ipynb:» → «En A8_et_contraste.ipynb (Raiz/cuadernos/):»
- «5) Guarde et_contraste.csv (» → «5) Guarde en Raiz/entregas/ et_contraste.csv (»

**Prueba de aceptación** (kit A8):
```text
PRUEBA: 12 meses con unidades comprobadas (mm por mes); el texto lleva el rótulo "regional comparison; not field-level validation" y no usa "validated" para parcelas. Si la tarea no se ejecuta, la página dice "regional ET contrast: not run".
```

**Plan B:**
- El kit no trae uno para A8.
- Si no hay acceso a WaPOR, se usa solo SSEBop y se declara (lo dice el paso 3).
- Si no se ejecuta, la página dice "regional ET contrast: not run".

**Líneas de LEEME.md:**
```text
et_contraste.csv | ET modelada (etc_mensual.csv, A5) frente a SSEBop VIIRS v6 mensual (USGS, 1 km) y WaPOR v3 nivel 1 (FAO, 300 m, CC-BY-4.0), series de la sesión de Chrome; regional comparison; not field-level validation | 2026-11-15 | colab/A8_et_contraste.ipynb
A8_et_contraste.png | et_contraste.csv | 2026-11-15 | colab/A8_et_contraste.ipynb
fuentes_A8.csv | Fuentes de A8: etc_mensual.csv y series de SSEBop y WaPOR de la sesión de Chrome (sha256) | 2026-11-15 | colab/A8_et_contraste.ipynb
```
Aviso: `ENTREGA: et_contraste.csv — prueba OK`.
