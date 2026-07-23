import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
const styles = readFileSync(
  "src/modules/drone-defense/ui/drone-defense-prototype.module.css",
  "utf8",
);

assert(
  source.includes('data-sidebar-state={isCatalogTrayOpen ? "open" : "closed"}'),
  "Catalog sidebar must stay mounted and expose open/closed state for smooth transitions",
);
assert(
  styles.includes(
    "transition: max-height 300ms ease, width 300ms ease, transform 300ms ease, opacity 300ms ease",
  ),
  "Catalog sidebar must animate open/closed size and opacity",
);
assert(
  styles.includes('@media (min-width: 768px)') &&
    styles.includes('.prototypeSidebar[data-sidebar-state="open"] {\n    width: 20rem;') &&
    styles.includes('.prototypeSidebar[data-sidebar-state="closed"] {\n    width: 0;'),
  "Catalog sidebar must animate desktop width instead of unmounting",
);
assert(
  styles.includes("pointer-events: none;") && styles.includes("opacity: 0;"),
  "Closed catalog sidebar must not capture pointer events while hidden",
);
assert(
  styles.includes("border-bottom-width: 0;") && styles.includes("border-right-width: 0;"),
  "Closed catalog sidebar must remove borders so it collapses without a 1px remainder",
);
assert(
  source.includes('data-sidebar-toggle-state={isCatalogTrayOpen ? "hidden" : "visible"}') &&
    styles.includes(".prototypeToggleLauncher {") &&
    styles.includes('.prototypeToggleLauncher[data-sidebar-toggle-state="hidden"]') &&
    styles.includes("transform: translateX(-0.5rem);") &&
    styles.includes("opacity: 0;"),
  "Catalog sidebar opener must fade/slide in when the sidebar closes",
);
assert(
  !source.includes("{isCatalogTrayOpen ? (\n        <section"),
  "Catalog sidebar must not be conditionally mounted because that prevents smooth closing",
);

console.log("catalog-sidebar-motion-contract.test.mjs: catalog sidebar animates open and closed");
