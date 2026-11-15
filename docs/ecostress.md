<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# ECOSTRESS por parcela: la ET que ve el satélite contra la ETc del modelo

> Base 15 de 15 de las que propone el reto. Archivo entregado: `ecostress_parcelas.csv` (contrato del integrador: `id, mes,
> et_mm_dia, n_escenas`; adicionales `zona, etc_modelo_mm, razon`). Rótulo: **satellite ET at 70 m on clear days, not a field
> measurement**.

## 1. De dónde sale
- **Producto:** NASA ECOSTRESS **ECO_L3T_JET.002**, ET diaria (`ETdaily`, integrada de la salida a la puesta del sol) a 70 m,
  colección 2. Hook, S. y Halverson, G. 2024, LP DAAC, https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002
- **Cómo:** AppEEARS v3.137 (LP DAAC), muestra por puntos. Dos solicitudes del 14-nov-2026 con una cuenta de Earthdata del
  equipo: `raiz_ecostress_delicias_saucillo` (ID 8d53d4fe-9e3f-48ee-8947-84078f3f8c99, 940 puntos) y
  `raiz_ecostress_lazaro_cardenas` (ID 520f1233-5eb1-4c4e-b243-2c43940f784b, 299 puntos). Un punto dentro de cada parcela
  (`datos/colab/E0_ecostress_solicitud.py`), del 1-oct-2025 al 30-sep-2026, capas `ETdaily`, `ETinstUncertainty`, `cloud` y `water`.
- **Crudo:** la salida de AppEEARS sin cambios en `data/raw/reto/ecostress_pasos_<zona>.csv` (sha256 igual al de la lista del
  paquete de AppEEARS: ca8fd45a… y 91f88e4b…).
- **Cálculo:** `datos/colab/E1_ecostress_parcelas.py`. Paso despejado = `ETdaily` con dato, `cloud` = 0 y `water` = 0.
  `et_mm_dia` = mediana de los pasos despejados del mes; `n_escenas` = cuántos hubo. `etc_modelo_mm` = mediana, en esos mismos
  días, del Kc del modelo (A5: FAO-56, Tablas 11 y 12) por la ETo de NASA POWER del día; solo con cultivo clasificado y dentro de
  su ciclo. `razon` = `et_mm_dia` / `etc_modelo_mm`.

## 2. Unidades
La guía de usuario de ECOSTRESS colección 2 (ECO_L1C-4_Grid_Tile_User_Guide_V2) dice en el texto que la ET «is upscaled to a
daily ET estimate in millimeters per day and recorded in the L3T JET product as ETdaily», pero su Tabla 10 y AppEEARS dicen
W/m². Los valores cuadran con mm/día: en los pasos despejados, mediana 1.1, percentil 99 3.7 y máximo 5.8; en W/m², un flujo
medio de 1 W/m² sería casi nada de ET. `ETinstUncertainty` sí está en W/m² (instantánea, de 20 a 45).

## 3. Lo que hay (y lo que no)
- Unos 31 pasos del satélite en el año sobre cada zona. Con dato despejado: octubre, diciembre, enero, mayo, julio y agosto.
  Ninguno despejado con dato en noviembre, febrero, marzo, abril, junio y septiembre: esos meses van vacíos (`n_escenas` = 0).
- 6,167 de 14,868 parcela-mes con dato.
- ET mediana de los pasos despejados (mm/día), Delicias–Saucillo: oct 1.69, dic 0.68, ene 0.85, may 0.84, jul 2.53 (176
  parcelas), ago 2.16. Lázaro Cárdenas: oct 1.40, dic 0.64, ene 0.67, may 0.88, ago 2.06.
- Separa los cultivos: en agosto, la alfalfa (mediana de unos 2.7 mm/día) está muy por encima del barbecho (unos 1.0).

## 4. Contra el modelo (FAO-56)
Razón ECOSTRESS / ETc del modelo, mediana por cultivo y mes (cuartiles entre paréntesis):

| Cultivo | Oct | Dic | Ene | May | Jul | Ago |
|---|---|---|---|---|---|---|
| Alfalfa (118 parcelas) | 0.46 (0.43–0.49) | 0.30 (0.25–0.39) | 0.44 (0.36–0.49) | 0.26 (0.16–0.32), 84 | 0.61 (0.55–0.63), 19 | 0.35 (0.28–0.40) |
| Cereal de invierno (16) | — | 0.40 (0.34–0.55) | 0.21 (0.12–0.39) | — | — | — |
| Nogal | — | — | — | 0.22 (0.14–0.27), 93 | 0.52 (0.41–0.56), 8 | 0.35 (0.27–0.41), 105 |

- En los días despejados de 2025-26, la ET que ve ECOSTRESS es de un cuarto a la mitad de la ETc de FAO-56. Va en la misma
  dirección que SSEBop (`docs/resultado_A8.md`): el modelo da la demanda de un cultivo sano y sin falta de agua; el satélite ve el
  uso real de ese día.
- **No se atribuye a una causa.** Puede venir de riego reducido, de cortes de alfalfa, de cobertura incompleta, de la mezcla de
  píxel en parcelas chicas o de sesgo del producto. Con pocos pasos por mes, una parcela puede depender de una o dos escenas.
- Protagonistas: P0757 (alfalfa) 1.98 mm/día en octubre (razón 0.45) y 2.11 en agosto (0.28); L0175 (nogal) 2.75 en agosto
  (0.36); P0632 (cereal de invierno) 0.53 en diciembre (0.36).

## 5. Cómo se rehace
`python datos/colab/correr_todo.py --salida <carpeta vacía> --comparar data/entrega_zonas` corre E0 (comprueba que las
solicitudes rehechas son las mismas que se subieron a AppEEARS) y E1 con el crudo de `data/raw/reto/`. Pedir otra vez los datos
a AppEEARS necesita una cuenta de Earthdata: se sube `data/raw/reto/ecostress_solicitud_<zona>.json` en «Extract → Point
Sample → Upload a request file».
