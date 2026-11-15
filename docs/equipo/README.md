<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Empieza aquí · Guía del equipo para el sábado 14 y el domingo 15 de noviembre

**Para quién:** P2 a P6. Se trabaja con Gemini en Colab o con Claude en el navegador; no hace falta Claude Code.

**Qué manda:** si esta guía y el kit dicen cosas distintas, mandan las decisiones del 14-nov (§6) y el validador del repo (`motor/esquemas.py` y `motor/ensamblar.py`). Después, en orden: S9, el kit v4 y S8.

## Estado a las 10:30 (sábado 14-nov)

**Lo que ya está hecho.** Lo hizo la «sesión de datos» (otra sesión de Claude en el Chrome de Cristian, rama `datos-satelite`, scripts `datos/colab/*.py`) y el integrador lo validó. **No se rehace: se usa.** Los archivos están en la carpeta de Drive `Raiz_entregas`.

| Pieza | Archivos en `Raiz_entregas` | Qué traen |
|---|---|---|
| B1 · parcelas | `parcelas_base.geojson` | 338 campos de Fields of The World, 5,794 ha, `id` de `P0001` en adelante, de norte a sur. Las 3 protagonistas aún no están marcadas: las propone P2 |
| A1 · clima | `eto_diaria.csv` | NASA POWER y ETo FAO-56, del 1984-01-01 al 2026-11-09 |
| A3 y A3-M · satélite | `hls_mensual_parcelas.csv` (bandas `ndvi`, `lswi` y `bsi`), `suelo_desnudo.csv`, `memoria_parcelas.csv`, `memoria_resumen.csv` | Año agrícola 2026 y memoria 2016–2026 por parcela |
| A4 · cultivos, solo reglas | `cultivos_parcelas.csv` | Reglas fenológicas: `acuerdo_metodos` = «1/1 (reglas)» y `prob_max` vacío; además `edad_perenne_anios`, `estado_plazo` y `grupo_fenologico`. Deja **218 de 338 campos abstenidos**: 132 son anuales de verano que las reglas no separan |
| A5 · demanda | `rotaciones.json`, `demanda_cultivos.csv` | Lámina por rotación y por cultivo (FAO-56 + POWER, Monte Carlo) |
| A9 · relieve | `relieve_parcelas.csv`, `relieve_rutas.geojson`, `relieve_meta.json`, `nasadem_zona_piloto.tif` | Pendiente, rutas de escurrimiento y tormenta de referencia |
| Rásteres de Earth Engine | `hls_mensual_2025_10_a_2026_09.tif`, `hls_reflect_2025_10_a_2026_09.tif` y los `hls_ndvi_memoria_<año>.tif` (12 rásteres en total) | Insumos para quien los necesite (P2 en el Random Forest). Earth Engine lo corre **solo** la sesión de datos |

**La web** ya muestra en local los 338 campos reales. Se publica cuando estén los arreglos que faltan.

**Lo que falta, por rol:**

| Rol | Pendiente | Su guía |
|---|---|---|
| P2 | A4.2: Random Forest y comparación con las reglas → `cultivos_parcelas.csv` con `acuerdo_metodos` «2/2» o «1/2» y `prob_max`. Proponer las 3 protagonistas, revisadas en color verdadero | [P2](P2_hls_memoria.md) |
| P3 | A4.1: `etiquetas_unidas.csv` (**urgente**: P2 la necesita para entrenar). A4.3: Olofsson. A7: H3 | [P3](P3_etiquetas_h3.md) |
| P4 | A2: `heladas.json`. A6: back-test H1. A8: queda «not run» por ahora. Llevar a las mentorías la pregunta de la lámina frente a INIFAP | [P4](P4_clima_demanda.md) |
| P5 | B2: `dotaciones.json`. B3: `opciones_b3.json`. `propuesta_supuestos.md`. `cifras.csv` | [P5](P5_dotaciones_rotaciones.md) |
| P6 | Textos (`textos_ui.md`, `plantillas_explicaciones.md`, `whatsapp_plantilla.md`), mentorías, página C6, video, People's Choice y #MejorMeme | [P6](P6_textos_pagina.md) |

**Próximos hitos** (kit §0.1, regla 10; S10 §7):
- **14:30:** las 3 pantallas navegables.
- **16:00 y 17:00:** mentorías obligatorias. Faltar descalifica.
- **20:30:** una parcela real completa, publicada.

## 1. Qué es ROOT (S9 §1)

**ROOT muestra, antes de sembrar, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa.**

- Zona piloto del Distrito de Riego 005 Delicias, Chihuahua. El usuario elige la dotación de la presa con un deslizador, en millares por hectárea, y la web calcula para cuántas hectáreas alcanza cada cultivo.
- En la página en inglés: *"Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover."*

## 2. Hitos del fin de semana (hora de Chihuahua)

**Sábado 14** (kit §0.1, regla 10; kit §3; S10 §7):

| Hora | Qué pasa | Quién |
|---|---|---|
| **14:30** | **HITO: las 3 pantallas navegables** | Cristian |
| **16:00 y 17:00** | **Mentorías obligatorias.** Faltar descalifica. Preguntas clave: dónde se mide el millar y qué eficiencia parcelaria es realista (vea [P4](P4_clima_demanda.md#pregunta-para-las-mentorías-de-las-1600-y-las-1700)) | Cristian y uno más; P6 hace la prueba de pasillo |
| 18:00 | Prueba de usabilidad | P6 |
| **20:30** | **HITO: una parcela completa con datos reales, publicada.** Si no se logra, se aplica R3 (orden de corte) | Todos |
| 21:00 | Cierre de puertas. Quien hace el turno de noche se queda dentro desde antes de las 21:00; los demás vuelven a las 7:00 | — |
| 1:00–5:30 | Cristian duerme dentro de la sede. No se le despierta | — |

**Domingo 15:**

| Hora | Qué pasa |
|---|---|
| 7:00 | Regreso. Una tarea C solo si todo lo A y lo B está listo |
| **8:00** | **Funciones congeladas** |
| 9:00 | Verificación final de inscripción (todos) |
| **11:00** | **Código congelado** |
| 12:00 | Video exportado y probado en una ventana de incógnito |
| 12:30 | Revisión de cifras: página, video, póster y ficha impresa |
| **13:00** | **Primer envío** |
| **14:30** | **Envío final**, con captura de pantalla de la confirmación |
| 15:00 | Montaje de la mesa; ensayo de 4 + 3 minutos, dos veces |
| **17:00–19:00** | **Open House**: exposición de 4 minutos y 3 de preguntas |

**Después del evento:** People's Choice, del 17 al 20 de noviembre (P6). Sin bots: descalifican.

## 3. Quién hace qué (S9 §10; kit §3; decisiones del 14-nov)

| Persona | Responsable de (S9 §10) | Piezas que le quedan | Su guía |
|---|---|---|---|
| Cristian | Repositorio, motor, web, pruebas automáticas y envío | Integra las entregas (K-ENS), motor (B4, X3.1), web, explicaciones (C3) y pruebas (K-TEST). Es el único que hace commits | — |
| Sesión de datos (Claude en el Chrome de Cristian, rama `datos-satelite`) | Earth Engine y todo lo que necesita red | Ya entregó B1, A1, A3, A3-M, A4 (reglas), A5 y A9. Es la **única dueña** de `rotaciones.json` y de `supuestos.json`. Si hace falta algo de Earth Engine, se le pide a Cristian | — |
| P2 | Series de HLS de 2026 y memoria | A4.2 (Random Forest, con P3) y las 3 protagonistas | [P2_hls_memoria.md](P2_hls_memoria.md) |
| P3 | Etiquetas, exactitud del mapa y H3 | A4.1, A4.3 (Olofsson) y A7 (H3) | [P3_etiquetas_h3.md](P3_etiquetas_h3.md) |
| P4 | Clima, demanda y back-test H1 | A2, A6 (H1) y A8 (por ahora «not run»); pregunta para las mentorías | [P4_clima_demanda.md](P4_clima_demanda.md) |
| P5 | Dotaciones, plazos, rotaciones y tabla única de cifras | B2, B3 (`opciones_b3.json`), `propuesta_supuestos.md` y `cifras.csv` | [P5_dotaciones_rotaciones.md](P5_dotaciones_rotaciones.md) |
| P6 | Entrevistas, textos, página, video, People's Choice y meme | Textos, C6, C7 y C8, People's Choice y #MejorMeme; mentorías y prueba de usabilidad | [P6_textos_pagina.md](P6_textos_pagina.md) |

**El cuello de botella es Cristian** (S10 §6). Nadie lo interrumpe salvo por un bloqueo. Las dudas se juntan y se resuelven en la revisión de cada hora.

## 4. Flujo de trabajo de una pieza

**Carpetas de Drive:**
- `Raiz_entregas` (el **buzón**): carpeta **plana**, sin subcarpetas, porque las exportaciones de Drive no pueden crearlas. Ahí están los archivos de la sesión de datos y ahí se entregan los suyos. En Colab se ve en `/content/drive/MyDrive/Raiz_entregas/` si la carpeta está en su unidad o si le agregó un acceso directo en «Mi unidad» (en Drive: clic derecho en la carpeta → Organizar → Agregar acceso directo). Si no aparece, pregunte a Cristian.
- `Raiz/entradas/`: datos de solo lectura (hojas de etiquetas, documentos, series del SIH).
- `Raiz/cuadernos/`: cuadernos y archivos de trabajo.

```
1. Abra su guía de rol → busque la pieza → copie el «Bloque para pegar» (G0 ya completado + prompt del kit)
2. Colab: cuaderno nuevo con el nombre indicado → monte Drive → pegue el bloque en Gemini
3. Lea los archivos de la sesión de datos DIRECTO de Raiz_entregas (no los copie ni los modifique)
4. Pida UNA celda por paso; ejecútela y diga "listo" antes de pedir la siguiente
5. Al final, Gemini imprime la PRUEBA DE ACEPTACIÓN y la verificación de esquema
6. Autoverificación:
   - datos: verificar_datos_nasa.md;
   - cuaderno y tabla: docs/prompts/para_gemini.md, en un chat NUEVO de Gemini
7. Guarde en Drive:
   - tabla(s) + fuentes_<pieza>.csv + figuras → Raiz_entregas;
   - UNA línea por archivo → al final de Raiz_entregas/LEEME.md;
   - el cuaderno → Raiz/cuadernos/
8. Avise en el grupo:  ENTREGA: <archivo> — prueba OK
9. Cristian corre el ensamblador (motor/ensamblar.py). Cada archivo:
   - entra;
   - se rechaza, y el reporte dice el motivo;
   - o queda retenido, esperando parcelas_base.geojson
10. Pegue R2 (§9) en su chat de Gemini y quédese con la explicación: es lo que defiende ante el jurado
```

**No rehaga lo que ya está en `LEEME.md`.** Si un archivo ya tiene su línea, úselo. Dos archivos con el mismo nombre se pisan: antes de guardar, revise que el nombre no sea de otra persona ni de la sesión de datos. La única excepción acordada es `cultivos_parcelas.csv`: la versión de P2 (reglas + Random Forest) sustituye a la de solo reglas ([P2](P2_hls_memoria.md)).

**Qué revisa el ensamblador** (`motor/ensamblar.py` con `motor/esquemas.py`). Rechaza, con el motivo, todo archivo que:
- no tenga su línea en `LEEME.md`;
- no se llame como una llave de `ESQUEMAS` en `motor/esquemas.py`: un nombre que no conoce «no está en la tabla 0.4-B: no se sabe cómo validarlo». Se aceptan además `fuentes_<pieza>.csv` y las figuras `.png`;
- no traiga las columnas obligatorias. Columnas de más solo dan un aviso;
- no cumpla los rangos: P10 ≤ P50 ≤ P90; NDVI entre −1 y 1; `prob_max` entre 0 y 1; estados dentro de su lista; dotaciones dentro del deslizador;
- traiga `id` que no existen en `parcelas_base.geojson`;
- deje vacía una celda que el esquema exige: por ejemplo `id`, `prob_max` cuando `acuerdo_metodos` es «2/2» o «1/2», o el `sha256` de `fuentes_<pieza>.csv`. Si falta el dato, la fila no se entrega: se avisa a Cristian;
- en `plantillas_explicaciones.md`, traiga un dígito fuera de los marcadores `{{…}}`.

Además:
- el código (`.py`, `.ipynb`) no entra por el buzón: Cristian lo revisa y lo copia a mano;
- los rásteres crudos de Earth Engine (`hls_mensual_*.tif`, `hls_reflect_*.tif`, `hls_ndvi_memoria_*.tif`) no son entregas: se listan aparte, sin validarlos y sin pedirles línea;
- dos notas de P5 (`opciones_b3.json` y `propuesta_supuestos.md`) **no tienen esquema**: el reporte las lista como «no está en la tabla 0.4-B». Es lo esperado: Cristian las lee y las copia a mano;
- **nunca corrige en silencio**: si algo no cumple, se rechaza y se dice por qué.

## 5. La línea de LEEME.md y el aviso

`Raiz_entregas/LEEME.md` ya existe: lo creó la sesión de datos. Es una tabla con este encabezado (el ensamblador lo busca):
```text
| archivo | fuente | fecha | script |
|---|---|---|---|
```
Debajo va **una línea por archivo**. Ejemplo:
```text
heladas.json | Derivado de eto_diaria.csv (NASA POWER Daily, community=AG); helada = Tmin ≤ 0 °C; percentiles 10, 50 y 90 | 2026-11-14 | colab/A2_heladas.ipynb
```
- **Cómo agregarla:** al final del archivo. Desde Colab, ábralo en modo «añadir» (`open(ruta, "a")`), **nunca** en modo «escribir» (`"w"`), que borra las líneas de los demás. No edite ni borre líneas ajenas.
- **archivo:** el nombre exacto, igual a la llave de `ESQUEMAS` en `motor/esquemas.py`. También llevan línea `fuentes_<pieza>.csv` y cada figura `.png`. En `<pieza>` va el código sin puntos ni guiones (`fuentes_A2.csv`, `fuentes_A42.csv`…). **No use un nombre que ya usa la sesión de datos** (`fuentes_A1.csv`, `fuentes_A3.csv`, `fuentes_A4.csv`, `fuentes_A5.csv`, `fuentes_A9.csv`, `fuentes_B1.csv`).
- **fuente:**
  - de dónde salen los datos: API, colección o documento, con su periodo y lugar;
  - para una tabla derivada, de qué entregas sale;
  - **sin el carácter «|»**: partiría la línea.
- **fecha:** `AAAA-MM-DD`, el día de la entrega.
- **script:**
  - en un cuaderno, `colab/<nombre del cuaderno>.ipynb`; el cuaderno se guarda en `Raiz/cuadernos/` y Cristian lo pasa al repo;
  - en un texto de P6, el bloque de su guía que usó.
- **Si vuelve a entregar el mismo archivo,** agregue una línea nueva con la fecha nueva: cuenta la última.
- **Sin línea, el archivo no entra.**

**Aviso al grupo** (kit §0.4-B, paso 5): `ENTREGA: <archivo> — prueba OK`.

## 6. Decisiones del 14-nov (mandan sobre el kit)

| # | Decisión | Qué pasaje del kit sustituye |
|---|---|---|
| (a) | **Earth Engine lo corre solo la sesión de datos.** P2 a P6 no se autentican en Earth Engine: trabajan con los archivos que esa sesión dejó en `Raiz_entregas` | Kit §0.3 (P2 con Earth Engine en A3 y A3-M; P4 en A8), G0 «ENTORNO» y regla 6, y los pasos de Earth Engine de A1, A3, A3-M, A8 y A9. Ya coincidía con el kit §0.3, punto 1: «Solo Cristian ejecuta Earth Engine» |
| (b) | **Buzón: carpeta plana `Raiz_entregas`**, con una línea por archivo en `Raiz_entregas/LEEME.md` (`archivo \| fuente \| fecha \| script`, fecha `AAAA-MM-DD`). Sin esa línea el archivo no entra | Kit §0.1, regla 2, y §0.4-B, pasos 1 y 5 (`entregas/<rol>/`). `docs/prompts/para_gemini.md` todavía nombra la carpeta vieja por rol: manda `Raiz_entregas` |
| (c) | **Ya hecho por la sesión de datos:** B1, A1, A3, A3-M, A4 (solo reglas), A5 y A9, más los rásteres de Earth Engine (tabla de arriba). Nadie los rehace | Las filas B1, A1, A3, A3-M, A5 y A9 de las guías de las 9:00 |
| (d) | **Formatos: manda el validador** (`motor/esquemas.py`). Donde difiere de la tabla 0.4-B del kit:<br>• `memoria_resumen.csv`: `id, dias_suelo_desnudo_mediana, anios_con_dato, estado_2025`. `anios_con_dato` = años agrícolas en que se pudieron calcular los días de suelo desnudo (hubo NDVI válido en febrero, marzo y abril); son los años que entran en la mediana (script A3 de la sesión de datos)<br>• `cultivos_parcelas.csv`: `id, cultivo_actual, prob_max, acuerdo_metodos, abstencion, edad_perenne_anios, estado_plazo, grupo_fenologico`. La edad de la perenne va aquí, no en la memoria<br>• `rotaciones.json` y `demanda_cultivos.csv` son salidas de A5 (las lee `motor/b4_cubo.py`)<br>• `relieve_meta.json` trae la tormenta de referencia (`tormenta.mm`, con definición, fuente y periodo) | Filas A3-M, A4.2, A5, B3 y A9 de la tabla 0.4-B |
| (e) | **Etiquetas:** `etiquetas_unidas.csv` lleva `punto_id` (el punto etiquetado) y en `id` el `id` del campo de Fields of The World (`parcelas_base.geojson`) que contiene el punto. No hay `parcelas_muestra.geojson`: los rásteres de HLS cubren solo la zona piloto, así que un punto fuera de los 338 campos no tiene datos y no entra al archivo | Kit A4.1 y B1, paso 5 (muestra del distrito) |
| (f) | **Un solo dueño para `rotaciones.json` y `supuestos.json`: la sesión de datos.** P5 no entrega otro `supuestos.json`: propone valores con fuente en `propuesta_supuestos.md` (nota que lee Cristian). B3 de P5 pasa a `opciones_b3.json` (opciones por cultivo y filtros duros), que sustituirá al diseño provisional `data/opciones_b4.json` | Kit B3 (P5 creaba `rotaciones.json` y `supuestos.json`) y la fila «Supuestos» de la tabla 0.4-B |
| (g) | **El validador rechaza con motivo** lo que no cumpla. Nunca corrige en silencio | Kit K-ENS, paso 2 (ya lo decía) |
| — | P6 trabaja con la app de Gemini **o con Claude en el navegador** | Kit §0.3: «Claude (chat del Project)» |
| — | **G0 ya completado en cada bloque**, con las reglas ajustadas a (a) y (b) y una regla 11: escribir la línea de `LEEME.md` | Kit §4, G0 |

**Documentos que el kit cita y no están en el repo:** 33 (especificación técnica), 27 y 29 (cifras verificadas), 30 (preregistro H1), maestro §5.2 (rotaciones) y el PDF de FAO-56, según la lista de `CLAUDE.md`. Faltan también el borrador de la página (archivo 31, kit C6), el manual de etiquetado (39) y el protocolo Olofsson (22). Si su pieza los necesita, **pídalos a Cristian**. No los reconstruya de memoria ni deje que Gemini los «recuerde».

## 7. Las 10 reglas del kit (§0.1), en corto

1. **Un repo, un integrador.** Solo Cristian hace commits.
2. **Cada quien entrega en el buzón.** Ahora es `Raiz_entregas`, plano y con su línea en `LEEME.md` (decisión b). El cuaderno va a `Raiz/cuadernos/` y Cristian lo copia al repo.
3. **Primero, el contrato de datos** (kit §2). Mismos nombres de archivos y campos.
4. **Un prompt = una pieza pequeña**, con entrada, salida y prueba. Nunca «genere toda la aplicación».
5. **No se avanza sin aprobar la prueba.** Si falla 2 veces, R1 (§9). Si falla 3 veces, el plan B de la pieza.
6. **La IA no inventa cifras.** Todo número sale de un archivo, de `data/params.json` o de S9 y S8, con su fuente y etiqueta. Un número «típico» se rechaza.
7. **Encabezado.** Cada cuaderno empieza con `# AI-assisted (Gemini) — ROOT, NASA Space Apps 2026`. Los commits pequeños los hace Cristian.
8. **Después de cada pieza, R2:** lo que el equipo no entiende no lo puede defender ante el jurado.
9. **Registro de IA:** cada persona anota en la hoja compartida «AI_USAGE» qué pidió, con qué herramienta y qué archivos salieron ([herramientas.md](herramientas.md#5-registro-de-ia-hoja-ai_usage)).
10. **Hitos obligatorios:** los de §2.

**Y del plan del evento** (S10 §3 y §9):
- **No se toca una tarea B mientras haya una A sin terminar.** Una C, solo después del hito de las 20:30.
- **Una tarea a la vez, hasta su prueba.**
- **Celulares en silencio durante los bloques.**
- **Si algo falla dos veces, R1**, en lugar de insistir.

## 8. Índice de archivos (verificado contra `ESQUEMAS` de `motor/esquemas.py`)

**Ya entregados por la sesión de datos** (no se rehacen): `parcelas_base.geojson`, `eto_diaria.csv`, `hls_mensual_parcelas.csv`, `suelo_desnudo.csv`, `memoria_parcelas.csv`, `memoria_resumen.csv`, `cultivos_parcelas.csv` (versión de reglas), `rotaciones.json`, `demanda_cultivos.csv`, `relieve_parcelas.csv`, `relieve_rutas.geojson`, `relieve_meta.json` y `nasadem_zona_piloto.tif`.

**Pendientes del equipo:**

| Archivo | Pieza | Quién | ¿Lo valida el ensamblador? | Guía |
|---|---|---|---|---|
| `cultivos_parcelas.csv` (sustituye al de reglas), `tabla_metodos.csv`, figura PNG | A4.2 | P2 | Sí | [P2](P2_hls_memoria.md#a42--random-forest-y-comparación-con-las-reglas) |
| `B1_protagonistas.png` + los 3 `id` por mensaje a Cristian | B1, paso 4 | P2 | La figura, sí (`.png`) | [P2](P2_hls_memoria.md#b1-paso-4--las-3-protagonistas) |
| `etiquetas_unidas.csv` | A4.1 | P3 | Sí | [P3](P3_etiquetas_h3.md#a41--unión-de-etiquetas) |
| `olofsson.csv` + figura PNG | A4.3 | P3 | Sí (columnas libres) | [P3](P3_etiquetas_h3.md#a43--exactitud-olofsson) |
| `h3_series.csv`, `resultado_H3.md` + figura PNG | A7 | P3 | Sí | [P3](P3_etiquetas_h3.md#a7--experimento-natural-de-2025-h3) |
| `heladas.json` | A2 | P4 | Sí | [P4](P4_clima_demanda.md#a2--heladas-por-fecha) |
| `resultado_H1.md` + figura PNG | A6 | P4 | Sí | [P4](P4_clima_demanda.md#a6--back-test-h1) |
| `et_contraste.csv` + figura PNG | A8 (por ahora «not run») | P4 | Sí | [P4](P4_clima_demanda.md#a8--contraste-regional-de-et-por-ahora-not-run) |
| `dotaciones.json`; `historial_superficie.csv` solo si sobra tiempo | B2 | P5 | Sí | [P5](P5_dotaciones_rotaciones.md#b2--dotaciones-en-millares-por-hectárea) |
| `opciones_b3.json` | B3 | P5 | **No: nota no validada** (Cristian la copia a mano) | [P5](P5_dotaciones_rotaciones.md#b3--opciones-por-cultivo-y-filtros-duros-opciones_b3json) |
| `propuesta_supuestos.md` | Supuestos | P5 | **No: nota no validada** (la lee Cristian) | [P5](P5_dotaciones_rotaciones.md#propuesta-de-supuestos-propuesta_supuestosmd) |
| `cifras.csv` | Tabla única de cifras | P5 | Sí | [P5](P5_dotaciones_rotaciones.md#tabla-única-de-cifras-cifrascsv) |
| `calibracion.csv` | B2-cal (solo si el preregistro la declara) | P5 | Sí (columnas libres) | [P5](P5_dotaciones_rotaciones.md#b2-cal--calibración-solo-si-el-preregistro-la-declara) |
| `textos_ui.md`, `plantillas_explicaciones.md`, `whatsapp_plantilla.md` | Textos | P6 | Sí | [P6](P6_textos_pagina.md) |
| `fuentes_<pieza>.csv` (`archivo, url_o_api, fecha_consulta, sha256`) | Toda pieza con datos de origen | Cada quien | Sí (patrón `fuentes_*.csv`) | En cada bloque (G0, regla 9) |

## 9. Si algo falla: R1. Después de cada pieza: R2

**R1** (kit §8). Péguelo en el chat donde hizo el cuaderno cuando algo falle 2 veces con el mismo error, y avise a Cristian:
```text
Deténgase. Esto falló [N] veces con el siguiente error: [pegar el error]. No escriba más código por el momento.
1) Explique en 5 líneas qué está ocurriendo y la causa más probable.
2) Proponga 2 opciones de solución, de la más simple a la más compleja, con el tiempo estimado de cada una.
3) Si ninguna toma menos de 30 minutos, proponga el plan B de esta pieza (se encuentra en docs/40_kit_v4_proyecto_definitivo.md) o una forma de simplificarla sin romper el contrato de datos.
```
**R2** (kit §8). Péguelo al terminar cada pieza:
```text
Explique lo que acaba de realizar como si el lector no tuviera conocimientos de programación:
1) Qué entra y qué sale (archivos).
2) Los 3 pasos clave en lenguaje sencillo.
3) Qué supuestos se hicieron y de dónde proviene cada número.
4) Qué pregunta podría formular un juez al respecto y cómo responderla en 2 frases.
5) Qué podría estar mal y cómo se detectaría.
```

## 10. Enlaces

- **Guías por rol:**
  - [P2 · Random Forest y protagonistas](P2_hls_memoria.md)
  - [P3 · Etiquetas, exactitud y H3](P3_etiquetas_h3.md)
  - [P4 · Heladas, back-test y contraste de ET](P4_clima_demanda.md)
  - [P5 · Dotaciones, opciones y cifras](P5_dotaciones_rotaciones.md)
  - [P6 · Textos, página y jurado](P6_textos_pagina.md)
- **Antes de usar o entregar un dato:** [verificar_datos_nasa.md](verificar_datos_nasa.md).
- **Qué herramienta usar:** [herramientas.md](herramientas.md).
- **Revisión con contexto nuevo para Gemini:** [docs/prompts/para_gemini.md](../prompts/para_gemini.md).
- **Formatos exactos:** [motor/esquemas.py](../../motor/esquemas.py) (columnas y rangos) y [motor/ensamblar.py](../../motor/ensamblar.py) (cómo se valida).
- **Fuentes:**
  - el kit: [docs/kit/40_kit_v4_proyecto_definitivo.md](../kit/40_kit_v4_proyecto_definitivo.md);
  - el alcance: [docs/sintesis/S9_proyecto_definitivo.md](../sintesis/S9_proyecto_definitivo.md);
  - el plan del evento: [docs/sintesis/S10_plan_sapo.md](../sintesis/S10_plan_sapo.md);
  - las reglas para la IA: [CLAUDE.md](../../CLAUDE.md).
