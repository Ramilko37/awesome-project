import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");

assert(
  source.includes("studioLeftTab") && source.includes("setStudioLeftTab(\"library\")"),
  "Catalog must be available as the Studio left-panel Library tab instead of a collapsible sidebar",
);
assert(
  source.includes("AssetLibraryManager") && source.includes("DefenseToolsPanel") && source.includes("Найти средство..."),
  "Library tab must keep asset management, compact asset cards and search in one panel",
);
assert(
  source.includes("studioLibraryScroll") && source.includes("studioPanelBody"),
  "Library tab must use Studio panel primitives and internal scrolling",
);
assert(
  !source.includes("isCatalogTrayOpen") && !source.includes("prototypeToggleLauncher"),
  "Legacy catalog tray opener must be removed after Studio tab migration",
);

console.log("catalog-sidebar-motion-contract.test.mjs: catalog migrated to Studio library tab");
