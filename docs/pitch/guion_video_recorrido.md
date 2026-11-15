<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Guion del recorrido largo · 60 a 90 segundos, sin voz

**BORRADOR. Este video todavía no se graba.** No es el video del formulario (ese es el de 30 s o menos: `docs/pitch/guion_video_30s.md`). Es un recorrido con más calma para el README y para apoyar la exposición. Mismas reglas: la página real, ninguna cifra escrita a mano, sin palabras vetadas, en inglés, sin logotipos.

Salidas previstas: `docs/pitch/video_recorrido.mp4` y `docs/pitch/video_recorrido.srt`.

## 1. Qué cambia frente al video de 30 s

- Las mismas tarjetas (`docs/pitch/video/tarjetas.html`): apertura, «How it works» y cierre, con más tiempo de lectura.
- Los mismos siete golpes, sin cortes en el clic donde no hagan falta: se ve abrir la ficha y abrir «Why?».
- Golpes nuevos: la lluvia, las otras dos parcelas de ejemplo, el goteo, el relieve y la hoja para imprimir.
- Cada golpe dura de 5 a 8 s: la acción, la consecuencia y dos segundos para leer.

## 2. Reglas de lo que se agrega

Las de la sección 2 de `docs/pitch/guion_video_30s.md`: ningún dígito en subtítulos, rótulos ni tarjetas; 10 palabras o menos por subtítulo; sin «first», «only», «save…», «best» ni «recommend…»; el cierre lleva el aviso de juicio.

## 3. Tabla de tomas

Duración total: **88.0 segundos**.

| Toma | Inicio (s) | Fin (s) | Qué se ve | Resaltado | Rótulo | Subtítulo (inglés) |
|---|---|---|---|---|---|---|
| 1 · Qué es | 0 | 4 | Tarjeta de apertura | — | — | Before you plant, see the water you are committing. |
| 2 · Cómo funciona | 4 | 10 | Tarjeta «How it works» | — | — | NASA data, a crop-water model, an answer per field. |
| 3 · La dotación | 10 | 17 | Las tres marcas, una por una: «Like 2025», «Like 2026» y «Normal year»; el mapa y el indicador cambian cada vez. Si la portada es el tablero, ahí | La cifra del indicador | Set the water | Set the water allocation. The map and the indicator respond. |
| 4 · La lluvia | 17 | 22 | El interruptor «Rain»: el indicador sube | El interruptor y la cifra del indicador | Change the rain | Less rain: every option asks for more water. |
| 5 · La parcela | 22 | 30 | Clic en P0757; la ficha se abre a la vista: frase principal, plazo «ending soon», memoria satelital y la curva de verdor | La frase principal y, después, la franja de la memoria | Pick a field | An alfalfa field, with its water term ending soon. |
| 6 · Las opciones | 30 | 38 | Las tarjetas lado a lado; baja despacio por los renglones de agua, suelo y dinero | Agua por año y hectáreas de cada tarjeta | Compare options | Each option: water asked, hectares covered, years committed. |
| 7 · El porqué | 38 | 48 | Clic en «Why?» de una alternativa; se leen «Why it's suggested», «Evidence», «Benefits» y «What we don't know» | Cada respuesta, una tras otra | Ask why | Every option says why, and what changes from today. |
| 8 · La gota | 48 | 55 | «Follow the drop» con sus gotas; después, clic en «What if this field switches to drip?» | El primer nodo y, después, el botón del goteo | Follow the drop | From the dam to the crop and the aquifer. |
| 9 · Otras parcelas | 55 | 62 | La ficha de P0632 (plazo «free») y la de L0175 (plazo «committed»): solo la cabecera y la primera tarjeta | La insignia del plazo | Other fields | A free field can choose. An orchard stays committed. |
| 10 · Los años | 62 | 69 | Vista 3D: «Play» recorre los años hasta el destacado y aparece su nota | La nota del año destacado | Look back | The year the dam delivered no water. |
| 11 · El relieve | 69 | 74 | Mapa 2D con la capa «Terrain & runoff» y «Simulate a storm» | El botón de la tormenta | Read the terrain | Where heavy rain runs and gathers. |
| 12 · Compartir | 74 | 80 | La vista previa del mensaje de WhatsApp en dos idiomas; después, «Print field sheet» | El saludo del mensaje; el botón de imprimir | Share | A message for the farmer, and a sheet to print. |
| 13 · Las pruebas | 80 | 85 | «Tests in sight» de arriba abajo, con la puerta automática | El estado de cada prueba | Check the tests | Five tests, published whatever the result. |
| 14 · Cierre | 85 | 88 | Tarjeta de cierre | — | — | The farmer decides. |

Notas:
- **Toma 8.** El botón del goteo solo existe si `web/data/cubo.json` → `meta.goteo.disponible` es verdadero; si no, la toma se queda en el diagrama.
- **Toma 11.** «Simulate a storm» y la capa de relieve las dibuja `web/js/relieve.js`; si no están, la toma se omite y su tiempo pasa a la toma 10.
- **Toma 12.** «Print field sheet» abre el diálogo de impresión del navegador: en la grabación se sustituye por la hoja con `@media print` (emulación de Playwright) o se muestra solo el botón.

## 4. Cifras que la página muestra

Ninguna se escribe. Son las de la sección 4 del guion de 30 s, más las de P0632 y L0175 (`web/data/cubo.json` → `parcelas.P0632`, `parcelas.L0175`), las del goteo (bloque `gota` de la variante de goteo) y las de la lluvia seca (`agua.lamina_bruta` con la llave de la variante seca de `cubo.lluvia_pct`). La tabla, toma por toma, se llena cuando se grabe, leyendo la página.

## 5. Subtítulos (archivo .srt)

Con el mismo formato que el guion de 30 s, para que el grabador lo lea igual.

```text
1
00:00:00,000 --> 00:00:04,000
Before you plant, see the water you are committing.

2
00:00:04,000 --> 00:00:10,000
NASA data, a crop-water model, an answer per field.

3
00:00:10,000 --> 00:00:17,000
Set the water allocation. The map and the indicator respond.

4
00:00:17,000 --> 00:00:22,000
Less rain: every option asks for more water.

5
00:00:22,000 --> 00:00:30,000
An alfalfa field, with its water term ending soon.

6
00:00:30,000 --> 00:00:38,000
Each option: water asked, hectares covered, years committed.

7
00:00:38,000 --> 00:00:48,000
Every option says why, and what changes from today.

8
00:00:48,000 --> 00:00:55,000
From the dam to the crop and the aquifer.

9
00:00:55,000 --> 00:01:02,000
A free field can choose. An orchard stays committed.

10
00:01:02,000 --> 00:01:09,000
The year the dam delivered no water.

11
00:01:09,000 --> 00:01:14,000
Where heavy rain runs and gathers.

12
00:01:14,000 --> 00:01:20,000
A message for the farmer, and a sheet to print.

13
00:01:20,000 --> 00:01:25,000
Five tests, published whatever the result.

14
00:01:25,000 --> 00:01:28,000
The farmer decides.
```

## 6. Qué le falta al grabador para producirlo

`tests/e2e/grabar_video.mjs` hoy solo produce el video de 30 s. Para el recorrido falta:

1. **Elegir el guion y las salidas.** Hoy `GUION`, `SRT` y `MP4` son constantes; hace falta un modo (por ejemplo `RAIZ_VIDEO=recorrido`) que lea este archivo y escriba `video_recorrido.mp4` y `video_recorrido.srt`.
2. **Su lista de tomas.** `TOMAS` (rótulos y orden) y `tramosDelExplorador` están hechos para las diez tomas del video corto. Las tomas 3, 5, 6, 7, 8, 10, 12 y 13 reutilizan los tramos que ya existen, con más tiempo y sin `cortarEn`; las tomas 4, 9 y 11 y las segundas mitades de la 8 y la 12 son tramos nuevos.
3. **Sus comprobaciones de duración.** Las de 28 a 29 s y «30 s o menos» son del video del formulario; el recorrido necesita las suyas (60 a 90 s) y el mismo tope de peso que pida el README.
4. **Comprobaciones nuevas.** Que el goteo esté disponible antes de pulsarlo, que la capa de relieve exista y que las tres fichas abran.

Lo demás ya sirve tal cual: las tarjetas y las bandas, el puntero y el resaltado, los encuadres, la marca de sincronía, el montaje con `ffmpeg` y la revisión de textos sin dígitos ni palabras vetadas.
