<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Revisión de la rama `claude/ingles-primero` (Oscar Milo) · 15-nov-2026, 12:00, hora de Chihuahua

**Quién la pidió:** Cristian («revisa lo que hizo Milo, porque había cambiado la vista»). La rama no estaba en `main`: sus cuatro commits vivían solo en `claude/ingles-primero`, hechos sobre `1c513b3` (el `main` del PR #12). Por eso el video, que se graba de lo publicado, mostraba el explorador anterior.

## Qué trae la rama

| Commit | Qué hace |
|---|---|
| `bfc9f2a` | El tablero abre siempre en inglés (ya no toma el idioma del navegador); `?lang=xx` o lo elegido en el selector lo cambian. `web/js/i18n.js`, `tests/i18n.test.js` |
| `75c9fe4` | Español opcional en el explorador: selector «English / Español» con la misma elección del tablero. `web/js/explorador_es.js` traduce lo que `web/app.js` escribe, sin tocar cálculos ni números. `tests/explorador_es.test.js` |
| `1ade1fa` | El explorador con el diseño del tablero: `web/css/tema_tablero.css` da a las variables de `web/style.css` los tonos del tablero (fondo oscuro, acento lima), solo en pantalla; el mapa base se atenúa. La hoja impresa sigue en papel blanco |
| `6d9ef0f` | La precarga de la aplicación incluye la hoja nueva |

Decisión de Milo: `docs/decisiones/2026-11-15_ingles_primero.md`.

## Cómo se revisó

- La CI de GitHub pasó en los cuatro commits de la rama.
- Capturas del explorador en computadora y en teléfono, con la ficha abierta: sin errores de página.
- `node tests/e2e/dashboard_smoke.mjs` en la rama: todas las comprobaciones pasan.
- `node tests/e2e/web_smoke.mjs` en la rama: fallaban cuatro comprobaciones, todas la misma.

## Hallazgo y corrección

| Hallazgo | Corrección |
|---|---|
| En el tema oscuro, el símbolo «✕» sobre el círculo rojo del semáforo quedaba con un contraste menor que el que exige la prueba (leyenda, conteos del panel, lista de parcelas y renglones de la ficha) | `web/css/tema_tablero.css`: el rojo del semáforo (`--sem-rojo`) se aclara un tono. Es el único cambio hecho a la rama al integrarla |

## Lo que queda abierto

- El español del explorador es una traducción hecha con IA; conviene que la revise una persona hablante (la decisión de Milo ya lo dice).
- En español, el explorador traduce el lema del nombre («De la presa a la raíz»); el tablero deja el nombre del producto sin traducir.
- El commit cita como base un traductor de «la rama Milo, commit `9b5c331`», que no está en el repositorio remoto.

## Integración

Fusionada en `claude/keen-mayer-sp0vvm`. Dos conflictos, sin pérdida: `AI_USAGE.md` (bitácora que solo crece: se conservan los dos lados) y `web/data/precache.json` (archivo generado: se reconstruyó). Los resultados de `python construir.py` y de las pruebas con navegador sobre la mezcla van en el PR y en `docs/coordinacion.md`.
