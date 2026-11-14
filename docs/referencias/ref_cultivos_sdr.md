<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Referencias de cultivos de la SDR de Chihuahua (solo lectura; no son entregas)

Origen: https://www.chihuahua.gob.mx/info/principales-cultivos-del-estado-de-chihuahua →
http://sdr.chihuahua.gob.mx/Archivos_portal/Cultivos_Gob_Edo/ (solo HTTP). Consulta del 14-nov-2026.

**Advertencia de método:** el navegador de Cristian no abre el sitio (Chrome lo fuerza a HTTPS y falla) y el
contenedor no lo resuelve. Dos PDF se leyeron con la herramienta de lectura web, que pasa el texto por un modelo:
las cifras deben **cotejarse contra el PDF** antes de citarlas. Después el sitio bloqueó la lectura automática
(robots.txt), así que los otros cuatro **no se leyeron**. Los PDF no se pudieron guardar en Drive.

Los documentos son reportes exportados de Power BI: «Concentrado de Estadística Agrícola por Variedad», año 2022
(filtro), © 2023. Fuente que citan: «Elaboracion de la SDR con datos del Servicio de Información Agroalimentaria y
Pesquera, www.siap.gob.mx» (SIAP). Ninguno de los dos leídos trae costo de producción, precio medio rural ni
lámina de riego.

## Alfalfa.pdf — leído
- Filtros: año 2022; variedad «Alfalfa achicalada», «s/clasificar»; modalidad Riego; ciclo Todas; región y municipio Todas. Alcance: estado de Chihuahua (implícito; el reporte no lo escribe).
- Totales: superficie sembrada 90,921 ha; siniestrada 0 ha; cosechada 90,921 ha; producción 8,486,309 ton; valor económico $6,126,596 (miles de pesos); rendimiento 93.34 ton/ha.
- Por municipio (sembrada = cosechada, ha · producción ton · valor miles de pesos · rendimiento ton/ha):
  - Delicias 10,920 · 1,156,428 · $793,872 · 105.90
  - Meoqui 10,911 · 1,049,369 · $725,258 · 96.18
  - Rosales 3,745 · 368,807 · $255,780 · 98.48
  - Saucillo 5,369 · 510,005 · $352,968 · 94.99
  - Julimes 2,640 · 260,086 · $182,981 · 98.52 (la fila de superficie viene con texto dañado en el PDF)
  - La Cruz: solo rendimiento 95.00 · San Francisco de Conchos: solo rendimiento 102.60
- Nota: el rendimiento de alfalfa de ~93 ton/ha parece en verde, no en heno; verificar en el PDF qué presentación usa.

## Chile Verde.pdf — leído
- Filtros: año 2022; cultivo Chile verde; variedad, región, municipio, ciclo, régimen hídrico y modalidad: Todas. Alcance: estado.
- Totales: sembrada 10,917 ha; siniestrada 75 ha; cosechada 10,842 ha; producción 78,655 ton; valor $1,987,317 (miles de pesos); rendimiento 7.20 ton/ha.
- Por municipio, tal como los transcribió la herramienta (cifra y % del total):
  - Delicias: producción 2,490 (3.45 %); valor $34,512 (1.83 %); rendimiento 30.00; no aparece en superficie.
  - Meoqui: solo rendimiento 30.00.
  - Rosales: sembrada 84; cosechada 84 (0.80 %); producción 2,520 (3.50 %); valor $34,654 (1.84 %); rendimiento 30.00.
  - Saucillo: sembrada 208 (1.91 %); cosechada 208 (1.97 %); producción 8,403 (11.66 %); valor $66,136 (3.51 %).
  - Julimes: producción 2,140 (2.97 %); valor $29,798 (1.58 %); rendimiento 30.57.
  - La Cruz: sembrada 85 (0.78 %); cosechada 85 (0.81 %); producción 3,400 (4.72 %); rendimiento 40.00.
  - San Francisco de Conchos: solo rendimiento 32.46.
- Nota: el total estatal de 7.20 ton/ha frente a ~30 ton/ha en los municipios del DR-005 sugiere mezcla de chile seco y verde u otra unidad; cotejar en el PDF.

## No leídos (bloqueo de robots.txt del sitio)
Algodon.pdf · Maiz Amarillo.pdf · nuez.pdf · Avena Forrajera.pdf — hay que abrirlos a mano (en el celular o en una
computadora que permita HTTP) y guardarlos en `Raiz_entregas/referencias/`.
