import { expect, test, type Page } from "@playwright/test";

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
});
