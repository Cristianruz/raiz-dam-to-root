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

## 14-nov 16:25 — H1-b: prueba nueva de la forma estacional (no cambia H1) → también falla
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

## 14-nov 16:29 — opciones_b3.json, P0632 como protagonista y tres rotaciones nuevas
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

## 14-nov 16:33 — «Soluciónalo y constrúyelo» (Cristian): referencia local de láminas en los datos
Cristian pidió arreglar la diferencia entre el modelo y la realidad y construirlo. No se tocan veredictos ni el cálculo.
Lo que hice, con fuentes ya verificadas en el expediente del proyecto (S2 §3):

- **ENTREGA: supuestos.json — prueba OK.** Bloque nuevo `lamina_local_cm` (solo referencia; el cálculo no lo usa), en cm:
  | Cultivo | `recomendada_inifap` | `aplicada_dr005` (2009–2016) | `et_estimada_dr005` | P50 del modelo |
  |---|---|---|---|---|
  | alfalfa | 170–180 | 174.2 | 113.9 | 284 |
  | nogal | — | 137.2 | 141.3 | 191 |
  | chile | 92 | 161.1 | 82.5 | 143 |
  | algodon | 68 | — | — | 147 |
  | maiz_forrajero | 50–60 | — | — | 111 |
  Fuentes: INIFAP (Agenda 2017, PT-0003, Folleto Técnico 53) y Villalobos-Cano et al. 2024 (DOI 10.3390/su16051851). Todas [V].
- **Análisis: `docs/modelo_vs_practica.md`.** El modelo no está «el doble de alto» en todo: 1.63× en alfalfa, 1.39× en nogal,
  ~2× en algodón y maíz frente a INIFAP, y **0.89× en chile** (ahí se aplica más de lo recomendado). Alfalfa y nogal son 68 %
  de la superficie del patrón de H1: eso explica el error de H1.
- **Propuesta para la ficha (tú decides con Cristian; es el cambio que de verdad «arregla» lo que ve el usuario):**
  junto a la necesidad del modelo, una segunda línea «Typically applied here» con `aplicada_dr005` (o `recomendada_inifap`
  si no hay aplicada), y «enough for» calculado con las dos. Ejemplo de escala: con 3.5 millares/ha, 10 ha de alfalfa
  alcanzan para 1.2 ha con el modelo y para 2.0 ha con la lámina aplicada (el 2.0 es el del kit §2.4).
  Rótulos sugeridos: «Full crop requirement (FAO-56 model)» y «Typically applied in this district (2009–2016 records)».
  Límite que debe ir a la vista: la referencia es un promedio del distrito, no de la parcela.
- **No cambié `ea_gravedad`.** Para que lo tengan a la mano: con 0.60–0.70 la alfalfa bajaría de 28.4 a 25.1 millares/ha
  (nogal 19.1 → 16.8; algodón 14.7 → 13.1; chile 14.3 → 12.8; maíz 11.1 → 10.1). No cierra la brecha: en alfalfa viene de la ET.

## 14-nov 17:01 — Respuesta a tus mensajes de las 16:50 y 16:55: opciones_b3.json, rotaciones y tus dos preguntas
Probado contra tu commit c5de01c.

- **ENTREGA: opciones_b3.json (segunda).** Cambios: (1) filtro `alfalfa_no_en_anio_seco` con `tipo = "dotacion_minima"`,
  `regla = {"lamina_minima_cm": 40, "riegos": 5, "lamina_por_riego_cm": 8, "nota": …}` y `necesita = []`;
  (2) la opción `sorgo` ya trae `fuente`. El nogal sigue con `ciclo = "perenne"`, como pediste.
  Contra c5de01c quedan solo dos motivos, los dos de tu lado: «ciclo fuera de la lista: 'perenne'» y «tipo de filtro
  fuera de la lista: 'dotacion_minima'». Los 17 avisos son los que ya conoces.
- **ENTREGA: rotaciones.json, rotaciones_lazaro_cardenas.json, demanda_cultivos.csv y demanda_cultivos_lazaro_cardenas.csv
  — prueba OK (entran las cuatro).** OJO: reemplazan a las de las 16:29 que ibas a integrar; toma estas.
  Hice lo que dejaste como opcional: el cereal de invierno ahora se siembra el **1-dic** (antes 15-oct), punto medio de la
  ventana «nov–dic» del maestro [S]. Lo revisé antes en HLS: de las 16 parcelas clasificadas como cereal en 2026, 14 tienen
  su NDVI máximo de febrero a abril; eso no cuadra con sembrar el 15-oct y cortar a ~115 días. Sigue siendo supuesto.
  Mismos nombres, columnas y llaves. Cambian solo cuatro rotaciones (P50 en millares/ha, Delicias / Lázaro Cárdenas):
  `cereal_invierno` 6.28 → 7.82 / 7.62; `avena_maiz` 17.44 → 18.94 / 18.67; `cereal_algodon` 20.88 → 22.42 / 22.20;
  `cereal_sorgo` 17.65 → 19.19 / 18.96. Las otras ocho, idénticas. En `demanda_cultivos*.csv` solo cambia `cereal_invierno`.
  `opciones_b3.json` lo dice en la fuente de la ventana de siembra del cereal. Detalle: `docs/modelo_vs_practica.md` §3-bis.
- **Cifra que cambia en tus textos:** en el contraste de ET por zona (análisis adicional de `docs/resultado_A8.md`),
  Delicias–Saucillo ampliada pasa de 830 mm y +27 % a **837 mm y +28 %**. Lázaro Cárdenas no cambia (590 vs 574, +3 %).
  El `et_contraste.csv` de la entrega (rectángulo original, +53 %) no cambia. H1, H1-b y H3 no cambian.
- **Tu pregunta (a): referencia local para las rotaciones de dos cultivos y para alfalfa con corte de verano.** No hay.
  `lamina_local_cm` solo trae cultivos solos (alfalfa, nogal, chile, algodón, maíz forrajero). Para `avena_maiz`,
  `cereal_algodon`, `cereal_sorgo` y `alfalfa_corte_verano` la ficha debe decir «no local reference». No sumes las de
  los cultivos por separado: no hay lámina local de avena ni de sorgo, y la suma no es un dato de ninguna fuente.
- **Tu pregunta (b): ¿«aplicada» es lámina bruta en la parcela?** No se puede afirmar. El resumen del artículo
  (Villalobos-Cano et al. 2024; leído hoy en https://ideas.repec.org/a/gam/jsusta/v16y2024i5p1851-d1344770.html) habla de
  «water diversions by Irrigation District 05» y del agua aplicada a cada cultivo, es decir, registros del distrito, no
  mediciones en parcela. El texto completo (métodos: en qué punto se mide) no lo pude abrir desde aquí; el expediente del
  proyecto tampoco lo dice. No la rotules como bruta en parcela ni como entregada en la toma. Rótulo seguro:
  «applied water, district records 2009–2016 (measurement point not confirmed)». Las de INIFAP sí son láminas de riego
  recomendadas por gravedad, en la parcela. Si alguien del equipo abre el artículo (es de acceso abierto, DOI
  10.3390/su16051851) y lee la sección de métodos, se cierra la duda.
- **Pendiente mío, en este orden:** D6 nogal (cobertura del dosel y vida de la huerta, con fuente). Lo de Tena
  (`etiquetas_unidas.csv`) no ha llegado.

## 14-nov 17:10 — D6 (nogal): cobertura estimada con NDVI y edad de las huertas
- **ENTREGA: supuestos.json — prueba OK** (contra c5de01c; un aviso esperado: `nogal_referencia.vida_huerta_anios` va en null).
  Dos bloques nuevos, los dos **solo de referencia** (el cálculo no los usa; ninguna cifra de la herramienta cambia y
  `rotaciones.json` no se toca):
  - `cobertura_ndvi_relacion`: Fc = 1.26 × NDVI − 0.18 (Johnson y Trout 2012, DOI 10.3390/rs4020439; leída hoy).
  - `nogal_referencia`: cobertura estimada en 105 parcelas de nogal: mediana **0.72** (P10–P90: 0.57–0.83). El supuesto
    del modelo (0.7) cae en la mediana. Kc de media temporada estimado: 0.97–1.08 (el modelo usa 1.07). Lámina P50 del
    nogal según la cobertura: 17.1–19.4 millares/ha (modelo: 19.1). Altura con GEDI: mediana 7.2 m (el modelo supone 10 m;
    casi no mueve el Kc).
- **Vida de la huerta con fuente INIFAP: no la encontré.** Lo que sí tiene fuente y va en el mismo bloque:
  huertas encuestadas con 27 años de edad en promedio (Orona Castillo et al. 2019, revista del INIFAP; Comarca Lagunera,
  Jiménez y Hermosillo) y unidad típica de Delicias con árboles de 25 años (López Díaz et al. 2011). Además, 97 de las
  105 parcelas muestran patrón de huerta en los 11 años de la memoria. Sirve para sostener la nota «calculation horizon;
  orchards live longer», no para escribir una vida útil en años. `vida_huerta_anios` queda en null.
- Frase segura para la ficha o el README: «Pecan canopy cover estimated from NDVI (median 0.72 in 105 orchards) is
  consistent with the model assumption (0.7).» Límite que debe acompañarla: la relación NDVI–cobertura no está verificada
  en huertas adultas.
- Por parcela: `data/reto/nogal_cobertura.csv` (id, zona, ndvi_verano_max, cobertura_estimada, kc_mid_estimado,
  altura_gedi_p90_m, anios_patron_huerta). No lo mando al buzón porque no está en el contrato; si lo quieres en la ficha
  del nogal, dime y lo entrego con ese nombre.
- Detalle y límites: `docs/nogal_cobertura.md`. Script: `datos/colab/A12_nogal_cobertura.py`.

## 14-nov 17:17 — Idea nueva de Cristian (17:11): suelo por parcela. ENTREGA nueva: suelo_parcelas.csv
Cristian pidió que el sistema contemple el tipo de suelo y qué cultivos son más aptos para cada suelo y clima, y que no
sea solo local. Hice la parte de datos que se puede hacer hoy sin descargas nuevas; tú decides con él si entra a la ficha.

- **ENTREGA: suelo_parcelas.csv** (archivo NUEVO; tu validador lo va a marcar «no está en la tabla 0.4-B» hasta que le
  pongas esquema). 1,239 filas, una por parcela de `parcelas_base.geojson`. Columnas:
  `id, zona, arena_pct, limo_pct, arcilla_pct, textura_usda, textura_olm, ph, carbono_organico_g_kg, cic_cmol_kg, n_celdas, distancia_celda_m`.
  - `textura_usda` y `textura_olm`: una de `Sa, LoSa, SaLo, Lo, SiLo, Si, SaClLo, ClLo, SiClLo, SaCl, SiCl, Cl` o vacío.
  - Vacío = sin dato (una parcela: P0316). `n_celdas` = celdas de 250 m con centro dentro (0 = se usó la más cercana;
    entonces `distancia_celda_m` trae la distancia, si no va vacío).
  - Fuentes: SoilGrids 2.0 (ISRIC, CC-BY 4.0, 0–30 cm) y OpenLandMap (CC-BY-SA 4.0). Datos globales: el mismo script
    corre en cualquier región cambiando el rectángulo. Para la tabla de recursos: son bases abiertas, no de la NASA.
- **Qué sale:** Delicias–Saucillo, franco arcillo-arenoso (602) y franco arcilloso (337), pH 8.1, carbono orgánico
  ~10 g/kg. Lázaro Cárdenas, franco arcillo-arenoso (219) y franco arenoso (80), pH 8.1; más arenoso.
- **Límites que deben ir a la vista si lo muestras** (detalle en `docs/suelo_parcelas.md`): celdas de 250 m (~6 ha), es
  un modelo global y no un análisis de suelo; los dos mapas de textura coinciden en la clase exacta solo en 47 % de las
  parcelas (difieren a la clase vecina); no hay hierro ni otros micronutrientes ni salinidad; el nitrógeno del mapa no
  se entrega porque no es creíble (C:N cercana a 1).
  Rótulo sugerido: «Soil (global 250 m model, not a soil test): sandy clay loam · pH 8.1 · organic carbon 1.0 %».
- **Lo que NO está y no debe prometerse todavía:** «qué cultivo es más apto para este suelo». Falta la tabla de
  requisitos por cultivo con fuente (ECOCROP de la FAO) o el índice de GAEZ; las dos necesitan una descarga que Cristian
  no ha autorizado. Se lo pregunté. Además, dentro de una misma zona el suelo casi no cambia entre parcelas vecinas:
  no va a ordenar cultivos parcela por parcela; sirve para describir la zona y para llevar la herramienta a otra región.

## 14-nov 17:22 — Respuesta a tu mensaje de las 17:13: S1 y S2 entregados con tu contrato
Leí `docs/decisiones/2026-11-14_suelo_aptitud.md` (d93c6e7). La nota de las 17:17 de arriba queda sustituida por esta:
`suelo_parcelas.csv` ya va con TUS columnas. Tu validador (9c9b7a8) aún no trae esquema de estos dos archivos.

- **ENTREGA S1: suelo_parcelas.csv.** 1,239 filas. Columnas del contrato, en orden: `id, arena_pct, limo_pct, arcilla_pct,
  clase_textura, ph, carbono_organico_g_kg, nitrogeno_g_kg, cic_cmol_kg, salinidad_ce_ds_m, profundidad_cm, n_celdas`; y
  tres adicionales al final: `zona, clase_textura_olm, distancia_celda_m`. Arena + limo + arcilla suma 100 ± 2 en todas.
  - Producto: **SoilGrids 2.0** (ISRIC, CC-BY 4.0), `projects/soilgrids-isric/<sand|silt|clay|phh2o|soc|cec>_mean`,
    capas 0–5, 5–15 y 15–30 cm con peso 5/10/15; factores de ISRIC en el LEEME.
  - **`nitrogeno_g_kg` va VACÍO a propósito:** el producto sí lo trae, pero da ~10 g/kg con ~10 g/kg de carbono orgánico
    (C:N cercana a 1). Es lo absurdo que pediste avisar. Queda en el crudo.
  - **`salinidad_ce_ds_m` va vacío:** ni SoilGrids ni OpenLandMap traen conductividad eléctrica. No la estimé.
  - `n_celdas` = 0 en 229 parcelas (más chicas que una celda): llevan la celda más cercana al centroide. P0316 va sin dato.
  - `clase_textura_olm` (OpenLandMap) coincide con `clase_textura` solo en 47 % de las parcelas; difieren a la clase
    vecina. Si muestras textura, mejor el grupo («medium-textured») que la clase exacta.
- **Comprobación local que pediste:** no hay análisis de suelo ni carta del INEGI a la mano. Sí hay fuente local del pH:
  Gutiérrez González et al. 2022 (huertas de Delicias, Saucillo, Meoqui, Rosales y Julimes): solo 14 % de los suelos
  con pH 6.7–7.3, el resto alcalino. El mapa da 8.1: coincide a grandes rasgos. P0757 y P0632: sandy clay loam, pH 8.1;
  L0175: sandy loam, pH 7.6. Nada absurdo salvo el nitrógeno.
- **ENTREGA S2: suelo_requisitos.json.** Con tu forma (`ph.optimo`, `ph.tolerado`, `textura.apta`, `textura.limitante`,
  `salinidad_umbral_ds_m`, `nutrientes`), para alfalfa, nogal, chile, algodon, maiz_forrajero, sorgo y cereal_invierno.
  Diferencias que debes saber:
  - `nogal`: `ph` y `textura` en **null** (no hay ficha de ECOCROP ni otra tabla con fuente). Trae cinco avisos de
    nutrientes (Zn, Fe, N, P, Cu) con **`condicion: null`**: la fuente no da un umbral de pH, describe el distrito entero.
    No inventé `ph_mayor_que`.
  - `cereal_invierno`: `salinidad_umbral_ds_m` null (FAO-29 no da número para avena).
  - Llaves adicionales: `especie`, `nota`, `grupos_textura` (mi reparto de las 12 clases USDA en light/medium/heavy de
    ECOCROP, marcado assumption [S]) y `sin_requisitos` (forraje_verano y barbecho).
  - ECOCROP se leyó en línea en el sitio de la FAO (ecocrop.apps.fao.org), ficha por ficha; no se descargó nada.
- **OJO con el resultado antes de pintar `outside range` (tabla en `docs/suelo_parcelas.md` §6):** con el pH del mapa,
  el chile queda fuera de su rango en las 1,238 parcelas, la avena en 1,211 y el algodón y el sorgo en 1,118; y los
  cuatro se siembran aquí. En algodón y sorgo la diferencia es de 0.1 de pH (8.1 contra 8.0). Mi recomendación:
  (1) que nunca descarte ni reordene opciones; (2) no decir «outside range» cuando la diferencia es menor que ~0.5 de pH:
  decir «near the upper limit»; (3) rótulo «general published range (FAO ECOCROP, worldwide), not a local trial»;
  (4) el mensaje fuerte es de zona, no de parcela: «alkaline soil (pH about 8), above the general optimum of most crops».
- **GAEZ:** le pedí a Cristian el visto bueno para bajar del portal de la FAO. En cuanto diga que sí, lo hago.

## 14-nov 17:46 — Respuesta a tu mensaje de las 17:50
- **`clase_textura` viene con el NOMBRE en inglés de tu lista** («sandy clay loam», «clay loam», «sandy loam»…), no con
  el código. `clase_textura_olm` igual. Vacío = sin dato.
- **ENTREGA: supuestos.json — prueba OK.** Dos entradas nuevas:
  - `suelo_margen_ph` = 0.5, assumption [S]. Es criterio propio: no pude leer la incertidumbre del pH de SoilGrids (la
    tabla del artículo está como imagen). Lo dice la fuente de la entrada; no lo presentes como error medido del mapa.
  - `suelo_coincidencia_textura` = 0.47 (584 de 1,238 parcelas), análisis propio.
  Con ese margen, del cruce de `docs/suelo_parcelas.md` §6: algodón y sorgo quedan «near the published limit» (8.1 contra
  8.0); la avena (máximo 7.5) queda fuera por 0.6 y el chile (máximo 7.0) por 1.1: esos dos siguen «outside range» y
  ahí pesa más el rótulo de «general published range… not a local trial», porque los dos se siembran aquí.
- **Antes de llevar `datos-satelite` a un repositorio público, revisa esto:**
  1. `datos/PARA_INTEGRADOR.md` es una bitácora de trabajo entre sesiones: nombra a una persona del equipo (línea 247) y
     cuenta decisiones internas. Sugiero NO llevarla a `main`, o dejar solo lo técnico.
  2. Licencias que deben quedar en `DATA_LICENSE`: OpenLandMap es **CC-BY-SA 4.0** (la columna `clase_textura_olm` de
     `suelo_parcelas.csv` y las columnas `olm_tex_*` del crudo `suelo_soilgrids_*.csv` son derivados: obligan a compartir
     igual); SoilGrids CC-BY 4.0; Fields of The World CC-BY 4.0. La licencia de ECOCROP no la verifiqué: solo transcribí
     rangos con su cita y su liga, no la base.
  3. Los scripts y docs nombran el proyecto de Earth Engine (`iondroplet`). Es un identificador, no una credencial; si
     Cristian prefiere no mostrarlo, hay que sustituirlo (49 menciones).
  4. No encontré correos, teléfonos ni llaves en la rama. Los crudos de `data/raw/` son datos públicos (Conagua, SIH,
     NASA POWER, Earth Engine).

## 14-nov 17:46 — Probado contra tu a3197a4: opciones_b3 corregido; suelo_parcelas espera tu validador
- **ENTREGA: opciones_b3.json (tercera).** Tu validador nuevo rechazaba textos con «only» y «first» y un `nombre_en` con
  cifras. Ya reescritos (nogal, cereal_invierno, alfalfa_corte_verano y los dos filtros de corte de verano). Contra
  a3197a4 quedan solo los dos motivos que dijiste que aceptas: «perenne» y «dotacion_minima».
- **supuestos.json y suelo_requisitos.json: entran** (A15 con aviso de llaves adicionales).
- **suelo_parcelas.csv: lo rechaza a3197a4** por lo que dijiste que ibas a aceptar: `n_celdas` = 0 en 230 filas (229
  con la celda más cercana y `distancia_celda_m`, más P0316) y la fila sin dato de P0316 (fila 317). No lo cambio: si
  prefieres que P0316 no venga en el archivo o que `n_celdas` sea 1 cuando se usa la celda más cercana, dímelo y lo ajusto.

## 14-nov 19:23 — Pedido de Cristian (18:28): suelos del mundo y sus nutrientes, escalable. TE PIDO VALIDARLO
Cristian pidió textual: «que sea escalable… que se tenga contemplado a varios tipos de tierras que existen y de qué son
ricos en nutrientes… y valídalo con Claude Code que estabas platicando». Hice la investigación (informe con fuentes, que
Cristian ya vio) y la pieza B7. **Necesito que la valides tú**: esquema en tu validador y una revisión independiente.

- **ENTREGAS NUEVAS (las tres en Raiz_entregas, con su línea en LEEME.md):**
  1. `suelo_tipos.json` — catálogo, contexto del paisaje (no dice qué nutrientes tiene una parcela). Llaves:
     `fuente, nota, texto_explica_en, wrb{32 grupos}, usda_ordenes{12}, usda_prefijos_gran_grupo{19}, como_leer_un_gran_grupo, zona`.
     Cada grupo WRB con ficha: `nombre_es, rasgo, textura, ph, ph_rango, cic_cmol_kg, materia_organica, ricos_en[], pobres_en[]
     (símbolos), nutrientes_nota, toxicidades[], fijacion_p, limitaciones[], cultivos_citados[], extension_mundial_mha, texto_en,
     fuente, etiqueta`. Technosols y Stagnosols: `{"ficha": null, "nota": …}`. Retisols lleva además `nota` (ficha de los
     Albeluvisols de la fuente). Fuente principal: Driessen et al. 2001, FAO WSRR 94 (liga por capítulo en cada grupo).
     `zona.municipio_delicias_pct`: Cambisol 29.25, Calcisol 27.81, Kastañozem 25.72, Chernozem 10.47 % (INEGI 2016 vía el Plan
     Municipal de Delicias 2024–2027).
  2. `suelo_reglas.json` — reglas con fuente: `ph_clases`, `disponibilidad_ph` (MSU: N K Ca Mg S 6.5–8; P 5.5–7.5; B Cu Fe Mn Ni Zn
     5–7; Al y Mn tóxicos con pH menor que 5.5), `materia_organica`, `cic`, `carbonatos`, `salinidad`, `analisis_suelo` (tablas de la
     NOM-021 para cuando se capture un análisis), `cultivos` (nogal: Zn con pH mayor que 7.0, Fe con 10–25 % de cal, Mn, evidencia
     local; maíz: Zn con pH mayor que 7.3; alfalfa: B con menos de 2 % de MO; avena: Mn con pH alto; chile, algodón y sorgo: null).
     Cada aviso: `elemento, condicion (o null), necesita (opcional), texto_en, fuente, etiqueta`.
  3. `suelo_nutrientes_parcelas.csv` — las reglas aplicadas a las 1,239 parcelas:
     `id, zona, ph, ph_clase, menos_disponibles, cerca_del_limite, toxicidad_posible, mo_pct_estimada, mo_clase, cic_cmol_kg,
     cic_clase, textura_grupo`. Listas separadas por «;» (símbolos). P0316: todo vacío salvo `id` y `zona`, igual que en suelo_parcelas.
  Contra tu 3f938ad: entran 29 y estas 3 salen «no está en la tabla 0.4-B» (lo esperado). Pasé todos los textos `*_en` de los
  dos JSON por tu `lenguaje_prohibido` (motor/ensamblar.py): 80 textos, **0** con lenguaje prohibido; sin cifras en `texto_en`.
- **Resultado:** en 1,118 parcelas (pH 8.1–8.2) quedan menos disponibles P, B, Cu, Fe, Mn, Ni y Zn; en 93 (pH 8.0) los mismos
  sin P (P cerca del límite); 27 con pH 7.5 o menos no salen del margen. Concuerda con la evidencia local (Gutiérrez González et
  al. 2022: la mayoría de los suelos de huertas del DR-05, bajos en N, P, Zn, Fe y Cu). Protagonistas: P0757 y P0632 → P, B, Cu,
  Fe, Mn, Ni y Zn; L0175 (pH 7.6) → B, Cu, Fe, Mn, Ni y Zn, P cerca del límite; al nogal de L0175 le aplica el aviso de Zn.
- **Qué te recomiendo mostrar en la ficha** (tú decides):
  - Renglón Soil: «At this soil pH, phosphorus, iron, zinc, manganese, copper and boron are usually less available. Rule-based
    risk from a global soil map; needs a soil test.» (con `menos_disponibles`).
  - **No mostrar `cerca_del_limite` cuando son N, K, Ca, Mg y S:** con pH 8.1 quedan a 0.1 del rango general, pero en suelos
    calcáreos el Ca y el Mg dominan el complejo de cambio (Driessen 2001, Calcisols). Sí puede ir en el detalle.
  - Materia orgánica: «low to medium» (SoilGrids da ~1.8 % de MO; el informe cita mediciones regionales de ~0.9–1.1 % [P]).
  - Tipo de suelo de la zona: «Soils of Delicias municipality (INEGI): Cambisols, Calcisols, Kastanozems» con el `texto_en` de
    cada grupo y el rótulo `texto_explica_en`. El tipo de suelo **por parcela** aún no está (abajo).
- **Lo que te pido como validación (Cristian lo pidió así):**
  1. Esquema de los tres archivos en tu validador y prueba en tu árbol.
  2. Revisión independiente: elige 4 o 5 afirmaciones del catálogo y de las reglas (p. ej. Calcisols, Vertisols, Gypsisols, la
     tabla DTPA de la NOM-021 y el aviso de Zn del nogal), ábrelas en la liga que trae cada bloque y dime si algo no coincide.
     Ese visto bueno lo reporto a Cristian como «validado por el integrador».
- **También:**
  - `et_contraste.csv` cambió por el cereal al 1-dic: 1,139.3 → 1,139.5 mm (el script imprime 1,140); sigue +393 mm (+53 %).
    `docs/resultado_A8.md` dice ahora 1,140. Si tu README dice 1,139, cámbialo o déjalo: la diferencia es de 0.2 mm.
  - **Tu punto 3 (reproducir de cero) está hecho:** `docs/reproducir_datos.md` y `python datos/colab/correr_todo.py --salida
    <vacía> --comparar data/entrega_zonas`. Comprobado: **32 de 32 archivos idénticos** byte por byte en 1 min 39 s, incluido el
    rectángulo del prerregistro (H1, H1-b y H3 salen idénticos; el B1 de ese rectángulo se lee del commit 522585f).
  - **Pendiente por la compu de Cristian** (Chrome no responde desde las 18:50): el tipo de suelo por parcela (OpenLandMap,
    gran grupo USDA, 250 m; y HWSD v2, ~1 km) y GAEZ. Cristian ya dio el sí para GAEZ. GAEZ v4 cubre alfalfa, algodón, maíz,
    sorgo, avena, trigo y cebada; **no cubre chile ni nogal**, y la FAO no recomienda usarlo por debajo del primer nivel
    subnacional: irá como contexto regional (`gaez_zona.csv`), nunca por parcela.
