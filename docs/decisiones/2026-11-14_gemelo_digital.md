<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Decisión: Raíz se presenta y se usa como gemelo digital (14-nov-2026, 14:50)

**Quién decide:** Cristian (integrador): «que sea un gemelo digital, no una web».

## Qué significa «gemelo digital» en Raíz
Es una réplica de las zonas piloto que se actualiza con datos y permite ensayar decisiones antes de sembrar. El rótulo no se usa para prometer más de lo que hay.

| Parte de un gemelo | En Raíz | De dónde sale |
|---|---|---|
| **Réplica del terreno y de las parcelas** | Relieve en 3D y las 1,239 parcelas estimadas | NASADEM (30 m) y Fields of The World |
| **Estado observado** | Verdor de cada parcela año por año (2016–2026), NDVI mensual de 2026 y suelo desnudo | HLS (Landsat + Sentinel-2) |
| **Modelo físico** | Agua que pide cada cultivo; rutas de escurrimiento | FAO-56 con NASA POWER; NASADEM con lluvia de GPM IMERG |
| **Ensayo de escenarios** | Dotación, lluvia −20 %, tormenta y otra rotación | Reglas del kit §2.4, calculadas en el dispositivo |
| **Sincronización** | Cada corrida de `python construir.py` vuelve a validar las entregas y regenera el gemelo; la pantalla dice de qué fecha es cada dato | `manifest.json` |

**Lo que NO es (y se declara):**
- No tiene sensores en campo ni datos en tiempo real: se actualiza con cada corrida, a partir de datos de satélite y de clima.
- No pronostica la presa y no decide por el agricultor.

## Qué cambia en el producto
1. **Vista 3D del gemelo:**
   - Relieve de NASADEM con exageración vertical declarada.
   - Sobre cada parcela, una **columna de agua**: su altura es el agua que pide la rotación actual por hectárea.
   - La columna va en azul hasta donde alcanza la dotación elegida y en rojo lo que falta; se mueve con el deslizador.
   - Las parcelas sin clasificar quedan planas y en gris.
2. **Línea de tiempo:**
   - Un control de año agrícola (2016–2026) con reproducción.
   - Muestra el estado observado de cada parcela, año por año, y resalta 2025, el año sin agua de las presas [P].
3. **Estado del gemelo:** una tarjeta que separa lo observado, lo modelado y lo que es escenario, con la fecha de cada fuente.
4. **Aplicación instalable y sin conexión:**
   - Se instala en el teléfono o la laptop y abre en su propia ventana.
   - Sigue funcionando sin red con la última copia sincronizada.
   - Es además el respaldo para la mesa del Open House.
5. **Ficha:**
   - Frase resumen descriptiva arriba, sin «mejor» y sin pesos.
   - Gráfica del NDVI mensual real de la parcela.
   - Enlace directo a una parcela con `#id`.

   Son ideas del prototipo de Lara (`prototipos/front_lara/`).
6. **Inicio:** el gemelo abre en Delicias–Saucillo, no en «todas las zonas».

Lo ya construido y probado no cambia: el mapa 2D, el deslizador, la ficha, La gota, la tormenta, WhatsApp, la impresión y «About & Data». La vista 3D es un modo adicional.

## Contrato de `web/data/gemelo.json` (lo genera `motor/gemelo_web.py`; nunca a mano)
```json
{
  "terreno": {
    "encoding": "terrarium", "tileSize": 256, "minzoom": 9, "maxzoom": 12,
    "zonas": {
      "<id_zona>": { "teselas": "data/dem/<id_zona>/{z}/{x}/{y}.png", "bounds": [o, s, e, n], "elev_min_m": 0, "elev_max_m": 0 }
    },
    "exageracion": 0,
    "fuente": "NASADEM (NASA/NASADEM_HGT/001), 30 m, vía Google Earth Engine",
    "rotulo": "regional, 30 m (NASADEM); vertical exaggeration applied"
  },
  "columnas": { "metros_por_millar": 0, "nota": "…", "etiqueta": "Diseño" },
  "camara": { "pitch": 0, "bearing": 0 },
  "tiempo": {
    "anios": [2016, 2026],
    "intervalo_ms": 0,
    "destacados": { "2025": { "texto": "…", "fuente": "…", "etiqueta": "[P]" } }
  },
  "ndvi": { "archivo": "data/ndvi_mensual.json", "fuente": "…", "meses": ["2025-10", "…"] }
}
```
- Los valores de diseño (exageración, metros por millar, cámara, intervalo) viven en `data/params.json`, bloque `gemelo`, con la etiqueta «Diseño».
- La página no escribe ninguno a mano.
- Hay un juego de teselas de relieve por zona (cada uno con sus `bounds`): la vista 3D trabaja sobre una zona a la vez.
- Si falta `gemelo.json` o faltan las teselas, la vista 3D no se ofrece y la página lo dice («3D twin view: not available»).

`web/data/ndvi_mensual.json`:
```json
{ "meses": ["2025-10", "…"], "parcelas": { "<id>": [0.31, null, "…"] }, "fuente": "…" }
```
NDVI mediano mensual de HLS por parcela; `null` si no hay dato.

## Reglas que no cambian
- Ninguna cifra sin fuente; ninguna cifra escrita a mano en la página.
- No se dice «first» ni «only», no se prometen ahorros, y cada ficha lleva el aviso de juicio local.
- Todo pasa por el comando único y por la prueba con navegador antes de publicarse.
