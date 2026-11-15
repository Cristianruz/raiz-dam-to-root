<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Decisión: motivos y beneficios por opción, ECOSTRESS a la vista y textos en inglés desde el origen (15-nov-2026)

**Quién decide:** el integrador («Revisión multiagente»), por encargo de Cristian la noche del 14-nov («haz todo el sistema»). Cristian las confirma o las revierte al leer este documento; cada una se puede revertir por separado. Ninguna cambia nombres de archivos ni de campos del contrato v4: lo nuevo son campos opcionales y textos de la página.

**De dónde salen:** el cierre de hallazgos (`docs/revisiones/2026-11-15_cierre_hallazgos.md`: C2, I10, I15, I5, I3), la revisión independiente de ECOSTRESS (`docs/revisiones/2026-11-15_ecostress.md`) y cuatro revisores de contexto nuevo sobre las dos entregas (código, cifras y lenguaje, contrato).

## 1. «Why it's suggested» dice el motivo de la tabla oficial

- **Problema.** El reto pide decir, para cada estrategia, por qué se sugiere. La ficha solo repetía las cifras de agua.
- **Decisión.** Primero va el motivo de la tabla oficial de rotaciones (`cubo.json` → `opciones_catalogo.<rotación>.por_que_en`), con su etiqueta y su fuente plegada; después, la frase del agua, con la lámina del escenario de lluvia elegido y las hectáreas escritas como en la tarjeta.
- **Dos casos sin motivo prestado.** Una propuesta del equipo (`origen_opcion: team_proposal`) dice que la tabla oficial no da motivo y muestra su etiqueta. La tarjeta ACTUAL de una parcela que hoy está en un estado que la tabla ofrece como alternativa (el descanso) dice que es el estado actual de la parcela y no toma el texto de la alternativa, que habla de rastrojo en pie en una parcela cuyo suelo desnudo se midió.
- **Dónde.** `web/app.js` (`htmlMotivo`, `htmlRespuestas`); `tests/e2e/web_smoke.mjs`.

## 2. «Benefits» compara cada opción con la rotación actual de la misma parcela

- **Problema.** «Benefits» era la misma frase en todas las opciones y describía la herramienta, no la estrategia.
- **Decisión.** Cada alternativa se compara con la opción ACTUAL de su parcela con datos del cubo: agua por año (mediana, en el escenario de lluvia elegido), años que compromete, días de suelo desnudo, si es leguminosa, y «no data» en los indicadores que la tabla trae vacíos. La opción ACTUAL dice que es la base de la comparación. En el nogal, que no tiene alternativas, se conserva la frase de `explicaciones.json`.
- **Redacción (regla 10 de `CLAUDE.md`).** Son diferencias descritas: «less than», «more than», «the same as». No se promete un ahorro, no se ordena y no se dice que el agua se libera; si la alternativa pide más agua, se dice igual de claro. Un dato medido con el satélite y otro estimado con el calendario del cultivo se escriben los dos, sin «fewer» ni «more». Si falta un dato, se dice; nunca cero.
- **Dónde.** `web/js/beneficios.js`; `tests/beneficios.test.js` recorre todas las opciones del cubo con las dos lluvias.

## 3. La nota de «Follow the drop» dice cuánto cubre la dotación

- **Decisión.** El primer nodo se llama «Needed from La Boquilla»: es el agua que la opción necesita contada desde la presa, con las pérdidas de conducción incluidas, no agua que la presa entrega. La nota dice qué porcentaje cubre la dotación elegida y, con la lluvia base, cuántos m³ son. Con la lluvia seca solo da el porcentaje y dice que el diagrama es de la lluvia base, porque los m³ del diagrama se calculan con esa lluvia.
- **Cobertura hacia abajo.** El porcentaje de cobertura se escribe entero y hacia abajo, igual que las hectáreas: una dotación que no alcanza nunca se lee «100%».
- **Dónde.** `web/app.js` (`pintarCoberturaGota`, `fmtCobertura`), `web/js/gota.js`.

## 4. ECOSTRESS: lo que la ficha dice y lo que no dice

- **Decisión.** La ficha escribe el valor del último mes con dato, cuántos sobrevuelos despejados lo respaldan y, con dos o más, el menor y el mayor («2.11 mm/day in Aug 2026, from 2 clear overpasses (1.57 to 2.66)»). El aviso de que es una estimación satelital en días despejados, y no una medición en la parcela, va a la vista junto al valor; su texto sale de la línea de la entrega.
- **Parcelas sin cultivo en el mes mostrado.** Si el calendario del modelo de la rotación actual (`meses_cultivo` de la opción ACTUAL) no tiene cultivo en ese mes, la ficha lo dice. No se elige otro mes. Una huerta que no rota queda fuera de esa nota: en reposo sigue teniendo árboles.
- **Lo que no se muestra.** Ni el contraste con la ET del modelo, ni el cociente, ni un porcentaje: son cantidades distintas y se leerían como una validación o como un déficit medido.
- **Esquema.** `motor/esquemas.py` declara como opcionales `et_min_mm_dia` y `et_max_mm_dia` (ECOSTRESS) y `clase_nombre`, `cultivo_gaez` y `nota` (GAEZ), que la página lee.
- **Dónde.** `motor/contexto_web.py`, `web/js/contexto.js`, `web/app.js`.

## 5. Textos en inglés desde el origen

- **Decisión.** Donde la página mostraba una cita en español detrás de un plegado, el dato lleva ahora un campo paralelo opcional en inglés (`fuente_en`, `nota_en`, `detalle_en`) y la página lo prefiere. El campo original no se toca. Una prueba exige que los números del inglés sean los del español (`tests/test_textos_en.py`). Las citas textuales de una fuente en español se quedan en su idioma, con su traducción.
- **GAEZ.** La tarjeta usa el parche de la sesión de datos: la unidad como la publica FAO con su factor a la vista («× 10 kg DW/ha»), el nombre de la clase de aptitud y el cultivo de GAEZ que respalda cada fila.

## 6. Lo que falta

- Que Cristian confirme estas decisiones, sobre todo la 2 (qué se compara en «Benefits») y la 4 (no mostrar el contraste de ECOSTRESS con el modelo).
- La sesión de datos puede reescribir el motivo del descanso en `opciones_b3.json`, que empieza con «Worst-case option»: el revisor de cifras señaló que se lee como un orden entre opciones.
- La etiqueta «Legume (adds nitrogen)» de la tarjeta y de «Benefits» no tiene fuente en el repo para el nitrógeno; el dato solo dice que el cultivo es leguminosa.
- El detalle de la puerta en inglés se cuenta en el manifest junto al detalle en español: las mismas cifras, dos veces.
