import {
  createRingLayer,
  getLayerRadii,
  placeObjectInProject,
  type LayerInsertOption,
  updateLayerGeometryFromRadii,
  updateLayerGeometryFromPolygon,
} from "@/shared/lib/defense-project";
import { getPolygonCoordinates } from "@/shared/lib/defense-layer-geometry";
import type { CoordinatePlacementInput } from "@/modules/drone-defense/ui/coordinate-placement-panel";
import type { DefenseLayer } from "@/shared/types/drone-defense";
import type {
  Coordinates,
  DefenseProject,
  EditableDefenseLayer,
  PlacedDefenseObject,
  PlacementValidationResult,
} from "@/shared/types/defense-project";

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

type PrototypeDemoSeed = {
  id: string;
  assetId: string;
  layerCode: string;
  name: string;
  eastM: number;
  northM: number;
  patch?: Partial<PlacedDefenseObject>;
};

const prototypeDemoSeeds: PrototypeDemoSeed[] = [
  {
    id: "demo-mog-post-1",
    assetId: "l5-mobile-fire",
    layerCode: "L5",
    name: "МОГ — пост №1",
    eastM: -2300,
    northM: -4300,
    patch: {
      status: "active",
      quantity: 1,
      rotation: 225,
      customCoverageAngle: 90,
      customCoverageRadius: 8000,
      notes: "Сектор прикрывает юго-западный подход к периметру.",
    },
  },
  {
    id: "demo-mog-post-2",
    assetId: "l5-mobile-fire",
    layerCode: "L5",
    name: "МОГ — пост №2",
    eastM: 2500,
    northM: -3900,
    patch: {
      status: "planned",
      quantity: 1,
      rotation: 245,
      customCoverageAngle: 90,
      customCoverageRadius: 8000,
      hasGeometryConflict: true,
      hasCoverageConflict: true,
      notes: "Проверить пересечение сектора с соседним постом.",
    },
  },
  {
    id: "demo-ew-west",
    assetId: "ew-narrowband",
    layerCode: "L4",
    name: "РЭБ — западный сектор",
    eastM: -5200,
    northM: 900,
    patch: {
      status: "active",
      quantity: 1,
      rotation: 265,
      customCoverageAngle: 100,
      customCoverageRadius: 10000,
    },
  },
  {
    id: "demo-gps-north",
    assetId: "l4-gps-spoof",
    layerCode: "L4",
    name: "GPS — северный ложный контур",
    eastM: 3600,
    northM: 3100,
    patch: {
      status: "active",
      quantity: 1,
      rotation: 30,
      customCoverageAngle: 120,
      customCoverageRadius: 6000,
    },
  },
  {
    id: "demo-radar-east",
    assetId: "mobile-radar",
    layerCode: "L2",
    name: "РЛС — мобильная позиция",
    eastM: 6100,
    northM: 1200,
    patch: {
      status: "active",
      quantity: 1,
      customCoverageRadius: 75000,
    },
  },
  {
    id: "demo-thermal-south",
    assetId: "l2-thermal",
    layerCode: "L3",
    name: "ТВ — тепловизионный пост",
    eastM: 1200,
    northM: -5900,
    patch: {
      status: "active",
      quantity: 1,
      rotation: 180,
      customCoverageAngle: 60,
      customCoverageRadius: 9000,
    },
  },
];

const prototypeDemoConflictIds = new Set(
  prototypeDemoSeeds
    .filter((seed) => seed.patch?.hasCoverageConflict || seed.patch?.hasGeometryConflict || seed.patch?.hasTerrainConflict)
    .map((seed) => seed.id),
);

function normalizePrototypeDemoConflictFlags(project: DefenseProject): DefenseProject {
  let changed = false;
  const placedObjects = project.placedObjects.map((object) => {
    if (!prototypeDemoConflictIds.has(object.id)) return object;
    if (object.hasCoverageConflict && object.hasGeometryConflict) return object;
    changed = true;
    return {
      ...object,
      hasCoverageConflict: true,
      hasGeometryConflict: true,
    };
  });

  return changed ? { ...project, placedObjects } : project;
}

function offsetCoordinate(center: Coordinates, eastM: number, northM: number): Coordinates {
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng = Math.max(1, metersPerDegreeLat * Math.cos((center.lat * Math.PI) / 180));
  return {
    lat: center.lat + northM / metersPerDegreeLat,
    lng: center.lng + eastM / metersPerDegreeLng,
  };
}

export function resolvePrototypeSelectedObjectId(project: DefenseProject): string | null {
  if (project.selectedObjectId && project.placedObjects.some((object) => object.id === project.selectedObjectId)) {
    return project.selectedObjectId;
  }
  return project.placedObjects[0]?.id ?? null;
}

export function buildPrototypeDemoProject(project: DefenseProject): DefenseProject {
  if (project.placedObjects.length > 0) return normalizePrototypeDemoConflictFlags(project);

  let nextProject = project;
  for (const seed of prototypeDemoSeeds) {
    const layer = nextProject.layers.find((item) => item.code === seed.layerCode);
    const asset = nextProject.assetLibrary.find((item) => item.id === seed.assetId);
    if (!layer || !asset) continue;

    const coordinates = offsetCoordinate(nextProject.baseObject.center, seed.eastM, seed.northM);
    nextProject = placeObjectInProject(nextProject, seed.assetId, layer.id, coordinates, {
      id: seed.id,
      name: seed.name,
      ...(seed.patch ?? {}),
    });
  }

  const firstObject = nextProject.placedObjects[0];
  if (!firstObject) return project;

  const demoProject: DefenseProject = {
    ...nextProject,
    selectedObjectId: firstObject.id,
    selectedAssetId: firstObject.assetId,
    activeLayerId: firstObject.layerId,
    layers: nextProject.layers.map((layer) => ({ ...layer, isActive: layer.id === firstObject.layerId })),
  };

  return normalizePrototypeDemoConflictFlags(demoProject);
}

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
