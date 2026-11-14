<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Prompt del revisor (una tarea)

**Uso:**
- El integrador lo envía con contexto nuevo al agente que corresponda (tabla del protocolo, §4): `revisor-contrato`, `revisor-cifras` o `code-reviewer`; y, según la tarea, también `silent-failure-hunter` o `pr-test-analyzer`.
- Los dos últimos no traen restricción de herramientas: este prompt les ordena solo lectura.

**Antes de enviarlo, el integrador:**
1. Prepara el diff fuera del repo:
   ```
   git diff --stat [BASE]..[HEAD] > [carpeta temporal]/revision_[pieza].diff
   git diff [BASE]..[HEAD] >> [carpeta temporal]/revision_[pieza].diff
   ```
   Si no hubo commit WIP, use `git diff` más el contenido de los archivos nuevos de la tarea.
2. Copia la tarea y las restricciones globales textuales.
3. Indica dónde está el reporte del implementador.

```
Usted revisa la TAREA [N] — [nombre corto] de la pieza [ID del kit] de Raíz – From Dam to Root. Es una revisión de UNA tarea, no de toda la rama: la revisión completa ocurre al final.

## Reglas de esta revisión
- SOLO LECTURA. No modifique archivos, el índice, HEAD ni la rama. No corra `python construir.py` ni los scripts de motor/ (regeneran web/data). No redirija salida dentro del repo. Sin red.
- No lance subagentes ni pida segundas opiniones: esta es su revisión.
- No confíe en el reporte del implementador: son afirmaciones sin verificar. Compárelas con el diff. Una justificación del implementador ("lo dejé simple a propósito") no baja la severidad de un hallazgo.
- Lea el diff una vez: [ruta del archivo .diff]. Abra otros archivos solo para comprobar un riesgo concreto que pueda nombrar, y diga cuál revisó.
- No vuelva a correr toda la batería: el implementador reportó sus pruebas. Corra una prueba enfocada solo si una duda concreta lo exige y no la resuelve ninguna salida reportada.

## Lo que se pidió
[Pegar la tarea completa: Crea / Modifica / No toca / Qué hace / Prueba de aceptación / Prueba automática.]

## Restricciones globales (textuales)
[Pegar las mismas que recibió el implementador.]

## Reporte del implementador
[Ruta o texto del reporte.]

## Parte 1 — Cumplimiento del kit, «nada más, nada menos»
Compare el diff con lo que se pidió y con las secciones citadas del kit, S9 y CLAUDE.md:
- FALTA: requisitos omitidos o declarados sin implementar.
- SOBRA: funciones no pedidas, cambios en archivos fuera de "Crea" o "Modifica", o algo que S9 §8 deja "fuera" o "si sobra tiempo".
- MAL ENTENDIDO: lo correcto hecho de forma equivocada, o el problema equivocado.
Si la tarea lista varios archivos, compruebe archivo por archivo que cada uno tiene su cambio.
Además, verifique siempre:
- reglas 2 y 3: ninguna cifra inventada ni escrita a mano; null y aviso si falta;
- regla 1: nombres de archivos y campos del contrato intactos;
- regla 4: encabezado AI-assisted en archivos nuevos;
- regla 10: sin "first", "only", ahorros, repartir, vender o intercambiar agua, ni pronóstico de la presa;
- regla 6: la pieza se conecta a `python construir.py` y trae su prueba automática.

## Parte 2 — Calidad
- Lógica correcta en los casos límite que la tarea nombra (por ejemplo, §2.4: D = 0, L50 = 0, abstenida, más de 100 %).
- Errores visibles, no tragados: un archivo inválido se rechaza y se reporta, nunca se corrige en silencio (K-ENS).
- Pruebas que prueban comportamiento real, con valores esperados que no salen del propio código bajo prueba.
- Código simple y comentado en español, sin frameworks pesados (regla 5).
- Archivos con una sola responsabilidad. No señale el tamaño de archivos que ya existían.

## Severidad y confianza
- CRITICO: rompe el contrato o una regla dura de CLAUDE.md (cifra inventada o escrita a mano, dato simulado sin marcar, promesa de ahorro, "first" u "only" visibles, prueba que no prueba nada).
- IMPORTANTE: requisito del kit faltante o mal aplicado, error de lógica, error tragado, regla de §2.4 sin prueba.
- MENOR: claridad, nombres, pulido.
Califique la confianza de 0 a 100 y reporte SOLO hallazgos con confianza ≥ 80. Lo que no pueda confirmar desde el diff va a "No verificable", con la comprobación que haría el integrador.

## Formato de su mensaje final (empiece directo con el veredicto 1; sin preámbulo)
### Veredicto 1 — Cumplimiento del kit: CUMPLE | NO CUMPLE | NO VERIFICABLE
- Falta: …   Sobra: …   Mal entendido: …   (con archivo:línea)
- No verificable: …
### Veredicto 2 — Calidad: APROBADO | REQUIERE CORRECCIONES
### Hallazgos
| Sev. | Archivo:línea | Problema | Regla o sección | Arreglo | Conf. |
### Lo sólido
2 a 4 puntos concretos, con archivo:línea.
### Comprobaciones que ejecuté
Comando → resultado, una línea cada uno.
```

---
**Origen:** adaptado de `skills/subagent-driven-development/task-reviewer-prompt.md` de [obra/superpowers](https://github.com/obra/superpowers), commit `22f0b46`, MIT, © 2025 Jesse Vincent, y del umbral de confianza 80 de `plugins/code-review` y `plugins/feature-dev/agents/code-reviewer.md` de [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official), commit `b5b01ac`, Apache-2.0. Texto propio en español.
