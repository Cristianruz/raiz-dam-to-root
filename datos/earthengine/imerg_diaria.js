// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// Lluvia diaria GPM IMERG V07 (half-hourly, banda precipitation en mm/h) promediada sobre la zona piloto;
// lluvia_mm = media de las 48 medias horas del día (UTC) × 24. Tres exportaciones CSV a Drive (Raiz_entregas).
var zona = ee.Geometry.Rectangle([-105.42, 28.08, -105.32, 28.16]);
var col = ee.ImageCollection('NASA/GPM_L3/IMERG_V07').select('precipitation');
function tramo(ini, fin, nombre) {
  var n = ee.Date(fin).difference(ee.Date(ini), 'day');
  var dias = ee.List.sequence(0, n.subtract(1)).map(function (k) {
    var d0 = ee.Date(ini).advance(k, 'day');
    var del_dia = col.filterDate(d0, d0.advance(1, 'day'));
    var mm = ee.Algorithms.If(del_dia.size().gt(0),
      del_dia.mean().multiply(24).reduceRegion({reducer: ee.Reducer.mean(), geometry: zona, scale: 1000, bestEffort: true}).get('precipitation'),
      null);
    return ee.Feature(null, {fecha: d0.format('YYYY-MM-dd'), lluvia_mm: mm, n_medias_horas: del_dia.size()});
  });
  Export.table.toDrive({collection: ee.FeatureCollection(dias), description: nombre, folder: 'Raiz_entregas',
                        fileFormat: 'CSV', selectors: ['fecha', 'lluvia_mm', 'n_medias_horas']});
}
tramo('2001-01-01', '2009-01-01', 'imerg_2001_2008');
tramo('2009-01-01', '2017-01-01', 'imerg_2009_2016');
tramo('2017-01-01', '2026-11-14', 'imerg_2017_2026');
