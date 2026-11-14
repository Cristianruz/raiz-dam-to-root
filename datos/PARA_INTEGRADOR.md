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
