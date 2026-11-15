// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// A10 · Contexto regional de las bases del reto (decisión del 14-nov-2026, 15:30) y disparos de GEDI.
// Series mensuales por zona piloto: promedio sobre el rectángulo de la zona, ponderado por la fracción de cada celda
// que cae dentro (ee.Reducer.mean), en la malla nativa de cada producto. Son series REGIONALES, nunca por parcela.
// Se corrió el 14-nov-2026 en el proyecto iondroplet. Los productos horarios o trihorarios (SMAP, GLDAS, NLDAS) y GEDI
// salen como tablas a Drive (Raiz_entregas, prefijos ctx_ y gedi_disparos_); los demás, con evaluate().
// Los CSV crudos quedan en data/raw/reto/ y los convierte datos/colab/A10_contexto_regional.py.
var RZ = {delicias_saucillo: [-105.56, 28.07, -105.32, 28.19], lazaro_cardenas: [-105.66, 28.35, -105.56, 28.43]};

// col: colección; prep(im): deja solo las bandas pedidas; modo: 'mean' o 'sum' dentro del mes.
function serie(col, prep, bandas, modo, ini, fin) {
  var proj0 = prep(ee.Image(col.first())).select(0).projection();
  var n = ee.Date(fin).difference(ee.Date(ini), 'month').round();
  var red = ee.Reducer.mean().combine({reducer2: ee.Reducer.count(), sharedInputs: true});
  var feats = ee.List.sequence(0, n.subtract(1)).map(function (k) {
    var d0 = ee.Date(ini).advance(k, 'month'), d1 = d0.advance(1, 'month');
    var ims = col.filterDate(d0, d1).map(prep);
    var im = modo === 'sum' ? ims.sum() : ims.mean();
    return ee.List(Object.keys(RZ).map(function (z) {
      var d = im.reduceRegion({reducer: red, geometry: ee.Geometry.Rectangle(RZ[z], null, false), crs: proj0, maxPixels: 1e8});
      var props = {zona: z, mes: d0.format('YYYY-MM'), n_img: ims.size()};
      bandas.forEach(function (b) { props[b] = ee.Algorithms.If(d.contains(b + '_mean'), d.get(b + '_mean'), null); });
      props.n = ee.Algorithms.If(d.contains(bandas[0] + '_count'), d.get(bandas[0] + '_count'), null);
      return ee.Feature(null, props);
    }));
  }).flatten();
  return ee.FeatureCollection(feats);
}
function exporta(nombre, fc, cols) {
  Export.table.toDrive({collection: fc, description: nombre, folder: 'Raiz_entregas', fileNamePrefix: nombre,
                        fileFormat: 'CSV', selectors: cols});
}

// SMAP L4 v8 (9 km, cada 3 h): humedad superficial y de la zona de raíces, m3/m3
exporta('ctx_smap', serie(ee.ImageCollection('NASA/SMAP/SPL4SMGP/008'),
  function (im) { return im.select(['sm_surface', 'sm_rootzone']); }, ['sm_surface', 'sm_rootzone'], 'mean',
  '2015-04-01', '2026-11-01'), ['zona', 'mes', 'sm_surface', 'sm_rootzone', 'n', 'n_img']);

// GLDAS-2.1 Noah (0.25°, cada 3 h): Evap_tavg (kg/m2/s) y RootMoist_inst (kg/m2)
[['2000-01-01', '2009-01-01', 'a'], ['2009-01-01', '2018-01-01', 'b'], ['2018-01-01', '2026-11-01', 'c']].forEach(function (t) {
  exporta('ctx_gldas_' + t[2], serie(ee.ImageCollection('NASA/GLDAS/V021/NOAH/G025/T3H'),
    function (im) { return im.select(['Evap_tavg', 'RootMoist_inst']); }, ['Evap_tavg', 'RootMoist_inst'], 'mean', t[0], t[1]),
    ['zona', 'mes', 'Evap_tavg', 'RootMoist_inst', 'n', 'n_img']);
});

// NLDAS-2 forzamiento (0.125°, horario): total_precipitation y potential_evaporation (kg/m2 por hora; suma del mes)
[['2000-01-01', '2005-01-01', 'a'], ['2005-01-01', '2010-01-01', 'b'], ['2010-01-01', '2015-01-01', 'c'],
 ['2015-01-01', '2020-01-01', 'd'], ['2020-01-01', '2026-11-01', 'e']].forEach(function (t) {
  exporta('ctx_nldas_' + t[2], serie(ee.ImageCollection('NASA/NLDAS/FORA0125_H002'),
    function (im) { return im.select(['total_precipitation', 'potential_evaporation']); },
    ['total_precipitation', 'potential_evaporation'], 'sum', t[0], t[1]),
    ['zona', 'mes', 'total_precipitation', 'potential_evaporation', 'n', 'n_img']);
});

// MODIS colección 6.1. NDVI 250 m (compuestos de 16 días, SummaryQA 0 o 1); ET rellenada 500 m (tasa diaria del compuesto
// de 8 días; el último del año dura 5 o 6 días; los valores de relleno ≥ 32700 se enmascaran); LST diurna 1 km.
var ctx_modis_ndvi = serie(ee.ImageCollection('MODIS/061/MOD13Q1'), function (im) {
  return im.select('NDVI').updateMask(im.select('SummaryQA').lte(1)).multiply(0.0001).rename('v'); }, ['v'], 'mean', '2000-02-01', '2026-11-01');
var ctx_modis_et = serie(ee.ImageCollection('MODIS/061/MOD16A2GF'), function (im) {
  var d = im.date(); var dias = ee.Date.fromYMD(d.get('year').add(1), 1, 1).difference(d, 'day').min(8);
  var et = im.select('ET'); return et.updateMask(et.lt(32700)).multiply(0.1).divide(dias).toFloat().rename('v'); }, ['v'], 'mean', '2000-01-01', '2026-01-01');
var ctx_modis_lst = serie(ee.ImageCollection('MODIS/061/MOD11A2'), function (im) {
  return im.select('LST_Day_1km').multiply(0.02).subtract(273.15).rename('v'); }, ['v'], 'mean', '2000-02-01', '2026-11-01');

// GRACE y GRACE-FO, mascons de JPL con CRI (malla de 0.5° sobre mascons de 3°): el mes es el del punto medio de la solución
var grace = ee.ImageCollection('NASA/GRACE/MASS_GRIDS_V04/MASCON_CRI').map(function (im) {
  var m = ee.Number(im.get('system:time_start')).add(ee.Number(im.get('system:time_end'))).divide(2);
  return im.select(['lwe_thickness', 'uncertainty']).toFloat().set('system:time_start', m); });
var ctx_grace = serie(grace, function (im) { return im; }, ['lwe_thickness', 'uncertainty'], 'mean', '2002-04-01', '2024-11-01');

// ERA5-Land diario (ECMWF/Copernicus): media mensual de la mínima (°C) y días con mínima ≤ 0 °C (por celda; luego media de la zona)
var e5 = ee.ImageCollection('ECMWF/ERA5_LAND/DAILY_AGGR');
var ctx_era5_tmin = serie(e5, function (im) { return im.select('temperature_2m_min').subtract(273.15).rename('v'); }, ['v'], 'mean', '2000-01-01', '2026-11-01');
var ctx_era5_heladas = serie(e5, function (im) { return im.select('temperature_2m_min').lte(273.15).rename('v'); }, ['v'], 'sum', '2000-01-01', '2026-11-01');
print(ctx_modis_ndvi, ctx_modis_et, ctx_modis_lst, ctx_grace, ctx_era5_tmin, ctx_era5_heladas);

// GEDI L2A v2 rasterizado mensual (25 m): disparos con quality_flag = 1 y degrade_flag = 0 dentro de cada zona
Object.keys(RZ).forEach(function (z) {
  var g = ee.Geometry.Rectangle(RZ[z], null, false);
  var fc = ee.ImageCollection('LARSE/GEDI/GEDI02_A_002_MONTHLY').filterBounds(g).map(function (im) {
    var ok = im.select('quality_flag').eq(1).and(im.select('degrade_flag').eq(0));
    var s = im.select(['rh98', 'sensitivity', 'solar_elevation', 'beam']).updateMask(ok).addBands(ee.Image.pixelLonLat())
      .sample({region: g, projection: im.select('rh98').projection(), geometries: false, dropNulls: true});
    return s.map(function (f) { return f.set('mes', im.date().format('YYYY-MM'), 'zona', z); });
  }).flatten();
  exporta('gedi_disparos_' + z, fc, ['zona', 'mes', 'longitude', 'latitude', 'rh98', 'sensitivity', 'solar_elevation', 'beam']);
});
