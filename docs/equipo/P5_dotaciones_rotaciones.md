<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# P5 · Dotaciones, plazos, rotaciones y tabla única de cifras

**Qué le toca** (S9 §10; kit §3):
- las dotaciones en millares por hectárea (B2);
- las rotaciones, los filtros y los plazos (B3), con `supuestos.json`;
- la tabla única de cifras (`cifras.csv`);
- la verificación manual de las cifras del motor;
- la lista cifra → fuente para el envío.

**Lo que cambió hoy y manda sobre el kit** (detalle en [README §6](README.md#6-cambios-respecto-al-kit-mandan-sobre-el-kit)):
- **Entrega** en `Raiz/entregas/`, carpeta plana sin `P5/`, con una línea por archivo en `Raiz/entregas/LEEME.md`.
- **Usted no usa Earth Engine** (B2 y B3 no lo necesitan).
- **Código.** `filtros.py` va en `Raiz/entregas/`, como pide la tabla 0.4-B, pero el ensamblador no copia código: Cristian lo revisa y lo pasa al repo a mano (kit §0.1, regla 2).
- **`rotaciones.json` ya no es suyo** (acuerdo de formatos del 14-nov, [README §6, cambio e](README.md#6-cambios-respecto-al-kit-mandan-sobre-el-kit)). Es la salida de A5 y la entrega la sesión de datos, con otro formato (llaves `params`, `cultivos`, `rotaciones` y `anios_clima`, con la lámina de cada rotación). El motor del cubo lo necesita. **No escriba ningún archivo con ese nombre**: el validador rechazaría la estructura del kit B3 y, en la carpeta plana, podría pisar el de la sesión de datos. Sus opciones, filtros y fechas de siembra (B3) se entregan donde indique Cristian; vea [B3](#b3--rotaciones-filtros-duros-plazos-y-supuestosjson).
- **Antes de cada pieza, revise `Raiz/entregas/LEEME.md`.** Si el archivo ya tiene su línea (por ejemplo, porque la sesión de Chrome lo entregó), no lo rehaga: verifíquelo y avise a Cristian. Dos archivos con el mismo nombre se pisan.

| Orden | Pieza | Archivos que entrega (tabla 0.4-B) | Hora límite |
|---|---|---|---|
| 1 | [B2 · dotaciones](#b2--dotaciones-en-millares-por-hectárea) | `dotaciones.json`, `fuentes_B2.csv`; `historial_superficie.csv` solo si sobra tiempo | sáb 12:00 |
| 2 | [B3 · rotaciones, filtros, plazos y supuestos](#b3--rotaciones-filtros-duros-plazos-y-supuestosjson) | `filtros.py`, `supuestos.json`, `fuentes_B3.csv`. Las opciones de B3, donde indique Cristian (**no** como `rotaciones.json`; cambio e) | sáb 14:30. A5 (12:00–18:00) necesita `supuestos.json` y las opciones: entréguelos lo antes posible |
| 3 | [Tabla única de cifras](#tabla-única-de-cifras-cifrascsv) | `cifras.csv` | Primera versión, sáb 15:00–18:00; se actualiza hasta la revisión de cifras del dom 12:30 |
| 4 | [B2-cal](#b2-cal--calibración-solo-si-el-preregistro-la-declara) | `calibracion.csv` | Solo si el preregistro la declara |
| — | Revisiones sin archivo propio | Revisa B4; verificación manual de las cifras del motor (sáb 18:00–20:30); plazos y estados (sáb 20:30–1:00); revisión de cifras (dom hasta 8:00); lista cifra → fuente (dom 8:00–11:00) | Kit §3 |

**Cómo se usa cada bloque:**
1. Abra un cuaderno en Colab y monte Drive.
2. Pegue el bloque en Gemini y pida **una celda por paso**.
3. Corra la prueba y pida la revisión de `docs/prompts/para_gemini.md` con contexto nuevo.
4. Guarde en `Raiz/entregas/` con su línea en `LEEME.md` y avise: `ENTREGA: <archivo> — prueba OK`.

El flujo completo está en [README §4](README.md#4-flujo-de-trabajo-de-una-pieza).

---

## B2 · Dotaciones en millares por hectárea

| | |
|---|---|
| **Entradas** | Las notas de prensa citadas (S8 §2), abiertas en el navegador si es posible, con su fecha de lectura; el paso del deslizador, que se acuerda con Cristian (está en `data/params.json` → `dotaciones.deslizador`, como valor de diseño); `Raiz/entradas/` para el último almacenamiento de La Boquilla |
| **Cuaderno** | `B2_dotaciones.ipynb` en `Raiz/cuadernos/` |
| **Hora límite** | Sáb 12:00 (kit §3, primer bloque) |
| **Después de la mentoría** (16:00 y 17:00) | Si un técnico confirma o corrige el punto de medición o las cifras, P6 se lo pasa. Usted actualiza `dotaciones.json` y la fecha de su línea en `LEEME.md` (kit B2, paso 2) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P5 Dotaciones, plazos y rotaciones.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
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
9. Guarda también fuentes_B2.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_B2.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

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
Además: fuentes_B2.csv (archivo, url_o_api, fecha_consulta, sha256). Ninguna celda puede quedar vacía: el validador rechaza el archivo si falta un sha256. Para una nota de prensa: guarda una copia en cuadernos/ (el texto de la nota en .txt o la página en PDF) y escribe la URL, la fecha de lectura y el sha256 de esa copia. Si la nota no se pudo abrir, la fuente que usaste es el texto pegado de S8 §2: guárdalo en cuadernos/ como .txt y registra su sha256, con "S8 §2 (nota no leída directamente)" en url_o_api. Si no hay copia que guardar, NO pongas la fila con el sha256 vacío: detente y avísame para avisar a Cristian. Cada marca debe quedar dentro del deslizador.

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
1) Escriba dotaciones.json (en Raiz/entregas/) con el bloque "dotaciones" del contrato (sección 2.3):
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
5) SOLO SI SOBRA TIEMPO (S9 §8): historial de superficie regada del DR-005 con la serie de Conagua de Raiz/entradas/ (superficie regada y volumen distribuido por año agrícola), como gráfica de contexto. Declare qué fuentes suma el volumen distribuido (La Boquilla, Francisco I. Madero, pozos) y no use la caída de almacenamiento como si fuera extracción. Entregue historial_superficie.csv en Raiz/entregas/.

PRUEBA:
- tabla de las 3 marcas con rango, valor, fuente, fecha y etiqueta;
- la comprobación de escala reproduce 2.0, 5.1 y 6.4 ha;
- verificación de esquema de dotaciones.json contra el contrato.
Explique en 4 líneas qué es un millar y por qué la dotación se muestra como un rango y no como un dato oficial.
```

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «En motor/B2_dotaciones.ipynb.» → «En B2_dotaciones.ipynb (Raiz/cuadernos/).»
- «1) Escriba dotaciones.json con el bloque» → «1) Escriba dotaciones.json (en Raiz/entregas/) con el bloque»
- «del último dato disponible en data/raw.» → «del último dato disponible en Raiz/entradas/.»
- «con la serie de Conagua de data/raw (» → «con la serie de Conagua de Raiz/entradas/ (»
- «Entregue historial_superficie.csv.» → «Entregue historial_superficie.csv en Raiz/entregas/.»

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

## B3 · Rotaciones, filtros duros, plazos y `supuestos.json`

| | |
|---|---|
| **Entradas** | `heladas.json` (P4, A2) |
| **Documentos que no están en el repo (pídalos a Cristian)** | Maestro §5.2 (opciones ACTUAL, A–E y «nogal no rota», con filtros duros); INIFAP 2017; SDR Chihuahua 2026; archivo 29, §4 (FAO-29, Tabla 4) y §5 (plazos de etiqueta de la atrazina); Silva-Rojas et al. 2009 |
| **Cuaderno** | `B3_rotaciones.ipynb` en `Raiz/cuadernos/` (el kit no le da nombre) |
| **Hora límite** | Sáb 14:30; `supuestos.json`, entre las 12:00 y las 14:30 (kit §3). A5 lo necesita: entregue primero lo que pide A5 |

**`rotaciones.json` cambió de dueño (acuerdo de formatos del 14-nov, cambio e).**
- La tabla 0.4-B le pedía crear `rotaciones.json` con la estructura del prompt B3. **Eso ya no aplica.** Ese nombre es ahora la salida de A5: la entrega la sesión de datos, con las llaves `params`, `cultivos`, `rotaciones` y `anios_clima` y la lámina bruta de cada rotación en millares. El motor del cubo (`motor/b4_cubo.py`) lo exige. Según el validador (`motor/esquemas.py`), «sustituye a la lista opciones del kit B3».
- **No guarde ningún archivo llamado `rotaciones.json`.** El validador rechaza la estructura del kit B3 («falta la llave params / cultivos / rotaciones / anios_clima») y, en la carpeta plana, su archivo podría pisar el de la sesión de datos.
- **Sus opciones, filtros y fechas de siembra siguen haciendo falta.** Mientras no lleguen, el cubo usa un diseño provisional de Cristian (`data/opciones_b4.json`, marcado [S]): la opción ACTUAL más 2 alternativas por cultivo.
- **Dónde entregarlas:** donde indique Cristian; por ejemplo, para que la sesión de datos las incorpore a su `rotaciones.json`. **Si no hay indicación, deténgase en ese paso y avise.** Mientras tanto, guarde una copia de trabajo en `Raiz/cuadernos/B3_opciones.json`, que no pasa por el buzón. No invente otro nombre en `Raiz/entregas/`: el validador rechaza los nombres que no conoce.
- `filtros.py` y `supuestos.json` siguen igual: van a `Raiz/entregas/`.

**Lo que otras piezas leen de `supuestos.json`.** Cada valor lleva fuente o la marca «assumption». Si no hay fuente, se deja en `null` y se avisa (kit B3, paso 4). **Nunca se escribe de memoria.**

| Clave que piden | Quién la usa | Dónde lo dice |
|---|---|---|
| Plazos: anual, alfalfa, nogal (horizonte), alfalfa «por vencer» | B4 (Cristian) | kit B3, paso 4; tabla 0.4-B |
| Rango de eficiencia parcelaria | A5 (sesión de datos; P4 lo verifica) | kit A5, paso 3 |
| Eficiencia de goteo | X3.1 (Cristian) | kit B3, paso 4; X3.1 |
| Relación cobertura–Kc del nogal | A5 (sesión de datos; P4 lo verifica) | kit A5, paso 1; S8, decisión 5 |
| Cultivo representativo de `forraje_verano` (si las etiquetas lo usan) | A5 (sesión de datos; P4 lo verifica) | kit B3, paso 4; A5, paso 1 |
| Punto de medición del millar | B4 y web | tabla 0.4-B |
| Umbral de acumulación de las rutas de escurrimiento | A9 (P4) | kit A9, paso 3 |
| Umbral de «día con lluvia» para la tormenta P95 | A9 (P4) | Lo pide A9, paso 4; el kit no fija valor |
| Umbral de «viento alto» para `dias_desnudo_viento_alto` | A3 (P2) | Lo pide la tabla 0.4-B; el kit no define el umbral |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P5 Dotaciones, plazos y rotaciones.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
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
9. Guarda también fuentes_B3.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_B3.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Filas de la tabla 0.4-B del kit (copiadas tal cual):
| B3 (P5) | `rotaciones.json` y `filtros.py` (con sus 8 pruebas impresas) | Estructura del prompt B3, más la opción «no sembrar / rastrojo en pie» |
| Supuestos (P5) | `supuestos.json` | Valor o rango, fuente o «assumption». Incluye plazos, edad «por vencer», eficiencia parcelaria, eficiencia de goteo y punto de medición del millar |
CAMBIO ACORDADO EL 14-NOV (manda sobre la fila B3 de arriba): NO escribas ningún archivo llamado rotaciones.json. Ese nombre es ahora la salida de A5 y lo entrega otra sesión, con otro formato. Las opciones del paso 1 (secuencia, fechas de siembra, fuente, banderas e indicadores de suelo) guárdalas como archivo de trabajo en cuadernos/B3_opciones.json, que no pasa por el buzón, y avísame: Cristian dice dónde se entregan. En entregas/ van solo filtros.py, supuestos.json y fuentes_B3.csv.
Además: fuentes_B3.csv (archivo, url_o_api, fecha_consulta, sha256). Ninguna celda puede quedar vacía: el validador rechaza el archivo si falta un sha256. Para un documento que solo te pegué (maestro §5.2, archivo 29), guarda el texto pegado en cuadernos/ como .txt y registra su sha256; si no hay copia que guardar, no pongas la fila: detente y avísame. En supuestos.json, cada clave con: valor (o rango min/max, o null), unidad, fuente (o "assumption") y etiqueta ([V], [P], [S] o [NE]).

DOCUMENTOS DE REFERENCIA (pegados)
S9 §5, viñetas de plazo y estado (copiadas tal cual):
- **Plazo:** anual 1 año; alfalfa 3–4 años [P]; nogal, horizonte de cálculo de 10 años [S] (la vida de la huerta se cita con fuente INIFAP antes de publicarla).
- **Estado:** libre (anual o descanso); por vencer (alfalfa con 3 años o más [S]); comprometida (alfalfa joven o nogal).
Kit v4 §2.5, filas de plazos (copiadas tal cual):
| `plazo.alfalfa` | 3–4 años | FIRA (S9 §4) | [P] |
| `plazo.nogal_horizonte` | 10 años de horizonte de cálculo. La vida de la huerta se cita con fuente INIFAP antes de publicarla | S9 §5 | [S] |
| `plazo.alfalfa_por_vencer` | 3 años o más | S9 §5 | [S] |
[PEGA AQUÍ maestro §5.2 completo (opciones y filtros duros), que te pasa Cristian.]
[PEGA AQUÍ archivo 29 §4 (FAO-29, Tabla 4) y §5 (plazos de etiqueta), que te pasa Cristian.]
[PEGA AQUÍ heladas.json (P4).]
[PEGA AQUÍ las demás claves que piden otras piezas (tabla de arriba), con la fuente de cada valor. Si no hay fuente, déjalo en null.]

TAREA
NOTA DEL EQUIPO: primero escribe supuestos.json con lo que A5 necesita (eficiencia parcelaria, relación cobertura–Kc del nogal, cultivo representativo de forraje_verano) y avísame para entregarlo. Después, las opciones (en cuadernos/B3_opciones.json, nunca como rotaciones.json; ver el CAMBIO ACORDADO) y filtros.py. Si un valor no tiene fuente en lo que pegué, va en null con aviso.
Tarea B3. Cree las opciones (en Raiz/cuadernos/B3_opciones.json; NO como rotaciones.json, cambio acordado el 14-nov), filtros.py (con pruebas) y supuestos.json; filtros.py y supuestos.json en Raiz/entregas/ (cuaderno B3_rotaciones.ipynb en Raiz/cuadernos/):
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

**Ajustes de ruta hechos al texto del kit en este bloque:**
- «Cree rotaciones.json, filtros.py (con pruebas) y supuestos.json:» → «Cree las opciones (en Raiz/cuadernos/B3_opciones.json; NO como rotaciones.json, cambio acordado el 14-nov), filtros.py (con pruebas) y supuestos.json; filtros.py y supuestos.json en Raiz/entregas/ (cuaderno B3_rotaciones.ipynb en Raiz/cuadernos/):» (rutas y cambio e)

**Prueba de aceptación** (kit B3):
```text
PRUEBA: pruebas unitarias simples (pytest o asserts) con 8 casos:
- chile tras chile = no pasa;
- alfalfa nueva lleva la bandera "advertir_si_rojo";
- y casos análogos para los demás filtros.
Imprima una tabla opción × filtro para una parcela de ejemplo y la tabla de plazos con fuente y etiqueta.
```

**Plan B:** el kit no trae uno para B3. Si falta el maestro §5.2, avise de inmediato a Cristian (R1): sin opciones no hay tarjetas. Lo mínimo del núcleo es ACTUAL + 2 alternativas por parcela (kit B4).

**Líneas de LEEME.md:**
```text
supuestos.json | Plazos (S9 §5; FIRA [P]); eficiencias, relación cobertura–Kc del nogal y umbrales con su fuente o "assumption" (kit B3, paso 4) | 2026-11-14 | colab/B3_rotaciones.ipynb
filtros.py | Filtros duros de maestro §5.2, INIFAP 2017, NOM-026, Silva-Rojas et al. 2009 y archivo 29, con 8 pruebas | 2026-11-14 | colab/B3_rotaciones.ipynb
fuentes_B3.csv | Fuentes de B3: heladas.json y documentos citados (URL o copia en cuadernos/, con sha256) | 2026-11-14 | colab/B3_rotaciones.ipynb
```
Las opciones (`B3_opciones.json`) no llevan línea: no están en el buzón. Cuando Cristian diga dónde van, la línea la escribe quien las entregue.

Aviso: `ENTREGA: supuestos.json — prueba OK` (primero) y `ENTREGA: filtros.py — prueba OK`. Para las opciones: `B3: opciones listas en Raiz/cuadernos/B3_opciones.json — ¿dónde las entrego?`.

---

## Tabla única de cifras (`cifras.csv`)

**El kit no trae un prompt para esta pieza.** El bloque se arma con:
- la fila de la tabla 0.4-B;
- el kit §0.2 (`manifest.json` con fuente, fecha y script de cada cifra);
- Q2 («la página, el video, el póster y la ficha impresa coinciden con `cifras.csv` y `manifest.json`»);
- C6 («cada cifra con su fuente»).

| | |
|---|---|
| **Entradas** | S8 §2; S9 §2 y §5; `data/params.json`; `dotaciones.json` y `supuestos.json` (sus entregas); las entregas de los demás, a medida que llegan |
| **Cuaderno** | `cifras.ipynb` en `Raiz/cuadernos/`, o una hoja de cálculo exportada a CSV |
| **Hora límite** | Primera versión entre sáb 15:00 y 18:00. Se actualiza en cada revisión. Revisión de cifras, dom 12:30 (Q2) |

**Bloque para pegar en Gemini:**
```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P5 Dotaciones, plazos y rotaciones.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
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
9. Guarda también fuentes_CIFRAS.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_CIFRAS.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| Tabla única de cifras (P5) | `cifras.csv` | clave, valor, unidad, fuente, fecha, etiqueta |
clave única, sin acentos ni espacios (por ejemplo, boquilla_namo_hm3); fecha en AAAA-MM-DD (de publicación o de consulta; vacía si no hay); etiqueta: [V], [P], [S], [NE], Cálculo, Diseño o Definición.

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
Tarea cifras. Arma cifras.csv con UNA fila por cada cifra que puede aparecer en la página, la interfaz, el video, el póster o la ficha impresa: las de S9 §2, S8 §2 y data/params.json que te pegué. Cada fila con clave, valor (tal como lo da la fuente, sin redondear), unidad, fuente (documento y sección, o URL), fecha y etiqueta. No agregues ninguna cifra que no esté en lo pegado. Si dos documentos dan valores distintos, pon las dos filas y avísame. Cuando lleguen entregas con resultados (resultado_H1.md, resultado_H3.md, olofsson.csv, tabla_metodos.csv, et_contraste.csv) o cifras sueltas de otra pieza (por ejemplo, la lámina de la tormenta P95 de A9, que está en relieve_meta.json, en tormenta.mm, con su definición, fuente y periodo), agrega sus cifras con la fuente "<archivo o pieza> (entrega de <rol>)".
PRUEBA: (a) ninguna clave repetida; (b) ninguna fila sin fuente ni etiqueta; (c) lista de las cifras de S9 §2 y S8 §2 que NO están en la tabla (debe quedar vacía); (d) número de filas por etiqueta.
```

**Prueba de aceptación:**
- la (a)–(d) del bloque;
- el dom a las 12:30, cada cifra de la página, el video, el póster y la ficha impresa está en `cifras.csv` con su fuente (Q2).

**Plan B:** si no da tiempo de cubrir todo, cubra primero las cifras que se ven en la demo y en el video (S10 §4: una parcela real que cuente la historia completa).

**Línea de LEEME.md:**
```text
cifras.csv | S8 §2, S9 §2 y §5, data/params.json y entregas del equipo; cada fila con su fuente y etiqueta | 2026-11-14 | colab/cifras.ipynb
```
Aviso: `ENTREGA: cifras.csv — prueba OK`.

---

## B2-cal · Calibración (solo si el preregistro la declara)

**El kit no trae un prompt:** la tabla 0.4-B dice «Solo si el preregistro la declara».
- Pida a Cristian el texto del preregistro (archivo 30).
- Si no declara calibración, esta pieza **no se hace** y no hay archivo.

```text
CONTEXTO
Trabajo en Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift: Adapting Farms with NASA Data"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua, México. El proyecto muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación de la presa. La dotación se elige con un deslizador de 0 a 12 millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Ya no hay escenarios "seco, normal y bueno". Mi rol: P5 Dotaciones, plazos y rotaciones.

ENTORNO
Google Colab (Python 3). Google Drive montado; carpeta /content/drive/MyDrive/Raiz/:
- entradas/ = datos de solo lectura;
- entregas/ = donde guardo resultados. Es UNA carpeta plana (sin subcarpetas por rol) y cada archivo lleva una línea en entregas/LEEME.md; ahí también están las entregas de los demás, que solo leo;
- cuadernos/ = cuadernos.
Earth Engine NO se usa en este cuaderno: lo corre otra sesión (Claude en el Chrome de Cristian, proyecto iondroplet), que deja sus exportaciones en Drive. Yo trabajo sobre esos archivos.

REGLAS OBLIGATORIAS
1. No inventes cifras. Todo número sale de un archivo de entradas/ o de entregas/, de la API indicada o del texto con fuente que te pego. Si falta un dato, usa None o NaN y avísame. Nunca uses un valor "típico" o de memoria.
2. Dame el código en celdas cortas, una por paso, con comentarios en español. Espera a que te diga "listo" antes de dar la siguiente. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
3. Escribe ÚNICAMENTE en entregas/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con esos nombres exactos (minúsculas, guion bajo, sin acentos). Solo si la TAREA lo pide expresamente, guarda un archivo de trabajo en cuadernos/ (por ejemplo, un JSON crudo o una nota de revisión). No escribas otros archivos, no cambies nombres de columnas y no sobrescribas archivos de otras personas. Los id de parcela son los de entregas/parcelas_base.geojson.
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
9. Guarda también fuentes_B2CAL.csv en entregas/ con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen utilizado.
10. La herramienta no reparte, vende ni intercambia agua, no pronostica la presa y no promete ahorros. No escribas textos que digan lo contrario.
11. Al final escribe, para CADA archivo que guardes en entregas/ (también fuentes_B2CAL.csv y las figuras), su línea para entregas/LEEME.md con el formato: archivo | fuente | fecha | script (fecha AAAA-MM-DD; script = colab/<nombre del cuaderno>.ipynb). Sin esa línea el archivo no entra.

ESQUEMA DE SALIDA DE ESTA TAREA
Fila de la tabla 0.4-B del kit (copiada tal cual):
| B2-cal (P5) | `calibracion.csv` | Solo si el preregistro la declara |
Columnas: las que fije el preregistro.

DOCUMENTOS DE REFERENCIA (pegados)
[PEGA AQUÍ el párrafo del preregistro (archivo 30) que declara la calibración. Sin él, no se hace.]

TAREA
Sigue EXACTAMENTE el procedimiento de calibración del párrafo pegado, sin cambiar criterio ni periodo, y guarda calibracion.csv con las columnas que ahí se indican.
PRUEBA: imprime cómo se cumple cada punto del procedimiento del preregistro, uno por uno.
```
- **Hora límite:** antes de que A6 (P4) la necesite, de modo que el back-test no se retrase: sáb 18:00 (arranque de A6, kit §3).
- **Prueba de aceptación:** la del preregistro.
- **Plan B:** no se hace, y se dice.

**Línea de LEEME.md:**
```text
calibracion.csv | Preregistro H1 (archivo 30), procedimiento de calibración | 2026-11-14 | colab/B2_dotaciones.ipynb
```
