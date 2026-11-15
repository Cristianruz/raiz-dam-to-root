<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Nogal: cobertura del dosel estimada con NDVI y edad de las huertas

> Análisis de referencia (A12, 14-nov-2026). No cambia el cálculo de la demanda ni ninguna cifra de la herramienta.
> Script: `datos/colab/A12_nogal_cobertura.py`. Salidas: `data/reto/nogal_cobertura.csv` (por parcela) y
> `data/reto/nogal_cobertura_resumen.json`. Resumen en `supuestos.json` → `nogal_referencia`.

## 1. Qué se quería saber
El modelo calcula el agua del nogal con el Kc de FAO-56 (Tabla 12, «Walnut orchard») ajustado por la cobertura del dosel
(FAO-56, Ec. 98). La cobertura era un supuesto: 0.7. El enfoque del proyecto (S8, decisión 5) pedía estimarla con NDVI y
mostrar el resultado como rango.

## 2. Método
- Parcelas: las 105 clasificadas como nogal en el mapa de cultivos de 2026 (79 en Delicias–Saucillo, 26 en Lázaro Cárdenas).
- NDVI: máximo de junio a septiembre de 2026 de la mediana mensual de cada parcela (NASA HLS).
- Cobertura = 1.26 × NDVI − 0.18, acotada a 0–1 (Johnson y Trout, 2012, *Remote Sensing* 4(2):439–455,
  DOI 10.3390/rs4020439, Ec. 1; r² = 0.96 con NDVI de Landsat en el Valle de San Joaquín).
- Kc de media temporada con la Ec. 98 de FAO-56, igual que en el modelo, antes del ajuste por clima.

## 3. Resultado
| | Parcelas | Cobertura estimada (P10 / P50 / P90) | Kc de media temporada (P10 / P50 / P90) |
|---|---|---|---|
| Delicias–Saucillo | 79 | 0.57 / 0.71 / 0.82 | 0.96 / 1.07 / 1.08 |
| Lázaro Cárdenas | 26 | 0.59 / 0.75 / 0.88 | 1.00 / 1.08 / 1.09 |
| Las dos zonas | 105 | 0.57 / 0.72 / 0.83 | 0.97 / 1.07 / 1.08 |
| Supuesto del modelo | — | 0.70 | 1.07 |

- El supuesto del modelo (0.7) queda en la mediana de lo estimado. Tres parcelas de 105 tienen cobertura estimada menor
  que 0.5 (huertas jóvenes o ralas, o parcelas mal clasificadas).
- Con árboles altos, la Ec. 98 hace que el Kc casi no cambie por encima de 0.67 de cobertura: por eso el rango del Kc es
  estrecho hacia arriba (1.07–1.09) y solo baja en las huertas con menos dosel.
- Efecto en la lámina bruta del nogal (P50, Delicias–Saucillo): 17.1 millares/ha con la cobertura del percentil 10,
  19.1 con la del modelo y 19.4 con la del percentil 90. Es un rango por cobertura; la banda del clima y de la
  eficiencia (P10–P90 del modelo) es aparte y más ancha.
- Altura: en 86 parcelas de nogal con 3 o más disparos de GEDI, el percentil 90 de la altura por parcela tiene mediana de
  7.2 m (P10–P90: 2.9–13.6 m). El modelo supone 10 m. Con 7 m el Kc de media temporada cambia en el segundo decimal.

## 4. Edad de las huertas
- **Lo que se observa:** 97 de las 105 parcelas muestran el patrón de huerta en los 11 años de la memoria de HLS
  (2016–2026): tienen al menos 11 años. La memoria no ve más atrás.
- **Lo que tiene fuente:**
  - Huertas encuestadas en 2014–2015 en la Comarca Lagunera, Jiménez (Chihuahua) y Hermosillo (Sonora): 27 años de edad
    en promedio (Orona Castillo et al., 2019, *Revista Mexicana de Ciencias Agrícolas* 10(8):1797–1808, revista del INIFAP).
  - Unidad típica de producción en Delicias: árboles con madurez de producción comercial, de 25 años de edad
    (López Díaz et al., 2011, *Revista Mexicana de Agronegocios* 29:720–731).
- **Lo que no se encontró:** una publicación del INIFAP que dé la vida de la huerta en años. No se publica una cifra.
  El horizonte de cálculo del nogal en la herramienta sigue siendo de 10 años [S], con la nota de que las huertas duran
  más; las dos fuentes anteriores respaldan esa nota, no un número de vida útil.

## 5. Límites
- La relación NDVI–cobertura se ajustó en hortalizas, viñedos y huertas jóvenes; sus autores no la verificaron en huertas
  adultas (no pudieron fotografiar desde arriba los doseles altos). Aplicarla al nogal adulto es un supuesto.
- El NDVI de una huerta incluye la vegetación del piso entre hileras: puede sobreestimar la cobertura de los árboles.
- El mapa de cultivos es por reglas y no está validado en campo; las parcelas son polígonos estimados.
- Las edades con fuente no son de las parcelas de la zona piloto: son promedios de encuestas y de una unidad típica.
