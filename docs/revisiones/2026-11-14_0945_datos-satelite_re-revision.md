<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Segunda revisión de `datos-satelite` (commits e199ccd y b60ea68) · 14-nov-2026, 9:45

Esta revisión, de solo lectura, comprueba si se atendieron los hallazgos de [2026-11-14_0915_datos-satelite.md](2026-11-14_0915_datos-satelite.md).

**Veredicto: todavía no está lista para datos reales.** Sí lo están B1, A1 y A3/A3-M. A5 y A4 tienen pendientes.

## Estado de cada hallazgo

| # | Hallazgo previo | Estado | Evidencia |
|---|---|---|---|
| 1 | Eficiencia parcelaria fija | PARCIAL | Se lee de `supuestos.json` y el script se detiene si falta (A5:29-35), pero el valor sigue siendo [0.45, 0.70], sin fuente en el repo (`supuestos.json`:4) |
| 2 | Kc del nogal | NO ATENDIDO | «Stone fruit» sigue como valor principal (`supuestos.json`:7; A5:36); no hay relación cobertura–Kc ni detención (kit A5) |
| 3 | `sin_dato` con menos de 8 meses válidos y ventanas vacías | ATENDIDO | A3:98 |
| 4 | `perenne` con el año anterior o el siguiente | ATENDIDO | A3:100-101, 174 |
| 5 | Abstención por FTW | ATENDIDO | A4:98-101 |
| 6 | `anual_verano` | ATENDIDO | A4:96-97 |
| 7 | Umbrales de A4 y A9 | ATENDIDO | A4:31-37; A9:94-97 |
| 8 | Kc, siembras, corte de verano y Bali | PARCIAL | El corte sigue en ago–sep (A5:61); «Bali 2024 [V]» sigue en A5:62 |
| 9 | Sorteos comunes del Monte Carlo | ATENDIDO | A5:159-177, 187 |
| 10 | Plazo como {min, max} | PARCIAL | Solo la alfalfa; el nogal (10) y los anuales (1) siguen como un solo número (A5:37-38) |
| 11 | Ec. 62, sorteo de Kc y fracción de lavado | PARCIAL | Se declaran en el docstring de A5 (A5:13-15), pero no llegan a `rotaciones.json` |
| 12 | Piloto de consumo y exportación por año | PARCIAL | La exportación ya es por año (JS:101-103). El piloto usó una caja de 2 km en julio de 2026 (JS:19, 98); el kit pide las 3 protagonistas con 2025 completo |
| 13 | Reflectancias | ATENDIDO | JS:23-29, 72, 100 |
| 14 | `--dir`, archivos de fuentes y crudo de A1 | PARCIAL | `--dir` y `fuentes_*.csv` con sha256 ya están. El crudo de A1 no va a `data/raw/power/` y no tiene hash (A1:32, 63) |
| 15 | B1 filtrado por bbox | ATENDIDO | B1:52-63 |
| 16 | A9 recorre todas las celdas por cada parcela | NO ATENDIDO | A9:119 |
| 17 | Z = 1173 y P75 escritos en el código | PARCIAL | Siguen en A1:21 y A3:84; las claves 14 y 16 de `supuestos.json` no se leen |
| 18 | `__pycache__` en el repo | ATENDIDO | `datos/.gitignore`; ya no hay archivos .pyc |
| 19 | Encabezado de `LEEME.md` | ATENDIDO | LEEME:1, 8 |

## Problemas nuevos

| Sev. | Archivo:línea | Problema | Arreglo | Conf. |
|---|---|---|---|---|
| IMPORTANTE | A4:89-102 | Una parcela abstenida conserva su estado del plazo y su edad. En la simulación, P0004 (FTW 30) sale `sin_clasificar` pero con `por_vencer` y edad 11, y una anual abstenida sale «libre». El contrato pide null (kit §2.2 y A3-M) | Con abstención: estado del plazo y edad en null | 95 |
| IMPORTANTE | LEEME:26-27 | `dias_suelo_desnudo_mediana` se llena con el valor de 2026; el contrato pide la mediana entre años | Calcularla año por año desde la memoria (A3-M, paso 8) o dejarla en null | 85 |
| IMPORTANTE | `supuestos.json`:4-6, 16; A5:62 | Valores marcados [V] o con fuente que no está en el repo: algodón 200 mm [V] y «Maestro 6.1», 1173 m [V] INEGI, Bali 3–18 % [V], «IMTA 55–60 %» (el único dato del IMTA en el repo es la eficiencia de conducción, 0.60) y Delgado-Ramírez sin referencia completa | La presiembra se cita del kit A5 (15–20 cm); lo demás pasa a [S] o a null con aviso (kit B3, paso 4) | 85 |
| IMPORTANTE | A4:99; B1:75-80 | Una `ftw_confianza` en null cuenta como abstención. Si `--col_conf` no existe, B1 escribe null sin avisar y A4 deja sin clasificar el 100 % | Que B1 se detenga si falta la columna de confianza | 80 |
| MENOR | A5:13-15 vs A5:41 | El docstring dice que todo va con etiqueta [S] en `rotaciones.json`, pero el código pone [V]: algodón y sorgo no tienen nota y chile sale [V] | Etiqueta por cultivo | 90 |
| MENOR | `supuestos.json`:7 | Dice que FAO-56 no tiene renglón de nogal, pero la Tabla 12 sí trae «Walnut orchard» | Corregir el texto; la referencia sirve para la variante de sensibilidad | 80 |

**Fuera de alcance (venía de antes):** A4:63-65. Una anual de verano que se repite cada año se clasifica como nogal comprometido; la simulación lo confirmó.

## Pruebas
- `python -m pytest -q datos/colab` → 2 passed.
- `python test_eto_fao56.py` → PRUEBAS FAO-56 OK.
- **Datos sintéticos:**
  - A5: con lluvia −20 % la demanda es mayor o igual en los 7 cultivos; P10 ≤ P50 ≤ P90; `fuentes_A5.csv` trae sha256.
  - A3 (reglas, con raster simulado): los 8 casos de `sin_dato`, `perenne`, `doble`, `verano` y `descanso` salen bien.
- **No se corrieron** A1, A3 completo, A9 ni B1: aquí faltan `rasterio` y `duckdb` y no hay red.

## Qué falta antes de los datos reales
1. **Kc del nogal:** a partir de la cobertura del dosel, o que el script se detenga si no está declarado.
2. **Parcelas abstenidas:** estado del plazo y edad en null.
3. **Plazos:** {min, max} en todos.
4. **`supuestos.json`:** quitar los [V] que no tienen fuente en el repo.
5. **Corrida piloto:** como pide el kit, con las 3 protagonistas y 2025 completo, antes de usar las exportaciones.
6. **B1:** que se detenga si falta la columna de confianza.
