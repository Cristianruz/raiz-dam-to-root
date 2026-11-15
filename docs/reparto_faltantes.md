<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Qué falta y quién lo hace · corte del sábado 14-nov-2026, 15:50

**Origen:** inventario contra S9, S10 y el kit v4 (un revisor de solo lectura), con el estado real del repo y del buzón.

**Instrucción de Cristian:** «Trabaja a la par con el otro chat. Y cualquier cosa que no tengamos háganla.» Lo que falte lo hacen las dos sesiones sin esperar; si un compañero entrega después su versión, se valida y se compara.

**Cómo se actualiza:** cada sesión marca aquí lo suyo al terminar. La sesión de datos escribe además en `datos/PARA_INTEGRADOR.md` de su rama.

## Solo una persona puede hacerlo
| # | Qué | Quién | Para cuándo |
|---|---|---|---|
| H1 | Repositorio público y GitHub Pages activado (Settings → Pages → Source: GitHub Actions). Sin eso no hay liga pública | Cristian | Ya |
| H2 | Mentorías de las 16:00 y las 17:00 (faltar descalifica). Preguntas: eficiencia de riego por gravedad realista; dónde se mide el millar; cómo presentar que H1 no cumple | Cristian | Hoy |
| H3 | Liga del preregistro publicado (OSF) y su texto | Cristian | Hoy |
| H4 | Documentos del proyecto de Claude «Space Apps» que el repo no tiene: 27, 29, 30 y maestro §5.2. Sin ellos no hay opciones ni filtros oficiales (B3) | Cristian | Hoy |
| H5 | Etiquetas a ciegas unidas (`etiquetas_unidas.csv`) | Tena | Hoy |
| H6 | Cuenta de NASA Earthdata, si se quiere ECOSTRESS | Cristian | Opcional |
| H7 | Subir el video y las diapositivas, llenar el formulario de envío, ensayar la exposición | Equipo | Domingo |

## Integrador (rama `claude/sleepy-heisenberg-pxyhtx`)
| # | Qué | Estado |
|---|---|---|
| I1 | Gemelo digital conectado a la página (vista 3D, línea de tiempo, estado, app sin conexión) | En construcción |
| I2 | Bases de datos del reto: validador, contexto regional, tabla de recursos | En construcción |
| I3 | README, LIMITATIONS, DATA_LICENSE y AI_USAGE al día, sin contradicciones ni [PENDING] | En curso |
| I4 | Video de 30 s o menos, sin voz, con subtítulos en inglés, grabado de la web real | Pendiente (después de I1) |
| I5 | Guion de la exposición de 4 minutos y respuestas a las preguntas difíciles, con las cifras del repo | Pendiente |
| I6 | Diapositivas de respaldo (máximo 7) | Pendiente |
| I7 | `cifras.csv` generado de `manifest.json`, `params.json`, S9 y S8 | Pendiente |
| I8 | Traer a `main` los scripts y los crudos ligeros de `datos-satelite`, y la prueba de FAO-56 al comando único | Pendiente |
| I9 | Filtro de helada con `heladas.json` y opciones oficiales (B3) | Bloqueado por H4 |
| I10 | Relanzar la publicación y probar la liga en incógnito | Bloqueado por H1 |

## Sesión de datos (rama `datos-satelite`)
| # | Qué | Estado |
|---|---|---|
| D1 | `contexto_regional.csv` y `gedi_parcelas.csv` | En proceso en Earth Engine |
| D2 | `supuestos.json` al buzón, con la eficiencia de goteo y su fuente (si no hay fuente, `null` y se dice) | Pedido |
| D3 | Revisión en color verdadero de las tres protagonistas (P0757, P0244, L0175), registrada con fecha e imagen usada; proponer una parcela «libre» que sí muestre agua | Pedido |
| D4 | `dotaciones.json` con las tres marcas, su fuente y la fecha de lectura de cada nota | Pedido |
| D5 | PDF público de FAO-56 en `docs/` y la prueba de sus dos ejemplos lista para el comando único | Pedido |
| D6 | Nogal: cobertura estimada con NDVI y vida de la huerta con fuente de INIFAP | Pedido |
| D7 | Random Forest, F1 y Olofsson en cuanto exista H5 | Espera a H5 |
| D8 | `ecostress_parcelas.csv` y `gaez_zona.csv` | Depende de H6 y del visto bueno de Cristian |

## Lo que no se hace antes del congelamiento
- Historial de superficie, memoria desde 2013 y calibración: el kit los da como «solo si sobra tiempo».
- WaPOR v3 y LiDAR del INEGI: se declaran «not run» o «no coverage».
- Explicaciones con un modelo de lenguaje: las plantillas declaradas cumplen el kit.
- Renglón Dinero: sin fuente se queda en «no data»; no se inventa.
