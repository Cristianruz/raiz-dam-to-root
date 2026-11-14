<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# P3 · Etiquetas, exactitud del mapa y H3

**Qué le toca** (S9 §10; kit §3):
- unir las etiquetas a ciegas (A4.1);
- apoyar a P2 en A3 y en el mapa de cultivos (A4.2);
- validar la memoria de 2026 con las etiquetas;
- el experimento natural de 2025, H3 (A7);
- la exactitud Olofsson (A4.3).

**Lo que cambió hoy y manda sobre el kit** (detalle en [README §6](README.md#6-cambios-respecto-al-kit-mandan-sobre-el-kit)):
- **Usted no usa Earth Engine.** Trabaja con las tablas de `Raiz/entregas/` y las hojas de etiquetas de `Raiz/entradas/`.
- **Entrega** en `Raiz/entregas/`, carpeta plana sin `P3/`, con una línea por archivo en `Raiz/entregas/LEEME.md`.
- **Rutas:** donde el kit dice `docs/figuras/` o `docs/resultado_H3.md`, se entrega en `Raiz/entregas/`; Cristian lo pasa a `docs/`.

| Orden | Pieza | Archivos que entrega (tabla 0.4-B) | Hora límite |
|---|---|---|---|
| 1 | [A4.1 · unión de etiquetas](#a41--unión-de-etiquetas) | `etiquetas_unidas.csv`, `fuentes_A41.csv` | sáb 12:00 |
| 2 | Apoyo a P2 en A3; preparar A4.3 | — | sáb 12:00–14:30 |
| 3 | [A4.2 con P2](#a42--mapa-de-cultivos-con-p2) | (los entrega P2) | sáb 15:00–20:30 |
| 4 | [Validar la memoria de 2026](#validar-la-memoria-de-2026-con-las-etiquetas) | (`memoria_validacion.csv`, lo entrega P2) | sáb 18:00–20:30 |
| 5 | [A7 · H3](#a7--experimento-natural-de-2025-h3) | `h3_series.csv`, `resultado_H3.md`, figura PNG, `fuentes_A7.csv` | Arranque sáb 20:30–1:00; `resultado_H3.md` terminado antes del dom 11:00 |
| 6 | [A4.3 · Olofsson](#a43--exactitud-olofsson) | `olofsson.csv`, figura PNG, `fuentes_A43.csv` | dom, antes de las 11:00 |

**Cómo se usa cada bloque:**
1. Abra un cuaderno en Colab y monte Drive.
2. Pegue el bloque en Gemini.
3. Pida **una celda por paso**.
4. Corra la prueba y pida la revisión de `docs/prompts/para_gemini.md` con contexto nuevo.
5. Guarde los archivos en `Raiz/entregas/` con su línea en `LEEME.md`, el cuaderno en `Raiz/cuadernos/`, y avise: `ENTREGA: <archivo> — prueba OK`.

El flujo completo está en [README §4](README.md#4-flujo-de-trabajo-de-una-pieza).

---

## A4.1 · Unión de etiquetas

| | |
|---|---|
| **Entradas** | Las hojas de etiquetas de cada persona, en `Raiz/entradas/`. Se hicieron a ciegas en Copernicus Browser antes del evento |
| **Documentos que no están en el repo** | Manual de etiquetado (archivo 39) y protocolo Olofsson (archivo 22, P4). Pídalos a Cristian. Sin el archivo 22 se usan 50 puntos por clase (lo dice el prompt) |
| **Cuaderno** | `A4_etiquetas.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00. P2 la necesita para A4.2 a las 15:00 |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P3 Etiquetas, exactitud y H3.

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
9. Guarda también fuentes_A41.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A41.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A4.1 (P3) | `etiquetas_unidas.csv` | id, punto_id, bloque, uso (entrenamiento o validación), clase_P2, clase_P3, clase_desempate, clase_final, acuerdo |
Además: fuentes_A41.csv (archivo, url_o_api, fecha_consulta, sha256). uso = "entrenamiento" o "validacion". Ningún bloque aporta puntos a los dos usos.

DOCUMENTOS DE REFERENCIA (pegados)
[PEGA AQUÍ el protocolo Olofsson del archivo 22, P4 (pídelo a Cristian). Si no está, usa 50 puntos por clase, como dice el prompt, y dilo.]
[PEGA AQUÍ los nombres de las hojas de etiquetas que hay en entradas/ y sus columnas (encabezados).]

TAREA
NOTA DEL EQUIPO: la columna id es el id del polígono de parcelas_muestra.geojson que contiene el punto (lo entrega la sesión de Chrome en entregas/). Si ese archivo aún no está, deja id vacío y avísame.
Tarea A4.1. En A4_etiquetas.ipynb (Raiz/cuadernos/). Las etiquetas se hicieron A CIEGAS antes del evento, en Copernicus Browser, por dos personas (manual 39). No se generan miniaturas en Earth Engine.
1) Lea de entradas/ las hojas de etiquetas de cada persona. Reporte cuántos puntos tiene cada una y cuántos comparten.
2) Compare a las dos personas: calcule el % de acuerdo global y por clase. Donde no coincidan, use la columna de desempate (tercera persona) si existe; si no, asigne "no_se" y descarte el punto.
3) Clases: alfalfa, nogal, maiz_forrajero, sorgo, chile, algodon, cereal_invierno, barbecho, no_se. Si las hojas traen la clase agrupada "forraje_verano" (maíz o sorgo forrajeros), consérvela como una sola clase y avise; no la reparta sin etiquetas que la separen.
4) Asigne a cada punto su bloque espacial (cuadrícula de 5 km) y su uso: entrenamiento o validación. La muestra de VALIDACIÓN es independiente, según el protocolo Olofsson del archivo 22, P4 (o 50 por clase si no está listo). Ningún bloque aporta puntos a los dos usos.
5) Guarde etiquetas_unidas.csv en Raiz/entregas/ (id, punto_id, bloque, uso, clase_P2, clase_P3, clase_desempate, clase_final, acuerdo).

PRUEBA: tabla de puntos por clase y por uso; % de acuerdo; número de puntos descartados. Si alguna clase queda con muy pocos puntos de validación, avíselo antes de seguir.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En datos/A4_etiquetas.ipynb.» → «En A4_etiquetas.ipynb (Raiz/cuadernos/).»
- «Guarde etiquetas_unidas.csv (» → «Guarde etiquetas_unidas.csv en Raiz/entregas/ (»

**Prueba de aceptación** (kit A4.1):
```text
PRUEBA: tabla de puntos por clase y por uso; % de acuerdo; número de puntos descartados. Si alguna clase queda con muy pocos puntos de validación, avíselo antes de seguir.
```

**Plan B:** el kit no trae uno para A4.1. Si una clase queda con muy pocos puntos de validación, avise antes de seguir (lo dice la prueba). Agruparla en `forraje_verano` o en `cereal_invierno` solo se hace como dicen A4.1 y A4.2.

**Líneas de LEEME.md:**
```text
etiquetas_unidas.csv | Etiquetas a ciegas de 2 personas en Copernicus Browser (manual 39), con desempate; bloques de 5 km | 2026-11-14 | colab/A4_etiquetas.ipynb
fuentes_A41.csv | Fuentes de A4.1: hojas de etiquetas de entradas/ (sha256) | 2026-11-14 | colab/A4_etiquetas.ipynb
```
Aviso: `ENTREGA: etiquetas_unidas.csv — prueba OK`.

---

## A4.2 · Mapa de cultivos (con P2)

- El bloque, la prueba y las líneas de `LEEME.md` están en [P2 → A4.2](P2_hls_memoria.md#a42--mapa-de-cultivos-de-2026-con-p3). **Los entrega P2**, para que no haya dos archivos con el mismo nombre.
- **Su parte:**
  - las etiquetas (`etiquetas_unidas.csv`);
  - revisar la tabla de reglas fenológicas;
  - revisar que la validación sea por bloques espaciales de 5 km, **nunca K-fold aleatorio**, y que la curva cobertura–exactitud use solo la muestra de entrenamiento.
- **Hora:** sáb 15:00–20:30 (kit §3).

---

## Validar la memoria de 2026 con las etiquetas

- **Qué es:** el paso 10 de A3-M (kit). El bloque está en [P2 → A3-M](P2_hls_memoria.md#a3-m--memoria-de-la-parcela-20162026) y el archivo `memoria_validacion.csv` lo entrega P2.
- **Su parte:**
  - confirmar que solo se usan las etiquetas de la zona piloto;
  - revisar las correspondencias: alfalfa ↔ perenne; maíz, sorgo, algodón y chile ↔ verano o doble; cereal de invierno ↔ invierno o doble; barbecho ↔ descanso; nogal ↔ verano o perenne;
  - revisar la tabla de acuerdo antes de que P2 la entregue.
- **Hora:** sáb 18:00–20:30 (kit §3).

---

## A7 · Experimento natural de 2025 (H3)

Segunda línea (S9 §8). Requiere la memoria de 2019 a 2025 (A3-M) y el mapa de 2026 (A4.2).

| | |
|---|---|
| **Entradas** | `memoria_mensual.csv`, `memoria_parcelas.csv` y `cultivos_parcelas.csv` de `Raiz/entregas/` |
| **Documento clave** | S9, Anexo B (texto de H3; ya va pegado en el bloque). Si el preregistro publicado en OSF difiere, **prevalece el preregistro**: pídaselo a Cristian |
| **Cuaderno** | `A7_h3.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Arranque sáb 20:30–1:00. `resultado_H3.md` terminado entre dom 8:00 y 11:00 (kit §3) |

**Regla de oro:** los grupos se definen **antes** de mirar cualquier dato de 2025. Un resultado desfavorable se publica con la misma visibilidad.

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P3 Etiquetas, exactitud y H3.

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
9. Guarda también fuentes_A7.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A7.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A7 (P3) | `resultado_H3.md`, `h3_series.csv` y figura PNG | (anio_agricola, grupo, umbral_ndvi, n_parcelas, proporcion_con_cultivo_verano) |
Además: fuentes_A7.csv (archivo, url_o_api, fecha_consulta, sha256). umbral_ndvi solo puede valer 0.40 o sus sensibilidades 0.35 y 0.45 (S9 §5).

DOCUMENTOS DE REFERENCIA (pegados)
S9, Anexo B "H3 para el preregistro" (copiado tal cual):
**H3 (confirmatory; satellite natural experiment).** In 2025 DR-005 received no dam allocation (press-reported). Using HLS monthly composites per estimated field in the pilot area: (a) among annual-crop fields (fields that the parcel memory does not flag as perennial in 2024 and that the 2026 crop map does not classify as pecan orchard), the share with an active summer crop in 2025 (maximum monthly NDVI in Jun–Sep ≥ 0.40) is at least 25 percentage points below the 2019–2024 median of the same share; and (b) among pecan orchards (fields classified as pecan in the 2026 crop map), the same share in 2025 is within 10 percentage points of its 2019–2024 median. H3 is supported only if (a) and (b) hold. Orchards are identified in 2026, so orchards removed before 2026 are not observed; this survivorship limitation is stated, and the same share is also reported for fields that showed the orchard pattern throughout 2019–2024. The number of fields in each group is reported. Alfalfa is reported descriptively. Thresholds of 0.35 and 0.45 are reported as sensitivity. Known-outcome disclosure: the press reported 12,000–15,000 ha planted with wells in 2025; no satellite series was computed before registration. The former H2 (subsidence, OPERA) is withdrawn.
S9 §6, prueba 3 (copiada tal cual):
| 3 | Experimento natural de 2025 (H3, se añade al preregistro) | En el año sin agua de las presas, la proporción de parcelas anuales con cultivo de verano cae 25 puntos o más frente a la mediana 2019–2024, y la de huertas de nogal se mantiene a 10 puntos o menos de su mediana. Se publica el número de parcelas de cada grupo |
[PEGA AQUÍ el texto de H3 del preregistro publicado en OSF, si Cristian lo tiene y difiere del Anexo B.]

TAREA
NOTA DEL EQUIPO: trabajo con las tablas de entregas/; no uso Earth Engine. Si la memoria no cubre 2019–2025, detente y avísame: se aplica el plan B ("not run").
Tarea A7. Lea el texto registrado de H3 (preregistro publicado; Anexo B de S9, que le pego). NO modifique el criterio ni los umbrales. Trabaje en A7_h3.ipynb (Raiz/cuadernos/) con memoria_mensual.csv, memoria_parcelas.csv y cultivos_parcelas.csv de Raiz/entregas/.

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

SALIDAS (en Raiz/entregas/): h3_series.csv (anio_agricola, grupo, umbral_ndvi, n_parcelas, proporcion_con_cultivo_verano), una figura con las dos series de 2019 a 2026 y resultado_H3.md con el resultado TAL COMO SE OBTENGA.

PRUEBA: el texto dice explícitamente "H3 supported / not supported", muestra (a) y (b) por separado, el número de parcelas de cada grupo y la sensibilidad. Un resultado desfavorable se publica con la misma visibilidad.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «Trabaje en datos/A7_h3.ipynb con memoria_mensual.csv, memoria_parcelas.csv y cultivos_parcelas.csv.» → «Trabaje en A7_h3.ipynb (Raiz/cuadernos/) con memoria_mensual.csv, memoria_parcelas.csv y cultivos_parcelas.csv de Raiz/entregas/.»
- «y docs/resultado_H3.md con el resultado» → «y resultado_H3.md con el resultado»
- «SALIDAS: h3_series.csv» → «SALIDAS (en Raiz/entregas/): h3_series.csv»

**Prueba de aceptación** (kit A7):
```text
PRUEBA: el texto dice explícitamente "H3 supported / not supported", muestra (a) y (b) por separado, el número de parcelas de cada grupo y la sensibilidad. Un resultado desfavorable se publica con la misma visibilidad.
```

**Plan B** (kit A7):
**Plan B:** si la memoria no cubre 2019–2025, H3 se reporta como «not run» en la página, con la razón.

**Líneas de LEEME.md:**
```text
h3_series.csv | Memoria HLS L30/S30 v002 (memoria_mensual.csv, memoria_parcelas.csv) y cultivos_parcelas.csv; criterio del Anexo B de S9 / preregistro | 2026-11-15 | colab/A7_h3.ipynb
resultado_H3.md | Resultado de H3 tal como se obtuvo (supported / not supported), con (a), (b), número de parcelas por grupo y sensibilidad | 2026-11-15 | colab/A7_h3.ipynb
A7_series_h3.png | h3_series.csv (2019–2026) | 2026-11-15 | colab/A7_h3.ipynb
fuentes_A7.csv | Fuentes de A7: memoria_mensual.csv, memoria_parcelas.csv, cultivos_parcelas.csv (sha256) | 2026-11-15 | colab/A7_h3.ipynb
```
Aviso: `ENTREGA: resultado_H3.md — prueba OK`.

---

## A4.3 · Exactitud Olofsson

| | |
|---|---|
| **Entradas** | `etiquetas_unidas.csv` (solo `uso = validacion`) y `cultivos_parcelas.csv`. Para las proporciones de área, la superficie por clase del mapa (`area_ha` de `parcelas_base.geojson`) |
| **Documento** | Olofsson et al. 2014 y el protocolo del archivo 22, P4 (pídalo a Cristian) |
| **Cuaderno** | `A4_olofsson.ipynb` en `Raiz/cuadernos/` (el kit no le da nombre) |
| **Hora límite** | Dom, antes de las 11:00 (kit A4.3). Se prepara el sáb 12:00–14:30 |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P3 Etiquetas, exactitud y H3.

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
9. Guarda también fuentes_A43.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A43.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A4.3 (P3) | `olofsson.csv` y figura PNG | Según el prompt A4.3 |
Además: fuentes_A43.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
S9 §6, prueba 1 (copiada tal cual):
| 1 | Mapa de cultivos | F1 macro con bloques espaciales de 5 km; áreas con Olofsson; abstención si p < 0.6 |
[PEGA AQUÍ el protocolo Olofsson del archivo 22, P4, o las fórmulas de Olofsson et al. 2014 que te pase Cristian. Sin ese texto, Gemini no debe escribir las fórmulas de memoria: que se detenga y avise.]

TAREA
NOTA DEL EQUIPO: uso SOLO la muestra de validación (uso = "validacion"), nunca la de entrenamiento. Las etiquetas son fotointerpretación a ciegas, no datos de campo.
Tarea A4.3. Con la muestra de VALIDACIÓN etiquetada a ciegas (independiente del entrenamiento), calcule según Olofsson et al. 2014:
- la matriz de error en proporción de área;
- la exactitud del usuario y del productor por clase y la exactitud global, cada una con IC 95%;
- el área ajustada por clase con IC 95%.
SIN kappa. Guarde olofsson.csv y una figura PNG en Raiz/entregas/.
Etiqueta: "accuracy vs. blind photo-interpretation (not field data)".
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «Guarde docs/figuras/olofsson.csv y una figura.» → «Guarde olofsson.csv y una figura PNG en Raiz/entregas/.»

**Prueba de aceptación:** el prompt A4.3 no trae una sección «PRUEBA». Antes de entregar se comprueba:
- matriz de error en proporción de área;
- exactitud del usuario y del productor por clase y exactitud global, cada una con IC 95 %;
- área ajustada por clase con IC 95 %;
- sin kappa;
- la etiqueta "accuracy vs. blind photo-interpretation (not field data)".

**Plan B:** el kit no trae uno. Si no se termina antes de las 11:00, la página dice «not run» en esa parte de la prueba 1 (kit C6).

**Líneas de LEEME.md:**
```text
olofsson.csv | Olofsson et al. 2014 sobre la muestra de validación a ciegas (etiquetas_unidas.csv) y cultivos_parcelas.csv; accuracy vs. blind photo-interpretation (not field data) | 2026-11-15 | colab/A4_olofsson.ipynb
A43_olofsson.png | olofsson.csv | 2026-11-15 | colab/A4_olofsson.ipynb
fuentes_A43.csv | Fuentes de A4.3: etiquetas_unidas.csv, cultivos_parcelas.csv, parcelas_base.geojson (sha256) | 2026-11-15 | colab/A4_olofsson.ipynb
```
Aviso: `ENTREGA: olofsson.csv — prueba OK`.
