<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Guion del recorrido largo · 60 a 90 segundos, sin voz

**No es el video del formulario** (ese es el de 30 s o menos: `docs/pitch/guion_video_30s.md`). Es un recorrido con más calma para el README y para apoyar la exposición. Mismas reglas: la página real, ninguna cifra escrita a mano, sin palabras vetadas, en inglés, sin logotipos.

Lo graba el mismo grabador, que LEE los subtítulos de la sección 5 de este archivo:

```
RAIZ_VIDEO=recorrido node tests/e2e/grabar_video.mjs
```

Salidas: `docs/pitch/video_recorrido.mp4` y `docs/pitch/video_recorrido.srt`.

## 1. Qué cambia frente al video de 30 s

- **Las mismas diez tomas, con más tiempo cada una.** Las tarjetas se leen completas; en cada golpe la acción ocurre igual y el resultado se queda a la vista varios segundos (alcanza para leer «Why it's suggested» y «Benefits», para ver las gotas completas y para seguir la lista de pruebas).
- Los encuadres, los resaltados, los rótulos y los selectores son los de la sección 3 del guion de 30 s; aquí solo cambian los tiempos.
- Los límites que comprueba el grabador son otros: de 60 a 90 s y menos de 25 MB (el de 30 s conserva los suyos).

## 2. Reglas de lo que se agrega

Las de la sección 2 de `docs/pitch/guion_video_30s.md`: ningún dígito en subtítulos, rótulos ni tarjetas; 10 palabras o menos por subtítulo; sin «first», «only», «save…», «best» ni «recommend…»; el cierre lleva el aviso de juicio.

## 3. Tabla de tomas

Duración total: **65.0 segundos**.

| Toma | Inicio (s) | Fin (s) | Qué se ve | Rótulo | Subtítulo (inglés) |
|---|---|---|---|---|---|
| 1 · Qué es | 0 | 4 | Tarjeta de apertura | — | Before you plant, see the water you are committing. |
| 2 · Cómo funciona | 4 | 10 | Tarjeta «How it works» | — | NASA data, a crop-water model, an answer per field. |
| 3 · La dotación | 10 | 16 | Clic en «Like 2025»: el deslizador baja, el mapa cambia y el indicador sube (en el tablero, si es la portada) | Set the water | Set the water allocation. The map and the indicator respond. |
| 4 · La parcela | 16 | 26 | Clic en P0757; su frase principal; sus opciones lado a lado | Pick a field | Each option: water asked, hectares covered, years committed. |
| 5 · El porqué | 26 | 37 | Clic en «Why?» de una alternativa; «Why it's suggested»; «Benefits» | Ask why | Every option says why, and what changes from today. |
| 6 · La gota | 37 | 43 | «Follow the drop» con sus gotas | Follow the drop | From the dam to the crop and the aquifer. |
| 7 · Los años | 43 | 49 | Vista 3D: «Play» hasta el año destacado y su nota | Look back | The year the dam delivered no water. |
| 8 · Compartir | 49 | 55 | El mensaje de WhatsApp cambia de idioma | Share | A message for the farmer, in their language. |
| 9 · Las pruebas | 55 | 61 | «Tests in sight», con el estado de cada prueba | Check the tests | Five tests, published whatever the result. |
| 10 · Cierre | 61 | 65 | Tarjeta de cierre | — | The farmer decides. |

## 4. Cifras que la página muestra

Ninguna se escribe. Son las de la sección 4 del guion de 30 s (las mismas tomas sobre la misma parcela); vuelva a leerlas en la página final.

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
00:00:16,000 --> 00:00:26,000
Each option: water asked, hectares covered, years committed.

5
00:00:26,000 --> 00:00:37,000
Every option says why, and what changes from today.

6
00:00:37,000 --> 00:00:43,000
From the dam to the crop and the aquifer.

7
00:00:43,000 --> 00:00:49,000
The year the dam delivered no water.

8
00:00:49,000 --> 00:00:55,000
A message for the farmer, in their language.

9
00:00:55,000 --> 00:01:01,000
Five tests, published whatever the result.

10
00:01:01,000 --> 00:01:05,000
The farmer decides.
```

## 6. Golpes que todavía no existen en el grabador

Esta primera versión del recorrido es el video corto con más calma. Para que además muestre más funciones faltan tramos nuevos en `tests/e2e/grabar_video.mjs` (`TOMAS` y `tramosDelExplorador`), cada uno con su rótulo, su encuadre, su resaltado y su comprobación:

| Golpe | Qué mostraría | Selectores de partida | Subtítulo propuesto |
|---|---|---|---|
| La lluvia | El interruptor «Rain»: el indicador sube | `#lluvia`, `#indicador-cifra` | Less rain: every option asks for more water. |
| Otras parcelas | Las fichas de P0632 (plazo «free») y L0175 (plazo «committed») | `.boton-parcela[data-id]`, `.ficha-plazo` | A free field can choose. An orchard stays committed. |
| El goteo | En «Follow the drop», el botón «What if this field switches to drip?» (solo si `web/data/cubo.json` → `meta.goteo.disponible`) | `#seccion-gota` | The same field, if it switched to drip. |
| El relieve | La capa «Terrain & runoff» y «Simulate a storm» en el mapa 2D (`web/js/relieve.js`) | `#capa-relieve` | Where heavy rain runs and gathers. |
| La hoja | «Print field sheet»: la ficha con `@media print` (emulación de Playwright) | `#boton-imprimir` | A sheet to print for the farmer. |
| Más del «Why?» | «Evidence», «What we don't know» y «Risks needing local review» | `dd[data-respuesta]` | What is known, and what is not. |

Además, con más tiempo por toma conviene no cortar en el clic: dejar que se vea abrir la ficha y abrir «Why?» (hoy esos tramos cortan en el clic también en el recorrido).
