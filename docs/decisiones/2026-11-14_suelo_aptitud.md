<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Decisión: perfil de suelo por parcela y aptitud de cada cultivo (14-nov-2026, 17:00)

**Quién decide:** Cristian: que el sistema contemple el tipo de suelo (arenoso, arcilloso…), sus nutrientes y qué cultivos son más aptos para cada suelo y clima, y que no sirva solo para una zona.

**Por qué importa:** el reto pide combinar las observaciones de la NASA «con suelo local, características de los cultivos y prioridades del agricultor» (`docs/referencias/recursos_reto.md`). Hoy el renglón Soil de la ficha solo trae días de suelo desnudo, leguminosa, ruptura de plagas y relieve.

## Qué se agrega
1. **Perfil de suelo de cada parcela** (capa superficial): textura (arena, limo y arcilla, y su clase), pH, carbono orgánico, nitrógeno y capacidad de intercambio catiónico. Sale de un mapa mundial de suelos de 250 m (SoilGrids u OpenLandMap, vía Earth Engine), promediado dentro de la parcela.
2. **Aptitud de cada opción para ese suelo:** cada cultivo de la opción se compara con sus rangos publicados de pH, textura y salinidad. Resultado con tres estados: `fits` (dentro del rango óptimo), `tolerated` (dentro del rango tolerado) y `outside range`, cada uno con su motivo y su fuente.
3. **Nutrientes que ningún mapa abierto da por parcela** (fósforo, potasio, hierro, zinc): la ficha dice «needs a soil test». Si una fuente citable describe un riesgo conocido para ese suelo y cultivo (por ejemplo, baja disponibilidad de hierro o zinc en suelos alcalinos), se muestra como aviso con su fuente.
4. **Aptitud regional por clima y suelo:** GAEZ de FAO (`gaez_zona.csv`, ya pedido), como contexto de la zona.

## Lo que no es
- No es un análisis de suelo: es un mapa modelado de 250 m con incertidumbre. La ficha lo rotula «regional soil map (250 m); not a soil test».
- No decide por el agricultor: la aptitud es una evidencia más junto al agua y al plazo.
- No inventa requisitos: si un cultivo no tiene rango con fuente, su aptitud queda en `null` («no published range»).

## No solo local
Todas las fuentes del gemelo son mundiales (HLS, NASA POWER, NASADEM, GPM IMERG, SMAP, MODIS, GRACE, SoilGrids, GAEZ). Agregar otra región es dar su rectángulo en `data/params.json` (`zona_piloto.zonas`) y volver a correr las piezas de datos. Lo que **no** es mundial y se declara: los límites de parcelas dependen de la cobertura de Fields of The World; las reglas de cultivos, las opciones del maestro y las láminas locales son de Chihuahua; solo se ha probado en las dos zonas piloto.

## Entregas nuevas (sesión de datos)
### `suelo_parcelas.csv` (un archivo, las dos zonas)
| Columna | Contenido |
|---|---|
| `id` | id de `parcelas_base.geojson` |
| `arena_pct`, `limo_pct`, `arcilla_pct` | fracciones de la capa superficial, en % (suman 100 ± 2) |
| `clase_textura` | clase USDA en inglés (`sand`, `loamy sand`, `sandy loam`, `loam`, `silt loam`, `silt`, `sandy clay loam`, `clay loam`, `silty clay loam`, `sandy clay`, `silty clay`, `clay`) |
| `ph` | pH en agua |
| `carbono_organico_g_kg` | carbono orgánico, g/kg |
| `nitrogeno_g_kg` | nitrógeno total, g/kg; vacío si el producto no lo trae |
| `cic_cmol_kg` | capacidad de intercambio catiónico, cmol(+)/kg; vacío si el producto no lo trae |
| `salinidad_ce_ds_m` | conductividad eléctrica, dS/m; vacío si no hay producto con cobertura |
| `profundidad_cm` | capa promediada, p. ej. `0-30` |
| `n_celdas` | celdas del mapa dentro de la parcela |

Una fila por parcela. En `LEEME.md`: producto exacto, versión, profundidades, cómo se promedió y su licencia.

### `suelo_requisitos.json`
```json
{
  "fuente": "tabla(s) de donde salen los rangos",
  "cultivos": {
    "<clase de cultivo del proyecto>": {
      "ph": { "optimo": [0, 0], "tolerado": [0, 0], "fuente": "…", "etiqueta": "…" },
      "textura": { "apta": ["loam"], "limitante": ["sand"], "fuente": "…", "etiqueta": "…" },
      "salinidad_umbral_ds_m": { "valor": 0, "fuente": "…", "etiqueta": "…" },
      "nutrientes": [
        { "elemento": "Zn", "condicion": { "ph_mayor_que": 0 },
          "texto_en": "frase para la ficha, en inglés", "fuente": "…", "etiqueta": "…" }
      ]
    }
  }
}
```
- Los ceros del ejemplo son marcadores de forma, no valores.
- Un bloque sin fuente va en `null`. Nada de memoria: cada rango se lee de la fuente el día que se entrega y se anota la fecha de lectura.

## Qué hace el integrador
- `motor/esquemas.py`: esquemas de los dos archivos.
- `motor/suelo_web.py` → `web/data/suelo.json`: perfil por parcela y aptitud de cada opción del cubo.
- `web/js/suelo.js`: el perfil y la aptitud en el renglón Soil de la ficha, con su rótulo de escala y sus fuentes.
- Todo conectado a `python construir.py`, con pruebas y con sus cifras en `manifest.json`.
