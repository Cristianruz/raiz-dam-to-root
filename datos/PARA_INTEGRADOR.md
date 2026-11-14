<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Notas de la sesión de datos para el integrador

Se agrega al final, con hora local de Chihuahua. Las entregas van a `Raiz_entregas/` con su línea en `LEEME.md`.

## 14-nov 15:15 — Recibido el pedido de «todas las bases del reto»
Leí `docs/decisiones/2026-11-14_recursos_del_reto.md` (tu commit 68f8d9e). Lo que puedo entregar y cuándo:

| Entrega | Hoy antes de las 19:00 | Cómo | Riesgo |
|---|---|---|---|
| `heladas.json` | Sí, es la primera | `datos/colab/A2_heladas.py` sobre `eto_diaria.csv` (POWER). Sin estación SMN 8044 en `data/raw/smn/`: el paso 3 del kit queda «not run» | Ninguno |
| `contexto_regional.csv` | Sí, por partes | Earth Engine (proyecto iondroplet). Confirmo cada colección en el catálogo antes de usarla y escribo en `LEEME.md` la que de verdad usé | NLDAS y GLDAS son horarios o trihorarios: van por exportación en lote y pueden tardar. Si alguna no termina, entrego el archivo con las demás y lo anoto aquí |
| `gedi_parcelas.csv` | Sí | Earth Engine, GEDI L2A rasterizado mensual; disparos válidos por parcela calculados aquí | Muchas parcelas sin disparo (se entregan con `n_disparos` = 0) |
| `ecostress_parcelas.csv` | Domingo | Primero reviso si está en el catálogo de Earth Engine. AppEEARS pide iniciar sesión con una cuenta de Earthdata: eso lo tiene que hacer Cristian, yo no escribo contraseñas | Alto: si no hay cuenta o la cola no termina, queda «not run» |
| `gaez_zona.csv` | Domingo | Portal GAEZ v4 de FAO. Descargar archivos de un sitio nuevo necesita el visto bueno de Cristian | Medio |

Notas:
- `n_celdas`: varias de estas mallas son más grandes que la zona (GLDAS 0.25°, GRACE 0.5°, SMAP ~9 km). Voy a reportar las celdas del producto que tocan el rectángulo y el promedio ponderado por la fracción cubierta. En GRACE el valor de las dos zonas va a salir casi igual (misma celda o celdas vecinas del mismo mascon de 3°): conviene que la página lo diga.
- ERA5-Land es de ECMWF/Copernicus, no de NASA. Que la tabla de «Challenge data sources» no lo rotule como dato de NASA.
- `relieve_meta*.json`: en la próxima regeneración paso a inglés `tormenta.periodo` («to») y `rutas_depresiones.nota`.
- La rama `revision/web-dos-zonas` ya no hace falta; la dejo para que la borre Cristian (no borro ramas por mi cuenta).

## 14-nov 15:30 — Avance
- **ENTREGA: heladas.json — prueba OK** (tu ensamblador: 23 entraron, 0 rechazados). NASA POWER, T2M_MIN, 1984–2025 (42 años completos).
  Última helada de primavera: p10 30-ene, p50 22-feb, p90 10-mar. Primera de otoño: p10 14-nov, p50 30-nov, p90 17-dic
  (6 de 42 años sin helada de otoño). Probabilidad de helada después del 1-feb: 0.857; del 1-mar: 0.381; del 5-abr: 0.
  El archivo trae además el bloque `zonas.lazaro_cardenas` con lo mismo para la otra celda de POWER, y `estacion_smn` = «not run».
  Control del kit (INEGI 1983: marzo y noviembre): la celda de POWER da la última helada a fines de febrero, algo antes.
- **contexto_regional.csv:** colecciones confirmadas en el catálogo (todas existen con esas bandas). Ya están en
  `data/raw/reto/` MODIS (3), GRACE y ERA5-Land. SMAP, GLDAS y NLDAS van por exportación en lote: 6 de 9 tareas
  terminadas a las 15:30. El archivo completo sale cuando acaben (estimo 16:15).
  - SMAP: uso `NASA/SMAP/SPL4SMGP/008` (la 007 termina en junio de 2025).
  - MODIS ET (`MOD16A2GF`) llega hasta 2025-12; 2026 todavía no existe en el producto rellenado.
  - GRACE (`MASCON_CRI`) llega hasta 2024-10 y tiene meses sin solución (2017-07 a 2018-05, entre GRACE y GRACE-FO).
  - **Cuidado con GRACE:** el límite entre dos mascons de 3° pasa por −105.5°, justo por la zona. Lázaro Cárdenas cae
    en el mascon del oeste (−33.9 cm en 2024-10) y Delicias–Saucillo queda 25 % en ese y 75 % en el del este (−17.3 cm
    de promedio). La diferencia entre las dos zonas NO es información local: es el borde de la malla. Sugiero mostrar
    una sola serie de GRACE («cuenca»), o las dos con esa advertencia a la vista.
  - `dias_helada` de ERA5-Land: se cuenta por celda y luego se promedia en la zona, así que puede traer decimales.
  - NLDAS sí tiene dato en 28° N (6 celdas tocan Delicias–Saucillo).
- **gedi_parcelas.csv:** las dos tareas de disparos están en cola detrás de NLDAS. Filtro: `quality_flag` = 1,
  `degrade_flag` = 0 y `sensitivity` ≥ 0.9. Colección: `LARSE/GEDI/GEDI02_A_002_MONTHLY` (2019-04 a 2025-07 sobre la zona).
- **ECOSTRESS:** no está en el catálogo de Earth Engine. Solo por AppEEARS o Earthdata, que piden iniciar sesión.
  Ya le pedí a Cristian una cuenta de Earthdata; sin ella queda «not run».
- `relieve_meta*.json`: periodos con «to» y `rutas_depresiones.nota` y `pendiente` en inglés. Los subo junto con lo demás.

## 14-nov 15:37 — Entregas del pedido de hoy (todas en Raiz_entregas, con su línea en LEEME.md)
Validé con tu ensamblador (commit 46f79aa): 25 entraron, 1 rechazado (ver contexto_regional), 0 retenidos.

- **ENTREGA: contexto_regional.csv** — 6,560 filas, las 12 combinaciones. **Tu validador lo rechaza hoy solo por
  `zona = cuenca` en las 236 filas de GRACE** (lo acordado a las 15:40; falta que tu validador lo acepte). Lo demás pasa.
  | fuente / variable | periodo | meses | n_celdas (Delicias / Lázaro) |
  |---|---|---|---|
  | smap humedad_superficial, humedad_raiz | 2015-04 a 2026-10 | 139 | 6 / 4 |
  | modis ndvi | 2000-02 a 2026-10 | 321 | ~6,083 / ~1,713 |
  | modis et | 2000-01 a 2025-12 | 312 | ~1,518 / ~446 |
  | modis temp_superficie_dia | 2000-02 a 2026-10 | 321 | ~406 / ~122 |
  | grace agua_almacenada_anomalia (zona = cuenca) | 2002-04 a 2024-10, con huecos | 236 | 2 |
  | gldas et, humedad_raiz | 2000-01 a 2026-09 | 321 | 2 / 1 |
  | nldas lluvia, evaporacion_potencial | 2000-01 a 2026-10 | 322 | 6 / 4 |
  | era5_land tmin_media, dias_helada | 2000-01 a 2026-10 | 322 | 8 / 2 |
  Reglas: solo meses con al menos 90 % de las imágenes que corresponden (el mes en curso no entra); MODIS con un
  compuesto que empiece en el mes; `n_celdas` de MODIS = celdas válidas con centro dentro ese mes (cambia un poco de mes
  a mes); en las mallas gruesas = celdas que tocan el rectángulo. `resolucion_m` de GRACE = 55,660 (malla de 0.5°), pero su
  resolución real es el mascon de 3° (~330 km): dilo en la página.
  Cifras para que revises que la página no diga de más (medias anuales 2000–2025, Delicias–Saucillo):
  lluvia NLDAS 274 mm (estación Delicias 1990–2004: 284 mm; POWER: 329 mm); ET de MODIS 304 mm y de GLDAS 378 mm, frente
  a 746 mm de SSEBop en oct-2025 a sep-2026 en el rectángulo original. **Los tres productos de ET no coinciden entre sí**:
  es una comparación, no una validación. La evaporación potencial de NLDAS (2,371 mm/año) no es ETo de FAO-56: no se
  compara número con número con la ETo de POWER.
- **ENTREGA: gedi_parcelas.csv — prueba OK.** 1,072 de 1,239 parcelas con al menos un disparo (18,702 disparos válidos
  dentro de parcelas, 2019-04 a 2025-04). Lectura para la ficha:
  - En cultivo bajo, barbecho o suelo desnudo, rh98 ronda 2.6–2.8 m: es el piso del instrumento (ancho del pulso), **no
    altura de planta**. Solo dice algo cuando pasa de unos 5 m.
  - Parcelas con ≥ 3 disparos y p90 ≥ 5 m: nogal 57 de 86 (66 %); alfalfa 7 de 95 (7 %); barbecho 18 de 155 (12 %);
    cereal de invierno 0 de 11; sin clasificar 116 de 581 (20 %). Protagonista L0175 (nogal): mediana 13.6 m.
  - Es evidencia independiente de las reglas, en los dos sentidos: un tercio de los «nogal» no muestra dosel alto (huerta
    joven o error de las reglas), y 116 parcelas sin clasificar sí lo muestran (probables huertas). No cambia el mapa:
    se muestra como evidencia. Los disparos son de 2019–2025, no del ciclo 2026.
- **ENTREGA: supuestos.json — prueba OK** (es `datos/supuestos.json` tal cual; 19 supuestos con valor, etiqueta y fuente).
- **ENTREGA: relieve_meta.json y relieve_meta_lazaro_cardenas.json — prueba OK** (periodos con «to»; `nota` y `pendiente` en inglés).
- Crudos en el repo: `data/raw/reto/` (18 CSV). Scripts: `datos/earthengine/contexto_regional.js`,
  `datos/colab/A2_heladas.py`, `A10_contexto_regional.py`, `A11_gedi_parcelas.py`.
- Uso de Earth Engine de este pedido: 11 tareas, unos 4,900 EECU-s (1.4 EECU-h de las 150 del mes).

Pendiente de mi lado: ECOSTRESS (necesita la cuenta de Earthdata de Cristian) y GAEZ (domingo). Espero tu reparto de faltantes.

## 14-nov 15:55 — Respuesta a tu reparto (D2 a D8) y a tu pregunta
Tu validador ya acepta «cuenca»: con tu commit bdb9b5d, 26 entraron, 0 rechazados.

- **D2 · ENTREGA: supuestos.json — prueba OK.** Nuevas claves:
  - `ea_goteo` = 0.90 y `ea_superficial_referencia` = 0.60, etiqueta «[V] indicative, not local». Fuente leída hoy:
    FAO, *Irrigation Water Management Training Manual No. 4, Irrigation Scheduling* (Brouwer, Prins y Heibloem, 1989),
    Anexo I, Tabla 8 «Indicative values of the field application efficiency (ea)»: superficial 60 %, aspersión 75 %,
    goteo 90 %. https://www.fao.org/3/t7202e/t7202e08.htm (leído el 14-nov-2026).
  - Es un valor **indicativo general**, no medido en el DR-005. Rotúlalo así en La gota.
  - Ojo con S2 §5 (documento del proyecto): ahí se retiraron unas «eficiencias de 60/80/90 %» porque no estaban en la
    fuente que se citaba entonces. Esta es otra fuente (FAO, Tabla 8: 60/75/90) y sí la leí. No las mezcles.
  - El 0.60 de FAO para riego superficial cae dentro de nuestro rango de `ea_gravedad` (0.45–0.70). No cambié ese rango
    ni su etiqueta [S]: cambiarlo movería todas las láminas y es decisión de Cristian.
- **D3 · Protagonistas: `docs/revision_protagonistas.md`** (con figura en `docs/figuras/`). Revisión hecha por mí sobre
  Sentinel-2 en color verdadero (6-feb, 9-may y 25-ago-2026). **No es la revisión de una persona**: esa sigue pendiente.
  - P0757 (alfalfa): coincide. Una sola parcela, verde todo el año, sin árboles.
  - P0244 (descanso): coincide solo en parte. El polígono junta unas 7 parcelas chicas; la mayoría sin cultivo, pero
    2 o 3 (cerca de la cuarta parte) con cultivo en mayo y agosto.
  - L0175 (nogal): la huerta coincide (GEDI 13.6 m), pero el polígono incluye arriba un lote sin cultivo.
  - **Parcela libre con agua: propongo P0632** (20.66 ha, confianza 54, a 3.2 km de Km 92): cereal de fines de invierno,
    homogénea (NDVI 0.86–0.90 en marzo y abril), cosechada en mayo. Segunda opción: P0605 (polígono mixto).
    No cambié `protagonista` en `parcelas_base.geojson`: dime si la marco (P0632 además de P0244, o en su lugar) y regenero.
- **D4 · dotaciones.json: NO lo puedo confirmar.** El Diario de Chihuahua bloquea la lectura automatizada (robots) y no la
  rodeo. Lo único que vi fue el resultado del buscador: la nota del 28-oct-2024 se titula «Dotarán de un millar de agua
  por hectárea» (coincide con «como 2025») y la del 27-jul-2026, «Pierden 15 mil trabajadores empleo por reducción en
  ciclo agrícola 2026» (el título no trae las cifras de 3–4 ni 9–10 millares). No pongo `fecha_consulta` de algo que no
  leí. Alguien del equipo tiene que abrir las dos notas en su navegador; ya está en la lista de tareas que le pasé a Cristian.
  - https://www.eldiariodechihuahua.mx/estado/2024/oct/28/dotaran-de-un-millar-de-agua-por-hectarea-653512.html
  - https://www.eldiariodechihuahua.mx/estado/2026/jul/27/pierden-15-mil-trabajadores-empleo-por-reduccion-en-ciclo-agricola-2026-821848.html
- **D5 · FAO-56.** No copio el PDF al repo (es de FAO y el repo va a ser público). URL estable de la versión en línea:
  https://www.fao.org/3/X0490E/x0490e00.htm; el Ejemplo 18 está en el capítulo 4: https://www.fao.org/3/x0490e/x0490e08.htm
  Prueba: `python -m pytest -q datos/colab/test_eto_fao56.py` (2 pruebas, pasan: Ejemplo 18, ETo 3.9 mm/día en Bruselas
  el 6 de julio, tolerancia 0.1; y Ejemplo 8, Ra = 32.2 MJ/m²/día a 20° S el 3 de septiembre, tolerancia 0.2). También
  corre sola: `python datos/colab/test_eto_fao56.py` → «PRUEBAS FAO-56 OK». Solo necesita `datos/colab/eto_fao56.py`.
- **D6 · Nogal:** sin empezar (prioridad baja).
- **D7 · Random Forest:** en espera de `etiquetas_unidas.csv`.
- **D8 · ECOSTRESS y GAEZ:** en espera de Cristian.
- **Tu pregunta: sí puedo leer el proyecto de Claude «Space Apps»** desde esta sesión (documentos 27, 29, 30, el maestro 16,
  S1 a S10, el kit 40 y los demás). No copio nada al repo sin que Cristian lo apruebe. Si necesitas un dato puntual de
  ahí (por ejemplo, las opciones y filtros del maestro §5.2), dime cuál y te lo resumo aquí con la referencia. Aviso:
  el 30 es el borrador del preregistro de H1, con puntos [PENDING]; no es la versión publicada.

## 14-nov 16:00 — supuestos.json con las dos entradas de GEDI
- **ENTREGA: supuestos.json — prueba OK** (26 entraron, 0 rechazados).
  - `gedi_piso_instrumento_m`: min 2.5, max 3.2, valor 2.7 (percentiles 10, 90 y mediana de la mediana de rh98 en las 261
    parcelas sin árboles con 3 o más disparos). Antes te escribí «2.6–2.8»: ese era el rango intercuartil; el que queda
    en el archivo es el 10–90, más prudente.
  - `gedi_umbral_dosel_alto_m`: valor 5 (sobre el percentil 90 de rh98 de la parcela), con `min_disparos.valor` = 3.
  - Las dos con etiqueta «own analysis (A11)». D2 a D5 ya están contestados en la nota de las 15:55.

## 14-nov 16:40 — H1-b: prueba nueva de la forma estacional (no cambia H1) → también falla
Cristian pidió que H1 y H3 «sí sean resultados». No se cambian criterios ni veredictos. Lo que sí hice fue una prueba
nueva y honesta de la única señal positiva que había (la variante «anclada» de 2026): especificación subida antes de
correr (`docs/h1b_especificacion.md`, commit 695caf8, 16:20) y resultado en `docs/resultado_H1b.md`.
- **H1-b does not hold.** En 1999–2024 el modelo de demanda gana a las formas simples en 6 de 26 años; mediana del error
  8.66 puntos porcentuales, frente a 3.34 de L1-s y 7.90 de L1. El modelo adelanta la demanda (76 % del ciclo al 14-jul;
  lo observado es 68 %). La cercanía de 2026 fue de un año.
- **Para el README:** corrige la frase que diga que la forma estacional del modelo «es informativa». En mi
  `docs/resultado_H1.md` ya quedó corregida y con el enlace a H1-b.
- Dato descriptivo que sí es firme y se puede decir: el volumen del ciclo repartido con la curva de ETo de NASA POWER
  sigue la salida de La Boquilla con una mediana de error de 3.3 puntos porcentuales en 26 ciclos (mejor que la lineal en
  19 de 26). No es una hipótesis registrada; va como descripción.
- Archivos nuevos: `docs/resultado_H1b.md`, `docs/h1b_forma.png`, `datos/colab/A6b_forma_historica.py`. No hay entrega al buzón.

## 14-nov 16:50 — opciones_b3.json, P0632 como protagonista y tres rotaciones nuevas
Con tu commit 9b1c169: 26 entraron, 0 retenidos; `opciones_b3.json` sale «no está en la tabla 0.4-B» (lo esperado: aún no tiene esquema).

- **ENTREGA: opciones_b3.json** (sin prueba contra tu ensamblador, como pediste). 12 opciones, 10 filtros.
  Fuente: maestro §5.2 (v3.1, 29-oct) y expediente 27 §2.3; la fuente primaria va en cada opción y en cada filtro.
  | Letra del maestro | id en rotaciones.json | Estado |
  |---|---|---|
  | ACTUAL | `alfalfa`, `chile`, `algodon`, `maiz_forrajero`, `sorgo`, `cereal_invierno` | con ventana de siembra y fuente donde la hay |
  | A | `avena_maiz` | entregada |
  | B | `alfalfa_corte_verano` | entregada, con `advertir_si_rojo` = true |
  | C | `cereal_algodon` y `cereal_sorgo` | **rotaciones nuevas en A5** (el maestro pide cereal de invierno y luego algodón o sorgo) |
  | D (avena-veza) | — | **fuera**: A5 no tiene Kc con fuente para la mezcla y el maestro la marca como no verificada en Delicias |
  | E (sorgo con 1–2 auxilios) | — | **fuera como tal**: no hay lámina de auxilio de sorgo con fuente. Su parte «el resto descansa» es `descanso` |
  | nogal_no_rota | `nogal` | sin alternativas (el maestro dice que no rota) |
  | no_sembrar | `descanso` | entregada |
  - **Aviso 1: pocas alternativas fuera de alfalfa y chile.** El maestro solo define alternativas para alfalfa (B, A) y chile (C).
    Para algodón, maíz, sorgo y cereal de invierno solo queda `descanso`; para barbecho y nogal, ninguna. Si quieres tres
    estrategias en todas las fichas, hay que completar con tu diseño provisional y rotularlo [S]: yo no lo invento.
  - **Aviso 2: la opción C pide MÁS agua que el chile solo** (son dos cultivos en el año): `cereal_algodon` 20.9 y `cereal_sorgo`
    17.7 millares/ha (P50, Delicias) frente a 14.3 del chile. Se sugiere por la plaga, no por el agua; `por_que_en` ya lo dice.
  - **Aviso 3: huecos que van en null.** Sin fecha de siembra de sorgo en las fuentes; chile solo «desde febrero» (sin fecha
    límite); el cereal de invierno con riego en Delicias no está verificado (ventana «nov–dic» del maestro, lámina de La Laguna).
    Ojo: A5 siembra el cereal el 15-oct [S], no en nov–dic; la lámina cambia poco, pero la fecha no coincide con la del maestro.
  - **Aviso 4: `indicadores`.** `leguminosa` = true en alfalfa por clasificación botánica (no viene del maestro; va dicho en su
    fuente). `ruptura_plagas` = true solo en la opción C. `raiz_profunda` = null en todas: el maestro lo nombra como indicador
    pero no lo asigna a ninguna opción.
  - **Propuesta de contrato:** el filtro «no establecer alfalfa en año seco» compara 40 cm de establecimiento con la dotación
    elegida. Lo puse con `tipo` = «intervalo» y `necesita` = [«dotación elegida en el deslizador»], que no está en tu lista.
    Si prefieres un tipo nuevo («dotacion_minima»), cámbialo. Los filtros de fecha y de soca del algodón van con `necesita` = []:
    son avisos, no dependen de ningún dato.
  - Bloque adicional `opciones_del_maestro_no_entregadas` con el motivo de D y E, por si la página quiere decirlo.
- **ENTREGA: rotaciones.json y rotaciones_lazaro_cardenas.json — prueba OK.** Tres rotaciones nuevas: `cereal_invierno` (6.28
  millares/ha P50 en Delicias), `cereal_algodon` (20.88) y `cereal_sorgo` (17.65). Las nueve anteriores salen idénticas.
- **ENTREGA: parcelas_base.geojson — prueba OK.** Protagonistas: P0757, **P0632** y L0175; P0244 ya no. Lo demás del archivo no cambia.
  `docs/revision_protagonistas.md` actualizado.
- Nota de proceso: usé contenido del proyecto de Claude de Cristian (maestro y expediente 27) solo como hechos con su
  referencia, sin copiar los documentos. Se lo avisé a Cristian.
