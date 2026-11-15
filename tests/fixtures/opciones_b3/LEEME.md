<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Fixture de PRUEBA: opciones y filtros oficiales (B3), heladas y supuestos

TODOS LOS VALORES SON DE PRUEBA. Sirven a `tests/test_opciones_b3.py`, `tests/test_b4.py` y
`tests/test_ensamblar.py` para probar el validador del buzón (`motor/ensamblar.py`, regla «opciones_b3») y el
motor (`motor/b4_cubo.py`). No son la entrega de la sesión de datos, no tienen fuente real y nunca se copian a
`data/processed` ni a `web/data`.

- `opciones_b3.json`: contrato de `docs/decisiones/2026-11-14_opciones_b3.md` con ids de `rotaciones.json`;
  `cereal_invierno` no se lista a propósito (ese cultivo debe seguir con el diseño provisional).
- `heladas.json`: dos zonas con probabilidades distintas (el mismo filtro pasa en una y avisa en la otra).
- `supuestos.json`: eficiencias de prueba, distintas de las reales.
