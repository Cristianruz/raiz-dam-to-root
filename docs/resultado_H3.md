<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Resultado de H3 · experimento natural de 2025

**H3 not supported.** El criterio (a) no se cumple; el (b) sí. Resultado tal como se obtuvo, con el criterio
preregistrado (S9, Anexo B) sin cambios. Script: `datos/colab/A7_h3.py`; datos: `h3_series.csv`, `h3_resultado.json`.

| | Grupo | n | Mediana 2019–2024 | 2025 | Diferencia | Criterio | ¿Cumple? |
|---|---|---|---|---|---|---|---|
| (a) | Parcelas anuales | 184 | 84.2% | 82.6% | -1.6 pp | ≤ −25 pp | **no** |
| (b) | Huertas de nogal (mapa 2026) | 44 | 100.0% | 100.0% | 0.0 pp | ±10 pp | **sí** |

Indicador: proporción del grupo con máximo NDVI mensual de jun–sep ≥ 0.40 (HLS v2). Ninguna parcela quedó sin
dato en la ventana de verano en 2019–2026.

## Sensibilidad (no sustituye al resultado principal)
| Umbral NDVI | (a) diferencia | (a) cumple | (b) diferencia | (b) cumple | H3 |
|---|---|---|---|---|---|
| 0.40 (principal) | -1.6 pp | no | 0.0 pp | sí | not supported |
| 0.35 | -0.3 pp | no | 0.0 pp | sí | not supported |
| 0.45 | -6.8 pp | no | 0.0 pp | sí | not supported |

## Controles descriptivos (no deciden H3)
- **Alfalfa** (perenne en 2024, no nogal; n = 110): proporción con verano activo 2025 = 99.1% (2019–2024 entre 97 % y 100 %).
- **Sesgo de supervivencia:** 21 parcelas con patrón de verano y sin cultivo de invierno en todos los años 2019–2024 no salen como nogal en 2026; su proporción en 2025 = 95.2%.
- **2026:** las anuales bajan a 66.9 % (fuera del criterio; año con dotación parcial).

## Análisis adicional en las zonas nuevas (post hoc; no sustituye al resultado registrado)

**Desviación declarada:** el 14-nov a las 12:50 el equipo cambió la zona piloto a dos rectángulos, **después** de
conocer el resultado de arriba. Según la política de desviaciones del preregistro, el análisis registrado (rectángulo
original, 338 parcelas) queda como resultado principal y el de las zonas nuevas se reporta al lado, con el mismo
criterio y los mismos umbrales. Script y criterio idénticos; cambian solo las parcelas.

| Zona | Parcelas anuales | Mediana 2019–2024 | 2025 | (a) diferencia | Nogal (n) | (b) diferencia | H3 | Sensibilidad 0.35 / 0.45 (a) |
|---|---|---|---|---|---|---|---|---|
| Delicias–Saucillo ampliada | 581 | 79.5% | 63.3% | -16.2 pp | 79 | 0.0 pp | not supported | -12.7 / -21.0 pp |
| Lázaro Cárdenas | 209 | 82.3% | 82.8% | 0.5 pp | 26 | 0.0 pp | not supported | 4.1 / -4.1 pp |

Serie de las parcelas anuales (proporción con verano activo, umbral 0.40):

| Zona | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|
| Delicias–Saucillo ampliada | 82% | 83% | 77% | 91% | 77% | 76% | 63% | 59% |
| Lázaro Cárdenas | 84% | 84% | 78% | 87% | 81% | 67% | 83% | 55% |

Lectura: en la zona ampliada de Delicias–Saucillo sí hay una baja en 2025 (−16.2 puntos), pero no alcanza los 25
puntos del criterio; en Lázaro Cárdenas no hay baja. En las tres áreas el nogal se mantuvo. H3 sigue «not supported».

## Lectura
En la zona piloto, el año sin dotación de la presa no redujo la proporción de parcelas anuales con verdor de verano.
Es coherente con lo que reportó la prensa —12,000 a 15,000 ha sembradas con pozos en 2025— y con una sustitución
del agua de presa por agua subterránea; el dato de satélite no distingue la fuente del agua. Otras explicaciones que
no se pueden descartar con este diseño: verdor de maleza o de lluvias de monzón (jul–sep) que alcance NDVI 0.40 en
parcelas sin riego, y que la zona piloto no represente a todo el DR-005.

## Divulgación y limitaciones
- La prensa reportó 12,000–15,000 ha sembradas con pozos en 2025; ninguna serie de satélite se calculó antes del registro.
- Las huertas se identifican en 2026: las retiradas antes no se observan.
- Parcelas estimadas por Fields of The World (no catastro); mapa de cultivos por reglas.
- Rótulo para la página: "H3 not supported (2025 natural experiment; pilot area, HLS v2)".
