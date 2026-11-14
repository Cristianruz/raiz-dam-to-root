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
- Borro la rama `revision/web-dos-zonas`, como indicas.
