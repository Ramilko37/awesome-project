import { expect, test, type Page } from "@playwright/test";

const projectStorageKey = "fortis-defense-project";
const mapViewStorageKey = "fortis-map-view";

async function openWorkspace(page: Page, viewport: { height: number; width: number }) {
  await page.setViewportSize(viewport);
  await page.addInitScript(
    ({ mapKey, projectKey }) => {
      globalThis.localStorage.setItem(mapKey, JSON.stringify({ currentBaseMapSourceId: "internal-basemap" }));
      globalThis.localStorage.removeItem(projectKey);
    },
    { mapKey: mapViewStorageKey, projectKey: projectStorageKey },
  );
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "API intentionally unavailable in visual workspace test" }),
    });
  });
  await page.goto("/prototype", { waitUntil: "domcontentloaded" });
  await page.addStyleTag({
    content: "*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }",
  });
  await expect(page.locator(".fortis-gis-map-board")).toBeVisible({ timeout: 15_000 });
}

async function expectNoDocumentHorizontalOverflow(page: Page) {
  const width = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(width.scrollWidth).toBe(width.clientWidth);
}

test.describe("Map-first workspace visual regression", () => {
  test("1366px laptop records the compact, contextual and form states", async ({ page }) => {
    await openWorkspace(page, { width: 1366, height: 768 });
    const map = page.locator(".fortis-gis-map-board");
    const sidebar = page.locator(".fortis-gis-sidebar");
    const [mapBox, sidebarBox] = await Promise.all([map.boundingBox(), sidebar.boundingBox()]);
    expect(mapBox!.width).toBeGreaterThan(sidebarBox!.width);
    await expect(page.locator(".fortis-gis-inspector")).toHaveCount(0);
    await expectNoDocumentHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("map-first-primary-1366x768.png", { fullPage: false });

    await page.locator(".fortis-tree-item").first().click();
    const inspector = page.locator(".fortis-gis-inspector");
    await expect(inspector).toHaveAttribute("data-inspector-state", "echelon");
    await expectNoDocumentHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("map-first-echolon-selected-1366x768.png", { fullPage: false });

    await page.getByRole("tab", { name: "Библиотека" }).click();
    await page.getByRole("button", { name: "Создать средство защиты" }).click();
    const drawer = page.getByRole("dialog", { name: "Создание средства защиты" }).first();
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("button", { name: "Создать", exact: true })).toBeInViewport();
    await expectNoDocumentHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("map-first-asset-drawer-1366x768.png", { fullPage: false });
  });

  test("map controls remain available without legacy lower overlays", async ({ page }) => {
    await openWorkspace(page, { width: 1440, height: 900 });
    await expect(page.locator("[data-echelon-role=quick-overview]")).toHaveCount(0);
    await expect(page.locator(".fortis-gis-objects-panel")).toHaveCount(0);
    await page.getByRole("button", { name: "Выбрать источник карты" }).click();
    await expect(page.getByRole("dialog", { name: "Источники карты" })).toBeVisible();
    await expectNoDocumentHorizontalOverflow(page);
    await expect(page).toHaveScreenshot("map-first-basemap-menu-1440x900.png", { fullPage: false });
  });
});
