import { expect, test } from "@playwright/test";

test.describe("local backend persistence smoke", () => {
  test.skip(
    process.env.RUN_LOCAL_BACKEND_SMOKE !== "1",
    "Requires the local Go API and PostgreSQL on the developer machine.",
  );

  test("registers, saves the current map through the BFF, and removes the smoke project", async ({ page }) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const variantName = `GIS UX local smoke ${suffix}`;
    let savedProjectId: string | undefined;
    const credentials = {
      email: "gis-ux-smoke@local.test",
      password: "LocalSmoke123!",
    };

    const registerResponse = await page.context().request.post(
      "http://127.0.0.1:3000/api/auth/register",
      {
        data: {
          ...credentials,
          name: "GIS UX smoke",
        },
      },
    );
    if (registerResponse.status() === 409) {
      const loginResponse = await page.context().request.post(
        "http://127.0.0.1:3000/api/auth/login",
        { data: credentials },
      );
      expect(loginResponse.ok()).toBeTruthy();
    } else {
      expect(registerResponse.ok()).toBeTruthy();
    }

    try {
      await page.goto("http://127.0.0.1:3000/prototype");
      await page.getByRole("heading", { name: "Моя карта" }).waitFor();
      await page.getByRole("button", { name: "Сохранить карту как новый вариант" }).click();

      const dialog = page.getByRole("dialog", { name: "Варианты конфигурации" });
      await dialog.getByPlaceholder("Имя нового варианта…").fill(variantName);

      const saveResponsePromise = page.waitForResponse(
        (response) => response.url().endsWith("/api/defense/projects") && response.request().method() === "POST",
      );
      await dialog.getByRole("button", { name: "Сохранить как новый" }).click();
      const saveResponse = await saveResponsePromise;
      expect(saveResponse.ok()).toBeTruthy();

      const savedProject = (await saveResponse.json()) as { projectId: string };
      savedProjectId = savedProject.projectId;
      expect(savedProjectId).toBeTruthy();
      await expect(
        page
          .getByRole("button", { name: new RegExp(`${variantName} · Сохранено`) })
          .filter({ visible: true }),
      ).toBeVisible();
    } finally {
      if (savedProjectId) {
        const deleteResponse = await page.context().request.delete(
          `http://127.0.0.1:3000/api/defense/projects/${encodeURIComponent(savedProjectId)}`,
        );
        expect(deleteResponse.ok()).toBeTruthy();
      }
    }
  });
});
