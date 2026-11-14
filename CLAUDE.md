# CLAUDE.md — Raíz – From Dam to Root (NASA Space Apps 2026, Field Shift) · equipo Los Norteados

Proyecto: mostrar, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. Zona piloto del Distrito de Riego 005 Delicias, Chihuahua.

Alcance: `docs/sintesis/S9_proyecto_definitivo.md` (prevalece). Contrato y prompts: `docs/kit/40_kit_v4_proyecto_definitivo.md`. Cifras nuevas: `docs/sintesis/S8_enfoque_definitivo.md`. Plan del evento y prioridades: `docs/sintesis/S10_plan_sapo.md`. Si difieren, prevalece S9; después, el kit v4; después, S8.
Documentos citados por el kit que aún NO están en el repo (viven en el proyecto de Claude «Space Apps»): 33 (especificación técnica), 27 y 29 (cifras verificadas), 30 (preregistro H1), maestro §5.2 (rotaciones) y el PDF de FAO-56. Si una tarea los necesita, deténgase y pídalos; no los reconstruya de memoria.

REGLAS:
1. Respete el contrato de datos v4 (kit, sección 2). No modifique nombres de archivos ni de campos.
2. No invente cifras en ningún caso: todo número proviene de data/raw, data/processed, data/params.json o de S9 y S8 con su fuente y etiqueta. Si falta un dato, utilice null y notifíquelo.
3. Ninguna cifra escrita en el HTML, en el JavaScript ni en los textos: la web lee los datos. Una prueba automática lo comprueba.
4. Encabezado en cada archivo: "# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026" (o el equivalente en comentario del lenguaje). Los cuadernos hechos con Gemini conservan "# AI-assisted (Gemini) — Raíz, NASA Space Apps 2026".
5. Código simple y comentado en español; sin frameworks pesados. Python en scripts y cuadernos; web estática en HTML + JS + MapLibre GL JS + d3-sankey (copiadas con versión fija en web/vendor/, verificadas por hash).
6. Un comando reconstruye todo desde la caché (data/processed): `python construir.py`. Toda pieza nueva se conecta a ese comando y trae su prueba automática.
7. Cada tarea concluye con: (a) archivos creados, (b) instrucciones de ejecución, (c) resultado de la prueba de aceptación y de las pruebas automáticas, (d) pendientes.
8. Si una tarea falla 2 veces con el mismo error, deténgase y explique el problema en 5 líneas antes de continuar (prompt R1 del kit).
9. No utilice logotipos de NASA. Interfaz en inglés (español opcional); el mensaje de WhatsApp, en español.
10. La herramienta no reparte, vende ni intercambia agua; no pronostica la presa; no promete ahorros; no dice "first" ni "only". Cada ficha lleva el aviso: apoya y no sustituye el juicio del agricultor ni del técnico.
11. Agregue una línea a AI_USAGE.md por tarea y la entrada de cada cifra nueva en manifest.json.

OPERACIÓN:
- Las entregas del equipo llegan a Google Drive, `Raiz_entregas/`, con una línea por archivo en `Raiz_entregas/LEEME.md` (`archivo | fuente | fecha | script`). `motor/ensamblar.py` las valida contra la tabla 0.4-B del kit y solo copia a data/processed las que pasan.
- Earth Engine lo ejecuta otra sesión (no este repo): no escriba scripts de Earth Engine aquí.
- Protocolo de revisión de cada pieza: `docs/prompts/` (implementador → revisor con contexto nuevo → corrección, máximo 3 rondas). Bitácora: `docs/progreso.md`.
- Trabajo en la rama `claude/sleepy-heisenberg-pxyhtx`; a `main` solo por pull request que fusiona Cristian.
