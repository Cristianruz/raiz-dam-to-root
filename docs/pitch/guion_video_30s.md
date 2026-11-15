<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Guion del video · 30 segundos o menos, sin voz

**BORRADOR para que el equipo lo ajuste (responsable de presentación y pitch, con quien graba el video).** El texto en pantalla va en inglés y sin cifras escritas a mano.

## 1. Qué fija el kit (pieza C7)

| Punto | Lo que dice | Dónde |
|---|---|---|
| Duración | 30 segundos o menos | `docs/kit/40_kit_v4_proyecto_definitivo.md`, C7 y Q2 |
| Sonido | Sin voz: texto en pantalla y subtítulos en inglés incrustados | Kit C7; kit §0.3 |
| Imagen | La pantalla de la web real, con las tres protagonistas | Kit C7 |
| Arco | 2025, el compromiso, La gota, las pruebas | `docs/sintesis/S9_proyecto_definitivo.md` §7 |
| Entrega | Liga pública, probada en una ventana de incógnito a las 12:00 del domingo | Kit C7; `docs/sintesis/S10_plan_sapo.md` §7 |
| Otros usos | El mismo video sirve para el People's Choice | Kit C7 |
| Imágenes con IA | Ninguna. Si se usara una, lleva marca de agua visible | Kit C7 |

## 2. Reglas del texto en pantalla

- Una línea por toma, de 10 palabras como máximo. La misma línea se incrusta como subtítulo.
- **Ningún dígito en el texto que se agrega.** Las cifras que se ven son las que la página muestra en ese momento; la tabla de la sección 4 dice cuáles y de dónde salen.
- Sin logotipos, banderas ni identificadores de misión de la NASA. La atribución de OpenStreetMap del mapa se queda visible.
- El texto va en una banda inferior que no tape las cifras de la ficha.

## 3. Tabla de tomas (versión con el gemelo conectado)

Duración total: **29.0 segundos**. Hoy todas las piezas del gemelo están en la página (`web/app.js` importa y monta la vista 3D, la línea de tiempo, la tarjeta de estado, la app instalable y el contexto regional): se graba esta versión. Cada toma marcada «[SI ESTÁ CONECTADO]» trae su «[ALTERNATIVA]» solo como respaldo; la variante completa sin el gemelo está en la sección 7.

Las protagonistas son P0757, P0632 y L0175 (`web/data/parcelas.geojson` → `protagonista: true`; la decisión del 14-nov cambió P0244 por P0632, `docs/decisiones/2026-11-14_opciones_b3.md` §2).

| Toma | Inicio (s) | Fin (s) | Acción exacta en la página | Texto en pantalla (inglés) | Palabras |
|---|---|---|---|---|---|
| 1 · 2025 | 0.0 | 3.5 | **[SI ESTÁ CONECTADO]** «Pilot area» en «Delicias – Saucillo», vista 3D activa. Línea de tiempo colocada en 2023; clic en «Play»; pausar al llegar a 2025, cuando aparece el resaltado «Year without dam water: the district received no dam allocation». **[ALTERNATIVA]** «Pilot area» en «All areas»; clic en la marca «Like 2025»; en «Layers», clic en «Field memory: 2025». | The year the dam delivered no water. | 7 |
| 2 · 2025 | 3.5 | 7.0 | Clic en la marca «Like 2025» (el deslizador queda en la marca más baja). Se ve el indicador «Water already committed by perennial crops». **[SI ESTÁ CONECTADO]** las columnas de agua pasan a rojo. **[ALTERNATIVA]** «Color fields by» en «Enough water?»: las parcelas pasan a rojo. | Orchards and alfalfa still needed water. | 6 |
| 3 · El compromiso | 7.0 | 12.0 | «Pilot area» en «All areas» (corte de edición). Clic en la marca «Like 2026». En la lista «Fields», clic en **P0757**. Se abre «Field P0757»: «Water term: ending soon», la franja «Field memory (NASA HLS)» y la tarjeta «Current rotation: Alfalfa» con «Enough for … of … hectares». | Alfalfa commits water for years. Compare before planting. | 8 |
| 4 · El compromiso | 12.0 | 15.5 | «Close». En la lista «Fields», clic en **P0632**. Se abre «Field P0632»: «Water term: free» y la tarjeta «Current rotation: Winter cereal» con «Enough for … of … hectares». | An annual-crop field is free to choose. | 7 |
| 5 · El compromiso | 15.5 | 19.0 | «Close». En la lista «Fields», clic en **L0175**. Se abre «Field L0175»: «Water term: committed» y la tarjeta «Current rotation: Pecan orchard». | A pecan orchard stays committed. | 5 |
| 6 · La gota | 19.0 | 23.5 | En la misma ficha L0175, bajar a «Follow the drop». Las gotas recorren el diagrama una vez. | Follow the drop: dam, canal, field, aquifer. | 7 |
| 7 · Las pruebas | 23.5 | 27.0 | «Close». Clic en «About & Data» y bajar a «Tests in sight»: se ven las pruebas con su estado, también las que no cumplen y las «Not run». | Five tests, published whatever the result. | 6 |
| 8 · Cierre | 27.0 | 29.0 | «Close». Cabecera «ROOT – From Dam to Root» y el aviso «This tool supports, never replaces, the judgment of farmers and local experts.» | ROOT – From Dam to Root. The farmer decides. | 8 |

Notas de la tabla:
- **Toma 1.** La línea de tiempo avanza un año al pulsar «Play» y otro cada intervalo de `web/data/gemelo.json` → `tiempo.intervalo_ms`. Por eso se coloca en 2023: llega a 2025 dentro de la toma.
- **Toma 3.** La vista 3D trabaja con una zona a la vez y L0175 está en la otra zona. Por eso las tomas 3 a 8 se graban en «All areas».
- **Toma 4.** P0632 aparece arriba en la lista «Fields», con la etiqueta «story field». «annual-crop» se cuenta como una palabra.
- **Toma 6.** El video no pulsa el botón del goteo, así que esta toma no agrega cifras. Bajo el diagrama aparece el botón «What if this field switches to drip?» (`web/data/cubo.json` → `meta.goteo.disponible`: true; eficiencias «[V] indicative, not local», `data/processed/supuestos.json` → `ea_goteo`).
- **Toma 7.** «Five» es el número de pruebas de S9 §6 y la sección muestra cinco tarjetas.

## 4. Cifras que la página muestra en cada toma

Estas cifras **no se escriben**: salen solas en la pantalla. Sirven para la revisión de cifras del domingo a las 12:30 (kit Q2). Los valores son los de los datos del 14-nov; vuelva a leerlos en la página final.

| Toma | Cifra que muestra la página | Origen |
|---|---|---|
| 1 | **[SI ESTÁ CONECTADO]** el año «2025» y su resaltado [P]. **[ALTERNATIVA]** «1 thousand m³/ha» | `web/data/gemelo.json` → `tiempo.destacados`; `web/data/cubo.json` → `dotaciones.marcas` |
| 2 | «1 thousand m³/ha»; indicador «at least 437%» (rango de 354% a 541%) en «Delicias – Saucillo» o «at least 378%» (de 307% a 469%) en «All areas» | Calculado por `web/reglas.js` (`aguaComprometida`) con `cubo.json` → `zonas`, `zona` |
| 3 | «3.5 thousand m³/ha»; «7.95 ha»; «Stand age from satellite memory: 3 years»; «28.4 thousand m³/ha per year»; «Enough for 0.97 of 7.95 hectares (range 0.79 to 1.2)»; «Typically applied in this district»: 17.4 (dato: 17.42), «enough for 1.59 of 7.95 hectares»; «Commits water for 3–4 years»; «Remaining term: 0–1 years»; «Water committed over the remaining term: 0–28.4 thousand m³/ha» | `web/data/parcelas.geojson` → P0757; `cubo.json` → `parcelas.P0757` (`agua.lamina_local`, `plazo_restante`, `compromiso_millares_ha`); `web/reglas.js` (`evaluarOpcion`, `cobertura`) |
| 4 | «20.66 ha»; «7.8 thousand m³/ha per year» (dato: 7.82); «Enough for 9.24 of 20.66 hectares (range 7.65 to 11.4)»; «Commits water for 1 year» | `parcelas.geojson` → P0632; `cubo.json` → `parcelas.P0632`; `web/reglas.js` |
| 5 | «10.76 ha»; «18.8 thousand m³/ha per year» (dato: 18.84); «Enough for 1.99 of 10.76 hectares (range 1.62 to 2.45)»; «Typically applied in this district»: 13.7 (dato: 13.72), «enough for 2.74 of 10.76 hectares»; «Commits water for 10 years»; una sola tarjeta y «No alternatives are compared for this field.» | `parcelas.geojson` → L0175; `cubo.json` → `parcelas.L0175` (`sin_rotacion`, `agua.lamina_local`); `web/reglas.js` |
| 6 | Los m³ de cada nodo: presa 337,864; canal 135,145.6; parcela 202,718.4; cultivo 114,916.8; acuífero 67,572.8; otras pérdidas 155,374.4 (la página los redondea) | `cubo.json` → `parcelas.L0175`, opción ACTUAL, bloque `gota` |
| 7 | El estado de cada prueba y, en «Crop map», 781 de 1,239 parcelas sin clasificar | `web/data/pruebas.json` |
| 8 | Ninguna | — |

## 5. Subtítulos (archivo .srt)

```text
1
00:00:00,000 --> 00:00:03,500
The year the dam delivered no water.

2
00:00:03,500 --> 00:00:07,000
Orchards and alfalfa still needed water.

3
00:00:07,000 --> 00:00:12,000
Alfalfa commits water for years. Compare before planting.

4
00:00:12,000 --> 00:00:15,500
An annual-crop field is free to choose.

5
00:00:15,500 --> 00:00:19,000
A pecan orchard stays committed.

6
00:00:19,000 --> 00:00:23,500
Follow the drop: dam, canal, field, aquifer.

7
00:00:23,500 --> 00:00:27,000
Five tests, published whatever the result.

8
00:00:27,000 --> 00:00:29,000
ROOT – From Dam to Root. The farmer decides.
```

## 6. Lista de comprobación para grabarlo con Playwright

**Antes de grabar**
- [ ] La página pasa la prueba con navegador: `node tests/e2e/web_smoke.mjs`.
- [ ] Se sirve en local con `python -m http.server --directory web` (`README.md`, «How to run»), o se usa la liga pública: https://cristianruz.github.io/raiz-dam-to-root/.
- [ ] El script de grabación vive fuera de `web/` y no cambia la página.

**Ventana**
- [ ] Viewport de 1366 × 768 píxeles (formato 16:9) y `deviceScaleFactor` de 1. La prueba con navegador revisa la página a 1366 × 860 (`tests/e2e/web_smoke.mjs`); a 768 de alto revise una vez, a ojo, que la ficha y el indicador se vean completos.
- [ ] Grabación con `recordVideo` al mismo tamaño que el viewport. Playwright entrega un archivo .webm al cerrar el contexto; se convierte a .mp4.
- [ ] Zoom del navegador al 100 %. No mueva el zoom del mapa: use el encuadre con el que abre cada zona.
- [ ] Si la plataforma pide otra resolución, escale al exportar. No cambie el viewport, porque cambia el acomodo de la página.

**Movimiento**
- [ ] **Sin** `reducedMotion: "reduce"`. Con movimiento reducido no hay gotas animadas en «Follow the drop» ni reproducción automática en la línea de tiempo (`web/js/gota.js`, `web/js/tiempo.js`). La prueba con navegador sí lo usa en varios contextos: no copie esa opción.

**Estado inicial**
- [ ] Pantalla de inicio cerrada: clic en «Start exploring» antes de grabar, o la llave `raiz.inicio.cerrado` en `sessionStorage` (`LLAVE_INICIO` en `web/js/acerca.js`).
- [ ] **Parcela inicial por `#id`.** Abrir `index.html#P0757` lleva directo a la ficha (`web/js/resumen.js`, funciones `idDeHash` y `hashDe`, que `web/app.js` importa). Respaldo: escriba el id en «Find a field» (`#buscar-parcela`) y haga clic en `.boton-parcela[data-id="P0757"]`.
- [ ] Zona: `#zona-sel` con el valor `delicias_saucillo` para la vista 3D y con el valor vacío («All areas») de la toma 3 en adelante.
- [ ] Con red, para que cargue el mapa base. Sin red sale el aviso «Base map tiles are unavailable: fields are drawn on a plain background»: es válido, pero entonces grabe todas las tomas así.

**Selectores que ya existen en la página**

| Qué | Selector |
|---|---|
| Marcas del deslizador | `.boton-marca[data-marca="como_2025"]`, `[data-marca="como_2026"]`, `[data-marca="anio_normal"]` |
| Deslizador | `#dotacion` |
| Capa de memoria de 2025 | `input[name="colorear"][value="memoria_2025"]` |
| Colorear por semáforo | `input[name="colorear"][value="semaforo"]` |
| Parcela en la lista | `.boton-parcela[data-id="P0757"]`, `[data-id="P0632"]`, `[data-id="L0175"]` |
| Vista 3D y línea de tiempo | `#bloque-gemelo3d`; `#linea-tiempo` (botón «Play») |
| Cerrar la ficha | `#ficha-cerrar` |
| La gota | `#seccion-gota` (llevarla a la vista) |
| «About & Data» y su cierre | `#boton-acerca`, `#acerca-cerrar` |
| Vista de WhatsApp (si se usa en el cierre) | `#boton-whatsapp` |


**Texto y subtítulos**
- [ ] El texto de cada toma coincide con la tabla de la sección 3, sin dígitos agregados.
- [ ] Se incrusta de una de dos formas: una banda fija que el script de grabación agrega al documento mientras graba, o el archivo .srt incrustado al exportar.
- [ ] Contraste suficiente y letra legible en un teléfono.

**Antes de subirlo**
- [ ] Duración del archivo exportado: 30 segundos o menos (compruébela con `ffprobe` o con el reproductor).
- [ ] Aparecen las tres protagonistas: P0757, P0632 y L0175.
- [ ] Ningún logotipo de la NASA; ninguna imagen generada con IA.
- [ ] Revisión de cifras de las 12:30: cada cifra visible coincide con la página y con `web/data/manifest.json` (kit Q2).
- [ ] Liga pública probada en una ventana de incógnito a las 12:00: [LINK: pendiente — responsable de video (P6)].

## 7. Variante sin las piezas del gemelo (lo que ya existe hoy)

Las tomas 3 a 8 no cambian. Cambian las dos del inicio, y todo se graba con «Pilot area» en «All areas». Duración total: **29.0 segundos**.

| Toma | Inicio (s) | Fin (s) | Acción exacta en la página | Texto en pantalla (inglés) |
|---|---|---|---|---|
| 1 · 2025 | 0.0 | 3.5 | Mapa 2D. Clic en la marca «Like 2025». En «Layers», clic en «Field memory: 2025»: se ve qué parcelas eran perennes, de verano o de descanso ese año. | The year the dam delivered no water. |
| 2 · 2025 | 3.5 | 7.0 | En «Color fields by», clic en «Enough water?»: las parcelas con cultivo pasan a rojo. Se ve el indicador «Water already committed by perennial crops». | Orchards and alfalfa still needed water. |
| 3 a 8 | 7.0 | 29.0 | Igual que en la sección 3. | Igual que en la sección 3. |

Toma opcional, si sobra tiempo al editar y sin pasar de 30 segundos: «Terrain & runoff» y «Simulate a storm» en el mapa 2D, con el texto «Where heavy rain runs and gathers.» Sustituye a la toma 2; no se agrega.

## 8. Pendientes

- Grabar después de la última corrida de `python construir.py`, con el gemelo conectado; la variante de la sección 7 queda de respaldo.
- Las cifras de la sección 4 se releyeron del cubo de la integración `d5de13f`, como las escribe la página: las láminas con un decimal y las hectáreas hacia abajo, con los decimales del área (`web/app.js`, `fmtMillares`; `web/js/resumen.js`, `formatoHectareas`). Si el cubo cambia otra vez, vuelva a llenar la tabla con lo que muestre la página.
- Subir el video y pasar la liga al integrador para el formulario de envío.
