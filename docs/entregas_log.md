<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Bitácora de entregas del buzón

Una línea por corrida de `motor/ensamblar.py` con buzón (kit v4, K-ENS paso 1). La escribe el
ensamblador: no se edita a mano. Columnas: hora local con zona horaria; buzón; carpeta de salida;
archivos que entraron con su rol (subcarpeta `entregas/<rol>/`; «—» si llegaron sueltos);
rechazados con su primer motivo; retenidos (esperan a `parcelas_base.geojson`).
Las corridas de prueba con `--salida` escriben su bitácora en esa carpeta, no aquí.

| hora | buzón | salida | entraron | rechazados | retenidos |
|---|---|---|---|---|---|
| 2026-11-14T17:28:16+00:00 | …/scratchpad/buzon_final | data/processed | 13: parcelas_base.geojson [—]; cultivos_parcelas.csv [—]; demanda_cultivos.csv [—]; eto_diaria.csv [—]; hls_mensual_parcelas.csv [—]; memoria_parcelas.csv [—]; memoria_resumen.csv [—]; nasadem_zona_piloto.tif [—]; relieve_meta.json [—]; relieve_parcelas.csv [—]; relieve_rutas.geojson [—]; rotaciones.json [—]; suelo_desnudo.csv [—] | 0 | 0 |
