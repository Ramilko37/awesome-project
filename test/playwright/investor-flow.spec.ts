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

test("local draft exposes an explicit dirty server-sync state", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto(`${baseUrl}/prototype`);

  await expect(page.getByRole("status")).toContainText("Есть изменения");
});

test("backend calculator error never substitutes local financial figures", async ({ page }) => {
  await page.route("**/api/v1/projects/cost?id=server-project", (route) =>
    route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "offline" }) }),
  );
  await page.route("**/api/v1/projects/report?id=server-project&hideCost=false", (route) =>
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
