<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Suelo por parcela con mapas globales (SoilGrids y OpenLandMap)

> Pieza A13 (14-nov-2026). Entrega: `suelo_parcelas.csv`. Script: `datos/colab/A13_suelo_parcelas.py`.
> Crudo: `data/raw/reto/suelo_soilgrids_<zona>.csv` (consulta en Earth Engine: `datos/earthengine/suelo.js`).
> Es una estimación regional de un modelo global: no es un análisis de suelo de la parcela.

## 1. Qué trae
Para cada parcela de las dos zonas piloto, de 0 a 30 cm de profundidad (contrato del integrador:
`docs/decisiones/2026-11-14_suelo_aptitud.md`):

| Columna | Qué es | Fuente |
|---|---|---|
| `arena_pct`, `limo_pct`, `arcilla_pct` | Fracciones de textura (%) | SoilGrids 2.0 |
| `clase_textura` | Clase del triángulo de textura del USDA (en inglés), calculada con esas fracciones | SoilGrids 2.0 + límites del USDA-NRCS |
| `ph` | pH en agua | SoilGrids 2.0 |
| `carbono_organico_g_kg` | Carbono orgánico (g/kg) | SoilGrids 2.0 |
| `nitrogeno_g_kg` | Vacío: el valor del mapa no es creíble (ver límites) | — |
| `cic_cmol_kg` | Capacidad de intercambio catiónico (cmol(c)/kg) | SoilGrids 2.0 |
| `salinidad_ce_ds_m` | Vacío: ningún producto de los dos trae conductividad eléctrica | — |
| `profundidad_cm` | `0-30` | — |
| `n_celdas` | Celdas de 250 m con centro dentro de la parcela (0 = se usó la más cercana) | — |
| `zona`, `clase_textura_olm`, `distancia_celda_m` | Adicionales: zona, clase de textura de OpenLandMap a 0 cm (para comparar) y distancia a la celda usada cuando `n_celdas` = 0 | OpenLandMap |

## 2. Resultado
| Zona | Parcelas con dato | Textura (SoilGrids) | Arena % (P10 / P50 / P90) | Arcilla % | pH | Carbono orgánico g/kg | CIC cmol(c)/kg |
|---|---|---|---|---|---|---|---|
| Delicias–Saucillo | 939 de 940 | franco arcillo-arenoso 602, franco arcilloso 337 | 41.0 / 47.1 / 52.5 | 25.2 / 29.5 / 32.4 | 8.1 / 8.1 / 8.2 | 8.7 / 10.4 / 12.2 | 16.3 / 17.8 / 19.8 |
| Lázaro Cárdenas | 299 de 299 | franco arcillo-arenoso 219, franco arenoso 80 | 55.5 / 57.7 / 60.2 | 19.1 / 22.4 / 24.8 | 8.0 / 8.1 / 8.2 | 8.1 / 9.6 / 11.1 | 18.1 / 19.5 / 21.9 |

Lectura: suelos de textura media a moderadamente fina, alcalinos (pH cercano a 8) y con poca materia orgánica
(alrededor de 1 % de carbono orgánico). Lázaro Cárdenas es más arenoso que Delicias–Saucillo.

## 3. Límites (deben ir a la vista si esto se muestra)
- **Celdas de 250 m (~6 ha):** una parcela chica cabe en una sola celda; 229 de 1,238 parcelas no contienen el centro de
  ninguna celda y toman la más cercana. Dos parcelas vecinas casi siempre reciben el mismo valor.
- **Es un modelo, no una medición:** ISRIC declara que sus modelos explican entre 30 % y 70 % de la variación y que la
  exactitud «is still limited». No sustituye un análisis de suelo.
- **Los dos mapas de textura no coinciden:** la clase calculada con SoilGrids y la de OpenLandMap son iguales en 584 de
  1,238 parcelas (47 %); en las demás difieren a una clase vecina. Lo que sí sostienen los dos es el grupo: texturas
  medias a moderadamente finas, sin arenas ni arcillas pesadas.
- **Nitrógeno: no se entrega.** El mapa da ~10 g/kg de nitrógeno total con ~10 g/kg de carbono orgánico (relación C:N
  cercana a 1), que no es creíble para un suelo agrícola. Queda solo en el crudo.
- **No hay hierro, zinc ni otros micronutrientes** en estos mapas, ni salinidad medida. No se puede decir por parcela
  si falta hierro; solo que el pH alto es la condición en que suele haber menos hierro y zinc disponibles, y eso
  necesita una fuente agronómica antes de mostrarse.
- Una parcela (P0316) queda sin dato: sus celdas están enmascaradas en SoilGrids.

## 4. Fuentes
- Poggio, L. et al. (2021). SoilGrids 2.0: producing soil information for the globe with quantified spatial uncertainty.
  *SOIL* 7, 217–240. DOI 10.5194/soil-7-217-2021. CC-BY 4.0. Earth Engine: `projects/soilgrids-isric/<propiedad>_mean`.
  Unidades y factores: https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html (leída el 14-nov-2026).
- Hengl, T. (2018). Soil texture classes (USDA system) for 6 soil depths at 250 m (v02). Zenodo.
  DOI 10.5281/zenodo.1475451. CC-BY-SA 4.0. Earth Engine: `OpenLandMap/SOL/SOL_TEXTURE-CLASS_USDA-TT_M/v02`.
- Límites de las clases de textura: Benham, E., Ahrens, R.J. y Nettleton, W.D. (2009), *Clarification of Soil Texture
  Class Boundaries*, USDA-NRCS; leídos en https://soilwater.github.io/pynotes-agriscience/exercises/soil_textural_class.html
  el 14-nov-2026.

## 5. Comprobación con una fuente local
- No hay a la mano un análisis de suelo de las parcelas ni la carta edafológica del INEGI (no se descargó).
- Sí hay una fuente local sobre el pH: en análisis de suelo de huertas de nogal de Delicias, Saucillo, Meoqui, Rosales y
  Julimes (2018 a mayo de 2021), «solo el 14% de los suelos tienen un pH de 6.7 a 7.3» y el resto es alcalino
  (Gutiérrez González et al., 2022, *Revista Biológico Agropecuaria Tuxpan* 10(1), DOI 10.47808/revistabioagro.v10i1.395;
  resumen leído el 14-nov-2026). El mapa da pH 8.1 en casi toda la zona: coincide a grandes rasgos (suelo alcalino).
- Las tres protagonistas: P0757 y P0632, franco arcillo-arenoso, pH 8.1; L0175, franco arenoso, pH 7.6. Nada fuera de lo
  esperable para un valle árido de suelos calcáreos. La textura no se pudo comparar con una fuente local.
- Lo único que el mapa da fuera de lo creíble es el nitrógeno, y por eso no se entrega.

## 6. Requisitos por cultivo y lo que resulta al cruzarlos (`suelo_requisitos.json`)
Script: `datos/colab/B6_suelo_requisitos.py`. Rangos leídos el 14-nov-2026 en las fichas de FAO ECOCROP y en las páginas
«Crop information» de FAO Tierras y Aguas; salinidad de FAO-29 (la misma de `opciones_b3.json`).

| Cultivo | pH óptimo | pH tolerado | Textura limitante | Fuente del pH |
|---|---|---|---|---|
| alfalfa | 6.5–7.5 | 4.3–8.7 | pesadas (arcilla, arcilla arenosa, arcilla limosa) | ECOCROP, *Medicago sativa* |
| chile | 5.5–6.8 | 4.5–7.0 | pesadas | ECOCROP, *Capsicum annuum*; FAO Tierras y Aguas: óptimo 5.5–7.0 |
| algodon | 7.0–8.0 | 5.5–8.0 | ninguna | FAO Tierras y Aguas, Cotton |
| maiz_forrajero | 5.0–7.0 | 4.5–8.5 | arcilla y arena | ECOCROP, *Zea mays* |
| sorgo | 5.5–7.5 | 5.0–8.0 | ninguna | ECOCROP, *Sorghum bicolor* |
| cereal_invierno (avena) | 5.0–6.0 | 4.5–7.5 | ninguna | ECOCROP, *Avena sativa* |
| nogal | sin rango publicado | sin rango publicado | — | no se encontró ficha |

Al cruzar esos rangos con el pH del mapa en las 1,238 parcelas con dato (solo pH; ninguna parcela tiene una textura
limitante):

| Cultivo | Dentro del óptimo | Tolerado | Fuera del rango |
|---|---|---|---|
| alfalfa | 27 | 1,211 | 0 |
| maiz_forrajero | 0 | 1,238 | 0 |
| algodon | 120 | 0 | 1,118 |
| sorgo | 27 | 93 | 1,118 |
| cereal_invierno | 0 | 27 | 1,211 |
| chile | 0 | 0 | 1,238 |

**Cómo leerlo, y por qué no debe usarse como filtro:**
- El chile, el sorgo, el algodón y la avena se siembran en este distrito y aquí salen «fuera del rango». No es que no se
  den: los rangos son generales y mundiales, y el pH del mapa es de un modelo de 250 m.
- En algodón y sorgo la diferencia es de una décima (pH del mapa 8.1 frente a un máximo de 8.0): menor que la
  incertidumbre de cualquier mapa de suelo. No sostiene un «fuera del rango».
- El suelo casi no cambia entre parcelas vecinas: esta comparación no ordena cultivos parcela por parcela. Lo que sí
  dice es algo de la zona entera: suelo alcalino, por encima del óptimo general de casi todos los cultivos.
- Nogal: en las huertas del distrito, la mayoría de los suelos analizados tenía poco nitrógeno, fósforo, zinc, hierro y
  cobre (Gutiérrez González et al., 2022). Es un hallazgo del distrito, no de la parcela: «needs a soil test».

## 7. Lo que falta
- El índice de aptitud GAEZ (FAO/IIASA), que combina suelo y clima y es una de las bases del reto: requiere una descarga
  del portal de la FAO que no se ha autorizado.
- Hierro, zinc, fósforo, potasio y salinidad por parcela: no hay mapa abierto; solo con análisis de suelo.
