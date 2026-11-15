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
| 23:50 | integrador | Fusiones de «Laptop» (gemelo y WhatsApp en cuatro idiomas, `19d245a`), del terreno 2D (`1cef7d9`) y del rediseño (`7368b33`). Reconstruido: 1134 pytest y 223 de Node; web_smoke 747/747, pwa 39/39 y sin conexión 22/22. Integración en `2346788` |
| 00:02 | «Laptop» | Revisión cruzada de `2346788` en una copia limpia: todo en verde (mismos conteos). Por su parte, el PR #5 puede ir a `main` |
| 00:01 | integrador | Fusión de la tercera ronda de textos: conteos, crudos nuevos, suelo en la ficha, SI y esta bitácora (`d267952`, en `7f594e9`) |
| 00:03 | integrador | Fusiones de `datos-satelite` (`252efd8`, en `38bb06f`) y del prompt de Claude Design (`9ef46ba`, en `6041f51`) |
| 00:09 | integrador | Buzón v12 de la sesión de datos, solo textos (fuentes de suelo en inglés, sin «only»): entraron 35, rechazados 0, sha256 comprobados (`db8d16f`). web_smoke 747/747, pwa 39/39 y sin conexión 22/22 sobre ese commit |
| 00:12 | integrador | Revisión independiente de ECOSTRESS, «validado con correcciones» (`docs/revisiones/2026-11-15_ecostress.md`, `165236d`), y correcciones del revisor de cifras sobre la tercera ronda de textos (`45c411a`). Las correcciones del dato se le pasaron a la sesión de datos |
| 00:20 | integrador | Reconstruido con los textos de ECOSTRESS y la fixture del contexto regenerada (el commit `165236d` falló en la CI por esa fixture). Integración en `64aff74` |
| 00:36 | integrador | PR #5 fusionado en `main` (`d354010`, squash) con la CI en verde y los e2e sobre `f0dbf3b` (747/747, 39/39, 22/22). GitHub Pages publicó a las 00:38. `main` se fusionó de vuelta en la integración (`ab53a3b`) y se avisó a «Laptop», a diseño y a la sesión de datos |
| 00:40 | integrador | En curso, cada uno en su copia: página en inglés dentro de los plegados y ECOSTRESS a la vista; «Why it's suggested», «Benefits», hectáreas del «Why?» y la gota (cierre de hallazgos C2, I10, I15, M4, M6) |
| 01:27 | integrador | Buzón v13 de la sesión de datos: ECOSTRESS corregido (un sobrevuelo, un valor; sin pasos junto a la salida o la puesta del sol ni escenas nubladas) y fusión de `datos-satelite` (`a6f98cd`). Entraron 35, rechazados 0 (`75ceaac`). Cita textual de AppEEARS en README, DATA_LICENSE y textos de envío (`1235e3d`) |
| 01:50 | integrador | Fusión de «Why it's suggested», «Benefits», hectáreas del «Why?» y la gota (`9b4b308`, en `2117a58`), con las correcciones del revisor de código |
| 01:59 | integrador | Fusión de la página en inglés desde el origen, ECOSTRESS a la vista y el parche de GAEZ de la sesión de datos (`1984a5e`, en `0508a24`) |
| 02:22 | integrador | Correcciones de cuatro revisores de contexto nuevo (código, cifras y lenguaje, contrato, código web) y decisiones de la ficha por escrito (`f13ec46`, `e380460`). 1182 pytest y 243 de Node; web_smoke 874/874, pwa 39/39 y sin conexión 22/22 sobre `f13ec46` |
| 02:31 | integrador | Segundo PR a `main` abierto (#7). La otra conversación de diseño es la del PR #6 (prototipo de Claude Design, solo `docs/diseno/`): no es del integrador y lo decide Cristian |
| 02:38 | integrador | Video de 29 s y diapositivas regenerados sobre la página final (`ae9d54e`) |
| 02:50 | «Laptop» e integrador | La hoja impresa cita la fuente de la marca en inglés (`10f8be4`, fusionado en `bb44e04`). Revisión cruzada de «Laptop» sobre la mezcla: todo en verde. 1182 pytest y 243 de Node; web_smoke 875/875, pwa 39/39 y sin conexión 22/22 |
| 02:51 | integrador | PR #7 fusionado en `main` (`c5a9c25`, squash) con la CI en verde sobre `028c785`. `main` se fusionó de vuelta en la integración (`31e6d11`) y se avisó a «Laptop», a las dos conversaciones de diseño y a la sesión de datos |
| 03:35 | integrador | Buzón v14 de la sesión de datos, solo textos: el motivo del descanso como descripción y las notas de nutrientes sin «best» (`5b6cff4`). Entraron 35, rechazados 0. 1182 pytest y 243 de Node; web_smoke 875/875, pwa 39/39 y sin conexión 22/22 |
| 03:40 | integrador | Revisión de la rama `Tena` (`351bbf5`, tablero y recomendador) con tres revisores de contexto nuevo, a pedido de Cristian. No se fusiona nada de esa rama sin su decisión |
| 03:41 | integrador | PR #8 fusionado en `main` (`5394463`): buzón v14, solo textos. GitHub Pages publicó a las 03:42. Integración en `c916605` |
| 04:05 | integrador | Revisión de la rama `Tena` terminada (`docs/revisiones/2026-11-15_rama_tena.md`): construye y es estable, pero cuatro hallazgos impiden publicarla tal cual (idioma y nombre, tres PDF internos, órdenes al agricultor y un segundo modelo con otras hectáreas). No se fusionó; lo decide Cristian |

Las filas de las 22:37 a las 23:45 se agregaron después, con las horas de los commits de la rama de integración (`git log --first-parent`, pasadas de UTC a la hora de Chihuahua, UTC−6). La fila de las 22:40 es la hora que anotó el integrador al crear el archivo; su commit es de las 22:37.

## Estado de cada chat y de cada rama (15-nov, 02:55, hora de Chihuahua)

Revisión pedida por Cristian: cada chat, cada rama y la conversación del integrador. Cada fila se comprobó contra `git` y contra la transcripción del chat.

| Chat | Rama | Último commit | Frente a la integración | Lo que falta |
|---|---|---|---|---|
| «Revisión multiagente» (integrador) | `claude/keen-mayer-sp0vvm` | `31e6d11` | Es la integración; los PR #5 y #7 ya están en `main` | Lo que entreguen los otros chats antes de las 6:30; los abiertos del «Seguimiento» de `docs/revisiones/2026-11-15_cierre_hallazgos.md` |
| «Laptop» | `claude/sleepy-heisenberg-pxyhtx` | `36ecda7` | Todo fusionado (hoja impresa con la fuente de la marca en inglés) | Repetir su revisión cruzada sobre el commit que llegue a `main`. De sus tres observaciones: el texto del sorgo quedó resuelto con el buzón v12; el aviso de `suelo_tipos.json` (zona urbana y cuerpos de agua) es de la sesión de datos; `docs/pruebas.md` registra la versión del precache de la corrida anterior (menor, abierto) |
| «Diseño de aplicación con agentes» | `claude/gallant-franklin-41s0vq` | `9ef46ba` | Todo fusionado (rediseño y prompt de Claude Design) | El pulido que sigue (mapa primero en teléfono, jerarquía de la ficha, tokens en cuatro hojas de estilo) no tiene dueño hasta que Cristian diga en qué conversación sigue el diseño |
| Sesión de datos | `datos-satelite` y Drive `Raiz_entregas/` | `a6f98cd` | Todo fusionado; buzón v13 dentro (ECOSTRESS corregido, citas de AppEEARS, parche de GAEZ) | «best pH range» en dos notas de nutrientes y «Worst-case option» en el motivo del descanso; ubicación de las escenas de ECOSTRESS (escrita como límite); su revisión programada de las 6:40 |
| «Extracción del sitio Spaceapps» | `claude/revision-spaceapps-guia` | `5daf315` | Fusionada | Nada |
| Segunda conversación de diseño (prototipo de Claude Design) | `claude/prototipo-app-diseno` | `a727b03` | PR #6 abierto hacia `main`; solo agrega `docs/diseno/prototipo_claude_design/` | No es del integrador: lo decide Cristian. Si lleva el prototipo a `web/`, debe partir de la integración y entregar antes de las 6:30 |

| Otras ramas | Estado |
|---|---|
| `main` | `5394463` (PR #8), publicado en GitHub Pages a las 03:42. Trae todo lo auditado de la noche, la ficha con motivos y beneficios y el buzón v14 |
| `ee-crudos` | Rásteres crudos por zona (31 archivos, 192 MiB). No se fusiona ni se borra: es el respaldo de `datos/colab/correr_todo.py` |
| `revision/web-dos-zonas` | Un commit (`ad42dc3`) que no es ancestro de la integración, pero su contenido ya está: el clic con tolerancia (`web/app.js`) y la hoja impresa en una carta (la comprueba `web_smoke`). Se borra después del evento |
| `dependabot/…` (PR #2 y #3) | Sin fusionar a propósito hasta después del envío; el #3 rompe la prueba que fija la versión con que se generaron las teselas |
| `Milo`, `Milo2` | Siguen en `e819b52` (el `main` de hace dos PR), sin commits propios. Hay que actualizarlas desde `main` antes de trabajar en ellas |
| `Tena` | `351bbf5`: un commit con un tablero nuevo en `web/index.html`, un asesor y un recomendador, hecho sobre `e819b52`. Revisado en `docs/revisiones/2026-11-15_rama_tena.md`; no se fusiona sin la decisión de Cristian |

Hallazgos de las revisiones de anoche, uno por uno: `docs/revisiones/2026-11-15_cierre_hallazgos.md` (146 renglones: 73 resueltos, 31 parciales, 25 abiertos, 11 de persona y 6 para después del evento, comprobados contra `f0dbf3b`).
