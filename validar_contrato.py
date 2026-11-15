# AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
"""Valida los archivos del contrato de datos v4 (kit §2.2–2.5) en web/data/.

Uso:  python validar_contrato.py [carpeta]      (por omisión web/data)
Imprime "CONTRATO OK" o la lista de errores y termina con código 1.
Solo usa la biblioteca estándar.

Dos zonas (decisión docs/decisiones/2026-11-14_dos_zonas.md), todo opcional para que los datos
de una sola zona y los simulados sigan pasando:
- parcelas.geojson: properties.zona, si viene, es una zona de data/params.json (zona_piloto.zonas)
  y el id lleva el prefijo de esa zona. Parcela sin «zona» = delicias_saucillo.
- cubo.json «zonas»: {id: bloque con las mismas reglas que «zona» + bbox [o, s, e, n] + nombre_mostrar};
  sus superficies, demandas y conteos suman los de «zona» (tolerancia de redondeo).
- cubo.json «localidades»: [{nombre, municipio, lat, lon, fuente}].
- cubo.json parcelas.<id>.sin_opciones: motivo (código) de una parcela clasificada sin opciones.

Revisión de dda5abb:
- «sin_rotacion» exime del mínimo ACTUAL + 2 solo al nogal cuya rotación ACTUAL el catálogo de B3 declara
  que no rota (opciones_catalogo.<rotación>.letra_maestro = LETRA_NO_ROTA), como hace motor/b4_cubo.py.
- Una opción sin lámina neta (ET) lleva «gota» en null, y entonces también los dos goteos y tope_consumo.

Opciones y filtros oficiales (decisión docs/decisiones/2026-11-14_opciones_b3.md), también opcional:
- opciones[].filtros[]: además de «motivo» y «fuente» (kit §2.3), si trae «estado» es uno de
  ESTADOS_FILTRO; «pasa», si viene, concuerda con él (true = passes, false = warning, null = sin
  decidir) y «prob_helada», si viene, es null o una probabilidad entre 0 y 1.
"""
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
CULTIVOS = {"alfalfa", "nogal", "chile", "maiz_forrajero", "sorgo", "algodon",
            "cereal_invierno", "barbecho", "sin_clasificar", "forraje_verano"}
ESTADOS_MEMORIA = {"perenne", "verano", "invierno", "doble", "descanso", "sin_dato"}
ESTADOS_PLAZO = {"libre", "por_vencer", "comprometida", None}
SEMAFOROS = {"verde", "ambar", "rojo", "gris"}
LLUVIAS = ("0", "-20")
MARCAS = {"como_2025", "como_2026", "anio_normal"}
PREGUNTAS = ("por_que", "evidencia", "beneficios", "que_no_sabemos", "riesgos")
CAMPOS_GOTA = ("m3_salen_presa", "m3_perdidas_canal", "m3_llegan_parcela",
               "m3_consume_cultivo_et", "m3_regresan_acuifero", "m3_otras_perdidas")
SUPERFICIES = ("superficie_total_ha", "superficie_clasificada_ha", "superficie_abstenida_ha", "superficie_perenne_ha")
CONTEOS = ("total", "libre", "por_vencer", "comprometida", "abstenida")
# Parcela sin propiedad «zona» = zona sin sufijo (decisión 2026-11-14; igual que motor/b4_cubo.py).
ZONA_SIN_SUFIJO = "delicias_saucillo"
# Motivos (códigos) por los que una parcela clasificada puede quedar sin opciones (motor/b4_cubo.py).
# «sin_actual»: la opción ACTUAL no se pudo armar con los archivos de la zona.
MOTIVOS_SIN_OPCIONES = {"sin_clima_zona", "sin_actual"}
# Cultivo que no rota (maestro §5.2; decisión de opciones B3, §1): el único exento de ACTUAL + 2.
CULTIVO_NO_ROTA, LETRA_NO_ROTA = "nogal", "nogal_no_rota"
# Estados de un filtro de B3 (decisión del 14-nov) y el valor de «pasa» que corresponde a cada uno.
ESTADOS_FILTRO = {"passes": True, "warning": False, "needs_local_check": None}


def zonas_de_params(ruta):
    """{id: zona} de params.zona_piloto.zonas, o None si params.json no existe o no las define
    (entonces no se revisa contra params)."""
    try:
        params = json.loads(Path(ruta).read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return None
    lista = ((params.get("zona_piloto") or {}).get("zonas") or {}).get("valor")
    if not isinstance(lista, list):
        return None
    return {z.get("id"): z for z in lista if isinstance(z, dict)}


def es_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


class Validador:
    def __init__(self, zonas_params=None):
        self.errores = []
        self.zonas_params = zonas_params  # {id: zona} de params.json o None
        self.zonas_geo = set()  # zonas de las parcelas (sin propiedad = ZONA_SIN_SUFIJO)
        self.con_zona = False   # alguna parcela trae la propiedad «zona»

    def error(self, donde, msg):
        self.errores.append(f"{donde}: {msg}")

    def num(self, v, donde, minimo=None, maximo=None, nulo=False, entero=False):
        if v is None:
            if not nulo:
                self.error(donde, "falta el número (null no permitido)")
            return False
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            self.error(donde, f"debe ser número, es {type(v).__name__}")
            return False
        if entero and not float(v).is_integer():
            self.error(donde, f"debe ser entero, es {v}")
        if minimo is not None and v < minimo:
            self.error(donde, f"{v} < {minimo}")
        if maximo is not None and v > maximo:
            self.error(donde, f"{v} > {maximo}")
        return True

    def banda(self, b, donde, nulo=False):
        """{p10, p50, p90} con P10 ≤ P50 ≤ P90 y sin negativos."""
        if not isinstance(b, dict):
            self.error(donde, "debe ser objeto {p10, p50, p90}")
            return
        ok = all(self.num(b.get(q), f"{donde}.{q}", minimo=0, nulo=nulo) for q in ("p10", "p50", "p90"))
        if ok and not (b["p10"] <= b["p50"] <= b["p90"]):
            self.error(donde, f"no cumple P10 ≤ P50 ≤ P90: {b}")

    def rango(self, r, donde):
        if not isinstance(r, dict):
            self.error(donde, "debe ser objeto {min, max}")
            return
        if self.num(r.get("min"), f"{donde}.min", minimo=0) and self.num(r.get("max"), f"{donde}.max", minimo=0):
            if r["min"] > r["max"]:
                self.error(donde, f"min > max: {r}")

    # --- §2.2 parcelas.geojson -------------------------------------------
    def parcelas(self, geo):
        d = "parcelas.geojson"
        if geo.get("type") != "FeatureCollection":
            self.error(d, "type debe ser FeatureCollection")
        feats = geo.get("features") or []
        if not feats:
            self.error(d, "no hay features")
        ids = set()
        self.abstenidas = set()
        self.cultivo_de = {}  # cultivo_actual de cada parcela (para la exención de «sin_rotacion»)
        for i, f in enumerate(feats):
            p = f.get("properties") or {}
            w = f"{d}[{p.get('id', i)}]"
            if f.get("geometry", {}).get("type") not in ("Polygon", "MultiPolygon"):
                self.error(w, "geometry debe ser Polygon o MultiPolygon")
            pid = p.get("id")
            if not isinstance(pid, str) or not pid:
                self.error(w, "id debe ser texto no vacío")
            elif pid in ids:
                self.error(w, "id repetido")
            ids.add(pid)
            self.zona_parcela(p, pid, w)
            self.num(p.get("area_ha"), f"{w}.area_ha", minimo=0)
            if p.get("modulo") is not None and not isinstance(p.get("modulo"), str):
                self.error(w, "modulo debe ser texto o null")
            self.num(p.get("ftw_confianza"), f"{w}.ftw_confianza", 0, 100)
            if not isinstance(p.get("protagonista"), bool):
                self.error(w, "protagonista debe ser bool")
            if p.get("cultivo_actual") not in CULTIVOS:
                self.error(w, f"cultivo_actual fuera de lista: {p.get('cultivo_actual')}")
            # Extensión del contrato (14-nov, integrador): "1/1" = solo reglas fenológicas mientras el
            # Random Forest (A4.2) no está; en ese caso prob_max puede ser null.
            if p.get("acuerdo_metodos") not in ("2/2", "1/2", "1/1"):
                self.error(w, f"acuerdo_metodos debe ser '2/2', '1/2' o '1/1': {p.get('acuerdo_metodos')}")
            self.num(p.get("prob_max"), f"{w}.prob_max", 0, 1, nulo=(p.get("acuerdo_metodos") == "1/1"))
            if not isinstance(p.get("abstencion"), bool):
                self.error(w, "abstencion debe ser bool")
            elif p["abstencion"]:
                self.abstenidas.add(pid)
                # Comprobación aparte (antes era un «elif» que nunca se alcanzaba).
                if p.get("estado_plazo") is not None:
                    self.error(w, "parcela abstenida debe tener estado_plazo null")
            self.cultivo_de[pid] = p.get("cultivo_actual")
            self.num(p.get("dias_suelo_desnudo_feb_abr"), f"{w}.dias_suelo_desnudo_feb_abr", 0, 90, nulo=True, entero=True)
            self.num(p.get("ndvi_ultimo_mes"), f"{w}.ndvi_ultimo_mes", -1, 1, nulo=True)
            mem = p.get("memoria")
            if mem is not None:
                if not isinstance(mem, list):
                    self.error(w, "memoria debe ser lista o null")
                else:
                    anios = []
                    for m in mem:
                        if m.get("estado") not in ESTADOS_MEMORIA:
                            self.error(w, f"estado de memoria fuera de lista: {m}")
                        self.num(m.get("anio"), f"{w}.memoria.anio", 2000, 2100, entero=True)
                        anios.append(m.get("anio"))
                    if anios != sorted(anios) or len(set(anios)) != len(anios):
                        self.error(w, "memoria debe ir ordenada por año y sin años repetidos")
            self.num(p.get("dias_suelo_desnudo_mediana"), f"{w}.dias_suelo_desnudo_mediana", 0, 90, nulo=True, entero=True)
            self.num(p.get("edad_perenne_anios"), f"{w}.edad_perenne_anios", 0, 100, nulo=True, entero=True)
            if p.get("estado_plazo") not in ESTADOS_PLAZO:
                self.error(w, f"estado_plazo fuera de lista: {p.get('estado_plazo')}")
        return ids

    def zona_parcela(self, p, pid, w):
        """properties.zona (opcional): texto, zona de params y prefijo del id de esa zona."""
        if "zona" not in p:
            self.zonas_geo.add(ZONA_SIN_SUFIJO)
            return
        self.con_zona = True
        zona = p["zona"]
        if not isinstance(zona, str) or not zona:
            self.error(w, f"zona debe ser texto no vacío: {zona!r}")
            return
        self.zonas_geo.add(zona)
        if self.zonas_params is None:
            return
        if zona not in self.zonas_params:
            self.error(w, f"zona fuera de params.zona_piloto.zonas: {zona}")
            return
        prefijo = self.zonas_params[zona].get("prefijo_id")
        if prefijo and isinstance(pid, str) and not pid.startswith(prefijo):
            self.error(w, f"el id debe llevar el prefijo de su zona {zona} ({prefijo})")

    # --- bloques de zona del cubo («zona», «zonas.<id>») ----------------------
    def bloque_zona(self, z, donde):
        """Superficies ≥ 0, demanda perenne P10 ≤ P50 ≤ P90 por lluvia y conteos enteros ≥ 0."""
        if not isinstance(z, dict):
            self.error(donde, "debe ser objeto")
            return
        for k in SUPERFICIES:
            self.num(z.get(k), f"{donde}.{k}", minimo=0)
        for r in LLUVIAS:
            self.banda((z.get("demanda_perenne_millares") or {}).get(r), f"{donde}.demanda_perenne_millares.{r}")
        conteos = z.get("conteos")
        if not isinstance(conteos, dict):
            self.error(donde, "conteos debe ser objeto")
            return
        for k in CONTEOS:
            self.num(conteos.get(k), f"{donde}.conteos.{k}", minimo=0, entero=True)

    def bbox(self, b, donde):
        """[oeste, sur, este, norte] en grados, con oeste < este y sur < norte."""
        if not (isinstance(b, list) and len(b) == 4 and all(es_num(x) for x in b)):
            self.error(donde, f"bbox debe ser [oeste, sur, este, norte] con 4 números: {b}")
            return
        o, s, e, n = b
        if not (-180 <= o < e <= 180):
            self.error(donde, f"bbox: oeste debe ser < este (en −180..180): {b}")
        if not (-90 <= s < n <= 90):
            self.error(donde, f"bbox: sur debe ser < norte (en −90..90): {b}")

    def zonas(self, c):
        """Bloque «zonas» (opcional): uno por zona, y su suma igual al bloque «zona»."""
        d = "cubo.json"
        zs = c.get("zonas")
        if zs is None:
            if self.con_zona:
                self.error(d, "las parcelas traen «zona» pero el cubo no trae el bloque «zonas»")
            return
        if not isinstance(zs, dict) or not zs:
            self.error(d, "zonas debe ser objeto no vacío {id: bloque}")
            return
        for zid, z in zs.items():
            w = f"{d}.zonas.{zid}"
            if self.zonas_params is not None and zid not in self.zonas_params:
                self.error(w, "zona fuera de params.zona_piloto.zonas")
            self.bloque_zona(z, w)
            if not isinstance(z, dict):
                continue
            if not isinstance(z.get("nombre_mostrar"), str) or not z["nombre_mostrar"].strip():
                self.error(w, "nombre_mostrar debe ser texto no vacío")
            self.bbox(z.get("bbox"), f"{w}.bbox")
            if "clima_disponible" in z and not isinstance(z["clima_disponible"], bool):
                self.error(w, "clima_disponible debe ser bool")
        for zid in sorted(self.zonas_geo - set(zs)):
            self.error(d, f"la zona {zid} tiene parcelas pero no tiene bloque en «zonas»")
        # Suma de las zonas = total. Cada bloque se redondea a 2 decimales: tolerancia por bloque.
        total = c.get("zona") or {}
        bloques = [z for z in zs.values() if isinstance(z, dict)]
        tol = 0.01 * len(bloques) + 1e-6

        def comparar(nombre, valores, esperado, tolerancia):
            if es_num(esperado) and all(es_num(v) for v in valores) and abs(sum(valores) - esperado) > tolerancia:
                self.error(d, f"la suma de zonas.*.{nombre} ({round(sum(valores), 2)}) no coincide con zona.{nombre} ({esperado})")

        for k in SUPERFICIES:
            comparar(k, [z.get(k) for z in bloques], total.get(k), tol)
        for r in LLUVIAS:
            for q in ("p10", "p50", "p90"):
                vals = [((z.get("demanda_perenne_millares") or {}).get(r) or {}).get(q) for z in bloques]
                esperado = ((total.get("demanda_perenne_millares") or {}).get(r) or {}).get(q)
                comparar(f"demanda_perenne_millares.{r}.{q}", vals, esperado, tol)
        for k in CONTEOS:
            comparar(f"conteos.{k}", [(z.get("conteos") or {}).get(k) for z in bloques],
                     (total.get("conteos") or {}).get(k), 0)

    def localidades(self, c):
        """Bloque «localidades» (opcional): puntos de referencia del mapa con su fuente."""
        d = "cubo.json.localidades"
        locs = c.get("localidades")
        if locs is None:
            return
        if not isinstance(locs, list):
            self.error(d, "debe ser lista")
            return
        for i, x in enumerate(locs):
            w = f"{d}[{i}]"
            if not isinstance(x, dict):
                self.error(w, "debe ser objeto {nombre, municipio, lat, lon, fuente}")
                continue
            if not isinstance(x.get("nombre"), str) or not x["nombre"].strip():
                self.error(w, "nombre debe ser texto no vacío")
            if x.get("municipio") is not None and not isinstance(x.get("municipio"), str):
                self.error(w, "municipio debe ser texto o null")
            self.num(x.get("lat"), f"{w}.lat", -90, 90)
            self.num(x.get("lon"), f"{w}.lon", -180, 180)
            if not isinstance(x.get("fuente"), str) or not x["fuente"].strip():
                self.error(w, "falta la fuente")

    # --- §2.3 cubo.json -----------------------------------------------------
    def cubo(self, c, ids):
        d = "cubo.json"
        meta = c.get("meta") or {}
        if meta.get("version") != "4.0":
            self.error(d, f"meta.version debe ser '4.0': {meta.get('version')}")
        if "mock" not in meta:
            self.error(d, "meta.mock es obligatorio")
        b = (c.get("distrito") or {}).get("boquilla") or {}
        self.num(b.get("namo_hm3"), f"{d}.distrito.boquilla.namo_hm3", minimo=0)
        if not b.get("fuente_namo"):
            self.error(d, "distrito.boquilla.fuente_namo vacía")
        if b.get("almacenamiento_hm3") is not None:
            self.num(b["almacenamiento_hm3"], f"{d}.distrito.boquilla.almacenamiento_hm3", minimo=0)
            if not (b.get("fecha_almacenamiento") and b.get("fuente_almacenamiento")):
                self.error(d, "almacenamiento_hm3 requiere fecha y fuente")
        a = (c.get("distrito") or {}).get("acuifero_0831") or {}
        self.num(a.get("disponibilidad_hm3_anio"), f"{d}.distrito.acuifero_0831.disponibilidad_hm3_anio")
        if not a.get("fuente"):
            self.error(d, "acuifero_0831.fuente vacía")
        capas = (c.get("distrito") or {}).get("capas_disponibles")
        if not isinstance(capas, list) or not set(capas) <= {"cultivos", "suelo_desnudo", "memoria_2025"}:
            self.error(d, f"capas_disponibles inválidas: {capas}")

        dot = c.get("dotaciones") or {}
        if dot.get("unidad") != "millares_por_ha":
            self.error(d, "dotaciones.unidad debe ser 'millares_por_ha'")
        if not dot.get("equivalencia"):
            self.error(d, "dotaciones.equivalencia vacía")
        des = dot.get("deslizador") or {}
        okd = all(self.num(des.get(k), f"{d}.dotaciones.deslizador.{k}", minimo=0) for k in ("min", "max", "paso"))
        marcas = dot.get("marcas") or []
        if {m.get("id") for m in marcas} != MARCAS or len(marcas) != 3:
            self.error(d, f"dotaciones.marcas debe tener exactamente {sorted(MARCAS)}")
        for m in marcas:
            w = f"{d}.dotaciones.marcas[{m.get('id')}]"
            for k in ("min", "max", "valor"):
                if okd:
                    self.num(m.get(k), f"{w}.{k}", des["min"], des["max"])
            if okd and m.get("min") is not None and m.get("max") is not None and m.get("valor") is not None:
                if not (m["min"] <= m["valor"] <= m["max"]):
                    self.error(w, "valor fuera de [min, max]")
            for k in ("nombre", "fuente", "etiqueta"):
                if not m.get(k):
                    self.error(w, f"falta {k}")
        if not dot.get("punto_medicion"):
            self.error(d, "dotaciones.punto_medicion vacío")
        if [str(x) for x in (c.get("lluvia_pct") or [])] != list(LLUVIAS):
            self.error(d, f"lluvia_pct debe ser [0, -20]: {c.get('lluvia_pct')}")

        self.bloque_zona(c.get("zona") or {}, f"{d}.zona")
        self.zonas(c)
        self.localidades(c)

        parcelas = c.get("parcelas") or {}
        faltan = ids - set(parcelas)
        sobran = set(parcelas) - ids
        if faltan:
            self.error(d, f"parcelas sin opciones en el cubo: {sorted(faltan)}")
        if sobran:
            self.error(d, f"parcelas del cubo que no están en parcelas.geojson: {sorted(sobran)}")
        llaves = set()
        for pid, pc in parcelas.items():
            ops = pc.get("opciones") or []
            w0 = f"{d}.parcelas.{pid}"
            motivo = pc.get("sin_opciones")
            if motivo is not None and (motivo not in MOTIVOS_SIN_OPCIONES or ops):
                self.error(w0, f"sin_opciones debe ser uno de {sorted(MOTIVOS_SIN_OPCIONES)} y solo con opciones vacías: {motivo!r}")
            if not ops and pid in getattr(self, "abstenidas", set()):
                continue  # parcela abstenida: sin opciones (kit B4, paso 1: solo parcelas NO abstenidas)
            if not ops and motivo in MOTIVOS_SIN_OPCIONES:
                continue  # parcela clasificada sin opciones por un motivo declarado (p. ej. zona sin clima)
            if not any(o.get("id") == "ACTUAL" for o in ops):
                self.error(w0, "falta la opción ACTUAL")
            sin_rot = pc.get("sin_rotacion")
            if sin_rot is not None:
                # Cultivo que no rota (nogal, maestro §5.2): solo ACTUAL, con su motivo y fuente
                # (docs/decisiones/2026-11-14_opciones_b3.md, §1).
                if not isinstance(sin_rot, dict) or not sin_rot.get("motivo") or not sin_rot.get("fuente"):
                    self.error(w0, "sin_rotacion debe traer motivo y fuente")
                elif [o.get("id") for o in ops] != ["ACTUAL"]:
                    self.error(w0, "con sin_rotacion la parcela lleva solo la opción ACTUAL")
                if not self.no_rota(pid, ops, c):
                    self.error(w0, f"sin_rotacion es del nogal que no rota (cultivo_actual = {CULTIVO_NO_ROTA} y "
                                   f"opciones_catalogo.<rotación ACTUAL>.letra_maestro = {LETRA_NO_ROTA}); "
                                   f"esta parcela no la tiene y pide ACTUAL + 2 alternativas")
            elif len(ops) < 3:
                self.error(w0, f"mínimo ACTUAL + 2 alternativas; hay {len(ops)}")
            for o in ops:
                w = f"{w0}.{o.get('id')}"
                for k in ("id", "nombre"):
                    if not o.get(k):
                        self.error(w, f"falta {k}")
                if not isinstance(o.get("secuencia"), list) or not o["secuencia"]:
                    self.error(w, "secuencia debe ser lista no vacía")
                ag = o.get("agua") or {}
                for r in LLUVIAS:
                    self.banda((ag.get("lamina_bruta") or {}).get(r), f"{w}.agua.lamina_bruta.{r}")
                    self.rango((ag.get("compromiso_millares_ha") or {}).get(r), f"{w}.agua.compromiso_millares_ha.{r}")
                self.rango(ag.get("plazo_anios"), f"{w}.agua.plazo_anios")
                self.rango(ag.get("plazo_restante"), f"{w}.agua.plazo_restante")
                su = o.get("suelo") or {}
                if su.get("dias_desnudo_origen") not in ("medido", "estimado"):
                    self.error(w, "suelo.dias_desnudo_origen debe ser 'medido' o 'estimado'")
                self.num(su.get("dias_desnudo"), f"{w}.suelo.dias_desnudo", 0, 365, nulo=True)
                din = o.get("dinero")
                if din is not None and not din.get("fuente"):
                    self.error(w, "dinero sin fuente: debe ser null")
                sem = o.get("semaforo") or {}
                if "agua" in sem:
                    self.error(w, "el semáforo de agua NO se guarda: lo calcula la web")
                for k in ("suelo", "dinero"):
                    if sem.get(k) not in SEMAFOROS:
                        self.error(w, f"semaforo.{k} fuera de lista: {sem.get(k)}")
                if not isinstance(o.get("filtros"), list):
                    self.error(w, "filtros debe ser lista")
                else:
                    for fl in o["filtros"]:
                        if not (fl.get("motivo") and fl.get("fuente")):
                            self.error(w, f"filtro sin motivo o fuente: {fl}")
                        if "estado" in fl:
                            if fl["estado"] not in ESTADOS_FILTRO:
                                self.error(w, f"filtro con estado fuera de {sorted(ESTADOS_FILTRO)}: {fl['estado']!r}")
                            elif "pasa" in fl and fl["pasa"] is not ESTADOS_FILTRO[fl["estado"]]:
                                self.error(w, f"filtro {fl.get('id')}: «pasa» = {fl['pasa']!r} no concuerda con el "
                                              f"estado {fl['estado']!r}")
                        if fl.get("prob_helada") is not None:
                            self.num(fl["prob_helada"], f"{w}.filtros[{fl.get('id')}].prob_helada", 0, 1)
                if not o.get("preguntas_ref"):
                    self.error(w, "falta preguntas_ref")
                llaves.add(o.get("preguntas_ref"))
                if o.get("gota") is None:
                    # Sin lámina neta (ET) no hay La gota (motor/b4_cubo.py lo avisa): sin ella tampoco hay goteo.
                    con_goteo = [b for b in ("gota_goteo_con_tope", "gota_goteo_sin_tope", "tope_consumo")
                                 if o.get(b) is not None]
                    if con_goteo:
                        self.error(w, f"gota en null pide también en null {', '.join(con_goteo)}")
                    continue
                for bloque in ("gota", "gota_goteo_con_tope", "gota_goteo_sin_tope"):
                    if bloque != "gota" and o.get(bloque) is None:
                        continue  # escenario de goteo no disponible (sin eficiencia de goteo con fuente)
                    g = o.get(bloque) or {}
                    for k in CAMPOS_GOTA:
                        self.num(g.get(k), f"{w}.{bloque}.{k}", minimo=0)
                    if all(isinstance(g.get(k), (int, float)) for k in CAMPOS_GOTA):
                        destinos = g["m3_consume_cultivo_et"] + g["m3_regresan_acuifero"] + g["m3_otras_perdidas"]
                        sale = g["m3_salen_presa"]
                        if abs(destinos - sale) > max(1.0, 0.01 * sale):
                            self.error(w, f"{bloque}: el balance no cierra (destinos {destinos} vs presa {sale})")
                if o.get("tope_consumo") is None and o.get("gota_goteo_sin_tope") is None:
                    continue
                t = o.get("tope_consumo") or {}
                for k in ("et_historica_m3", "et_goteo_sin_tope_m3"):
                    self.num(t.get(k), f"{w}.tope_consumo.{k}", minimo=0)
                if not isinstance(t.get("cumple_sin_tope"), bool):
                    self.error(w, "tope_consumo.cumple_sin_tope debe ser bool")
        return llaves

    def no_rota(self, pid, ops, c):
        """True si la parcela es nogal y el catálogo de B3 declara que su rotación ACTUAL no rota."""
        if self.cultivo_de.get(pid) != CULTIVO_NO_ROTA:
            return False
        rot = next((o.get("rotacion") for o in ops if o.get("id") == "ACTUAL"), None)
        return ((c.get("opciones_catalogo") or {}).get(rot) or {}).get("letra_maestro") == LETRA_NO_ROTA

    # --- §2.5 explicaciones.json -------------------------------------------
    def explicaciones(self, e, llaves):
        d = "explicaciones.json"
        meta = e.get("meta") or {}
        dinamicos = set(meta.get("dinamicos") or [])
        if dinamicos != {"d", "ha", "cobertura"}:
            self.error(d, f"meta.dinamicos debe ser ['d','ha','cobertura']: {sorted(dinamicos)}")
        exp = e.get("explicaciones") or {}
        for k in sorted(llaves - set(exp)):
            self.error(d, f"falta la llave {k} referida por el cubo")
        for k, v in exp.items():
            textos, valores = v.get("textos") or {}, v.get("valores") or {}
            for q in PREGUNTAS:
                t = textos.get(q)
                if not t:
                    self.error(f"{d}.{k}", f"falta la respuesta '{q}'")
                    continue
                if re.search(r"\d", re.sub(r"\{\{\w+\}\}", "", t)):
                    self.error(f"{d}.{k}.{q}", "hay dígitos fuera de los marcadores")
                for m in re.findall(r"\{\{(\w+)\}\}", t):
                    if m not in valores and m not in dinamicos:
                        self.error(f"{d}.{k}.{q}", f"marcador sin valor: {{{{{m}}}}}")
            for mk, mv in valores.items():
                self.num(mv, f"{d}.{k}.valores.{mk}")


def validar(carpeta="web/data", params_ruta=RAIZ / "data/params.json"):
    carpeta = Path(carpeta)
    v = Validador(zonas_de_params(params_ruta))
    datos = {}
    for nombre in ("parcelas.geojson", "cubo.json", "explicaciones.json"):
        ruta = carpeta / nombre
        try:
            datos[nombre] = json.loads(ruta.read_text(encoding="utf-8"))
        except FileNotFoundError:
            v.error(nombre, f"no existe {ruta}")
        except json.JSONDecodeError as ex:
            v.error(nombre, f"JSON inválido: {ex}")
    if len(datos) == 3:
        ids = v.parcelas(datos["parcelas.geojson"])
        llaves = v.cubo(datos["cubo.json"], ids)
        v.explicaciones(datos["explicaciones.json"], llaves)
        tam = (carpeta / "cubo.json").stat().st_size
        if tam >= 5 * 1024 * 1024:
            v.error("cubo.json", f"pesa {tam} bytes; el contrato pide < 5 MB")
    return v.errores


if __name__ == "__main__":
    errores = validar(sys.argv[1] if len(sys.argv) > 1 else "web/data")
    if errores:
        print(f"CONTRATO CON ERRORES ({len(errores)}):")
        for e in errores:
            print(" -", e)
        sys.exit(1)
    print("CONTRATO OK")
