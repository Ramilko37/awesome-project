import { defenseAssetLibrary } from "@/shared/config/defense-asset-library";
import type { DefenseProject, ProtectedObject, ProtectedObjectOption } from "@/shared/types/defense-project";

function nowIso() {
  return new Date().toISOString();
}

function toProtectedObject(baseObject: ProtectedObjectOption): ProtectedObject {
  const { id, name, center, model } = baseObject;
  return { id, name, center, ...(model ? { model } : {}) };
}

export function createInitialDefenseProject(baseObject: ProtectedObjectOption): DefenseProject {
  return {
    schemaVersion: 1,
    projectId: "current",
    projectName: "Новый проект защиты",
    enterpriseId: baseObject.enterpriseId,
    version: 1,
    baseObject: toProtectedObject(baseObject),
    layers: [],
    placedObjects: [],
    assetLibrary: defenseAssetLibrary,
    activeLayerId: null,
    selectedAssetId: null,
    selectedObjectId: null,
    mode: "view",
    source: "custom",
    updatedAt: nowIso(),
  };
}
