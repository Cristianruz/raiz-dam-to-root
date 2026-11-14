<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Data licenses / Licencias de datos

The code of this repository is licensed under Apache 2.0 (`LICENSE`). Third-party data and libraries keep their own licenses:

| Data or library | Where it is used | License / attribution | Source of this statement |
|---|---|---|---|
| Fields of The World 2025 global predictions | `data/processed/parcelas_base.geojson`, field boundaries in the web | CC-BY-4.0 — "Field boundaries: Fields of The World (CC-BY-4.0)" | Kit v4, A4 and B1 |
| NASADEM (NASA/NASADEM_HGT/001) | Terrain and runoff layer | Public domain (NASA) | S9 §4 bis |
| NASA POWER, HLS (HLSL30/HLSS30 v002) | Climate, crop history, bare soil | NASA open data; cite each product as its provider indicates | `data/processed/fuentes.json` |
| OpenStreetMap base map tiles | Web base map | © OpenStreetMap contributors (shown on the map) | Map attribution |
| MapLibre GL JS 5.24.0, d3 7.9.0, d3-sankey 0.12.3 | `web/vendor/` | Their own licenses, copied next to each library | `web/vendor/VERSIONS.json` |
| Skills copied into `.claude/skills/` | Development only | Apache 2.0 or MIT, file next to each skill | `.claude/skills/README.md` |

No INEGI LiDAR data is used so far; if it is added, its license notice ("Fuente: INEGI, nombre del producto" and a transformation notice) goes here (S9 §4 bis).
