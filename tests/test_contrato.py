# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""K-TEST 8: contrato de datos v4 (kit §2.2–2.5) con validar_contrato.py.

1) Los archivos de web/data pasan el validador.
2) Un cubo alterado SÍ da error (si no, el validador no está validando).
3) manifest.json (§2.5) tiene una entrada por cada número de los bloques que muestra
   la web, con fuente, script y la marca de datos simulados; también las cifras por zona
   (cubo.zonas.<id>, con el bbox de params.zona_piloto.zonas), las localidades del equipo
   (params.zona_piloto.localidades_equipo) y las de web/data/relieve.json (tormenta con su
   fuente y periodo; umbral de las rutas con su etiqueta); TODAS las hojas numéricas de
   properties en parcelas.geojson (las de relieve con la fuente de relieve_parcelas.csv) y las
   cifras de web/data/pruebas.json que muestra «About & Data».
4) Cifras nuevas del motor (escenario de goteo, pendientes de la auditoría): los bloques de goteo llevan
   la fuente y la etiqueta de data/processed/supuestos.json; cubo.meta (eficiencias y ventana de suelo
   desnudo) y las variantes en inglés de dotaciones, las de params; rutas_depresiones de relieve.json,
   la fuente de la entrega relieve_meta y la etiqueta de su bloque.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
for ruta in (str(RAIZ), str(RAIZ / "motor")):
    if ruta not in sys.path:
        sys.path.insert(0, ruta)

import validar_contrato  # noqa: E402
from motor import manifest  # noqa: E402

ARCHIVOS = ("parcelas.geojson", "cubo.json", "explicaciones.json")


def leer(nombre):
    return json.loads((RAIZ / "web/data" / nombre).read_text(encoding="utf-8"))


def copia_alterada(tmp_path, alterar):
    """Copia web/data a tmp_path, aplica alterar(cubo, geo, expl) y devuelve la carpeta."""
    for n in ARCHIVOS:
        shutil.copy(RAIZ / "web/data" / n, tmp_path / n)
    cubo, geo, expl = leer("cubo.json"), leer("parcelas.geojson"), leer("explicaciones.json")
    alterar(cubo, geo, expl)
    for n, d in zip(ARCHIVOS, (geo, cubo, expl)):
        (tmp_path / n).write_text(json.dumps(d, ensure_ascii=False), encoding="utf-8")
    return tmp_path


def primera_opcion(cubo):
    # Primera opción que PIDE agua (lámina P50 > 0): las parcelas abstenidas no llevan opciones
    # (kit B4, paso 1) y una opción en descanso tiene lámina y flujos en cero, así que alterarla
    # no rompería nada y la prueba no probaría el validador.
    for pc in cubo["parcelas"].values():
        for op in pc["opciones"]:
            if op["agua"]["lamina_bruta"]["0"]["p50"] > 0:
                return op
    raise AssertionError("el cubo no tiene ninguna opción con lámina > 0")


# --- 1) datos actuales --------------------------------------------------------
def test_contrato_ok():
    errores = validar_contrato.validar(RAIZ / "web/data")
    assert errores == [], "\n".join(errores)


def test_cli_imprime_contrato_ok():
    p = subprocess.run([sys.executable, "validar_contrato.py"], cwd=RAIZ,
                       capture_output=True, text=True, encoding="utf-8")
    assert p.returncode == 0 and "CONTRATO OK" in p.stdout, p.stdout + p.stderr


# --- 2) alteraciones que deben fallar ------------------------------------------
def p50_mayor_que_p90(cubo, geo, expl):
    banda = primera_opcion(cubo)["agua"]["lamina_bruta"]["0"]
    banda["p50"] = banda["p90"] + banda["p50"]  # P50 > P90 a partir de los propios datos


def semaforo_de_agua_guardado(cubo, geo, expl):
    primera_opcion(cubo)["semaforo"]["agua"] = "verde"


def balance_de_gota_roto(cubo, geo, expl):
    g = primera_opcion(cubo)["gota"]
    g["m3_otras_perdidas"] = g["m3_otras_perdidas"] + g["m3_salen_presa"]


def opcion_con_goteo(cubo):
    """Primera opción con escenario de goteo; si el cubo no lo trae, la prueba se omite."""
    for pc in cubo["parcelas"].values():
        for op in pc["opciones"]:
            if op.get("gota_goteo_con_tope") and op.get("gota_goteo_sin_tope"):
                return op
    pytest.skip("el cubo actual no trae el escenario de goteo")


def balance_de_goteo_con_tope_roto(cubo, geo, expl):
    g = opcion_con_goteo(cubo)["gota_goteo_con_tope"]
    g["m3_regresan_acuifero"] = g["m3_regresan_acuifero"] + g["m3_salen_presa"]


def balance_de_goteo_sin_tope_roto(cubo, geo, expl):
    g = opcion_con_goteo(cubo)["gota_goteo_sin_tope"]
    g["m3_consume_cultivo_et"] = g["m3_consume_cultivo_et"] + g["m3_salen_presa"]


def tope_sin_veredicto(cubo, geo, expl):
    opcion_con_goteo(cubo)["tope_consumo"]["cumple_sin_tope"] = None


def digito_en_explicacion(cubo, geo, expl):
    llave = next(iter(expl["explicaciones"]))
    expl["explicaciones"][llave]["textos"]["por_que"] += " " + str(cubo["dotaciones"]["deslizador"]["max"])


def estado_plazo_fuera_de_lista(cubo, geo, expl):
    geo["features"][0]["properties"]["estado_plazo"] = "vendida"


# Dos zonas (decisión 2026-11-14): «zonas» y «localidades» las escribe motor/b4_cubo.py con datos reales.
def primera_zona(cubo):
    if not cubo.get("zonas"):
        pytest.skip("el cubo actual no trae «zonas» (datos simulados)")
    return next(iter(cubo["zonas"].values()))


def zona_de_parcela_fuera_de_params(cubo, geo, expl):
    geo["features"][0]["properties"]["zona"] = "zona_que_no_existe"


def bbox_de_zona_invertido(cubo, geo, expl):
    b = primera_zona(cubo)["bbox"]
    b[0], b[2] = b[2], b[0]


def zonas_no_suman_el_total(cubo, geo, expl):
    primera_zona(cubo)["superficie_total_ha"] += cubo["zona"]["superficie_total_ha"]


def demanda_de_zona_p50_mayor_que_p90(cubo, geo, expl):
    banda = primera_zona(cubo)["demanda_perenne_millares"]["0"]
    banda["p50"] = banda["p90"] + banda["p50"] + cubo["zona"]["superficie_total_ha"]


def localidad_con_latitud_fuera_de_rango(cubo, geo, expl):
    if not cubo.get("localidades"):
        pytest.skip("el cubo actual no trae «localidades»")
    cubo["localidades"][0]["lat"] = cubo["localidades"][0]["lat"] + 180


def localidad_sin_fuente(cubo, geo, expl):
    if not cubo.get("localidades"):
        pytest.skip("el cubo actual no trae «localidades»")
    cubo["localidades"][0]["fuente"] = ""


# Revisión de dda5abb (puntos 1–4): lo que el validador dejaba pasar o rechazaba sin motivo.
def propiedades(geo):
    return {f["properties"]["id"]: f["properties"] for f in geo["features"]}


def parcela_que_rota(cubo, geo):
    """Id de la primera parcela clasificada que NO es nogal y lleva ACTUAL + 2 o más opciones."""
    props = propiedades(geo)
    for pid, pc in cubo["parcelas"].items():
        if props[pid]["cultivo_actual"] != "nogal" and len(pc["opciones"]) >= 3:
            return pid
    pytest.skip("el cubo actual no trae una parcela que rote con ACTUAL + 2 opciones")


def nogal_sin_rotacion(cubo):
    """(id, bloque) de la primera parcela con «sin_rotacion»; si el cubo no la trae, la prueba se omite."""
    for pid, pc in cubo["parcelas"].items():
        if pc.get("sin_rotacion"):
            return pid, pc
    pytest.skip("el cubo actual no trae parcelas con sin_rotacion")


def abstenida_con_estado_plazo(cubo, geo, expl):
    p = next((f["properties"] for f in geo["features"] if f["properties"]["abstencion"]), None)
    if p is None:
        pytest.skip("el cubo actual no trae parcelas abstenidas")
    p["estado_plazo"] = "libre"


def sin_rotacion_en_cultivo_que_rota(cubo, geo, expl):
    """La exención de ACTUAL + 2 es del nogal que no rota: otra parcela con «sin_rotacion» no la tiene."""
    _, nogal = nogal_sin_rotacion(cubo)
    pc = cubo["parcelas"][parcela_que_rota(cubo, geo)]
    pc["opciones"] = [o for o in pc["opciones"] if o["id"] == "ACTUAL"]
    pc["sin_rotacion"] = dict(nogal["sin_rotacion"])


def sin_rotacion_con_letra_que_no_es_no_rota(cubo, geo, expl):
    """El nogal queda exento porque el catálogo dice letra_maestro = nogal_no_rota; sin esa letra, no."""
    _, nogal = nogal_sin_rotacion(cubo)
    rot = next(o["rotacion"] for o in nogal["opciones"] if o["id"] == "ACTUAL")
    cubo["opciones_catalogo"][rot]["letra_maestro"] = "ACTUAL"


def gota_en_null_con_goteo(cubo, geo, expl):
    """Sin La gota (lámina neta null) no puede haber escenario de goteo: los cuatro bloques van juntos."""
    opcion_con_goteo(cubo)["gota"] = None


ALTERACIONES = {
    "P50 > P90": (p50_mayor_que_p90, "P10 ≤ P50 ≤ P90"),
    "semáforo de agua guardado": (semaforo_de_agua_guardado, "semáforo de agua"),
    "balance de La gota roto": (balance_de_gota_roto, "balance no cierra"),
    "balance del goteo con tope roto": (balance_de_goteo_con_tope_roto, "gota_goteo_con_tope: el balance no cierra"),
    "balance del goteo sin tope roto": (balance_de_goteo_sin_tope_roto, "gota_goteo_sin_tope: el balance no cierra"),
    "tope de consumo sin veredicto": (tope_sin_veredicto, "cumple_sin_tope debe ser bool"),
    "dígito escrito en una explicación": (digito_en_explicacion, "dígitos fuera de los marcadores"),
    "estado_plazo fuera de lista": (estado_plazo_fuera_de_lista, "estado_plazo fuera de lista"),
    "zona de parcela fuera de params": (zona_de_parcela_fuera_de_params, "zona fuera de params.zona_piloto.zonas"),
    "bbox de zona invertido": (bbox_de_zona_invertido, "oeste debe ser < este"),
    "zonas que no suman el total": (zonas_no_suman_el_total, "no coincide con zona.superficie_total_ha"),
    "demanda de zona con P50 > P90": (demanda_de_zona_p50_mayor_que_p90, "P10 ≤ P50 ≤ P90"),
    "localidad con latitud fuera de rango": (localidad_con_latitud_fuera_de_rango, "localidades[0].lat"),
    "localidad sin fuente": (localidad_sin_fuente, "falta la fuente"),
    "abstenida con estado_plazo": (abstenida_con_estado_plazo, "parcela abstenida debe tener estado_plazo null"),
    "sin_rotacion en un cultivo que rota": (sin_rotacion_en_cultivo_que_rota, "sin_rotacion es del nogal que no rota"),
    "sin_rotacion sin la letra nogal_no_rota": (sin_rotacion_con_letra_que_no_es_no_rota,
                                               "sin_rotacion es del nogal que no rota"),
    "gota en null con escenario de goteo": (gota_en_null_con_goteo, "gota en null"),
}


@pytest.mark.parametrize("nombre", list(ALTERACIONES))
def test_cubo_alterado_da_error(tmp_path, nombre):
    alterar, mensaje = ALTERACIONES[nombre]
    errores = validar_contrato.validar(copia_alterada(tmp_path, alterar))
    assert errores, f"el validador aceptó un contrato con «{nombre}»"
    assert any(mensaje in e for e in errores), f"se esperaba un error con «{mensaje}»: {errores}"


def test_sin_actual_es_un_motivo_de_sin_opciones(tmp_path):
    """motor/b4_cubo.py escribe sin_opciones = «sin_actual» cuando no puede armar la opción ACTUAL; el
    validador lo acepta con las opciones vacías (como «sin_clima_zona») y lo rechaza con opciones."""
    assert "sin_actual" in validar_contrato.MOTIVOS_SIN_OPCIONES
    for sub in ("vacia", "con"):
        (tmp_path / sub).mkdir()

    def vacia(cubo, geo, expl):
        cubo["parcelas"][parcela_que_rota(cubo, geo)] = {"opciones": [], "sin_opciones": "sin_actual"}
    assert validar_contrato.validar(copia_alterada(tmp_path / "vacia", vacia)) == []

    def con_opciones(cubo, geo, expl):
        cubo["parcelas"][parcela_que_rota(cubo, geo)]["sin_opciones"] = "sin_actual"
    errores = validar_contrato.validar(copia_alterada(tmp_path / "con", con_opciones))
    assert any("solo con opciones vacías" in e for e in errores), errores


def test_opcion_sin_lamina_neta_lleva_los_cuatro_bloques_en_null(tmp_path):
    """Sin lámina neta (ET) La gota no se puede cerrar: gota, los dos goteos y el tope van en null y pasa."""
    def sin_neta(cubo, geo, expl):
        op = primera_opcion(cubo)
        for b in ("gota", "gota_goteo_con_tope", "gota_goteo_sin_tope", "tope_consumo"):
            op[b] = None
    assert validar_contrato.validar(copia_alterada(tmp_path, sin_neta)) == []


# --- 3) manifest.json (§2.5) -----------------------------------------------------
@pytest.fixture(scope="module")
def man():
    return manifest.generar(escribir=False)


def hojas(obj, ruta):
    return manifest.hojas_numericas(obj, ruta)


def test_manifest_cubre_cada_cifra_del_cubo(man):
    cubo = leer("cubo.json")
    esperadas = {r for r, _ in hojas(cubo["zona"], "zona")}
    for k in ("namo_hm3", "almacenamiento_hm3"):
        if isinstance(cubo["distrito"]["boquilla"].get(k), (int, float)):
            esperadas.add(f"distrito.boquilla.{k}")
    esperadas.add("distrito.acuifero_0831.disponibilidad_hm3_anio")
    esperadas |= {r for r, _ in hojas(cubo["dotaciones"]["deslizador"], "dotaciones.deslizador")}
    for i, _ in enumerate(cubo["dotaciones"]["marcas"]):
        esperadas |= {f"dotaciones.marcas[{i}].{k}" for k in ("min", "max", "valor")}
    for pid, pc in cubo["parcelas"].items():
        for i, op in enumerate(pc["opciones"]):
            base = f"parcelas.{pid}.opciones[{i}]"
            for b in ("agua.lamina_bruta", "agua.plazo_anios", "agua.plazo_restante",
                      "agua.compromiso_millares_ha", "gota", "gota_goteo_con_tope",
                      "gota_goteo_sin_tope", "tope_consumo"):
                esperadas |= {r for r, _ in hojas(manifest.obtener(op, b), f"{base}.{b}")}
    # Dos zonas (decisión 2026-11-14): cada zona con sus cifras y su bbox; localidades del equipo.
    for zid, z in (cubo.get("zonas") or {}).items():
        esperadas |= {r for r, _ in hojas(z, f"zonas.{zid}")}
    for i, _ in enumerate(cubo.get("localidades") or []):
        esperadas |= {f"localidades[{i}].{k}" for k in ("lat", "lon")}
    esperadas = {patron(r) for r in esperadas}
    claves = {c["clave"] for c in man["cifras"].values() if c["archivo"] == "web/data/cubo.json"}
    faltan = sorted(esperadas - claves)
    assert not faltan, f"cifras del cubo sin entrada en el manifest: {faltan[:10]}"


def patron(ruta):
    """El manifiesto agrupa por patrón (parcelas.<id> -> parcelas.*, zonas.<id> -> zonas.*,
    [n] -> [*]); la prueba arma el suyo para comparar sin depender de motor/manifest.py."""
    import re
    ruta = re.sub(r"parcelas\.[^.\[]+", "parcelas.*", ruta)
    ruta = re.sub(r"(^|\.)zonas\.[^.\[]+", r"\1zonas.*", ruta)
    return re.sub(r"\[\d+\]", "[*]", ruta)


def entrada(man, archivo, clave):
    """Entrada del manifest (por patrón) para la ruta «clave» de web/data/<archivo>."""
    return man["cifras"].get(f"{archivo}:{patron(clave)}")


def contiene(campo, valor):
    """El campo del manifest es el valor o una lista que lo incluye (patrón con varias fuentes)."""
    return campo == valor or (isinstance(campo, list) and valor in campo)


def test_manifest_zonas_y_localidades_con_su_fuente(man):
    cubo = leer("cubo.json")
    if not cubo.get("zonas"):
        pytest.skip("el cubo actual no trae «zonas» (datos simulados)")
    params = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
    p_zonas = params["zona_piloto"]["zonas"]
    meta = cubo["meta"]
    for zid, z in cubo["zonas"].items():
        # Cálculo de B4 por zona: script del cubo (motor/b4_cubo.py) o el simulador.
        for ruta, _ in hojas({k: v for k, v in z.items() if k != "bbox"}, f"zonas.{zid}"):
            e = entrada(man, "cubo.json", ruta)
            assert e, f"{ruta} sin entrada en el manifest"
            esperado = manifest.SCRIPT_SIMULADOS if e["mock"] else (meta.get("script") or manifest.SCRIPT_ENSAMBLADO)
            assert contiene(e["script"], esperado), f"{ruta}: script {e['script']}"
        # bbox: fuente y etiqueta de params.zona_piloto.zonas.
        for i in range(len(z["bbox"])):
            e = entrada(man, "cubo.json", f"zonas.{zid}.bbox[{i}]")
            assert e, f"zonas.{zid}.bbox[{i}] sin entrada en el manifest"
            assert contiene(e["fuente"], p_zonas["fuente"]) and contiene(e["etiqueta"], p_zonas["etiqueta"])
    p_loc = params["zona_piloto"]["localidades_equipo"]
    for i, _ in enumerate(cubo.get("localidades") or []):
        for k in ("lat", "lon"):
            e = entrada(man, "cubo.json", f"localidades[{i}].{k}")
            assert e, f"localidades[{i}].{k} sin entrada en el manifest"
            assert contiene(e["fuente"], p_loc["fuente"]) and contiene(e["etiqueta"], p_loc["etiqueta"])


def test_manifest_cubre_relieve(man):
    ruta = RAIZ / "web/data/relieve.json"
    if not ruta.exists():
        pytest.skip("sin web/data/relieve.json (la capa de relieve no se ha ejecutado)")
    relieve = json.loads(ruta.read_text(encoding="utf-8"))
    assert relieve.get("zonas"), "relieve.json sin zonas"
    for zid, z in relieve["zonas"].items():
        for r, _ in hojas(z, f"zonas.{zid}"):
            assert entrada(man, "relieve.json", r), f"relieve.json:{r} sin entrada en el manifest"
        t = z["tormenta"]
        if isinstance(t.get("mm"), (int, float)):
            e = entrada(man, "relieve.json", f"zonas.{zid}.tormenta.mm")
            assert contiene(e["fuente"], t["fuente"]), f"tormenta.mm: fuente {e['fuente']}"
            assert contiene(e.get("periodo"), t["periodo"]), f"tormenta.mm: periodo {e.get('periodo')}"
            assert e["min"] <= t["mm"] <= e["max"]
        if isinstance(z.get("umbral_ruta_ha"), (int, float)):
            e = entrada(man, "relieve.json", f"zonas.{zid}.umbral_ruta_ha")
            assert contiene(e["etiqueta"], z["umbral_ruta_etiqueta"]), f"umbral_ruta_ha: etiqueta {e['etiqueta']}"
        # El rótulo de escala lleva una cifra (resolución de NASADEM): también se rastrea.
        if any(ch.isdigit() for ch in z.get("rotulo") or ""):
            e = entrada(man, "relieve.json", f"zonas.{zid}.rotulo")
            assert e and z["rotulo"] in e.get("textos", []), "rótulo de escala sin entrada en el manifest"


def patrones_de_properties(geo):
    """Patrones (features[*].properties.<ruta>) de todas las hojas numéricas de properties."""
    salida = set()
    for i, f in enumerate(geo.get("features") or []):
        for r, _ in hojas(f.get("properties") or {}, ""):
            salida.add(patron(f"features[{i}].properties.{r}"))
    return salida


def test_manifest_cubre_cada_cifra_de_parcelas(man):
    # Regla 11: ninguna cifra de parcelas.geojson sin entrada (antes, una lista blanca las saltaba en silencio).
    geo = leer("parcelas.geojson")
    claves = {c["clave"] for c in man["cifras"].values() if c["archivo"] == "web/data/parcelas.geojson"}
    faltan = sorted(patrones_de_properties(geo) - claves)
    assert not faltan, f"cifras de parcelas.geojson sin entrada en el manifest: {faltan[:10]}"


def test_manifest_relieve_de_parcela_con_la_fuente_de_su_entrega(man):
    geo = leer("parcelas.geojson")
    hay = {r for r in patrones_de_properties(geo) if ".properties.relieve." in r}
    if not hay:
        pytest.skip("parcelas.geojson sin properties.relieve (A9 no se ha ejecutado)")
    entrega = manifest.entrega_de(man["fuentes_de_origen"], manifest.ENTREGA_RELIEVE_PARCELAS)
    for r in ("relieve.pendiente_media_pct", "relieve.aportacion_externa_ha", "relieve.frac_depresion"):
        e = man["cifras"].get(f"parcelas.geojson:features[*].properties.{r}")
        assert e, f"properties.{r} sin entrada en el manifest"
        if entrega and not e["mock"]:
            assert contiene(e["fuente"], entrega["fuente"]), f"{r}: fuente {e['fuente']}"
            assert contiene(e["fecha"], entrega.get("fecha_consulta") or entrega.get("fecha"))
            assert entrega["script"] in str(e["script"])


def test_manifest_avisa_cifra_de_parcela_sin_regla(tmp_path):
    raiz, _, _ = raiz_con_dos_zonas(tmp_path)
    ruta = raiz / "web/data/parcelas.geojson"
    geo = json.loads(ruta.read_text(encoding="utf-8"))
    props = geo["features"][0]["properties"]
    props["cifra_nueva"] = props["area_ha"]  # una propiedad numérica que motor/manifest.py no conoce
    ruta.write_text(json.dumps(geo, ensure_ascii=False), encoding="utf-8")
    man2 = manifest.generar(raiz=raiz, escribir=False)
    assert "parcelas.geojson:features[*].properties.cifra_nueva" in man2["cifras"], "no se registró"
    assert any("properties.cifra_nueva: cifra sin regla propia" in a for a in man2["avisos"]), man2["avisos"]


def test_manifest_cubre_pruebas_json(man):
    ruta = RAIZ / "web/data/pruebas.json"
    if not ruta.exists():
        pytest.skip("sin web/data/pruebas.json (paso 5c de construir.py)")
    pruebas = json.loads(ruta.read_text(encoding="utf-8"))
    for i, p in enumerate(pruebas["pruebas"]):
        for j, m in enumerate(p.get("metricas") or []):
            for k in ("valor", "total", "fraccion"):
                if isinstance(m.get(k), (int, float)):
                    e = entrada(man, "pruebas.json", f"pruebas[{i}].metricas[{j}].{k}")
                    assert e, f"pruebas.json: métrica {m['id']}.{k} sin entrada en el manifest"
                    assert contiene(e["fuente"], m.get("fuente")), f"{m['id']}: fuente {e['fuente']}"
        if any(ch.isdigit() for ch in p.get("criterio") or ""):
            e = entrada(man, "pruebas.json", f"pruebas[{i}].criterio")
            assert e and p["criterio"] in e.get("textos", []), f"criterio de {p['id']} sin entrada"


# --- 3b) manifest con dos zonas (copia temporal de los datos reales) ------------------
def raiz_con_dos_zonas(tmp_path, alterar=None):
    """Copia params, web/data y fuentes.json a tmp_path y, si el cubo trae una sola zona, añade la
    segunda de params.zona_piloto.zonas con las cifras de la primera (no se inventa ninguna) y su
    bbox de params; lo mismo en relieve.json. alterar(cubo, relieve) cambia algo antes de guardar."""
    (tmp_path / "data/processed").mkdir(parents=True)
    (tmp_path / "web/data").mkdir(parents=True)
    shutil.copy(RAIZ / "data/params.json", tmp_path / "data/params.json")
    if (RAIZ / "data/processed/fuentes.json").exists():
        shutil.copy(RAIZ / "data/processed/fuentes.json", tmp_path / "data/processed/fuentes.json")
    for n in ARCHIVOS + ("relieve.json",):
        if (RAIZ / "web/data" / n).exists():
            shutil.copy(RAIZ / "web/data" / n, tmp_path / "web/data" / n)
    cubo = leer("cubo.json")
    if not cubo.get("zonas"):
        pytest.skip("el cubo actual no trae «zonas» (datos simulados)")
    params = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
    ids = [z["id"] for z in params["zona_piloto"]["zonas"]["valor"]]
    if len(ids) < 2:
        pytest.skip("params.zona_piloto.zonas tiene una sola zona")
    primera = next(iter(cubo["zonas"].values()))
    for z in params["zona_piloto"]["zonas"]["valor"]:
        if z["id"] not in cubo["zonas"]:
            cubo["zonas"][z["id"]] = {**json.loads(json.dumps(primera)), "nombre": z["id"],
                                      "nombre_mostrar": z["nombre"], "bbox": list(z["bbox"])}
    relieve = None
    if (tmp_path / "web/data/relieve.json").exists():
        relieve = json.loads((tmp_path / "web/data/relieve.json").read_text(encoding="utf-8"))
        base = next(iter(relieve["zonas"].values()))
        for zid in ids:
            relieve["zonas"].setdefault(zid, json.loads(json.dumps(base)))
    if alterar:
        alterar(cubo, relieve)
    (tmp_path / "web/data/cubo.json").write_text(json.dumps(cubo, ensure_ascii=False), encoding="utf-8")
    if relieve is not None:
        (tmp_path / "web/data/relieve.json").write_text(json.dumps(relieve, ensure_ascii=False), encoding="utf-8")
    return tmp_path, cubo, relieve


def test_manifest_dos_zonas_agrupa_por_zona(tmp_path):
    raiz, cubo, relieve = raiz_con_dos_zonas(tmp_path)
    man2 = manifest.generar(raiz=raiz, escribir=False)
    assert not (raiz / "web/data/manifest.json").exists(), "escribir=False no debe escribir"
    nz = len(cubo["zonas"])
    assert nz >= 2
    # Un patrón por cifra (zonas.*), con un valor por zona; el bbox, cuatro por zona.
    e = man2["cifras"]["cubo.json:zonas.*.superficie_total_ha"]
    assert e["n"] == nz
    bbox = man2["cifras"]["cubo.json:zonas.*.bbox[*]"]
    todos = [v for z in cubo["zonas"].values() for v in z["bbox"]]
    assert bbox["n"] == len(todos) and bbox["min"] == min(todos) and bbox["max"] == max(todos)
    assert not [a for a in man2["avisos"] if ".bbox: el cubo dice" in a], man2["avisos"]
    de_zonas = [k for k in man2["cifras"] if k.startswith("cubo.json:zonas.")]
    assert de_zonas and all(k.startswith("cubo.json:zonas.*.") for k in de_zonas), \
        "el id de zona no debe quedar en la clave del manifest"
    if relieve is not None:
        mm = man2["cifras"]["relieve.json:zonas.*.tormenta.mm"]
        assert mm["n"] == len(relieve["zonas"])
        # Una zona sin entrega propia en fuentes.json: su fecha queda en null y se avisa.
        fuentes = man2["fuentes_de_origen"]
        for z in relieve["zonas"]:
            if manifest.entrega_de_relieve(fuentes, z) is None:
                assert f"sin fecha: relieve.json:zonas.{z}.tormenta.mm" in man2["avisos"]


def test_manifest_avisa_si_el_cubo_no_coincide_con_params(tmp_path):
    def alterar(cubo, relieve):
        ultima = list(cubo["zonas"])[-1]
        b = cubo["zonas"][ultima]["bbox"]
        b[0] = b[0] - (b[2] - b[0])  # bbox distinto del de params (a partir de los propios datos)
        if cubo.get("localidades"):
            cubo["localidades"][0]["lat"] = cubo["localidades"][0]["lat"] + cubo["localidades"][0]["lat"]
    raiz, cubo, _ = raiz_con_dos_zonas(tmp_path, alterar)
    man2 = manifest.generar(raiz=raiz, escribir=False)
    ultima = list(cubo["zonas"])[-1]
    assert any(a.startswith(f"zonas.{ultima}.bbox: el cubo dice") for a in man2["avisos"]), man2["avisos"]
    if cubo.get("localidades"):
        assert any(a.startswith("localidades[0].lat: el cubo dice") for a in man2["avisos"]), man2["avisos"]


def test_manifest_valores_y_campos(man):
    cubo = leer("cubo.json")
    for llave, c in man["cifras"].items():
        for campo in ("clave", "archivo", "n", "min", "max", "fuente", "fecha", "script", "etiqueta", "mock"):
            assert campo in c, f"{llave}: falta {campo}"
        assert c["fuente"] and c["script"], f"{llave}: sin fuente o sin script"
        if c["archivo"] == "web/data/cubo.json" and "*" not in c["clave"] and isinstance(c["min"], (int, float)):
            # Patrón sin comodines = una sola ruta: su valor es el del cubo en esa ruta.
            assert c["n"] == 1 and c["min"] == c["max"] == valor_en_ruta(cubo, c["clave"]), llave


def test_manifest_marca_lo_simulado(man):
    meta = leer("cubo.json")["meta"]
    assert man["mock"] == bool(meta.get("mock"))
    if meta.get("mock"):
        zona = [c for c in man["cifras"].values() if c["clave"].startswith("zona.")]
        assert zona and all(c["mock"] for c in zona), "las cifras simuladas de zona deben llevar mock: true"
        assert all(c["script"] == manifest.SCRIPT_SIMULADOS for c in zona)
    # distrito y dotaciones toman fuente y etiqueta de data/params.json
    params = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
    namo = man["cifras"]["cubo.json:distrito.boquilla.namo_hm3"]
    assert namo["fuente"] == params["distrito"]["namo_hm3"]["fuente"]
    assert namo["etiqueta"] == params["distrito"]["namo_hm3"]["etiqueta"]


def valor_en_ruta(obj, ruta):
    """Lee una ruta «a.b[0].c» (la notación del manifest)."""
    for parte in ruta.split("."):
        nombre, *indices = parte.split("[")
        if nombre:
            obj = obj[nombre]
        for ind in indices:
            obj = obj[int(ind.rstrip("]"))]
    return obj


def test_manifest_no_altera_el_contrato():
    # Generar el manifest no debe tocar los archivos del contrato.
    antes = {n: (RAIZ / "web/data" / n).read_bytes() for n in ARCHIVOS}
    manifest.generar(escribir=False)
    assert all((RAIZ / "web/data" / n).read_bytes() == b for n, b in antes.items())


# --- 4) cifras nuevas: goteo, meta, variantes en inglés y rutas cortadas -------------------------
def test_manifest_goteo_con_la_fuente_y_la_etiqueta_de_supuestos(man):
    cubo = leer("cubo.json")
    g = cubo["meta"].get("goteo") or {}
    if cubo["meta"].get("mock") or not g.get("disponible"):
        pytest.skip("el cubo actual no trae el escenario de goteo real")
    sup = json.loads((RAIZ / "data/processed/supuestos.json").read_text(encoding="utf-8"))
    entrega = manifest.entrega_de(man["fuentes_de_origen"], manifest.ENTREGA_SUPUESTOS) or {}
    campos = ["m3_salen_presa", "m3_perdidas_canal", "m3_llegan_parcela", "m3_consume_cultivo_et",
              "m3_regresan_acuifero", "m3_otras_perdidas"]
    claves = [f"{b}.{c}" for b in ("gota_goteo_con_tope", "gota_goteo_sin_tope") for c in campos]
    claves += ["tope_consumo.et_historica_m3", "tope_consumo.et_goteo_sin_tope_m3"]
    n = sum(1 for pc in cubo["parcelas"].values() for op in pc["opciones"] if op["gota_goteo_con_tope"])
    for clave in claves:
        e = man["cifras"].get(f"cubo.json:parcelas.*.opciones[*].{clave}")
        assert e and e["n"] == n, f"{clave}: sin entrada o con otro número de valores"
        assert e["fuente"] == sup["ea_goteo"]["fuente"], f"{clave}: fuente {e['fuente']}"
        assert e["etiqueta"] == sup["ea_goteo"]["etiqueta"], f"{clave}: etiqueta {e['etiqueta']}"
        assert "motor/b4_cubo.py" in e["script"]
        if entrega:
            assert entrega["script"] in e["script"] and e["fecha"] == (entrega.get("fecha_consulta") or entrega.get("fecha"))
    # El bloque «gota» (riego actual) sigue siendo cálculo del motor: no hereda la etiqueta del goteo.
    actual = man["cifras"]["cubo.json:parcelas.*.opciones[*].gota.m3_salen_presa"]
    assert actual["etiqueta"] == manifest.ETIQUETA_CALCULO
    # Las eficiencias mismas, con su fuente y su etiqueta; el rango de A5, con las suyas.
    for clave in ("ea_goteo", "ea_superficial_referencia"):
        e = man["cifras"][f"cubo.json:meta.goteo.{clave}.valor"]
        assert (e["min"], e["fuente"], e["etiqueta"]) == (sup[clave]["valor"], sup[clave]["fuente"], sup[clave]["etiqueta"])
    rango = man["cifras"]["cubo.json:meta.goteo.zonas.*.ea_gravedad.valor[*]"]
    valores = [v for z in g["zonas"].values() for v in z["ea_gravedad"]["valor"]]
    assert rango["n"] == len(valores) and (rango["min"], rango["max"]) == (min(valores), max(valores))
    assert contiene(rango["etiqueta"], next(iter(g["zonas"].values()))["ea_gravedad"]["etiqueta"])


def test_manifest_ventana_de_suelo_y_textos_en_ingles_con_la_fuente_de_params(man):
    cubo = leer("cubo.json")
    if cubo["meta"].get("mock") or "ventana_desnudo" not in cubo["meta"]:
        pytest.skip("cubo simulado: los simulados no llevan estos campos")
    params = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
    p = params["suelo"]["ventana_desnudo"]
    for k in ("inicio", "fin"):
        e = man["cifras"][f"cubo.json:meta.ventana_desnudo.{k}"]
        assert e["textos"] == [p["valor"][k]] and (e["fuente"], e["etiqueta"]) == (p["fuente"], p["etiqueta"])
    millar = params["unidades"]["millar"]
    e = man["cifras"]["cubo.json:dotaciones.equivalencia_en"]
    assert e["textos"] == [millar["nota_en"]] and (e["fuente"], e["etiqueta"]) == (millar["fuente"], millar["etiqueta"])
    # La nota en inglés de una marca se registra si lleva cifras, con la fuente de su marca.
    con_cifras = [(i, m) for i, m in enumerate(cubo["dotaciones"]["marcas"]) if any(c.isdigit() for c in m.get("nota_en") or "")]
    assert con_cifras, "al menos una nota en inglés lleva cifras (la de la marca de pozos)"
    for i, m in con_cifras:
        e = entrada(man, "cubo.json", f"dotaciones.marcas[{i}].nota_en")
        assert e and m["nota_en"] in e["textos"] and contiene(e["fuente"], params["dotaciones"][m["id"]]["fuente"])
    # Son copias de params: el manifest no debe avisar que el cubo dice otra cosa.
    distintos = [a for a in man["avisos"] if ("nota_en" in a and "no coincide" in a)
                 or ("ventana_desnudo" in a and "el cubo dice" in a)]
    assert not distintos, distintos


def test_manifest_rutas_depresiones_con_la_fuente_de_relieve_meta(man):
    ruta = RAIZ / "web/data/relieve.json"
    if not ruta.exists():
        pytest.skip("sin web/data/relieve.json (la capa de relieve no se ha ejecutado)")
    relieve = json.loads(ruta.read_text(encoding="utf-8"))
    con_bloque = {z: b["rutas_depresiones"] for z, b in relieve["zonas"].items() if b.get("rutas_depresiones")}
    if not con_bloque:
        pytest.skip("relieve.json sin rutas_depresiones (A9 no lo entregó)")
    for zid, dep in con_bloque.items():
        entrega = manifest.entrega_de_relieve(man["fuentes_de_origen"], zid) or {}
        for k, v in dep.items():
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                e = entrada(man, "relieve.json", f"zonas.{zid}.rutas_depresiones.{k}")
                assert e and e["min"] <= v <= e["max"], f"rutas_depresiones.{k} sin entrada en el manifest"
                assert contiene(e["etiqueta"], dep["etiqueta"]), f"{k}: etiqueta {e['etiqueta']}"
                if entrega:
                    assert contiene(e["fuente"], entrega["fuente"]), f"{k}: fuente {e['fuente']}"
                    assert entrega["script"] in str(e["script"])
        if any(c.isdigit() for c in dep.get("nota") or ""):
            e = entrada(man, "relieve.json", f"zonas.{zid}.rutas_depresiones.nota")
            assert e and dep["nota"] in e["textos"] and contiene(e["etiqueta"], dep["etiqueta"])
    assert not [a for a in man["avisos"] if "rutas_depresiones" in a and "sin regla propia" in a], man["avisos"]


def test_manifest_cubre_la_ficha_completa(man):
    """Etapa 2 de la ficha (decisión del gemelo §5 y del suelo): la lámina local de referencia de cada opción y la
    constante de la equivalencia (cubo), los umbrales del NDVI (ndvi_mensual.json), los supuestos y la alcalinidad
    de suelo (suelo.json) y GEDI por parcela (contexto.json) tienen su entrada, con fuente y etiqueta."""
    cubo = leer("cubo.json")
    claves = {c["clave"] for c in man["cifras"].values() if c["archivo"] == "web/data/cubo.json"}
    esperadas = set()
    for pid, pc in cubo["parcelas"].items():
        for i, op in enumerate(pc["opciones"]):
            ll = (op.get("agua") or {}).get("lamina_local")
            if isinstance(ll, dict):
                esperadas |= {patron(r) for r, _ in hojas(ll, f"parcelas.{pid}.opciones[{i}].agua.lamina_local")}
    if "lamina_cm_por_millar" in cubo["dotaciones"]:
        esperadas.add("dotaciones.lamina_cm_por_millar.valor")
    faltan = sorted(esperadas - claves)
    assert not faltan, f"cifras de la ficha sin entrada en el manifest: {faltan[:10]}"
    for clave in [c for c in claves if ".lamina_local." in c]:
        e = man["cifras"][f"cubo.json:{clave}"]
        assert e["fuente"] and e["etiqueta"], clave
    por_archivo = {}
    for c in man["cifras"].values():
        por_archivo.setdefault(c["archivo"], set()).add(c["clave"])
    ruta = RAIZ / "web/data"
    if (ruta / "ndvi_mensual.json").exists():
        ndvi = json.loads((ruta / "ndvi_mensual.json").read_text(encoding="utf-8"))
        for clave, u in (ndvi.get("umbrales") or {}).items():
            if u:
                e = man["cifras"][f"ndvi_mensual.json:umbrales.{clave}.valor"]
                assert e["min"] == e["max"] == u["valor"] and e["fuente"] == u["fuente"] and e["etiqueta"] == u["etiqueta"]
    if (ruta / "suelo.json").exists():
        suelo = json.loads((ruta / "suelo.json").read_text(encoding="utf-8"))
        for clave in ("margen_ph", "coincidencia_textura"):
            if suelo.get(clave):
                e = man["cifras"][f"suelo.json:{clave}.valor"]
                assert e["min"] == e["max"] == suelo[clave]["valor"] and e["fuente"] == suelo[clave]["fuente"]
        if suelo.get("perfil"):
            assert "perfil.parcelas.*.ph" in por_archivo["web/data/suelo.json"]
        if suelo.get("alcalinidad_zona"):
            assert "alcalinidad_zona.zonas.*.n_sobre_optimo" in por_archivo["web/data/suelo.json"]
    if (ruta / "contexto.json").exists():
        ctx = json.loads((ruta / "contexto.json").read_text(encoding="utf-8"))
        if (ctx.get("gedi") or {}).get("parcelas"):
            assert "gedi.parcelas.*.altura_mediana_m" in por_archivo["web/data/contexto.json"]


# --- Regla 11 en la integración (etapa 3): cada cifra de gemelo, contexto, suelo y NDVI registrada -----------------
ARCHIVOS_NUEVOS = {
    "gemelo.json": lambda r: r,
    "contexto.json": manifest.renombrar_contexto,
    "suelo.json": manifest.renombrar_suelo,
    "ndvi_mensual.json": lambda r: r,
}


def _rutas_a_registrar(nombre, datos):
    """(ruta del manifest, valor) de cada hoja numérica y cada texto con cifras que la página puede mostrar."""
    renombrar = ARCHIVOS_NUEVOS[nombre]
    salida = []
    for ruta, v in manifest.hojas_numericas(datos, ""):
        if not ruta.startswith("_"):
            salida.append((renombrar(ruta), v))
    for ruta, v in manifest.textos_con_digitos(datos, ""):
        ruta = ruta.lstrip(".")
        if ruta.startswith("_") or ruta.split(".")[0] in ("generado", "decision"):
            continue
        if nombre == "contexto.json" and re.search(r"\.meses\[\d+\]$", ruta):
            # Los meses de una serie se registran como su periodo (una entrada por lista).
            salida.append((renombrar(re.sub(r"\[\d+\]$", "", ruta)) + ".periodo", None))
            continue
        salida.append((renombrar(ruta), v))
    return salida


def test_manifest_registra_cada_cifra_de_gemelo_contexto_suelo_y_ndvi(man):
    """Toda hoja numérica y todo texto con cifras de los cuatro archivos tiene su entrada (por patrón), con fuente y
    script; los números caen en el rango de su patrón. Con los datos de hoy, ninguno queda «sin regla propia»."""
    revisados = 0
    for nombre in ARCHIVOS_NUEVOS:
        ruta = RAIZ / "web/data" / nombre
        if not ruta.exists():
            continue
        datos = json.loads(ruta.read_text(encoding="utf-8"))
        faltan = []
        for clave, v in _rutas_a_registrar(nombre, datos):
            e = man["cifras"].get(f"{nombre}:{patron(clave)}")
            if e is None:
                faltan.append(clave)
                continue
            assert e["script"], f"{nombre}:{clave} sin script"
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                assert e["min"] <= v <= e["max"], f"{nombre}:{clave} = {v} fuera de [{e['min']}, {e['max']}]"
            elif isinstance(v, str):
                assert v in (e.get("textos") or []), f"{nombre}:{clave}: texto sin registrar"
            revisados += 1
        assert not faltan, f"{nombre}: cifras sin entrada en el manifest: {faltan[:8]}"
        sin_regla = [a for a in man["avisos"] if a.startswith(f"{nombre}:") and "sin regla propia" in a]
        assert not sin_regla, sin_regla
    assert revisados > 0


def test_manifest_contexto_cada_serie_con_su_producto_y_su_periodo(man):
    ruta = RAIZ / "web/data/contexto.json"
    if not ruta.exists():
        pytest.skip("sin web/data/contexto.json")
    ctx = json.loads(ruta.read_text(encoding="utf-8"))
    for zona, series in (ctx.get("contexto_regional") or {}).items():
        for clave, s in series.items():
            e = man["cifras"][f"contexto.json:contexto_regional.zonas.*.{clave}.valores[*]"]
            # La fuente cita el producto de ESA serie (su tramo de la línea de LEEME), no la de otra.
            assert any(f"{s['fuente_id']} = " in f for f in (e["fuente"] if isinstance(e["fuente"], list) else [e["fuente"]]))
            p = man["cifras"][f"contexto.json:contexto_regional.zonas.*.{clave}.meses.periodo"]
            assert f"{s['meses'][0]} … {s['meses'][-1]}" in p["textos"]
            if s.get("malla_mascon"):
                m = man["cifras"][f"contexto.json:contexto_regional.zonas.*.{clave}.malla_mascon.mascon_grados"]
                assert m["min"] == s["malla_mascon"]["mascon_grados"] and m["etiqueta"]
    # El clima del año: lluvia de IMERG con la fuente de imerg_diaria; ETo con la de eto_diaria.
    for zona, b in (ctx.get("clima_anual") or {}).items():
        imerg = man["cifras"]["contexto.json:clima_anual.zonas.*.anios[*].lluvia_imerg_mm"]
        eto = man["cifras"]["contexto.json:clima_anual.zonas.*.anios[*].eto_mm"]
        assert contiene(imerg["fuente"], b["fuentes"]["imerg"]["fuente"])
        assert contiene(eto["fuente"], b["fuentes"]["power"]["fuente"])


def test_barrido_registra_y_avisa_lo_que_no_tiene_regla():
    """Una cifra nueva sin regla propia no se salta: se registra con la fuente del archivo y se avisa una vez."""
    m = manifest.Manifest("2026-11-15")
    datos = {"_encabezado": "AI-assisted 2026", "generado": "2026-11-15", "bloque_nuevo": {"a": [1, 2], "texto": "en 2026"}}
    manifest.barrer(m, "web/data/suelo.json", datos, lambda r: r, ("fuente del archivo", None, "motor/suelo_web.py", "x"))
    claves = sorted(c["clave"] for c in m.cifras.values())
    assert claves == ["bloque_nuevo.a[0]", "bloque_nuevo.a[1]", "bloque_nuevo.texto"]
    avisos = [a for a in m.avisos if "sin regla propia" in a]
    assert len(avisos) == 2 and any("bloque_nuevo.a[*]" in a for a in avisos)
    # Lo ya registrado no se repite.
    manifest.barrer(m, "web/data/suelo.json", datos, lambda r: r, ("fuente del archivo", None, "motor/suelo_web.py", "x"))
    assert len(m.cifras) == 3 and not [a for a in m.avisos if "clave repetida" in a]


def test_manifest_registra_h1b_junto_a_h1(man):
    ruta = RAIZ / "web/data/pruebas.json"
    if not ruta.exists():
        pytest.skip("sin web/data/pruebas.json")
    pruebas = json.loads(ruta.read_text(encoding="utf-8"))
    for i, p in enumerate(pruebas["pruebas"]):
        for j, c in enumerate(p.get("complementos") or []):
            for k, met in enumerate(c.get("metricas") or []):
                e = man["cifras"][f"pruebas.json:pruebas[*].complementos[*].metricas[*].valor"]
                assert e["min"] <= met["valor"] <= e["max"] and contiene(e["fuente"], met["fuente"])
