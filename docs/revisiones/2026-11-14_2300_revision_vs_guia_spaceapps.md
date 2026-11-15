<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Revisión contra el sitio oficial de Space Apps 2026 · 14-nov-2026, 23:00

**Qué se revisó.** La rama de integración `claude/keen-mayer-sp0vvm` (commit `09bdafd`) y `main` (`e819b52`), contra la investigación del sitio oficial (Participant FAQs, Project Submission Guide, Judging & Awards Guide, Participant Terms & Conditions 2026 y la página del reto Field Shift). Revisor de solo lectura: no se modificó código.

**Resultado de las pruebas automáticas en `09bdafd`:** `python -m pytest -q` → 1070 aprobadas, 5 omitidas, 0 fallidas.

**Límite de esta revisión.** No se pudo abrir la página publicada (https://cristianruz.github.io/raiz-dam-to-root/) desde esta sesión; la comprobación en incógnito queda pendiente para una persona. La pestaña «Resources» del reto y el texto exacto del formulario 2026 bloquean la lectura automática: confirmarlos a mano.

## Críticos (pueden costar la elegibilidad o la primera impresión del jurado)

| # | Hallazgo | Evidencia | Acción | Dueño |
|---|---|---|---|---|
| C1 | `main` está desactualizado respecto de la rama de integración. Su `README.md` dice «Public link. Not yet» y que la vista 3D, la línea de tiempo y el contexto regional «are being built; the page does not have them yet». GitHub Pages publica `main` y el formulario enlaza el repositorio, cuya rama por defecto es `main`. | `git show main:README.md`, líneas 13 y 34 | Abrir el PR de `claude/keen-mayer-sp0vvm` a `main` y fusionarlo antes del congelamiento (10:00–11:30). Después, comprobar en incógnito que la página muestra «3D twin view» y «Regional context». | Cristian |
| C2 | Declaración de SI: el marcador «[CONFIRMAR CRISTIAN: la idea del plazo del agua la definió el equipo]». La guía 2026 indica que la SI no debe usarse para concebir la idea. El registro del proyecto muestra que el planteamiento definitivo (S9) se redactó con Claude a petición del equipo el 10-nov. No conviene afirmar algo que el propio `AI_USAGE.md` contradice. | `docs/pitch/textos_envio.md` §9; `AI_USAGE.md`, primera fila | Sustituir el marcador por una frase verificable, por ejemplo: «The problem, the district, the data and the goal of showing each crop as a multi-year water commitment came from the team's research and the challenge; Claude helped us structure and write the concept, and the team chose and owns every design decision.» Cristian decide la redacción final; no borrar la fila de `AI_USAGE.md`. | Cristian |
| C3 | Demo y diapositivas sin liga. Si el video pasa de 30 s, el proyecto queda fuera del juzgado global. | `docs/pitch/textos_envio.md` §2; guion de 29.0 s en `docs/pitch/guion_video_30s.md` | Grabar, verificar con `ffprobe` (≤ 30.0 s; meta 28–29 s), subir a YouTube (público o no listado) y probar en incógnito. Respaldo: PDF de 7 diapositivas. | P6 / pitch |
| C4 | Guardar después del corte invalida el proyecto. | Project Submission Guide 2026 | Una sola persona edita el formulario; después de pulsar «Submit for Judging» (meta 13:30, límite local 14:30) nadie vuelve a guardar. | Equipo |

## Importantes

| # | Hallazgo | Acción |
|---|---|---|
| I1 | La liga del reto en el README y en «References» es `/2026/challenges/adapting-farms-with-nasa-data/`; la investigación la encontró como `/2026/challenges/field-shift-adapting-farms-with-nasa-data/`. | Abrir ambas en el navegador y dejar la que cargue. |
| I2 | GAEZ v4 tiene licencia CC BY-NC-SA, que no es abierta en el sentido de los Términos 2026 (materiales de terceros libres u OSI). | Mantenerlo solo como contexto de zona, con la licencia escrita (ya está), o retirarlo de la página si el Local Lead lo objeta. No es bloqueante. |
| I3 | El reto pide comparar al menos tres estrategias, una de ellas la actual. Se cumple (actual + dos alternativas), salvo el nogal, que se documenta como excepción. | En la exposición, decir explícitamente «three strategies, including the current one» y mostrar una ficha de alfalfa (tiene tres alternativas). |
| I4 | El campo «Space Agency Partner Data» solo lista Sentinel-2 vía HLS. Es correcto; la AEM no es socia 2026 y no aparece. | Sin cambio. |
| I5 | El guion del video conserva marcas «[SI ESTÁ CONECTADO]» y «[ALTERNATIVA]», aunque todas las piezas ya están en la página. | Grabar la versión conectada; ignorar las alternativas. |
| I6 | Suelo: los avisos de hierro, zinc y otros nutrientes se presentan como hallazgo del distrito (Gutiérrez González et al., 2022) y «needs a soil test»; SoilGrids se declara como modelo. Cumple con no presentar el hierro como dato medido. Con pH ≈ 8.1, el cereal de invierno sale «outside range» aunque se siembra en la zona. | Tener lista la respuesta: los rangos de ECOCROP son mundiales, no ensayos del DR-005, y la tool no descarta opciones por ellos (ya está en `suelo.json` → `requisitos.nota`). |

## Lo que ya cumple (no tocar)

- Interfaz y página en inglés (`lang="en"`); WhatsApp en español como pide la regla 9.
- Licencia Apache-2.0 en el repositorio; `DATA_LICENSE.md` con la licencia de cada fuente.
- Ningún «first» ni «only» en la interfaz; filtro de palabras en `web/js/mensaje.js`.
- La página ya dice «criterion declared before the analysis» en lugar de «preregistered» (`motor/pruebas_web.py`, línea 411).
- NASA Data con producto, versión, resolución, periodo, acceso y uso; OpenET declarado como sin cobertura en México.
- Vocabulario del reto en la descripción: rotation comparison, bare-field periods, vulnerable seasons, uncertainty, plain-language glossary, common analysis grid, limitations.
- Incertidumbre P10–P50–P90, abstención del mapa (63 %) y aviso fijo de apoyo al juicio del agricultor.

## Orden sugerido hasta el envío

1. C1 (fusionar a `main`) antes de las 10:00.
2. C3 (video) entre las 10:00 y las 11:30.
3. C2 e I1 al llenar el formulario (11:30–13:30).
4. C4 al pulsar «Submit for Judging».
