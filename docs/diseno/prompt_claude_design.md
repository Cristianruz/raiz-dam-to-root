<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Prompt para Claude Design: la aplicación ROOT

**Cómo usarlo:**
1. Abra Claude Design y pegue el texto del bloque de abajo.
2. Adjunte las imágenes de referencia que compartió el equipo, en este orden: primero las dos preferidas (la app móvil de tres pantallas del campo de chile y el tablero de escritorio del campo de golf con paneles de vidrio); después los tableros agrícolas (EarthEye, Pangalengan Farm, Stanfield Land, Kestrel) y las láminas de análisis del terreno (elevación, microcuencas, drenaje, pendiente).
3. Las cifras del prompt son reales: salen de `web/data/cubo.json` y `web/data/parcelas.geojson`, y los textos de las fichas se leyeron tal como los muestra la app en la integración `2346788` (rama `claude/keen-mayer-sp0vvm`, 15-nov-2026, 06:00 UTC) con la dotación «Like 2026» (3.5 millares/ha). No las cambie por otras. **Si la app cambia sus datos o su redondeo, estas cifras quedan viejas:** vuelva a leerlas de la app antes de usarlas.

```text
Diseña ROOT, una APLICACIÓN (no una página web) para teléfono, tableta y escritorio. Es una app instalable que funciona sin conexión con la última copia de los datos. Entrega un prototipo navegable de alta fidelidad, su sistema de diseño y notas de implementación.

## 1. Qué es ROOT
ROOT – From Dam to Root (NASA Space Apps 2026, reto «Field Shift», equipo Orbital Farming) muestra, ANTES de sembrar y parcela por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. Zona piloto: Distrito de Riego 005 Delicias, Chihuahua, México (dos zonas piloto: Delicias–Saucillo y Lázaro Cárdenas). Es un «gemelo digital» de esas zonas: mapa de parcelas, estado observado por satélite año por año (NASA HLS), modelo de agua (FAO-56 con NASA POWER), relieve (NASADEM) y escenarios (dotación, lluvia −20 %, tormenta).
Idea central, «el plazo del agua»: un cultivo anual compromete agua un ciclo; la alfalfa, 3–4 años; el nogal, un horizonte de 10 años. En un año seco el anual se puede dejar de sembrar; el perenne no, y su agua sale del acuífero.

Usuarios:
- Agricultor (teléfono, al sol, poca alfabetización digital): necesita la respuesta en segundos.
- Técnico de módulo de riego (tableta o escritorio): compara opciones y comparte con el agricultor.
- Jurado del concurso (escritorio y proyector): debe entender la historia en 4 minutos.

## 2. Referencias adjuntas y qué tomar de cada una
- PREFERIDA 1 — App móvil del campo de chile (3 pantallas): inicio con tarjetas y una barra de nivel en degradado con marcador; mapa satelital a pantalla completa con parcelas resaltadas, pines con icono de cultivo y una mini tarjeta flotante al tocar; detalle de parcela con foto arriba y hoja inferior blanca con asa; barra de navegación inferior oscura en píldora con el botón activo verde; botones redondos flotantes (atrás, más, zoom, ubicar).
- PREFERIDA 2 — Tablero del campo de golf: mapa aéreo de borde a borde, paneles de vidrio esmerilado translúcidos encima, barra superior en píldora centrada, riel de navegación vertical delgado a la izquierda, controles de zoom redondos, fila de tarjetas de vidrio abajo, columna de tarjetas de cifras a la derecha, selector de elementos en píldoras al borde derecho (el activo en píldora negra), segmentado «Statistics | Notes» con el activo oscuro.
- Tableros agrícolas (EarthEye, Pangalengan, Stanfield, AgriSmart): cifras grandes con etiqueta pequeña, barra de «índice» en degradado con marcador y nivel («Medium»), tarjeta de «insights» y lista de pendientes.
- Kestrel «Command center»: fondo salvia suave, tarjetas blancas, sección «Needs attention» con renglones de color pastel, indicador radial grande, píldoras de estado con símbolo.
- Láminas de análisis del terreno: elevación en rampa de color con curvas, red de drenaje en azul, pendientes por clases, el área de estudio resaltada y el exterior en gris, leyenda vertical, barra de escala.

## 3. Dirección visual
- Mapa primero. En teléfono, el mapa a pantalla completa con hoja inferior; en tableta y escritorio, el mapa de borde a borde con paneles de vidrio (fondo blanco translúcido, desenfoque, borde de 1 px claro, sombra suave, radio 18 px).
- Identidad fija (no cambiar): Agua #1F6FB2, Brote #4C9A2A, Tierra #8A5A3B, Ámbar #D98E04, Arena #F5EFE6; tinta #1D2329; tinta suave #4A525A. Fondo de la app: degradado salvia muy claro (#E8ECE3) a Arena.
- Semáforo de agua (siempre color + símbolo + texto, nunca solo color): Enough water ✓ verde #4C9A2A; Tight ! ámbar #D98E04; Not enough water ✕ rojo oscuro #7A1610 (distinto del verde también en luminosidad); Not classified ? gris #6E747B. Píldoras de estado: fondo claro + texto oscuro del mismo tono.
- Plazo del agua: free (Brote) · ending soon (Ámbar) · committed (Agua) · no data (gris), con letra o icono.
- Memoria de la parcela (una celda por año 2016–2026, con letra): P Perennial #2F6B1B · S Summer crop #E3A21A · W Winter crop #6FA8DC · D Double crop #7E57C2 · R Rest #C9A27E · ? No data #C4C8CC.
- Tipografía: Atkinson Hyperlegible (regular y negrita), números tabulares. Escala de 6 tamaños: 12 / 14 / 16 / 18 / 22 / 28–36 px; mínimo 12 px. Títulos de sección en versalitas pequeñas, cifras héroe grandes.
- Estado activo de segmentados y pestañas: píldora oscura (#1D2329) con texto blanco, como en las referencias.
- Objetivos táctiles de 44 px o más; contraste AA; movimiento corto y con propósito, respetando «reduce motion».
- Sin logotipos de NASA. Los productos se nombran en texto (NASA HLS, NASA POWER, NASADEM, GPM IMERG).
- Mapa base del prototipo: imagen aérea de un valle árido con parcelas de riego por gravedad (rectangulares, alfalfa verde, huertas de nogal en hileras, parcelas en barbecho color tierra). Las parcelas se dibujan con relleno translúcido del color del semáforo y contorno blanco.

## 4. Estructura de la app (teléfono 390 × 844)
Barra inferior en píldora oscura con 4 destinos: Map · Fields · Attention · Data. Arriba: selector de zona piloto («Delicias – Saucillo», «Lázaro Cárdenas», «All areas») e indicador de conexión («Online» / «Offline — showing the last synced copy»).

Pantallas:
0. Bienvenida (3 pasos, una sola vez): «1. Set the water allocation · 2. Tap a field · 3. Compare rotations», con el aviso «This tool supports, never replaces, the judgment of farmers and local experts.» y el botón «Start exploring».
1. Inicio / Centro de control:
   - Tarjeta «Water allocation (thousand m³ per hectare)»: deslizador de 0 a 12 con paso 0.5; valor grande «3.5 thousand m³/ha»; segmentado de marcas «Like 2025 · Like 2026 · Normal year» (activa: Like 2026); debajo, en una línea plegable, el rango y la fuente de la marca; interruptor «Rain −20%».
   - Cifra héroe con indicador radial: «Water already committed by perennial crops: at least 125% of the allocation · likely 101%–155%». Aviso ámbar: «Perennial crops alone ask for more than the allocation; the gap comes from wells or stays unmet.» con enlace «Follow the drop». Nota: «63% of the area is not classified, so this is a minimum.»
   - Segunda cifra: «With 3.5 thousand m³/ha, 202 of 357 fields don't have enough water for their current rotation.»
   - Tarjetas en carrusel horizontal «Needs attention» (como las tarjetas de tareas de la referencia móvil), cada una con un hecho y «Review with your module technician».
2. Mapa: parcelas coloreadas por «Enough water?» o «Water term» (segmentado), capas «Crops», «Bare soil (Feb–Apr)», «Field memory: 2025» y «Terrain & runoff»; pines de las 3 parcelas de la historia; mini tarjeta flotante al tocar una parcela (id, cultivo, área, píldora del semáforo, «enough for X of N ha»); botones redondos: capas, ubicar, zoom, vista 3D; leyenda compacta plegable; barra de escala.
3. Ficha de parcela (hoja inferior: media altura → altura completa), en TRES NIVELES:
   - Nivel 1, la respuesta: veredicto con símbolo; «enough for X of N hectares» con su rango «likely»; «commits water for N years» con barra de plazo (como la barra de cosecha de la referencia); aviso fijo de juicio local siempre visible.
   - Nivel 2, las opciones lado a lado (carrusel en teléfono, columnas en escritorio): «Current rotation» marcada + alternativas. Cada tarjeta: barra de nivel del agua (la banda P10–P90 de lo que pide la opción con el marcador de la dotación elegida; a la izquierda de P50 = Not enough, entre P50 y P90 = Tight, a la derecha de P90 = Enough), hectáreas que alcanzan, años de compromiso, renglón Soil (días de suelo desnudo, con «measured» o «estimated») y renglón Money («no verified data»).
   - Nivel 3, todo plegado: «Why this option?» (cinco respuestas: why it's suggested · evidence · benefits · what we don't know · risks needing local review), «Field memory (NASA HLS)», «Greenness (NDVI) by month», suelo, relieve («area scale, 30 m»), evidencia (altura del dosel GEDI, riesgo de helada) y fuentes.
   - Acciones: «Preview WhatsApp message» y «Print field sheet».
4. Follow the drop (dentro de la ficha): diagrama de flujo (Sankey) La Boquilla → Canal losses / Field → Crop (ET) / Back to aquifer / Other, con «What if this field switches to drip?» y el interruptor «Consumption cap». Frase fija: «Efficiency reduces dam withdrawals but can reduce aquifer recharge. We count consumption (ET), not just withdrawals.»
5. Mensaje al agricultor: maqueta de chat de WhatsApp EN ESPAÑOL con las opciones numeradas (agua al año, años que obliga, hectáreas que alcanzan, suelo), «Responda 1, 2 o 3» y «Es una simulación; la asignación oficial la decide Conagua.» No se envía nada.
6. Fields: lista con buscador, cada renglón con píldora del semáforo, cultivo, área e insignia «story field».
7. Attention: lista completa de «Needs attention» agrupada por nivel (Not enough water, Ending soon, Not classified), solo hechos, nunca «qué sembrar».
8. Data: datos de la NASA en uso, las cinco pruebas con su resultado publicado tal cual (partial, failed, not supported, passed), fecha de los datos y «SI/AI tools used».
9. Estados: sin conexión, cargando (esqueleto), parcela no clasificada («Not classified — check with technician», sin opciones), dotación cero («No dam allocation: perennial crops depend on wells or go unmet»).

## 5. Tableta y escritorio (1440 × 900)
Basado en la referencia del campo de golf: mapa de borde a borde; riel vertical a la izquierda (Map, Fields, Attention, Data); barra superior de vidrio en píldora con zona, deslizador de dotación con valor, marcas segmentadas y «Rain −20%»; columna derecha de tarjetas de vidrio (agua comprometida con indicador radial, conteos «Fields at this allocation», presa La Boquilla con barra de almacenamiento, acuífero 0831); fila inferior de tarjetas de vidrio (Terrain & runoff, Regional context, Twin status); selector de las 3 parcelas de la historia en píldoras al borde derecho; la ficha abre como panel de vidrio grande con las opciones en columnas.
Vista «Terrain & runoff» (referencias del terreno): sombreado del relieve + rampa de elevación + rutas de escurrimiento en azul + zona piloto resaltada con el exterior en gris + leyenda vertical + barra de escala + rótulo «Area scale · NASADEM 30 m (not per field)» + botón «Simulate a storm».

## 6. Datos reales para el prototipo (usar EXACTAMENTE estos; no inventar otros)
Unidad: 1 millar/ha = 1 thousand m³/ha = 10 cm de lámina. Dotación elegida: 3.5 (Like 2026). Etiquetas: [V] verificado, [P] prensa, [S] supuesto.
- Marcas: Like 2025 = 1 [P]; Like 2026 = 3–4, punto medio 3.5 [P, to be confirmed]; Normal year = 9–10, punto medio 9.5 [P, to be confirmed]. Fuente de Like 2026: El Diario de Chihuahua, 27-jul-2026.
- La Boquilla: 825.577 hm³ el 9-nov-2026 frente a 2,846.78 hm³ al NAMO [P].
- Acuífero 0831 Meoqui–Delicias: −167.12 hm³/año, déficit oficial de Conagua, no una pérdida medida [V].
- Todas las zonas, con 3.5: at least 108% (likely 88%–134%); 239 of 458 fields short; Enough water 219 · Tight 0 · Not enough water 239 · Not classified 781. Water term: free 235 · ending soon 74 · committed 149. 1,239 fields en total.
- Delicias–Saucillo (zona con la que abre la app), con 3.5, textos tal como los muestra la app: «at least 125% of the allocation» · «Likely range for the classified area: 101% to 155%; unclassified fields can raise it, not lower it» · «63% of the area is not classified, so this is a minimum.» · «With 3.5 thousand m³/ha, 202 of 357 classified fields don't have enough water for their current rotation.»
- Hectáreas: la app las muestra con los decimales del área, redondeadas hacia abajo y nunca mayores que el área; los rangos van como «range A to B»; la lámina, como «X thousand m³/ha per year (median)» con «likely range A–B».
- P0757 · Alfalfa · 7.95 ha · Water term: ending soon · stand age 3 years · memoria 2016→2026: P P P D D S S D P P P · NDVI sept-2026 0.59. Frase principal: «With 3.5 thousand m³/ha, the current rotation (Alfalfa) has enough water for 0.97 of 7.95 hectares. Alfalfa ties up water for 3–4 years (0–1 years left).» Opciones con 3.5:
  · Current rotation: Alfalfa — 28.4 thousand m³/ha per year (median), likely range 23.1–35.2 · ✕ Not enough water · Enough for 0.97 of 7.95 hectares (range 0.79 to 1.2) · Commits water for 3–4 years · Remaining term: 0–1 years · Water committed over the remaining term: 0–28.4 thousand m³/ha · Typically applied in this district (2009–2016 records; measurement point not confirmed): 17.4 thousand m³/ha · enough for 1.59 of 7.95 hectares — district average, not this field [V] · bare soil 0 days (measured).
  · Keep the alfalfa and skip two to three summer irrigations — 25.5 (likely range 21–31.6) · ✕ Not enough water · Enough for 1.09 of 7.95 hectares (range 0.88 to 1.32) · Commits water for 3–4 years · Remaining term: 0–1 years.
  · Break the old alfalfa: winter cereal, then forage maize — 18.9 (likely range 16.1–22.5) · ✕ Not enough water · Enough for 1.46 of 7.95 hectares (range 1.23 to 1.73) · Commits water for 1 year · bare soil 20 days (estimated).
  · Do not plant / standing stubble — ✓ Enough water · No irrigation needed · Enough for the whole field (7.95 ha) · Commits water for 1 year.
- P0632 · Winter cereal · 20.66 ha · Water term: free · memoria: S D S S S S S D S S W · bare soil 26 days (measured). Frase: «… has enough water for 9.24 of 20.66 hectares. Winter cereal ties up water for one season.» Opciones con 3.5:
  · Current rotation: Winter cereal — 7.8 (likely range 6.3–9.4) · ✕ Not enough water · Enough for 9.24 of 20.66 hectares (range 7.65 to 11.4) · Commits water for 1 year.
  · Do not plant / standing stubble — ✓ Enough water · No irrigation needed · Enough for the whole field (20.66 ha).
  · Oats (winter) + forage maize (summer) — 18.9 (likely range 16.1–22.5) · ✕ Not enough water · Enough for 3.81 of 20.66 hectares (range 3.2 to 4.5) · Commits water for 1 year.
- L0175 · Pecan orchard · 10.76 ha · Water term: committed · memoria: S P P P P P P P P S S. Frase: «… has enough water for 1.99 of 10.76 hectares. Pecan orchard ties up water for 10 years (calculation horizon; orchards live longer).» Única opción: Current rotation: Pecan orchard (does not rotate) — 18.8 (likely range 15.3–23.2) · ✕ Not enough water · Enough for 1.99 of 10.76 hectares (range 1.62 to 2.45) · Commits water for 10 years (calculation horizon; orchards live longer) · Water committed over the remaining term: 188.4 thousand m³/ha · Typically applied in this district: 13.7 thousand m³/ha · enough for 2.74 of 10.76 hectares — district average, not this field [V]. Nota: «An orchard does not rotate. Minimum-irrigation scenarios are the ones that apply, and kernel filling (August–September) should not be put at risk.»
- Money: en todas las opciones «no verified data».

## 7. Reglas que el diseño debe respetar
- Ninguna cifra inventada: solo las de la sección 6; donde falte un dato, «no data» o «not run».
- La incertidumbre se ve: rango «likely» junto a cada estimado; «at least» cuando hay superficie sin clasificar; gris para lo no clasificado.
- La app NO recomienda «la mejor opción», no ordena por ganancia, no promete ahorros, no reparte, vende ni intercambia agua y no pronostica la presa. No usar «first» ni «only».
- Cada ficha lleva visible: «This tool supports, never replaces, the judgment of farmers and local experts.»
- Interfaz en inglés; el mensaje de WhatsApp en español.
- Escala honesta: capas regionales rotuladas «area scale», nunca presentadas por parcela.
- Nada distinguido solo por color: siempre símbolo, letra o trama.

## 8. Restricciones para construirlo después
Se implementará como PWA con HTML, CSS y JavaScript sin frameworks, mapa MapLibre GL JS y diagramas con d3-sankey. Entrega los tokens como variables CSS (color, tipografía, espaciado de 4 px, radios, sombras, vidrio), componentes reutilizables (tarjeta de vidrio, píldora de estado, barra de nivel con banda y marcador, indicador radial, segmentado, hoja inferior con asa, barra inferior en píldora, botón redondo flotante, tarjeta de opción, celda de memoria, renglón de lista, aviso) y sus estados (normal, activo, enfocado, deshabilitado, cargando, sin datos).

## 9. Entregables
1. Sistema de diseño (tokens + componentes con estados).
2. Teléfono: pantallas 0 a 9, con la ficha de P0757 en media altura y en altura completa, y las fichas de P0632 y L0175.
3. Escritorio 1440 × 900: centro de control con paneles de vidrio, ficha abierta de P0757 y vista «Terrain & runoff».
4. Prototipo navegable: tocar una parcela abre su ficha; mover la dotación cambia el semáforo y las hectáreas; «Like 2025 / Like 2026 / Normal year» saltan a su valor.
5. Notas de implementación breves por pantalla (qué componente, qué token y qué dato muestra).
```
