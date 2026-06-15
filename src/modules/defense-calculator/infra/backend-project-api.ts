import { getApiJson, postApiJson, putApiJson } from "@/shared/lib/api-client";

export type BackendEstimateLine = {
  objectId: string;
  assetId: string;
  assetName: string;
  echelonId: string;
  echelonName: string;
  typeId: string;
  typeName: string;
  quantity: number;
  unitPriceMln: number;
  lineTotalMln: number;
};

export type BackendCostCalculation = {
  totalMln: number;
  byEchelon: Array<{ echelonId: string; echelonName: string; lines: BackendEstimateLine[]; echelonTotalMln: number }>;
  byType: Array<{ typeId: string; typeName: string; lines: BackendEstimateLine[]; typeTotalMln: number }>;
  byObject: BackendEstimateLine[];
};

export type BackendBudgetConfig = {
  budgetMode: "limited" | "unlimited";
  budgetAmountMln: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
};

export type BackendBudgetCheck = {
  fits: boolean;
  remainingMln: number;
  requiredMln: number;
  budgetMode: "limited" | "unlimited";
};

export type BackendProjectReport = {
  projectId: string;
  projectName: string;
  baseObject: unknown;
  layers: unknown[];
  placedObjects: unknown[];
  estimate: BackendCostCalculation;
  structuralProfile: unknown;
  hideCost: boolean;
};

export type BackendProjectCompare = {
  projectA: unknown;
  projectB: unknown;
  diff: {
    objectCountDelta: number;
    unitCountDelta: number;
    echelonCountDelta: number;
    categoryCountDelta: number;
    conflictCountDelta: number;
    coveredObjCountDelta: number;
    costDeltaMln: number;
    byEchelon: unknown[];
  };
};

export function getBackendBudgetConfig(projectId: string) {
  return getApiJson<BackendBudgetConfig>("/projects/budget", { query: { id: projectId } });
}

export function updateBackendBudgetConfig(projectId: string, body: Pick<BackendBudgetConfig, "budgetMode" | "budgetAmountMln">) {
  return putApiJson<BackendBudgetConfig>("/projects/budget", { query: { id: projectId }, body });
}

export function getBackendProjectCost(projectId: string) {
  return getApiJson<BackendCostCalculation>("/projects/cost", { query: { id: projectId } });
}

export function checkBackendProjectBudget(
  projectId: string,
  body: { assetId: string; quantity: number; echelonId: string },
) {
  return postApiJson<BackendBudgetCheck>("/projects/budget/check", { query: { id: projectId }, body });
}

export function getBackendProjectReport(projectId: string, options: { hideCost?: boolean } = {}) {
  return getApiJson<BackendProjectReport>("/projects/report", {
    query: { id: projectId, hideCost: options.hideCost },
  });
}

export function compareBackendProjects(projectId1: string, projectId2: string) {
  return getApiJson<BackendProjectCompare>("/projects/compare", {
    query: { id1: projectId1, id2: projectId2 },
  });
}
