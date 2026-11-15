<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Decisión: cuatro reglas del motor que quedaron escritas tras la revisión del 15-nov-2026

**Quién decide:** el integrador («Revisión multiagente»), por encargo de Cristian la noche del 14-nov («haz todo el sistema»). Cristian las confirma o las revierte al leer este documento; cada una se puede revertir por separado. Este documento deja por escrito reglas que ya están en el código (`motor/b4_cubo.py`, `validar_contrato.py`) y que la auditoría del contrato pidió documentar. No cambia nombres de archivos ni de campos del contrato v4.

## 1. El corte de verano descuenta la edad del rodal

- **Problema.** En una alfalfa de 3 años (P0757), la opción ACTUAL mostraba un plazo restante corto y «Keep the alfalfa and skip two to three summer irrigations» mostraba el plazo completo, aunque las dos conservan el mismo rodal.
- **Qué dicen las fuentes.** S9 §5: «Compromiso = L P50 × años de plazo restantes. En alfalfa, plazo restante = plazo − edad observada, con mínimo cero». El kit v4, B4 paso 4, dice «Solo la opción ACTUAL de una alfalfa ya establecida descuenta la edad; las alternativas nuevas llevan el plazo completo».
- **Decisión.** Prevalece S9 (regla de prioridad de `CLAUDE.md`). El corte de verano no es una alternativa nueva: mantiene el cultivo perenne que ya está en la parcela. Descuenta la edad igual que la ACTUAL. Las opciones que siembran otra cosa llevan su plazo completo, y en nogal nunca se descuenta la edad (kit §2.3).
- **Dónde.** `motor/b4_cubo.py` (variable `mismo_rodal`); prueba `test_corte_de_verano_sobre_la_alfalfa_actual_descuenta_la_edad` en `tests/test_b4.py`.

## 2. Cada opción publica la secuencia con la que se calculó su agua

- **Problema.** La tabla oficial (`opciones_b3.json`) describe «Break the old alfalfa: winter cereal, then forage maize» con una secuencia que vuelve a la alfalfa. La lámina y el plazo de esa opción vienen de A5 (`rotaciones.json`, rotación `avena_maiz`: cereal y maíz, un año). La ficha mostraba una secuencia con alfalfa junto a un plazo de un año.
- **Decisión.** Cuando la secuencia de la tabla oficial no coincide con la que A5 calculó, se publica la de A5, que es la que respalda las cifras. La secuencia oficial se conserva como texto en `agua.nota_plazo` y completa en `opciones_catalogo`. Es la regla de `docs/decisiones/2026-11-14_opciones_b3.md` §1 («si el maestro pide una que A5 no calcula, se agrega a A5 o se deja fuera y se avisa») aplicada a la secuencia.
- **Consecuencia sobre los filtros.** Una opción solo lleva los filtros de los cultivos de su secuencia publicada. `alfalfa_no_en_anio_seco` no aplica a una secuencia sin alfalfa. `alfalfa_tras_alfalfa` se conserva solo cuando el cultivo actual es alfalfa, porque es la razón de la opción.

## 3. El corte de verano no se ofrece a una alfalfa que todavía no está establecida

- **Qué dicen las fuentes.** Kit B4 paso 1: entran «las alternativas que aprueben los filtros de B3»; kit B3: la opción de corte de verano es para alfalfa establecida.
- **Decisión.** El filtro de alfalfa establecida se evalúa con la edad de cada parcela (`edad_perenne_anios`, de la memoria satelital) contra la edad mínima que trae `opciones_b3.json`. Si la edad es menor, la opción no se ofrece y `meta.notas` dice cuántas parcelas quedaron sin ella. Si no hay edad, se ofrece con «needs local check».

## 4. La gota queda vacía cuando falta la lámina neta

- **Problema.** Sin lámina neta, el motor escribía un consumo del cultivo de cero y el escenario de goteo mostraba un ahorro que no existía.
- **Decisión.** Regla 2 de `CLAUDE.md`: si falta el dato, null y aviso. Sin lámina neta, `gota`, `gota_goteo_con_tope`, `gota_goteo_sin_tope` y `tope_consumo` quedan en null para esa opción y el motor lo avisa por zona. El validador solo acepta ese null cuando el motor lo declaró.
- **Estado hoy.** Ningún dato real lo activa: todas las rotaciones entregadas traen su lámina neta.

## 5. Lo que falta

- Que Cristian confirme las cuatro, sobre todo la 1, que se aparta de la letra del kit.
- Si el equipo decide que una alfalfa joven sí debe ver el corte de verano con un aviso, la decisión 3 se cambia en `motor/b4_cubo.py` y aquí.
