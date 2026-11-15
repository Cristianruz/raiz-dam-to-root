// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// Suelo de las dos zonas piloto con mapas globales de 250 m. Corrido el 14-nov-2026 en el proyecto iondroplet
// (consulta interactiva, sin exportación). Salida: data/raw/reto/suelo_soilgrids_<zona>.csv, una fila por celda.
// SoilGrids 2.0 (ISRIC, CC-BY 4.0): promedio ponderado de 0–30 cm en unidades del mapa. OpenLandMap: clase de textura.
var ZONAS = {delicias_saucillo: [-105.56, 28.07, -105.32, 28.19], lazaro_cardenas: [-105.66, 28.35, -105.56, 28.43]};
var props = ['sand', 'clay', 'silt', 'phh2o', 'soc', 'nitrogen', 'cec'];
function capa(p) {
  var im = ee.Image('projects/soilgrids-isric/' + p + '_mean');
  return im.select(p + '_0-5cm_mean').multiply(5).add(im.select(p + '_5-15cm_mean').multiply(10))
      .add(im.select(p + '_15-30cm_mean').multiply(15)).divide(30).rename(p);
}
var proj = ee.Image('projects/soilgrids-isric/sand_mean').projection();   // malla de 250 m de la copia de Earth Engine
var img = ee.Image.cat(props.map(capa))
    .addBands(ee.Image('OpenLandMap/SOL/SOL_TEXTURE-CLASS_USDA-TT_M/v02').select(['b0', 'b10', 'b30'])
        .rename(['olm_tex_0', 'olm_tex_10', 'olm_tex_30']))
    .addBands(ee.Image.pixelLonLat());
img = img.updateMask(img.mask().reduce(ee.Reducer.min()));               // misma máscara en todas las bandas
Object.keys(ZONAS).forEach(function (z) {
  var d = img.reduceRegion({reducer: ee.Reducer.toList(), geometry: ee.Geometry.Rectangle(ZONAS[z], null, false),
                            crs: proj, maxPixels: 1e7});
  print(z, d);                                                           // listas por banda: una posición = una celda
});

// --- Agregado el 14-nov-2026 (noche): tipo de suelo por celda para B8_tipo_suelo_parcelas.py ---------------------------
// Gran grupo de la Soil Taxonomy del USDA (OpenLandMap, 250 m, CC-BY-SA 4.0), banda grtgroup, en su malla nativa.
// Salida: data/raw/reto/suelo_clases_<zona>.csv (zona, longitude, latitude, grtgroup).
var olm = ee.Image('OpenLandMap/SOL/SOL_GRTGROUP_USDA-SOILTAX_C/v01').select('grtgroup');
Object.keys(ZONAS).forEach(function (z) {
  print(z, olm.addBands(ee.Image.pixelLonLat()).updateMask(olm.mask()).reduceRegion({
    reducer: ee.Reducer.toList(), geometry: ee.Geometry.Rectangle(ZONAS[z], null, false), crs: olm.projection(), maxPixels: 1e7}));
});
// HWSD v2 (projects/sat-io/open-datasets/FAO/HWSD_V2_SMU, ~1 km) también se consultó: en las zonas aparecen tres unidades
// (HWSD2_ID 18165, 18198 y 7001), pero sus bandas WRB4, WRB2_CODE y FAO90 son códigos numéricos sin tabla publicada en el
// catálogo comunitario: no se pueden traducir a nombres sin la base de HWSD v2 (descarga aparte). No se entrega.
