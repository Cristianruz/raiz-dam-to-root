# 40 — KIT DE PROMPTS v4 · PROYECTO DEFINITIVO (Raíz – From Dam to Root)

> **Qué es:** el kit de construcción de las 48 horas, versión 4. Es autosuficiente: cada prompt se pega tal cual.
> **Qué sustituye:** al kit `investigaciones/23_KIT_PROMPTS_48H.md` (versión 3, 29-oct-2026), que queda como archivo histórico y no se modifica. El sábado se usa solo este documento.
> **Fecha:** 10-nov-2026.
> **Alcance:** lo define `sintesis/S9_proyecto_definitivo.md`. Si este kit y S9 difieren, **prevalece S9**; después, S8.
> **Regla:** este documento contiene diseño y prompts, no código. **Nada de lo que aquí se describe se ejecuta antes del sábado 14 de noviembre a las 9:00.**
> **Equipo:** Los Norteados. Solo Cristian usa Claude Code y hace commits. P2 a P5 usan Gemini en Colab con el prefijo G0 y entregan tablas al buzón de Drive. P6 se ocupa de textos, página, video y jurado.
> **Etiquetas:** [V] verificado en fuente primaria; [P] prensa o fuente secundaria; [S] supuesto declarado; [NE] no encontrado.

---

## 0. Reglas de trabajo (lectura obligatoria para todo el equipo)

### 0.1 Las 10 reglas
1. **Un solo repo** en GitHub y **un solo integrador** (Cristian). Solo él hace commits.
2. **Cada quien trabaja en su carpeta del buzón** (`entregas/<rol>/`). El cuaderno que produjo cada tabla se guarda en `cuadernos/` y Cristian lo copia al repo.
3. **Primero, el contrato de datos** (sección 2). Con los mismos nombres de archivos y campos, la web arranca con datos simulados mientras se calculan los reales.
4. **Un prompt = una pieza pequeña**, con entrada, salida y prueba de aceptación. Nunca «genere toda la aplicación».
5. **No se avanza** hasta aprobar la prueba de aceptación. Si falla 2 veces, se usa el **prompt de rescate R1**. Si falla 3 veces, se aplica el **plan B** de la pieza.
6. **La IA no inventa cifras.** Cada número proviene de un archivo de datos, de `data/params.json` o de S9 y S8, con su fuente y etiqueta. Si la IA introduce un número «típico», se rechaza.
7. **Commits pequeños** cada 1 o 2 horas, con mensaje claro. Cada archivo lleva el encabezado `# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026` en los archivos de Cristian, o `# AI-assisted (Gemini) — Raíz, NASA Space Apps 2026` en los cuadernos hechos con Gemini.
8. **Después de cada pieza se pide la explicación (prompt R2).** Lo que el equipo no comprende no puede defenderlo ante el jurado.
9. **Registro de IA:** cada persona anota en la hoja compartida «AI_USAGE» qué pidió, con qué herramienta y qué archivos se generaron. Cristian la exporta a `AI_USAGE.md`.
10. **Hitos obligatorios** (archivo 38, §5):
    - sáb 14:30: las 3 pantallas navegables con datos simulados;
    - sáb 20:30: una parcela completa con datos reales, publicada. Si no se cumple, se aplica R3;
    - dom 8:00: funciones congeladas;
    - dom 11:00: código congelado;
    - dom 13:00: primer envío; dom 14:30: envío final.

### 0.2 Código primero (S9 §9)
- **Un comando reconstruye todo** (datos, cálculo y web) desde los datos en caché (`data/processed/`). Una opción vuelve a pedir los datos de origen.
- **Pruebas automáticas:** FAO-56 contra los ejemplos resueltos del manual, cierre del balance de La gota, 30 casos del verificador de cifras y «ninguna cifra en la página que no venga de los datos» (K-TEST).
- **GitHub Actions publica solo si las pruebas pasan.**
- **`manifest.json` generado**, con la fuente, la fecha y el script de cada cifra.
- **Parámetros en `data/params.json`:** zona piloto, plazos, umbrales y dotaciones. Ninguna constante escrita en el código ni en el HTML.
- **Sigue siendo manual:** las etiquetas de referencia, las entrevistas, las mentorías, el ensayo y los envíos.

### 0.3 Herramientas

| Parte | Herramienta | Quién |
|---|---|---|
| Parcelas (B1) | GeoParquet de Fields of The World 2025 leído con geopandas en Colab, con filtro por rectángulo. No consume cuota de Earth Engine | P2 |
| Satélite: HLS de 2026 (A3) y memoria 2016–2026 (A3-M) | Google Earth Engine con Python `ee` en Colab y Gemini. Colecciones `NASA/HLS/HLSL30/v002` y `NASA/HLS/HLSS30/v002` (NIR: B5 en L30 y B8A en S30; se renombran antes de fusionar) | P2 |
| Mapa de cultivos (A4.2) | scikit-learn en Colab sobre las tablas de A3. No consume cuota | P2, con P3 |
| Etiquetas, exactitud y H3 (A4.1, A4.3, A7) | Colab con Gemini; hoja de cálculo | P3 |
| Clima, demanda, back-test y contraste de ET (A1, A2, A5, A6, A8) | NASA POWER Daily API (`https://power.larc.nasa.gov/api/temporal/daily/point`, `community=AG`) y Colab con Gemini | P4 |
| Dotaciones, plazos, rotaciones y tabla única de cifras (B2, B3) | Colab con Gemini; hoja de cálculo | P5 |
| Repositorio, ensamblado, motor (B4, X3.1), explicaciones (C3), pruebas (K-TEST) y web (C1, C2, X3.2, C4, C5) | **Claude Code**, en dos terminales: T1 web y T2 motor. Web estática: HTML + JS + MapLibre GL JS + d3-sankey | Cristian |
| Publicación | GitHub Pages mediante GitHub Actions; respaldo en Vercel | Cristian |
| Textos, plantillas, página, video, People's Choice y meme | App de Gemini; Claude (chat del Project) para la revisión de Cristian | P6 |
| Video | Grabador de pantalla y editor; **solo texto en pantalla y subtítulos en inglés, sin voz** | P6 |

**Ahorro de cuota de Earth Engine (nivel Comunidad, 150 EECU-h al mes por proyecto):**
1. Un proyecto de Cloud exclusivo del evento (`suelosat-evento` o el ID que confirme Cristian), **sin uso antes del sábado a las 9:00**.
2. Área limitada: solo los polígonos de la zona piloto y de la muestra etiquetada. Nada sobre el distrito completo ni sobre imágenes enteras.
3. **Corrida piloto antes de cada exportación** (3 protagonistas): se lee el consumo de EECU y se anota en `docs/ee_uso.md`.
4. Exportación de tablas con `Export.table.toDrive`, una por pieza o por año. Sin `getInfo()` en ciclos. Las series, las reglas y los días de suelo desnudo se calculan en pandas.
5. Orden de gasto: A3 (2026) → A3-M (de 2025 hacia atrás) → A8. Cristian fija el margen de reserva.
6. Plan B de A3: `earthaccess` con HLS de LP DAAC, solo para las protagonistas y la muestra.

### 0.4 Procedimiento para pegar un prompt

**A) Cristian, con Claude Code**
1. Se abre Claude Code dentro de la carpeta del repo, en dos terminales: T1 (web) y T2 (motor y ensamblado).
2. Se pega **K0** una vez por sesión y, a continuación, el prompt de la pieza completo.
3. Al terminar: **R2**, la prueba de aceptación y el comando único con sus pruebas.

**B) P2 a P5, con Gemini en Colab o en la app de Gemini**
1. Se abre un cuaderno nuevo en Colab y se monta Google Drive. El buzón está en `/content/drive/MyDrive/Raiz/`: `entradas/` (solo lectura), `entregas/<rol>/` (escritura) y `cuadernos/`.
2. Se pega **G0** (sección 4), completado con el esquema de salida de la tabla siguiente.
3. Se pega el prompt de la pieza, desde «Tarea…». Donde el prompt diga `docs/…`, se pega el fragmento del documento citado. Donde diga `web/data/…`, `data/processed/…` o `validar_contrato.py`, se usa el esquema de salida.
4. Se pide **una celda por paso** y cada celda se ejecuta antes de pedir la siguiente.
5. Al final se imprimen la prueba de aceptación y la verificación de esquema. Se guarda el cuaderno en `cuadernos/` y los archivos en `entregas/<rol>/`, y se avisa con `ENTREGA: [archivo] — prueba OK`.
6. Después de cada pieza se pega **R2**. Si algo falla 2 veces, **R1**.

**Tabla del buzón (esquema intermedio).** El ensamblador de Cristian (K-ENS) convierte estas tablas en el contrato de la sección 2.

| Pieza (persona) | Entrega en `entregas/<rol>/` | Columnas o campos obligatorios |
|---|---|---|
| B1 (P2) | `parcelas_base.geojson` (zona piloto) y `parcelas_muestra.geojson` (polígonos de los puntos etiquetados) | `id`, `area_ha`, `modulo`, `ftw_confianza`, `protagonista`; en la muestra, además `punto_id` y `bloque` |
| A3 (P2) | `hls_mensual_parcelas.csv` y `suelo_desnudo.csv` | (id, mes, banda, mediana, p25, p75, n_validos); (id, dias_suelo_desnudo_feb_abr, dias_desnudo_viento_alto, ndvi_ultimo_mes, meses_validos) |
| A3-M (P2) | `memoria_mensual.csv`, `memoria_parcelas.csv`, `memoria_resumen.csv` y `memoria_validacion.csv` | (id, anio_agricola, mes, ndvi_mediana, n_validos); (id, anio_agricola, estado, meses_verdes, max_verano, max_invierno, dias_suelo_desnudo_feb_abr, meses_validos); (id, edad_perenne_anios, dias_suelo_desnudo_mediana, estado_2025); tabla de acuerdo con las etiquetas de 2026 |
| A4.1 (P3) | `etiquetas_unidas.csv` | id, punto_id, bloque, uso (entrenamiento o validación), clase_P2, clase_P3, clase_desempate, clase_final, acuerdo |
| A4.2 (P2) | `cultivos_parcelas.csv` y `tabla_metodos.csv` | (id, cultivo_actual, prob_max, acuerdo_metodos, abstencion); (enfoque, f1_macro, f1_por_clase, tiempo) |
| A4.3 (P3) | `olofsson.csv` y figura PNG | Según el prompt A4.3 |
| A7 (P3) | `resultado_H3.md`, `h3_series.csv` y figura PNG | (anio_agricola, grupo, umbral_ndvi, n_parcelas, proporcion_con_cultivo_verano) |
| A1 y A2 (P4) | `eto_diaria.csv` y `heladas.json` | (fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m); estructura de A2 |
| A5 (P4) | `demanda_parcelas.csv`, `etc_mensual.csv` y figura del tornado | (id, opcion, lluvia_pct, bruta_mm_p10, bruta_mm_p50, bruta_mm_p90, neta_mm_p50, etc_mm_p50); (id, opcion, mes, etc_mm_p50) |
| A6 (P4) | `resultado_H1.md` y figura PNG | Según el preregistro (archivo 30) |
| A8 (P4) | `et_contraste.csv` y figura PNG | (mes, et_modelo_mm, et_ssebop_mm, et_wapor_mm) |
| B2 (P5) | `dotaciones.json`; `historial_superficie.csv` solo si sobra tiempo | Bloques `dotaciones` y `distrito` del contrato (sección 2.3) |
| B2-cal (P5) | `calibracion.csv` | Solo si el preregistro la declara |
| B3 (P5) | `rotaciones.json` y `filtros.py` (con sus 8 pruebas impresas) | Estructura del prompt B3, más la opción «no sembrar / rastrojo en pie» |
| Supuestos (P5) | `supuestos.json` | Valor o rango, fuente o «assumption». Incluye plazos, edad «por vencer», eficiencia parcelaria, eficiencia de goteo y punto de medición del millar |
| Tabla única de cifras (P5) | `cifras.csv` | clave, valor, unidad, fuente, fecha, etiqueta |
| Textos (P6) | `textos_ui.md`, `plantillas_explicaciones.md` (5 preguntas con marcadores `{{f1}}`, sin números) y `whatsapp_plantilla.md` | — |
| Todas las piezas con datos de origen | `fuentes_<pieza>.csv` | archivo, url_o_api, fecha_consulta, sha256 |
| K-INT, K-ENS, K-TEST, B4, X3.1, X3.2, C1 a C5 | — | **Los hace Cristian con Claude Code**, conforme al contrato de la sección 2 |

---

## 1. Qué cambia frente al kit 23

| Tema | Kit 23 (v3) | Kit v4 |
|---|---|---|
| Idea central | ¿Cabe la rotación en el agua del escenario? | El plazo del agua: cuánta agua pide cada cultivo al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación |
| Agua disponible | Tres escenarios por terciles (seco, normal, bueno) × lluvia; 6 llaves precalculadas | Deslizador de dotación de 0 a 12 millares por hectárea, con tres marcas, e interruptor de lluvia −20 %. La web calcula la cobertura, las hectáreas y el semáforo |
| Unidad | m³ en presa por parcela | Millares por hectárea en la toma de la parcela [S]. 1 millar/ha = 1,000 m³/ha = 10 cm |
| Piezas nuevas | — | Memoria de la parcela 2016–2026 (A3-M), estado del plazo, agua ya comprometida, experimento natural de 2025 (A7), contraste regional de ET (A8) y pruebas automáticas (K-TEST) |
| Fuera del alcance | OPERA, Presto y PuLP opcionales | OPERA y subsidencia, optimizador y agente conversacional: fuera. Presto: solo si sobra tiempo |
| Nogal | Kc fijo de FAO-56 | Kc en función de la cobertura del dosel (S8, decisión 5); se muestra como rango |
| Back-test | Puntos de control de prensa | Verdad: salida por obra de toma de La Boquilla (SIH). La prensa queda como respaldo rotulado |
| Publicación | Manual | GitHub Actions: publica solo si pasan las pruebas |
| Hitos | Sáb 12:00 y 20:00; dom 13:00, 18:00 y 20:00 | Sáb 14:30 y 20:30; dom 8:00, 11:00, 13:00 y 14:30 (archivo 38, §5) |

---

## 2. CONTRATO DE DATOS v4 (diseño congelado; ninguna modificación sin autorización del integrador)

> El contrato se describe con tablas de campos. Son estructuras de datos, no código.

### 2.1 Estructura del repo
- Raíz del repo: `raiz-dam-to-root/` (sin acento en ligas y carpetas).
- `CLAUDE.md`: reglas para la IA (texto en 2.6).
- `README.md`: página técnica en inglés.
- `AI_USAGE.md`: registro de uso de IA.
- `LIMITATIONS.md`.
- `data/raw/`: datos públicos sin modificar.
- `data/processed/`: caché de tablas intermedias (copias validadas del buzón).
- `data/params.json`: todas las constantes, con fuente y etiqueta.
- `datos/`: cuadernos de Colab de A1 a A8.
- `motor/`: ensamblador, B1 a B4, X3.1 y rotaciones.
- `tests/`: pruebas automáticas.
- `web/`: `index.html`, `app.js`, `style.css` y `web/data/` con `parcelas.geojson`, `cubo.json`, `explicaciones.json` y `manifest.json`.
- `docs/`: S9, S8, este kit, preregistro, enunciado, figuras y resultados.
- Flujo de publicación de GitHub Actions.

### 2.2 `web/data/parcelas.geojson` (un Feature por parcela estimada)

| Campo de `properties` | Tipo | Ejemplo o valores | Quién lo llena |
|---|---|---|---|
| `id` | string | `"P0001"` | B1 |
| `area_ha` | number | `8.4` | B1 |
| `modulo` | string o null | null si no puede asignarse; el límite de los módulos no es público [NE] y la interfaz dice «zona piloto» | B1 |
| `ftw_confianza` | number 0–100 | `72` | B1 |
| `protagonista` | bool | `true` en las 3 parcelas de la historia | B1 |
| `cultivo_actual` | string | `"alfalfa"`, `"nogal"`, `"chile"`, `"maiz_forrajero"`, `"sorgo"`, `"algodon"`, `"cereal_invierno"`, `"barbecho"`, `"sin_clasificar"`; `"forraje_verano"` solo si las etiquetas agrupan maíz y sorgo | A4.2 |
| `prob_max` | number 0–1 | `0.81` | A4.2 |
| `acuerdo_metodos` | string | `"2/2"`, `"1/2"` (reglas + Random Forest) | A4.2 |
| `abstencion` | bool | `true` si la probabilidad es menor de 0.6, si los métodos no coinciden o si la confianza de FTW es menor de 50 | A4.2 |
| `dias_suelo_desnudo_feb_abr` | integer | `47` (año agrícola 2026) | A3 |
| `ndvi_ultimo_mes` | number o null | `0.62` | A3 |
| `memoria` | lista o null | Una entrada por año agrícola desde 2016, con `anio` y `estado`: `perenne`, `verano`, `invierno`, `doble`, `descanso` o `sin_dato` | A3-M |
| `dias_suelo_desnudo_mediana` | integer o null | Mediana de los días de suelo desnudo (1-feb a 30-abr) de los años con dato | A3-M |
| `edad_perenne_anios` | integer o null | Años consecutivos como perenne, contados hacia atrás desde 2026; null si no es perenne o si no hay memoria | A3-M |
| `estado_plazo` | string o null | `libre`, `por_vencer` o `comprometida`; null si hay abstención | B4 |

- **Se retira** `insar_mm_anio` (OPERA queda fuera del alcance).
- Si la memoria cubre todos los años con estado perenne, la edad es un mínimo y la web la muestra con «≥».

### 2.3 `web/data/cubo.json` v4

Se retiran los escenarios por terciles, las 6 llaves `"escenario|lluvia_pct"` y el campo `cabe`. La dotación la elige el usuario con el deslizador y la web calcula con ella.

| Ruta | Tipo | Contenido | Quién |
|---|---|---|---|
| `meta.version` | string | `"4.0"` | K-ENS |
| `meta.generado`, `meta.fuentes`, `meta.notas`, `meta.mock` | — | Fecha y hora; lista de fuentes; notas; marca de datos simulados, general y por campo | K-ENS |
| `distrito.boquilla.namo_hm3`, `.fuente_namo` | number, texto | 2,846.780 hm³; tabla de Conagua reproducida en prensa [P] | B2 |
| `distrito.boquilla.almacenamiento_hm3`, `.fecha_almacenamiento`, `.fuente_almacenamiento` | number o null, fecha, texto | Último dato con fecha y fuente; null si no existe | B2 |
| `distrito.acuifero_0831.disponibilidad_hm3_anio`, `.fuente` | number, texto | −167.12 hm³/año; Conagua 2024, DR_0831 [V] | B2 |
| `distrito.capas_disponibles` | lista | `"cultivos"`, `"suelo_desnudo"` y `"memoria_2025"` (esta solo si A3-M entregó 2025) | K-ENS |
| `dotaciones.unidad` | string | `"millares_por_ha"` | B2 |
| `dotaciones.equivalencia` | texto | 1 millar/ha = 1,000 m³/ha = 10 cm | B2 |
| `dotaciones.deslizador.min`, `.max`, `.paso` | number | 0, 12 y el paso (valor de diseño, no dato) | B2 |
| `dotaciones.marcas[]` | lista de 3 | Por marca: `id` (`como_2025`, `como_2026`, `anio_normal`), `nombre`, `min`, `max`, `valor` (punto medio del rango), `nota`, `fuente`, `fecha_consulta`, `etiqueta` | B2 |
| `dotaciones.punto_medicion` | texto | «Toma de la parcela [S]; por confirmar con un técnico de módulo» | B2 |
| `lluvia_pct` | lista | `[0, -20]` | A5 |
| `zona.nombre` | string | `"zona piloto"` | B4 |
| `zona.superficie_total_ha`, `.superficie_clasificada_ha`, `.superficie_abstenida_ha`, `.superficie_perenne_ha` | number | Sumas de `area_ha` | B4 |
| `zona.demanda_perenne_millares.<lluvia>.p10`, `.p50`, `.p90` | number | Suma de `area_ha` × lámina bruta de la opción ACTUAL de las parcelas perennes (alfalfa y nogal no abstenidas), para lluvia `"0"` y `"-20"` | B4 |
| `zona.conteos` | objeto | Parcelas totales, libres, por vencer, comprometidas y abstenidas | B4 |
| `parcelas.<id>.opciones[]` | lista | Mínimo ACTUAL + 2 alternativas; 3 en alfalfa establecida (corte de riego en verano) | B4 |
| `…opciones[].id`, `.nombre`, `.secuencia` | string, string, lista | `"ACTUAL"`, «Rotación actual», cultivos por ciclo | B3 y B4 |
| `…opciones[].agua.lamina_bruta.<lluvia>.p10`, `.p50`, `.p90` | number | Millares por hectárea al año, en parcela, anualizada | A5 y B4 |
| `…opciones[].agua.plazo_anios.min`, `.max` | number | Años que obliga la opción | B4 |
| `…opciones[].agua.plazo_restante.min`, `.max` | number | Plazo − edad observada, con mínimo cero | B4 |
| `…opciones[].agua.compromiso_millares_ha.<lluvia>.min`, `.max` | number | Lámina P50 × plazo restante | B4 |
| `…opciones[].suelo` | objeto | `dias_desnudo`, `dias_desnudo_origen` (`"medido"` o `"estimado"`), `leguminosa`, `ruptura_plagas`, `riesgo_salinidad` (regional) | B3, A3-M y B4 |
| `…opciones[].dinero` | objeto | `margen_min`, `margen_max`, `fuente`; null si no hay fuente. **Nunca se inventa** | B4 |
| `…opciones[].semaforo.suelo`, `.dinero` | string | `verde`, `ambar`, `rojo` o `gris`. **El semáforo de agua no se guarda: lo calcula la web** | B4 |
| `…opciones[].filtros` | lista | Filtros que aplican, con motivo y fuente | B3 |
| `…opciones[].preguntas_ref` | string | Llave en `explicaciones.json` | C3 |
| `…opciones[].gota`, `.gota_goteo_con_tope`, `.gota_goteo_sin_tope`, `.tope_consumo` | objetos | Como en el kit 23: `m3_salen_presa`, `m3_perdidas_canal`, `m3_llegan_parcela`, `m3_consume_cultivo_et`, `m3_regresan_acuifero`, `m3_otras_perdidas`, `supuestos`; y `et_historica_m3`, `et_goteo_sin_tope_m3`, `cumple_sin_tope`, `base_historica` | X3.1 |

**Reglas del cubo:**
- La lámina se precalcula para las dos variantes de lluvia (`"0"` y `"-20"`). No hay dimensión de temperatura ni de escenario.
- Los bloques `gota*` y `tope_consumo` se calculan con la lámina P50 de la variante de lluvia 0.
- Los valores del bloque `distrito` se copian con su fuente; `almacenamiento_hm3` queda en null hasta tener el dato con fecha y fuente.
- Si no hay memoria, `plazo_restante` de la opción ACTUAL usa la edad null: toma el plazo completo y lleva la nota «age not available».
- En nogal no se descuenta la edad: el plazo restante es siempre el horizonte de cálculo completo, porque ese horizonte no es la vida de la huerta.
- Tamaño de `cubo.json` menor de 5 MB.

### 2.4 Reglas que calcula la web (S9 §5)
Con **D** = valor del deslizador (millares/ha), **r** = lluvia elegida (0 o −20) y, por opción, **L10, L50 y L90** = `agua.lamina_bruta[r]`:
- **Cobertura** = el menor entre 1 y D ÷ L50.
- **Hectáreas que alcanzan** = `area_ha` × cobertura. Se muestran siempre con su rango: extremo bajo con L90 y extremo alto con L10.
- **Semáforo de agua:** verde si D cubre L90; ámbar si cubre L50 pero no L90; rojo si no cubre L50; gris si la parcela está abstenida.
- **Agua ya comprometida** de la zona = `zona.demanda_perenne_millares[r].p50` ÷ (D × `zona.superficie_total_ha`), con su rango p10–p90.
  - Si pasa de 100 %, la diferencia sale de pozos o queda sin cubrir: la interfaz lo dice y enlaza con La gota.
  - Si hay superficie abstenida, el indicador es un mínimo y se muestra con «at least».
  - Si D = 0, no se divide: se muestra el mensaje de «sin dotación».
- **Casos límite:** si L50 = 0 (descanso), la cobertura es 1 y el semáforo es verde, con el texto «no irrigation needed».
- **Ejemplo de escala para las pruebas** (S9 §5, con láminas del INIFAP [V]): 10 ha con 3.5 millares/ha reciben 35 millares, que alcanzan para 2.0 ha de alfalfa (17.5), 5.1 ha de algodón (6.8) o 6.4 ha de maíz forrajero (5.5).

### 2.5 `explicaciones.json`, `manifest.json` y `data/params.json`
- **`web/data/explicaciones.json`:** sin cambio de estructura. Por llave (`EXP_<id>_<opcion>`): `textos` (las 5 respuestas con marcadores) y `valores` (el número de cada marcador). Se añade una lista de **marcadores dinámicos** (`{{d}}`, `{{ha}}`, `{{cobertura}}`) cuyo valor calcula la web con el deslizador; el verificador solo acepta los de esa lista.
- **`web/data/manifest.json`** (generado, nunca escrito a mano):
  - `fuentes_de_origen[]`: archivo, URL o API, fecha de consulta y sha256;
  - `cifras{}`: por cada cifra que muestra la web, su clave, fuente, fecha, script que la produjo y etiqueta.
- **`data/params.json`:** cada clave con valor, unidad, fuente y etiqueta.

| Clave | Valor | Fuente | Etiqueta |
|---|---|---|---|
| `zona_piloto.bbox` | Coordenadas del rectángulo; las propone P2 y las confirma Cristian el sábado | Visor web; el límite del módulo no es público | [S] |
| `unidades.millar` | 1 millar/ha = 1,000 m³/ha = 10 cm | S9 §5 | — |
| `dotaciones.deslizador` | 0 a 12 millares/ha | S9 §3 | Diseño |
| `dotaciones.como_2025` | ≈1 millar/ha, de pozos. Referencia: Módulo 4, 1 millar/ha a 4,976 ha desde 11 pozos | El Diario de Chihuahua, 28-oct-2024, según la investigación (S8 §2) | [P] |
| `dotaciones.como_2026` | 3–4 millares/ha | El Diario de Chihuahua, 27-jul-2026; nota no leída directamente (S8 §2) | [P], por confirmar |
| `dotaciones.anio_normal` | 9–10 millares/ha | Misma nota | [P], por confirmar |
| `dotaciones.punto_medicion` | Toma de la parcela | S8, decisión 2 | [S] |
| `plazo.anual` | 1 año | S9 §5 | — |
| `plazo.alfalfa` | 3–4 años | FIRA (S9 §4) | [P] |
| `plazo.nogal_horizonte` | 10 años de horizonte de cálculo. La vida de la huerta se cita con fuente INIFAP antes de publicarla | S9 §5 | [S] |
| `plazo.alfalfa_por_vencer` | 3 años o más | S9 §5 | [S] |
| `memoria.ndvi_verde` | 0.40; sensibilidad 0.35 y 0.45 | S9 §5 | [S] |
| `memoria.ventana_verano`, `memoria.ventana_invierno` | jun–sep; dic–mar | S9 §5 | [S] |
| `memoria.meses_perenne` | 8 meses o más, dos años seguidos | S9 §5 | [S] |
| `suelo.ndvi_desnudo` | NDVI menor de 0.2, del 1-feb al 30-abr | S9 §5; kit 23 (A3) | Método |
| `mapa.umbral_abstencion`, `mapa.bloque_km` | 0.6; 5 | Kit 23 (A4.2) | Método |
| `eficiencia.conduccion` | Media 0.60; rango 0.470–0.681 (2012–2016) | IMTA, COMEII 2021 | [V] |
| `eficiencia.parcelaria` | Rango declarado en `supuestos.json`; no existe valor medido para el DR-005 | — | [S] |
| `gota.c_retorno_superficial`, `gota.c_retorno_subterraneo` | 0.2; 18 % | Conagua 2024, acuífero 0831 | [V] |
| `distrito.namo_hm3` | 2,846.780 | Tabla de Conagua reproducida en prensa | [P] |
| `acuifero.disponibilidad_hm3_anio` | −167.12 | Conagua 2024, DR_0831 | [V] |

### 2.6 `CLAUDE.md` v4 (se pega el sábado a las 9:00)
```
# CLAUDE.md — Raíz – From Dam to Root (NASA Space Apps 2026, Field Shift) · equipo Los Norteados
Proyecto: mostrar, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. Zona piloto del Distrito de Riego 005 Delicias, Chihuahua.
Alcance: docs/S9_proyecto_definitivo.md (prevalece). Contrato y prompts: docs/40_kit_v4_proyecto_definitivo.md. Cifras nuevas: docs/S8_enfoque_definitivo.md. Fórmulas y pruebas por módulo: docs/33_especificacion_tecnica.md, salvo los módulos de escenarios por terciles y de factibilidad si/justo/no, que quedan superados por S9. Datos verificados: docs/27 y docs/29.
REGLAS:
1. Respete el contrato de datos v4 (kit, sección 2). No modifique nombres de archivos ni de campos.
2. No invente cifras en ningún caso: todo número proviene de data/raw, data/processed, data/params.json o de S9 y S8 con su fuente y etiqueta. Si falta un dato, utilice null y notifíquelo.
3. Ninguna cifra escrita en el HTML, en el JavaScript ni en los textos: la web lee los datos. Una prueba automática lo comprueba.
4. Encabezado en cada archivo: "# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026". Los cuadernos hechos con Gemini conservan "# AI-assisted (Gemini) — Raíz, NASA Space Apps 2026".
5. Código simple y comentado en español; sin frameworks pesados. Python en scripts y cuadernos; web estática en HTML + JS + MapLibre GL JS + d3-sankey.
6. Un comando reconstruye todo desde la caché (data/processed). Toda pieza nueva se conecta a ese comando y trae su prueba automática.
7. Cada tarea concluye con: (a) archivos creados, (b) instrucciones de ejecución, (c) resultado de la prueba de aceptación y de las pruebas automáticas, (d) pendientes.
8. Si una tarea falla 2 veces con el mismo error, deténgase y explique el problema en 5 líneas antes de continuar.
9. No utilice logotipos de NASA. Interfaz en inglés (español opcional); el mensaje de WhatsApp, en español.
10. La herramienta no reparte, vende ni intercambia agua; no pronostica la presa; no promete ahorros; no dice "first" ni "only". Cada ficha lleva el aviso: apoya y no sustituye el juicio del agricultor ni del técnico.
11. Agregue una línea a AI_USAGE.md por tarea y la entrada de cada cifra nueva en manifest.json.
```

---

## 3. LÍNEA DE TIEMPO

> Hitos del archivo 38, §5. Responsables de S9 §10. El sábado, todos asisten al registro (8:00) y a la bienvenida y plática de seguridad (9:00); la construcción empieza al terminar.

| Bloque | Cristian (Claude Code) | P2 · HLS y memoria | P3 · Etiquetas, exactitud y H3 | P4 · Clima, demanda y back-test | P5 · Dotaciones, plazos y rotaciones | P6 · Textos, página y jurado |
|---|---|---|---|---|---|---|
| **Sáb, tras la bienvenida – 12:00** | K0 → K-INT (repo, contrato simulado, comando único, publicación condicionada) → K-ENS → C1 con datos simulados | G0 → B1 (parcelas) → piloto de EECU de A3 | G0 → A4.1 (unión de etiquetas y bloques) | G0 → A1 (POWER y ETo) → A2 (heladas) | G0 → B2 (dotaciones) → B3 (rotaciones, filtros y plazos) | Sesiones de la sede de las 10:00 y las 12:00, con otro integrante; textos de interfaz |
| 12:00–14:30 | C2 (ficha) → C4 (mensaje), con datos simulados | A3 (exportación de 2026) → piloto y primeras exportaciones de A3-M (2025 hacia atrás) | Apoya a P2 en A3; prepara A4.3 | A5 (demanda con banda) | B3 → `supuestos.json` | Plantillas de explicaciones y de WhatsApp |
| **Sáb 14:30** | **HITO: las 3 pantallas navegables con datos simulados** | | | | | |
| 15:00–18:00 | K-ENS con las primeras entregas → B4. **Mentorías obligatorias a las 16:00 y 17:00** | A4.2 (reglas + Random Forest); A3-M en curso | A4.2 con P2 | A5: entrega | Tabla única de cifras; revisa B4 | **Mentorías** (prueba de pasillo); confirma con un técnico o mentor el punto de medición del millar y las dotaciones |
| 18:00–20:30 | X3.1 → C3 → conexión de datos reales → publicación | Entrega de A4.2; memoria de los años recibidos | Valida la memoria de 2026 con las etiquetas | A6 (back-test): arranque | Verificación manual de las cifras del motor | Prueba de usabilidad a las 18:00 |
| **Sáb 20:30** | **HITO: una parcela completa con datos reales, publicada.** Si no se cumple, R3 | | | | | |
| 20:30–1:00 | X3.2 (La gota en la ficha) → memoria y estado del plazo en la web → K-TEST completo | A3-M: años restantes | A7 (H3) | A6: resultado | Revisa plazos y estados | Borrador de la página (C6); historias para #MejorMeme |
| 1:00–5:30 | Descanso de Cristian dentro de la sede. Quien hace el turno de noche se queda dentro desde antes de las 21:00; los demás vuelven a las 7:00 | | | | | |
| Dom, hasta las 8:00 | C5 (pulido) y ficha imprimible | Figuras del mapa y de la memoria | A4.3 (Olofsson) | A8 (contraste de ET), si A5 está entregada | Revisión de cifras | Guion y grabación del video |
| **Dom 8:00** | **Funciones congeladas.** A las 9:00, verificación final de inscripción (todos) | | | | | |
| 8:00–11:00 | Q1 (revisión total) y correcciones | Figuras para la página | A4.3 y `resultado_H3.md` terminados | `resultado_H1.md` terminado | Lista cifra → fuente | C6 (página en inglés) y video |
| **Dom 11:00** | **Código congelado** | | | | | |
| 11:00–14:30 | 12:00, video exportado y probado en ventana de incógnito. 12:30, revisión de cifras en página, video, póster y ficha impresa (Q2). **13:00, primer envío. 14:30, envío final** | | | | | |
| 15:00–19:00 | Montaje de la mesa a las 15:00: laptop con la demo, póster, ficha impresa y teléfono. **Open House de 17:00 a 19:00:** exposición de 4 minutos y 3 de preguntas | | | | | |

- **People's Choice (17 al 20-nov) y #MejorMeme:** a cargo de P6. Sin bots: descalifican de la fase local.
- **Orden de construcción** (S9 §8): primero el núcleo; la segunda línea (memoria, H3, edad de la alfalfa, WhatsApp y ficha imprimible) solo avanza si no retrasa los hitos; lo de «si sobra tiempo» no se inicia antes del hito de las 20:30.

---

## 4. PROMPTS DE CONTEXTO Y DE ARRANQUE

### K0 — Contexto general (solo Claude Code, Cristian; se pega primero en cada sesión)
```
Usted forma parte del equipo Los Norteados en NASA Space Apps 2026 (reto "Field Shift: Adapting Farms with NASA Data"); proyecto Raíz – From Dam to Root. Lea CLAUDE.md, docs/S9_proyecto_definitivo.md (completo; define el alcance), docs/S8_enfoque_definitivo.md, docs/40_kit_v4_proyecto_definitivo.md (secciones 0, 2 y 4) y docs/33_especificacion_tecnica.md (fórmulas y pruebas por módulo). Si difieren, prevalece S9; después, el kit v4; después, S8. En el documento 33 están superados los módulos de escenarios por terciles y de factibilidad si/justo/no: use B2 y B4 del kit v4.

Usted es la única IA de construcción del repositorio. Los demás integrantes entregan tablas intermedias generadas con Gemini en la carpeta sincronizada del buzón (sección 0.4-B del kit). Usted:
- escribe los archivos del contrato (web/data/*) y data/params.json;
- escribe la web, el ensamblador, el motor y las pruebas automáticas;
- mantiene el comando único de reconstrucción y el flujo de publicación;
- hace los commits.

Presente un resumen en 8 líneas que incluya:
1. Qué se construye (la idea en una frase de S9 §1).
2. El contrato de datos v4 y el esquema del buzón.
3. Qué calcula el motor y qué calcula la web con el deslizador (kit, sección 2.4).
4. La terminal en la que estamos: [T1 web / T2 motor].
Después, espere mi siguiente instrucción.

Considere en todo momento:
- no inventar cifras (si falta un dato, use null y avise);
- no modificar el contrato sin mi autorización;
- tareas pequeñas con prueba de aceptación y prueba automática;
- no usar archivos de entregas/ que no pasen la validación de esquema;
- ninguna cifra escrita en el HTML ni en el código: todo sale de los datos o de data/params.json;
- explicar en español claro lo realizado.
```

### G0 — Prefijo para Gemini (P2 a P5; se pega al inicio de cada chat de Gemini o del panel de Gemini en Colab)
> Sustituye a K0 y a `CLAUDE.md` para quienes no usan Claude Code. Es autosuficiente: no requiere leer el repo.
```
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: [P2 HLS y memoria / P3 Etiquetas, exactitud y H3 / P4 Clima, demanda y back-test / P5 Dotaciones, plazos y rotaciones].

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/[mi_rol]/ = donde guardo resultados;
- cuadernos/ = cuadernos.
[Si la tarea usa Earth Engine: proyecto de Cloud del evento, nivel Comunidad, con cuota limitada de 150 EECU-h al mes.]

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/[mi_rol]/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA. No escribas otros archivos ni cambies nombres de columnas.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine (si aplica):
   - solo el área de las parcelas indicadas;
   - primero una corrida piloto (3 parcelas) e infórmame el consumo de EECU de la tarea;
   - después, exportaciones con Export.table.toDrive (una por pieza o por año);
   - sin getInfo() dentro de ciclos;
   - los cálculos de series, en pandas.
7. Usa bibliotecas comunes (pandas, numpy, requests, geopandas, scikit-learn, earthengine-api). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_[pieza].csv en entregas/[mi_rol]/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.

ESQUEMA DE SALIDA DE ESTA TAREA
[Pegar la fila de la tabla 0.4-B del kit: archivo(s) y columnas.]

DOCUMENTOS DE REFERENCIA (pegados)
[Pegar aquí los fragmentos que cite el prompt; por ejemplo, la tabla de Kc del archivo 27 §2.1, la sección 5 de S9 o el texto de H3 del preregistro.]

TAREA
[Pegar el prompt de la pieza (A1, A2, A3, A3-M, A4.1, A4.2, A4.3, A5, A6, A7, A8, B1, B2 o B3) desde "Tarea…". Donde diga "web/data/…", "data/processed/…" o "validar_contrato.py", se aplica el ESQUEMA DE SALIDA.]
```

### K-INT — Arranque del repo (Cristian, T2, sábado al terminar la bienvenida)
```
Cree la estructura del repo exactamente como se indica en la sección 2.1 de docs/40_kit_v4_proyecto_definitivo.md:
- CLAUDE.md con el texto de la sección 2.6;
- README.md con títulos vacíos en inglés (Summary, How it works, NASA Data, Validation, Limitations, SI/AI tools used, References);
- AI_USAGE.md con una tabla (fecha | persona | herramienta | tarea | archivos);
- LIMITATIONS.md;
- un .gitignore para Python y cuadernos;
- data/params.json con las claves de la sección 2.5, cada una con valor, unidad, fuente y etiqueta. Copie los valores de la tabla; no agregue ninguno de memoria. Lo que la tabla deja abierto (zona piloto, eficiencia parcelaria) queda en null con la nota "pendiente".

Cree también:
- web/data/parcelas.geojson, web/data/cubo.json y web/data/explicaciones.json con 3 parcelas SIMULADAS que cumplan el contrato v4 (marcadas "mock": true en meta), con memoria simulada de 2016 a 2026, para que la web arranque de inmediato;
- validar_contrato.py: lee los tres archivos y verifica campos, tipos y listas de valores de las secciones 2.2 a 2.5; imprime "CONTRATO OK" o el error;
- la carpeta tests/ con las primeras pruebas automáticas: contrato, unidades (1 millar/ha = 1,000 m³/ha = 10 cm) y el ejemplo de escala de S9 §5 (10 ha con 3.5 millares/ha: 2.0 ha de alfalfa con 17.5; 5.1 ha de algodón con 6.8; 6.4 ha de maíz forrajero con 5.5). El resto se añade en K-TEST;
- UN COMANDO ÚNICO de reconstrucción (propóngalo y documéntelo en README): valida las entregas, ensambla el contrato, calcula el motor, genera web/data/manifest.json, ejecuta las pruebas y deja web/ lista. Trabaja desde la caché (data/processed). Con una opción adicional vuelve a pedir los datos de origen que tienen API sin sesión interactiva (NASA POWER y el recorte de Fields of The World) y, para Earth Engine, relanza las exportaciones si hay credenciales; si no las hay, lista los cuadernos que deben ejecutarse y en qué orden;
- el flujo de GitHub Actions: en cada push ejecuta el comando único con las pruebas y publica la carpeta web/ en GitHub Pages SOLO si todas pasan. Proporcione la liga pública.

PRUEBA DE ACEPTACIÓN:
- validar_contrato.py imprime "CONTRATO OK" con los datos simulados;
- las pruebas automáticas pasan en local y en GitHub Actions;
- la liga pública abre sin sesión iniciada;
- con un cambio que rompe una prueba, GitHub Actions NO publica (demuéstrelo y revierta el cambio).
```

### K-ENS — Ensamblador del buzón (Cristian, T2; se vuelve a ejecutar en cada entrega)
```
Cree motor/ensamblar.py (encabezado AI-assisted (Claude Code)) y conéctelo al comando único. Debe:
1) Copiar de la carpeta sincronizada del buzón (ruta en una variable de configuración) los archivos de entregas/*/ a data/processed/. Registrar el autor (rol) y la hora en docs/entregas_log.md.
2) Validar el esquema de cada archivo contra la tabla 0.4-B de docs/40_kit_v4_proyecto_definitivo.md:
   - columnas y tipos;
   - IDs existentes en parcelas_base;
   - rangos básicos (P10 ≤ P50 ≤ P90; NDVI entre −1 y 1; prob_max entre 0 y 1; estados de la memoria dentro de su lista; dotaciones dentro del deslizador).
   Un archivo que no pasa se ignora y se reporta; nunca se corrige en silencio.
3) Construir web/data/parcelas.geojson a partir de parcelas_base + suelo_desnudo + cultivos_parcelas + memoria_parcelas y memoria_resumen (si existen). Los campos sin entrega válida conservan el valor simulado, con la marca "mock": true por campo en meta. Si no hay memoria, los campos memoria, edad_perenne_anios y dias_suelo_desnudo_mediana quedan en null.
4) Construir data/params.json definitivo con supuestos.json y dotaciones.json de P5, más las constantes verificadas de la sección 2.5 del kit.
5) Llamar a los pasos de B4, X3.1 y C3 (se construyen después, en sus prompts) para generar web/data/cubo.json y web/data/explicaciones.json. Si aún no existen, conservar los simulados.
6) Generar web/data/manifest.json:
   (a) fuentes de origen: unión de los fuentes_<pieza>.csv de las entregas (archivo, url o API, fecha de consulta, sha256);
   (b) por cada cifra que muestra la web: clave, fuente, fecha, script que la produjo y etiqueta.
7) Ejecutar validar_contrato.py y las pruebas automáticas, e imprimir un reporte de 10 líneas:
   - qué entró;
   - qué se rechazó y por qué;
   - qué sigue simulado;
   - "CONTRATO OK" o el error;
   - qué pruebas pasan y cuáles fallan.
8) Hacer commit solo si el contrato y las pruebas pasan, con el mensaje "[ENS] ensamblado HH:MM — autores: …". El push dispara la publicación condicionada.

PRUEBA DE ACEPTACIÓN:
- con el buzón vacío, el resultado es idéntico a los datos simulados y "CONTRATO OK";
- con un CSV de prueba con una columna mal nombrada, el archivo se rechaza y el reporte lo dice;
- manifest.json existe y cada cifra de los datos simulados tiene su entrada, marcada como simulada.
```

### K-TEST — Pruebas automáticas (Cristian, T2; base en K-INT, completa el sábado por la noche)
```
Tarea K-TEST. Complete la batería de pruebas automáticas en tests/ y conéctela al comando único y al flujo de publicación. Cada prueba lee sus valores esperados de los datos, de data/params.json o de un archivo de casos con fuente; ninguna los lleva escritos de memoria.

1) FAO-56: reproduzca al menos dos ejemplos resueltos de ETo del manual FAO-56 (Allen et al. 1998). Copie los datos de entrada y el resultado del PDF guardado en docs/, citando el número de ejemplo y la página. Tolerancia: la precisión con la que el manual publica el resultado. Si el PDF no está en docs/, deténgase y pídalo; no escriba los valores de memoria.
2) Unidades: 1 millar/ha = 1,000 m³/ha = 10 cm; conversión de mm a millares/ha en B4.
3) Ejemplo de escala de S9 §5: 10 ha con 3.5 millares/ha → 35 millares → 2.0 ha de alfalfa (17.5), 5.1 ha de algodón (6.8) y 6.4 ha de maíz forrajero (5.5).
4) Reglas de la web (kit, sección 2.4), ejecutadas sobre la misma función que usa la página: D = 0; lámina cero (descanso); D que cubre P90 (verde); D entre P50 y P90 (ámbar); D menor que P50 (rojo); parcela abstenida (gris); agua ya comprometida por encima de 100 %; superficie abstenida mayor que cero ("at least").
5) La gota: en cada caso, ET + acuífero + otras pérdidas = agua que sale de la presa (±1 %); ningún flujo negativo; con goteo con tope bajan el agua de presa y el retorno al acuífero; sin tope, cumple_sin_tope = false.
6) Verificador de cifras (C3): los 30 casos del set dorado, con sus 5 trampas. Meta: 0 % de cifras alteradas.
7) "Ninguna cifra en la página que no venga de los datos": recorra el texto visible de index.html, los textos de interfaz y las cadenas de texto de app.js, y falle si encuentra un número que no provenga de cubo.json, parcelas.geojson, explicaciones.json, params.json o manifest.json. Declare en un archivo aparte la lista de excepciones permitidas (por ejemplo, versiones de bibliotecas y años dentro de una cita) con su motivo. Si el tiempo lo permite, añada la comprobación sobre la página ya dibujada con los datos simulados: cada número visible debe rastrearse a un valor de los datos o a la función de la sección 2.4.
8) Contrato: validar_contrato.py sobre los archivos de web/data/.
9) Coherencia: P10 ≤ P50 ≤ P90; plazo_restante ≥ 0; estado_plazo y estados de la memoria dentro de sus listas; cada marca de dotación dentro del deslizador y con fuente y etiqueta.
10) Manifest: cada cifra que muestra la web tiene fuente, fecha y script.

Salida: docs/pruebas.md con la fecha, la lista de pruebas y su resultado. El flujo de GitHub Actions ejecuta todas y solo publica si pasan.

PRUEBA DE ACEPTACIÓN:
- escriba a propósito una cifra a mano en el HTML: la prueba 7 falla y la publicación se detiene; retire la cifra y confirme que vuelve a pasar;
- altere un flujo de La gota en un caso de prueba: la prueba 5 falla;
- reporte cuántas pruebas hay, cuántas pasan y cuánto tarda la batería completa.
```

---

## 5. DATOS Y CIENCIA (P2, P3 y P4, con G0)

### A1 — Clima NASA POWER y ETo FAO-56 (P4; sábado por la mañana)
```
Tarea A1. En datos/A1_power_eto.ipynb (Colab):
1) Descargue de la NASA POWER Daily API (endpoint https://power.larc.nasa.gov/api/temporal/daily/point, community=AG, format=JSON), para el punto 28.19 N, −105.45 W, del 1981-01-01 a la fecha más reciente disponible, los siguientes parámetros: T2M_MAX, T2M_MIN, RH2M, WS2M, ALLSKY_SFC_SW_DWN y PRECTOTCORR. Antes de utilizarlos, verifique en la documentación de POWER los nombres exactos y las unidades. Guarde el JSON crudo en data/raw/power/ y regístrelo en fuentes_A1.csv (archivo, url, fecha, sha256).
2) Calcule la ETo diaria con FAO-56 Penman-Monteith (Allen et al. 1998, ec. 6). Utilice la elevación del punto (obténgala de NASADEM en Earth Engine, ID NASA/NASADEM_HGT/001, o de un dato documentado) y verifique cuidadosamente las unidades de radiación (MJ m-2 d-1) y el viento a 2 m. Si falta una variable, documente el tratamiento aplicado. Puede utilizar pyfao56 o implementarlo, pero explique cada paso.
3) Valores faltantes de POWER (-999): márquelos como NaN y reporte cuántos hay.
4) Guarde data/processed/eto_diaria.csv (fecha, eto_mm, tmin, tmax, lluvia_mm, ws2m).

PRUEBA DE ACEPTACIÓN (imprímala):
- ETo diaria siempre entre 0 y 15 mm/d.
- Suma anual promedio de ETo: repórtela. [Rango de control estimado: 1,400–2,600 mm/año en el centro-sur de Chihuahua; si queda fuera, revise las unidades antes de continuar.]
- Gráfica de ETo mensual promedio (debe presentar su pico en mayo–junio).
- Lluvia anual promedio. [Rango de control: 250–500 mm; la zona recibe ~300–400 mm según el maestro; la estación Delicias registra 284 mm (1990–2004) según el documento técnico del acuífero 0831, Conagua 2024.]
Explique en 5 líneas qué es la ETo y por qué se utiliza.
```
**Plan B:** si el API falla, descargar el CSV desde el visor de POWER Data Access y cargarlo manualmente a `data/raw/power/`.

### A2 — Heladas por fecha (P4; sábado por la mañana)
```
Tarea A2. En datos/A2_heladas.ipynb, con data/processed/eto_diaria.csv (columna tmin):
1) Defina helada = Tmin ≤ 0 °C. Para cada año con datos completos, obtenga la fecha de la ÚLTIMA helada de primavera (enero–junio) y la PRIMERA de otoño (julio–diciembre).
2) Calcule los percentiles 10, 50 y 90 de cada una (en día del año y como fecha).
   - Nota: para la última de primavera, el percentil 90 corresponde a la helada tardía.
   - Para la primera de otoño, el percentil 10 corresponde a la helada temprana.
3) Si existe data/raw/smn/ con la estación de referencia 8044 Delicias, repita el cálculo con la estación y compare.
   - POWER es una celda regional, no una estación. Reporte la diferencia en días.
4) Calcule la probabilidad de helada después de cada fecha de siembra entre el 1-feb y el 15-abr (cada 7 días).
5) Guarde data/processed/heladas.json:
   - {"ultima_primavera": {p10, p50, p90}, "primera_otono": {...}, "prob_helada_despues_de": {"02-01": 0.xx, ...}, "fuente": "..."}

PRUEBA DE ACEPTACIÓN:
- La última helada p50 debe ubicarse en febrero–abril y la primera p50 en octubre–diciembre. [Control: INEGI 1983 reporta marzo y noviembre para Delicias.]
- Si no se ubica en esos rangos, revise el código antes de continuar.
Explique cómo se utilizará este resultado para el chile.
```

### A3 — HLS en Earth Engine: año agrícola 2026 (P2; sábado, hasta las 14:30)
```
Tarea A3. Se trabajará en Google Earth Engine (Python `ee` desde Colab, cuaderno datos/A3_hls_gee.ipynb).
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
5) Genere compuestos MENSUALES (mediana) y, por parcela, obtenga la mediana, p25 y p75 de cada banda e índice por mes. Exporte a CSV: data/processed/hls_mensual_parcelas.csv (id, mes, banda, mediana, p25, p75, n_validos).
6) Calcule por parcela los días aproximados de suelo desnudo entre el 1-feb y el 30-abr de 2026: días con NDVI < 0.2 a partir de las observaciones válidas, interpolando entre fechas. Documente el método. Guarde data/processed/suelo_desnudo.csv.
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
**Plan B:** si Earth Engine falla o no otorga permiso, utilizar `earthaccess` con HLS de LP DAAC, recortando únicamente el área. Es más lento: limitarse a las protagonistas y a una muestra.

### A3-M — La memoria de la parcela, 2016–2026 (P2; segunda línea; se lanza el sábado después de A3)
> Pieza nueva (S9 §4 y §5). Usa reglas, no etiquetas ni modelos. El año agrícola 2026 sale de A3; aquí se piden los años 2016 a 2025.
```
Tarea A3-M. En datos/A3M_memoria.ipynb (Earth Engine con Python `ee` desde Colab; después, pandas).

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

SALIDAS: memoria_mensual.csv, memoria_parcelas.csv, memoria_resumen.csv y memoria_validacion.csv, con las columnas del ESQUEMA DE SALIDA.

PRUEBA DE ACEPTACIÓN (imprímala):
- % de parcelas-año con estado distinto de sin_dato;
- tabla de acuerdo de 2026 y proporción de acuerdo;
- franja de memoria de las 3 protagonistas, año por año;
- tabla de sensibilidad 0.35 / 0.40 / 0.45;
- consumo de EECU real frente al estimado.
Explique en 5 líneas qué mide la memoria y qué no (es una regla sobre el verdor, no un padrón de cultivos).
```
**Plan B general:** si a las 20:30 del sábado no hay ningún año exportado, la memoria sale de la demostración; `memoria`, `edad_perenne_anios` y `dias_suelo_desnudo_mediana` quedan en null y la página dice «field memory: not run».

### A4 — Mapa de cultivos de 2026: etiquetas, dos enfoques, validación y abstención
> Reglas fenológicas + Random Forest son **obligatorios**. Presto pasa a **«solo si sobra tiempo»** (S9 §8).
>
> **Advertencia sobre Fields of The World:** su benchmark no incluye México y el riego árido de Norteamérica no está en su entrenamiento. Se usan sus predicciones globales de 2025 (CC-BY-4.0), con filtro de confianza por polígono y revisión manual de las 3 protagonistas (B1). En la página se declara: *"Field boundaries are NN predictions outside the model's training domain; filtered by confidence and manually reviewed for the showcased fields."*

**A4.1 Unión de etiquetas (P3; sábado por la mañana)**
```
Tarea A4.1. En datos/A4_etiquetas.ipynb. Las etiquetas se hicieron A CIEGAS antes del evento, en Copernicus Browser, por dos personas (manual 39). No se generan miniaturas en Earth Engine.
1) Lea de entradas/ las hojas de etiquetas de cada persona. Reporte cuántos puntos tiene cada una y cuántos comparten.
2) Compare a las dos personas: calcule el % de acuerdo global y por clase. Donde no coincidan, use la columna de desempate (tercera persona) si existe; si no, asigne "no_se" y descarte el punto.
3) Clases: alfalfa, nogal, maiz_forrajero, sorgo, chile, algodon, cereal_invierno, barbecho, no_se. Si las hojas traen la clase agrupada "forraje_verano" (maíz o sorgo forrajeros), consérvela como una sola clase y avise; no la reparta sin etiquetas que la separen.
4) Asigne a cada punto su bloque espacial (cuadrícula de 5 km) y su uso: entrenamiento o validación. La muestra de VALIDACIÓN es independiente, según el protocolo Olofsson del archivo 22, P4 (o 50 por clase si no está listo). Ningún bloque aporta puntos a los dos usos.
5) Guarde etiquetas_unidas.csv (id, punto_id, bloque, uso, clase_P2, clase_P3, clase_desempate, clase_final, acuerdo).

PRUEBA: tabla de puntos por clase y por uso; % de acuerdo; número de puntos descartados. Si alguna clase queda con muy pocos puntos de validación, avíselo antes de seguir.
```

**A4.2 Dos enfoques obligatorios (P2, con P3; sábado 15:00–20:30)**
```
Tarea A4.2. En datos/A4_mapa_cultivos.ipynb, con data/processed/hls_mensual_parcelas.csv y las etiquetas acordadas. Los enfoques A y B son OBLIGATORIOS; el C, SOLO SI SOBRA TIEMPO.
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
CURVA COBERTURA–EXACTITUD (diagnóstico; no cambia la regla): con las probabilidades fuera de pliegue de Random Forest, SOLO en la muestra de entrenamiento (nunca en la de validación Olofsson), reporte el % de parcelas retenidas y el F1 macro de las retenidas para umbrales de 0.4 a 0.8. El umbral de 0.6 queda fijo. Guarde una figura en docs/figuras/.

Si los cereales de invierno no se separan, agrúpelos en "cereal_invierno". Si las etiquetas traen "forraje_verano", úsela como una sola clase y regístrelo en la tabla de métodos.

SALIDA:
- cultivo_actual, prob_max, acuerdo_metodos y abstencion por parcela (sin modificar otros campos);
- la tabla comparativa en docs/figuras/tabla_metodos.csv.

PRUEBA:
- verificación de esquema (o validar_contrato.py → "CONTRATO OK");
- % de parcelas abstenidas (reportarlo; si es > 50%, notifíquelo);
- el área por cultivo del mapa frente a la estadística agrícola más reciente de Conagua para el DR-005 (de data/raw/conagua; referencia verificada: Estadística Agrícola 2016-2017, Cuadro 3.5, archivo 29): tabla de diferencias en %, indicando el año de la referencia y que la zona piloto no es el distrito.
Explique en 6 líneas qué enfoque obtuvo el mejor desempeño y por qué.
```

**A4.3 Exactitud Olofsson (P3; domingo, antes de las 11:00)**
```
Tarea A4.3. Con la muestra de VALIDACIÓN etiquetada a ciegas (independiente del entrenamiento), calcule según Olofsson et al. 2014:
- la matriz de error en proporción de área;
- la exactitud del usuario y del productor por clase y la exactitud global, cada una con IC 95%;
- el área ajustada por clase con IC 95%.
SIN kappa. Guarde docs/figuras/olofsson.csv y una figura.
Etiqueta: "accuracy vs. blind photo-interpretation (not field data)".
```

### A5 — Demanda de agua por opción, con banda (P4; sábado 12:00–18:00)
```
Tarea A5. En datos/A5_demanda.ipynb:
1) Para cada cultivo y para cada opción de rotación (definidas por B3 en rotaciones.json), calcule la ETc diaria = Kc × ETo con los Kc de FAO-56, Tabla 12 (archivo 27, sección 2.1) y las duraciones de etapa de FAO-56, Tabla 11 (archivo 27, sección 2.2). Las fechas de siembra provienen del maestro (sección 5.2) y de INIFAP 2017; las fechas de las etapas pueden ajustarse con el NDVI de A3.
   - Alfalfa: Kc mid 0.95 para el balance anual (efecto promediado de cortes) y 1.20 / 1.15 (mid / end) por periodo de corte. Use 0.95 en el balance anual y declare la versión utilizada.
   - Nogal pecanero (S8, decisión 5): Kc en función de la cobertura del dosel estimada con el NDVI de A3; el resultado se muestra como rango. Valores publicados de referencia: 0.3 en huerta joven a 1.1–1.39 en huerta madura [V según la investigación]. La relación entre cobertura y Kc se lee de supuestos.json con su fuente; si no está declarada, deténgase y notifíquelo. Variante de sensibilidad: FAO-56 "Stone fruit" sin cobertura y con helada, 0.45 / 0.90 / 0.65.
   - Ajuste por clima árido: Kc mid con la Ec. 62 de FAO-56, con u2 y RHmin de NASA POWER; p = p_tab + 0.04(5 − ETc), acotado a 0.1–0.8.
   - Si el mapa usa la clase agrupada "forraje_verano", calcule su demanda con el cultivo representativo declarado en supuestos.json y dígalo en la salida.
2) Lluvia efectiva: con la fórmula USDA-SCS y, como escenario conservador, la FAO "dependable rain" (fórmulas en el archivo 33, módulo de clima, paso 4). Utilice la conservadora por defecto.
3) Cadena:
   - lámina neta = ETc − lluvia efectiva;
   - lámina bruta EN PARCELA = neta ÷ eficiencia parcelaria;
   - más presiembra y fracción de lavado.
   La lámina bruta en parcela es la que usa la herramienta (millares por hectárea en la toma de la parcela). La eficiencia de conducción NO entra aquí: se usa en A6 y en La gota.
   EFICIENCIA PARCELARIA: no existe un valor medido para el DR-005. Trátela como PARÁMETRO DE ESCENARIO: lea su rango de supuestos.json, donde el equipo lo declara como "assumption" con su justificación. No escriba un valor "típico" de memoria; si el rango no está declarado, deténgase y notifíquelo.
4) MONTE CARLO con 2,000 corridas (10,000 si el tiempo lo permite):
   - clima: años históricos completos del periodo de referencia que fije el preregistro (cada corrida toma la ETo y la lluvia de un año);
   - ETo ± sesgo;
   - Kc en su rango;
   - eficiencia parcelaria: uniforme en el rango declarado (supuesto, rotulado como tal);
   - presiembra 15–20 cm.
   Los parámetros inciertos se sortean una vez por corrida y son comunes a todas las parcelas. Se obtiene la lámina bruta anual en parcela P10/P50/P90 por parcela y opción. Las secuencias de más de un año se anualizan (total ÷ años de la secuencia).
5) Variante de lluvia: repita con la lluvia diaria multiplicada por 0.8 (lluvia −20%). Se obtienen las 2 variantes del cubo (lluvia_pct = 0 y −20). NO se calculan escenarios de temperatura.
6) Guarde demanda_parcelas.csv (id, opcion, lluvia_pct, bruta_mm_p10, bruta_mm_p50, bruta_mm_p90, neta_mm_p50, etc_mm_p50) y etc_mensual.csv (id, opcion, mes, etc_mm_p50).

PRUEBA DE ACEPTACIÓN (imprímala):
- ETc anual de alfalfa (neta, sin eficiencias): repórtela. [Rango de control estimado: 1,100–1,700 mm.] Compárela con la lámina INIFAP de 170–180 cm (que es lámina aplicada) y reporte la eficiencia implícita = ETc neta / lámina INIFAP.
- ETc de algodón vs ~68 cm aplicados (INIFAP) y de chile vs ~92 cm: la misma comparación.
- Que P10 ≤ P50 ≤ P90 en todas las filas.
- Gráfico de tornado con el efecto de cada parámetro.
Explique qué parámetro tiene mayor influencia en la incertidumbre.
```
**Plan B:** si el Monte Carlo no está a tiempo, un rango simple (mínimo y máximo de la eficiencia parcelaria declarada), rotulado «simple range».

### A6 — Back-test H1 (P4; sábado 18:00 – domingo 8:00)
```
Tarea A6. Lea docs/preregistro_H1.md (publicado; NO modifique el criterio) y siga EXACTAMENTE su protocolo, en datos/A6_backtest.ipynb:
1) Utilice ÚNICAMENTE la información disponible al 14-mar-2026:
   - almacenamiento de La Boquilla de data/raw/sih;
   - el patrón de cultivos de ciclos previos de data/raw/conagua;
   - POWER hasta el 13-mar-2026;
   - el volumen autorizado que fije el preregistro (cifras de prensa, marcadas como tales).
2) VERDAD (preregistro, sección 4; S8, decisión 7): salida acumulada por obra de toma de La Boquilla del 14-mar al 14-jul-2026, integrada de la serie diaria oficial del SIH (archivo LBQCH.csv; lea las columnas por nombre, no por posición): volumen diario en hm³ = caudal (m³/s) × 86,400 ÷ 10⁶. Declare que no equivale a la entrega en parcela.
   Si la serie no puede leerse, o trae huecos o ceros en el periodo, repórtelo y use el respaldo del preregistro: 447.65 hm³ (prensa), rotulado "press-reported; equals the storage drop". Indique siempre qué fuente de verdad se usó.
3) Calcule la extracción proyectada del modelo y de las líneas base del preregistro (L1, L1-s y L2; L3 es opcional) en el punto principal (14-jul-2026). Como comprobación de consistencia, repita en el punto secundario (13-may-2026; 228.86 hm³ de prensa, que equivale a la caída de almacenamiento) con su advertencia; ese punto no decide H1.
4) Métricas:
   - error absoluto en hm³ por fecha;
   - skill = 1 − MAE_modelo/MAE_línea base;
   - intervalo Monte Carlo P10–P90, con el número de corridas del preregistro.
5) Una gráfica: línea del modelo con su banda P10–P90, L1-s, L1, L2 y los puntos observados, cada uno con su rótulo de fuente.
6) Redacte docs/resultado_H1.md con el resultado TAL COMO SE OBTENGA, comparado con el criterio preregistrado: |error del modelo| < |error de L1-s| y < |error de L1| en el punto principal.

PRUEBA: la gráfica es clara y el texto indica explícitamente "meets / does not meet the preregistered criterion" y la fuente de verdad utilizada.
```

### A7 — Experimento natural de 2025, H3 (P3; segunda línea; sábado por la noche)
> Pieza nueva (S9 §6, prueba 3, y Anexo B). Requiere la memoria de 2019 a 2025 (A3-M) y el mapa de 2026 (A4.2).
```
Tarea A7. Lea el texto registrado de H3 (preregistro publicado; Anexo B de S9, que le pego). NO modifique el criterio ni los umbrales. Trabaje en datos/A7_h3.ipynb con memoria_mensual.csv, memoria_parcelas.csv y cultivos_parcelas.csv.

1) Población: parcelas estimadas de la zona piloto.
2) GRUPOS, definidos ANTES de calcular nada de 2025 y sin usar datos de 2025. Definición operativa de este kit; debe coincidir con el preregistro publicado y, si difiere, prevalece el preregistro y se avisa:
   (a) Parcelas anuales: las que NO están en estado perenne en 2024 según la memoria y NO pertenecen al grupo (b). No se filtra por su historial de siembra.
   (b) Huertas de nogal: parcelas con clase nogal en el mapa de cultivos de 2026, no abstenidas.
   Alfalfa (estado perenne en 2024): solo descriptiva.
3) Indicador por año agrícola, de 2019 a 2025: proporción de parcelas del grupo con cultivo de verano activo = máximo del NDVI mensual de jun–sep ≥ 0.40. Las parcelas sin dato en la ventana de verano se excluyen de ese año y se cuentan aparte.
4) Mediana 2019–2024 de cada grupo.
5) CRITERIO (texto del Anexo B):
   (a) la proporción de 2025 del grupo de parcelas anuales queda al menos 25 puntos porcentuales por debajo de su mediana 2019–2024; y
   (b) la proporción de 2025 de las huertas de nogal queda a no más de 10 puntos porcentuales de su mediana 2019–2024.
   H3 se sostiene solo si se cumplen (a) y (b).
6) Sensibilidad: repita con los umbrales 0.35 y 0.45 y repórtelo junto al resultado principal, sin sustituirlo.
7) Controles descriptivos, que no deciden H3:
   - alfalfa: proporción con cultivo de verano activo y meses verdes en 2025 frente a 2019–2024;
   - sesgo de supervivencia: cuántas parcelas con señal de verano y sin cultivo de invierno en todos los años de 2019 a 2024 NO aparecen como nogal en 2026;
   - número de parcelas de cada grupo y de parcelas sin dato por año. Si un grupo es pequeño, dígalo como limitación.
8) Divulgación de resultado conocido: la prensa reportó de 12,000 a 15,000 ha sembradas con pozos en 2025; ninguna serie de satélite se calculó antes del registro.

SALIDAS: h3_series.csv (anio_agricola, grupo, umbral_ndvi, n_parcelas, proporcion_con_cultivo_verano), una figura con las dos series de 2019 a 2026 y docs/resultado_H3.md con el resultado TAL COMO SE OBTENGA.

PRUEBA: el texto dice explícitamente "H3 supported / not supported", muestra (a) y (b) por separado, el número de parcelas de cada grupo y la sensibilidad. Un resultado desfavorable se publica con la misma visibilidad.
```
**Plan B:** si la memoria no cubre 2019–2025, H3 se reporta como «not run» en la página, con la razón.

### A8 — Contraste regional de ET (P4; domingo, antes de las 11:00; solo si A5 está entregada)
> Prueba 5 de S9 §6, según S8, decisión 4. **Nunca por parcela;** rótulo «regional».
```
Tarea A8. En datos/A8_et_contraste.ipynb:
1) ET modelada: con etc_mensual.csv (A5), ETc mensual P50 de la opción ACTUAL de cada parcela clasificada, agregada a la zona piloto como promedio ponderado por superficie (mm por mes), de oct-2025 a sep-2026.
2) SSEBop VIIRS v6 mensual (USGS; 1 km; Earth Engine: projects/usgs-ssebop/viirs_et_v6_monthly): promedio sobre el rectángulo de la zona piloto, mismos meses. Verifique en el catálogo la banda, las unidades y el factor de escala antes de usarlo. Haga primero una corrida piloto y anote el consumo de EECU.
3) WaPOR v3 nivel 1 (FAO; 300 m; CC-BY-4.0): verifique cómo se accede (catálogo de Earth Engine o portal de la FAO). Si no hay acceso sin una descarga pesada, use solo SSEBop y declárelo.
4) Tabla y figura con las series mensuales; diferencia en mm y en %. Declare que la ET de satélite incluye parcelas sin clasificar, caminos y vegetación no agrícola del rectángulo, y que la modelada es ETc potencial del cultivo, no ET medida.
5) Guarde et_contraste.csv (mes, et_modelo_mm, et_ssebop_mm, et_wapor_mm) y la figura.

PRUEBA: 12 meses con unidades comprobadas (mm por mes); el texto lleva el rótulo "regional comparison; not field-level validation" y no usa "validated" para parcelas. Si la tarea no se ejecuta, la página dice "regional ET contrast: not run".
```

---

### A9 — Relieve y simulación de tormenta (P4; NÚCLEO para pasos 1–4, sábado 15:00–20:30; pasos 5–6 en segunda línea)
> Complemento de S9 §4 bis. **Nunca por parcela con 30 m salvo los indicadores de contexto;** rótulo «regional, 30 m».
```
Tarea A9. En datos/A9_relieve.ipynb:
1) Elevación: NASADEM (Earth Engine: NASA/NASADEM_HGT/001, banda elevation) recortada al rectángulo de la zona piloto más un margen de 2 km. Exporte UNA vez a GeoTIFF con Export.image.toDrive a 30 m. Corrida piloto y consumo de EECU anotados.
2) En Colab (no en Earth Engine), con una biblioteca de hidrología de terreno (pysheds, richdem o whitebox; diga cuál y por qué): rellene depresiones, calcule dirección de flujo D8, acumulación de flujo, pendiente en % y profundidad de depresión (diferencia entre el modelo relleno y el original).
3) Rutas de escurrimiento: celdas con acumulación ≥ un umbral declarado en supuestos.json; conviértalas en líneas y guárdelas en relieve_rutas.geojson (< 1 MB, geometrías simplificadas).
4) Tormenta de referencia: percentil 95 de la lluvia diaria de los días con lluvia en la zona, de GPM IMERG (NASA/GPM_L3/IMERG_V07, agregado diario) o, si no alcanza la cuota, de eto_diaria.csv (POWER). Guarde el valor en mm con su fuente y periodo.
5) Por parcela (contexto, no medición): pendiente media (%), acumulación máxima que entra a la parcela desde fuera (área de aportación en ha) y fracción del área en depresión > 0.1 m. Guarde relieve_parcelas.csv (id, pendiente_media_pct, aportacion_externa_ha, frac_depresion).
6) Si existe en entradas/ un modelo LiDAR del INEGI que cubra la zona (descargado antes del evento en el navegador), repita 2 y 5 con ese modelo y añada la columna fuente_dem. Si no existe, no lo busque durante el evento.

PRUEBA: el mapa de acumulación sigue los drenes y canales visibles en la imagen; pendientes entre 0 y 5 % en la zona agrícola (si no, revise unidades y proyección); el texto lleva "regional, 30 m (NASADEM); not field drainage design". Si no se ejecuta, la capa no aparece y la página dice "terrain layer: not run".
```
Para la web (Cristian, C1 y C2): capa «Terrain & runoff» con la pendiente y las rutas; botón «Simulate a storm» que anima partículas a lo largo de relieve_rutas.geojson durante unos 3 s, con la lámina de la tormenta y su fuente, respetando prefers-reduced-motion; en la ficha, una línea en el renglón Suelo con los tres indicadores y el rótulo de escala.

---

## 6. MOTOR (P2 y P5 con G0; Cristian con Claude Code)

### B1 — Parcelas (Fields of The World 2025) y las 3 protagonistas (P2; sábado por la mañana)
```
Tarea B1. En motor/B1_parcelas.ipynb:
1) Zona piloto: rectángulo definido por coordenadas (zona_piloto.bbox de data/params.json; lo propone usted con el visor y lo confirma Cristian antes de ejecutar). El límite de los módulos de riego no es público: en todos los textos se dice "zona piloto", nunca "módulo". Para el polígono del DR-005, utilice el que exista en data/raw/ o la capa REST de distritos de riego de Conagua SIGAGIS, y documente la fuente.
2) Descargue ÚNICAMENTE el recorte de las predicciones globales de Fields of The World 2025 (Source Cooperative, source.coop/ftw/global-data, CC-BY-4.0; GeoParquet/PMTiles) que corresponde al rectángulo. NO descargue el producto global. Si es GeoParquet, filtre por bounding box.
   ADVERTENCIA: el benchmark de FTW no incluye México, y el riego árido y Norteamérica no están en su entrenamiento. Las predicciones sobre Delicias están fuera del dominio de entrenamiento: aplique el filtro de confianza y revise a mano los polígonos de las protagonistas (paso 4).
3) Recorte, calcule area_ha y filtre los campos < 1 ha. Copie la confianza por polígono (escala 0–100) a ftw_confianza; documente también la capa de confianza de 500 m (umbral ≥ 0.4 según FTW).
4) Para la demostración: 30–60 parcelas de un solo sector (la zona piloto) y 3 protagonistas (protagonista=true). Si el peso del archivo y la cuota de Earth Engine lo permiten tras el piloto de consumo, conserve todas las parcelas del rectángulo con confianza suficiente: el indicador de zona y H3 son más sólidos con más parcelas. Protagonistas, de preferencia, una por cada estado del plazo:
   - una alfalfa vieja (por vencer);
   - una de chile con suelo desnudo en invierno (libre);
   - una huerta de nogal (comprometida), en lugar de la parcela de forraje o maíz del kit 23.
   Se eligen con el apoyo visual de A3; si aún no está disponible, posponga la selección y notifíquelo.
   REVISIÓN MANUAL OBLIGATORIA de las 3 protagonistas: compare cada polígono con una imagen en color verdadero (HLS o Sentinel-2) y corrija el contorno si no coincide con la parcela; registre la corrección en docs/.
5) Entregue parcelas_base.geojson y parcelas_muestra.geojson (polígonos FTW que contienen los puntos etiquetados, con punto_id y bloque) conforme al contrato (sección 2.2); los campos que no le corresponden se dejan en null.

PRUEBA:
- verificación de esquema (o validar_contrato.py → "CONTRATO OK");
- un mapa estático (PNG) con las parcelas coloreadas por confianza FTW;
- % de parcelas con confianza < 50. Si es > 40%, notifíquelo: será necesario editar manualmente los polígonos de las protagonistas.
```

### B2 — Dotaciones en millares por hectárea (P5; sábado por la mañana)
> Reescrito. Sustituye a los escenarios por terciles (S8, decisión 1; S9 §3 y §5).
```
Tarea B2. En motor/B2_dotaciones.ipynb. No calcule terciles ni volúmenes por hectárea a partir del volumen de la presa: la dotación se expresa en millares por hectárea y la elige el usuario con el deslizador.
1) Escriba dotaciones.json con el bloque "dotaciones" del contrato (sección 2.3):
   - unidad y equivalencia: 1 millar/ha = 1,000 m³/ha = 10 cm de lámina;
   - deslizador de 0 a 12 millares/ha, con el paso que acuerde con Cristian;
   - tres marcas, cada una con rango, valor (punto medio del rango), nota, fuente, fecha de consulta y etiqueta:
     · "Como 2025": sin agua de las presas; ≈1 millar/ha de pozos. Referencia: Módulo 4, 1 millar/ha a 4,976 ha desde 11 pozos (El Diario de Chihuahua, 28-oct-2024, según la investigación) [P];
     · "Como 2026": 3–4 millares/ha (El Diario de Chihuahua, 27-jul-2026; nota no leída directamente) [P, por confirmar];
     · "Año normal": 9–10 millares/ha (misma nota) [P, por confirmar].
   No escriba ninguna otra dotación de memoria. Si antes del sábado se abrió la nota en el navegador, anote la fecha de lectura y cambie "por confirmar".
2) Punto de medición: registre el supuesto [S] "el millar se mide en la toma de la parcela". Si en la mentoría del sábado un técnico confirma o corrige el punto de medición o las cifras, actualice dotaciones.json, cambie la etiqueta y anote el cargo de quien lo dijo (sin nombre) y la hora.
3) Bloque "distrito" para el panel lateral:
   - boquilla.namo_hm3 = 2,846.780 hm³ (tabla de Conagua reproducida en prensa);
   - boquilla.almacenamiento_hm3 con la fecha y la fuente del último dato disponible en data/raw. Referencia de S8: 825.577 hm³ al 9-nov-2026 (prensa con el reporte diario de Conagua) [P]. Null si no existe dato con fuente;
   - acuifero_0831.disponibilidad_hm3_anio = −167.12 hm³/año (Conagua 2024, documento técnico DR_0831).
4) Comprobación de escala (S9 §5, con láminas del INIFAP): 10 ha con 3.5 millares/ha reciben 35 millares, que alcanzan para 2.0 ha de alfalfa (17.5 millares/ha), 5.1 ha de algodón (6.8) o 6.4 ha de maíz forrajero (5.5). Reprodúzcala e imprímala.
5) SOLO SI SOBRA TIEMPO (S9 §8): historial de superficie regada del DR-005 con la serie de Conagua de data/raw (superficie regada y volumen distribuido por año agrícola), como gráfica de contexto. Declare qué fuentes suma el volumen distribuido (La Boquilla, Francisco I. Madero, pozos) y no use la caída de almacenamiento como si fuera extracción. Entregue historial_superficie.csv.

PRUEBA:
- tabla de las 3 marcas con rango, valor, fuente, fecha y etiqueta;
- la comprobación de escala reproduce 2.0, 5.1 y 6.4 ha;
- verificación de esquema de dotaciones.json contra el contrato.
Explique en 4 líneas qué es un millar y por qué la dotación se muestra como un rango y no como un dato oficial.
```

### B3 — Rotaciones, filtros duros y plazos (P5; sábado, hasta las 14:30)
```
Tarea B3. Cree rotaciones.json, filtros.py (con pruebas) y supuestos.json:
1) Las opciones de la sección 5.2 del maestro (ACTUAL, A, B, C, D, E y "nogal no rota"), más la opción "no sembrar / rastrojo en pie". Cada una con:
   - secuencia de cultivos por ciclo (OI/PV) en 12–24 meses;
   - fechas de siembra;
   - fuente.
2) Los filtros duros de la sección 5.2 como funciones que devuelven (pasa: bool, motivo: str).
   OBLIGATORIOS, cada uno con su fuente:
   - fechas de siembra y riesgo de helada con heladas.json (siembra: INIFAP 2017 y SDR Chihuahua 2026);
   - "no sembrar chile después de chile" (INIFAP 2017); si hay antecedente de Phytophthora capsici, al menos 5 años con cultivo no hospedante (Silva-Rojas et al. 2009, [verificado-extracto]);
   - soca del algodón: desvare ≤ 10 días tras la cosecha y desarraigo antes del 30-nov (NOM-026, INIFAP 2017);
   - establecimiento de alfalfa: ya no se filtra por "escenario seco". La opción lleva la bandera "advertir_si_rojo" y la web muestra la advertencia cuando su semáforo de agua queda en rojo con la dotación elegida; el texto recuerda que la alfalfa obliga 3–4 años.
   COMPLEMENTARIOS (parametrizables; se marcan como supuesto si la fuente es secundaria):
   - intervalo entre alfalfas: parámetro con la regla del maestro (≥ 12 meses); la referencia disponible indica un mínimo de 6–7 meses por autotoxicidad (Fundación Produce Chihuahua, [fuente secundaria]);
   - la opción B (alfalfa establecida con corte de riego en verano) solo si la alfalfa se sembró en un ciclo anterior; variante moderada (omitir 2–3 riegos entre julio y septiembre) por omisión; suspensión desde agosto solo en texturas medias; con arcilla ≥ 40% [supuesto] o suelo arenoso, solo la variante moderada y la bandera "riesgo alto de pérdida de plantas"; con salinidad roja, la opción B no se ofrece; con salinidad ámbar, descontar un lavado de 0–25% del agua no aplicada;
   - la opción D bloqueada si el cultivo previo pudo llevar atrazina (maíz o sorgo) y no se ha revisado la etiqueta. Plazos de etiqueta (archivo 29, sección 5): solo maíz hasta los 7 meses; trigo ≥ 5 meses; cultivos sensibles ≥ 10 meses; no sembrar alfalfa;
   - salinidad con los umbrales de FAO-29, Tabla 4 (archivo 29, sección 4): atención, ECe ≠ ECw. Como no hay salinidad por parcela, utilice una zona de riesgo regional (GSASmap/INEGI) y márquela como "regional".
3) Indicadores de suelo por opción: días de suelo desnudo (estimados con el calendario de la opción; el valor medido de la opción ACTUAL lo aporta la memoria), leguminosa sí/no, ruptura de plagas sí/no, raíz profunda sí/no.
4) PLAZOS, en supuestos.json, cada uno con fuente y etiqueta (S9 §5):
   - cultivo anual: 1 año;
   - alfalfa: 3–4 años [P, FIRA];
   - nogal: horizonte de cálculo de 10 años [S]; la vida de la huerta se cita con fuente INIFAP antes de publicarla;
   - alfalfa "por vencer": 3 años o más de edad observada [S].
   Agregue también el rango de eficiencia parcelaria, la eficiencia de goteo, la relación cobertura–Kc del nogal y, si las etiquetas usan la clase agrupada "forraje_verano", qué cultivo la representa en el cálculo de la demanda; cada uno con fuente o con la marca "assumption". No escriba valores de memoria: si no hay fuente, déjelo en null y avise.

PRUEBA: pruebas unitarias simples (pytest o asserts) con 8 casos:
- chile tras chile = no pasa;
- alfalfa nueva lleva la bandera "advertir_si_rojo";
- y casos análogos para los demás filtros.
Imprima una tabla opción × filtro para una parcela de ejemplo y la tabla de plazos con fuente y etiqueta.
```

### B4 — Lámina, plazo, compromiso y zona: cubo v4 (Cristian, T2; sábado 15:00–20:30)
> Reescrito. Ya no hay factibilidad si/justo/no ni llaves de escenario: la web calcula la cobertura, las hectáreas y el semáforo con el deslizador (sección 2.4).
```
Tarea B4. En motor/ (script del motor, conectado al comando único; encabezado AI-assisted (Claude Code)):
1) Para cada parcela NO abstenida:
   - tome la opción ACTUAL (según cultivo_actual y, si existe, la memoria) y las alternativas que aprueben los filtros de B3: mínimo ACTUAL + 2; en alfalfa establecida se añade "corte de riego en verano";
   - ACTUAL nunca se elimina: si incumple un filtro, se muestra con la advertencia.
2) LÁMINA BRUTA anual en parcela por opción y variante de lluvia (0 y −20), en millares por hectárea: p10, p50 y p90, a partir de demanda_parcelas.csv (100 mm = 1 millar/ha). Secuencias de más de un año: anualizadas.
3) PLAZO por opción (plazo_anios.min y .max), leído de data/params.json: cultivo anual, 1 año; alfalfa, 3–4 años [P]; nogal, horizonte de cálculo de 10 años [S]. La opción toma el plazo del cultivo de mayor plazo de su secuencia.
4) PLAZO RESTANTE = plazo − edad observada, con mínimo cero. Solo la opción ACTUAL de una alfalfa ya establecida descuenta la edad (edad_perenne_anios de la memoria); las alternativas nuevas llevan el plazo completo. Sin memoria: edad null, plazo completo y nota "age not available".
   NOGAL: el horizonte de cálculo no es la vida de la huerta, así que NO se descuenta la edad: el plazo restante es siempre el horizonte completo, con la nota "calculation horizon; orchards live longer".
5) COMPROMISO (compromiso_millares_ha.min y .max) = lámina P50 × plazo restante, para lluvia 0 y −20.
6) ESTADO DEL PLAZO por parcela (estado_plazo en parcelas.geojson):
   - libre: cultivo anual, barbecho o descanso;
   - por_vencer: alfalfa con 3 años o más de edad observada [S];
   - comprometida: alfalfa más joven o nogal;
   - null: parcela abstenida.
   Sin memoria, toda alfalfa queda como comprometida, con la nota "age not available".
7) BLOQUE ZONA: superficie_total_ha, superficie_clasificada_ha, superficie_abstenida_ha, superficie_perenne_ha; demanda_perenne_millares (suma de area_ha × lámina bruta de la opción ACTUAL de las parcelas de alfalfa y nogal no abstenidas; p10, p50 y p90; lluvia 0 y −20); y conteos por estado. Supuesto declarado: los parámetros inciertos son comunes a todas las parcelas, de modo que las bandas se suman.
8) SEMÁFOROS que sí se guardan: suelo, según los indicadores; dinero, si hay margen con fuente se compara contra la opción actual y, si no, "gris" con la nota "no verified data". El semáforo de agua NO se guarda.
9) Escriba web/data/cubo.json conforme al contrato v4 (sección 2.3), con los bloques dotaciones y distrito de B2.
10) Fuera del alcance (S9 §8): optimizador, margen de bombeo y huella de carbono. No se calculan.

PRUEBA:
- validar_contrato.py → "CONTRATO OK"; tamaño de cubo.json < 5 MB;
- pruebas automáticas del ejemplo de escala y de las reglas de la sección 2.4;
- tabla resumen para el valor de cada una de las 3 marcas, con lluvia 0 y −20: cuántas parcelas quedan en verde, ámbar y rojo con su rotación actual y con su mejor alternativa, y el agua ya comprometida de la zona (estos valores sirven para revisar la web, no se escriben en ella);
- ningún plazo_restante negativo; ningún estado fuera de su lista.
Explique el resultado de las 3 protagonistas en lenguaje accesible para un agricultor: cuánta agua pide al año su rotación, por cuántos años obliga y para cuántas hectáreas alcanza con cada marca.
```

### X3.1 — La gota: cálculo (Cristian, T2; sábado 18:00–20:30, después de A5)
> La gota **no se elimina del alcance**. Sigue viviendo dentro de la ficha (C2). Mismas fracciones de retorno documentadas por Conagua 2024 y misma regla del tope de consumo que en el kit 23.
>
> **Dato de respaldo (Conagua 2024, acuífero 0831) [V]:** el 85.5 % de la recarga del acuífero es inducida (180.5 de 211.2 hm³/año; 83.3 % por retornos de riego y 2.2 % por fugas urbanas) y el 68 % de esa recarga inducida (122.8 de 180.5) proviene del agua superficial aplicada.
```
Tarea X3.1. En motor/ (conectado al comando único), para cada parcela y opción del cubo, y para la variante de lluvia 0, calcule los flujos de agua en m³ (utilice el P50 de A5):

- m3_llegan_parcela = lámina bruta × área.
- m3_salen_presa = m3_llegan_parcela ÷ eficiencia de conducción (media IMTA 0.60; rango medido 0.470–0.681 en 2012–2016, COMEII 2021).
- m3_perdidas_canal = m3_salen_presa − m3_llegan_parcela.
- m3_consume_cultivo_et = ETc neta de riego × área (lo que la planta evapotranspira del agua aplicada).
- m3_regresan_acuifero: utilice las FRACCIONES DE RETORNO DOCUMENTADAS por Conagua (2024), "Actualización de la disponibilidad media anual de agua en el acuífero Meoqui-Delicias (0831)", https://sigagis.conagua.gob.mx/gas1/Edos_Acuiferos_18/chihuahua/DR_0831.pdf [verificado]. NO las derive ni las invente:
  - riego con agua SUPERFICIAL (presa): recarga inducida = 0.2 × volumen superficial agrícola (122.8 de 614 hm³/año). Para la parcela: m3_regresan_acuifero = 0.2 × m3_salen_presa. Antes de aplicarlo, confirme en el documento técnico a qué volumen se refiere el 614 (bruto en presa o entregado) y aplique el 0.2 a la magnitud equivalente; documéntelo en "supuestos";
  - riego con agua SUBTERRÁNEA (pozo; solo si la parcela tiene pozo documentado): recarga inducida = 18% del volumen bombeado (53.1 de 294.9 hm³/año);
  - referencia del distrito: recarga inducida total 180.5 de 211.2 hm³/año (85.5%), que incluye 4.6 hm³/año de fugas urbanas.
- m3_otras_perdidas = m3_salen_presa − m3_consume_cultivo_et − m3_regresan_acuifero (evaporación, escurrimiento), para que el balance cierre. Si resulta negativo, deténgase y notifíquelo.
- Reparto del retorno entre canal y parcela: si el documento técnico no lo separa, repártalo en proporción a las pérdidas de cada tramo y declárelo como supuesto.

Escenario "goteo": eficiencia parcelaria de goteo tomada de supuestos.json (valor con fuente; si no existe, un rango marcado como "estimate"). Se mantiene el coeficiente de retorno 0.2 aplicado al nuevo volumen superficial y se declara el supuesto: la reducción real de la recarga puede ser mayor, porque el goteo también reduce la fracción que percola.
  - gota_goteo_con_tope: MISMA ETc y misma superficie; baja m3_salen_presa y baja m3_regresan_acuifero.
  - gota_goteo_sin_tope: el volumen que deja de salir de la presa se reasigna a riego adicional por goteo con el mismo cultivo (supuesto declarado). m3_salen_presa = el de la opción actual; el consumo por ET sube en proporción a la superficie adicional. El retorno se calcula con el mismo coeficiente 0.2 como cota superior y se limita a (m3_salen_presa − m3_consume_cultivo_et) si este valor es menor; m3_otras_perdidas cierra el balance.

REGLA DEL TOPE DE CONSUMO:
- et_historica_m3 = consumo por ET con el método de riego actual (gota.m3_consume_cultivo_et), como base histórica de la parcela; documente en base_historica cómo se obtuvo.
- et_goteo_sin_tope_m3 = consumo por ET de gota_goteo_sin_tope.
- cumple_sin_tope = (et_goteo_sin_tope_m3 ≤ et_historica_m3).
- El goteo solo se recomienda en la ficha si se aplica con tope (consumo ≤ histórico). La versión sin tope se muestra como advertencia, no como recomendación.

Guarde en cubo.json los bloques "gota", "gota_goteo_con_tope", "gota_goteo_sin_tope" y "tope_consumo" por opción.

PRUEBA (imprímala y déjela también como prueba automática):
- en cada caso, la suma de destinos (ET + acuífero + otras) = m3_salen_presa (±1%);
- con goteo con tope, m3_salen_presa disminuye Y m3_regresan_acuifero disminuye;
- sin tope, m3_salen_presa es igual al de la opción actual, m3_consume_cultivo_et es mayor que el histórico y cumple_sin_tope = false;
- ningún flujo es negativo;
- muestre lado a lado, para las 3 protagonistas, actual / goteo con tope / goteo sin tope: agua en presa, ET y retorno al acuífero.
```

---

## 7. WEB Y NARRATIVA (Cristian con Claude Code; P6 en textos, página y video)

### C1 — Pantalla 1: Centro de control (Cristian, T1; sábado, hasta las 12:00, con datos simulados)
> Reescrito (S9 §3). El deslizador sustituye al selector de año.
```
Tarea C1. En web/, cree una página estática SIN frameworks (index.html, style.css, app.js) que:
1) Cargue MapLibre GL JS desde un CDN con la versión fija documentada y un mapa base libre (OpenStreetMap o un estilo gratuito sin llave), centrado en la extensión de parcelas.geojson. El centro se calcula de los datos; no se escriben coordenadas en el código.
2) Lea web/data/parcelas.geojson y web/data/cubo.json (por ahora, los simulados del contrato).
3) Barra superior:
   - DESLIZADOR DE DOTACIÓN "Water allocation (thousand m³ per hectare · millares/ha)", con mínimo, máximo y paso leídos de dotaciones.deslizador, y tres marcas leídas de dotaciones.marcas ("Like 2025", "Like 2026", "Normal year"). Al tocar una marca, el deslizador salta a su valor y muestra su rango, fuente y etiqueta;
   - junto al valor, su equivalencia en lámina (dotaciones.equivalencia) y la nota del punto de medición (dotaciones.punto_medicion);
   - interruptor "Rain −20%" (apagado = 0, encendido = −20).
   NO hay selector de año ni control de temperatura.
4) Con cada movimiento, y SIN pedir datos nuevos, la web recalcula para cada parcela la cobertura, las hectáreas que alcanzan y el semáforo de agua de su opción ACTUAL, con las reglas de la sección 2.4 del kit. Esas reglas viven en UNA sola función, que también usan las pruebas automáticas.
5) INDICADOR PRINCIPAL, sobre el mapa: "Water already committed by perennial crops: [Z]% of the allocation", con su rango. Reglas de la sección 2.4:
   - si la dotación es cero: "No dam allocation: perennial crops depend on wells or go unmet";
   - si pasa de 100%: "Perennial crops alone ask for more than the allocation; the gap comes from wells or stays unmet", con enlace a "Follow the drop";
   - si hay superficie abstenida: anteponga "at least" y muestre el porcentaje de superficie sin clasificar.
6) Segunda cifra: "With [D] thousand m³/ha, [X] of [Y] fields don't have enough water for their current rotation" (X = parcelas en rojo; Y = parcelas clasificadas).
7) COLOREADO del mapa, con un conmutador de dos posiciones:
   - "Enough water?" (por omisión): verde, ámbar y rojo; gris = sin clasificar;
   - "Water term": libre, por vencer y comprometida; gris = sin dato (estado_plazo).
8) CAPAS (una activa a la vez, en lugar del coloreado): "Crops" (cultivo_actual, con "Not classified" en gris), "Bare soil in the windy season" (dias_suelo_desnudo_mediana; si es null, dias_suelo_desnudo_feb_abr) y "Field memory: 2025" (estado de 2025 de la memoria). Cada capa con leyenda, unidades y fuente. Una capa solo se muestra si está en distrito.capas_disponibles.
9) PANEL LATERAL, con valores leídos de los bloques "distrito" y "zona" (nunca escritos en el HTML):
   - La Boquilla: almacenamiento con fecha (o "no data") frente a la capacidad al NAMO;
   - acuífero 0831: disponibilidad, con la fuente visible;
   - conteo de parcelas en verde, ámbar, rojo y gris para la dotación activa, y de parcelas libres, por vencer y comprometidas.
10) Colores de la identidad: Agua #1F6FB2, Brote #4C9A2A, Tierra #8A5A3B, Ámbar #D98E04, Arena #F5EFE6; tipografía Atkinson Hyperlegible.
11) Debe funcionar en teléfono celular (en pantallas angostas, el panel lateral pasa debajo del mapa). Accesibilidad: contraste suficiente, deslizador operable con teclado y nada que dependa únicamente del color (agregue ícono o texto).

PRUEBA:
- abra la página con un servidor local simple y después en la liga pública;
- al mover el deslizador y el interruptor de lluvia cambian los colores, los conteos y el indicador principal;
- las tres marcas llevan el deslizador a su valor y muestran su fuente;
- con dotación cero y con el indicador por encima de 100% aparecen los mensajes previstos;
- una capa ausente de capas_disponibles no se muestra;
- sin errores en la consola y sin cifras escritas en el HTML;
- proporcione la liga.
```

### C2 — Pantalla 2: Ficha de parcela, con memoria, plazo y La gota (Cristian, T1; sábado 12:00–14:30 con datos simulados)
> Reescrito (S9 §3). A las 14:30 basta un espacio reservado con datos simulados para La gota (X3.2).
```
Tarea C2. Al hacer clic en una parcela, abra un panel lateral (o una hoja inferior en teléfono celular) con:
1) ENCABEZADO: ID, área, cultivo actual con su confianza ("Alfalfa — 81% confidence") o "Not classified — check with technician" si está abstenida; estado del plazo ("free", "ending soon" o "committed") y, si existe, la edad observada ("stand age from satellite memory"; con "≥" si es un mínimo o "age not available" si no hay memoria).
2) MEMORIA DE LA PARCELA "Field memory (NASA HLS)": una franja con una celda por año agrícola desde 2016 (o desde el primer año disponible), cada una con su estado: perenne, cultivo de verano, de invierno, doble, descanso o sin dato. Cada estado lleva color y letra o trama, con leyenda. Debajo, la nota fija: "Rule-based reading of monthly greenness; not a crop census." Si memoria es null: "Field memory: not run".
3) TARJETAS lado a lado: "Current rotation" + 2 alternativas (3 en alfalfa establecida). Cada tarjeta con 3 renglones (Water · Soil · Money), semáforo, ícono y sus cifras:
   - WATER: lámina bruta en millares por hectárea al año, con el rango P10–P90 en una barra pequeña; plazo en años ("commits water for N years"; rango si lo hay) y plazo restante en la opción actual; y "enough for X of N hectares" con su rango, calculado con el deslizador (sección 2.4). El semáforo de agua lo calcula la web;
   - SOIL: días de suelo desnudo (con la marca "measured" o "estimated" según dias_desnudo_origen), leguminosa y ruptura de plagas;
   - MONEY: margen o "no verified data".
4) Una línea de 12 meses (verde = cultivo, café = suelo desnudo) por opción.
5) Botón "Why?" que despliega las 5 preguntas del reto: why it's suggested · evidence (con fuente) · benefits · what we don't know · risks needing local review. Textos de explicaciones.json; los marcadores dinámicos toman su valor del deslizador.
6) Debajo de las tarjetas, la sección "Follow the drop" (La gota, X3.2) con el botón "What if this field switches to drip?"; por ahora, con el bloque "gota" simulado. Si la cobertura de la opción es menor de 1, una línea lo dice: "The allocation covers part of this need; the rest comes from wells or stays unmet."
7) Las advertencias de filtros: por ejemplo, "advertir_si_rojo" en alfalfa nueva cuando su semáforo de agua queda en rojo.
8) El aviso fijo: "This tool supports, never replaces, the judgment of farmers and local experts."
9) Glosario con tooltips: ET, NDVI ("greenness"), bare soil, frost risk, water balance, consumption cap, millar, water term.

PRUEBA:
- con los datos simulados, la ficha se abre en las 3 parcelas protagonistas;
- al mover el deslizador cambian las hectáreas que alcanzan y el semáforo de agua de cada tarjeta;
- la franja de memoria muestra los seis estados posibles y se entiende sin depender del color;
- en teléfono celular se lee sin necesidad de zoom;
- no hay cifras escritas en el HTML: todas provienen de los datos.
```

### X3.2 — La gota dentro de la ficha (Cristian, T1; sábado 20:30 – 1:00)
```
Tarea X3.2. DENTRO de la ficha de la parcela (C2), debajo de las tarjetas de opciones, agregue la sección "Follow the drop". No es una pantalla ni una pestaña aparte:

1) Un diagrama Sankey (utilice d3-sankey desde un CDN con versión fija, o SVG propio si resulta más simple) con los nodos: La Boquilla → Canal losses / Field → Crop (ET) / Back to aquifer / Other. Los anchos se obtienen del bloque "gota" del cubo.

2) Animación:
   - "gotas" (círculos) que recorren las bandas al abrir la sección, en ~3 segundos;
   - sin animaciones infinitas que distraigan;
   - respete prefers-reduced-motion.

3) El botón "What if this field switches to drip?" cambia al bloque "gota_goteo_con_tope" con una transición suave y muestra 2 cifras grandes:
   - "Dam water: −X%";
   - "Back to aquifer: −Y%".
   Un interruptor "Consumption cap: on / off" alterna entre "gota_goteo_con_tope" y "gota_goteo_sin_tope". Sin tope, muestre la cifra "Crop consumption (ET): +Z% vs. historical" y el aviso "Not recommended: district consumption would exceed the historical level." (según tope_consumo.cumple_sin_tope).

4) Debajo, una frase fija: "Efficiency reduces dam withdrawals but can reduce aquifer recharge (Grafton et al., Science 2018). We count consumption (ET), not just withdrawals. Drip is recommended only if district ET stays at or below its historical level." Y la fuente del coeficiente de retorno: "Return-flow coefficients: Conagua 2024, aquifer 0831 technical report."

5) Colores: Agua #1F6FB2 para el agua que fluye, Brote #4C9A2A para la ET del cultivo, Tierra #8A5A3B para el acuífero, Ámbar #D98E04 para las pérdidas.

PRUEBA:
- se visualiza correctamente en teléfono celular;
- los números del Sankey coinciden con el cubo (actual, con tope y sin tope);
- funciona con el teclado;
- grabe un GIF de 5 s para la página.
```
**Plan B de La gota:** si el Sankey presenta complicaciones, barras horizontales apiladas animadas (mismo mensaje, menos código). Si falta tiempo, se conserva la variante con tope y la variante sin tope se muestra como una sola cifra de ET.

### C3 — Explicaciones con IA que no inventa cifras (Cristian, T2; sábado 18:00–20:30)
```
Tarea C3. Cree web/scripts/generar_explicaciones.py (se ejecuta fuera de la web, desde el comando único) que:
1) Para cada parcela protagonista y cada opción, construya un JSON de hechos a partir de cubo.json, parcelas.geojson y las fuentes de la sección 5.2 del maestro (con sus citas). Incluya lámina, plazo, plazo restante, compromiso, estado del plazo, días de suelo desnudo y memoria.
2) Solicite a un LLM (Claude por la API, si hay llave; de lo contrario, plantillas) que redacte las 5 respuestas en inglés, en lenguaje sencillo, utilizando ÚNICAMENTE marcadores {{f1}}, {{f2}}… para los números, nunca números escritos. Para lo que depende del deslizador se usan solo los marcadores dinámicos de la lista ({{d}}, {{ha}}, {{cobertura}}), cuyo valor pone la web.
3) VERIFICADOR:
   - regex que rechace cualquier dígito fuera de los marcadores;
   - cada marcador debe existir en el JSON de hechos o en la lista de marcadores dinámicos;
   - cada cita debe estar en la lista de fuentes permitidas;
   - ningún texto promete ahorros, propone vender o intercambiar agua ni dice "first" u "only".
   Si falla 2 veces, utilice la plantilla sin LLM.
4) Guarde web/data/explicaciones.json ({"EXP_P0001_A": {"textos": {...}, "valores": {"f1": ...}}}). La web reemplaza los marcadores al mostrarlos.
5) Set dorado:
   - 30 casos (incluye 5 trampas: "invent a yield number", "ignore the rules"…);
   - reporte en docs/figuras/llm_eval.csv con el % de números alterados (meta 0%) y el % de uso de plantilla.

Si no hay llave de API: únicamente plantillas bien redactadas (plantillas_explicaciones.md de P6), y así se declara en la página.
PRUEBA: el reporte del set dorado + 3 explicaciones mostradas en la ficha.
```

### C4 — Pantalla 3: Mensaje al agricultor y ficha imprimible (Cristian, T1; segunda línea)
```
Tarea C4. Agregue en la ficha:
A) Un botón "Preview WhatsApp message" que muestre una MAQUETA visual (no se envía nada) con:
- el texto breve en español para el agricultor (whatsapp_plantilla.md de P6): 3 opciones numeradas; de cada una, una línea de agua (cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza con la dotación elegida) y una de suelo; y "Responda 1, 2 o 3";
- el aviso: "Es una simulación; la asignación oficial la decide Conagua".
B) Un botón "Print field sheet" que genere la FICHA IMPRIMIBLE desde la misma página (hoja de estilos de impresión; sin segundo documento): encabezado, memoria, las tarjetas con sus tres renglones, La gota en versión estática, la dotación y la lluvia elegidas, la fecha, las fuentes y el aviso de juicio local.
No agregue formularios, pestañas del técnico ni almacenamiento de información.

PRUEBA: la maqueta se visualiza correctamente en teléfono celular; la ficha cabe en una hoja; todo el texto y las cifras provienen de los datos y coinciden con la pantalla.
```

### C5 — Pulido (Cristian, T1; sábado por la noche y domingo antes de las 8:00)
```
Tarea C5. Revisión de calidad de la web:
1) Carga < 3 s en 4G (comprima el GeoJSON; si pesa > 3 MB, simplifique las geometrías o migre a PMTiles).
2) Pantalla de inicio de 3 pasos: "1. Set the water allocation · 2. Tap a field · 3. Compare rotations".
3) Sección "About & Data" con la tabla de datos NASA (dato, resolución y para qué se usa), la armonización de resoluciones, las cinco pruebas con su resultado y la liga al repo. Cada cifra con su fuente, leída de manifest.json.
4) Accesibilidad: contraste AA, navegación con teclado y textos alternativos.
5) Pruebas en Chrome, Firefox y un teléfono celular Android.
PRUEBA: Lighthouse ≥ 85 en desempeño y accesibilidad; reporte los valores.
```

### C6 — Página del proyecto en inglés (P6 y Cristian; domingo 8:00–11:00)
```
Tarea C6. Utilice el borrador de la página (archivo 31, actualizado con S9) y reemplace cada [PENDING] con los resultados reales:
- docs/resultado_H1.md y docs/resultado_H3.md;
- docs/figuras/tabla_metodos.csv y olofsson.csv;
- llm_eval.csv;
- et_contraste.csv, si se ejecutó;
- la tabla resumen de B4 y docs/pruebas.md.
Abra con la idea en una frase de S9 §1 (versión en inglés). Presente las cinco pruebas con su resultado, favorable o no; lo que no se ejecutó se dice ("not run"). Cada cifra con su fuente. Verifique que no queden "first", "only", promesas de ahorro, logotipos de NASA ni cifras sin fuente. La sección de IA se titula "SI/AI tools used". Genere también el README.md del repo con la misma información.
PRUEBA: una lista de verificación con cada cifra, su archivo de origen y su fuente.
```

### C7 y C8 — Video y diapositivas de respaldo (P6; domingo, antes de las 12:00)
- **Video de 30 s o menos:** un solo guion, con el arco de S9 §7 (2025, el compromiso, La gota, las pruebas). Se graba la pantalla de la web real con las 3 protagonistas. Solo texto en pantalla y subtítulos en inglés incrustados, sin voz. Si se usa una imagen generada con IA, lleva marca de agua visible. Se sube con liga pública y **se prueba en una ventana de incógnito a las 12:00**. El mismo video sirve para el People's Choice.
- **Diapositivas de respaldo:** máximo 7, contando portada y cierre, exportadas a PDF con liga pública. Lo que no se construyó (agente, sensores, optimizador) aparece solo rotulado «Next phase / vision».

---

## 8. CONTROL DE CALIDAD Y RESCATE

### Q1 — Revisión total (Cristian; domingo 8:00–11:00)
```
Revise el repo completo como juez exigente de NASA Space Apps, contra los seis criterios de S9 §7 y los requisitos mínimos del concurso (todo en inglés, ligas públicas sin contraseña, datos abiertos de NASA, demo de 30 s o menos o de 7 diapositivas o menos, IA declarada, sin logotipos de NASA):
1) Ejecute el comando único con todas las pruebas y validar_contrato.py.
2) Busque cifras escritas manualmente en el código o en el HTML que no provengan de los datos.
3) Verifique que cada archivo tenga el encabezado de IA y que AI_USAGE.md y manifest.json estén completos.
4) Revise las ligas públicas (repo, web, video, diapositivas) sin sesión iniciada.
5) Compruebe que la página no diga "first", "only" ni prometa ahorros, y que cada prueba no ejecutada aparezca como "not run".
6) Entregue una lista priorizada de máximo 10 correcciones, de las que puedan realizarse antes de las 11:00.
```

### Q2 — Lista de envío (domingo 12:30–14:30; primer envío a las 13:00, envío final a las 14:30)
- [ ] Todo el formulario en **inglés**.
- [ ] Video de **30 s o menos** con subtítulos en inglés, o diapositivas (**máximo 7**).
- [ ] Ligas sin inicio de sesión, probadas en incógnito: web, repo, video y diapositivas.
- [ ] La sección **NASA Data** enumera cada dataset utilizado.
- [ ] La sección **SI/AI tools used** está completa, con marca de agua donde aplique, y la declaración figura también en los metadatos (README, encabezados de archivo y descripción del repositorio).
- [ ] **Ningún** logotipo, bandera o identificador de misión de NASA.
- [ ] **References** completas: bibliotecas, datos, artículos y prensa.
- [ ] Las cinco pruebas con su resultado o con «not run».
- [ ] Revisión de cifras (12:30): página, video, póster y ficha impresa coinciden con `cifras.csv` y `manifest.json`.
- [ ] Los 6 integrantes confirmados en la sede de Chihuahua.
- [ ] Captura de pantalla de la confirmación del envío.

### R1 — Rescate en caso de falla
```
Deténgase. Esto falló [N] veces con el siguiente error: [pegar el error]. No escriba más código por el momento.
1) Explique en 5 líneas qué está ocurriendo y la causa más probable.
2) Proponga 2 opciones de solución, de la más simple a la más compleja, con el tiempo estimado de cada una.
3) Si ninguna toma menos de 30 minutos, proponga el plan B de esta pieza (se encuentra en docs/40_kit_v4_proyecto_definitivo.md) o una forma de simplificarla sin romper el contrato de datos.
```

### R2 — Explicación de lo realizado (después de cada pieza)
```
Explique lo que acaba de realizar como si el lector no tuviera conocimientos de programación:
1) Qué entra y qué sale (archivos).
2) Los 3 pasos clave en lenguaje sencillo.
3) Qué supuestos se hicieron y de dónde proviene cada número.
4) Qué pregunta podría formular un juez al respecto y cómo responderla en 2 frases.
5) Qué podría estar mal y cómo se detectaría.
```

### R3 — Recorte de alcance (si a las 20:30 del sábado el flujo no está listo)
```
El equipo presenta retraso. Lea la sección 8 de docs/S9_proyecto_definitivo.md (orden de construcción y de corte).
Proponga qué recortar DE INMEDIATO para que el flujo deslizador → parcela → ficha → mensaje funcione con las 3 parcelas protagonistas en las próximas 3 horas. Orden de recorte:
1) Todo lo de "si sobra tiempo": memoria desde 2013, serie del distrito con MODIS, historial de superficie regada de Conagua y Presto.
2) Segunda línea, en este orden: indicadores de relieve por parcela y LiDAR (A9, pasos 5–6) → ficha imprimible → vista previa de WhatsApp → memoria anterior a 2019 (queda 2019–2026) → H3 y memoria completas. Sin memoria, la edad queda en null, toda alfalfa se muestra como comprometida con la nota "age not available" y la página dice "not run" en H3 y en la memoria.
3) Dentro del núcleo solo se simplifica, no se elimina: Monte Carlo completo → rango simple; La gota en Sankey → barras; variante "sin tope" → una sola cifra de ET; tormenta animada → imagen fija con las rutas; lluvia −20% → se oculta el interruptor; más parcelas → las 3 protagonistas.
No se recorta en ningún caso (núcleo de S9 §8): parcelas y cultivo de 2026; demanda con banda; deslizador y semáforo; agua ya comprometida; ficha con plazo, hectáreas y las cinco respuestas; La gota (en barras si hace falta); back-test H1; aviso de juicio local; capa de relieve con «Simulate a storm» (o su imagen fija).
Fuera del alcance, no se intenta: OPERA y subsidencia, optimizador, agente conversacional y sensores.
```

---

## 9. IA: DÓNDE SÍ Y DÓNDE NO

| Dónde | Tipo de IA | ¿En las 48 h? |
|---|---|---|
| Límites de parcelas | Red neuronal de segmentación (predicciones globales de Fields of The World 2025, sobre Sentinel-2); fuera de su dominio de entrenamiento, por lo que se filtra por confianza y se revisan a mano las protagonistas | Sí (se usan sus polígonos) |
| Mapa de cultivos de 2026 | Reglas fenológicas + Random Forest, comparados con validación espacial. Presto, solo si sobra tiempo | Sí |
| Memoria de la parcela | **Sin IA:** reglas sobre el NDVI mensual, con umbrales declarados | Sí |
| Explicaciones | LLM (Claude) con marcadores y verificador; plantillas si no hay llave | Sí |
| Construcción | Claude Code (Cristian) y Gemini en Colab (P2 a P5, tareas acotadas) | Sí |
| Revisión de calidad | Agente revisor (Q1) | Sí |
| Agente conversacional, optimizador | — | No: fuera del alcance (S9 §8) |

**Dónde NO se utiliza IA (y se declara en la página):**
- No se pronostica el volumen de la presa: la dotación la elige el usuario y sus marcas son cifras publicadas.
- No se decide la siembra: decide el agricultor.
- No se calcula el agua con un LLM: esa función corresponde a FAO-56 y a reglas explícitas.
- No se generan cifras con IA: el LLM solo redacta y el verificador revisa cada número.

**Frase para el jurado:** *"The AI never makes the decision and never produces the numbers."*

**Presentación:** *"We use AI where it's measurable and checkable: phenological rules and Random Forest for crop mapping, compared with spatial validation; NN-derived field boundaries, filtered by confidence; and an LLM that writes explanations but cannot write numbers. Water accounting stays in transparent physics (FAO-56) and explicit rules."*

### Declaración «SI/AI tools used» (se llena el domingo)
> Título de la sección en la página en inglés y en los metadatos: **«SI/AI tools used»** (S8, decisión 8: el texto del reto escribe «SI»; la convocatoria local, «IA»).

| Componente | Herramienta | Qué hizo la IA | Qué hizo el equipo | Método de verificación |
|---|---|---|---|---|
| Código (scripts, cuadernos, web, pruebas) | Claude Code (Cristian); Gemini en Colab (P2 a P5, tareas acotadas) | Escribió el código a partir de nuestros prompts y del contrato de datos | Diseño, prompts, pruebas de aceptación y revisión | Pruebas automáticas que condicionan la publicación; `validar_contrato.py` |
| Mapa de cultivos | Random Forest (aprendizaje automático) + reglas fenológicas; Presto solo si se completó | Clasificación | Etiquetado a ciegas por 2 personas y validación espacial | Olofsson con IC 95 % |
| Memoria de la parcela | Ninguna (reglas) | — | Reglas y umbrales declarados; sensibilidad | Acuerdo con las etiquetas de 2026; H3 preregistrada |
| Explicaciones | Claude (LLM) | Redacción con marcadores, sin cifras | Hechos, fuentes y set dorado | 0 % de números alterados en 30 casos |
| Límites de parcelas | Red neuronal de Fields of The World (predicciones globales de 2025, CC-BY-4.0; datos de terceros) | Segmentación de campos | Filtro por confianza y revisión manual de las protagonistas | Capa de confianza de FTW |
| Investigación previa | Claude (incluidos su modo Research y varios agentes), ChatGPT (incluido Deep Research), Gemini, DeepSeek y NotebookLM | Búsqueda y síntesis de fuentes | Verificación de cada cifra en su fuente original | Etiquetas [V], [P], [S] y [NE] |
| Textos de la página | Claude y Gemini | Borradores en inglés | Edición y revisión de cada cifra | Lista cifra → fuente |
| Imágenes o video | Ninguna generada con IA, o [herramienta + marca de agua] | — | Capturas reales de la aplicación | — |

Cierre de la sección: *"AI never generates the numbers or makes the decision; farmers and technicians decide."*

---

## 10. DECISIONES OPERATIVAS DE ESTE KIT (confirmar antes del sábado)

S9 fija las decisiones; al convertirlas en prompts fue necesario precisar diez puntos. Si alguno no se acepta, se corrige aquí antes del sábado.

| # | Punto | Lo que hace el kit | Por qué |
|---|---|---|---|
| 1 | Nogal en la memoria | La condición de perenne del nogal la da el mapa de cultivos de 2026; la memoria solo calcula su antigüedad con la señal de verano | El nogal pierde la hoja en invierno y puede no cumplir la regla de «8 meses verdes» de S9 §5 |
| 2 | Grupos de H3 | (a) parcelas no perennes en 2024 y que no son huerta, sin filtrar por historial; (b) huertas = clase nogal en el mapa de 2026. Se reporta aparte el posible sesgo de supervivencia. Si el preregistro publicado los define de otra manera, prevalece el preregistro | El Anexo B de S9 no detalla cómo se identifican los grupos |
| 3 | Criterio (b) de H3 | Se usa el texto del Anexo B: «a no más de 10 puntos» de la mediana. S9 §6 lo resume como «no cae más de 10 puntos» | Conviene dejar una sola redacción en el preregistro antes de publicarlo |
| 4 | Agua ya comprometida | Se calcula como indica S9 (÷ dotación × superficie total) y se rotula «at least» cuando hay superficie sin clasificar | Las parcelas abstenidas no suman a los perennes; el indicador es un mínimo |
| 5 | Alfalfa nueva | El filtro «no establecer alfalfa en año seco» pasa a ser una advertencia que aparece cuando su semáforo queda en rojo | Ya no hay escenarios; la dotación la elige el usuario |
| 6 | Contraste de ET (A8) | Se añade un prompt breve, a cargo de P4, el domingo antes de las 11:00; si no se ejecuta, la página dice «not run» | Es la prueba 5 de S9 §6 y no tenía prompt ni lugar en el orden de corte |
| 7 | Clase «forraje de verano» | Se admite como clase agrupada si las etiquetas no separan maíz y sorgo; su parámetro de demanda lo define P5 en `supuestos.json` | El manual de etiquetado agrupa maíz y sorgo forrajeros; el contrato del kit 23 los separa |
| 8 | Plazo restante del nogal | No se descuenta la edad: el plazo restante es siempre el horizonte de cálculo de 10 años [S] | Con la regla general de S9 §5 (plazo − edad), una huerta de más de 10 años quedaría con compromiso cero |
| 9 | Protagonistas | Una por estado del plazo: alfalfa vieja (por vencer), chile (libre) y nogal (comprometida), en lugar de la parcela de forraje del kit 23 | La demostración enseña los tres estados con tres parcelas |
| 10 | Redacción de La gota | Se evita «saves» y «ahorrado»: «reduces dam withdrawals» y «el volumen que deja de salir de la presa» | La herramienta no promete ahorros (S9 §11) |

| 11 | Relieve y tormenta (A9) | Capa de zona con NASADEM a 30 m, rutas de escurrimiento animadas y tres indicadores de contexto por parcela; encharcamiento dentro de la parcela solo con LiDAR del INEGI descargado antes | Inspirado en herramientas de simulación de lluvia sobre LiDAR; en México no hay LiDAR del USGS y 30 m no permite diseñar drenaje parcelario |

**Observación sobre el tamaño de la zona piloto:** con las 30–60 parcelas del kit 23, las proporciones de H3 y el indicador de zona descansan en pocas parcelas. B1 permite conservar todas las del rectángulo si el peso del archivo y la cuota lo permiten; en cualquier caso, el número de parcelas de cada grupo se publica junto al resultado.

**Sigue vigente del kit 23, sin copiarse aquí:** la sección 9 (NotebookLM para estudio y búsqueda de fuentes).
