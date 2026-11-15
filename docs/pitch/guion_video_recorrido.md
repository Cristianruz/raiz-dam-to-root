<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Guion del recorrido largo · 60 a 90 segundos, sin voz

**No es el video del formulario** (ese es el de 30 s o menos: `docs/pitch/guion_video_30s.md`). Es un recorrido con más calma para el README y para apoyar la exposición. Mismas reglas: la página real, ninguna cifra escrita a mano, sin palabras vetadas, en inglés, sin logotipos.

Lo graba el mismo grabador, que LEE los subtítulos de la sección 5 de este archivo:

```
RAIZ_VIDEO=recorrido node tests/e2e/grabar_video.mjs
```

Salidas: `docs/pitch/video_recorrido.mp4` y `docs/pitch/video_recorrido.srt`.

## 1. Qué cambia frente al video de 30 s

- **Las mismas tomas, con más tiempo cada una**: las tarjetas se leen completas y el resultado de cada acción se queda a la vista varios segundos.
- **Tres golpes más**: el idioma de la portada (del inglés al español), las otras dos parcelas de ejemplo (P0632, con el plazo libre, y L0175, un nogal comprometido) y la vista 3D con su línea de tiempo hasta el año destacado.
- Necesita la portada nueva (el tablero) y la vista 3D: si falta alguna, el grabador lo dice y no produce el video.
- Los límites que comprueba el grabador son otros: de 60 a 90 s y menos de 25 MB (el de 30 s conserva los suyos).

## 2. Reglas de lo que se agrega

Las de la sección 2 de `docs/pitch/guion_video_30s.md`: ningún dígito en subtítulos, rótulos ni tarjetas; 10 palabras o menos por subtítulo; sin «first», «only», «save…», «best» ni «recommend…»; el cierre lleva el aviso de juicio.

## 3. Tabla de tomas

Duración total: **82.0 segundos**. Los encuadres, los resaltados y los selectores de las tomas que comparte con el video corto son los de la sección 3 de su guion.

| Toma | Inicio (s) | Fin (s) | Qué se ve | Resaltado | Rótulo | Subtítulo (inglés) |
|---|---|---|---|---|---|---|
| 1 · Qué es | 0 | 4 | Tarjeta de apertura | — | — | Before you plant, see the water you are committing. |
| 2 · Cómo funciona | 4 | 10 | Tarjeta «How it works» | — | — | NASA data, a crop-water model, an answer per field. |
| 3 · La dotación | 10 | 16 | En la portada: clic en una marca de la dotación; cambian la cifra, el indicador y los colores del mapa | El control y, después, lo que cambió | Set the water | Set the water allocation. The map and the indicator respond. |
| 4 · El idioma | 16 | 21 | En la portada: el selector de idioma pasa del inglés al español y la página se vuelve a escribir | El selector y, después, el título | Your language | The app speaks the farmer's language. |
| 5 · La parcela | 21 | 30 | En el explorador: clic en P0757; su frase principal; sus opciones lado a lado | Como en el video corto | Pick a field | Each option: water asked, hectares covered, years committed. |
| 6 · El porqué | 30 | 40 | Clic en «Why?» de una alternativa; «Why it's suggested»; «Benefits» | Como en el video corto | Ask why | Every option says why, and what changes from today. |
| 7 · La gota | 40 | 46 | «Follow the drop» con sus gotas | El primer nodo | Follow the drop | From the dam to the crop and the aquifer. |
| 8 · La evidencia | 46 | 52 | La memoria satelital de la parcela por año y su curva de verdor | La tira de años y, después, la curva | Satellite evidence | What satellites saw on this field, year by year. |
| 9 · Otras parcelas | 52 | 60 | La ficha de P0632 y la de L0175 | La frase principal y el plazo de cada una | Other fields | A free field can choose. An orchard stays committed. |
| 10 · Los años | 60 | 66 | Vista 3D: «Play» hasta el año destacado y su nota | La nota del año destacado | Look back | The year the dam delivered no water. |
| 11 · Compartir | 66 | 72 | El mensaje de WhatsApp cambia de idioma | El saludo del mensaje | Share | A message for the farmer, in their language. |
| 12 · Las pruebas | 72 | 78 | «Tests in sight», con el estado de cada prueba | El estado de cada prueba | Check the tests | Five tests, published whatever the result. |
| 13 · Cierre | 78 | 82 | Tarjeta de cierre | — | — | The farmer decides. |

Notas:
- **Toma 4.** El selector se localiza por estructura (el `<select>` cuyas opciones traen `en` y `es`). Al terminar, fuera de cámara, la portada vuelve al inglés.
- **Toma 10.** La vista 3D dibuja pocos cuadros por segundo con WebGL por software: en una máquina sin tarjeta gráfica se ve entrecortada. Por eso en el video corto su lugar lo ocupa la evidencia satelital.

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
00:00:21,000 --> 00:00:30,000
Each option: water asked, hectares covered, years committed.

6
00:00:30,000 --> 00:00:40,000
Every option says why, and what changes from today.

7
00:00:40,000 --> 00:00:46,000
From the dam to the crop and the aquifer.

8
00:00:46,000 --> 00:00:52,000
What satellites saw on this field, year by year.

9
00:00:52,000 --> 00:01:00,000
A free field can choose. An orchard stays committed.

10
00:01:00,000 --> 00:01:06,000
The year the dam delivered no water.

11
00:01:06,000 --> 00:01:12,000
A message for the farmer, in their language.

12
00:01:12,000 --> 00:01:18,000
Five tests, published whatever the result.

13
00:01:18,000 --> 00:01:22,000
The farmer decides.
```

## 6. Golpes que todavía no existen en el grabador

Para sumarlos hace falta un tramo nuevo en `tests/e2e/grabar_video.mjs` (en `GOLPES`, `TOMAS` y `tramosDelTablero` o `tramosDelExplorador`), con su rótulo, su encuadre, su resaltado y su comprobación:

| Golpe | Qué mostraría | Dónde | Subtítulo propuesto |
|---|---|---|---|
| Comparar opciones | La vista de comparar opciones de la portada | Tablero | Compare the options side by side. |
| La hoja | «Print field sheet»: la ficha con `@media print` (emulación de Playwright) | Explorador, `#boton-imprimir` | A sheet to print for the farmer. |
| El suelo | Las filas de suelo de las tarjetas y «Soil and satellite evidence» | Explorador, `#t-evidencia` | What the soil says about each option. |
| La lluvia | El interruptor de la lluvia: el indicador sube | Tablero o explorador (`#lluvia`) | Less rain: every option asks for more water. |
| El goteo | En «Follow the drop», el botón del goteo (solo si `web/data/cubo.json` → `meta.goteo.disponible`) | Explorador, `#seccion-gota` | The same field, if it switched to drip. |
| El relieve | La capa de relieve y la tormenta simulada en el mapa 2D (`web/js/relieve.js`) | Explorador, `#capa-relieve` | Where heavy rain runs and gathers. |

Además, con más tiempo por toma conviene no cortar en el clic: dejar que se vea abrir la ficha y abrir «Why?» (hoy esos tramos cortan en el clic también en el recorrido).
