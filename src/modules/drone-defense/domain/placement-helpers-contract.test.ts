import { describePlacement, placementStatus, getMarkerState, buildSectorPolygon, getCoverageShape, getCoverageShapes, screenPointToSlot } from "@/modules/drone-defense/domain/placement-helpers";
import {
  buildCatalogPlacement,
  buildCatalogResponse,
  buildScenarioConfiguration,
  defenseLayers,
  facilities,
} from "@/modules/drone-defense/infra/mock-defense-data";
import { buildEchelonMapModel } from "@/modules/drone-defense/domain/echelon-map-model";
import type { Placement } from "@/shared/types/drone-defense";

const catalog = buildCatalogResponse();
const facility = facilities[0];

const placement = buildCatalogPlacement({
  facilityId: facility.id,
  scenarioId: "balanced",
  groupId: "l2-radar",
  slotId: "layer_02_detection-slot-01",
});

const summary = describePlacement({ placement, catalog, layers: defenseLayers });

if (summary.name !== "РЛС") {
  throw new Error(`describePlacement must use the catalog group name; got ${summary.name}`);
}
if (summary.echelonShortName !== "L2") {
  throw new Error(`describePlacement must resolve the echelon short name; got ${summary.echelonShortName}`);
}
if (summary.qty !== 1) {
  throw new Error(`describePlacement must report qty; got ${summary.qty}`);
}
if (summary.costRub !== 42_000_000) {
  throw new Error(`describePlacement must compute cost = capex * qty; got ${summary.costRub}`);
}
// fixture placement has readiness 0.72 → "ready"
if (summary.status !== "ready") {
  throw new Error(`describePlacement must return "ready" for readiness 0.72; got ${summary.status}`);
}

if (placementStatus(0.05) !== "inactive") throw new Error("0.05 must be inactive (inclusive floor)");
if (placementStatus(0.04) !== "inactive") throw new Error("0.04 must be inactive");
if (placementStatus(0.39) !== "warning") throw new Error("0.39 must be warning");
if (placementStatus(0.4) !== "ready") throw new Error("0.40 must be ready (exclusive upper)");
if (placementStatus(0.72) !== "ready") throw new Error("0.72 must be ready");

const readyPlacement = buildCatalogPlacement({
  facilityId: facility.id,
  scenarioId: "balanced",
  groupId: "l2-optical",
  slotId: "layer_02_detection-slot-02",
});

// default: placed, healthy, not selected/hovered
if (getMarkerState({ placement: readyPlacement, selectedPlacementId: null, hoveredPlacementId: null, isDuplicateInSlot: false }) !== "default") {
  throw new Error("a healthy unselected placement must be in the default state");
}

// hover beats default
if (getMarkerState({ placement: readyPlacement, selectedPlacementId: null, hoveredPlacementId: readyPlacement.id, isDuplicateInSlot: false }) !== "hover") {
  throw new Error("hover must override default");
}

// selected beats everything
if (getMarkerState({ placement: readyPlacement, selectedPlacementId: readyPlacement.id, hoveredPlacementId: readyPlacement.id, isDuplicateInSlot: true }) !== "selected") {
  throw new Error("selected must win over conflict, warning, hover");
}

// conflict beats warning/inactive/hover when not selected
const conflictPlacement = { ...readyPlacement, readiness: 0.2 };
if (getMarkerState({ placement: conflictPlacement, selectedPlacementId: null, hoveredPlacementId: conflictPlacement.id, isDuplicateInSlot: true }) !== "conflict") {
  throw new Error("conflict must win over warning and hover");
}

// conflict must win even over inactive (near-zero readiness)
const deadConflictPlacement = { ...readyPlacement, readiness: 0 };
if (getMarkerState({ placement: deadConflictPlacement, selectedPlacementId: null, hoveredPlacementId: null, isDuplicateInSlot: true }) !== "conflict") {
  throw new Error("conflict must win over inactive");
}

// warning from low readiness
const warnPlacement = { ...readyPlacement, readiness: 0.2 };
if (getMarkerState({ placement: warnPlacement, selectedPlacementId: null, hoveredPlacementId: null, isDuplicateInSlot: false }) !== "warning") {
  throw new Error("low readiness must yield warning");
}

// inactive from near-zero readiness
const offPlacement = { ...readyPlacement, readiness: 0 };
if (getMarkerState({ placement: offPlacement, selectedPlacementId: null, hoveredPlacementId: null, isDuplicateInSlot: false }) !== "inactive") {
  throw new Error("near-zero readiness must yield inactive");
}

// --- Task 3: buildSectorPolygon + getCoverageShape ---

const center = { lon: facility.center.lon, lat: facility.center.lat };
const ring = buildSectorPolygon({ center, azimuthDeg: 0, halfAngleDeg: 45, radiusM: 1000, segments: 16 });

if (ring.length < 4) {
  throw new Error(`sector polygon must have an apex and arc points; got ${ring.length}`);
}
const apex = ring[0];
if (Math.abs(apex[0] - center.lon) > 1e-9 || Math.abs(apex[1] - center.lat) > 1e-9) {
  throw new Error("sector polygon must start at the center apex");
}
const last = ring[ring.length - 1];
if (apex[0] === last[0] && apex[1] === last[1]) {
  throw new Error("sector ring must not duplicate the apex as its last point");
}

// detection/optical assets default to a sector coverage
const radarShape = getCoverageShape(readyPlacement); // readyPlacement is l2-optical (detection)
if (radarShape.kind !== "sector") {
  throw new Error(`detection/optical assets should default to a sector coverage; got ${radarShape.kind}`);
}

const mogPlacement: Placement = {
  ...readyPlacement,
  compoundProfile: {
    kind: "compound-post",
    postType: "МОГ",
    personnelCount: "4",
    accountability: "МО",
    armament: "Автомат/пулемёт/ПБС",
    weaponUnits: "2",
    sectorOrRange: "до 4–8 км, сектор 90–360°",
    weapons: [
      { id: "firearms", label: "Огнестрел", quantity: "2", rangeM: 8000, coverageAzimuth: 25, coverageSectorWidthDeg: 140 },
      { id: "antiDroneRifles", label: "Антидроновые ружья", quantity: "1", rangeM: 2000, coverageAzimuth: 225, coverageSectorWidthDeg: 60 },
      { id: "interceptorDrones", label: "Дроны-перехватчики", quantity: "0", rangeM: 5000, coverageAzimuth: 315, coverageSectorWidthDeg: 30 },
    ],
    coverageWeaponId: "antiDroneRifles",
    visibleCoverageWeaponIds: ["firearms", "antiDroneRifles"],
    sectorWidthDeg: 180,
    azimuth: 180,
  },
};
const mogShape = getCoverageShape(mogPlacement);
if (mogShape.kind !== "sector") {
  throw new Error(`МOГ placement should be rendered as sector coverage; got ${mogShape.kind}`);
}
if (mogShape.radiusM !== 2000) {
  throw new Error(`МОГ range should come from selected weapon as 2000m; got ${mogShape.radiusM}`);
}
if (mogShape.halfAngleDeg !== 30) {
  throw new Error(`МОГ coverage should use selected weapon half-angle 30°, got ${mogShape.halfAngleDeg}`);
}
if (mogShape.azimuthDeg !== 225) {
  throw new Error(`МОГ coverage must use selected weapon azimuth; got ${mogShape.azimuthDeg}`);
}

const mogShapes = getCoverageShapes(mogPlacement);
if (mogShapes.length !== 2) {
  throw new Error(`МОГ placement should expose two visible coverage shapes; got ${mogShapes.length}`);
}
if (mogShapes[0]?.id !== `mog-coverage:${mogPlacement.id}:firearms`) {
  throw new Error(`longest МОГ coverage should render first; got ${mogShapes[0]?.id}`);
}
if (mogShapes[1]?.id !== `mog-coverage:${mogPlacement.id}:antiDroneRifles`) {
  throw new Error(`second МОГ coverage should use antiDroneRifles; got ${mogShapes[1]?.id}`);
}
if (mogShapes.some((shape) => shape.kind !== "sector")) {
  throw new Error("МОГ multi coverage should render all visible weapons as sector shapes");
}
const firearmsShape = mogShapes[0];
const antiDroneShape = mogShapes[1];
if (firearmsShape?.kind !== "sector" || antiDroneShape?.kind !== "sector") {
  throw new Error("МОГ visible coverage shapes must stay sector-based for orientation checks");
}
if (firearmsShape.azimuthDeg !== 25 || firearmsShape.halfAngleDeg !== 70) {
  throw new Error(`firearms coverage must keep its own orientation; got ${firearmsShape.azimuthDeg} / ${firearmsShape.halfAngleDeg}`);
}
if (antiDroneShape.azimuthDeg !== 225 || antiDroneShape.halfAngleDeg !== 30) {
  throw new Error(`antiDroneRifles coverage must keep its own orientation; got ${antiDroneShape.azimuthDeg} / ${antiDroneShape.halfAngleDeg}`);
}

const mogWithoutAvailableWeapons: Placement = {
  ...mogPlacement,
  compoundProfile: {
    ...mogPlacement.compoundProfile!,
    visibleCoverageWeaponIds: ["firearms", "interceptorDrones"],
    weapons: mogPlacement.compoundProfile!.weapons?.map((weapon) => ({ ...weapon, quantity: "0" })),
  },
};
if (getCoverageShape(mogWithoutAvailableWeapons).kind !== "none") {
  throw new Error("МОГ coverage must be hidden when every weapon quantity is 0");
}
if (getCoverageShapes(mogWithoutAvailableWeapons).length !== 0) {
  throw new Error("МОГ multi coverage helper must return no shapes when every weapon quantity is 0");
}

// kinetic group -> circle
const kineticPlacement = buildCatalogPlacement({
  facilityId: facility.id,
  scenarioId: "balanced",
  groupId: "l6-barrel",
});
if (getCoverageShape(kineticPlacement).kind !== "circle") {
  throw new Error("kinetic assets should default to a circle coverage");
}

// --- Task 4: screenPointToSlot ---

const emptyConfig = buildScenarioConfiguration(facility.id, "balanced", []);
const dropModel = buildEchelonMapModel({
  facility,
  layers: defenseLayers,
  layerCoverage: null,
  configuration: emptyConfig,
  catalog,
  selectedLayerId: "layer_02_detection",
});
const detectionSlots = dropModel.slots.filter((slot) => slot.layerId === "layer_02_detection");
const target = detectionSlots[0];

const hit = screenPointToSlot({
  lon: target.position[0],
  lat: target.position[1],
  activeLayerId: "layer_02_detection",
  slots: dropModel.slots,
  maxDistanceM: 5000,
});
if (hit?.id !== target.id) {
  throw new Error(`screenPointToSlot must snap to the nearest active-echelon slot; got ${hit?.id}`);
}

const miss = screenPointToSlot({
  lon: target.position[0] + 5,
  lat: target.position[1] + 5,
  activeLayerId: "layer_02_detection",
  slots: dropModel.slots,
  maxDistanceM: 5000,
});
if (miss !== null) {
  throw new Error("a drop far from any slot must resolve to null");
}

const wrongLayer = screenPointToSlot({
  lon: target.position[0],
  lat: target.position[1],
  activeLayerId: "layer_09_hardening",
  slots: dropModel.slots,
  maxDistanceM: 5000,
});
// the point sits on a detection slot, but the active echelon is hardening:
// no detection slot may leak through, and hardening slots are too far → null
if (wrongLayer !== null) {
  throw new Error("screenPointToSlot must never return a slot from a non-active echelon");
}
