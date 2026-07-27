// Run: pnpm exec tsx src/modules/drone-defense/infra/asset-api-proxy-contract.test.ts

import nextConfig from "../../../../next.config";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

type RewriteRule = {
  source: string;
  destination: string;
};

async function readRewriteRules(): Promise<RewriteRule[]> {
  assert(typeof nextConfig.rewrites === "function", "next.config must define rewrites for backend API proxy");
  const rewrites = await nextConfig.rewrites();
  if (Array.isArray(rewrites)) return rewrites as RewriteRule[];
  return [
    ...(rewrites.beforeFiles ?? []),
    ...(rewrites.afterFiles ?? []),
    ...(rewrites.fallback ?? []),
  ] as RewriteRule[];
}

async function runProxyContract() {
  const rules = await readRewriteRules();

  assert(
    nextConfig.skipTrailingSlashRedirect === true,
    "Next config must disable automatic trailing slash redirects for backend API routes",
  );

  assert(
    rules.some((rule) => rule.source === "/api/v1/:path*" && rule.destination === "http://localhost:8090/api/v1/:path*"),
    "all same-origin /api/v1 paths must proxy to the backend, including endpoints added after deploy",
  );
}

runProxyContract()
  .then(() => {
    console.log("asset-api-proxy-contract.test.ts: Next asset API proxy contract passed");
  })
  .catch((error) => {
    throw error;
  });
