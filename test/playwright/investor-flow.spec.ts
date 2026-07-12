import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

function backendProject() {
  return {
    schemaVersion: 1,
    projectId: "server-project",
    projectName: "Серверный вариант",
    enterpriseId: "enterprise-alpha",
    version: 4,
    baseObject: { id: "plant-alpha", name: "Завод Альфа", center: { lat: 55.75, lng: 37.61 } },
    layers: [],
    assetLibrary: [],
    placedObjects: [],
    mode: "view",
    source: "backend",
    updatedAt: "2026-07-12T00:00:00.000Z",
  };
}

function backendReport() {
  return {
    projectId: "server-project",
    projectName: "Серверный вариант",
    baseObject: { id: "plant-alpha", name: "Завод Альфа", center: { lat: 55.75, lng: 37.61 } },
    layers: [],
    placedObjects: [],
    estimate: { totalMln: 60, byEchelon: [], byType: [], byObject: [] },
    structuralProfile: { objectCount: 0, unitCount: 0, echelonCount: 0, categoryCount: 0, conflictCount: 0, coveredObjCount: 0, totalMln: 60, byEchelon: [] },
    hideCost: false,
  };
}

function backendBudget() {
  return { projectId: "server-project", budgetMode: "limited", budgetAmountMln: 100, createdAt: "2026-07-12T00:00:00Z", updatedAt: "2026-07-12T00:00:00Z" };
}

test("local draft exposes an explicit dirty server-sync state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${baseUrl}/prototype`);

  await expect(page.getByRole("status")).toContainText("Есть изменения");
});

test("backend calculator error never substitutes local financial figures", async ({ page }) => {
  await page.route("**/api/v1/projects/cost?id=server-project", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "offline" }) }),
  );
  await page.route("**/api/v1/projects/report?id=server-project*", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "offline" }) }),
  );
  await page.goto(`${baseUrl}/calculator`);
  await page.evaluate((project) => {
    window.localStorage.setItem("fortis-defense-project", JSON.stringify(project));
  }, backendProject());
  await page.reload();

  await expect(page.getByRole("alert").filter({ hasText: "Локальные цифры не показаны" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Повторить" })).toBeVisible();
});

test("saved server project opens the printable report route", async ({ page }) => {
  await page.route("**/api/v1/projects/cost?id=server-project", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(backendReport().estimate) }),
  );
  await page.route("**/api/v1/projects/report?id=server-project*", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(backendReport()) }),
  );
  await page.route("**/api/v1/projects/budget?id=server-project", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(backendBudget()) }),
  );
  await page.goto(`${baseUrl}/calculator`);
  await page.evaluate((project) => window.localStorage.setItem("fortis-defense-project", JSON.stringify(project)), backendProject());
  await page.reload();

  const reportLink = page.getByRole("link", { name: "Открыть отчёт" });
  await expect(reportLink).toHaveAttribute("href", "/report?id=server-project");
});

test("opening a saved variant keeps backend data when navigating to the calculator", async ({ page }) => {
  await page.route("**/api/defense/projects**", (route) => {
    const pathname = new URL(route.request().url()).pathname.replace(/\/+$/, "");
    if (pathname === "/api/defense/projects") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({
        items: [{ projectId: "server-project", name: "Вариант A", projectName: "Серверный вариант", enterpriseId: "enterprise-alpha", version: 4, updatedAt: "2026-07-12T00:00:00Z" }],
        totalItems: 1,
      }) });
    }
    return route.fulfill({ contentType: "application/json", body: JSON.stringify(backendProject()) });
  });
  await page.route("**/api/v1/projects/cost?id=server-project", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(backendReport().estimate) }),
  );
  await page.route("**/api/v1/projects/report?id=server-project*", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(backendReport()) }),
  );
  await page.route("**/api/v1/projects/budget?id=server-project", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(backendBudget()) }),
  );

  await page.goto(`${baseUrl}/workspace`);
  await page.getByRole("button", { name: /Вариант A/ }).click();
  await expect(page).toHaveURL(/\/prototype/, { timeout: 15_000 });
  await page.getByRole("link", { name: "Калькулятор" }).click();

  await expect(page.getByText("Серверный расчёт", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Открыть отчёт" })).toBeVisible();
});

test("report route renders server report and print action", async ({ page }) => {
  await page.route("**/api/v1/projects/report?id=server-project*", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(backendReport()) }),
  );
  await page.goto(`${baseUrl}/report?id=server-project`);

  await expect(page.getByRole("heading", { name: "Отчёт по проекту Серверный вариант" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Печать / сохранить PDF" })).toBeVisible();
});

test("version conflict offers server reload or a separate variant", async ({ page }) => {
  await page.route("**/api/defense/projects**", (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const pathname = url.pathname.replace(/\/+$/, "");
    if (method === "GET" && pathname === "/api/defense/projects") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [{ projectId: "server-project", name: "Вариант A", projectName: "Серверный вариант", enterpriseId: "enterprise-alpha", version: 4, updatedAt: "2026-07-12T00:00:00Z" }], totalItems: 1 }) });
    }
    if (method === "GET" && pathname === "/api/defense/projects/server-project") {
      return route.fulfill({ contentType: "application/json", body: JSON.stringify(backendProject()) });
    }
    if (method === "PUT") {
      return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "version_conflict", message: "stale version" } }) });
    }
    return route.fallback();
  });
  await page.goto(`${baseUrl}/workspace`);
  await page.getByRole("button", { name: /Вариант A/ }).click();
  await expect(page).toHaveURL(/\/prototype/, { timeout: 15_000 });
  await page.getByRole("button", { name: "Сохранить текущий вариант" }).click();
  await expect(page.getByRole("status")).toContainText("Конфликт версии");
  await page.getByTitle("Открыть варианты конфигурации").click();
  await expect(page.getByRole("button", { name: "Загрузить серверную версию" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Сохранить как новый вариант" })).toBeVisible();
});

test("workspace comparison renders structural and echelon deltas", async ({ page }) => {
  await page.route("**/api/defense/projects", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ items: [
      { projectId: "a", name: "Вариант A", projectName: "Вариант A", enterpriseId: "enterprise-alpha", version: 1, updatedAt: "2026-07-12T00:00:00Z" },
      { projectId: "b", name: "Вариант B", projectName: "Вариант B", enterpriseId: "enterprise-alpha", version: 1, updatedAt: "2026-07-12T00:00:00Z" },
    ], totalItems: 2 }) }),
  );
  await page.route("**/api/v1/projects/compare?id1=a&id2=b", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({
      projectA: { projectId: "a", projectName: "Вариант A", structuralProfile: { objectCount: 1, unitCount: 1, echelonCount: 1, categoryCount: 1, conflictCount: 1, coveredObjCount: 1, totalMln: 10, byEchelon: [] }, costCalculation: { totalMln: 10, byEchelon: [], byType: [], byObject: [] } },
      projectB: { projectId: "b", projectName: "Вариант B", structuralProfile: { objectCount: 2, unitCount: 2, echelonCount: 1, categoryCount: 1, conflictCount: 0, coveredObjCount: 2, totalMln: 20, byEchelon: [] }, costCalculation: { totalMln: 20, byEchelon: [], byType: [], byObject: [] } },
      diff: { objectCountDelta: 1, unitCountDelta: 1, echelonCountDelta: 0, categoryCountDelta: 0, conflictCountDelta: -1, coveredObjCountDelta: 1, costDeltaMln: 10, byEchelon: [{ layerId: "l5", layerCode: "L5", layerName: "Огневое поражение", objectCountDelta: 1, unitCountDelta: 1, categoryCountDelta: 0, conflictCountDelta: -1, coveredObjDelta: 1 }] },
    }) }),
  );
  await page.goto(`${baseUrl}/workspace`);
  await page.locator("select").nth(0).selectOption("a");
  await page.locator("select").nth(1).selectOption("b");
  await page.getByRole("button", { name: "Сравнить" }).click();
  await expect(page.getByRole("heading", { name: "Результат A/B сравнения" })).toBeVisible();
  await expect(page.getByText("L5 · Огневое поражение")).toBeVisible();
});
