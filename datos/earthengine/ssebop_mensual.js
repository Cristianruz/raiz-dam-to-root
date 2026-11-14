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
