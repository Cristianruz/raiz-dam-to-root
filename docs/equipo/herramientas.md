<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Herramientas: qué usar en cada rol

**Regla de oro** (kit §9): la IA escribe código y borradores; **los números salen de los datos y la decisión es del agricultor**. Toda herramienta de IA que use queda anotada en la hoja AI_USAGE (§5).

## 1. Qué usa cada quien

| Rol | Herramienta principal | Para qué | Qué no hace con ella |
|---|---|---|---|
| P2, P3, P4, P5 | **Gemini en Google Colab**, con el bloque de su guía (G0 ya completado + prompt de la pieza) | Escribir y correr el cuaderno, una celda por paso; la prueba de aceptación; la verificación de datos | No se autentica en Earth Engine (decisión a). No escribe fuera de `Raiz_entregas`. No rehace lo que ya entregó la sesión de datos. No pide cifras «típicas» |
| P2 a P5 (revisión) | **App de Gemini, en un chat nuevo**, con `docs/prompts/para_gemini.md` | Revisión con contexto nuevo del cuaderno y la tabla antes de entregar. Quien escribió no se revisa a sí mismo | No reescribe el cuaderno: solo señala problemas |
| P6 | **App de Gemini o Claude en el navegador** | Textos de interfaz, plantillas, WhatsApp, página, guion del video y People's Choice, con el bloque de [P6](P6_textos_pagina.md) | No escribe cifras: usa marcadores. No usa logotipos de NASA |
| Todos | **Claude en el navegador** (claude.ai o la extensión de Claude para Chrome) | Leer documentación y catálogos: completar lo que [verificar_datos_nasa.md](verificar_datos_nasa.md) marca «por verificar en el catálogo». Revisar textos en inglés. Explicar un error | No lo use en el navegador del integrador: ahí corre la sesión de datos (Earth Engine) y no se toca. No le pegue datos personales de nadie |
| Todos | **NotebookLM** | Estudio y búsqueda de fuentes: cargue S9, S8, S10 y el kit, y pregúntele por una regla o por de dónde sale una cifra. Sigue vigente la sección 9 del kit 23 (kit v4 §10: «Sigue vigente del kit 23»). El kit 23 no está en el repo: pídalo a Cristian | Ninguna cifra sale de NotebookLM sin ir a la fuente original |
| Cristian (y quien use Claude Code) | **Claude Code** en el repo | Integración, motor, web, pruebas y commits (kit §0.3) | — |

## 2. Gemini en Colab, paso a paso

1. **Abrir:** Colab → Archivo → Cuaderno nuevo, con el nombre que indica su guía (por ejemplo, `A2_heladas.ipynb`).
2. **Montar Drive:** en la primera celda, `from google.colab import drive; drive.mount('/content/drive')`. El buzón es `/content/drive/MyDrive/Raiz_entregas/` (si se lo compartieron, agregue antes un acceso directo en «Mi unidad»; [README §4](README.md#4-flujo-de-trabajo-de-una-pieza)). Los cuadernos van a `/content/drive/MyDrive/Raiz/cuadernos/`.
3. **Leer los datos ya entregados:** los archivos de la sesión de datos (CSV, GeoJSON y GeoTIFF) se abren **directo** desde `Raiz_entregas`, con pandas, geopandas o rasterio. No los copie ni los modifique.
4. **Pegar el bloque:** abra el panel de Gemini y pegue el «Bloque para pegar en Gemini» de su pieza. Si el bloque dice `[PEGA AQUÍ …]`, sustitúyalo por ese texto.
5. **Una celda por paso:** pídalas de una en una. Ejecute cada celda y escriba «listo» antes de pedir la siguiente (G0, regla 2).
6. **Si algo falla dos veces con el mismo error:** pegue **R1** ([README §9](README.md#9-si-algo-falla-r1-después-de-cada-pieza-r2)). Si falla tres veces, se aplica el plan B de la pieza.
7. **Al final:**
   - prueba de aceptación y verificación de esquema;
   - el prompt de su dato en [verificar_datos_nasa.md](verificar_datos_nasa.md);
   - la revisión de `docs/prompts/para_gemini.md`, en un chat nuevo.
8. **Entregar:**
   - los archivos en `Raiz_entregas`, con su línea **al final** de `Raiz_entregas/LEEME.md` (modo «añadir», nunca «escribir»);
   - el cuaderno en `Raiz/cuadernos/`;
   - el aviso `ENTREGA: <archivo> — prueba OK`;
   - después, **R2**.

**Bibliotecas** (G0, regla 7): `pandas`, `numpy`, `requests`, `geopandas`, `matplotlib` y `scikit-learn` (ya vienen en Colab). Para leer los GeoTIFF de `Raiz_entregas` (P2), Gemini le dirá si hay que instalar `rasterio` y con qué comando.

## 3. Claude en el navegador

**Úselo para:**
- **Verificar en el catálogo** lo que la máquina de construcción no pudo abrir el 14-nov. Por ejemplo:
  - el diccionario de parámetros y unidades de NASA POWER;
  - la ficha de Fields of The World en Source Cooperative;
  - la cita de WaPOR v3;
  - el portal del SIH.

  Pídale que cite la página y copie el texto tal cual, y anote la URL y la fecha en su `fuentes_<pieza>.csv`.
- **Revisar textos** en inglés (P6): claridad y palabras prohibidas. Use la autoverificación de [P6](P6_textos_pagina.md#reglas-de-lenguaje-valen-para-todo-lo-que-escribe).
- **Entender un error** de Colab: pegue el error y pida R1.

**No lo use para:**
- inventar o «recordar» cifras, fechas de siembra, Kc o eficiencias: si no hay documento, la cifra va en null y se avisa (G0, regla 1);
- correr Earth Engine (decisión a: solo la sesión de datos);
- tocar la sesión de Claude que corre en el navegador del integrador.

## 4. Para quien use Claude Code (Cristian y quien lo apoye)

- **Skills:** [`.claude/skills/`](../../.claude/skills/). Su [README](../../.claude/skills/README.md) explica cada una: origen, licencia, para qué sirve en ROOT y riesgos revisados. Otra pieza las está instalando ahora.
- **Agentes:** [`.claude/agents/`](../../.claude/agents/). Su [README](../../.claude/agents/README.md) explica cada uno y cuándo se usa (revisión de contrato, de cifras y de código).
- **Protocolo de revisión de cada pieza:** [`docs/prompts/README.md`](../prompts/README.md). El ciclo es implementador → revisor con contexto nuevo → corrección, con máximo 3 rondas.
- **Prompt de revisión para Gemini** (lo usan P2 a P5): [`docs/prompts/para_gemini.md`](../prompts/para_gemini.md). Ese archivo todavía nombra la carpeta vieja por rol: manda la carpeta plana `Raiz_entregas` (decisión b).
- **Reglas para la IA:** [`CLAUDE.md`](../../CLAUDE.md). Earth Engine no se escribe en este repo: lo corre la sesión de datos (rama `datos-satelite`).

## 5. Registro de IA (hoja AI_USAGE)

Cada persona anota en la **hoja compartida «AI_USAGE»** qué pidió, con qué herramienta y qué archivos salieron (kit §0.1, regla 9). Cristian la exporta a [`AI_USAGE.md`](../../AI_USAGE.md), que tiene estas columnas:

| fecha | persona | herramienta | tarea | archivos |
|---|---|---|---|---|
| 2026-11-14 | P4 | Gemini en Colab | A2: heladas con `eto_diaria.csv` | `heladas.json`, `fuentes_A2.csv`, `A2_heladas.ipynb` |

- Una línea por tarea. Incluya también la revisión con Gemini, las consultas a Claude en el navegador y lo que se estudió con NotebookLM.
- Con este registro se llena la sección **"SI/AI tools used"** de la página (kit §9; S8, decisión 8).
- Si una imagen se generó con IA, lleva marca de agua visible y se declara (kit C7).
