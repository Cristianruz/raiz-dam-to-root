# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Motor B4 (motor/b4_cubo.py) con una y con dos zonas (decisión docs/decisiones/2026-11-14_dos_zonas.md).

(a) Con data/processed actual (una zona, sin propiedad «zona» ni sufijos): «zonas» trae solo
    delicias_saucillo, igual al bloque «zona», las llaves de explicaciones no cambian y CONTRATO OK.
(b) Con la fixture de dos zonas (tests/fixtures/b4_dos_zonas, DATOS DE PRUEBA derivados de
    data/processed por su generar.py): cada parcela usa las láminas de SU zona, hay dos bloques en
    «zonas» que suman el total, las explicaciones van por zona y CONTRATO OK.
(c) Zona con parcelas pero sin sus archivos de clima y demanda: sus parcelas quedan sin opciones,
    con motivo y aviso; nunca se usa el clima de otra zona. CONTRATO OK.
(d) Zona que no está en params: B4 no escribe nada y lo dice.
(e) Escenario de goteo de La gota (kit X3.1): sin supuestos.json los tres bloques quedan en null con la
    nota de siempre; con las eficiencias (fixture DE PRUEBA tests/fixtures/opciones_b3/supuestos.json, o las
    de data/processed) cada bloque sale de las fórmulas del kit, su balance cierra y lleva la etiqueta de
    supuestos.json; si la referencia superficial queda fuera del rango de A5, la zona no lleva goteo.
(f) Pendientes de la auditoría: etiqueta de La Boquilla y del acuífero, meta.fuentes sin archivos ocultos,
    variantes en inglés de los textos de dotaciones y la ventana de suelo desnudo, todo copiado de params.
Las opciones y los filtros oficiales (B3) se prueban en tests/test_opciones_b3.py.
Todo se escribe en carpetas temporales: web/data no se toca.
"""
import csv
import datetime as dt
import json
import re
import shutil
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
for ruta in (str(RAIZ), str(RAIZ / "motor")):
    if ruta not in sys.path:
        sys.path.insert(0, ruta)

import validar_contrato  # noqa: E402
from motor import b4_cubo  # noqa: E402

PROCESSED = RAIZ / "data/processed"
FIXTURE = RAIZ / "tests/fixtures/b4_dos_zonas/processed"
PARAMS = json.loads((RAIZ / "data/params.json").read_text(encoding="utf-8"))
CFG = json.loads((RAIZ / "data/opciones_b4.json").read_text(encoding="utf-8"))
ZONAS_PARAMS = {z["id"]: z for z in PARAMS["zona_piloto"]["zonas"]["valor"]}
DZ, LC = "delicias_saucillo", "lazaro_cardenas"
SUPERFICIES = validar_contrato.SUPERFICIES
WEB = RAIZ / "web/data"


def leer(carpeta, nombre):
    return json.loads((Path(carpeta) / nombre).read_text(encoding="utf-8"))


def correr(processed, tmp_path):
    """Corre B4 sobre `processed` y escribe en tmp_path/web; devuelve (reporte, geo, cubo, expl, carpeta)."""
    web = tmp_path / "web"
    antes = {n: (WEB / n).read_bytes() for n in ("parcelas.geojson", "cubo.json", "explicaciones.json") if (WEB / n).exists()}
    rep = b4_cubo.construir(processed, web)
    assert all((WEB / n).read_bytes() == b for n, b in antes.items()), "B4 tocó web/data en una prueba"
    assert rep["ejecutado"], rep
    return rep, leer(web, "parcelas.geojson"), leer(web, "cubo.json"), leer(web, "explicaciones.json"), web


def laminas_de_zona(processed, zona):
    """{opción: lamina{r:{p10,p50,p90}}} leídas directamente de los archivos de la zona."""
    suf = "" if zona == DZ else f"_{zona}"
    rot = json.loads((processed / f"rotaciones{suf}.json").read_text(encoding="utf-8"))
    lam = {r["id"]: {k: {q: r["lamina_bruta_millares"][k][q] for q in ("p10", "p50", "p90")}
                     for k in b4_cubo.LLUVIAS} for r in rot["rotaciones"]}
    ruta = processed / f"demanda_cultivos{suf}.csv"
    dem = {}
    if ruta.exists():
        with open(ruta, encoding="utf-8", newline="") as f:
            for r in csv.DictReader(f):
                dem.setdefault(r["cultivo"], {})[str(int(float(r["lluvia_pct"])))] = {
                    q: float(r[f"bruta_millares_{q}"]) for q in ("p10", "p50", "p90")}
    for cultivo, v in dem.items():
        lam.setdefault(cultivo, v)  # la rotación manda; la demanda solo cubre los cultivos sueltos
    return lam


def rot_ref(op, cultivo):
    """Id de rotación de una opción del cubo (ACTUAL -> rotación actual del cultivo)."""
    return CFG["actual"][cultivo] if op["id"] == "ACTUAL" else op["id"]


def sin_metadatos(bloque):
    return {k: v for k, v in bloque.items() if k not in ("nombre", "nombre_mostrar", "bbox", "clima_disponible")}


def comprobar_suma(cubo):
    """Superficies, demanda y conteos de «zonas» suman los de «zona» (tolerancia de redondeo)."""
    zs, total = list(cubo["zonas"].values()), cubo["zona"]
    for k in SUPERFICIES:
        assert sum(z[k] for z in zs) == pytest.approx(total[k], abs=0.01 * len(zs)), k
    for r in b4_cubo.LLUVIAS:
        for q in ("p10", "p50", "p90"):
            assert sum(z["demanda_perenne_millares"][r][q] for z in zs) == pytest.approx(
                total["demanda_perenne_millares"][r][q], abs=0.01 * len(zs)), (r, q)
    for k in total["conteos"]:
        assert sum(z["conteos"][k] for z in zs) == total["conteos"][k], k


# --- (a) datos actuales: una zona ----------------------------------------------------
def procesados_una_zona(destino):
    """Copia de data/processed reducida a UNA zona en el formato anterior a la decisión de dos zonas:
    solo las parcelas de delicias_saucillo (o sin «zona»), SIN la propiedad «zona», y solo los
    archivos sin sufijo de zona. Sirve igual si data/processed trae una zona o dos."""
    destino.mkdir(parents=True, exist_ok=True)
    otras = [z for z in ZONAS_PARAMS if z != DZ]
    for f in PROCESSED.iterdir():
        if f.is_file() and not any(f.stem.endswith(f"_{z}") for z in otras):
            shutil.copyfile(f, destino / f.name)
    ruta = destino / "parcelas_base.geojson"
    base = json.loads(ruta.read_text(encoding="utf-8"))
    base["features"] = [f for f in base["features"] if f["properties"].get("zona") in (None, DZ)]
    for f in base["features"]:
        f["properties"].pop("zona", None)
    ruta.write_text(json.dumps(base, ensure_ascii=False), encoding="utf-8")
    return destino


@pytest.fixture(scope="module")
def una_zona(tmp_path_factory):
    if any(not (PROCESSED / f).exists() for f in b4_cubo.OBLIGATORIAS):
        pytest.skip("data/processed no tiene las entradas obligatorias de B4 (se usan simulados)")
    tmp = tmp_path_factory.mktemp("una_zona")
    proc = procesados_una_zona(tmp / "processed")
    return correr(proc, tmp) + (proc,)


def test_una_zona_un_solo_bloque_y_contrato_ok(una_zona):
    rep, geo, cubo, expl, web, _ = una_zona
    assert list(cubo["zonas"]) == [DZ]
    z = cubo["zonas"][DZ]
    assert sin_metadatos(z) == sin_metadatos(cubo["zona"]), "con una zona, «zonas» debe ser igual al total"
    assert z["bbox"] == ZONAS_PARAMS[DZ]["bbox"] and z["nombre_mostrar"] == ZONAS_PARAMS[DZ]["nombre"]
    assert z["clima_disponible"] is True and rep["zonas_sin_clima"] == []
    assert validar_contrato.validar(web) == []


def test_una_zona_compatibilidad(una_zona):
    """Parcela sin «zona» = delicias_saucillo; llaves EXP_ZONA_<rotación> como antes; láminas de los
    archivos sin sufijo."""
    _, geo, cubo, expl, _, proc = una_zona
    base = json.loads((proc / "parcelas_base.geojson").read_text(encoding="utf-8"))
    assert base["features"] and all("zona" not in f["properties"] for f in base["features"])
    esperada = {f["properties"]["id"]: DZ for f in base["features"]}
    assert {f["properties"]["id"]: f["properties"]["zona"] for f in geo["features"]} == esperada
    assert all(not k.startswith(f"EXP_ZONA_{DZ}_") for k in expl["explicaciones"])
    lam = laminas_de_zona(proc, DZ)
    props = {f["properties"]["id"]: f["properties"] for f in geo["features"]}
    for pid, pc in cubo["parcelas"].items():
        for op in pc["opciones"]:
            ref = rot_ref(op, props[pid]["cultivo_actual"])
            assert op["agua"]["lamina_bruta"] == lam[ref], (pid, op["id"])
            # Una opción que agrega el equipo con un nombre distinto del de la tabla oficial lleva su propia
            # explicación (misma llave más el sufijo); las demás, la llave de siempre.
            del_equipo = op["preguntas_ref"].endswith(b4_cubo.SUFIJO_EXPL_PROPUESTA)
            assert op["preguntas_ref"] == f"EXP_ZONA_{ref}" + (b4_cubo.SUFIJO_EXPL_PROPUESTA if del_equipo else "")
            if del_equipo:
                assert op["origen_opcion"] == b4_cubo.ORIGEN_OPCION_PROPUESTA and op["id"] != "ACTUAL", (pid, op["id"])
                assert expl["explicaciones"][op["preguntas_ref"]]["textos"]["por_que"].startswith(op["nombre"])
                oficial = expl["explicaciones"].get(f"EXP_ZONA_{ref}")   # solo si alguna parcela lleva la oficial
                assert oficial is None or expl["explicaciones"][op["preguntas_ref"]]["valores"] == oficial["valores"]


def test_localidades_de_params(una_zona):
    cubo = una_zona[2]
    loc = PARAMS["zona_piloto"]["localidades_equipo"]
    # fuente_en: la misma cita en inglés (campo paralelo; la página la prefiere).
    assert cubo["localidades"] == [{"nombre": x["nombre"], "municipio": x["municipio"], "lat": x["lat"],
                                    "lon": x["lon"], "fuente": loc["fuente"], "fuente_en": loc["fuente_en"]}
                                   for x in loc["valor"]]


# --- (b) fixture de dos zonas ----------------------------------------------------------
def test_fixture_es_pequena_y_derivada():
    peso = sum(p.stat().st_size for p in FIXTURE.parent.rglob("*") if p.is_file())
    assert peso < 2 * 1024 * 1024, f"la fixture pesa {peso} bytes"
    rot_lc = json.loads((FIXTURE / f"rotaciones_{LC}.json").read_text(encoding="utf-8"))
    factor = rot_lc["_prueba"]["factor"]  # dato de prueba, anotado en el propio archivo
    assert factor != 1
    lam_dz, lam_lc = laminas_de_zona(FIXTURE, DZ), laminas_de_zona(FIXTURE, LC)
    assert set(lam_dz) == set(lam_lc)
    for rid in lam_dz:
        for r in b4_cubo.LLUVIAS:
            for q in ("p10", "p50", "p90"):
                assert lam_lc[rid][r][q] == pytest.approx(lam_dz[rid][r][q] * factor, abs=0.006), (rid, r, q)
    geo = json.loads((FIXTURE / "parcelas_base.geojson").read_text(encoding="utf-8"))
    for f in geo["features"]:
        p = f["properties"]
        assert p["id"].startswith(ZONAS_PARAMS[p["zona"]]["prefijo_id"]), p["id"]


@pytest.fixture(scope="module")
def dos_zonas(tmp_path_factory):
    return correr(FIXTURE, tmp_path_factory.mktemp("dos_zonas"))


def test_dos_zonas_bloques_suman_y_contrato_ok(dos_zonas):
    rep, geo, cubo, expl, web = dos_zonas
    assert list(cubo["zonas"]) == [DZ, LC]
    for z in (DZ, LC):
        assert cubo["zonas"][z]["bbox"] == ZONAS_PARAMS[z]["bbox"]
        assert cubo["zonas"][z]["nombre_mostrar"] == ZONAS_PARAMS[z]["nombre"]
        n = sum(1 for f in geo["features"] if f["properties"]["zona"] == z)
        assert n > 0 and cubo["zonas"][z]["conteos"]["total"] == n == rep["zonas"][z]
    comprobar_suma(cubo)
    assert validar_contrato.validar(web) == []


def test_dos_zonas_cada_parcela_usa_las_laminas_de_su_zona(dos_zonas):
    _, geo, cubo, expl, _ = dos_zonas
    lam = {z: laminas_de_zona(FIXTURE, z) for z in (DZ, LC)}
    revisadas = {DZ: 0, LC: 0}
    for f in geo["features"]:
        p = f["properties"]
        assert p["id"].startswith(ZONAS_PARAMS[p["zona"]]["prefijo_id"])
        otra = LC if p["zona"] == DZ else DZ
        for op in cubo["parcelas"][p["id"]]["opciones"]:
            ref = rot_ref(op, p["cultivo_actual"])
            assert op["agua"]["lamina_bruta"] == lam[p["zona"]][ref], (p["id"], op["id"])
            if lam[otra][ref]["0"]["p50"] > 0:  # «descanso» pide cero en las dos zonas
                assert op["agua"]["lamina_bruta"] != lam[otra][ref], f"{p['id']} usa las láminas de {otra}"
            assert op["preguntas_ref"] == f"EXP_ZONA_{p['zona']}_{ref}"
            revisadas[p["zona"]] += 1
    assert revisadas[DZ] and revisadas[LC], revisadas
    # El cultivo suelto (cereal de invierno) sale de demanda_cultivos de SU zona.
    cereal = [f["properties"]["id"] for f in geo["features"] if f["properties"]["cultivo_actual"] == "cereal_invierno"]
    assert cereal, "la fixture debe traer la parcela de cereal de invierno"


def test_dos_zonas_explicaciones_por_zona(dos_zonas):
    _, _, cubo, expl, _ = dos_zonas
    lam = {z: laminas_de_zona(FIXTURE, z) for z in (DZ, LC)}
    refs = {op["preguntas_ref"] for pc in cubo["parcelas"].values() for op in pc["opciones"]}
    assert refs == set(expl["explicaciones"])
    for llave, v in expl["explicaciones"].items():
        zona = DZ if llave.startswith(f"EXP_ZONA_{DZ}_") else LC
        assert llave.startswith(f"EXP_ZONA_{zona}_"), llave
        rid = llave[len(f"EXP_ZONA_{zona}_"):]
        assert v["valores"]["f1"] == lam[zona][rid]["0"]["p50"], llave


# --- (c) zona sin clima ------------------------------------------------------------------
def test_zona_sin_clima_queda_sin_opciones_con_aviso(tmp_path):
    processed = tmp_path / "processed"
    shutil.copytree(FIXTURE, processed)
    (processed / f"rotaciones_{LC}.json").unlink()
    (processed / f"demanda_cultivos_{LC}.csv").unlink()
    rep, geo, cubo, expl, web = correr(processed, tmp_path)

    assert rep["zonas_sin_clima"] == [LC]
    aviso = [a for a in rep["avisos"] if LC in a and f"rotaciones_{LC}.json" in a]
    assert aviso and aviso[0] in cubo["meta"]["notas"]
    lam_dz = laminas_de_zona(FIXTURE, DZ)
    for f in geo["features"]:
        p = f["properties"]
        pc = cubo["parcelas"][p["id"]]
        if p["zona"] == LC:
            assert pc["opciones"] == [], f"{p['id']} tiene opciones sin el clima de su zona"
            if not p["abstencion"]:
                assert pc["sin_opciones"] == b4_cubo.SIN_CLIMA_ZONA
        elif not p["abstencion"]:
            assert pc["opciones"] and all(op["agua"]["lamina_bruta"] == lam_dz[rot_ref(op, p["cultivo_actual"])]
                                          for op in pc["opciones"])
    assert cubo["zonas"][LC]["clima_disponible"] is False and cubo["zonas"][DZ]["clima_disponible"] is True
    assert cubo["zonas"][LC]["superficie_perenne_ha"] == 0
    # Una sola zona con datos: llaves sin prefijo de zona (compatibilidad).
    assert all(not k.startswith(f"EXP_ZONA_{DZ}_") for k in expl["explicaciones"])
    comprobar_suma(cubo)
    assert validar_contrato.validar(web) == []


def test_parcela_clasificada_sin_opciones_ni_motivo_rompe_el_contrato(tmp_path):
    """El motivo es lo que permite una parcela clasificada sin opciones; sin él, el contrato falla."""
    processed = tmp_path / "processed"
    shutil.copytree(FIXTURE, processed)
    (processed / f"rotaciones_{LC}.json").unlink()
    web = correr(processed, tmp_path)[4]
    cubo = leer(web, "cubo.json")
    pid = next(k for k, v in cubo["parcelas"].items() if v.get("sin_opciones"))
    del cubo["parcelas"][pid]["sin_opciones"]
    (web / "cubo.json").write_text(json.dumps(cubo, ensure_ascii=False), encoding="utf-8")
    assert any(pid in e and "falta la opción ACTUAL" in e for e in validar_contrato.validar(web))


# --- (d) zona desconocida -------------------------------------------------------------------
def test_zona_fuera_de_params_no_escribe(tmp_path):
    processed = tmp_path / "processed"
    shutil.copytree(FIXTURE, processed)
    ruta = processed / "parcelas_base.geojson"
    geo = json.loads(ruta.read_text(encoding="utf-8"))
    geo["features"][0]["properties"]["zona"] = "zona_que_no_existe"
    ruta.write_text(json.dumps(geo), encoding="utf-8")
    with pytest.raises(ValueError, match="zona_que_no_existe"):
        b4_cubo.construir(processed, tmp_path / "web")
    assert not (tmp_path / "web").exists()


# --- (e) escenario de goteo (kit X3.1) -----------------------------------------------------
FIX_B3 = RAIZ / "tests/fixtures/opciones_b3"   # supuestos.json, heladas.json y opciones_b3.json DE PRUEBA
M3_MILLAR = PARAMS["unidades"]["millar"]["valor"]["m3_por_ha"]
CONDUCCION = PARAMS["eficiencia"]["conduccion"]["valor"]["media"]
C_RETORNO = PARAMS["gota"]["c_retorno_superficial"]["valor"]
BLOQUES_GOTEO = ("gota_goteo_con_tope", "gota_goteo_sin_tope", "tope_consumo")
NOTA_SIN_GOTEO = "Drip scenario not available"
TOL = 0.31  # m³: cada flujo va redondeado a un decimal (hasta 0.05 por sumando) más el error de coma flotante


def procesados_con(tmp, supuestos=None, base=FIXTURE):
    """Copia de la fixture de dos zonas en tmp/processed más, si se da, un supuestos.json (dict)."""
    processed = tmp / "processed"
    shutil.copytree(base, processed)
    if supuestos is not None:
        (processed / "supuestos.json").write_text(json.dumps(supuestos, ensure_ascii=False), encoding="utf-8")
    return processed


def supuestos_de_prueba(**cambios):
    """supuestos.json DE PRUEBA de la fixture, con cambios por clave (None = quitar la clave)."""
    sup = json.loads((FIX_B3 / "supuestos.json").read_text(encoding="utf-8"))
    for clave, valor in cambios.items():
        if valor is None:
            sup.pop(clave, None)
        else:
            sup[clave] = {**sup.get(clave, {}), **valor}
    return sup


def opciones_con_area(geo, cubo):
    """(parcela, opción) de todas las opciones del cubo, con las propiedades de la parcela."""
    props = {f["properties"]["id"]: f["properties"] for f in geo["features"]}
    for pid, pc in cubo["parcelas"].items():
        for op in pc["opciones"]:
            yield props[pid], op


def comprobar_goteo_x31(geo, cubo, ea_goteo, ea_superficial):
    """Las comprobaciones de la PRUEBA del kit X3.1 más las fórmulas, opción por opción.
    Devuelve cuántas opciones llevan escenario de goteo y cuántas no (las que no piden agua)."""
    con_goteo = sin_agua = 0
    for p, op in opciones_con_area(geo, cubo):
        g = op["gota"]
        con, sin, tope = (op[b] for b in BLOQUES_GOTEO)
        donde = f"{p['id']}/{op['id']}"
        if g is None:
            # Sin lámina neta no hay La gota ni goteo (ver test_sin_lamina_neta_…): los cuatro van en null.
            assert con is None and sin is None and tope is None, f"{donde}: goteo sin La gota"
            continue
        if not g["m3_salen_presa"] > 0:
            assert con is None and sin is None and tope is None, f"{donde}: una opción sin agua no lleva goteo"
            sin_agua += 1
            continue
        con_goteo += 1
        assert con and sin and tope, f"{donde}: falta un bloque de goteo"
        # Fórmulas (lectura declarada en motor/b4_cubo.py), desde los datos de la opción.
        llegan = op["agua"]["lamina_bruta"]["0"]["p50"] * M3_MILLAR * p["area_ha"]
        salen = llegan / CONDUCCION
        et = g["m3_consume_cultivo_et"]
        llegan_g = min(llegan, max(et / ea_goteo, llegan * ea_superficial / ea_goteo))
        salen_g = llegan_g / CONDUCCION
        et_sin = et * salen / salen_g
        esperado_con = {"m3_salen_presa": salen_g, "m3_perdidas_canal": salen_g - llegan_g, "m3_llegan_parcela": llegan_g,
                        "m3_consume_cultivo_et": et, "m3_regresan_acuifero": C_RETORNO * salen_g}
        esperado_sin = {"m3_salen_presa": salen, "m3_perdidas_canal": salen - llegan, "m3_llegan_parcela": llegan,
                        "m3_consume_cultivo_et": et_sin, "m3_regresan_acuifero": min(C_RETORNO * salen, salen - et_sin)}
        for nombre, bloque, esperado in (("con tope", con, esperado_con), ("sin tope", sin, esperado_sin)):
            for k, v in esperado.items():
                assert bloque[k] == pytest.approx(v, rel=1e-6, abs=TOL), f"{donde} goteo {nombre}: {k}"
            # Balance: destinos = presa y canal + parcela = presa; ningún flujo negativo.
            destinos = bloque["m3_consume_cultivo_et"] + bloque["m3_regresan_acuifero"] + bloque["m3_otras_perdidas"]
            assert destinos == pytest.approx(bloque["m3_salen_presa"], abs=TOL), f"{donde} goteo {nombre}: balance"
            assert bloque["m3_perdidas_canal"] + bloque["m3_llegan_parcela"] == pytest.approx(bloque["m3_salen_presa"], abs=TOL)
            assert all(bloque[k] >= 0 for k in validar_contrato.CAMPOS_GOTA), f"{donde} goteo {nombre}: flujo negativo"
        # Con tope: misma ET; baja la presa Y baja el retorno al acuífero.
        assert con["m3_consume_cultivo_et"] == g["m3_consume_cultivo_et"]
        assert con["m3_salen_presa"] < g["m3_salen_presa"], f"{donde}: con tope no baja la presa"
        assert con["m3_regresan_acuifero"] < g["m3_regresan_acuifero"], f"{donde}: con tope no baja el acuífero"
        # Sin tope: misma presa, más ET que la histórica y el retorno nunca mayor que el actual (cota superior).
        assert sin["m3_salen_presa"] == g["m3_salen_presa"]
        assert sin["m3_regresan_acuifero"] <= g["m3_regresan_acuifero"]
        assert tope["et_historica_m3"] == g["m3_consume_cultivo_et"]
        assert tope["et_goteo_sin_tope_m3"] == sin["m3_consume_cultivo_et"]
        if et > 0:
            assert sin["m3_consume_cultivo_et"] > g["m3_consume_cultivo_et"], f"{donde}: sin tope la ET no sube"
            assert tope["cumple_sin_tope"] is False
        assert tope["base_historica"]
    return con_goteo, sin_agua


def test_goteo_sin_supuestos_queda_en_null_con_la_nota_de_siempre(dos_zonas):
    """La fixture de dos zonas no trae supuestos.json: no hay eficiencia de goteo con fuente."""
    _, _, cubo, _, _ = dos_zonas
    for pc in cubo["parcelas"].values():
        for op in pc["opciones"]:
            assert all(op[b] is None for b in BLOQUES_GOTEO), op["id"]
    assert any(n.startswith(NOTA_SIN_GOTEO) for n in cubo["meta"]["notas"])
    assert cubo["meta"]["goteo"]["disponible"] is False and "supuestos.json" in cubo["meta"]["goteo"]["motivo"]


@pytest.fixture(scope="module")
def con_goteo(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("con_goteo")
    sup = supuestos_de_prueba()
    return correr(procesados_con(tmp, sup), tmp) + (sup,)


def test_goteo_formulas_y_balance_del_kit_x31(con_goteo):
    rep, geo, cubo, _, web, sup = con_goteo
    n_con, n_sin = comprobar_goteo_x31(geo, cubo, sup["ea_goteo"]["valor"], sup["ea_superficial_referencia"]["valor"])
    assert n_con > 0 and n_sin > 0, "la fixture debe traer opciones con agua y en descanso"
    assert rep["goteo"] is True and rep["con_goteo"] == n_con
    assert validar_contrato.validar(web) == []


def test_goteo_lleva_la_fuente_y_la_etiqueta_de_supuestos(con_goteo):
    _, _, cubo, _, _, sup = con_goteo
    meta = cubo["meta"]["goteo"]
    assert meta["disponible"] is True and meta["archivo"] == "data/processed/supuestos.json"
    assert meta["retorno_sin_tope_es_cota_superior"] is True   # X3.1: sin tope el retorno es una cota superior
    for clave in ("ea_goteo", "ea_superficial_referencia"):
        assert meta[clave] == {k: sup[clave][k] for k in ("valor", "etiqueta", "fuente")}
    for z in (DZ, LC):
        # La eficiencia con que A5 calculó las láminas de la zona: la de rotaciones[_zona].json.
        suf = "" if z == DZ else f"_{z}"
        rot = json.loads((FIXTURE / f"rotaciones{suf}.json").read_text(encoding="utf-8"))
        assert meta["zonas"][z]["disponible"] is True
        assert meta["zonas"][z]["ea_gravedad"]["valor"] == rot["params"]["ea_gravedad"]["valor"]
        assert meta["zonas"][z]["ea_gravedad"]["archivo"] == f"data/processed/rotaciones{suf}.json"
    etiqueta = sup["ea_goteo"]["etiqueta"]
    for pc in cubo["parcelas"].values():
        for op in pc["opciones"]:
            for b in ("gota_goteo_con_tope", "gota_goteo_sin_tope"):
                if op[b] is not None:
                    assert etiqueta in op[b]["supuestos"][0], "el primer supuesto del bloque lleva la etiqueta"
    # La nota «not available» se reemplaza por la que dice que los valores son indicativos y no locales.
    notas = cubo["meta"]["notas"]
    assert not any(n.startswith(NOTA_SIN_GOTEO) for n in notas)
    nota = [n for n in notas if "indicative values" in n and "not measured in this district" in n]
    assert nota and etiqueta in nota[0] and sup["ea_goteo"]["fuente"] in nota[0]
    # La lectura de X3.1 se declara sin «saving» (CLAUDE.md, regla 10: ni para negar; tests/test_opciones_b3.py).
    assert any("X3.1" in n and "the larger of" in n and "more conservative reading" in n for n in notas), \
        "falta declarar la lectura de X3.1"


def test_goteo_la_entrega_nunca_baja_de_et_entre_ea_goteo():
    """Lectura conservadora: la entrega con goteo es la MAYOR de las dos lecturas. Con una opción cuya
    eficiencia implícita ya supera la referencia superficial manda ET ÷ ea_goteo (flujos de prueba)."""
    goteo = {"ea_goteo": {"valor": 0.8, "etiqueta": "TEST"}, "ea_superficial_referencia": {"valor": 0.5, "etiqueta": "TEST"}}
    llegan = 100.0
    for et, esperada in ((70.0, 70.0 / 0.8), (30.0, llegan * 0.5 / 0.8)):
        f = {"llegan": llegan, "salen": llegan / CONDUCCION, "et": et, "conduccion": CONDUCCION, "c_ret": C_RETORNO}
        con, sin, tope = b4_cubo.bloques_goteo(f, goteo)
        assert con["m3_llegan_parcela"] == pytest.approx(esperada, abs=0.05)
        assert con["m3_llegan_parcela"] >= et / 0.8 - 0.05, "la entrega no alcanza para la ET con la eficiencia de goteo"
        assert sin["m3_consume_cultivo_et"] <= 0.8 * llegan + 0.05, "sin tope la ET no puede pasar de ea_goteo × entrega"
    # Una opción que no pide agua no tiene escenario de goteo.
    cero = {"llegan": 0.0, "salen": 0.0, "et": 0.0, "conduccion": CONDUCCION, "c_ret": C_RETORNO}
    assert b4_cubo.bloques_goteo(cero, goteo) == (None, None, None)


@pytest.mark.parametrize("cambios, clave", [
    ({"ea_goteo": None}, "ea_goteo"),                                   # falta la clave
    ({"ea_goteo": {"valor": None}}, "ea_goteo"),                        # valor pendiente
    ({"ea_goteo": {"fuente": ""}}, "sin fuente"),                       # sin fuente no hay escenario
    ({"ea_superficial_referencia": {"etiqueta": None}}, "sin etiqueta"),
    ({"ea_superficial_referencia": None}, "ea_superficial_referencia"),
    ({"ea_goteo": {"valor": 0.5}}, "no es mayor"),                      # igual a la referencia: no cambia nada
])
def test_goteo_sin_valor_con_fuente_no_hay_escenario(tmp_path, cambios, clave):
    processed = procesados_con(tmp_path, supuestos_de_prueba(**cambios))
    goteo, motivo = b4_cubo.leer_goteo(processed)
    assert goteo is None and clave in motivo
    rep, _, cubo, _, web = correr(processed, tmp_path)
    assert rep["goteo"] is False and rep["con_goteo"] == 0
    assert any(n.startswith(NOTA_SIN_GOTEO) for n in cubo["meta"]["notas"])
    assert cubo["meta"]["goteo"] == {"disponible": False, "motivo": motivo}
    assert validar_contrato.validar(web) == []


def test_goteo_referencia_fuera_del_rango_de_a5_deja_la_zona_sin_goteo(tmp_path):
    """La referencia superficial debe caer en el rango de eficiencia con que A5 calculó las láminas."""
    rot = json.loads((FIXTURE / "rotaciones.json").read_text(encoding="utf-8"))
    minimo = rot["params"]["ea_gravedad"]["valor"][0]
    processed = procesados_con(tmp_path, supuestos_de_prueba(ea_superficial_referencia={"valor": minimo / 2}))
    rep, _, cubo, _, web = correr(processed, tmp_path)
    assert rep["goteo"] is False
    assert all(op[b] is None for pc in cubo["parcelas"].values() for op in pc["opciones"] for b in BLOQUES_GOTEO)
    avisos = [a for a in rep["avisos"] if "ea_superficial_referencia" in a and "fuera del rango" in a]
    assert len(avisos) == 2 and all(a in cubo["meta"]["notas"] for a in avisos), rep["avisos"]
    assert validar_contrato.validar(web) == []


def test_goteo_con_los_datos_actuales(una_zona):
    """Con las eficiencias de data/processed/supuestos.json (si ya traen ea_goteo con fuente)."""
    _, geo, cubo, _, web, proc = una_zona
    goteo, motivo = b4_cubo.leer_goteo(proc)
    if goteo is None:
        pytest.skip(f"data/processed sin eficiencia de goteo con fuente: {motivo}")
    n_con, _ = comprobar_goteo_x31(geo, cubo, goteo["ea_goteo"]["valor"], goteo["ea_superficial_referencia"]["valor"])
    assert n_con > 0
    sup = json.loads((proc / "supuestos.json").read_text(encoding="utf-8"))
    assert cubo["meta"]["goteo"]["ea_goteo"]["etiqueta"] == sup["ea_goteo"]["etiqueta"]
    assert cubo["meta"]["goteo"]["ea_goteo"]["fuente"] == sup["ea_goteo"]["fuente"]


def test_cubo_publicado_goteo_cumple_x31():
    """web/data/cubo.json (el que ve la página): si trae el escenario de goteo, cumple la prueba del kit X3.1."""
    cubo, geo = leer(WEB, "cubo.json"), leer(WEB, "parcelas.geojson")
    meta = cubo["meta"].get("goteo") or {}
    if cubo["meta"].get("mock") or not meta.get("disponible"):
        pytest.skip("el cubo publicado no trae el escenario de goteo real")
    n_con, _ = comprobar_goteo_x31(geo, cubo, meta["ea_goteo"]["valor"], meta["ea_superficial_referencia"]["valor"])
    assert n_con > 0
    assert (WEB / "cubo.json").stat().st_size < 5 * 1024 * 1024


# --- (f) pendientes de la auditoría: lo que la página debe poder leer del cubo ------------------
def test_distrito_lleva_la_etiqueta_y_la_fuente_de_params(dos_zonas):
    cubo = dos_zonas[2]
    b, a = cubo["distrito"]["boquilla"], cubo["distrito"]["acuifero_0831"]
    namo, alm = PARAMS["distrito"]["namo_hm3"], PARAMS["distrito"]["almacenamiento_hm3"]
    acu = PARAMS["acuifero"]["disponibilidad_hm3_anio"]
    assert (b["fuente_namo"], b["etiqueta_namo"]) == (namo["fuente"], namo["etiqueta"])
    assert (b["fuente_almacenamiento"], b["etiqueta_almacenamiento"]) == (alm["fuente"], alm["etiqueta"])
    assert (a["fuente"], a["etiqueta"]) == (acu["fuente"], acu["etiqueta"])
    assert b["etiqueta_namo"] and a["etiqueta"]


def test_meta_fuentes_no_lista_archivos_ocultos(tmp_path):
    processed = procesados_con(tmp_path)
    (processed / ".gitkeep").write_text("", encoding="utf-8")
    cubo = correr(processed, tmp_path)[2]
    fuentes = cubo["meta"]["fuentes"]
    assert not [f for f in fuentes if Path(f).name.startswith(".")], fuentes
    assert "data/processed/rotaciones.json" in fuentes and "data/params.json" in fuentes


def numeros(texto):
    """Los números de un texto (para comprobar que la traducción no cambia ninguno)."""
    return sorted(re.findall(r"\d[\d,.]*\d|\d", texto or ""))


def test_textos_en_ingles_copiados_de_params_sin_cambiar_los_originales(dos_zonas):
    dot = dos_zonas[2]["dotaciones"]
    dz = PARAMS["dotaciones"]
    for m in dot["marcas"]:
        p = dz[m["id"]]
        assert m["nota"] == p["nota"], "el campo original no cambia"
        assert m["nota_en"] == p["nota_en"] and m["nota_en"]
        assert numeros(m["nota_en"]) == numeros(m["nota"]), f"{m['id']}: la nota en inglés cambia una cifra"
    millar = PARAMS["unidades"]["millar"]
    assert dot["equivalencia"] == millar["nota"] and dot["equivalencia_en"] == millar["nota_en"]
    assert numeros(dot["equivalencia_en"]) == numeros(dot["equivalencia"])
    pm = dz["punto_medicion"]
    assert dot["punto_medicion"] == f"{pm['valor']} {pm['etiqueta']}; {pm['nota']}"
    assert dot["punto_medicion_en"] == f"{pm['valor_en']} {pm['etiqueta']}; {pm['nota_en']}"
    assert not numeros(dot["punto_medicion_en"]) and not numeros(dot["punto_medicion"])


def test_sin_variante_en_ingles_queda_null_y_se_avisa(tmp_path):
    params = json.loads(json.dumps(PARAMS))
    del params["unidades"]["millar"]["nota_en"]
    del params["dotaciones"]["punto_medicion"]["valor_en"]
    ruta = tmp_path / "params.json"
    ruta.write_text(json.dumps(params, ensure_ascii=False), encoding="utf-8")
    rep = b4_cubo.construir(FIXTURE, tmp_path / "web", params_ruta=ruta)
    cubo = leer(tmp_path / "web", "cubo.json")
    assert cubo["dotaciones"]["equivalencia_en"] is None and cubo["dotaciones"]["punto_medicion_en"] is None
    assert cubo["dotaciones"]["equivalencia"] and cubo["dotaciones"]["punto_medicion"]
    assert any("variante en inglés" in a and "unidades.millar.nota_en" in a for a in rep["avisos"]), rep["avisos"]


def test_ventana_de_suelo_desnudo_copiada_de_params(dos_zonas):
    v = dos_zonas[2]["meta"]["ventana_desnudo"]
    p = PARAMS["suelo"]["ventana_desnudo"]
    assert (v["inicio"], v["fin"]) == (p["valor"]["inicio"], p["valor"]["fin"])
    assert (v["fuente"], v["etiqueta"]) == (p["fuente"], p["etiqueta"])


def test_avisa_cuando_el_cubo_se_acerca_al_limite_de_peso(tmp_path, monkeypatch):
    """El contrato pide cubo.json < 5 MB; el motor avisa antes de llegar (los filtros y La gota se repiten por opción)."""
    rep = b4_cubo.construir(FIXTURE, tmp_path / "a")
    assert rep["cubo_bytes"] == (tmp_path / "a/cubo.json").stat().st_size - 1   # menos el salto de línea final
    assert not [a for a in rep["avisos"] if "cerca del límite" in a]
    assert b4_cubo.LIMITE_CUBO_BYTES == 5 * 1024 * 1024, "el límite es el del contrato (kit §2.3; validar_contrato.py)"
    # Con un límite de prueba menor que el peso de la fixture, el aviso sale en el reporte y en las notas.
    monkeypatch.setattr(b4_cubo, "LIMITE_CUBO_BYTES", rep["cubo_bytes"])
    rep2 = b4_cubo.construir(FIXTURE, tmp_path / "b")
    aviso = [a for a in rep2["avisos"] if "cerca del límite" in a]
    assert aviso and aviso[0] in leer(tmp_path / "b", "cubo.json")["meta"]["notas"]


# --- (g) Lámina local de referencia (campo aditivo agua.lamina_local; decisión del 14-nov) ---------------------
def lamina_local_esperada(rot_ref, secuencia, sup, params):
    """La regla del motor escrita aquí, sin usar b4_cubo: un cultivo regado como de costumbre (la rotación lleva
    su nombre) → la aplicada del distrito o, si no hay, la recomendada; en millares/ha con la constante de params."""
    cultivos = list(dict.fromkeys(c for c in secuencia if c != "descanso"))
    if len(cultivos) != 1 or rot_ref != cultivos[0]:
        return None
    entradas = (sup.get("lamina_local_cm") or {}).get(cultivos[0]) or {}
    cm = params["unidades"]["millar"]["valor"]["lamina_cm"]
    for llave, tipo in (("aplicada_dr005", "aplicada"), ("recomendada_inifap", "recomendada")):
        e = entradas.get(llave)
        if not e:
            continue
        if "valor" in e:
            return {"tipo": tipo, "valor_millares_ha": round(e["valor"] / cm, 3), "rango_millares_ha": None, "fuente": e["fuente"]}
        return {"tipo": tipo, "valor_millares_ha": None, "fuente": e["fuente"],
                "rango_millares_ha": {"min": round(e["min"] / cm, 3), "max": round(e["max"] / cm, 3)}}
    return None


def test_lamina_local_con_los_datos_actuales(una_zona):
    _, geo, cubo, _, web, proc = una_zona
    sup = json.loads((proc / "supuestos.json").read_text(encoding="utf-8"))
    if "lamina_local_cm" not in sup:
        pytest.skip("data/processed/supuestos.json no trae lamina_local_cm")
    vistos = {"aplicada": 0, "recomendada": 0, None: 0}
    for p, op in opciones_con_area(geo, cubo):
        ll = op["agua"]["lamina_local"]
        esperado = lamina_local_esperada(op["rotacion"], op["secuencia"], sup, PARAMS)
        donde = f"{p['id']}/{op['id']}"
        if esperado is None:
            assert ll is None, donde
            vistos[None] += 1
            continue
        vistos[ll["tipo"]] += 1
        assert {k: ll[k] for k in esperado} == esperado, donde
        assert ll["etiqueta"] and ll["nota"] and not re.search(r"\d", ll["nota"]), donde
        assert not re.search(r"\b(first|only|best|recommended|sav(e|es|ed|ing|ings))\b", ll["nota"], re.I)
        if ll["tipo"] == "aplicada" and ll["periodo"]:
            assert f"{ll['periodo']['desde']}–{ll['periodo']['hasta']}" in ll["fuente"], "el periodo se lee de la fuente"
    # La alfalfa con corte de verano y las rotaciones de varios cultivos nunca llevan referencia.
    for _, op in opciones_con_area(geo, cubo):
        if op["rotacion"] == "alfalfa_corte_verano" or len(set(op["secuencia"]) - {"descanso"}) > 1:
            assert op["agua"]["lamina_local"] is None, op["id"]
    assert vistos["aplicada"] and vistos[None], vistos
    assert validar_contrato.validar(web) == [], "el campo aditivo no rompe el contrato"


def test_lamina_local_sin_supuestos_es_null_y_se_avisa(dos_zonas):
    rep, _, cubo, _, _ = dos_zonas
    assert all(op["agua"]["lamina_local"] is None for pc in cubo["parcelas"].values() for op in pc["opciones"])
    assert any("lamina_local_cm" in a for a in rep["avisos"])


def test_lamina_local_rango_y_periodo(tmp_path):
    """Una recomendada con rango (min, max) va en rango_millares_ha; una aplicada sin dos años en la fuente va sin
    periodo; una entrada sin fuente no cuenta (DATOS DE PRUEBA)."""
    proc = tmp_path / "processed"
    proc.mkdir()
    (proc / "supuestos.json").write_text(json.dumps({"lamina_local_cm": {
        "maiz_forrajero": {"recomendada_inifap": {"min": 50, "max": 60, "etiqueta": "[prueba]", "fuente": "prueba 2014"}},
        "alfalfa": {"aplicada_dr005": {"valor": 150, "etiqueta": "[prueba]", "fuente": "prueba sin periodo"}},
        "sorgo": {"aplicada_dr005": {"valor": 80, "etiqueta": "[prueba]"}}}}), encoding="utf-8")
    avisos = []
    ll = b4_cubo.leer_laminas_locales(proc, PARAMS, avisos)
    cm = PARAMS["unidades"]["millar"]["valor"]["lamina_cm"]
    assert ll["maiz_forrajero"]["rango_millares_ha"] == {"min": 50 / cm, "max": 60 / cm}
    assert ll["maiz_forrajero"]["valor_millares_ha"] is None and ll["maiz_forrajero"]["periodo"] is None
    assert ll["alfalfa"]["valor_millares_ha"] == 150 / cm and ll["alfalfa"]["periodo"] is None
    assert "sorgo" not in ll, "sin fuente no hay referencia"
    assert b4_cubo.lamina_local_de("alfalfa", ["alfalfa"], ll) is ll["alfalfa"]
    assert b4_cubo.lamina_local_de("alfalfa_corte_verano", ["alfalfa"], ll) is None
    assert b4_cubo.lamina_local_de("avena_maiz", ["cereal_invierno", "maiz_forrajero"], ll) is None
    assert b4_cubo.lamina_local_de("descanso", ["descanso"], ll) is None


def test_dotaciones_lleva_la_constante_de_la_equivalencia(dos_zonas):
    _, _, cubo, _, _ = dos_zonas
    mil = PARAMS["unidades"]["millar"]
    assert cubo["dotaciones"]["lamina_cm_por_millar"] == {"valor": mil["valor"]["lamina_cm"], "fuente": mil["fuente"],
                                                         "etiqueta": mil["etiqueta"]}


def test_cubo_publicado_lamina_local_y_constante():
    cubo = leer(WEB, "cubo.json")
    if cubo["meta"].get("mock"):
        pytest.skip("cubo simulado")
    assert cubo["dotaciones"]["lamina_cm_por_millar"]["valor"] == PARAMS["unidades"]["millar"]["valor"]["lamina_cm"]
    sup = json.loads((PROCESSED / "supuestos.json").read_text(encoding="utf-8"))
    for pc in cubo["parcelas"].values():
        for op in pc["opciones"]:
            esperado = lamina_local_esperada(op["rotacion"], op["secuencia"], sup, PARAMS)
            ll = op["agua"]["lamina_local"]
            assert (ll is None) == (esperado is None), op["id"]
            if ll:
                assert {k: ll[k] for k in esperado} == esperado


# --- (h) Revisión de dda5abb: puntos 1, 7, 11 y 12 ------------------------------------------------------------
def test_sin_lamina_neta_la_gota_y_el_goteo_quedan_en_null_y_se_avisa(tmp_path):
    """Punto 1: con neta_mm_p50 en null la ET no se conoce. Antes valía 0 y el goteo salía con una baja de la
    presa inventada; ahora los cuatro bloques de esa opción van en null, se avisa y el contrato pasa. Solo se
    quita la neta de UNA rotación de UNA zona (fixture de dos zonas con el supuestos.json DE PRUEBA)."""
    sup = supuestos_de_prueba()
    processed = procesados_con(tmp_path, sup)
    ruta = processed / "rotaciones.json"
    rot = json.loads(ruta.read_text(encoding="utf-8"))
    rid = "algodon"
    r = next(x for x in rot["rotaciones"] if x["id"] == rid)
    assert r["lamina_bruta_millares"]["0"]["p50"] > 0, "la prueba necesita una opción que pida agua"
    r["lamina_bruta_millares"]["0"]["neta_mm_p50"] = None
    ruta.write_text(json.dumps(rot, ensure_ascii=False), encoding="utf-8")
    rep, geo, cubo, _, web = correr(processed, tmp_path)

    sin_neta = otras_dz = otras_lc = 0
    for p, op in opciones_con_area(geo, cubo):
        bloques = [op[b] for b in ("gota", *BLOQUES_GOTEO)]
        if p["zona"] == DZ and op["rotacion"] == rid:
            assert bloques == [None] * 4, f"{p['id']}/{op['id']}: sin neta no hay La gota ni goteo"
            sin_neta += 1
        elif op["agua"]["lamina_bruta"]["0"]["p50"] > 0:
            assert all(b is not None for b in bloques), f"{p['id']}/{op['id']}: las demás opciones no cambian"
            otras_lc += p["zona"] == LC and op["rotacion"] == rid   # la otra zona trae su neta: sí lleva La gota
            otras_dz += p["zona"] == DZ
    assert sin_neta and otras_dz and otras_lc
    aviso = [a for a in rep["avisos"] if rid in a and "neta_mm_p50" in a]
    assert aviso and aviso[0] in cubo["meta"]["notas"] and str(sin_neta) in aviso[0], rep["avisos"]
    assert rep["con_goteo"] == sum(1 for _, op in opciones_con_area(geo, cubo) if op["gota_goteo_con_tope"])
    comprobar_goteo_x31(geo, cubo, sup["ea_goteo"]["valor"], sup["ea_superficial_referencia"]["valor"])
    assert validar_contrato.validar(web) == []


def test_flujos_de_la_gota_sin_neta_son_none():
    """La función de flujos no convierte una neta null en ET = 0."""
    assert b4_cubo.flujos_gota(1.0, 1.0, None, PARAMS, M3_MILLAR) is None
    assert b4_cubo.flujos_gota(1.0, 1.0, 0, PARAMS, M3_MILLAR)["et"] == 0, "una neta de cero sí es un dato"


def test_explicacion_dice_el_compromiso_tipico_desde_la_siembra(dos_zonas):
    """Punto 7: la explicación es una por zona y rotación, y la comparten la opción ACTUAL (cuya tarjeta muestra
    el plazo RESTANTE) y la alternativa nueva. Un plazo de varios años se redacta como el compromiso típico del
    cultivo desde la siembra, no como el de esta parcela; el de una temporada sigue igual. Sin dígitos."""
    _, geo, cubo, expl, web = dos_zonas
    anual = PARAMS["plazo"]["anual"]["valor"]
    vistos = set()
    for p, op in opciones_con_area(geo, cubo):
        t = expl["explicaciones"][op["preguntas_ref"]]["textos"]["por_que"]
        plazo = op["agua"]["plazo_anios"]
        if op["rotacion"] == "nogal":
            # El plazo del nogal es un horizonte de cálculo, no la vida de la huerta (kit §2.3; su nota_plazo).
            assert "calculation horizon of {{f2}} years" in t and "orchards live longer" in t, t
            vistos.add("nogal")
        elif plazo["max"] > anual:
            assert "from planting" in t and "typically" in t, (op["preguntas_ref"], t)
            # Auditoría del 15-nov: la variante que conserva el rodal (corte de verano) no siembra nada; el texto
            # habla del cultivo y remite a la tarjeta, que es la que muestra los años que le quedan a la parcela.
            assert "this crop typically commits" in t and "the card shows the term left for this field" in t, t
            assert "per year and commits water for {{f2}}" not in t, "la redacción anterior parecía el plazo de la parcela"
            restante = op["agua"]["plazo_restante"]
            vistos.add("restante_menor" if op["id"] == "ACTUAL" and restante["max"] < plazo["max"] else "varios_anios")
        else:
            assert "for one season" in t, t
            vistos.add("anual")
        assert not re.search(r"\d", re.sub(r"\{\{\w+\}\}", "", t)), "cifras fuera de los marcadores"
    assert {"restante_menor", "anual", "nogal"} <= vistos, "la fixture debe traer alfalfa ACTUAL con restante menor y nogal"
    from motor import verificador
    assert verificador.verificar_archivo(web / "explicaciones.json") == {}


def test_ventana_de_suelo_desnudo_que_cruza_el_anio():
    """Punto 11: una ventana con inicio > fin (p. ej. de diciembre a enero) cruza el año; antes daba 0 días."""
    anio = b4_cubo.ANIO_VENTANA
    params = {"suelo": {"ventana_desnudo": {"valor": {"inicio": "12-01", "fin": "01-31"}}}}
    todos = (dt.date(anio + 1, 1, 31) - dt.date(anio, 12, 1)).days + 1
    assert b4_cubo.dias_desnudo_ventana(set(), params) == todos
    diciembre = set(range(dt.date(anio, 12, 1).timetuple().tm_yday, dt.date(anio, 12, 31).timetuple().tm_yday + 1))
    assert b4_cubo.dias_desnudo_ventana(diciembre, params) == todos - len(diciembre)
    # La ventana del proyecto (inicio < fin) no cambia.
    v = PARAMS["suelo"]["ventana_desnudo"]["valor"]
    a, b = (dt.date(anio, *(int(x) for x in v[k].split("-"))).timetuple().tm_yday for k in ("inicio", "fin"))
    assert a <= b and b4_cubo.dias_desnudo_ventana(set(), PARAMS) == b - a + 1


def test_params_eficiencia_goteo_apunta_a_supuestos():
    """Punto 12: el escenario de goteo usa ea_goteo de data/processed/supuestos.json (entregado). params no duplica
    el valor (sigue en null) y su nota ya no dice «pendiente»: dice de dónde sale."""
    goteo, motivo = b4_cubo.leer_goteo(PROCESSED)
    if goteo is None:
        pytest.skip(f"data/processed sin eficiencia de goteo con fuente: {motivo}")
    g = PARAMS["eficiencia"]["goteo"]
    assert g["valor"] is None, "el valor vive en supuestos.json; params no lo duplica"
    assert "supuestos.json" in g["nota"] and "ea_goteo" in g["nota"] and "pendiente" not in g["nota"].lower()


def test_corte_de_verano_sobre_la_alfalfa_actual_descuenta_la_edad(tmp_path):
    """Punto 13 (integrador): S9 §5 («En alfalfa, plazo restante = plazo − edad observada, con mínimo cero») y el
    contrato (kit §2.3, plazo_restante = plazo − edad observada). Una alternativa que sigue con el MISMO rodal de
    alfalfa (el corte de riego en verano: su único cultivo es el cultivo actual) descuenta la edad como la ACTUAL;
    las que siembran algo nuevo llevan el plazo completo y el nogal nunca descuenta (horizonte de cálculo). Con
    edad null, plazo completo y la nota «age not available». Fixture de dos zonas con UNA alfalfa sin edad."""
    processed = procesados_con(tmp_path)
    ruta = processed / "cultivos_parcelas.csv"
    with open(ruta, encoding="utf-8", newline="") as f:
        filas = list(csv.DictReader(f))
    sin_edad = next(r for r in filas if r["cultivo_actual"] == "alfalfa" and r["abstencion"] == "False")
    sin_edad["edad_perenne_anios"] = ""
    with open(ruta, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(filas[0]))
        w.writeheader()
        w.writerows(filas)
    _, geo, cubo, _, web = correr(processed, tmp_path)

    vistos = set()
    for p, op in opciones_con_area(geo, cubo):
        ag, edad = op["agua"], p["edad_perenne_anios"]
        plazo = ag["plazo_anios"]
        mismo_rodal = p["cultivo_actual"] == "alfalfa" and [x for x in op["secuencia"] if x != "descanso"] == ["alfalfa"]
        donde = f"{p['id']}/{op['id']}"
        if mismo_rodal and edad is not None:
            esperado = {k: max(0, plazo[k] - edad) for k in ("min", "max")}
            vistos.add("actual" if op["id"] == "ACTUAL" else "corte_verano")
        else:
            esperado = dict(plazo)
            if mismo_rodal:
                assert ag["nota_plazo"] == "age not available", donde
                vistos.add("sin_edad")
            elif p["cultivo_actual"] == "nogal":
                vistos.add("nogal")
            elif p["cultivo_actual"] == "alfalfa":
                vistos.add("siembra_nueva")
        assert ag["plazo_restante"] == esperado, donde
        for r in b4_cubo.LLUVIAS:   # compromiso = lámina P50 × plazo restante
            p50 = ag["lamina_bruta"][r]["p50"]
            assert ag["compromiso_millares_ha"][r] == {k: round(p50 * esperado[k], 2) for k in ("min", "max")}, donde
    assert {"actual", "corte_verano", "sin_edad", "siembra_nueva", "nogal"} <= vistos, vistos
    assert validar_contrato.validar(web) == []
