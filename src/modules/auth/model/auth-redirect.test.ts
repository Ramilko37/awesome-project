// Run: pnpm exec tsx src/modules/auth/model/auth-redirect.test.ts

import { resolveAuthRedirect } from "@/modules/auth/model/auth-redirect";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(resolveAuthRedirect(null) === "/workspace", "missing redirect must fall back to workspace");
assert(resolveAuthRedirect("") === "/workspace", "empty redirect must fall back to workspace");
assert(resolveAuthRedirect("/workspace") === "/workspace", "workspace redirect must be allowed");
assert(
  resolveAuthRedirect("/prototype?project=abc#map") === "/prototype?project=abc#map",
  "prototype redirect must preserve query and hash",
);
assert(resolveAuthRedirect("/calculator/report") === "/calculator/report", "calculator subpath must be allowed");
assert(resolveAuthRedirect("https://evil.example/workspace") === "/workspace", "absolute external URL must be rejected");
assert(resolveAuthRedirect("//evil.example/workspace") === "/workspace", "protocol-relative URL must be rejected");
assert(resolveAuthRedirect("/\\evil.example") === "/workspace", "backslash URL confusion must be rejected");
assert(resolveAuthRedirect("/admin") === "/workspace", "unprotected local path must be rejected");
assert(resolveAuthRedirect("/workspace.evil") === "/workspace", "prefix lookalike path must be rejected");

console.log("auth-redirect.test.ts: redirects passed");
