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
| 22:37 | integrador | Fusión de `claude/sleepy-heisenberg-pxyhtx` («Laptop») (`fb53a8c`) |
| 22:38 | integrador | Revisión de UX de la web y principios de diseño con fuente, para el chat de diseño (`faff5cd`) |
| 22:39 | integrador | Bitácora y uso de IA de la noche del 14 al 15 de noviembre (`09bdafd`) |
| 22:45 | integrador | Fusiones de `claude/sleepy-heisenberg-pxyhtx` (`9f08dda`) y de `claude/gallant-franklin-41s0vq`, diseño (`dd03843`) |
| 22:51 | integrador | Fusión del relieve: la página dice solo lo que sostiene el DEM de 30 m (`32aa58c`, en `a50197d`) y de las prioridades del productor, «What matters most to you?» (`e375fba`, en `c8e2c4c`) |
| 22:54 | integrador | Auditoría del código nuevo: correcciones con prueba (`b7bbc7d`) |
| 22:55 | integrador | Reconstruido con relieve, prioridades y las correcciones de la auditoría: 1080 pytest y 181 de Node (`4c3cd54`) |
| 22:59 | integrador | Preguntas difíciles: OpenET cubre los 48 estados contiguos y FARMS (`654c1ea`) |
| 23:03 | integrador | Decisión: reglas del motor tras la revisión (`fdb3659`) |
| 23:10 | integrador | Fusión del validador del contrato: huecos de la auditoría (`f071651`, en `c94b810`) |
| 23:14 | integrador | La gota describe el escenario de goteo y no lo recomienda, decisión de Cristian (`987b561`); fusión de `a5f6dfd`, web_smoke en el teléfono (`4931ce0`) |
| 23:15 | integrador | Reconstruido con las correcciones de la ficha, la frase del goteo y el validador: 1089 pytest (`16c905d`) |
| 23:19 | integrador | Fusión de los textos públicos con las correcciones de la auditoría (`bf4a9b9` y `57fecbe`, en `58d5a86`) |
| 23:25 | integrador | web_smoke: un control desactivado no cuenta como objetivo táctil (`932b5a4`); fusión de la ficha con el tipo de suelo y las notas de nutrientes, entregas B7 y B8 (`073dfc3`, en `966eff3`) |
| 23:26 | integrador | Reconstruido con el tipo de suelo y los nutrientes por parcela: 1102 pytest y 200 de Node (`3239d82`) |
| 23:40 | integrador | Diapositivas regeneradas sobre la página actual (`40c01ec`) |
| 23:42 | integrador | Fusión de la auditoría del contrato: filtros de la secuencia publicada y rodal joven sin corte de verano (`272fa71`, en `9e5e386`) |
| 23:43 | integrador | Reconstruido con el buzón v11 (fuentes en inglés): 1,267 opciones, 1129 pytest y 200 de Node (`2148e81`); fusiones de `claude/revision-spaceapps-guia` (`837155d`) y de `datos-satelite` (`743d302`) |
| 23:45 | integrador | Reconstruido tras fusionar `datos-satelite` y la revisión contra la guía de Space Apps. Integración en `d5de13f` |

Las filas de las 22:37 a las 23:45 se agregaron después, con las horas de los commits de la rama de integración (`git log --first-parent`, pasadas de UTC a la hora de Chihuahua, UTC−6). La fila de las 22:40 es la hora que anotó el integrador al crear el archivo; su commit es de las 22:37.
