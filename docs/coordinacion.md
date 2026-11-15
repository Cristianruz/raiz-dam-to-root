<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Coordinación entre chats · noche del 14 al 15 de noviembre

Decisión de Cristian (14-nov, 22:40): todos los chats trabajan sobre **una rama de integración**, cada uno en **su propia rama**, se pasan la información entre ellos y se revisan. El diseño va aparte, en su propio chat. Este archivo es la regla común; si algo cambia, se agrega una línea al final de «Bitácora».

## Ramas

| Rama | Dueño | Para qué |
|---|---|---|
| `claude/keen-mayer-sp0vvm` | «Revisión multiagente» (integrador) | **Integración.** Aquí se junta todo, se reconstruye con `python construir.py`, pasan las pruebas y sale el PR a `main`. Nadie más empuja aquí |
| `claude/sleepy-heisenberg-pxyhtx` | «Laptop» | Gemelo digital, WhatsApp en cuatro idiomas (`web/js/mensaje.js`) y su revisión periódica (solo lectura sobre la integración) |
| `claude/gallant-franklin-41s0vq` | «Diseño de aplicación con agentes» | Diseño de la página: que sea amigable e interpretable, con menos información a la vista |
| `datos-satelite` y Drive `Raiz_entregas/` | Sesión de datos | Entregas de datos (Earth Engine y Colab) y revisión cruzada de lo que la página muestra de sus datos |
| `main` | Cristian (o el integrador, si Cristian lo pide) | Lo publicado en GitHub Pages; solo entra por PR con la CI en verde |

## Cómo se pasa una entrega

1. Antes de empezar una pieza: `git fetch origin claude/keen-mayer-sp0vvm` y fusionarla en la rama propia.
2. Commits pequeños, uno por tema, en la rama propia. Push a la rama propia.
3. Avisar al integrador con `send_message` (sesión `session_01HohrcgXBjBh7JX6bsYH9jg`): hash, archivos tocados, pruebas corridas y su salida, y qué cambia en la página.
4. El integrador la revisa con un revisor de contexto nuevo (`revisor-cifras`, `revisor-contrato` o `code-reviewer`, según la pieza; protocolo de `docs/prompts/`), la fusiona, reconstruye, corre `python construir.py` y las tres pruebas e2e, y avisa a todos el nuevo hash de integración.
5. Revisión cruzada: la sesión de datos compara lo que la página muestra de sus datos; «Laptop» corre sus pruebas del gemelo sobre la integración; el chat de diseño revisa la primera pantalla y la ficha en teléfono. Cada hallazgo va por `send_message` al dueño de la pieza.

## Quién toca qué (para no chocar)

| Archivos | Dueño hasta las 8:00 |
|---|---|
| `web/js/mensaje.js` | «Laptop» |
| `web/js/relieve.js`, `motor/dem_teselas.py`, `web/data/dem/` | integrador (agente de relieve) |
| `web/js/prioridades.js`, `web/css/prioridades.css` | integrador (agente de prioridades) |
| `motor/suelo_web.py`, tipo de suelo y nutrientes en `web/js/suelo.js` | integrador (agente de suelo) |
| `web/app.js`, `web/js/resumen.js`, `web/js/gota.js`: errores y claridad | integrador (agente web) hasta que entregue; después, diseño |
| `web/style.css`, `web/css/*`, jerarquía y diseño visual | diseño |
| `motor/*.py` restantes, `construir.py`, `validar_contrato.py` | integrador |
| `README.md`, `LIMITATIONS.md`, `DATA_LICENSE.md`, `docs/pitch/*`, `docs/en/*` | integrador |
| `data/processed/*` | solo por el buzón (`motor/ensamblar.py`) |
| `AI_USAGE.md`, `docs/progreso.md` | cada chat agrega sus líneas al final; el integrador resuelve los choques |

Si una pieza necesita tocar un archivo de otro dueño, se le pide al dueño por `send_message`.

## Horario (hora de Chihuahua)

| Hora | Qué |
|---|---|
| hasta 8:00 | Correcciones y diseño. **8:00: congelamiento del código** (después solo textos y materiales) |
| 8:00–10:00 | PR a `main`, publicación y revisión de cifras de la página final |
| 10:00–11:30 | Video final grabado sobre la liga pública (`RAIZ_URL=… node tests/e2e/grabar_video.mjs`) y diapositivas (`node tests/e2e/diapositivas_pdf.mjs`) |
| 13:00 | Primer envío (Cristian) |
| antes de 14:30 | Envío final (Cristian). Nadie guarda después |

## Reglas que no cambian

`CLAUDE.md` manda: ninguna cifra escrita a mano, null si falta un dato, interfaz en inglés y WhatsApp en español (y en los cuatro idiomas de la decisión del 14-nov), encabezado AI-assisted, sin «first» ni «only», sin promesas de ahorro, la herramienta no reparte, vende ni intercambia agua, y cada ficha avisa que apoya y no sustituye el juicio del agricultor ni del técnico.

## Bitácora

| Hora | Quién | Qué |
|---|---|---|
| 22:40 | integrador | Se crea este archivo. Integración en `981c39c` (main publicado en `e819b52`) |
