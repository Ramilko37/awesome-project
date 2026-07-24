import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const runtimeFiles = [
  "asset-library-manager.tsx",
  "assets-panel.tsx",
  "defense-asset-card.tsx",
  "defense-tool-icon.tsx",
  "drone-defense-prototype.tsx",
  "facility-drilldown.tsx",
  "gis-board.tsx",
  "map-object-marker.tsx",
  "properties-panel.tsx",
  "status-bar.tsx",
  "topbar.tsx",
  "variants-modal.tsx",
];

test("2D GIS runtime does not import Ant Design icons or components", () => {
  for (const file of runtimeFiles) {
    const source = readFileSync(
      `src/modules/drone-defense/ui/${file}`,
      "utf8",
    );

    assert.doesNotMatch(source, /@ant-design\/icons/, file);
    assert.doesNotMatch(source, /from ["']antd["']/, file);
  }
});
