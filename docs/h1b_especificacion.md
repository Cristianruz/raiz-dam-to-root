<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# H1-b · Prueba nueva de la forma estacional en ciclos anteriores (escrita y subida ANTES de correrla)

**Fecha y hora:** 14-nov-2026, 16:30 (hora de Chihuahua). El commit que introduce este archivo es anterior al del
script `datos/colab/A6b_forma_historica.py` y al de sus resultados; el orden se comprueba en el historial de git.

## Qué es y qué no es
- **No cambia H1.** H1 (preregistrada) queda como salió: *does not meet the preregistered criterion*
  (`docs/resultado_H1.md`). Esta prueba no la sustituye ni la corrige.
- **Es una hipótesis nueva, nacida del resultado de 2026** (post hoc): en 2026 el modelo falló en el **nivel** (calculó
  casi el doble del volumen que salió), pero su variante «anclada» —el total fijado al volumen autorizado, para comparar
  solo la **forma** dentro del ciclo— quedó cerca de la cifra de prensa. Un solo año no prueba nada. Aquí se pregunta
  si esa forma también describe los **ciclos anteriores**, que no se usaron para llegar a la idea.
- Si no se cumple, se publica igual.

## Pregunta
En los ciclos 1998–2024 con entrega de la presa, ¿la fracción del volumen del ciclo que ya había salido de La Boquilla
al 14 de julio se parece más a la que da la forma del modelo de demanda que a la de las dos formas simples (lineal y
curva de ETo)?

## Definiciones (fijas)
| # | Punto | Decisión |
|---|---|---|
| 1 | Años | 1998 a 2024, solo los que tengan salida por obra de toma de La Boquilla del 14-mar al 30-sep de al menos 100 hm³ (serie diaria del SIH, `data/raw/sih/LBQCH.csv`). 2025 queda fuera (sin entrega) y 2026 también (es el año que originó la idea) |
| 2 | Verdad de cada año | F_obs = salida acumulada del 14-mar al 14-jul ÷ salida acumulada del 14-mar al 30-sep (obra de toma, SIH; los dos extremos incluidos) |
| 3 | Forma del modelo | F_mod = P50, en 10,000 corridas, de demanda acumulada al 14-jul ÷ demanda acumulada al 30-sep, con la misma cadena de H1 (`A6_backtest.py`, sin cambios: Kc, climatología de NASA POWER 1991–2025, lluvia efectiva, eficiencias, presiembra) |
| 4 | Patrón de cultivos de cada año | El del ciclo anterior más reciente con entrega de las presas (estadística de Conagua por cultivo), la misma regla que en H1. Por eso el primer año evaluable es 1999 |
| 5 | Formas simples | L1: lineal en el tiempo (fracción de días transcurridos). L1-s: curva climatológica de ETo (ETo acumulada al 14-jul ÷ ETo acumulada al 30-sep) |
| 6 | Error de cada forma en un año | Valor absoluto de la diferencia con F_obs, en puntos porcentuales |

## Criterio (fijo)
H1-b se sostiene si se cumplen **las dos** condiciones:
1. en **más de la mitad** de los años evaluados, el error del modelo es menor que el de L1-s **y** menor que el de L1
   (las dos cosas en el mismo año);
2. la **mediana** del error del modelo entre años es menor que la mediana del error de L1-s y que la de L1.

Se reportan la tabla por año, el conteo y las medianas. La prueba de signos (binomial, p = 0.5) se reporta solo como
descripción: los años no son independientes (misma climatología, patrones de cultivo que cambian despacio), así que
no se habla de significancia.

## Sensibilidades que se reportan y no deciden
- Patrón de cultivos del mismo año (en vez del ciclo anterior).
- Corte al 13 de mayo en lugar del 14 de julio.
- Fin de ciclo el 31 de octubre.
- Sin los años con 10 o más días de salida cero entre el 1-abr y el 31-ago (posibles huecos de la serie del SIH, como
  los 18 días con cero de marzo de 2026).

## Divulgación
- Al escribir esto se conocía el resultado de 2026, incluida la variante anclada (457.7 hm³ frente a 447.65 de prensa
  y 296.31 de la integral del SIH). 2026 no entra en esta prueba.
- De los años 1998–2025 solo se habían calculado los totales del ciclo (para la línea base L2) y que la serie no tiene
  días sin registro del 14-mar al 30-sep. **Las fracciones al 14 de julio de esos años no se habían calculado ni mirado.**
- Límites conocidos de antemano: la climatología 1991–2025 incluye los años evaluados (afecta por igual al modelo y a
  L1-s); la serie del SIH puede traer ceros que sean huecos; la salida de la presa responde también a decisiones de
  operación (calendario de riegos, mantenimiento), no solo a la demanda.
