# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Verificador de cifras de las explicaciones (kit v4 C3 paso 3; K-TEST 6; S9 §6 prueba 4).

Las explicaciones (web/data/explicaciones.json) traen, por llave, «textos» con las
5 respuestas (por_que, evidencia, beneficios, que_no_sabemos, riesgos) y «valores»
con el número de cada marcador {{f1}}, {{f2}}…  Los marcadores dinámicos
(meta.dinamicos: {{d}}, {{ha}}, {{cobertura}}) los rellena la web con el
deslizador (web/reglas.js, rellenarMarcadores).

verificar() aplica las cuatro reglas del kit, paso 3:
  (a) ningún dígito fuera de los marcadores (regex sobre el texto sin marcadores);
  (b) cada marcador existe en «valores» (con un número) o en la lista de dinámicos;
  (c) cada cita está en la lista de fuentes permitidas. Cita = texto entre
      corchetes [..] o lo que sigue a «Source:» / «Sources:» / «Fuente:» / «Fuentes:»;
  (d) lenguaje prohibido: «first» u «only», promesas de ahorro, vender, comprar,
      intercambiar o repartir agua, y pronósticos de la presa.

Cada error empieza con un código (cifra_escrita, marcador_inexistente, cita_no_permitida,
lenguaje_prohibido…) para que el set dorado compruebe que una trampa falla por el
motivo correcto.

Uso:
    python motor/verificador.py [ruta]            verifica explicaciones.json
                                                  (por omisión web/data/explicaciones.json)
    python motor/verificador.py [ruta] --reporte  además corre el set dorado y escribe
                                                  docs/figuras/llm_eval.csv
Imprime «VERIFICADOR OK» o la lista de errores (sale con 1).
Solo usa la biblioteca estándar.
"""
import csv
import io
import json
import math
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
RUTA_EXPLICACIONES = RAIZ / "web/data/explicaciones.json"
RUTA_MANIFEST = RAIZ / "web/data/manifest.json"
RUTA_PARAMS = RAIZ / "data/params.json"
RUTA_SET_DORADO = RAIZ / "tests/casos/set_dorado.json"
RUTA_REPORTE = RAIZ / "docs/figuras/llm_eval.csv"
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"

# Las 5 respuestas de cada explicación (kit v4 §2.5; igual que validar_contrato.py).
PREGUNTAS = ("por_que", "evidencia", "beneficios", "que_no_sabemos", "riesgos")
# Marcadores dinámicos del kit v4 §2.5; se usan si el archivo no trae meta.dinamicos.
DINAMICOS_KIT = ("d", "ha", "cobertura")
# Fuentes que siempre se pueden citar (además de las de manifest.json y params.json).
FUENTES_FIJAS = ("NASA POWER", "NASA HLS", "FAO Penman–Monteith", "Fields of The World",
                 "NASADEM", "Conagua")

# Marcador: el mismo patrón que rellenarMarcadores de web/reglas.js (/\{\{(\w+)\}\}/;
# en JavaScript \w es solo ASCII). Un marcador que la web no reconoce se ve crudo.
MARCADOR = re.compile(r"\{\{([A-Za-z0-9_]+)\}\}")
# Dígito: cualquier dígito decimal Unicode (0-9, de ancho completo, árabes…).
# Los superíndices de unidad (m³, hm³) no son dígitos decimales y se permiten.
DIGITO = re.compile(r"\d")
# Número escrito (para mostrarlo en el error y contarlo en el reporte).
NUMERO = re.compile(r"\d+(?:[.,]\d+)*")

# Citas. Entre corchetes, o tras «Source:»/«Fuente:» hasta el fin de la frase,
# un paréntesis, un corchete o el fin de línea.
CITA_CORCHETES = re.compile(r"\[([^\[\]]*)\]")
CITA_ETIQUETA = re.compile(
    r"\b(?:sources?|fuentes?)\s*:\s*(?P<cita>[^\n\[\]()]*?)(?=\.\s|\.$|[\n()\[\]]|$)",
    re.IGNORECASE)
PREFIJO_CITA = re.compile(r"^\s*(?:sources?|fuentes?)\s*:\s*", re.IGNORECASE)
# Separadores de varias fuentes dentro de una misma cita.
SEPARADOR_CITAS = re.compile(r"\s*(?:;|,|&|\band\b|\by\b)\s*", re.IGNORECASE)

# Lenguaje prohibido (CLAUDE.md regla 10; kit C3 paso 3). Palabra completa, sin
# distinguir mayúsculas. Es conservador: también marca la frase negada
# («does not forecast»); redacte sin esas palabras.
PROHIBIDAS = [
    (r"\bfirst\b", "palabra prohibida"),
    (r"\bonly\b", "palabra prohibida"),
    (r"\b(?:save|saves|saved|saving|savings)\b", "promete ahorros"),
    (r"\b(?:ahorro|ahorros|ahorrar|ahorra|ahorran|ahorrado|ahorrada|ahorrados|ahorradas)\b",
     "promete ahorros"),
    (r"\b(?:sell|sells|selling|sold|trade|trades|trading|traded|buy|buys|buying|bought)\s+"
     r"(?:(?:your|the|their|our|his|her|some|more|extra|surplus|spare)\s+)?water\b",
     "propone vender, comprar o intercambiar agua"),
    (r"\bwater\s+(?:trade|trading|market|markets|sale|sales)\b",
     "propone vender o intercambiar agua"),
    (r"\b(?:allocate|allocates|allocating|reallocate|reallocates|reallocating)\s+"
     r"(?:(?:the|your|their|our)\s+)?water\b", "propone repartir agua"),
    (r"\b(?:vender|vende|venda|vendan|comprar|compre|intercambiar|intercambie|repartir|reparta|"
     r"reparte)\s+(?:(?:el|su|tu|sus|tus|más)\s+)?agua\b",
     "propone vender, comprar, intercambiar o repartir agua"),
    (r"\bwill\s+(?:re)?fill\b", "pronostica la presa"),
    (r"\bforecast\w*", "pronostica la presa"),
    (r"\bpron[oó]stic\w*", "pronostica la presa"),
]
PROHIBIDAS = [(re.compile(p, re.IGNORECASE), motivo) for p, motivo in PROHIBIDAS]


# --- Utilidades ----------------------------------------------------------------------
def _error(codigo, donde, detalle):
    """Error con su código al inicio: «codigo · donde: detalle»."""
    return f"{codigo} · {donde}: {detalle}"


def codigo_de(error):
    """Código de un error («cifra_escrita», «cita_no_permitida»…)."""
    return error.split(" · ", 1)[0]


def _normalizar_fuente(texto):
    """Compara fuentes sin distinguir mayúsculas, espacios ni tipo de guion."""
    s = unicodedata.normalize("NFKC", str(texto))
    s = re.sub(r"[‐-―−]", "-", s)       # –, —, − → -
    s = re.sub(r"\s+", " ", s).strip().strip(".«»\"'“”").strip()
    return s.casefold()


def _es_numero(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v)


def _leer_json(ruta):
    try:
        return json.loads(Path(ruta).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def _recoger_fuentes(obj, salida):
    """Junta los valores de las llaves «fuente»/«fuentes» (texto o lista de textos)."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("fuente", "fuentes"):
                for x in (v if isinstance(v, list) else [v]):
                    if isinstance(x, str) and x.strip():
                        salida.add(x.strip())
            _recoger_fuentes(v, salida)
    elif isinstance(obj, list):
        for v in obj:
            _recoger_fuentes(v, salida)


def fuentes_permitidas_desde_repo(ruta_manifest=RUTA_MANIFEST, ruta_params=RUTA_PARAMS):
    """Lista de fuentes que se pueden citar.

    = FUENTES_FIJAS + cada «fuente» de web/data/manifest.json y de data/params.json.
    Una fuente compuesta («A; B») se acepta entera y también por partes.
    Si un archivo falta, se usa lo demás (las fijas siempre están).
    """
    encontradas = set()
    for ruta in (ruta_manifest, ruta_params):
        datos = _leer_json(ruta)
        if datos is not None:
            _recoger_fuentes(datos, encontradas)
    permitidas = set(FUENTES_FIJAS)
    for f in encontradas:
        permitidas.add(f)
        permitidas.update(p.strip() for p in f.split(";") if p.strip())
    return permitidas


def _citas(texto):
    """Citas del texto: contenido de [..] y lo que sigue a «Source:»/«Fuente:»."""
    citas = [PREFIJO_CITA.sub("", m.group(1)) for m in CITA_CORCHETES.finditer(texto)]
    citas += [m.group("cita") for m in CITA_ETIQUETA.finditer(texto)]
    return citas


def _cita_permitida(cita, permitidas_norm):
    """Entera, o separada en varias fuentes (; , & and y), cada parte permitida."""
    if _normalizar_fuente(cita) in permitidas_norm:
        return True
    partes = [p for p in SEPARADOR_CITAS.split(cita) if p.strip()]
    return bool(partes) and all(_normalizar_fuente(p) in permitidas_norm for p in partes)


def numeros_fuera_de_marcadores(texto):
    """Números escritos a mano (fuera de los marcadores) en un texto."""
    return NUMERO.findall(MARCADOR.sub(" ", texto))


# --- Verificador ---------------------------------------------------------------------
def verificar(textos, valores, dinamicos, fuentes_permitidas=None):
    """Revisa las 5 respuestas de una explicación. Devuelve la lista de errores ([] = OK).

    textos: {"por_que": "...", ...}; valores: {"f1": número, ...};
    dinamicos: marcadores que pone la web ({"d", "ha", "cobertura"});
    fuentes_permitidas: conjunto de fuentes citables; None = fuentes_permitidas_desde_repo().
    """
    if not isinstance(textos, dict):
        return [_error("texto_invalido", "textos", "debe ser un objeto con las 5 respuestas")]
    valores = valores if isinstance(valores, dict) else {}
    dinamicos = set(dinamicos or ())
    if fuentes_permitidas is None:
        fuentes_permitidas = fuentes_permitidas_desde_repo()
    permitidas_norm = {_normalizar_fuente(f) for f in fuentes_permitidas}

    errores = []
    for q in PREGUNTAS:
        if q not in textos:
            errores.append(_error("falta_respuesta", q, "falta esta respuesta"))
    for q in textos:
        if q not in PREGUNTAS:
            errores.append(_error("respuesta_desconocida", q, f"se esperan {', '.join(PREGUNTAS)}"))

    for q, texto in textos.items():
        if not isinstance(texto, str) or not texto.strip():
            errores.append(_error("texto_invalido", q, "la respuesta debe ser un texto no vacío"))
            continue
        sin_marcadores = MARCADOR.sub(" ", texto)

        # (a) Ningún dígito fuera de los marcadores.
        if DIGITO.search(sin_marcadores):
            escritos = NUMERO.findall(sin_marcadores) or DIGITO.findall(sin_marcadores)
            errores.append(_error("cifra_escrita", q,
                                  "número escrito fuera de los marcadores: "
                                  + ", ".join(f"«{n}»" for n in escritos)))
        # Llaves sueltas: la web no reconoce el marcador y lo mostraría crudo.
        if re.search(r"[{}]", sin_marcadores):
            errores.append(_error("marcador_mal_formado", q,
                                  "hay llaves { } que no forman un marcador {{nombre}}"))

        # (b) Cada marcador existe en los valores (con un número) o es dinámico.
        for m in MARCADOR.findall(texto):
            if m in dinamicos:
                continue
            if m not in valores:
                errores.append(_error("marcador_inexistente", q,
                                      f"{{{{{m}}}}} no está en «valores» ni en los dinámicos"))
            elif not _es_numero(valores[m]):
                errores.append(_error("valor_no_numerico", q,
                                      f"{{{{{m}}}}} vale {valores[m]!r}; debe ser un número"))

        # (c) Cada cita está en la lista de fuentes permitidas.
        for cita in _citas(texto):
            if not _cita_permitida(cita, permitidas_norm):
                errores.append(_error("cita_no_permitida", q,
                                      f"«{cita.strip()}» no está en la lista de fuentes permitidas"))

        # (d) Lenguaje prohibido.
        for patron, motivo in PROHIBIDAS:
            for m in patron.finditer(sin_marcadores):
                errores.append(_error("lenguaje_prohibido", q, f"{motivo}: «{m.group(0)}»"))

    # Sin repetidos, en el orden en que aparecieron.
    return list(dict.fromkeys(errores))


def verificar_archivo(ruta_explicaciones=RUTA_EXPLICACIONES, fuentes_permitidas=None):
    """Verifica cada llave de explicaciones.json. Devuelve {llave: [errores]} solo con
    las llaves que fallan ({} = VERIFICADOR OK). Los problemas del archivo van en «_archivo»."""
    datos = _leer_json(ruta_explicaciones)
    if not isinstance(datos, dict):
        return {"_archivo": [f"no se pudo leer {ruta_explicaciones} como JSON"]}
    meta = datos.get("meta") or {}
    problemas = []
    if "dinamicos" in meta:
        dinamicos = set(meta.get("dinamicos") or [])
    else:
        dinamicos = set(DINAMICOS_KIT)
        problemas.append("meta.dinamicos falta; se usa la lista del kit (d, ha, cobertura)")
    explicaciones = datos.get("explicaciones")
    if not isinstance(explicaciones, dict) or not explicaciones:
        problemas.append("no hay explicaciones que verificar")
        explicaciones = {}
    if fuentes_permitidas is None:
        fuentes_permitidas = fuentes_permitidas_desde_repo()

    resultado = {"_archivo": problemas} if problemas else {}
    for llave, e in explicaciones.items():
        e = e if isinstance(e, dict) else {}
        errores = verificar(e.get("textos"), e.get("valores"), dinamicos, fuentes_permitidas)
        if errores:
            resultado[llave] = errores
    return resultado


# --- Set dorado y reporte --------------------------------------------------------------
def cargar_set_dorado(ruta=RUTA_SET_DORADO):
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def evaluar_caso(caso, fuentes_permitidas=None, dinamicos=DINAMICOS_KIT):
    """Corre el verificador sobre un caso del set dorado. Devuelve (obtenido, errores)."""
    errores = verificar(caso.get("textos"), caso.get("valores"), set(dinamicos), fuentes_permitidas)
    return ("falla" if errores else "pasa"), errores


def _pct(parte, total):
    return round(100.0 * parte / total, 1) if total else 0.0


def generar_reporte_eval(ruta_salida=RUTA_REPORTE, ruta_set=RUTA_SET_DORADO, fuentes_permitidas=None):
    """Corre los casos del set dorado y escribe docs/figuras/llm_eval.csv.

    Columnas: caso, esperado, obtenido, correcto, motivo. El resumen va en comentarios (#)
    al inicio del archivo:
    - % de casos correctos (veredicto obtenido = esperado);
    - % de cifras alteradas = números escritos fuera de los marcadores / todos los números
      (escritos + marcadores), en los casos que se esperan aprobados o que el verificador
      aprobó. Meta: 0 %;
    - % de uso de plantilla: casos cuyo «origen» es plantilla (por omisión, todos: no hay
      llave de API de LLM, así que ningún texto lo redactó un LLM).
    Devuelve el resumen como dict (incluye «filas»).
    """
    datos = cargar_set_dorado(ruta_set)
    casos = datos["casos"]
    dinamicos = datos.get("dinamicos") or DINAMICOS_KIT
    if fuentes_permitidas is None:
        fuentes_permitidas = fuentes_permitidas_desde_repo()

    filas, correctos, fuera, total_numeros, plantilla = [], 0, 0, 0, 0
    for caso in casos:
        obtenido, errores = evaluar_caso(caso, fuentes_permitidas, dinamicos)
        esperado = caso["esperado"]
        correcto = obtenido == esperado
        if esperado == "falla" and caso.get("motivo_esperado"):
            correcto = correcto and caso["motivo_esperado"] in {codigo_de(e) for e in errores}
        correctos += correcto
        if caso.get("origen", "plantilla") == "plantilla":
            plantilla += 1
        if esperado == "pasa" or obtenido == "pasa":
            for texto in (caso.get("textos") or {}).values():
                if isinstance(texto, str):
                    n_fuera = len(numeros_fuera_de_marcadores(texto))
                    fuera += n_fuera
                    total_numeros += n_fuera + len(MARCADOR.findall(texto))
        filas.append({"caso": caso["id"], "esperado": esperado, "obtenido": obtenido,
                      "correcto": "sí" if correcto else "no", "motivo": " | ".join(errores)})

    resumen = {
        "casos": len(casos), "correctos": correctos, "pct_correctos": _pct(correctos, len(casos)),
        "numeros_fuera": fuera, "numeros_total": total_numeros,
        "pct_alterados": _pct(fuera, total_numeros),
        "plantilla": plantilla, "pct_plantilla": _pct(plantilla, len(casos)),
        "filas": filas,
    }

    salida = io.StringIO()
    salida.write(f"# {ENCABEZADO}\n")
    salida.write("# Set dorado del verificador de cifras (kit v4 C3 paso 5; K-TEST 6; S9 §6 prueba 4). "
                 "Generado por motor/verificador.py (generar_reporte_eval); no se edita a mano.\n")
    salida.write(f"# casos correctos: {correctos} de {len(casos)} ({resumen['pct_correctos']} %)\n")
    salida.write(f"# cifras alteradas: {fuera} de {total_numeros} números en los casos aprobados "
                 f"({resumen['pct_alterados']} %; meta 0 %)\n")
    salida.write(f"# uso de plantilla: {plantilla} de {len(casos)} ({resumen['pct_plantilla']} %); "
                 "no hay llave de API de LLM: todos los textos son plantillas escritas a mano\n")
    escritor = csv.DictWriter(salida, fieldnames=["caso", "esperado", "obtenido", "correcto", "motivo"],
                              lineterminator="\n")
    escritor.writeheader()
    escritor.writerows(filas)

    ruta_salida = Path(ruta_salida)
    ruta_salida.parent.mkdir(parents=True, exist_ok=True)
    ruta_salida.write_text(salida.getvalue(), encoding="utf-8")
    return resumen


# --- Línea de comandos -----------------------------------------------------------------
def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    reporte = "--reporte" in argv
    rutas = [a for a in argv if a != "--reporte"]
    ruta = Path(rutas[0]) if rutas else RUTA_EXPLICACIONES

    codigo = 0
    resultado = verificar_archivo(ruta)
    if resultado:
        codigo = 1
        n = sum(len(v) for v in resultado.values())
        print(f"VERIFICADOR: {n} errores en {ruta}")
        for llave, errores in resultado.items():
            for e in errores:
                print(f"  {llave} · {e}")
    else:
        print("VERIFICADOR OK")
        print(f"  {ruta}: sin cifras escritas, marcadores con valor, citas permitidas, sin lenguaje prohibido")

    if reporte:
        r = generar_reporte_eval()
        print(f"  set dorado: {r['correctos']} de {r['casos']} correctos; cifras alteradas "
              f"{r['pct_alterados']} %; plantilla {r['pct_plantilla']} % → {RUTA_REPORTE.relative_to(RAIZ)}")
        if r["correctos"] != r["casos"] or r["numeros_fuera"]:
            codigo = 1
    return codigo


if __name__ == "__main__":
    sys.exit(main())
