<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Qué falta y quién lo hace · corte del domingo 15-nov-2026

**Origen:** el inventario del sábado 14-nov a las 15:50 (contra S9, S10 y el kit v4), puesto al día con el estado de la integración `d5de13f`, con la revisión total de `dda5abb` y con la revisión contra la guía de Space Apps (`docs/revisiones/2026-11-14_2300_revision_vs_guia_spaceapps.md`). Los números de cada renglón (H…, I…, D…) son los del sábado: otros documentos los citan.

**Cómo se actualiza:** cada sesión marca aquí lo suyo al terminar. La sesión de datos escribe además en `datos/PARA_INTEGRADOR.md` de su rama.

## Lo que falta de verdad
| # | Qué | Quién |
|---|---|---|
| I4 / H7 | Video: hay un borrador (`docs/pitch/video_30s.mp4`, 30 s o menos, con `docs/pitch/video_30s.srt`). Falta volver a grabarlo sobre la página final (`node tests/e2e/grabar_video.mjs`), subirlo y probar su liga en incógnito | Responsable de video (P6) |
| H7 | Diapositivas: hay un borrador (`docs/pitch/diapositivas.pdf`, de `docs/pitch/diapositivas.html`). Faltan los nombres de los integrantes en la portada y su liga pública. Formulario de envío en inglés (`docs/pitch/textos_envio.md`, con la lista «Antes de pegar (Cristian)») con la captura de la confirmación, y ensayo de la exposición | Equipo; Cristian |
| H7 | Descripción del repositorio en GitHub, con la declaración de uso de IA que pide el kit Q2 | Cristian |
| H7 | Bloque «Use of Super Intelligence (SI)»: una frase de Cristian, con sus palabras, sobre cómo surgió la idea (hallazgo C2 de la revisión contra la guía; `docs/pitch/textos_envio.md`, «Antes de pegar (Cristian)», punto 6) | Cristian |
| D8 | Cita de software que pide AppEEARS: el repo registra la versión (3.137) y las solicitudes, no el texto de la cita (`DATA_LICENSE.md`, «Open items») | Sesión de datos o Cristian |
| H3 | Liga del preregistro en OSF con su fecha. Si no existe, los textos dicen «declared before the analysis» con la fecha y el commit de cada criterio (`README.md`, «Status»), y la página titula H1 y H3 «criterion declared before the analysis» (`web/data/pruebas.json`) | Cristian |
| I7 | `cifras.csv` generado de `manifest.json`, `params.json`, S9 y S8, para la revisión de cifras de las 12:30 | Integrador |
| — | Las líneas de cada integrante en `AI_USAGE.md` | Cada integrante |
| D3 | Revisión humana, en color verdadero, de las tres protagonistas (P0757, P0632 y L0175). Una sesión de IA ya las comparó con Sentinel-2 (`docs/revision_protagonistas.md`); falta que una persona lo confirme | Una persona del equipo |
| H5 / D7 | Etiquetas a ciegas unidas (`etiquetas_unidas.csv`) y, con ellas, Random Forest, F1 y Olofsson. Mientras no lleguen, la prueba 1 dice «not run» | Etiquetas: equipo; análisis: sesión de datos |
| D4 | `dotaciones.json` con las tres marcas, su fuente y la fecha de lectura de cada nota | Sesión de datos |
| D6 | Nogal: vida de la huerta con fuente del INIFAP y, si hay fuente, un escenario de riego mínimo (`docs/decisiones/2026-11-15_nogal_sin_alternativas.md`) | Sesión de datos |
| H2 | Respuestas de las mentorías por escrito: eficiencia de riego por gravedad, punto de medición del millar | Cristian |

## Hecho desde el corte del sábado
- **H1 / I10 / C1.** Repositorio público, GitHub Pages activo (origen GitHub Actions) y PR #4 fusionado a `main`: https://cristianruz.github.io/raiz-dam-to-root/.
- **H4 / I9.** Tabla oficial de rotaciones y filtros (`data/processed/opciones_b3.json`, maestro §5.2). La helada se muestra como probabilidad junto a la fecha de siembra y no descarta opciones (`docs/decisiones/2026-11-14_opciones_b3.md` §1).
- **I1.** Gemelo digital en la página: vista 3D, línea de tiempo, tarjeta «Twin status», app instalable y contexto regional.
- **I2 / D1.** Bases de datos del reto: contexto regional, GEDI y la tabla de recursos, en la página.
- **D2.** `supuestos.json` con la eficiencia indicativa del goteo y su fuente (FAO); el escenario de goteo está en «Follow the drop».
- **D5 / I8.** Prueba de FAO-56 en el comando único (`tests/test_fao56_manual.py`, ejemplos 8 y 18 del manual).
- **H6 / D8.** ECOSTRESS (`ecostress_parcelas.csv`) y GAEZ (`gaez_zona.csv`), entregados con el buzón v10 y en la página.
- **D3, parte de datos.** Protagonista «libre» cambiada de P0244 a P0632.
- **I3, I5, I6.** README, LIMITATIONS, DATA_LICENSE, guion, preguntas difíciles, diapositivas y textos de envío al día con la página del 15-nov.
- **I24.** Prioridades del productor en la ficha: «What matters most to you?» resalta las opciones según la prioridad elegida y no las ordena (`web/js/prioridades.js`).
- **Traducciones.** Los documentos que la página enlaza están en inglés en `docs/en/`.
- **Suelo.** El tipo de suelo de la parcela y las notas de nutrientes ya se muestran en la ficha (`motor/suelo_web.py`, `web/js/suelo.js`).
- **Rama `datos-satelite` fusionada.** Los scripts que rehacen las entregas (`datos/colab/correr_todo.py`), los crudos nuevos de `data/raw/reto/` y `docs/ecostress.md`, `docs/reproducir_datos.md`, `docs/suelo_tipos_y_nutrientes.md` y `docs/suelo_textos_ficha.md` están en la integración. Los rásteres por zona siguen en la rama `ee-crudos`.
- **Motor.** Las correcciones de la revisión (`docs/decisiones/2026-11-15_correcciones_motor.md`): 1,267 opciones (813 de la tabla oficial y 454 propuestas del equipo), contadas en `web/data/cubo.json`.

## Lo que no se hace antes del congelamiento
- Historial de superficie, memoria desde 2013 y calibración: el kit los da como «solo si sobra tiempo».
- WaPOR v3 y LiDAR del INEGI: se declaran «not run» o «no coverage».
- Explicaciones con un modelo de lenguaje: las plantillas declaradas cumplen el kit.
- Renglón Dinero: sin fuente se queda en «No verified data»; no se inventa.
