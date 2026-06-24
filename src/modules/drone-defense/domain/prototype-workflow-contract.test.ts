// Run: pnpm dlx tsx src/modules/drone-defense/domain/prototype-workflow-contract.test.ts
import assert from "node:assert/strict";
import { createDefaultDefenseProject, updatePlacedObjectInProject } from "@/shared/lib/defense-project";
import {
  buildPrototypeDemoProject,
  buildWizardLayer,
  formatDistance,
  formatLayerRange,
  layerInsertOptionKey,
  parseCoordinatePlacementInput,
  projectLayerToMapLayer,
  resolvePrototypeSelectedObjectId,
} from "@/modules/drone-defense/domain/prototype-workflow";
import type { LayerInsertOption } from "@/shared/lib/defense-project";

const project = createDefaultDefenseProject();

const demoProject = buildPrototypeDemoProject(project);
assert.equal(demoProject.placedObjects.length >= 5, true);
assert.equal(demoProject.placedObjects[0]?.name, "МОГ — пост №1");
assert.equal(demoProject.selectedObjectId, demoProject.placedObjects[0]?.id);
assert.equal(resolvePrototypeSelectedObjectId(demoProject), demoProject.placedObjects[0]?.id);
assert.equal(
  resolvePrototypeSelectedObjectId({ ...demoProject, selectedObjectId: "missing-object" }),
  demoProject.placedObjects[0]?.id,
);
const explicitSelection = demoProject.placedObjects[2];
assert(explicitSelection, "demo seed must include a third object for selection fallback checks");
assert.equal(resolvePrototypeSelectedObjectId({ ...demoProject, selectedObjectId: explicitSelection.id }), explicitSelection.id);
assert.equal(buildPrototypeDemoProject(demoProject).placedObjects.length, demoProject.placedObjects.length);
const demoProjectWithClearedFlags = {
  ...demoProject,
  placedObjects: demoProject.placedObjects.map((object) => ({
    ...object,
    hasCoverageConflict: false,
    hasGeometryConflict: false,
    hasTerrainConflict: false,
  })),
};
assert.equal(
  buildPrototypeDemoProject(demoProjectWithClearedFlags).placedObjects.find((object) => object.id === "demo-mog-post-2")
    ?.hasCoverageConflict,
  true,
);
assert.equal(
  demoProject.placedObjects.some((object) => object.assetId === "ew-narrowband"),
  true,
);
assert.equal(
  demoProject.placedObjects.some((object) => object.hasCoverageConflict),
  true,
);
const demoConflictObject = demoProject.placedObjects.find((object) => object.id === "demo-mog-post-2");
assert(demoConflictObject, "demo seed must include a conflicted МОГ post");
const editedDemoProject = updatePlacedObjectInProject(demoProject, demoProject.placedObjects[0]!.id, { quantity: 2 });
assert.equal(
  editedDemoProject.placedObjects.find((object) => object.id === demoConflictObject.id)?.hasCoverageConflict,
  true,
);

assert.equal(formatDistance(500), "500 м");
assert.equal(formatDistance(2500), "2,5 км");
assert.equal(formatLayerRange(30000, 60000), "30–60 км");
assert.equal(formatLayerRange(500, 1500), "0,5–1,5 км");
assert.equal(formatLayerRange(0, 900), "0–900 м");

const option: LayerInsertOption = {
  kind: "between",
  label: "Между L2 и L1",
  beforeLayerId: "layer-before",
  afterLayerId: "layer-after",
  minInnerRadiusM: 1000,
  maxOuterRadiusM: 3000,
  availableWidthM: 2000,
};
assert.equal(layerInsertOptionKey(option), "between:layer-before:layer-after");

const wizardLayer = buildWizardLayer(project, {
  name: "Тестовый эшелон",
  code: "LT",
  innerRadiusM: 1000,
  widthM: 2000,
  geometryMode: "circle",
  polygonCoordinates: [],
  polygonClosed: false,
});
assert.equal(wizardLayer.name, "Тестовый эшелон");
assert.equal(wizardLayer.code, "LT");
assert.equal(wizardLayer.geometry.type, "ring");

const mapLayer = projectLayerToMapLayer(wizardLayer);
assert.equal(mapLayer.name, "Тестовый эшелон");
assert.equal(mapLayer.shortName, "LT");
assert.deepEqual(mapLayer.distanceBandM, {
  min: 1000,
  max: 3000,
  label: "1–3 км",
});

const parsed = parseCoordinatePlacementInput({
  lat: "55,44",
  lng: "37.10",
  altitude: "120",
  notes: "Проверочная точка",
});
assert.equal(parsed.ok, true);
if (parsed.ok) {
  assert.deepEqual(parsed.coordinates, { lat: 55.44, lng: 37.1, altitude: 120 });
  assert.equal(parsed.notes, "Проверочная точка");
}

const invalid = parseCoordinatePlacementInput({ lat: "91", lng: "37", altitude: "", notes: "" });
assert.equal(invalid.ok, false);

console.log("prototype-workflow-contract: OK");
