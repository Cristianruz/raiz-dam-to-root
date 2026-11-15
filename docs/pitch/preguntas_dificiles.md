<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Preguntas difíciles · respuestas para los 3 minutos de preguntas

**BORRADOR para que el equipo lo ajuste (responsable de presentación y pitch).** Cada respuesta se sostiene con una cifra del repo; si el repo cambia, cambia la respuesta.

## Cómo usar este documento

- **Respuesta:** de 2 a 4 frases, para decir en 15 a 35 segundos. Los 3 minutos alcanzan para unas seis a ocho preguntas.
- **Cifra** y **Archivo:** no se leen; sirven si el jurado pide el dato o la fuente.
- **Pendiente:** lo que todavía no está, con la frase honesta que el equipo puede decir tal cual.
- Hoy todas las piezas del gemelo y el escenario de goteo están en la página (`web/app.js`; `web/data/cubo.json` → `meta.goteo.disponible`: true), y las protagonistas son P0757, P0632 y L0175 (`web/data/parcelas.geojson`). Las respuestas ya no traen variantes.
- Las cifras se releyeron del cubo reconstruido con las correcciones del motor (commit `1c6619b`).
- Si no sabe la respuesta, dígalo: «Eso todavía no lo sabemos; para saberlo necesitamos…». Es mejor que improvisar un número.
- Etiquetas de las cifras: [V] verificada en fuente primaria, [P] prensa, [S] supuesto declarado, [NE] no encontrada.

---

## A. Jurado local (agricultores, técnicos, gente del distrito)

### 1. ¿Quién decide, la herramienta o el agricultor?
- **Respuesta.** Decide el agricultor, con su técnico. ROOT pone las opciones lado a lado y no marca ninguna como la mejor. Cada ficha y cada mensaje llevan el aviso de que la herramienta apoya y no sustituye ese juicio.
- **Cifra.** Ninguna: es una regla del proyecto.
- **Archivo.** `CLAUDE.md`, regla 10; `web/index.html` (aviso fijo); `web/js/mensaje.js` (aviso en español).

### 2. ¿Reparte o vende agua? ¿Pronostica la presa?
- **Respuesta.** No. La dotación y la superficie autorizada las deciden Conagua y los módulos. La dotación del deslizador la escoge quien usa la página, y sus tres marcas son cifras de prensa, no predicciones. El mensaje al agricultor lo dice: «Es una simulación; la asignación oficial la decide Conagua.»
- **Cifra.** Tres marcas: 1, 3.5 y 9.5 millares por hectárea, las tres [P]; el deslizador va de 0 a 12.
- **Archivo.** `docs/sintesis/S9_proyecto_definitivo.md` §11 (art. 22 de la Ley de Aguas Nacionales); `LIMITATIONS.md`; `web/data/cubo.json` → `dotaciones`.

### 3. ¿Las opciones de rotación son recomendaciones?
- **Respuesta.** No. Son comparaciones: la rotación de hoy y sus alternativas, lado a lado, con el agua que pide cada una, y ninguna se marca como la mejor. Salen de la tabla de rotaciones del proyecto; donde la tabla da menos de dos alternativas, las completamos con una propuesta del equipo y la tarjeta lo dice. Cada opción trae sus filtros: la mayoría dice «needs a local check», porque necesitan un dato de la parcela que no tenemos; la helada se muestra como probabilidad junto a la fecha de siembra y no descarta nada.
- **Cifra.** 1,282 opciones en la página: 828 de la tabla oficial y 454 propuestas del equipo, rotuladas «[S] team proposal, not from the agronomic guide» (barbecho y cereal de invierno). 824 opciones llevan filtros, 1,965 resultados en total: 1,847 «needs a local check» y 118 decididos con la memoria de la parcela (el corte de riego de verano solo para un alfalfar establecido: 103 pasan y 15 avisan). La página evalúa en vivo, contra el deslizador, la dotación mínima para establecer alfalfa. El renglón «Money» dice «No verified data» en todas. Cuentas propias sobre `web/data/cubo.json`.
- **Archivo.** `data/processed/opciones_b3.json` (maestro §5.2); `web/data/cubo.json` → `meta.opciones`, `opciones[].origen_opcion`, `opciones[].filtros[].estado`; `LIMITATIONS.md`, «Crop options»; `docs/decisiones/2026-11-14_opciones_b3.md`.
- **Pendiente.** «Un filtro que no podemos decidir se queda como "needs a local check": nunca lo mostramos como aprobado.»

### 3 bis. ¿Por qué la huerta de nogal no tiene alternativas?
- **Respuesta.** Porque una huerta no rota: así lo dice la tabla de rotaciones del proyecto, y arrancar una huerta no es una rotación. En vez de inventar una alternativa sin fuente, la ficha dice el motivo y muestra lo que sí aplica: el agua que la huerta compromete a diez años, la lámina que se suele aplicar en el distrito y el escenario de goteo con tope de consumo.
- **Cifra.** 105 huertas con una sola opción. L0175: 18.84 millares/ha al año en el modelo; 13.72 aplicados en el distrito, medias 2009–2016 [V]; con 3.5 millares/ha, alcanza para 2.0 de 10.76 ha con la del modelo y para 2.7 con la aplicada.
- **Archivo.** `web/data/cubo.json` → `opciones_catalogo.nogal`, `parcelas.L0175.sin_rotacion` y `agua.lamina_local`; `docs/decisiones/2026-11-15_nogal_sin_alternativas.md`; `LIMITATIONS.md`, «Crop options».
- **Pendiente.** «El maestro dice que en la huerta aplican escenarios de riego mínimo; todavía no tenemos esa lámina con fuente, y por eso no la calculamos.»

### 3 ter. El reto pide combinar las prioridades del agricultor. ¿Dónde está eso?
- **Respuesta.** La herramienta no las combina por usted. Pone las opciones lado a lado, cada una con sus renglones de Agua, Suelo y Dinero, y usted las pondera: no hay pesos ni una opción «mejor». El renglón de Dinero dice «No verified data», porque no tenemos márgenes con fuente.
- **Cifra.** Ninguna.
- **Archivo.** `LIMITATIONS.md`, «Crop options» («Farmer priorities are not combined by the tool»); `README.md`, «Limitations»; `web/app.js` (renglón «Money»).
- **Pendiente.** «Para ponderar con datos necesitamos márgenes verificados por cultivo; la página no los inventa.»

### 4. ¿De dónde salen las dotaciones del deslizador?
- **Respuesta.** De la prensa local, y así están rotuladas. «Like 2025» es un millar por hectárea, de pozos. «Like 2026» y «Normal year» vienen de una nota que no leímos directamente, por eso dicen «por confirmar». Usted puede mover el deslizador a la dotación que le confirme su módulo.
- **Cifra.** «Like 2025»: 1 millar/ha [P]. «Like 2026»: 3 a 4, punto medio 3.5 [P, por confirmar]. «Normal year»: 9 a 10, punto medio 9.5 [P, por confirmar].
- **Archivo.** `web/data/cubo.json` → `dotaciones.marcas`; `data/params.json` → `dotaciones`; `docs/sintesis/S8_enfoque_definitivo.md` §2.
- **Pendiente.** «Nos falta la tabla de dotaciones con la fecha de lectura de cada nota.» (`docs/reparto_faltantes.md`, D4).

### 5. ¿Dónde se mide el millar?
- **Respuesta.** Lo suponemos en la toma de la parcela, y la página lo dice. Es un supuesto, no un dato. Si se mide en otro punto, cambia la cuenta y la corregimos.
- **Cifra.** Ninguna: supuesto [S].
- **Archivo.** `web/data/cubo.json` → `dotaciones.punto_medicion`; S9 §5 y §12.
- **Pendiente.** «Es una de las preguntas que llevamos a la mentoría y al técnico de módulo. Todavía no tenemos la respuesta escrita.» Si la mentoría ya la dio, anótela aquí con el cargo de quien la dio y la hora.

### 6. ¿Por qué 781 parcelas salen en gris?
- **Respuesta.** Porque el mapa de cultivos prefiere abstenerse a adivinar. Usa reglas sobre el verdor del satélite, y esas reglas no separan entre sí a los cultivos anuales de verano. Una parcela gris no lleva opciones; la página pide revisarla con un técnico.
- **Cifra.** 781 de 1,239 parcelas, 63.0 %; son 66.2 % de la superficie. De las 781: 462 son anuales de verano que las reglas no distinguen, 222 no entran en ningún grupo y 97 tienen un límite de parcela con confianza menor de 50.
- **Archivo.** `LIMITATIONS.md`, «Field boundaries and crop map»; `web/data/pruebas.json` (prueba 1); `data/processed/cultivos_parcelas.csv`.
- **Pendiente.** «Con las etiquetas a ciegas del equipo se podrá entrenar un clasificador y medir su exactitud. Esas etiquetas todavía no se entregan.» (`docs/reparto_faltantes.md`, H5 y D7).

### 7. ¿Los límites de mi parcela están bien?
- **Respuesta.** Son estimados, no un catastro. Vienen de un modelo de Fields of The World que aquí trabaja fuera de la región donde se entrenó: su conjunto de referencia no incluye a México. Por eso cada parcela trae su confianza y las de confianza baja se abstienen.
- **Cifra.** 137 de 1,239 parcelas tienen confianza menor de 50. Las tres protagonistas: 54 o 55 (P0757, 55; P0632, 54; L0175, 55).
- **Archivo.** `LIMITATIONS.md`; `web/data/parcelas.geojson` → `ftw_confianza`; `data/params.json` → `mapa.ftw_confianza_min`.
- **Pendiente.** «Una persona del equipo todavía no revisa a ojo, en color verdadero, las tres parcelas que mostramos.» Son P0757, P0632 y L0175 (`web/data/parcelas.geojson`; `docs/reparto_faltantes.md`, D3). Una sesión de IA sí las comparó con imágenes de Sentinel-2 (rama `datos-satelite`, `docs/revision_protagonistas.md`). De ahí salió el cambio de P0244 por P0632, y también una advertencia: el contorno de L0175 incluye un lote sin cultivo, así que su nogal ocupa menos que el polígono.

### 8. Su alfalfa pide 28.4 millares y el INIFAP 17.5. ¿Por qué tanta diferencia?
- **Respuesta.** Es cierto y lo publicamos. El modelo calcula toda el agua que pediría una alfalfa bien regada y la divide entre una eficiencia de riego que supusimos. Antes de esa división, lo que el modelo pide queda cerca de la lámina del INIFAP, en alfalfa, algodón y maíz forrajero. Pero eso no quiere decir que todo sea la eficiencia: según el modelo, la planta también consume más de lo que se estima para el distrito. Por eso la ficha pone, junto a la necesidad del modelo, lo que aquí se suele aplicar, con las hectáreas que alcanzarían; el semáforo sigue con la del modelo. No sabemos todavía cuál de las dos se acerca más a su parcela.
- **Cifra.** Lámina bruta del modelo: 28.4 millares/ha (rango de 23.13 a 35.16); INIFAP: 17.5 [V] (S9 §5; de 17.0 a 18.0 en `docs/modelo_vs_practica.md`). Lámina **neta** del modelo, antes de dividir entre la eficiencia (cálculo propio con `rotaciones.json`, Delicias – Saucillo, lluvia 0 %): alfalfa 16.26 frente a 17.5 (razón 0.93), algodón 7.20 frente a 6.8 (1.06) y maíz forrajero 5.40 frente a 5.5 (0.98); la lámina del INIFAP ya incluye las pérdidas de la parcela, así que es un contraste, no una calibración. Agua que consume la planta (ETc): 1,748 mm en el modelo frente a 1,139 mm estimados en el DR-005 (Villalobos-Cano et al. 2024, medias de 2009 a 2016, con Hargreaves y no con Penman-Monteith). Con eficiencia de 0.60 a 0.70 la lámina bajaría a 25.1, todavía arriba de los 17.4 aplicados. En la ficha de P0757, con 3.5 millares/ha: alcanza para 1 de 7.95 ha con la lámina del modelo y para 1.6 con la aplicada en el distrito (17.42 [V]). Para el nogal, el cubo trae la aplicada: 13.72 frente a 18.84 del modelo en L0175. Cuidado: estos 1,139 mm no son los 1,139.5 mm de la pregunta 17; son dos cifras distintas.
- **Archivo.** `docs/modelo_vs_practica.md` (§1 a §4); `data/processed/rotaciones.json` → `lamina_bruta_millares` (`p50`, `neta_mm_p50`, `etc_mm_p50`); `web/data/cubo.json` → `agua.lamina_local`; `README.md`, «Open question: model against INIFAP depth»; `LIMITATIONS.md`, «Water demand»; S9 §5.
- **Pendiente.** «Necesitamos que un técnico del distrito nos diga cuánta agua se aplica de verdad a la alfalfa, qué eficiencia es realista en riego por gravedad y en qué condiciones valen las láminas del INIFAP.» Dos cuidados al decirlo: el estudio local no dice en qué punto se midió el agua aplicada, y sus cifras son promedios del distrito, no de cada parcela. No diga que con otra eficiencia «alcanza para más hectáreas»: no lo sabemos.

### 9. ¿Por qué no hay dinero en la ficha? ¿Y el goteo?
- **Respuesta.** Dinero: no tenemos datos verificados, y un número sin fuente no entra; el renglón «Money» dice «No verified data». El goteo sí se muestra en «Follow the drop», con una eficiencia indicativa de la FAO que no se midió en el distrito, y así va rotulado. Con goteo hay que contar las dos cosas: sale menos agua de la presa, pero también regresa menos al acuífero.
- **Cifra.** Eficiencia de aplicación indicativa: 0.9 con goteo y 0.6 con riego superficial, las dos [V] «indicative, not local». En la huerta L0175, con goteo y tope de consumo, la página muestra −33 % de agua de la presa y −33 % de regreso al acuífero; sin tope, +50 % de consumo y el aviso «Not recommended». 83.3 % de la recarga del acuífero viene de los retornos del riego [V].
- **Archivo.** `data/processed/supuestos.json` → `ea_goteo` y `ea_superficial_referencia` (FAO, Irrigation Water Management Training Manual No. 4, Anexo I, Tabla 8); `web/data/cubo.json` → `meta.goteo` y `parcelas.L0175` (bloques `gota_goteo_con_tope`, `gota_goteo_sin_tope` y `tope_consumo`); `docs/decisiones/2026-11-14_opciones_b3.md` §3; `LIMITATIONS.md`, «Crop options»; S9 §2; `docs/referencias/ref_cultivos_sdr.md`.
- **Pendiente.** «La eficiencia del goteo es un valor general de la FAO; no tenemos una medida del distrito. No prometemos que el goteo libere agua.»

### 10. ¿Por qué estas dos zonas y no todo el distrito?
- **Respuesta.** Son dos rectángulos de diseño, trazados alrededor de localidades que propuso el equipo. El límite de los módulos de riego no es público, así que no podíamos usarlo. Las dos zonas pueden no representar a todo el distrito, y lo declaramos.
- **Cifra.** Delicias – Saucillo: 940 parcelas y 19,145.19 ha. Lázaro Cárdenas (Meoqui): 299 parcelas y 5,847.82 ha.
- **Archivo.** `docs/decisiones/2026-11-14_dos_zonas.md`; `web/data/cubo.json` → `zonas`; `LIMITATIONS.md`, «Pilot areas and data status».

### 11. ¿Sirve sin internet, en la parcela?
- **Respuesta.** Sí: con «Install app» se instala en el teléfono o la laptop y sigue funcionando sin red con la última copia sincronizada. Hay un segundo respaldo: un archivo que se abre con doble clic, sin servidor. Sin red no se dibuja el mapa de fondo: las parcelas salen sobre un fondo liso.
- **Cifra.** Ninguna.
- **Archivo.** `README.md`, «How it works» y «How to run» (`python motor/demo_offline.py`); `web/sw.js`; `docs/decisiones/2026-11-14_gemelo_digital.md`, punto 4.

### 12. ¿Guardan mis datos?
- **Respuesta.** No. La página no pide nombre ni teléfono y no envía nada. La vista de WhatsApp es una maqueta para ver cómo se leería el mensaje.
- **Cifra.** Ninguna.
- **Archivo.** `web/js/mensaje.js` («a mock-up: nothing is sent»); `web/app.js` («Nothing is sent or stored»).

### 13. ¿Ya lo probaron con agricultores o con técnicos?
- **Respuesta.** No tenemos una prueba registrada con agricultores, y no vamos a decir que sí. Lo que pedimos hoy es justo eso: que la abran, busquen su parcela y nos digan dónde está mal.
- **Cifra.** Ninguna.
- **Archivo.** `docs/equipo/README.md` §2 (la prueba de usabilidad estaba prevista para el sábado a las 18:00); `docs/progreso.md` no registra su resultado.
- **Pendiente.** Si la prueba o la mentoría ya se hicieron, cambie esta respuesta por lo que se anotó, con el cargo de la persona y la hora, sin nombre.

### 14. ¿Qué sigue después del hackatón?
- **Respuesta.** Tres cosas, en este orden. Revisar con un técnico cuánta agua se aplica de verdad a cada cultivo, qué eficiencia de riego es realista y dónde se mide el millar. Clasificar las parcelas grises con las etiquetas del equipo y medir la exactitud del mapa. Y sentarnos con agricultores de las dos zonas a corregir parcelas y opciones.
- **Cifra.** 781 parcelas por clasificar; eficiencia supuesta de 0.45 a 0.70 [S]; la lámina de alfalfa del modelo es 1.63 veces la aplicada en el distrito.
- **Archivo.** `docs/reparto_faltantes.md`; `LIMITATIONS.md`; `README.md`, «Limitations»; `docs/modelo_vs_practica.md`.
- **Pendiente.** Lo que no se construyó se rotula «Next phase / vision»: agente conversacional, sensores y optimizador están fuera del alcance (S9 §8).

---

## B. Jurado técnico

### 15. ¿Por qué H1 no cumplió, y por qué lo muestran?
- **Respuesta.** El criterio se escribió antes de correr: al 14 de julio el modelo debía errar menos que dos cuentas sencillas, y erró más. El modelo calcula toda el agua que pediría el cultivo; el distrito usa mucha menos. Después probamos, también con la regla escrita antes, si acertaba en cómo se reparte el agua dentro del ciclo en años anteriores; tampoco se sostiene. Lo mostramos porque la regla era publicar salga como salga, y así se sabe cuánto creerle.
- **Cifra.** H1, al 14-jul-2026. Modelo P50: 904.6 hm³ (P10–P90 de 727.2 a 1,131.4). Referencia de prensa: 447.65 hm³. Líneas base: L1-s 404.5 y L1 367.2. Demanda del ciclo según el modelo: 1,185.7 hm³ frente a 600 hm³ autorizados. Variante anclada, que es una sensibilidad y no decide: 457.7 hm³, a 10.1 de la referencia; fue un año, no una regla, y no se presenta como punto a favor. H1-b, ciclos de 1999 a 2024: does not hold. El modelo gana a las dos formas simples en 6 de 26 años. Mediana del error: 8.66 puntos porcentuales, frente a 3.34 de la curva de ETo de NASA POWER y 7.9 de la lineal. Al 14 de julio el modelo da 76.2 % del agua del ciclo; lo observado es 68.0 %.
- **Archivo.** `docs/resultado_H1.md`; `docs/resultado_H1b.md`; `docs/h1b_especificacion.md`; `docs/h1_especificacion_operativa.md`; `docs/h1_verdad_sih.md`.
- **Pendiente.** «Es un back-test parcial: el cierre oficial del ciclo 2026 no está publicado, la referencia es de prensa y equivale a la caída de almacenamiento. Con un ciclo no hablamos de exactitud.» Sobre H1-b: «Es una prueba posterior, nacida del resultado de 2026; no es una de las cinco registradas y no cambia H1. Su regla se subió al repositorio antes de calcular.» Si preguntan qué forma sí sigue a la presa: la más sencilla, la curva de ETo de NASA POWER; es una descripción de los datos, no una hipótesis registrada. La sección «Tests in sight» de la página todavía no menciona H1-b: está en el `README.md` y en `docs/resultado_H1b.md`.

### 16. ¿Por qué H3 no se sostiene?
- **Respuesta.** Esperábamos que en 2025, sin agua de las presas, cayera mucho la siembra de verano en las parcelas anuales. Casi no cayó; el nogal sí se mantuvo, como esperábamos. Es coherente con lo que reportó la prensa, siembra con pozos, pero el satélite ve el verdor y no de dónde vino el agua; la maleza o la lluvia de monzón también pueden dar ese verdor.
- **Cifra.** Parcelas anuales (184): 82.6 % en 2025 frente a una mediana de 84.2 %, −1.6 puntos; el criterio pedía −25 o más. Nogal (44 huertas): 100 % frente a 100 %. Sensibilidad con umbrales 0.35 y 0.45: −0.3 y −6.8 puntos. Análisis posterior en las zonas nuevas: −16.0 puntos (580 parcelas) y 0.0 (210 parcelas).
- **Archivo.** `docs/resultado_H3.md`; S9, Anexo B (texto de la hipótesis).
- **Pendiente.** «El análisis registrado es el del rectángulo original, de 338 parcelas. Las dos zonas nuevas se reportan aparte porque las cambiamos después de conocer ese resultado.»

### 17. ¿Por qué el contraste de evapotranspiración difiere 53 %?
- **Respuesta.** En parte, porque no miden lo mismo. Nuestro número es lo que pedirían los cultivos clasificados si estuvieran bien regados; el de SSEBop es la evapotranspiración real de todo el rectángulo, con caminos, poblados y parcelas sin clasificar. Pero no todo se explica así: la prueba contra la presa y la lámina de alfalfa también dicen que el modelo calcula de más, y no podemos afirmar que acierte en el nivel. Es una comparación regional, no por parcela.
- **Cifra.** Modelo: 1,139.5 mm, con el cereal sembrado el 1-dic (antes 1,139.3; la diferencia no cambia). SSEBop VIIRS v6: 746.3 mm. Diferencia: +393 mm, +53 %, de octubre de 2025 a septiembre de 2026, en el rectángulo original; se concentra de marzo a junio, cuando nogal y alfalfa piden más. En las zonas nuevas: +28 % y +3 %; ahí el barbecho pesa 42 % y 60 % de la superficie clasificada, así que la cercanía no prueba que el modelo acierte más. Tres contrastes apuntan al mismo lado: prueba contra la presa, modelo ÷ observado = 2.0; lámina de alfalfa, modelo ÷ aplicada = 1.63; ET de satélite, modelo ÷ SSEBop = 1.53 en el rectángulo original.
- **Archivo.** `data/processed/et_contraste.csv`; `docs/resultado_A8.md`; `README.md`, «Validation», prueba 5; `docs/modelo_vs_practica.md` §2 (punto 4) y §4; `docs/ecostress.md` (rama `datos-satelite`).
- **Pendiente.** «El segundo contraste, con WaPOR, no se corrió. A escala de parcela tenemos ECOSTRESS, ya en la ficha, pero solo en días despejados y con pocas escenas por mes: apunta al mismo lado y no lo atribuimos a una causa.»

### 18. ¿Qué tiene de «gemelo digital» si no hay sensores?
- **Respuesta.** Usamos el término con sus partes a la vista: una réplica del terreno y de las parcelas, un estado observado por satélite, un modelo físico y escenarios que se ensayan antes de sembrar. No tiene sensores en campo ni datos en tiempo real: se actualiza cada vez que se reconstruye con datos nuevos, y así lo declaran el README y LIMITATIONS. En la página, la tarjeta «Twin status» separa lo observado, lo modelado y el escenario, con la fecha de cada fuente.
- **Cifra.** 1,239 parcelas; verdor de 2016 a 2026; relieve de 30 m.
- **Archivo.** `docs/decisiones/2026-11-14_gemelo_digital.md`; `README.md`, «Summary» («What the twin is not»); `LIMITATIONS.md`, «What "digital twin" means here».

### 19. ¿En qué se diferencia de OpenET o de un mapa de NDVI?
- **Respuesta.** OpenET no cubre México, y mide el agua que ya consumió lo que está sembrado. Un mapa de NDVI dice qué tan verde está la parcela. ROOT usa ese verdor como insumo y contesta otra pregunta, antes de sembrar: cuánta agua pide cada opción, por cuántos años obliga y para cuántas hectáreas alcanza la dotación que usted elija.
- **Cifra.** Plazo de la alfalfa: 3 a 4 años [P]. Nogal: horizonte de cálculo de 10 años [S].
- **Si preguntan por FARMS** (la herramienta de OpenET para productores). Es lo más parecido a ROOT y conviene decirlo: es gratuita, por parcela y con datos de Landsat. FARMS mide el agua que consume lo que ya está sembrado y arma reportes por parcela; ROOT compara opciones antes de sembrar, con los años que cada una compromete y contra la dotación de la presa. Son complementarias: si OpenET llegara a México, su ET entraría a ROOT como contraste, igual que hoy entran SSEBop y ECOSTRESS. No diga que OpenET «no sirve para planear cultivos» (su comunicado dice que informa la planeación) ni que ROOT es la primera o la única.
- **Contexto de OpenET [P], por resumen de búsqueda del 15-nov-2026 (la red de la sesión no dejó abrir las páginas; relea las cifras antes de decirlas):** desde el 15-dic-2025 cubre los 48 estados contiguos de EE. UU. en todas sus herramientas (empezó en 2021 con 17 estados del oeste); píxel de 30 m; acceso gratuito por Data Explorer, API y FARMS (Farm and Ranch Management Support, lanzada en marzo de 2025: linderos dibujados o elegidos, reportes por modelo y variable, y repetición automática diaria o mensual). Su expansión fuera de EE. UU. es hacia Brasil (OpenET-Brazil, cuenca del Amazonas); las notas no mencionan México.
- **Archivo.** S9 §4 y §11; `README.md`, «NASA Data» (OpenET) y «Summary». Notas: NASA Science, «NASA and Partners Expand Crucial Water Tracking Program» (16-dic-2025); Maven's Notebook (17-dic-2025); DRI y USGS, «FARMing with Data: OpenET Launches New Tool for Farmers and Ranchers» (mar-2025); Farms.com, «NASA OpenET FARMS Tool Helps Farmers Save Water».

### 20. ¿Qué datos de la NASA usan y para qué sirve cada uno?
- **Respuesta.** Cinco están dentro del cálculo o de una prueba publicada: HLS, POWER, NASADEM, GPM IMERG y VIIRS con SSEBop. SMAP, MODIS, GRACE, GLDAS y NLDAS están en el panel «Regional context»; GEDI y ECOSTRESS, en la ficha, como evidencia por parcela. Ninguna serie regional cambia el semáforo de una parcela.
- **Archivo.** `README.md`, «NASA Data»; `docs/decisiones/2026-11-14_recursos_del_reto.md`; `docs/referencias/recursos_reto.md`.

| Base de datos | Para qué la usa ROOT | Estado |
|---|---|---|
| HLS v2 (Landsat y Sentinel-2 armonizados, 30 m) | Verdor mensual por parcela: mapa de cultivos de 2026, memoria de 2016 a 2026, días de suelo desnudo y la prueba H3 | En uso |
| NASA POWER (clima diario) | Clima para calcular con FAO-56 el agua que pide cada cultivo; climatología de la prueba H1 | En uso |
| NASADEM (relieve, 30 m; SRTM reprocesado) | Rutas de escurrimiento y «Simulate a storm», a escala de zona; pendiente media y otros dos indicadores por parcela; relieve de la vista 3D | En uso |
| GPM IMERG V07 | Lluvia diaria por zona y la tormenta de referencia | En uso |
| VIIRS, con SSEBop v6 (producto de USGS, 1 km) | Contraste regional de la evapotranspiración modelada (prueba 5) | En uso |
| NASA POWER, temperatura mínima | Fechas de helada; probabilidad de helada junto a la fecha de siembra | En uso; informa, no descarta opciones |
| SMAP L4 | Humedad del suelo de la región, mes a mes | En uso; contexto regional |
| MODIS (verdor, ET y temperatura) | Verdor de la zona desde antes de HLS; segunda serie de ET; temperatura de la superficie | En uso; contexto regional |
| GRACE y GRACE-FO | Agua almacenada en la cuenca, una serie para toda la cuenca; no separa el acuífero | En uso; contexto regional |
| GLDAS-2.1 | ET y humedad en la zona de raíces, de un modelo de superficie | En uso; contexto regional |
| NLDAS-2 | Segunda fuente de lluvia y de evaporación potencial | En uso; contexto regional |
| GEDI L2A | Altura del dosel por parcela, para distinguir una huerta de un cultivo bajo; 1,072 de 1,239 parcelas tienen al menos un disparo | En uso; evidencia por parcela |
| ECOSTRESS | ET de días despejados por parcela, como contraste del modelo | En uso; evidencia por parcela |
| ERA5-Land (ECMWF y Copernicus; no es de la NASA) | Segunda fuente de temperatura mínima y de días con helada | En uso; contexto regional |
| GAEZ (FAO e IIASA; no es de la NASA) | Aptitud agroclimática de la zona por cultivo, nunca de una parcela | En uso; contexto regional |
| OpenET | No cubre México; en su lugar se usa SSEBop sobre VIIRS | No aplica |
| USDA, NRCS, CDL, NAIP, NLCD, PRISM, NWIS, CoCoRaHS, AMS, NASS y LANDFIRE | Cubren Estados Unidos. Equivalentes locales: SIAP, SIH de Conagua y SDR Chihuahua | No aplica |

Los límites de parcela son de Fields of The World, un dato de terceros que no está en la lista del reto.

### 21. ¿Cómo usaron IA y cómo evitan cifras inventadas?
- **Respuesta.** La IA escribió código y borradores a partir de nuestras especificaciones, y otras sesiones de IA, con contexto nuevo, lo revisaron. La IA no produce los números ni toma la decisión: el agua se calcula con FAO-56 y reglas explícitas. Ninguna cifra se escribe a mano en la página; todas se leen de los datos, y una prueba automática detiene la publicación si aparece una. En la app no hay un modelo de lenguaje: las explicaciones son plantillas con marcadores.
- **Cifra.** Verificador de cifras: 30 de 30 casos correctos, 5 de 5 trampas detectadas y 0 de 71 números alterados. Los 30 textos son plantillas.
- **Archivo.** `README.md`, «SI/AI tools used»; `docs/figuras/llm_eval.csv`; `tests/test_sin_cifras.py`; `web/data/manifest.json`; `AI_USAGE.md`.
- **Pendiente.** «El verificador se probó con plantillas. Con texto escrito por un modelo de lenguaje no se ha corrido: aparece como "not run".»

### 22. ¿Qué exactitud tiene el mapa de cultivos?
- **Respuesta.** No está medida, y la página lo dice con «not run». El mapa de hoy son reglas sobre el verdor mensual; el clasificador y la validación espacial necesitan etiquetas que el equipo todavía no entrega. Las reglas distinguen descanso, alfalfa, nogal y cereal de invierno, y se abstienen con los anuales de verano.
- **Cifra.** 458 parcelas clasificadas: 219 en descanso, 118 de alfalfa, 105 de nogal y 16 de cereal de invierno. Ninguna clasificada como maíz, sorgo, algodón o chile.
- **Archivo.** `LIMITATIONS.md`, «Field boundaries and crop map»; `web/data/pruebas.json` (prueba 1).
- **Pendiente.** «Sin etiquetas no hay exactitud que reportar. Cuando existan, la referencia será fotointerpretación a ciegas, no visitas de campo.»

### 23. ¿Dónde está el preregistro?
- **Respuesta.** Los criterios de las cinco pruebas están escritos en el documento del proyecto, con fecha anterior al evento. Los puntos que H1 dejaba abiertos se fijaron y se subieron al repositorio antes de correr el modelo; el orden se puede comprobar en el historial.
- **Cifra.** S9 lleva fecha del 10 de noviembre y está en el repositorio desde el commit `fa49050` (12-nov). La especificación de H1 se subió el 14 de noviembre a las 14:11 (commit `b9baced`, rama `datos-satelite`), antes del script del análisis. La de H1-b, la prueba posterior, se subió el mismo día a las 16:20 (commit `695caf8`), antes de calcular.
- **Archivo.** S9 §6 y Anexo B; `docs/h1_especificacion_operativa.md`; `docs/h1b_especificacion.md`; `docs/resultado_H1b.md`.
- **Pendiente.** «La liga pública del preregistro en OSF todavía no está en el repositorio. Si la versión publicada fija algo distinto, prevalece la publicada y el análisis se repite.» (`docs/reparto_faltantes.md`, H3). Si señalan que la página titula H1 y H3 «preregistered»: «S9 preveía publicar el preregistro en OSF; mientras la liga no exista, en el README y en el formulario decimos “declared before the analysis”, con la fecha y el commit de cada criterio.» Liga de OSF: [LINK: pendiente — integrador].

### 24. ¿Qué significa «at least 108 %» de agua ya comprometida?
- **Respuesta.** Con una dotación como la de 2026, lo que piden los cultivos perennes de las dos zonas ya rebasa esa dotación repartida en toda la superficie; lo que falta sale de pozos o queda sin cubrir. Dice «at least» porque las parcelas sin clasificar no suman. La cifra tiene dos incertidumbres que empujan en sentidos contrarios: faltan perennes por contar, y nuestra lámina de alfalfa y de nogal queda por encima de la que se aplica en el distrito.
- **Cifra.** 108 % (rango de 88 % a 134 %) en «All areas» con 3.5 millares/ha; 40 % (de 32 % a 49 %) con 9.5. En «Delicias – Saucillo», 125 % con 3.5. Sin clasificar: 66.2 % de la superficie. Modelo ÷ lámina aplicada en el distrito: 1.63 en alfalfa y 1.39 en nogal.
- **Archivo.** Lo calcula `web/reglas.js` (`aguaComprometida`) con `web/data/cubo.json` → `zona` y `zonas`; fórmula en S9 §5; `docs/modelo_vs_practica.md` §1.

### 25. ¿La tormenta es un pronóstico de inundación?
- **Respuesta.** No. Es una lluvia fuerte tomada del propio registro de la zona, para ver por dónde escurre el agua y dónde se junta. No da profundidades ni sirve para diseñar drenes. El relieve es de 30 metros y se usa a escala de zona, no dentro de la parcela.
- **Cifra.** Tormenta de referencia: 20.2 mm en Delicias – Saucillo y 20.7 mm en Lázaro Cárdenas (percentil 95 de los días con 1 mm o más, GPM IMERG, de 2001 a 2026). Con NASA POWER salen 15.5 y 15.9 mm: las dos fuentes difieren.
- **Archivo.** `web/data/relieve.json`; `LIMITATIONS.md`, «Relief and storm».

### 26. ¿Por qué calculan el nogal a diez años?
- **Respuesta.** Es un horizonte de cálculo, no la vida de la huerta, que es más larga. Lo declaramos como supuesto, y la ficha lo dice junto al plazo. En el nogal no descontamos la edad: el compromiso se calcula siempre a diez años.
- **Cifra.** 10 años [S]. En L0175: 18.84 millares/ha al año y 188.4 millares/ha en el horizonte.
- **Archivo.** S9 §5; `web/data/cubo.json` → `parcelas.L0175` (`nota_plazo`: «calculation horizon; orchards live longer»).
- **Pendiente.** «La vida de la huerta con fuente del INIFAP todavía no la tenemos en el repositorio.» (`docs/reparto_faltantes.md`, D6).

### 27. ¿Ya existe algo así? ¿Qué tiene de nuevo?
- **Respuesta.** En una búsqueda que no fue exhaustiva no encontramos una herramienta que muestre al agricultor, parcela por parcela, cada cultivo como un compromiso de agua de varios años frente a lo que entrega la presa. Hay antecedentes cercanos y los citamos. No afirmamos ser pioneros ni exclusivos.
- **Cifra.** Búsqueda del 10 de noviembre de 2026.
- **Archivo.** S9 §4 (Mall y Herman 2019; FieldSense; mapeo de tierra sin sembrar de 2015); `README.md`, «Summary».

### 28. ¿Se puede llevar a otro distrito?
- **Respuesta.** El método usa datos abiertos y guarda cada constante del distrito en un archivo de parámetros, así que está pensado para repetirse donde haya una presa y un acuífero. No lo hemos probado en otro distrito, y habría que revisar ahí las eficiencias, los plazos y las dotaciones.
- **Cifra.** Ninguna.
- **Archivo.** S9 §7 (premios, método replicable); `data/params.json`.

---

## Frases para cuando la respuesta es «no»

| Si preguntan… | Diga… |
|---|---|
| Si la herramienta acierta | «En la prueba contra la presa, no cumplió: calcula más agua de la que el distrito usa. Lo publicamos tal como salió.» |
| Por un dato que no tenemos | «Ese dato no lo tenemos con fuente, y por eso la página dice "no data" o "No verified data".» |
| Si está terminado | «Lo que no se corrió aparece como "not run". No lo escondemos.» |
| Por la liga pública | «Está en https://cristianruz.github.io/raiz-dam-to-root/; ábrala y mueva la dotación.» |

## Pendientes de este documento

- Anotar lo que respondieron las mentorías: eficiencia parcelaria, punto de medición del millar y cómo presentar H1.
- Volver a leer las cifras de las preguntas 3, 3 bis, 8, 9 y 24 en la página final, después de la última corrida de `python construir.py`.
- Las respuestas 8, 15 y 17 dicen lo mismo que `README.md` («Open question: model against INIFAP depth») y `LIMITATIONS.md` («Water demand»), corregidos el 15-nov: la diferencia de la alfalfa no viene solo de la eficiencia (`docs/modelo_vs_practica.md` §2, punto 3).
- «Tests in sight» ya muestra H1-b junto a H1, y la ficha ya muestra la lámina que se aplica en el distrito (`web/data/pruebas.json`; `cubo.json` → `agua.lamina_local`).
- Respuestas 3 bis y 3 ter: si Cristian decide agregar escenarios de riego mínimo para el nogal o una forma de ponderar prioridades, cámbielas por lo que muestre la página.
