<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
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

- **Columna «Qué se dice»:** texto literal para leer en voz alta. Los números van con letra para que se lean igual siempre.
- **Columna «Cifra y fuente»:** no se lee. Es para contestar si alguien pregunta de dónde sale un número.
- **«[SI ESTÁ CONECTADO]»:** la toma o la frase depende de una pieza del gemelo que se conecta esta noche (vista 3D, línea de tiempo, tarjeta de estado, contexto regional, app sin conexión). Debajo va su **«[ALTERNATIVA]»** con lo que ya funciona hoy. Se usa una de las dos, nunca ambas.
- Los nombres de los controles del gemelo («Twin status», «Play») son los de los módulos en construcción (`web/js/estado_gemelo.js`, `web/js/tiempo.js`). Verifíquelos en la página cuando queden conectados.
- Hablan dos personas como máximo: una narra y otra maneja la pantalla.

## 3. Antes de empezar (pantalla lista)

1. Página abierta, con la pantalla de inicio cerrada («Start exploring»).
2. «Color fields by» en «Enough water?».
3. Marca «Like 2025» en el deslizador.
4. **[SI ESTÁ CONECTADO]** «Pilot area» en «Delicias – Saucillo», vista 3D activa y línea de tiempo en 2019, para que al reproducirla llegue a 2025 en unos seis segundos (`web/data/gemelo.json` → `tiempo.intervalo_ms`).
   **[ALTERNATIVA]** «Pilot area» en «All areas» y capa «Field memory: 2025».
5. Respaldo sin red: **[SI ESTÁ CONECTADO]** la app instalada. **[ALTERNATIVA]** `dist/raiz-offline.html`, que se genera con `python motor/demo_offline.py` (`README.md`, «How to run»).
6. Las tres protagonistas aparecen arriba en la lista «Fields» con la etiqueta «story field»: P0757, P0244 y L0175.

## 4. El guion

Los tiempos de inicio están calculados a 135 palabras por minuto con la versión del gemelo conectado.

### Bloque 1 · 2025 (0:00 a 0:37)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 0:00 | Buenas tardes. Somos Los Norteados. | Centro de control. **[SI ESTÁ CONECTADO]** vista 3D de Delicias – Saucillo con la línea de tiempo en 2019. **[ALTERNATIVA]** mapa 2D con la capa «Field memory: 2025». | — |
| 0:02 | En 2025, al distrito de Delicias no le llegó agua de las presas. | **[SI ESTÁ CONECTADO]** «Play» en la línea de tiempo: corre de 2019 a 2025 y se pausa en 2025, donde aparece «Year without dam water: the district received no dam allocation». **[ALTERNATIVA]** se queda la capa «Field memory: 2025». | Año sin agua de las presas [P] (`docs/sintesis/S9_proyecto_definitivo.md` §2; texto del resaltado en `web/data/gemelo.json` → `tiempo.destacados`) |
| 0:09 | Quien sembraba maíz o algodón pudo no sembrar. El nogal no: pide agua aunque la presa no entregue. | Misma pantalla. Señalar las parcelas «P Perennial» y las «R Rest». | Mecanismo, sin cifra (S9 §2) |
| 0:17 | Ese año se autorizaron más de ochenta y siete millones de metros cúbicos de pozo para riegos de supervivencia, sobre todo de nogal. | Panel «Aquifer» del centro de control. | 87.4 hm³ de agua subterránea [P] (S9 §2 y Anexo A: El Diario de Delicias, 31-ene-2025; `README.md`, «Summary»). 1 hm³ es un millón de m³ |
| 0:27 | El agua de un perenne queda comprometida por años. Y se decide al sembrar, antes de saber cuánta agua dará la presa. | Indicador «Water already committed by perennial crops» con la marca «Like 2025». La pantalla dice «at least 378%» en «All areas» o «at least 437%» en «Delicias – Saucillo». | No se lee. Lo calcula `web/reglas.js` (`aguaComprometida`) con `web/data/cubo.json` → `zona` o `zonas.delicias_saucillo` y la marca de 1 millar/ha [P] (`cubo.json` → `dotaciones.marcas`) |

### Bloque 2 · El compromiso (0:37 a 1:41)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 0:37 | Raíz es un gemelo digital de dos zonas del distrito: más de mil doscientas parcelas estimadas, con datos abiertos de la NASA. No tiene sensores. | Centro de control completo, con el mapa y «Color fields by → Enough water?». | 1,239 parcelas estimadas en dos zonas (`web/data/cubo.json` → `zona.conteos.total`; `README.md`, «Pilot areas»). Qué significa «gemelo» y qué no es: `docs/decisiones/2026-11-14_gemelo_digital.md` |
| 0:48 | **[SI ESTÁ CONECTADO]** Cada columna es el agua que pide una parcela: azul, lo que alcanza; rojo, lo que falta. | Vista 3D de Delicias – Saucillo. Mover un poco el deslizador para que las columnas cambien. | La altura es una escala visual, no una medición (`web/data/gemelo.json` → `columnas.nota`; `data/params.json` → `gemelo`, etiqueta «Diseño») |
| 0:48 | **[ALTERNATIVA]** Cada parcela lleva un color: verde, alcanza; rojo, no alcanza; gris, no sabemos qué cultivo tiene. | Mapa 2D con la leyenda «Enough water for the current rotation?». | Regla del semáforo: S9 §5; `web/reglas.js` (`semaforoAgua`) |
| 0:56 | Pongo una dotación como la de 2026: tres millares y medio por hectárea. Abro esta alfalfa, de casi ocho hectáreas. | **[SI ESTÁ CONECTADO]** antes, cambiar «Pilot area» a «All areas»: la vista 3D trabaja con una zona a la vez y L0175 está en la otra. Clic en la marca «Like 2026»: el deslizador queda en «3.5 thousand m³/ha». En la lista «Fields», clic en **P0757** (Alfalfa · 7.95 ha). Se abre «Field P0757». | Marca «Like 2026»: 3 a 4 millares/ha, punto medio 3.5, [P] por confirmar (`cubo.json` → `dotaciones.marcas`; `data/params.json` → `dotaciones`). Superficie 7.95 ha (`web/data/parcelas.geojson` → P0757) |
| 1:05 | El satélite dice que este alfalfar tiene tres años: su plazo está por vencer. Con esa dotación, el agua alcanza para una de sus ocho hectáreas. | Ficha P0757: «E Water term: ending soon», «Stand age from satellite memory: 3 years» y la franja «Field memory (NASA HLS)». Tarjeta «Current rotation: Alfalfa»: «Enough for 1 of 7.95 hectares (range 0.8 to 1.2)». | Edad 3 años y estado «por vencer» (`parcelas.geojson` → P0757). Alcanza para 0.98 de 7.95 ha (rango 0.79 a 1.20), que la página redondea a 1: `web/reglas.js` (`evaluarOpcion`) con la lámina P50 de 28.4 millares/ha (`cubo.json` → `parcelas.P0757`, opción ACTUAL) |
| 1:17 | Si vuelve a sembrar alfalfa, compromete agua otros tres o cuatro años. Con maíz forrajero, un año, y la misma agua alcanza para dos hectáreas y media. | Misma ficha, «Current rotation and alternatives»: tarjeta «Alfalfa with a summer irrigation cut» («Commits water for 3–4 years») y tarjeta «Forage maize» («Commits water for 1 year», «Enough for 2.5 of 7.95 hectares»). | Plazo de la alfalfa 3 a 4 años [P, FIRA] (S9 §5; `cubo.json` → `plazo_anios`). Maíz forrajero: lámina P50 de 11.14 millares/ha y 2.50 de 7.95 ha (`web/reglas.js` con `cubo.json` → `parcelas.P0757`). Las opciones son provisionales [S] (`data/opciones_b4.json`) |
| 1:29 | Esta parcela descansa: está libre. Esta huerta de nogal está comprometida; la calculamos a diez años. | «Close». Clic en **P0244** (Fallow · 27.97 ha): «F Water term: free». «Close». Clic en **L0175** (Pecan orchard · 10.76 ha, zona Lázaro Cárdenas): «C Water term: committed» y «Commits water for 10 years (calculation horizon; orchards live longer)». | Estados «libre» y «comprometida» (`parcelas.geojson` → P0244 y L0175). Nogal: horizonte de cálculo de 10 años [S] (S9 §5; `cubo.json` → `parcelas.L0175`) |
| 1:36 | Raíz no dice qué sembrar. Pone las opciones lado a lado. | Ficha L0175 con sus tarjetas (Pecan orchard · Cotton · Do not plant / standing stubble) y el aviso «This tool supports, never replaces, the judgment of farmers and local experts.» | Aviso fijo (`web/index.html`; `CLAUDE.md`, regla 10) |

### Bloque 3 · La gota (1:41 a 2:16)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 1:41 | ¿A dónde va cada millar? Sigamos la gota. | Ficha L0175, bajar a «Follow the drop» con la opción «Current rotation: Pecan orchard». | — |
| 1:44 | Para regar completa esta huerta saldrían de la presa trescientos treinta y ocho mil metros cúbicos al año. Los árboles consumen ciento quince mil. Y sesenta y ocho mil regresan al acuífero. | Diagrama: «La Boquilla (dam)», «Canal losses», «Field», «Crop (ET)», «Back to aquifer», «Other losses», cada uno con sus m³. | 337,864 m³ salen de la presa; 114,916.8 m³ consume el cultivo; 67,572.8 m³ regresan al acuífero (`cubo.json` → `parcelas.L0175`, opción ACTUAL, bloque `gota`). Conducción 0.60 [V] y retorno 0.2 [V] (`data/params.json` → `eficiencia.conduccion`, `gota.c_retorno_superficial`) |
| 1:59 | Por eso contamos el agua que se consume. Un riego más eficiente saca menos de la presa, pero también recarga menos el acuífero. | Texto bajo el diagrama: «Efficiency reduces dam withdrawals but can reduce aquifer recharge (Grafton et al., Science 2018). We count consumption (ET), not just withdrawals.» | Sin cifra. Grafton et al. 2018 (`README.md`, «References»; `LIMITATIONS.md`) |
| 2:09 | El goteo aún no lo mostramos: falta una eficiencia con fuente, y no la inventamos. | Nota «Drip scenario not available yet: no sourced drip efficiency.» | `data/params.json` → `eficiencia.goteo` es `null` (`cubo.json` → `meta.notas`) |

### Bloque 4 · Las pruebas (2:16 a 3:22)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 2:16 | Ahora, lo que no salió bien. También se publica. | «Close». Botón «About & Data», sección «Tests in sight». | — |
| 2:20 | Declaramos cinco pruebas antes de ver resultados. Comparamos el modelo con el agua que salió de La Boquilla en 2026 y no cumplió: calculó novecientos cinco millones de metros cúbicos; la referencia fue cuatrocientos cuarenta y ocho. Una cuenta sencilla quedó más cerca. | «Back-test 2026 (H1, preregistered)» con su estado y el resumen «H1 does not meet the preregistered criterion (partial back-test; press-reported truth)». | Al 14-jul-2026: modelo P50 904.6 hm³ (P10–P90 de 727.2 a 1,131.4); referencia de prensa 447.65 hm³; líneas base L1-s 404.5 y L1 367.2 (`docs/resultado_H1.md`). Criterios declarados antes: S9 §6 |
| 2:40 | El modelo calcula toda el agua que pide el cultivo; el distrito riega con menos. | Misma sección. | Demanda del ciclo 1,185.7 hm³ frente a 600 hm³ autorizados (`docs/resultado_H1.md`, «Por qué falla»). No se lee |
| 2:46 | En 2025 esperábamos ver mucha menos siembra de verano. Bajó menos de dos puntos; pedíamos veinticinco. No se sostiene. | «Natural experiment of 2025 (H3, preregistered)» con el resumen «H3 not supported (2025 natural experiment; pilot area, HLS v2)». | 82.6 % en 2025 frente a una mediana de 84.2 %: −1.6 puntos; el criterio pedía −25 o más; 184 parcelas anuales del rectángulo original (`docs/resultado_H3.md`) |
| 2:56 | Seis de cada diez parcelas salen en gris: el mapa no distingue su cultivo y prefiere no opinar. | «Crop map»: «Fields where the crop map abstains». O cerrar y señalar las parcelas grises del mapa. | 781 de 1,239 parcelas, 63.0 % (`web/data/pruebas.json` → prueba 1; `LIMITATIONS.md`) |
| 3:04 | ¿Por qué confiar? Porque una herramienta que enseña dónde falla le dice cuánto creerle. Cada número trae su fuente y su rango, y nada se publica si las pruebas no pasan. | «Automated gate», con los pasos de la última corrida de `python construir.py`. | Fuente de cada cifra en `web/data/manifest.json`. Publicación condicionada a las pruebas (`.github/workflows/publicar.yml`; `README.md`, «Automated gate»). Rango P10–P90: S9 §5 |
| 3:17 | **[SI ESTÁ CONECTADO]** Esta tarjeta separa lo observado, lo calculado y lo supuesto. | Tarjeta «Twin status»: grupos «Observed», «Modeled» y «Your scenario», con «Last rebuilt». | Fechas de `web/data/manifest.json` (`web/js/estado_gemelo.js`) |
| 3:17 | **[ALTERNATIVA]** Aquí está cada fuente, con su fecha. | «About & Data», tabla «NASA data», columna «Files and recorded source». | `web/data/manifest.json` → `fuentes_de_origen` |

### Bloque 5 · Cierre: qué pedimos (3:22 a 3:50)

| Tiempo | Qué se dice | Qué se ve en pantalla | Cifra y fuente |
|---|---|---|---|
| 3:22 | Raíz no reparte ni vende agua, no pronostica la presa y no decide por nadie: apoya al agricultor y al técnico. | «Close». Ficha P0757 → «Preview WhatsApp message»: mensaje en español con los avisos «Es una simulación; la asignación oficial la decide Conagua.» y «Esta herramienta apoya y no sustituye el juicio del agricultor ni del técnico.» | Límites declarados (S9 §11; `CLAUDE.md`, regla 10; avisos en `web/js/mensaje.js`) |
| 3:31 | Pedimos tres cosas. Un técnico de módulo que nos diga cuánta agua se pierde en la parcela. Agricultores que revisen su parcela y nos corrijan. Y que ustedes la abran y muevan la dotación. | Misma pantalla. | Eficiencia parcelaria: rango supuesto de 0.45 a 0.70 [S], sin valor medido (`README.md`, «Open question»; `LIMITATIONS.md`). Revisión manual de las protagonistas, pendiente (`docs/reparto_faltantes.md`, D3) |
| 3:46 | Antes de sembrar, vea el agua que compromete. Gracias. | Cabecera «Raíz – From Dam to Root». Liga de la página: [LINK: pendiente — integrador]. | Frase de S9 §1 |

Después vienen los 3 minutos de preguntas: `docs/pitch/preguntas_dificiles.md`.

## 5. Conteo de palabras y tiempo

Regla del conteo: una palabra por cada grupo de letras; un año con cifras («2025») cuenta como tres palabras, porque así se dice. Las etiquetas «[SI ESTÁ CONECTADO]» y «[ALTERNATIVA]» no se cuentan.

| Bloque | Con el gemelo conectado | Con lo que ya existe |
|---|---|---|
| 1 · 2025 | 83 | 83 |
| 2 · El compromiso | 144 | 143 |
| 3 · La gota | 78 | 78 |
| 4 · Las pruebas | 149 | 146 |
| 5 · Cierre | 64 | 64 |
| **Total** | **518** | **514** |

| Ritmo | Con el gemelo conectado | Con lo que ya existe |
|---|---|---|
| 130 palabras por minuto | 3:59 | 3:57 |
| 135 palabras por minuto | 3:50 | 3:48 |
| 140 palabras por minuto | 3:42 | 3:40 |

**Verificación:** las dos versiones caben en 4:00 a cualquier ritmo entre 130 y 140 palabras por minuto. A 130 queda un segundo de margen, así que conviene ensayar a 135.

**Si en el ensayo se pasa de 4:00**, quite en este orden:
1. «El goteo aún no lo mostramos: falta una eficiencia con fuente, y no la inventamos.» (15 palabras; queda escrito en la pantalla).
2. «Una cuenta sencilla quedó más cerca.» (6 palabras).
3. La frase del bloque 4 marcada «[SI ESTÁ CONECTADO]» o su alternativa (10 o 7 palabras).

## 6. Lo desfavorable se dice, y por qué ayuda

El bloque 4 dice tres cosas en contra, con naturalidad y sin disculparse:

| Qué se dice | Por qué hace más confiable la herramienta |
|---|---|
| H1 no cumple su criterio | El criterio se escribió antes de ver el resultado. Ahora sabemos hacia dónde se equivoca el modelo: pide más agua de la que el distrito usa (`docs/resultado_H1.md`) |
| H3 no se sostiene | El satélite ve el verdor, no de dónde vino el agua. Eso obliga a no leer el verdor como «regó con agua de la presa» (`docs/resultado_H3.md`) |
| 63 % de las parcelas sin clasificar | El mapa se abstiene en vez de adivinar. Por eso el indicador dice «at least» y esas parcelas no llevan opciones (`LIMITATIONS.md`) |

Frase de apoyo si el jurado insiste: «Preferimos enseñarle un gris que un color que no podemos defender.»

## 7. Versión de 30 segundos (elevator)

**Español (65 palabras; de 28 a 30 segundos entre 140 y 130 palabras por minuto):**

> En Delicias se decide qué sembrar antes de saber cuánta agua dará la presa. Un nogal o una alfalfa piden agua por años. Raíz es un gemelo digital de dos zonas, con datos de la NASA. Elija la dotación, toque su parcela y vea cuánta agua pide cada cultivo, por cuántos años y para cuántas hectáreas alcanza. Publicamos también lo que falló. Decide el agricultor.

**English (65 words; 28 to 30 seconds at 140 to 130 words per minute):**

> In Delicias, farmers choose crops before knowing how much water the dam delivers. Pecan and alfalfa ask for water for years. Raíz is a digital twin of two pilot areas, built on NASA data. Pick an allocation, tap a field, see how much water each crop needs, for how many years, and how many hectares it covers. We publish failed tests too. The farmer decides.

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
| P0757: hectáreas que alcanzan con 3.5 millares/ha | Alfalfa 0.98 (rango 0.79 a 1.20); maíz forrajero 2.50 | Calculado por `web/reglas.js` con `cubo.json` |
| Plazo de la alfalfa | 3 a 4 años [P, FIRA] | S9 §5; `cubo.json` → `plazo_anios` |
| P0244 | 27.97 ha; descanso; libre | `web/data/parcelas.geojson` |
| L0175 | 10.76 ha; nogal; comprometida; horizonte de 10 años [S] | `web/data/parcelas.geojson`; `cubo.json`; S9 §5 |
| La gota de L0175 | 337,864 m³ salen de la presa; 114,916.8 m³ consume el cultivo; 67,572.8 m³ regresan al acuífero | `web/data/cubo.json` → `parcelas.L0175`, bloque `gota` |
| Agua ya comprometida (pantalla, no se lee) | «at least 378%» en «All areas» y «at least 437%» en «Delicias – Saucillo», con 1 millar/ha | Calculado por `web/reglas.js` con `cubo.json` → `zona`, `zonas` |
| H1 | Modelo 904.6 hm³; referencia de prensa 447.65 hm³; líneas base 404.5 y 367.2 | `docs/resultado_H1.md` |
| H3 | −1.6 puntos (82.6 % frente a 84.2 %); el criterio pedía −25; 184 parcelas | `docs/resultado_H3.md` |
| Parcelas sin clasificar | 781 de 1,239, 63.0 % | `web/data/pruebas.json`; `LIMITATIONS.md` |
| Pruebas declaradas | Cinco | S9 §6 |
| Eficiencia parcelaria supuesta | 0.45 a 0.70 [S] | `README.md`, «Open question»; `LIMITATIONS.md` |

## 9. Pendientes de este guion

- Volver a leer las cifras de la ficha y del indicador en la página final, después de la última corrida de `python construir.py`. Si cambia un dato, cambia la frase.
- Confirmar los nombres de los controles del gemelo cuando queden conectados.
- La liga pública todavía no existe (`docs/reparto_faltantes.md`, H1).
- Si la mentoría dio una eficiencia parcelaria o el punto de medición del millar, actualice la petición del bloque 5.
