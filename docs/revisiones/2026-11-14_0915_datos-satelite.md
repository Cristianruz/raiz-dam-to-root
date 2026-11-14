<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Revisión de la rama `datos-satelite` · 14-nov-2026, 9:15

**Qué se revisó:** los 7 commits de la sesión de datos sobre `main`:
- `datos/colab/`: A1, eto_fao56, B1, A3, A4, A5, A9 y su prueba.
- `datos/earthengine/A3_hls_nasadem.js`.

**Contra qué:**
- el kit v4: §0.3, tabla 0.4-B, A1, A3, A3-M, A4.2, A5, A9 y B1;
- S9 §5;
- `CLAUDE.md`;
- el acuerdo de entregas: Drive `Raiz/entregas/` con `LEEME.md`.

**Cómo se revisó:** un revisor de solo lectura, con contexto nuevo. Solo se reportan hallazgos con confianza ≥ 75.

**Prueba propia:** `python -m pytest -q datos/colab/test_eto_fao56.py` → **2 passed**.
- Ejemplo 8 (Ra): el código da 32.19; el manual, 32.2.
- Ejemplo 18 (ETo): el código da 3.88; el manual, 3.9.
- No se cubre la entrada `rh_media` que usa A1.

## Hallazgos

| Sev. | Archivo:línea | Problema | Arreglo | Conf. |
|---|---|---|---|---|
| CRÍTICO | A5_demanda_plazo.py:21-22 | Eficiencia parcelaria fija en [0.45, 0.70] («IMTA 55–60 %»), sin fuente en el repo; `params.json` la tiene en null | Leerla de `supuestos.json` y detenerse si falta (kit A5, paso 3) | 95 |
| CRÍTICO | A5:37-38 | El nogal usa el Kc fijo «stone fruit», que el kit deja solo como variante de sensibilidad. No hay Kc por cobertura del dosel ni se detiene si falta | Leer la relación cobertura–Kc de `supuestos.json` o detenerse (S8, decisión 5) | 95 |
| CRÍTICO | A3_parcelas_hls.py:85-86 | `sin_dato` se asigna con menos de 6 meses válidos; el kit pide menos de 8. Tampoco revisa la ventana vacía de verano o de invierno | Usar `< 8` y añadir la condición de ventana vacía (kit A3-M, paso 7) | 95 |
| CRÍTICO | A3:90-91 | `perenne` solo mira el año anterior; el kit dice «anterior o siguiente». El primer año de alfalfa no cuenta y la edad sale subestimada (afecta a `por_vencer`) | Clasificar en dos pasadas, mirando también el año siguiente | 95 |
| CRÍTICO | A4_cultivos_reglas.py:83 | La abstención ignora `ftw_confianza < 50` | Aplicar las 3 reglas de A4.2: prob < 0.6, métodos que no coinciden y FTW < 50 | 95 |
| IMPORTANTE | A4:57 | La clase `anual_verano` no está en la lista del contrato (§2.2) ni tiene opción en `rotaciones.json` | Usar `sin_clasificar` o una clase autorizada | 95 |
| IMPORTANTE | A4:22-24; A9:22 | Umbrales sin fuente: 0.35 y 0.30 (A4) y 50 ha de ruta (A9) | Declararlos con fuente o «assumption» en `supuestos.json` o `relieve_meta.json` | 85 |
| IMPORTANTE | A5:34-62 | Kc, etapas, siembras y rotaciones escritos de memoria (el archivo 27 y el maestro §5.2 no están en el repo). El corte de verano usa la suspensión ago–sep en lugar de la variante moderada de B3. «Bali 3–18 %» y «Delgado-Ramírez» no tienen fuente | Detenerse y pedir los documentos (`CLAUDE.md`) o marcar cada valor como supuesto con fuente | 85 |
| IMPORTANTE | A5:172-184 | Un mismo generador aleatorio secuencial da sorteos distintos a cada variante y rotación (ejemplo: `cereal_invierno` con −20 % da P50 6.15 frente a 6.22 sin cambio) | Sortear una vez las N tuplas (año, sesgo, eficiencia, presiembra) y reutilizarlas en todo (kit A5, paso 4) | 90 |
| IMPORTANTE | A5:28-29 | El plazo de la alfalfa está fijo en 4; `params.json` dice 3–4 y el contrato pide {min, max} | Leer `params.json` y escribir {min, max} | 90 |
| IMPORTANTE | A5 completo | No aplica el ajuste de Kc de la Ec. 62 (`rhmin_estimada` no se usa), no sortea Kc y no incluye la fracción de lavado | Implementarlos o declararlos como no aplicados | 85 |
| IMPORTANTE | A3_hls_nasadem.js:132-166 | No hay corrida piloto de consumo ni registro en `docs/ee_uso.md`. La memoria sale en una sola tarea de 132 bandas en lugar de una por año, empezando por 2025 | Piloto con las 3 protagonistas y un `Export` por año (kit §0.3 y A3-M, paso 5) | 90 |
| IMPORTANTE | JS:56-63 | Solo exporta NDVI, LSWI y BSI, sin reflectancias; el Random Forest de A4.2 se queda sin bandas | Exportar también las 6 bandas armonizadas | 80 |
| IMPORTANTE | Todos los .py | Leen y escriben en el directorio actual, sin `--dir data/processed`. A1 no guarda el crudo en `data/raw/power/` ni genera `fuentes_A1.csv` con sha256 | Añadir argumentos de rutas y generar `fuentes_*.csv` | 85 |
| IMPORTANTE | B1_parcelas_ftw.py:47-50 | `ST_Intersects` sin filtro por la columna bbox puede leer el archivo global | Filtrar por bbox, ordenar los IDs (`ORDER BY`) y recortar al rectángulo | 75 |
| MENOR | A9:111 | Por cada parcela recorre todas las celdas externas, O(celdas × parcelas) | Usar solo el anillo dilatado de la parcela | 85 |
| MENOR | A1:20; A3:27-28, 66-79 | Z = 1173 sin fuente; umbrales en el código en lugar de `params.json`; «viento alto = P75» no está en el kit | Leerlos de `params.json` o de NASADEM, o declararlos | 80 |
| MENOR | `datos/colab/__pycache__/*.pyc` | Tres archivos compilados en el commit | Eliminarlos y agregar `.gitignore` | 100 |
| MENOR | datos/LEEME.md | Falta el encabezado AI-assisted. La carpeta de exportación es `Raiz_entregas`, no `Raiz/entregas/` | Agregar el encabezado y mover o renombrar la carpeta | 85 |

## Lo sólido
- **Prueba propia:** pasa.
- **FAO-56:** las ecuaciones y constantes están bien.
- **HLS:** el armonizado es correcto. NIR = B5 en L30 y B8A en S30; Fmask usa los bits 1–4 y no enmascara el agua.
- **Año agrícola:** de octubre a septiembre.
- **Lluvia efectiva:** usa «dependable rain».
- **Cuota y rutas:** no hay `getInfo()`, el área se limita a la zona piloto y no hay rutas de Drive dentro del Python.
- **Archivos acordados:** las columnas coinciden (`memoria_parcelas`, `demanda_cultivos`, `relieve_*`, llaves de lluvia "0" y "-20").

## Antes de que lleguen los datos reales
1. **Memoria:** reglas con 8 meses, ventanas vacías y año siguiente.
2. **Abstención:** por FTW; `anual_verano` se cambia por una clase autorizada.
3. **Desde `supuestos.json`:** eficiencia parcelaria y Kc del nogal, deteniéndose si faltan.
4. **Sorteos comunes:** en el Monte Carlo.
5. **Earth Engine:** corrida piloto con exportación por año.

## Notas para el ensamblado del cubo (B4, integrador)
- **Plazo:** `plazo_anios` llega como un solo número; B4 toma {min, max} de `data/params.json`.
- **Bandas:** mientras los sorteos no sean comunes, sumar P10/P90 entre parcelas no respeta el supuesto de parámetros comunes, y `demanda_cultivos.csv` no coincide con `rotaciones.json`.
- **Opción ACTUAL:** `cereal_invierno` no tiene opción propia y `barbecho` equivale a `descanso`.
- **Campo sin productor:** ninguna pieza produce `dias_suelo_desnudo_mediana` (contrato §2.2).
