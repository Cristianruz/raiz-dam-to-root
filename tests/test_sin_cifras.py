# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""K-TEST 7 (versión inicial): «ninguna cifra en la página que no venga de los datos».

Revisa:
- el texto visible de web/index.html (más los atributos que se leen o se anuncian:
  alt, title, placeholder, aria-label…, y min/max/step/value de los controles);
- las cadenas literales ('…', "…" y el texto de las plantillas `…`) de web/app.js y de
  los demás web/*.js; si una cadena trae marcado HTML, cuenta su texto visible.
Falla si queda un dígito que no esté en tests/excepciones_cifras.json (cada
excepción con su motivo). Las cifras deben llegar de cubo.json, parcelas.geojson,
explicaciones.json, params.json o manifest.json, nunca escritas a mano.

Si web/index.html o web/app.js aún no existen, su prueba se marca «skip» (los
escribe la pieza web). Las pruebas del detector corren siempre, con ejemplos.
"""
import fnmatch
import json
import re
from html.parser import HTMLParser
from pathlib import Path

import pytest

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "web"
EXCEPCIONES = json.loads((RAIZ / "tests/excepciones_cifras.json").read_text(encoding="utf-8"))["excepciones"]
DIGITO = re.compile(r"\d")


# --- Texto visible del HTML --------------------------------------------------------
class TextoVisible(HTMLParser):
    """Junta [(línea, texto)] de lo que el usuario ve o escucha en la página."""

    OCULTOS = {"script", "style", "template"}
    ATRIBUTOS_VISIBLES = {"alt", "title", "placeholder", "aria-label", "aria-valuetext",
                          "aria-description", "aria-roledescription"}
    ATRIBUTOS_DE_CIFRA = {"aria-valuemin", "aria-valuemax", "aria-valuenow"}
    # Controles cuyo valor se dibuja en pantalla (deslizador, medidores).
    CONTROLES = {"input": {"min", "max", "step", "value"}, "meter": {"min", "max", "value", "low", "high", "optimum"},
                 "progress": {"max", "value"}, "button": {"value"}, "option": {"label"}}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.fragmentos = []
        self.oculto = 0

    def handle_starttag(self, tag, attrs):
        if tag in self.OCULTOS:
            self.oculto += 1
        self._atributos(tag, attrs)

    def handle_startendtag(self, tag, attrs):
        self._atributos(tag, attrs)

    def handle_endtag(self, tag):
        if tag in self.OCULTOS and self.oculto:
            self.oculto -= 1

    def handle_data(self, data):
        if not self.oculto and data.strip():
            self.fragmentos.append((self.getpos()[0], data.strip()))

    def _atributos(self, tag, attrs):
        if self.oculto:
            return
        de_control = self.CONTROLES.get(tag, set())
        for nombre, valor in attrs:
            if valor and (nombre in self.ATRIBUTOS_VISIBLES or nombre in self.ATRIBUTOS_DE_CIFRA
                          or nombre in de_control):
                self.fragmentos.append((self.getpos()[0], f"{tag}[{nombre}]={valor}"))


def texto_visible_html(fuente):
    p = TextoVisible()
    p.feed(fuente)
    p.close()
    return p.fragmentos


# --- Cadenas literales de JavaScript -----------------------------------------------
PALABRAS_ANTES_DE_REGEX = {"return", "typeof", "instanceof", "in", "of", "new", "delete", "void",
                           "throw", "case", "do", "else", "yield", "await"}
ESCAPE_JS = re.compile(r"\\(?:u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|(\r\n|.))", re.S)
ESCAPES_SIMPLES = {"n": "\n", "t": "\t", "r": "\r", "b": "\b", "f": "\f", "v": "\v", "0": "\0"}


def decodificar_escapes(texto):
    """Convierte \\u2212, \\x41, \\n… en su carácter (para no confundir el código del escape con una cifra)."""
    def sustituir(m):
        llave, u4, x2, otro = m.groups()
        codigo = llave or u4 or x2
        if codigo:
            return chr(int(codigo, 16))
        if otro in ("\n", "\r\n"):
            return ""  # continuación de línea
        return ESCAPES_SIMPLES.get(otro, otro)
    return ESCAPE_JS.sub(sustituir, texto)


class LectorJS:
    """Tokenizador mínimo: separa comentarios, expresiones regulares y cadenas del código."""

    def __init__(self, fuente):
        self.s = fuente
        self.i = 0
        self.cadenas = []  # [(línea, texto)]

    def linea(self, pos):
        return self.s.count("\n", 0, pos) + 1

    def leer(self):
        self.codigo(dentro_de_plantilla=False)
        return self.cadenas

    def codigo(self, dentro_de_plantilla):
        s, ultimo, prof = self.s, "", 0
        while self.i < len(s):
            c = s[self.i]
            if c.isspace():
                self.i += 1
            elif s.startswith("//", self.i):
                fin = s.find("\n", self.i)
                self.i = len(s) if fin < 0 else fin
            elif s.startswith("/*", self.i):
                fin = s.find("*/", self.i + 2)
                self.i = len(s) if fin < 0 else fin + 2
            elif c in "'\"":
                self.cadena(c)
                ultimo = "cadena"
            elif c == "`":
                self.plantilla()
                ultimo = "cadena"
            elif c == "/":
                if self.empieza_regex(ultimo):
                    self.regex()
                    ultimo = "regex"
                else:
                    self.i += 1
                    ultimo = "/"
            elif c.isalnum() or c in "_$":
                j = self.i
                while j < len(s) and (s[j].isalnum() or s[j] in "_$"):
                    j += 1
                ultimo = s[self.i:j]
                self.i = j
            else:
                if dentro_de_plantilla and c == "{":
                    prof += 1
                elif dentro_de_plantilla and c == "}":
                    if prof == 0:
                        self.i += 1
                        return
                    prof -= 1
                ultimo = c
                self.i += 1

    @staticmethod
    def empieza_regex(ultimo):
        """Una «/» abre una regex después de un operador, de «(», «,», «=»… o de ciertas palabras."""
        if ultimo in ("", "}") or ultimo in PALABRAS_ANTES_DE_REGEX:
            return True
        if ultimo in ("cadena", "regex", ")", "]"):
            return False
        return not (ultimo[0].isalnum() or ultimo[0] in "_$")

    def cadena(self, comilla):
        inicio = self.i
        j = self.i + 1
        while j < len(self.s) and self.s[j] != comilla and self.s[j] != "\n":
            j += 2 if self.s[j] == "\\" else 1
        self.cadenas.append((self.linea(inicio), decodificar_escapes(self.s[inicio + 1:j])))
        self.i = j + 1

    def plantilla(self):
        inicio = self.i
        self.i += 1
        partes, actual = [], []
        while self.i < len(self.s):
            c = self.s[self.i]
            if c == "\\":
                actual.append(self.s[self.i:self.i + 2])
                self.i += 2
            elif c == "`":
                self.i += 1
                break
            elif self.s.startswith("${", self.i):
                partes.append(decodificar_escapes("".join(actual)))
                actual = []
                self.i += 2
                self.codigo(dentro_de_plantilla=True)  # las cadenas internas se registran solas
            else:
                actual.append(c)
                self.i += 1
        partes.append(decodificar_escapes("".join(actual)))
        self.cadenas.append((self.linea(inicio), "${…}".join(partes)))

    def regex(self):
        j, en_clase = self.i + 1, False
        while j < len(self.s) and self.s[j] != "\n":
            c = self.s[j]
            if c == "\\":
                j += 2
                continue
            if c == "[":
                en_clase = True
            elif c == "]":
                en_clase = False
            elif c == "/" and not en_clase:
                break
            j += 1
        j += 1
        while j < len(self.s) and self.s[j].isalpha():  # banderas
            j += 1
        self.i = j


def cadenas_js(fuente):
    return LectorJS(fuente).leer()


PARECE_HTML = re.compile(r"<[A-Za-z/!]")


def fragmentos_js(fuente):
    """Cadenas de JS. Si una cadena trae marcado HTML (plantillas de la ficha), cuenta solo
    su texto visible y sus atributos visibles, igual que en index.html: «<h3>» no es una cifra."""
    salida = []
    for linea, texto in cadenas_js(fuente):
        if PARECE_HTML.search(texto):
            salida += [(linea, t) for _, t in texto_visible_html(texto)]
        else:
            salida.append((linea, texto))
    return salida


# --- Excepciones y verificación ------------------------------------------------------
def aplica(excepcion, archivo):
    patrones = excepcion.get("archivos") or ["*"]
    return any(fnmatch.fnmatch(archivo, p) for p in patrones)


def limpiar(texto, archivo, excepciones=EXCEPCIONES):
    for e in excepciones:
        if not aplica(e, archivo):
            continue
        if "texto" in e:
            texto = texto.replace(e["texto"], " ")
        else:
            texto = re.sub(e["patron"], " ", texto)
    return texto


def cifras_sin_fuente(fragmentos, archivo, excepciones=EXCEPCIONES):
    """[(línea, texto)] de los fragmentos que conservan dígitos tras quitar las excepciones."""
    return [(n, t) for n, t in fragmentos if DIGITO.search(limpiar(t, archivo, excepciones))]


def mensaje(archivo, malas):
    lineas = [f"{archivo}:{n}: {t[:120]!r}" for n, t in malas[:20]]
    return (f"{len(malas)} textos con cifras escritas a mano en web/{archivo}. Léalas de los datos o, si no "
            f"son cifras, agréguelas a tests/excepciones_cifras.json con su motivo:\n" + "\n".join(lineas))


# --- Pruebas que corren siempre ---------------------------------------------------------
def test_excepciones_bien_formadas():
    assert EXCEPCIONES, "la lista de excepciones no puede estar vacía si existe el archivo"
    for e in EXCEPCIONES:
        assert e.get("motivo", "").strip(), f"excepción sin motivo: {e}"
        assert ("texto" in e) != ("patron" in e), f"use «texto» o «patron», no ambos ni ninguno: {e}"
        if "patron" in e:
            re.compile(e["patron"])


def test_detector_encuentra_cifra_escrita_a_mano_en_html():
    html = ("<html><head><title>Raíz</title><style>.a{width:12px}</style></head><body>"
            "<h1>Water allocation</h1><p>Like 2026: 3.5 thousand m³/ha</p>"
            "<img alt='Map'><input type='range' min='0' max='12'>"
            "<script>const x = 'Rain −20%';</script><p>FAO-56 method</p></body></html>")
    malas = cifras_sin_fuente(texto_visible_html(html), "index.html")
    textos = " | ".join(t for _, t in malas)
    assert "3.5" in textos, "el detector no vio la cifra escrita en un <p>"
    assert "max]=12" in textos, "el detector no vio el máximo escrito en el deslizador"
    assert "width" not in textos and "Rain" not in textos, "el CSS y el <script> no son texto visible"
    assert "FAO-56" not in textos, "FAO-56 está en las excepciones"


def test_detector_encuentra_cifra_escrita_a_mano_en_js():
    js = (
        "// comentario con 99 que no cuenta\n"
        "const a = 'Rain −20%';\n"
        "const b = `${d} of 12 fields`;\n"
        "const r = /[\"'\\d]{2}/g; const c = \"ok\";\n"
        "const e = x / 2 / y; const f = 'sin cifra';\n"
        "const g = '\\u2212'; /* 77 */ const h = `ok ${fmt(v, 'v3')} ok`;\n"
        "const color = '#1F6FB2';\n"
    )
    cadenas = cadenas_js(js)
    todas = [t for _, t in cadenas]
    assert "Rain −20%" in todas and "${…} of 12 fields" in todas and "ok" in todas and "sin cifra" in todas
    assert "−" in todas, "\\u2212 debe decodificarse como el signo menos, sin dígitos"
    malas = {t for _, t in cifras_sin_fuente(cadenas, "app.js")}
    assert malas == {"Rain −20%", "${…} of 12 fields", "v3"}, malas


def test_detector_lee_el_html_dentro_de_las_cadenas_js():
    js = ("const a = `<section><h3 id=\"t\" tabindex=\"-1\">Follow the drop</h3>`;\n"
          "const b = `<p class=\"${c}\">${n} of 12 fields</p>`;\n"
          "const d = '<img alt=\"Field 7\">';\n")
    malas = {t for _, t in cifras_sin_fuente(fragmentos_js(js), "app.js")}
    assert malas == {"${…} of 12 fields", "img[alt]=Field 7"}, malas


# --- Pruebas sobre la web real -------------------------------------------------------------
def archivos_js():
    nombres = {p.name for p in WEB.glob("*.js")} | {"app.js"}
    return sorted(nombres)


def test_index_html_sin_cifras():
    ruta = WEB / "index.html"
    if not ruta.exists():
        pytest.skip("pendiente: web/index.html aún no existe (lo escribe la pieza web)")
    malas = cifras_sin_fuente(texto_visible_html(ruta.read_text(encoding="utf-8")), "index.html")
    assert not malas, mensaje("index.html", malas)


@pytest.mark.parametrize("nombre", archivos_js())
def test_cadenas_js_sin_cifras(nombre):
    ruta = WEB / nombre
    if not ruta.exists():
        pytest.skip(f"pendiente: web/{nombre} aún no existe (lo escribe la pieza web)")
    malas = cifras_sin_fuente(fragmentos_js(ruta.read_text(encoding="utf-8")), nombre)
    assert not malas, mensaje(nombre, malas)
