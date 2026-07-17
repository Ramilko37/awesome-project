// Playwright test for /prototype route
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function openPrototype(page: import('@playwright/test').Page) {
  await page.goto('http://127.0.0.1:3000/prototype');
  await page.getByRole('heading', { name: 'Моя карта' }).waitFor();
}

test('prototype page loads and shows title', async ({ page }) => {
  await page.goto('http://127.0.0.1:3000/prototype');
  await expect(page).toHaveTitle(/Fortis/);
});

test.describe('GIS UX hardening', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('hiding the active layer preserves its selection', async ({ page }) => {
    test.setTimeout(60_000);
    await openPrototype(page);
    await page.getByRole('button', { name: 'Выбрать эшелон L5' }).click();
    await page.getByRole('button', { name: /Скрыть эшелон L5/ }).click();
    await expect(page.getByText('Активный · Скрыт')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Выбрать эшелон L5' })).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await page.getByRole('heading', { name: 'Моя карта' }).waitFor();
    await expect(page.getByText('Активный · Скрыт')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Выбрать эшелон L5' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('map exposes reset, measure and legend', async ({ page }) => {
    await openPrototype(page);
    await expect(page.getByRole('button', { name: 'Показать весь объект' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Измерить расстояние' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Показать легенду карты' })).toBeVisible();
  });

  test('legend lists only marker categories present on visible layers', async ({ page }) => {
    test.setTimeout(60_000);
    await openPrototype(page);
    await page.getByRole('button', { name: 'Выбрать эшелон L5' }).click();
    await page.getByRole('textbox', { name: 'Поиск по библиотеке средств защиты' }).fill('МОГ');
    await page.getByRole('button', { name: 'Ввести координаты' }).click();
    await page.getByLabel('Широта').fill('56,8889');
    await page.getByLabel('Долгота').fill('60,5945');
    await page.getByRole('button', { name: 'Разместить' }).click();
    await page.getByRole('button', { name: 'Отмена' }).click();

    await page.getByRole('button', { name: 'Показать легенду карты' }).click();
    const kineticCategory = page.locator('[data-legend-marker-category="kinetic"]');
    await expect(kineticCategory).toHaveText('Поражение');

    await page.getByRole('button', { name: 'Скрыть эшелон L5' }).click();
    await expect(kineticCategory).toBeHidden();
  });

  test('keyboard workflow exposes search, coordinates, visibility, measure and legend states', async ({ page }) => {
    await openPrototype(page);
    const search = page.getByRole('textbox', { name: 'Поиск по библиотеке средств защиты' });
    await search.focus();
    await search.pressSequentially('МОГ');
    await expect(page.getByText('Найдено: 1')).toBeVisible();

    const coordinateAction = page.getByRole('button', { name: 'Ввести координаты' }).first();
    await coordinateAction.focus();
    await coordinateAction.press('Enter');
    await expect(page.getByText('Размещение по координатам')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Размещение по координатам')).toBeHidden();

    const layer = page.getByRole('button', { name: 'Выбрать эшелон L5' });
    await layer.focus();
    await layer.press('Enter');
    const hideLayer = page.getByRole('button', { name: 'Скрыть эшелон L5' });
    await hideLayer.focus();
    await hideLayer.press('Enter');
    await expect(page.getByText('Активный · Скрыт')).toBeVisible();
    await page.getByRole('button', { name: 'Показать эшелон L5' }).press('Enter');

    const measure = page.getByRole('button', { name: 'Измерить расстояние' });
    await measure.focus();
    await measure.press('Enter');
    await expect(measure).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await expect(measure).toHaveAttribute('aria-pressed', 'false');

    const legend = page.getByRole('button', { name: 'Показать легенду карты' });
    await legend.focus();
    await legend.press('Enter');
    await expect(page.getByRole('button', { name: 'Скрыть легенду карты' })).toHaveAttribute('aria-expanded', 'true');
  });

  test('critical controls meet target size and the main state has no serious accessibility violations', async ({ page }) => {
    const glyphWarnings: string[] = [];
    page.on('console', (message) => {
      if (/missing glyph|missing character/i.test(message.text())) glyphWarnings.push(message.text());
    });
    await openPrototype(page);
    await expect(page.getByRole('region', { name: 'Карта конфигурации защиты' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Библиотека средств защиты' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Эшелоны защиты' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: 'Активный эшелон L1, показан' })).toBeAttached();
    await expect(page.getByRole('button', { name: /Черновик \(не сохранён\)/ }).filter({ visible: true })).toBeVisible();
    for (const locator of [
      page.getByRole('textbox', { name: 'Поиск по библиотеке средств защиты' }),
      page.getByRole('button', { name: 'Скрыть эшелон L1' }),
      page.getByRole('button', { name: 'Измерить расстояние' }),
      page.getByRole('button', { name: 'Показать легенду карты' }),
    ]) {
      const box = await locator.boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const seriousOrCritical = results.violations.filter((violation) =>
      violation.impact === 'serious' || violation.impact === 'critical',
    );
    expect(seriousOrCritical).toEqual([]);
    expect(glyphWarnings).toEqual([]);
  });

  test('placed object deletion requires confirmation and can be cancelled', async ({ page }) => {
    test.setTimeout(60_000);
    await openPrototype(page);
    await page.getByRole('button', { name: 'Выбрать эшелон L5' }).click();
    await page.getByRole('textbox', { name: 'Поиск по библиотеке средств защиты' }).fill('МОГ');
    await page.getByRole('button', { name: 'Ввести координаты' }).click();
    await page.getByLabel('Широта').fill('56,8889');
    await page.getByLabel('Долгота').fill('60,5945');
    await page.getByRole('button', { name: 'Разместить' }).click();
    await expect(page.getByText('Настройка МОГ')).toBeVisible();
    await page.getByRole('button', { name: 'Отмена' }).click();

    const layerCard = page.getByRole('button', { name: 'Выбрать эшелон L5' }).locator('..');
    await layerCard.getByRole('button', { name: 'Открыть меню эшелона' }).click();
    await page.getByText('Открыть объекты эшелона', { exact: true }).click();
    await expect(page.getByText('Объекты эшелона', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Удалить МОГ' }).click();
    await expect(page.getByRole('dialog', { name: 'Удалить «МОГ»?' })).toBeVisible();
    await page.getByRole('button', { name: 'Отмена' }).click();
    await expect(page.getByRole('dialog', { name: 'Удалить «МОГ»?' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Удалить МОГ' })).toBeVisible();

    await page.getByRole('button', { name: 'Удалить МОГ' }).click();
    await page.getByRole('button', { name: 'Удалить объект' }).click();
    const undoNotice = page.getByRole('status').filter({ hasText: 'Объект «МОГ» удалён' });
    await expect(undoNotice).toBeVisible();
    await undoNotice.getByRole('button', { name: 'Отменить' }).click();
    await expect(page.getByRole('button', { name: 'Удалить МОГ' })).toBeVisible();
  });

  test('reset extent and measurement complete, cancel and clear without changing the project', async ({ page }) => {
    test.setTimeout(90_000);
    await openPrototype(page);
    const zoomStatus = page.getByRole('status', { name: /Текущий зум карты/ });
    const initialZoom = await zoomStatus.textContent();

    const projectBefore = await page.evaluate(() => localStorage.getItem('fortis-defense-project'));
    await page.getByRole('button', { name: 'Приблизить карту' }).click();
    await page.getByRole('button', { name: 'Приблизить карту' }).click();
    await expect.poll(async () => zoomStatus.textContent()).not.toBe(initialZoom);
    await page.getByRole('button', { name: 'Показать весь объект' }).click();
    await expect.poll(async () => zoomStatus.textContent()).toBe(initialZoom);

    const map = page.getByRole('region', { name: 'Карта конфигурации защиты' });
    const deckCanvas = page.locator('#deckgl-overlay');
    await expect.poll(async () => (await deckCanvas.boundingBox())?.width ?? 0).toBeGreaterThan(800);
    const box = await map.boundingBox();
    expect(box).not.toBeNull();

    const measure = page.getByRole('button', { name: 'Измерить расстояние' });
    await measure.click();
    let measurementSurface = page.locator('[data-measurement-surface]');
    await measurementSurface.click({ position: { x: box!.width * 0.4, y: box!.height * 0.35 } });
    const measuring = page.getByRole('status').filter({ hasText: 'Измерение расстояния' });
    await expect(measuring).toBeVisible();
    await measurementSurface.click({ position: { x: box!.width * 0.6, y: box!.height * 0.35 } });
    await expect(measuring.locator('p').nth(1)).not.toHaveText('0 м');
    await page.keyboard.press('Enter');
    const completed = page.getByRole('status').filter({ hasText: 'Расстояние измерено' });
    await expect(completed).toBeVisible();
    await completed.getByRole('button', { name: 'Очистить' }).click();
    await expect(completed).toBeHidden();

    await measure.click();
    measurementSurface = page.locator('[data-measurement-surface]');
    await measurementSurface.click({ position: { x: box!.width * 0.4, y: box!.height * 0.35 } });
    await page.keyboard.press('Escape');
    await expect(measure).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('status').filter({ hasText: 'Измерение расстояния' })).toBeHidden();

    const projectAfter = await page.evaluate(() => localStorage.getItem('fortis-defense-project'));
    expect(projectAfter).toBe(projectBefore);
  });

  test('keyboard-only flow places MOG, cancels its inspector and toggles object visibility', async ({ page }) => {
    test.setTimeout(60_000);
    await openPrototype(page);
    const layer = page.getByRole('button', { name: 'Выбрать эшелон L5' });
    await layer.focus();
    await layer.press('Enter');
    const search = page.getByRole('textbox', { name: 'Поиск по библиотеке средств защиты' });
    await search.focus();
    await search.pressSequentially('МОГ');
    const coordinates = page.getByRole('button', { name: 'Ввести координаты' });
    await coordinates.focus();
    await coordinates.press('Enter');
    await page.getByLabel('Широта').fill('56,8889');
    await page.getByLabel('Долгота').fill('60,5945');
    const place = page.getByRole('button', { name: 'Разместить' });
    await place.focus();
    await place.press('Enter');
    await expect(page.getByText('Настройка МОГ')).toBeVisible();
    const cancelInspector = page.getByRole('button', { name: 'Отмена' });
    await cancelInspector.focus();
    await cancelInspector.press('Enter');

    const layerCard = layer.locator('..');
    const layerMenu = layerCard.getByRole('button', { name: 'Открыть меню эшелона' });
    await layerMenu.focus();
    await layerMenu.press('Enter');
    const openObjects = page.getByRole('menuitem', { name: 'Открыть объекты эшелона' });
    await openObjects.focus();
    await openObjects.press('Enter');
    const hideObject = page.getByRole('button', { name: 'Скрыть МОГ на карте' });
    await hideObject.focus();
    await hideObject.press('Enter');
    await expect(page.getByText('скрыт на карте', { exact: true })).toBeVisible();
    const showObject = page.getByRole('button', { name: 'Показать МОГ на карте' });
    await showObject.focus();
    await showObject.press('Enter');
    await expect(page.getByText('скрыт на карте', { exact: true })).toBeHidden();
  });

  test('save recovery keeps input after HTTP error and retries the same intent', async ({ page }) => {
    let postAttempts = 0;
    await page.route('**/api/defense/projects**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], totalItems: 0 }) });
        return;
      }
      if (method === 'POST') {
        postAttempts += 1;
        if (postAttempts === 1) {
          await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'backend exploded' }) });
          return;
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            projectId: 'recovered-variant',
            name: 'Вариант после ошибки',
            projectName: 'Вариант после ошибки',
            version: 1,
            updatedAt: '2026-07-17T12:00:00.000Z',
          }),
        });
        return;
      }
      await route.fallback();
    });

    await openPrototype(page);
    await page.getByRole('button', { name: /Черновик/ }).click();
    const nameInput = page.getByPlaceholder('Имя нового варианта…');
    await nameInput.fill('Вариант после ошибки');
    await page.getByRole('button', { name: 'Сохранить как новый' }).click();
    await expect(page.getByText('Не удалось сохранить изменения', { exact: true }).first()).toBeVisible();
    await expect(nameInput).toHaveValue('Вариант после ошибки');
    await page.getByRole('button', { name: 'Повторить' }).click();
    await expect(page.getByRole('button', { name: /Вариант после ошибки · Сохранено \d{2}:\d{2}/ })).toBeVisible();
    await expect(nameInput).toHaveValue('');
    expect(postAttempts).toBe(2);
  });

  test('200% zoom does not require page-level horizontal scrolling', async ({ page }) => {
    await openPrototype(page);
    await page.evaluate(() => {
      document.documentElement.style.zoom = '2';
    });
    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
  });
});

test.describe('GIS UX second desktop viewport', () => {
  test.use({ viewport: { width: 1440, height: 960 } });

  test('map controls and active navigation remain visible', async ({ page }) => {
    await openPrototype(page);
    await expect(page.getByRole('link', { name: /Карта/ })).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('button', { name: 'Показать весь объект' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Показать легенду карты' })).toBeVisible();
  });
});
