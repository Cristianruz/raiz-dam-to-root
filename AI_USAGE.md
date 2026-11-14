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
