# Raíz · Prototipo web (integrante 6)

Mapa de parcelas piloto, selector de dotación y ficha comparativa de cultivos.
Es una página estática: no necesita backend ni compilación.

## Cómo correrlo

```bash
cd web
python3 -m http.server 8000
# abrir http://localhost:8000
```

> Si abres `index.html` con doble clic, el navegador bloquea la lectura de los JSON.
> Para eso existe la versión de un solo archivo (ver abajo).

**Versión de respaldo para la demo (sin internet ni servidor):**

```bash
python3 scripts/construir_demo.py     # genera dist/raiz-demo.html
```

## Cómo publicarlo (GitHub Pages)

1. Haz commit de la carpeta `web/` en `main`.
2. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**.
3. Branch `main`, carpeta `/web` si existe la opción; si no, usa `/ (root)` y mueve el contenido de `web/` a `docs/` y elige `/docs`.
4. La URL queda como `https://<usuario>.github.io/raiz-dam-to-root/`.

Se puede abrir directamente una parcela con su ID: `…/#raiz-p02`.

## Contrato de datos

El prototipo solo lee tres archivos de `web/data/`. Cada integrante reemplaza el suyo,
corre el validador y hace commit. **No hace falta tocar el código.**

| Archivo | Responsable | Qué contiene |
|---|---|---|
| `parcelas.geojson` | Integrantes 1 y 2 | Polígonos (EPSG:4326), ID único, superficie, cultivo actual, 2 alternativas y serie NDVI |
| `escenarios.json` | Integrante 3 | Escenarios de dotación de La Boquilla: `lamina_cm` **que llega a la parcela**, fuente y supuestos |
| `cultivos.json` | Integrantes 4 y 5 | Demanda neta FAO-56 (`demanda_neta_mm`), eficiencia, rendimiento, precio, costo y efecto en suelo |

Cada registro lleva `fuente` y `validado` (`true`/`false`). Mientras exista alguno sin validar,
la página muestra un aviso de **"datos de ejemplo"**.

### Propiedades de cada parcela (`parcelas.geojson`)

```json
{
  "id": "RAIZ-P01",
  "nombre": "Parcela piloto 1",
  "modulo": "Módulo 4",
  "superficie_ha": 18,
  "cultivo_actual": "alfalfa",
  "alternativas": ["trigo", "sorgo"],
  "ndvi": [{ "fecha": "2024-01", "ndvi": 0.55 }],
  "fuente": "HLS 2024-2025, Earth Engine",
  "validado": true
}
```

Los valores de `cultivo_actual` y `alternativas` deben existir como `id` en `cultivos.json`.
Desde Earth Engine: exporta con `Export.table.toDrive({ fileFormat: 'GeoJSON' })` y agrega las propiedades.

### Validar antes de cada commit

```bash
python3 scripts/validar_datos.py   # errores = código de salida 1
node --test tests/*.test.js        # pruebas de los cálculos
```

## Cómo calcula la ficha

Para cada cultivo (actual y alternativas), con la dotación elegida:

- **Agua que pide (cm)** = `demanda_neta_mm / 10 / eficiencia`
- **Volumen disponible (m³)** = `lamina_cm × 100 × superficie_ha`
- **Hectáreas regables** = `min(superficie, volumen / (agua que pide × 100))`
- **Margen por ha** = `rendimiento × precio − costo`
- **Ingreso neto estimado** = `hectáreas regables × margen por ha`; lo que no alcanza a regarse se queda sin sembrar
- **Pesos por m³** = ingreso neto / agua usada
- **Mejor opción** = mayor ingreso neto, sin contar perennes (como el nogal) que se quedarían con parte sin riego

El mapa pinta cada parcela según qué porcentaje se puede regar con el **cultivo actual**:
verde ≥ 90 %, ámbar 50–90 %, rojo < 50 %.

## Archivos

```
web/
  index.html      estructura
  styles.css      estilos (escritorio y móvil)
  calculos.js     funciones puras del modelo (probadas en tests/)
  app.js          mapa (Leaflet), selector y ficha
  vendor/         Leaflet 1.9.4 local (funciona sin CDN)
  data/           los tres archivos del contrato
scripts/
  validar_datos.py   valida el contrato
  construir_demo.py  genera dist/raiz-demo.html (todo en un archivo)
tests/
  calculos.test.js
```
