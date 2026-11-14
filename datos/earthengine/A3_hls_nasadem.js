// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// Raíz – From Dam to Root · Los Norteados
// Script para el Code Editor de Google Earth Engine, proyecto de Cloud iondroplet (nivel Comunidad).
// Solo lo ejecuta Cristian (o la sesión de datos en su navegador).
//
// Exporta a Google Drive, carpeta "Raiz_entregas" (Drive no admite subcarpetas en el nombre
// de la exportación; el contenido se mueve a Raiz/entregas/ al bajarlo):
//   0. piloto_consumo           1 mes, 2 km × 2 km: medir el consumo de EECU antes de lo demás
//   1. hls_mensual_2025_10_a_2026_09        NDVI, LSWI, BSI y n por mes (×10,000, Int16)
//   2. hls_reflect_2025_10_a_2026_09        6 reflectancias medianas por mes (×10,000, Int16) para el Random Forest
//   3. hls_ndvi_memoria_AAAA                NDVI mensual de un año agrícola (oct–sep); una tarea por año,
//                                           empezando por 2025 (experimento natural) y luego 2026, 2024…2016
//   4. nasadem_zona_piloto                  elevación, zona + 2 km
// Orden: correr primero la tarea 0, anotar su consumo en docs/ee_uso.md y después las demás.
// Ahorro de cuota: solo la zona piloto; sin getInfo en ciclos.

// Dos zonas piloto (decisión del equipo, 14-nov 12:50); rectángulos de diseño [S]
var ZONAS = {
  delicias_saucillo: [-105.56, 28.07, -105.32, 28.19],
  lazaro_cardenas:   [-105.66, 28.35, -105.56, 28.43]
};
var PILOTOS = {lazaro_cardenas: [-105.61, 28.39], delicias_saucillo: [-105.45, 28.13]};
var CARPETA = 'Raiz_entregas';
var ESCALA = 30;
var CRS = 'EPSG:4326';
var REFL = ['azul', 'verde', 'rojo', 'nir', 'swir1', 'swir2'];

// HLS: renombrar ANTES de fusionar. NIR = B5 en L30 y B8A en S30.
var TODAS = ee.Geometry.Rectangle([-105.70, 28.03, -105.28, 28.47]);
var l30 = ee.ImageCollection('NASA/HLS/HLSL30/v002').filterBounds(TODAS)
  .select(['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'Fmask'], REFL.concat(['Fmask']));
var s30 = ee.ImageCollection('NASA/HLS/HLSS30/v002').filterBounds(TODAS)
  .select(['B2', 'B3', 'B4', 'B8A', 'B11', 'B12', 'Fmask'], REFL.concat(['Fmask']));

// Fmask por bits: 1 nube, 2 adyacente, 3 sombra, 4 nieve. El bit 5 (agua) no se enmascara.
function limpiar(img) {
  var f = img.select('Fmask');
  var malo = f.bitwiseAnd(1 << 1).neq(0).or(f.bitwiseAnd(1 << 2).neq(0))
    .or(f.bitwiseAnd(1 << 3).neq(0)).or(f.bitwiseAnd(1 << 4).neq(0));
  var r = img.select(REFL);
  var ndvi = r.normalizedDifference(['nir', 'rojo']).rename('ndvi');
  var lswi = r.normalizedDifference(['nir', 'swir1']).rename('lswi');
  var bsi = r.expression('((S + R) - (N + B)) / ((S + R) + (N + B))',
    {S: r.select('swir1'), R: r.select('rojo'), N: r.select('nir'), B: r.select('azul')}).rename('bsi');
  return r.addBands(ndvi).addBands(lswi).addBands(bsi).updateMask(malo.not())
    .copyProperties(img, ['system:time_start']);
}
var limpia = l30.merge(s30).map(limpiar);
var BANDAS = REFL.concat(['ndvi', 'lswi', 'bsi']);

// Mediana mensual; si el mes no tiene escenas, imagen enmascarada.
function mes(anio, m) {
  var ini = ee.Date.fromYMD(anio, m, 1);
  var c = limpia.filterDate(ini, ini.advance(1, 'month'));
  var vacia = ee.Image.constant([0, 0, 0, 0, 0, 0, 0, 0, 0]).rename(BANDAS).updateMask(0);
  return {
    med: ee.Image(ee.Algorithms.If(c.size().gt(0), c.select(BANDAS).median(), vacia)),
    n: ee.Image(ee.Algorithms.If(c.size().gt(0), c.select('ndvi').count(), ee.Image.constant(0))).rename('n'),
    tag: ee.String(ini.format('YYYY_MM'))
  };
}
function i16(img) { return img.multiply(10000).round().toInt16().unmask(-32768); }
function anioAgricola(ag) {                      // meses de oct (ag-1) a sep (ag)
  var l = [];
  for (var k = 0; k < 12; k++) { l.push(k < 3 ? [ag - 1, 10 + k] : [ag, k - 2]); }
  return l;
}

// 1 y 2) Año agrícola 2026
var indices = ee.Image([]), reflect = ee.Image([]);
anioAgricola(2026).forEach(function (am) {
  var r = mes(am[0], am[1]);
  indices = indices.addBands(i16(r.med.select(['ndvi', 'lswi', 'bsi']))
      .rename([r.tag.cat('_ndvi'), r.tag.cat('_lswi'), r.tag.cat('_bsi')]))
    .addBands(r.n.unmask(0).toInt16().rename(r.tag.cat('_n')));
  reflect = reflect.addBands(i16(r.med.select(REFL)).rename(REFL.map(function (b) { return r.tag.cat('_' + b); })));
});

// 3) Memoria: NDVI mensual por año agrícola
function memoria(ag) {
  var img = ee.Image([]);
  anioAgricola(ag).forEach(function (am) {
    var r = mes(am[0], am[1]);
    img = img.addBands(i16(r.med.select('ndvi')).rename(r.tag.cat('_ndvi')));
  });
  return img;
}

// 4) NASADEM
var DEM = ee.Image('NASA/NASADEM_HGT/001').select('elevation');

// Vista previa (para verificar que cada zona cae sobre parcelas de riego)
Map.setCenter(-105.5, 28.25, 10);
Map.addLayer(limpia.filterDate('2026-07-01', '2026-08-01').select('ndvi').median().clip(TODAS),
  {min: 0, max: 0.8, palette: ['#ccc682', '#91bf51', '#306d1c', '#004400']}, 'NDVI julio 2026');

function exportar(img, nombre, region) {
  Export.image.toDrive({image: img, description: nombre, folder: CARPETA, fileNamePrefix: nombre,
    region: region, scale: ESCALA, crs: CRS, maxPixels: 1e9, fileFormat: 'GeoTIFF'});
}
// Orden de tareas: piloto de la zona nueva primero; luego, por zona, mensual, reflectancias, memoria y NASADEM.
['lazaro_cardenas', 'delicias_saucillo'].forEach(function (z) {
  var ZONA = ee.Geometry.Rectangle(ZONAS[z]);
  Map.addLayer(ee.Image().paint(ZONA, 0, 2), {palette: ['red']}, z);
  exportar(indices.select('2026_07.*'), 'piloto_consumo_' + z, ee.Geometry.Point(PILOTOS[z]).buffer(1000).bounds());
  exportar(indices, 'hls_mensual_2025_10_a_2026_09_' + z, ZONA);
  exportar(reflect, 'hls_reflect_2025_10_a_2026_09_' + z, ZONA);
  [2025, 2026, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016].forEach(function (ag) {
    exportar(memoria(ag), 'hls_ndvi_memoria_' + ag + '_' + z, ZONA);
  });
  exportar(DEM.clip(ZONA.buffer(2000).bounds()), 'nasadem_' + z, ZONA.buffer(2000).bounds());
});
print('Tareas creadas. Primero corre piloto_consumo_lazaro_cardenas y anota su consumo de EECU.');
