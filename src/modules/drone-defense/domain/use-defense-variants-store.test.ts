// Run: npx tsx src/modules/drone-defense/domain/use-defense-variants-store.test.ts

import { useDefenseVariantsStore } from "@/modules/drone-defense/domain/use-defense-variants-store";
import { readRecoveryDraft, serializeProjectForSync } from "@/modules/drone-defense/domain/project-sync";
import { useDefenseProjectStore } from "@/shared/lib/use-defense-project-store";
import type { DefenseProject, VariantSummary } from "@/shared/types/defense-project";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// ── localStorage stub (project store persists on replace) ────────────────────
const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  },
  configurable: true,
});

// ── fetch stub ───────────────────────────────────────────────────────────────
// Shaped like the real Response: readJson() does `await fetch(...)`, checks
// `response.ok`, then `await response.json()`.
type FetchResult = { ok: boolean; status: number; data: unknown };
type FetchCall = { method: string; url: string; body?: unknown };
const fetchCalls: FetchCall[] = [];

// Reassign this per case. Receives (method, url) so a single handler can serve
// both the primary request and the fetchVariants() refresh that follows.
let fetchHandler: (method: string, url: string) => FetchResult = () => ({
  ok: true,
  status: 200,
  data: {},
});

Object.defineProperty(globalThis, "fetch", {
  value: async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    fetchCalls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const result = fetchHandler(method, url);
    return {
      ok: result.ok,
      status: result.status,
      json: async () => result.data,
      text: async () => JSON.stringify(result.data),
    };
  },
  configurable: true,
  writable: true,
});

function resetStore(): void {
  fetchCalls.length = 0;
  useDefenseVariantsStore.setState(useDefenseVariantsStore.getInitialState(), true);
  useDefenseProjectStore.setState(useDefenseProjectStore.getInitialState(), true);
}

function summary(overrides: Partial<VariantSummary> = {}): VariantSummary {
  return {
    projectId: "A",
    name: "name-A",
    projectName: "proj-A",
    version: 1,
    updatedAt: "2026-06-12T14:00:00.000Z",
    ...overrides,
  };
}

function minimalProject(id: string): DefenseProject {
  return {
    schemaVersion: 1,
    projectId: id,
    projectName: `proj-${id}`,
    version: 7,
    baseObject: { id: "o1", name: "Obj", center: { lat: 55.75, lng: 37.61 } },
    layers: [],
    assetLibrary: [],
    placedObjects: [],
    mode: "view",
    updatedAt: "2026-06-12T14:00:00.000Z",
  };
}

async function main() {
  // 1. fetchVariants() populates list and ends idle.
  resetStore();
  fetchHandler = () => ({ ok: true, status: 200, data: { items: [summary()], totalItems: 1 } });
  await useDefenseVariantsStore.getState().fetchVariants();
  assert(useDefenseVariantsStore.getState().variants.length === 1, "fetchVariants must load one variant");
  assert(useDefenseVariantsStore.getState().listStatus === "idle", "fetchVariants must end with listStatus idle");
  console.log("fetchVariants: OK");

  // 2. saveAsNewVariant sets active identity (and refreshes the list).
  resetStore();
  useDefenseProjectStore.getState().replaceProject(minimalProject("draft-from-server"));
  fetchHandler = (method) => {
    if (method === "POST") {
      return { ok: true, status: 200, data: summary({ projectId: "A", name: "name-A" }) };
    }
    // subsequent GET fetchVariants refresh
    return { ok: true, status: 200, data: { items: [summary()], totalItems: 1 } };
  };
  await useDefenseVariantsStore.getState().saveAsNewVariant("name-A");
  assert(useDefenseVariantsStore.getState().activeVariantId === "A", "saveAsNewVariant must set activeVariantId");
  assert(useDefenseVariantsStore.getState().activeVariantName === "name-A", "saveAsNewVariant must set activeVariantName");
  assert(useDefenseVariantsStore.getState().saveStatus === "idle", "saveAsNewVariant success must leave saveStatus idle");
  const createCall = fetchCalls.find((call) => call.method === "POST");
  assert(Boolean(createCall), "saveAsNewVariant must call POST");
  assert(
    !("version" in (createCall?.body as Record<string, unknown>)),
    "new variants must not inherit an optimistic-lock version",
  );
  console.log("saveAsNewVariant: OK");

  // 3. loadVariant replaces the project and sets active id.
  resetStore();
  fetchHandler = () => ({ ok: true, status: 200, data: minimalProject("B") });
  await useDefenseVariantsStore.getState().loadVariant("B");
  assert(useDefenseProjectStore.getState().project.projectId === "B", "loadVariant must replace project to B");
  assert(useDefenseVariantsStore.getState().activeVariantId === "B", "loadVariant must set activeVariantId to B");
  console.log("loadVariant: OK");

  // 4. deleteVariant of the active variant clears the active id.
  resetStore();
  useDefenseVariantsStore.setState({ activeVariantId: "B", activeVariantName: "name-B" });
  fetchHandler = (method) => {
    if (method === "DELETE") return { ok: true, status: 200, data: { status: "ok" } };
    return { ok: true, status: 200, data: { items: [], totalItems: 0 } };
  };
  await useDefenseVariantsStore.getState().deleteVariant("B");
  assert(useDefenseVariantsStore.getState().activeVariantId === null, "deleteVariant must clear active id when deleting active");
  console.log("deleteVariant: OK");

  // 5. save failure surfaces an error.
  resetStore();
  fetchHandler = () => ({ ok: false, status: 500, data: { message: "boom" } });
  await useDefenseVariantsStore.getState().saveAsNewVariant("x");
  assert(useDefenseVariantsStore.getState().saveStatus === "error", "save failure must set saveStatus error");
  assert(Boolean(useDefenseVariantsStore.getState().error), "save failure must set a truthy error");
  console.log("saveAsNewVariant failure: OK");

  // 6. overwriteActiveVariant sends the known optimistic-lock version.
  resetStore();
  useDefenseProjectStore.getState().replaceProject(minimalProject("C"));
  useDefenseVariantsStore.setState({ activeVariantId: "C", activeVariantName: "name-C" });
  fetchHandler = (method) => {
    if (method === "PUT") {
      return { ok: true, status: 200, data: summary({ projectId: "C", name: "name-C", version: 8 }) };
    }
    return { ok: true, status: 200, data: { items: [summary({ projectId: "C", name: "name-C", version: 8 })], totalItems: 1 } };
  };
  await useDefenseVariantsStore.getState().overwriteActiveVariant();
  const updateCall = fetchCalls.find((call) => call.method === "PUT");
  assert(Boolean(updateCall), "overwriteActiveVariant must call PUT");
  assert((updateCall?.body as { version?: number }).version === 7, "overwriteActiveVariant must send project.version");
  assert(useDefenseProjectStore.getState().project.version === 8, "overwrite success must update project.version");
  console.log("overwriteActiveVariant version: OK");

  // 7. 409 Conflict becomes a user-visible conflict state.
  resetStore();
  useDefenseProjectStore.getState().replaceProject(minimalProject("D"));
  useDefenseVariantsStore.setState({ activeVariantId: "D", activeVariantName: "name-D" });
  fetchHandler = () => ({
    ok: false,
    status: 409,
    data: { error: { code: "version_conflict", message: "version conflict" } },
  });
  await useDefenseVariantsStore.getState().overwriteActiveVariant();
  assert(useDefenseVariantsStore.getState().saveStatus === "error", "409 must keep saveStatus error");
  assert(useDefenseVariantsStore.getState().conflictState?.projectId === "D", "409 must expose conflict project id");
  assert(
    useDefenseVariantsStore.getState().error?.includes("перезагруз"),
    "409 must tell the user to reload the current version",
  );
  console.log("overwriteActiveVariant conflict: OK");

  // 8. A backend project keeps a recovery draft through a conflict and can become a new clean variant.
  resetStore();
  const backendProject = { ...minimalProject("E"), source: "backend" as const };
  useDefenseProjectStore.getState().replaceProject(backendProject);
  useDefenseVariantsStore.setState({
    activeVariantId: "E",
    activeVariantName: "name-E",
    canonicalSnapshot: serializeProjectForSync(backendProject),
    syncStatus: "clean",
  });
  useDefenseProjectStore.getState().replaceProject({
    ...backendProject,
    projectName: "локальная правка",
    updatedAt: "2026-07-12T01:00:00.000Z",
  });
  assert(useDefenseVariantsStore.getState().syncStatus === "dirty", "local project changes must become dirty");
  assert(readRecoveryDraft(globalThis.localStorage, "E")?.project.projectName === "локальная правка", "dirty project must be recoverable");

  fetchHandler = (method) => {
    if (method === "PUT") return { ok: false, status: 409, data: { error: { code: "version_conflict", message: "stale" } } };
    return { ok: true, status: 200, data: { items: [], totalItems: 0 } };
  };
  await useDefenseVariantsStore.getState().overwriteActiveVariant();
  assert(useDefenseVariantsStore.getState().syncStatus === "conflict", "409 must become conflict state");

  fetchHandler = (method) => {
    if (method === "POST") return { ok: true, status: 200, data: summary({ projectId: "F", name: "name-F", version: 1 }) };
    return { ok: true, status: 200, data: { items: [summary({ projectId: "F", name: "name-F", version: 1 })], totalItems: 1 } };
  };
  await useDefenseVariantsStore.getState().saveConflictAsNewVariant("name-F");
  assert(useDefenseVariantsStore.getState().activeVariantId === "F", "conflict copy must become active variant");
  assert(useDefenseProjectStore.getState().project.version === 1, "conflict copy must receive its new server version");
  assert(useDefenseVariantsStore.getState().syncStatus === "clean", "successfully copied conflict must be clean");
  assert(readRecoveryDraft(globalThis.localStorage, "E") === null, "resolved conflict must clear its recovery draft");
  console.log("project sync lifecycle: OK");

  // 9. Retrying an error reuses the current server variant, while loading server wins over a conflicted draft.
  resetStore();
  const retryProject = { ...minimalProject("G"), source: "backend" as const };
  useDefenseProjectStore.getState().replaceProject(retryProject);
  useDefenseVariantsStore.setState({
    activeVariantId: "G",
    activeVariantName: "name-G",
    canonicalSnapshot: serializeProjectForSync(retryProject),
    syncStatus: "clean",
  });
  useDefenseProjectStore.getState().replaceProject({ ...retryProject, projectName: "нужно повторить" });
  let updateAttempts = 0;
  fetchHandler = (method) => {
    if (method === "PUT") {
      updateAttempts += 1;
      return updateAttempts === 1
        ? { ok: false, status: 503, data: { message: "offline" } }
        : { ok: true, status: 200, data: summary({ projectId: "G", name: "name-G", version: 8 }) };
    }
    return { ok: true, status: 200, data: { items: [summary({ projectId: "G", name: "name-G", version: 8 })], totalItems: 1 } };
  };
  await useDefenseVariantsStore.getState().overwriteActiveVariant();
  assert(useDefenseVariantsStore.getState().syncStatus === "error", "transport error must be retryable");
  await useDefenseVariantsStore.getState().retrySave();
  assert(updateAttempts === 2, "retrySave must issue the update again");
  assert(useDefenseVariantsStore.getState().syncStatus === "clean", "successful retry must be clean");

  resetStore();
  const conflictDraft = { ...minimalProject("H"), projectName: "локальная версия", source: "backend" as const };
  useDefenseProjectStore.getState().replaceProject(conflictDraft);
  useDefenseVariantsStore.setState({ activeVariantId: "H", activeVariantName: "name-H", syncStatus: "conflict" });
  fetchHandler = (method) => {
    if (method === "GET") return { ok: true, status: 200, data: { ...minimalProject("H"), projectName: "серверная версия" } };
    return { ok: true, status: 200, data: {} };
  };
  await useDefenseVariantsStore.getState().loadServerVersion();
  assert(useDefenseProjectStore.getState().project.projectName === "серверная версия", "loadServerVersion must replace the local draft");
  assert(useDefenseVariantsStore.getState().syncStatus === "clean", "loaded server version must be clean");
  console.log("project sync retry and reload: OK");

  // 10. Reloading the browser restores the selected backend project instead of trusting a cached project body.
  resetStore();
  globalThis.localStorage.setItem("fortis-active-project-id", "I");
  fetchHandler = () => ({ ok: true, status: 200, data: { ...minimalProject("I"), projectName: "версия с сервера" } });
  await useDefenseVariantsStore.getState().restoreActiveVariant();
  assert(useDefenseVariantsStore.getState().activeVariantId === "I", "reload must restore the active project id");
  assert(useDefenseProjectStore.getState().project.projectName === "версия с сервера", "reload must use the server project body");
  console.log("active backend project restore: OK");

  console.log("use-defense-variants-store.test.ts: variants store contracts passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
