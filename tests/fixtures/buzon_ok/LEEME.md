<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Buzón de PRUEBA (todo válido)

Fixture de `tests/test_ensamblar.py`. TODOS LOS VALORES SON DE PRUEBA: se escribieron para probar el
validador del buzón (`motor/ensamblar.py`); no son datos reales, no tienen fuente y no se usan en la web.
Imita el buzón de Drive `Raiz_entregas/`: cada archivo tiene su línea «archivo | fuente | fecha | script».
El GeoTIFF se genera con Pillow: `python tests/test_ensamblar.py --regenerar-tif`.
`hls_ndvi_memoria_2016.tif` imita un crudo de Earth Engine (texto, no un TIFF): no lleva línea aquí,
no se valida ni se copia; el ensamblador lo lista aparte como «crudo».

| archivo | fuente | fecha | script |
|---|---|---|---|
| parcelas_base.geojson | Valores de prueba (fixture): 3 parcelas rectangulares dentro de zona_piloto.bbox | 2026-11-14 | tests/fixtures (a mano) |
| eto_diaria.csv | Valores de prueba (fixture): 31 días con un -999 en ws2m, como el faltante de NASA POWER | 2026-11-14 | tests/fixtures (a mano) |
| hls_mensual_parcelas.csv | Valores de prueba (fixture): 2 meses, bandas NDVI, LSWI, rojo y NIR | 2026-11-14 | tests/fixtures (a mano) |
| suelo_desnudo.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| relieve_parcelas.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| relieve_rutas.geojson | Valores de prueba (fixture): 2 rutas | 2026-11-14 | tests/fixtures (a mano) |
| nasadem_zona_piloto.tif | Valores de prueba (fixture): malla de 1 arcosegundo en EPSG:4326 que cubre el rectángulo de delicias_saucillo (zona_piloto.zonas; sin sufijo = esa zona) | 2026-11-14 | tests/test_ensamblar.py --regenerar-tif |
| rotaciones.json | Valores de prueba (fixture): 3 rotaciones (perenne, anual y descanso sin cultivos) | 2026-11-14 | tests/fixtures (a mano) |
| demanda_cultivos.csv | Valores de prueba (fixture): 2 cultivos con lluvia 0 y -20 | 2026-11-14 | tests/fixtures (a mano) |
| memoria_parcelas.csv | Valores de prueba (fixture): incluye 90 días en 2024 (bisiesto) y celdas vacías | 2026-11-14 | tests/fixtures (a mano) |
| memoria_resumen.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| cultivos_parcelas.csv | Valores de prueba (fixture): «1/1 (reglas)» con prob_max vacío y una parcela abstenida | 2026-11-14 | tests/fixtures (a mano) |
| relieve_meta.json | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
