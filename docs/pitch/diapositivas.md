<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Diapositivas de respaldo · máximo 7

**BORRADOR para que el equipo lo ajuste (responsable de presentación y pitch).** El texto de cada diapositiva va en inglés; la nota del orador, en español.

## 1. Qué fija el kit (pieza C8)

| Punto | Lo que dice | Dónde |
|---|---|---|
| Cantidad | Máximo 7, contando portada y cierre | `docs/kit/40_kit_v4_proyecto_definitivo.md`, C8 |
| Entrega | PDF con liga pública, probada en incógnito | Kit C8 y Q2 |
| Lo que no se construyó | Aparece rotulado «Next phase / vision» | Kit C8 |
| Para qué sirven | Son el respaldo si el video no queda (video de 30 s o menos, o diapositivas) | Kit Q2 |
| Reglas | En inglés, sin logotipos de la NASA, cada cifra con su fuente | Kit Q2; `CLAUDE.md`, reglas 2 y 9 |

## 2. Cómo armarlas

- Una idea por diapositiva. El texto es poco: lo demás lo dice la captura.
- Las capturas salen de `tests/e2e/capturas/` (las genera `node tests/e2e/web_smoke.mjs`) o de la página.
- **Las cifras del texto deben ser las mismas que se ven en la captura.** Las capturas actuales de la ficha se tomaron con la marca «Normal year»; si se vuelven a tomar con otra marca, cambie el texto.
- «[SI ESTÁ CONECTADO]» marca la captura que depende del gemelo; debajo va su «[ALTERNATIVA]».
- «[SI EL GOTEO ESTÁ CONECTADO]» y «[SI EL GOTEO NO ESTÁ]» marcan lo que cambia según si el escenario de goteo ya está en «Follow the drop». Se dice una de las dos.
- Liga del PDF: [LINK: pendiente — responsable de presentación y pitch].

## 3. Las siete diapositivas

### Slide 1 · Cover

| Campo | Contenido |
|---|---|
| Title | Raíz – From Dam to Root |
| One idea | What the tool is, in one sentence |
| Text on slide | Before you plant, see the water you are committing. · Team Los Norteados · Chihuahua, Mexico · Challenge: Field Shift |
| Capture | **[SI ESTÁ CONECTADO]** captura nueva de la vista 3D de Delicias – Saucillo con las columnas de agua. **[ALTERNATIVA]** `tests/e2e/capturas/escritorio_centro_control.png` |
| Cifra y fuente | Ninguna en el texto. La frase es la de `docs/sintesis/S9_proyecto_definitivo.md` §1 |
| Nota del orador | «Raíz muestra, antes de sembrar, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa.» Diga que es un gemelo digital de dos zonas piloto del distrito de Delicias. |

### Slide 2 · The problem

| Campo | Contenido |
|---|---|
| Title | 2025: the district received no dam water |
| One idea | An annual crop can skip a dry year; a perennial crop cannot |
| Text on slide | Annual crops could be skipped. Pecan orchards still needed water. · 87.4 hm³ of groundwater authorized for survival irrigation, mostly pecan (press) |
| Capture | **[SI ESTÁ CONECTADO]** captura nueva de la línea de tiempo detenida en 2025. **[ALTERNATIVA]** `tests/e2e/capturas/escritorio_capa_memoria.png` (capa «Field memory: 2025») |
| Cifra y fuente | 87.4 hm³ [P] (S9 §2 y Anexo A: El Diario de Delicias, 31-ene-2025). Año sin agua de las presas [P] (S9 §2) |
| Nota del orador | El mecanismo: el agua de un perenne queda comprometida por años y, cuando la presa no alcanza, sale del acuífero. Diga que las dos cifras son de prensa. |

### Slide 3 · The water term

| Campo | Contenido |
|---|---|
| Title | Every crop is a water commitment with a term |
| One idea | Three answers per option, field by field |
| Text on slide | How much water per year · For how many years · How many hectares the allocation covers |
| Capture | `tests/e2e/capturas/escritorio_ficha_tarjetas.png` (Field P0757, alfalfa, marca «Normal year») |
| Cifra y fuente | Las de la captura: lámina de 28.4 millares/ha y «Enough for 2.7 of 7.95 hectares» con 9.5 millares/ha (`web/data/cubo.json` → `parcelas.P0757`; cálculo de `web/reglas.js`) |
| Nota del orador | La alfalfa obliga de 3 a 4 años [P]; el nogal se calcula a 10 años [S]. Esta parcela tiene tres años: su plazo está por vencer y es el momento de comparar. Raíz no marca una opción como la mejor. Las alternativas son provisionales (`data/opciones_b4.json`). |

### Slide 4 · Follow the drop

| Campo | Contenido |
|---|---|
| Title | Follow the drop: count what is consumed |
| One idea | Where each unit of water goes, from the dam to the aquifer |
| Text on slide | Dam → canal → field → crop → aquifer · More efficient irrigation reduces dam withdrawals. It can also reduce aquifer recharge. |
| Capture | `tests/e2e/capturas/escritorio_ficha_gota.png` (Field P0757) |
| Cifra y fuente | Las de la captura: 376,300 m³ salen de la presa; 129,267 m³ consume el cultivo; 75,260 m³ regresan al acuífero (`cubo.json` → `parcelas.P0757`, bloque `gota`). Grafton et al. 2018 (`README.md`, «References») |
| Nota del orador | Contamos el agua consumida, no nada más la extraída. **[SI EL GOTEO ESTÁ CONECTADO]** El goteo se muestra con una eficiencia indicativa de la FAO, no medida en el distrito (`data/processed/supuestos.json` → `ea_goteo`). **[SI EL GOTEO NO ESTÁ]** El goteo aún no está en la página: tenemos una eficiencia indicativa de la FAO, no medida en el distrito, y falta conectarla (`docs/decisiones/2026-11-14_opciones_b3.md` §3). En los dos casos: no prometemos que se libere agua. |

### Slide 5 · A digital twin on open NASA data

| Campo | Contenido |
|---|---|
| Title | A digital twin of two pilot areas |
| One idea | Replica, observed state, model and scenarios; no sensors |
| Text on slide | Replica: 1,239 estimated fields and terrain (NASADEM) · Observed: greenness 2016–2026 (HLS) · Model: crop water need (FAO-56 with NASA POWER) · Scenarios: allocation, rain −20 %, a storm (GPM IMERG) · No field sensors. No real-time data. |
| Capture | **[SI ESTÁ CONECTADO]** captura nueva de la vista 3D con la tarjeta «Twin status». **[ALTERNATIVA]** `tests/e2e/capturas/escritorio_relieve_tormenta.png` |
| Cifra y fuente | 1,239 parcelas (`web/data/cubo.json` → `zona.conteos.total`). Partes del gemelo y lo que no es: `docs/decisiones/2026-11-14_gemelo_digital.md`; `README.md`, «Summary» |
| Nota del orador | El gemelo se actualiza en cada reconstrucción con datos de satélite y de clima. **[SI ESTÁ CONECTADO]** mencione el contexto regional: SMAP, MODIS, GRACE, GLDAS, NLDAS y GEDI. Si no está conectado, diga que esos datos ya se entregaron y aún no se ven en la página. |

### Slide 6 · Tests in sight

| Campo | Contenido |
|---|---|
| Title | Five tests, published whatever the result |
| One idea | Unfavorable results are shown with the same visibility |
| Text on slide | Back-test 2026 (H1): does not meet its preregistered criterion · 2025 natural experiment (H3): not supported · Crop map: 781 of 1,239 fields not classified · Figure checker: 30 of 30 cases correct, 0 numbers altered (tested on templates) · ET contrast: +53 % against SSEBop, a regional comparison |
| Capture | Captura nueva de «About & Data» → «Tests in sight» (no está en `tests/e2e/capturas/`: `escritorio_acerca.png` muestra la parte de «NASA data»). Como apoyo, `docs/h1_backtest.png` |
| Cifra y fuente | H1 (`docs/resultado_H1.md`). H3 (`docs/resultado_H3.md`). 781 de 1,239 (`web/data/pruebas.json`). 30 de 30 y 0 de 71 (`docs/figuras/llm_eval.csv`). +53 %: 1,139.3 mm frente a 746.3 mm (`docs/resultado_A8.md`) |
| Nota del orador | Los criterios se declararon antes de ver los resultados (S9 §6). Lo que no se corrió dice «not run»: Random Forest, exactitud del mapa, WaPOR y el verificador sobre texto de un modelo de lenguaje. El verificador se probó con plantillas. Diga por qué esto da confianza: se sabe hacia dónde falla el modelo. |

### Slide 7 · Closing

| Campo | Contenido |
|---|---|
| Title | The farmer decides |
| One idea | What the tool is not, what we ask, and what comes next |
| Text on slide | Supports, never replaces, the judgment of farmers and local experts. · It does not allocate, sell or trade water. It does not forecast the dam. · We ask: a district technician to check field efficiency; farmers to correct their fields. · Next phase / vision: conversational agent · field sensors · optimizer |
| Capture | `tests/e2e/capturas/telefono_ficha_whatsapp.png` (mensaje al agricultor, en español) |
| Cifra y fuente | Ninguna. Límites: S9 §11. Fuera del alcance: S9 §8 |
| Nota del orador | Cierre con la petición: un técnico de módulo, agricultores que revisen su parcela y que el jurado abra la página. Ligas en la diapositiva: página [LINK: pendiente — integrador], repositorio [LINK: pendiente — integrador] y video [LINK: pendiente — responsable de video (P6)]. |

## 4. Lista de comprobación

- [ ] Son 7 o menos, con portada y cierre.
- [ ] Todo el texto de las diapositivas está en inglés.
- [ ] Ningún logotipo, bandera ni identificador de misión de la NASA.
- [ ] Cada cifra del texto coincide con su captura y con la columna «Cifra y fuente».
- [ ] Lo que no se construyó aparece rotulado «Next phase / vision», en la diapositiva 7.
- [ ] Las capturas marcadas «[SI ESTÁ CONECTADO]» se tomaron de la página final; si no, se usó la alternativa.
- [ ] PDF exportado, con liga pública probada en una ventana de incógnito.
- [ ] Revisión de cifras del domingo a las 12:30 (kit Q2).

## 5. Pendientes

- Tomar las capturas nuevas: vista 3D, línea de tiempo en 2025 y «Tests in sight».
- Decidir si las capturas de la ficha se quedan con la marca «Normal year» o se vuelven a tomar con «Like 2026», como en la exposición. Con «Like 2026» la página mostraría «Enough for 1 of 7.95 hectares» (`web/reglas.js` con `cubo.json`).
- **Goteo (diapositiva 4).** La eficiencia del goteo ya tiene fuente (`data/processed/supuestos.json` → `ea_goteo`, valor indicativo de la FAO); falta que el integrador conecte el escenario. La captura actual no lo muestra. Si se vuelve a tomar con el botón «What if this field switches to drip?», las cifras del texto deben ser las de esa captura. `LIMITATIONS.md` todavía dice que no hay una eficiencia con fuente: quedó atrasado y lo corrige el integrador.
- Las diapositivas usan a P0757. Si se agrega una captura de la parcela «libre», debe ser de P0632 (`docs/decisiones/2026-11-14_opciones_b3.md` §2), no de P0244.
- Poner las ligas cuando existan.
