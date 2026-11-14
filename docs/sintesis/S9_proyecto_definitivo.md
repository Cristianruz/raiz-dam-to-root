# S9 · Proyecto definitivo (10-nov-2026)

> **Prevalece sobre S1–S8 donde difiera.** Decisiones de Cristian del 10-nov: el proyecto lo define Claude, debe ser propio y la mayor parte se hace con código. Lo que aquí no se menciona sigue como en S8.
> **Kit del sábado vigente:** `investigaciones/40_kit_v4_proyecto_definitivo.md`, que sustituye al kit 23.
> Etiquetas: [V] verificado en fuente primaria; [P] prensa o fuente secundaria; [S] supuesto declarado; [NE] no encontrado.

## 1. La idea en una frase
**Raíz muestra, antes de sembrar, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa.**

- En inglés, para la página: *"Before you plant, see the water you are committing: how much each crop needs per year, for how many years, and how many hectares the dam can cover."*
- Nombre: Raíz – From Dam to Root. Equipo: Los Norteados. Reto: Field Shift.

## 2. El problema, con cifras
- En el DR-005 Delicias (73,002 ha; 8,113 productores [V]) se decide qué sembrar antes de conocer el agua de la presa.
- La alfalfa y el nogal sumaban 39,421 de 62,219 ha sembradas en 2016-17: 63 % [V, Conagua; cálculo]. Son cultivos perennes.
- En 2025 el distrito no recibió agua de las presas: se sembraron entre 12,000 y 15,000 ha con pozos y se autorizaron 87.4 hm³ de agua subterránea para riegos de supervivencia, sobre todo de nogal [P].
- La Boquilla inició el ciclo 2026 al 38 % y el 9-nov-2026 tenía 825.577 hm³, menos de un tercio de su capacidad [P]. Para 2027 se prevé autorizar cerca de una cuarta parte de la superficie [P; previsión, no autorización].
- El acuífero 0831 tiene una disponibilidad de −167.12 hm³ al año (déficit oficial de Conagua, no una pérdida medida) y 83.3 % de su recarga viene de los retornos del riego [V].
- **Mecanismo que explica el proyecto:** un cultivo anual puede dejar de sembrarse en un año seco; un perenne no. Su agua queda comprometida por años y, cuando la presa no alcanza, sale del acuífero.

## 3. Lo que ve el usuario: tres pantallas
1. **Centro de control.** Mapa de la zona piloto.
   - Deslizador de dotación de 0 a 12 millares por hectárea, con tres marcas: «Como 2025» (≈1, pozos [P]), «Como 2026» (3–4 [P]) y «Año normal» (9–10 [P]). Interruptor de lluvia −20 %.
   - Indicador principal: **agua ya comprometida**, la parte de la dotación que piden los perennes antes de sembrar una sola hectárea de cultivos anuales.
   - Parcelas coloreadas por semáforo o por estado del plazo. Capas: cultivo, suelo desnudo y memoria de 2025.
2. **Ficha de parcela.**
   - Memoria de la parcela: una franja por año desde 2016.
   - Rotación actual y dos alternativas (tres en alfalfa establecida: corte de riego en verano), cada una con tres renglones: Agua, Suelo y Dinero.
   - Renglón Agua: millares por hectárea al año con su banda, plazo en años y «alcanza para X de N hectáreas».
   - La gota: recorrido presa → canal → parcela → cultivo → acuífero, con «¿y si cambia a goteo?» y tope de consumo.
   - Botón «¿Por qué?» con las cinco respuestas del reto: por qué, evidencia, beneficios, qué no sabemos y riesgos para revisión local.
   - Aviso fijo: la herramienta apoya y no sustituye el juicio del agricultor ni del técnico.
3. **Mensaje al agricultor.** Vista previa de WhatsApp con las tres opciones y ficha imprimible generada de la misma web.

## 4. Las cuatro piezas propias
| Pieza | Qué muestra | De dónde sale |
|---|---|---|
| **El plazo del agua** | Cada cultivo como compromiso de agua con plazo: un anual, un ciclo; la alfalfa, 3–4 años [P FIRA]; el nogal, largo plazo. Estado de cada parcela: libre, por vencer o comprometida | Lámina FAO-56 con NASA POWER, vida del cultivo en `data/params.json` y edad observada en la memoria |
| **La memoria de la parcela** | Año por año: perenne, cultivo de verano, de invierno, doble o descanso. Da la rotación actual, la edad de la alfalfa, los días de suelo desnudo medidos y el comportamiento en 2025 | Series mensuales de HLS por parcela, con reglas y sin etiquetas |
| **La gota** | Adónde va cada millar: canal, cultivo, acuífero. Con goteo baja lo que sale de la presa y también lo que recarga el acuífero | Conducción 0.60 (IMTA [V]) y coeficientes de retorno de Conagua 2024 [V] |
| **Pruebas a la vista** | Cinco pruebas con resultado publicado, favorable o no (§6) | Preregistro, etiquetas a ciegas y pruebas automáticas |

**Novedad que se comunica:** «no encontramos una herramienta que muestre al agricultor, por parcela, cada cultivo como un compromiso de agua de varios años frente a lo que entrega la presa» (búsqueda del 10-nov, no exhaustiva). Antecedentes que se citan: Mall y Herman 2019 (riesgo de escasez por expansión de perennes en California; estudio regional, no herramienta); mapeo de tierra sin sembrar de NASA, USDA y USGS en 2015; FieldSense, competidor que muestra historial de cultivos por parcela con HLS. No se dice «primero» ni «único».

## 4 bis. El relieve y la lluvia (complemento añadido el 10-nov, por la noche)
Idea tomada de herramientas que simulan con datos de elevación cómo corre la lluvia sobre un terreno (por ejemplo, CutSheetRX, de Senter Farms, que usa el LiDAR del USGS). En Raíz se adapta a lo que hay en Delicias y a lo que pide el reto: SRTM/NASADEM está en la lista oficial, y el reto menciona erosión, infiltración y lluvia extrema.

| Qué | Cómo | Escala y rótulo |
|---|---|---|
| **Capa «Relieve y escurrimiento»** en el centro de control | Pendiente, dirección de flujo y acumulación de flujo calculadas con NASADEM (30 m, NASA) sobre la zona piloto; líneas animadas que siguen las rutas por donde se concentra el agua | Zona, no parcela. Rótulo: «regional, 30 m» |
| **Botón «Simular tormenta»** | Lámina de una lluvia fuerte de la propia serie (percentil 95 de la lluvia diaria de GPM IMERG o POWER en la zona) distribuida sobre la acumulación de flujo; muestra hacia dónde escurre y dónde se junta | Ilustrativo; sin hidrograma ni profundidades |
| **Renglón Suelo de la ficha** | Pendiente media de la parcela, si recibe escurrimiento de parcelas vecinas y si cae en una depresión del terreno | Indicador de contexto, junto a los días de suelo desnudo (erosión) |
| **Con LiDAR del INEGI** (solo si cubre la zona) | Si el INEGI tiene modelo LiDAR de 5 m sobre la zona piloto, se calcula además el encharcamiento dentro de la parcela | Si no hay cobertura, no se hace y se declara |

- **Por qué no por parcela con NASADEM:** las parcelas de riego por gravedad están niveladas y a 30 m el detalle interno no es defendible.
- **Qué no hace:** no calcula cortes ni rellenos de tierra, no diseña drenes y no sustituye un levantamiento topográfico.
- **Prioridad (decisión de Cristian, 10-nov, 22:52):** la capa de zona y el botón «Simular tormenta» suben al núcleo, porque son lo más visual de la demo y cuestan poco (una exportación de NASADEM y un cálculo en Colab). Los indicadores por parcela y el encharcamiento con LiDAR quedan en segunda línea. Si hay retraso, la tormenta se simplifica a una imagen fija con las rutas, pero no se elimina.
- **Datos de elevación (investigación del 11-nov):**
  - Capa de zona: **NASADEM** (NASA, 30 m, dominio público), porque es dato de la NASA y suma en Pertinencia. Copernicus GLO-30 solo como contraste opcional (exige aviso de licencia). FABDEM no se usa (licencia no comercial). El CEM 3.0 del INEGI (15 m) no se usa: sus alturas son enteros en metros y una evaluación publicada lo desaconseja para hidrología [P].
  - LiDAR del INEGI: existe a 5 m (terreno y superficie) con cobertura parcial y precisión vertical de 15 a 90 cm [V]; no se confirmó si cubre el DR-005 [NE]. Cartas 1:50,000 del núcleo del distrito: H13C88 Ciudad Delicias (contiene el centro de la zona piloto), H13C78 Meoqui, H13C89 Saucillo y H13C79 Salaiz [V].
  - Aun con LiDAR, el encharcamiento se rotula «zonas bajas relativas (indicativo)» con el año del vuelo, porque las parcelas se renivelan y los charcos son de 5 a 15 cm.
  - Licencia del INEGI: permite redistribuir derivados con «Fuente: INEGI, nombre del producto» y aviso de transformación; se declara en `DATA_LICENSE`, fuera de Apache 2.0.
- **Antes del sábado, sin código:** en https://www.inegi.org.mx/app/geo2/elevacionesmex/ → «Modelos Digitales de Elevación» → Terreno → 5 m → Fuente «LiDAR», revisar las hojas 1:10,000 de H13C88 y H13C78 (y de H13C89 y H13C79); repetir con «Fotogrametría» para no confundir el origen; captura de pantalla; si hay hojas LiDAR, descargar la que contiene 28.19 N, −105.45 O y anotar del metadato el año de vuelo, el datum y la exactitud. Respaldo: visor https://gaia.inegi.org.mx/mdm6vuelos/ (capa «Lidar disponible», Chihuahua). La tabla resultante decide el sábado si se activa el encharcamiento.

## 5. Cálculo: lo que cambia
- **Unidad:** millares por hectárea. 1 millar/ha = 1,000 m³/ha = 10 cm de lámina.
- **Lámina bruta en parcela** L = (ETc − lluvia efectiva) ÷ eficiencia parcelaria, con P10, P50 y P90 (S3; sin cambio).
- **Dotación** D: valor del deslizador. Supuesto [S]: el millar se mide en la toma de la parcela.
- **Cobertura** = mín(1, D ÷ L P50). **Hectáreas que alcanzan** = superficie × cobertura. Se muestran siempre, con su rango.
- **Semáforo** (S8, sin cambio): verde si D cubre P90; ámbar si cubre P50; rojo si no cubre P50; gris si hay abstención.
- **Plazo:** anual 1 año; alfalfa 3–4 años [P]; nogal, horizonte de cálculo de 10 años [S] (la vida de la huerta se cita con fuente INIFAP antes de publicarla).
- **Compromiso** = L P50 × años de plazo restantes. En alfalfa, plazo restante = plazo − edad observada, con mínimo cero. En nogal no se descuenta la edad: el compromiso se calcula siempre a 10 años.
- **Estado:** libre (anual o descanso); por vencer (alfalfa con 3 años o más [S]); comprometida (alfalfa joven o nogal).
- **Agua ya comprometida** de la zona piloto = suma de superficie × L P50 de las parcelas perennes ÷ (D × superficie total). Si pasa de 100 %, la diferencia sale de pozos o queda sin cubrir; la ficha lo dice y enlaza con La gota.
- **Memoria:** con el NDVI mensual de HLS por parcela, cada año agrícola se clasifica con reglas: cultivo de verano (máximo de jun–sep ≥ 0.40), de invierno (máximo de dic–mar ≥ 0.40), doble o descanso. La alfalfa se reconoce como perenne cuando la parcela está verde (NDVI ≥ 0.40) 8 meses o más dos años seguidos. El nogal pierde la hoja en invierno y no cumple esa regla: su condición de huerta la da el mapa de cultivos de 2026 y la memoria solo calcula desde cuándo muestra ese patrón. Umbrales [S] con sensibilidad 0.35–0.45; se validan con las etiquetas a ciegas de 2026.
- **Suelo desnudo:** días con NDVI < 0.2 del 1-feb al 30-abr, ahora medidos cada año; la ficha muestra la mediana.
- **Ejemplo de escala** (láminas del INIFAP [V]; la herramienta usa su propio cálculo): 10 ha con 3.5 millares/ha reciben 35 millares, que alcanzan para 2.0 ha de alfalfa (17.5), 5.1 ha de algodón (6.8) o 6.4 ha de maíz forrajero (5.5).

## 6. Pruebas a la vista
| # | Prueba | Criterio declarado antes de ver el resultado |
|---|---|---|
| 1 | Mapa de cultivos | F1 macro con bloques espaciales de 5 km; áreas con Olofsson; abstención si p < 0.6 |
| 2 | Back-test 2026 (H1, preregistrado) | Con datos al 14-mar, el error al 14-jul debe ser menor que el de las líneas base L1 y L1-s. Verdad: salida por obra de toma de La Boquilla (SIH) |
| 3 | Experimento natural de 2025 (H3, se añade al preregistro) | En el año sin agua de las presas, la proporción de parcelas anuales con cultivo de verano cae 25 puntos o más frente a la mediana 2019–2024, y la de huertas de nogal se mantiene a 10 puntos o menos de su mediana. Se publica el número de parcelas de cada grupo |
| 4 | Verificador de cifras | 30 casos, con trampas; 0 % de cifras alteradas por la IA |
| 5 | Contraste regional de ET y pruebas automáticas | ET agregada frente a SSEBop VIIRS (USGS) y WaPOR v3 (FAO); FAO-56 contra los ejemplos resueltos del manual; cierre del balance de La gota |

- H2 del preregistro (subsidencia con OPERA) se retira; OPERA sale del alcance.
- El preregistro se publica en OSF el mié 11-nov, con H3 incluida (texto en el Anexo B).

## 7. Criterios y premios
| Criterio de la sede | Lo que verá el jurado |
|---|---|
| Impacto | Distrito real, año sin presa documentado, acuífero con déficit oficial; el indicador de agua ya comprometida |
| Creatividad | El plazo del agua: el cultivo como compromiso de varios años |
| Validez | Las cinco pruebas, bandas P10–P90, abstención y cada cifra con su fuente |
| Pertinencia | Rotación actual más dos alternativas con las cinco respuestas del reto; renglón Suelo con días de suelo desnudo medidos; HLS y POWER dentro del cálculo |
| Presentación | Una historia en cuatro minutos: 2025, el compromiso, La gota, las pruebas |
| Diversidad | Perfil y rol de cada integrante por fortaleza; técnicos y mentores como conocimiento externo |

| Premio | Pieza que lo sostiene |
|---|---|
| Nominación global de la sede | Los seis criterios; es el primer filtro |
| People's Choice (17–20 nov) | Video de 30 s y publicaciones del equipo; sin bots, que descalifican |
| #MejorMeme | Historias en Instagram durante el evento, con el nombre del equipo y la etiqueta (P6) |
| Local Impact (principal) | Delicias, millares, técnico y WhatsApp |
| Best Use of Data | Memoria de 2016–2026 con HLS, ET donde OpenET no cubre y relieve con NASADEM y lluvia de GPM |
| Best Use of Science | Dos hipótesis preregistradas con resultado publicado |
| Best Use of Technology | Un comando reconstruye todo; pruebas automáticas que condicionan la publicación; verificador de cifras |
| Storytelling y Art & Technology | La gota y la franja de memoria |
| Galactic Impact, Mission Concept, Global Connection | Método replicable en cualquier distrito con presa y acuífero, con datos abiertos y un archivo de parámetros por distrito |

- En la fase global la categoría la asignan los jueces y cada premio va a un proyecto distinto. No se puede garantizar ningún premio; lo que se controla es cubrir los seis criterios con evidencia.
- En el formulario se mantienen Local Impact y Best Use of Data.

## 8. Orden de construcción y de corte
| Nivel | Contenido | Hito |
|---|---|---|
| **Núcleo (no se corta)** | Capa de relieve y «Simular tormenta» a escala de zona (§4 bis); parcelas y cultivo de 2026; demanda con banda; deslizador y semáforo; agua ya comprometida; ficha con plazo, hectáreas y cinco respuestas; La gota (en barras si hace falta); back-test H1; aviso de juicio local | Sáb 14:30, pantallas con datos simulados; sáb 20:30, una parcela real publicada |
| **Segunda línea** | Memoria por parcela 2016–2026 y H3; edad de la alfalfa y estado «por vencer»; WhatsApp y ficha imprimible; indicadores de relieve por parcela y encharcamiento con LiDAR (§4 bis) | Dom 8:00, funciones congeladas |
| **Si sobra tiempo** | Memoria desde 2013; serie del distrito con MODIS; historial de superficie regada de Conagua; Presto | — |
| **Fuera** | OPERA y subsidencia, optimizador, agente conversacional, sensores | — |

Dom 11:00, código congelado. Dom 13:00, primer envío; 14:30, envío final.

## 9. Código primero
- Todo lo automatizable se programa desde el sábado a las 9:00; antes no se escribe código.
- Un comando reconstruye datos, cálculo y web desde los datos en caché; una opción vuelve a pedirlos.
- Pruebas automáticas: FAO-56 contra el manual, cierre del balance, 30 casos del verificador y «ninguna cifra en la página que no venga de los datos». GitHub Actions publica solo si pasan.
- `manifest.json` generado con fuente, fecha y script de cada cifra. Zona piloto y umbrales en `data/params.json`.
- Sigue siendo manual: etiquetas de referencia, entrevistas, mentorías, ensayo y envíos.

## 10. Equipo
| Persona | Responsable de |
|---|---|
| Cristian | Repositorio, motor, web, pruebas automáticas y envío |
| P2 | Series de HLS de 2026 y memoria |
| P3 | Etiquetas, exactitud del mapa y H3 |
| P4 | Clima, demanda y back-test H1 |
| P5 | Dotaciones, plazos, rotaciones y tabla única de cifras |
| P6 | Entrevistas, textos, página, video, People's Choice y meme |

## 11. Límites que se declaran
No reparte, vende ni intercambia agua (art. 22 de la LAN). No pronostica la presa. No promete ahorros. No sustituye al agricultor ni al técnico. Las parcelas son estimadas; el mapa se valida contra fotointerpretación, no contra campo. OpenET aún no cubre México.

## 12. Por confirmar, con decisión por omisión
| Pendiente | Cuándo | Mientras tanto |
|---|---|---|
| Punto de medición del millar y dotaciones reales | Técnico de módulo o mentoría del sábado | Toma de parcela [S]; cifras de prensa [P] |
| Vida del alfalfar y de la huerta de nogal, con fuente | Antes del sábado | 3–4 años [P]; horizonte de 10 años [S] |
| Umbrales de NDVI de la memoria | Sábado, con las etiquetas de 2026 | 0.40, sensibilidad 0.35–0.45 [S] |
| H3 en el preregistro | Mié 11-nov | Texto del Anexo B |
| Tamaño de la zona piloto | Sábado, al recortar las parcelas | Todas las parcelas del rectángulo si la cuota de Earth Engine lo permite; H3 publica cuántas hay en cada grupo |
| Cobertura LiDAR del INEGI en la zona piloto | Antes del sábado, en el navegador | Solo NASADEM a 30 m, a escala de zona |
| Nombres completos de los integrantes 2 a 6 | Antes del jue 12-nov, 21:00 | Anteproyecto listo salvo ese dato |

## Anexo A. Textos del anteproyecto (versión 2)
**Frase que se añade al final de «Problema»:**
En 2025 el distrito no recibió agua de las presas: se sembraron entre 12,000 y 15,000 hectáreas con pozos y se autorizaron 87.4 hm³ de agua subterránea para riegos de supervivencia, sobre todo de nogal (prensa con cifras de Conagua).

**Objetivos que se añaden al final de la lista:**
- **Plazo del agua.** Mostrar cada cultivo como un compromiso de agua con plazo: cuánta agua pide al año, por cuántos años obliga y qué parte cubre la presa en cada escenario, expresada en hectáreas de la parcela.
- **Memoria de la parcela.** Reconstruir con HLS la memoria de cada parcela (cultivo de verano, de invierno, perenne o descanso, año por año) para identificar la rotación actual, medir los días de suelo desnudo y probar el método con el ciclo 2025, en el que el distrito no recibió agua de las presas.

**«Solución» (sustituye al texto anterior):**
Raíz – From Dam to Root es una herramienta web de planeación previa a la siembra. Su idea central es el plazo del agua: sembrar un cultivo equivale a comprometer agua por un tiempo. Un cultivo anual la compromete un ciclo; la alfalfa, varios años; el nogal, décadas. Para cada parcela, la herramienta compara la rotación actual con dos alternativas y da tres datos de cada una: cuánta agua pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. Tiene tres pantallas:
1. Centro de control. Mapa de la zona piloto con un deslizador de dotación en millares por hectárea, con tres marcas (como 2025, como 2026 y año normal) y un interruptor de lluvia −20 %. Muestra qué parte de la dotación ya está comprometida por los cultivos perennes y un semáforo por parcela.
2. Ficha de parcela. La memoria de la parcela desde 2016; la rotación actual y dos alternativas con tres renglones (agua, suelo y dinero); La gota, que sigue el agua de la presa al acuífero, con la opción de goteo y un tope de consumo; y el botón «¿Por qué?», con las cinco respuestas que pide el reto.
3. Mensaje al agricultor. Vista previa de un mensaje de WhatsApp con las tres opciones y una ficha imprimible.

**«Validación» (sustituye al texto anterior):**
Cinco pruebas visibles para el jurado: (1) exactitud del mapa de cultivos, con validación espacial por bloques y etiquetas a ciegas; (2) back-test del ciclo 2026, preregistrado: estimación con datos al 14 de marzo frente a la salida de La Boquilla al 14 de julio; (3) experimento natural de 2025, también preregistrado: el satélite debe mostrar la caída de los cultivos anuales y la permanencia de las huertas de nogal en el año sin agua de las presas; (4) verificador de cifras: 30 casos de prueba en los que la IA no puede alterar ningún número; (5) contraste regional de la evapotranspiración con SSEBop (USGS) y WaPOR (FAO). El resultado de cada prueba se publica, sea favorable o no.

**«Diferenciador» (sustituye al texto anterior):**
En la revisión de literatura y de productos no encontramos una herramienta que muestre al agricultor, por parcela, cada cultivo como un compromiso de agua de varios años frente a lo que entrega la presa. Las herramientas disponibles programan el riego de lo ya sembrado o comparan rotaciones de un solo ciclo. Raíz añade tres elementos: el plazo del compromiso; la contabilidad del agua consumida y no solo de la extraída, que evita presentar como ahorro lo que deja de recargar el acuífero; y pruebas preregistradas cuyo resultado se publica.

**Otros ajustes de la versión 2:**
- En el rubro 4 se elimina OPERA DISP-S1, que sale del alcance.
- «Módulo piloto» pasa a «zona piloto» en todo el documento, porque el límite del módulo no es público.
- Fuente que se añade: Ciclo 2025 sin agua de las presas: prensa local con cifras de Conagua (El Diario de Delicias, 31 de enero de 2025, para los 87.4 hm³; prensa local de diciembre de 2025 para las 12,000 a 15,000 hectáreas).

## Anexo B. H3 para el preregistro (inglés)
**H3 (confirmatory; satellite natural experiment).** In 2025 DR-005 received no dam allocation (press-reported). Using HLS monthly composites per estimated field in the pilot area: (a) among annual-crop fields (fields that the parcel memory does not flag as perennial in 2024 and that the 2026 crop map does not classify as pecan orchard), the share with an active summer crop in 2025 (maximum monthly NDVI in Jun–Sep ≥ 0.40) is at least 25 percentage points below the 2019–2024 median of the same share; and (b) among pecan orchards (fields classified as pecan in the 2026 crop map), the same share in 2025 is within 10 percentage points of its 2019–2024 median. H3 is supported only if (a) and (b) hold. Orchards are identified in 2026, so orchards removed before 2026 are not observed; this survivorship limitation is stated, and the same share is also reported for fields that showed the orchard pattern throughout 2019–2024. The number of fields in each group is reported. Alfalfa is reported descriptively. Thresholds of 0.35 and 0.45 are reported as sensitivity. Known-outcome disclosure: the press reported 12,000–15,000 ha planted with wells in 2025; no satellite series was computed before registration. The former H2 (subsidence, OPERA) is withdrawn.
