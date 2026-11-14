// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// Raíz – From Dam to Root · Los Norteados
// Script para el Code Editor de Google Earth Engine (code.earthengine.google.com)
// Proyecto de Cloud: iondroplet (nivel Comunidad). Solo lo ejecuta Cristian.
//
// Qué hace (piezas A3, A3-M y A9 del kit 40):
//   1. Compuestos MENSUALES de HLS v2 (Landsat 8/9 + Sentinel-2) del año agrícola
//      oct-2025 a sep-2026 sobre la zona piloto: NDVI, LSWI, BSI y número de
//      observaciones válidas. Sirve para el mapa de cultivos y el suelo desnudo.
//   2. NDVI mensual 2016–2026 (memoria de la parcela y experimento natural 2025).
//   3. Elevación NASADEM (30 m) de la zona piloto + 2 km (relieve y tormenta).
//
// Cómo usarlo:
//   a) Elige el proyecto "iondroplet" arriba a la derecha.
//   b) Pega todo este script y presiona Run. Revisa en el mapa que el rectángulo
//      rojo caiga sobre parcelas de riego (no sobre la ciudad). Si no, cambia ZONA.
//   c) En la pestaña Tasks aparecen 3 tareas: presiona Run en cada una.
//      Corren en los servidores de Google aunque cierres el navegador.
//   d) Los archivos caen en tu Google Drive, carpeta "Raiz_entregas".
//
// Ahorro de cuota: solo la zona piloto, una exportación por producto, sin getInfo.

// ---------------------------------------------------------------------------
// Parámetros (los mismos van en data/params.json)
// Zona piloto [supuesto]: rectángulo agrícola entre Delicias y Saucillo.
// Verificar visualmente antes de exportar.
var ZONA = ee.Geometry.Rectangle([-105.42, 28.08, -105.32, 28.16]);
var ZONA_DEM = ZONA.buffer(2000).bounds();   // + 2 km para el escurrimiento
var CARPETA = 'Raiz_entregas';
var ESCALA = 30;                                 // m, resolución de HLS
var CRS = 'EPSG:4326';

// ---------------------------------------------------------------------------
// HLS: armonizar nombres de bandas ANTES de fusionar las colecciones.
// NIR = B5 en L30 y B8A en S30 (no usar B8 ni B5 de S30).
var NOMBRES = ['azul', 'verde', 'rojo', 'nir', 'swir1', 'swir2', 'Fmask'];

var l30 = ee.ImageCollection('NASA/HLS/HLSL30/v002')
  .filterBounds(ZONA)
  .select(['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'Fmask'], NOMBRES);

var s30 = ee.ImageCollection('NASA/HLS/HLSS30/v002')
  .filterBounds(ZONA)
  .select(['B2', 'B3', 'B4', 'B8A', 'B11', 'B12', 'Fmask'], NOMBRES);

var hls = l30.merge(s30);

// Máscara Fmask por bits: 1 nube, 2 adyacente a nube, 3 sombra, 4 nieve.
// El bit 5 (agua) NO se enmascara: el riego por gravedad puede verse como agua.
function limpiar(img) {
  var f = img.select('Fmask');
  var malo = f.bitwiseAnd(1 << 1).neq(0)
    .or(f.bitwiseAnd(1 << 2).neq(0))
    .or(f.bitwiseAnd(1 << 3).neq(0))
    .or(f.bitwiseAnd(1 << 4).neq(0));
  var r = img.select(['azul', 'verde', 'rojo', 'nir', 'swir1', 'swir2']);
  var ndvi = r.normalizedDifference(['nir', 'rojo']).rename('ndvi');
  var lswi = r.normalizedDifference(['nir', 'swir1']).rename('lswi');
  var bsi = r.expression(
    '((S + R) - (N + B)) / ((S + R) + (N + B))',
    {S: r.select('swir1'), R: r.select('rojo'), N: r.select('nir'), B: r.select('azul')}
  ).rename('bsi');
  return ndvi.addBands(lswi).addBands(bsi)
    .updateMask(malo.not())
    .copyProperties(img, ['system:time_start']);
}

var limpia = hls.map(limpiar);

// Compuesto mensual (mediana) de un mes dado.
function mes(anio, m) {
  var ini = ee.Date.fromYMD(anio, m, 1);
  var fin = ini.advance(1, 'month');
  var c = limpia.filterDate(ini, fin);
  var etiqueta = ini.format('YYYY_MM');
  // Si un mes no tiene escenas, se usa una imagen enmascarada (evita errores).
  var vacia = ee.Image.constant([0, 0, 0]).rename(['ndvi', 'lswi', 'bsi']).updateMask(0);
  var med = ee.Image(ee.Algorithms.If(c.size().gt(0),
    c.select(['ndvi', 'lswi', 'bsi']).median(), vacia));
  var n = ee.Image(ee.Algorithms.If(c.size().gt(0),
    c.select('ndvi').count(), ee.Image.constant(0))).rename('n');
  return {med: med, n: n, etiqueta: etiqueta};
}

// ---------------------------------------------------------------------------
// 1) Año agrícola oct-2025 a sep-2026: NDVI, LSWI, BSI y n por mes
var meses2026 = [];
for (var i = 0; i < 12; i++) {
  var anio = (i < 3) ? 2025 : 2026;
  var m = (i < 3) ? 10 + i : i - 2;
  meses2026.push([anio, m]);
}

var pila2026 = ee.Image([]);
meses2026.forEach(function (am) {
  var r = mes(am[0], am[1]);
  var tag = ee.String(r.etiqueta);
  var bandas = r.med.multiply(10000).round().toInt16()   // índice × 10,000
    .rename([tag.cat('_ndvi'), tag.cat('_lswi'), tag.cat('_bsi')]);
  var n = r.n.unmask(0).toInt16().rename(tag.cat('_n'));
  pila2026 = pila2026.addBands(bandas.unmask(-32768)).addBands(n);
});

// ---------------------------------------------------------------------------
// 2) Memoria: NDVI mensual de oct-2015 a sep-2026 (años agrícolas 2016–2026)
var pilaMemoria = ee.Image([]);
for (var a = 2015; a <= 2026; a++) {
  for (var mm = 1; mm <= 12; mm++) {
    if (a === 2015 && mm < 10) continue;
    if (a === 2026 && mm > 9) continue;
    var rr = mes(a, mm);
    var t = ee.String(rr.etiqueta);
    pilaMemoria = pilaMemoria.addBands(
      rr.med.select('ndvi').multiply(10000).round().toInt16()
        .unmask(-32768).rename(t.cat('_ndvi')));
  }
}

// ---------------------------------------------------------------------------
// 3) NASADEM
var dem = ee.Image('NASA/NASADEM_HGT/001').select('elevation').clip(ZONA_DEM);

// ---------------------------------------------------------------------------
// Vista previa para revisar la zona (no gasta cuota de exportación)
Map.centerObject(ZONA, 12);
var vistaJul = limpia.filterDate('2026-07-01', '2026-08-01').select('ndvi').median();
Map.addLayer(vistaJul.clip(ZONA), {min: 0, max: 0.8, palette: ['#ccc682', '#91bf51', '#306d1c', '#004400']}, 'NDVI julio 2026');
Map.addLayer(ee.Image().paint(ZONA, 0, 2), {palette: ['red']}, 'Zona piloto');

// ---------------------------------------------------------------------------
// Exportaciones (aparecen en la pestaña Tasks; presionar Run en cada una)
Export.image.toDrive({
  image: pila2026,
  description: 'hls_mensual_2025_10_a_2026_09',
  folder: CARPETA,
  fileNamePrefix: 'hls_mensual_2025_10_a_2026_09',
  region: ZONA,
  scale: ESCALA,
  crs: CRS,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

Export.image.toDrive({
  image: pilaMemoria,
  description: 'hls_ndvi_memoria_2015_10_a_2026_09',
  folder: CARPETA,
  fileNamePrefix: 'hls_ndvi_memoria_2015_10_a_2026_09',
  region: ZONA,
  scale: ESCALA,
  crs: CRS,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

Export.image.toDrive({
  image: dem,
  description: 'nasadem_zona_piloto',
  folder: CARPETA,
  fileNamePrefix: 'nasadem_zona_piloto',
  region: ZONA_DEM,
  scale: ESCALA,
  crs: CRS,
  maxPixels: 1e9,
  fileFormat: 'GeoTIFF'
});

print('Listo. Revisa el mapa y luego presiona Run en las 3 tareas de la pestaña Tasks.');
print('Bandas del año agrícola 2026:', pila2026.bandNames().size());
print('Bandas de la memoria:', pilaMemoria.bandNames().size());
