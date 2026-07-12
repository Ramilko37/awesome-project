import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { BackendCalculatorSummary } from "./backend-calculator-summary";

const html = renderToStaticMarkup(
  <BackendCalculatorSummary
    cost={{ totalMln: 60, byEchelon: [{ echelonId: "l5", echelonName: "Огневое поражение", lines: [], echelonTotalMln: 60 }], byType: [], byObject: [] }}
    budget={{ projectId: "variant-b", budgetMode: "limited", budgetAmountMln: 100, createdAt: "2026-07-12T00:00:00Z", updatedAt: "2026-07-12T00:00:00Z" }}
    report={{ projectId: "variant-b", projectName: "Вариант B", baseObject: { id: "plant", name: "Завод Альфа", center: { lat: 55.75, lng: 37.61 } }, layers: [], placedObjects: [{ objectId: "mog", assetId: "mog", assetName: "МОГ — пост №2", layerId: "l5", layerCode: "L5", layerName: "Огневое поражение", quantity: 4, protectionType: "МОГ", unitPriceMln: 15, lineTotalMln: 60, isCompoundPost: true }], estimate: { totalMln: 60, byEchelon: [], byType: [], byObject: [] }, structuralProfile: { objectCount: 1, unitCount: 4, echelonCount: 1, categoryCount: 1, conflictCount: 0, coveredObjCount: 1, totalMln: 60, byEchelon: [] }, hideCost: false }}
  />,
);

assert.match(html, /Серверный расчёт/);
assert.match(html, /Остаток бюджета/);
assert.match(html, /Огневое поражение/);
assert.match(html, /МОГ — пост №2/);
console.log("backend-calculator-summary: OK");
