import { expect, test, type Locator, type Page } from "@playwright/test";

type Box = NonNullable<Awaited<ReturnType<Locator["boundingBox"]>>>;

const rectanglesOverlap = (left: Box, right: Box) =>
  left.x < right.x + right.width &&
  left.x + left.width > right.x &&
  left.y < right.y + right.height &&
  left.y + left.height > right.y;

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

test.describe("library boundary control", () => {
  test("uses one toolbar control with a 40px hit target and preserves its working state", async ({ page }) => {
    await openWorkspace(page, { width: 1024, height: 768 });

    const map = page.locator(".fortis-gis-map-board");
    const toolbar = page.locator(".fortis-map-object-control");
    const select = toolbar.getByLabel("Выбрать объект защиты");
    const control = toolbar.getByRole("button", { name: "Свернуть библиотеку" });
    const sidebar = page.locator(".fortis-gis-sidebar");
    const libraryCards = sidebar.locator('[data-testid="asset-card"], .fortis-asset-card');

    await expect(control).toBeVisible();
    await expect(control).toHaveAttribute("title", "Свернуть библиотеку");
    await control.hover();
    await expect(toolbar.locator('[role="tooltip"]', { hasText: "Свернуть библиотеку" })).toBeVisible();
    await expect(sidebar).toHaveAttribute("data-sidebar-state", "open");

    const [mapOpenBox, toolbarBox, controlOpenBox, selectBox, sidebarBox] = await Promise.all([
      box(map),
      box(toolbar),
      box(control),
      box(select),
      box(sidebar),
    ]);
    expect(controlOpenBox.width).toBeGreaterThanOrEqual(40);
    expect(controlOpenBox.height).toBeGreaterThanOrEqual(40);
    expect(controlOpenBox.x).toBeGreaterThanOrEqual(toolbarBox.x);
    expect(controlOpenBox.x + controlOpenBox.width).toBeLessThanOrEqual(toolbarBox.x + toolbarBox.width);
    expect(rectanglesOverlap(controlOpenBox, selectBox)).toBe(false);
    expect(rectanglesOverlap(controlOpenBox, sidebarBox)).toBe(false);
    if (await libraryCards.count()) {
      expect(rectanglesOverlap(controlOpenBox, await box(libraryCards.first()))).toBe(false);
    }

    const openOffsetFromMap = controlOpenBox.x - mapOpenBox.x;
    await control.click();

    const expandControl = toolbar.getByRole("button", { name: "Развернуть библиотеку" });
    await expect(sidebar).toHaveAttribute("data-sidebar-state", "closed");
    await expect(expandControl).toBeVisible();
    await expect(expandControl).toHaveAttribute("title", "Развернуть библиотеку");

    const [mapClosedBox, controlClosedBox] = await Promise.all([box(map), box(expandControl)]);
    expect(controlClosedBox.x - mapClosedBox.x).toBeCloseTo(openOffsetFromMap, 0);
    expect(controlClosedBox.width).toBeGreaterThanOrEqual(40);
    expect(controlClosedBox.height).toBeGreaterThanOrEqual(40);

    const echelonDisclosure = page
      .getByRole("region", { name: "Обзор эшелонов" })
      .getByRole("button", { name: "Развернуть панель эшелонов" });
    await echelonDisclosure.click();
    await expect(sidebar).toHaveAttribute("data-sidebar-state", "closed");
    await page
      .getByRole("region", { name: "Обзор эшелонов" })
      .getByRole("button", { name: "Свернуть панель эшелонов" })
      .click();
    await expect(sidebar).toHaveAttribute("data-sidebar-state", "closed");
    await expect(
      page.locator(".fortis-map-object-control").getByRole("button", { name: "Развернуть библиотеку" }),
    ).toBeVisible();
    await expectNoDocumentHorizontalOverflow(page);
  });
});

for (const viewport of [
  { width: 1024, height: 768 },
  { width: 1280, height: 800 },
]) {
  test(`bottom echelon drawer stays inside the map at ${viewport.width}px`, async ({ page }) => {
    await openWorkspace(page, viewport);

    const map = page.locator(".fortis-gis-map-board");
    const drawer = page.getByRole("region", { name: "Обзор эшелонов" });
    const disclosure = drawer.getByRole("button", { name: "Развернуть панель эшелонов" });

    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute("data-echelon-drawer-state", "collapsed");
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await expect(drawer.locator('[aria-controls="fortis-echelons-drawer-content"]')).toHaveCount(1);

    await disclosure.click();
    await expect(drawer).toHaveAttribute("data-echelon-drawer-state", "expanded");
    const collapseDisclosure = drawer.getByRole("button", { name: "Свернуть панель эшелонов" });
    await expect(collapseDisclosure).toHaveAttribute("aria-expanded", "true");

    const content = page.locator("#fortis-echelons-drawer-content");
    const strip = content.locator('[data-echelon-scroll-rule="horizontal"]');
    await expect(content).toBeVisible();
    await expect(strip).toBeVisible();

    const [mapBox, drawerBox, scaleBox, attributionBox, objectControlBox, cornerControlBox] =
      await Promise.all([
        box(map),
        box(drawer),
        box(page.locator(".fortis-map-scale")),
        box(page.locator(".fortis-map-attribution")),
        box(page.locator(".fortis-map-object-control")),
        box(page.locator(".fortis-map-control-corner")),
      ]);

    expect(drawerBox.x).toBeGreaterThanOrEqual(mapBox.x);
    expect(drawerBox.x + drawerBox.width).toBeLessThanOrEqual(mapBox.x + mapBox.width);
    expect(drawerBox.y + drawerBox.height).toBeLessThanOrEqual(mapBox.y + mapBox.height);
    expect(rectanglesOverlap(drawerBox, scaleBox)).toBe(false);
    expect(rectanglesOverlap(drawerBox, attributionBox)).toBe(false);
    expect(rectanglesOverlap(drawerBox, objectControlBox)).toBe(false);
    expect(rectanglesOverlap(drawerBox, cornerControlBox)).toBe(false);

    const overflowRule = await strip.evaluate((element) => ({
      overflowX: getComputedStyle(element).overflowX,
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
    expect(overflowRule.overflowX).toBe("auto");
    expect(overflowRule.scrollWidth).toBeGreaterThanOrEqual(overflowRule.clientWidth);
    await expectNoDocumentHorizontalOverflow(page);

    await collapseDisclosure.click();
    await expect(drawer).toHaveAttribute("data-echelon-drawer-state", "collapsed");
    await expect(content).toBeHidden();
  });
}
