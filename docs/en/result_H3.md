<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# H3 result · 2025 natural experiment

English translation of [docs/resultado_H3.md](../resultado_H3.md); if they differ, the Spanish original prevails.

**H3 not supported.** Criterion (a) is not met; (b) is. Result as obtained, with the preregistered criterion
(S9, Annex B) unchanged. Script: `datos/colab/A7_h3.py`; data: `h3_series.csv`, `h3_resultado.json`.

| | Group | n | Median 2019–2024 | 2025 | Difference | Criterion | Met? |
|---|---|---|---|---|---|---|---|
| (a) | Annual fields | 184 | 84.2% | 82.6% | -1.6 pp | ≤ −25 pp | **no** |
| (b) | Pecan orchards (2026 map) | 44 | 100.0% | 100.0% | 0.0 pp | ±10 pp | **yes** |

Indicator: share of the group with a monthly maximum NDVI for Jun–Sep ≥ 0.40 (HLS v2). No field was left without
data in the summer window in 2019–2026.

## Sensitivity (does not replace the main result)
| NDVI threshold | (a) difference | (a) met | (b) difference | (b) met | H3 |
|---|---|---|---|---|---|
| 0.40 (main) | -1.6 pp | no | 0.0 pp | yes | not supported |
| 0.35 | -0.3 pp | no | 0.0 pp | yes | not supported |
| 0.45 | -6.8 pp | no | 0.0 pp | yes | not supported |

## Descriptive controls (do not decide H3)
- **Alfalfa** (perennial in 2024, not pecan; n = 110): share with active summer 2025 = 99.1% (2019–2024 between 97 % and 100 %).
- **Survivorship bias:** 21 fields with a summer pattern and no winter crop in all the years 2019–2024 do not come out as pecan in 2026; their share in 2025 = 95.2%.
- **2026:** the annuals fall to 66.9 % (outside the criterion; year with a partial allocation).

## Additional analysis in the new zones (post hoc; does not replace the registered result)

**Declared deviation:** on 14-Nov at 12:50 the team changed the pilot zone to two rectangles, **after**
knowing the result above. According to the preregistration's deviation policy, the registered analysis (original
rectangle, 338 fields) stays as the main result and that of the new zones is reported alongside, with the same
criterion and the same thresholds. Script and criterion identical; just the fields change. Figures recalculated on 14-Nov at 14:20, after correcting the overlap of 6 pairs of fields in the output geometry (the verdicts do not change).

| Zone | Annual fields | Median 2019–2024 | 2025 | (a) difference | Pecan (n) | (b) difference | H3 | Sensitivity 0.35 / 0.45 (a) |
|---|---|---|---|---|---|---|---|---|
| Delicias–Saucillo expanded | 580 | 79.5% | 63.4% | -16.0 pp | 79 | 0.0 pp | not supported | -12.8 / -20.9 pp |
| Lázaro Cárdenas | 210 | 82.4% | 82.4% | 0.0 pp | 26 | 0.0 pp | not supported | 4.0 / -4.0 pp |

Series of the annual fields (share with active summer, threshold 0.40):

| Zone | 2019 | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|---|---|---|
| Delicias–Saucillo expanded | 82% | 84% | 77% | 91% | 77% | 76% | 63% | 59% |
| Lázaro Cárdenas | 84% | 84% | 79% | 87% | 81% | 68% | 82% | 54% |

Reading: in the expanded Delicias–Saucillo zone there is indeed a drop in 2025 (−16.0 points), but it does not reach the 25
points of the criterion; in Lázaro Cárdenas there is no drop. In all three areas the pecan held. H3 remains "not supported".

## Reading
In the pilot zone, the year without a dam allocation did not reduce the share of annual fields with summer greenness.
This is consistent with what the press reported —12,000 to 15,000 ha planted with wells in 2025— and with a substitution
of dam water by groundwater; the satellite data do not distinguish the source of the water. Other explanations that
cannot be ruled out with this design: greenness from weeds or monsoon rains (Jul–Sep) reaching NDVI 0.40 in
unirrigated fields, and that the pilot zone does not represent all of DR-005.

## Disclosure and limitations
- The press reported 12,000–15,000 ha planted with wells in 2025; no satellite series was computed before the registration.
- The orchards are identified in 2026: those removed earlier are not observed.
- Fields estimated by Fields of The World (not cadastre); crop map by rules.
- Label for the page: "H3 not supported (2025 natural experiment; pilot area, HLS v2)".
