import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.FORTIS_OVERLAYS_E2E_PORT ?? 3421);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "fortis-overlays.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec storybook dev --ci --host 127.0.0.1 --port ${port}`,
    url: `${baseURL}/iframe.html?id=components-overlays--review-harness&viewMode=story`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
