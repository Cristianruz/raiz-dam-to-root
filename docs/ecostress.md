<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# ECOSTRESS por parcela: la estimación satelital de ET frente a la ETc del modelo

> Base 15 de 15 de las que propone el reto. Archivo entregado: `ecostress_parcelas.csv` (contrato del integrador: `id, mes,
> et_mm_dia, n_escenas`; adicionales `zona, etc_modelo_mm, razon, et_min_mm_dia, et_max_mm_dia, incertidumbre_w_m2`).
> Rótulo: **satellite estimate at 70 m on clear days, not a field measurement**.
> Versión del 15-nov-2026, después de la revisión independiente `docs/revisiones/2026-11-15_ecostress.md` («validado con
> correcciones»; se atienden D1, D2, D3, D5, D6, D7 y D9; D4 y D8 quedan como límites escritos en §6).

## 1. De dónde sale
- **Producto:** NASA ECOSTRESS **ECO_L3T_JET.002**, «ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global
  70 m V002», capa `ETdaily`, celda de 70 m, tesela 13RDM. Cita, tal como la da la página del DOI en el catálogo de NASA
  Earthdata (https://www.earthdata.nasa.gov/data/catalog/lpcloud-eco-l3t-jet-002, leída el 15-nov-2026): «Hook, Simon, &
  Halverson, Gregory. (2024). ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global 70 m v002 [Data set].
  NASA Land Processes Distributed Active Archive Center. https://doi.org/10.5067/ECOSTRESS/ECO_L3T_JET.002».
- **Cómo:** AppEEARS v3.137 (LP DAAC), muestra por puntos. Dos solicitudes del 14-nov-2026 con la cuenta de Earthdata del
  equipo (la sesión la inició Cristian): `raiz_ecostress_delicias_saucillo` (ID 8d53d4fe-9e3f-48ee-8947-84078f3f8c99, 940
  puntos) y `raiz_ecostress_lazaro_cardenas` (ID 520f1233-5eb1-4c4e-b243-2c43940f784b, 299 puntos). Un punto dentro de cada
  parcela (`datos/colab/E0_ecostress_solicitud.py`), del 1-oct-2025 al 30-sep-2026, capas `ETdaily`, `ETinstUncertainty`,
  `cloud` y `water`.
- **Crudo:** la salida de AppEEARS sin cambios en `data/raw/reto/ecostress_pasos_<zona>.csv` (sha256 igual al de la lista del
  paquete de AppEEARS: ca8fd45a… y 91f88e4b…).
- **Qué es `ETdaily`** (código de JPL, `github.com/ECOSTRESS-Collection-2/ECOv002-L3T-L4T-JET`, commit a785b14,
  `ECOv002_L3T_L4T_JET.py`, leído el 15-nov-2026): la mediana de cuatro modelos del flujo de calor latente en el instante del
  paso (PT-JPL-SM, BESS, MOD16 y STIC), llevada a un total del día con la fracción evaporativa y la radiación neta media de
  las horas de luz, `Rn_diaria = 1.6 · Rn / (π · sen(π · x))` (`daily_Rn_integration_verma`), donde x es la fracción de las
  horas de luz ya transcurrida al momento del paso (0 al salir el sol, 1 al ponerse). Es una **estimación satelital**, no una
  medición, e **integra las horas de luz, no 24 horas** (guía de usuario, p. 16: «the ETdaily product represents the
  integrated ET between sunrise and sunset»).

## 2. Cálculo (`datos/colab/E1_ecostress_parcelas.py`)
1. **Paso despejado:** `ETdaily` con dato, `cloud` = 0 y `water` = 0. El producto ya deja vacío el píxel con nube, así que
   esto solo no quita una escena con media zona nublada.
2. **Nube en la zona** (D2): se deja fuera la escena de una zona si más de `ecostress_nube_zona_max` = 0.25 [S] de sus puntos
   tienen `cloud` = 1. Sale el 20-may-2026 (49 % de los puntos de Delicias–Saucillo con nube) y el 2-jul-2026 (57 % y 99 %);
   las demás escenas con dato tienen 4 % o menos.
3. **Hora del paso** (D1): se usan los pasos con x entre `ecostress_fraccion_luz` = 0.15 y 0.85 [S]. Cerca de la salida o de
   la puesta del sol, el factor 1/sen(π · x) multiplica un flujo chico y ruidoso por más de 2.2 veces lo que al mediodía. La
   salida del sol y las horas de luz se calculan como en el código de JPL (`FLiES/daylight_hours.py`: declinación de
   Spencer, ángulo horario de la salida, hora local = UTC + longitud/15, sin ecuación del tiempo). Salen el 8-oct (x = 0.10),
   el 28-dic (0.10), el 16-ene (0.88) y el 1-may (0.11).
4. **Un sobrevuelo, un valor** (D5): las escenas de una parcela separadas por menos de `ecostress_sobrevuelo_seg` = 300 s [S]
   son el mismo sobrevuelo; se promedian y cuentan una vez. En estos archivos hay tres pares a 52 s (16-dic-2025, 26-feb y
   26-ago-2026); el del 26-ago junta dos escenas con dato en 85 parcelas de Delicias–Saucillo.
5. **Por parcela y mes:** `et_mm_dia` = mediana de los sobrevuelos que pasan los filtros; `n_escenas` = cuántos sobrevuelos;
   `et_min_mm_dia` y `et_max_mm_dia` = el menor y el mayor; `incertidumbre_w_m2` = mediana de `ETinstUncertainty` de esos
   sobrevuelos.
6. **Contraste con el modelo:** `etc_modelo_mm` = mediana, en esos mismos días, del Kc del modelo (A5: FAO-56, Tablas 11 y
   12) por la ETo de NASA POWER del día; solo con cultivo clasificado, dentro de su ciclo y, en los cultivos anuales, en meses
   en que HLS ve la parcela verde (NDVI ≥ `umbral_verde_ndvi` = 0.4; D9: el calendario del modelo es un supuesto y el cereal
   sembrado el 1-dic se ve sin cultivo hasta febrero). `razon` = `et_mm_dia` / `etc_modelo_mm`.

Antes del 15-nov, `et_mm_dia` era la mediana de todos los pasos despejados del mes y `n_escenas` contaba escenas (renglones):
con las reglas 2 a 4 se vacían 1,914 parcela-mes (todo mayo y julio, y enero de Lázaro Cárdenas y de 404 parcelas de
Delicias–Saucillo) y cambian 2,904 valores de octubre, diciembre, enero y agosto. En agosto, el mes que muestra la página,
cambian 81 (regla 4; por ejemplo, P0290 pasa de 0.22 a 1.91 mm/día).

## 3. Unidades e incertidumbre
- **mm/día.** La guía de usuario de la colección 2 (ECO_L1C-4_Grid_Tile_User_Guide_V2, p. 16) dice que la ET «is upscaled to a
  daily ET estimate in millimeters per day and recorded in the L3T JET product as ETdaily», y el código de JPL la escribe en
  kg/m² por día (`ET_daily_kg = LE_daily · segundos de luz / calor latente de vaporización`), que son mm/día. La Tabla 10 de
  la guía y el catálogo de NASA Earthdata dicen W/m². Los valores cuadran con mm/día: en los pasos despejados, mediana 1.1,
  percentil 99 de 3.7 y máximo 5.8; según la revisión independiente, ningún paso supera la ETo de NASA POWER de su día.
- **`ETinstUncertainty`** está en W/m² y es la desviación estándar entre los cuatro modelos en el instante del paso (código de
  JPL: `np.nanstd` de los cuatro). En los 19,954 pasos con dato: percentil 10 de 29, mediana 87, percentil 90 de 231 y
  máximo 431 (corrige el «de 20 a 45» de la versión anterior). En la entrega, `incertidumbre_w_m2` por parcela y mes: mediana
  93, percentiles 10 y 90 de 51 y 164, máximo 405.
- **Exactitud del producto:** no se evaluó aquí. Una evaluación publicada (Pierrat et al. 2025, Water Resources Research, DOI
  10.1029/2024WR039404) no se abrió; su cifra no se usa.

## 4. Lo que hay (y lo que no)
- 34 escenas por zona en el año, que son 31 sobrevuelos; con dato en algún punto, 21 escenas (20 sobrevuelos). Noviembre y
  junio: ninguna escena. Febrero, marzo, abril y septiembre: escenas sin `ETdaily`. Las escenas van de las 6.5 a las 16.7 h
  locales.
- Con las reglas del §2: **4,253 de 14,868 parcela-mes con dato**, en octubre (las 1,239 parcelas), diciembre (1,239), enero
  (536 de Delicias–Saucillo, de un sobrevuelo) y agosto (1,239). Mayo y julio quedan vacíos.
- Sobrevuelos por valor: 1 en 540; 2 en 942; 3 en 194; 4 en 1,381; 5 en 1,196.
- Mediana de `et_mm_dia` (mm/día), Delicias–Saucillo: oct 1.60, dic 0.66, ene 1.09, ago 2.20. Lázaro Cárdenas: oct 1.44,
  dic 0.61, ago 2.06.
- Distingue cultivos: en agosto, alfalfa 2.69 mm/día (118 parcelas), nogal 2.83 (105) y barbecho 0.95 (219). Dentro de una
  parcela, los sobrevuelos de un mismo mes difieren bastante: en agosto, la diferencia típica entre el mayor y el menor es de
  1 mm/día (por eso se entregan `et_min_mm_dia` y `et_max_mm_dia`).

## 5. Frente al modelo (FAO-56)
Razón `et_mm_dia` / `etc_modelo_mm`, mediana por cultivo y mes (cuartiles entre paréntesis, `statistics.quantiles` con
`method="inclusive"`):

| Cultivo | Oct | Dic | Ene | Ago |
|---|---|---|---|---|
| Alfalfa (118 parcelas) | 0.45 (0.42–0.49) | 0.34 (0.27–0.42) | 0.52 (0.41–0.60), 57 | 0.36 (0.28–0.40) |
| Cereal de invierno | — | 0.69 (0.59–0.82), 3 | 0.36 (0.29–0.43), 4 | — |
| Nogal (105 parcelas) | — | — | — | 0.35 (0.28–0.40) |

- En los días despejados de 2025-26, la estimación de ECOSTRESS queda en un tercio a la mitad de la ETc de FAO-56. **Son
  cantidades distintas**: una estimación satelital de las horas de luz, hecha con cuatro modelos a partir de un instante y
  una curva senoidal, frente a la demanda de 24 horas de un cultivo sano, sin falta de agua, en condiciones estándar. **No es
  una validación del modelo ni un déficit medido**, y la página no la muestra como cociente.
- **No se atribuye a una causa.** Puede venir de riego reducido, de cortes de alfalfa, de cobertura incompleta (P0757 tiene
  NDVI 0.54 en agosto y 0.84 en octubre), de la mezcla de píxel o la ubicación de la escena (§6), o de cómo el producto arma
  el valor diario.
- Frente a SSEBop VIIRS (media del rectángulo de cada zona, en mm/día), la mediana de parcelas de ECOSTRESS da: Delicias–
  Saucillo, oct 1.00, dic 1.00, ene 1.77 (un sobrevuelo) y ago 0.77; Lázaro Cárdenas, oct 0.88, dic 1.17 y ago 0.84. Son
  cocientes de dos promedios de zona distintos (parcelas frente a todo el rectángulo), no de la misma superficie.
- Protagonistas: P0757 (alfalfa) 1.74 mm/día en octubre (4 sobrevuelos, de 1.34 a 2.72), 1.37 en diciembre (4) y 2.11 en
  agosto (2 sobrevuelos: 1.57 y 2.66). L0175 (nogal) 2.16 en octubre (5), 0.75 en diciembre (4) y 2.75 en agosto (3: de 1.50
  a 3.18). P0632 (cereal de invierno): 0.63 en octubre, 0.50 en diciembre y 0.66 en agosto, todos con la parcela sin cultivo
  (NDVI de 0.16 a 0.20); ECOSTRESS no tuvo un sobrevuelo despejado mientras el cereal estuvo verde (febrero a abril).

## 6. Límites
- **Ubicación de las escenas (D4):** no se comprobó. NASA LP DAAC avisa que las escenas sin corrección de geolocalización
  pueden tener errores de hasta 7 km y que la marca de calidad de ubicación no viaja a los productos de nivel 3
  (`github.com/nasa/ECOSTRESS-Data-Resources`, `extract_geolocation_flag`). Además, el punto de la solicitud queda a menos de
  35 m del lindero en 234 de 1,239 parcelas (revisión independiente): ahí el píxel de 70 m puede incluir al vecino, un camino
  o un canal. Revisar la marca de las 21 escenas con dato necesita la sesión de Earthdata del equipo.
- **Cita del software AppEEARS (D8):** la da el README.md que AppEEARS genera con cada solicitud y todavía no está en
  `data/raw/reto/`. Se baja de la página de la solicitud («Download») con la sesión de Earthdata; hasta entonces, la cita del
  software queda «to be confirmed». La del producto ya está en el §1.
- Con pocos sobrevuelos por mes, una parcela puede depender de uno o dos: el valor de enero sale de uno solo.

## 7. Cómo se rehace
`python datos/colab/correr_todo.py --salida <carpeta vacía> --comparar data/entrega_zonas` corre E0 (comprueba que las
solicitudes rehechas son las mismas que se subieron a AppEEARS) y E1 con el crudo de `data/raw/reto/` y los supuestos de
`datos/supuestos.json`. Pedir otra vez los datos a AppEEARS necesita una cuenta de Earthdata: se sube
`data/raw/reto/ecostress_solicitud_<zona>.json` en «Extract → Point Sample → Upload a request file».
