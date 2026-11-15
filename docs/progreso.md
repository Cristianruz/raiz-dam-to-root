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
| 09:06 | Operación | DECISIÓN | Entregas del equipo en Drive, `Raiz_entregas/`, con una línea por archivo en `Raiz_entregas/LEEME.md` (`archivo \| fuente \| fecha \| script`). `motor/ensamblar.py` las valida contra la tabla 0.4-B y solo copia a `data/processed` las que pasan | `CLAUDE.md`, «Operación» (commit `1215f33`) |
| 09:06 | web | DECISIÓN | Bibliotecas locales en `web/vendor/`, con versión fija y hash, porque el proxy de la máquina de construcción bloquea los CDN. El kit (C1 y X3.2) pedía CDN; el contrato no cambia | `web/vendor/VERSIONS.json` (commit `1215f33`) |
| 09:10 | Zona piloto | DECISIÓN | Rectángulo de la zona piloto acordado con la sesión de datos; está en `data/params.json` (`zona_piloto.bbox`) con etiqueta [S] | commit `cd4115e` |
| 09:15 | Revisión de la rama `datos-satelite` | REVISIÓN | 5 CRÍTICO, 10 IMPORTANTE y 4 MENOR. Los atiende la sesión de datos antes de que lleguen datos reales | `docs/revisiones/2026-11-14_0915_datos-satelite.md` (commit `cbcbe71`) |
| 09:32 | web (C1, C2) e infra | EN CURSO | Commit WIP «en revisión»: centro de control y ficha con datos simulados; `construir.py`, `motor/manifest.py`, pruebas (K-TEST 2, 3, 4, 7 inicial y 8) y flujo de GitHub Actions | commit `92b234e` |
| 09:42 | Piezas en curso | EN CURSO | **web** (C1, C2); **infra** (comando único, pruebas y CI); **buzón** (K-ENS, `motor/ensamblar.py`); **skills** (skills, agentes y prompts de revisión); **guía del equipo** | — |
| 09:42 | skills | HECHO (pendiente de revisión) | 7 skills copiadas sin modificar con su licencia (`.claude/skills/README.md`); 3 agentes copiados y 2 propios (`revisor-contrato` y `revisor-cifras`); protocolo y prompts en `docs/prompts/`; esta bitácora. Sin hooks. Sin commit: lo hace el integrador | `.claude/skills/README.md`, `.claude/agents/README.md`, `docs/prompts/README.md` |
| 09:45 | Re-revisión de la rama `datos-satelite` | REVISIÓN | Segunda revisión de solo lectura de los hallazgos de las 9:15. Veredicto: «todavía no está lista para datos reales». B1, A1 y A3/A3-M listas; A5 y A4 con pendientes | `docs/revisiones/2026-11-14_0945_datos-satelite_re-revision.md` (commit `d6666dd`) |
| 09:50 | infra | MENOR (diferido) | `npm test` (`node --test tests/` en `package.json`) falla en Node 22.23.4: toma la carpeta como módulo (`Cannot find module …/tests`). `node --test tests/*.test.js` pasa 23/23. `construir.py` y el flujo de CI pasan los archivos uno por uno y no se ven afectados. Lo corrige la pieza infra (`package.json` no es de la pieza skills) | observado al probar la pieza skills |
| 09:47 | infra (CI) | HECHO | pip-audit detectó PYSEC-2026-1845 en pytest 8.4.2; se sube a pytest 9.1.0. `npm test` corregido a `node --test tests/*.test.js` | commits `888af30`, `9f4c251` |
| 10:19 | B4 + La gota | HECHO | `motor/b4_cubo.py` arma el cubo con datos reales; opciones por cultivo provisionales en `data/opciones_b4.json` [S] hasta B3 de P5; goteo en null hasta tener eficiencia con fuente | commit `a1a1fd3` |
| 10:19 | Contrato | DECISIÓN | Extensiones del contrato v4: `acuerdo_metodos` «1/1» (solo reglas) con `prob_max` null; parcelas abstenidas sin opciones; bloques de goteo en null | commit `a1a1fd3` |
| 10:53 | PR a main | HECHO | Pull request abierto; lo fusiona Cristian (o el integrador con su encargo) cuando todo esté en verde | Cristianruz/raiz-dam-to-root#1 |
| 11:17 | Guía del equipo | HECHO | `docs/equipo/` reescrita al estado real (lo que hizo la sesión de datos y lo que queda por rol); carpeta `Raiz_entregas` | commit `865f0fc` |
| 11:28 | Datos reales | HECHO | 13 entregas validadas (338 parcelas FTW, 120 clasificadas); `manifest.json` agrupado por patrón | commit `e807b0a` |
| 11:45 | web | HECHO | Web con datos reales: goteo no disponible sin tronar, ficha de abstenidas, lista con buscador; prueba de humo 100/100 | commit `f0f0458` |
| 12:00 | Lámina | DECISIÓN (Cristian) | La lámina del modelo (alfalfa P50 28.4 millares/ha) frente a INIFAP (17.5) se deja como está y se lleva a la mentoría; no se muestra la referencia de INIFAP en la ficha | conversación con Cristian |
| 12:50 | Zonas | DECISIÓN (Cristian) | Dos zonas piloto: delicias_saucillo ampliada al oeste y lazaro_cardenas; localidades del equipo como referencia | `docs/decisiones/2026-11-14_dos_zonas.md` (commit `6af1184`) |
| 13:12 | Verificador | HECHO | `motor/verificador.py` y set dorado de 30 casos (5 trampas): 30/30, 0 % de cifras alteradas; paso 7b del comando único; `docs/pruebas.md` generado | commits `b990b1d`, `79a33c3` |
| 13:20 | Dos zonas (buzón, motor, contrato, web) | REVISIÓN → HECHO | Flujo multiagente con revisor por pieza: las tres piezas APROBADAS tras corrección; B4 sin ACTUAL deja la parcela sin opciones | commit `dfe29f3` |
| 13:26 | README | REVISIÓN → HECHO | Auditoría de cifras del README (agente `revisor-cifras`): 4 IMPORTANTE y 5 MENOR, corregidos | commits `a74d8c2`, `e87ac93` |
| 13:26 | IMERG | HECHO | `imerg_diaria.csv` (GPM IMERG V07) validado e integrado; esquema por zona | commit `53c4367` |
| 14:00 | Dos zonas (datos) | EN CURSO | 20 entregas validadas en una copia: 1,239 parcelas (940 + 299), contrato OK. Se integran al terminar el flujo de la web para no cambiarle los datos a media construcción | — |
| 14:10 | Validación | HECHO | Resultados de la sesión de datos traídos a esta rama: H3 **not supported**, contraste de ET (A8) y verdad de H1; README actualizado con la misma visibilidad | commits `187db3d`, `694000e` |
| 14:10 | Datos | MENOR (para la sesión de datos) | 6 pares de parcelas con traslape mayor de 5 % en la entrega de dos zonas (p. ej. P0112/P0113, P0659/P0687) | revisión del integrador con shapely |
| 21:35 | Nombre | DECISIÓN (Cristian) → HECHO | Proyecto **ROOT** (antes Raíz) y equipo **Orbital Farming** (antes Los Norteados), propuestos en la mentoría. `python construir.py` OK (1022 pytest, 162 node) | `docs/decisiones/2026-11-14_nombre_root.md` |
| 21:33 | Nombre | HECHO (Cristian) | El nombre ROOT y el equipo Orbital Farming ya están registrados en la plataforma de Space Apps | `docs/decisiones/2026-11-14_nombre_root.md` |
| 20:50 | Integración del gemelo a la página (etapas 1–3) | HECHO | Etapa 1: vista 3D, línea de tiempo, «Twin status», app instalable y apertura en Delicias–Saucillo. Etapa 2: ficha completa (frase, NDVI, #id, suelo, lámina local, opciones B3, evidencia GEDI y helada). Etapa 3: «Regional context» plegable ligado a zona y año con las advertencias de la sesión de datos a la vista, «Challenge data sources» y H1-b (does not hold, sin cambiar H1) en «About & Data», enlaces a `docs/modelo_vs_practica.md` y `docs/revision_protagonistas.md` (revisión de IA; falta la de una persona), pendientes de la auditoría del motor en la web (etiquetas del distrito, textos en inglés, ventana de suelo desnudo, rutas cortadas, rótulo del goteo y «upper bound») y regla 11 completa en `manifest.json` para gemelo, contexto, suelo y NDVI | sin commit; rama `claude/sleepy-heisenberg-pxyhtx` |
| 20:50 | Integración (etapa 3) | MENOR (diferido) | Contrato a anotar en docs/decisiones (lo decide Cristian): `tarjetas[].advertencias` en `data/recursos_reto.json`, `malla_mascon` en las series de `contexto.json`, `complementos` (H1-b) y `documentos` en `pruebas.json` | reporte de la etapa 3 |

## Domingo 15-nov-2026 (madrugada; integración en `claude/keen-mayer-sp0vvm`)

| Hora | Pieza | Evento | Detalle | Enlace |
|---|---|---|---|---|
| 21:45 | Revisión integral | REVISIÓN | 9 agentes de contexto nuevo sobre `dda5abb`: contrato (2 IMPORTANTE que bloquean), cifras (6 que bloquean el envío), motor (5 IMPORTANTE), pruebas (todo pasa), web/UX (6 antes de las 13:00), plan y envío (publicación bloqueada) y 3 búsquedas (skills, tokens, diseño) | `docs/revisiones/2026-11-15_ux_web_y_diseno.md` |
| 22:00 | Integración | DECISIÓN (Cristian) | La sesión «Revisión multiagente» toma la integración del buzón, el motor, la ficha, los textos, los materiales y el PR a main | conversación con Cristian |
| 22:10 | CI | HECHO | Pillow fijo en `requirements.txt` (13.0.0; pip-audit marcaba 42 vulnerabilidades en 12.3.0) | `e6f382d` |
| 22:15 | Buzón v10 | HECHO | 35 entran, 0 rechazados: ECOSTRESS, GAEZ, tipos, reglas y nutrientes de suelo, contraste de ET 1,139.5 | `0b3ddd0` |
| 22:18 | main | HECHO | PR #4 fusionado a pedido de Cristian con la CI en verde; Pages publicado (run 134) | `e819b52` |
| 22:20 | Ligas en inglés | HECHO | `docs/en/` (6 traducciones con cifras idénticas) y tabla de pruebas en inglés | `ac1d60e` |
| 22:28 | Motor y validador | HECHO | 13 correcciones con prueba (gota null, sin_actual, abstenida, exención del nogal, secuencia de avena_maiz, filtro de edad por parcela, explicación, construir.py, ventana que cruza el año, corte de verano con edad por S9 §2) | `1c6619b` |
| 22:33 | Textos públicos | HECHO | README, LIMITATIONS, DATA_LICENSE, textos del envío con la guía 2026, guion y preguntas; decisión del nogal | `c4dbbda`, `docs/decisiones/2026-11-15_nogal_sin_alternativas.md` |
| 22:36 | Página | HECHO | «criterion declared before the analysis» en lugar de «preregistered» (I22) | `56009d2` |
| 22:37 | Materiales | EN CURSO | Video de 29 s y diapositivas (borrador; se vuelve a grabar sobre la página final) | `cd900ae` |
| 22:40 | Coordinación | DECISIÓN (Cristian) | Una rama de integración, cada chat en su rama, revisión cruzada; diseño en su chat | `docs/coordinacion.md` |
| 22:33 | Diseño (fase 0) | HECHO | Diagramas del sistema actual, principios y sistema visual vigente, crítica de las capturas y revisión de escalabilidad: otras zonas del DR-005 y cualquier suelo sí; otro distrito todavía no (contrato con `distrito.boquilla` y `distrito.acuifero_0831`, cultivos y perennes fijos, calendario del hemisferio norte). Solo `docs/`; el cambio de contrato lo decide Cristian | `docs/diseno/` |
| 23:55 | Diseño | EN CURSO | Pasos 1/3 (`16a2a7a`) y 2/3 (`bbe990d`) del rediseño en `claude/gallant-franklin-41s0vq`; `web_smoke` en 562/563 con la falla del 3D en teléfono por verificar tras compactar la barra. El usuario pide tratar ROOT como aplicación y diseñarla en Claude Design: prompt en `docs/diseno/prompt_claude_design.md` | `docs/diseno/` |
