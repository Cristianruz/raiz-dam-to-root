<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Tipos de suelo y nutrientes, escalable a cualquier región

> Pieza B7 (14-nov-2026). Script: `datos/colab/B7_suelo_tipos.py`. Entregas: `suelo_tipos.json`, `suelo_reglas.json` y
> `suelo_nutrientes_parcelas.csv`. Se apoya en `suelo_parcelas.csv` (A13, SoilGrids) y `suelo_requisitos.json` (B6).
> Pedido de Cristian: que el sistema contemple los tipos de suelo que existen, en qué nutrientes son ricos o pobres y qué
> cultivos les van, y que no sirva solo para Delicias.

## 1. Diseño en tres capas
1. **Tipo de suelo = contexto del paisaje.** Catálogo mundial: los 32 grupos de la WRB y los 12 órdenes de la Soil Taxonomy
   del USDA. Dice cómo suele ser un suelo de ese tipo; no dice qué nutrientes tiene una parcela concreta.
2. **Propiedades de la parcela → reglas con fuente.** Con el pH, el carbono orgánico, la CIC y la textura que da SoilGrids para
   cada parcela, unas reglas publicadas (NOM-021-SEMARNAT-2000 y MSU Extension) dicen qué nutrientes suelen estar menos
   disponibles y en qué clase cae cada propiedad.
3. **Cultivo → avisos.** Avisos de nutrientes con fuente para nogal, maíz forrajero, alfalfa y avena (NMSU, Illinois). Los
   rangos de pH, textura y salinidad de cada cultivo ya están en `suelo_requisitos.json` (FAO ECOCROP, FAO-29).

Por qué así: los mapas mundiales de **clases** de suelo sirven para describir la región, pero no para afirmar qué nutrientes
tiene una parcela; lo defendible por parcela es combinar propiedades estimadas con reglas que tengan fuente. Es la
recomendación del informe de investigación del 14-nov-2026.

## 2. Catálogo de tipos de suelo (`suelo_tipos.json`)
- **WRB, 32 grupos.** 30 con ficha resumida de Driessen et al. (2001), *Lecture Notes on the Major Soils of the World* (FAO,
  World Soil Resources Reports 94): rasgo diagnóstico, textura, pH, CIC, materia orgánica, nutrientes en que es rico o pobre
  (solo los que la fuente nombra), toxicidades, fijación de fósforo, limitaciones, cultivos que la fuente cita y extensión
  mundial. Technosols y Stagnosols no tienen ficha (no existían en la versión de la WRB que describe la obra). La ficha de
  Retisols es la de los Albeluvisols de la obra; la equivalencia es [P].
- **USDA, 12 órdenes**, con su elemento formativo (Moorberg y Crouse 2017) y una definición y nota de fertilidad de páginas
  universitarias [P]; y **19 prefijos de gran grupo** con su significado (SSSA, Glossary of Soil Science Terms, Tabla A2). Con
  eso, el nombre de un gran grupo se lee solo: *Haplocalcids* = prefijos *haplo* + *calc* + suborden *Calcids*, del orden
  Aridisols por su terminación *-ids*; *calc* remite a la regla de carbonatos.
- **Zona:** suelos del municipio de Delicias según el Plan Municipal de Desarrollo 2024–2027, que cita la carta edafológica del
  INEGI (2016): Cambisol 29.25 %, Calcisol 27.81 %, Kastañozem 25.72 %, Chernozem 10.47 %, Luvisol 2.38 % y el resto menos del
  1 % cada uno.

Resumen del catálogo (lo que la fuente nombra; cada grupo trae más en el archivo):

| Grupo WRB | Rico en | Pobre en | Toxicidad o limitación principal |
|---|---|---|---|
| Calcisol | Ca, Mg | Fe, Zn (necesidades de fertilizante en hortalizas) | sequedad, capa petrocálcica, costra |
| Cambisol | fertilidad química satisfactoria | — | poca profundidad o pendiente en algunos |
| Kastañozem | Ca, Mg (químicamente rico) | — | falta de humedad; salinización con riego |
| Chernozem | N, Ca, Mg | P (solo en parte disponible) | erosión, veranos secos |
| Feozem | fértil | — | sequías, erosión |
| Luvisol | fértil, bases altas | — | superficies limosas que se degradan |
| Vertisol | Ca, Mg | N, P; S y Zn en partes | arcilla que se agrieta, encharcamiento |
| Gypsisol | Ca | N, P, K; con mucho yeso, menos P, K y Mg | hundimientos, costra |
| Solonchak | — | las sales bajan la disponibilidad | Na, Cl |
| Solonetz | — | el sodio estorba la absorción | Na; horizonte denso |
| Durisol | — | Fe extraíble | capa cementada; Na |
| Fluvisol | buena fertilidad natural | P y N (ácidos sulfatados) | inundación, salinidad |
| Arenosol | bases (zonas secas) | poca capacidad de guardar nutrientes | poca agua, erosión |
| Regosol | — | — | sequía, costra |
| Leptosol | — | — | poca profundidad, piedras |
| Gleysol | P y K (en depresiones) | — | exceso de agua; Fe2+, Mn2+ |
| Andosol | fértil | P (fijación) | pendiente, baja capacidad de carga |
| Histosol | gran reserva de N, poco disponible | P, K, S, Cu, Zn, Mn, Mo, Fe | acidez, hundimiento |
| Antrosol | bases (irrágricos); P (hórticos) | nutrientes (plágicos) | sales en algunos irrágricos |
| Criosol | — | N, K, P | permafrost |
| Podzol | — | P y nutrientes en general | Al, acidez fuerte |
| Plintosol | Fe | fertilidad baja | plintita que se endurece |
| Planosol | — | fertilidad baja | Al; encharcamiento |
| Nitisol | Fe | P disponible | sorción de P |
| Ferralsol | Fe | N, K, Ca, Mg, S, micronutrientes | Al; fijación de P |
| Umbrisol | fertilidad moderada por la materia orgánica | — | acidez, pendiente |
| Retisol | — | nutrientes, bases | Al, acidez |
| Acrisol | — | nutrientes escasos | Al; sorción de P |
| Lixisol | — | reservas de nutrientes | costra, erosión |
| Alisol | Mg a veces | Ca, K | Al, Mn |

## 3. Reglas con fuente (`suelo_reglas.json`)
| Regla | Qué dice | Fuente |
|---|---|---|
| Clases de pH | fuertemente ácido < 5.0; moderadamente ácido 5.1–6.5; neutro 6.6–7.3; medianamente alcalino 7.4–8.5; fuertemente alcalino > 8.5 | NOM-021, AS-02 |
| Disponibilidad según el pH | N, K, Ca, Mg y S más disponibles con pH 6.5–8; P con 5.5–7.5; B, Cu, Fe, Mn, Ni y Zn con 5–7; con pH menor que 5.5, Al y Mn pueden ser tóxicos; el Fe se vuelve casi insoluble cerca de pH 8 | MSU Extension 4449-8 |
| Margen | un nutriente queda «less available» si el pH sale de su rango por más de 0.5 y «near the limit» si sale por menos | `suelo_margen_ph` [S] |
| Materia orgánica | MO = C orgánico × 1.724; clases para suelos no volcánicos y volcánicos | NOM-021, AS-07 |
| CIC | muy baja < 5; baja 5–15; media 15–25; alta 25–40; muy alta > 40 cmol(+)/kg | NOM-021, AS-12 |
| Carbonatos | clases de muy bajo (< 0.5 %) a muy alto (> 40 %); «altos contenidos pueden inducir deficiencias de fósforo, zinc, hierro y/o manganeso» | NOM-021, AS-30 |
| Salinidad | clases de CE y definiciones de suelo salino (CE ≥ 4 dS/m), sódico (PSI ≥ 15) y salino-sódico | NOM-021, AS-18 y 4.8–4.10 |
| Análisis de suelo | clases de P Olsen y Bray, Ca, Mg y K intercambiables, Fe, Zn, Cu y Mn DTPA, boro y N inorgánico, para cuando el usuario capture un análisis | NOM-021 |
| Nogal | Zn poco disponible con pH mayor que 7.0 (aspersiones foliares cada primavera); Fe en suelos con 10–25 % de cal; Mn foliar; evidencia local de N, P, Zn, Fe y Cu bajos | NMSU H-658 y H-657; Gutiérrez González et al. 2022 |
| Maíz forrajero | Zn: pH mayor que 7.3, poca materia orgánica, textura gruesa o mucho P | Illinois Agronomy Handbook, Tabla 8.10 |
| Alfalfa | B: menos de 2 % de materia orgánica, pH alto, arena, sequía | Illinois Agronomy Handbook |
| Avena | Mn: pH alto, frío y humedad (la fuente no da cifra; se usa la clase «medianamente alcalino» [S]) | Illinois Agronomy Handbook |
| Chile, algodón, sorgo | sin fuente encontrada para avisos de micronutrientes: no se muestra ninguno | — |

## 4. Resultado en las dos zonas piloto (`suelo_nutrientes_parcelas.csv`)
| | Delicias–Saucillo | Lázaro Cárdenas |
|---|---|---|
| Parcelas con dato | 939 de 940 | 299 de 299 |
| pH (más frecuente) | 8.1 (694), 8.2 (171), 8.0 (27) | 8.1 (182), 8.2 (67), 8.0 (25) |
| Menos disponibles: P, B, Cu, Fe, Mn, Ni y Zn | 869 | 249 |
| Menos disponibles: B, Cu, Fe, Mn, Ni y Zn (P cerca del límite) | 51 | 42 |
| Ninguno fuera del margen (pH 7.5 o menos) | 19 | 8 |
| Materia orgánica estimada: medio / bajo | 797 / 142 | 232 / 67 |

- Protagonistas: P0757 y P0632, pH 8.1, menos disponibles P, B, Cu, Fe, Mn, Ni y Zn; L0175, pH 7.6, menos disponibles B, Cu,
  Fe, Mn, Ni y Zn, con P cerca del límite.
- **Concuerda con la fuente local:** en análisis de suelo de huertas de nogal de Delicias, Saucillo, Meoqui, Rosales y Julimes
  (2018–2021), la mayoría de los suelos salió baja en nitrógeno, fósforo, zinc, hierro y cobre, y solo el 14 % tuvo pH de 6.7 a
  7.3 (Gutiérrez González et al. 2022, resumen).
- **Materia orgánica:** SoilGrids da ~1 % de carbono orgánico, que con el factor 1.724 es ~1.8 % de materia orgánica («medio»).
  El informe de investigación cita mediciones regionales de 0.87–1.09 % [P, no verificado aquí]: SoilGrids podría estar alto. Si
  se muestra, mejor como «low to medium».

## 5. Cómo escala a otra región
1. Earth Engine: `datos/earthengine/suelo.js` con el rectángulo nuevo (SoilGrids y OpenLandMap son mundiales, 250 m).
2. `A13_suelo_parcelas.py` → propiedades por parcela; `B7_suelo_tipos.py` → reglas aplicadas y catálogo.
3. Las reglas de MSU y los requisitos de FAO (ECOCROP, FAO-29) son generales. Las clases de la NOM-021 son la norma mexicana:
   en otro país se usa su norma, y el archivo dice de dónde sale cada clase.
4. **Tipo de suelo por parcela (pendiente):** el gran grupo USDA de OpenLandMap (`OpenLandMap/SOL/SOL_GRTGROUP_USDA-SOILTAX_C/v01`,
   250 m, CC-BY-SA 4.0) y la unidad de HWSD v2 (`projects/sat-io/open-datasets/FAO/HWSD_V2_SMU`, ~1 km). Necesita correr Earth
   Engine en la computadora de Cristian, que no estaba conectada a las 18:50. Con el gran grupo, el orden y los prefijos se
   leen con las tablas del catálogo.

## 6. Límites (deben ir a la vista)
- **Riesgo por regla, no diagnóstico.** P, K, Zn, Fe, Mn, Cu y B disponibles, carbonatos y salinidad de una parcela solo se
  conocen con un análisis de suelo (la ficha: «needs a soil test»). No hay mapas abiertos fiables de esos valores por parcela.
- **SoilGrids es un modelo de 250 m:** ISRIC declara que sus modelos explican entre 30 % y 70 % de la variación; dos parcelas
  vecinas casi siempre reciben el mismo valor.
- **«Near the limit» de N, K, Ca, Mg y S:** con pH 8.1 el grupo queda a 0.1 de su rango general (6.5–8). En suelos calcáreos
  el Ca y el Mg dominan el complejo de cambio (Driessen et al. 2001, Calcisols): no conviene mostrar ese grupo en la ficha.
- Las fichas del catálogo son resúmenes propios de una obra de 2001 (WRB de 1998); las cifras se transcribieron como están.
- Chile, algodón y sorgo no tienen avisos de micronutrientes con fuente.
- GAEZ (aptitud de cultivos por clima y suelo, FAO) queda pendiente por la misma razón que el tipo de suelo por parcela.
- «Proteínas y vitaminas» son de la planta, no del suelo: el suelo aporta nutrientes minerales (N, P, K, Ca, Mg, S y
  micronutrientes), que es lo que cubre esta pieza.

## 7. Fuentes (leídas el 14-nov-2026)
- Driessen, P., Deckers, J., Spaargaren, O. y Nachtergaele, F. (eds.) 2001. *Lecture Notes on the Major Soils of the World*.
  World Soil Resources Reports 94, FAO. https://www.fao.org/4/y1899e/y1899e00.htm
- NOM-021-SEMARNAT-2000 (DOF 31-dic-2002). https://www.norlexinternacional.com/arch/N021ST00.htm
- McCauley, A., Jones, C. y Olson-Rutz, K. *Soil pH and Organic Matter* (4449-8). MSU Extension.
  https://apps.msuextension.org/publications/pub.html?sku=4449-8
- NMSU, Guide H-657 (rev. 2026), https://pubs.nmsu.edu/_h/H657/index.html, y Guide H-658 (rev. 2025), https://pubs.nmsu.edu/_h/H658.pdf
- *Illinois Agronomy Handbook*, cap. 8. http://extension.cropsciences.illinois.edu/handbook/pdfs/chapter08.pdf
- Gutiérrez González, L.S. et al. 2022. *Rev. Biológico Agropecuaria Tuxpan* 10(1), DOI 10.47808/revistabioagro.v10i1.395.
  https://agris.fao.org/search/en/records/67598d78c7a957febdfbf098
- Plan Municipal de Desarrollo de Delicias 2024–2027 (Periódico Oficial del Estado de Chihuahua, 2025).
  https://chihuahua.gob.mx/sites/default/atach2/periodico-oficial/anexos/2025-01/ANEXO%2003-2025%20ACUERDO%20N%C2%B0%20203-2024%20PMD%20DELICIAS.pdf
- SSSA, *Glossary of Soil Science Terms*, Appendix 1. https://agronomy.org/files/publications/soils-glossary/appendix-1.pdf
- Moorberg, C.J. y Crouse, D.A. 2017. *Soils Laboratory Manual*, cap. 4. https://kstatelibraries.pressbooks.pub/soilslabmanual/?p=31
- University of Idaho, *Twelve soil orders*. https://www.uidaho.edu/cals/soil-orders
- Lancaster University, *The Twelve Soil Orders of the World*. https://www.lancaster.ac.uk/lec/research/soil-science-knowledge/twelve-soil-orders/
- OpenLandMap, catálogo de Earth Engine. https://developers.google.com/earth-engine/datasets/catalog/OpenLandMap_SOL_SOL_GRTGROUP_USDA-SOILTAX_C_v01
- HWSD v2 en el catálogo comunitario de Earth Engine. https://gee-community-catalog.org/projects/hwsd/
