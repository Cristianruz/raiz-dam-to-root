<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# P3 · Etiquetas, exactitud del mapa y H3

**Qué le toca ahora** (S9 §10; kit §3; decisiones del integrador del 14-nov a las 10:30):
1. **A4.1:** unir las etiquetas a ciegas en `etiquetas_unidas.csv`. **Es urgente:** P2 la necesita para entrenar el Random Forest (A4.2) desde las 15:00.
2. **Apoyo a P2 en A4.2:** revisar la validación por bloques y la regla de abstención.
3. **A7 (H3):** el experimento natural de 2025, con `memoria_parcelas.csv` y `cultivos_parcelas.csv`. El criterio preregistrado no cambia.
4. **A4.3:** la exactitud Olofsson.

**Ya está hecho y no se rehace** (lo entregó la sesión de datos; detalle en [README, «Estado a las 10:30»](README.md#estado-a-las-1030-sábado-14-nov)). Usted lo **lee directo de `Raiz_entregas`**:
- `parcelas_base.geojson`: 338 campos de Fields of The World, 5,794 ha, `id` de `P0001` en adelante, de norte a sur;
- `memoria_parcelas.csv` y `memoria_resumen.csv`: la memoria 2016–2026 por parcela;
- `cultivos_parcelas.csv`: hoy, la versión de **solo reglas** (`acuerdo_metodos` «1/1 (reglas)», `prob_max` vacío). P2 la sustituirá por la de reglas + Random Forest (`acuerdo_metodos` «2/2» o «1/2»). **Lea las columnas por nombre**, no por posición, y diga en cada resultado qué versión usó.

**No hay `parcelas_muestra.geojson`** ([README §6, decisión e](README.md#6-decisiones-del-14-nov-mandan-sobre-el-kit)). Los rásteres de HLS cubren solo la zona piloto: una etiqueta sirve si su punto cae dentro de uno de los 338 campos. En `etiquetas_unidas.csv`, `id` es el `id` de ese campo y `punto_id` identifica el punto.

| Orden | Pieza | Archivos que entrega | Hora límite |
|---|---|---|---|
| 1 | [A4.1 · unión de etiquetas](#a41--unión-de-etiquetas) | `etiquetas_unidas.csv`, `fuentes_A41.csv` | Sáb 12:00 (kit §3). P2 la usa a las 15:00 |
| 2 | [Apoyo a P2 en A4.2](#apoyo-a-p2-en-a42) | — (lo entrega P2) | Sáb 15:00–20:30 |
| 3 | [A7 · H3](#a7--experimento-natural-de-2025-h3) | `h3_series.csv`, `resultado_H3.md`, `A7_series_h3.png`, `fuentes_A7.csv` | Arranque sáb 20:30–1:00; `resultado_H3.md` terminado entre dom 8:00 y 11:00 (kit §3) |
| 4 | [A4.3 · Olofsson](#a43--exactitud-olofsson) | `olofsson.csv`, `A43_olofsson.png`, `fuentes_A43.csv` | Dom, antes de las 11:00 (kit A4.3) |

**Cómo se usa cada bloque** (flujo completo en [README §4](README.md#4-flujo-de-trabajo-de-una-pieza)):
1. Abra un cuaderno en Colab y monte Drive.
2. Pegue el bloque en Gemini. Pida **una celda por paso**.
3. Corra la prueba y pida la revisión de `docs/prompts/para_gemini.md` con contexto nuevo.
4. Guarde los archivos en `Raiz_entregas`, agregue su línea al final de `Raiz_entregas/LEEME.md`, el cuaderno en `Raiz/cuadernos/`, y avise: `ENTREGA: <archivo> — prueba OK`.

---

## A4.1 · Unión de etiquetas

| | |
|---|---|
| **Entradas** | Las hojas de etiquetas de cada persona, en `Raiz/entradas/` (se hicieron a ciegas en Copernicus Browser antes del evento), con las coordenadas de cada punto. `parcelas_base.geojson` de `Raiz_entregas`, para el `id` |
| **El `id`** | El `id` del campo de `parcelas_base.geojson` que contiene el punto (unión punto-en-polígono). Un punto fuera de los 338 campos **no entra** al archivo (no tiene datos de HLS y `id` no puede ir vacío): se lista en el cuaderno y se avisa a Cristian |
| **Documentos que no están en el repo** | Manual de etiquetado (archivo 39) y protocolo Olofsson (archivo 22, P4). Pídalos a Cristian. Sin el archivo 22 se usan 50 puntos por clase (lo dice el prompt) |
| **Cuaderno** | `A4_etiquetas.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00 (kit §3) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P3 Etiquetas, exactitud y H3.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura (aquí están las hojas de etiquetas);
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el Chrome de Cristian) y sus exportaciones ya están en Raiz_entregas/.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — ROOT, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/. No sobrescribas archivos de otras personas ni de la sesión de datos. Los id son los de Raiz_entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso pide Earth Engine, dime qué archivo necesito y detente. Los cálculos, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A41.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía. Para un archivo de Raiz_entregas/ o de Raiz/entradas/, url_o_api = la carpeta y el nombre del archivo.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_A41.csv), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A4.1 (P3) | `etiquetas_unidas.csv` | id, punto_id, bloque, uso (entrenamiento o validación), clase_P2, clase_P3, clase_desempate, clase_final, acuerdo |
LO QUE ACEPTA EL VALIDADOR (motor/esquemas.py):
- id: texto, NUNCA vacío = el id (P0001…) del campo de Raiz_entregas/parcelas_base.geojson que contiene el punto;
- punto_id: texto, único (no se repite);
- bloque: texto (celda de la cuadrícula de 5 km);
- uso: "entrenamiento" o "validacion";
- clase_P2, clase_P3, clase_desempate: una clase de la lista o vacío (clase_P2 y clase_P3 son las dos personas que etiquetaron);
- clase_final: una clase de la lista, nunca vacía;
- acuerdo: texto, nunca vacío (por ejemplo "si", "no" o "desempate");
- lista de clases: alfalfa, nogal, maiz_forrajero, sorgo, chile, algodon, cereal_invierno, barbecho, no_se, forraje_verano;
- un mismo bloque no puede tener filas de los dos usos.
Además: fuentes_A41.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
[PEGA AQUÍ el protocolo Olofsson del archivo 22, P4 (pídelo a Cristian). Si no está, usa 50 puntos por clase, como dice el prompt, y dilo.]
[PEGA AQUÍ los nombres de las hojas de etiquetas que hay en Raiz/entradas/ y sus columnas (encabezados), incluidas las de coordenadas.]
[PEGA AQUÍ el valor de mapa.bloque_km de data/params.json (GitHub del proyecto). No lo escribas de memoria.]

TAREA
NOTA DEL EQUIPO (id): la columna id es el id del campo de Raiz_entregas/parcelas_base.geojson (Fields of The World) que contiene el punto etiquetado. Asígnalo con una unión espacial punto-en-polígono (geopandas.sjoin, predicate="within"; mismo CRS, EPSG:4326). Imprime: puntos totales, puntos con id, puntos sin id (fuera de los campos de la zona piloto) y campos con más de un punto. Un punto sin id NO entra al archivo (id no puede quedar vacío): lístalo en el cuaderno (punto_id, clase_final, bloque, uso) y avísame para pasárselo a Cristian. No existe parcelas_muestra.geojson: no lo busques.
NOTA DEL EQUIPO (descartados): un punto donde las dos personas no coinciden y no hay desempate queda en el archivo con clase_final = no_se. Nadie lo usa para entrenar ni para validar.
NOTA DEL EQUIPO (bloques): la zona piloto es pequeña; imprime cuántos bloques quedan y cuántos puntos tiene cada uno por uso. Si un uso queda con menos de dos bloques, detente y avísame antes de guardar: sin bloques distintos no hay validación espacial.
Tarea A4.1. En A4_etiquetas.ipynb (Raiz/cuadernos/). Las etiquetas se hicieron A CIEGAS antes del evento, en Copernicus Browser, por dos personas (manual 39). No se generan miniaturas en Earth Engine.
1) Lea de Raiz/entradas/ las hojas de etiquetas de cada persona. Reporte cuántos puntos tiene cada una y cuántos comparten.
2) Compare a las dos personas: calcule el % de acuerdo global y por clase. Donde no coincidan, use la columna de desempate (tercera persona) si existe; si no, asigne "no_se" y descarte el punto.
3) Clases: alfalfa, nogal, maiz_forrajero, sorgo, chile, algodon, cereal_invierno, barbecho, no_se. Si las hojas traen la clase agrupada "forraje_verano" (maíz o sorgo forrajeros), consérvela como una sola clase y avise; no la reparta sin etiquetas que la separen.
4) Asigne a cada punto su bloque espacial (cuadrícula de 5 km) y su uso: entrenamiento o validación. La muestra de VALIDACIÓN es independiente, según el protocolo Olofsson del archivo 22, P4 (o 50 por clase si no está listo). Ningún bloque aporta puntos a los dos usos.
5) Guarde etiquetas_unidas.csv en Raiz_entregas/ (id, punto_id, bloque, uso, clase_P2, clase_P3, clase_desempate, clase_final, acuerdo).

PRUEBA: tabla de puntos por clase y por uso; % de acuerdo; número de puntos descartados. Si alguna clase queda con muy pocos puntos de validación, avíselo antes de seguir.
```

**Ajustes al texto del kit en este bloque:**
- «En datos/A4_etiquetas.ipynb.» → «En A4_etiquetas.ipynb (Raiz/cuadernos/).»
- «Lea de entradas/ las hojas» → «Lea de Raiz/entradas/ las hojas».
- «Guarde etiquetas_unidas.csv (» → «Guarde etiquetas_unidas.csv en Raiz_entregas/ (».
- El `id` ya no es el de la muestra del distrito (kit B1, paso 5), sino el del campo de `parcelas_base.geojson` (decisión e).

**Prueba de aceptación** (kit A4.1):
```text
PRUEBA: tabla de puntos por clase y por uso; % de acuerdo; número de puntos descartados. Si alguna clase queda con muy pocos puntos de validación, avíselo antes de seguir.
```
Además: cuántos puntos quedaron fuera de los 338 campos (y la lista para Cristian) y cuántos bloques hay por uso.

**Plan B:** el kit no trae uno para A4.1. Si una clase queda con muy pocos puntos de validación, avise antes de seguir (lo dice la prueba). Agruparla en `forraje_verano` o en `cereal_invierno` solo se hace como dicen A4.1 y A4.2.

**Líneas de LEEME.md:**
```text
etiquetas_unidas.csv | Etiquetas a ciegas de 2 personas en Copernicus Browser (manual 39), con desempate; id = campo de parcelas_base.geojson que contiene el punto; bloques de 5 km | 2026-11-14 | colab/A4_etiquetas.ipynb
fuentes_A41.csv | Fuentes de A4.1: hojas de etiquetas de Raiz/entradas/ y parcelas_base.geojson de Raiz_entregas (sha256) | 2026-11-14 | colab/A4_etiquetas.ipynb
```
Aviso: `ENTREGA: etiquetas_unidas.csv — prueba OK`. Avise también a P2 en persona: la está esperando.

---

## Apoyo a P2 en A4.2

- El bloque, la prueba y las líneas de `LEEME.md` están en [P2 → A4.2](P2_hls_memoria.md#a42--random-forest-y-comparación-con-las-reglas). **Los entrega P2**, para que no haya dos archivos con el mismo nombre.
- **Su parte:**
  - revisar la tabla de reglas fenológicas (el enfoque A, hecho por la sesión de datos);
  - revisar que la validación sea por bloques espaciales de 5 km (columna `bloque` de su archivo), **nunca K-fold aleatorio**, y que la curva cobertura–exactitud use solo la muestra de entrenamiento;
  - revisar que las etiquetas de `uso = validacion` **no** se usen para entrenar: son las de su Olofsson (A4.3).
- **Hora:** sáb 15:00–20:30 (kit §3).

**La validación de la memoria de 2026 con las etiquetas** (kit A3-M, paso 10; `memoria_validacion.csv`) no está asignada hoy. Si Cristian la pide, se hace después de A7.

---

## A7 · Experimento natural de 2025 (H3)

Segunda línea (S9 §8). Requiere la memoria (ya entregada, 2016–2026) y el mapa de 2026 (A4.2).

| | |
|---|---|
| **Entradas** | `memoria_parcelas.csv` y `cultivos_parcelas.csv` de `Raiz_entregas`. `memoria_mensual.csv` **no se entregó** y no hace falta: `max_verano` ya es el máximo del NDVI mensual de junio a septiembre de cada año agrícola |
| **Documento clave** | S9, Anexo B (texto de H3; ya va pegado en el bloque). Si el preregistro publicado en OSF difiere, **prevalece el preregistro**: pídaselo a Cristian |
| **Cuaderno** | `A7_h3.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Arranque sáb 20:30–1:00. `resultado_H3.md` terminado entre dom 8:00 y 11:00 (kit §3) |

**Regla de oro:** los grupos se definen **antes** de mirar cualquier dato de 2025. El criterio preregistrado no se cambia. Un resultado desfavorable se publica con la misma visibilidad.

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P3 Etiquetas, exactitud y H3.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el Chrome de Cristian) y sus exportaciones ya están en Raiz_entregas/.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — ROOT, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/. No sobrescribas archivos de otras personas ni de la sesión de datos. Los id de parcela son los de Raiz_entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso pide Earth Engine, dime qué archivo necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, matplotlib). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A7.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía. Para un archivo de Raiz_entregas/, url_o_api = "Raiz_entregas/<archivo>".
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_A7.csv y las figuras), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A7 (P3) | `resultado_H3.md`, `h3_series.csv` y figura PNG | (anio_agricola, grupo, umbral_ndvi, n_parcelas, proporcion_con_cultivo_verano) |
LO QUE ACEPTA EL VALIDADOR (motor/esquemas.py):
- anio_agricola: entero, no mayor que 2026;
- grupo: texto (por ejemplo "anuales", "nogal" y "alfalfa");
- umbral_ndvi: solo 0.40 o sus sensibilidades 0.35 y 0.45 (data/params.json, memoria.ndvi_verde);
- n_parcelas: entero ≥ 0 = parcelas del grupo CON dato en la ventana de verano ese año (el denominador);
- proporcion_con_cultivo_verano: FRACCIÓN entre 0 y 1 (no porcentaje), o vacío si n_parcelas = 0;
- sin filas repetidas para (anio_agricola, grupo, umbral_ndvi).
Además: resultado_H3.md (texto), A7_series_h3.png y fuentes_A7.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
S9, Anexo B "H3 para el preregistro" (copiado tal cual):
**H3 (confirmatory; satellite natural experiment).** In 2025 DR-005 received no dam allocation (press-reported). Using HLS monthly composites per estimated field in the pilot area: (a) among annual-crop fields (fields that the parcel memory does not flag as perennial in 2024 and that the 2026 crop map does not classify as pecan orchard), the share with an active summer crop in 2025 (maximum monthly NDVI in Jun–Sep ≥ 0.40) is at least 25 percentage points below the 2019–2024 median of the same share; and (b) among pecan orchards (fields classified as pecan in the 2026 crop map), the same share in 2025 is within 10 percentage points of its 2019–2024 median. H3 is supported only if (a) and (b) hold. Orchards are identified in 2026, so orchards removed before 2026 are not observed; this survivorship limitation is stated, and the same share is also reported for fields that showed the orchard pattern throughout 2019–2024. The number of fields in each group is reported. Alfalfa is reported descriptively. Thresholds of 0.35 and 0.45 are reported as sensitivity. Known-outcome disclosure: the press reported 12,000–15,000 ha planted with wells in 2025; no satellite series was computed before registration. The former H2 (subsidence, OPERA) is withdrawn.
S9 §6, prueba 3 (copiada tal cual):
| 3 | Experimento natural de 2025 (H3, se añade al preregistro) | En el año sin agua de las presas, la proporción de parcelas anuales con cultivo de verano cae 25 puntos o más frente a la mediana 2019–2024, y la de huertas de nogal se mantiene a 10 puntos o menos de su mediana. Se publica el número de parcelas de cada grupo |
Formato de las entradas (dato de la sesión de datos):
- memoria_parcelas.csv: id, anio_agricola, estado (perenne, verano, invierno, doble, descanso, sin_dato), meses_verdes, max_verano (máximo del NDVI mensual de jun–sep del año agrícola; vacío si no hubo dato), max_invierno, dias_suelo_desnudo_feb_abr, meses_validos.
- cultivos_parcelas.csv: id, cultivo_actual, prob_max, acuerdo_metodos, abstencion, edad_perenne_anios, estado_plazo, grupo_fenologico.
[PEGA AQUÍ el texto de H3 del preregistro publicado en OSF, si Cristian lo tiene y difiere del Anexo B.]

TAREA
NOTA DEL EQUIPO: trabajo con las tablas de Raiz_entregas/; no uso Earth Engine. memoria_mensual.csv no existe: el indicador del paso 3 se calcula con max_verano de memoria_parcelas.csv (cultivo de verano activo = max_verano ≥ umbral; max_verano vacío = sin dato en la ventana de verano). Si la memoria no cubre 2019–2025, detente y avísame: se aplica el plan B ("not run"). Imprime qué versión de cultivos_parcelas.csv usaste (valores de acuerdo_metodos: "1/1 (reglas)" = solo reglas; "2/2" y "1/2" = reglas + Random Forest) y escríbelo en resultado_H3.md.
Tarea A7. Lea el texto registrado de H3 (preregistro publicado; Anexo B de S9, que le pego). NO modifique el criterio ni los umbrales. Trabaje en A7_h3.ipynb (Raiz/cuadernos/) con memoria_parcelas.csv y cultivos_parcelas.csv de Raiz_entregas/.

1) Población: parcelas estimadas de la zona piloto.
2) GRUPOS, definidos ANTES de calcular nada de 2025 y sin usar datos de 2025. Definición operativa de este kit; debe coincidir con el preregistro publicado y, si difiere, prevalece el preregistro y se avisa:
   (a) Parcelas anuales: las que NO están en estado perenne en 2024 según la memoria y NO pertenecen al grupo (b). No se filtra por su historial de siembra.
   (b) Huertas de nogal: parcelas con clase nogal en el mapa de cultivos de 2026, no abstenidas.
   Alfalfa (estado perenne en 2024): solo descriptiva.
3) Indicador por año agrícola, de 2019 a 2025: proporción de parcelas del grupo con cultivo de verano activo = máximo del NDVI mensual de jun–sep ≥ 0.40. Las parcelas sin dato en la ventana de verano se excluyen de ese año y se cuentan aparte.
4) Mediana 2019–2024 de cada grupo.
5) CRITERIO (texto del Anexo B):
   (a) la proporción de 2025 del grupo de parcelas anuales queda al menos 25 puntos porcentuales por debajo de su mediana 2019–2024; y
   (b) la proporción de 2025 de las huertas de nogal queda a no más de 10 puntos porcentuales de su mediana 2019–2024.
   H3 se sostiene solo si se cumplen (a) y (b).
6) Sensibilidad: repita con los umbrales 0.35 y 0.45 y repórtelo junto al resultado principal, sin sustituirlo.
7) Controles descriptivos, que no deciden H3:
   - alfalfa: proporción con cultivo de verano activo y meses verdes en 2025 frente a 2019–2024;
   - sesgo de supervivencia: cuántas parcelas con señal de verano y sin cultivo de invierno en todos los años de 2019 a 2024 NO aparecen como nogal en 2026;
   - número de parcelas de cada grupo y de parcelas sin dato por año. Si un grupo es pequeño, dígalo como limitación.
8) Divulgación de resultado conocido: la prensa reportó de 12,000 a 15,000 ha sembradas con pozos en 2025; ninguna serie de satélite se calculó antes del registro.

SALIDAS (en Raiz_entregas/): h3_series.csv (anio_agricola, grupo, umbral_ndvi, n_parcelas, proporcion_con_cultivo_verano), una figura con las dos series de 2019 a 2026 (A7_series_h3.png) y resultado_H3.md con el resultado TAL COMO SE OBTENGA.

PRUEBA: el texto dice explícitamente "H3 supported / not supported", muestra (a) y (b) por separado, el número de parcelas de cada grupo y la sensibilidad. Un resultado desfavorable se publica con la misma visibilidad.
```

**Ajustes al texto del kit en este bloque:**
- «Trabaje en datos/A7_h3.ipynb con memoria_mensual.csv, memoria_parcelas.csv y cultivos_parcelas.csv.» → «Trabaje en A7_h3.ipynb (Raiz/cuadernos/) con memoria_parcelas.csv y cultivos_parcelas.csv de Raiz_entregas/.» (`memoria_mensual.csv` no se entregó; el indicador usa `max_verano`).
- «SALIDAS: h3_series.csv» → «SALIDAS (en Raiz_entregas/): h3_series.csv».
- «una figura con las dos series de 2019 a 2026» → se agregó el nombre «(A7_series_h3.png)».
- «y docs/resultado_H3.md con el resultado» → «y resultado_H3.md con el resultado».

**Prueba de aceptación** (kit A7):
```text
PRUEBA: el texto dice explícitamente "H3 supported / not supported", muestra (a) y (b) por separado, el número de parcelas de cada grupo y la sensibilidad. Un resultado desfavorable se publica con la misma visibilidad.
```

**Plan B** (kit A7): si la memoria no cubre 2019–2025, H3 se reporta como «not run» en la página, con la razón.

**Líneas de LEEME.md:**
```text
h3_series.csv | Memoria HLS L30/S30 v002 (memoria_parcelas.csv, max_verano) y cultivos_parcelas.csv; criterio del Anexo B de S9 / preregistro; umbrales 0.40, 0.35 y 0.45 | 2026-11-15 | colab/A7_h3.ipynb
resultado_H3.md | Resultado de H3 tal como se obtuvo (supported / not supported), con (a), (b), número de parcelas por grupo y sensibilidad | 2026-11-15 | colab/A7_h3.ipynb
A7_series_h3.png | h3_series.csv (2019–2026) | 2026-11-15 | colab/A7_h3.ipynb
fuentes_A7.csv | Fuentes de A7: memoria_parcelas.csv y cultivos_parcelas.csv de Raiz_entregas (sha256) | 2026-11-15 | colab/A7_h3.ipynb
```
Aviso: `ENTREGA: resultado_H3.md — prueba OK`.

---

## A4.3 · Exactitud Olofsson

| | |
|---|---|
| **Entradas** | `etiquetas_unidas.csv` (solo `uso = validacion`), `cultivos_parcelas.csv` y `parcelas_base.geojson` (`area_ha`, para las proporciones de área), todos de `Raiz_entregas` |
| **Clase del mapa de cada etiqueta** | El `cultivo_actual` de su `id` en `cultivos_parcelas.csv`. Como `id` ya es el campo de `parcelas_base.geojson`, no hace falta ninguna unión espacial |
| **Documento** | Olofsson et al. 2014 y el protocolo del archivo 22, P4 (pídalo a Cristian) |
| **Cuaderno** | `A4_olofsson.ipynb` en `Raiz/cuadernos/` (el kit no le da nombre) |
| **Hora límite** | Dom, antes de las 11:00 (kit A4.3). Úsese la versión de reglas + Random Forest de P2 |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P3 Etiquetas, exactitud y H3.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el Chrome de Cristian) y sus exportaciones ya están en Raiz_entregas/.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — ROOT, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/. No sobrescribas archivos de otras personas ni de la sesión de datos. Los id de parcela son los de Raiz_entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Los cálculos, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, geopandas, matplotlib). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A43.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía. Para un archivo de Raiz_entregas/, url_o_api = "Raiz_entregas/<archivo>".
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_A43.csv y las figuras), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A4.3 (P3) | `olofsson.csv` y figura PNG | Según el prompt A4.3 |
El validador acepta olofsson.csv con columnas libres (CSV con encabezado y al menos una fila). La figura se llama A43_olofsson.png. Además: fuentes_A43.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
S9 §6, prueba 1 (copiada tal cual):
| 1 | Mapa de cultivos | F1 macro con bloques espaciales de 5 km; áreas con Olofsson; abstención si p < 0.6 |
[PEGA AQUÍ el protocolo Olofsson del archivo 22, P4, o las fórmulas de Olofsson et al. 2014 que te pase Cristian. Sin ese texto, Gemini no debe escribir las fórmulas de memoria: que se detenga y avise.]

TAREA
NOTA DEL EQUIPO: uso SOLO la muestra de validación (uso = "validacion") y clase_final distinta de no_se; nunca la de entrenamiento. Las etiquetas son fotointerpretación a ciegas, no datos de campo.
NOTA DEL EQUIPO (clase del mapa): en etiquetas_unidas.csv, id ya es el campo de parcelas_base.geojson; la clase del mapa de cada etiqueta es el cultivo_actual de ese id en cultivos_parcelas.csv. Imprime qué versión de cultivos_parcelas.csv usaste (acuerdo_metodos "1/1 (reglas)" = solo reglas; "2/2" y "1/2" = reglas + Random Forest). Las parcelas abstenidas (sin_clasificar) forman su propio estrato del mapa [S]: confírmalo con Cristian y dilo en la nota de la figura. Los pesos de área de cada estrato salen de area_ha de parcelas_base.geojson. Imprime, antes de calcular: etiquetas de validación totales y su número por clase de referencia y por clase del mapa. Si alguna clase queda con muy pocas etiquetas o ninguna, detente y avísame antes de calcular.
Tarea A4.3. Con la muestra de VALIDACIÓN etiquetada a ciegas (independiente del entrenamiento), calcule según Olofsson et al. 2014:
- la matriz de error en proporción de área;
- la exactitud del usuario y del productor por clase y la exactitud global, cada una con IC 95%;
- el área ajustada por clase con IC 95%.
SIN kappa. Guarde olofsson.csv y una figura PNG (A43_olofsson.png) en Raiz_entregas/.
Etiqueta: "accuracy vs. blind photo-interpretation (not field data)".
```

**Ajustes al texto del kit en este bloque:**
- «Guarde docs/figuras/olofsson.csv y una figura.» → «Guarde olofsson.csv y una figura PNG (A43_olofsson.png) en Raiz_entregas/.»

**Prueba de aceptación:** el prompt A4.3 no trae una sección «PRUEBA». Antes de entregar se comprueba:
- matriz de error en proporción de área;
- exactitud del usuario y del productor por clase y exactitud global, cada una con IC 95 %;
- área ajustada por clase con IC 95 %;
- sin kappa;
- cuántas etiquetas de validación se usaron, por clase, y qué versión del mapa;
- la etiqueta "accuracy vs. blind photo-interpretation (not field data)".

**Plan B:** el kit no trae uno. Si no se termina antes de las 11:00, la página dice «not run» en esa parte de la prueba 1 (kit C6).

**Líneas de LEEME.md:**
```text
olofsson.csv | Olofsson et al. 2014 sobre la muestra de validación a ciegas (etiquetas_unidas.csv) y cultivos_parcelas.csv; pesos de área de parcelas_base.geojson; accuracy vs. blind photo-interpretation (not field data) | 2026-11-15 | colab/A4_olofsson.ipynb
A43_olofsson.png | olofsson.csv | 2026-11-15 | colab/A4_olofsson.ipynb
fuentes_A43.csv | Fuentes de A4.3: etiquetas_unidas.csv, cultivos_parcelas.csv y parcelas_base.geojson de Raiz_entregas (sha256) | 2026-11-15 | colab/A4_olofsson.ipynb
```
Aviso: `ENTREGA: olofsson.csv — prueba OK`.
