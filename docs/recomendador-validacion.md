<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; initial version with OpenAI Codex -->
# El plan del tablero: qué hace ahora y qué se comprueba

Actualizado el 15-nov-2026, después de la revisión `docs/revisiones/2026-11-15_rama_tena.md` (bloqueos 3 y 4).

## Qué hace

- **Ya no hay un segundo modelo de demanda.** `web/js/recomendador.js` no calcula láminas: toma las de `web/data/cubo.json` (`parcelas[id].opciones[].agua.lamina_bruta[lluvia]`, con p10, p50 y p90) y las evalúa con `evaluarOpcion` de `web/reglas.js`, la misma regla de la ficha de la parcela (`web/explorer.html`). El plan y la ficha dan las mismas hectáreas para la misma parcela, dotación y lluvia. Se retiraron `demandaHistorica`, el nivel de planificación (80, 90 o 95 %) y el efecto del sistema de riego sobre la demanda; el sistema de riego se anota y no cambia ninguna cifra.
- **Una tarjeta por cada opción que el cubo trae para la parcela, en el orden del cubo.** Una parcela en descanso muestra maíz forrajero y sorgo además del descanso. Una parcela sin clasificar no tiene plan y dice por qué.
- **Describe, no ordena.** Cada tarjeta dice lo que cubre la dotación («With this allocation the water covers X of N ha»), con el rango; el extremo bajo (la lámina alta) se rotula como lectura prudente. Los rótulos son «Restriction found», «Needs a local check» y «Water coverage calculated». Una restricción lleva su fuente y termina en «Review it with your module technician». Ninguna opción se puntúa ni se nombra por encima de otra. Cada tarjeta lleva el aviso de juicio.
- **Restricciones.** Salen de los filtros del cubo (con su motivo, su fuente y su etiqueta). Lo que la persona captura se compara con datos publicados: la fecha de siembra contra la ventana del cultivo que abre la secuencia (catálogo del cubo), y el pH y la salinidad del suelo contra los intervalos generales de `pronostico.json → requisitos`. El pH y la salinidad fuera de intervalo se presentan como puntos de revisión local, no como motivo para descartar (lo pide la propia fuente).
- **Lluvia.** El bloque se llama «Historical rainfall range (NASA POWER)», sin año futuro. La comprobación contra los años observados se presenta como salga: la diferencia típica, la de repetir el año anterior (sin prueba de significancia) y la parte de los años que cayó dentro del rango, también cuando queda por debajo de lo que el rango promete. Dice que la comprobación no se declaró antes del análisis. Se conserva la frase que niega que se pronostique la presa.
- **Cuatro idiomas.** Los textos viven en `web/js/textos_asesor.js` (inglés, español, portugués y francés, con las mismas claves) y se leen con `t()` de `web/js/i18n.js`; las cifras llevan los separadores de cada idioma. Inglés, portugués y francés son traducciones hechas con IA, pendientes de revisión por una persona hablante. Los textos que vienen de los datos (nombres de opciones, motivos, fuentes) se muestran como vienen.
- **Robustez.** Todo texto de los datos o de la persona se escapa antes de entrar al DOM; un enlace se arma con http o https y con ningún otro esquema; zona o parcela nulas no rompen nada; las cifras pasan por `Number.isFinite`.

## Qué se comprueba

| Prueba | Qué cuida |
|---|---|
| `node --test tests/recomendador.test.js` | Para todas las opciones de P0757, P0632 y L0175, con cada marca de `cubo.dotaciones` y las dos lluvias de `cubo.lluvia_pct`, en los cuatro idiomas: hectáreas y cobertura idénticas a `evaluarOpcion`. Recorrido de todas las parcelas clasificadas sin NaN, undefined, null ni Infinity. Parcela sin clasificar sin plan; descanso con las opciones del cubo; el sistema de riego no cambia cifras; entradas inválidas sin plan; ya no existe el segundo modelo. |
| `node --test tests/textos_asesor.test.js` | Mismas claves y marcadores en los cuatro idiomas; sin cifras; sin palabras vetadas (regla 10) en cada idioma; «pronóstico» solo en las frases que lo niegan; el aviso de juicio fiel; cada clave usada existe y cada clave registrada se usa. |
| `python -m pytest tests/test_sin_cifras.py -q` | Ninguna cifra escrita a mano en el JavaScript (regla 3). |
| `node tests/e2e/recomendaciones_smoke.mjs` | Arranca sola (servidor local y Playwright). En un teléfono de 390 × 844 y en `?lang=en`, `es`, `pt` y `fr`: las hectáreas del plan de P0757 son las que escribe `explorer.html#P0757` con cada dotación de referencia; aviso en cada tarjeta; sin claves a la vista ni palabras vetadas; restricción con fuente; sin desplazamiento horizontal y controles de 44 px; cambio de idioma con la página abierta. |

## Qué NO se comprueba ni se afirma

- No valida la demanda de agua con mediciones de campo: las láminas son las del modelo del proyecto (cubo), con sus supuestos y etiquetas.
- No pronostica la presa, la cosecha ni el ingreso; no reparte agua; no promete ahorro.
- La comprobación de lluvia compara un rango histórico con años observados de NASA POWER (una celda regional, no una estación); no es un pronóstico y su ventaja sobre repetir el año anterior no tiene prueba de significancia.
- El contraste con un riego registrado por la persona y la frecuencia de heladas de la versión anterior se retiraron: dependían del segundo modelo o de cultivos que el cubo no ofrece.
- `web/data/pronostico.json` aún trae las series por año y los niveles del modelo anterior (los genera `motor/pronostico_web.py`); la página ya no los usa.
