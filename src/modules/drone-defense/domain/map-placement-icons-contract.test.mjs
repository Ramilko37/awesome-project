import { readFileSync } from "node:fs";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const gisBoardSource = readFileSync("src/modules/drone-defense/ui/gis-board.tsx", "utf8");
const mapMarkerSource = readFileSync("src/modules/drone-defense/ui/map-object-marker.tsx", "utf8");
const mapModelSource = readFileSync("src/modules/drone-defense/domain/echelon-map-model.ts", "utf8");
const adapterSource = readFileSync("src/modules/drone-defense/domain/project-map-adapter.ts", "utf8");

assert(
  !gisBoardSource.includes("placement.layerId !== selectedLayerId"),
  "Map icon layer must render dropped objects in the active echelon, not only other echelons",
);
assert(gisBoardSource.includes("markerOverlayPlacements"), "Map must project active echelon placements into the tactical marker overlay");
assert(gisBoardSource.includes("<MapObjectMarker"), "Dropped objects must render through tactical map markers");
assert(mapModelSource.includes("iconUrl?: string"), "Echelon map placements must carry optional iconUrl");
assert(
  adapterSource.includes("getBuildAssetForCatalogGroup") && adapterSource.includes("iconUrl: buildAsset?.imageUrl"),
  "Project map adapter must resolve catalog group images for map markers",
);
assert(
  mapMarkerSource.includes("placement.iconUrl") && mapMarkerSource.includes("<img"),
  "Map object markers must render placement iconUrl as an image before falling back to semantic icons",
);
assert(
  mapMarkerSource.includes("hasImageMarker") &&
    mapMarkerSource.includes("border-0 bg-transparent p-0") &&
    mapMarkerSource.includes("border-blue-500") &&
    mapMarkerSource.includes("bg-transparent") &&
    mapMarkerSource.includes("bg-slate-950/90") &&
    !mapMarkerSource.includes("border-transparent") &&
    !mapMarkerSource.includes("ring-blue-500/70"),
  "Image map markers must render with one aligned image frame instead of a separate ring or transparent border gap",
);

console.log("map-placement-icons-contract.test.mjs: dropped objects render as icons on the active echelon");
