<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Prototipo de front de Lara (integrante 6) · 14-nov-2026

Este es el prototipo web que Lara construyó el sábado y subió a `main` (commits `5abfd21` y `0fcb664`). Se conserva aquí **íntegro**, sin cambios en su código. Solo se movió de carpeta y se agregaron este archivo y `package.json` para que sus pruebas corran dentro del repo.

## Por qué está en `prototipos/` y no en `web/`
- **Datos de ejemplo.** Las 3 parcelas son ficticias y los precios, rendimientos, costos y demandas no tienen fuente (14 registros con `validado: false`). El proyecto no publica cifras sin fuente (`CLAUDE.md`, regla 2).
- **Otro contrato de datos.** La web del producto (`web/`) usa el contrato v4, con 1,239 parcelas reales, pruebas automáticas y publicación condicionada.
- **Escenarios por nivel de la presa.** S8 y S9 los sustituyeron por el deslizador de dotación en millares por hectárea, y la herramienta no pronostica la presa.
- **Opción «MEJOR» por ingreso.** La herramienta apoya y no decide ni promete (S9 §11).
- **Idioma.** La interfaz del concurso va en inglés.

## Ideas de este prototipo que se llevan al producto
- La frase resumen arriba de la ficha («alcanza para X de N ha»).
- La gráfica del historial de NDVI en la ficha, con el NDVI mensual real de HLS.
- La copia de un solo archivo que abre sin internet (`motor/demo_offline.py` en el producto).
- El enlace directo a una parcela con `#id`.
- El guion de la demo de 30 segundos (`DEMO.md`), adaptado a la web real.

## Cómo correrlo
Servir la página:

```bash
python3 -m http.server 8000 --directory prototipos/front_lara/web
```

Correr sus pruebas (8 pruebas):

```bash
node --test prototipos/front_lara/tests/calculos.test.js
```

Correr su validador:

```bash
python3 prototipos/front_lara/scripts/validar_datos.py
```

La revisión completa está en `docs/revisiones/`.
