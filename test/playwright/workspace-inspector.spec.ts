import { expect, test, type Page } from "@playwright/test";

import { createDefaultDefenseProject } from "../../src/shared/lib/defense-project";
import type { DefenseProject, PlacedDefenseObject } from "../../src/shared/types/defense-project";

const storageKey = "fortis-defense-project";

function projectWithPlacement(): { object: PlacedDefenseObject; project: DefenseProject } {
  const project = createDefaultDefenseProject();
  const layer = project.layers[0]!;
  const asset = project.assetLibrary[0]!;
  const object: PlacedDefenseObject = {
    id: "workspace-inspector-object",
    assetId: asset.id,
    layerId: layer.id,
    coordinates: project.baseObject.center,
    name: "Тестовый объект инспектора",
    quantity: 1,
    status: "planned",
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T00:00:00.000Z",
  };

  return {
    object,
    project: { ...project, placedObjects: [object] },
  };
}

async function openWorkspace(page: Page, project?: DefenseProject) {
  if (project) {
    await page.addInitScript(
      ({ key, value }) => globalThis.localStorage.setItem(key, JSON.stringify(value)),
      { key: storageKey, value: project },
    );
  }
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "API intentionally unavailable in isolated UI test" }),
    });
  });
  await page.goto("/prototype");
  await expect(page.locator(".fortis-gis-inspector")).toHaveAttribute(
    "data-inspector-state",
    "empty",
    { timeout: 15_000 },
  );
}

async function expectNoDocumentHorizontalOverflow(page: Page) {
  const width = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(width.scrollWidth).toBe(width.clientWidth);
}

test.describe("workspace layout and inspector", () => {
  test("keeps the full desktop grid stable while echelon selection replaces empty state", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openWorkspace(page);

    const structurePanel = page.locator(".fortis-gis-sidebar");
    const map = page.locator(".fortis-gis-map-board");
    const inspector = page.locator(".fortis-gis-inspector");
    const [structureBox, mapBox, inspectorBox] = await Promise.all([
      structurePanel.boundingBox(),
      map.boundingBox(),
      inspector.boundingBox(),
    ]);

    expect(structureBox).not.toBeNull();
    expect(mapBox).not.toBeNull();
    expect(inspectorBox).not.toBeNull();
    expect(structureBox!.width).toBeGreaterThanOrEqual(280);
    expect(structureBox!.width).toBeLessThanOrEqual(320);
    expect(mapBox!.width).toBeGreaterThanOrEqual(560);
    expect(inspectorBox!.width).toBeGreaterThanOrEqual(320);
    expect(inspectorBox!.width).toBeLessThanOrEqual(360);
    expect(Math.abs(inspectorBox!.x - (mapBox!.x + mapBox!.width))).toBeLessThanOrEqual(1);

    const firstEchelon = page.locator(".fortis-tree-item").first();
    const fullEchelonName = await firstEchelon.getAttribute("title");
    expect(fullEchelonName).toBeTruthy();
    await firstEchelon.click();

    await expect(inspector).toHaveAttribute("data-inspector-state", "echelon");
    await expect(inspector.getByRole("heading", { name: "Инспектор эшелона" })).toBeVisible();
    await expect(inspector.getByText("Ничего не выбрано")).toHaveCount(0);

    await inspector.getByRole("button", { name: "Закрыть инспектор" }).click();
    await expect(inspector).toHaveAttribute("data-inspector-state", "empty");
    await expect(inspector.getByText("Ничего не выбрано")).toBeVisible();

    const documentWidth = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(documentWidth.scrollWidth).toBe(documentWidth.clientWidth);
  });

  test("locating an object makes the canonical object selection visible in the inspector", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { object, project } = projectWithPlacement();
    await openWorkspace(page, project);
    await expect(page.getByRole("treeitem", { name: new RegExp(object.name!) })).toBeVisible();

    await page.locator(".fortis-tree-item").first().click();
    const objectPanel = page.locator(".fortis-gis-objects-panel");
    await objectPanel.getByRole("button", { name: "На карте" }).click();

    const inspector = page.locator(".fortis-gis-inspector");
    await expect(inspector).toHaveAttribute("data-inspector-state", "object");
    await expect(inspector.getByText(object.name!)).toBeVisible();
  });

  test("deleting the currently selected object clears the inspector", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { object, project } = projectWithPlacement();
    await openWorkspace(page, project);
    await expect(page.getByRole("treeitem", { name: new RegExp(object.name!) })).toBeVisible();

    await page.locator(".fortis-tree-item").first().click();
    const objectPanel = page.locator(".fortis-gis-objects-panel");
    await objectPanel.getByRole("button", { name: "Выбрать" }).click();
    const inspector = page.locator(".fortis-gis-inspector");
    await expect(inspector).toHaveAttribute("data-inspector-state", "object");

    await objectPanel.getByRole("button", { name: "Удалить" }).click();

    await expect(inspector).toHaveAttribute("data-inspector-state", "empty");
    await expect(inspector.getByText("Ничего не выбрано")).toBeVisible();
    await expect(inspector.getByText("Объект больше не доступен.")).toHaveCount(0);
  });

  test("uses the inspector as an overlay drawer at constrained desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await openWorkspace(page);

    const map = page.locator(".fortis-gis-map-board");
    const inspector = page.locator(".fortis-gis-inspector");
    const [mapBox, inspectorBox] = await Promise.all([
      map.boundingBox(),
      inspector.boundingBox(),
    ]);

    expect(mapBox).not.toBeNull();
    expect(inspectorBox).not.toBeNull();
    expect(mapBox!.width).toBeGreaterThanOrEqual(560);
    expect(inspectorBox!.width).toBeGreaterThanOrEqual(320);
    expect(inspectorBox!.width).toBeLessThanOrEqual(360);
    expect(inspectorBox!.x).toBeGreaterThan(mapBox!.x);
    expect(Math.abs(mapBox!.x + mapBox!.width - (inspectorBox!.x + inspectorBox!.width))).toBeLessThanOrEqual(1);

    const documentWidth = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(documentWidth.scrollWidth).toBe(documentWidth.clientWidth);
  });

  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1280, height: 800 },
  ]) {
    test(`collapses and restores the context panel without reducing map priority at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await openWorkspace(page);

      const map = page.locator(".fortis-gis-map-board");
      const inspector = page.locator(".fortis-gis-inspector");
      const collapseControl = page.getByRole("button", { name: "Свернуть панель контекста" });
      const mapBeforeCollapse = await map.boundingBox();

      expect(mapBeforeCollapse).not.toBeNull();
      await expect(collapseControl).toBeVisible();
      await expect(collapseControl).toHaveAttribute("aria-controls", "fortis-gis-inspector-panel");
      await expect(collapseControl).toHaveAttribute("aria-expanded", "true");
      const collapseControlBox = await collapseControl.boundingBox();
      expect(collapseControlBox).not.toBeNull();
      expect(collapseControlBox!.width).toBeGreaterThanOrEqual(44);
      expect(collapseControlBox!.height).toBeGreaterThanOrEqual(44);

      await collapseControl.click();
      await expect(inspector).toBeHidden();
      const expandControl = page.getByRole("button", { name: "Развернуть панель контекста" });
      await expect(expandControl).toBeVisible();
      await expect(expandControl).toHaveAttribute("aria-expanded", "false");
      await expect(expandControl).toBeInViewport();

      const mapAfterCollapse = await map.boundingBox();
      expect(mapAfterCollapse).not.toBeNull();
      expect(mapAfterCollapse!.width).toBeGreaterThanOrEqual(mapBeforeCollapse!.width);
      await expectNoDocumentHorizontalOverflow(page);

      await expandControl.click();
      await expect(inspector).toBeVisible();
      await expect(page.getByRole("button", { name: "Свернуть панель контекста" })).toHaveAttribute(
        "aria-expanded",
        "true",
      );
    });
  }
});
