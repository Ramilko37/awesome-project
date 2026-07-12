import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import type { BackendProjectCompare } from "@/modules/defense-calculator/infra/backend-project-api";
import { canCompareProjects, ProjectComparison } from "./project-comparison";

const comparison: BackendProjectCompare = {
  projectA: {
    projectId: "a",
    projectName: "Вариант A",
    structuralProfile: { objectCount: 2, unitCount: 3, echelonCount: 2, categoryCount: 2, conflictCount: 1, coveredObjCount: 2, totalMln: 100, byEchelon: [] },
    costCalculation: { totalMln: 100, byEchelon: [], byType: [], byObject: [] },
  },
  projectB: {
    projectId: "b",
    projectName: "Вариант B",
    structuralProfile: { objectCount: 3, unitCount: 4, echelonCount: 3, categoryCount: 2, conflictCount: 0, coveredObjCount: 3, totalMln: 120, byEchelon: [] },
    costCalculation: { totalMln: 120, byEchelon: [], byType: [], byObject: [] },
  },
  diff: {
    objectCountDelta: 1,
    unitCountDelta: 1,
    echelonCountDelta: 1,
    categoryCountDelta: 0,
    conflictCountDelta: -1,
    coveredObjCountDelta: 1,
    costDeltaMln: 20,
    byEchelon: [{ layerId: "l5", layerCode: "L5", layerName: "Огневое поражение", objectCountDelta: 1, unitCountDelta: 1, categoryCountDelta: 0, conflictCountDelta: -1, coveredObjDelta: 1 }],
  },
};

const html = renderToStaticMarkup(<ProjectComparison comparison={comparison} />);
assert.match(html, /Вариант A/);
assert.match(html, /Вариант B/);
assert.match(html, /Покрытые объекты/);
assert.match(html, /L5/);
assert.match(html, /−1/);
assert.equal(canCompareProjects("a", "b"), true);
assert.equal(canCompareProjects("a", "a"), false);
console.log("project-comparison: OK");
