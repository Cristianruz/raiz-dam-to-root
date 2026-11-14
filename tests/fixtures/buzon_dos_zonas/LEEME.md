<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Buzón de PRUEBA con dos zonas (todo válido)

Fixture de `tests/test_ensamblar.py` para la decisión de dos zonas piloto
(`docs/decisiones/2026-11-14_dos_zonas.md`). TODOS LOS VALORES SON DE PRUEBA: se escribieron para
probar el validador del buzón (`motor/ensamblar.py`); no son datos reales, no tienen fuente y no se
usan en la web. Las coordenadas solo caen, a propósito, dentro del rectángulo de su zona en
`data/params.json` → `zona_piloto.zonas`.

- `parcelas_base.geojson`: 2 parcelas de `delicias_saucillo` (P…) y 2 de `lazaro_cardenas` (L…),
  cada una con la propiedad `zona`.
- `relieve_parcelas.csv` y `relieve_rutas.geojson`: un solo archivo con las dos zonas.
- Archivos con sufijo `_lazaro_cardenas`: copias de los de `tests/fixtures/buzon_ok/` (también de prueba).
- El GeoTIFF se genera con Pillow: `python tests/test_ensamblar.py --regenerar-tif`.

| archivo | fuente | fecha | script |
|---|---|---|---|
| parcelas_base.geojson | Valores de prueba (fixture): 4 parcelas cuadradas, 2 por zona, con «zona» | 2026-11-14 | tests/fixtures (a mano) |
| relieve_parcelas.csv | Valores de prueba (fixture): filas de las dos zonas | 2026-11-14 | tests/fixtures (a mano) |
| relieve_rutas.geojson | Valores de prueba (fixture): 1 ruta por zona, con «zona» | 2026-11-14 | tests/fixtures (a mano) |
| rotaciones_lazaro_cardenas.json | Valores de prueba (fixture): copia de buzon_ok/rotaciones.json | 2026-11-14 | tests/fixtures (a mano) |
| demanda_cultivos_lazaro_cardenas.csv | Valores de prueba (fixture): copia de buzon_ok/demanda_cultivos.csv | 2026-11-14 | tests/fixtures (a mano) |
| eto_diaria_lazaro_cardenas.csv | Valores de prueba (fixture): copia de buzon_ok/eto_diaria.csv | 2026-11-14 | tests/fixtures (a mano) |
| relieve_meta_lazaro_cardenas.json | Valores de prueba (fixture): copia de buzon_ok/relieve_meta.json | 2026-11-14 | tests/fixtures (a mano) |
| nasadem_zona_piloto_lazaro_cardenas.tif | Valores de prueba (fixture): malla de 1 arcosegundo en EPSG:4326 que cubre el rectángulo de lazaro_cardenas | 2026-11-14 | tests/test_ensamblar.py --regenerar-tif |
