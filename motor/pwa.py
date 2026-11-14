# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Aplicación instalable y sin conexión (PWA) del gemelo digital: iconos, manifest y listado de la copia.

Decisión: docs/decisiones/2026-11-14_gemelo_digital.md («Qué cambia en el producto», punto 4).
Escribe tres cosas dentro de web/ (ninguna se edita a mano):

  web/icons/raiz-192.png, raiz-512.png, raiz-maskable-512.png
      Dibujo propio y simple con los colores de la identidad (kit C1 §10): una gota sobre el suelo y, bajo
      ella, una raíz. Sin logotipos de NASA ni de terceros. Se dibujan con Pillow y quedan versionados como
      archivos estáticos, igual que las teselas de relieve: `python construir.py` y GitHub Actions NO
      necesitan Pillow, solo leen los PNG que ya están. Por omisión solo se dibujan los que falten; para
      volver a dibujarlos todos (si cambió el dibujo): python motor/pwa.py --iconos

  web/manifest.webmanifest
      Manifest de la aplicación web: name, short_name, description, start_url y scope relativos («./», para
      que sirva igual en GitHub Pages que en la mesa del Open House), display «standalone», colores de la
      identidad e iconos (solo los que existen, con el tamaño leído del propio PNG).

  web/data/precache.json = { "version": "…", "archivos": ["index.html", "app.js", …] }
      archivos  TODO lo que la aplicación necesita sin red, como rutas relativas a web/ con «/», en orden
                alfabético. Regla del recorrido: todos los archivos de web/ menos (a) sw.js (el navegador
                lo guarda aparte) y (b) lo oculto (archivo o carpeta cuyo nombre empieza con punto).
                El listado se incluye a sí mismo (data/precache.json).
      version   16 caracteres hexadecimales del sha256 del listado «<sha256 del contenido>  <ruta>» de cada
                archivo (menos el propio precache.json, que no puede contener su huella). Cambia si se agrega,
                se quita o se modifica cualquier archivo: así web/sw.js sabe que debe guardar una copia nueva.

Quién los usa: web/sw.js (lee data/precache.json y guarda todo en la caché «raiz-<version>») y
web/js/instalar.js (botón «Install app» e indicador de conexión).

Conexión al comando único (la hace el integrador en construir.py): pwa.construir() debe correr DESPUÉS de
todo lo que escribe en web/ (cubo, relieve, gemelo, contexto, manifest.json, pruebas.json), porque la
versión es la huella de esos archivos. Es idempotente: sin cambios en web/, reescribe los mismos octetos.

API:  construir(web=WEB, regenerar_iconos=False) -> resumen
          {"ejecutado": True, "version": str, "archivos": int, "bytes": int, "iconos": [rutas],
           "iconos_dibujados": [rutas], "escritos": [rutas que cambiaron], "avisos": [str]}
      listar(web=WEB) -> [rutas]            la regla del recorrido
      version_de(web, archivos) -> str      la huella del listado
      dibujar_icono(lado, proposito)        imagen de Pillow («any» o «maskable»)
      medidas_png(ruta) -> (ancho, alto)    con la biblioteca estándar
Uso:  python motor/pwa.py [--web web] [--iconos]
Pruebas: tests/test_pwa.py (sin navegador) y tests/e2e/pwa_smoke.mjs (Chromium: instala, corta la red, recarga).
"""
import argparse
import hashlib
import io
import json
import math
import struct
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
WEB = RAIZ / "web"
ENCABEZADO = "AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026"

MANIFEST = "manifest.webmanifest"
PRECACHE = "data/precache.json"
SERVICE_WORKER = "sw.js"
LARGO_VERSION = 16  # caracteres hexadecimales de la versión (64 bits: de sobra para no repetirse)

# Identidad (kit C1 §10): los mismos códigos que las variables --agua, --brote… de web/style.css
# (tests/test_pwa.py comprueba que coincidan).
COLORES = {"agua": "#1F6FB2", "brote": "#4C9A2A", "tierra": "#8A5A3B", "ambar": "#D98E04", "arena": "#F5EFE6"}

# Textos del manifest. Interfaz en inglés; sin «first», sin «only» y sin cifras (CLAUDE.md, reglas 3, 9 y 10).
# La descripción es la misma frase de <meta name="description"> de web/index.html.
NOMBRE = "Raíz – From Dam to Root"
NOMBRE_CORTO = "Raíz"
DESCRIPCION = ("Before you plant, see the water you are committing: how much each crop needs per year, "
               "for how many years, and how many hectares the dam can cover.")

# Iconos del manifest. «any»: cuadro de esquinas redondeadas sobre transparente. «maskable»: cuadro completo
# con el dibujo dentro de la zona segura (el sistema lo recorta en círculo, gota o cuadro redondeado).
ICONOS = (
    {"archivo": "icons/raiz-192.png", "lado": 192, "proposito": "any"},
    {"archivo": "icons/raiz-512.png", "lado": 512, "proposito": "any"},
    {"archivo": "icons/raiz-maskable-512.png", "lado": 512, "proposito": "maskable"},
)
FIRMA_PNG = b"\x89PNG\r\n\x1a\n"

# --- Medidas del dibujo (fracciones del lado del icono; son diseño, no datos) -----------------------
SOBREMUESTREO = 4            # se dibuja a 4 veces el tamaño y se reduce: bordes suaves
RADIO_ESQUINA = 0.22         # esquinas del icono «any»
ESCALA_MASKABLE = 0.78       # el dibujo se encoge hacia el centro: todo cabe en el círculo seguro (radio 0.4)
SUELO_Y = 0.56               # línea del suelo: arriba el aire (arena), abajo la tierra
PASTO_ALTO = 0.035           # franja verde en la superficie del suelo
GOTA_RADIO = 0.150           # la gota descansa sobre el suelo: círculo con punta hacia arriba
GOTA_PUNTA_Y = 0.105
# Raíz: curvas de Bézier cuadráticas (inicio, control, fin) con grosor inicial y final (se adelgazan).
RAICES = (
    ((0.500, 0.560), (0.516, 0.740), (0.494, 0.905), 0.056, 0.020),   # raíz principal
    ((0.500, 0.640), (0.400, 0.655), (0.272, 0.800), 0.038, 0.014),   # rama izquierda
    ((0.502, 0.700), (0.600, 0.715), (0.725, 0.845), 0.036, 0.014),   # rama derecha
    ((0.500, 0.790), (0.452, 0.822), (0.388, 0.900), 0.026, 0.012),   # raicilla izquierda
    ((0.500, 0.835), (0.540, 0.862), (0.598, 0.912), 0.022, 0.011),   # raicilla derecha
)


class ErrorPWA(Exception):
    """No se pudo construir la aplicación instalable; el mensaje dice qué falta."""


# --- Utilidades ---------------------------------------------------------------------------------------
def sha256_archivo(ruta):
    h = hashlib.sha256()
    with open(ruta, "rb") as f:
        for trozo in iter(lambda: f.read(1 << 20), b""):
            h.update(trozo)
    return h.hexdigest()


def _escribir_si_cambia(ruta, datos, escritos, web):
    """Escribe `datos` (bytes) solo si el archivo no existe o es distinto: correr dos veces no toca nada."""
    ruta = Path(ruta)
    if ruta.exists() and ruta.read_bytes() == datos:
        return False
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_bytes(datos)
    escritos.append(ruta.relative_to(web).as_posix())
    return True


def _json(objeto):
    return (json.dumps(objeto, ensure_ascii=False, indent=1) + "\n").encode("utf-8")


def medidas_png(ruta):
    """(ancho, alto) de un PNG, leídos de su cabecera IHDR con la biblioteca estándar."""
    with open(ruta, "rb") as f:
        cabeza = f.read(24)
    if len(cabeza) < 24 or cabeza[:8] != FIRMA_PNG or cabeza[12:16] != b"IHDR":
        raise ErrorPWA(f"{ruta}: no es un PNG")
    return struct.unpack(">II", cabeza[16:24])


# --- Iconos (Pillow) ----------------------------------------------------------------------------------
def _pillow():
    """Módulos de Pillow, o None si no está instalado (GitHub Actions: se usan los PNG ya versionados)."""
    try:
        from PIL import Image, ImageDraw, PngImagePlugin
    except ImportError:
        return None
    return Image, ImageDraw, PngImagePlugin


def _rgb(codigo):
    codigo = codigo.lstrip("#")
    return tuple(int(codigo[i:i + 2], 16) for i in (0, 2, 4))


def _bezier(p0, p1, p2, pasos):
    """Puntos (x, y, t) de una curva de Bézier cuadrática."""
    for i in range(pasos + 1):
        t = i / pasos
        a, b, c = (1 - t) ** 2, 2 * (1 - t) * t, t ** 2
        yield a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1], t


def dibujar_icono(lado, proposito="any"):
    """Imagen RGBA de `lado` píxeles: una gota (agua) sobre el suelo y su raíz (arena) dentro de la tierra.

    «any»: esquinas redondeadas sobre transparente. «maskable»: cuadro completo, dibujo en la zona segura.
    """
    mods = _pillow()
    if mods is None:
        raise ErrorPWA("Pillow no está instalado: pip install Pillow (solo hace falta para dibujar los iconos)")
    Image, ImageDraw, _ = mods
    if proposito not in ("any", "maskable"):
        raise ErrorPWA(f"propósito de icono desconocido: {proposito}")
    n = lado * SOBREMUESTREO
    escala = ESCALA_MASKABLE if proposito == "maskable" else 1.0

    def px(x, y):
        """Fracción del dibujo -> píxel del lienzo (el dibujo se encoge hacia el centro en «maskable»)."""
        return (0.5 + (x - 0.5) * escala) * n, (0.5 + (y - 0.5) * escala) * n

    agua, brote, tierra, arena = (_rgb(COLORES[c]) for c in ("agua", "brote", "tierra", "arena"))
    lienzo = Image.new("RGBA", (n, n), arena + (255,))
    d = ImageDraw.Draw(lienzo)

    # Suelo: tierra de lado a lado (también fuera de la zona segura) y una franja de pasto en la superficie.
    _, y_suelo = px(0.5, SUELO_Y)
    _, y_pasto = px(0.5, SUELO_Y + PASTO_ALTO)
    d.rectangle([0, y_suelo, n, n], fill=tierra + (255,))
    d.rectangle([0, y_suelo, n, y_pasto], fill=brote + (255,))

    # Raíz: círculos a lo largo de cada curva, cada vez más chicos (trazo redondeado que se adelgaza).
    for p0, p1, p2, grueso0, grueso1 in RAICES:
        for x, y, t in _bezier(p0, p1, p2, pasos=160):
            cx, cy = px(x, y)
            r = (grueso0 + (grueso1 - grueso0) * t) * escala * n / 2
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=arena + (255,))

    # Gota: círculo que toca el suelo y dos tangentes que se juntan en la punta.
    cx, cy = 0.5, SUELO_Y - GOTA_RADIO
    alfa = math.acos(GOTA_RADIO / (cy - GOTA_PUNTA_Y))     # ángulo, desde la vertical, del punto de tangencia
    contorno = [px(cx, GOTA_PUNTA_Y)]
    pasos = 96
    for i in range(pasos + 1):
        fi = alfa + (2 * math.pi - 2 * alfa) * i / pasos   # de la tangencia derecha a la izquierda, por abajo
        contorno.append(px(cx + GOTA_RADIO * math.sin(fi), cy - GOTA_RADIO * math.cos(fi)))
    d.polygon(contorno, fill=agua + (255,))

    if proposito == "any":
        mascara = Image.new("L", (n, n), 0)
        ImageDraw.Draw(mascara).rounded_rectangle([0, 0, n - 1, n - 1], radius=RADIO_ESQUINA * n, fill=255)
        lienzo.putalpha(mascara)
    return lienzo.resize((lado, lado), Image.LANCZOS)


def _png_de_icono(lado, proposito):
    """Bytes del PNG, con el encabezado de la regla 4 como texto dentro del archivo (trozo iTXt)."""
    _, _, PngImagePlugin = _pillow()
    info = PngImagePlugin.PngInfo()
    info.add_itxt("Comment", ENCABEZADO)
    info.add_itxt("Source", "motor/pwa.py (dibujo propio: gota y raíz)")
    salida = io.BytesIO()
    dibujar_icono(lado, proposito).save(salida, format="PNG", optimize=True, pnginfo=info)
    return salida.getvalue()


def _construir_iconos(web, regenerar, escritos, avisos):
    """Dibuja los iconos que falten (o todos, con regenerar=True). Devuelve (existentes, dibujados)."""
    dibujados = []
    pendientes = [i for i in ICONOS if regenerar or not (web / i["archivo"]).exists()]
    if pendientes and _pillow() is None:
        faltan = [i["archivo"] for i in pendientes if not (web / i["archivo"]).exists()]
        if faltan:
            avisos.append("iconos: faltan " + ", ".join(faltan) + " y Pillow no está instalado "
                          "(pip install Pillow y python motor/pwa.py)")
        elif regenerar:
            avisos.append("iconos: no se volvieron a dibujar porque Pillow no está instalado; quedan los que había")
        pendientes = []
    for icono in pendientes:
        if _escribir_si_cambia(web / icono["archivo"], _png_de_icono(icono["lado"], icono["proposito"]), escritos, web):
            dibujados.append(icono["archivo"])
    existentes = []
    for icono in ICONOS:
        ruta = web / icono["archivo"]
        if not ruta.exists():
            continue
        medidas = medidas_png(ruta)
        if medidas != (icono["lado"], icono["lado"]):
            avisos.append(f"iconos: {icono['archivo']} mide {medidas[0]} × {medidas[1]} px y debería medir "
                          f"{icono['lado']} × {icono['lado']}; vuelva a dibujarlo con python motor/pwa.py --iconos")
            continue
        existentes.append(icono)
    return existentes, dibujados


# --- Manifest -----------------------------------------------------------------------------------------
def manifest_de(iconos):
    """Contenido de web/manifest.webmanifest. Las rutas son relativas al propio manifest (carpeta web/)."""
    return {
        "_encabezado": ENCABEZADO,
        "_nota": "Generado por motor/pwa.py; nunca se edita a mano (docs/decisiones/2026-11-14_gemelo_digital.md, punto 4).",
        "name": NOMBRE,
        "short_name": NOMBRE_CORTO,
        "description": DESCRIPCION,
        "lang": "en",
        "dir": "ltr",
        "start_url": "./",
        "scope": "./",
        "display": "standalone",
        "background_color": COLORES["arena"],
        "theme_color": COLORES["agua"],
        "icons": [{"src": i["archivo"], "sizes": f"{i['lado']}x{i['lado']}", "type": "image/png",
                   "purpose": i["proposito"]} for i in iconos],
    }


# --- Listado de la copia sin conexión -----------------------------------------------------------------
def listar(web=WEB):
    """Rutas relativas a web/ (con «/», ordenadas) de todo lo que la aplicación necesita sin red.

    Regla: todos los archivos de web/, menos sw.js y lo oculto (nombre que empieza con punto, en el archivo
    o en cualquiera de sus carpetas). El listado se incluye a sí mismo aunque todavía no exista.
    """
    web = Path(web)
    rutas = {PRECACHE}
    for p in web.rglob("*"):
        relativa = p.relative_to(web)
        if not p.is_file() or any(parte.startswith(".") for parte in relativa.parts):
            continue
        if relativa.as_posix() != SERVICE_WORKER:
            rutas.add(relativa.as_posix())
    return sorted(rutas)


def version_de(web, archivos):
    """Huella corta del listado: sha256 de las líneas «<sha256 del contenido>  <ruta>» (sin el propio listado)."""
    web = Path(web)
    h = hashlib.sha256()
    for ruta in archivos:
        if ruta != PRECACHE:
            h.update(f"{sha256_archivo(web / ruta)}  {ruta}\n".encode("utf-8"))
    return h.hexdigest()[:LARGO_VERSION]


def precache_de(web):
    """Contenido de web/data/precache.json con lo que hay en web/ en este momento."""
    archivos = listar(web)
    return {
        "_encabezado": ENCABEZADO,
        "_nota": "Generado por motor/pwa.py recorriendo web/ (todo menos sw.js y lo oculto); nunca se edita a mano. "
                 "«version» es la huella del contenido de esos archivos: web/sw.js guarda la copia sin conexión en "
                 "la caché raiz-<version> y la renueva cuando cambia.",
        "version": version_de(web, archivos),
        "archivos": archivos,
    }


# --- Construcción -------------------------------------------------------------------------------------
def construir(web=WEB, regenerar_iconos=False):
    """Deja en `web` los iconos, el manifest y el listado de la copia sin conexión. Idempotente."""
    web = Path(web)
    if not (web / "index.html").exists():
        raise ErrorPWA(f"{web} no tiene index.html: no es la carpeta de la web")
    escritos, avisos = [], []
    if not (web / SERVICE_WORKER).exists():
        avisos.append(f"falta {SERVICE_WORKER}: sin él la aplicación no guarda la copia sin conexión")

    # 1) Iconos, 2) manifest (solo con los iconos que existen), 3) listado: en ese orden, porque la versión
    #    del listado es la huella de todo lo anterior.
    iconos, dibujados = _construir_iconos(web, regenerar_iconos, escritos, avisos)
    _escribir_si_cambia(web / MANIFEST, _json(manifest_de(iconos)), escritos, web)
    precache = precache_de(web)
    _escribir_si_cambia(web / PRECACHE, _json(precache), escritos, web)

    peso = sum((web / r).stat().st_size for r in precache["archivos"])
    return {"ejecutado": True, "version": precache["version"], "archivos": len(precache["archivos"]), "bytes": peso,
            "iconos": [i["archivo"] for i in iconos], "iconos_dibujados": dibujados, "escritos": escritos,
            "avisos": avisos}


def main(argv=None):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser(description="Raíz: iconos, manifest y listado de la copia sin conexión (PWA).")
    ap.add_argument("--web", default=str(WEB), help="carpeta de la web (por omisión, web/)")
    ap.add_argument("--iconos", action="store_true", help="vuelve a dibujar todos los iconos (necesita Pillow)")
    args = ap.parse_args(argv)
    try:
        resumen = construir(web=args.web, regenerar_iconos=args.iconos)
    except ErrorPWA as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    print(json.dumps(resumen, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
