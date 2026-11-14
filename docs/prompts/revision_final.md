<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Revisión final de toda la rama

**Cuándo:** con las funciones congeladas (dom 8:00), antes de Q1, y antes de cada pull request de `claude/sleepy-heisenberg-pxyhtx` a `main`. A `main` solo se llega por pull request; lo fusiona Cristian.

**Pasos:**
1. Preparar el paquete.
2. Revisores en paralelo.
3. Consolidar.
4. Un validador por hallazgo.
5. Una ola de corrección.
6. Una re-revisión.
7. Decisiones del integrador.
8. Q1 y Q2 del kit.

## Paso 1 — Paquete (lo prepara el integrador, fuera del repo)
```
BASE=$(git merge-base main HEAD)
git log --oneline $BASE..HEAD              > [tmp]/final.diff
git diff --stat $BASE..HEAD               >> [tmp]/final.diff
git diff $BASE..HEAD -- . ':!web/vendor'  >> [tmp]/final.diff
grep -E 'MENOR \(diferido\)|DECISIÓN|APARCADO' docs/progreso.md > [tmp]/pendientes_bitacora.txt
```
`web/vendor/` se excluye del diff: son bibliotecas copiadas de npm y las verifica `tests/versiones.test.js`.

## Paso 2 — Revisores en paralelo
Cada uno recibe el **preámbulo común** y su **foco**. Todos trabajan con contexto nuevo y en solo lectura.

**Preámbulo común:**
```
Usted hace la REVISIÓN FINAL de la rama [rama] de Raíz – From Dam to Root (NASA Space Apps 2026), de [BASE] a [HEAD]. Paquete: [tmp]/final.diff. Pendientes de la bitácora (MENOR diferidos y decisiones del integrador): [tmp]/pendientes_bitacora.txt.
Reglas: SOLO LECTURA (no modifique archivos, el índice ni la rama; no corra `python construir.py` ni los scripts de motor/; sin red; sin subagentes). Lea CLAUDE.md, docs/sintesis/S9_proyecto_definitivo.md y las secciones del kit que su foco indique. Prioridad: S9 → kit v4 → S8.
Reporte solo hallazgos con confianza ≥ 80, con severidad CRITICO | IMPORTANTE | MENOR, archivo:línea y la regla o sección que se incumple. Para cada MENOR diferido de la bitácora que caiga en su foco, diga si debe corregirse antes de fusionar (SÍ/NO, en una línea). No reabra una DECISIÓN del integrador salvo que tenga evidencia nueva; si la tiene, dígalo aparte.
Formato: tabla | # | Sev. | Archivo:línea | Problema | Regla o sección | Arreglo | Conf. |, luego "Lo sólido" (2 a 4 puntos) y "Comprobaciones que ejecuté".
```

**Focos:**

| Revisor (agente) | Foco que se agrega al preámbulo |
|---|---|
| `revisor-contrato` | «Contrato v4 completo (kit §2) sobre `web/data/*`, `data/params.json`, el ensamblador y el motor. Huecos de `validar_contrato.py` frente al kit. `manifest.json` completo.» |
| `revisor-cifras` | «Reglas 2, 3, 4, 9, 10 y 11 de `CLAUDE.md` en `web/`, textos, explicaciones, `README.md`, `LIMITATIONS.md` y documentos públicos. Excepciones de `tests/excepciones_cifras.json`.» |
| `code-reviewer` | «Errores de lógica y violaciones claras de `CLAUDE.md` en el código de la rama. Cada violación, con la cita textual de la regla.» Este agente no tiene Bash: el paquete ya trae el diff. |
| `silent-failure-hunter` | «Solo lectura. Fallas silenciosas en el ensamblador, el motor, la carga de datos de la web y los scripts: excepciones tragadas, valores por omisión que ocultan un dato faltante (la regla 2 pide null y aviso) y entregas inválidas corregidas en silencio (K-ENS lo prohíbe). Ignore las referencias del agente a Sentry, `logError` o `errorIds.ts`: no existen en este proyecto.» |
| `pr-test-analyzer` | «Solo lectura. Cobertura de K-TEST (kit §4): FAO-56, unidades, ejemplo de escala de S9 §5, reglas §2.4 con sus casos límite, balance de La gota, verificador de C3, "ninguna cifra en la página", contrato, coherencia y manifest. Las pruebas calificadas de 8 a 10 cuentan como IMPORTANTE.» |
| Revisor de alcance (subagente general, solo lectura) | «Alcance contra S9 §8 (núcleo, segunda línea, si sobra tiempo, fuera) y §11 (límites que se declaran): nada de lo "fuera"; lo no ejecutado aparece como "not run"; el aviso de juicio local en cada ficha; ninguna promesa que S9 §11 descarta.» |

## Paso 3 — Consolidar (integrador)
- Una sola lista con número, quitando duplicados: el mismo archivo:línea y el mismo problema.
- Se conserva la severidad más alta y se anota qué revisores lo vieron.

## Paso 4 — Un validador por hallazgo (en paralelo, contexto nuevo, solo lectura)
```
Usted VALIDA un hallazgo de la revisión final de Raíz – From Dam to Root. No revise nada más.
Hallazgo #[n]: [texto completo: severidad, archivo:línea, problema, regla citada, revisor que lo reportó].
Contexto: rama [rama], [BASE]..[HEAD]; CLAUDE.md; [sección del kit o de S9 que cita el hallazgo].
Reglas: SOLO LECTURA; sin red; sin subagentes; no corra `python construir.py` ni los scripts de motor/. Puede leer archivos y correr una prueba enfocada si la necesita.
Tarea:
1) Compruebe que el problema existe tal como se describe, en ese archivo y esa línea, en el HEAD actual.
2) Si cita una regla de CLAUDE.md o del kit, compruebe que la regla dice eso y que aplica a ese archivo.
3) Descarte los falsos positivos típicos: el problema ya existía antes de la rama, el código es correcto aunque lo parezca, es una cuestión de estilo que ninguna regla pide, o es un identificador de código y no texto visible.
Responda en 4 líneas:
VEREDICTO: CONFIRMADO | RECHAZADO
SEVERIDAD AJUSTADA: CRITICO | IMPORTANTE | MENOR
CONFIANZA: 0–100
EVIDENCIA: archivo:línea y, si aplica, comando → resultado
```
- Solo pasan los **CONFIRMADOS con confianza ≥ 80**. Los rechazados se anotan en la bitácora con su motivo.
- Modelo del validador: para errores de lógica, el más capaz disponible; para cumplimiento de reglas, basta uno intermedio.

## Paso 5 — Una ola de corrección
- **Un** implementador (`implementador.md`) recibe la lista completa de hallazgos confirmados como su tarea, en lugar de un implementador por hallazgo.
- Sus archivos permitidos son los que citan los hallazgos.
- Corre `python construir.py` completo al final y lo reporta.

## Paso 6 — Una re-revisión
- Se usa `re_revision.md` con todos los hallazgos de la ola y el diff de la ola.
- No hay segunda ola.

## Paso 7 — Decisiones del integrador
- Cada hallazgo que siga abierto se decide y se anota en `docs/progreso.md` como «DECISIÓN:»: aparcar con su motivo, plan B o R3.
- Si un hallazgo CRITICO queda abierto, no se fusiona a `main`. Se aplica el recorte (R3) o se declara en `LIMITATIONS.md`, según decida Cristian.
- Al cerrar, el integrador copia a la descripción del pull request la lista de todas las líneas «DECISIÓN:» de la bitácora, con lo que cuesta cada una si resulta equivocada.

## Paso 8 — Q1 y Q2
Q1 (revisión total como juez) y la lista de envío Q2, ambos del kit §8. Los hallazgos de Q1 siguen este mismo protocolo, con un máximo de 10 correcciones antes de las 11:00.

---
**Origen:** adaptado de `skills/subagent-driven-development/references/final-review.md` de [obra/superpowers](https://github.com/obra/superpowers), commit `22f0b46`, MIT, © 2025 Jesse Vincent, y de `plugins/code-review/commands/code-review.md` de [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official), commit `b5b01ac`, Apache-2.0: revisores en paralelo y un validador por hallazgo. Texto propio en español.
