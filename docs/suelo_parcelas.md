# Suelo por parcela con mapas globales (SoilGrids y OpenLandMap)

> Pieza A13 (14-nov-2026). Entrega: `suelo_parcelas.csv`. Script: `datos/colab/A13_suelo_parcelas.py`.
> Crudo: `data/raw/reto/suelo_soilgrids_<zona>.csv` (consulta en Earth Engine: `datos/earthengine/suelo.js`).
> Es una estimación regional de un modelo global: no es un análisis de suelo de la parcela.

## 1. Qué trae
Para cada parcela de las dos zonas piloto, de 0 a 30 cm de profundidad:

| Columna | Qué es | Fuente |
|---|---|---|
| `arena_pct`, `limo_pct`, `arcilla_pct` | Fracciones de textura (%) | SoilGrids 2.0 |
| `textura_usda` | Clase del triángulo de textura del USDA, calculada con esas fracciones | SoilGrids 2.0 + límites del USDA-NRCS |
| `textura_olm` | Clase de textura de otro mapa, a 0 cm (para comparar) | OpenLandMap |
| `ph` | pH en agua | SoilGrids 2.0 |
| `carbono_organico_g_kg` | Carbono orgánico (g/kg) | SoilGrids 2.0 |
| `cic_cmol_kg` | Capacidad de intercambio catiónico (cmol(c)/kg) | SoilGrids 2.0 |
| `n_celdas`, `distancia_celda_m` | Cuántas celdas de 250 m caen dentro de la parcela; si ninguna, distancia a la más cercana | — |

Abreviaturas de textura: Sa arena, LoSa arena franca, SaLo franco arenoso, Lo franco, SiLo franco limoso, Si limo,
SaClLo franco arcillo-arenoso, ClLo franco arcilloso, SiClLo franco arcillo-limoso, SaCl arcilla arenosa,
SiCl arcilla limosa, Cl arcilla.

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

## 5. Lo que falta para decir «qué cultivo es más apto para este suelo»
El suelo por parcela ya está. Falta la tabla de requisitos por cultivo (pH, textura, temperatura) con fuente: la base
ECOCROP de la FAO, y el índice de aptitud GAEZ (FAO/IIASA), que ya combina suelo y clima y es una de las bases del reto.
Las dos requieren una descarga que no se ha autorizado. Con lo que hay, el suelo distingue poco entre parcelas vecinas
(misma clase de textura y mismo pH en casi toda la zona): sirve para describir la zona y para llevar la herramienta a
otra región, más que para ordenar cultivos dentro de una misma zona.
