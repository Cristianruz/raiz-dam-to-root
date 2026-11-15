<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# The model versus what is actually irrigated in DR-005

English translation of [docs/modelo_vs_practica.md](../modelo_vs_practica.md); if they differ, the Spanish original prevails.

**What this document is for.** H1 showed that the model computes about double the water that left the dam. This document
gathers everything known about the size and cause of that difference, using published data from **before 2026**, and
leaves a local reference in the data so the tool can show it. It does not change any verdict.

## 1. What the model computes and what is published for the region
Depth in millares per hectare (1 millar/ha = 10 cm). Delicias–Saucillo zone, rainfall unchanged.

| Crop | Model ETc (mm) | ET estimated in DR-005 (mm) | Model gross depth, P10–P90 | Recommended by INIFAP | Applied in DR-005, 2009–2016 | Model ÷ local reference |
|---|---|---|---|---|---|---|
| Alfalfa | 1748 | 1139 | 23.13–35.16 (P50 28.4) | 17.0–18.0 | 17.4 | 1.63 |
| Pecan | 1198 | 1413 | 15.38–23.71 (P50 19.1) | — | 13.7 | 1.39 |
| Chile | 765 | 825 | 12.15–17.15 (P50 14.26) | 9.2 | 16.1 | 0.89 |
| Cotton | 824 | — | 11.57–18.29 (P50 14.66) | 6.8 | — | 2.16 |
| Forage maize | 587 | — | 9.31–13.49 (P50 11.14) | 5.0–6.0 | — | 2.03 |

- "Applied" and "estimated ET": Villalobos-Cano et al. 2024 (*Sustainability* 16(5):1851), 2009–2016 means [V]. The
  article does not say at which point the applied water was measured, and it computes ET with Hargreaves, not with Penman-Monteith.
- "Recommended": INIFAP (Agenda Técnica de Chihuahua 2017; chile package PT-0003; Folleto Técnico 53 for forage maize) [V].
- The last column divides the model's P50 by the applied depth (or, where there is none, by the recommended one).
- All of these figures are in `datos/supuestos.json`, block `lamina_local_cm`, with their source.

## 2. What the table says
1. **The model is not "double" across the board.** For alfalfa it asks for 1.63 times what is applied and for pecan 1.39; against
   what INIFAP recommends, 2.2 times for cotton and 2.0 for forage maize. For chile it comes out **below** what is applied
   (0.89): there, growers apply 161 cm, far more than the 92 cm recommended.
2. **Alfalfa and pecan are 68 % of the area** of the crop pattern used in H1. That is why the model's excess in these
   two crops explains most of the H1 error.
3. **For alfalfa the difference comes from ET, not only from efficiency.** The model gives 1,748 mm of ETc (Penman-Monteith with
   NASA POWER, Kc 0.95 all year); the local study, 1,139 mm. The kit already set 1,100–1,700 mm as a control: the model sits
   at the high edge. With the same applied depth (174 cm), the average regional yield is 14 t of dry matter per
   hectare against 24 of potential (INIFAP): the district's alfalfa is not irrigated to its potential.
4. **Three independent contrasts point the same way:** the dam back-test (model ÷ observed = 2.0), the alfalfa
   depth (1.63) and satellite ET (model ETc ÷ SSEBop = 1.53 in the original rectangle). The model computes the
   **full requirement** of a well-irrigated crop; the district operates below that.

## 3. What was done with this
- **The model is left as it is** and labelled for what it is: full requirement (FAO-56), with its P10–P90 band.
- **The local reference is added to the data** (`supuestos.json` → `lamina_local_cm`) so the field card can show, next to
  the model's requirement, "what is usually applied here" and compute, with both, how many hectares the allocation covers.
  With 3.5 millares/ha, 10 ha of alfalfa are covered for 1.2 ha with the model's requirement and for 2.0 ha with the applied depth.
- **The field efficiency was not changed** (0.45–0.70 [S]). As a reference: with 0.60–0.70 (FAO gives 0.60 as an
  indicative value for surface irrigation) the alfalfa depth would fall from 28.4 to 25.1 millares/ha; this does not close the gap with
  what is applied (17.4), because that gap comes mostly from ET. Changing the range moves every figure in the
  tool and is a team decision.

## 4. What CANNOT be claimed
- That the model "gets the level right": it does not in alfalfa, pecan, cotton or forage maize.
- That the ET ÷ applied water ratio (65.6 % in alfalfa) is a measured field efficiency: the project's own file
  marks it only as a contrast.
- That it is known how much water each field applies: these are district averages for 2009–2016.
