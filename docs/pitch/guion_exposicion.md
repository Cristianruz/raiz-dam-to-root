<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Guion de la exposición · 4 minutos + 3 de preguntas

**BORRADOR para que el equipo lo ajuste (responsable de presentación y pitch).** Las cifras salen del repo; si el repo cambia, cambia el guion.

## 1. Qué fija el plan

| Punto | Lo que dice | Dónde |
|---|---|---|
| Duración | 4 minutos de exposición y 3 de preguntas | `docs/sintesis/S10_plan_sapo.md` §1 y §7 («ensayo de 4 + 3 min») |
| Arco | 2025, el compromiso, La gota, las pruebas | `docs/sintesis/S9_proyecto_definitivo.md` §7 (criterio «Presentación») |
| Cuándo | Open House, domingo de 17:00 a 19:00; dos ensayos entre las 15:00 y las 16:30 | S10 §7 |
| Idioma | Exposición oral en español; la página está en inglés | `CLAUDE.md`, regla 9 |

## 2. Cómo leer este guion

- **Columna «Qué se dice»:** texto literal para leer en voz alta. Los números van con letra para que se lean igual siempre; los años van con cifras.
- **Columna «Cifra y fuente»:** no se lee. Es para contestar si alguien pregunta de dónde sale un número.
- **«[SI ESTÁ CONECTADO]»:** la toma o la frase usa una pieza del gemelo (vista 3D, línea de tiempo, tarjeta de estado, contexto regional, app sin conexión). **Hoy todas están en la página** (`web/app.js` importa y monta `gemelo3d.js`, `tiempo.js`, `estado_gemelo.js`, `instalar.js` y `contexto.js`): use esas filas. Debajo va su **«[ALTERNATIVA]»**, que queda de respaldo por si una pieza falla en la sede. Se usa una de las dos, nunca ambas.
- **Parcela «libre» de la historia: P0632.** La decisión del 14-nov la cambió de P0244 a P0632 (`docs/decisiones/2026-11-14_opciones_b3.md` §2), y hoy `web/data/parcelas.geojson` marca a P0757, P0632 y L0175 con `protagonista: true`. P0244 ya no sale en el guion.
- **«[SI EL GOTEO ESTÁ CONECTADO]» y «[SI EL GOTEO NO ESTÁ]»:** el escenario de goteo de «Follow the drop». Hoy está conectado (`web/data/cubo.json` → `meta.goteo.disponible`: true, con `ea_goteo` 0.9 «[V] indicative, not local»): use la primera fila. La segunda queda de respaldo.
- Los nombres de los controles del gemelo («Twin status», «Play», «3D twin view») son los de la página (`web/js/estado_gemelo.js`, `web/js/tiempo.js`, `web/app.js`).
- Sugerencia: una persona narra y otra maneja la pantalla.

## 3. Antes de empezar (pantalla lista)

1. Página abierta, con la pantalla de inicio cerrada («Start exploring»).
2. «Color fields by» en «Enough water?». En la alternativa sin gemelo, el bloque 1 usa la capa «Field memory: 2025» y al empezar el bloque 2 se vuelve a «Enough water?».
3. Marca «Like 2025» en el deslizador.
4. **[SI ESTÁ CONECTADO]** «Pilot area» en «Delicias – Saucillo», vista 3D activa y línea de tiempo en 2019, para que al reproducirla llegue a 2025 en unos seis segundos (`web/data/gemelo.json` → `tiempo.intervalo_ms`).
   **[ALTERNATIVA]** «Pilot area» en «All areas» y capa «Field memory: 2025».
5. Respaldo sin red: **[SI ESTÁ CONECTADO]** la app instalada («Install app»). **[ALTERNATIVA]** `dist/raiz-offline.html`, que se genera con `python motor/demo_offline.py` (`README.md`, «How to run»).
6. Las tres protagonistas son P0757, P0632 y L0175 (`web/data/parcelas.geojson` → `protagonista`). Aparecen arriba en la lista «Fields» con la etiqueta «story field».
7. Liga pública, por si alguien la pide: https://cristianruz.github.io/raiz-dam-to-root/ (publica `main`, con el PR #4 ya fusionado).

## 4. El guion

Los tiempos de inicio están calculados a 135 palabras por minuto con la versión de referencia, que es la página de hoy: gemelo conectado, P0632 y goteo conectado. Con las filas de respaldo se mueven uno o dos segundos.

### Bloque 1 · 2025 (0:00 a 0:36)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 0:00 | Buenas tardes. Somos Orbital Farming. | Centro de control. **[SI ESTÁ CONECTADO]** vista 3D de Delicias – Saucillo con la línea de tiempo en 2019. **[ALTERNATIVA]** mapa 2D con la capa «Field memory: 2025». | — |
| 0:02 | En 2025, al distrito de Delicias no le llegó agua de las presas. | **[SI ESTÁ CONECTADO]** «Play» en la línea de tiempo: corre de 2019 a 2025 y se pausa en 2025, donde aparece «Year without dam water: the district received no dam allocation». **[ALTERNATIVA]** se queda la capa «Field memory: 2025». | Año sin agua de las presas [P] (`docs/sintesis/S9_proyecto_definitivo.md` §2; texto del resaltado en `web/data/gemelo.json` → `tiempo.destacados`) |
| 0:09 | Quien sembraba maíz o algodón pudo no sembrar. El nogal no: pide agua aunque la presa no entregue. | Misma pantalla. Señalar las parcelas «P Perennial» y las «R Rest». | Mecanismo, sin cifra (S9 §2) |
| 0:17 | Ese año se autorizaron más de ochenta y siete millones de metros cúbicos de pozo para riegos de supervivencia, sobre todo de nogal. | Panel «Aquifer» del centro de control. | 87.4 hm³ de agua subterránea [P] (S9 §2 y Anexo A: El Diario de Delicias, 31-ene-2025; `README.md`, «Summary»). 1 hm³ es un millón de m³ |
| 0:27 | El agua de un perenne queda comprometida por años. Se decide al sembrar, antes de saber cuánta agua dará la presa. | Indicador «Water already committed by perennial crops» con la marca «Like 2025». La pantalla dice «at least 378%» en «All areas» o «at least 437%» en «Delicias – Saucillo». | No se lee. Lo calcula `web/reglas.js` (`aguaComprometida`) con `web/data/cubo.json` → `zona` o `zonas.delicias_saucillo` y la marca de 1 millar/ha [P] (`cubo.json` → `dotaciones.marcas`) |

### Bloque 2 · El compromiso (0:36 a 1:42)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 0:36 | ROOT es un gemelo digital de dos zonas del distrito: más de mil doscientas parcelas estimadas, con datos abiertos de la NASA. No tiene sensores. | Centro de control completo, con el mapa. **[ALTERNATIVA]** clic en «Enough water?» para volver del mapa de memoria al semáforo. | 1,239 parcelas estimadas en dos zonas (`web/data/cubo.json` → `zona.conteos.total`; `README.md`, «Pilot areas»). Qué significa «gemelo» y qué no es: `docs/decisiones/2026-11-14_gemelo_digital.md` |
| 0:48 | **[SI ESTÁ CONECTADO]** Cada columna es el agua que pide una parcela: azul, lo que alcanza; rojo, lo que falta. | Vista 3D de Delicias – Saucillo. Mover un poco el deslizador para que las columnas cambien. | La altura es una escala visual, no una medición (`web/data/gemelo.json` → `columnas.nota`; `data/params.json` → `gemelo`, etiqueta «Diseño») |
| 0:48 | **[ALTERNATIVA]** Cada parcela lleva un color: verde, alcanza; rojo, no alcanza; gris, no sabemos qué cultivo tiene. | Mapa 2D con la leyenda «Enough water for the current rotation?». | Regla del semáforo: S9 §5; `web/reglas.js` (`semaforoAgua`) |
| 0:55 | Pongo una dotación como la de 2026: tres millares y medio por hectárea. Abro esta alfalfa, de casi ocho hectáreas. | **[SI ESTÁ CONECTADO]** antes, cambiar «Pilot area» a «All areas»: la vista 3D trabaja con una zona a la vez y L0175 está en la otra. Clic en la marca «Like 2026»: el deslizador queda en «3.5 thousand m³/ha». En la lista «Fields», clic en **P0757** (Alfalfa · 7.95 ha). Se abre «Field P0757». | Marca «Like 2026»: 3 a 4 millares/ha, punto medio 3.5, [P] por confirmar (`cubo.json` → `dotaciones.marcas`; `data/params.json` → `dotaciones`). Superficie 7.95 ha (`web/data/parcelas.geojson` → P0757) |
| 1:05 | El satélite dice que este alfalfar tiene tres años: su plazo está por vencer. Con esa dotación, alcanza para casi una de sus ocho hectáreas. | Ficha P0757: «E Water term: ending soon», «Stand age from satellite memory: 3 years» y la franja «Field memory (NASA HLS)». Tarjeta «Current rotation: Alfalfa»: «Enough for 0.97 of 7.95 hectares (range 0.79 to 1.2)»; debajo, «Typically applied in this district»: 17.4 thousand m³/ha, «enough for 1.59 of 7.95 hectares — district average, not this field». | Edad 3 años y estado «por vencer» (`parcelas.geojson` → P0757). Alcanza para 0.98 de 7.95 ha (rango 0.79 a 1.20); la página lo escribe hacia abajo, con los decimales del área: 0.97 (`formatoHectareas` de `web/js/resumen.js`). Cálculo: `web/reglas.js` (`evaluarOpcion`) con la lámina P50 de 28.4 millares/ha (`cubo.json` → `parcelas.P0757`, opción ACTUAL). Referencia local: 17.42 millares/ha [V] (Villalobos-Cano et al. 2024; `cubo.json` → `agua.lamina_local`); con 3.5 alcanza para 1.597 ha, que la página escribe 1.59 (cálculo con `cobertura` de `web/reglas.js`). No se lee |
| 1:16 | Si vuelve a sembrar alfalfa, compromete agua otros tres o cuatro años. Con cereal y maíz forrajero, un año, y alcanza para casi hectárea y media. | Misma ficha, «Current rotation and alternatives»: tarjeta «Keep the alfalfa and skip two to three summer irrigations» («Commits water for 3–4 years», «Remaining term: 0–1 years» y «Water committed over the remaining term: 0–25.5 thousand m³/ha», porque al alfalfar de tres años le queda de 0 a 1 año) y tarjeta «Break the old alfalfa: winter cereal, then forage maize» («Commits water for 1 year», «Enough for 1.46 of 7.95 hectares (range 1.23 to 1.73)»). La ficha compara la rotación actual con tres alternativas; la tercera es «Do not plant / standing stubble». | Plazo de la alfalfa 3 a 4 años [P, FIRA] (S9 §5; `cubo.json` → `plazo_anios`); el corte de verano descuenta la edad: plazo restante de 0 a 1 año y compromiso de 0 a 25.49 millares/ha, que la página escribe con un decimal (`cubo.json` → `parcelas.P0757`, opción `alfalfa_corte_verano`, `plazo_restante` y `compromiso_millares_ha`). Cereal de invierno y luego maíz forrajero, un año: lámina P50 de 18.94 millares/ha (P10–P90 de 16.06 a 22.54) y 1.47 de 7.95 ha (rango 1.23 a 1.73), que la página escribe 1.46 (`web/reglas.js` con `cubo.json` → `parcelas.P0757`, opción `avena_maiz`). Las opciones salen de la tabla oficial de rotaciones (`data/processed/opciones_b3.json`; maestro §5.2) |
| 1:28 | Esta parcela tiene un cultivo de un solo ciclo: está libre. | «Close». Clic en **P0632** (Winter cereal · 20.66 ha): «F Water term: free». Tarjeta «Current rotation: Winter cereal»: «Enough for 9.24 of 20.66 hectares (range 7.65 to 11.4)» y «Commits water for 1 year». | Estado «libre», 20.66 ha y cultivo «cereal de invierno» (`web/data/parcelas.geojson` → P0632). Alcanza para 9.25 de 20.66 ha (rango 7.66 a 11.41), que la página escribe hacia abajo (9.24; 7.65 a 11.4): `web/reglas.js` (`evaluarOpcion`) con la lámina P50 de 7.82 millares/ha (P10–P90 de 6.34 a 9.44; `cubo.json` → `parcelas.P0632`, opción ACTUAL, con el cereal sembrado el 1-dic [S]) |
| 1:32 | Esta huerta de nogal está comprometida; la calculamos a diez años. | «Close». Clic en **L0175** (Pecan orchard · 10.76 ha, zona Lázaro Cárdenas): «C Water term: committed» y «Commits water for 10 years (calculation horizon; orchards live longer)». | Estado «comprometida» (`parcelas.geojson` → L0175). Nogal: horizonte de cálculo de 10 años [S] (S9 §5; `cubo.json` → `parcelas.L0175`) |
| 1:37 | Una huerta no rota, y la ficha no le inventa alternativas. | Ficha L0175 con una sola tarjeta, «Current rotation: Pecan orchard (does not rotate)», el motivo «An orchard does not rotate…», la nota «No alternatives are compared for this field.» y el aviso «This tool supports, never replaces, the judgment of farmers and local experts.» | Nogal sin alternativas: `cubo.json` → `parcelas.L0175.sin_rotacion` y `opciones_catalogo.nogal` (maestro §5.2); `docs/decisiones/2026-11-15_nogal_sin_alternativas.md`. Aviso fijo (`web/index.html`; `CLAUDE.md`, regla 10) |

### Bloque 3 · La gota (1:42 a 2:16)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 1:42 | ¿A dónde va cada millar? Sigamos la gota. | Ficha L0175, bajar a «Follow the drop» con la opción «Current rotation: Pecan orchard». | — |
| 1:46 | Para regar completa esta huerta saldrían de la presa trescientos treinta y ocho mil metros cúbicos al año. Los árboles consumen ciento quince mil. Sesenta y ocho mil regresan al acuífero. | Diagrama: «Needed from La Boquilla», «Canal losses», «Field», «Crop (ET)», «Back to aquifer», «Other losses», cada uno con sus m³. | 337,864 m³ salen de la presa; 114,916.8 m³ consume el cultivo; 67,572.8 m³ regresan al acuífero (`cubo.json` → `parcelas.L0175`, opción ACTUAL, bloque `gota`). Conducción 0.60 [V] y retorno 0.2 [V] (`data/params.json` → `eficiencia.conduccion`, `gota.c_retorno_superficial`) |
| 2:00 | Por eso contamos el agua que se consume. Un riego más eficiente saca menos de la presa, pero también recarga menos el acuífero. | Texto bajo el diagrama: «Efficiency reduces dam withdrawals but can reduce aquifer recharge (Grafton et al., Science 2018). We count consumption (ET), not just withdrawals.» | Sin cifra. Grafton et al. 2018 (`README.md`, «References»; `LIMITATIONS.md`) |
| 2:10 | **[SI EL GOTEO ESTÁ CONECTADO]** El goteo se muestra con una eficiencia indicativa de la FAO, no medida aquí. | Clic en «What if this field switches to drip?», con «Consumption cap: on». Aparecen «Dam water: −33% vs. current irrigation» y «Back to aquifer: −33% vs. current irrigation». Esas cifras se ven y no se dicen. En «Assumptions behind these flows» se lee «Drip and surface field efficiencies: [V] indicative, not local». | Con goteo y tope: 225,242.7 m³ salen de la presa (frente a 337,864) y 45,048.5 m³ regresan al acuífero (frente a 67,572.8); la página lo muestra como −33 % en los dos (`cubo.json` → `parcelas.L0175`, opción ACTUAL, bloque `gota_goteo_con_tope`; `meta.goteo.disponible`: true). Eficiencias de aplicación indicativas: goteo 0.9 y riego superficial 0.6, [V] indicative, not local (`data/processed/supuestos.json` → `ea_goteo`, `ea_superficial_referencia`: FAO, Training Manual No. 4, Anexo I, Tabla 8; `cubo.json` → `meta.goteo`). Decisión: `docs/decisiones/2026-11-14_opciones_b3.md` §3 |
| 2:10 | **[SI EL GOTEO NO ESTÁ]** El goteo aún no se muestra: tenemos una eficiencia indicativa de la FAO, no medida aquí. | Respaldo, si la revisión del motor retira el escenario: la página vuelve a mostrar la nota «Drip scenario not available yet: no sourced drip efficiency.» No se detenga en ella: la fuente sí está en el repo. | La eficiencia tiene fuente: `data/processed/supuestos.json` → `ea_goteo` (la misma tabla de la FAO). La página muestra esa nota cuando los bloques de goteo de `cubo.json` vienen en `null`. `data/params.json` → `eficiencia.goteo` sigue en `null`: el valor vive en `supuestos.json` |

### Bloque 4 · Las pruebas (2:16 a 3:21)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 2:16 | Lo que no salió bien también se publica. | «Close». Botón «About & Data», sección «Tests in sight». | — |
| 2:20 | Declaramos cinco pruebas antes de ver resultados. Comparamos el modelo con el agua que salió de La Boquilla en 2026 y no cumplió: calculó novecientos cinco millones de metros cúbicos; la referencia fue cuatrocientos cuarenta y ocho. Una cuenta sencilla quedó más cerca. | «Back-test 2026 (H1, criterion declared before the analysis)» con su estado y el resumen «H1 does not meet the criterion declared before the analysis (partial back-test; press-reported truth)». | Al 14-jul-2026: modelo P50 904.6 hm³ (P10–P90 de 727.2 a 1,131.4); referencia de prensa 447.65 hm³; líneas base L1-s 404.5 y L1 367.2 (`docs/resultado_H1.md`). Criterios declarados antes: S9 §6 |
| 2:40 | El modelo calcula toda el agua que pide el cultivo; el distrito riega con menos. | Misma sección. | Demanda del ciclo 1,185.7 hm³ frente a 600 hm³ autorizados (`docs/resultado_H1.md`, «Por qué falla»). No se lee |
| 2:46 | En 2025 esperábamos ver mucha menos siembra de verano. Bajó menos de dos puntos; pedíamos veinticinco. No se sostiene. | «Natural experiment of 2025 (H3, criterion declared before the analysis)» con el resumen «H3 not supported (2025 natural experiment; pilot area, HLS v2)». | 82.6 % en 2025 frente a una mediana de 84.2 %: −1.6 puntos; el criterio pedía −25 o más; 184 parcelas anuales del rectángulo original (`docs/resultado_H3.md`) |
| 2:56 | Seis de cada diez parcelas salen en gris: el mapa no distingue su cultivo y prefiere no opinar. | «Crop map»: «Fields where the crop map abstains». O cerrar y señalar las parcelas grises del mapa. | 781 de 1,239 parcelas, 63.0 % (`web/data/pruebas.json` → prueba 1; `LIMITATIONS.md`) |
| 3:04 | ¿Por qué confiar? Porque una herramienta que enseña dónde falla le dice cuánto creerle. Cada número trae fuente y rango, y nada se publica si las pruebas no pasan. | «Automated gate», con los pasos de la última corrida de `python construir.py`. | Fuente de cada cifra en `web/data/manifest.json`. Publicación condicionada a las pruebas (`.github/workflows/publicar.yml`; `README.md`, «Automated gate»). Rango P10–P90: S9 §5 |
| 3:16 | **[SI ESTÁ CONECTADO]** Esta tarjeta separa lo observado, lo calculado y lo supuesto. | Tarjeta «Twin status»: grupos «Observed», «Modeled» y «Your scenario», con «Last rebuilt». | Fechas de `web/data/manifest.json` (`web/js/estado_gemelo.js`) |
| 3:16 | **[ALTERNATIVA]** Aquí está cada fuente, con su fecha. | «About & Data», tabla «NASA data», columna «Files and recorded source». | `web/data/manifest.json` → `fuentes_de_origen` |

### Bloque 5 · Cierre: qué pedimos (3:21 a 3:49)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 3:21 | ROOT no reparte ni vende agua, no pronostica la presa y no decide por nadie: apoya al agricultor y al técnico. | «Close». Ficha P0757 → «Preview WhatsApp message»: mensaje en español con los avisos «Es una simulación; la asignación oficial la decide Conagua.» y «Esta herramienta apoya y no sustituye el juicio del agricultor ni del técnico.» | Límites declarados (S9 §11; `CLAUDE.md`, regla 10; avisos en `web/js/mensaje.js`) |
| 3:30 | Pedimos tres cosas. Un técnico de módulo que nos diga cuánta agua se pierde en la parcela. Agricultores que revisen su parcela y nos corrijan. Y que ustedes la abran y muevan la dotación. | Misma pantalla. | Eficiencia parcelaria: rango supuesto de 0.45 a 0.70 [S], sin valor medido (`README.md`, «Open question»; `LIMITATIONS.md`). Revisión manual de las protagonistas, pendiente (`docs/reparto_faltantes.md`, D3) |
| 3:45 | Antes de sembrar, vea el agua que compromete. Gracias. | Cabecera «ROOT – From Dam to Root». Liga de la página: https://cristianruz.github.io/raiz-dam-to-root/. | Frase de S9 §1 |

Después vienen los 3 minutos de preguntas: `docs/pitch/preguntas_dificiles.md`.

## 5. Conteo de palabras y tiempo

Regla del conteo: una palabra por cada grupo de letras; un año con cifras («2025») cuenta como tres palabras, porque así se dice. Las etiquetas entre corchetes no se cuentan.

**Palabras por bloque**

| Bloque | Palabras | Qué lo cambia |
|---|---|---|
| 1 · 2025 | 82 | Nada: igual en todas las versiones |
| 2 · El compromiso | 148 | La alternativa sin gemelo tiene una palabra menos: 147 |
| 3 · La gota | 76 con el goteo conectado; 78 si no está | — |
| 4 · Las pruebas | 146 con el gemelo conectado; 143 con lo que ya existe | — |
| 5 · Cierre | 64 | Nada: igual en todas las versiones |

**Total de palabras según lo que esté en la página**

| Versión | Goteo conectado (la página de hoy) | Goteo sin conectar (respaldo) |
|---|---|---|
| Con el gemelo conectado (la página de hoy) | **516** (referencia) | 518 |
| Con las alternativas (respaldo) | 512 | 514 |

**Duración**

| Ritmo | La más larga (518 palabras) | La de referencia (516) | La más corta (512) |
|---|---|---|---|
| 130 palabras por minuto | 3:59 | 3:58 | 3:56 |
| 135 palabras por minuto | 3:50 | 3:49 | 3:48 |
| 140 palabras por minuto | 3:42 | 3:41 | 3:39 |

«La página de hoy» es la del 15-nov: con las piezas del gemelo, con P0757, P0632 y L0175 marcadas y con el goteo en `web/data/cubo.json`. En el bloque 2, la frase de las 1:05 dice «casi una» y la de las 1:16 «casi hectárea y media», porque la página escribe 0.97 y 1.46 hectáreas; la frase de las 1:37 habla de la huerta, que no lleva alternativas.

**Verificación:** las cuatro combinaciones caben en 4:00 a cualquier ritmo entre 130 y 140 palabras por minuto. A 130, la más larga deja un segundo de margen, así que conviene ensayar a 135.

**Si en el ensayo se pasa de 4:00**, quite en este orden:
1. La frase del goteo del bloque 3 (14 palabras, o 16 si no está conectado); lo que importa queda escrito en la pantalla.
2. «Una cuenta sencilla quedó más cerca.» (6 palabras).
3. La frase del bloque 4 marcada «[SI ESTÁ CONECTADO]» o su alternativa (10 o 7 palabras).

## 6. Lo desfavorable se dice, y por qué ayuda

El bloque 4 dice tres cosas en contra, con naturalidad y sin disculparse:

| Qué se dice | Por qué hace más confiable la herramienta |
|---|---|
| H1 no cumple su criterio | El criterio se escribió antes de ver el resultado. Ahora sabemos hacia dónde se equivoca el modelo: pide más agua de la que el distrito usa (`docs/resultado_H1.md`). No diga que «acierta en la forma»: la prueba posterior H1-b tampoco se sostiene (`docs/resultado_H1b.md`) |
| H3 no se sostiene | El satélite ve el verdor, no de dónde vino el agua. Eso obliga a no leer el verdor como «regó con agua de la presa» (`docs/resultado_H3.md`) |
| 63 % de las parcelas sin clasificar | El mapa se abstiene en vez de adivinar. Por eso el indicador dice «at least» y esas parcelas no llevan opciones (`LIMITATIONS.md`) |

Frase de apoyo si el jurado insiste: «Preferimos enseñarle un gris que un color que no podemos defender.»

## 7. Versión de 30 segundos (elevator)

**Español (65 palabras; de 28 a 30 segundos entre 140 y 130 palabras por minuto):**

> En Delicias se decide qué sembrar antes de saber cuánta agua dará la presa. Un nogal o una alfalfa piden agua por años. ROOT es un gemelo digital de dos zonas, con datos de la NASA. Elija la dotación, toque su parcela y vea cuánta agua pide cada cultivo, por cuántos años y para cuántas hectáreas alcanza. Publicamos también lo que falló. Decide el agricultor.

**English (65 words; 28 to 30 seconds at 140 to 130 words per minute):**

> In Delicias, farmers choose crops before knowing how much water the dam delivers. Pecan and alfalfa ask for water for years. ROOT is a digital twin of two pilot areas, built on NASA data. Pick an allocation, tap a field, see how much water each crop needs, for how many years, and how many hectares it covers. We publish failed tests too. The farmer decides.

Las dos versiones no llevan cifras: no dependen de qué zona o qué marca esté en pantalla.

## 8. Cifras usadas en este guion

| Cifra | Valor en el repo | Origen |
|---|---|---|
| Agua subterránea autorizada en 2025 | 87.4 hm³ [P] | `docs/sintesis/S9_proyecto_definitivo.md` §2 y Anexo A |
| Parcelas del gemelo | 1,239, en dos zonas | `web/data/cubo.json` → `zona.conteos.total` |
| Marca «Like 2026» | 3 a 4 millares/ha; el deslizador queda en 3.5; [P] por confirmar | `web/data/cubo.json` → `dotaciones.marcas` |
| Marca «Like 2025» | 1 millar/ha [P] | `web/data/cubo.json` → `dotaciones.marcas` |
| P0757: superficie, edad y estado | 7.95 ha; 3 años; por vencer | `web/data/parcelas.geojson` |
| P0757: lámina de la alfalfa | 28.4 millares/ha (P10–P90 de 23.13 a 35.16) | `web/data/cubo.json` → `parcelas.P0757` |
| P0757: hectáreas que alcanzan con 3.5 millares/ha | Alfalfa 0.98 (rango 0.79 a 1.20); con la lámina aplicada en el distrito (17.42 [V]), 1.60; corte de verano 1.09 (0.88 a 1.33); cereal de invierno y luego maíz forrajero, un año, 1.47 (1.23 a 1.73), lámina P50 de 18.94. En pantalla, hacia abajo y con los decimales del área: 0.97 (0.79 a 1.2), 1.59, 1.09 (0.88 a 1.32) y 1.46 (1.23 a 1.73) | Calculado con `cobertura` y `evaluarOpcion` de `web/reglas.js` sobre `cubo.json` → `parcelas.P0757`; formato de `formatoHectareas` (`web/js/resumen.js`) |
| P0757: plazo restante y compromiso | Alfalfa actual y corte de verano: de 0 a 1 año; compromiso de 0 a 28.4 y de 0 a 25.49 millares/ha | `cubo.json` → `parcelas.P0757`, `plazo_restante` y `compromiso_millares_ha` |
| Plazo de la alfalfa | 3 a 4 años [P, FIRA] | S9 §5; `cubo.json` → `plazo_anios` |
| P0632, protagonista «libre» | 20.66 ha; cereal de invierno; libre; lámina de 7.82 millares/ha (P10–P90 de 6.34 a 9.44), con el cereal sembrado el 1-dic [S]; con 3.5 millares/ha alcanza para 9.25 ha (rango 7.66 a 11.41); en pantalla, 9.24 (7.65 a 11.4) | `web/data/parcelas.geojson`; `web/data/cubo.json` → `parcelas.P0632`; calculado por `web/reglas.js`; `docs/decisiones/2026-11-14_opciones_b3.md` §2 |
| L0175 | 10.76 ha; nogal; comprometida; horizonte de 10 años [S]; una sola opción (la huerta no rota); lámina P50 de 18.84 millares/ha, que con 3.5 alcanza para 2.00 ha (rango 1.63 a 2.46); con la aplicada en el distrito (13.72 [V]), 2.74. En pantalla: 1.99 (1.62 a 2.45) y 2.74 | `web/data/parcelas.geojson`; `cubo.json` → `parcelas.L0175` (`sin_rotacion`, `agua.lamina_local`); S9 §5; `docs/decisiones/2026-11-15_nogal_sin_alternativas.md` |
| La gota de L0175 | 337,864 m³ salen de la presa; 114,916.8 m³ consume el cultivo; 67,572.8 m³ regresan al acuífero | `web/data/cubo.json` → `parcelas.L0175`, bloque `gota` |
| Eficiencia indicativa del goteo (no se lee) | 0.9, frente a 0.6 del riego superficial; [V] indicative, not local | `data/processed/supuestos.json` → `ea_goteo`, `ea_superficial_referencia` (FAO, Training Manual No. 4, Anexo I, Tabla 8) |
| Goteo en L0175, con tope (pantalla, no se lee) | 225,242.7 m³ salen de la presa y 45,048.5 m³ regresan al acuífero; la página muestra −33 % en los dos | `web/data/cubo.json` → `parcelas.L0175`, bloque `gota_goteo_con_tope` |
| Agua ya comprometida (pantalla, no se lee) | «at least 378%» en «All areas» y «at least 437%» en «Delicias – Saucillo», con 1 millar/ha | Calculado por `web/reglas.js` con `cubo.json` → `zona`, `zonas` |
| H1 | Modelo 904.6 hm³; referencia de prensa 447.65 hm³; líneas base 404.5 y 367.2 | `docs/resultado_H1.md` |
| H3 | −1.6 puntos (82.6 % frente a 84.2 %); el criterio pedía −25; 184 parcelas | `docs/resultado_H3.md` |
| Parcelas sin clasificar | 781 de 1,239, 63.0 % | `web/data/pruebas.json`; `LIMITATIONS.md` |
| Pruebas declaradas | Cinco | S9 §6 |
| Eficiencia parcelaria supuesta | 0.45 a 0.70 [S] | `README.md`, «Open question»; `LIMITATIONS.md` |
| H1-b (no se lee; es para las preguntas) | El modelo gana a las formas simples en 6 de 26 años, de 1999 a 2024; does not hold | `docs/resultado_H1b.md` |

## 9. Pendientes de este guion

- Volver a leer las cifras de la ficha y del indicador en la página final, después de la última corrida de `python construir.py`. Si cambia un dato, cambia la frase.
- Liga pública: https://cristianruz.github.io/raiz-dam-to-root/ (publica `main`; el PR #4 ya está fusionado). Ábrala en incógnito antes del ensayo.
- Si la mentoría dio una eficiencia parcelaria o el punto de medición del millar, actualice la petición del bloque 5.
- **H1-b y la lámina del modelo.** Después de escribir este guion llegaron `docs/resultado_H1b.md` y `docs/modelo_vs_practica.md` (commit `b73e8b3`). El texto que se lee no cambia: el bloque 4 ya dice que el modelo calcula toda el agua que pide el cultivo y que el distrito riega con menos. Dos cuidados: no diga que el modelo «acierta en la forma del ciclo», y no explique toda la diferencia de la alfalfa con la eficiencia (`docs/pitch/preguntas_dificiles.md`, respuestas 8, 15 y 17). Si el equipo quiere que la petición del bloque 5 pregunte por el agua aplicada, hay una frase con las mismas 14 palabras: «Un técnico de módulo que nos diga cuánta agua se aplica en la parcela.»
- **Protagonistas.** Falta que una persona revise en imagen a P0757, P0632 y L0175 (`docs/reparto_faltantes.md`, D3).
- **Goteo.** Vuelva a leer en la página final los dos porcentajes de L0175. `README.md` y `LIMITATIONS.md` ya describen el escenario con su fuente (FAO, «[V] indicative, not local»).
- **Opciones.** Las tarjetas salen de la tabla oficial de rotaciones (`data/processed/opciones_b3.json`). Las cifras de este guion se releyeron del cubo de la integración `d5de13f` (1,267 opciones): la opción «Break the old alfalfa: winter cereal, then forage maize» cuenta un año y el corte de verano descuenta la edad del alfalfar. Vuelva a leerlas si el cubo cambia otra vez.
- **Tres estrategias, incluida la actual.** La pestaña «Details» del reto pide comparar al menos tres estrategias de rotación, una de ellas la actual (`docs/revisiones/2026-11-14_2300_revision_vs_guia_spaceapps.md`, I3). La ficha de P0757 muestra la actual y tres alternativas, y así lo dice la columna de pantalla de las 1:16. Si el equipo quiere decirlo en voz alta, hay sitio quitando «Una cuenta sencilla quedó más cerca.» (6 palabras) del bloque 4: «Son la rotación actual y tres alternativas.» (7 palabras), al final de la frase de las 1:16.
- **Prioridades.** Si preguntan por las prioridades del productor (misma revisión, I8): el productor fija la restricción de agua con el deslizador, y en la ficha «What matters most to you?» resalta las opciones según la prioridad que escoja, sin ordenarlas (`docs/pitch/preguntas_dificiles.md`, 3 ter).
