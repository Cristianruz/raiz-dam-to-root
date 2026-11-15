<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Guion del video · 30 segundos o menos, sin voz

**Video diseñado (15-nov).** Lo graba y lo monta `tests/e2e/grabar_video.mjs`, que LEE los subtítulos de la sección 5 de este archivo. Todo lo que se ve de la aplicación es la página real con sus datos; lo que se agrega (tarjetas, rótulos, subtítulos, puntero y resaltado) va en inglés y sin cifras escritas a mano.

## 1. Qué fija el kit (pieza C7) y qué pidió Cristian

| Punto | Lo que dice | Dónde |
|---|---|---|
| Duración | 30 segundos o menos; se apunta a 28–29 s (pasarse deja fuera el proyecto) | `docs/kit/40_kit_v4_proyecto_definitivo.md`, C7 y Q2; guía de envío |
| Sonido | Sin voz ni música: texto en pantalla y subtítulos en inglés incrustados; pista de audio en silencio | Kit C7; kit §0.3 |
| Imagen | La pantalla de la web real | Kit C7 |
| Formato | MP4 H.264, yuv420p, 1920 × 1080, 25 fps, menos de 10 MB | El grabador lo comprueba con `ffprobe` |
| Entrega | Liga pública, probada en una ventana de incógnito a las 12:00 del domingo | Kit C7; `docs/sintesis/S10_plan_sapo.md` §7 |
| Imágenes con IA | Ninguna | Kit C7 |
| Dirección (Cristian, 15-nov) | «Que sea un buen video, que se vea que funciona, y que se exprese todo lo que se puede hacer en el sistema, pero que vean qué es y cómo funciona» | Encargo del video |

El video tiene cuatro partes: **qué es** (tarjeta de apertura), **cómo funciona** (tarjeta de tres pasos), **se ve que funciona** (siete golpes cortos sobre la página real, cada uno con su acción y su consecuencia) y **cierre** (tarjeta con el aviso de juicio y la liga).

## 2. Reglas de lo que se agrega

- **Ningún dígito** en subtítulos, rótulos ni tarjetas. Las cifras que se ven son las que dibuja la página; la sección 4 dice cuáles y de dónde salen.
- Cada subtítulo, de 10 palabras o menos; cada rótulo, de tres o menos. Sin «first», «only», «save…», «best» ni «recommend…» (`CLAUDE.md`, regla 10). El grabador lo revisa leyendo también el texto dibujado de las tarjetas.
- Sin logotipos de la NASA ni de nadie; los iconos de la tarjeta «How it works» están dibujados en `docs/pitch/video/tarjetas.html`. La atribución de OpenStreetMap del mapa se queda donde la pone la página.
- El puntero y el resaltado (un anillo ámbar) son capas temporales que el grabador pone ENCIMA de la página; no cambian su contenido. La página (`web/`) no se toca para el video.
- La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. El cierre lleva el aviso: «This tool supports, never replaces, the judgment of farmers and local experts.»

## 3. Tabla de tomas

Duración total: **29.0 segundos**. Diez tomas: tres tarjetas y siete golpes de la página. Cuadro de 1920 × 1080: la página ocupa los 890 px de arriba y la banda inferior (190 px) lleva el rótulo del golpe y el subtítulo, en Atkinson Hyperlegible (la tipografía de la página) a 58 px.

«Encuadre» es el rectángulo de la ventana de 1366 × 768 que se acerca; «resaltado», el elemento que lleva el anillo. La protagonista de los golpes de la ficha es **P0757** (alfalfar con el plazo por vencer; `web/data/parcelas.geojson`).

| Toma | Inicio (s) | Fin (s) | Qué se ve | Encuadre | Resaltado | Rótulo | Subtítulo (inglés) |
|---|---|---|---|---|---|---|---|
| 1 · Qué es | 0.0 | 2.4 | Tarjeta de apertura: «ROOT – From Dam to Root», el lema de la página, «Orbital Farming» y «Field Shift: Adapting Farms with NASA Data» | Cuadro completo | — | — | Before you plant, see the water you are committing. |
| 2 · Cómo funciona | 2.4 | 5.8 | Tarjeta «How it works»: tres pasos en una línea, con iconos dibujados: «NASA data» (HLS · POWER · IMERG) → «A crop-water model» → «An answer per field» | Cuadro completo | — | — | NASA data, a crop-water model, an answer per field. |
| 3 · La dotación | 5.8 | 8.4 | Clic en la marca «Like 2025»: el deslizador baja, el mapa cambia de color y el indicador «Water already committed by perennial crops» sube. Si la portada es el tablero nuevo, este golpe se graba ahí (sección 7) | De la barra «Water allocation» al indicador y al mapa (mitad izquierda) | La cifra del indicador (`#indicador-cifra`) | Set the water | Set the water allocation. The map and the indicator respond. |
| 4 · La parcela | 8.4 | 12.4 | Tres tramos: (a) clic en **P0757** en la lista «Fields» (corta en el clic); (b) la ficha abierta con su frase principal: agua, hectáreas y años; (c) las tarjetas de las opciones, lado a lado | La ficha entera | (a) el renglón de P0757 en la lista; (b) la frase principal (`#ficha-resumen`); (c) en cada tarjeta, el agua por año y las hectáreas para las que alcanza (`.lamina`, `.alcanza`) | Pick a field | Each option: water asked, hectares covered, years committed. |
| 5 · El porqué | 12.4 | 16.4 | Tres tramos sobre la alternativa «Break the old alfalfa: winter cereal, then forage maize» (`data-opcion="avena_maiz"`): (a) clic en «Why?» (corta en el clic); (b) «Why it's suggested»; (c) «Benefits»: la opción frente a la rotación actual de la parcela | La columna de esa tarjeta, de cerca | (a) el botón «Why?»; (b) y (c) el título y el texto de la respuesta (`dd[data-respuesta]`) | Ask why | Every option says why, and what changes from today. |
| 6 · La gota | 16.4 | 18.8 | En la misma ficha, baja a «Follow the drop»: el diagrama entra en pantalla y las gotas lo recorren una vez | El diagrama | El primer nodo (la presa) con su etiqueta | Follow the drop | From the dam to the crop and the aquifer. |
| 7 · Los años | 18.8 | 21.4 | Vista 3D de «Delicias – Saucillo»: «Play» en la línea de tiempo, que se detiene en el año destacado; aparece su nota «Year without dam water…» | El mapa 3D y el bloque «Observed state by year» (lado derecho) | La nota del año destacado (`.tiempo-destacado`) | Look back | The year the dam delivered no water. |
| 8 · Compartir | 21.4 | 23.8 | En la ficha, «Share with the farmer»: la vista previa del mensaje de WhatsApp cambia de idioma con el selector «Message language» (del inglés al español) | El selector y el teléfono de la vista previa | El saludo del mensaje (`.wa-saludo`) | Share | A message for the farmer, in their language. |
| 9 · Las pruebas | 23.8 | 26.4 | «About & Data» → «Tests in sight»: la lista baja despacio; cada prueba con su estado, también las que no cumplen su criterio | El diálogo, a lo ancho | El estado de cada prueba (`.acerca-estado`) | Check the tests | Five tests, published whatever the result. |
| 10 · Cierre | 26.4 | 29.0 | Tarjeta de cierre: «The farmer decides.», el aviso de juicio, la liga pública y «Installs as an app · opens offline» | Cuadro completo | — | — | The farmer decides. |

Notas de la tabla:
- **Tarjetas (tomas 1, 2 y 10).** Son `docs/pitch/video/tarjetas.html`, capturadas con Playwright a 1920 × 1080, con los colores de `web/style.css` (`:root`) y la tipografía de `web/vendor/`. El lema de la apertura y la frase del cierre salen de los subtítulos 1 y 10 de la sección 5. El subtítulo de las tarjetas va solo en el `.srt` (la tarjeta ya lo dice). La línea «Installs as an app · opens offline» sale solo si existen `web/manifest.webmanifest` (con `display: standalone`) y `web/sw.js`. La liga se lee de `RAIZ_LIGA_PAGINA`; si no viene, es la del proyecto.
- **Toma 2.** Los tres productos que nombra («HLS», «POWER», «IMERG») se comprueban contra `web/data/manifest.json` antes de usar la tarjeta.
- **Tomas 4 y 5: corte en el clic.** Abrir la ficha y abrir «Why?» tardan en dibujarse; por eso el tramo del clic termina en el clic y el siguiente empieza con el resultado ya dibujado. Al abrir «Why?» la página conserva en su sitio las otras tarjetas y la vista salta al final del texto abierto: el tramo siguiente se coloca en «Why it's suggested».
- **Toma 5.** «Break the old alfalfa…» es una de las alternativas de P0757 en la tabla oficial. Si la parcela dejara de traerla, el grabador abre el «Why?» de su primera alternativa y lo avisa.
- **Toma 7.** La línea de tiempo se coloca dos años antes del destacado: «Play» avanza uno de inmediato y otro tras `web/data/gemelo.json` → `tiempo.intervalo_ms`. La vista 3D dibuja pocos cuadros por segundo con WebGL por software y la grabación llega con retraso: este tramo no se coloca con el reloj, sino buscando en la grabación el instante en que aparece el anillo de la nota (queda a 1.2 s del principio del tramo: antes se ve el año anterior y después, el destacado).
- **Toma 9.** «Five» es el número de pruebas de `web/data/pruebas.json`; el grabador comprueba que coincida.
- **Protagonistas.** El kit (C7) habla de las tres protagonistas (P0757, P0632 y L0175). Este corte se queda en P0757 para seguir una sola historia; P0632 y L0175 se ven solo como renglones de la lista «Fields» en la toma 4. Si el equipo quiere sus fichas de vuelta, cuestan un golpe cada una.

## 4. Cifras que la página muestra en cada toma

Estas cifras **no se escriben**: salen solas en la pantalla. Sirven para la revisión de cifras del domingo a las 12:30 (kit Q2). Los valores son los de los datos del 15-nov; vuelva a leerlos en la página final.

| Toma | Cifra que muestra la página | Origen (archivo y campo) |
|---|---|---|
| 1, 2, 10 | Ninguna | — |
| 3 | «3.5 thousand m³/ha» y, tras el clic, «1 thousand m³/ha»; «Like 2025: 1 thousand m³/ha»; el indicador pasa de «at least 125%» a «at least 437%» (rango de 354% a 541%) en «Delicias – Saucillo» | `web/data/cubo.json` → `dotaciones.marcas` (`como_2025`, `como_2026`) y `dotaciones.deslizador`; el indicador lo calcula `web/reglas.js` (`aguaComprometida`) con `cubo.json` → `zonas.delicias_saucillo` |
| 4 | Frase principal: «With 3.5 thousand m³/ha … enough water for 0.97 of 7.95 hectares … 3–4 years (0–1 years left)»; «7.95 ha»; «boundary confidence … 55%»; «Stand age from satellite memory: 3 years»; los años 2016–2026 de la memoria. Tarjetas: «28.4», «25.5» y «18.9 thousand m³/ha per year»; «Enough for 0.97 / 1.09 / 1.46 of 7.95 hectares» con sus rangos; «likely range 23.1–35.2», «21–31.6» y «16.1–22.5»; «Typically applied in this district (2009–2016 records…): 17.4 … 1.59 of 7.95 hectares»; «Commits water for 3–4 years» y «for 1 year»; «Remaining term: 0–1 years» | `web/data/parcelas.geojson` → P0757 (`area_ha`, memoria); `web/data/cubo.json` → `parcelas.P0757.opciones[*].agua` (`lamina_bruta`, `plazo_anios`, `plazo_restante`, `compromiso_millares_ha`, `lamina_local`); las hectáreas las calcula `web/reglas.js` (`evaluarOpcion`); la frase, `web/js/resumen.js` |
| 5 | «Why it's suggested»: el motivo de la tabla oficial («…for at least 12 months») y la frase del agua con «18.9» y «1.46 of 7.95 hectares». «Benefits»: «18.9 thousand m³/ha (median need), less than the current rotation's 28.4»; «1 year; the current rotation's is 3–4 years (0–1 years left on this field)»; «20 days (estimated); the current rotation has 0 days (measured)» | Motivo: `cubo.json` → `parcelas.P0757.opciones` (`avena_maiz`); frase del agua: `web/data/explicaciones.json`; «Benefits»: `web/js/beneficios.js` con `cubo.json` → `opciones[*].agua.lamina_bruta`, `agua.plazo_anios`, `agua.plazo_restante`, `suelo.dias_desnudo`, `suelo.leguminosa` |
| 6 | Los m³ de cada nodo: presa 376,300; parcela 225,780; pérdidas de canal 150,520; cultivo 129,267; acuífero 75,260; otras pérdidas 171,773 | `cubo.json` → `parcelas.P0757`, opción ACTUAL, bloque `gota` |
| 7 | Los años «2023», «2024» y «2025»; la nota del año destacado [P]; los conteos del año por estado de las parcelas de la zona | `web/data/gemelo.json` → `tiempo.anios`, `tiempo.destacados`; los conteos los calcula `web/js/tiempo.js` con las parcelas de `parcelas.geojson` |
| 8 | En el mensaje (en español): «P0757 (7.95 ha)», «3.5 millares/ha» y, por opción, la lámina por año, los años que obliga y las hectáreas para las que alcanza | `web/js/mensaje.js` (plantillas de los cuatro idiomas) con `cubo.json` → `parcelas.P0757.opciones` y `web/reglas.js` |
| 9 | El estado de cada prueba y las cifras de su criterio (por ejemplo, en H1-b, «6 of 26 (23%)») | `web/data/pruebas.json` |

## 5. Subtítulos (archivo .srt)

El grabador lee este bloque, lo escribe en `docs/pitch/video_30s.srt` y saca de él la duración de cada toma. Una toma por subtítulo, seguidas y sin huecos.

```text
1
00:00:00,000 --> 00:00:02,400
Before you plant, see the water you are committing.

2
00:00:02,400 --> 00:00:05,800
NASA data, a crop-water model, an answer per field.

3
00:00:05,800 --> 00:00:08,400
Set the water allocation. The map and the indicator respond.

4
00:00:08,400 --> 00:00:12,400
Each option: water asked, hectares covered, years committed.

5
00:00:12,400 --> 00:00:16,400
Every option says why, and what changes from today.

6
00:00:16,400 --> 00:00:18,800
From the dam to the crop and the aquifer.

7
00:00:18,800 --> 00:00:21,400
The year the dam delivered no water.

8
00:00:21,400 --> 00:00:23,800
A message for the farmer, in their language.

9
00:00:23,800 --> 00:00:26,400
Five tests, published whatever the result.

10
00:00:26,400 --> 00:00:29,000
The farmer decides.
```

## 6. Cómo se graba y se regenera

```
node tests/e2e/grabar_video.mjs
RAIZ_FOTOGRAMAS=<carpeta> node tests/e2e/grabar_video.mjs      # deja un fotograma de cada tarjeta y de cada tramo
RAIZ_URL=https://<liga pública>/ node tests/e2e/grabar_video.mjs   # graba la página publicada
RAIZ_LIGA_PAGINA=<liga> node tests/e2e/grabar_video.mjs        # la liga que se escribe en el cierre
```

Necesita Node con Playwright (Chromium) y `ffmpeg`/`ffprobe`. Escribe `docs/pitch/video_30s.mp4` y `docs/pitch/video_30s.srt`, y termina con 0 solo si pasan todas sus comprobaciones. Tarda de tres a cuatro minutos.

**Cómo graba**
- Ventana de 1366 × 768 (el acomodo de la página no cambia) con escala de dispositivo 1.5: la grabación sale a 2050 × 1152 y los acercamientos casi no pierden nitidez. La escala se pide al navegador (`--force-device-scale-factor`); si no se aplica, el grabador lo nota y recorta a escala 1.
- **Sin** movimiento reducido: con él no hay gotas animadas ni reproducción de la línea de tiempo. Pantalla de inicio cerrada con la llave `LLAVE_INICIO` de `web/js/acerca.js` en `sessionStorage`. Sin *service worker*.
- Cada toma se graba en uno o más tramos, con su preparación fuera de cámara. Los tramos se graban en el orden que conviene a la página y se montan en el orden de la sección 3. Una marca de color que el grabador muestra un instante, fuera de cámara, da la correspondencia exacta entre el reloj y la grabación. Si una acción tarda más que su tramo, el tramo se recorre para terminar con el resultado a la vista.
- Montaje con `ffmpeg`: cada tramo se recorta a su encuadre y se escala a 1920 × 890; la banda de cada toma es una imagen de `tarjetas.html`. Cortes limpios; un fundido de 0.2 s solo al entrar y salir de las tarjetas.
- Con red, el mapa base carga; sin red sale el aviso «Base map tiles are unavailable…» en todas las tomas (es válido, pero el video final debe grabarse con red).

**Selectores que usa (todos por estructura, ninguno por texto ni por su lugar en la cabecera)**

| Qué | Selector |
|---|---|
| Marcas del deslizador | `.boton-marca[data-marca="como_2025"]`, `[data-marca="como_2026"]` |
| Indicador | `#indicador-cifra` |
| Parcela en la lista | `.boton-parcela[data-id="P0757"]` |
| Ficha | `#ficha`, `.ficha-cabeza`, `#ficha-resumen`, `#ficha-cerrar` |
| Tarjetas de opciones | `.tarjeta[data-opcion]`; dentro, `[data-parte="agua"] .lamina` y `.alcanza` |
| «Why?» | `.tarjeta[data-opcion="avena_maiz"] details.porque > summary`; `dd[data-respuesta="por_que"]`, `dd[data-respuesta="beneficios"]` |
| La gota | `#seccion-gota .gota-mod-diagrama`, `[data-gota-nodo="presa"]`, `[data-gota-etiqueta="presa"]` |
| Vista 3D y línea de tiempo | `#boton-gemelo`, `#zona-sel`, `#linea-tiempo .tiempo-boton`, `.tiempo-rango`, `.tiempo-destacado[data-anio]` |
| Compartir | `#boton-whatsapp`, `#vista-whatsapp select`, `.wa-maqueta[data-idioma]`, `.wa-telefono`, `.wa-saludo` |
| Pruebas | `#boton-acerca`, `#acerca .acerca-pruebas`, `.acerca-prueba > .acerca-prueba-cabeza .acerca-estado` |
| Tablero (portada nueva) | `body[data-dashboard="listo"]`, `script[src*="dashboard"]` y, si existe, `#allocation` |

**Lo que comprueba el grabador**
- Guion: diez subtítulos seguidos, 30 s o menos, ningún golpe de menos de 2.4 s, cierre de 2.5 s o más; subtítulos, rótulos y tarjetas sin dígitos ni palabras vetadas; cada banda cabe en una o dos líneas.
- Tarjetas: la apertura trae nombre, lema, equipo y reto; el cierre, la frase, el aviso de juicio y la liga; los productos de la tarjeta «How it works» están en `web/data/manifest.json`.
- Página: sin errores de JavaScript; en cada tramo con resaltado, el anillo queda dentro del encuadre; en la toma 5, «Why?» está abierto y «Benefits» queda dentro del encuadre; la cantidad de pruebas dicha en palabra es la de `pruebas.json`.
- Video: duración de 28 a 29 s, H.264, yuv420p, 1920 × 1080, 25 fps, pista de audio, menos de 10 MB.

**Antes de subirlo**
- [ ] Regrabar con red y sobre la página final (después de la última corrida de `python construir.py`).
- [ ] Mirar la hoja de fotogramas (`RAIZ_FOTOGRAMAS`): que cada cuadro se entienda solo.
- [ ] Revisión de cifras de las 12:30: cada cifra visible coincide con la página y con `web/data/manifest.json` (kit Q2); vuelva a llenar la sección 4.
- [ ] Liga pública probada en una ventana de incógnito a las 12:00: [LINK: pendiente — responsable de video (P6)].

## 7. Variantes que el grabador resuelve solo

- **Explorador en `explorer.html`.** Si existe `web/explorer.html` (o, con `RAIZ_URL`, si esa dirección responde), los golpes de la ficha, «Why?», la gota, la vista 3D, el mensaje y las pruebas se graban ahí; si no, en la raíz. Se decide mirando el archivo, no un texto.
- **Portada nueva (tablero).** Si la raíz carga `js/dashboard.js` y su `<body>` llega a `data-dashboard="listo"` (límite de 20 s), la toma 3 se graba en el tablero en inglés (`?lang=en`): la parte de arriba, con el mapa y el control de la dotación; si existe `#allocation` y está a la vista, el puntero hace dos clics sobre su pista y el anillo va en el deslizador. Si el tablero no llega a tiempo o la raíz no es el tablero, la toma 3 se graba en el explorador como dice la sección 3. **Los tiempos y los subtítulos no cambian** en ningún caso (así `video_30s.srt` siempre coincide con esta sección).
- **Sin la vista 3D.** Si la página no trae la vista 3D con su línea de tiempo, la toma 7 muestra la memoria satelital de la parcela en la ficha («Field memory (NASA HLS)»), con el mismo subtítulo.

## 8. Pendientes

- Grabar el video final con red y con la portada nueva cuando la página esté cerrada; revisar a ojo la toma 3 sobre el tablero (hoy solo se ha grabado sobre el explorador).
- Volver a llenar la sección 4 con lo que muestre la página final.
- Subir el video y pasar la liga al integrador para el formulario de envío.
- Recorrido largo (60 a 90 s) para el README y la exposición: su guion está en `docs/pitch/guion_video_recorrido.md`; el grabador todavía no lo produce.
