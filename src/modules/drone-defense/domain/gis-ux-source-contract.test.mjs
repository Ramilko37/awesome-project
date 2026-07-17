import assert from "node:assert/strict";
import fs from "node:fs";

const prototype = fs.readFileSync(new URL("../ui/drone-defense-prototype.tsx", import.meta.url), "utf8");
const board = fs.readFileSync(new URL("../ui/gis-board.tsx", import.meta.url), "utf8");
const objects = fs.readFileSync(new URL("../ui/echelon-objects-list.tsx", import.meta.url), "utf8");
const coordinates = fs.readFileSync(new URL("../ui/coordinate-placement-panel.tsx", import.meta.url), "utf8");
const shell = fs.readFileSync(new URL("../ui/defense-studio-shell.tsx", import.meta.url), "utf8");
const styles = fs.readFileSync(new URL("../ui/drone-defense-prototype.module.css", import.meta.url), "utf8");

assert(
  !prototype.includes("selectLayerWithDefaultSlot(fallback.id)"),
  "hiding active layer must not select fallback",
);
assert(
  prototype.includes("pendingPlacementDeletion"),
  "placed object delete must require confirmation state",
);
assert(
  prototype.includes("undoDeletePlacedObject"),
  "placed object delete must expose undo",
);
assert(prototype.includes("filterAndRankCatalog"), "catalog must use tokenized ranking helper");
assert(prototype.includes("Совместимые сначала"), "catalog must expose compatible-first mode");
assert(prototype.includes("Совместимость"), "catalog must expose a compatibility facet");
assert(prototype.includes("Сбросить поиск"), "catalog empty state must expose search recovery");
assert(board.includes("<GisLegend"), "map must render compact GIS legend");
assert(!board.includes("source.type"), "basemap menu must not expose transport type");
assert(!board.includes("license check"), "basemap menu must not expose licensing implementation flag");
assert(board.includes("cyrillicCharacterSet"), "map text layers must provide Cyrillic glyphs");
assert(board.includes("Измерить расстояние"), "map must expose distance measurement");
assert(board.includes("Показать весь объект"), "map must expose reset extent");
assert(board.includes("Сбросить поворот карты"), "map must expose a compass reset control");
assert(board.includes("visibleLayerIds"), "hidden layers must not retain coverage overlays");
assert(objects.includes("min-h-11"), "object actions must have 44px target height");
const layerSelectionBlock = prototype.slice(
  prototype.indexOf("const selectLayerWithDefaultSlot"),
  prototype.indexOf("useEffect(() =>", prototype.indexOf("const selectLayerWithDefaultSlot")),
);
assert(
  !layerSelectionBlock.includes("setIsEchelonObjectsPanelOpen(true)"),
  "layer selection must not auto-open the objects panel",
);
assert(coordinates.includes("Например: 55,4400"), "coordinate fields must show examples, not entered-looking values");
assert(coordinates.includes("aria-describedby"), "coordinate examples must be programmatically associated");
assert(shell.includes("aria-current"), "primary navigation must expose the active item");
assert(styles.includes("width: min(32rem, 42vw)"), "MOG editor must keep the map visible on desktop");

console.log("gis-ux-source-contract: OK");
