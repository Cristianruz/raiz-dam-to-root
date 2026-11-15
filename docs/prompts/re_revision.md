<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Prompt de re-revisión (una ronda del ciclo de corrección)

**Uso:**
- Después de cada ronda de corrección, con un máximo de 3 por tarea.
- Va a un revisor con contexto nuevo, normalmente el mismo tipo de agente que hizo la revisión.
- No es una revisión nueva: solo dictamina cada hallazgo y busca lo que la corrección rompió.

**Antes de enviarlo, el integrador:**
1. Prepara el diff de la corrección, de `[BASE_CORRECCION]` (el HEAD que vio la revisión anterior) a `[HEAD]`.
2. Confirma que el reporte de corrección del implementador trae la prueba, el comando y la salida.
3. Copia textuales los hallazgos abiertos: solo CRITICO, IMPORTANTE y NO CUMPLE; los MENOR no entran.

```
Usted hace la RE-REVISIÓN de la ronda [R]/3 de la TAREA [N] — [nombre corto] (pieza [ID del kit]) de ROOT – From Dam to Root.

## Reglas
- SOLO LECTURA: no modifique archivos, el índice, HEAD ni la rama. No corra `python construir.py` ni los scripts de motor/. Sin red. No lance subagentes.
- Su alcance es la lista de hallazgos y el diff de la corrección. Nada más.
- No vuelva a correr toda la batería. Confirme que el reporte de corrección nombra las pruebas que cubren lo corregido y muestra su salida; corra una prueba enfocada solo si una duda concreta lo exige.

## La tarea
[Pegar la tarea completa.]

## Hallazgos que debe dictaminar (textuales, uno por viñeta)
[- …]

## La corrección
- Reporte del implementador (los reportes de corrección van al final): [ruta o texto]
- Diff de la corrección: [ruta del archivo .diff]  ([BASE_CORRECCION]..[HEAD])

## Qué hacer
1. Para CADA hallazgo, en orden: ATENDIDO o NO ATENDIDO, con evidencia archivo:línea. "Intentado" no es atendido: el defecto debe haber desaparecido. Si el arreglo resolvió el síntoma pero no la causa, es NO ATENDIDO.
2. Revise el diff de la corrección en busca de daños nuevos: una cifra escrita a mano, un campo del contrato renombrado, un error ahora tragado, una prueba debilitada o borrada para que pase. Cada uno, con severidad (CRITICO, IMPORTANTE o MENOR), archivo:línea y confianza ≥ 80.
3. Lo que vea FUERA del diff de la corrección no bloquea esta tarea: anótelo como observación para la bitácora.

## Formato de su mensaje final (empiece directo con el primer dictamen)
### Dictamen por hallazgo
- [hallazgo en una línea] — ATENDIDO | NO ATENDIDO — evidencia archivo:línea
### Daños nuevos en el diff de la corrección
| Sev. | Archivo:línea | Problema | Arreglo | Conf. |   ("Ninguno" si está limpio)
### Observaciones fuera de alcance (para la bitácora)
… ("Ninguna" si no hay)
### Veredicto de la ronda
TODOS ATENDIDOS, SIN DAÑOS CRITICO/IMPORTANTE | QUEDAN ABIERTOS: [lista]
```

**Después, el integrador anota en `docs/progreso.md`:**
- `RONDA R/3 | X atendidos, Y abiertos | [hallazgos abiertos]`;
- los daños nuevos CRITICO e IMPORTANTE se suman a los abiertos de la siguiente ronda;
- las observaciones van como «MENOR (diferido)».

**Si el mismo hallazgo queda NO ATENDIDO dos veces con el mismo error**, no se lanza otra ronda: R1 del kit. Tras la ronda 3, decide el integrador (protocolo, §5).

---
**Origen:** adaptado de `skills/subagent-driven-development/re-review-prompt.md` y `references/fix-loop.md` de [obra/superpowers](https://github.com/obra/superpowers), commit `22f0b46`, MIT, © 2025 Jesse Vincent. Aquí, 3 rondas en lugar de 5 y R1 tras 2 fallas iguales.
