<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# H1 · Fuente de verdad: qué dice la serie oficial del SIH (14-nov-2026)

Solo se calculó la **verdad** del back-test (kit A6, paso 2). El modelo y las líneas base **no se han corrido**.
Script `datos/colab/A6_verdad_sih.py`; serie original en `data/raw/sih/LBQCH.csv` (Conagua SIH, descargada el
14-nov-2026, última fecha 13-nov-2026).

| Punto | Salida por obra de toma integrada del SIH | Caída de almacenamiento del SIH | Cifra de prensa |
|---|---|---|---|
| 13-may-2026 (secundario) | 113.36 hm³ | 229.46 hm³ | 228.86 hm³ |
| 14-jul-2026 (principal) | 296.31 hm³ | 447.99 hm³ | 447.65 hm³ |

Almacenamiento oficial el 14-mar-2026: 1,082.085 hm³ (prensa: 1,081.60).

## Lo que se encontró
1. **Las cifras de prensa son la caída de almacenamiento**, no la extracción medida: 447.65 frente a 447.99 hm³ y
   228.86 frente a 229.46 hm³ en la serie oficial. El preregistro ya lo advertía; la serie lo confirma.
2. **La serie trae ceros en el periodo:** del 14 al 31 de marzo (18 días) `ObraToma` = 0 y el almacenamiento
   aparece congelado en 1,082.085 hm³; el 1 de abril baja de golpe a 1,005.504 hm³ (−76.6 hm³). Es decir, esos
   días no se actualizaron: son huecos de registro, no falta de extracción. No hay días vacíos; los caudales
   distintos de cero van de 25.5 a 35.5 m³/s (105 días).
3. Por eso la integral del SIH (296.31 hm³) es un **piso**, no la extracción completa.

## Qué fuente de verdad corresponde (regla ya escrita en el preregistro y en el kit A6)
«Si la serie trae huecos o ceros en el periodo, repórtelo y use el respaldo»: la verdad del punto principal es
**447.65 hm³, rotulada "press-reported; equals the storage drop"**. La integral del SIH (296.31 hm³) se reporta al
lado como referencia, con esta nota. La caída de almacenamiento incluye evaporación y entradas, así que tampoco es
extracción pura; el resultado de H1 debe decirlo y, si se puede, mostrar la comparación con las dos cifras.
