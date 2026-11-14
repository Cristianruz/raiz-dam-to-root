<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# P2 · Mapa de cultivos con Random Forest y las 3 protagonistas

**Qué le toca ahora** (S9 §10; kit §3; decisiones del integrador del 14-nov a las 10:30):
1. **B1, paso 4:** proponer las 3 parcelas protagonistas, revisarlas en color verdadero y mandar sus `id` a Cristian.
2. **A4.2:** entrenar el Random Forest, compararlo con las reglas y entregar `cultivos_parcelas.csv` con dos métodos (`acuerdo_metodos` «2/2» o «1/2» y `prob_max`), con validación cruzada espacial por bloques de 5 km y la regla de abstención.
3. **Figuras** del mapa y de la memoria, el domingo.

**Ya está hecho y no se rehace** (lo entregó la sesión de datos; detalle en [README, «Estado a las 10:30»](README.md#estado-a-las-1030-sábado-14-nov)). Usted lo **lee directo de `Raiz_entregas`** desde Colab, sin copiarlo ni modificarlo:

| Archivo en `Raiz_entregas` | Qué trae | Para qué le sirve |
|---|---|---|
| `parcelas_base.geojson` | 338 campos de Fields of The World, 5,794 ha, `id` de `P0001` en adelante, de norte a sur. Propiedades `id`, `area_ha`, `modulo`, `ftw_confianza`, `protagonista` | Geometrías, `ftw_confianza` (abstención) y los `id` de todo |
| `hls_reflect_2025_10_a_2026_09.tif` | Reflectancia mediana mensual, oct-2025 a sep-2026, bandas `AAAA_MM_azul`, `_verde`, `_rojo`, `_nir`, `_swir1` y `_swir2`. Int16 multiplicado por 10,000; −32768 = sin dato | Variables del Random Forest y el color verdadero de las protagonistas |
| `hls_mensual_parcelas.csv` | `id, mes, banda, mediana, p25, p75, n_validos`; bandas `ndvi`, `lswi` y `bsi`, ya en su escala (entre −1 y 1) | Variables del Random Forest y la curva de NDVI de las protagonistas |
| `cultivos_parcelas.csv` (versión de **solo reglas**) | `acuerdo_metodos` «1/1 (reglas)», `prob_max` vacío, `edad_perenne_anios`, `estado_plazo`, `grupo_fenologico` | El método A (reglas) que se compara con el Random Forest; candidatas a protagonista |
| `memoria_parcelas.csv` | Estado de cada parcela por año agrícola, 2016–2026 | La edad de la alfalfa y del nogal |
| `suelo_desnudo.csv` | Días de suelo desnudo del 1-feb al 30-abr de 2026 | Elegir la protagonista anual |

**Por qué importa el Random Forest:** con solo reglas, **218 de los 338 campos quedan abstenidos**. De ellos, **132 son anuales de verano** (chile, algodón, maíz o sorgo) que las reglas no separan (cifras del integrador, 14-nov 10:30). Sin un segundo método, el mapa no dice qué se siembra en la mayor parte de la zona.

| Orden | Pieza | Archivos que entrega | Hora límite |
|---|---|---|---|
| 1 | [B1, paso 4 · las 3 protagonistas](#b1-paso-4--las-3-protagonistas) | `B1_protagonistas.png`, `fuentes_protagonistas.csv`; los 3 `id` por mensaje a Cristian | Sáb 12:00 (kit §3, bloque de B1). El hito de las 20:30 necesita una parcela real |
| 2 | [A4.2 · Random Forest y comparación con las reglas](#a42--random-forest-y-comparación-con-las-reglas) | `cultivos_parcelas.csv` (sustituye a la versión de reglas), `tabla_metodos.csv`, `A42_cobertura_exactitud.png`, `fuentes_A42.csv` | Sáb 15:00–20:30; entrega entre 18:00 y 20:30 (kit §3). Necesita `etiquetas_unidas.csv` de P3. Antes de las 15:00 puede preparar la tabla de variables |
| 3 | [Figuras](#figuras-del-mapa-y-de-la-memoria) | `fig_*.png` | Dom 8:00 (mapa y memoria); dom 11:00 (página) |

**Cómo se usa cada bloque** (flujo completo en [README §4](README.md#4-flujo-de-trabajo-de-una-pieza)):
1. Abra un cuaderno nuevo en Colab con el nombre indicado y monte Drive.
2. Si el bloque dice `[PEGA AQUÍ …]`, sustitúyalo por el texto indicado.
3. Pegue el bloque completo en el panel de Gemini. Pida **una celda por paso** y ejecútela antes de pedir la siguiente.
4. Al final: corra la prueba, verifique los datos con [verificar_datos_nasa.md](verificar_datos_nasa.md) y pida la revisión con contexto nuevo de `docs/prompts/para_gemini.md`.
5. Entregue: archivos en `Raiz_entregas`, su línea al final de `Raiz_entregas/LEEME.md`, el cuaderno en `Raiz/cuadernos/` y el aviso `ENTREGA: <archivo> — prueba OK`.

---

## B1, paso 4 · Las 3 protagonistas

| | |
|---|---|
| **Qué ya hizo la sesión de datos** | Pasos 1, 2, 3 y 5 de B1: recorte de Fields of The World, `area_ha`, `ftw_confianza` y `parcelas_base.geojson`. Las protagonistas **aún no están marcadas** |
| **Le toca a usted** | Paso 4: elegir las 3 protagonistas y revisarlas a mano contra una imagen en color verdadero |
| **Qué se busca** (decisión del integrador, 14-nov; kit B1, paso 4; kit §10, punto 9) | Una por estado del plazo: **una alfalfa «por vencer»**, **una anual «libre»** y **un nogal «comprometida»**, ninguna abstenida |
| **Entradas** | `parcelas_base.geojson`, `cultivos_parcelas.csv` (reglas), `suelo_desnudo.csv`, `hls_mensual_parcelas.csv` y `hls_reflect_2025_10_a_2026_09.tif`, todos de `Raiz_entregas`. Opcional: Copernicus Browser (Sentinel-2 en color verdadero) en el navegador |
| **Cuaderno** | `B1_protagonistas.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00 (kit §3) |
| **Verificación de datos** | [verificar_datos_nasa.md → Fields of The World](verificar_datos_nasa.md#7-fields-of-the-world-2025-b1) y [→ HLS](verificar_datos_nasa.md#2-hls-l30-y-s30-v002-a3-a3-m-y-a4) |

**Si un contorno no coincide con la parcela:**
- No reescriba `parcelas_base.geojson`: es de la sesión de datos.
- Guarde el polígono corregido en `Raiz/cuadernos/B1_protagonistas_correccion.geojson`, con su `id`, y escriba qué cambió en `Raiz/cuadernos/B1_revision_protagonistas.md`. Cristian lo pasa a `docs/`.
- **Mande a Cristian los 3 `id`** por mensaje: él (o la sesión de datos) marca `protagonista = true`.

**Si el Random Forest cambia después la clase de una protagonista** (A4.2), vuelva a revisarla y avise.

**Bloque para pegar en Gemini** (G0 completo + tarea):
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P2 HLS y memoria.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el Chrome de Cristian) y sus exportaciones ya están en Raiz_entregas/.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/. No sobrescribas archivos de otras personas ni de la sesión de datos, salvo que la TAREA lo diga. Los id de parcela son los de Raiz_entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso pide Earth Engine, dime qué archivo necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, geopandas, rasterio, matplotlib, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_protagonistas.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía. Para un archivo de Raiz_entregas/, url_o_api = "Raiz_entregas/<archivo>".
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_protagonistas.csv y las figuras), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
No escribo parcelas_base.geojson (es de la sesión de datos). Escribo:
- en Raiz_entregas/: B1_protagonistas.png (una figura con las 3 protagonistas en color verdadero, con su contorno) y fuentes_protagonistas.csv;
- en Raiz/cuadernos/: B1_revision_protagonistas.md (la revisión) y, solo si un contorno no coincide, B1_protagonistas_correccion.geojson (id y polígono corregido).

DOCUMENTOS DE REFERENCIA (pegados)
Advertencia del kit v4, sección A4 (copiada tal cual):
> **Advertencia sobre Fields of The World:** su benchmark no incluye México y el riego árido de Norteamérica no está en su entrenamiento. Se usan sus predicciones globales de 2025 (CC-BY-4.0), con filtro de confianza por polígono y revisión manual de las 3 protagonistas (B1). En la página se declara: *"Field boundaries are NN predictions outside the model's training domain; filtered by confidence and manually reviewed for the showcased fields."*
S9 §5, viñeta "Estado" (copiada tal cual):
- **Estado:** libre (anual o descanso); por vencer (alfalfa con 3 años o más [S]); comprometida (alfalfa joven o nogal).
Formato de los archivos (dato de la sesión de datos):
- hls_reflect_2025_10_a_2026_09.tif: bandas con nombre AAAA_MM_azul, AAAA_MM_verde, AAAA_MM_rojo, AAAA_MM_nir, AAAA_MM_swir1, AAAA_MM_swir2 (los nombres están en las descripciones de banda del TIF); valores Int16 multiplicados por 10,000; -32768 = sin dato.
- hls_mensual_parcelas.csv: id, mes (AAAA-MM), banda (ndvi, lswi, bsi), mediana, p25, p75, n_validos; ya en su escala.
- cultivos_parcelas.csv (versión de reglas): id, cultivo_actual, prob_max (vacío), acuerdo_metodos ("1/1 (reglas)"), abstencion, edad_perenne_anios, estado_plazo, grupo_fenologico.

TAREA
NOTA DEL EQUIPO: los pasos 1, 2, 3 y 5 de B1 los hizo la sesión de datos. Yo hago el paso 4. Primero imprime: número de parcelas de parcelas_base.geojson, CRS, cuántas tienen protagonista = true y el % con ftw_confianza < 50.
1) CANDIDATAS, con cultivos_parcelas.csv unido por id a parcelas_base.geojson y suelo_desnudo.csv. Solo parcelas con abstencion = false. Imprime una tabla por grupo (id, area_ha, ftw_confianza, cultivo_actual, edad_perenne_anios, estado_plazo, dias_suelo_desnudo_feb_abr), ordenada por ftw_confianza de mayor a menor:
   - alfalfa con estado_plazo = por_vencer;
   - nogal con estado_plazo = comprometida;
   - anual con estado_plazo = libre. Además, aparte, las parcelas con grupo_fenologico = anual_verano (hoy abstenidas porque las reglas no separan el chile), con sus días de suelo desnudo: si el Random Forest confirma una como chile, puede servir como la protagonista anual que pide el kit; dímelo en una línea.
2) Propón 3 (una de cada grupo) y explica en una línea por qué cada una.
3) REVISIÓN VISUAL (kit B1, paso 4): para cada propuesta, imagen en color verdadero con hls_reflect_2025_10_a_2026_09.tif (bandas rojo, verde y azul del mes con menos píxeles sin dato dentro de la parcela; dime qué mes usaste), recortada a la parcela más un margen, con el contorno de parcelas_base.geojson encima. Convierte -32768 a NaN y divide entre 10,000 antes de graficar; usa un estiramiento por percentiles y dilo. Junta las 3 en B1_protagonistas.png, con el id, el cultivo y la nota "Source: NASA HLS L30/S30 v002; field boundaries: Fields of The World (CC-BY-4.0)".
4) Curva de NDVI mensual de las 3 (de hls_mensual_parcelas.csv, banda ndvi, mediana).
5) Escribe en Raiz/cuadernos/B1_revision_protagonistas.md, para cada una: id, cultivo, estado del plazo, mes de la imagen, si el contorno coincide con la parcela (sí / no y qué no coincide) y qué se vio en Copernicus Browser si te lo cuento. Si no coincide, guarda en Raiz/cuadernos/B1_protagonistas_correccion.geojson el id y el polígono que te indique, sin tocar parcelas_base.geojson.
6) Al final, escribe el mensaje para Cristian: "Protagonistas propuestas: <id alfalfa por vencer>, <id anual libre>, <id nogal comprometida>; contornos revisados: …".

Texto del kit B1, paso 4 (copiado tal cual):
4) Para la demostración: 30–60 parcelas de un solo sector (la zona piloto) y 3 protagonistas (protagonista=true). Si el peso del archivo y la cuota de Earth Engine lo permiten tras el piloto de consumo, conserve todas las parcelas del rectángulo con confianza suficiente: el indicador de zona y H3 son más sólidos con más parcelas. Protagonistas, de preferencia, una por cada estado del plazo:
   - una alfalfa vieja (por vencer);
   - una de chile con suelo desnudo en invierno (libre);
   - una huerta de nogal (comprometida), en lugar de la parcela de forraje o maíz del kit 23.
   Se eligen con el apoyo visual de A3; si aún no está disponible, posponga la selección y notifíquelo.
   REVISIÓN MANUAL OBLIGATORIA de las 3 protagonistas: compare cada polígono con una imagen en color verdadero (HLS o Sentinel-2) y corrija el contorno si no coincide con la parcela; registre la corrección en Raiz/cuadernos/B1_revision_protagonistas.md (Cristian la pasa a docs/).

PRUEBA DE ACEPTACIÓN:
- tabla de las 3 propuestas con id, cultivo, estado del plazo, ftw_confianza y abstencion = false;
- B1_protagonistas.png abre y muestra las 3 parcelas con su contorno;
- curva de NDVI de las 3: la alfalfa, verde casi todo el año, con caídas por corte; el nogal, verde en verano y sin hojas en invierno; la anual, verde en su temporada y baja fuera de ella (kit A3, prueba). Si no se ve así, dilo;
- para cada una, "contorno coincide" o "contorno no coincide: corrección en Raiz/cuadernos/".
```

**Ajustes al texto del kit en este bloque:** la única ruta cambiada es «registre la corrección en docs/.» → «registre la corrección en Raiz/cuadernos/B1_revision_protagonistas.md (Cristian la pasa a docs/).». Los criterios de la «anual libre» siguen la decisión del integrador del 14-nov: el kit pedía chile, y las reglas todavía no lo separan.

**Prueba de aceptación:** la del bloque. Además, el ensamblador avisa si `parcelas_base.geojson` no trae exactamente 3 protagonistas (kit B1, paso 4): ese aviso desaparece cuando Cristian las marque.

**Plan B:** el kit no trae uno para B1. Si a las 12:00 no hay una candidata clara en algún grupo, mande las dos que sí tiene y diga cuál falta. Por R3 (kit §8), el núcleo puede quedarse con las 3 protagonistas.

**Líneas de LEEME.md:**
```text
B1_protagonistas.png | HLS L30/S30 v002 (hls_reflect_2025_10_a_2026_09.tif, color verdadero) y contornos de parcelas_base.geojson (Fields of The World, CC-BY-4.0); revisión manual de las 3 protagonistas (kit B1, paso 4) | 2026-11-14 | colab/B1_protagonistas.ipynb
fuentes_protagonistas.csv | Fuentes de la revisión de protagonistas: parcelas_base.geojson, cultivos_parcelas.csv, suelo_desnudo.csv, hls_mensual_parcelas.csv y hls_reflect_2025_10_a_2026_09.tif de Raiz_entregas (sha256) | 2026-11-14 | colab/B1_protagonistas.ipynb
```
Aviso en el grupo: `ENTREGA: B1_protagonistas.png — prueba OK`. Y por mensaje a Cristian, los 3 `id`.

---

## A4.2 · Random Forest y comparación con las reglas

| | |
|---|---|
| **Quién** | P2, con P3 (kit A4.2). P3 entrega `etiquetas_unidas.csv` y revisa la validación |
| **Enfoque A (reglas)** | **Ya hecho** por la sesión de datos: es el `cultivos_parcelas.csv` de solo reglas. Usted no lo reprograma: lo documenta en una tabla y lo evalúa con las etiquetas |
| **Enfoque B (Random Forest)** | Lo hace usted |
| **Entradas** (todas de `Raiz_entregas`, abiertas directo desde Drive) | `hls_reflect_2025_10_a_2026_09.tif`, `hls_mensual_parcelas.csv`, `parcelas_base.geojson`, `cultivos_parcelas.csv` de reglas (vía su respaldo, vea abajo), `memoria_parcelas.csv` y `etiquetas_unidas.csv` (P3) |
| **Cuaderno** | `A4_mapa_cultivos.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 15:00–20:30; entrega entre 18:00 y 20:30 (kit §3). Antes de las 15:00 puede hacer los pasos de variables (1 y 2) |
| **Verificación de datos** | [verificar_datos_nasa.md → HLS](verificar_datos_nasa.md#2-hls-l30-y-s30-v002-a3-a3-m-y-a4) |

**Antes de empezar, cuatro cosas:**
1. **Respaldo de las reglas.** Su archivo **sustituye** al `cultivos_parcelas.csv` de reglas (mismo nombre, carpeta plana). Antes de escribirlo, copie el de reglas a `Raiz/cuadernos/cultivos_parcelas_reglas_respaldo.csv` y trabaje con esa copia. Pida a Cristian que avise a la sesión de datos que **no vuelva a correr A4** sobre ese nombre.
2. **Regla de acuerdo entre métodos.** Las reglas solo dicen «anual de verano» donde el Random Forest puede decir «chile» o «algodón». El bloque trae una regla de acuerdo **propuesta [S]**: confírmela con Cristian antes de entregar.
3. **Etiquetas.** `etiquetas_unidas.csv` (P3) trae en `id` el campo de `parcelas_base.geojson` que contiene cada punto ([README §6, decisión e](README.md#6-decisiones-del-14-nov-mandan-sobre-el-kit)). Se entrena solo con `uso = entrenamiento`. Las de `uso = validacion` son de P3 para Olofsson (A4.3): **no se usan para entrenar ni para elegir parámetros**.
4. **Referencia de Conagua.** La comparación de áreas usa la Estadística Agrícola 2016-2017, Cuadro 3.5 (archivo 29). No está en el repo: pídala. Si no llega, la prueba dice «no realizada: falta la referencia».

**Presto** (enfoque C, «solo si sobra tiempo») no se inicia antes del hito de las 20:30 (kit §3).

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P2 HLS y memoria (con P3).

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el Chrome de Cristian) y sus exportaciones ya están en Raiz_entregas/.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/. No sobrescribas archivos de otras personas ni de la sesión de datos, salvo que la TAREA lo diga. Los id de parcela son los de Raiz_entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso pide Earth Engine, dime qué archivo necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, geopandas, rasterio, matplotlib, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A42.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía. Para un archivo de Raiz_entregas/, url_o_api = "Raiz_entregas/<archivo>"; para las reglas, el sha256 es el del respaldo en Raiz/cuadernos/.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_A42.csv y las figuras), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A4.2 (P2) | `cultivos_parcelas.csv` y `tabla_metodos.csv` | (id, cultivo_actual, prob_max, acuerdo_metodos, abstencion); (enfoque, f1_macro, f1_por_clase, tiempo) |
LO QUE ACEPTA EL VALIDADOR (motor/esquemas.py; manda sobre la fila de arriba):
cultivos_parcelas.csv lleva EXACTAMENTE estas 8 columnas, en este orden, y UNA fila por cada id de parcelas_base.geojson (todas, sin repetir):
- id: texto; existe en parcelas_base.geojson.
- cultivo_actual: alfalfa, nogal, chile, maiz_forrajero, sorgo, algodon, cereal_invierno, barbecho o sin_clasificar; forraje_verano solo si las etiquetas agrupan maíz y sorgo.
- prob_max: número entre 0 y 1 = la probabilidad máxima del Random Forest para esa parcela. NUNCA vacío cuando acuerdo_metodos es "2/2" o "1/2" (el validador rechaza el archivo).
- acuerdo_metodos: "2/2" o "1/2", según la REGLA DE ACUERDO de la TAREA. Solo si el Random Forest no pudo dar clase a una parcela (sin variables): "1/1" con prob_max vacío y el resto de la fila igual que en las reglas; dime cuántas y cuáles.
- abstencion: true o false.
- edad_perenne_anios: entero ≥ 0 solo en alfalfa y nogal no abstenidas; vacío en los demás.
- estado_plazo: libre, por_vencer o comprometida, con la viñeta "Estado" de S9 §5 pegada abajo; vacío en las abstenidas.
- grupo_fenologico: copia el de las reglas (columna grupo_fenologico del respaldo).
Coherencia que revisa el validador: abstencion = true si prob_max < 0.6, si acuerdo_metodos = "1/2" o si ftw_confianza < 50 (data/params.json: mapa.umbral_abstencion y mapa.ftw_confianza_min). abstencion = true ⇔ cultivo_actual = sin_clasificar. Abstenida ⇒ edad_perenne_anios y estado_plazo vacíos.
tabla_metodos.csv: enfoque (único por fila, por ejemplo "A_reglas" y "B_random_forest"), f1_macro (entre 0 y 1), f1_por_clase (texto, por ejemplo "alfalfa: …; nogal: …"), tiempo (texto).
Además: A42_cobertura_exactitud.png y fuentes_A42.csv (archivo, url_o_api, fecha_consulta, sha256).
Escribe los CSV con pandas (index=False). No los abras ni los guardes con Excel o Sheets: convierten "2/2" en fecha.

DOCUMENTOS DE REFERENCIA (pegados)
S9 §6, prueba 1 (copiada tal cual):
| 1 | Mapa de cultivos | F1 macro con bloques espaciales de 5 km; áreas con Olofsson; abstención si p < 0.6 |
S9 §5, viñeta "Estado" (copiada tal cual):
- **Estado:** libre (anual o descanso); por vencer (alfalfa con 3 años o más [S]); comprometida (alfalfa joven o nogal).
Regla de la edad, kit A3-M paso 9 (copiada tal cual):
   - edad_perenne_anios, con cultivo_actual de A4.2:
     · alfalfa: años agrícolas consecutivos en estado perenne contados hacia atrás desde 2026; mínimo 1 si el mapa de 2026 dice alfalfa;
     · nogal: años consecutivos con señal de verano (estado verano, doble o perenne) contados hacia atrás desde 2026. El nogal pierde la hoja en invierno y puede no cumplir la regla de 8 meses: su condición de perenne la da el mapa de cultivos, y la memoria solo le calcula la antigüedad;
     · los demás cultivos y las parcelas abstenidas: null.
Advertencia del kit v4, sección A4 (copiada tal cual):
> **Advertencia sobre Fields of The World:** su benchmark no incluye México y el riego árido de Norteamérica no está en su entrenamiento. Se usan sus predicciones globales de 2025 (CC-BY-4.0), con filtro de confianza por polígono y revisión manual de las 3 protagonistas (B1). En la página se declara: *"Field boundaries are NN predictions outside the model's training domain; filtered by confidence and manually reviewed for the showcased fields."*
Formato de los archivos (dato de la sesión de datos):
- hls_reflect_2025_10_a_2026_09.tif: bandas con nombre AAAA_MM_azul, AAAA_MM_verde, AAAA_MM_rojo, AAAA_MM_nir, AAAA_MM_swir1, AAAA_MM_swir2 (en las descripciones de banda del TIF); Int16 multiplicado por 10,000; -32768 = sin dato.
- hls_mensual_parcelas.csv: id, mes (AAAA-MM), banda (ndvi, lswi, bsi), mediana, p25, p75, n_validos; ya en su escala.
- etiquetas_unidas.csv (P3): id (campo de parcelas_base.geojson que contiene el punto), punto_id, bloque (cuadrícula de 5 km), uso (entrenamiento o validacion), clase_P2, clase_P3, clase_desempate, clase_final, acuerdo.
[PEGA AQUÍ el docstring de datos/colab/A4_cultivos_reglas.py (rama datos-satelite; pídelo a Cristian): son las reglas fenológicas del enfoque A, con sus umbrales y su fuente.]
[PEGA AQUÍ, si Cristian te la pasó, la tabla de la Estadística Agrícola 2016-2017 de Conagua, Cuadro 3.5 (archivo 29). Si no está, la comparación se reporta como "no realizada: falta la referencia".]

TAREA
NOTA DEL EQUIPO (entradas): todo se lee de Raiz_entregas/. Antes de escribir nada, copia Raiz_entregas/cultivos_parcelas.csv (versión de reglas) a Raiz/cuadernos/cultivos_parcelas_reglas_respaldo.csv y usa esa copia como enfoque A. Mi salida cultivos_parcelas.csv SUSTITUYE a la de reglas en Raiz_entregas/ (es la única excepción a la regla 3).
NOTA DEL EQUIPO (enfoque A): las reglas ya están calculadas (respaldo). No las reprogrames: documenta cada regla en una tabla a partir del docstring pegado. Para evaluarlas, su clase es grupo_fenologico; donde grupo_fenologico es anual_verano o sin_clasificar, las reglas no dan cultivo y eso cuenta como error en su F1 (dilo en la tabla).
NOTA DEL EQUIPO (variables, pasos que puedo hacer antes de tener las etiquetas): (1) por parcela y por mes de 2025-10 a 2026-09, con rasterio y el polígono de parcelas_base.geojson (píxeles cuyo centro cae dentro; si ninguno, all_touched=True), la mediana, p25 y p75 de azul, verde, rojo, nir, swir1 y swir2 de hls_reflect_2025_10_a_2026_09.tif, después de convertir -32768 a NaN y dividir entre 10,000; (2) únelas con mediana, p25 y p75 de ndvi, lswi y bsi de hls_mensual_parcelas.csv. Imprime cuántas parcelas y meses quedan sin dato. No rellenes huecos en silencio: dime cuántos hay y propón cómo tratarlos (por ejemplo, una versión de scikit-learn que acepte NaN); espera mi OK. Guarda la tabla de variables en Raiz/cuadernos/A42_variables.csv.
NOTA DEL EQUIPO (etiquetas): entreno SOLO con etiquetas_unidas.csv de uso = entrenamiento y clase_final distinta de no_se, unidas por id a la tabla de variables. Las de uso = validacion no se usan aquí (son de P3 para Olofsson). Si un id tiene etiquetas con clases distintas, sácalo del entrenamiento y lístalo. Imprime cuántas etiquetas quedan por clase y por bloque; si alguna clase tiene muy pocas o hay menos de dos bloques, detente y avísame.
NOTA DEL EQUIPO (REGLA DE ACUERDO ENTRE MÉTODOS, propuesta [S]; Cristian la confirma antes de entregar):
- clase de las reglas = grupo_fenologico del respaldo (la clase que dieron las reglas antes de la abstención);
- grupo_fenologico igual a la clase del Random Forest → "2/2";
- grupo_fenologico = anual_verano y el Random Forest da chile, algodon, maiz_forrajero, sorgo o forraje_verano → "2/2" (las reglas solo dicen "anual de verano"; el Random Forest dice cuál);
- cualquier otro caso, incluido grupo_fenologico = sin_clasificar → "1/2".
Con "2/2", cultivo_actual = la clase del Random Forest (si no hay abstención).
NOTA DEL EQUIPO (salida): una fila por cada una de las parcelas de parcelas_base.geojson. prob_max y la clase del Random Forest salen del modelo entrenado con TODAS las etiquetas de entrenamiento, aplicado a todas las parcelas. edad_perenne_anios: con la regla pegada sobre memoria_parcelas.csv; imprime las diferencias con la edad del respaldo en las parcelas donde los dos métodos dicen alfalfa o nogal. estado_plazo: con la viñeta "Estado" de S9 §5 y data/params.json (plazo.alfalfa_por_vencer). Imprime cuántas de las parcelas con grupo_fenologico = anual_verano quedan clasificadas (no abstenidas).
Tarea A4.2. En A4_mapa_cultivos.ipynb (Raiz/cuadernos/), con hls_mensual_parcelas.csv y hls_reflect_2025_10_a_2026_09.tif de Raiz_entregas/ y las etiquetas acordadas (etiquetas_unidas.csv de Raiz_entregas/). Los enfoques A y B son OBLIGATORIOS; el C, SOLO SI SOBRA TIEMPO.
A) REGLAS FENOLÓGICAS (interpretables):
- reglas simples con pico de NDVI, meses verdes y meses de suelo desnudo para cada clase;
- documente cada regla en una tabla.
B) RANDOM FOREST (o LightGBM):
- con las variables mensuales (mediana, p25, p75 de las bandas, NDVI y LSWI);
- importancia de variables.
C) RED NEURONAL PREENTRENADA (Presto, NASA Harvest) — SOLO SI SOBRA TIEMPO (S9 §8):
- ÚNICAMENTE si el núcleo y la segunda línea de S9 §8 están terminados;
- utilice el repositorio oficial de Presto (nasaharvest/presto) para obtener embeddings por parcela en CPU, con un clasificador logístico encima;
- declare el supuesto: Presto se preentrenó con Sentinel-2 L1C a 10 m y aquí se alimenta con HLS a 30 m;
- si en 1.5 horas no se ejecuta, se abandona y se reporta "attempted, not completed".

VALIDACIÓN:
- validación cruzada ESPACIAL por bloques (cuadrícula de 5 km), NUNCA K-fold aleatorio (usa la columna bloque de etiquetas_unidas.csv como grupo, por ejemplo con GroupKFold);
- reporte F1 macro, F1 por clase y la matriz de confusión de cada enfoque en una tabla comparativa (enfoque | F1 macro | F1 por clase | tiempo de cómputo);
- la MÉTRICA PRINCIPAL es el F1 macro (declarada antes de ver resultados).

ABSTENCIÓN: cultivo_actual = "sin_clasificar" y abstencion = true si:
- prob_max < 0.6;
- los enfoques no coinciden (acuerdo 1/2);
- ftw_confianza < 50.
CURVA COBERTURA–EXACTITUD (diagnóstico; no cambia la regla): con las probabilidades fuera de pliegue de Random Forest, SOLO en la muestra de entrenamiento (nunca en la de validación Olofsson), reporte el % de parcelas retenidas y el F1 macro de las retenidas para umbrales de 0.4 a 0.8. El umbral de 0.6 queda fijo. Guarde la figura como A42_cobertura_exactitud.png en Raiz_entregas/.

Si los cereales de invierno no se separan, agrúpelos en "cereal_invierno". Si las etiquetas traen "forraje_verano", úsela como una sola clase y regístrelo en la tabla de métodos.

SALIDA:
- cultivo_actual, prob_max, acuerdo_metodos y abstencion por parcela (sin modificar otros campos), en Raiz_entregas/cultivos_parcelas.csv, con las 8 columnas del ESQUEMA DE SALIDA;
- la tabla comparativa en Raiz_entregas/tabla_metodos.csv.

PRUEBA:
- verificación de esquema contra el ESQUEMA DE SALIDA (8 columnas en orden; una fila por parcela; prob_max sin vacíos salvo en filas "1/1"; coherencia de la abstención);
- % de parcelas abstenidas (reportarlo; si es > 50%, notifíquelo), comparado con las de solo reglas;
- el área por cultivo del mapa frente a la estadística agrícola más reciente de Conagua para el DR-005 (pegada arriba si Cristian la pasó; referencia verificada: Estadística Agrícola 2016-2017, Cuadro 3.5, archivo 29): tabla de diferencias en %, indicando el año de la referencia y que la zona piloto no es el distrito.
Explique en 6 líneas qué enfoque obtuvo el mejor desempeño y por qué.
```

**Ajustes al texto del kit en este bloque:**
- «En datos/A4_mapa_cultivos.ipynb, con data/processed/hls_mensual_parcelas.csv y las etiquetas acordadas.» → «En A4_mapa_cultivos.ipynb (Raiz/cuadernos/), con hls_mensual_parcelas.csv y hls_reflect_2025_10_a_2026_09.tif de Raiz_entregas/ y las etiquetas acordadas (etiquetas_unidas.csv de Raiz_entregas/).»
- «NUNCA K-fold aleatorio;» → se agregó «(usa la columna bloque de etiquetas_unidas.csv como grupo, por ejemplo con GroupKFold)».
- «Guarde una figura en docs/figuras/.» → «Guarde la figura como A42_cobertura_exactitud.png en Raiz_entregas/.»
- «(sin modificar otros campos);» → «(sin modificar otros campos), en Raiz_entregas/cultivos_parcelas.csv, con las 8 columnas del ESQUEMA DE SALIDA;»
- «la tabla comparativa en docs/figuras/tabla_metodos.csv.» → «en Raiz_entregas/tabla_metodos.csv.»
- «verificación de esquema (o validar_contrato.py → "CONTRATO OK");» → «verificación de esquema contra el ESQUEMA DE SALIDA (…);»
- «(reportarlo; si es > 50%, notifíquelo);» → se agregó «comparado con las de solo reglas».
- «(de data/raw/conagua;» → «(pegada arriba si Cristian la pasó;».

**Prueba de aceptación** (kit A4.2, con los ajustes):
```text
PRUEBA:
- verificación de esquema contra el ESQUEMA DE SALIDA (8 columnas en orden; una fila por parcela; prob_max sin vacíos salvo en filas "1/1"; coherencia de la abstención);
- % de parcelas abstenidas (reportarlo; si es > 50%, notifíquelo), comparado con las de solo reglas;
- el área por cultivo del mapa frente a la estadística agrícola más reciente de Conagua para el DR-005 (referencia verificada: Estadística Agrícola 2016-2017, Cuadro 3.5, archivo 29): tabla de diferencias en %, indicando el año de la referencia y que la zona piloto no es el distrito.
Explique en 6 líneas qué enfoque obtuvo el mejor desempeño y por qué.
```

**Plan B:** el kit no trae uno para A4.2, y los enfoques A y B son obligatorios. Si el Random Forest no corre, use R1 y avise a Cristian: mientras tanto se queda la versión de solo reglas que ya está en el buzón (por eso se respalda y no se borra). «Parcelas y cultivo de 2026» es núcleo: dentro del núcleo solo se simplifica (kit R3).

**Líneas de LEEME.md:**
```text
cultivos_parcelas.csv | Reglas fenológicas (sesión de datos, A4) y Random Forest sobre hls_reflect_2025_10_a_2026_09.tif y hls_mensual_parcelas.csv (HLS L30/S30 v002) con etiquetas_unidas.csv; validación espacial por bloques de 5 km; abstención según kit A4.2; edad con kit A3-M paso 9 sobre memoria_parcelas.csv | 2026-11-14 | colab/A4_mapa_cultivos.ipynb
tabla_metodos.csv | F1 macro y por clase de reglas y Random Forest; validación cruzada espacial por bloques de 5 km (kit A4.2) | 2026-11-14 | colab/A4_mapa_cultivos.ipynb
A42_cobertura_exactitud.png | Probabilidades fuera de pliegue del Random Forest, muestra de entrenamiento (kit A4.2) | 2026-11-14 | colab/A4_mapa_cultivos.ipynb
fuentes_A42.csv | Fuentes de A4.2: hls_reflect_2025_10_a_2026_09.tif, hls_mensual_parcelas.csv, parcelas_base.geojson, respaldo de cultivos_parcelas.csv de reglas, memoria_parcelas.csv y etiquetas_unidas.csv (sha256) | 2026-11-14 | colab/A4_mapa_cultivos.ipynb
```
Aviso: `ENTREGA: cultivos_parcelas.csv — prueba OK (reglas + Random Forest)`.

---

## Figuras del mapa y de la memoria

Son tareas de apoyo para la página y la exposición. La tabla 0.4-B solo pide «figura PNG».
- **Cuándo:** dom hasta 8:00, figuras del mapa y de la memoria; dom 8:00–11:00, figuras para la página (kit §3).
- **Reglas:** cada figura lee sus números de las entregas; el título dice la fuente («NASA HLS L30/S30 v002»), sin logotipos de NASA; en la memoria va la nota «Rule-based reading of monthly greenness; not a crop census.» (kit C2).
- **Nombres:** `fig_mapa_cultivos.png`, `fig_memoria_protagonistas.png`, … (empiezan con `fig_` y terminan en `.png`). Cada una lleva su línea en `LEEME.md`.

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P2 HLS y memoria.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el Chrome de Cristian) y sus exportaciones ya están en Raiz_entregas/.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). No sobrescribas archivos de otras personas ni de la sesión de datos. Los id de parcela son los de Raiz_entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la lista de figuras guardadas, con su tamaño en píxeles.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize.
7. Usa bibliotecas comunes (pandas, numpy, geopandas, rasterio, matplotlib). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro de qué archivo sale cada número de cada figura.
9. Guarda también fuentes_FIG.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada tabla usada. Ninguna celda vacía.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_FIG.csv), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Solo figuras PNG en Raiz_entregas/ (la tabla 0.4-B pide "figura PNG"), con nombre que empiece con fig_, y fuentes_FIG.csv.

DOCUMENTOS DE REFERENCIA (pegados)
[PEGA AQUÍ la lista de figuras que pide Cristian para la página.]

TAREA
Con cultivos_parcelas.csv, memoria_parcelas.csv, parcelas_base.geojson y hls_mensual_parcelas.csv de Raiz_entregas/, genera las figuras que te pido, una celda por figura. En el título o pie de cada figura va la fuente: "Source: NASA HLS L30/S30 v002; Raíz analysis". En la franja de memoria va la nota fija "Rule-based reading of monthly greenness; not a crop census." Sin logotipos. Las parcelas abstenidas van en gris con la leyenda "Not classified". No escribas en la figura ningún número que no venga de las tablas.
PRUEBA: cada figura abre, se lee en un teléfono y cada número que muestra está en una entrega con su línea en LEEME.md.
```
- **Hora límite:** dom 8:00 (figuras del mapa y de la memoria) y dom 11:00 (figuras para la página; código congelado).
- **Prueba de aceptación:** la del bloque.
- **Plan B:** si no hay tiempo, se usan capturas de pantalla de la web real (S10 §8).

**Línea de LEEME.md** (una por figura, más la de `fuentes_FIG.csv`):
```text
fig_<nombre>.png | <tablas de origen en Raiz_entregas> | 2026-11-15 | colab/figuras_P2.ipynb
fuentes_FIG.csv | Fuentes de las figuras de P2: tablas de Raiz_entregas (sha256) | 2026-11-15 | colab/figuras_P2.ipynb
```
