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

- Unidades de SSEBop, confirmadas en la ficha del catálogo comunitario de Earth Engine
  (https://gee-community-catalog.org/projects/usgs_viirs/, consultada el 14-nov-2026): banda `et` = ETa en
  milímetros, factor de escala 1.0, malla de 1 km (1/96°). Cita: Senay, G.B., Kagone S., Velpuri N.M., 2020,
  Operational Global Actual Evapotranspiration using the SSEBop model. El catálogo comunitario lo mantiene la
  comunidad, no USGS; la serie la publica USGS (`projects/usgs-ssebop`).
- WaPOR v3: **not run** (sin acceso directo en Earth Engine sin una descarga pesada).
