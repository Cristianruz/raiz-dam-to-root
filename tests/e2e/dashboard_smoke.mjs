// AI-assisted (Claude Code) — ROOT, NASA Space Apps 2026; Codex dashboard.
// RAIZ_URL=http://127.0.0.1:8000 node tests/e2e/dashboard_smoke.mjs
// Requiere Playwright y Chromium. PLAYWRIGHT_MODULE admite una instalación del entorno.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const base = process.env.RAIZ_URL || "http://127.0.0.1:8000";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
  args: ["--no-sandbox"],
});
const root = fileURLToPath(new URL("../../", import.meta.url));
const geo = JSON.parse(
  await fs.readFile(`${root}web/data/parcelas.geojson`, "utf8"),
);
const capture = process.env.RAIZ_CAPTURAS || "/tmp/raiz-dashboard-capturas";
await fs.mkdir(capture, { recursive: true });
let checks = 0;
const check = (test) => {
  assert.ok(test);
  checks++;
};
try {
  for (const width of [1440, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      acceptDownloads: true,
      serviceWorkers: "block",
      reducedMotion: "reduce",
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    // Sin teselas externas: la información y los polígonos deben seguir disponibles.
    await page.route("https://server.arcgisonline.com/**", (r) => r.abort());
    await page.goto(base);
    await page.waitForSelector('body[data-dashboard="listo"]');
    await page.waitForSelector("body[data-dashboard-map]");
    if (
      (await page.locator("body").getAttribute("data-dashboard-map")) ===
      "listo"
    )
      await page.waitForSelector("body[data-dashboard-map-rendered]");
    check(
      await page
        .locator("#field-detail")
        .innerText()
        .then((s) => s.includes("Parcela")),
    );
    check(
      (await page.locator("#field-select option").count()) ===
        geo.features.filter((f) => f.properties.zona === "delicias_saucillo")
          .length,
    );
    await page.screenshot({
      path: `${capture}/resumen-${width}.png`,
      fullPage: true,
    });
    await page.locator('[data-map-mode="cultivo"]').click();
    check(
      (await page
        .locator('[data-map-mode="cultivo"]')
        .getAttribute("aria-pressed")) === "true",
    );
    check(
      (await page.locator(".map-legend").innerText()).includes(
        "Cultivo clasificado",
      ),
    );
    await page.locator('[data-map-mode="agua"]').click();
    const originalAllocation = await page.locator("#allocation").inputValue();
    const preset = page.locator("[data-allocation]").first();
    const allocation = await preset.getAttribute("data-allocation");
    await preset.click();
    check((await page.locator("#allocation").inputValue()) === allocation);
    check((await preset.getAttribute("aria-pressed")) === "true");
    await page.locator("#allocation").fill(originalAllocation);
    if (await page.locator("[data-parcel-chip]").count()) {
      const chip = page.locator("[data-parcel-chip]").first(),
        id = await chip.getAttribute("data-parcel-chip");
      await chip.click();
      check((await page.locator("#field-select").inputValue()) === id);
      check((await page.locator(".map-selection-marker").innerText()) === id);
    }
    const before = await page.locator("#stats").innerText();
    await page.locator("#allocation").fill("0");
    check((await page.locator("#stats").innerText()) !== before);
    check((await page.locator("#stats").innerText()).includes("Sin dotación"));
    await page.locator("#allocation").fill("12");
    await page.locator("#rain").check();
    await page.locator("#zona-dashboard").selectOption("lazaro_cardenas");
    check(
      (await page.locator("#field-select option").count()) ===
        geo.features.filter((f) => f.properties.zona === "lazaro_cardenas")
          .length,
    );
    const unclassified = geo.features.find(
      (f) => f.properties.zona === "lazaro_cardenas" && f.properties.abstencion,
    ).properties.id;
    await page.locator("#field-select").selectOption(unclassified);
    check(
      (await page.locator("#field-detail").innerText()).includes("Sin cálculo"),
    );
    const dl = page.waitForEvent("download");
    await page.locator("#exportar").click();
    const download = await dl;
    const csv = await fs.readFile(await download.path(), "utf8");
    check(csv.includes(unclassified) && csv.includes("Escenario"));
    await page.locator('nav a[href="#terreno"]').click();
    check(await page.locator("#terrain-slot .map-detail-grid").isVisible());
    await page.screenshot({
      path: `${capture}/terreno-${width}.png`,
      fullPage: true,
    });
    for (const view of ["cultivos", "recomendaciones", "predicciones"]) {
      await page.locator(`nav a[href="#${view}"]`).click();
      await page
        .locator(`[data-panel="${view}"]`)
        .waitFor({ state: "visible" });
      check(await page.locator(`[data-panel="${view}"]`).isVisible());
      await page.waitForFunction(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      );
      check(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      );
    }
    const total = await page.locator(".event").count();
    await page.locator('[data-filter="sequia"]').click();
    check((await page.locator(".event").count()) < total);
    await page.goto(`${base}/#investigacion`);
    await page.waitForSelector('body[data-dashboard="listo"]');
    check((await page.locator(".source a").count()) === 3);
    check(errors.length === 0);
    await page.close();
  }
  // Un fallo del perfil regional se distingue de la ausencia de una medición.
  const missingSoil = await browser.newPage({ serviceWorkers: "block" });
  await missingSoil.route("**/data/suelo.json", (r) =>
    r.fulfill({ status: 500, body: "error" }),
  );
  await missingSoil.goto(base);
  await missingSoil.waitForSelector('body[data-dashboard="listo"]');
  check(
    (await missingSoil.locator("#field-detail").innerText()).includes(
      "No se pudo cargar",
    ),
  );
  await missingSoil.close();
  // Un fallo en datos principales se muestra al usuario.
  const failed = await browser.newPage();
  await failed.route("**/data/cubo.json", (r) =>
    r.fulfill({ status: 500, body: "error" }),
  );
  await failed.goto(base);
  await failed.waitForSelector('body[data-dashboard="error"]');
  check(
    (await failed.locator("#load-status").innerText()).includes(
      "No se pudo cargar",
    ),
  );
  await failed.close();
  console.log(
    `Dashboard: ${checks} comprobaciones correctas. Capturas: ${capture}`,
  );
} finally {
  await browser.close();
}
