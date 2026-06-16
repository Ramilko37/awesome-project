// Run: pnpm dlx tsx src/modules/drone-defense/domain/echelon-visibility.test.ts
import assert from "node:assert/strict";
import * as echelonVisibility from "@/modules/drone-defense/domain/echelon-visibility";

const { getEchelonVisualStyle } = echelonVisibility;

assert.equal(
  typeof echelonVisibility.getEchelonInteractionMode,
  "function",
  "echelon visibility must expose interaction mode helper",
);

const selectedPlacementWithoutCoverageEditor = echelonVisibility.getEchelonInteractionMode({
  activeToolId: null,
  coordinatePlacementAssetId: null,
  isCoverageEditorOpen: false,
  pointerDraggedAssetId: null,
  selectedPlacementId: "placement-1",
});
assert.equal(
  selectedPlacementWithoutCoverageEditor,
  "overview",
  "selecting an object without an open coverage editor must stay in overview mode",
);

const openCoverageEditorMode = echelonVisibility.getEchelonInteractionMode({
  activeToolId: null,
  coordinatePlacementAssetId: null,
  isCoverageEditorOpen: true,
  pointerDraggedAssetId: null,
  selectedPlacementId: "placement-1",
});
assert.equal(
  openCoverageEditorMode,
  "coverage-edit",
  "open coverage editor must force coverage-edit mode",
);

const draggingPlacementMode = echelonVisibility.getEchelonInteractionMode({
  activeToolId: null,
  coordinatePlacementAssetId: null,
  isCoverageEditorOpen: false,
  pointerDraggedAssetId: "mog-asset",
  selectedPlacementId: null,
});
assert.equal(
  draggingPlacementMode,
  "placement",
  "dragging a tool onto the map must enable placement mode",
);

const overviewActive = getEchelonVisualStyle({
  visibilityMode: "auto",
  interactionMode: "overview",
  zoom: 9,
  isActive: true,
  isHovered: false,
});
assert.deepEqual(overviewActive, {
  fillAlpha: 18,
  strokeAlpha: 140,
  strokeWidth: 2.5,
  hoverEnabled: true,
  pickable: true,
});

const overviewInactiveHovered = getEchelonVisualStyle({
  visibilityMode: "auto",
  interactionMode: "overview",
  zoom: 9,
  isActive: false,
  isHovered: true,
});
assert.deepEqual(overviewInactiveHovered, {
  fillAlpha: 8,
  strokeAlpha: 56,
  strokeWidth: 1.5,
  hoverEnabled: false,
  pickable: true,
});

const placementInactive = getEchelonVisualStyle({
  visibilityMode: "auto",
  interactionMode: "placement",
  zoom: 9,
  isActive: false,
  isHovered: false,
});
assert.deepEqual(placementInactive, {
  fillAlpha: 2,
  strokeAlpha: 24,
  strokeWidth: 1.25,
  hoverEnabled: false,
  pickable: true,
});

const zoomMutedActive = getEchelonVisualStyle({
  visibilityMode: "auto",
  interactionMode: "overview",
  zoom: 12,
  isActive: true,
  isHovered: false,
});
assert.deepEqual(zoomMutedActive, {
  fillAlpha: 10,
  strokeAlpha: 92,
  strokeWidth: 1.75,
  hoverEnabled: true,
  pickable: true,
});

const zoomOutlineOnlyInactive = getEchelonVisualStyle({
  visibilityMode: "auto",
  interactionMode: "overview",
  zoom: 14,
  isActive: false,
  isHovered: false,
});
assert.deepEqual(zoomOutlineOnlyInactive, {
  fillAlpha: 0,
  strokeAlpha: 34,
  strokeWidth: 1,
  hoverEnabled: false,
  pickable: true,
});

const coverageFocusInactive = getEchelonVisualStyle({
  visibilityMode: "auto",
  interactionMode: "coverage-edit",
  zoom: 9,
  isActive: false,
  isHovered: false,
});
assert.deepEqual(coverageFocusInactive, {
  fillAlpha: 0,
  strokeAlpha: 0,
  strokeWidth: 0,
  hoverEnabled: false,
  pickable: false,
});

const forcedMutedInCoverage = getEchelonVisualStyle({
  visibilityMode: "muted",
  interactionMode: "coverage-edit",
  zoom: 16,
  isActive: false,
  isHovered: false,
});
assert.deepEqual(forcedMutedInCoverage, {
  fillAlpha: 4,
  strokeAlpha: 40,
  strokeWidth: 1.25,
  hoverEnabled: false,
  pickable: true,
});

const hiddenActive = getEchelonVisualStyle({
  visibilityMode: "hidden",
  interactionMode: "overview",
  zoom: 9,
  isActive: true,
  isHovered: true,
});
assert.deepEqual(hiddenActive, {
  fillAlpha: 0,
  strokeAlpha: 0,
  strokeWidth: 0,
  hoverEnabled: false,
  pickable: false,
});

console.log("echelon-visibility.test.ts: OK");
