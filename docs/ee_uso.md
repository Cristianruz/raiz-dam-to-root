<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Uso de Earth Engine · proyecto `iondroplet` (no comercial, nivel Comunidad, 150 EECU-h/mes)

| Fecha y hora (CST) | Tarea | Área | Uso | Nota |
|---|---|---|---|---|
| 2026-11-14 09:23 | `piloto_consumo` (ID LJ55RI7EY5NMNVRQRETUGFKV) | caja de 2 km, julio 2026, 4 índices | 1.8613 EECU-s, 2 min | Corrida piloto (kit §0.3) |
| 2026-11-14 ~09:30 | 14 tareas: `hls_mensual`, `hls_reflect`, `hls_ndvi_memoria_2025…2016`, `nasadem_zona_piloto` | zona piloto ~94 km² | pendiente de leer | Estimación por escala del piloto: < 1 EECU-h en total |

Proyección: la zona es ~24 veces el área del piloto; 12 meses × 10 bandas por año en el peor caso dan del orden
de 10³ EECU-s (< 1 % de la cuota). Se actualiza esta tabla con el uso real de cada tarea al terminar.
| 2026-11-14 ~12:40 | `imerg_2001_2008`, `imerg_2009_2016`, `imerg_2017_2026` (tablas) | rectángulo original | 152.1, 101.7 y 170.5 EECU-s | Lluvia diaria IMERG V07 |
| 2026-11-14 ~12:45 | `ssebop_zona_mensual2` (tabla) | rectángulo original | 0.13 EECU-s | A8 (el primer intento falló: 1.3 EECU-s) |
| 2026-11-14 12:52 | `piloto_consumo_lazaro_cardenas` | caja de 2 km, julio 2026 | 10 EECU-s | Piloto de la zona nueva (dos zonas) |
| 2026-11-14 13:00 | `hls_mensual…_lazaro_cardenas`, `hls_reflect…_lazaro_cardenas`, `hls_ndvi_memoria_2026_lazaro_cardenas` | Lázaro Cárdenas | 164, 196 y 64 EECU-s | Primeras tareas de la zona nueva; las otras 25 en cola |
| 2026-11-14 15:10–15:33 | `ctx_smap`, `ctx_gldas_a/b/c`, `ctx_nldas_a…e`, `gedi_disparos_<zona>` (tablas) | rectángulos de las dos zonas | 661; 315, 274 y 327; 562, 589, 709, ~760 y 689; 38 y 7 EECU-s (≈ 4,900 en total) | Contexto regional de las bases del reto y disparos de GEDI. MODIS, GRACE y ERA5-Land se leyeron con `evaluate()` (uso interactivo, no medido) |
