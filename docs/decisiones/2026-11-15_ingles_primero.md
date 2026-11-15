<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Decisión: el tablero abre siempre en inglés (15-nov-2026)

**Quién lo pide:** Oscar Milo, el 15 de noviembre de 2026 («que todo sea en inglés como primera opción y exista la opción de cambiarlo al español»).

**Qué cambia:** el tablero (`web/index.html`, la portada que hizo Tena) ya no toma el idioma del navegador. Abre en **inglés** salvo que la persona haya elegido otro idioma en el selector (se recuerda en el navegador, solo como comodidad) o que la liga lo fije con `?lang=es`. El selector sigue ofreciendo inglés, español, portugués y francés, con el inglés primero.

**Qué no cambia:**
- El mensaje de WhatsApp sigue la regla 9 de `CLAUDE.md` y `docs/decisiones/2026-11-14_whatsapp_idiomas.md`: el idioma elegido en su selector o, si no hay, el del teléfono; si ninguno tiene plantilla, español.
- ~~El explorador de parcelas sigue en inglés.~~ Desde el mismo día (segunda parte, abajo) el explorador también tiene español opcional.

**Dónde vive:** `web/js/i18n.js` (función `elegir`). Prueba: `tests/i18n.test.js` (un navegador en español abre en inglés; el selector, la liga y la elección guardada lo cambian al español).

Reemplaza el punto «El tablero abre en el idioma del navegador…» de `docs/decisiones/2026-11-15_tablero_principal_idiomas.md`.

## Segunda parte: español opcional en el explorador de parcelas (15-nov-2026)

**Quién lo pide:** Oscar Milo, el mismo día («Yes, add Spanish»).

**Qué cambia:** `web/explorer.html` tiene un selector *English / Español* en la cabecera. Abre en inglés; el español usa la misma elección que el tablero (`web/js/i18n.js`, `?lang=es` o lo guardado en el navegador), así que lo elegido en una página vale en la otra. Con portugués o francés elegidos en el tablero, el explorador se queda en inglés.

**Cómo:** `web/js/explorador_es.js` traduce lo que `app.js` escribe en inglés, sin tocar sus cálculos: un diccionario de formas (cada número como «#») y un `MutationObserver` para lo que se dibuja después. Una traducción nunca cambia un número: se devuelven los mismos, en el mismo orden. Parte del traductor de la rama `Milo` (commit `9b5c331`, `web/js/idioma.js`), ampliado y corregido.

**Qué queda en inglés:** lo que no está en el diccionario. Sobre todo las fuentes y citas, los nombres de archivo, las descripciones técnicas de «About & Data» y los textos que llegan de las entregas de datos (como en el tablero). El español es una traducción hecha con IA: conviene que la revise una persona hablante.

**Prueba:** `tests/explorador_es.test.js` (cifras iguales y en el mismo orden, frases con cultivo, lo desconocido queda igual, mismo número de «#» en cada forma, sin palabras vetadas).

## Tercera parte: el explorador con el diseño del tablero (15-nov-2026)

**Quién lo pide:** Oscar Milo («métele el diseño del resto de la página a la pestaña "open the field explorer"»).

**Qué cambia:** `web/explorer.html` se ve como el tablero: fondo oscuro, tarjetas verde noche, acento lima, la misma letra (Atkinson Hyperlegible) y el mapa base atenuado igual que en `js/dashboard.js`.

**Cómo:** una hoja nueva, `web/css/tema_tablero.css`, cargada al final (antes de `imprimir.css`) y solo para pantalla. Da a las variables de `style.css` y de los módulos los valores del tablero; los pares «fondo --tinta + texto --blanco» se invierten juntos y conservan el contraste. En `app.js` la capa de OpenStreetMap lleva la misma atenuación que el tablero. No cambia ningún cálculo, texto ni dato. La ficha impresa sigue en papel blanco.

**Comprobado en el navegador:** computadora y teléfono; inicio, mapa, ficha de parcela y «About & Data»; ningún texto con contraste menor de 3:1 sobre su fondo.
