<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Bitácora de construcción · Raíz – From Dam to Root

**Qué es:** el registro de cada pieza: inicio, revisiones, rondas de corrección, decisiones del integrador y pendientes. El protocolo está en `docs/prompts/README.md`, §7.

**Cómo se escribe:**
- **Hora:** local de Chihuahua (UTC−6). Los commits de Claude Code registran la hora en UTC: 15:06 UTC = 09:06 en Chihuahua.
- **Formato:** una línea por evento. No se borran líneas: si algo cambia, se agrega una línea nueva.
- **Eventos:**
  - INICIO, EN CURSO, HECHO y BLOQUEADO;
  - REVISIÓN (veredictos y conteo por severidad);
  - RONDA n/3;
  - MENOR (diferido);
  - DECISIÓN, APARCADO y R1.

## Sábado 14-nov-2026

| Hora | Pieza | Evento | Detalle | Enlace |
|---|---|---|---|---|
| 09:00 | — | INICIO | Arranca la construcción del sábado | — |
| 09:06 | K-INT (base) | HECHO | `CLAUDE.md`, `data/params.json`, contrato simulado v4 (`data/simulados.json` y `motor/simulados.py`), `validar_contrato.py`, `web/reglas.js` (reglas del kit §2.4) y bibliotecas en `web/vendor/`: MapLibre GL 5.24.0, d3 7.9.0 y d3-sankey 0.12.3, copiadas de npm con sha384 en `web/vendor/VERSIONS.json` | commit `1215f33` |
| 09:06 | Operación | DECISIÓN | Earth Engine lo corre otra sesión, no este repo: aquí no se escriben scripts de Earth Engine | `CLAUDE.md`, «Operación» (commit `1215f33`) |
| 09:06 | Operación | DECISIÓN | Entregas del equipo en Drive, `Raiz/entregas/`, con una línea por archivo en `Raiz/entregas/LEEME.md` (`archivo \| fuente \| fecha \| script`). `motor/ensamblar.py` las valida contra la tabla 0.4-B y solo copia a `data/processed` las que pasan | `CLAUDE.md`, «Operación» (commit `1215f33`) |
| 09:06 | web | DECISIÓN | Bibliotecas locales en `web/vendor/`, con versión fija y hash, porque el proxy de la máquina de construcción bloquea los CDN. El kit (C1 y X3.2) pedía CDN; el contrato no cambia | `web/vendor/VERSIONS.json` (commit `1215f33`) |
| 09:10 | Zona piloto | DECISIÓN | Rectángulo de la zona piloto acordado con la sesión de datos; está en `data/params.json` (`zona_piloto.bbox`) con etiqueta [S] | commit `cd4115e` |
| 09:15 | Revisión de la rama `datos-satelite` | REVISIÓN | 5 CRÍTICO, 10 IMPORTANTE y 4 MENOR. Los atiende la sesión de datos antes de que lleguen datos reales | `docs/revisiones/2026-11-14_0915_datos-satelite.md` (commit `cbcbe71`) |
| 09:32 | web (C1, C2) e infra | EN CURSO | Commit WIP «en revisión»: centro de control y ficha con datos simulados; `construir.py`, `motor/manifest.py`, pruebas (K-TEST 2, 3, 4, 7 inicial y 8) y flujo de GitHub Actions | commit `92b234e` |
| 09:42 | Piezas en curso | EN CURSO | **web** (C1, C2); **infra** (comando único, pruebas y CI); **buzón** (K-ENS, `motor/ensamblar.py`); **skills** (skills, agentes y prompts de revisión); **guía del equipo** | — |
| 09:42 | skills | HECHO (pendiente de revisión) | 7 skills copiadas sin modificar con su licencia (`.claude/skills/README.md`); 3 agentes copiados y 2 propios (`revisor-contrato` y `revisor-cifras`); protocolo y prompts en `docs/prompts/`; esta bitácora. Sin hooks. Sin commit: lo hace el integrador | `.claude/skills/README.md`, `.claude/agents/README.md`, `docs/prompts/README.md` |
| 09:45 | Re-revisión de la rama `datos-satelite` | REVISIÓN | Segunda revisión de solo lectura de los hallazgos de las 9:15. Veredicto: «todavía no está lista para datos reales». B1, A1 y A3/A3-M listas; A5 y A4 con pendientes | `docs/revisiones/2026-11-14_0945_datos-satelite_re-revision.md` (commit `d6666dd`) |
| 09:50 | infra | MENOR (diferido) | `npm test` (`node --test tests/` en `package.json`) falla en Node 22.23.4: toma la carpeta como módulo (`Cannot find module …/tests`). `node --test tests/*.test.js` pasa 23/23. `construir.py` y el flujo de CI pasan los archivos uno por uno y no se ven afectados. Lo corrige la pieza infra (`package.json` no es de la pieza skills) | observado al probar la pieza skills |
