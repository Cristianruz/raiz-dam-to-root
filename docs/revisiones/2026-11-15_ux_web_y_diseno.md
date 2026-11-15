<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Revisión de la web (UX y accesibilidad) y principios de diseño · 15-nov, madrugada

Juntado por el integrador («Revisión multiagente») a partir de dos agentes de contexto nuevo: un revisor de la web con Playwright sobre `dda5abb` (teléfono Pixel 7 e iPhone 13, escritorio 1440×900, sin conexión, 3G/4G simulados, axe-core 4.10) y una investigación de diseño para herramientas agrícolas. Es la entrada para el chat de diseño. Complementa la revisión total de «Laptop» (`docs/revisiones/2026-11-14_2150_revision_total.md`, hallazgos C1–C3, I1–I25, M1–M22).

## Lo que ya funciona (no romper)

- axe-core no encontró fallas WCAG 2.1 AA en inicio, mapa, ficha ni About & Data. Orden de Tab lógico, foco visible y Escape devuelve el foco.
- Ninguna de las 1,239 fichas muestra NaN, null ni undefined. Sin excepciones de JS.
- Sin conexión: recarga, dice «Offline — showing the last synced copy» y abre la ficha.
- Funcionan el selector de zona, la vista 3D, la línea de tiempo, la tormenta, WhatsApp, la impresión y el enlace `#id`.

## Problemas de comprensión (el agricultor no lee la respuesta en segundos)

1. **El plazo del agua no está en la frase principal.** Solo dice las hectáreas; «Commits water for 3–4 years» queda unas 2,5 pantallas abajo en teléfono. *(En corrección: agente web.)*
2. **Mucha información a la vista.** La ficha de P0757 mide unos 5,000 px en escritorio y 8,500 px en teléfono (unas 15 pantallas). La gota empieza hacia el 85 % de la ficha y el aviso de juicio al final.
3. **Jerga y metadatos en la cabecera:** «confidence not available (methods agree: 1/1)», «E Water term», «story field», «boundary confidence (Fields of The World)», «Pilot area», [S]/[P]/[V] sin leyenda, «Monte Carlo», «Penman–Monteith», «ECOCROP».
4. **Notas internas y español a la vista:** «Source and note» y «Units» abiertos por omisión en escritorio con «nota no leída directamente (S8 §2)», «(kit B4)», «To be confirmed… at the mentoring session». *(En corrección: agente web.)*
5. **Dos «Why?» por tarjeta**; el de las cinco respuestas queda al pie, después de 3 a 5 avisos de filtro con citas largas en español.
6. **La barra fija de controles tapa la ficha en teléfono** (quedan 560 de 839 px; ilegible con texto al 200 %). *(En corrección: agente web.)*
7. **Decimales disparejos** junto a la misma unidad (28.4, 25.49, 18.94) y hectáreas mayores que el área («8 of 7.95»). *(En corrección: agente web.)*
8. **Mapa a escala de distrito:** verde y rojo se distinguen solo por color («Enough» no tiene trama); etiquetas HTML que se encimen («L0175» tapa «Lázaro Cárdenas»).
9. **Carga:** 5 a 10 s de página vacía en 3G/4G sin aviso; el deslizador salta de valor al cargar. *(En corrección: agente web.)*
10. **Botón Atrás del teléfono sale de la app.** *(En corrección: agente web.)*
11. **Objetivos táctiles < 44 px**: 26 en teléfono (cabecera 32 px, marcas 34 px, `summary` de 18–20 px). *(En corrección: agente web.)*
12. **Contraste de colores de estado:** `--gris` sobre `--arena-mapa` 2.46:1, `--ambar` sobre blanco 2.68:1 (icono «Tight»), `--mem-sin_dato` sobre blanco 1.68:1; `--brote` contra `--rojo` 1.86:1 entre sí.

## Principios de diseño con fuente (para la ficha y el mapa)

1. **La respuesta primero, el detalle plegado.** GSMA AgriTech observó que los servicios cargados de funciones «overwhelmed users—especially those with low digital literacy». Primera línea: icono, veredicto, hectáreas que alcanzan y años de compromiso; memoria HLS, suelo, relieve y fuentes en `<details>`.
2. **El estimado junto a su rango, con la misma unidad y precisión** (van der Bles et al., PNAS 2020): «about {P50} (likely {P10}–{P90})».
3. **El borde de la banda no es un límite** (Ruginski 2016, cono de huracanes): bordes difuminados y «values outside are possible».
4. **Una palabra calibrada y siempre la misma:** «likely» (IPCC AR5) para P10–P90.
5. **Nunca distinguir solo por color** (patrón de estado de Carbon; `fill-pattern` de MapLibre): forma o símbolo + texto.
6. **Contraste para leer al sol:** ≥ 3:1 en elementos no textuales (WCAG 1.4.11); el método de «magic number» de USWDS (≥ 70 ≈ AAA) como margen.
7. **Lenguaje llano y sin códigos internos** (GOV.UK: edad lectora de 9 años).
8. **Fuera de línea primero** (web.dev, Offline cookbook) y la fecha de los datos visible.
9. **Compartir y acompañar:** el mensaje de WhatsApp abre con el veredicto y el aviso, pensado para llevarlo al técnico de módulo (CCAFS: el trato cara a cara transmite mejor las probabilidades).
10. **Patrones reutilizables sin framework:** GOV.UK Frontend (Summary list, Details, Warning text) reproducidos en CSS propio.

## Lo que el chat de diseño puede tomar

- Jerarquía de la ficha en tres niveles: (1) la respuesta, (2) las opciones lado a lado con su compromiso y sus hectáreas, (3) «Why this option?», evidencia, suelo, relieve, fuentes, todo plegado.
- Cabecera de la ficha sin metadatos internos; leyenda de [V]/[P]/[S] en lenguaje llano.
- Escala tipográfica de 5 o 6 tamaños con mínimo de 12 px (hoy son 22 tamaños; años a 9.6 px).
- Colores de estado con contraste suficiente entre sí y con el fondo, siempre con símbolo.
- Mapa: símbolos ✓/✕ por estado a poco zoom y etiquetas con capa `symbol` que evita encimarse.
- Primera pantalla: menos controles a la vista; en teléfono, la barra se compacta a una línea («Allocation: … · Change»).

Fuentes: GSMA AgriTech UX Design Guidebook (2025) y «Five key lessons from scaling digital agriculture services»; van der Bles et al. 2020 (PNAS); Kay et al. 2016; Fernandes et al. 2018; IPCC AR5 uncertainty guidance note; Carbon Design System, status indicator pattern; MapLibre GL JS, fill-pattern; USWDS design tokens (color); GOV.UK Design System; Home Office, readability; web.dev Offline cookbook; CCAFS (CGIAR).
