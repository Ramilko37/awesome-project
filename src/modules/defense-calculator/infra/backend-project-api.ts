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

export type BackendBaseObject = {
  id: string;
  name: string;
  center: { lat: number; lng: number };
};

export type BackendReportLayer = {
  id: string;
  name: string;
  code: string;
  description?: string;
  geometryType: "circle" | "ring" | "polygon" | "freeform";
  centerLat?: number;
  centerLng?: number;
  radiusM?: number;
  minRadiusM?: number;
  maxRadiusM?: number;
  color?: string;
  opacity?: number;
};

export type BackendCompoundComposition = {
  postType: string;
  personnel: string;
  accountability: string;
  armament: string;
  weaponUnits: string;
  sectorOrRange: string;
  azimuth: number;
};

export type BackendWeaponSummary = {
  caliber: string;
  ammunitionType: string;
  operationMode: string;
  moduleCount: string;
  isManual: string;
};

export type BackendAzimuthSectorSummary = {
  azimuth: number;
  coverageType: string;
  sectorWidthDeg: number;
  rangeM: number;
};

export type BackendReportObjectLine = {
  objectId: string;
  assetId: string;
  assetName: string;
  layerId: string;
  layerCode: string;
  layerName: string;
  quantity: number;
  protectionType: string;
  unitPriceMln: number;
  lineTotalMln: number;
  isCompoundPost: boolean;
  compositionSummary?: BackendCompoundComposition;
  weaponSummary?: BackendWeaponSummary;
  azimuthSectorSummary?: BackendAzimuthSectorSummary;
};

export type BackendEchelonProfile = {
  layerId: string;
  layerCode: string;
  layerName: string;
  objectCount: number;
  unitCount: number;
  categoryCount: number;
  conflictCount: number;
  coveredObjCount: number;
};

export type BackendStructuralProfile = {
  objectCount: number;
  unitCount: number;
  echelonCount: number;
  categoryCount: number;
  conflictCount: number;
  coveredObjCount: number;
  totalMln: number;
  byEchelon: BackendEchelonProfile[];
};

export type BackendConfigSnapshot = {
  projectId: string;
  projectName: string;
  structuralProfile: BackendStructuralProfile;
  costCalculation: BackendCostCalculation;
};

export type BackendEchelonDiff = {
  layerId: string;
  layerCode: string;
  layerName: string;
  objectCountDelta: number;
  unitCountDelta: number;
  categoryCountDelta: number;
  conflictCountDelta: number;
  coveredObjDelta: number;
};

export type BackendProjectReport = {
  projectId: string;
  projectName: string;
  baseObject: BackendBaseObject;
  layers: BackendReportLayer[];
  placedObjects: BackendReportObjectLine[];
  estimate: BackendCostCalculation;
  structuralProfile: BackendStructuralProfile;
  hideCost: boolean;
};

export type BackendProjectCompare = {
  projectA: BackendConfigSnapshot;
  projectB: BackendConfigSnapshot;
  diff: {
    objectCountDelta: number;
    unitCountDelta: number;
    echelonCountDelta: number;
    categoryCountDelta: number;
    conflictCountDelta: number;
    coveredObjCountDelta: number;
    costDeltaMln: number;
    byEchelon: BackendEchelonDiff[];
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
