<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Concepto visual de ROOT: el mapa primero (15-nov-2026)

**De dónde sale:** dos tandas de referencias que compartió el equipo el 14-nov por la noche. No se copian al repositorio porque son obras de terceros; aquí se describe la idea y cómo se adapta a ROOT.
- **Tableros agrícolas:** el mapa ocupa la pantalla y las tarjetas flotan encima, redondeadas y con sombra suave. Cifras grandes con etiquetas pequeñas, barras de nivel con marcador, píldoras de estado de color pastel, una lista de «needs attention» y, en el teléfono, la ficha como hoja que sube desde abajo.
- **Análisis del terreno:** elevación en rampa de color con curvas de nivel, pendientes por clases, red de drenaje y microcuencas, orientación de laderas, sombreado del relieve y el área de estudio resaltada sobre un fondo en gris.

**Reglas que no cambian** (`CLAUDE.md`):
- Ninguna cifra escrita a mano.
- La herramienta no recomienda «la mejor opción», no promete ahorros y no reparte, vende ni intercambia agua.
- Cada ficha lleva el aviso de que apoya y no sustituye el juicio del agricultor ni del técnico.
- Las capas de NASADEM se rotulan a escala de zona («regional, 30 m»), nunca por parcela (S9 §4 bis).

## 1. Ideas y cómo entran en ROOT

| Idea de las referencias | En ROOT | Datos que usa | Dueño | Cuándo |
|---|---|---|---|---|
| Tarjetas flotantes sobre el mapa | Indicador principal, controles y panel como tarjetas blancas translúcidas, con radio y sombra del sistema | — | Diseño (`web/style.css`) | Antes de las 8:00 |
| Cifra grande con etiqueta pequeña | Agua ya comprometida, conteos y cifras de la ficha con números tabulares grandes y etiqueta en versalitas | `cubo.json` | Diseño | Antes de las 8:00 |
| Barra de nivel con marcador | Cobertura de la dotación sobre la banda P10–P90 de la lámina; almacenamiento de La Boquilla frente al NAMO; agua comprometida hasta y más allá del total | `cubo.json`, `web/reglas.js` | Diseño (estilo) + agente web (marcado) | Estilo antes de las 8:00; marcado nuevo después |
| Píldoras de estado | Semáforo y plazo como píldoras con símbolo (✓ ! ✕ ?) y fondo claro; nunca solo color | Reglas del kit §2.4 | Diseño | Antes de las 8:00 |
| «Needs attention» | Lista descriptiva: qué parcelas quedan en rojo con la dotación elegida, cuáles están por vencer, qué falta medir. Cada renglón dice el hecho y «review with your module technician»; ninguno dice qué sembrar | `cubo.json`, `parcelas.geojson` | Agente de prioridades (`web/js/prioridades.js`) con los estilos del sistema | Lo que entregue antes de las 8:00 |
| Hoja inferior en teléfono | Ficha con asa, esquinas superiores redondeadas y el mapa visible detrás; controles en una sola línea | — | Diseño (CSS) + agente web (barra) | Antes de las 8:00 |
| Sombreado del relieve en 2D | Capa «Terrain» con el sombreado de MapLibre sobre las teselas NASADEM que ya existen (`web/data/dem/`) | NASADEM, ya en el repo | Agente de relieve (`web/js/relieve.js`) | Antes de las 8:00 si no cambia cifras |
| Elevación en rampa de color | Rampa hipsométrica con la capa `color-relief` de MapLibre; los extremos se leen de los datos de cada zona, no se escriben | NASADEM | Agente de relieve | Antes de las 8:00 si cabe; si no, después |
| Área de estudio resaltada | Fuera de la zona piloto, el mapa se atenúa con un velo gris; dentro, color pleno | Rectángulos de `params.json` | Agente de relieve o web | Antes de las 8:00 |
| Barra de escala y norte | Control de escala de MapLibre | — | Agente web | Antes de las 8:00 |
| Curvas de nivel | Curvas calculadas de NASADEM en el motor, con su intervalo declarado en `params.json` | NASADEM | Motor (integrador) | Después del evento |
| Pendiente por clases | Clases de pendiente a escala de zona; los cortes con fuente o como [S] | NASADEM | Motor | Después del evento |
| Microcuencas | Cuencas de aporte a partir de la dirección de flujo que ya calcula A9 | NASADEM | Sesión de datos + motor | Después del evento |
| Orientación de laderas | Solo si sirve a una decisión del agricultor; en terreno nivelado de riego por gravedad aporta poco | NASADEM | — | Por decidir |
| Ortomosaico | Imagen de color verdadero de HLS (NASA) como mapa base | HLS vía NASA GIBS | Agente web | Después del evento (red y licencia por revisar) |

## 2. Sistema visual
Los tokens viven en `web/style.css` (`:root`). Los colores de identidad del kit (C1 §10) no cambian: Agua, Brote, Tierra, Ámbar y Arena.

- **Tipografía:** Atkinson Hyperlegible, copiada a `web/vendor/` con su licencia OFL y hash. Seis tamaños de pantalla, con mínimo de 12 px (`--fs-1` a `--fs-6`). Números tabulares en todas las cifras.
- **Superficies:**
  - página en Arena;
  - tarjetas blancas, translúcidas cuando flotan sobre el mapa, con radio grande y sombra suave;
  - un solo borde fino en lugar de bordes gruesos.
- **Estados:** semáforo y plazo como píldoras, con símbolo y texto. Los colores de estado tienen al menos 3:1 contra su fondo; el verde y el rojo del semáforo se separan también por luminancia.
- **Niveles:** barra horizontal con la banda P10–P90 y el marcador de la dotación; los extremos se rotulan con «likely».
- **Movimiento:** transiciones cortas de entrada de tarjetas y de la hoja inferior; nada en bucle; respeta `prefers-reduced-motion`.

## 3. Pantallas

**Centro de control (escritorio):**
- El mapa ocupa todo el fondo.
- Arriba, la barra de marca, delgada.
- Debajo, la tarjeta de dotación: deslizador con su valor grande, marcas como control segmentado e interruptor de lluvia.
- A la izquierda flota la tarjeta del agua comprometida, con la cifra grande y su barra de nivel.
- El panel derecho es una columna de tarjetas: conteos con píldoras, «Needs attention», parcelas, presa y acuífero, contexto regional plegado.

**Centro de control (teléfono):**
- Mapa a pantalla completa.
- La dotación se reduce a una línea («Allocation · value · Change») que despliega la tarjeta completa.
- El indicador va en una tarjeta compacta.

**Ficha, en tres niveles:**
1. **La respuesta:** veredicto con símbolo, hectáreas que alcanza la dotación con su rango y años de compromiso.
2. **Las opciones lado a lado:** cada tarjeta con su barra de nivel, sus años y sus hectáreas.
3. **El resto plegado:** «Why this option?», memoria, NDVI, suelo, relieve, evidencia y fuentes.

El aviso de juicio local queda siempre a la vista al pie de la respuesta.

## 4. Coordinación
El reparto de archivos es el de `docs/coordinacion.md` (rama de integración). Lo que este documento pide a otros dueños se manda por `send_message` al integrador. Cada entrega lleva las capturas de P0757, P0632 y L0175 en Pixel 7 y en escritorio.
