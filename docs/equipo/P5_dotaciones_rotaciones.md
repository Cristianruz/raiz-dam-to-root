<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# P5 · Dotaciones, opciones por cultivo, propuesta de supuestos y tabla única de cifras

**Qué le toca ahora** (S9 §10; kit §3; decisiones del integrador del 14-nov a las 10:30):
1. **B2:** `dotaciones.json` (sin cambios respecto al kit).
2. **B3:** `opciones_b3.json`: para cada cultivo actual, sus 2 o 3 rotaciones alternativas (con los `id` de `rotaciones.json`) y los filtros duros con motivo y fuente. Sustituirá al diseño provisional de Cristian, `data/opciones_b4.json`.
3. **`propuesta_supuestos.md`:** una nota corta con valores **con fuente** para los supuestos que hoy no la tienen (eficiencia parcelaria, eficiencia de goteo y lo demás marcado «assumption»).
4. **`cifras.csv`:** la tabla única de cifras.
5. Revisiones sin archivo propio: las cifras del motor y la lista cifra → fuente (kit §3).

**Lo que ya no le toca** ([README §6, decisión f](README.md#6-decisiones-del-14-nov-mandan-sobre-el-kit)):
- **`rotaciones.json` y `supuestos.json` tienen un solo dueño: la sesión de datos.** Usted **no** entrega ningún archivo con esos nombres. Si un supuesto debe cambiar, lo propone en `propuesta_supuestos.md` y Cristian decide.
- **`filtros.py` ya no se entrega:** los filtros duros van como datos dentro de `opciones_b3.json`, y sus 8 pruebas se corren en el cuaderno.

**Ya está hecho y lo usa** (en `Raiz_entregas`, de la sesión de datos): `rotaciones.json` (los `id` de rotación, su plazo y la lámina; en su llave `params`, los supuestos con su valor, fuente y etiqueta) y `demanda_cultivos.csv` (lámina por cultivo). `heladas.json` lo entrega P4 antes de las 12:00.

| Orden | Pieza | Archivos que entrega | ¿Lo valida el ensamblador? | Hora límite |
|---|---|---|---|---|
| 1 | [B2 · dotaciones](#b2--dotaciones-en-millares-por-hectárea) | `dotaciones.json`, `fuentes_B2.csv`; `historial_superficie.csv` solo si sobra tiempo | Sí | Sáb 12:00 (kit §3) |
| 2 | [B3 · opciones y filtros](#b3--opciones-por-cultivo-y-filtros-duros-opciones_b3json) | `opciones_b3.json`, `fuentes_B3.csv` | `opciones_b3.json`: **no, nota no validada** (Cristian la copia a mano). `fuentes_B3.csv`: sí | Sáb 14:30 (kit §3) |
| 3 | [Propuesta de supuestos](#propuesta-de-supuestos-propuesta_supuestosmd) | `propuesta_supuestos.md` | **No, nota no validada** (la lee Cristian) | Sáb 14:30 (kit §3: supuestos, 12:00–14:30), para llevarla a las mentorías de las 16:00 y las 17:00 |
| 4 | [Tabla única de cifras](#tabla-única-de-cifras-cifrascsv) | `cifras.csv`, `fuentes_CIFRAS.csv` | Sí | Primera versión, sáb 15:00–18:00; se actualiza hasta la revisión de cifras del dom 12:30 |
| 5 | [B2-cal](#b2-cal--calibración-solo-si-el-preregistro-la-declara) | `calibracion.csv` | Sí (columnas libres) | Solo si el preregistro la declara |
| — | Revisiones sin archivo propio | Revisa B4; verificación manual de las cifras del motor (sáb 18:00–20:30); plazos y estados (sáb 20:30–1:00); revisión de cifras (dom hasta 8:00); lista cifra → fuente (dom 8:00–11:00) | — | Kit §3 |

**Notas no validadas:** `opciones_b3.json` y `propuesta_supuestos.md` no tienen esquema en `motor/esquemas.py`. Llevan su línea en `LEEME.md` (para saber de dónde salen), pero el reporte del ensamblador las lista como «no está en la tabla 0.4-B». **Es lo esperado:** Cristian las lee y las pasa al repo a mano.

**Cómo se usa cada bloque** (flujo completo en [README §4](README.md#4-flujo-de-trabajo-de-una-pieza)):
1. Abra un cuaderno en Colab (o, para la propuesta de supuestos, un chat de Gemini o de Claude en el navegador).
2. Pegue el bloque y pida **una celda por paso**.
3. Corra la prueba y pida la revisión de `docs/prompts/para_gemini.md` con contexto nuevo.
4. Guarde en `Raiz_entregas`, agregue su línea al final de `Raiz_entregas/LEEME.md` y avise: `ENTREGA: <archivo> — prueba OK`.

---

## B2 · Dotaciones en millares por hectárea

| | |
|---|---|
| **Entradas** | Las notas de prensa citadas (S8 §2), abiertas en el navegador si es posible, con su fecha de lectura; `data/params.json` (bloques `dotaciones` y `distrito`; el paso del deslizador es valor de diseño); `Raiz/entradas/` para el último almacenamiento de La Boquilla |
| **Cuaderno** | `B2_dotaciones.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00 (kit §3, primer bloque) |
| **Después de las mentorías** (16:00 y 17:00) | Si un técnico confirma o corrige el punto de medición o las cifras, P4 o P6 se lo pasan. Usted actualiza `dotaciones.json` y agrega una línea nueva en `LEEME.md` con la fecha nueva (kit B2, paso 2) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P5 Dotaciones, plazos y rotaciones.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el navegador del integrador).

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — ROOT, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y campos del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/. No sobrescribas archivos de otras personas ni de la sesión de datos.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: llaves, tipos y valores del JSON.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize.
7. Usa bibliotecas comunes (pandas, numpy, json). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_B2.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_B2.csv), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| B2 (P5) | `dotaciones.json`; `historial_superficie.csv` solo si sobra tiempo | Bloques `dotaciones` y `distrito` del contrato (sección 2.3) |
Filas del contrato, kit §2.3 (copiadas tal cual), para los bloques "distrito" y "dotaciones" de dotaciones.json:
| `distrito.boquilla.namo_hm3`, `.fuente_namo` | number, texto | 2,846.780 hm³; tabla de Conagua reproducida en prensa [P] | B2 |
| `distrito.boquilla.almacenamiento_hm3`, `.fecha_almacenamiento`, `.fuente_almacenamiento` | number o null, fecha, texto | Último dato con fecha y fuente; null si no existe | B2 |
| `distrito.acuifero_0831.disponibilidad_hm3_anio`, `.fuente` | number, texto | −167.12 hm³/año; Conagua 2024, DR_0831 [V] | B2 |
| `distrito.capas_disponibles` | lista | `"cultivos"`, `"suelo_desnudo"` y `"memoria_2025"` (esta solo si A3-M entregó 2025) | K-ENS |
| `dotaciones.unidad` | string | `"millares_por_ha"` | B2 |
| `dotaciones.equivalencia` | texto | 1 millar/ha = 1,000 m³/ha = 10 cm | B2 |
| `dotaciones.deslizador.min`, `.max`, `.paso` | number | 0, 12 y el paso (valor de diseño, no dato) | B2 |
| `dotaciones.marcas[]` | lista de 3 | Por marca: `id` (`como_2025`, `como_2026`, `anio_normal`), `nombre`, `min`, `max`, `valor` (punto medio del rango), `nota`, `fuente`, `fecha_consulta`, `etiqueta` | B2 |
| `dotaciones.punto_medicion` | texto | «Toma de la parcela [S]; por confirmar con un técnico de módulo» | B2 |
LO QUE REVISA EL VALIDADOR (motor/ensamblar.py, regla «dotaciones»): unidad = "millares_por_ha"; equivalencia no vacía; deslizador con min < max y paso > 0 (si difiere del de data/params.json, solo avisa); exactamente 3 marcas con id como_2025, como_2026 y anio_normal; en cada marca, nombre, fuente y etiqueta no vacíos, las llaves nota y fecha_consulta presentes (pueden ser null), min, max y valor numéricos, valor = punto medio de [min, max] y el rango dentro del deslizador; distrito.boquilla.namo_hm3 > 0 con fuente_namo; si almacenamiento_hm3 no es null, con fecha_almacenamiento AAAA-MM-DD y fuente_almacenamiento; acuifero_0831.disponibilidad_hm3_anio numérico con fuente.
Además: fuentes_B2.csv (archivo, url_o_api, fecha_consulta, sha256). Ninguna celda puede quedar vacía: el validador rechaza el archivo si falta un sha256. Para una nota de prensa: guarda una copia en Raiz/cuadernos/ (el texto de la nota en .txt o la página en PDF) y escribe la URL, la fecha de lectura y el sha256 de esa copia. Si la nota no se pudo abrir, la fuente que usaste es el texto pegado de S8 §2: guárdalo en Raiz/cuadernos/ como .txt y registra su sha256, con "S8 §2 (nota no leída directamente)" en url_o_api. Si no hay copia que guardar, NO pongas la fila con el sha256 vacío: detente y avísame para avisar a Cristian.

DOCUMENTOS DE REFERENCIA (pegados)
S8 §2 "Cifras" (copiado tal cual):
| Dato | Valor | Fuente | Etiqueta |
|---|---|---|---|
| La Boquilla al 9-nov-2026 | 825.577 hm³; menos de un tercio de su capacidad | Impacto Noticias, 9-nov-2026, con el reporte diario de Conagua | [P] |
| Francisco I. Madero al 9-nov-2026 | 180.785 hm³; 53.6 % de 333.32 hm³ | Ídem | [P] |
| Ciclo 2027 | Un representante de los usuarios estimó que solo podría autorizarse una cuarta parte de la superficie. Es previsión, no autorización; decide Conagua en diciembre | Quadratín Chihuahua, 31-oct-2026 | [P] |
| Dotación por hectárea | Año normal: 9–10 millares/ha; 2026: 3–4 millares/ha | El Diario de Chihuahua, 27-jul-2026 | [P], por confirmar |
| Dotación 2025 en el Módulo 4 | 1 millar/ha desde pozos | El Diario de Chihuahua, 28-oct-2024 | [P] |
| Cálculo propio | Con 3–4 millares/ha la presa cubre 30–40 cm: 17–24 % de la lámina anual de la alfalfa (170–180 cm, INIFAP) y 44–59 % de la del algodón (≈68 cm) | Cifras [V] y [P] | Cálculo |
[PEGA AQUÍ de data/params.json el bloque "dotaciones" (deslizador con su paso) y el bloque "distrito".]

TAREA
NOTA DEL EQUIPO: no escribas ninguna dotación que no esté en el texto pegado. Si abriste la nota del 27-jul-2026 en el navegador, anota la fecha de lectura y cambia "por confirmar".
Tarea B2. En B2_dotaciones.ipynb (Raiz/cuadernos/). No calcule terciles ni volúmenes por hectárea a partir del volumen de la presa: la dotación se expresa en millares por hectárea y la elige el usuario con el deslizador.
1) Escriba dotaciones.json (en Raiz_entregas/) con el bloque "dotaciones" del contrato (sección 2.3):
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
   - boquilla.almacenamiento_hm3 con la fecha y la fuente del último dato disponible en Raiz/entradas/. Referencia de S8: 825.577 hm³ al 9-nov-2026 (prensa con el reporte diario de Conagua) [P]. Null si no existe dato con fuente;
   - acuifero_0831.disponibilidad_hm3_anio = −167.12 hm³/año (Conagua 2024, documento técnico DR_0831).
4) Comprobación de escala (S9 §5, con láminas del INIFAP): 10 ha con 3.5 millares/ha reciben 35 millares, que alcanzan para 2.0 ha de alfalfa (17.5 millares/ha), 5.1 ha de algodón (6.8) o 6.4 ha de maíz forrajero (5.5). Reprodúzcala e imprímala.
5) SOLO SI SOBRA TIEMPO (S9 §8): historial de superficie regada del DR-005 con la serie de Conagua de Raiz/entradas/ (superficie regada y volumen distribuido por año agrícola), como gráfica de contexto. Declare qué fuentes suma el volumen distribuido (La Boquilla, Francisco I. Madero, pozos) y no use la caída de almacenamiento como si fuera extracción. Entregue historial_superficie.csv en Raiz_entregas/.

PRUEBA:
- tabla de las 3 marcas con rango, valor, fuente, fecha y etiqueta;
- la comprobación de escala reproduce 2.0, 5.1 y 6.4 ha;
- verificación de esquema de dotaciones.json contra el contrato.
Explique en 4 líneas qué es un millar y por qué la dotación se muestra como un rango y no como un dato oficial.
```

**Ajustes al texto del kit en este bloque:**
- «En motor/B2_dotaciones.ipynb.» → «En B2_dotaciones.ipynb (Raiz/cuadernos/).»
- «1) Escriba dotaciones.json con el bloque» → «1) Escriba dotaciones.json (en Raiz_entregas/) con el bloque»
- «del último dato disponible en data/raw.» → «del último dato disponible en Raiz/entradas/.»
- «con la serie de Conagua de data/raw (» → «con la serie de Conagua de Raiz/entradas/ (»
- «Entregue historial_superficie.csv.» → «Entregue historial_superficie.csv en Raiz_entregas/.»

**Prueba de aceptación** (kit B2):
```text
PRUEBA:
- tabla de las 3 marcas con rango, valor, fuente, fecha y etiqueta;
- la comprobación de escala reproduce 2.0, 5.1 y 6.4 ha;
- verificación de esquema de dotaciones.json contra el contrato.
Explique en 4 líneas qué es un millar y por qué la dotación se muestra como un rango y no como un dato oficial.
```

**Plan B:** el kit no trae uno para B2. Mientras no haya confirmación, las marcas quedan con las cifras de prensa rotuladas [P] y el punto de medición como [S] (S9 §12).

**Líneas de LEEME.md:**
```text
dotaciones.json | El Diario de Chihuahua, 27-jul-2026 y 28-oct-2024 [P]; Conagua 2024, DR_0831 [V]; tabla de Conagua en prensa (NAMO) [P]; S8 §2 | 2026-11-14 | colab/B2_dotaciones.ipynb
fuentes_B2.csv | Fuentes de B2: notas de prensa y documento técnico DR_0831 (URL, fecha de consulta, sha256) | 2026-11-14 | colab/B2_dotaciones.ipynb
historial_superficie.csv | Serie de Conagua de superficie regada y volumen distribuido del DR-005 (solo si sobra tiempo) | 2026-11-15 | colab/B2_dotaciones.ipynb
```
Aviso: `ENTREGA: dotaciones.json — prueba OK`.

---

## B3 · Opciones por cultivo y filtros duros (`opciones_b3.json`)

| | |
|---|---|
| **Qué es** | Para cada cultivo actual del contrato: la rotación ACTUAL y sus **2 o 3 alternativas** (3 solo en alfalfa establecida; kit C2, paso 3), más los **filtros duros** con motivo y fuente (kit B3, paso 2). Sustituirá a `data/opciones_b4.json`, el diseño provisional [S] de Cristian |
| **`id` permitidos** | Solo los de `rotaciones.json`: `alfalfa`, `alfalfa_corte_verano`, `nogal`, `algodon`, `chile`, `maiz_forrajero`, `sorgo`, `avena_maiz` y `descanso`. Si una opción del maestro §5.2 no tiene `id`, **no lo invente**: anótela en la sección «sin id» del cuaderno y avise a Cristian |
| **Entradas** | `rotaciones.json` (sesión de datos) y `heladas.json` (P4) de `Raiz_entregas`; el formato de partida, `data/opciones_b4.json` (abajo) |
| **Documentos que no están en el repo (pídalos a Cristian)** | Maestro §5.2 (opciones ACTUAL, A–E y «nogal no rota», con filtros duros); INIFAP 2017; SDR Chihuahua 2026; archivo 29, §4 (FAO-29, Tabla 4) y §5 (plazos de etiqueta de la atrazina); Silva-Rojas et al. 2009 |
| **Cuaderno** | `B3_opciones.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 14:30 (kit §3) |

**El formato de partida** es el de `data/opciones_b4.json`, que hoy lee el motor (`motor/b4_cubo.py`). Así se ve hoy:
```json
{
  "_encabezado": "AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026",
  "_nota": "Opciones por cultivo actual para el cubo (kit B4, paso 1). DISEÑO PROVISIONAL del integrador [S] mientras P5 entrega B3 …",
  "etiqueta": "Diseño [S]",
  "actual": {
    "alfalfa": "alfalfa", "nogal": "nogal", "chile": "chile", "algodon": "algodon",
    "maiz_forrajero": "maiz_forrajero", "sorgo": "sorgo", "cereal_invierno": "cereal_invierno",
    "barbecho": "descanso", "forraje_verano": "maiz_forrajero"
  },
  "alternativas": {
    "alfalfa": ["alfalfa_corte_verano", "algodon", "maiz_forrajero"],
    "nogal": ["algodon", "descanso"],
    "chile": ["algodon", "maiz_forrajero"],
    "algodon": ["chile", "maiz_forrajero"],
    "maiz_forrajero": ["sorgo", "algodon"],
    "sorgo": ["maiz_forrajero", "algodon"],
    "cereal_invierno": ["avena_maiz", "descanso"],
    "barbecho": ["maiz_forrajero", "sorgo"],
    "forraje_verano": ["sorgo", "algodon"]
  },
  "nombres_en": { "alfalfa": "Alfalfa", "alfalfa_corte_verano": "Alfalfa with a summer irrigation cut", "…": "…" }
}
```
**`opciones_b3.json` conserva esas llaves** (`actual`, `alternativas` y `nombres_en`, con los mismos cultivos) y **agrega `filtros`** y la fuente de cada decisión. Así Cristian lo cambia sin tocar el motor.

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P5 Dotaciones, plazos y rotaciones.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos (rotaciones.json, demanda_cultivos.csv…) y heladas.json de P4; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el navegador del integrador).

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — ROOT, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y campos del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). NUNCA escribas rotaciones.json ni supuestos.json: son de la sesión de datos. Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en Raiz/cuadernos/.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: llaves, tipos y valores del JSON.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize.
7. Usa bibliotecas comunes (pandas, json). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada regla;
   - qué podría estar mal.
9. Guarda también fuentes_B3.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía. Para un documento que solo te pegué (maestro §5.2, archivo 29, INIFAP 2017…), guarda el texto pegado en Raiz/cuadernos/ como .txt y registra su sha256; si no hay copia que guardar, no pongas la fila: detente y avísame.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_B3.csv), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual; ya no aplica tal cual):
| B3 (P5) | `rotaciones.json` y `filtros.py` (con sus 8 pruebas impresas) | Estructura del prompt B3, más la opción «no sembrar / rastrojo en pie» |
CAMBIO ACORDADO EL 14-NOV (manda sobre la fila de arriba): NO escribas rotaciones.json ni filtros.py. Escribe opciones_b3.json en Raiz_entregas/ con esta estructura (la de data/opciones_b4.json, más "filtros"):
{
  "_encabezado": "AI-assisted (Gemini) — ROOT, NASA Space Apps 2026",
  "_nota": "<qué es y de dónde sale>",
  "etiqueta": "<[V], [P] o [S], según las fuentes>",
  "actual": { "<cultivo_actual>": "<id>", ... },
  "alternativas": { "<cultivo_actual>": ["<id>", "<id>"], ... },
  "filtros": [
    { "id": "<nombre_corto>", "cultivo_actual": ["<cultivo>", ...], "rotacion": "<id>",
      "accion": "excluir" | "advertir_si_rojo" | "advertir",
      "condicion": "<cuándo aplica, en palabras; vacío si siempre>",
      "motivo": "<texto corto para el agricultor>", "fuente": "<documento y sección>", "etiqueta": "<[V], [P] o [S]>" }
  ],
  "nombres_en": { "<id>": "<nombre en inglés>", ... }
}
Reglas del formato:
- llaves de "actual" y de "alternativas": los cultivos del contrato menos sin_clasificar: alfalfa, nogal, chile, maiz_forrajero, sorgo, algodon, cereal_invierno, barbecho, forraje_verano;
- cada id de "alternativas" (y de "rotacion" en los filtros) es uno de: alfalfa, alfalfa_corte_verano, nogal, algodon, chile, maiz_forrajero, sorgo, avena_maiz, descanso (los id de rotaciones.json);
- "actual" conserva lo que trae data/opciones_b4.json salvo que una fuente diga otra cosa (cereal_invierno se queda como "cereal_invierno": su lámina sale de demanda_cultivos.csv);
- 2 alternativas por cultivo; 3 solo en alfalfa (alfalfa establecida);
- todo filtro lleva motivo y fuente no vacíos. Un filtro sin fuente no entra: lo listo como pendiente.
Además: fuentes_B3.csv (archivo, url_o_api, fecha_consulta, sha256).

DOCUMENTOS DE REFERENCIA (pegados)
[PEGA AQUÍ data/opciones_b4.json completo (GitHub del proyecto).]
[PEGA AQUÍ maestro §5.2 completo (opciones y filtros duros), que te pasa Cristian.]
[PEGA AQUÍ archivo 29 §4 (FAO-29, Tabla 4) y §5 (plazos de etiqueta), que te pasa Cristian.]
[PEGA AQUÍ los fragmentos de INIFAP 2017, SDR Chihuahua 2026, NOM-026 y Silva-Rojas et al. 2009 que tengas, con su página.]

TAREA
NOTA DEL EQUIPO: lee rotaciones.json y heladas.json de Raiz_entregas/. Primero imprime la lista de id de rotaciones.json con su nombre, cultivos y plazo: esos son los únicos id que puedo usar. Después arma opciones_b3.json con el formato del ESQUEMA DE SALIDA. Si una opción del maestro §5.2 no tiene id en rotaciones.json, NO inventes uno: lístala en una sección "sin id" del cuaderno y avísame. Si heladas.json aún no está, deja el filtro de heladas con condicion "pendiente: falta heladas.json" y avísame.
Tarea B3 (adaptada). En B3_opciones.ipynb (Raiz/cuadernos/):
1) Las opciones de la sección 5.2 del maestro (ACTUAL, A, B, C, D, E y "nogal no rota"), más la opción "no sembrar / rastrojo en pie" (id descanso), llevadas a los id de rotaciones.json: para cada cultivo actual, la rotación ACTUAL y sus alternativas, con la fuente de cada elección.
2) Los filtros duros de la sección 5.2, como entradas de "filtros" con motivo y fuente.
   OBLIGATORIOS, cada uno con su fuente:
   - fechas de siembra y riesgo de helada con heladas.json (siembra: INIFAP 2017 y SDR Chihuahua 2026);
   - "no sembrar chile después de chile" (INIFAP 2017); si hay antecedente de Phytophthora capsici, al menos 5 años con cultivo no hospedante (Silva-Rojas et al. 2009, [verificado-extracto]);
   - soca del algodón: desvare ≤ 10 días tras la cosecha y desarraigo antes del 30-nov (NOM-026, INIFAP 2017);
   - establecimiento de alfalfa: ya no se filtra por "escenario seco". La opción lleva la bandera "advertir_si_rojo" y la web muestra la advertencia cuando su semáforo de agua queda en rojo con la dotación elegida; el texto recuerda que la alfalfa obliga 3–4 años.
   COMPLEMENTARIOS (parametrizables; se marcan como supuesto si la fuente es secundaria):
   - intervalo entre alfalfas: parámetro con la regla del maestro (≥ 12 meses); la referencia disponible indica un mínimo de 6–7 meses por autotoxicidad (Fundación Produce Chihuahua, [fuente secundaria]);
   - la opción B (alfalfa establecida con corte de riego en verano; id alfalfa_corte_verano) solo si la alfalfa se sembró en un ciclo anterior; variante moderada (omitir 2–3 riegos entre julio y septiembre) por omisión; suspensión desde agosto solo en texturas medias; con arcilla ≥ 40% [supuesto] o suelo arenoso, solo la variante moderada y la bandera "riesgo alto de pérdida de plantas"; con salinidad roja, la opción B no se ofrece; con salinidad ámbar, descontar un lavado de 0–25% del agua no aplicada;
   - la opción D bloqueada si el cultivo previo pudo llevar atrazina (maíz o sorgo) y no se ha revisado la etiqueta. Plazos de etiqueta (archivo 29, sección 5): solo maíz hasta los 7 meses; trigo ≥ 5 meses; cultivos sensibles ≥ 10 meses; no sembrar alfalfa;
   - salinidad con los umbrales de FAO-29, Tabla 4 (archivo 29, sección 4): atención, ECe ≠ ECw. Como no hay salinidad por parcela, utilice una zona de riesgo regional (GSASmap/INEGI) y márquela como "regional".
3) Indicadores de suelo por opción (días de suelo desnudo estimados con el calendario de la opción, leguminosa sí/no, ruptura de plagas sí/no, raíz profunda sí/no): imprímelos en una tabla del cuaderno, con su fuente; no van en opciones_b3.json.
4) PLAZOS: NO los escribas en ningún archivo (ya están en rotaciones.json y data/params.json). Imprime la tabla de plazos de rotaciones.json (id, plazo, plazo_anios) con su etiqueta, para revisarla.

PRUEBA (adaptada de la del kit B3): 8 comprobaciones con assert sobre opciones_b3.json, impresas una por una:
1. "chile" no está en alternativas["chile"] (chile tras chile = no pasa);
2. toda alternativa "alfalfa" en un cultivo distinto de alfalfa tiene un filtro con accion "advertir_si_rojo" (alfalfa nueva lleva la bandera);
3. "alfalfa_corte_verano" solo aparece en alternativas["alfalfa"] (opción B solo con alfalfa establecida);
4. hay un filtro de la soca del algodón con fuente NOM-026 o INIFAP 2017;
5. hay un filtro de heladas que cita heladas.json (o está marcado "pendiente: falta heladas.json");
6. cada id de alternativas y de filtros existe en rotaciones.json;
7. cada cultivo del contrato (menos sin_clasificar) tiene 2 alternativas, o 3 en alfalfa;
8. todo filtro tiene motivo y fuente no vacíos.
Imprima también una tabla opción × filtro para una parcela de ejemplo (por ejemplo, una de chile) y la tabla de plazos del paso 4.
```

**Ajustes al texto del kit en este bloque:**
- «Tarea B3. Cree rotaciones.json, filtros.py (con pruebas) y supuestos.json:» → «Tarea B3 (adaptada). En B3_opciones.ipynb (Raiz/cuadernos/):» (decisión f: `rotaciones.json` y `supuestos.json` son de la sesión de datos; los filtros van como datos).
- Paso 1: se agregó «(id descanso), llevadas a los id de rotaciones.json: …».
- Paso 2: «como funciones que devuelven (pasa: bool, motivo: str)» → «como entradas de "filtros" con motivo y fuente»; en la opción B se agregó «id alfalfa_corte_verano».
- Paso 3: los indicadores de suelo se imprimen en el cuaderno.
- Paso 4: los plazos no se escriben; se revisan.
- PRUEBA: las 8 pruebas unitarias de `filtros.py` pasan a 8 comprobaciones sobre `opciones_b3.json`.

**Prueba de aceptación:** la del bloque (8 comprobaciones, la tabla opción × filtro y la tabla de plazos). Además: la lista «sin id», vacía o enviada a Cristian.

**Plan B:** el kit no trae uno para B3. Si falta el maestro §5.2, avise de inmediato a Cristian (R1): sin opciones con fuente, el motor sigue con `data/opciones_b4.json` (ACTUAL + 2 alternativas, kit B4), rotulado [S].

**Líneas de LEEME.md:**
```text
opciones_b3.json | Opciones por cultivo actual (id de rotaciones.json) y filtros duros con motivo y fuente: maestro §5.2, INIFAP 2017, SDR Chihuahua 2026, NOM-026, Silva-Rojas et al. 2009, archivo 29 y heladas.json (kit B3). Nota no validada: sustituye a data/opciones_b4.json | 2026-11-14 | colab/B3_opciones.ipynb
fuentes_B3.csv | Fuentes de B3: rotaciones.json y heladas.json de Raiz_entregas y documentos citados (copia en Raiz/cuadernos/, con sha256) | 2026-11-14 | colab/B3_opciones.ipynb
```
Aviso: `ENTREGA: opciones_b3.json — prueba OK (nota no validada; para Cristian)`.

---

## Propuesta de supuestos (`propuesta_supuestos.md`)

**Para qué:** varios valores del cálculo son supuestos sin fuente. El que más pesa es la **eficiencia parcelaria**, hoy 0.45–0.70 [S] sin valor medido en el DR-005: por ella la lámina del modelo sale bastante más alta que la del INIFAP (vea la [pregunta de las mentorías en P4](P4_clima_demanda.md#pregunta-para-las-mentorías-de-las-1600-y-las-1700)). Usted busca **fuentes** para esos valores y las propone en una nota corta. **No entrega `supuestos.json`**: su dueña es la sesión de datos, y Cristian decide qué se cambia.

| | |
|---|---|
| **Qué valores** | En este orden: (1) rango de eficiencia parcelaria; (2) eficiencia de goteo (`data/params.json` → `eficiencia.goteo`, hoy null; la usa La gota, X3.1); (3) todo lo que en `rotaciones.json` → `params` o en `data/params.json` tenga etiqueta [S] o «assumption» |
| **Entradas** | `rotaciones.json` (llave `params`: cada supuesto con su valor, fuente y etiqueta) de `Raiz_entregas`; `data/params.json` del repo; los documentos con fuente que encuentre (con su página); las respuestas de las mentorías de las 16:00 y las 17:00 (P4 o P6 se las pasan) |
| **Herramienta** | Colab con Gemini, o Gemini o Claude en el navegador para buscar y leer las fuentes ([herramientas.md](herramientas.md)) |
| **Hora límite** | Primera versión sáb 14:30, para que Cristian la lleve a las mentorías. Se actualiza con las respuestas de las mentorías (sáb, antes de las 18:00) |

**Formato** (Markdown; una tabla y, si hace falta, notas debajo). Lleva la línea `<!-- AI-assisted (Gemini) — ROOT, NASA Space Apps 2026 -->` al inicio:

| clave | valor actual (archivo) | valor propuesto | fuente (documento, página o URL, fecha de consulta) | etiqueta | nota |
|---|---|---|---|---|---|

- **valor actual:** cópielo del archivo, con el nombre del archivo.
- **valor propuesto:** solo si hay fuente. Si no la encontró, escriba «sin fuente encontrada» y deje el valor actual.
- **etiqueta:** [V] fuente primaria; [P] prensa o fuente secundaria; [S] supuesto.
- Una respuesta de mentoría se cita con el cargo (sin nombre), la fecha y la hora.

**Bloque para pegar en Gemini o Claude:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P5 Dotaciones, plazos y rotaciones.

ENTORNO
Google Colab (Python 3) con Google Drive montado en /content/drive, o un chat en el navegador. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están rotaciones.json y los demás archivos de la sesión de datos; los leo y NO los modifico. Ahí guardo mi nota.
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y copias de los documentos que cito.
Earth Engine NO se usa.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo valor propuesto sale de un documento que te pego o que abro yo, con su página o URL y su fecha de consulta. Si no hay fuente, escribe "sin fuente encontrada". Nunca uses un valor "típico" o de memoria.
2. Si usas Colab: celdas cortas, una por paso, con comentarios en español; la primera celda empieza con: # AI-assisted (Gemini) — ROOT, NASA Space Apps 2026
3. Escribe ÚNICAMENTE propuesta_supuestos.md en Raiz_entregas/. NUNCA escribas supuestos.json ni rotaciones.json: son de la sesión de datos.
4. Al final imprime la PRUEBA DE ACEPTACIÓN.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica.
7. Bibliotecas: json y pandas, si hace falta.
8. Al terminar, explica en español claro qué valores tienen fuente nueva y cuáles siguen sin fuente.
9. No hace falta fuentes_<pieza>.csv: la nota cita sus fuentes en la tabla. Guarda en Raiz/cuadernos/ una copia (.txt o PDF) de cada documento citado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe la línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; sin el carácter "|" dentro de un campo). Si usas Colab, dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w".

ESQUEMA DE SALIDA DE ESTA TAREA
propuesta_supuestos.md (nota no validada; la lee Cristian). Primera línea: <!-- AI-assisted (Gemini) — ROOT, NASA Space Apps 2026 -->. Después, una tabla Markdown con las columnas: clave | valor actual (archivo) | valor propuesto | fuente (documento, página o URL, fecha de consulta) | etiqueta | nota. Debajo, si hace falta, notas cortas.

DOCUMENTOS DE REFERENCIA (pegados)
Kit v4, A5 paso 3 (copiado tal cual):
EFICIENCIA PARCELARIA: no existe un valor medido para el DR-005. Trátela como PARÁMETRO DE ESCENARIO: lea su rango de supuestos.json, donde el equipo lo declara como "assumption" con su justificación. No escriba un valor "típico" de memoria; si el rango no está declarado, deténgase y notifíquelo.
Etiquetas del kit v4 (copiadas tal cual):
> **Etiquetas:** [V] verificado en fuente primaria; [P] prensa o fuente secundaria; [S] supuesto declarado; [NE] no encontrado.
[PEGA AQUÍ la llave "params" de rotaciones.json (Raiz_entregas/) o pide que la lea.]
[PEGA AQUÍ el bloque "eficiencia" de data/params.json (GitHub del proyecto).]
[PEGA AQUÍ los documentos con fuente que encontraste (texto y página), y las respuestas de las mentorías si ya las tienes.]

TAREA
1) Lista los supuestos: cada entrada de rotaciones.json → params y de data/params.json cuya etiqueta contenga [S] o "assumption", o cuyo valor sea null, con su valor actual y el archivo de donde sale. Pon primero la eficiencia parcelaria y la eficiencia de goteo.
2) Para cada uno, busca en los documentos pegados un valor con fuente. Si lo hay, propónlo con la cita exacta (documento, página o URL, fecha de consulta) y su etiqueta. Si no, "sin fuente encontrada".
3) Si te pego respuestas de las mentorías, agrégalas como fuente con el cargo (sin nombre), la fecha y la hora.
4) Escribe propuesta_supuestos.md con el formato del ESQUEMA DE SALIDA.
PRUEBA: (a) la eficiencia parcelaria y la de goteo están en la tabla; (b) ninguna fila con valor propuesto sin fuente; (c) ningún valor propuesto que no aparezca en un documento pegado; (d) número de supuestos con fuente nueva y número sin fuente.
```

**Prueba de aceptación:** la (a)–(d) del bloque.

**Plan B:** si no encuentra fuentes, entregue la tabla con «sin fuente encontrada»: sirve igual para que Cristian sepa qué preguntar en las mentorías.

**Línea de LEEME.md:**
```text
propuesta_supuestos.md | Propuesta de valores con fuente para los supuestos [S] de rotaciones.json y data/params.json (eficiencia parcelaria, goteo y demás); respuestas de las mentorías. Nota no validada para Cristian | 2026-11-14 | docs/equipo/P5_dotaciones_rotaciones.md (bloque propuesta de supuestos)
```
Aviso: `ENTREGA: propuesta_supuestos.md — nota para Cristian`.

---

## Tabla única de cifras (`cifras.csv`)

**El kit no trae un prompt para esta pieza.** El bloque se arma con:
- la fila de la tabla 0.4-B;
- el kit §0.2 (`manifest.json` con fuente, fecha y script de cada cifra);
- Q2 («la página, el video, el póster y la ficha impresa coinciden con `cifras.csv` y `manifest.json`»);
- C6 («cada cifra con su fuente»).

| | |
|---|---|
| **Entradas** | S8 §2; S9 §2 y §5; `data/params.json`; `dotaciones.json` (suyo); las entregas de `Raiz_entregas`, a medida que llegan (de la sesión de datos y del equipo) |
| **Cuaderno** | `cifras.ipynb` en `Raiz/cuadernos/`, o una hoja de cálculo exportada a CSV |
| **Hora límite** | Primera versión entre sáb 15:00 y 18:00. Se actualiza en cada revisión. Revisión de cifras, dom 12:30 (Q2) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P5 Dotaciones, plazos y rotaciones.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos y los del equipo; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el navegador del integrador).

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — ROOT, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). No sobrescribas archivos de otras personas ni de la sesión de datos.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize.
7. Usa bibliotecas comunes (pandas, json). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_CIFRAS.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_CIFRAS.csv), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| Tabla única de cifras (P5) | `cifras.csv` | clave, valor, unidad, fuente, fecha, etiqueta |
LO QUE ACEPTA EL VALIDADOR (motor/esquemas.py): clave (texto, única, sin acentos ni espacios; por ejemplo boquilla_namo_hm3); valor (texto, nunca vacío); unidad (texto o vacío); fuente (texto, nunca vacío); fecha (AAAA-MM-DD o vacío; de publicación o de consulta); etiqueta (texto, nunca vacío: [V], [P], [S], [NE], Cálculo, Diseño o Definición).

DOCUMENTOS DE REFERENCIA (pegados)
Etiquetas del kit v4 (copiadas tal cual):
> **Etiquetas:** [V] verificado en fuente primaria; [P] prensa o fuente secundaria; [S] supuesto declarado; [NE] no encontrado.
S9 §2 "El problema, con cifras" (copiado tal cual):
- En el DR-005 Delicias (73,002 ha; 8,113 productores [V]) se decide qué sembrar antes de conocer el agua de la presa.
- La alfalfa y el nogal sumaban 39,421 de 62,219 ha sembradas en 2016-17: 63 % [V, Conagua; cálculo]. Son cultivos perennes.
- En 2025 el distrito no recibió agua de las presas: se sembraron entre 12,000 y 15,000 ha con pozos y se autorizaron 87.4 hm³ de agua subterránea para riegos de supervivencia, sobre todo de nogal [P].
- La Boquilla inició el ciclo 2026 al 38 % y el 9-nov-2026 tenía 825.577 hm³, menos de un tercio de su capacidad [P]. Para 2027 se prevé autorizar cerca de una cuarta parte de la superficie [P; previsión, no autorización].
- El acuífero 0831 tiene una disponibilidad de −167.12 hm³ al año (déficit oficial de Conagua, no una pérdida medida) y 83.3 % de su recarga viene de los retornos del riego [V].
- **Mecanismo que explica el proyecto:** un cultivo anual puede dejar de sembrarse en un año seco; un perenne no. Su agua queda comprometida por años y, cuando la presa no alcanza, sale del acuífero.
S8 §2 "Cifras" (copiado tal cual):
| Dato | Valor | Fuente | Etiqueta |
|---|---|---|---|
| La Boquilla al 9-nov-2026 | 825.577 hm³; menos de un tercio de su capacidad | Impacto Noticias, 9-nov-2026, con el reporte diario de Conagua | [P] |
| Francisco I. Madero al 9-nov-2026 | 180.785 hm³; 53.6 % de 333.32 hm³ | Ídem | [P] |
| Ciclo 2027 | Un representante de los usuarios estimó que solo podría autorizarse una cuarta parte de la superficie. Es previsión, no autorización; decide Conagua en diciembre | Quadratín Chihuahua, 31-oct-2026 | [P] |
| Dotación por hectárea | Año normal: 9–10 millares/ha; 2026: 3–4 millares/ha | El Diario de Chihuahua, 27-jul-2026 | [P], por confirmar |
| Dotación 2025 en el Módulo 4 | 1 millar/ha desde pozos | El Diario de Chihuahua, 28-oct-2024 | [P] |
| Cálculo propio | Con 3–4 millares/ha la presa cubre 30–40 cm: 17–24 % de la lámina anual de la alfalfa (170–180 cm, INIFAP) y 44–59 % de la del algodón (≈68 cm) | Cifras [V] y [P] | Cálculo |
[PEGA AQUÍ data/params.json completo (GitHub del proyecto).]

TAREA
Tarea cifras. Arma cifras.csv con UNA fila por cada cifra que puede aparecer en la página, la interfaz, el video, el póster o la ficha impresa: las de S9 §2, S8 §2 y data/params.json que te pegué. Cada fila con clave, valor (tal como lo da la fuente, sin redondear), unidad, fuente (documento y sección, o URL), fecha y etiqueta. No agregues ninguna cifra que no esté en lo pegado o en una entrega. Si dos documentos dan valores distintos, pon las dos filas y avísame. Agrega también las cifras de las entregas de Raiz_entregas/ que se verán en la página, leídas del archivo (por ejemplo: número de parcelas y hectáreas de parcelas_base.geojson; periodo de eto_diaria.csv; tormenta de referencia de relieve_meta.json, llave tormenta, con su definición, fuente y periodo), con la fuente "<archivo> (entrega de <la sesión de datos o el rol>)". Cuando lleguen resultados (resultado_H1.md, resultado_H3.md, olofsson.csv, tabla_metodos.csv, et_contraste.csv), agrega sus cifras igual.
PRUEBA: (a) ninguna clave repetida; (b) ninguna fila sin fuente ni etiqueta; (c) lista de las cifras de S9 §2 y S8 §2 que NO están en la tabla (debe quedar vacía); (d) número de filas por etiqueta.
```

**Prueba de aceptación:**
- la (a)–(d) del bloque;
- el dom a las 12:30, cada cifra de la página, el video, el póster y la ficha impresa está en `cifras.csv` con su fuente (Q2).

**Plan B:** si no da tiempo de cubrir todo, cubra primero las cifras que se ven en la demo y en el video (S10 §4: una parcela real que cuente la historia completa).

**Líneas de LEEME.md:**
```text
cifras.csv | S8 §2, S9 §2 y §5, data/params.json y entregas de Raiz_entregas; cada fila con su fuente y etiqueta | 2026-11-14 | colab/cifras.ipynb
fuentes_CIFRAS.csv | Fuentes de cifras.csv: documentos citados y archivos de Raiz_entregas (sha256) | 2026-11-14 | colab/cifras.ipynb
```
Aviso: `ENTREGA: cifras.csv — prueba OK`.

---

## B2-cal · Calibración (solo si el preregistro la declara)

**El kit no trae un prompt:** la tabla 0.4-B dice «Solo si el preregistro la declara».
- Pida a Cristian el texto del preregistro (archivo 30).
- Si no declara calibración, esta pieza **no se hace** y no hay archivo.

```text
CONTEXTO
Trabajo en ROOT – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Orbital Farming, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P5 Dotaciones, plazos y rotaciones.

ENTORNO
Google Colab (Python 3), con Google Drive montado en /content/drive. Carpetas:
- /content/drive/MyDrive/Raiz_entregas/ = el buzón: UNA carpeta plana (sin subcarpetas) con LEEME.md, una línea por archivo. Ahí están los archivos que ya entregó la sesión de datos; los leo directo de ahí y NO los modifico. Ahí guardo mis entregas.
- /content/drive/MyDrive/Raiz/entradas/ = datos de solo lectura;
- /content/drive/MyDrive/Raiz/cuadernos/ = cuadernos y archivos de trabajo.
Earth Engine NO se usa: lo corre solo la sesión de datos (Claude en el navegador del integrador).

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de Raiz_entregas/ o de Raiz/entradas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — ROOT, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en Raiz_entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). No sobrescribas archivos de otras personas ni de la sesión de datos.
4. Al final imprime:
   (a) la PRUEBA DE ACEPTACIÓN de la tarea;
   (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
5. Si un paso falla dos veces con el mismo error, detente y explícame el problema en 5 líneas antes de seguir.
6. Earth Engine: no aplica. No uses ee.Authenticate ni ee.Initialize.
7. Usa bibliotecas comunes (pandas, numpy). Si necesitas instalar algo, dime el comando y por qué.
8. Al terminar, explica en español claro:
   - los 3 pasos clave;
   - los supuestos;
   - de dónde sale cada número;
   - qué podría estar mal.
9. Guarda también fuentes_B2CAL.csv en Raiz_entregas/ con: archivo, url_o_api, fecha_consulta (AAAA-MM-DD) y sha256 de cada dato de origen utilizado. Ninguna celda vacía.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en Raiz_entregas/ (también fuentes_B2CAL.csv), su línea para Raiz_entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb; sin el carácter "|" dentro de un campo). Dame una celda que la AGREGUE al final de LEEME.md con open(ruta, "a"), nunca con "w". Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| B2-cal (P5) | `calibracion.csv` | Solo si el preregistro la declara |
Columnas: las que fije el preregistro (el validador acepta columnas libres).

DOCUMENTOS DE REFERENCIA (pegados)
[PEGA AQUÍ el párrafo del preregistro (archivo 30) que declara la calibración. Sin él, no se hace.]

TAREA
Sigue EXACTAMENTE el procedimiento de calibración del párrafo pegado, sin cambiar criterio ni periodo, y guarda calibracion.csv en Raiz_entregas/ con las columnas que ahí se indican.
PRUEBA: imprime cómo se cumple cada punto del procedimiento del preregistro, uno por uno.
```
- **Hora límite:** antes de que A6 (P4) la necesite: sáb 18:00 (arranque de A6, kit §3).
- **Prueba de aceptación:** la del preregistro.
- **Plan B:** no se hace, y se dice.

**Líneas de LEEME.md:**
```text
calibracion.csv | Preregistro H1 (archivo 30), procedimiento de calibración | 2026-11-14 | colab/B2_dotaciones.ipynb
fuentes_B2CAL.csv | Fuentes de B2-cal: archivos citados por el preregistro (sha256) | 2026-11-14 | colab/B2_dotaciones.ipynb
```
