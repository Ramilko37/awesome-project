// Playwright test for /prototype route
import { test, expect } from '@playwright/test';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000';

test('prototype page loads and shows title', async ({ page }) => {
  await page.goto(`${baseUrl}/prototype`);
  await expect(page).toHaveTitle(/Fortis/);
});

for (const viewport of [
  { label: '1280×720', width: 1280, height: 720 },
  { label: '1440×960', width: 1440, height: 960 },
]) {
  test(`desktop GIS workspace ${viewport.label} docks the project tree and inspector without horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${baseUrl}/prototype`);

    await expect(page.getByRole('tree', { name: 'Эшелоны и объекты проекта' })).toBeVisible();
    const inspector = page.getByRole('complementary', { name: 'Инспектор объекта' });
    await expect(inspector).toBeVisible();
    await expect(inspector.getByText('Ничего не выбрано')).toBeVisible();
    expect(await page.locator('html').evaluate((node) => node.scrollWidth === node.clientWidth)).toBe(true);
  });
}
