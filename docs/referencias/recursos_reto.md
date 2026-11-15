<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Recursos oficiales del reto «Field Shift: Adapting Farms with NASA Data»

**Origen:** https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/, pestañas Details y Resources.
- **Consulta:** la hizo la sesión del navegador el 14-nov-2026 a las 12:50.
- **Dónde está la copia:** en Drive, `Raiz_entregas/referencias/recursos_reto.md`.
- **Cuidado al citar:** el texto del reto va **resumido**. Para citarlo hay que copiarlo de la página.
- **Puede cambiar:** la página avisa que podrían añadirse recursos.

## El reto, resumido
- **Encargo:** «create a decision‑support tool that uses NASA Earth observations» (literal). Debe combinarse con suelo local, características de los cultivos y prioridades del agricultor para explorar rotaciones que mejoren la salud del suelo y adapten la parcela a condiciones cambiantes.
- **Qué pide:**
  - comparar al menos tres estrategias, incluida la actual;
  - para cada una, explicar por qué se sugiere, qué evidencia la sostiene, qué beneficios ofrece, dónde faltan datos y qué riesgos requieren revisión local.
- **Límite:** apoya y no sustituye el juicio del agricultor ni la experiencia local.
- **Consideraciones opcionales:**
  - condiciones y datos (ET, NDVI, riesgo de helada, balance de agua, satélite frente a medición en tierra);
  - IA, modelos y fusión (incertidumbre, validación local, malla común);
  - rotaciones (leguminosas, plagas, agua, raíz profunda);
  - mapas (líneas de tiempo, deslizadores de escenarios);
  - diseño para el agricultor (prioridades y restricciones).

## Recursos de la lista oficial y su cruce con Raíz (criterio de pertinencia)

| Dato en Raíz | ¿Está en la lista oficial? | Renglón de la lista |
|---|---|---|
| HLS v2 (Landsat 8/9 + Sentinel-2 armonizados) | Sí: Landsat y Copernicus Sentinel-2 (ESA). HLS es el producto de la NASA que los combina | Landsat; Copernicus Sentinel-2 |
| NASA POWER (clima diario, ETo) | Sí | NASA POWER |
| NASADEM (relieve, 30 m) | Sí: es SRTM reprocesado; la página admite «SRTM or other NASA elevation products» | SRTM |
| GPM IMERG V07 (lluvia diaria, tormenta) | Sí | GPM & IMERG |
| SSEBop VIIRS (ET regional, A8) | VIIRS sí; SSEBop es un producto de USGS sobre VIIRS | VIIRS |
| Fields of The World (límites de parcelas) | No; es un dato de terceros (CC-BY-4.0) | — |
| SIH/Conagua, SIAP, SDR Chihuahua | No; son datos oficiales locales de México | — |

Otros recursos de la lista que no usamos:
- SMAP, ECOSTRESS, MODIS, GRACE/GRACE‑FO, NLDAS/GLDAS, OpenET, GAEZ, GEDI;
- recursos de EE. UU. (USDA, NRCS, CDL, NAIP, NLCD, PRISM, NWIS, CoCoRaHS, AMS, NASS, LANDFIRE);
- ERA5 (ESA).

OpenET no cubre México (S9 §11).
