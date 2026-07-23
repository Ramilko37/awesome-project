import { expect, test } from "@playwright/test";

const storyUrl = "/iframe.html?id=components-overlays--review-harness&viewMode=story";

test.beforeEach(async ({ page }) => {
  await page.goto(storyUrl);
  await expect(page.getByRole("heading", { name: "Проверка overlay-компонентов" })).toBeVisible();
});

test("FocusOverlay preserves focus through parent rerenders and restores it only on close", async ({
  page,
}) => {
  const opener = page.getByRole("button", { name: "Открыть тестовое окно" });
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "Проверка стабильного фокуса" });
  const rerender = dialog.getByRole("button", { name: "Перерисовать родителя" });
  await expect(dialog).toBeVisible();
  await rerender.click();
  await expect(dialog.getByText("Перерисовок родителя: 1")).toBeVisible();
  await expect(rerender).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
});

test("DropdownMenu supports menu semantics, arrow navigation, Escape, and outside dismissal", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Тестовое меню" });
  await trigger.focus();
  await page.keyboard.press("ArrowDown");

  const menu = page.getByRole("menu");
  const first = page.getByRole("menuitem", { name: "Первое действие" });
  const disabled = page.getByRole("menuitem", { name: "Недоступное действие" });
  const second = page.getByRole("menuitem", { name: "Второе действие" });
  await expect(menu).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(first).toBeFocused();
  await expect(disabled).toBeDisabled();

  await page.keyboard.press("ArrowDown");
  await expect(second).toBeFocused();
  await page.keyboard.press("ArrowUp");
  await expect(first).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(menu).toBeVisible();
  await page.getByRole("button", { name: "Внешняя кнопка" }).click();
  await expect(menu).toBeHidden();
});
