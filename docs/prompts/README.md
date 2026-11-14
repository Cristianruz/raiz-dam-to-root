<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Protocolo de revisión de cada pieza

**Qué es:** el camino que sigue cada pieza del kit v4 desde su especificación hasta el commit del integrador. Lo citan `CLAUDE.md` («Operación») y la bitácora `docs/progreso.md`.

**Quién:**
- **Integrador:** Cristian, en la sesión de Claude Code que coordina. Es el único que hace commits (kit §0.1, regla 1).
- **Implementador y revisores:** subagentes o sesiones nuevas de Claude Code.
- **P2 a P5:** usan la variante para Gemini antes de entregar al buzón (`para_gemini.md`).

**Prioridad de documentos:** S9 → kit v4 → S8, como en `CLAUDE.md`. Si una pieza necesita un documento que no está en el repo (33, 27, 29, 30, maestro §5.2 o el PDF de FAO-56), se detiene y se pide. No se reconstruye de memoria.

## El flujo

```
 Especificación: prompt de la pieza en el kit + S9 + contrato (kit §2) + CLAUDE.md
        │
        ▼
 Tareas pequeñas: archivos exactos + prueba de aceptación + restricciones globales
        │
        ▼
 IMPLEMENTADOR, contexto nuevo ............................ implementador.md
        │  reporte: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
        ▼
 REVISOR de solo lectura, contexto nuevo ................... revisor.md
        │  veredicto 1: cumplimiento del kit, «nada más, nada menos»
        │  veredicto 2: calidad
        │  hallazgos CRITICO / IMPORTANTE / MENOR, solo con confianza ≥ 80
        ▼
 ¿Hay CRITICO, IMPORTANTE o NO CUMPLE?
        ├─ no → MENOR a la bitácora → commit del integrador → siguiente tarea
        └─ sí → CICLO DE CORRECCIÓN, máximo 3 rondas ....... re_revision.md
                 cada hallazgo: ATENDIDO | NO ATENDIDO
                 2 fallas con el mismo error → prompt R1 del kit
                 abiertos tras la ronda 3 → decisión del integrador (bitácora)
        ▼
 Todas las piezas listas → REVISIÓN FINAL DE LA RAMA ....... revision_final.md
        revisores en paralelo + un validador por hallazgo
        → una ola de corrección → una re-revisión → Q1 del kit
```

Todo queda en la bitácora `docs/progreso.md`.

## 1. Especificación
- La especificación es el **prompt de la pieza en el kit v4** (K-…, A…, B…, C…, X…, Q…), más:
  - el contrato del kit §2;
  - S9 (alcance; prevalece);
  - las reglas de `CLAUDE.md`.
- Se copian textuales las **restricciones globales** que aplican: nombres de archivos y campos, reglas 2 y 3 (cifras), encabezado, idioma y la regla 10.
- Si la pieza toca algo que S9 §8 deja «fuera» o «si sobra tiempo», no se especifica.

## 2. Tareas pequeñas
Una tarea es una pieza pequeña con entrada, salida y prueba de aceptación (kit §0.1, regla 4). Plantilla:

```
TAREA [N] — [nombre corto] (pieza [ID del kit], sección [§])
Crea:        [rutas exactas]
Modifica:    [rutas exactas]
No toca:     [archivos de otras piezas]
Qué hace:    [3 a 6 líneas, citando la sección del kit o de S9]
Prueba de aceptación: [comando] → [salida esperada; los valores esperados se leen de los datos]
Prueba automática:    [archivo en tests/] conectada a `python construir.py`
Restricciones globales (textuales): [reglas de CLAUDE.md y del contrato que aplican]
```

Si una tarea no cabe en un bloque corto de trabajo, se divide antes de lanzarla.

## 3. Implementador (`implementador.md`)
- **Contexto nuevo:** un subagente o una sesión nueva que solo recibe la tarea, las restricciones y las rutas que debe leer. No hereda la conversación del integrador.
- **Skills que aplica:** `test-driven-development`, `verification-before-completion` y, si algo falla, `systematic-debugging`.
- **No** hace commit ni push, **no** lanza revisores y **no** toca archivos fuera de su lista.
- **Reporte** (regla 7 de `CLAUDE.md`): estado, archivos creados, instrucciones de ejecución, pruebas (comando y salida), pendientes y un resumen de 5 líneas.

## 4. Revisor (`revisor.md`)
**Diff a revisar.** Lo prepara el integrador, de preferencia con un commit «WIP [pieza] — en revisión» y el rango `BASE..HEAD`. Si no hay commit, con la lista de archivos de la tarea y `git diff`.

**Contexto nuevo y solo lectura.** No confía en el reporte del implementador: lo verifica contra el diff.

**Qué agente:**

| Si la tarea toca… | Agente |
|---|---|
| `web/data/*`, `data/params.json`, `motor/`, el ensamblador o `validar_contrato.py` | `revisor-contrato` |
| `web/`, textos de interfaz, explicaciones, README o documentos públicos | `revisor-cifras` |
| cualquier código | `code-reviewer` (no tiene Bash: hay que pasarle el diff) |
| manejo de errores (ensamblador, carga de datos en la web) | además, `silent-failure-hunter` en solo lectura |
| pruebas (K-TEST, `web/reglas.js`, La gota) | además, `pr-test-analyzer` en solo lectura |

**Dos veredictos:**
1. **Cumplimiento del kit, «nada más, nada menos»:** CUMPLE / NO CUMPLE / NO VERIFICABLE, con lo que **falta**, lo que **sobra** (funciones no pedidas o fuera del alcance de S9 §8) y lo **mal entendido**.
2. **Calidad:** APROBADO / REQUIERE CORRECCIONES.

**Severidad:**
- **CRITICO:** rompe el contrato o una regla dura de `CLAUDE.md`. Por ejemplo: una cifra inventada o escrita a mano, un dato simulado sin marcar, una promesa de ahorro, «first» u «only» visibles, o una prueba que no prueba nada.
- **IMPORTANTE:** un requisito del kit falta o está mal aplicado, un error de lógica, un error tragado en silencio, o una regla de §2.4 sin prueba.
- **MENOR:** claridad, nombres o pulido.

**Confianza** de 0 a 100. Solo se reportan hallazgos con **≥ 80**. Lo dudoso va a «No verificable», con la comprobación que haría falta.

**Formato:** el de `docs/revisiones/` (`Sev. | Archivo:línea | Problema | Arreglo | Conf.`). El integrador guarda ahí la revisión de cada pieza con nombre `AAAA-MM-DD_HHMM_<pieza>.md`.

## 5. Ciclo de corrección (máximo 3 rondas) (`re_revision.md`)
**Qué entra:** todo hallazgo CRITICO o IMPORTANTE y todo NO CUMPLE. Los MENOR **no entran**: se anotan en la bitácora como «MENOR (diferido)» y los triaga la revisión final.

**Una ronda:**
1. El implementador corrige con los hallazgos copiados textuales. Si sigue disponible, es el mismo; si no, uno nuevo con la tarea, su reporte y los hallazgos.
2. Vuelve a correr las pruebas que cubren lo corregido.
3. Anexa a su reporte qué cambió, el comando y la salida.
4. Una **re-revisión** con contexto nuevo revisa solo los hallazgos y el diff de la corrección.

**Re-revisión:**
- Marca cada hallazgo **ATENDIDO** o **NO ATENDIDO**, con evidencia `archivo:línea`. «Intentado» no es atendido.
- Lo nuevo de severidad CRITICO o IMPORTANTE que rompa el diff de la corrección se suma a los abiertos.
- Lo que vea fuera de ese diff va a la bitácora como observación y no alarga el ciclo.

**Hallazgo contra el kit:** si un hallazgo pide algo que el kit o S9 contradicen, decide el integrador con S9 y el kit como autoridad. Antes de actuar, lo anota en la bitácora como «DECISIÓN:».

**Tras la ronda 3:** si quedan abiertos, el integrador decide uno por uno y lo anota como «DECISIÓN:»:
- (a) **aparcar:** el revisor se equivoca, o el hallazgo es real pero nada depende de él;
- (b) aplicar el **plan B** de la pieza (kit);
- (c) **R3** (recorte de alcance) si el hallazgo amenaza un hito.

Ningún hallazgo se descarta en silencio.

## 6. Dos fallas con el mismo error → R1
- Si una prueba, un comando o un hallazgo falla **2 veces con el mismo error**, se detiene el ciclo y se pega el prompt **R1** del kit (§8). Lo mandan la regla 8 de `CLAUDE.md` y el kit §0.1, regla 5.
- No se lanza otra ronda hasta elegir una de las opciones de R1.
- Si falla 3 veces, se aplica el plan B de la pieza.

Texto de R1 (kit §8, sin cambios):
```
Deténgase. Esto falló [N] veces con el siguiente error: [pegar el error]. No escriba más código por el momento.
1) Explique en 5 líneas qué está ocurriendo y la causa más probable.
2) Proponga 2 opciones de solución, de la más simple a la más compleja, con el tiempo estimado de cada una.
3) Si ninguna toma menos de 30 minutos, proponga el plan B de esta pieza (se encuentra en docs/40_kit_v4_proyecto_definitivo.md) o una forma de simplificarla sin romper el contrato de datos.
```
En este repo, el kit está en `docs/kit/40_kit_v4_proyecto_definitivo.md`.

## 7. Bitácora (`docs/progreso.md`)
Una línea por evento, con la hora local de Chihuahua:

`| hora | pieza | evento | detalle | enlace (commit, revisión o archivo) |`

**Eventos:**
- INICIO, EN CURSO, HECHO y BLOQUEADO;
- REVISIÓN (veredictos y conteo por severidad);
- RONDA n/3 (atendidos y abiertos);
- MENOR (diferido);
- DECISIÓN, APARCADO y R1.

## 8. Revisión final de la rama (`revision_final.md`)
**Cuándo:** antes de Q1 (dom 8:00–11:00) y antes de cada pull request a `main`. Base: `git merge-base main HEAD`.

**Pasos:**
1. **Revisores en paralelo**, cada uno con contexto nuevo y en solo lectura:
   - `revisor-contrato`, `revisor-cifras` y `code-reviewer`;
   - `silent-failure-hunter` y `pr-test-analyzer`;
   - un revisor de alcance contra S9 §8 (núcleo, segunda línea, fuera) y §11 (límites que se declaran).
   - Reciben también la lista de «MENOR (diferido)» y de «DECISIÓN:» de la bitácora.
2. **Consolidación:** el integrador quita duplicados.
3. **Un validador por hallazgo**, con contexto nuevo: confirma o rechaza con evidencia. Solo pasan los CONFIRMADOS con confianza ≥ 80.
4. **Una sola ola de corrección:** un implementador recibe la lista completa. Después, **una sola re-revisión**. Lo que quede abierto lo decide el integrador en la bitácora.
5. Al final, **Q1** y la lista de envío **Q2** del kit.

## 9. P2 a P5 con Gemini (`para_gemini.md`)
- Antes de dejar una tabla en `Raiz/entregas/<rol>/`, cada quien pega `para_gemini.md` en un chat de Gemini **nuevo**, con su cuaderno, la salida de la prueba y el esquema de la tabla 0.4-B.
- Si el veredicto es «CORREGIR ANTES DE ENTREGAR», corrige y repite, con un máximo de 3 rondas; con 2 fallas iguales, R1.
- Cuando el veredicto es «LISTO PARA ENTREGAR», agrega su línea en `Raiz/entregas/LEEME.md` (`archivo | fuente | fecha | script`) y avisa con `ENTREGA: [archivo] — prueba OK`.
- El ensamblador (K-ENS) vuelve a validar todo.

## 10. Hitos
El protocolo no detiene un hito (kit §0.1, regla 10): sáb 14:30, sáb 20:30, dom 8:00, dom 11:00, dom 13:00 y dom 14:30. Si un ciclo de corrección va a cruzar uno, el integrador aplica el plan B o R3 y lo anota.

## Archivos de esta carpeta

| Archivo | Para qué |
|---|---|
| `implementador.md` | Prompt del implementador de una tarea |
| `revisor.md` | Prompt del revisor de una tarea: dos veredictos, severidad y confianza |
| `re_revision.md` | Prompt de la re-revisión de una ronda de corrección |
| `revision_final.md` | Revisores en paralelo, validador por hallazgo, ola de corrección |
| `para_gemini.md` | Revisor que P2 a P5 pegan en Gemini para revisar su cuaderno y su tabla |

Agentes y skills: `.claude/agents/README.md` y `.claude/skills/README.md`.

---
**Origen y licencias.** Prompts propios en español, adaptados a Raíz. No son traducciones literales.
- **[obra/superpowers](https://github.com/obra/superpowers)**, commit `22f0b463e7a5e579904dd6211a520321035526f7`, licencia MIT (© 2025 Jesse Vincent). Se tomaron de `skills/subagent-driven-development/`:
  - `implementer-prompt.md`: contexto nuevo, estados del reporte y autoevaluación;
  - `task-reviewer-prompt.md`: dos veredictos y «nada más, nada menos»;
  - `re-review-prompt.md`: ADDRESSED / NOT ADDRESSED → ATENDIDO / NO ATENDIDO;
  - `references/fix-loop.md` y `references/final-review.md`.
  - Cambios para Raíz: 3 rondas en lugar de 5, R1 después de 2 fallas iguales, severidades en español, el implementador no hace commits y las reglas de cifras de `CLAUDE.md`.
- **[anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)**, commit `b5b01ac4f889fec0c4c6bb89f27ca7c8574473f6`, licencia Apache-2.0. Se tomaron:
  - de `plugins/code-review/commands/code-review.md`: revisores en paralelo, un validador por hallazgo y umbral de confianza 80;
  - de los agentes de `plugins/pr-review-toolkit/` y `plugins/feature-dev/`: los copiados en `.claude/agents/`.
