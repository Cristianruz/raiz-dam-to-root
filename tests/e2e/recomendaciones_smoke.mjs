// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; Codex.
// Servir web/ y ejecutar con Playwright. Capturas y descargas se conservan fuera del repositorio.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox"],
});
const base = process.env.RAIZ_URL || "http://127.0.0.1:8000";
const captures =
  process.env.RAIZ_CAPTURAS || "/tmp/raiz-recomendaciones-capturas";
await fs.mkdir(captures, { recursive: true });
let n = 0;
const check = (ok, message) => {
  assert.ok(ok, message);
  n++;
};
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      serviceWorkers: "block",
      acceptDownloads: true,
    });
    async function field(selector) {
      const el = page.locator(selector);
      const group = await el.evaluate(
        (e) => e.closest("[data-form-step]")?.dataset.formStep ?? null,
      );
      if (group) await page.locator(`[data-step-target="${group}"]`).click();
      return el;
    }
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route("https://server.arcgisonline.com/**", (r) => r.abort());
    await page.goto(`${base}/#recomendaciones`);
    await page.waitForSelector('body[data-dashboard="listo"]');
    check(
      await page.locator('[data-form-step="parcela"]').isVisible(),
      "Primer paso visible",
    );
    await page.locator("#decision-next").click();
    check(
      await page.locator('[data-form-step="agua"]').isVisible(),
      "Continuar muestra agua",
    );
    await page.locator("#tab-agua").focus();
    await page.locator("#tab-agua").press("ArrowRight");
    check(
      await page.locator('[data-form-step="suelo"]').isVisible(),
      "Navegación por teclado muestra contexto",
    );
    await page.locator("#tab-parcela").click();
    check(
      await page.locator("#decision-form").isVisible(),
      "Formulario de datos real",
    );
    await (await field("#rec-crop")).selectOption("barbecho");
    await (await field("#rec-target")).selectOption("maiz_forrajero");
    await (await field("#rec-area")).fill("10");
    await (await field("#rec-system")).selectOption("goteo");
    await (await field("#rec-efficiency")).fill("80");
    await (await field("#rec-date")).fill("2027-04-15");
    await (await field("#rec-ph")).fill("7");
    await (await field("#rec-ec")).fill("1");
    await (await field("#rec-allocation-confirmed")).check();
    const card = page.locator('[data-recommendation="maiz_forrajero"]');
    check(
      (await card.getAttribute("data-state")) === "plan_calculado",
      "Plan calculado con entradas completas",
    );
    await (await field("#rec-volume")).fill("20000");
    const low = await card.locator(".decision-action").innerText();
    await (await field("#rec-volume")).fill("200000");
    const high = await card.locator(".decision-action").innerText();
    check(low !== high, "Más agua modifica el área, no un texto fijo");
    const requestDownload = page.waitForEvent("download");
    await page.locator("#download-audit").click();
    const dl = await requestDownload;
    const audit = JSON.parse(await fs.readFile(await dl.path(), "utf8"));
    const r = audit.resultados.find((x) => x.id === "maiz_forrajero");
    check(r.presupuesto === 200, "Conversión del volumen capturado a millares");
    check(r.demanda.eficiencia[0] === 0.8, "Se usa eficiencia capturada");
    check(
      r.evidencias.some((e) => e.criterio.startsWith("Salinidad") && e.fuente),
      "La decisión tiene fuente de salinidad",
    );
    check(
      audit.fuentes.every((f) => f.sha256.length === 64),
      "Fuentes auditables por hash",
    );
    await (await field("#rec-ec")).fill("5");
    check(
      (await card.getAttribute("data-state")) === "condicionado",
      "ECe alta cambia la decisión",
    );
    await (await field("#rec-date")).fill("2027-12-15");
    check(
      (await card.getAttribute("data-state")) === "bloqueado",
      "Fecha fuera de ventana bloquea",
    );
    await (await field("#rec-date")).fill("2027-03-10");
    await (await field("#rec-crop")).selectOption("chile");
    await (await field("#rec-target")).selectOption("chile");
    check(
      (await page
        .locator('[data-recommendation="chile"]')
        .getAttribute("data-state")) === "bloqueado",
      "No recomendar chile tras chile",
    );
    check(
      (
        await page.locator('[data-recommendation="chile"]').innerText()
      ).includes("Frecuencia histórica regional"),
      "Riesgo de helada proviene de registros",
    );
    await (await field("#rec-crop")).selectOption("barbecho");
    await (await field("#rec-target")).selectOption("maiz_forrajero");
    await (await field("#rec-date")).fill("2027-04-15");
    await (await field("#rec-ec")).fill("1");
    const year = await page
      .locator("#rec-observed-year option")
      .nth(1)
      .getAttribute("value");
    await (await field("#rec-observed-year")).selectOption(year);
    await (await field("#rec-observed-volume")).fill("5000");
    check(
      (await card.locator(".observation").innerText()).includes("5,000"),
      "Registro del usuario entra al contraste",
    );
    await (await field("#rec-area")).fill("");
    check(
      (await page.locator("[data-recommendation]").count()) === 0,
      "No deja recomendaciones anteriores cuando hay entradas inválidas",
    );
    await (await field("#rec-area")).fill("10");
    await page.locator("#run-checks").click();
    check(
      (await page.locator("#decision-checks").innerText()).includes("6 de 6"),
      "Comprobaciones interactivas se ejecutan",
    );
    await page.screenshot({
      path: `${captures}/recomendaciones-${width}.png`,
      fullPage: true,
    });
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "Sin desbordamiento horizontal de formulario",
    );
    await page.locator('nav a[href="#predicciones"]').click();
    check(
      (await page.locator(".forecast-metrics .card").count()) === 3,
      "Predicción con métricas de validación",
    );
    const first = await page.locator(".forecast-metrics").innerText();
    await page.locator("#zona-dashboard").selectOption("lazaro_cardenas");
    check(
      first !== (await page.locator(".forecast-metrics").innerText()),
      "Predicción cambia con serie de la otra zona",
    );
    const waitDownload = page.waitForEvent("download");
    await page.locator("#download-backtest").click();
    const download = await waitDownload;
    const backtest = JSON.parse(
      await fs.readFile(await download.path(), "utf8"),
    );
    check(
      backtest.validacion.casos.every((c) => c.entrenamiento_fin < c.anio),
      "Validación temporal sin fuga de información",
    );
    check(
      backtest.validacion.n === backtest.validacion.casos.length,
      "Número de pruebas verificable",
    );
    check(
      backtest.pronostico.anio >
        Math.max(...backtest.validacion.casos.map((c) => c.anio)),
      "Referencia posterior al histórico completo",
    );
    await page.screenshot({
      path: `${captures}/predicciones-${width}.png`,
      fullPage: true,
    });
    check(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "La tabla desplaza dentro de su contenedor",
    );
    check(errors.length === 0, errors.join("\n"));
    await page.close();
  }
  const p = await browser.newPage({ serviceWorkers: "block" });
  await p.route("**/data/pronostico.json", (r) =>
    r.fulfill({ status: 500, body: "error" }),
  );
  await p.goto(`${base}/#recomendaciones`);
  await p.waitForSelector('body[data-dashboard="listo"]');
  check(
    (await p.locator("#decision-summary").innerText()).includes(
      "No se pudo cargar el motor",
    ),
    "Fallo de datos impide generar recomendaciones",
  );
  check(
    (await p.locator("[data-recommendation]").count()) === 0,
    "No se inventan resultados cuando falla la fuente",
  );
  await p.close();
  console.log(
    `Recomendaciones y predicciones: ${n} comprobaciones correctas. Capturas: ${captures}`,
  );
} finally {
  await browser.close();
}
