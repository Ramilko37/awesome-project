import { readFileSync } from "node:fs";

const dataNavigationSource = readFileSync("src/shared/ui/fortis/data-navigation-domain.tsx", "utf8");
const defenseToolIconSource = readFileSync("src/modules/drone-defense/ui/defense-tool-icon.tsx", "utf8");
const compassRoseSource = readFileSync("src/modules/alert/ui/compass-rose.tsx", "utf8");
const radarScopeSource = readFileSync("src/modules/alert/ui/radar-scope.tsx", "utf8");
const eventCardSource = readFileSync("src/modules/alert/ui/event-card.tsx", "utf8");
const eventFormatSource = readFileSync("src/modules/alert/ui/event-format.ts", "utf8");
const sensorReadingsSource = readFileSync("src/modules/alert/ui/sensor-readings.ts", "utf8");
const topbarSource = readFileSync("src/modules/drone-defense/ui/topbar.tsx", "utf8");
const calculatorPageSource = readFileSync("src/modules/defense-calculator/ui/calculator-page.tsx", "utf8");
const gisBoardSource = readFileSync("src/modules/drone-defense/ui/gis-board.tsx", "utf8");
const scaledGlbModelSource = readFileSync("src/components/FactoryMap/ScaledGlbModel.tsx", "utf8");
const buttonSource = readFileSync("src/components/ui/button.tsx", "utf8");
const badgeSource = readFileSync("src/components/ui/badge.tsx", "utf8");
const mapObjectMarkerSource = readFileSync("src/modules/drone-defense/ui/map-object-marker.tsx", "utf8");
const assetDimensionsSource = readFileSync("src/config/assetDimensions.ts", "utf8");
const scoringSource = readFileSync("src/modules/defense-calculator/domain/scoring.ts", "utf8");
const echelonBuildAssetsSource = readFileSync("src/modules/drone-defense/domain/echelon-build-assets.ts", "utf8");
const echelonMapModelSource = readFileSync("src/modules/drone-defense/domain/echelon-map-model.ts", "utf8");
const prototypeTypesSource = readFileSync("src/modules/drone-defense/domain/prototype-types.ts", "utf8");
const apiClientSource = readFileSync("src/modules/drone-defense/infra/api-client.ts", "utf8");
const assetLibraryApiSource = readFileSync("src/modules/drone-defense/infra/asset-library-api.ts", "utf8");
const enterpriseApiSource = readFileSync("src/modules/drone-defense/infra/enterprise-api.ts", "utf8");
const mockDefenseRepositorySource = readFileSync("src/modules/drone-defense/infra/mock-defense-repository.ts", "utf8");
const variantSelectorSource = readFileSync("src/modules/drone-defense/ui/variant-selector.tsx", "utf8");
const defenseAssetLibrarySource = readFileSync("src/shared/config/defense-asset-library.ts", "utf8");
const defenseConfigurationSource = readFileSync("src/shared/lib/defense-configuration.ts", "utf8");
const defenseCatalogSource = readFileSync("src/shared/config/defense-catalog.ts", "utf8");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  dataNavigationSource.includes("const ECHELON_TREE_LEVEL_COLORS") &&
    dataNavigationSource.includes("const COVERAGE_STATUS_COLORS") &&
    !dataNavigationSource.includes("const colors: Record<string, string> = {") &&
    !dataNavigationSource.includes("const colors = [\"var(--fortis-blue-500)\""),
  "Fortis data-navigation static color maps must live at module scope",
);

assert(
  defenseToolIconSource.includes("function isControlTarget(target: HTMLElement)") &&
    !defenseToolIconSource.includes("const isControlTarget = (target: HTMLElement) =>"),
  "DefenseToolIcon control target helper must live at module scope",
);

assert(
  compassRoseSource.includes("const COMPASS_DIRECTIONS") &&
    !compassRoseSource.includes("const dirs = ["),
  "CompassRose directions must live at module scope",
);

assert(
  radarScopeSource.includes("const RADAR_RINGS") &&
    !radarScopeSource.includes("const rings = [") &&
    !radarScopeSource.includes("export const mockSensorReadings"),
  "RadarScope rings must live at module scope",
);

assert(
  topbarSource.includes("const VISIBLE_SCENARIOS") &&
    !topbarSource.includes("const visibleScenarios"),
  "Topbar visible scenarios must live at module scope",
);

assert(
  calculatorPageSource.includes("const CONFIGURE_CARD_CLASS") &&
    calculatorPageSource.includes("const PROJECT_OBJECT_STATUS_LABEL") &&
    !calculatorPageSource.includes("const card = \"rounded-2xl border border-slate-200 bg-white \"") &&
    !calculatorPageSource.includes("const statusLabel: Record<"),
  "Calculator configure static class and status labels must live at module scope",
);

assert(
  gisBoardSource.includes("const EMPTY_MAP_TOOL_MARKERS") &&
    !gisBoardSource.includes("const mapToolMarkers: MapToolMarker[] = []"),
  "GisBoard empty marker collection must live at module scope",
);

assert(
  eventFormatSource.includes("export const threatLevelLabel") &&
    eventFormatSource.includes("export function formatTime") &&
    !eventCardSource.includes("export const threatLevelLabel") &&
    !eventCardSource.includes("export function formatTime"),
  "EventCard must keep reusable labels and formatters outside the component file",
);

assert(
  sensorReadingsSource.includes("export const mockSensorReadings") &&
    sensorReadingsSource.includes("export type SensorReading") &&
    !radarScopeSource.includes("export type SensorReading") &&
    !radarScopeSource.includes("export const mockSensorReadings"),
  "RadarScope must keep mock sensor readings outside the component file",
);

assert(
  !scaledGlbModelSource.includes("export function getUpAxisCorrection") &&
    !buttonSource.includes("export { Button, buttonVariants }") &&
    !badgeSource.includes("export { Badge, badgeVariants }") &&
    !mapObjectMarkerSource.includes("export const ASSET_CATEGORY_COLORS") &&
    !mapObjectMarkerSource.includes("export function getAssetMarkerIcon") &&
    !mapObjectMarkerSource.includes("export function shouldShowLabel"),
  "Component files must not export internal helpers or variant factories",
);

assert(
  !assetDimensionsSource.includes("getAssetDimensionsSafe") &&
    !scoringSource.includes("scoreAsset") &&
    !echelonBuildAssetsSource.includes("getBuildAssetsForLayer") &&
    !echelonMapModelSource.includes("findNextBuildableCatalogGroupForLayer") &&
    !prototypeTypesSource.includes("export const assetCatalog") &&
    !prototypeTypesSource.includes("scenarioPresets") &&
    !prototypeTypesSource.includes("export function cloneScenario") &&
    !apiClientSource.includes("evaluateConfigurationRequest") &&
    !apiClientSource.includes("recommendConfigurationRequest") &&
    !assetLibraryApiSource.includes("getDefenseAsset(id") &&
    !enterpriseApiSource.includes("getEnterprise(id") &&
    !mockDefenseRepositorySource.includes("getThreatRoutes") &&
    !mockDefenseRepositorySource.includes("getHexCells") &&
    !variantSelectorSource.includes("function VariantSelector") &&
    !defenseAssetLibrarySource.includes("getDefenseAssetById") &&
    !defenseCatalogSource.includes("getDefenseItemByCalculatorAssetId") &&
    !defenseConfigurationSource.includes("calculateTotalUnits") &&
    !defenseConfigurationSource.includes("calculateTotalPositions") &&
    !defenseConfigurationSource.includes("calculateCostByEchelon") &&
    !defenseConfigurationSource.includes("calculateCoverageByEchelon") &&
    !defenseConfigurationSource.includes("calculatePriorityList") &&
    !defenseConfigurationSource.includes("calculateBudgetSelection") &&
    !defenseConfigurationSource.includes("calculatorAssetIdToDefenseItemId"),
  "Confirmed unused exports must be removed instead of kept as public surface",
);

console.log("react-doctor-maintainability-contract.test.mjs: module-scope contracts passed");
