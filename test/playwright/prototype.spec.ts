// Playwright test for /prototype route
import { test, expect } from '@playwright/test';

test('prototype page loads and shows title', async ({ page }) => {
  await page.goto('http://127.0.0.1:3000/prototype');
  await expect(page).toHaveTitle(/Fortis/);
});
