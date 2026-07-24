import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const source = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");

assert(!source.includes("placeAssetInSlot"), "drone-defense-prototype should no longer call legacy placeAssetInSlot");
assert(!source.includes("removePlacement("), "drone-defense-prototype should not call legacy removePlacement");
assert(
  /onDropAsset=\{\s*placeDroppedAssetOnMap\s*\}/.test(source),
  "GisBoard onDropAsset must be wired to project-driven drop handler",
);
assert(source.includes("const placeDroppedAssetOnMap"), "drone-defense-prototype must define placeDroppedAssetOnMap");
assert(
  /placeObject\(asset\.id,\s*args\.layerId,\s*\{\s*lat:\s*args\.mapRef\.lat,\s*lng:\s*args\.mapRef\.lon\s*\}/.test(source),
  "Drop handler must create project object via placeObject(asset.id, args.layerId, mapRef)",
);
assert(
  /project\.assetLibrary\.find\(\(item\) => item\.id === args\.groupId\)/.test(source),
  "Drop handler must resolve dropped group id from project asset id first",
);
assert(
  /project\.assetLibrary\.find\(\(item\) => item\.mapCatalogGroupIds\?\.includes\(args\.groupId\)\)/.test(source),
  "Drop handler must fallback to map catalog group ids from project assets",
);
assert(
  /selectedPlacementId=\{selectedPlacementId\}/.test(source),
  "GisBoard should use project-driven selectedPlacementId",
);
assert(
  /onSelectPlacement=\{\(id\) => selectPlacedObject\(id\)\}/.test(source),
  "GisBoard onSelectPlacement must use selectPlacedObject",
);
assert(
  /const selectedPlacementId = workspaceState\.selectedEntity\?\.type === "object" \? workspaceState\.selectedEntity\.id : null;/.test(source),
  "Prototype should derive selectedPlacementId from canonical workspace selection",
);
assert(
  /const handleLocatePlacement =/.test(source) && /selectWorkspaceObject\(placement\.id\)/.test(source),
  "Prototype locate path should select the canonical workspace object",
);

console.log("defense-project-source-contract.test.ts: prototype source contract passed");
