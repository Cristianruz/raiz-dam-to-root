<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# P2 · HLS de 2026 y memoria de la parcela

**Qué le toca** (S9 §10; kit §3): las series de HLS de 2026 y la memoria 2016–2026; la revisión de las 3 parcelas protagonistas (B1); el mapa de cultivos con P3 (A4.2); y las figuras del mapa y de la memoria.

**Lo que cambió hoy y manda sobre el kit** (detalle en [README §6](README.md#6-cambios-respecto-al-kit-mandan-sobre-el-kit)):
- **Usted no usa Earth Engine.** Las exportaciones de A3, A3-M y NASADEM las corre otra sesión de Claude en el Chrome de Cristian, con el proyecto `iondroplet`. **Su trabajo empieza con los CSV o GeoTIFF que esa sesión deja en Drive.** No se autentique en Earth Engine. El kit (§0.3 y G0, regla 6) le asignaba Earth Engine: eso ya no aplica.
- **B1 también lo hace la sesión de Chrome**, porque necesita red. Le toca la revisión manual de las protagonistas y la prueba de B1.
- **Entrega:** en `Raiz/entregas/`, carpeta plana sin `P2/`, con una línea por archivo en `Raiz/entregas/LEEME.md`.

| Orden | Pieza | Archivos que entrega (tabla 0.4-B) | Hora límite |
|---|---|---|---|
| 1 | [B1 · revisión de parcelas y protagonistas](#b1--revisión-de-parcelas-y-de-las-3-protagonistas) | Revisa `parcelas_base.geojson` y `parcelas_muestra.geojson` (los entrega la sesión de Chrome); entrega `B1_mapa_confianza.png` | sáb 12:00 |
| 2 | [A3 · HLS 2026 por parcela](#a3--hls-del-año-agrícola-2026-por-parcela) | `hls_mensual_parcelas.csv`, `suelo_desnudo.csv`, `fuentes_A3.csv` | sáb 14:30 |
| 3 | [A3-M · memoria 2016–2026](#a3-m--memoria-de-la-parcela-20162026) | `memoria_mensual.csv`, `memoria_parcelas.csv`, `memoria_resumen.csv`, `memoria_validacion.csv`, `fuentes_A3M.csv` | Un año en cuanto llegue; ninguno a las 20:30 → plan B; años restantes, dom 8:00 |
| 4 | [A4.2 · mapa de cultivos (con P3)](#a42--mapa-de-cultivos-de-2026-con-p3) | `cultivos_parcelas.csv`, `tabla_metodos.csv`, figura PNG, `fuentes_A42.csv` | Entrega entre sáb 18:00 y 20:30 |
| 5 | [Figuras](#figuras-del-mapa-y-de-la-memoria) | PNG | dom 8:00 (mapa y memoria); dom 11:00 (página) |

**Cómo se usa cada bloque** (flujo completo en [README §4](README.md#4-flujo-de-trabajo-de-una-pieza)):
1. Abra un cuaderno nuevo en Colab con el nombre indicado y monte Drive.
2. Si el bloque dice `[PEGA AQUÍ …]`, sustitúyalo por el texto indicado.
3. Pegue el bloque completo en el panel de Gemini. Pida **una celda por paso** y ejecútela antes de pedir la siguiente.
4. Al final:
   - corra la prueba;
   - verifique los datos con [verificar_datos_nasa.md](verificar_datos_nasa.md);
   - pida la revisión con contexto nuevo de `docs/prompts/para_gemini.md`.
5. Entregue:
   - guarde los archivos en `Raiz/entregas/` y su línea en `LEEME.md`;
   - guarde el cuaderno en `Raiz/cuadernos/`;
   - avise en el grupo: `ENTREGA: <archivo> — prueba OK`.

**Antes de cada pieza, revise `Raiz/entregas/LEEME.md`.** Si el archivo ya tiene su línea (por ejemplo, porque la sesión de Chrome lo entregó), no lo rehaga: verifíquelo con la guía de verificación y avise a Cristian.

---

## B1 · Revisión de parcelas y de las 3 protagonistas

| | |
|---|---|
| **Lo hace la sesión de Chrome** | Pasos 1, 2, 3 y 5 del prompt: recorte de Fields of The World 2025, `area_ha`, `ftw_confianza` y entrega de `parcelas_base.geojson` y `parcelas_muestra.geojson` con sus líneas de `LEEME.md` |
| **Le toca a usted** | Paso 4: elegir y revisar a mano las 3 protagonistas. Y la PRUEBA: esquema, mapa PNG por confianza y % de parcelas con confianza < 50 |
| **Entradas** | `parcelas_base.geojson` y `parcelas_muestra.geojson` de `Raiz/entregas/`; una imagen en color verdadero (HLS o Sentinel-2; por ejemplo, en Copernicus Browser); como apoyo visual, la exportación de A3 cuando llegue |
| **Cuaderno** | `B1_revision.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00 (kit §3, primer bloque). Si A3 aún no llega, la elección de protagonistas se pospone y se avisa (kit B1, paso 4) |
| **Verificación de datos** | [verificar_datos_nasa.md → Fields of The World](verificar_datos_nasa.md#7-fields-of-the-world-2025-b1) |

**Si un contorno no coincide:**
- No reescriba `parcelas_base.geojson`: es de la sesión de Chrome.
- Mande a Cristian un GeoJSON con el `id` y el polígono corregido. Escriba la corrección en `Raiz/cuadernos/B1_revision_protagonistas.md`.
- Los 3 `id` elegidos también se los pasa a Cristian, para que `protagonista = true` quede en el archivo.

**Bloque para pegar en Gemini** (G0 completo + tarea):
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P2 HLS y memoria.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_B1.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_B1.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual). ESTOS ARCHIVOS NO LOS ESCRIBO: los entregó la sesión de Chrome y aquí solo los verifico.
| B1 (P2) | `parcelas_base.geojson` (zona piloto) y `parcelas_muestra.geojson` (polígonos de los puntos etiquetados) | `id`, `area_ha`, `modulo`, `ftw_confianza`, `protagonista`; en la muestra, además `punto_id` y `bloque` |
Archivos que SÍ escribo:
- en entregas/: B1_mapa_confianza.png (la figura PNG que pide la PRUEBA de B1) y fuentes_B1.csv;
- en cuadernos/: B1_revision_protagonistas.md, con la revisión de las protagonistas.

DOCUMENTOS DE REFERENCIA (pegados)
Advertencia del kit v4, sección A4 (copiada tal cual):
> **Advertencia sobre Fields of The World:** su benchmark no incluye México y el riego árido de Norteamérica no está en su entrenamiento. Se usan sus predicciones globales de 2025 (CC-BY-4.0), con filtro de confianza por polígono y revisión manual de las 3 protagonistas (B1). En la página se declara: *"Field boundaries are NN predictions outside the model's training domain; filtered by confidence and manually reviewed for the showcased fields."*
[PEGA AQUÍ el valor de zona_piloto.bbox de data/params.json (GitHub del proyecto). No lo escribas de memoria.]

TAREA
NOTA DEL EQUIPO: los pasos 1, 2, 3 y 5 los hizo la sesión de Chrome. Yo hago el paso 4 (elegir las 3 protagonistas y revisarlas a mano contra una imagen en color verdadero) y la PRUEBA. No reescribo parcelas_base.geojson: los id de las protagonistas y cualquier polígono corregido se los paso a Cristian. Primero imprime: número de parcelas, CRS, columnas, cuántas tienen protagonista = true y si alguna parcela cae fuera del rectángulo de la zona piloto.
Tarea B1. En motor/B1_parcelas.ipynb (lo corre la sesión de Chrome; su revisión, en B1_revision.ipynb de Raiz/cuadernos/):
1) Zona piloto: rectángulo definido por coordenadas (zona_piloto.bbox de data/params.json; lo propone usted con el visor y lo confirma Cristian antes de ejecutar). El límite de los módulos de riego no es público: en todos los textos se dice "zona piloto", nunca "módulo". Para el polígono del DR-005, utilice el que exista en data/raw/ o la capa REST de distritos de riego de Conagua SIGAGIS, y documente la fuente.
2) Descargue ÚNICAMENTE el recorte de las predicciones globales de Fields of The World 2025 (Source Cooperative, source.coop/ftw/global-data, CC-BY-4.0; GeoParquet/PMTiles) que corresponde al rectángulo. NO descargue el producto global. Si es GeoParquet, filtre por bounding box.
   ADVERTENCIA: el benchmark de FTW no incluye México, y el riego árido y Norteamérica no están en su entrenamiento. Las predicciones sobre Delicias están fuera del dominio de entrenamiento: aplique el filtro de confianza y revise a mano los polígonos de las protagonistas (paso 4).
3) Recorte, calcule area_ha y filtre los campos < 1 ha. Copie la confianza por polígono (escala 0–100) a ftw_confianza; documente también la capa de confianza de 500 m (umbral ≥ 0.4 según FTW).
4) Para la demostración: 30–60 parcelas de un solo sector (la zona piloto) y 3 protagonistas (protagonista=true). Si el peso del archivo y la cuota de Earth Engine lo permiten tras el piloto de consumo, conserve todas las parcelas del rectángulo con confianza suficiente: el indicador de zona y H3 son más sólidos con más parcelas. Protagonistas, de preferencia, una por cada estado del plazo:
   - una alfalfa vieja (por vencer);
   - una de chile con suelo desnudo en invierno (libre);
   - una huerta de nogal (comprometida), en lugar de la parcela de forraje o maíz del kit 23.
   Se eligen con el apoyo visual de A3; si aún no está disponible, posponga la selección y notifíquelo.
   REVISIÓN MANUAL OBLIGATORIA de las 3 protagonistas: compare cada polígono con una imagen en color verdadero (HLS o Sentinel-2) y corrija el contorno si no coincide con la parcela; registre la corrección en Raiz/cuadernos/B1_revision_protagonistas.md (Cristian la pasa a docs/).
5) Entregue en Raiz/entregas/ parcelas_base.geojson y parcelas_muestra.geojson (polígonos FTW que contienen los puntos etiquetados, con punto_id y bloque) conforme al contrato (sección 2.2); los campos que no le corresponden se dejan en null.

PRUEBA:
- verificación de esquema;
- un mapa estático (PNG) con las parcelas coloreadas por confianza FTW;
- % de parcelas con confianza < 50. Si es > 40%, notifíquelo: será necesario editar manualmente los polígonos de las protagonistas.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En motor/B1_parcelas.ipynb:» → «En motor/B1_parcelas.ipynb (lo corre la sesión de Chrome; su revisión, en B1_revision.ipynb de Raiz/cuadernos/):»
- «registre la corrección en docs/.» → «registre la corrección en Raiz/cuadernos/B1_revision_protagonistas.md (Cristian la pasa a docs/).»
- «5) Entregue parcelas_base.geojson y parcelas_muestra.geojson (» → «5) Entregue en Raiz/entregas/ parcelas_base.geojson y parcelas_muestra.geojson (»
- «- verificación de esquema (o validar_contrato.py → "CONTRATO OK");» → «- verificación de esquema;»

**Prueba de aceptación** (kit B1):
```text
PRUEBA:
- verificación de esquema;
- un mapa estático (PNG) con las parcelas coloreadas por confianza FTW;
- % de parcelas con confianza < 50. Si es > 40%, notifíquelo: será necesario editar manualmente los polígonos de las protagonistas.
```

**Plan B:** el kit no trae uno para B1. Si la sesión de Chrome no logra entregar `parcelas_base.geojson`, se aplica R3 (kit §8): el núcleo se queda con las 3 protagonistas.

**Línea de LEEME.md** (una por archivo; ajuste la fecha y el cuaderno):
```text
B1_mapa_confianza.png | Fields of The World 2025 (Source Cooperative, source.coop/ftw/global-data, CC-BY-4.0), confianza por polígono; parcelas_base.geojson | 2026-11-14 | colab/B1_revision.ipynb
fuentes_B1.csv | Fuentes de B1: parcelas_base.geojson y parcelas_muestra.geojson de Raiz/entregas/ (sha256) | 2026-11-14 | colab/B1_revision.ipynb
```
Aviso en el grupo: `ENTREGA: B1_mapa_confianza.png — prueba OK`. Mande además, por mensaje a Cristian, los 3 `id` de las protagonistas.

---

## A3 · HLS del año agrícola 2026 por parcela

| | |
|---|---|
| **Lo hace la sesión de Chrome** | Pasos 1 a 4 del prompt, en Earth Engine: colecciones HLS L30/S30 v002, renombrado del NIR, Fmask, escala y corrida piloto de EECU. Exporta a Drive los compuestos mensuales de oct-2025 a sep-2026 de la zona piloto |
| **Le toca a usted** | Pasos 5 a 7: estadística mensual por parcela, días de suelo desnudo y NDVI del último mes. Y la PRUEBA |
| **Entradas** | Las exportaciones de la sesión de Chrome (CSV por parcela o GeoTIFF mensuales; los nombres los anuncia esa sesión en el grupo o en `LEEME.md`) y `parcelas_base.geojson` |
| **Cuaderno** | `A3_hls_gee.ipynb` en `Raiz/cuadernos/` (nombre del kit) |
| **Hora límite** | Sáb 14:30 (kit A3) |
| **Verificación de datos** | [verificar_datos_nasa.md → HLS](verificar_datos_nasa.md#2-hls-l30-y-s30-v002-a3-a3-m-y-a42) |

**Antes de calcular, pregunte a la sesión de Chrome (o lea su línea de `LEEME.md`):**
- qué factor de escala trae la exportación;
- qué valor marca «sin dato»;
- qué bandas trae.

No aplique la escala dos veces. Vea la guía de verificación, §2.

**Dos huecos del kit que debe avisar, no rellenar:**
1. **Columna `dias_desnudo_viento_alto`.** La pide la tabla 0.4-B, pero el prompt A3 no define «viento alto».
   - No invente el umbral: P5 lo declara en `supuestos.json`, con fuente o como «assumption».
   - Si no está declarado, avise a Cristian antes de entregar: el validador no acepta esa columna vacía.
2. **Paso 6 (suelo desnudo).** Pide observaciones individuales.
   - Si la exportación solo trae compuestos mensuales, dígalo.
   - Use la interpolación mensual de A3-M (paso 8) y rotúlela «aproximación mensual». Cristian decide si vale para 2026.

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P2 HLS y memoria.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A3.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A3.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A3 (P2) | `hls_mensual_parcelas.csv` y `suelo_desnudo.csv` | (id, mes, banda, mediana, p25, p75, n_validos); (id, dias_suelo_desnudo_feb_abr, dias_desnudo_viento_alto, ndvi_ultimo_mes, meses_validos) |
Además: fuentes_A3.csv (archivo, url_o_api, fecha_consulta, sha256). Formato de mes: AAAA-MM.

DOCUMENTOS DE REFERENCIA (pegados)
S9 §5 "Cálculo: lo que cambia" (copiado tal cual):
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
[PEGA AQUÍ lo que diga la sesión de Chrome sobre su exportación: nombres de archivo, bandas, factor de escala y valor de "sin dato".]
[PEGA AQUÍ, si P5 ya lo declaró, el umbral de "viento alto" de supuestos.json con su fuente.]

TAREA
NOTA DEL EQUIPO: los pasos 1 a 4 (Earth Engine) ya los hizo la sesión de Chrome; yo empiezo en el paso 5 con sus archivos de Drive. Si la exportación es GeoTIFF, calcula por parcela (polígonos de parcelas_base.geojson) la mediana, p25, p75 y n_validos de cada banda e índice por mes. Si alguna banda o mes no viene en la exportación, dímelo; no lo inventes. Si hls_mensual_parcelas.csv ya está en entregas/LEEME.md, no lo rehagas: solo verifícalo.
Tarea A3. Se trabajará en Google Earth Engine (Python `ee` desde Colab, cuaderno A3_hls_gee.ipynb en Raiz/cuadernos/).
1) Cargue como FeatureCollection las parcelas de parcelas_base.geojson (zona piloto) y de parcelas_muestra.geojson (polígonos de los puntos etiquetados), que genera B1. Si aún no existen, utilice el rectángulo de la zona piloto de data/params.json y avise.
2) Utilice NASA/HLS/HLSL30/v002 y NASA/HLS/HLSS30/v002 entre 2025-10-01 y 2026-09-30 (año agrícola 2026).
   - Antes de calcular, verifique en el catálogo de Earth Engine los nombres de las bandas de cada colección (difieren entre L30 y S30), la banda Fmask y que existan escenas de 2026 sobre el área. Si falta una de las dos colecciones, use la disponible y márquelo.
   - Armonice las bandas: azul, verde, rojo, NIR, SWIR1 y SWIR2.
   - NOTA DE RENOMBRADO: el NIR es B5 en L30 y B8A (NIR angosto) en S30. Renombre ambas colecciones a nombres comunes ANTES de fusionarlas:
     L30: B2 azul, B3 verde, B4 rojo, B5 NIR, B6 SWIR1, B7 SWIR2.
     S30: B2 azul, B3 verde, B4 rojo, B8A NIR, B11 SWIR1, B12 SWIR2 (confirme B11–B12 en la guía de LP DAAC).
     No utilice B8 de S30 como NIR ni B5 de S30 (es borde rojo).
3) Enmascare nubes, nube adyacente, sombras y nieve con Fmask (bit 1 nube, 2 adyacente, 3 sombra, 4 nieve). NO enmascare el bit de agua (bit 5): el riego por inundación puede marcarse como agua. Aplique la escala 0.0001 y descarte el relleno −9999. Considere que el Fmask de L30 presenta omisiones antes de abr-2022. Calcule NDVI y LSWI.
4) CORRIDA PILOTO antes de exportar: las 3 protagonistas y 1 mes. Lea el consumo de EECU de la tarea y anótelo en docs/ee_uso.md.
5) Genere compuestos MENSUALES (mediana) y, por parcela, obtenga la mediana, p25 y p75 de cada banda e índice por mes. Exporte a CSV: hls_mensual_parcelas.csv en Raiz/entregas/ (id, mes, banda, mediana, p25, p75, n_validos).
6) Calcule por parcela los días aproximados de suelo desnudo entre el 1-feb y el 30-abr de 2026: días con NDVI < 0.2 a partir de las observaciones válidas, interpolando entre fechas. Documente el método. Guarde suelo_desnudo.csv en Raiz/entregas/.
7) Por parcela, guarde la mediana del NDVI del último compuesto mensual válido (ndvi_ultimo_mes), sin modificar otros campos.

PRUEBA DE ACEPTACIÓN:
- % de parcelas con ≥ 8 meses válidos (reportarlo; meta ≥ 80%).
- Gráfica de NDVI mensual de las 3 parcelas protagonistas.
  - Una alfalfa debe mostrarse verde casi todo el año, con caídas por corte.
  - Un chile, verde en verano y bajo en invierno.
  - Un nogal, verde en verano y sin hojas en invierno.
- Si no se observa este comportamiento, notifíquelo.
Explique qué es el NDVI con un ejemplo de estas parcelas.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «cuaderno datos/A3_hls_gee.ipynb» → «cuaderno A3_hls_gee.ipynb en Raiz/cuadernos/»
- «Exporte a CSV: data/processed/hls_mensual_parcelas.csv (» → «Exporte a CSV: hls_mensual_parcelas.csv en Raiz/entregas/ (»
- «Guarde data/processed/suelo_desnudo.csv.» → «Guarde suelo_desnudo.csv en Raiz/entregas/.»

**Prueba de aceptación** (kit A3):
```text
PRUEBA DE ACEPTACIÓN:
- % de parcelas con ≥ 8 meses válidos (reportarlo; meta ≥ 80%).
- Gráfica de NDVI mensual de las 3 parcelas protagonistas.
  - Una alfalfa debe mostrarse verde casi todo el año, con caídas por corte.
  - Un chile, verde en verano y bajo en invierno.
  - Un nogal, verde en verano y sin hojas en invierno.
- Si no se observa este comportamiento, notifíquelo.
Explique qué es el NDVI con un ejemplo de estas parcelas.
```

**Plan B** (kit A3). La que lo ejecutaría es la sesión de Chrome: usted no descarga HLS.
**Plan B:** si Earth Engine falla o no otorga permiso, utilizar `earthaccess` con HLS de LP DAAC, recortando únicamente el área. Es más lento: limitarse a las protagonistas y a una muestra.

**Líneas de LEEME.md:**
```text
hls_mensual_parcelas.csv | HLS L30/S30 v002 (NASA LP DAAC; Earth Engine NASA/HLS/HLSL30/v002 y NASA/HLS/HLSS30/v002), exportación de la sesión de Chrome, oct-2025 a sep-2026, zona piloto | 2026-11-14 | colab/A3_hls_gee.ipynb
suelo_desnudo.csv | Derivado de hls_mensual_parcelas.csv (NDVI < 0.2, 1-feb a 30-abr de 2026; S9 §5); viento de eto_diaria.csv (NASA POWER) | 2026-11-14 | colab/A3_hls_gee.ipynb
fuentes_A3.csv | Fuentes de A3: exportaciones de la sesión de Chrome y parcelas_base.geojson (sha256) | 2026-11-14 | colab/A3_hls_gee.ipynb
```
Aviso: `ENTREGA: hls_mensual_parcelas.csv — prueba OK` y `ENTREGA: suelo_desnudo.csv — prueba OK`.

---

## A3-M · Memoria de la parcela, 2016–2026

Es segunda línea (S9 §8): no se pone por delante de A3 ni de A4.2.

| | |
|---|---|
| **Lo hace la sesión de Chrome** | La parte A (pasos 1 a 5): extracción en Earth Engine, piloto de consumo y una exportación por año agrícola, de 2025 hacia atrás. El consumo de EECU lo anota esa sesión en `docs/ee_uso.md` |
| **Le toca a usted** | Las partes B (reglas, pasos 6 a 9) y C (validación y sensibilidad, pasos 10 y 11), en pandas, con cada año que llega |
| **Entradas** | Las exportaciones anuales de NDVI mensual de la sesión de Chrome; `hls_mensual_parcelas.csv` y `suelo_desnudo.csv` (A3, para 2026); `cultivos_parcelas.csv` (A4.2, para la edad); `etiquetas_unidas.csv` (P3, para el paso 10) |
| **Cuaderno** | `A3M_memoria.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Cada año se entrega en cuanto llega. **Si a las 20:30 del sábado no hay ningún año exportado, se aplica el plan B general.** Años restantes: sáb 20:30 a 1:00. Funciones congeladas: dom 8:00 |
| **Verificación de datos** | [verificar_datos_nasa.md → HLS](verificar_datos_nasa.md#2-hls-l30-y-s30-v002-a3-a3-m-y-a42) (fecha de inicio de cada colección) |

**Cada vez que entregue años nuevos:** reescriba los 4 archivos completos, cambie la fecha de su línea en `LEEME.md` (no agregue otra) y avise.

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P2 HLS y memoria.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A3M.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A3M.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A3-M (P2) | `memoria_mensual.csv`, `memoria_parcelas.csv`, `memoria_resumen.csv` y `memoria_validacion.csv` | (id, anio_agricola, mes, ndvi_mediana, n_validos); (id, anio_agricola, estado, meses_verdes, max_verano, max_invierno, dias_suelo_desnudo_feb_abr, meses_validos); (id, edad_perenne_anios, dias_suelo_desnudo_mediana, estado_2025); tabla de acuerdo con las etiquetas de 2026 |
Además: fuentes_A3M.csv (archivo, url_o_api, fecha_consulta, sha256). Estados permitidos en memoria_parcelas.csv y estado_2025: perenne, verano, invierno, doble, descanso, sin_dato (kit §2.2).

DOCUMENTOS DE REFERENCIA (pegados)
S9 §5 "Cálculo: lo que cambia" (copiado tal cual; de aquí salen los umbrales):
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

TAREA
NOTA DEL EQUIPO: la parte A (pasos 1 a 5, Earth Engine) la hace la sesión de Chrome. Yo hago las partes B y C en pandas con los años exportados que haya en Drive. Primero imprime qué años agrícolas hay, cuántas parcelas trae cada uno y si algún año usa una sola colección (L30 o S30). Si falta cultivos_parcelas.csv, deja edad_perenne_anios en null. Si falta etiquetas_unidas.csv, no hagas el paso 10 y avísame. En la prueba, el consumo de EECU lo reporta la sesión de Chrome (docs/ee_uso.md).
Tarea A3-M. En A3M_memoria.ipynb, en Raiz/cuadernos/ (Earth Engine con Python `ee` desde Colab; después, pandas).

A) EXTRACCIÓN (Earth Engine)
1) Parcelas: solo parcelas_base.geojson (zona piloto). No use la muestra del distrito.
2) Colecciones y máscara: las mismas de A3 (HLSL30 y HLSS30 v002, renombrado del NIR, Fmask sin enmascarar el agua, escala 0.0001, relleno −9999). Aquí solo se calcula NDVI. Verifique en el catálogo la fecha de inicio de cada colección; si para algún año falta una de las dos, use la disponible y márquelo.
3) Año agrícola Y = del 1 de octubre de Y−1 al 30 de septiembre de Y. Compuesto mensual = mediana del NDVI de las observaciones válidas del mes. Por parcela: mediana del compuesto y número de observaciones válidas (n_validos).
4) PILOTO DE CONSUMO, obligatorio antes de exportar: las 3 protagonistas y el año agrícola 2025 completo. Lea el consumo de EECU de la tarea, estime el consumo de todas las parcelas por 10 años y anótelo en docs/ee_uso.md junto con lo ya gastado en A3. Compare con la cuota de 150 EECU-h al mes y con el margen de reserva que fije Cristian. Si la estimación no cabe, aplique el PLAN B.
5) Exporte POR AÑOS, un Export.table.toDrive por año agrícola, empezando por el más reciente: 2025, 2024, 2023, 2022, 2021, 2020, 2019 y después 2018, 2017 y 2016. Sin getInfo() en ciclos. Cada año que llega se entrega: no espere a tenerlos todos.
   PLAN B: solo 2019–2026. La franja de la ficha empieza entonces en 2019 y así se declara.
   SOLO SI SOBRA TIEMPO (S9 §8): años 2013 a 2015.

B) REGLAS (pandas; umbrales leídos de la sección 5 de S9, que le pego; ninguno de memoria)
6) Un "mes verde" es un mes con NDVI ≥ 0.40. Para cada parcela y año agrícola calcule: meses_verdes, max_verano (máximo de jun–sep), max_invierno (máximo de dic–mar) y meses_validos.
7) Estado del año, en este orden:
   - sin_dato: menos de 8 meses válidos, o ningún mes válido en la ventana de verano o en la de invierno;
   - perenne: 8 meses verdes o más en ese año y también en el año anterior o en el siguiente (dos años seguidos);
   - doble: max_verano ≥ 0.40 y max_invierno ≥ 0.40, sin ser perenne;
   - verano: solo max_verano ≥ 0.40;
   - invierno: solo max_invierno ≥ 0.40;
   - descanso: ninguno de los dos.
8) Suelo desnudo de cada año: días con NDVI < 0.2 entre el 1-feb y el 30-abr, por interpolación lineal entre los valores mensuales de enero a mayo (cada valor asignado al día 15). Declárelo como aproximación mensual. Para 2026, compare con el valor de A3 (observaciones individuales) y reporte la diferencia.
9) Resumen por parcela:
   - dias_suelo_desnudo_mediana: mediana de los años con dato;
   - estado_2025;
   - edad_perenne_anios, con cultivo_actual de A4.2:
     · alfalfa: años agrícolas consecutivos en estado perenne contados hacia atrás desde 2026; mínimo 1 si el mapa de 2026 dice alfalfa;
     · nogal: años consecutivos con señal de verano (estado verano, doble o perenne) contados hacia atrás desde 2026. El nogal pierde la hoja en invierno y puede no cumplir la regla de 8 meses: su condición de perenne la da el mapa de cultivos, y la memoria solo le calcula la antigüedad;
     · los demás cultivos y las parcelas abstenidas: null.
   Si A4.2 aún no está entregada, deje edad_perenne_anios en null y vuelva a calcularla después.

C) VALIDACIÓN Y SENSIBILIDAD
10) Compare el estado de 2026 con las etiquetas a ciegas de 2026 (etiquetas_unidas.csv, solo las de la zona piloto) y con cultivo_actual: alfalfa ↔ perenne; maíz, sorgo, algodón y chile ↔ verano (o doble); cereal de invierno ↔ invierno (o doble); barbecho ↔ descanso; nogal ↔ verano o perenne (reporte cuántos caen en cada uno). Entregue la tabla de acuerdo.
11) Repita los estados con los umbrales 0.35 y 0.45 y reporte qué proporción de parcelas-año cambia de estado.

SALIDAS (en Raiz/entregas/): memoria_mensual.csv, memoria_parcelas.csv, memoria_resumen.csv y memoria_validacion.csv, con las columnas del ESQUEMA DE SALIDA.

PRUEBA DE ACEPTACIÓN (imprímala):
- % de parcelas-año con estado distinto de sin_dato;
- tabla de acuerdo de 2026 y proporción de acuerdo;
- franja de memoria de las 3 protagonistas, año por año;
- tabla de sensibilidad 0.35 / 0.40 / 0.45;
- consumo de EECU real frente al estimado.
Explique en 5 líneas qué mide la memoria y qué no (es una regla sobre el verdor, no un padrón de cultivos).
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En datos/A3M_memoria.ipynb (» → «En A3M_memoria.ipynb, en Raiz/cuadernos/ (»
- «SALIDAS: memoria_mensual.csv,» → «SALIDAS (en Raiz/entregas/): memoria_mensual.csv,»

**Prueba de aceptación** (kit A3-M):
```text
PRUEBA DE ACEPTACIÓN (imprímala):
- % de parcelas-año con estado distinto de sin_dato;
- tabla de acuerdo de 2026 y proporción de acuerdo;
- franja de memoria de las 3 protagonistas, año por año;
- tabla de sensibilidad 0.35 / 0.40 / 0.45;
- consumo de EECU real frente al estimado.
Explique en 5 líneas qué mide la memoria y qué no (es una regla sobre el verdor, no un padrón de cultivos).
```

**Plan B:**
- Del prompt: solo 2019–2026. La franja empieza en 2019 y así se declara.
- Del kit:

**Plan B general:** si a las 20:30 del sábado no hay ningún año exportado, la memoria sale de la demostración; `memoria`, `edad_perenne_anios` y `dias_suelo_desnudo_mediana` quedan en null y la página dice «field memory: not run».

**Líneas de LEEME.md** (una por archivo; actualice la fecha en cada entrega):
```text
memoria_mensual.csv | HLS L30/S30 v002 (NASA LP DAAC), NDVI mensual por año agrícola, exportaciones de la sesión de Chrome, años <lista de años> | 2026-11-14 | colab/A3M_memoria.ipynb
memoria_parcelas.csv | Reglas de S9 §5 sobre memoria_mensual.csv (umbral 0.40; kit A3-M, pasos 6–8) | 2026-11-14 | colab/A3M_memoria.ipynb
memoria_resumen.csv | Resumen por parcela de memoria_parcelas.csv y cultivos_parcelas.csv (kit A3-M, paso 9) | 2026-11-14 | colab/A3M_memoria.ipynb
memoria_validacion.csv | Estado 2026 frente a etiquetas_unidas.csv (zona piloto) y cultivo_actual (kit A3-M, paso 10) | 2026-11-14 | colab/A3M_memoria.ipynb
fuentes_A3M.csv | Fuentes de A3-M: exportaciones anuales de la sesión de Chrome (sha256) | 2026-11-14 | colab/A3M_memoria.ipynb
```
Aviso: `ENTREGA: memoria_parcelas.csv — prueba OK (años …)`.

---

## A4.2 · Mapa de cultivos de 2026 (con P3)

| | |
|---|---|
| **Quién** | P2, con P3 (kit A4.2). P3 trae las etiquetas (`etiquetas_unidas.csv`) |
| **Entradas** | `hls_mensual_parcelas.csv` (A3); `etiquetas_unidas.csv` (A4.1); `parcelas_base.geojson` y `parcelas_muestra.geojson` (B1) |
| **Cuaderno** | `A4_mapa_cultivos.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 15:00–20:30; entrega entre 18:00 y 20:30 (kit §3) |
| **Verificación de datos** | [verificar_datos_nasa.md → HLS](verificar_datos_nasa.md#2-hls-l30-y-s30-v002-a3-a3-m-y-a42) y [Fields of The World](verificar_datos_nasa.md#7-fields-of-the-world-2025-b1) |

**Avise a Cristian antes de empezar si falta algo de esto:**
- **HLS de la muestra.** Para entrenar hace falta el HLS de los polígonos de `parcelas_muestra.geojson` (los puntos etiquetados). Si la sesión de Chrome solo exportó la zona piloto, no hay con qué entrenar.
- **Referencia de Conagua.** La comparación usa la Estadística Agrícola 2016-2017, Cuadro 3.5 (archivo 29). No está en el repo: pídala.
- **Presto.** El enfoque C («solo si sobra tiempo») no se inicia antes del hito de las 20:30 (kit §3).

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P2 HLS y memoria (con P3).

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_A42.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_A42.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| A4.2 (P2) | `cultivos_parcelas.csv` y `tabla_metodos.csv` | (id, cultivo_actual, prob_max, acuerdo_metodos, abstencion); (enfoque, f1_macro, f1_por_clase, tiempo) |
Además: una figura PNG (curva cobertura–exactitud) y fuentes_A42.csv (archivo, url_o_api, fecha_consulta, sha256).
Valores permitidos de cultivo_actual (kit §2.2): "alfalfa", "nogal", "chile", "maiz_forrajero", "sorgo", "algodon", "cereal_invierno", "barbecho", "sin_clasificar"; "forraje_verano" solo si las etiquetas agrupan maíz y sorgo. acuerdo_metodos: "2/2" o "1/2".

DOCUMENTOS DE REFERENCIA (pegados)
S9 §6, prueba 1 (copiada tal cual):
| 1 | Mapa de cultivos | F1 macro con bloques espaciales de 5 km; áreas con Olofsson; abstención si p < 0.6 |
Advertencia del kit v4, sección A4 (copiada tal cual):
> **Advertencia sobre Fields of The World:** su benchmark no incluye México y el riego árido de Norteamérica no está en su entrenamiento. Se usan sus predicciones globales de 2025 (CC-BY-4.0), con filtro de confianza por polígono y revisión manual de las 3 protagonistas (B1). En la página se declara: *"Field boundaries are NN predictions outside the model's training domain; filtered by confidence and manually reviewed for the showcased fields."*
[PEGA AQUÍ, si Cristian te la pasó, la tabla de la Estadística Agrícola 2016-2017 de Conagua, Cuadro 3.5 (archivo 29). Si no está, la comparación se reporta como "no realizada: falta la referencia".]

TAREA
NOTA DEL EQUIPO: trabajo con las tablas de entregas/; no uso Earth Engine. Si no hay HLS para los polígonos de la muestra etiquetada, detente y avísame.
Tarea A4.2. En A4_mapa_cultivos.ipynb (Raiz/cuadernos/), con hls_mensual_parcelas.csv de Raiz/entregas/ y las etiquetas acordadas (etiquetas_unidas.csv de Raiz/entregas/). Los enfoques A y B son OBLIGATORIOS; el C, SOLO SI SOBRA TIEMPO.
A) REGLAS FENOLÓGICAS (interpretables):
- reglas simples con pico de NDVI, meses verdes y meses de suelo desnudo para cada clase;
- documente cada regla en una tabla.
B) RANDOM FOREST (o LightGBM):
- con las variables mensuales (mediana, p25, p75 de las bandas, NDVI y LSWI);
- importancia de variables.
C) RED NEURONAL PREENTRENADA (Presto, NASA Harvest) — SOLO SI SOBRA TIEMPO (S9 §8):
- ÚNICAMENTE si el núcleo y la segunda línea de S9 §8 están terminados;
- utilice el repositorio oficial de Presto (nasaharvest/presto) para obtener embeddings por parcela en CPU, con un clasificador logístico encima;
- declare el supuesto: Presto se preentrenó con Sentinel-2 L1C a 10 m y aquí se alimenta con HLS a 30 m;
- si en 1.5 horas no se ejecuta, se abandona y se reporta "attempted, not completed".

VALIDACIÓN:
- validación cruzada ESPACIAL por bloques (cuadrícula de 5 km), NUNCA K-fold aleatorio;
- reporte F1 macro, F1 por clase y la matriz de confusión de cada enfoque en una tabla comparativa (enfoque | F1 macro | F1 por clase | tiempo de cómputo);
- la MÉTRICA PRINCIPAL es el F1 macro (declarada antes de ver resultados).

ABSTENCIÓN: cultivo_actual = "sin_clasificar" y abstencion = true si:
- prob_max < 0.6;
- los enfoques no coinciden (acuerdo 1/2);
- ftw_confianza < 50.
CURVA COBERTURA–EXACTITUD (diagnóstico; no cambia la regla): con las probabilidades fuera de pliegue de Random Forest, SOLO en la muestra de entrenamiento (nunca en la de validación Olofsson), reporte el % de parcelas retenidas y el F1 macro de las retenidas para umbrales de 0.4 a 0.8. El umbral de 0.6 queda fijo. Guarde una figura PNG en Raiz/entregas/.

Si los cereales de invierno no se separan, agrúpelos en "cereal_invierno". Si las etiquetas traen "forraje_verano", úsela como una sola clase y regístrelo en la tabla de métodos.

SALIDA:
- cultivo_actual, prob_max, acuerdo_metodos y abstencion por parcela (sin modificar otros campos), en Raiz/entregas/cultivos_parcelas.csv;
- la tabla comparativa en Raiz/entregas/tabla_metodos.csv.

PRUEBA:
- verificación de esquema;
- % de parcelas abstenidas (reportarlo; si es > 50%, notifíquelo);
- el área por cultivo del mapa frente a la estadística agrícola más reciente de Conagua para el DR-005 (de Raiz/entradas/; si no está, pídala a Cristian; referencia verificada: Estadística Agrícola 2016-2017, Cuadro 3.5, archivo 29): tabla de diferencias en %, indicando el año de la referencia y que la zona piloto no es el distrito.
Explique en 6 líneas qué enfoque obtuvo el mejor desempeño y por qué.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En datos/A4_mapa_cultivos.ipynb, con data/processed/hls_mensual_parcelas.csv y las etiquetas acordadas.» → «En A4_mapa_cultivos.ipynb (Raiz/cuadernos/), con hls_mensual_parcelas.csv de Raiz/entregas/ y las etiquetas acordadas (etiquetas_unidas.csv de Raiz/entregas/).»
- «Guarde una figura en docs/figuras/.» → «Guarde una figura PNG en Raiz/entregas/.»
- «- cultivo_actual, prob_max, acuerdo_metodos y abstencion por parcela (sin modificar otros campos);» → «- cultivo_actual, prob_max, acuerdo_metodos y abstencion por parcela (sin modificar otros campos), en Raiz/entregas/cultivos_parcelas.csv;»
- «- la tabla comparativa en docs/figuras/tabla_metodos.csv.» → «- la tabla comparativa en Raiz/entregas/tabla_metodos.csv.»
- «- verificación de esquema (o validar_contrato.py → "CONTRATO OK");» → «- verificación de esquema;»
- «(de data/raw/conagua;» → «(de Raiz/entradas/; si no está, pídala a Cristian;»

**Prueba de aceptación** (kit A4.2):
```text
PRUEBA:
- verificación de esquema;
- % de parcelas abstenidas (reportarlo; si es > 50%, notifíquelo);
- el área por cultivo del mapa frente a la estadística agrícola más reciente de Conagua para el DR-005 (de Raiz/entradas/; si no está, pídala a Cristian; referencia verificada: Estadística Agrícola 2016-2017, Cuadro 3.5, archivo 29): tabla de diferencias en %, indicando el año de la referencia y que la zona piloto no es el distrito.
Explique en 6 líneas qué enfoque obtuvo el mejor desempeño y por qué.
```

**Plan B:** el kit no trae uno para A4.2. Los enfoques A y B son obligatorios. Si el Random Forest no corre, avise con R1: según R3, el mapa se queda con las reglas y las 3 protagonistas.

**Líneas de LEEME.md:**
```text
cultivos_parcelas.csv | Reglas fenológicas + Random Forest sobre hls_mensual_parcelas.csv (HLS L30/S30 v002) y etiquetas_unidas.csv; abstención según kit A4.2 | 2026-11-14 | colab/A4_mapa_cultivos.ipynb
tabla_metodos.csv | Validación cruzada espacial por bloques de 5 km (kit A4.2) | 2026-11-14 | colab/A4_mapa_cultivos.ipynb
A42_cobertura_exactitud.png | Probabilidades fuera de pliegue del Random Forest, muestra de entrenamiento (kit A4.2) | 2026-11-14 | colab/A4_mapa_cultivos.ipynb
fuentes_A42.csv | Fuentes de A4.2: hls_mensual_parcelas.csv, etiquetas_unidas.csv y la referencia de Conagua (sha256) | 2026-11-14 | colab/A4_mapa_cultivos.ipynb
```
Aviso: `ENTREGA: cultivos_parcelas.csv — prueba OK`.

---

## Figuras del mapa y de la memoria

Son tareas de apoyo para la página y la exposición. No tienen fila en la tabla 0.4-B, que solo pide «figura PNG».
- **Cuándo:** dom hasta 8:00, figuras del mapa y de la memoria; dom 8:00–11:00, figuras para la página (kit §3).
- **Reglas:**
  - cada figura lee sus números de las entregas;
  - el título dice la fuente: «NASA HLS L30/S30 v002», sin logotipos de NASA;
  - en la memoria va la nota: «Rule-based reading of monthly greenness; not a crop census.» (kit C2).
- **Nombres:** `fig_mapa_cultivos.png`, `fig_memoria_protagonistas.png`, … (nombre libre, terminado en `.png`). Cada una lleva su línea en `LEEME.md`.

```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P2 HLS y memoria.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize. Si un paso de la tarea pide Earth Engine, dime qué archivo de la sesión de Chrome necesito y detente. Los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_FIG.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_FIG.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Solo figuras PNG en entregas/ (la tabla 0.4-B pide "figura PNG"), con nombre que empiece con fig_ y su línea en LEEME.md.

DOCUMENTOS DE REFERENCIA (pegados)
[PEGA AQUÍ la lista de figuras que pide Cristian para la página.]

TAREA
Con cultivos_parcelas.csv, memoria_parcelas.csv, parcelas_base.geojson y hls_mensual_parcelas.csv de entregas/, genera las figuras que te pido, una celda por figura. En el título o pie de cada figura va la fuente: "Source: NASA HLS L30/S30 v002; Raíz analysis". En la franja de memoria va la nota fija "Rule-based reading of monthly greenness; not a crop census." Sin logotipos. Las parcelas abstenidas van en gris con la leyenda "Not classified". No escribas en la figura ningún número que no venga de las tablas.
```
Línea de `LEEME.md`, por figura: `fig_<nombre>.png | <tablas de origen> | 2026-11-15 | colab/figuras_P2.ipynb`.
