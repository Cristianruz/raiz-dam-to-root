<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# H1-b · New test of the seasonal shape in earlier cycles (written and uploaded BEFORE running it)

English translation of [docs/h1b_especificacion.md](../h1b_especificacion.md); if they differ, the Spanish original prevails.

**Date and time:** 14-Nov-2026, 16:30 (Chihuahua time). The commit that introduces this file precedes that of the
script `datos/colab/A6b_forma_historica.py` and that of its results; the order can be checked in the git history.

## What it is and what it is not
- **It does not change H1.** H1 (preregistered) stays as it came out: *does not meet the preregistered criterion*
  (`docs/resultado_H1.md`). This test neither replaces nor corrects it.
- **It is a new hypothesis, born from the 2026 result** (post hoc): in 2026 the model failed in the **level** (it computed
  almost double the volume that left), but its "anchored" variant —the total set to the authorized volume, to compare
  just the **shape** within the cycle— came close to the press figure. A single year proves nothing. Here the question is
  whether that shape also describes the **earlier cycles**, which were not used to arrive at the idea.
- If it is not met, it is published anyway.

## Question
In the 1998–2024 cycles with dam delivery, does the fraction of the cycle volume that had already left La Boquilla
by 14 July resemble the one given by the demand model's shape more than that of the two simple shapes (linear and
ETo curve)?

## Definitions (fixed)
| # | Point | Decision |
|---|---|---|
| 1 | Years | 1998 to 2024, just those with output through La Boquilla's intake works from 14-Mar to 30-Sep of at least 100 hm³ (daily SIH series, `data/raw/sih/LBQCH.csv`). 2025 is left out (no delivery) and so is 2026 (it is the year that originated the idea) |
| 2 | Truth for each year | F_obs = cumulative output from 14-Mar to 14-Jul ÷ cumulative output from 14-Mar to 30-Sep (intake works, SIH; both endpoints included) |
| 3 | Model shape | F_mod = P50, over 10,000 runs, of cumulative demand to 14-Jul ÷ cumulative demand to 30-Sep, with the same chain as H1 (`A6_backtest.py`, unchanged: Kc, NASA POWER climatology 1991–2025, effective rainfall, efficiencies, pre-planting irrigation) |
| 4 | Crop pattern of each year | That of the most recent earlier cycle with dam delivery (Conagua statistics by crop), the same rule as in H1. That is why the earliest evaluable year is 1999 |
| 5 | Simple shapes | L1: linear in time (fraction of days elapsed). L1-s: climatological ETo curve (cumulative ETo to 14-Jul ÷ cumulative ETo to 30-Sep) |
| 6 | Error of each shape in a year | Absolute value of the difference from F_obs, in percentage points |

## Criterion (fixed)
H1-b holds if **both** conditions are met:
1. in **more than half** of the evaluated years, the model's error is lower than that of L1-s **and** lower than that of L1
   (both in the same year);
2. the **median** of the model's error across years is lower than the median error of L1-s and that of L1.

The per-year table, the count and the medians are reported. The sign test (binomial, p = 0.5) is reported solely as a
description: the years are not independent (same climatology, crop patterns that change slowly), so
significance is not discussed.

## Sensitivities that are reported and do not decide
- Crop pattern of the same year (instead of the earlier cycle).
- Cutoff on 13 May instead of 14 July.
- End of cycle on 31 October.
- Without the years with 10 or more days of zero output between 1-Apr and 31-Aug (possible gaps in the SIH series, like
  the 18 days with zero in March 2026).

## Disclosure
- When this was written the 2026 result was known, including the anchored variant (457.7 hm³ against 447.65 from the press
  and 296.31 from the SIH integral). 2026 is not part of this test.
- For the years 1998–2025 just the cycle totals had been computed (for the L2 baseline) and the fact that the series has no
  days without a record from 14-Mar to 30-Sep. **The fractions at 14 July for those years had not been computed or looked at.**
- Limits known in advance: the 1991–2025 climatology includes the evaluated years (it affects the model and
  L1-s equally); the SIH series may contain zeros that are gaps; the dam's output also responds to operating
  decisions (irrigation calendar, maintenance), not just to demand.
