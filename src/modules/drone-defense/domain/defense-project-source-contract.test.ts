import { readFileSync } from "node:fs";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const source = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
const gisBoardSource = readFileSync("src/modules/drone-defense/ui/gis-board.tsx", "utf8");

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
  /mapRef:\s*\{\s*lon:\s*coord\[0\],\s*lat:\s*coord\[1\]\s*\}/.test(gisBoardSource),
  "GisBoard drop must place the asset exactly at the cursor coordinate, not at a snapped slot coordinate",
);
assert(
  !/if \(!slot\) return;/.test(gisBoardSource),
  "GisBoard drop must not reject a valid map coordinate just because no slot is nearby",
);
assert(
  !/slotId:\s*/.test(gisBoardSource),
  "GisBoard drop must not pass slotId; dropped assets belong to the exact cursor coordinate",
);
assert(!gisBoardSource.includes("screenPointToSlot"), "GisBoard must not resolve drops through slots");
assert(!gisBoardSource.includes("dropPreviewSlotId"), "GisBoard must not keep slot preview state");
assert(!gisBoardSource.includes("slotMarker"), "GisBoard must not render empty slot markers");
assert(!gisBoardSource.includes("selectedSlotId"), "GisBoard must not accept selectedSlotId");
assert(!gisBoardSource.includes("onSelectSlot"), "GisBoard must not expose slot selection callbacks");
assert(!source.includes("selectedSlotId"), "Prototype UI state must not keep selectedSlotId");
assert(!/slotId:\s*/.test(source), "Prototype drop handler must not accept slotId");
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
  "GisBoard and EchelonObjectsList should use project-driven selectedPlacementId",
);
assert(
  /onSelect=\{\(id\) => selectPlacedObject\(id\)\}/.test(source),
  "EchelonObjectsList onSelect must use selectPlacedObject",
);
assert(
  /onSelectPlacement=\{\(id\) => selectPlacedObject\(id\)\}/.test(source),
  "GisBoard onSelectPlacement must use selectPlacedObject",
);
assert(
  /onRemove=\{\(id\) => deleteProjectPlacement\(id\)\}/.test(source),
  "EchelonObjectsList onRemove must call deleteProjectPlacement",
);
assert(
  /const selectedPlacementId = selectedObjectId \?\? null;/.test(source),
  "Prototype should derive selectedPlacementId from defense project",
);
assert(
  /const handleLocatePlacement =/.test(source) && /selectObject\(placement\.id\)/.test(source),
  "Prototype locate path should select project placement by id",
);
assert(
  /function isMogPlacedObject/.test(source),
  "Prototype must share one helper for detecting placed МОГ objects",
);
assert(
  /setIsMogEditorOpen\(isMogPlacedObject\(\{\s*object,\s*asset\s*\}\)\);/.test(source),
  "Selecting a placed МОГ object must open the МОГ settings card immediately",
);
assert(
  /setIsMogEditorOpen\(Boolean\(compoundProfile\)\);/.test(source),
  "Successful МОГ placement must open the МОГ settings card immediately",
);

console.log("defense-project-source-contract.test.ts: prototype source contract passed");
