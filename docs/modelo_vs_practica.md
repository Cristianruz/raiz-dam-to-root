<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# El modelo frente a lo que de verdad se riega en el DR-005

**Para qué es este documento.** H1 mostró que el modelo calcula cerca del doble del agua que salió de la presa. Aquí se
junta todo lo que se sabe del tamaño y la causa de esa diferencia, con datos **anteriores a 2026** y publicados, y se
deja en los datos una referencia local para que la herramienta la pueda mostrar. No cambia ningún veredicto.

## 1. Lo que calcula el modelo y lo que se publica para la región
Lámina en millares por hectárea (1 millar/ha = 10 cm). Zona Delicias–Saucillo, lluvia sin cambio.

| Cultivo | ETc del modelo (mm) | ET estimada en el DR-005 (mm) | Lámina bruta del modelo, P10–P90 | Recomendada por INIFAP | Aplicada en el DR-005, 2009–2016 | Modelo ÷ referencia local |
|---|---|---|---|---|---|---|
| Alfalfa | 1748 | 1139 | 23.13–35.16 (P50 28.4) | 17.0–18.0 | 17.4 | 1.63 |
| Nogal | 1198 | 1413 | 15.38–23.71 (P50 19.1) | — | 13.7 | 1.39 |
| Chile | 765 | 825 | 12.15–17.15 (P50 14.26) | 9.2 | 16.1 | 0.89 |
| Algodón | 824 | — | 11.57–18.29 (P50 14.66) | 6.8 | — | 2.16 |
| Maíz forrajero | 587 | — | 9.31–13.49 (P50 11.14) | 5.0–6.0 | — | 2.03 |

- «Aplicada» y «ET estimada»: Villalobos-Cano et al. 2024 (*Sustainability* 16(5):1851), medias 2009–2016 [V]. El artículo
  no dice en qué punto se midió el agua aplicada y calcula la ET con Hargreaves, no con Penman-Monteith.
- «Recomendada»: INIFAP (Agenda Técnica de Chihuahua 2017; paquete PT-0003 del chile; Folleto Técnico 53 del maíz forrajero) [V].
- La última columna divide el P50 del modelo entre la lámina aplicada (o, si no hay, entre la recomendada).
- Todas estas cifras están en `datos/supuestos.json`, bloque `lamina_local_cm`, con su fuente.

## 2. Qué dice la tabla
1. **El modelo no está «el doble de alto» en todo.** En alfalfa pide 1.63 veces lo que se aplica y en nogal 1.39; frente a
   lo recomendado por INIFAP, 2.2 veces en algodón y 2.0 en maíz forrajero. En chile queda **por debajo** de lo aplicado
   (0.89): ahí los productores aplican 161 cm, mucho más que los 92 cm recomendados.
2. **Alfalfa y nogal son el 68 % de la superficie** del patrón de cultivos usado en H1. Por eso el exceso del modelo en esos
   dos cultivos explica la mayor parte del error de H1.
3. **En alfalfa la diferencia viene de la ET, no solo de la eficiencia.** El modelo da 1,748 mm de ETc (Penman-Monteith con
   NASA POWER, Kc 0.95 todo el año); el estudio local, 1,139 mm. El kit ya ponía como control 1,100–1,700 mm: el modelo queda
   en el borde alto. Con la misma lámina aplicada (174 cm), el rendimiento medio regional es de 14 t de materia seca por
   hectárea frente a 24 de potencial (INIFAP): la alfalfa del distrito no se riega para su potencial.
4. **Tres contrastes independientes apuntan al mismo lado:** el back-test de la presa (modelo ÷ observado = 2.0), la lámina
   de alfalfa (1.63) y la ET de satélite (ETc del modelo ÷ SSEBop = 1.53 en el rectángulo original). El modelo calcula la
   **necesidad completa** de un cultivo bien regado; el distrito opera por debajo de eso.

## 3. Qué se hizo con esto
- **Se deja el modelo como está** y se rotula como lo que es: necesidad completa (FAO-56), con su banda P10–P90.
- **Se agrega la referencia local a los datos** (`supuestos.json` → `lamina_local_cm`) para que la ficha pueda mostrar, junto
  a la necesidad del modelo, «lo que aquí se suele aplicar» y calcular con las dos para cuántas hectáreas alcanza la dotación.
  Con 3.5 millares/ha, 10 ha de alfalfa alcanzan para 1.2 ha con la necesidad del modelo y para 2.0 ha con la lámina aplicada.
- **No se cambió la eficiencia de parcela** (0.45–0.70 [S]). Como referencia: con 0.60–0.70 (FAO da 0.60 como valor
  indicativo para riego superficial) la lámina de alfalfa bajaría de 28.4 a 25.1 millares/ha; no cierra la diferencia con
  lo aplicado (17.4), porque esa diferencia viene sobre todo de la ET. Cambiar el rango mueve todas las cifras de la
  herramienta y es decisión del equipo.

## 4. Lo que NO se puede afirmar
- Que el modelo «acierta» en nivel: no lo hace en alfalfa, nogal, algodón ni maíz forrajero.
- Que la razón ET ÷ agua aplicada (65.6 % en alfalfa) sea una eficiencia de parcela medida: el propio expediente del
  proyecto la marca solo como contraste.
- Que se sepa cuánta agua aplica cada parcela: son promedios del distrito de 2009–2016.
