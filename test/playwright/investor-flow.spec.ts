import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

test("local draft exposes an explicit dirty server-sync state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${baseUrl}/prototype`);

  await expect(page.getByRole("status")).toContainText("Есть изменения");
});
