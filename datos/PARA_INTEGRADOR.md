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

## 14-nov 15:50 — Avance
- **ENTREGA: heladas.json — prueba OK** (tu ensamblador: 23 entraron, 0 rechazados). NASA POWER, T2M_MIN, 1984–2025 (42 años completos).
  Última helada de primavera: p10 30-ene, p50 22-feb, p90 10-mar. Primera de otoño: p10 14-nov, p50 30-nov, p90 17-dic
  (6 de 42 años sin helada de otoño). Probabilidad de helada después del 1-feb: 0.857; del 1-mar: 0.381; del 5-abr: 0.
  El archivo trae además el bloque `zonas.lazaro_cardenas` con lo mismo para la otra celda de POWER, y `estacion_smn` = «not run».
  Control del kit (INEGI 1983: marzo y noviembre): la celda de POWER da la última helada a fines de febrero, algo antes.
- **contexto_regional.csv:** colecciones confirmadas en el catálogo (todas existen con esas bandas). Ya están en
  `data/raw/reto/` MODIS (3), GRACE y ERA5-Land. SMAP, GLDAS y NLDAS van por exportación en lote: 6 de 9 tareas
  terminadas a las 15:50. El archivo completo sale cuando acaben (estimo 16:30).
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
