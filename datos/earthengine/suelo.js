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
