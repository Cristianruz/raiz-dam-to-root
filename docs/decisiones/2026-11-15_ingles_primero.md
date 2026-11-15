<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Decisión: el tablero abre siempre en inglés (15-nov-2026)

**Quién lo pide:** Oscar Milo, el 15 de noviembre de 2026 («que todo sea en inglés como primera opción y exista la opción de cambiarlo al español»).

**Qué cambia:** el tablero (`web/index.html`, la portada que hizo Tena) ya no toma el idioma del navegador. Abre en **inglés** salvo que la persona haya elegido otro idioma en el selector (se recuerda en el navegador, solo como comodidad) o que la liga lo fije con `?lang=es`. El selector sigue ofreciendo inglés, español, portugués y francés, con el inglés primero.

**Qué no cambia:**
- El mensaje de WhatsApp sigue la regla 9 de `CLAUDE.md` y `docs/decisiones/2026-11-14_whatsapp_idiomas.md`: el idioma elegido en su selector o, si no hay, el del teléfono; si ninguno tiene plantilla, español.
- El explorador de parcelas (`web/explorer.html`) sigue solo en inglés, como dice `docs/decisiones/2026-11-15_tablero_principal_idiomas.md`.

**Dónde vive:** `web/js/i18n.js` (función `elegir`). Prueba: `tests/i18n.test.js` (un navegador en español abre en inglés; el selector, la liga y la elección guardada lo cambian al español).

Reemplaza el punto «El tablero abre en el idioma del navegador…» de `docs/decisiones/2026-11-15_tablero_principal_idiomas.md`.
