<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Decisión: el tablero es la portada y la interfaz va en cuatro idiomas (15-nov-2026)

**Quién decide:** Cristian, el 15 de noviembre de 2026, después de leer la revisión de la rama `Tena` (`docs/revisiones/2026-11-15_rama_tena.md`).

**Qué se decide:** el tablero que hizo Tena con OpenAI Codex, ya corregido, es la página principal (`web/index.html`) y es una aplicación: instalable, sin conexión y pensada primero para el teléfono. La página que estaba publicada se conserva completa como **explorador de parcelas** en `web/explorer.html`.

**Qué cambia respecto de `CLAUDE.md`, regla 9:** la interfaz del tablero deja de ser solo en inglés. El inglés sigue siendo el idioma por omisión.

## Las dos páginas
- **Portada, `web/index.html` (tablero).** Resumen por zona, mapa y detalle de una parcela, comparación de cultivos con la dotación elegida, cronología de contexto y rango histórico de lluvia con su retroprueba. Es lo que abre la liga pública y la aplicación instalada (`web/manifest.webmanifest`: `start_url` y `scope` «./»).
- **Explorador, `web/explorer.html`.** El centro de control, la ficha de parcela, «Follow the drop», el gemelo 3D, «About & Data» y el mensaje de WhatsApp, sin cambios. Su cabecera lleva un enlace «Dashboard» a la portada. Una parcela se abre directo con `explorer.html#P0757`.
- Las dos se guardan en la copia sin conexión (`web/data/precache.json`) y las dos pasan la prueba de cifras (`tests/test_sin_cifras.py`).

## Idiomas
- Cuatro: **inglés, español, portugués y francés**, los mismos del mensaje de WhatsApp (`docs/decisiones/2026-11-14_whatsapp_idiomas.md`).
- ~~El tablero abre en el idioma del navegador si es uno de los cuatro.~~ Desde `2026-11-15_ingles_primero.md`: el tablero abre siempre en **inglés**. La persona puede cambiarlo con el selector; `?lang=xx` en la liga lo fija (`web/js/i18n.js`).
- Los textos de la interfaz viven en los diccionarios de `web/js/`. Los textos que vienen en los datos del tablero (`web/data/dashboard.json` y `web/data/pronostico.json`, que salen de `data/investigacion_dashboard.json`) llevan la llave de siempre en inglés y, al lado, `<llave>_es`, `<llave>_pt` y `<llave>_fr`. Ninguna llave cambia de nombre ni se quita.
- Las cifras salen siempre de los datos y se formatean con `Intl` en el idioma elegido. Una traducción no puede cambiar un número: `tests/test_tablero_idiomas.py` exige las cuatro variantes de cada texto mostrado y los mismos números en las cuatro.

## Calidad de las traducciones
- El español es la redacción original de Tena, corregida donde ordenaba o prometía. El inglés, el portugués y el francés los escribió la IA a partir de ella.
- **El portugués y el francés son borradores de máquina por revisar.** La interfaz lo dice junto al selector hasta que una persona hablante los revise, igual que en el WhatsApp.

## Qué se queda en inglés
- **El explorador de parcelas** (`web/explorer.html`), completo.
- **Los textos que vienen de las entregas de datos:** fuentes, etiquetas y motivos de cada opción (`data/processed/opciones_b3.json`, `suelo_requisitos.json`, `supuestos.json` y los parámetros de `rotaciones*.json`). No se traducen aquí para no alterar una entrega validada.

## Lenguaje
- En ningún idioma se dice que la herramienta recomienda, que una opción es la mejor, ni que ahorra agua (regla 10). Palabras vetadas: inglés *first, only, best, recommend…*; español *mejor, recomend…, ahorr…*; portugués *melhor, recomend…, poup…*; francés *meilleur, recommand…, économis…*.
- La lluvia del tablero es un **rango histórico** de NASA POWER. No se llama pronóstico ni predicción en ningún idioma, y sus textos no nombran un año futuro. No es un pronóstico de la lluvia ni de la presa (`LIMITATIONS.md`).

## Pendiente
- Revisión del portugués y del francés por una persona hablante.
- Declarar OpenAI Codex en el formulario de envío (`docs/pitch/textos_envio.md`, «Antes de pegar», punto 8).
