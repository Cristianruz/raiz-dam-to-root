<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Prototipo de diseño de la app (Claude Design, 15-nov-2026)

**Qué es:** el prototipo navegable de alta fidelidad que resultó del prompt de [`../prompt_claude_design.md`](../prompt_claude_design.md), después de tres rondas con Cristian. Es una **propuesta de diseño**, no código de la web: no toca `web/`, no cambia el contrato de datos y no entra en `python construir.py`.

**Dónde se ve:** en el lienzo de Claude Design de Cristian, <https://claude.ai/artifact/HuW3SxRzhPZWLkeMsoDfNM>. El lienzo es privado hasta que Cristian lo comparta desde esa página (Share); desde ahí también se exporta a imagen o PDF. Los archivos de `fuentes/` son el formato del lienzo y **no se abren solos en el navegador**: sirven para leer el marcado, los estilos y la lógica.

## Contenido de la carpeta

| Ruta | Contenido |
|---|---|
| `fuentes/Main.dc.html` | Prototipo de teléfono (390 × 844): marcado, estilos en línea y lógica de estados |
| `fuentes/Desktop.dc.html` | Prototipo de tableta y escritorio (fluido, 1440 × 900 de referencia) |
| `fuentes/Map.dc.html`, `Field.dc.html`, `Rain.dc.html`, `DesktopRain.dc.html` | El mismo prototipo iniciado en otro estado (mapa, ficha, relieve con tormenta) |
| `fuentes/canvas.json` | Índice del lienzo: las seis mesas y su acomodo |
| `tokens.css` | Variables CSS del tema oscuro: color, vidrio, tipografía, espaciado, radios y movimiento |
| `recursos/map_base2.jpg` | Imagen aérea **ilustrativa**, generada con código (1 px = 2 m) |
| `recursos/relief_dark.jpg`, `ponding.png`, `flows.json` | Relieve sombreado, zonas de acumulación y líneas de escurrimiento **ilustrativos**, calculados sobre un relieve sintético |
| `generadores/` | Los scripts de Python que produjeron esas imágenes (`numpy`, `scipy`, `Pillow`) y `fields.json` con la geometría dibujada |

## Planteamiento
Una sola pantalla de mapa; todo lo demás aparece encima con un toque y solo cuando se pide. Tema oscuro con paneles de vidrio. Interfaz en inglés; mensaje de WhatsApp en español. El logotipo es solo el nombre ROOT.

- **Mapa y capas.** Riel con Water (semáforo), Term (plazo del agua), Rain (relieve) y Layers, que abre Crops, Field memory (deslizador de año 2016–2026), Bare soil y Greenness. Cada capa cambia el color y la etiqueta de la parcela y muestra su leyenda en una tira.
- **Tarjeta inferior.** Dotación (valor, deslizador sobre barra en degradado, marcas Like 2025 / Like 2026 / Normal year, Rain −20%) y una sola cifra: el agua ya comprometida por los perennes.
- **Ficha de parcela.** Anillo de hectáreas cubiertas, veredicto, plazo con segmentos y acciones. «Options and crops» despliega las rotaciones (cada una se abre con agua, suelo, dinero y las cinco respuestas), «Crops that suit this area» (aptitud regional de GAEZ), «Soil and nutrients» y la memoria 2016–2026.
- **Capas superpuestas.** Fields (lista y conteos), Follow the drop, Message to the farmer, Data and tests.
- **Rain.** Relieve en 3D, escurrimiento animado, zonas bajas donde se acumula el agua y «Simulate a storm». Rotulado «Area scale · NASADEM 30 m (not per field)».

## Reglas de cálculo que usa el prototipo
- Semáforo por opción: dotación < P50 → Not enough water; P50 ≤ dotación < P90 → Tight; dotación ≥ P90 → Enough water.
- Hectáreas que alcanzan: valor del prompt a 3.5 × dotación ÷ 3.5, con tope en la superficie de la parcela (igual para el rango «likely»).
- Agua comprometida por perennes: porcentaje del prompt a 3.5 × 3.5 ÷ dotación.

## Diferencias con las reglas del repositorio (las decide Cristian)
1. **Cifras escritas a mano.** El prototipo lleva en su lógica las cifras del prompt (P0757, P0632, L0175 y los agregados) y las de `docs/suelo_*` y `docs/ecostress.md`. En la web esto no se permite (`CLAUDE.md`, reglas 2 y 3): al implementar, cada valor se lee de `web/data/`.
2. **Animaciones en bucle.** El escurrimiento, los anillos de acumulación y la lluvia se repiten mientras la vista Rain está abierta. El principio 7 del pase de diseño (kit X3.2) pide movimiento sin bucles. Con «reduce motion» no se montan.
3. **Tema oscuro y colores.** Sobre fondo oscuro, contornos y anillos usan variantes más claras del semáforo; las píldoras conservan fondo claro con texto oscuro del mismo tono. El estado activo de los segmentados es una píldora clara, al revés de la versión clara.
4. **Imágenes ilustrativas.** La imagen aérea, el relieve, el escurrimiento y las zonas de acumulación no son datos del proyecto. Al implementar se sustituyen por teselas reales y por el cálculo sobre NASADEM (dirección de flujo, acumulación y depresiones).
5. **Aptitud de cultivos.** Se presenta como aptitud regional (GAEZ, ~9 km), sin ordenar por ganancia y sin «mejor opción».

## Lo que el prototipo declara como «not run» o «no data»
Conteos de parcelas fuera de 3.5; Rain −20%; agregados de Lázaro Cárdenas; reparto de flujos de Follow the drop; lluvia y volúmenes de la tormenta; elevaciones; valores de suelo por parcela; demanda de agua de algodón, sorgo y chile; NDVI salvo P0757; suelo desnudo de L0175. El resultado de las cinco pruebas, la fecha de los datos y «SI/AI tools used» quedaron como marcadores.

## Movimiento (para replicarlo)
- Transiciones de mapa 0.7 s e inclinación 0.9 s con `cubic-bezier(.2,.8,.2,1)`; controles 0.3 s.
- Escurrimiento: trazos con `stroke-dasharray` y desplazamiento de 1.5 s. Anillos: 2.6 s. Lluvia: 0.5 s.

## Estado
- El prototipo no se revisó renderizado desde la sesión que lo generó: se comprobó que la lógica corre en todas las combinaciones de capa, parcela y panel, y que las cifras a 3.5 coinciden con las del prompt. La revisión visual es de Cristian en el lienzo.
- Pendiente: página de sistema de diseño con componentes y estados.
