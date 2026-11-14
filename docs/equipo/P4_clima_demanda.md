<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# P4 · Heladas, back-test H1, contraste de ET y la pregunta de las mentorías

**Qué le toca ahora** (S9 §10; kit §3; decisiones del integrador del 14-nov a las 10:30):
1. **A2:** `heladas.json`, a partir de `eto_diaria.csv`.
2. **A6:** el back-test H1. Necesita `LBQCH.csv` del SIH, que **no está** en `data/raw/sih` del repo (vea [A6](#a6--back-test-h1)).
3. **A8:** el contraste regional de ET queda **«not run»** por ahora (vea [A8](#a8--contraste-regional-de-et-por-ahora-not-run)).
4. **Mentorías de las 16:00 y las 17:00:** llevar la pregunta abierta sobre la lámina del modelo frente a INIFAP (vea [la pregunta](#pregunta-para-las-mentorías-de-las-1600-y-las-1700)).

**Ya está hecho y no se rehace** (lo entregó la sesión de datos; detalle en [README, «Estado a las 10:30»](README.md#estado-a-las-1030-sábado-14-nov)). **No recalcule A1 ni A5**: úselos desde `Raiz_entregas`.

| Archivo en `Raiz_entregas` | Pieza | Qué trae |
|---|---|---|
| `eto_diaria.csv` | A1 | NASA POWER y ETo FAO-56, del 1984-01-01 al 2026-11-09: `fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m` (puede traer columnas de más) |
| `rotaciones.json`, `demanda_cultivos.csv` | A5 | Lámina bruta por rotación y por cultivo en millares/ha (P10, P50 y P90; lluvia 0 % y −20 %), con FAO-56, POWER y Monte Carlo |
| `relieve_parcelas.csv`, `relieve_rutas.geojson`, `relieve_meta.json`, `nasadem_zona_piloto.tif` | A9 | Relieve, rutas de escurrimiento y tormenta de referencia |

| Orden | Pieza | Archivos que entrega | Hora límite |
|---|---|---|---|
| 1 | [A2 · heladas](#a2--heladas-por-fecha) | `heladas.json`, `fuentes_A2.csv` | Sáb 12:00 (kit §3). P5 la usa en los filtros de siembra |
| 2 | [Pregunta de las mentorías](#pregunta-para-las-mentorías-de-las-1600-y-las-1700) | — (respuestas a Cristian y a P5) | Sáb 16:00 y 17:00 |
| 3 | [A6 · back-test H1](#a6--back-test-h1) | `resultado_H1.md`, `A6_backtest.png`, `fuentes_A6.csv` | Arranque sáb 18:00. Terminado entre dom 8:00 y 11:00 (kit §3) |
| 4 | [A8 · contraste de ET](#a8--contraste-regional-de-et-por-ahora-not-run) | `et_contraste.csv`, `A8_et_contraste.png`, `fuentes_A8.csv`, solo cuando lleguen sus insumos | Dom, antes de las 11:00 (kit A8) |

**Cómo se usa cada bloque** (flujo completo en [README §4](README.md#4-flujo-de-trabajo-de-una-pieza)):
1. Abra un cuaderno en Colab y monte Drive.
2. Pegue el bloque en Gemini y pida **una celda por paso**.
3. Corra la prueba y verifique los datos con [verificar_datos_nasa.md](verificar_datos_nasa.md).
4. Pida la revisión de `docs/prompts/para_gemini.md` con contexto nuevo.
5. Guarde en `Raiz_entregas`, agregue su línea al final de `Raiz_entregas/LEEME.md` y avise.

---

## A2 · Heladas por fecha

| | |
|---|---|
| **Entradas** | `eto_diaria.csv` de `Raiz_entregas` (columna `tmin`). Opcional: la serie de la estación 8044 Delicias del SMN, si está en `Raiz/entradas/` |
| **Cuaderno** | `A2_heladas.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00 (kit §3). P5 la usa en B3 (filtro de siembra y heladas) |
| **Verificación de datos** | [verificar_datos_nasa.md → NASA POWER](verificar_datos_nasa.md#1-nasa-power-a1-a2-a5-a6-y-a9) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P4 Clima, demanda y back-test.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el Chrome de Cristian) y sus exportaciones ya están en Raiz_entregas/.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/. No sobrescribas archivos de otras personas ni de la sesión de datos. Los id de parcela son los de Raiz_entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: llaves, tipos y valores del JSON.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso pide Earth Engine, dime qué archivo necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, matplotlib). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A2.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía. Para un archivo de Raiz_entregas/, url_o_api = "Raiz_entregas/<archivo>".
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_A2.csv), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual; aquí solo heladas.json, con la "estructura de A2" del paso 5):
| A1 y A2 (P4) | `eto_diaria.csv` y `heladas.json` | (fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m); estructura de A2 |
LO QUE ACEPTA EL VALIDADOR (motor/ensamblar.py, regla «heladas»):
- ultima_primavera y primera_otono: objetos con p10, p50 y p90. Los tres como texto "MM-DD" (fecha del año), y p10 ≤ p50 ≤ p90. El día del año se imprime en la prueba, no va en el archivo;
- prob_helada_despues_de: objeto no vacío; cada llave es una fecha "MM-DD" y cada valor una probabilidad entre 0 y 1;
- fuente: texto no vacío.
eto_diaria.csv NO la escribo: ya la entregó la sesión de datos. Además: fuentes_A2.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
Dato de la sesión de datos: eto_diaria.csv cubre del 1984-01-01 al 2026-11-09 (NASA POWER, punto 28.19 N, −105.45 O). "Años con datos completos" = años con todos sus días; imprime cuáles son.

TAREA
NOTA DEL EQUIPO: POWER es una celda regional, no una estación. El campo "fuente" de heladas.json dice de qué serie sale (eto_diaria.csv, NASA POWER, con su periodo) y, si se usó, la estación del SMN.
Tarea A2. En A2_heladas.ipynb (Raiz/cuadernos/), con eto_diaria.csv de Raiz_entregas/ (columna tmin):
1) Defina helada = Tmin ≤ 0 °C. Para cada año con datos completos, obtenga la fecha de la ÚLTIMA helada de primavera (enero–junio) y la PRIMERA de otoño (julio–diciembre).
2) Calcule los percentiles 10, 50 y 90 de cada una (en día del año y como fecha).
   - Nota: para la última de primavera, el percentil 90 corresponde a la helada tardía.
   - Para la primera de otoño, el percentil 10 corresponde a la helada temprana.
3) Si existe en Raiz/entradas/ la serie del SMN con la estación de referencia 8044 Delicias, repita el cálculo con la estación y compare.
   - POWER es una celda regional, no una estación. Reporte la diferencia en días.
4) Calcule la probabilidad de helada después de cada fecha de siembra entre el 1-feb y el 15-abr (cada 7 días).
5) Guarde heladas.json en Raiz_entregas/:
   - {"ultima_primavera": {p10, p50, p90}, "primera_otono": {...}, "prob_helada_despues_de": {"02-01": 0.xx, ...}, "fuente": "..."}

PRUEBA DE ACEPTACIÓN:
- La última helada p50 debe ubicarse en febrero–abril y la primera p50 en octubre–diciembre. [Control: INEGI 1983 reporta marzo y noviembre para Delicias.]
- Si no se ubica en esos rangos, revise el código antes de continuar.
Explique cómo se utilizará este resultado para el chile.
```

**Ajustes al texto del kit en este bloque:**
- «En datos/A2_heladas.ipynb, con data/processed/eto_diaria.csv (columna tmin):» → «En A2_heladas.ipynb (Raiz/cuadernos/), con eto_diaria.csv de Raiz_entregas/ (columna tmin):»
- «Si existe data/raw/smn/ con la estación» → «Si existe en Raiz/entradas/ la serie del SMN con la estación»
- «Guarde data/processed/heladas.json:» → «Guarde heladas.json en Raiz_entregas/:»

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
heladas.json | Derivado de eto_diaria.csv (NASA POWER Daily, community=AG, 28.19 N −105.45 O, 1984–2026); helada = Tmin ≤ 0 °C; percentiles 10, 50 y 90 | 2026-11-14 | colab/A2_heladas.ipynb
fuentes_A2.csv | Fuentes de A2: eto_diaria.csv de Raiz_entregas (sha256) y, si se usó, la serie del SMN | 2026-11-14 | colab/A2_heladas.ipynb
```
Aviso: `ENTREGA: heladas.json — prueba OK`. Avise también a P5: la usa en sus filtros.

---

## Pregunta para las mentorías de las 16:00 y las 17:00

**La pregunta abierta** (integrador, 14-nov 10:30). La lámina bruta en parcela que calcula el modelo (A5, P50) sale bastante más alta que la lámina del INIFAP que cita S9 §5:

| Cultivo | Modelo, P50 (millares/ha; A5, cifras del integrador) | INIFAP (millares/ha; S9 §5 [V]) |
|---|---|---|
| Alfalfa | 28.4 | 17.5 |
| Algodón | 14.7 | 6.8 |
| Maíz forrajero | 11.1 | 5.5 |

**Lo que más la mueve:** la eficiencia parcelaria, que hoy es un supuesto de 0.45–0.70 [S] sin valor medido en el DR-005 (`supuestos.json` de la sesión de datos; también `data/params.json` → `eficiencia.parcelaria`, pendiente).

**Qué preguntar al técnico o mentor** (en este orden):
1. **¿Dónde se mide el millar?** ¿En la toma de la parcela, en la del módulo o en la presa? Hoy el supuesto es «toma de la parcela» [S] (S9 §12; `data/params.json` → `dotaciones.punto_medicion`).
2. **¿Qué eficiencia parcelaria es realista** para riego por gravedad en Delicias? ¿Hay algún aforo, estudio o documento que la respalde?
3. **¿Las láminas del INIFAP son láminas aplicadas en la parcela?** ¿Para qué condiciones?

**Cómo se registra:**
- Anote el **cargo** de quien responde (sin nombre), la **hora** y la respuesta tal cual la dijo.
- Páselo a Cristian y a P5 en un mensaje: P5 actualiza `dotaciones.json` si cambia el punto de medición (kit B2, paso 2) y cita la respuesta en `propuesta_supuestos.md`.
- **No cambie usted ninguna cifra** ni recalcule A5: los supuestos los cambia solo su dueña, la sesión de datos, cuando Cristian lo decida.

**Quién va:** Cristian y uno más (S10 §7). Si usted no entra, deje la tabla y las tres preguntas a quien sí vaya antes de las 15:00 (S10 §7, a las 15:00: «Preparar mentorías: 3 preguntas concretas»).

---

## A6 · Back-test H1

| | |
|---|---|
| **Entradas** | `LBQCH.csv` del SIH (serie diaria de La Boquilla) en `Raiz/entradas/`; patrón de cultivos de Conagua (`Raiz/entradas/`); `eto_diaria.csv` hasta el 13-mar-2026 y la lámina de A5 (`rotaciones.json`, `demanda_cultivos.csv`), de `Raiz_entregas` |
| **`LBQCH.csv` todavía no está** | No está en `data/raw/sih` del repo: a las 10:30, `data/raw/` está vacía. S10 §7 pedía descargarlo el viernes en el navegador. Si alguien lo tiene, que lo suba a `Raiz/entradas/` con su fecha de descarga. Si nadie lo descargó, puede bajarlo en el navegador desde el portal del SIH de Conagua. **Avise a Cristian ya**, no a las 18:00: sin la serie, el kit A6 (paso 2) usa el respaldo de prensa del preregistro, rotulado |
| **Documento clave** | `preregistro_H1.md` (archivo 30). No está en el repo: pídalo a Cristian. **No se modifica el criterio** |
| **Cuaderno** | `A6_backtest.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Arranque sáb 18:00–20:30; resultado sáb 20:30–1:00; `resultado_H1.md` terminado entre dom 8:00 y 11:00 (kit §3) |
| **Verificación de datos** | [verificar_datos_nasa.md → SIH LBQCH.csv](verificar_datos_nasa.md#8-sih-lbqchcsv-a6) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P4 Clima, demanda y back-test.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura (aquí van LBQCH.csv y el patrón de cultivos de Conagua);
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el Chrome de Cristian) y sus exportaciones ya están en Raiz_entregas/.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/. No sobrescribas archivos de otras personas ni de la sesión de datos. Los id de parcela son los de Raiz_entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: archivos guardados y, para cada tabla usada, columnas, número de filas y nulos.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso pide Earth Engine, dime qué archivo necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, matplotlib). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A6.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía. Para un archivo de Raiz_entregas/ o de Raiz/entradas/, url_o_api = la carpeta y el nombre del archivo (y, para LBQCH.csv, la URL de descarga si la tienes).
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_A6.csv y las figuras), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A6 (P4) | `resultado_H1.md` y figura PNG | Según el preregistro (archivo 30) |
El validador acepta resultado_H1.md como texto UTF-8 no vacío. La figura se llama A6_backtest.png. Además: fuentes_A6.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
S8, decisión 7 (copiada tal cual):
| 7 | Back-test | Verdad = salida por obra de toma de La Boquilla del 14-mar al 14-jul-2026; hm³ diarios = caudal (m³/s) × 86,400 ÷ 10⁶. No equivale a la entrega en parcela |
S9 §6, prueba 2 (copiada tal cual):
| 2 | Back-test 2026 (H1, preregistrado) | Con datos al 14-mar, el error al 14-jul debe ser menor que el de las líneas base L1 y L1-s. Verdad: salida por obra de toma de La Boquilla (SIH) |
[PEGA AQUÍ preregistro_H1.md completo (archivo 30), que te pasa Cristian. Sin él, no se empieza.]
[PEGA AQUÍ los encabezados (nombres de columna) de LBQCH.csv tal como vienen en el archivo. Si no hay LBQCH.csv, escribe: "LBQCH.csv no disponible".]

TAREA
NOTA DEL EQUIPO: uso SOLO la información disponible al 14-mar-2026 para el modelo; la verdad (SIH) se lee por nombre de columna. La lámina del modelo sale de rotaciones.json y demanda_cultivos.csv de Raiz_entregas/ (A5, ya calculada por la sesión de datos): no la recalcules. Si no hay LBQCH.csv, dilo en la primera celda y usa el respaldo del paso 2 con su rótulo. El resultado se reporta tal como salga, favorable o no.
Tarea A6. Lea preregistro_H1.md (archivo 30; no está en el repo: se lo pasa Cristian) (publicado; NO modifique el criterio) y siga EXACTAMENTE su protocolo, en A6_backtest.ipynb (Raiz/cuadernos/):
1) Utilice ÚNICAMENTE la información disponible al 14-mar-2026:
   - almacenamiento de La Boquilla del SIH (LBQCH.csv en Raiz/entradas/);
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
5) Una gráfica (A6_backtest.png): línea del modelo con su banda P10–P90, L1-s, L1, L2 y los puntos observados, cada uno con su rótulo de fuente.
6) Redacte resultado_H1.md (en Raiz_entregas/) con el resultado TAL COMO SE OBTENGA, comparado con el criterio preregistrado: |error del modelo| < |error de L1-s| y < |error de L1| en el punto principal.

PRUEBA: la gráfica es clara y el texto indica explícitamente "meets / does not meet the preregistered criterion" y la fuente de verdad utilizada.
```

**Ajustes al texto del kit en este bloque:**
- «Lea docs/preregistro_H1.md (publicado;» → «Lea preregistro_H1.md (archivo 30; no está en el repo: se lo pasa Cristian) (publicado;»
- «en datos/A6_backtest.ipynb:» → «en A6_backtest.ipynb (Raiz/cuadernos/):»
- «almacenamiento de La Boquilla de data/raw/sih;» → «almacenamiento de La Boquilla del SIH (LBQCH.csv en Raiz/entradas/);»
- «el patrón de cultivos de ciclos previos de data/raw/conagua;» → «el patrón de cultivos de ciclos previos de Conagua (Raiz/entradas/);»
- «5) Una gráfica:» → «5) Una gráfica (A6_backtest.png):»
- «6) Redacte docs/resultado_H1.md» → «6) Redacte resultado_H1.md (en Raiz_entregas/)»

**Prueba de aceptación** (kit A6):
```text
PRUEBA: la gráfica es clara y el texto indica explícitamente "meets / does not meet the preregistered criterion" y la fuente de verdad utilizada.
```

**Plan B:** el kit no trae uno para A6, y el back-test es núcleo: no se corta (S9 §8; kit R3).
- Si la serie del SIH no está o no sirve, se usa el respaldo de prensa que el prompt indica, con su rótulo.
- Si el preregistro no llega, no se empieza: avise a Cristian.

**Líneas de LEEME.md:**
```text
resultado_H1.md | Back-test H1 según el preregistro (archivo 30); verdad: SIH LBQCH.csv (Conagua), caudal × 86,400 ÷ 10⁶ = hm³/día, o respaldo de prensa rotulado; lámina de A5 (rotaciones.json, demanda_cultivos.csv); meets / does not meet | 2026-11-15 | colab/A6_backtest.ipynb
A6_backtest.png | Modelo P10–P90, L1-s, L1, L2 y observados con su fuente | 2026-11-15 | colab/A6_backtest.ipynb
fuentes_A6.csv | Fuentes de A6: LBQCH.csv (SIH, Conagua), patrón de cultivos de Conagua, eto_diaria.csv al 13-mar-2026, rotaciones.json y demanda_cultivos.csv (sha256) | 2026-11-15 | colab/A6_backtest.ipynb
```
Aviso: `ENTREGA: resultado_H1.md — prueba OK`.

---

## A8 · Contraste regional de ET (por ahora «not run»)

**Por qué no se empieza todavía:**
- El kit A8, paso 1, usa `etc_mensual.csv` (ETc mensual **por parcela**: `id, opcion, mes, etc_mm_p50`). **A5 de la sesión de datos no produce ese archivo.** El integrador le pedirá a la sesión de datos una tabla de **ETc mensual por cultivo**.
- Las series de SSEBop (y WaPOR, si hay acceso) se sacan de Earth Engine: también las extrae la sesión de datos.
- **Mientras no lleguen las dos cosas, A8 es «not run»** y la página lo dice: "regional ET contrast: not run". Usted no lo calcula por otro camino ni recalcula A5.

| | |
|---|---|
| **Entradas, cuando lleguen** | La tabla de ETc mensual por cultivo (sesión de datos), `cultivos_parcelas.csv` y `parcelas_base.geojson` (`area_ha`), y las series de SSEBop y WaPOR (sesión de datos), todo en `Raiz_entregas` |
| **Cuaderno** | `A8_et_contraste.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Dom, antes de las 11:00 (kit A8). Si a esa hora no hay insumos, se queda «not run» |
| **Verificación de datos** | [SSEBop](verificar_datos_nasa.md#5-ssebop-viirs-v6-a8) y [WaPOR](verificar_datos_nasa.md#6-wapor-v3-nivel-1-a8) |

**Bloque para pegar en Gemini** (solo cuando Cristian avise que llegaron los insumos):
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P4 Clima, demanda y back-test.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el Chrome de Cristian) y sus exportaciones ya están en Raiz_entregas/.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/. No sobrescribas archivos de otras personas ni de la sesión de datos. Los id de parcela son los de Raiz_entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso pide Earth Engine, dime qué archivo necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, geopandas, matplotlib). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A8.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía. Para un archivo de Raiz_entregas/, url_o_api = "Raiz_entregas/<archivo>".
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_A8.csv y las figuras), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A8 (P4) | `et_contraste.csv` y figura PNG | (mes, et_modelo_mm, et_ssebop_mm, et_wapor_mm) |
LO QUE ACEPTA EL VALIDADOR (motor/esquemas.py): mes (AAAA-MM o 1–12; sin repetir), et_modelo_mm, et_ssebop_mm y et_wapor_mm (números ≥ 0 o vacíos). 12 filas (2025-10 a 2026-09), en mm por mes; et_wapor_mm vacío si no hubo acceso a WaPOR. La figura se llama A8_et_contraste.png. Además: fuentes_A8.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
S8, decisión 4 (copiada tal cual):
| 4 | Contraste de ET | ET modelada agregada a la zona frente a SSEBop VIIRS v6 (USGS, 1 km) y WaPOR v3 nivel 1 (FAO, 300 m). Nunca por parcela; rótulo «regional» |
[PEGA AQUÍ el nombre y las columnas de la tabla de ETc mensual por cultivo que entregó la sesión de datos.]
[PEGA AQUÍ lo que diga la sesión de datos sobre sus series de SSEBop y WaPOR: archivo, banda, unidades, factor de escala y periodo.]

TAREA
NOTA DEL EQUIPO: los pasos 2 y 3 (Earth Engine) los hizo la sesión de datos; yo hago los pasos 1, 4 y 5 con sus tablas. No hay etc_mensual.csv por parcela: el paso 1 usa la tabla de ETc mensual POR CULTIVO. Para cada mes: ETc P50 del cultivo_actual de cada parcela clasificada (cultivos_parcelas.csv, abstencion = false), ponderada por area_ha de parcelas_base.geojson. Imprime qué superficie quedó fuera (abstenida o con un cultivo sin fila en la tabla). Antes de comparar, convierte todo a mm por mes y dime qué conversión aplicaste a cada serie.
Tarea A8. En A8_et_contraste.ipynb (Raiz/cuadernos/):
1) ET modelada: con la tabla de ETc mensual por cultivo (sesión de datos; sustituye a etc_mensual.csv), ETc mensual P50 de la opción ACTUAL de cada parcela clasificada, agregada a la zona piloto como promedio ponderado por superficie (mm por mes), de oct-2025 a sep-2026.
2) SSEBop VIIRS v6 mensual (USGS; 1 km; Earth Engine: projects/usgs-ssebop/viirs_et_v6_monthly): promedio sobre el rectángulo de la zona piloto, mismos meses. Verifique en el catálogo la banda, las unidades y el factor de escala antes de usarlo. (Lo hizo la sesión de datos: uso su serie.)
3) WaPOR v3 nivel 1 (FAO; 300 m; CC-BY-4.0): verifique cómo se accede (catálogo de Earth Engine o portal de la FAO). Si no hay acceso sin una descarga pesada, use solo SSEBop y declárelo. (Lo hizo la sesión de datos: uso su serie, si existe.)
4) Tabla y figura con las series mensuales; diferencia en mm y en %. Declare que la ET de satélite incluye parcelas sin clasificar, caminos y vegetación no agrícola del rectángulo, y que la modelada es ETc potencial del cultivo, no ET medida.
5) Guarde en Raiz_entregas/ et_contraste.csv (mes, et_modelo_mm, et_ssebop_mm, et_wapor_mm) y la figura (A8_et_contraste.png).

PRUEBA: 12 meses con unidades comprobadas (mm por mes); el texto lleva el rótulo "regional comparison; not field-level validation" y no usa "validated" para parcelas. Si la tarea no se ejecuta, la página dice "regional ET contrast: not run".
```

**Ajustes al texto del kit en este bloque:**
- «En datos/A8_et_contraste.ipynb:» → «En A8_et_contraste.ipynb (Raiz/cuadernos/):»
- «1) ET modelada: con etc_mensual.csv (A5),» → «1) ET modelada: con la tabla de ETc mensual por cultivo (sesión de datos; sustituye a etc_mensual.csv),»
- En los pasos 2 y 3 se quitó «Haga primero una corrida piloto y anote el consumo de EECU» y se agregó que los hizo la sesión de datos (decisión a: Earth Engine solo en esa sesión).
- «5) Guarde et_contraste.csv (» → «5) Guarde en Raiz_entregas/ et_contraste.csv (»; se agregó el nombre de la figura.

**Prueba de aceptación** (kit A8):
```text
PRUEBA: 12 meses con unidades comprobadas (mm por mes); el texto lleva el rótulo "regional comparison; not field-level validation" y no usa "validated" para parcelas. Si la tarea no se ejecuta, la página dice "regional ET contrast: not run".
```

**Plan B:** si los insumos no llegan antes de las 11:00 del domingo, no hay archivo: la página dice "regional ET contrast: not run". Si no hay acceso a WaPOR, se usa solo SSEBop y se declara.

**Líneas de LEEME.md** (solo si se ejecuta):
```text
et_contraste.csv | ET modelada (ETc mensual por cultivo de A5, ponderada por superficie de cultivos_parcelas.csv) frente a SSEBop VIIRS v6 mensual (USGS, 1 km) y WaPOR v3 nivel 1 (FAO, 300 m, CC-BY-4.0), series de la sesión de datos; regional comparison; not field-level validation | 2026-11-15 | colab/A8_et_contraste.ipynb
A8_et_contraste.png | et_contraste.csv | 2026-11-15 | colab/A8_et_contraste.ipynb
fuentes_A8.csv | Fuentes de A8: tabla de ETc mensual por cultivo, cultivos_parcelas.csv, parcelas_base.geojson y series de SSEBop y WaPOR de la sesión de datos (sha256) | 2026-11-15 | colab/A8_et_contraste.ipynb
```
Aviso: `ENTREGA: et_contraste.csv — prueba OK`.
