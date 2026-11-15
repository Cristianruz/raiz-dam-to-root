<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Guion del recorrido largo · de uno a dos minutos, sin voz

**No es el video del formulario** (ese es el de 30 s o menos: `docs/pitch/guion_video_30s.md`). Es un recorrido con más calma para el README y para apoyar la exposición. Mismas reglas: la página real, ninguna cifra escrita a mano, sin palabras vetadas, en inglés, sin logotipos.

Lo graba el mismo grabador, que LEE los subtítulos de la sección 5 de este archivo:

```
RAIZ_VIDEO=recorrido node tests/e2e/grabar_video.mjs
```

Salidas: `docs/pitch/video_recorrido.mp4` y `docs/pitch/video_recorrido.srt`.

## 1. Qué cambia frente al video de 30 s

- **Las mismas tomas, con más tiempo cada una**: las tarjetas se leen completas y el resultado de cada acción se queda a la vista varios segundos.
- **Siete golpes más**: el idioma de la portada (del inglés al español); en la portada, la casilla de menos lluvia, las zonas piloto lado a lado y el registro histórico de lluvia de NASA POWER (agregados el 15-nov); la sección de suelo y evidencia satelital de la ficha; las otras dos parcelas de ejemplo (P0632, con el plazo libre, y L0175, un nogal comprometido); y la vista 3D con su línea de tiempo hasta el año destacado.
- **El mismo movimiento** del video corto: tarjetas animadas, transiciones entre tomas, banda que sube, barra de avance y acercamiento lento (`docs/pitch/guion_video_30s.md`, sección 6).
- Necesita la portada nueva (el tablero) y la vista 3D: si falta alguna, el grabador lo dice y no produce el video.
- Los límites que comprueba el grabador son otros: de 60 a 120 s y menos de 30 MB (el de 30 s conserva los suyos).

## 2. Reglas de lo que se agrega

Las de la sección 2 de `docs/pitch/guion_video_30s.md`: ningún dígito en subtítulos, rótulos ni tarjetas; 10 palabras o menos por subtítulo; sin «first», «only», «save…», «best» ni «recommend…»; el cierre lleva el aviso de juicio.

## 3. Tabla de tomas

Duración total: **103.4 segundos**. Los encuadres, los resaltados y los selectores de las tomas que comparte con el video corto son los de la sección 3 de su guion.

| Toma | Inicio (s) | Fin (s) | Qué se ve | Resaltado | Rótulo | Subtítulo (inglés) |
|---|---|---|---|---|---|---|
| 1 · Qué es | 0 | 4 | Tarjeta de apertura, animada | — | — | Before you plant, see the water you are committing. |
| 2 · Cómo funciona | 4 | 10 | Tarjeta «How it works», animada: tres pasos y cuatro señas de cómo está hecha | — | — | NASA data, a crop-water model, an answer per field. |
| 3 · La dotación | 10 | 16 | En la portada: clic en una marca de la dotación; cambian la cifra, el indicador y los colores del mapa | El control y, después, lo que cambió | Set the water | Set the water allocation. The map and the indicator respond. |
| 4 · El idioma | 16 | 21 | En la portada: el selector de idioma pasa del inglés al español y la página se vuelve a escribir | El selector y, después, el título | Your language | The app speaks the farmer's language. |
| 5 · Menos lluvia | 21 | 27 | En la portada, dos tramos: (a) clic en la casilla de menos lluvia (`#rain`); cambia el indicador del agua comprometida; (b) el bloque «lado a lado» del resumen, con la barra de menos lluvia resaltada en la zona y en las opciones | La casilla y el indicador; después, las barras de la zona en uso y las de la opción actual | Less rain | Explore a drier year. Every option needs more irrigation water. |
| 6 · Las zonas | 27 | 32 | En el mismo bloque: clic en la otra zona piloto; cambian la zona en uso y las opciones de su parcela | La zona por elegir y, después, la zona elegida y sus opciones | Pilot areas | The pilot areas, side by side. Tap one to open. |
| 7 · El registro de lluvia | 32 | 37.4 | En la portada, vista de la historia: las tres cifras del rango histórico de NASA POWER; la página baja a la gráfica de la comprobación año por año | Las tres cifras y, después, la gráfica | Rainfall record | The rainfall record from NASA POWER, checked year by year. |
| 8 · La parcela | 37.4 | 46.4 | En el explorador: clic en P0757; su frase principal; sus opciones lado a lado | Como en el video corto | Pick a field | Each option: water asked, hectares covered, years committed. |
| 9 · El porqué | 46.4 | 56.4 | Clic en «Why?» de una alternativa; «Why it's suggested»; «Benefits» | Como en el video corto | Ask why | Every option says why, and what changes from today. |
| 10 · La gota | 56.4 | 62.4 | «Follow the drop» con sus gotas | El primer nodo | Follow the drop | From the dam to the crop and the aquifer. |
| 11 · La evidencia | 62.4 | 68.4 | La memoria satelital de la parcela por año y su curva de verdor | La tira de años y, después, la curva | Satellite evidence | What satellites saw on this field, year by year. |
| 12 · El suelo | 68.4 | 73.4 | En la misma ficha, la sección «Soil and satellite evidence» (`#t-evidencia`), con sus fuentes | El título de la sección | Soil and evidence | Soil and satellite evidence, each with its source. |
| 13 · Otras parcelas | 73.4 | 81.4 | La ficha de P0632 y la de L0175 | La frase principal y el plazo de cada una | Other fields | A free field can choose. An orchard stays committed. |
| 14 · Los años | 81.4 | 87.4 | Vista 3D: «Play» hasta el año destacado y su nota | La nota del año destacado | Look back | The year the dam delivered no water. |
| 15 · Compartir | 87.4 | 93.4 | El mensaje de WhatsApp cambia de idioma | El saludo del mensaje | Share | A message for the farmer, in their language. |
| 16 · Las pruebas | 93.4 | 99.4 | «Tests in sight», con el estado de cada prueba | El estado de cada prueba | Check the tests | Five tests, published whatever the result. |
| 17 · Cierre | 99.4 | 103.4 | Tarjeta de cierre, animada | — | — | The farmer decides. |

Notas:
- **Toma 4.** El selector se localiza por estructura (el `<select>` cuyas opciones traen `en` y `es`). Al terminar, fuera de cámara, la portada vuelve al inglés.
- **Tomas 5 a 7.** Se graban en la portada, después de la del idioma; al terminar, fuera de cámara, la portada vuelve al resumen con la dotación, la lluvia y la zona con que abrió. Con 20 % menos de lluvia las cifras cambian poco (es lo que dicen los datos): la toma lo muestra tal cual.
- **Toma 14.** La vista 3D dibuja pocos cuadros por segundo con WebGL por software: en una máquina sin tarjeta gráfica se ve entrecortada. Por eso en el video corto su lugar lo ocupa la evidencia satelital.

## 4. Cifras que la página muestra

Ninguna se escribe. Son las de la sección 4 del guion de 30 s, más las de las fichas de P0632 y L0175 (`web/data/cubo.json` → `parcelas.P0632`, `parcelas.L0175`; `web/data/parcelas.geojson`), el año destacado y sus conteos (`web/data/gemelo.json` → `tiempo`; `web/js/tiempo.js`) y los textos de la portada en español (`web/js/textos_tablero.js`). La tabla, toma por toma, se llena al grabar sobre la página final.

## 5. Subtítulos (archivo .srt)

Con el mismo formato que el guion de 30 s: el grabador lee este bloque, lo escribe en `docs/pitch/video_recorrido.srt` y saca de él la duración de cada toma.

```text
1
00:00:00,000 --> 00:00:04,000
Before you plant, see the water you are committing.

2
00:00:04,000 --> 00:00:10,000
NASA data, a crop-water model, an answer per field.

3
00:00:10,000 --> 00:00:16,000
Set the water allocation. The map and the indicator respond.

4
00:00:16,000 --> 00:00:21,000
The app speaks the farmer's language.

5
00:00:21,000 --> 00:00:27,000
Explore a drier year. Every option needs more irrigation water.

6
00:00:27,000 --> 00:00:32,000
The pilot areas, side by side. Tap one to open.

7
00:00:32,000 --> 00:00:37,400
The rainfall record from NASA POWER, checked year by year.

8
00:00:37,400 --> 00:00:46,400
Each option: water asked, hectares covered, years committed.

9
00:00:46,400 --> 00:00:56,400
Every option says why, and what changes from today.

10
00:00:56,400 --> 00:01:02,400
From the dam to the crop and the aquifer.

11
00:01:02,400 --> 00:01:08,400
What satellites saw on this field, year by year.

12
00:01:08,400 --> 00:01:13,400
Soil and satellite evidence, each with its source.

13
00:01:13,400 --> 00:01:21,400
A free field can choose. An orchard stays committed.

14
00:01:21,400 --> 00:01:27,400
The year the dam delivered no water.

15
00:01:27,400 --> 00:01:33,400
A message for the farmer, in their language.

16
00:01:33,400 --> 00:01:39,400
Five tests, published whatever the result.

17
00:01:39,400 --> 00:01:43,400
The farmer decides.
```

## 6. Golpes que todavía no existen en el grabador

Para sumarlos hace falta un tramo nuevo en `tests/e2e/grabar_video.mjs` (en `GOLPES`, `TOMAS` y `tramosDelTablero` o `tramosDelExplorador`), con su rótulo, su encuadre, su resaltado y su comprobación:

| Golpe | Qué mostraría | Dónde | Subtítulo propuesto |
|---|---|---|---|
| Comparar opciones | La vista de comparar opciones de la portada | Tablero | Compare the options side by side. |
| La hoja | «Print field sheet»: la ficha con `@media print` (emulación de Playwright) | Explorador, `#boton-imprimir` | A sheet to print for the farmer. |
| El goteo | En «Follow the drop», el botón del goteo (solo si `web/data/cubo.json` → `meta.goteo.disponible`) | Explorador, `#seccion-gota` | The same field, if it switched to drip. |
| El relieve | La capa de relieve y la tormenta simulada en el mapa 2D (`web/js/relieve.js`) | Explorador, `#capa-relieve` | Where heavy rain runs and gathers. |

Además, con más tiempo por toma conviene no cortar en el clic: dejar que se vea abrir la ficha y abrir «Why?» (hoy esos tramos cortan en el clic también en el recorrido).
