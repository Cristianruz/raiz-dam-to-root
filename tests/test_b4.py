# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Motor B4 (motor/b4_cubo.py) con una y con dos zonas (decisión docs/decisiones/2026-11-14_dos_zonas.md).

(a) Con data/processed actual (una zona, sin propiedad «zona» ni sufijos): «zonas» trae solo
    delicias_saucillo, igual al bloque «zona», las llaves de explicaciones no cambian y CONTRATO OK.
(b) Con la fixture de dos zonas (tests/fixtures/b4_dos_zonas, DATOS DE PRUEBA derivados de
    data/processed por su generar.py): cada parcela usa las láminas de SU zona, hay dos bloques en
    «zonas» que suman el total, las explicaciones van por zona y CONTRATO OK.
(c) Zona con parcelas pero sin sus archivos de clima y demanda: sus parcelas quedan sin opciones,
    con motivo y aviso; nunca se usa el clima de otra zona. CONTRATO OK.
(d) Zona que no está en params: B4 no escribe nada y lo dice.
Todo se escribe en carpetas temporales: web/data no se toca.
"""
import csv
import json
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
            assert op["preguntas_ref"] == f"EXP_ZONA_{ref}"


def test_localidades_de_params(una_zona):
    cubo = una_zona[2]
    loc = PARAMS["zona_piloto"]["localidades_equipo"]
    assert cubo["localidades"] == [{"nombre": x["nombre"], "municipio": x["municipio"], "lat": x["lat"],
                                    "lon": x["lon"], "fuente": loc["fuente"]} for x in loc["valor"]]


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
