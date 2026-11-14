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

| archivo | fuente | fecha | script |
|---|---|---|---|
| parcelas_base.geojson | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| eto_diaria.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| hls_mensual_parcelas.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| suelo_desnudo.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| relieve_parcelas.csv | Valores de prueba (fixture) | 2026-11-14 | tests/fixtures (a mano) |
| cultivos_parcelas.csv | Valores de prueba (fixture) | 14/11/2026 | tests/fixtures (a mano) |
| nasadem_zona_piloto.tif | Valores de prueba (fixture): TIFF sin etiquetas GeoTIFF | 2026-11-14 | tests/test_ensamblar.py --regenerar-tif |
