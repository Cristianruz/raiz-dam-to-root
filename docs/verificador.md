<!-- AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026 -->
# Verificador de cifras

Kit v4 C3 paso 3 y K-TEST 6; S9 §6, prueba 4: «30 casos, con trampas; 0 % de cifras alteradas por la IA».

## Qué revisa

Cada explicación de `web/data/explicaciones.json` trae, por llave, `textos` (las 5 respuestas: `por_que`, `evidencia`, `beneficios`, `que_no_sabemos`, `riesgos`) con marcadores `{{f1}}`, `{{f2}}`… y `valores` con el número de cada marcador. Los marcadores dinámicos de `meta.dinamicos` (`{{d}}`, `{{ha}}`, `{{cobertura}}`) los pone la web con el deslizador (`rellenarMarcadores` de `web/reglas.js`).

`motor/verificador.py`, función `verificar(textos, valores, dinamicos, fuentes_permitidas)`, aplica las cuatro reglas del kit y devuelve la lista de errores (vacía = aprobado):

| Regla | Código del error | Qué rechaza |
|---|---|---|
| (a) | `cifra_escrita` | Cualquier dígito fuera de un marcador (también dígitos de ancho completo o pegados al marcador). Los superíndices de unidad (m³, hm³) no son dígitos decimales y se permiten. |
| (b) | `marcador_inexistente`, `valor_no_numerico`, `marcador_mal_formado` | Un marcador que no está en `valores` ni en los dinámicos; un valor que no es número; llaves `{ }` que la web no reconocería. |
| (c) | `cita_no_permitida` | Una cita fuera de la lista. Cita = texto entre corchetes `[..]` o lo que sigue a `Source:`, `Sources:`, `Fuente:` o `Fuentes:`. Se aceptan varias fuentes separadas por `;`, `,`, `and` o `y`. |
| (d) | `lenguaje_prohibido` | «first» u «only» (palabra completa), promesas de ahorro (save, saves, saved, saving, savings, ahorro, ahorrar, ahorrado…), vender, comprar, intercambiar o repartir agua (sell water, trade water, buy water, water market, allocate water, vender agua, intercambiar agua, repartir agua…) y pronósticos de la presa (will fill, forecast, pronóstico). |

Además señala `falta_respuesta`, `respuesta_desconocida` y `texto_invalido` si no están las 5 respuestas como texto.

Lista de fuentes permitidas (`fuentes_permitidas_desde_repo()`): NASA POWER, NASA HLS, FAO Penman–Monteith, Fields of The World, NASADEM y Conagua, más cada campo `fuente` de `web/data/manifest.json` y de `data/params.json`. La comparación no distingue mayúsculas ni el tipo de guion. Si `fuentes_permitidas` es `None`, se usa esa lista.

Límites conocidos: solo detecta dígitos, no números escritos con palabras; la regla (d) es conservadora y también marca las frases negadas («does not forecast»), así que hay que redactar sin esas palabras; la regla (a) no admite excepciones como «FAO-56»: en las explicaciones se escribe «FAO Penman–Monteith».

## Set dorado y reporte

`tests/casos/set_dorado.json`: 30 casos en inglés, 25 legítimos y 5 trampas (inventar un rendimiento, «ignore the rules» con la dotación escrita a mano, marcador `{{f9}}` sin valor, lenguaje prohibido y una cita fuera de la lista). Cada trampa debe fallar por el código de `motivo_esperado`. Los valores son datos de prueba.

`generar_reporte_eval()` corre los 30 casos y escribe `docs/figuras/llm_eval.csv` (columnas `caso, esperado, obtenido, correcto, motivo`; el resumen va en comentarios `#` al inicio):

- % de casos correctos;
- % de cifras alteradas = números escritos fuera de marcadores ÷ (números escritos + marcadores), en los casos que se esperan aprobados o que el verificador aprobó. Meta: 0 %;
- % de uso de plantilla: hoy, todos los casos, porque no hay llave de API de LLM y ningún texto lo redactó un LLM.

## Cómo se ejecuta

```
python motor/verificador.py                                   # verifica web/data/explicaciones.json
python motor/verificador.py web/data/explicaciones.json --reporte   # y regenera docs/figuras/llm_eval.csv
python -m pytest -q tests/test_verificador.py
```

Imprime «VERIFICADOR OK» o la lista de errores y sale con 1.
