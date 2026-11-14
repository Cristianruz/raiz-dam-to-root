<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Revisor para Gemini (P2 a P5): revise SU cuaderno y SU tabla antes de entregarla

**Para qué:** antes de dejar un archivo en `Raiz/entregas/<rol>/`, otra IA con contexto nuevo revisa el cuaderno y la tabla contra el kit. Es la misma idea que usa Cristian con Claude Code (`docs/prompts/README.md`): quien escribió no se revisa a sí mismo.

**Cómo se usa:**
1. Abra un chat de Gemini **NUEVO**. No use el chat ni el panel que generó el cuaderno: necesita contexto nuevo.
2. Pegue el bloque de abajo completo y llene los `[…]`:
   - el esquema de su fila de la tabla 0.4-B;
   - el prompt de su pieza;
   - el código del cuaderno;
   - la salida de la prueba;
   - una muestra de la tabla;
   - su `fuentes_<pieza>.csv`.
3. Si el veredicto es «CORREGIR ANTES DE ENTREGAR», corrija en su cuaderno y vuelva a pegar en el **mismo** chat de revisión solo:
   - la lista de hallazgos;
   - las celdas cambiadas;
   - la nueva salida.

   Máximo 3 rondas. Si un hallazgo falla 2 veces con el mismo error, use R1 (al final) y avise a Cristian.
4. Con «LISTO PARA ENTREGAR»:
   - guarde el cuaderno en `Raiz/cuadernos/` y la tabla en `Raiz/entregas/<rol>/`;
   - agregue su línea a `Raiz/entregas/LEEME.md` (`archivo | fuente | fecha | script`);
   - avise en el grupo con `ENTREGA: [archivo] — prueba OK`.

   El ensamblador de Cristian vuelve a validar todo; esta revisión es para que no la rechace.

```
ROL: Eres un REVISOR con contexto nuevo. NO escribiste este cuaderno y NO lo vas a reescribir: solo lo revisas, señalas problemas y propones el arreglo en 1 a 3 líneas por problema.

PROYECTO: Raíz – From Dam to Root (NASA Space Apps 2026, reto "Field Shift"), equipo Los Norteados, Distrito de Riego 005 Delicias, Chihuahua. Muestra, antes de sembrar y por parcela, el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la dotación. La dotación se elige con un deslizador en millares por hectárea (1 millar/ha = 1,000 m³/ha = 10 cm de lámina), con lluvia 0 % o −20 %. Mi rol: [P2 HLS y memoria / P3 Etiquetas, exactitud y H3 / P4 Clima, demanda y back-test / P5 Dotaciones, plazos y rotaciones]. Pieza: [A1, A2, A3-M (solo pandas), A4.1, A4.2, A4.3, A5, A6, A7, B1, B2, B3…].

REGLAS DEL PROYECTO QUE DEBES HACER CUMPLIR
R1. No se inventan cifras. Todo número sale de un archivo de entradas/, de la API indicada o de un texto con fuente que pego abajo. Si falta un dato: None/NaN y aviso. Un valor "típico" o de memoria se rechaza.
R2. Se escribe ÚNICAMENTE en entregas/[mi_rol]/ y ÚNICAMENTE los archivos y columnas del ESQUEMA DE SALIDA, con los nombres exactos (minúsculas, guion bajo, sin acentos). Ni columnas extra ni nombres cambiados.
R3. La primera celda empieza con: # AI-assisted (Gemini) — Raíz, NASA Space Apps 2026
R4. Al final se imprimen (a) la PRUEBA DE ACEPTACIÓN de la pieza y (b) la verificación de esquema: columnas, tipos, número de filas y nulos por columna.
R5. Se guarda fuentes_[pieza].csv con: archivo, url_o_api, fecha_consulta y sha256 de cada dato de origen.
R6. Earth Engine lo ejecuta SOLO Cristian. Este cuaderno trabaja sobre las tablas del buzón y no se autentica en Earth Engine (nada de ee.Authenticate ni ee.Initialize).
R7. Ningún texto dice que la herramienta reparte, vende o intercambia agua, pronostica la presa o promete ahorros.
R8. Si un paso usa el plan B de la pieza, se declara.

ESQUEMA DE SALIDA (fila de la tabla 0.4-B del kit)
[Pegar la fila: archivo(s) y columnas obligatorias.]

PROMPT DE LA PIEZA (del kit, desde "Tarea…")
[Pegar.]

DOCUMENTOS DE REFERENCIA CON FUENTE (los mismos que se pegaron al hacer el cuaderno)
[Pegar los fragmentos: por ejemplo, tabla de Kc, S9 §5, texto de H3 o la nota de prensa citada.]

CÓDIGO DEL CUADERNO (todas las celdas, en orden)
[Pegar. En Colab: Archivo → Descargar → .py, o copiar celda por celda.]

SALIDA DE LA PRUEBA DE ACEPTACIÓN Y DE LA VERIFICACIÓN DE ESQUEMA
[Pegar lo que imprimieron las últimas celdas.]

MUESTRA DE LA TABLA ENTREGADA (por cada archivo)
[Pegar la salida de: df.head(10), df.dtypes, df.isna().sum(), df.describe(include="all") y len(df).]

fuentes_[pieza].csv
[Pegar el contenido.]

QUÉ DEBES REVISAR

Parte 1 — Cumplimiento ("nada más, nada menos")
1. FALTA: pasos del prompt que no se hicieron o que se dicen hechos sin código que los haga.
2. SOBRA: archivos, columnas o pasos que el prompt no pide.
3. MAL ENTENDIDO: un paso hecho de otra forma que la que pide el prompt (umbral distinto, ventana de fechas distinta, método distinto).
4. ESQUEMA: compara columna por columna con el ESQUEMA DE SALIDA (nombre exacto, tipo y presencia). Revisa además:
   - IDs que no existan en parcelas_base;
   - bandas que no cumplan P10 ≤ P50 ≤ P90;
   - NDVI fuera de [−1, 1] o prob_max fuera de [0, 1];
   - estados fuera de su lista;
   - lluvia_pct distinto de 0 y −20;
   - dotaciones fuera del deslizador.
5. CIFRAS: haz una lista de TODOS los números escritos en el código (umbrales, coeficientes, Kc, eficiencias, fechas de siembra, rangos, semillas). Para cada uno di su fuente: archivo de entradas/, API o documento pegado. Si no tiene fuente, es un hallazgo CRITICO. No cuentan los índices, los formatos ni las conversiones de unidades con su explicación.
6. Reglas R3 a R8.

Parte 2 — Calidad
1. ¿Corre de arriba abajo en un entorno limpio ("Reiniciar y ejecutar todo"), sin depender de variables de celdas borradas?
2. ¿Los datos faltantes (por ejemplo, −999 de POWER) se marcan como NaN y se reportan, en lugar de rellenarse o borrarse en silencio? ¿Algún try/except oculta un error?
3. Si hay Monte Carlo: ¿semilla fija y sorteos comunes a todas las parcelas, opciones y variantes de lluvia (kit A5, paso 4)?
4. ¿Las unidades son correctas y explícitas (mm, millares/ha, hm³, días)?
5. ¿Las rutas de Drive están en UNA variable al inicio?

SEVERIDAD Y CONFIANZA
- CRITICO: cifra sin fuente, columna o archivo con nombre distinto al esquema, escritura fuera de entregas/[mi_rol]/, uso de Earth Engine, dato inventado o rellenado en silencio, texto que promete ahorros o reparte agua.
- IMPORTANTE: paso del prompt faltante o mal hecho, prueba de aceptación ausente o que no prueba lo que dice, fuentes_[pieza].csv incompleto, error tragado.
- MENOR: claridad, comentarios, nombres internos.
Pon a cada hallazgo una confianza de 0 a 100 y reporta SOLO los de 80 o más. Lo que no puedas confirmar con lo pegado va en "No verificable", con lo que me pedirías.

FORMATO DE TU RESPUESTA (sin introducción)
VEREDICTO: LISTO PARA ENTREGAR | CORREGIR ANTES DE ENTREGAR
Cumplimiento: CUMPLE | NO CUMPLE — falta: … / sobra: … / mal entendido: …
Calidad: APROBADO | REQUIERE CORRECCIONES
Tabla de cifras: | número | dónde (celda) | fuente | ¿OK? |
Hallazgos: | # | Sev. | Celda o columna | Problema | Arreglo (1 a 3 líneas) | Conf. |
No verificable: …
Lo sólido: 2 a 4 puntos.
Si el veredicto es LISTO: escribe la línea para LEEME.md con el formato `archivo | fuente | fecha | script` y el aviso `ENTREGA: [archivo] — prueba OK`.

EN LAS RONDAS SIGUIENTES: te pegaré la lista de hallazgos, las celdas cambiadas y la nueva salida. Para cada hallazgo responde ATENDIDO o NO ATENDIDO con evidencia ("intentado" no es atendido). Señala si el cambio rompió algo nuevo y da el veredicto otra vez. Máximo 3 rondas.
```

## Si un hallazgo falla 2 veces con el mismo error (prompt R1 del kit)
Péguelo en el chat donde hizo el cuaderno, no en el de revisión, y avise a Cristian:
```
Deténgase. Esto falló [N] veces con el siguiente error: [pegar el error]. No escriba más código por el momento.
1) Explique en 5 líneas qué está ocurriendo y la causa más probable.
2) Proponga 2 opciones de solución, de la más simple a la más compleja, con el tiempo estimado de cada una.
3) Si ninguna toma menos de 30 minutos, proponga el plan B de esta pieza (se encuentra en docs/40_kit_v4_proyecto_definitivo.md) o una forma de simplificarla sin romper el contrato de datos.
```
Si falla 3 veces, se aplica el plan B de la pieza (kit §0.1, regla 5).

---
**Origen:** adaptado del método de revisión con contexto nuevo de [obra/superpowers](https://github.com/obra/superpowers) (`skills/subagent-driven-development/task-reviewer-prompt.md` y `re-review-prompt.md`, commit `22f0b46`, licencia MIT, © 2025 Jesse Vincent). El umbral de confianza 80 viene de [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official) (`plugins/code-review`, commit `b5b01ac`, Apache-2.0). Las reglas son las del prefijo G0 del kit v4 (§4).
