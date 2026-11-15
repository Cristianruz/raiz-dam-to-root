// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026
// Bibliotecas con versión fija y verificadas por hash (CLAUDE.md regla 5).
// 1) Cada archivo de web/vendor/VERSIONS.json existe y su sha384 coincide.
// 2) Si existe web/index.html: cada <script src> y <link href> que carga un recurso
//    externo (http, https o //) lleva versión exacta, integrity y crossorigin; y cada
//    referencia local a vendor/ está registrada en VERSIONS.json.
//    Lo ideal es que no haya ninguno externo (las teselas del mapa no pasan por aquí).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const WEB = new URL("../web/", import.meta.url);
const versiones = JSON.parse(readFileSync(new URL("vendor/VERSIONS.json", WEB), "utf8"));
const archivos = versiones.librerias.flatMap((l) => l.archivos.map((a) => ({ ...a, lib: `${l.nombre}@${l.version}` })));
const indexUrl = new URL("index.html", WEB);
const hayIndex = existsSync(indexUrl);

const sha384 = (buf) => "sha384-" + createHash("sha384").update(buf).digest("base64");

test("VERSIONS.json declara versión exacta y archivos", () => {
  assert.ok(versiones.librerias.length > 0);
  for (const l of versiones.librerias) {
    assert.match(l.version, /^\d+\.\d+\.\d+$/, `${l.nombre}: versión no exacta (${l.version})`);
    assert.ok(l.archivos.length > 0, `${l.nombre}: sin archivos`);
  }
});

for (const a of archivos) {
  test(`vendor: ${a.archivo} existe y su sha384 coincide (${a.lib})`, () => {
    const url = new URL(a.archivo, WEB);
    assert.ok(existsSync(url), `no existe web/${a.archivo}`);
    assert.equal(sha384(readFileSync(url)), a.sha384, `web/${a.archivo} no coincide con VERSIONS.json`);
  });
}

// Atributos de una etiqueta HTML: {nombre: valor} (valor "" si es booleano).
function atributos(etiqueta) {
  const attrs = {};
  for (const m of etiqueta.matchAll(/([^\s=<>"'/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return attrs;
}

// rel que cargan un recurso (preconnect y dns-prefetch no cargan nada).
const REL_CON_RECURSO = new Set(["stylesheet", "preload", "modulepreload", "prefetch", "icon", "manifest"]);

function recursos(html) {
  const sinComentarios = html.replace(/<!--[\s\S]*?-->/g, "");
  const lista = [];
  for (const m of sinComentarios.matchAll(/<(script|link)\b[^>]*>/gi)) {
    const tag = m[1].toLowerCase();
    const a = atributos(m[0].slice(tag.length + 1));
    const rels = (a.rel || "").toLowerCase().split(/\s+/);
    const url = tag === "script" ? a.src : rels.some((r) => REL_CON_RECURSO.has(r)) ? a.href : undefined;
    if (url) lista.push({ tag, url, a, html: m[0] });
  }
  return lista;
}

const esExterno = (url) => /^(https?:)?\/\//i.test(url);
const versionExacta = (url) => /(@|\/|-|v)\d+\.\d+\.\d+([/?#._-]|$)/.test(url) && !/[\^~*]|latest/i.test(url);

test("index.html: recursos externos con versión exacta, integrity y crossorigin", { skip: !hayIndex && "pendiente: web/index.html aún no existe (lo escribe la pieza web)" }, () => {
  const html = readFileSync(indexUrl, "utf8");
  const malos = [];
  for (const r of recursos(html).filter((x) => esExterno(x.url))) {
    const faltas = [];
    if (!versionExacta(r.url)) faltas.push("versión exacta");
    if (!/^sha(256|384|512)-/.test(r.a.integrity || "")) faltas.push("integrity");
    if (!("crossorigin" in r.a)) faltas.push("crossorigin");
    if (faltas.length) malos.push(`${r.html}\n    falta: ${faltas.join(", ")}`);
  }
  assert.equal(malos.length, 0, "Recursos externos sin fijar (copie la biblioteca a web/vendor/ con su hash):\n  " + malos.join("\n  "));
});

test("index.html: cada referencia local a vendor/ está en VERSIONS.json", { skip: !hayIndex && "pendiente: web/index.html aún no existe (lo escribe la pieza web)" }, () => {
  const html = readFileSync(indexUrl, "utf8");
  const registrados = new Set(archivos.map((a) => a.archivo));
  const locales = recursos(html).map((r) => r.url.replace(/^\.\//, "")).filter((u) => u.startsWith("vendor/"));
  for (const u of locales) assert.ok(registrados.has(u.split(/[?#]/)[0]), `web/${u} no está registrado en VERSIONS.json`);
});
