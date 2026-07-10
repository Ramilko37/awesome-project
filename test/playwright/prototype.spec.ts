import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test.setTimeout(60_000);

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
        id: "asset-qa-radar",
        name: "QA Radar Unique",
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
        id: "placed-qa-radar",
        assetId: "asset-qa-radar",
        layerId: "layer_01_l1",
        name: "QA Radar Unique",
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
    selectedAssetId: "asset-qa-radar",
    selectedObjectId: "placed-qa-radar",
    mode: "view",
    source: "custom",
    updatedAt: now,
  };
}

test("prototype desktop renders Studio shell, tabs, tree, library and inspector", async ({ page }) => {
  const hydrationMessages: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if ((message.type() === "error" || message.type() === "warning") && /hydration|did not match/i.test(text)) {
      hydrationMessages.push(text);
    }
  });
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

  const mapToolbar = page.getByRole("toolbar", { name: "Слои и масштаб карты" });
  await expect(mapToolbar).toBeVisible();
  for (const name of ["Покрытие", "Подписи", "Ограничения"]) {
    await expect(mapToolbar.getByRole("button", { name })).toHaveAttribute("aria-pressed", "true");
  }
  await mapToolbar.getByRole("button", { name: "Покрытие" }).click();
  await expect(mapToolbar.getByRole("button", { name: "Покрытие" })).toHaveAttribute("aria-pressed", "false");
  await expect(mapToolbar.getByRole("button", { name: "Линейка" })).toBeDisabled();

  await expect(page.getByRole("button", { name: "Активен" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "План" })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "План" }).click();
  await expect(page.getByRole("button", { name: "План" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Активен" })).toHaveAttribute("aria-pressed", "false");

  const liveAnnouncement = page.locator('[aria-live="polite"]');
  await expect(liveAnnouncement).toBeAttached();
  await page.getByRole("button", { name: "Сохранить" }).click();
  await expect(liveAnnouncement).toContainText(/Проект сохранён локально в \d{2}:\d{2}/);

  const placedObject = page.getByRole("button", { name: /QA Radar Unique/ }).first();
  await expect(placedObject).toBeVisible();
  await expect(page.getByText("МОГ — пост №1")).toHaveCount(0);
  await placedObject.click();
  await expect(page.getByLabel("Широта")).toBeVisible();
  await expect(page.getByLabel("Долгота")).toBeVisible();
  await expect(page.getByLabel("Кол-во")).toBeVisible();

  await page.getByRole("tab", { name: "Библиотека" }).click();
  await expect(page.getByPlaceholder("Найти средство…")).toBeVisible();
  expect(hydrationMessages).toEqual([]);
});

test("closing the object inspector returns width to the GIS canvas", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${baseUrl}/prototype`);
  await page.evaluate((project) => {
    window.localStorage.setItem("fortis-defense-project", JSON.stringify(project));
  }, buildSeedProject());
  await page.reload();

  const canvas = page.locator("canvas").first();
  const before = await canvas.boundingBox();
  await page.getByRole("button", { name: "Закрыть инспектор" }).click();
  const after = await canvas.boundingBox();

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  expect(after!.width - before!.width).toBeGreaterThanOrEqual(280);

  await page.getByRole("button", { name: "Открыть инспектор" }).click();
  await expect(page.getByRole("heading", { name: "QA Radar Unique" })).toBeVisible();
});

test("left panel collapse returns tablet width and exposes panel state", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 900 });
  await page.goto(`${baseUrl}/prototype`);
  await page.evaluate((project) => {
    window.localStorage.setItem("fortis-defense-project", JSON.stringify(project));
  }, buildSeedProject());
  await page.reload();

  const workspace = page.locator('[data-left-open][data-inspector-open]');
  const leftPanel = page
    .getByRole("complementary")
    .filter({ has: page.getByRole("tablist", { name: "Панель Fortis Studio" }) });
  const canvas = page.locator("canvas").first();
  const before = await canvas.boundingBox();

  await expect(workspace).toHaveAttribute("data-left-open", "true");
  await expect(workspace).toHaveAttribute("data-inspector-open", "true");
  await expect(page.getByRole("button", { name: "Скрыть панель" })).toHaveAttribute("aria-expanded", "true");
  await expect(leftPanel).toBeVisible();

  await page.getByRole("button", { name: "Скрыть панель" }).click();
  await expect(workspace).toHaveAttribute("data-left-open", "false");
  await expect(page.getByRole("button", { name: "Открыть панель" })).toHaveAttribute("aria-expanded", "false");
  await expect(leftPanel).toHaveCount(0);

  const collapsed = await canvas.boundingBox();
  expect(before).not.toBeNull();
  expect(collapsed).not.toBeNull();
  expect(collapsed!.width - before!.width).toBeGreaterThanOrEqual(280);

  await page.getByRole("button", { name: "Открыть панель" }).click();
  await expect(workspace).toHaveAttribute("data-left-open", "true");
  await expect(page.getByRole("button", { name: "Скрыть панель" })).toHaveAttribute("aria-expanded", "true");
  await expect(leftPanel).toBeVisible();
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0).toBeCloseTo(before!.width, 0);
});

test("mobile inspector close action is touch sized", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/prototype`);
  await page.evaluate((project) => {
    window.localStorage.setItem("fortis-defense-project", JSON.stringify(project));
  }, buildSeedProject());
  await page.reload();

  const closeButton = page.getByRole("button", { name: "Закрыть инспектор" });
  const box = await closeButton.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test("prototype edits, persists, places and deletes DefenseProject objects", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${baseUrl}/prototype`);
  await page.evaluate((project) => {
    window.localStorage.setItem("fortis-defense-project", JSON.stringify(project));
  }, buildSeedProject());
  await page.reload();

  await page.getByRole("button", { name: /QA Radar Unique/ }).first().click();
  await page.getByLabel("Кол-во").fill("5");
  await page.getByRole("button", { name: "План" }).click();
  await page.getByLabel("Заметки").fill("persisted Playwright note");
  await page.reload();

  await expect(page.getByRole("button", { name: /QA Radar Unique/ }).first()).toBeVisible();
  await expect(page.getByLabel("Кол-во")).toHaveValue("5");
  await expect(page.getByLabel("Заметки")).toHaveValue("persisted Playwright note");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("fortis-defense-project");
        const project = raw ? JSON.parse(raw) : null;
        return project?.placedObjects?.[0]?.status;
      }),
    )
    .toBe("planned");

  await page.getByRole("tab", { name: "Библиотека" }).click();
  await page.getByPlaceholder("Найти средство…").fill("QA Radar");
  await page.getByLabel("Ввести координаты для QA Radar Unique").click();
  const coordinateForm = page.locator("form").filter({ hasText: "Размещение по координатам" });
  await coordinateForm.getByLabel("Широта").fill("55.75");
  await coordinateForm.getByLabel("Долгота").fill("37.10");
  await coordinateForm.getByRole("button", { name: "Разместить" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("fortis-defense-project");
        const project = raw ? JSON.parse(raw) : null;
        return project?.placedObjects?.length ?? 0;
      }),
    )
    .toBe(2);

  await page.getByRole("button", { name: "Удалить" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("fortis-defense-project");
        const project = raw ? JSON.parse(raw) : null;
        return project?.placedObjects?.length ?? 0;
      }),
    )
    .toBe(1);

  await page.goto(`${baseUrl}/calculator`);
  await expect(page.getByRole("heading", { name: "Калькулятор защиты от БПЛА" })).toBeVisible();
  await expect(page.getByText("QA Radar Unique").first()).toBeVisible();
  await expect(page.getByText("60 млн").first()).toBeVisible();
});

test("prototype places an asset by clicking the live GIS map", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${baseUrl}/prototype`);
  await page.evaluate((project) => {
    window.localStorage.setItem("fortis-defense-project", JSON.stringify(project));
  }, buildSeedProject());
  await page.reload();

  await page.getByRole("tab", { name: "Библиотека" }).click();
  await page.getByPlaceholder("Найти средство…").fill("QA Radar");
  await page.getByRole("button", { name: /QA Radar Unique/ }).first().click();

  const canvasBox = await page.locator("canvas").first().boundingBox();
  expect(canvasBox).not.toBeNull();
  await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.48, canvasBox!.y + 360);

  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("fortis-defense-project");
        const project = raw ? JSON.parse(raw) : null;
        return {
          count: project?.placedObjects?.length ?? 0,
          selectedObjectId: project?.selectedObjectId,
          lastAssetId: project?.placedObjects?.at(-1)?.assetId,
        };
      }),
    )
    .toMatchObject({
      count: 2,
      lastAssetId: "asset-qa-radar",
    });

  await page.mouse.click(canvasBox!.x + canvasBox!.width * 0.58, canvasBox!.y + 420);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = window.localStorage.getItem("fortis-defense-project");
        const project = raw ? JSON.parse(raw) : null;
        return project?.placedObjects?.length ?? 0;
      }),
    )
    .toBe(2);
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
