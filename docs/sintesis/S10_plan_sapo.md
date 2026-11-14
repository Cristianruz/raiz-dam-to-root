# Plan del evento con el método «Trágate ese sapo» (Brian Tracy)

13 de noviembre de 2026 · Equipo Los Norteados · Raíz – From Dam to Root

> Plan para la noche del viernes, el sábado y el domingo, ordenado por prioridad con los 21 principios del libro. Nada de código antes del sábado a las 9:00.

## 1. La meta, por escrito («Pon la mesa»)
**Meta:** el domingo a las 14:30 queda enviado un proyecto que funciona con datos reales, y a las 17:00 lo presentamos en 4 minutos con evidencia, para quedar como nominado global de la sede.

**Cómo se mide que se cumplió:**
1. Liga pública que abre en incógnito: centro de control → ficha de una parcela real → La gota → mensaje.
2. Cada cifra visible sale de los datos y tiene fuente.
3. Al menos tres de las cinco pruebas con resultado publicado (mapa, back-test 2026 y verificador de cifras).
4. Página en inglés, video de 30 s o menos y envío confirmado antes de las 14:30.
5. Exposición de 4 min ensayada, con respuesta a las preguntas difíciles.

## 2. Los sapos (principio central)
El sapo es la tarea más importante y la que más ganas da de posponer. Se come primero, antes de cualquier otra cosa.

| Momento | El sapo | Por qué es el más feo | Cuándo se come |
|---|---|---|---|
| Viernes noche | Confirmar que el anteproyecto quedó enviado (si no, descalificación) y que el preregistro está publicado con fecha | Es lo único que puede eliminar al equipo antes de empezar | Hoy, antes de cualquier otra cosa |
| Sábado | **Datos reales de satélite**: lanzar las exportaciones de Earth Engine (HLS de la zona piloto, NASADEM) | Es lo más lento, lo más incierto y solo lo puede hacer Cristian. Si se lanza tarde, nada real llega a las 20:30 | Sábado, justo después de la bienvenida (≈9:45), antes de abrir la web |
| Sábado (segundo sapo) | **Una parcela completa con datos reales y publicada** | Une todas las piezas; es el hito que decide qué se corta | 20:30 a más tardar |
| Domingo | **Envío completo** (página en inglés, video, ligas probadas) | Es aburrido, se deja para el final y sin él no hay calificación | Primer envío 13:00; final antes de 14:30 |

**Regla de los dos sapos:** si hay dos, se come primero el más feo. El sábado, el satélite va antes que la web bonita.

## 3. Lista ABCDE
- **A · Debe hacerse; si no, hay consecuencias graves**
  - A1. Exportaciones de Earth Engine (HLS mensual de la zona piloto y NASADEM).
  - A2. Parcelas de Fields of The World recortadas y 3 protagonistas revisadas.
  - A3. Clima NASA POWER y ETo FAO-56.
  - A4. Demanda por rotación (lámina en millares/ha con banda P10–P90) y plazo del agua.
  - A5. Web: centro de control con deslizador, ficha con «alcanza para X de N ha», La gota.
  - A6. Asistir a las dos mentorías (16:00 y 17:00; faltar descalifica).
  - A7. Página en inglés, video y envío antes de las 14:30.
  - A8. Exposición de 4 min ensayada.
- **B · Debería hacerse; consecuencias leves**
  - B1. Mapa de cultivos con reglas + Random Forest y validación por bloques.
  - B2. Back-test 2026 preregistrado.
  - B3. Verificador de cifras con 30 casos.
  - B4. Capa de relieve y «Simular tormenta».
- **C · Estaría bien; sin consecuencias**
  - C1. Memoria de la parcela 2016–2026 y experimento natural 2025.
  - C2. Ficha imprimible y vista de WhatsApp.
  - C3. Globo 3D de apertura; duelo contra los embeddings AlphaEarth.
- **D · Delegar** (a quien no es Cristian)
  - D1. Clima y demanda (Colab), etiquetas de referencia, textos de la interfaz, guion, video, póster, People's Choice y #MejorMeme.
- **E · Eliminar**
  - E1. OPERA y subsidencia, optimizador, agente conversacional, Presto, sensores, blockchain, cualquier capa «por parcela» con datos regionales.

**Regla:** no se toca una B mientras haya una A sin terminar. Una C solo después del hito de las 20:30.

## 4. Regla 80/20
El 20 % de las tareas que produce el 80 % de la calificación:
1. **Una parcela real que cuente la historia completa** (plazo del agua + La gota). Vale más que cien parcelas a medias.
2. **La exposición de 4 minutos.** Los jueces califican lo que ven y oyen en la mesa.
3. **Las pruebas con resultado publicado.** Separan a Raíz de una app bonita.

Todo lo demás es el 80 % de tareas que aportan el 20 %. Se hace solo si las tres anteriores están seguras.

## 5. Áreas de resultados clave y ley de tres
Siete áreas; en cada una se pregunta «¿qué es lo único que, si lo hago excelente, cambia más el resultado?».

| Área | Resultado clave | Lo único que más importa |
|---|---|---|
| Datos de satélite | Tablas de HLS por parcela | Lanzar la exportación temprano y una sola vez |
| Agua | Lámina por rotación con banda | Que las cifras cuadren con INIFAP |
| Web | Las 3 pantallas con datos reales | Que la ficha cuente el plazo del agua sin explicación |
| Validez | Pruebas publicadas | Publicar el resultado, salga como salga |
| Narrativa | Exposición, página, video | Abrir con 2025, el año sin presa |
| Reglas del concurso | Mentorías, verificación, envío | No perder ninguna hora obligatoria |
| Equipo | Turnos y descanso | Cristian duerme de 1:00 a 5:30 |

**Ley de tres:** las tres tareas que aportan el 90 % del valor son: (1) datos reales en una parcela, (2) la ficha con el plazo del agua y La gota, (3) la exposición.

## 6. La restricción clave
El cuello de botella es **Cristian**: es el único con Claude Code y el único que usa Earth Engine.
- Todo lo que otros puedan hacer en Colab o en Drive, lo hacen ellos (principio de delegar).
- Cristian solo hace lo que nadie más puede: Earth Engine, motor, web, integración y envío.
- Nadie interrumpe a Cristian salvo por un bloqueo; las dudas se juntan y se resuelven en las revisiones de cada hora.

## 7. Plan hora por hora
### Viernes 13 (hoy)
| Hora | Tarea | Principio |
|---|---|---|
| 19:30–20:00 | **Sapo:** confirmar envío del anteproyecto (captura) y preregistro publicado | Trágate el sapo |
| 20:00–20:45 | Leer las guías 2026 de entrega y jueceo (publicadas el 13-nov); anotar cualquier cambio | Prepárate a fondo |
| 20:45–21:30 | Descargas en el navegador: `LBQCH.csv` y `FIMCH.csv` del SIH; revisión del LiDAR del INEGI (cartas H13C88 y H13C78) | Prepárate a fondo |
| 21:30–22:00 | Mochila: CURP, identificación, comprobante de domicilio, seguro médico, laptop, cargadores, extensión, batería, póster | Pon la mesa |
| 22:00–22:15 | Escribir la lista ABCDE del sábado en papel | Planea cada día por adelantado |
| 22:30 | **Dormir.** Nada de pantallas | Maximiza tus energías |

### Sábado 14
| Hora | Tarea | Quién | Principio |
|---|---|---|---|
| 8:00 | Registro con documentos | Todos | — |
| 9:00 | Bienvenida y plática de seguridad | Todos | — |
| **9:45–10:30** | **Sapo del día:** repositorio, `CLAUDE.md`, contrato y lanzar las exportaciones de Earth Engine (piloto de consumo primero) | Cristian | Trágate el sapo; la restricción clave |
| 9:45–12:00 | Parcelas FTW y protagonistas; POWER y ETo; dotaciones con fuente | Equipo en Colab | Delegar |
| 10:00–14:00 | Sesiones de la sede | Dos integrantes | — |
| 10:30–14:30 | Web con datos simulados: 3 pantallas | Cristian | Rebana el salami |
| **14:30** | **Hito:** 3 pantallas navegables con datos simulados | — | Presión sobre ti mismo |
| 15:00 | Preparar mentorías: 3 preguntas concretas | Cristian + uno | Prepárate a fondo |
| **16:00 y 17:00** | **Mentorías obligatorias** (pregunta clave: dónde se mide el millar) | Cristian + uno | — |
| 17:00–20:30 | Bloque largo sin interrupciones: datos reales a la ficha, plazo, La gota | Cristian | Bloques grandes de tiempo; una tarea a la vez |
| **20:30** | **Hito:** una parcela real publicada. Si no se logra, se aplica el orden de corte | — | Sentido de urgencia |
| 21:00 | Cierre de puertas: el turno de noche se queda dentro | — | — |
| 21:00–1:00 | B1–B4 en orden: mapa de cultivos, back-test, verificador, relieve | Equipo + Cristian | ABCDE |
| 1:00–5:30 | Cristian duerme | Cristian | Maximiza tus energías |

### Domingo 15
| Hora | Tarea | Principio |
|---|---|---|
| 7:00–8:00 | C solo si todo A y B está listo; si no, terminar B | ABCDE |
| **8:00** | **Funciones congeladas** | Presión sobre ti mismo |
| 9:00 | Verificación final de inscripción (todos) | — |
| 9:00–11:00 | Pruebas, cifras con fuente, correcciones | Mejora continua |
| **11:00** | **Código congelado** | — |
| 11:00–12:00 | Video exportado y probado en incógnito | Sapo del domingo |
| 12:00–12:30 | Revisión de cifras: página, video, póster, ficha | — |
| **13:00** | **Primer envío** | Sapo del domingo |
| **14:30** | **Envío final** y captura de la confirmación | — |
| 14:30–15:00 | Descanso de Cristian | Maximiza tus energías |
| 15:00–16:30 | Montar la mesa; ensayo de 4 + 3 min dos veces | Prepárate a fondo |
| **17:00–19:00** | **Open House** | — |

## 8. Orden de corte si hay retraso
Se corta de abajo hacia arriba, nunca al revés:
1. Todo lo C (memoria completa, globo 3D, duelo de modelos, ficha imprimible).
2. Relieve animado → imagen fija.
3. Monte Carlo completo → rango simple.
4. Más parcelas → se quedan las 3 protagonistas.
5. **Nunca se corta:** la ficha con el plazo del agua y las 5 respuestas, La gota, el aviso de que decide el agricultor, el back-test y el envío.

## 9. Cómo trabajar (principios de ejecución)
- **Rebana el salami:** cada tarea se parte en piezas de 30–60 min con una prueba al final. Nunca «haz la web»; sí «el deslizador cambia los colores».
- **Queso gruyère:** cuando una tarea da flojera, se le hace un hoyo de 10 min para arrancar.
- **Una tarea a la vez, hasta terminarla:** nada de saltar entre pantallas. Una pieza se cierra con su prueba antes de abrir otra.
- **Bloques grandes:** Cristian tiene dos bloques protegidos: 10:30–14:30 y 17:00–20:30.
- **Sentido de urgencia:** cada hito tiene hora y se revisa en voz alta.
- **La tecnología es mala ama:** celulares en silencio durante los bloques; redes sociales solo para el meme y People's Choice, en ratos definidos.
- **Motívate a la acción:** al cerrar cada hito se celebra 2 minutos y se sigue.
- **Mejora tus habilidades clave:** si algo falla dos veces, se usa el prompt de rescate R1 en lugar de insistir.
- **Aprovecha tus talentos:** cada quien en lo que mejor hace; la persona que mejor habla ensaya la exposición desde el sábado.
- **Considera las consecuencias:** antes de empezar algo, preguntar «¿qué pasa si no lo hago?». Si la respuesta es «nada», no se hace.

## 10. Los 21 principios del libro y cómo se aplican
| # | Principio | Aplicación en Raíz |
|---|---|---|
| 1 | Pon la mesa | Meta escrita y criterios de cumplimiento (§1) |
| 2 | Planea cada día por adelantado | Lista ABCDE en papel la noche anterior (§7) |
| 3 | Aplica la regla 80/20 | Una parcela real, la exposición y las pruebas (§4) |
| 4 | Considera las consecuencias | Pregunta de consecuencias antes de cada tarea (§9) |
| 5 | Practica la procrastinación creativa | Todo lo D y E se pospone o se elimina sin culpa (§3) |
| 6 | Usa el método ABCDE | Lista del §3 |
| 7 | Enfócate en áreas de resultados clave | Tabla del §5 |
| 8 | Aplica la ley de tres | Tres tareas que dan el 90 % (§5) |
| 9 | Prepárate a fondo antes de empezar | Viernes noche: guías, descargas, mochila (§7) |
| 10 | Haz un barril a la vez | Hitos de 14:30, 20:30, 8:00, 11:00, 13:00 y 14:30 (§7) |
| 11 | Mejora tus habilidades clave | Kit de prompts y prompts de rescate (§9) |
| 12 | Aprovecha tus talentos especiales | Roles por fortaleza (§9) |
| 13 | Identifica tus restricciones clave | Cristian como cuello de botella (§6) |
| 14 | Presiónate a ti mismo | Hitos con hora y revisión en voz alta (§7) |
| 15 | Maximiza tus energías personales | Dormir el viernes; Cristian duerme de 1:00 a 5:30 (§7) |
| 16 | Motívate a la acción | Celebrar cada hito y seguir (§9) |
| 17 | Rebana y corta la tarea | Piezas de 30–60 min con prueba (§9) |
| 18 | Crea bloques grandes de tiempo | Dos bloques protegidos para Cristian (§9) |
| 19 | Desarrolla un sentido de urgencia | Orden de corte y hitos (§7, §8) |
| 20 | La tecnología es un mal amo | Celulares en silencio en los bloques (§9) |
| 21 | Concéntrate en una sola tarea | Una pieza a la vez hasta su prueba (§9) |

*Nota:* el orden y el nombre exacto de los principios varían entre ediciones del libro; la tabla los agrupa como en la edición más difundida en español.
