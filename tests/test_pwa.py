# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Pruebas de la aplicación instalable y sin conexión (docs/decisiones/2026-11-14_gemelo_digital.md, punto 4), sin red
ni navegador. La prueba con Chromium (instalar, cortar la red y recargar) es tests/e2e/pwa_smoke.mjs.

Qué se comprueba:
1. web/manifest.webmanifest es JSON válido con los campos requeridos (name, short_name, description, start_url y
   scope relativos, display standalone, colores de la identidad), sin «first», «only» ni cifras en sus textos, y
   cada icono existe, es un PNG del tamaño que declara y hay 192 px, 512 px y uno «maskable».
2. web/data/precache.json lista archivos que existen todos y no omite ninguno de web/. La regla del recorrido se
   escribe aquí otra vez, aparte de motor/pwa.py: todo menos sw.js y lo oculto. Si esta prueba falla después de
   agregar o quitar un archivo de web/, corra `python3 motor/pwa.py` (o `python construir.py`).
   La «version» solo se revisa por su forma: construir.py vuelve a escribir pruebas.json y manifest.json DESPUÉS
   de pytest, así que su huella no puede exigirse aquí; cómo cambia se prueba con una carpeta temporal.
3. web/sw.js y web/js/instalar.js no nombran ninguna URL remota ni cargan código de fuera, y usan los mismos
   tipos de mensaje, el mismo listado y el mismo prefijo de caché que escribe motor/pwa.py.
4. motor/pwa.py: es idempotente, la versión cambia con el contenido, no lista sw.js ni lo oculto, no vuelve a
   dibujar iconos que ya están, y funciona sin Pillow cuando los iconos ya existen (GitHub Actions).
5. Con Pillow (si no está, se marcan «skip» con su motivo): los iconos versionados son los que dibuja el código de
   hoy, usan los colores de la identidad y el «maskable» tiene el dibujo dentro de la zona segura.
Lo que se escribe va a tmp_path: estas pruebas no tocan web/.
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ / "motor"))
import pwa  # noqa: E402

WEB = RAIZ / "web"
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"
DECISION = "docs/decisiones/2026-11-14_gemelo_digital.md"
PROHIBIDAS = re.compile(r"\b(first|only|sav(e|es|ed|ing|ings))\b", re.I)  # CLAUDE.md regla 10
URL_REMOTA = re.compile(r"""(?:https?:|wss?:|ftp:)?//[A-Za-z0-9\[]""")     # http://x, https://x, //cdn.x…
MOTIVO_SIN_PILLOW = "Pillow no está instalado (solo hace falta para dibujar los iconos: pip install Pillow)"
TOLERANCIA_PIXEL = 8  # niveles de 0 a 255: margen para otra versión de Pillow, no para otro dibujo


def leer(ruta):
    return json.loads(Path(ruta).read_text(encoding="utf-8"))


def recorrido(web):
    """La regla del listado, escrita aparte de motor/pwa.py: todo archivo de web/ menos sw.js y lo oculto."""
    rutas = set()
    for p in Path(web).rglob("*"):
        partes = p.relative_to(web).parts
        if p.is_file() and not any(x.startswith(".") for x in partes) and partes != ("sw.js",):
            rutas.add("/".join(partes))
    return rutas


@pytest.fixture(scope="module")
def manifest():
    ruta = WEB / "manifest.webmanifest"
    assert ruta.exists(), "falta web/manifest.webmanifest: corra python3 motor/pwa.py"
    return leer(ruta)


@pytest.fixture(scope="module")
def precache():
    ruta = WEB / "data/precache.json"
    assert ruta.exists(), "falta web/data/precache.json: corra python3 motor/pwa.py"
    return leer(ruta)


@pytest.fixture
def mini(tmp_path):
    """Una web mínima en tmp_path, con los iconos versionados, un archivo oculto y una carpeta oculta."""
    web = tmp_path / "web"
    (web / "data/dem/zona/7").mkdir(parents=True)
    (web / "js").mkdir()
    (web / "index.html").write_text("<!doctype html><title>Raíz</title>", encoding="utf-8")
    (web / "sw.js").write_text("// worker de prueba\n", encoding="utf-8")
    (web / "app.js").write_text("// app\n", encoding="utf-8")
    (web / "js/modulo.js").write_text("// módulo\n", encoding="utf-8")
    (web / "data/cubo.json").write_text("{}", encoding="utf-8")
    (web / "data/dem/zona/7/1.png").write_bytes(b"no es un png, pero es un archivo")
    (web / ".oculto").write_text("x", encoding="utf-8")
    (web / "data/.cache").mkdir()
    (web / "data/.cache/resto.json").write_text("{}", encoding="utf-8")
    shutil.copytree(WEB / "icons", web / "icons")
    return web


# --- 1. Manifest ---------------------------------------------------------------------------------------
def test_manifest_tiene_los_campos_requeridos(manifest):
    assert manifest["_encabezado"] == ENCABEZADO
    assert manifest["name"] == "Raíz – From Dam to Root"
    assert manifest["short_name"] == "Raíz"
    assert manifest["start_url"] == "./" and manifest["scope"] == "./", \
        "start_url y scope deben ser relativos: la web vive en una subcarpeta de GitHub Pages"
    assert manifest["display"] == "standalone"
    assert manifest["lang"] == "en"
    for campo in ("background_color", "theme_color"):
        assert re.fullmatch(r"#[0-9A-Fa-f]{6}", manifest[campo]), f"{campo}: {manifest[campo]!r}"


def test_manifest_textos_en_ingles_sin_cifras_ni_palabras_prohibidas(manifest):
    descripcion = manifest["description"]
    assert len(descripcion) > 40 and descripcion.isascii(), "la descripción va en inglés"
    for campo in ("name", "short_name", "description"):
        texto = manifest[campo]
        assert not PROHIBIDAS.search(texto), f"{campo}: «first», «only» o «save…» (CLAUDE.md regla 10): {texto!r}"
        assert not re.search(r"\d", texto), f"{campo}: cifra escrita a mano (CLAUDE.md regla 3): {texto!r}"
    # Es la misma frase que la página ya dice de sí misma.
    assert descripcion == pwa.DESCRIPCION
    index = (WEB / "index.html").read_text(encoding="utf-8")
    if 'name="description"' in index:
        assert descripcion in index, "la descripción del manifest ya no es la de <meta name=description> de index.html"


def test_manifest_usa_los_colores_de_la_identidad(manifest):
    css = (WEB / "style.css").read_text(encoding="utf-8")
    variables = {n: v.upper() for n, v in re.findall(r"--(agua|brote|tierra|ambar|arena):\s*(#[0-9A-Fa-f]{6})", css)}
    assert variables == {n: v.upper() for n, v in pwa.COLORES.items()}, \
        "motor/pwa.py y web/style.css ya no tienen los mismos colores de la identidad"
    assert manifest["theme_color"].upper() == variables["agua"]
    assert manifest["background_color"].upper() == variables["arena"]


def test_iconos_del_manifest_existen_con_el_tamano_declarado(manifest):
    iconos = manifest["icons"]
    assert len(iconos) >= 3
    for icono in iconos:
        src = icono["src"]
        assert not re.match(r"^([a-z]+:|/)", src), f"{src}: la ruta del icono debe ser relativa al manifest"
        ruta = WEB / src
        assert ruta.is_file(), f"el manifest declara {src} y no existe: corra python3 motor/pwa.py"
        assert icono["type"] == "image/png" and ruta.read_bytes().startswith(pwa.FIRMA_PNG), f"{src} no es un PNG"
        ancho, alto = pwa.medidas_png(ruta)
        assert icono["sizes"] == f"{ancho}x{alto}", f"{src} mide {ancho}x{alto} y el manifest dice {icono['sizes']}"
        assert ancho == alto, f"{src} no es cuadrado"
        assert icono["purpose"] in ("any", "maskable")
        assert ENCABEZADO.encode("utf-8") in ruta.read_bytes(), f"{src} sin el encabezado de la regla 4 (texto del PNG)"
    por_proposito = {(i["purpose"], i["sizes"]) for i in iconos}
    assert ("any", "192x192") in por_proposito and ("any", "512x512") in por_proposito
    assert any(p == "maskable" and int(s.split("x")[0]) >= 192 for p, s in por_proposito), "falta el icono «maskable»"


# --- 2. Listado de la copia sin conexión ----------------------------------------------------------------
def test_precache_tiene_la_forma_del_contrato(precache):
    assert precache["_encabezado"] == ENCABEZADO
    assert set(precache) - {"_encabezado", "_nota"} == {"version", "archivos"}
    assert re.fullmatch(r"[0-9a-f]{16}", precache["version"]), precache["version"]
    archivos = precache["archivos"]
    assert archivos == sorted(set(archivos)), "archivos debe ir ordenado y sin repetidos"
    for ruta in archivos:
        assert isinstance(ruta, str) and ruta and not ruta.startswith(("/", ".")) and "\\" not in ruta \
            and "//" not in ruta and ":" not in ruta and ".." not in ruta.split("/"), f"ruta no relativa a web/: {ruta!r}"


def test_precache_lista_archivos_que_existen_todos(precache):
    faltan = [r for r in precache["archivos"] if not (WEB / r).is_file()]
    assert not faltan, f"precache.json lista archivos que no existen ({faltan[:5]}): corra python3 motor/pwa.py"


def test_precache_no_omite_ningun_archivo_de_web(precache):
    listados, en_disco = set(precache["archivos"]), recorrido(WEB)
    assert not en_disco - listados, (f"archivos de web/ que no están en precache.json ({sorted(en_disco - listados)[:8]}): "
                                     "sin red no cargarían. Corra python3 motor/pwa.py")
    assert not listados - en_disco, f"precache.json lista de más: {sorted(listados - en_disco)[:8]}"
    assert listados == set(pwa.listar(WEB)), "motor/pwa.py ya no recorre web/ con la regla que esta prueba describe"


def test_precache_trae_lo_que_la_aplicacion_necesita_sin_red(precache):
    listados = set(precache["archivos"])
    assert "sw.js" not in listados, "sw.js no va en el listado: el navegador lo guarda aparte"
    assert not [r for r in listados if any(p.startswith(".") for p in r.split("/"))], "hay archivos ocultos en el listado"
    for fijo in ("index.html", "app.js", "style.css", "reglas.js", "js/instalar.js", "css/instalar.css",
                 "manifest.webmanifest", "data/precache.json", "data/cubo.json", "data/parcelas.geojson"):
        assert fijo in listados, f"falta {fijo}"
    # Todo lo que index.html carga de la propia web.
    index = (WEB / "index.html").read_text(encoding="utf-8")
    for ruta in re.findall(r"""<(?:script|link)\b[^>]*?(?:src|href)=["']([^"'#?]+)""", index):
        if not re.match(r"^([a-z]+:)?//", ruta):
            assert ruta.removeprefix("./") in listados, f"index.html carga {ruta} y no está en el listado"
    # Bibliotecas locales, datos, teselas de relieve e iconos.
    for lib in leer(WEB / "vendor/VERSIONS.json")["librerias"]:
        for a in lib["archivos"]:
            assert a["archivo"] in listados, f"falta {a['archivo']}"
    for p in list((WEB / "data").glob("*.json")) + list((WEB / "data").glob("*.geojson")) + list((WEB / "js").glob("*.js")) \
            + list((WEB / "css").glob("*.css")) + [x for x in (WEB / "data/dem").rglob("*") if x.is_file()] \
            + list((WEB / "icons").glob("*.png")):
        assert p.relative_to(WEB).as_posix() in listados, f"falta {p.relative_to(WEB).as_posix()}"


# --- 3. Service worker y módulo de instalación -----------------------------------------------------------
@pytest.mark.parametrize("nombre", ["sw.js", "js/instalar.js"])
def test_sin_urls_remotas_ni_codigo_de_fuera(nombre):
    fuente = (WEB / nombre).read_text(encoding="utf-8")
    remotas = [linea.strip() for linea in fuente.splitlines() if URL_REMOTA.search(linea)]
    assert not remotas, f"web/{nombre} nombra una URL remota (todo debe ser local):\n" + "\n".join(remotas[:5])
    assert "importScripts" not in fuente, f"web/{nombre}: sin dependencias (no importScripts)"
    assert not re.search(r"^\s*import\s", fuente, re.M), f"web/{nombre}: sin dependencias (no import)"
    assert not re.search(r"\beval\s*\(|new\s+Function\s*\(", fuente), f"web/{nombre}: no se evalúa código"


def test_archivos_con_encabezado():
    for ruta, marca in (("web/sw.js", "// "), ("web/js/instalar.js", "// "), ("web/css/instalar.css", "/* "),
                        ("motor/pwa.py", "# "), ("tests/e2e/pwa_smoke.mjs", "// ")):
        assert (RAIZ / ruta).read_text(encoding="utf-8").startswith(marca + ENCABEZADO), f"{ruta} sin el encabezado de la regla 4"


def test_el_worker_y_la_pagina_hablan_de_lo_mismo():
    sw = (WEB / "sw.js").read_text(encoding="utf-8")
    pagina = (WEB / "js/instalar.js").read_text(encoding="utf-8")

    def constante(fuente, nombre):
        m = re.search(rf"\bconst {nombre} = \"([^\"]+)\"", fuente)
        assert m, f"no encuentro la constante {nombre}"
        return m.group(1)

    for nombre in ("PEDIR_SINCRONIZAR", "AVISO_COPIA"):
        assert constante(sw, nombre) == constante(pagina, nombre), f"{nombre} difiere entre sw.js e instalar.js"
    assert constante(sw, "LISTADO") == pwa.PRECACHE, "sw.js lee otro listado que el que escribe motor/pwa.py"
    assert constante(sw, "PREFIJO") == "raiz-"
    assert constante(sw, "PORTADA") == "index.html"
    assert constante(pagina, "RUTA_WORKER") == "./" + pwa.SERVICE_WORKER
    # Lo que la decisión pide del worker: activar de inmediato, tomar el control y borrar las cachés viejas.
    for pieza in ("skipWaiting()", "clients.claim()", "caches.delete(", '"install"', '"activate"', '"fetch"', '"message"'):
        assert pieza in sw, f"sw.js ya no usa {pieza}"
    # Los estados que el worker informa son los que la página entiende.
    estados_pagina = set(re.search(r"const COPIAS = \[([^\]]+)\]", pagina).group(1).replace('"', "").replace(" ", "").split(","))
    estados_worker = set(re.findall(r'estado: (?:[a-z.]+ \? )?"([a-z]+)"(?: : "([a-z]+)")?', sw))
    estados_worker = {e for par in estados_worker for e in par if e}
    assert estados_worker == estados_pagina == {"ninguna", "guardando", "lista", "incompleta"}, (estados_worker, estados_pagina)


def test_textos_de_la_interfaz():
    pagina = (WEB / "js/instalar.js").read_text(encoding="utf-8")
    for texto in ("Install app", "Online", "Offline — showing the last synced copy", "Ready to work offline"):
        assert f'"{texto}"' in pagina, f"instalar.js ya no dice «{texto}»"
    assert 'role", "status"' in pagina, "el indicador debe ser una región de estado (role=status)"


# --- 4. motor/pwa.py --------------------------------------------------------------------------------------
def test_construir_es_idempotente_y_no_lista_lo_oculto_ni_el_worker(mini):
    primero = pwa.construir(web=mini)
    assert primero["ejecutado"] and not primero["avisos"]
    assert set(primero["escritos"]) == {"manifest.webmanifest", "data/precache.json"}, "los iconos ya estaban: no se redibujan"
    precache = leer(mini / "data/precache.json")
    assert precache["archivos"] == sorted(
        ["index.html", "app.js", "js/modulo.js", "data/cubo.json", "data/dem/zona/7/1.png", "data/precache.json",
         "manifest.webmanifest"] + [i["archivo"] for i in pwa.ICONOS])
    assert set(precache["archivos"]) == recorrido(mini)
    assert primero["version"] == precache["version"] and primero["archivos"] == len(precache["archivos"])
    assert primero["bytes"] == sum((mini / r).stat().st_size for r in precache["archivos"])

    antes = {r: (mini / r).read_bytes() for r in precache["archivos"]}
    segundo = pwa.construir(web=mini)
    assert segundo["escritos"] == [] and segundo["version"] == primero["version"]
    assert {r: (mini / r).read_bytes() for r in precache["archivos"]} == antes, "correr dos veces debe dejar los mismos octetos"


def test_la_version_cambia_con_el_contenido_y_con_el_listado(mini):
    v0 = pwa.construir(web=mini)["version"]
    original = (mini / "data/cubo.json").read_bytes()

    (mini / "data/cubo.json").write_text('{"cambio": true}', encoding="utf-8")
    v1 = pwa.construir(web=mini)["version"]
    assert v1 != v0, "cambió un archivo y la versión siguió igual: el service worker no renovaría la copia"

    (mini / "data/cubo.json").write_bytes(original)
    assert pwa.construir(web=mini)["version"] == v0, "con el mismo contenido la versión debe ser la misma"

    (mini / "data/nuevo.json").write_text("{}", encoding="utf-8")
    r = pwa.construir(web=mini)
    assert r["version"] != v0 and "data/nuevo.json" in leer(mini / "data/precache.json")["archivos"]

    (mini / "data/nuevo.json").unlink()
    assert pwa.construir(web=mini)["version"] == v0

    # Lo oculto y el worker no cuentan para la versión (no van en la copia).
    (mini / ".oculto").write_text("otro", encoding="utf-8")
    (mini / "sw.js").write_text("// otro worker\n", encoding="utf-8")
    assert pwa.construir(web=mini)["version"] == v0


def test_sin_pillow_usa_los_iconos_que_ya_estan(mini, monkeypatch):
    monkeypatch.setattr(pwa, "_pillow", lambda: None)
    r = pwa.construir(web=mini, regenerar_iconos=True)
    assert r["iconos"] == [i["archivo"] for i in pwa.ICONOS] and r["iconos_dibujados"] == []
    assert any("Pillow" in a for a in r["avisos"]), "debe avisar que no se volvieron a dibujar"
    assert len(leer(mini / "manifest.webmanifest")["icons"]) == len(pwa.ICONOS)


def test_sin_pillow_y_sin_iconos_avisa_y_no_declara_iconos_que_no_existen(mini, monkeypatch):
    monkeypatch.setattr(pwa, "_pillow", lambda: None)
    falta = pwa.ICONOS[0]["archivo"]
    (mini / falta).unlink()
    r = pwa.construir(web=mini)
    assert any(falta in a for a in r["avisos"])
    declarados = [i["src"] for i in leer(mini / "manifest.webmanifest")["icons"]]
    assert falta not in declarados and len(declarados) == len(pwa.ICONOS) - 1
    assert falta not in leer(mini / "data/precache.json")["archivos"]


def test_avisa_si_falta_el_worker_y_falla_si_no_es_la_web(mini, tmp_path):
    (mini / "sw.js").unlink()
    assert any("sw.js" in a for a in pwa.construir(web=mini)["avisos"])
    with pytest.raises(pwa.ErrorPWA):
        pwa.construir(web=tmp_path / "no_existe")


def test_linea_de_comandos(mini, tmp_path):
    r = subprocess.run([sys.executable, str(RAIZ / "motor/pwa.py"), "--web", str(mini)], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    resumen = json.loads(r.stdout)
    assert resumen["ejecutado"] and resumen["version"] == leer(mini / "data/precache.json")["version"]
    vacia = tmp_path / "vacia"
    vacia.mkdir()
    r = subprocess.run([sys.executable, str(RAIZ / "motor/pwa.py"), "--web", str(vacia)], capture_output=True, text=True)
    assert r.returncode == 1 and "index.html" in r.stderr


def test_medidas_png_rechaza_lo_que_no_es_png(tmp_path):
    falso = tmp_path / "falso.png"
    falso.write_bytes(b"GIF89a" + b"\0" * 40)
    with pytest.raises(pwa.ErrorPWA):
        pwa.medidas_png(falso)


# --- 5. El dibujo de los iconos (con Pillow) ----------------------------------------------------------------
def _pil():
    return pytest.importorskip("PIL.Image", reason=MOTIVO_SIN_PILLOW)


@pytest.mark.parametrize("icono", pwa.ICONOS, ids=[i["archivo"] for i in pwa.ICONOS])
def test_los_iconos_versionados_son_los_que_dibuja_el_codigo(icono):
    Image = _pil()
    from PIL import ImageChops
    versionado = Image.open(WEB / icono["archivo"]).convert("RGBA")
    de_hoy = pwa.dibujar_icono(icono["lado"], icono["proposito"]).convert("RGBA")
    assert versionado.size == de_hoy.size == (icono["lado"], icono["lado"])
    mayor = max(alto for _, alto in ImageChops.difference(versionado, de_hoy).getextrema())
    assert mayor <= TOLERANCIA_PIXEL, (f"{icono['archivo']} ya no es el que dibuja motor/pwa.py (diferencia de {mayor} niveles): "
                                       "vuelva a dibujarlo con python3 motor/pwa.py --iconos")


def test_el_dibujo_usa_los_colores_de_la_identidad_y_la_zona_segura():
    _pil()
    lado = 512
    rgb = {n: tuple(int(c.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)) for n, c in pwa.COLORES.items()}

    def cerca(pixel, color):
        return all(abs(a - b) <= TOLERANCIA_PIXEL for a, b in zip(pixel[:3], color))

    completo = pwa.dibujar_icono(lado, "any")
    assert completo.mode == "RGBA"
    assert completo.getpixel((0, 0))[3] == 0, "el icono «any» lleva esquinas redondeadas sobre transparente"
    assert cerca(completo.getpixel((lado // 2, lado // 20)), rgb["arena"]), "arriba, el fondo es arena"
    assert cerca(completo.getpixel((lado // 2, round(lado * (pwa.SUELO_Y - pwa.GOTA_RADIO)))), rgb["agua"]), "la gota es agua"
    assert cerca(completo.getpixel((lado // 10, round(lado * 0.8))), rgb["tierra"]), "abajo, la tierra"
    assert cerca(completo.getpixel((lado // 2, round(lado * 0.7))), rgb["arena"]), "la raíz baja por el centro, en arena"

    mascara = pwa.dibujar_icono(lado, "maskable")
    assert min(mascara.getchannel("A").getextrema()) == 255, "el icono «maskable» no puede tener transparencia"
    # Zona segura: círculo centrado de radio 0.4 del lado. La gota (agua) y la raíz (arena, bajo el suelo) caben dentro.
    centro, radio = (lado - 1) / 2, 0.4 * lado
    y_suelo = (0.5 + (pwa.SUELO_Y + pwa.PASTO_ALTO - 0.5) * pwa.ESCALA_MASKABLE) * lado
    pixeles = mascara.load()
    fuera = 0
    for y in range(lado):
        for x in range(lado):
            p = pixeles[x, y]
            dibujo = cerca(p, rgb["agua"]) or (y > y_suelo + 2 and cerca(p, rgb["arena"]))
            if dibujo and (x - centro) ** 2 + (y - centro) ** 2 > radio ** 2:
                fuera += 1
    assert fuera == 0, f"{fuera} píxeles de la gota o de la raíz quedan fuera de la zona segura del icono «maskable»"


def test_regenerar_los_iconos_da_los_mismos_octetos(mini):
    _pil()
    for icono in pwa.ICONOS:
        (mini / icono["archivo"]).unlink()
    primero = pwa.construir(web=mini)
    assert primero["iconos_dibujados"] == [i["archivo"] for i in pwa.ICONOS]
    octetos = {i["archivo"]: (mini / i["archivo"]).read_bytes() for i in pwa.ICONOS}
    segundo = pwa.construir(web=mini, regenerar_iconos=True)
    assert segundo["iconos_dibujados"] == [] and segundo["escritos"] == [], "volver a dibujar debe dar los mismos octetos"
    assert {i["archivo"]: (mini / i["archivo"]).read_bytes() for i in pwa.ICONOS} == octetos
