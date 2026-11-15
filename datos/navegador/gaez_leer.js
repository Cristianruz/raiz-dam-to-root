// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// Lectura de GAEZ v4 (FAO e IIASA) en el centro de cada celda de 5' que toca cada zona piloto. Corrida el 14-nov-2026
// en la consola del navegador (cualquier página con permiso de red; el servicio de FAO acepta CORS), con el visto bueno
// de Cristian para usar GAEZ. Salida: data/raw/reto/gaez_celdas.csv, que procesa datos/colab/G1_gaez_zona.py.
// No descarga los .tif: pide al servicio de imágenes el valor de cada ráster en esos puntos (operación getSamples).
const base = 'https://gaez-services.fao.org/server/rest/services/res05/ImageServer';   // tema «Suitability and Attainable Yield»
const ZONAS = {delicias_saucillo: [-105.56, 28.07, -105.32, 28.19], lazaro_cardenas: [-105.66, 28.35, -105.56, 28.43]};
const CULTIVOS = ['Alfalfa', 'Cotton', 'Maize', 'Sorghum', 'Oat', 'Wheat', 'Barley'];
const where = `year='1981-2010' AND model='CRUTS32' AND input_level='High' AND crop IN (${CULTIVOS.map(c => `'${c}'`).join(',')}) ` +
              `AND water_supply IN ('Gravity Irrigation','Rainfed','Irrigation')`;
const cat = await (await fetch(base + '/query?' + new URLSearchParams({where, returnGeometry: 'false', resultRecordCount: 1000, f: 'json',
  outFields: 'objectid,name,variable,water_supply,crop,c02_fertilization,units,download_url,file_id,sub_theme_name'}))).json();
// Riego por gravedad (el del DR-005): clase de aptitud (sc), índice 0–10000 (su) y rendimiento alcanzable (yc), tierra cultivada actual.
const rasters = cat.features.map(f => f.attributes).filter(a => a.water_supply === 'Gravity Irrigation' && /^(sc|su|yc)Hg_/.test(a.name));
// Centros de celda de 5' (malla de 1/12° alineada en -180 y 90) que tocan cada rectángulo.
const d = 1 / 12, puntos = [];
for (const [z, [w, s, e, n]] of Object.entries(ZONAS))
  for (let i = Math.floor((w + 180) / d); i <= Math.floor((e + 180) / d - 1e-9); i++)
    for (let k = Math.floor((90 - n) / d); k <= Math.floor((90 - s) / d - 1e-9); k++) puntos.push([z, -180 + (i + 0.5) * d, 90 - (k + 0.5) * d]);
const geometry = JSON.stringify({points: puntos.map(p => [p[1], p[2]]), spatialReference: {wkid: 4326}});
const filas = ['zona,longitude,latitude,name,crop,variable,water_supply,input_level,year,model,units,objectid,file_id,download_url,value'];
const q = s => '"' + String(s).replace(/"/g, '""') + '"';
for (const a of rasters) {
  const j = await (await fetch(base + '/getSamples?' + new URLSearchParams({geometry, geometryType: 'esriGeometryMultipoint',
    mosaicRule: JSON.stringify({mosaicMethod: 'esriMosaicLockRaster', lockRasterIds: [a.objectid]}), returnFirstValueOnly: 'true', f: 'json'}))).json();
  // Nota: input_level, year y model quedaron vacíos en el crudo porque no se pidieron en outFields; los fija el «where»
  // de arriba y G1_gaez_zona.py los comprueba en la ruta del archivo (/CRUTS32/Hist/8110H/, nombre <var>Hg_<cultivo>).
  for (const s of j.samples) { const p = puntos[s.locationId];
    filas.push([p[0], p[1].toFixed(6), p[2].toFixed(6), a.name, a.crop, q(a.variable), q(a.water_supply), '', '', '', q(a.units),
                a.objectid, a.file_id, a.download_url, s.value].join(',')); }
}
console.log(filas.join('\n'));
