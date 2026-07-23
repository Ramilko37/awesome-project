import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { createDefaultDefenseProject } from "../../src/shared/lib/defense-project";
import type {
  DefenseAsset,
  DefenseProject,
  PlacedDefenseObject,
} from "../../src/shared/types/defense-project";

const projectStorageKey = "fortis-defense-project";
const mapViewStorageKey = "fortis-map-view";
const artifactRoot = join(process.cwd(), "output/playwright/stage-5-767b692");
const afterRoot = join(artifactRoot, "after");

const viewports = [
  { label: "1280x800", width: 1280, height: 800 },
  { label: "1366x768", width: 1366, height: 768 },
  { label: "1440x900", width: 1440, height: 900 },
  { label: "1920x1080", width: 1920, height: 1080 },
] as const;

const longLayerName =
  "Ближний эшелон непрерывного радиолокационного обнаружения и классификации северного сектора";
const longObjectName =
  "Мобильная огневая группа северного сектора с расширенным комплектом вооружения, связи и наблюдения";

function longCatalog(): DefenseAsset[] {
  const project = createDefaultDefenseProject();
  const seed = project.assetLibrary[0]!;
  return Array.from({ length: 24 }, (_, index) => ({
    ...seed,
    id: `stage-5-asset-${index + 1}`,
    name:
      index === 23
        ? "Последняя карточка длинного каталога"
        : `Средство проверки ${String(index + 1).padStart(2, "0")}`,
    pricePerUnitMln: index + 1,
  }));
}

function projectWithLongConflict(): DefenseProject {
  const project = createDefaultDefenseProject();
  const layer = { ...project.layers[0]!, name: longLayerName };
  const asset = { ...project.assetLibrary[0]!, name: longObjectName };
  const object: PlacedDefenseObject = {
    id: "stage-5-conflict-object",
    assetId: asset.id,
    layerId: layer.id,
    coordinates: project.baseObject.center,
    name: longObjectName,
    quantity: 2,
    status: "active",
    hasCoverageConflict: true,
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  };

  return {
    ...project,
    activeLayerId: layer.id,
    layers: [layer, ...project.layers.slice(1)],
    assetLibrary: [asset, ...project.assetLibrary.slice(1)],
    placedObjects: [object],
  };
}

type AssetApiMode = "error" | "loading" | "long";

async function installIsolatedApi(page: Page, assetMode: AssetApiMode = "error") {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "GET" && url.pathname === "/api/v1/assets") {
      if (assetMode === "loading") {
        await new Promise(() => undefined);
        return;
      }
      if (assetMode === "long") {
        const items = longCatalog();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items, totalItems: items.length }),
        });
        return;
      }
    }

    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "API intentionally unavailable in isolated Stage 5 test" }),
    });
  });
}

async function openWorkspace(
  page: Page,
  options: {
    assetMode?: AssetApiMode;
    project?: DefenseProject;
    viewport?: { width: number; height: number };
  } = {},
) {
  if (options.viewport) {
    await page.setViewportSize(options.viewport);
  }
  await page.addInitScript(
    ({ mapKey, projectKey, project }) => {
      globalThis.localStorage.setItem(mapKey, JSON.stringify({ currentBaseMapSourceId: "internal-basemap" }));
      if (project) {
        globalThis.localStorage.setItem(projectKey, JSON.stringify(project));
      } else {
        globalThis.localStorage.removeItem(projectKey);
      }
    },
    {
      mapKey: mapViewStorageKey,
      projectKey: projectStorageKey,
      project: options.project,
    },
  );
  await installIsolatedApi(page, options.assetMode);
  await page.goto("/prototype", { waitUntil: "domcontentloaded" });
  await page.addStyleTag({
    content: "*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }",
  });
  await expect(page.locator(".fortis-gis-map-board")).toBeVisible({ timeout: 15_000 });
}

async function expectNoDocumentHorizontalOverflow(page: Page) {
  const geometry = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
  }));
  expect(geometry.documentScrollWidth).toBe(geometry.clientWidth);
  expect(geometry.bodyScrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
}

async function expectInsideViewport(locator: Locator, viewport: { width: number; height: number }) {
  await expect(locator).toBeVisible();
  await expect(locator).toBeInViewport();
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function expectMapPriority(page: Page, viewport: { width: number; height: number }) {
  const map = page.locator(".fortis-gis-map-board");
  const sidebar = page.locator(".fortis-gis-sidebar");
  const inspector = page.locator(".fortis-gis-inspector");
  const [mapBox, sidebarBox, inspectorBox] = await Promise.all([
    map.boundingBox(),
    sidebar.boundingBox(),
    inspector.boundingBox(),
  ]);
  expect(mapBox).not.toBeNull();
  expect(sidebarBox).not.toBeNull();
  expect(inspectorBox).not.toBeNull();
  expect(mapBox!.width).toBeGreaterThan(sidebarBox!.width);
  expect(mapBox!.width).toBeGreaterThan(inspectorBox!.width);
  await expectInsideViewport(map, viewport);
}

async function captureState(page: Page, viewportLabel: string, state: string) {
  const directory = join(afterRoot, viewportLabel);
  mkdirSync(directory, { recursive: true });
  const name = `${state}-${viewportLabel}.png`;
  await page.screenshot({ path: join(directory, name) });
  await expect(page).toHaveScreenshot(name, { fullPage: false });
}

test.describe("Stage 5 state matrix", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("covers empty selection, selected echelon, and empty echelon content", async ({ page }) => {
    await openWorkspace(page);
    const inspector = page.locator(".fortis-gis-inspector");
    await expect(inspector).toHaveAttribute("data-inspector-state", "empty");
    await expect(inspector.getByRole("heading", { name: "Ничего не выбрано" })).toBeVisible();

    await page.locator(".fortis-tree-item").first().click();
    await expect(inspector).toHaveAttribute("data-inspector-state", "echelon");
    await expect(inspector.getByRole("heading", { name: "Инспектор эшелона" })).toBeVisible();
    await expect(inspector.getByText("Ничего не выбрано")).toHaveCount(0);

    const emptyEchelon = page
      .locator(".fortis-gis-objects-panel")
      .getByRole("heading", { name: "В этом эшелоне пока нет объектов" });
    await expect(emptyEchelon).toBeVisible();
    await expect(emptyEchelon).toBeInViewport();
  });

  test("covers library loading with disabled refresh", async ({ page }) => {
    await openWorkspace(page, { assetMode: "loading" });
    const libraryPanel = page.locator('[data-library-role="add-objects"]');
    await expect(libraryPanel.getByText("Загрузка библиотеки", { exact: true })).toBeVisible();
    await expect(
      libraryPanel.getByRole("button", { name: "Обновить каталог с сервера" }),
    ).toBeDisabled();
  });

  test("covers library error and empty search", async ({ page }) => {
    await openWorkspace(page, { assetMode: "error" });
    const libraryPanel = page.locator('[data-library-role="add-objects"]');
    await expect(
      libraryPanel.getByText("Не удалось загрузить библиотеку", { exact: true }),
    ).toBeVisible({ timeout: 15_000 });

    const search = page.getByRole("searchbox", { name: "Поиск по библиотеке средств защиты" });
    await search.fill("результат-заведомо-отсутствует");
    const emptyResult = libraryPanel.getByText("Средства защиты не найдены", { exact: true });
    await expect(emptyResult).toBeVisible();
    await emptyResult.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await expect(emptyResult).toBeInViewport();
  });

  test("covers a scrollable long library result", async ({ page }) => {
    await openWorkspace(page, { assetMode: "long" });
    const scrollRegion = page.getByTestId("asset-library-scroll-region");
    const lastCard = page.getByTestId("defense-tool-card-stage-5-asset-24");
    await expect(lastCard).toBeAttached({ timeout: 15_000 });
    const scrollGeometry = await scrollRegion.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      };
    });
    expect(scrollGeometry.scrollHeight).toBeGreaterThan(scrollGeometry.clientHeight);
    expect(scrollGeometry.scrollTop).toBeGreaterThan(0);
    await expect(lastCard).toBeVisible();
    await expect(lastCard).toBeInViewport();
  });

  test("covers create, validation, cancel, library and context collapse, drawer states, and basemap selection", async ({
    page,
  }) => {
    await openWorkspace(page);
    const createButton = page.getByRole("button", { name: "Создать средство защиты" });
    await createButton.click();
    const form = page.getByRole("form", { name: "Создание средства защиты" });
    const name = form.getByRole("textbox", { name: "Название" });
    const submit = form.getByRole("button", { name: "Создать", exact: true });
    const cancel = form.getByRole("button", { name: "Отмена", exact: true });
    await expect(form).toBeVisible();
    await expect(form).toBeInViewport();
    await expect(name).toBeInViewport();
    await expect(submit).toBeVisible();
    await expect(submit).toBeInViewport();
    await expect(cancel).toBeVisible();
    await expect(cancel).toBeInViewport();
    await submit.click();
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByText("Укажите название средства защиты.")).toBeVisible();
    await cancel.click();
    await expect(form).toBeHidden();
    await expect(createButton).toBeVisible();

    const collapseLibrary = page.getByRole("button", { name: "Свернуть библиотеку" });
    await collapseLibrary.click();
    await expect(page.locator(".fortis-gis-sidebar")).toHaveAttribute("data-sidebar-state", "closed");
    const expandLibrary = page.getByRole("button", { name: "Развернуть библиотеку" });
    await expect(expandLibrary).toBeVisible();
    await expect(expandLibrary).toBeInViewport();
    await expandLibrary.click();

    const collapseContext = page.getByRole("button", { name: "Свернуть панель контекста" });
    await collapseContext.click();
    await expect(page.locator(".fortis-gis-inspector")).toBeHidden();
    const expandContext = page.getByRole("button", { name: "Развернуть панель контекста" });
    await expect(expandContext).toBeVisible();
    await expect(expandContext).toBeInViewport();
    await expandContext.click();

    const drawer = page.getByRole("region", { name: "Обзор эшелонов" });
    await expect(drawer).toHaveAttribute("data-echelon-drawer-state", "collapsed");
    await drawer.getByRole("button", { name: "Развернуть панель эшелонов" }).click();
    await expect(drawer).toHaveAttribute("data-echelon-drawer-state", "expanded");
    await expect(page.locator("#fortis-echelons-drawer-content")).toBeVisible();
    await drawer.getByRole("button", { name: "Свернуть панель эшелонов" }).click();
    await expect(drawer).toHaveAttribute("data-echelon-drawer-state", "collapsed");

    const baseMapTrigger = page.getByRole("button", { name: "Выбрать источник карты" });
    await baseMapTrigger.click();
    const baseMapMenu = page.getByRole("dialog", { name: "Источники карты" });
    await expect(baseMapMenu).toBeVisible();
    await expect(baseMapMenu).toBeInViewport();
    const internalMap = baseMapMenu.getByRole("button", { name: /Внутренняя подложка/ });
    await expect(internalMap).toHaveAttribute("aria-pressed", "true");
  });

  test("covers selected object, long names, and persisted conflict state without clipping", async ({ page }) => {
    await openWorkspace(page, { project: projectWithLongConflict() });
    const longLayer = page.locator(".fortis-tree-item").first();
    await expect(longLayer).toHaveAttribute("title", longLayerName);
    await longLayer.click();
    const objectTreeItem = page.getByRole("treeitem", {
      name: new RegExp(longObjectName.slice(0, 32)),
    });
    await expect(objectTreeItem).toBeVisible();
    await objectTreeItem.click();

    const inspector = page.locator(".fortis-gis-inspector");
    await expect(inspector).toHaveAttribute("data-inspector-state", "object");
    await expect(inspector.getByText(longObjectName)).toBeVisible();
    const conflict = inspector.getByText("Покрытие конфликтует с соседним объектом");
    await expect(conflict).toBeVisible();
    await conflict.scrollIntoViewIfNeeded();
    await expect(conflict).toBeInViewport();

    const drawer = page.getByRole("region", { name: "Обзор эшелонов" });
    await drawer.getByRole("button", { name: "Развернуть панель эшелонов" }).click();
    const conflictStatus = drawer.getByText("Есть конфликт", { exact: true });
    await expect(conflictStatus).toBeVisible();
    await expect(conflictStatus).toBeInViewport();
    await expectNoDocumentHorizontalOverflow(page);
  });
});

test.describe("Stage 5 viewport geometry and visual regression", () => {
  for (const viewport of viewports) {
    test(`${viewport.label}: captures all required states with map priority and no clipping`, async ({ page }) => {
      test.setTimeout(90_000);
      await openWorkspace(page, { viewport });

      const createButton = page.getByRole("button", { name: "Создать средство защиты" });
      const contextToggle = page.getByRole("button", { name: "Свернуть панель контекста" });
      await expectNoDocumentHorizontalOverflow(page);
      await expectMapPriority(page, viewport);
      await expectInsideViewport(createButton, viewport);
      await expectInsideViewport(contextToggle, viewport);
      await captureState(page, viewport.label, "primary");

      await page.locator(".fortis-tree-item").first().click();
      await expect(page.locator(".fortis-gis-inspector")).toHaveAttribute(
        "data-inspector-state",
        "echelon",
      );
      await expectNoDocumentHorizontalOverflow(page);
      await expectMapPriority(page, viewport);
      await captureState(page, viewport.label, "selected-echelon");

      await createButton.click();
      const form = page.getByRole("form", { name: "Создание средства защиты" });
      await expectInsideViewport(form, viewport);
      await expectInsideViewport(form.getByRole("textbox", { name: "Название" }), viewport);
      await expectInsideViewport(form.getByRole("button", { name: "Создать", exact: true }), viewport);
      await expectInsideViewport(form.getByRole("button", { name: "Отмена", exact: true }), viewport);
      await expectNoDocumentHorizontalOverflow(page);
      await captureState(page, viewport.label, "create-form");
      await form.getByRole("button", { name: "Отмена", exact: true }).click();

      await page.getByRole("button", { name: "Свернуть библиотеку" }).click();
      await expect(page.locator(".fortis-gis-sidebar")).toHaveAttribute("data-sidebar-state", "closed");
      const expandLibrary = page.getByRole("button", { name: "Развернуть библиотеку" });
      await expectInsideViewport(expandLibrary, viewport);
      await expectNoDocumentHorizontalOverflow(page);
      await captureState(page, viewport.label, "collapsed-library");
      await expandLibrary.click();

      const drawer = page.getByRole("region", { name: "Обзор эшелонов" });
      await drawer.getByRole("button", { name: "Развернуть панель эшелонов" }).click();
      await expect(drawer).toHaveAttribute("data-echelon-drawer-state", "expanded");
      await expectInsideViewport(drawer, viewport);
      await expectNoDocumentHorizontalOverflow(page);
      await captureState(page, viewport.label, "expanded-bottom-drawer");
      await drawer.getByRole("button", { name: "Свернуть панель эшелонов" }).click();

      const closeObjectsPanel = page.getByRole("button", { name: "Закрыть карточку" });
      if (await closeObjectsPanel.isVisible()) {
        await closeObjectsPanel.click();
      }
      await page.getByRole("button", { name: "Выбрать источник карты" }).click();
      const baseMapMenu = page.getByRole("dialog", { name: "Источники карты" });
      await expectInsideViewport(baseMapMenu, viewport);
      await expectNoDocumentHorizontalOverflow(page);
      await captureState(page, viewport.label, "basemap-menu");
    });
  }
});

test("isolated /prototype smoke records console and runtime evidence", async ({ page }) => {
  const consoleMessages: Array<{ type: string; text: string }> = [];
  const pageErrors: string[] = [];
  page.on("console", (message) => {
    consoleMessages.push({ type: message.type(), text: message.text() });
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await openWorkspace(page, { viewport: { width: 1440, height: 900 } });
  await expect(page).toHaveTitle(/Fortis/);
  await expect(page.getByRole("tree", { name: "Эшелоны и объекты проекта" })).toBeVisible();
  await expect(page.locator(".fortis-gis-map-board")).toBeVisible();
  await expect(page.locator(".fortis-gis-inspector")).toBeVisible();
  await expectNoDocumentHorizontalOverflow(page);

  mkdirSync(artifactRoot, { recursive: true });
  writeFileSync(
    join(artifactRoot, "browser-console.json"),
    `${JSON.stringify({ consoleMessages, pageErrors }, null, 2)}\n`,
  );
  expect(pageErrors).toEqual([]);
  expect(consoleMessages.filter((message) => message.type === "error")).toEqual([]);
});
