import assert from "node:assert/strict";
import test from "node:test";

import {
  clearSelection,
  selectEchelon,
  selectObject,
  type WorkspaceState,
} from "./gis-workspace-state";

test("workspace selection keeps one coherent echelon and inspector context", () => {
  const initial: WorkspaceState = {
    activeEchelonId: "layer-detection",
    selectedEntity: { type: "echelon", id: "layer-detection" },
  };

  const objectSelected = selectObject(initial, "object-radar", "layer-suppression");
  assert.deepEqual(objectSelected, {
    activeEchelonId: "layer-suppression",
    selectedEntity: { type: "object", id: "object-radar" },
  });

  const echelonSelected = selectEchelon(objectSelected, "layer-reserve");
  assert.deepEqual(echelonSelected, {
    activeEchelonId: "layer-reserve",
    selectedEntity: { type: "echelon", id: "layer-reserve" },
  });

  assert.deepEqual(clearSelection(echelonSelected), {
    activeEchelonId: "layer-reserve",
    selectedEntity: null,
  });
});
