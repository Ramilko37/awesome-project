import assert from "node:assert/strict";

import type { BackendProjectCompare } from "./backend-project-api";

const comparison: BackendProjectCompare = {
  projectA: {
    projectId: "project-a",
    projectName: "Вариант A",
    structuralProfile: {
      objectCount: 2,
      unitCount: 3,
      echelonCount: 2,
      categoryCount: 2,
      conflictCount: 1,
      coveredObjCount: 2,
      totalMln: 100,
      byEchelon: [],
    },
    costCalculation: { totalMln: 100, byEchelon: [], byType: [], byObject: [] },
  },
  projectB: {
    projectId: "project-b",
    projectName: "Вариант B",
    structuralProfile: {
      objectCount: 3,
      unitCount: 4,
      echelonCount: 3,
      categoryCount: 2,
      conflictCount: 0,
      coveredObjCount: 3,
      totalMln: 120,
      byEchelon: [],
    },
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
    byEchelon: [],
  },
};

assert.equal(comparison.projectB.structuralProfile.coveredObjCount, 3);
assert.equal(comparison.diff.byEchelon.length, 0);
console.log("backend-project-api: typed compare DTOs OK");
