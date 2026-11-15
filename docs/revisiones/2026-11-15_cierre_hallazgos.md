<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->

# Cierre de hallazgos de las revisiones del 14 y 15 de noviembre · 15-nov-2026, 00:35 (hora de Chihuahua)

## Resumen

1. Se cerraron 146 renglones de cinco listas: **73 resueltos, 31 parciales, 25 abiertos, 11 de persona y 6 para después del evento**. Varios renglones son el mismo hallazgo en dos listas; cada uno se comprobó una vez y lleva su alias.
2. «Resuelto» quiere decir resuelto en la rama de integración. **La página pública es `main` (`e819b52`) y no trae nada de esto** hasta que Cristian fusione el PR #5, que sigue abierto.
3. Lo que más pesa para el envío: fusionar el PR #5; volver a grabar el video, que muestra la página anterior; quitar los marcadores de las diapositivas; y, en la página, el «Why?» que todavía escribe «enough for 8 hectares» en una parcela de 7.95 ha.
4. El código no cambió durante la revisión: de `2346788` a `f0dbf3b` solo cambiaron textos, datos de texto y la reconstrucción.

## Qué se comprobó y cómo

- **Solo lectura.** No se modificó el repositorio, no se corrió `python construir.py` y no se corrieron las pruebas e2e.
- **Commit de cierre: `f0dbf3b`** de `claude/keen-mayer-sp0vvm`. El encargo empezó sobre `2346788`; la rama avanzó a `7f594e9`, `45c411a`, `64aff74` y `f0dbf3b` mientras se revisaba. `git diff --stat 2346788 f0dbf3b` sobre `web/` (sin `web/data/`), `motor/`, `tests/` (sin capturas ni fixtures), `construir.py`, `validar_contrato.py`, `.github/` y `data/params.json` no da ningún cambio. Los números de línea del código valen para los dos commits.
- **Página.** Una copia fija de `web/` de `45c411a` (`git archive`), servida en local y leída con Playwright con scripts propios. Se leyó el texto visible y el plegado de las fichas de P0757, P0632 y L0175 en 1366×860, 1440×900 y 390×844, «About & Data», «Regional context», el mensaje de WhatsApp en sus cuatro idiomas, el escenario de goteo, la capa de relieve, el botón Atrás y la hoja impresa en PDF. De `45c411a` a `f0dbf3b`, `web/` cambia en la fecha de reconstrucción y en el renglón de ECOSTRESS de la tabla de recursos.
- **Datos.** `web/data/*.json` de `f0dbf3b`, leídos con scripts. `validar_contrato.py` sobre la copia fija: «CONTRATO OK»; además, cinco alteraciones en memoria para ver que las rechaza.
- **Textos.** `git show` y `git grep` sobre `f0dbf3b`.
- **GitHub.** `gh api` a las 06:23 UTC: PR #5 `open`, `merged` false; repositorio con `description` null, `has_pages` true y `private` false; `main` en `e819b52`.
- **Límite.** Lo que solo demuestra una corrida de `web_smoke` va dicho como «no comprobado aquí». Los scripts y las capturas de esta revisión están en el scratchpad de la sesión y son temporales.

## Conteo por estado

| Lista | Renglones | Resuelto | Parcial | Abierto | De persona | Después del evento |
|---|---|---|---|---|---|---|
| 1. Revisión total de `dda5abb` | 50 | 18 | 16 | 9 | 4 | 3 |
| 2. Revisión contra la guía de Space Apps | 12 | 6 | 1 | 1 | 4 | 0 |
| 3. UX de la web | 12 | 5 | 6 | 1 | 0 | 0 |
| 4. `datos/PARA_INTEGRADOR.md` | 30 | 18 | 2 | 9 | 0 | 1 |
| 5. Auditoría de cinco revisores sobre `dd03843` | 42 | 26 | 6 | 5 | 3 | 2 |
| Total | 146 | 73 | 31 | 25 | 11 | 6 |

## Lista 1 · Revisión total de `dda5abb` (C1–C3, I1–I25, M1–M22)

| ID | Hallazgo | Estado | Evidencia en `f0dbf3b` |
|---|---|---|---|
| C2 | Hectáreas mayores que la superficie («8 of 7.95») | Parcial | Tarjeta, rango, frase y WhatsApp con el formato del área: `web/app.js:2486-2499`, `web/js/resumen.js:240`, `web/js/mensaje.js:495-501`. Página: «Enough for 0.97 of 7.95 hectares (range 0.79 to 1.2)» y «Enough for the whole field (7.95 ha)». Caso en `tests/e2e/web_smoke.mjs:1645`. **Falta:** el «Why?» de cada tarjeta escribe las hectáreas con `fmt` (`web/app.js:2654`): en P0757, «enough for 8 hectares» en una parcela de 7.95 ha y «enough for 1 hectares»; en P0632, «enough for 20.7 hectares» en 20.66 ha. El caso de `web_smoke` no lee ese texto. Alias: UX 7; PARA_INTEGRADOR 21:45-3, 22:20-8 y 22:20-9 |
| C3 | El guion lee cifras que la página ya no muestra | Resuelto | `docs/pitch/guion_exposicion.md:58-62`: «0.97 of 7.95», «1.46 of 7.95», «9.24 of 20.66 (range 7.65 to 11.4)» y, en 1:37, «Una huerta no rota…». Son las cifras leídas en la página. «[MIENTRAS SIGA P0244]»: 0 coincidencias |
| I2 | Texto del formulario con «WHAT RAÍZ DOES» y afirmaciones viejas | Resuelto | `docs/pitch/textos_envio.md:84` «WHAT ROOT DOES»; `:92` «at least three rotation strategies, including the current rotation» con la excepción del nogal. «not run» queda en Random Forest, texto de un LLM y WaPOR |
| I3 | Franja fija con notas internas en español | Parcial | Los dos plegables cerrados por omisión (`web/app.js:786-787`, `:875-876`; medido en 1366×860: los dos cerrados, franja de 197 px). **Falta:** al abrirlos se lee «nota no leída directamente (S8 §2)», «[P], to be confirmed», «(kit B4)» y «To be confirmed … at the mentoring session» (`web/data/cubo.json` → `dotaciones`; `data/params.json` no trae `fuente_en`). La nota del punto de medición la da Cristian. Alias: UX 4 |
| I4 | «at least 125%» junto a un rango que empieza en 101 % | Resuelto | `web/app.js:959`, `:979-980`. Página: «Likely range for the classified area: 101% to 155%; unclassified fields can raise it, not lower it» y «202 of 357 classified fields» |
| I5 | Citas en español con códigos internos | Parcial | Fuentes de las entregas en inglés (`idioma_fuentes` = "en" en `contexto.json` y `suelo.json`; buzón v11 y v12) y citas del cubo plegadas en «Source» (`web/app.js:828-833`). **Falta, a la vista:** «Source: NASADEM (…), 30 m, vía Google Earth Engine» en la leyenda del relieve de la portada; «(A9, NASADEM vía Earth Engine)» en la leyenda de «Terrain & runoff» (`motor/relieve_web.py:76`); «Return-flow coefficient: Conagua 2024, acuífero 0831 (DR_0831): 122.8 de 614 hm³/año» en «Follow the drop». **Falta, plegado:** fuentes de la presa y de las marcas (`data/params.json`). El integrador lo tiene en curso (`docs/coordinacion.md`). Alias: PARA_INTEGRADOR 22:20-12; auditoría, cifras 12 |
| I6 | La página parece bitácora | Parcial | ECOSTRESS ya trae dato y su nota de proceso no va a la ficha (`web/app.js:2173-2175`); «Other sources in the build» muestra el producto corto. **Falta en «About & Data»:** «Pending: every field reports a single method in acuerdo_metodos.», «… are not in the repo yet.» (`motor/pruebas_web.py:340`) y «The review by a person of the team who knows the area is still pending.» (`:76`; la cierra una persona del equipo) |
| I7 | Ficha de varias pantallas | Abierto | Medido: la ficha de P0757 mide 5,339 px en 1366×860 y 9,581 px en 390×844 (la revisión midió 5,010 y 8,699). Los avisos de filtro siguen a la vista en cada tarjeta, «Salt tolerance differs by crop…» sale 3 veces, y «Crop calendar» y «Soil and satellite evidence» no se pliegan. Solo se plegaron las citas. Alias: UX 2 |
| I8 | Decimales distintos en la misma unidad | Parcial | Tarjetas con un decimal (28.4, 25.5, 18.9), NDVI con dos, presa «825.6 hm³» y «2,846.8 hm³», lluvia del año «364 mm» y «235 mm». **Falta:** el «Why?» y el WhatsApp escriben 25.49 y 18.94; la gráfica de lluvia rotula «GPM IMERG 364 mm» y «NASA POWER 234.8 mm»; el rango «0.79 to 1.2». Alias: UX 7 |
| I9 | Etiquetas [V] [P] [S] sin leyenda y códigos internos | Parcial | Leyenda en el glosario y `title` en cada etiqueta (`web/app.js:1954-1959`); «methods agree» se oculta con un solo método (`:2201-2203`); «example field». **Falta:** «(A11)», «(A13)», «kit v4, A3-M step 3», «(kit B4)» y la letra «E» antes de «Water term». Alias: UX 3 |
| I10 | «Why it's suggested» y «Benefits» no dicen por qué ni qué beneficio | Abierto | `motor/b4_cubo.py:1299-1301`: «Why it's suggested» repite las cifras de agua y «Benefits» es la misma frase en todas las opciones. `por_que_en` está en `cubo.json` → `opciones_catalogo`, y la página lo usa en el nogal (`b4_cubo.py:1123`) y en ninguna otra opción |
| I12 | Plazo restante en las opciones que conservan el alfalfar | Resuelto | `cubo.json` → `parcelas.P0757`: `alfalfa_corte_verano` con `plazo_restante` 0–1 y compromiso 0–25.49. Tarjeta: «Remaining term: 0–1 years» (`web/app.js:2552-2556`). Prueba: `tests/test_b4.py:787`. Alias: auditoría H1 |
| I13 | `avena_maiz` con la secuencia oficial y el agua de A5; opción ofrecida a cereal | Resuelto | `cubo.json`: secuencia `cereal_invierno`, `maiz_forrajero`, y `agua.nota_plazo` con la secuencia oficial. En las 16 parcelas de cereal la opción es `team_proposal` y se llama «Oats (winter) + forage maize (summer)». Alias: auditoría H2 |
| I15 | «Follow the drop» dibuja la necesidad como si saliera de la presa | Parcial | Nota nueva: «The allocation covers part of this need; the rest comes from wells or stays unmet.» (`web/app.js:2732-2739`). **Falta:** el nodo sigue «La Boquilla (dam)» (`web/js/gota.js:108`; P0757: 376,300 m³) y la nota no dice cuánto cubre la dotación |
| I16 | Teselas z12 rellenadas con el borde | Resuelto | `motor/dem_teselas.py:261-287`: fuera del ráster, rampa hacia la mediana del borde. `web/data/dem/` cambió en `32aa58c`. No se revisó la vista 3D a ojo |
| I17 | «receives runoff from up to X ha» | Resuelto | `web/js/relieve.js:630`. P0757: «at least 299 ha drain into this field (largest single inflow; nothing outside the mapped area is counted)» |
| I18 | «mean slope» dentro del ruido del DEM | Parcial | «fitted slope 2% (from the elevation model; small fields are within its noise)» (`relieve.js:626`). **Falta** el umbral por parcela: los datos no traen el error ni las celdas (`relieve.js:605-607`). Pide cambiar A9: después del evento |
| I19 | «% of the field in terrain depressions» | Resuelto | Plegado y dicho como «closed pits in the elevation model, mostly within its noise» (`relieve.js:636-641`) |
| I20 | Rutas que salen de planos y hoyos rellenados | Resuelto | Texto en la leyenda (`relieve.js:526-527`). El cambio de método queda para después del evento |
| I21 | README contradice la página | Resuelto | `README.md:35`, `:127-143` (todo «In use»), `:169`, `:189`; sin P0244. Ver la nota de `README.md:11` en C1 |
| I23 | Respuestas preparadas falsas | Resuelto | `docs/pitch/preguntas_dificiles.md:32` (1,267 opciones; 813 y 454; 809 con filtros), `:36` (3 bis), `:42` (3 ter), `:151-165` («En uso»), `:231` |
| M1 | La ficha tapa el mapa en escritorio | Abierto | No hay código que oculte `#indicador` ni que centre la parcela. Medido en 1366×860: ficha de x = 343 a 1,354 sobre un mapa de 0 a 986, con el indicador visible |
| M2 | Teléfono: mapa a la vista y lema | Parcial | Con la ficha abierta la franja mide 78 px. **Falta:** en la portada a 390×844 el mapa empieza en y = 813 y el lema no se muestra (`web/style.css:780`). Alias: UX 6 |
| M3 | «Soil favorable ✓» junto a «No published range»; meses de reposo como «bare soil» | Parcial | El semáforo dice «Soil · cover: favorable» (`web/app.js:2320`) y la aptitud, «○ No published range». **Falta:** los meses de reposo del nogal siguen como «bare soil» (`web/app.js:2350`, `:2358`). Alias: PARA_INTEGRADOR 22:20-7 |
| M4 | «CURRENT ROTATION» encima de «Current rotation: Alfalfa» | Abierto | `web/app.js:2287` y el nombre de la opción; sigue en las tres fichas |
| M5 | Caja punteada del año destacado | Abierto | `web/css/tiempo.css:227-233`, igual que en `dda5abb` |
| M6 | Pie con rutas de archivo y fecha ISO | Abierto | `web/app.js:1962-1971`: 38 rutas y «generated 2026-11-15T…+00:00» |
| M7 | Píldoras «in the build cache» | Parcial | Usos en inglés y sin «Input of kit piece». **Falta:** «in the build cache» sale 39 veces |
| M8 | Letra de menos de 12 px y 22 tamaños | Parcial | Escala `--fs-1` a `--fs-6` con mínimo de 12 px (`web/style.css:48-53`). Medido: 11 tamaños en escritorio y 12 en teléfono; la barra de escala del mapa va a 10 px |
| M9 | «Simulate a storm» no usa la lámina | Abierto | `web/js/relieve.js:596-598`: la tarjeta no dice que las rutas no cambian con la lámina |
| M10 | NASA POWER contado dos veces | Parcial | El README ya no da otro conteo. **Falta:** `data/recursos_reto.json` conserva `power` y `power_heladas`, y la página dice «17 entries … 15 in use» |
| M11 | Variantes viejas en diapositivas y guiones | Parcial | Cifras de P0632 al día (`docs/pitch/guion_video_30s.md:58`) y sin P0244. **Falta:** siguen las ramas «[SI ESTÁ CONECTADO]» y «[ALTERNATIVA]»: 9 y 8 en `guion_exposicion.md`, 4 y 4 en `guion_video_30s.md`, 5 y 3 en `diapositivas.md`. Alias: guía I5 |
| M12 | LIMITATIONS contradice la página | Resuelto | `LIMITATIONS.md:39-46`: 1,267 opciones; 813 y 454; 809 con filtros; 1,770 resultados; 1,667 y 103. Iguales a `cubo.json` |
| M13 | DATA_LICENSE con «not on the page yet» | Resuelto | `DATA_LICENSE.md:19-20`, `:48`, `:60-69`. Las citas que faltan están numeradas en «Open items» (`:122-132`) |
| M14 | No existe `cifras.csv` | Abierto | `git ls-files` no lo trae; `docs/reparto_faltantes.md:17` lo deja al integrador. La revisión de cifras de las 12:30 se hace contra él (kit Q2) |
| M15 | Reparto de faltantes en el corte del sábado | Resuelto | `docs/reparto_faltantes.md`: «Lo que falta de verdad» y «Hecho desde el corte del sábado» |
| M20 | Comentario de `sw.js` | Abierto | `web/sw.js:18` sigue «Así nunca se sirve una versión vieja habiendo red», y el código entrega la copia guardada si la red tarda (`:300-306`). Servir una sola versión: después del evento |
| M21 | Acciones de CI por etiqueta | Después del evento | `.github/workflows/publicar.yml:21-82` sin cambio: `@v4`, `@v5`, `@v3`, `@v1.1.0` y `needs: pruebas`. Alias: auditoría, seguridad 10 |
| M22 | Sin Content-Security-Policy | Después del evento | `web/index.html` no trae `meta` de CSP. Alias: auditoría, seguridad 8 |
| I14 | Frase del sorgo en una tarjeta de alfalfa | Resuelto | `cubo.json` → `filtros_catalogo.fecha_siembra.texto_en` = «Planting must fall inside the window reported for the crop.»; `texto_por_opcion_en.cereal_sorgo` va aparte; 0 opciones sin sorgo llevan esa frase. Alias: PARA_INTEGRADOR 22:20-3 |
| M19 | NASADEM exportado a 0.9702″ | Después del evento | `datos/PARA_INTEGRADOR.md`, nota de las 22:27: pide Earth Engine |
| C1 | GitHub Pages apagado y `main` atrás | De persona | Pages activo y repositorio público (`gh api`); PR #4 fusionado (`e819b52`). **Falta que Cristian fusione el PR #5** (`open`, `merged` false). `main` va 189 commits atrás de `f0dbf3b`; la página publicada trae 3 «preregistered» en `pruebas.json`, los plegables abiertos (`web/app.js:714` y `:780` de `main`) y 1,282 opciones. `README.md:11` dice que el PR #4 trae «the version described here»; lo descrito está en el PR #5. Alias: guía C1 |
| I1 | Video, PDF, ligas y descripción del repositorio | De persona | Video: `docs/pitch/video_30s.mp4`, 29.0 s (`ffprobe`), grabado antes de las correcciones; sus cuadros muestran «story field», «(S8 §2)», «1 of 7.95 hectares» y «at least 108%». Falta regrabarlo y subirlo (P6). PDF: 7 páginas, con «Members [INTEGRANTES]» y «Video: [link pending]». `docs/pitch/textos_envio.md:50-51`: dos «[LINK: pendiente…]». Descripción del repositorio: vacía (`description` null; Cristian). Alias: guía C3; auditoría, cifras 1 y seguridad 3 |
| I11 | Nogal con una sola opción | Resuelto | Excepción declarada: `docs/decisiones/2026-11-15_nogal_sin_alternativas.md`, `LIMITATIONS.md:41` y la pregunta 3 bis; el guion ya no usa L0175 para comparar opciones. La decisión la escribió el integrador: Cristian puede revertirla. El escenario de riego mínimo es de la sesión de datos (D6) |
| I24 | Prioridades del agricultor | Resuelto | `web/js/prioridades.js`: «What matters most to you?» resalta y no ordena. `LIMITATIONS.md:46` y la pregunta 3 ter. Alias: guía I8 |
| I22 | «preregistered» sin liga pública | Resuelto | `web/data/pruebas.json` titula «criterion declared before the analysis» (0 «preregistered»); `README.md:16`; `motor/pruebas_web.py:417-431`. No hay liga de OSF en el repo: si existe, la da Cristian |
| I25 | Correo personal en dos commits | De persona | `5abfd21` y `0fcb664` siguen en `main` con un correo personal. La integrante decide; borrar el historial lo decide Cristian, después del evento. Alias: auditoría, seguridad 5 |
| M16 | AI_USAGE con líneas por llenar | De persona | `AI_USAGE.md:14-15` «[en curso…]» y `:42` «Por llenar por cada integrante» |
| M17 | Detalles personales en `docs/equipo/` | Parcial | La fila del horario de descanso ya no está (`docs/equipo/README.md`: 0 coincidencias de «descans» y «horario»). **Falta** que el equipo decida si `docs/equipo/` queda público |
| M18 | Nombre del proyecto de Earth Engine | Parcial | 0 menciones en `web/` (eran 96). Quedan 20 en 18 archivos de `datos/` y `docs/`. No es obligatorio; lo decide el equipo. Alias: auditoría, seguridad 6 |

## Lista 2 · Revisión contra la guía de Space Apps (C1–C4, I1–I8)

| ID | Hallazgo | Estado | Evidencia en `f0dbf3b` |
|---|---|---|---|
| C1 | El README de `main` contradice la página | De persona | `git show origin/main:README.md`: «Public link. Not yet», «Video. Not yet» y P0244. El README correcto está en el PR #5. Lo fusiona Cristian. Alias de la lista 1, C1 |
| C2 | Marcador «[CONFIRMAR CRISTIAN…]» en la declaración de SI | De persona | El bloque de SI ya no lleva marcadores (`docs/pitch/textos_envio.md`, sección 9). **Falta** una frase de Cristian sobre cómo surgió la idea («Antes de pegar (Cristian)», punto 6) y sus puntos 7 y 8. Alias: auditoría, cifras 2 |
| C3 | Video y diapositivas sin liga; el video no puede pasar de 30 s | De persona | 29.0 s por `ffprobe`. Sin liga pública y grabado sobre la página anterior: P6 lo regraba y lo sube. Alias de la lista 1, I1 |
| C4 | Guardar después del corte invalida el proyecto | De persona | Es del equipo, al enviar: una sola persona edita el formulario |
| I1 | Liga del reto | Resuelto | `README.md:302` y `docs/pitch/textos_envio.md:277` usan `/2026/challenges/adapting-farms-with-nasa-data/` |
| I2 | Licencia de GAEZ | Resuelto | `DATA_LICENSE.md:87`: CC BY-NC-SA. La página lo muestra como evidencia regional: «suitability of the area for a crop, not of a single field» |
| I3 | Tres estrategias, incluida la actual | Resuelto | `docs/pitch/guion_exposicion.md:194`. En `cubo.json`: alfalfa con 3 o 4 opciones, cereal y descanso con 3, y nogal con 1, declarada como excepción |
| I4 | ERA5 es recurso de socio | Resuelto | `docs/pitch/textos_envio.md:182` |
| I7 | Papel de cada cultivo en la rotación | Resuelto | `docs/pitch/textos_envio.md:119`, «Crop roles in a rotation». El glosario de la página no lleva esa línea (`web/app.js:163-172`) |
| I8 | Prioridades del agricultor | Resuelto | `docs/pitch/guion_exposicion.md:195` y `web/js/prioridades.js`. Alias de la lista 1, I24 |
| I5 | El guion del video conserva «[SI ESTÁ CONECTADO]» y «[ALTERNATIVA]» | Parcial | 4 y 4 marcas en `docs/pitch/guion_video_30s.md`; su línea 27 dice que se graba la versión conectada. **Falta** grabarla. Alias de la lista 1, M11 |
| I6 | Respuesta preparada sobre los rangos de ECOCROP | Abierto | `docs/pitch/preguntas_dificiles.md`: 0 menciones de «ECOCROP». La página sí lo dice: «General published range (FAO ECOCROP, worldwide), not a local trial» |

## Lista 3 · UX de la web (12 problemas de comprensión)

| # | Problema | Estado | Evidencia en `f0dbf3b` |
|---|---|---|---|
| 1 | El plazo no está en la frase principal | Resuelto | P0757: «… has enough water for 0.97 of 7.95 hectares. Alfalfa ties up water for 3–4 years (0–1 years left).» |
| 2 | Mucha información a la vista | Abierto | Alias de la lista 1, I7. La gota empieza en el píxel 4,310 de 5,339 y el aviso de juicio en el 5,212 |
| 3 | Jerga y metadatos en la cabecera | Parcial | Alias de I9. Ya no salen «methods agree: 1/1» ni «story field». **Falta:** «E Water term», «boundary confidence (Fields of The World)», «Pilot area», «Monte Carlo» y «Penman–Monteith» |
| 4 | Notas internas abiertas por omisión | Resuelto | «Source and note» y «Units and measuring point» cerrados en escritorio. Lo que hay dentro: lista 1, I3 |
| 5 | Dos «Why?» por tarjeta | Parcial | Siguen los dos (`web/app.js:2296`, `web/js/suelo.js:922`); las citas ya van plegadas y en inglés |
| 6 | La barra fija tapa la ficha en teléfono | Resuelto | Medido a 390×844: franja de 78 px y ficha de 762 px. No se probó con el texto al 200 % |
| 7 | Decimales disparejos y hectáreas mayores que el área | Parcial | Alias de C2 e I8 |
| 8 | Mapa: estados solo por color; etiquetas encimadas | Parcial | Tramas por estado (`web/app.js:85-88`, `:1475`). **Falta:** las etiquetas siguen como marcadores HTML (`web/app.js:1521-1525`); en la captura propia, «P0757 ✕» se encima con «Colonia Nicolás Bravo (Km 92)» |
| 9 | Carga sin aviso; el deslizador salta | Resuelto | `web/index.html:74` (`data-cargando`) y `:110` («Loading field data…»); `web/style.css:318-321` |
| 10 | El botón Atrás sale de la app | Resuelto | `web/app.js:2003-2004` y `:507`. Probado: abrir P0757 desde la lista y pulsar Atrás cierra la ficha y deja `/index.html` |
| 11 | Objetivos táctiles de menos de 44 px | Parcial | Con la ficha abierta, la prueba exige 0 (`tests/e2e/web_smoke.mjs:2875-2891`; no comprobado aquí). **Falta:** en la portada del teléfono, con la regla de esa prueba, hay 22: zoom y «3D twin view» de 36 px, «Simulate a storm» de 40, opciones de «Color fields by» de 32, «Follow the drop» de 22, plegables «Source files» de 24 y etiquetas del mapa de 24 a 28 |
| 12 | Contraste de los colores de estado | Parcial | `--sem-gris` da 3.75:1 sobre `--arena-mapa` y `--sem-rojo` da 3.06:1 contra `--brote` (`web/style.css:77-78`; calculado). **Falta:** `--sem-ambar` sigue en 2.68:1 sobre blanco (`:76`) y `--mem-sin_dato` en 1.68:1 (`:93`) |

## Lista 4 · `datos/PARA_INTEGRADOR.md`

| ID | Hallazgo | Estado | Evidencia en `f0dbf3b` |
|---|---|---|---|
| 21:45-1 | La ficha no muestra nutrientes ni tipo de suelo por parcela | Resuelto | Ficha: «Soil type: Torrifluvents (Entisols)…» y «Nutrient notes for this field»; `web/data/suelo.json` → `tipo_suelo`, `nutrientes`. Alias: 22:20-14 |
| 21:45-2 | README desactualizado (ECOSTRESS, GAEZ, 1,139.3) | Resuelto | `README.md:143`, `:161`, `:177` (1,139.5 mm). Alias: 22:20-13 |
| 21:45-3 | «20.7 of 20.66» | Resuelto | P0632 con la dotación al máximo: «Enough for the whole field (20.66 ha)». El resto en el «Why?»: lista 1, C2. Alias: 22:20-9 |
| 22:20-1 | Fuentes de «About & Data» en español | Resuelto | «NASA ECOSTRESS ECO_L3T_JET.002; daily ET (ETdaily, integrated between sunrise and sunset) at 70 m…» |
| 22:20-2 | Fuente de ECOCROP en español | Resuelto | «Source: FAO ECOCROP, sheet for Medicago sativa (…), read on Nov 14, 2026» |
| 22:20-3 | Frase del sorgo en la tarjeta de alfalfa | Resuelto | Alias de la lista 1, I14 |
| 22:20-4 | Referencias locales, GEDI y goteo en español | Resuelto | `cubo.json` → `filtros_catalogo.alfalfa_no_en_anio_seco.fuente`: «… (40 cm in five irrigations of 8 cm)»; fuente de la lámina local y del goteo en inglés en la ficha |
| 22:20-5 | Línea de ECOSTRESS sin escenas ni contraste; agosto en P0632 | Abierto | Ficha: «Evapotranspiration (ECOSTRESS): 2.11 mm/day, median of the clear scenes of Aug 2026»; P0632: «0.66 mm/day … Aug 2026». `contexto.json` → `ecostress.parcelas` lleva 12 valores por parcela, sin `n_escenas`. La revisión del 15-nov (`docs/revisiones/2026-11-15_ecostress.md`, sección 4) desaconseja el contraste con el modelo y pide otra redacción; el integrador lo tiene en curso |
| 22:20-6 | L0175: «Summer crop» junto a «≥ 11 years» | Abierto | Ficha: «2016: Summer crop» y «Orchard pattern in satellite memory: ≥ 11 years». 0 coincidencias de «loses its leaves» en `web/` |
| 22:20-7 | «✓ Soil favorable» con «No published range» | Resuelto | Ahora «Soil · cover: favorable» y «Soil fit: ○ No published range». Alias de la lista 1, M3 |
| 22:20-8 | «enough for 1 hectares.» | Abierto | Sigue en el «Why?» de P0757. Alias de C2 |
| 22:20-9 | «Enough for 20.7 of 20.66 hectares» | Resuelto | Alias de 21:45-3 |
| 22:20-10 | «Automated gate» con el detalle en español | Parcial | Pasos en inglés (`motor/pruebas_web.py:89-102`). **Falta:** el detalle sigue en español con `lang="es"` (`web/js/acerca.js:577`), por ejemplo «cubo REAL: 1239 parcelas…»; también en `docs/en/test_results.md` |
| 22:20-11 | «Pending: every field reports a single method in acuerdo_metodos.» | Abierto | Sigue igual en «About & Data». Alias de la lista 1, I6 |
| 22:20-12 | Presa y «Follow the drop» en español y con referencias internas | Parcial | Fuentes de la presa plegadas, con [P]. **Falta:** el texto sigue «Impacto Noticias, 9-nov-2026, con el reporte diario de Conagua (S8 §2)» y «Tabla de Conagua reproducida en prensa». Alias de I5 |
| 22:20-13 | README: ECOSTRESS y GAEZ «not delivered»; 1,139.3 | Resuelto | Alias de 21:45-2 |
| 22:20-14 | Suelo: nutrientes, tipo y textos por parcela | Resuelto | Alias de 21:45-1 |
| 22:20-15 | GAEZ: unidades, clase y nota del maíz | Abierto | «Regional context»: «1,678.5 10kg DW/ha», «2 Class» y «Forage maize … 9,341 kg DW/ha». `contexto.json` → `gaez.zonas` no lleva `clase_nombre` ni `nota` |
| 22:20-16 | `Drip is recommended…` | Resuelto | `web/js/gota.js:57`, `:60`: «The drip scenario is shown without a warning when district ET stays at or below its historical level…». Alias: auditoría, cifras 11 |
| 22:20-17 | GEDI: cifra en el piso del instrumento | Resuelto | La nota va junto a la cifra: «it does not measure crop height. Fields without trees read about 2.7 m…». La sesión de datos lo dio por aplicado a las 23:24. La cifra sigue: «median 2.94 m from 11 shots» |
| I14 | Frase del sorgo | Resuelto | Alias de la lista 1, I14 |
| M19 | NASADEM a 0.9702″ | Después del evento | Alias de la lista 1, M19 |
| 23:24-a | Rango con decimales distintos («7.65 to 11.4») | Abierto | P0632: «Enough for 9.24 of 20.66 hectares (range 7.65 to 11.4)»; P0757: «(range 0.79 to 1.2)» |
| 23:24-b | «Follow the drop»: español y llaves internas | Abierto | En «Assumptions behind these flows»: «Conduction efficiency: params.eficiencia.conduccion (mean; IMTA, COMEII 2021 (rango medido 2012–2016))» y «… params.gota.c_retorno_superficial (…)» |
| 23:24-c | `idioma_fuentes` en "es" | Resuelto | "en" en `web/data/contexto.json` y `web/data/suelo.json` |
| 23:24-d | `datos-satelite` sin fusionar | Resuelto | Fusiones `743d302` y `38bb06f` |
| 23:24-e | `web_smoke` 638/639 por un botón de 44 px | Resuelto | Un control desactivado no cuenta como objetivo táctil (`tests/e2e/web_smoke.mjs:2875-2891`). No comprobado aquí |
| 23:35-a | Se pierde la malla de GRACE con el LEEME en inglés | Resuelto | `contexto.json` → `…grace.agua_almacenada_anomalia.malla_mascon`: 0.5° y 3°. Página: «0.5° product grid built on 3° mascons: the real resolution is the mascon's» |
| 23:35-b | `web_smoke` se salta la comprobación si falta `malla_mascon` | Abierto | `tests/e2e/web_smoke.mjs:2226` sigue con `if (grace?.malla_mascon)` |
| 23:35-c | `lang="es"` en fuentes que ya están en inglés | Abierto | Fijo en `web/js/acerca.js:418`, `:458`; `web/js/resumen.js:601`; `web/js/estado_gemelo.js:397`; `web/js/suelo.js:484`, `:490` |

## Lista 5 · Auditoría de cinco revisores sobre `dd03843`

### Contrato

| ID | Hallazgo | Estado | Evidencia en `f0dbf3b` |
|---|---|---|---|
| H1 | Plazo restante en las alternativas | Resuelto | `web/app.js:2552-2556`. Alias de la lista 1, I12 |
| H2 | Filtros de alfalfa en `avena_maiz` y nombre en las 16 parcelas de cereal | Resuelto | `cubo.json`: `alfalfa_no_en_anio_seco` en 0 opciones; `alfalfa_tras_alfalfa` en las 118 de alfalfa y en ninguna de cereal; nombre «Oats (winter) + forage maize (summer)» en las 16. Alias de I13 |
| H3 | Corte de verano ofrecido a 15 alfalfas más jóvenes que la edad mínima | Resuelto | `cubo.json`: `alfalfa_corte_verano` en 103 de 118 alfalfas; `meta.notas` dice las 15. `tests/test_opciones_b3.py:595`, `:644` |
| H4 | Validador: `gota` null sin motivo, compromiso, restante ≤ plazo, nogal y marca | Resuelto | `validar_contrato.py:23-29`, `:360`, `:454-466`, `:489-513`. Con cinco alteraciones en memoria del cubo publicado, las cinco dan error: `gota` null sin aviso, compromiso distinto de L50 × plazo restante, restante mayor que el plazo, nogal con descuento y marca fuera del punto medio |
| H5 | Decisiones por escrito y cita S9 §5 | Resuelto | `docs/decisiones/2026-11-15_correcciones_motor.md`, con la cita de S9 §5; `tests/test_b4.py:788`. Su sección 6 pide que Cristian confirme las cuatro reglas |
| H6 | Falta un caso de `gota` null en `web_smoke` | Abierto | La variante en memoria quita los bloques de goteo, no `gota` (`tests/e2e/web_smoke.mjs:2932-2975`); la rama «Not available» (`:467-470`) corre solo si los datos lo traen, y ninguno lo trae. Sí lo prueban `tests/test_b4.py:692` y `tests/test_contrato.py:206` |

### Código

| # | Hallazgo | Estado | Evidencia en `f0dbf3b` |
|---|---|---|---|
| 1 | `warning` en `ESTADOS_PASO` de `acerca.js` | Resuelto | `web/js/acerca.js:88` |
| 2 | `escribir_pruebas_md_en` con ADVERTENCIA y nombres de gemelo, pwa y pruebas_web | Resuelto | `construir.py:407-432`; `motor/pruebas_web.py:86-102` |
| 3 | `chromium.launch` dentro del `try` | Resuelto | `tests/e2e/grabar_video.mjs:733-734`; `tests/e2e/diapositivas_pdf.mjs:496-497` |
| 4 | `revisarSubtitulos` después de `elegirLibre` | Resuelto | `tests/e2e/grabar_video.mjs:761-764` |
| 5 | «Five tests» comparado con `pruebas.json` | Resuelto | `tests/e2e/grabar_video.mjs:694-709`, `:765`; `pruebas.json` trae 5 pruebas |
| 6 | `fmt(null)` → «0» en las diapositivas | Resuelto | `tests/e2e/diapositivas_pdf.mjs:67-70`: un dato que falta se escribe «—» |
| 7 | Texto de `explicacion()` para el corte de verano | Resuelto | `motor/b4_cubo.py:1283-1296`: «from planting, this crop typically commits water for … (the card shows the term left for this field)» |
| 8 | `texto_publico` sin distinguir mayúsculas | Resuelto | `motor/pruebas_web.py:417-431` (`re.I`) |
| 9 | Pruebas que repiten la fórmula del código | Parcial | `test_filtro_de_edad…` comprueba estados y hay una prueba sobre el cubo publicado (`tests/test_opciones_b3.py:595`, `:644`). **Falta:** `test_corte_de_verano…` sigue calculando lo esperado con la misma fórmula (`tests/test_b4.py:811-826`) |
| 10 | Comentario «dos intentos» | Resuelto | `tests/e2e/grabar_video.mjs:816`: «hasta tres intentos», con tres valores de compresión |

### Cifras y textos

| # | Hallazgo | Estado | Evidencia en `f0dbf3b` |
|---|---|---|---|
| 1 | PDF y video con cifras viejas | Parcial | PDF (7 páginas, de `40c01ec`): «1,139.5», «declared before the analysis» y las ligas de la página y del repositorio. **Falta:** «Members [INTEGRANTES]» y «Video: [link pending]»; la diapositiva 2 cita en español «S9 §2» y «S8 §2»; las capturas son anteriores al rediseño. El video es de las 04:36 UTC y muestra la página anterior. Alias de la lista 1, I1 |
| 2 | Marcador dentro del bloque de SI | Resuelto | El bloque no lleva marcadores (`docs/pitch/textos_envio.md`, sección 9). La frase que falta: guía C2 |
| 3 | «The page still titles H1 and H3 preregistered» | Resuelto | 0 coincidencias en `README.md`, `LIMITATIONS.md`, `docs/pitch/` y `docs/en/` |
| 4 | «data/raw/ is empty» y «No Conagua file is redistributed» | Resuelto | `DATA_LICENSE.md:71-91`: «`data/raw/` holds 61 files»; `git ls-files data/raw` da 61 sin `.gitkeep`. `README.md:357` |
| 5 | Frase del chile al revés | Resuelto | `README.md:189`: 14.26 arriba de la guía de INIFAP (9.2) y abajo de lo aplicado (16.1) |
| 6 | H3 y +53 % sin decir que son del rectángulo original | Parcial | Dicho en `README.md:65`, `:177`; `LIMITATIONS.md:85`; `textos_envio.md:139`; y en la prueba 5 de la página. **Falta:** el resumen de H3 dice «pilot area» (`web/data/pruebas.json`) y la diapositiva 6 dice «a regional comparison», sin el rectángulo |
| 7 | 12 `only` y 2 `first` en `docs/en/` | Resuelto | `git grep -w`: 0 y 0 |
| 8 | Preguntas difíciles: «Tests in sight» sin H1-b | Resuelto | `docs/pitch/preguntas_dificiles.md:231` |
| 9 | README: «Video. Not yet» | Resuelto | `README.md:15`: «A draft exists…» |
| 10 | Encabezados «— Raíz,» | Resuelto | 0 en `web/`, `motor/`, `tests/*.py`, `tests/*.js`, `tests/e2e/`, `README.md`, `docs/en/` y `docs/pitch/`. Quedan 70 archivos que la decisión del nombre deja sin tocar (`docs/decisiones/2026-11-14_nombre_root.md`) |
| 11 | `Drip is recommended…` | Resuelto | Alias de PARA_INTEGRADOR 22:20-16 |
| 12 | Textos en español que la página muestra | Parcial | Fuentes de los datos, en inglés. **Falta:** `data/params.json` (marcas, presa, gota) y el detalle de los pasos de `construir.py`. Alias de la lista 1, I5 |

### Pruebas

| # | Hallazgo | Estado | Evidencia en `f0dbf3b` |
|---|---|---|---|
| 1 | La hoja impresa de P0757 en 2 páginas carta | Resuelto | PDF propio de la ficha de P0757: 1 página en carta y 1 en A4 (`pdfinfo`) |
| 2 | Tiempos de espera intermitentes del mapa | Parcial | La prueba ya no cuenta las teselas que cancela el mapa (`tests/e2e/web_smoke.mjs:276-287`); las esperas siguen en 15 s y 30 s (`:291-293`). No comprobado aquí; en las cargas propias el mapa quedó listo |

### Seguridad y privacidad

| # | Hallazgo | Estado | Evidencia en `f0dbf3b` |
|---|---|---|---|
| 1 | DATA_LICENSE falso sobre los crudos | Resuelto | Alias de cifras 4 |
| 2 | Filas que faltaban: tipo de suelo, nutrientes y figura de Sentinel-2 | Resuelto | `DATA_LICENSE.md:25`, `:60-69` |
| 3 | Marcadores en diapositivas y textos | De persona | «[INTEGRANTES]» (`docs/pitch/diapositivas.html:151`) y dos «[LINK: pendiente…]» (`textos_envio.md:50-51`): P6 y el responsable de presentación. Alias de la lista 1, I1 |
| 4 | `entregables/Anteproyecto_Raiz_Los_Norteados_v3.docx` con un nombre completo | De persona | El archivo sigue en el repositorio: trae nombres completos después de «Integrantes:» y un autor en los metadatos de los tres `.docx`. Lo decide el equipo |
| 5 | Correo personal en `5abfd21` y `0fcb664` | De persona | Alias de la lista 1, I25 |
| 6 | `iondroplet` | Parcial | Alias de la lista 1, M18 |
| 7 | Atribución de OSM sin liga | Abierto | `web/app.js:1420`: «© OpenStreetMap contributors», sin enlace. `DATA_LICENSE.md:127` lo deja anotado |
| 8 | Sin CSP | Después del evento | Alias de la lista 1, M22 |
| 9 | `enlace()` no valida el esquema | Abierto | `web/js/acerca.js:245-248` |
| 10 | Acciones de CI por etiqueta | Después del evento | Alias de la lista 1, M21 |
| 11 | Ids de sesión | Abierto | `docs/coordinacion.md:20` nombra una sesión; 242 mensajes de commit llevan la liga de la sesión (93 en `main`); `contexto.json` y `manifest.json` publican los dos identificadores de las solicitudes de AppEEARS. No son credenciales |
| 12 | `prototipos/front_lara` con Leaflet sin licencia | Abierto | `prototipos/front_lara/web/vendor/leaflet.js` (1.9.4) sin su archivo de licencia; `DATA_LICENSE.md`: 0 menciones de Leaflet |

## Abiertos que afectan lo que verá el jurado

En orden de impacto en el envío del domingo. El código se congela a las 8:00; el envío va a las 13:00 y cierra antes de las 14:30, hora de Chihuahua.

**Antes de las 8:00 (código y datos)**

1. **«Why?» con hectáreas imposibles** (C2): «enough for 8 hectares» en 7.95 ha, «20.7» en 20.66 ha y «1 hectares». Cambiar `fmt` por el formato del área en `web/app.js:2654` y ampliar el caso de `web_smoke`.
2. **Español y códigos internos a la vista** (I5): «vía Google Earth Engine» en la portada y la leyenda del relieve, y «Return-flow coefficient … acuífero 0831 … de 614 hm³/año» en «Follow the drop». Después, lo plegado (I3: «(S8 §2)», «(kit B4)», la nota de la mentoría).
3. **ECOSTRESS en P0632** (22:20-5): «0.66 mm/day … Aug 2026» es de un campo sin cultivo.
4. **«Why it's suggested» y «Benefits»** (I10): el reto pide el motivo y el beneficio de cada estrategia; `por_que_en` ya está en el cubo.
5. **Ficha larga** (I7): 5,339 px en escritorio y 9,581 px en teléfono.
6. **«Follow the drop»** (I15): 376,300 m³ «de la presa» para 7.95 ha, sin la proporción que cubre la dotación.
7. **«About & Data»** (I6, 22:20-10, 22:20-11): «acuerdo_metodos», «not in the repo yet», «still pending» y el detalle de la corrida en español.
8. **GAEZ** (22:20-15): «1,678.5 10kg DW/ha» y «2 Class».
9. **Detalles de la ficha y de la portada:** pie con 38 rutas y fecha ISO (M6); «CURRENT ROTATION» repetido (M4); la ficha tapa el mapa (M1); en teléfono el mapa queda bajo el pliegue (M2); decimales (I8, 23:24-a); «15 in use» con NASA POWER dos veces (M10); L0175 con «Summer crop» y meses de reposo como «bare soil» (22:20-6, M3); H3 como «pilot area» (cifras 6); atribución de OSM sin liga.

**Después del congelamiento (materiales y personas)**

10. **PR #5 sin fusionar** (C1): hasta entonces, la página y el README públicos son los del 14-nov. Al fusionar, corregir `README.md:11`.
11. **Video** (I1): volver a grabarlo sobre la página final, comprobar 30 s o menos, subirlo y probar la liga.
12. **Diapositivas** (I1; cifras 1 y 6): «[INTEGRANTES]», «Video: [link pending]», capturas anteriores al rediseño, cita en español en la diapositiva 2 y la diapositiva 6 sin el rectángulo original.
13. **Formulario** (guía C2 y C4): frase de Cristian en el bloque de SI, ligas y descripción del repositorio.
14. **`cifras.csv`** (M14): sin él no se puede hacer la revisión de cifras de las 12:30 como la pide el kit.
15. **Guiones** (M11, guía I6): quitar las ramas «[ALTERNATIVA]» y agregar la respuesta sobre los rangos de ECOCROP.

No los ve el jurado: H6, código 9, 23:35-b, 23:35-c, M5, M7, M8, M9, M20, UX 11, UX 12, `enlace()`, Leaflet y los ids de sesión.

## Pendientes de persona

| Quién | Qué | De dónde sale |
|---|---|---|
| Cristian | Fusionar el PR #5 a `main` y probar la liga pública en una ventana de incógnito | Lista 1, C1; guía C1 |
| Cristian | Una frase suya sobre cómo surgió la idea, para el bloque de SI; decidir los puntos 7 y 8 de «Antes de pegar (Cristian)» | Guía C2 |
| Cristian | Descripción del repositorio con la declaración de uso de IA | Lista 1, I1 |
| Cristian | Liga de OSF, si el preregistro se publicó | Lista 1, I22 |
| Cristian | Lo que dijo la mentoría sobre el punto de medición del millar | Lista 1, I3 |
| Cristian | Confirmar las cuatro reglas del motor y la excepción del nogal, o revertirlas | Auditoría H5; lista 1, I11 |
| Cristian | Cita de AppEEARS y los «terms to be confirmed» de «References» | `docs/pitch/textos_envio.md`, puntos 9 y 10 |
| Cristian | Decir en qué conversación sigue el diseño | `docs/coordinacion.md` |
| Cristian, después del evento | Reescribir el historial, si la integrante lo pide | Lista 1, I25 |
| Responsable de video (P6) | Regrabar el video sobre la página final, subirlo y dar la liga | Lista 1, I1; guía C3 |
| Responsable de presentación y pitch | Nombres en la portada, liga del PDF y ensayo | Lista 1, I1 |
| Cada integrante | Su línea en `AI_USAGE.md` | Lista 1, M16 |
| La integrante del correo | Decidir qué hacer con su correo en los dos commits y activar la privacidad del correo en GitHub | Lista 1, I25 |
| Una persona del equipo | Revisión en color verdadero de P0757, P0632 y L0175 | Lista 1, I6; `docs/reparto_faltantes.md`, D3 |
| Equipo | Si `docs/equipo/`, los tres `.docx` de `entregables/` y el nombre del proyecto de Earth Engine quedan públicos | Lista 1, M17 y M18; auditoría, seguridad 4 |
| Equipo, al enviar | Una sola persona edita el formulario y nadie guarda después de «Submit for Judging» | Guía C4 |

## Después del evento

M19 (NASADEM con su proyección nativa), M21 (acciones por SHA), M22 (CSP), el umbral por parcela de I18, el método de rutas de I20, la versión única del service worker (M20), `enlace()` con esquema validado, la licencia de Leaflet en `prototipos/`, los ids de sesión y la prueba de la auditoría, código 9.
