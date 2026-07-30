// Run: pnpm exec tsx src/modules/drone-defense/domain/initial-defense-project.test.ts

import assert from "node:assert/strict";
import { createRingLayer, placeObjectInProject } from "@/shared/lib/defense-project";
import { defaultProtectedObject } from "@/shared/config/default-defense-layers";
import { createInitialDefenseProject } from "@/modules/drone-defense/domain/create-initial-defense-project";
import { getRecommendedAssetsForLayer } from "@/modules/drone-defense/domain/get-recommended-assets-for-layer";
import type { DefenseAsset } from "@/shared/types/defense-project";

const project = createInitialDefenseProject({
  ...defaultProtectedObject,
  enterpriseId: defaultProtectedObject.id,
  source: "fallback",
});

assert.equal(project.projectName, "Новый проект защиты");
assert.equal(project.version, 1);
assert.equal(project.layers.length, 0, "initial project must not create protection layers");
assert.equal(project.placedObjects.length, 0, "initial project must not contain placed objects");
assert.equal(project.activeLayerId, null, "initial project must not select an active layer");
assert.equal(project.selectedAssetId, null, "initial project must not select an asset");
assert.equal(project.selectedObjectId, null, "initial project must not select an object");
assert.deepEqual(project.baseObject, defaultProtectedObject, "facility zone must be sourced from baseObject");
assert(project.assetLibrary.length > 0, "initial project must keep the asset library available");

const initialCalculatorProject = placeObjectInProject(project, "mobile-radar", "missing-layer", { lat: 55.1, lng: 37.1 });
assert.equal(initialCalculatorProject.placedObjects.length, 0, "facility layer must not accept placements or affect cost");

const detectionLayer = createRingLayer(project, {
  id: "layer-l1-detection",
  name: "Обнаружение",
  code: "L1",
  innerRadiusM: 0,
  widthM: 2200,
  isActive: true,
});
const recommended = getRecommendedAssetsForLayer(detectionLayer, project.assetLibrary);
assert(recommended.length > 0, "detection layer must produce deterministic recommendations");
assert(
  recommended.every((asset) => ["detection", "classification", "early-warning"].includes(asset.category)),
  "detection recommendations must match layer purpose",
);
assert.deepEqual(
  recommended.map((asset) => asset.id),
  getRecommendedAssetsForLayer(detectionLayer, project.assetLibrary).map((asset) => asset.id),
  "recommendations must be deterministic",
);

const customAssets: DefenseAsset[] = [
  {
    id: "radar-demo",
    name: "Радар demo",
    category: "detection",
    roles: ["detect"],
    pricePerUnitMln: 1,
    currency: "RUB",
    unitLabel: "шт",
    coverageType: "circle",
    deploymentType: "static",
    placementType: "map-object",
    tags: ["demo"],
  },
  {
    id: "ew-demo",
    name: "РЭБ demo",
    category: "jamming",
    roles: ["suppress"],
    pricePerUnitMln: 1,
    currency: "RUB",
    unitLabel: "шт",
    coverageType: "circle",
    deploymentType: "static",
    placementType: "map-object",
    tags: ["demo"],
  },
];
assert.deepEqual(
  getRecommendedAssetsForLayer(detectionLayer, customAssets).map((asset) => asset.id),
  ["radar-demo"],
  "recommendations must filter the current project library by layer purpose",
);

console.log("initial-defense-project.test.ts: OK");
