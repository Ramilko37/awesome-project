import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultDefenseProject,
  importDefenseProjectJson,
} from "@/shared/lib/defense-project";

test("project import preserves explicit diagnostic conflict snapshots and backfills absent flags", () => {
  const project = createDefaultDefenseProject();
  const layer = project.layers[0]!;
  const asset = project.assetLibrary[0]!;
  const persisted = {
    ...project,
    placedObjects: [
      {
        id: "persisted-conflict",
        assetId: asset.id,
        layerId: layer.id,
        coordinates: project.baseObject.center,
        quantity: 1,
        status: "active" as const,
        hasCoverageConflict: true,
        createdAt: "2026-07-23T00:00:00.000Z",
        updatedAt: "2026-07-23T00:00:00.000Z",
      },
      {
        id: "legacy-without-conflict-flags",
        assetId: asset.id,
        layerId: layer.id,
        coordinates: project.baseObject.center,
        quantity: 1,
        status: "planned" as const,
        createdAt: "2026-07-23T00:00:00.000Z",
        updatedAt: "2026-07-23T00:00:00.000Z",
      },
    ],
  };

  const imported = importDefenseProjectJson(JSON.stringify(persisted));

  assert.equal(imported.placedObjects[0]!.hasCoverageConflict, true);
  assert.deepEqual(
    {
      hasGeometryConflict: imported.placedObjects[1]!.hasGeometryConflict,
      hasCoverageConflict: imported.placedObjects[1]!.hasCoverageConflict,
      hasTerrainConflict: imported.placedObjects[1]!.hasTerrainConflict,
    },
    {
      hasGeometryConflict: false,
      hasCoverageConflict: false,
      hasTerrainConflict: false,
    },
  );
});
