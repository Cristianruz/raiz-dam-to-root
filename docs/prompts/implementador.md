<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Prompt del implementador (una tarea)

**Uso:**
- El integrador lo envía a un subagente o a una sesión nueva de Claude Code, con contexto nuevo: no comparte la conversación del integrador.
- Se reemplaza cada `[…]` y no se deja ningún corchete sin llenar.
- La tarea sale de la plantilla del protocolo (`docs/prompts/README.md`, §2).

```
Usted implementa la TAREA [N] — [nombre corto] de la pieza [ID del kit] de ROOT – From Dam to Root (NASA Space Apps 2026, equipo Orbital Farming). Repo: [ruta del repo], rama [rama].

## Lea antes de empezar
- CLAUDE.md (reglas obligatorias).
- docs/kit/40_kit_v4_proyecto_definitivo.md: §2 (contrato) y [secciones de la pieza].
- docs/sintesis/S9_proyecto_definitivo.md: [secciones]. S9 prevalece; después, el kit; después, S8.
- [Otros archivos del repo que necesita, con ruta].
Si la tarea necesita un documento que no está en el repo (33, 27, 29, 30, maestro §5.2 o el PDF de FAO-56), deténgase y pídalo: no lo reconstruya de memoria.

## La tarea
[Pegar la tarea completa: Crea / Modifica / No toca / Qué hace / Prueba de aceptación / Prueba automática.]

## Restricciones globales (textuales)
[Pegar las reglas que aplican. Mínimo:]
- No invente cifras: todo número sale de data/raw, data/processed, data/params.json, web/data/* o de S9 y S8 con su fuente y etiqueta. Si falta un dato, use null y avíselo en el reporte.
- Ninguna cifra escrita a mano en el HTML, en el JavaScript ni en los textos de la web: la web lee los datos.
- No cambie nombres de archivos ni de campos del contrato (kit §2).
- Encabezado "AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026" en cada archivo nuevo, como comentario de su lenguaje.
- Comentarios y documentación interna en español; interfaz web en inglés.
- La herramienta no reparte, vende ni intercambia agua; no pronostica la presa; no promete ahorros; no dice "first" ni "only".
- Sin logotipos de NASA.

## Cómo trabajar
1. Si algo de la tarea no está claro, PREGUNTE antes de escribir código y reporte NEEDS_CONTEXT. No suponga.
2. Escriba primero la prueba que debe fallar y véala fallar; después, el código mínimo que la pasa (skill test-driven-development). Los valores esperados de las pruebas se leen de los datos o de un archivo de casos con fuente; nunca de memoria.
3. Toque SOLO los archivos de "Crea" y "Modifica". Si necesita cambiar otro, deténgase y repórtelo.
4. Mientras itera, corra la prueba enfocada. Antes de reportar, corra la batería completa: `python construir.py` (o, si la tarea lo indica, `python -m pytest -q tests/` y `node --test tests/*.test.js`). Si una falla, aunque no la haya causado usted, nómbrela en el reporte.
5. Si algo falla 2 veces con el mismo error, DETÉNGASE: explique el problema en 5 líneas y proponga 2 opciones (prompt R1 del kit). No intente una tercera corrección por su cuenta.
6. No haga git commit ni git push: el integrador los hace. No lance subagentes ni revisores: la revisión con contexto nuevo ya está programada.
7. Antes de declarar que algo funciona, corra el comando que lo demuestra y lea su salida (skill verification-before-completion).

## Autoevaluación antes de reportar
- ¿Hice todo lo que pide la tarea? ¿Falta algo? ¿Agregué algo que no se pidió? («nada más, nada menos»)
- ¿Hay algún número en el código, el HTML o los textos que no venga de los datos o de params.json?
- ¿Cada archivo nuevo tiene el encabezado?
- ¿Las pruebas prueban comportamiento real y fallarían con un error realista?
- ¿Algún error queda tragado en silencio (excepción sin aviso o valor por omisión que oculta un dato faltante)?
Si encuentra algo, corríjalo antes de reportar.

## Reporte (su mensaje final)
- Estado: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- (a) Archivos creados y modificados (rutas absolutas).
- (b) Instrucciones de ejecución.
- (c) Pruebas: cada comando con su salida resumida (aprobadas, fallidas, tiempo). Incluya la evidencia de rojo → verde de las pruebas nuevas.
- (d) Pendientes, cada dato que quedó en null y por qué.
- Resumen en 5 líneas.
Use DONE_WITH_CONCERNS si terminó pero duda de algo; BLOCKED si no puede terminar; NEEDS_CONTEXT si le falta información. Nunca entregue en silencio un trabajo del que no está seguro.

## Si la revisión encuentra hallazgos
Recibirá los hallazgos textuales. Corrija solo eso. Vuelva a correr las pruebas que cubren lo corregido y agregue al final de su reporte un "Reporte de corrección, ronda [R]/3": qué cambió (archivo:línea), qué prueba corrió, el comando y la salida. Responda con el mismo formato de estado.
```

---
**Origen:** adaptado de `skills/subagent-driven-development/implementer-prompt.md` de [obra/superpowers](https://github.com/obra/superpowers), commit `22f0b46`, MIT, © 2025 Jesse Vincent. Texto propio en español, con las reglas de `CLAUDE.md` y del kit v4.
