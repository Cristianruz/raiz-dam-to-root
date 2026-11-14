<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Empieza aquí · Guía del equipo para el sábado 14 y el domingo 15 de noviembre

**Para quién:** P2 a P6. Se trabaja con Gemini en Colab o con Claude en el navegador; no hace falta Claude Code.

**Qué manda:** si esta guía y el kit dicen cosas distintas, mandan los cambios del 14-nov (§6). Después, en orden: S9, el kit v4 y S8.

## 1. Qué es Raíz (S9 §1)

**Raíz muestra, antes de sembrar, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa.**

- Zona piloto del Distrito de Riego 005 Delicias, Chihuahua. El usuario elige la dotación de la presa con un deslizador, en millares por hectárea, y la web calcula para cuántas hectáreas alcanza cada cultivo.
- En la página en inglés: *"Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover."*

## 2. Hitos del día (hora de Chihuahua)

**Sábado 14** (kit §0.1, regla 10; kit §3; S10 §7):

| Hora | Qué pasa | Quién |
|---|---|---|
| 8:00 | Registro con documentos | Todos |
| 9:00 | Bienvenida y plática de seguridad | Todos |
| 9:45 | Cristian lanza las exportaciones de Earth Engine (el «sapo» del día). El equipo arranca en Colab: parcelas y protagonistas, POWER y ETo, dotaciones con fuente | Todos |
| 10:00–14:00 | Sesiones de la sede (las de las 10:00 y las 12:00) | P6 y otro integrante |
| **14:30** | **HITO: las 3 pantallas navegables con datos simulados** | Cristian |
| **16:00 y 17:00** | **Mentorías obligatorias.** Faltar descalifica. Pregunta clave: dónde se mide el millar | Cristian y uno más; P6 hace la prueba de pasillo |
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

## 3. Quién hace qué (S9 §10; kit §3)

| Persona | Responsable de (S9 §10) | Piezas de este fin de semana | Su guía |
|---|---|---|---|
| Cristian | Repositorio, motor, web, pruebas automáticas y envío | Integra las entregas (K-ENS), web (C1–C5, X3.2), motor (B4, X3.1), explicaciones (C3) y pruebas (K-TEST). Es el único que hace commits | — |
| Sesión de Chrome (Claude en el Chrome de Cristian, proyecto `iondroplet`) | Earth Engine y lo que necesita red | B1 (parcelas). Exportaciones de A3 y A3-M (HLS), A9 (NASADEM y GPM IMERG) y A8 (SSEBop y WaPOR) | — |
| P2 | Series de HLS de 2026 y memoria | B1 (revisión de protagonistas), A3, A3-M, A4.2 (con P3), figuras | [P2_hls_memoria.md](P2_hls_memoria.md) |
| P3 | Etiquetas, exactitud del mapa y H3 | A4.1, A4.2 (con P2), validación de la memoria de 2026, A7 (H3), A4.3 (Olofsson) | [P3_etiquetas_h3.md](P3_etiquetas_h3.md) |
| P4 | Clima, demanda y back-test H1 | A1, A2, A5, A9 (relieve), A6 (H1), A8 (contraste de ET) | [P4_clima_demanda.md](P4_clima_demanda.md) |
| P5 | Dotaciones, plazos, rotaciones y tabla única de cifras | B2, B3 (con `supuestos.json`), `cifras.csv`, B2-cal (solo si el preregistro la declara); revisión de las cifras del motor | [P5_dotaciones_rotaciones.md](P5_dotaciones_rotaciones.md) |
| P6 | Entrevistas, textos, página, video, People's Choice y meme | `textos_ui.md`, `plantillas_explicaciones.md`, `whatsapp_plantilla.md`, C6, C7 y C8, People's Choice y #MejorMeme; sesiones de la sede, mentorías y prueba de usabilidad | [P6_textos_pagina.md](P6_textos_pagina.md) |

**El cuello de botella es Cristian** (S10 §6). Nadie lo interrumpe salvo por un bloqueo. Las dudas se juntan y se resuelven en la revisión de cada hora.

## 4. Flujo de trabajo de una pieza

```
1. Abra su guía de rol → busque la pieza → copie el «Bloque para pegar» (G0 ya completado + prompt del kit)
2. Colab: cuaderno nuevo con el nombre indicado → monte Drive → pegue el bloque en Gemini
3. Pida UNA celda por paso; ejecútela y diga "listo" antes de pedir la siguiente
4. Al final, Gemini imprime la PRUEBA DE ACEPTACIÓN y la verificación de esquema
5. Autoverificación:
   - datos: verificar_datos_nasa.md;
   - cuaderno y tabla: docs/prompts/para_gemini.md, en un chat NUEVO de Gemini
6. Guarde en Drive:
   - tabla(s) + fuentes_<pieza>.csv + figuras → Raiz/entregas/ (carpeta plana);
   - UNA línea por archivo → Raiz/entregas/LEEME.md;
   - el cuaderno → Raiz/cuadernos/
7. Avise en el grupo:  ENTREGA: <archivo> — prueba OK
8. Cristian corre el ensamblador (motor/ensamblar.py). Cada archivo:
   - entra;
   - se rechaza, y el reporte dice el motivo;
   - o queda retenido, esperando parcelas_base.geojson
9. Pegue R2 (§9) en su chat de Gemini y quédese con la explicación: es lo que defiende ante el jurado
```

**Antes de empezar una pieza, mire `Raiz/entregas/LEEME.md`.** Si el archivo ya tiene su línea (por ejemplo, porque lo entregó la sesión de Chrome), no lo rehaga. Verifíquelo y avise a Cristian. Dos archivos con el mismo nombre se pisan.

**Qué revisa el ensamblador** (`motor/ensamblar.py` y `motor/esquemas.py`, ya en el repo). Rechaza, con el motivo, todo archivo que:
- no tenga su línea en `LEEME.md`;
- no se llame como en la tabla 0.4-B: un nombre que no está en la tabla «no se sabe cómo validarlo». Se aceptan además `fuentes_<pieza>.csv` y las figuras `.png`;
- no traiga las columnas obligatorias;
- no cumpla los rangos: P10 ≤ P50 ≤ P90; NDVI entre −1 y 1; `prob_max` entre 0 y 1; estados dentro de su lista; dotaciones dentro del deslizador;
- traiga `id` que no existen en `parcelas_base.geojson`;
- en `plantillas_explicaciones.md`, traiga un dígito fuera de los marcadores `{{…}}`.

Además:
- el código (`.py`, `.ipynb`) no entra por el buzón: Cristian lo revisa y lo copia a mano;
- **nunca corrige en silencio**: si algo no cumple, se rechaza y se dice por qué.

## 5. La línea de LEEME.md y el aviso

`Raiz/entregas/LEEME.md` es una tabla. Si aún no existe, créela con este encabezado exacto (el ensamblador lo busca):
```text
| archivo | fuente | fecha | script |
|---|---|---|---|
```
Debajo va **una línea por archivo**. Ejemplo acordado:
```text
eto_diaria.csv | NASA POWER Daily API (community=AG), 28.19 N −105.45 O, 1981–2026 | 2026-11-14 | colab/A1_power_eto.ipynb
```
- **archivo:** el nombre exacto, igual al de la tabla 0.4-B. También llevan línea `fuentes_<pieza>.csv` y cada figura `.png`. En `<pieza>` va el código de la pieza sin puntos ni guiones: `fuentes_A1.csv`, `fuentes_A3M.csv`, `fuentes_A41.csv`, `fuentes_B2.csv`…
- **fuente:**
  - de dónde salen los datos: API, colección o documento, con su periodo y lugar;
  - para una tabla derivada, de qué entregas sale;
  - **sin el carácter «|»**: partiría la línea.
- **fecha:** `AAAA-MM-DD`, el día de la entrega.
- **script:**
  - en un cuaderno, `colab/<nombre del cuaderno>.ipynb`; el cuaderno se guarda en `Raiz/cuadernos/` y Cristian lo pasa al repo;
  - en un texto de P6, el bloque de esta guía que usó.
- **Si vuelve a entregar el mismo archivo,** cambie la fecha de su línea. Si queda repetida, cuenta la última.
- **Sin línea, el archivo no entra.**

**Aviso al grupo** (kit §0.4-B, paso 5): `ENTREGA: <archivo> — prueba OK`.

## 6. Cambios respecto al kit (mandan sobre el kit)

| # | Cambio del 14-nov | Qué pasaje del kit sustituye |
|---|---|---|
| (a) | **Earth Engine lo corre otra sesión de Claude, en el Chrome de Cristian, con el proyecto `iondroplet`:** exportaciones de A3, A3-M, A8 y A9, y NASADEM. P2 a P5 **no se autentican en Earth Engine** y trabajan sobre los CSV y TIF que esa sesión deja en Drive | Tabla del kit §0.3 (P2 con Earth Engine en A3 y A3-M; P4 en A8), G0 «ENTORNO» y regla 6, y los pasos de Earth Engine de A1 (elevación), A3, A3-M, A8 y A9. Ya coincidía con el kit §0.3, punto 1: «Solo Cristian ejecuta Earth Engine» |
| (a′) | **B1 (`parcelas_base.geojson` y `parcelas_muestra.geojson`) lo hace la sesión de Chrome**, porque necesita red. P2 revisa a mano las protagonistas | Tabla del kit §0.3: B1 con geopandas en Colab, a cargo de P2 |
| (b) | **Entregas en `Raiz/entregas/`, carpeta plana**, con **una línea por archivo** en `Raiz/entregas/LEEME.md` (`archivo \| fuente \| fecha \| script`). Sin esa línea el archivo no entra | Kit §0.1, regla 2, y §0.4-B, pasos 1 y 5 (`entregas/<rol>/`). `docs/prompts/para_gemini.md` todavía dice `entregas/<rol>/`: manda la carpeta plana |
| (c) | **Nombres de archivo y columnas exactos de la tabla 0.4-B.** Se acordaron además, para A9: `nasadem_zona_piloto.tif` (30 m, EPSG:4326, zona piloto + 2 km), `relieve_parcelas.csv` (`id, pendiente_media_pct, aportacion_externa_ha, frac_depresion`) y `relieve_rutas.geojson`. Los `id` de todos los CSV son los de `parcelas_base.geojson` | Los prompts dicen `data/processed/…`, `docs/figuras/…`, `docs/resultado_…md` o `data/raw/…`. Cada bloque de esta guía cambia solo esas rutas y las lista bajo «Ajustes de ruta» |
| (d) | **El validador del repo (`motor/ensamblar.py`) rechaza con motivo** lo que no cumpla. Nunca corrige en silencio | Kit K-ENS, paso 2 (ya lo decía) |
| — | P6 trabaja con la app de Gemini **o con Claude en el navegador** | Tabla del kit §0.3: «Claude (chat del Project)» |
| — | **G0 ya completado en cada bloque.** Se ajustaron sus reglas a los cambios (a) y (b): reglas 1, 3, 6, 7 y 9 (`entregas/` plana; sin Earth Engine; archivos de trabajo en `cuadernos/` solo si la tarea lo pide). Se agregó la regla 11: escribir la línea de `LEEME.md` | Kit §4, G0 |

**Documentos que el kit cita y no están en el repo:** 33 (especificación técnica), 27 y 29 (cifras verificadas), 30 (preregistro H1), maestro §5.2 (rotaciones) y el PDF de FAO-56, según la lista de `CLAUDE.md`. Faltan también el borrador de la página (archivo 31, kit C6), el manual de etiquetado (39) y el protocolo Olofsson (22), que cita el kit A4.1. Si su pieza los necesita, **pídalos a Cristian**. No los reconstruya de memoria ni deje que Gemini los «recuerde».

## 7. Las 10 reglas del kit (§0.1), en corto

1. **Un repo, un integrador.** Solo Cristian hace commits.
2. **Cada quien entrega en el buzón.** Ahora es `Raiz/entregas/`, plano y con su línea en `LEEME.md` (cambio b). El cuaderno va a `Raiz/cuadernos/` y Cristian lo copia al repo.
3. **Primero, el contrato de datos** (kit §2). Mismos nombres de archivos y campos: la web arranca con datos simulados mientras llegan los reales.
4. **Un prompt = una pieza pequeña**, con entrada, salida y prueba. Nunca «genere toda la aplicación».
5. **No se avanza sin aprobar la prueba.** Si falla 2 veces, R1 (§9). Si falla 3 veces, el plan B de la pieza.
6. **La IA no inventa cifras.** Todo número sale de un archivo, de `data/params.json` o de S9 y S8, con su fuente y etiqueta. Un número «típico» se rechaza.
7. **Encabezado.** Cada cuaderno empieza con `# AI-assisted (Gemini) — Raíz, NASA Space Apps 2026`. Los commits pequeños los hace Cristian.
8. **Después de cada pieza, R2:** lo que el equipo no entiende no lo puede defender ante el jurado.
9. **Registro de IA:** cada persona anota en la hoja compartida «AI_USAGE» qué pidió, con qué herramienta y qué archivos salieron ([herramientas.md](herramientas.md#5-registro-de-ia-hoja-ai_usage)).
10. **Hitos obligatorios:** los de §2.

**Y del plan del evento** (S10 §3 y §9):
- **No se toca una tarea B mientras haya una A sin terminar.** Una C, solo después del hito de las 20:30.
- **Una tarea a la vez, hasta su prueba.**
- **Celulares en silencio durante los bloques.**
- **Si algo falla dos veces, R1**, en lugar de insistir.

## 8. Índice de archivos de salida (tabla 0.4-B)

| Archivo | Pieza | Quién lo entrega | Guía |
|---|---|---|---|
| `parcelas_base.geojson`, `parcelas_muestra.geojson` | B1 | Sesión de Chrome (P2 revisa) | [P2](P2_hls_memoria.md#b1--revisión-de-parcelas-y-de-las-3-protagonistas) |
| `hls_mensual_parcelas.csv`, `suelo_desnudo.csv` | A3 | P2 | [P2](P2_hls_memoria.md#a3--hls-del-año-agrícola-2026-por-parcela) |
| `memoria_mensual.csv`, `memoria_parcelas.csv`, `memoria_resumen.csv`, `memoria_validacion.csv` | A3-M | P2 | [P2](P2_hls_memoria.md#a3-m--memoria-de-la-parcela-20162026) |
| `etiquetas_unidas.csv` | A4.1 | P3 | [P3](P3_etiquetas_h3.md#a41--unión-de-etiquetas) |
| `cultivos_parcelas.csv`, `tabla_metodos.csv` | A4.2 | P2 (con P3) | [P2](P2_hls_memoria.md#a42--mapa-de-cultivos-de-2026-con-p3) |
| `olofsson.csv` + figura PNG | A4.3 | P3 | [P3](P3_etiquetas_h3.md#a43--exactitud-olofsson) |
| `resultado_H3.md`, `h3_series.csv` + figura PNG | A7 | P3 | [P3](P3_etiquetas_h3.md#a7--experimento-natural-de-2025-h3) |
| `eto_diaria.csv`, `heladas.json` | A1 y A2 | P4 | [P4](P4_clima_demanda.md#a1--clima-nasa-power-y-eto-fao-56) |
| `demanda_parcelas.csv`, `etc_mensual.csv` + figura del tornado | A5 | P4 | [P4](P4_clima_demanda.md#a5--demanda-de-agua-por-opción-con-banda) |
| `resultado_H1.md` + figura PNG | A6 | P4 | [P4](P4_clima_demanda.md#a6--back-test-h1) |
| `et_contraste.csv` + figura PNG | A8 | P4 | [P4](P4_clima_demanda.md#a8--contraste-regional-de-et) |
| `nasadem_zona_piloto.tif` | A9, paso 1 (acordado) | Sesión de Chrome | [P4](P4_clima_demanda.md#a9--relieve-y-simulación-de-tormenta) |
| `relieve_rutas.geojson`, `relieve_parcelas.csv` | A9 (acordado) | P4 | [P4](P4_clima_demanda.md#a9--relieve-y-simulación-de-tormenta) |
| `dotaciones.json`; `historial_superficie.csv` solo si sobra tiempo | B2 | P5 | [P5](P5_dotaciones_rotaciones.md#b2--dotaciones-en-millares-por-hectárea) |
| `calibracion.csv` | B2-cal | P5 (solo si el preregistro la declara) | [P5](P5_dotaciones_rotaciones.md#b2-cal--calibración-solo-si-el-preregistro-la-declara) |
| `rotaciones.json`, `filtros.py` | B3 | P5 | [P5](P5_dotaciones_rotaciones.md#b3--rotaciones-filtros-duros-plazos-y-supuestosjson) |
| `supuestos.json` | Supuestos | P5 | [P5](P5_dotaciones_rotaciones.md#b3--rotaciones-filtros-duros-plazos-y-supuestosjson) |
| `cifras.csv` | Tabla única de cifras | P5 | [P5](P5_dotaciones_rotaciones.md#tabla-única-de-cifras-cifrascsv) |
| `textos_ui.md`, `plantillas_explicaciones.md`, `whatsapp_plantilla.md` | Textos | P6 | [P6](P6_textos_pagina.md) |
| `fuentes_<pieza>.csv` | Todas las piezas con datos de origen | Cada quien | En cada bloque (G0, regla 9) |

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
  - [P2 · HLS y memoria](P2_hls_memoria.md)
  - [P3 · Etiquetas, exactitud y H3](P3_etiquetas_h3.md)
  - [P4 · Clima, demanda y back-test](P4_clima_demanda.md)
  - [P5 · Dotaciones, plazos y rotaciones](P5_dotaciones_rotaciones.md)
  - [P6 · Textos, página y jurado](P6_textos_pagina.md)
- **Antes de usar o entregar un dato:** [verificar_datos_nasa.md](verificar_datos_nasa.md).
- **Qué herramienta usar:** [herramientas.md](herramientas.md).
- **Revisión con contexto nuevo para Gemini:** [docs/prompts/para_gemini.md](../prompts/para_gemini.md).
- **Fuentes:**
  - el kit: [docs/kit/40_kit_v4_proyecto_definitivo.md](../kit/40_kit_v4_proyecto_definitivo.md);
  - el alcance: [docs/sintesis/S9_proyecto_definitivo.md](../sintesis/S9_proyecto_definitivo.md);
  - el plan del evento: [docs/sintesis/S10_plan_sapo.md](../sintesis/S10_plan_sapo.md);
  - las reglas para la IA: [CLAUDE.md](../../CLAUDE.md).
