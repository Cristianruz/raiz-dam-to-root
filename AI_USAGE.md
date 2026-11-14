*AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026*

# Registro de uso de IA (AI_USAGE)

Una línea por tarea (CLAUDE.md, regla 11; kit v4 §0.1, regla 9). Cristian exporta aquí la hoja compartida «AI_USAGE» del equipo. La declaración pública, en inglés, está en `README.md` → «SI/AI tools used».

| fecha | persona | herramienta | tarea | archivos |
|---|---|---|---|---|
| 2026-11-10 a 2026-11-13 | Cristian | Claude (chat del proyecto «Space Apps») | Documentación previa al evento, sin código: proyecto definitivo, enfoque, kit v4, plan del evento y anteproyecto; revisada por el equipo | `docs/sintesis/S8_enfoque_definitivo.md`, `docs/sintesis/S9_proyecto_definitivo.md`, `docs/sintesis/S10_plan_sapo.md`, `docs/kit/40_kit_v4_proyecto_definitivo.md`, `entregables/*.docx` |
| 2026-11-14 | Cristian | Claude Code | K-INT base: CLAUDE.md, parámetros, contrato simulado v4, validador, reglas del deslizador (§2.4) y bibliotecas copiadas de npm con sha384 | `CLAUDE.md`, `.gitignore`, `package.json`, `data/params.json`, `data/simulados.json`, `motor/simulados.py`, `validar_contrato.py`, `web/reglas.js`, `web/vendor/**`, `web/data/parcelas.geojson`, `web/data/cubo.json`, `web/data/explicaciones.json` |
| 2026-11-14 | Cristian | Claude Code | Zona piloto: rectángulo acordado con la sesión de datos; simulados centrados en él | `data/params.json`, `data/simulados.json`, `motor/simulados.py`, `web/data/cubo.json`, `web/data/parcelas.geojson` |
| 2026-11-14 | Cristian | Claude Code (revisor de solo lectura, contexto nuevo) | Revisión de la rama `datos-satelite` (9:15) | `docs/revisiones/2026-11-14_0915_datos-satelite.md` |
| 2026-11-14 | Cristian | Claude Code (flujo multiagente: implementador de la pieza «infra») | Comando único, manifest generado, pruebas automáticas (K-TEST 2, 3, 4, 7 inicial y 8), flujo de GitHub Actions con publicación condicionada, Dependabot y documentos raíz | `construir.py`, `requirements.txt`, `motor/manifest.py`, `tests/test_contrato.py`, `tests/test_unidades.py`, `tests/test_escala.py`, `tests/casos/escala_s9.json`, `tests/test_sin_cifras.py`, `tests/excepciones_cifras.json`, `tests/reglas.test.js`, `tests/versiones.test.js`, `.github/workflows/publicar.yml`, `.github/dependabot.yml`, `README.md`, `AI_USAGE.md`, `LIMITATIONS.md` |
| 2026-11-14 | Cristian | Claude Code (flujo multiagente: pieza «ensamblador», K-ENS) | Ensamblador del buzón [en curso: lo completa su pieza] | `motor/ensamblar.py` |
| 2026-11-14 | Cristian | Claude Code (flujo multiagente: pieza «web», C1 y C2) | Centro de control y ficha de parcela con datos simulados [en curso: lo completa su pieza] | `web/index.html`, `web/app.js`, `web/style.css` |
| 2026-11-14 | Cristian | Claude Code (integrador) | Base K-INT: CLAUDE.md, params.json, contrato simulado, validar_contrato.py, reglas §2.4, librerías locales con hash | `CLAUDE.md`, `data/params.json`, `data/simulados.json`, `motor/simulados.py`, `validar_contrato.py`, `web/reglas.js`, `web/vendor/` |
| 2026-11-14 | Cristian | Claude Code (integrador + agentes revisores) | Revisión y re-revisión de la rama datos-satelite; reproducción byte a byte de B1, A1 y A5 | `docs/revisiones/` |
| 2026-11-14 | Cristian | Claude Code (integrador) | Motor B4 + La gota (X3.1) con datos reales; contrato extendido («1/1», abstenidas sin opciones, goteo null); manifest agrupado | `motor/b4_cubo.py`, `data/opciones_b4.json`, `validar_contrato.py`, `motor/manifest.py`, `construir.py` |
| 2026-11-14 | Cristian | Claude Code (agente) | Esquemas del buzón para los formatos de la sesión de datos; crudos de Earth Engine aparte | `motor/esquemas.py`, `motor/ensamblar.py`, `tests/test_ensamblar.py`, `tests/fixtures/` |
| 2026-11-14 | Cristian | Claude Code (agente) | Web con datos reales: goteo no disponible, encuadre del mapa, ficha de abstenidas, lista con buscador, prueba de humo independiente de los datos | `web/app.js`, `web/style.css`, `web/index.html`, `tests/e2e/web_smoke.mjs` |
| 2026-11-14 | Cristian | Claude Code (agente) | Guía del equipo actualizada al estado real | `docs/equipo/` |
| 2026-11-14 | Sesión de datos | Claude (navegador, Chrome de Cristian) | Earth Engine (HLS, memoria, NASADEM), FTW, NASA POWER, A1, A3, A4 reglas, A5, A9 | rama `datos-satelite`, Drive `Raiz_entregas` |
| 2026-11-14 | Cristian | Claude Code (integrador) | Decisión de dos zonas, localidades del equipo en params, referencias del reto y de la SDR | `docs/decisiones/2026-11-14_dos_zonas.md`, `data/params.json`, `docs/referencias/` |
| 2026-11-14 | Cristian | Claude Code (flujo multiagente: implementador + revisor + corrección por pieza) | Dos zonas en buzón, motor B4, contrato y web (selector de zona, localidades) | `motor/esquemas.py`, `motor/ensamblar.py`, `motor/b4_cubo.py`, `validar_contrato.py`, `web/app.js`, `tests/test_b4.py`, `tests/fixtures/` |
| 2026-11-14 | Cristian | Claude Code (integrador) | Relieve para la web y verificador conectados al comando único; docs/pruebas.md generado | `motor/relieve_web.py`, `construir.py`, `docs/pruebas.md` |
| 2026-11-14 | Cristian | Claude Code (agente) | Verificador de cifras con set dorado de 30 casos (5 trampas) | `motor/verificador.py`, `tests/casos/set_dorado.json`, `tests/test_verificador.py`, `docs/figuras/llm_eval.csv` |
| 2026-11-14 | Cristian | Claude Code (agente redactor + agente revisor-cifras) | Página del proyecto en inglés y limitaciones | `README.md`, `LIMITATIONS.md` |
| 2026-11-14 | P2–P6 | Gemini en Colab / Claude en el navegador | [PENDING: cada integrante agrega aquí sus líneas al entregar] | `Raiz_entregas/` |
