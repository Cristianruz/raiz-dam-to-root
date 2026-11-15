<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Decisión: el nogal no lleva alternativas de cultivo (15-nov-2026; registra lo que entró el 15-nov a las 00:45 UTC)

**Quién decide:** el integrador, con la tabla oficial de rotaciones que entregó la sesión de datos (`opciones_b3.json`, decisión `docs/decisiones/2026-11-14_opciones_b3.md` §1). Este documento solo deja por escrito una excepción que ya está en el código desde el commit `1d39069`.

## 1. Problema
- El kit v4 §2.3 pide, en `parcelas.<id>.opciones[]`, «mínimo ACTUAL + 2 alternativas; 3 en alfalfa establecida» (`docs/kit/40_kit_v4_proyecto_definitivo.md`, tabla del contrato del cubo).
- La tabla oficial de rotaciones no da alternativas para la huerta de nogal. En `web/data/cubo.json` → `opciones_catalogo.nogal`, la opción lleva `letra_maestro` = `nogal_no_rota`, el nombre «Pecan orchard (does not rotate)» y esta fuente: «Documento maestro del proyecto, §5.2 (v3.1, 29-oct-2026), «Nogal»: no rota; lámina de ~1.5–1.82 m; no afectar el llenado de almendra (ago–sep)» [V].
- Su razón, tal como la publica la ficha (`por_que_en`): «An orchard does not rotate. Minimum-irrigation scenarios are the ones that apply, and kernel filling (August–September) should not be put at risk.»

## 2. Decisión
- Las 105 huertas de nogal clasificadas (`web/data/parcelas.geojson`, `cultivo_actual` = `nogal`) llevan **solo la opción ACTUAL** y un bloque `sin_rotacion` con `motivo`, `fuente` y `etiqueta` (`cubo.json` → `parcelas.<id>.sin_rotacion`).
- **No se completan con una propuesta del equipo**, a diferencia del barbecho y del cereal de invierno (`cubo.json` → `meta.opciones.completadas`). Arrancar una huerta para sembrar otra cosa no es una rotación, y proponerlo sin fuente sería inventar una opción.
- La ficha dice el motivo y la fuente en lugar de las alternativas, con la frase «No alternatives are compared for this field.» (`web/app.js`, `NOTA_SIN_ROTACION`).
- Lo que sí muestra la ficha de una huerta: el compromiso de agua a 10 años (horizonte de cálculo [S], S9 §5), la lámina aplicada en el distrito como referencia local (13.72 millares/ha, medias 2009–2016 [V], Villalobos-Cano et al. 2024; `cubo.json` → `agua.lamina_local`) y, en «Follow the drop», el escenario de goteo con y sin tope de consumo, rotulado «[V] indicative, not local» (`cubo.json` → `meta.goteo`).

## 3. Cómo se registra la excepción
- `validar_contrato.py` acepta una parcela con menos de ACTUAL + 2 solo si trae `sin_rotacion` con `motivo` y `fuente`, y en ese caso exige que la única opción sea ACTUAL. Cualquier otra parcela con menos de tres opciones sigue siendo un error del contrato.
- `motor/b4_cubo.py` (función `no_rota`) no busca alternativas cuando la rotación actual es la que el maestro marca `nogal_no_rota`.
- La excepción la registra el integrador: entró con el commit `1d39069` («El nogal, que según el maestro no rota, lleva solo ACTUAL y «sin_rotacion» con motivo y fuente; validar_contrato.py lo acepta solo así»).

## 4. Lo que falta
- **Escenario de riego mínimo del nogal.** El maestro dice que en una huerta aplican los escenarios de riego mínimo, pero el repositorio no tiene una lámina de riego mínimo con fuente. Hasta que la haya, no se calcula ninguna; si llega, entra como opción con su fuente y su etiqueta, sin poner en riesgo el llenado de almendra (ago–sep).
- **Vida de la huerta con fuente de INIFAP** (`docs/reparto_faltantes.md`, D6): el plazo sigue siendo un horizonte de cálculo de 10 años [S], no la vida de la huerta.
- **Contrato del kit.** El kit v4 §2.3 no prevé la excepción; si el equipo cambia el kit, que cite este documento.

## 5. Dónde se dice en los textos públicos
- `README.md`, «How it works» (Field sheet) y «Limitations».
- `LIMITATIONS.md`, «Crop options».
- `docs/pitch/textos_envio.md`, «Rotation comparison».
