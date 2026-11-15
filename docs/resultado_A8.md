<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# A8 · Contraste regional de ET (oct-2025 a sep-2026)

**Rótulo:** "regional comparison; not field-level validation". Script `datos/colab/A8_et_contraste.py`; datos `et_contraste.csv`.

| | Total oct-2025 a sep-2026 |
|---|---|
| ETc modelada (FAO-56 × ETo de POWER, cultivo actual de las parcelas clasificadas, ponderada por superficie) | 1,139 mm |
| SSEBop VIIRS v6 mensual (USGS; media del rectángulo de la zona piloto, celdas de ~1 km) | 746 mm |
| Diferencia | +393 mm (+53 %) |

Superficie con la que se pondera la ETc modelada: 2,005 ha clasificadas (nogal 871, alfalfa 584, barbecho 547 con
ETc 0, cereal de invierno 3). El rectángulo de SSEBop (~8,700 ha) incluye además las parcelas abstenidas, caminos,
canales, poblados y vegetación no agrícola.

**Por qué no son comparables uno a uno:** la ETc modelada es la demanda **potencial** del cultivo bien regado
(no ET medida); SSEBop es ET **actual** estimada por balance de energía y promedia todo el rectángulo. La mayor
diferencia está de marzo a junio (ETc 76–197 mm/mes frente a 49–93 mm/mes), cuando nogal y alfalfa demandan al
máximo; en invierno las dos series coinciden (21–37 mm/mes). Es coherente con riego deficitario o con superficie no
regada dentro del rectángulo, pero este contraste no permite separar las dos causas.

## Dos zonas piloto (post hoc, 14-nov-2026)
El 14-nov a las 12:50 el equipo cambió la zona piloto a dos rectángulos. El contraste de arriba (rectángulo original)
es el que alimenta `et_contraste.csv` en la entrega; aquí se repite con el mismo script y la misma definición para las
dos zonas nuevas. SSEBop: `data/raw/ssebop/ssebop_<zona>_mensual.csv` (media del rectángulo de cada zona, celdas de
~1 km; 392 celdas en Delicias–Saucillo y 120 en Lázaro Cárdenas).

| Zona | ETc modelada | SSEBop | Diferencia | Superficie clasificada (ha) |
|---|---|---|---|---|
| Rectángulo original | 1,139 mm | 746 mm | +393 mm (+53 %) | 2,005: nogal 871, alfalfa 584, barbecho 547, cereal de invierno 3 |
| Delicias–Saucillo ampliada | 837 mm | 652 mm | +185 mm (+28 %) | 7,168: barbecho 3,021, alfalfa 1,909, nogal 1,538, cereal de invierno 700 |
| Lázaro Cárdenas | 590 mm | 574 mm | +16 mm (+3 %) | 1,272: barbecho 765, nogal 349, alfalfa 158 |

Por mes (mm; modelo / SSEBop):

| Mes | Delicias–Saucillo ampliada | Lázaro Cárdenas |
|---|---|---|
| 2025-10 | 36.4 / 49.8 | 16.9 / 50.5 |
| 2025-11 | 29.0 / 30.9 | 13.1 / 28.8 |
| 2025-12 | 27.8 / 20.4 | 11.1 / 16.2 |
| 2026-01 | 32.1 / 19.1 | 10.7 / 12.3 |
| 2026-02 | 43.5 / 28.9 | 13.7 / 18.7 |
| 2026-03 | 70.8 / 48.2 | 36.5 / 31.3 |
| 2026-04 | 94.8 / 63.1 | 73.2 / 54.5 |
| 2026-05 | 127.9 / 73.4 | 103.3 / 71.1 |
| 2026-06 | 114.4 / 78.3 | 97.0 / 76.3 |
| 2026-07 | 97.5 / 89.1 | 84.4 / 80.7 |
| 2026-08 | 104.0 / 88.4 | 87.8 / 76.0 |
| 2026-09 | 58.8 / 62.8 | 42.3 / 57.5 |

**Cómo leerlo.** La diferencia baja en las zonas nuevas sobre todo porque cambia la mezcla de superficie clasificada:
ahí el barbecho (al que el modelo le asigna ETc 0) pesa 42 % y 60 % de la superficie clasificada, frente a 27 % en el
rectángulo original. No es evidencia de que el modelo acierte más en esas zonas: la cercanía de los totales en Lázaro
Cárdenas viene de dos diferencias de signo contrario (el modelo queda por debajo de SSEBop de octubre a febrero, porque
no modela la evaporación del suelo sin cultivo ni la vegetación no agrícola, y por encima de marzo a agosto). El patrón
mensual es el mismo en las tres áreas: el modelo supera a SSEBop en los meses de mayor demanda. Sigue siendo una
comparación regional, no una validación por parcela.

- Unidades de SSEBop, confirmadas en la ficha del catálogo comunitario de Earth Engine
  (https://gee-community-catalog.org/projects/usgs_viirs/, consultada el 14-nov-2026): banda `et` = ETa en
  milímetros, factor de escala 1.0, malla de 1 km (1/96°). Cita: Senay, G.B., Kagone S., Velpuri N.M., 2020,
  Operational Global Actual Evapotranspiration using the SSEBop model. El catálogo comunitario lo mantiene la
  comunidad, no USGS; la serie la publica USGS (`projects/usgs-ssebop`).
- WaPOR v3: **not run** (sin acceso directo en Earth Engine sin una descarga pesada).
