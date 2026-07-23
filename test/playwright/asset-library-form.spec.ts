import { expect, test, type Page } from "@playwright/test";

const deterministicCatalog = Array.from({ length: 24 }, (_, index) => {
  const itemNumber = index + 1;
  return {
    id: `e2e-asset-${itemNumber}`,
    name: itemNumber === 24 ? "Нижняя карточка каталога" : `Тестовое средство ${String(itemNumber).padStart(2, "0")}`,
    category: "radar",
    roles: ["detection"],
    coverageType: "circle",
    coverageRadius: 12,
    maxEffectiveDistance: 18,
    deploymentType: "static",
    placementType: "map-object",
    recommendedLayerCodes: ["L2"],
    compatibleLayerCodes: ["L2"],
    pricePerUnitMln: itemNumber,
    isPublic: true,
  };
});

async function openPrototypeWithIsolatedApi(page: Page) {
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "API intentionally unavailable in isolated UI test" }),
    });
  });
  await page.goto("/prototype");
  await expect(page.getByRole("button", { name: "Создать средство защиты" })).toBeVisible();
}

async function openPrototypeWithDeterministicCatalog(page: Page) {
  let catalogRequestCount = 0;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "GET" && url.pathname === "/api/v1/assets") {
      catalogRequestCount += 1;
      if (catalogRequestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: deterministicCatalog, totalItems: deterministicCatalog.length }),
        });
        return;
      }
    }

    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ message: "API intentionally unavailable after deterministic catalog load" }),
    });
  });

  await page.goto("/prototype");
  await expect(page.getByTestId("defense-tool-card-e2e-asset-24")).toBeAttached({ timeout: 15_000 });
}

test.describe("asset library create form", () => {
  test.use({ viewport: { width: 1280, height: 600 } });

  test("focuses, validates, cancels, restores the library, and reopens", async ({ page }) => {
    await openPrototypeWithIsolatedApi(page);

    const librarySearch = page.getByRole("searchbox", { name: "Поиск по библиотеке средств защиты" });
    const openCreateButton = page.getByRole("button", { name: "Создать средство защиты" });
    await librarySearch.fill("РЛС");
    await openCreateButton.click();

    const form = page.getByRole("form", { name: "Создание средства защиты" });
    const nameInput = form.getByRole("textbox", { name: "Название" });
    await expect(form).toBeVisible();
    await expect(nameInput).toBeFocused();

    await form.getByRole("button", { name: "Создать", exact: true }).click();
    await expect(nameInput).toHaveAttribute("aria-invalid", "true");
    await expect(form.getByText("Укажите название средства защиты.")).toBeVisible();

    await form.getByRole("button", { name: "Отмена", exact: true }).click();
    await expect(form).toBeHidden();
    await expect(page.getByText("Управление карточками")).toBeVisible();
    await expect(librarySearch).toHaveValue("РЛС");
    await expect(openCreateButton).toBeVisible();

    await openCreateButton.click();
    await expect(page.getByRole("form", { name: "Создание средства защиты" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Название" })).toBeFocused();
  });

  test("keeps the form actions in the constrained viewport while only the body scrolls", async ({ page }) => {
    await openPrototypeWithIsolatedApi(page);
    await page.getByRole("button", { name: "Создать средство защиты" }).click();

    const form = page.getByRole("form", { name: "Создание средства защиты" });
    const formHeading = form.getByRole("heading", { name: "Создание средства защиты" });
    const nameInput = form.getByRole("textbox", { name: "Название" });
    const descriptionInput = form.getByRole("textbox", { name: "Описание" });
    const cancelButton = form.getByRole("button", { name: "Отмена", exact: true });
    const createButton = form.getByRole("button", { name: "Создать", exact: true });

    await expect(nameInput).toBeInViewport();
    await expect(cancelButton).toBeInViewport();
    await expect(createButton).toBeInViewport();
    await expect(descriptionInput).not.toBeInViewport();

    await descriptionInput.scrollIntoViewIfNeeded();
    await expect(descriptionInput).toBeInViewport();
    await expect(formHeading).toBeInViewport();
    await expect(cancelButton).toBeInViewport();
    await expect(createButton).toBeInViewport();
    await expect(nameInput).not.toBeInViewport();
  });

  test("keeps closed-library controls fixed across long, error, and empty catalog states", async ({ page }) => {
    await openPrototypeWithDeterministicCatalog(page);

    const libraryPanel = page.locator('[data-library-role="add-objects"]');
    const libraryHeading = libraryPanel.getByRole("heading", { name: /^Добавить в / });
    const librarySearch = page.getByRole("searchbox", { name: "Поиск по библиотеке средств защиты" });
    const scrollRegion = page.getByTestId("asset-library-scroll-region");
    const lastCard = page.getByTestId("defense-tool-card-e2e-asset-24");
    const lowerCard = page.getByTestId("defense-tool-card-e2e-asset-20");

    await expect(libraryHeading).toBeInViewport();
    await expect(librarySearch).toBeInViewport();
    await expect(lastCard).not.toBeInViewport();

    const fixedControlsBeforeScroll = await Promise.all([
      libraryHeading.boundingBox(),
      librarySearch.boundingBox(),
    ]);
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
    await expect(lastCard).toBeInViewport();
    await expect(libraryHeading).toBeInViewport();
    await expect(librarySearch).toBeInViewport();
    const fixedControlsAfterScroll = await Promise.all([
      libraryHeading.boundingBox(),
      librarySearch.boundingBox(),
    ]);
    expect(fixedControlsAfterScroll).toEqual(fixedControlsBeforeScroll);

    await scrollRegion.evaluate((element) => {
      element.scrollTop = 0;
    });
    await scrollRegion.getByRole("button", { name: "Обновить каталог с сервера" }).click();
    const libraryError = scrollRegion.getByText("Не удалось загрузить библиотеку", { exact: true });
    await expect(libraryError).toBeVisible();

    await lowerCard.scrollIntoViewIfNeeded();
    await expect(lowerCard).toBeInViewport();
    await expect(libraryHeading).toBeInViewport();
    await expect(librarySearch).toBeInViewport();

    await librarySearch.fill("нет-такого-средства");
    const emptyState = scrollRegion.getByText("Средства защиты не найдены", { exact: true });
    await expect(emptyState).toBeVisible();
    await emptyState.scrollIntoViewIfNeeded();
    await expect(emptyState).toBeInViewport();
    await expect(libraryHeading).toBeInViewport();
    await expect(librarySearch).toBeInViewport();
  });
});
