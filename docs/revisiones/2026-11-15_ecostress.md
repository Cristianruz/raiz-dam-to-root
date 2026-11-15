<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Validación independiente de ECOSTRESS por parcela (`ecostress_parcelas.csv`) · 15-nov-2026, 00:05

**Qué se revisó:** la entrega de la sesión de datos `ecostress_parcelas.csv` (rama de integración, `data/processed/`; sha256 `9367da36…`, igual en los commits `40c01ec` y `6041f51` de la integración y en `adc6157` de `datos-satelite`), sus crudos `data/raw/reto/ecostress_pasos_<zona>.csv` y `ecostress_solicitud_<zona>.json`, los scripts `datos/colab/E0_ecostress_solicitud.py` y `E1_ecostress_parcelas.py`, el documento `docs/ecostress.md` y lo que la página hace con el dato (`motor/contexto_web.py`, `web/data/contexto.json`, `web/js/contexto.js`, `web/app.js`). **Cómo:** un revisor de solo lectura con contexto nuevo recalculó el archivo desde los crudos con scripts propios, leyó el código de JPL que genera el producto y la guía de usuario, y comparó la página con el CSV. **Veredicto: validado con correcciones** (listas al final).

Fecha: 15-nov-2026. Solo lectura: no se editó el repositorio. La pidió la sesión de datos el 14-nov a las 21:45 (`datos/PARA_INTEGRADOR.md`).

**La rama se movió durante la revisión.** Empecé sobre `40c01ec`; mientras revisaba, otras sesiones fusionaron y reconstruyeron la integración hasta `6041f51` (15-nov, 06:04 UTC). Para no leer un árbol en movimiento, todo lo que aquí se dice de la integración se comprobó sobre copias fijas de los dos commits, y los resultados son iguales en ambos salvo donde se indica (la cita de AppEEARS, hallazgo I5). Los números de línea de la integración son los de `6041f51`. Los archivos de la sesión de datos (`docs/ecostress.md`, `E0`, `E1` y los crudos) ya están en `6041f51` y son los de `adc6157`; `docs/ecostress.md` cambió solo en el encabezado y en una frase sobre la cuenta de Earthdata, sin mover sus líneas.

**Cómo se leyeron las fuentes.** La red de la sesión no deja entrar a `doi.org`, `lpdaac.usgs.gov`, `www.earthdata.nasa.gov`, `appeears.earthdatacloud.nasa.gov`, `cmr.earthdata.nasa.gov`, `ecostress.jpl.nasa.gov` ni a `agupubs.onlinelibrary.wiley.com`. Sí se abrieron tres fuentes primarias, clonadas de GitHub:
- El código de JPL que genera el producto: `github.com/ECOSTRESS-Collection-2/ECOv002-L3T-L4T-JET` (commit `a785b14`, 27-jul-2026), archivo `ECOv002_L3T_L4T_JET/ECOv002_L3T_L4T_JET.py`.
- La guía de usuario que cita la entrega, que viene en ese repositorio: `documentation/ECO_L1C-4_Grid_Tile_User_Guide_V2.pdf` (ECOSTRESS Collection 2 Level-1-2-3-4 Gridded and Tiled Data Products User Guide, Version 2, 4-abr-2023; Halverson, Cawse-Nicholson y Johnson).
- Los recursos de NASA LP DAAC: `github.com/nasa/ECOSTRESS-Data-Resources` (commit `d9155bc`, 19-ago-2026) y `github.com/nasa/AppEEARS-Data-Resources` (commit `913c541`, 7-oct-2026).

Lo que solo se vio en el resumen de un buscador va marcado «no comprobada».

## 1. El dato entregado

| Comprobación | Resultado |
|---|---|
| Columnas | `id, mes, et_mm_dia, n_escenas` (las del esquema, `motor/esquemas.py:882-897`) más `zona, etc_modelo_mm, razon`. Las tres adicionales entran «sin validar» (`motor/ensamblar.py:519-521`) |
| Filas y llave | 14,868 = 1,239 parcelas × 12 meses (2025-10 a 2026-09). Llave (`id`, `mes`): 0 repetidas. Las 1,239 de `parcelas_base.geojson`, ninguna de más (940 P y 299 L) |
| Regla del esquema | `et_mm_dia` vacío si y solo si `n_escenas` = 0: se cumple en las 14,868 filas. `n_escenas` entero ≥ 0 en todas |
| Con dato | 6,167 parcela-mes; 8,701 vacíos. Las 1,239 parcelas tienen dato en al menos 4 meses (184 en 4, 899 en 5 y 156 en 6) |
| Meses con dato | oct, dic, ene, may, jul y ago. Vacíos: nov, feb, mar, abr, jun y sep |
| Unidad | mm/día (comprobada en el código de JPL, fila 1c de la tabla de la sección 3) |
| Escenas por valor | 1 escena: 1,483 (24.0 %); 2: 1,832; 3: 275; 4: 99; 5: 1,282; 6: 1,196. Con una o dos: 3,315 (53.8 %) |
| Agosto (el mes que muestra la página) | 2 escenas: 865 parcelas; 3: 275; 4: 99 |
| Línea de `fuentes.json` | Describe el archivo como es. Dos precisiones: «clear passes» incluye pasos con media zona bajo nube (hallazgo D2) y el rango de la incertidumbre no es el que se dijo en la entrega (D3) |

**Por mes y zona** (parcelas con dato; mediana de `et_mm_dia`; mínimo y máximo):

| Mes | Delicias–Saucillo | Lázaro Cárdenas |
|---|---|---|
| 2025-10 | 940; 1.69 (0.45–3.42); 5 o 6 escenas | 299; 1.40 (0.30–2.79); 6 escenas |
| 2025-12 | 940; 0.68 (0.15–1.81); 5 escenas | 299; 0.64 (0.24–1.09); 5 escenas |
| 2026-01 | 940; 0.85 (0.05–2.21); 404 con 1 escena y 536 con 2 | 293; 0.67 (0.15–1.69); todas con 1 escena |
| 2026-05 | 742; 0.84 (0.10–3.68); 311 con 1 escena y 431 con 2 | 295; 0.88 (0.20–3.58); todas con 1 escena |
| 2026-07 | 176; 2.53 (0.36–4.14); todas con 1 escena | 4; 2.03 (1.24–3.01); todas con 1 escena |
| 2026-08 | 940; 2.16 (0.14–4.74); 859 con 2 escenas y 81 con 3 | 299; 2.06 (0.23–4.39); 6 con 2, 194 con 3 y 99 con 4 |

**Rango físico.** Lo que se espera: la ET real de un día no baja de cero y no pasa de la demanda de un cultivo de cobertura completa bien regado, que el modelo del proyecto pone en hasta 1.2 veces la ETo (el Kc más alto de `rotaciones.json` → `cultivos`). La ETo de NASA POWER en los días con paso (`eto_diaria.csv`) fue de 4.2 a 5.1 mm/día en octubre, de 2.8 a 4.0 en diciembre y enero, y de 5.7 a 8.9 de mayo a agosto. Eso da topes de unos 6 mm/día en octubre, 4.8 en invierno y 10.7 en verano. Para alfalfa y nogal en agosto se esperarían de 5.9 a 9.5 mm/día (Kc de 0.95 y 1.07 del modelo por la ETo de los días con paso, de 6.3 a 8.9); para un barbecho seco, valores cercanos a cero.
- **Fuera de rango: 0 valores.** Ningún negativo. Ningún paso supera la ETo de su día: el cociente ETdaily / ETo tiene mediana 0.26, percentil 99 de 0.65 y máximo 0.87 (19,954 pasos). El máximo mensual es 4.74 mm/día.
- **Casi cero:** 9 pasos con menos de 0.05 mm/día, uno de ellos con 0.0; 2 valores mensuales menores que 0.1.
- **Lo que llama la atención está del lado bajo.** En agosto, alfalfa y nogal marcan una mediana de 2.69 mm/día en Delicias–Saucillo (186 parcelas) y de 2.90 en Lázaro Cárdenas (37), es decir, 0.4 veces la ETo media del mes, y ninguna de las 1,239 parcelas llega a 5 mm/día. La entrega lo dice y no lo atribuye a una causa. Esta revisión agrega tres posibles causas que vienen del producto y no del riego: cómo arma el producto el valor diario (sección 2), el ruido de los pasos cercanos a la salida y a la puesta del sol (D1) y la mezcla de píxel o la ubicación de la escena (D4).

## 2. La cadena del dato a la cifra

**Producto.** ECO_L3T_JET.002 (ECOSTRESS colección 2, teselas; tesela 13RDM para las dos zonas), capa `ETdaily`, celda de 70 m. La solicitud de AppEEARS pide además `ETinstUncertainty`, `cloud` y `water`, del 1-oct-2025 al 30-sep-2026, con un punto por parcela (940 y 299). Los 1,239 puntos caen dentro de su parcela (comprobado con un cálculo propio de punto en polígono) y son los mismos que trae el crudo (0 coordenadas distintas).

**Qué es `ETdaily`** (código de JPL, líneas 1584-1611 y 1650). No es una medición directa. El producto calcula cuatro estimaciones del flujo de calor latente en el instante del paso (modelos PT-JPL-SM, BESS, MOD16 y STIC), toma su mediana y la convierte en un total del día así: divide entre la radiación neta del instante, multiplica por la radiación neta media del día (`1.6 · Rn / (π · sen(π · x))`, donde x es la fracción de las horas de luz transcurrida al momento del paso: 0 al salir el sol, 0.5 al mediodía solar, 1 al ponerse) y por los segundos de luz, y divide entre el calor latente de vaporización. El resultado va en kg/m² por día, que son mm/día. Tres consecuencias:
1. **La hora del paso la trata el producto, no E1.** E1 usa la hora para una sola cosa: asignar la fecha (UTC + longitud/15; ningún paso cambia de día). Después saca la mediana de los `ETdaily` del mes. Eso es correcto en principio: cada `ETdaily` ya es un total del día.
2. **Cerca de la salida y de la puesta del sol el producto multiplica más.** El multiplicador crece como 1 / sen(π · x). Con x = 0.10 es 3.2 veces el del mediodía. Un flujo chico y ruidoso se multiplica por tres.
3. **El total es de las horas de luz.** `ETdaily` integra de la salida a la puesta del sol (guía, p. 16) y la constante del código es 1.6; la media exacta de una curva senoidal llevaría un 2. La ETc de FAO-56 es de 24 horas. Parte de la distancia entre ECOSTRESS y el modelo puede venir de cómo se construye el valor diario. No se afirma que sea un error del producto.

**Filtro de calidad y de nubes** (`E1:90`). Paso despejado = `ETdaily` con dato, `cloud` = 0 y `water` = 0. En los crudos hay 42,126 renglones: 19,954 con `ETdaily`, 3,451 con `cloud` = 1 y sin dato, y 18,721 con `cloud` = 0 y sin dato. Ningún renglón con `ETdaily` tiene `cloud` = 1: el producto ya deja vacío el píxel con nube, así que **el filtro de nube de E1 no quita nada**. E1 no mira cuánta nube hay alrededor, no usa `ETinstUncertainty` y no comprueba la ubicación de la escena.

**Reproducción.** Con un script propio (sin importar E1), a partir de los dos crudos:
- `et_mm_dia`: **6,167 de 6,167 iguales; diferencia máxima 0.00**. Vacíos: 8,701 de 8,701.
- `n_escenas`: 14,868 de 14,868 iguales.
- `etc_modelo_mm` (Kc de `rotaciones.json` → `cultivos`, con mi propia curva de cuatro etapas, por la ETo del día): 813 de 813 iguales. `razon`: 813 de 813.
- `web/data/contexto.json` → `ecostress`: 14,868 celdas, 0 diferencias con el CSV.

**Los pasos.** El crudo trae 34 escenas por zona, que son 31 sobrevuelos (tres veces hay dos escenas seguidas, a 52 segundos). Tienen dato en algún punto 21 escenas (20 sobrevuelos). De las 13 sin dato, 12 tienen `cloud` = 0 en todos sus puntos: `cloud` = 0 no quiere decir «despejado y observado». En noviembre y junio no hay ninguna escena.

En la tabla: x es la fracción de las horas de luz ya definida; «multiplicador» es cuántas veces el del mediodía; «dispersión» es la mediana de `ETinstUncertainty` (desviación estándar entre los cuatro modelos, W/m²); «dispersión / flujo» la compara con el flujo instantáneo que implica `ETdaily` (cálculo del revisor con las fórmulas del código); ρ es la correlación de rangos, entre parcelas, de `ETdaily` con el NDVI de HLS del mismo mes (`hls_mensual_parcelas.csv`). Un ρ alto dice que el paso distingue las parcelas verdes de las que no lo están.

| Paso (UTC) | Hora (UTC + longitud/15) | x | Multiplicador | Puntos con dato, D–S / L.C. | Puntos con nube, D–S / L.C. | Mediana `ETdaily` | Dispersión | Dispersión / flujo | ρ con NDVI |
|---|---|---|---|---|---|---|---|---|---|
| 2025-10-08 14:23 | 7:22 | 0.10 | 3.2 | 940 / 299 | 0 / 0 | 1.84 | 48 | 0.7 | 0.35 |
| 2025-10-11 21:45 | 14:44 | 0.74 | 1.4 | 940 / 299 | 0 / 0 | 1.37 | 78 | 0.7 | 0.72 |
| 2025-10-15 20:10 | 13:09 | 0.60 | 1.1 | 940 / 299 | 0 / 0 | 1.80 | 122 | 0.6 | 0.81 |
| 2025-10-19 18:36 | 11:35 | 0.46 | 1.0 | 940 / 299 | 0 / 0 | 1.52 | 121 | 0.7 | 0.74 |
| 2025-10-23 17:02 | 10:01 | 0.32 | 1.2 | 940 / 299 | 0 / 0 | 1.34 | 118 | 0.8 | 0.54 |
| 2025-10-27 15:27 | 8:26 | 0.18 | 1.9 | 897 / 299 | 0 / 0 | 1.62 | 85 | 0.7 | 0.57 |
| 2025-12-12 21:19 | 14:18 | 0.72 | 1.3 | 940 / 299 | 0 / 0 | 0.70 | 57 | 0.9 | 0.68 |
| 2025-12-16 19:45 | 12:43 | 0.57 | 1.0 | 940 / 299 | 0 / 0 | 0.65 | 59 | 0.7 | 0.59 |
| 2025-12-20 18:09 | 11:07 | 0.41 | 1.0 | 940 / 299 | 0 / 0 | 0.54 | 59 | 0.9 | 0.59 |
| 2025-12-24 16:33 | 9:32 | 0.26 | 1.4 | 940 / 299 | 0 / 0 | 0.65 | 169 | 2.5 | 0.26 |
| 2025-12-28 14:57 | 7:55 | 0.10 | 3.2 | 940 / 299 | 0 / 0 | 0.77 | 371 | 10.3 | 0.04 |
| 2026-01-16 22:57 | 15:56 | 0.88 | 2.7 | 940 / 293 | 0 / 6 | 0.74 | 32 | 1.0 | 0.47 |
| 2026-01-29 17:32 | 10:31 | 0.36 | 1.1 | 536 / 0 | 1 / 0 | 1.09 | 89 | 0.7 | 0.35 |
| 2026-05-01 13:55 | 6:53 | 0.11 | 3.0 | 697 / 295 | 4 / 4 | 0.98 | 30 | 0.8 | 0.66 |
| 2026-05-20 21:55 | 14:54 | 0.72 | 1.3 | 476 / 0 | 464 / 299 | 0.47 | 23 | 0.7 | 0.88 |
| 2026-07-02 13:34 | 6:32 | 0.10 | 3.1 | 176 / 4 | 539 / 295 | 2.52 | 206 | 2.8 | 0.63 |
| 2026-08-06 23:34 | 16:32 | 0.84 | 2.1 | 0 / 286 | 583 / 13 | 2.70 | 72 | 0.6 | 0.79 |
| 2026-08-10 21:59 | 14:58 | 0.73 | 1.3 | 936 / 299 | 4 / 0 | 2.01 | 103 | 0.7 | 0.68 |
| 2026-08-14 20:24 | 13:23 | 0.61 | 1.1 | 0 / 106 | 0 / 0 | 2.06 | 119 | 0.6 | 0.94 |
| 2026-08-26 15:40:00 | 8:38 | 0.24 | 1.5 | 663 / 299 | 0 / 0 | 2.00 | 120 | 0.7 | 0.70 |
| 2026-08-26 15:40:52 | 8:39 | 0.24 | 1.5 | 362 / 0 | 0 / 0 | 2.12 | 130 | 0.7 | 0.58 |

Lo que la tabla enseña:
- **Los pasos lejos de la salida y de la puesta del sol llevan señal de parcela.** Entre los pasos con x de 0.3 a 0.75 de un mismo mes, el orden de las parcelas se conserva (correlación de rangos de 0.55 a 0.91) y siguen al NDVI (de 0.54 a 0.94; el del 29-ene, 0.35). El valor mensual también: ρ con el NDVI de 0.83 en octubre, 0.67 en diciembre y 0.77 en agosto. La afirmación de la entrega «separa los cultivos» se sostiene en esos meses.
- **El paso del 28-dic (7:55) no lleva señal.** Su correlación con el NDVI es 0.04, con los otros cuatro pasos de diciembre va de −0.08 a 0.05, y los cuatro modelos difieren entre sí diez veces más que el flujo. En diciembre es uno de cinco y la mediana lo amortigua. El del 24-dic (9:32) tampoco convence: 0.26 con el NDVI y una dispersión 2.5 veces el flujo.
- **Enero, mayo y julio dependen de pasos así.** Ver D1 y D2.
- **Aun en los meses con varios pasos, un valor suelto es ruidoso.** Dentro de una misma parcela, el cociente entre el paso más alto y el más bajo del mes tiene mediana 2.2 en octubre y 2.8 en diciembre. En agosto, la diferencia entre el paso más alto y el más bajo tiene mediana 0.98 mm/día y pasa de 1 mm/día en 606 de 1,239 parcelas, frente a un valor típico de 2.1.

## 3. Tabla de verificación de afirmaciones y citas

| # | Afirmación | Archivo y línea | Fuente abierta | Qué dice la fuente o el recálculo | Veredicto | Corrección propuesta |
|---|---|---|---|---|---|---|
| 1a | Producto ECO_L3T_JET.002, colección 2, a 70 m | `docs/ecostress.md:9-10`; `fuentes.json` | Guía de usuario V2, p. 10 | «ECOSTRESS uses a 70 m cell size with 1568 rows by 1568 columns in each tile» | coincide | 70 m es el tamaño de la celda de la malla; no dice nada de la exactitud de la ubicación (fila 1j) |
| 1b | `ETdaily` es la ET diaria integrada de la salida a la puesta del sol | `docs/ecostress.md:9`; `E0:9` | Guía, p. 16 | «Note that the ETdaily product represents the integrated ET between sunrise and sunset.» | coincide | Decir en §4 que por eso no es comparable uno a uno con una ETc de 24 horas |
| 1c | Unidades: mm/día; la Tabla 10 dice W/m² | `docs/ecostress.md:22-26`; `E1:18-24` | Guía, p. 16 y Tabla 10; código, líneas 1608-1611 y 1650 | «The median of PTJPLSMinst, STICinst, MOD16inst, and BESSinst is upscaled to a daily ET estimate in millimeters per day and recorded in the L3T JET product as ETdaily». La Tabla 10 agrupa `ETdaily` con «W m-2». El código escribe `ET_daily_kg = np.clip(LE_daily * daylight_seconds / LATENT_VAPORIZATION_JOULES_PER_KILOGRAM, 0, None)` en la capa «ETdaily» | coincide | Citar el código como prueba de la unidad, además de «cuadra con los valores» |
| 1d | «AppEEARS dice W/m²» | `docs/ecostress.md:24`; `fuentes.json` | No se pudo abrir AppEEARS | — | **no comprobada** | — |
| 1e | `ETinstUncertainty` va en W/m², «de 20 a 45» | `docs/ecostress.md:26`; `E1:24`; PARA_INTEGRADOR, nota 21:28 | Guía, p. 16; código, líneas 1613-1615; recálculo | «The standard deviation between these multiple estimates of ET is considered the uncertainty». En los 19,954 pasos con dato: percentil 10 de 29, mediana 87, percentil 90 de 231, máximo 431. Entre 20 y 45 cae el 16 % | unidad: coincide. Rango: **difiere** | Escribir la distribución real y que es la desviación estándar entre cuatro modelos (D3) |
| 1f | Paso despejado = `ETdaily` con dato, `cloud` = 0 y `water` = 0 | `docs/ecostress.md:17`; `E1:90` | Guía, p. 10 | «Pixels with the value 1 in the cloud layer represent detection of cloud in that pixel»; los vacíos son píxeles «that could not be retrieved» | coincide con la guía; el filtro no quita ningún renglón | Decirlo, y filtrar por la nube de la zona (D2) |
| 1g | Cita: Hook, S. y Halverson, G. 2024, LP DAAC, DOI 10.5067/ECOSTRESS/ECO_L3T_JET.002 | `docs/ecostress.md:10`; `README.md:285`; `DATA_LICENSE.md:55`; `docs/pitch/textos_envio.md:250` | `doi.org` y LP DAAC bloqueados. El buscador confirma el título «ECOSTRESS Tiled Evapotranspiration Instantaneous and Daytime L3 Global 70 m V002» | Autores y año no vistos | **no comprobada** | Copiar la cita textual del README.md que AppEEARS genera con la solicitud (D8); poner el título completo |
| 1h | AppEEARS v3.137; ID de las dos solicitudes; sha256 del crudo igual al de la lista de AppEEARS | `docs/ecostress.md:11-16` | sha256 recalculado | `ca8fd45a1639…dab03e1b` y `91f88e4beb7d…994b44e03`: coinciden con lo escrito. La lista de AppEEARS, la versión y los ID no se ven sin la sesión de Earthdata | coincide lo recalculable; lo demás **no comprobado** | Guardar el README.md de cada solicitud en `data/raw/reto/` |
| 1i | Exactitud de la ET del producto | `docs/ecostress.md`: no dice nada | El buscador resume a Pierrat et al. 2025, Water Resources Research, DOI 10.1029/2024WR039404: error cuadrático medio del conjunto de 109 W/m² en el instante y 1.5 mm/día en el día (cifras del preprint) | No se abrió el artículo | **falta**, y la cifra queda **no comprobada** | Agregar una frase de exactitud con su fuente abierta, o decir que no se evaluó. Con valores de 1 a 3 mm/día, un error de ese tamaño importa |
| 1j | Exactitud de la ubicación de cada escena | `docs/ecostress.md`: no dice nada | NASA LP DAAC, `nasa/ECOSTRESS-Data-Resources`, `python/scripts/extract_geolocation_flag/geolocation.md` | «The gelocation accuracy for corrected data could be better than 50 meters but the data was processed without correcting the geolocation could have up to 7 km geolocation error». La marca `Geolocation Accuracy QA` tiene niveles que incluyen «Suspect» y «No Match» y sus campos «are not carried over to higher-level data products» | **falta** | D4 |
| 2a | `et_mm_dia` = mediana de los pasos despejados del mes; `n_escenas` = cuántos | `E1:113`, `E1:117` | Recálculo propio | 6,167 de 6,167 y 14,868 de 14,868 | coincide | `n_escenas` cuenta renglones, no sobrevuelos (D5) |
| 2b | `etc_modelo_mm` = mediana, en esos días, de Kc × ETo; `razon` = cociente | `E1:115-116` | Recálculo propio | 813 de 813 y 813 de 813 | coincide | En cereal de invierno compara con suelo sin cultivo (D9) |
| 2c | Fecha en tiempo solar local; «los pasos de estas zonas son de 7 a 17 h» | `E1:16`, `E1:84` | Recálculo | Ningún paso cambia de fecha. Las 34 escenas van de 6.5 a 16.7 h; dos con dato son anteriores a las 7 (1-may 6:53 y 2-jul 6:32) | fecha: coincide. Frase: difiere | «de 6.5 a 16.7 h» |
| 2d | «Unos 31 pasos»; meses con y sin dato | `docs/ecostress.md:29-30` | Recálculo | 34 escenas = 31 sobrevuelos; 20 sobrevuelos con dato. Noviembre y junio: ninguna escena. Febrero, marzo, abril y septiembre: escenas sin `ETdaily` | coincide | Distinguir «no pasó» de «pasó y no hay dato» |
| 2e | 6,167 de 14,868; medianas por zona y mes | `docs/ecostress.md:31-33` | Recálculo | Iguales (tabla de la sección 1) | coincide | — |
| 2f | En agosto, alfalfa unos 2.7 y barbecho unos 1.0 mm/día | `docs/ecostress.md:34` | Recálculo con `cultivos_parcelas.csv` | Alfalfa 2.69 (118 parcelas); barbecho 0.94 (219); nogal 2.83 (105) | coincide | — |
| 2g | Tabla de razones por cultivo y mes | `docs/ecostress.md:39-43` | Recálculo | Medianas y conteos iguales. Cuartiles: difieren hasta 0.04 según el método (grupos de 8 a 16 parcelas) | coincide | Escribir el método de los cuartiles. Las columnas de mayo y julio salen de pasos que esta revisión objeta (D1, D2) |
| 2h | Protagonistas: P0757 1.98 en octubre (0.45) y 2.11 en agosto (0.28); L0175 2.75 en agosto (0.36); P0632 0.53 en diciembre (0.36) | `docs/ecostress.md:50-51` | CSV | Iguales | coincide | — |
| 2i | «el satélite ve el uso real de ese día»; «ECOSTRESS mide la ET real de un día despejado» | `docs/ecostress.md:46-47`; `E1:27` | Guía, p. 16; código | `ETdaily` es la mediana de cuatro modelos llevada al día con una curva senoidal | **difiere** (redacción) | «estimación satelital de la ET», no «uso real» ni «mide» (D6) |
| 2j | «Va en la misma dirección que SSEBop» | `docs/ecostress.md:45-46` | `data/raw/ssebop/ssebop_<zona>_mensual.csv` (rama `datos-satelite`) | Cociente entre la mediana de parcelas de ECOSTRESS y la media del rectángulo de SSEBop, las dos en mm/día. Delicias–Saucillo: oct 1.05, dic 1.03, ene 1.38, **may 0.35**, jul 0.88, ago 0.76. Lázaro Cárdenas: oct 0.86, dic 1.23, ene 1.69, **may 0.38**, ago 0.84 | coincide a grandes rasgos, salvo mayo | Dar las cifras. Mayo queda a un tercio de SSEBop: apoya D1 y D2 |

## 4. Lo que muestra la página

Texto que arma `web/js/contexto.js:818-832` con el `contexto.json` actual, leído con la función de la página:

| Parcela | Renglón de la ficha |
|---|---|
| P0757 | Evapotranspiration (ECOSTRESS): 2.11 mm/day, median of the clear scenes of Aug 2026 |
| P0632 | Evapotranspiration (ECOSTRESS): 0.66 mm/day, median of the clear scenes of Aug 2026 |
| L0175 | Evapotranspiration (ECOSTRESS): 2.75 mm/day, median of the clear scenes of Aug 2026 |

- **¿El valor es el del CSV?** Sí: 14,868 celdas, 0 diferencias. La ficha escribe el último mes con dato, que es agosto de 2026 en las 1,239 parcelas.
- **¿Dice que es satélite a 70 m y no una medición en la parcela?** A la vista, no. El renglón va bajo el título «Satellite evidence» y con `nota: null` (`contexto.js:826`). El rótulo «satellite ET at 70 m on clear days, not a field measurement» está dentro del texto de la fuente, que queda plegado en «Full source» (`web/app.js:2169`).
- **¿Se compara con el modelo?** Hoy no. Por eso hoy no hay lectura posible como validación. `README.md:143`, `docs/pitch/textos_envio.md:170` y `data/recursos_reto.json` dicen que la ficha muestra «a field-scale contrast of the modeled ET»: la ficha no muestra ese contraste.
- **¿Muestra cuántas escenas hay detrás?** No. `bloque_ecostress` (`motor/contexto_web.py:618-627`) lleva a `contexto.json` solo `et_mm_dia`; `n_escenas` se queda en el CSV.
- **Lo que pidió la sesión de datos (hallazgo 5 de su revisión cruzada).**
  - *Mostrar `n_escenas`:* correcto y necesario. Con una corrección previa: que cuente sobrevuelos (D5). Conviene mostrar también el intervalo entre pasos: en agosto la diferencia típica entre el paso más alto y el más bajo de una parcela es de 1 mm/día.
  - *Mostrar el contraste con el modelo («the model's need on the same days: 7.55 mm/day»):* tiene tres riesgos. Uno: 2.11 frente a 7.55 se lee como «el agricultor usa el 28 % de lo que el cultivo pide», que es una afirmación sobre el riego que el dato no sostiene, o como una validación fallida del modelo. Dos: son cantidades distintas (horas de luz frente a 24 horas; estimación de un conjunto de modelos frente a la demanda de un cultivo sano), y en P0757 el NDVI de agosto es 0.54 frente a 0.84 en octubre: el campo no estaba a cobertura completa. Tres: descansa en dos pasos que dan 1.57 y 2.66. Si se muestra, que sean las dos cifras con su aviso, nunca el cociente ni un porcentaje, y solo en meses con dos o más sobrevuelos lejos de la salida y la puesta del sol.
  - *Para P0632, elegir un mes dentro de su ciclo:* el motivo es correcto, porque agosto (0.66 mm/día) es el campo ya sin cultivo (NDVI 0.20). La regla propuesta no. «El último mes con `etc_modelo_mm`» es enero de 2026 y no diciembre de 2025, como dice el hallazgo: 0.39 mm/día de una sola escena, tomada a las 15:55 (x = 0.88), con `razon` 0.11. Y ni enero ni diciembre están dentro del ciclo que se ve desde el satélite: el NDVI de HLS de P0632 es 0.17 en diciembre y 0.16 en enero (suelo sin cultivo), y sube a 0.47, 0.87 y 0.91 en febrero, marzo y abril, cuando ECOSTRESS no tiene dato. El modelo supone la siembra el 1-dic (supuesto [S]). Mostrar «0.53 frente a 1.48» o «0.39 frente a 3.41» sería comparar la evaporación de un suelo sin cultivo con la demanda de un cultivo que aún no estaba. Para P0632 no hay ninguna lectura de ECOSTRESS con el cereal en pie.

## 5. Las tres parcelas protagonistas

Meses con dato. Cada paso: día, hora (UTC + longitud/15), `ETdaily` en mm/día y, entre paréntesis, la dispersión entre modelos en W/m². El asterisco marca los pasos con x menor que 0.15 o mayor que 0.85. NDVI de `hls_mensual_parcelas.csv`; ETo media del mes de `eto_diaria.csv` y `eto_diaria_lazaro_cardenas.csv`.

**P0757 · alfalfa · 7.95 ha · punto a 89 m del lindero**

| Mes | `et_mm_dia` | `n_escenas` | Pasos | `etc_modelo_mm` | `razon` | NDVI | ETo media |
|---|---|---|---|---|---|---|---|
| 2025-10 | 1.98 | 5 | 8 7:21* → 2.10 (47); 11 14:43 → 1.98 (107); 15 13:08 → 2.72 (183); 19 11:34 → 1.51 (228); 23 10:00 → 1.34 (182) | 4.37 | 0.45 | 0.84 | 4.6 |
| 2025-12 | 0.85 | 5 | 12 14:17 → 2.34 (349); 16 12:42 → 0.85 (159); 20 11:06 → 1.89 (139); 24 9:31 → 0.63 (99); 28 7:54* → 0.54 (21) | 3.10 | 0.27 | 0.75 | 3.1 |
| 2026-01 | 0.90 | 1 | 16 15:55* → 0.90 (56) | 3.08 | 0.29 | 0.80 | 3.0 |
| 2026-08 | 2.11 | 2 | 10 14:57 → 1.57 (95); 26 8:37 → 2.66 (125) | 7.55 | 0.28 | 0.54 | 7.0 |

**P0632 · cereal de invierno · 20.66 ha · punto a 104 m del lindero**

| Mes | `et_mm_dia` | `n_escenas` | Pasos | `etc_modelo_mm` | `razon` | NDVI | ETo media |
|---|---|---|---|---|---|---|---|
| 2025-10 | 0.67 | 5 | 8 7:21* → 1.70 (185); 11 14:43 → 0.60 (55); 15 13:08 → 1.29 (71); 19 11:34 → 0.67 (56); 23 10:00 → 0.55 (38) | — | — | 0.16 | 4.6 |
| 2025-12 | 0.53 | 5 | 12 14:17 → 0.42 (50); 16 12:42 → 0.47 (46); 20 11:06 → 0.53 (43); 24 9:31 → 0.79 (143); 28 7:54* → 0.95 (208) | 1.48 | 0.36 | 0.17 | 3.1 |
| 2026-01 | 0.39 | 1 | 16 15:55* → 0.39 (25) | 3.41 | 0.11 | 0.16 | 3.0 |
| 2026-08 | 0.66 | 2 | 10 14:57 → 0.14 (95); 26 8:37 → 1.17 (77) | — | — | 0.20 | 7.0 |

Sin dato de ECOSTRESS en febrero, marzo y abril, cuando el NDVI fue 0.47, 0.87 y 0.91.

**L0175 · nogal · 10.76 ha · punto a 75 m del lindero**

| Mes | `et_mm_dia` | `n_escenas` | Pasos | `etc_modelo_mm` | `razon` | NDVI | ETo media |
|---|---|---|---|---|---|---|---|
| 2025-10 | 2.10 | 6 | 8 7:21* → 1.40 (33); 11 14:43 → 1.35 (103); 15 13:08 → 2.16 (170); 19 11:34 → 2.03 (187); 23 10:00 → 2.76 (177); 27 8:25 → 2.64 (103) | — | — | 0.49 | 4.6 |
| 2025-12 | 0.78 | 5 | 12 14:17 → 1.03 (58); 16 12:42 → 0.72 (64); 20 11:06 → 0.61 (60); 24 9:30 → 0.78 (93); 28 7:54* → 0.83 (133) | — | — | 0.26 | 3.0 |
| 2026-01 | 0.86 | 1 | 16 15:55* → 0.86 (27) | — | — | 0.23 | 2.9 |
| 2026-05 | 0.78 | 1 | 1 6:52* → 0.78 (52) | 8.59 | 0.09 | 0.48 | 8.1 |
| 2026-08 | 2.75 | 3 | 6 16:31 → 3.18 (93); 10 14:57 → 1.50 (95); 26 8:37 → 2.75 (128) | 7.74 | 0.36 | 0.58 | 7.0 |

**¿Es defendible ante un jurado de NASA lo que la página muestra de ellas?**
- **P0757, «2.11 mm/day … Aug 2026»:** sí, como estimación satelital, si la ficha dice que sale de dos sobrevuelos (1.57 y 2.66) y lleva a la vista el aviso de que no es una medición en la parcela. No es defendible como «lo que consume esta alfalfa» ni junto a un 28 %.
- **P0632, «0.66 mm/day … Aug 2026»:** el número es fiel, pero es el de un campo sin cultivo (NDVI 0.20), con dos pasos que dan 0.14 y 1.17. Un jurado lo leerá como la ET del cereal. Lo defendible es decir que ECOSTRESS no tuvo paso despejado mientras el cereal estuvo verde.
- **L0175, «2.75 mm/day … Aug 2026»:** sí, como estimación satelital de tres sobrevuelos (3.18, 1.50 y 2.75). La pregunta esperable es por qué una huerta adulta marca 2.75 en agosto frente a los 7.74 del modelo. La respuesta honesta: no se sabe cuánto viene del producto, del píxel o del riego; la cifra no entra en ningún cálculo de la herramienta. El valor de mayo (0.78, `razon` 0.09) no debe mostrarse: es un solo paso a las 6:52.

## Hallazgos

No hay hallazgos críticos: ninguna cifra entregada difiere del crudo y ninguna cifra mostrada difiere del CSV.

**Para la sesión de datos (el archivo, el script y `docs/ecostress.md`)**

- **D1 · IMPORTANTE · 1,438 de 6,167 valores (23.3 %) salen de un solo paso cercano a la salida o a la puesta del sol** (x menor que 0.15 o mayor que 0.85), donde el producto multiplica el flujo instantáneo entre 2.7 y 3.2 veces lo que al mediodía. Son todo julio (180), todo enero y mayo de Lázaro Cárdenas (293 y 295), 404 de enero y 266 de mayo en Delicias–Saucillo. Evidencia de que esos pasos pesan poco como señal de parcela: el del 28-dic tiene correlación 0.04 con el NDVI; el del 8-oct, 0.35, frente a 0.54–0.81 de los otros de octubre; el del 2-jul tiene una dispersión entre modelos 2.8 veces el flujo. Todos los valores de una sola escena del archivo (1,483) salen de uno de esos pasos (1,438) o del paso del 20-may (45; ver D2). `E1:113`.
- **D2 · IMPORTANTE · El rótulo «clear days» no se cumple en dos pasos.** El 20-may, 464 de 940 puntos de Delicias–Saucillo y los 299 de Lázaro Cárdenas tienen `cloud` = 1; los 476 puntos restantes dan una mediana de 0.47 mm/día. En las 431 parcelas que tienen también el paso del 1-may, el del 20 es menor en 411 (medianas 0.49 y 1.01). El 2-jul, 539 de 940 y 295 de 299 puntos tienen nube. Mayo queda en 0.35–0.38 de SSEBop cuando los demás meses quedan entre 0.76 y 1.69. `E1:90`; `docs/ecostress.md:17`.
- **D3 · IMPORTANTE · `ETinstUncertainty` se pidió, está en el crudo, no se usa y está mal descrita.** No va «de 20 a 45» W/m²: mediana 87, percentil 90 de 231, máximo 431. Frente al flujo instantáneo que implica `ETdaily`, la dispersión entre los cuatro modelos tiene mediana 0.77 y es igual o mayor que el flujo en el 36.7 % de los pasos (7,322 de 19,953). `docs/ecostress.md:26`; `E1:24`.
- **D4 · IMPORTANTE · No se comprobó la ubicación de las escenas.** NASA LP DAAC avisa de errores de hasta 7 km en escenas sin corregir y de que la marca de calidad de ubicación no viaja a los productos de nivel 3. Dos indicios en los datos: en las 85 parcelas con las dos escenas del sobrevuelo del 26-ago (52 segundos entre una y otra, mismo punto), `ETdaily` difiere 0.05 mm/día en la mediana, más de 0.44 en una de cada diez y hasta 2.13 (P0190: 1.60 y 3.73). Y el punto pedido (`representative_point()`, `E0:32`) queda a menos de 35 m del lindero en 234 parcelas (19 %) y a menos de 70 m en 609 (49 %); la mediana es 73 m. Con una celda de 70 m, en esas parcelas el píxel puede incluir al vecino, un camino o un canal.
- **D5 · IMPORTANTE · `n_escenas` cuenta renglones y no sobrevuelos.** El sobrevuelo del 26-ago aparece como dos escenas. En 85 parcelas de Delicias–Saucillo cuenta dos veces: 81 dicen 3 escenas con 2 sobrevuelos y 4 dicen 2 con 1. La mediana se va hacia ese sobrevuelo: cambia en 81 parcelas, más de 0.25 mm/día en 43 y hasta 1.69. Ejemplo: P0290 entrega 0.22 (pasos 3.60, 0.22 y 0.21); contando el sobrevuelo una vez sería 1.91. Agosto es el mes que muestra la página. `E1:113`, `E1:117`.
- **D6 · IMPORTANTE · Redacción: «uso real» y «mide».** `ETdaily` es una estimación de un conjunto de modelos, de las horas de luz. `docs/ecostress.md:46-47`; `E1:27`. La frase «va en la misma dirección que SSEBop» necesita sus cifras (fila 2j).
- **D7 · MENOR · Precisiones.** «Pasos de 7 a 17 h» (`E1:16`): van de 6.5 a 16.7 h. «Unos 31 pasos»: 34 escenas, 31 sobrevuelos, 20 con dato. Cuartiles de la tabla §4: decir el método.
- **D8 · IMPORTANTE · Citas sin respaldo en el repo.** La cita del producto (autores y año) y la del software de AppEEARS no se pudieron comprobar, y el README.md que AppEEARS genera con cada solicitud, que trae las dos citas, no está en `data/raw/reto/`.
- **D9 · MENOR · `razon` del cereal de invierno compara con suelo sin cultivo.** En diciembre, 12 de las 16 parcelas de cereal tienen NDVI menor que 0.3, y en enero, 8 de 16 (umbral ilustrativo del revisor). El calendario del modelo es un supuesto [S] y en P0632 va unos dos meses adelantado respecto al verdor observado.

**Para el integrador (la página y los textos)**

- **I1 · IMPORTANTE · La ficha no dice a la vista que es una estimación a 70 m ni cuántas escenas la respaldan.** `web/js/contexto.js:824-826`; `motor/contexto_web.py:618-627`; `web/app.js:2169`.
- **I2 · IMPORTANTE · En las 219 parcelas de barbecho y en las 16 de cereal de invierno (NDVI de agosto: mediana 0.19) el valor de agosto es el de un campo sin cultivo**, y en P0632, protagonista, se leerá como la ET del cereal. La regla que propone la sesión de datos elegiría enero (sección 4).
- **I3 · IMPORTANTE · El contraste con el modelo en la ficha puede leerse como validación o como déficit medido.** No mostrar cociente ni porcentaje (sección 4).
- **I4 · IMPORTANTE · `README.md:123` dice «Both were delivered and validated».** ECOSTRESS había pasado el esquema del buzón; la revisión independiente es esta y su veredicto es «validado con correcciones». Además, `README.md:143`, `docs/pitch/textos_envio.md:170` y `data/recursos_reto.json` (`papel`) describen un contraste con el modelo que la ficha no muestra.
- **I5 · IMPORTANTE · Falta el texto de la cita del software AppEEARS.** En `40c01ec`, `README.md`, `DATA_LICENSE.md` y `docs/pitch/textos_envio.md` decían «through AppEEARS» y citaban el producto, sin nombrar la cita del software («AppEEARS Team (2026), … Ver. 3.137») que pide el correo de AppEEARS. En `6041f51` ya está declarada como pendiente: `README.md:286` («The software citation that AppEEARS asks for is not recorded in this repository: to be confirmed»), `DATA_LICENSE.md:133` y `docs/pitch/textos_envio.md:18` y `:265`. Sigue faltando el texto. `fuentes.json` dice «via AppEEARS v3.137», que no es la cita.
- **I6 · MENOR · `LIMITATIONS.md:55`, «ECOSTRESS points the same way on clear days».** Se usa como apoyo de que el distrito opera con menos agua que la del modelo. Parte de esa distancia puede venir de cómo el producto arma el valor diario.
- **I7 · MENOR · Esquema.** `zona`, `etc_modelo_mm` y `razon` entran sin validar. Si la página va a leer alguna, hay que declararla.

## No verificado (no lo abrí; no darlo por bueno)
- La página del producto en LP DAAC y su DOI: autores, año y texto de la cita; qué unidad anuncia AppEEARS para `ETdaily`; la versión 3.137 y los ID de las solicitudes.
- El formato de la cita del software AppEEARS. El buscador resume que la página de AppEEARS pide citar el software y los productos, y que las dos citas vienen en el README.md de cada solicitud; no vi el texto.
- Pierrat et al. 2025 (exactitud de la ET de la colección 2): solo el resumen del buscador. La página de PyPI del paquete `ECOv002-calval-tables` confirma el título, los autores principales, la revista y el DOI.
- La marca de calidad de ubicación de las 21 escenas con dato: hace falta la sesión de Earthdata.
- La alineación exacta de la malla de 70 m con cada parcela. La distancia al lindero es una aproximación en plano; no calculé qué píxel cae en cada punto.
- La media exacta de una curva senoidal (2/π) frente a la constante 1.6 del código es aritmética del revisor; no abrí los artículos que el código nombra (Verma, Bisht, Lagouarde).
- El Kc constante de 0.95 de la alfalfa en diciembre y enero, y el Kc de nogal: son del modelo A5, fuera de esta revisión.
- No corrí `E0` (necesita `shapely`, que no está instalado aquí) ni `correr_todo.py`. Comprobé por otro camino que los puntos de la solicitud caen dentro de su parcela y coinciden con el crudo.
- No abrí la página en un navegador: leí el texto de la ficha con la función `evidenciaDeParcela` de `web/js/contexto.js` sobre `web/data/contexto.json`.

Para cerrar los tres puntos iniciales hay que habilitar en la red de la sesión `doi.org`, `lpdaac.usgs.gov`, `www.earthdata.nasa.gov`, `appeears.earthdatacloud.nasa.gov` y `agupubs.onlinelibrary.wiley.com`. El cuarto necesita, además, la sesión de Earthdata.

## Veredicto global: **VALIDADO CON CORRECCIONES**

Lo que queda validado: el archivo es exactamente lo que su script dice (6,167 de 6,167 valores recalculados desde los crudos, diferencia máxima 0.00); la unidad es mm/día, comprobada en el código de JPL; el producto, la capa, la celda de 70 m y la integración de la salida a la puesta del sol coinciden con la guía; la página muestra el valor del CSV; los pasos lejos de la salida y de la puesta del sol distinguen las parcelas verdes de las que no lo están.

Lo que hay que corregir: el control de calidad de los pasos (hora, nube alrededor, sobrevuelos repetidos, ubicación), la descripción de la incertidumbre, la redacción de «uso real», las citas, y lo que la ficha deja ver junto a la cifra. Hasta que llegue la reentrega, los valores de enero, mayo y julio no deben mostrarse ni usarse en un contraste. Los de octubre, diciembre y agosto pueden mostrarse como estimación satelital, con su número de sobrevuelos y su aviso.

## Correcciones que debe hacer la sesión de datos
1. `E1`: un sobrevuelo, un valor. Agrupar por parcela las escenas separadas por menos de 5 minutos, promediarlas y después sacar la mediana del mes. `n_escenas` pasa a contar sobrevuelos (D5).
2. `E1`: dejar fuera los pasos cercanos a la salida y a la puesta del sol, o los pasos en que la dispersión entre modelos supera al flujo. El umbral va en `supuestos.json` como supuesto [S] con su explicación. Con el corte de esta revisión (x menor que 0.15 o mayor que 0.85) quedan 4,729 valores y se vacían 1,438: 697 de enero, 561 de mayo y 180 de julio (D1).
3. `E1`: dejar fuera los pasos con buena parte de los puntos de la zona bajo nube (20-may y 2-jul), con el umbral como supuesto [S]. Con las correcciones 2 y 3, mayo y julio quedan vacíos y enero queda con 536 parcelas de un sobrevuelo (D2).
4. `ecostress_parcelas.csv`: agregar por parcela y mes el mínimo y el máximo de los pasos usados y la mediana de `ETinstUncertainty`, para que la ficha pueda escribir el intervalo. Avisar al integrador de las columnas nuevas (D3, I1).
5. `docs/ecostress.md:26`, `E1:24` y la línea de LEEME: corregir «de 20 a 45»; escribir que es la desviación estándar entre cuatro modelos y su distribución (D3).
6. `docs/ecostress.md` §4 y `E1:27`: «estimación satelital» en lugar de «uso real» y «mide la ET real». Agregar que `ETdaily` integra las horas de luz y que el producto la obtiene de un instante con una curva senoidal. Quitar o marcar las columnas de mayo y julio de la tabla. Dar el contraste con SSEBop con cifras (D6, fila 2j).
7. Ubicación: sacar la marca `Geolocation Accuracy QA` de las 21 escenas con dato con el script de `nasa/ECOSTRESS-Data-Resources` (necesita la sesión de Earthdata del equipo) y dejar fuera las marcadas «Suspect» o «No Match». Si no alcanza el tiempo, escribirlo como límite en `docs/ecostress.md`. Agregar al CSV la distancia del punto al lindero, o marcar las parcelas donde es menor que una celda (D4).
8. Citas: guardar en `data/raw/reto/` el README.md de cada solicitud de AppEEARS y copiar de ahí, textual, la cita del producto y la del software a `docs/ecostress.md` y a la línea de LEEME. Poner el título completo del producto (D8).
9. `etc_modelo_mm` y `razon` del cereal de invierno: dejarlos vacíos, o marcarlos, en los meses en que el NDVI de HLS de la parcela indica suelo sin cultivo (D9).
10. Precisiones: «de 6.5 a 16.7 h»; «34 escenas, 31 sobrevuelos, 20 con dato»; método de los cuartiles; una frase de exactitud con fuente abierta o «no evaluada» (D7, fila 1i).

## Correcciones que debe hacer el integrador
1. `motor/contexto_web.py` (`bloque_ecostress`): llevar `n_escenas` a `contexto.json` y, cuando lleguen, el intervalo entre pasos. `web/js/contexto.js`: escribirlos. Texto propuesto, con todas las cifras leídas del JSON: «2.11 mm/day in Aug 2026, from 2 clear overpasses (1.57 to 2.66)»; con un solo sobrevuelo, «from 1 clear overpass», sin la palabra «median» (I1).
2. Aviso a la vista junto al valor, como el de GEDI: «Satellite estimate at 70 m on clear days, not a field measurement.» La resolución debe salir de los datos y no del JavaScript (regla 3 de `CLAUDE.md`) (I1).
3. No mostrar en la ficha el cociente ni un porcentaje frente al modelo. Si se muestran las dos cifras, que lleven «different quantities; not a validation» y solo en meses con dos o más sobrevuelos. Mientras no llegue la reentrega, que la ficha no tome enero, mayo ni julio (I3).
4. P0632 y las demás parcelas sin cultivo en el mes mostrado: no aplicar «el último mes con `etc_modelo_mm`». Decir lo que hay: «ECOSTRESS: no clear overpass while this field was green (Feb–Apr 2026)», derivado de los meses con NDVI alto en `ndvi_mensual.json` y los meses con dato de ECOSTRESS; o dejar agosto con una nota, leída de los datos, de que el campo estaba sin cultivo (I2).
5. `README.md:123`: cambiar «delivered and validated» por entregado, con revisión independiente del 15-nov y veredicto «validated with corrections» (`docs/revisiones/2026-11-15_ecostress.md`). `README.md:143`, `docs/pitch/textos_envio.md:170` y `data/recursos_reto.json`: describir lo que la ficha muestra (I4).
6. Sustituir «to be confirmed» por la cita del software AppEEARS en `README.md:286`, `DATA_LICENSE.md:133` y `docs/pitch/textos_envio.md:265`, copiada del README.md que AppEEARS genera con la solicitud y no armada a mano (I5).
7. `LIMITATIONS.md:55`: matizar. Propuesta: «ECOSTRESS reads lower than the modeled ETc on clear days; part of that gap can come from how the product builds its daily value, so it is not counted as evidence of how much water the district uses.» `LIMITATIONS.md:99`: agregar que entre los pasos de un mes la diferencia típica es de 1 mm/día y que la ubicación de cada escena no se comprobó (I6).
8. `motor/esquemas.py`: declarar las columnas adicionales que la página vaya a leer (I7).

## Cómo se rehizo
Scripts del revisor (`docs/revisiones/2026-11-15_ecostress_scripts/`; reciben sus rutas de entrada como argumentos y no forman parte de `python construir.py`): `01_csv.py` (esquema, llaves y rangos), `03_reproducir.py` (recálculo de `et_mm_dia` y `n_escenas`), `04_modelo_y_doc.py` (ETc del modelo y afirmaciones del documento), `05_incertidumbre.py` (dispersión entre modelos, ETo y SSEBop), `06_ndvi_por_paso.py` (señal por paso y efecto de las correcciones 1 y 2), `07_puntos.py` (puntos de la solicitud), `08_tabla_pasos.py` y `09_protagonistas.py` (tablas de este informe). Entradas: los crudos de `adc6157` y `data/processed/` de `6041f51` (los archivos usados son iguales en `40c01ec`). Los scripts se corrieron dos veces, la segunda sobre la copia fija de `6041f51`, con resultados idénticos.
