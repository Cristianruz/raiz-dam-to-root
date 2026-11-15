<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 -->
# Recorrido final de las dos páginas (15-nov-2026, 07:10–07:45, hora de Chihuahua)

**Quién lo pidió:** Cristian («revisa todo otra vez… que se vean las recomendaciones y las zonas, por ejemplo si llueve o no»).
**Cómo se hizo:** el integrador miró capturas de las cinco vistas del tablero (computadora y teléfono, con la lluvia del registro y con menos lluvia) y tres revisores de contexto nuevo, de solo lectura, recorrieron el sistema: uno el bloque nuevo contra las reglas y el contrato, uno el tablero como jurado y uno el explorador como jurado. Ninguno encontró un bloqueo en lo publicado.

## Lo que se agregó

- **Resumen del tablero, bloque «con la lluvia del registro y con menos lluvia»** (`web/js/dashboard.js` → `ladoALado`). Por cada zona piloto, el agua que ya piden los perennes como proporción de la dotación elegida; por cada opción de la parcela, las hectáreas que cubre la dotación y el agua que pide al año. Una barra por cada lluvia del cubo; la lluvia en uso va resaltada; elegir una zona la abre. Usa `aguaComprometida` y `evaluarOpcion` de `web/reglas.js`: ningún cálculo nuevo.
- **Gráfica de la comprobación de lluvia** a todo el ancho de su tarjeta.

## Hallazgos y qué se hizo con cada uno

| # | Dónde | Hallazgo | Qué se hizo |
|---|---|---|---|
| 1 | Tablero, bloque nuevo | El porcentaje de la zona salía sin «al menos», aunque hay superficie sin clasificar (kit §2.4) | Corregido: «al menos» cuando la zona tiene superficie sin clasificar, con su rango |
| 2 | Tablero, bloque nuevo | Con la dotación en cero decía «sin dato» | Corregido: dice «sin dotación» y no dibuja la marca |
| 3 | Tablero, bloque nuevo | Las hectáreas de cada opción salían sin rango (kit §2.4) | Corregido: con su rango, el mismo de la ficha |
| 4 | Tablero, bloque nuevo | «Como parte de la dotación» se leía «incluida en»; en francés, «en part de» | Corregido: «como proporción de» en los cuatro idiomas |
| 5 | Tablero, búsqueda | Escribir el ID de una parcela filtraba la lista, pero la ficha seguía en la parcela anterior | Corregido: la búsqueda abre la primera coincidencia; el ID de una parcela de otra zona abre esa zona |
| 6 | Tablero y explorador | La cobertura de una misma parcela se leía con un punto de diferencia: el explorador escribe el porcentaje hacia abajo y el tablero lo redondeaba | Corregido en el tablero (ficha y «Comparar opciones»): entero hacia abajo, como el explorador |
| 7 | Tablero, ficha en laptop | El área que cubre la dotación quedaba bajo el desplazamiento interno de la ficha | Corregido: va antes de las características |
| 8 | Tablero | La lámina se lee con un decimal en la ficha y en «Cultivos y opciones», y con dos en «Comparar opciones» y en el bloque nuevo | Abierto (menor): son la misma cifra con distinto redondeo |
| 9 | Tablero, parcela sin clasificar | La ficha dice que no se calcula nada y «Cultivos y opciones» sí compara áreas con la superficie de la parcela | Abierto (menor): la comparación de área no usa el cultivo de la parcela; conviene decirlo en la ficha |
| 10 | Explorador | El encabezado «Why it's suggested» puede leerse como recomendación | Abierto: es el término del reto, decidido en `docs/decisiones/2026-11-15_ficha_motivos_beneficios_ecostress.md` (§1); lo confirma Cristian |
| 11 | Explorador, computadora | Con la ficha abierta, su borde tapa la orilla derecha del panel de la zona (la flecha del selector) | Abierto (menor, visual) |
| 12 | Explorador, vista 3D | La etiqueta de la parcela se encima sobre un nombre de lugar | Abierto (menor, visual) |
| 13 | WhatsApp en español | Nombra una rotación distinto que la ficha («Cereal de invierno y maíz forrajero») | Abierto: `web/js/mensaje.js` es de la sesión «Laptop» |

## Probado y bien (por los revisores)

- **Cifras:** hectáreas, rango, porcentaje y lámina coinciden entre la ficha, el bloque nuevo, «Cultivos y opciones» y «Comparar opciones» para tres parcelas, con cuatro dotaciones, con y sin menos lluvia; el porcentaje de la zona coincide con la cifra «agua ya comprometida».
- **Tablero:** cambio de zona, marcas de dotación, las tres pestañas de «Comparar opciones», «Run checks», las cinco descargas, los filtros de la cronología, el selector de idioma en las cinco vistas, la liga al explorador; sin desbordes ni errores de consola en veinte combinaciones de vista, tamaño e idioma.
- **Explorador:** llegada directa con el ID de la parcela, las dos zonas y «All areas», el deslizador y la lluvia, fichas de cinco parcelas con su aviso, «Follow the drop», suelo, ECOSTRESS, WhatsApp en cuatro idiomas, hoja impresa, «About & Data», «Tests in sight» y la vista 3D.
- **Regla 10:** sin «best», «first», «only», «recommended», promesas de ahorro ni pronósticos en los textos leídos.

## Pruebas

`python construir.py` y las pruebas con navegador del tablero, de la comparación, de la aplicación instalada y sin conexión, sobre el commit que se publica; los resultados van en el PR y en `docs/coordinacion.md`. La prueba del explorador (`web_smoke.mjs`) no se repitió: `explorer.html`, `web/app.js` y `web/style.css` no cambian.
