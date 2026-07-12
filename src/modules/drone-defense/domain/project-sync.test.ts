import assert from "node:assert/strict";

import type { DefenseProject } from "@/shared/types/defense-project";
import {
  clearRecoveryDraft,
  readRecoveryDraft,
  serializeProjectForSync,
  syncStatusFor,
  writeRecoveryDraft,
} from "./project-sync";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
    removeItem(key: string) {
      values.delete(key);
    },
  };
}

const project: DefenseProject = {
  schemaVersion: 1,
  projectId: "alpha",
  projectName: "Вариант A",
  version: 3,
  baseObject: { id: "plant-alpha", name: "Завод Альфа", center: { lat: 55.75, lng: 37.61 } },
  layers: [],
  assetLibrary: [],
  placedObjects: [],
  mode: "view",
  source: "backend",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

const storage = createStorage();
const canonical = serializeProjectForSync(project);

assert.equal(syncStatusFor(canonical, canonical), "clean");
assert.equal(
  syncStatusFor(canonical, serializeProjectForSync({ ...project, projectName: "Вариант B" })),
  "dirty",
);

writeRecoveryDraft(storage, project, "dirty");
assert.equal(readRecoveryDraft(storage, "alpha")?.project.projectName, "Вариант A");
assert.equal(readRecoveryDraft(storage, "alpha")?.status, "dirty");

clearRecoveryDraft(storage, "alpha");
assert.equal(readRecoveryDraft(storage, "alpha"), null);

console.log("project-sync: OK");
