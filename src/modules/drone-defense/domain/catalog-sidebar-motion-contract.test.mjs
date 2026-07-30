import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
const styles = readFileSync(
  "src/modules/drone-defense/ui/drone-defense-prototype.module.css",
  "utf8",
);

assert(
  source.includes('data-sidebar-state={isCatalogTrayOpen ? "open" : "collapsed"}'),
  "Catalog sidebar must stay mounted and expose open/collapsed state for smooth transitions",
);
assert(
  styles.includes(
    "transition: max-height 300ms ease, width 300ms ease, transform 300ms ease, opacity 300ms ease",
  ),
  "Catalog sidebar must animate open/closed size and opacity",
);
assert(
  styles.includes('@media (min-width: 1024px)') &&
    styles.includes('.prototypeSidebar[data-sidebar-state="open"] {\n    width: var(--prototype-left-w);') &&
    styles.includes('.prototypeSidebar[data-sidebar-state="collapsed"] {\n    width: 4.25rem;'),
  "Workspace sidebar must collapse to a narrow desktop rail instead of disappearing",
);
assert(
  source.includes("prototypeSidebarRail") &&
    source.includes("miniCatalogItems.slice(0, 6).map") &&
    source.includes("prototypeRailAsset") &&
    source.includes("withBasePath(asset.previewImageUrl)"),
  "Collapsed workspace sidebar must render a vertical rail of library asset thumbnails",
);
assert(
  !source.includes("prototypeToggleLauncher"),
  "Collapsed library rail replaces the old floating launcher button",
);
assert(
  !source.includes("{isCatalogTrayOpen ? (\n        <section"),
  "Catalog sidebar must not be conditionally mounted because that prevents smooth closing",
);

console.log("catalog-sidebar-motion-contract.test.mjs: catalog sidebar animates open and collapsed");
