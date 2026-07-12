import {
  createRingLayer,
  getLayerRadii,
  type LayerInsertOption,
  updateLayerGeometryFromRadii,
  updateLayerGeometryFromPolygon,
} from "@/shared/lib/defense-project";
import { getPolygonCoordinates } from "@/shared/lib/defense-layer-geometry";
import type { CoordinatePlacementInput } from "@/modules/drone-defense/ui/coordinate-placement-panel";
import type { DefenseLayer } from "@/shared/types/drone-defense";
import type { Coordinates, DefenseProject, EditableDefenseLayer, PlacementValidationResult } from "@/shared/types/defense-project";

export type LayerWizardDraft = {
  name: string;
  code: string;
  innerRadiusM: number;
  widthM: number;
  geometryMode: "circle" | "polygon";
  polygonCoordinates: Coordinates[];
  polygonClosed: boolean;
};

export type LayerWizardState = {
  mode: "create" | "edit";
  layerId?: string;
  insertPosition?: string;
  draft: LayerWizardDraft;
};

export type CoordinatePlacementValidationState = Pick<PlacementValidationResult, "level" | "message">;

type CoordinatePlacementParseResult =
  | { ok: true; coordinates: Coordinates; notes?: string }
  | { ok: false; message: string };

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })} км`;
  }
  return `${Math.round(meters).toLocaleString("ru-RU")} м`;
}

function formatDistanceValue(meters: number, unit: "m" | "km"): string {
  if (unit === "km") {
    return (meters / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 });
  }
  return Math.round(meters).toLocaleString("ru-RU");
}

export function formatLayerRange(innerRadiusM: number, outerRadiusM: number): string {
  const unit: "m" | "km" = outerRadiusM >= 1000 ? "km" : "m";
  return `${formatDistanceValue(innerRadiusM, unit)}–${formatDistanceValue(outerRadiusM, unit)} ${unit === "km" ? "км" : "м"}`;
}

export function formatWizardRange(option: LayerInsertOption): string {
  const min = formatDistance(option.minInnerRadiusM);
  if (option.maxOuterRadiusM === null) return `от ${min}`;
  return `${min}-${formatDistance(option.maxOuterRadiusM)}`;
}

export function layerInsertOptionKey(option: LayerInsertOption): string {
  if (option.kind === "outside") return "outside";
  if (option.kind === "inside") return "inside";
  return `between:${option.beforeLayerId}:${option.afterLayerId}`;
}

export function buildWizardLayer(
  project: DefenseProject,
  draft: LayerWizardDraft,
  baseLayer?: EditableDefenseLayer,
): EditableDefenseLayer {
  if (draft.geometryMode === "polygon") {
    const base =
      baseLayer ??
      createRingLayer(project, {
        name: draft.name,
        code: draft.code,
        innerRadiusM: draft.innerRadiusM,
        widthM: draft.widthM,
        isActive: true,
      });
    return {
      ...updateLayerGeometryFromPolygon(base, draft.polygonCoordinates, draft.polygonClosed),
      name: draft.name,
      code: draft.code,
    };
  }

  if (baseLayer) {
    return {
      ...updateLayerGeometryFromRadii(baseLayer, {
        innerRadiusM: draft.innerRadiusM,
        widthM: draft.widthM,
      }),
      name: draft.name,
      code: draft.code,
    };
  }

  return createRingLayer(project, {
    name: draft.name,
    code: draft.code,
    innerRadiusM: draft.innerRadiusM,
    widthM: draft.widthM,
    isActive: true,
  });
}

export function projectLayerToMapLayer(layer: EditableDefenseLayer): DefenseLayer {
  const radii = getLayerRadii(layer);
  const polygonGeometry =
    layer.geometry.type === "polygon"
      ? {
          type: "polygon" as const,
          coordinates: getPolygonCoordinates(layer.geometry),
          isClosed: layer.geometry.isClosed,
        }
      : undefined;
  return {
    id: layer.id as DefenseLayer["id"],
    order: layer.order,
    name: layer.name,
    shortName: layer.code,
    defaultWeight: 1,
    color: layer.color,
    opacity: layer.opacity,
    distanceBandM: {
      min: radii.innerRadiusM,
      max: radii.outerRadiusM,
      label: polygonGeometry ? "Произвольный контур" : formatLayerRange(radii.innerRadiusM, radii.outerRadiusM),
    },
    ...(polygonGeometry ? { geometry: polygonGeometry } : {}),
  };
}

export function parseCoordinatePlacementInput(input: CoordinatePlacementInput): CoordinatePlacementParseResult {
  const lat = parseDecimal(input.lat);
  const lng = parseDecimal(input.lng);
  const altitudeText = input.altitude.trim();
  const altitude = altitudeText ? parseDecimal(altitudeText) : undefined;
  const notes = input.notes.trim();

  if (lat === null) return { ok: false, message: "Введите корректную широту." };
  if (lng === null) return { ok: false, message: "Введите корректную долготу." };
  if (lat < -90 || lat > 90) return { ok: false, message: "Широта должна быть в диапазоне от -90 до 90." };
  if (lng < -180 || lng > 180) return { ok: false, message: "Долгота должна быть в диапазоне от -180 до 180." };
  if (altitudeText && altitude === null) return { ok: false, message: "Введите корректную высоту." };

  return {
    ok: true,
    coordinates: {
      lat,
      lng,
      ...(altitude === undefined || altitude === null ? {} : { altitude }),
    },
    ...(notes ? { notes } : {}),
  };
}

function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
