*AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026*

# Limitations

Declared limitations of Raíz – From Dam to Root (S9 §11, with the related assumptions of S9 §4 bis, §5 and §12 and S8). Labels: **[V]** verified in a primary source · **[P]** press or secondary source · **[S]** declared assumption · **[NE]** not found.

## What the tool does not do

- **It does not allocate, sell or trade water** (art. 22 of Mexico's National Water Law). It shows how much water each option asks for and for how long; the allocation and the authorized area are decided by Conagua and the irrigation modules.
- **It does not forecast the dam.** The user picks the allocation with a slider; its three marks are published figures [P], not predictions.
- **It does not promise water savings.** "Follow the drop" counts consumption (ET), not just withdrawals: drip irrigation can reduce dam withdrawals and, at the same time, reduce aquifer recharge. Drip is recommended solely with a consumption cap (district ET at or below its historical level).
- **It does not replace the farmer or the technician.** It supports, never replaces, their judgment; every field sheet carries that notice.

## Data and method

- **Field boundaries are estimated** (Fields of The World 2025 global predictions, used outside their training domain and filtered by confidence).
- **The crop map is validated against photo-interpretation, not against field visits.** Fields where the map is unsure are shown as "not classified" and excluded from the perennial total, so the committed-water indicator becomes a minimum ("at least").
- **OpenET does not cover Mexico yet.** Crop water need is modeled with FAO-56 and NASA POWER and contrasted with SSEBop VIIRS and WaPOR v3 at zone scale, never per field.
- **Where the "millar" is measured:** assumed at the field intake [S]; to be confirmed with a module technician. The allocation marks are press figures [P], pending confirmation.
- **Field (on-farm) efficiency has not been measured for DR-005.** It enters as a declared range; the P10–P90 band carries that uncertainty. [PENDING: range and source]
- **Pecan term:** a 10-year calculation horizon [S], not the life of the orchard; the orchard life will be cited from INIFAP before it is published.
- **Field memory** is a rule-based reading of monthly greenness (NDVI threshold 0.40, sensitivity 0.35–0.45 [S]), not a crop census. Without memory, stand age is "not available" and every alfalfa field is shown as committed.
- **Relief and storm:** NASADEM at 30 m is used at zone scale, not per field (gravity-irrigated fields are leveled). "Simulate a storm" is illustrative: no hydrograph, no depths, no earthworks or drain design.
- **Aquifer figure:** the availability of −167.12 hm³/year is Conagua's official deficit [V], not a measured loss.
- **Back-test truth** is the outflow at La Boquilla's intake works (SIH), which is not the same as the delivery at the field (S8, decision 7).
- **H3 survivorship:** orchards are identified in 2026, so orchards removed before 2026 are not observed; the number of fields in each group is published.
- **Pilot area:** a rectangle agreed by the team [S]; the module boundary is not public [NE]. With few fields, shares rest on few fields.

## Current data are SIMULATED

- As of Nov 14, 2026 the web reads simulated data: `web/data/cubo.json`, `parcelas.geojson` and `explicaciones.json` carry `"mock": true`.
- The three featured fields are synthetic squares inside the pilot rectangle. Their water depths imitate the order of magnitude of the INIFAP figures cited in S9 §5 (alfalfa, cotton, forage maize); the pecan value is a placeholder without a source. **They are not data.**
- Every simulated figure is listed in `web/data/manifest.json` with `"mock": true` and the script that produced it (`motor/simulados.py`).
- `motor/ensamblar.py` replaces each field as soon as its validated delivery arrives. [PENDING]
- Hectares covered, traffic lights and committed water shown with simulated data illustrate the method; they are not results.
