import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import type { BackendProjectReport } from "@/modules/defense-calculator/infra/backend-project-api";
import { BackendProjectReportView } from "./backend-project-report";

const report: BackendProjectReport = {
  projectId: "variant-b",
  projectName: "Вариант B",
  baseObject: { id: "plant-alpha", name: "Завод Альфа", center: { lat: 55.75, lng: 37.61 } },
  layers: [{ id: "l5", name: "Огневое поражение", code: "L5", geometryType: "ring" }],
  placedObjects: [{ objectId: "mog-2", assetId: "mog", assetName: "МОГ — пост №2", layerId: "l5", layerCode: "L5", layerName: "Огневое поражение", quantity: 4, protectionType: "МОГ", unitPriceMln: 15, lineTotalMln: 60, isCompoundPost: true }],
  estimate: { totalMln: 60, byEchelon: [], byType: [], byObject: [] },
  structuralProfile: { objectCount: 1, unitCount: 4, echelonCount: 1, categoryCount: 1, conflictCount: 0, coveredObjCount: 1, totalMln: 60, byEchelon: [] },
  hideCost: false,
};

const html = renderToStaticMarkup(<BackendProjectReportView report={report} onPrint={() => undefined} />);
assert.match(html, /Отчёт по проекту Вариант B/);
assert.match(html, /МОГ — пост №2/);
assert.match(html, /Печать \/ сохранить PDF/);
console.log("backend-project-report: OK");
