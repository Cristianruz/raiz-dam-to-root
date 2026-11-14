// AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
// Extracción de Fields of The World para la zona piloto, desde la consola del navegador en una pestaña de
// source.coop (permite CORS y lecturas por rango). Lee solo los row groups cuyo bbox cruza la zona.
// Resultado (14-nov-2026): row groups 24 y 33 de Mexico.parquet (393 en total) → 1,176 polígonos.
// La salida se guarda como data/raw/ftw/ftw_zona_piloto_crudo.geojson; B1 la convierte en parcelas_base.geojson.
const hp = await import('https://cdn.jsdelivr.net/npm/hyparquet@1.17.1/+esm');
const hc = await import('https://cdn.jsdelivr.net/npm/hyparquet-compressors@1.1.1/+esm');   // ZSTD
const GT = await import('https://cdn.jsdelivr.net/npm/geotiff@2.1.3/+esm');
const fz = await import('https://cdn.jsdelivr.net/npm/fzstd@0.1.1/+esm');
const URL_ = 'https://data.source.coop/ftw/global-data/predictions/vectors/alpha/results-by-admin/admin:country_code=MX/Mexico.parquet';
const CONF = 'https://data.source.coop/ftw/global-data/predictions/confidence/confidence/prue_v1_confidence_global.tif';
const B = [-105.42, 28.08, -105.32, 28.16];
const size = +(await fetch(URL_, {method: 'HEAD'})).headers.get('content-length');
const file = {byteLength: size, slice: async (s, e) =>
  (await fetch(URL_, {headers: {Range: `bytes=${s}-${(e ?? size) - 1}`}})).arrayBuffer()};
const md = await hp.parquetMetadataAsync(file);
const st = (rg, n) => rg.columns.find(c => c.meta_data.path_in_schema.join('.') === n).meta_data.statistics;
let starts = [], acc = 0; md.row_groups.forEach(rg => { starts.push(acc); acc += Number(rg.num_rows); });
const hits = md.row_groups.map((rg, i) => i).filter(i => { const rg = md.row_groups[i];
  return st(rg, 'bbox.xmin').min <= B[2] && st(rg, 'bbox.xmax').max >= B[0] &&
         st(rg, 'bbox.ymin').min <= B[3] && st(rg, 'bbox.ymax').max >= B[1]; });
function wkb(u8) { const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); let o = 0;
  function rd() { const le = dv.getUint8(o) === 1; o += 1; const t = dv.getUint32(o, le) % 1000; o += 4;
    const ring = () => { const n = dv.getUint32(o, le); o += 4; const r = [];
      for (let k = 0; k < n; k++) { r.push([+dv.getFloat64(o, le).toFixed(6), +dv.getFloat64(o + 8, le).toFixed(6)]); o += 16; } return r; };
    if (t === 3) { const nr = dv.getUint32(o, le); o += 4; const rs = []; for (let k = 0; k < nr; k++) rs.push(ring()); return {type: 'Polygon', coordinates: rs}; }
    if (t === 6) { const np = dv.getUint32(o, le); o += 4; const ps = []; for (let k = 0; k < np; k++) ps.push(rd().coordinates); return {type: 'MultiPolygon', coordinates: ps}; }
    throw 'tipo ' + t; }
  return rd(); }
const features = [];
for (const i of hits) {
  const rows = await hp.parquetReadObjects({file, metadata: md, compressors: hc.compressors, utf8: false,
    columns: ['id', 'metrics:area', 'bbox', 'geometry'], rowStart: starts[i], rowEnd: starts[i] + Number(md.row_groups[i].num_rows)});
  rows.forEach(r => { const b = r.bbox;
    if (!(b.xmin <= B[2] && b.xmax >= B[0] && b.ymin <= B[3] && b.ymax >= B[1])) return;
    const id = r.id instanceof Uint8Array ? new TextDecoder().decode(r.id) : String(r.id);
    features.push({type: 'Feature', properties: {ftw_id: id, area_m2: Math.round(Number(r['metrics:area']))}, geometry: wkb(r.geometry)}); });
}
// Raster de confianza (COG con compresión ZSTD, 1/240°)
class Z extends GT.BaseDecoder { decodeBlock(b) { const o = fz.decompress(new Uint8Array(b)); return o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength); } }
GT.addDecoder(50000, () => Promise.resolve(Z));
const im = await (await GT.fromUrl(CONF)).getImage(); const res = 1 / 240;
const c0 = Math.floor((-105.44 + 180) / res), c1 = Math.ceil((-105.30 + 180) / res);
const r0 = Math.floor((84 - 28.18) / res), r1 = Math.ceil((84 - 28.06) / res);
const ras = await im.readRasters({window: [c0, r0, c1, r1]});
const salida = JSON.stringify({type: 'FeatureCollection',
  fuente: {vectores: URL_, row_groups: hits, confianza: CONF, extraido: new Date().toISOString(), bbox: B},
  confianza_raster: {origen_lon: -180 + c0 * res, origen_lat: 84 - r0 * res, res, w: ras.width, h: ras.height, nodata: -1,
                     valores: Array.from(ras[0]).map(x => +x.toFixed(4))},
  features});
// Guardar: copy(salida) en DevTools, o subirlo al repo en data/raw/ftw/.
