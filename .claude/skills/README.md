<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Skills del proyecto (`.claude/skills/`)

Las skills que usa Claude Code en este repo son **copias sin modificar** de repositorios públicos. Solo se agregó el archivo de licencia del repo de origen en las carpetas que no lo traían.
- Copia: 14-nov-2026, con `git clone --depth 1`.
- Los scripts de origen se leyeron completos y **no se ejecutaron**.
- Las copias no llevan el encabezado «AI-assisted»: no las escribió una IA del equipo y no se modifican. Este README sí lo lleva.

Las reglas del proyecto mandan sobre cualquier skill. Si una skill contradice `CLAUDE.md`, S9, el kit v4 o S8, se sigue el orden de prioridad de `CLAUDE.md`.

## Orígenes

| Repo | Commit (`git rev-parse HEAD` del clon) | Fecha del commit | Licencia |
|---|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | `1780c5e5a552fd4d1c9d6a7b0cab26b0c2bef064` | 2026-11-14 | Apache-2.0 (`LICENSE.txt` de cada skill) |
| [obra/superpowers](https://github.com/obra/superpowers) | `22f0b463e7a5e579904dd6211a520321035526f7` | 2026-11-03 | MIT (© 2025 Jesse Vincent) |
| [muend/geoai-skills](https://github.com/muend/geoai-skills) | `19937ce14c7d60d764732cc2688c6a3dd92f6d0e` | 2026-10-17 | MIT (© 2026 Muhammed Enes Duran) |

## Skills instaladas

| Skill | Repo origen | Commit | Licencia | Qué hace | Para qué en Raíz | Riesgos revisados |
|---|---|---|---|---|---|---|
| `webapp-testing` | anthropics/skills, `skills/webapp-testing` | `1780c5e` | Apache-2.0 (`LICENSE.txt` incluido) | Probar una web local con Playwright: «reconocer y luego actuar», capturas y registro de la consola | Revisar la web estática (C1, C2, C5): deslizador, marcas, consola sin errores y vista de teléfono. El método aplica a `tests/e2e/web_smoke.mjs` | `scripts/with_server.py` (biblioteca estándar) arranca el comando que se le pase con `shell=True`, espera el puerto en `localhost`, corre la prueba y apaga el servidor. No descarga nada ni pide credenciales. Solo se le pasan comandos propios. Los `examples/` escriben en `/mnt/user-data/outputs` y `/tmp`: son referencia, no se ejecutan. En esta máquina Playwright está instalado para Node, no para Python |
| `frontend-design` | anthropics/skills, `skills/frontend-design` | `1780c5e` | Apache-2.0 (`LICENSE.txt` incluido) | Guía de diseño visual: paleta, tipografía, estructura y redacción de la interfaz | Pulido de la web (C1 y C5): jerarquía, accesibilidad y textos claros de la interfaz en inglés | Solo instrucciones, sin scripts. Invita a «tomar riesgos estéticos» y a inventar textos de relleno. En Raíz, la identidad está fijada (kit C1 §10: colores y Atkinson Hyperlegible) y la propia skill dice que manda el brief. **Nunca** se escriben cifras de relleno (`CLAUDE.md`, regla 3) |
| `test-driven-development` | obra/superpowers, `skills/test-driven-development` | `22f0b46` | MIT (se agregó `LICENSE`) | Ciclo rojo–verde–refactorizar; `writing-good-tests.md`: cada prueba nombra el error que atrapa | Pruebas de K-TEST, `web/reglas.js` (§2.4), el motor (B4, X3.1) y el verificador de C3 | Solo instrucciones. Sus ejemplos usan `npm test` y TypeScript. En Raíz: `python -m pytest -q tests/`, `node --test tests/` y `python construir.py`. Es estricta («borre el código escrito antes de la prueba»): quien decide la excepción es Cristian, su «human partner» |
| `systematic-debugging` | obra/superpowers, `skills/systematic-debugging` | `22f0b46` | MIT (se agregó `LICENSE`) | Causa raíz antes de corregir, en 4 fases; rastreo hacia atrás, validación por capas y esperas por condición | Fallas de pruebas, del ensamblador o de la web. Complementa al prompt R1 del kit | `find-polluter.sh` (bash local) corre `npm test <archivo>` uno por uno y avisa qué prueba crea un archivo o carpeta. No usa red ni borra nada. En Raíz casi no aplica: las pruebas son `node --test` y pytest. `condition-based-waiting-example.ts` importa módulos que no existen aquí: es solo un ejemplo. La skill propone cuestionar la arquitectura después de 3 correcciones fallidas; **manda la regla 8 de `CLAUDE.md`**: 2 fallas con el mismo error → R1 |
| `verification-before-completion` | obra/superpowers, `skills/verification-before-completion` | `22f0b46` | MIT (se agregó `LICENSE`) | No declarar «listo» sin correr la verificación en ese momento y leer su salida | Cierre de cada tarea (`CLAUDE.md`, regla 7c) y de cada ronda del protocolo de `docs/prompts/` | Solo instrucciones. Menciona otras skills con el prefijo `superpowers:`; aquí se llaman sin prefijo |
| `google-earth-engine` | muend/geoai-skills, `skills/google-earth-engine` | `19937ce` | MIT (se agregó `LICENSE`) | Uso correcto de Earth Engine: modelo diferido, `scale` explícito, sin `getInfo()` en ciclos, exportaciones por lotes y registro de procedencia | **Solo para revisar** los scripts de Earth Engine que corre la otra sesión (A3, A3-M, A8 y A9). `CLAUDE.md` prohíbe escribir scripts de Earth Engine en este repo | Instrucciones, `references/authoritative-sources.md` (ligas a la documentación de Google) y `agents/openai.yaml` (metadatos de interfaz para Codex; Claude Code no lo usa). Sin scripts. No pide credenciales: el `ee.Initialize(project="my-project")` es un ejemplo dentro del texto y no se ejecuta. Su ejemplo usa Sentinel-2 con Cloud Score+; en Raíz manda el kit (A3: HLS L30/S30 con Fmask). Remite a skills no instaladas (`remote-sensing-analysis`, `change-detection` y `ml-experiment-standards`) |
| `terrain-hydrology` | muend/geoai-skills, `skills/terrain-hydrology` | `19937ce` | MIT (se agregó `LICENSE`) | Relieve e hidrología: higiene del DEM, unidades y CRS, acondicionamiento, D8, acumulación y umbral de cauces | Revisar A9 (relieve y «Simulate a storm»): unidades de la pendiente, acondicionamiento, umbral declarado en `supuestos.json` y rótulo de escala | Misma estructura y riesgos que la anterior: sin scripts y sin credenciales. Recomienda Copernicus GLO-30 y «abrir brechas antes de rellenar»; en Raíz manda el kit (A9: NASADEM a 30 m; «rellene depresiones»). El revisor puede anotarlo como observación, no como incumplimiento. Remite a skills no instaladas (`point-cloud-lidar`, `cartography-geoviz` y `mcda-suitability-analysis`) |

Las 7 skills tienen frontmatter con `name` (igual al nombre de su carpeta) y `description`. Ninguna trae hooks.

## Archivos copiados, con su sha256

Cada archivo es idéntico al de su commit de origen (`diff -r` contra el clon, salvo el `LICENSE` agregado).

| Archivo | sha256 | Origen |
|---|---|---|
| `webapp-testing/SKILL.md` | `51b7349e77ec63b7744a6f63647e7566a0b4d2e301121cc10e8c2113af6556a2` | anthropics/skills@`1780c5e` |
| `webapp-testing/LICENSE.txt` | `bc6b3af2f331cbc7fb0da1344efb2cbe5877a31498b4d70dbc7000f3405a1362` | anthropics/skills@`1780c5e` |
| `webapp-testing/scripts/with_server.py` | `b0dcf4918935b795f4eda9821579b9902119235ff4447f687a30286e7d0925fd` | anthropics/skills@`1780c5e` |
| `webapp-testing/examples/console_logging.py` | `ea46877289acb82da7e7ce59d0bc37c8977cd57e2a006d0c88d7a1c625bf95da` | anthropics/skills@`1780c5e` |
| `webapp-testing/examples/element_discovery.py` | `d63c89604a22f8845d724e95dda45db49b1bf57c25ce0a83afbb7b8da3d402f0` | anthropics/skills@`1780c5e` |
| `webapp-testing/examples/static_html_automation.py` | `9d533aafb875ee3ab8b8ebf8f5b9003ac8d999da3d09b285cce252e623140064` | anthropics/skills@`1780c5e` |
| `frontend-design/SKILL.md` | `d91970639e9f5c37682ac7ab60094d35f1c7c1f38d731bd56396563aee10c1d3` | anthropics/skills@`1780c5e` |
| `frontend-design/LICENSE.txt` | `0d542e0c8804e39aa7f37eb00da5a762149dc682d7829451287e11b938e94594` | anthropics/skills@`1780c5e` |
| `test-driven-development/SKILL.md` | `64b03fce4aee5a97a93160cea8111f3ba13a17b7c001db4bd5836d67fd10705d` | obra/superpowers@`22f0b46` |
| `test-driven-development/writing-good-tests.md` | `51471c853306ff92ca8bb41dcaea05f31c0e46b03651f8f3c99754b7172f4ae1` | obra/superpowers@`22f0b46` |
| `test-driven-development/LICENSE` (agregado) | `a37e0e9697144819e1d965176ac4ae5bc3fa02d11e7812036bbcadf6dafe2400` | `LICENSE` de obra/superpowers@`22f0b46` |
| `systematic-debugging/SKILL.md` | `51c6435d98c83c42c96ba7c35725a0b2c376cd487fb1a4e6bd0ddbe7e33ef202` | obra/superpowers@`22f0b46` |
| `systematic-debugging/root-cause-tracing.md` | `75b933b6a8c40bdb2031b10f21654395b56ec6ab6bc7b018c18d3fe57aeb7fb8` | obra/superpowers@`22f0b46` |
| `systematic-debugging/defense-in-depth.md` | `1e175fb86fc357e58c6aebf5441e481e1b7868b4380c0456b63a17eefbd18ba7` | obra/superpowers@`22f0b46` |
| `systematic-debugging/condition-based-waiting.md` | `e89fec8400d6cd50f43407cec9fab50976ba4d55d0ec2eb51c0bd68036b54c26` | obra/superpowers@`22f0b46` |
| `systematic-debugging/condition-based-waiting-example.ts` | `40ae5ebe497fdf310200e43fe986552546d0a22837c0d39e855db1cfd33eb88e` | obra/superpowers@`22f0b46` |
| `systematic-debugging/find-polluter.sh` | `dd7b8f13c4cc2a24b33ff87b18da9248f3e1c80a085c3316224f69ff0fa5c43c` | obra/superpowers@`22f0b46` |
| `systematic-debugging/LICENSE` (agregado) | `a37e0e9697144819e1d965176ac4ae5bc3fa02d11e7812036bbcadf6dafe2400` | `LICENSE` de obra/superpowers@`22f0b46` |
| `verification-before-completion/SKILL.md` | `2befe7fc55bcadaa3d97dd9e8efeb633d2561c0ebe74c5a8b17c4d9e7e4520b3` | obra/superpowers@`22f0b46` |
| `verification-before-completion/LICENSE` (agregado) | `a37e0e9697144819e1d965176ac4ae5bc3fa02d11e7812036bbcadf6dafe2400` | `LICENSE` de obra/superpowers@`22f0b46` |
| `google-earth-engine/SKILL.md` | `bb323b7286377577426ac9966b7c00d34de6834920eef4a23c45222d6baf65f9` | muend/geoai-skills@`19937ce` |
| `google-earth-engine/references/authoritative-sources.md` | `c4afa61fae9faa86ec01450baef09e5f400eebed10e637a3cc5cf40ad52d73b9` | muend/geoai-skills@`19937ce` |
| `google-earth-engine/agents/openai.yaml` | `32e186fa0217647fbe0a23a623ab0d12dbadf605235d34e6435d73fcfebc6105` | muend/geoai-skills@`19937ce` |
| `google-earth-engine/LICENSE` (agregado) | `baa83d8fafc601ca07e383347b14551baac4235650a000d3332dfdbefebe352b` | `LICENSE` de muend/geoai-skills@`19937ce` |
| `terrain-hydrology/SKILL.md` | `391051e89b612760565c758b6e7db0a7a15993e2372c0ba300f8195c487c3304` | muend/geoai-skills@`19937ce` |
| `terrain-hydrology/references/authoritative-sources.md` | `d516c6abdb21d06990a4fbe800367c0b84102ebcb6cabe2a5546b18cae99eb8f` | muend/geoai-skills@`19937ce` |
| `terrain-hydrology/agents/openai.yaml` | `416f99aad664b1c0578f7f075c324f6d3c6aac0db7143585d3e77feb33348f86` | muend/geoai-skills@`19937ce` |
| `terrain-hydrology/LICENSE` (agregado) | `baa83d8fafc601ca07e383347b14551baac4235650a000d3332dfdbefebe352b` | `LICENSE` de muend/geoai-skills@`19937ce` |

**Comprobación local:**
```bash
cd .claude/skills && find . -type f ! -name README.md | sort | xargs sha256sum
```
Compare la salida con la tabla. Para comparar contra el origen, clone el repo en el commit indicado y use `diff -r`.

## Lo que NO se instaló y por qué

| Qué | Motivo | Cómo se comprobó |
|---|---|---|
| **Hooks** de cualquier origen (por ejemplo, el `SessionStart` de superpowers: `hooks/hooks.json` y `hooks/session-start`) | Ejecutan código en cada sesión sin que nadie lo pida. No se copió ningún hook ni ningún `settings.json` | Revisado en el clon: el hook de superpowers inyecta la skill `using-superpowers` al iniciar |
| **Plugins completos** (superpowers, feature-dev, pr-review-toolkit, code-review) | Solo se copiaron archivos sueltos y legibles: las skills de esta tabla y los agentes de `.claude/agents/` | — |
| `subagent-driven-development` (superpowers) | No se instaló como skill: su método se adaptó como prompts en español en `docs/prompts/`. Sus scripts (`task-brief`, `sdd-workspace`, `review-package` y `sdd-repo`) no se copiaron ni se ejecutaron | — |
| **accessibility-agents** | Hook de bloqueo y servicio externo | Evaluación previa del integrador; no se reverificó en esta sesión |
| **Plugin playwright** (anthropics/claude-plugins-official, `external_plugins/playwright`) | Su `.mcp.json` lanza `npx @playwright/mcp@latest`: sin versión fija | Verificado en el commit `b5b01ac` |
| **claude-d3js-skill** | Sin licencia | Evaluación previa del integrador; no se reverificó |
| **geemu-skill** | Pide credenciales | Evaluación previa del integrador; no se reverificó |
| **Task Master, ruflo/claude-flow, BMAD, SuperClaude y ccpm** | Pesados o con demonios o llaves | Evaluación previa del integrador; no se reverificó |
| Las otras 16 skills de geoai-skills | No se pidieron. Las dos instaladas remiten a algunas de ellas: esas referencias quedan sin destino | — |

## Instalar los marketplaces oficiales (en una máquina local, no en esta sesión)

En Claude Code, dentro del repo:
```
/plugin marketplace add anthropics/skills
/plugin install example-skills@anthropic-agent-skills
```
- Los nombres `anthropic-agent-skills` (marketplace) y `example-skills` (plugin) se verificaron en `.claude-plugin/marketplace.json` de anthropics/skills, commit `1780c5e`.
- Ese plugin trae, entre otras, `webapp-testing` y `frontend-design`, que ya están copiadas aquí. Si se instala, quedan duplicadas: use las del proyecto, cuyo commit está fijado.

## Licencias
- Apache-2.0: `webapp-testing/LICENSE.txt` y `frontend-design/LICENSE.txt`, tal como vienen en anthropics/skills.
- MIT: archivo `LICENSE` del repo de origen, agregado en cada carpeta de obra/superpowers y de muend/geoai-skills.
- Los agentes copiados y su licencia se documentan en `.claude/agents/README.md`.
