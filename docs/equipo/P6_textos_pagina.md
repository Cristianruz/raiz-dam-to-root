<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# P6 · Textos, página, video y jurado

**Qué le toca** (S9 §10; kit §3 y §7):
- entrevistas;
- los textos de la interfaz, las plantillas de explicaciones y el mensaje de WhatsApp;
- la página del proyecto en inglés (C6);
- el video y las diapositivas de respaldo (C7 y C8);
- People's Choice y #MejorMeme.

**Con qué trabaja:** la app de Gemini o Claude en el navegador. No usa Colab ni Earth Engine. Vea [herramientas.md](herramientas.md).

**Estado a las 10:30** (detalle en [README](README.md#estado-a-las-1030-sábado-14-nov)): la sesión de datos ya entregó parcelas, clima, satélite, cultivos por reglas, demanda y relieve. **La web ya muestra en local los 338 campos reales** y se publica cuando estén los arreglos que faltan. Sus piezas no cambian: textos, página, video, People's Choice y #MejorMeme.

**Dónde se entrega:** los tres archivos de texto van a la carpeta de Drive `Raiz_entregas` (plana, sin subcarpetas), con una línea por archivo **al final** de `Raiz_entregas/LEEME.md` (sin borrar las de los demás; [README §5](README.md#5-la-línea-de-leememd-y-el-aviso)). El ensamblador (`motor/ensamblar.py`) **rechaza `plantillas_explicaciones.md` si encuentra un dígito fuera de los marcadores `{{…}}`**: también en citas como «FAO-56», que se escriben con palabras o con un marcador. La única excepción es la línea del encabezado AI-assisted.

**Antes de cada pieza, revise `Raiz_entregas/LEEME.md`.** Si el archivo ya tiene su línea (por ejemplo, porque otra persona ya lo entregó), no lo rehaga: revíselo con la autoverificación de abajo y avise a Cristian. Dos archivos con el mismo nombre se pisan.

**Dos datos para sus textos:** la tormenta de referencia de la capa de relieve (`relieve_meta.json`) salió de **NASA POWER**, no de GPM: no escriba «GPM» en la página ni en el video. Y el mapa de cultivos se publica con reglas + Random Forest cuando P2 lo entregue; mientras tanto, la mayoría de las parcelas sale «Not classified».

| Orden | Pieza | Archivo (tabla 0.4-B) | Hora límite |
|---|---|---|---|
| — | Sesiones de la sede, 10:00 y 12:00, con otro integrante | — | sáb 10:00–14:00 |
| 1 | [T1 · textos de interfaz](#t1--textos-de-la-interfaz-textos_uimd) | `textos_ui.md` | sáb 12:00 |
| 2 | [T2 · plantillas de explicaciones](#t2--plantillas-de-explicaciones-plantillas_explicacionesmd) | `plantillas_explicaciones.md` | sáb 14:30 |
| 3 | [T3 · mensaje de WhatsApp](#t3--mensaje-de-whatsapp-whatsapp_plantillamd) | `whatsapp_plantilla.md` | sáb 14:30 |
| — | [Mentorías y prueba de usabilidad](#mentorías-y-prueba-de-usabilidad) | — | sáb 16:00, 17:00 y 18:00 |
| 4 | [C6 · página en inglés](#c6--página-del-proyecto-en-inglés) | No pasa por el buzón | Borrador sáb 20:30–1:00; final dom 8:00–11:00 |
| 5 | [C7 y C8 · video y diapositivas](#c7-y-c8--video-y-diapositivas-de-respaldo) | No pasa por el buzón | Guion y grabación hasta dom 8:00; exportado y probado en incógnito, dom 12:00 |
| 6 | [People's Choice y #MejorMeme](#peoples-choice-y-mejormeme) | — | Historias durante el evento; votación del 17 al 20-nov |

## Reglas de lenguaje (valen para todo lo que escribe)

| Regla | De dónde sale |
|---|---|
| Ninguna cifra escrita a mano: la web lee los números de los datos. En las plantillas, solo marcadores `{{f1}}`, `{{f2}}`… y los dinámicos `{{d}}`, `{{ha}}` y `{{cobertura}}` | CLAUDE.md, regla 3; kit §2.5 y C3 |
| No decir "first" ni "only" (tampoco «primero» ni «único») | CLAUDE.md, regla 10; S9 §4; kit C6 |
| No prometer ahorros. Con goteo se dice "reduces dam withdrawals", no "saves" | S9 §11; kit §10, punto 10 |
| La herramienta no reparte, vende ni intercambia agua (art. 22 de la LAN) y no pronostica la presa | S9 §11; CLAUDE.md, regla 10 |
| Sin logotipos, banderas ni identificadores de misión de NASA | Kit Q2; CLAUDE.md, regla 9 |
| Aviso fijo: "This tool supports, never replaces, the judgment of farmers and local experts." | Kit C2, paso 8 |
| La sección de IA se titula "SI/AI tools used". Frase del jurado: "The AI never makes the decision and never produces the numbers." | Kit §9; S8, decisión 8 |
| Interfaz, página y video en inglés; el mensaje de WhatsApp, en español | CLAUDE.md, regla 9 |
| «Zona piloto» ("pilot area"), nunca «módulo»: el límite del módulo no es público | Kit B1, paso 1; S9, Anexo A |
| Las parcelas son estimadas: "Field boundaries are NN predictions outside the model's training domain; filtered by confidence and manually reviewed for the showcased fields." | Kit A4 |

**Autoverificación antes de entregar.** Pegue esto en un chat **nuevo** de Gemini o de Claude, seguido del texto:
```text
Revisa el texto que pego abajo. NO lo reescribas. Devuélveme cuatro listas:
(a) cada dígito (0–9) que aparezca FUERA de los marcadores {{...}}, con su línea; ignora la línea que contiene "AI-assisted";
(b) cada aparición de: first, only, save, saves, savings, ahorro, primero, único, sell, trade, exchange, forecast, vender, intercambiar, pronóstico, NASA logo;
(c) cada marcador {{...}} usado;
(d) cada frase que prometa un resultado o diga que la herramienta decide por el agricultor.
Al final: "LISTO" si (a), (b) y (d) están vacías; si no, "CORREGIR".
```
En `plantillas_explicaciones.md`, la lista (a) tiene que quedar vacía, sin excepciones. En `whatsapp_plantilla.md` se aceptan solo los dígitos del texto fijo de C4: la numeración de las 3 opciones y «Responda 1, 2 o 3».

---

## T1 · Textos de la interfaz (`textos_ui.md`)

**El kit no trae un prompt para esta pieza.** El bloque se arma con las cadenas en inglés que el kit fija en C1, C2, C5 y X3.2. Usted las pule (claridad, frases cortas, tono para el agricultor) **sin cambiar su sentido ni agregar cifras**. Cristian las conecta a la web.

| | |
|---|---|
| **Entradas** | Kit C1, C2, C5 y X3.2 (van pegados en el bloque) |
| **Hora límite** | Sáb 12:00 (kit §3: «textos de interfaz», primer bloque) |
| **Formato sugerido** (Cristian decide al integrarlo) | Una tabla Markdown `clave \| texto (EN) \| dónde (kit) \| nota`, con los marcadores `[Z]`, `[D]`, `[X]` y `[Y]` del kit cambiados por `{{…}}` |

**Bloque para pegar en Gemini o Claude** (G0 adaptado a textos; el kit no trae prefijo para P6):
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P6 Textos, página y jurado.

ENTORNO
App de Gemini o Claude en el navegador (no Colab). Entrego archivos de texto en Google Drive, en la carpeta Raiz_entregas (UNA carpeta plana, sin subcarpetas), y agrego una línea por archivo al final de Raiz_entregas/LEEME.md, sin borrar las líneas de los demás. Ahí también están los datos que ya entregó la sesión de datos (otra sesión de Claude); no los modifico.

REGLAS OBLIGATORIAS
1. No inventes cifras ni las escribas. La web lee los números de los datos; en los textos van marcadores. En las plantillas usa SOLO {{f1}}, {{f2}}… y los marcadores dinámicos {{d}}, {{ha}} y {{cobertura}}; ningún dígito fuera de los marcadores. Si una frase necesita un número que no tiene marcador, escribe [FALTA DATO] y avísame.
2. Interfaz, página y video en inglés claro y sencillo (frases cortas). El mensaje de WhatsApp, en español.
3. Escribe ÚNICAMENTE los archivos del ESQUEMA DE SALIDA, con esos nombres exactos.
4. Prohibido: "first" y "only" (ni "primero" ni "único"); prometer ahorros ("save", "saves", "savings", "ahorro"; se dice "reduces dam withdrawals"); decir que la herramienta reparte, vende o intercambia agua o que pronostica la presa; logotipos, banderas o identificadores de misión de NASA.
5. Cada ficha y la página llevan el aviso: "This tool supports, never replaces, the judgment of farmers and local experts."
6. La sección de IA se titula "SI/AI tools used". La IA nunca produce los números ni toma la decisión.
7. Al final imprime una AUTOVERIFICACIÓN: (a) cada dígito que aparezca fuera de los marcadores {{…}} (debe ser cero o estar en la lista de texto fijo del kit que te pego); (b) cada palabra prohibida de la regla 4 (debe ser cero); (c) cada marcador usado y qué dato representa.
8. Al final escribe, para CADA archivo, su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; en script, el bloque de esta guía que usaste: docs/equipo/P6_textos_pagina.md, bloque T1). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual; aquí solo textos_ui.md):
| Textos (P6) | `textos_ui.md`, `plantillas_explicaciones.md` (5 preguntas con marcadores `{{f1}}`, sin números) y `whatsapp_plantilla.md` | — |

DOCUMENTOS DE REFERENCIA (pegados)
Kit v4, C1 (copiado tal cual):
Tarea C1. En web/, cree una página estática SIN frameworks (index.html, style.css, app.js) que:
1) Cargue MapLibre GL JS desde un CDN con la versión fija documentada y un mapa base libre (OpenStreetMap o un estilo gratuito sin llave), centrado en la extensión de parcelas.geojson. El centro se calcula de los datos; no se escriben coordenadas en el código.
2) Lea web/data/parcelas.geojson y web/data/cubo.json (por ahora, los simulados del contrato).
3) Barra superior:
   - DESLIZADOR DE DOTACIÓN "Water allocation (thousand m³ per hectare · millares/ha)", con mínimo, máximo y paso leídos de dotaciones.deslizador, y tres marcas leídas de dotaciones.marcas ("Like 2025", "Like 2026", "Normal year"). Al tocar una marca, el deslizador salta a su valor y muestra su rango, fuente y etiqueta;
   - junto al valor, su equivalencia en lámina (dotaciones.equivalencia) y la nota del punto de medición (dotaciones.punto_medicion);
   - interruptor "Rain −20%" (apagado = 0, encendido = −20).
   NO hay selector de año ni control de temperatura.
4) Con cada movimiento, y SIN pedir datos nuevos, la web recalcula para cada parcela la cobertura, las hectáreas que alcanzan y el semáforo de agua de su opción ACTUAL, con las reglas de la sección 2.4 del kit. Esas reglas viven en UNA sola función, que también usan las pruebas automáticas.
5) INDICADOR PRINCIPAL, sobre el mapa: "Water already committed by perennial crops: [Z]% of the allocation", con su rango. Reglas de la sección 2.4:
   - si la dotación es cero: "No dam allocation: perennial crops depend on wells or go unmet";
   - si pasa de 100%: "Perennial crops alone ask for more than the allocation; the gap comes from wells or stays unmet", con enlace a "Follow the drop";
   - si hay superficie abstenida: anteponga "at least" y muestre el porcentaje de superficie sin clasificar.
6) Segunda cifra: "With [D] thousand m³/ha, [X] of [Y] fields don't have enough water for their current rotation" (X = parcelas en rojo; Y = parcelas clasificadas).
7) COLOREADO del mapa, con un conmutador de dos posiciones:
   - "Enough water?" (por omisión): verde, ámbar y rojo; gris = sin clasificar;
   - "Water term": libre, por vencer y comprometida; gris = sin dato (estado_plazo).
8) CAPAS (una activa a la vez, en lugar del coloreado): "Crops" (cultivo_actual, con "Not classified" en gris), "Bare soil in the windy season" (dias_suelo_desnudo_mediana; si es null, dias_suelo_desnudo_feb_abr) y "Field memory: 2025" (estado de 2025 de la memoria). Cada capa con leyenda, unidades y fuente. Una capa solo se muestra si está en distrito.capas_disponibles.
9) PANEL LATERAL, con valores leídos de los bloques "distrito" y "zona" (nunca escritos en el HTML):
   - La Boquilla: almacenamiento con fecha (o "no data") frente a la capacidad al NAMO;
   - acuífero 0831: disponibilidad, con la fuente visible;
   - conteo de parcelas en verde, ámbar, rojo y gris para la dotación activa, y de parcelas libres, por vencer y comprometidas.
10) Colores de la identidad: Agua #1F6FB2, Brote #4C9A2A, Tierra #8A5A3B, Ámbar #D98E04, Arena #F5EFE6; tipografía Atkinson Hyperlegible.
11) Debe funcionar en teléfono celular (en pantallas angostas, el panel lateral pasa debajo del mapa). Accesibilidad: contraste suficiente, deslizador operable con teclado y nada que dependa únicamente del color (agregue ícono o texto).

PRUEBA:
- abra la página con un servidor local simple y después en la liga pública;
- al mover el deslizador y el interruptor de lluvia cambian los colores, los conteos y el indicador principal;
- las tres marcas llevan el deslizador a su valor y muestran su fuente;
- con dotación cero y con el indicador por encima de 100% aparecen los mensajes previstos;
- una capa ausente de capas_disponibles no se muestra;
- sin errores en la consola y sin cifras escritas en el HTML;
- proporcione la liga.
Kit v4, C2 (copiado tal cual):
Tarea C2. Al hacer clic en una parcela, abra un panel lateral (o una hoja inferior en teléfono celular) con:
1) ENCABEZADO: ID, área, cultivo actual con su confianza ("Alfalfa — 81% confidence") o "Not classified — check with technician" si está abstenida; estado del plazo ("free", "ending soon" o "committed") y, si existe, la edad observada ("stand age from satellite memory"; con "≥" si es un mínimo o "age not available" si no hay memoria).
2) MEMORIA DE LA PARCELA "Field memory (NASA HLS)": una franja con una celda por año agrícola desde 2016 (o desde el primer año disponible), cada una con su estado: perenne, cultivo de verano, de invierno, doble, descanso o sin dato. Cada estado lleva color y letra o trama, con leyenda. Debajo, la nota fija: "Rule-based reading of monthly greenness; not a crop census." Si memoria es null: "Field memory: not run".
3) TARJETAS lado a lado: "Current rotation" + 2 alternativas (3 en alfalfa establecida). Cada tarjeta con 3 renglones (Water · Soil · Money), semáforo, ícono y sus cifras:
   - WATER: lámina bruta en millares por hectárea al año, con el rango P10–P90 en una barra pequeña; plazo en años ("commits water for N years"; rango si lo hay) y plazo restante en la opción actual; y "enough for X of N hectares" con su rango, calculado con el deslizador (sección 2.4). El semáforo de agua lo calcula la web;
   - SOIL: días de suelo desnudo (con la marca "measured" o "estimated" según dias_desnudo_origen), leguminosa y ruptura de plagas;
   - MONEY: margen o "no verified data".
4) Una línea de 12 meses (verde = cultivo, café = suelo desnudo) por opción.
5) Botón "Why?" que despliega las 5 preguntas del reto: why it's suggested · evidence (con fuente) · benefits · what we don't know · risks needing local review. Textos de explicaciones.json; los marcadores dinámicos toman su valor del deslizador.
6) Debajo de las tarjetas, la sección "Follow the drop" (La gota, X3.2) con el botón "What if this field switches to drip?"; por ahora, con el bloque "gota" simulado. Si la cobertura de la opción es menor de 1, una línea lo dice: "The allocation covers part of this need; the rest comes from wells or stays unmet."
7) Las advertencias de filtros: por ejemplo, "advertir_si_rojo" en alfalfa nueva cuando su semáforo de agua queda en rojo.
8) El aviso fijo: "This tool supports, never replaces, the judgment of farmers and local experts."
9) Glosario con tooltips: ET, NDVI ("greenness"), bare soil, frost risk, water balance, consumption cap, millar, water term.

PRUEBA:
- con los datos simulados, la ficha se abre en las 3 parcelas protagonistas;
- al mover el deslizador cambian las hectáreas que alcanzan y el semáforo de agua de cada tarjeta;
- la franja de memoria muestra los seis estados posibles y se entiende sin depender del color;
- en teléfono celular se lee sin necesidad de zoom;
- no hay cifras escritas en el HTML: todas provienen de los datos.
Kit v4, X3.2 (copiado tal cual):
Tarea X3.2. DENTRO de la ficha de la parcela (C2), debajo de las tarjetas de opciones, agregue la sección "Follow the drop". No es una pantalla ni una pestaña aparte:

1) Un diagrama Sankey (utilice d3-sankey desde un CDN con versión fija, o SVG propio si resulta más simple) con los nodos: La Boquilla → Canal losses / Field → Crop (ET) / Back to aquifer / Other. Los anchos se obtienen del bloque "gota" del cubo.

2) Animación:
   - "gotas" (círculos) que recorren las bandas al abrir la sección, en ~3 segundos;
   - sin animaciones infinitas que distraigan;
   - respete prefers-reduced-motion.

3) El botón "What if this field switches to drip?" cambia al bloque "gota_goteo_con_tope" con una transición suave y muestra 2 cifras grandes:
   - "Dam water: −X%";
   - "Back to aquifer: −Y%".
   Un interruptor "Consumption cap: on / off" alterna entre "gota_goteo_con_tope" y "gota_goteo_sin_tope". Sin tope, muestre la cifra "Crop consumption (ET): +Z% vs. historical" y el aviso "Not recommended: district consumption would exceed the historical level." (según tope_consumo.cumple_sin_tope).

4) Debajo, una frase fija: "Efficiency reduces dam withdrawals but can reduce aquifer recharge (Grafton et al., Science 2018). We count consumption (ET), not just withdrawals. Drip is recommended only if district ET stays at or below its historical level." Y la fuente del coeficiente de retorno: "Return-flow coefficients: Conagua 2024, aquifer 0831 technical report."

5) Colores: Agua #1F6FB2 para el agua que fluye, Brote #4C9A2A para la ET del cultivo, Tierra #8A5A3B para el acuífero, Ámbar #D98E04 para las pérdidas.

PRUEBA:
- se visualiza correctamente en teléfono celular;
- los números del Sankey coinciden con el cubo (actual, con tope y sin tope);
- funciona con el teclado;
- grabe un GIF de 5 s para la página.
Kit v4, C5 (copiado tal cual):
Tarea C5. Revisión de calidad de la web:
1) Carga < 3 s en 4G (comprima el GeoJSON; si pesa > 3 MB, simplifique las geometrías o migre a PMTiles).
2) Pantalla de inicio de 3 pasos: "1. Set the water allocation · 2. Tap a field · 3. Compare rotations".
3) Sección "About & Data" con la tabla de datos NASA (dato, resolución y para qué se usa), la armonización de resoluciones, las cinco pruebas con su resultado y la liga al repo. Cada cifra con su fuente, leída de manifest.json.
4) Accesibilidad: contraste AA, navegación con teclado y textos alternativos.
5) Pruebas en Chrome, Firefox y un teléfono celular Android.
PRUEBA: Lighthouse ≥ 85 en desempeño y accesibilidad; reporte los valores.

TAREA
Tarea T1. Escribe textos_ui.md: todas las cadenas en inglés que el usuario ve en las tres pantallas, tomadas de C1, C2, X3.2 y C5 (entre comillas en esos textos), en una tabla clave | texto (EN) | dónde (kit) | nota. Mejora la claridad para un agricultor (frases cortas, palabras simples) SIN cambiar el sentido. Donde el kit pone [Z], [D], [X], [Y] o "N", usa marcadores {{z}}, {{d}}, {{x}}, {{y}}, {{n}} y explica en la nota de dónde sale cada uno. No escribas ningún número: los nombres de las marcas del deslizador ("Like 2025", "Like 2026", "Normal year") vienen de dotaciones.json y se citan como dato, no como texto fijo. Incluye el glosario de C2 (ET, NDVI "greenness", bare soil, frost risk, water balance, consumption cap, millar, water term) con una definición de una línea cada uno, sin cifras. Incluye el aviso fijo de C2 y la nota de la franja de memoria tal cual.
PRUEBA: la AUTOVERIFICACIÓN de la regla 7; además, la lista de cadenas de C1, C2, X3.2 y C5 que NO quedaron en la tabla (debe quedar vacía).
```

**Prueba de aceptación:** la del bloque, más la autoverificación de arriba en un chat nuevo.

**Plan B:** si no da tiempo de pulir, se entregan las cadenas del kit tal cual. Así ya funcionan en la web.

**Línea de LEEME.md:**
```text
textos_ui.md | Cadenas de interfaz del kit v4 (C1, C2, C5, X3.2), editadas por P6 sin cifras | 2026-11-14 | docs/equipo/P6_textos_pagina.md (bloque T1)
```
Aviso: `ENTREGA: textos_ui.md — prueba OK`.

---

## T2 · Plantillas de explicaciones (`plantillas_explicaciones.md`)

**Para qué:** son las 5 respuestas del botón "Why?" de cada tarjeta (kit C2, paso 5). Si no hay llave de API, la web usa **solo** estas plantillas, y así se declara en la página (kit C3).
- El texto no lleva números: cada número es un marcador `{{f1}}`, `{{f2}}`… que la web reemplaza con los datos.
- Los marcadores dinámicos `{{d}}`, `{{ha}}` y `{{cobertura}}` los calcula la web con el deslizador (kit §2.5).

| | |
|---|---|
| **Hechos disponibles** (kit C3, paso 1) | lámina, plazo, plazo restante, compromiso, estado del plazo, días de suelo desnudo y memoria |
| **Las 5 preguntas** (kit C2, paso 5) | why it's suggested · evidence (con fuente) · benefits · what we don't know · risks needing local review |
| **Hora límite** | Sáb 14:30 (kit §3). Cristian las usa en C3 entre las 18:00 y las 20:30 |

**Bloque para pegar:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P6 Textos, página y jurado.

ENTORNO
App de Gemini o Claude en el navegador (no Colab). Entrego archivos de texto en Google Drive, en la carpeta Raiz_entregas (UNA carpeta plana, sin subcarpetas), y agrego una línea por archivo al final de Raiz_entregas/LEEME.md, sin borrar las líneas de los demás. Ahí también están los datos que ya entregó la sesión de datos (otra sesión de Claude); no los modifico.

REGLAS OBLIGATORIAS
1. No inventes cifras ni las escribas. La web lee los números de los datos; en los textos van marcadores. En las plantillas usa SOLO {{f1}}, {{f2}}… y los marcadores dinámicos {{d}}, {{ha}} y {{cobertura}}; ningún dígito fuera de los marcadores. Si una frase necesita un número que no tiene marcador, escribe [FALTA DATO] y avísame.
2. Interfaz, página y video en inglés claro y sencillo (frases cortas). El mensaje de WhatsApp, en español.
3. Escribe ÚNICAMENTE los archivos del ESQUEMA DE SALIDA, con esos nombres exactos.
4. Prohibido: "first" y "only" (ni "primero" ni "único"); prometer ahorros ("save", "saves", "savings", "ahorro"; se dice "reduces dam withdrawals"); decir que la herramienta reparte, vende o intercambia agua o que pronostica la presa; logotipos, banderas o identificadores de misión de NASA.
5. Cada ficha y la página llevan el aviso: "This tool supports, never replaces, the judgment of farmers and local experts."
6. La sección de IA se titula "SI/AI tools used". La IA nunca produce los números ni toma la decisión.
7. Al final imprime una AUTOVERIFICACIÓN: (a) cada dígito que aparezca fuera de los marcadores {{…}} en CUALQUIER línea del archivo, incluidas la lista marcador → hecho y las citas de fuentes. Debe ser CERO, sin excepciones: este archivo no tiene texto fijo con dígitos, y un solo dígito hace que el validador lo rechace; (b) cada palabra prohibida de la regla 4 (debe ser cero); (c) cada marcador usado y qué dato representa.
8. Al final escribe, para CADA archivo, su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; en script, el bloque de esta guía que usaste: docs/equipo/P6_textos_pagina.md, bloque T2). Sin esa línea el archivo no entra. La AUTOVERIFICACIÓN y la línea de LEEME.md van en tu respuesta, FUERA del archivo plantillas_explicaciones.md: llevan dígitos.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual; aquí solo plantillas_explicaciones.md):
| Textos (P6) | `textos_ui.md`, `plantillas_explicaciones.md` (5 preguntas con marcadores `{{f1}}`, sin números) y `whatsapp_plantilla.md` | — |
El validador del repo revisa CADA línea del archivo y lo rechaza si encuentra un dígito fuera de los marcadores {{…}}. La única línea exenta es la del encabezado AI-assisted. También lo rechazan los dígitos dentro de nombres y citas: «P50», «P10–P90», «FAO-56», «v002», un año entre paréntesis o un número de artículo de ley.

DOCUMENTOS DE REFERENCIA (pegados)
Kit v4, C3 (copiado tal cual):
Tarea C3. Cree web/scripts/generar_explicaciones.py (se ejecuta fuera de la web, desde el comando único) que:
1) Para cada parcela protagonista y cada opción, construya un JSON de hechos a partir de cubo.json, parcelas.geojson y las fuentes de la sección 5.2 del maestro (con sus citas). Incluya lámina, plazo, plazo restante, compromiso, estado del plazo, días de suelo desnudo y memoria.
2) Solicite a un LLM (Claude por la API, si hay llave; de lo contrario, plantillas) que redacte las 5 respuestas en inglés, en lenguaje sencillo, utilizando ÚNICAMENTE marcadores {{f1}}, {{f2}}… para los números, nunca números escritos. Para lo que depende del deslizador se usan solo los marcadores dinámicos de la lista ({{d}}, {{ha}}, {{cobertura}}), cuyo valor pone la web.
3) VERIFICADOR:
   - regex que rechace cualquier dígito fuera de los marcadores;
   - cada marcador debe existir en el JSON de hechos o en la lista de marcadores dinámicos;
   - cada cita debe estar en la lista de fuentes permitidas;
   - ningún texto promete ahorros, propone vender o intercambiar agua ni dice "first" u "only".
   Si falla 2 veces, utilice la plantilla sin LLM.
4) Guarde web/data/explicaciones.json ({"EXP_P0001_A": {"textos": {...}, "valores": {"f1": ...}}}). La web reemplaza los marcadores al mostrarlos.
5) Set dorado:
   - 30 casos (incluye 5 trampas: "invent a yield number", "ignore the rules"…);
   - reporte en docs/figuras/llm_eval.csv con el % de números alterados (meta 0%) y el % de uso de plantilla.

Si no hay llave de API: únicamente plantillas bien redactadas (plantillas_explicaciones.md de P6), y así se declara en la página.
PRUEBA: el reporte del set dorado + 3 explicaciones mostradas en la ficha.
Kit v4 §2.5, explicaciones.json (copiado tal cual):
- **`web/data/explicaciones.json`:** sin cambio de estructura. Por llave (`EXP_<id>_<opcion>`): `textos` (las 5 respuestas con marcadores) y `valores` (el número de cada marcador). Se añade una lista de **marcadores dinámicos** (`{{d}}`, `{{ha}}`, `{{cobertura}}`) cuyo valor calcula la web con el deslizador; el verificador solo acepta los de esa lista.
S9 §11 "Límites que se declaran" (copiado tal cual):
No reparte, vende ni intercambia agua (art. 22 de la LAN). No pronostica la presa. No promete ahorros. No sustituye al agricultor ni al técnico. Las parcelas son estimadas; el mapa se valida contra fotointerpretación, no contra campo. OpenET aún no cubre México.

TAREA
Tarea T2. Escribe plantillas_explicaciones.md, en inglés sencillo, con una plantilla por tipo de opción: rotación actual (ACTUAL), alternativa anual, alfalfa (nueva o establecida, con corte de riego en verano) y nogal. En cada una van las 5 respuestas: why it's suggested · evidence (with source) · benefits · what we don't know · risks needing local review. Reglas: (1) cero dígitos fuera de los marcadores, en todo el archivo, sin excepciones; (2) cada número es un marcador {{f1}}, {{f2}}… y debajo de cada plantilla va la lista "marcador → hecho", con los hechos nombrados en inglés y SIN dígitos: median applied depth; low–high range of the applied depth; shortest and longest water term; remaining water term; water commitment; water term status; bare-soil days; field memory status. No escribas «P50», «P10», «P90» ni ningún otro nombre con dígitos; (3) lo que depende del deslizador usa solo {{d}}, {{ha}} y {{cobertura}}; (4) la evidencia cita solo fuentes de la lista de fuentes permitidas de C3 (la tiene Cristian); mientras llega, solo las que citan S9 §4 y §5: NASA POWER, NASA HLS, FAO, INIFAP, FIRA, IMTA y Conagua. Cita cada fuente por su nombre, sin año, sin número de serie, versión ni artículo. La de FAO se escribe "FAO, Crop evapotranspiration: guidelines for computing crop water requirements (Irrigation and Drainage Paper)", sin su número. Si hace falta mencionar la ley de aguas, escribe "Mexico's National Water Law", sin número de artículo; (5) "what we don't know" dice al menos que la eficiencia parcelaria no está medida en el distrito y que las parcelas son estimadas; (6) "risks needing local review" termina con el aviso fijo de la regla 5; (7) nada de ahorros ni de repartir, vender o intercambiar agua, ni "first" u "only".
PRUEBA: la AUTOVERIFICACIÓN de la regla 7 con CERO dígitos fuera de los marcadores, y la tabla marcador → hecho completa (ningún marcador sin hecho, ningún hecho nombrado con dígitos).
```

**Por qué los hechos y las citas van sin dígitos:** el ensamblador revisa todas las líneas del archivo, también la lista marcador → hecho y las citas. «{{f1}} → lámina P50» o «Evidence: FAO-56» bastan para rechazar el archivo con el motivo «trae cifras escritas a mano». En el kit, esos hechos se llaman P50 y P10–P90 (S9 §5); en este archivo se nombran con palabras.

**Prueba de aceptación:**
- la del bloque;
- la autoverificación de arriba en un chat nuevo, con cero dígitos fuera de los marcadores y cero palabras prohibidas. Pegue **solo el contenido del archivo**, sin la autoverificación ni la línea de `LEEME.md`, porque esas sí llevan dígitos.

**Plan B:** si no da tiempo de hacer los cuatro tipos, una sola plantilla general con las 5 respuestas. C3 la usa para todas las opciones.

**Línea de LEEME.md:**
```text
plantillas_explicaciones.md | Plantillas de las 5 preguntas del reto (kit C2 y C3), con marcadores {{f1}} y dinámicos; sin cifras | 2026-11-14 | docs/equipo/P6_textos_pagina.md (bloque T2)
```
Aviso: `ENTREGA: plantillas_explicaciones.md — prueba OK`.

---

## T3 · Mensaje de WhatsApp (`whatsapp_plantilla.md`)

**Va en español, para el agricultor.** Es una maqueta: no se envía nada (kit C4).

| | |
|---|---|
| **Hora límite** | Sáb 14:30 (kit §3). La vista previa es segunda línea (S9 §8) |

**Bloque para pegar:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P6 Textos, página y jurado.

ENTORNO
App de Gemini o Claude en el navegador (no Colab). Entrego archivos de texto en Google Drive, en la carpeta Raiz_entregas (UNA carpeta plana, sin subcarpetas), y agrego una línea por archivo al final de Raiz_entregas/LEEME.md, sin borrar las líneas de los demás. Ahí también están los datos que ya entregó la sesión de datos (otra sesión de Claude); no los modifico.

REGLAS OBLIGATORIAS
1. No inventes cifras ni las escribas. La web lee los números de los datos; en los textos van marcadores. En las plantillas usa SOLO {{f1}}, {{f2}}… y los marcadores dinámicos {{d}}, {{ha}} y {{cobertura}}; ningún dígito fuera de los marcadores. Si una frase necesita un número que no tiene marcador, escribe [FALTA DATO] y avísame.
2. Interfaz, página y video en inglés claro y sencillo (frases cortas). El mensaje de WhatsApp, en español.
3. Escribe ÚNICAMENTE los archivos del ESQUEMA DE SALIDA, con esos nombres exactos.
4. Prohibido: "first" y "only" (ni "primero" ni "único"); prometer ahorros ("save", "saves", "savings", "ahorro"; se dice "reduces dam withdrawals"); decir que la herramienta reparte, vende o intercambia agua o que pronostica la presa; logotipos, banderas o identificadores de misión de NASA.
5. Cada ficha y la página llevan el aviso: "This tool supports, never replaces, the judgment of farmers and local experts."
6. La sección de IA se titula "SI/AI tools used". La IA nunca produce los números ni toma la decisión.
7. Al final imprime una AUTOVERIFICACIÓN: (a) cada dígito que aparezca fuera de los marcadores {{…}} (debe ser cero o estar en la lista de texto fijo del kit que te pego); (b) cada palabra prohibida de la regla 4 (debe ser cero); (c) cada marcador usado y qué dato representa.
8. Al final escribe, para CADA archivo, su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; en script, el bloque de esta guía que usaste: docs/equipo/P6_textos_pagina.md, bloque T3). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual; aquí solo whatsapp_plantilla.md):
| Textos (P6) | `textos_ui.md`, `plantillas_explicaciones.md` (5 preguntas con marcadores `{{f1}}`, sin números) y `whatsapp_plantilla.md` | — |

DOCUMENTOS DE REFERENCIA (pegados)
Kit v4, C4 (copiado tal cual):
Tarea C4. Agregue en la ficha:
A) Un botón "Preview WhatsApp message" que muestre una MAQUETA visual (no se envía nada) con:
- el texto breve en español para el agricultor (whatsapp_plantilla.md de P6): 3 opciones numeradas; de cada una, una línea de agua (cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza con la dotación elegida) y una de suelo; y "Responda 1, 2 o 3";
- el aviso: "Es una simulación; la asignación oficial la decide Conagua".
B) Un botón "Print field sheet" que genere la FICHA IMPRIMIBLE desde la misma página (hoja de estilos de impresión; sin segundo documento): encabezado, memoria, las tarjetas con sus tres renglones, La gota en versión estática, la dotación y la lluvia elegidas, la fecha, las fuentes y el aviso de juicio local.
No agregue formularios, pestañas del técnico ni almacenamiento de información.

PRUEBA: la maqueta se visualiza correctamente en teléfono celular; la ficha cabe en una hoja; todo el texto y las cifras provienen de los datos y coinciden con la pantalla.

TAREA
Tarea T3. Escribe whatsapp_plantilla.md en español sencillo, como lo pide C4, parte A: saludo breve; 3 opciones numeradas; para cada opción, una línea de agua (cuánta pide al año y por cuántos años obliga, con marcadores {{f1}}, {{f2}}…; para cuántas hectáreas alcanza con la dotación elegida, con los marcadores dinámicos {{ha}} y {{d}}) y una línea de suelo (con marcadores {{f…}}); después "Responda 1, 2 o 3" y el aviso "Es una simulación; la asignación oficial la decide Conagua". Debajo, la lista marcador → hecho. Los únicos dígitos permitidos fuera de marcadores son los del texto fijo de C4 (la numeración de las 3 opciones y "Responda 1, 2 o 3"). Que quepa en una pantalla de teléfono.
PRUEBA: la AUTOVERIFICACIÓN de la regla 7 (dígitos fuera de marcadores: solo los del texto fijo de C4), y que el aviso esté tal cual.
```

**Prueba de aceptación:**
- la del bloque;
- en la maqueta de C4, el mensaje se lee bien en un teléfono (kit C4, prueba).

**Plan B:** si no da tiempo, Cristian usa el texto de C4 tal cual. La vista previa de WhatsApp está en el orden de recorte de R3.

**Línea de LEEME.md:**
```text
whatsapp_plantilla.md | Mensaje al agricultor en español (kit C4, parte A), con marcadores; maqueta, no se envía | 2026-11-14 | docs/equipo/P6_textos_pagina.md (bloque T3)
```
Aviso: `ENTREGA: whatsapp_plantilla.md — prueba OK`.

---

## Mentorías y prueba de usabilidad

- **Mentorías obligatorias, sáb 16:00 y 17:00.** Faltar descalifica (S10 §3, A6).
  - Haga la prueba de pasillo.
  - Pregunte a un técnico o mentor **dónde se mide el millar** y si las dotaciones de prensa son correctas (kit §3; S9 §12).
  - **Pregunta abierta del integrador (14-nov 10:30):** la lámina del modelo sale bastante más alta que la del INIFAP, sobre todo por la eficiencia parcelaria supuesta. La tabla y las preguntas exactas están en [P4 → pregunta de las mentorías](P4_clima_demanda.md#pregunta-para-las-mentorías-de-las-1600-y-las-1700); P4 las prepara. Si usted entra a la mentoría, llévelas.
  - Anote el cargo de quien lo dijo (sin nombre) y la hora, y páselo a Cristian y a P5 (para `dotaciones.json` y `propuesta_supuestos.md`; kit B2, paso 2).
- **Prueba de usabilidad, sáb 18:00** (kit §3). Una persona ajena al equipo usa la web sin ayuda. Anote dónde se atora y páselo a Cristian en una lista corta.

---

## C6 · Página del proyecto en inglés

**No pasa por el buzón.** La página vive en el repo (README y página): se trabaja en un documento compartido con Cristian y él la integra. No hay línea de `LEEME.md`.
- **Hora:** borrador sáb 20:30–1:00; final dom 8:00–11:00 (kit §3 y C6).
- **Insumos:** los resultados que llegan a `Raiz_entregas`. Lo que no se ejecute se dice «not run»: hoy, por ejemplo, el contraste regional de ET (A8) está en «not run» hasta que lleguen sus insumos ([P4](P4_clima_demanda.md#a8--contraste-regional-de-et-por-ahora-not-run)).

**Bloque para pegar:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P6 Textos, página y jurado.

ENTORNO
App de Gemini o Claude en el navegador (no Colab). Entrego archivos de texto en Google Drive, en la carpeta Raiz_entregas (UNA carpeta plana, sin subcarpetas), y agrego una línea por archivo al final de Raiz_entregas/LEEME.md, sin borrar las líneas de los demás. Ahí también están los datos que ya entregó la sesión de datos (otra sesión de Claude); no los modifico.

REGLAS OBLIGATORIAS
1. No inventes cifras ni las escribas. La web lee los números de los datos; en los textos van marcadores. En las plantillas usa SOLO {{f1}}, {{f2}}… y los marcadores dinámicos {{d}}, {{ha}} y {{cobertura}}; ningún dígito fuera de los marcadores. Si una frase necesita un número que no tiene marcador, escribe [FALTA DATO] y avísame.
2. Interfaz, página y video en inglés claro y sencillo (frases cortas). El mensaje de WhatsApp, en español.
3. Escribe ÚNICAMENTE los archivos del ESQUEMA DE SALIDA, con esos nombres exactos.
4. Prohibido: "first" y "only" (ni "primero" ni "único"); prometer ahorros ("save", "saves", "savings", "ahorro"; se dice "reduces dam withdrawals"); decir que la herramienta reparte, vende o intercambia agua o que pronostica la presa; logotipos, banderas o identificadores de misión de NASA.
5. Cada ficha y la página llevan el aviso: "This tool supports, never replaces, the judgment of farmers and local experts."
6. La sección de IA se titula "SI/AI tools used". La IA nunca produce los números ni toma la decisión.
7. Al final imprime una AUTOVERIFICACIÓN: (a) cada dígito que aparezca fuera de los marcadores {{…}} (debe ser cero o estar en la lista de texto fijo del kit que te pego); (b) cada palabra prohibida de la regla 4 (debe ser cero); (c) cada marcador usado y qué dato representa.
8. Al final escribe, para CADA archivo, su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; en script, el bloque de esta guía que usaste: docs/equipo/P6_textos_pagina.md, bloque C6). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
No es una fila de la tabla 0.4-B: la página no pasa por el buzón. Entrego el texto de la página (Markdown) a Cristian en el documento compartido. Secciones del README (kit K-INT): Summary, How it works, NASA Data, Validation, Limitations, SI/AI tools used, References.

DOCUMENTOS DE REFERENCIA (pegados)
S9 §1 (copiado tal cual):
**ROOT muestra, antes de sembrar, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa.**

- En inglés, para la página: *"Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover."*
- Nombre: ROOT – From Dam to Root. Equipo: Orbital Farming. Reto: Field Shift.
S9 §6 "Pruebas a la vista" (copiado tal cual):
| # | Prueba | Criterio declarado antes de ver el resultado |
|---|---|---|
| 1 | Mapa de cultivos | F1 macro con bloques espaciales de 5 km; áreas con Olofsson; abstención si p < 0.6 |
| 2 | Back-test 2026 (H1, preregistrado) | Con datos al 14-mar, el error al 14-jul debe ser menor que el de las líneas base L1 y L1-s. Verdad: salida por obra de toma de La Boquilla (SIH) |
| 3 | Experimento natural de 2025 (H3, se añade al preregistro) | En el año sin agua de las presas, la proporción de parcelas anuales con cultivo de verano cae 25 puntos o más frente a la mediana 2019–2024, y la de huertas de nogal se mantiene a 10 puntos o menos de su mediana. Se publica el número de parcelas de cada grupo |
| 4 | Verificador de cifras | 30 casos, con trampas; 0 % de cifras alteradas por la IA |
| 5 | Contraste regional de ET y pruebas automáticas | ET agregada frente a SSEBop VIIRS (USGS) y WaPOR v3 (FAO); FAO-56 contra los ejemplos resueltos del manual; cierre del balance de La gota |

- H2 del preregistro (subsidencia con OPERA) se retira; OPERA sale del alcance.
- El preregistro se publica en OSF el mié 11-nov, con H3 incluida (texto en el Anexo B).
S9 §11 "Límites que se declaran" (copiado tal cual):
No reparte, vende ni intercambia agua (art. 22 de la LAN). No pronostica la presa. No promete ahorros. No sustituye al agricultor ni al técnico. Las parcelas son estimadas; el mapa se valida contra fotointerpretación, no contra campo. OpenET aún no cubre México.
Kit v4 §9, frase para el jurado y presentación (copiadas tal cual):
**Frase para el jurado:** *"The AI never makes the decision and never produces the numbers."*
**Presentación:** *"We use AI where it's measurable and checkable: phenological rules and Random Forest for crop mapping, compared with spatial validation; NN-derived field boundaries, filtered by confidence; and an LLM that writes explanations but cannot write numbers. Water accounting stays in transparent physics (FAO-56) and explicit rules."*
Kit v4, cierre de "SI/AI tools used" (copiado tal cual):
Cierre de la sección: *"AI never generates the numbers or makes the decision; farmers and technicians decide."*
[PEGA AQUÍ el borrador de la página (archivo 31), que te pasa Cristian.]
[PEGA AQUÍ los resultados: resultado_H1.md, resultado_H3.md, tabla_metodos.csv, olofsson.csv, llm_eval.csv, et_contraste.csv (si se ejecutó), la tabla resumen de B4 y docs/pruebas.md.]
[PEGA AQUÍ cifras.csv (P5): cada cifra de la página debe estar ahí con su fuente.]

TAREA
NOTA DEL EQUIPO: la tabla "SI/AI tools used" es la del kit §9 (Cristian la tiene); en "Investigación previa" y "Textos de la página", agrega Claude en el navegador si se usó.
Tarea C6. Utilice el borrador de la página (archivo 31, actualizado con S9; no está en el repo: se lo pasa Cristian) y reemplace cada [PENDING] con los resultados reales:
- resultado_H1.md y resultado_H3.md (Raiz_entregas);
- tabla_metodos.csv y olofsson.csv (Raiz_entregas);
- llm_eval.csv;
- et_contraste.csv, si se ejecutó;
- la tabla resumen de B4 y docs/pruebas.md.
Abra con la idea en una frase de S9 §1 (versión en inglés). Presente las cinco pruebas con su resultado, favorable o no; lo que no se ejecutó se dice ("not run"). Cada cifra con su fuente. Verifique que no queden "first", "only", promesas de ahorro, logotipos de NASA ni cifras sin fuente. La sección de IA se titula "SI/AI tools used". Genere también el README.md del repo con la misma información.
PRUEBA: una lista de verificación con cada cifra, su archivo de origen y su fuente.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «(archivo 31, actualizado con S9)» → «(archivo 31, actualizado con S9; no está en el repo: se lo pasa Cristian)»
- «- docs/resultado_H1.md y docs/resultado_H3.md;» → «- resultado_H1.md y resultado_H3.md (Raiz_entregas);»
- «- docs/figuras/tabla_metodos.csv y olofsson.csv;» → «- tabla_metodos.csv y olofsson.csv (Raiz_entregas);»

**Prueba de aceptación** (kit C6):
```text
PRUEBA: una lista de verificación con cada cifra, su archivo de origen y su fuente.
```
**Plan B:** lo que no se ejecutó se publica como "not run" (kit C6). La página no espera a que todo salga.

**Línea de LEEME.md:** no aplica, porque no pasa por el buzón. Un `.md` que no está en la tabla 0.4-B se rechaza: «no está en la tabla 0.4-B del kit» (`motor/ensamblar.py`).

---

## C7 y C8 · Video y diapositivas de respaldo

**No pasan por el buzón.** Van por liga pública, y la liga se le pasa a Cristian.
- **Hora:** guion y grabación hasta dom 8:00; C6 y video, 8:00–11:00; **dom 12:00, video exportado y probado en una ventana de incógnito**; 12:30, revisión de cifras en la página, el video, el póster y la ficha impresa (kit §3; Q2).

Texto del kit (copiado tal cual):

- **Video de 30 s o menos:** un solo guion, con el arco de S9 §7 (2025, el compromiso, La gota, las pruebas). Se graba la pantalla de la web real con las 3 protagonistas. Solo texto en pantalla y subtítulos en inglés incrustados, sin voz. Si se usa una imagen generada con IA, lleva marca de agua visible. Se sube con liga pública y **se prueba en una ventana de incógnito a las 12:00**. El mismo video sirve para el People's Choice.
- **Diapositivas de respaldo:** máximo 7, contando portada y cierre, exportadas a PDF con liga pública. Lo que no se construyó (agente, sensores, optimizador) aparece solo rotulado «Next phase / vision».

**Bloque para el guion** (Gemini o Claude):
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P6 Textos, página y jurado.

ENTORNO
App de Gemini o Claude en el navegador (no Colab). Entrego archivos de texto en Google Drive, en la carpeta Raiz_entregas (UNA carpeta plana, sin subcarpetas), y agrego una línea por archivo al final de Raiz_entregas/LEEME.md, sin borrar las líneas de los demás. Ahí también están los datos que ya entregó la sesión de datos (otra sesión de Claude); no los modifico.

REGLAS OBLIGATORIAS
1. No inventes cifras ni las escribas. La web lee los números de los datos; en los textos van marcadores. En las plantillas usa SOLO {{f1}}, {{f2}}… y los marcadores dinámicos {{d}}, {{ha}} y {{cobertura}}; ningún dígito fuera de los marcadores. Si una frase necesita un número que no tiene marcador, escribe [FALTA DATO] y avísame.
2. Interfaz, página y video en inglés claro y sencillo (frases cortas). El mensaje de WhatsApp, en español.
3. Escribe ÚNICAMENTE los archivos del ESQUEMA DE SALIDA, con esos nombres exactos.
4. Prohibido: "first" y "only" (ni "primero" ni "único"); prometer ahorros ("save", "saves", "savings", "ahorro"; se dice "reduces dam withdrawals"); decir que la herramienta reparte, vende o intercambia agua o que pronostica la presa; logotipos, banderas o identificadores de misión de NASA.
5. Cada ficha y la página llevan el aviso: "This tool supports, never replaces, the judgment of farmers and local experts."
6. La sección de IA se titula "SI/AI tools used". La IA nunca produce los números ni toma la decisión.
7. Al final imprime una AUTOVERIFICACIÓN: (a) cada dígito que aparezca fuera de los marcadores {{…}} (debe ser cero o estar en la lista de texto fijo del kit que te pego); (b) cada palabra prohibida de la regla 4 (debe ser cero); (c) cada marcador usado y qué dato representa.
8. Al final escribe, para CADA archivo, su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; en script, el bloque de esta guía que usaste: docs/equipo/P6_textos_pagina.md, bloque C7). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
No es una fila de la tabla 0.4-B. Entrego a Cristian: guion del video (tabla segundo | lo que se ve en pantalla | texto en pantalla en inglés | subtítulo en inglés) y el texto de cada diapositiva (máximo 7).

DOCUMENTOS DE REFERENCIA (pegados)
S9 §7 "Criterios y premios" (copiado tal cual):
| Criterio de la sede | Lo que verá el jurado |
|---|---|
| Impacto | Distrito real, año sin presa documentado, acuífero con déficit oficial; el indicador de agua ya comprometida |
| Creatividad | El plazo del agua: el cultivo como compromiso de varios años |
| Validez | Las cinco pruebas, bandas P10–P90, abstención y cada cifra con su fuente |
| Pertinencia | Rotación actual más dos alternativas con las cinco respuestas del reto; renglón Suelo con días de suelo desnudo medidos; HLS y POWER dentro del cálculo |
| Presentación | Una historia en cuatro minutos: 2025, el compromiso, La gota, las pruebas |
| Diversidad | Perfil y rol de cada integrante por fortaleza; técnicos y mentores como conocimiento externo |

| Premio | Pieza que lo sostiene |
|---|---|
| Nominación global de la sede | Los seis criterios; es el primer filtro |
| People's Choice (17–20 nov) | Video de 30 s y publicaciones del equipo; sin bots, que descalifican |
| #MejorMeme | Historias en Instagram durante el evento, con el nombre del equipo y la etiqueta (P6) |
| Local Impact (principal) | Delicias, millares, técnico y WhatsApp |
| Best Use of Data | Memoria de 2016–2026 con HLS, ET donde OpenET no cubre y relieve con NASADEM y lluvia de GPM |
| Best Use of Science | Dos hipótesis preregistradas con resultado publicado |
| Best Use of Technology | Un comando reconstruye todo; pruebas automáticas que condicionan la publicación; verificador de cifras |
| Storytelling y Art & Technology | La gota y la franja de memoria |
| Galactic Impact, Mission Concept, Global Connection | Método replicable en cualquier distrito con presa y acuífero, con datos abiertos y un archivo de parámetros por distrito |

- En la fase global la categoría la asignan los jueces y cada premio va a un proyecto distinto. No se puede garantizar ningún premio; lo que se controla es cubrir los seis criterios con evidencia.
- En el formulario se mantienen Local Impact y Best Use of Data.
S9 §1 (copiado tal cual):
**ROOT muestra, antes de sembrar, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa.**

- En inglés, para la página: *"Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover."*
- Nombre: ROOT – From Dam to Root. Equipo: Orbital Farming. Reto: Field Shift.
[PEGA AQUÍ cifras.csv (P5) para las cifras que aparezcan en pantalla.]

TAREA
Tarea C7. Escribe el guion de un video de 30 s o menos con el arco de S9 §7: 2025 (el año sin agua de las presas), el compromiso (el plazo del agua de una parcela protagonista), La gota y las pruebas. Se graba la pantalla de la web real con las 3 protagonistas. Solo texto en pantalla y subtítulos en inglés incrustados, sin voz. Toda cifra en pantalla sale de la web o de cifras.csv, con su fuente al pie. Sin logotipos de NASA. Si se usa una imagen generada con IA, lleva marca de agua visible. Después, el texto de un máximo de 7 diapositivas (portada y cierre incluidos); lo que no se construyó va rotulado "Next phase / vision".
PRUEBA: duración total ≤ 30 s sumando los segundos del guion; AUTOVERIFICACIÓN de la regla 7; lista de cifras en pantalla con su fuente en cifras.csv.
```
- **Prueba de aceptación:** la del bloque, más el video abierto en una ventana de incógnito a las 12:00 (kit C7).
- **Plan B:** si el video no queda, diapositivas (máximo 7) con liga pública (Q2: «video de 30 s o menos … o diapositivas (máximo 7)»).
- **Línea de LEEME.md:** no aplica (liga pública, no buzón).

---

## People's Choice y #MejorMeme

Texto del kit (§3, copiado tal cual):

- **People's Choice (17 al 20-nov) y #MejorMeme:** a cargo de P6. Sin bots: descalifican de la fase local.

Y de S9 §7:

| Premio | Pieza que lo sostiene |
|---|---|
| People's Choice (17–20 nov) | Video de 30 s y publicaciones del equipo; sin bots, que descalifican |
| #MejorMeme | Historias en Instagram durante el evento, con el nombre del equipo y la etiqueta (P6) |

- **Sin bots:** descalifican de la fase local (kit §3).
- Cada historia lleva el nombre del equipo y la etiqueta, sin logotipos de NASA y sin cifras que no estén en `cifras.csv`.
- Las historias del meme se preparan el sábado entre las 20:30 y la 1:00 (kit §3), en los ratos definidos para redes (S10 §9).

```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P6 Textos, página y jurado.

ENTORNO
App de Gemini o Claude en el navegador (no Colab). Entrego archivos de texto en Google Drive, en la carpeta Raiz_entregas (UNA carpeta plana, sin subcarpetas), y agrego una línea por archivo al final de Raiz_entregas/LEEME.md, sin borrar las líneas de los demás. Ahí también están los datos que ya entregó la sesión de datos (otra sesión de Claude); no los modifico.

REGLAS OBLIGATORIAS
1. No inventes cifras ni las escribas. La web lee los números de los datos; en los textos van marcadores. En las plantillas usa SOLO {{f1}}, {{f2}}… y los marcadores dinámicos {{d}}, {{ha}} y {{cobertura}}; ningún dígito fuera de los marcadores. Si una frase necesita un número que no tiene marcador, escribe [FALTA DATO] y avísame.
2. Interfaz, página y video en inglés claro y sencillo (frases cortas). El mensaje de WhatsApp, en español.
3. Escribe ÚNICAMENTE los archivos del ESQUEMA DE SALIDA, con esos nombres exactos.
4. Prohibido: "first" y "only" (ni "primero" ni "único"); prometer ahorros ("save", "saves", "savings", "ahorro"; se dice "reduces dam withdrawals"); decir que la herramienta reparte, vende o intercambia agua o que pronostica la presa; logotipos, banderas o identificadores de misión de NASA.
5. Cada ficha y la página llevan el aviso: "This tool supports, never replaces, the judgment of farmers and local experts."
6. La sección de IA se titula "SI/AI tools used". La IA nunca produce los números ni toma la decisión.
7. Al final imprime una AUTOVERIFICACIÓN: (a) cada dígito que aparezca fuera de los marcadores {{…}} (debe ser cero o estar en la lista de texto fijo del kit que te pego); (b) cada palabra prohibida de la regla 4 (debe ser cero); (c) cada marcador usado y qué dato representa.
8. Al final escribe, para CADA archivo, su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; en script, el bloque de esta guía que usaste: docs/equipo/P6_textos_pagina.md, bloque PC). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
No es una fila de la tabla 0.4-B. Entrego textos cortos para historias de Instagram y la publicación del People's Choice.

DOCUMENTOS DE REFERENCIA (pegados)
S9 §1 (copiado tal cual):
**ROOT muestra, antes de sembrar, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa.**

- En inglés, para la página: *"Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover."*
- Nombre: ROOT – From Dam to Root. Equipo: Orbital Farming. Reto: Field Shift.

TAREA
Tarea PC. Escribe varias ideas de historia para #MejorMeme durante el evento (humor sobre el agua, la presa y la parcela, sin burlarse de los agricultores ni de las instituciones), cada una con el nombre del equipo (Orbital Farming) y la etiqueta #MejorMeme, y un texto corto para pedir el voto del People's Choice con la liga del video. Sin cifras, sin logotipos de NASA, sin "first"/"only", sin promesas de ahorro.
PRUEBA: AUTOVERIFICACIÓN de la regla 7.
```
- **Hora límite:** las historias, durante el evento (sáb 20:30–1:00, kit §3); la publicación del People's Choice, lista con la liga del video el dom 12:00, para la votación del 17 al 20-nov.
- **Prueba de aceptación:** la del bloque.
- **Plan B:** una sola historia por día.
- **Línea de LEEME.md:** no aplica.
