import { expect, test, type Page } from "@playwright/test";

async function openWorkspace(page: Page) {
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
});
