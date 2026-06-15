// Run: pnpm exec tsx src/modules/drone-defense/infra/backend-integration-contract.test.ts

import { readFileSync } from "node:fs";
import { buildAssetDocumentDownloadUrl, buildAssetDocumentsListUrl } from "@/modules/drone-defense/infra/asset-documents-api";
import {
  compareBackendProjects,
  getBackendProjectCost,
  getBackendProjectReport,
} from "@/modules/defense-calculator/infra/backend-project-api";

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

  assert(String(calls[0]?.input) === "/api/v1/projects/cost?id=proj-1", "cost helper must call /projects/cost");
  assert(
    String(calls[1]?.input) === "/api/v1/projects/report?id=proj-1&hideCost=true",
    "report helper must call /projects/report with hideCost",
  );
  assert(
    String(calls[2]?.input) === "/api/v1/projects/compare?id1=proj-1&id2=proj-2",
    "compare helper must call /projects/compare",
  );

  const proxySource = readFileSync("src/proxy.ts", "utf8");
  assert(proxySource.includes("access-token"), "proxy must check access-token cookie");
  assert(proxySource.includes("/prototype/:path*"), "proxy must protect /prototype");
  assert(proxySource.includes("/calculator/:path*"), "proxy must protect /calculator");
  assert(proxySource.includes("/login"), "proxy must redirect to login");

  const loginSource = readFileSync("src/app/api/auth/login/route.ts", "utf8");
  assert(loginSource.includes("HttpOnly"), "login route must write HttpOnly cookie");
  assert(!loginSource.includes("localStorage"), "login route must not use localStorage");

  console.log("backend-integration-contract.test.ts: contracts passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
