<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# H1 · Especificación operativa del back-test (escrita y subida ANTES de correr el modelo)

**Fecha y hora:** 14-nov-2026, 14:11 (hora de Chihuahua; commit b9baced). El commit que introduce este archivo es anterior al commit
de `datos/colab/A6_backtest.py` y de `docs/resultado_H1.md`; el orden se puede comprobar en el historial de git.

**Por qué existe este archivo.** El texto del preregistro disponible en el repositorio de investigación
(`investigaciones/30_preregistro_H1.md`) deja varios puntos como [PENDING]. La sesión de datos no tuvo a la vista la
versión publicada. Para no decidir esos puntos después de ver el resultado, aquí se fijan todos, uno por uno, con la
opción que los documentos del equipo ya proponían antes del evento o, si no había ninguna, con la más simple.
**Si la versión publicada del preregistro fija algo distinto, prevalece la publicada** y este análisis se vuelve a
correr; lo que aquí se decide se reporta como desviación con fecha (sección 10 del preregistro).

**Lo que ya se conocía al escribir esto (divulgación):** las cifras de prensa (228.86 hm³ al 13-may y 447.65 hm³ al
14-jul) y la serie oficial del SIH (salida integrada de 296.31 hm³ al 14-jul; ver `docs/h1_verdad_sih.md`). El
modelo y las líneas base **no** se habían corrido.

## Puntos fijados
| # | Punto | Decisión | Origen |
|---|---|---|---|
| 1 | Verdad del punto principal (14-jul-2026) | 447.65 hm³ de prensa, rotulada "press-reported; equals the storage drop", porque la serie del SIH trae 18 días con cero en el periodo. La integral del SIH (296.31 hm³) se reporta al lado | Regla ya escrita en el preregistro (sección 4) y en el kit A6 |
| 2 | Volumen autorizado | La Boquilla 600 hm³; total 650 hm³. Sensibilidad: 500 hm³ | Preregistro, secciones 4 y 6 |
| 3 | Fin del ciclo | 30-sep-2026. Sensibilidad: 31-oct | S2 §1 (decisión D-28 del 30-oct) |
| 4 | Climatología | NASA POWER diario 1991–2025, media por día del año, punto 28.19 N, −105.45 O; ETo con FAO-56 | Especificación 33 (M11): «climatología 1991–2025 (propuesta)» |
| 5 | L1 | Total = autorizado × fracción histórica, repartido de forma lineal del 14-mar al 30-sep. **Fracción = 1.00**: no existe una serie pública de volúmenes autorizados por año, así que la fracción no se puede estimar. Sensibilidad: 1.15 = 529.14 ÷ 460 (2024, único año con autorización pública; ambas presas) | Preregistro, sección 6; serie de Conagua 1998–2025 |
| 6 | L1-s | El mismo total que L1, repartido con la curva climatológica de ETo | Preregistro, sección 6 |
| 7 | L2 | Ciclo con almacenamiento de La Boquilla al 14-mar más cercano al de 2026 (SIH, 1998–2024, solo años con entrega); su total es la salida por obra de toma del 14-mar al 30-sep de ese año (SIH), repartido con la curva de ETo | Preregistro, sección 6 |
| 8 | Superficie autorizada 2026 | No hay cifra oficial. Se deriva del volumen: 650 hm³ ÷ mediana de la lámina bruta histórica de la superficie regada con presas (volumen ÷ superficie, serie de Conagua 1998–2024, todos los años con entrega) | Preregistro, sección 5 («crop areas are scaled to the 2026 authorized area, which itself follows from the authorized volume»); regla operativa nueva |
| 9 | Patrón de cultivos | Proporciones por cultivo del DR-005 en el año agrícola 2023-24 (Conagua, «Estadísticas agrícolas por cultivo 1998–2025», publicado el 28-nov-2025): último ciclo publicado con entrega de las presas. Sensibilidad: 2024-25 (último publicado; sin entrega de presas, solo alfalfa y nogal con pozos) y 2016-17 | Preregistro, sección 4 |
| 10 | Cultivos del modelo | Alfalfa, nogal, maíz forrajero, chile y algodón con los Kc y etapas de `A5_demanda_plazo.py`. Al resto de la superficie se le asigna la lámina media, ponderada por superficie, de las anuales modeladas | Supuesto [S] |
| 11 | Cadena diaria | Desde el 14-mar: ETc = Kc × ETo climatológica × (1 + sesgo); lluvia efectiva «dependable rain» sobre la lluvia mensual climatológica; neta mensual = max(ETc − Peff, 0), repartida en el mes en proporción a la ETc diaria; bruta en parcela = neta ÷ Ea + presiembra de las anuales sembradas a partir del 14-mar (en los 10 días previos a la siembra); en presa = ÷ Ec; parte de La Boquilla = 600 ÷ 650 | Preregistro, sección 5 |
| 12 | Monte Carlo | 10,000 corridas: sesgo de ETo U(−0.10, 0); Ea U(0.45, 0.70) [S, `supuestos.json`]; Ec U(0.470, 0.681) (IMTA); presiembra U(150, 200) mm. **No aplicado:** sorteo de Kc y fracción de lavado (el preregistro no fija sus rangos) | Preregistro, sección 5 |
| 13 | Estimación | P50; intervalo P10–P90 | Preregistro, sección 5 |
| 14 | Calibración contra años previos | No se hace | Preregistro, sección 5 (opcional) |

## Criterio (sin cambios)
H1 se sostiene si, en el punto principal (14-jul-2026), |error del modelo| < |error de L1-s| **y** |error del
modelo| < |error de L1|. El punto del 13-may es de consistencia y no decide. Se reportan error absoluto,
skill = 1 − |error modelo| ÷ |error línea base| y si la verdad cae dentro de P10–P90. Con un solo ciclo no se habla de
exactitud ni de significancia.

## Sensibilidades que se reportan y no deciden
Autorizado de 500 hm³; fracción de L1 de 1.15; fin de ciclo el 31-oct; patrón 2024-25 y 2016-17; verdad con la
integral del SIH; y la variante «anclada» (total del modelo igual al total de L1, para comparar solo la forma).
