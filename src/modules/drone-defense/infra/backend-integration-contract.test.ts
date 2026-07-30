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
import { saveVariantAsNew } from "@/modules/drone-defense/infra/api-client";
import { getBackendApiBaseUrl } from "@/modules/drone-defense/infra/backend-proxy";
import type { DefenseProject } from "@/shared/types/defense-project";

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
  await saveVariantAsNew({
    name: "Local draft",
    project: {
      schemaVersion: 1,
      projectId: "current",
      projectName: "Local draft",
      baseObject: { id: "obj-1", name: "Object Alpha", center: { lat: 55.75, lng: 37.62 } },
      layers: [],
      assetLibrary: [],
      placedObjects: [],
      mode: "view",
      source: "custom",
      updatedAt: "2026-07-28T07:50:00.000Z",
    } as DefenseProject,
  });

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
  assert(String(calls[6]?.input) === "/api/defense/projects", "variant save must use frontend project BFF");
  const localDraftPayload = JSON.parse(String(calls[6]?.init?.body)) as { enterpriseId?: string; projectJson?: string };
  assert(
    !("enterpriseId" in localDraftPayload),
    "variant save must omit local non-UUID baseObject id from backend enterpriseId",
  );
  assert(typeof localDraftPayload.projectJson === "string", "variant save must still send full projectJson");

  delete process.env.BACKEND_URL;
  delete process.env.FORTIS_API_BASE_URL;
  delete process.env.NEXT_PUBLIC_FORTIS_API_BASE_URL;
  assert(
    getBackendApiBaseUrl() === "http://85.208.87.187/api/v1",
    "backend proxy must use the Fortis dev VM by default",
  );
  process.env.FORTIS_API_BASE_URL = "http://backend:8090";
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
    !proxySource.includes("FORTIS_AUTH_ENABLED"),
    "prototype auth guard must no longer be disabled by an env flag",
  );
  assert(
    proxySource.includes('const protectedRoutes = ["/prototype"]'),
    "proxy must guard prototype by default",
  );
  assert(proxySource.includes("access-token"), "proxy must check access-token cookie");
  assert(proxySource.includes("/prototype/:path*"), "proxy must guard /prototype");
  assert(!proxySource.includes("/calculator/:path*"), "calculator must not be pulled into the prototype auth change");
  assert(proxySource.includes("/login"), "proxy must redirect to login");

  const loginSource = readFileSync("src/app/api/auth/login/route.ts", "utf8");
  assert(loginSource.includes("HttpOnly"), "login route must write HttpOnly cookie");
  assert(!loginSource.includes("localStorage"), "login route must not use localStorage");
  assert(readFileSync("src/modules/auth/ui/login-page.tsx", "utf8").includes("Вход в систему"), "login page must be localized");

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
  assert(
    assetLibraryManagerSource.includes("const SHOW_ASSET_DOCUMENTS_IN_DEMO = false") &&
    assetLibraryManagerSource.includes("SHOW_ASSET_DOCUMENTS_IN_DEMO && selectedAsset"),
    "asset library documents integration must stay hidden in the current /prototype demo",
  );
  const assetLibraryApiSource = readFileSync("src/modules/drone-defense/infra/asset-library-api.ts", "utf8");
  assert(
    assetLibraryApiSource.includes("/api/defense/assets"),
    "asset library reads must use the auth-aware frontend BFF instead of direct /api/v1 rewrite",
  );
  const assetRouteSource = readFileSync("src/app/api/defense/assets/route.ts", "utf8");
  assert(assetRouteSource.includes("backendFetch"), "asset BFF route must forward requests through backendFetch");
  assert(
    assetRouteSource.includes("normalizeDefenseAssetPayload") && assetRouteSource.includes("defenseAssetLibrary"),
    "asset BFF route must normalize backend assets and keep a local fallback for demo",
  );
  const prototypeSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
  assert(
    prototypeSource.includes("resolvePrototypeDemoPresetId") &&
      prototypeSource.includes("createPrototypeDemoProject") &&
      prototypeSource.includes("demoPresetId ? null : variantError"),
    "prototype demo-state must be an in-page preset bootstrap that does not leak backend variant errors into visual checks",
  );
  assert(
    prototypeSource.includes("if (bootstrapKeyRef.current === bootstrapKey) bootstrapKeyRef.current = null"),
    "prototype bootstrap cleanup must allow React Strict Mode remount to enable backend saves",
  );
  assert(
    prototypeSource.includes("useDefenseProjectStore.subscribe") &&
      prototypeSource.includes("useDefenseVariantsStore.subscribe") &&
      prototypeSource.includes("overwriteActiveVariant"),
    "prototype autosave must subscribe to project/variant store changes and call overwriteActiveVariant",
  );
  assert(
    prototypeSource.includes("showProjectPanel={false}") &&
      !prototypeSource.includes("projectControls={") &&
      !prototypeSource.includes("mt-3 hidden lg:block"),
    "prototype must suppress the duplicate map project card in the map-first shell",
  );
  const gisBoardSource = readFileSync("src/modules/drone-defense/ui/gis-board.tsx", "utf8");
  assert(
    gisBoardSource.includes("projectControls?: ReactNode") &&
      gisBoardSource.includes("showProjectPanel?: boolean") &&
      gisBoardSource.includes("{projectControls}") &&
      gisBoardSource.includes("onPointerDown={(event) => event.stopPropagation()}"),
    "GIS board project card must remain available for non-prototype contexts",
  );

  console.log("backend-integration-contract.test.ts: contracts passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
