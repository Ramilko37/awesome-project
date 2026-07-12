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

test("report route renders server report and print action", async ({ page }) => {
  await page.route("**/api/v1/projects/report?id=server-project*", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(backendReport()) }),
  );
  await page.goto(`${baseUrl}/report?id=server-project`);

  await expect(page.getByRole("heading", { name: "Отчёт по проекту Серверный вариант" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Печать / сохранить PDF" })).toBeVisible();
});
