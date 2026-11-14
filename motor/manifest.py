# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Genera web/data/manifest.json (kit v4 §2.5). Nunca se escribe a mano.

Contenido:
- fuentes_de_origen[]: copia de data/processed/fuentes.json (lo escribe
  motor/ensamblar.py con archivo, URL o API, fecha de consulta y sha256).
  Si no existe, lista vacía.
- cifras{}: una entrada por cada número que muestra la web, con
  clave (ruta JSON dentro del archivo), archivo, valor, fuente, fecha,
  script, etiqueta y mock.

De dónde sale cada campo:
- distrito, dotaciones y lluvia_pct del cubo: fuente, etiqueta y fecha de
  data/params.json (el cubo los copia de ahí).
- zona, opciones de cada parcela (lámina, plazo, compromiso, suelo, La gota y
  tope), parcelas.geojson y valores de explicaciones.json: son cálculos del
  motor. Si el bloque es simulado, la fuente dice «datos simulados» y el
  script es motor/simulados.py.
- mock: se decide por bloque con las marcas del propio archivo
  (cubo.meta.mock y cubo.meta.mock_campos; meta.mock de parcelas.geojson y de
  explicaciones.json). Si el cubo no trae la lista por campo, manda
  cubo.meta.mock.
- fecha: la del dato si params.json la tiene (fecha o fecha_consulta); en los
  cálculos, cubo.meta.generado o, si es null, la fecha de generación de este
  manifest. Lo que no tiene fecha queda en null y se cuenta en «avisos».

Uso:  python motor/manifest.py      (escribe web/data/manifest.json)
"""
import datetime
import json
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
SCRIPT_SIMULADOS = "motor/simulados.py"
SCRIPT_ENSAMBLADO = "motor/ensamblar.py"
FUENTE_SIMULADA = "Datos simulados (data/simulados.json y data/params.json); no son datos reales"
ETIQUETA_SIMULADA = "SIMULADO"
ETIQUETA_CALCULO = "Cálculo"

# Bloques numéricos de cada opción que la ficha muestra (kit C2 y X3.2).
BLOQUES_OPCION = ("agua.lamina_bruta", "agua.plazo_anios", "agua.plazo_restante",
                  "agua.compromiso_millares_ha", "suelo.dias_desnudo", "gota",
                  "gota_goteo_con_tope", "gota_goteo_sin_tope", "tope_consumo")
# Propiedades numéricas de cada parcela que muestran el mapa y la ficha (kit C1 y C2).
PROPIEDADES_PARCELA = ("area_ha", "ftw_confianza", "prob_max", "dias_suelo_desnudo_feb_abr",
                       "ndvi_ultimo_mes", "dias_suelo_desnudo_mediana", "edad_perenne_anios")


def leer_json(ruta):
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def es_numero(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def hojas_numericas(obj, ruta):
    """Recorre obj y devuelve [(ruta, número)]. Objetos con '.', listas con [i]."""
    if es_numero(obj):
        return [(ruta, obj)]
    salida = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            salida += hojas_numericas(v, f"{ruta}.{k}" if ruta else str(k))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            salida += hojas_numericas(v, f"{ruta}[{i}]")
    return salida


def obtener(obj, ruta_puntos):
    """obj['a']['b'] a partir de 'a.b'; None si falta algún tramo."""
    for parte in ruta_puntos.split("."):
        if not isinstance(obj, dict) or parte not in obj:
            return None
        obj = obj[parte]
    return obj


class Manifest:
    """Acumula las entradas de cifras y los avisos."""

    def __init__(self, hoy):
        self.hoy = hoy
        self.cifras = {}
        self.avisos = []

    def agregar(self, archivo, clave, valor, fuente, fecha, script, etiqueta, mock):
        llave = f"{Path(archivo).name}:{clave}"
        if llave in self.cifras:
            self.avisos.append(f"clave repetida: {llave}")
        if not fuente:
            self.avisos.append(f"sin fuente: {llave}")
        if not fecha:
            self.avisos.append(f"sin fecha: {llave}")
        if not script:
            self.avisos.append(f"sin script: {llave}")
        self.cifras[llave] = {"clave": clave, "archivo": archivo, "valor": valor, "fuente": fuente,
                              "fecha": fecha, "script": script, "etiqueta": etiqueta, "mock": bool(mock)}


def es_simulado(meta, bloque):
    """mock del bloque según las marcas del archivo (general y por campo)."""
    meta = meta or {}
    general = bool(meta.get("mock"))
    campos = meta.get("mock_campos")
    if not general:
        return False
    if isinstance(campos, list):
        return bloque in campos
    return True


def origen_calculo(meta, bloque, mock, hoy):
    """(fuente, fecha, script, etiqueta) de un número calculado por el motor."""
    meta = meta or {}
    fecha = meta.get("generado") or hoy
    if mock:
        return FUENTE_SIMULADA, fecha, SCRIPT_SIMULADOS, ETIQUETA_SIMULADA
    fuentes = meta.get("fuentes") or []
    scripts = meta.get("scripts") or {}
    script = scripts.get(bloque) or meta.get("script") or SCRIPT_ENSAMBLADO
    return ("; ".join(map(str, fuentes)) or None), fecha, script, ETIQUETA_CALCULO


def cifras_de_params(m, cubo, params, script_cubo, mock_de):
    """distrito, dotaciones y lluvia_pct: valor del cubo; fuente y etiqueta de params.json."""
    archivo = "web/data/cubo.json"

    def con_param(clave, valor, p, bloque):
        if p is None:
            m.avisos.append(f"params.json no tiene la entrada de {clave}")
            p = {}
        fecha = p.get("fecha") or p.get("fecha_consulta")
        m.agregar(archivo, clave, valor, p.get("fuente"), fecha, script_cubo, p.get("etiqueta"), mock_de(bloque))

    def comparar(clave, valor_cubo, valor_params):
        if valor_params is not None and valor_cubo != valor_params:
            m.avisos.append(f"{clave}: el cubo dice {valor_cubo} y params.json {valor_params}")

    distrito = cubo.get("distrito") or {}
    pares = (("distrito.boquilla.namo_hm3", "distrito.namo_hm3"),
             ("distrito.boquilla.almacenamiento_hm3", "distrito.almacenamiento_hm3"),
             ("distrito.acuifero_0831.disponibilidad_hm3_anio", "acuifero.disponibilidad_hm3_anio"))
    for clave_cubo, clave_params in pares:
        valor = obtener({"distrito": distrito}, clave_cubo)
        if not es_numero(valor):
            continue  # null: la web dice «no data»; no hay cifra que rastrear
        p = obtener(params, clave_params)
        comparar(clave_cubo, valor, (p or {}).get("valor"))
        con_param(clave_cubo, valor, p, "distrito")

    dot = cubo.get("dotaciones") or {}
    p_des = obtener(params, "dotaciones.deslizador")
    for k, v in (dot.get("deslizador") or {}).items():
        if es_numero(v):
            comparar(f"dotaciones.deslizador.{k}", v, ((p_des or {}).get("valor") or {}).get(k))
            con_param(f"dotaciones.deslizador.{k}", v, p_des, "dotaciones")
    for i, marca in enumerate(dot.get("marcas") or []):
        p_marca = obtener(params, f"dotaciones.{marca.get('id')}")
        for k in ("min", "max", "valor"):
            if es_numero(marca.get(k)):
                comparar(f"dotaciones.marcas[{i}].{k}", marca[k], ((p_marca or {}).get("valor") or {}).get(k))
                con_param(f"dotaciones.marcas[{i}].{k}", marca[k], p_marca, "dotaciones")
    if dot.get("equivalencia"):
        # Texto con cifras (1 millar/ha = 1,000 m³/ha = 10 cm): se rastrea a params.unidades.millar.
        con_param("dotaciones.equivalencia", dot["equivalencia"], obtener(params, "unidades.millar"), "dotaciones")

    p_lluvia = obtener(params, "lluvia_pct")
    for i, v in enumerate(cubo.get("lluvia_pct") or []):
        if es_numero(v):
            con_param(f"lluvia_pct[{i}]", v, p_lluvia, "lluvia_pct")


def generar(raiz=RAIZ, escribir=True, hoy=None):
    """Construye el manifest a partir de web/data/* y data/params.json.

    Devuelve el diccionario; con escribir=True lo guarda en web/data/manifest.json.
    """
    raiz = Path(raiz)
    hoy = hoy or datetime.date.today().isoformat()
    params = leer_json(raiz / "data/params.json")
    cubo = leer_json(raiz / "web/data/cubo.json")
    geo = leer_json(raiz / "web/data/parcelas.geojson")
    ruta_expl = raiz / "web/data/explicaciones.json"
    expl = leer_json(ruta_expl) if ruta_expl.exists() else None
    meta = cubo.get("meta") or {}
    m = Manifest(hoy)

    # Script que escribió el cubo: el simulador mientras el cubo sea simulado.
    script_cubo = SCRIPT_SIMULADOS if meta.get("mock") else (meta.get("script") or SCRIPT_ENSAMBLADO)

    def mock_cubo(bloque):
        return es_simulado(meta, bloque)

    # 1) distrito, dotaciones y lluvia_pct (fuente y etiqueta de params.json)
    cifras_de_params(m, cubo, params, script_cubo, mock_cubo)

    # 2) zona (B4)
    mock_zona = mock_cubo("zona")
    fuente, fecha, script, etiqueta = origen_calculo(meta, "zona", mock_zona, hoy)
    for ruta, valor in hojas_numericas(cubo.get("zona") or {}, "zona"):
        m.agregar("web/data/cubo.json", ruta, valor, fuente, fecha, script, etiqueta, mock_zona)

    # 3) opciones de cada parcela (B4 y X3.1)
    mock_op = mock_cubo("parcelas")
    fuente, fecha, script, etiqueta = origen_calculo(meta, "parcelas", mock_op, hoy)
    for pid, pc in (cubo.get("parcelas") or {}).items():
        for i, op in enumerate(pc.get("opciones") or []):
            base = f"parcelas.{pid}.opciones[{i}]"
            for bloque in BLOQUES_OPCION:
                for ruta, valor in hojas_numericas(obtener(op, bloque), f"{base}.{bloque}"):
                    m.agregar("web/data/cubo.json", ruta, valor, fuente, fecha, script, etiqueta, mock_op)
            dinero = op.get("dinero")
            if isinstance(dinero, dict):  # solo existe con fuente (contrato §2.3)
                for k in ("margen_min", "margen_max"):
                    if es_numero(dinero.get(k)):
                        m.agregar("web/data/cubo.json", f"{base}.dinero.{k}", dinero[k], dinero.get("fuente"),
                                  fecha, script, dinero.get("etiqueta") or ETIQUETA_CALCULO, mock_op)

    # 4) parcelas.geojson (B1, A3, A3-M y A4.2)
    meta_geo = geo.get("meta") or {}
    mock_geo = bool(meta_geo.get("mock", meta.get("mock")))
    fuente, fecha, script, etiqueta = origen_calculo({**meta, **meta_geo}, "parcelas_geojson", mock_geo, hoy)
    for i, f in enumerate(geo.get("features") or []):
        props = f.get("properties") or {}
        for k in PROPIEDADES_PARCELA:
            if es_numero(props.get(k)):
                m.agregar("web/data/parcelas.geojson", f"features[{i}].properties.{k}", props[k],
                          fuente, fecha, script, etiqueta, mock_geo)
        for j, anio in enumerate(props.get("memoria") or []):
            if es_numero((anio or {}).get("anio")):
                m.agregar("web/data/parcelas.geojson", f"features[{i}].properties.memoria[{j}].anio",
                          anio["anio"], fuente, fecha, script, etiqueta, mock_geo)

    # 5) valores de los marcadores de explicaciones.json (C3)
    if expl is not None:
        meta_e = expl.get("meta") or {}
        mock_e = bool(meta_e.get("mock", meta.get("mock")))
        fuente, fecha, script, etiqueta = origen_calculo({**meta, **meta_e}, "explicaciones", mock_e, hoy)
        for llave, v in (expl.get("explicaciones") or {}).items():
            for ruta, valor in hojas_numericas(v.get("valores") or {}, f"explicaciones.{llave}.valores"):
                m.agregar("web/data/explicaciones.json", ruta, valor, fuente, fecha, script, etiqueta, mock_e)
    else:
        m.avisos.append("web/data/explicaciones.json no existe")

    # Fuentes de origen (las escribe el ensamblador)
    ruta_fuentes = raiz / "data/processed/fuentes.json"
    fuentes_origen = []
    if ruta_fuentes.exists():
        crudo = leer_json(ruta_fuentes)
        fuentes_origen = crudo.get("fuentes", []) if isinstance(crudo, dict) else crudo
        if not isinstance(fuentes_origen, list):
            m.avisos.append("data/processed/fuentes.json no es una lista de fuentes")
            fuentes_origen = []
        for fo in fuentes_origen:
            faltan = [k for k in ("archivo", "url_o_api", "fecha_consulta", "sha256") if not (fo or {}).get(k)]
            if faltan:
                m.avisos.append(f"fuente de origen incompleta ({', '.join(faltan)}): {fo}")

    simuladas = sum(1 for c in m.cifras.values() if c["mock"])
    cifras = agrupar_cifras(m.cifras)
    manifest = {
        "_encabezado": ENCABEZADO,
        "_nota": "Generado por motor/manifest.py a partir de web/data/* y data/params.json; nunca se edita a mano (kit v4 §2.5).",
        "generado": hoy,
        "mock": bool(meta.get("mock")),
        "resumen": {"cifras": len(m.cifras), "patrones": len(cifras), "simuladas": simuladas,
                    "fuentes_de_origen": len(fuentes_origen), "avisos": len(m.avisos)},
        "avisos": m.avisos,
        "fuentes_de_origen": fuentes_origen,
        "_nota_cifras": "Agrupadas por patrón de ruta: parcelas.<id> -> parcelas.*, índices [n] -> [*]. Cada patrón lleva su fuente, fecha, script, etiqueta, número de valores y rango; así el manifiesto no crece con el número de parcelas.",
        "cifras": cifras,
    }
    if escribir:
        destino = raiz / "web/data/manifest.json"
        destino.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    return manifest


def agrupar_cifras(cifras):
    """Agrupa las cifras por patrón de ruta (sin id de parcela ni índice) para que el manifiesto
    no crezca con el número de parcelas. Conserva fuente, fecha, script, etiqueta y mock; si un
    patrón mezcla fuentes distintas, se guardan todas en una lista."""
    import re
    grupos = {}
    for c in cifras.values():
        patron = re.sub(r"parcelas\.[^.\[]+", "parcelas.*", c["clave"])
        patron = re.sub(r"\[\d+\]", "[*]", patron)
        llave = f"{Path(c['archivo']).name}:{patron}"
        g = grupos.setdefault(llave, {"clave": patron, "archivo": c["archivo"], "n": 0, "min": None, "max": None,
                                      "fuente": c["fuente"], "fecha": c["fecha"], "script": c["script"],
                                      "etiqueta": c["etiqueta"], "mock": c["mock"]})
        g["n"] += 1
        v = c["valor"]
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            g["min"] = v if g["min"] is None else min(g["min"], v)
            g["max"] = v if g["max"] is None else max(g["max"], v)
        for k in ("fuente", "etiqueta", "script"):
            if c[k] != g[k]:
                otros = g[k] if isinstance(g[k], list) else [g[k]]
                if c[k] not in otros:
                    g[k] = otros + [c[k]]
        g["mock"] = g["mock"] or c["mock"]
    return grupos


if __name__ == "__main__":
    man = generar()
    r = man["resumen"]
    print(f"manifest.json: {r['cifras']} cifras ({r['simuladas']} simuladas), "
          f"{r['fuentes_de_origen']} fuentes de origen, {r['avisos']} avisos")
    for a in man["avisos"][:10]:
        print(" aviso:", a)
    sys.exit(0)
