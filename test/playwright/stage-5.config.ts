import { defineConfig, devices } from "@playwright/test";
import { join } from "node:path";

const port = Number(process.env.FORTIS_STAGE_5_E2E_PORT ?? 3421);
const baseURL = `http://127.0.0.1:${port}`;
const artifactRoot = join(process.cwd(), "output/playwright/stage-5-767b692");

export default defineConfig({
  testDir: ".",
  testMatch: "stage-5.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: [
    ["line"],
    ["json", { outputFile: join(artifactRoot, "results.json") }],
  ],
  outputDir: join(artifactRoot, "test-results"),
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    colorScheme: "light",
    locale: "ru-RU",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm dev --hostname 127.0.0.1 --port ${port}`,
    env: {
      FORTIS_NEXT_DIST_DIR: ".next/e2e-asset-library",
    },
    url: `${baseURL}/prototype`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
