import assert from "node:assert/strict";
import { buildLegendMarkerCategories } from "@/modules/drone-defense/ui/gis-legend";
import type { EchelonMapPlacement } from "@/modules/drone-defense/domain/echelon-map-model";

function placement(id: string, markerCategory: string): EchelonMapPlacement {
  return {
    id,
    sourcePlacementId: id,
    layerId: markerCategory === "kinetic" ? "layer_05_mid_range_kinetic" : "layer_02_detection",
    label: id,
    position: [60.6, 56.8],
    color: [37, 99, 235, 245],
    isCatalogPlacement: true,
    markerCategory,
    qty: 1,
  };
}

const categories = buildLegendMarkerCategories([
  placement("radar", "detection"),
  placement("mog-1", "kinetic"),
  placement("mog-2", "kinetic"),
]);

assert.deepEqual(
  categories.map(({ id, label }) => ({ id, label })),
  [
    { id: "detection", label: "Обнаружение" },
    { id: "kinetic", label: "Поражение" },
  ],
  "legend must expose each marker category present on the visible map exactly once",
);

const filteredCategories = buildLegendMarkerCategories([placement("radar", "detection")]);
assert.deepEqual(
  filteredCategories.map(({ id }) => id),
  ["detection"],
  "legend must drop categories removed by map visibility filtering",
);

console.log("GIS legend category contract: OK");
