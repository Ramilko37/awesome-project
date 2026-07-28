import { readFileSync } from "node:fs";

const projectReportLinesSource = readFileSync("src/modules/defense-calculator/domain/project-report-lines.ts", "utf8");
const echelonMapModelSource = readFileSync("src/modules/drone-defense/domain/echelon-map-model.ts", "utf8");
const defenseToolIconSource = readFileSync("src/modules/drone-defense/ui/defense-tool-icon.tsx", "utf8");
const prototypeSource = readFileSync("src/modules/drone-defense/ui/drone-defense-prototype.tsx", "utf8");
const mogCompositionEditorSource = readFileSync("src/modules/drone-defense/ui/mog-composition-editor.tsx", "utf8");
const reportsPageSource = readFileSync("src/modules/analytics/ui/reports-page.tsx", "utf8");
const reportsChartsSource = readFileSync("src/modules/analytics/ui/reports-charts.tsx", "utf8");
const sceneSource = readFileSync("src/modules/drone-defense/ui/scene.tsx", "utf8");
const structuralProfileSource = readFileSync("src/modules/defense-calculator/domain/structural-profile.ts", "utf8");
const evaluationSource = readFileSync("src/modules/drone-defense/domain/evaluation.ts", "utf8");
const defenseCatalogTabSource = readFileSync("src/modules/drone-defense/ui/defense-catalog/defense-catalog-tab.tsx", "utf8");
const gisBoardSource = readFileSync("src/modules/drone-defense/ui/gis-board.tsx", "utf8");
const defenseProjectSource = readFileSync("src/shared/lib/defense-project.ts", "utf8");
const defenseProjectStoreSource = readFileSync("src/shared/lib/use-defense-project-store.ts", "utf8");
const sensorPanelsSource = readFileSync("src/modules/alert/ui/sensor-panels.tsx", "utf8");
const dashboardPageSource = readFileSync("src/modules/dashboard/ui/dashboard-page.tsx", "utf8");
const sitesPageSource = readFileSync("src/modules/sites/ui/sites-page.tsx", "utf8");
const themeToggleSource = readFileSync("src/shared/ui/theme-toggle.tsx", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  !projectReportLinesSource.includes("?.filter((item) => Number(item.quantity) > 0)\n    .map(") &&
    !projectReportLinesSource.includes("?.filter((item) => visibleCoverageIds.has(item.id) && Number(item.quantity) > 0)\n    .map("),
  "Project report compound summaries must combine filter/map passes into one pass",
);
assert(
  !echelonMapModelSource.includes(".map((layer) => layer.distanceBandM.max)\n      .filter("),
  "Initial protected-object view radius selection must avoid a chained map/filter pass",
);
assert(
  !defenseToolIconSource.includes("?.filter((item) => Number(item.quantity) > 0)\n    .map("),
  "Defense tool icon compound weapon summary must combine filter/map passes into one pass",
);
assert(
  !prototypeSource.includes(".filter((object) => object.isVisibleOnMap === false)\n          .map((object) => object.id)"),
  "Prototype hidden placement id set must be built in one pass",
);
assert(
  !mogCompositionEditorSource.includes(".map((weapon) => weapon.id)\n        .filter((weaponId) => nextVisible.has(weaponId))"),
  "MOG coverage visible weapon ids must preserve weapon order in one pass",
);
assert(
  reportsPageSource.includes("dynamic(() => import(\"@/modules/analytics/ui/reports-charts\")") &&
    !reportsPageSource.includes("from \"recharts\"") &&
    reportsChartsSource.includes("import(\"recharts\")") &&
    reportsChartsSource.includes("} catch {") &&
    !reportsChartsSource.includes("from \"recharts\""),
  "Reports charts must lazy-load Recharts without a static Recharts import or unhandled effect import rejection",
);
assert(
  !sceneSource.includes("clock.getElapsedTime()") &&
    !sceneSource.includes("useRef<DroneRuntimeState[]>(initialDroneRuntime())") &&
    !sceneSource.includes("useRef<ThreatStatus[]>(threatTracks.map(() => \"detected\"))") &&
    !sceneSource.includes("const [dragging, setDragging] = useState(false)") &&
    !sceneSource.includes("const intersection = new THREE.Vector3();") &&
    !sceneSource.includes("setStatuses(nextStatuses)") &&
    !sceneSource.includes("setEffects((prev) =>"),
  "R3F scene must avoid clock advancement, eager ref initialization, handler-only state, pointer-move allocations, and React state commits inside useFrame",
);

assert(
  !structuralProfileSource.includes(".filter((summary) => summary.objectCount > 0)\n    .map(") &&
    !evaluationSource.includes(".filter((asset) => !configuration.placements.some(") &&
    !defenseCatalogTabSource.includes("assets.filter((asset) => asset.defenseLayerIds.includes(detailLayer.id)).map(") &&
    !gisBoardSource.includes("[...counts.entries()].filter(([, count]) => count > 1).map(") &&
    !defenseProjectSource.includes(".filter((layer) => layer.id !== ignoredLayerId && layer.id !== draftLayer.id)\n    .map(") &&
    !defenseProjectSource.includes(".filter((item) => item.id !== layerId)\n    .map(") &&
    !defenseProjectSource.includes(".filter((object) => object.assetId !== assetId)\n    .forEach(") &&
    !defenseProjectSource.includes(".filter((asset) => !canonicalIds.has(asset.id))\n    .map(") &&
    !defenseProjectStoreSource.includes(".filter((pick) => pick.included)\n        .map("),
  "Known performance-sensitive array transforms must avoid chained throwaway passes",
);

assert(
  !sensorPanelsSource.includes("transition-all") &&
    !dashboardPageSource.includes("transition-all") &&
    !sitesPageSource.includes("transition-all") &&
    !themeToggleSource.includes("transition-all") &&
    !themeToggleSource.includes("scale-0"),
  "Shared performance hotspots must avoid transition-all and scale-from-zero animations",
);

console.log("react-doctor-performance-contract.test.mjs: changed-scope performance contracts passed");
