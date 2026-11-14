<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Buzón de PRUEBA (todo válido)

Fixture de `tests/test_ensamblar.py`. TODOS LOS VALORES SON DE PRUEBA: se escribieron para probar el
validador del buzón (`motor/ensamblar.py`); no son datos reales, no tienen fuente y no se usan en la web.
Imita el buzón de Drive `Raiz/entregas/`: cada archivo tiene su línea «archivo | fuente | fecha | script».
El GeoTIFF se genera con Pillow: `python tests/test_ensamblar.py --regenerar-tif`.

| archivo | fuente | fecha | script |
|---|---|---|---|
| parcelas_base.geojson | Valores de prueba (fixture): 3 parcelas rectangulares dentro de zona_piloto.bbox | 2026-11-14 | tests/fixtures (a mano) |
| eto_diaria.csv | Valores de prueba (fixture): 31 días con un -999 en ws2m, como el faltante de NASA POWER | 2026-11-14 | tests/fixtures (a mano) |
| hls_mensual_parcelas.csv | Valores de prueba (fixture): 2 meses, bandas NDVI, LSWI, rojo y NIR | 2026-11-14 | tests/fixtures (a mano) |
| suelo_desnudo.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| relieve_parcelas.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| relieve_rutas.geojson | Valores de prueba (fixture): 2 rutas | 2026-11-14 | tests/fixtures (a mano) |
| nasadem_zona_piloto.tif | Valores de prueba (fixture): malla de 1 arcosegundo en EPSG:4326 que cubre zona_piloto.bbox | 2026-11-14 | tests/test_ensamblar.py --regenerar-tif |
