// Run: pnpm exec tsx src/modules/drone-defense/infra/backend-integration-contract.test.ts

import { readFileSync } from "node:fs";
import { buildAssetDocumentDownloadUrl, buildAssetDocumentsListUrl } from "@/modules/drone-defense/infra/asset-documents-api";
import {
  compareBackendProjects,
  checkBackendProjectBudget,
  getBackendProjectCost,
  getBackendProjectReport,
  getBackendBudgetConfig,
  updateBackendBudgetConfig,
} from "@/modules/defense-calculator/infra/backend-project-api";
import { getBackendApiBaseUrl } from "@/modules/drone-defense/infra/backend-proxy";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
Object.defineProperty(globalThis, "fetch", {
  value: async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  },
  configurable: true,
  writable: true,
});

async function main() {
  assert(
    buildAssetDocumentsListUrl("asset-1") === "/api/v1/assets/documents/list?assetId=asset-1",
    "documents list URL must target backend documents API",
  );
  assert(
    buildAssetDocumentDownloadUrl("doc-1") === "/api/v1/assets/documents/download?id=doc-1",
    "documents download URL must target backend documents API",
  );

  await getBackendProjectCost("proj-1");
  await getBackendProjectReport("proj-1", { hideCost: true });
  await compareBackendProjects("proj-1", "proj-2");
  await getBackendBudgetConfig("proj-1");
  await updateBackendBudgetConfig("proj-1", { budgetMode: "limited", budgetAmountMln: 9300 });
  await checkBackendProjectBudget("proj-1", { assetId: "asset-1", quantity: 2, echelonId: "layer-1" });

  assert(String(calls[0]?.input) === "/api/v1/projects/cost?id=proj-1", "cost helper must call /projects/cost");
  assert(
    String(calls[1]?.input) === "/api/v1/projects/report?id=proj-1&hideCost=true",
    "report helper must call /projects/report with hideCost",
  );
  assert(
    String(calls[2]?.input) === "/api/v1/projects/compare?id1=proj-1&id2=proj-2",
    "compare helper must call /projects/compare",
  );
  assert(String(calls[3]?.input) === "/api/v1/projects/budget?id=proj-1", "budget helper must call /projects/budget");
  assert(String(calls[4]?.input) === "/api/v1/projects/budget?id=proj-1", "budget update helper must call /projects/budget");
  assert(calls[4]?.init?.method === "PUT", "budget update helper must use PUT");
  assert(
    String(calls[5]?.input) === "/api/v1/projects/budget/check?id=proj-1",
    "budget check helper must call /projects/budget/check",
  );
  assert(calls[5]?.init?.method === "POST", "budget check helper must use POST");

  process.env.FORTIS_API_BASE_URL = "http://backend:8090";
  delete process.env.BACKEND_URL;
  assert(
    getBackendApiBaseUrl() === "http://backend:8090/api/v1",
    "backend proxy must use FORTIS_API_BASE_URL in Docker deployments",
  );
  process.env.BACKEND_URL = "http://backend:8090/api/v1";
  assert(
    getBackendApiBaseUrl() === "http://backend:8090/api/v1",
    "backend proxy must keep explicit BACKEND_URL support",
  );

  const proxySource = readFileSync("src/proxy.ts", "utf8");
  assert(
    proxySource.includes("FORTIS_AUTH_ENABLED"),
    "proxy auth guard must be feature-flagged while backend auth is not deployed",
  );
  assert(
    proxySource.includes("authGuardEnabled"),
    "proxy must keep protected routes open by default unless auth guard is enabled",
  );
  assert(proxySource.includes("access-token"), "proxy must check access-token cookie");
  assert(proxySource.includes("/prototype/:path*"), "proxy must still be able to guard /prototype when enabled");
  assert(proxySource.includes("/calculator/:path*"), "proxy must still be able to guard /calculator when enabled");
  assert(proxySource.includes("/login"), "proxy must redirect to login");

  const loginSource = readFileSync("src/app/api/auth/login/route.ts", "utf8");
  assert(loginSource.includes("HttpOnly"), "login route must write HttpOnly cookie");
  assert(!loginSource.includes("localStorage"), "login route must not use localStorage");

  const defenseStudioShellSource = readFileSync("src/modules/drone-defense/ui/defense-studio-shell.tsx", "utf8");
  assert(
    !defenseStudioShellSource.includes("Проект не выбран"),
    "prototype shell must not show backend project warning while auth/backend flow is opt-in",
  );
  const assetLibraryManagerSource = readFileSync("src/modules/drone-defense/ui/asset-library-manager.tsx", "utf8");
  assert(
    assetLibraryManagerSource.includes("Не удалось загрузить документы"),
    "asset library manager must expose backend-backed documents UI",
  );
  assert(
    assetLibraryManagerSource.includes("createAssetDocument"),
    "asset library manager must create document metadata through backend API",
  );

  console.log("backend-integration-contract.test.ts: contracts passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
