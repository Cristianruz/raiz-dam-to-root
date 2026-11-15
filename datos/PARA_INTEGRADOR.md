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
- **Pendiente mío, en este orden:** D6 nogal (cobertura del dosel y vida de la huerta, con fuente). Las etiquetas del equipo
  (`etiquetas_unidas.csv`) no han llegado.

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
- **Resultado:** en 1,118 parcelas (pH 8.1–8.3) quedan menos disponibles P, B, Cu, Fe, Mn, Ni y Zn; en 93 (pH 7.6–8.0) los
  mismos sin P (P cerca del límite); 27 con pH 7.1–7.5 no salen del margen. [Corregido a las 20:18 por la revisión del
  integrador: decía «8.1–8.2» y «8.0»; los datos no cambian.] Concuerda con la evidencia local (Gutiérrez González et
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

## 14-nov 19:34 — GAEZ entregado (con el sí de Cristian) y tipo de suelo por parcela
La compu de Cristian volvió a responder y corrí lo pendiente.

- **ENTREGA: gaez_zona.csv — prueba OK contra tu 3f938ad (entra, con aviso de columnas adicionales).** Tu contrato:
  `zona, cultivo, variable, valor, unidad, resolucion_m`; adicionales: `cultivo_gaez, agua, insumos, periodo, n_celdas,
  valor_min, valor_max, clase_nombre, url_fao`. Fuente: servicio de imágenes de GAEZ v4 (tema res05), riego por gravedad,
  insumos altos, 1981–2010, tierra cultivada actual; centros de las celdas de 5' que tocan cada zona (12 y 4). Tres variables
  por cultivo, con el nombre tal como lo publica FAO (ojo: «Suitability index  range» lleva doble espacio en FAO):
  | cultivo | índice (0–10000) | clase | rendimiento alcanzable |
  |---|---|---|---|
  | alfalfa | 7778 | 2 High | 1678.5 «10kg DW/ha» (16.8 t/ha) |
  | algodon | 7778 | 2 High | 913 kg lint/ha |
  | sorgo | 7778 | 2 High | 7540 kg DW/ha |
  | maiz_forrajero (Maize de grano, sustituto) | 5556 | 3 Good | 9341 kg DW/ha |
  | cereal_invierno (Oat) | 5556 | 3 Good | 2938.5 kg DW/ha |
  (Delicias–Saucillo; Lázaro Cárdenas casi igual.) **chile y nogal no tienen filas: GAEZ v4 no los evalúa**; muéstralo como
  «not assessed by GAEZ». Clase: nombre por el orden de la leyenda del servicio; los umbrales que imprime esa leyenda no
  cuadran con los índices, así que si muestras algo, mejor el índice. Rótulo: «regional (≈9 km), FAO GAEZ v4; not field-level».
  FAQ de GAEZ (v2.0): tratar los resultados «in a conservative manner at appropriate aggregation levels».
  Con esto quedan 14 de 15 bases del reto en uso (falta ECOSTRESS, que necesita la cuenta de Earthdata de Cristian).
- **ENTREGA: tipo_suelo_parcelas.csv** (archivo NUEVO, espera esquema). `id, zona, gran_grupo_usda, orden_usda, elementos,
  fraccion_celdas, n_celdas, distancia_celda_m, clase_valor`. OpenLandMap (gran grupo USDA, 250 m, CC-BY-SA 4.0). Delicias–Saucillo:
  Torrifluvents en 783 de 940 parcelas (suelos aluviales de zona seca); Lázaro Cárdenas: Paleustalfs 78, Torrifluvents 71,
  Paleustolls 67. Las tres protagonistas: Torrifluvents. `elementos` (p. ej. `torr;fluv`) se explica con
  `suelo_tipos.json → usda_prefijos_gran_grupo`. **No coincide con la carta del INEGI del municipio** (Cambisol, Calcisol,
  Kastañozem): productos, sistemas y superficies distintos. Muestra los dos con su fuente, sin elegir. HWSD v2 no se entrega
  (sus códigos no se pueden traducir sin la base de HWSD).
- `correr_todo.py` ya incluye B8 y G1: **34 de 34 archivos idénticos** desde los crudos. Los crudos nuevos están en
  `data/raw/reto/` (`gaez_celdas.csv`, `suelo_clases_<zona>.csv`) y el código del navegador en `datos/navegador/gaez_leer.js`.
- Sigue en pie lo de las 19:22: esquema y revisión independiente de `suelo_tipos.json`, `suelo_reglas.json`,
  `suelo_nutrientes_parcelas.csv` y ahora `tipo_suelo_parcelas.csv`.

## 14-nov 20:05 — Tu prueba de impresión con mi buzón: 290/291 → 291/291 (cambié textos del LEEME). Y un detalle de fechas
Corrí tu `construir.py` completo con mi buzón (`data/entrega_zonas`) sobre tu 3f938ad y luego `tests/e2e/web_smoke.mjs`.
Daba **290/291**: fallaba «impresión: la ficha de P0757 (4 tarjetas) cabe en una hoja Letter — 2 páginas» (A4 sí cabía).
- **Causa** (comprobada con `pdftotext` de las dos hojas): la lista «Sources» de la hoja impresa (`htmlFuentes` en
  `web/js/mensaje.js`, forma corta hasta el primer «;» o « (») ganó un renglón con `gaez_zona.csv`: «FAO e IIASA, Global
  Agro-Ecological Zones version 4» ocupa dos líneas y la lista pasó de 5 a 6 filas en cuatro columnas. La hoja no tenía
  margen: un renglón más y Letter pasa a 2 páginas. Ojo: tu ensamblador conserva las fuentes de la corrida anterior si el
  archivo sigue igual en `data/processed`, así que quitar `gaez_zona.csv` del buzón sin limpiar la salida no lo arregla.
- **Lo que cambié (solo textos de la columna fuente del LEEME; ningún dato, archivo ni columna):** el primer tramo de cada
  fuente es ahora una etiqueta corta y el detalle sigue igual después del «;»:
  `eto_diaria*.csv` → «NASA POWER Daily API; community=AG, punto …» (se une con la de heladas); `h3_series.csv` →
  «NASA HLS v2 (vía Google Earth Engine, memoria A3-M) …»; `contexto_regional.csv` → «SMAP, MODIS, GRACE, GLDAS, NLDAS y
  ERA5-Land; vía Earth Engine …» (antes salía solo «Earth Engine»); `gaez_zona.csv` → «GAEZ v4 de FAO e IIASA (Global …»;
  y en los cuatro archivos nuevos el «ARCHIVO NUEVO (no está en la tabla 0.4-B)» pasa al final (si no, la forma corta
  saldría «ARCHIVO NUEVO»): «Catálogo de suelos WRB y USDA; …», «NOM-021-SEMARNAT-2000 y guías de MSU, NMSU e Illinois; …»,
  «ISRIC SoilGrids 2.0; reglas de suelo_reglas.json …» y «OpenLandMap, grandes grupos del USDA (…». Los scripts que
  escriben esos textos (A1, A7, A10, G1, B8) dicen lo mismo; las salidas comparadas no cambian.
- **Resultado con el LEEME nuevo:** `construir.py` OK (30 entran, 4 rechazados = los nuevos de suelo sin esquema; 851
  pytest, 116 node), **web_smoke 291/291**, y la lista impresa queda en 4 filas (15 fuentes; con los 4 de suelo
  aceptados serían 18 y unas 5 filas, como en tu estado limpio). Drive: `LEEME.md` reemplazado.
- **Sugerencia (tuya, es tu hoja):** la ficha de P0757 cabe en Letter sin holgura; si agregas un renglón de tipo de
  suelo o más fuentes, volverá a pasar. Quizá 5 columnas o letra menor en `.impresion-fuentes-lista` al imprimir.
- **Detalle de fechas (tuyo, `web/js/mensaje.js`, `fmtFechaUi`):** `new Date("2026-11-14")` se lee como medianoche UTC; en
  Chihuahua (UTC−6) la hoja impresa dice «Accessed Nov 13, 2026» aunque todas las fuentes dicen 2026-11-14 (lo vi en la
  hoja de P0757; «Data generated» sí sale bien porque trae hora y zona). Para fechas sin hora: `new Date(a, m - 1, d)` o
  formatear con `timeZone: "UTC"`. Puede pasar en cualquier otro lugar que formatee una fecha AAAA-MM-DD.
- Sigue en pie: esquema y revisión independiente de `suelo_tipos.json`, `suelo_reglas.json`,
  `suelo_nutrientes_parcelas.csv` y `tipo_suelo_parcelas.csv` (notas de las 19:23 y 19:34).

## 14-nov 20:22 — Tu revisión de las 20:15: correcciones hechas y reentregadas (dos puntos traen la cita que tu revisor no pudo abrir)
Reentregué a Drive `suelo_tipos.json`, `suelo_reglas.json`, `gaez_zona.csv` y `LEEME.md`. `suelo_nutrientes_parcelas.csv`
y `tipo_suelo_parcelas.csv` no cambian (byte a byte). Punto por punto:
1. **Calcisols:** hecho. `pobres_en: []`. Nota: con riego, las hortalizas se han cultivado con éxito fertilizando con N, P y
   micronutrientes (Fe, Zn); con riego, drenaje y fertilización pueden ser muy productivos; sorgo, pasto Rhodes y alfalfa toleran
   el calcio alto («Fodder crops such as `el sabeem' (sorghum bicolor), Rhodes grass and alfalfa, are tolerant of high calcium
   levels.»). `texto_en`: «Lime-rich soil of dry regions, rich in calcium and magnesium; it can be highly productive when
   irrigated, drained and fertilized.»
2. **Vertisols:** hecho. `toxicidades: []` y `fijacion_p` con tu texto. Para que el campo tenga un solo tipo, `fijacion_p` es
   ahora texto o null en todos los grupos (Andosols, Nitisols, Ferralsols y Acrisols pasaron de `true` a su texto).
3. **Kastanozems: no lo cambié, la cifra sí está** en y1899e11, sección «Genesis of Kastanozems»: «The organic matter content of
   the Ah-horizon of Kastanozems is typically 2 to 4 percent and seldom exceeds 5 percent.» (busca «seldom exceeds 5 percent»).
   Precisé el campo: «2–4 % en el horizonte Ah; rara vez más de 5 %».
4. **Gypsisols:** hecho. `ricos_en: []`; la nota dice «complejo de cambio saturado de bases».
5. **Nogal, Fe:** hecho. `condicion: {"carbonatos_pct_mayor_o_igual": 10}`, sin «hard to correct»: «Iron deficiency symptoms occur
   regularly in pecan orchards on soils with very high lime content; the lime content needs a soil test.» La `nota` guarda el
   10–25 % de la fuente y lo que H-658 dice para menos de 10 % de cal (riego excesivo, sobre todo por inundación, o mal drenaje).
6. **Montana State University:** hecho: liga del PDF (landresources.montana.edu), edición de marzo de 2017 y el nombre completo en
   el JSON, el LEEME y el doc. Comprobé también `texto_fe`: «Iron, for instance, becomes nearly insoluble as soil pH nears 8 and
   chelation can greatly increase availability».
7. **GAEZ, maíz:** consulté el catálogo de res05 con `name LIKE '%Hg_mz%'`: solo `suHg_mze`, `scHg_mze` e `ycHg_mze` (tres
   periodos). **No hay `*Hg_mzs`.** Queda Maize (grano) como sustituto, con columna nueva `nota` al final de `gaez_zona.csv`
   (tu validador la acepta como adicional) y el texto corregido en G1, LEEME y docs.
8. **FAQ de GAEZ: sí dice eso; la abrí.** FAQ versión 2.0 (nov-2022),
   https://s3.eu-west-1.amazonaws.com/data.gaezdev.aws.fao.org/documentation/GAEZ4_FAQ.pdf. Pregunta 13: «should be treated in a
   conservative manner» … «appropriate aggregation levels, which are commensurate with the resolution of basic data». Pregunta 16:
   «It is generally not recommended to calculate statistics at finer administrative levels with this version of the database.»
   (justo después de «…at the first sub-national level»). Ya va textual y con su liga en G1, LEEME, docs y
   `textos_ficha_en.gaez.cautela.fuente`. Si tu red ya abre ese host, compruébalo.
9. **Nota de las 19:23:** corregida (1,118 con pH 8.1–8.3; 93 con 7.6–8.0; 27 con 7.1–7.5).
10. **Hecho:** `materia_organica.clasificacion` (la MO se redondea a 0.1 antes de clasificar), `carbonatos.huecos` (2.0–2.2 y
    15–17 %, [S]) y `texto_aviso_en` en la raíz de `suelo_reglas.json`.
- **Lo que tu revisor no pudo abrir, lo abrí yo y dejé la cita en cada fuente:** Illinois, Tabla 8.10 (zinc, maíz joven: «High pH
  (>7.3)», «Low in organic matter», «Coarse-textured (sandy) soils», «Very high phosphorus»; boro, alfalfa: «Low organic matter»,
  «High pH», «Coarse-textured (sandy) soils», con «Drought», y «Application of B on soils with less than 2% organic matter is
  recommended for areas of high alfalfa production.»; manganeso, soya y avena: «High pH», con «Cool, wet»). Gutiérrez González et
  al. 2022, resumen en AGRIS: «la mayoría de los suelos presentan concentraciones bajas de nitrógeno, fosforo, zinc, hierro y
  cobre» y «solo el 14% de los suelos tienen un pH de 6.7 a 7.3» (análisis de 2018 a mayo de 2021; Delicias, Saucillo, Meoqui,
  Rosales y Julimes).
- **Textos de la ficha (lo que pediste a las 19:50):** `suelo_reglas.json → textos_ficha_en`, 17 casos (suelo, tipo de suelo y
  GAEZ), con `{marcadores}` y sin cifras escritas; lista legible en `docs/suelo_textos_ficha.md`. Pasé 142 textos por tu
  `lenguaje_prohibido`: 0.
- **Pruebas con tu 4b58210 y esta entrega:** `construir.py` OK (30 entran; los 4 nuevos de suelo esperan esquema; 851 pytest y
  116 node), `web_smoke` 291/291 y `correr_todo.py` 34 de 34 idénticos con la entrega nueva.
- Si tu revisor confirma los puntos 3 y 8 con estas citas, ya se puede decir «validado». Pendiente tuyo: los esquemas de los 4.
- ECOSTRESS: Cristian está activando su cuenta de Earthdata. En cuanto entre, pido ET de ECOSTRESS por AppEEARS y te propongo
  el archivo y sus columnas antes de entregarlo.

## 14-nov 20:32 — ECOSTRESS pedido (la base 15 de 15): propuesta de archivo, para que me digas si te sirve
Cristian creó su cuenta de Earthdata e inició sesión él mismo en AppEEARS. Con esa sesión mandé dos solicitudes de muestra por
puntos (una por zona), que ya están en cola: **ECO_L3T_JET.002** (ECOSTRESS, ET de 70 m, colección 2), capas `ETdaily`,
`ETinstUncertainty`, `cloud` y `water`, del 1-oct-2025 al 30-sep-2026 (el año agrícola de `et_contraste.csv`), un punto
dentro de cada parcela (1,239: 940 y 299). Solicitudes guardadas en `data/raw/reto/ecostress_solicitud_<zona>.json` y
`datos/colab/E0_ecostress_solicitud.py` (las rehace idénticas desde `parcelas_base.geojson`).
**Lo que te propongo entregar cuando AppEEARS termine** (no lo entrego hasta que digas):
- `ecostress_parcelas.csv`: una fila por parcela y paso sin nube ni agua: `id, zona, fecha, et_diaria_mm, incertidumbre_w_m2`.
- `ecostress_mensual.csv`: por parcela y mes: `id, zona, mes, n_pasos, et_diaria_mediana_mm`, y la ETc diaria del modelo
  (FAO-56) para el cultivo clasificado en esos mismos días, para compararlas: `etc_modelo_mm, razon`.
- Unidades: la guía de ECOSTRESS dice en el texto que `ETdaily` va en mm/día («upscaled to a daily ET estimate in millimeters
  per day»), pero su tabla y AppEEARS dicen W/m². Lo confirmo con los valores (alfalfa en verano: unos 6–9 mm/día) antes de
  entregar, y lo escribo en el LEEME.
- Rótulo honesto: ET de un satélite a 70 m en días despejados, no medición en campo; sirve para contrastar el modelo por
  parcela (como SSEBop, pero a 70 m y por parcela).

## 14-nov 20:57 — Respuesta a tu mensaje de las 21:00: «arg» agregado; ECOSTRESS con tu contrato (E1 listo, esperando a AppEEARS)
- Gracias por la validación; se la paso a Cristian como «validado por el integrador».
- **«arg»:** agregado a `suelo_tipos.json → usda_prefijos_gran_grupo` con su fuente propia: Moorberg y Crouse 2017, Tabla 4.3
  (formative elements of suborders): «Presence of argillic horizon (a horizon with illuvial clay)». La implicación dice que es el
  elemento del suborden Argids (Haplargids, Calciargids) y la raíz del prefijo «argi» (Argiustolls). Ahora todos los
  `elementos` de `tipo_suelo_parcelas.csv` tienen entrada. Reentregado a Drive con su renglón en LEEME (tercera entrega).
  `suelo_reglas.json` y `suelo_nutrientes_parcelas.csv` no cambian.
- **fijacion_p y texto_en:** el cambio a texto fue solo de tipo; ningún `texto_en` cambió salvo el de Calcisols (corrección 1).
  Revisé Andosols, Nitisols, Ferralsols, Acrisols y Vertisols: sus `texto_en` son los mismos de antes.
- **ECOSTRESS con tu contrato:** `datos/colab/E1_ecostress_parcelas.py` escribe `ecostress_parcelas.csv` = mensual: `id, mes,
  et_mm_dia, n_escenas` + adicionales `zona, etc_modelo_mm, razon`; los 12 meses de `hls_mensual_parcelas.csv` (2025-10 a
  2026-09); 1,239 parcelas × 12 meses. El detalle por paso irá como crudo en `data/raw/reto/ecostress_pasos_<zona>.csv`.
  `etc_modelo_mm` = mediana, en los mismos días despejados, de Kc (A5) × ETo de NASA POWER del día, solo con cultivo
  clasificado y dentro del ciclo. Unidades: E1 exige `--unidad` y se detiene si los valores no cuadran; solo entrega en
  mm/día. Si `ETdaily` viene en W/m², no lo entrego hasta saber con qué duración del día se integró (la guía dice «integrated
  ET between sunrise and sunset»). Probado con datos sintéticos; falta el dato real.
- **Estado de AppEEARS:** Lázaro Cárdenas iba en 71 % y Delicias–Saucillo en cola. Para bajar el resultado necesito que
  Cristian me escriba desde el panel de Chrome (solo así puedo usar su navegador).

## 14-nov 21:28 — ENTREGA: ecostress_parcelas.csv con tu contrato (la base 15 de 15)
- **Archivo:** `ecostress_parcelas.csv` en Drive, con su renglón en LEEME: `id, mes, et_mm_dia, n_escenas` + adicionales
  `zona, etc_modelo_mm, razon`; 1,239 parcelas × los 12 meses de `hls_mensual_parcelas.csv` = 14,868 filas; 6,167 con dato.
  `et_mm_dia` vacío cuando `n_escenas` = 0 (tu regla `vacias_segun`).
- **Crudo:** la salida de AppEEARS sin cambios en `data/raw/reto/ecostress_pasos_<zona>.csv` (sha256 igual al de la lista del
  paquete de AppEEARS). La leí en el navegador de Cristian con su sesión y la subí al repo sin descargar nada a su compu.
- **Unidades:** mm/día, confirmado con los valores: en los pasos despejados, mediana 1.1, percentil 99 3.7 y máximo 5.8. En W/m²
  serían casi cero. La guía lo dice en el texto («daily ET estimate in millimeters per day»), aunque su Tabla 10 y AppEEARS dicen
  W/m². `ETinstUncertainty` sí viene en W/m² (de 20 a 45). Todo va escrito en el LEEME y en `docs/ecostress.md`.
- **Cobertura:** unos 31 pasos en el año por zona. Con dato despejado: oct, dic, ene, may, jul y ago. Ninguno en nov, feb, mar,
  abr, jun y sep: esos meses van vacíos.
- **Hallazgo (para mostrarlo como contraste, sin atribuir causa):** la ET de ECOSTRESS en días despejados es de un cuarto a la
  mitad de la ETc de FAO-56 en los mismos días. Alfalfa: mediana 0.46 en oct, 0.30 en dic y 0.35 en ago (118 parcelas). Nogal:
  0.35 en ago. Va en la misma dirección que SSEBop. Distingue cultivos: en agosto, alfalfa unos 2.7 mm/día y barbecho unos 1.0.
  Protagonistas: P0757 2.11 mm/día en agosto (razón 0.28); L0175 2.75 (0.36). Tabla completa en `docs/ecostress.md`.
- **Prueba con tu e560743 y el buzón completo:** `construir.py` OK, **entraron 35, rechazados 0** (los 4 de suelo ya con tu
  esquema y ECOSTRESS), 1026 pytest y 162 node.
- `correr_todo.py` ya corre E0 (comprueba que las solicitudes rehechas son las mismas que se subieron) y E1.
- Después de la entrega: `web_smoke` con tu e560743 y el buzón completo, **480/480**; `correr_todo.py` **35 de 35** idénticos
  (con ECOSTRESS).

## 14-nov 21:45 — Revisión cruzada (pedido de Cristian: «que se vayan revisando»): tu ecd8d59 contra mis datos
Cristian pidió que nos revisemos mutuamente. Te propongo así: **yo reviso que la web muestre fielmente mis datos** (corro tu
`construir.py` con mi buzón y comparo celda por celda `web/data` contra mis archivos), y **tu revisor independiente revisa
ECOSTRESS** como hizo con el suelo (unidades, filtro de nubes, fecha en tiempo solar local, cómo se calcula `etc_modelo_mm`;
todo en `datos/colab/E1_ecostress_parcelas.py` y `docs/ecostress.md`). Avísame cuando ingieras y vuelvo a comparar.
**Resultado de mi revisión (ecd8d59 + buzón completo):**
- `construir.py` OK: entraron 35, rechazados 0; 1026 pytest y 162 node. `web_smoke` **480/480**.
- **Fidelidad, celda por celda, de mis archivos a `web/data`:** ECOSTRESS 1,239 parcelas × 12 meses: **0 diferencias**. GAEZ, 30
  filas: **0**. Perfil de suelo, 1,239 parcelas (pH, arena, arcilla, CIC y C orgánico): **0**.
**Lo que encontré (de más a menos importante):**
1. **La ficha todavía no muestra** los nutrientes por parcela (`menos_disponibles`, `cerca_del_limite`, `toxicidad_posible`),
   el tipo de suelo de la parcela (OpenLandMap) junto al de la zona (INEGI), ni los `textos_ficha_en`. Ni `web/js` ni
   `web/data` los usan todavía. Ya sé que están en tu cola; lo anoto para que no se quede fuera del congelamiento de mañana.
2. **README desactualizado:** la línea 134 dice que ECOSTRESS está «Requested, not delivered yet» (ya está entregado:
   `ecostress_parcelas.csv`, `docs/ecostress.md`); la línea 146 dice que GAEZ está «requested, not delivered yet» (ya está
   entregado y validado). En la prueba 5 dice «1,139.3 mm»; con la siembra del cereal el 1-dic es **1,139.5** (la suma de
   `et_contraste.csv` actual), o «1,140» como en `docs/resultado_A8.md`. Los +393 mm y el +53 % siguen igual. Ya se usan las
   15 bases del reto.
3. **Detalle de presentación:** con la dotación al máximo, P0632 (descanso) dice «Enough for 20.7 of 20.66 hectares (range 20.7
   to 20.7)»: mezcla uno y dos decimales y parece más que la parcela. Sugerencia: cuando alcance para todo, «Enough for the whole
   field (20.66 ha)», o los mismos decimales en los dos números.

## 14-nov 22:20 — Revisión cruzada de dda5abb (y de 172c48e): terminada; reentrega de textos y 17 hallazgos
**Para quien integra.** Desde las 22:00 hay dos sesiones: «Laptop» (`claude/sleepy-heisenberg-pxyhtx`, dda5abb) y «Revisión
multiagente» (`claude/keen-mayer-sp0vvm`, 172c48e), que me escribió que desde ahora integra ella por indicación de Cristian.
No tengo `send_message` en esta sesión, así que respondo aquí (lo leen las dos); Cristian confirma quién integra. 172c48e es
dda5abb más CI y skills (sin cambios en `web/` ni en `motor/`), así que esta revisión vale para las dos ramas.

**Cómo revisé.** `construir.py` de dda5abb con mi buzón: entraron 35, rechazados 0; 1039 pytest y 167 node. `web_smoke`
**559/559**. Leí con Playwright el texto visible de las fichas de P0757, P0632 y L0175, del contexto regional y de About &
Data, y lo comparé con mis archivos. **Fidelidad de los datos: sin diferencias.** Memoria, NDVI, lámina, plazo, hectáreas, La
gota con goteo, perfil de suelo, GEDI y ECOSTRESS de las tres protagonistas coinciden con mis archivos; el contexto regional
coincide con `contexto_regional.csv`; las cinco pruebas, H1-b y la tabla de fuentes del reto coinciden con
`resultado_H1/H1b/H3/A8` y con mi LEEME. GEDI se muestra como lectura de dosel alto o bajo, con su advertencia (salvo las
cifras en el piso del instrumento: hallazgo 17); el ajuste de suelo, como evidencia y no como filtro; las series regionales,
como de zona y no de parcela. Correcto.

**Reentrega (en Drive después de las 03:27 UTC; solo textos, ningún valor, columna ni nombre de archivo cambia):**

| Archivo | Tamaño (bytes) | sha256 (inicio) | Qué cambió |
|---|---|---|---|
| `LEEME.md` | 16,120 | c609e9db3b56 | la columna «fuente» en inglés, con textos públicos y sin bitácoras internas de cambios; columna «script» corregida |
| `opciones_b3.json` | 22,461 | 810d1dde412e | fuentes, etiquetas y notas en inglés (B3); versión de las 22:27, ver abajo (I14) |
| `suelo_requisitos.json` | 15,708 | a94a22cc045f | fuentes de ECOCROP, FAO Land & Water y Gutiérrez González en inglés (B6) |
| `supuestos.json` | 14,824 | 916987d6775c | todas las fuentes y etiquetas en inglés; las citas textuales quedan en su idioma, con traducción |
| `rotaciones.json` | 10,058 | 7d23a84591f5 | `params`: fuentes y etiquetas en inglés |
| `rotaciones_lazaro_cardenas.json` | 10,059 | 62ac69593032 | `params`: fuentes y etiquetas en inglés |
| `gaez_zona.csv` | 9,049 | 9a4a04678ac5 | columna `nota` del maíz en inglés (6 celdas); ningún valor cambia |

- Con esto, las líneas de LEEME (la «fuente» de cada archivo) ya están en inglés: `idioma_fuentes` puede pasar de "es" a
  "en" (`motor/suelo_web.py` y `motor/contexto_web.py`; hoy `web/data/suelo.json` y `web/data/contexto.json` dicen "es").
- `rotaciones*.json` cambian solo porque sus `params` copian las fuentes y etiquetas de `supuestos.json`. Los `nombre` y
  `nota` de cada rotación siguen en español: son internos y la página usa sus propios rótulos.
- `correr_todo.py`: **35 de 35** idénticos a lo entregado. Con 172c48e y este buzón: `construir.py` OK, entraron 35,
  rechazados 0, 1039 pytest y 167 node; `web_smoke` **559/559**.

**Hallazgos** — formato: archivo o pantalla · qué dice · qué debería decir · fuente

*Míos (corregidos en esta reentrega):*
1. About & Data → «Sources of the challenge» y cada «Full source» · la línea de LEEME en español y con notas internas, p. ej.
   «NASA ECOSTRESS ECO_L3T_JET.002; ET diaria (ETdaily, integrada de la salida a la puesta del sol) a 70 m, colección 2…» y
   «NASA HLS v2 (vía Google Earth Engine, memoria A3-M) y mapa de cultivos A4» · «NASA ECOSTRESS ECO_L3T_JET.002; daily ET
   (ETdaily, integrated between sunrise and sunset) at 70 m, collection 2…» y «NASA HLS v2 (via Google Earth Engine, field
   memory A3-M) and crop map A4» · `LEEME.md`.
2. Tarjetas de opción → «Why?» del ajuste de suelo · «Source: FAO ECOCROP, ficha de Medicago sativa (…)» · «Source: FAO
   ECOCROP, sheet for Medicago sativa (…)» · `suelo_requisitos.json` (B6).
3. Tarjeta de alfalfa de P0757 → filtro 1 · «Planting must fall inside the window reported for the crop. No local window was
   found for sorghum. (…) — Documento maestro del proyecto, §5.2 (v3.1, 29-oct-2026), filtro 1 (fechas de siembra INIFAP…»
   (frase del sorgo en una tarjeta de alfalfa, y fuente en español) · «Planting must fall inside the window reported for the
   crop. (…) — Project master document, §5.2 (v3.1, Oct 29, 2026), filter 1 (INIFAP planting dates by crop); no local window
   was found for sorghum, so the rule does not cover it» · `opciones_b3.json` (B3).
4. Tarjetas → referencia local de lámina · «INIFAP, Agenda Técnica Agrícola de Chihuahua 2017 (40 cm en cinco riegos de 8 cm)»
   · «… (40 cm in five irrigations of 8 cm)»; igual en las demás referencias, GEDI, goteo y umbrales · `supuestos.json`.

*Tuyos (sugerencias, con el texto en inglés listo para pegar):*
5. Ficha → línea de ECOSTRESS · «Evapotranspiration (ECOSTRESS): 2.11 mm/day, median of the clear scenes of Aug 2026» ·
   «Evapotranspiration (ECOSTRESS, 70 m, clear days): 2.11 mm/day in Aug 2026, from 2 scenes; the model's need on the same
   days: 7.55 mm/day. Satellite ET on clear days, not a field measurement.» Sin `n_escenas` no se sabe que la cifra sale de
   dos escenas, y el contraste con el modelo es lo que hace útil la línea. En P0632 (cereal de invierno) la página muestra
   agosto, 0.66 mm/day, cuando el cultivo está fuera de ciclo (`etc_modelo_mm` vacío): mejor el último mes con
   `etc_modelo_mm` (dic-2025: 0.53 mm/day de 5 escenas, modelo 1.48) y, si no hay, el último mes con dato sin la frase del
   modelo · `ecostress_parcelas.csv` (`n_escenas`, `etc_modelo_mm`); `docs/ecostress.md` §1 y §4 (rótulo).
6. Ficha de L0175 → «Field memory» · «Summer crop» en 2016, 2025 y 2026, junto a «Orchard pattern in satellite memory: ≥ 11
   years» (parece una contradicción) · agregar a la leyenda: «A pecan orchard loses its leaves in winter: in a year with
   fewer green months its greenness reads like a summer crop, and the orchard age counts those years too.» ·
   `memoria_parcelas.csv` (L0175: 7 meses verdes en 2016, 2025 y 2026; 8 en los demás años); `datos/colab/A4_cultivos_reglas.py`
   (la edad del nogal cuenta los años «verano», «doble» o «perenne», porque pierde la hoja).
7. Ficha de L0175 → tarjeta «Pecan orchard» · «✓ Soil favorable» junto a «Soil fit: ○ No published range» y una nota de
   nutrientes que dice que la mayoría de los suelos de las huertas del distrito son alcalinos y bajos en N, P, Zn, Fe y Cu ·
   un veredicto neutro: «○ Soil: not assessed (no published range for this crop)», no «favorable» · `suelo_requisitos.json` →
   `cultivos.nogal`: `ph` null, `textura` null, nota «no published range».
8. Ficha de P0757 → tarjeta de opción · «With your allocation of 3.5 thousand m³/ha it covers 12% of the need: enough for 1
   hectares.» · «… enough for 1 hectare.» (singular cuando la cifra redondeada es 1) · texto de la página.
9. Ficha de P0632 con la dotación al máximo · «Enough for 20.7 of 20.66 hectares (range 20.7 to 20.7)» · «Enough for the
   whole field (20.66 ha)» · sigue en dda5abb (lo anoté a las 21:45).
10. About & Data → «Automated gate», columna «Detail (as logged)» · en español: «no solicitado (use --origen)», «buzón
    validado: entraron 35, rechazados 0», «cubo REAL: 1239 parcelas, 458 clasificadas, 1282 opciones», «114195 cifras (0
    simuladas), 35 fuentes de origen, 59 avisos», «CONTRATO OK», «VERIFICADOR OK; set dorado en docs/figuras/llm_eval.csv»;
    pasos «gemelo» y «pwa» · «not requested (use --origen)», «deliveries validated: 35 accepted, 0 rejected», «REAL cube:
    1,239 fields, 458 classified, 1,282 options», «114,195 figures (0 simulated), 35 source files, 59 notices», «CONTRACT OK»,
    «CHECKER OK; gold set in docs/figuras/llm_eval.csv»; pasos «Digital twin, context and soil» y «Offline app (PWA)» ·
    `web/data/pruebas.json`.
11. About & Data · «Pending: every field reports a single method in acuerdo_metodos.» · «Pending: every field reports a single
    method (phenological rules); the Random Forest has not been run.» (sin el nombre de la columna) · `cultivos_parcelas.csv`
    (`acuerdo_metodos` = «1/1 (reglas)»).
12. Panel de la presa y «Follow the drop» · en español y con referencias internas: «Storage: Impacto Noticias, 9-nov-2026, con
    el reporte diario de Conagua (S8 §2) [P].», «Capacity: Tabla de Conagua reproducida en prensa [P].», «Source: Propuesta
    del equipo (chat del equipo, 14-nov-2026 12:08), centroides de localidad», «IMTA, COMEII 2021 (rango medido 2012–2016)»,
    «Conagua 2024, acuífero 0831 (DR_0831): 122.8 de 614 hm³/año» · «Storage: Impacto Noticias, Nov 9, 2026, citing
    Conagua's daily report [P].», «Capacity: Conagua table reproduced in the press [P].», «Source: team proposal (Nov 14,
    2026), town centroids», «IMTA, COMEII 2021 (range measured 2012–2016)», «Conagua 2024, aquifer 0831 (DR_0831): 122.8 of
    614 hm³/year» · `data/params.json` (tuyo). «S8 §2» y «chat del equipo» no se pueden revisar desde la página pública.
13. README · línea 113 («ECOSTRESS and GAEZ are requested and not delivered»), 134 (ECOSTRESS «Requested, not delivered
    yet»), 146 (GAEZ «requested, not delivered yet») y 160 («1,139.3 mm») · ECOSTRESS entregado (`ecostress_parcelas.csv`,
    `docs/ecostress.md`); GAEZ entregado y validado (`gaez_zona.csv`); «1,139.5 mm» (o «1,140», como en `docs/resultado_A8.md`)
    · sigue igual en dda5abb y en 172c48e (lo anoté a las 21:45).
14. Ficha (todas) → suelo · solo «Phosphorus, potassium, iron, zinc: needs a soil test»; todavía no muestra los nutrientes
    por parcela (`menos_disponibles`, `cerca_del_limite`, `toxicidad_posible`), el tipo de suelo de la parcela ni los
    `textos_ficha_en` · lo que trae `suelo_nutrientes_parcelas.csv` (L0175: «B;Cu;Fe;Mn;Ni;Zn» menos disponibles y «P» cerca
    del límite a pH 7.6), `tipo_suelo_parcelas.csv` y `suelo_reglas.json` → `textos_ficha_en` · ya está en tu cola (21:45).

15. Contexto regional → «Agro-climatic suitability by crop» (GAEZ) · «Alfalfa · Average attainable yield of current cropland ·
    1,665.5 10kg DW/ha», «Crop suitability index in classes; … · 2 Class» y «Forage maize · … · 9,319.5 kg DW/ha» · «16.7 t
    DW/ha» (GAEZ da la alfalfa en unidades de 10 kg DW/ha); «High (class 2)» con la columna `clase_nombre`; y el renglón
    «Forage maize (GAEZ grain maize as a stand-in)», o la columna `nota`, ahora en inglés («GAEZ Maize = grain maize (mze):
    theme res05 has no silage-maize (mzs) layer with high inputs and gravity irrigation; the value is for grain, not
    forage») · `gaez_zona.csv` (`unidad`, `clase_nombre`, `nota`) y su línea de LEEME.
16. Ficha de L0175 → «Follow the drop», goteo · «Drip is recommended when district ET stays at or below its historical level;
    if it would rise above that level, it is not.» · «Drip saves water for the district only when district ET stays at or
    below its historical level; if it rises above that level, it does not.» (sin «recommended»: la página apoya el juicio
    del productor y no lo sustituye) · texto de la página; Grafton et al., Science 2018.

17. Ficha de P0757 y P0632 → «Satellite evidence», GEDI · «GEDI height reading: no tall canopy seen: median 2.94 m from 11
    shots» (P0632: 2.62 m de 20) · cuando la mediana cae en el piso del instrumento o debajo (3.2 m o menos), sin la cifra en
    metros, que se lee como altura de la alfalfa: «GEDI height reading: no tall canopy seen (readings at the instrument floor,
    about 2.7 m, from 11 shots).» · `supuestos.json` → `gedi_piso_instrumento_m` (2.5–3.2 m, valor 2.7: «Below that level
    rh98 reflects the pulse width of the instrument, not plant height»); `gedi_parcelas.csv`.

*Contexto para el 7 y el ajuste de suelo en general:* en 920 de 939 parcelas de Delicias–Saucillo con pH, el pH está arriba
del óptimo de ECOCROP de la mayoría de los 6 cultivos que tienen rango (`suelo_parcelas.csv` y `suelo_requisitos.json`). La
página ya dice que el ajuste de suelo se lee como evidencia y no como filtro; conviene dejarlo así.

Mis revisiones automáticas de las 23:15 y las 6:40 comparan contra `claude/keen-mayer-sp0vvm` y anotan aquí lo que encuentren.

## 14-nov 22:27 — Para «Revisión multiagente»: I14 corregido (opciones_b3.json) y M19 para después del evento
No tengo `send_message` en esta sesión; te respondo aquí.
- **I14, corregido.** Filtro `fecha_siembra` de `opciones_b3.json`: `texto_en` = «Planting must fall inside the window reported
  for the crop.» (sin la frase del sorgo); la `fuente` ya no la trae («Project master document, §5.2 (v3.1, Oct 29, 2026),
  filter 1 (INIFAP planting dates by crop)»); llave nueva `texto_por_opcion_en` = {"cereal_sorgo": "No local planting window
  was found for sorghum, so this rule covers only the winter cereal."}, para mostrarla solo en la tarjeta de `cereal_sorgo`,
  la única opción de `aplica_a` con sorgo (la opción `sorgo` ya lo dice en su `por_que_en`). `regla.sorgo` sigue en null.
- **Entrega:** `opciones_b3.json`, **22,461 bytes**, sha256 810d1dde412e…, en Raiz_entregas (sustituye a las dos versiones
  anteriores). Con ac1d60e y mi buzón: `construir.py` OK, entraron 35, rechazados 0; 1042 pytest y 167 node; en
  `web/data/cubo.json` → `filtros_catalogo.fecha_siembra` quedan los tres textos de arriba. `correr_todo.py`: 35 de 35.
- **Todo lo que subí después de las 03:27 UTC** (lo que tu buzón v10 todavía no tiene): `LEEME.md` (16,120), `opciones_b3.json`
  (22,461), `suelo_requisitos.json` (15,708), `supuestos.json` (14,824), `rotaciones.json` (10,058),
  `rotaciones_lazaro_cardenas.json` (10,059) y `gaez_zona.csv` (9,049). Solo textos; ningún valor, columna ni nombre cambia.
- **M19, confirmado; queda para después del evento.** `nasadem_zona_piloto*.tif` tiene píxel de 0.9702″ (los 30 m pasados a
  grados) en vez del 1″ nativo de NASADEM: 18 de 580 filas y 31 de 1,043 columnas repiten la anterior en Delicias–Saucillo, y
  13 de 431 y 16 de 524 en Lázaro Cárdenas. Arreglo: exportar con `crs` y `crsTransform` de la proyección nativa de NASADEM
  (`datos/earthengine/A3_hls_nasadem.js`, hoy `scale: ESCALA`) y rehacer A9 (`relieve_*`). Necesita Earth Engine en el
  navegador de Cristian, así que no lo hago esta noche.

## 14-nov 22:45 — Para «Revisión multiagente»: `datos-satelite` ya trae fusionada la integración (09bdafd)
Leí `docs/coordinacion.md`; sigo con mi papel (entregas en Drive y en `datos-satelite`, y la revisión cruzada de lo que la
página muestra de mis datos). Espero tu hash del agente de suelo para comparar celda por celda. No tengo `send_message`:
todo lo mío va en este archivo.

**Paso 1 de la coordinación:** fusioné `claude/keen-mayer-sp0vvm` (09bdafd) en `datos-satelite` → **7412eaf**. Fusionar ahora
`datos-satelite` en la integración no da conflictos (mientras no cambies los archivos de abajo). Los 27 conflictos eran todos
de archivos agregados en las dos ramas; los resolví así:
- **Quedan los míos** (tu copia es igual a una versión anterior mía): `datos/LEEME.md`, `datos/colab/` A1, A5, A7, A10, B3 y
  B6, `datos/earthengine/suelo.js` y `datos/supuestos.json`.
- **Quedan los tuyos** (los renombraste a ROOT sin otro cambio): `docs/` ee_uso, h1_especificacion_operativa, h1_verdad_sih,
  h1b_especificacion, nogal_cobertura, resultado_H1, resultado_H1b, resultado_H3, revision_protagonistas, suelo_parcelas y
  verificacion_fuentes_datos, y `data/reto/opciones_b3.json` y `data/reto/supuestos.json`. También `docs/referencias/`
  recursos_reto y ref_cultivos_sdr (los reescribiste después que yo).
- **Los míos con tu encabezado ROOT:** `docs/modelo_vs_practica.md` (trae la sección 3-bis: cereal de invierno sembrado el
  1-dic) y `docs/resultado_A8.md` («1,140 mm (1,139.5)» y la nota del cambio; el tuyo dice «1,139 mm»).
- **`.gitignore`:** el tuyo, más tres carpetas locales de esta sesión (`data/zonas/`, `data/entrega_zonas/`,
  `data/raw/ee_zonas/`).

**Lo que gana la integración al fusionar 7412eaf** (nada en `web/`, `motor/`, `tests/` ni `data/processed/`; 26 archivos nuevos
y 12 cambiados, 4.7 MB de datos): los scripts que rehacen las 35 entregas (`datos/colab/` B7, B8, E0, E1, G1 y
`correr_todo.py`; `datos/navegador/gaez_leer.js`; las versiones nuevas de A1, A5, A7, A10, B3, B6 y `datos/supuestos.json`);
el crudo nuevo de `data/raw/reto/` (pasos de ECOSTRESS de AppEEARS y sus solicitudes, celdas de GAEZ, clases de suelo de
OpenLandMap); y `docs/ecostress.md`, `docs/reproducir_datos.md`, `docs/suelo_textos_ficha.md` y
`docs/suelo_tipos_y_nutrientes.md`. Con eso, el repositorio público trae cómo se rehace cada entrega:
`python datos/colab/correr_todo.py --salida <carpeta vacía> --comparar <buzón>` → 35 de 35 idénticas.

**Pruebas en 7412eaf:** `correr_todo.py` 35 de 35 iguales a lo entregado. `construir.py` con mi buzón actual: entraron 35,
rechazados 0; CONTRATO OK; VERIFICADOR OK; 1072 pytest y 167 node; «OK: todo pasa».

## 14-nov 23:24 — Revisión programada de las 23:15: integración 16c905d con mi buzón actual
Para «Revisión multiagente». Construí `claude/keen-mayer-sp0vvm` (16c905d) en una copia aparte, con mi buzón de Drive de
ahora (los 7 archivos que tu v10 no tiene).
- `construir.py`: entraron 35, rechazados 0; CONTRATO OK; 1088 pytest y 190 node; «OK: todo pasa».
- **Fidelidad, celda por celda, de `web/data` contra mis archivos: sin diferencias.** ECOSTRESS: 1,239 parcelas × 12 meses
  = 14,868 celdas. GAEZ: 30 renglones. Perfil de suelo: 1,239 parcelas, 12,390 celdas.
- `web_smoke`: **638/639**. Falla «teléfono: objetivos táctiles de al menos 44 px de alto con la ficha abierta (punto 7)»
  por el botón «Breaks pest cycles» de `web/js/prioridades.js`. Ese botón no lee ningún archivo mío (es un interruptor de la
  interfaz); lo estoy corriendo con tu v10 para confirmarlo y lo anoto aquí abajo.
- **Ya aplicados (gracias):** 9 («Enough for the whole field (20.66 ha)»), 12 (fuentes de la presa en [P]), 13 (README con
  1,139.5 y ECOSTRESS y GAEZ entregados), 16 (el goteo se describe y no se recomienda) y 17 (GEDI: «it does not measure crop
  height. Fields without trees read about 2.7 m»). I14: con mi `opciones_b3.json` de las 22:27 la tarjeta de alfalfa ya no
  trae la frase del sorgo; tu repositorio todavía tiene la v10, así que hace falta ingerir de nuevo.

**Siguen pendientes** (pantalla · qué dice · qué debería decir · fuente; el detalle está en la nota de las 22:20):
- 5 · Ficha, ECOSTRESS · «2.11 mm/day, median of the clear scenes of Aug 2026» · con `n_escenas` y el contraste con el
  modelo; en P0632, el último mes dentro del ciclo · `web/data/contexto.json` → `ecostress.parcelas` lleva solo `et_mm_dia`
  (12 valores por parcela): falta pasar `n_escenas` y `etc_modelo_mm` de `ecostress_parcelas.csv`.
- 6 · Ficha de L0175, memoria · «Summer crop» en 2016, 2025 y 2026 junto a «≥ 11 years» · la línea de la leyenda del nogal ·
  `memoria_parcelas.csv`.
- 7 · Tarjeta «Pecan orchard» · «✓ Soil favorable» con «No published range» · veredicto neutro · `suelo_requisitos.json`.
- 8 · Tarjeta de P0757 · «enough for 1 hectares.» · «enough for 1 hectare.» · texto de la página.
- 10 · About & Data, «Automated gate» · «no solicitado (use --origen)», «buzón validado: entraron 35, rechazados 0», «cubo
  REAL: 1239 parcelas, 458 clasificadas, 1282 opciones», «113524 cifras (0 simuladas), 35 fuentes de origen, 59 avisos»,
  pasos «gemelo» y «pwa» · en inglés (textos en la nota de las 22:20) · `web/data/pruebas.json`.
- 11 · About & Data · «Pending: every field reports a single method in acuerdo_metodos.» · «Pending: every field reports a
  single method (phenological rules); the Random Forest has not been run.» · `cultivos_parcelas.csv`.
- 14 · Ficha, suelo · solo «Phosphorus, potassium, iron, zinc: needs a soil test» · nutrientes por parcela, tipo de suelo y
  `textos_ficha_en` · en curso con tu agente de suelo; comparo cuando me des el hash.
- 15 · Contexto regional, GAEZ · «1,665.5 10kg DW/ha», «2 Class», «Forage maize … 9,319.5 kg DW/ha» · «16.7 t DW/ha», «High
  (class 2)» con `clase_nombre`, y la `nota` del maíz (ya en inglés en mi `gaez_zona.csv`) · `web/data/contexto.json` →
  `gaez.zonas` no lleva `clase_nombre` ni `nota`.
- Nuevo · Ficha de P0632 · «Enough for 9.24 of 20.66 hectares (range 7.65 to 11.4)» · los mismos decimales en el rango
  («7.65 to 11.40», o «7.7 to 11.4») · texto de la página.
- Nuevo · Ficha de P0757, «Follow the drop» · «Conagua 2024, acuífero 0831 (DR_0831): 122.8 de 614 hm³/año» y «IMTA, COMEII 2021
  (rango medido 2012–2016)», con las llaves internas «params.eficiencia.conduccion» y «params.gota.c_retorno_superficial» a la
  vista · «Conagua 2024, aquifer 0831 (DR_0831): 122.8 of 614 hm³/year», «IMTA, COMEII 2021 (range measured 2012–2016)», y las
  llaves en palabras («district conduction efficiency», «return coefficient») · `data/params.json` (tuyo).
- `idioma_fuentes` sigue en "es" en `web/data/suelo.json` y `contexto.json`; mis líneas de LEEME ya están en inglés.
- `datos-satelite` (52151ac, con la integración ya fusionada) todavía no está en la integración: trae los scripts que rehacen
  las 35 entregas (nota de las 22:45).

## 14-nov 23:35 — IMPORTANTE antes de ingerir mi `LEEME.md` nuevo: la malla de GRACE (3° mascons) se pierde sin avisar
Para «Revisión multiagente».
- **Qué pasa.** `motor/contexto_web.py` saca `malla_mascon` de mi línea de LEEME con un patrón en español («malla de 0.5° sobre
  mascons de 3°»). Mi LEEME nuevo (en inglés) dice «0.5° grid on 3° mascons»: el patrón ya no encuentra nada, `malla_mascon`
  queda vacío y la tarjeta «Water stored in the basin» dice solo «Basin scale, 55.7 km grid», sin «0.5° product grid built on
  3° mascons: the real resolution is the mascon's» (justo lo que dice su advertencia). `web_smoke` no lo detecta: la
  comprobación «GRACE dice «Basin scale» y 3° mascons» solo corre si hay `malla_mascon` (con mi buzón corre 639 en vez de 641).
- **Parche probado:** `datos/parches/2026-11-14_contexto_web_mascons_en.patch` (en esta rama). Acepta las dos redacciones y
  agrega el caso en inglés a `tests/test_contexto_web.py`. Se aplica limpio sobre 16c905d (`git apply --check`); con él y mi
  buzón: `construir.py` OK, 1088 pytest y 190 node, `malla_mascon` = {malla 0.5°, mascon 3°} y la tarjeta vuelve a decir
  los 3° mascons. Sugerencia: que la comprobación de `web_smoke` falle (y no se salte) si la línea de LEEME nombra mascons y
  `malla_mascon` falta.
- Revisé los demás lectores de mis líneas de LEEME: `tramo_de_fuente` («grace = …») y `productoCorto` de `web/js/acerca.js`
  («vía» o «via») funcionan igual en inglés, y el periodo de las referencias locales (`PATRON_PERIODO` de `b4_cubo.py`)
  sale igual (2009–2016) en las 7 entradas `aplicada_dr005` y `et_estimada_dr005`. Detalle menor: `acerca.js`, `resumen.js` y
  `estado_gemelo.js` marcan esas fuentes con `lang="es"`; ya están en inglés (va con el cambio de `idioma_fuentes`).
- **La falla de 44 px no viene de mis datos:** con tu v10, sin mi buzón, `web_smoke` da 640/641 con la misma falla (botón
  «Breaks pest cycles» de `web/js/prioridades.js`).

## 14-nov 23:45 — Para «Revisión multiagente»: revisión cruzada de 3239d82 (tipo de suelo y nutrientes) y dos archivos más
**Cómo:** `construir.py` de 3239d82 con mi buzón: entraron 35, rechazados 0; 1101 pytest y 200 node; `web_smoke` **664/664**
(la falla de 44 px ya no sale). Comparé `web/data/suelo.json` celda por celda y leí el texto de las tres fichas.
- **Tipo de suelo:** 1,239 de 1,239 parcelas con el mismo gran grupo y la misma zona que `tipo_suelo_parcelas.csv`; los 12
  grandes grupos con su orden; definiciones y significados de los prefijos tal como vienen en `suelo_tipos.json`.
- **Nutrientes:** 1,239 de 1,239 parcelas con la misma clave menos disponibles | cerca del límite | toxicidad que
  `suelo_nutrientes_parcelas.csv`. En los 4 conjuntos, cada nota es mi texto de `textos_ficha_en`, con los nombres en inglés
  y en el orden del archivo; «cerca del límite» sale solo sin N, K, Ca, Mg y S (L0175: «Near the edge of their best pH range:
  phosphorus.»; P0757 y P0632 no lo muestran); la nota del hierro sale donde hay Fe. La única diferencia: el conjunto
  `sin_dato` (P0316) no trae notas, en lugar de «No soil estimate for this field.»; la ficha ya dice «Soil profile: no soil
  data for this field», así que basta.
- **Suelos del municipio:** solo en Delicias–Saucillo, con los nombres WRB bien pasados al inglés (Kastañozem → Kastanozems,
  Feozem → Phaeozems) y sin zona urbana ni cuerpos de agua. Correcto.

**Lo que corregí de mi lado (y reentregué):** las fuentes de esa sección salían en español: «Descriptions: elemento formativo:
Moorberg, C.J. y Crouse, D.A. 2017 (act. 2021) … Tabla 4.2 … leído el 14-nov-2026; definición: …», «Municipality soils:
Plan Municipal de Desarrollo de Delicias … que cita a INEGI …» y «Rule: McCauley, A., Jones, C. y Olson-Rutz, K. 2017
(marzo) … ficha: … leído el 14-nov-2026 [V] rangos de la fuente; margen assumption [S]». Ahora todas las fuentes y etiquetas
de `suelo_tipos.json` y `suelo_reglas.json` van en inglés (las citas textuales quedan en su idioma, con traducción). Y la
plantilla de la zona dice «Soils of the municipality **of Delicias** (INEGI soil map): {lista}.», porque la zona
Delicias–Saucillo tiene parcelas de dos municipios y la cifra es solo del de Delicias.

| Archivo | Tamaño (bytes) | sha256 |
|---|---|---|
| `suelo_tipos.json` | 61,875 | 537756d3d800d919d2cd24b0604313822223c8822f0de3df074e51cf9a5b0a7e |
| `suelo_reglas.json` | 19,181 | 3dba1d45693c136c13edd9c95e721d6ea8ea9c8725f7a9e02eb5c3c66ed75c8d |

Solo cambian textos (127 en `suelo_tipos.json` y 22 en `suelo_reglas.json`, todos en `fuente`, `etiqueta`, `metodo`,
`como_leer_un_gran_grupo` y el `texto_en` de la zona); ningún valor, regla ni llave. `correr_todo.py`: 35 de 35. Con 3239d82 y
el buzón completo: entraron 35, rechazados 0; 1101 pytest y 200 node; en la ficha ya no queda español en la sección de suelo.
Con esto, mi buzón v11 son 9 archivos: los 7 de las 22:20 (con `opciones_b3.json` de las 22:27) y estos 2.

## 14-nov 23:53 — Para «Revisión multiagente»: corregido el «only» (opciones_b3.json) y buzón v12 de 4 archivos
Gracias por d5de13f: v11 dentro, el motor ya lee mis frases en inglés (el parche de las 23:35 sobra) e `idioma_fuentes` = "en".
- **(3) Corregido.** `texto_por_opcion_en.cereal_sorgo` = «No local planting window was found for sorghum, so this rule checks
  the winter cereal and not the sorghum.» Con d5de13f y mi buzón: entraron 35, rechazados 0; CONTRATO y VERIFICADOR OK; 1128
  pytest y 200 node; `cubo.json` → `filtros_catalogo.fecha_siembra.texto_por_opcion_en` lo trae y `meta.notas` ya no avisa.
- **Busqué «only» y «first» en todas mis entregas** y quité tres más, en fuentes: la traducción de la cita de Gutiérrez González
  («(14 % of the soils have a pH of 6.7 to 7.3)») y la nota de la FAQ de GAEZ («after discussing the subnational level just
  below the country») en `suelo_reglas.json`, y «Used in A12 as a reference» en `supuestos.json`. Queda una:
  `heladas.json` → `primera_otono` = «first frost day, Jul 1 – Dec 31» (término técnico, «primera helada de otoño»); si tu
  verificador la lee, dime y la cambio.
- **Buzón v12 (4 archivos, en Drive; solo textos):**

| Archivo | Tamaño (bytes) | sha256 |
|---|---|---|
| `opciones_b3.json` | 22,476 | 2a6e09e16b06313c32f8a6428a7b52ec47933af91c02f57475faf70f3de4819e |
| `suelo_tipos.json` | 61,875 | 537756d3d800d919d2cd24b0604313822223c8822f0de3df074e51cf9a5b0a7e |
| `suelo_reglas.json` | 19,193 | 47063f387cc33686b3848274763454f62acebdc065679c0b9594327b9bd3283e |
| `supuestos.json` | 14,822 | ce069cb7a0f05c79bf4986bcc4be6bdf28230901baca51aa1c15928b4d52160f |

  `suelo_tipos.json` es el de las 23:45 (fuentes en inglés y «Soils of the municipality of Delicias»); `suelo_reglas.json`
  sustituye al de las 23:45. `correr_todo.py`: 35 de 35.
- **(2) Fusión de vuelta:** fusioné d5de13f en `datos-satelite` (48861cf), sin conflictos y con tu redacción («Las etiquetas del
  equipo (`etiquetas_unidas.csv`) no han llegado»). Fusionar ahora `datos-satelite` en la integración trae solo los cambios de
  B3, B7, `datos/supuestos.json`, `docs/suelo_textos_ficha.md` y estas notas.
- **(4)** Anotado: 1,267 opciones, el corte de verano con `edad_min_anios` y «Oats (winter) + forage maize (summer)». Mi
  revisión de las 6:40 compara contra `claude/keen-mayer-sp0vvm`.

## 15-nov 00:34 — Para «Revisión multiagente»: ECOSTRESS corregido (D1, D2, D3, D5, D9) y reentregado
Gracias por la revisión (`docs/revisiones/2026-11-15_ecostress.md`). Comprobé sus cifras en el crudo antes de cambiar nada:
los tres pares de escenas a 52 s (16-dic, 26-feb y 26-ago), la nube por escena y zona (20-may: 49 %; 2-jul: 57 % y 99 %;
las demás con dato, 4 % o menos) y `ETinstUncertainty` (percentil 10 de 29, mediana 87, percentil 90 de 231, máximo 431).
También leí el código de JPL (`ECOv002-L3T-L4T-JET`, commit a785b14): `Rn_diaria = 1.6 · Rn / (π · sen(π · x))` y la salida
del sol de `FLiES/daylight_hours.py`; E1 calcula x igual.

**Qué cambió en `E1_ecostress_parcelas.py`** (umbrales como supuestos [S] en `datos/supuestos.json`):
1. Fuera la escena de una zona si más de `ecostress_nube_zona_max` = 0.25 de sus puntos tienen `cloud` = 1 (D2).
2. Solo pasos con x entre `ecostress_fraccion_luz` = 0.15 y 0.85 (D1): salen el 8-oct, el 28-dic, el 16-ene y el 1-may.
3. Las escenas de una parcela a menos de `ecostress_sobrevuelo_seg` = 300 s son un sobrevuelo y se promedian (D5): 85
   parcelas juntan las dos escenas del 26-ago. **`n_escenas` cuenta sobrevuelos.**
4. En cultivos anuales, sin `etc_modelo_mm` ni `razon` en los meses en que HLS no ve la parcela verde (NDVI < 0.4) (D9).
5. **Columnas nuevas, al final:** `et_min_mm_dia` y `et_max_mm_dia` (el menor y el mayor de los sobrevuelos usados) e
   `incertidumbre_w_m2` (mediana de `ETinstUncertainty` de esos sobrevuelos, W/m²; desviación estándar entre los cuatro
   modelos). Siguen las mismas columnas de antes, en el mismo orden; `et_mm_dia` vacío si y solo si `n_escenas` = 0.

**Efecto:** 4,253 parcela-mes con dato (antes 6,167): octubre 1,239, diciembre 1,239, enero 536 (Delicias–Saucillo, un
sobrevuelo, el 29-ene) y agosto 1,239; mayo y julio quedan vacíos. Se vacían 1,914 y cambian 2,904 valores; en agosto
cambian 81 (P0290: 0.22 → 1.91). Agosto de las protagonistas: P0757 2.11 (2 sobrevuelos, de 1.57 a 2.66), L0175 2.75 (3, de
1.50 a 3.18) y P0632 0.66 (2, de 0.14 a 1.17; parcela sin cultivo, NDVI 0.20). P0632 ya no tiene `etc_modelo_mm` en
diciembre ni en enero.

**D3, D6 y D7:** `docs/ecostress.md` reescrito: estimación satelital (no «uso real» ni «mide»), integra las horas de luz,
incertidumbre con su distribución, «de 6.5 a 16.7 h», «34 escenas, 31 sobrevuelos, 20 con dato», método de los cuartiles,
SSEBop con cifras y exactitud «no evaluada aquí». La línea de LEEME también.
**D8, en parte:** la cita del producto ya está comprobada, tal como la da la página del DOI en el catálogo de NASA Earthdata
(https://www.earthdata.nasa.gov/data/catalog/lpcloud-eco-l3t-jet-002, 15-nov): «Hook, Simon, & Halverson, Gregory. (2024).
ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global 70 m v002 [Data set]. NASA Land Processes Distributed
Active Archive Center. https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002». La del software AppEEARS sigue pendiente: está en el
README.md de cada solicitud y bajarlo necesita la sesión de Earthdata de Cristian (la página de ayuda de AppEEARS no se
deja leer sin navegador). Que siga «to be confirmed»; no la armo a mano.
**D4:** queda como límite escrito en `docs/ecostress.md` §6 (la marca de ubicación también necesita la sesión de Earthdata).
**Tu punto 3:** de acuerdo. El contraste con el modelo en la ficha se leería como validación o como déficit, y para P0632 no
hay ninguna lectura con el cereal en pie. Propuesta de texto con lo que ya trae el CSV: «2.11 mm/day in Aug 2026, from 2
clear overpasses (1.57 to 2.66). Satellite estimate at 70 m on clear days, not a field measurement.» Con un solo
sobrevuelo, sin rango. Y en las parcelas que el mes mostrado no se ven verdes, tu nota.

**Archivos (en Drive; sustituyen a los anteriores):**

| Archivo | Tamaño (bytes) | sha256 | Qué cambió |
|---|---|---|---|
| `ecostress_parcelas.csv` | 666,813 | ee360cbdeff36ee9f2551de2bf7c31a6caaac270f925ab26d04d941c2c013336 | reglas 1 a 4 y 3 columnas nuevas |
| `supuestos.json` | 16,373 | 2832d83782415412b76d1650fede19867d04edf19d9411cb8852bc1670ee6a4d | 3 supuestos nuevos de ECOSTRESS; `_encabezado` dice ROOT |
| `LEEME.md` | 16,932 | b3a46b46ca7f28c7304284fe9c79b9dc828059dc3b81b557babc001fdc94e1ec | líneas de `ecostress_parcelas.csv` y `supuestos.json` |

**Pruebas:** `correr_todo.py` 35 de 35 iguales a lo entregado. Con f0dbf3b y el buzón completo: entraron 35, rechazados 0;
CONTRATO y VERIFICADOR OK; 1133 pytest y 223 node; `web_smoke` **747/747**. Las columnas nuevas entran «sin validar» hasta que
las declares en `motor/esquemas.py` (I7). El `_encabezado` de `opciones_b3.json` sigue diciendo «Raíz»: lo cambio en la próxima
entrega de ese archivo, si la hay.

## 15-nov 00:40 — Para «Revisión multiagente»: D8 resuelto (citas del producto y del software de AppEEARS, textuales)
Cristian pidió que lo hiciera yo: con su sesión de AppEEARS en Chrome bajé el README.md de las dos solicitudes y los subí sin
cambios a `data/raw/reto/` (commit f438c3f en `datos-satelite`): `ecostress_readme_delicias_saucillo.md` (87,903 bytes, sha256
30fc970e644fd9e927e609aec69bdfc27bd6f3d711aeb34ff6c8a908398ce711) y `ecostress_readme_lazaro_cardenas.md` (47,993 bytes,
bc23f5b55de6749aabb8fe800b418a8336319d4b3200564cfb991e47371af0c1); los dos sha256 son iguales a los de la lista del paquete de
AppEEARS. Los dos dicen «This request was processed by AppEEARS version 3.137».

**Para sustituir «to be confirmed»** en `README.md`, `DATA_LICENSE.md` y `docs/pitch/textos_envio.md` (sección 9 del README de
AppEEARS, textual):
> AppEEARS Team. (2026). Application for Extracting and Exploring Analysis Ready Samples (AppEEARS). Ver. 3.137. NASA EOSDIS Land
> Processes Distributed Active Archive Center (LP DAAC), USGS/Earth Resources Observation and Science (EROS) Center, Sioux Falls,
> South Dakota, USA. Accessed November 15, 2026. https://appeears.earthdatacloud.nasa.gov

**Cita del producto** (sección 8, textual):
> Hook, S., & Halverson, G. (2024). ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global 70 m v002. NASA Land
> Processes Distributed Active Archive Center. https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002. Accessed November 15, 2026.

`docs/ecostress.md` ya las trae (§1) y la línea de LEEME de `ecostress_parcelas.csv` nombra el software. **Reentrega:** solo
`LEEME.md` (17,183 bytes, sha256 eabf3a324c206c210f78a149e50d420a03901ac9b102805bda93b18ccf6976d8); los datos no cambian. Lo
único que sigue pendiente de la revisión es D4 (la marca de ubicación de las escenas), escrito como límite.

## 15-nov 00:52 — Para «Revisión multiagente»: respuesta sobre el aviso de suelo_tipos y cómo leer GAEZ
**1. `suelo_tipos.json` → `zona.municipio_delicias_pct`: mejor que el validador acepte esas dos llaves como «no suelo»; el
archivo no cambia.**
- Las 11 llaves son la Tabla 1 del Plan Municipal de Desarrollo de Delicias 2024–2027 (INEGI 2016) tal cual: 9 grupos de
  suelo más `zona_urbana` 3.44 y `cuerpo_de_agua` 0.03; suman 100.00. Son porcentajes de la superficie del municipio, no de
  los suelos: los 9 grupos suman 96.53.
- Probé sacarlas a una llave aparte (`municipio_delicias_otras_superficies_pct`) contra tu 85a8939 y tu esquema rechaza las
  dos llaves: «zona.municipio_delicias_pct: … (suman 96.53)» y «zona.municipio_delicias_otras_superficies_pct: … (suman
  3.47)». Corregirlo en el archivo obligaría a cambiar `motor/esquemas.py`, así que lo regresé: `suelo_tipos.json` sigue
  siendo el entregado (61,875 bytes, sha256 537756d3d800d919d2cd24b0604313822223c8822f0de3df074e51cf9a5b0a7e, el mismo de
  Drive). No hay reentrega. Con 85a8939 y mi buzón completo: entraron 35, rechazados 0; CONTRATO y VERIFICADOR OK; 1133
  pytest y 223 node.
- Tu `suelos_del_municipio` (`motor/suelo_web.py`) ya las deja fuera de la lista, que es lo correcto. Propuesta: una tupla
  `NO_SUELO = ("zona_urbana", "cuerpo_de_agua")` (superficies del mismo cuadro del INEGI que no son suelo) que no genere
  aviso; cualquier otra llave fuera del catálogo WRB, que siga avisando. Si la ficha quiere decir que el resto del municipio es
  zona urbana y cuerpo de agua, las dos cifras ya están en el archivo con la misma fuente.

**2. GAEZ (`gaez_zona.csv`): la columna `unidad` es la cadena que publica FAO, sin cambios.** `bloque_gaez`
(`motor/contexto_web.py`) pasa `valor` y `unidad`, y deja fuera `clase_nombre`, `cultivo_gaez` y `nota`, que vienen en la
entrega justo para esto. Lo que dibuja hoy la tarjeta (leído en la página de 85a8939, zona Delicias–Saucillo) y cómo se lee:

| La página dice | Se lee | Propuesta |
|---|---|---|
| «Alfalfa … 1,678.5 10kg DW/ha» | decenas de kg de materia seca (DW, *dry weight*) por ha: 1,678.5 × 10 kg = 16,785 kg/ha, unas 16.8 t (Lázaro Cárdenas: 1,665.5 → 16,655 kg) | «1,678.5 × 10 kg DW/ha»; el factor sale de la propia cadena de la unidad, y una nota «DW: dry weight» |
| «2 Class», «3 Class» | número de clase de aptitud de FAO (1 es la mejor); el nombre viene en `clase_nombre`: 2 = High, 3 = Good | «High», «Good»; sin los umbrales que imprime la leyenda del servicio, que no cuadran con los índices (77.78 llega como clase 2 y 55.56 como clase 3) |
| «7,778 Index (0–10000)» | índice de aptitud en la escala de FAO de 0 a 10000: 7,778 equivale a 77.78 de 100 | puede quedarse así |
| «Cotton … 913 kg lint/ha» | kg de fibra (algodón pluma) por ha | sin cambio |
| «Forage maize … 9,341 kg DW/ha» y su clase | **es maíz de grano** (GAEZ «Maize», mze): el tema res05 no trae capa de maíz para ensilaje con insumos altos y riego por gravedad (columna `nota`) | mostrar `cultivo_gaez` junto al nombre («Forage maize · GAEZ: Maize») y la `nota`; si no, la fila atribuye al maíz forrajero un rendimiento de grano |
| «Winter cereal …» | es la avena de GAEZ («Oat») | «Winter cereal · GAEZ: Oat» |

Ninguna de estas lecturas necesita reentrega: todo está en `gaez_zona.csv` (9,049 bytes, sha256
9a4a04678ac5b04409ac6a924bde53ddbb4769965c9406126d8c3b847372f5e0, el de Drive).

## 15-nov 01:07 — Para «Revisión multiagente»: parche probado de lo anterior (opcional; `motor/` y `web/` son tuyos)
`datos/parches/2026-11-15_gaez_lectura_y_no_suelo.patch` (16,455 bytes, sha256
63ea4d4f38966ad20622d82ac621afb6d48fd49dd4156eb8a7f824b080dedb29). `git apply --check` limpio sobre 85a8939. Toca 6 archivos:
- `motor/contexto_web.py`: `bloque_gaez` pasa `clase_nombre`, `cultivo_gaez` y `nota` (constante `COLUMNAS_TEXTO_GAEZ`) solo
  cuando traen texto; la fixture de prueba no los trae, así que `contexto_lleno.json` no cambia.
- `motor/suelo_web.py`: `NO_SUELO = ("zona_urbana", "cuerpo_de_agua")`; quedan fuera de la lista sin aviso, y cualquier otra
  llave que no sea un grupo WRB sigue avisando.
- `web/js/contexto.js`: tres funciones puras exportadas (`valorGaez`, `cultivoDeGaez`, `notasDeGaez`) que usa
  `htmlTarjetaGaez`. Ninguna cifra escrita: el factor sale de la cadena de la unidad.
- Pruebas: 2 pytest (`test_gaez_lleva_los_textos_de_la_entrega_solo_si_vienen`,
  `test_zona_urbana_y_cuerpo_de_agua_no_son_suelo_ni_avisan`) y 2 node (una con datos de prueba y otra con
  `web/data/contexto.json`).

**Resultado sobre 85a8939 con mi buzón completo:** entraron 35, rechazados 0; el aviso «no son grupos de suelo» ya no sale;
CONTRATO, VERIFICADOR y `test_sin_cifras` OK; 1135 pytest y 225 node; `web_smoke` 747/747. La tarjeta queda así (Delicias–Saucillo):
«Alfalfa | … | 1,678.5 × 10 kg DW/ha», «… | High», «Forage maize GAEZ: Maize | … | 9,341 kg DW/ha», «Winter cereal GAEZ: Oat»,
y debajo de la fuente la nota del maíz de grano y «DW: dry weight.».

**Línea para `AI_USAGE.md`** (no la escribo en mi rama para no chocar con tus líneas al final de la tabla):
`| 2026-11-15 | Sesión de datos | Claude (en el navegador) y Claude Code | ECOSTRESS ECO_L3T_JET.002 por parcela vía AppEEARS
con la sesión de Earthdata de Cristian (E0 y E1: nube de la zona, fracción de luz del día y sobrevuelos; README de AppEEARS y
citas textuales); textos de las entregas en inglés; revisión cruzada de lo que muestra la página (suelo, GAEZ, GRACE) y parche
probado de la tarjeta de GAEZ | rama `datos-satelite`, Drive `Raiz_entregas`, `datos/PARA_INTEGRADOR.md` |`

## 15-nov 01:34 — Para «Revisión multiagente»: revisión cruzada de 1235e3d (lo que toca mis datos)
Recibido tu aviso de las 01:29. Revisé `1235e3d` en una copia limpia:
- **Buzón:** los 35 archivos de `data/processed/` tienen el mismo sha256 que lo entregado (incluidos los de v13).
- **Reconstrucción:** `python construir.py` sobre `1235e3d` pasa todo (1133 pytest y 1 omitida; 223 de Node; CONTRATO y
  VERIFICADOR OK). Lo único que cambia en `web/data/` son las marcas de tiempo: el commit se reproduce.
- **ECOSTRESS en la página:** `contexto.json` → `ecostress`, 14,868 celdas, 0 diferencias con el CSV de v13. El bloque lleva
  aún solo `et_mm_dia`, como dijiste (I1 a I3 en curso).
- **Cita de AppEEARS:** idéntica, carácter por carácter, a la sección 9 de los dos README de `data/raw/reto/`, en `README.md`,
  `DATA_LICENSE.md` y `docs/pitch/textos_envio.md`. La línea de `AI_USAGE.md` está (renglón 46).
- **GAEZ:** igual que en 85a8939; espero tu hash para revisar la tarjeta.

Dos detalles de redacción, menores:
1. `LIMITATIONS.md:99` dice «(… column `n_escenas`) … a field's value can rest on one or two scenes». Desde v13 `n_escenas`
   cuenta sobrevuelos: las escenas de un mismo paso cuentan como uno (`docs/ecostress.md`, regla 5). Propuesta: «column
   `n_escenas`, the number of clear overpasses» y «can rest on one or two overpasses». En v13, 1,482 de los 4,253 valores
   salen de uno o dos sobrevuelos (540 de uno y 942 de dos).
2. `docs/pitch/textos_envio.md:266`: después de la URL sigue «Used to request the ECOSTRESS point samples.» sin separador, y
   se lee como parte de la cita. Propuesta: poner el uso antes («Used to request the ECOSTRESS point samples: AppEEARS Team.
   (2026). …») y dejar la cita intacta.

## 15-nov 02:48 — Para «Revisión multiagente»: reentrega de `opciones_b3.json` y `suelo_reglas.json` (sin «Worst-case» ni «best») y revisión cruzada de 1edfe6e
Atiendo tus dos avisos (02:19 y 02:23). **Archivos en Drive** (sustituyen a los anteriores; el `opciones_b3.json` que
subí a las 02:25 ya también quedó sustituido):

| Archivo | Tamaño (bytes) | sha256 | Qué cambió |
|---|---|---|---|
| `opciones_b3.json` | 22,765 | eb0c8830b86f5e372fdac4be543835134e6f23201303bbeaa306763684217c95 | `descanso`: `por_que_en` y `fuente`; ventanas de siembra de alfalfa y algodón sin «best»; `_encabezado` dice ROOT |
| `suelo_reglas.json` | 19,228 | c2c8056d6030a66c54f5457f489fe923696dbae0e2174a60438f1f3fbbec1c2e | `textos_ficha_en.suelo`: `cerca_del_limite` y `sin_aviso_ph` sin «best» |
| `LEEME.md` | 17,183 | 6aba6acd28d1172f1867b27dd11bdfc32277639b372b4a4351db19bdf8241926 | fecha de esas dos líneas: 2026-11-15 |

**El motivo del descanso.** La fuente es la tabla del maestro, §5.2, renglón «E. Peor escenario»: «Sorgo con 1–2 auxilios; el
resto descansa con rastrojo en pie» | «Menos demanda; protege contra la erosión» | «Ingreso bajo». «Peor escenario» es el
escenario de agua, no un orden entre opciones. Texto nuevo:
> Intended for the worst water-supply scenario (option E of the master document): the field rests with standing stubble, which
> needs no irrigation and protects the soil against erosion. The master document lists low income as the risk of this option
> and gives no figure for it.

Corregí además «protects the soil from wind»: el maestro dice «contra la erosión», sin decir de qué tipo. «Needs no
irrigation» corresponde a la lámina cero del descanso en `rotaciones.json` (A5), y la `fuente` ya lo cita. El ingreso queda
como el riesgo que anota el maestro, sin cifra, y eso cuadra con Money «No verified data».

**Sin «best»:**
- Nutrientes (rangos de MSU, `disponibilidad_ph.grupos[].mas_disponible_entre`): «Near the edge of the pH range where they are
  more available: {nutrientes}.» y «At this estimated pH, no nutrient falls outside the pH range where it is more available.»
  (`docs/suelo_textos_ficha.md` al día).
- Ventanas de siembra, como las da el maestro: alfalfa «planting from Sep 15 to Oct 31» (el maestro dice «siembra del 15-sep
  al 31-oct», sin «best») y algodón «(optimal from Apr 20 to 30)» (el maestro: «óptima del 20 al 30-abr»). Busqué «best» en
  las 35 entregas y no queda ninguno.

**Pruebas:** `correr_todo.py` da 35 de 35 iguales a lo que hay hoy en Drive. Con 1edfe6e y mi buzón completo: entraron 35,
rechazados 0; CONTRATO y VERIFICADOR OK; 1181 pytest y 243 de Node; `web_smoke` 874/874. En `web/data/suelo.json` y en
`cubo.json` ya no queda ningún «best», y `cubo.json` → `opciones_catalogo.descanso.por_que_en` trae el texto nuevo.

**Revisión cruzada de la ficha (1edfe6e):**
- ECOSTRESS: en `contexto.json` → `ecostress` hay 14,868 celdas por cada una de las cuatro columnas (valor, sobrevuelos,
  mínimo y máximo), con 0 diferencias frente al CSV de v13. Coinciden P0757 «2.11 mm/day in Aug 2026, from 2 clear overpasses
  (1.57 to 2.66)», P0632 «0.66 … (0.14 to 1.17)» con su nota y L0175 2.75 (3 sobrevuelos, de 1.5 a 3.18).
- Nota «sin cultivo»: agosto es el último mes con dato de las 1,239 parcelas. La nota sale en los 16 `cereal_invierno` (el
  calendario del modelo siembra el 1-dic y dura 115 días) y en los 219 `barbecho` (su ACTUAL es el descanso), y no en las 118
  alfalfas ni en los 105 nogales. Cuadra con `cultivos_parcelas.csv`.
- El aviso a la vista es el tramo de mi línea de LEEME («satellite estimate at 70 m on clear days, not a field measurement»).
- GAEZ: como en el parche; `contexto.json` trae `clase_nombre`, `cultivo_gaez` y `nota`.

No hay más reentregas de mi lado antes del congelamiento.

## 15-nov 02:53 — Para «Revisión multiagente»: tu aviso de las 02:52 se cruzó con la nota de arriba
Los tres pendientes que listas («best pH range», «Worst-case option» y el `_encabezado` «Raíz» de `opciones_b3.json`) ya
están corregidos y reentregados desde las 02:47 (nota de las 02:48, con tamaños y sha256). Comparé `31e6d11` (igual a
`main`, `c5a9c25`) con lo entregado: 33 de 35 iguales; los dos distintos son justo `opciones_b3.json` (22,765 bytes,
eb0c8830…) y `suelo_reglas.json` (19,228 bytes, c2c8056d…), que siguen en Drive esperando tu buzón. De mi lado solo queda
abierto D4, ya escrito como límite.

## 15-nov 03:43 — Comprobado en `main` (`5394463`, PR #8)
Los 35 archivos de `data/processed/` tienen el mismo sha256 que lo que hay en Drive (buzón v14). `LIMITATIONS.md` ya dice que
`n_escenas` cuenta sobrevuelos, y en `docs/pitch/textos_envio.md` el uso va antes de la cita de AppEEARS, que sigue textual.
De mi lado solo queda D4, escrito como límite.

## 15-nov 06:43 — Revisión de las 6:40 sobre `main` (`084bb30`, PR #9). Nada que hacer antes del congelamiento
- **Buzón:** los 35 archivos de `data/processed/` son iguales a lo entregado (v14).
- **Tablero (`web/data/pronostico.json`):** cita por sha256 ocho archivos míos (`opciones_b3.json`, `suelo_requisitos.json`,
  `supuestos.json`, y `eto_diaria` y `rotaciones` de las dos zonas) y los ocho coinciden con lo entregado. Sus
  `rotaciones.*.lamina_bruta_millares` son las de A5 tal cual (alfalfa: P10, P50 y P90 de 23.13, 28.4 y 35.16; neta P50
  1,626 mm; ETc P50 1,748 mm).
- **Para después del evento:** `pronostico.json` calcula `heladas_primavera` con POWER 1992–2025 (34 años) y la misma
  definición que `heladas.json` → `prob_helada_despues_de`, que usa POWER 1984–2025 (42 años). Para el mismo día dan cifras
  distintas: helada después del 1-mar, 0.35 contra 0.38; después del 15-mar, 0.06 contra 0.10. Hoy la página no muestra
  `heladas_primavera` (solo está en los datos y en el manifiesto), así que no se contradice nada a la vista. Si un día se
  muestra, conviene usar una sola serie o decir el periodo de cada una.
- **Pendientes de mi lado, para después del evento:**
  - D4: comprobar la ubicación de las escenas de ECOSTRESS con su capa de calidad de geolocalización (hoy va como límite).
  - M19: la resolución de NASADEM.
  - Cambiar «Raíz» por «ROOT» en el encabezado de 35 scripts de `datos/` (28 de `colab`, 5 de `earthengine` y 2 de
    `navegador`). Solo es el comentario; ninguna salida cambia.

## 15-nov 06:59 — Revisión cruzada programada sobre la integración `6166757` (igual a `main` `c5f102a`, PR #10)
En una copia limpia, con mi buzón v14:
- **Construcción y pruebas:** `construir.py` entraron 35, rechazados 0; CONTRATO y VERIFICADOR OK; 1251 pytest (más 1
  omitida) y 278 de Node. `web_smoke` 878/878.
- **`web/data` contra mis archivos:**
  - ECOSTRESS (`contexto.json`): 14,868 celdas con valor, sobrevuelos, mínimo y máximo, sin diferencias.
  - GAEZ: 30 filas (valor, unidad, `clase_nombre`, `cultivo_gaez` y `nota`), sin diferencias.
  - Perfil de suelo (`suelo.json`): 12,390 celdas, sin diferencias.
  - Tipo de suelo: 1,239 de 1,239.
  - Nutrientes: 1,238 iguales. P0316 no tiene dato de suelo y la página dice «sin_dato», que es lo correcto.
- **README contra mis cifras:** todo cuadra.
  - SSEBop: modelo 1,139.5 mm contra 746.3 mm en los 12 meses de `et_contraste.csv`, +393.2 mm (+52.7 %, «+53 %»).
  - Alfalfa: ETc 1,748 mm y lámina P50 de 28.4 millares/ha (`rotaciones.json`).
  - GEDI: 1,072 de 1,239 parcelas con disparo.
  - Periodos: SMAP de 2015-04 a 2026-10 y GRACE de 2002-04 a 2024-10 (`contexto_regional.csv`).
  - Opciones: 103 alfalfas con corte de verano y 15 sin él, y 16 parcelas de cereal de invierno (`cubo.json` y
    `cultivos_parcelas.csv`).
  - Los párrafos de ECOSTRESS y GAEZ describen lo entregado y dejan la ubicación de las escenas como no comprobada.

Sin hallazgos nuevos. Los pendientes para después del evento siguen en la nota de las 06:43.
