export type EchelonVisibilityMode = "auto" | "muted" | "hidden";

export type EchelonInteractionMode = "overview" | "placement" | "coverage-edit";

export type EchelonVisualStyle = {
  fillAlpha: number;
  strokeAlpha: number;
  strokeWidth: number;
  hoverEnabled: boolean;
  pickable: boolean;
};

type EchelonVisualPreset = Omit<EchelonVisualStyle, "hoverEnabled" | "pickable">;

const OVERVIEW_ACTIVE: EchelonVisualPreset = {
  fillAlpha: 18,
  strokeAlpha: 140,
  strokeWidth: 2.5,
};

const OVERVIEW_INACTIVE: EchelonVisualPreset = {
  fillAlpha: 8,
  strokeAlpha: 56,
  strokeWidth: 1.5,
};

const PLACEMENT_ACTIVE: EchelonVisualPreset = {
  fillAlpha: 12,
  strokeAlpha: 105,
  strokeWidth: 2,
};

const PLACEMENT_INACTIVE: EchelonVisualPreset = {
  fillAlpha: 2,
  strokeAlpha: 24,
  strokeWidth: 1.25,
};

const MUTED_ACTIVE: EchelonVisualPreset = {
  fillAlpha: 10,
  strokeAlpha: 92,
  strokeWidth: 1.75,
};

const MUTED_INACTIVE: EchelonVisualPreset = {
  fillAlpha: 4,
  strokeAlpha: 40,
  strokeWidth: 1.25,
};

const OUTLINE_ONLY_ACTIVE: EchelonVisualPreset = {
  fillAlpha: 0,
  strokeAlpha: 82,
  strokeWidth: 1.5,
};

const OUTLINE_ONLY_INACTIVE: EchelonVisualPreset = {
  fillAlpha: 0,
  strokeAlpha: 34,
  strokeWidth: 1,
};

const COVERAGE_FOCUS_ACTIVE: EchelonVisualPreset = {
  fillAlpha: 0,
  strokeAlpha: 38,
  strokeWidth: 1,
};

const HIDDEN: EchelonVisualPreset = {
  fillAlpha: 0,
  strokeAlpha: 0,
  strokeWidth: 0,
};

type EchelonVisualPresetName =
  | "overview"
  | "placement"
  | "muted"
  | "outline-only"
  | "coverage-focus"
  | "hidden";

export function getEchelonInteractionMode({
  activeToolId,
  coordinatePlacementAssetId,
  isCoverageEditorOpen,
  pointerDraggedAssetId,
  selectedPlacementId,
}: {
  activeToolId: string | null;
  coordinatePlacementAssetId: string | null;
  isCoverageEditorOpen: boolean;
  pointerDraggedAssetId: string | null;
  selectedPlacementId: string | null;
}): EchelonInteractionMode {
  if (isCoverageEditorOpen && selectedPlacementId) return "coverage-edit";
  if (activeToolId || coordinatePlacementAssetId || pointerDraggedAssetId) return "placement";
  return "overview";
}

function resolvePreset({
  visibilityMode,
  interactionMode,
  zoom,
}: {
  visibilityMode: EchelonVisibilityMode;
  interactionMode: EchelonInteractionMode;
  zoom: number;
}): EchelonVisualPresetName {
  if (visibilityMode === "hidden") return "hidden";
  if (visibilityMode === "muted") return "muted";
  if (interactionMode === "coverage-edit") return "coverage-focus";
  if (zoom > 13) return "outline-only";
  if (interactionMode === "placement") return "placement";
  if (zoom > 10) return "muted";
  return "overview";
}

function getPresetStyle(preset: EchelonVisualPresetName, isActive: boolean): EchelonVisualPreset {
  switch (preset) {
    case "overview":
      return isActive ? OVERVIEW_ACTIVE : OVERVIEW_INACTIVE;
    case "placement":
      return isActive ? PLACEMENT_ACTIVE : PLACEMENT_INACTIVE;
    case "muted":
      return isActive ? MUTED_ACTIVE : MUTED_INACTIVE;
    case "outline-only":
      return isActive ? OUTLINE_ONLY_ACTIVE : OUTLINE_ONLY_INACTIVE;
    case "coverage-focus":
      return isActive ? COVERAGE_FOCUS_ACTIVE : HIDDEN;
    case "hidden":
      return HIDDEN;
  }
}

export function getEchelonVisualStyle({
  visibilityMode,
  interactionMode,
  zoom,
  isActive,
  isHovered,
}: {
  visibilityMode: EchelonVisibilityMode;
  interactionMode: EchelonInteractionMode;
  zoom: number;
  isActive: boolean;
  isHovered: boolean;
}): EchelonVisualStyle {
  const preset = resolvePreset({ visibilityMode, interactionMode, zoom });
  const hoverEnabled = visibilityMode !== "hidden" && isActive;
  const pickable = preset !== "hidden" && !(preset === "coverage-focus" && !isActive);
  const baseStyle = getPresetStyle(preset, isActive);

  if (!hoverEnabled || !isHovered) {
    return {
      ...baseStyle,
      hoverEnabled,
      pickable,
    };
  }

  return {
    fillAlpha: Math.min(255, baseStyle.fillAlpha + 6),
    strokeAlpha: Math.min(255, baseStyle.strokeAlpha + (preset === "coverage-focus" ? 18 : 28)),
    strokeWidth: Number((baseStyle.strokeWidth + (preset === "coverage-focus" ? 0.25 : 1)).toFixed(2)),
    hoverEnabled,
    pickable,
  };
}
