import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

function buildSeedProject() {
  const now = new Date("2026-06-23T00:00:00.000Z").toISOString();
  return {
    schemaVersion: 1,
    projectId: "playwright-studio",
    projectName: "Playwright Studio",
    baseObject: {
      id: "facility-alpha",
      name: "Завод Альфа",
      center: { lat: 55.1, lng: 37.1 },
    },
    layers: [
      {
        id: "layer_01_l1",
        name: "Внешнее предупреждение",
        code: "L1",
        description: "60-120 км",
        order: 1,
        distanceFromObjectMin: 60000,
        distanceFromObjectMax: 120000,
        geometryType: "ring",
        geometry: {
          type: "ring",
          center: { lat: 55.1, lng: 37.1 },
          minRadiusM: 60000,
          maxRadiusM: 120000,
        },
        color: "#2563eb",
        opacity: 0.16,
        isActive: true,
        isVisible: true,
        isLocked: false,
      },
    ],
    assetLibrary: [
      {
        id: "asset-playwright-radar",
        name: "Playwright Radar",
        shortName: "PWR",
        category: "detection",
        roles: ["detect", "track"],
        pricePerUnitMln: 12,
        currency: "RUB",
        unitLabel: "ед.",
        recommendedLayerCodes: ["L1"],
        compatibleLayerCodes: ["L1"],
        coverageType: "circle",
        coverageRadius: 7000,
        deploymentType: "static",
        placementType: "map-object",
      },
    ],
    placedObjects: [
      {
        id: "placed-playwright-radar",
        assetId: "asset-playwright-radar",
        layerId: "layer_01_l1",
        name: "Playwright Radar",
        coordinates: { lat: 55.72, lng: 37.1 },
        rotation: 35,
        quantity: 2,
        status: "active",
        isVisibleOnMap: true,
        notes: "seeded by Playwright",
        createdAt: now,
        updatedAt: now,
      },
    ],
    activeLayerId: "layer_01_l1",
    selectedAssetId: "asset-playwright-radar",
    selectedObjectId: "placed-playwright-radar",
    mode: "view",
    source: "custom",
    updatedAt: now,
  };
}

test("prototype desktop renders Studio shell, tabs, tree, library and inspector", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${baseUrl}/prototype`);
  await page.evaluate((project) => {
    window.localStorage.setItem("fortis-defense-project", JSON.stringify(project));
  }, buildSeedProject());
  await page.reload();

  await expect(page).toHaveTitle(/Fortis/);
  await expect(page.getByText("FORTIS")).toBeVisible();
  await expect(page.getByRole("link", { name: /Карта защиты/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Калькулятор/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Эшелоны" })).toBeVisible();
  await expect(page.getByText("Инспектор объекта")).toBeVisible();

  const placedObject = page.getByRole("button", { name: /Playwright Radar/ }).first();
  await expect(placedObject).toBeVisible();
  await placedObject.click();
  await expect(page.getByText("Широта")).toBeVisible();
  await expect(page.getByText("Долгота")).toBeVisible();
  await expect(page.getByText("Кол-во")).toBeVisible();

  await page.getByRole("tab", { name: "Библиотека" }).click();
  await expect(page.getByPlaceholder("Найти средство...")).toBeVisible();
});

test("calculator desktop renders compact Studio sibling summary", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${baseUrl}/calculator`);

  await expect(page.getByRole("heading", { name: "Калькулятор защиты от БПЛА" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Карта защиты", exact: true })).toBeVisible();
  await expect(page.getByText("Итого").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Конфигуратор" })).toBeVisible();
  await expect(page.getByText("Смета по эшелонам карты")).toBeVisible();
});

test("prototype and calculator mobile avoid horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto(`${baseUrl}/prototype`);
  await expect(page.getByRole("tab", { name: "Эшелоны" })).toBeVisible();
  await expect(page.getByText("Инспектор объекта")).toBeVisible();
  await expect(page.locator("canvas").first()).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
    .toBe(true);

  await page.goto(`${baseUrl}/calculator`);
  await expect(page.getByRole("heading", { name: "Калькулятор защиты от БПЛА" })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1))
    .toBe(true);
});
