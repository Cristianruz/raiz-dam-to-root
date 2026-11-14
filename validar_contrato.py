# AI-assisted (Claude Code) — Raíz, NASA Space Apps 2026
"""Valida los archivos del contrato de datos v4 (kit §2.2–2.5) en web/data/.

Uso:  python validar_contrato.py [carpeta]      (por omisión web/data)
Imprime "CONTRATO OK" o la lista de errores y termina con código 1.
Solo usa la biblioteca estándar.
"""
import json
import re
import sys
from pathlib import Path

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


class Validador:
    def __init__(self):
        self.errores = []

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
            elif p["abstencion"] and p.get("estado_plazo") is not None:
                self.error(w, "parcela abstenida debe tener estado_plazo null")
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

        z = c.get("zona") or {}
        for k in ("superficie_total_ha", "superficie_clasificada_ha", "superficie_abstenida_ha", "superficie_perenne_ha"):
            self.num(z.get(k), f"{d}.zona.{k}", minimo=0)
        for r in LLUVIAS:
            self.banda((z.get("demanda_perenne_millares") or {}).get(r), f"{d}.zona.demanda_perenne_millares.{r}")
        if not isinstance(z.get("conteos"), dict):
            self.error(d, "zona.conteos debe ser objeto")

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
            if not ops and pid in getattr(self, "abstenidas", set()):
                continue  # parcela abstenida: sin opciones (kit B4, paso 1: solo parcelas NO abstenidas)
            if not any(o.get("id") == "ACTUAL" for o in ops):
                self.error(w0, "falta la opción ACTUAL")
            if len(ops) < 3:
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
                if not o.get("preguntas_ref"):
                    self.error(w, "falta preguntas_ref")
                llaves.add(o.get("preguntas_ref"))
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


def validar(carpeta="web/data"):
    carpeta = Path(carpeta)
    v = Validador()
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
