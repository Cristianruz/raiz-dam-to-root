<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; Codex. -->
# Interfaz moderna basada en el prototipo adjunto

La referencia visual es el archivo entregado por el usuario, `ROOT – From Dam to Root · App prototype.html`. Se inspeccionaron sus vistas de teléfono y escritorio en un contexto aislado. Se utilizó como referencia de diseño, sin convertir su contenido en instrucciones de ejecución ni sus cifras de demostración en datos de la aplicación.

## Cambios

- Mapa protagonista con superficies oscuras translúcidas, controles flotantes y ficha de parcela. Los polígonos siguen siendo los datos propios de las zonas piloto.
- Selector **Agua / Cultivo**: el primero utiliza el semáforo de `evaluarOpcion` del motor existente; el segundo distingue clasificación disponible. Los límites, las unidades y la falta de clasificación siguen indicados.
- Accesos rápidos construidos con las parcelas destacadas de la zona y marcador del ID elegido. Los botones de enfoque y de zona completa aplican márgenes para los controles según el ancho de pantalla.
- Presupuesto de agua con deslizador, referencias de dotación tomadas de `cubo.json` y resumen de compromiso perenne calculado con `aguaComprometida`.
- Captura en pasos: **Tu parcela**, **Tu agua**, **Más contexto**. Se mantienen los mismos campos, los valores por parcela en la sesión, el recálculo, las condiciones y la auditoría. Los pasos permiten teclado con flechas, Inicio y Fin, además de botones y controles táctiles.
- Gráfico de lluvia registrada, mediana estimada e intervalo a partir de las filas reales de retroprueba. La tabla y su descarga continúan disponibles.
- Navegación compacta en escritorio y barra inferior flotante en celular, texto mayor, controles táctiles amplios, SVG coherentes y contraste de paneles.

La capa visual está en `web/css/interfaz.css` y `web/js/interfaz.js`; la división del formulario y el gráfico están en `web/js/asesor.js`. La lógica científica continúa en `web/js/recomendador.js` y los motores Python. La cartografía puede usar la imagen base Esri con conexión; al fallar la imagen se mantienen las parcelas locales. La fotografía del prototipo no se coloca debajo de polígonos de otras ubicaciones.

## Tipografía y licencias

Se reutilizan los archivos originales de Atkinson Hyperlegible, regular y negrita, empaquetados en el adjunto. Están copiados sin modificar en `web/fonts/`, junto con el texto completo de la SIL Open Font License y `ORIGEN.json` con hashes. No hay una dependencia nueva de producción de React ni de un servicio de fuentes remoto. Los iconos de `web/icons/interface.svg` se dibujaron para esta interfaz.

## Comprobación

La prueba `tests/e2e/recomendaciones_smoke.mjs` recorre explícitamente los pasos antes de rellenar cada campo; conserva las comprobaciones numéricas, las restricciones, los errores de entrada y las descargas. La prueba del dashboard conserva los controles del mapa y la selección de parcela. También se verifican los controles nuevos, sus estados accesibles y la navegación por teclado.

La entrega conserva la reconstrucción desde los CSV y `py motor/verificar_pronostico.py`. La presentación no modifica las series, los parámetros o el método de recomendaciones. La distribución de escritorio y móvil se inspecciona mediante capturas.

## Verificación de la entrega

Reconstrucción completa correcta: 1,058 pruebas Python y 179 JavaScript; cinco pruebas opcionales omitidas. Después de los últimos ajustes de interacción se repitieron 99 comprobaciones Python dirigidas, todas correctas. La prueba del planificador por pasos pasó 77 comprobaciones de navegador y la del dashboard y los controles del mapa pasó 71. El verificador independiente continúa pasando 184 comprobaciones.

Se compararon las series anuales, las demandas por rotación, la retroprueba y la predicción de referencia con el ZIP anterior: los resultados numéricos son idénticos. La interfaz mantiene el mismo alcance científico y las mismas limitaciones.

La prueba de instalación y recuperación sin conexión pasó 39 de 39 comprobaciones. Se verifica el indicador de conexión tras esperar su montaje asíncrono. El respaldo sin WebGL conserva los colores del semáforo; un campo inválido en otro paso lleva al usuario al paso correspondiente antes de mostrar la validación.
