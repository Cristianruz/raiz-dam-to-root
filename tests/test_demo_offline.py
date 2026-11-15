# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Pruebas de motor/demo_offline.py: la copia SIN RED de la web en un solo archivo HTML.

Sin navegador (la prueba con Chromium y la red cortada es tests/e2e/offline_smoke.mjs):
- con la web/ real (una copia tomada al empezar, para que otra edición en curso no mueva el piso):
  un solo HTML, sin <script src> ni hojas enlazadas a archivos, todos los módulos alcanzables
  incrustados y en orden, cada archivo de web/data/ incrustado e igual al original (JSON y GeoJSON
  como JSON; lo demás, en base64) y ningún bloque JSON que rompa el HTML;
- con webs mínimas escritas aquí: los «import» se leen del código (no de comentarios ni de textos),
  los errores dicen qué falta, y los textos peligrosos (</script>, U+2028) viajan escapados.
Los números de este archivo son posiciones y conteos de la prueba, no datos del proyecto.
"""
import base64
import json
import mimetypes
import re
import shutil
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "web"
sys.path.insert(0, str(RAIZ / "motor"))
import demo_offline  # noqa: E402

ENCABEZADO = "AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026"
NOTA_SIN_COMMIT = "Offline copy built from the repository — no network needed; base map tiles need a connection."


# --- Lectura de la copia (independiente del constructor) ---------------------------------------
class Leida(HTMLParser):
    """Lo que trae un HTML: scripts y estilos con su texto, y los atributos de todas las etiquetas."""

    def __init__(self, texto):
        super().__init__(convert_charrefs=True)
        self.scripts, self.estilos, self.etiquetas = [], [], []
        self._abierto = None
        self.feed(texto)
        self.close()

    def handle_starttag(self, tag, attrs):
        at = {k: v or "" for k, v in attrs}
        self.etiquetas.append((tag, at))
        if tag in ("script", "style"):
            self._abierto = {"attrs": at, "texto": ""}
            (self.scripts if tag == "script" else self.estilos).append(self._abierto)

    def handle_endtag(self, tag):
        if tag in ("script", "style"):
            self._abierto = None

    def handle_data(self, data):
        if self._abierto is not None:
            self._abierto["texto"] += data

    def de(self, tag):
        return [at for t, at in self.etiquetas if t == tag]

    def datos(self):
        """{nombre: bloque} de los archivos de datos incrustados (bloque = {"attrs", "texto"})."""
        return {s["attrs"]["data-raiz-dato"]: s for s in self.scripts if "data-raiz-dato" in s["attrs"]}

    def paquete(self):
        return json.loads(next(s["texto"] for s in self.scripts if s["attrs"].get("id") == "raiz-offline-paquete"))

    def nota(self, texto):
        return re.search(r'<p class="nota-offline"[^>]*>(.*?)</p>', texto, re.S).group(1)


def bloques_json_como_los_ve_el_navegador(texto):
    """Cada <script type="application/json">: lo que hay hasta el PRIMER «</script» (así corta un navegador)."""
    minusculas = texto.lower()
    bloques = []
    for m in re.finditer(r'<script type="application/json"[^>]*>', texto):
        bloques.append(texto[m.end():minusculas.index("</script", m.end())])
    return bloques


def aplicar_cambios(fuente, cambios, url_de):
    """Lo que hace el arranque de la página con un módulo: posiciones UTF-16, de atrás hacia adelante."""
    u = fuente.encode("utf-16-le")
    for c in reversed(cambios):
        u = u[:2 * c["de"]] + json.dumps(url_de(c)).encode("utf-16-le") + u[2 * c["a"]:]
    return u.decode("utf-16-le")


# Importaciones estáticas escritas al inicio de una línea (lectura simple, aparte de la del constructor).
IMPORT_SIMPLE = re.compile(
    r"""^[ \t]*(?:import|export)\b[^;'"`]*?\bfrom\s*["']([^"']+)["']|^[ \t]*import\s*["']([^"']+)["']""", re.M)


def cierre_simple(web, entrada):
    """Módulos alcanzables desde `entrada` siguiendo solo esas importaciones relativas."""
    vistos, pendientes = set(), [entrada]
    while pendientes:
        ruta = pendientes.pop()
        if ruta in vistos:
            continue
        vistos.add(ruta)
        for a, b in IMPORT_SIMPLE.findall((web / ruta).read_text(encoding="utf-8")):
            espec = a or b
            if espec.startswith("."):
                pendientes.append((web / ruta).parent.joinpath(espec).resolve().relative_to(web.resolve()).as_posix())
    return vistos


# --- La web real ---------------------------------------------------------------------------------
@pytest.fixture(scope="module")
def copia(tmp_path_factory):
    if not (WEB / "index.html").exists() or not (WEB / "app.js").exists():
        pytest.skip("web/index.html o web/app.js aún no existen (los escribe la pieza web)")
    base = tmp_path_factory.mktemp("offline")
    web = base / "web"
    shutil.copytree(WEB, web)  # una foto de la web: lo que se compara es lo que se construyó
    salida = base / "salida" / "raiz-offline.html"
    informe = demo_offline.construir(web, salida)
    texto = salida.read_text(encoding="utf-8")
    return {"web": web, "salida": salida, "informe": informe, "texto": texto, "leida": Leida(texto)}


def test_es_un_solo_archivo_html(copia):
    assert copia["salida"].is_file()
    assert [p.name for p in copia["salida"].parent.iterdir()] == ["raiz-offline.html"]
    texto = copia["texto"]
    assert texto.lower().startswith("<!doctype html")
    assert texto.rstrip().endswith("</html>")
    assert len(copia["leida"].de("html")) == 1 and len(copia["leida"].de("body")) == 1
    assert ENCABEZADO in texto
    assert copia["informe"]["bytes"] == copia["salida"].stat().st_size


def test_no_quedan_scripts_ni_hojas_que_apunten_a_archivos(copia):
    leida = copia["leida"]
    assert [s["attrs"] for s in leida.scripts if "src" in s["attrs"]] == []
    assert [s["attrs"] for s in leida.scripts if s["attrs"].get("type") == "module"] == []
    assert [at for at in leida.de("link") if "stylesheet" in at.get("rel", "").lower()] == []
    # Ninguna otra etiqueta carga un archivo: lo que queda es un ancla, una URI data: o un enlace <a>.
    for tag, at in leida.etiquetas:
        for nombre in ("src", "href", "poster"):
            valor = at.get(nombre)
            if valor and tag != "a":
                assert valor.startswith(("#", "data:")), f"<{tag} {nombre}={valor[:80]}>"


def test_cada_hoja_y_cada_biblioteca_de_index_va_incrustada(copia):
    original = Leida((copia["web"] / "index.html").read_text(encoding="utf-8"))
    estilos = {e["attrs"].get("data-origen"): e["texto"] for e in copia["leida"].estilos}
    hojas = [at["href"] for at in original.de("link") if "stylesheet" in at.get("rel", "").lower()]
    assert hojas, "index.html ya no enlaza hojas de estilos: revise esta prueba"
    for href in hojas:
        css = (copia["web"] / href).read_text(encoding="utf-8")
        esperado = demo_offline.estilo_para_html(demo_offline.css_incrustable(css, href, copia["web"], {"remotas_solas": []}))
        assert estilos[href].strip() == esperado.strip(), href
    scripts = {s["attrs"].get("data-origen"): s["texto"] for s in copia["leida"].scripts}
    clasicos = [s["attrs"]["src"] for s in original.scripts if "src" in s["attrs"] and s["attrs"].get("type") != "module"]
    for src in clasicos:
        js = (copia["web"] / src).read_text(encoding="utf-8")
        assert scripts[src].strip() == demo_offline.script_para_html(js)[0].strip(), src
    assert [ruta for ruta, _ in copia["informe"]["bibliotecas"]] == clasicos
    assert copia["leida"].paquete()["hojas"][:len(hojas)] == hojas


def test_todos_los_modulos_alcanzables_van_incrustados_y_en_orden(copia):
    web, paquete = copia["web"], copia["leida"].paquete()
    original = Leida((web / "index.html").read_text(encoding="utf-8"))
    entradas = [s["attrs"]["src"] for s in original.scripts if s["attrs"].get("type") == "module"]
    assert paquete["entradas"] == entradas and entradas
    incrustados = set(paquete["modulos"])
    assert set(paquete["orden"]) == incrustados and len(paquete["orden"]) == len(incrustados)
    for entrada in entradas:
        faltan = cierre_simple(web, entrada) - incrustados
        assert not faltan, f"módulos alcanzables desde {entrada} que no van en la copia: {sorted(faltan)}"
    posicion = {ruta: i for i, ruta in enumerate(paquete["orden"])}
    for ruta, m in paquete["modulos"].items():
        assert m["fuente"] == (web / ruta).read_text(encoding="utf-8"), ruta  # el código viaja sin tocar
        for c in m["cambios"]:
            if "modulo" in c:
                assert posicion[c["modulo"]] < posicion[ruta], f"{c['modulo']} debe crearse antes que {ruta}"
        # Tras los cambios del arranque no queda ninguna importación relativa ni import.meta.url en el código.
        listo = aplicar_cambios(m["fuente"], m["cambios"], lambda c: "blob:prueba/" + c.get("modulo", "meta"))
        assert [e for par in IMPORT_SIMPLE.findall(listo) for e in par if e.startswith(".")] == [], ruta
        analisis = demo_offline.analizar_modulo(listo, ruta)
        assert all(c.get("espec", "").startswith("blob:prueba/") for c in analisis["cambios"]), ruta


@pytest.mark.skipif(shutil.which("node") is None, reason="node no está instalado")
def test_los_modulos_siguen_siendo_javascript_valido_tras_los_cambios(copia, tmp_path):
    for ruta, m in copia["leida"].paquete()["modulos"].items():
        listo = aplicar_cambios(m["fuente"], m["cambios"], lambda c: "blob:prueba/" + c.get("modulo", "meta"))
        archivo = tmp_path / (ruta.replace("/", "__") + ".mjs")
        archivo.write_text(listo, encoding="utf-8")
        r = subprocess.run(["node", "--check", str(archivo)], capture_output=True, text=True)
        assert r.returncode == 0, f"{ruta}: {r.stderr[:400]}"


def test_cada_archivo_de_datos_va_incrustado_e_igual_al_original(copia):
    carpeta = copia["web"] / "data"
    archivos = sorted(p for p in carpeta.rglob("*") if p.is_file() and not p.name.startswith("."))
    assert [p for p in archivos if p.suffix in (".json", ".geojson")], "web/data/ no tiene JSON ni GeoJSON"
    datos = copia["leida"].datos()
    assert sorted(datos) == sorted(p.relative_to(carpeta).as_posix() for p in archivos)
    for p in archivos:
        nombre = p.relative_to(carpeta).as_posix()
        bloque = datos[nombre]
        if p.suffix in (".json", ".geojson"):
            assert bloque["attrs"]["type"] == "application/json", nombre
            assert bloque["attrs"]["data-raiz-tipo"].startswith(("application/json", "application/geo+json")), nombre
            assert json.loads(bloque["texto"]) == json.loads(p.read_text(encoding="utf-8")), nombre
        else:  # p. ej. las teselas de relieve de data/dem/: los mismos octetos, en base64
            assert bloque["attrs"]["type"] == "application/octet-stream", nombre
            assert bloque["attrs"]["data-raiz-tipo"] == (mimetypes.guess_type(p.name)[0] or "application/octet-stream")
            assert base64.b64decode(bloque["texto"], validate=True) == p.read_bytes(), nombre
    assert sorted(n for n, _ in copia["informe"]["datos"]) == sorted(datos)


def test_los_bloques_json_no_rompen_el_html(copia):
    crudos = bloques_json_como_los_ve_el_navegador(copia["texto"])
    leidos = [s["texto"] for s in copia["leida"].scripts if s["attrs"].get("type") == "application/json"]
    en_json = [b for b in copia["leida"].datos().values() if b["attrs"]["type"] == "application/json"]
    assert len(crudos) == len(leidos) == len(en_json) + 1  # los datos JSON y el paquete de módulos
    for crudo, leido in zip(crudos, leidos):
        assert crudo == leido  # nada cerró el bloque antes de tiempo
        assert "</script" not in crudo.lower() and "<!--" not in crudo and "<" not in crudo
        assert " " not in crudo and " " not in crudo
        json.loads(crudo)


def test_el_arranque_va_despues_de_los_datos_y_antes_que_los_modulos(copia):
    texto = copia["texto"]
    arranque = texto.index('<script data-raiz-offline="arranque">')
    assert texto.count('<script data-raiz-offline="arranque">') == 1
    assert all(m.start() < arranque for m in re.finditer(r"<script data-raiz-dato=|<script type=\"application/json\"", texto))
    assert all(m.start() < arranque for m in re.finditer(r"<script data-origen=", texto))
    codigo = next(s["texto"] for s in copia["leida"].scripts if s["attrs"].get("data-raiz-offline") == "arranque")
    assert codigo.index("window.fetch = ") < codigo.index("import(")  # fetch se sustituye antes de cargar la web
    assert ENCABEZADO in codigo


def test_nota_visible_y_sin_recursos_remotos_que_detengan_la_pagina(copia):
    informe = copia["informe"]
    assert informe["nota"] == NOTA_SIN_COMMIT  # la foto de la web no es un repositorio: sin commit
    assert copia["leida"].nota(copia["texto"]) == informe["nota"]
    assert copia["texto"].index('id="nota-offline"') < copia["texto"].index("</header>")
    assert informe["remotas_bloquean"] == [] and informe["remotas_solas"] == []
    assert all(ruta in dict(informe["modulos"]) and url.startswith("http") for ruta, url in informe["remotas_codigo"])
    resumen = demo_offline.texto_informe(informe)
    for esperado in ("Módulos ES incrustados", "Datos JSON/GeoJSON incrustados", "Tamaño total", "URL remotas que quedan"):
        assert esperado in resumen


def test_la_orden_escribe_la_copia_con_el_commit_de_git(tmp_path):
    if not (WEB / "index.html").exists() or not (WEB / "app.js").exists():
        pytest.skip("web/index.html o web/app.js aún no existen (los escribe la pieza web)")

    def sha():
        r = subprocess.run(["git", "-C", str(RAIZ), "rev-parse", "--short", "HEAD"], capture_output=True, text=True)
        return r.stdout.strip() if r.returncode == 0 else None

    antes = sha()
    salida = tmp_path / "copia" / "raiz-offline.html"
    r = subprocess.run([sys.executable, str(RAIZ / "motor/demo_offline.py"), "--salida", str(salida)],
                       capture_output=True, text=True, cwd=RAIZ)
    assert r.returncode == 0, r.stderr
    texto = salida.read_text(encoding="utf-8")
    nota = Leida(texto).nota(texto)
    assert f"Nota en la página: {nota}" in r.stdout and "Tamaño total" in r.stdout
    assert nota.startswith("Offline copy built from the repository")
    assert nota.endswith("— no network needed; base map tiles need a connection.")
    if antes is None:
        assert nota == NOTA_SIN_COMMIT
    else:
        assert any(f"(commit {s}" in nota for s in {antes, sha()})  # si otro commit entra a media prueba, vale


# --- Webs mínimas: los casos que la web real no trae -------------------------------------------------
INDEX = """<!doctype html>
<!-- AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026 (web de prueba) -->
<html lang="en"><head><meta charset="utf-8"><title>prueba</title>
<!-- <link rel="stylesheet" href="comentada.css"> <script src="comentado.js"></script> -->
{cabeza}
<script type="module" src="app.js"></script>
</head><body><header id="marca">Prueba</header><main id="principal"></main></body></html>
"""


def web_minima(carpeta, archivos, cabeza=""):
    """Escribe una web de prueba: index.html con `cabeza` dentro de <head> y los `archivos` dados."""
    web = carpeta / "web"
    for ruta, contenido in {"index.html": INDEX.format(cabeza=cabeza), "app.js": "export {};\n", **archivos}.items():
        destino = web / ruta
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(contenido if isinstance(contenido, bytes) else contenido.encode("utf-8"))
    return web


APP_CON_TRAMPAS = """\
// import { comentado } from "./comentado.js";
/* import "./tampoco.js"; */
const gota = "💧"; // un carácter fuera del plano básico: las posiciones se cuentan en UTF-16
import { a } from "./js/a.js";
import * as b from './js/b.js';
import "./js/efecto.js";
export { c } from "./js/c.js";
import {
  d,
  e as otra,
} from "./js/d.js";
const texto = "import { falso } from './no_existe.js'";
const plantilla = `import("./tampoco_existe.js") ${a ? `anidada ${b} import './x.js'` : ""} fin`;
const comillas = /import "\\.\\/regex\\.js"|["'`]/g;
const mitad = a / 2; const cuarto = mitad / 2; // divisiones, no expresiones regulares
if (a) /'/.test(texto);
const perezoso = () => import("./js/perezoso.js");
const aqui = new URL("../css/extra.css", import.meta.url).href;
const objeto = { import: 1, export: 2 }; objeto.import;
"""


def test_los_import_se_leen_del_codigo_no_de_comentarios_ni_textos(tmp_path):
    web = web_minima(tmp_path, {
        "app.js": APP_CON_TRAMPAS,
        "js/a.js": 'import { s } from "../compartido.js";\nexport const a = s;\n',
        "js/b.js": 'export * from "../compartido.js";\n',
        "js/c.js": "export const c = 1;\n", "js/d.js": "export const d = 1, e = 2;\n",
        "js/efecto.js": "globalThis.efecto = true;\n", "js/perezoso.js": "export default 1;\n",
        "compartido.js": "export const s = 1;\n",
        "data/uno.json": '{"a": 1}', "data/zona/dos.geojson": '{"type": "FeatureCollection", "features": []}',
        "data/tesela/0.png": bytes(range(256)), "data/.oculto": "no viaja",
    })
    informe = demo_offline.construir(web, tmp_path / "copia.html", commit="abc1234")
    texto = (tmp_path / "copia.html").read_text(encoding="utf-8")
    leida = Leida(texto)
    paquete = leida.paquete()
    assert set(paquete["orden"]) == {"app.js", "js/a.js", "js/b.js", "js/c.js", "js/d.js", "js/efecto.js",
                                     "js/perezoso.js", "compartido.js"}
    orden = paquete["orden"]
    assert orden[-1] == "app.js" and orden.index("compartido.js") < min(orden.index("js/a.js"), orden.index("js/b.js"))
    app = paquete["modulos"]["app.js"]
    assert app["fuente"] == APP_CON_TRAMPAS
    assert [c.get("modulo", "meta") for c in app["cambios"]] == [
        "js/a.js", "js/b.js", "js/efecto.js", "js/c.js", "js/d.js", "js/perezoso.js", "meta"]
    listo = aplicar_cambios(app["fuente"], app["cambios"], lambda c: "blob:prueba/" + c.get("modulo", "meta"))
    for esperado in ('import { a } from "blob:prueba/js/a.js";', 'import * as b from "blob:prueba/js/b.js";',
                     'import "blob:prueba/js/efecto.js";', 'export { c } from "blob:prueba/js/c.js";',
                     '} from "blob:prueba/js/d.js";', 'import("blob:prueba/js/perezoso.js")',
                     'new URL("../css/extra.css", "blob:prueba/meta").href', 'const gota = "💧";',
                     '// import { comentado } from "./comentado.js";', "from './no_existe.js'\"",
                     '`import("./tampoco_existe.js") ${a'):
        assert esperado in listo, esperado
    # Datos: también los de subcarpetas; lo que no es JSON viaja en base64; los archivos ocultos no viajan.
    datos = leida.datos()
    assert {n: b["texto"] for n, b in datos.items()} == {
        "uno.json": '{"a": 1}', "zona/dos.geojson": '{"type": "FeatureCollection", "features": []}',
        "tesela/0.png": base64.b64encode(bytes(range(256))).decode("ascii")}
    assert {n: (b["attrs"]["type"], b["attrs"]["data-raiz-tipo"]) for n, b in datos.items()} == {
        "uno.json": ("application/json", "application/json; charset=utf-8"),
        "zona/dos.geojson": ("application/json", "application/geo+json; charset=utf-8"),
        "tesela/0.png": ("application/octet-stream", "image/png")}
    assert informe["datos_no_incrustados"] == [".oculto"] and informe["datos_binarios"] == ["tesela/0.png"]
    assert leida.nota(texto) == ("Offline copy built from the repository (commit abc1234) — no network needed; "
                                 "base map tiles need a connection.")
    # Lo que estaba dentro de un comentario HTML no se toca ni se busca en disco.
    assert '<!-- <link rel="stylesheet" href="comentada.css"> <script src="comentado.js"></script> -->' in texto


@pytest.mark.parametrize("codigo, esperado", [
    ('import { x } from "./falta.js";\n', ('app.js', '"./falta.js"', "no existe")),
    ('import * as d3 from "d3";\n', ('app.js', '"d3"', "rutas relativas")),
    ('import x from "https://cdn.example.org/x.js";\n', ('app.js', "https://cdn.example.org/x.js")),
    ('const m = await import("./js/" + nombre + ".js");\n', ("app.js", "import() con una expresión")),
    ('import "./datos.json";\n', ("app.js", "./datos.json", "no es un módulo JavaScript")),
    ('import "./a.js";\n', ("importación circular", "a.js → b.js → a.js")),
    ('const s = "sin cerrar;\n', ("app.js", "cadena sin cerrar")),
])
def test_un_import_que_no_se_puede_resolver_falla_con_un_mensaje_claro(tmp_path, codigo, esperado):
    web = web_minima(tmp_path, {"app.js": codigo, "datos.json": "{}", "a.js": 'import "./b.js";\n', "b.js": 'import "./a.js";\n'})
    with pytest.raises(demo_offline.ErrorOffline) as error:
        demo_offline.construir(web, tmp_path / "copia.html")
    for parte in esperado:
        assert parte in str(error.value)
    assert not (tmp_path / "copia.html").exists()
    # La orden termina con código 1 y el mismo mensaje.
    r = subprocess.run([sys.executable, str(RAIZ / "motor/demo_offline.py"), "--web", str(web), "--salida", str(tmp_path / "c.html")],
                       capture_output=True, text=True)
    assert r.returncode == 1 and esperado[-1] in r.stderr


def test_los_textos_peligrosos_viajan_escapados(tmp_path):
    malo = {"cierre": "</script><script>alert(1)</script>", "mayusculas": "</SCRIPT >", "comentario": "<!-- <script>",
            "separadores": "línea párrafo fin", "barra": "a\\<b"}
    web = web_minima(tmp_path, {
        "app.js": 'export const html = "</script><!-- <script>";\n',
        "lib/clasico.js": 'window.clasico = "</script>" + "<!--";\n',
        "data/malo.json": json.dumps(malo, ensure_ascii=False),
    }, cabeza='<script defer src="lib/clasico.js"></script>')
    informe = demo_offline.construir(web, tmp_path / "copia.html")
    texto = (tmp_path / "copia.html").read_text(encoding="utf-8")
    crudos = bloques_json_como_los_ve_el_navegador(texto)
    assert len(crudos) == 2 and all("<" not in c and " " not in c and " " not in c for c in crudos)
    assert json.loads(crudos[0]) == malo
    assert json.loads(crudos[1])["modulos"]["app.js"]["fuente"] == 'export const html = "</script><!-- <script>";\n'
    leida = Leida(texto)
    assert json.loads(leida.datos()["malo.json"]["texto"]) == malo
    # El script clásico conserva su significado (\\/ y \\! son la misma letra en una cadena) y no cierra la etiqueta.
    clasico = next(s["texto"] for s in leida.scripts if s["attrs"].get("data-origen") == "lib/clasico.js")
    assert clasico.strip() == 'window.clasico = "<\\/script>" + "<\\!--";'
    assert informe["escapes_script"] == 2
    assert len(leida.scripts) == 4  # la biblioteca, el dato, el paquete de módulos y el arranque
    assert texto.lower().count("</script") == 5  # esos cuatro y el del comentario HTML de la web de prueba


def test_hojas_de_estilos_archivos_locales_y_recursos_remotos(tmp_path):
    web = web_minima(tmp_path, {
        "estilo.css": '/* url("no_existe.png") @import "no.css"; */\n.a { background: url(img/punto.svg#p); }\n'
                      '.b { background: url("data:image/png;base64,AAAA"); }\n.c { content: "</style>"; }\n',
        "pantalla.css": ".d { color: red; }\n",
        "css/extra.css": ".e { color: blue; }\n",
        "img/punto.svg": "<svg xmlns='http://www.w3.org/2000/svg'/>",
        "icono.svg": "<svg xmlns='http://www.w3.org/2000/svg'/>",
        "app.webmanifest": "{}",
        "app.js": 'const hoja = new URL("./css/extra.css", import.meta.url).href;\nexport { hoja };\n',
    }, cabeza='<link rel="stylesheet" href="estilo.css">\n<link rel="stylesheet" href="pantalla.css" media="screen">\n'
              '<link rel="icon" href="icono.svg">\n<link rel="manifest" href="app.webmanifest">\n'
              '<link rel="stylesheet" href="https://fonts.example.org/letra.css">')
    informe = demo_offline.construir(web, tmp_path / "copia.html")
    texto = (tmp_path / "copia.html").read_text(encoding="utf-8")
    leida = Leida(texto)
    estilos = {e["attrs"].get("data-origen"): e for e in leida.estilos}
    assert 'url("data:image/svg+xml;base64,' in estilos["estilo.css"]["texto"] and '#p")' in estilos["estilo.css"]["texto"]
    assert '/* url("no_existe.png") @import "no.css"; */' in estilos["estilo.css"]["texto"]
    assert 'url("data:image/png;base64,AAAA")' in estilos["estilo.css"]["texto"]
    assert "</style" not in estilos["estilo.css"]["texto"] and len(leida.estilos) == 4  # tres hojas y la de la nota
    assert estilos["pantalla.css"]["attrs"]["media"] == "screen"
    # La hoja que solo pide un módulo también viaja, y el arranque la da por enlazada.
    assert ".e { color: blue; }" in estilos["css/extra.css"]["texto"]
    assert leida.paquete()["hojas"] == ["estilo.css", "pantalla.css", "css/extra.css"]
    # Icono incrustado; el manifest de aplicación se quita; la hoja remota queda señalada (y la orden avisa con código 1).
    enlaces = leida.de("link")
    assert [at["rel"] for at in enlaces] == ["icon", "stylesheet"]
    assert enlaces[0]["href"].startswith("data:image/svg+xml;base64,")
    assert informe["quitadas"] == ['<link rel="manifest" href="app.webmanifest">']
    assert informe["remotas_bloquean"] == [("index.html", "https://fonts.example.org/letra.css")]
    assert "ATENCIÓN" in demo_offline.texto_informe(informe)
    r = subprocess.run([sys.executable, str(RAIZ / "motor/demo_offline.py"), "--web", str(web), "--salida", str(tmp_path / "c.html")],
                       capture_output=True, text=True)
    assert r.returncode == 1 and "https://fonts.example.org/letra.css" in r.stdout
    # @import no se incrusta: se dice cuál y dónde.
    (web / "pantalla.css").write_text('@import url("otra.css");\n', encoding="utf-8")
    with pytest.raises(demo_offline.ErrorOffline, match="pantalla.css.*@import"):
        demo_offline.construir(web, tmp_path / "copia2.html")


@pytest.mark.parametrize("codigo, tipos", [
    ("a / b / c", ["nombre", "signo", "nombre", "signo", "nombre"]),
    ('x = /"/.test(y)', ["nombre", "signo", "regex", "signo", "nombre", "signo", "nombre", "signo"]),
    ("if (x) /'/.test(y)", ["nombre", "signo", "nombre", "signo", "regex", "signo", "nombre", "signo", "nombre", "signo"]),
    ("f(x) / 2 / y", ["nombre", "signo", "nombre", "signo", "signo", "numero", "signo", "nombre"]),
    ("a++ / 2 / b", ["nombre", "signo", "signo", "signo", "numero", "signo", "nombre"]),
    ("o.in / 2 / x", ["nombre", "signo", "nombre", "signo", "numero", "signo", "nombre"]),
    ("return /[/\"]/g", ["nombre", "regex"]),
    ("`a ${ {b: `c ${d}`} } '` + \"e\"", ["plantilla", "signo", "signo", "nombre", "signo", "plantilla", "signo", "nombre",
                                         "plantilla", "signo", "plantilla", "signo", "cadena"]),
])
def test_fichas_de_javascript(codigo, tipos):
    assert [f[0] for f in demo_offline.fichas_js(codigo)] == tipos
