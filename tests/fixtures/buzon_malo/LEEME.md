<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Buzón de PRUEBA (con errores a propósito)

Fixture de `tests/test_ensamblar.py`. TODOS LOS VALORES SON DE PRUEBA: no son datos reales ni se usan en la web.
`parcelas_base.geojson` es VÁLIDO a propósito (entra y sirve de referencia de ids). Cada uno de los demás
archivos trae UN error y debe rechazarse con su motivo:

- `eto_diaria.csv`: una fecha mal formada en los datos (2026/01/05).
- `hls_mensual_parcelas.csv`: NDVI fuera de [-1, 1].
- `suelo_desnudo.csv`: columna mal nombrada (dias_suelo_desnudo en lugar de dias_suelo_desnudo_feb_abr).
- `relieve_parcelas.csv`: un id que no existe en parcelas_base.geojson (T0999).
- `relieve_rutas.geojson`: contenido válido, pero SIN línea en este LEEME.md.
- `cultivos_parcelas.csv`: contenido válido, pero su fecha en este LEEME.md está mal formada.
- `nasadem_zona_piloto.tif`: TIFF sin georreferencia (sin etiquetas GeoTIFF).
- `rotaciones.json`: en R_PRUEBA_A, lluvia 0, p10 (13) > p50 (12).
- `demanda_cultivos.csv`: lluvia_pct = -10 (solo se admiten 0 y -20).
- `memoria_parcelas.csv`: estado «cultivado», fuera de la lista de estados de la memoria.
- `memoria_resumen.csv`: anios_con_dato = -1.
- `relieve_meta.json`: umbral_ruta_ha = 0 (debe ser mayor que 0).

`piloto_consumo.tif` imita un crudo de Earth Engine (texto, no un TIFF) y NO lleva línea aquí: no se
rechaza, no se copia; el ensamblador lo lista aparte como «crudo».

| archivo | fuente | fecha | script |
|---|---|---|---|
| parcelas_base.geojson | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| eto_diaria.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| hls_mensual_parcelas.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| suelo_desnudo.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| relieve_parcelas.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| cultivos_parcelas.csv | Valores de prueba (fixture) | 14/11/2026 | tests/fixtures (a mano) |
| nasadem_zona_piloto.tif | Valores de prueba (fixture): TIFF sin etiquetas GeoTIFF | 2026-11-14 | tests/test_ensamblar.py --regenerar-tif |
| rotaciones.json | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| demanda_cultivos.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| memoria_parcelas.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| memoria_resumen.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| relieve_meta.json | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
