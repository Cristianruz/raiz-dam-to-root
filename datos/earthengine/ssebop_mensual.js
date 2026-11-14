// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 · A8: ET regional SSEBop VIIRS v6 mensual, media sobre la zona piloto
var zona = ee.Geometry.Rectangle([-105.42, 28.08, -105.32, 28.16]);
var col = ee.ImageCollection('projects/usgs-ssebop/viirs_et_v6_monthly').filterDate('2024-10-01', '2026-10-01');
var serie = col.map(function (im) {
  var r = im.select('et').reduceRegion({reducer: ee.Reducer.mean(), geometry: zona, scale: 1000, bestEffort: true});
  return ee.Feature(null, {mes: im.date().format('YYYY-MM'), et_media: r.get('et'),
                           escala_m: im.select('et').projection().nominalScale()});
});
Export.table.toDrive({collection: serie, description: 'ssebop_zona_mensual2', folder: 'Raiz_entregas', fileFormat: 'CSV',
                      selectors: ['mes', 'et_media', 'escala_m']});

// Dos zonas piloto (decisión del 14-nov, 12:50). Misma colección, banda y escala; una fila por zona y mes.
// Se corrió el 14-nov-2026 con evaluate() desde el Code Editor (proyecto iondroplet) y el resultado se guardó en
// data/raw/ssebop/ssebop_<zona>_mensual.csv (mes, et_media, n_celdas, escala_m).
var zonas2 = {delicias_saucillo: [-105.56, 28.07, -105.32, 28.19], lazaro_cardenas: [-105.66, 28.35, -105.56, 28.43]};
var col2 = ee.ImageCollection('projects/usgs-ssebop/viirs_et_v6_monthly').filterDate('2025-10-01', '2026-10-01');
var series2 = ee.FeatureCollection(Object.keys(zonas2).map(function (z) {
  var g = ee.Geometry.Rectangle(zonas2[z]);
  return ee.FeatureCollection(col2.map(function (im) {
    var r = im.select('et').reduceRegion({reducer: ee.Reducer.mean().combine(ee.Reducer.count(), '', true),
                                          geometry: g, scale: 1000});
    return ee.Feature(null, {zona: z, mes: im.date().format('YYYY-MM'), et_media: r.get('et_mean'),
                             n_celdas: r.get('et_count'), escala_m: im.select('et').projection().nominalScale()});
  }));
})).flatten();
print(series2);
