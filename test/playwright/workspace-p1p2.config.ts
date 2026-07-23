import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.FORTIS_WORKSPACE_P1P2_E2E_PORT ?? 3420);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  testMatch: "workspace-p1p2.spec.ts",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm dev --hostname 127.0.0.1 --port ${port}`,
    env: {
      FORTIS_NEXT_DIST_DIR: ".next/e2e-workspace-p1p2",
    },
    url: `${baseURL}/prototype`,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
