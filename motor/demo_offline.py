# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Copia SIN RED de la web en un solo archivo HTML (respaldo para el Open House).

Conserva el explorador técnico: lee explorador.html si existe; en otras carpetas usa index.html.
Lee la web/ ACTUAL y escribe UNA página que abre con doble clic (file://), sin servidor y sin red:
  - cada hoja de estilos que enlaza index.html queda dentro de <style>;
  - las bibliotecas locales (web/vendor/) quedan como <script> clásico;
  - los módulos ES (el de entrada de index.html y todo lo que importa, descubierto leyendo sus
    «import») van como texto en un bloque JSON; al abrir, la página crea una URL Blob por módulo,
    dependencias primero, y cambia cada «import … from "./x.js"» por la URL Blob de x.js
    (un navegador no carga módulos ES desde file://);
  - cada JSON/GeoJSON de web/data/ va tal cual en un bloque <script type="application/json"> (lo demás
    de web/data/, como las teselas de relieve, en base64) y un sustituto de fetch y de XMLHttpRequest
    contesta «data/<nombre>» con esa copia (a fetch, 404 si la web pide uno que no está).
Las teselas del mapa base (remotas) NO se incrustan: sin red, la web ya dibuja las parcelas sobre fondo liso.
Ninguna cifra se escribe aquí: los datos se copian sin tocar y el commit de la nota sale de git.

Uso:     python3 motor/demo_offline.py [--salida dist/raiz-offline.html] [--web web]
Pruebas: tests/test_demo_offline.py (sin navegador) y tests/e2e/offline_smoke.mjs (Chromium, sin red).
"""
import argparse
import base64
import html as html_lib
import json
import mimetypes
import posixpath
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "web"
SALIDA = RAIZ / "dist" / "raiz-offline.html"

EXT_MODULO = (".js", ".mjs")
# Etiquetas cuyo archivo local se cambia por una URI data: (imágenes, audio, video).
INCRUSTABLES = {("img", "src"), ("source", "src"), ("video", "src"), ("video", "poster"), ("audio", "src"),
                ("track", "src"), ("embed", "src"), ("object", "data"), ("input", "src")}
EXT_DATOS = (".json", ".geojson")
TIPOS_JS_CLASICO = ("", "text/javascript", "application/javascript")
URL_REMOTA = re.compile(r"""https?://[^\s"'`<>\\)]+""")


class ErrorOffline(Exception):
    """La copia sin red no se puede construir; el mensaje dice qué archivo y por qué."""


# ---------------------------------------------------------------------------------------------
# JavaScript: fichas de un módulo (para leer sus «import» sin confundirlos con comentarios o texto)
# ---------------------------------------------------------------------------------------------
# Después de estas palabras una «/» abre una expresión regular (después de otro nombre, divide).
PALABRAS_ANTES_DE_REGEX = {"return", "typeof", "instanceof", "in", "of", "new", "delete", "void", "throw",
                           "case", "do", "else", "yield", "await"}
# Después del «)» de estas también: if (x) /regex/.test(y)
PALABRAS_CON_PARENTESIS = {"if", "while", "for", "with"}


def fichas_js(fuente, ruta="<módulo>"):
    """Parte un módulo en fichas (tipo, inicio, fin, texto), sin espacios ni comentarios.

    Tipos: nombre | numero | cadena (texto = lo que va entre comillas) | plantilla (un tramo de
    texto de `…`) | regex | signo. Las posiciones son índices de `fuente`.
    No es un analizador completo de JavaScript: sabe lo justo para no leer como código lo que está
    dentro de comentarios, cadenas, plantillas (con ${…} anidado) y expresiones regulares.
    """
    fichas = []
    llaves = []      # una entrada por `…${ sin cerrar: cuántas «{» abiertas lleva esa expresión
    parentesis = []  # una entrada por «(» sin cerrar: True si es el de un if/while/for
    de_control = set()  # posiciones de los «)» que cierran un if/while/for
    i, n = 0, len(fuente)

    def falla(mensaje, pos):
        raise ErrorOffline(f"{ruta}:{fuente.count(chr(10), 0, pos) + 1}: {mensaje}")

    def tramo_plantilla(desde):
        """Texto de plantilla desde `desde` hasta el ` de cierre o el siguiente ${; devuelve dónde seguir."""
        j = desde
        while j < n:
            if fuente[j] == "\\":
                j += 2
            elif fuente[j] == "`":
                fichas.append(("plantilla", desde, j, fuente[desde:j]))
                return j + 1
            elif fuente.startswith("${", j):
                fichas.append(("plantilla", desde, j, fuente[desde:j]))
                fichas.append(("signo", j, j + 2, "${"))
                llaves.append(0)
                return j + 2
            else:
                j += 1
        falla("plantilla `…` sin cerrar", desde)

    def abre_regex():
        """¿La «/» que sigue abre una expresión regular? Se decide por la ficha anterior."""
        if not fichas:
            return True
        tipo, ini, _, texto = fichas[-1]
        previa = fichas[-2] if len(fichas) > 1 else None
        if tipo == "nombre":  # «return /x/», pero no «objeto.in / 2»
            return texto in PALABRAS_ANTES_DE_REGEX and not (previa and previa[0] == "signo" and previa[3] == ".")
        if tipo == "signo" and texto == ")":
            return ini in de_control
        if tipo != "signo" or texto in ("]", "}"):
            return False
        if texto in ("+", "-") and previa and previa[0] == "signo" and previa[3] == texto and previa[2] == ini:
            return False  # a++ / b
        return True

    def fin_regex(desde):
        """Posición después de la regex que abre en `desde` (y sus banderas); None si no cierra en la línea."""
        j, en_clase = desde + 1, False
        while j < n and fuente[j] != "\n":
            c = fuente[j]
            if c == "\\":
                j += 2
                continue
            if c == "[":
                en_clase = True
            elif c == "]":
                en_clase = False
            elif c == "/" and not en_clase:
                j += 1
                while j < n and fuente[j].isalnum():
                    j += 1
                return j
            j += 1
        return None

    if fuente.startswith("#!"):  # línea «#!» de un guion ejecutable
        i = fuente.find("\n") if "\n" in fuente else n
    while i < n:
        c = fuente[i]
        if c.isspace():
            i += 1
        elif fuente.startswith("//", i):
            fin = fuente.find("\n", i)
            i = n if fin < 0 else fin
        elif fuente.startswith("/*", i):
            fin = fuente.find("*/", i + 2)
            if fin < 0:
                falla("comentario /* sin cerrar", i)
            i = fin + 2
        elif c in "\"'":
            j = i + 1
            while j < n and fuente[j] != c:
                if fuente[j] == "\n":
                    falla("cadena sin cerrar", i)
                j += 2 if fuente[j] == "\\" else 1
            if j >= n:
                falla("cadena sin cerrar", i)
            fichas.append(("cadena", i, j + 1, fuente[i + 1:j]))
            i = j + 1
        elif c == "`":
            i = tramo_plantilla(i + 1)
        elif c == "/" and abre_regex() and fin_regex(i) is not None:
            j = fin_regex(i)
            fichas.append(("regex", i, j, fuente[i:j]))
            i = j
        elif c.isalpha() or c in "_$":
            j = i + 1
            while j < n and (fuente[j].isalnum() or fuente[j] in "_$"):
                j += 1
            fichas.append(("nombre", i, j, fuente[i:j]))
            i = j
        elif c.isdigit():
            j = i + 1
            while j < n and (fuente[j].isalnum() or fuente[j] in "._"):
                j += 1
            fichas.append(("numero", i, j, fuente[i:j]))
            i = j
        elif c == "}" and llaves and llaves[-1] == 0:
            llaves.pop()  # cierra el ${…}: sigue el texto de la plantilla
            i = tramo_plantilla(i + 1)
        else:
            if llaves and c in "{}":
                llaves[-1] += 1 if c == "{" else -1
            elif c == "(":
                parentesis.append(bool(fichas) and fichas[-1][0] == "nombre" and fichas[-1][3] in PALABRAS_CON_PARENTESIS)
            elif c == ")" and parentesis and parentesis.pop():
                de_control.add(i)
            fichas.append(("signo", i, i + 1, c))
            i += 1
    if llaves:
        falla("plantilla `…${ sin cerrar", n)
    return fichas


def analizar_modulo(fuente, ruta="<módulo>"):
    """Lo que la copia sin red necesita saber de un módulo.

    Devuelve {"cambios": [...], "textos": [...]}:
      cambios  en orden; cada uno cubre un tramo [de, a) de `fuente`:
               {"de", "a", "espec"}        el literal (con comillas) de un import/export … from "x" o import("x")
               {"de", "a", "meta": True}   un «import.meta.url» (desde una URL Blob no sirve para rutas relativas)
      textos   el contenido de cadenas y plantillas (para listar las URL remotas y las hojas .css que pide)
    """
    f = fichas_js(fuente, ruta)

    def es(k, tipo, texto=None):
        return 0 <= k < len(f) and f[k][0] == tipo and (texto is None or f[k][3] == texto)

    def literal(k):
        _, de, a, espec = f[k]
        if "\\" in espec:
            raise ErrorOffline(f"{ruta}: import {fuente[de:a]}: ruta con escapes, no admitida")
        return {"de": de, "a": a, "espec": espec}

    cambios = []
    for k, (tipo, ini, _, texto) in enumerate(f):
        if tipo != "nombre" or texto not in ("import", "export") or es(k - 1, "signo", "."):
            continue
        if texto == "import" and es(k + 1, "cadena"):  # import "./x.js";
            cambios.append(literal(k + 1))
        elif texto == "import" and es(k + 1, "signo", "("):  # import("./x.js")
            if not (es(k + 2, "cadena") and (es(k + 3, "signo", ")") or es(k + 3, "signo", ","))):
                linea = fuente.count("\n", 0, ini) + 1
                raise ErrorOffline(f"{ruta}:{linea}: import() con una expresión; la copia sin red solo "
                                   "resuelve rutas escritas como cadena")
            cambios.append(literal(k + 2))
        elif texto == "import" and es(k + 1, "signo", "."):  # import.meta.url
            if es(k + 2, "nombre", "meta") and es(k + 3, "signo", ".") and es(k + 4, "nombre", "url"):
                cambios.append({"de": ini, "a": f[k + 4][2], "meta": True})
        elif texto == "import" or es(k + 1, "signo", "{") or es(k + 1, "signo", "*"):
            # import a, { b as c } from "x"  ·  import * as d from "x"  ·  export { a } from "x"  ·  export * from "x"
            j = k + 1
            while j < len(f) and (f[j][0] == "nombre" or (f[j][0] == "signo" and f[j][3] in "{},*")):
                if es(j, "nombre", "from") and es(j + 1, "cadena"):
                    cambios.append(literal(j + 1))
                    break
                j += 1
    textos = [texto for tipo, _, _, texto in f if tipo in ("cadena", "plantilla")]
    return {"cambios": cambios, "textos": textos}


def resolver(espec, desde, web):
    """Ruta (posix, relativa a web/) del módulo que `desde` importa como `espec`; ErrorOffline si no se puede."""
    limpio = re.split(r"[?#]", espec, maxsplit=1)[0]
    if limpio.startswith(("./", "../")):
        destino = posixpath.normpath(posixpath.join(posixpath.dirname(desde), limpio))
    elif limpio.startswith("/") and not limpio.startswith("//"):
        destino = posixpath.normpath(limpio.lstrip("/"))
    else:
        raise ErrorOffline(f'{desde}: no se puede resolver import "{espec}": la copia sin red solo incrusta rutas '
                           "relativas (./ o ../); un paquete o una URL necesitarían red")
    if destino == ".." or destino.startswith("../"):
        raise ErrorOffline(f'{desde}: import "{espec}" sale de la carpeta de la web')
    if not (Path(web) / destino).is_file():
        raise ErrorOffline(f'{desde}: no se puede resolver import "{espec}": no existe {destino} en {web}')
    if not destino.endswith(EXT_MODULO):
        raise ErrorOffline(f'{desde}: import "{espec}" no es un módulo JavaScript ({", ".join(EXT_MODULO)})')
    return destino


def reunir_modulos(entradas, web):
    """Módulos alcanzables desde `entradas`, cada uno después de los que importa.

    Devuelve (orden, modulos); modulos[ruta] = {"fuente", "cambios", "textos"}. En "cambios" las
    posiciones ya van en unidades UTF-16 (como las cuenta JavaScript) y cada import lleva "modulo"
    (la ruta del módulo importado); un cambio sin "modulo" es un «import.meta.url».
    """
    web = Path(web)
    modulos, orden, en_curso = {}, [], []

    def visitar(ruta):
        if ruta in modulos:
            return
        if ruta in en_curso:
            ciclo = " → ".join(en_curso[en_curso.index(ruta):] + [ruta])
            raise ErrorOffline(f"importación circular ({ciclo}): con URL Blob cada módulo necesita que sus "
                               "dependencias existan antes")
        en_curso.append(ruta)
        fuente = (web / ruta).read_text(encoding="utf-8-sig")
        analisis = analizar_modulo(fuente, ruta)
        utf16 = (lambda i: i) if fuente.isascii() else (lambda i: len(fuente[:i].encode("utf-16-le")) // 2)
        cambios = []
        for c in analisis["cambios"]:
            cambio = {"de": utf16(c["de"]), "a": utf16(c["a"])}
            if not c.get("meta"):
                cambio["modulo"] = resolver(c["espec"], ruta, web)
                visitar(cambio["modulo"])
            cambios.append(cambio)
        en_curso.pop()
        modulos[ruta] = {"fuente": fuente, "cambios": cambios, "textos": analisis["textos"]}
        orden.append(ruta)

    for entrada in entradas:
        visitar(entrada)
    return orden, modulos


# ---------------------------------------------------------------------------------------------
# Texto que va dentro de <script> y <style>
# ---------------------------------------------------------------------------------------------
def json_para_html(texto):
    """JSON listo para un <script type="application/json">: sin «<» (ni </script ni <!--) y sin U+2028/U+2029.

    En un JSON válido esos tres caracteres solo aparecen dentro de cadenas, donde \\uXXXX vale lo mismo.
    """
    return texto.replace("<", "\\u003c").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")


def script_para_html(js):
    """(js, n): el código de un <script> clásico sin «</script» ni «<!--»; n = sustituciones hechas."""
    js, n1 = re.subn(r"(?i)</(script)", r"<\\/\1", js)
    n2 = js.count("<!--")
    return js.replace("<!--", "<\\!--"), n1 + n2


def estilo_para_html(css):
    return re.sub(r"(?i)</(style)", r"<\\/\1", css)


def comentario_html(texto):
    return "<!-- " + texto.replace("--", "- -") + " -->"


def es_remota(url):
    return bool(re.match(r"(?i)^(https?:)?//", url.strip()))


def es_local(url):
    """Una ruta a un archivo junto a la web (ni remota, ni data:/blob:/mailto:…, ni un ancla #…)."""
    u = url.strip()
    return bool(u) and not u.startswith("#") and not es_remota(u) and not re.match(r"(?i)^[a-z][a-z0-9+.-]*:", u)


def ruta_local(url, carpeta, web, quien):
    """Ruta (posix, relativa a web/) de `url`, escrita en un archivo de la carpeta `carpeta`."""
    limpia = unquote(re.split(r"[?#]", url.strip(), maxsplit=1)[0])
    ruta = posixpath.normpath(posixpath.join("" if limpia.startswith("/") else carpeta, limpia.lstrip("/")))
    if ruta == ".." or ruta.startswith("../"):
        raise ErrorOffline(f'{quien}: "{url}" sale de la carpeta de la web')
    if not (Path(web) / ruta).is_file():
        raise ErrorOffline(f'{quien}: "{url}" no existe en {web}')
    return ruta


def uri_de_datos(archivo):
    tipo = mimetypes.guess_type(archivo.name)[0] or "application/octet-stream"
    return f"data:{tipo};base64,{base64.b64encode(archivo.read_bytes()).decode('ascii')}"


# Tramos de una hoja de estilos que importan aquí: comentarios y cadenas (se dejan igual), url(…) y @import.
PARTES_CSS = re.compile(
    r"""/\*.*?\*/
      | "(?:\\.|[^"\\])*" | '(?:\\.|[^'\\])*'
      | url\(\s*(?:"(?P<doble>[^"]*)"|'(?P<simple>[^']*)'|(?P<suelta>[^)\s"']*))\s*\)
      | @import\b[^;]*;""",
    re.S | re.X | re.I)


def css_incrustable(css, ruta, web, informe):
    """La hoja `ruta` con cada url(archivo local) cambiada por una URI data: (tipografías, imágenes)."""
    def cambiar(m):
        texto = m.group(0)
        if texto.startswith(("/*", '"', "'")):
            return texto
        if texto[:1] == "@":
            raise ErrorOffline(f"{ruta}: {texto.strip()} — @import no se incrusta; enlace esa hoja desde index.html")
        destino = next((g for g in (m.group("doble"), m.group("simple"), m.group("suelta")) if g), "")
        if es_remota(destino):
            informe["remotas_solas"].append((ruta, destino))
            return texto
        if not es_local(destino):
            return texto  # data:, #ancla o vacío
        archivo = Path(web) / ruta_local(destino, posixpath.dirname(ruta), web, ruta)
        ancla = "#" + destino.split("#", 1)[1] if "#" in destino else ""
        return f'url("{uri_de_datos(archivo)}{ancla}")'
    return PARTES_CSS.sub(cambiar, css)


# ---------------------------------------------------------------------------------------------
# index.html: dónde está cada etiqueta (se cambian solo esos tramos; lo demás queda como está)
# ---------------------------------------------------------------------------------------------
class Pagina(HTMLParser):
    """Anota cada etiqueta de apertura con su posición en el texto, y el primer cierre de cada tipo."""

    def __init__(self, texto):
        super().__init__(convert_charrefs=True)
        self.texto = texto
        self._lineas = [0] + [m.end() for m in re.finditer("\n", texto)]
        self.aperturas = []  # {"tag", "attrs", "de", "a", "crudo"}; un <script> suma "fin" (después de </script>)
        self.cierres = {}    # tag -> (de, a) de su primer cierre
        self._script = None
        self.feed(texto)
        self.close()

    def _pos(self):
        linea, columna = self.getpos()
        return self._lineas[linea - 1] + columna

    def handle_starttag(self, tag, attrs):
        de, crudo = self._pos(), self.get_starttag_text()
        if self.texto[de:de + len(crudo)] != crudo:
            raise ErrorOffline(f"index.html: no se pudo ubicar la etiqueta {crudo[:60]}")
        e = {"tag": tag, "attrs": {k: v or "" for k, v in attrs}, "de": de, "a": de + len(crudo), "crudo": crudo}
        self.aperturas.append(e)
        self._script = e if tag == "script" else self._script

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)  # <link …/>: no tiene cierre aparte

    def handle_endtag(self, tag):
        de = self._pos()
        a = self.texto.find(">", de) + 1
        if not self.texto.startswith("</", de) or not a:
            return
        if tag == "script" and self._script is not None:
            self._script["fin"] = a
            self._script = None
        self.cierres.setdefault(tag, (de, a))


def cambiar_atributo(crudo, nombre, valor):
    """La etiqueta `crudo` con el atributo `nombre` puesto a `valor`."""
    patron = rf"""(?i)(\s{re.escape(nombre)}\s*=\s*)("[^"]*"|'[^']*'|[^\s>]+)"""
    return re.sub(patron, lambda m: f'{m.group(1)}"{html_lib.escape(valor, quote=True)}"', crudo, count=1)


def commit_corto(carpeta):
    """(sha corto, hay cambios sin confirmar en la carpeta) según git; (None, False) fuera de un repositorio."""
    def git(*args):
        return subprocess.run(["git", "-C", str(carpeta), *args], capture_output=True, text=True, check=True).stdout.strip()
    try:
        return git("rev-parse", "--short", "HEAD") or None, bool(git("status", "--porcelain", "--", "."))
    except (OSError, subprocess.CalledProcessError):
        return None, False


def texto_nota(commit, con_cambios):
    """La nota visible (inglés, como la interfaz). El único dato es el commit, que viene de git."""
    origen = ""
    if commit:
        origen = f" (commit {commit}{', plus uncommitted changes' if con_cambios else ''})"
    return f"Offline copy built from the repository{origen} — no network needed; base map tiles need a connection."


ESTILO_NOTA = """<style data-raiz-offline="nota">
/* Nota de la copia sin red: una línea propia al final de la cabecera; no sale en papel. */
.nota-offline { flex: 1 0 100%; margin: 0; font-size: 0.8rem; color: var(--tinta-suave, inherit); }
@media print { .nota-offline { display: none !important; } }
</style>"""

# Arranque de la página sin red. Va en un <script> clásico al final del cuerpo, después de las
# bibliotecas y de los bloques de datos y antes de que corra ningún módulo de la web.
ARRANQUE_JS = r"""// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Arranque de la copia sin red (lo escribe motor/demo_offline.py; no se edita aquí).
(() => {
  "use strict";
  const base = document.baseURI;
  const paquete = JSON.parse(document.getElementById("raiz-offline-paquete").textContent);
  /** URL que tendría el archivo `ruta` junto a esta página (la que los módulos verían en la web). */
  const urlVirtual = (ruta) => new URL(ruta, base).href;

  // 1) Datos: lo que la web pide de data/ se contesta con la copia incrustada (sin mirar ?consulta);
  //    lo demás sigue a la red de verdad (p. ej. las teselas del mapa base, si hay conexión).
  const datos = new Map();
  for (const bloque of document.querySelectorAll("script[data-raiz-dato]")) datos.set(bloque.dataset.raizDato, bloque);
  const carpetaDatos = urlVirtual("data/");
  /** Nombre del archivo incrustado que pide esta URL (lo que sigue a un «/data/» de su ruta), o null. */
  const incrustado = (url, metodo) => {
    if (!/^(GET|HEAD)$/i.test(metodo) || !/^(https?|file):$/.test(url.protocol)) return null;
    const ruta = url.pathname;
    for (let i = ruta.lastIndexOf("/data/"); i >= 0; i = i > 0 ? ruta.lastIndexOf("/data/", i - 1) : -1) {
      let nombre = ruta.slice(i + "/data/".length);
      try {
        nombre = decodeURIComponent(nombre);
      } catch {
        // se queda como vino
      }
      if (datos.has(nombre)) return nombre;
    }
    return null;
  };
  /** El archivo incrustado, como Blob con su tipo (lo que no es JSON viaja en base64). */
  const blobs = new Map();
  const blobDe = (nombre) => {
    if (!blobs.has(nombre)) {
      const bloque = datos.get(nombre);
      let contenido = bloque.textContent;
      if (bloque.type !== "application/json") {
        const binario = atob(contenido);
        contenido = new Uint8Array(binario.length);
        for (let i = 0; i < binario.length; i++) contenido[i] = binario.charCodeAt(i);
      }
      blobs.set(nombre, new Blob([contenido], { type: bloque.dataset.raizTipo }));
    }
    return blobs.get(nombre);
  };

  const fetchReal = typeof window.fetch === "function" ? window.fetch.bind(window) : null;
  const responder = (cuerpo, estado, texto, tipo) =>
    Promise.resolve(new Response(cuerpo, { status: estado, statusText: texto, headers: { "Content-Type": tipo } }));
  window.fetch = function fetchSinRed(recurso, opciones) {
    let url = null;
    let metodo = "GET";
    try {
      const pedido = typeof Request === "function" && recurso instanceof Request ? recurso : null;
      url = new URL(pedido ? pedido.url : String(recurso), base);
      metodo = String(opciones?.method ?? pedido?.method ?? "GET");
    } catch {
      url = null; // URL ilegible: que decida el fetch de verdad
    }
    if (url) {
      const nombre = incrustado(url, metodo);
      if (nombre !== null) return responder(blobDe(nombre), 200, "OK", datos.get(nombre).dataset.raizTipo);
      // Un archivo de la carpeta data/ de esta página que la copia no trae: 404, como un servidor sin
      // ese archivo (la web ya tolera que falten los opcionales).
      if (/^(GET|HEAD)$/i.test(metodo) && url.href.split(/[?#]/)[0].startsWith(carpetaDatos)) {
        return responder("Not found in this offline copy", 404, "Not Found", "text/plain; charset=utf-8");
      }
    }
    return fetchReal ? fetchReal(recurso, opciones) : Promise.reject(new TypeError("fetch is not available"));
  };

  // MapLibre, en una página file://, pide los archivos locales con XMLHttpRequest y no con fetch
  // (p. ej. las teselas de relieve de data/dem/): a esas peticiones se les da la copia incrustada
  // como URL Blob. Lo que no está incrustado sigue su camino.
  const urlsDeDatos = new Map();
  const abrirReal = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function abrirSinRed(metodo, destino, ...resto) {
    let nombre = null;
    try {
      nombre = incrustado(new URL(String(destino), base), String(metodo));
    } catch {
      nombre = null; // URL ilegible: que decida el navegador
    }
    if (nombre !== null && !urlsDeDatos.has(nombre)) urlsDeDatos.set(nombre, URL.createObjectURL(blobDe(nombre)));
    return abrirReal.call(this, metodo, nombre === null ? destino : urlsDeDatos.get(nombre), ...resto);
  };

  // 2) Hojas de estilos: ya están dentro de <style>. Los módulos que preguntan «¿ya está enlazada mi
  //    hoja?» (asegurarHoja en web/js/) deben encontrarla; si no, enlazarían un archivo que aquí no
  //    existe. Por cada hoja incrustada se deja un <link> vacío que, leído desde JavaScript, tiene
  //    el href de la hoja original.
  const hrefDeLink = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, "href");
  if (hrefDeLink?.get && hrefDeLink?.set) {
    Object.defineProperty(HTMLLinkElement.prototype, "href", {
      configurable: true,
      enumerable: true,
      get() {
        const ruta = this.getAttribute("data-raiz-hoja");
        return ruta ? urlVirtual(ruta) : hrefDeLink.get.call(this);
      },
      set(valor) {
        this.removeAttribute("data-raiz-hoja");
        hrefDeLink.set.call(this, valor);
      },
    });
    for (const ruta of paquete.hojas) {
      const marca = document.createElement("link");
      marca.rel = "stylesheet";
      marca.setAttribute("href", "data:text/css,#" + encodeURI(ruta));
      marca.setAttribute("data-raiz-hoja", ruta);
      document.head.append(marca);
    }
  }

  // 3) Módulos ES: un navegador no los carga desde file://. Se crea una URL Blob por módulo, las
  //    dependencias primero, y en cada uno se cambia el texto de sus «import» por la URL Blob del
  //    módulo importado (e «import.meta.url» por la URL que tendría en la web).
  const avisar = (error) => {
    console.error(error);
    const aviso = document.createElement("p");
    aviso.className = "error-carga";
    aviso.setAttribute("role", "alert");
    aviso.textContent =
      "This offline copy could not start in this browser (" + (error?.message ?? error) +
      "). Open it with a current version of Chrome, Edge or Firefox.";
    (document.getElementById("principal") ?? document.body).prepend(aviso);
  };
  try {
    const blobs = new Map();
    for (const ruta of paquete.orden) {
      const { fuente, cambios } = paquete.modulos[ruta];
      let codigo = fuente;
      // De atrás hacia adelante: así las posiciones de los cambios anteriores siguen valiendo.
      for (let i = cambios.length - 1; i >= 0; i--) {
        const c = cambios[i];
        const nuevo = c.modulo === undefined ? urlVirtual(ruta) : blobs.get(c.modulo);
        if (!nuevo) throw new Error("module " + c.modulo + " (imported by " + ruta + ") is not embedded");
        codigo = codigo.slice(0, c.de) + JSON.stringify(nuevo) + codigo.slice(c.a);
      }
      const nombre = "\n//# sourceURL=raiz-offline/" + ruta + "\n"; // nombre legible en la consola
      blobs.set(ruta, URL.createObjectURL(new Blob([codigo, nombre], { type: "text/javascript" })));
    }
    (async () => {
      for (const entrada of paquete.entradas) await import(blobs.get(entrada));
    })().catch(avisar);
  } catch (error) {
    avisar(error);
  }
})();
"""


# ---------------------------------------------------------------------------------------------
# Construcción
# ---------------------------------------------------------------------------------------------
def construir(web=WEB, salida=SALIDA, commit=None):
    """Escribe la copia sin red de `web` en `salida` y devuelve el informe (un dict).

    `commit`: None = preguntarle a git; una cadena = usarla tal cual en la nota (las pruebas).
    Lanza ErrorOffline si algo no se puede incrustar (un import sin resolver, un archivo que falta…).
    """
    web, salida = Path(web).resolve(), Path(salida)
    indice = web / ("explorador.html" if (web / "explorador.html").is_file() else "index.html")
    if not indice.is_file():
        raise ErrorOffline(f"no existe {indice}")
    texto = indice.read_text(encoding="utf-8-sig")
    pagina = Pagina(texto)
    informe = {"salida": str(salida), "entradas": [], "modulos": [], "hojas": [], "bibliotecas": [], "datos": [],
               "datos_binarios": [], "datos_no_incrustados": [], "remotas_bloquean": [], "remotas_solas": [], "remotas_codigo": [],
               "remotas_enlaces": [], "menciones": [], "enlaces_locales": [], "quitadas": [], "escapes_script": 0}
    cambios = []    # (de, a, texto nuevo) sobre el index.html original
    al_final = []   # scripts con defer/async: corren al final del cuerpo, en su orden
    licencias = set()

    def licencia(ruta):
        """Comentario con la licencia que acompaña a una biblioteca (una vez por carpeta)."""
        carpeta = (web / ruta).parent
        if carpeta == web or carpeta in licencias:
            return ""
        licencias.add(carpeta)
        return "".join(
            comentario_html(f"Licencia de {posixpath.dirname(ruta)} ({p.name}):\n{p.read_text(encoding='utf-8')}") + "\n"
            for p in sorted(carpeta.glob("LICEN[SC]E*")) if p.is_file())

    def bloque_estilo(ruta, medio=""):
        fuente = web / ruta
        css = css_incrustable(fuente.read_text(encoding="utf-8-sig"), ruta, web, informe)
        informe["hojas"].append((ruta, fuente.stat().st_size))
        informe["menciones"].append((ruta, len(URL_REMOTA.findall(css))))
        atributo = f' media="{html_lib.escape(medio, quote=True)}"' if medio else ""
        origen = html_lib.escape(ruta, quote=True)
        return f'{licencia(ruta)}<style data-origen="{origen}"{atributo}>\n{estilo_para_html(css)}\n</style>'

    for e in pagina.aperturas:
        tag, at = e["tag"], e["attrs"]
        if tag == "link" and "stylesheet" in at.get("rel", "").lower().split():
            href = at.get("href", "")
            if es_remota(href):
                informe["remotas_bloquean"].append(("index.html", href))
            elif es_local(href):
                ruta = ruta_local(href, "", web, "index.html")
                cambios.append((e["de"], e["a"], bloque_estilo(ruta, at.get("media", ""))))
        elif tag == "script":
            tipo, src = at.get("type", "").strip().lower(), at.get("src", "")
            if tipo == "module" and "src" not in at:
                raise ErrorOffline("index.html: un <script type=module> escrito en la página no se puede "
                                   "incrustar; póngalo en un archivo .js")
            if es_remota(src):
                informe["remotas_bloquean"].append(("index.html", src))
            if not es_local(src) or (tipo != "module" and tipo not in TIPOS_JS_CLASICO):
                continue
            if "fin" not in e:
                raise ErrorOffline(f"index.html: {e['crudo']} sin </script>")
            ruta = ruta_local(src, "", web, "index.html")
            if tipo == "module":
                informe["entradas"].append(ruta)
                aviso = f"{ruta}: módulo de entrada; en la copia sin red arranca al final del cuerpo"
                cambios.append((e["de"], e["fin"], comentario_html(aviso)))
                continue
            js, escapes = script_para_html((web / ruta).read_text(encoding="utf-8-sig"))
            informe["bibliotecas"].append((ruta, (web / ruta).stat().st_size))
            informe["menciones"].append((ruta, len(URL_REMOTA.findall(js))))
            informe["escapes_script"] += escapes
            bloque = f'{licencia(ruta)}<script data-origen="{html_lib.escape(ruta, quote=True)}">\n{js}\n</script>'
            if "defer" in at or "async" in at:
                al_final.append(bloque)
                bloque = comentario_html(f"{ruta}: en la copia sin red va incrustado al final del cuerpo")
            cambios.append((e["de"], e["fin"], bloque))
        else:
            # Cualquier otra etiqueta que apunte a un archivo o a la red.
            crudo = e["crudo"]
            for nombre in ("src", "href", "poster", "data"):
                valor = at.get(nombre, "")
                if nombre == "data" and tag != "object":
                    continue
                if es_remota(valor):
                    lista = "remotas_enlaces" if tag in ("a", "area") else "remotas_solas"
                    informe[lista].append(("index.html", valor))
                elif not es_local(valor):
                    continue
                elif tag in ("a", "area"):
                    informe["enlaces_locales"].append(valor)
                elif (tag, nombre) in INCRUSTABLES or (tag == "link" and "icon" in at.get("rel", "").lower()):
                    archivo = web / ruta_local(valor, "", web, "index.html")
                    crudo = cambiar_atributo(crudo, nombre, uri_de_datos(archivo))
                elif tag == "link":
                    # manifest de aplicación instalable, preload…: no sirven en un archivo suelto
                    informe["quitadas"].append(crudo)
                    crudo = comentario_html(f"{valor}: no viaja en la copia sin red ({at.get('rel', 'link')})")
                else:
                    raise ErrorOffline(f'index.html: <{tag} {nombre}="{valor}"> apunta a un archivo local que esta '
                                       "herramienta no sabe incrustar")
            if crudo != e["crudo"]:
                cambios.append((e["de"], e["a"], crudo))

    # Módulos: desde el de entrada, siguiendo sus import.
    if not informe["entradas"]:
        raise ErrorOffline('index.html no carga ningún <script type="module" src="…">: no hay aplicación que incrustar')
    orden, modulos = reunir_modulos(informe["entradas"], web)
    informe["modulos"] = [(ruta, (web / ruta).stat().st_size) for ruta in orden]
    for ruta in orden:
        for url in sorted({u for t in modulos[ruta]["textos"] for u in URL_REMOTA.findall(t)}):
            informe["remotas_codigo"].append((ruta, url))

    # Hojas que algún módulo enlaza por su cuenta (una cadena «….css») y que index.html no trae:
    # también se incrustan, al final de <head>, que es donde el módulo las habría puesto.
    en_cabeza = [ESTILO_NOTA]
    for ruta in orden:
        for t in modulos[ruta]["textos"]:
            if not (es_local(t) and re.split(r"[?#]", t)[0].endswith(".css")):
                continue
            for carpeta in (posixpath.dirname(ruta), ""):  # relativa al módulo o a la página
                try:
                    hoja = ruta_local(t, carpeta, web, ruta)
                except ErrorOffline:
                    continue
                if hoja not in [h for h, _ in informe["hojas"]]:
                    en_cabeza.append(bloque_estilo(hoja))
                break

    # Datos: todo lo que hay en web/data/. Los JSON/GeoJSON van tal cual (solo se escapa lo que
    # rompería el HTML); lo demás (p. ej. las teselas de relieve de data/dem/) va en base64.
    bloques_datos = []
    carpeta_datos = web / "data"
    for archivo in sorted(carpeta_datos.rglob("*")) if carpeta_datos.is_dir() else []:
        if not archivo.is_file():
            continue
        nombre = archivo.relative_to(carpeta_datos).as_posix()
        if any(parte.startswith(".") for parte in nombre.split("/")):
            informe["datos_no_incrustados"].append(nombre)  # .gitkeep y otros archivos ocultos
            continue
        if nombre.endswith(EXT_DATOS):
            contenido = archivo.read_text(encoding="utf-8-sig")
            try:
                json.loads(contenido)
            except ValueError as err:
                raise ErrorOffline(f"web/data/{nombre} no es JSON válido: {err}") from err
            tipo_bloque = "application/json"
            tipo = ("application/geo+json" if nombre.endswith(".geojson") else "application/json") + "; charset=utf-8"
            cuerpo = json_para_html(contenido)
            informe["menciones"].append((f"data/{nombre}", len(URL_REMOTA.findall(contenido))))
        else:
            tipo_bloque = "application/octet-stream"
            tipo = mimetypes.guess_type(nombre)[0] or "application/octet-stream"
            cuerpo = base64.b64encode(archivo.read_bytes()).decode("ascii")
            informe["datos_binarios"].append(nombre)
        atributo = html_lib.escape(nombre, quote=True)
        bloques_datos.append(f'<script type="{tipo_bloque}" id="raiz-dato-{atributo}" data-raiz-dato="{atributo}" '
                             f'data-raiz-tipo="{tipo}">{cuerpo}</script>')
        informe["datos"].append((nombre, archivo.stat().st_size))

    # Nota visible y bloques del final del cuerpo.
    con_cambios = False
    if commit is None:
        commit, con_cambios = commit_corto(web)
    informe["commit"], informe["con_cambios"] = commit, con_cambios
    informe["nota"] = texto_nota(commit, con_cambios)
    nota = f'<p class="nota-offline" id="nota-offline" role="note">{html_lib.escape(informe["nota"])}</p>\n'
    paquete = {"entradas": informe["entradas"], "orden": orden, "hojas": [h for h, _ in informe["hojas"]],
               "modulos": {r: {"fuente": modulos[r]["fuente"], "cambios": modulos[r]["cambios"]} for r in orden}}
    arranque, escapes = script_para_html(ARRANQUE_JS)
    informe["escapes_script"] += escapes
    final = "\n".join(
        [comentario_html("Copia sin red: bibliotecas, datos y módulos incrustados por motor/demo_offline.py")]
        + al_final + bloques_datos
        + ['<script type="application/json" id="raiz-offline-paquete">'
           + json_para_html(json.dumps(paquete, ensure_ascii=False, separators=(",", ":"))) + "</script>",
           f'<script data-raiz-offline="arranque">\n{arranque}</script>']) + "\n"

    def insertar(pos, nuevo):
        cambios.append((pos, pos, nuevo))

    cabeza = next((e for e in pagina.aperturas if e["tag"] == "head"), None)
    cuerpo = next((e for e in pagina.aperturas if e["tag"] == "body"), None)
    if cabeza:
        insertar(cabeza["a"], "\n  " + comentario_html(
            "Copia sin red en un solo archivo, generada por motor/demo_offline.py a partir de web/. No se edita a mano."))
    if "head" in pagina.cierres:
        insertar(pagina.cierres["head"][0], "\n".join(en_cabeza) + "\n")
    else:
        final = "\n".join(en_cabeza) + "\n" + final
    if "header" in pagina.cierres:
        insertar(pagina.cierres["header"][0], nota)  # al final de la cabecera
    elif cuerpo:
        insertar(cuerpo["a"], "\n" + nota)
    else:
        final = nota + final
    insertar(pagina.cierres["body"][0] if "body" in pagina.cierres else len(texto), final)

    partes, hasta = [], len(texto)
    for de, a, nuevo in sorted(cambios, key=lambda c: (c[0], c[1]), reverse=True):
        partes.append(texto[a:hasta])
        partes.append(nuevo)
        hasta = de
    partes.append(texto[:hasta])
    contenido = "".join(reversed(partes))
    salida.parent.mkdir(parents=True, exist_ok=True)
    salida.write_text(contenido, encoding="utf-8")
    informe["bytes"] = salida.stat().st_size
    return informe


def texto_informe(informe):
    """El informe de la construcción, en texto."""
    def tam(n):
        return f"{n:>12,} B"

    def lista(titulo, pares):
        return [f"{titulo} ({len(pares)}):"] + [f"  {tam(n)}  {ruta}" for ruta, n in pares]

    lineas = [f"Copia sin red: {informe['salida']}", f"Nota en la página: {informe['nota']}"]
    lineas += lista(f"Módulos ES incrustados, dependencias primero (entrada: {', '.join(informe['entradas'])})",
                    informe["modulos"])
    lineas += lista("Bibliotecas incrustadas como <script> clásico", informe["bibliotecas"])
    lineas += lista("Hojas de estilos incrustadas en <style>", informe["hojas"])
    binarios = set(informe["datos_binarios"])
    lineas += lista("Datos JSON/GeoJSON incrustados (se contestan sin red)", [d for d in informe["datos"] if d[0] not in binarios])
    grupos = {}  # lo que no es JSON (teselas de relieve…): un renglón por carpeta
    for nombre, n in informe["datos"]:
        if nombre in binarios:
            carpeta = nombre.split("/")[0] + "/" if "/" in nombre else nombre
            cuantos, total = grupos.get(carpeta, (0, 0))
            grupos[carpeta] = (cuantos + 1, total + n)
    if grupos:
        lineas.append(f"Otros archivos de web/data/ incrustados en base64 ({len(binarios)}):")
        lineas += [f"  {tam(total)}  {carpeta} ({cuantos} archivo{'s' if cuantos != 1 else ''})"
                   for carpeta, (cuantos, total) in grupos.items()]
    if informe["datos_no_incrustados"]:
        lineas.append("  NO incrustados (archivos ocultos de web/data/): " + ", ".join(informe["datos_no_incrustados"]))
    megas = informe["bytes"] / 1_000_000
    lineas.append(f"Tamaño total: {informe['bytes']:,} B ({megas:.1f} MB)")
    if informe["escapes_script"]:
        lineas.append(f"Secuencias </script o <!-- escapadas dentro de scripts: {informe['escapes_script']}")
    lineas.append("URL remotas que quedan:")
    if informe["remotas_bloquean"]:
        lineas.append("  ATENCIÓN — hojas o scripts remotos que DETIENEN la página si no hay red:")
        lineas += [f"    {url}  ({donde})" for donde, url in informe["remotas_bloquean"]]
    else:
        lineas.append("  hojas o scripts remotos que detendrían la página: ninguno")
    if informe["remotas_solas"]:
        lineas.append("  recursos remotos que la página pide sola (imágenes, tipografías; no la detienen):")
        lineas += [f"    {url}  ({donde})" for donde, url in informe["remotas_solas"]]
    else:
        lineas.append("  otros recursos remotos que la página pida sola (HTML/CSS): ninguno")
    lineas.append("  en el código de la web (se usan solo con red: teselas del mapa base, enlaces):")
    lineas += [f"    {url}  ({donde})" for donde, url in informe["remotas_codigo"]] or ["    ninguna"]
    if informe["remotas_enlaces"]:
        lineas.append("  enlaces <a> de index.html: " + ", ".join(url for _, url in informe["remotas_enlaces"]))
    menciones = [f"{ruta}: {n}" for ruta, n in informe["menciones"] if n]
    lineas.append("  menciones http(s) que no cargan nada (texto de fuentes, licencias, espacios de nombres): "
                  + ("; ".join(menciones) or "ninguna"))
    if informe["quitadas"]:
        lineas.append("Etiquetas <link> quitadas (no sirven en un archivo suelto): " + " ".join(informe["quitadas"]))
    if informe["enlaces_locales"]:
        lineas.append("AVISO — enlaces <a> a archivos locales que no viajan con la copia: "
                      + ", ".join(informe["enlaces_locales"]))
    return "\n".join(lineas)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Copia sin red de la web de ROOT en un solo archivo HTML.")
    ap.add_argument("--salida", default=str(SALIDA), help="archivo HTML que se escribe (por omisión dist/raiz-offline.html)")
    ap.add_argument("--web", default=str(WEB), help="carpeta de la web (por omisión web/)")
    args = ap.parse_args(argv)
    try:
        informe = construir(args.web, args.salida)
    except ErrorOffline as err:
        print(f"demo_offline: no se pudo construir la copia sin red — {err}", file=sys.stderr)
        return 1
    print(texto_informe(informe))
    return 1 if informe["remotas_bloquean"] else 0


if __name__ == "__main__":
    sys.exit(main())
