import { readFileSync } from "node:fs";

const toolIconSource = readFileSync("src/modules/drone-defense/ui/defense-tool-icon.tsx", "utf8");
const prototypeSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
const mogEditorSource = readFileSync("src/modules/drone-defense/ui/mog-composition-editor.tsx", "utf8");
const sitePageSource = readFileSync("src/app/(dashboard)/dashboard/sites/[id]/page.tsx", "utf8");
const retrospectiveSource = readFileSync("src/modules/drone-defense/ui/retrospective-analysis.tsx", "utf8");
const overlaysSource = readFileSync("src/shared/ui/fortis/overlays.tsx", "utf8");
const projectRouteSource = readFileSync("src/app/api/defense/projects/[id]/route.ts", "utf8");
const backendProxySource = readFileSync("src/modules/drone-defense/infra/backend-proxy.ts", "utf8");
const seedBackendSource = readFileSync("src/modules/drone-defense/infra/seed-backend-asset-library.ts", "utf8");
const assetManagerSource = readFileSync("src/modules/drone-defense/ui/asset-library-manager.tsx", "utf8");
const homePageSource = readFileSync("src/app/page.tsx", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function functionBody(source, name) {
  const start = source.indexOf(`const ${name} =`);
  assert(start >= 0, `Expected ${name} to exist`);

  const bodyStart = source.indexOf("{", start);
  assert(bodyStart >= 0, `Expected ${name} to have a function body`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      return source.slice(bodyStart, index + 1);
    }
  }

  throw new Error(`Could not parse ${name} body`);
}

assert(
  !toolIconSource.includes("infoRef.current ="),
  "DefenseToolIcon must not mutate ref.current during render",
);
assert(
  toolIconSource.includes('removeEventListener("pointermove", onMove, true)'),
  "DefenseToolIcon pointermove cleanup must use the same capture flag as addEventListener",
);
assert(
  toolIconSource.includes('removeEventListener("pointerup", onEnd, true)'),
  "DefenseToolIcon pointerup cleanup must use the same capture flag as addEventListener",
);
assert(
  toolIconSource.includes('removeEventListener("pointercancel", onEnd, true)'),
  "DefenseToolIcon must clean up pointercancel listeners",
);

assert(
  sitePageSource.includes("params: Promise<{ id: string }>") && sitePageSource.includes("const { id } = await params"),
  "Next.js app page params must be awaited before reading id",
);

const addPolygonDraftPointBody = functionBody(prototypeSource, "addPolygonDraftPoint");
assert(
  !addPolygonDraftPointBody.includes("setLayerWizardState((current)"),
  "addPolygonDraftPoint must keep state updates pure and set messages outside updater callbacks",
);

const toggleObjectVisibilityModeBody = functionBody(prototypeSource, "toggleObjectVisibilityMode");
assert(
  !toggleObjectVisibilityModeBody.includes("setShowAllEchelonObjects((current)"),
  "toggleObjectVisibilityMode must keep state updates pure and set messages outside updater callbacks",
);

const applyDraftBody = functionBody(mogEditorSource, "applyDraft");
assert(
  !applyDraftBody.includes("setDraft((current)"),
  "MogCompositionEditor applyDraft must not run side effects inside setDraft updater callbacks",
);

assert(
  !retrospectiveSource.includes("key={`${eventType}-${index}`"),
  "Retrospective timeline markers must use stable event type keys instead of array indexes",
);
assert(
  !overlaysSource.includes("key={item.id ?? index}"),
  "DropdownMenu items must use stable keys instead of falling back to array indexes",
);
assert(
  projectRouteSource.includes("const [{ id }, body] = await Promise.all([params, request.text()])"),
  "Project PUT route must await independent params/body reads in parallel",
);
assert(
  backendProxySource.includes("if (!response.ok)") &&
    backendProxySource.indexOf("if (!response.ok)") < backendProxySource.indexOf("const text = await response.text()"),
  "backendFetch must check response.ok before consuming the response body",
);
assert(
  seedBackendSource.includes("if (!response.ok)") &&
    seedBackendSource.indexOf("if (!response.ok)") < seedBackendSource.indexOf("const bodyText = await response.text()"),
  "seed backend readJson must check response.ok before consuming the response body",
);
assert(
  seedBackendSource.includes("await Promise.all(") && !seedBackendSource.includes("for (const payload of missingPayloads)"),
  "seedBackendPublicAssetLibrary must seed independent missing payloads in parallel",
);
assert(
  assetManagerSource.includes(".finally(() => {") && !assetManagerSource.includes("        setDocumentsLoading(false);\n      })\n      .catch"),
  "Asset document loading must reset loading state in finally",
);
assert(
  homePageSource.includes('import Link from "next/link"') &&
    homePageSource.includes("<Link") &&
    !homePageSource.includes('href="/prototype"\n              className="flex items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-6 py-3 text-[14px] font-semibold text-white transition-all'),
  "Home page internal navigation must use Next Link and avoid transition-all",
);
