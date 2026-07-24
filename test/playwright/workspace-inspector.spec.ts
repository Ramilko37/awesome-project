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

  return { object, project: { ...project, placedObjects: [object] } };
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
  await expect(page.locator(".fortis-gis-map-board")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".fortis-gis-inspector")).toHaveCount(0);
}

async function expectNoDocumentHorizontalOverflow(page: Page) {
  const width = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(width.scrollWidth).toBe(width.clientWidth);
}

test.describe("map-first workspace selection", () => {
  test("opens context only after a structure selection and closes it completely", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await openWorkspace(page);

    const structurePanel = page.locator(".fortis-gis-sidebar");
    const map = page.locator(".fortis-gis-map-board");
    const [structureBox, mapBox] = await Promise.all([structurePanel.boundingBox(), map.boundingBox()]);
    expect(structureBox?.width).toBeGreaterThanOrEqual(280);
    expect(structureBox?.width).toBeLessThanOrEqual(320);
    expect(mapBox?.width).toBeGreaterThanOrEqual(560);
    expect(mapBox!.width).toBeGreaterThan(structureBox!.width);

    await page.locator(".fortis-tree-item").first().click();
    const inspector = page.locator(".fortis-gis-inspector");
    await expect(inspector).toHaveAttribute("data-inspector-state", "echelon");
    await expect(inspector.getByRole("heading", { name: "Инспектор эшелона" })).toBeVisible();
    await inspector.getByRole("button", { name: "Закрыть инспектор" }).click();
    await expect(inspector).toHaveCount(0);
    await expectNoDocumentHorizontalOverflow(page);
  });

  test("tree object selection drives the single contextual inspector", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const { object, project } = projectWithPlacement();
    await openWorkspace(page, project);

    await page.getByRole("treeitem", { name: new RegExp(object.name!) }).click();
    const inspector = page.locator(".fortis-gis-inspector");
    await expect(inspector).toHaveAttribute("data-inspector-state", "object");
    await expect(inspector.getByText(object.name!)).toBeVisible();
    await expect(page.locator(".fortis-gis-objects-panel")).toHaveCount(0);
  });

  test("context inspector overlays the map on a 1366px laptop workspace", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openWorkspace(page);
    await page.locator(".fortis-tree-item").first().click();

    const [mapBox, inspectorBox] = await Promise.all([
      page.locator(".fortis-gis-map-board").boundingBox(),
      page.locator(".fortis-gis-inspector").boundingBox(),
    ]);
    expect(mapBox?.width).toBeGreaterThanOrEqual(560);
    expect(inspectorBox?.width).toBeGreaterThanOrEqual(320);
    expect(inspectorBox?.width).toBeLessThanOrEqual(360);
    expect(inspectorBox!.x).toBeGreaterThan(mapBox!.x);
    await expectNoDocumentHorizontalOverflow(page);
  });
});
