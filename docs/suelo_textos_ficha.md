<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Textos de la ficha para el suelo, el tipo de suelo y GAEZ (inglés)

> Lista para el integrador: un texto por caso. Viven en `suelo_reglas.json → textos_ficha_en` (la web los lee; no se
> escriben a mano). Los `{marcadores}` se llenan con los datos. Generado de ese JSON el 14-nov-2026.

## suelo

| caso | texto_en | cuándo |
|---|---|---|
| `aviso` | Rule-based risk from a global soil map; needs a soil test. | siempre que se muestre el renglón de suelo. |
| `menos_disponibles` | Less available at this soil pH: {nutrientes}. | menos_disponibles no está vacío. |
| `cerca_del_limite` | Near the edge of their best pH range: {nutrientes}. | solo en el detalle, con cerca_del_limite sin N, K, Ca, Mg ni S (decisión del integrador). |
| `sin_aviso_ph` | At this estimated pH, no nutrient falls outside its best availability range. | menos_disponibles y cerca_del_limite vacíos. |
| `toxicidad` | Below pH {ph_toxico}, aluminium and manganese can reach toxic levels. | toxicidad_posible no está vacío. Marcadores: `{ph_toxico}` = disponibilidad_ph.toxicidad_ph_menor_que.valor. |
| `hierro` | Iron becomes nearly insoluble as soil pH nears eight; chelated forms raise its availability. | Fe está en menos_disponibles (es disponibilidad_ph.texto_fe). |
| `materia_organica` | Organic matter (estimated): {clase}. | siempre que haya dato. Clases: muy bajo → very low, bajo → low, medio → medium, alto → high, muy alto → very high. |
| `cic` | Capacity to hold nutrients (CEC, estimated): {clase}. | siempre que haya dato. Clases: muy baja → very low, baja → low, media → medium, alta → high, muy alta → very high. |
| `sin_dato` | No soil estimate for this field. | ph vacío en suelo_nutrientes_parcelas.csv. |

## tipo_suelo

| caso | texto_en | cuándo |
|---|---|---|
| `zona` | Soils of the municipality (INEGI soil map): {lista}. | zona delicias_saucillo; {lista} = suelo_tipos.json → zona.municipio_delicias_pct, de mayor a menor. |
| `parcela` | Predicted soil great group for this field (OpenLandMap, global map): {gran_grupo} ({orden}). | gran_grupo_usda no está vacío en tipo_suelo_parcelas.csv. |
| `no_coinciden` | The two differ because they come from different maps; neither is a field survey. | cuando se muestren los dos. |
| `explica` | Regional soil type from a global map, not a soil test. | debajo del tipo de suelo. |

## gaez

| caso | texto_en | cuándo |
|---|---|---|
| `rotulo` | Regional ({km} km cells), FAO GAEZ v4; not field-level. | siempre con un valor de GAEZ. Marcadores: `{km}` = gaez_zona.csv → resolucion_m / 1000, redondeado. |
| `no_evaluado` | Not assessed by GAEZ. | chile y nogal (GAEZ v4 no los evalúa). |
| `maiz_grano` | GAEZ value for grain maize; no silage-maize layer was available for these settings. | maiz_forrajero (gaez_zona.csv → nota). |
| `cautela` | FAO advises treating these results in a conservative manner, at aggregation levels that match the resolution of the basic data. | en el detalle de GAEZ. |

Nombres de nutrientes en inglés (`nombres_nutrientes_en`): N = nitrogen, K = potassium, Ca = calcium, Mg = magnesium, S = sulfur, P = phosphorus, B = boron, Cu = copper, Fe = iron, Mn = manganese, Ni = nickel, Zn = zinc.

Avisos por cultivo: `suelo_reglas.json → cultivos.<cultivo>[*].texto_en` (nogal, maíz forrajero, alfalfa y avena), cada uno
con su condición y su fuente. Tipo de suelo de cada grupo: `suelo_tipos.json → wrb.<grupo>.texto_en` y `usda_ordenes`.

Fuente de la frase de cautela de GAEZ: FAO e IIASA, GAEZ v4 Frequently Asked Questions, versión 2.0, noviembre de 2022 (https://s3.eu-west-1.amazonaws.com/data.gaezdev.aws.fao.org/documentation/GAEZ4_FAQ.pdf), pregunta 13: «should be treated in a conservative manner» … «appropriate aggregation levels, which are commensurate with the resolution of basic data»; pregunta 16: «It is generally not recommended to calculate statistics at finer administrative levels with this version of the database.» (después de hablar del primer nivel subnacional), leído el 14-nov-2026
