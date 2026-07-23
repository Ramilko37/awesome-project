import { access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const baseURL = process.env.FORTIS_STAGE_5_BEFORE_BASE_URL ?? "http://127.0.0.1:3422";
const outputRoot = resolve(
  process.env.FORTIS_STAGE_5_BEFORE_OUTPUT ??
    "output/playwright/stage-5-767b692/before-49bc1e1",
);
const viewports = [
  { label: "1280x800", width: 1280, height: 800 },
  { label: "1366x768", width: 1366, height: 768 },
  { label: "1440x900", width: 1440, height: 900 },
  { label: "1920x1080", width: 1920, height: 1080 },
];
const states = [
  {
    name: "primary",
    prepare: async () => undefined,
  },
  {
    name: "selected-echelon",
    prepare: async (page) => {
      await page.locator(".fortis-tree-item").first().click();
      await page.locator(".fortis-gis-inspector").waitFor({ state: "visible" });
    },
  },
  {
    name: "create-form",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Создать средство защиты" }).click();
      await page.locator(".fortis-asset-library-form").waitFor();
    },
  },
  {
    name: "collapsed-library",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Свернуть", exact: true }).click();
    },
  },
  {
    name: "expanded-bottom-drawer",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Развернуть панель эшелонов" }).click({ force: true });
    },
  },
  {
    name: "basemap-menu",
    prepare: async (page) => {
      await page.getByRole("button", { name: "Выбрать источник карты" }).click();
      await page.getByRole("dialog", { name: "Источники карты" }).waitFor();
    },
  },
];

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of viewports) {
    const directory = resolve(outputRoot, viewport.label);
    await mkdir(directory, { recursive: true });
    const context = await browser.newContext({
      colorScheme: "light",
      locale: "ru-RU",
      reducedMotion: "reduce",
      viewport: { width: viewport.width, height: viewport.height },
    });
    await context.addInitScript(() => {
      globalThis.localStorage.setItem(
        "fortis-map-view",
        JSON.stringify({ currentBaseMapSourceId: "internal-basemap" }),
      );
      globalThis.localStorage.removeItem("fortis-defense-project");
    });
    await context.route("**/api/**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Historical visual baseline uses isolated API" }),
      });
    });

    for (const state of states) {
      const path = resolve(directory, `${state.name}-${viewport.label}.png`);
      try {
        await access(path);
        process.stdout.write(`${path}\n`);
        continue;
      } catch {
        // Capture the missing historical state below.
      }
      const page = await context.newPage();
      await page.goto(`${baseURL}/prototype`, { waitUntil: "domcontentloaded" });
      await page.locator(".fortis-gis-map-board").waitFor({ state: "visible" });
      await page.addStyleTag({
        content:
          "*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }",
      });
      await state.prepare(page);
      await page.screenshot({ path });
      process.stdout.write(`${path}\n`);
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}
