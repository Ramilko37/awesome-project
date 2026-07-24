import { expect, test, type Locator, type Page } from "@playwright/test";

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

const rectanglesOverlap = (left: Box, right: Box) =>
  left.x < right.x + right.width && left.x + left.width > right.x && left.y < right.y + right.height && left.y + left.height > right.y;

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  expect(result).not.toBeNull();
  return result!;
}

async function openWorkspace(page: Page, viewport: { width: number; height: number }) {
  await page.setViewportSize(viewport);
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

async function expectNoDocumentHorizontalOverflow(page: Page) {
  const width = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(width.scrollWidth).toBe(width.clientWidth);
}

test.describe("map toolbar and map-first layout", () => {
  test("keeps the library control reachable while the sidebar collapses", async ({ page }) => {
    await openWorkspace(page, { width: 1024, height: 768 });

    const map = page.locator(".fortis-gis-map-board");
    const toolbar = page.locator(".fortis-map-object-control");
    const control = toolbar.getByRole("button", { name: "Свернуть библиотеку" });
    const sidebar = page.locator(".fortis-gis-sidebar");
    await expect(control).toBeVisible();
    await expect(control).toHaveAttribute("title", "Свернуть библиотеку");

    const [mapOpenBox, toolbarBox, controlOpenBox] = await Promise.all([box(map), box(toolbar), box(control)]);
    expect(controlOpenBox.width).toBeGreaterThanOrEqual(40);
    expect(controlOpenBox.height).toBeGreaterThanOrEqual(40);
    expect(rectanglesOverlap(controlOpenBox, toolbarBox)).toBe(true);
    const openOffsetFromMap = controlOpenBox.x - mapOpenBox.x;

    await control.click();
    const expandControl = toolbar.getByRole("button", { name: "Развернуть библиотеку" });
    await expect(sidebar).toHaveAttribute("data-sidebar-state", "closed");
    await expect(expandControl).toBeVisible();
    const [mapClosedBox, controlClosedBox] = await Promise.all([box(map), box(expandControl)]);
    expect(controlClosedBox.x - mapClosedBox.x).toBeCloseTo(openOffsetFromMap, 0);
    expect(controlClosedBox.width).toBeGreaterThanOrEqual(40);
    expect(controlClosedBox.height).toBeGreaterThanOrEqual(40);
    await expectNoDocumentHorizontalOverflow(page);
  });

  test("has no legacy lower echelon drawer at either desktop breakpoint", async ({ page }) => {
    for (const viewport of [{ width: 1024, height: 768 }, { width: 1280, height: 800 }]) {
      await openWorkspace(page, viewport);
      await expect(page.getByRole("region", { name: "Обзор эшелонов" })).toHaveCount(0);
      await expect(page.locator("[data-echelon-role=quick-overview]")).toHaveCount(0);
      await expect(page.locator(".fortis-gis-layer-panel-wrap")).toHaveCount(0);
      await expectNoDocumentHorizontalOverflow(page);
    }
  });

  test("opens the asset editor as a 480–560px drawer and guards dirty cancellation", async ({ page }) => {
    await openWorkspace(page, { width: 1280, height: 800 });
    await page.getByRole("tab", { name: "Библиотека" }).click();
    const createButton = page.getByRole("button", { name: "Создать средство защиты" });
    await createButton.click();

    const drawer = page.getByRole("dialog", { name: "Создание средства защиты" }).first();
    await expect(drawer).toBeVisible();
    const drawerBox = await box(drawer);
    expect(drawerBox.width).toBeGreaterThanOrEqual(480);
    expect(drawerBox.width).toBeLessThanOrEqual(560);
    const name = drawer.getByLabel("Название");
    await expect(name).toBeFocused();
    await name.fill("Средство для проверки");
    await drawer.getByRole("button", { name: "Отменить и вернуться в библиотеку" }).click();

    const confirmation = page.getByRole("dialog", { name: "Отменить изменения?" });
    await expect(confirmation).toBeVisible();
    await confirmation.getByRole("button", { name: "Не сохранять" }).click();
    await expect(drawer).toHaveCount(0);
    await expect(createButton).toBeFocused();
  });
});
