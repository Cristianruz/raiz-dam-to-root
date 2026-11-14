# Raíz – From Dam to Root

Equipo **Los Norteados** · NASA Space Apps Challenge 2026, sede Chihuahua · Reto *Field Shift: Adapting Farms with NASA Data*

> **Estado:** documentación previa al evento. Este repositorio todavía no contiene código: el código se escribe a partir del sábado 14 de noviembre a las 9:00, conforme a las reglas del concurso y a la condición del Local Lead.

## La idea en una frase
Antes de sembrar, Raíz muestra el agua que compromete cada cultivo: cuánta pide al año, por cuántos años obliga y para cuántas hectáreas alcanza la presa.

Un cultivo anual compromete el agua un ciclo; la alfalfa, de 3 a 4 años; el nogal, décadas. En el Distrito de Riego 005 Delicias, la alfalfa y el nogal ocupaban el 63 % de la superficie sembrada en 2016-17 (Conagua), y en 2025 el distrito no recibió agua de las presas (prensa con cifras de Conagua).

## Qué se construye
1. **Centro de control.** Mapa de la zona piloto con un deslizador de dotación en millares por hectárea, el indicador de agua ya comprometida por los perennes, un semáforo por parcela y la capa de relieve con «Simular tormenta».
2. **Ficha de parcela.** Memoria de la parcela desde 2016; rotación actual frente a dos alternativas (agua, suelo y dinero); plazo y hectáreas que alcanzan; La gota, que sigue el agua de la presa al acuífero; y las cinco respuestas que pide el reto.
3. **Mensaje al agricultor.** Vista previa de WhatsApp y ficha imprimible.

## Cinco pruebas
Exactitud del mapa de cultivos · back-test del ciclo 2026 (preregistrado) · 2025 como experimento natural (preregistrado) · verificador de cifras · contraste regional de la evapotranspiración.

## Qué hay en este repositorio
| Ruta | Contenido |
|---|---|
| `docs/sintesis/S9_proyecto_definitivo.md` | **Leer primero.** Proyecto definitivo: idea, pantallas, piezas, cálculo, pruebas, criterios, orden de construcción y límites |
| `docs/sintesis/S8_enfoque_definitivo.md` | Decisiones y cifras del 10 de noviembre que S9 complementa |
| `docs/kit/40_kit_v4_proyecto_definitivo.md` | Kit del sábado: reglas de trabajo, contrato de datos y prompts para Claude Code y Gemini |
| `entregables/` | Anteproyecto (versión 3), proyecto definitivo y resumen de una página, en Word |

El resto de la investigación (cifras verificadas, especificación técnica, preregistro, manual de etiquetado y página en inglés) está en el proyecto de Claude «Space Apps».

## Reglas que no se rompen
- Solo datos públicos y cada cifra con su fuente.
- La herramienta no reparte, vende ni intercambia agua (art. 22 de la Ley de Aguas Nacionales) y no promete ahorros.
- Apoya y no sustituye el juicio del agricultor ni del técnico.
- Sin logotipos de la NASA. El uso de IA se declara.

## Licencia
Apache 2.0 (se agrega con el código). Los datos de terceros conservan su propia licencia.

*Documentación redactada con asistencia de IA (Claude) y revisada por el equipo.*
