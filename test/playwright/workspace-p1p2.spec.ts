import { expect, test, type Page } from "@playwright/test";

import { createDefaultDefenseProject } from "../../src/shared/lib/defense-project";
import type { DefenseProject, PlacedDefenseObject } from "../../src/shared/types/defense-project";

const storageKey = "fortis-defense-project";
const longLayerName =
  "Ближний эшелон непрерывного радиолокационного обнаружения и классификации северного сектора";
const longObjectName =
  "Мобильная огневая группа северного сектора с расширенным комплектом вооружения и связи";

function projectForStateCoverage(): DefenseProject {
  const project = createDefaultDefenseProject();
  const layer = { ...project.layers[0]!, name: longLayerName };
  const asset = { ...project.assetLibrary[0]!, name: longObjectName };
  const object: PlacedDefenseObject = {
    id: "task-4-conflict-object",
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
    layers: [layer, ...project.layers.slice(1)],
    assetLibrary: [asset, ...project.assetLibrary.slice(1)],
    placedObjects: [object],
  };
}

async function openWorkspace(page: Page, project?: DefenseProject) {
  await page.setViewportSize({ width: 1280, height: 800 });
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
}

test("empty and selected states use the shared panel scale without duplicated library details", async ({ page }) => {
  await openWorkspace(page);

  const inspector = page.locator(".fortis-gis-inspector");
  const emptyState = inspector.locator(".fortis-state");
  await expect(emptyState).toBeVisible();
  await expect(emptyState.getByRole("heading", { name: "Ничего не выбрано" })).toBeVisible();
  await expect(emptyState.getByRole("button")).toHaveCount(0);

  const emptyHeadingSize = await emptyState.locator("h2").evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(emptyHeadingSize).toBeLessThanOrEqual(20);

  await page.locator(".fortis-tree-item").first().click();
  await expect(inspector).toHaveAttribute("data-inspector-state", "echelon");
  await expect(page.locator('[data-library-role="add-objects"]')).toBeVisible();
  await expect(page.locator("[data-library-context]")).not.toContainText("км");

  const objectsPanel = page.locator(".fortis-gis-objects-panel");
  await expect(objectsPanel.locator(".fortis-state")).toBeVisible();
  await expect(objectsPanel.getByRole("heading", { name: "В этом эшелоне пока нет объектов" })).toBeVisible();
});

test("selected and long-name cards keep one Fortis state language", async ({ page }) => {
  await openWorkspace(page, projectForStateCoverage());

  const longTreeItem = page.locator(".fortis-tree-item").first();
  await expect(longTreeItem).toHaveAttribute("title", longLayerName);
  await longTreeItem.click();

  const drawer = page.getByRole("region", { name: "Обзор эшелонов" });
  await drawer.getByRole("button", { name: "Развернуть панель эшелонов" }).click();
  const selectedCard = drawer.locator('.fortis-card[data-selected="true"]').first();
  await expect(selectedCard).toBeVisible();
  await expect(selectedCard.locator(".fortis-card__identity strong")).toHaveAttribute("title", longLayerName);

  await page.getByRole("treeitem", { name: new RegExp(longObjectName.slice(0, 32)) }).click();
  const inspector = page.locator(".fortis-gis-inspector");
  await expect(inspector).toHaveAttribute("data-inspector-state", "object");
  await expect(inspector.getByText(longObjectName)).toBeVisible();

  const libraryCard = page.locator(".fortis-asset-library-card").first();
  await expect(libraryCard).toHaveClass(/fortis-card/);
  await expect(libraryCard.locator(".fortis-card__identity strong")).toHaveAttribute("title", /.+/);

  await expect(page.getByText("GIS Workspace", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Defense Configuration Studio", { exact: true })).toHaveCount(0);
  await expect(page.getByText("locked", { exact: true })).toHaveCount(0);
});
